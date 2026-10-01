import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { createDreamService } from '../src/dream/service'
import { readDreamRecord, responseLanguage } from '../src/dream/record'
import { parseDreamResult } from '../src/ai/gateway'
import { createLocalHistory } from '../src/storage/history'
import { emptyDream } from '../src/dream/input'
import HistoryContent from '../src/HistoryContent'
import { setLocale } from '../src/i18n'

const mock = vi.hoisted(() => ({ session: vi.fn(), client: null as null | { auth: { getSession: ReturnType<typeof vi.fn> } } }))
vi.mock('../src/auth/client', () => ({ get authClient() { return mock.client } }))
const result = { symbols: [' নদী '], themes: ['পরিবর্তন'], emotions: ['শান্তি'], interpretation: ' সম্ভাব্য ভাবনা ', reflectionQuestions: ['নদী আপনার কাছে কী?'] }
const input = { dream: ' নদীর স্বপ্ন ', title: 'নদী', context: ' পরিবার ', emotion: ' ' }
const record = { version: 'dream.v1' as const, language: 'bn' as const, input, result }
const transport = vi.fn<typeof fetch>()
const reply = (value: unknown) => ({ ok: true, text: async () => JSON.stringify({ version: 'maya.v1', success: true, capability: 'dream.analysis', language: 'bn', result: value }) }) as Response
beforeEach(() => {
  vi.resetAllMocks(); vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange); vi.stubGlobal('fetch', transport)
  vi.stubEnv('VITE_MAYA_GATEWAY_URL', 'https://foundation.example/api/maya/request')
  mock.client = { auth: { getSession: mock.session } }
  mock.session.mockResolvedValue({ data: { session: { user: { id: 'alice' }, access_token: 'user.token' } }, error: null })
  transport.mockResolvedValue(reply(result)); setLocale('bn')
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })
it.each([['নদী','en','bn'],['नदी','bn','hi'],['river','bn','en'],['…','hi','hi']] as const)('selects response language for %s independently of UI', (writing, locale, expected) => {
  expect(responseLanguage(writing, locale)).toBe(expected)
})
it('shares the strict gateway parser with local records and trims all result text', () => {
  const clean = parseDreamResult(result)
  expect(clean.symbols).toEqual(['নদী']); expect(clean.interpretation).toBe('সম্ভাব্য ভাবনা')
  expect(() => parseDreamResult(null)).toThrow('invalid-response')
  expect(readDreamRecord(JSON.stringify(record))?.result).toEqual(clean)
})
it.each(['legacy reflection','null','[]',JSON.stringify({ ...record, version: 'unknown' }),JSON.stringify({ ...record, language: 'fr' }),JSON.stringify({ ...record, input: emptyDream }),JSON.stringify({ ...record, extra: true }),JSON.stringify({ ...record, result: { ...result, symbols: [] } })])('rejects a corrupted/unversioned record %s', (content) => {
  expect(readDreamRecord(content)).toBeNull()
})
it('sends only reviewed text and meaningful optional fields through Foundation with the current bearer token', async () => {
  const service = createDreamService('alice'); expect(service.configured).toBe(true)
  const record = await service.analyze(input, 'bn', new AbortController().signal)
  expect(record.input).toEqual(input)
  const options = transport.mock.calls[0][1]!
  expect(JSON.parse(options.body as string)).toEqual({ version: 'maya.v1', capability: 'dream.analysis', language: 'bn', input: { dream: 'নদীর স্বপ্ন', title: 'নদী', context: 'পরিবার' } })
  expect(options.headers).toMatchObject({ Authorization: 'Bearer user.token' })
  await service.save(record)
  const rows = await createLocalHistory('alice').list()
  expect(rows).toHaveLength(1); expect(rows[0].title).toBe('নদী')
  expect(readDreamRecord(rows[0].content)).toEqual(record)
  expect(await createLocalHistory('bob').list()).toEqual([])
  expect(await createLocalHistory('alice', { namespace: 'dream-draft' }).list()).toEqual([])
})
it.each(['absent','error','other-user','missing-session'] as const)('rejects %s identity before contacting the gateway', async (mode) => {
  if (mode === 'absent') mock.client = null
  if (mode === 'error') mock.session.mockResolvedValue({ data: { session: null }, error: new Error('private') })
  if (mode === 'other-user') mock.session.mockResolvedValue({ data: { session: { user: { id: 'bob' }, access_token: 'token' } }, error: null })
  if (mode === 'missing-session') mock.session.mockResolvedValue({ data: { session: null }, error: null })
  await expect(createDreamService('alice').analyze(input, 'bn', new AbortController().signal)).rejects.toMatchObject({ code: 'authentication' })
  expect(transport).not.toHaveBeenCalled()
})
it('fails closed for missing gateway and invalid input and never saves an invalid result', async () => {
  vi.stubEnv('VITE_MAYA_GATEWAY_URL', ''); const service = createDreamService('alice')
  expect(service.configured).toBe(false)
  await expect(service.analyze(input, 'bn', new AbortController().signal)).rejects.toMatchObject({ code: 'unconfigured' })
  await expect(service.analyze(emptyDream, 'bn', new AbortController().signal)).rejects.toMatchObject({ code: 'invalid-input' })
  await expect(service.save({ ...record, result: { ...result, emotions: [] } })).rejects.toMatchObject({ code: 'invalid-response' })
  expect(await createLocalHistory('alice').list()).toEqual([])
})
it('bounds titles, derives a missing title and stores a large accepted structured result completely', async () => {
  const service = createDreamService('alice')
  await service.save({ ...record, input: { ...input, title: 'x'.repeat(500) } })
  await service.save({ ...record, input: { ...input, title: '' }, result: { symbols: Array(12).fill('x'.repeat(500)), themes: Array(12).fill('x'.repeat(500)), emotions: Array(12).fill('x'.repeat(500)), interpretation: 'x'.repeat(6000), reflectionQuestions: Array(5).fill('x'.repeat(500)) } })
  const rows = await createLocalHistory('alice').list()
  expect(rows.map((row) => row.title)).toContain('x'.repeat(200)); expect(rows.map((row) => row.title)).toContain('নদীর স্বপ্ন')
  const large = rows.find((row) => row.title === 'নদীর স্বপ্ন')!
  expect(large.content.length).toBeGreaterThan(16000)
  expect(readDreamRecord(large.content)?.result.interpretation).toHaveLength(6000)
})
it('reopens structured results with all original fields and renders legacy/chat text safely', () => {
  render(<HistoryContent kind="dream" content={JSON.stringify(record)} />)
  expect(screen.getByRole('region', { name: 'স্বপ্নের ব্যাখ্যা' })).toBeVisible()
  expect(screen.getByText('পরিবার', { exact: false })).toBeInTheDocument()
  cleanup(); render(<HistoryContent kind="chat" content="<script>private()</script>" />)
  expect(screen.getByText('<script>private()</script>')).toBeVisible(); expect(document.querySelector('script')).toBeNull()
  cleanup(); render(<HistoryContent kind="dream" content="Legacy reflection" />)
  expect(screen.getByText('Legacy reflection')).toBeVisible()
})
it.each(['en','hi'] as const)('translates result headings into %s while preserving the answer language', (locale) => {
  setLocale(locale); render(<HistoryContent kind="dream" content={JSON.stringify(record)} />)
  expect(screen.getByRole('region')).toHaveTextContent(locale === 'en' ? 'Reflection questions' : 'आत्मचिंतन के प्रश्न')
  expect(document.querySelector('[lang="bn"]')).toBeInTheDocument()
})
