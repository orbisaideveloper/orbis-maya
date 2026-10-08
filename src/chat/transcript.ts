import type {Locale} from '../i18n'
import type {Message} from './session'

export function chatTranscript(messages:readonly Message[],locale:Locale){
 const you={bn:'আপনি',en:'You',hi:'आप'}[locale]
 return messages.map(message=>`${message.role==='user'?you:'Maya'}\n${message.text}`).join('\n\n')
}

export function chatArchive(messages:readonly Message[],locale:Locale){
 if(!messages.length)throw new Error('EMPTY_CHAT')
 const content=chatTranscript(messages,locale)
 if(content.length>40000||new TextEncoder().encode(content).byteLength>90000)throw new Error('CHAT_TOO_LARGE')
 const title=messages.find(message=>message.role==='user')?.text.trim().slice(0,100)||'Ask Maya'
 return {title,content}
}

export function downloadChat(content:string){
 const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}))
 const link=document.createElement('a')
 link.href=url;link.download=`ORBIS-MAYA-CHAT-${new Date().toISOString().replace(/[:.]/g,'-')}.txt`
 document.body.append(link)
 try{link.click()}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
}
