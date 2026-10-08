import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import BirthLocationField from '../src/astro/BirthLocationField'
import ReportPopup from '../src/astro/ReportPopup'
import {setLocale} from '../src/i18n'
beforeEach(()=>setLocale('hi'))
afterEach(()=>{cleanup();vi.restoreAllMocks();history.replaceState(null,'',location.href)})
it('shows Hindi coordinate details and publishes an edited latitude',()=>{
 const change=vi.fn(),location={label:'Kolkata',latitude:22.57,longitude:88.36,timezone:'Asia/Kolkata'}
 render(<BirthLocationField place="Kolkata" location={location} onChange={change}/>);
 expect(screen.getByText(/स्थान और समय विवरण/)).toBeInTheDocument()
 screen.getByText(/स्थान और समय विवरण/).closest('details')!.open=true
 fireEvent.change(screen.getByRole('spinbutton',{name:'अक्षांश'}),{target:{value:'23'}})
 expect(change).toHaveBeenCalledWith('Kolkata',{...location,latitude:23})
})
it('can close a popup when there was no focused element before opening',()=>{
 const focused=vi.spyOn(document,'activeElement','get').mockReturnValue(null)
 const view=render(<ReportPopup title="Report" back="Back" onDismiss={()=>{}}>Body</ReportPopup>)
 focused.mockRestore();expect(()=>view.unmount()).not.toThrow()
})
