/**
 * Generates Hijabisaura's product photography as deterministic SVG.
 *
 * Four shots per colourway, matching how a fabric is actually photographed:
 *   drape   — the fall, lit from one side so the folds read
 *   styled  — editorial silhouette, face left as negative space
 *   flat    — folded on the studio ground with its dye-card tag
 *   macro   — the weave at 4×
 *
 * Everything is seeded off the colourway code, so re-running never reshuffles
 * a photo that a product page is already pointing at.
 *
 *   npm run images
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COLORWAYS } from '../src/data/colorways.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const OUT = resolve(ROOT, 'public/img')

/* ---------------------------------------------------------------- colour --- */

const hex2rgb = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const rgb2hex = (r) =>
  '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => {
  const [x, y] = [hex2rgb(a), hex2rgb(b)]
  return rgb2hex(x.map((v, i) => v + (y[i] - v) * t))
}
const shade = (c, t) => mix(c, '#0B080D', t)
const tint = (c, t) => mix(c, '#FFFDFA', t)
const lum = (c) => {
  const [r, g, b] = hex2rgb(c).map((v) => v / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/* ------------------------------------------------------------------ rng --- */

const hash = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619
  return h >>> 0
}
const rngFor = (seed) => {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const span = (rnd, lo, hi) => lo + rnd() * (hi - lo)
const n = (v) => Math.round(v * 10) / 10

/* -------------------------------------------------------------- pieces --- */

const W = 900
const H = 1200

/** A woven texture overlay. Cheap: two stripe patterns, no per-cell geometry. */
const weaveDefs = (id, light, scale = 9) => `
<pattern id="${id}" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">
  <rect width="${scale}" height="${scale}" fill="none"/>
  <path d="M0 0V${scale}" stroke="${light ? '#fff' : '#000'}" stroke-width="1.1" opacity=".5"/>
  <path d="M0 0H${scale}" stroke="${light ? '#fff' : '#000'}" stroke-width="1.1" opacity=".28"/>
</pattern>`

/** Vertical fold ribbons. The core gesture of every drape shot. */
const foldPaths = (rnd, color, count, top, bottom, left, right) => {
  const edges = []
  const step = (right - left) / count
  for (let i = 0; i <= count; i++) {
    const sx = left + step * i + (i === 0 || i === count ? 0 : span(rnd, -step * 0.3, step * 0.3))
    edges.push({ sx, a: span(rnd, -70, 70), b: span(rnd, -110, 110), e: span(rnd, -90, 130) })
  }
  const y1 = top + (bottom - top) * 0.34
  const y2 = top + (bottom - top) * 0.72
  let defs = ''
  let body = ''
  for (let i = 0; i < count; i++) {
    const L = edges[i]
    const R = edges[i + 1]
    const gid = `f${i}`
    // Alternating light direction reads as fabric turning through a fold.
    const flip = i % 2 === 0
    const hi = tint(color, span(rnd, 0.16, 0.32))
    const lo = shade(color, span(rnd, 0.3, 0.52))
    defs += `<linearGradient id="${gid}" x1="${flip ? 0 : 1}" y1="0" x2="${flip ? 1 : 0}" y2="0">
      <stop offset="0" stop-color="${lo}"/><stop offset=".46" stop-color="${color}"/><stop offset="1" stop-color="${hi}"/>
    </linearGradient>`
    body += `<path d="M${n(L.sx)} ${top}C${n(L.sx + L.a)} ${n(y1)} ${n(L.sx + L.b)} ${n(y2)} ${n(
      L.sx + L.e
    )} ${bottom}L${n(R.sx + R.e)} ${bottom}C${n(R.sx + R.b)} ${n(y2)} ${n(R.sx + R.a)} ${n(
      y1
    )} ${n(R.sx)} ${top}Z" fill="url(#${gid})"/>`
  }
  return { defs, body }
}

/* --------------------------------------------------------------- shot 1 --- */

const drape = (cw, w = W, h = H) => {
  const rnd = rngFor(cw.code + 'drape')
  const c = cw.hex
  const ground = shade(c, cw.light ? 0.78 : 0.62)
  const { defs, body } = foldPaths(rnd, c, 9, -40, h + 40, -80, w + 80)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${cw.name} fabric on the fall">
<defs>
${defs}
${weaveDefs('wv', cw.light === false, 8)}
<linearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${shade(c, 0.72)}" stop-opacity=".85"/>
  <stop offset=".28" stop-color="${shade(c, 0.2)}" stop-opacity="0"/>
  <stop offset=".76" stop-color="${shade(c, 0.3)}" stop-opacity="0"/>
  <stop offset="1" stop-color="${shade(c, 0.7)}" stop-opacity=".7"/>
</linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2=".6">
  <stop offset="0" stop-color="#fff" stop-opacity="0"/>
  <stop offset=".42" stop-color="#fff" stop-opacity=".13"/>
  <stop offset=".58" stop-color="#fff" stop-opacity=".05"/>
  <stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<radialGradient id="vig" cx=".5" cy=".38" r=".78">
  <stop offset=".5" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity=".42"/>
</radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="${ground}"/>
${body}
<rect width="${w}" height="${h}" fill="url(#wv)" opacity=".1"/>
<rect width="${w}" height="${h}" fill="url(#sheen)"/>
<rect width="${w}" height="${h}" fill="url(#depth)"/>
<rect width="${w}" height="${h}" fill="url(#vig)"/>
</svg>`
}

/* --------------------------------------------------------------- shot 2 --- */

const styled = (cw) => {
  const rnd = rngFor(cw.code + 'styled')
  const c = cw.hex
  // Ground always separates from the cloth, whichever way the dye runs.
  const ground = cw.light ? shade(c, 0.62) : tint(c, 0.84)
  const hi = tint(c, 0.2)
  const lo = shade(c, 0.42)

  const bust = `M96 1240C110 986 246 872 300 792C246 686 236 512 300 392C348 236 566 232 614 392C678 512 668 686 614 792C668 872 804 986 818 1240Z`
  const face = `M450 316C536 316 574 392 570 480C566 574 522 646 450 646C378 646 334 574 330 480C326 392 364 316 450 316Z`

  let folds = ''
  for (let i = 0; i < 5; i++) {
    const x = span(rnd, 150, 760)
    folds += `<path d="M${n(x)} 700C${n(x + span(rnd, -50, 50))} 880 ${n(
      x + span(rnd, -70, 70)
    )} 1040 ${n(x + span(rnd, -90, 90))} 1240" stroke="${
      i % 2 ? hi : lo
    }" stroke-width="${n(span(rnd, 8, 22))}" fill="none" opacity=".4" stroke-linecap="round"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${cw.name} hijab styled">
<defs>
<linearGradient id="cloth" x1=".1" y1="0" x2=".9" y2="1">
  <stop offset="0" stop-color="${hi}"/><stop offset=".42" stop-color="${c}"/><stop offset="1" stop-color="${lo}"/>
</linearGradient>
<radialGradient id="halo" cx=".5" cy=".34" r=".62">
  <stop offset="0" stop-color="#fff" stop-opacity="${cw.light ? 0.14 : 0.3}"/>
  <stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
${weaveDefs('wv', !cw.light, 7)}
<clipPath id="cut"><path d="${bust}"/></clipPath>
<linearGradient id="chin" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${shade(c, 0.6)}" stop-opacity=".55"/>
  <stop offset="1" stop-color="${shade(c, 0.6)}" stop-opacity="0"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${ground}"/>
<rect width="${W}" height="${H}" fill="url(#halo)"/>
<path d="${bust}" fill="url(#cloth)"/>
<g clip-path="url(#cut)">
  ${folds}
  <path d="${face}" fill="${ground}"/>
  <path d="M330 500C330 500 388 566 450 566C512 566 570 500 570 500" fill="none" stroke="${shade(
    c,
    0.5
  )}" stroke-width="26" opacity=".3"/>
  <rect x="240" y="620" width="420" height="200" fill="url(#chin)"/>
  <rect width="${W}" height="${H}" fill="url(#wv)" opacity=".12"/>
</g>
<path d="${face}" fill="none" stroke="${shade(c, 0.34)}" stroke-width="2.5" opacity=".5"/>
</svg>`
}

/* --------------------------------------------------------------- shot 3 --- */

const flat = (cw) => {
  const rnd = rngFor(cw.code + 'flat')
  const c = cw.hex
  const ground = mix('#E4E1DD', c, 0.12)
  // Folded in three, stacked. The fold end alternates side down the stack,
  // which is what actually happens when you fold a long rectangle.
  const bands = [
    { y: 372, rot: -2.6, flip: false },
    { y: 516, rot: 1.8, flip: true },
    { y: 660, rot: -1.1, flip: false },
  ]
  const bh = 104
  let body = ''
  bands.forEach((b, i) => {
    const w = 588 - i * 16
    const x = (W - w) / 2 + span(rnd, -12, 12)
    const r = bh / 2
    // Rounded fold end on the left, cut selvedge on the right.
    const shape = `M${n(x + r)} ${b.y}H${n(x + w)}V${n(b.y + bh)}H${n(x + r)}A${r} ${r} 0 0 1 ${n(
      x + r
    )} ${b.y}Z`
    body += `<g transform="rotate(${b.rot} 450 ${b.y + r})${
      b.flip ? ` translate(900 0) scale(-1 1)` : ''
    }">
      <ellipse cx="450" cy="${b.y + bh + 6}" rx="${w / 2 - 24}" ry="11" fill="#000" opacity=".16"/>
      <path d="${shape}" fill="url(#b${i})"/>
      <path d="M${n(x + r + 8)} ${n(b.y + 26)}H${n(x + w)}" stroke="${shade(
      c,
      0.42
    )}" stroke-width="1.4" opacity=".4"/>
      <path d="M${n(x + r + 20)} ${n(b.y + 52)}H${n(x + w)}" stroke="${shade(
      c,
      0.42
    )}" stroke-width="1.4" opacity=".26"/>
      <path d="M${n(x + r)} ${n(b.y + 3)}H${n(x + w)}" stroke="${tint(
      c,
      0.4
    )}" stroke-width="2.4" opacity=".5"/>
      <path d="M${n(x + w - 1)} ${b.y}V${n(b.y + bh)}" stroke="${shade(
      c,
      0.5
    )}" stroke-width="2" opacity=".5"/>
    </g>`
  })
  let defs = ''
  bands.forEach((b, i) => {
    defs += `<linearGradient id="b${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${tint(c, 0.26)}"/>
      <stop offset=".34" stop-color="${c}"/>
      <stop offset="1" stop-color="${shade(c, 0.3)}"/>
    </linearGradient>`
  })
  const tagInk = lum(ground) > 0.5 ? '#3B3A3E' : '#EDECEE'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${cw.name} folded, with dye-card tag">
<defs>
${defs}
${weaveDefs('wv', false, 7)}
<radialGradient id="light" cx=".42" cy=".3" r=".8">
  <stop offset="0" stop-color="#fff" stop-opacity=".5"/>
  <stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<clipPath id="stack"><rect x="80" y="360" width="740" height="520"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="${ground}"/>
<rect width="${W}" height="${H}" fill="url(#light)"/>
<g>${body}</g>
<g clip-path="url(#stack)"><rect width="${W}" height="${H}" fill="url(#wv)" opacity=".09"/></g>
<g opacity=".92">
  <rect x="330" y="960" width="240" height="112" rx="6" fill="${mix(ground, '#fff', 0.55)}"/>
  <circle cx="450" cy="984" r="7" fill="none" stroke="${tagInk}" stroke-opacity=".35" stroke-width="2"/>
  <rect x="352" y="1008" width="34" height="34" rx="4" fill="${c}"/>
  <text x="398" y="1024" font-family="'IBM Plex Mono',monospace" font-size="17" letter-spacing="2" fill="${tagInk}">${
    cw.code
  }</text>
  <text x="398" y="1044" font-family="'IBM Plex Mono',monospace" font-size="12" letter-spacing="1" fill="${tagInk}" opacity=".62">${cw.name.toUpperCase()}</text>
</g>
</svg>`
}

/* --------------------------------------------------------------- shot 4 --- */

const macro = (cw) => {
  const rnd = rngFor(cw.code + 'macro')
  const c = cw.hex
  const s = 34
  const warpHi = tint(c, 0.17)
  const warpLo = shade(c, 0.26)
  let fibers = ''
  for (let i = 0; i < 7; i++) {
    const y = span(rnd, 60, H - 60)
    fibers += `<path d="M${n(span(rnd, -40, 300))} ${n(y)}q${n(span(rnd, 160, 340))} ${n(
      span(rnd, -60, 60)
    )} ${n(span(rnd, 420, 760))} ${n(span(rnd, -30, 30))}" stroke="${tint(
      c,
      0.55
    )}" stroke-width="${n(span(rnd, 0.8, 2))}" fill="none" opacity="${n(span(rnd, 0.18, 0.4))}"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${cw.name} weave at 4× magnification">
<defs>
<linearGradient id="yarn" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${warpLo}"/><stop offset=".3" stop-color="${c}"/>
  <stop offset=".52" stop-color="${warpHi}"/><stop offset="1" stop-color="${warpLo}"/>
</linearGradient>
<linearGradient id="yarnH" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${warpLo}"/><stop offset=".3" stop-color="${c}"/>
  <stop offset=".52" stop-color="${warpHi}"/><stop offset="1" stop-color="${warpLo}"/>
</linearGradient>
<pattern id="warp" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
  <rect x="${s * 0.12}" width="${s * 0.76}" height="${s}" rx="${s * 0.3}" fill="url(#yarn)"/>
</pattern>
<pattern id="weft" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
  <rect y="${s * 0.12}" width="${s}" height="${s * 0.76}" rx="${s * 0.3}" fill="url(#yarnH)"/>
</pattern>
<pattern id="check" width="${s * 2}" height="${s * 2}" patternUnits="userSpaceOnUse">
  <rect width="${s}" height="${s}" fill="#fff"/>
  <rect x="${s}" y="${s}" width="${s}" height="${s}" fill="#fff"/>
</pattern>
<mask id="over"><rect width="${W}" height="${H}" fill="url(#check)"/></mask>
<radialGradient id="focus" cx=".46" cy=".44" r=".58">
  <stop offset=".26" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity=".62"/>
</radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="${shade(c, 0.5)}"/>
<rect width="${W}" height="${H}" fill="url(#warp)"/>
<g mask="url(#over)"><rect width="${W}" height="${H}" fill="url(#weft)"/></g>
${fibers}
<rect width="${W}" height="${H}" fill="url(#focus)"/>
</svg>`
}

/* --------------------------------------------------------------- extras --- */

/** The roundel, reduced to what survives at 16px: the draped profile. */
const favicon = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="c" x1=".2" y1="0" x2=".9" y2="1">
<stop offset="0" stop-color="#C9A49C"/><stop offset="1" stop-color="#8E635C"/></linearGradient>
<clipPath id="k"><path d="M32 9c11 0 18 8.1 18 18.5 0 5.9-2.1 10-4.2 13.4-1.5 2.5-2.1 3.8-1.9 5.8L44.7 56H19.3l1.1-9.3c.3-2.3-.5-3.8-2.1-6.3C16.1 36.9 14 32.9 14 27.5C14 17.1 21 9 32 9Z"/></clipPath></defs>
<rect width="64" height="64" rx="14" fill="#241A18"/>
<g clip-path="url(#k)">
<path d="M32 9c11 0 18 8.1 18 18.5 0 5.9-2.1 10-4.2 13.4-1.5 2.5-2.1 3.8-1.9 5.8L44.7 56H19.3l1.1-9.3c.3-2.3-.5-3.8-2.1-6.3C16.1 36.9 14 32.9 14 27.5C14 17.1 21 9 32 9Z" fill="url(#c)"/>
<path d="M25 22C22 30 22 42 24 56" stroke="#8E635C" stroke-width="1.8" fill="none" opacity=".5"/>
<path d="M39 21c4.2 1.6 6.3 5.3 6.3 9.6 0 4.2-1.7 7.2-3.9 9-2.1 1.7-4.4 2.1-6.4 1.7L34.4 21Z" fill="#241A18"/>
</g>
<path d="M53 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" fill="#B8894F"/>
</svg>`

/* ----------------------------------------------------------------- write --- */

const write = (rel, svg) => {
  const p = resolve(OUT, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, svg.replace(/\n\s*\n/g, '\n'))
}

let count = 0
for (const cw of COLORWAYS) {
  const k = cw.code.toLowerCase()
  write(`fabric/${k}-drape.svg`, drape(cw))
  write(`fabric/${k}-styled.svg`, styled(cw))
  write(`fabric/${k}-flat.svg`, flat(cw))
  write(`fabric/${k}-macro.svg`, macro(cw))
  count += 4
}

// Collection banners — wide crops of the drape shot, so a collection always
// looks like it was shot on the same day as its products.
const BANNERS = {
  'everyday-modal': 'HA-06',
  'crinkle-chiffon': 'HA-13',
  'occasion-satin': 'HA-11',
  'jersey-instant': 'HA-18',
  'bridal-atelier': 'HA-12',
  essentials: 'HA-04',
}
for (const [slug, code] of Object.entries(BANNERS)) {
  const cw = COLORWAYS.find((c) => c.code === code)
  write(`collections/${slug}.svg`, drape(cw, 1600, 900))
  count++
}

// Brand-story frames.
for (const [name, code] of Object.entries({ mill: 'HA-17', dyehouse: 'HA-02', finishing: 'HA-19' })) {
  const cw = COLORWAYS.find((c) => c.code === code)
  write(`story/${name}.svg`, name === 'dyehouse' ? macro(cw) : drape(cw, 1200, 900))
  count++
}

// The UPI QR is generated live and scannable by qrcode.react at checkout,
// straight from the VPA in admin settings — nothing to bake in here.
write('../favicon.svg', favicon())
count += 1

console.log(`Hijabisaura — wrote ${count} SVGs to public/img`)
