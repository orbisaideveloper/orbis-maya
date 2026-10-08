import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'
import ChatComposer from '../src/design/ChatComposer'
import { setLocale } from '../src/i18n'
import { setTheme } from '../src/design/theme'
beforeEach(()=>{localStorage.clear();setLocale('bn');setTheme('astral-gold');window.history.replaceState(null,'','/?maya-design=1#/chat')})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})
function route(path:string){act(()=>{window.history.replaceState(null,'',`/?maya-design=1#${path}`);window.dispatchEvent(new HashChangeEvent('hashchange'))})}
it('uses one full conversation layout for separate dream and chat routes',()=>{
  render(<App/>)
  expect(screen.getByRole('textbox',{name:'কী জানতে চান?'})).toBeInTheDocument()
  expect(screen.getByRole('button',{name:'পাঠান'})).toBeDisabled()
  route('/dream')
  expect(screen.getByRole('textbox',{name:'নিজের স্বপ্ন লিখুন'})).toBeInTheDocument()
  expect(screen.getByRole('button',{name:'মাইক চালু করুন'})).toBeInTheDocument()
  route('/settings')
  expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument()
  expect(document.querySelector('.app-header .app-menu')).toBeNull()
})
it('shows exactly four birth fields and twelve empty selectable houses without fabricated planets',async()=>{
  render(<App/>);route('/astro')
  const region=screen.getAllByRole('region',{name:'জ্যোতিষ নির্দেশনা'}).find(region=>region.querySelector('input'))!
  expect(region.querySelectorAll('input')).toHaveLength(4)
  fireEvent.change(screen.getByLabelText('নাম'),{target:{value:'ORBIS'}})
  expect(screen.getByLabelText('নাম')).toHaveValue('ORBIS')
  const chart=screen.getByRole('group',{name:'১২ ঘরের কুণ্ডলী — গণনা বাকি'})
  expect(within(chart).getAllByRole('button')).toHaveLength(12)
  fireEvent.click(within(chart).getByRole('button',{name:'ঘর ৩'}))
  expect(screen.getByText('ঘর ৩: গ্রহের অবস্থান এখনও গণনা করা হয়নি।')).toBeInTheDocument()
  expect(screen.queryByRole('button',{name:'সম্পূর্ণ বিশ্লেষণ দেখুন'})).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'সংরক্ষণ ও কুণ্ডলী গণনা করুন'}))
  expect(await screen.findByText('গণনা করা যায়নি। জন্মসময় ও স্থান যাচাই করুন; সমর্থিত বছর ১৯০০–২১০০ এবং অক্ষাংশ ±৬৬°-এর ভিতরে।')).toBeInTheDocument()
  expect(screen.getByRole('group',{name:'১২ ঘরের কুণ্ডলী — গণনা বাকি'})).toBeInTheDocument()
  expect(screen.getByText('ঘর ৩: গ্রহের অবস্থান এখনও গণনা করা হয়নি।')).toBeInTheDocument()
})
it('keeps dictation manual, restarts after a service end and stops without submitting',()=>{
  let starts=0,stops=0,aborts=0
  const sessions:FakeSpeech[]=[]
  class FakeSpeech {
    continuous=false;interimResults=false;lang=''
    onresult:((event:{results:{isFinal:boolean;0:{transcript:string}}[];resultIndex:number})=>void)|null=null
    onend:(()=>void)|null=null
    onerror:((event:{error:string})=>void)|null=null
    constructor(){sessions.push(this)}
    start(){starts++} stop(){stops++} abort(){aborts++}
  }
  vi.stubGlobal('SpeechRecognition',FakeSpeech)
  const view=render(<ChatComposer/>)
  fireEvent.click(screen.getByRole('button',{name:'মাইক চালু করুন'}))
  expect(sessions[0].continuous).toBe(true)
  expect(sessions[0].interimResults).toBe(false)
  expect(sessions[0].lang).toBe('bn-IN')
  act(()=>sessions[0].onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'স্বপ্ন দেখলাম'}}]}))
  expect(screen.getByRole('textbox')).toHaveValue('স্বপ্ন দেখলাম')
  act(()=>sessions[0].onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'স্বপ্ন দেখলাম'}}]}))
  expect(screen.getByRole('textbox')).toHaveValue('স্বপ্ন দেখলাম')
  act(()=>sessions[0].onend?.())
  expect(starts).toBe(2)
  expect(sessions).toHaveLength(2)
  act(()=>sessions[1].onresult?.({resultIndex:0,results:[{isFinal:false,0:{transcript:'তারপর'}}]}))
  expect(screen.getByRole('textbox')).toHaveValue('স্বপ্ন দেখলাম তারপর')
  act(()=>sessions[0].onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'পুরোনো ফল'}}]}))
  expect(screen.getByRole('textbox')).toHaveValue('স্বপ্ন দেখলাম তারপর')
  fireEvent.click(screen.getByRole('button',{name:'কথা বলা শেষ — Stop'}))
  act(()=>sessions[1].onend?.())
  expect(stops).toBe(1);expect(starts).toBe(2)
  expect(screen.getByRole('button',{name:'পাঠান'})).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'সংশোধিত স্বপ্ন'}})
  expect(screen.getByRole('textbox')).toHaveValue('সংশোধিত স্বপ্ন')
  view.unmount();expect(aborts).toBe(1)
})
it('offers copy and mutually exclusive feedback only on actual supplied assistant messages',async()=>{
  const writeText=vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}})
  render(<ChatComposer messages={[{id:'answer',role:'assistant',text:'Existing response supplied by caller'}]}/>)
  fireEvent.click(screen.getByRole('button',{name:'ভালো লেগেছে'}))
  fireEvent.click(screen.getByRole('button',{name:'ভালো লাগেনি'}))
  expect(screen.getByRole('button',{name:'ভালো লেগেছে'})).toHaveAttribute('aria-pressed','false')
  expect(screen.getByRole('button',{name:'ভালো লাগেনি'})).toHaveAttribute('aria-pressed','true')
  fireEvent.click(screen.getByRole('button',{name:'কপি করুন'}))
  expect(await screen.findByText('কপি হয়েছে')).toBeInTheDocument()
  expect(writeText).toHaveBeenCalledWith('Existing response supplied by caller')
})
