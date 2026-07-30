/** The editorial pages: the drape method, styling, care, size guide, FAQ. */
import { Link, useParams } from 'react-router-dom'
import { Ruler, Lightbulb, Waves, Sun, Instagram } from 'lucide-react'
import useStore, { publishedProducts } from '../store/useStore'
import { Accordion, Eyebrow, Reveal, SectionHead } from '../components/ui'
import DrapeMeter, { DIMENSIONS } from '../components/DrapeMeter'
import WeaveDiagram from '../components/WeaveDiagram'
import ProductCard from '../components/ProductCard'
import { CARE_RULES, FAQS, SIZE_GUIDE, STYLING_STEPS, POLICIES } from '../data/content'
import { WEAVE_LABELS } from '../data/collections'
import NotFound from './NotFound'

/* ------------------------------------------------------------ how it falls --- */

const METHOD = [
  {
    icon: Sun,
    dim: 'Opacity',
    range: 'sheer 0 — 100 opaque',
    how: 'One layer of cloth is laid over 10pt printed text and photographed from 30 cm under fixed light. We score how much of the text survives. Below 75 we would wear an under-cap; at 90 and above you do not need one.',
  },
  {
    icon: Waves,
    dim: 'Fall',
    range: 'crisp 0 — 100 fluid',
    how: 'The cloth is draped over a 90° studio edge with no weight added, and we measure the distance from the edge to where the first fold breaks. A short distance means it holds an architectural shape; a long one means it pours.',
  },
  {
    icon: Lightbulb,
    dim: 'Finish',
    range: 'matte 0 — 100 lustre',
    how: 'A single light at 45° and a fixed exposure. We measure the brightest return off the surface against a matte reference card. High numbers catch light in the folds, which reads as occasion wear.',
  },
]

export function HowItFalls() {
  const products = useStore(publishedProducts)
  const extremes = [
    products.reduce((a, b) => (b.drape.opacity > a.drape.opacity ? b : a), products[0]),
    products.reduce((a, b) => (b.drape.fluid > a.drape.fluid ? b : a), products[0]),
    products.reduce((a, b) => (b.drape.sheen > a.drape.sheen ? b : a), products[0]),
  ].filter(Boolean)

  const weaves = ['plain', 'twill', 'satin', 'jersey', 'tulle']

  return (
    <>
      <header className="register-ink weave-ground py-16 md:py-24">
        <div className="shell max-w-3xl">
          <Eyebrow onInk className="mb-4 text-gold">
            The method
          </Eyebrow>
          <h1 className="text-[2.4rem] leading-tight md:text-[3.4rem]">
            How we measure the way a hijab falls
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-blush/70">
            Every hijab site tells you a fabric is “soft” and “flowy”. Those words mean nothing you
            can compare. So we built three scales, measured every piece against the same reference
            cloth under the same light, and published the numbers — including the unflattering ones.
          </p>
        </div>
      </header>

      <section className="shell py-16 md:py-24">
        <SectionHead
          eyebrow="Three scales"
          title="What each number is measuring"
          blurb="Not opinion, and not the mill's marketing sheet. Our own bench, same conditions every time."
        />

        <div className="grid gap-10 lg:grid-cols-3">
          {METHOD.map((m, i) => (
            <Reveal key={m.dim} delay={i * 0.08}>
              <div className="border-t-2 border-ink pt-6">
                <m.icon size={20} strokeWidth={1.5} className="mb-4 text-gold-deep" />
                <p className="font-mono text-2xs uppercase tracking-[0.14em] text-gold-deep">{m.range}</p>
                <h3 className="display-sm mt-2 text-xl">{m.dim}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{m.how}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="register-cocoa weave-ground py-16 md:py-24">
        <div className="shell">
          <SectionHead
            onInk
            eyebrow="Read together"
            title="The three numbers only mean something as a set"
            blurb="A 62 GSM chiffon and a 240 GSM ribbed jersey can both be right — for completely different days. Here is the extreme of each scale in our own catalogue."
          />

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Keyed by dimension, not product — one piece can top two scales. */}
            {extremes.map((p, i) => (
              <Reveal key={DIMENSIONS[i].key} delay={i * 0.08}>
                <div className="border border-blush/12 bg-ink/40 p-6">
                  <p className="eyebrow mb-3 text-gold">
                    Highest {DIMENSIONS[i].label.toLowerCase()} we make
                  </p>
                  <Link to={`/product/${p.slug}`} className="display-sm text-lg text-blush link-selvedge">
                    {p.name}
                  </Link>
                  <p className="mt-1.5 font-mono text-2xs uppercase tracking-[0.1em] text-blush/45">
                    {p.fabric} · {p.gsm} GSM
                  </p>
                  <DrapeMeter drape={p.drape} onInk className="mt-5" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16 md:py-24">
        <SectionHead
          eyebrow="Structure"
          title="Five ways to interlace a yarn"
          blurb="The weave decides more about behaviour than the fibre does. These diagrams are drawn from the actual interlacing, not decoration."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {weaves.map((w, i) => (
            <Reveal key={w} delay={i * 0.06}>
              <div className="border border-ink/12 bg-white p-5">
                <WeaveDiagram weave={w} color="#96625A" size={72} className="mb-4" />
                <h3 className="display-sm text-base">{WEAVE_LABELS[w]}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {
                    {
                      plain: 'One over, one under. The most stable structure and the least drapey — chiffons and voiles.',
                      twill: 'A diagonal float. Falls in long unbroken lines instead of small folds, which is why it reads as tailored.',
                      satin: 'Long floats on one face. Maximum lustre, minimum grip — this is the one that slips.',
                      jersey: 'Not woven at all. Interlocking loops, which is where the stretch comes from.',
                      tulle: 'A hexagonal net. Almost no weight, which is why bead work can sit on it.',
                    }[w]
                  }
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-ink/10 py-16">
        <div className="shell max-w-2xl text-center">
          <h2 className="text-3xl">Now go and read a label</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            Every product page carries these three numbers, its weave diagram, its GSM and its
            dimensions. Nothing is hidden behind “premium quality”.
          </p>
          <Link to="/shop" className="btn-ink mt-7">
            Shop all hijabs
          </Link>
        </div>
      </section>
    </>
  )
}

/* ----------------------------------------------------------------- styling --- */

export function Styling() {
  const products = useStore(publishedProducts)
  const pinless = products.filter((p) => p.pinless).slice(0, 4)

  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-20">
        <div className="shell max-w-2xl">
          <Eyebrow onInk className="mb-4 text-gold">
            Three ways
          </Eyebrow>
          <h1 className="text-[2.4rem] leading-tight md:text-[3.2rem]">How to wear it</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-blush/70">
            Not forty tutorials. Three wraps that cover almost every day, each matched to the
            fabrics that actually behave well in it.
          </p>
        </div>
      </header>

      <section className="shell py-14 md:py-20">
        <div className="space-y-14">
          {STYLING_STEPS.map((s, i) => (
            <Reveal key={s.name}>
              <article className="grid gap-6 border-t-2 border-ink pt-7 lg:grid-cols-[18rem_1fr] lg:gap-12">
                <div>
                  {/* Numbered because these are ordered by how long they take,
                      shortest last — the order carries information. */}
                  <p className="font-mono text-2xs uppercase tracking-[0.14em] text-gold-deep">
                    Method {String(i + 1).padStart(2, '0')} · {s.time}
                  </p>
                  <h2 className="display-sm mt-2 text-2xl">{s.name}</h2>
                  <p className="mt-3 font-mono text-2xs leading-relaxed text-taupe">
                    Best in: {s.best}
                  </p>
                </div>

                <ol className="space-y-3.5">
                  {s.steps.map((step, j) => (
                    <li key={j} className="flex gap-4">
                      <span className="mt-0.5 shrink-0 font-mono text-2xs tabular-nums text-rose">
                        {j + 1}
                      </span>
                      <span className="text-[15px] leading-relaxed text-ink/80">{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {pinless.length > 0 && (
        <section className="border-t border-ink/10 py-16">
          <div className="shell">
            <SectionHead eyebrow="Nothing to pin" title="The pinless shortlist" />
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {pinless.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

/* -------------------------------------------------------------------- care --- */

export function Care() {
  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-20">
        <div className="shell max-w-2xl">
          <Eyebrow onInk className="mb-4 text-gold">
            Fabric care
          </Eyebrow>
          <h1 className="text-[2.4rem] leading-tight md:text-[3.2rem]">
            Make it last more than a season
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-blush/70">
            Most hijabs are ruined by one of two things: a hot iron on a heat-set finish, or a hot
            tumble dry on elastane. Everything below is a variation of avoiding those two.
          </p>
        </div>
      </header>

      <section className="shell py-14 md:py-20">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="spec-key pb-3 pr-4">Fabric</th>
                <th className="spec-key pb-3 pr-4">Wash</th>
                <th className="spec-key pb-3 pr-4">Dry</th>
                <th className="spec-key pb-3 pr-4">Iron</th>
              </tr>
            </thead>
            <tbody>
              {CARE_RULES.map((r) => (
                <tr key={r.fabric} className="border-b border-ink/10 align-top">
                  <td className="py-4 pr-4">
                    <p className="display-sm text-[15px]">{r.fabric}</p>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink/65">{r.note}</p>
                  </td>
                  <td className="py-4 pr-4 font-mono text-[13px]">{r.wash}</td>
                  <td className="py-4 pr-4 font-mono text-[13px]">{r.dry}</td>
                  <td className="py-4 pr-4 font-mono text-[13px]">{r.iron}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 border-l-2 border-gold pl-4 text-[15px] leading-relaxed text-ink/70">
          Every product page carries its own care line. Where it differs from this table, follow the
          product page — it is specific to that finish.
        </p>
      </section>
    </>
  )
}

/* -------------------------------------------------------------- size guide --- */

export function SizeGuide() {
  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-20">
        <div className="shell max-w-2xl">
          <Eyebrow onInk className="mb-4 text-gold">
            Sizing
          </Eyebrow>
          <h1 className="text-[2.4rem] leading-tight md:text-[3.2rem]">Which cut, and how long</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-blush/70">
            A hijab has no size, but it does have dimensions — and 10 cm of length changes how a
            wrap sits more than most people expect.
          </p>
        </div>
      </header>

      <section className="shell py-14 md:py-20">
        <div className="space-y-8">
          {SIZE_GUIDE.map((s) => (
            <Reveal key={s.cut}>
              <div className="grid gap-4 border-t border-ink/10 pt-6 md:grid-cols-[16rem_1fr] md:gap-10">
                <div className="flex items-start gap-3">
                  <Ruler size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-deep" />
                  <p className="font-mono text-[13px] leading-relaxed">{s.cut}</p>
                </div>
                <div>
                  <p className="text-[15px] leading-relaxed text-ink/80">{s.who}</p>
                  <p className="mt-2 font-mono text-2xs leading-relaxed text-taupe">{s.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 border border-ink/12 bg-blush-warm p-6">
          <h2 className="display-sm mb-3 text-lg">How to measure one you already own</h2>
          <p className="text-[15px] leading-relaxed text-ink/75">
            Lay it flat without stretching it, then measure the short side and the long side in
            centimetres. If you like how it sits, match those two numbers on our product pages — the
            dimensions are on every one.
          </p>
        </div>
      </section>
    </>
  )
}

/* --------------------------------------------------------------------- faq --- */

export function Faq() {
  const brand = useStore((s) => s.settings.brand)
  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-20">
        <div className="shell max-w-2xl">
          <Eyebrow onInk className="mb-4 text-gold">
            Questions
          </Eyebrow>
          <h1 className="text-[2.4rem] leading-tight md:text-[3.2rem]">
            Everything we get asked
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-blush/70">
            If your question is not here,{' '}
            <a
              href={`https://wa.me/${brand.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="text-rose-light underline underline-offset-2"
            >
              message us on WhatsApp
            </a>{' '}
            — we answer within a few hours.
          </p>
        </div>
      </header>

      <section className="shell max-w-3xl py-14 md:py-20">
        <div className="space-y-12">
          {FAQS.map((group) => (
            <div key={group.group}>
              <h2 className="eyebrow mb-4 text-gold-deep">{group.group}</h2>
              <Accordion items={group.items} />
            </div>
          ))}
        </div>

        <div className="mt-14 border border-ink/12 bg-blush-warm p-6">
          <h2 className="display-sm mb-2 text-lg">Still stuck?</h2>
          <p className="text-[15px] leading-relaxed text-ink/75">
            Send us the product page and your question. If it is about a colour, send the Instagram
            post — we can look up the dye code from the photo.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-ink">
              Contact us
            </Link>
            <a
              href={brand.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              <Instagram size={15} />@{brand.instagram}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

/* ---------------------------------------------------------------- policies --- */

export function Policy() {
  const { slug } = useParams()
  const policy = POLICIES[slug]
  if (!policy) return <NotFound />

  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-18">
        <div className="shell max-w-2xl">
          <Eyebrow onInk className="mb-4 text-gold">
            Last updated {policy.updated}
          </Eyebrow>
          <h1 className="text-[2.2rem] leading-tight md:text-[3rem]">{policy.title}</h1>
        </div>
      </header>

      <div className="shell max-w-2xl py-14">
        <div className="space-y-9">
          {policy.body.map((s) => (
            <section key={s.h}>
              <h2 className="display-sm mb-2 text-lg">{s.h}</h2>
              <p className="text-[15px] leading-relaxed text-ink/75">{s.p}</p>
            </section>
          ))}
        </div>

        <nav className="mt-14 border-t border-ink/10 pt-8">
          <p className="spec-key mb-3">Other policies</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(POLICIES)
              .filter(([k]) => k !== slug)
              .map(([k, v]) => (
                <Link
                  key={k}
                  to={`/policies/${k}`}
                  className="border border-ink/15 px-3 py-2 font-mono text-2xs transition-colors hover:border-ink"
                >
                  {v.title}
                </Link>
              ))}
          </div>
        </nav>
      </div>
    </>
  )
}
