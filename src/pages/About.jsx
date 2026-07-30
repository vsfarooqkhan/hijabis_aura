import { Link } from 'react-router-dom'
import { Instagram, MessageCircle, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import { COLORWAYS } from '../data/colorways.mjs'
import { Eyebrow, Reveal, SectionHead, Field, Select } from '../components/ui'
import { AuraMark } from '../components/Logo'

/* ------------------------------------------------------------------ story --- */

const CHAPTERS = [
  {
    year: '2021',
    title: 'One question we could not answer',
    body: 'We started selling hijabs out of a flat on Mohammed Ali Road. The question we could not answer, over and over, was the simplest one: “is it see-through?” We would say “no, it is good quality” and the customer would order anyway and sometimes be disappointed. That is a bad way to sell cloth.',
    img: '/img/story/mill.svg',
  },
  {
    year: '2023',
    title: 'So we bought a light meter',
    body: 'We built a bench: one fixed lamp, a printed reference card, a 90° edge, a 30 cm rule. Every roll that came in got measured the same way. Within a month we could answer the question with a number instead of an adjective — and we started printing that number on the label.',
    img: '/img/story/dyehouse.svg',
  },
  {
    year: 'Now',
    title: 'Seven mills, one dye card',
    body: `We buy from seven mills across Surat, Tiruppur, Ludhiana, Erode, Coimbatore, Bhuj and Denizli. Every colour we have ever run has a code on one card — ${COLORWAYS.length} of them so far — so when you ask for the green from a post two years ago, we can find it.`,
    img: '/img/story/finishing.svg',
  },
]

export function About() {
  const brand = useStore((s) => s.settings.brand)
  const products = useStore((s) => s.products.filter((p) => p.published))

  return (
    <>
      <header className="register-ink weave-ground py-16 md:py-24">
        <div className="shell max-w-3xl">
          <AuraMark size={64} tone="onInk" className="mb-8" />
          <Eyebrow onInk className="mb-4 text-gold">
            Our story
          </Eyebrow>
          <h1 className="text-[2.4rem] leading-tight md:text-[3.6rem]">
            We are in the business of removing one doubt
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-blush/70">
            Buying cloth online means buying something you cannot touch. Nobody can fix that. What we
            can fix is the guessing — by measuring the three things that a photograph hides, on every
            single piece, and printing them where you can read them before you decide.
          </p>
          <p className="mt-7 font-script text-3xl text-gold">{brand.tagline}</p>
        </div>
      </header>

      <section className="shell py-16 md:py-24">
        <div className="space-y-20">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.year}>
              <article
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                  i % 2 ? 'lg:[&>figure]:order-2' : ''
                }`}
              >
                <figure className="bg-blush-warm">
                  <img src={c.img} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                </figure>
                <div>
                  <p className="font-mono text-2xs uppercase tracking-[0.16em] text-gold-deep">{c.year}</p>
                  <h2 className="display-sm mt-3 text-2xl md:text-3xl">{c.title}</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink/75">{c.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="register-cocoa weave-ground py-16 md:py-24">
        <div className="shell">
          <SectionHead
            onInk
            eyebrow="What we will not do"
            title="Three promises, and what they cost us"
            blurb="Every one of these loses us money somewhere. We think they are worth it."
          />

          <div className="grid gap-8 lg:grid-cols-3">
            {[
              [
                'We publish the unflattering numbers',
                'Our sheerest chiffon scores 58 on opacity and we print it. It sells less than it would with a vaguer description, and the people who buy it are never disappointed.',
              ],
              [
                'We photograph every dye lot of tie-dye',
                'Hand-dyed pieces vary. Rather than shoot one and hope, we shoot one per lot of thirty and say on the page that yours will be a cousin, not a twin.',
              ],
              [
                'We verify UPI payments by hand',
                'No gateway means no gateway fee, which is where the 5% prepaid discount comes from. It also means a person reads every reference number. That person is us.',
              ],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 0.08}>
                <div className="border-t-2 border-gold pt-6">
                  <h3 className="display-sm text-xl text-blush">{t}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-blush/65">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-8 border border-ink/12 bg-blush-warm p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <h2 className="text-2xl md:text-3xl">
              {products.length} pieces, {COLORWAYS.length} colourways, one bench
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/70">
              Read the method, then go and read a label. That is the whole idea.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/how-it-falls" className="btn-ink">
              The method
            </Link>
            <Link to="/shop" className="btn-outline">
              Shop all
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

/* ---------------------------------------------------------------- contact --- */

const contactSchema = z.object({
  name: z.string().trim().min(2, 'What should we call you?'),
  email: z.string().trim().email('We reply to this address.'),
  orderId: z.string().trim().optional(),
  topic: z.string(),
  message: z.string().trim().min(12, 'A little more detail helps us answer properly.'),
})

export function Contact() {
  const brand = useStore((s) => s.settings.brand)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(contactSchema), defaultValues: { topic: 'An order' } })

  const onSubmit = () => {
    // No backend yet — the form validates and confirms, and this is where the
    // POST goes when the API lands.
    toast.success('Message noted. We reply within a few hours, Mumbai time.')
    reset({ topic: 'An order' })
  }

  return (
    <>
      <header className="register-ink weave-ground py-14 md:py-20">
        <div className="shell max-w-2xl">
          <Eyebrow onInk className="mb-4 text-gold">
            Talk to us
          </Eyebrow>
          <h1 className="text-[2.4rem] leading-tight md:text-[3.2rem]">Contact</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-blush/70">
            WhatsApp is fastest — that is where we actually are during the day. Email and this form
            both reach the same inbox.
          </p>
        </div>
      </header>

      <div className="shell grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_20rem] lg:gap-16">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" placeholder="Aisha" error={errors.name?.message} {...register('name')} />
            <Field
              label="Email"
              type="email"
              placeholder="you@example.in"
              error={errors.email?.message}
              {...register('email')}
            />
            <Select label="What is it about?" className="sm:col-span-2" {...register('topic')}>
              <option>An order</option>
              <option>A return or exchange</option>
              <option>Finding a colour</option>
              <option>Bridal and made to order</option>
              <option>Wholesale or reselling</option>
              <option>Something else</option>
            </Select>
            <Field
              label="Order number (if you have one)"
              placeholder="HA24812"
              className="sm:col-span-2 font-mono"
              {...register('orderId')}
            />
            <Field
              as="textarea"
              label="Message"
              placeholder="Tell us what you need. If it is about a colour, the Instagram post link helps."
              rows={6}
              error={errors.message?.message}
              className="sm:col-span-2"
              {...register('message')}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-ink mt-6">
            Send message
          </button>
        </form>

        <aside className="space-y-6 lg:border-l lg:border-ink/10 lg:pl-10">
          <div>
            <p className="spec-key mb-2">Fastest</p>
            <a
              href={`https://wa.me/${brand.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-[15px] hover:text-rose"
            >
              <MessageCircle size={16} className="text-gold-deep" />
              WhatsApp {brand.phone}
            </a>
          </div>

          <div>
            <p className="spec-key mb-2">Email</p>
            <a
              href={`mailto:${brand.email}`}
              className="flex items-center gap-2.5 text-[15px] hover:text-rose"
            >
              <Mail size={16} className="text-gold-deep" />
              {brand.email}
            </a>
          </div>

          <div>
            <p className="spec-key mb-2">Instagram</p>
            <a
              href={brand.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-[15px] hover:text-rose"
            >
              <Instagram size={16} className="text-gold-deep" />@{brand.instagram}
            </a>
            <p className="mt-1.5 font-mono text-2xs leading-relaxed text-taupe">
              DMs are open. Send a post and we will identify the dye code.
            </p>
          </div>

          <div>
            <p className="spec-key mb-2">Studio</p>
            <address className="text-sm not-italic leading-relaxed text-ink/70">
              {brand.address}
            </address>
            <p className="mt-2 font-mono text-2xs text-taupe">
              Mon–Sat, 11am–7pm IST. Visits by appointment.
            </p>
          </div>

          <div className="border-t border-ink/10 pt-5">
            <p className="spec-key mb-2">GSTIN</p>
            <p className="font-mono text-2xs">{brand.gstin}</p>
          </div>
        </aside>
      </div>
    </>
  )
}
