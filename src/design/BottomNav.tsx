import { useLocale } from '../i18n'
import { ui } from './copy'
import Icon from './Icon'
export default function BottomNav({path}:Readonly<{path:string}>) {
  const copy=ui(useLocale())
  const links=[{path:'/',label:copy.home,icon:'home'},{path:'/dream',label:copy.dreams,icon:'dream'},
    {path:'/astro',label:copy.astrology,icon:'astro'},{path:'/chat',label:copy.conversation,icon:'chat'},
    {path:'/settings',label:copy.settings,icon:'settings'}] as const
  return <nav className="dashboard-bottom-nav" aria-label="Maya bottom navigation">{links.map(link=><a key={link.path} href={`#${link.path}`} aria-current={(path===link.path||(path==='/profile'&&link.path==='/settings'))?'page':undefined}>
    <Icon name={link.icon}/><span>{link.label}</span>
  </a>)}</nav>
}
