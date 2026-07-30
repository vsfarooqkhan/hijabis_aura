import cx from '../lib/cx'

/**
 * The Hijabisaura marks, rebuilt as vectors from the roundel artwork.
 *
 * The wordmark keeps the roundel's two-tone split — "Hijabis" in espresso,
 * "aura" in rose — which is the brand's most portable device, so it repeats
 * everywhere the name appears.
 */

/** Hijabi profile, facing right, with the drape falling over the shoulder. */
export function AuraMark({ size = 34, className, tone = 'default' }) {
  const cloth = tone === 'onInk' ? '#C9A49C' : '#B98D86'
  const clothDeep = tone === 'onInk' ? '#8E635C' : '#96625A'
  const skin = tone === 'onInk' ? '#241A18' : '#F7EFEC'
  const ring = tone === 'onInk' ? 'rgba(184,137,79,.75)' : 'rgba(184,137,79,.9)'

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cx('shrink-0', className)}
      role="img"
      aria-label="Hijabisaura"
    >
      <defs>
        <linearGradient id="aura-cloth" x1=".2" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor={cloth} />
          <stop offset="1" stopColor={clothDeep} />
        </linearGradient>
        <clipPath id="aura-clip">
          <path d="M32 7c11.6 0 19 8.6 19 19.5 0 6.2-2.2 10.6-4.4 14.2-1.6 2.6-2.2 4-2 6.1l.9 10.2H17.2l1.2-9.9c.3-2.4-.5-4-2.2-6.6C13.9 36.7 12 32.4 12 26.5C12 15.6 20.4 7 32 7Z" />
        </clipPath>
      </defs>

      {/* The gold arc from the roundel — an open circle, never closed. */}
      <path
        d="M8 36a24 24 0 1 1 44.5 12"
        fill="none"
        stroke={ring}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      <g clipPath="url(#aura-clip)">
        <path
          d="M32 7c11.6 0 19 8.6 19 19.5 0 6.2-2.2 10.6-4.4 14.2-1.6 2.6-2.2 4-2 6.1l.9 10.2H17.2l1.2-9.9c.3-2.4-.5-4-2.2-6.6C13.9 36.7 12 32.4 12 26.5C12 15.6 20.4 7 32 7Z"
          fill="url(#aura-cloth)"
        />
        {/* Fold lines down the drape. */}
        <path d="M24 22C21 30 21 42 23 57" stroke={clothDeep} strokeWidth="1.6" fill="none" opacity=".45" />
        <path d="M31 20C27.5 29 27 43 29 57" stroke={cloth} strokeWidth="1.4" fill="none" opacity=".5" />
        <path d="M40 44C41 49 41.5 53 42 57" stroke={clothDeep} strokeWidth="1.6" fill="none" opacity=".4" />
        {/* Face opening: negative space, as in the roundel. */}
        <path d="M39.5 19.5c4.4 1.5 6.6 5.4 6.6 9.8 0 4.3-1.7 7.4-4 9.3-2.2 1.8-4.6 2.2-6.7 1.8l-.6-19.3Z" fill={skin} />
        <path d="M45.6 26.8c1.6.6 2.4 1.9 2.2 3-.2 1.2-1.3 1.9-2.4 2" fill="none" stroke={clothDeep} strokeWidth="1" opacity=".55" />
      </g>

      {/* The two sparkles, kept as the only ornament. */}
      <path d="M55 15.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z" fill={ring} />
      <path d="M7.5 45l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7L5.2 47l1.7-.6.6-1.7Z" fill={ring} />
    </svg>
  )
}

/** Full horizontal lockup for the header and footer. */
export default function Logo({ size = 'md', tone = 'default', showTagline = false, className }) {
  const onInk = tone === 'onInk'
  const scale = { sm: 26, md: 34, lg: 46 }[size] || 34
  const text = { sm: 'text-lg', md: 'text-[1.4rem]', lg: 'text-3xl' }[size] || 'text-[1.4rem]'

  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <AuraMark size={scale} tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={cx('display-sm font-medium tracking-tight', text)}>
          <span className={onInk ? 'text-blush' : 'text-ink'}>Hijabis</span>
          <span className={onInk ? 'text-rose-light' : 'text-rose'}>aura</span>
        </span>
        {showTagline && (
          <span
            className={cx(
              'mt-1 font-mono text-2xs tracking-[0.14em]',
              onInk ? 'text-gold/80' : 'text-gold-deep'
            )}
          >
            YOUR AURA, YOUR STYLE
          </span>
        )}
      </span>
    </span>
  )
}
