import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {setLocale} from '../src/i18n'
import ProfilePhoto from '../src/profile/ProfilePhoto'
const photo=vi.hoisted(()=>({scope:'user:a' as string|null,value:'',prepare:vi.fn(),save:vi.fn(),remove:vi.fn()}))
vi.mock('../src/profile/store',()=>({useProfile:()=>({scope:photo.scope})}))
vi.mock('../src/profile/photo',()=>({usePhoto:()=>photo.value,preparePhoto:photo.prepare,savePhoto:photo.save,removePhoto:photo.remove}))
const jpeg='data:image/jpeg;base64,/9j/2Q=='
beforeEach(()=>{setLocale('bn');photo.scope='user:a';photo.value='';vi.clearAllMocks();photo.prepare.mockReset().mockResolvedValue(jpeg);photo.remove.mockReset()})
afterEach(()=>cleanup())
function select(){fireEvent.change(screen.getByLabelText('প্রোফাইল ছবি'),{target:{files:[new File(['x'],'photo.jpg',{type:'image/jpeg'})]}})}
it('uses the emblem until a valid photo is saved',async()=>{
 const view=render(<ProfilePhoto/>);expect(view.container.querySelector('img')).toHaveAttribute('src','/brand/orbis-maya.png');select()
 await waitFor(()=>expect(photo.save).toHaveBeenCalledWith('user:a',jpeg));expect(screen.getByLabelText('প্রোফাইল ছবি')).toBeEnabled()
})
it('keeps the upload disabled without an account scope and ignores cancelled selections',()=>{
 photo.scope=null;render(<ProfilePhoto/>);expect(screen.getByLabelText('প্রোফাইল ছবি')).toBeDisabled();select();expect(photo.prepare).not.toHaveBeenCalled()
 cleanup();photo.scope='user:a';render(<ProfilePhoto/>);fireEvent.change(screen.getByLabelText('প্রোফাইল ছবি'),{target:{files:[]}});expect(photo.prepare).not.toHaveBeenCalled()
})
it('preserves a saved photo when reading the new one fails',async()=>{
 photo.value=jpeg;photo.prepare.mockRejectedValue(new Error('READ'));const view=render(<ProfilePhoto/>);select()
 expect(await screen.findByRole('alert')).toHaveTextContent('ছবি রাখা যায়নি');expect(view.container.querySelector('img')).toHaveAttribute('src',jpeg);expect(photo.save).not.toHaveBeenCalled()
})
it('removes only this account photo and reports removal failures',()=>{
 photo.value=jpeg;render(<ProfilePhoto/>);fireEvent.click(screen.getByRole('button',{name:'ছবি সরান'}));expect(photo.remove).toHaveBeenCalledWith('user:a')
 photo.remove.mockImplementation(()=>{throw new Error('STORAGE')});fireEvent.click(screen.getByRole('button',{name:'ছবি সরান'}));expect(screen.getByRole('alert')).toHaveTextContent('ছবি রাখা যায়নি')
})
it.each(['resolve','reject'] as const)('ignores late %s after the account changes',async(outcome)=>{
 let resolve!:(value:string)=>void,reject!:(error:Error)=>void
 photo.prepare.mockReturnValue(new Promise((done,fail)=>{resolve=done;reject=fail}));const view=render(<ProfilePhoto/>);select()
 expect(screen.getByLabelText('প্রোফাইল ছবি')).toBeDisabled();photo.scope='user:b';view.rerender(<ProfilePhoto/>)
 await act(async()=>{if(outcome==='resolve')resolve(jpeg);else reject(new Error('READ'))})
 expect(photo.save).not.toHaveBeenCalled();expect(screen.queryByRole('alert')).toBeNull()
})
it.each([['en','Profile photo'],['hi','प्रोफ़ाइल फ़ोटो']] as const)('localizes the file input in %s',(locale,label)=>{
 setLocale(locale);render(<ProfilePhoto/>);expect(screen.getByLabelText(label)).toBeInTheDocument()
})
