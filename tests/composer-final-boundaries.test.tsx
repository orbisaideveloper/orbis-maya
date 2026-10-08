import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import ChatComposer,{MessageActions} from '../src/design/ChatComposer'
import {setLocale} from '../src/i18n'
beforeEach(()=>setLocale('en'))
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('allows the same positive vote to be removed',()=>{render(<MessageActions value="answer"/>);const like=screen.getByRole('button',{name:'Like'});fireEvent.click(like);expect(like).toHaveAttribute('aria-pressed','true');fireEvent.click(like);expect(like).toHaveAttribute('aria-pressed','false')})
it('allows the same negative vote to be removed',()=>{render(<MessageActions value="answer"/>);const dislike=screen.getByRole('button',{name:'Dislike'});fireEvent.click(dislike);expect(dislike).toHaveAttribute('aria-pressed','true');fireEvent.click(dislike);expect(dislike).toHaveAttribute('aria-pressed','false')})
it('reports clipboard rejection without losing the assistant answer',async()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockRejectedValue(new Error('permission'))}});render(<MessageActions value="preserved answer"/>);fireEvent.click(screen.getByRole('button',{name:'Copy'}));await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Copy failed'))})
it('does not attempt a turn anchor if the DOM question is missing',()=>{
 const original=HTMLElement.prototype.querySelectorAll
 vi.spyOn(HTMLElement.prototype,'querySelectorAll').mockImplementation(function(this:HTMLElement,selector:string){if(selector==='[data-question-id]')return original.call(this,'[data-no-such-question]');return original.call(this,selector)})
 const view=render(<ChatComposer messages={[{id:'q',role:'user',text:'question'}]}/>);expect((view.container.querySelector('.chat-conversation') as HTMLElement).scrollTop).toBe(0)
})
