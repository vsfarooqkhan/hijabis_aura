import { supabase, isConfigured } from './supabase'

/**
 * The boundary between Postgres and the app.
 *
 * Database rows use snake_case and normalised tables; every component in this
 * app already expects the nested camelCase shapes from src/data. Rather than
 * rewrite ~40 components, the mappers below translate one into the other. That
 * keeps the swap to a single layer — and means the seed files remain a valid
 * description of the shape the UI consumes.
 *
 * If you change a column name in a migration, change it here and nowhere else.
 */

const notConfigured = () =>
  new Error('Supabase is not configured — check your VITE_SUPABASE_* environment variables.')

/* ---------------------------------------------------------------- mappers --- */

/** A products row + its colourways + images → the shape ProductCard expects. */
export const toProduct = (row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  tagline: row.tagline || '',
  description: row.description || '',
  collection: row.collection_slug,
  style: row.style,
  occasion: row.occasion || [],
  price: row.price,
  mrp: row.mrp,
  fabric: row.fabric || '',
  composition: row.composition || '',
  weave: row.weave,
  gsm: row.gsm,
  size: { w: row.size_w, l: row.size_l, note: row.size_note || '' },
  weight: row.piece_weight_g,
  origin: row.origin || '',
  care: row.care || '',
  notes: row.notes || [],
  warning: row.warning || '',
  pinless: row.pinless,
  madeToOrder: row.made_to_order,
  smallBatch: row.small_batch,
  featured: row.featured,
  published: row.published,
  // Postgres returns numeric as a string; the UI does arithmetic on this.
  rating: Number(row.rating) || 0,
  reviewCount: row.review_count || 0,
  sold: row.sold || 0,
  colorways: (row.product_colorways || [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((pc) => ({
      code: pc.colorway_code,
      name: pc.colorways?.name ?? pc.colorway_code,
      hex: pc.colorways?.hex ?? '#CCCCCC',
      family: pc.colorways?.family ?? 'neutral',
      stock: pc.stock,
      images: (pc.product_images || [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((im) => im.url),
    })),
})

export const toCollection = (row) => ({
  slug: row.slug,
  name: row.name,
  kicker: row.kicker || '',
  blurb: row.blurb || '',
  banner: row.banner || '',
  order: row.sort_order,
  published: row.published,
})

export const toReview = (row) => ({
  id: row.id,
  productId: row.product_id,
  productName: row.products?.name || '',
  author: row.author,
  city: row.city || '',
  rating: row.rating,
  title: row.title || '',
  body: row.body,
  colorwayCode: row.colorway_code,
  verified: row.verified,
  published: row.published,
  // The UI shows relative age; keep the raw timestamp too for sorting.
  daysAgo: Math.max(0, Math.floor((Date.now() - new Date(row.created_at)) / 86400000)),
  createdAt: row.created_at,
})

export const toOrder = (row) => ({
  id: row.id,
  createdAt: row.created_at,
  status: row.status,
  customerId: row.customer_id,
  customer: {
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone,
  },
  shippingAddress: {
    line1: row.ship_line1,
    landmark: row.ship_landmark || '',
    city: row.ship_city,
    state: row.ship_state,
    pincode: row.ship_pincode,
  },
  items: (row.order_items || []).map((i) => ({
    productId: i.product_id,
    name: i.product_name,
    slug: i.product_slug,
    colorwayCode: i.colorway_code,
    colorwayName: i.colorway_name,
    hex: i.colorway_hex,
    image: i.image_url,
    price: i.unit_price,
    qty: i.qty,
  })),
  payment: {
    method: row.payment_method,
    paid: row.payment_paid,
    upiRef: row.upi_ref,
    verifiedBy: row.verified_by,
  },
  totals: {
    subtotal: row.subtotal,
    shipping: row.shipping,
    codFee: row.cod_fee,
    discount: row.discount,
    grand: row.grand_total,
  },
  couponCode: row.coupon_code,
  shippingSpeed: row.shipping_speed,
  courier: row.courier,
  awb: row.awb,
  notes: row.notes || '',
})

/* --------------------------------------------------------- storefront reads --- */

/**
 * One query pulls the product, its colourways (with the dye card joined) and the
 * images belonging to each. PostgREST resolves the whole graph server-side, so
 * the shop grid costs one round trip instead of N+1.
 *
 * Images are nested *under the colourway*, not under the product: their foreign
 * key points at product_colorways(product_id, colorway_code), so there is no
 * direct products → product_images relationship for PostgREST to follow.
 */
export const PRODUCT_GRAPH = `
  *,
  product_colorways (
    colorway_code, stock, sort_order,
    colorways ( name, hex, family ),
    product_images ( url, alt, sort_order )
  )
`

export async function fetchProducts({ includeDrafts = false } = {}) {
  if (!isConfigured) throw notConfigured()
  let q = supabase.from('products').select(PRODUCT_GRAPH)
  // RLS hides drafts from anyone who is not an admin, so this is a convenience
  // for the storefront, not a security control.
  if (!includeDrafts) q = q.eq('published', true)
  const { data, error } = await q
  if (error) throw error
  return data.map(toProduct)
}

export async function fetchCollections({ includeHidden = false } = {}) {
  if (!isConfigured) throw notConfigured()
  let q = supabase.from('collections').select('*').order('sort_order')
  if (!includeHidden) q = q.eq('published', true)
  const { data, error } = await q
  if (error) throw error
  return data.map(toCollection)
}

/** Settings come back as one row per group; the app wants a single object. */
export async function fetchSettings() {
  if (!isConfigured) throw notConfigured()
  const { data, error } = await supabase.from('store_settings').select('key, value')
  if (error) throw error
  return Object.fromEntries(data.map((r) => [r.key, r.value]))
}

export async function fetchPublishedReviews() {
  if (!isConfigured) throw notConfigured()
  const { data, error } = await supabase
    .from('reviews')
    .select('*, products ( name )')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toReview)
}

/** Everything the storefront needs on first paint, in parallel. */
export async function fetchStorefront() {
  const [products, collections, settings, reviews] = await Promise.all([
    fetchProducts(),
    fetchCollections(),
    fetchSettings(),
    fetchPublishedReviews(),
  ])
  return { products, collections, settings, reviews }
}

/* -------------------------------------------------------- guest operations --- */

/**
 * Places an order. Note what is NOT sent: prices, totals, discounts. The
 * database recomputes all of it from the catalogue, so a tampered request cannot
 * change what an order costs.
 */
export async function placeOrderRemote({
  customer,
  address,
  paymentMethod,
  shippingSpeed,
  notes,
  couponCode,
  upiRef,
  items,
}) {
  if (!isConfigured) throw notConfigured()
  const { data, error } = await supabase.rpc('place_order', {
    payload: {
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      ship_line1: address.line1,
      ship_landmark: address.landmark || '',
      ship_city: address.city,
      ship_state: address.state,
      ship_pincode: address.pincode,
      payment_method: paymentMethod,
      shipping_speed: shippingSpeed,
      coupon_code: couponCode || null,
      upi_ref: upiRef || null,
      notes: notes || '',
      items: items.map((l) => ({
        product_id: l.productId,
        colorway_code: l.colorwayCode,
        qty: l.qty,
      })),
    },
  })
  if (error) throw error
  return data
}

export async function validateCouponRemote(code, subtotal) {
  if (!isConfigured) throw notConfigured()
  const { data, error } = await supabase.rpc('validate_coupon', {
    p_code: code,
    p_subtotal: subtotal,
  })
  if (error) throw error
  return data
}

export async function trackOrderRemote(orderId, contact) {
  if (!isConfigured) throw notConfigured()
  const { data, error } = await supabase.rpc('track_order', {
    p_order_id: orderId,
    p_contact: contact,
  })
  if (error) throw error
  return data
}

export async function submitUpiReferenceRemote(orderId, email, upiRef) {
  if (!isConfigured) throw notConfigured()
  const { data, error } = await supabase.rpc('submit_upi_reference', {
    p_order_id: orderId,
    p_email: email,
    p_upi_ref: upiRef,
  })
  if (error) throw error
  return data
}

export async function submitReviewRemote(review) {
  if (!isConfigured) throw notConfigured()
  const { data, error } = await supabase.rpc('submit_review', { payload: review })
  if (error) throw error
  return data
}

/**
 * Reads a single order for the confirmation screen straight after checkout.
 * Anonymous visitors cannot select from `orders`, so this goes through the same
 * contact-matched function the tracking page uses.
 */
export async function fetchOrderForConfirmation(orderId, email) {
  const res = await trackOrderRemote(orderId, email)
  if (!res?.ok) return null
  return res
}
