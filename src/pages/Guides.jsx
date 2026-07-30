/** The editorial pages: styling, care, size guide, FAQ and the policies. */
import { Link, useParams } from 'react-router-dom'
import { Ruler, Instagram } from 'lucide-react'
import useStore, { publishedProducts } from '../store/useStore'
import { Accordion, Eyebrow, Reveal, SectionHead } from '../components/ui'
import ProductCard from '../components/ProductCard'
import { CARE_RULES, FAQS, SIZE_GUIDE, STYLING_STEPS, POLICIES } from '../data/content'
import NotFound from './NotFound'

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
                  {/* These are alternatives, not a sequence, so each carries the
                      time it takes rather than a rank. */}
                  <p className="font-mono text-2xs uppercase tracking-[0.14em] text-gold-deep">
                    {s.time}
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
