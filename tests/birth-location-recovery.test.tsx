import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import BirthLocationField from '../src/astro/BirthLocationField'
import {setLocale} from '../src/i18n'
const transport=vi.hoisted(()=>vi.fn())
vi.mock('../src/astro/birth',async original=>({...await original<typeof import('../src/astro/birth')>(),searchBirthPlaces:transport}))
const location={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
beforeEach(()=>{setLocale('en');transport.mockReset().mockResolvedValue([])})
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks()})
function search(){fireEvent.click(screen.getByRole('button',{name:'Find place'}))}
it('reports empty results and allows retry after network failure',async()=>{
 transport.mockRejectedValueOnce(new Error('private detail'))
 render(<BirthLocationField place="Kolkata" onChange={vi.fn()}/>);search()
 await screen.findByText('Place search failed. Check the connection and retry.')
 expect(screen.queryByText('private detail')).toBeNull()
 search();await screen.findByText('No matching place. Try a city and state/country.')
 expect(screen.getByRole('button',{name:'Find place'})).not.toBeDisabled()
})
it('requires selection before passing coordinates and ignores an invalid selection index',async()=>{
 const change=vi.fn();transport.mockResolvedValue([location])
 render(<BirthLocationField place="Kolkata" onChange={change}/>);search()
 const select=await screen.findByRole('combobox')
 const unknown=document.createElement('option');unknown.value='99';unknown.textContent='Invalid record';select.append(unknown)
 fireEvent.change(select,{target:{value:'99'}});expect(change).not.toHaveBeenCalled()
 fireEvent.change(select,{target:{value:'0'}});expect(change).toHaveBeenCalledWith('Kolkata',location)
 expect(screen.queryByRole('combobox')).toBeNull()
})
it.each(['resolve','reject'] as const)('discards stale search %s after place editing',async mode=>{
 let resolve!:(value:typeof location[])=>void,reject!:(error:Error)=>void
 transport.mockReturnValue(new Promise<typeof location[]>((yes,no)=>{resolve=yes;reject=no}))
 const change=vi.fn();render(<BirthLocationField place="Kolkata" onChange={change}/>);search()
 const signal=transport.mock.calls[0][2] as AbortSignal
 fireEvent.change(screen.getByLabelText('Birthplace'),{target:{value:'Other'}})
 expect(signal.aborted).toBe(true);expect(change).toHaveBeenCalledWith('Other')
 await act(async()=>{if(mode==='resolve')resolve([location]);else reject(new Error('late'))})
 expect(screen.queryByRole('combobox')).toBeNull();expect(screen.queryByRole('status')).toBeNull()
 expect(screen.getByRole('button',{name:'Find place'})).not.toBeDisabled()
})
it.each(['resolve','reject'] as const)('aborts on unmount and ignores late %s',async mode=>{
 let resolve!:(value:typeof location[])=>void,reject!:(error:Error)=>void
 transport.mockReturnValue(new Promise<typeof location[]>((yes,no)=>{resolve=yes;reject=no}))
 const change=vi.fn(),view=render(<BirthLocationField place="Kolkata" onChange={change}/>);search()
 const signal=transport.mock.calls[0][2] as AbortSignal;view.unmount();expect(signal.aborted).toBe(true)
 await act(async()=>{if(mode==='resolve')resolve([location]);else reject(new Error('late'))})
 expect(change).not.toHaveBeenCalled()
})
it('aborts at the search deadline and releases busy state after transport cancellation',async()=>{
 vi.useFakeTimers()
 transport.mockImplementation((_query:string,_locale:string,signal:AbortSignal)=>new Promise((_yes,no)=>signal.addEventListener('abort',()=>no(new DOMException('Cancelled','AbortError')))))
 render(<BirthLocationField place="Kolkata" onChange={vi.fn()}/>);search()
 expect(screen.getByRole('button',{name:'Searching…'})).toBeDisabled()
 await act(async()=>{await vi.advanceTimersByTimeAsync(10000)})
 expect(screen.getByText('Place search failed. Check the connection and retry.')).toBeTruthy()
 expect(screen.getByRole('button',{name:'Find place'})).not.toBeDisabled()
})
it('edits coordinates without guessing blanks and validates timezone edits',()=>{
 const change=vi.fn();const view=render(<BirthLocationField place="Kolkata" location={location} onChange={change}/>)
 fireEvent.change(screen.getByLabelText('Latitude'),{target:{value:''}})
 expect(Number.isNaN(change.mock.calls.at(-1)![1].latitude)).toBe(true)
 expect(screen.getByText('Invalid coordinates or timezone.')).toBeTruthy()
 fireEvent.change(screen.getByLabelText('Longitude'),{target:{value:'89'}})
 expect(change.mock.calls.at(-1)![1].longitude).toBe(89);expect(screen.queryByRole('status')).toBeNull()
 fireEvent.change(screen.getByLabelText('Timezone'),{target:{value:'wrong-zone'}})
 expect(screen.getByText('Invalid coordinates or timezone.')).toBeTruthy()
 fireEvent.change(screen.getByLabelText('Timezone'),{target:{value:'UTC'}})
 expect(change.mock.calls.at(-1)![1].timezone).toBe('UTC');expect(screen.queryByRole('status')).toBeNull()
 view.rerender(<BirthLocationField place="Kolkata" location={{...location,latitude:NaN,longitude:NaN}} onChange={change}/>)
 expect(screen.getByLabelText('Latitude')).toHaveValue(null);expect(screen.getByLabelText('Longitude')).toHaveValue(null)
})
it.each(['bn','hi'] as const)('localizes search and result selection in %s',async locale=>{
 setLocale(locale);transport.mockResolvedValue([location])
 render(<BirthLocationField place="Kolkata" onChange={vi.fn()}/>)
 fireEvent.click(screen.getByRole('button',{name:locale==='bn'?'জায়গা খুঁজুন':'स्थान खोजें'}))
 await screen.findByRole('combobox',{name:locale==='bn'?'সঠিক স্থান বেছে নিন':'सही स्थान चुनें'})
 expect(transport.mock.calls[0][1]).toBe(locale)
})
it('disables search for short place names',()=>{
 render(<BirthLocationField place=" A " onChange={vi.fn()}/>)
 expect(screen.getByRole('button',{name:'Find place'})).toBeDisabled()
})
