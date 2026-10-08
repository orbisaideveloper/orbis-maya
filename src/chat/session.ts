import type {Attachment} from './attachments'
import {useSyncExternalStore} from 'react'
import {authClient} from '../auth/client'
import {createMayaGateway,MayaGatewayError} from '../ai/gateway'
import {ensureChart,birthSignature} from '../astro/savedChart'
import {readFamily} from '../profile/family'
import type {Locale} from '../i18n'
import {responseLanguage} from '../dream/record'
export type Message=Readonly<{id:string;role:'user'|'assistant';text:string}>
type State=Readonly<{messages:readonly Message[];draft:string;busy:boolean;failure:MayaGatewayError['code']|null;storageFailed:boolean;signature:string;personId:string}>
const sessions=new Map<string,State>(),listeners=new Map<string,Set<()=>void>>(),requests=new Map<string,AbortController>()
const key=(user:string,person:string)=>`orbis-maya-chat-v1:${encodeURIComponent(user)}:${encodeURIComponent(person)}`
function read(user:string,person:string):State{
 const k=key(user,person),current=sessions.get(k);if(current)return current
 try{if(person==='conversation'&&!localStorage.getItem(k)){const own=read(user,'self');if(own.messages.length||own.draft){const migrated={...own,busy:false};sessions.set(k,migrated);return migrated}}}catch{/* Device save failures are shown when publishing. */}
 let messages:Message[]=[],draft='',signature='',personId='self'
 try{const v=JSON.parse(localStorage.getItem(k)??'null') as State|null
  if(v&&Array.isArray(v.messages))messages=v.messages.filter(m=>m&&typeof m.id==='string'&&typeof m.text==='string'&&(m.role==='user'||m.role==='assistant'))
  if(typeof v?.draft==='string')draft=v.draft.slice(0,4000)
  if(typeof v?.signature==='string')signature=v.signature
  if(typeof v?.personId==='string')personId=v.personId
 }catch{/* A corrupt local record must not become model context. */}
 const state={messages,draft,busy:false,failure:null,storageFailed:false,signature,personId};sessions.set(k,state);return state
}
function update(user:string,person:string,patch:Partial<State>){const k=key(user,person);let state={...read(user,person),...patch};try{localStorage.setItem(k,JSON.stringify({...state,busy:false,failure:null}));state={...state,storageFailed:false}}catch{state={...state,storageFailed:true}}sessions.set(k,state);listeners.get(k)?.forEach(f=>f());return state}
export function setChatDraft(user:string,person:string,draft:string){update(user,person,{draft})}
export function clearChat(user:string,person:string){
 const k=key(user,person);requests.get(k)?.abort();requests.delete(k)
 return !update(user,person,{messages:[],draft:'',signature:'',personId:'self',failure:null,busy:false}).storageFailed
}
export function clearAllChats(user:string){
 const prefix=`orbis-maya-chat-v1:${encodeURIComponent(user)}:`
 try{
  const keys=new Set([...sessions.keys(),...Array.from({length:localStorage.length},(_,index)=>localStorage.key(index)).filter((k):k is string=>k!==null)])
  for(const k of keys)if(k.startsWith(prefix)){
   requests.get(k)?.abort();requests.delete(k);localStorage.removeItem(k)
   sessions.set(k,{messages:[],draft:'',signature:'',personId:'self',failure:null,busy:false,storageFailed:false})
   listeners.get(k)?.forEach(f=>f())
  }
  return clearChat(user,'conversation')
 }catch{return false}
}
export function useChat(user:string,person:string){const k=key(user,person);return useSyncExternalStore(listener=>{const set=listeners.get(k)??new Set();set.add(listener);listeners.set(k,set);return()=>{set.delete(listener);if(!set.size)listeners.delete(k)}},()=>read(user,person))}
export const chatConfigured=()=>createMayaGateway({url:import.meta.env.VITE_MAYA_GATEWAY_URL,getToken:async()=>null}).configured
export async function sendChat(user:string,person:string,locale:Locale,targetPerson=person,attachments:readonly Attachment[]=[]){
 const k=key(user,person),initial=read(user,person);if(requests.has(k)||!initial.draft.trim())return
 const controller=new AbortController();requests.set(k,controller);update(user,person,{busy:true,failure:null})
 const auth=authClient?.auth.onAuthStateChange((_event,session)=>{if(!session||session.user.id!==user)controller.abort()})
 let stage='profile'
 try{
  const profile=readFamily(`user:${user}`).people.find(p=>p.id===targetPerson)?.profile;if(!profile)throw new MayaGatewayError('invalid-input')
  const signature=birthSignature(profile),next:Message={id:crypto.randomUUID(),role:'user',text:initial.draft.trim()}
  // Old conversation stays visible; changed birth details start fresh model context.
  const last=initial.messages.at(-1),full=last?.role==='user'&&last.text===next.text?[...initial.messages]:[...initial.messages,next]
  update(user,person,{messages:full,personId:targetPerson})
  stage='chart-preparation'
  const chart=attachments.length?undefined:await ensureChart(`user:${user}`,targetPerson,profile)
  if(controller.signal.aborted||requests.get(k)!==controller)return
  const history=(initial.signature===signature?full:[next]).slice(-5)
  while(history.length>1&&history[0].role!=='user')history.shift()
  const facts=chart?{utc:chart.utc,ascendant:chart.ascendant,ayanamsa:chart.ayanamsa,engine:chart.engine,method:chart.method,timePolicy:chart.timePolicy,planets:chart.planets.map(p=>({...p}))}:undefined
  const mapped=()=>history.map(m=>({role:m.role,content:m.role==='assistant'?m.text.slice(0,4000):m.text}))
  while(history.length>1&&new TextEncoder().encode(JSON.stringify({messages:mapped(),chart:facts})).byteLength>28000)history.splice(0,2)
  stage='gateway'
  const gateway=createMayaGateway({url:import.meta.env.VITE_MAYA_GATEWAY_URL,getToken:async()=>{if(!authClient)return null;const {data,error}=await authClient.auth.getSession();return !error&&data.session?.user.id===user?data.session.access_token:null}})
  const language=responseLanguage(next.text,locale)
  const result=facts?await gateway.request({version:'maya.v1',capability:'astro.interpretation',language,input:{messages:mapped(),chart:facts}},controller.signal):await gateway.request({version:'maya.v1',capability:'general.chat',language,input:{messages:mapped(),...(attachments.length?{attachments:[...attachments]}:{})}},controller.signal)
  if(!controller.signal.aborted){update(user,person,{messages:[...full,{id:crypto.randomUUID(),role:'assistant',text:result.reply}],draft:'',signature});return true}
 }catch(cause){if(!controller.signal.aborted){console.warn('MAYA_CHAT_FAILURE_STAGE:',stage);update(user,person,{failure:cause instanceof MayaGatewayError?cause.code:'network'})}}
 finally{auth?.data.subscription.unsubscribe();if(requests.get(k)===controller){requests.delete(k);update(user,person,{busy:false})}}
}

export function addClarification(user:string,thread:string,reply:string){const s=read(user,thread);update(user,thread,{messages:[...s.messages,{id:crypto.randomUUID(),role:'user',text:s.draft},{id:crypto.randomUUID(),role:'assistant',text:reply}],draft:''})}
