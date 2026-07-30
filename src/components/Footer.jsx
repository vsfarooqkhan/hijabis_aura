import { Link } from 'react-router-dom'
import { Instagram, Mail, Phone, MessageCircle, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Logo from './Logo'
import useStore from '../store/useStore'
import { COLORWAYS } from '../data/colorways.mjs'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['/shop', 'All hijabs'],
      ['/collections/everyday-modal', 'Everyday Modal'],
      ['/collections/crinkle-chiffon', 'Crinkle & Chiffon'],
      ['/collections/occasion-satin', 'Occasion & Satin'],
      ['/collections/jersey-instant', 'Jersey & Instant'],
      ['/collections/bridal-atelier', 'Bridal Atelier'],
      ['/collections/essentials', 'Essentials'],
    ],
  },
  {
    title: 'Learn',
    links: [
      ['/styling', 'How to wear it'],
      ['/care', 'Fabric care'],
      ['/size-guide', 'Size guide'],
      ['/about', 'Our story'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['/track', 'Track an order'],
      ['/faq', 'FAQ'],
      ['/contact', 'Contact us'],
      ['/policies/shipping', 'Shipping'],
      ['/policies/returns', 'Returns & exchange'],
      ['/policies/privacy', 'Privacy'],
      ['/policies/terms', 'Terms'],
    ],
  },
]

export default function Footer() {
  const brand = useStore((s) => s.settings.brand)
  const [email, setEmail] = useState('')

  const subscribe = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('That email does not look right. Check it once?')
      return
    }
    toast.success('You are on the list. First dye drop lands in your inbox.')
    setEmail('')
  }

  return (
    <footer className="register-ink weave-ground mt-24">
      {/* The dye rail: every colour in the card, running the full width. It is
          the swatch card the whole catalogue is built from. */}
      <div className="flex h-1.5 w-full" aria-hidden="true">
        {COLORWAYS.map((c) => (
          <span key={c.code} className="flex-1" style={{ background: c.hex }} />
        ))}
      </div>

      <div className="shell py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.4fr]">
          <div>
            <Logo size="lg" tone="onInk" />
            <p className="mt-5 font-script text-2xl text-gold">{brand.tagline}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-blush/60">
              {brand.promise}. Fabric, weave, GSM and the exact dimensions are on every product
              page, so you know what you are buying before it arrives.
            </p>

            <div className="mt-7 space-y-2.5 text-sm">
              <a
                href={brand.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 text-blush/75 transition-colors hover:text-rose-light"
              >
                <Instagram size={15} className="text-gold" />@{brand.instagram}
              </a>
              <a
                href={`https://wa.me/${brand.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 text-blush/75 transition-colors hover:text-rose-light"
              >
                <MessageCircle size={15} className="text-gold" />
                WhatsApp us
              </a>
              <a
                href={`mailto:${brand.email}`}
                className="flex items-center gap-2.5 text-blush/75 transition-colors hover:text-rose-light"
              >
                <Mail size={15} className="text-gold" />
                {brand.email}
              </a>
              <a
                href={`tel:${brand.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2.5 text-blush/75 transition-colors hover:text-rose-light"
              >
                <Phone size={15} className="text-gold" />
                {brand.phone}
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow mb-4 text-gold">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map(([to, label]) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="text-sm text-blush/65 transition-colors hover:text-blush"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-12 border-blush/10" />

        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
          <form onSubmit={subscribe} className="max-w-md">
            <label htmlFor="footer-email" className="eyebrow mb-2 block text-gold">
              New dye drops, twice a month
            </label>
            <div className="flex items-center gap-3 border-b border-blush/25 pb-2 focus-within:border-rose-light">
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.in"
                className="flex-1 bg-transparent text-[15px] text-blush outline-none placeholder:text-blush/35"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-blush transition-colors hover:text-rose-light"
              >
                Join <ArrowRight size={13} />
              </button>
            </div>
            <p className="mt-2 font-mono text-2xs text-blush/40">
              New colourways and restocks only. Unsubscribe in one click.
            </p>
          </form>

          <div className="text-sm">
            <p className="eyebrow mb-3 text-gold">Pay how you like</p>
            <div className="flex flex-wrap gap-2">
              {['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Cash on delivery'].map((m) => (
                <span
                  key={m}
                  className="border border-blush/20 px-2.5 py-1.5 font-mono text-2xs text-blush/70"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <hr className="my-12 border-blush/10" />

        <div className="flex flex-col gap-4 font-mono text-2xs text-blush/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. {brand.address}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>GSTIN {brand.gstin}</span>
            <Link to="/admin" className="transition-colors hover:text-blush">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
