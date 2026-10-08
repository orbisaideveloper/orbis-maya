import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {birthSignature,ensureChart,readSavedChart,saveChart} from '../src/astro/savedChart'
import {calculateChart} from '../src/astro/calculate'
const profile={name:'Owner',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Krishnanagar',birthLocation:{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}}
const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation)
const key='orbis-maya-chart-v1:user%3Aalice:self'
beforeEach(()=>localStorage.clear())
afterEach(()=>{localStorage.clear();vi.restoreAllMocks()})
it('reuses a verified chart only for the exact account, person and birth inputs',async()=>{
 const listener=vi.fn();window.addEventListener('maya-chart',listener)
 try{saveChart('user:alice','self',profile,chart);expect(listener).toHaveBeenCalledOnce()}finally{window.removeEventListener('maya-chart',listener)}
 expect(readSavedChart('user:alice','self',profile)).toEqual(chart)
 expect(await ensureChart('user:alice','self',profile)).toEqual(chart)
 expect(readSavedChart(null,'self',profile)).toBeNull()
 expect(readSavedChart('user:bob','self',profile)).toBeNull()
 expect(readSavedChart('user:alice','other',profile)).toBeNull()
 expect(readSavedChart('user:alice','self',{...profile,birthTime:'00:06'})).toBeNull()
})
it.each(['birthDate','birthTime','birthLocation'] as const)('does not calculate when %s is missing',async field=>{
 const incomplete={...profile,[field]:field==='birthLocation'?undefined:''}
 expect(await ensureChart('user:alice','self',incomplete)).toBeUndefined();expect(localStorage.getItem(key)).toBeNull()
})
it('freshly calculates and persists a complete uncached profile',async()=>{
 expect(await ensureChart('user:alice','self',profile)).toEqual(chart)
 expect(readSavedChart('user:alice','self',profile)).toEqual(chart)
})
it.each(['engine','ascendant','ayanamsa','count','duplicate','longitude','sign','degree','house','missing planets'])('rejects corrupt chart data: %s',kind=>{
 const altered=JSON.parse(JSON.stringify(chart))
 if(kind==='engine')altered.engine='untrusted'
 if(kind==='ascendant')altered.ascendant=null
 if(kind==='ayanamsa')altered.ayanamsa=null
 if(kind==='count')altered.planets.pop()
 if(kind==='duplicate')altered.planets[1].id=altered.planets[0].id
 if(kind==='longitude')altered.planets[0].longitude=null
 if(kind==='sign')altered.planets[0].sign=-1
 if(kind==='degree')altered.planets[0].degree=-1
 if(kind==='house')altered.planets[0].house=0
 if(kind==='missing planets')delete altered.planets
 localStorage.setItem(key,JSON.stringify({signature:birthSignature(profile),chart:altered}))
 expect(readSavedChart('user:alice','self',profile)).toBeNull()
})
it('handles malformed and inaccessible storage',()=>{
 localStorage.setItem(key,'{');expect(readSavedChart('user:alice','self',profile)).toBeNull()
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked')})
 expect(readSavedChart('user:alice','self',profile)).toBeNull()
})
