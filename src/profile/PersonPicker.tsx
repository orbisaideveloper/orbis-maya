import {useLocale} from '../i18n'
import {selectPerson,useFamily} from './family'
export default function PersonPicker({scope,disabled=false}:Readonly<{scope:string|null;disabled?:boolean}>){
 const locale=useLocale(),family=useFamily(scope)
 const c={bn:{label:'কার প্রোফাইল',self:'নিজে',unnamed:'নতুন ব্যক্তি'},en:{label:'Person',self:'Self',unnamed:'New person'},hi:{label:'किसकी प्रोफ़ाइल',self:'स्वयं',unnamed:'नया व्यक्ति'}}[locale]
 return <label>{c.label}<select disabled={!scope||disabled} value={family.active} onChange={event=>{if(scope)selectPerson(scope,event.target.value)}}>{family.people.map(p=><option key={p.id} value={p.id}>{p.profile.name||c.unnamed} · {p.id==='self'?c.self:p.relation||c.unnamed}</option>)}</select></label>
}
