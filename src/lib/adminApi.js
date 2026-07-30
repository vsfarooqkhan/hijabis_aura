import { supabase, isConfigured } from './supabase'
import { toProduct, toCollection, toReview, toOrder, PRODUCT_GRAPH } from './api'

/**
 * Admin reads and writes.
 *
 * Every call here is allowed only because row level security recognises the
 * signed-in user as an admin. There is no privileged key in the browser — if you
 * are not in the `admins` table these all fail server-side, which is exactly the
 * intent. The dashboard is not the security boundary; Postgres is.
 */

const guard = () => {
  if (!isConfigured) throw new Error('Supabase is not configured.')
}

const fail = (error, what) => {
  if (!error) return
  // RLS denials surface as permission errors; make them legible.
  if (error.code === '42501' || error.message?.includes('row-level security')) {
    throw new Error(`Not permitted: ${what}. Is your account in the admins table?`)
  }
  throw new Error(error.message || `Could not ${what}`)
}

/* -------------------------------------------------------------- reads --- */

export async function adminFetchAll() {
  guard()
  const [products, collections, orders, customers, coupons, reviews, settings] = await Promise.all([
    supabase.from('products').select(PRODUCT_GRAPH),
    supabase.from('collections').select('*').order('sort_order'),
    supabase.from('orders').select('*, order_items ( * )').order('created_at', { ascending: false }),
    supabase.from('customers').select('*'),
    supabase.from('coupons').select('*').order('code'),
    supabase.from('reviews').select('*, products ( name )').order('created_at', { ascending: false }),
    supabase.from('store_settings').select('key, value'),
  ])

  for (const [res, what] of [
    [products, 'load products'], [collections, 'load collections'], [orders, 'load orders'],
    [customers, 'load customers'], [coupons, 'load coupons'], [reviews, 'load reviews'],
    [settings, 'load settings'],
  ]) {
    fail(res.error, what)
  }

  return {
    products: products.data.map(toProduct),
    collections: collections.data.map(toCollection),
    orders: orders.data.map(toOrder),
    customers: customers.data.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: '',
      state: '',
      pincode: '',
      address: '',
      marketingOptIn: c.marketing_opt_in,
      joinedDaysAgo: Math.max(0, Math.floor((Date.now() - new Date(c.created_at)) / 86400000)),
    })),
    coupons: coupons.data.map((c) => ({
      code: c.code,
      kind: c.kind,
      value: c.value,
      minOrder: c.min_order,
      active: c.active,
      uses: c.uses,
      cap: c.usage_cap,
      note: c.note || '',
      expiresDaysFromNow: c.expires_at
        ? Math.round((new Date(c.expires_at) - Date.now()) / 86400000)
        : 365,
    })),
    reviews: reviews.data.map(toReview),
    settings: Object.fromEntries(settings.data.map((r) => [r.key, r.value])),
  }
}

/* ----------------------------------------------------------- products --- */

/** The inverse of toProduct: app shape → database columns. */
const fromProduct = (p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  tagline: p.tagline || '',
  description: p.description || '',
  collection_slug: p.collection || null,
  style: p.style,
  occasion: p.occasion || [],
  price: Math.round(Number(p.price) || 0),
  mrp: Math.round(Number(p.mrp) || 0),
  fabric: p.fabric || '',
  composition: p.composition || '',
  weave: p.weave || 'plain',
  gsm: Math.round(Number(p.gsm) || 0),
  size_w: Math.round(Number(p.size?.w) || 0),
  size_l: Math.round(Number(p.size?.l) || 0),
  size_note: p.size?.note || '',
  piece_weight_g: Math.round(Number(p.weight) || 0),
  origin: p.origin || '',
  care: p.care || '',
  notes: p.notes || [],
  warning: p.warning || '',
  pinless: !!p.pinless,
  made_to_order: !!p.madeToOrder,
  small_batch: !!p.smallBatch,
  featured: !!p.featured,
  published: !!p.published,
})

export async function adminSaveProduct(product) {
  guard()
  const { error } = await supabase.from('products').upsert(fromProduct(product))
  fail(error, 'save this product')

  // Colourways: upsert the ones present, remove any that were taken off.
  const codes = product.colorways.map((c) => c.code)
  if (product.colorways.length) {
    const { error: cwErr } = await supabase.from('product_colorways').upsert(
      product.colorways.map((c, i) => ({
        product_id: product.id,
        colorway_code: c.code,
        stock: Math.max(0, Math.round(Number(c.stock) || 0)),
        sort_order: i,
      }))
    )
    fail(cwErr, 'save colourways')
  }
  let del = supabase.from('product_colorways').delete().eq('product_id', product.id)
  if (codes.length) del = del.not('colorway_code', 'in', `(${codes.join(',')})`)
  fail((await del).error, 'remove old colourways')

  // Images: order carries meaning, so replace the set rather than diff it.
  fail(
    (await supabase.from('product_images').delete().eq('product_id', product.id)).error,
    'clear old images'
  )
  const rows = product.colorways.flatMap((c) =>
    (c.images || []).map((url, i) => ({
      product_id: product.id,
      colorway_code: c.code,
      url,
      alt: `${product.name} in ${c.name}`,
      sort_order: i,
    }))
  )
  if (rows.length) fail((await supabase.from('product_images').insert(rows)).error, 'save images')
}

export async function adminCreateProduct(draft) {
  guard()
  const { error } = await supabase.from('products').insert(fromProduct(draft))
  fail(error, 'create a product')
}

export async function adminDeleteProduct(id) {
  guard()
  // Colourways and images cascade; order_items keep their snapshot and null the
  // product reference, so historic orders survive the deletion.
  fail((await supabase.from('products').delete().eq('id', id)).error, 'delete this product')
}

/* -------------------------------------------------------- collections --- */

export async function adminSaveCollection(c) {
  guard()
  fail(
    (
      await supabase.from('collections').upsert({
        slug: c.slug,
        name: c.name,
        kicker: c.kicker || '',
        blurb: c.blurb || '',
        banner: c.banner || '',
        sort_order: Number(c.order) || 0,
        published: !!c.published,
      })
    ).error,
    'save this collection'
  )
}

export async function adminDeleteCollection(slug) {
  guard()
  fail((await supabase.from('collections').delete().eq('slug', slug)).error, 'delete this collection')
}

/* ------------------------------------------------------------ coupons --- */

export async function adminSaveCoupon(c) {
  guard()
  const expires = new Date()
  expires.setDate(expires.getDate() + (Number(c.expiresDaysFromNow) || 0))
  fail(
    (
      await supabase.from('coupons').upsert({
        code: c.code.toUpperCase(),
        kind: c.kind,
        value: Math.max(0, Math.round(Number(c.value) || 0)),
        min_order: Math.max(0, Math.round(Number(c.minOrder) || 0)),
        active: !!c.active,
        usage_cap: c.cap ? Math.round(Number(c.cap)) : null,
        note: c.note || '',
        expires_at: expires.toISOString(),
      })
    ).error,
    'save this coupon'
  )
}

export async function adminDeleteCoupon(code) {
  guard()
  fail((await supabase.from('coupons').delete().eq('code', code)).error, 'delete this coupon')
}

/* ------------------------------------------------------------ reviews --- */

export async function adminSetReviewPublished(id, published) {
  guard()
  fail(
    (await supabase.from('reviews').update({ published }).eq('id', id)).error,
    'change this review'
  )
}

export async function adminDeleteReview(id) {
  guard()
  fail((await supabase.from('reviews').delete().eq('id', id)).error, 'delete this review')
}

/* ------------------------------------------------------------- orders --- */

export async function adminUpdateOrder(id, patch) {
  guard()
  const row = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.courier !== undefined) row.courier = patch.courier
  if (patch.awb !== undefined) row.awb = patch.awb
  if (patch.notes !== undefined) row.notes = patch.notes
  if (patch.payment?.paid !== undefined) row.payment_paid = patch.payment.paid
  fail((await supabase.from('orders').update(row).eq('id', id)).error, 'update this order')
}

export async function adminMarkPaid(id, { upiRef, verifiedBy } = {}) {
  guard()
  const row = {
    payment_paid: true,
    verified_by: verifiedBy || null,
    verified_at: new Date().toISOString(),
  }
  if (upiRef) row.upi_ref = upiRef
  fail((await supabase.from('orders').update(row).eq('id', id)).error, 'record this payment')

  // Only lift it out of the queue; a payment recorded on a shipped order should
  // not knock it back to "confirmed".
  const { data } = await supabase.from('orders').select('status').eq('id', id).single()
  if (data?.status === 'pending_payment') {
    fail(
      (await supabase.from('orders').update({ status: 'confirmed' }).eq('id', id)).error,
      'confirm this order'
    )
  }
}

/* ----------------------------------------------------------- settings --- */

export async function adminSaveSettings(settings) {
  guard()
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value, is_public: true }))
  fail((await supabase.from('store_settings').upsert(rows)).error, 'save settings')
}
