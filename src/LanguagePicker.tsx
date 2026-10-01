import { setLocale, text, useLocale } from './i18n'

export default function LanguagePicker() {
  const locale = useLocale()
  return <label className="language-picker">{text(locale, 'language')}
    <select value={locale} onChange={(event) => setLocale(event.target.value as 'bn' | 'en' | 'hi')}>
      <option value="bn">বাংলা</option><option value="en">English</option><option value="hi">हिन्दी</option>
    </select>
  </label>
}
