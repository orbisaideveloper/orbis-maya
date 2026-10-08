import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import ChatComposer from '../src/design/ChatComposer'
import {setLocale} from '../src/i18n'
const abort=vi.fn()
class Speech {
 continuous=false;interimResults=false;lang=''
 onresult=null;onend=null;onerror=null
 start=vi.fn();stop=vi.fn();abort=abort
}
beforeEach(()=>{setLocale('en');abort.mockClear();vi.stubGlobal('SpeechRecognition',Speech)})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('keeps keyboard input usable when neither browser speech implementation exists',()=>{
 vi.stubGlobal('SpeechRecognition',undefined);vi.stubGlobal('webkitSpeechRecognition',undefined)
 render(<ChatComposer/>);fireEvent.click(screen.getByRole('button',{name:'Start microphone'}))
 expect(screen.getByRole('status')).toHaveTextContent('Voice input is unavailable')
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Typed question'}})
 expect(screen.getByRole('textbox')).toHaveValue('Typed question')
})
it('allows Stop after a language change has released the old microphone',()=>{
 render(<ChatComposer/>);fireEvent.click(screen.getByRole('button',{name:'Start microphone'}))
 act(()=>setLocale('hi'));expect(abort).toHaveBeenCalledOnce()
 fireEvent.click(screen.getByRole('button',{name:'बोलना रोकें'}))
 expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly')
 expect(screen.getByRole('status')).toHaveTextContent('टेक्स्ट जाँचें')
})
