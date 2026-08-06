/**
 * Store settings. Everything here is editable in Admin → Settings, and the
 * storefront reads it live — the UPI VPA below is what the checkout QR encodes.
 */
export const SETTINGS = {
  brand: {
    // Taken from the roundel artwork. Change `name` here and it changes
    // everywhere — header, footer, page titles, order emails, invoices.
    name: 'Hijabisaura',
    tagline: 'Your Aura, Your Style.',
    promise: 'Hijabs chosen by how they fall',
    email: 'salaam@hijabisaura.in',
    phone: '+91 98200 41102',
    whatsapp: '919820041102',
    address: 'Unit 4, Mehrab House, Mohammed Ali Road, Mumbai 400003',
    gstin: '27AABCH1234K1ZQ',
    instagram: 'hijabisaura',
    instagramUrl: 'https://instagram.com/hijabisaura',
  },

  payments: {
    // Replace with the real merchant VPA before going live — the checkout QR
    // and the upi:// intent link are both generated from this value.
    upiVpa: 'hijabisaura@okicici',
    upiPayeeName: 'Hijabisaura Retail',
    upiEnabled: true,
    // Off. place_order() refuses a COD order while this is false, so the rule
    // holds even against a request that bypasses the interface.
    codEnabled: false,
    codFee: 49,
    codMinOrder: 499,
    codMaxOrder: 7000,
    cardsEnabled: false,
    prepaidDiscountPct: 5,
  },

  shipping: {
    freeAbove: 999,
    standardFee: 79,
    // Express is built but not running. The checkout shows it as a disabled
    // option so customers can see it is coming.
    expressEnabled: false,
    expressFee: 199,
    standardDays: '4–7 working days',
    expressDays: '2–3 working days',
    dispatchNote: 'Orders placed before 2pm IST dispatch the same day.',
  },

  returns: {
    windowDays: 7,
    exchangeOnly: false,
    note: 'Unworn, unwashed, tags on. Bridal and made-to-order pieces are final sale.',
  },

  ops: {
    lowStockThreshold: 10,
    currency: 'INR',
    locale: 'en-IN',
  },
}

export const ORDER_STATUSES = [
  { key: 'pending_payment', label: 'Awaiting payment', tone: 'gold' },
  { key: 'confirmed', label: 'Confirmed', tone: 'rose' },
  { key: 'packed', label: 'Packed', tone: 'rose' },
  { key: 'shipped', label: 'Shipped', tone: 'rose' },
  { key: 'delivered', label: 'Delivered', tone: 'rose' },
  { key: 'cancelled', label: 'Cancelled', tone: 'clay' },
  { key: 'returned', label: 'Returned', tone: 'clay' },
]

export const statusMeta = (key) =>
  ORDER_STATUSES.find((s) => s.key === key) || { key, label: key, tone: 'taupe' }

/** The order of the fulfilment pipeline, for the customer-facing tracker. */
export const FULFILMENT_STEPS = ['confirmed', 'packed', 'shipped', 'delivered']

export default SETTINGS
