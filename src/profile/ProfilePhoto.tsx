import { useRef,useState,useEffect } from 'react'
import { useLocale } from '../i18n'
import { useProfile } from './store'
import { usePhoto,savePhoto,removePhoto,preparePhoto } from './photo'
export default function ProfilePhoto(){
 const {scope}=useProfile(),photo=usePhoto(scope),locale=useLocale()
 const label={bn:{pick:'প্রোফাইল ছবি',remove:'ছবি সরান',failed:'ছবি রাখা যায়নি। ৫ MB-এর মধ্যে JPG, PNG বা WebP ছবি বেছে নিন।',local:'ছবি শুধু এই ডিভাইসে থাকবে।'},en:{pick:'Profile photo',remove:'Remove photo',failed:'Could not save photo. Choose a JPG, PNG or WebP under 5 MB.',local:'Photo stays on this device.'},hi:{pick:'प्रोफ़ाइल फ़ोटो',remove:'फ़ोटो हटाएँ',failed:'फ़ोटो सहेजी नहीं गई। 5 MB से छोटी JPG, PNG या WebP चुनें।',local:'फ़ोटो इसी डिवाइस पर रहेगी।'}}[locale]
 const [busy,setBusy]=useState(false),[failed,setFailed]=useState(false),revision=useRef(0)
 useEffect(()=>()=>{revision.current++},[scope])
 async function choose(file?:File){if(!file||!scope){return}
 const current=++revision.current;setBusy(true);setFailed(false);try{const value=await preparePhoto(file);if(current===revision.current)savePhoto(scope,value)}catch{if(current===revision.current)setFailed(true)}finally{if(current===revision.current)setBusy(false)}}
 return <div className="profile-photo"><img src={photo||'/brand/orbis-maya.png'} alt=""/><label>{label.pick}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!scope||busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';void choose(file)}}/></label>{photo&&<button type="button" disabled={busy} onClick={()=>{try{removePhoto(scope!)}catch{setFailed(true)}}}>{label.remove}</button>}<p>{label.local}</p>{failed&&<p role="alert">{label.failed}</p>}</div>
}
