import cx from '../lib/cx'

/**
 * Draws the actual interlacing of a weave, cell by cell — so the diagram on a
 * twill product is a twill and not a decorative texture. Warp runs vertically,
 * weft horizontally; each cell shows whichever yarn floats on top.
 */

const N = 7

// Returns true when the warp (vertical yarn) floats over the weft at (x, y).
const warpOnTop = {
  plain: (x, y) => (x + y) % 2 === 0,
  twill: (x, y) => (x - y + N * 2) % 4 < 2,
  satin: (x, y) => (x + y * 3) % 5 === 0,
}

export default function WeaveDiagram({ weave = 'plain', color = '#96625A', size = 84, className }) {
  const cell = size / N
  const bar = cell * 0.74
  const off = (cell - bar) / 2
  const warp = color
  const weft = color

  if (weave === 'jersey') {
    // A knit has no interlacing — it has interlocking loops, so it gets loops.
    const cols = 5
    const rows = 5
    const w = size / cols
    const h = size / rows
    const loops = []
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = c * w
        const y = r * h
        loops.push(
          <path
            key={`${r}-${c}`}
            d={`M${x + w * 0.08} ${y + h * 0.96}C${x + w * 0.1} ${y + h * 0.3} ${x + w * 0.9} ${
              y + h * 0.3
            } ${x + w * 0.92} ${y + h * 0.96}`}
            fill="none"
            stroke={warp}
            strokeWidth={Math.max(1.2, w * 0.16)}
            strokeLinecap="round"
            opacity={r % 2 ? 0.55 : 0.85}
          />
        )
      }
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={className}
        role="img"
        aria-label="Jersey knit: interlocking loops, no interlacing"
      >
        {loops}
      </svg>
    )
  }

  if (weave === 'tulle') {
    // Hexagonal net.
    const r = size / 7
    const cells = []
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 5; col++) {
        const cxp = col * r * 1.5 + (row % 2 ? r * 0.75 : 0)
        const cyp = row * r * 0.9
        const pts = Array.from({ length: 6 }, (_, k) => {
          const a = (Math.PI / 3) * k
          return `${(cxp + r * 0.52 * Math.cos(a)).toFixed(1)},${(cyp + r * 0.52 * Math.sin(a)).toFixed(1)}`
        }).join(' ')
        cells.push(
          <polygon key={`${row}-${col}`} points={pts} fill="none" stroke={warp} strokeWidth="1" opacity=".7" />
        )
      }
    return (
      <svg
        viewBox={`-4 -4 ${size + 8} ${size + 8}`}
        width={size}
        height={size}
        className={className}
        role="img"
        aria-label="Tulle: hexagonal net"
      >
        {cells}
      </svg>
    )
  }

  if (weave === 'none') {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className} aria-hidden="true">
        <line x1="6" y1={size / 2} x2={size - 6} y2={size / 2} stroke={color} strokeWidth="1.5" opacity=".4" />
      </svg>
    )
  }

  const test = warpOnTop[weave] || warpOnTop.plain
  const cells = []
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const up = test(x, y)
      const vx = x * cell + off
      const hy = y * cell + off
      const vertical = (
        <rect
          key={`v${x}-${y}`}
          x={vx}
          y={y * cell}
          width={bar}
          height={cell}
          fill={warp}
          opacity={up ? 0.92 : 0.3}
          rx={bar * 0.35}
        />
      )
      const horizontal = (
        <rect
          key={`h${x}-${y}`}
          x={x * cell}
          y={hy}
          width={cell}
          height={bar}
          fill={weft}
          opacity={up ? 0.3 : 0.62}
          rx={bar * 0.35}
        />
      )
      cells.push(up ? [horizontal, vertical] : [vertical, horizontal])
    }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={cx(className)}
      role="img"
      aria-label={`${weave} weave interlacing`}
    >
      {cells}
    </svg>
  )
}
