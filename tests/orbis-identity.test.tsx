import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OrbisIdentity } from '../src/auth/OrbisIdentity'
import { loadOrbisIdentity } from '../src/auth/orbis-identity'
import { setLocale } from '../src/i18n'

const auth = vi.hoisted(() => ({ available: true, getSession: vi.fn() }))
vi.mock('../src/auth/client', () => ({ get authClient() { return auth.available ? { auth: { getSession: auth.getSession } } : null } }))
const customer = { orbisIdentityId: '11111111-1111-7111-8111-111111111111', displayId: 'ORB-U-23456789' }
const body = { version: 'orbis.customer.v1', customer }
const signal = () => new AbortController().signal
beforeEach(() => {
  setLocale('bn'); auth.available = true
  auth.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: 'auth-a' }, access_token: 'test-access' } }, error: null })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('canonical Orbis identity session boundary', () => {
  it('requests the server-issued ID with the existing session and no password or metadata', async () => {
    const abort = signal()
    expect(await loadOrbisIdentity('auth-a', abort)).toBe(customer.displayId)
    expect(fetch).toHaveBeenCalledWith('https://orbis-admin-staging.onrender.com/api/v1/customer/session', {
      headers: { authorization: 'Bearer test-access' }, credentials: 'omit', redirect: 'error', cache: 'no-store', signal: abort,
    })
  })
  it('does not contact the server without configured Auth', async () => {
    auth.available = false
    await expect(loadOrbisIdentity('auth-a', signal())).rejects.toThrow('ORBIS_ID_UNAVAILABLE')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([
    { data: { session: null }, error: null },
    { data: { session: { user: { id: 'auth-a' } } }, error: new Error('private') },
    { data: { session: { user: { id: 'other-user' } } }, error: null },
  ])('rejects missing, failed or changed account sessions', async value => {
    auth.getSession.mockResolvedValue(value)
    await expect(loadOrbisIdentity('auth-a', signal())).rejects.toThrow('ORBIS_ID_UNAVAILABLE')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([401, 403, 503])('does not accept HTTP %s', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private', { status })))
    await expect(loadOrbisIdentity('auth-a', signal())).rejects.toThrow('ORBIS_ID_UNAVAILABLE')
  })
  it('rejects oversized responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x'.repeat(65537))))
    await expect(loadOrbisIdentity('auth-a', signal())).rejects.toThrow('ORBIS_ID_UNAVAILABLE')
  })
  it.each([
    null, 'text', {}, { version: 'wrong' }, { version: body.version },
    { version: body.version, customer: null }, { version: body.version, customer: 'text' },
    { version: body.version, customer: {} },
    { ...body, customer: { ...customer, orbisIdentityId: 1 } },
    { ...body, customer: { ...customer, orbisIdentityId: 'auth-a' } },
    { ...body, customer: { orbisIdentityId: customer.orbisIdentityId } },
    { ...body, customer: { ...customer, displayId: 1 } },
    { ...body, customer: { ...customer, displayId: 'client-generated' } },
  ])('rejects malformed or noncanonical identity data', async value => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(value)))
    await expect(loadOrbisIdentity('auth-a', signal())).rejects.toThrow('ORBIS_ID_UNAVAILABLE')
  })
  it('does not interpret invalid JSON as identity', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')))
    await expect(loadOrbisIdentity('auth-a', signal())).rejects.toThrow()
  })
})

describe('Orbis ID account display', () => {
  it('loads the real default session boundary and displays its ID', async () => {
    render(<OrbisIdentity userId="auth-a" />)
    expect(screen.getByText('Orbis ID যাচাই হচ্ছে…')).toBeInTheDocument()
    expect(await screen.findByText(customer.displayId)).toBeInTheDocument()
  })
  it.each([['en', 'Your Orbis ID'], ['hi', 'आपकी Orbis ID']] as const)('localizes the account ID in %s', async (locale, label) => {
    setLocale(locale); render(<OrbisIdentity userId="auth-a" load={vi.fn().mockResolvedValue(customer.displayId)} />)
    expect(await screen.findByText(customer.displayId)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: label })).toBeInTheDocument()
  })
  it('keeps sign-in separate from an identity outage and supports retry', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('private token')).mockResolvedValue(customer.displayId)
    render(<OrbisIdentity userId="auth-a" load={load} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Orbis ID আবার যাচাই করুন' }))
    expect(await screen.findByText(customer.displayId)).toBeInTheDocument()
    expect(screen.queryByText(/private/)).not.toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })
  it.each(['resolve', 'reject'])('aborts on unmount and ignores late %s', async mode => {
    let resolve!: (value: string) => void, reject!: (error: Error) => void
    const load = vi.fn<typeof loadOrbisIdentity>(() => new Promise<string>((done, fail) => { resolve = done; reject = fail }))
    const view = render(<OrbisIdentity userId="auth-a" load={load} />)
    view.unmount()
    expect(load.mock.calls[0][1].aborted).toBe(true)
    await act(async () => { if (mode === 'resolve') resolve(customer.displayId); else reject(new Error('late')) })
    expect(screen.queryByText(customer.displayId)).not.toBeInTheDocument()
  })
  it('aborts an unavailable request after fifteen seconds', async () => {
    vi.useFakeTimers()
    const load = vi.fn((user: string, abort: AbortSignal) => new Promise<string>((_resolve, reject) => {
      expect(user).toBe('auth-a')
      abort.addEventListener('abort', () => reject(new Error('timeout')), { once: true })
    }))
    render(<OrbisIdentity userId="auth-a" load={load} />)
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(screen.getByText('Orbis ID এখন পাওয়া যাচ্ছে না।')).toBeInTheDocument()
    expect(load.mock.calls[0][1].aborted).toBe(true)
  })
})
