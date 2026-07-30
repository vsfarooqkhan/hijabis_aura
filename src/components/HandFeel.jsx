import { motion, useReducedMotion } from 'framer-motion'
import cx from '../lib/cx'
import { AXES, handWords, stepIndex, stepLabel } from '../data/hand'

/**
 * "The hand" — how each cloth behaves, shown as a position on a named scale.
 *
 * Stepped rather than numeric on purpose: these are judgements made by handling
 * the fabric, so the display should not imply a measured score. Each step is a
 * block of warp threads, which keeps the woven look without claiming precision.
 */

const THREADS_PER_STEP = 7

function Scale({ axis, value, onInk, thin }) {
  const reduce = useReducedMotion()
  const active = stepIndex(axis.key, value)
  if (active < 0) return null

  const dyed = onInk ? 'rgba(201,164,156,' : 'rgba(150,98,90,'
  const bare = onInk ? 'rgba(247,239,236,0.18)' : 'rgba(36,26,24,0.12)'

  return (
    <div className={cx('flex w-full items-stretch', thin ? 'h-1.5 gap-1.5' : 'h-7 gap-2')}>
      {axis.steps.map((step, si) => {
        const on = si <= active
        // The current step reads at full strength; earlier ones sit back, so the
        // eye lands on where the fabric actually is.
        const strength = si === active ? 1 : on ? 0.42 : 0
        return (
          <div key={step.key} className="flex flex-1 items-stretch gap-px">
            {Array.from({ length: thin ? 4 : THREADS_PER_STEP }, (_, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                className="flex-1"
                style={{ background: on ? `${dyed}${strength})` : bare }}
                initial={reduce || thin ? false : { scaleY: 0.2, opacity: 0 }}
                whileInView={reduce || thin ? undefined : { scaleY: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: Math.min(si * 0.08 + i * 0.012, 0.5),
                }}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** Card-sized: the reading in words, plus the same mark in miniature. */
export function HandFeelSignature({ hand, onInk = false, className }) {
  if (!hand) return null
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-stretch gap-2" aria-hidden="true">
        {AXES.map((a) => (
          <Scale key={a.key} axis={a} value={hand[a.key]} onInk={onInk} thin />
        ))}
      </div>
      <p
        className={cx(
          'font-mono text-2xs lowercase tracking-[0.06em]',
          onInk ? 'text-blush/55' : 'text-taupe'
        )}
      >
        {handWords(hand).join(' · ')}
      </p>
    </div>
  )
}

/** Full version for the product page and the guide. */
export default function HandFeel({ hand, onInk = false, className }) {
  if (!hand) return null

  return (
    <div className={cx('space-y-5', className)}>
      {AXES.map((a) => {
        const value = hand[a.key]
        if (stepIndex(a.key, value) < 0) return null
        return (
          <div key={a.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className={cx('spec-key', onInk && 'text-blush/60')}>{a.label}</span>
              <span
                className={cx('font-mono text-xs lowercase', onInk ? 'text-gold' : 'text-rose')}
              >
                {stepLabel(a.key, value)}
              </span>
            </div>

            <Scale axis={a} value={value} onInk={onInk} />

            <div
              className={cx(
                'mt-1.5 flex justify-between font-mono text-2xs lowercase',
                onInk ? 'text-blush/45' : 'text-taupe'
              )}
            >
              <span>{a.steps[0].label}</span>
              <span>{a.steps[a.steps.length - 1].label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Admin picker. Each option carries the guidance for choosing it, so the person
 * grading a new piece has the same reference every time.
 */
export function HandFeelInput({ hand, onChange }) {
  const value = hand || {}
  return (
    <div className="space-y-6">
      {AXES.map((a) => {
        const active = stepIndex(a.key, value[a.key])
        return (
          <fieldset key={a.key}>
            <legend className="spec-key mb-1">{a.label}</legend>
            <p className="mb-2.5 font-mono text-2xs text-taupe">{a.question}</p>

            <div className="flex flex-wrap gap-2">
              {a.steps.map((step) => {
                const on = step.key === value[a.key]
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => onChange({ ...value, [a.key]: step.key })}
                    aria-pressed={on}
                    title={step.hint}
                    className={cx(
                      'border px-3 py-2 font-mono text-2xs lowercase transition-colors',
                      on ? 'border-ink bg-ink text-blush' : 'border-ink/15 hover:border-ink/40'
                    )}
                  >
                    {step.label}
                  </button>
                )
              })}
            </div>

            {active >= 0 && (
              <p className="mt-2 border-l-2 border-gold/50 pl-2.5 font-mono text-2xs leading-relaxed text-taupe">
                {a.steps[active].hint}
              </p>
            )}

            <div className="mt-3">
              <Scale axis={a} value={value[a.key]} thin />
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
