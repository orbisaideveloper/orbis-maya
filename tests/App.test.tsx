import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

describe('Maya home shell', () => {
  it('renders the approved initial Maya experiences', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: /আপনার অন্তর্জগতের/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Dream Analysis',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Birth Chart / Astro',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Ask Maya',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(/Mystical interpretation/i),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'স্বপ্ন বিশ্লেষণ',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Astro শুরু করুন',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Maya-কে জিজ্ঞেস করুন',
      }),
    ).toBeInTheDocument()
  })
})
