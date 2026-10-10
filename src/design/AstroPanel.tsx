import { useCallback,useState } from 'react'
import { useLocale } from '../i18n'
import { ui } from './copy'
import Kundli from './Kundli'
import ChartReport from '../astro/ChartReport'
import { useProfile,type Profile } from '../profile/store'
import BirthLocationField from '../astro/BirthLocationField'
import PersonPicker from '../profile/PersonPicker'
import {useFamily,savePerson} from '../profile/family'
import {readSavedChart,saveChart} from '../astro/savedChart'
import type { BirthChart } from '../astro/calculate'
import { birthUtc,validLocation } from '../astro/birth'
const labels={bn:{name:'নাম',chart:'কুণ্ডলী',pending:'জন্মতথ্য দিয়ে কুণ্ডলী গণনা করুন।',save:'জন্মতথ্য সংরক্ষণ ও যাচাই করুন',ready:'জন্মতথ্য সংরক্ষিত। গণনার জন্য UTC:',failed:'সঠিক জন্মতারিখ, সময় ও নির্বাচিত স্থান দিন। ঘড়ি পরিবর্তনের দ্ব্যর্থক/অনুপস্থিত সময় হলে সঠিক সময় যাচাই করতে হবে।',login:'জন্মতথ্য সংরক্ষণ করতে লগইন করুন।'},en:{name:'Name',chart:'Birth chart',pending:'Enter birth details to calculate.',save:'Save and validate birth details',ready:'Birth details saved. UTC for calculation:',failed:'Enter a valid birth date, time and selected place. Ambiguous or nonexistent clock-change times require verification.',login:'Sign in to save birth details.'},hi:{name:'नाम',chart:'कुंडली',pending:'जन्म विवरण से गणना करें।',save:'जन्म विवरण सहेजें और जाँचें',ready:'जन्म विवरण सहेजा गया। गणना के लिए UTC:',failed:'सही जन्मतिथि, समय और चयनित स्थान दें। घड़ी परिवर्तन का अस्पष्ट समय सत्यापित करें।',login:'जन्म विवरण सहेजने के लिए लॉगिन करें।'}}
export default function AstroPanel(){const {scope}=useProfile();const family=useFamily(scope),person=family.people.find(p=>p.id===family.active)!;return <><PersonPicker scope={scope}/><BirthForm key={`${scope}:${person.id}`} scope={scope} personId={person.id} relation={person.relation} initial={person.profile}/></>}
function BirthForm({scope,personId,relation,initial}:Readonly<{scope:string|null;personId:string;relation:string;initial:Profile}>){
 const locale=useLocale(),copy=ui(locale),label=labels[locale]
 const [value,setValue]=useState(initial),[status,setStatus]=useState(''),[chart,setChart]=useState<BirthChart|null>(()=>readSavedChart(scope,personId,initial)),[busy,setBusy]=useState(false),[reportHouse,setReportHouse]=useState<number|null>(null)
 const calculatedLabel=locale==='bn'?'গ্রহ ও লগ্ন গণনা হয়েছে — reference যাচাই বাকি':'Calculated — reference validation pending'
 const calculateLabel={bn:'সংরক্ষণ ও কুণ্ডলী গণনা করুন',hi:'सहेजें और कुंडली गणना करें',en:'Save and calculate chart'}[locale]
 const closeHouse=useCallback(()=>setReportHouse(null),[])
 async function importBirth(next:Profile){if(!scope||!next.birthLocation){throw new Error('INVALID')}
 const {calculateChart}=await import('../astro/calculate');const result=calculateChart(next.birthDate,next.birthTime,next.birthLocation);savePerson(scope,personId,next,relation);saveChart(scope,personId,next,result);setValue(next);setChart(result);setReportHouse(null)}
 function update(key:'name'|'birthDate'|'birthTime',next:string){setValue({...value,[key]:next});setStatus('');setChart(null)}
 async function save(){setBusy(true);setChart(null);try{
  if(!scope||!validLocation(value.birthLocation)||!value.birthDate||!value.birthTime)throw new Error('INVALID')
  const utc=birthUtc(value.birthDate,value.birthTime,value.birthLocation.timezone)
  const {calculateChart}=await import('../astro/calculate');const result=calculateChart(value.birthDate,value.birthTime,value.birthLocation);savePerson(scope,personId,value,relation);saveChart(scope,personId,value,result);setChart(result);setStatus(`${label.ready} ${utc}`)
 }catch{setStatus(locale==='bn'?'গণনা করা যায়নি। জন্মসময় ও স্থান যাচাই করুন; সমর্থিত বছর ১৯০০–২১০০ এবং অক্ষাংশ ±৬৬°-এর ভিতরে।': 'Calculation failed. Verify birth details; supported years 1900–2100 and latitude within ±66°.')}finally{setBusy(false)}}
 return <section className="glass inner-panel astro-panel" aria-label={copy.astro}>
  <div className="kundli-heading"><h2>{label.chart}</h2><p>{chart?calculatedLabel:label.pending}</p></div><Kundli chart={chart} onHouseSelect={chart?setReportHouse:undefined}/>{chart&&<ChartReport chart={chart} profile={value} house={reportHouse} onHouseClose={closeHouse} onImport={importBirth}/>}
  <form onSubmit={event=>{event.preventDefault();void save()}}><fieldset disabled={busy} className="birth-fields">
   <label>{label.name}<input maxLength={100} value={value.name} onChange={event=>update('name',event.target.value)}/></label>
   <label>{copy.birthDate}<input type="date" value={value.birthDate} onChange={event=>update('birthDate',event.target.value)}/></label>
   <label>{copy.birthTime}<input type="time" value={value.birthTime} onChange={event=>update('birthTime',event.target.value)}/></label>
   <BirthLocationField place={value.birthPlace} location={value.birthLocation} onChange={(birthPlace,birthLocation)=>{setValue({...value,birthPlace,birthLocation});setStatus('');setChart(null)}}/>
  </fieldset><button type="submit" className="primary-action" disabled={!scope||busy}>{busy?'…':calculateLabel}</button>
  <output className="status-message">{status||(!scope?label.login:'')}</output></form>
  {chart&&<details className="chart-method"><summary>{locale==='bn'?'গণনার পদ্ধতি ও বিস্তারিত':'Calculation method and details'}</summary><p>{chart.engine} · {chart.method}</p><p>UTC: {chart.utc} · Ayanamsa: {chart.ayanamsa.toFixed(4)}° · Ascendant: {chart.ascendant.toFixed(4)}°</p><p>{locale==='bn'?'এটি Lahiri J2000 ভিত্তিক মডেল; Swiss Lahiri-এর সঙ্গে সম্পূর্ণ মিল এখনো যাচাই হয়নি। ফলের ব্যাখ্যা ও AI সংযোগ বাকি।':'Lahiri J2000 anchored model. Exact Swiss Lahiri equivalence has not been verified. Interpretation and AI connection pending.'}</p></details>}
 </section>
}