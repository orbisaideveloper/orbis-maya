import { text, useLocale } from './i18n'
import type { DreamRecord } from './dream/record'

export default function DreamResultView({ record }: { record: DreamRecord }) {
  const locale = useLocale()
  return <div className="dream-result" role="region" aria-label={text(locale, 'dreamResult')}>
    <h2>{text(locale, 'dreamResult')}</h2>
    <p>{text(locale, 'dreamReflective')}</p>
    <details><summary>{text(locale, 'originalDream')}</summary>
      {Object.entries(record.input).filter(([, value]) => value.trim()).map(([key, value]) => <div key={key}><h3>{text(locale, `input${key as keyof typeof record.input}`)}</h3><p className="history-content">{value}</p></div>)}
    </details>
    <div lang={record.language}>
      {(['symbols', 'themes', 'emotions', 'reflectionQuestions'] as const).map((key) => <section className="journey-card" key={key}>
        <h3>{text(locale, key)}</h3><ul>{record.result[key].map((item, index) => <li key={index}>{item}</li>)}</ul>
      </section>)}
      <section className="journey-card"><h3>{text(locale, 'interpretation')}</h3><p className="history-content">{record.result.interpretation}</p></section>
    </div>
  </div>
}
