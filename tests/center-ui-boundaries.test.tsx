import {cleanup,render,screen,within} from '@testing-library/react'
import {afterEach,beforeEach,expect,it} from 'vitest'
import {setLocale} from '../src/i18n'
import BottomNav from '../src/design/BottomNav'
import DesignScreen from '../src/design/DesignScreen'
import {speechText,finalSpeechText} from '../src/design/speech-text'
beforeEach(()=>{localStorage.clear();setLocale('bn')})
afterEach(()=>cleanup())
it('marks settings active for the profile route and only one navigation item',()=>{
 render(<BottomNav path="/profile"/>);const links=within(screen.getByRole('navigation')).getAllByRole('link')
 expect(links.filter(link=>link.getAttribute('aria-current')==='page')).toHaveLength(1)
 expect(links[4]).toHaveAttribute('aria-current','page')
})
it('leaves every navigation link inactive on an unknown route',()=>{
 render(<BottomNav path="/unknown"/>);expect(screen.getAllByRole('link').every(link=>!link.hasAttribute('aria-current'))).toBe(true)
})
it('renders a safe notification fallback for an unknown design path',()=>{
 const view=render(<DesignScreen path="/unknown"/>);expect(view.container.querySelector('.design-settings')).toBeInTheDocument()
 expect(screen.getByRole('heading',{level:1})).toHaveTextContent('নোটিফিকেশন')
 expect(view.container.querySelector('.inner-panel')).toBeNull()
})
it('ignores whitespace-only recognition slots without losing confirmed Bengali words',()=>{
 const results=[{isFinal:true,0:{transcript:'  '}},{isFinal:true,0:{transcript:'আমার স্বপ্ন'}},{isFinal:false,0:{transcript:'   '}}]
 expect(speechText('আগের কথা',results)).toBe('আগের কথা আমার স্বপ্ন')
 expect(finalSpeechText('',results)).toBe('আমার স্বপ্ন')
})
