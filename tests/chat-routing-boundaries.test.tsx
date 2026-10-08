import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({state:{draft:'question',messages:[] as {id:string;role:'user'|'assistant';text:string}[],personId:'self',busy:false,failure:null as string|null,storageFailed:false},people:[] as {id:string;relation:string;profile:{name:string}}[],send:vi.fn(),clarify:vi.fn(),draft:vi.fn(),configured:true}))
vi.mock('../src/chat/session',()=>({useChat:()=>mock.state,sendChat:mock.send,addClarification:mock.clarify,setChatDraft:mock.draft,chatConfigured:()=>mock.configured}))
vi.mock('../src/profile/family',()=>({readFamily:()=>({people:mock.people})}))
vi.mock('../src/chat/AttachmentPicker',()=>({default:({value,onChange,onBusy}:{value:unknown[];onChange:(v:unknown[])=>void;onBusy:(v:boolean)=>void})=><><button type="button" onClick={()=>onChange([{name:'fixture.txt',kind:'text',text:'fixture'}])}>Attach fixture</button><button type="button" onClick={()=>onBusy(true)}>Prepare fixture</button><output data-testid="count">{value.length}</output></>}))
import ChatScreen from '../src/ChatScreen'
import {setLocale} from '../src/i18n'
beforeEach(()=>{setLocale('en');mock.configured=true;mock.state={draft:'question',messages:[],personId:'self',busy:false,failure:null,storageFailed:false};mock.people=[{id:'self',relation:'',profile:{name:'Owner'}}];mock.send.mockReset().mockResolvedValue(true);mock.clarify.mockReset();mock.draft.mockReset()})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()})
function send(){fireEvent.click(screen.getByRole('button',{name:'Send'}))}
it('sends a named family member to their own chart context',()=>{mock.people.push({id:'child',relation:'daughter',profile:{name:'Rina'}});mock.state.draft='Tell me about Rina';render(<ChatScreen userId="u"/>);send();expect(mock.send).toHaveBeenCalledWith('u','conversation','en','child')})
it('resolves a family relationship without requiring the name',()=>{mock.people.push({id:'child',relation:'daughter',profile:{name:'Rina'}});mock.state.draft='my daughter chart';render(<ChatScreen userId="u"/>);send();expect(mock.send).toHaveBeenCalledWith('u','conversation','en','child')})
it.each(['duplicate-name','duplicate-relation','unspecified'])('asks for clarification for %s',kind=>{
 mock.people.push({id:'one',relation:'child',profile:{name:'Rina'}},{id:'two',relation:'child',profile:{name:kind==='duplicate-name'?'Rina':'Mina'}})
 mock.state.draft=kind==='duplicate-name'?'Rina chart':kind==='duplicate-relation'?'child chart':'whose chart?';render(<ChatScreen userId="u"/>);send();expect(mock.clarify).toHaveBeenCalledWith('u','conversation',expect.stringContaining('Tell me the name'));expect(mock.send).not.toHaveBeenCalled()
})
it('uses self for an explicit ownership request',()=>{mock.people.push({id:'child',relation:'daughter',profile:{name:'Rina'}});mock.state.draft='my chart';render(<ChatScreen userId="u"/>);send();expect(mock.send).toHaveBeenCalledWith('u','conversation','en','self')})
it('preserves the selected person after conversation starts',()=>{mock.people.push({id:'child',relation:'daughter',profile:{name:'Rina'}});mock.state.personId='child';mock.state.messages=[{id:'prior',role:'user',text:'prior'}];render(<ChatScreen userId="u"/>);send();expect(mock.send).toHaveBeenCalledWith('u','conversation','en','child')})
it('reports a removed person without invoking the model',()=>{mock.state.personId='removed';render(<ChatScreen userId="u"/>);send();expect(mock.clarify).toHaveBeenCalledWith('u','conversation',expect.stringContaining('not found'));expect(mock.send).not.toHaveBeenCalled()})
it.each([true,false])('clears prepared attachments only when sending succeeds: %s',async sent=>{
 mock.send.mockResolvedValue(sent);render(<ChatScreen userId="u"/>);fireEvent.click(screen.getByText('Attach fixture'));send();await waitFor(()=>expect(mock.send).toHaveBeenCalled());await waitFor(()=>expect(screen.getByTestId('count')).toHaveTextContent(sent?'0':'1'))
})
it('forwards changes to the correct conversation draft',()=>{render(<ChatScreen userId="u"/>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'new question'}});expect(mock.draft).toHaveBeenCalledWith('u','conversation','new question')})
it('disables sending while a file is preparing',()=>{render(<ChatScreen userId="u"/>);fireEvent.click(screen.getByText('Prepare fixture'));expect(screen.getByRole('button',{name:'Send'})).toBeDisabled()})
it('shows request and local-save errors together',()=>{mock.state.failure='network';mock.state.storageFailed=true;render(<ChatScreen userId="u"/>);expect(screen.getAllByRole('alert')).toHaveLength(2)})
it('tracks visual viewport resize and releases listeners on unmount',()=>{
 const viewport=new EventTarget() as EventTarget&{height:number;offsetTop:number};viewport.height=440;viewport.offsetTop=15;vi.stubGlobal('visualViewport',viewport)
 const remove=vi.spyOn(viewport,'removeEventListener');const view=render(<div className="maya-shell"><ChatScreen userId="u"/></div>);const shell=view.container.firstElementChild as HTMLElement
 expect(shell.style.getPropertyValue('--chat-viewport-height')).toBe('440px');expect(shell.style.getPropertyValue('--chat-viewport-top')).toBe('15px')
 act(()=>{viewport.height=500;viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));window.dispatchEvent(new Event('resize'))});expect(shell.style.getPropertyValue('--chat-viewport-height')).toBe('500px');view.unmount();expect(remove).toHaveBeenCalledTimes(2);expect(shell.style.getPropertyValue('--chat-viewport-height')).toBe('')
})
it('uses browser height when visual viewport is unavailable',()=>{vi.stubGlobal('visualViewport',undefined);const view=render(<div className="maya-shell"><ChatScreen userId="u"/></div>);expect((view.container.firstElementChild as HTMLElement).style.getPropertyValue('--chat-viewport-top')).toBe('0px')})
