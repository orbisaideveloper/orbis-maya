import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import Kundli from '../src/design/Kundli'
import ReportPopup from '../src/astro/ReportPopup'
import type {BirthChart} from '../src/astro/calculate'
import {setLocale} from '../src/i18n'
const chart:BirthChart={utc:'2000-01-01T00:00:00Z',ascendant:0,ayanamsa:24,planets:[{id:'Uncatalogued',longitude:1,degree:1,sign:0,house:1,retrograde:true}],engine:'Astronomy Engine 2.1.19',method:'Lahiri J2000 anchor; IERS UTC/TT (1972+); whole-sign; true-frame mean nodes',validation:'reference validation pending',timePolicy:'test fixture'}
beforeEach(()=>setLocale('en'))
afterEach(()=>{cleanup();vi.restoreAllMocks();history.replaceState(null,'',location.href)})
it('displays a safe fallback for uncatalogued chart bodies',()=>{render(<Kundli chart={chart}/>);fireEvent.click(screen.getByRole('button',{name:'House 1',exact:true}));expect(screen.getByRole('status')).toHaveTextContent('Uncatalogued 1.00° ℞')})
it.each(['bn','en','hi'] as const)('explains empty calculated houses in %s',locale=>{setLocale(locale);render(<Kundli chart={chart}/>);fireEvent.click(screen.getAllByRole('button')[1]);expect(screen.getByRole('status')).toHaveTextContent(locale==='bn'?'এই ঘরে গ্রহ নেই।':'No planets in this house.')})
it('keeps focus within a popup at both tab boundaries',()=>{render(<ReportPopup title="Report" back="Back" onDismiss={()=>{}}><button type="button">Last</button></ReportPopup>);const first=screen.getByRole('button',{name:'Back'}),last=screen.getByRole('button',{name:'Last'});last.focus();fireEvent.keyDown(document,{key:'Tab'});expect(document.activeElement).toBe(first);fireEvent.keyDown(document,{key:'Tab',shiftKey:true});expect(document.activeElement).toBe(last);first.focus();fireEvent.keyDown(document,{key:'Tab'});expect(document.activeElement).toBe(first)})
it('dismisses Escape directly if the history token no longer belongs to the popup',()=>{const dismiss=vi.fn();render(<ReportPopup title="Report" back="Back" onDismiss={dismiss}>Body</ReportPopup>);history.replaceState(null,'',location.href);fireEvent.keyDown(document,{key:'Escape'});expect(dismiss).toHaveBeenCalledOnce()})
it('does not navigate back when closing after the history token changes',()=>{const dismiss=vi.fn(),back=vi.spyOn(history,'back').mockImplementation(()=>{});render(<ReportPopup title="Report" back="Back" onDismiss={dismiss}>Body</ReportPopup>);history.replaceState(null,'',location.href);fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).not.toHaveBeenCalled();expect(dismiss).toHaveBeenCalledOnce()})
it('ignores an unrelated key and a popstate retaining its own token',()=>{const dismiss=vi.fn();render(<ReportPopup title="Report" back="Back" onDismiss={dismiss}>Body</ReportPopup>);fireEvent.keyDown(document,{key:'Enter'});fireEvent(window,new PopStateEvent('popstate'));expect(dismiss).not.toHaveBeenCalled()})
