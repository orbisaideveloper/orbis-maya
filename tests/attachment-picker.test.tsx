import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {setLocale} from '../src/i18n'
import AttachmentPicker from '../src/chat/AttachmentPicker'
const prepare=vi.hoisted(()=>vi.fn())
vi.mock('../src/chat/attachments',()=>({prepareAttachments:prepare}))
const attachment={kind:'text' as const,name:'note.txt',content:'বাংলা'}
beforeEach(()=>{setLocale('bn');prepare.mockReset().mockResolvedValue([attachment])})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
function setup(disabled=false,value:readonly typeof attachment[]=[]){
 const onChange=vi.fn(),onBusy=vi.fn();const view=render(<AttachmentPicker value={value} onChange={onChange} onBusy={onBusy} disabled={disabled}/>)
 const input=view.container.querySelector('input')!
 return {...view,input,onChange,onBusy}
}
it('opens the native chooser only through the plus menu and can remove evidence',()=>{
 const view=setup(false,[attachment]);fireEvent.click(screen.getByLabelText('ফাইল যোগ করুন'))
 const click=vi.spyOn(view.input,'click');fireEvent.click(screen.getByRole('button',{name:'ছবি বা ফাইল বাছুন'}));expect(click).toHaveBeenCalledOnce()
 expect(screen.getByText('note.txt')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'সরান'}));expect(view.onChange).toHaveBeenCalledWith([])
})
it('keeps all file actions disabled when the caller is busy',()=>{
 setup(true,[attachment]);fireEvent.click(screen.getByLabelText('ফাইল যোগ করুন'))
 expect(screen.getByRole('button',{name:'ছবি বা ফাইল বাছুন'})).toBeDisabled()
 expect(screen.getByRole('button',{name:'সরান'})).toBeDisabled()
})
it('prepares selected files, closes the menu and releases the busy state',async()=>{
 const view=setup();fireEvent.click(screen.getByLabelText('ফাইল যোগ করুন'))
 const file=new File(['x'],'note.txt',{type:'text/plain'})
 fireEvent.change(view.input,{target:{files:[file]}})
 expect(view.container.querySelector('details')).not.toHaveAttribute('open')
 await waitFor(()=>expect(view.onChange).toHaveBeenCalledWith([attachment]))
 expect(prepare).toHaveBeenCalledWith([file]);expect(view.onBusy.mock.calls).toEqual([[true],[false]])
 expect(view.input.value).toBe('')
})
it('does not prepare a cancelled selection',()=>{
 const view=setup();fireEvent.change(view.input,{target:{files:[]}});fireEvent.change(view.input,{target:{files:null}})
 expect(prepare).not.toHaveBeenCalled();expect(view.onBusy).not.toHaveBeenCalled()
})
it('shows a readable failure and preserves the old evidence',async()=>{
 prepare.mockRejectedValue(new Error('SIZE'));const view=setup(false,[attachment])
 fireEvent.change(view.input,{target:{files:[new File(['x'],'bad.pdf')]}})
 expect(await screen.findByRole('alert')).toHaveTextContent('ফাইল পড়া যায়নি')
 expect(view.onChange).not.toHaveBeenCalled();expect(view.onBusy.mock.calls).toEqual([[true],[false]])
 expect(screen.getByText('note.txt')).toBeInTheDocument()
})
it('shows preparation progress until parsing finishes',async()=>{
 let resolve!:(value:typeof attachment[])=>void
 prepare.mockReturnValue(new Promise(done=>{resolve=done}));const view=setup()
 fireEvent.change(view.input,{target:{files:[new File(['x'],'note.txt')]}})
 expect(screen.getByRole('status')).toHaveTextContent('ফাইল প্রস্তুত হচ্ছে')
 fireEvent.click(screen.getByLabelText('ফাইল যোগ করুন'));expect(screen.getByRole('button',{name:'ছবি বা ফাইল বাছুন'})).toBeDisabled()
 await act(async()=>resolve([attachment]));expect(screen.queryByRole('status')).toBeNull()
})
it.each(['resolve','reject'] as const)('ignores a late %s after unmount',async(outcome)=>{
 let resolve!:(value:typeof attachment[])=>void,reject!:(error:Error)=>void
 prepare.mockReturnValue(new Promise((done,fail)=>{resolve=done;reject=fail}));const view=setup()
 fireEvent.change(view.input,{target:{files:[new File(['x'],'note.txt')]}});view.unmount()
 await act(async()=>{if(outcome==='resolve')resolve([attachment]);else reject(new Error('READ'))})
 expect(view.onChange).not.toHaveBeenCalled();expect(view.onBusy.mock.calls).toEqual([[true]])
})
it.each([['en','Add files','Choose photo or file'],['hi','फाइल जोड़ें','चित्र या फाइल चुनें']] as const)('localizes the chooser in %s',(locale,add,choose)=>{
 setLocale(locale);setup();fireEvent.click(screen.getByLabelText(add));expect(screen.getByRole('button',{name:choose})).toBeInTheDocument()
})
