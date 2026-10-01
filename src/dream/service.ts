import { authClient } from '../auth/client'
import { createMayaGateway, MayaGatewayError } from '../ai/gateway'
import { createLocalHistory } from '../storage/history'
import { validDream, type DreamInput } from './input'
import { readDreamRecord, type DreamRecord } from './record'
import type { Locale } from '../i18n'

export function createDreamService(userId: string) {
  const repository = createLocalHistory(userId).repository('dream')
  const gateway = createMayaGateway({
    url: import.meta.env.VITE_MAYA_GATEWAY_URL,
    getToken: async () => {
      if (!authClient) return null
      const { data, error } = await authClient.auth.getSession()
      if (error || data.session?.user.id !== userId) return null
      return data.session.access_token
    },
  })
  return {
    configured: gateway.configured,
    async analyze(input: DreamInput, language: Locale, signal: AbortSignal): Promise<DreamRecord> {
      if (!validDream(input)) throw new MayaGatewayError('invalid-input')
      const optional = Object.fromEntries(['title', 'context', 'emotion'].filter((key) => input[key as keyof DreamInput].trim()).map((key) => [key, input[key as keyof DreamInput].trim()]))
      const result = await gateway.request({ version: 'maya.v1', capability: 'dream.analysis', language, input: { dream: input.dream.trim(), ...optional } }, signal)
      return { version: 'dream.v1', language, input: { ...input }, result }
    },
    async save(record: DreamRecord) {
      const content = JSON.stringify(record)
      if (!readDreamRecord(content)) throw new MayaGatewayError('invalid-response')
      await repository.save({ title: record.input.title.trim().slice(0, 200) || record.input.dream.trim().slice(0, 80), content })
    },
  }
}
