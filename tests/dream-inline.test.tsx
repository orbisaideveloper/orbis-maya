import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import DreamScreen from '../src/DreamScreen'
function renderDream(userId:string){const view=render(<DreamScreen userId={userId}/>);const summary=view.container.querySelector('summary')!;fireEvent.click(summary);return view}
import { setLocale } from '../src/i18n'
const mock = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), clear: vi.fn(), analyze: vi.fn(), resultSave: vi.fn(), configured: false }))
vi.mock('../src/dream/input', async (original) => ({ ...await original<typeof import('../src/dream/input')>(), createDreamDraft: () => mock }))
vi.mock('../src/dream/service', () => ({ createDreamService: () => ({ configured: mock.configured, analyze: mock.analyze, save: mock.resultSave }) }))
const value = { dream: ' নদীর স্বপ্ন ', title: 'নদী', context: '', emotion: '' }
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name, exact: true }))
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
beforeEach(() => { vi.resetAllMocks(); setLocale('bn'); mock.read.mockResolvedValue(value); mock.save.mockResolvedValue(undefined); mock.clear.mockResolvedValue(undefined); mock.configured = false; mock.resultSave.mockResolvedValue(undefined) })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

const result = { symbols: ['নদী'], themes: ['পরিবর্তন'], emotions: ['শান্তি'], interpretation: 'সম্ভাব্য ভাবনা', reflectionQuestions: ['নদী আপনার কাছে কী?'] }
const record = { version: 'dream.v1' as const, language: 'bn' as const, input: value, result }

it('sends from the composer and keeps processing and the result inside the same conversation', async () => {
  const pending = deferred<typeof record>(); mock.configured = true; mock.analyze.mockReturnValue(pending.promise)
  const view = renderDream('alice')
  await waitFor(() => expect(screen.getByLabelText('স্বপ্ন বা সম্পাদিত voice transcript')).toBeEnabled())
  click('পাঠান')
  expect(mock.analyze).toHaveBeenCalledExactlyOnceWith(value, 'bn', expect.any(AbortSignal))
  const conversation = view.container.querySelector('.chat-conversation')!
  expect(conversation).toContainElement(screen.getByText('আপনার স্বপ্ন নিয়ে ভাবছে মায়া…'))
  await act(async () => pending.resolve(record))
  expect(conversation).toContainElement(screen.getByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' }))
  expect(view.container.querySelector('.feature-notice')).toBeNull()
})
