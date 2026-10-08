import {useEffect,useState} from 'react'
import AttachmentPicker from './chat/AttachmentPicker'
import type {Attachment} from './chat/attachments'
import {useLocale,text} from './i18n'
import {ui} from './design/copy'
import ChatComposer from './design/ChatComposer'
import {readFamily} from './profile/family'
import {useChat,setChatDraft,sendChat,addClarification,chatConfigured} from './chat/session'
import './chat/view.css'
export default function ChatScreen({userId}:Readonly<{userId:string}>){return <Conversation key={userId} userId={userId}/> }
function Conversation({userId}:Readonly<{userId:string}>){
 const locale=useLocale(),copy=ui(locale),thread='conversation',chat=useChat(userId,thread)
 useEffect(()=>{
  const shell=document.querySelector<HTMLElement>('.maya-shell'),viewport=window.visualViewport
  if(!shell)return
  const update=()=>{shell.style.setProperty('--chat-viewport-height',`${viewport?.height??window.innerHeight}px`);shell.style.setProperty('--chat-viewport-top',`${viewport?.offsetTop??0}px`)}
  update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update)
  return ()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);shell.style.removeProperty('--chat-viewport-height');shell.style.removeProperty('--chat-viewport-top')}
 },[])

 const [attachments,setAttachments]=useState<Attachment[]>([]),[preparing,setPreparing]=useState(false)
 const c={bn:{busy:'মায়া আপনার প্রশ্নের উত্তর তৈরি করছে…',failed:'ডিভাইসে সেভ হয়নি। পেজ বন্ধ করার আগে কথাগুলো কপি করুন।',choose:'কার জন্মছক নিয়ে জানতে চান? নামটি বলুন: ',missing:'এই ব্যক্তির প্রোফাইল পাওয়া যায়নি। Settings-এর Profile-এ নাম ও জন্মতথ্য যোগ করুন।'},en:{busy:'Maya is preparing your answer…',failed:'Device save failed. Copy your conversation before closing.',choose:'Whose birth chart would you like to discuss? Tell me the name: ',missing:'This profile was not found. Add the name and birth details in Settings Profile.'},hi:{busy:'माया आपके प्रश्न का उत्तर तैयार कर रही है…',failed:'डिवाइस पर सहेजा नहीं गया। बंद करने से पहले बातचीत कॉपी करें।',choose:'किसकी कुंडली जानना चाहते हैं? नाम बताएँ: ',missing:'प्रोफ़ाइल नहीं मिली। Settings Profile में नाम और जन्म विवरण जोड़ें।'}}[locale]
 function send(){
  if(attachments.length){void sendChat(userId,thread,locale,'self',attachments).then(sent=>{if(sent)setAttachments([])});return}
  const family=readFamily(`user:${userId}`),query=chat.draft.toLocaleLowerCase()
  const matches=family.people.filter(p=>p.profile.name.trim().length>=2&&query.includes(p.profile.name.trim().toLocaleLowerCase()))
  const relations=family.people.filter(p=>p.id!=='self'&&p.relation.trim().length>=2&&query.includes(p.relation.trim().toLocaleLowerCase()))
  const own=/আমার|my\b|मेरी|मेरा/.test(query),saved=family.people.filter(p=>p.profile.name.trim())
  if(matches.length>1||relations.length>1||(!matches.length&&!own&&chat.messages.length===0&&saved.length>1)){
   addClarification(userId,thread,c.choose+saved.map(p=>p.profile.name).join(', '));return
  }
  const target=matches[0]?.id??relations[0]?.id??(own?'self':chat.personId)
  if(!family.people.some(p=>p.id===target)){addClarification(userId,thread,c.missing);return}
  void sendChat(userId,thread,locale,target)
 }
 return <section className="feature-screen design-screen design-chat" aria-labelledby="chat-title"><h1 className="conversation-heading" id="chat-title">{copy.chat}</h1>
  <ChatComposer key={locale} messages={chat.messages} value={chat.draft} onChange={value=>setChatDraft(userId,thread,value)} onSend={chatConfigured()?send:undefined} disabled={chat.busy||preparing} attachmentControl={<AttachmentPicker value={attachments} onChange={setAttachments} onBusy={setPreparing} disabled={chat.busy}/>} progress={chat.busy?c.busy:undefined}/>
  {chat.failure&&<p className="chat-inline-alert" role="alert">{text(locale,`gateway${chat.failure}`)}</p>}
  {chat.storageFailed&&<p className="chat-inline-alert" role="alert">{c.failed}</p>}
 </section>
}
