import { calculationTime,nutationLongitude,timePolicy } from './chartTime'
import { Body,Ecliptic,GeoVector,RotateVector,Rotation_ECL_EQJ,Rotation_EQJ_ECT,Rotation_EQD_ECT,SiderealTime,Vector } from 'astronomy-engine'
import { birthUtc,validLocation,type BirthLocation } from './birth'
type ChartBody=Readonly<{id:string;longitude:number;sign:number;degree:number;house:number;retrograde:boolean}>
export type BirthChart=Readonly<{utc:string;ascendant:number;ayanamsa:number;planets:readonly ChartBody[];engine:'Astronomy Engine 2.1.19';method:'Lahiri J2000 anchor; IERS UTC/TT (1972+); whole-sign; true-frame mean nodes';validation:'reference validation pending';timePolicy:string}>
export const normalize=(angle:number)=>((angle%360)+360)%360
const rad=Math.PI/180
// Public numerical anchor: IAE 2019, documented in Swiss Ephemeris manual
// appendix E: mean Lahiri at J2000 TT = 23 degrees 51 minutes 25.5324 seconds.
// This implementation uses Astronomy Engine frame rotation, not Swiss code.
// It is a Lahiri-anchored model; exact Swiss Lahiri equivalence is NOT claimed.
export function ayanamsaAt(utc:string):number {
 const time=calculationTime(utc),anchor=(23+51/60+25.5324/3600)*rad
 const eqj=RotateVector(Rotation_ECL_EQJ(),new Vector(Math.cos(anchor),Math.sin(anchor),0,time))
 const ect=RotateVector(Rotation_EQJ_ECT(time),eqj)
 return normalize(Math.atan2(ect.y,ect.x)/rad)
}
export function ascendantAt(utc:string,latitude:number,longitude:number):number {
 if(!Number.isFinite(latitude)||Math.abs(latitude)>=66||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new Error('UNSUPPORTED_LATITUDE')
 const time=calculationTime(utc),theta=(SiderealTime(time)*15+longitude)*rad,phi=latitude*rad
 // Intersection of true ecliptic with the local geometric horizon, on its east side.
 const northPole=RotateVector(Rotation_EQD_ECT(time),new Vector(0,0,1,time))
 const epsilon=Math.atan2(northPole.y,northPole.z)
 return normalize(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(epsilon)+Math.tan(phi)*Math.sin(epsilon))/rad+180)
}
function houseFor(sign:number,ascendantSign:number){return ((sign-ascendantSign+12)%12)+1}
export function calculateChart(date:string,time:string,location:BirthLocation):BirthChart {
 if(!validLocation(location))throw new Error('INVALID_LOCATION')
 const utc=birthUtc(date,time,location.timezone),year=new Date(utc).getUTCFullYear()
 if(year<1900||year>2100)throw new Error('UNSUPPORTED_DATE')
 if(new Date(utc).getTime()>Date.now())throw new Error('FUTURE_BIRTH_DATE')
 const ayanamsa=ayanamsaAt(utc),ascendant=normalize(ascendantAt(utc,location.latitude,location.longitude)-ayanamsa),ascendantSign=Math.floor(ascendant/30)
 const stamp=new Date(utc).getTime(),instant=calculationTime(utc),before=calculationTime(new Date(stamp-3600000).toISOString()),after=calculationTime(new Date(stamp+3600000).toISOString())
 const bodies=[Body.Sun,Body.Moon,Body.Mercury,Body.Venus,Body.Mars,Body.Jupiter,Body.Saturn]
 const planets:ChartBody[]=bodies.map(body=>{
  const longitude=normalize(Ecliptic(GeoVector(body,instant,true)).elon-ayanamsa),sign=Math.floor(longitude/30)
  const motion=normalize(Ecliptic(GeoVector(body,after,true)).elon-Ecliptic(GeoVector(body,before,true)).elon+180)-180
  return {id:body,longitude,sign,degree:longitude%30,house:houseFor(sign,ascendantSign),retrograde:motion<0}
 })
 // Mean lunar ascending node, polynomial of lunar arguments (Meeus, ch.47).
 const t=instant.tt/36525
 const node=normalize(125.0445479-1934.1362891*t+.0020754*t*t+t*t*t/467441-t*t*t*t/60616000+nutationLongitude(instant)-ayanamsa)
 for(const [id,longitude] of [['Rahu',node],['Ketu',normalize(node+180)]] as const){const sign=Math.floor(longitude/30);planets.push({id,longitude,sign,degree:longitude%30,house:houseFor(sign,ascendantSign),retrograde:true})}
 if(![ascendant,ayanamsa,...planets.map(p=>p.longitude)].every(Number.isFinite))throw new Error('CALCULATION_FAILED')
 return {utc,ascendant,ayanamsa,planets,engine:'Astronomy Engine 2.1.19',method:'Lahiri J2000 anchor; IERS UTC/TT (1972+); whole-sign; true-frame mean nodes',validation:'reference validation pending',timePolicy:timePolicy(utc)}
}
