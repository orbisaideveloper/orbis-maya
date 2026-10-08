import {afterEach,expect,it,vi} from 'vitest'
import {decodeProfile,saveProfile,validProfile} from '../src/profile/store'
const base={name:'Owner',birthDate:'',birthTime:'',birthPlace:''}
afterEach(()=>vi.restoreAllMocks())
it.each(['null','42','"text"','{}','{"name":42}'])('does not accept malformed profile data: %s',raw=>{
 expect(decodeProfile(raw)).toEqual({name:'',birthDate:'',birthTime:'',birthPlace:''})
})
it.each(['2000-02-30','2000-13-01','not-date','9999-01-01'])('rejects impossible or future birth dates: %s',birthDate=>{
 expect(validProfile({...base,birthDate})).toBe(false);expect(decodeProfile(JSON.stringify({...base,birthDate})).name).toBe('')
})
it('rejects oversized names and places rather than silently saving them',()=>{
 expect(validProfile({...base,name:'x'.repeat(101)})).toBe(false);expect(validProfile({...base,birthPlace:'x'.repeat(201)})).toBe(false);expect(()=>saveProfile('',base)).toThrow('INVALID_PROFILE');expect(()=>saveProfile('user:invalid',{...base,birthTime:'25:00'})).toThrow('INVALID_PROFILE')
})
it('rejects mismatched or invalid coordinates on profile writes',()=>{
 const location={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'};expect(validProfile({...base,birthPlace:'Other',birthLocation:location})).toBe(false);expect(validProfile({...base,birthPlace:'Kolkata',birthLocation:{...location,latitude:100}})).toBe(false);expect(decodeProfile(JSON.stringify({...base,birthPlace:'Other',birthLocation:location})).birthLocation).toBeUndefined()
})
it('retains valid matching coordinates when decoding and saving',()=>{
 const profile={...base,birthPlace:'Kolkata',birthDate:'2000-02-29',birthTime:'23:59',birthLocation:{label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}};expect(decodeProfile(JSON.stringify(profile))).toEqual(profile);saveProfile('validation-owner',profile);expect(JSON.parse(localStorage.getItem('orbis-maya-profile-v1:validation-owner')!)).toEqual(profile)
})
