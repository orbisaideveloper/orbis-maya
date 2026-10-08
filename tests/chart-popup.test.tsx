import { StrictMode } from 'react'
import { afterEach,expect,it,vi } from 'vitest'
import { cleanup,fireEvent,render,screen } from '@testing-library/react'
import ChartReport from '../src/astro/ChartReport'
import Kundli from '../src/design/Kundli'
import { calculateChart } from '../src/astro/calculate'
vi.mock('../src/i18n',()=>({useLocale:()=> 'bn'}))
const profile={name:'Ajay Saha',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Krishnanagar',birthLocation:{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}}
const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation)
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('keeps tables off the main page, opens a report dialog and closes it with Back',()=>{
 vi.spyOn(history,'back').mockImplementation(()=>{})
 render(<ChartReport chart={chart} profile={profile}/>)
 expect(screen.queryByRole('table')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'পূর্ণ রিপোর্ট'}))
 expect(screen.getByRole('dialog',{name:'পূর্ণ রিপোর্ট'})).toBeTruthy();expect(screen.getAllByRole('table')).toHaveLength(2)
 fireEvent.click(screen.getByRole('button',{name:'পছন্দ'}));expect(screen.getByRole('button',{name:'পছন্দ'}).getAttribute('aria-pressed')).toBe('true')
 fireEvent.click(screen.getByRole('button',{name:'ফিরুন'}));expect(screen.queryByRole('dialog')).toBeNull();expect(screen.queryByRole('table')).toBeNull()
})
it('routes a chart-house tap to the report and does not leave an inline detail box',()=>{
 const open=vi.fn();render(<Kundli chart={chart} onHouseSelect={open}/>)
 fireEvent.click(screen.getByRole('button',{name:'ঘর ৯'}));expect(open).toHaveBeenCalledWith(9);expect(screen.queryByRole('status')).toBeNull()
})
it('closes the report when the browser Back event arrives',()=>{
 vi.spyOn(history,'back').mockImplementation(()=>{})
 render(<ChartReport chart={chart} profile={profile}/>)
 fireEvent.click(screen.getByRole('button',{name:'গ্রহের বিবরণ'}));expect(screen.getByRole('dialog')).toBeTruthy()
 history.replaceState(null,'',location.href)
 fireEvent(window,new PopStateEvent('popstate',{state:null}));expect(screen.queryByRole('dialog')).toBeNull()
})

it('survives StrictMode effect replay and changing dismiss callback without backing out',()=>{
 const back=vi.spyOn(history,'back').mockImplementation(()=>{})
 const view=render(<StrictMode><ChartReport chart={chart} profile={profile} onHouseClose={()=>{}}/></StrictMode>)
 fireEvent.click(screen.getByRole('button',{name:'পূর্ণ রিপোর্ট'}))
 view.rerender(<StrictMode><ChartReport chart={chart} profile={profile} onHouseClose={()=>{}}/></StrictMode>)
 expect(screen.getByRole('dialog',{name:'পূর্ণ রিপোর্ট'})).toBeTruthy()
 expect(back).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'ফিরুন'}))
 expect(back).toHaveBeenCalledTimes(1)
 expect(screen.queryByRole('dialog')).toBeNull()
})
