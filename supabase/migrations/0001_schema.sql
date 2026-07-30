-- ============================================================================
-- Hijabisaura — 0001: schema
--
-- Run this first, in the Supabase SQL editor. It creates tables only; security
-- lives in 0002 and NOTHING is readable by the public until that has run too.
--
-- Money: stored as integer WHOLE RUPEES, matching the app exactly (all prices
-- are whole rupees and the UI formats with no decimals). This is deliberate —
-- `numeric` is returned to JavaScript as a *string* by the Postgres driver,
-- which would silently break `price * qty` arithmetic across the app. If you
-- ever need sub-rupee precision, migrate to integer paise, not to numeric.
-- ============================================================================

create extension if not exists pgcrypto;

-- Keeps updated_at honest without the app having to remember.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- dye card ---

-- The shared colour reference. A colourway is a colour the label runs, not a
-- property of one product — several products come in HA-04 Jade Deep.
create table if not exists public.colorways (
  code        text primary key check (code ~ '^HA-[0-9]{2,3}$'),
  name        text not null,
  hex         text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  family      text not null,
  is_light    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.colorways is
  'The dye card. Codes are customer-facing and must never be reused for a different colour.';

-- ------------------------------------------------------------- collections ---

create table if not exists public.collections (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  kicker      text not null default '',
  blurb       text not null default '',
  banner      text not null default '',
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists collections_touch on public.collections;
create trigger collections_touch before update on public.collections
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- products ---

create table if not exists public.products (
  id              text primary key,
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name            text not null check (length(trim(name)) > 0),
  tagline         text not null default '',
  description     text not null default '',
  collection_slug text references public.collections(slug) on update cascade on delete set null,

  style           text not null default 'rectangle'
                    check (style in ('rectangle','square','instant','shawl','accessory')),
  occasion        text[] not null default '{}',

  price           int not null check (price >= 0),
  mrp             int not null default 0 check (mrp >= 0),

  -- Mill spec, as supplied. Do not publish figures you cannot stand behind.
  fabric          text not null default '',
  composition     text not null default '',
  weave           text not null default 'plain'
                    check (weave in ('plain','twill','satin','jersey','tulle','none')),
  gsm             int not null default 0 check (gsm >= 0),
  size_w          int not null default 0 check (size_w >= 0),
  size_l          int not null default 0 check (size_l >= 0),
  size_note       text not null default '',
  piece_weight_g  int not null default 0 check (piece_weight_g >= 0),
  origin          text not null default '',
  care            text not null default '',
  notes           text[] not null default '{}',
  warning         text not null default '',

  pinless         boolean not null default false,
  made_to_order   boolean not null default false,
  small_batch     boolean not null default false,
  featured        boolean not null default false,
  published       boolean not null default false,

  -- Cached aggregates. Maintained by triggers / place_order, never by the admin
  -- form, so they cannot be inflated by hand.
  rating          numeric(2,1) not null default 0 check (rating between 0 and 5),
  review_count    int not null default 0 check (review_count >= 0),
  sold            int not null default 0 check (sold >= 0),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint mrp_not_below_price check (mrp = 0 or mrp >= price)
);

create index if not exists products_published_idx on public.products (published) where published;
create index if not exists products_collection_idx on public.products (collection_slug);

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- One row per product + colourway pair. Stock lives here, because the same
-- product sells out in one colour while another is still on the shelf.
create table if not exists public.product_colorways (
  product_id    text not null references public.products(id) on delete cascade,
  colorway_code text not null references public.colorways(code) on update cascade on delete restrict,
  stock         int not null default 0 check (stock >= 0),
  sort_order    int not null default 0,
  primary key (product_id, colorway_code)
);

create index if not exists product_colorways_product_idx on public.product_colorways (product_id);

-- Images belong to a product + colourway pair, because the carousel swaps with
-- the swatch. sort_order 0 is the primary image: the card thumbnail and the
-- first carousel slide.
create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    text not null,
  colorway_code text not null,
  url           text not null check (length(trim(url)) > 0),
  alt           text not null default '',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  foreign key (product_id, colorway_code)
    references public.product_colorways (product_id, colorway_code) on delete cascade
);

create index if not exists product_images_lookup_idx
  on public.product_images (product_id, colorway_code, sort_order);

-- --------------------------------------------------------------- customers ---

-- Shoppers check out as guests — there is no customer login. This is a record
-- of who ordered, not an account.
create table if not exists public.customers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text,
  phone             text,
  marketing_opt_in  boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists customers_email_unique
  on public.customers (lower(email)) where email is not null;

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------- coupons ---

create table if not exists public.coupons (
  code        text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  kind        text not null check (kind in ('percent','flat','shipping')),
  value       int not null default 0 check (value >= 0),
  min_order   int not null default 0 check (min_order >= 0),
  active      boolean not null default true,
  uses        int not null default 0 check (uses >= 0),
  usage_cap   int check (usage_cap is null or usage_cap > 0),
  note        text not null default '',
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint percent_within_range check (kind <> 'percent' or value between 0 and 100)
);

-- ------------------------------------------------------------------ orders ---

create sequence if not exists public.order_number_seq start 25000;

create table if not exists public.orders (
  id              text primary key,
  customer_id     uuid references public.customers(id) on delete set null,

  status          text not null default 'pending_payment' check (status in (
                    'pending_payment','confirmed','packed','shipped',
                    'delivered','cancelled','returned')),

  -- Contact and address are SNAPSHOTS. If the customer later changes their
  -- phone number, the parcel that already shipped must still show where it went.
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null,
  ship_line1      text not null,
  ship_landmark   text not null default '',
  ship_city       text not null,
  ship_state      text not null,
  ship_pincode    text not null check (ship_pincode ~ '^[1-9][0-9]{5}$'),

  payment_method  text not null check (payment_method in ('cod','upi')),
  payment_paid    boolean not null default false,
  upi_ref         text check (upi_ref is null or upi_ref ~ '^[0-9]{12}$'),
  verified_by     text,
  verified_at     timestamptz,

  -- Every figure below is computed server-side by place_order(). The client
  -- never gets to say what an order costs.
  subtotal        int not null check (subtotal >= 0),
  shipping        int not null default 0 check (shipping >= 0),
  cod_fee         int not null default 0 check (cod_fee >= 0),
  discount        int not null default 0 check (discount >= 0),
  grand_total     int not null check (grand_total >= 0),
  coupon_code     text,

  shipping_speed  text not null default 'standard' check (shipping_speed in ('standard','express')),
  courier         text,
  awb             text,
  notes           text not null default '',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_email_idx on public.orders (lower(customer_email));

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Line items also snapshot name, price and colour. A product renamed or
-- repriced next season must not rewrite what someone bought last month.
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      text not null references public.orders(id) on delete cascade,
  product_id    text references public.products(id) on delete set null,
  product_name  text not null,
  product_slug  text not null,
  colorway_code text not null,
  colorway_name text not null,
  colorway_hex  text not null,
  image_url     text,
  unit_price    int not null check (unit_price >= 0),
  qty           int not null check (qty between 1 and 20)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ----------------------------------------------------------------- reviews ---

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    text not null references public.products(id) on delete cascade,
  order_id      text references public.orders(id) on delete set null,
  author        text not null,
  city          text not null default '',
  rating        int not null check (rating between 1 and 5),
  title         text not null default '',
  body          text not null check (length(trim(body)) > 0),
  colorway_code text references public.colorways(code) on update cascade on delete set null,
  verified      boolean not null default false,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews (product_id) where published;

-- Keeps products.rating and review_count in step with published reviews only.
create or replace function public.sync_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product text := coalesce(new.product_id, old.product_id);
begin
  update products p
  set rating = coalesce((
        select round(avg(r.rating)::numeric, 1) from reviews r
        where r.product_id = v_product and r.published), 0),
      review_count = (
        select count(*) from reviews r
        where r.product_id = v_product and r.published)
  where p.id = v_product;
  return null;
end;
$$;

drop trigger if exists reviews_sync_rating on public.reviews;
create trigger reviews_sync_rating
  after insert or update or delete on public.reviews
  for each row execute function public.sync_product_rating();

-- ---------------------------------------------------------------- settings ---

-- One row per settings group (brand, payments, shipping, returns, ops), stored
-- as jsonb because the admin edits them as groups.
--
-- is_public controls whether anonymous visitors can read the group. NEVER put a
-- secret in this table, public or not — anything here is one policy mistake away
-- from being world-readable. API keys belong in Vercel env vars.
create table if not exists public.store_settings (
  key         text primary key,
  value       jsonb not null,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

drop trigger if exists store_settings_touch on public.store_settings;
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ admins ---

-- Who may use the dashboard. A row here is the ONLY thing that grants write
-- access, so adding a row is the same as handing over the keys.
create table if not exists public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now()
);

comment on table public.admins is
  'Grants dashboard access. Insert a row only for accounts you control.';
