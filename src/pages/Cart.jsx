import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShoppingBag, Trash2, Truck, Tag, X, BadgeIndianRupee } from 'lucide-react'
import useStore, { cartLines, cartTotals } from '../store/useStore'
import { money } from '../lib/format'
import { EmptyState, Eyebrow, QtyStepper, PriceTag } from '../components/ui'
import ProductCard from '../components/ProductCard'

export default function Cart() {
  const lines = useStore(cartLines)
  const totals = useStore((s) => cartTotals(s))
  const setQty = useStore((s) => s.setQty)
  const removeLine = useStore((s) => s.removeLine)
  const applyCoupon = useStore((s) => s.applyCoupon)
  const removeCoupon = useStore((s) => s.removeCoupon)
  const revalidateCoupon = useStore((s) => s.revalidateCoupon)
  const settings = useStore((s) => s.settings)
  const products = useStore((s) => s.products.filter((p) => p.published))
  const recent = useStore((s) => s.recentlyViewed)

  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)

  const submitCoupon = async (e) => {
    e.preventDefault()
    setChecking(true)
    const res = await applyCoupon(code)
    setChecking(false)
    if (res.ok) {
      toast.success(res.message)
      setCode('')
    } else {
      toast.error(res.message)
    }
  }

  // The bag can change after a code is applied, so re-check it against the new
  // subtotal rather than promising a discount checkout will refuse.
  useEffect(() => {
    revalidateCoupon()
  }, [totals.subtotal, revalidateCoupon])

  const suggestions = products
    .filter((p) => p.collection === 'essentials' && !lines.some((l) => l.productId === p.id))
    .slice(0, 4)

  if (lines.length === 0) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          body="Start with the Mahd Modal — it is the one we would keep if we could only keep one."
          action={
            <Link to="/shop" className="btn-ink">
              Shop all hijabs
            </Link>
          }
        />
        {recent.length > 0 && (
          <section className="mt-16">
            <h2 className="eyebrow mb-6">Recently viewed</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {recent
                .map((id) => products.find((p) => p.id === id))
                .filter(Boolean)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  const toFree = Math.max(0, settings.shipping.freeAbove - totals.subtotal)

  return (
    <div className="shell py-12 md:py-16">
      <Eyebrow className="mb-3">
        {lines.reduce((n, l) => n + l.qty, 0)} items · {money(totals.subtotal)} before shipping
      </Eyebrow>
      <h1 className="text-[2.2rem] md:text-[2.8rem]">Your bag</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <div>
          {toFree > 0 && (
            <p className="mb-6 flex items-center gap-2.5 border border-gold/30 bg-gold-wash px-4 py-3 text-sm text-gold-deep">
              <Truck size={16} className="shrink-0" />
              Add {money(toFree)} more and shipping is on us.
            </p>
          )}

          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-4 py-6">
                <Link to={`/product/${line.product.slug}`} className="w-24 shrink-0 bg-blush-warm sm:w-32">
                  <img
                    src={line.colorway.images[0]}
                    alt={line.product.name}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="display-sm text-[17px] leading-snug">
                        <Link to={`/product/${line.product.slug}`} className="link-selvedge">
                          {line.product.name}
                        </Link>
                      </h2>
                      <p className="mt-1.5 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
                        <span
                          className="inline-block h-3 w-3 border border-ink/15"
                          style={{ background: line.colorway.hex }}
                          aria-hidden="true"
                        />
                        {line.colorway.name} · {line.colorway.code}
                      </p>
                      <p className="mt-1 font-mono text-2xs text-taupe">
                        {line.product.fabric}
                        {line.product.gsm > 0 && ` · ${line.product.gsm} GSM`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        removeLine(line.key)
                        toast('Removed from bag')
                      }}
                      className="shrink-0 p-1.5 text-taupe transition-colors hover:text-clay"
                      aria-label={`Remove ${line.product.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                    <QtyStepper
                      value={line.qty}
                      onChange={(q) => setQty(line.key, q)}
                      max={Math.max(1, line.colorway.stock)}
                    />
                    <div className="text-right">
                      <PriceTag price={line.product.price} mrp={line.product.mrp} />
                      <p className="mt-1 font-mono text-sm tabular-nums">{money(line.lineTotal)}</p>
                    </div>
                  </div>

                  {line.colorway.stock <= 5 && (
                    <p className="mt-2 font-mono text-2xs text-gold-deep">
                      Only {line.colorway.stock} left in {line.colorway.name}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <Link to="/shop" className="btn-ghost mt-6 pl-0">
            ← Keep shopping
          </Link>
        </div>

        {/* ------------------------------------------------------ summary --- */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-ink/12 bg-white p-6">
            <h2 className="display-sm mb-5 text-lg">Order summary</h2>

            <form onSubmit={submitCoupon} className="mb-5">
              <label htmlFor="coupon" className="spec-key mb-2 block">
                Discount code
              </label>
              {totals.couponCode ? (
                <div className="flex items-center justify-between gap-2 border border-rose/30 bg-rose-wash px-3 py-2.5">
                  <span className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.1em] text-rose-deep">
                    <Tag size={13} />
                    {totals.couponCode} applied
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon()
                      toast('Discount code removed')
                    }}
                    className="p-0.5 text-rose-deep"
                    aria-label="Remove discount code"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="AURA10"
                    className="field-boxed font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={checking}
                    className="btn-outline px-4 py-2.5 text-2xs uppercase tracking-[0.12em]"
                  >
                    {checking ? 'Checking…' : 'Apply'}
                  </button>
                </div>
              )}
            </form>

            <dl className="space-y-2.5 border-t border-ink/10 pt-4 text-sm">
              <Row label="Subtotal" value={money(totals.subtotal)} />
              {totals.savings > 0 && (
                <Row label="Off list price" value={`−${money(totals.savings)}`} tone="rose" />
              )}
              {totals.couponDiscount > 0 && (
                <Row label={`Code ${totals.couponCode}`} value={`−${money(totals.couponDiscount)}`} tone="rose" />
              )}
              <Row
                label="Shipping"
                value={totals.freeShip ? 'Free' : money(totals.shipping)}
                tone={totals.freeShip ? 'rose' : undefined}
              />
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
              <span className="display-sm text-lg">Total</span>
              <span className="font-mono text-2xl tabular-nums">
                {money(totals.subtotal + totals.shipping - totals.couponDiscount)}
              </span>
            </div>

            <p className="mt-2 flex items-start gap-1.5 font-mono text-2xs leading-relaxed text-taupe">
              <BadgeIndianRupee size={13} className="mt-0.5 shrink-0 text-gold-deep" />
              Pay by UPI at checkout and take another{' '}
              {settings.payments.prepaidDiscountPct}% off.
            </p>

            <Link to="/checkout" className="btn-ink mt-5 w-full">
              Checkout
            </Link>

            <p className="mt-3 text-center font-mono text-2xs text-taupe">
              {settings.returns.windowDays}-day returns · Ships from Mumbai
            </p>
          </div>
        </aside>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-20 border-t border-ink/10 pt-14">
          <h2 className="eyebrow mb-6">Add the layer underneath</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
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
