import { useEffect, useRef, useState } from 'react'
import './astro.css'
import { useLocale } from '../i18n'
import { searchBirthPlaces,validLocation,type BirthLocation } from './birth'
const copy={bn:{place:'জন্মস্থান',search:'জায়গা খুঁজুন',busy:'খুঁজছি…',failed:'জায়গা খোঁজা যায়নি। সংযোগ দেখে আবার চেষ্টা করুন।',none:'মিল পাওয়া যায়নি। শহর ও রাজ্য/দেশ দিয়ে খুঁজুন।',hint:'শুধু জায়গার নাম সার্চে পাঠানো হবে। সঠিক ফল বেছে নিন। শহরের coordinates আনুমানিক; জানা থাকলে জন্মস্থানের সঠিক coordinates সংশোধন করুন।',latitude:'অক্ষাংশ (Latitude)',longitude:'দ্রাঘিমাংশ (Longitude)',timezone:'Timezone',invalid:'Coordinates বা timezone সঠিক নয়।'},en:{place:'Birthplace',search:'Find place',busy:'Searching…',failed:'Place search failed. Check the connection and retry.',none:'No matching place. Try a city and state/country.',hint:'Only the place query is sent. Select the correct result. City coordinates are approximate; correct them if you know the exact birth location.',latitude:'Latitude',longitude:'Longitude',timezone:'Timezone',invalid:'Invalid coordinates or timezone.'},hi:{place:'जन्मस्थान',search:'स्थान खोजें',busy:'खोज रहे हैं…',failed:'स्थान नहीं मिला। कनेक्शन जाँचकर प्रयास करें।',none:'मिलान नहीं मिला। शहर और राज्य/देश लिखें।',hint:'केवल स्थान का नाम भेजा जाएगा। सही परिणाम चुनें। शहर के निर्देशांक अनुमानित हैं; सही जन्मस्थान ज्ञात हो तो सुधारें।',latitude:'अक्षांश',longitude:'देशांतर',timezone:'समय क्षेत्र',invalid:'निर्देशांक या समय क्षेत्र सही नहीं है।'}}
export default function BirthLocationField({place,location,onChange}:Readonly<{place:string;location?:BirthLocation;onChange:(place:string,location?:BirthLocation)=>void}>){
 const locale=useLocale(),label=copy[locale]
 const [results,setResults]=useState<BirthLocation[]>([]),[busy,setBusy]=useState(false),[status,setStatus]=useState('')
 const request=useRef<AbortController|null>(null)
 useEffect(()=>()=>{request.current?.abort();request.current=null},[])
 function cancel(){request.current?.abort();request.current=null;setBusy(false);setResults([]);setStatus('')}
 async function search(){
  cancel();const controller=new AbortController();request.current=controller;setBusy(true)
  const timer=setTimeout(()=>controller.abort(),10000)
  try{const next=await searchBirthPlaces(place,locale,controller.signal);if(request.current===controller){setResults(next);setStatus(next.length?'':label.none)}}
  catch{if(request.current===controller)setStatus(label.failed)}
  finally{clearTimeout(timer);if(request.current===controller){request.current=null;setBusy(false)}}
 }
 function coordinate(selected:BirthLocation,key:'latitude'|'longitude'|'timezone',value:string){
  const next={...selected,[key]:key==='timezone'?value:value.trim()?Number(value):Number.NaN}
  onChange(place,next);setStatus(validLocation(next)?'':label.invalid)
 }
 return <div className="birth-location"><label>{label.place}<input type="text" maxLength={200} value={place} onChange={event=>{cancel();onChange(event.target.value)}}/></label>
  <button type="button" disabled={busy||place.trim().length<2} onClick={()=>{void search()}}>{busy?label.busy:label.search}</button>

  {results.length>0&&<label className="place-results">{locale==='bn'?'সঠিক স্থান বেছে নিন':locale==='hi'?'सही स्थान चुनें':'Select the correct place'}<select value="" onChange={event=>{const value=event.target.value;if(!/^\d+$/.test(value))return;const item=results[Number(value)];if(item){cancel();onChange(item.label,item)}}}><option value="" disabled>{locale==='bn'?'স্থান নির্বাচন করুন…':'Select a place…'}</option>{results.map((item,index)=><option key={`${item.label}:${index}`} value={index}>{item.label}</option>)}</select></label>}
  {location&&<details className="location-details"><summary>{locale==='bn'?'স্থান ও সময়ের বিস্তারিত':locale==='hi'?'स्थान और समय विवरण':'Location and time details'} · {location.timezone}</summary><p>{label.hint}</p><div className="coordinates-grid"><label>{label.latitude}<input type="number" min={-90} max={90} step="any" value={Number.isFinite(location.latitude)?location.latitude:''} onChange={event=>coordinate(location,'latitude',event.target.value)}/></label><label>{label.longitude}<input type="number" min={-180} max={180} step="any" value={Number.isFinite(location.longitude)?location.longitude:''} onChange={event=>coordinate(location,'longitude',event.target.value)}/></label><label>{label.timezone}<input value={location.timezone} maxLength={100} onChange={event=>coordinate(location,'timezone',event.target.value)}/></label></div></details>}
  {status&&<p role="status">{status}</p>}
  <small>Location data: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> / <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a></small>
 </div>
}
