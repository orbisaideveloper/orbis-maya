import { useMemo, useSyncExternalStore } from 'react'
import { validLocation,type BirthLocation } from '../astro/birth'
import { useAuth } from '../auth/store'
export type Profile = Readonly<{name:string;birthDate:string;birthTime:string;birthPlace:string;birthLocation?:BirthLocation}>
const empty:Profile={name:'',birthDate:'',birthTime:'',birthPlace:''}
const keyFor=(scope:string)=>`orbis-maya-profile-v1:${encodeURIComponent(scope)}`
function subscribe(listener:()=>void){window.addEventListener('maya-profile',listener);window.addEventListener('storage',listener);return()=>{window.removeEventListener('maya-profile',listener);window.removeEventListener('storage',listener)}}
function read(scope:string|null){try{return scope?localStorage.getItem(keyFor(scope))??'':''}catch{return ''}}
export function decodeProfile(raw:string):Profile {
  try{
    const value:unknown=JSON.parse(raw)
    if(!value||typeof value!=='object')return empty
    const entry=value as Record<string,unknown>
    if(!['name','birthDate','birthTime','birthPlace'].every(key=>typeof entry[key]==='string'))return empty
    const profile={name:(entry.name as string).slice(0,100),birthDate:entry.birthDate as string,birthTime:entry.birthTime as string,birthPlace:(entry.birthPlace as string).slice(0,200)}
    const located=validLocation(entry.birthLocation)&&entry.birthLocation.label===profile.birthPlace?{...profile,birthLocation:entry.birthLocation}:profile
    return validProfile(located)?located:empty
  }catch{return empty}
}
export function validProfile(profile:Profile){
  if(profile.birthLocation&&(!validLocation(profile.birthLocation)||profile.birthLocation.label!==profile.birthPlace.trim()))return false
  if(profile.name.trim().length>100||profile.birthPlace.trim().length>200)return false
  if(profile.birthTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(profile.birthTime))return false
  if(profile.birthDate){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate))return false
    const day=new Date(`${profile.birthDate}T00:00:00Z`)
    if(Number.isNaN(day.getTime())||day.toISOString().slice(0,10)!==profile.birthDate||day.getTime()>Date.now())return false
  }
  return true
}
export function saveProfile(scope:string,profile:Profile){
  if(!scope||!validProfile(profile))throw new Error('INVALID_PROFILE')
  localStorage.setItem(keyFor(scope),JSON.stringify({...profile,name:profile.name.trim(),birthPlace:profile.birthPlace.trim()}))
  window.dispatchEvent(new Event('maya-profile'))
}
export function useProfile(){
  const auth=useAuth()
  const preview=(import.meta.env.DEV||import.meta.env.VITE_MAYA_DESIGN_WORKSPACE==='1')&&new URLSearchParams(window.location.search).get('maya-design')==='1'
  const previewScope=preview?'preview-device-draft':null
  const scope=auth.phase==='signed-in'&&auth.user?`user:${auth.user.id}`:previewScope
  const raw=useSyncExternalStore(subscribe,()=>read(scope))
  const profile=useMemo(()=>decodeProfile(raw),[raw])
  return {scope,profile,preview:scope==='preview-device-draft'}
}
