import { PRODUCTS } from './products.js'
import { SETTINGS } from './settings.js'

/**
 * Ninety days of trading, generated from a fixed seed so the dashboard shows
 * the same numbers on every reload — but anchored to today, so the charts are
 * never stale. Swap this whole module for API calls when the backend lands.
 */

const rng = (() => {
  let a = 0x9e3779b9
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
})()

const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const between = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))

const FIRST = [
  'Aisha', 'Fatima', 'Zainab', 'Maryam', 'Khadija', 'Sana', 'Ayesha', 'Ruqaiya',
  'Hafsa', 'Sumaiya', 'Nusrat', 'Rabia', 'Amina', 'Saniya', 'Farheen', 'Iqra',
  'Zoya', 'Alfiya', 'Shifa', 'Nazia', 'Heena', 'Tabassum', 'Anam', 'Rehana',
]
const LAST = [
  'Shaikh', 'Ansari', 'Qureshi', 'Patel', 'Khan', 'Sayyed', 'Memon', 'Mirza',
  'Siddiqui', 'Kazi', 'Bano', 'Rizvi', 'Chishti', 'Tamboli', 'Jamadar', 'Hashmi',
]
const CITIES = [
  ['Mumbai', 'Maharashtra', '400003'],
  ['Hyderabad', 'Telangana', '500002'],
  ['Bengaluru', 'Karnataka', '560051'],
  ['Delhi', 'Delhi', '110006'],
  ['Lucknow', 'Uttar Pradesh', '226003'],
  ['Kozhikode', 'Kerala', '673001'],
  ['Chennai', 'Tamil Nadu', '600014'],
  ['Ahmedabad', 'Gujarat', '380001'],
  ['Bhopal', 'Madhya Pradesh', '462001'],
  ['Kolkata', 'West Bengal', '700016'],
  ['Srinagar', 'Jammu & Kashmir', '190001'],
  ['Malegaon', 'Maharashtra', '423203'],
]
const STREETS = [
  'Flat 302, Noor Manzil, Bazaar Road',
  '14 Gulmohar Lane, Off Station Road',
  'B-7 Rahat Apartments, Mill Colony',
  '221 Chishti Chawl, Nagpada',
  'House 9, Masjid Gully, Old Town',
  '4th Floor, Sana Residency, Ring Road',
]

/* ------------------------------------------------------------ customers --- */

export const CUSTOMERS = Array.from({ length: 26 }, (_, i) => {
  const first = FIRST[i % FIRST.length]
  const last = pick(LAST)
  const [city, state, pin] = pick(CITIES)
  return {
    id: `c-${String(i + 1).padStart(3, '0')}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.in`,
    phone: `+91 9${between(1, 9)}${String(between(10000000, 99999999))}`,
    city,
    state,
    pincode: pin,
    address: pick(STREETS),
    joinedDaysAgo: between(4, 400),
    marketingOptIn: rng() > 0.35,
  }
})

/* --------------------------------------------------------------- orders --- */

const live = PRODUCTS.filter((p) => p.published)

const isoDaysAgo = (days, hour) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, between(0, 59), 0, 0)
  return d.toISOString()
}

const statusFor = (daysAgo, method) => {
  if (method === 'upi' && daysAgo < 1 && rng() > 0.55) return 'pending_payment'
  if (daysAgo > 9) return rng() > 0.06 ? 'delivered' : rng() > 0.5 ? 'returned' : 'cancelled'
  if (daysAgo > 5) return rng() > 0.15 ? 'delivered' : 'shipped'
  if (daysAgo > 2) return 'shipped'
  if (daysAgo > 1) return 'packed'
  return 'confirmed'
}

const makeOrder = (i, daysAgo) => {
  const customer = pick(CUSTOMERS)
  const lineCount = rng() > 0.62 ? between(2, 3) : 1
  const items = []
  for (let l = 0; l < lineCount; l++) {
    const p = pick(live)
    if (items.some((it) => it.productId === p.id)) continue
    const colorway = pick(p.colorways)
    const qty = rng() > 0.82 ? 2 : 1
    items.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      colorwayCode: colorway.code,
      colorwayName: colorway.name,
      hex: colorway.hex,
      image: colorway.images[0],
      price: p.price,
      qty,
    })
  }

  const method = rng() > 0.46 ? 'cod' : 'upi'
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const shipping = subtotal >= SETTINGS.shipping.freeAbove ? 0 : SETTINGS.shipping.standardFee
  const codFee = method === 'cod' ? SETTINGS.payments.codFee : 0
  const discount =
    method === 'upi' ? Math.round((subtotal * SETTINGS.payments.prepaidDiscountPct) / 100) : 0
  const status = statusFor(daysAgo, method)

  return {
    id: `HA${String(24800 + i)}`,
    createdAt: isoDaysAgo(daysAgo, between(9, 22)),
    status,
    customerId: customer.id,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    shippingAddress: {
      line1: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
    },
    items,
    payment: {
      method,
      // COD is collected on delivery; UPI is captured up front, unless the
      // customer abandoned the QR screen.
      paid: method === 'cod' ? status === 'delivered' : status !== 'pending_payment',
      upiRef: method === 'upi' && status !== 'pending_payment' ? `4${between(10000000000, 99999999999)}` : null,
      verifiedBy: method === 'upi' && status !== 'pending_payment' ? 'admin@hijabaura.in' : null,
    },
    totals: { subtotal, shipping, codFee, discount, grand: subtotal + shipping + codFee - discount },
    courier: ['Delhivery', 'Bluedart', 'Xpressbees', 'India Post'][between(0, 3)],
    awb: `${between(100000000, 999999999)}`,
    notes: rng() > 0.86 ? 'Customer asked for gift wrap.' : '',
  }
}

// Weight recent days more heavily — the store is growing, and a flat
// distribution would make the dashboard trend look dead.
const dayWeights = Array.from({ length: 90 }, (_, d) => 0.4 + (1 - d / 90) * 1.6)

export const ORDERS = (() => {
  const out = []
  let i = 0
  for (let d = 89; d >= 0; d--) {
    const n = Math.round(dayWeights[d] * (1.1 + rng() * 1.5))
    for (let k = 0; k < n; k++) out.push(makeOrder(i++, d))
  }
  const sorted = out
    .filter((o) => o.items.length > 0)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  // Guarantee a verification queue. Without this the seed can leave zero
  // pending payments, and the UPI verification screen — the one part of the
  // dashboard that needs a human — would demo as an empty state.
  let seeded = 0
  for (const o of sorted) {
    if (seeded >= 3) break
    if (o.payment.method !== 'upi' || o.status === 'pending_payment') continue
    o.status = 'pending_payment'
    o.payment.paid = false
    o.payment.verifiedBy = null
    o.courier = null
    o.awb = null
    seeded++
  }
  return sorted
})()

/* -------------------------------------------------------------- coupons --- */

export const COUPONS = [
  {
    code: 'AURA10',
    kind: 'percent',
    value: 10,
    minOrder: 999,
    active: true,
    uses: 412,
    cap: 2000,
    note: 'Sitewide, first order',
    expiresDaysFromNow: 45,
  },
  {
    code: 'UPI5',
    kind: 'percent',
    value: 5,
    minOrder: 0,
    active: true,
    uses: 1908,
    cap: null,
    note: 'Auto-applied on prepaid — stacks with nothing else',
    expiresDaysFromNow: 365,
  },
  {
    code: 'MODAL200',
    kind: 'flat',
    value: 200,
    minOrder: 1499,
    active: true,
    uses: 88,
    cap: 500,
    note: 'Everyday Modal collection only',
    expiresDaysFromNow: 18,
  },
  {
    code: 'EID24',
    kind: 'percent',
    value: 15,
    minOrder: 1999,
    active: false,
    uses: 1204,
    cap: 1500,
    note: 'Expired — Eid campaign',
    expiresDaysFromNow: -60,
  },
  {
    code: 'FREESHIP',
    kind: 'shipping',
    value: 0,
    minOrder: 599,
    active: true,
    uses: 640,
    cap: null,
    note: 'Waives standard shipping',
    expiresDaysFromNow: 90,
  },
]

/* -------------------------------------------------------------- reviews --- */

const REVIEW_TEXT = [
  ['Bought this in Oat Chalk after reading the fabric details and they were accurate — it really does fall in long lines rather than breaking up. Second one ordered.', 5, 'Fabric matched the description exactly'],
  ['I have a large head and most jersey hijabs pull tight by evening. This one did not. The 4% elastane claim is real.', 5, 'Held shape all day'],
  ['Lovely colour but sheerer than I expected. The description did say it was light, so my fault — wear it with the matching cap and it is perfect.', 4, 'Wear it with a cap'],
  ['The crinkle survived three washes and a suitcase. No iron, exactly as promised.', 5, 'No iron needed, genuinely'],
  ['Shipping took six days to Kozhikode which was within the window. Packaging was flat and simple, no waste.', 5, 'Arrived well packed'],
  ['Satin side out for the wedding, crepe side out for work. Two hijabs for the price of one.', 5, 'Reversible is the selling point'],
  ['Good weight for winter. I stopped wearing a scarf over it.', 5, 'Warm enough to replace a scarf'],
  ['Colour is slightly deeper than the photo on my screen. Not a complaint, just noting it.', 4, 'Slightly deeper than pictured'],
  ['Ordered COD and paid the 49 rupee fee happily — was not sure about the brand yet. Would prepay next time for the 5% off.', 5, 'COD made it easy to try'],
  ['The bead work on the bridal shawl is extraordinary. Took 14 days as stated and came with the karigar name card.', 5, 'Worth the wait'],
  ['Magnets are strong. They hold my 240 GSM jersey without slipping, which no other magnet pin has managed.', 5, 'Actually strong enough'],
  ['Bit stiff out of the packet but softened after two washes as the description said it would.', 4, 'Softens after two washes'],
]

export const REVIEWS = (() => {
  const out = []
  let i = 0
  for (const p of live) {
    const n = Math.max(2, Math.min(6, Math.round(p.reviewCount / 120)))
    for (let k = 0; k < n; k++) {
      const [body, stars, title] = REVIEW_TEXT[(i + k) % REVIEW_TEXT.length]
      const c = CUSTOMERS[(i * 3 + k * 7) % CUSTOMERS.length]
      out.push({
        id: `r-${String(++i).padStart(4, '0')}`,
        productId: p.id,
        productName: p.name,
        author: c.name,
        city: c.city,
        rating: stars,
        title,
        body,
        daysAgo: between(2, 180),
        verified: rng() > 0.12,
        published: rng() > 0.08,
        colorwayCode: pick(p.colorways).code,
      })
    }
  }
  return out
})()

export default ORDERS
