import {act,renderHook} from '@testing-library/react'
import {expect,it,vi} from 'vitest'
const request=vi.hoisted(()=>vi.fn().mockResolvedValue({reply:'কাগজের আলোচনা'}))
const calculate=vi.hoisted(()=>vi.fn())
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:()=>({configured:true,request})}))
vi.mock('../src/auth/client',()=>({authClient:null}))
vi.mock('../src/astro/savedChart',()=>({ensureChart:calculate,birthSignature:()=> 'fixed'}))
vi.mock('../src/profile/family',()=>({readFamily:()=>({people:[{id:'self',profile:{name:'Owner'}}]})}))
import {useChat,setChatDraft,sendChat} from '../src/chat/session'
it('sends an uploaded chart as document evidence without replacing or persisting profile facts',async()=>{
 const file={kind:'image' as const,name:'another-person.jpg',content:'data:image/jpeg;base64,/9j/2Q=='}
 const view=renderHook(()=>useChat('attachment-owner','conversation'))
 act(()=>setChatDraft('attachment-owner','conversation','এই কাগজ বুঝিয়ে দাও'))
 await act(async()=>{await sendChat('attachment-owner','conversation','bn','self',[file])})
 expect(calculate).not.toHaveBeenCalled()
 const body=request.mock.calls[0][0]
 expect(body.capability).toBe('general.chat');expect(body.input.attachments).toEqual([file]);expect(body.input).not.toHaveProperty('chart')
 expect(localStorage.getItem('orbis-maya-chat-v1:attachment-owner:conversation')).not.toContain('base64')
 expect(view.result.current.messages.at(-1)?.text).toBe('কাগজের আলোচনা');view.unmount()
})
