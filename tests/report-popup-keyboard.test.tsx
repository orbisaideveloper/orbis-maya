import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import ReportPopup from '../src/astro/ReportPopup'
beforeEach(()=>{history.replaceState(null,'',location.href)})
afterEach(()=>{cleanup();vi.restoreAllMocks();document.body.style.overflow=''})
it('traps keyboard focus in both directions and restores prior focus on close',()=>{
 const origin=document.createElement('button');document.body.append(origin);origin.focus();document.body.style.overflow='auto'
 const view=render(<ReportPopup title="Report" back="Back" onDismiss={()=>{}}><button>Middle</button><textarea aria-label="Report text"/></ReportPopup>)
 const first=screen.getByRole('button',{name:'Back'}),last=screen.getByRole('textbox');last.focus();fireEvent.keyDown(document,{key:'Tab'});expect(first).toHaveFocus()
 fireEvent.keyDown(document,{key:'Tab',shiftKey:true});expect(last).toHaveFocus()
 screen.getByRole('button',{name:'Middle'}).focus();fireEvent.keyDown(document,{key:'Tab'});expect(screen.getByRole('button',{name:'Middle'})).toHaveFocus()
 view.unmount();expect(origin).toHaveFocus();expect(document.body.style.overflow).toBe('auto');origin.remove()
})
it('uses browser Back for an owned history entry and direct dismissal otherwise',()=>{
 const back=vi.spyOn(history,'back').mockImplementation(()=>{}),dismiss=vi.fn()
 render(<ReportPopup title="Report" back="Back" onDismiss={dismiss}><p>Report body</p></ReportPopup>)
 fireEvent.keyDown(document,{key:'Escape'});expect(back).toHaveBeenCalledOnce();expect(dismiss).not.toHaveBeenCalled()
 fireEvent(window,new PopStateEvent('popstate'));expect(dismiss).not.toHaveBeenCalled()
 history.replaceState('other','',location.href);fireEvent.keyDown(document,{key:'Escape'});expect(dismiss).toHaveBeenCalledOnce()
 fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(dismiss).toHaveBeenCalledTimes(2);expect(back).toHaveBeenCalledOnce()
})
