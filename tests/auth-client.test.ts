import { afterEach, expect, it, vi } from 'vitest'
import { createAuthClient } from '../src/auth/client'
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ auth: {} })) }))
import { createClient } from '@supabase/supabase-js'
afterEach(() => vi.clearAllMocks())
it('requires both configuration values', () => {
  expect(createAuthClient(undefined, 'key')).toBeNull()
  expect(createAuthClient('https://example.supabase.co', undefined)).toBeNull()
})
it.each(['invalid', 'http://example.com', 'https://user@example.com', 'https://:password@example.com', 'https://example.com?query=1', 'https://example.com#fragment', 'https://example.com/path'])('rejects unsafe endpoints: %s', (url) => {
  expect(createAuthClient(url, 'sb_publishable_public')).toBeNull()
})
it.each(['bad-key', 'header.' + btoa(JSON.stringify({ role: 'service_role' })) + '.signature', 'sb_secret_private'])('rejects privileged or invalid keys', (key) => {
  expect(createAuthClient('https://example.supabase.co', key)).toBeNull()
})
it.each(['sb_publishable_public', 'header.' + btoa(JSON.stringify({ role: 'anon' })) + '.signature'])('uses public configuration and device-scoped SDK persistence', (key) => {
  expect(createAuthClient('https://example.supabase.co', key)).not.toBeNull()
  expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: 'orbis-maya-auth-v1' } })
})
