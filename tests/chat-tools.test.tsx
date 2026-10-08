import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {setLocale} from '../src/i18n'
import ChatTools from '../src/chat/ChatTools'

const mocks=vi.hoisted(()=>({save:vi.fn(),clear:vi.fn(),reset:vi.fn(),all:vi.fn(),state:{messages:[{id:'q',role:'user' as const,text:'আমার পাঁচ নম্বর ঘর'},{id:'a',role:'assistant' as const,text:'বৃষ, চন্দ্র ও শুক্র'}],draft:'',busy:false}}))
vi.mock('../src/chat/session',()=>({useChat:()=>mocks.state,clearChat:mocks.reset,clearAllChats:mocks.all}))
vi.mock('../src/storage/history',()=>({createLocalHistory:()=>({repository:()=>({save:mocks.save,clear:mocks.clear})})}))
beforeEach(()=>{setLocale('bn');vi.clearAllMocks();mocks.state.busy=false;mocks.save.mockResolvedValue({});mocks.clear.mockResolvedValue(undefined);mocks.reset.mockReturnValue(true);mocks.all.mockReturnValue(true)})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

it('offers one collapsed disclosure with no permanent toolbar',()=>{
 const view=render(<ChatTools userId="owner"/>)
 expect(screen.getByLabelText('চ্যাটের অপশন')).toHaveTextContent('⋮')
 expect(view.container.querySelector('details')).not.toHaveAttribute('open')
 expect(screen.getByText('শেয়ার করুন')).toBeInTheDocument()
 expect(screen.getByText('সেভ করা চ্যাট').closest('a')).toHaveAttribute('href','#/history')
})

it('archives before clearing a new conversation',async()=>{
 render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'))
 fireEvent.click(screen.getByText('নতুন আলোচনা'));expect(mocks.reset).not.toHaveBeenCalled()
 fireEvent.click(screen.getByText('নিশ্চিত করুন'))
 await waitFor(()=>expect(mocks.reset).toHaveBeenCalledWith('owner','conversation'))
 expect(mocks.save).toHaveBeenCalledWith({title:'আমার পাঁচ নম্বর ঘর',content:'আপনি\nআমার পাঁচ নম্বর ঘর\n\nMaya\nবৃষ, চন্দ্র ও শুক্র'})
 expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.reset.mock.invocationCallOrder[0])
})

it('preserves the conversation when archiving fails',async()=>{
 mocks.save.mockRejectedValue(new Error('storage failed'))
 render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'))
 fireEvent.click(screen.getByText('নতুন আলোচনা'));fireEvent.click(screen.getByText('নিশ্চিত করুন'))
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('কাজটি সম্পূর্ণ হয়নি'))
 expect(mocks.reset).not.toHaveBeenCalled()
})

it('clears only the current conversation after confirmation',async()=>{
 render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'))
 fireEvent.click(screen.getByText('এই আলোচনা মুছুন'))
 expect(screen.getByText(/সেভ করা কপি ও জন্মছক থাকবে/)).toBeInTheDocument()
 fireEvent.click(screen.getByText('নিশ্চিত করুন'))
 await waitFor(()=>expect(mocks.reset).toHaveBeenCalledWith('owner','conversation'))
 expect(mocks.clear).not.toHaveBeenCalled();expect(mocks.all).not.toHaveBeenCalled()
})

it('clears archived and active chats only through the all-chat action',async()=>{
 render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'))
 fireEvent.click(screen.getByText('সমস্ত চ্যাট মুছুন'));fireEvent.click(screen.getByText('নিশ্চিত করুন'))
 await waitFor(()=>expect(mocks.all).toHaveBeenCalledWith('owner'))
 expect(mocks.clear).toHaveBeenCalledOnce()
})

it('keeps the text when the user cancels deletion',()=>{
 render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'))
 fireEvent.click(screen.getByText('এই আলোচনা মুছুন'));fireEvent.click(screen.getByText('বাতিল'))
 expect(mocks.reset).not.toHaveBeenCalled();expect(screen.queryByText('নিশ্চিত করুন')).toBeNull()
})

it('disables destructive actions while an answer is pending',()=>{
 mocks.state.busy=true
 render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'))
 expect(screen.getByRole('button',{name:'নতুন আলোচনা'})).toBeDisabled()
 expect(screen.getByRole('button',{name:'সমস্ত চ্যাট মুছুন'})).toBeDisabled()
})

it('shares the displayed conversation without profile records',async()=>{
 const share=vi.fn().mockResolvedValue(undefined);vi.stubGlobal('navigator',{share})
 render(<ChatTools userId="owner"/>);fireEvent.click(screen.getByLabelText('চ্যাটের অপশন'));fireEvent.click(screen.getByText('শেয়ার করুন'))
 await waitFor(()=>expect(share).toHaveBeenCalledWith({title:'Ask Maya',text:'আপনি\nআমার পাঁচ নম্বর ঘর\n\nMaya\nবৃষ, চন্দ্র ও শুক্র'}))
})
