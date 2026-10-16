import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../i18n'
import { restoreSavedFamily, savePerson, useFamily } from './family'
import { cloudBirthRequest, type CloudBirthResult } from './cloud-birth'
const translations={
 bn:{familyRestored:'সংরক্ষিত পরিবারের জন্মতথ্য এই মোবাইলে ফিরিয়ে আনা হয়েছে।',restoreAll:'সংরক্ষিত পরিবার ফিরিয়ে আনুন',allConfirm:'এই অ্যাকাউন্টের সংরক্ষিত পরিবারের জন্মতথ্য এই মোবাইলে ফিরিয়ে আনবেন?',title:'অ্যাকাউন্টে সংরক্ষিত জন্মতথ্য',slot:'জন্মতথ্য',empty:'এখনও সংরক্ষিত নেই',save:'নির্বাচিত প্রোফাইল সংরক্ষণ করুন',restore:'নির্বাচিত প্রোফাইলে ফিরিয়ে আনুন',reload:'আবার পড়ুন',loading:'সংরক্ষিত জন্মতথ্য পড়া হচ্ছে…',confirm:'নিশ্চিত করুন',cancel:'বাতিল',saveConfirm:'নির্বাচিত প্রোফাইলের জন্মতথ্য এই slot-এ সংরক্ষণ করবেন?',restoreConfirm:'সংরক্ষিত জন্মতথ্য দিয়ে নির্বাচিত ডিভাইস প্রোফাইলের তথ্য বদলাবেন?',saved:'অ্যাকাউন্টে জন্মতথ্য সংরক্ষিত হয়েছে।',restored:'নির্বাচিত ডিভাইস প্রোফাইলে জন্মতথ্য ফিরিয়ে আনা হয়েছে।',failed:'সংযোগ প্রস্তুত নেই বা তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।',conflict:'অন্য ডিভাইসে তথ্য বদলেছে। আবার পড়ে দেখে সংরক্ষণ করুন।',changed:'নির্বাচিত প্রোফাইল বদলেছে। আবার নির্বাচন করে চেষ্টা করুন।'},
 en:{familyRestored:'Saved family birth details restored to this device.',restoreAll:'Restore saved family',allConfirm:'Restore the saved family birth details to this device?',title:'Birth profiles saved to your account',slot:'Birth profile',empty:'Not saved yet',save:'Save selected profile',restore:'Restore into selected profile',reload:'Reload',loading:'Loading saved birth profiles…',confirm:'Confirm',cancel:'Cancel',saveConfirm:'Save the selected birth profile into this slot?',restoreConfirm:'Replace the selected device profile with these saved birth details?',saved:'Birth details saved to your account.',restored:'Birth details restored into the selected device profile.',failed:'The connection is not ready or profiles could not be loaded. Retry.',conflict:'Another device changed the profiles. Reload and review before saving.',changed:'The selected profile changed. Review your selection and retry.'},
 hi:{familyRestored:'परिवार की सहेजी जन्म जानकारी इस डिवाइस पर वापस लाई गई।',restoreAll:'सहेजा परिवार वापस लाएँ',allConfirm:'इस अकाउंट के परिवार की जन्म जानकारी इस डिवाइस पर वापस लाएँ?',title:'अकाउंट में सहेजी जन्म जानकारी',slot:'जन्म प्रोफ़ाइल',empty:'अभी सहेजी नहीं गई',save:'चुनी प्रोफ़ाइल सहेजें',restore:'चुनी प्रोफ़ाइल में वापस लाएँ',reload:'फिर पढ़ें',loading:'सहेजी जन्म जानकारी पढ़ रहे हैं…',confirm:'पुष्टि करें',cancel:'रद्द करें',saveConfirm:'चुनी जन्म प्रोफ़ाइल इस स्लॉट में सहेजें?',restoreConfirm:'चुनी डिवाइस प्रोफ़ाइल को सहेजी जन्म जानकारी से बदलें?',saved:'जन्म जानकारी अकाउंट में सहेजी गई।',restored:'जन्म जानकारी चुनी डिवाइस प्रोफ़ाइल में वापस लाई गई।',failed:'कनेक्शन तैयार नहीं है या जानकारी नहीं मिली। फिर प्रयास करें।',conflict:'दूसरे डिवाइस पर जानकारी बदली है। फिर पढ़कर सहेजें।',changed:'चुनी प्रोफ़ाइल बदली है। फिर जाँचकर प्रयास करें।'},
}
export default function CloudBirthProfiles({userId,scope}:Readonly<{userId:string;scope:string}>){
 const language=useLocale(),[attempt,setAttempt]=useState(0)
 return <CloudEditor key={`${userId}:${language}:${attempt}`} userId={userId} scope={scope} language={language} reload={()=>setAttempt(n=>n+1)}/>
}
type Pending={action:'save'|'restore'|'restore-all';slot:1|2|3|4|5;personId:string;local:string}
function CloudEditor({userId,scope,language,reload}:Readonly<{userId:string;scope:string;language:keyof typeof translations;reload:()=>void}>){
 const t=translations[language],family=useFamily(scope),person=family.people.find(p=>p.id===family.active)!
 const [data,setData]=useState<CloudBirthResult|null>(null),[busy,setBusy]=useState(true),[message,setMessage]=useState(''),[pending,setPending]=useState<Pending|null>(null)
 const operation=useRef<AbortController|null>(null)
 useEffect(()=>{
  let active=true;const controller=new AbortController();operation.current=controller
  void cloudBirthRequest(userId,AbortSignal.any([controller.signal,AbortSignal.timeout(25000)])).then(value=>{if(active)setData(value)}).catch(()=>{if(active)setMessage(t.failed)}).finally(()=>{if(active)setBusy(false)})
  return()=>{active=false;operation.current?.abort()}
 },[userId,t.failed])
 function propose(action:Pending['action'],slot:1|2|3|4|5){setMessage('');setPending({action,slot,personId:person.id,local:JSON.stringify(person)})}
 async function confirm(action:Pending,loaded:CloudBirthResult){
  setPending(null)
  if(person.id!==action.personId||JSON.stringify(person)!==action.local){setMessage(t.changed);return}
  if(action.action==='restore-all'){
   try{restoreSavedFamily(scope,loaded.profiles);setMessage(t.familyRestored)}catch{setMessage(t.failed)}
   return
  }
  if(action.action==='restore'){
   const stored=loaded.profiles.find(p=>p.slot===action.slot)
   try{if(!stored)throw new Error('MISSING_PROFILE');savePerson(scope,person.id,stored.profile,stored.relation);setMessage(t.restored)}catch{setMessage(t.failed)}
   return
  }
  setBusy(true);const controller=new AbortController();operation.current=controller
  try{
   const result=await cloudBirthRequest(userId,AbortSignal.any([controller.signal,AbortSignal.timeout(25000)]),{slot:action.slot,relation:person.relation,profile:person.profile,expectedRevision:loaded.revision})
   if(!controller.signal.aborted){setData(result);setMessage(t.saved)}
  }catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error&&error.message==='MAYA_PROFILE_CONFLICT'?t.conflict:t.failed)}
  finally{if(!controller.signal.aborted)setBusy(false)}
 }
 return <section className="glass inner-panel" aria-label={t.title}><h2>{t.title}</h2>
  {busy&&<output>{t.loading}</output>}{data&&([1,2,3,4,5] as const).map(slot=>{
   const stored=data.profiles.find(p=>p.slot===slot)
   return <section key={slot} aria-label={`${t.slot} ${slot}`}><h3>{t.slot} {slot}</h3><p>{stored?.profile.name||t.empty}</p>
    <button type="button" disabled={busy||!person.profile.name.trim()} onClick={()=>propose('save',slot)}>{t.save}</button>
    <button type="button" disabled={busy||!stored} onClick={()=>propose('restore',slot)}>{t.restore}</button>
   </section>
  })}
  {data&&<button type="button" disabled={busy||!data.profiles.length} onClick={()=>propose('restore-all',1)}>{t.restoreAll}</button>}
  {pending&&<section aria-label={t.confirm}><p>{pending.action==='save'?t.saveConfirm:pending.action==='restore-all'?t.allConfirm:t.restoreConfirm}</p><button type="button" disabled={busy} onClick={()=>{void confirm(pending,data!)}}>{t.confirm}</button><button type="button" onClick={()=>setPending(null)}>{t.cancel}</button></section>}
  {message&&<output>{message}</output>}<button type="button" disabled={busy} onClick={reload}>{t.reload}</button>
 </section>
}
