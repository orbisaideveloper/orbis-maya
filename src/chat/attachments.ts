export type Attachment=Readonly<{kind:'image'|'text';name:string;content:string}>
export function validateFiles(files:readonly File[]){
 if(!files.length||files.length>3)throw new Error('COUNT')
 for(const file of files){
  if(!file.size||file.size>8*1024*1024)throw new Error('SIZE')
  if(!['image/jpeg','image/png','image/webp','application/pdf','text/plain'].includes(file.type))throw new Error('TYPE')
 }
}
export function canvasImage(canvas:HTMLCanvasElement,name:string):Attachment{
 const content=canvas.toDataURL('image/jpeg',.82)
 if(content.length>650000)throw new Error('SIZE')
 return {kind:'image',name:name.slice(0,120),content}
}
async function image(file:File):Promise<Attachment>{
 const bitmap=await createImageBitmap(file)
 try{
  if(bitmap.width*bitmap.height>40000000)throw new Error('SIZE')
  const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas')
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale))
  const context=canvas.getContext('2d');if(!context)throw new Error('READ')
  context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height)
  return canvasImage(canvas,file.name)
 }finally{bitmap.close()}
}
async function pdf(file:File):Promise<Attachment[]>{
 const pdfjs=await import('pdfjs-dist')
 const worker=await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
 pdfjs.GlobalWorkerOptions.workerSrc=worker.default
 const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false})
 const timer=setTimeout(()=>{void loading.destroy()},40000)
 try{
  const documentPdf=await loading.promise
  if(documentPdf.numPages>3)throw new Error('PAGES')
  return await Array.from({length:documentPdf.numPages},(_,index)=>index+1).reduce(async(previous,number)=>{
   const results=await previous
   const page=await documentPdf.getPage(number),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2,1400/Math.max(base.width,base.height))})
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height)
   const context=canvas.getContext('2d');if(!context)throw new Error('READ')
   await page.render({canvas,canvasContext:context,viewport}).promise
   results.push(canvasImage(canvas,file.name+' · '+number));page.cleanup();canvas.width=0;canvas.height=0
   return results
  },Promise.resolve<Attachment[]>([]))
 }finally{clearTimeout(timer);await loading.destroy()}
}
export async function prepareAttachments(files:readonly File[]):Promise<Attachment[]>{
 validateFiles(files)
 const prepared=await files.reduce(async(previous,file)=>{
  const results=await previous
  if(file.type==='application/pdf')results.push(...await pdf(file))
  else if(file.type==='text/plain'){
   if(file.size>48000)throw new Error('SIZE')
   const content=await file.text();if(!content.trim()||content.length>12000)throw new Error('SIZE')
   results.push({kind:'text',name:file.name.slice(0,120),content})
  }else results.push(await image(file))
  if(results.length>3)throw new Error('COUNT')
  return results
 },Promise.resolve<Attachment[]>([]))
 return prepared
}
