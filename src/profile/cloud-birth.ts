import { authClient } from '../auth/client'
import { validProfile, type Profile } from './store'
import { requestCustomerData } from './common-profile'
type CloudBirthEntry={slot:1|2|3|4|5;relation:string;profile:Profile}
export type CloudBirthResult={revision:number;profiles:CloudBirthEntry[]}
function record(value:unknown):value is Record<string,unknown>{return Boolean(value&&typeof value==='object'&&!Array.isArray(value))}
export function parseCloudBirth(value:unknown):CloudBirthResult{
 if(!record(value)||value.version!=='orbis.maya.profiles.v1'||!record(value.customer)||
    typeof value.customer.orbisIdentityId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value.customer.orbisIdentityId)||
    typeof value.customer.displayId!=='string'||!/^ORB-U-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/u.test(value.customer.displayId)||
    !Number.isSafeInteger(value.revision)||Number(value.revision)<0||Number(value.revision)>1_000_000_001||!Array.isArray(value.profiles)||value.profiles.length>5)throw new Error('CLOUD_PROFILE_INVALID')
 const profiles:CloudBirthEntry[]=value.profiles.map((entry:unknown)=>{
  if(!record(entry)||(![1,2,3,4,5].includes(Number(entry.slot))||typeof entry.slot!=='number')||typeof entry.relation!=='string'||entry.relation.length>100||!record(entry.profile))throw new Error('CLOUD_PROFILE_INVALID')
  const p=entry.profile
  if(!['name','birthDate','birthTime','birthPlace'].every(k=>typeof p[k]==='string')||!(p.name as string).trim())throw new Error('CLOUD_PROFILE_INVALID')
  const profile=p as unknown as Profile
  if(!validProfile(profile))throw new Error('CLOUD_PROFILE_INVALID')
  return {slot:entry.slot as CloudBirthEntry['slot'],relation:entry.relation,profile}
 })
 if(new Set(profiles.map(p=>p.slot)).size!==profiles.length)throw new Error('CLOUD_PROFILE_INVALID')
 return {revision:Number(value.revision),profiles}
}
function sameLocation(a:Profile['birthLocation'],b:Profile['birthLocation']){
 if(!a||!b)return a===b
 return a.label===b.label&&a.latitude===b.latitude&&a.longitude===b.longitude&&a.timezone===b.timezone
}
export async function cloudBirthRequest(userId:string,signal:AbortSignal,patch?:CloudBirthEntry&{expectedRevision:number}):Promise<CloudBirthResult>{
 const client=authClient
 if(!client)throw new Error('PROFILE_SESSION_CHANGED')
 const result=parseCloudBirth(await requestCustomerData(()=>client.auth.getSession(),userId,signal,'/maya/profiles',patch))
 if(patch){
  const saved=result.profiles.find(p=>p.slot===patch.slot)
  if(result.revision!==patch.expectedRevision+1||!saved||saved.relation!==patch.relation.trim()||
     saved.profile.name!==patch.profile.name.trim()||saved.profile.birthDate!==patch.profile.birthDate||
     saved.profile.birthTime!==patch.profile.birthTime||saved.profile.birthPlace!==patch.profile.birthPlace.trim()||!sameLocation(saved.profile.birthLocation,patch.profile.birthLocation))throw new Error('CLOUD_PROFILE_INVALID')
 }
 return result
}
