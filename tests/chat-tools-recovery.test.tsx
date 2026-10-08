import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {setLocale} from '../src/i18n'
import ChatTools from '../src/chat/ChatTools'

const download=vi.hoisted(()=>vi.fn())
vi.mock('../src/chat/transcript',async original=>({...await original<typeof import('../src/chat/transcript')>(),downloadChat:download}))
const mocks=vi.hoisted(()=>({save:vi.fn(),clear:vi.fn(),reset:vi.fn(),all:vi.fn(),state:{messages:[{id:'q',role:'user' as const,text:'আমার পাঁচ নম্বর ঘর'},{id:'a',role:'assistant' as const,text:'বৃষ, চন্দ্র ও শুক্র'}],draft:'',busy:false}}))
vi.mock('../src/chat/session',()=>({useChat:()=>mocks.state,clearChat:mocks.reset,clearAllChats:mocks.all}))
vi.mock('../src/storage/history',()=>({createLocalHistory:()=>({repository:()=>({save:mocks.save,clear:mocks.clear})})}))
beforeEach(()=>{setLocale('bn');vi.clearAllMocks();mocks.state.busy=false;mocks.state.messages=[{id:'q',role:'user',text:'আমার পাঁচ নম্বর ঘর'},{id:'a',role:'assistant',text:'বৃষ, চন্দ্র ও শুক্র'}];mocks.save.mockResolvedValue({});mocks.clear.mockResolvedValue(undefined);mocks.reset.mockReturnValue(true);mocks.all.mockReturnValue(true)})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})

function open(){const view=render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'));return view}
it('saves the displayed conversation and reports completion',async()=>{
 open();fireEvent.click(screen.getByRole('button',{name:'চ্যাট সেভ করুন'}))
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('চ্যাট সংরক্ষিত ইনসাইটে সেভ হয়েছে'))
 expect(mocks.save).toHaveBeenCalledOnce();expect(mocks.reset).not.toHaveBeenCalled()
})
it('does not silently truncate a conversation that exceeds the archive limit',async()=>{
 mocks.state.messages=[{id:'q',role:'user',text:'x'.repeat(40001)}]
 open();fireEvent.click(screen.getByRole('button',{name:'চ্যাট সেভ করুন'}))
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('পুরো চ্যাট ডাউনলোড করে রাখুন'))
 expect(mocks.save).not.toHaveBeenCalled()
})
it('starts an empty conversation without trying to archive an empty record',async()=>{
 mocks.state.messages=[];open();fireEvent.click(screen.getByRole('button',{name:'নতুন আলোচনা'}));fireEvent.click(screen.getByRole('button',{name:'নিশ্চিত করুন'}))
 await waitFor(()=>expect(mocks.reset).toHaveBeenCalledOnce());expect(mocks.save).not.toHaveBeenCalled()
})
it.each(['current','all'])('reports device failure while clearing %s chats',async(kind)=>{
 mocks.reset.mockReturnValue(false);mocks.all.mockReturnValue(false)
 open();fireEvent.click(screen.getByRole('button',{name:kind==='all'?'সমস্ত চ্যাট মুছুন':'এই আলোচনা মুছুন'}));fireEvent.click(screen.getByRole('button',{name:'নিশ্চিত করুন'}))
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('কাজটি সম্পূর্ণ হয়নি'))
})
it('copies the whole conversation when native sharing is unavailable',async()=>{
 const writeText=vi.fn().mockResolvedValue(undefined);vi.stubGlobal('navigator',{clipboard:{writeText}})
 open();fireEvent.click(screen.getByRole('button',{name:'শেয়ার করুন'}))
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('চ্যাট কপি হয়েছে'))
 expect(writeText).toHaveBeenCalledWith('আপনি\nআমার পাঁচ নম্বর ঘর\n\nMaya\nবৃষ, চন্দ্র ও শুক্র')
})
it('handles a cancelled share without reporting a failure',async()=>{
 vi.stubGlobal('navigator',{share:vi.fn().mockRejectedValue(Object.assign(new Error('cancel'),{name:'AbortError'}))})
 open();fireEvent.click(screen.getByRole('button',{name:'শেয়ার করুন'}))
 await waitFor(()=>expect(screen.getByRole('button',{name:'শেয়ার করুন'})).toBeEnabled())
 expect(screen.queryByRole('status')).toBeNull()
})
it('reports clipboard failure and releases the action buttons',async()=>{
 vi.stubGlobal('navigator',{clipboard:{writeText:vi.fn().mockRejectedValue(new Error('clipboard'))}})
 open();fireEvent.click(screen.getByRole('button',{name:'শেয়ার করুন'}))
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('কাজটি সম্পূর্ণ হয়নি'))
 expect(screen.getByRole('button',{name:'শেয়ার করুন'})).toBeEnabled()
})
it('downloads without erasing active or archived messages',async()=>{
 open();fireEvent.click(screen.getByRole('button',{name:'চ্যাট ডাউনলোড করুন'}))
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('সম্পন্ন হয়েছে'))
 expect(download).toHaveBeenCalledWith('আপনি\nআমার পাঁচ নম্বর ঘর\n\nMaya\nবৃষ, চন্দ্র ও শুক্র');expect(mocks.reset).not.toHaveBeenCalled();expect(mocks.clear).not.toHaveBeenCalled()
})
it('closes the menu on Escape and outside pointer events but keeps inside clicks open',()=>{
 const view=open(),details=view.container.querySelector('details')!
 fireEvent.pointerDown(screen.getByText('সেভ করা চ্যাট'));expect(details.open).toBe(true)
 fireEvent.keyDown(details,{key:'Enter'});expect(details.open).toBe(true)
 fireEvent.keyDown(details,{key:'Escape'});expect(details.open).toBe(false)
 expect(screen.getByLabelText('চ্যাটের অপশন')).toHaveFocus()
 fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'));fireEvent.pointerDown(document.body);expect(details.open).toBe(false)
})
it('disables save and export when no messages exist',()=>{
 mocks.state.messages=[];open()
 for(const name of ['চ্যাট সেভ করুন','শেয়ার করুন','চ্যাট ডাউনলোড করুন','এই আলোচনা মুছুন'])expect(screen.getByRole('button',{name})).toBeDisabled()
})
