# Database

Run in order, in the **Supabase SQL Editor**. Paste each file, run it, check it
succeeded, then move to the next.

| File | What it does |
|---|---|
| `migrations/0001_schema.sql` | Tables, constraints, indexes, triggers |
| `migrations/0002_rls_and_functions.sql` | **Privileges, row level security, and the server-side operations** |
| `migrations/0003_seed.sql` | Dye card, collections, settings, coupons, catalogue |
| `migrations/0004_upi_only_standard_shipping.sql` | Turns COD off, adds the express flag, re-creates `place_order` |
| `migrations/0005_more_colorways.sql` | Takes the dye card from 22 colours to 56 |
| `migrations/0006_image_storage.sql` | The `product-images` bucket and its policies |

All are safe to run more than once — **except 0003 once you have uploaded real
photographs.** It replaces `product_images` wholesale, so re-running it would
delete every uploaded URL and restore the generated placeholders. After your
first real upload, treat 0003 as historical and change products in Admin.

> **Do not stop after 0001.** Between 0001 and 0002 every table is wide open to
> anyone holding the publishable key — which is everyone, because that key ships
> inside your JavaScript bundle. Run 0002 in the same sitting.

`0003_seed.sql` is generated. Edit the data files under `src/data/` and re-run:

```bash
npm run seed:sql
```

Re-seeding never resets stock levels or overwrites orders.

---

## Image uploads

Photographs live in the `product-images` bucket: **public read, admin-only
write**, enforced by storage policies in 0006 using the same `is_admin()` check
as the rest of the schema.

- 5 MB per file, and only JPEG, PNG, WebP, AVIF or SVG — set on the bucket, so
  the limit holds even if the browser check is bypassed.
- Objects are filed under `productId/colourwayCode/`, with a random suffix so
  two files called `IMG_1234.jpg` never overwrite each other.
- Removing an uploaded photo in Admin deletes the stored file too. Removing a
  *pasted* URL only unlinks it — it was never ours to delete.

Supabase's free tier includes 1 GB of storage. At roughly 200 KB per optimised
web photo that is a few thousand images; the 5 GB tier is a paid upgrade.

## The security model

Grants and row level security are both applied, and they are AND-ed — you need
both to touch a row. That way one mistaken policy is not the only thing standing
between a stranger and your orders table.

| | Can read | Can write |
|---|---|---|
| **anon** (every visitor) | Published products, collections, reviews, the dye card, public settings | Nothing. No INSERT/UPDATE/DELETE grant exists at all |
| **authenticated, not an admin** | Nothing beyond anon | Nothing |
| **admin** (a row in `public.admins`) | Everything, including drafts | Everything except adding admins |
| **service_role** (dashboard / trusted server) | Everything | Everything |

Anonymous visitors have **no read access whatsoever** to `orders`, `order_items`,
`customers`, `coupons` or `admins`. Anything a guest legitimately needs from
those goes through a function instead:

| Function | For |
|---|---|
| `place_order(payload)` | Placing an order. Prices, discounts, shipping and COD fees are **recomputed server-side**; the client cannot say what an order costs. Stock is locked with `FOR UPDATE` and decremented in the same transaction |
| `validate_coupon(code, subtotal)` | Checking a code without exposing the coupon table |
| `track_order(order_id, contact)` | Order lookup. Requires the order number **and** a matching email or phone, so a guessed order number alone reveals nothing |
| `submit_upi_reference(order_id, email, ref)` | Attaching a UTR after paying. Settable once, only while awaiting payment, and it cannot mark the order paid |
| `submit_review(payload)` | Leaving a review. Arrives unpublished and unverified |

Marking a payment received stays an admin action. That is deliberate.

---

## Before you go live

1. **Turn off public signups** in Supabase → Authentication → Providers. There is
   no customer login on this site, so the only accounts should be yours. Without
   this, anyone can create an `authenticated` session — RLS still blocks them,
   but there is no reason to allow it.
2. **Add yourself as an admin.** Create your user in Authentication → Users,
   then, from the SQL Editor (which runs as `service_role`):
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'you@yourdomain.in';
   ```
   A row here is the whole of your access control. Only add accounts you control.
3. **Replace the placeholder mill specs.** The GSM, composition and origin values
   in the seed are sample data I invented, not your supplier's figures.
4. **Replace the UPI VPA** in `store_settings` → `payments`. Money goes wherever
   it points.
5. **Never put a secret in `store_settings`.** It is one policy away from being
   world-readable. API keys belong in Vercel environment variables.

---

## Verified

These migrations were applied to a real PostgreSQL 15 instance and the security
model was tested, not assumed:

- All three apply cleanly, and again on a second run
- `anon` reads 16 published products but is hard-denied on coupons, orders,
  order_items, customers and admins
- Five different `anon` write attempts all rejected, including self-promotion to
  admin and publishing a hidden draft
- Unpublished drafts hide their images and stock as well as themselves
- COD: ₹1,998 subtotal → free shipping, +₹49 fee = **₹2,047**
- UPI: same cart → 5% off, no fee = **₹1,898**, status `pending_payment`
- A client sending `"subtotal": 1, "discount": 99999` was **charged the real
  ₹1,048** — the forged figures were ignored
- COD outside its ₹499–₹7,000 range refused; over-ordering stock refused;
  unpublished products cannot be bought
- Express shipping still charged above the free-shipping threshold (₹199)
- `track_order` with the right order number and the *wrong* email returns nothing
- A signed-in non-admin sees zero orders and cannot change a price
- An admin can verify a payment and edit a product, but cannot add another admin
