import {afterEach,expect,it,vi} from 'vitest'
import {birthUtc,searchBirthPlaces,validLocation} from '../src/astro/birth'
const place={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
afterEach(()=>vi.unstubAllGlobals())
it.each([null,0,{}, {...place,label:''},{...place,label:'x'.repeat(201)},{...place,latitude:NaN},{...place,longitude:181},{...place,timezone:'x'.repeat(101)}])('rejects unsafe locations: %j',value=>{expect(validLocation(value)).toBe(false)})
it.each([['wrong','12:00'],['2020-01-01','25:00'],['2020-13-01','12:00']])('rejects malformed birth inputs',(date,time)=>{expect(()=>birthUtc(date,time,'UTC')).toThrow('INVALID_BIRTH_TIME')})
it.each(['a','x'.repeat(201)])('rejects bad queries before transport',async query=>{const transport=vi.fn();vi.stubGlobal('fetch',transport);await expect(searchBirthPlaces(query,'bn',new AbortController().signal)).rejects.toThrow('INVALID_PLACE');expect(transport).not.toHaveBeenCalled()})
it.each([{ok:false,json:async()=>({})},{ok:true,json:async()=>null},{ok:true,json:async()=>({results:{}})}])('rejects failed or malformed responses',async response=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));await expect(searchBirthPlaces('Kolkata','bn',new AbortController().signal)).rejects.toThrow('PLACE_SEARCH_FAILED')})
it('handles absent results, filters unsafe records and caps the examined records',async()=>{
 const transport=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({})}).mockResolvedValueOnce({ok:true,json:async()=>({results:[null,3,{name:'Kolkata',admin2:'District',admin1:'State',country:'India',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'},...Array.from({length:9},()=>({name:'Town',latitude:0,longitude:0,timezone:'UTC'}))]})})
 vi.stubGlobal('fetch',transport);const signal=new AbortController().signal
 expect(await searchBirthPlaces('  Kolkata  ','bn',signal)).toEqual([])
 const result=await searchBirthPlaces('Kolkata','bn',signal);expect(result).toHaveLength(6);expect(result[0].label).toBe('Kolkata, District, State, India')
 expect(transport.mock.calls[0][1]).toEqual({signal,credentials:'omit',referrerPolicy:'no-referrer'})
})
it('propagates cancellation without fabricated places',async()=>{const error=new DOMException('Cancelled','AbortError');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(error));await expect(searchBirthPlaces('Kolkata','bn',new AbortController().signal)).rejects.toBe(error)})
