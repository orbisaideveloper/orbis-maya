import {act,renderHook,waitFor} from '@testing-library/react'
import {expect,it,vi} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createLocalHistory} from '../src/storage/history'
const request=vi.hoisted(()=>vi.fn())
const calculation=vi.hoisted(()=>vi.fn().mockResolvedValue(null))
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:()=>({configured:true,request})}))
vi.mock('../src/auth/client',()=>({authClient:null}))
vi.mock('../src/astro/savedChart',()=>({ensureChart:calculation,birthSignature:()=> 'fixed-signature'}))
vi.mock('../src/profile/family',()=>({readFamily:()=>({people:[{id:'self',profile:{name:'Ajay'}}]})}))
import {useChat,setChatDraft,clearChat,clearAllChats,sendChat} from '../src/chat/session'

it('cannot restore a cleared conversation when a late answer completes',async()=>{
 let finish!:(value:{reply:string})=>void
 request.mockReturnValue(new Promise(resolve=>{finish=resolve}))
 const view=renderHook(()=>useChat('clear-pending-owner','conversation'))
 act(()=>setChatDraft('clear-pending-owner','conversation','Question'))
 let pending:Promise<void>|undefined
 act(()=>{pending=sendChat('clear-pending-owner','conversation','en','self')})
 await waitFor(()=>expect(request).toHaveBeenCalled())
 act(()=>{expect(clearChat('clear-pending-owner','conversation')).toBe(true)})
 await act(async()=>{finish({reply:'Must not return'});await pending})
 expect(view.result.current.messages).toHaveLength(0)
 expect(view.result.current.busy).toBe(false)
 expect(view.result.current.failure).toBeNull()
 view.unmount()
})

it('deletes saved chats without deleting saved dreams, charts or another account',async()=>{
 vi.stubGlobal('IDBKeyRange',IDBKeyRange)
 try{
  const factory=new IDBFactory()
  const owner=createLocalHistory('archive-owner',{factory})
  const other=createLocalHistory('archive-other',{factory})
  await owner.repository('chat').save({title:'Chat',content:'Question and answer'})
  await owner.repository('dream').save({title:'Dream',content:'Dream interpretation'})
  await owner.repository('astro').save({title:'Chart',content:'Calculated chart'})
  await other.repository('chat').save({title:'Other chat',content:'Private other account'})
  await owner.repository('chat').clear()
  expect((await owner.list()).map(entry=>entry.kind).sort()).toEqual(['astro','dream'])
  expect(await other.repository('chat').list()).toHaveLength(1)
 }finally{vi.unstubAllGlobals()}
})

it('clears this user’s legacy threads while preserving another account and profiles',()=>{
 localStorage.setItem('orbis-maya-chat-v1:clear-owner:self',JSON.stringify({messages:[{id:'old',role:'user',text:'old'}]}))
 localStorage.setItem('orbis-maya-chat-v1:other-owner:conversation','other')
 localStorage.setItem('orbis-maya-profile-user:clear-owner','profile')
 const view=renderHook(()=>useChat('clear-owner','conversation'))
 expect(view.result.current.messages).toHaveLength(1)
 act(()=>{expect(clearAllChats('clear-owner')).toBe(true)})
 expect(view.result.current.messages).toHaveLength(0)
 expect(localStorage.getItem('orbis-maya-chat-v1:clear-owner:self')).toBeNull()
 expect(localStorage.getItem('orbis-maya-chat-v1:other-owner:conversation')).toBe('other')
 expect(localStorage.getItem('orbis-maya-profile-user:clear-owner')).toBe('profile')
 view.unmount()
})

it('shows a question during chart preparation and never restores it after clear',async()=>{
 let finish!:()=>void
 calculation.mockImplementationOnce(()=>new Promise(resolve=>{finish=()=>resolve(null)}))
 request.mockClear()
 const view=renderHook(()=>useChat('clear-calculation-owner','conversation'))
 act(()=>setChatDraft('clear-calculation-owner','conversation','Preparing chart question'))
 let pending:Promise<void>|undefined
 act(()=>{pending=sendChat('clear-calculation-owner','conversation','en','self')})
 expect(view.result.current.messages.at(-1)?.text).toBe('Preparing chart question')
 expect(view.result.current.busy).toBe(true)
 expect(request).not.toHaveBeenCalled()
 act(()=>{clearChat('clear-calculation-owner','conversation')})
 await act(async()=>{finish();await pending})
 expect(view.result.current.messages).toHaveLength(0)
 expect(view.result.current.busy).toBe(false)
 expect(request).not.toHaveBeenCalled()
 view.unmount()
})
