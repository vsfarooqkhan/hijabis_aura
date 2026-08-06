-- ============================================================================
-- Hijabisaura — 0004: UPI only, standard shipping only
--
-- Two changes, both enforced server-side as well as in the interface:
--
--   1. Cash on delivery is switched off. place_order() already refuses COD when
--      payments.codEnabled is false, so flipping the flag is enough — a crafted
--      request cannot place a COD order behind the UI's back.
--
--   2. Express shipping gains its own flag, defaulting to off. The checkout shows
--      it as a disabled option so customers can see it is coming; the function
--      quietly downgrades any express request to standard while it is off, so
--      nobody is charged ₹199 for a service that is not running.
--
-- Safe to run more than once.
-- ============================================================================

-- 1. Turn COD off and make the flag explicit rather than absent.
update public.store_settings
set value = value || jsonb_build_object('codEnabled', false)
where key = 'payments';

-- 2. Add the express flag, off by default. Existing fees are left alone so the
--    figure is ready the day you switch it on.
update public.store_settings
set value = value || jsonb_build_object('expressEnabled', false)
where key = 'shipping';

-- 3. Re-create place_order with the express guard. Everything else is unchanged
--    from 0002 — prices, stock locking and coupon handling all still happen here
--    and never in the browser.
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
  v_method   text := coalesce(payload->>'payment_method', 'upi');
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

  -- Express is not running yet. Downgrade rather than refuse: the customer asked
  -- for the only thing we can actually do, so give them that at that price.
  if v_speed = 'express' and not coalesce((v_ship->>'expressEnabled')::boolean, false) then
    v_speed := 'standard';
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
      raise exception 'Cash on delivery is not available. Please pay by UPI.';
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

  -- Shipping. Express, when it is running, is charged even above the free
  -- threshold — it costs us the same on a ₹500 order as on a ₹5,000 one.
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
    'shipping_speed', v_speed,
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
