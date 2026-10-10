import { useState } from 'react'
import { text, useLocale } from '../i18n'
import { useAuth } from '../auth/store'
import { features, ui } from './copy'
import Artwork from './Artwork'
import Icon from './Icon'
import { useProfile } from '../profile/store'
import { usePhoto } from '../profile/photo'
export default function HomeScreen() {
  const locale=useLocale(), auth=useAuth(), copy=ui(locale)
  const [avatarFailed,setAvatarFailed]=useState(false)
  const {profile,scope}=useProfile()
  const localPhoto=usePhoto(scope)
  const metadata=auth.user?.user_metadata
  const displayName=profile.name||(typeof metadata?.display_name==='string'?metadata.display_name:'ORBIS')
  const rawAvatar=metadata?.avatar_url ?? metadata?.picture
  const avatar=localPhoto|| (typeof rawAvatar==='string'&&rawAvatar.startsWith('https://')&&!avatarFailed?rawAvatar:'/brand/orbis-maya.png')
  const now=new Date(), hour=now.getHours()
  const laterGreeting=hour<17?copy.afternoon:copy.evening
  const greeting=hour<12?copy.morning:laterGreeting
  const date=new Intl.DateTimeFormat(`${locale}-IN`,{day:'numeric',month:'long',year:'numeric'}).format(now)
  return <section className="dashboard-home" aria-labelledby="maya-title">
    <header className="dashboard-topbar"><div className="dashboard-profile">
      <img className="dashboard-avatar" src={avatar} alt="" onError={()=>setAvatarFailed(true)}/>
      <div><p className="dashboard-greeting">{greeting},<br/>{displayName}</p><p className="dashboard-date">{date}</p></div>
    </div><div className="header-actions"><a href="#/notifications" className="icon-button" aria-label={copy.notifications}><Icon name="bell"/></a></div></header>
    <div className="dashboard-brand"><Artwork name="planet"/><h1 id="maya-title">{copy.title}</h1><p>{copy.subtitle}</p></div>
    <section className="dashboard-insight glass" aria-labelledby="insight-title"><Artwork name="orb"/><div className="insight-copy">
      <p className="eyebrow">{copy.insight}</p><h2 id="insight-title">{copy.waiting}</h2><p>{copy.waitingBody}</p>
      <button className="primary-action" type="button" disabled>{copy.analysis}<Icon name="arrow"/></button>
    </div></section>
    <section className="dashboard-grid" aria-label={text(locale,'experiences')}>{features.map(feature=><a className={`dashboard-card glass card-${feature.key}`} href={`#${feature.path}`} key={feature.path}>
      <Artwork name={feature.key}/><div><h2>{copy[feature.key]}</h2><p>{copy[feature.body]}</p></div><Icon name="arrow"/>
    </a>)}</section>
  </section>
}
