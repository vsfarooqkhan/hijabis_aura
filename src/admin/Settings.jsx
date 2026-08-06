import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { Save, AlertTriangle, Instagram } from 'lucide-react'
import useStore from '../store/useStore'
import { buildUpiLink } from '../lib/upi'
import { Field, Select, Toggle } from '../components/ui'
import { PageHead, Panel } from './ui'

export default function Settings() {
  const stored = useStore((s) => s.settings)
  const saveSettings = useStore((s) => s.saveSettings)
  const [draft, setDraft] = useState(() => structuredClone(stored))

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored)
  const group = (key) => (patch) => setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }))
  const brand = group('brand')
  const payments = group('payments')
  const shipping = group('shipping')
  const returns = group('returns')
  const ops = group('ops')

  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!/^[\w.\-]{2,}@[\w\-]{2,}$/.test(draft.payments.upiVpa)) {
      toast.error('That UPI ID does not look valid — it should look like name@bank.')
      return
    }
    setSaving(true)
    try {
      await saveSettings(draft)
      toast.success('Settings saved — the storefront picks them up immediately')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const sampleUpi = buildUpiLink({
    vpa: draft.payments.upiVpa,
    name: draft.payments.upiPayeeName,
    amount: 999,
    orderId: 'HA-TEST',
  })

  return (
    <>
      <PageHead
        title="Settings"
        sub="Everything here is read live by the storefront"
        action={
          <button type="button" onClick={save} disabled={!dirty || saving} className="btn-ink px-5 py-2.5">
            <Save size={15} />
            {saving ? 'Saving…' : dirty ? 'Save settings' : 'Saved'}
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* --------------------------------------------------------- brand --- */}
        <Panel title="Brand" sub="Appears in the header, footer, invoices and page titles">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Store name"
              value={draft.brand.name}
              onChange={(e) => brand({ name: e.target.value })}
              className="sm:col-span-2"
              hint="Changing this renames the store everywhere"
            />
            <Field
              label="Tagline"
              value={draft.brand.tagline}
              onChange={(e) => brand({ tagline: e.target.value })}
              hint="Set in script under the logo"
            />
            <Field
              label="Promise line"
              value={draft.brand.promise}
              onChange={(e) => brand({ promise: e.target.value })}
              hint="Used in the footer and meta description"
            />
            <Field
              label="Instagram handle"
              value={draft.brand.instagram}
              onChange={(e) =>
                brand({
                  instagram: e.target.value.replace('@', ''),
                  instagramUrl: `https://instagram.com/${e.target.value.replace('@', '')}`,
                })
              }
              hint={draft.brand.instagramUrl}
            />
            <Field
              label="Support email"
              type="email"
              value={draft.brand.email}
              onChange={(e) => brand({ email: e.target.value })}
            />
            <Field
              label="Phone"
              value={draft.brand.phone}
              onChange={(e) => brand({ phone: e.target.value })}
            />
            <Field
              label="WhatsApp number"
              value={draft.brand.whatsapp}
              onChange={(e) => brand({ whatsapp: e.target.value.replace(/\D/g, '') })}
              className="font-mono"
              hint="Country code, no plus or spaces"
            />
            <Field
              as="textarea"
              label="Registered address"
              rows={2}
              value={draft.brand.address}
              onChange={(e) => brand({ address: e.target.value })}
              className="sm:col-span-2"
            />
            <Field
              label="GSTIN"
              value={draft.brand.gstin}
              onChange={(e) => brand({ gstin: e.target.value.toUpperCase() })}
              className="sm:col-span-2 font-mono"
            />
          </div>

          <a
            href={draft.brand.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em] text-gold-deep hover:text-ink"
          >
            <Instagram size={13} />
            Open @{draft.brand.instagram}
          </a>
        </Panel>

        {/* ------------------------------------------------------- payments --- */}
        <Panel title="Payments" sub="The UPI ID here is what the checkout QR encodes">
          <div className="mb-5 flex gap-3 border border-gold/30 bg-gold-wash p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-deep" />
            <p className="font-mono text-2xs leading-relaxed text-gold-deep">
              Replace the placeholder UPI ID with your real merchant VPA before taking live orders.
              Money goes wherever this points.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="UPI ID (VPA)"
              value={draft.payments.upiVpa}
              onChange={(e) => payments({ upiVpa: e.target.value.trim() })}
              className="font-mono"
              hint="name@bank"
            />
            <Field
              label="Payee name"
              value={draft.payments.upiPayeeName}
              onChange={(e) => payments({ upiPayeeName: e.target.value })}
              hint="Shown in the customer's payment app"
            />
            <Field
              label="Prepaid discount (%)"
              type="number"
              min="0"
              max="50"
              value={draft.payments.prepaidDiscountPct}
              onChange={(e) => payments({ prepaidDiscountPct: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="COD handling fee (₹)"
              type="number"
              min="0"
              value={draft.payments.codFee}
              onChange={(e) => payments({ codFee: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="COD minimum order (₹)"
              type="number"
              min="0"
              value={draft.payments.codMinOrder}
              onChange={(e) => payments({ codMinOrder: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="COD maximum order (₹)"
              type="number"
              min="0"
              value={draft.payments.codMaxOrder}
              onChange={(e) => payments({ codMaxOrder: Number(e.target.value) })}
              className="font-mono"
            />
          </div>

          <div className="mt-5 space-y-3.5 border-t border-ink/10 pt-4">
            <Toggle
              label="Accept UPI"
              hint="Shows the QR and app links at checkout"
              checked={draft.payments.upiEnabled}
              onChange={(upiEnabled) => payments({ upiEnabled })}
            />
            <Toggle
              label="Accept cash on delivery"
              hint="Off. The storefront shows UPI only, and the database refuses a COD order while this is off."
              checked={draft.payments.codEnabled}
              onChange={(codEnabled) => payments({ codEnabled })}
            />
            <Toggle
              label="Accept cards and net banking"
              hint="Needs a payment gateway — leave off until one is wired up"
              checked={draft.payments.cardsEnabled}
              onChange={(cardsEnabled) => payments({ cardsEnabled })}
            />
          </div>

          <div className="mt-5 flex items-start gap-4 border-t border-ink/10 pt-5">
            <div className="shrink-0 border border-ink/12 bg-white p-2.5">
              <QRCodeSVG value={sampleUpi} size={104} level="M" fgColor="#241A18" bgColor="#FFFFFF" />
            </div>
            <div className="min-w-0">
              <p className="spec-key mb-1.5">Live preview — ₹999 test</p>
              <p className="break-all font-mono text-2xs leading-relaxed text-taupe">{sampleUpi}</p>
              <p className="mt-2 font-mono text-2xs text-taupe">
                Scan it with your own UPI app to check the payee name before going live.
              </p>
            </div>
          </div>
        </Panel>

        {/* ------------------------------------------------------- shipping --- */}
        <Panel title="Shipping">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Free shipping above (₹)"
              type="number"
              min="0"
              value={draft.shipping.freeAbove}
              onChange={(e) => shipping({ freeAbove: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="Standard fee (₹)"
              type="number"
              min="0"
              value={draft.shipping.standardFee}
              onChange={(e) => shipping({ standardFee: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="Express fee (₹)"
              type="number"
              min="0"
              value={draft.shipping.expressFee}
              onChange={(e) => shipping({ expressFee: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="Standard window"
              value={draft.shipping.standardDays}
              onChange={(e) => shipping({ standardDays: e.target.value })}
            />
            <Field
              label="Express window"
              value={draft.shipping.expressDays}
              onChange={(e) => shipping({ expressDays: e.target.value })}
            />
            <Field
              as="textarea"
              label="Dispatch note"
              rows={2}
              value={draft.shipping.dispatchNote}
              onChange={(e) => shipping({ dispatchNote: e.target.value })}
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-5 border-t border-ink/10 pt-4">
            <Toggle
              label="Offer express delivery"
              hint="Off. Checkout shows express as a disabled option, and the database downgrades any express request to standard."
              checked={!!draft.shipping.expressEnabled}
              onChange={(expressEnabled) => shipping({ expressEnabled })}
            />
          </div>
        </Panel>

        {/* -------------------------------------------------------- returns --- */}
        <Panel title="Returns & operations">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Return window (days)"
              type="number"
              min="0"
              value={draft.returns.windowDays}
              onChange={(e) => returns({ windowDays: Number(e.target.value) })}
              className="font-mono"
            />
            <Field
              label="Low stock warning at"
              type="number"
              min="0"
              value={draft.ops.lowStockThreshold}
              onChange={(e) => ops({ lowStockThreshold: Number(e.target.value) })}
              className="font-mono"
              hint="Pieces across all colourways"
            />
            <Field
              as="textarea"
              label="Returns note"
              rows={2}
              value={draft.returns.note}
              onChange={(e) => returns({ note: e.target.value })}
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-5 border-t border-ink/10 pt-4">
            <Toggle
              label="Exchange only, no refunds"
              hint="Turn on if you stop refunding to source"
              checked={draft.returns.exchangeOnly}
              onChange={(exchangeOnly) => returns({ exchangeOnly })}
            />
          </div>
        </Panel>
      </div>
    </>
  )
}
