import { formatDistanceToNowStrict, format, parseISO, subDays, startOfDay } from 'date-fns'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const money = (n) => inr.format(Math.round(n || 0))
export const moneyCompact = (n) => inrCompact.format(Math.round(n || 0))
export const num = (n) => new Intl.NumberFormat('en-IN').format(n || 0)

export const pct = (n, digits = 0) => `${(n || 0).toFixed(digits)}%`

export const discountPct = (price, mrp) =>
  !mrp || mrp <= price ? 0 : Math.round(((mrp - price) / mrp) * 100)

export const dateShort = (iso) => format(parseISO(iso), 'd MMM')
export const dateLong = (iso) => format(parseISO(iso), 'd MMM yyyy, h:mm a')
export const dateOnly = (iso) => format(parseISO(iso), 'd MMM yyyy')
export const ago = (iso) => `${formatDistanceToNowStrict(parseISO(iso))} ago`
export const agoDays = (days) =>
  days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`

/** Buckets orders into one row per day for the dashboard charts. */
export const dailySeries = (orders, days = 30, pickValue = (o) => o.totals.grand) => {
  const start = startOfDay(subDays(new Date(), days - 1)).getTime()
  const rows = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i)
    return { date: format(d, 'd MMM'), key: format(d, 'yyyy-MM-dd'), value: 0, orders: 0 }
  })
  const index = new Map(rows.map((r, i) => [r.key, i]))
  for (const o of orders) {
    const t = parseISO(o.createdAt)
    if (t.getTime() < start) continue
    const i = index.get(format(t, 'yyyy-MM-dd'))
    if (i === undefined) continue
    rows[i].value += pickValue(o)
    rows[i].orders += 1
  }
  return rows
}

export const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + (f(x) || 0), 0)

/** Percentage change, guarding the divide-by-zero that makes KPI tiles show Infinity. */
export const delta = (now, before) => {
  if (!before) return now ? 100 : 0
  return ((now - before) / before) * 100
}

export const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many || one + 's'}`
