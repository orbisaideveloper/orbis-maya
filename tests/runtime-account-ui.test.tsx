import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
import AccountSummary from '../src/profile/AccountSummary'
import DesignScreen from '../src/design/DesignScreen'
import { savePhoto,removePhoto } from '../src/profile/photo'
import { setLocale } from '../src/i18n'
const mock=vi.hoisted(()=>({state:{phase:'signed-in',user:{id:'alice',email:'alice@example.com',user_metadata:{display_name:'Alice'}}} as {phase:string;user:{id:string;email:string;user_metadata:{display_name:string}}|null},logout:vi.fn()}))
vi.mock('../src/auth/store',()=>({useAuth:()=>mock.state,authStore:{logout:mock.logout}}))
beforeEach(()=>{localStorage.clear();setLocale('bn');mock.state={phase:'signed-in',user:{id:'alice',email:'alice@example.com',user_metadata:{display_name:'Alice'}}};mock.logout.mockReset().mockResolvedValue('done')})
afterEach(()=>cleanup())
it('shows the signed-in identity and a profile entry, keeping the edit form off Settings',()=>{
 render(<DesignScreen path="/settings"/>);expect(screen.getByText('alice@example.com')).toBeInTheDocument();expect(screen.getByText('Alice')).toBeInTheDocument()
 expect(screen.getByRole('link',{name:'প্রোফাইল'})).toHaveAttribute('href','#/profile')
 expect(screen.queryByLabelText('জন্ম তারিখ')).not.toBeInTheDocument()
 expect(screen.getByRole('button',{name:'সাইন আউট'})).toBeEnabled()
})
it('reports sign-out failure safely and offers account access after sign-out',async()=>{
 mock.logout.mockResolvedValueOnce('failed');const view=render(<AccountSummary/>);fireEvent.click(screen.getByRole('button',{name:'সাইন আউট'}));await waitFor(()=>expect(screen.getByRole('alert')).toBeInTheDocument())
 mock.state={phase:'signed-out',user:null};view.rerender(<AccountSummary/>);expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();expect(screen.getByRole('link')).toHaveAttribute('href','#/account')
})
it('bounds avatar content and isolates removal by account',()=>{
 const image='data:image/jpeg;base64,YQ=='
 savePhoto('user:alice',image);savePhoto('user:bob',image);removePhoto('user:alice')
 expect(localStorage.getItem('orbis-maya-photo-v1:user%3Aalice')).toBeNull();expect(localStorage.getItem('orbis-maya-photo-v1:user%3Abob')).toBe(image)
 expect(()=>savePhoto('user:alice','https://tracking.example/photo')).toThrow('INVALID_PHOTO')
 expect(()=>savePhoto('user:alice','data:image/jpeg;base64,'+'A'.repeat(150000))).toThrow('INVALID_PHOTO')
})
