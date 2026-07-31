import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Heart, ShoppingBag, Truck, RotateCcw, BadgeIndianRupee, ChevronRight,
  Instagram, Ruler, ShieldCheck, AlertTriangle, Check,
} from 'lucide-react'
import useStore, { productBySlug, publishedProducts, reviewsFor, stockOf } from '../store/useStore'
import { WEAVE_LABELS } from '../data/collections'
import { SHOT_LABELS, SHOTS } from '../data/colorways.mjs'
import Gallery from '../components/Gallery'
import WeaveDiagram from '../components/WeaveDiagram'
import ProductCard from '../components/ProductCard'
import ReviewForm from '../components/ReviewForm'
import {
  Accordion, Badge, Eyebrow, PriceTag, QtyStepper, Reveal, SectionHead, Stars, Swatch, EmptyState,
} from '../components/ui'
import { money, agoDays } from '../lib/format'
import { isValidPincode } from '../lib/upi'
import cx from '../lib/cx'
import NotFound from './NotFound'

export default function Product() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const product = useStore((s) => productBySlug(s, slug))
  const all = useStore(publishedProducts)
  // Looked up here rather than after the guard below — hooks cannot sit behind
  // an early return.
  const collection = useStore((s) =>
    s.collections.find((c) => c.slug === productBySlug(s, slug)?.collection)
  )
  const reviews = useStore((s) => (product ? reviewsFor(s, product.id) : []))
  const settings = useStore((s) => s.settings)
  const brand = settings.brand
  const addToCart = useStore((s) => s.addToCart)
  const wishlist = useStore((s) => s.wishlist)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const markViewed = useStore((s) => s.markViewed)

  const [ci, setCi] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setCi(0)
    setQty(1)
    if (product) markViewed(product.id)
  }, [product?.id, markViewed])

  if (!product || !product.published) return <NotFound />

  const colorway = product.colorways[ci] || product.colorways[0]
  const saved = wishlist.includes(product.id)
  const total = stockOf(product)
  const outOfStock = !colorway || colorway.stock === 0

  const related = all
    .filter((p) => p.id !== product.id && p.collection === product.collection)
    .slice(0, 4)
  const essentials = all.filter((p) => p.collection === 'essentials' && p.id !== product.id).slice(0, 2)

  const add = (thenCheckout = false) => {
    if (outOfStock) return
    addToCart({ productId: product.id, colorwayCode: colorway.code, qty })
    if (thenCheckout) navigate('/checkout')
    else toast.success(`${product.name} in ${colorway.name} — added`)
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="shell pt-6">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
          <li><Link to="/" className="hover:text-ink">Home</Link></li>
          <ChevronRight size={11} aria-hidden="true" />
          <li><Link to="/shop" className="hover:text-ink">Shop</Link></li>
          {collection && (
            <>
              <ChevronRight size={11} aria-hidden="true" />
              <li>
                <Link to={`/collections/${collection.slug}`} className="hover:text-ink">
                  {collection.name}
                </Link>
              </li>
            </>
          )}
          <ChevronRight size={11} aria-hidden="true" />
          <li aria-current="page" className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="shell grid gap-10 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Gallery images={colorway?.images || []} alt={`${product.name} in ${colorway?.name}`} />

          <p className="mt-4 hidden font-mono text-2xs uppercase tracking-[0.1em] text-taupe lg:block">
            {SHOTS.length} shots per colourway — {SHOTS.map((s) => SHOT_LABELS[s].toLowerCase()).join(', ')}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.madeToOrder && <Badge tone="ink">Made to order</Badge>}
            {product.smallBatch && <Badge tone="gold">Small batch</Badge>}
            {product.pinless && <Badge tone="rose">Wears without pins</Badge>}
            {total > 0 && total <= 12 && <Badge tone="gold">Only {total} left across colours</Badge>}
          </div>

          <h1 className="mt-4 text-[2.1rem] leading-tight sm:text-[2.6rem]">{product.name}</h1>
          {product.tagline && (
            <p className="mt-2 font-script text-2xl text-rose">{product.tagline}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <PriceTag price={product.price} mrp={product.mrp} size="lg" />
            {product.reviewCount > 0 && (
              <a href="#reviews" className="link-selvedge">
                <Stars value={product.rating} count={product.reviewCount} showValue />
              </a>
            )}
          </div>

          <p className="mt-1.5 font-mono text-2xs text-taupe">
            Inclusive of all taxes · {settings.payments.prepaidDiscountPct}% off when you pay by UPI
          </p>

          <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-ink/75">
            {product.description}
          </p>

          {product.notes?.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.notes.map((n) => (
                <li key={n} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/75">
                  <Check size={15} className="mt-1 shrink-0 text-rose" strokeWidth={2.5} />
                  {n}
                </li>
              ))}
            </ul>
          )}

          {/* -------------------------------------------------- colourways --- */}
          {product.colorways.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="spec-key">
                  Colourway — {product.colorways.length} on the card
                </p>
                <p className="font-mono text-2xs text-ink">
                  {colorway.name} <span className="text-taupe">· {colorway.code}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colorways.map((c, i) => (
                  <Swatch
                    key={c.code}
                    hex={c.hex}
                    name={c.name}
                    code={c.code}
                    size={38}
                    light={c.family === 'neutral'}
                    selected={i === ci}
                    disabled={c.stock === 0}
                    onClick={() => setCi(i)}
                  />
                ))}
              </div>
              <p className="mt-2.5 font-mono text-2xs text-taupe">
                {colorway.stock === 0
                  ? 'Out of stock in this colour — pick another, or save it and we will email you.'
                  : colorway.stock <= 5
                    ? `Only ${colorway.stock} left in ${colorway.name}`
                    : `${colorway.stock} in stock`}
              </p>
            </div>
          )}

          {/* ------------------------------------------------------- buy --- */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} max={Math.max(1, colorway?.stock || 1)} />
            <button
              type="button"
              onClick={() => add(false)}
              disabled={outOfStock}
              className="btn-ink min-w-[11rem] flex-1"
            >
              <ShoppingBag size={16} />
              {outOfStock ? 'Out of stock' : 'Add to bag'}
            </button>
            <button
              type="button"
              onClick={() => {
                toggleWishlist(product.id)
                toast(saved ? 'Removed from saved' : 'Saved for later', { icon: '♡' })
              }}
              aria-pressed={saved}
              className="btn-outline aspect-square px-0"
              style={{ width: 52 }}
              aria-label={saved ? 'Remove from saved' : 'Save for later'}
            >
              <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => add(true)}
            disabled={outOfStock}
            className="btn-outline mt-2 w-full"
          >
            Buy it now — straight to checkout
          </button>

          <div className="mt-5 grid gap-2.5 border-y border-ink/10 py-5 sm:grid-cols-2">
            <Perk icon={BadgeIndianRupee} title="Cash on delivery">
              ₹{settings.payments.codFee} fee, on orders ₹{settings.payments.codMinOrder}–
              {settings.payments.codMaxOrder}
            </Perk>
            <Perk icon={ShieldCheck} title="UPI, GPay, PhonePe">
              Scan and pay — {settings.payments.prepaidDiscountPct}% off
            </Perk>
            <Perk icon={Truck} title={`Free over ₹${settings.shipping.freeAbove}`}>
              {settings.shipping.standardDays}
            </Perk>
            <Perk icon={RotateCcw} title={`${settings.returns.windowDays}-day returns`}>
              {product.madeToOrder ? 'Made to order — final sale' : 'Unworn, tags on'}
            </Perk>
          </div>

          <PincodeCheck settings={settings} madeToOrder={product.madeToOrder} />

          {/* ---------------------------------------------- the mill spec --- */}
          <div className="mt-8 border border-ink/12 bg-blush-warm p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Eyebrow className="mb-1.5">Mill spec</Eyebrow>
                <h2 className="display-sm text-lg">{WEAVE_LABELS[product.weave]}</h2>
              </div>
              <WeaveDiagram weave={product.weave} color="#96625A" size={64} className="shrink-0" />
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              <Spec k="Fabric" v={product.fabric} />
              {/* Weave is the heading above, so it is not repeated here. */}
              {product.gsm > 0 && <Spec k="Weight" v={`${product.gsm} GSM`} />}
              {product.weight > 0 && <Spec k="Piece weight" v={`${product.weight} g`} />}
              <Spec
                k="Dimensions"
                v={product.size?.l ? `${product.size.w} × ${product.size.l} cm` : product.size?.note || '—'}
              />
              <Spec k="Cut" v={product.style} capitalize />
              <Spec k="Woven in" v={product.origin} className="col-span-2" />
              <Spec k="Composition" v={product.composition} className="col-span-2" />
            </dl>

            {product.size?.note && (
              <p className="mt-4 border-t border-ink/10 pt-3 font-mono text-2xs text-taupe">
                {product.size.note}
              </p>
            )}
          </div>

          {product.warning && (
            <p className="mt-4 flex gap-2.5 border border-clay/25 bg-clay-wash p-4 text-sm leading-relaxed text-clay-deep">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {product.warning}
            </p>
          )}

          <Accordion
            className="mt-8"
            items={[
              { q: 'Care', a: product.care || 'Hand wash cold, dry in shade.' },
              {
                q: 'Shipping & delivery',
                a: `${settings.shipping.dispatchNote} Standard is ${settings.shipping.standardDays} at ₹${settings.shipping.standardFee}, free over ₹${settings.shipping.freeAbove}. Express is ${settings.shipping.expressDays} at ₹${settings.shipping.expressFee}.${product.madeToOrder ? ' This piece is made to order and ships in 12–16 days.' : ''}`,
              },
              {
                q: 'Returns & exchange',
                a: product.madeToOrder
                  ? 'Made-to-order and bridal pieces are final sale — we cut and bead them for you specifically.'
                  : `${settings.returns.windowDays} days from delivery. ${settings.returns.note}`,
              },
              {
                q: 'How to wear it',
                a: (
                  <span>
                    Three ways that suit this fabric are set out in our{' '}
                    <Link to="/styling" className="text-rose underline underline-offset-2">
                      styling guide
                    </Link>
                    {product.pinless
                      ? '. This one grips itself, so you can skip pins entirely.'
                      : '. This fabric takes a pin cleanly — magnets work too.'}
                  </span>
                ),
              },
            ]}
          />

          <a
            href={brand.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em] text-gold-deep hover:text-ink"
          >
            <Instagram size={14} />
            See it styled on @{brand.instagram}
          </a>
        </div>
      </div>

      {/* -------------------------------------------------------- reviews --- */}
      <section id="reviews" className="border-t border-ink/10 py-16 md:py-24">
        <div className="shell">
          <SectionHead
            eyebrow={reviews.length ? `${reviews.length} published reviews` : 'Be the first'}
            title="What buyers said after wearing it"
            blurb={
              product.reviewCount > 0
                ? `${product.rating.toFixed(1)} out of 5 across ${product.reviewCount.toLocaleString('en-IN')} ratings.`
                : undefined
            }
          />

          {reviews.length === 0 ? (
            <div className="mx-auto max-w-2xl">
              <p className="mb-6 text-center text-[15px] leading-relaxed text-ink/65">
                Nobody has reviewed this one yet. If you have worn it, yours would be the first —
                and the most useful.
              </p>
              <ReviewForm product={product} />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 0.07}>
                  <figure className="flex h-full flex-col border border-ink/10 bg-white p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Stars value={r.rating} />
                      <span className="font-mono text-2xs text-taupe">{agoDays(r.daysAgo)}</span>
                    </div>
                    <blockquote className="mt-4 flex-1">
                      <p className="display-sm mb-2 text-base">{r.title}</p>
                      <p className="text-[15px] leading-relaxed text-ink/70">{r.body}</p>
                    </blockquote>
                    <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4 font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
                      <span>{r.author} · {r.city}</span>
                      {r.verified && <span className="text-rose">Verified buyer</span>}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          )}

          {reviews.length > 0 && (
            <div className="mx-auto mt-12 max-w-2xl">
              <ReviewForm product={product} />
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------- related --- */}
      {related.length > 0 && (
        <section className="shell py-16 md:py-20">
          <SectionHead
            eyebrow="Same drawer"
            title={`More from ${collection?.name || 'this collection'}`}
            action={
              collection && (
                <Link to={`/collections/${collection.slug}`} className="btn-outline">
                  See all
                </Link>
              )
            }
          />
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {essentials.length > 0 && (
        <section className="border-t border-ink/10 py-16">
          <div className="shell">
            <SectionHead eyebrow="Goes with it" title="The layer underneath" />
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {essentials.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky buy bar — mobile only, where the buy button scrolls away. */}
      <div className="sticky bottom-0 z-30 border-t border-ink/10 bg-blush/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
              {colorway?.name}
            </p>
            <PriceTag price={product.price} mrp={product.mrp} />
          </div>
          <button
            type="button"
            onClick={() => add(false)}
            disabled={outOfStock}
            className="btn-ink shrink-0"
          >
            <ShoppingBag size={15} />
            {outOfStock ? 'Out of stock' : 'Add to bag'}
          </button>
        </div>
      </div>
    </>
  )
}

/* --------------------------------------------------------------- pieces --- */

function Spec({ k, v, className, capitalize }) {
  if (!v) return null
  return (
    <div className={className}>
      <dt className="spec-key">{k}</dt>
      {/* Only single-word values are capitalised — running it over a
          composition string turns "95% bamboo modal" into title case. */}
      <dd className={cx('mt-0.5 font-mono text-[13px]', capitalize && 'capitalize')}>{v}</dd>
    </div>
  )
}

function Perk({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-2.5">
      <Icon size={16} strokeWidth={1.6} className="mt-0.5 shrink-0 text-gold-deep" />
      <div>
        <p className="text-sm leading-snug">{title}</p>
        <p className="mt-0.5 font-mono text-2xs leading-relaxed text-taupe">{children}</p>
      </div>
    </div>
  )
}

/** Delivery estimate. Local-only for now — the courier API plugs in here. */
function PincodeCheck({ settings, madeToOrder }) {
  const [pin, setPin] = useState('')
  const [result, setResult] = useState(null)

  const check = (e) => {
    e.preventDefault()
    if (!isValidPincode(pin)) {
      setResult({ ok: false, msg: 'Enter a valid 6-digit PIN code.' })
      return
    }
    // Metro PIN prefixes get the faster window; everything else the standard one.
    const metro = ['11', '40', '50', '56', '60', '70', '38', '41'].includes(pin.slice(0, 2))
    const days = madeToOrder ? '12–16 days' : metro ? '3–4 working days' : settings.shipping.standardDays
    setResult({
      ok: true,
      msg: `Delivers in ${days}. ${settings.payments.codEnabled ? 'COD available.' : ''}`,
    })
  }

  return (
    <form onSubmit={check} className="mt-5">
      <label htmlFor="pin" className="spec-key mb-2 block">
        Check delivery to your PIN code
      </label>
      <div className="flex gap-2">
        <input
          id="pin"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''))
            setResult(null)
          }}
          placeholder="400003"
          className="field-boxed max-w-40 font-mono tabular-nums"
        />
        <button type="submit" className="btn-outline px-5 py-2.5 text-2xs uppercase tracking-[0.12em]">
          Check
        </button>
      </div>
      {result && (
        <p
          className={`mt-2 font-mono text-2xs ${result.ok ? 'text-rose-deep' : 'text-clay-deep'}`}
          role="status"
        >
          {result.msg}
        </p>
      )}
    </form>
  )
}
