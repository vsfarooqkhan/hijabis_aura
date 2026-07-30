import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
import Layout from './components/Layout'
import useStore from './store/useStore'

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

/** Shown only if the catalogue cannot be reached at all. */
function CatalogueDown({ message, onRetry }) {
  return (
    <div className="grid min-h-screen place-items-center bg-blush px-6">
      <div className="max-w-md text-center">
        <AlertTriangle size={24} className="mx-auto mb-5 text-gold-deep" strokeWidth={1.5} />
        <h1 className="display-sm text-xl">We cannot reach the catalogue</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          The shop is up but the product data did not load. This is usually a connection blip.
        </p>
        <button type="button" onClick={onRetry} className="btn-ink mt-6">
          Try again
        </button>
        {message && (
          <p className="mt-6 break-words font-mono text-2xs leading-relaxed text-taupe">{message}</p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const status = useStore((s) => s.status)
  const error = useStore((s) => s.error)
  const hydrate = useStore((s) => s.hydrate)
  const restoreSession = useStore((s) => s.restoreSession)

  // The catalogue lives in Postgres now, so it has to be fetched before the
  // storefront can render anything. The admin session is restored in parallel so
  // a refresh inside the dashboard does not sign you out.
  useEffect(() => {
    hydrate()
    restoreSession()
  }, [hydrate, restoreSession])

  if (status === 'idle' || status === 'loading') {
    return <Loading label="Loading the catalogue…" full />
  }

  if (status === 'error') {
    return <CatalogueDown message={error} onRetry={hydrate} />
  }

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
