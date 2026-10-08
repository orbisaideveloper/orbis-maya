import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import ChartReport from '../src/astro/ChartReport'
import {calculateChart} from '../src/astro/calculate'
vi.mock('../src/i18n',()=>({useLocale:()=> 'bn'}))
const profile={name:'Owner',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Krishnanagar',birthLocation:{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}}
const chart=calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation)
afterEach(()=>cleanup())
it('keeps the full report compact without repeating all house explanations',()=>{
 render(<ChartReport chart={chart} profile={profile}/>);fireEvent.click(screen.getByRole('button',{name:'পূর্ণ রিপোর্ট'}))
 expect(screen.getByRole('dialog')).toBeTruthy();expect(screen.queryByRole('region',{name:'জন্মছকের ব্যাখ্যা'})).toBeNull()
 expect(screen.getByRole('textbox').getAttribute('readonly')).not.toBeNull();expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).not.toContain('এই বিষয়ের প্রথাগত অর্থ')
})
it('keeps an individual house explanation with its selected house',()=>{
 render(<ChartReport chart={chart} profile={profile} house={4}/>)
 expect(screen.getByRole('region',{name:'জন্মছকের ব্যাখ্যা'})).toBeTruthy()
 expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain('ঘর 4:')
 expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).not.toContain('ঘর 9:')
})
