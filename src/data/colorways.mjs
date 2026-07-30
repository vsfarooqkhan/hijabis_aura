// The dye card. Every colour Hijabisaura has ever run, with its mill code.
// Shared by the app and by scripts/generate-images.mjs so swatches and
// photography can never drift apart.

export const COLORWAYS = [
  { code: 'HA-01', name: 'Midnight Plum', hex: '#2A1F33', family: 'purple', light: false },
  { code: 'HA-02', name: 'Ink Rose', hex: '#7A2F45', family: 'red', light: false },
  // The house rose, lifted straight off the roundel.
  { code: 'HA-03', name: 'Aura Rose', hex: '#B98D86', family: 'pink', light: true },
  { code: 'HA-04', name: 'Jade Deep', hex: '#1F6B5C', family: 'green', light: false },
  { code: 'HA-05', name: 'Sage Mist', hex: '#A8B5A2', family: 'green', light: true },
  { code: 'HA-06', name: 'Oat Chalk', hex: '#E4DED3', family: 'neutral', light: true },
  { code: 'HA-07', name: 'Sand Dune', hex: '#C9B79C', family: 'neutral', light: true },
  { code: 'HA-08', name: 'Camel', hex: '#B08A5E', family: 'brown', light: true },
  { code: 'HA-09', name: 'Saffron', hex: '#D8A03D', family: 'yellow', light: true },
  { code: 'HA-10', name: 'Terracotta', hex: '#B4593A', family: 'orange', light: false },
  { code: 'HA-11', name: 'Bordeaux', hex: '#6E2231', family: 'red', light: false },
  { code: 'HA-12', name: 'Blush Pearl', hex: '#E7C8C4', family: 'pink', light: true },
  { code: 'HA-13', name: 'Lavender Haze', hex: '#B3A5C6', family: 'purple', light: true },
  { code: 'HA-14', name: 'Steel Blue', hex: '#5B7290', family: 'blue', light: false },
  { code: 'HA-15', name: 'Navy Ink', hex: '#23314C', family: 'blue', light: false },
  { code: 'HA-16', name: 'Teal Slate', hex: '#3A6B72', family: 'blue', light: false },
  { code: 'HA-17', name: 'Olive Bronze', hex: '#6E6A3C', family: 'green', light: false },
  { code: 'HA-18', name: 'Charcoal', hex: '#3B3A3E', family: 'neutral', light: false },
  { code: 'HA-19', name: 'Pearl White', hex: '#EFEDEA', family: 'neutral', light: true },
  { code: 'HA-20', name: 'Onyx', hex: '#1A181C', family: 'neutral', light: false },
  { code: 'HA-21', name: 'Mocha', hex: '#6B4A3C', family: 'brown', light: false },
  { code: 'HA-22', name: 'Rose Gold', hex: '#D9A99A', family: 'pink', light: true },
]

export const COLOR_FAMILIES = [
  { key: 'neutral', label: 'Neutrals', swatch: '#D6D2CB' },
  { key: 'pink', label: 'Pinks & Blush', swatch: '#DCA9A2' },
  { key: 'red', label: 'Reds & Wine', swatch: '#8C2F44' },
  { key: 'orange', label: 'Rust & Clay', swatch: '#B4593A' },
  { key: 'yellow', label: 'Golds', swatch: '#D8A03D' },
  { key: 'green', label: 'Greens', swatch: '#1F6B5C' },
  { key: 'blue', label: 'Blues', swatch: '#3A5C80' },
  { key: 'purple', label: 'Purples', swatch: '#5A4270' },
  { key: 'brown', label: 'Browns', swatch: '#6B4A3C' },
]

export const byCode = (code) => COLORWAYS.find((c) => c.code === code)

// Shot types every colourway is photographed in. Order matters — it is the
// carousel order on the product page.
export const SHOTS = ['drape', 'styled', 'flat', 'macro']

export const SHOT_LABELS = {
  drape: 'On the fall',
  styled: 'Styled',
  flat: 'Folded',
  macro: 'Weave, 4× macro',
}

export const imgPath = (code, shot) => `/img/fabric/${code.toLowerCase()}-${shot}.svg`

export const imagesFor = (code) => SHOTS.map((s) => imgPath(code, s))
