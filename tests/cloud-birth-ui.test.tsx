import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CloudBirthProfiles from '../src/profile/CloudBirthProfiles'
import { setLocale } from '../src/i18n'
const mocks=vi.hoisted(()=>({request:vi.fn(),family:vi.fn(),save:vi.fn(),restore:vi.fn()}))
vi.mock('../src/profile/cloud-birth',()=>({cloudBirthRequest:mocks.request}))
vi.mock('../src/profile/family',()=>({useFamily:mocks.family,restoreSavedFamily:mocks.restore,savePerson:mocks.save}))
const person={id:'self',relation:'self',profile:{name:'Device',birthDate:'2000-01-01',birthTime:'10:00',birthPlace:'Place'}}
const stored={slot:1,relation:'self',profile:{...person.profile,name:'Saved'}}
beforeEach(()=>{setLocale('en');mocks.family.mockReturnValue({active:'self',people:[person]});mocks.request.mockReset().mockResolvedValue({revision:1,profiles:[stored]});mocks.save.mockReset();mocks.restore.mockReset()})
afterEach(()=>cleanup())
it('does not save until the user confirms, then sends the expected revision',async()=>{
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 fireEvent.click(within(slot).getByRole('button',{name:'Save selected profile'}));expect(mocks.request).toHaveBeenCalledTimes(1)
 fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(mocks.request).toHaveBeenCalledTimes(1)
 fireEvent.click(within(slot).getByRole('button',{name:'Save selected profile'}));fireEvent.click(screen.getByRole('button',{name:'Confirm'}))
 await screen.findByText('Birth details saved to your account.');expect(mocks.request).toHaveBeenLastCalledWith('user-a',expect.any(AbortSignal),{...stored,profile:person.profile,expectedRevision:1})
})
it('restores only after explicit replacement confirmation',async()=>{
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 fireEvent.click(within(slot).getByRole('button',{name:'Restore into selected profile'}));expect(mocks.save).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await screen.findByText('Birth details restored into the selected device profile.')
 expect(mocks.save).toHaveBeenCalledWith('user:user-a','self',stored.profile,'self')
})
it('reports optimistic concurrency conflicts without changing device profiles',async()=>{
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 mocks.request.mockRejectedValueOnce(new Error('MAYA_PROFILE_CONFLICT'))
 fireEvent.click(within(slot).getByRole('button',{name:'Save selected profile'}));fireEvent.click(screen.getByRole('button',{name:'Confirm'}))
 await screen.findByText('Another device changed the profiles. Reload and review before saving.');expect(mocks.save).not.toHaveBeenCalled()
})
it('does not overwrite a profile edited after the confirmation opened',async()=>{
 const view=render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 fireEvent.click(within(slot).getByRole('button',{name:'Restore into selected profile'}))
 mocks.family.mockReturnValue({active:'self',people:[{...person,profile:{...person.profile,name:'Changed'}}]});view.rerender(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>)
 fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await screen.findByText('The selected profile changed. Review your selection and retry.');expect(mocks.save).not.toHaveBeenCalled()
})
it('aborts pending reads on account change and permits retry',async()=>{
 mocks.request.mockRejectedValueOnce(new Error('private'));const view=render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>)
 await screen.findByText('The connection is not ready or profiles could not be loaded. Retry.');const signal=mocks.request.mock.calls[0][1] as AbortSignal
 fireEvent.click(screen.getByRole('button',{name:'Reload'}));await waitFor(()=>expect(mocks.request).toHaveBeenCalledTimes(2));expect(signal.aborted).toBe(true);view.unmount()
})

it('restores the entire saved family only after confirmation',async()=>{
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);await screen.findByRole('region',{name:'Birth profile 5'})
 fireEvent.click(screen.getByRole('button',{name:'Restore saved family'}));expect(mocks.restore).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await screen.findByText('Saved family birth details restored to this device.')
 expect(mocks.restore).toHaveBeenCalledWith('user:user-a',[stored])
})


const failed='The connection is not ready or profiles could not be loaded. Retry.'
function pendingBirth(){
 let resolve!:(value:{revision:number;profiles:typeof stored[]})=>void,reject!:(error:Error)=>void
 const promise=new Promise<{revision:number;profiles:typeof stored[]}>((yes,no)=>{resolve=yes;reject=no})
 return {promise,resolve,reject}
}
it.each(['resolve','reject'] as const)('ignores a late %s from an unmounted account read',async outcome=>{
 const pending=pendingBirth();mocks.request.mockReturnValueOnce(pending.promise)
 const view=render(<CloudBirthProfiles userId="old" scope="user:old"/>);view.unmount()
 await act(async()=>{if(outcome==='resolve')pending.resolve({revision:1,profiles:[stored]});else pending.reject(new Error('private'));await pending.promise.catch(()=>{})})
 expect(screen.queryByText('Saved')).toBeNull()
})
it('keeps save buttons disabled for an unnamed device profile',async()=>{
 mocks.family.mockReturnValue({active:'self',people:[{...person,profile:{...person.profile,name:''}}]})
 mocks.request.mockResolvedValueOnce({revision:0,profiles:[]})
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 expect(within(slot).getByRole('button',{name:'Save selected profile'})).toBeDisabled()
 expect(screen.getByRole('button',{name:'Restore saved family'})).toBeDisabled()
})
it('stops replacement if the selected person changes while confirmation is open',async()=>{
 const view=render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 fireEvent.click(within(slot).getByRole('button',{name:'Restore into selected profile'}))
 mocks.family.mockReturnValue({active:'relative',people:[{...person,id:'relative'}]});view.rerender(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>)
 fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await screen.findByText('The selected profile changed. Review your selection and retry.')
 expect(mocks.save).not.toHaveBeenCalled()
})
it('reports a failed whole-family restore',async()=>{
 mocks.restore.mockImplementationOnce(()=>{throw new Error('storage full')})
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);await screen.findByRole('region',{name:'Birth profile 5'})
 fireEvent.click(screen.getByRole('button',{name:'Restore saved family'}));fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await screen.findByText(failed)
})
it.each(['missing','storage'] as const)('does not claim restore success for %s profile data',async mode=>{
 const entries=[stored];mocks.request.mockResolvedValueOnce({revision:1,profiles:entries})
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 fireEvent.click(within(slot).getByRole('button',{name:'Restore into selected profile'}))
 if(mode==='missing')entries.splice(0);else mocks.save.mockImplementationOnce(()=>{throw new Error('storage full')})
 fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await screen.findByText(failed)
 expect(screen.queryByText('Birth details restored into the selected device profile.')).toBeNull()
})
it.each([new Error('unavailable'),'unavailable'])('sanitizes a non-conflict save failure',async error=>{
 render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 mocks.request.mockRejectedValueOnce(error)
 fireEvent.click(within(slot).getByRole('button',{name:'Save selected profile'}));fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await screen.findByText(failed)
 expect(screen.queryByText('unavailable')).toBeNull()
})
it.each(['resolve','reject'] as const)('aborts a birth save before a late %s',async outcome=>{
 const view=render(<CloudBirthProfiles userId="user-a" scope="user:user-a"/>);const slot=await screen.findByRole('region',{name:'Birth profile 1'})
 const pending=pendingBirth();mocks.request.mockReturnValueOnce(pending.promise)
 fireEvent.click(within(slot).getByRole('button',{name:'Save selected profile'}));fireEvent.click(screen.getByRole('button',{name:'Confirm'}))
 const signal=mocks.request.mock.calls.at(-1)![1] as AbortSignal;view.unmount();expect(signal.aborted).toBe(true)
 await act(async()=>{if(outcome==='resolve')pending.resolve({revision:2,profiles:[stored]});else pending.reject(new Error('private'));await pending.promise.catch(()=>{})})
 expect(screen.queryByText('Birth details saved to your account.')).toBeNull()
})
