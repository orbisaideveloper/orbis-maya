import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({save:vi.fn(),logout:vi.fn()}))
vi.mock('../src/chat/session',()=>({useChat:()=>({messages:[{id:'q',role:'user',text:'question'}],draft:'',busy:false}),clearChat:()=>true,clearAllChats:()=>true}))
vi.mock('../src/storage/history',()=>({createLocalHistory:()=>({repository:()=>({save:mock.save,clear:vi.fn()})})}))
vi.mock('../src/auth/store',()=>({useAuth:()=>({phase:'signed-in',user:{id:'owner',email:'owner@example.test',user_metadata:{}}}),authStore:{logout:mock.logout}}))
vi.mock('../src/profile/store',()=>({useProfile:()=>({profile:{name:'Owner'}})}))
import ChatTools from '../src/chat/ChatTools'
import AccountSummary from '../src/profile/AccountSummary'
import {setLocale} from '../src/i18n'
beforeEach(()=>{setLocale('en');mock.save.mockReset();mock.logout.mockReset()})
afterEach(()=>cleanup())
it('prevents a second archive action while the first archive is pending',async()=>{
 let finish!:(v:undefined)=>void;mock.save.mockReturnValue(new Promise<undefined>(r=>{finish=r}))
 render(<ChatTools userId="pending-owner"/>);fireEvent.click(screen.getByLabelText('Chat options'))
 const save=screen.getByRole('button',{name:'Save chat',exact:true});fireEvent.click(save)
 expect(save).toBeDisabled();fireEvent.click(save);expect(mock.save).toHaveBeenCalledOnce()
 await act(async()=>finish(undefined));expect(save).toBeEnabled();expect(screen.getByRole('status')).toHaveTextContent('Chat saved')
})
it('prevents repeated sign out while account sign out is pending',async()=>{
 let finish!:(v:string)=>void;mock.logout.mockReturnValue(new Promise<string>(r=>{finish=r}))
 render(<AccountSummary/>);const button=screen.getByRole('button',{name:'Sign out'});fireEvent.click(button)
 expect(button).toBeDisabled();fireEvent.click(button);expect(mock.logout).toHaveBeenCalledOnce()
 await act(async()=>finish('success'));expect(button).toBeEnabled()
})
