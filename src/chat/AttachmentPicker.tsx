import {useEffect,useRef,useState} from 'react'
import {keyedItems} from '../listKeys'
import {useLocale} from '../i18n'
import {prepareAttachments,type Attachment} from './attachments'
export default function AttachmentPicker({value,onChange,onBusy,disabled}:Readonly<{value:readonly Attachment[];onChange:(value:Attachment[])=>void;onBusy:(value:boolean)=>void;disabled:boolean}>){
 const locale=useLocale(),input=useRef<HTMLInputElement>(null),generation=useRef(0),menu=useRef<HTMLDetailsElement>(null)
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const labels={bn:{add:'ফাইল যোগ করুন',choose:'ছবি বা ফাইল বাছুন',remove:'সরান',notice:'পাঠান চাপলে ফাইল Foundation-এর AI provider-এ যাবে। ফাইল চ্যাটে সেভ থাকবে না। সর্বাধিক ৩টি ছবি/পাতা; প্রতি ফাইল ৮ MB।',busy:'ফাইল প্রস্তুত হচ্ছে…',failed:'ফাইল পড়া যায়নি বা সীমা ছাড়িয়েছে। PDF সর্বাধিক ৩ পাতার দিন; পরিষ্কার ছোট ছবি বা TXT ব্যবহার করুন।'},en:{add:'Add files',choose:'Choose photo or file',remove:'Remove',notice:'Send forwards files to Foundation’s AI provider. Files are not saved in chat. Up to 3 images/pages; 8 MB per file.',busy:'Preparing files…',failed:'Cannot read file or limit exceeded. Use a PDF up to 3 pages, a smaller clear image or TXT.'},hi:{add:'फाइल जोड़ें',choose:'चित्र या फाइल चुनें',remove:'हटाएँ',notice:'भेजने पर फाइल Foundation के AI provider को जाएगी। फाइल चैट में सहेजी नहीं जाएगी। अधिकतम 3 चित्र/पृष्ठ; प्रति फाइल 8 MB।',busy:'फाइल तैयार हो रही है…',failed:'फाइल पढ़ नहीं पाए या सीमा पार हुई। अधिकतम 3 पृष्ठ का PDF, छोटी स्पष्ट तस्वीर या TXT दें।'}}[locale]
 useEffect(()=>()=>{generation.current++},[])
 async function choose(files:File[]){
  const current=++generation.current;setBusy(true);onBusy(true);setError('')
  try{const prepared=await prepareAttachments(files);if(current===generation.current)onChange(prepared)}
  catch{if(current===generation.current)setError(labels.failed)}
  finally{if(current===generation.current){setBusy(false);onBusy(false)}}
 }
 return <div className="chat-attachments">
  <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value='';if(files.length){menu.current!.open=false;void choose(files)}}}/>
  <details ref={menu} className="attachment-menu">
   <summary aria-label={labels.add} title={labels.add}>＋</summary>
   <div className="attachment-popover">
    <button type="button" disabled={disabled||busy} onClick={()=>input.current?.click()}>{labels.choose}</button>
    <p>JPEG · PNG · WebP · PDF · TXT</p><p>{labels.notice}</p>
   </div>
  </details>
  {value.length>0&&<div className="attachment-selection"><ul>{keyedItems(value,file=>file.kind+':'+file.name).map(({item:file,key})=><li key={key}>{file.name}</li>)}</ul><button type="button" disabled={disabled||busy} onClick={()=>onChange([])}>{labels.remove}</button></div>}
  {busy&&<output className="attachment-feedback status-message">{labels.busy}</output>}{error&&<p className="attachment-feedback" role="alert">{error}</p>}
 </div>
}
