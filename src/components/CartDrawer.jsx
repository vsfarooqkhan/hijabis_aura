import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ShoppingBag, Trash2, Truck } from 'lucide-react'
import useStore, { cartLines, cartTotals } from '../store/useStore'
import { money } from '../lib/format'
import { QtyStepper, EmptyState } from './ui'

export default function CartDrawer() {
  const open = useStore((s) => s.ui.cartOpen)
  const setCartOpen = useStore((s) => s.setCartOpen)
  const lines = useStore(cartLines)
  const totals = useStore((s) => cartTotals(s))
  const setQty = useStore((s) => s.setQty)
  const removeLine = useStore((s) => s.removeLine)
  const freeAbove = useStore((s) => s.settings.shipping.freeAbove)

  const toFree = Math.max(0, freeAbove - totals.subtotal)
  const progress = Math.min(100, (totals.subtotal / freeAbove) * 100)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ink/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col bg-blush"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Your bag"
          >
            <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="display-sm text-lg">
                Your bag
                {lines.length > 0 && (
                  <span className="ml-2 font-mono text-2xs text-taupe">
                    {lines.reduce((n, l) => n + l.qty, 0)} items
                  </span>
                )}
              </h2>
              <button type="button" onClick={() => setCartOpen(false)} className="p-2" aria-label="Close bag">
                <X size={20} />
              </button>
            </header>

            {lines.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Nothing in the bag yet"
                body="Start with the Everyday Modal — it is the one we would keep if we could only keep one."
                action={
                  <Link to="/shop" className="btn-ink" onClick={() => setCartOpen(false)}>
                    Shop all hijabs
                  </Link>
                }
              />
            ) : (
              <>
                {toFree > 0 ? (
                  <div className="border-b border-ink/10 px-5 py-3.5">
                    <p className="mb-2 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em] text-taupe">
                      <Truck size={13} className="text-gold-deep" />
                      {money(toFree)} more for free shipping
                    </p>
                    <div className="h-1 w-full bg-ink/10">
                      <div
                        className="h-full bg-rose transition-all duration-500 ease-drape"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 border-b border-ink/10 bg-rose-wash px-5 py-3 font-mono text-2xs uppercase tracking-[0.12em] text-rose-deep">
                    <Truck size={13} />
                    Free shipping unlocked
                  </p>
                )}

                <ul className="scroll-thin flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
                  {lines.map((line) => (
                    <li key={line.key} className="flex gap-3.5 py-4">
                      <Link
                        to={`/product/${line.product.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="w-20 shrink-0 bg-blush-warm"
                      >
                        <img
                          src={line.colorway.images[0]}
                          alt={line.product.name}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${line.product.slug}`}
                            onClick={() => setCartOpen(false)}
                            className="display-sm text-sm leading-snug"
                          >
                            {line.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="p-1 text-taupe transition-colors hover:text-clay"
                            aria-label={`Remove ${line.product.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 font-mono text-2xs text-taupe">
                          <span
                            className="inline-block h-2.5 w-2.5 border border-ink/15"
                            style={{ background: line.colorway.hex }}
                          />
                          {line.colorway.name} · {line.colorway.code}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <QtyStepper
                            value={line.qty}
                            onChange={(q) => setQty(line.key, q)}
                            size="sm"
                            max={Math.max(1, line.colorway.stock)}
                          />
                          <span className="font-mono text-sm tabular-nums">{money(line.lineTotal)}</span>
                        </div>

                        {line.colorway.stock <= 5 && (
                          <p className="mt-1.5 font-mono text-2xs text-gold-deep">
                            Only {line.colorway.stock} left in {line.colorway.name}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-ink/10 px-5 py-4">
                  <dl className="mb-4 space-y-1.5 text-sm">
                    <Row label="Subtotal" value={money(totals.subtotal)} />
                    {totals.savings > 0 && (
                      <Row label="You save" value={`−${money(totals.savings)}`} tone="rose" />
                    )}
                    <Row
                      label="Shipping"
                      value={totals.freeShip ? 'Free' : money(totals.shipping)}
                      tone={totals.freeShip ? 'rose' : undefined}
                    />
                  </dl>

                  <p className="mb-4 flex items-baseline justify-between border-t border-ink/10 pt-3">
                    <span className="display-sm text-base">Total</span>
                    <span className="font-mono text-xl tabular-nums">
                      {money(totals.subtotal + totals.shipping)}
                    </span>
                  </p>

                  <Link to="/checkout" className="btn-ink w-full" onClick={() => setCartOpen(false)}>
                    Checkout
                  </Link>
                  <Link
                    to="/cart"
                    className="btn-ghost mt-1 w-full justify-center"
                    onClick={() => setCartOpen(false)}
                  >
                    View full bag
                  </Link>
                  <p className="mt-3 text-center font-mono text-2xs text-taupe">
                    Pay by UPI · 5% off
                  </p>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink/65">{label}</dt>
      <dd className={tone === 'rose' ? 'font-mono tabular-nums text-rose' : 'font-mono tabular-nums'}>
        {value}
      </dd>
    </div>
  )
}
