import {render} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import ChatComposer from '../src/design/ChatComposer'
afterEach(()=>vi.restoreAllMocks())
it('puts a new question at the top and leaves the reading position unchanged when its answer arrives',()=>{
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){
  const top=this.dataset.questionId==='q2'?240:this.dataset.questionId==='q1'?120:20
  return {top,bottom:top+60,left:0,right:300,width:300,height:60,x:0,y:top,toJSON:()=>({})}
 })
 const first=[{id:'q1',role:'user' as const,text:'First question'}]
 const view=render(<ChatComposer messages={first} onSend={()=>{}}/>)
 const viewport=view.container.querySelector('.chat-conversation') as HTMLDivElement
 expect(viewport.scrollTop).toBe(100)
 const next=[...first,{id:'a1',role:'assistant' as const,text:'First answer'},{id:'q2',role:'user' as const,text:'New question'}]
 view.rerender(<ChatComposer messages={next} onSend={()=>{}} progress="Thinking"/>)
 expect(viewport.scrollTop).toBe(320)
 expect(viewport.querySelector('.maya-thinking[role="status"]')?.textContent).toBe('Thinking')
 viewport.scrollTop=250
 view.rerender(<ChatComposer messages={[...next,{id:'a2',role:'assistant',text:'Detailed answer'}]} onSend={()=>{}}/>)
 expect(viewport.scrollTop).toBe(250)
 expect(viewport.querySelector('.maya-thinking')).toBeNull()
})
