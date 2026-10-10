import { useState } from 'react'
import { ui } from './copy'
import { useLocale } from '../i18n'
import ThemeSelector from './ThemeSelector'
const enabled=import.meta.env.DEV || import.meta.env.VITE_MAYA_DESIGN_WORKSPACE==='1'
function safeRelease(value:string|undefined):string|null {
  if (!value) return null
  try {
    const url=new URL(value)
    if(url.protocol==='https:'&&url.origin!==window.location.origin) return url.href
  } catch { /* Invalid release configuration is not a publication. */ }
  return null
}
export default function Workspace() {
  const copy=ui(useLocale())
  const [view,setView]=useState<'development'|'published'>('development')
  const release=safeRelease(import.meta.env.VITE_MAYA_PUBLISHED_URL)
  const revision=import.meta.env.VITE_MAYA_PUBLISHED_REVISION
  if(!enabled) return <section className="glass inner-panel"><h1>{copy.workspace}</h1><p>{copy.releasePending}</p></section>
  let content=<section className="glass inner-panel"><h2>{copy.noPublished}</h2><p>{copy.releasePending}</p></section>
  if(view==='development')content=<><a href="/?maya-design=1#/" target="_blank" rel="noreferrer">{copy.viewApp}</a><iframe title={copy.development} src="/?maya-design=1#/"/></>
  else if(release&&revision)content=<><p>Release: {revision}</p><a href={release} target="_blank" rel="noreferrer">{copy.viewApp}</a><iframe title={copy.published} src={release}/></>
  return <section className="workspace"><header><h1>{copy.workspace}</h1><p>{copy.designOnly}</p><ThemeSelector/></header>
    <fieldset className="workspace-tabs" aria-label={copy.workspace}><button type="button" aria-pressed={view==='development'} onClick={()=>setView('development')}>{copy.development}</button><button type="button" aria-pressed={view==='published'} onClick={()=>setView('published')}>{copy.published}</button></fieldset>
    {content}
    <button type="button" disabled>{copy.publish}</button><p>{copy.releasePending}</p>
  </section>
}
