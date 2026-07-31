import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Layers, Ticket, Star, Settings,
  LogOut, Menu, X, ExternalLink, RotateCcw, AlertTriangle,
} from 'lucide-react'
import useStore, { publishedProducts, stockOf } from '../store/useStore'
import Logo from '../components/Logo'
import cx from '../lib/cx'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/collections', label: 'Collections', icon: Layers },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const admin = useStore((s) => s.admin)
  const signOut = useStore((s) => s.signOut)
  const resetDemoData = useStore((s) => s.resetDemoData)
  const orders = useStore((s) => s.orders)
  const products = useStore((s) => s.products)
  const reviews = useStore((s) => s.reviews)
  const threshold = useStore((s) => s.settings.ops.lowStockThreshold)
  const adminStatus = useStore((s) => s.adminStatus)
  const error = useStore((s) => s.error)
  const hydrateAdmin = useStore((s) => s.hydrateAdmin)

  useEffect(() => setOpen(false), [pathname])

  const badges = {
    '/admin/orders': orders.filter((o) => o.status === 'pending_payment').length,
    '/admin/products': products.filter((p) => p.published && stockOf(p) <= threshold).length,
    '/admin/reviews': reviews.filter((r) => !r.published).length,
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors',
              isActive ? 'bg-blush/10 text-blush' : 'text-blush/60 hover:bg-blush/5 hover:text-blush'
            )
          }
        >
          <item.icon size={16} strokeWidth={1.6} className="shrink-0" />
          <span className="flex-1">{item.label}</span>
          {badges[item.to] > 0 && (
            <span className="min-w-5 bg-gold px-1.5 py-0.5 text-center font-mono text-[10px] leading-none text-ink">
              {badges[item.to]}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-blush-warm/50 lg:flex">
      {/* --------------------------------------------------------- sidebar --- */}
      <aside className="hidden w-60 shrink-0 flex-col bg-ink lg:flex">
        <div className="border-b border-blush/10 px-4 py-5">
          <Link to="/admin">
            <Logo size="sm" tone="onInk" />
          </Link>
          <p className="mt-2 font-mono text-2xs uppercase tracking-[0.14em] text-gold">Dashboard</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">{nav}</div>

        <div className="space-y-1 border-t border-blush/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 px-1 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-blush/55 transition-colors hover:text-blush"
          >
            <ExternalLink size={13} />
            View storefront
          </Link>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Clear this browser\'s cart, saved items and recent orders, then reload from the database? Nothing on the server is changed.'
                )
              ) {
                resetDemoData()
                toast.success('Reloaded from the database')
              }
            }}
            className="flex w-full items-center gap-3 px-1 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-blush/55 transition-colors hover:text-blush"
          >
            <RotateCcw size={13} />
            Reload from database
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOut()
              navigate('/admin/login')
            }}
            className="flex w-full items-center gap-3 px-1 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-blush/55 transition-colors hover:text-blush"
          >
            <LogOut size={13} />
            Sign out
          </button>
          <p className="px-1 pt-2 font-mono text-2xs text-blush/35">{admin.email}</p>
        </div>
      </aside>

      {/* ------------------------------------------------------------ main --- */}
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-3 border-b border-ink/10 bg-blush px-4 py-3 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="p-1.5" aria-label="Open dashboard menu">
            <Menu size={20} />
          </button>
          <Logo size="sm" />
          <Link to="/" className="ml-auto p-1.5 text-taupe" aria-label="View storefront">
            <ExternalLink size={17} />
          </Link>
        </header>

        {/* A failed load would otherwise leave every table empty with the reason
            only in the console — the exact failure that made orders look lost. */}
        {adminStatus === 'error' ? (
          <div className="border-b border-clay/30 bg-clay-wash px-4 py-3 lg:px-8">
            <div className="flex items-start gap-2 text-clay-deep">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm">
                  Could not load the dashboard, so these tables are empty — this is not your data
                  missing.
                </p>
                <p className="mt-1 break-words font-mono text-2xs opacity-80">{error}</p>
                <button
                  type="button"
                  onClick={hydrateAdmin}
                  className="mt-2 font-mono text-2xs uppercase tracking-[0.12em] underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b border-gold/25 bg-gold-wash px-4 py-2.5 lg:px-8">
            <p className="flex items-start gap-2 font-mono text-2xs leading-relaxed text-gold-deep">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              Live data. Everything you change here is written to the database and is visible to
              customers immediately.
            </p>
          </div>
        )}

        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>

      {/* --------------------------------------------------------- drawer --- */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-blush/10 px-4 py-4">
                <Logo size="sm" tone="onInk" />
                <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-blush" aria-label="Close menu">
                  <X size={19} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">{nav}</div>
              <div className="border-t border-blush/10 p-3">
                <button
                  type="button"
                  onClick={async () => {
                    await signOut()
                    navigate('/admin/login')
                  }}
                  className="flex w-full items-center gap-3 px-1 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-blush/55"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
