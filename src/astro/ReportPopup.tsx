import { useEffect,useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
export default function ReportPopup({title,back,onDismiss,children}:Readonly<{title:string;back:string;onDismiss:()=>void;children:ReactNode}>){
 const ref=useRef<HTMLDivElement>(null)
 const dismissRef=useRef(onDismiss)
 useEffect(()=>{dismissRef.current=onDismiss},[onDismiss])
 const tokenRef=useRef<string>('')
 useEffect(()=>{
  if(!tokenRef.current)tokenRef.current=`astro-report-${Date.now()}-${Math.random()}`
  const token=tokenRef.current,prior=history.state
  const previous=document.body.style.overflow,focus=document.activeElement
  document.body.style.overflow='hidden'
  if(prior?.astroReportPopup!==token)history.pushState({...((prior&&typeof prior==='object')?prior:{}),astroReportPopup:token},'',location.href)
  const pop=()=>{if(history.state?.astroReportPopup!==token)dismissRef.current()}
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();if(history.state?.astroReportPopup===token)history.back();else dismissRef.current()}
   if(event.key==='Tab'){
    const items=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not([hidden]),select,textarea,a[href]')
    if(!items?.length)return
    const first=items[0],last=items[items.length-1]
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  }
  window.addEventListener('popstate',pop);document.addEventListener('keydown',key)
  ref.current?.focus()
  return ()=>{
   window.removeEventListener('popstate',pop);document.removeEventListener('keydown',key)
   document.body.style.overflow=previous
   if(focus instanceof HTMLElement)focus.focus()
  }
 },[])
 const close=()=>{if(history.state?.astroReportPopup===tokenRef.current)history.back();dismissRef.current()}
 return createPortal(<div ref={ref} role="dialog" aria-modal="true" tabIndex={-1} className="astro-report-popup astro-report-screen" aria-label={title}><header><button type="button" aria-label={back} onClick={close}>‹</button><h2>{title}</h2></header>{children}</div>,document.body)
}
