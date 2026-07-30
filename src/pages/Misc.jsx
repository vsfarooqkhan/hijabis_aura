/**
 * The smaller storefront pages: order lookup, saved items, search and 404.
 * Grouped because each is a single short view and they share the same shape.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Heart, PackageSearch, MapPin, Compass } from 'lucide-react'
import useStore, { publishedProducts } from '../store/useStore'
import ProductCard from '../components/ProductCard'
import { EmptyState, Eyebrow, Field, Badge } from '../components/ui'
import { money, dateOnly } from '../lib/format'
import { statusMeta } from '../data/settings'

/* ------------------------------------------------------------ track order --- */

export function TrackOrder() {
  const orders = useStore((s) => s.orders)
  const brand = useStore((s) => s.settings.brand)
  const [id, setId] = useState('')
  const [contact, setContact] = useState('')
  const [found, setFound] = useState(undefined)

  const lookup = (e) => {
    e.preventDefault()
    const needle = id.trim().toUpperCase()
    const order = orders.find((o) => o.id.toUpperCase() === needle)
    // Both the order number and a matching email or phone are required, so one
    // guessed order number does not expose someone else's address.
    const c = contact.trim().toLowerCase()
    const matches =
      order &&
      (order.customer.email.toLowerCase() === c ||
        order.customer.phone.replace(/\D/g, '').endsWith(c.replace(/\D/g, '').slice(-10)))
    setFound(matches ? order : null)
  }

  return (
    <div className="shell max-w-2xl py-14 md:py-20">
      <Eyebrow className="mb-3">Order lookup</Eyebrow>
      <h1 className="text-[2.2rem] md:text-[2.8rem]">Track an order</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
        Enter the order number from your confirmation email, plus the email or mobile you ordered
        with.
      </p>

      <form onSubmit={lookup} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field
          label="Order number"
          placeholder="HA24812"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="font-mono"
        />
        <Field
          label="Email or mobile"
          placeholder="you@example.in"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <button type="submit" className="btn-ink sm:col-span-2">
          Find my order
        </button>
      </form>

      {found === null && (
        <p className="mt-6 border border-clay/25 bg-clay-wash p-4 text-sm text-clay-deep">
          No order matches that combination. Check the number, or{' '}
          <a
            href={`https://wa.me/${brand.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            message us on WhatsApp
          </a>{' '}
          and we will find it for you.
        </p>
      )}

      {found && (
        <div className="mt-8 border border-ink/12 bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm">{found.id}</p>
              <p className="mt-0.5 font-mono text-2xs text-taupe">
                Placed {dateOnly(found.createdAt)}
              </p>
            </div>
            <Badge tone={statusMeta(found.status).tone}>{statusMeta(found.status).label}</Badge>
          </div>

          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {found.items.map((it) => (
              <li key={`${it.productId}-${it.colorwayCode}`} className="flex items-center gap-3 py-3">
                <img src={it.image} alt="" className="h-14 w-11 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{it.name}</p>
                  <p className="font-mono text-2xs text-taupe">
                    {it.colorwayName} · ×{it.qty}
                  </p>
                </div>
                <span className="font-mono text-2xs tabular-nums">{money(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-start justify-between gap-4">
            <p className="flex gap-2 font-mono text-2xs leading-relaxed text-taupe">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              {found.shippingAddress.city}, {found.shippingAddress.state}{' '}
              {found.shippingAddress.pincode}
              {found.awb && (
                <>
                  <br />
                  {found.courier} · AWB {found.awb}
                </>
              )}
            </p>
            <span className="shrink-0 font-mono text-sm tabular-nums">{money(found.totals.grand)}</span>
          </div>

          <Link to={`/order/${found.id}`} className="btn-outline mt-5 w-full">
            See full order
          </Link>
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- wishlist --- */

export function Wishlist() {
  const ids = useStore((s) => s.wishlist)
  const products = useStore(publishedProducts)
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)

  return (
    <div className="shell py-14 md:py-20">
      <Eyebrow className="mb-3">{saved.length} saved</Eyebrow>
      <h1 className="text-[2.2rem] md:text-[2.8rem]">Saved for later</h1>

      {saved.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Heart}
          title="Nothing saved yet"
          body="Tap the heart on anything you are still thinking about. It will wait here."
          action={
            <Link to="/shop" className="btn-ink">
              Browse hijabs
            </Link>
          }
        />
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- search --- */

export function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [draft, setDraft] = useState(q)
  const products = useStore(publishedProducts)
  const collections = useStore((s) => s.collections)

  const needle = q.trim().toLowerCase()
  const results = needle
    ? products.filter((p) =>
        [
          p.name,
          p.tagline,
          p.fabric,
          p.composition,
          p.weave,
          p.description,
          p.origin,
          ...p.occasion,
          ...p.colorways.map((c) => `${c.name} ${c.code}`),
          collections.find((c) => c.slug === p.collection)?.name || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      )
    : []

  return (
    <div className="shell py-14 md:py-20">
      <Eyebrow className="mb-3">Search</Eyebrow>
      <h1 className="text-[2.2rem] md:text-[2.8rem]">
        {needle ? (
          <>
            {results.length} {results.length === 1 ? 'result' : 'results'} for “{q}”
          </>
        ) : (
          'What are you looking for?'
        )}
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setParams(draft.trim() ? { q: draft.trim() } : {})
        }}
        className="mt-7 flex max-w-xl gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Try 'modal', 'crinkle', 'jade' or 'bridal'"
          className="field-boxed"
          aria-label="Search products"
        />
        <button type="submit" className="btn-ink px-5">
          <SearchIcon size={16} />
        </button>
      </form>

      {needle && results.length === 0 && (
        <EmptyState
          className="mt-8"
          icon={PackageSearch}
          title={`Nothing matches “${q}”`}
          body="Try a fabric name, a colour, or the drawer it might live in — modal, chiffon, satin, jersey, bridal."
          action={
            <Link to="/shop" className="btn-ink">
              Browse everything
            </Link>
          }
        />
      )}

      {results.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!needle && (
        <div className="mt-10">
          <p className="spec-key mb-3">Or start from a drawer</p>
          <div className="flex flex-wrap gap-2">
            {collections
              .filter((c) => c.published)
              .map((c) => (
                <Link
                  key={c.slug}
                  to={`/collections/${c.slug}`}
                  className="border border-ink/15 px-3 py-2 font-mono text-2xs transition-colors hover:border-ink"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------- 404 --- */

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="shell flex min-h-[60vh] max-w-xl flex-col justify-center py-20 text-center">
      <p className="font-mono text-2xs uppercase tracking-[0.16em] text-gold-deep">Error 404</p>
      <h1 className="mt-4 text-[2.6rem] leading-tight md:text-[3.4rem]">
        This thread runs off the edge
      </h1>
      <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-ink/70">
        The page you asked for is not here. It may have been a colourway we retired, or a link that
        lost a character on the way.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="btn-ink">
          <Compass size={15} />
          Shop all hijabs
        </Link>
        <button type="button" onClick={() => navigate(-1)} className="btn-outline">
          Go back
        </button>
      </div>
    </div>
  )
}
