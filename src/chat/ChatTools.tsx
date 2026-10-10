import {useEffect,useRef,useState} from 'react'
import {useLocale} from '../i18n'
import {createLocalHistory} from '../storage/history'
import {useChat,clearChat,clearAllChats} from './session'
import {chatArchive,chatTranscript,downloadChat} from './transcript'

const labels={
 bn:{options:'চ্যাটের অপশন',fresh:'নতুন আলোচনা',save:'চ্যাট সেভ করুন',share:'শেয়ার করুন',download:'চ্যাট ডাউনলোড করুন',saved:'সেভ করা চ্যাট',clear:'এই আলোচনা মুছুন',all:'সমস্ত চ্যাট মুছুন',confirm:'নিশ্চিত করুন',cancel:'বাতিল',clearNote:'এই আলোচনার লেখা ও draft মুছবে। সেভ করা কপি ও জন্মছক থাকবে।',allNote:'এই অ্যাকাউন্টের এই ডিভাইসে থাকা বর্তমান ও সেভ করা চ্যাট মুছবে। জন্মছক, প্রোফাইল ও স্বপ্নের রিপোর্ট থাকবে।',freshNote:'বর্তমান আলোচনা সেভ করে নতুন আলোচনা শুরু হবে। না-পাঠানো লেখা থাকলে সেটি মুছবে।',savedNotice:'চ্যাট সংরক্ষিত ইনসাইটে সেভ হয়েছে।',done:'সম্পন্ন হয়েছে।',copied:'শেয়ার সুবিধা নেই; চ্যাট কপি হয়েছে।',failed:'কাজটি সম্পূর্ণ হয়নি। আবার চেষ্টা করুন।',large:'এই আলোচনা সেভ করার সীমার চেয়ে বড়। পুরো চ্যাট ডাউনলোড করে রাখুন।',busy:'কাজ হচ্ছে…',local:'চ্যাট এই ডিভাইসে থাকে। ব্রাউজারের ডেটা মুছলে হারিয়ে যেতে পারে।'},
 en:{options:'Chat options',fresh:'New conversation',save:'Save chat',share:'Share',download:'Download chat',saved:'Saved chats',clear:'Clear this conversation',all:'Clear all chats',confirm:'Confirm',cancel:'Cancel',clearNote:'Deletes this conversation and draft. Saved copies and birth charts remain.',allNote:'Deletes current and saved chats for this account on this device. Profiles, birth charts and dream reports remain.',freshNote:'Saves this conversation before starting a new one. Unsent text will be discarded.',savedNotice:'Chat saved in Saved Insights.',done:'Done.',copied:'Sharing is unavailable; chat copied.',failed:'The action could not be completed. Try again.',large:'This conversation exceeds the save limit. Download the complete chat instead.',busy:'Working…',local:'Chats stay on this device. Clearing browser data can remove them.'},
 hi:{options:'चैट विकल्प',fresh:'नई बातचीत',save:'चैट सहेजें',share:'शेयर करें',download:'चैट डाउनलोड करें',saved:'सहेजी गई चैट',clear:'यह बातचीत मिटाएँ',all:'सभी चैट मिटाएँ',confirm:'पुष्टि करें',cancel:'रद्द करें',clearNote:'यह बातचीत और ड्राफ्ट मिटेंगे। सहेजी गई प्रतियाँ और जन्मकुंडली रहेंगी।',allNote:'इस खाते की इस डिवाइस पर वर्तमान और सहेजी गई चैट मिटेंगी। प्रोफ़ाइल, जन्मकुंडली और सपनों की रिपोर्ट रहेंगी।',freshNote:'वर्तमान बातचीत सहेजकर नई बातचीत शुरू होगी। न भेजा गया टेक्स्ट मिटेगा।',savedNotice:'चैट सहेजी गई इनसाइट में रखी गई है।',done:'पूरा हुआ।',copied:'शेयर उपलब्ध नहीं है; चैट कॉपी हुई।',failed:'काम पूरा नहीं हुआ। फिर प्रयास करें।',large:'बातचीत सहेजने की सीमा से बड़ी है। पूरी चैट डाउनलोड करें।',busy:'काम हो रहा है…',local:'चैट इस डिवाइस पर रहती है। ब्राउज़र डेटा मिटाने से खो सकती है।'},
}
type Action='fresh'|'save'|'share'|'download'|'clear'|'all'
type Confirmation=Extract<Action,'fresh'|'clear'|'all'>

export default function ChatTools({userId}:Readonly<{userId:string}>){
 const locale=useLocale(),c=labels[locale],chat=useChat(userId,'conversation')
 const details=useRef<HTMLDetailsElement>(null)
 const [confirmation,setConfirmation]=useState<Confirmation|null>(null)
 const [working,setWorking]=useState(false),[status,setStatus]=useState('')
 useEffect(()=>{
  function outside(event:PointerEvent){if(event.target instanceof Node&&!details.current?.contains(event.target)&&details.current)details.current.open=false}
  function escape(event:KeyboardEvent){
   const menu=details.current!
   if(event.key==='Escape'&&menu.contains(event.target as Node|null)){
    event.preventDefault();menu.open=false;menu.querySelector('summary')?.focus()
   }
  }
  document.addEventListener('pointerdown',outside)
  document.addEventListener('keydown',escape)
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}
 },[])
 function clearCurrent(action:Action){
  if((action==='clear'||action==='fresh')&&!clearChat(userId,'conversation'))throw new Error('DEVICE_SAVE_FAILED')
 }
 function updateHistory(action:Action){
  const history=createLocalHistory(userId).repository('chat')
  if(action==='save'||(action==='fresh'&&chat.messages.length))return history.save(chatArchive(chat.messages,locale)).then(()=>clearCurrent(action))
  if(action==='all')return history.clear().then(()=>{
   if(!clearAllChats(userId))throw new Error('DEVICE_SAVE_FAILED')
  })
  clearCurrent(action)
 }
 async function act(action:Action){
  setWorking(true);setStatus('')
  try{
   const pending=updateHistory(action)
   if(pending)await pending
   const content=chatTranscript(chat.messages,locale)
   if(action==='download')downloadChat(content)
   if(action==='share'){
    if(navigator.share)await navigator.share({title:'Ask Maya',text:content})
    else{await navigator.clipboard.writeText(content);setStatus(c.copied);return}
   }
   setConfirmation(null);setStatus(action==='save'?c.savedNotice:c.done)
  }catch(error){
   if(error instanceof Error&&error.name==='AbortError')return
   setStatus(error instanceof Error&&error.message==='CHAT_TOO_LARGE'?c.large:c.failed)
  }finally{setWorking(false)}
 }
 const confirmationNote=confirmation&&({all:c.allNote,fresh:c.freshNote,clear:c.clearNote}[confirmation])
 return <details ref={details} className="chat-tools">
  <summary className="icon-button" aria-label={c.options} title={c.options}><span aria-hidden="true">⋮</span></summary>
  <div className="chat-tools-popover">
   <button type="button" disabled={working||chat.busy} onClick={()=>{setStatus('');setConfirmation('fresh')}}>{c.fresh}</button>
   <button type="button" disabled={working||chat.busy||!chat.messages.length} onClick={()=>{void act('save')}}>{c.save}</button>
   <button type="button" disabled={working||!chat.messages.length} onClick={()=>{void act('share')}}>{c.share}</button>
   <button type="button" disabled={working||!chat.messages.length} onClick={()=>{void act('download')}}>{c.download}</button>
   <a href="#/history">{c.saved}</a>
   <button type="button" disabled={working||chat.busy||(!chat.messages.length&&!chat.draft)} onClick={()=>{setStatus('');setConfirmation('clear')}}>{c.clear}</button>
   <button type="button" disabled={working||chat.busy} onClick={()=>{setStatus('');setConfirmation('all')}}>{c.all}</button>
   {confirmation&&<fieldset className="chat-tools-confirm"><legend>{c[confirmation]}</legend>
    <p>{confirmationNote}</p>
    <button type="button" disabled={working||chat.busy} onClick={()=>{void act(confirmation)}}>{c.confirm}</button>
    <button type="button" disabled={working} onClick={()=>setConfirmation(null)}>{c.cancel}</button>
   </fieldset>}
   {(status||working)&&<output className="status-message">{working?c.busy:status}</output>}
   <small>{c.local}</small>
  </div>
 </details>
}
