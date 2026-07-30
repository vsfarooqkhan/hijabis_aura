-- ============================================================================
-- Hijabisaura — 0002: row level security + server-side operations
--
-- Run this second. Until it has run, every table created by 0001 is exposed to
-- anyone holding the publishable key — which is everyone, because that key
-- ships inside the JavaScript bundle.
--
-- The model:
--   anon           can read published products, collections, reviews and public
--                  settings. It CANNOT read orders, customers or coupons, and
--                  cannot write anything at all.
--   admin          full read/write, identified by a row in public.admins.
--   guest actions  go through security-definer functions below, so the server
--                  decides prices, stock and what an order costs.
--
-- Anything a guest needs to *do* is a function, not a table grant. That is what
-- stops a customer setting their own total to ₹1.
-- ============================================================================

-- ------------------------------------------------------- table privileges ---
--
-- Supabase grants anon and authenticated broad privileges on public tables by
-- default and relies on RLS alone to restrain them. That works, but it means a
-- single mistaken policy is the only thing between a stranger and your orders
-- table. So privileges are set explicitly here instead:
--
--   anon           SELECT only, and only on storefront tables. It has no INSERT,
--                  UPDATE or DELETE grant anywhere, so a bad policy still cannot
--                  let a visitor write.
--   authenticated  full DML, restrained to admins by the policies below. A
--                  signed-in non-admin sees nothing, because every policy tests
--                  is_admin().
--
-- Grants and RLS are AND-ed: you need both to touch a row.
grant usage on schema public to anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.colorways, public.collections, public.products,
  public.product_colorways, public.product_images,
  public.reviews, public.store_settings
to anon, authenticated;

-- No grant of any kind to anon on coupons, orders, order_items, customers or
-- admins. Everything a guest legitimately needs from those goes through one of
-- the security-definer functions at the bottom of this file.
grant select, insert, update, delete on
  public.colorways, public.collections, public.products,
  public.product_colorways, public.product_images,
  public.customers, public.coupons, public.orders,
  public.order_items, public.reviews, public.store_settings
to authenticated;

-- Only the service role (Supabase dashboard, or a trusted server) may add or
-- remove an admin. A stolen admin session cannot mint more admins.
grant select on public.admins to authenticated;

alter table public.colorways         enable row level security;
alter table public.collections       enable row level security;
alter table public.products          enable row level security;
alter table public.product_colorways enable row level security;
alter table public.product_images    enable row level security;
alter table public.customers         enable row level security;
alter table public.coupons           enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.reviews           enable row level security;
alter table public.store_settings    enable row level security;
alter table public.admins            enable row level security;

-- ------------------------------------------------------------- admin check ---

-- security definer so it can read public.admins regardless of the caller's own
-- policies; search_path pinned so it cannot be tricked by a shadowed table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------ public reads ---

-- The dye card is a colour list. Nothing sensitive, and the storefront needs it
-- before a product is even chosen.
drop policy if exists colorways_read on public.colorways;
create policy colorways_read on public.colorways
  for select using (true);

drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections
  for select using (published or public.is_admin());

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (published or public.is_admin());

-- Child rows follow their parent's visibility: an unpublished draft must not
-- leak its stock levels or images.
drop policy if exists product_colorways_read on public.product_colorways;
create policy product_colorways_read on public.product_colorways
  for select using (exists (
    select 1 from public.products p
    where p.id = product_id and (p.published or public.is_admin())
  ));

drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images
  for select using (exists (
    select 1 from public.products p
    where p.id = product_id and (p.published or public.is_admin())
  ));

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select using (published or public.is_admin());

drop policy if exists store_settings_read on public.store_settings;
create policy store_settings_read on public.store_settings
  for select using (is_public or public.is_admin());

-- Deliberately NO public read on coupons: it would let anyone list every
-- discount code you have. Validation goes through validate_coupon() instead.
--
-- Deliberately NO public read on orders, order_items or customers: order
-- lookup goes through track_order(), which requires the matching contact.

-- ----------------------------------------------------------- admin writes ---

do $$
declare t text;
begin
  foreach t in array array[
    'colorways','collections','products','product_colorways','product_images',
    'customers','coupons','orders','order_items','reviews','store_settings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all
         using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t);
  end loop;
end;
$$;

-- Admins may see who else is an admin, but only the service role (used from a
-- trusted server or the Supabase dashboard) can add or remove one. This stops a
-- compromised admin session from silently minting more admins.
drop policy if exists admins_read on public.admins;
create policy admins_read on public.admins
  for select using (public.is_admin());

-- ============================================================================
-- Guest operations
-- ============================================================================

-- ------------------------------------------------------- coupon validation ---

-- Returns only what the cart needs to display, never the coupon row itself.
create or replace function public.validate_coupon(p_code text, p_subtotal int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c coupons;
begin
  select * into c from coupons
  where code = upper(trim(p_code))
    and active
    and (expires_at is null or expires_at > now())
    and (usage_cap is null or uses < usage_cap);

  if not found then
    return jsonb_build_object('ok', false,
      'message', 'That code is not active. Check the spelling?');
  end if;

  if p_subtotal < c.min_order then
    return jsonb_build_object('ok', false,
      'message', format('%s needs a subtotal of ₹%s.', c.code, c.min_order));
  end if;

  return jsonb_build_object(
    'ok', true, 'code', c.code, 'kind', c.kind, 'value', c.value,
    'message', format('%s applied.', c.code));
end;
$$;

revoke all on function public.validate_coupon(text, int) from public;
grant execute on function public.validate_coupon(text, int) to anon, authenticated;

-- -------------------------------------------------------------- placing an ---
-- ---------------------------------------------------------------- order -----

-- The client sends items, an address and a payment choice. It does NOT send
-- prices — every figure is recomputed here from the products table and the
-- store settings. Stock is locked and decremented in the same transaction, so
-- two people buying the last piece cannot both succeed.
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay      jsonb;
  v_ship     jsonb;
  v_item     jsonb;
  v_product  products;
  v_cw       product_colorways;
  v_cwname   text;
  v_cwhex    text;
  v_image    text;
  v_qty      int;
  v_method   text := coalesce(payload->>'payment_method', 'cod');
  v_speed    text := coalesce(payload->>'shipping_speed', 'standard');
  v_subtotal int := 0;
  v_shipping int := 0;
  v_cod_fee  int := 0;
  v_coupon_d int := 0;
  v_prepaid  int := 0;
  v_freeship boolean := false;
  v_coupon   coupons;
  v_order_id text;
  v_status   text;
  v_cust_id  uuid;
  v_email    text := lower(trim(payload->>'customer_email'));
begin
  if v_method not in ('cod','upi') then
    raise exception 'Unknown payment method';
  end if;
  if v_speed not in ('standard','express') then
    raise exception 'Unknown shipping speed';
  end if;
  if jsonb_typeof(payload->'items') <> 'array'
     or jsonb_array_length(payload->'items') = 0 then
    raise exception 'Your bag is empty';
  end if;

  select value into v_pay  from store_settings where key = 'payments';
  select value into v_ship from store_settings where key = 'shipping';
  if v_pay is null or v_ship is null then
    raise exception 'Store settings are missing — cannot price an order';
  end if;

  -- Pass 1: validate and price. Rows are locked so stock cannot move underneath.
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product from products
    where id = v_item->>'product_id' and published;
    if not found then
      raise exception 'That product is no longer available';
    end if;

    select * into v_cw from product_colorways
    where product_id = v_product.id
      and colorway_code = v_item->>'colorway_code'
    for update;
    if not found then
      raise exception 'That colourway is no longer available';
    end if;
    if v_cw.stock < v_qty then
      raise exception 'Only % left of % in %',
        v_cw.stock, v_product.name, v_cw.colorway_code;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  -- Payment method effects.
  if v_method = 'cod' then
    if not coalesce((v_pay->>'codEnabled')::boolean, false) then
      raise exception 'Cash on delivery is not available right now';
    end if;
    if v_subtotal < (v_pay->>'codMinOrder')::int
       or v_subtotal > (v_pay->>'codMaxOrder')::int then
      raise exception 'Cash on delivery is only available between ₹% and ₹%',
        v_pay->>'codMinOrder', v_pay->>'codMaxOrder';
    end if;
    v_cod_fee := (v_pay->>'codFee')::int;
  else
    if not coalesce((v_pay->>'upiEnabled')::boolean, false) then
      raise exception 'UPI is not available right now';
    end if;
    v_prepaid := round(v_subtotal * (v_pay->>'prepaidDiscountPct')::numeric / 100);
  end if;

  -- Coupon, re-checked here rather than trusted from the client.
  if coalesce(payload->>'coupon_code', '') <> '' then
    select * into v_coupon from coupons
    where code = upper(trim(payload->>'coupon_code'))
      and active
      and (expires_at is null or expires_at > now())
      and (usage_cap is null or uses < usage_cap);

    if found and v_subtotal >= v_coupon.min_order then
      if v_coupon.kind = 'percent' then
        v_coupon_d := round(v_subtotal * v_coupon.value / 100.0);
      elsif v_coupon.kind = 'flat' then
        v_coupon_d := least(v_coupon.value, v_subtotal);
      else
        v_freeship := true;
      end if;
      update coupons set uses = uses + 1 where code = v_coupon.code;
    else
      v_coupon := null;
    end if;
  end if;

  -- Shipping. Express is always charged, even above the free threshold — it
  -- costs us the same on a ₹500 order as on a ₹5,000 one.
  v_freeship := v_freeship or v_subtotal >= (v_ship->>'freeAbove')::int;
  if v_speed = 'express' then
    v_shipping := (v_ship->>'expressFee')::int;
  elsif v_freeship then
    v_shipping := 0;
  else
    v_shipping := (v_ship->>'standardFee')::int;
  end if;

  -- A UPI order is not confirmed until a human has matched the reference
  -- against the bank statement, so it lands in the verification queue.
  v_status := case when v_method = 'upi' then 'pending_payment' else 'confirmed' end;
  v_order_id := 'HA' || nextval('order_number_seq')::text;

  -- Remember the shopper without creating an account.
  if v_email <> '' then
    select id into v_cust_id from customers where lower(email) = v_email;
    if v_cust_id is null then
      insert into customers (name, email, phone, marketing_opt_in)
      values (payload->>'customer_name', v_email, payload->>'customer_phone',
              coalesce((payload->>'marketing_opt_in')::boolean, false))
      returning id into v_cust_id;
    end if;
  end if;

  insert into orders (
    id, customer_id, status,
    customer_name, customer_email, customer_phone,
    ship_line1, ship_landmark, ship_city, ship_state, ship_pincode,
    payment_method, payment_paid, upi_ref,
    subtotal, shipping, cod_fee, discount, grand_total, coupon_code,
    shipping_speed, notes
  ) values (
    v_order_id, v_cust_id, v_status,
    payload->>'customer_name', v_email, payload->>'customer_phone',
    payload->>'ship_line1', coalesce(payload->>'ship_landmark',''),
    payload->>'ship_city', payload->>'ship_state', payload->>'ship_pincode',
    v_method, false, nullif(payload->>'upi_ref',''),
    v_subtotal, v_shipping, v_cod_fee,
    v_coupon_d + v_prepaid,
    greatest(0, v_subtotal + v_shipping + v_cod_fee - v_coupon_d - v_prepaid),
    v_coupon.code, v_speed, coalesce(payload->>'notes','')
  );

  -- Pass 2: write the snapshots and take the stock down.
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    v_qty := (v_item->>'qty')::int;
    select * into v_product from products where id = v_item->>'product_id';

    select cw.name, cw.hex into v_cwname, v_cwhex
    from colorways cw where cw.code = v_item->>'colorway_code';

    select url into v_image from product_images
    where product_id = v_product.id
      and colorway_code = v_item->>'colorway_code'
    order by sort_order limit 1;

    insert into order_items (
      order_id, product_id, product_name, product_slug,
      colorway_code, colorway_name, colorway_hex, image_url, unit_price, qty
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.slug,
      v_item->>'colorway_code', v_cwname, v_cwhex, v_image,
      v_product.price, v_qty
    );

    update product_colorways
    set stock = stock - v_qty
    where product_id = v_product.id
      and colorway_code = v_item->>'colorway_code';

    update products set sold = sold + v_qty where id = v_product.id;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'status', v_status,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'cod_fee', v_cod_fee,
    'discount', v_coupon_d + v_prepaid,
    'grand_total', greatest(0, v_subtotal + v_shipping + v_cod_fee - v_coupon_d - v_prepaid)
  );
end;
$$;

revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- --------------------------------------------------------- attaching a UTR ---

-- The customer submits their UPI reference after paying. They may set it once,
-- only while the order is still awaiting payment, and they cannot mark it paid —
-- that stays an admin action.
create or replace function public.submit_upi_reference(
  p_order_id text, p_email text, p_upi_ref text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  if p_upi_ref !~ '^[0-9]{12}$' then
    raise exception 'A UPI reference is 12 digits';
  end if;

  update orders
  set upi_ref = p_upi_ref
  where id = upper(trim(p_order_id))
    and lower(customer_email) = lower(trim(p_email))
    and status = 'pending_payment'
    and upi_ref is null;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'No order awaiting payment matches those details';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_upi_reference(text, text, text) from public;
grant execute on function public.submit_upi_reference(text, text, text) to anon, authenticated;

-- ------------------------------------------------------------ order lookup ---

-- Requires the order number AND a matching email or last-10 of the phone, so a
-- guessed order number alone does not expose someone's address.
create or replace function public.track_order(p_order_id text, p_contact text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  o orders;
  v_contact text := lower(trim(p_contact));
  v_digits  text := regexp_replace(coalesce(p_contact,''), '\D', '', 'g');
begin
  select * into o from orders
  where id = upper(trim(p_order_id))
    and (
      lower(customer_email) = v_contact
      or (length(v_digits) >= 10
          and right(regexp_replace(customer_phone, '\D', '', 'g'), 10)
              = right(v_digits, 10))
    );

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  return jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', o.id, 'status', o.status, 'created_at', o.created_at,
      'payment_method', o.payment_method, 'payment_paid', o.payment_paid,
      'subtotal', o.subtotal, 'shipping', o.shipping, 'cod_fee', o.cod_fee,
      'discount', o.discount, 'grand_total', o.grand_total,
      'courier', o.courier, 'awb', o.awb,
      'city', o.ship_city, 'state', o.ship_state, 'pincode', o.ship_pincode
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.product_name, 'slug', i.product_slug,
        'colorway_name', i.colorway_name, 'colorway_hex', i.colorway_hex,
        'image_url', i.image_url, 'unit_price', i.unit_price, 'qty', i.qty))
      from order_items i where i.order_id = o.id), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- ------------------------------------------------------- leaving a review ----

-- Reviews arrive unpublished and unverified. Nothing a stranger writes appears
-- on a product page until an admin approves it.
create or replace function public.submit_review(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rating int := (payload->>'rating')::int;
begin
  if v_rating is null or v_rating < 1 or v_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;
  if length(trim(coalesce(payload->>'body',''))) < 10 then
    raise exception 'Please write a little more';
  end if;
  if not exists (select 1 from products where id = payload->>'product_id' and published) then
    raise exception 'Unknown product';
  end if;

  insert into reviews (product_id, author, city, rating, title, body, colorway_code,
                       verified, published)
  values (payload->>'product_id',
          coalesce(nullif(trim(payload->>'author'),''), 'Anonymous'),
          coalesce(payload->>'city',''),
          v_rating,
          coalesce(payload->>'title',''),
          trim(payload->>'body'),
          nullif(payload->>'colorway_code',''),
          false, false);

  return jsonb_build_object('ok', true,
    'message', 'Thank you — we read every review before it goes up.');
end;
$$;

revoke all on function public.submit_review(jsonb) from public;
grant execute on function public.submit_review(jsonb) to anon, authenticated;
