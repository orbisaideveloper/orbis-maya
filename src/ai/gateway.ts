type Language = 'bn' | 'en' | 'hi'
type Request = { version: 'maya.v1'; language: Language } & (
  { capability: 'dream.analysis'; input: { dream: string; title?: string; context?: string; emotion?: string } }
  | { capability: 'general.chat'; input: { messages: { role: 'user' | 'assistant'; content: string }[] } }
)
export type DreamResult = { symbols: string[]; themes: string[]; emotions: string[]; interpretation: string; reflectionQuestions: string[] }
type Result = DreamResult | { reply: string }
type Failure = 'unconfigured' | 'authentication' | 'authorization' | 'rate-limit' | 'unavailable' | 'invalid-response' | 'timeout' | 'cancelled' | 'network' | 'invalid-input'

export class MayaGatewayError extends Error {
  readonly code: Failure
  constructor(code: Failure) { super(code); this.name = 'MayaGatewayError'; this.code = code }
}

function endpoint(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if ((!local && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash || url.pathname !== '/api/maya/request') return null
    return url.href
  } catch { return null }
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(value)
  return actual.length === keys.length && actual.every((key) => keys.includes(key))
}

function text(value: unknown, limit: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= limit
}

function list(value: unknown, max: number) {
  return Array.isArray(value) && value.length > 0 && value.length <= max && value.every((item) => text(item, 500))
}

export function parseDreamResult(result: unknown): DreamResult {
  if (!object(result) || !exactKeys(result, ['symbols', 'themes', 'emotions', 'interpretation', 'reflectionQuestions']) || !list(result.symbols, 12) || !list(result.themes, 12) || !list(result.emotions, 12) || !text(result.interpretation, 6000) || !list(result.reflectionQuestions, 5)) throw new MayaGatewayError('invalid-response')
  const value = result as DreamResult
  const clean = (items: string[]) => items.map((item) => item.trim())
  return { symbols: clean(value.symbols), themes: clean(value.themes), emotions: clean(value.emotions), interpretation: value.interpretation.trim(), reflectionQuestions: clean(value.reflectionQuestions) }
}

function parseResult(request: Request, value: unknown): Result {
  if (!object(value) || !exactKeys(value, ['version', 'success', 'capability', 'language', 'result']) || value.version !== 'maya.v1' || value.success !== true || value.capability !== request.capability || value.language !== request.language || !object(value.result)) throw new MayaGatewayError('invalid-response')
  const result = value.result
  if (request.capability === 'general.chat') {
    if (!exactKeys(result, ['reply']) || !text(result.reply, 8000)) throw new MayaGatewayError('invalid-response')
    return { reply: result.reply.trim() }
  }
  return parseDreamResult(result)
}

function httpFailure(status: number): Failure {
  if (status === 401) return 'authentication'
  if (status === 403) return 'authorization'
  if (status === 429) return 'rate-limit'
  if (status === 504) return 'timeout'
  if (status >= 500) return 'unavailable'
  return 'invalid-input'
}

export function createMayaGateway(options: {
  url: string | undefined
  getToken: () => Promise<string | null>
  fetch?: typeof fetch
  timeoutMs?: number
}) {
  const url = endpoint(options.url)
  const transport = options.fetch ?? fetch
  const timeoutMs = options.timeoutMs ?? 65000

  function request(input: Extract<Request, { capability: 'dream.analysis' }>, signal?: AbortSignal): Promise<DreamResult>
  function request(input: Extract<Request, { capability: 'general.chat' }>, signal?: AbortSignal): Promise<{ reply: string }>
  async function request(input: Request, signal?: AbortSignal): Promise<Result> {
    if (!url) throw new MayaGatewayError('unconfigured')
    if (signal?.aborted) throw new MayaGatewayError('cancelled')
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let cancel: () => void
    const interruption = new Promise<never>((_, reject) => {
      cancel = () => { controller.abort(); reject(new MayaGatewayError('cancelled')) }
      signal?.addEventListener('abort', cancel, { once: true })
      timer = setTimeout(() => { controller.abort(); reject(new MayaGatewayError('timeout')) }, timeoutMs)
    })
    async function send() {
      let token: string | null
      try { token = await options.getToken() } catch { throw new MayaGatewayError('authentication') }
      if (!token || !/^[A-Za-z0-9._~-]+$/.test(token)) throw new MayaGatewayError('authentication')
      if (controller.signal.aborted) throw new MayaGatewayError('cancelled')
      let body: string
      try { body = JSON.stringify(input) } catch { throw new MayaGatewayError('invalid-input') }
      if (new TextEncoder().encode(body).byteLength > 32768) throw new MayaGatewayError('invalid-input')
      const response = await transport(url!, {
        method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body, signal: controller.signal,
      })
      if (!response.ok) throw new MayaGatewayError(httpFailure(response.status))
      const content = await response.text()
      if (new TextEncoder().encode(content).byteLength > 65536) throw new MayaGatewayError('invalid-response')
      let decoded: unknown
      try { decoded = JSON.parse(content) } catch { throw new MayaGatewayError('invalid-response') }
      return parseResult(input, decoded)
    }
    try { return await Promise.race([send(), interruption]) }
    catch (error) { throw error instanceof MayaGatewayError ? error : new MayaGatewayError('network') }
    finally { clearTimeout(timer!); signal?.removeEventListener('abort', cancel!) }
  }
  return { configured: url !== null, request }
}
