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

  // --- Second run. Codes are never reused, so these continue the sequence.
  { code: 'HA-23', name: 'Almond Milk', hex: '#EDE3D6', family: 'neutral', light: true },
  { code: 'HA-24', name: 'Warm Taupe', hex: '#A8968A', family: 'neutral', light: true },
  { code: 'HA-25', name: 'Stone Grey', hex: '#9A9A96', family: 'neutral', light: true },
  { code: 'HA-26', name: 'Graphite', hex: '#4A4A50', family: 'neutral', light: false },
  { code: 'HA-27', name: 'Dusty Peach', hex: '#E0AF97', family: 'orange', light: true },
  { code: 'HA-28', name: 'Apricot', hex: '#E5A76B', family: 'orange', light: true },
  { code: 'HA-29', name: 'Brick', hex: '#9C4B33', family: 'orange', light: false },
  { code: 'HA-30', name: 'Rust', hex: '#8E4A28', family: 'orange', light: false },
  { code: 'HA-31', name: 'Mulberry', hex: '#5C2B44', family: 'purple', light: false },
  { code: 'HA-32', name: 'Aubergine', hex: '#42283F', family: 'purple', light: false },
  { code: 'HA-33', name: 'Dusty Mauve', hex: '#A98BA0', family: 'purple', light: true },
  { code: 'HA-34', name: 'Wisteria', hex: '#8E7BA8', family: 'purple', light: true },
  { code: 'HA-35', name: 'Powder Blue', hex: '#A9BFCF', family: 'blue', light: true },
  { code: 'HA-36', name: 'Denim', hex: '#4A6484', family: 'blue', light: false },
  { code: 'HA-37', name: 'Petrol', hex: '#274A55', family: 'blue', light: false },
  { code: 'HA-38', name: 'Midnight Navy', hex: '#1B2439', family: 'blue', light: false },
  { code: 'HA-39', name: 'Seafoam', hex: '#B4CFC4', family: 'green', light: true },
  { code: 'HA-40', name: 'Pistachio', hex: '#C2CE9E', family: 'green', light: true },
  { code: 'HA-41', name: 'Fern', hex: '#4F6B44', family: 'green', light: false },
  { code: 'HA-42', name: 'Forest', hex: '#2A4034', family: 'green', light: false },
  { code: 'HA-43', name: 'Emerald', hex: '#1C5E4A', family: 'green', light: false },
  { code: 'HA-44', name: 'Champagne', hex: '#E3D2B0', family: 'yellow', light: true },
  { code: 'HA-45', name: 'Mustard', hex: '#C08F2C', family: 'yellow', light: false },
  { code: 'HA-46', name: 'Antique Gold', hex: '#A5822F', family: 'yellow', light: false },
  { code: 'HA-47', name: 'Cherry', hex: '#8E2231', family: 'red', light: false },
  { code: 'HA-48', name: 'Maroon', hex: '#5A1A24', family: 'red', light: false },
  { code: 'HA-49', name: 'Watermelon', hex: '#C4566B', family: 'red', light: false },
  { code: 'HA-50', name: 'Cocoa', hex: '#4A342A', family: 'brown', light: false },
  { code: 'HA-51', name: 'Toffee', hex: '#8A6242', family: 'brown', light: false },
  { code: 'HA-52', name: 'Chai', hex: '#B08F72', family: 'brown', light: true },
  { code: 'HA-53', name: 'Ivory', hex: '#F4EFE4', family: 'neutral', light: true },
  { code: 'HA-54', name: 'Jet', hex: '#111013', family: 'neutral', light: false },
  { code: 'HA-55', name: 'Fuchsia', hex: '#A83A6E', family: 'pink', light: false },
  { code: 'HA-56', name: 'Candy Pink', hex: '#DE8FAC', family: 'pink', light: true },
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
