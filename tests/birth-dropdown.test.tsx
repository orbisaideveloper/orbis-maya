import { afterEach,expect,it,vi } from 'vitest'
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import BirthLocationField from '../src/astro/BirthLocationField'
vi.mock('../src/i18n',()=>({useLocale:()=> 'bn'}))
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('requires explicit dropdown selection before emitting coordinates and collapses details',async()=>{
 const onChange=vi.fn()
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({results:[{name:'Krishnanagar',admin1:'West Bengal',country:'India',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}]})}))
 const view=render(<BirthLocationField place="Krishnanagar" onChange={onChange}/>)
 fireEvent.click(screen.getByRole('button',{name:'জায়গা খুঁজুন'}))
 await waitFor(()=>expect(screen.getByRole('combobox')).toBeTruthy());expect(onChange).not.toHaveBeenCalled()
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'0'}})
 const [place,location]=onChange.mock.calls[0]
 expect(location.latitude).toBe(23.40576)
 view.rerender(<BirthLocationField place={place} location={location} onChange={onChange}/>)
 expect(view.container.querySelector('details')?.open).toBe(false)
 fireEvent.change(screen.getByLabelText('জন্মস্থান'),{target:{value:'Other'}})
 expect(onChange.mock.calls.at(-1)).toEqual(['Other'])
})
