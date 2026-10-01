import { expect, test } from '@playwright/test'

test('Maya home is usable on a mobile viewport', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: /আপনার অন্তর্জগতের/i,
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('heading', {
      name: 'Dream Analysis',
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('heading', {
      name: 'Birth Chart / Astro',
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('heading', {
      name: 'Ask Maya',
    }),
  ).toBeVisible()

  await expect(
    page.getByRole('button'),
  ).toHaveCount(3)
})
