import { useSyncExternalStore } from 'react'
const key=(scope:string)=>`orbis-maya-photo-v1:${encodeURIComponent(scope)}`
const valid=(value:string)=>value.length<=150000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)
function read(scope:string|null){try{const value=scope?localStorage.getItem(key(scope))??'':'';return valid(value)?value:''}catch{return ''}}
function subscribe(listener:()=>void){window.addEventListener('maya-photo',listener);window.addEventListener('storage',listener);return()=>{window.removeEventListener('maya-photo',listener);window.removeEventListener('storage',listener)}}
export function usePhoto(scope:string|null){return useSyncExternalStore(subscribe,()=>read(scope))}
export function savePhoto(scope:string,value:string){if(!scope||!valid(value))throw new Error('INVALID_PHOTO');localStorage.setItem(key(scope),value);window.dispatchEvent(new Event('maya-photo'))}
export function removePhoto(scope:string){localStorage.removeItem(key(scope));window.dispatchEvent(new Event('maya-photo'))}
export async function preparePhoto(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('INVALID_PHOTO')
 const url=URL.createObjectURL(file)
 try{
  const image=new Image()
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('INVALID_PHOTO'));image.src=url})
  if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>36000000)throw new Error('INVALID_PHOTO')
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256
  const context=canvas.getContext('2d');if(!context)throw new Error('INVALID_PHOTO')
  const side=Math.min(image.naturalWidth,image.naturalHeight)
  context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256)
  const value=canvas.toDataURL('image/jpeg',0.8)
  if(!valid(value))throw new Error('INVALID_PHOTO')
  return value
 }finally{URL.revokeObjectURL(url)}
}
