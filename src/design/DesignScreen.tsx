import { useLocale, text } from '../i18n'
import { ui, features } from './copy'
import Artwork from './Artwork'
import ChatComposer from './ChatComposer'
import AstroPanel from './AstroPanel'
import Icon from './Icon'
import ThemeSelector from './ThemeSelector'
import LanguagePicker from '../LanguagePicker'
import AccountSummary from '../profile/AccountSummary'
export default function DesignScreen({path,preview=false}:Readonly<{path:string;preview?:boolean}>) {
  const locale=useLocale(),copy=ui(locale)
  const feature=features.find(feature=>feature.path===path)
  const key=feature?.key ?? 'settings'
  return <section className={`feature-screen design-screen design-${key}`} aria-labelledby="feature-title">
    <div className={`feature-hero ${path==='/chat'||path==='/dream'?'conversation-heading':''}`}><h1 id="feature-title">{feature?copy[key]:copy.notifications}</h1>
      <p>{feature?copy[feature.body]:copy.noNotifications}</p>{!['/chat','/dream','/settings'].includes(path)&&<Artwork name={key}/>}</div>
    {preview&&!['/chat','/dream'].includes(path)&&<output className="preview-status status-message">{copy.designOnly}</output>}
    {path==='/dream'&&<ChatComposer key={locale} mode="dream"/>}
    {path==='/astro'&&<AstroPanel/>}
    {path==='/chat'&&<ChatComposer/>}
    {path==='/history'&&<section className="glass inner-panel"><Icon name="saved"/><h2>{copy.savedEmpty}</h2><p>{copy.savedLogin}</p><a className="primary-action" href="#/account">{text(locale,'login')}</a></section>}
    {path==='/today'&&<section className="glass inner-panel"><Icon name="today"/><h2>{copy.guidanceEmpty}</h2><p>{copy.pending}</p></section>}
    {path==='/notifications'&&<section className="glass inner-panel"><p>{copy.noNotifications}</p><p>{copy.notificationsBody}</p></section>}
    {path==='/settings'&&<section className="glass inner-panel"><AccountSummary/><a className="settings-profile-link settings-row" href="#/profile">{copy.profile}<Icon name="arrow"/></a><ThemeSelector/><LanguagePicker/>
      <details className="settings-row"><summary>{copy.notifications}</summary><p>{copy.notificationsBody}</p></details>
      <details className="settings-row"><summary>{copy.privacy}</summary><p>{copy.privacyBody}</p></details>
    </section>}
  </section>
}
