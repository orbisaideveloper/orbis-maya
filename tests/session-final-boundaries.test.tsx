import {act,cleanup,renderHook} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({request:vi.fn(),chart:vi.fn(),tokens:[] as (()=>Promise<string|null>)[]}))
vi.mock('../src/auth/client',()=>({authClient:null}))
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:(options:{getToken:()=>Promise<string|null>})=>{mock.tokens.push(options.getToken);return {configured:true,request:mock.request}}}))
vi.mock('../src/astro/savedChart',()=>({ensureChart:mock.chart,birthSignature:()=> 'same'}))
vi.mock('../src/profile/family',()=>({readFamily:()=>({people:[{id:'self',profile:{name:'Owner'}}]})}))
import {chatConfigured,sendChat,setChatDraft,useChat,clearChat} from '../src/chat/session'
let seq=0
beforeEach(()=>{localStorage.clear();mock.tokens.length=0;mock.chart.mockReset().mockResolvedValue(null);mock.request.mockReset().mockResolvedValue({reply:'answer'})})
afterEach(()=>cleanup())
it('does not supply authentication tokens during capability configuration checks',async()=>{expect(chatConfigured()).toBe(true);expect(await mock.tokens[0]()).toBeNull()})
it('returns no request token when no authentication client is configured',async()=>{const user=`no-client-${++seq}`;setChatDraft(user,'self','question');await sendChat(user,'self','en');expect(await mock.tokens.at(-1)!()).toBeNull()})
it('reduces oversized restored context before sending it to the gateway',async()=>{
 const user=`context-${++seq}`;localStorage.setItem(`orbis-maya-chat-v1:${user}:self`,JSON.stringify({signature:'same',draft:'current',messages:[{id:'u1',role:'user',text:'x'.repeat(30000)},{id:'a1',role:'assistant',text:'old'},{id:'u2',role:'user',text:'recent'},{id:'a2',role:'assistant',text:'recent reply'}]}))
 await sendChat(user,'self','en');const messages=mock.request.mock.calls[0][0].input.messages;expect(messages.map((m:{content:string})=>m.content)).toEqual(['recent','recent reply','current'])
})
it('does not publish an answer after the conversation is cleared during delivery',async()=>{
 const user=`cleared-${++seq}`;let finish!:(v:{reply:string})=>void;mock.request.mockReturnValue(new Promise<{reply:string}>(r=>{finish=r}));const view=renderHook(()=>useChat(user,'self'));act(()=>setChatDraft(user,'self','question'));let pending!:ReturnType<typeof sendChat>;await act(async()=>{pending=sendChat(user,'self','en');await Promise.resolve();await Promise.resolve()});expect(mock.request).toHaveBeenCalledOnce();act(()=>clearChat(user,'self'));await act(async()=>{finish({reply:'late'});await pending});expect(view.result.current.messages).toHaveLength(0);expect(view.result.current.busy).toBe(false)
})
