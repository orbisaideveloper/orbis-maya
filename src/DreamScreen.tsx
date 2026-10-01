import { useEffect, useRef, useState } from 'react'
import { text, useLocale, type Locale } from './i18n'
import { createDreamDraft, dreamFields, emptyDream, validDream } from './dream/input'
import { createDreamService } from './dream/service'
import { responseLanguage, type DreamRecord } from './dream/record'
import { MayaGatewayError } from './ai/gateway'
import DreamResultView from './DreamResultView'

export default function DreamScreen({ userId }: { userId: string }) {
  const locale = useLocale()
  const [draft] = useState(() => createDreamDraft(userId))
  const [service] = useState(() => createDreamService(userId))
  const [input, setInput] = useState({ ...emptyDream })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [review, setReview] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [failure, setFailure] = useState<MayaGatewayError['code'] | null>(null)
  const [record, setRecord] = useState<DreamRecord | null>(null)
  const [resultSaved, setResultSaved] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [answerLanguage, setAnswerLanguage] = useState<Locale | null>(null)
  const request = useRef<AbortController | null>(null)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    let active = true
    draft.read().then((value) => { if (active) setInput(value) }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; mounted.current = false; request.current?.abort() }
  }, [draft])

  async function persist(clear: boolean) {
    setBusy(true); setError(false); setSaved(false)
    try {
      if (clear) await draft.clear()
      else await draft.save(input)
      if (mounted.current) {
        if (clear) { setInput({ ...emptyDream }); setReview(false); setInvalid(false); setRecord(null); setResultSaved(false); setSaveFailed(false) }
        else setSaved(true)
      }
    } catch { if (mounted.current) setError(true) }
    finally { if (mounted.current) setBusy(false) }
  }

  async function analyze() {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setAnalyzing(true); setFailure(null)
    try {
      const next = await service.analyze(input, answerLanguage ?? responseLanguage(input.dream, locale), controller.signal)
      if (mounted.current && !controller.signal.aborted) { setRecord(next); setResultSaved(false); setSaveFailed(false) }
    } catch (cause) {
      if (mounted.current && !controller.signal.aborted) setFailure(cause instanceof MayaGatewayError ? cause.code : 'network')
    } finally {
      if (request.current === controller) { request.current = null; if (mounted.current) setAnalyzing(false) }
    }
  }

  async function saveResult() {
    setBusy(true); setSaveFailed(false)
    try {
      await service.save(record!)
      if (mounted.current) setResultSaved(true)
    } catch { if (mounted.current) setSaveFailed(true) }
    finally { if (mounted.current) setBusy(false) }
  }

  return <section className="feature-screen dream-screen" aria-labelledby="dream-title" aria-busy={loading || busy || analyzing}>
    <p className="hero-kicker">{text(locale, 'dreamEyebrow')}</p>
    <h1 id="dream-title">{text(locale, 'dreamTitle')}</h1>
    <p className="hero-copy">{text(locale, 'dreamReflective')}</p>
    {loading && <p role="status">{text(locale, 'loading')}</p>}
    {error && <p role="alert">{text(locale, 'draftFailed')}</p>}
    {invalid && <p role="alert">{text(locale, 'dreamValidation')}</p>}
    {saved && <p role="status">{text(locale, 'draftSaved')}</p>}
    <form onSubmit={(event) => { event.preventDefault(); const valid = validDream(input); setInvalid(!valid); setReview(valid) }}>
      <fieldset disabled={loading || busy || analyzing}>
        <legend>{text(locale, 'dreamWrite')}</legend>
        {(Object.keys(dreamFields) as (keyof typeof dreamFields)[]).map((field) => <label key={field}>
          {text(locale, `input${field}`)}
          <textarea name={field} rows={field === 'dream' ? 6 : 2} maxLength={dreamFields[field]} value={input[field]} onChange={(event) => { setInput({ ...input, [field]: event.target.value }); setSaved(false); setReview(false); setInvalid(false) }} />
        </label>)}
        <button type="submit">{text(locale, 'reviewDream')}</button>
        <button type="button" onClick={() => { void persist(false) }}>{text(locale, busy ? 'busy' : 'saveDraft')}</button>
        <button type="button" onClick={() => { if (window.confirm(text(locale, 'discardConfirm'))) void persist(true) }}>{text(locale, 'discardDraft')}</button>
      </fieldset>
    </form>
    {review && <div className="journey-card feature-notice" role="region" aria-label={text(locale, 'reviewDream')}>
      <p className="history-content">{input.dream.trim()}</p>
      <p>{text(locale, service.configured ? 'analysisConsent' : 'analysisPending')}</p>
      <label>{text(locale, 'answerLanguage')}<select disabled={analyzing || busy} value={answerLanguage ?? responseLanguage(input.dream, locale)} onChange={(event) => setAnswerLanguage(event.target.value as Locale)}>
        <option value="bn">বাংলা</option><option value="en">English</option><option value="hi">हिन्दी</option>
      </select></label>
      <button type="button" disabled={analyzing || busy} onClick={() => setReview(false)}>{text(locale, 'editDream')}</button>
      <button type="button" disabled={!service.configured || analyzing || busy} onClick={() => { void analyze() }}>{text(locale, 'analyzeDream')}</button>
    </div>}
    {analyzing && <div><p role="status">{text(locale, 'analyzingDream')}</p><button type="button" onClick={() => { request.current!.abort(); request.current = null; setAnalyzing(false); setFailure('cancelled') }}>{text(locale, 'cancel')}</button></div>}
    {failure && <p role="alert">{text(locale, `gateway${failure}`)}</p>}
    {record && <><DreamResultView record={record} />
      {saveFailed && <p role="alert">{text(locale, 'resultSaveFailed')}</p>}
      {resultSaved && <p role="status">{text(locale, 'resultSaved')}</p>}
      <button type="button" disabled={busy || analyzing || resultSaved} onClick={() => { void saveResult() }}>{text(locale, 'saveResult')}</button>
      <a href="#/history">{text(locale, 'history')}</a>
    </>}
    <a className="journey-action" href="#/">{text(locale, 'back')}</a>
  </section>
}
