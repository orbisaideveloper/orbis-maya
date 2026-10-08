export type BirthLocation = Readonly<{label:string;latitude:number;longitude:number;timezone:string}>
export function validLocation(value:unknown):value is BirthLocation {
 if(!value||typeof value!=='object')return false
 const v=value as Record<string,unknown>
 if(typeof v.label!=='string'||!v.label.trim()||v.label.length>200||typeof v.latitude!=='number'||!Number.isFinite(v.latitude)||Math.abs(v.latitude)>90||typeof v.longitude!=='number'||!Number.isFinite(v.longitude)||Math.abs(v.longitude)>180||typeof v.timezone!=='string'||v.timezone.length>100)return false
 try{new Intl.DateTimeFormat('en',{timeZone:v.timezone}).format(0);return true}catch{return false}
}
function formatter(timezone:string){return new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'})}
function partsAt(format:Intl.DateTimeFormat,time:number){const p=Object.fromEntries(format.formatToParts(time).map(part=>[part.type,part.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`}
export function birthUtc(date:string,time:string,timezone:string):string {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('INVALID_BIRTH_TIME')
 const target=`${date}T${time}:00`,naive=Date.parse(target+'Z')
 if(!Number.isFinite(naive)||new Date(naive).toISOString().slice(0,19)!==target)throw new Error('INVALID_BIRTH_TIME')
 const format=formatter(timezone),offsets=new Set<number>()
 // Inspect offsets around this date; never substitute today's UTC offset.
 for(let hour=-36;hour<=36;hour+=6){const sample=naive+hour*3600000;offsets.add(Date.parse(partsAt(format,sample)+'Z')-sample)}
 const matches=[...offsets].map(offset=>naive-offset).filter(candidate=>partsAt(format,candidate)===target)
 if(matches.length!==1)throw new Error(matches.length?'AMBIGUOUS_BIRTH_TIME':'NONEXISTENT_BIRTH_TIME')
 return new Date(matches[0]).toISOString()
}
export async function searchBirthPlaces(query:string,language:string,signal:AbortSignal):Promise<BirthLocation[]> {
 if(query.trim().length<2||query.length>200)throw new Error('INVALID_PLACE')
 const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.searchParams.set('name',query.trim());url.searchParams.set('count','8');url.searchParams.set('language',language)
 const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'})
 if(!response.ok)throw new Error('PLACE_SEARCH_FAILED')
 const body:unknown=await response.json()
 if(!body||typeof body!=='object')throw new Error('PLACE_SEARCH_FAILED')
 const results=(body as {results?:unknown}).results
 if(results===undefined)return []
 if(!Array.isArray(results))throw new Error('PLACE_SEARCH_FAILED')
 return results.slice(0,8).flatMap(item=>{
  if(!item||typeof item!=='object')return []
  const v=item as Record<string,unknown>
  const label=[v.name,v.admin2,v.admin1,v.country].filter(value=>typeof value==='string'&&value).join(', ').slice(0,200)
  const location={label,latitude:v.latitude,longitude:v.longitude,timezone:v.timezone}
  return validLocation(location)?[location]:[]
 })
}
