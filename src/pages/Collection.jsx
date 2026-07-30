import { Link, useParams } from 'react-router-dom'
import { ArrowRight, PackageSearch } from 'lucide-react'
import useStore, { publishedProducts } from '../store/useStore'
import ProductCard from '../components/ProductCard'
import { Eyebrow, Reveal, EmptyState } from '../components/ui'
import NotFound from './NotFound'

export default function Collection() {
  const { slug } = useParams()
  const collection = useStore((s) => s.collections.find((c) => c.slug === slug))
  const products = useStore(publishedProducts)
  const others = useStore((s) => s.collections.filter((c) => c.published && c.slug !== slug))

  if (!collection || !collection.published) return <NotFound />

  const items = products.filter((p) => p.collection === slug)

  return (
    <>
      <header className="register-ink relative overflow-hidden">
        <img
          src={collection.banner}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/35" />
        <div className="shell relative py-16 md:py-24">
          <Eyebrow onInk className="mb-4 text-gold">
            {collection.kicker}
          </Eyebrow>
          <h1 className="max-w-2xl text-[2.4rem] leading-tight md:text-[3.4rem]">{collection.name}</h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-blush/70">{collection.blurb}</p>
          <p className="mt-6 font-mono text-2xs uppercase tracking-[0.14em] text-blush/50">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'} in this drawer
          </p>
        </div>
      </header>

      <section className="shell py-14 md:py-20">
        {items.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="This drawer is empty right now"
            body="We are between dye lots. Everything else is still on the shelf."
            action={
              <Link to="/shop" className="btn-ink">
                Shop all hijabs
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.06}>
                <ProductCard product={p} priority={i < 4} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-ink/10 py-14">
        <div className="shell">
          <h2 className="eyebrow mb-6">Other drawers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((c) => (
              <Link
                key={c.slug}
                to={`/collections/${c.slug}`}
                className="group flex items-center justify-between gap-3 border border-ink/12 p-4 transition-colors hover:border-ink"
              >
                <span>
                  <span className="display-sm block text-[15px]">{c.name}</span>
                  <span className="mt-0.5 block font-mono text-2xs text-taupe">
                    {products.filter((p) => p.collection === c.slug).length} pieces
                  </span>
                </span>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-taupe transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
