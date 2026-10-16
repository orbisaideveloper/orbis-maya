import { lazy, Suspense, useEffect, useRef, useSyncExternalStore } from 'react'
import RouteBoundary from './RouteBoundary'
import ScreenState from './ScreenState'
import { destinations, readLocation, subscribeToLocation } from './navigation'
import { text, useLocale,type Locale } from './i18n'
import { useAuth } from './auth/store'
import AccountScreen from './auth/AccountScreen'
import WelcomeScreen from './auth/WelcomeScreen'
import ProfilePanel from './profile/ProfilePanel'
import FeatureScreen from './FeatureScreen'
import HomeScreen from './design/HomeScreen'
import DesignScreen from './design/DesignScreen'
import BottomNav from './design/BottomNav'
import Icon from './design/Icon'
import ChatTools from './chat/ChatTools'
import { useTheme } from './design/theme'
import { ui, features } from './design/copy'
import './App.css'
const DreamScreen=lazy(()=>import('./DreamScreen'))
const ChatScreen=lazy(()=>import('./ChatScreen'))
const HistoryScreen=lazy(()=>import('./HistoryScreen'))
const Workspace=lazy(()=>import('./design/Workspace'))

type ScreenAuth=ReturnType<typeof useAuth>
type ScreenCopy=ReturnType<typeof ui>
const authenticatedPaths=new Set(['/dream','/astro','/chat','/history','/profile'])
function routeTitle(path:string,locale:Locale,copy:ScreenCopy){
 const destination=destinations.find(item=>item.path===path)
 if(destination)return text(locale,`${destination.key}Title`)
 switch(path){
  case '/profile':return copy.profile
  case '/today':return copy.today
  case '/notifications':return copy.notifications
  case '/workspace':return copy.workspace
  case '/welcome':return copy.title
  case '/reset-password':return text(locale,'accountTitle')
  default:return text(locale,'notFound')
 }
}
function headerLabel(path:string,locale:Locale,copy:ScreenCopy){
 if(path==='/profile')return copy.profile
 const feature=features.find(item=>item.path===path)
 if(feature)return copy[feature.key]
 if(path==='/notifications')return copy.notifications
 if(path==='/workspace')return copy.workspace
 return text(locale,'account')
}
function routeScreen(path:string,preview:boolean,auth:ScreenAuth){
 if(preview&&['/dream','/astro','/chat','/history'].includes(path))return <DesignScreen path={path} preview/>
 if(authenticatedPaths.has(path)&&auth.phase!=='signed-in'&&!preview)return <AccountScreen/>
 switch(path){
  case '/':return preview||auth.phase==='signed-in'?<HomeScreen/>:<WelcomeScreen/>
  case '/welcome':return <WelcomeScreen/>
  case '/dream':return <DreamScreen key={auth.user!.id} userId={auth.user!.id}/>
  case '/history':return <HistoryScreen key={auth.user!.id} userId={auth.user!.id}/>
  case '/chat':return <ChatScreen key={auth.user!.id} userId={auth.user!.id}/>
  case '/astro':case '/settings':return <FeatureScreen path={path}/>
  case '/profile':return <ProfilePanel/>
  case '/today':case '/notifications':return <DesignScreen path={path}/>
  case '/account':return <AccountScreen key={path}/>
  case '/reset-password':return <AccountScreen key={path} reset/>
  case '/workspace':return <Workspace/>
  default:return <ScreenState kind="not-found"/>
 }
}

function frameClasses(path:string,theme:string,account:boolean,welcome:boolean){
 return ['maya-shell',`theme-${theme}`,path==='/workspace'?'workspace-shell':'',account||welcome?'entry-shell':'',(path==='/chat'||path==='/dream')&&!account?'conversation-shell':''].join(' ')
}
export default function App() {
  const locale=useLocale(),auth=useAuth(),theme=useTheme(),copy=ui(locale)
  const path=useSyncExternalStore(subscribeToLocation,readLocation)
  const main=useRef<HTMLElement>(null)
  const previousPhase=useRef(auth.phase)
  useEffect(()=>{
    const loggedOut=previousPhase.current==='signed-in'&&auth.phase==='signed-out'
    const loggedIn=auth.phase==='signed-in'&&(path==='/welcome'||(path==='/account'&&previousPhase.current==='signed-out'))
    if(auth.phase==='signed-in'||auth.phase==='signed-out')previousPhase.current=auth.phase
    if(!loggedOut&&!loggedIn)return
    const url=new URL(window.location.href)
    if(loggedOut){url.searchParams.delete('maya-design');url.hash='/account'}
    else url.hash='/'
    window.history.replaceState(null,'',url)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  },[auth.phase,path])
  const workspaceEnabled=import.meta.env.DEV || import.meta.env.VITE_MAYA_DESIGN_WORKSPACE==='1'
  const preview=workspaceEnabled&&new URLSearchParams(window.location.search).get('maya-design')==='1'
  useEffect(()=>{
    const title=routeTitle(path,locale,copy)
    document.title=`Orbis Astro · ${title}`
    document.documentElement.lang=locale
    document.documentElement.dataset.theme=theme
    document.documentElement.scrollTop=0
    document.body.scrollTop=0
    main.current?.focus()
  },[path,locale,theme,copy])
  const pageLabel=headerLabel(path,locale,copy)
  const screen=routeScreen(path,preview,auth)
  const accountView=path==='/account'||path==='/reset-password'||(!preview&&authenticatedPaths.has(path)&&auth.phase!=='signed-in')
  const welcomeView=path==='/welcome'||(path==='/'&&!preview&&auth.phase!=='signed-in')
  return <div className={frameClasses(path,theme,accountView,welcomeView)}>
    <button className="skip-link" type="button" onClick={()=>main.current!.focus()}>{text(locale,'skip')}</button>
    {path!=='/'&&!accountView&&!welcomeView&&<header className="app-header crystal-header"><a href="#/" className="icon-button" aria-label={text(locale,'back')}><Icon name="back"/></a><img src="/brand/orbis-maya.png" alt=""/><div className="header-brand"><strong>{copy.title}</strong><small>{pageLabel}</small></div>
      {path==='/chat'&&auth.phase==='signed-in'&&!preview?<ChatTools key={auth.user!.id} userId={auth.user!.id}/>:<a href="#/notifications" className="icon-button" aria-label={copy.notifications}><Icon name="bell"/></a>}</header>}
    <main id="maya-content" ref={main} tabIndex={-1}><RouteBoundary key={path}><Suspense fallback={<ScreenState kind="loading"/>}>{screen}</Suspense></RouteBoundary></main>
    {path!=='/workspace'&&!accountView&&!welcomeView&&<BottomNav path={path}/>}
  </div>
}
