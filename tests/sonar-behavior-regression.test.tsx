import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import MessageText from '../src/chat/MessageText'
import ChatTools from '../src/chat/ChatTools'
import ReportPopup from '../src/astro/ReportPopup'
import {keyedItems} from '../src/listKeys'
import {escapeXml} from '../src/astro/chartReport'
vi.mock('../src/i18n',()=>({useLocale:()=> 'bn'}))
afterEach(()=>{cleanup();vi.restoreAllMocks();history.replaceState(null,'',location.href)})
it('keeps repeated paragraphs and bullets visible without replacing an unchanged paragraph on insertion',()=>{
 const errors=vi.spyOn(console,'error').mockImplementation(()=>{})
 const value='Repeated paragraph\n\nRepeated paragraph\n\n- same item\n- same item'
 const view=render(<MessageText value={value}/>)
 const first=screen.getAllByText('Repeated paragraph')[0]
 expect(screen.getAllByRole('listitem')).toHaveLength(2)
 view.rerender(<MessageText value={'Inserted paragraph\n\n'+value}/>)
 expect(screen.getAllByText('Repeated paragraph')[0]).toBe(first)
 expect(screen.getAllByText('Repeated paragraph')).toHaveLength(2)
 expect(screen.getAllByRole('listitem')).toHaveLength(2)
 expect(errors).not.toHaveBeenCalled()
 expect(keyedItems([],value=>String(value))).toEqual([])
})
it('keeps literal markup safe and preserves emoji in exported XML',()=>{
 render(<MessageText value={'<script>window.private=true</script>'}/>)
 expect(screen.getByText('<script>window.private=true</script>')).toBeVisible()
 expect(document.querySelector('.message-prose script')).toBeNull()
 expect(escapeXml('😀\u0000<&')).toBe('😀&lt;&amp;')
})
it('Escape only closes the chat menu that owns the keyboard event and restores summary focus',()=>{
 const view=render(<ChatTools userId="sonar-menu-regression"/>)
 const summary=screen.getByTitle('চ্যাটের অপশন')
 const menu=view.container.querySelector('details')!
 menu.open=true
 fireEvent.keyDown(summary,{key:'Tab'})
 expect(menu.open).toBe(true)
 fireEvent.keyDown(document,{key:'Escape'})
 expect(menu.open).toBe(true)
 fireEvent.keyDown(summary,{key:'Escape'})
 expect(menu.open).toBe(false)
 expect(summary).toHaveFocus()
 view.unmount()
 fireEvent.keyDown(document,{key:'Escape'})
})
it('opens a native report dialog with owned browser history and restores scrolling on dismissal',()=>{
 document.body.style.overflow='auto'
 const view=render(<ReportPopup title="Native report" back="Back" onDismiss={()=>{}}><p>Body</p></ReportPopup>)
 const dialog=screen.getByRole('dialog',{name:'Native report'})
 expect(dialog.tagName).toBe('DIALOG')
 expect(dialog).toHaveAttribute('open')
 expect(dialog).toHaveFocus()
 expect(history.state.astroReportPopup).toMatch(/^astro-report-[0-9a-f-]{36}$/i)
 expect(document.body.style.overflow).toBe('hidden')
 view.unmount()
 expect(document.body.style.overflow).toBe('auto')
 document.body.style.overflow=''
})
