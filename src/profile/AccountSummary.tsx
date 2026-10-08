import { useState } from 'react'
import { useLocale,text } from '../i18n'
import { authStore,useAuth } from '../auth/store'
import { useProfile } from './store'
export default function AccountSummary(){
 const locale=useLocale(),auth=useAuth(),{profile}=useProfile()
 const [busy,setBusy]=useState(false),[failed,setFailed]=useState(false)
 const labels={bn:{name:'নাম',email:'ইমেইল',out:'সাইন আউট',unknown:'নাম যোগ করুন'},en:{name:'Name',email:'Email',out:'Sign out',unknown:'Add your name'},hi:{name:'नाम',email:'ईमेल',out:'साइन आउट',unknown:'नाम जोड़ें'}}[locale]
 async function signOut(){setBusy(true);setFailed(false);const result=await authStore.logout();setBusy(false);setFailed(result==='failed')}
 if(auth.phase!=='signed-in')return <div className="settings-account"><p>{text(locale,auth.phase==='checking'?'checking':auth.phase==='error'?'authFailed':auth.phase==='unconfigured'?'unconfigured':'login')}</p><a className="primary-action" href="#/account">{text(locale,'account')}</a></div>
 const metadata=auth.user?.user_metadata
 const name=profile.name||(typeof metadata?.display_name==='string'?metadata.display_name:typeof metadata?.full_name==='string'?metadata.full_name:'')
 return <section className="settings-account" aria-label={text(locale,'account')}><dl><dt>{labels.name}</dt><dd>{name||labels.unknown}</dd><dt>{labels.email}</dt><dd>{auth.user?.email}</dd></dl><button type="button" className="primary-action" disabled={busy} onClick={()=>{void signOut()}}>{busy?text(locale,'busy'):labels.out}</button>{failed&&<p role="alert">{text(locale,'authFailed')}</p>}</section>
}
