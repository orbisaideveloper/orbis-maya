import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import ChatComposer from '../src/design/ChatComposer'
import {setLocale} from '../src/i18n'
let failStart=false
const sessions:FakeSpeech[]=[]
class FakeSpeech {
 continuous=false;interimResults=false;lang=''
 onresult:((event:{resultIndex:number;results:{isFinal:boolean;0:{transcript:string}}[]})=>void)|null=null
 onend:(()=>void)|null=null
 onerror:((event:{error:string})=>void)|null=null
 start(){if(failStart)throw new Error('permission denied')}stop=vi.fn();abort=vi.fn()
 constructor(){sessions.push(this)}
}
beforeEach(()=>{setLocale('en');sessions.length=0;failStart=false;vi.stubGlobal('SpeechRecognition',FakeSpeech)})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
function start(){fireEvent.click(screen.getByRole('button',{name:'Start microphone'}))}
it('reports permission exceptions and allows keyboard input afterwards',()=>{failStart=true;render(<ChatComposer/>);start();expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly');expect(screen.getByRole('status')).toHaveTextContent('Voice input failed')})
it('reports service errors and never restarts after failure',()=>{render(<ChatComposer/>);start();act(()=>sessions[0].onerror?.({error:'network'}));expect(screen.getByRole('status')).toHaveTextContent('Voice input failed');act(()=>sessions[0].onend?.());expect(sessions).toHaveLength(1)})
it('ignores no-speech events while preserving the active session',()=>{render(<ChatComposer/>);start();act(()=>sessions[0].onerror?.({error:'no-speech'}));expect(screen.getByRole('button',{name:'Stop dictation'})).toHaveAttribute('aria-pressed','true')})
it('ignores errors and end events from an obsolete session',()=>{render(<ChatComposer/>);start();act(()=>sessions[0].onend?.());act(()=>{sessions[0].onerror?.({error:'network'});sessions[0].onend?.()});expect(sessions).toHaveLength(2);expect(screen.getByRole('button',{name:'Stop dictation'})).toBeInTheDocument()})
it('uses the prefixed browser implementation when needed',()=>{vi.stubGlobal('SpeechRecognition',undefined);vi.stubGlobal('webkitSpeechRecognition',FakeSpeech);render(<ChatComposer/>);start();expect(sessions).toHaveLength(1)})
it('bounds dream dictation to the dream input limit',()=>{render(<ChatComposer mode="dream"/>);start();act(()=>sessions[0].onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'x'.repeat(8100)}}]}));expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toHaveLength(8000)})
it('aborts old recognition on a language change and ignores its callbacks',()=>{const view=render(<ChatComposer/>);start();const old=sessions[0];act(()=>setLocale('hi'));view.rerender(<ChatComposer/>);expect(old.abort).toHaveBeenCalledOnce();act(()=>old.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'stale'}}]}));expect(screen.getByRole('textbox')).toHaveValue('')})
