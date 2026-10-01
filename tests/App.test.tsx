import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { setLocale } from '../src/i18n'
import RouteBoundary from '../src/RouteBoundary'
import ScreenState from '../src/ScreenState'

function openRoute(path: string) {
  act(() => {
    window.history.replaceState(null, '', `/#${path}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

beforeEach(() => { setLocale('bn'); window.history.replaceState(null, '', '/') })
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Maya application navigation', () => {
  it('preserves the Astral home and exposes functional entry links', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /আপনার অন্তর্জগতের/ })).toBeInTheDocument()
    const experiences = screen.getByRole('region', { name: 'Maya experiences' })
    expect(within(experiences).getAllByRole('link').map((link) => link.getAttribute('href')))
      .toEqual(['#/dream', '#/chat'])
    expect(screen.getByText(/Mystical interpretation/)).toBeInTheDocument()
    expect(document.title).toBe('ORBIS Maya · Home')
    expect(screen.getByRole('main')).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'মূল অংশে যান' }))
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it.each([
    ['/dream', 'Dream Analysis', 'স্বপ্ন'],
    ['/astro', 'Birth Chart / Astro', 'জন্মছক'],
    ['/chat', 'Ask Maya', 'মায়া'],
    ['/history', 'Local History', 'ইতিহাস'],
    ['/settings', 'Settings', 'সেটিংস'],
  ])('supports direct entry, active navigation and returning home: %s', async (path, title, label) => {
    openRoute(path)
    render(<App />)
    expect(await screen.findByRole('heading', { name: path === '/settings' ? title : 'ORBIS account', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('মেনু'))
    const nav = screen.getByRole('navigation', { name: 'প্রধান navigation' })
    expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
    expect(document.title).toBe(`ORBIS Maya · ${title}`)
    expect(screen.getByText(path === '/settings' ? 'শীঘ্রই আসছে' : 'অ্যাকাউন্ট পরিষেবা এখনও কনফিগার করা হয়নি। পরে আবার চেষ্টা করুন।')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'হোমে ফিরুন' })[0]).toHaveAttribute('href', '#/')
    openRoute('/')
    expect(screen.getByRole('heading', { name: /আপনার অন্তর্জগতের/ })).toBeInTheDocument()
  })

  it('updates the mounted application on location changes and handles unknown routes', async () => {
    render(<App />)
    openRoute('/dream')
    expect(await screen.findByRole('heading', { name: 'ORBIS account', level: 1 })).toBeInTheDocument()
    openRoute('/missing')
    expect(screen.getByRole('status')).toHaveTextContent('পৃষ্ঠাটি পাওয়া যায়নি')
    expect(document.title).toBe('ORBIS Maya · পৃষ্ঠাটি পাওয়া যায়নি')
    fireEvent.click(screen.getByLabelText('মেনু'))
    expect(screen.getByRole('navigation').querySelector('[aria-current]')).toBeNull()
    openRoute('/')
    expect(screen.getByRole('main')).toHaveFocus()
  })
})

describe('Compact menu', () => {
  it('opens all six destinations and closes on same-route selection', () => {
    render(<App />)
    const toggle = screen.getByLabelText('মেনু')
    const menu = toggle.closest('details')!
    expect(menu.open).toBe(false)
    fireEvent.click(toggle)
    expect(menu.open).toBe(true)
    const nav = screen.getByRole('navigation')
    expect(within(nav).getAllByRole('link')).toHaveLength(7)
    fireEvent.click(within(nav).getByRole('link', { name: 'হোম' }))
    expect(menu.open).toBe(false)
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('keeps the menu open for ordinary keys and closes it with Escape', () => {
    render(<App />)
    const toggle = screen.getByLabelText('মেনু')
    const menu = toggle.closest('details')!
    fireEvent.click(toggle)
    fireEvent.keyDown(toggle, { key: 'ArrowDown' })
    expect(menu.open).toBe(true)
    fireEvent.keyDown(toggle, { key: 'Escape' })
    expect(menu.open).toBe(false)
    expect(toggle).toHaveFocus()
    fireEvent.click(toggle)
    const link = within(screen.getByRole('navigation')).getAllByRole('link')[0]
    fireEvent.keyDown(link, { key: 'Escape' })
    expect(menu.open).toBe(false)
    expect(toggle).toHaveFocus()
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
