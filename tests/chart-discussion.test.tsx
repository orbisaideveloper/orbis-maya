import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import ChatScreen from '../src/ChatScreen'
import {setLocale} from '../src/i18n'
import {calculateChart} from '../src/astro/calculate'
import {saveChart} from '../src/astro/savedChart'
const request=vi.hoisted(()=>vi.fn())
vi.mock('../src/ai/gateway',async original=>({...await original<typeof import('../src/ai/gateway')>(),createMayaGateway:()=>({configured:true,request})}))
const profile={name:'Owner',birthDate:'1986-05-10',birthTime:'00:05',birthPlace:'Krishnanagar',birthLocation:{label:'Krishnanagar',latitude:23.40576,longitude:88.49073,timezone:'Asia/Kolkata'}}
beforeEach(()=>{setLocale('bn');localStorage.clear();request.mockReset().mockResolvedValue({reply:'প্রথম ঘরের আলোচনা'})})
afterEach(()=>{cleanup();localStorage.clear()})
function ask(value:string){fireEvent.change(screen.getByRole('textbox'),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'পাঠান'}))}
it('keeps an empty chat and attaches only active-account calculated facts on explicit Send',async()=>{
 localStorage.setItem('orbis-maya-profile-v1:user%3Aalice',JSON.stringify(profile))
 saveChart('user:alice','self',profile,calculateChart(profile.birthDate,profile.birthTime,profile.birthLocation))
 render(<ChatScreen userId="alice"/>)
 expect(screen.queryByText('ঘর ধরে আলোচনা')).toBeNull();expect(request).not.toHaveBeenCalled()
 ask('আমার প্রথম ঘরের অধিপতি কে?');await screen.findByText('প্রথম ঘরের আলোচনা')
 const body=request.mock.calls[0][0];expect(body.capability).toBe('astro.interpretation');expect(body.input.chart.planets).toHaveLength(9);expect(body.input.chart.ascendant).toBeGreaterThan(270)
 expect(body.input).not.toHaveProperty('name');expect(body.input.chart).not.toHaveProperty('validation')
 request.mockResolvedValue({reply:'পরের প্রশ্নের উত্তর'});ask('অধিপতি কোথায় আছে?');await screen.findByText('পরের প্রশ্নের উত্তর')
 expect(request.mock.calls[1][0].input.messages).toHaveLength(3)
})
it('never reads another account chart',async()=>{
 localStorage.setItem('orbis-maya-profile-v1:user%3Aalice',JSON.stringify(profile));render(<ChatScreen userId="bob"/>)
 ask('hello');await screen.findByText('প্রথম ঘরের আলোচনা');expect(request.mock.calls[0][0].capability).toBe('general.chat');expect(request.mock.calls[0][0].input).not.toHaveProperty('chart')
})
