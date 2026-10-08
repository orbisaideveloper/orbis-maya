import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({state:{phase:'signed-out',user:null} as {phase:string;user:{id:string;email:string}|null},submit:vi.fn(),logout:vi.fn(),verify:vi.fn(),recovery:vi.fn(),reset:vi.fn()}))
vi.mock('../src/auth/store',()=>({useAuth:()=>mock.state,authStore:{submit:mock.submit,logout:mock.logout,verify:mock.verify}}))
vi.mock('../src/auth/recovery',()=>({requestRecovery:mock.recovery,resetPassword:mock.reset}))
import AccountScreen from '../src/auth/AccountScreen'
import WelcomeScreen from '../src/auth/WelcomeScreen'
import {setLocale} from '../src/i18n'
beforeEach(()=>{setLocale('en');window.history.replaceState(null,'','/#/account');mock.state={phase:'signed-out',user:null};mock.recovery.mockReset().mockResolvedValue(true);mock.reset.mockReset().mockResolvedValue(true);mock.submit.mockReset().mockResolvedValue('done');mock.verify.mockReset()})
afterEach(()=>cleanup())
it('calls verification from the account retry action',()=>{mock.state={phase:'error',user:null};render(<AccountScreen/>);fireEvent.click(screen.getByRole('button',{name:'Try again'}));expect(mock.verify).toHaveBeenCalledOnce()})
it('leaves recovery and returns to account login',()=>{const view=render(<AccountScreen/>);fireEvent.click(view.container.querySelector('.recovery-link')!);fireEvent.click(screen.getByRole('button',{name:'Sign in',exact:true}));expect(view.container.querySelector('.recovery-link')).toBeInTheDocument();expect(location.hash).toBe('#/account')})
it('prevents a second recovery request while the first is pending',async()=>{
 let finish!:(v:boolean)=>void;mock.recovery.mockReturnValue(new Promise<boolean>(r=>{finish=r}));const view=render(<AccountScreen/>);fireEvent.click(view.container.querySelector('.recovery-link')!);const form=view.container.querySelector('form')!
 fireEvent.change(form.querySelector('[name=email]')!,{target:{value:'owner@example.com'}});fireEvent.submit(form);fireEvent.submit(form);expect(mock.recovery).toHaveBeenCalledOnce();finish(true);await waitFor(()=>expect(screen.getByRole('status')).toBeInTheDocument())
})
it.each([true,false])('reports a reset-password outcome: %s',async done=>{
 mock.state={phase:'signed-in',user:{id:'owner',email:'owner@example.com'}};mock.reset.mockResolvedValue(done);const view=render(<AccountScreen reset/>);const form=view.container.querySelector('form')!;fireEvent.change(form.querySelector('[name=password]')!,{target:{value:'New-password-123'}});fireEvent.change(form.querySelector('[name=confirmation]')!,{target:{value:'New-password-123'}});fireEvent.submit(form);await waitFor(()=>expect(mock.reset).toHaveBeenCalledWith('New-password-123'));await waitFor(()=>expect(screen.getByRole(done?'status':'alert')).toBeInTheDocument())
})
it('prevents repeated login submission while credentials are being checked',async()=>{
 let finish!:(v:string)=>void;mock.submit.mockReturnValue(new Promise<string>(r=>{finish=r}));const view=render(<AccountScreen/>);const form=view.container.querySelector('form')!;fireEvent.change(form.querySelector('[name=email]')!,{target:{value:'owner@example.com'}});fireEvent.change(form.querySelector('[name=password]')!,{target:{value:'password'}});fireEvent.submit(form);fireEvent.submit(form);expect(mock.submit).toHaveBeenCalledOnce();finish('done');await waitFor(()=>expect(form.querySelector('[name=email]')).toHaveValue(''))
})
it.each(['signed-in','signed-out'])('links welcome to the correct account destination: %s',phase=>{mock.state={phase,user:phase==='signed-in'?{id:'owner',email:'owner@example.com'}:null};const view=render(<WelcomeScreen/>);expect(view.container.querySelector('.primary-action')).toHaveAttribute('href',phase==='signed-in'?'#/':'#/account')})
