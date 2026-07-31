import { useState } from 'react'
import { Star, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { submitReviewRemote } from '../lib/api'
import { Field, Select } from './ui'
import cx from '../lib/cx'

/**
 * Lets a customer leave a review.
 *
 * Nothing submitted here appears on the site until you approve it in
 * Admin → Reviews: the server forces published = false and verified = false, so
 * this cannot be used to post straight onto a product page.
 *
 * Hand-rolled rather than react-hook-form + Zod on purpose — the product page is
 * in the eager bundle, and pulling the validation stack in for four fields would
 * cost every visitor ~22 KB they do not need.
 */
export default function ReviewForm({ product, onDone }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [author, setAuthor] = useState('')
  const [city, setCity] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [colorway, setColorway] = useState(product.colorways[0]?.code || '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState({})

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!rating) next.rating = 'Pick a rating first.'
    if (body.trim().length < 10) next.body = 'A sentence or two, so it is useful to someone else.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      const res = await submitReviewRemote({
        product_id: product.id,
        author: author.trim(),
        city: city.trim(),
        rating,
        title: title.trim(),
        body: body.trim(),
        colorway_code: colorway,
      })
      setDone(true)
      toast.success(res?.message || 'Thank you — we read every review before it goes up.')
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Could not send that just now. Try again in a moment?')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="flex gap-3.5 border border-rose/30 bg-rose-wash p-6">
        <Check size={18} className="mt-0.5 shrink-0 text-rose-deep" />
        <div>
          <p className="display-sm text-base text-rose-deep">Thank you</p>
          <p className="mt-1.5 text-sm leading-relaxed text-rose-deep/80">
            We read every review before it goes up, so it may be a day or two before you see it here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border border-ink/12 bg-white p-6">
      <h3 className="display-sm text-lg">Wore this one? Tell the next person.</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
        Especially useful: how it actually fell, whether it needed a cap, and how it washed.
      </p>

      <div className="mt-5">
        <span className="label">Rating</span>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setRating(n)
                setErrors((e) => ({ ...e, rating: undefined }))
              }}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} out of 5`}
              aria-pressed={rating === n}
              className="p-1"
            >
              <Star
                size={22}
                strokeWidth={1.5}
                className={cx(
                  'transition-colors',
                  (hover || rating) >= n ? 'text-gold' : 'text-ink/20'
                )}
                fill={(hover || rating) >= n ? 'currentColor' : 'none'}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 font-mono text-2xs text-taupe">{rating} of 5</span>
          )}
        </div>
        {errors.rating && (
          <span className="mt-1 block font-mono text-2xs text-clay-deep">{errors.rating}</span>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Your name (optional)"
          placeholder="Leave blank to post anonymously"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <Field
          label="City (optional)"
          placeholder="Chennai"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        {product.colorways.length > 1 && (
          <Select
            label="Which colourway?"
            value={colorway}
            onChange={(e) => setColorway(e.target.value)}
            className="sm:col-span-2"
          >
            {product.colorways.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} · {c.code}
              </option>
            ))}
          </Select>
        )}
        <Field
          label="Headline (optional)"
          placeholder="Fell exactly as described"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="sm:col-span-2"
        />
        <Field
          as="textarea"
          label="Your review"
          rows={4}
          placeholder="How did it fall? Did you need a cap under it? How has it washed?"
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setErrors((er) => ({ ...er, body: undefined }))
          }}
          error={errors.body}
          className="sm:col-span-2"
        />
      </div>

      <button type="submit" disabled={busy} className="btn-ink mt-5">
        {busy ? 'Sending…' : 'Send review'}
      </button>

      <p className="mt-3 font-mono text-2xs leading-relaxed text-taupe">
        We publish reviews as written, good and bad, once we have checked they are real.
      </p>
    </form>
  )
}
