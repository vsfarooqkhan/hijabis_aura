import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import {
  BadgeIndianRupee, ShieldCheck, Truck, Zap, Copy, Check, ArrowLeft, Lock, Smartphone,
} from 'lucide-react'
import useStore, { cartLines, cartTotals } from '../store/useStore'
import { money } from '../lib/format'
import { buildUpiLink, buildAppLink, isValidUtr, UPI_APPS } from '../lib/upi'
import { Eyebrow, Field, Select, Checkbox, EmptyState } from '../components/ui'
import cx from '../lib/cx'
import { ShoppingBag } from 'lucide-react'

const schema = z.object({
  name: z.string().trim().min(2, 'Tell us who to address the parcel to.'),
  email: z.string().trim().email('We send the tracking link here.'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'A 10-digit Indian mobile number, starting 6–9.'),
  line1: z.string().trim().min(6, 'Flat, building and street.'),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'Which city?'),
  state: z.string().trim().min(2, 'Which state?'),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Six digits, not starting with zero.'),
  notes: z.string().trim().optional(),
})

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export default function Checkout() {
  const navigate = useNavigate()
  const lines = useStore(cartLines)
  const settings = useStore((s) => s.settings)
  const placeOrder = useStore((s) => s.placeOrder)

  const [method, setMethod] = useState(settings.payments.upiEnabled ? 'upi' : 'cod')
  const [speed, setSpeed] = useState('standard')
  const [stage, setStage] = useState('details') // details → pay → done
  const [draft, setDraft] = useState(null)
  const [utr, setUtr] = useState('')
  const [copied, setCopied] = useState(false)
  const [sameAsShipping, setSameAsShipping] = useState(true)

  const totals = useStore((s) => cartTotals(s, { paymentMethod: method, shippingSpeed: speed }))

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { state: 'Maharashtra' },
  })

  const codBlocked =
    method === 'cod' &&
    (totals.subtotal < settings.payments.codMinOrder || totals.subtotal > settings.payments.codMaxOrder)

  const upiLink = useMemo(
    () =>
      buildUpiLink({
        vpa: settings.payments.upiVpa,
        name: settings.payments.upiPayeeName,
        amount: totals.grand,
        orderId: draft?.ref || 'HA-NEW',
      }),
    [settings.payments, totals.grand, draft]
  )

  if (lines.length === 0 && stage !== 'done') {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to check out"
          body="Your bag is empty. Pick something first and we will hold your place here."
          action={
            <Link to="/shop" className="btn-ink">
              Shop all hijabs
            </Link>
          }
        />
      </div>
    )
  }

  const onSubmit = (values) => {
    if (codBlocked) {
      toast.error(
        `COD is available between ${money(settings.payments.codMinOrder)} and ${money(
          settings.payments.codMaxOrder
        )}. Switch to UPI for this order.`
      )
      return
    }

    const payload = {
      customer: { name: values.name, email: values.email, phone: `+91 ${values.phone}` },
      address: {
        line1: values.line1,
        landmark: values.landmark || '',
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
      paymentMethod: method,
      shippingSpeed: speed,
      notes: values.notes || '',
    }

    if (method === 'cod') {
      const order = placeOrder(payload)
      navigate(`/order/${order.id}`, { replace: true })
      return
    }

    // UPI: hold the details, show the QR, and only write the order once the
    // customer submits a UTR — otherwise every abandoned QR screen becomes a
    // ghost order in the admin queue.
    setDraft({ ...payload, ref: `HA${Math.floor(30000 + Math.random() * 9000)}` })
    setStage('pay')
    window.scrollTo({ top: 0 })
  }

  const confirmUpi = () => {
    if (!isValidUtr(utr)) {
      toast.error('The UPI reference is 12 digits. You will find it in your payment app history.')
      return
    }
    const order = placeOrder({ ...draft, upiRef: utr.trim() })
    navigate(`/order/${order.id}`, { replace: true })
  }

  const copyVpa = async () => {
    try {
      await navigator.clipboard.writeText(settings.payments.upiVpa)
      setCopied(true)
      toast.success('UPI ID copied')
      setTimeout(() => setCopied(false), 2200)
    } catch {
      toast.error('Could not copy — long-press the ID to select it.')
    }
  }

  /* ------------------------------------------------------------- pay step --- */

  if (stage === 'pay' && draft) {
    return (
      <div className="shell max-w-3xl py-12 md:py-16">
        <button
          type="button"
          onClick={() => setStage('details')}
          className="btn-ghost mb-6 pl-0"
        >
          <ArrowLeft size={15} />
          Back to delivery details
        </button>

        <Eyebrow className="mb-3">Step 2 of 2 · Payment</Eyebrow>
        <h1 className="text-[2rem] md:text-[2.6rem]">Pay {money(totals.grand)} by UPI</h1>
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-ink/70">
          Scan the code with any UPI app, or tap through on your phone. Once you have paid, enter the
          12-digit reference below so we can match it against our account and release your parcel.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-[auto_1fr] md:gap-12">
          <div className="mx-auto w-full max-w-[15rem]">
            <div className="border border-ink/12 bg-white p-5">
              <QRCodeSVG
                value={upiLink}
                size={200}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#241A18"
                className="h-auto w-full"
                title={`UPI payment of ${money(totals.grand)} to ${settings.payments.upiVpa}`}
              />
            </div>
            <p className="mt-3 text-center font-mono text-2xs uppercase tracking-[0.12em] text-taupe">
              Amount and note are pre-filled
            </p>
          </div>

          <div>
            <div className="border border-ink/12 bg-blush-warm p-5">
              <p className="spec-key mb-1.5">Paying to</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-[15px]">{settings.payments.upiVpa}</code>
                <button
                  type="button"
                  onClick={copyVpa}
                  className="p-1 text-taupe transition-colors hover:text-ink"
                  aria-label="Copy UPI ID"
                >
                  {copied ? <Check size={14} className="text-rose" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="mt-1 font-mono text-2xs text-taupe">{settings.payments.upiPayeeName}</p>

              <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/65">Amount</dt>
                  <dd className="font-mono tabular-nums">{money(totals.grand)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/65">Reference</dt>
                  <dd className="font-mono">{draft.ref}</dd>
                </div>
              </dl>
            </div>

            <p className="mt-6 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em] text-taupe md:hidden">
              <Smartphone size={13} />
              Or open your app directly
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 md:hidden">
              {UPI_APPS.map((app) => (
                <a
                  key={app.key}
                  href={buildAppLink(app, {
                    vpa: settings.payments.upiVpa,
                    name: settings.payments.upiPayeeName,
                    amount: totals.grand,
                    orderId: draft.ref,
                  })}
                  className="btn-outline py-3 text-2xs uppercase tracking-[0.1em]"
                >
                  {app.label}
                </a>
              ))}
            </div>

            <div className="mt-8">
              <label htmlFor="utr" className="label">
                UPI reference number (UTR)
              </label>
              <input
                id="utr"
                inputMode="numeric"
                maxLength={12}
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                placeholder="123456789012"
                className="field-boxed font-mono tabular-nums tracking-widest"
              />
              <p className="mt-1.5 font-mono text-2xs text-taupe">
                12 digits, from your payment app’s transaction history.
              </p>

              <button type="button" onClick={confirmUpi} className="btn-ink mt-4 w-full">
                <Lock size={15} />
                I have paid — place my order
              </button>

              <p className="mt-3 font-mono text-2xs leading-relaxed text-taupe">
                We verify every UPI payment by hand against our bank statement, usually within a few
                hours. Nothing ships before it clears.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* --------------------------------------------------------- details step --- */

  return (
    <div className="shell py-12 md:py-16">
      <Eyebrow className="mb-3">Step 1 of 2 · Delivery</Eyebrow>
      <h1 className="text-[2.2rem] md:text-[2.8rem]">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <div className="min-w-0 space-y-10">
          {/* ------------------------------------------------------ contact --- */}
          <section>
            <h2 className="display-sm mb-5 text-xl">Where is it going?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                placeholder="Aisha Shaikh"
                error={errors.name?.message}
                className="sm:col-span-2"
                {...register('name')}
              />
              <Field
                label="Email"
                type="email"
                placeholder="you@example.in"
                error={errors.email?.message}
                hint="Tracking link and invoice go here"
                {...register('email')}
              />
              <Field
                label="Mobile"
                inputMode="numeric"
                maxLength={10}
                placeholder="9820041102"
                error={errors.phone?.message}
                hint="Courier calls this number"
                {...register('phone')}
              />
              <Field
                label="Flat, building, street"
                placeholder="Flat 302, Noor Manzil, Bazaar Road"
                error={errors.line1?.message}
                className="sm:col-span-2"
                {...register('line1')}
              />
              <Field
                label="Landmark (optional)"
                placeholder="Opposite Jama Masjid"
                className="sm:col-span-2"
                {...register('landmark')}
              />
              <Field label="City" placeholder="Mumbai" error={errors.city?.message} {...register('city')} />
              <Field
                label="PIN code"
                inputMode="numeric"
                maxLength={6}
                placeholder="400003"
                error={errors.pincode?.message}
                {...register('pincode')}
              />
              <Select label="State" error={errors.state?.message} className="sm:col-span-2" {...register('state')}>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Field
                as="textarea"
                label="Anything we should know? (optional)"
                placeholder="Ring the bell twice — the gate is locked after 8pm."
                className="sm:col-span-2"
                {...register('notes')}
              />
            </div>

            <div className="mt-5">
              <Checkbox
                label="Billing address is the same as delivery"
                checked={sameAsShipping}
                onChange={setSameAsShipping}
              />
              {!sameAsShipping && (
                <p className="mt-3 border border-ink/12 bg-blush-warm p-4 font-mono text-2xs leading-relaxed text-taupe">
                  Separate billing addresses arrive with the backend. For now we will use the delivery
                  address on the invoice and email you if anything needs changing.
                </p>
              )}
            </div>
          </section>

          {/* ----------------------------------------------------- shipping --- */}
          <section>
            <h2 className="display-sm mb-5 text-xl">How fast?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                selected={speed === 'standard'}
                onSelect={() => setSpeed('standard')}
                icon={Truck}
                title="Standard"
                sub={settings.shipping.standardDays}
                price={totals.subtotal >= settings.shipping.freeAbove ? 'Free' : money(settings.shipping.standardFee)}
              />
              <Choice
                selected={speed === 'express'}
                onSelect={() => setSpeed('express')}
                icon={Zap}
                title="Express"
                sub={settings.shipping.expressDays}
                price={money(settings.shipping.expressFee)}
              />
            </div>
            <p className="mt-3 font-mono text-2xs text-taupe">{settings.shipping.dispatchNote}</p>
          </section>

          {/* ------------------------------------------------------ payment --- */}
          <section>
            <h2 className="display-sm mb-5 text-xl">How would you like to pay?</h2>
            <div className="space-y-3">
              {settings.payments.upiEnabled && (
                <Choice
                  selected={method === 'upi'}
                  onSelect={() => setMethod('upi')}
                  icon={ShieldCheck}
                  title="UPI — GPay, PhonePe, Paytm or any app"
                  sub={`Scan a QR or tap through. ${settings.payments.prepaidDiscountPct}% off this order.`}
                  price={`−${money(
                    Math.round((totals.subtotal * settings.payments.prepaidDiscountPct) / 100)
                  )}`}
                  tone="rose"
                  wide
                />
              )}

              {settings.payments.codEnabled && (
                <Choice
                  selected={method === 'cod'}
                  onSelect={() => setMethod('cod')}
                  icon={BadgeIndianRupee}
                  title="Cash on delivery"
                  sub={`Pay the courier when it arrives. ₹${settings.payments.codFee} handling fee. Orders ${money(
                    settings.payments.codMinOrder
                  )}–${money(settings.payments.codMaxOrder)}.`}
                  price={`+${money(settings.payments.codFee)}`}
                  wide
                  disabled={
                    totals.subtotal < settings.payments.codMinOrder ||
                    totals.subtotal > settings.payments.codMaxOrder
                  }
                />
              )}

              {!settings.payments.cardsEnabled && (
                <div className="flex items-center justify-between gap-4 border border-dashed border-ink/20 p-4">
                  <div>
                    <p className="text-sm text-taupe">Cards, net banking, wallets</p>
                    <p className="mt-0.5 font-mono text-2xs text-taupe-light">
                      Arriving when we finish the payment-gateway integration.
                    </p>
                  </div>
                  <span className="eyebrow shrink-0 text-taupe-light">Soon</span>
                </div>
              )}
            </div>

            {codBlocked && (
              <p className="mt-4 border border-clay/25 bg-clay-wash p-4 text-sm text-clay-deep">
                This order is {money(totals.subtotal)}, outside the COD range of{' '}
                {money(settings.payments.codMinOrder)}–{money(settings.payments.codMaxOrder)}. Pay by
                UPI to continue.
              </p>
            )}
          </section>
        </div>

        {/* -------------------------------------------------------- summary --- */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-ink/12 bg-white p-6">
            <h2 className="display-sm mb-4 text-lg">
              {lines.reduce((n, l) => n + l.qty, 0)} items
            </h2>

            <ul className="scroll-thin mb-5 max-h-64 space-y-3 overflow-y-auto">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <img
                    src={l.colorway.images[0]}
                    alt=""
                    className="h-16 w-12 shrink-0 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{l.product.name}</p>
                    <p className="font-mono text-2xs text-taupe">
                      {l.colorway.name} · ×{l.qty}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-2xs tabular-nums">{money(l.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2.5 border-t border-ink/10 pt-4 text-sm">
              <Row label="Subtotal" value={money(totals.subtotal)} />
              {totals.couponDiscount > 0 && (
                <Row label={`Code ${totals.couponCode}`} value={`−${money(totals.couponDiscount)}`} tone="rose" />
              )}
              {totals.prepaidDiscount > 0 && (
                <Row label="UPI prepaid discount" value={`−${money(totals.prepaidDiscount)}`} tone="rose" />
              )}
              <Row
                label={`Shipping — ${speed}`}
                value={totals.shipping === 0 ? 'Free' : money(totals.shipping)}
                tone={totals.shipping === 0 ? 'rose' : undefined}
              />
              {totals.codFee > 0 && <Row label="COD handling" value={money(totals.codFee)} />}
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
              <span className="display-sm text-lg">To pay</span>
              <span className="font-mono text-2xl tabular-nums">{money(totals.grand)}</span>
            </div>

            <button type="submit" className="btn-ink mt-5 w-full" disabled={codBlocked}>
              {method === 'cod' ? 'Place order — pay on delivery' : `Continue to UPI — ${money(totals.grand)}`}
            </button>

            <Link to="/cart" className="btn-ghost mt-1 w-full justify-center">
              Edit bag
            </Link>

            <p className="mt-4 font-mono text-2xs leading-relaxed text-taupe">
              By placing this order you agree to our{' '}
              <Link to="/policies/terms" className="text-rose underline underline-offset-2">
                terms
              </Link>{' '}
              and{' '}
              <Link to="/policies/returns" className="text-rose underline underline-offset-2">
                returns policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

/* --------------------------------------------------------------- pieces --- */

function Choice({ selected, onSelect, icon: Icon, title, sub, price, tone, wide, disabled }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        'flex items-start gap-3.5 border p-4 text-left transition-colors duration-200',
        selected ? 'border-ink bg-blush-warm' : 'border-ink/15 hover:border-ink/40',
        disabled && 'cursor-not-allowed opacity-45',
        wide && 'w-full'
      )}
    >
      <span
        className={cx(
          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
          selected ? 'border-ink' : 'border-ink/30'
        )}
        aria-hidden="true"
      >
        {selected && <span className="h-2 w-2 rounded-full bg-ink" />}
      </span>

      <Icon size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-gold-deep" />

      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug">{title}</span>
        <span className="mt-1 block font-mono text-2xs leading-relaxed text-taupe">{sub}</span>
      </span>

      {price && (
        <span
          className={cx(
            'shrink-0 font-mono text-2xs tabular-nums',
            tone === 'rose' ? 'text-rose' : 'text-ink'
          )}
        >
          {price}
        </span>
      )}
    </button>
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
