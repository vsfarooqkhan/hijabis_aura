import { createClient } from '@supabase/supabase-js'

/**
 * The Supabase client.
 *
 * The publishable key is *meant* to be public — it ships inside the JavaScript
 * bundle and every visitor can read it. What keeps the data safe is row level
 * security (see supabase/migrations/0002), not the secrecy of this key.
 *
 * Values come from .env.local in development and from the Vercel project's
 * environment variables in production. Vite only exposes vars prefixed VITE_.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isConfigured = Boolean(url && key)

if (!isConfigured) {
  // Better a loud console error than a silently empty shop.
  console.error(
    '[Hijabisaura] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Add them to .env.local locally, and to Vercel → Settings → Environment Variables ' +
      'for the deployed site (then redeploy).'
  )
}

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        // The admin session lives in localStorage and refreshes itself. There is
        // no customer login, so this only ever holds your own session.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

export default supabase
