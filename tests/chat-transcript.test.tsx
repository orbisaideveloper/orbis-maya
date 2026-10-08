import {render,screen} from '@testing-library/react'
import {expect,it} from 'vitest'
import {chatArchive,chatTranscript} from '../src/chat/transcript'
import MessageText from '../src/chat/MessageText'

it('exports every displayed turn without silently truncating long archives',()=>{
 const messages=[{id:'q',role:'user' as const,text:'Question'},{id:'a',role:'assistant' as const,text:'Answer'}]
 expect(chatTranscript(messages,'en')).toBe('You\nQuestion\n\nMaya\nAnswer')
 expect(chatArchive(messages,'en')).toEqual({title:'Question',content:'You\nQuestion\n\nMaya\nAnswer'})
 expect(()=>chatArchive([{...messages[0],text:'x'.repeat(40001)}],'en')).toThrow('CHAT_TOO_LARGE')
 expect(()=>chatArchive([],'en')).toThrow('EMPTY_CHAT')
})

it('renders separate paragraphs and bullets as safe text',()=>{
 const view=render(<MessageText value={'প্রথম অনুচ্ছেদ\n\nদ্বিতীয় অনুচ্ছেদ\n\n• মীন\n• বৃহস্পতি\n\n<script>alert(1)</script>'}/>)
 expect(view.container.querySelectorAll('p')).toHaveLength(3)
 expect(screen.getAllByRole('listitem')).toHaveLength(2)
 expect(view.container.querySelector('script')).toBeNull()
 expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
})
