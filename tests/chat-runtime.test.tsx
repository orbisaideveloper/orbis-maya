import { cleanup,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
import ChatScreen from '../src/ChatScreen'
import { setLocale } from '../src/i18n'
const mock=vi.hoisted(()=>({request:vi.fn(),configured:true}))
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:()=>({configured:mock.configured,request:mock.request})}))
beforeEach(()=>{setLocale('bn');mock.configured=true;mock.request.mockReset().mockResolvedValue({reply:'এটি একটি বাস্তব gateway response fixture।'})})
afterEach(()=>cleanup())
it('submits text only after Send, keeps language and renders supplied response actions',async()=>{
 render(<ChatScreen userId="alice"/>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'আমি একটি স্বপ্ন দেখেছি'}})
 expect(mock.request).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'পাঠান'}))
 expect(await screen.findByText('এটি একটি বাস্তব gateway response fixture।')).toBeInTheDocument()
 expect(mock.request.mock.calls[0][0]).toMatchObject({capability:'general.chat',language:'bn',input:{messages:[{role:'user',content:'আমি একটি স্বপ্ন দেখেছি'}]}})
 expect(screen.getByRole('button',{name:'কপি করুন'})).toBeInTheDocument()
})
it('keeps Send disabled without a configured gateway and shows no invented answer',()=>{
 mock.configured=false;render(<ChatScreen userId="alice"/>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'hello'}})
 expect(screen.getByRole('button',{name:'পাঠান'})).toBeDisabled();expect(mock.request).not.toHaveBeenCalled()
})
