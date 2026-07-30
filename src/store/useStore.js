import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { PRODUCTS } from '../data/products'
import { COLLECTIONS } from '../data/collections'
import { ORDERS, CUSTOMERS, COUPONS, REVIEWS } from '../data/orders'
import { SETTINGS } from '../data/settings'

/**
 * One store, persisted to localStorage. Admin edits and storefront reads hit
 * the same objects, which is why editing a product in the dashboard changes the
 * shop grid immediately.
 *
 * Bump SCHEMA whenever the shape of seeded data changes — persisted state wins
 * over the seed, so without a bump an old cached catalogue would shadow new
 * code and the change would look like it silently failed.
 */
const SCHEMA = 4

const seed = () => ({
  products: structuredClone(PRODUCTS),
  collections: structuredClone(COLLECTIONS),
  orders: structuredClone(ORDERS),
  customers: structuredClone(CUSTOMERS),
  coupons: structuredClone(COUPONS),
  reviews: structuredClone(REVIEWS),
  settings: structuredClone(SETTINGS),
})

export const lineKey = (productId, colorwayCode) => `${productId}::${colorwayCode}`

export const useStore = create(
  persist(
    (set, get) => ({
      ...seed(),

      cart: [],
      wishlist: [],
      recentlyViewed: [],
      appliedCoupon: null,
      admin: { email: null },
      ui: { cartOpen: false, mobileNavOpen: false },

      /* ------------------------------------------------------------ ui --- */

      setCartOpen: (cartOpen) => set((s) => ({ ui: { ...s.ui, cartOpen } })),
      setMobileNav: (mobileNavOpen) => set((s) => ({ ui: { ...s.ui, mobileNavOpen } })),

      /* ---------------------------------------------------------- cart --- */

      addToCart: ({ productId, colorwayCode, qty = 1 }) => {
        const key = lineKey(productId, colorwayCode)
        set((s) => {
          const existing = s.cart.find((l) => l.key === key)
          const cart = existing
            ? s.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 20) } : l))
            : [...s.cart, { key, productId, colorwayCode, qty }]
          return { cart, ui: { ...s.ui, cartOpen: true } }
        })
      },

      setQty: (key, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((l) => l.key !== key)
              : s.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 20) } : l)),
        })),

      removeLine: (key) => set((s) => ({ cart: s.cart.filter((l) => l.key !== key) })),

      clearCart: () => set({ cart: [], appliedCoupon: null }),

      /* ------------------------------------------------------ wishlist --- */

      toggleWishlist: (productId) =>
        set((s) => ({
          wishlist: s.wishlist.includes(productId)
            ? s.wishlist.filter((id) => id !== productId)
            : [...s.wishlist, productId],
        })),

      markViewed: (productId) =>
        set((s) => ({
          recentlyViewed: [productId, ...s.recentlyViewed.filter((id) => id !== productId)].slice(0, 8),
        })),

      /* -------------------------------------------------------- coupon --- */

      applyCoupon: (code) => {
        const found = get().coupons.find(
          (c) => c.code.toLowerCase() === String(code).trim().toLowerCase() && c.active
        )
        if (!found) return { ok: false, message: 'That code is not active. Check the spelling?' }
        const { subtotal } = cartTotals(get())
        if (subtotal < found.minOrder)
          return {
            ok: false,
            message: `${found.code} needs a subtotal of ₹${found.minOrder}. You are ₹${
              found.minOrder - subtotal
            } short.`,
          }
        set({ appliedCoupon: found.code })
        return { ok: true, message: `${found.code} applied.` }
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      /* -------------------------------------------------------- orders --- */

      placeOrder: ({ customer, address, paymentMethod, shippingSpeed, notes, upiRef }) => {
        const s = get()
        const totals = cartTotals(s, { paymentMethod, shippingSpeed })
        const items = s.cart.map((line) => {
          const p = s.products.find((x) => x.id === line.productId)
          const c = p.colorways.find((x) => x.code === line.colorwayCode) || p.colorways[0]
          return {
            productId: p.id,
            name: p.name,
            slug: p.slug,
            colorwayCode: c.code,
            colorwayName: c.name,
            hex: c.hex,
            image: c.images[0],
            price: p.price,
            qty: line.qty,
          }
        })

        const id = `HA${Math.floor(30000 + Math.random() * 9000)}`
        const order = {
          id,
          createdAt: new Date().toISOString(),
          // A UPI order is not confirmed until someone has matched the UTR to
          // the bank statement, so it lands in the admin queue instead.
          status: paymentMethod === 'upi' ? 'pending_payment' : 'confirmed',
          customerId: null,
          customer,
          shippingAddress: address,
          items,
          payment: {
            method: paymentMethod,
            paid: false,
            upiRef: upiRef || null,
            verifiedBy: null,
          },
          totals,
          courier: null,
          awb: null,
          notes: notes || '',
          shippingSpeed,
        }

        // Stock comes down at order time, the same way it would server-side.
        const products = s.products.map((p) => {
          const lines = items.filter((it) => it.productId === p.id)
          if (!lines.length) return p
          return {
            ...p,
            colorways: p.colorways.map((c) => {
              const l = lines.find((it) => it.colorwayCode === c.code)
              return l ? { ...c, stock: Math.max(0, c.stock - l.qty) } : c
            }),
          }
        })

        set({ orders: [order, ...s.orders], products, cart: [], appliedCoupon: null })
        return order
      },

      updateOrder: (id, patch) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),

      markPaid: (id, { upiRef, verifiedBy = 'admin@hijabaura.in' } = {}) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: o.status === 'pending_payment' ? 'confirmed' : o.status,
                  payment: { ...o.payment, paid: true, upiRef: upiRef ?? o.payment.upiRef, verifiedBy },
                }
              : o
          ),
        })),

      /* ------------------------------------------------------ products --- */

      saveProduct: (product) =>
        set((s) => {
          const exists = s.products.some((p) => p.id === product.id)
          return {
            products: exists
              ? s.products.map((p) => (p.id === product.id ? product : p))
              : [{ ...product }, ...s.products],
          }
        }),

      createProduct: () => {
        const id = `p-${nanoid(8)}`
        const draft = {
          id,
          slug: `new-product-${id.slice(-4)}`,
          name: 'Untitled hijab',
          tagline: '',
          collection: 'everyday-modal',
          style: 'rectangle',
          occasion: ['everyday'],
          price: 999,
          mrp: 1399,
          fabric: 'Bamboo modal',
          composition: '',
          weave: 'plain',
          gsm: 120,
          size: { w: 75, l: 185 },
          weight: 140,
          origin: '',
          care: '',
          drape: { opacity: 90, fluid: 70, sheen: 20 },
          pinless: false,
          featured: false,
          published: false,
          rating: 0,
          reviewCount: 0,
          sold: 0,
          description: '',
          notes: [],
          colorways: [],
        }
        set((s) => ({ products: [draft, ...s.products] }))
        return draft
      },

      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      duplicateProduct: (id) => {
        const p = get().products.find((x) => x.id === id)
        if (!p) return null
        const copy = structuredClone(p)
        copy.id = `p-${nanoid(8)}`
        copy.slug = `${p.slug}-copy`
        copy.name = `${p.name} (copy)`
        copy.published = false
        copy.sold = 0
        copy.reviewCount = 0
        copy.rating = 0
        set((s) => ({ products: [copy, ...s.products] }))
        return copy
      },

      /* --------------------------------------------------- collections --- */

      saveCollection: (collection) =>
        set((s) => ({
          collections: s.collections.some((c) => c.slug === collection.slug)
            ? s.collections.map((c) => (c.slug === collection.slug ? collection : c))
            : [...s.collections, collection],
        })),

      deleteCollection: (slug) =>
        set((s) => ({ collections: s.collections.filter((c) => c.slug !== slug) })),

      /* ------------------------------------------------------- coupons --- */

      saveCoupon: (coupon) =>
        set((s) => ({
          coupons: s.coupons.some((c) => c.code === coupon.code)
            ? s.coupons.map((c) => (c.code === coupon.code ? coupon : c))
            : [coupon, ...s.coupons],
        })),

      deleteCoupon: (code) => set((s) => ({ coupons: s.coupons.filter((c) => c.code !== code) })),

      /* ------------------------------------------------------- reviews --- */

      setReviewPublished: (id, published) =>
        set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, published } : r)) })),

      deleteReview: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

      addReview: (review) =>
        set((s) => ({
          reviews: [
            { id: `r-${nanoid(6)}`, daysAgo: 0, verified: false, published: false, ...review },
            ...s.reviews,
          ],
        })),

      /* ------------------------------------------------------ settings --- */

      saveSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            brand: { ...s.settings.brand, ...(patch.brand || {}) },
            payments: { ...s.settings.payments, ...(patch.payments || {}) },
            shipping: { ...s.settings.shipping, ...(patch.shipping || {}) },
            returns: { ...s.settings.returns, ...(patch.returns || {}) },
            ops: { ...s.settings.ops, ...(patch.ops || {}) },
          },
        })),

      /* ---------------------------------------------------------- auth --- */

      // Mock gate only. Real auth arrives with the backend; nothing here is a
      // security boundary and the dashboard is not protecting real data yet.
      signIn: (email) => set({ admin: { email } }),
      signOut: () => set({ admin: { email: null } }),

      /* ---------------------------------------------------------- demo --- */

      resetDemoData: () => set({ ...seed(), cart: [], wishlist: [], appliedCoupon: null }),
    }),
    {
      name: 'hijabaura',
      version: SCHEMA,
      migrate: (state, version) => (version === SCHEMA ? state : { ...state, ...seed() }),
      partialize: (s) => {
        const { ui, ...rest } = s
        return rest
      },
    }
  )
)

/* ============================================================ selectors === */

export const cartLines = (s) =>
  s.cart
    .map((line) => {
      const product = s.products.find((p) => p.id === line.productId)
      if (!product) return null
      const colorway =
        product.colorways.find((c) => c.code === line.colorwayCode) || product.colorways[0]
      if (!colorway) return null
      return { ...line, product, colorway, lineTotal: product.price * line.qty }
    })
    .filter(Boolean)

export const cartCount = (s) => s.cart.reduce((n, l) => n + l.qty, 0)

/**
 * The single source of truth for pricing. Checkout, cart and the order record
 * all call this, so a change to the COD fee cannot drift between screens.
 */
export const cartTotals = (s, { paymentMethod = 'cod', shippingSpeed = 'standard' } = {}) => {
  const lines = cartLines(s)
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0)
  const { shipping: ship, payments } = s.settings

  const coupon = s.coupons.find((c) => c.code === s.appliedCoupon && c.active)
  let couponDiscount = 0
  let shippingWaived = false
  if (coupon && subtotal >= coupon.minOrder) {
    if (coupon.kind === 'percent') couponDiscount = Math.round((subtotal * coupon.value) / 100)
    else if (coupon.kind === 'flat') couponDiscount = Math.min(coupon.value, subtotal)
    else if (coupon.kind === 'shipping') shippingWaived = true
  }

  const prepaidDiscount =
    paymentMethod === 'upi' ? Math.round((subtotal * payments.prepaidDiscountPct) / 100) : 0

  const freeShip = subtotal >= ship.freeAbove || shippingWaived
  const baseShip = shippingSpeed === 'express' ? ship.expressFee : ship.standardFee
  const shipping = subtotal === 0 ? 0 : freeShip && shippingSpeed !== 'express' ? 0 : baseShip

  const codFee = paymentMethod === 'cod' ? payments.codFee : 0
  const discount = couponDiscount + prepaidDiscount

  return {
    subtotal,
    shipping,
    codFee,
    discount,
    couponDiscount,
    prepaidDiscount,
    couponCode: coupon?.code || null,
    freeShip,
    grand: Math.max(0, subtotal + shipping + codFee - discount),
    savings: lines.reduce((n, l) => n + Math.max(0, (l.product.mrp || 0) - l.product.price) * l.qty, 0),
  }
}

export const publishedProducts = (s) => s.products.filter((p) => p.published)

export const productBySlug = (s, slug) => s.products.find((p) => p.slug === slug)

export const stockOf = (product) =>
  (product?.colorways || []).reduce((n, c) => n + (Number(c.stock) || 0), 0)

export const reviewsFor = (s, productId) =>
  s.reviews.filter((r) => r.productId === productId && r.published)

export default useStore
