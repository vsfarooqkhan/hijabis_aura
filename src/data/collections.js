export const COLLECTIONS = [
  {
    slug: 'everyday-modal',
    name: 'Everyday Modal',
    kicker: 'Worn Monday to Thursday',
    blurb:
      'Soft twills and modals in the 110–145 GSM band. Opaque, cool, and cut long enough that you stop thinking about it by 9am.',
    banner: '/img/collections/everyday-modal.svg',
    order: 1,
    published: true,
  },
  {
    slug: 'crinkle-chiffon',
    name: 'Crinkle & Chiffon',
    kicker: 'The no-iron drawer',
    blurb:
      'Texture set into the cloth under heat, so it survives the wash and the suitcase. Light, fast-drying, and mostly pinless.',
    banner: '/img/collections/crinkle-chiffon.svg',
    order: 2,
    published: true,
  },
  {
    slug: 'occasion-satin',
    name: 'Occasion & Satin',
    kicker: 'For the evening you dressed up for',
    blurb:
      'High-lustre satins and shimmer georgettes cut two metres long, for drapes that need to hold a shape in photographs.',
    banner: '/img/collections/occasion-satin.svg',
    order: 3,
    published: true,
  },
  {
    slug: 'jersey-instant',
    name: 'Jersey & Instant',
    kicker: 'Out the door in six seconds',
    blurb:
      'Stretch knits from 180 to 240 GSM, plus pre-sewn instants with the under-cap built in. Nothing here needs a pin.',
    banner: '/img/collections/jersey-instant.svg',
    order: 4,
    published: true,
  },
  {
    slug: 'bridal-atelier',
    name: 'Bridal Atelier',
    kicker: 'Made to order, signed by hand',
    blurb:
      'Silk tulle worked by one karigar over nine to fourteen days. We cut nothing before you ask, and we sign what we send.',
    banner: '/img/collections/bridal-atelier.svg',
    order: 5,
    published: true,
  },
  {
    slug: 'essentials',
    name: 'Essentials',
    kicker: 'The layer underneath',
    blurb:
      'Under-caps that do not print a line on your forehead, and magnets strong enough for a 240 GSM jersey.',
    banner: '/img/collections/essentials.svg',
    order: 6,
    published: true,
  },
]

export const FABRIC_FILTERS = [
  'Bamboo modal',
  'Bamboo viscose',
  'Cotton-modal jersey',
  'Cotton voile',
  'Crinkle chiffon',
  'Chiffon',
  'Heat-pleated chiffon',
  'Modal',
  'Ribbed jersey',
  'Satin-back crepe',
  'Shimmer georgette',
  'Turkish combed cotton',
]

export const STYLE_FILTERS = [
  { key: 'rectangle', label: 'Rectangle' },
  { key: 'square', label: 'Square' },
  { key: 'instant', label: 'Instant' },
  { key: 'shawl', label: 'Shawl' },
  { key: 'accessory', label: 'Accessory' },
]

export const OCCASION_FILTERS = [
  { key: 'everyday', label: 'Everyday' },
  { key: 'work', label: 'Work' },
  { key: 'occasion', label: 'Occasion' },
  { key: 'wedding', label: 'Wedding' },
  { key: 'eid', label: 'Eid' },
  { key: 'travel', label: 'Travel' },
  { key: 'sport', label: 'Sport' },
  { key: 'summer', label: 'Summer' },
  { key: 'winter', label: 'Winter' },
]

export const WEAVE_LABELS = {
  plain: 'Plain weave',
  twill: 'Twill',
  satin: 'Satin',
  jersey: 'Jersey knit',
  tulle: 'Tulle',
  none: '—',
}

export default COLLECTIONS
