/** Customers, collections, coupons and reviews — four short admin screens. */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Trash2, Eye, EyeOff, Star, Check, X, Ticket } from 'lucide-react'
import useStore from '../store/useStore'
import { money, num, sum, agoDays, initials } from '../lib/format'
import { Badge, Field, Select, Toggle, Avatar, Stars } from '../components/ui'
import { PageHead, Panel, DataTable, Stat } from './ui'
import cx from '../lib/cx'

/* -------------------------------------------------------------- customers --- */

export function Customers() {
  const customers = useStore((s) => s.customers)
  const orders = useStore((s) => s.orders)

  const rows = useMemo(
    () =>
      customers
        .map((c) => {
          const own = orders.filter((o) => o.customerId === c.id)
          const spend = sum(
            own.filter((o) => !['cancelled', 'returned', 'pending_payment'].includes(o.status)),
            (o) => o.totals.grand
          )
          return { ...c, orderCount: own.length, spend, last: own[0] }
        })
        .sort((a, b) => b.spend - a.spend),
    [customers, orders]
  )

  const repeat = rows.filter((r) => r.orderCount > 1).length

  return (
    <>
      <PageHead title="Customers" sub={`${num(customers.length)} on the list`} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Customers" value={customers.length} />
        <Stat label="Repeat buyers" value={repeat} hint={`${Math.round((repeat / Math.max(1, customers.length)) * 100)}% of the list`} />
        <Stat label="Lifetime revenue" value={sum(rows, (r) => r.spend)} format="money" />
        <Stat
          label="Marketing opt-ins"
          value={customers.filter((c) => c.marketingOptIn).length}
        />
      </div>

      <DataTable
        rows={rows}
        getKey={(c) => c.id}
        searchKeys={['name', 'email', 'city', 'phone']}
        searchPlaceholder="Search by name, email, city or phone…"
        initialSort={{ key: 'spend', dir: 'desc' }}
        pageSize={14}
        columns={[
          {
            key: 'name',
            label: 'Customer',
            sortValue: (c) => c.name,
            render: (c) => (
              <div className="flex items-center gap-3">
                <Avatar name={c.name} hex="#2E201E" size={34} />
                <div className="min-w-0">
                  <p className="truncate text-sm">{c.name}</p>
                  <p className="truncate font-mono text-2xs text-taupe">{c.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'city',
            label: 'Location',
            sortValue: (c) => c.city,
            render: (c) => (
              <span className="font-mono text-2xs text-taupe">
                {c.city}, {c.state}
                <br />
                {c.pincode}
              </span>
            ),
          },
          {
            key: 'phone',
            label: 'Phone',
            render: (c) => <span className="font-mono text-2xs">{c.phone}</span>,
          },
          {
            key: 'orders',
            label: 'Orders',
            align: 'right',
            sortValue: (c) => c.orderCount,
            render: (c) => (
              <span className="font-mono text-sm tabular-nums">{c.orderCount}</span>
            ),
          },
          {
            key: 'spend',
            label: 'Lifetime spend',
            align: 'right',
            sortValue: (c) => c.spend,
            render: (c) => <span className="font-mono text-sm tabular-nums">{money(c.spend)}</span>,
          },
          {
            key: 'joined',
            label: 'Joined',
            align: 'right',
            sortValue: (c) => -c.joinedDaysAgo,
            render: (c) => <span className="font-mono text-2xs text-taupe">{agoDays(c.joinedDaysAgo)}</span>,
          },
          {
            key: 'marketing',
            label: 'Email',
            align: 'right',
            render: (c) =>
              c.marketingOptIn ? <Badge tone="rose">Subscribed</Badge> : <Badge tone="taupe">No</Badge>,
          },
        ]}
      />
    </>
  )
}

/* ------------------------------------------------------------ collections --- */

export function Collections() {
  const collections = useStore((s) => s.collections)
  const products = useStore((s) => s.products)
  const saveCollection = useStore((s) => s.saveCollection)
  const deleteCollection = useStore((s) => s.deleteCollection)
  const [editing, setEditing] = useState(null)

  const blank = {
    slug: '',
    name: '',
    kicker: '',
    blurb: '',
    banner: '/img/collections/everyday-modal.svg',
    order: collections.length + 1,
    published: true,
  }

  const save = () => {
    if (!editing.name.trim() || !editing.slug.trim()) {
      toast.error('A collection needs a name and a slug.')
      return
    }
    saveCollection(editing)
    toast.success(`${editing.name} saved`)
    setEditing(null)
  }

  return (
    <>
      <PageHead
        title="Collections"
        sub="The drawers products are sorted into"
        action={
          <button type="button" onClick={() => setEditing(blank)} className="btn-ink px-5 py-2.5">
            <Plus size={15} />
            New collection
          </button>
        }
      />

      {editing && (
        <Panel title={editing.slug ? `Edit ${editing.name || 'collection'}` : 'New collection'} className="mb-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              value={editing.name}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  name: e.target.value,
                  slug:
                    editing.slug && collections.some((c) => c.slug === editing.slug)
                      ? editing.slug
                      : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                })
              }
            />
            <Field
              label="URL slug"
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="font-mono"
            />
            <Field
              label="Kicker"
              value={editing.kicker}
              onChange={(e) => setEditing({ ...editing, kicker: e.target.value })}
              hint="The small line above the name"
              className="sm:col-span-2"
            />
            <Field
              as="textarea"
              label="Blurb"
              rows={3}
              value={editing.blurb}
              onChange={(e) => setEditing({ ...editing, blurb: e.target.value })}
              className="sm:col-span-2"
            />
            <Field
              label="Banner image URL"
              value={editing.banner}
              onChange={(e) => setEditing({ ...editing, banner: e.target.value })}
              className="sm:col-span-2 font-mono"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Toggle
              label="Published"
              checked={editing.published}
              onChange={(published) => setEditing({ ...editing, published })}
            />
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline px-4 py-2.5">
                Cancel
              </button>
              <button type="button" onClick={save} className="btn-ink px-5 py-2.5">
                Save collection
              </button>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collections.map((c) => {
          const count = products.filter((p) => p.collection === c.slug).length
          return (
            <div key={c.slug} className="border border-ink/10 bg-white">
              <div className="relative aspect-[16/9] bg-blush-warm">
                <img src={c.banner} alt="" className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <Badge tone={c.published ? 'rose' : 'taupe'}>
                    {c.published ? 'Published' : 'Hidden'}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <p className="font-mono text-2xs uppercase tracking-[0.12em] text-gold-deep">{c.kicker}</p>
                <h3 className="display-sm mt-1 text-base">{c.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/65">{c.blurb}</p>
                <p className="mt-3 font-mono text-2xs text-taupe">
                  {count} {count === 1 ? 'product' : 'products'} · /{c.slug}
                </p>

                <div className="mt-4 flex items-center gap-2 border-t border-ink/10 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(structuredClone(c))}
                    className="font-mono text-2xs uppercase tracking-[0.1em] text-rose hover:text-rose-deep"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveCollection({ ...c, published: !c.published })
                      toast.success(c.published ? `${c.name} hidden` : `${c.name} published`)
                    }}
                    className="ml-auto p-1.5 text-taupe hover:text-ink"
                    aria-label={c.published ? `Hide ${c.name}` : `Publish ${c.name}`}
                  >
                    {c.published ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (count > 0) {
                        toast.error(
                          `${c.name} still has ${count} product${count === 1 ? '' : 's'}. Move them first.`
                        )
                        return
                      }
                      if (window.confirm(`Delete the ${c.name} collection?`)) {
                        deleteCollection(c.slug)
                        toast.success('Collection deleted')
                      }
                    }}
                    className="p-1.5 text-taupe hover:text-clay"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ----------------------------------------------------------------- coupons --- */

export function Coupons() {
  const coupons = useStore((s) => s.coupons)
  const saveCoupon = useStore((s) => s.saveCoupon)
  const deleteCoupon = useStore((s) => s.deleteCoupon)
  const [editing, setEditing] = useState(null)

  const blank = {
    code: '',
    kind: 'percent',
    value: 10,
    minOrder: 0,
    active: true,
    uses: 0,
    cap: null,
    note: '',
    expiresDaysFromNow: 30,
  }

  const save = () => {
    if (!/^[A-Z0-9]{3,20}$/.test(editing.code)) {
      toast.error('Codes are 3–20 characters, uppercase letters and numbers only.')
      return
    }
    saveCoupon(editing)
    toast.success(`${editing.code} saved`)
    setEditing(null)
  }

  const describe = (c) =>
    c.kind === 'percent'
      ? `${c.value}% off`
      : c.kind === 'flat'
        ? `${money(c.value)} off`
        : 'Free shipping'

  return (
    <>
      <PageHead
        title="Coupons"
        sub={`${coupons.filter((c) => c.active).length} active of ${coupons.length}`}
        action={
          <button type="button" onClick={() => setEditing(blank)} className="btn-ink px-5 py-2.5">
            <Plus size={15} />
            New coupon
          </button>
        }
      />

      {editing && (
        <Panel title={editing.uses ? `Edit ${editing.code}` : 'New coupon'} className="mb-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Code"
              value={editing.code}
              onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
              className="font-mono uppercase"
            />
            <Select label="Type" value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
              <option value="percent">Percentage off</option>
              <option value="flat">Flat amount off</option>
              <option value="shipping">Free shipping</option>
            </Select>
            <Field
              label={editing.kind === 'percent' ? 'Percent' : 'Amount (₹)'}
              type="number"
              min="0"
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
              className="font-mono"
              disabled={editing.kind === 'shipping'}
            />
            <Field
              label="Minimum order (₹)"
              type="number"
              min="0"
              value={editing.minOrder}
              onChange={(e) => setEditing({ ...editing, minOrder: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="Usage cap"
              type="number"
              min="0"
              value={editing.cap ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, cap: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="font-mono"
              hint="Blank for unlimited"
            />
            <Field
              label="Expires in (days)"
              type="number"
              value={editing.expiresDaysFromNow}
              onChange={(e) => setEditing({ ...editing, expiresDaysFromNow: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="Internal note"
              value={editing.note}
              onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              className="sm:col-span-2 lg:col-span-3"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Toggle label="Active" checked={editing.active} onChange={(active) => setEditing({ ...editing, active })} />
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline px-4 py-2.5">
                Cancel
              </button>
              <button type="button" onClick={save} className="btn-ink px-5 py-2.5">
                Save coupon
              </button>
            </div>
          </div>
        </Panel>
      )}

      <DataTable
        rows={coupons}
        getKey={(c) => c.code}
        searchKeys={['code', 'note']}
        searchPlaceholder="Search codes…"
        pageSize={14}
        columns={[
          {
            key: 'code',
            label: 'Code',
            sortValue: (c) => c.code,
            render: (c) => (
              <div className="flex items-center gap-2.5">
                <Ticket size={15} className="shrink-0 text-gold-deep" />
                <div>
                  <p className="font-mono text-sm">{c.code}</p>
                  {c.note && <p className="font-mono text-2xs text-taupe">{c.note}</p>}
                </div>
              </div>
            ),
          },
          {
            key: 'value',
            label: 'Discount',
            render: (c) => <span className="text-sm">{describe(c)}</span>,
          },
          {
            key: 'min',
            label: 'Minimum',
            sortValue: (c) => c.minOrder,
            render: (c) => (
              <span className="font-mono text-2xs text-taupe">
                {c.minOrder ? money(c.minOrder) : 'None'}
              </span>
            ),
          },
          {
            key: 'uses',
            label: 'Used',
            align: 'right',
            sortValue: (c) => c.uses,
            render: (c) => (
              <span className="font-mono text-2xs tabular-nums">
                {num(c.uses)}
                {c.cap ? ` / ${num(c.cap)}` : ''}
              </span>
            ),
          },
          {
            key: 'expiry',
            label: 'Expires',
            sortValue: (c) => c.expiresDaysFromNow,
            render: (c) => (
              <span className="font-mono text-2xs text-taupe">
                {c.expiresDaysFromNow < 0 ? 'Expired' : `in ${c.expiresDaysFromNow} days`}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (c) => (
              <Badge tone={c.active && c.expiresDaysFromNow >= 0 ? 'rose' : 'taupe'}>
                {c.active && c.expiresDaysFromNow >= 0 ? 'Active' : 'Inactive'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            label: '',
            align: 'right',
            render: (c) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(structuredClone(c))}
                  className="font-mono text-2xs uppercase tracking-[0.1em] text-rose hover:text-rose-deep"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${c.code}?`)) {
                      deleteCoupon(c.code)
                      toast.success('Coupon deleted')
                    }
                  }}
                  className="p-1.5 text-taupe hover:text-clay"
                  aria-label={`Delete ${c.code}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

/* ----------------------------------------------------------------- reviews --- */

export function Reviews() {
  const reviews = useStore((s) => s.reviews)
  const setPublished = useStore((s) => s.setReviewPublished)
  const deleteReview = useStore((s) => s.deleteReview)
  const [tab, setTab] = useState('pending')

  const rows = useMemo(() => {
    if (tab === 'pending') return reviews.filter((r) => !r.published)
    if (tab === 'published') return reviews.filter((r) => r.published)
    return reviews
  }, [reviews, tab])

  const tabs = [
    { key: 'pending', label: 'Awaiting approval', count: reviews.filter((r) => !r.published).length },
    { key: 'published', label: 'Published', count: reviews.filter((r) => r.published).length },
    { key: 'all', label: 'All', count: reviews.length },
  ]

  const avg = reviews.length ? sum(reviews, (r) => r.rating) / reviews.length : 0

  return (
    <>
      <PageHead
        title="Reviews"
        sub={`${num(reviews.length)} total · ${avg.toFixed(2)} average rating`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total reviews" value={reviews.length} />
        <Stat label="Awaiting approval" value={reviews.filter((r) => !r.published).length} />
        <Stat label="Verified buyers" value={reviews.filter((r) => r.verified).length} />
        <Stat label="One and two star" value={reviews.filter((r) => r.rating <= 2).length} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cx(
              'flex items-center gap-2 border px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.1em] transition-colors',
              tab === t.key ? 'border-ink bg-ink text-blush' : 'border-ink/15 bg-white hover:border-ink/40'
            )}
          >
            {t.label}
            <span className={tab === t.key ? 'text-blush/60' : 'text-taupe'}>{t.count}</span>
          </button>
        ))}
      </div>

      <DataTable
        rows={rows}
        getKey={(r) => r.id}
        searchKeys={['author', 'title', 'body', 'productName']}
        searchPlaceholder="Search reviews…"
        initialSort={{ key: 'when', dir: 'asc' }}
        pageSize={12}
        empty="Nothing in this view."
        columns={[
          {
            key: 'review',
            label: 'Review',
            render: (r) => (
              <div className="max-w-lg">
                <div className="flex items-center gap-2.5">
                  <Stars value={r.rating} size={12} />
                  <span className="text-sm">{r.title}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/65">{r.body}</p>
              </div>
            ),
          },
          {
            key: 'product',
            label: 'Product',
            sortValue: (r) => r.productName,
            render: (r) => (
              <Link to={`/admin/products/${r.productId}`} className="font-mono text-2xs text-taupe hover:text-rose">
                {r.productName}
              </Link>
            ),
          },
          {
            key: 'author',
            label: 'From',
            sortValue: (r) => r.author,
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <Avatar name={r.author} hex="#96625A" size={28} />
                <div>
                  <p className="text-sm">{r.author}</p>
                  <p className="font-mono text-2xs text-taupe">
                    {r.city}
                    {r.verified && ' · verified'}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'when',
            label: 'Posted',
            sortValue: (r) => r.daysAgo,
            render: (r) => <span className="font-mono text-2xs text-taupe">{agoDays(r.daysAgo)}</span>,
          },
          {
            key: 'actions',
            label: '',
            align: 'right',
            render: (r) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPublished(r.id, !r.published)
                    toast.success(r.published ? 'Review unpublished' : 'Review published')
                  }}
                  className={cx(
                    'flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-2xs uppercase tracking-[0.1em] transition-colors',
                    r.published
                      ? 'border-ink/15 text-taupe hover:border-ink/40'
                      : 'border-rose bg-rose text-white'
                  )}
                >
                  {r.published ? <X size={12} /> : <Check size={12} />}
                  {r.published ? 'Unpublish' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this review permanently?')) {
                      deleteReview(r.id)
                      toast.success('Review deleted')
                    }
                  }}
                  className="p-1.5 text-taupe hover:text-clay"
                  aria-label="Delete review"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
