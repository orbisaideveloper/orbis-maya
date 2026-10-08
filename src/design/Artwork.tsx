import Icon from './Icon'
type Art = 'dream'|'astro'|'chat'|'saved'|'today'|'settings'|'orb'|'planet'
const slots: Record<Art,number> = {dream:0,astro:1,chat:2,saved:3,today:4,settings:5,orb:6,planet:7}
export default function Artwork({name,className=''}:Readonly<{name:Art;className?:string}>) {
  const i=slots[name]
  return <span className={`maya-art art-${name} ${className}`} aria-hidden="true">
    <span className="illustration" style={{backgroundPosition:`${(i%4)*100/3}% ${i<4?0:100}%`}} />
    <span className="plain-icon"><Icon name={name==='orb'||name==='planet'?'saved':name} /></span>
  </span>
}
