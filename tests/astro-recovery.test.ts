import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { requestRecovery,resetPassword } from '../src/auth/recovery'
const mock=vi.hoisted(()=>({reset:vi.fn(),getUser:vi.fn(),update:vi.fn(),configured:true}))
vi.mock('../src/auth/client',()=>({get authClient(){return mock.configured?{auth:{resetPasswordForEmail:mock.reset,getUser:mock.getUser,updateUser:mock.update}}:null}}))
beforeEach(()=>{mock.configured=true;mock.reset.mockReset().mockResolvedValue({error:null});mock.getUser.mockReset().mockResolvedValue({data:{user:{id:'verified'}},error:null});mock.update.mockReset().mockResolvedValue({error:null});window.history.replaceState(null,'','/')})
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks()})
it('uses an approved same-origin callback and verifies the user before updating a password',async()=>{
 expect(await requestRecovery('owner@example.com')).toBe(true)
 expect(mock.reset).toHaveBeenCalledWith('owner@example.com',{redirectTo:`${window.location.origin}/#/reset-password`})
 expect(await resetPassword('private-password')).toBe(true)
 expect(mock.getUser).toHaveBeenCalledOnce();expect(mock.update).toHaveBeenCalledWith({password:'private-password'})
})
it('denies reset on invalid identity and handles provider failure without exposing details',async()=>{
 mock.getUser.mockResolvedValue({data:{user:null},error:new Error('private detail')})
 expect(await resetPassword('private-password')).toBe(false);expect(mock.update).not.toHaveBeenCalled()
 mock.reset.mockRejectedValue(new Error('private detail'));expect(await requestRecovery('owner@example.com')).toBe(false)
 mock.getUser.mockResolvedValue({data:{user:{id:'verified'}},error:null});mock.update.mockResolvedValue({error:{message:'private detail'}})
 expect(await resetPassword('private-password')).toBe(false)
})
it('fails closed without Auth configuration and stops waiting at the UI deadline',async()=>{
 mock.configured=false;expect(await requestRecovery('owner@example.com')).toBe(false);expect(await resetPassword('private-password')).toBe(false)
 mock.configured=true;vi.useFakeTimers();mock.reset.mockReturnValue(new Promise(()=>{}))
 const pending=requestRecovery('owner@example.com');await vi.advanceTimersByTimeAsync(10000);expect(await pending).toBe(false)
})
