import {afterEach,expect,it,vi} from 'vitest'
import {downloadWorkbook,printReport,reportHtml} from '../src/astro/exportChart'
import {chartRows,planetName} from '../src/astro/chartReport'
import {calculateChart} from '../src/astro/calculate'
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();document.querySelectorAll('iframe').forEach(frame=>frame.remove())})
it('downloads an actual workbook and revokes its temporary URL',()=>{
 vi.useFakeTimers();const create=vi.fn().mockReturnValue('blob:workbook'),revoke=vi.fn()
 vi.stubGlobal('URL',Object.assign(class extends URL {},{createObjectURL:create,revokeObjectURL:revoke}))
 const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
 downloadWorkbook([['বাংলা','literal']]);expect(create).toHaveBeenCalledWith(expect.any(Blob));expect(click).toHaveBeenCalledOnce();expect(document.querySelector('a[download]')).toBeNull()
 vi.advanceTimersByTime(1000);expect(revoke).toHaveBeenCalledWith('blob:workbook')
})
it.each([false,true])('prints from an isolated iframe and cleans it after printing; fonts %s',async(fonts)=>{
 vi.useFakeTimers();printReport([['বাংলা'],[]],'bn');const frame=document.querySelector('iframe')!,view=frame.contentWindow!
 const focus=vi.spyOn(view,'focus').mockImplementation(()=>{}),print=vi.spyOn(view,'print').mockImplementation(()=>{})
 if(fonts)Object.defineProperty(frame.contentDocument!,'fonts',{configurable:true,value:{ready:Promise.resolve()}})
 frame.dispatchEvent(new Event('load'));await Promise.resolve();await Promise.resolve()
 expect(focus).toHaveBeenCalled();expect(print).toHaveBeenCalled();expect(frame.srcdoc).toContain('colspan="6"')
 view.dispatchEvent(new Event('afterprint'));expect(document.body.contains(frame)).toBe(false)
 vi.advanceTimersByTime(300000)
})
it('removes an unusable print frame and expires an abandoned print dialog',()=>{
 vi.useFakeTimers();printReport([['report']],'en');const frame=document.querySelector('iframe')!
 Object.defineProperty(frame,'contentWindow',{configurable:true,value:null});frame.dispatchEvent(new Event('load'));expect(document.body.contains(frame)).toBe(false)
 printReport([['report']],'en');expect(document.querySelector('iframe')).not.toBeNull();vi.advanceTimersByTime(300000);expect(document.querySelector('iframe')).toBeNull()
})
it('exports missing birth coordinates and a missing Moon honestly rather than inventing values',()=>{
 const chart=calculateChart('1986-05-10','00:05',{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'})
 const rows=chartRows({...chart,planets:[]},{name:'A',birthDate:'',birthTime:'',birthPlace:''},'en')
 expect(rows).toContainEqual(['Latitude','']);expect(rows).toContainEqual(['Longitude','']);expect(rows).toContainEqual(['Timezone','']);expect(rows).toContainEqual(['Moon sign',''])
 expect(planetName('Unknown','en')).toBe('Unknown');expect(reportHtml([[]],'en')).toContain('colspan="6"')
})
