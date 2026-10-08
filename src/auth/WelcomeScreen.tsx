import { useLocale } from '../i18n'
import { ui } from '../design/copy'
import Icon from '../design/Icon'
import LanguagePicker from '../LanguagePicker'
import { useAuth } from './store'
import { entryCopy } from './entry-copy'
export default function WelcomeScreen(){
 const locale=useLocale(),copy=ui(locale),entry=entryCopy(locale),auth=useAuth()
 return <section className="welcome-screen" aria-labelledby="welcome-title">
  <div className="entry-brand"><img src="/brand/orbis-maya.png" alt=""/><h1 id="welcome-title">{copy.title}</h1></div>
  <p className="entry-tagline">{entry.welcome}</p>
  <div className="welcome-features">{(['dream','astro','chat'] as const).map(key=><div className="glass" key={key}><Icon name={key}/><span>{copy[key]}</span></div>)}</div>
  <a className="primary-action" href={auth.phase==='signed-in'?'#/':'#/account'}>{auth.phase==='signed-in'?entry.home:entry.intro}<Icon name="arrow"/></a>
  <a className="entry-secondary glass" href="?account-mode=signup#/account">{entry.create}</a>
  <LanguagePicker/>
  {(import.meta.env.DEV||import.meta.env.VITE_MAYA_DESIGN_WORKSPACE==='1')&&<small className="entry-preview">{entry.preview}</small>}
 </section>
}
