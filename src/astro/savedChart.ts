import type {Profile} from '../profile/store'
import type {BirthChart} from './calculate'
export const birthSignature=(p:Profile)=>JSON.stringify(['iers-true-frame-v1',p.birthDate,p.birthTime,p.birthLocation])
const key=(scope:string,person:string)=>`orbis-maya-chart-v1:${encodeURIComponent(scope)}:${encodeURIComponent(person)}`
export function readSavedChart(scope:string|null,person:string,profile:Profile):BirthChart|null{
 if(!scope)return null
 try{const saved=JSON.parse(localStorage.getItem(key(scope,person))??'null') as {signature:string;chart:BirthChart}|null,c=saved?.chart
  if(saved?.signature!==birthSignature(profile)||c?.engine!=='Astronomy Engine 2.1.19'||!Number.isFinite(c.ascendant)||!Number.isFinite(c.ayanamsa)||c.planets.length!==9||new Set(c.planets.map(p=>p.id)).size!==9)return null
  if(!c.planets.every(p=>Number.isFinite(p.longitude)&&p.sign===Math.floor(p.longitude/30)&&Math.abs(p.degree-p.longitude%30)<1e-7&&p.house===(p.sign-Math.floor(c.ascendant/30)+12)%12+1))return null
  return c
 }catch{return null}
}
export function saveChart(scope:string,person:string,profile:Profile,chart:BirthChart){localStorage.setItem(key(scope,person),JSON.stringify({signature:birthSignature(profile),savedAt:new Date().toISOString(),chart}));window.dispatchEvent(new Event('maya-chart'))}
export async function ensureChart(scope:string,person:string,profile:Profile){
 const saved=readSavedChart(scope,person,profile);if(saved)return saved
 if(!profile.birthLocation||!profile.birthDate||!profile.birthTime)return undefined
 const {calculateChart}=await import('./calculate');const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation);saveChart(scope,person,profile,chart);return chart
}
