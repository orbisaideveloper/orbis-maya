import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({prepare:vi.fn(),share:vi.fn(),save:vi.fn()}))
vi.mock('../src/chat/attachments',()=>({prepareAttachments:mock.prepare}))
vi.mock('../src/chat/session',()=>({useChat:()=>({messages:[{id:'q',role:'user',text:'question'}],draft:'',busy:false}),clearChat:()=>true,clearAllChats:()=>true}))
vi.mock('../src/storage/history',()=>({createLocalHistory:()=>({repository:()=>({save:mock.save,clear:vi.fn()})})}))
import AttachmentPicker from '../src/chat/AttachmentPicker'
import ChatTools from '../src/chat/ChatTools'
import {setLocale} from '../src/i18n'
beforeEach(()=>{setLocale('en');mock.prepare.mockReset();mock.share.mockReset();mock.save.mockReset().mockResolvedValue(undefined)})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('does not publish an attachment error or change busy state after unmount',async()=>{
 let reject!:(e:Error)=>void;mock.prepare.mockReturnValue(new Promise<never>((_,r)=>{reject=r}));const change=vi.fn(),busy=vi.fn();const view=render(<AttachmentPicker value={[]} onChange={change} onBusy={busy}/>);fireEvent.change(view.container.querySelector('input')!,{target:{files:[new File(['file'],'file.txt',{type:'text/plain'})]}});view.unmount();await act(async()=>reject(new Error('parse failed')));expect(change).not.toHaveBeenCalled();expect(busy.mock.calls).toEqual([[true]])
})
it('treats user cancellation of native sharing as cancellation rather than failure',async()=>{
 const error=new Error('cancelled');error.name='AbortError';mock.share.mockRejectedValue(error);Object.defineProperty(navigator,'share',{configurable:true,value:mock.share});render(<ChatTools userId="u"/>);fireEvent.click(screen.getByRole('button',{name:'Share',exact:true}));await waitFor(()=>expect(mock.share).toHaveBeenCalledOnce());await waitFor(()=>expect(screen.getByRole('button',{name:'Share',exact:true})).toBeEnabled());expect(screen.queryByRole('status')).toBeNull()
})
