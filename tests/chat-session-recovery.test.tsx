import {act,cleanup,renderHook} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const transport=vi.hoisted(()=>({request:vi.fn(),chart:vi.fn(),family:vi.fn()}))
vi.mock('../src/auth/client',()=>({authClient:null}))
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:()=>({configured:true,request:transport.request})}))
vi.mock('../src/astro/savedChart',()=>({ensureChart:transport.chart,birthSignature:()=> 'current-birth'}))
vi.mock('../src/profile/family',()=>({readFamily:transport.family}))
import {addClarification,clearAllChats,clearChat,setChatDraft,sendChat,useChat} from '../src/chat/session'
let sequence=0
const owner=()=>`session-recovery-${++sequence}`
const storageKey=(user:string)=>`orbis-maya-chat-v1:${user}:self`
beforeEach(()=>{transport.request.mockReset().mockResolvedValue({reply:'Answer'});transport.chart.mockReset().mockResolvedValue(null);transport.family.mockReset().mockReturnValue({people:[{id:'self',profile:{name:'Owner'}}]})})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('filters corrupt stored messages and caps a restored draft',()=>{
 const user=owner();localStorage.setItem(storageKey(user),JSON.stringify({messages:[null,{id:3,role:'user',text:'bad'},{id:'bad-role',role:'system',text:'bad'},{id:'ok',role:'assistant',text:'safe'}],draft:'x'.repeat(5000),signature:'saved',personId:'relative'}))
 const view=renderHook(()=>useChat(user,'self'));expect(view.result.current.messages).toEqual([{id:'ok',role:'assistant',text:'safe'}]);expect(view.result.current.draft).toHaveLength(4000);expect(view.result.current.signature).toBe('saved');expect(view.result.current.personId).toBe('relative')
})
it('recovers from malformed storage without using it as model context',()=>{
 const user=owner();localStorage.setItem(storageKey(user),'{broken');const view=renderHook(()=>useChat(user,'self'));expect(view.result.current.messages).toEqual([]);expect(view.result.current.draft).toBe('')
})
it('does not migrate an old self draft into an existing conversation',()=>{
 const user=owner();localStorage.setItem(storageKey(user),JSON.stringify({draft:'legacy'}));localStorage.setItem(`orbis-maya-chat-v1:${user}:conversation`,JSON.stringify({draft:'current'}));const view=renderHook(()=>useChat(user,'conversation'));expect(view.result.current.draft).toBe('current')
})
it('reports blocked storage and recovers without losing the live draft',()=>{
 const user=owner(),view=renderHook(()=>useChat(user,'self'));const blocked=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')});act(()=>setChatDraft(user,'self','Keep this'));expect(view.result.current.storageFailed).toBe(true);expect(view.result.current.draft).toBe('Keep this');act(()=>expect(clearChat(user,'self')).toBe(false));blocked.mockRestore();act(()=>setChatDraft(user,'self','Restored'));expect(view.result.current.storageFailed).toBe(false)
})
it('returns failure when deleting device chats is blocked',()=>{
 const user=owner();act(()=>setChatDraft(user,'self','Keep this'));vi.spyOn(Storage.prototype,'removeItem').mockImplementation(()=>{throw new Error('blocked')});expect(clearAllChats(user)).toBe(false)
})
it('ignores whitespace-only questions without contacting the model',async()=>{
 const user=owner();setChatDraft(user,'self','   ');await sendChat(user,'self','en');expect(transport.request).not.toHaveBeenCalled();expect(transport.chart).not.toHaveBeenCalled()
})
it('rejects an unknown person and keeps the draft for correction',async()=>{
 const user=owner(),view=renderHook(()=>useChat(user,'self'));act(()=>setChatDraft(user,'self','Question'));await act(async()=>{await sendChat(user,'self','en','unknown')});expect(view.result.current.failure).toBe('invalid-input');expect(view.result.current.busy).toBe(false);expect(view.result.current.draft).toBe('Question');expect(transport.request).not.toHaveBeenCalled()
})
it('retains the failed question and avoids duplicating it on retry',async()=>{
 const user=owner(),view=renderHook(()=>useChat(user,'self'));transport.request.mockRejectedValueOnce(new Error('offline'));act(()=>setChatDraft(user,'self','Retry question'));await act(async()=>{await sendChat(user,'self','en')});expect(view.result.current.failure).toBe('network');await act(async()=>{await sendChat(user,'self','en')});expect(view.result.current.messages.map(m=>m.role)).toEqual(['user','assistant']);expect(view.result.current.failure).toBeNull();expect(view.result.current.draft).toBe('')
})
it('stores clarification together with the original draft',()=>{
 const user=owner(),view=renderHook(()=>useChat(user,'self'));act(()=>setChatDraft(user,'self','Which person?'));act(()=>addClarification(user,'self','Please select a person'));expect(view.result.current.messages.map(m=>[m.role,m.text])).toEqual([['user','Which person?'],['assistant','Please select a person']]);expect(view.result.current.draft).toBe('')
})
