import {cleanup,fireEvent,render,screen,within} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import ChartReport from '../src/astro/ChartReport'
import {calculateChart} from '../src/astro/calculate'
import {chartRows,chartText,reportCopy} from '../src/astro/chartReport'
import {setLocale} from '../src/i18n'
const exports=vi.hoisted(()=>({excel:vi.fn(),print:vi.fn()}))
vi.mock('../src/astro/exportChart',()=>({downloadWorkbook:exports.excel,printReport:exports.print}))
const profile={name:'Owner',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Krishnanagar',birthLocation:{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}}
const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation)
const write=vi.fn()
beforeEach(()=>{
 setLocale('bn');vi.clearAllMocks();exports.excel.mockReset();exports.print.mockReset();write.mockReset().mockResolvedValue(undefined)
 vi.spyOn(history,'back').mockImplementation(()=>{})
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:write}})
 history.replaceState(null,'',location.href)
})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers()})
function open(mode='পূর্ণ রিপোর্ট',props:Partial<Parameters<typeof ChartReport>[0]>={}){
 const view=render(<ChartReport chart={chart} profile={profile} {...props}/>);fireEvent.click(screen.getByRole('button',{name:mode}));return view
}
it.each(['পূর্ণ রিপোর্ট','গ্রহের বিবরণ','১২ ঘরের বিবরণ','গণনার পদ্ধতি'])('opens and copies the selected report: %s',async(mode)=>{
 open(mode);const dialog=screen.getByRole('dialog',{name:mode});const field=within(dialog).getByLabelText('রিপোর্টের সম্পূর্ণ লেখা')
 fireEvent.click(within(dialog).getByRole('button',{name:'রিপোর্ট কপি',exact:true}))
 expect(await within(dialog).findByRole('status')).toHaveTextContent('রিপোর্ট কপি হয়েছে')
 expect(write).toHaveBeenCalledWith((field as HTMLTextAreaElement).value)
 fireEvent.focus(field);expect((field as HTMLTextAreaElement).selectionStart).toBe(0)
 expect((field as HTMLTextAreaElement).selectionEnd).toBe((field as HTMLTextAreaElement).value.length)
})
it('copies and exports the full report from any section',async()=>{
 open('গণনার পদ্ধতি');const rows=chartRows(chart,profile,'bn')
 fireEvent.click(screen.getByRole('button',{name:'পূর্ণ রিপোর্ট · রিপোর্ট কপি'}));await screen.findByText('রিপোর্ট কপি হয়েছে।')
 expect(write).toHaveBeenCalledWith(chartText(rows))
 fireEvent.click(screen.getByRole('button',{name:'Excel ডাউনলোড'}));expect(exports.excel).toHaveBeenCalledWith(rows)
 fireEvent.click(screen.getAllByRole('button',{name:'PDF সেভ / প্রিন্ট'})[1]);expect(exports.print).toHaveBeenCalledWith(rows,'bn')
 expect(screen.getByRole('status')).toHaveTextContent('Save as PDF')
})
it('shows recovery text when clipboard or export fails',async()=>{
 write.mockRejectedValue(new Error('CLIPBOARD'));open()
 fireEvent.click(screen.getByRole('button',{name:'রিপোর্ট কপি',exact:true}));expect(await screen.findByRole('status')).toHaveTextContent('কপি করা যায়নি')
 exports.excel.mockImplementation(()=>{throw new Error('EXCEL')});fireEvent.click(screen.getByRole('button',{name:'Excel ডাউনলোড'}));expect(screen.getByRole('status')).toHaveTextContent('এক্সপোর্ট করা যায়নি')
 exports.print.mockImplementation(()=>{throw new Error('PRINT')});fireEvent.click(screen.getAllByRole('button',{name:'PDF সেভ / প্রিন্ট'})[0]);expect(screen.getByRole('status')).toHaveTextContent('এক্সপোর্ট করা যায়নি')
})
it.each([3,5])('shows only selected-house facts and toggles feedback: house %s',(house)=>{
 const close=vi.fn();render(<ChartReport chart={chart} profile={profile} house={house} onHouseClose={close}/>)
 expect(screen.getByRole('dialog',{name:`ঘর ${house}`})).toBeInTheDocument()
 const bodyRows=screen.getByRole('table').querySelectorAll('tbody tr');expect(bodyRows).toHaveLength(chart.planets.filter(p=>p.house===house).length)
 const like=screen.getByRole('button',{name:'পছন্দ'}),dislike=screen.getByRole('button',{name:'অপছন্দ'})
 fireEvent.click(like);fireEvent.click(like);expect(like).toHaveAttribute('aria-pressed','false')
 fireEvent.click(dislike);expect(dislike).toHaveAttribute('aria-pressed','true');fireEvent.click(dislike);expect(dislike).toHaveAttribute('aria-pressed','false')
 fireEvent.click(screen.getByRole('button',{name:'ফিরুন'}));expect(close).toHaveBeenCalledOnce()
})
it.each(['en','hi'] as const)('localizes the report dialog in %s',(locale)=>{
 setLocale(locale);open(locale==='en'?'Full report':'पूर्ण रिपोर्ट');expect(screen.getByRole('button',{name:reportCopy[locale].copy,exact:true})).toBeInTheDocument()
})
function choose(view:ReturnType<typeof render>,content:string,size?:number){
 const file=Object.assign(new File([content],'birth.json',{type:'application/json'}),{text:async()=>content})
 if(size!==undefined)Object.defineProperty(file,'size',{value:size})
 fireEvent.change(view.container.ownerDocument.querySelector('.report-popup-footer input')!,{target:{files:[file]}})
}
it('imports only validated birth fields and requires fresh calculation',async()=>{
 const onImport=vi.fn().mockResolvedValue(undefined),close=vi.fn();const view=open('পূর্ণ রিপোর্ট',{onImport,onHouseClose:close})
 choose(view,JSON.stringify({format:'orbis-astro-birth-v1',birth:{...profile,extra:'ignored'},calculation:{fabricated:true}}))
 expect(await screen.findByRole('status')).toHaveTextContent('নতুন গণনা হয়েছে')
 expect(onImport).toHaveBeenCalledWith(profile);expect(close).toHaveBeenCalledOnce();expect(screen.queryByRole('dialog')).toBeNull()
})
it.each([
 ['large','{}',65537],['syntax','broken',undefined],['null','null',undefined],['primitive','42',undefined],
 ['wrong format',JSON.stringify({format:'other',birth:profile}),undefined],
 ['missing birth',JSON.stringify({format:'orbis-astro-birth-v1'}),undefined],
 ['invalid date',JSON.stringify({format:'orbis-astro-birth-v1',birth:{...profile,birthDate:'bad'}}),undefined],
 ['missing location',JSON.stringify({format:'orbis-astro-birth-v1',birth:{...profile,birthLocation:undefined}}),undefined],
 ['missing date',JSON.stringify({format:'orbis-astro-birth-v1',birth:{...profile,birthDate:''}}),undefined],
 ['missing time',JSON.stringify({format:'orbis-astro-birth-v1',birth:{...profile,birthTime:''}}),undefined],
] as const)('rejects unsafe birth imports: %s',async(_name,content,size)=>{
 void _name;const onImport=vi.fn();const view=open('পূর্ণ রিপোর্ট',{onImport});choose(view,content,size)
 expect(await screen.findByRole('status')).toHaveTextContent('Import করা যায়নি');expect(onImport).not.toHaveBeenCalled()
})
it('handles import calculation failure and a cancelled file chooser',async()=>{
 const onImport=vi.fn().mockRejectedValue(new Error('CALCULATION'));const view=open('পূর্ণ রিপোর্ট',{onImport})
 const input=document.querySelector('.report-popup-footer input')!;fireEvent.change(input,{target:{files:[]}});expect(onImport).not.toHaveBeenCalled()
 const click=vi.spyOn(input as HTMLInputElement,'click');fireEvent.click(screen.getByRole('button',{name:'জন্মতথ্য import ↑'}));expect(click).toHaveBeenCalledOnce()
 choose(view,JSON.stringify({format:'orbis-astro-birth-v1',birth:profile}));expect(await screen.findByRole('status')).toHaveTextContent('Import করা যায়নি')
})
it('exports a JSON file and releases its object URL',()=>{
 vi.useFakeTimers();const create=vi.fn().mockReturnValue('blob:birth'),revoke=vi.fn();vi.stubGlobal('URL',Object.assign(class extends URL {},{createObjectURL:create,revokeObjectURL:revoke}))
 vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});open();fireEvent.click(screen.getByRole('button',{name:'JSON ↓'}))
 expect(create).toHaveBeenCalledWith(expect.any(Blob));expect(document.querySelector('a[download]')).toBeNull()
 vi.advanceTimersByTime(1000);expect(revoke).toHaveBeenCalledWith('blob:birth')
})
