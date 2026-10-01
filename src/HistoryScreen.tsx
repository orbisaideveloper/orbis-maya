import { useEffect, useRef, useState } from 'react'
import { text, useLocale } from './i18n'
import { createLocalHistory } from './storage/history'
import HistoryContent from './HistoryContent'

type History = ReturnType<typeof createLocalHistory>
type Entry = Awaited<ReturnType<History['list']>>[number]

export default function HistoryScreen({ userId }: { userId: string }) {
  const locale = useLocale()
  const [history] = useState(() => createLocalHistory(userId))
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmation, setConfirmation] = useState<Entry | 'all' | null>(null)
  const [attempt, setAttempt] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    let active = true
    history.list().then((saved) => {
      if (active) { setEntries(saved); setLoading(false); setFailed(false) }
    }).catch(() => {
      if (active) { setLoading(false); setFailed(true) }
    })
    return () => { active = false; mounted.current = false }
  }, [history, attempt])

  async function confirm() {
    setBusy(true); setFailed(false)
    try {
      if (confirmation === 'all') await history.clear()
      else await history.repository(confirmation!.kind).remove(confirmation!.id)
      const saved = await history.list()
      if (mounted.current) { setEntries(saved); setConfirmation(null) }
    } catch {
      if (mounted.current) setFailed(true)
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  return <section className="feature-screen history-screen" aria-labelledby="history-title" aria-busy={loading || busy}>
    <p className="hero-kicker">{text(locale, 'historyEyebrow')}</p>
    <h1 id="history-title">{text(locale, 'historyTitle')}</h1>
    <p className="hero-copy">{text(locale, 'localOnly')}</p>
    {loading && <p role="status">{text(locale, 'loading')}</p>}
    {failed && <div role="alert"><p>{text(locale, 'historyFailed')}</p>
      <button type="button" disabled={busy} onClick={() => { setLoading(true); setFailed(false); setAttempt((value) => value + 1) }}>{text(locale, 'retry')}</button>
    </div>}
    {!loading && !failed && entries.length === 0 && <p role="status">{text(locale, 'historyEmpty')}</p>}
    <ul className="history-list">
      {entries.map((entry) => <li className="journey-card" key={`${entry.kind}:${entry.id}`}>
        <p className="card-eyebrow">{text(locale, entry.kind)} · <time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleDateString(locale)}</time></p>
        <details><summary>{entry.title}</summary><HistoryContent kind={entry.kind} content={entry.content} /></details>
        <button type="button" disabled={busy || loading} aria-label={`${text(locale, 'deleteRecord')} ${entry.title}`} onClick={() => setConfirmation(entry)}>{text(locale, 'deleteRecord')}</button>
      </li>)}
    </ul>
    {entries.length > 0 && <button type="button" disabled={busy || loading} onClick={() => setConfirmation('all')}>{text(locale, 'clearHistory')}</button>}
    {confirmation && <div className="journey-card history-confirm" role="group" aria-label={text(locale, 'confirmDelete')}>
      <p>{confirmation === 'all' ? text(locale, 'clearConfirm') : `${text(locale, 'deleteConfirm')} ${confirmation.title}`}</p>
      <button type="button" disabled={busy} onClick={() => { void confirm() }}>{text(locale, busy ? 'busy' : 'confirmDelete')}</button>
      <button type="button" disabled={busy} onClick={() => setConfirmation(null)}>{text(locale, 'cancel')}</button>
    </div>}
    <a className="journey-action" href="#/">{text(locale, 'back')}</a>
  </section>
}
