import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, ChevronDown, Search } from 'lucide-react'
import cx from '../lib/cx'
import { money, moneyCompact, num, pct } from '../lib/format'

/**
 * Dashboard primitives. Charts use the brand palette in a fixed order so a
 * series keeps the same colour wherever it appears.
 */
export const SERIES = ['#96625A', '#B8894F', '#2E201E', '#B98D86', '#6E5D57', '#9E3B32']

/* ---------------------------------------------------------------- layout --- */

export function PageHead({ title, sub, action, children }) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="display-sm text-2xl md:text-[1.75rem]">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-taupe">{sub}</p>}
        {children}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

export function Panel({ title, sub, action, children, className, bodyClass }) {
  return (
    <section className={cx('border border-ink/10 bg-white', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-3.5">
          <div>
            {title && <h2 className="display-sm text-[15px]">{title}</h2>}
            {sub && <p className="mt-0.5 font-mono text-2xs text-taupe">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cx('p-5', bodyClass)}>{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------- kpi --- */

export function Stat({ label, value, delta, hint, format = 'plain' }) {
  const up = delta > 0
  const flat = delta === 0 || delta === undefined || delta === null
  const shown =
    format === 'money' ? money(value) : format === 'compact' ? moneyCompact(value) : num(value)

  return (
    <div className="border border-ink/10 bg-white p-5">
      <p className="spec-key">{label}</p>
      <p className="mt-2.5 font-mono text-2xl tabular-nums">{shown}</p>
      <div className="mt-2 flex items-center gap-2">
        {!flat && (
          <span
            className={cx(
              'flex items-center gap-0.5 font-mono text-2xs tabular-nums',
              up ? 'text-rose-deep' : 'text-clay-deep'
            )}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {pct(Math.abs(delta), 1)}
          </span>
        )}
        {hint && <span className="font-mono text-2xs text-taupe">{hint}</span>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- charts --- */

const tooltipStyle = {
  contentStyle: {
    background: '#241A18',
    border: 'none',
    borderRadius: 0,
    fontSize: 12,
    fontFamily: 'IBM Plex Mono, monospace',
    padding: '8px 10px',
  },
  itemStyle: { color: '#F7EFEC' },
  labelStyle: { color: '#B8894F', marginBottom: 4 },
}

export function RevenueChart({ data, height = 260 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#96625A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#96625A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(36,26,24,0.07)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fill: '#9A8A84' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fill: '#9A8A84' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, key) => [key === 'value' ? money(v) : num(v), key === 'value' ? 'Revenue' : 'Orders']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#96625A"
            strokeWidth={1.75}
            fill="url(#revFill)"
            dot={false}
            activeDot={{ r: 3, fill: '#96625A', stroke: '#F7EFEC', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OrdersBarChart({ data, height = 200 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <CartesianGrid stroke="rgba(36,26,24,0.07)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fill: '#9A8A84' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fill: '#9A8A84' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip {...tooltipStyle} formatter={(v) => [num(v), 'Orders']} cursor={{ fill: 'rgba(36,26,24,0.05)' }} />
          <Bar dataKey="orders" fill="#B8894F" radius={[1, 1, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SplitDonut({ data, height = 200 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex items-center gap-6">
      <div style={{ height, width: height }} className="shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={SERIES[i % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v, n) => [`${num(v)} orders`, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0"
              style={{ background: SERIES[i % SERIES.length] }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-sm">{d.name}</span>
            <span className="shrink-0 font-mono text-2xs tabular-nums text-taupe">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ----------------------------------------------------------------- table --- */

/**
 * A small sortable, searchable table. Deliberately not a data-grid library —
 * the admin has six tables and they all want the same three behaviours.
 */
export function DataTable({
  columns,
  rows,
  getKey,
  searchKeys,
  searchPlaceholder = 'Search…',
  empty = 'Nothing here yet.',
  initialSort,
  toolbar,
  pageSize = 12,
  onRowClick,
}) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState(initialSort || null)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let out = !needle || !searchKeys
      ? rows
      : rows.filter((r) =>
          searchKeys
            .map((k) => (typeof k === 'function' ? k(r) : r[k]))
            .join(' ')
            .toLowerCase()
            .includes(needle)
        )

    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue(a)
          const bv = col.sortValue(b)
          const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
          return sort.dir === 'asc' ? cmp : -cmp
        })
      }
    }
    return out
  }, [rows, q, sort, columns, searchKeys])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const toggleSort = (key) =>
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )

  return (
    <div className="border border-ink/10 bg-white">
      {(searchKeys || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 p-3.5">
          {searchKeys && (
            <label className="relative flex min-w-52 flex-1 items-center">
              <Search size={14} className="absolute left-3 text-taupe" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(0)
                }}
                placeholder={searchPlaceholder}
                className="field-boxed pl-9 text-sm"
                aria-label={searchPlaceholder}
              />
            </label>
          )}
          {toolbar}
          <p className="ml-auto shrink-0 font-mono text-2xs text-taupe">
            {num(filtered.length)} {filtered.length === 1 ? 'row' : 'rows'}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-blush-warm/60">
              {columns.map((c) => (
                <th key={c.key} className={cx('px-4 py-2.5', c.align === 'right' && 'text-right')}>
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cx(
                        'spec-key inline-flex items-center gap-1 transition-colors hover:text-ink',
                        sort?.key === c.key && 'text-ink'
                      )}
                    >
                      {c.label}
                      <ChevronDown
                        size={11}
                        className={cx(
                          'transition-transform',
                          sort?.key === c.key && sort.dir === 'asc' && 'rotate-180',
                          sort?.key !== c.key && 'opacity-30'
                        )}
                      />
                    </button>
                  ) : (
                    <span className="spec-key">{c.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-sm text-taupe">
                  {empty}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={getKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cx(
                    'border-b border-ink/[0.07] transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-blush-warm/50'
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cx('px-4 py-3 align-middle', c.align === 'right' && 'text-right')}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-ink/10 px-4 py-3">
          <p className="font-mono text-2xs text-taupe">
            Page {safePage + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="btn-outline px-3 py-1.5 text-2xs uppercase tracking-[0.1em]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="btn-outline px-3 py-1.5 text-2xs uppercase tracking-[0.1em]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
