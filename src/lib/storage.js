import { supabase, isConfigured } from './supabase'

/**
 * Product photo uploads, into the `product-images` bucket.
 *
 * Public read, admin-only write — enforced by storage policies in
 * supabase/migrations/0006, not by this file. If you are not an admin these
 * calls fail server-side.
 */

export const BUCKET = 'product-images'
export const MAX_BYTES = 5 * 1024 * 1024
export const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml'

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
])

const prettyBytes = (n) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`

/** Checked here as well as server-side so the user hears about it instantly. */
export function validateFile(file) {
  if (!ALLOWED.has(file.type)) {
    return `${file.name} is a ${file.type || 'unknown type'}. Use JPEG, PNG, WebP, AVIF or SVG.`
  }
  if (file.size > MAX_BYTES) {
    return `${file.name} is ${prettyBytes(file.size)}. The limit is 5 MB — try exporting it smaller.`
  }
  return null
}

/**
 * Builds the object path. Grouping by product and colourway means the bucket
 * stays browsable in the Supabase dashboard, and a random suffix means
 * re-uploading a file called IMG_1234.jpg never silently replaces another.
 */
const objectPath = (productId, colorwayCode, file) => {
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'jpg').toLowerCase()
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${productId}/${colorwayCode}/${stamp}-${rand}.${ext}`
}

/** Uploads one file and returns its public URL. */
export async function uploadImage(file, { productId, colorwayCode }) {
  if (!isConfigured) throw new Error('Supabase is not configured.')
  const problem = validateFile(file)
  if (problem) throw new Error(problem)

  const path = objectPath(productId, colorwayCode, file)
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    // Storage returns a generic message on a policy denial; say what it means.
    if (/policy|unauthorized|violates/i.test(error.message || '')) {
      throw new Error(
        'Storage refused the upload. Your account needs to be in the admins table, and migration 0006 must have run.'
      )
    }
    if (/bucket not found/i.test(error.message || '')) {
      throw new Error(
        `The "${BUCKET}" bucket does not exist yet — run supabase/migrations/0006_image_storage.sql.`
      )
    }
    throw new Error(error.message || 'Upload failed')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/** Uploads several, reporting progress per file rather than all-or-nothing. */
export async function uploadImages(files, target, onProgress) {
  const urls = []
  const failures = []
  let done = 0
  for (const file of files) {
    try {
      const { url } = await uploadImage(file, target)
      urls.push(url)
    } catch (err) {
      failures.push(err.message)
    }
    done += 1
    onProgress?.({ done, total: files.length })
  }
  return { urls, failures }
}

/** True for URLs we host, so the UI can offer to delete the underlying file. */
export const isUploadedUrl = (url) =>
  typeof url === 'string' && url.includes(`/storage/v1/object/public/${BUCKET}/`)

/** Recovers the object path from a public URL, for deletion. */
export const pathFromUrl = (url) => {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

/**
 * Removes the file behind an uploaded URL. Best-effort: an orphaned object costs
 * a few KB, whereas failing the whole edit because a cleanup failed would be
 * worse. Nothing calls this for URLs we do not host.
 */
export async function deleteUploadedImage(url) {
  if (!isConfigured || !isUploadedUrl(url)) return false
  const path = pathFromUrl(url)
  if (!path) return false
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.warn('[Hijabisaura] Could not remove stored file:', error.message)
    return false
  }
  return true
}
