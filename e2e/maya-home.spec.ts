import { expect, test } from '@playwright/test'

const screens = [
  { path: '/dream', title: 'Dream Analysis', label: 'স্বপ্ন' },
  { path: '/astro', title: 'Birth Chart / Astro', label: 'জন্মছক' },
  { path: '/chat', title: 'Ask Maya', label: 'মায়া' },
  { path: '/history', title: 'Local History', label: 'ইতিহাস' },
  { path: '/settings', title: 'Settings', label: 'সেটিংস' },
]

test('Astral entry links, mobile navigation and browser history work', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /আপনার অন্তর্জগতের/ })).toBeVisible()
  await page.getByRole('link', { name: 'স্বপ্ন বিশ্লেষণ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ORBIS account', level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: /আপনার অন্তর্জগতের/ })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'ORBIS account', level: 1 })).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'প্রধান navigation' })
  for (const screen of screens) {
    await page.getByLabel('মেনু', { exact: true }).click()
    await nav.getByRole('link', { name: screen.label, exact: true }).click()
    await expect(page.getByRole('heading', { name: screen.path === '/settings' ? screen.title : 'ORBIS account', level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeFocused()
    await page.getByLabel('মেনু', { exact: true }).click()
    await expect(nav.getByRole('link', { name: screen.label, exact: true })).toHaveAttribute('aria-current', 'page')
    await page.keyboard.press('Escape')
    await expect(page.getByLabel('মেনু', { exact: true })).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('every secondary screen supports direct entry and reload', async ({ page }) => {
  for (const screen of screens) {
    await page.goto(`/#${screen.path}`)
    await page.reload()
    await expect(page.getByRole('heading', { name: screen.path === '/settings' ? screen.title : 'ORBIS account', level: 1 })).toBeVisible()
    await page.getByRole('link', { name: 'হোমে ফিরুন' }).first().click()
    await expect(page.getByRole('heading', { name: /আপনার অন্তর্জগতের/ })).toBeVisible()
  }
})

test('unknown route recovers and compact menu fits a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#/unknown')
  await expect(page.getByRole('status')).toContainText('পৃষ্ঠাটি পাওয়া যায়নি')
  await page.getByRole('link', { name: 'হোমে ফিরুন' }).first().click()
  await expect(page.getByRole('heading', { name: /আপনার অন্তর্জগতের/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
  await page.getByLabel('মেনু', { exact: true }).click()
  const nav = page.getByRole('navigation')
  for (const link of await nav.getByRole('link').all()) {
    await expect(link).toBeInViewport()
    const box = await link.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'মূল অংশে যান' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})
