import { themes, setTheme, useTheme } from './theme'
import { ui } from './copy'
import { useLocale } from '../i18n'
const names={'astral-blue':'Astral Blue','astral-gold':'Astral Gold','plain-light':'Plain Light'}
export default function ThemeSelector() {
  const selected=useTheme()
  const copy=ui(useLocale())
  return <fieldset className="theme-selector"><legend>{copy.theme}</legend>
    <div className="theme-choices">{themes.map(theme=><button key={theme} type="button" aria-pressed={selected===theme} onClick={()=>setTheme(theme)}>
      <span className={`theme-swatch swatch-${theme}`} aria-hidden="true" /><span>{names[theme]}</span>
    </button>)}</div>
  </fieldset>
}
