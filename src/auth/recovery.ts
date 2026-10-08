import { authClient } from './client'
async function withinDeadline(operation:PromiseLike<boolean>){
 let timer:ReturnType<typeof setTimeout>|undefined
 try{return await Promise.race([operation,new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),10000)})])}catch{return false}finally{clearTimeout(timer)}
}
export async function requestRecovery(email:string){
 if(!authClient)return false
 return withinDeadline((async()=>{const {error}=await authClient.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/#/reset-password`});return !error})())
}
export async function resetPassword(password:string){
 if(!authClient)return false
 return withinDeadline((async()=>{
  const verified=await authClient.auth.getUser()
  if(verified.error||!verified.data.user)return false
  const {error}=await authClient.auth.updateUser({password});return !error
 })())
}
