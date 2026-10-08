import { lazy, Suspense, useEffect, useRef, useSyncExternalStore } from 'react'
import RouteBoundary from './RouteBoundary'
import ScreenState from './ScreenState'
import { destinations, readLocation, subscribeToLocation } from './navigation'
import { text, useLocale } from './i18n'
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
export default function App() {
  const locale=useLocale(),auth=useAuth(),theme=useTheme(),copy=ui(locale)
  const path=useSyncExternalStore(subscribeToLocation,readLocation)
  const main=useRef<HTMLElement>(null)
  const previousPhase=useRef(auth.phase)
  useEffect(()=>{
    const loggedOut=previousPhase.current==='signed-in'&&auth.phase==='signed-out'
    if(auth.phase==='signed-in'||auth.phase==='signed-out')previousPhase.current=auth.phase
    const loggedIn=auth.phase==='signed-in'&&['/account','/welcome'].includes(path)
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
    const destination=destinations.find(item=>item.path===path)
    const title=destination?text(locale,`${destination.key}Title`):path==='/profile'?(locale==='bn'?'প্রোফাইল':locale==='hi'?'प्रोफ़ाइल':'Profile'):path==='/today'?copy.today:path==='/notifications'?copy.notifications:path==='/workspace'?copy.workspace:path==='/welcome'?copy.title:path==='/reset-password'?text(locale,'accountTitle'):text(locale,'notFound')
    document.title=`Orbis Astro · ${title}`
    document.documentElement.lang=locale
    document.documentElement.dataset.theme=theme
    document.documentElement.scrollTop=0
    document.body.scrollTop=0
    main.current?.focus()
  },[path,locale,theme,copy])
  const currentFeature=features.find(feature=>feature.path===path)
  const profileLabel=locale==='bn'?'প্রোফাইল':locale==='hi'?'प्रोफ़ाइल':'Profile'
  const pageLabel=path==='/profile'?profileLabel:currentFeature?copy[currentFeature.key]:path==='/notifications'?copy.notifications:path==='/workspace'?copy.workspace:text(locale,'account')
  let screen
  if(preview&&['/dream','/astro','/chat','/history'].includes(path)) screen=<DesignScreen path={path} preview/>
  else switch(path){
    case '/': screen=preview||auth.phase==='signed-in'?<HomeScreen/>:<WelcomeScreen/>;break
    case '/welcome':screen=<WelcomeScreen/>;break
    case '/dream': screen=auth.phase==='signed-in'?<DreamScreen key={auth.user!.id} userId={auth.user!.id}/>:<AccountScreen/>;break
    case '/history': screen=auth.phase==='signed-in'?<HistoryScreen key={auth.user!.id} userId={auth.user!.id}/>:<AccountScreen/>;break
    case '/chat':screen=auth.phase==='signed-in'?<ChatScreen key={auth.user!.id} userId={auth.user!.id}/>:<AccountScreen/>;break
    case '/astro': screen=auth.phase==='signed-in'?<FeatureScreen path={path}/>:<AccountScreen/>;break
    case '/profile':screen=auth.phase==='signed-in'||preview?<ProfilePanel/>:<AccountScreen/>;break
    case '/settings':screen=<FeatureScreen path={path}/>;break
    case '/today':case '/notifications':screen=<DesignScreen path={path}/>;break
    case '/account':screen=<AccountScreen key={path}/>;break
    case '/reset-password':screen=<AccountScreen key={path} reset/>;break
    case '/workspace':screen=<Workspace/>;break
    default:screen=<ScreenState kind="not-found"/>
  }
  const accountView=path==='/account'||path==='/reset-password'||(!preview&&['/dream','/astro','/chat','/history','/profile'].includes(path)&&auth.phase!=='signed-in')
  const welcomeView=path==='/welcome'||(path==='/'&&!preview&&auth.phase!=='signed-in')
  return <div className={`maya-shell theme-${theme} ${path==='/workspace'?'workspace-shell':''} ${accountView||welcomeView?'entry-shell':''} ${(path==='/chat'||path==='/dream')&&!accountView?'conversation-shell':''}`}>
    <button className="skip-link" type="button" onClick={()=>main.current!.focus()}>{text(locale,'skip')}</button>
    {path!=='/'&&!accountView&&!welcomeView&&<header className="app-header crystal-header"><a href="#/" className="icon-button" aria-label={text(locale,'back')}><Icon name="back"/></a><img src="/brand/orbis-maya.png" alt=""/><div className="header-brand"><strong>{copy.title}</strong><small>{pageLabel}</small></div>
      {path==='/chat'&&auth.phase==='signed-in'&&!preview?<ChatTools key={auth.user!.id} userId={auth.user!.id}/>:<a href="#/notifications" className="icon-button" aria-label={copy.notifications}><Icon name="bell"/></a>}</header>}
    <main id="maya-content" ref={main} tabIndex={-1}><RouteBoundary key={path}><Suspense fallback={<ScreenState kind="loading"/>}>{screen}</Suspense></RouteBoundary></main>
    {path!=='/workspace'&&!accountView&&!welcomeView&&<BottomNav path={path}/>}
  </div>
}
