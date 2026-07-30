import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Instagram, Truck, RotateCcw, BadgeIndianRupee, Ruler } from 'lucide-react'
import useStore, { publishedProducts } from '../store/useStore'
import { COLORWAYS } from '../data/colorways.mjs'
import { Eyebrow, Reveal, SectionHead, Stars, Badge } from '../components/ui'
import ProductCard from '../components/ProductCard'
import DrapeMeter, { DIMENSIONS } from '../components/DrapeMeter'
import WeaveDiagram from '../components/WeaveDiagram'
import { AuraMark } from '../components/Logo'
import { money } from '../lib/format'
import { WEAVE_LABELS } from '../data/collections'

export default function Home() {
  const products = useStore(publishedProducts)
  const collections = useStore((s) => s.collections.filter((c) => c.published))
  const reviews = useStore((s) => s.reviews.filter((r) => r.published && r.rating === 5))
  const brand = useStore((s) => s.settings.brand)
  const shipping = useStore((s) => s.settings.shipping)

  const featured = products.filter((p) => p.featured).slice(0, 4)
  const bestsellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 8)
  const hero = products.find((p) => p.slug === 'mahd-modal-everyday') || products[0]

  return (
    <>
      <Hero product={hero} brand={brand} />
      <DyeRail />
      <FeaturedGrid products={featured} />
      <HowItFalls />
      <CollectionsBand collections={collections} />
      <Bestsellers products={bestsellers} />
      <SpecPromise products={products} />
      <Voices reviews={reviews.slice(0, 3)} />
      <TrustRow shipping={shipping} />
      <InstagramBand brand={brand} products={products} />
    </>
  )
}

/* ----------------------------------------------------------------- hero --- */

function Hero({ product, brand }) {
  const reduce = useReducedMotion()
  const colorway = product?.colorways?.[0]

  return (
    <section className="register-ink weave-ground relative overflow-hidden">
      {/* Two dye clouds drifting out of phase — the only ambient motion on the
          site, and the reason the ink ground does not read as flat. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="dye-a absolute -left-1/4 top-[-20%] h-[70vh] w-[70vh] rounded-full opacity-[0.32] blur-[90px]"
          style={{ background: 'radial-gradient(circle, #B98D86 0%, transparent 68%)' }}
        />
        <div
          className="dye-b absolute -right-1/4 bottom-[-25%] h-[65vh] w-[65vh] rounded-full opacity-[0.26] blur-[90px]"
          style={{ background: 'radial-gradient(circle, #B8894F 0%, transparent 68%)' }}
        />
      </div>

      <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow onInk className="mb-6 text-gold">
              Mumbai · since 2021 · ships across India
            </Eyebrow>

            <h1 className="text-[2.7rem] leading-[0.98] sm:text-6xl lg:text-[4.4rem]">
              You cannot feel
              <br />
              a hijab through
              <br />
              <span className="text-rose-light">a photograph.</span>
            </h1>

            <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-blush/70">
              So we publish the numbers instead. Every piece carries its weave, its GSM, and a
              three-part read on how it actually falls — sheer to opaque, crisp to fluid, matte to
              lustre. Read it before you buy it.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/shop" className="btn-blush group">
                Shop all hijabs
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link to="/how-it-falls" className="btn-outline-blush">
                How the drape read works
              </Link>
            </div>

            <p className="mt-8 font-script text-3xl text-gold">{brand.tagline}</p>
          </motion.div>
        </div>

        {/* The hero product is presented as a swatch card, not a lifestyle shot —
            the card is the thesis. */}
        {product && colorway && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            <Link to={`/product/${product.slug}`} className="group block">
              <div className="relative overflow-hidden">
                <img
                  src={colorway.images[0]}
                  alt={`${product.name} in ${colorway.name}`}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-[1200ms] ease-drape group-hover:scale-[1.03]"
                />
                <div className="absolute left-4 top-4">
                  <Badge tone="ink">House cloth</Badge>
                </div>
              </div>

              <div className="border border-blush/15 bg-cocoa-deep/60 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="display-sm text-lg text-blush">{product.name}</h2>
                    <p className="mt-1 font-mono text-2xs uppercase tracking-[0.1em] text-blush/50">
                      {product.fabric} · {product.gsm} GSM · {WEAVE_LABELS[product.weave]}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-lg tabular-nums text-blush">
                    {money(product.price)}
                  </span>
                </div>

                <DrapeMeter drape={product.drape} onInk className="mt-5" />
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- dye rail --- */

function DyeRail() {
  const codes = [...COLORWAYS, ...COLORWAYS]
  return (
    <section className="register-ink border-y border-blush/10 py-3.5">
      <div className="rail-pause overflow-hidden">
        <div className="rail flex w-max items-center gap-8">
          {codes.map((c, i) => (
            <span key={`${c.code}-${i}`} className="flex shrink-0 items-center gap-2.5">
              <span
                className="h-3.5 w-3.5 border border-blush/20"
                style={{ background: c.hex }}
                aria-hidden="true"
              />
              <span className="font-mono text-2xs uppercase tracking-[0.14em] text-blush/55">
                {c.code} {c.name}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- featured --- */

function FeaturedGrid({ products }) {
  return (
    <section className="shell py-20 md:py-28">
      <SectionHead
        eyebrow="The four we would start you on"
        title="Pieces that do one job well"
        blurb="Not a bestseller list. These are the four that answer the four questions we get asked most — what do I wear daily, what needs no iron, what holds a shape, and what do I wear to a wedding."
        action={
          <Link to="/shop" className="btn-outline group">
            All {products.length > 0 ? '' : ''}hijabs
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.07}>
            <ProductCard product={p} priority={i < 2} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------- how it falls (dark) --- */

function HowItFalls() {
  const samples = [
    { drape: { opacity: 96, fluid: 58, sheen: 8 }, name: 'Cotton-modal jersey', weave: 'jersey', gsm: 180 },
    { drape: { opacity: 72, fluid: 84, sheen: 22 }, name: 'Crinkle chiffon', weave: 'plain', gsm: 62 },
    { drape: { opacity: 88, fluid: 92, sheen: 86 }, name: 'Satin-back crepe', weave: 'satin', gsm: 105 },
  ]

  return (
    <section className="register-cocoa weave-ground py-20 md:py-28">
      <div className="shell">
        <SectionHead
          onInk
          eyebrow="The signature"
          title="Three numbers, and you know how it falls"
          blurb="A photograph flattens fabric. These three scales are the ones we could not find on any other hijab site, so we measured them ourselves — on every piece, in our own studio, against the same reference cloth."
        />

        <div className="grid gap-10 lg:grid-cols-3">
          {samples.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.1}>
              <div className="border border-blush/12 bg-ink/40 p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="display-sm text-lg text-blush">{s.name}</h3>
                    <p className="mt-1 font-mono text-2xs uppercase tracking-[0.1em] text-blush/45">
                      {WEAVE_LABELS[s.weave]} · {s.gsm} GSM
                    </p>
                  </div>
                  <WeaveDiagram weave={s.weave} color="#B8894F" size={52} className="shrink-0 opacity-80" />
                </div>
                <DrapeMeter drape={s.drape} onInk />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-14 grid gap-6 border-t border-blush/12 pt-10 sm:grid-cols-3">
            {DIMENSIONS.map((d, i) => (
              <div key={d.key}>
                <p className="mb-2 font-mono text-2xs uppercase tracking-[0.14em] text-gold">
                  {d.low} → {d.high}
                </p>
                <h4 className="display-sm mb-2 text-base text-blush">{d.label}</h4>
                <p className="text-sm leading-relaxed text-blush/60">
                  {
                    [
                      'Held against printed 10pt text at 30 cm. 100 means you cannot read a word through a single layer.',
                      'Draped over a 90° studio edge and measured where the fold breaks. Low holds an edge; high pours.',
                      'Photographed under one fixed light at 45°. Low scatters it; high returns it.',
                    ][i]
                  }
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-10">
          <Link to="/how-it-falls" className="btn-outline-blush group">
            Read the full method
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ collections --- */

function CollectionsBand({ collections }) {
  return (
    <section className="shell py-20 md:py-28">
      <SectionHead
        eyebrow="Six drawers"
        title="Sorted by the day you are dressing for"
        blurb="Not by colour or by season. By what the cloth is for."
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.06}>
            <Link to={`/collections/${c.slug}`} className="group relative block overflow-hidden">
              <div className="aspect-[4/3] w-full overflow-hidden bg-blush-warm">
                <img
                  src={c.banner}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1000ms] ease-drape group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="eyebrow mb-1.5 text-gold">{c.kicker}</p>
                <h3 className="display-sm text-xl text-blush">{c.name}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-blush/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-md:opacity-100">
                  {c.blurb}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- bestsellers --- */

function Bestsellers({ products }) {
  return (
    <section className="border-t border-ink/10 py-20 md:py-28">
      <div className="shell">
        <SectionHead
          eyebrow="What actually leaves the building"
          title="Most ordered this quarter"
          action={
            <Link to="/shop?sort=popular" className="btn-outline group">
              See the ranking
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- spec promise --- */

function SpecPromise({ products }) {
  const stats = [
    { k: 'Colourways on the dye card', v: COLORWAYS.length },
    { k: 'Pieces published with a full spec', v: products.length },
    { k: 'GSM range we stock', v: '48–240' },
    { k: 'Mills we buy from', v: 7 },
  ]

  return (
    <section className="register-ink weave-ground py-16">
      <div className="shell grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-16">
        <AuraMark size={92} tone="onInk" className="opacity-90" />
        <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k}>
              <dd className="font-mono text-3xl tabular-nums text-blush">{s.v}</dd>
              <dt className="mt-2 font-mono text-2xs uppercase leading-relaxed tracking-[0.12em] text-blush/50">
                {s.k}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- voices --- */

function Voices({ reviews }) {
  return (
    <section className="shell py-20 md:py-28">
      <SectionHead
        eyebrow="From people who bought one"
        title="What they said after wearing it"
        align="center"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={i * 0.08}>
            <figure className="flex h-full flex-col border border-ink/10 bg-white p-6">
              <Stars value={r.rating} />
              <blockquote className="mt-4 flex-1">
                <p className="display-sm mb-3 text-base">{r.title}</p>
                <p className="text-[15px] leading-relaxed text-ink/70">{r.body}</p>
              </blockquote>
              <figcaption className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
                <span>
                  {r.author} · {r.city}
                </span>
                {r.verified && <span className="text-rose">Verified</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- trust --- */

function TrustRow({ shipping }) {
  const items = [
    { icon: Truck, t: 'Free over ₹999', b: `${shipping.standardDays} standard, ${shipping.expressDays} express` },
    { icon: BadgeIndianRupee, t: 'COD or UPI', b: 'Pay on delivery, or 5% off when you prepay' },
    { icon: RotateCcw, t: '7-day returns', b: 'Unworn, tags on. Bridal is final sale' },
    { icon: Ruler, t: 'Every spec published', b: 'Weave, GSM, dimensions and drape on every page' },
  ]

  return (
    <section className="border-y border-ink/10 bg-blush-warm py-12">
      <div className="shell grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, t, b }) => (
          <div key={t} className="flex gap-3.5">
            <Icon size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-deep" />
            <div>
              <p className="display-sm text-[15px]">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/60">{b}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ instagram --- */

function InstagramBand({ brand, products }) {
  // The grid is real product photography rather than a fake embed, so nothing
  // here breaks when the Instagram API is wired up later.
  const tiles = products
    .flatMap((p) => p.colorways.map((c) => ({ src: c.images[1], alt: `${p.name} in ${c.name}` })))
    .slice(0, 12)

  return (
    <section className="shell py-20 md:py-24">
      <SectionHead
        eyebrow="Tag us and we will repost you"
        title={`@${brand.instagram}`}
        blurb="Styling, restocks and the dye lots as they come off the line."
        align="center"
        action={
          <a
            href={brand.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ink group"
          >
            <Instagram size={16} />
            Follow on Instagram
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        }
      />

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {tiles.map((t, i) => (
          <a
            key={i}
            href={brand.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative block aspect-square overflow-hidden bg-blush-warm"
          >
            <img
              src={t.src}
              alt={t.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-drape group-hover:scale-110"
            />
            <span className="absolute inset-0 grid place-items-center bg-ink/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Instagram size={18} className="text-blush" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
