import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import DreamScreen from '../src/DreamScreen'
import { setLocale } from '../src/i18n'
import { MayaGatewayError } from '../src/ai/gateway'
const mock = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), clear: vi.fn(), analyze: vi.fn(), resultSave: vi.fn(), configured: false }))
vi.mock('../src/dream/input', async (original) => ({ ...await original<typeof import('../src/dream/input')>(), createDreamDraft: () => mock }))
vi.mock('../src/dream/service', () => ({ createDreamService: () => ({ configured: mock.configured, analyze: mock.analyze, save: mock.resultSave }) }))
const value = { dream: ' নদীর স্বপ্ন ', title: 'নদী', context: '', emotion: '' }
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name, exact: true }))
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
beforeEach(() => { vi.resetAllMocks(); setLocale('bn'); mock.read.mockResolvedValue(value); mock.save.mockResolvedValue(undefined); mock.clear.mockResolvedValue(undefined); mock.configured = false; mock.resultSave.mockResolvedValue(undefined) })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('restores a draft, reviews plain text without claiming an AI result and returns to editing', async () => {
  render(<DreamScreen userId="alice" />)
  await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toHaveValue(value.dream))
  click('লেখা যাচাই করুন'); expect(screen.getByRole('region', { name: 'লেখা যাচাই করুন' })).toHaveTextContent('AI analysis এখনও চালু হয়নি')
  click('লেখা সম্পাদনা করুন'); expect(screen.queryByRole('region', { name: 'লেখা যাচাই করুন' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript'), { target: { value: '   ' } })
  click('লেখা যাচাই করুন'); expect(screen.getByRole('alert')).toHaveTextContent('স্বপ্নটি লিখুন')
})
it('saves all fields, reports completion after commit and resets saved status on edits', async () => {
  const pending = deferred<void>(); mock.save.mockReturnValue(pending.promise)
  render(<DreamScreen userId="alice" />); await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toHaveValue(value.dream))
  click('Draft রাখুন'); expect(screen.getByRole('button', { name: 'অপেক্ষা করুন…' })).toBeDisabled()
  expect(mock.save).toHaveBeenCalledWith(value)
  await act(async () => pending.resolve()); expect(screen.getByRole('status')).toHaveTextContent('সংরক্ষিত হয়েছে')
  fireEvent.change(screen.getByLabelText('অনুভূতি (ঐচ্ছিক)'), { target: { value: 'আনন্দ' } })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
it('cancels discard then confirms deletion and clears the form only after success', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  render(<DreamScreen userId="alice" />); await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toHaveValue(value.dream))
  click('Draft মুছুন'); expect(mock.clear).not.toHaveBeenCalled()
  confirm.mockReturnValue(true); click('Draft মুছুন')
  await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toHaveValue(''))
})
it('keeps writing after a failed save and supports retry', async () => {
  mock.save.mockRejectedValueOnce(new Error('private'))
  render(<DreamScreen userId="alice" />); await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toHaveValue(value.dream))
  click('Draft রাখুন'); expect(await screen.findByRole('alert')).not.toHaveTextContent('private')
  click('Draft রাখুন'); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('সংরক্ষিত হয়েছে'))
})
it('offers usable input after a read failure without exposing browser details', async () => {
  mock.read.mockRejectedValue(new Error('private')); render(<DreamScreen userId="alice" />)
  expect(await screen.findByRole('alert')).not.toHaveTextContent('private')
  await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toBeEnabled())
})
it.each(['resolve','reject'] as const)('ignores late draft read %s after account screen unmount', async (outcome) => {
  const pending = deferred<typeof value>(); mock.read.mockReturnValue(pending.promise)
  const view = render(<DreamScreen userId="alice" />); view.unmount()
  await act(async () => { if (outcome === 'resolve') pending.resolve(value); else pending.reject(new Error('private')) })
})
it.each(['resolve','reject'] as const)('ignores late draft save %s after unmount', async (outcome) => {
  const pending = deferred<void>(); mock.save.mockReturnValue(pending.promise)
  const view = render(<DreamScreen userId="alice" />); await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toHaveValue(value.dream))
  click('Draft রাখুন'); view.unmount()
  await act(async () => { if (outcome === 'resolve') pending.resolve(); else pending.reject(new Error('private')) })
})
it.each([['en','Dream or edited voice transcript'],['hi','सपना या संपादित वॉइस ट्रांसक्रिप्ट']] as const)('translates input in %s', async (locale, label) => {
  setLocale(locale); render(<DreamScreen userId="alice" />)
  await waitFor(() => expect(screen.getByLabelText(label)).toHaveValue(value.dream))
})

const result = { symbols: ['নদী'], themes: ['পরিবর্তন'], emotions: ['শান্তি'], interpretation: '<script>private()</script> সম্ভাব্য ভাবনা', reflectionQuestions: ['নদী আপনার কাছে কী?'] }
const record = { version: 'dream.v1' as const, language: 'bn' as const, input: value, result }
async function ready() {
  render(<DreamScreen userId="alice" />)
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'স্বপ্ন বা সম্পাদিত voice transcript', exact: true })).toBeEnabled())
  click('লেখা যাচাই করুন')
}
it('does not allow submission without a configured gateway', async () => {
  await ready(); expect(screen.getByRole('button', { name: 'বিশ্লেষণ শুরু করুন' })).toBeDisabled()
  expect(mock.analyze).not.toHaveBeenCalled()
})
it('sends reviewed writing in its language, renders all five plain text fields and saves once after commit', async () => {
  mock.configured = true; mock.analyze.mockResolvedValue(record)
  const save = deferred<void>(); mock.resultSave.mockReturnValue(save.promise)
  await ready(); click('বিশ্লেষণ শুরু করুন')
  expect(await screen.findByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })).toHaveTextContent(result.interpretation)
  expect(document.querySelector('script')).toBeNull()
  expect(mock.analyze).toHaveBeenCalledWith(value, 'bn', expect.any(AbortSignal))
  for (const heading of ['প্রতীক','মূল ভাবনা','অনুভূতি','সম্ভাব্য ব্যাখ্যা','নিজেকে করার প্রশ্ন']) expect(screen.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  click('ফল এই device-এ রাখুন'); expect(mock.resultSave).toHaveBeenCalledExactlyOnceWith(record)
  expect(screen.getByRole('button', { name: 'ফল এই device-এ রাখুন' })).toBeDisabled()
  await act(async () => save.resolve())
  expect(screen.getByText('ফল এই device-এর history-এ সংরক্ষিত হয়েছে।')).toBeVisible()
  click('ফল এই device-এ রাখুন'); expect(mock.resultSave).toHaveBeenCalledOnce()
})
it('uses an explicit response language and keeps the AI result when local save fails, then retries saving', async () => {
  mock.configured = true; mock.analyze.mockResolvedValue(record); mock.resultSave.mockRejectedValueOnce(new Error('private'))
  await ready(); fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } }); click('বিশ্লেষণ শুরু করুন')
  await screen.findByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' }); expect(mock.analyze.mock.calls[0][1]).toBe('en')
  click('ফল এই device-এ রাখুন'); expect(await screen.findByRole('alert')).toHaveTextContent('ফল রাখা যায়নি')
  expect(screen.getByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })).toBeVisible()
  click('ফল এই device-এ রাখুন'); await screen.findByText('ফল এই device-এর history-এ সংরক্ষিত হয়েছে।')
})
it.each(['timeout','authentication','authorization','rate-limit','unavailable','invalid-response','invalid-input','unconfigured','network','cancelled'] as const)('provides a safe %s error and allows manual retry', async (code) => {
  mock.configured = true; mock.analyze.mockRejectedValueOnce(new MayaGatewayError(code)).mockResolvedValueOnce(record)
  await ready(); click('বিশ্লেষণ শুরু করুন'); expect(await screen.findByRole('alert')).not.toHaveTextContent('private')
  expect(screen.getByRole('textbox', { name: 'স্বপ্ন বা সম্পাদিত voice transcript', exact: true })).toHaveValue(value.dream)
  click('বিশ্লেষণ শুরু করুন'); await screen.findByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })
})
it('normalizes unexpected errors without showing exception details', async () => {
  mock.configured = true; mock.analyze.mockRejectedValue(new Error('provider secret'))
  await ready(); click('বিশ্লেষণ শুরু করুন'); expect(await screen.findByRole('alert')).toHaveTextContent('সংযোগ হয়নি')
})
it.each(['resolve','reject'] as const)('cancels analysis and ignores its late %s before another request', async (outcome) => {
  const pending = deferred<typeof record>(); mock.configured = true; mock.analyze.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(record)
  await ready(); act(() => { click('বিশ্লেষণ শুরু করুন'); click('বিশ্লেষণ শুরু করুন') })
  expect(mock.analyze).toHaveBeenCalledOnce(); expect(screen.getByRole('status')).toHaveTextContent('ভাবছে মায়া')
  const signal = mock.analyze.mock.calls[0][2] as AbortSignal
  click('বাতিল'); expect(signal.aborted).toBe(true)
  click('বিশ্লেষণ শুরু করুন'); await screen.findByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })
  await act(async () => { if (outcome === 'resolve') pending.resolve(record); else pending.reject(new Error('private')) })
  expect(screen.getByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })).toBeVisible()
})
it.each(['resolve','reject'] as const)('aborts an active analysis and ignores late %s when the account unmounts', async (outcome) => {
  const pending = deferred<typeof record>(); mock.configured = true; mock.analyze.mockReturnValue(pending.promise)
  const view = render(<DreamScreen userId="alice" />)
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'স্বপ্ন বা সম্পাদিত voice transcript', exact: true })).toBeEnabled())
  click('লেখা যাচাই করুন'); click('বিশ্লেষণ শুরু করুন'); view.unmount()
  expect(mock.analyze.mock.calls[0][2].aborted).toBe(true)
  await act(async () => { if (outcome === 'resolve') pending.resolve(record); else pending.reject(new Error('private')) })
})
it.each(['resolve','reject'] as const)('ignores late result save %s after unmount', async (outcome) => {
  const pending = deferred<void>(); mock.configured = true; mock.analyze.mockResolvedValue(record); mock.resultSave.mockReturnValue(pending.promise)
  const view = render(<DreamScreen userId="alice" />)
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'স্বপ্ন বা সম্পাদিত voice transcript', exact: true })).toBeEnabled())
  click('লেখা যাচাই করুন'); click('বিশ্লেষণ শুরু করুন'); await screen.findByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })
  click('ফল এই device-এ রাখুন'); view.unmount()
  await act(async () => { if (outcome === 'resolve') pending.resolve(); else pending.reject(new Error('private')) })
})

it('retains a saved result when a follow-up request fails and clears it on confirmed draft discard', async () => {
  mock.configured = true; mock.analyze.mockResolvedValueOnce(record).mockRejectedValueOnce(new MayaGatewayError('timeout'))
  await ready(); click('বিশ্লেষণ শুরু করুন'); await screen.findByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })
  click('ফল এই device-এ রাখুন'); await screen.findByText('ফল এই device-এর history-এ সংরক্ষিত হয়েছে।')
  click('বিশ্লেষণ শুরু করুন'); await screen.findByRole('alert')
  expect(screen.getByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'ফল এই device-এ রাখুন' })).toBeDisabled()
  vi.spyOn(window, 'confirm').mockReturnValue(true); click('Draft মুছুন')
  await waitFor(() => expect(screen.queryByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })).not.toBeInTheDocument())
})
