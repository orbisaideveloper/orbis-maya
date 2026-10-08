import {act,renderHook,waitFor} from '@testing-library/react'
import {expect,it,vi} from 'vitest'
const request=vi.hoisted(()=>vi.fn())
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:()=>({configured:true,request})}))
vi.mock('../src/auth/client',()=>({authClient:null}))
import {useChat,setChatDraft,sendChat} from '../src/chat/session'
it('finishes a pending answer after the chat view unmounts and restores it for the same account only',async()=>{
 let finish!:(result:{reply:string})=>void
 request.mockReturnValue(new Promise(resolve=>{finish=resolve}))
 const view=renderHook(()=>useChat('background-user','self'))
 act(()=>setChatDraft('background-user','self','hello'))
 let pending:Promise<void>|undefined
 act(()=>{pending=sendChat('background-user','self','en')})
 await waitFor(()=>expect(request).toHaveBeenCalledOnce())
 view.unmount();await act(async()=>{finish({reply:'saved answer'});await pending})
 const restored=renderHook(()=>useChat('background-user','self'))
 expect(restored.result.current.busy).toBe(false)
 expect(restored.result.current.messages.at(-1)?.text).toBe('saved answer')
 expect(localStorage.getItem('orbis-maya-chat-v1:background-user:self')).toContain('saved answer')
 const other=renderHook(()=>useChat('different-user','self'));expect(other.result.current.messages).toHaveLength(0)
 restored.unmount();other.unmount()
})
