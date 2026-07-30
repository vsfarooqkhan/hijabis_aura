import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { SETTINGS } from '../data/settings'
import { fetchStorefront, fetchProducts, placeOrderRemote, validateCouponRemote } from '../lib/api'
import {
  adminFetchAll,
  adminSaveProduct,
  adminCreateProduct,
  adminDeleteProduct,
  adminSaveCollection,
  adminDeleteCollection,
  adminSaveCoupon,
  adminDeleteCoupon,
  adminSetReviewPublished,
  adminDeleteReview,
  adminUpdateOrder,
  adminMarkPaid,
  adminSaveSettings,
} from '../lib/adminApi'
import { supabase } from '../lib/supabase'

/**
 * One store, split by who owns the data.
 *
 *   Server-owned  products, collections, reviews, settings, orders, customers,
 *                 coupons. Fetched from Postgres, never persisted — a stale
 *                 local copy would shadow the database and make edits look
 *                 like they had silently failed.
 *
 *   Client-owned  cart, wishlist, recently viewed, the applied coupon, and a
 *                 short memory of orders you placed on this device. These are
 *                 persisted, because a guest's bag should survive a refresh and
 *                 there is no account to store it against.
 */
const SCHEMA = 5

export const lineKey = (productId, colorwayCode) => `${productId}::${colorwayCode}`

export const useStore = create(
  persist(
    (set, get) => ({
      /* ------------------------------------------------- server-owned --- */
      products: [],
      collections: [],
      reviews: [],
      // Seeded so the header, footer and page titles render correctly on the
      // very first paint, before the fetch lands. Replaced by the real row.
      settings: SETTINGS,
      orders: [],
      customers: [],
      coupons: [],

      status: 'idle', // idle | loading | ready | error
      error: null,
      adminStatus: 'idle',

      /* ------------------------------------------------- client-owned --- */
      cart: [],
      wishlist: [],
      recentlyViewed: [],
      // The validated coupon, as returned by the server: { code, kind, value }.
      appliedCoupon: null,
      // Orders placed on this device, so the confirmation and tracking screens
      // work without an account. Newest first, capped.
      recentOrders: [],
      admin: { email: null, userId: null },

      ui: { cartOpen: false, mobileNavOpen: false },

      /* ---------------------------------------------------------- ui --- */

      setCartOpen: (cartOpen) => set((s) => ({ ui: { ...s.ui, cartOpen } })),
      setMobileNav: (mobileNavOpen) => set((s) => ({ ui: { ...s.ui, mobileNavOpen } })),

      /* ----------------------------------------------------- loading --- */

      hydrate: async () => {
        if (get().status === 'loading') return
        set({ status: 'loading', error: null })
        try {
          const { products, collections, settings, reviews } = await fetchStorefront()
          set({ products, collections, reviews, settings, status: 'ready', error: null })
        } catch (err) {
          console.error('[Hijabisaura] Could not load the catalogue:', err)
          set({ status: 'error', error: err.message || String(err) })
        }
      },

      /** Pulls fresh stock and prices without blanking the screen. */
      refreshProducts: async () => {
        try {
          const includeDrafts = !!get().admin.email
          set({ products: await fetchProducts({ includeDrafts }) })
        } catch (err) {
          console.error('[Hijabisaura] Could not refresh products:', err)
        }
      },

      /* -------------------------------------------------------- cart --- */

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

      /* ---------------------------------------------------- wishlist --- */

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

      /* ------------------------------------------------------ coupon --- */

      // Coupons are never readable by the browser — the table is denied to anon.
      // The server validates and returns only what the cart needs to display.
      applyCoupon: async (code) => {
        const { subtotal } = cartTotals(get())
        try {
          const res = await validateCouponRemote(code, subtotal)
          if (res?.ok) {
            set({ appliedCoupon: { code: res.code, kind: res.kind, value: res.value } })
            return { ok: true, message: res.message }
          }
          return { ok: false, message: res?.message || 'That code could not be applied.' }
        } catch (err) {
          return { ok: false, message: err.message || 'Could not check that code just now.' }
        }
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      /**
       * Re-checks the held coupon against the current subtotal, and drops it if
       * it no longer qualifies — otherwise the cart would promise a discount
       * that checkout will refuse.
       */
      revalidateCoupon: async () => {
        const held = get().appliedCoupon
        if (!held) return
        const { subtotal } = cartTotals(get())
        try {
          const res = await validateCouponRemote(held.code, subtotal)
          if (!res?.ok) set({ appliedCoupon: null })
        } catch {
          // Leave it alone on a network blip; the server decides at checkout.
        }
      },

      /* ------------------------------------------------------ orders --- */

      /**
       * Sends items and an address; the database prices it. Nothing about money
       * crosses the wire, so a tampered request cannot change what it costs.
       */
      placeOrder: async ({ customer, address, paymentMethod, shippingSpeed, notes, upiRef }) => {
        const s = get()
        const lines = cartLines(s)
        const result = await placeOrderRemote({
          customer,
          address,
          paymentMethod,
          shippingSpeed,
          notes,
          upiRef,
          couponCode: s.appliedCoupon?.code || null,
          items: lines.map((l) => ({
            productId: l.productId,
            colorwayCode: l.colorwayCode,
            qty: l.qty,
          })),
        })

        // Kept locally so the confirmation screen renders immediately — an
        // anonymous visitor cannot read the orders table.
        const order = {
          id: result.order_id,
          createdAt: new Date().toISOString(),
          status: result.status,
          customer,
          shippingAddress: address,
          items: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            slug: l.product.slug,
            colorwayCode: l.colorway.code,
            colorwayName: l.colorway.name,
            hex: l.colorway.hex,
            image: l.colorway.images[0],
            price: l.product.price,
            qty: l.qty,
          })),
          payment: { method: paymentMethod, paid: false, upiRef: upiRef || null, verifiedBy: null },
          totals: {
            subtotal: result.subtotal,
            shipping: result.shipping,
            codFee: result.cod_fee,
            discount: result.discount,
            grand: result.grand_total,
          },
          shippingSpeed,
          courier: null,
          awb: null,
          notes: notes || '',
        }

        set((st) => ({
          cart: [],
          appliedCoupon: null,
          recentOrders: [order, ...st.recentOrders].slice(0, 10),
        }))

        // Stock has moved server-side; pull the new numbers.
        get().refreshProducts()
        return order
      },

      /* -------------------------------------------------------- admin --- */

      signIn: async (email, password) => {
        if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { ok: false, message: error.message }
        set({ admin: { email: data.user.email, userId: data.user.id } })
        return { ok: true }
      },

      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
        set({
          admin: { email: null, userId: null },
          orders: [],
          customers: [],
          coupons: [],
          adminStatus: 'idle',
        })
        get().refreshProducts()
      },

      /** Restores an existing session on boot, so a refresh does not sign you out. */
      restoreSession: async () => {
        if (!supabase) return
        const { data } = await supabase.auth.getSession()
        const user = data?.session?.user
        if (user) set({ admin: { email: user.email, userId: user.id } })
        else set({ admin: { email: null, userId: null } })
      },

      /** Loads everything the dashboard needs. Fails if you are not an admin. */
      hydrateAdmin: async () => {
        if (!get().admin.email) return
        set({ adminStatus: 'loading' })
        try {
          const all = await adminFetchAll()
          set({ ...all, adminStatus: 'ready', status: 'ready', error: null })
        } catch (err) {
          console.error('[Hijabisaura] Dashboard load failed:', err)
          set({ adminStatus: 'error', error: err.message })
        }
      },

      /* ------------------------------------------------- admin writes --- */
      //
      // Each of these writes to Postgres and then re-reads, so the screen always
      // shows what the database actually holds rather than what we hoped it
      // would hold. Every one throws if row level security refuses.

      saveProduct: async (product) => {
        await adminSaveProduct(product)
        await get().hydrateAdmin()
      },

      createProduct: async () => {
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
          size: { w: 75, l: 185, note: '' },
          weight: 140,
          origin: '',
          care: '',
          notes: [],
          warning: '',
          pinless: false,
          featured: false,
          published: false,
          rating: 0,
          reviewCount: 0,
          sold: 0,
          description: '',
          colorways: [],
        }
        await adminCreateProduct(draft)
        await get().hydrateAdmin()
        return draft
      },

      deleteProduct: async (id) => {
        await adminDeleteProduct(id)
        await get().hydrateAdmin()
      },

      duplicateProduct: async (id) => {
        const p = get().products.find((x) => x.id === id)
        if (!p) return null
        const copy = structuredClone(p)
        copy.id = `p-${nanoid(8)}`
        copy.slug = `${p.slug}-copy`.slice(0, 60)
        copy.name = `${p.name} (copy)`
        copy.published = false
        copy.sold = 0
        copy.reviewCount = 0
        copy.rating = 0
        await adminSaveProduct(copy)
        await get().hydrateAdmin()
        return copy
      },

      saveCollection: async (c) => {
        await adminSaveCollection(c)
        await get().hydrateAdmin()
      },

      deleteCollection: async (slug) => {
        await adminDeleteCollection(slug)
        await get().hydrateAdmin()
      },

      saveCoupon: async (c) => {
        await adminSaveCoupon(c)
        await get().hydrateAdmin()
      },

      deleteCoupon: async (code) => {
        await adminDeleteCoupon(code)
        await get().hydrateAdmin()
      },

      setReviewPublished: async (id, published) => {
        await adminSetReviewPublished(id, published)
        await get().hydrateAdmin()
      },

      deleteReview: async (id) => {
        await adminDeleteReview(id)
        await get().hydrateAdmin()
      },

      updateOrder: async (id, patch) => {
        await adminUpdateOrder(id, patch)
        await get().hydrateAdmin()
      },

      markPaid: async (id, opts = {}) => {
        await adminMarkPaid(id, { verifiedBy: get().admin.email, ...opts })
        await get().hydrateAdmin()
      },

      saveSettings: async (patch) => {
        const merged = {
          ...get().settings,
          ...patch,
          brand: { ...get().settings.brand, ...(patch.brand || {}) },
          payments: { ...get().settings.payments, ...(patch.payments || {}) },
          shipping: { ...get().settings.shipping, ...(patch.shipping || {}) },
          returns: { ...get().settings.returns, ...(patch.returns || {}) },
          ops: { ...get().settings.ops, ...(patch.ops || {}) },
        }
        await adminSaveSettings(merged)
        set({ settings: merged })
      },

      /** Clears only this browser's state. Server data is never reset from here. */
      resetDemoData: () => {
        set({ cart: [], wishlist: [], appliedCoupon: null, recentOrders: [], recentlyViewed: [] })
        return get().admin.email ? get().hydrateAdmin() : get().hydrate()
      },
    }),
    {
      name: 'hijabaura',
      version: SCHEMA,
      // Only client-owned state survives a refresh. Everything else is the
      // server's, and is re-fetched on boot.
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        recentlyViewed: s.recentlyViewed,
        appliedCoupon: s.appliedCoupon,
        recentOrders: s.recentOrders,
      }),
      migrate: () => ({}),
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
 * Pricing for display only. The database recomputes all of this in place_order,
 * and its answer is the one that counts — so if these two ever disagree, this
 * function is the one that is wrong.
 */
export const cartTotals = (s, { paymentMethod = 'cod', shippingSpeed = 'standard' } = {}) => {
  const lines = cartLines(s)
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0)
  const ship = s.settings?.shipping || SETTINGS.shipping
  const payments = s.settings?.payments || SETTINGS.payments

  const coupon = s.appliedCoupon
  let couponDiscount = 0
  let shippingWaived = false
  if (coupon) {
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

export const orderById = (s, id) => s.recentOrders.find((o) => o.id === id) || null

export default useStore
