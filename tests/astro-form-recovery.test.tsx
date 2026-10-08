import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import AstroPanel from '../src/design/AstroPanel'
import {setLocale} from '../src/i18n'
import type {Profile} from '../src/profile/store'
const location={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
const initial:Profile={name:'Owner',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Kolkata',birthLocation:location}
const mock=vi.hoisted(()=>({scope:'user:alice' as string|null,initial:{} as Profile,savePerson:vi.fn(),saveChart:vi.fn(),read:vi.fn(),house:vi.fn()}))
vi.mock('../src/profile/store',()=>({useProfile:()=>({scope:mock.scope})}))
vi.mock('../src/profile/family',()=>({useFamily:()=>({active:'self',people:[{id:'self',relation:'self',profile:mock.initial}]}),savePerson:mock.savePerson}))
vi.mock('../src/profile/PersonPicker',()=>({default:()=>null}))
vi.mock('../src/astro/savedChart',()=>({readSavedChart:mock.read,saveChart:mock.saveChart}))
vi.mock('../src/design/Kundli',()=>({default:({chart,onHouseSelect}:{chart:unknown;onHouseSelect?:(house:number)=>void})=><button onClick={()=>onHouseSelect?.(5)}>{chart?'Calculated chart':'Pending chart'}</button>}))
vi.mock('../src/astro/BirthLocationField',()=>({default:({onChange}:{onChange:(place:string,location?:typeof location)=>void})=><button type="button" onClick={()=>onChange('Other')}>Remove selected location</button>}))
vi.mock('../src/astro/ChartReport',()=>({default:({house,onHouseClose,onImport}:{house:number|null;onHouseClose:()=>void;onImport:(profile:Profile)=>Promise<void>})=><div><span>Selected house: {String(house)}</span><button onClick={onHouseClose}>Close house</button><button onClick={()=>{void onImport({...initial,name:'Imported'}).catch(mock.house)}}>Import valid birth</button><button onClick={()=>{void onImport({...initial,birthLocation:undefined}).catch(mock.house)}}>Import without location</button></div>}))
beforeEach(()=>{setLocale('en');mock.scope='user:alice';mock.initial={...initial};mock.read.mockReset().mockReturnValue(null);mock.savePerson.mockReset();mock.saveChart.mockReset();mock.house.mockReset()})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
function save(){fireEvent.click(screen.getByRole('button',{name:'Save and calculate chart'}))}
it('calculates before saving, selects a house and closes the report',async()=>{
 render(<AstroPanel/>);save();await screen.findByText(/Birth details saved. UTC/,{}, {timeout:10000})
 expect(mock.savePerson).toHaveBeenCalledWith('user:alice','self',initial,'self')
 expect(mock.saveChart.mock.calls[0][3].planets).toHaveLength(9)
 expect(mock.saveChart.mock.calls[0][3].utc).toBe('1986-05-09T18:35:00.000Z')
 fireEvent.click(screen.getByText('Calculated chart'));expect(screen.getByText('Selected house: 5')).toBeTruthy()
 fireEvent.click(screen.getByText('Close house'));expect(screen.getByText('Selected house: null')).toBeTruthy()
})
it.each(['Name','Birth date','Birth time'])('invalidates a previously calculated chart after editing %s',async label=>{
 render(<AstroPanel/>);save();await screen.findByText(/Birth details saved. UTC/,{}, {timeout:10000})
 const input=label==='Name'?screen.getByLabelText('Name'):document.querySelector(label==='Birth date'?'input[type="date"]':'input[type="time"]')!
 fireEvent.change(input,{target:{value:label==='Name'?'Changed':label==='Birth date'?'1986-05-11':'00:06'}})
 expect(screen.getByText('Pending chart')).toBeTruthy();expect(screen.queryByText(/Birth details saved. UTC/)).toBeNull()
})
it('requires explicitly selected location and retains editable fields after failure',async()=>{
 render(<AstroPanel/>);fireEvent.click(screen.getByText('Remove selected location'));save()
 await screen.findByText(/Calculation failed/);expect(mock.savePerson).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Save and calculate chart'})).not.toBeDisabled()
})
it.each(['date','time','storage'])('reports %s failure without displaying an unverified chart',async kind=>{
 if(kind==='date')mock.initial={...initial,birthDate:''}
 if(kind==='time')mock.initial={...initial,birthTime:''}
 if(kind==='storage')mock.savePerson.mockImplementation(()=>{throw new Error('private storage detail')})
 render(<AstroPanel/>);save();await screen.findByText(/Calculation failed/)
 expect(screen.getByText('Pending chart')).toBeTruthy();expect(screen.queryByText('private storage detail')).toBeNull()
})
it('disables saving without account scope',()=>{mock.scope=null;render(<AstroPanel/>);expect(screen.getByRole('button',{name:'Save and calculate chart'})).toBeDisabled();expect(screen.getByRole('status').textContent).toContain('Sign in')})
it('imports by recalculating birth inputs and rejects imports without a location',async()=>{
 render(<AstroPanel/>);save();await screen.findByText(/Birth details saved. UTC/,{}, {timeout:10000})
 fireEvent.click(screen.getByText('Import valid birth'));await waitFor(()=>expect(mock.savePerson).toHaveBeenCalledWith('user:alice','self',{...initial,name:'Imported'},'self'))
 expect(screen.getByLabelText('Name')).toHaveValue('Imported')
 fireEvent.click(screen.getByText('Import without location'));await waitFor(()=>expect(mock.house).toHaveBeenCalled());expect(mock.house.mock.calls[0][0].message).toBe('INVALID')
})
it.each(['bn','hi'] as const)('localizes the calculation action in %s',async locale=>{
 setLocale(locale);render(<AstroPanel/>);fireEvent.submit(document.querySelector('form')!)
 await waitFor(()=>expect(mock.saveChart).toHaveBeenCalled())
 expect(screen.getByRole('status').textContent).toContain('1986-05-09T18:35:00.000Z')
})
