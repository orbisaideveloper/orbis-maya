import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {setLocale} from '../src/i18n'
const state=vi.hoisted(()=>({scope:'user:recovery' as string|null,preview:false,person:'self',name:'Owner',metadata:{} as Record<string,unknown>,phase:'signed-in',photo:'',save:vi.fn(),add:vi.fn(),logout:vi.fn()}))
vi.mock('../src/auth/store',()=>({useAuth:()=>({phase:state.phase,user:{id:'recovery',email:'owner@example.test',user_metadata:state.metadata}}),authStore:{logout:state.logout}}))
vi.mock('../src/profile/store',()=>({useProfile:()=>({scope:state.scope,preview:state.preview,profile:{name:state.name}})}))
vi.mock('../src/profile/photo',()=>({usePhoto:()=>state.photo}))
vi.mock('../src/profile/family',()=>({useFamily:()=>({active:state.person,people:[{id:state.person,relation:'daughter',profile:{name:'Owner',birthDate:'',birthTime:'',birthPlace:''}}]}),savePerson:state.save,addPerson:state.add}))
vi.mock('../src/profile/PersonPicker',()=>({default:()=>null}))
// Local profile recovery is isolated from cloud loading/status; cloud behavior has its own UI and browser suites.
vi.mock('../src/profile/CloudBirthProfiles',()=>({default:()=>null}))
vi.mock('../src/profile/ProfilePhoto',()=>({default:()=> <span>Photo editor</span>}))
vi.mock('../src/astro/BirthLocationField',()=>({default:({onChange}:Readonly<{onChange:(place:string)=>void}>)=><button type="button" onClick={()=>onChange('Kolkata')}>Choose location</button>}))
import ProfilePanel from '../src/profile/ProfilePanel'
import HomeScreen from '../src/design/HomeScreen'
import AccountSummary from '../src/profile/AccountSummary'
import {ui} from '../src/design/copy'
beforeEach(()=>{setLocale('en');state.scope='user:recovery';state.preview=false;state.person='self';state.name='Owner';state.metadata={};state.phase='signed-in';state.photo='';state.save.mockReset();state.add.mockReset();state.logout.mockReset().mockResolvedValue('success')})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers()})
it('edits birth fields, saves a relative and clears stale success after another edit',()=>{
 state.person='relative';render(<ProfilePanel/>);expect(screen.queryByText('Photo editor')).toBeNull();fireEvent.change(screen.getByLabelText('Relationship'),{target:{value:'sister'}});fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Relative'}});fireEvent.change(screen.getByLabelText(ui('en').birthDate),{target:{value:'2000-01-01'}});fireEvent.change(screen.getByLabelText(ui('en').birthTime),{target:{value:'12:00'}});fireEvent.click(screen.getByRole('button',{name:'Choose location'}));fireEvent.click(screen.getByRole('button',{name:'Save profile'}));expect(state.save).toHaveBeenCalledWith('user:recovery','relative',{name:'Relative',birthDate:'2000-01-01',birthTime:'12:00',birthPlace:'Kolkata',birthLocation:undefined},'sister');expect(screen.getByRole('status')).toHaveTextContent('Profile saved');fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Corrected'}});expect(screen.getByRole('status')).toBeEmptyDOMElement();fireEvent.click(screen.getByRole('button',{name:/Add family/}));expect(state.add).toHaveBeenCalledWith('user:recovery')
})
it('shows save failure and allows correcting and retrying a profile',()=>{
 state.save.mockImplementationOnce(()=>{throw new Error('storage')});render(<ProfilePanel/>);fireEvent.click(screen.getByRole('button',{name:'Save profile'}));expect(screen.getByRole('status')).toHaveTextContent('Save failed');fireEvent.click(screen.getByRole('button',{name:'Choose location'}));expect(screen.getByRole('status')).toBeEmptyDOMElement();fireEvent.click(screen.getByRole('button',{name:'Save profile'}));expect(screen.getByRole('status')).toHaveTextContent('Profile saved')
})
it('disables profile writes when signed out and labels the preview draft',()=>{
 state.scope=null;const view=render(<ProfilePanel/>);expect(screen.getByText('Sign in to save your profile.')).toBeTruthy();expect(screen.getByRole('button',{name:'Save profile'})).toBeDisabled();expect(screen.getByRole('button',{name:/Add family/})).toBeDisabled();state.scope='preview-device-draft';state.preview=true;view.rerender(<ProfilePanel/>);expect(screen.getByText(/Local design profile/)).toBeTruthy()
})
it.each(['bn','hi'] as const)('localizes relationship editing and saves in %s',locale=>{
 state.person='relative';setLocale(locale);render(<ProfilePanel/>);fireEvent.change(screen.getByLabelText(locale==='bn'?'সম্পর্ক':'संबंध'),{target:{value:'family'}});fireEvent.submit(screen.getByRole('button',{name:locale==='bn'?'প্রোফাইল সংরক্ষণ করুন':'प्रोफ़ाइल सहेजें'}).closest('form')!);expect(state.save).toHaveBeenCalledWith(state.scope,'relative',expect.any(Object),'family')
})
it.each([8,14,19])('uses the correct greeting at local hour %s',hour=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,9,8,hour));render(<HomeScreen/>);const copy=ui('en');expect(screen.getByText(new RegExp(hour<12?copy.morning:hour<17?copy.afternoon:copy.evening))).toBeTruthy()
})
it('uses a secure metadata avatar and falls back after an image error',()=>{
 state.name='';state.metadata={display_name:'Metadata owner',avatar_url:'https://example.test/avatar.png'};const view=render(<HomeScreen/>);expect(screen.getByText(/Metadata owner/)).toBeTruthy();const avatar=view.container.querySelector('.dashboard-avatar')!;expect(avatar).toHaveAttribute('src','https://example.test/avatar.png');fireEvent.error(avatar);expect(avatar).toHaveAttribute('src','/brand/orbis-maya.png')
})
it('prefers the device photo and rejects insecure remote avatars',()=>{
 state.name='';state.metadata={display_name:42,picture:'http://example.test/avatar.png'};const view=render(<HomeScreen/>);expect(screen.getByText(/ORBIS/)).toBeTruthy();expect(view.container.querySelector('.dashboard-avatar')).toHaveAttribute('src','/brand/orbis-maya.png');state.photo='blob:device-photo';view.rerender(<HomeScreen/>);expect(view.container.querySelector('.dashboard-avatar')).toHaveAttribute('src','blob:device-photo')
})
it.each(['checking','error','unconfigured','signed-out'])('offers account entry in phase %s',phase=>{
 state.phase=phase;render(<AccountSummary/>);expect(screen.getByRole('link')).toHaveAttribute('href','#/account');expect(screen.queryByRole('button')).toBeNull()
})
it.each([{display_name:'Display name'},{full_name:'Full name'},{}])('uses the available account name safely: %j',metadata=>{
 state.name='';state.metadata=metadata;render(<AccountSummary/>);expect(screen.getByText('display_name' in metadata?metadata.display_name!:'full_name' in metadata?metadata.full_name!:'Add your name')).toBeTruthy()
})
it('reports a failed sign out and clears the error after retry',async()=>{
 state.logout.mockResolvedValueOnce('failed');render(<AccountSummary/>);fireEvent.click(screen.getByRole('button',{name:'Sign out'}));await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'Sign out'}));await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull());expect(state.logout).toHaveBeenCalledTimes(2)
})
