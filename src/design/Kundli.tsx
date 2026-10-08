import { useState } from 'react'
import type { BirthChart } from '../astro/calculate'
import { reportCopy } from '../astro/chartReport'
import { useLocale } from '../i18n'
const centers=[[100,50],[50,23],[23,50],[50,100],[23,150],[50,177],[100,150],[150,177],[177,150],[150,100],[177,50],[150,23]]
const polygons=["100,1 150,50 100,100 50,50", "1,1 100,1 50,50", "1,1 50,50 1,100", "1,100 50,50 100,100 50,150", "1,100 50,150 1,199", "1,199 50,150 100,199", "100,100 150,150 100,199 50,150", "100,199 150,150 199,199", "199,100 199,199 150,150", "100,100 150,50 199,100 150,150", "199,1 199,100 150,50", "100,1 199,1 150,50"]
const labels={bn:{chart:'১২ ঘরের কুণ্ডলী — গণনা বাকি',house:'ঘর',empty:'গ্রহের অবস্থান এখনও গণনা করা হয়নি।',prompt:'বিস্তারিত দেখতে একটি ঘরে ট্যাপ করুন।'},en:{chart:'12-house birth chart — calculation pending',house:'House',empty:'Planetary positions have not been calculated.',prompt:'Tap a house to view details.'},hi:{chart:'१२ भावों की कुंडली — गणना बाकी',house:'भाव',empty:'ग्रहों की स्थिति की गणना अभी नहीं हुई है।',prompt:'विवरण देखने के लिए किसी भाव पर टैप करें।'}}
export default function Kundli({chart=null,onHouseSelect}:Readonly<{chart?:BirthChart|null;onHouseSelect?:(house:number)=>void}>){
  const locale=useLocale(),label=labels[locale],[selected,setSelected]=useState<number|null>(null)
  const number=(value:number)=>new Intl.NumberFormat(`${locale}-IN`).format(value)
  return <div className="kundli-view">
    <div className="kundli-chart" role="group" aria-label={chart?'12-house whole-sign chart':label.chart}>
      <svg viewBox="0 0 200 200" aria-hidden="true">{selected!==null&&<polygon className="kundli-selection" points={polygons[selected-1]}/>}<path d="M1 1H199V199H1Z M1 1 199 199 M199 1 1 199 M100 1 199 100 100 199 1 100Z"/></svg>
      {centers.map(([x,y],index)=><button key={index} type="button" className="kundli-house" style={{left:`${x/2}%`,top:`${y/2}%`}} aria-label={`${label.house} ${number(index+1)}`} aria-pressed={selected===index+1} onClick={()=>{setSelected(index+1);onHouseSelect?.(index+1)}}>{number(index+1)}{chart&&<small>{number((Math.floor(chart.ascendant/30)+index)%12+1)} · {chart.planets.filter(p=>p.house===index+1).map(p=>short[p.id]?.[locale]||p.id.slice(0,2)).join(' ')}</small>}</button>)}
    </div>
    <p className="chart-legend">{reportCopy[locale].legend}</p>
    {!onHouseSelect&&<p className="kundli-detail" role="status">{selected===null?label.prompt:`${label.house} ${number(selected)}: ${chart?`${signs[locale][(Math.floor(chart.ascendant/30)+selected-1)%12]} — ${chart.planets.filter(p=>p.house===selected).map(p=>`${names[p.id]?.[locale]||p.id} ${p.degree.toFixed(2)}°${p.retrograde?' ℞':''}`).join(', ')||(locale==='bn'?'এই ঘরে গ্রহ নেই।':'No planets in this house.')}`:label.empty}`}</p>}
  </div>
}

const signs={bn:['মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা','তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন'],en:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],hi:['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन']}
const names:Record<string,Record<string,string>>={Sun:{bn:'সূর্য',en:'Sun',hi:'सूर्य'},Moon:{bn:'চন্দ্র',en:'Moon',hi:'चंद्र'},Mercury:{bn:'বুধ',en:'Mercury',hi:'बुध'},Venus:{bn:'শুক্র',en:'Venus',hi:'शुक्र'},Mars:{bn:'মঙ্গল',en:'Mars',hi:'मंगल'},Jupiter:{bn:'বৃহস্পতি',en:'Jupiter',hi:'गुरु'},Saturn:{bn:'শনি',en:'Saturn',hi:'शनि'},Rahu:{bn:'রাহু',en:'Rahu',hi:'राहु'},Ketu:{bn:'কেতু',en:'Ketu',hi:'केतु'}}
const short:Record<string,Record<string,string>>=Object.fromEntries(Object.entries(names).map(([key,value])=>[key,Object.fromEntries(Object.entries(value).map(([locale,name])=>[locale,name.slice(0,2)]))]))
