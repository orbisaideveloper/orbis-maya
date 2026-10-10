import {explanationRows,interpretationCopy} from './interpretation'
import { useCallback,useRef,useState } from 'react'
import type { BirthChart } from './calculate'
import type { Profile } from '../profile/store'
import { validProfile } from '../profile/store'
import { validLocation } from './birth'
import { useLocale } from '../i18n'
import { chartRows,chartText,planetName,reportCopy,signNames,type ReportLocale } from './chartReport'
import { downloadWorkbook,printReport } from './exportChart'
import ReportPopup from './ReportPopup'
import {keyedItems} from '../listKeys'
type Mode='full'|'planets'|'houses'|'method'
const houseNumbers=Array.from({length:12},(_,index)=>index+1)
function planetRows(chart:BirthChart,locale:ReportLocale,planets=chart.planets){
 const c=reportCopy[locale]
 return [[c.planet,c.sign,c.degree,c.house,c.motion],...planets.map(p=>[planetName(p.id,locale),signNames[locale][p.sign],p.degree.toFixed(4)+'°',String(p.house),p.retrograde?c.retro:c.direct])]
}
function houseRows(chart:BirthChart,locale:ReportLocale){
 const c=reportCopy[locale]
 return [[c.house,c.sign,c.planet],...houseNumbers.map(house=>[String(house),signNames[locale][(Math.floor(chart.ascendant/30)+house-1)%12],chart.planets.filter(p=>p.house===house).map(p=>planetName(p.id,locale)).join(', ')||c.empty])]
}
function reportRows(chart:BirthChart,house:number|null,mode:Mode|null,locale:ReportLocale,rows:string[][],headings:readonly string[]){
 const c=reportCopy[locale]
 if(house!==null)return [[`${c.house} ${house}`,signNames[locale][(Math.floor(chart.ascendant/30)+house-1)%12]],...planetRows(chart,locale,chart.planets.filter(p=>p.house===house)),[c.note],[],...explanationRows(chart,locale,house)]
 if(mode==='planets')return [[headings[1]],...planetRows(chart,locale)]
 if(mode==='houses')return [[headings[2]],...houseRows(chart,locale),[],...explanationRows(chart,locale)]
 if(mode==='method')return [[headings[3]],['UTC',chart.utc],['Ayanamsa',chart.ayanamsa.toFixed(4)+'°'],['Engine',chart.engine],['Method',chart.method],['Time policy',chart.timePolicy],[c.note]]
 return rows
}
function PlanetTable({planets,locale}:Readonly<{planets:BirthChart['planets'];locale:ReportLocale}>){
 const c=reportCopy[locale]
 return <div className="report-table"><table><thead><tr><th>{c.planet}</th><th>{c.sign}</th><th>{c.degree}</th><th>{c.house}</th><th>{c.motion}</th></tr></thead><tbody>{planets.map(p=><tr key={p.id}><th scope="row">{planetName(p.id,locale)}</th><td>{signNames[locale][p.sign]}</td><td>{p.degree.toFixed(2)}°</td><td>{p.house}</td><td>{p.retrograde?c.retro:c.direct}</td></tr>)}</tbody></table></div>
}
function HouseTable({chart,locale}:Readonly<{chart:BirthChart;locale:ReportLocale}>){
 const c=reportCopy[locale]
 return <div className="report-table"><table><thead><tr><th>{c.house}</th><th>{c.sign}</th><th>{c.planet}</th></tr></thead><tbody>{houseNumbers.map(house=><tr key={house}><th scope="row">{house}</th><td>{signNames[locale][(Math.floor(chart.ascendant/30)+house-1)%12]}</td><td>{chart.planets.filter(p=>p.house===house).map(p=>planetName(p.id,locale)).join(', ')||c.empty}</td></tr>)}</tbody></table></div>
}
function ReportDetails({chart,profile,house,mode,locale}:Readonly<{chart:BirthChart;profile:Profile;house:number|null;mode:Mode|null;locale:ReportLocale}>){
 const c=reportCopy[locale],planets=house!==null?chart.planets.filter(p=>p.house===house):chart.planets
 const fullOrMethod=mode==='full'||mode==='method'
 const showIdentity=fullOrMethod&&house===null
 const showPlanets=house!==null||mode==='full'||mode==='planets'
 const showHouses=(mode==='full'||mode==='houses')&&house===null
 const showExplanation=house!==null||mode==='houses'
 return <>
 {house!==null&&<p>{c.sign}: {signNames[locale][(Math.floor(chart.ascendant/30)+house-1)%12]} · {planets.length?planets.map(p=>planetName(p.id,locale)).join(', '):c.empty}</p>}
 {showIdentity&&<><p>{profile.name} · {profile.birthDate} · {profile.birthTime}</p><p>{profile.birthPlace}</p><p>{c.asc}: {signNames[locale][Math.floor(chart.ascendant/30)]} {(chart.ascendant%30).toFixed(2)}°</p></>}
 {showPlanets&&<PlanetTable planets={planets} locale={locale}/>}
 {showHouses&&<HouseTable chart={chart} locale={locale}/>}
 {showIdentity&&<><p>UTC: {chart.utc} · Ayanamsa: {chart.ayanamsa.toFixed(4)}°</p><p>{chart.engine} · {chart.method}</p></>}<p>{c.note}</p>
 {showExplanation&&<section aria-label={interpretationCopy[locale].title}><h3>{interpretationCopy[locale].title}</h3>{keyedItems(explanationRows(chart,locale,house??undefined).filter(row=>row.length),row=>row.join(' · ')).map(({item:row,key})=><p key={key}>{row.join(' · ')}</p>)}</section>}
 </>
}

export default function ChartReport({chart,profile,house=null,onHouseClose,onImport}:Readonly<{chart:BirthChart;profile:Profile;house?:number|null;onHouseClose?:()=>void;onImport?:(profile:Profile)=>Promise<void>}>){
 const locale=useLocale(),c=reportCopy[locale],[mode,setMode]=useState<Mode|null>(null),[status,setStatus]=useState(''),[votes,setVotes]=useState<Record<string,'like'|'dislike'|undefined>>({}),input=useRef<HTMLInputElement>(null)
 const back={bn:'ফিরুন',hi:'वापस',en:'Back'}[locale]
 const headings={bn:['পূর্ণ রিপোর্ট','গ্রহের বিবরণ','১২ ঘরের বিবরণ','গণনার পদ্ধতি'],hi:['पूर्ण रिपोर्ट','ग्रह विवरण','१२ भाव विवरण','गणना पद्धति'],en:['Full report','Planet details','12-house details','Calculation method']}[locale]
 const active=house!==null||mode!==null,key=house!==null?`house-${house}`:mode||'full',rows=chartRows(chart,profile,locale)
 const explainedRows=reportRows(chart,house,mode,locale,rows,headings)
 const text=chartText(explainedRows),title=house!==null?`${c.house} ${house}`:headings[['full','planets','houses','method'].indexOf(mode||'full')]
 const dismiss=useCallback(()=>{setMode(null);onHouseClose?.()},[onHouseClose])
 function open(next:Mode){setStatus('');setMode(next)}
 async function copy(full=false){try{await navigator.clipboard.writeText(full?chartText(rows):text);setStatus(c.copied)}catch{setStatus(c.failed)}}
 function excel(){try{downloadWorkbook(rows);setStatus('')}catch{setStatus(c.exportFailed)}}
 function pdf(full=false){try{printReport(full?rows:explainedRows,locale);setStatus(c.pdfHint)}catch{setStatus(c.exportFailed)}}
 function json(){const url=URL.createObjectURL(new Blob([JSON.stringify({format:'orbis-astro-birth-v1',birth:profile,calculation:chart},null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='Orbis-Astro-Birth.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importFile(file:File){try{
  if(file.size>65536)throw new Error('SIZE')
  const data:unknown=JSON.parse(await file.text());if(!data||typeof data!=='object')throw new Error('FORMAT')
  const record=data as {format?:unknown;birth?:unknown};if(record.format!=='orbis-astro-birth-v1'||!record.birth||typeof record.birth!=='object')throw new Error('FORMAT')
  const p=record.birth as Profile;if(!validProfile(p)||!validLocation(p.birthLocation)||!p.birthDate||!p.birthTime||!onImport)throw new Error('INVALID')
  await onImport({name:p.name,birthDate:p.birthDate,birthTime:p.birthTime,birthPlace:p.birthPlace,birthLocation:{label:p.birthLocation.label,latitude:p.birthLocation.latitude,longitude:p.birthLocation.longitude,timezone:p.birthLocation.timezone}});setMode(null);onHouseClose?.();setStatus(locale==='bn'?'জন্মতথ্য import ও নতুন গণনা হয়েছে।':'Birth details imported and recalculated.')
 }catch{setStatus(locale==='bn'?'Import করা যায়নি। সঠিক Orbis জন্মতথ্যের JSON ফাইল দিন।':'Import failed. Use a valid Orbis birth-details JSON file.')}}
 const like={bn:'পছন্দ',hi:'पसंद',en:'Like'}[locale],dislike={bn:'অপছন্দ',hi:'नापसंद',en:'Dislike'}[locale],importLabel=locale==='bn'?'জন্মতথ্য import':'Import birth details'
 return <section className="chart-report chart-report-launcher" aria-label={c.title}><h3>{c.title}</h3><div className="report-heading-list">{(['full','planets','houses','method'] as const).map((item,i)=><button key={item} type="button" onClick={()=>open(item)}>{headings[i]} <span aria-hidden="true">›</span></button>)}</div>{status&&!active&&<output className="status-message">{status}</output>}
 {active&&<ReportPopup title={title} back={back} onDismiss={dismiss}><main className="report-chat-content"><article><h3>{title}</h3>
 <ReportDetails chart={chart} profile={profile} house={house} mode={mode} locale={locale}/>
 <div className="report-actions report-message-actions"><button type="button" aria-label={c.copy} title={c.copy} onClick={()=>{void copy()}}>⧉</button><button type="button" aria-label={like} title={like} aria-pressed={votes[key]==='like'} onClick={()=>setVotes({...votes,[key]:votes[key]==='like'?undefined:'like'})}>👍</button><button type="button" aria-label={dislike} title={dislike} aria-pressed={votes[key]==='dislike'} onClick={()=>setVotes({...votes,[key]:votes[key]==='dislike'?undefined:'dislike'})}>👎</button><button type="button" aria-label={c.pdf} title={c.pdf} onClick={()=>pdf()}>↓</button></div>
 </article><details><summary>{c.text}</summary><textarea readOnly value={text} aria-label={c.text} onFocus={event=>event.currentTarget.select()}/></details>{status&&<output className="status-message">{status}</output>}</main>
 <footer className="report-popup-footer"><div className="report-actions"><button type="button" onClick={()=>{void copy(true)}}>{headings[0]} · {c.copy}</button><button type="button" onClick={()=>pdf(true)}>{c.pdf}</button><button type="button" onClick={excel}>{c.excel}</button><button type="button" onClick={json}>JSON ↓</button><button type="button" disabled={!onImport} onClick={()=>input.current?.click()}>{importLabel} ↑</button></div> <input ref={input} type="file" accept=".json,application/json" hidden onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void importFile(file)}}/></footer></ReportPopup>}

 </section>
}
