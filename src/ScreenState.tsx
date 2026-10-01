import { text, useLocale } from './i18n'
interface ScreenStateProps { kind: 'loading' | 'error' | 'not-found' }
export default function ScreenState({ kind }: ScreenStateProps) {
  const locale = useLocale()
  const key = kind === 'not-found' ? 'notFound' : kind
  return <section className="journey-card screen-state" aria-live="polite">
    <div role={kind === 'error' ? 'alert' : 'status'}><h1>{text(locale, key)}</h1><p>{text(locale, `${key}Description`)}</p></div>
    {kind !== 'loading' && <a className="journey-action" href="#/">{text(locale, 'back')}</a>}
  </section>
}
