import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Trash2, Copy, Eye, EyeOff, Plus, X, ExternalLink, Palette,
} from 'lucide-react'
import useStore, { stockOf } from '../store/useStore'
import { COLORWAYS, imagesFor } from '../data/colorways.mjs'
import { STYLE_FILTERS, OCCASION_FILTERS, WEAVE_LABELS, FABRIC_FILTERS } from '../data/collections'
import { Badge, Field, Select, Toggle, Checkbox, Swatch } from '../components/ui'
import WeaveDiagram from '../components/WeaveDiagram'
import ImageManager from './ImageManager'
import { PageHead, Panel } from './ui'
import { money, discountPct } from '../lib/format'
import cx from '../lib/cx'
import NotFound from '../pages/NotFound'

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function ProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const stored = useStore((s) => s.products.find((p) => p.id === id))
  const collections = useStore((s) => s.collections)
  const saveProduct = useStore((s) => s.saveProduct)
  const deleteProduct = useStore((s) => s.deleteProduct)
  const duplicateProduct = useStore((s) => s.duplicateProduct)
  const allProducts = useStore((s) => s.products)

  const [draft, setDraft] = useState(stored)
  const [colorIndex, setColorIndex] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Re-seed the local draft when the route changes to a different product.
  useEffect(() => {
    setDraft(stored ? structuredClone(stored) : undefined)
    setColorIndex(0)
  }, [id, stored?.id])

  const slugTaken = !!draft && allProducts.some((p) => p.slug === draft.slug && p.id !== draft.id)

  // Every hook has to run before the guard below — deleting a product re-renders
  // this component with nothing to edit, and a hook behind an early return would
  // change the hook count and crash instead of showing the 404.
  const problems = useMemo(() => {
    if (!draft) return []
    const out = []
    if (!draft.name.trim()) out.push('Name is empty.')
    if (!draft.slug.trim()) out.push('URL slug is empty.')
    if (slugTaken) out.push(`Another product already uses the slug “${draft.slug}”.`)
    if (draft.price <= 0) out.push('Price must be more than zero.')
    if (draft.mrp && draft.mrp < draft.price) out.push('List price is below the selling price.')
    if (draft.colorways.length === 0) out.push('Add at least one colourway before publishing.')
    if (draft.colorways.some((c) => c.images.length === 0))
      out.push('Every colourway needs at least one image.')
    return out
  }, [draft, slugTaken])

  if (!stored || !draft) return <NotFound />

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const colorway = draft.colorways[colorIndex]

  const save = async () => {
    if (problems.length) {
      toast.error(problems[0])
      return
    }
    setSaving(true)
    try {
      await saveProduct(draft)
      toast.success(`${draft.name} saved`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const setColorway = (patch) =>
    setDraft((d) => ({
      ...d,
      colorways: d.colorways.map((c, i) => (i === colorIndex ? { ...c, ...patch } : c)),
    }))

  const addColorway = (cw) => {
    if (draft.colorways.some((c) => c.code === cw.code)) {
      toast.error(`${cw.name} is already on this product.`)
      return
    }
    setDraft((d) => ({
      ...d,
      colorways: [
        ...d.colorways,
        { code: cw.code, name: cw.name, hex: cw.hex, family: cw.family, stock: 0, images: imagesFor(cw.code) },
      ],
    }))
    setColorIndex(draft.colorways.length)
    setPickerOpen(false)
  }

  const removeColorway = (index) => {
    setDraft((d) => ({ ...d, colorways: d.colorways.filter((_, i) => i !== index) }))
    setColorIndex((i) => Math.max(0, i - (index <= i ? 1 : 0)))
  }

  return (
    <>
      <Link to="/admin/products" className="btn-ghost mb-4 pl-0">
        <ArrowLeft size={15} />
        All products
      </Link>

      <PageHead
        title={draft.name || 'Untitled product'}
        sub={`${draft.id} · ${stockOf(draft)} in stock across ${draft.colorways.length} colourway${
          draft.colorways.length === 1 ? '' : 's'
        }`}
        action={
          <>
            {draft.published && (
              <Link to={`/product/${draft.slug}`} className="btn-outline px-4 py-2.5 text-2xs uppercase tracking-[0.1em]">
                <ExternalLink size={14} />
                View live
              </Link>
            )}
            <button
              type="button"
              onClick={async () => {
                try {
                  const copy = await duplicateProduct(draft.id)
                  if (copy) {
                    toast.success('Duplicated as a draft')
                    navigate(`/admin/products/${copy.id}`)
                  }
                } catch (err) {
                  toast.error(err.message)
                }
              }}
              className="btn-outline px-4 py-2.5 text-2xs uppercase tracking-[0.1em]"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`Delete “${draft.name}” permanently? This cannot be undone.`)) return
                try {
                  await deleteProduct(draft.id)
                  toast.success('Product deleted')
                  navigate('/admin/products')
                } catch (err) {
                  toast.error(err.message)
                }
              }}
              className="btn-outline border-clay/30 px-4 py-2.5 text-2xs uppercase tracking-[0.1em] text-clay-deep hover:border-clay hover:bg-clay hover:text-white"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="btn-ink px-5 py-2.5"
            >
              <Save size={15} />
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={draft.published ? 'rose' : 'taupe'}>
            {draft.published ? 'Published' : 'Draft'}
          </Badge>
          {draft.featured && <Badge tone="gold">Featured on home</Badge>}
          {dirty && <Badge tone="gold">Unsaved changes</Badge>}
        </div>
      </PageHead>

      {problems.length > 0 && (
        <div className="mb-5 border border-clay/25 bg-clay-wash p-4">
          <p className="mb-2 font-mono text-2xs uppercase tracking-[0.12em] text-clay-deep">
            Fix before publishing
          </p>
          <ul className="space-y-1">
            {problems.map((p) => (
              <li key={p} className="text-sm text-clay-deep">
                — {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          {/* ------------------------------------------------------ basics --- */}
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value
                  // Only auto-slug while the product is still a draft, so a
                  // published URL never changes under someone's feet.
                  set(draft.published ? { name } : { name, slug: slugify(name) })
                }}
                className="sm:col-span-2"
              />
              <Field
                label="URL slug"
                value={draft.slug}
                onChange={(e) => set({ slug: slugify(e.target.value) })}
                error={slugTaken ? 'Already used by another product' : undefined}
                hint={!slugTaken ? `/product/${draft.slug}` : undefined}
                className="sm:col-span-2 font-mono"
              />
              <Field
                label="Tagline"
                value={draft.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
                hint="Shown in script under the name"
                className="sm:col-span-2"
              />
              <Field
                as="textarea"
                label="Description"
                rows={5}
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                className="sm:col-span-2"
              />
              <Select
                label="Collection"
                value={draft.collection}
                onChange={(e) => set({ collection: e.target.value })}
              >
                {collections.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select label="Cut" value={draft.style} onChange={(e) => set({ style: e.target.value })}>
                {STYLE_FILTERS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-5">
              <p className="spec-key mb-2.5">Occasion tags</p>
              <div className="flex flex-wrap gap-2">
                {OCCASION_FILTERS.map((o) => {
                  const on = draft.occasion.includes(o.key)
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() =>
                        set({
                          occasion: on
                            ? draft.occasion.filter((x) => x !== o.key)
                            : [...draft.occasion, o.key],
                        })
                      }
                      aria-pressed={on}
                      className={cx(
                        'border px-2.5 py-1.5 font-mono text-2xs transition-colors',
                        on ? 'border-ink bg-ink text-blush' : 'border-ink/15 hover:border-ink/40'
                      )}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="spec-key mb-2.5">Selling points</p>
              <NoteList notes={draft.notes} onChange={(notes) => set({ notes })} />
            </div>
          </Panel>

          {/* ---------------------------------------------------- mill spec --- */}
          <Panel
            title="Mill spec"
            sub="Published verbatim on the product page"
            action={<WeaveDiagram weave={draft.weave} color="#96625A" size={40} />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Fabric"
                value={FABRIC_FILTERS.includes(draft.fabric) ? draft.fabric : '__custom'}
                onChange={(e) => {
                  if (e.target.value !== '__custom') set({ fabric: e.target.value })
                }}
              >
                {FABRIC_FILTERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="__custom">Something else…</option>
              </Select>
              <Field
                label="Fabric name (free text)"
                value={draft.fabric}
                onChange={(e) => set({ fabric: e.target.value })}
              />
              <Select label="Weave" value={draft.weave} onChange={(e) => set({ weave: e.target.value })}>
                {Object.entries(WEAVE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Field
                label="GSM"
                type="number"
                min="0"
                value={draft.gsm}
                onChange={(e) => set({ gsm: Number(e.target.value) })}
                className="font-mono"
              />
              <Field
                label="Width (cm)"
                type="number"
                min="0"
                value={draft.size?.w ?? 0}
                onChange={(e) => set({ size: { ...draft.size, w: Number(e.target.value) } })}
                className="font-mono"
              />
              <Field
                label="Length (cm)"
                type="number"
                min="0"
                value={draft.size?.l ?? 0}
                onChange={(e) => set({ size: { ...draft.size, l: Number(e.target.value) } })}
                className="font-mono"
              />
              <Field
                label="Piece weight (g)"
                type="number"
                min="0"
                value={draft.weight}
                onChange={(e) => set({ weight: Number(e.target.value) })}
                className="font-mono"
              />
              <Field
                label="Size note"
                value={draft.size?.note || ''}
                onChange={(e) => set({ size: { ...draft.size, note: e.target.value } })}
                hint="For one-size or unusual cuts"
              />
              <Field
                label="Composition"
                value={draft.composition}
                onChange={(e) => set({ composition: e.target.value })}
                className="sm:col-span-2"
              />
              <Field
                label="Woven / made in"
                value={draft.origin}
                onChange={(e) => set({ origin: e.target.value })}
                className="sm:col-span-2"
              />
              <Field
                as="textarea"
                label="Care instructions"
                rows={2}
                value={draft.care}
                onChange={(e) => set({ care: e.target.value })}
                className="sm:col-span-2"
              />
              <Field
                as="textarea"
                label="Safety warning (optional)"
                rows={2}
                value={draft.warning || ''}
                onChange={(e) => set({ warning: e.target.value })}
                hint="Shown in a red callout — magnets, small parts"
                className="sm:col-span-2"
              />
            </div>
          </Panel>

          {/* -------------------------------------------------- colourways --- */}
          <Panel
            title="Colourways & images"
            sub="Each colourway has its own image set — the carousel swaps with the swatch"
            action={
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="btn-outline px-3 py-2 text-2xs uppercase tracking-[0.1em]"
              >
                <Plus size={13} />
                Add colourway
              </button>
            }
          >
            {pickerOpen && (
              <div className="mb-5 border border-ink/12 bg-blush-warm p-4">
                <p className="spec-key mb-3 flex items-center gap-1.5">
                  <Palette size={12} />
                  Pick from the dye card
                </p>
                <div className="flex flex-wrap gap-2">
                  {COLORWAYS.map((cw) => {
                    const used = draft.colorways.some((c) => c.code === cw.code)
                    return (
                      <button
                        key={cw.code}
                        type="button"
                        onClick={() => addColorway(cw)}
                        disabled={used}
                        title={`${cw.name} · ${cw.code}`}
                        className={cx(
                          'flex items-center gap-2 border px-2 py-1.5 font-mono text-2xs transition-colors',
                          used
                            ? 'cursor-not-allowed border-ink/10 opacity-40'
                            : 'border-ink/15 hover:border-ink'
                        )}
                      >
                        <span
                          className="h-3.5 w-3.5 border border-ink/15"
                          style={{ background: cw.hex }}
                        />
                        {cw.code}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {draft.colorways.length === 0 ? (
              <p className="border border-dashed border-ink/20 px-4 py-8 text-center text-sm text-taupe">
                No colourways yet. Add one from the dye card above.
              </p>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-ink/10 pb-4">
                  {draft.colorways.map((c, i) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setColorIndex(i)}
                      className={cx(
                        'flex items-center gap-2 border px-2.5 py-1.5 font-mono text-2xs transition-colors',
                        i === colorIndex ? 'border-ink bg-ink text-blush' : 'border-ink/15 hover:border-ink/40'
                      )}
                    >
                      <span className="h-3.5 w-3.5 border border-black/10" style={{ background: c.hex }} />
                      {c.code}
                      <span className={cx('tabular-nums', i === colorIndex ? 'text-blush/60' : 'text-taupe')}>
                        {c.stock}
                      </span>
                    </button>
                  ))}
                </div>

                {colorway && (
                  <div>
                    <div className="mb-5 flex flex-wrap items-end gap-3">
                      <Field
                        label="Colourway name"
                        value={colorway.name}
                        onChange={(e) => setColorway({ name: e.target.value })}
                        className="min-w-48 flex-1"
                      />
                      <Field
                        label="Stock"
                        type="number"
                        min="0"
                        value={colorway.stock}
                        onChange={(e) => setColorway({ stock: Math.max(0, Number(e.target.value)) })}
                        className="w-24 shrink-0 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${colorway.name} from this product?`))
                            removeColorway(colorIndex)
                        }}
                        className="btn-outline shrink-0 border-clay/30 px-3.5 py-2.5 text-clay-deep hover:border-clay hover:bg-clay hover:text-white"
                        aria-label={`Remove ${colorway.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mb-5 flex items-center gap-3 border border-ink/10 bg-blush-warm p-3">
                      <Swatch hex={colorway.hex} name={colorway.name} code={colorway.code} size={34} selected light={colorway.family === 'neutral'} />
                      <div className="min-w-0">
                        <p className="font-mono text-2xs">
                          {colorway.code} · {colorway.hex}
                        </p>
                        <p className="mt-0.5 font-mono text-2xs text-taupe">
                          Colour and code come from the shared dye card
                        </p>
                      </div>
                    </div>

                    <ImageManager
                      images={colorway.images}
                      colorwayCode={colorway.code}
                      onChange={(images) => setColorway({ images })}
                    />
                  </div>
                )}
              </>
            )}
          </Panel>
        </div>

        {/* -------------------------------------------------------- sidebar --- */}
        <div className="space-y-5">
          <Panel title="Visibility">
            <div className="space-y-4">
              <Toggle
                label="Published"
                hint={draft.published ? 'Live on the storefront' : 'Hidden from shoppers'}
                checked={draft.published}
                onChange={(published) => set({ published })}
              />
              <Toggle
                label="Feature on homepage"
                hint="Appears in the four-up on the home page"
                checked={draft.featured}
                onChange={(featured) => set({ featured })}
              />
              <div className="space-y-3 border-t border-ink/10 pt-4">
                <Checkbox
                  label="Wears without pins"
                  checked={!!draft.pinless}
                  onChange={(pinless) => set({ pinless })}
                />
                <Checkbox
                  label="Made to order"
                  hint="Ships in 12–16 days, final sale"
                  checked={!!draft.madeToOrder}
                  onChange={(madeToOrder) => set({ madeToOrder })}
                />
                <Checkbox
                  label="Small batch"
                  hint="Warns that pieces vary by lot"
                  checked={!!draft.smallBatch}
                  onChange={(smallBatch) => set({ smallBatch })}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Pricing">
            <div className="space-y-4">
              <Field
                label="Selling price (₹)"
                type="number"
                min="0"
                value={draft.price}
                onChange={(e) => set({ price: Number(e.target.value) })}
                className="font-mono"
              />
              <Field
                label="List price / MRP (₹)"
                type="number"
                min="0"
                value={draft.mrp}
                onChange={(e) => set({ mrp: Number(e.target.value) })}
                className="font-mono"
                hint="Leave equal to price for no discount badge"
              />
              <div className="border-t border-ink/10 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="spec-key">Shown as</span>
                  <span className="font-mono text-sm">
                    {money(draft.price)}
                    {discountPct(draft.price, draft.mrp) > 0 && (
                      <span className="ml-2 text-rose">−{discountPct(draft.price, draft.mrp)}%</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Card preview">
            {draft.colorways[0]?.images[0] ? (
              <div>
                <img
                  src={draft.colorways[0].images[0]}
                  alt=""
                  className="aspect-[3/4] w-full bg-blush-warm object-cover"
                />
                <p className="display-sm mt-3 text-[15px]">{draft.name || 'Untitled'}</p>
                <p className="mt-1 font-mono text-2xs uppercase tracking-[0.1em] text-taupe">
                  {draft.fabric}
                  {draft.gsm > 0 && ` · ${draft.gsm} GSM`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-taupe">Add an image to see the card preview.</p>
            )}
          </Panel>

          <Panel title="Sales history">
            <dl className="space-y-2.5 text-sm">
              <Row k="Units sold" v={draft.sold?.toLocaleString('en-IN') ?? 0} />
              <Row k="Rating" v={draft.rating ? draft.rating.toFixed(1) : '—'} />
              <Row k="Reviews" v={draft.reviewCount?.toLocaleString('en-IN') ?? 0} />
              <Row k="Stock" v={stockOf(draft)} />
            </dl>
            <p className="mt-3 font-mono text-2xs leading-relaxed text-taupe">
              Read-only — these come from orders and reviews, not from this form.
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink/65">{k}</dt>
      <dd className="font-mono tabular-nums">{v}</dd>
    </div>
  )
}

function NoteList({ notes = [], onChange }) {
  const [value, setValue] = useState('')
  return (
    <div>
      <ul className="mb-2 space-y-2">
        {notes.map((n, i) => (
          <li key={i} className="flex items-start gap-2 border border-ink/10 bg-blush-warm px-3 py-2">
            <span className="flex-1 text-sm leading-relaxed">{n}</span>
            <button
              type="button"
              onClick={() => onChange(notes.filter((_, j) => j !== i))}
              className="mt-0.5 shrink-0 text-taupe hover:text-clay"
              aria-label={`Remove “${n}”`}
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!value.trim()) return
          onChange([...notes, value.trim()])
          setValue('')
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Grips without pins on most fabrics"
          className="field-boxed text-sm"
          aria-label="New selling point"
        />
        <button type="submit" className="btn-outline shrink-0 px-3.5 py-2.5">
          <Plus size={15} />
        </button>
      </form>
    </div>
  )
}
