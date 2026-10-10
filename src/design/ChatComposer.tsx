import { useEffect, useRef, useState,type ReactNode } from 'react'
import { useLocale } from '../i18n'
import { ui } from './copy'
import Icon from './Icon'
import MessageText from '../chat/MessageText'
import { speechText,finalSpeechText,type SpeechResult } from './speech-text'
type SpeechSession = {
  continuous:boolean; interimResults:boolean; lang:string;
  onresult:((event:{results:ArrayLike<SpeechResult>;resultIndex:number})=>void)|null;
  onend:(()=>void)|null; onerror:((event:{error:string})=>void)|null;
  start:()=>void; stop:()=>void; abort:()=>void;
}
type SpeechWindow = Window & {SpeechRecognition?:new()=>SpeechSession;webkitSpeechRecognition?:new()=>SpeechSession}
const labels={
  bn:{mic:'মাইক চালু করুন',stop:'কথা বলা শেষ — Stop',send:'পাঠান',listening:'শুনছি… শেষ হলে Stop চাপুন।',unsupported:'এই ব্রাউজারে ভয়েস ইনপুট নেই। কিবোর্ডে লিখতে পারেন।',error:'ভয়েস ইনপুট চালু হয়নি। অনুমতি ও সংযোগ দেখে আবার মাইক চাপুন।',ready:'লেখা দেখে প্রয়োজনে সংশোধন করুন। প্রস্তুত হলে পাঠান চাপুন।'},
  en:{mic:'Start microphone',stop:'Stop dictation',send:'Send',listening:'Listening… press Stop when finished.',unsupported:'Voice input is unavailable in this browser. You can type instead.',error:'Voice input failed. Check permission and connection, then try again.',ready:'Review and edit your text. Press Send when ready.'},
  hi:{mic:'माइक शुरू करें',stop:'बोलना रोकें',send:'भेजें',listening:'सुन रहे हैं… समाप्त होने पर Stop दबाएँ।',unsupported:'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। आप टाइप कर सकते हैं।',error:'वॉइस इनपुट शुरू नहीं हुआ। अनुमति और कनेक्शन जाँचकर फिर प्रयास करें।',ready:'टेक्स्ट जाँचें और सुधारें। तैयार होने पर भेजें दबाएँ।'},
}
type ChatMessage = Readonly<{id:string;text:string;role:'user'|'assistant'}>
export default function ChatComposer({messages=[],mode='chat',value,onChange,onSend,disabled=false,inputLabel,children,progress,attachmentControl}:Readonly<{messages?:readonly ChatMessage[];mode?:'chat'|'dream';value?:string;onChange?:(value:string)=>void;onSend?:()=>void;disabled?:boolean;inputLabel?:string;children?:ReactNode;progress?:ReactNode;attachmentControl?:ReactNode}>){
  const locale=useLocale(),copy=ui(locale),label=labels[locale]
  const [localDraft,setLocalDraft]=useState(''),[listening,setListening]=useState(false),[status,setStatus]=useState('')
  const draft=value??localDraft
  function setDraft(next:string){setLocalDraft(next);onChange?.(next)}
  const latest=useRef(draft)
  useEffect(()=>{latest.current=draft},[draft])
  const conversation=useRef<HTMLDivElement>(null),turnSpace=useRef<HTMLDivElement>(null)
  const anchoredQuestion=useRef<string|undefined>(undefined)
  const latestQuestion=messages.findLast(message=>message.role==='user')?.id
  const input=useRef<HTMLTextAreaElement>(null)
  useEffect(()=>{const field=input.current!;field.style.height='38px';field.style.height=`${Math.min(130,field.scrollHeight)}px`},[draft])
  useEffect(()=>{
    if(mode!=='chat'||!latestQuestion)return
    const viewport=conversation.current!,space=turnSpace.current!
    const question=Array.from(viewport.querySelectorAll<HTMLElement>('[data-question-id]')).find(node=>node.dataset.questionId===latestQuestion)
    if(!question)return
    // Reserve room beneath this turn so even a short answer keeps its question
    // at the top. Do not scroll again when the assistant answer arrives.
    const questionTop=question.getBoundingClientRect().top
    space.style.height=`${Math.max(0,viewport.clientHeight-(space.getBoundingClientRect().top-questionTop)-24)}px`
    if(anchoredQuestion.current!==latestQuestion){
      viewport.scrollTop+=questionTop-viewport.getBoundingClientRect().top
      anchoredQuestion.current=latestQuestion
    }
  },[latestQuestion,mode,messages,progress])
  const active=useRef(false),session=useRef<SpeechSession|null>(null)
  useEffect(()=>()=>{active.current=false;const current=session.current;session.current=null;current?.abort()},[locale])
  function stop(){active.current=false;session.current?.stop();setListening(false);setStatus(label.ready)}
  function start(){
    const host=window as SpeechWindow,Constructor=host.SpeechRecognition??host.webkitSpeechRecognition
    if(!Constructor){setStatus(label.unsupported);return}
    const SpeechConstructor=Constructor
    active.current=true
    function begin(base:string){
      const recognition=new SpeechConstructor();session.current=recognition
      let committed=base
      recognition.continuous=true;recognition.interimResults=false;recognition.lang=`${locale}-IN`
      recognition.onresult=event=>{
        if(session.current!==recognition)return
        const limit=mode==='dream'?8000:4000
        const next=speechText(base,event.results,limit)
        committed=finalSpeechText(base,event.results,limit)
        latest.current=next;setDraft(next)
      }
      recognition.onerror=event=>{
        if(session.current!==recognition||event.error==='no-speech')return
        active.current=false;setListening(false);setStatus(label.error)
      }
      recognition.onend=()=>{
        if(!active.current||session.current!==recognition)return
        // A fresh session has a fresh indexed result list. Do not commit interim guesses.
        latest.current=committed;setDraft(committed)
        begin(committed)
      }
      try{recognition.start();setListening(true);setStatus(label.listening)}catch{active.current=false;setListening(false);setStatus(label.error)}
    }
    begin(draft.trim())
  }
  return <section className="glass inner-panel chat-panel" aria-label={mode==='dream'?copy.dream:copy.conversation}>
    <div className="chat-conversation" ref={conversation}>{messages.length===0&&!children?<><h2>{mode==='dream'?copy.writeDream:copy.ask}</h2>{!onSend&&<p>{copy.pending}</p>}</>:messages.map(message=><article className="chat-message" key={message.id} data-question-id={message.role==='user'?message.id:undefined}>{message.role==='assistant'?<MessageText value={message.text}/>:<p>{message.text}</p>}{message.role==='assistant'&&<MessageActions value={message.text}/>}</article>)}{children}{progress&&<output className="maya-thinking">{progress}</output>}{mode==='chat'&&messages.length>0&&<div ref={turnSpace} className="chat-turn-space" aria-hidden="true"/>}</div>
    <div className={`chat-composer${attachmentControl?' has-attachments':''}`}>
      {attachmentControl}
      <textarea ref={input} rows={1} maxLength={mode==='dream'?8000:4000} disabled={disabled} aria-label={inputLabel??(mode==='dream'?copy.writeDream:copy.ask)} placeholder={mode==='dream'?copy.dreamPlaceholder:copy.askPlaceholder} value={draft} readOnly={listening} onChange={event=>setDraft(event.target.value)}/>
      <button type="button" aria-label={listening?label.stop:label.mic} aria-pressed={listening} disabled={disabled} onClick={listening?stop:start}><Icon name={listening?'stop':'mic'}/></button>
      <button type="button" disabled={disabled||listening||!onSend||!draft.trim()} onClick={onSend} aria-label={label.send} title={onSend?label.send:copy.pending}><Icon name="send"/></button>
    </div>
    {(status||!onSend)&&<output className="voice-status status-message">{status||label.ready}</output>}
  </section>
}

export function MessageActions({value}:Readonly<{value:string}>){
  const locale=useLocale()
  const labels={bn:{like:'ভালো লেগেছে',dislike:'ভালো লাগেনি',copy:'কপি করুন',copied:'কপি হয়েছে',failed:'কপি হয়নি — লেখাটি নির্বাচন করে কপি করুন।'},en:{like:'Like',dislike:'Dislike',copy:'Copy',copied:'Copied',failed:'Copy failed. Select the text to copy.'},hi:{like:'पसंद आया',dislike:'पसंद नहीं आया',copy:'कॉपी करें',copied:'कॉपी हो गया',failed:'कॉपी नहीं हुआ। टेक्स्ट चुनकर कॉपी करें।'}}[locale]
  const [vote,setVote]=useState<'like'|'dislike'|null>(null),[status,setStatus]=useState('')
  async function copy(){try{await navigator.clipboard.writeText(value);setStatus(labels.copied)}catch{setStatus(labels.failed)}}
  return <div className="message-actions">
    <button type="button" aria-label={labels.like} aria-pressed={vote==='like'} onClick={()=>setVote(vote==='like'?null:'like')}><Icon name="like"/></button>
    <button type="button" aria-label={labels.dislike} aria-pressed={vote==='dislike'} onClick={()=>setVote(vote==='dislike'?null:'dislike')}><Icon name="dislike"/></button>
    <button type="button" aria-label={labels.copy} onClick={()=>{void copy()}}><Icon name="copy"/></button>
    <output>{status}</output>
  </div>
}
