import { text, useLocale } from './i18n'
import LanguagePicker from './LanguagePicker'
import AccountScreen from './auth/AccountScreen'

const features = { '/dream': 'dream', '/astro': 'astro', '/chat': 'chat', '/history': 'history', '/settings': 'settings' } as const
export default function FeatureScreen({ path }: { path: keyof typeof features }) {
  const locale = useLocale()
  const feature = features[path]
  return <section className="feature-screen" aria-labelledby="feature-title">
    <p className="hero-kicker">{text(locale, `${feature}Eyebrow`)}</p>
    <h1 id="feature-title">{text(locale, `${feature}Title`)}</h1>
    <p className="hero-copy">{text(locale, `${feature}Description`)}</p>
    {path === '/settings' && <><LanguagePicker /><AccountScreen /></>}
    <div className="journey-card feature-notice">
      <h2>{text(locale, 'soon')}</h2><p>{text(locale, `${feature}Notice`)}</p>
      <a className="journey-action" href="#/">{text(locale, 'back')}</a>
    </div>
  </section>
}
