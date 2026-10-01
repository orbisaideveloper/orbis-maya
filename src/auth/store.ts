import type { SupabaseClient, User } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { authClient } from './client'

type AuthState = { phase: 'checking' | 'signed-out' | 'signed-in' | 'error' | 'unconfigured'; user: User | null }
type AuthOutcome = 'done' | 'confirm' | 'failed'

async function bounded<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 10000) })
  try { return await Promise.race([operation, deadline]) } finally { clearTimeout(timer!) }
}

export function createAuthStore(client: SupabaseClient | null) {
  let state: AuthState = { phase: client ? 'checking' : 'unconfigured', user: null }
  let revision = 0
  const listeners = new Set<() => void>()
  let stop: (() => void) | undefined
  let scheduled: ReturnType<typeof setTimeout> | undefined
  const publish = (next: AuthState) => { state = next; listeners.forEach((listener) => listener()) }

  async function verify() {
    if (!client) return
    const current = ++revision
    publish({ phase: 'checking', user: null })
    let next: AuthState
    try {
      const { data, error } = await bounded(client.auth.getUser())
      if (error && error.name !== 'AuthSessionMissingError' && error.status !== 401 && error.status !== 403) {
        next = { phase: 'error', user: null }
      } else {
        const user = error ? null : data.user
        next = { phase: user ? 'signed-in' : 'signed-out', user }
      }
    } catch { next = { phase: 'error', user: null } }
    if (current === revision) publish(next)
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    if (client && !stop) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        ++revision
        clearTimeout(scheduled)
        if (!session) publish({ phase: 'signed-out', user: null })
        else {
          publish({ phase: 'checking', user: null })
          scheduled = setTimeout(() => { void verify() }, 0)
        }
      })
      stop = () => data.subscription.unsubscribe()
      void verify()
    }
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        ++revision
        clearTimeout(scheduled)
        stop?.()
        stop = undefined
      }
    }
  }

  async function submit(mode: 'login' | 'signup', email: string, password: string, name: string): Promise<AuthOutcome> {
    if (!client) return 'failed'
    try {
      const result = await bounded(mode === 'login'
        ? client.auth.signInWithPassword({ email, password })
        : client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/#/account`, data: { display_name: name } } }))
      if (result.error) return 'failed'
      if (!result.data.session) return 'confirm'
      await verify()
      return state.phase === 'signed-in' ? 'done' : 'failed'
    } catch { return 'failed' }
  }

  async function logout(): Promise<AuthOutcome> {
    if (!client) return 'failed'
    ++revision
    clearTimeout(scheduled)
    publish({ phase: 'checking', user: null })
    try {
      const { error } = await bounded(client.auth.signOut({ scope: 'local' }))
      publish({ phase: error ? 'error' : 'signed-out', user: null })
      return error ? 'failed' : 'done'
    } catch { publish({ phase: 'error', user: null }); return 'failed' }
  }

  return { subscribe, getSnapshot: () => state, verify, submit, logout }
}

export const authStore = createAuthStore(authClient)
export function useAuth() { return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot) }
