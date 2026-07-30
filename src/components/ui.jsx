import { forwardRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Star, Minus, Plus, ChevronDown, Check } from 'lucide-react'
import cx from '../lib/cx'
import { initials } from '../lib/format'

/* -------------------------------------------------------------- reveal --- */

/** Scroll reveal. One gesture, used everywhere, so the page feels composed. */
export function Reveal({ children, delay = 0, y = 18, className, as: As = 'div' }) {
  const reduce = useReducedMotion()
  const MotionAs = motion[As] || motion.div
  if (reduce) return <As className={className}>{children}</As>
  return (
    <MotionAs
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionAs>
  )
}

/* ------------------------------------------------------------ structure --- */

export function Eyebrow({ children, className, onInk }) {
  return (
    <p className={cx('eyebrow', onInk ? 'text-blush/55' : 'text-taupe', className)}>{children}</p>
  )
}

/** A section heading with its eyebrow and an optional trailing link. */
export function SectionHead({ eyebrow, title, blurb, action, onInk, align = 'left', className }) {
  return (
    <div
      className={cx(
        'mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center md:text-center',
        className
      )}
    >
      <div className={cx('max-w-2xl', align === 'center' && 'text-center')}>
        {eyebrow && <Eyebrow onInk={onInk} className="mb-3">{eyebrow}</Eyebrow>}
        <h2 className={cx('text-3xl md:text-[2.75rem]', onInk ? 'text-blush' : 'text-ink')}>
          {title}
        </h2>
        {blurb && (
          <p className={cx('mt-4 text-[15px] leading-relaxed', onInk ? 'text-blush/65' : 'text-ink/70')}>
            {blurb}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Rule({ className, onInk }) {
  return (
    <hr className={cx('border-t', onInk ? 'border-blush/15' : 'border-ink/10', className)} />
  )
}

/* --------------------------------------------------------------- badges --- */

const TONES = {
  rose: 'bg-rose/10 text-rose-deep border-rose/25',
  gold: 'bg-gold-wash text-gold-deep border-gold/35',
  clay: 'bg-clay-wash text-clay-deep border-clay/30',
  taupe: 'bg-ink/[0.05] text-taupe border-ink/12',
  ink: 'bg-ink text-blush border-ink',
}

export function Badge({ children, tone = 'taupe', className }) {
  return (
    <span
      className={cx(
        'eyebrow inline-flex items-center gap-1 border px-2 py-1 leading-none',
        TONES[tone] || TONES.taupe,
        className
      )}
    >
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- stars --- */

export function Stars({ value = 0, size = 13, className, showValue = false, count }) {
  return (
    <span className={cx('inline-flex items-center gap-1', className)}>
      <span className="inline-flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i))
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star size={size} className="absolute inset-0 text-ink/20" strokeWidth={1.5} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="text-gold" fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          )
        })}
      </span>
      <span className="sr-only">{value} out of 5</span>
      {showValue && <span className="font-mono text-2xs tabular-nums text-taupe">{value.toFixed(1)}</span>}
      {count != null && <span className="font-mono text-2xs tabular-nums text-taupe">({count})</span>}
    </span>
  )
}

/* ------------------------------------------------------------- controls --- */

export function QtyStepper({ value, onChange, min = 1, max = 20, size = 'md' }) {
  const pad = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'
  return (
    <div className="inline-flex items-center border border-ink/15">
      <button
        type="button"
        className={cx(pad, 'flex items-center justify-center text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30')}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Reduce quantity"
      >
        <Minus size={14} />
      </button>
      <span className={cx('min-w-9 text-center font-mono text-sm tabular-nums', size === 'sm' && 'min-w-7 text-xs')}>
        {value}
      </span>
      <button
        type="button"
        className={cx(pad, 'flex items-center justify-center text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30')}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

export const Field = forwardRef(function Field(
  { label, error, hint, className, boxed = true, as = 'input', children, ...rest },
  ref
) {
  const As = as
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      <As
        ref={ref}
        className={cx(boxed ? 'field-boxed' : 'field', error && 'field-err', as === 'textarea' && 'min-h-24 resize-y')}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      >
        {children}
      </As>
      {error ? (
        <span className="mt-1 block font-mono text-2xs text-gold-deep">{error}</span>
      ) : hint ? (
        <span className="mt-1 block font-mono text-2xs text-taupe">{hint}</span>
      ) : null}
    </label>
  )
})

// forwardRef so react-hook-form's register() can attach its ref.
export const Select = forwardRef(function Select(
  { label, error, hint, className, children, ...rest },
  ref
) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      <div className="relative">
        <select ref={ref} className={cx('field-boxed appearance-none pr-9', error && 'field-err')} {...rest}>
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-taupe"
        />
      </div>
      {error ? (
        <span className="mt-1 block font-mono text-2xs text-gold-deep">{error}</span>
      ) : hint ? (
        <span className="mt-1 block font-mono text-2xs text-taupe">{hint}</span>
      ) : null}
    </label>
  )
})

export function Checkbox({ label, hint, checked, onChange, className }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-3', className)}>
      <span
        className={cx(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors',
          checked ? 'border-rose bg-rose text-white' : 'border-ink/25 bg-white'
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm leading-snug">{label}</span>
        {hint && <span className="mt-0.5 block font-mono text-2xs text-taupe">{hint}</span>}
      </span>
    </label>
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="mt-0.5 block font-mono text-2xs text-taupe">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
          checked ? 'bg-rose' : 'bg-ink/20'
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-drape',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  )
}

/* ------------------------------------------------------------ accordion --- */

export function Accordion({ items, className, defaultOpen = -1 }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cx('divide-y divide-ink/10 border-y border-ink/10', className)}>
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={it.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span className="display-sm text-[17px]">{it.q}</span>
              <ChevronDown
                size={17}
                className={cx('shrink-0 text-taupe transition-transform duration-300', isOpen && 'rotate-180')}
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pb-5 pr-8 text-[15px] leading-relaxed text-ink/70">{it.a}</div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------- misc --- */

export function Avatar({ name, hex, size = 36 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-mono text-2xs text-white"
      style={{ width: size, height: size, background: hex || '#2E201E' }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, body, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-20 text-center', className)}>
      {Icon && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center border border-ink/12 text-taupe">
          <Icon size={20} strokeWidth={1.5} />
        </span>
      )}
      <h3 className="display-sm text-xl">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink/60">{body}</p>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  )
}

export function PriceTag({ price, mrp, size = 'md', className }) {
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  const big = size === 'lg'
  return (
    <span className={cx('inline-flex items-baseline gap-2', className)}>
      <span className={cx('font-mono tabular-nums', big ? 'text-2xl' : 'text-sm font-medium')}>
        ₹{price.toLocaleString('en-IN')}
      </span>
      {off > 0 && (
        <>
          <span className={cx('font-mono tabular-nums text-taupe line-through', big ? 'text-sm' : 'text-2xs')}>
            ₹{mrp.toLocaleString('en-IN')}
          </span>
          <span className={cx('font-mono text-rose', big ? 'text-xs' : 'text-2xs')}>−{off}%</span>
        </>
      )}
    </span>
  )
}

/** A dye-card swatch. The tick is drawn in the colour's own contrast. */
export function Swatch({ hex, name, code, selected, onClick, size = 30, disabled, light }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${name} · ${code}${disabled ? ' — out of stock' : ''}`}
      aria-label={`${name}, ${code}${disabled ? ', out of stock' : ''}`}
      aria-pressed={selected}
      className={cx(
        'relative grid place-items-center transition-transform duration-300 ease-drape',
        selected ? 'scale-100' : 'hover:scale-105',
        disabled && 'cursor-not-allowed opacity-40'
      )}
      style={{ width: size, height: size }}
    >
      <span
        className={cx('absolute inset-0 border', selected ? 'border-transparent' : 'border-ink/10')}
        style={{ background: hex }}
      />
      {selected && (
        <span className="absolute -inset-[3px] border border-ink" aria-hidden="true" />
      )}
      {disabled && (
        <span className="absolute inset-0" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-full w-full">
            <line x1="1" y1="19" x2="19" y2="1" stroke={light ? '#241A18' : '#F7EFEC'} strokeWidth="1.2" />
          </svg>
        </span>
      )}
    </button>
  )
}

/** Internal or external link that keeps the selvedge underline behaviour. */
export function TextLink({ to, href, children, className, ...rest }) {
  const cls = cx('link-selvedge text-sm', className)
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  return (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  )
}
