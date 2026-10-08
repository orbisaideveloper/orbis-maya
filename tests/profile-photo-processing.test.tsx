import {act,cleanup,renderHook} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {preparePhoto,savePhoto,removePhoto,usePhoto} from '../src/profile/photo'
const jpeg='data:image/jpeg;base64,/9j/2Q=='
let dimensions={width:800,height:400},decodeFailure=false
const draw=vi.fn(),create=vi.fn(),revoke=vi.fn()
beforeEach(()=>{
 localStorage.clear();dimensions={width:800,height:400};decodeFailure=false;vi.clearAllMocks();create.mockReturnValue('blob:photo')
 vi.stubGlobal('URL',Object.assign(class extends URL {},{createObjectURL:create,revokeObjectURL:revoke}))
 class Decoder {
  naturalWidth=dimensions.width;naturalHeight=dimensions.height
  onload:(()=>void)|null=null;onerror:(()=>void)|null=null
  set src(_value:string){void _value;queueMicrotask(()=>{if(decodeFailure)this.onerror?.();else this.onload?.()})}
 }
 vi.stubGlobal('Image',Decoder)
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:draw} as unknown as CanvasRenderingContext2D)
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue(jpeg)
})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear()})
it('crops the centered square, emits bounded JPEG and revokes the decoder URL',async()=>{
 await expect(preparePhoto(new File(['x'],'photo.png',{type:'image/png'}))).resolves.toBe(jpeg)
 expect(draw).toHaveBeenCalledWith(expect.any(Object),200,0,400,400,0,0,256,256)
 expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/jpeg',.8);expect(revoke).toHaveBeenCalledWith('blob:photo')
})
it('rejects unsupported and oversized files before allocating a decoder',async()=>{
 await expect(preparePhoto(new File(['x'],'note.txt',{type:'text/plain'}))).rejects.toThrow('INVALID_PHOTO')
 const file=new File(['x'],'photo.jpg',{type:'image/jpeg'});Object.defineProperty(file,'size',{value:5*1024*1024+1})
 await expect(preparePhoto(file)).rejects.toThrow('INVALID_PHOTO');expect(create).not.toHaveBeenCalled()
})
it.each([[0,10],[10,0],[10000,10000]])('rejects unsafe decoded dimensions %s × %s',async(width,height)=>{
 dimensions={width,height};await expect(preparePhoto(new File(['x'],'photo.webp',{type:'image/webp'}))).rejects.toThrow('INVALID_PHOTO')
 expect(draw).not.toHaveBeenCalled();expect(revoke).toHaveBeenCalledOnce()
})
it('releases URLs when decoding or canvas creation fails',async()=>{
 decodeFailure=true;await expect(preparePhoto(new File(['x'],'photo.jpg',{type:'image/jpeg'}))).rejects.toThrow('INVALID_PHOTO')
 decodeFailure=false;vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
 await expect(preparePhoto(new File(['x'],'photo.jpg',{type:'image/jpeg'}))).rejects.toThrow('INVALID_PHOTO');expect(revoke).toHaveBeenCalledTimes(2)
})
it.each(['invalid','data:image/jpeg;base64,'+'x'.repeat(150000)])('rejects an unsafe encoded result',async(value)=>{
 vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockReturnValue(value)
 await expect(preparePhoto(new File(['x'],'photo.jpg',{type:'image/jpeg'}))).rejects.toThrow('INVALID_PHOTO');expect(revoke).toHaveBeenCalledOnce()
})
it('isolates saved photos by account and responds to save, remove and storage events',()=>{
 const first=renderHook(()=>usePhoto('user:a')),second=renderHook(()=>usePhoto('user:b'))
 expect(first.result.current).toBe('');act(()=>savePhoto('user:a',jpeg));expect(first.result.current).toBe(jpeg);expect(second.result.current).toBe('')
 act(()=>removePhoto('user:a'));expect(first.result.current).toBe('')
 localStorage.setItem('orbis-maya-photo-v1:user%3Aa',jpeg);act(()=>window.dispatchEvent(new Event('storage')));expect(first.result.current).toBe(jpeg)
 first.unmount();second.unmount()
})
it('ignores malformed stored images and unavailable storage',()=>{
 localStorage.setItem('orbis-maya-photo-v1:user%3Aa','javascript:bad')
 expect(renderHook(()=>usePhoto('user:a')).result.current).toBe('')
 expect(renderHook(()=>usePhoto(null)).result.current).toBe('')
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('BLOCKED')})
 expect(renderHook(()=>usePhoto('user:a')).result.current).toBe('')
 expect(()=>savePhoto('',jpeg)).toThrow('INVALID_PHOTO');expect(()=>savePhoto('user:a','invalid')).toThrow('INVALID_PHOTO')
})
