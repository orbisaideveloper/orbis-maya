import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import HistoryScreen from '../src/HistoryScreen'
import App from '../src/App'
import { setLocale } from '../src/i18n'

const mock = vi.hoisted(() => ({ list: vi.fn(), clear: vi.fn(), remove: vi.fn(), create: vi.fn(), state: { phase: 'signed-in', user: { id: 'alice', email: 'a@example.com' } } as { phase: string; user: { id: string; email: string } | null } }))
vi.mock('../src/storage/history', () => ({ createLocalHistory: mock.create }))
vi.mock('../src/auth/store', () => ({ useAuth: () => mock.state, authStore: {} }))
const record = { id: 'entry', kind: 'dream', title: 'নদীর স্বপ্ন', content: 'Private reflection\nSecond line', createdAt: 1700000000000 }
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name, exact: true }))
const confirmation = () => screen.getByRole('group', { name: 'মুছে দিন' })
beforeEach(() => {
  vi.resetAllMocks(); setLocale('bn')
  mock.list.mockResolvedValue([record]); mock.clear.mockResolvedValue(undefined); mock.remove.mockResolvedValue(undefined)
  mock.create.mockReturnValue({ list: mock.list, clear: mock.clear, repository: () => ({ remove: mock.remove }) })
  mock.state = { phase: 'signed-in', user: { id: 'alice', email: 'a@example.com' } }
  window.history.replaceState(null, '', '/#/history')
})
afterEach(cleanup)

it('announces loading, displays local records and provides native expandable text', async () => {
  const pending = deferred<typeof record[]>()
  mock.list.mockReturnValue(pending.promise)
  render(<HistoryScreen userId="alice" />)
  expect(screen.getByRole('status')).toHaveTextContent('খোলা হচ্ছে')
  await act(async () => pending.resolve([record, { ...record, id: 'chat', kind: 'chat', title: 'Chat' }]))
  expect(mock.create).toHaveBeenCalledWith('alice')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  const summary = screen.getByText(record.title)
  expect(summary.tagName).toBe('SUMMARY')
  expect(summary.closest('details')).not.toHaveAttribute('open')
  fireEvent.click(summary)
  expect(summary.closest('details')).toHaveAttribute('open')
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByRole('link', { name: 'হোমে ফিরুন' })).toHaveAttribute('href', '#/')
})
it('cancels deletion without touching data then deletes only the chosen record', async () => {
  render(<HistoryScreen userId="alice" />); await screen.findByText(record.title)
  click('মুছুন '+record.title); expect(confirmation()).toHaveTextContent(record.title)
  click('বাতিল'); expect(mock.remove).not.toHaveBeenCalled(); expect(screen.queryByRole('group', { name: 'মুছে দিন' })).not.toBeInTheDocument()
  click('মুছুন '+record.title); mock.list.mockResolvedValue([])
  click('মুছে দিন')
  expect(await screen.findByRole('status')).toHaveTextContent('এখনও কোনো history নেই')
  expect(mock.remove).toHaveBeenCalledExactlyOnceWith(record.id)
  expect(mock.clear).not.toHaveBeenCalled()
})
it('confirms clearing this account, blocks duplicate clicks and clears after commit', async () => {
  const pending = deferred<void>(); mock.clear.mockReturnValue(pending.promise)
  render(<HistoryScreen userId="alice" />); await screen.findByText(record.title)
  click('সব history মুছুন'); expect(confirmation()).toHaveTextContent('এই account-এর')
  click('মুছে দিন'); click('অপেক্ষা করুন…')
  expect(mock.clear).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'বাতিল' })).toBeDisabled()
  expect(screen.getByText(record.title)).toBeInTheDocument()
  mock.list.mockResolvedValue([]); await act(async () => pending.resolve())
  expect(await screen.findByRole('status')).toHaveTextContent('এখনও কোনো history নেই')
  expect(screen.queryByRole('group', { name: 'মুছে দিন' })).not.toBeInTheDocument()
})
it('provides safe read error and retries successfully', async () => {
  mock.list.mockRejectedValueOnce(new Error('secret content'))
  render(<HistoryScreen userId="alice" />)
  expect(await screen.findByRole('alert')).not.toHaveTextContent('secret content')
  click('আবার চেষ্টা করুন'); await screen.findByText(record.title)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
it('preserves records after failed deletion and allows retry', async () => {
  mock.remove.mockRejectedValueOnce(new Error('private storage error'))
  render(<HistoryScreen userId="alice" />); await screen.findByText(record.title)
  click('মুছুন '+record.title); click('মুছে দিন')
  expect(await screen.findByRole('alert')).not.toHaveTextContent('private storage error')
  expect(screen.getByText(record.title, { selector: 'summary' })).toBeInTheDocument()
  mock.list.mockResolvedValue([]); click('মুছে দিন')
  expect(await screen.findByRole('status')).toHaveTextContent('এখনও কোনো history নেই')
})
it.each([['en', 'No history yet. Saved dreams and conversations will appear here.'], ['hi', 'अभी कोई इतिहास नहीं है। सहेजे गए सपने और बातचीत यहाँ दिखेंगे।']] as const)('translates empty history in %s', async (locale, empty) => {
  setLocale(locale); mock.list.mockResolvedValue([]); render(<HistoryScreen userId="alice" />)
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(empty))
})
it.each(['resolve', 'reject'] as const)('ignores late initial %s after unmount', async (outcome) => {
  const pending = deferred<typeof record[]>(); mock.list.mockReturnValue(pending.promise)
  const view = render(<HistoryScreen userId="alice" />); view.unmount()
  await act(async () => { if (outcome === 'resolve') pending.resolve([record]); else pending.reject(new Error('private')) })
  expect(screen.queryByText(record.title)).not.toBeInTheDocument()
})
it.each(['resolve', 'reject'] as const)('ignores late mutation %s after unmount', async (outcome) => {
  const pending = deferred<void>(); mock.clear.mockReturnValue(pending.promise)
  const view = render(<HistoryScreen userId="alice" />); await screen.findByText(record.title)
  click('সব history মুছুন'); click('মুছে দিন'); view.unmount()
  await act(async () => { if (outcome === 'resolve') pending.resolve(); else pending.reject(new Error('private')) })
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
it('remounts on account change and removes private UI on logout without clearing storage', async () => {
  const view = render(<App />); await screen.findByText(record.title)
  const pending = deferred<typeof record[]>()
  mock.list.mockReturnValue(pending.promise)
  mock.state = { phase: 'signed-in', user: { id: 'bob', email: 'b@example.com' } }
  view.rerender(<App />)
  expect(screen.queryByText(record.title)).not.toBeInTheDocument()
  await screen.findByText('খোলা হচ্ছে…')
  expect(mock.create).toHaveBeenLastCalledWith('bob')
  await act(async () => pending.resolve([{ ...record, id: 'bob', title: 'Bob record' }]))
  expect(screen.getByText('Bob record')).toBeInTheDocument()
  mock.state = { phase: 'signed-out', user: null }; view.rerender(<App />)
  expect(screen.queryByText('Bob record')).not.toBeInTheDocument()
  expect(within(screen.getByRole('main')).getByLabelText('ইমেইল')).toBeInTheDocument()
  expect(mock.clear).not.toHaveBeenCalled()
})
