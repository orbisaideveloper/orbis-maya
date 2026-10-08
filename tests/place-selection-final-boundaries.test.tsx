import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const search=vi.hoisted(()=>vi.fn())
vi.mock('../src/astro/birth',async original=>({...await original<typeof import('../src/astro/birth')>(),searchBirthPlaces:search}))
import BirthLocationField from '../src/astro/BirthLocationField'
import {setLocale} from '../src/i18n'
const location={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
beforeEach(()=>{setLocale('hi');search.mockReset().mockResolvedValue([location])})
afterEach(()=>cleanup())
it('localizes the place selection prompt in Hindi',async()=>{render(<BirthLocationField place="Kolkata" onChange={()=>{}}/>);fireEvent.click(screen.getByRole('button'));await waitFor(()=>expect(screen.getByRole('combobox')).toHaveAccessibleName('सही स्थान चुनें'));fireEvent.change(screen.getByRole('combobox'),{target:{value:'0'}});expect(screen.queryByRole('combobox')).toBeNull()})
it('does not emit coordinates for an invalid selection index',async()=>{const change=vi.fn();render(<BirthLocationField place="Kolkata" onChange={change}/>);fireEvent.click(screen.getByRole('button'));const select=await screen.findByRole('combobox');select.append(new Option('Invalid fixture','99'));fireEvent.change(select,{target:{value:'99'}});expect(change).not.toHaveBeenCalled()})

it('does not treat the empty dropdown placeholder as the first result',async()=>{const change=vi.fn();render(<BirthLocationField place="Kolkata" onChange={change}/>);fireEvent.click(screen.getByRole('button'));await screen.findByRole('combobox');fireEvent.change(screen.getByRole('combobox'),{target:{value:''}});expect(change).not.toHaveBeenCalled()})
