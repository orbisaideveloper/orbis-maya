import { createLocalHistory } from '../storage/history'

export const dreamFields = { dream: 8000, title: 500, context: 500, emotion: 500 } as const
export type DreamInput = Record<keyof typeof dreamFields, string>
export const emptyDream: DreamInput = { dream: '', title: '', context: '', emotion: '' }

function bounded(value: unknown): value is DreamInput {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.keys(value).length === 4 && Object.entries(dreamFields).every(([key, max]) => {
      const field = (value as Record<string, unknown>)[key]
      return typeof field === 'string' && field.length <= max
    })
}

export function validDream(value: DreamInput) { return bounded(value) && value.dream.trim().length > 0 }

export function createDreamDraft(userId: string) {
  const history = createLocalHistory(userId, { namespace: 'dream-draft', maxEntries: 1, id: () => 'current' })
  const repository = history.repository('dream')
  return {
    async read(): Promise<DreamInput> {
      const entries = await repository.list()
      if (!entries.length) return { ...emptyDream }
      const value: unknown = JSON.parse(entries[0].content)
      if (!bounded(value)) throw new Error('invalid-draft')
      return value
    },
    async save(value: DreamInput) {
      if (!bounded(value)) throw new Error('invalid-draft')
      await repository.save({ title: 'dream-draft', content: JSON.stringify(value) }, true)
    },
    clear: () => history.clear(),
  }
}
