import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, ShoppingBag, Heart, Menu, X, Instagram, LayoutDashboard } from 'lucide-react'
import Logo from './Logo'
import cx from '../lib/cx'
import useStore, { cartCount } from '../store/useStore'

const NAV = [
  { to: '/shop', label: 'Shop all' },
  { to: '/collections/everyday-modal', label: 'Everyday' },
  { to: '/collections/occasion-satin', label: 'Occasion' },
  { to: '/collections/bridal-atelier', label: 'Bridal' },
  { to: '/how-it-falls', label: 'How it falls' },
  { to: '/about', label: 'Our story' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const count = useStore(cartCount)
  const wishCount = useStore((s) => s.wishlist.length)
  const setCartOpen = useStore((s) => s.setCartOpen)
  const mobileOpen = useStore((s) => s.ui.mobileNavOpen)
  const setMobileNav = useStore((s) => s.setMobileNav)
  const brand = useStore((s) => s.settings.brand)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the sheet on navigation, or it stays open over the new page.
  useEffect(() => {
    setMobileNav(false)
    setSearchOpen(false)
  }, [pathname, setMobileNav])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const submitSearch = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
    setQ('')
  }

  return (
    <>
      {/* The announcement rail carries the two things that actually convert. */}
      <div className="bg-ink text-blush">
        <div className="shell flex h-9 items-center justify-between gap-4 text-2xs">
          <p className="font-mono tracking-[0.12em]">
            FREE SHIPPING OVER ₹999 · COD ACROSS INDIA
          </p>
          <a
            href={brand.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 font-mono tracking-[0.12em] transition-colors hover:text-rose-light sm:flex"
          >
            <Instagram size={12} />@{brand.instagram}
          </a>
        </div>
      </div>

      <header
        className={cx(
          'sticky top-0 z-40 border-b bg-blush/95 backdrop-blur transition-shadow duration-300',
          scrolled ? 'border-ink/10 shadow-[0_1px_20px_-8px_rgba(36,26,24,0.25)]' : 'border-transparent'
        )}
      >
        <div className="shell flex h-16 items-center gap-3 md:h-20">
          {/* Visible at every width. The inline nav below only carries six of
              the twenty pages, so on desktop this panel is the only way to
              reach styling, care, sizing, tracking and support without
              scrolling to the footer. */}
          <button
            type="button"
            className="-ml-2 flex items-center gap-2 p-2 transition-colors hover:text-rose"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
            <span className="eyebrow hidden xl:inline">Menu</span>
          </button>

          <Link to="/" className="mr-auto" aria-label={`${brand.name} home`}>
            <Logo size="md" />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'link-selvedge text-[13px] tracking-wide transition-colors',
                    isActive ? 'text-rose' : 'text-ink/75 hover:text-ink'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 lg:ml-6">
            <button
              type="button"
              className="p-2.5 text-ink/70 transition-colors hover:text-ink"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search size={18} />
            </button>

            <Link
              to="/wishlist"
              className="relative p-2.5 text-ink/70 transition-colors hover:text-ink"
              aria-label={`Saved, ${wishCount} items`}
            >
              <Heart size={18} />
              {wishCount > 0 && <Dot>{wishCount}</Dot>}
            </Link>

            <button
              type="button"
              className="relative p-2.5 text-ink/70 transition-colors hover:text-ink"
              onClick={() => setCartOpen(true)}
              aria-label={`Bag, ${count} items`}
            >
              <ShoppingBag size={18} />
              {count > 0 && <Dot>{count}</Dot>}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-ink/10 bg-blush"
            >
              <form onSubmit={submitSearch} className="shell flex items-center gap-3 py-4">
                <Search size={17} className="shrink-0 text-taupe" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by fabric, colour or name — try 'modal' or 'crinkle'"
                  className="field flex-1 border-none py-1 text-[15px]"
                  aria-label="Search products"
                />
                <button type="submit" className="btn-ghost font-mono text-2xs uppercase tracking-[0.14em]">
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <NavPanel open={mobileOpen} onClose={() => setMobileNav(false)} brand={brand} />
    </>
  )
}

function Dot({ children }) {
  return (
    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 font-mono text-[10px] leading-none text-white">
      {children}
    </span>
  )
}

function NavPanel({ open, onClose, brand }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.nav
            className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-blush lg:max-w-md"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Main menu"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <Logo size="sm" />
              <button type="button" onClick={onClose} className="p-2" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto px-5 py-6">
              <h2 className="eyebrow mb-2 text-gold-deep">Shop</h2>
              <ul>
                {[
                  ['/shop', 'Shop all hijabs'],
                  ['/collections/everyday-modal', 'Everyday Modal'],
                  ['/collections/crinkle-chiffon', 'Crinkle & Chiffon'],
                  ['/collections/occasion-satin', 'Occasion & Satin'],
                  ['/collections/jersey-instant', 'Jersey & Instant'],
                  ['/collections/bridal-atelier', 'Bridal Atelier'],
                  ['/collections/essentials', 'Essentials'],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="display-sm block py-2 text-lg transition-colors hover:text-rose"
                      onClick={onClose}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              <hr className="my-6 border-ink/10" />

              <h2 className="eyebrow mb-2 text-gold-deep">Know the cloth</h2>
              <ul>
                {[
                  ['/how-it-falls', 'How it falls'],
                  ['/styling', 'How to wear it'],
                  ['/care', 'Fabric care'],
                  ['/size-guide', 'Size guide'],
                  ['/about', 'Our story'],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="display-sm block py-2 text-lg transition-colors hover:text-rose"
                      onClick={onClose}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              <hr className="my-6 border-ink/10" />

              <h2 className="eyebrow mb-3 text-gold-deep">Help</h2>
              <ul className="space-y-3 text-sm text-ink/70">
                {[
                  ['/track', 'Track an order'],
                  ['/wishlist', 'Saved items'],
                  ['/faq', 'FAQ'],
                  ['/contact', 'Contact us'],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} onClick={onClose} className="transition-colors hover:text-rose">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-ink/10 px-5 py-4">
              <a
                href={brand.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-3 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.14em] text-gold-deep"
              >
                <Instagram size={14} />@{brand.instagram}
              </a>
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.14em] text-taupe"
              >
                <LayoutDashboard size={14} />
                Admin dashboard
              </Link>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
