import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { createDreamDraft, emptyDream, validDream } from '../src/dream/input'
import { createLocalHistory } from '../src/storage/history'

beforeEach(() => { vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange) })
afterEach(() => vi.unstubAllGlobals())
it('keeps one atomic draft per user separate from completed history', async () => {
  const alice = createDreamDraft('alice'); const bob = createDreamDraft('bob')
  expect(await alice.read()).toEqual(emptyDream)
  await alice.save({ ...emptyDream, dream: 'প্রথম স্বপ্ন' })
  const value = { dream: ' নতুন স্বপ্ন ', title: ' নদী ', context: ' প্রেক্ষাপট ', emotion: 'আনন্দ' }
  await alice.save(value)
  expect(await createDreamDraft('alice').read()).toEqual(value)
  expect(await bob.read()).toEqual(emptyDream)
  expect(await createLocalHistory('alice').list()).toEqual([])
  await alice.clear(); expect(await alice.read()).toEqual(emptyDream)
})
it.each([null, [], {}, { ...emptyDream, dream: 1 }, { ...emptyDream, dream: 'x'.repeat(8001) }, { ...emptyDream, title: 'x'.repeat(501) }, { ...emptyDream, audio: 'raw' }])('rejects malformed/oversized draft %j', async (value) => {
  expect(validDream(value as typeof emptyDream)).toBe(false)
  await expect(createDreamDraft('alice').save(value as typeof emptyDream)).rejects.toThrow('invalid-draft')
})
it('allows an empty draft but requires meaningful text for review', async () => {
  expect(validDream({ ...emptyDream, dream: '  ' })).toBe(false)
  expect(validDream({ ...emptyDream, dream: ' নদী ' })).toBe(true)
  const storage = createDreamDraft('alice'); await storage.save(emptyDream)
  expect(await storage.read()).toEqual(emptyDream)
})
it.each(['invalid JSON', JSON.stringify({ dream: 'missing fields' })])('rejects corrupted stored draft: %s', async (content) => {
  await createLocalHistory('alice', { namespace: 'dream-draft' }).repository('dream').save({ title: 'draft', content })
  await expect(createDreamDraft('alice').read()).rejects.toThrow()
})
