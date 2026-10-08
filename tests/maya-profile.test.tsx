import { cleanup,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
import ProfilePanel from '../src/profile/ProfilePanel'
import { decodeProfile,saveProfile,validProfile } from '../src/profile/store'
import { setLocale } from '../src/i18n'
beforeEach(()=>{localStorage.clear();setLocale('bn');window.history.replaceState(null,'','/?maya-design=1#/settings')})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('saves a labelled device draft and restores it without claiming account linkage',()=>{
 const view=render(<ProfilePanel/>)
 fireEvent.change(screen.getByLabelText('নাম'),{target:{value:'Rahul'}})
 fireEvent.change(screen.getByLabelText('জন্ম তারিখ'),{target:{value:'1990-03-12'}})
 fireEvent.click(screen.getByRole('button',{name:'প্রোফাইল সংরক্ষণ করুন'}))
 expect(screen.getByText('এই ডিভাইসে প্রোফাইল সংরক্ষিত হয়েছে।')).toBeInTheDocument()
 view.unmount();render(<ProfilePanel/>)
 expect(screen.getByLabelText('নাম')).toHaveValue('Rahul')
 expect(screen.getByText('লোকাল ডিজাইন প্রোফাইল: এটি কোনও লগইন অ্যাকাউন্টের সঙ্গে যুক্ত নয়।')).toBeInTheDocument()
})
it('isolates user profiles and never silently copies the design draft to an account',()=>{
 const p={name:'A',birthDate:'',birthTime:'',birthPlace:''}
 saveProfile('user:a',p);saveProfile('user:b',{...p,name:'B'})
 expect(localStorage.getItem('orbis-maya-profile-v1:user%3Aa')).toContain('"name":"A"')
 expect(localStorage.getItem('orbis-maya-profile-v1:user%3Ab')).toContain('"name":"B"')
 expect(localStorage.getItem('orbis-maya-profile-v1:preview-device-draft')).toBeNull()
})
it('rejects invalid dates, times, malformed storage and storage failures',()=>{
 const p={name:'A',birthDate:'2025-02-30',birthTime:'',birthPlace:''}
 expect(validProfile(p)).toBe(false)
 expect(validProfile({...p,birthDate:'',birthTime:'25:00'})).toBe(false)
 expect(decodeProfile('{broken').name).toBe('')
 expect(decodeProfile('{"name":4}').name).toBe('')
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')})
 render(<ProfilePanel/>)
 fireEvent.click(screen.getByRole('button',{name:'প্রোফাইল সংরক্ষণ করুন'}))
 expect(screen.getByText('সংরক্ষণ হয়নি। তথ্য ও ডিভাইসের স্টোরেজ দেখে আবার চেষ্টা করুন।')).toBeInTheDocument()
})
