import {afterEach,expect,it} from 'vitest'
import {addPerson,readFamily,restoreSavedFamily,savePerson} from '../src/profile/family'
const scope='user:family-restore',profile={name:'Saved',birthDate:'2000-01-01',birthTime:'12:30',birthPlace:'Kolkata'}
const entries=[1,2,3,4,5].map(slot=>({slot,relation:'family',profile:{...profile,name:`Person ${slot}`}}))
afterEach(()=>localStorage.clear())
it('restores five members, keeps existing drafts and is idempotent',()=>{
 const local=addPerson(scope);savePerson(scope,local,{...profile,name:'Local'},'friend')
 restoreSavedFamily(scope,entries);expect(readFamily(scope).people).toHaveLength(7)
 expect(readFamily(scope).people.find(p=>p.id===local)?.profile.name).toBe('Local')
 restoreSavedFamily(scope,entries);expect(readFamily(scope).people).toHaveLength(7)
 expect(readFamily('user:another').people).toHaveLength(1)
 restoreSavedFamily(scope,[{...entries[0],profile:{...profile,name:'Updated'}}]);expect(readFamily(scope).people.find(p=>p.id==='cloud-birth-slot-1')?.profile.name).toBe('Updated')
})
it('does not partially restore when the device is full',()=>{
 for(let i=0;i<30;i++)addPerson(scope)
 const previous=JSON.stringify(readFamily(scope));expect(()=>restoreSavedFamily(scope,entries)).toThrow('PROFILE_LIMIT')
 expect(JSON.stringify(readFamily(scope))).toBe(previous)
})
it('rejects invalid family collections without changing device data',()=>{
 for(const invalid of [[],[entries[0],entries[0]],[{...entries[0],slot:6}],[{...entries[0],slot:1.5}],Array(6).fill(entries[0]),[{...entries[0],relation:'x'.repeat(101)}],[{...entries[0],profile:{...profile,name:12 as unknown as string}}]])expect(()=>restoreSavedFamily(scope,invalid)).toThrow()
 expect(()=>restoreSavedFamily('preview',entries)).toThrow()
 expect(readFamily(scope).people).toHaveLength(1)
})
