/**
 * "The hand" — the textile trade's own word for how a cloth behaves when you
 * handle it. Deliberately a small set of named steps, not a 0–100 score:
 * these are judgements you make by holding the fabric, and a number would
 * claim a precision nobody can produce that way.
 *
 * Pick each one by handling your own stock. The guidance under each step is
 * how to decide, so two people grading the same piece land in the same place.
 */

export const AXES = [
  {
    key: 'opacity',
    label: 'Opacity',
    question: 'How much shows through one layer?',
    steps: [
      { key: 'sheer', label: 'sheer', hint: 'You can read print through it. Needs a cap.' },
      { key: 'semi-sheer', label: 'semi-sheer', hint: 'Light passes, shapes show. Cap in bright light.' },
      { key: 'opaque', label: 'opaque', hint: 'Nothing shows through in normal light.' },
      { key: 'fully-opaque', label: 'fully opaque', hint: 'No cap needed, ever.' },
    ],
  },
  {
    key: 'fall',
    label: 'Fall',
    question: 'Does it hold a shape, or pour?',
    steps: [
      { key: 'crisp', label: 'crisp', hint: 'Holds a fold you set by hand. Structured.' },
      { key: 'structured', label: 'structured', hint: 'Keeps its shape around the crown.' },
      { key: 'soft', label: 'soft', hint: 'Falls in long lines rather than small folds.' },
      { key: 'fluid', label: 'fluid', hint: 'Pours. Slips unless pinned.' },
    ],
  },
  {
    key: 'finish',
    label: 'Finish',
    question: 'How does it take the light?',
    steps: [
      { key: 'matte', label: 'matte', hint: 'Scatters light. Reads as everyday.' },
      { key: 'soft-sheen', label: 'soft sheen', hint: 'Catches light in the folds only.' },
      { key: 'lustre', label: 'lustre', hint: 'Returns light across the surface. Occasion wear.' },
    ],
  },
]

export const axis = (key) => AXES.find((a) => a.key === key)

export const stepIndex = (axisKey, value) => {
  const a = axis(axisKey)
  if (!a) return -1
  return a.steps.findIndex((s) => s.key === value)
}

export const stepLabel = (axisKey, value) => {
  const a = axis(axisKey)
  return a?.steps.find((s) => s.key === value)?.label || '—'
}

/** The one-line read used on cards and in search results. */
export const handWords = (hand) =>
  hand ? AXES.map((a) => stepLabel(a.key, hand[a.key])).filter((w) => w !== '—') : []

/** A blank hand for new products in the admin. */
export const emptyHand = () => ({ opacity: 'opaque', fall: 'soft', finish: 'matte' })

/* Convenience groupings, used by the shop filters. */
export const OPAQUE_ENOUGH = ['opaque', 'fully-opaque']
export const SHEER_ISH = ['sheer', 'semi-sheer']
export const SOFTER = ['soft', 'fluid']
export const FIRMER = ['crisp', 'structured']
export const HAS_SHINE = ['soft-sheen', 'lustre']
