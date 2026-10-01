import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { readLocale, setLocale, text } from '../src/i18n'
import LanguagePicker from '../src/LanguagePicker'
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); setLocale('bn') })
it('defaults to Bengali and ignores invalid stored languages', () => {
  localStorage.clear(); expect(readLocale()).toBe('bn')
  localStorage.setItem('orbis-maya-language-v1', 'unsupported'); expect(readLocale()).toBe('bn')
})
it('persists and displays all three languages, including external storage updates', () => {
  render(<LanguagePicker />)
  const picker = screen.getByRole('combobox')
  for (const [language, label] of [['en', 'Language'], ['hi', 'भाषा'], ['bn', 'ভাষা']]) {
    fireEvent.change(picker, { target: { value: language } })
    expect(readLocale()).toBe(language)
    expect(screen.getByLabelText(label)).toHaveValue(language)
  }
  localStorage.setItem('orbis-maya-language-v1', 'hi')
  fireEvent(window, new StorageEvent('storage'))
  expect(picker).toHaveValue('hi')
  expect(text('en', 'privacy')).toContain('not scientific certainty')
})
it('keeps language selection usable when storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  setLocale('hi'); expect(readLocale()).toBe('hi')
})
