import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import useStore, { publishedProducts, stockOf } from '../store/useStore'
import { COLOR_FAMILIES } from '../data/colorways.mjs'
import { OCCASION_FILTERS, STYLE_FILTERS, WEAVE_LABELS } from '../data/collections'
import ProductCard from '../components/ProductCard'
import { Checkbox, EmptyState, Eyebrow, Select } from '../components/ui'
import cx from '../lib/cx'

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'popular', label: 'Most ordered' },
  { key: 'price-asc', label: 'Price, low to high' },
  { key: 'price-desc', label: 'Price, high to low' },
  { key: 'rating', label: 'Best rated' },
  { key: 'gsm-asc', label: 'Lightest first' },
  { key: 'gsm-desc', label: 'Heaviest first' },
]

const PRICE_BANDS = [
  { key: 'u500', label: 'Under ₹500', test: (p) => p.price < 500 },
  { key: '500-1000', label: '₹500 – ₹1,000', test: (p) => p.price >= 500 && p.price < 1000 },
  { key: '1000-2000', label: '₹1,000 – ₹2,000', test: (p) => p.price >= 1000 && p.price < 2000 },
  { key: 'o2000', label: 'Over ₹2,000', test: (p) => p.price >= 2000 },
]

/** Weight bands, from the GSM every mill prints on the roll. */
const WEIGHT_BANDS = [
  { key: 'light', label: 'Light — under 80 GSM', test: (p) => p.gsm > 0 && p.gsm < 80 },
  { key: 'mid', label: 'Mid — 80 to 150 GSM', test: (p) => p.gsm >= 80 && p.gsm <= 150 },
  { key: 'heavy', label: 'Heavy — over 150 GSM', test: (p) => p.gsm > 150 },
]

export default function Shop() {
  const products = useStore(publishedProducts)
  const collections = useStore((s) => s.collections)
  const [params, setParams] = useSearchParams()
  const [panelOpen, setPanelOpen] = useState(false)

  const sort = params.get('sort') || 'featured'
  const active = useMemo(
    () => ({
      collection: params.getAll('collection'),
      style: params.getAll('style'),
      occasion: params.getAll('occasion'),
      family: params.getAll('family'),
      price: params.getAll('price'),
      weight: params.getAll('weight'),
      pinless: params.get('pinless') === '1',
      inStock: params.get('inStock') === '1',
    }),
    [params]
  )

  const activeCount =
    active.collection.length + active.style.length + active.occasion.length +
    active.family.length + active.price.length + active.weight.length +
    (active.pinless ? 1 : 0) + (active.inStock ? 1 : 0)

  const toggle = (group, value) => {
    const next = new URLSearchParams(params)
    const current = next.getAll(group)
    next.delete(group)
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updated.forEach((v) => next.append(group, v))
    setParams(next, { replace: true })
  }

  const setFlag = (key, on) => {
    const next = new URLSearchParams(params)
    if (on) next.set(key, '1')
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const clearAll = () => {
    const next = new URLSearchParams()
    if (sort !== 'featured') next.set('sort', sort)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    let out = products.filter((p) => {
      if (active.collection.length && !active.collection.includes(p.collection)) return false
      if (active.style.length && !active.style.includes(p.style)) return false
      if (active.occasion.length && !p.occasion.some((o) => active.occasion.includes(o))) return false
      if (active.family.length && !p.colorways.some((c) => active.family.includes(c.family))) return false
      if (active.price.length && !PRICE_BANDS.filter((b) => active.price.includes(b.key)).some((b) => b.test(p)))
        return false
      if (
        active.weight.length &&
        !WEIGHT_BANDS.filter((b) => active.weight.includes(b.key)).some((b) => b.test(p))
      )
        return false
      if (active.pinless && !p.pinless) return false
      if (active.inStock && stockOf(p) === 0) return false
      return true
    })

    const by = {
      featured: (a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold,
      popular: (a, b) => b.sold - a.sold,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      'gsm-asc': (a, b) => a.gsm - b.gsm,
      'gsm-desc': (a, b) => b.gsm - a.gsm,
    }
    return [...out].sort(by[sort] || by.featured)
  }, [products, active, sort])

  const facets = (
    <FilterPanel
      collections={collections}
      active={active}
      toggle={toggle}
      setFlag={setFlag}
      products={products}
    />
  )

  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-20">
        <div className="shell">
          <Eyebrow onInk className="mb-4 text-gold">
            {products.length} pieces · {WEAVE_LABELS.plain}, twill, satin, jersey and tulle
          </Eyebrow>
          <h1 className="max-w-3xl text-[2.4rem] leading-tight md:text-[3.4rem]">
            Every hijab we make, with its cloth on the label
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-blush/65">
            Filter by fabric, weight and cut — the things that decide how a hijab wears. Fabric,
            weave, GSM and exact dimensions are on every product page.
          </p>
        </div>
      </header>

      <div className="shell py-10">
        <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="eyebrow">Filter</h2>
                {activeCount > 0 && (
                  <button type="button" onClick={clearAll} className="font-mono text-2xs text-rose hover:text-rose-deep">
                    Clear {activeCount}
                  </button>
                )}
              </div>
              {facets}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
              <p className="font-mono text-2xs uppercase tracking-[0.12em] text-taupe">
                {results.length} {results.length === 1 ? 'piece' : 'pieces'}
                {activeCount > 0 && ` · ${activeCount} filter${activeCount === 1 ? '' : 's'}`}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  className="btn-outline px-4 py-2.5 text-2xs uppercase tracking-[0.12em] lg:hidden"
                >
                  <SlidersHorizontal size={14} />
                  Filter{activeCount > 0 ? ` (${activeCount})` : ''}
                </button>

                <Select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(e) => {
                    const next = new URLSearchParams(params)
                    next.set('sort', e.target.value)
                    setParams(next, { replace: true })
                  }}
                  className="w-52"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {results.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="Nothing matches that combination"
                body="Try loosening one filter — asking for sheer and fully opaque at once will always come back empty."
                action={
                  <button type="button" onClick={clearAll} className="btn-ink">
                    Clear all filters
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-12 xl:grid-cols-3">
                {results.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 3} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-ink/45 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[85vh] flex-col bg-blush lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-label="Filters"
            >
              <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <h2 className="display-sm text-lg">Filter</h2>
                <div className="flex items-center gap-3">
                  {activeCount > 0 && (
                    <button type="button" onClick={clearAll} className="font-mono text-2xs text-rose">
                      Clear {activeCount}
                    </button>
                  )}
                  <button type="button" onClick={() => setPanelOpen(false)} className="p-1.5" aria-label="Close filters">
                    <X size={19} />
                  </button>
                </div>
              </header>
              <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">{facets}</div>
              <footer className="border-t border-ink/10 p-4">
                <button type="button" onClick={() => setPanelOpen(false)} className="btn-ink w-full">
                  Show {results.length} {results.length === 1 ? 'piece' : 'pieces'}
                </button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* --------------------------------------------------------------- facets --- */

function Group({ title, children, note }) {
  return (
    <section className="border-b border-ink/10 py-5 first:pt-0">
      <h3 className="spec-key mb-3">{title}</h3>
      {children}
      {note && <p className="mt-2.5 font-mono text-2xs leading-relaxed text-taupe">{note}</p>}
    </section>
  )
}

function FilterPanel({ collections, active, toggle, setFlag, products }) {
  const countBy = (fn) => products.filter(fn).length

  return (
    <div>
      <Group title="Collection">
        <div className="space-y-2.5">
          {collections
            .filter((c) => c.published)
            .map((c) => (
              <Checkbox
                key={c.slug}
                label={c.name}
                hint={`${countBy((p) => p.collection === c.slug)} pieces`}
                checked={active.collection.includes(c.slug)}
                onChange={() => toggle('collection', c.slug)}
              />
            ))}
        </div>
      </Group>

      <Group title="Fabric weight" note="GSM is grams per square metre — the number the mill prints on the roll.">
        <div className="space-y-2.5">
          {WEIGHT_BANDS.map((b) => (
            <Checkbox
              key={b.key}
              label={b.label}
              hint={`${countBy(b.test)} pieces`}
              checked={active.weight.includes(b.key)}
              onChange={() => toggle('weight', b.key)}
            />
          ))}
        </div>
      </Group>

      <Group title="Cut">
        <div className="space-y-2.5">
          {STYLE_FILTERS.map((s) => (
            <Checkbox
              key={s.key}
              label={s.label}
              hint={`${countBy((p) => p.style === s.key)} pieces`}
              checked={active.style.includes(s.key)}
              onChange={() => toggle('style', s.key)}
            />
          ))}
        </div>
      </Group>

      <Group title="Colour family">
        <div className="flex flex-wrap gap-2">
          {COLOR_FAMILIES.map((f) => {
            const on = active.family.includes(f.key)
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggle('family', f.key)}
                aria-pressed={on}
                className={cx(
                  'flex items-center gap-2 border px-2.5 py-1.5 font-mono text-2xs transition-colors',
                  on ? 'border-ink bg-ink text-blush' : 'border-ink/15 hover:border-ink/40'
                )}
              >
                <span
                  className="h-3 w-3 border border-black/10"
                  style={{ background: f.swatch }}
                  aria-hidden="true"
                />
                {f.label}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Occasion">
        <div className="flex flex-wrap gap-2">
          {OCCASION_FILTERS.map((o) => {
            const on = active.occasion.includes(o.key)
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => toggle('occasion', o.key)}
                aria-pressed={on}
                className={cx(
                  'border px-2.5 py-1.5 font-mono text-2xs transition-colors',
                  on ? 'border-ink bg-ink text-blush' : 'border-ink/15 hover:border-ink/40'
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Price">
        <div className="space-y-2.5">
          {PRICE_BANDS.map((b) => (
            <Checkbox
              key={b.key}
              label={b.label}
              hint={`${countBy(b.test)} pieces`}
              checked={active.price.includes(b.key)}
              onChange={() => toggle('price', b.key)}
            />
          ))}
        </div>
      </Group>

      <Group title="Other">
        <div className="space-y-2.5">
          <Checkbox
            label="Wears without pins"
            hint={`${countBy((p) => p.pinless)} pieces`}
            checked={active.pinless}
            onChange={(v) => setFlag('pinless', v)}
          />
          <Checkbox
            label="In stock only"
            checked={active.inStock}
            onChange={(v) => setFlag('inStock', v)}
          />
        </div>
      </Group>
    </div>
  )
}
