import { describe, expect, it, vi } from 'vitest'
import { createMayaGateway, MayaGatewayError } from '../src/ai/gateway'

const URL = 'https://foundation.example/api/maya/request'
const input = { version: 'maya.v1', capability: 'general.chat', language: 'bn', input: { messages: [{ role: 'user', content: 'হ্যালো' }] } } as const
const request = () => ({ ...input, input: { messages: [{ role: 'user' as const, content: 'হ্যালো' }] } })
const success = (result: unknown = { reply: '  হ্যালো  ' }) => ({ version: 'maya.v1', success: true, capability: 'general.chat', language: 'bn', result })
const response = (value: unknown, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(value) }) as Response
function setup(url: string | undefined = URL) {
  const getToken = vi.fn().mockResolvedValue('user.token.signature')
  const transport = vi.fn<typeof fetch>().mockResolvedValue(response(success()))
  const gateway = createMayaGateway({ url, getToken, fetch: transport, timeoutMs: 10 })
  return { gateway, getToken, transport }
}

describe('Maya Foundation transport', () => {
  it.each([undefined, '', 'invalid', 'http://remote.example/api/maya/request', 'https://user:pass@foundation.example/api/maya/request', 'https://:pass@foundation.example/api/maya/request', 'file:///api/maya/request', URL + '?secret=x', URL + '#token', 'https://foundation.example/api/chat'])('rejects unsafe/missing endpoint %s', async (url) => {
    const fixture = setup(url === undefined ? '' : url)
    expect(fixture.gateway.configured).toBe(false)
    await expect(fixture.gateway.request(request())).rejects.toMatchObject({ code: 'unconfigured' })
    expect(fixture.getToken).not.toHaveBeenCalled()
  })

  it.each(['localhost', '127.0.0.1', '[::1]'])('supports explicit local Foundation origin %s', (host) => {
    expect(setup(`http://${host}:3001/api/maya/request`).gateway.configured).toBe(true)
  })

  it('sends only gateway requests with transient bearer tokens and no cookies', async () => {
    const fixture = setup()
    expect(await fixture.gateway.request(request())).toEqual({ reply: 'হ্যালো' })
    expect(fixture.transport).toHaveBeenCalledWith(URL, expect.objectContaining({
      method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store',
      headers: { Authorization: 'Bearer user.token.signature', 'Content-Type': 'application/json' },
      body: JSON.stringify(request()),
    }))
    expect(new MayaGatewayError('network').message).toBe('network')
  })

  it('reads the latest token for every request without retaining credentials', async () => {
    const fixture = setup()
    await fixture.gateway.request(request())
    fixture.getToken.mockResolvedValueOnce('next.token')
    await fixture.gateway.request(request())
    expect(fixture.getToken).toHaveBeenCalledTimes(2)
    expect(fixture.transport.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer next.token' })
  })

  it.each([null, '', 'bad\r\nheader'])('rejects unavailable or invalid tokens', async (token) => {
    const fixture = setup(); fixture.getToken.mockResolvedValueOnce(token)
    await expect(fixture.gateway.request(request())).rejects.toMatchObject({ code: 'authentication' })
    expect(fixture.transport).not.toHaveBeenCalled()
  })

  it('hides identity and network exception details', async () => {
    const fixture = setup(); fixture.getToken.mockRejectedValueOnce(new Error('private'))
    await expect(fixture.gateway.request(request())).rejects.toThrow('authentication')
    fixture.transport.mockRejectedValueOnce(new Error('provider secret'))
    await expect(fixture.gateway.request(request())).rejects.toThrow('network')
  })

  it.each([[401, 'authentication'], [403, 'authorization'], [429, 'rate-limit'], [504, 'timeout'], [503, 'unavailable'], [400, 'invalid-input']])('normalizes HTTP %s without trusting server error text', async (status, code) => {
    const fixture = setup(); fixture.transport.mockResolvedValueOnce(response({ secret: 'never display' }, status as number))
    await expect(fixture.gateway.request(request())).rejects.toMatchObject({ code })
  })

  it('bounds request bytes and rejects circular payloads', async () => {
    const fixture = setup(); const large = request(); large.input.messages[0].content = 'অ'.repeat(12000)
    await expect(fixture.gateway.request(large)).rejects.toThrow('invalid-input')
    const circular = request(); Object.assign(circular, { self: circular })
    await expect(fixture.gateway.request(circular)).rejects.toThrow('invalid-input')
    expect(fixture.transport).not.toHaveBeenCalled()
  })

  it.each([null, [], {}, { ...success(), version: 'maya.v2' }, { ...success(), success: false }, { ...success(), capability: 'dream.analysis' }, { ...success(), language: 'hi' }, { ...success(), extra: true }, success(null), success({ reply: '' }), success({ reply: 7 }), success({ unknown: 'x' }), success({ reply: 'x'.repeat(8001) }), success({ reply: 'x', action: 'execute' })])('rejects malformed/cross-capability result %j', async (value) => {
    const fixture = setup(); fixture.transport.mockResolvedValueOnce(response(value))
    await expect(fixture.gateway.request(request())).rejects.toThrow('invalid-response')
  })

  it('rejects invalid JSON and oversized successful responses', async () => {
    const fixture = setup()
    for (const value of ['not JSON', 'x'.repeat(65537)]) {
      fixture.transport.mockResolvedValueOnce({ ok: true, text: async () => value } as Response)
      await expect(fixture.gateway.request(request())).rejects.toThrow('invalid-response')
    }
  })

  it('validates every field of the structured Dream contract', async () => {
    const fixture = setup()
    const dream = { version: 'maya.v1' as const, capability: 'dream.analysis' as const, language: 'bn' as const, input: { dream: 'নদী' } }
    const result = { symbols: ['নদী'], themes: ['পরিবর্তন'], emotions: ['কৌতূহল'], interpretation: 'সম্ভাব্য ব্যাখ্যা', reflectionQuestions: ['আপনার কাছে নদীর অর্থ কী?'] }
    const envelope = (value: unknown) => ({ ...success(value), capability: 'dream.analysis' })
    fixture.transport.mockResolvedValueOnce(response(envelope(result)))
    expect(await fixture.gateway.request(dream)).toEqual(result)
    for (const key of Object.keys(result)) {
      const bad = { ...result, [key]: key === 'interpretation' ? '' : [] }
      fixture.transport.mockResolvedValueOnce(response(envelope(bad)))
      await expect(fixture.gateway.request(dream)).rejects.toThrow('invalid-response')
    }
    for (const bad of [{ ...result, extra: true }, { ...result, symbols: Array(13).fill('x') }, { ...result, symbols: ['x'.repeat(501)] }, { ...result, themes: 'invalid' }, { ...result, interpretation: 'x'.repeat(6001) }, { ...result, reflectionQuestions: Array(6).fill('x') }]) {
      fixture.transport.mockResolvedValueOnce(response(envelope(bad)))
      await expect(fixture.gateway.request(dream)).rejects.toThrow('invalid-response')
    }
  })

  it('cancels before or during a request', async () => {
    const fixture = setup(); const controller = new AbortController(); controller.abort()
    await expect(fixture.gateway.request(request(), controller.signal)).rejects.toThrow('cancelled')
    const active = new AbortController(); fixture.transport.mockReturnValueOnce(new Promise(() => {}))
    const pending = fixture.gateway.request(request(), active.signal)
    active.abort()
    await expect(pending).rejects.toThrow('cancelled')
  })

  it('times out identity, transport and response reading', async () => {
    const fixture = setup()
    fixture.getToken.mockReturnValueOnce(new Promise(() => {}))
    await expect(fixture.gateway.request(request())).rejects.toThrow('timeout')
    fixture.transport.mockReturnValueOnce(new Promise(() => {}))
    await expect(fixture.gateway.request(request())).rejects.toThrow('timeout')
    fixture.transport.mockResolvedValueOnce({ ok: true, text: () => new Promise(() => {}) } as Response)
    await expect(fixture.gateway.request(request())).rejects.toThrow('timeout')
  })

  it('does not send after cancellation while identity lookup finishes', async () => {
    const fixture = setup(); let release!: (value: string) => void
    fixture.getToken.mockReturnValueOnce(new Promise<string>((resolve) => { release = resolve }))
    const controller = new AbortController(); const pending = fixture.gateway.request(request(), controller.signal)
    controller.abort(); await expect(pending).rejects.toThrow('cancelled')
    release('valid.token'); await Promise.resolve()
    expect(fixture.transport).not.toHaveBeenCalled()
  })

  it('supports the default browser transport and deadline settings', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(response(success()))
    vi.stubGlobal('fetch', transport)
    try {
      const gateway = createMayaGateway({ url: URL, getToken: async () => 'token' })
      expect(await gateway.request(request())).toEqual({ reply: 'হ্যালো' })
    } finally { vi.unstubAllGlobals() }
  })
})
