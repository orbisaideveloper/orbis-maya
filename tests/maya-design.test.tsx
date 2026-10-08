import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'
import { setLocale } from '../src/i18n'
import { readTheme, setTheme } from '../src/design/theme'
import Workspace from '../src/design/Workspace'
beforeEach(()=>{localStorage.clear();setLocale('bn');setTheme('astral-blue');window.history.replaceState(null,'','/?maya-design=1#/')})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllEnvs()})
function route(path:string){act(()=>{window.history.replaceState(null,'',`/?maya-design=1#${path}`);window.dispatchEvent(new HashChangeEvent('hashchange'))})}
it('keeps the same six functional route links in every theme and never invents an insight',()=>{
  const view=render(<App/>)
  for(const theme of ['astral-blue','astral-gold','plain-light'] as const){
    act(()=>setTheme(theme))
    const grid=screen.getByRole('region',{name:'Maya experiences'})
    expect(within(grid).getAllByRole('link').map(link=>link.getAttribute('href'))).toEqual(['#/dream','#/astro','#/chat','#/history','#/today','#/settings'])
    expect(screen.getByRole('heading',{name:'ইনসাইটের অপেক্ষায়'})).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'সম্পূর্ণ বিশ্লেষণ দেখুন'})).toBeDisabled()
    expect(view.container.firstChild).toHaveClass(`theme-${theme}`)
  }
})
it('opens every design card screen, with persistent navigation and disabled unconnected actions',()=>{
  render(<App/>)
  for(const [path,title] of [['/dream','স্বপ্ন বিশ্লেষণ'],['/astro','জ্যোতিষ নির্দেশনা'],['/chat','Ask Maya'],['/history','সংরক্ষিত ইনসাইট'],['/today','আজকের শুভ নির্দেশ'],['/settings','সেটিংস']]){
    route(path)
    expect(screen.getByRole('heading',{name:title,level:1})).toBeInTheDocument()
    expect(screen.getByRole('navigation',{name:'Maya bottom navigation'})).toBeInTheDocument()
  }
  fireEvent.click(screen.getByRole('button',{name:'Astral Gold'}))
  expect(readTheme()).toBe('astral-gold')
  fireEvent.click(screen.getByRole('button',{name:'Plain Light'}))
  expect(readTheme()).toBe('plain-light')
  fireEvent.change(screen.getByRole('combobox'),{target:{value:'hi'}})
  expect(document.documentElement.lang).toBe('hi')
  expect(screen.getByRole('heading',{name:'सेटिंग्स'})).toBeInTheDocument()
})
it('restores theme across remount and handles storage updates and blocked storage',()=>{
  act(()=>setTheme('plain-light'))
  const first=render(<App/>);first.unmount();render(<App/>)
  expect(document.documentElement.dataset.theme).toBe('plain-light')
  localStorage.setItem('orbis-maya-theme-v1','astral-gold')
  fireEvent(window,new StorageEvent('storage'))
  expect(document.documentElement.dataset.theme).toBe('astral-gold')
  localStorage.setItem('orbis-maya-theme-v1','unsupported')
  expect(readTheme()).toBe('plain-light')
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked')})
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')})
  act(()=>setTheme('astral-blue'));expect(readTheme()).toBe('astral-blue')
})
it('never treats missing, same-origin or unsafe release URLs as a publication',()=>{
  for(const url of ['',window.location.origin,'http://public.invalid','javascript:alert(1)','bad-url']){
    vi.stubEnv('VITE_MAYA_PUBLISHED_URL',url);vi.stubEnv('VITE_MAYA_PUBLISHED_REVISION','approved')
    const view=render(<Workspace/>);fireEvent.click(screen.getByRole('button',{name:'Published view'}))
    expect(screen.getByText('এখনও কোনও প্রকাশিত সংস্করণ সংযুক্ত নেই।')).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Publish',exact:true})).toBeDisabled()
    expect(screen.queryByTitle('Published view')).not.toBeInTheDocument();view.unmount()
  }
})
it('keeps a configured Published frame on its distinct origin and never enables Publish',()=>{
  vi.stubEnv('VITE_MAYA_PUBLISHED_URL','https://public.invalid/')
  vi.stubEnv('VITE_MAYA_PUBLISHED_REVISION','approved-sha')
  render(<Workspace/>);fireEvent.click(screen.getByRole('button',{name:'Published view'}))
  expect(screen.getByTitle('Published view')).toHaveAttribute('src','https://public.invalid/')
  expect(screen.getByRole('button',{name:'Publish',exact:true})).toBeDisabled()
  fireEvent.click(screen.getByRole('button',{name:'Development view'}))
  expect(screen.getByTitle('Development view')).toHaveAttribute('src','/?maya-design=1#/')
})
