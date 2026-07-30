import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import cx from '../lib/cx'
import { Badge, PriceTag, Stars, Swatch } from './ui'
import useStore, { stockOf } from '../store/useStore'
import { WEAVE_LABELS } from '../data/collections'

/**
 * A card is a swatch card: the shot and the mill line.
 * Hovering swaps to the styled shot; choosing a colourway swaps the whole
 * image set, because on this catalogue the colour *is* the product.
 */
export default function ProductCard({ product, priority = false, className }) {
  const [ci, setCi] = useState(0)
  const [hovered, setHovered] = useState(false)
  const addToCart = useStore((s) => s.addToCart)
  const wishlist = useStore((s) => s.wishlist)
  const toggleWishlist = useStore((s) => s.toggleWishlist)

  const colorway = product.colorways[ci] || product.colorways[0]
  const saved = wishlist.includes(product.id)
  const total = stockOf(product)
  const soldOut = total === 0
  const low = !soldOut && total <= 12

  const images = colorway?.images || []
  const shown = hovered && images[1] ? images[1] : images[0]

  const quickAdd = (e) => {
    e.preventDefault()
    if (soldOut || !colorway) return
    addToCart({ productId: product.id, colorwayCode: colorway.code, qty: 1 })
    toast.success(`${product.name} in ${colorway.name} — added`)
  }

  return (
    <article className={cx('group relative flex flex-col', className)}>
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden bg-blush-warm"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="aspect-[3/4] w-full">
          {shown && (
            <img
              src={shown}
              alt={`${product.name} in ${colorway.name}`}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className={cx(
                'h-full w-full object-cover transition-transform duration-[900ms] ease-drape',
                'group-hover:scale-[1.04]'
              )}
            />
          )}
        </div>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.madeToOrder && <Badge tone="ink">Made to order</Badge>}
          {product.smallBatch && <Badge tone="gold">Small batch</Badge>}
          {product.pinless && <Badge tone="rose">Pinless</Badge>}
          {soldOut ? (
            <Badge tone="clay">Sold out</Badge>
          ) : (
            low && <Badge tone="gold">{total} left</Badge>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            toggleWishlist(product.id)
            toast(saved ? 'Removed from saved' : 'Saved for later', { icon: '♡' })
          }}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-blush/85 text-ink backdrop-blur transition-colors hover:bg-blush"
        >
          <Heart size={15} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-rose' : ''} />
        </button>

        {/* Quick add sits on the image on desktop and is always visible on
            touch, where there is no hover to reveal it. */}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 ease-drape group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut}
            className="btn-ink w-full py-3 text-2xs uppercase tracking-[0.14em] disabled:bg-taupe"
          >
            <ShoppingBag size={14} />
            {soldOut ? 'Sold out' : 'Add to bag'}
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="display-sm text-[17px] leading-snug">
            <Link to={`/product/${product.slug}`} className="link-selvedge">
              {product.name}
            </Link>
          </h3>
          <PriceTag price={product.price} mrp={product.mrp} className="shrink-0 pt-0.5" />
        </div>

        {/* The mill line. Mono, because it is data, not copy. */}
        <p className="mt-1.5 font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
          {product.fabric} · {product.gsm ? `${product.gsm} GSM` : WEAVE_LABELS[product.weave]}
          {product.size?.l ? ` · ${product.size.w}×${product.size.l} cm` : ''}
        </p>

        {product.reviewCount > 0 && (
          <Stars value={product.rating} count={product.reviewCount} className="mt-2" />
        )}

        {product.colorways.length > 1 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {product.colorways.map((c, i) => (
              <Swatch
                key={c.code}
                hex={c.hex}
                name={c.name}
                code={c.code}
                size={20}
                light={c.family === 'neutral'}
                selected={i === ci}
                disabled={c.stock === 0}
                onClick={() => setCi(i)}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
