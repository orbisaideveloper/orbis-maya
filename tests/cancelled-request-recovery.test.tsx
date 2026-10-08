import {act,cleanup,renderHook} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({request:vi.fn(),chart:vi.fn()}))
vi.mock('../src/auth/client',()=>({authClient:null}))
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:()=>({configured:true,request:mock.request})}))
vi.mock('../src/astro/savedChart',()=>({ensureChart:mock.chart,birthSignature:()=> 'same'}))
vi.mock('../src/profile/family',()=>({readFamily:()=>({people:[{id:'self',profile:{name:'Owner'}}]})}))
import {sendChat,setChatDraft,useChat,clearChat} from '../src/chat/session'
beforeEach(()=>{mock.chart.mockReset().mockResolvedValue(null);mock.request.mockReset()})
afterEach(()=>cleanup())
it('does not show a network failure from a cancelled old request or overwrite its replacement',async()=>{
 const user='cancelled-request-recovery';let reject!:(e:Error)=>void
 mock.request.mockReturnValueOnce(new Promise<never>((_,r)=>{reject=r})).mockResolvedValueOnce({reply:'New answer'})
 const view=renderHook(()=>useChat(user,'self'));act(()=>setChatDraft(user,'self','Old question'))
 let pending!:ReturnType<typeof sendChat>
 await act(async()=>{pending=sendChat(user,'self','en');await Promise.resolve();await Promise.resolve()})
 expect(mock.request).toHaveBeenCalledOnce()
 act(()=>{clearChat(user,'self');setChatDraft(user,'self','New question')})
 await act(async()=>{await sendChat(user,'self','en');reject(new Error('old transport rejected'));await pending})
 expect(view.result.current.failure).toBeNull();expect(view.result.current.busy).toBe(false)
 expect(view.result.current.messages.map(m=>m.text)).toEqual(['New question','New answer'])
})
