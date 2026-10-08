import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({workbook:vi.fn()}))
vi.mock('../src/astro/exportChart',()=>({downloadWorkbook:mock.workbook,printReport:vi.fn()}))
import ChartReport from '../src/astro/ChartReport'
import ReportPopup from '../src/astro/ReportPopup'
import Kundli from '../src/design/Kundli'
import {calculateChart} from '../src/astro/calculate'
import {chartRows} from '../src/astro/chartReport'
import {setLocale} from '../src/i18n'
const profile={name:'Owner',birthDate:'2000-01-01',birthTime:'12:00',birthPlace:'Kolkata',birthLocation:{label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}}
const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation)
beforeEach(()=>{setLocale('en');mock.workbook.mockReset();vi.spyOn(history,'back').mockImplementation(()=>{})})
afterEach(()=>{cleanup();vi.restoreAllMocks();history.replaceState(null,'',location.href)})
it('exports the complete chart workbook from a section popup',()=>{render(<ChartReport chart={chart} profile={profile}/>);fireEvent.click(screen.getByRole('button',{name:'Planet details'}));const button=screen.getAllByRole('button').find(button=>button.textContent?.includes('Excel'))!;fireEvent.click(button);expect(mock.workbook).toHaveBeenCalledWith(chartRows(chart,profile,'en'))})
it('imports validated birth data and reports success in English',async()=>{
 const onImport=vi.fn().mockResolvedValue(undefined);render(<ChartReport chart={chart} profile={profile} onImport={onImport}/>);fireEvent.click(screen.getByRole('button',{name:'Full report'}));const file=new File(['fixture'],'birth.json',{type:'application/json'});Object.defineProperty(file,'text',{value:async()=>JSON.stringify({format:'orbis-astro-birth-v1',birth:profile})});fireEvent.change(document.querySelector('input[type=file]')!,{target:{files:[file]}});await waitFor(()=>expect(onImport).toHaveBeenCalledWith(profile));expect(await screen.findByRole('status')).toHaveTextContent('Birth details imported and recalculated.')
})
it('reports an invalid birth import in English without changing the profile',async()=>{
 const onImport=vi.fn();render(<ChartReport chart={chart} profile={profile} onImport={onImport}/>);fireEvent.click(screen.getByRole('button',{name:'Full report'}));const file=new File(['fixture'],'invalid.json',{type:'application/json'});Object.defineProperty(file,'text',{value:async()=> '{}'});fireEvent.change(document.querySelector('input[type=file]')!,{target:{files:[file]}});expect(await screen.findByRole('status')).toHaveTextContent('Import failed');expect(onImport).not.toHaveBeenCalled()
})
it('displays a known direct-moving body without a retrograde symbol',()=>{const own={...chart,planets:[{id:'Sun',longitude:1,degree:1,sign:0,house:1,retrograde:false}]};render(<Kundli chart={own}/>);fireEvent.click(screen.getByRole('button',{name:'House 1',exact:true}));expect(screen.getByRole('status')).toHaveTextContent('Sun 1.00°');expect(screen.getByRole('status')).not.toHaveTextContent('℞')})
it('handles Tab safely if all controls have temporarily been removed from a popup',()=>{const view=render(<ReportPopup title="Report" back="Back" onDismiss={()=>{}}>Body</ReportPopup>);screen.getByRole('button',{name:'Back'}).remove();fireEvent.keyDown(document,{key:'Tab'});expect(screen.getByRole('dialog')).toBeInTheDocument();view.unmount()})
