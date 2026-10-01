import { text, useLocale } from './i18n'
interface ScreenStateProps { readonly kind: 'loading' | 'error' | 'not-found' }
export default function ScreenState({ kind }: ScreenStateProps) {
  const locale = useLocale()
  const key = kind === 'not-found' ? 'notFound' : kind
  const StatusElement = kind === 'error' ? 'span' : 'output'
  return <section className="journey-card screen-state" aria-live="polite">
    <h1><StatusElement role={kind === 'error' ? 'alert' : undefined}>{text(locale, key)}</StatusElement></h1><p>{text(locale, `${key}Description`)}</p>
    {kind !== 'loading' && <a className="journey-action" href="#/">{text(locale, 'back')}</a>}
  </section>
}
