import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({state:{phase:'signed-in',user:{email:'owner@example.com',user_metadata:{}}} as {phase:string;user:{email?:string;user_metadata?:Record<string,unknown>}|null},name:'',logout:vi.fn(),select:vi.fn(),people:[{id:'self',relation:'',profile:{name:''}},{id:'relative',relation:'',profile:{name:''}}]}))
vi.mock('../src/auth/store',()=>({useAuth:()=>mock.state,authStore:{logout:mock.logout}}))
vi.mock('../src/profile/store',()=>({useProfile:()=>({profile:{name:mock.name}})}))
vi.mock('../src/profile/family',()=>({useFamily:()=>({active:'self',people:mock.people}),selectPerson:mock.select}))
import AccountSummary from '../src/profile/AccountSummary'
import PersonPicker from '../src/profile/PersonPicker'
import {setLocale} from '../src/i18n'
beforeEach(()=>{setLocale('en');mock.name='';mock.state={phase:'signed-in',user:{email:'owner@example.com',user_metadata:{}}};mock.logout.mockReset().mockResolvedValue('done');mock.select.mockReset()})
afterEach(()=>cleanup())
it.each(['checking','error','unconfigured','signed-out'])('offers account access with no identity in phase %s',phase=>{mock.state={phase,user:null};render(<AccountSummary/>);expect(screen.getByRole('link')).toHaveAttribute('href','#/account');expect(screen.queryByText('owner@example.com')).toBeNull()})
it.each([['display','Display name'],['full','Full name'],['missing','Add your name'],['invalid','Add your name'],['local','Device name']])('chooses the correct display name: %s',(kind,expected)=>{
 mock.state.user!.user_metadata=kind==='display'?{display_name:'Display name'}:kind==='full'?{full_name:'Full name'}:kind==='invalid'?{display_name:42,full_name:42}:{};if(kind==='local')mock.name='Device name';render(<AccountSummary/>);expect(screen.getByText(expected)).toBeInTheDocument()
})
it('handles a missing user metadata object safely',()=>{mock.state.user={email:'owner@example.com'};render(<AccountSummary/>);expect(screen.getByText('Add your name')).toBeInTheDocument()})
it('shows progress while logout is pending and re-enables after completion',async()=>{let finish!:(v:string)=>void;mock.logout.mockReturnValue(new Promise<string>(r=>{finish=r}));render(<AccountSummary/>);fireEvent.click(screen.getByRole('button',{name:'Sign out'}));expect(screen.getByRole('button')).toBeDisabled();finish('done');await waitFor(()=>expect(screen.getByRole('button',{name:'Sign out'})).toBeEnabled())})
it('shows unnamed family members and selects the requested person',()=>{render(<PersonPicker scope="user:owner"/>);expect(screen.getAllByRole('option')[1]).toHaveTextContent('New person · New person');fireEvent.change(screen.getByRole('combobox'),{target:{value:'relative'}});expect(mock.select).toHaveBeenCalledWith('user:owner','relative')})
it('cannot change a person without an account scope',()=>{render(<PersonPicker scope={null}/>);expect(screen.getByRole('combobox')).toBeDisabled();fireEvent.change(screen.getByRole('combobox'),{target:{value:'relative'}});expect(mock.select).not.toHaveBeenCalled()})
