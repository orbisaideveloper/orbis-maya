import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAuthStore } from '../src/auth/store'

function setup() {
  let callback: (event: string, session: object | null) => void = () => undefined
  const user = { id: 'user-one', email: 'one@example.com' }
  const api = {
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    onAuthStateChange: vi.fn((cb) => { callback = cb; return { data: { subscription: { unsubscribe } } } }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  }
  const unsubscribe = vi.fn()
  const store = createAuthStore({ auth: api } as unknown as SupabaseClient)
  return { store, api, user, unsubscribe, event: (session: object | null) => callback('SIGNED_IN', session) }
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }
afterEach(() => vi.useRealTimers())

describe('Authenticated device session', () => {
  it('fails closed without configuration and never invokes account APIs', async () => {
    const store = createAuthStore(null)
    const stop = store.subscribe(vi.fn())
    await store.verify()
    expect(store.getSnapshot().phase).toBe('unconfigured')
    expect(await store.submit('login', '', '', '')).toBe('failed')
    expect(await store.logout()).toBe('failed')
    stop()
  })
  it('verifies restoration, shares one SDK listener and disposes on the last subscriber', async () => {
    const { store, api, user, unsubscribe } = setup()
    const change = vi.fn()
    const stop = store.subscribe(change)
    const second = store.subscribe(vi.fn())
    await flush()
    expect(store.getSnapshot()).toEqual({ phase: 'signed-in', user })
    expect(api.onAuthStateChange).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenCalled()
    stop(); expect(unsubscribe).not.toHaveBeenCalled()
    second(); expect(unsubscribe).toHaveBeenCalledOnce()
    const restart = store.subscribe(vi.fn()); await flush(); restart()
    expect(api.onAuthStateChange).toHaveBeenCalledTimes(2)
  })
  it.each([
    { name: 'AuthSessionMissingError' }, { name: 'AuthApiError', status: 401 },
    { name: 'AuthApiError', status: 403 },
  ])('rejects missing or invalid sessions: %j', async (error) => {
    const { store, api } = setup()
    api.getUser.mockResolvedValue({ data: { user: null }, error })
    await store.verify(); expect(store.getSnapshot().phase).toBe('signed-out')
  })
  it('treats a successful response without a user as signed out', async () => {
    const { store, api } = setup()
    api.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await store.verify(); expect(store.getSnapshot().phase).toBe('signed-out')
  })
  it('hides identity on service failure and thrown errors', async () => {
    const { store, api } = setup()
    api.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthApiError', status: 503 } })
    await store.verify(); expect(store.getSnapshot()).toEqual({ phase: 'error', user: null })
    api.getUser.mockRejectedValue(new Error('private provider detail'))
    await store.verify(); expect(store.getSnapshot().phase).toBe('error')
  })
  it('does not restore an old user after logout or unmount while verification is pending', async () => {
    const { store, api, event, user } = setup()
    let resolve!: (value: object) => void
    api.getUser.mockReturnValue(new Promise((done) => { resolve = done }))
    const stop = store.subscribe(vi.fn())
    event(null)
    resolve({ data: { user }, error: null }); await flush()
    expect(store.getSnapshot().phase).toBe('signed-out')
    const pending = store.verify(); stop()
    await pending
    expect(store.getSnapshot().phase).toBe('checking')
  })
  it('verifies refreshed tokens outside the synchronous auth callback', async () => {
    vi.useFakeTimers()
    const { store, api, event } = setup()
    const stop = store.subscribe(vi.fn()); await flush()
    event({}); expect(store.getSnapshot().phase).toBe('checking')
    expect(api.getUser).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(store.getSnapshot().phase).toBe('signed-in')
    event({}); stop(); await vi.advanceTimersByTimeAsync(0)
    expect(api.getUser).toHaveBeenCalledTimes(2)
  })
  it('bounds stalled identity verification', async () => {
    vi.useFakeTimers()
    const { store, api } = setup()
    api.getUser.mockReturnValue(new Promise(() => undefined))
    const request = store.verify()
    await vi.advanceTimersByTimeAsync(10000); await request
    expect(store.getSnapshot().phase).toBe('error')
  })
  it('signs in through shared Auth and validates the returned user', async () => {
    const { store, api } = setup()
    expect(await store.submit('login', 'one@example.com', 'password', '')).toBe('done')
    expect(api.signInWithPassword).toHaveBeenCalledWith({ email: 'one@example.com', password: 'password' })
    api.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect(await store.submit('login', 'one@example.com', 'password', '')).toBe('failed')
  })
  it('creates only an Auth account and handles confirmation without claiming a session', async () => {
    const { store, api } = setup()
    expect(await store.submit('signup', 'one@example.com', 'password', 'Name')).toBe('confirm')
    expect(api.signUp).toHaveBeenCalledWith({ email: 'one@example.com', password: 'password', options: { emailRedirectTo: 'http://localhost:3000/#/account', data: { display_name: 'Name' } } })
    api.signUp.mockResolvedValue({ data: { session: {} }, error: null })
    expect(await store.submit('signup', 'one@example.com', 'password', 'Name')).toBe('done')
  })
  it('returns safe failures for rejected credentials, network errors and timeouts', async () => {
    const { store, api } = setup()
    api.signInWithPassword.mockResolvedValue({ data: {}, error: new Error('secret') })
    expect(await store.submit('login', 'one@example.com', 'password', '')).toBe('failed')
    api.signUp.mockRejectedValue(new Error('secret'))
    expect(await store.submit('signup', 'one@example.com', 'password', '')).toBe('failed')
    vi.useFakeTimers(); api.signUp.mockReturnValue(new Promise(() => undefined))
    const attempt = store.submit('signup', 'one@example.com', 'password', '')
    await vi.advanceTimersByTimeAsync(10000)
    expect(await attempt).toBe('failed')
  })
  it('signs out this device, clears visible identity and reports failures safely', async () => {
    const { store, api } = setup()
    await store.verify()
    expect(await store.logout()).toBe('done')
    expect(api.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(store.getSnapshot()).toEqual({ phase: 'signed-out', user: null })
    api.signOut.mockResolvedValue({ error: new Error('private') })
    expect(await store.logout()).toBe('failed')
    api.signOut.mockRejectedValue(new Error('private'))
    expect(await store.logout()).toBe('failed')
    expect(store.getSnapshot()).toEqual({ phase: 'error', user: null })
  })
})
