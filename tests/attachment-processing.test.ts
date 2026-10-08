import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {canvasImage,prepareAttachments,validateFiles} from '../src/chat/attachments'

const pdf=vi.hoisted(()=>({getDocument:vi.fn(),getPage:vi.fn(),destroy:vi.fn(),render:vi.fn(),cleanup:vi.fn(),worker:{workerSrc:''}}))
vi.mock('pdfjs-dist',()=>({GlobalWorkerOptions:pdf.worker,getDocument:pdf.getDocument}))
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url',()=>({default:'/test-pdf-worker.js'}))
const jpeg='data:image/jpeg;base64,/9j/2Q=='
const context={fillStyle:'',fillRect:vi.fn(),drawImage:vi.fn()}
function textFile(content:string,size?:number){
 const file=Object.assign(new File([content],'note.txt',{type:'text/plain'}),{text:vi.fn().mockResolvedValue(content)})
 if(size!==undefined)Object.defineProperty(file,'size',{value:size})
 return file
}
function pdfFile(){return Object.assign(new File(['pdf'],'chart.pdf',{type:'application/pdf'}),{arrayBuffer:vi.fn().mockResolvedValue(new ArrayBuffer(3))})}
function bitmap(width=2800,height=1400){const value={width,height,close:vi.fn()};vi.stubGlobal('createImageBitmap',vi.fn().mockResolvedValue(value));return value}
beforeEach(()=>{
 vi.clearAllMocks();pdf.destroy.mockResolvedValue(undefined);pdf.render.mockReturnValue({promise:Promise.resolve()})
 pdf.getPage.mockResolvedValue({getViewport:({scale}:{scale:number})=>({width:700*scale,height:1000*scale}),render:pdf.render,cleanup:pdf.cleanup})
 pdf.getDocument.mockReturnValue({promise:Promise.resolve({numPages:2,getPage:pdf.getPage}),destroy:pdf.destroy})
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue(jpeg)
})
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers()})
describe('File validation and plain text',()=>{
 it('rejects an empty selection and oversized input before reading',()=>{
  expect(()=>validateFiles([])).toThrow('COUNT')
  const file=textFile('x',8*1024*1024+1)
  expect(()=>validateFiles([file])).toThrow('SIZE');expect(file.text).not.toHaveBeenCalled()
 })
 it('rejects byte limits, blank text and failed reads',async()=>{
  await expect(prepareAttachments([textFile('x',48001)])).rejects.toThrow('SIZE')
  await expect(prepareAttachments([textFile('   ')])).rejects.toThrow('SIZE')
  const file=textFile('x');file.text.mockRejectedValue(new Error('READ'))
  await expect(prepareAttachments([file])).rejects.toThrow('READ')
 })
 it('preserves content and bounds only the filename',async()=>{
  const file=textFile(' বাংলা\nনোট ');Object.defineProperty(file,'name',{value:'a'.repeat(121)})
  const result=await prepareAttachments([file]);expect(result[0].content).toBe(' বাংলা\nনোট ');expect(result[0].name).toHaveLength(120)
 })
})
describe('Image preparation',()=>{
 it('scales a large image and closes its decoder',async()=>{
  const decoded=bitmap();const file=new File(['image'],'chart.png',{type:'image/png'})
  await expect(prepareAttachments([file])).resolves.toEqual([{kind:'image',name:'chart.png',content:jpeg}])
  expect(context.fillRect).toHaveBeenCalledWith(0,0,1400,700)
  expect(context.drawImage).toHaveBeenCalledWith(decoded,0,0,1400,700)
  expect(context.fillStyle).toBe('white');expect(decoded.close).toHaveBeenCalledOnce()
 })
 it('keeps a small image at its original size',async()=>{
  bitmap(20,10);await prepareAttachments([new File(['x'],'small.webp',{type:'image/webp'})])
  expect(context.fillRect).toHaveBeenCalledWith(0,0,20,10)
 })
 it('closes the bitmap when decoded dimensions are unsafe',async()=>{
  const decoded=bitmap(10000,10000)
  await expect(prepareAttachments([new File(['x'],'huge.jpg',{type:'image/jpeg'})])).rejects.toThrow('SIZE')
  expect(decoded.close).toHaveBeenCalledOnce();expect(context.drawImage).not.toHaveBeenCalled()
 })
 it('closes the bitmap when canvas support is unavailable',async()=>{
  const decoded=bitmap();vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
  await expect(prepareAttachments([new File(['x'],'photo.png',{type:'image/png'})])).rejects.toThrow('READ')
  expect(decoded.close).toHaveBeenCalledOnce()
 })
 it('rejects decoder failure and oversized encoded images',async()=>{
  vi.stubGlobal('createImageBitmap',vi.fn().mockRejectedValue(new Error('DECODE')))
  await expect(prepareAttachments([new File(['x'],'broken.jpg',{type:'image/jpeg'})])).rejects.toThrow('DECODE')
  vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockReturnValue('x'.repeat(650001))
  expect(()=>canvasImage(document.createElement('canvas'),'photo')).toThrow('SIZE')
 })
})
describe('PDF preparation',()=>{
 it('renders pages as evidence, sets the local worker and releases resources',async()=>{
  const result=await prepareAttachments([pdfFile()])
  expect(result).toEqual([1,2].map(n=>({kind:'image',name:`chart.pdf · ${n}`,content:jpeg})))
  expect(pdf.worker.workerSrc).toBe('/test-pdf-worker.js')
  expect(pdf.getDocument).toHaveBeenCalledWith({data:new Uint8Array(3),isEvalSupported:false})
  expect(pdf.getPage.mock.calls).toEqual([[1],[2]])
  expect(pdf.cleanup).toHaveBeenCalledTimes(2);expect(pdf.destroy).toHaveBeenCalledOnce()
 })
 it('rejects more than three pages and destroys the document',async()=>{
  pdf.getDocument.mockReturnValue({promise:Promise.resolve({numPages:4,getPage:pdf.getPage}),destroy:pdf.destroy})
  await expect(prepareAttachments([pdfFile()])).rejects.toThrow('PAGES')
  expect(pdf.getPage).not.toHaveBeenCalled();expect(pdf.destroy).toHaveBeenCalledOnce()
 })
 it('rejects document errors and render errors with cleanup',async()=>{
  pdf.getDocument.mockReturnValueOnce({promise:Promise.reject(new Error('PDF_READ')),destroy:pdf.destroy})
  await expect(prepareAttachments([pdfFile()])).rejects.toThrow('PDF_READ')
  pdf.render.mockReturnValueOnce({promise:Promise.reject(new Error('RENDER'))})
  await expect(prepareAttachments([pdfFile()])).rejects.toThrow('RENDER')
  expect(pdf.destroy).toHaveBeenCalledTimes(2)
 })
 it('rejects a PDF when a canvas cannot be created',async()=>{
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
  await expect(prepareAttachments([pdfFile()])).rejects.toThrow('READ');expect(pdf.destroy).toHaveBeenCalledOnce()
 })
 it('enforces the combined page limit across different files',async()=>{
  await expect(prepareAttachments([pdfFile(),pdfFile()])).rejects.toThrow('COUNT')
  expect(pdf.destroy).toHaveBeenCalledTimes(2)
 })
 it('destroys a stalled loading task at the timeout',async()=>{
  vi.useFakeTimers();let reject!:(error:Error)=>void
  const promise=new Promise<never>((_,fail)=>{reject=fail})
  pdf.destroy.mockImplementation(()=>{reject(new Error('TIMEOUT'));return Promise.resolve()})
  pdf.getDocument.mockReturnValue({promise,destroy:pdf.destroy})
  const result=prepareAttachments([pdfFile()]);const assertion=expect(result).rejects.toThrow('TIMEOUT')
  await vi.advanceTimersByTimeAsync(40000);await assertion
  expect(pdf.destroy).toHaveBeenCalledTimes(2);expect(vi.getTimerCount()).toBe(0)
 })
})
