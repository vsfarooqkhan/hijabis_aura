import { motion, useReducedMotion } from 'framer-motion'
import cx from '../lib/cx'

/**
 * The Drape Meter — Hijabisaura's signature.
 *
 * Three scales for the three things a photograph cannot tell you. Each is drawn
 * as warp threads rather than a progress bar: threads left of the value are
 * dyed, and the dye bleeds out over the last few threads instead of stopping on
 * a hard edge, the way it does on real cloth.
 */

export const DIMENSIONS = [
  { key: 'opacity', label: 'Opacity', low: 'sheer', high: 'opaque' },
  { key: 'fluid', label: 'Fall', low: 'crisp', high: 'fluid' },
  { key: 'sheen', label: 'Finish', low: 'matte', high: 'lustre' },
]

const BLEED = 14 // how far the dye feathers past the value, in scale units

const threadOpacity = (pos, value) => {
  if (pos > value) return 0
  const into = value - pos
  if (into >= BLEED) return 1
  return 0.25 + (into / BLEED) * 0.75
}

function Track({ value, count, onInk, thin }) {
  const reduce = useReducedMotion()
  const threads = Array.from({ length: count }, (_, i) => {
    const pos = ((i + 0.5) / count) * 100
    return { pos, o: threadOpacity(pos, value) }
  })

  return (
    <div className={cx('flex w-full items-stretch', thin ? 'h-1.5 gap-px' : 'h-7 gap-[2px]')}>
      {threads.map((t, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="flex-1"
          style={{
            background:
              t.o > 0
                ? onInk
                  ? `rgba(184,137,79,${t.o})`
                  : `rgba(150,98,90,${t.o})`
                : onInk
                  ? 'rgba(247, 239, 236,0.16)'
                  : 'rgba(36, 26, 24,0.11)',
          }}
          initial={reduce ? false : { scaleY: 0.15, opacity: 0 }}
          whileInView={reduce ? undefined : { scaleY: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: Math.min(i * 0.012, 0.5),
          }}
        />
      ))}
    </div>
  )
}

/**
 * Plain language for the same three numbers. A card has no room to explain a
 * scale, so it gets the reading instead of the instrument.
 */
export const drapeWords = (drape) => {
  if (!drape) return []
  const { opacity = 0, fluid = 0, sheen = 0 } = drape
  return [
    opacity >= 95 ? 'fully opaque' : opacity >= 80 ? 'opaque' : opacity >= 62 ? 'semi-sheer' : 'sheer',
    fluid >= 80 ? 'fluid' : fluid >= 60 ? 'soft' : fluid >= 42 ? 'structured' : 'crisp',
    sheen >= 70 ? 'high lustre' : sheen >= 40 ? 'soft sheen' : 'matte',
  ]
}

/**
 * The card-sized mark: one row, three groups of threads, one group per scale.
 * Recognisable as the same instrument without pretending to be readable.
 */
export function DrapeSignature({ drape, onInk = false, className }) {
  if (!drape) return null
  const words = drapeWords(drape)
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-stretch gap-2" aria-hidden="true">
        {DIMENSIONS.map((d) => {
          const v = drape[d.key] ?? 0
          return (
            <div key={d.key} className="flex h-1.5 flex-1 items-stretch gap-px">
              {Array.from({ length: 9 }, (_, i) => {
                const pos = ((i + 0.5) / 9) * 100
                const o = threadOpacity(pos, v)
                return (
                  <span
                    key={i}
                    className="flex-1"
                    style={{
                      background:
                        o > 0
                          ? onInk
                            ? `rgba(201,164,156,${o})`
                            : `rgba(150,98,90,${o})`
                          : onInk
                            ? 'rgba(247,239,236,0.18)'
                            : 'rgba(36,26,24,0.12)',
                    }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
      <p
        className={cx(
          'font-mono text-2xs lowercase tracking-[0.06em]',
          onInk ? 'text-blush/55' : 'text-taupe'
        )}
      >
        {words.join(' · ')}
      </p>
    </div>
  )
}

export default function DrapeMeter({ drape, compact = false, onInk = false, className }) {
  if (!drape) return null

  if (compact) return <DrapeSignature drape={drape} onInk={onInk} className={className} />

  return (
    <div className={cx('space-y-5', className)}>
      {DIMENSIONS.map((d) => {
        const v = drape[d.key] ?? 0
        return (
          <div key={d.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className={cx('spec-key', onInk && 'text-blush/60')}>{d.label}</span>
              <span
                className={cx(
                  'font-mono text-xs tabular-nums',
                  onInk ? 'text-gold' : 'text-rose'
                )}
              >
                {v}
                <span className={cx('ml-0.5 text-2xs', onInk ? 'text-blush/40' : 'text-taupe')}>
                  /100
                </span>
              </span>
            </div>

            <Track value={v} count={44} onInk={onInk} />

            <div
              className={cx(
                'mt-1.5 flex justify-between font-mono text-2xs lowercase',
                onInk ? 'text-blush/45' : 'text-taupe'
              )}
            >
              <span>{d.low}</span>
              <span>{d.high}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Editable version for the admin product editor. */
export function DrapeMeterInput({ drape, onChange }) {
  return (
    <div className="space-y-5">
      {DIMENSIONS.map((d) => {
        const v = drape?.[d.key] ?? 0
        return (
          <div key={d.key}>
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor={`drape-${d.key}`} className="spec-key">
                {d.label} — {d.low} to {d.high}
              </label>
              <span className="font-mono text-xs tabular-nums text-rose">{v}</span>
            </div>
            <input
              id={`drape-${d.key}`}
              type="range"
              min="0"
              max="100"
              value={v}
              onChange={(e) => onChange({ ...drape, [d.key]: Number(e.target.value) })}
              className="w-full accent-rose"
            />
            <div className="mt-1">
              <div className="flex h-1.5 w-full items-stretch gap-px" aria-hidden="true">
                {Array.from({ length: 44 }, (_, i) => {
                  const pos = ((i + 0.5) / 44) * 100
                  const o = threadOpacity(pos, v)
                  return (
                    <span
                      key={i}
                      className="flex-1"
                      style={{
                        background: o > 0 ? `rgba(150,98,90,${o})` : 'rgba(36, 26, 24,0.11)',
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
