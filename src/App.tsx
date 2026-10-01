import { lazy, Suspense, useEffect, useRef, useSyncExternalStore } from 'react'
import RouteBoundary from './RouteBoundary'
import ScreenState from './ScreenState'
import { destinations, readLocation, subscribeToLocation } from './navigation'
import './App.css'
import { text, useLocale } from './i18n'
import { useAuth } from './auth/store'
import AccountScreen from './auth/AccountScreen'

const DreamScreen = lazy(() => import('./DreamScreen'))

const HistoryScreen = lazy(() => import('./HistoryScreen'))

const FeatureScreen = lazy(() => import('./FeatureScreen'))

function HomeScreen() {
  const locale = useLocale()
  return <>
    <section className="hero" aria-labelledby="maya-title">
      <p className="hero-kicker">{text(locale, 'kicker')}</p>
      <h1 id="maya-title">{text(locale, 'hero')} <span>{text(locale, 'heroEnd')}</span></h1>
      <p className="hero-copy">{text(locale, 'heroCopy')}</p>
    </section>
    <div className="cosmic-window" aria-hidden="true" />
    <section className="journey-grid" aria-label={text(locale, 'experiences')}>
      {(['dream', 'chat'] as const).map((journey) => <article className="journey-card" key={journey}>
        <p className="card-eyebrow">{text(locale, `${journey}Eyebrow`)}</p>
        <h2>{text(locale, `${journey}Title`)}</h2>
        <a className="journey-action" href={`#/${journey}`}>{text(locale, `${journey}Action`)}</a>
      </article>)}
    </section>
    <aside className="privacy-note"><p>{text(locale, 'privacy')}</p></aside>
  </>
}

function App() {
  const locale = useLocale()
  const auth = useAuth()
  const path = useSyncExternalStore(subscribeToLocation, readLocation)
  const main = useRef<HTMLElement>(null)
  const menu = useRef<HTMLDetailsElement>(null)
  const menuButton = useRef<HTMLElement>(null)

  useEffect(() => {
    const destination = destinations.find((item) => item.path === path)
    document.title = `ORBIS Maya · ${destination ? text(locale, `${destination.key}Title`) : text(locale, 'notFound')}`
    document.documentElement.lang = locale
    menu.current!.open = false
    main.current!.focus()
  }, [path, locale])

  let screen
  switch (path) {
    case '/':
      screen = <HomeScreen />
      break
    case '/dream':
      screen = auth.phase === 'signed-in' ? <DreamScreen key={auth.user!.id} userId={auth.user!.id} /> : <AccountScreen />
      break
    case '/astro':
    case '/chat':
      screen = auth.phase === 'signed-in' ? <FeatureScreen path={path} /> : <AccountScreen />
      break
    case '/history':
      screen = auth.phase === 'signed-in' ? <HistoryScreen key={auth.user!.id} userId={auth.user!.id} /> : <AccountScreen />
      break
    case '/settings':
      screen = <FeatureScreen path={path} />
      break
    case '/account':
      screen = <AccountScreen />
      break
    default:
      screen = <ScreenState kind="not-found" />
  }

  return (
    <div className="maya-shell">
      <button className="skip-link" type="button" onClick={() => main.current!.focus()}>{text(locale, 'skip')}</button>
      <header className="app-header">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <span className="brand-name">ORBIS MAYA</span>
          <span className="phase-pill">Astral</span>
          <details className="app-menu" ref={menu} onKeyDown={(event) => {
            if (event.key === 'Escape') {
              menu.current!.open = false
              menuButton.current!.focus()
            }
          }}>
            <summary ref={menuButton} aria-label={text(locale, 'menu')}><span className="menu-dots" aria-hidden="true">⋮</span></summary>
            <nav aria-label={text(locale, 'navigation')}>
              {destinations.map((destination) => (
                <a key={destination.path} href={`#${destination.path}`}
                  aria-current={path === destination.path ? 'page' : undefined}
                  onClick={() => { menu.current!.open = false; main.current!.focus() }}>
                  {text(locale, destination.key)}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </header>
      <main id="maya-content" ref={main} tabIndex={-1}>
        <RouteBoundary key={path}>
          <Suspense fallback={<ScreenState kind="loading" />}>
            {screen}
          </Suspense>
        </RouteBoundary>
      </main>
    </div>
  )
}

export default App
