import {useMemo,useSyncExternalStore} from 'react'
import {decodeProfile,saveProfile,validProfile,type Profile} from './store'
type Person=Readonly<{id:string;relation:string;profile:Profile}>
const blank:Profile={name:'',birthDate:'',birthTime:'',birthPlace:''}
const key=(scope:string)=>`orbis-maya-family-v1:${encodeURIComponent(scope)}`
function raw(scope:string|null){try{return scope?JSON.stringify([localStorage.getItem(key(scope)),localStorage.getItem(`orbis-maya-profile-v1:${encodeURIComponent(scope)}`)]):'[]'}catch{return '[]'}}
function decode(value:string){
 const [family,own]=JSON.parse(value) as [string|null,string|null]
 let active='self',others:Person[]=[]
 try{const f=JSON.parse(family??'{}') as {active?:unknown;people?:unknown};if(typeof f.active==='string')active=f.active
  if(Array.isArray(f.people))others=f.people.filter((p):p is Person=>Boolean(p&&typeof p==='object'&&typeof p.id==='string'&&p.id!=='self'&&typeof p.relation==='string'&&p.relation.length<=100&&p.profile&&validProfile(p.profile))).slice(0,30)
 }catch{/* Existing own profile remains available. */}
 const people:Person[]=[{id:'self',relation:'self',profile:decodeProfile(own??'')},...others]
 return {active:people.some(p=>p.id===active)?active:'self',people}
}
export function readFamily(scope:string){return decode(raw(scope))}
function write(scope:string,value:ReturnType<typeof decode>){localStorage.setItem(key(scope),JSON.stringify({active:value.active,people:value.people.filter(p=>p.id!=='self')}));window.dispatchEvent(new Event('maya-family'))}
export function selectPerson(scope:string,id:string){const f=readFamily(scope);if(!f.people.some(p=>p.id===id))throw Error('UNKNOWN_PERSON');write(scope,{...f,active:id})}
export function addPerson(scope:string){const f=readFamily(scope);if(f.people.length>=31)throw Error('PROFILE_LIMIT');const id=crypto.randomUUID();write(scope,{active:id,people:[...f.people,{id,relation:'',profile:blank}]});return id}
export function savePerson(scope:string,id:string,profile:Profile,relation:string){
 if(!validProfile(profile)||relation.trim().length>100)throw Error('INVALID_PROFILE')
 const f=readFamily(scope);if(!f.people.some(p=>p.id===id))throw Error('UNKNOWN_PERSON')
 if(id==='self')saveProfile(scope,profile)
 write(scope,{...f,people:f.people.map(p=>p.id===id?{id,relation:relation.trim(),profile:{...profile,name:profile.name.trim(),birthPlace:profile.birthPlace.trim()}}:p)})
}
function subscribe(listener:()=>void){for(const e of ['maya-family','maya-profile','storage'])window.addEventListener(e,listener);return()=>{for(const e of ['maya-family','maya-profile','storage'])window.removeEventListener(e,listener)}}
export function useFamily(scope:string|null){const value=useSyncExternalStore(subscribe,()=>raw(scope));return useMemo(()=>decode(value),[value])}
export function namedPerson(scope:string,query:string){const f=readFamily(scope),lower=query.toLocaleLowerCase();const matches=f.people.filter(p=>p.profile.name.trim().length>=2&&lower.includes(p.profile.name.trim().toLocaleLowerCase()));return matches.length===1?matches[0]:matches.length>1?null:f.people.find(p=>p.id===f.active)!}
