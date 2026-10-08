import {beforeEach,expect,it} from 'vitest'
import {addPerson,readFamily,savePerson,selectPerson,namedPerson} from '../src/profile/family'
import {calculateChart} from '../src/astro/calculate'
import {readSavedChart,saveChart} from '../src/astro/savedChart'
const profile={name:'Ajay',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Krishnanagar',birthLocation:{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}}
beforeEach(()=>localStorage.clear())
it('keeps own legacy profile and isolates family members by account and person',()=>{
 localStorage.setItem('orbis-maya-profile-v1:user%3Aa',JSON.stringify(profile));const id=addPerson('user:a');savePerson('user:a',id,{...profile,name:'Rahul'},'son');selectPerson('user:a',id)
 expect(readFamily('user:a').people[0].profile.name).toBe('Ajay');expect(namedPerson('user:a','Rahul এর জন্মছক')?.id).toBe(id)
 expect(readFamily('user:b').people).toHaveLength(1);expect(readFamily('user:b').people[0].profile.name).toBe('')
 expect(namedPerson('user:a','Ajay এবং Rahul')).toBeNull()
})
it('restores chart after leaving the page but never reuses it for changed birth details or another person',()=>{
 const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation);saveChart('user:a','self',profile,chart)
 expect(readSavedChart('user:a','self',JSON.parse(JSON.stringify(profile)))).toEqual(chart)
 expect(readSavedChart('user:a','self',{...profile,birthTime:'00:06'})).toBeNull()
 expect(readSavedChart('user:b','self',profile)).toBeNull();expect(readSavedChart('user:a','other',profile)).toBeNull()
})
