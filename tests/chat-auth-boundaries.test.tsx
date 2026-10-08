import {act,cleanup,renderHook,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
type Session={user:{id:string};access_token:string}
const bridge=vi.hoisted(()=>({request:vi.fn(),chart:vi.fn(),getSession:vi.fn(),unsubscribe:vi.fn(),callback:null as null|((event:string,session:Session|null)=>void),getToken:null as null|(()=>Promise<string|null>)}))
vi.mock('../src/auth/client',()=>({authClient:{auth:{getSession:bridge.getSession,onAuthStateChange:(callback:(event:string,session:Session|null)=>void)=>{bridge.callback=callback;return {data:{subscription:{unsubscribe:bridge.unsubscribe}}}}}}}))
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:(options:{getToken:()=>Promise<string|null>})=>{bridge.getToken=options.getToken;return {configured:true,request:bridge.request}}}))
vi.mock('../src/astro/savedChart',()=>({ensureChart:bridge.chart,birthSignature:()=> 'birth-current'}))
vi.mock('../src/profile/family',()=>({readFamily:()=>({people:[{id:'self',profile:{name:'Owner'}}]})}))
import {clearChat,setChatDraft,sendChat,useChat} from '../src/chat/session'
let sequence=0
const owner=()=>`auth-boundaries-${++sequence}`
beforeEach(()=>{bridge.request.mockReset().mockResolvedValue({reply:'Answer'});bridge.chart.mockReset().mockResolvedValue(null);bridge.getSession.mockReset();bridge.unsubscribe.mockReset();bridge.callback=null;bridge.getToken=null})
afterEach(()=>cleanup())
it.each(['same','other','error','missing'] as const)('only supplies the current account token: %s',mode=>{
 const user=owner();bridge.getSession.mockResolvedValue({data:{session:mode==='missing'?null:{user:{id:mode==='other'?'different':user},access_token:'test-token'}},error:mode==='error'?new Error('auth'):null});setChatDraft(user,'self','Question');return sendChat(user,'self','en').then(async()=>{expect(await bridge.getToken!()).toBe(mode==='same'?'test-token':null);expect(bridge.unsubscribe).toHaveBeenCalledOnce()})
})
it.each(['logout','other-account'] as const)('cancels a pending request after %s',async mode=>{
 const user=owner();let finish!:(value:{reply:string})=>void;bridge.request.mockReturnValue(new Promise(resolve=>{finish=resolve}));const view=renderHook(()=>useChat(user,'self'));act(()=>setChatDraft(user,'self','Private question'));let pending!:ReturnType<typeof sendChat>;act(()=>{pending=sendChat(user,'self','en')});await waitFor(()=>expect(bridge.request).toHaveBeenCalledOnce());act(()=>bridge.callback!('SIGNED_OUT',mode==='logout'?null:{user:{id:'different'},access_token:'other'}));expect((bridge.request.mock.calls[0][1] as AbortSignal).aborted).toBe(true);await act(async()=>{finish({reply:'Late private answer'});await pending});expect(view.result.current.messages.some(m=>m.role==='assistant')).toBe(false);expect(view.result.current.busy).toBe(false);expect(bridge.unsubscribe).toHaveBeenCalledOnce()
})
it('does not send a second request while the first is pending',async()=>{
 const user=owner();let finish!:(value:{reply:string})=>void;bridge.request.mockReturnValue(new Promise(resolve=>{finish=resolve}));setChatDraft(user,'self','Question');const pending=sendChat(user,'self','en');await waitFor(()=>expect(bridge.request).toHaveBeenCalledOnce());await sendChat(user,'self','en');expect(bridge.request).toHaveBeenCalledOnce();finish({reply:'Answer'});await pending
})
it('keeps the active account request when its session refreshes',async()=>{
 const user=owner();let finish!:(value:{reply:string})=>void;bridge.request.mockReturnValue(new Promise(resolve=>{finish=resolve}));setChatDraft(user,'self','Question');const pending=sendChat(user,'self','en');await waitFor(()=>expect(bridge.request).toHaveBeenCalledOnce());bridge.callback!('TOKEN_REFRESHED',{user:{id:user},access_token:'renewed'});expect((bridge.request.mock.calls[0][1] as AbortSignal).aborted).toBe(false);finish({reply:'Answer'});expect(await pending).toBe(true)
})
it('uses verified chart facts and caps restored assistant context',async()=>{
 const user=owner();localStorage.setItem(`orbis-maya-chat-v1:${user}:self`,JSON.stringify({messages:[{id:'a',role:'assistant',text:'Discard leading answer'},{id:'u',role:'user',text:'Previous question'},{id:'b',role:'assistant',text:'x'.repeat(6000)}],draft:'Current question',signature:'birth-current'}));bridge.chart.mockResolvedValue({utc:'1986-05-09T18:35:00Z',ascendant:270,ayanamsa:24,engine:'verified',method:'whole-sign',timePolicy:'test',planets:[{id:'Moon',house:5,degree:4}]});await sendChat(user,'self','en');const payload=bridge.request.mock.calls[0][0];expect(payload.capability).toBe('astro.interpretation');expect(payload.input.chart.planets).toEqual([{id:'Moon',house:5,degree:4}]);expect(payload.input.messages.map((m:{role:string})=>m.role)).toEqual(['user','assistant','user']);expect(payload.input.messages[1].content).toHaveLength(4000)
})
it('does not include old chart context after birth details change',async()=>{
 const user=owner();localStorage.setItem(`orbis-maya-chat-v1:${user}:self`,JSON.stringify({messages:[{id:'u',role:'user',text:'Old chart question'},{id:'a',role:'assistant',text:'Old answer'}],draft:'New question',signature:'old-birth'}));await sendChat(user,'self','en');expect(bridge.request.mock.calls[0][0].input.messages).toEqual([{role:'user',content:'New question'}]);clearChat(user,'self')
})
