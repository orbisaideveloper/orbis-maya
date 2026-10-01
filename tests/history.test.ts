import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { createLocalHistory, LocalHistoryError } from '../src/storage/history'

const DAY = 86400000
const TITLE = 'নদীর স্বপ্ন'
const CONTENT = 'একটি প্রতিফলনমূলক লেখা'
let factory: IDBFactory
let counter: number
beforeEach(() => {
  factory = new IDBFactory(); counter = 0
  vi.stubGlobal('indexedDB', factory)
  vi.stubGlobal('IDBKeyRange', IDBKeyRange)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
const options = () => ({ factory, id: () => `entry-${++counter}`, clock: () => 40 * DAY })
const draft = () => ({ title: TITLE, content: CONTENT })

describe('device-local history repositories', () => {
  it('persists/reopens all three kinds in a versioned user database', async () => {
    const history = createLocalHistory('user-a', options())
    for (const kind of ['dream', 'astro', 'chat'] as const) {
      const entry = await history.repository(kind).save(draft())
      expect(await createLocalHistory('user-a', options()).repository(kind).get(entry.id)).toEqual(entry)
    }
    expect(await history.list()).toHaveLength(3)
    expect(await history.repository('dream').get('missing')).toBe(null)
  })

  it('isolates users and kinds during read/delete/clear', async () => {
    const alice = createLocalHistory('alice', options())
    const bob = createLocalHistory('bob', options())
    const first = await alice.repository('dream').save(draft())
    await alice.repository('chat').save(draft())
    await bob.repository('dream').save(draft())
    expect(await bob.repository('dream').get(first.id)).toBe(null)
    await alice.repository('chat').remove(first.id)
    expect(await alice.repository('dream').get(first.id)).not.toBe(null)
    await alice.repository('dream').remove(first.id)
    expect(await alice.repository('dream').list()).toEqual([])
    await alice.repository('chat').clear()
    expect(await alice.list()).toEqual([])
    expect(await bob.list()).toHaveLength(1)
    await bob.clear()
    expect(await bob.list()).toEqual([])
  })

  it('clears only the requested kind and preserves other entries', async () => {
    const history = createLocalHistory('user', options())
    await history.repository('dream').save(draft())
    await history.repository('dream').save(draft())
    await history.repository('astro').save(draft())
    await history.repository('dream').clear()
    expect((await history.list()).map((entry) => entry.kind)).toEqual(['astro'])
  })

  it('prunes oldest records atomically and handles equal timestamps deterministically', async () => {
    const history = createLocalHistory('user', { ...options(), maxEntries: 2 })
    const entries = await Promise.all(Array.from({ length: 5 }, () => history.repository('dream').save(draft())))
    expect((await history.repository('dream').list()).map((entry) => entry.id)).toEqual([entries[4].id, entries[3].id])
    await history.repository('chat').save(draft())
    expect(await history.list()).toHaveLength(3)
  })

  it('prunes expired records on write and read, keeping the exact age boundary', async () => {
    let now = 40 * DAY
    const history = createLocalHistory('user', { ...options(), retentionDays: 1, clock: () => now })
    await history.repository('dream').save(draft())
    now += DAY
    expect(await history.list()).toHaveLength(1)
    now += 1
    expect(await history.list()).toEqual([])
    await history.repository('dream').save(draft())
    now += 2 * DAY
    await history.repository('chat').save(draft())
    expect((await history.list()).map((entry) => entry.kind)).toEqual(['chat'])
  })

  it('sorts newest records first and trims canonical text', async () => {
    let now = DAY
    const history = createLocalHistory('user', { ...options(), clock: () => now })
    const first = await history.repository('dream').save(draft())
    now += 1
    const next = await history.repository('dream').save({ title: ` ${TITLE} `, content: ` ${CONTENT} ` })
    expect(next.title).toBe(TITLE)
    expect((await history.list()).map((entry) => entry.id)).toEqual([next.id, first.id])
  })

  it.each(['', '../other-user', 'user@email.example', 'x'.repeat(129)])('requires an explicit safe signed-in user scope %s', (user) => {
    expect(() => createLocalHistory(user)).toThrow('invalid-input')
  })

  it.each([{ maxEntries: 0 }, { maxEntries: 201 }, { maxEntries: 1.5 }, { retentionDays: 0 }, { retentionDays: 366 }, { retentionDays: NaN }])('rejects invalid retention configuration %j', (settings) => {
    expect(() => createLocalHistory('user', settings)).toThrow('invalid-input')
  })

  it('uses default browser factory, clock and crypto ID without external infrastructure', async () => {
    const history = createLocalHistory('user')
    const entry = await history.repository('chat').save(draft())
    expect(entry.createdAt).toBeGreaterThan(0)
    expect(entry.id).not.toBe('')
    expect(await history.repository('chat').get(entry.id)).toEqual(entry)
    expect(new LocalHistoryError('blocked').message).toBe('blocked')
  })

  it('rejects unsupported kinds, empty/oversized text and raw binary or extra fields', async () => {
    const history = createLocalHistory('user', options())
    expect(() => history.repository('invalid' as 'dream')).toThrow('invalid-input')
    const bad = [null, { title: '', content: CONTENT }, { title: 'x'.repeat(201), content: CONTENT }, { title: TITLE, content: '' }, { title: TITLE, content: 'x'.repeat(40001) }, { title: TITLE, content: new Blob(['audio']) }, { ...draft(), audio: 'raw' }]
    for (const value of bad) {
      await expect(history.repository('dream').save(value as ReturnType<typeof draft>)).rejects.toThrow('invalid-input')
    }
    expect(await history.list()).toEqual([])
  })

  it('rejects invalid IDs/timestamps and enforces serialized byte limits', async () => {
    for (const settings of [{ id: () => '' }, { clock: () => -1 }, { clock: () => NaN }]) {
      const history = createLocalHistory('user', { ...options(), ...settings })
      await expect(history.repository('dream').save(draft())).rejects.toThrow('invalid-input')
    }
    const history = createLocalHistory('user', options())
    await expect(history.repository('dream').save({ title: TITLE, content: '\u0000'.repeat(40000) })).rejects.toThrow('invalid-input')
  })

  it('reports unavailable storage without substituting server or memory history', async () => {
    vi.stubGlobal('indexedDB', undefined)
    await expect(createLocalHistory('user').list()).rejects.toMatchObject({ code: 'unavailable' })
  })

  it('normalizes opening failures without exposing storage details', async () => {
    const broken = { open: () => { throw new Error('private') } } as unknown as IDBFactory
    await expect(createLocalHistory('user', { factory: broken }).list()).rejects.toThrow('storage-failed')
    const newer = await new Promise<IDBDatabase>((resolve) => {
      const request = factory.open('orbis-maya-history-user', 2)
      request.onsuccess = () => resolve(request.result)
    })
    newer.close()
    await expect(createLocalHistory('user', options()).list()).rejects.toThrow('storage-failed')
  })

  it('rejects blocked schema opening and closes the late connection', async () => {
    const older = await new Promise<IDBDatabase>((resolve) => {
      const request = factory.open('orbis-maya-history-user', 1)
      request.onsuccess = () => resolve(request.result)
    })
    // Simulate a blocked native upgrade request without altering production schema.
    const request: Partial<IDBOpenDBRequest> = {}
    const close = vi.fn()
    const blocked = { open: () => {
      queueMicrotask(() => {
        request.onblocked?.({} as IDBVersionChangeEvent)
        Object.assign(request, { result: { close } })
        request.onsuccess?.({} as Event)
      })
      return request
    } } as unknown as IDBFactory
    await expect(createLocalHistory('user', { factory: blocked }).list()).rejects.toThrow('blocked')
    expect(close).toHaveBeenCalled()
    older.close()
  })

  it('rolls back a duplicate ID rather than reporting an uncommitted save', async () => {
    const history = createLocalHistory('user', { ...options(), id: () => 'same-id' })
    await history.repository('dream').save(draft())
    await expect(history.repository('dream').save({ title: TITLE, content: 'new' })).rejects.toThrow('storage-failed')
    expect((await history.list())[0].content).toBe(CONTENT)
  })

  it('rejects synchronous transaction errors and rolls back callback failures', async () => {
    const history = createLocalHistory('user', options())
    await history.repository('dream').save(draft())
    const open = factory.open.bind(factory)
    vi.spyOn(factory, 'open').mockImplementation((...args) => {
      const request = open(...args)
      request.addEventListener('success', () => {
        vi.spyOn(request.result, 'transaction').mockImplementation(() => { throw new Error('private') })
      })
      return request
    })
    await expect(history.list()).rejects.toThrow('storage-failed')
    vi.restoreAllMocks()
    const aborting = createLocalHistory('user', options())
    vi.stubGlobal('IDBKeyRange', { bound: () => { throw new Error('private') } })
    await expect(aborting.repository('dream').clear()).rejects.toThrow('storage-failed')
  })

  it('rolls back a save when processing stored entries fails', async () => {
    const history = createLocalHistory('user', options())
    await history.repository('dream').save(draft())
    const compare = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => { throw new Error('private') })
    try {
      await expect(history.repository('dream').save(draft())).rejects.toThrow('storage-failed')
    } finally { compare.mockRestore() }
    expect(await history.list()).toHaveLength(1)
  })
})
