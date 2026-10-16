import CloudBirthProfiles from './CloudBirthProfiles'
import { useState } from 'react'
import { useLocale } from '../i18n'
import { ui } from '../design/copy'
import BirthLocationField from '../astro/BirthLocationField'
import ProfilePhoto from './ProfilePhoto'
import { useProfile,type Profile } from './store'
import PersonPicker from './PersonPicker'
import {useFamily,addPerson,savePerson} from './family'
const labels={bn:{title:'প্রোফাইল',name:'নাম',save:'প্রোফাইল সংরক্ষণ করুন',saved:'এই ডিভাইসে প্রোফাইল সংরক্ষিত হয়েছে।',failed:'সংরক্ষণ হয়নি। তথ্য ও ডিভাইসের স্টোরেজ দেখে আবার চেষ্টা করুন।',draft:'লোকাল ডিজাইন প্রোফাইল: এটি কোনও লগইন অ্যাকাউন্টের সঙ্গে যুক্ত নয়।',login:'নিজের প্রোফাইল সংরক্ষণ করতে লগইন করুন।',chart:'জন্মকুণ্ডলী গণনার সংযোগ বাকি।'},en:{title:'Profile',name:'Name',save:'Save profile',saved:'Profile saved on this device.',failed:'Save failed. Check the data and device storage, then retry.',draft:'Local design profile: not linked to a signed-in account.',login:'Sign in to save your profile.',chart:'Birth-chart calculation is not connected yet.'},hi:{title:'प्रोफ़ाइल',name:'नाम',save:'प्रोफ़ाइल सहेजें',saved:'प्रोफ़ाइल इस डिवाइस पर सहेजी गई।',failed:'सहेजा नहीं गया। जानकारी और स्टोरेज जाँचकर फिर प्रयास करें।',draft:'लोकल डिज़ाइन प्रोफ़ाइल: किसी लॉगिन अकाउंट से जुड़ी नहीं है।',login:'प्रोफ़ाइल सहेजने के लिए लॉगिन करें।',chart:'जन्म कुंडली की गणना अभी जुड़ी नहीं है।'}}
export default function ProfilePanel(){
 const locale=useLocale(),{scope,preview}=useProfile()
 const family=useFamily(scope),person=family.people.find(p=>p.id===family.active)!
 return <><PersonPicker scope={scope}/><button type="button" disabled={!scope} onClick={scope?()=>addPerson(scope):undefined}>＋ {locale==='bn'?'পরিবারের প্রোফাইল যোগ করুন':'Add family profile'}</button><ProfileForm key={`${scope}:${person.id}`} scope={scope} personId={person.id} relation={person.relation} initial={person.profile} preview={preview}/>{scope?.startsWith('user:')&&<CloudBirthProfiles key={scope} userId={scope.slice(5)} scope={scope}/>}</>
}
function ProfileForm({scope,personId,relation:initialRelation,initial,preview}:Readonly<{scope:string|null;personId:string;relation:string;initial:Profile;preview:boolean}>){
 const locale=useLocale(),copy=ui(locale),label=labels[locale]
 const [profile,setProfile]=useState(initial),[relation,setRelation]=useState(initialRelation),[status,setStatus]=useState('')
 const loginNotice=scope?'':label.login
 function update(key:keyof Profile,value:string){setProfile({...profile,[key]:value});setStatus('')}
 return <section className="glass inner-panel profile-section"><h1>{label.title}</h1>{personId==='self'&&<ProfilePhoto/>}
  <p>{preview?label.draft:loginNotice}</p>
  <form onSubmit={event=>{event.preventDefault();try{savePerson(scope!,personId,profile,relation);setStatus(label.saved)}catch{setStatus(label.failed)}}}>
   {personId!=='self'&&<label>{{bn:'সম্পর্ক',hi:'संबंध',en:'Relationship'}[locale]}<input maxLength={100} value={relation} onChange={event=>setRelation(event.target.value)}/></label>}
   <label>{label.name}<input type="text" maxLength={100} value={profile.name} onChange={event=>update('name',event.target.value)}/></label>
   <label>{copy.birthDate}<input type="date" value={profile.birthDate} onChange={event=>update('birthDate',event.target.value)}/></label>
   <label>{copy.birthTime}<input type="time" value={profile.birthTime} onChange={event=>update('birthTime',event.target.value)}/></label>
   <BirthLocationField place={profile.birthPlace} location={profile.birthLocation} onChange={(birthPlace,birthLocation)=>{setProfile({...profile,birthPlace,birthLocation});setStatus('')}}/>
   <button type="submit" className="primary-action" disabled={!scope}>{label.save}</button>
   <output className="status-message">{status}</output><p>{locale==='bn'?'জন্মতথ্য সেভ করে জ্যোতিষ নির্দেশনায় গণনা করুন।':'Save birth details, then calculate in Birth chart.'}</p>
  </form>
 </section>
}
