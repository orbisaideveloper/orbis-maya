import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudBirthRequest, parseCloudBirth } from '../src/profile/cloud-birth'
const auth=vi.hoisted(()=>({available:true,read:vi.fn()}))
vi.mock('../src/auth/client',()=>({get authClient(){return auth.available?{auth:{getSession:auth.read}}:null}}))
const customer={orbisIdentityId:'11111111-1111-7111-8111-111111111111',displayId:'ORB-U-23456789'}
const profile={name:'Sample',birthDate:'2000-01-01',birthTime:'12:30',birthPlace:'Kolkata'}
const entry={slot:1 as const,relation:'self',profile}
const result={version:'orbis.maya.profiles.v1',customer,revision:1,profiles:[entry]}
beforeEach(()=>{auth.available=true;auth.read.mockResolvedValue({data:{session:{access_token:'sample',user:{id:'user-a'}}},error:null});vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json(result)))})
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()})
describe('account-owned cloud birth profiles',()=>{
 it('reads and validates five-slot data using only the existing session',async()=>{
  expect(await cloudBirthRequest('user-a',new AbortController().signal)).toEqual({revision:1,profiles:[entry]})
  expect(fetch).toHaveBeenCalledWith('https://orbis-admin-staging.onrender.com/api/v1/customer/maya/profiles',expect.objectContaining({cache:'no-store',credentials:'omit',redirect:'error'}))
 })
 it('sends an explicit slot and expected revision without account ownership fields',async()=>{
  const patch={...entry,expectedRevision:0};await cloudBirthRequest('user-a',new AbortController().signal,patch)
  expect(fetch).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({method:'POST',body:JSON.stringify(patch)}))
 })
 it('does not accept a stale successful-looking save reply',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...result,revision:0})))
  await expect(cloudBirthRequest('user-a',new AbortController().signal,{...entry,expectedRevision:0})).rejects.toThrow('CLOUD_PROFILE_INVALID')
 })
 it('does not accept conflicting revisions as successful saves',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:409})))
  await expect(cloudBirthRequest('user-a',new AbortController().signal,{...entry,expectedRevision:0})).rejects.toThrow('MAYA_PROFILE_CONFLICT')
 })
 it('does not read another account or an unavailable session',async()=>{
  await expect(cloudBirthRequest('other',new AbortController().signal)).rejects.toThrow('PROFILE_SESSION_CHANGED')
  auth.available=false;await expect(cloudBirthRequest('user-a',new AbortController().signal)).rejects.toThrow('PROFILE_SESSION_CHANGED')
  expect(fetch).not.toHaveBeenCalled()
 })
 it('allows five unique slots and geographic birth details',()=>{
  const located={...profile,birthLocation:{label:'Kolkata',latitude:22.5,longitude:88.3,timezone:'Asia/Kolkata'}}
  expect(parseCloudBirth({...result,profiles:[entry,{...entry,slot:2,profile:located}]}).profiles).toHaveLength(2)
 })
 it.each([null,[],{}, {...result,version:'wrong'}, {...result,customer:{}},{...result,customer:{...customer,displayId:'wrong'}},
 {...result,revision:-1},{...result,revision:1.5},{...result,profiles:null},{...result,profiles:[entry,entry]},{...result,profiles:[entry,entry,entry]},
 ...[null,{...entry,slot:6},{...entry,relation:1},{...entry,profile:{}},{...entry,profile:{...profile,name:''}},{...entry,profile:{...profile,birthDate:'2000-02-30'}}].map(e=>({...result,profiles:[e]})),
 ])('rejects malformed cloud replies %#',value=>expect(()=>parseCloudBirth(value)).toThrow())
})

it('accepts all five family members including the last slot',()=>{
 const profiles=[1,2,3,4,5].map(slot=>({...entry,slot}))
 expect(parseCloudBirth({...result,profiles}).profiles).toHaveLength(5)
 expect(()=>parseCloudBirth({...result,profiles:[...profiles,{...entry,slot:6}]})).toThrow()
})


const location={label:'Kolkata',latitude:22.5,longitude:88.3,timezone:'Asia/Kolkata'}
it('confirms every geographic field after a successful save',async()=>{
 const located={...profile,birthLocation:location}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...result,profiles:[{...entry,profile:located}]})))
 await expect(cloudBirthRequest('user-a',new AbortController().signal,{...entry,profile:located,expectedRevision:0})).resolves.toMatchObject({revision:1})
})
it.each([
 {profile},
 {profile:{...profile,birthLocation:{...location,latitude:23}}},
 {profile:{...profile,birthLocation:{...location,longitude:89}}},
 {profile:{...profile,birthLocation:{...location,timezone:'UTC'}}},
])('rejects successful-looking saves with changed or missing geography %#',async saved=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...result,profiles:[{...entry,...saved}]})))
 await expect(cloudBirthRequest('user-a',new AbortController().signal,{...entry,profile:{...profile,birthLocation:location},expectedRevision:0})).rejects.toThrow('CLOUD_PROFILE_INVALID')
})
it('rejects an unexpected geographic addition',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...result,profiles:[{...entry,profile:{...profile,birthLocation:location}}]})))
 await expect(cloudBirthRequest('user-a',new AbortController().signal,{...entry,expectedRevision:0})).rejects.toThrow('CLOUD_PROFILE_INVALID')
})
