import { parseDreamResult, type DreamResult } from '../ai/gateway'
import type { Locale } from '../i18n'
import { validDream, type DreamInput } from './input'

export type DreamRecord = { version: 'dream.v1'; language: Locale; input: DreamInput; result: DreamResult }

export function responseLanguage(input: string, fallback: Locale): Locale {
  if (/[\u0980-\u09ff]/u.test(input)) return 'bn'
  if (/[\u0900-\u097f]/u.test(input)) return 'hi'
  if (/[a-z]/iu.test(input)) return 'en'
  return fallback
}

export function readDreamRecord(content: string): DreamRecord | null {
  try {
    const value: unknown = JSON.parse(content)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const record = value as DreamRecord
    if (Object.keys(record).length !== 4 || record.version !== 'dream.v1' || !['bn', 'en', 'hi'].includes(record.language) || !validDream(record.input)) return null
    return { version: 'dream.v1', language: record.language, input: record.input, result: parseDreamResult(record.result) }
  } catch { return null }
}
