# Hijabisaura

*Your Aura, Your Style.*

A frontend-only storefront and admin dashboard for a hijab label, built to be deployed
on Vercel today and wired to a backend later. Everything runs in the browser — no server,
no API keys.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # → dist/
```

Deploying to Vercel: import the repo, framework preset **Vite**, and you're done.
`vercel.json` already contains the SPA rewrite that keeps deep links like
`/product/mahd-modal-everyday` working on refresh.

---

## The design idea

Most hijab sites describe fabric as "soft" and "premium quality", which tells a buyer
nothing. This one publishes the actual specification instead — **fabric, weave, weight in
GSM, exact dimensions, composition, where it was woven, and how to wash it** — on every
product page rather than buried in a reply to a DM.

That is information a supplier already gives you, so it costs nothing to pass on and
there is nothing to justify.

The second idea is **the dye card**: every colour gets a code (`HA-04 Jade Deep`) that
stays with it on the product page, the folded piece and the tag in the box. It answers the
single hardest customer question — *"do you still have the green from that post?"*

Supporting decisions:

- **Two registers.** Espresso-dark sections for desire (hero, dye card, editorial), blush
  cream for decision (shop grid, product pages, cart, checkout). Dark makes dyed cloth
  glow; light makes buying legible.
- **Mono is reserved for mill data** — weave, GSM, dimensions, order numbers, dye codes.
  Never for prose. The type system itself reads as a spec sheet.
- **Palette and wordmark come from your roundel**: espresso `#241A18`, dusty rose
  `#96625A`, gold `#B8894F`, blush `#F7EFEC`. The two-tone **Hijabis**·*aura* split is
  reused everywhere the name appears.
- **Weave diagrams are real.** `WeaveDiagram` draws the actual interlacing cell by cell,
  so a twill product shows a twill, not a decorative texture.

### A note on what was removed

An earlier version of this build had a "Drape Meter" — three 0–100 scores per product
(sheer↔opaque, crisp↔fluid, matte↔lustre) plus a page describing a measurement bench with
a light meter and a printed reference card.

**That was removed, and deliberately so.** The bench did not exist, so the scores and the
method were claims the shop could not stand behind, and a 0–100 number implies a precision
that no hands-on judgement can produce. Nothing in the site now asserts a measurement you
have not actually taken. If you ever want qualitative guidance back, do it in words you can
defend ("sheer", "holds a shape") and never as a score.

The shop filter that used those scores is now a **GSM weight band** filter instead, which
comes off the mill's own roll label.

## What's built

### Storefront
`/` home · `/shop` (filters + sort) · `/collections/:slug` · `/product/:slug` ·
`/cart` · `/checkout` · `/order/:id` · `/track` · `/wishlist` · `/search` ·
`/styling` · `/care` · `/size-guide` · `/faq` · `/about` ·
`/contact` · `/policies/{shipping,returns,privacy,terms}` · 404

- Multi-image carousel (Embla) with a desktop thumb rail, swipe on touch, and lightbox.
  **The image set swaps with the colourway** — on this catalogue the colour *is* the product.
- Filters on the things that decide how a hijab wears: collection, GSM weight band, cut,
  colour family, occasion, price, pinless, in-stock. All filter state lives in the URL, so a
  filtered view is shareable.
- Cart drawer with a free-shipping progress bar, quantity stepping against real stock,
  coupon codes, wishlist, recently viewed, PIN-code delivery estimate.

### Payments
- **Cash on delivery** — configurable fee and min/max order. Checkout blocks COD outside
  the range and explains why.
- **UPI** — `qrcode.react` renders a **real, scannable** QR from the NPCI intent string
  (`upi://pay?pa=…&am=…&tr=…`), so it opens in GPay/PhonePe/Paytm with the amount and note
  pre-filled. On mobile there are also direct app deep links.
  The customer submits the 12-digit UTR; an admin verifies it against the bank statement.
  **A UPI order is only written once the UTR is submitted** — abandoning the QR screen
  doesn't leave a ghost order in the queue.
- Prepaid orders get 5% off, which is the saved gateway fee passed back.
- Cards/net-banking are deliberately shown as "Soon" rather than faked.

### Admin dashboard — `/admin`
Sign in with any email and any password of 4+ characters.

- **Dashboard** — revenue/orders/AOV/units with period-over-period deltas, revenue area
  chart, orders-per-day bars, COD-vs-UPI donut, best sellers, low stock, and an attention
  row for things that need a human. Cancelled and returned orders are excluded from
  revenue so the trend line can't flatter the store.
- **Product editor** — the full record is editable: name, slug, description, selling
  points, collection, cut, occasion tags, pricing, mill spec (fabric, weave, GSM,
  dimensions, composition, origin, care), visibility flags, and a live card
  preview. Validation blocks publishing something broken.
- **Multi-image manager, per colourway** — add any URL, **drag to reorder** (dnd-kit,
  with keyboard support), make-primary, remove, or restore the generated set. Image 1 is
  the card thumbnail and the first carousel slide.
- **Orders** — status tabs, search, the UPI verification queue, fulfilment pipeline with
  a required AWB before shipping, copy-address-for-label, WhatsApp the customer.
- **Collections, customers, coupons, reviews, settings** — all editable.
- **Settings drives the storefront live**, including the UPI VPA the checkout QR encodes,
  with a scannable preview so you can check the payee name before going live.
- **Reset demo data** in the sidebar restores every seeded value.

Admin edits show up on the storefront immediately — both read the same store.

---

## Product photography

There are no stock photos here. `npm run images` generates 98 SVGs into `public/img`,
four shots per colourway, seeded off the colourway code so re-running never reshuffles a
photo a product page already points at:

| Shot | What it is |
|---|---|
| `drape` | the fall, lit from one side so the folds read |
| `styled` | editorial silhouette, face left as negative space |
| `flat` | folded on a plain ground with its dye-card tag |
| `macro` | the weave, close up |

They look designed rather than placeholder, they cost ~500 KB total, and there's nothing
to break offline. **Swap in real photography by pasting URLs in the admin image manager** —
no code change needed.

The dye card (`src/data/colorways.mjs`) is shared by the app and the generator, so swatches
and photography can't drift apart.

---

## Stack

Vite · React 18 · React Router 6 · Tailwind 3 · Zustand (+persist) · Embla ·
Framer Motion · Recharts · react-hook-form + Zod · dnd-kit · qrcode.react ·
react-hot-toast · lucide-react · date-fns

Type: Fraunces (display, with the `SOFT`/`WONK` axes on), Hanken Grotesk (body),
IBM Plex Mono (data), Parisienne (the tagline only).

---

## Wiring up a backend

State lives in one Zustand store (`src/store/useStore.js`) persisted to localStorage.
Every mutation is already a named action, so each becomes an API call:

| Replace | With |
|---|---|
| `src/data/*` seeds | `GET /products`, `/orders`, `/customers`, … |
| `placeOrder` | `POST /orders` |
| `markPaid` | server-side UPI reconciliation (or a PSP webhook) |
| `saveProduct` / `deleteProduct` | `PATCH`/`DELETE /products/:id` |
| `signIn` in `AdminRoutes.jsx` | real auth + a route guard |
| Contact form in `About.jsx` | `POST /enquiries` |

Bump `SCHEMA` in the store whenever seeded data changes shape — persisted state wins over
the seed, so without a bump a stale cached catalogue shadows new code.

### Before taking real money

1. **Replace the UPI VPA.** `src/data/settings.js` ships `hijabisaura@okicici` as a
   placeholder. Funds go wherever it points.
2. **Replace the admin sign-in.** It is a demo gate, not a security boundary, and the
   dashboard is not protecting real data yet.
3. UTR verification is manual by design. Keep a human on it, or move to a PSP with
   webhooks.
4. Add an OG image (`og:image`) — the meta tags are in place but there's no raster yet.

---

## Notes

- **The brand name is taken from your roundel: "Hijabisaura", `@hijabisaura`.** Your brief
  said "hijabAura", so if you want it the other way, change `brand.name` in
  `src/data/settings.js` (or Admin → Settings) and it updates everywhere.
- The logo is rebuilt as vectors in `src/components/Logo.jsx` — faithful in spirit, not a
  pixel trace of the raster. If you have the original vector, drop it in and swap
  `AuraMark`.
- Responsive to 360px, keyboard-focusable throughout, and `prefers-reduced-motion` turns
  off the ambient hero drift and the drape-meter stagger.
