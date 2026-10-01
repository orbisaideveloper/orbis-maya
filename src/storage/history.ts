type Kind = 'dream' | 'astro' | 'chat'
type Entry = { id: string; kind: Kind; createdAt: number; title: string; content: string }
type Draft = { title: string; content: string }
type Failure = 'invalid-input' | 'unavailable' | 'blocked' | 'storage-failed'

export class LocalHistoryError extends Error {
  readonly code: Failure
  constructor(code: Failure) { super(code); this.name = 'LocalHistoryError'; this.code = code }
}

const KINDS = new Set<Kind>(['dream', 'astro', 'chat'])
const STORE = 'entries'
const VERSION = 1

function integer(value: number, min: number, max: number) {
  return Number.isSafeInteger(value) && value >= min && value <= max
}

function validText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

function open(factory: IDBFactory | undefined, name: string): Promise<IDBDatabase> {
  if (!factory) return Promise.reject(new LocalHistoryError('unavailable'))
  return new Promise((resolve, reject) => {
    const request = factory.open(name, VERSION)
    let blocked = false
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: ['kind', 'id'] })
      store.createIndex('kindCreatedAt', ['kind', 'createdAt'])
    }
    request.onblocked = () => { blocked = true; reject(new LocalHistoryError('blocked')) }
    request.onerror = () => reject(new LocalHistoryError('storage-failed'))
    request.onsuccess = () => {
      if (blocked) request.result.close()
      else resolve(request.result)
    }
  })
}

function transact<T>(db: IDBDatabase, operation: (store: IDBObjectStore, complete: (value: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    let value: T
    transaction.oncomplete = () => resolve(value)
    transaction.onabort = () => reject(new LocalHistoryError('storage-failed'))
    transaction.onerror = () => reject(new LocalHistoryError('storage-failed'))
    try { operation(transaction.objectStore(STORE), (next) => { value = next }) }
    catch { transaction.abort(); reject(new LocalHistoryError('storage-failed')) }
  })
}

function scan(store: IDBObjectStore, accept: (entries: Entry[]) => void) {
  const request = store.getAll()
  request.onsuccess = () => {
    try { accept(request.result) } catch { store.transaction.abort() }
  }
}

export function createLocalHistory(userId: string, options: {
  namespace?: 'history' | 'dream-draft'
  factory?: IDBFactory
  maxEntries?: number
  retentionDays?: number
  clock?: () => number
  id?: () => string
} = {}) {
  const maxEntries = options.maxEntries ?? 100
  const retentionDays = options.retentionDays ?? 30
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(userId) || !integer(maxEntries, 1, 200) || !integer(retentionDays, 1, 365)) throw new LocalHistoryError('invalid-input')
  const factory = options.factory ?? globalThis.indexedDB
  const clock = options.clock ?? Date.now
  const id = options.id ?? (() => crypto.randomUUID())
  const database = `orbis-maya-${options.namespace ?? 'history'}-${userId}`

  async function run<T>(operation: (store: IDBObjectStore, complete: (value: T) => void) => void): Promise<T> {
    let db: IDBDatabase | undefined
    try {
      db = await open(factory, database)
      return await transact(db, operation)
    } catch (error) {
      throw error instanceof LocalHistoryError ? error : new LocalHistoryError('storage-failed')
    } finally { db?.close() }
  }

  function prune(store: IDBObjectStore, entries: Entry[], now: number) {
    const kept: Entry[] = []
    const cutoff = now - retentionDays * 86400000
    for (const kind of KINDS) {
      const sorted = entries.filter((entry) => entry.kind === kind).sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
      let count = 0
      for (const entry of sorted) {
        if (entry.createdAt < cutoff || count >= maxEntries) store.delete([entry.kind, entry.id])
        else { kept.push(entry); count += 1 }
      }
    }
    return kept.sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
  }

  async function list(kind?: Kind): Promise<Entry[]> {
    const now = clock()
    return run((store, complete) => {
      scan(store, (stored) => {
        const entries = prune(store, stored, now)
        complete(kind ? entries.filter((entry) => entry.kind === kind) : entries)
      })
    })
  }

  async function clear(kind?: Kind): Promise<void> {
    return run((store, complete) => {
      if (!kind) { store.clear(); complete(undefined); return }
      const request = store.index('kindCreatedAt').openKeyCursor(IDBKeyRange.bound([kind, 0], [kind, Number.MAX_SAFE_INTEGER]))
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) { store.delete(cursor.primaryKey); cursor.continue() }
        else complete(undefined)
      }
    })
  }

  function repository(kind: Kind) {
    if (!KINDS.has(kind)) throw new LocalHistoryError('invalid-input')
    async function save(draft: Draft, replace = false): Promise<Entry> {
      if (!validText(draft?.title, 200) || !validText(draft?.content, 40000) || Object.keys(draft).some((key) => !['title', 'content'].includes(key))) throw new LocalHistoryError('invalid-input')
      const entry: Entry = { id: id(), kind, createdAt: clock(), title: draft.title.trim(), content: draft.content.trim() }
      if (!validText(entry.id, 128) || !integer(entry.createdAt, 0, Number.MAX_SAFE_INTEGER) || new TextEncoder().encode(JSON.stringify(entry)).byteLength > 98304) throw new LocalHistoryError('invalid-input')
      return run((store, complete) => {
        if (replace) store.put(entry)
        else store.add(entry)
        scan(store, (stored) => { prune(store, stored, entry.createdAt); complete(entry) })
      })
    }
    async function get(entryId: string) { return (await list(kind)).find((entry) => entry.id === entryId) ?? null }
    async function remove(entryId: string): Promise<void> {
      return run((store, complete) => { store.delete([kind, entryId]); complete(undefined) })
    }
    return { save, get, list: () => list(kind), remove, clear: () => clear(kind) }
  }
  return { repository, list: () => list(), clear: () => clear() }
}
