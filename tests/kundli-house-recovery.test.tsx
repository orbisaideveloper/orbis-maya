import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import Kundli from '../src/design/Kundli'
import {setLocale} from '../src/i18n'
import {calculateChart} from '../src/astro/calculate'
const chart=calculateChart('1986-05-10','00:05',{label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'})
afterEach(()=>cleanup())
it('shows pending calculation after selecting a house without a chart',()=>{
 setLocale('en');render(<Kundli/>);fireEvent.click(screen.getByRole('button',{name:'House 3'}));expect(screen.getByRole('status')).toHaveTextContent('Planetary positions have not been calculated.');expect(screen.getByRole('button',{name:'House 3'})).toHaveAttribute('aria-pressed','true')
})
it('reports the selected house to its parent without duplicating the detail panel',()=>{
 setLocale('en');const select=vi.fn();render(<Kundli chart={chart} onHouseSelect={select}/>);fireEvent.click(screen.getByRole('button',{name:'House 5'}));expect(select).toHaveBeenCalledWith(5);expect(screen.queryByRole('status')).toBeNull()
})
it.each(['bn','hi','en'] as const)('explains an empty house in %s',locale=>{
 setLocale(locale);render(<Kundli chart={{...chart,planets:[]}}/>);fireEvent.click(screen.getAllByRole('button')[2]);expect(screen.getByRole('status')).toHaveTextContent(locale==='bn'?'এই ঘরে গ্রহ নেই।':'No planets in this house.')
})
it('shows a planet degree and retrograde marker in the selected house',()=>{
 setLocale('en');const planet={...chart.planets[0],house:1,degree:12.5,retrograde:true};render(<Kundli chart={{...chart,planets:[planet]}}/>);fireEvent.click(screen.getByRole('button',{name:'House 1'}));expect(screen.getByRole('status')).toHaveTextContent('12.50° ℞')
})
