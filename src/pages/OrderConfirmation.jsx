import { Link, useParams } from 'react-router-dom'
import { Check, Package, Truck, Home, Clock, Instagram, MessageCircle } from 'lucide-react'
import useStore from '../store/useStore'
import { money, dateLong } from '../lib/format'
import { statusMeta, FULFILMENT_STEPS } from '../data/settings'
import { Badge, Eyebrow } from '../components/ui'
import NotFound from './NotFound'
import cx from '../lib/cx'

const STEP_ICONS = { confirmed: Check, packed: Package, shipped: Truck, delivered: Home }

export default function OrderConfirmation() {
  const { id } = useParams()
  const order = useStore((s) => s.orders.find((o) => o.id === id))
  const brand = useStore((s) => s.settings.brand)
  const settings = useStore((s) => s.settings)

  if (!order) return <NotFound />

  const meta = statusMeta(order.status)
  const awaiting = order.status === 'pending_payment'
  const stepIndex = FULFILMENT_STEPS.indexOf(order.status)

  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-20">
        <div className="shell max-w-3xl">
          <Eyebrow onInk className="mb-4 text-gold">
            Order {order.id} · {dateLong(order.createdAt)}
          </Eyebrow>
          <h1 className="text-[2.2rem] leading-tight md:text-[3rem]">
            {awaiting ? 'Thank you — we are verifying your payment' : 'Thank you. Your order is in.'}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-blush/70">
            {awaiting ? (
              <>
                We have your UPI reference{' '}
                <span className="font-mono text-blush">{order.payment.upiRef}</span> and are matching
                it against our account. That usually takes a few hours; you will get an email at{' '}
                <span className="text-blush">{order.customer.email}</span> the moment it clears.
              </>
            ) : (
              <>
                A confirmation is on its way to{' '}
                <span className="text-blush">{order.customer.email}</span>. We dispatch from Mumbai —{' '}
                {settings.shipping.dispatchNote.toLowerCase()}
              </>
            )}
          </p>
        </div>
      </header>

      <div className="shell max-w-3xl py-12 md:py-16">
        {/* ------------------------------------------------------- tracker --- */}
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="display-sm text-xl">Where it is</h2>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>

          {awaiting ? (
            <div className="flex gap-3.5 border border-gold/30 bg-gold-wash p-5">
              <Clock size={18} className="mt-0.5 shrink-0 text-gold-deep" />
              <div>
                <p className="text-sm text-gold-deep">Payment under verification</p>
                <p className="mt-1 font-mono text-2xs leading-relaxed text-gold-deep/80">
                  We check every UPI payment by hand against our bank statement. Nothing is packed
                  until it clears — and nothing is charged twice.
                </p>
              </div>
            </div>
          ) : (
            <ol className="grid gap-3 sm:grid-cols-4">
              {FULFILMENT_STEPS.map((key, i) => {
                const Icon = STEP_ICONS[key]
                const done = stepIndex >= i
                const current = stepIndex === i
                return (
                  <li
                    key={key}
                    className={cx(
                      'border p-4 transition-colors',
                      done ? 'border-rose/35 bg-rose-wash' : 'border-ink/12'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Icon size={16} className={done ? 'text-rose-deep' : 'text-taupe-light'} />
                      <span
                        className={cx(
                          'font-mono text-2xs',
                          done ? 'text-rose-deep' : 'text-taupe-light'
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p
                      className={cx(
                        'mt-2.5 font-mono text-2xs uppercase tracking-[0.1em]',
                        done ? 'text-rose-deep' : 'text-taupe'
                      )}
                    >
                      {statusMeta(key).label}
                    </p>
                    {current && (
                      <p className="mt-1 font-mono text-2xs text-taupe">You are here</p>
                    )}
                  </li>
                )
              })}
            </ol>
          )}

          {order.awb && (
            <p className="mt-4 font-mono text-2xs text-taupe">
              {order.courier} · AWB {order.awb}
            </p>
          )}
        </section>

        {/* --------------------------------------------------------- items --- */}
        <section className="mb-12">
          <h2 className="display-sm mb-5 text-xl">What is coming</h2>
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {order.items.map((it) => (
              <li key={`${it.productId}-${it.colorwayCode}`} className="flex gap-4 py-4">
                <Link to={`/product/${it.slug}`} className="w-20 shrink-0 bg-blush-warm">
                  <img src={it.image} alt="" className="aspect-[3/4] w-full object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div>
                    <Link to={`/product/${it.slug}`} className="display-sm text-[15px] link-selvedge">
                      {it.name}
                    </Link>
                    <p className="mt-1.5 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
                      <span
                        className="inline-block h-3 w-3 border border-ink/15"
                        style={{ background: it.hex }}
                        aria-hidden="true"
                      />
                      {it.colorwayName} · {it.colorwayCode}
                    </p>
                    <p className="mt-1 font-mono text-2xs text-taupe">Quantity {it.qty}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm tabular-nums">
                    {money(it.price * it.qty)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------- money + address --- */}
        <div className="grid gap-8 sm:grid-cols-2">
          <section>
            <h2 className="display-sm mb-4 text-lg">Payment</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={money(order.totals.subtotal)} />
              {order.totals.discount > 0 && (
                <Row label="Discounts" value={`−${money(order.totals.discount)}`} tone="rose" />
              )}
              <Row
                label="Shipping"
                value={order.totals.shipping === 0 ? 'Free' : money(order.totals.shipping)}
              />
              {order.totals.codFee > 0 && <Row label="COD handling" value={money(order.totals.codFee)} />}
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-2.5">
                <dt className="display-sm text-base">
                  {order.payment.method === 'cod' ? 'Pay on delivery' : 'Paid by UPI'}
                </dt>
                <dd className="font-mono text-lg tabular-nums">{money(order.totals.grand)}</dd>
              </div>
            </dl>

            {order.payment.method === 'cod' && (
              <p className="mt-3 font-mono text-2xs leading-relaxed text-taupe">
                Keep {money(order.totals.grand)} ready for the courier. Most of them accept UPI at the
                door as well.
              </p>
            )}
          </section>

          <section>
            <h2 className="display-sm mb-4 text-lg">Delivering to</h2>
            <address className="text-sm not-italic leading-relaxed text-ink/75">
              {order.customer.name}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.landmark && (
                <>
                  {order.shippingAddress.landmark}
                  <br />
                </>
              )}
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.pincode}
              <br />
              <span className="font-mono text-2xs text-taupe">{order.customer.phone}</span>
            </address>

            {order.notes && (
              <p className="mt-3 border-l-2 border-gold/40 pl-3 font-mono text-2xs leading-relaxed text-taupe">
                “{order.notes}”
              </p>
            )}
          </section>
        </div>

        {/* ---------------------------------------------------------- next --- */}
        <section className="mt-12 border-t border-ink/10 pt-10">
          <div className="flex flex-wrap gap-3">
            <Link to="/shop" className="btn-ink">
              Keep shopping
            </Link>
            <Link to="/track" className="btn-outline">
              Track this order
            </Link>
            <a
              href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(
                `Salaam, I have a question about order ${order.id}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              <MessageCircle size={15} />
              WhatsApp us about it
            </a>
          </div>

          <p className="mt-8 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em] text-gold-deep">
            <Instagram size={14} />
            Tag @{brand.instagram} when it arrives and we will repost you
          </p>
        </section>
      </div>
    </>
  )
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink/65">{label}</dt>
      <dd className={tone === 'rose' ? 'font-mono tabular-nums text-rose' : 'font-mono tabular-nums'}>
        {value}
      </dd>
    </div>
  )
}
