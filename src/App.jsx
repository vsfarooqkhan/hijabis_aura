import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'

// The buying funnel loads eagerly — these are the pages that must feel instant.
import Home from './pages/Home'
import Shop from './pages/Shop'
import Collection from './pages/Collection'
import Product from './pages/Product'
import Cart from './pages/Cart'
import OrderConfirmation from './pages/OrderConfirmation'
import { NotFoundPage } from './pages/Misc'

/**
 * Everything below is split out. Each of these pulls in a dependency that
 * browsing never needs — Zod and react-hook-form for the forms, qrcode.react at
 * checkout, Recharts in the dashboard — so none of it lands in the first load.
 */
const Admin = lazy(() => import('./admin/AdminRoutes'))
const Checkout = lazy(() => import('./pages/Checkout'))
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Contact = lazy(() => import('./pages/About').then((m) => ({ default: m.Contact })))
const HowItFalls = lazy(() => import('./pages/Guides').then((m) => ({ default: m.HowItFalls })))
const Styling = lazy(() => import('./pages/Guides').then((m) => ({ default: m.Styling })))
const Care = lazy(() => import('./pages/Guides').then((m) => ({ default: m.Care })))
const SizeGuide = lazy(() => import('./pages/Guides').then((m) => ({ default: m.SizeGuide })))
const Faq = lazy(() => import('./pages/Guides').then((m) => ({ default: m.Faq })))
const Policy = lazy(() => import('./pages/Guides').then((m) => ({ default: m.Policy })))
const TrackOrder = lazy(() => import('./pages/Misc').then((m) => ({ default: m.TrackOrder })))
const Wishlist = lazy(() => import('./pages/Misc').then((m) => ({ default: m.Wishlist })))
const Search = lazy(() => import('./pages/Misc').then((m) => ({ default: m.Search })))

function Loading({ label = 'Loading…', full }) {
  return (
    <div className={full ? 'grid min-h-screen place-items-center bg-blush' : 'grid min-h-[60vh] place-items-center'}>
      <p className="font-mono text-2xs uppercase tracking-[0.16em] text-taupe">{label}</p>
    </div>
  )
}

/** Wraps a lazy page so every split route gets the same fallback. */
const page = (Component, label) => (
  <Suspense fallback={<Loading label={label} />}>
    <Component />
  </Suspense>
)

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="collections/:slug" element={<Collection />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="order/:id" element={<OrderConfirmation />} />

          <Route path="checkout" element={page(Checkout, 'Loading checkout…')} />
          <Route path="track" element={page(TrackOrder)} />
          <Route path="wishlist" element={page(Wishlist)} />
          <Route path="search" element={page(Search)} />
          <Route path="how-it-falls" element={page(HowItFalls)} />
          <Route path="styling" element={page(Styling)} />
          <Route path="care" element={page(Care)} />
          <Route path="size-guide" element={page(SizeGuide)} />
          <Route path="faq" element={page(Faq)} />
          <Route path="about" element={page(About)} />
          <Route path="contact" element={page(Contact)} />
          <Route path="policies/:slug" element={page(Policy)} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<Loading label="Loading dashboard…" full />}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#241A18',
            color: '#F7EFEC',
            borderRadius: 0,
            fontSize: 14,
            padding: '12px 16px',
            maxWidth: '30rem',
          },
          success: { iconTheme: { primary: '#B98D86', secondary: '#241A18' } },
          error: { iconTheme: { primary: '#9E3B32', secondary: '#F7EFEC' } },
        }}
      />
    </>
  )
}
