import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {addPerson,namedPerson,readFamily,savePerson,selectPerson} from '../src/profile/family'
import PersonPicker from '../src/profile/PersonPicker'
import {setLocale} from '../src/i18n'
const profile={name:'Alice',birthDate:'',birthTime:'',birthPlace:''}
const key='orbis-maya-family-v1:user%3Aalice'
beforeEach(()=>{localStorage.clear();setLocale('en')})
afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear()})
it('creates, renames and selects family members without affecting another account',()=>{
 const id=addPerson('user:alice');savePerson('user:alice',id,{...profile,name:'  Alice  '},'  Sister  ')
 expect(readFamily('user:alice').active).toBe(id);expect(readFamily('user:alice').people[1].relation).toBe('Sister')
 expect(namedPerson('user:alice','ask Alice')).toMatchObject({id})
 expect(namedPerson('user:alice','unmatched')).toMatchObject({id})
 expect(readFamily('user:bob').people).toHaveLength(1)
 selectPerson('user:alice','self');expect(readFamily('user:alice').active).toBe('self')
 expect(()=>selectPerson('user:alice','unknown')).toThrow('UNKNOWN_PERSON')
 expect(()=>savePerson('user:alice','unknown',profile,'')).toThrow('UNKNOWN_PERSON')
 expect(()=>savePerson('user:alice',id,{...profile,birthTime:'99:00'},'')).toThrow('INVALID_PROFILE')
 expect(()=>savePerson('user:alice',id,profile,'x'.repeat(101))).toThrow('INVALID_PROFILE')
})
it('rejects ambiguous name matches and enforces the family limit',()=>{
 const people=Array.from({length:30},(_,i)=>({id:'p'+i,relation:'relative',profile}))
 localStorage.setItem(key,JSON.stringify({active:'missing',people}))
 expect(readFamily('user:alice').active).toBe('self');expect(namedPerson('user:alice','Alice')).toBeNull()
 expect(()=>addPerson('user:alice')).toThrow('PROFILE_LIMIT')
})
it('filters malformed family data and keeps the own profile accessible',()=>{
 localStorage.setItem(key,JSON.stringify({active:3,people:[null,{}, {id:'self',relation:'',profile}, {id:'bad',relation:'x'.repeat(101),profile}, {id:'valid',relation:'',profile}]}))
 expect(readFamily('user:alice').people.map(p=>p.id)).toEqual(['self','valid'])
 localStorage.setItem(key,'{');expect(readFamily('user:alice').people).toHaveLength(1)
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked')})
 expect(readFamily('user:alice').people).toHaveLength(1)
})
it('updates the picker after account-local save and responds to selection',()=>{
 const id=addPerson('user:alice');savePerson('user:alice',id,profile,'Sister')
 render(<PersonPicker scope="user:alice"/>)
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'self'}});expect(readFamily('user:alice').active).toBe('self')
 fireEvent.change(screen.getByRole('combobox'),{target:{value:id}});expect(readFamily('user:alice').active).toBe(id)
})
it.each(['bn','hi','en'] as const)('localizes unnamed profiles and disables unauthenticated selection: %s',locale=>{
 setLocale(locale);const view=render(<PersonPicker scope={null}/>);expect(screen.getByRole('combobox')).toBeDisabled()
 view.rerender(<PersonPicker scope="user:alice" disabled/>);expect(screen.getByRole('combobox')).toBeDisabled()
})
