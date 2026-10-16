import { useEffect, useState } from 'react'
import { useLocale } from '../i18n'
import { loadOrbisIdentity } from './orbis-identity'

const copy = {
  bn: { label: 'আপনার Orbis ID', checking: 'Orbis ID যাচাই হচ্ছে…', failed: 'Orbis ID এখন পাওয়া যাচ্ছে না।', retry: 'Orbis ID আবার যাচাই করুন' },
  en: { label: 'Your Orbis ID', checking: 'Checking Orbis ID…', failed: 'Orbis ID is unavailable right now.', retry: 'Retry Orbis ID' },
  hi: { label: 'आपकी Orbis ID', checking: 'Orbis ID की जाँच हो रही है…', failed: 'अभी Orbis ID उपलब्ध नहीं है।', retry: 'Orbis ID फिर जाँचें' },
}

type Loader = typeof loadOrbisIdentity
export function OrbisIdentity({ userId, load = loadOrbisIdentity }: Readonly<{ userId: string; load?: Loader }>) {
  const locale = useLocale()
  const labels = copy[locale]
  const [result, setResult] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    void load(userId, controller.signal).then(value => {
      if (active) setResult(value)
    }).catch(() => {
      if (active) setFailed(true)
    }).finally(() => clearTimeout(timer))
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [userId, load, attempt])
  let content = <p>{labels.checking}</p>
  if (result) content = <p>{labels.label}: <strong>{result}</strong></p>
  else if (failed) content = <>
    <p>{labels.failed}</p>
    <button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1) }}>{labels.retry}</button>
  </>
  return <section aria-label={labels.label} aria-live="polite">{content}</section>
}
