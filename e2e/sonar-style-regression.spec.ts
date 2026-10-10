import {test,expect} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
const baseline=JSON.parse(readFileSync(resolve('e2e/fixtures/sonar-style-baseline.json'),'utf8')) as Record<string,string>
test('CSS consolidation preserves mobile geometry, theme colours and typography on all preview pages',async({page})=>{
 test.setTimeout(300000)
 for(const width of [360,412])for(const theme of ['astral-blue','astral-gold','plain-light'])for(const path of ['/','/dream','/astro','/chat','/history','/settings','/profile','/today','/notifications','/workspace','/account']){
  await page.setViewportSize({width,height:780})
  await page.goto('/?maya-design=1#'+path)
  await page.evaluate((value)=>localStorage.setItem('orbis-maya-theme-v1',value),theme)
  await page.reload()
  await expect(page.locator('.maya-shell')).toHaveClass(new RegExp('theme-'+theme))
  await page.locator('.maya-shell').waitFor()
  const differences=await page.evaluate(async({baseline,width})=>{
   await document.fonts.ready
   const styles=Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-vite-dev-id]'))
   const app=styles.find(style=>style.dataset.viteDevId?.endsWith('/src/App.css'))
   if(!app)throw new Error('CSS comparison requires the isolated Vite development server')
   const copy=document.querySelector('#root')!.cloneNode(true) as HTMLElement
   function retag(node:Element,tag:string,role?:string){
    const replacement=document.createElement(tag)
    for(const attribute of node.attributes)replacement.setAttribute(attribute.name,attribute.value)
    if(role)replacement.setAttribute('role',role)
    replacement.classList.remove('status-message')
    replacement.append(...Array.from(node.childNodes));node.replaceWith(replacement)
   }
   for(const node of copy.querySelectorAll('output.status-message'))retag(node,'p','status')
   for(const node of copy.querySelectorAll('output.maya-thinking'))retag(node,'div','status')
   for(const node of copy.querySelectorAll('.message-actions output'))retag(node,'span','status')
   for(const node of copy.querySelectorAll('fieldset.kundli-chart,fieldset.workspace-tabs'))retag(node,'div','group')
   const frames:HTMLIFrameElement[]=[]
   async function frame(html:string,old:boolean){
    const node=document.createElement('iframe')
    node.style.cssText=`position:fixed;left:-10000px;top:0;border:0;width:${width}px;height:780px;visibility:hidden`
    document.body.append(node);frames.push(node)
    const doc=node.contentDocument!
    doc.open();doc.write('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>');doc.close()
    const base=doc.createElement('base');base.href=location.href;doc.head.append(base)
    for(const original of styles){
     const id=original.dataset.viteDevId??''
     const key=Object.keys(baseline).find(key=>id.endsWith('/'+key))
     const style=doc.createElement('style');style.textContent=old&&key?baseline[key]:original.textContent;doc.head.append(style)
    }
    doc.body.innerHTML=html
    await doc.fonts.ready
    return doc
   }
   try{
    const before=await frame(copy.outerHTML,true),after=await frame(document.querySelector('#root')!.outerHTML,false)
    const oldNodes=before.querySelectorAll<HTMLElement>('#root, #root *'),newNodes=after.querySelectorAll<HTMLElement>('#root, #root *')
    if(oldNodes.length!==newNodes.length)throw new Error('Native semantic conversion changed the element count')
    const properties=['display','position','background-color','background-image','color','font-size','font-weight','line-height','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','border-top-width','border-radius','gap','grid-template-columns','overflow-x','overflow-y']
    const errors:string[]=[]
    for(let index=0;index<oldNodes.length;index++){
     const oldNode=oldNodes[index],newNode=newNodes[index]
     const previous=before.defaultView!.getComputedStyle(oldNode),current=after.defaultView!.getComputedStyle(newNode)
     for(const property of properties){
      // Grid outlines intentionally receive a darker, accessible brown.
      if(property==='color'&&(newNode.matches('.kundli-chart')||newNode.matches('.kundli-chart svg,.kundli-chart svg *')))continue
      const a=previous.getPropertyValue(property),b=current.getPropertyValue(property)
      if(a!==b)errors.push(`${newNode.tagName}.${newNode.getAttribute('class')??''}: ${property}: ${a} -> ${b}`)
     }
     if(!newNode.matches('.kundli-chart svg,.kundli-chart svg *')){
      const a=oldNode.getBoundingClientRect(),b=newNode.getBoundingClientRect()
      for(const property of ['x','y','width','height'] as const)if(Math.abs(a[property]-b[property])>1)errors.push(`${newNode.tagName}.${newNode.getAttribute('class')??''}: box ${property}: ${a[property]} -> ${b[property]}`)
     }
    }
    return errors.slice(0,25)
   }finally{for(const frame of frames)frame.remove()}
  },{baseline,width})
  expect(differences,`${path}, ${theme}, ${width}px`).toEqual([])
 }
})
