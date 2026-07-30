import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, AlertTriangle, Clock, Package } from 'lucide-react'
import { subDays, parseISO, isAfter } from 'date-fns'
import useStore, { stockOf } from '../store/useStore'
import { dailySeries, delta, money, num, sum, dateShort, ago } from '../lib/format'
import { statusMeta } from '../data/settings'
import { Badge } from '../components/ui'
import { PageHead, Panel, Stat, RevenueChart, OrdersBarChart, SplitDonut, DataTable } from './ui'
import cx from '../lib/cx'

const RANGES = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
]

export default function Dashboard() {
  const orders = useStore((s) => s.orders)
  const products = useStore((s) => s.products)
  const customers = useStore((s) => s.customers)
  const reviews = useStore((s) => s.reviews)
  const threshold = useStore((s) => s.settings.ops.lowStockThreshold)
  const [range, setRange] = useState(30)

  const stats = useMemo(() => {
    const since = subDays(new Date(), range)
    const prevSince = subDays(new Date(), range * 2)

    // Cancelled and returned orders are excluded from revenue — counting them
    // would make the trend line lie in the store's favour.
    const earning = (o) => !['cancelled', 'returned', 'pending_payment'].includes(o.status)

    const inRange = orders.filter((o) => isAfter(parseISO(o.createdAt), since))
    const prev = orders.filter(
      (o) => isAfter(parseISO(o.createdAt), prevSince) && !isAfter(parseISO(o.createdAt), since)
    )

    const rev = sum(inRange.filter(earning), (o) => o.totals.grand)
    const prevRev = sum(prev.filter(earning), (o) => o.totals.grand)
    const count = inRange.length
    const units = sum(inRange, (o) => sum(o.items, (i) => i.qty))

    return {
      revenue: rev,
      revenueDelta: delta(rev, prevRev),
      orders: count,
      ordersDelta: delta(count, prev.length),
      aov: count ? rev / inRange.filter(earning).length || 0 : 0,
      aovDelta: delta(
        count ? rev / Math.max(1, inRange.filter(earning).length) : 0,
        prev.length ? prevRev / Math.max(1, prev.filter(earning).length) : 0
      ),
      units,
      unitsDelta: delta(units, sum(prev, (o) => sum(o.items, (i) => i.qty))),
      series: dailySeries(orders.filter(earning), range),
      awaiting: orders.filter((o) => o.status === 'pending_payment'),
      cod: inRange.filter((o) => o.payment.method === 'cod').length,
      upi: inRange.filter((o) => o.payment.method === 'upi').length,
      returned: inRange.filter((o) => ['returned', 'cancelled'].includes(o.status)).length,
    }
  }, [orders, range])

  const topProducts = useMemo(() => {
    const tally = new Map()
    const since = subDays(new Date(), range)
    for (const o of orders) {
      if (!isAfter(parseISO(o.createdAt), since)) continue
      for (const it of o.items) {
        const row = tally.get(it.productId) || { qty: 0, revenue: 0 }
        row.qty += it.qty
        row.revenue += it.price * it.qty
        tally.set(it.productId, row)
      }
    }
    return [...tally.entries()]
      .map(([id, v]) => ({ product: products.find((p) => p.id === id), ...v }))
      .filter((r) => r.product)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
  }, [orders, products, range])

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.published)
        .map((p) => ({ p, total: stockOf(p) }))
        .filter((r) => r.total <= threshold)
        .sort((a, b) => a.total - b.total),
    [products, threshold]
  )

  const recent = orders.slice(0, 8)
  const pendingReviews = reviews.filter((r) => !r.published).length

  return (
    <>
      <PageHead
        title="Dashboard"
        sub={`${num(orders.length)} orders all-time · ${num(customers.length)} customers · ${num(
          products.filter((p) => p.published).length
        )} live products`}
        action={
          <div className="flex border border-ink/15 bg-white">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={cx(
                  'px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.1em] transition-colors',
                  range === r.key ? 'bg-ink text-blush' : 'text-taupe hover:text-ink'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* ------------------------------------------------------- attention --- */}
      {(stats.awaiting.length > 0 || lowStock.length > 0 || pendingReviews > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {stats.awaiting.length > 0 && (
            <AlertCard
              to="/admin/orders?status=pending_payment"
              icon={Clock}
              tone="gold"
              title={`${stats.awaiting.length} UPI ${
                stats.awaiting.length === 1 ? 'payment' : 'payments'
              } to verify`}
              body={`${money(sum(stats.awaiting, (o) => o.totals.grand))} held. Nothing ships until you clear them.`}
            />
          )}
          {lowStock.length > 0 && (
            <AlertCard
              to="/admin/products?filter=low"
              icon={AlertTriangle}
              tone="clay"
              title={`${lowStock.length} ${lowStock.length === 1 ? 'product' : 'products'} low on stock`}
              body={`At or under ${threshold} pieces across all colourways.`}
            />
          )}
          {pendingReviews > 0 && (
            <AlertCard
              to="/admin/reviews"
              icon={Package}
              tone="taupe"
              title={`${pendingReviews} ${pendingReviews === 1 ? 'review' : 'reviews'} awaiting approval`}
              body="Unpublished reviews are hidden from product pages."
            />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- kpis --- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={`Revenue · ${range}d`}
          value={stats.revenue}
          delta={stats.revenueDelta}
          format="money"
          hint={`vs previous ${range} days`}
        />
        <Stat label={`Orders · ${range}d`} value={stats.orders} delta={stats.ordersDelta} />
        <Stat label="Average order value" value={stats.aov} delta={stats.aovDelta} format="money" />
        <Stat label="Pieces sold" value={stats.units} delta={stats.unitsDelta} />
      </div>

      {/* ----------------------------------------------------------- charts --- */}
      <div className="mb-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Revenue" sub={`Last ${range} days, excluding cancelled and returned`}>
          <RevenueChart data={stats.series} />
        </Panel>

        <div className="grid gap-4">
          <Panel title="How they paid" sub={`Last ${range} days`}>
            <SplitDonut
              data={[
                { name: 'Cash on delivery', value: stats.cod },
                { name: 'UPI prepaid', value: stats.upi },
              ]}
              height={168}
            />
          </Panel>
          <Panel title="Orders per day">
            <OrdersBarChart data={stats.series} height={168} />
          </Panel>
        </div>
      </div>

      {/* ------------------------------------------------------- top + low --- */}
      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Best sellers by revenue"
          sub={`Last ${range} days`}
          action={
            <Link to="/admin/products" className="font-mono text-2xs uppercase tracking-[0.1em] text-rose hover:text-rose-deep">
              All products
            </Link>
          }
          bodyClass="p-0"
        >
          <ul className="divide-y divide-ink/[0.07]">
            {topProducts.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-taupe">No sales in this window.</li>
            )}
            {topProducts.map((r, i) => (
              <li key={r.product.id} className="flex items-center gap-3.5 px-5 py-3">
                <span className="w-5 shrink-0 font-mono text-2xs tabular-nums text-taupe">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <img
                  src={r.product.colorways[0]?.images[0]}
                  alt=""
                  className="h-12 w-9 shrink-0 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/products/${r.product.id}`}
                    className="block truncate text-sm hover:text-rose"
                  >
                    {r.product.name}
                  </Link>
                  <p className="font-mono text-2xs text-taupe">
                    {num(r.qty)} pieces · {r.product.fabric}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums">{money(r.revenue)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Running low"
          sub={`At or under ${threshold} across all colourways`}
          bodyClass="p-0"
        >
          <ul className="divide-y divide-ink/[0.07]">
            {lowStock.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-taupe">
                Everything is comfortably in stock.
              </li>
            )}
            {lowStock.slice(0, 6).map(({ p, total }) => (
              <li key={p.id} className="flex items-center gap-3.5 px-5 py-3">
                <img src={p.colorways[0]?.images[0]} alt="" className="h-12 w-9 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products/${p.id}`} className="block truncate text-sm hover:text-rose">
                    {p.name}
                  </Link>
                  <div className="mt-1 flex gap-1">
                    {p.colorways.map((c) => (
                      <span
                        key={c.code}
                        title={`${c.name}: ${c.stock}`}
                        className={cx('h-2 w-2 border', c.stock === 0 ? 'opacity-25' : 'border-ink/20')}
                        style={{ background: c.hex }}
                      />
                    ))}
                  </div>
                </div>
                <Badge tone={total === 0 ? 'clay' : 'gold'}>
                  {total === 0 ? 'Sold out' : `${total} left`}
                </Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ---------------------------------------------------------- recent --- */}
      <Panel
        title="Latest orders"
        action={
          <Link to="/admin/orders" className="flex items-center gap-1 font-mono text-2xs uppercase tracking-[0.1em] text-rose hover:text-rose-deep">
            All orders <ArrowRight size={12} />
          </Link>
        }
        bodyClass="p-0"
      >
        <DataTable
          getKey={(o) => o.id}
          rows={recent}
          pageSize={8}
          columns={[
            {
              key: 'id',
              label: 'Order',
              render: (o) => (
                <Link to={`/admin/orders/${o.id}`} className="font-mono text-sm hover:text-rose">
                  {o.id}
                </Link>
              ),
            },
            {
              key: 'customer',
              label: 'Customer',
              render: (o) => (
                <div>
                  <p className="truncate text-sm">{o.customer.name}</p>
                  <p className="font-mono text-2xs text-taupe">
                    {o.shippingAddress.city}, {o.shippingAddress.state}
                  </p>
                </div>
              ),
            },
            {
              key: 'items',
              label: 'Items',
              render: (o) => (
                <span className="font-mono text-2xs text-taupe">
                  {sum(o.items, (i) => i.qty)} pcs
                </span>
              ),
            },
            {
              key: 'method',
              label: 'Payment',
              render: (o) => (
                <Badge tone={o.payment.method === 'upi' ? 'rose' : 'taupe'}>
                  {o.payment.method === 'upi' ? 'UPI' : 'COD'}
                </Badge>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (o) => <Badge tone={statusMeta(o.status).tone}>{statusMeta(o.status).label}</Badge>,
            },
            {
              key: 'when',
              label: 'Placed',
              render: (o) => <span className="font-mono text-2xs text-taupe">{ago(o.createdAt)}</span>,
            },
            {
              key: 'total',
              label: 'Total',
              align: 'right',
              render: (o) => <span className="font-mono text-sm tabular-nums">{money(o.totals.grand)}</span>,
            },
          ]}
        />
      </Panel>
    </>
  )
}

function AlertCard({ to, icon: Icon, title, body, tone }) {
  const tones = {
    gold: 'border-gold/30 bg-gold-wash text-gold-deep',
    clay: 'border-clay/25 bg-clay-wash text-clay-deep',
    taupe: 'border-ink/12 bg-white text-ink',
  }
  return (
    <Link
      to={to}
      className={cx('flex gap-3 border p-4 transition-opacity hover:opacity-85', tones[tone])}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm leading-snug">{title}</p>
        <p className="mt-1 font-mono text-2xs leading-relaxed opacity-80">{body}</p>
      </div>
    </Link>
  )
}
