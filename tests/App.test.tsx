import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { setLocale } from '../src/i18n'
import RouteBoundary from '../src/RouteBoundary'
import ScreenState from '../src/ScreenState'
beforeEach(()=>{setLocale('bn');window.history.replaceState(null,'','/?maya-design=1')})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
function openRoute(path:string){act(()=>{window.history.replaceState(null,'',`/#${path}`);window.dispatchEvent(new HashChangeEvent('hashchange'))})}
describe('Approved Maya navigation',()=>{
  it('keeps six Home links, empty insight, main focus and persistent bottom navigation',()=>{
    render(<App/>);expect(screen.getByRole('heading',{name:'অর্বিস অ্যাস্ট্রো'})).toBeInTheDocument()
    expect(within(screen.getByRole('region',{name:'Maya experiences'})).getAllByRole('link')).toHaveLength(6)
    expect(screen.getByRole('navigation',{name:'Maya bottom navigation'})).toBeInTheDocument()
    expect(document.title).toBe('Orbis Astro · Home')
    fireEvent.click(screen.getByRole('button',{name:'মূল অংশে যান'}));expect(screen.getByRole('main')).toHaveFocus()
  })
  it.each(['/dream','/astro','/chat','/history'])('preserves authentication for the normal private route %s',async path=>{
    openRoute(path);render(<App/>);expect(await screen.findByRole('heading',{name:'ORBIS account',level:1})).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    openRoute('/');expect(screen.getByRole('heading',{name:'অর্বিস অ্যাস্ট্রো'})).toBeInTheDocument()
  })
  it('uses a notification link in the header and contains unknown routes',()=>{
    openRoute('/notifications');render(<App/>)
    expect(screen.getByRole('link',{name:'নোটিফিকেশন'})).toHaveAttribute('href','#/notifications')
    expect(screen.queryByLabelText('মেনু')).not.toBeInTheDocument()
    openRoute('/missing');expect(screen.getByRole('status')).toHaveTextContent('পৃষ্ঠাটি পাওয়া যায়নি')
  })
})
describe('Recoverable screen states' , () => {
  it('announces loading without offering a premature recovery action', () => {
    render(<ScreenState kind="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('খোলা হচ্ছে')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('contains a render failure without removing the surrounding application', () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenScreen(): never { throw new Error('test screen failure') }
    render(<div><p>navigation remains</p><RouteBoundary><BrokenScreen /></RouteBoundary></div>)
    expect(screen.getByRole('alert')).toHaveTextContent('পৃষ্ঠাটি খোলা যায়নি')
    expect(screen.getByText('navigation remains')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'হোমে ফিরুন' })[0]).toHaveAttribute('href', '#/')
    expect(errorLog).toHaveBeenCalled()
  })

  it('allows a fresh route boundary to recover after a failed screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenScreen(): never { throw new Error('test recovery') }
    const view = render(<RouteBoundary key="broken"><BrokenScreen /></RouteBoundary>)
    view.rerender(<RouteBoundary key="home"><p>Recovered home</p></RouteBoundary>)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Recovered home')).toBeInTheDocument()
  })
})
