import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Eye, EyeOff, Copy } from 'lucide-react'
import useStore, { stockOf } from '../store/useStore'
import { money, num } from '../lib/format'
import { Badge } from '../components/ui'
import { PageHead, DataTable } from './ui'
import cx from '../lib/cx'

export default function Products() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') || 'all'

  const products = useStore((s) => s.products)
  const collections = useStore((s) => s.collections)
  const threshold = useStore((s) => s.settings.ops.lowStockThreshold)
  const createProduct = useStore((s) => s.createProduct)
  const saveProduct = useStore((s) => s.saveProduct)
  const duplicateProduct = useStore((s) => s.duplicateProduct)

  const tabs = [
    { key: 'all', label: 'All', count: products.length },
    { key: 'live', label: 'Published', count: products.filter((p) => p.published).length },
    { key: 'draft', label: 'Drafts', count: products.filter((p) => !p.published).length },
    {
      key: 'low',
      label: 'Low stock',
      count: products.filter((p) => p.published && stockOf(p) <= threshold).length,
    },
  ]

  const rows = useMemo(() => {
    if (filter === 'live') return products.filter((p) => p.published)
    if (filter === 'draft') return products.filter((p) => !p.published)
    if (filter === 'low') return products.filter((p) => p.published && stockOf(p) <= threshold)
    return products
  }, [products, filter, threshold])

  return (
    <>
      <PageHead
        title="Products"
        sub={`${num(products.length)} in the catalogue · edit anything here and the storefront updates immediately`}
        action={
          <button
            type="button"
            onClick={() => {
              const draft = createProduct()
              toast.success('Draft created')
              navigate(`/admin/products/${draft.id}`)
            }}
            className="btn-ink px-5 py-2.5"
          >
            <Plus size={15} />
            New product
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setParams(t.key === 'all' ? {} : { filter: t.key }, { replace: true })}
            className={cx(
              'flex items-center gap-2 border px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.1em] transition-colors',
              filter === t.key ? 'border-ink bg-ink text-blush' : 'border-ink/15 bg-white hover:border-ink/40'
            )}
          >
            {t.label}
            <span className={filter === t.key ? 'text-blush/60' : 'text-taupe'}>{t.count}</span>
          </button>
        ))}
      </div>

      <DataTable
        rows={rows}
        getKey={(p) => p.id}
        searchKeys={['name', 'fabric', 'slug', (p) => p.colorways.map((c) => c.name).join(' ')]}
        searchPlaceholder="Search by name, fabric or colourway…"
        initialSort={{ key: 'name', dir: 'asc' }}
        pageSize={14}
        empty="No products match this view."
        columns={[
          {
            key: 'name',
            label: 'Product',
            sortValue: (p) => p.name,
            render: (p) => (
              <div className="flex items-center gap-3">
                <img
                  src={p.colorways[0]?.images[0]}
                  alt=""
                  className="h-14 w-11 shrink-0 bg-blush-warm object-cover"
                />
                <div className="min-w-0">
                  <Link to={`/admin/products/${p.id}`} className="block truncate text-sm hover:text-rose">
                    {p.name}
                  </Link>
                  <p className="font-mono text-2xs text-taupe">
                    {p.fabric}
                    {p.gsm > 0 && ` · ${p.gsm} GSM`}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'collection',
            label: 'Collection',
            sortValue: (p) => p.collection,
            render: (p) => (
              <span className="font-mono text-2xs text-taupe">
                {collections.find((c) => c.slug === p.collection)?.name || p.collection}
              </span>
            ),
          },
          {
            key: 'colours',
            label: 'Colourways',
            sortValue: (p) => p.colorways.length,
            render: (p) => (
              <div className="flex items-center gap-1">
                {p.colorways.map((c) => (
                  <span
                    key={c.code}
                    title={`${c.name} · ${c.stock} in stock`}
                    className={cx('h-3.5 w-3.5 border border-ink/15', c.stock === 0 && 'opacity-25')}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            ),
          },
          {
            key: 'stock',
            label: 'Stock',
            align: 'right',
            sortValue: (p) => stockOf(p),
            render: (p) => {
              const total = stockOf(p)
              return (
                <Badge tone={total === 0 ? 'clay' : total <= threshold ? 'gold' : 'taupe'}>
                  {total === 0 ? 'Sold out' : total}
                </Badge>
              )
            },
          },
          {
            key: 'price',
            label: 'Price',
            align: 'right',
            sortValue: (p) => p.price,
            render: (p) => <span className="font-mono text-sm tabular-nums">{money(p.price)}</span>,
          },
          {
            key: 'actions',
            label: '',
            align: 'right',
            render: (p) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    saveProduct({ ...p, published: !p.published })
                    toast.success(p.published ? `${p.name} unpublished` : `${p.name} is live`)
                  }}
                  title={p.published ? 'Unpublish' : 'Publish'}
                  aria-label={p.published ? `Unpublish ${p.name}` : `Publish ${p.name}`}
                  className="p-1.5 text-taupe transition-colors hover:text-ink"
                >
                  {p.published ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const copy = duplicateProduct(p.id)
                    if (copy) {
                      toast.success('Duplicated as a draft')
                      navigate(`/admin/products/${copy.id}`)
                    }
                  }}
                  title="Duplicate"
                  aria-label={`Duplicate ${p.name}`}
                  className="p-1.5 text-taupe transition-colors hover:text-ink"
                >
                  <Copy size={15} />
                </button>
                <Link
                  to={`/admin/products/${p.id}`}
                  className="ml-1 font-mono text-2xs uppercase tracking-[0.1em] text-rose hover:text-rose-deep"
                >
                  Edit
                </Link>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
