import { initializeApp } from 'firebase/app'
import {
  getStorage, ref, uploadBytes, getBytes, deleteObject,
} from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)

/**
 * Product photo uploads into Firebase Storage's product-images folder.
 *
 * Public read access, admin-only write — enforced by storage security rules
 * in the Firebase console, not by this file. If you are not an admin these
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
 * stays organized, and a random suffix means re-uploading a file called
 * IMG_1234.jpg never silently replaces another.
 */
const objectPath = (productId, colorwayCode, file) => {
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'jpg').toLowerCase()
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${BUCKET}/${productId}/${colorwayCode}/${stamp}-${rand}.${ext}`
}

/** Uploads one file and returns its public URL. */
export async function uploadImage(file, { productId, colorwayCode }) {
  const problem = validateFile(file)
  if (problem) throw new Error(problem)

  const path = objectPath(productId, colorwayCode, file)
  const fileRef = ref(storage, path)

  try {
    await uploadBytes(fileRef, file, {
      contentType: file.type,
    })
  } catch (error) {
    if (/permission/i.test(error.message || '')) {
      throw new Error(
        'Storage refused the upload. Your account must have admin rights to upload images.'
      )
    }
    throw new Error(error.message || 'Upload failed')
  }

  // Firebase Storage URLs follow this pattern
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  const url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(path)}?alt=media`

  return { url, path }
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
  typeof url === 'string' && url.includes('firebasestorage.googleapis.com')

/** Recovers the object path from a public URL, for deletion. */
export const pathFromUrl = (url) => {
  if (!isUploadedUrl(url)) return null
  // URL pattern: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media
  const match = url.match(/\/o\/(.+?)\?/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

/**
 * Removes the file behind an uploaded URL. Best-effort: an orphaned object costs
 * a few KB, whereas failing the whole edit because a cleanup failed would be
 * worse. Nothing calls this for URLs we do not host.
 */
export async function deleteUploadedImage(url) {
  const path = pathFromUrl(url)
  if (!path) return false

  try {
    const fileRef = ref(storage, path)
    await deleteObject(fileRef)
    return true
  } catch (error) {
    console.warn('[Hijabisaura] Could not remove stored file:', error.message)
    return false
  }
}
