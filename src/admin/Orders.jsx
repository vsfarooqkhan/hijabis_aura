import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Check, Truck, Package, Home, XCircle, RotateCcw, Copy, Printer, MessageCircle,
} from 'lucide-react'
import useStore from '../store/useStore'
import { money, num, sum, dateLong, ago, dateShort } from '../lib/format'
import { ORDER_STATUSES, statusMeta } from '../data/settings'
import { Badge, Field, Select } from '../components/ui'
import { PageHead, Panel, DataTable, Stat } from './ui'
import cx from '../lib/cx'
import NotFound from '../pages/NotFound'

/* ---------------------------------------------------------------- listing --- */

export function Orders() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'all'
  const orders = useStore((s) => s.orders)

  const tabs = [
    { key: 'all', label: 'All', count: orders.length },
    ...ORDER_STATUSES.map((s) => ({
      key: s.key,
      label: s.label,
      count: orders.filter((o) => o.status === s.key).length,
    })),
  ]

  const rows = useMemo(
    () => (status === 'all' ? orders : orders.filter((o) => o.status === status)),
    [orders, status]
  )

  const awaiting = orders.filter((o) => o.status === 'pending_payment')
  const unpaidCod = orders.filter((o) => o.payment.method === 'cod' && !o.payment.paid)

  return (
    <>
      <PageHead
        title="Orders"
        sub={`${num(orders.length)} all-time · ${num(awaiting.length)} awaiting UPI verification`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Awaiting payment" value={awaiting.length} hint={money(sum(awaiting, (o) => o.totals.grand))} />
        <Stat label="COD to collect" value={unpaidCod.length} hint={money(sum(unpaidCod, (o) => o.totals.grand))} />
        <Stat
          label="In transit"
          value={orders.filter((o) => ['packed', 'shipped'].includes(o.status)).length}
        />
        <Stat label="Delivered" value={orders.filter((o) => o.status === 'delivered').length} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setParams(t.key === 'all' ? {} : { status: t.key }, { replace: true })}
            className={cx(
              'flex items-center gap-2 border px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.1em] transition-colors',
              status === t.key ? 'border-ink bg-ink text-blush' : 'border-ink/15 bg-white hover:border-ink/40'
            )}
          >
            {t.label}
            <span className={status === t.key ? 'text-blush/60' : 'text-taupe'}>{t.count}</span>
          </button>
        ))}
      </div>

      <DataTable
        rows={rows}
        getKey={(o) => o.id}
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
        searchKeys={['id', (o) => o.customer.name, (o) => o.customer.email, (o) => o.shippingAddress.city]}
        searchPlaceholder="Search by order number, name, email or city…"
        initialSort={{ key: 'placed', dir: 'desc' }}
        pageSize={14}
        empty="No orders in this view."
        columns={[
          {
            key: 'id',
            label: 'Order',
            sortValue: (o) => o.id,
            render: (o) => <span className="font-mono text-sm">{o.id}</span>,
          },
          {
            key: 'customer',
            label: 'Customer',
            sortValue: (o) => o.customer.name,
            render: (o) => (
              <div className="min-w-0">
                <p className="truncate text-sm">{o.customer.name}</p>
                <p className="truncate font-mono text-2xs text-taupe">
                  {o.shippingAddress.city}, {o.shippingAddress.state}
                </p>
              </div>
            ),
          },
          {
            key: 'items',
            label: 'Items',
            sortValue: (o) => sum(o.items, (i) => i.qty),
            render: (o) => (
              <div className="flex items-center gap-1.5">
                {o.items.slice(0, 3).map((it) => (
                  <img
                    key={`${it.productId}-${it.colorwayCode}`}
                    src={it.image}
                    alt=""
                    title={`${it.name} — ${it.colorwayName}`}
                    className="h-9 w-7 shrink-0 object-cover"
                  />
                ))}
                {o.items.length > 3 && (
                  <span className="font-mono text-2xs text-taupe">+{o.items.length - 3}</span>
                )}
              </div>
            ),
          },
          {
            key: 'payment',
            label: 'Payment',
            sortValue: (o) => o.payment.method,
            render: (o) => (
              <div className="flex flex-col gap-1">
                <Badge tone={o.payment.method === 'upi' ? 'rose' : 'taupe'}>
                  {o.payment.method === 'upi' ? 'UPI' : 'COD'}
                </Badge>
                <span className={cx('font-mono text-2xs', o.payment.paid ? 'text-rose' : 'text-taupe')}>
                  {o.payment.paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            sortValue: (o) => o.status,
            render: (o) => <Badge tone={statusMeta(o.status).tone}>{statusMeta(o.status).label}</Badge>,
          },
          {
            key: 'placed',
            label: 'Placed',
            sortValue: (o) => new Date(o.createdAt).getTime(),
            render: (o) => (
              <span className="font-mono text-2xs text-taupe" title={dateLong(o.createdAt)}>
                {ago(o.createdAt)}
              </span>
            ),
          },
          {
            key: 'total',
            label: 'Total',
            align: 'right',
            sortValue: (o) => o.totals.grand,
            render: (o) => <span className="font-mono text-sm tabular-nums">{money(o.totals.grand)}</span>,
          },
        ]}
      />
    </>
  )
}

/* ------------------------------------------------------------------ detail --- */

const FLOW = [
  { key: 'confirmed', label: 'Confirm', icon: Check },
  { key: 'packed', label: 'Mark packed', icon: Package },
  { key: 'shipped', label: 'Mark shipped', icon: Truck },
  { key: 'delivered', label: 'Mark delivered', icon: Home },
]

export function OrderDetail() {
  const { id } = useParams()
  const order = useStore((s) => s.orders.find((o) => o.id === id))
  const updateOrder = useStore((s) => s.updateOrder)
  const markPaid = useStore((s) => s.markPaid)
  const brand = useStore((s) => s.settings.brand)

  const [utr, setUtr] = useState('')
  const [courier, setCourier] = useState('')
  const [awb, setAwb] = useState('')

  if (!order) return <NotFound />

  const setStatus = (status) => {
    // Shipping without a tracking number leaves the customer with nothing to
    // check, so the AWB is required at that step.
    if (status === 'shipped' && !order.awb && !awb.trim()) {
      toast.error('Add a courier and AWB number before marking this shipped.')
      return
    }
    const patch = { status }
    if (status === 'shipped') {
      patch.courier = courier || order.courier || 'Delhivery'
      patch.awb = awb.trim() || order.awb
    }
    if (status === 'delivered' && order.payment.method === 'cod') {
      patch.payment = { ...order.payment, paid: true }
    }
    updateOrder(order.id, patch)
    toast.success(`${order.id} — ${statusMeta(status).label.toLowerCase()}`)
  }

  const copyAddress = async () => {
    const text = [
      order.customer.name,
      order.shippingAddress.line1,
      order.shippingAddress.landmark,
      `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`,
      order.customer.phone,
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Address copied for the label')
    } catch {
      toast.error('Could not copy — select the address manually.')
    }
  }

  return (
    <>
      <Link to="/admin/orders" className="btn-ghost mb-4 pl-0">
        <ArrowLeft size={15} />
        All orders
      </Link>

      <PageHead
        title={order.id}
        sub={`Placed ${dateLong(order.createdAt)} · ${ago(order.createdAt)}`}
        action={
          <>
            <button type="button" onClick={() => window.print()} className="btn-outline px-4 py-2.5 text-2xs uppercase tracking-[0.1em]">
              <Printer size={14} />
              Print
            </button>
            <a
              href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Salaam ${order.customer.name.split(' ')[0]}, this is ${brand.name} about order ${order.id}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline px-4 py-2.5 text-2xs uppercase tracking-[0.1em]"
            >
              <MessageCircle size={14} />
              WhatsApp customer
            </a>
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={statusMeta(order.status).tone}>{statusMeta(order.status).label}</Badge>
          <Badge tone={order.payment.method === 'upi' ? 'rose' : 'taupe'}>
            {order.payment.method === 'upi' ? 'UPI prepaid' : 'Cash on delivery'}
          </Badge>
          <Badge tone={order.payment.paid ? 'rose' : 'gold'}>
            {order.payment.paid ? 'Payment received' : 'Payment outstanding'}
          </Badge>
        </div>
      </PageHead>

      <div className="grid gap-5 xl:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-5">
          {/* ---------------------------------------------- upi verification --- */}
          {order.status === 'pending_payment' && (
            <Panel
              title="Verify this UPI payment"
              sub="Match the reference against your bank statement before releasing the parcel"
              className="border-gold/40"
            >
              <div className="mb-4 border border-gold/30 bg-gold-wash p-4">
                <p className="spec-key mb-1 text-gold-deep">Customer submitted</p>
                <p className="font-mono text-lg tabular-nums tracking-wider text-gold-deep">
                  {order.payment.upiRef || '— none provided —'}
                </p>
                <p className="mt-2 font-mono text-2xs text-gold-deep/80">
                  Expecting {money(order.totals.grand)} into {useStore.getState().settings.payments.upiVpa}
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <Field
                  label="Correct the reference (optional)"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  maxLength={12}
                  placeholder={order.payment.upiRef || '123456789012'}
                  className="max-w-52 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    markPaid(order.id, { upiRef: utr.trim() || order.payment.upiRef })
                    toast.success(`${order.id} confirmed — payment verified`)
                    setUtr('')
                  }}
                  className="btn-ink px-5 py-2.5"
                >
                  <Check size={15} />
                  Payment received, confirm order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Cancel this order? The customer should be told why.')) {
                      updateOrder(order.id, { status: 'cancelled' })
                      toast('Order cancelled')
                    }
                  }}
                  className="btn-outline border-clay/30 px-4 py-2.5 text-clay-deep hover:border-clay hover:bg-clay hover:text-white"
                >
                  <XCircle size={15} />
                  No payment found
                </button>
              </div>
            </Panel>
          )}

          {/* ------------------------------------------------------ fulfil --- */}
          <Panel title="Fulfilment" sub="Each step is what the customer sees on their tracker">
            <div className="mb-5 flex flex-wrap gap-2">
              {FLOW.map((f) => {
                const done = FLOW.findIndex((x) => x.key === order.status) >= FLOW.findIndex((x) => x.key === f.key)
                const disabled = order.status === 'pending_payment' || ['cancelled', 'returned'].includes(order.status)
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setStatus(f.key)}
                    disabled={disabled}
                    className={cx(
                      'flex items-center gap-2 border px-3.5 py-2.5 font-mono text-2xs uppercase tracking-[0.1em] transition-colors',
                      order.status === f.key
                        ? 'border-ink bg-ink text-blush'
                        : done
                          ? 'border-rose/35 bg-rose-wash text-rose-deep'
                          : 'border-ink/15 hover:border-ink/40',
                      disabled && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    <f.icon size={13} />
                    {f.label}
                  </button>
                )
              })}
            </div>

            <div className="grid gap-3 border-t border-ink/10 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Select
                label="Courier"
                value={courier || order.courier || ''}
                onChange={(e) => setCourier(e.target.value)}
              >
                <option value="">Select a courier…</option>
                {['Delhivery', 'Bluedart', 'Xpressbees', 'Ekart', 'India Post', 'Shiprocket'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Field
                label="AWB / tracking number"
                value={awb || order.awb || ''}
                onChange={(e) => setAwb(e.target.value)}
                placeholder="123456789"
                className="font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  updateOrder(order.id, {
                    courier: courier || order.courier,
                    awb: (awb || order.awb || '').trim(),
                  })
                  toast.success('Tracking details saved')
                }}
                className="btn-outline px-4 py-2.5 text-2xs uppercase tracking-[0.1em]"
              >
                Save tracking
              </button>
            </div>

            {!['cancelled', 'returned'].includes(order.status) && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Mark this order returned?')) {
                      updateOrder(order.id, { status: 'returned' })
                      toast('Marked returned')
                    }
                  }}
                  className="btn-ghost pl-0 text-2xs uppercase tracking-[0.1em]"
                >
                  <RotateCcw size={13} />
                  Mark returned
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Cancel this order?')) {
                      updateOrder(order.id, { status: 'cancelled' })
                      toast('Order cancelled')
                    }
                  }}
                  className="btn-ghost text-2xs uppercase tracking-[0.1em] text-clay-deep"
                >
                  <XCircle size={13} />
                  Cancel order
                </button>
              </div>
            )}
          </Panel>

          {/* -------------------------------------------------------- items --- */}
          <Panel title={`${sum(order.items, (i) => i.qty)} pieces`} bodyClass="p-0">
            <ul className="divide-y divide-ink/[0.07]">
              {order.items.map((it) => (
                <li key={`${it.productId}-${it.colorwayCode}`} className="flex items-center gap-3.5 px-5 py-3.5">
                  <img src={it.image} alt="" className="h-16 w-12 shrink-0 bg-blush-warm object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/products/${it.productId}`} className="block truncate text-sm hover:text-rose">
                      {it.name}
                    </Link>
                    <p className="mt-1 flex items-center gap-2 font-mono text-2xs text-taupe">
                      <span
                        className="inline-block h-3 w-3 border border-ink/15"
                        style={{ background: it.hex }}
                      />
                      {it.colorwayName} · {it.colorwayCode}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-2xs tabular-nums text-taupe">
                    {money(it.price)} × {it.qty}
                  </span>
                  <span className="w-20 shrink-0 text-right font-mono text-sm tabular-nums">
                    {money(it.price * it.qty)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* -------------------------------------------------------- sidebar --- */}
        <div className="space-y-5">
          <Panel title="Money">
            <dl className="space-y-2.5 text-sm">
              <Row k="Subtotal" v={money(order.totals.subtotal)} />
              {order.totals.discount > 0 && (
                <Row k="Discounts" v={`−${money(order.totals.discount)}`} tone="rose" />
              )}
              <Row k="Shipping" v={order.totals.shipping === 0 ? 'Free' : money(order.totals.shipping)} />
              {order.totals.codFee > 0 && <Row k="COD handling" v={money(order.totals.codFee)} />}
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-2.5">
                <dt className="display-sm text-base">Total</dt>
                <dd className="font-mono text-lg tabular-nums">{money(order.totals.grand)}</dd>
              </div>
            </dl>

            {order.payment.upiRef && (
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="spec-key mb-1">UPI reference</p>
                <p className="font-mono text-2xs tabular-nums">{order.payment.upiRef}</p>
                {order.payment.verifiedBy && (
                  <p className="mt-1 font-mono text-2xs text-taupe">
                    Verified by {order.payment.verifiedBy}
                  </p>
                )}
              </div>
            )}

            {order.payment.method === 'cod' && !order.payment.paid && (
              <button
                type="button"
                onClick={() => {
                  markPaid(order.id)
                  toast.success('COD marked collected')
                }}
                className="btn-outline mt-4 w-full py-2.5 text-2xs uppercase tracking-[0.1em]"
              >
                Mark COD collected
              </button>
            )}
          </Panel>

          <Panel
            title="Ship to"
            action={
              <button
                type="button"
                onClick={copyAddress}
                className="flex items-center gap-1 font-mono text-2xs uppercase tracking-[0.1em] text-rose hover:text-rose-deep"
              >
                <Copy size={12} />
                Copy
              </button>
            }
          >
            <address className="text-sm not-italic leading-relaxed text-ink/80">
              {order.customer.name}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.landmark && (
                <>
                  {order.shippingAddress.landmark}
                  <br />
                </>
              )}
              {order.shippingAddress.city}, {order.shippingAddress.state}
              <br />
              <span className="font-mono">{order.shippingAddress.pincode}</span>
            </address>

            <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 font-mono text-2xs">
              <div>
                <dt className="text-taupe">Phone</dt>
                <dd>{order.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-taupe">Email</dt>
                <dd className="break-all">{order.customer.email}</dd>
              </div>
            </dl>
          </Panel>

          {order.awb && (
            <Panel title="Tracking">
              <dl className="space-y-1.5 font-mono text-2xs">
                <div>
                  <dt className="text-taupe">Courier</dt>
                  <dd>{order.courier}</dd>
                </div>
                <div>
                  <dt className="text-taupe">AWB</dt>
                  <dd>{order.awb}</dd>
                </div>
              </dl>
            </Panel>
          )}

          {order.notes && (
            <Panel title="Customer note">
              <p className="border-l-2 border-gold pl-3 text-sm italic leading-relaxed text-ink/75">
                “{order.notes}”
              </p>
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}

function Row({ k, v, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink/65">{k}</dt>
      <dd className={tone === 'rose' ? 'font-mono tabular-nums text-rose' : 'font-mono tabular-nums'}>
        {v}
      </dd>
    </div>
  )
}
