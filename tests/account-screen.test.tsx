import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountScreen from '../src/auth/AccountScreen'
import App from '../src/App'
import { setLocale } from '../src/i18n'

const mocked = vi.hoisted(() => ({
  state: { phase: 'signed-out', user: null } as { phase: string; user: { id: string; email: string } | null },
  submit: vi.fn(), logout: vi.fn(), verify: vi.fn(),
}))
vi.mock('../src/auth/store', () => ({ useAuth: () => mocked.state, authStore: { submit: mocked.submit, logout: mocked.logout, verify: mocked.verify } }))
const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
function send() { fireEvent.submit(screen.getByLabelText('ইমেইল').closest('form')!) }
function signup() { fireEvent.click(screen.getByRole('button', { name: 'অ্যাকাউন্ট তৈরি করুন' })) }
beforeEach(() => {
  setLocale('bn'); window.history.replaceState(null, '', '/')
  mocked.state = { phase: 'signed-out', user: null }
  mocked.submit.mockReset().mockResolvedValue('done')
  mocked.logout.mockReset().mockResolvedValue('done')
  mocked.verify.mockReset()
})
afterEach(cleanup)

describe('Account UI', () => {
  it.each(['checking', 'unconfigured'])('does not expose credentials while %s', (phase) => {
    mocked.state.phase = phase; render(<AccountScreen />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByLabelText('পাসওয়ার্ড')).not.toBeInTheDocument()
  })
  it('offers safe verification recovery', () => {
    mocked.state.phase = 'error'; render(<AccountScreen />)
    expect(screen.getByRole('alert')).toHaveTextContent('অ্যাকাউন্ট যাচাই করা যায়নি')
    fireEvent.click(screen.getByRole('button', { name: 'আবার চেষ্টা করুন' }))
    expect(mocked.verify).toHaveBeenCalledOnce()
  })
  it.each([
    ['bad', 'password'], ['user@example.com', ''], ['user@.example.com', 'password'],
  ])('validates login input before any request: %s', (email, password) => {
    render(<AccountScreen />); fill('ইমেইল', email); fill('পাসওয়ার্ড', password); send()
    expect(screen.getByRole('alert')).toHaveTextContent('সঠিক ইমেইল')
    expect(mocked.submit).not.toHaveBeenCalled()
  })
  it('rejects non-text credential form values before authentication', () => {
    const get = vi.spyOn(FormData.prototype, 'get').mockReturnValue(new File(['x'], 'x.txt'))
    try {
      render(<AccountScreen />); send()
      expect(mocked.submit).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    } finally { get.mockRestore() }
  })
  it.each([
    ['', 'long-password', 'long-password'], ['Name', 'short', 'short'],
    ['Name', 'long-password', 'different'],
  ])('validates signup name, password length and matching confirmation', (name, password, confirmation) => {
    render(<AccountScreen />); signup()
    fill('নাম', name); fill('ইমেইল', 'user@example.com'); fill('পাসওয়ার্ড', password); fill('পাসওয়ার্ড আবার লিখুন', confirmation); send()
    expect(mocked.submit).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  it('submits a trimmed login, prevents duplicates and clears credentials afterwards', async () => {
    let resolve!: (outcome: string) => void
    mocked.submit.mockReturnValue(new Promise((done) => { resolve = done }))
    render(<AccountScreen />); fill('ইমেইল', ' user@example.com '); fill('পাসওয়ার্ড', 'private-password'); send(); send()
    expect(mocked.submit).toHaveBeenCalledOnce()
    expect(mocked.submit).toHaveBeenCalledWith('login', 'user@example.com', 'private-password', '')
    expect(screen.getAllByRole('button', { name: 'অপেক্ষা করুন…' })[0]).toBeDisabled()
    await act(async () => resolve('done'))
    expect(screen.getByLabelText('পাসওয়ার্ড')).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('shows generic credential failures without exposing backend detail', async () => {
    mocked.submit.mockResolvedValue('failed')
    render(<AccountScreen />); fill('ইমেইল', 'user@example.com'); fill('পাসওয়ার্ড', 'password'); send()
    expect(await screen.findByRole('alert')).toHaveTextContent('অ্যাকাউন্ট যাচাই করা যায়নি')
  })
  it('handles signup confirmation and clears form data when switching modes', async () => {
    mocked.submit.mockResolvedValue('confirm')
    render(<AccountScreen />); signup()
    fill('নাম', ' Name '); fill('ইমেইল', 'user@example.com'); fill('পাসওয়ার্ড', 'long-password'); fill('পাসওয়ার্ড আবার লিখুন', 'long-password'); send()
    expect(await screen.findByRole('status')).toHaveTextContent('confirmation')
    expect(mocked.submit).toHaveBeenCalledWith('signup', 'user@example.com', 'long-password', 'Name')
    fireEvent.click(screen.getByRole('button', { name: 'লগইন' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('নাম')).not.toBeInTheDocument()
  })
  it('shows verified identity and allows logout with an in-flight state', async () => {
    mocked.state = { phase: 'signed-in', user: { id: 'user-a', email: 'user@example.com' } }
    let resolve!: (outcome: string) => void
    mocked.logout.mockReturnValue(new Promise((done) => { resolve = done }))
    render(<AccountScreen />)
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'লগআউট' }))
    expect(screen.getByRole('button', { name: 'অপেক্ষা করুন…' })).toBeDisabled()
    await act(async () => resolve('done'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('reports logout failures safely', async () => {
    mocked.state = { phase: 'signed-in', user: { id: 'user-a', email: 'user@example.com' } }
    mocked.logout.mockResolvedValue('failed'); render(<AccountScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'লগআউট' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('অ্যাকাউন্ট যাচাই করা যায়নি')
  })
  it.each([
    ['en', 'Sign in', 'Email', 'Password'], ['hi', 'लॉगिन', 'ईमेल', 'पासवर्ड'],
  ] as const)('provides usable account forms in %s', (language, login, email, password) => {
    setLocale(language); render(<AccountScreen />)
    expect(screen.getByLabelText(email)).toBeInTheDocument()
    expect(screen.getByLabelText(password)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: login })).toHaveLength(2)
  })
})

describe('Protected navigation', () => {
  it.each(['/dream', '/astro', '/chat', '/history'])('opens the feature only for verified users: %s', async (path) => {
    mocked.state = { phase: 'signed-in', user: { id: 'user-a', email: 'user@example.com' } }
    window.history.replaceState(null, '', `/#${path}`); render(<App />)
    expect(await screen.findByText(path === '/history' ? 'স্থানীয় history পড়া বা পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।' : path === '/dream' ? 'Draft পড়া বা রাখা যায়নি। লেখা হারানোর আগে আবার save করুন।' : 'শীঘ্রই আসছে')).toBeInTheDocument()
    expect(screen.queryByLabelText('পাসওয়ার্ড')).not.toBeInTheDocument()
  })
  it('opens the explicit account route and translates document titles', async () => {
    window.history.replaceState(null, '', '/#/account'); setLocale('hi'); render(<App />)
    expect(screen.getByRole('heading', { name: 'ORBIS अकाउंट' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('hi')
    expect(document.title).toBe('ORBIS Maya · ORBIS अकाउंट')
  })
})
