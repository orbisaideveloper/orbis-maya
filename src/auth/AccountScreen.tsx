import { useRef, useState } from 'react'
import { text, useLocale } from '../i18n'
import { authStore, useAuth } from './store'

export default function AccountScreen() {
  const locale = useLocale()
  const auth = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<'authFailed' | 'confirmEmail' | 'validation' | null>(null)
  const form = useRef<HTMLFormElement>(null)
  const t = (key: Parameters<typeof text>[1]) => text(locale, key)

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const element = event.currentTarget
    const values = new FormData(element)
    const email = String(values.get('email')).trim()
    const password = String(values.get('password'))
    const name = String(values.get('name') ?? '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password ||
      (mode === 'signup' && (!name || password.length < 8 || password !== values.get('confirmation')))) {
      setMessage('validation')
      return
    }
    setBusy(true)
    setMessage(null)
    const outcome = await authStore.submit(mode, email, password, name)
    element.reset()
    setBusy(false)
    if (outcome !== 'done') setMessage(outcome === 'confirm' ? 'confirmEmail' : 'authFailed')
  }

  async function logout() {
    setBusy(true)
    const outcome = await authStore.logout()
    setBusy(false)
    setMessage(outcome === 'failed' ? 'authFailed' : null)
  }

  return <section className="journey-card account-screen" aria-labelledby="account-title">
    <h1 id="account-title">{t('accountTitle')}</h1>
    {auth.phase === 'unconfigured' ? <p role="status">{t('unconfigured')}</p>
      : auth.phase === 'checking' ? <p role="status">{t('checking')}</p>
      : auth.phase === 'error' ? <div role="alert"><p>{t('authFailed')}</p><button type="button" onClick={() => { void authStore.verify() }}>{t('retry')}</button></div>
      : auth.phase === 'signed-in' ? <>
        <p>{t('signedIn')}</p><p className="account-email">{auth.user!.email}</p>
        <button type="button" disabled={busy} onClick={() => { void logout() }}>{busy ? t('busy') : t('logout')}</button>
      </> : <>
        <p>{t('authIntro')}</p>
        <div className="auth-modes">
          {(['login', 'signup'] as const).map((option) => <button type="button" key={option}
            disabled={busy} aria-pressed={mode === option} onClick={() => { form.current!.reset(); setMode(option); setMessage(null) }}>{t(option)}</button>)}
        </div>
        <form ref={form} noValidate onSubmit={(event) => { void submit(event) }}>
          {mode === 'signup' && <label>{t('name')}<input name="name" autoComplete="name" maxLength={120} required disabled={busy} /></label>}
          <label>{t('email')}<input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required disabled={busy} /></label>
          <label>{t('password')}<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} maxLength={256} required disabled={busy} /></label>
          {mode === 'signup' && <label>{t('confirmPassword')}<input name="confirmation" type="password" autoComplete="new-password" maxLength={256} required disabled={busy} /></label>}
          <button type="submit" disabled={busy}>{busy ? t('busy') : t(mode)}</button>
        </form>
      </>}
    {message && <p role={message === 'confirmEmail' ? 'status' : 'alert'}>{t(message)}</p>}
    <a className="journey-action" href="#/">{t('back')}</a>
  </section>
}
