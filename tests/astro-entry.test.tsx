import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AccountScreen from '../src/auth/AccountScreen'
import WelcomeScreen from '../src/auth/WelcomeScreen'
import App from '../src/App'
import { setLocale } from '../src/i18n'
import { setTheme } from '../src/design/theme'

const mock=vi.hoisted(()=>({state:{phase:'signed-out',user:null} as {phase:string;user:{id:string;email:string}|null},submit:vi.fn(),logout:vi.fn(),verify:vi.fn(),recovery:vi.fn(),reset:vi.fn()}))
vi.mock('../src/auth/store',()=>({useAuth:()=>mock.state,authStore:{submit:mock.submit,logout:mock.logout,verify:mock.verify}}))
vi.mock('../src/auth/recovery',()=>({requestRecovery:mock.recovery,resetPassword:mock.reset}))
beforeEach(()=>{localStorage.clear();setLocale('bn');setTheme('astral-blue');window.history.replaceState(null,'','/');mock.state={phase:'signed-out',user:null};mock.submit.mockReset().mockResolvedValue('done');mock.recovery.mockReset().mockResolvedValue(true);mock.reset.mockReset().mockResolvedValue(true)})
afterEach(()=>{cleanup();vi.restoreAllMocks()})

it('shows welcome before login, preserves the original emblem and keeps Ask Maya across themes',()=>{
 const view=render(<App/>)
 for(const theme of ['astral-blue','astral-gold','plain-light'] as const){
  act(()=>setTheme(theme))
  expect(screen.getByRole('heading',{name:'অর্বিস অ্যাস্ট্রো'})).toBeInTheDocument()
  expect(screen.getByText('Ask Maya')).toBeInTheDocument()
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  expect(view.container.querySelector('.entry-brand img')).toHaveAttribute('src','/brand/orbis-maya.png')
 }
})
it('keeps explicit development dashboard preview and never unlocks private normal routes',()=>{
 window.history.replaceState(null,'','/?maya-design=1#/');const view=render(<App/>)
 expect(view.container.querySelector('.dashboard-grid')).toBeInTheDocument()
 act(()=>{window.history.replaceState(null,'','/#/chat');window.dispatchEvent(new HashChangeEvent('hashchange'))})
 expect(screen.getByLabelText('পাসওয়ার্ড',{exact:true})).toBeInTheDocument()
 expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})
it('reveals and hides a password without losing it or submitting it',()=>{
 render(<AccountScreen/>);const input=screen.getByLabelText('পাসওয়ার্ড',{exact:true})
 fireEvent.change(input,{target:{value:'private-password'}})
 fireEvent.click(screen.getByRole('button',{name:'পাসওয়ার্ড দেখান'}))
 expect(input).toHaveAttribute('type','text');expect(input).toHaveValue('private-password')
 fireEvent.click(screen.getByRole('button',{name:'পাসওয়ার্ড লুকোন'}))
 expect(input).toHaveAttribute('type','password');expect(mock.submit).not.toHaveBeenCalled()
})
it('uses generic email recovery, rejects invalid input and prevents duplicate sends',async()=>{
 let resolve!:(value:boolean)=>void
 mock.recovery.mockReturnValue(new Promise<boolean>(done=>{resolve=done}))
 render(<AccountScreen/>);fireEvent.click(screen.getByRole('button',{name:'পাসওয়ার্ড ভুলে গেছেন?'}))
 const input=screen.getByLabelText('ইমেইল'),form=input.closest('form')!
 fireEvent.change(input,{target:{value:'bad'}});fireEvent.submit(form)
 expect(mock.recovery).not.toHaveBeenCalled()
 fireEvent.change(input,{target:{value:' owner@example.com '}});fireEvent.submit(form);fireEvent.submit(form)
 expect(mock.recovery).toHaveBeenCalledOnce();expect(mock.recovery).toHaveBeenCalledWith('owner@example.com')
 await act(async()=>resolve(true))
 expect(screen.getByRole('status')).toHaveTextContent('অ্যাকাউন্টটি উপযুক্ত হলে')
 expect(input).toHaveValue('')
})
it('requires a verified account before password reset and checks matching passwords',async()=>{
 const view=render(<AccountScreen reset/>);expect(screen.getByRole('status')).toHaveTextContent('পুনরুদ্ধার লিঙ্ক')
 expect(screen.queryByLabelText('নতুন পাসওয়ার্ড')).not.toBeInTheDocument()
 mock.state={phase:'signed-in',user:{id:'owner',email:'owner@example.com'}};view.rerender(<AccountScreen reset/>)
 const password=screen.getByLabelText('নতুন পাসওয়ার্ড'),confirmation=screen.getByLabelText('পাসওয়ার্ড আবার লিখুন')
 fireEvent.change(password,{target:{value:'long-password'}});fireEvent.change(confirmation,{target:{value:'wrong-password'}});fireEvent.submit(password.closest('form')!)
 expect(mock.reset).not.toHaveBeenCalled()
 fireEvent.change(confirmation,{target:{value:'long-password'}});fireEvent.submit(password.closest('form')!)
 expect(await screen.findByRole('status')).toHaveTextContent('পাসওয়ার্ড সংরক্ষিত হয়েছে')
 expect(mock.reset).toHaveBeenCalledWith('long-password')
})
it('keeps account and welcome usable in all three languages',()=>{
 for(const locale of ['bn','en','hi'] as const){
  act(()=>setLocale(locale));const view=render(<WelcomeScreen/>)
  expect(screen.getByText('Ask Maya')).toBeInTheDocument();view.unmount()
  const account=render(<AccountScreen/>);expect(account.container.querySelector('input[type="email"]')).toBeInTheDocument();account.unmount()
 }
})

it('hides a previous credential failure after a verified login while retaining logout failure coverage',async()=>{
 mock.submit.mockResolvedValueOnce('failed')
 const view=render(<AccountScreen/>)
 fireEvent.change(screen.getByLabelText('ইমেইল'),{target:{value:'owner@example.com'}})
 fireEvent.change(screen.getByLabelText('পাসওয়ার্ড',{exact:true}),{target:{value:'private-password'}})
 fireEvent.submit(screen.getByLabelText('ইমেইল').closest('form')!)
 expect(await screen.findByRole('alert')).toBeInTheDocument()
 mock.state={phase:'signed-in',user:{id:'owner',email:'owner@example.com'}}
 view.rerender(<AccountScreen/>)
 expect(screen.queryByRole('alert')).not.toBeInTheDocument()
 expect(screen.getByText('owner@example.com')).toBeInTheDocument()
 expect(screen.getByRole('button',{name:'লগআউট'})).toBeEnabled()
})

it('returns verified login to Home and logout through checking to the Login page',()=>{
 window.history.replaceState(null,'','/#/account')
 const view=render(<App/>)
 mock.state={phase:'signed-in',user:{id:'owner',email:'owner@example.com'}}
 act(()=>view.rerender(<App/>))
 expect(window.location.hash).toBe('#/')
 expect(view.container.querySelector('.dashboard-grid')).toBeInTheDocument()
 mock.state={phase:'checking',user:null}
 act(()=>view.rerender(<App/>))
 mock.state={phase:'signed-out',user:null}
 act(()=>view.rerender(<App/>))
 expect(window.location.hash).toBe('#/account')
 expect(screen.getByLabelText('ইমেইল')).toBeInTheDocument()
 expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})
