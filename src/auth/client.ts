import { createClient } from '@supabase/supabase-js'

export function createAuthClient(url: string | undefined, key: string | undefined) {
  if (!url || !key) return null
  try {
    const endpoint = new URL(url)
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') return null
    const publicKey = key.startsWith('sb_publishable_') || JSON.parse(atob(key.split('.')[1])).role === 'anon'
    if (!publicKey) return null
    return createClient(endpoint.origin, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: 'orbis-maya-auth-v1' },
    })
  } catch {
    return null
  }
}

export const authClient = createAuthClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
