/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sampled from the Hijabisaura roundel. Espresso for text, dusty rose
        // for action, gold reserved for ornament hairlines only, blush cream
        // as the ground.
        ink: '#241A18',
        cocoa: { DEFAULT: '#2E201E', deep: '#201615', light: '#402C29' },
        blush: { DEFAULT: '#F7EFEC', warm: '#F2E6E1', dim: '#E7D6D0' },
        rose: { DEFAULT: '#96625A', deep: '#7A4C45', light: '#B98D86', wash: '#F6E9E5' },
        gold: { DEFAULT: '#B8894F', deep: '#8A6234', wash: '#F4EBDE' },
        taupe: { DEFAULT: '#6E5D57', light: '#9A8A84' },
        // Only for states that must read as a problem — cancelled, returned,
        // out of stock. Kept out of the brand palette on purpose.
        clay: { DEFAULT: '#9E3B32', deep: '#7E2C25', wash: '#F7E4E1' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        // Only ever used for the tagline lifted from the roundel. Never for UI.
        script: ['"Parisienne"', 'Georgia', 'cursive'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        mill: '0.16em',
        eyebrow: '0.08em',
      },
      maxWidth: {
        shell: '78rem',
      },
      boxShadow: {
        lift: '0 1px 2px rgba(36,26,24,0.04), 0 12px 32px -12px rgba(36,26,24,0.16)',
        liftlg: '0 2px 4px rgba(36,26,24,0.05), 0 32px 64px -24px rgba(36,26,24,0.26)',
      },
      transitionTimingFunction: {
        drape: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fold-in': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-16deg)' },
          '100%': { transform: 'translateX(220%) skewX(-16deg)' },
        },
      },
      animation: {
        'fold-in': 'fold-in 0.7s cubic-bezier(0.22,1,0.36,1) both',
        sheen: 'sheen 1.1s cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
}
