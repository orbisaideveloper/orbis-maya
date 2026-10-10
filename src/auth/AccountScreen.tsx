import { useRef, useState } from 'react'
import { text, useLocale } from '../i18n'
import { authStore, useAuth } from './store'
import { ui } from '../design/copy'
import Icon from '../design/Icon'
import { entryCopy } from './entry-copy'
import { requestRecovery,resetPassword } from './recovery'

function formText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : ''
}

export default function AccountScreen({reset=false}:Readonly<{reset?:boolean}>) {
  const locale = useLocale()
  const auth = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>(()=>new URLSearchParams(window.location.search).get('account-mode')==='signup'?'signup':'login')
  const [visible,setVisible]=useState(false)
  const [recover,setRecover]=useState(false)
  const [recoveryMessage,setRecoveryMessage]=useState('')
  const entry=entryCopy(locale),copy=ui(locale)
  const [busy, setBusy] = useState(false)
  const [logoutFailed,setLogoutFailed]=useState(false)
  const [message, setMessage] = useState<'authFailed' | 'confirmEmail' | 'validation' | null>(null)
  const form = useRef<HTMLFormElement>(null)
  const t = (key: Parameters<typeof text>[1]) => text(locale, key)

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const element = event.currentTarget
    const values = new FormData(element)
    const email = formText(values.get('email')).trim()
    const password = formText(values.get('password'))
    const name = formText(values.get('name')).trim()
    if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email) || !password ||
      (mode === 'signup' && (!name || password.length < 8 || password !== values.get('confirmation')))) {
      setMessage('validation')
      return
    }
    setBusy(true)
    setMessage(null)
    setLogoutFailed(false)
    const outcome = await authStore.submit(mode, email, password, name)
    element.reset()
    setBusy(false)
    const failureMessage=outcome === 'confirm'?'confirmEmail':'authFailed'
    setMessage(outcome === 'done'?null:failureMessage)
  }

  async function logout() {
    setLogoutFailed(false)
    setBusy(true)
    const outcome = await authStore.logout()
    setBusy(false)
    setLogoutFailed(outcome === 'failed')
    setMessage(null)
  }

  async function submitRecovery(event:React.SubmitEvent<HTMLFormElement>){
    event.preventDefault()
    if(busy)return
    const element=event.currentTarget,values=new FormData(element)
    const email=formText(values.get('email')).trim(),password=formText(values.get('password'))
    if(reset?(password.length<8||password!==values.get('confirmation')):!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email)){setMessage('validation');return}
    setBusy(true);setMessage(null);setRecoveryMessage('')
    const done=await (reset?resetPassword(password):requestRecovery(email))
    element.reset();setBusy(false)
    if(done)setRecoveryMessage(reset?entry.passwordSaved:entry.sent)
    else setMessage('authFailed')
  }

  function recoveryContent(){
    const submitLabel=reset?entry.savePassword:entry.send
    return <>
      <p>{reset?entry.newPassword:entry.recover}</p>
      {reset&&auth.phase!=='signed-in'?<output>{entry.resetLogin}</output>:<form noValidate onSubmit={event=>{void submitRecovery(event)}}>
        {reset?<><label>{entry.newPassword}<input name="password" type="password" autoComplete="new-password" maxLength={256} disabled={busy}/></label><label>{t('confirmPassword')}<input name="confirmation" type="password" autoComplete="new-password" maxLength={256} disabled={busy}/></label></>:<label>{t('email')}<input name="email" type="email" autoComplete="email" maxLength={254} disabled={busy}/></label>}
        <button type="submit" className="primary-action" disabled={busy}>{busy?t('busy'):submitLabel}</button>
      </form>}
      <button type="button" disabled={busy} onClick={()=>{setRecover(false);setMessage(null);setRecoveryMessage('');window.location.hash='/account'}}>{t('login')}</button>
    </>
  }

  function loginContent(){
    return <>
        <p className="entry-intro">{mode==='login'?entry.intro:entry.create}</p>
        <div className="auth-modes">
          {(['login', 'signup'] as const).map((option) => <button type="button" key={option}
            disabled={busy} aria-pressed={mode === option} onClick={() => { form.current!.reset(); setMode(option); setMessage(null); setVisible(false) }}>{t(option)}</button>)}
        </div>
        <form ref={form} noValidate onSubmit={(event) => { void submit(event) }}>
          {mode === 'signup' && <label>{t('name')}<input name="name" autoComplete="name" maxLength={120} required disabled={busy} /></label>}
          <label>{t('email')}<input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required disabled={busy} /></label>
          <div className="password-field"><label>{t('password')}<input name="password" type={visible?'text':'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} maxLength={256} required disabled={busy} /></label><button type="button" className="password-toggle" aria-label={visible?entry.hide:entry.show} aria-pressed={visible} disabled={busy} onClick={()=>setVisible(!visible)}><Icon name={visible?'eyeOff':'eye'}/></button></div>
          {mode === 'signup' && <label>{t('confirmPassword')}<input name="confirmation" type="password" autoComplete="new-password" maxLength={256} required disabled={busy} /></label>}
          <button type="submit" className="primary-action" disabled={busy}>{busy ? t('busy') : t(mode)}</button>
        </form>
        <button type="button" className="recovery-link" disabled={busy} onClick={()=>{form.current?.reset();setMessage(null);setRecover(true);setVisible(false)}}>{entry.forgot}</button>
    </>
  }

  function accountContent() {
    if (auth.phase === 'unconfigured') return <output>{t('unconfigured')}</output>
    if (auth.phase === 'checking') return <output>{t('checking')}</output>
    if (auth.phase === 'error') return <div role="alert"><p>{t('authFailed')}</p><button type="button" onClick={() => { void authStore.verify() }}>{t('retry')}</button></div>
    if(reset||recover)return recoveryContent()
    if (auth.phase === 'signed-in') return <>
      <p>{t('signedIn')}</p><p className="account-email">{auth.user!.email}</p>
      <button type="button" disabled={busy} onClick={() => { void logout() }}>{busy ? t('busy') : t('logout')}</button>
    </>
    return loginContent()
  }

  return <section className="account-screen" aria-labelledby="account-title">
    <a className="icon-button entry-back" href="#/welcome" aria-label={t('back')}><Icon name="back"/></a>
    <div className="entry-brand"><img src="/brand/orbis-maya.png" alt=""/><strong>{copy.title}</strong></div>
    <p className="entry-welcome">{entry.again}</p>
    <div className="glass account-crystal">
    <h1 id="account-title">{t('accountTitle')}</h1>
    {accountContent()}
    {logoutFailed&&<p role="alert">{t('authFailed')}</p>}
    {recoveryMessage&&<output className="status-message">{recoveryMessage}</output>}
    {message === 'confirmEmail' && <output>{t(message)}</output>}
    {message && message !== 'confirmEmail' && (auth.phase!=='signed-in'||recover||reset) && <p role="alert">{t(message)}</p>}
    <p className="account-boundary">{entry.identity}</p>
    <a className="journey-action" href="#/">{t('back')}</a>
    </div>
  </section>
}
