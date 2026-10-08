import { expect,it,vi,afterEach } from 'vitest'
import { birthUtc,validLocation,searchBirthPlaces } from '../src/astro/birth'
import { decodeProfile,saveProfile } from '../src/profile/store'
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear()})
it('uses birth-date timezone rules and rejects DST gaps and overlaps',()=>{
 expect(birthUtc('1990-01-01','12:00','Asia/Kolkata')).toBe('1990-01-01T06:30:00.000Z')
 expect(birthUtc('2020-01-01','12:00','America/New_York')).toBe('2020-01-01T17:00:00.000Z')
 expect(birthUtc('2020-07-01','12:00','America/New_York')).toBe('2020-07-01T16:00:00.000Z')
 expect(()=>birthUtc('2020-03-08','02:30','America/New_York')).toThrow('NONEXISTENT')
 expect(()=>birthUtc('2020-11-01','01:30','America/New_York')).toThrow('AMBIGUOUS')
 expect(()=>birthUtc('2020-02-31','12:00','Asia/Kolkata')).toThrow()
})
it('validates coordinates, retains legacy profiles and isolates saved account data',()=>{
 const base={name:'A',birthDate:'1990-01-01',birthTime:'12:00',birthPlace:'Kolkata'}
 const birthLocation={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
 expect(decodeProfile(JSON.stringify(base))).toEqual(base)
 expect(validLocation({...birthLocation,latitude:91})).toBe(false)
 expect(validLocation({...birthLocation,timezone:'wrong-zone'})).toBe(false)
 saveProfile('user:alice',{...base,birthLocation})
 expect(decodeProfile(localStorage.getItem('orbis-maya-profile-v1:user%3Aalice')!)).toEqual({...base,birthLocation})
 expect(localStorage.getItem('orbis-maya-profile-v1:user%3Abob')).toBeNull()
 expect(decodeProfile(JSON.stringify({...base,birthPlace:'Other',birthLocation}))).toEqual({...base,birthPlace:'Other'})
})
it('sends only a place query and filters unsafe or incomplete search results',async()=>{
 const transport=vi.fn().mockResolvedValue({ok:true,json:async()=>({results:[{name:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'},{name:'Invalid',latitude:99,longitude:0,timezone:'UTC'}]})})
 vi.stubGlobal('fetch',transport)
 const result=await searchBirthPlaces('Kolkata','bn',new AbortController().signal)
 expect(result).toHaveLength(1)
 const url=transport.mock.calls[0][0] as URL
 expect(url.searchParams.get('name')).toBe('Kolkata')
 expect([...url.searchParams.keys()]).toEqual(['name','count','language'])
})
