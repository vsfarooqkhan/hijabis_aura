/**
 * UPI deep links.
 *
 * The string built here is the real NPCI intent format, so the QR rendered from
 * it at checkout scans in GPay / PhonePe / Paytm and opens with the amount and
 * note pre-filled. Nothing is captured client-side — the customer pays, then
 * submits the 12-digit UTR, and an admin verifies it against the bank
 * statement. That verification step is where the backend will plug in.
 */

export const buildUpiLink = ({ vpa, name, amount, orderId, note }) => {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: note || `Hijabisaura ${orderId}`,
  })
  if (orderId) params.set('tr', orderId)
  return `upi://pay?${params.toString()}`
}

export const UPI_APPS = [
  { key: 'gpay', label: 'Google Pay', scheme: 'tez://upi/pay' },
  { key: 'phonepe', label: 'PhonePe', scheme: 'phonepe://pay' },
  { key: 'paytm', label: 'Paytm', scheme: 'paytmmp://pay' },
  { key: 'bhim', label: 'BHIM', scheme: 'upi://pay' },
]

export const buildAppLink = (app, args) =>
  `${app.scheme}?${buildUpiLink(args).split('?')[1]}`

/** UTR / UPI reference numbers are 12 digits. */
export const isValidUtr = (v) => /^\d{12}$/.test(String(v || '').trim())

export const isValidPincode = (v) => /^[1-9]\d{5}$/.test(String(v || '').trim())

export const isValidPhone = (v) => /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').slice(-10))
