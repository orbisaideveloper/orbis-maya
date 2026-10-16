import { expect, test } from '@playwright/test'

// Central responses are browser fixtures; this suite never signs into live Admin.
const orbisCustomer = { orbisIdentityId: '11111111-1111-7111-8111-111111111111', displayId: 'ORB-U-23456789' }
test.beforeEach(async ({ page }) => {
  let commonProfile = { name: 'Sample customer', address: null as string | null, alternatePhone: null as string | null, dateOfBirth: null as string | null, gender: null as string | null }
  let revision = 0
  const profiles = new Map<number, { slot: number; relation: string; profile: Record<string, unknown> }>()
  await page.route('https://orbis-admin-staging.onrender.com/api/v1/customer/**', route => {
    const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4174', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Cache-Control': 'no-store' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers, body: '' })
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/profile')) {
      if (route.request().method() === 'POST') commonProfile = route.request().postDataJSON()
      return route.fulfill({ headers, json: { version: 'orbis.customer.profile.v1', customer: orbisCustomer, profile: commonProfile, contact: { email: 'maya@example.com', phone: null } } })
    }
    if (path.endsWith('/maya/profiles')) {
      if (route.request().method() === 'POST') {
        const { expectedRevision, ...entry } = route.request().postDataJSON()
        if (expectedRevision !== revision) return route.fulfill({ status: 409, headers, json: { error: 'MAYA_PROFILE_CONFLICT' } })
        profiles.set(entry.slot, entry); revision++
      }
      return route.fulfill({ headers, json: { version: 'orbis.maya.profiles.v1', customer: orbisCustomer, revision, profiles: [...profiles.values()] } })
    }
    if (path !== '/api/v1/customer/session') return route.abort()
    expect(route.request().headers().authorization).toMatch(/^Bearer /)
    return route.fulfill({ headers, json: { version: 'orbis.customer.v1', customer: orbisCustomer } })
  })
})

const user = { id: '12345678-1234-4234-8234-123456789abc', aud: 'authenticated', role: 'authenticated', email: 'maya@example.com', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-01-01T00:00:00Z' }
function session() {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  return { access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }
}

test('mobile login, verified restoration, protected routes and device logout', async ({ page }) => {
  let failLogin = true
  await page.route('https://maya-auth.invalid/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/token')) {
      if (failLogin) return route.fulfill({ status: 400, json: { error_code: 'invalid_credentials', msg: 'Invalid credentials' } })
      return route.fulfill({ json: session() })
    }
    if (url.pathname.endsWith('/user')) return route.fulfill({ json: user })
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, body: '' })
    return route.abort()
  })
  await page.goto('/#/dream')
  await expect(page.getByLabel('ইমেইল', { exact: true })).toBeVisible()
  await expect(page.getByText('শীঘ্রই আসছে')).toHaveCount(0)
  await page.getByLabel('ইমেইল', { exact: true }).fill(user.email)
  await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('private-password')
  await page.getByRole('button', { name: 'লগইন', exact: true }).last().click()
  await expect(page.getByRole('alert')).toBeVisible()
  failLogin = false
  await page.getByLabel('ইমেইল', { exact: true }).fill(user.email)
  await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('private-password')
  await page.getByRole('button', { name: 'লগইন', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Dream Analysis', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dream Analysis', exact: true })).toBeVisible()
  await page.goto('/#/settings')
  await expect(page.locator('.settings-account').getByText(user.email, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'সাইন আউট', exact: true }).click()
  await page.goto('/#/history')
  await expect(page.getByLabel('পাসওয়ার্ড', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('orbis-maya-auth-v1'))).toBeNull()
})

test('signup confirmation and three language settings do not call Accounting', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.route('https://maya-auth.invalid/**', async (route) => {
    if (route.request().url().includes('/signup')) return route.fulfill({ json: { ...user, identities: [] } })
    return route.abort()
  })
  await page.goto('/#/account')
  await page.getByRole('button', { name: 'অ্যাকাউন্ট তৈরি করুন', exact: true }).click()
  await page.getByLabel('নাম', { exact: true }).fill('Maya User')
  await page.getByLabel('ইমেইল', { exact: true }).fill(user.email)
  await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('private-password')
  await page.getByLabel('পাসওয়ার্ড আবার লিখুন', { exact: true }).fill('private-password')
  await page.getByRole('button', { name: 'অ্যাকাউন্ট তৈরি করুন', exact: true }).last().click()
  await expect(page.getByRole('status')).toContainText('confirmation')
  await page.goto('/#/settings')
  await page.getByRole('combobox').selectOption('hi')
  await expect(page.locator('.header-brand small')).toBeVisible()
  await page.reload()
  await expect(page.locator('.header-brand small')).toBeVisible()
  await page.getByRole('combobox').selectOption('en')
  await expect(page.locator('.header-brand small')).toBeVisible()
  expect(requests.some((url) => url.includes('/api/accounting') || url.includes('/organizations'))).toBe(false)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('a stored but rejected identity cannot open private routes', async ({ page }) => {
  await page.addInitScript((value) => localStorage.setItem('orbis-maya-auth-v1', JSON.stringify(value)), session())
  await page.route('https://maya-auth.invalid/**', (route) => route.fulfill({ status: 401, json: { error_code: 'bad_jwt', msg: 'Rejected session' } }))
  await page.goto('/#/chat')
  await expect(page.getByLabel('পাসওয়ার্ড', { exact: true })).toBeVisible()
  await expect(page.getByText('শীঘ্রই আসছে')).toHaveCount(0)
})

test('mobile local history survives reload, confirms deletion and preserves another account', async ({ page }) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('orbis-maya-auth-v1')) localStorage.setItem('orbis-maya-auth-v1', JSON.stringify(value))
  }, session())
  await page.route('https://maya-auth.invalid/**', (route) => {
    if (route.request().url().endsWith('/user')) return route.fulfill({ json: user })
    if (route.request().url().endsWith('/logout')) return route.fulfill({ status: 204, body: '' })
    return route.abort()
  })
  await page.goto('/')
  await page.evaluate(async (owner) => {
    for (const scope of [owner, 'other-user']) {
      await new Promise<void>((resolve, reject) => {
        const opening = indexedDB.open(`orbis-maya-history-${scope}`, 1)
        opening.onupgradeneeded = () => {
          const store = opening.result.createObjectStore('entries', { keyPath: ['kind', 'id'] })
          store.createIndex('kindCreatedAt', ['kind', 'createdAt'])
        }
        opening.onerror = () => reject(opening.error)
        opening.onsuccess = () => {
          const db = opening.result
          const transaction = db.transaction('entries', 'readwrite')
          for (const kind of ['dream', 'astro', 'chat']) transaction.objectStore('entries').put({ id: kind, kind, createdAt: Date.now(), title: `${kind} record`, content: `Private ${kind} reflection` })
          transaction.oncomplete = () => { db.close(); resolve() }
          transaction.onabort = () => { db.close(); reject(transaction.error) }
        }
      })
    }
  }, user.id)
  await page.goto('/#/history')
  await expect(page.getByText('dream record', { exact: true })).toBeVisible()
  await page.getByText('dream record', { exact: true }).click()
  await expect(page.getByText('Private dream reflection', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('dream record', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'মুছুন dream record', exact: true }).click()
  await page.getByRole('button', { name: 'বাতিল', exact: true }).click()
  await expect(page.getByText('dream record', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'মুছুন dream record', exact: true }).click()
  await page.getByRole('button', { name: 'মুছে দিন', exact: true }).click()
  await expect(page.getByText('dream record', { exact: true })).toHaveCount(0)
  await expect(page.getByText('chat record', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'সব history মুছুন', exact: true }).click()
  await page.getByRole('button', { name: 'মুছে দিন', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('এখনও কোনো history নেই')
  const otherCount = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const opening = indexedDB.open('orbis-maya-history-other-user', 1)
    opening.onerror = () => reject(opening.error)
    opening.onsuccess = () => {
      const db = opening.result
      const transaction = db.transaction('entries', 'readonly')
      const count = transaction.objectStore('entries').count()
      transaction.oncomplete = () => { db.close(); resolve(count.result) }
      transaction.onabort = () => { db.close(); reject(transaction.error) }
    }
  }))
  expect(otherCount).toBe(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('mobile Dream draft saves locally, restores after reload and discards with confirmation', async ({ page }) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('orbis-maya-auth-v1')) localStorage.setItem('orbis-maya-auth-v1', JSON.stringify(value))
  }, session())
  await page.route('https://maya-auth.invalid/**', (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/user')) return route.fulfill({ json: user })
    return route.abort()
  })
  await page.goto('/#/dream')
  const dream = page.getByRole('textbox', { name: 'স্বপ্ন বা সম্পাদিত voice transcript', exact: true })
  await expect(dream).toBeEnabled()
  await dream.fill('আমি স্বপ্নে শান্ত নদী দেখেছি।')
  await page.locator('.dream-extra > summary').click()
  await expect(page.locator('.dream-extra')).toHaveAttribute('open', '')
  await page.getByLabel('শিরোনাম (ঐচ্ছিক)', { exact: true }).fill('নদী')
  await page.getByRole('button', { name: 'Draft রাখুন', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('সংরক্ষিত হয়েছে')
  await page.reload()
  await expect(dream).toHaveValue('আমি স্বপ্নে শান্ত নদী দেখেছি।', { timeout: 15000 })
  const extra = page.locator('.dream-extra')
  if (!(await extra.evaluate((element) => (element as HTMLDetailsElement).open))) await extra.locator('summary').click()
  await expect(extra).toHaveAttribute('open', '')
  await expect(extra.getByRole('textbox', { name: 'শিরোনাম (ঐচ্ছিক)', exact: true })).toHaveValue('নদী')
  await page.getByRole('button', { name: 'লেখা যাচাই করুন', exact: true }).click()
  await expect(page.getByRole('region', { name: 'লেখা যাচাই করুন' })).toContainText('ORBIS Foundation')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Draft মুছুন', exact: true }).click()
  await expect(dream).toHaveValue('আমি স্বপ্নে শান্ত নদী দেখেছি।', { timeout: 15000 })
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Draft মুছুন', exact: true }).click()
  await expect(dream).toHaveValue('')
  await page.reload()
  await expect(dream).toBeEnabled()
  await expect(dream).toHaveValue('')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('mobile Dream gateway retry, structured result, local save, reopen and delete', async ({ page }) => {
  const writing = 'আমি নদীর পাশে আলো দেখেছি।'
  const result = { symbols: ['নদী', 'আলো'], themes: ['পরিবর্তন'], emotions: ['কৌতূহল'], interpretation: '<script>window.private=true</script> সম্ভাব্য ভাবনা', reflectionQuestions: ['আলো আপনার কাছে কী?'] }
  await page.addInitScript((value) => localStorage.setItem('orbis-maya-auth-v1', JSON.stringify(value)), session())
  await page.route('https://maya-auth.invalid/**', (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/user')) return route.fulfill({ json: user })
    return route.abort()
  })
  let calls = 0
  await page.route('https://maya-gateway.invalid/api/maya/request', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' }, body: '' })
    const body = route.request().postDataJSON()
    expect(body).toEqual({ version: 'maya.v1', capability: 'dream.analysis', language: 'bn', input: { dream: writing, title: 'আলোর স্বপ্ন' } })
    expect(route.request().headers().authorization).toMatch(/^Bearer /)
    calls += 1
    await route.fulfill({ status: calls === 1 ? 504 : 200, headers: { 'Access-Control-Allow-Origin': '*' }, json: calls === 1 ? { error: { code: 'MAYA_TIMEOUT' } } : { version: 'maya.v1', success: true, capability: 'dream.analysis', language: 'bn', result } })
  })
  await page.goto('/#/dream')
  const dream = page.getByRole('textbox', { name: 'স্বপ্ন বা সম্পাদিত voice transcript', exact: true })
  await expect(dream).toBeEnabled(); await dream.fill(writing)
  await page.locator('.dream-extra > summary').click()
  await expect(page.locator('.dream-extra')).toHaveAttribute('open', '')
  await page.getByRole('textbox', { name: 'শিরোনাম (ঐচ্ছিক)', exact: true }).fill('আলোর স্বপ্ন')
  await page.getByRole('button', { name: 'লেখা যাচাই করুন', exact: true }).click()
  await page.getByRole('button', { name: 'বিশ্লেষণ শুরু করুন', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('সময় শেষ হয়েছে')
  await expect(dream).toHaveValue(writing)
  await page.getByRole('button', { name: 'বিশ্লেষণ শুরু করুন', exact: true }).click()
  const reflection = page.getByRole('region', { name: 'স্বপ্নের ব্যাখ্যা', exact: true })
  await expect(reflection).toContainText(result.interpretation)
  for (const name of ['প্রতীক','মূল ভাবনা','অনুভূতি','সম্ভাব্য ব্যাখ্যা','নিজেকে করার প্রশ্ন']) await expect(reflection.getByRole('heading', { name, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'ফল এই device-এ রাখুন', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'ফল এই device-এর history-এ সংরক্ষিত হয়েছে' })).toContainText('ফল এই device-এর history-এ সংরক্ষিত হয়েছে')
  expect(calls).toBe(2)
  await page.goto('/#/history'); await page.locator('summary').filter({ hasText: /^আলোর স্বপ্ন$/ }).click()
  await expect(reflection).toContainText(result.interpretation)
  await page.reload(); await page.locator('summary').filter({ hasText: /^আলোর স্বপ্ন$/ }).click()
  await expect(reflection).toContainText(result.interpretation)
  await page.getByRole('button', { name: 'মুছুন আলোর স্বপ্ন', exact: true }).click()
  await page.getByRole('button', { name: 'মুছে দিন', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('এখনও কোনো history নেই')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})


test('canonical Orbis ID appears on mobile account and remains the same after reload', async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem('orbis-maya-auth-v1', JSON.stringify(value)), session())
  await page.route('https://maya-auth.invalid/**', route => {
    if (new URL(route.request().url()).pathname.endsWith('/user')) return route.fulfill({ json: user })
    return route.abort()
  })
  await page.goto('/#/account')
  await expect(page.getByText(orbisCustomer.displayId, { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText(orbisCustomer.displayId, { exact: true })).toBeVisible()
  await page.goto('/#/settings')
  await page.locator('.settings-account').getByRole('link').click()
  await expect(page.getByText(orbisCustomer.displayId, { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})


test('common profile persists without changing the Orbis ID', async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem('orbis-maya-auth-v1', JSON.stringify(value)), session())
  await page.route('https://maya-auth.invalid/**', route => route.request().url().endsWith('/user') ? route.fulfill({ json: user }) : route.abort())
  await page.goto('/#/settings')
  await page.getByRole('combobox').selectOption('en')
  await page.goto('/#/account')
  await expect(page.getByText(orbisCustomer.displayId, { exact: true })).toBeVisible()
  const form = page.getByRole('region', { name: 'Common account profile' })
  await form.getByLabel('Name', { exact: true }).fill('Updated customer')
  await form.getByLabel('Address', { exact: true }).fill('Test address')
  await form.getByRole('button', { name: 'Save profile', exact: true }).click()
  await expect(form.getByText('Profile saved to your central account.')).toBeVisible()
  await page.reload()
  await expect(form.getByLabel('Name', { exact: true })).toHaveValue('Updated customer')
  await expect(form.getByLabel('Address', { exact: true })).toHaveValue('Test address')
  await expect(page.getByText(orbisCustomer.displayId, { exact: true })).toBeVisible()
})

test('five birth slots survive reload and family restore preserves the device profile', async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem('orbis-maya-auth-v1', JSON.stringify(value)), session())
  await page.route('https://maya-auth.invalid/**', route => route.request().url().endsWith('/user') ? route.fulfill({ json: user }) : route.abort())
  await page.goto('/#/settings')
  await page.getByRole('combobox').selectOption('en')
  await page.goto('/#/profile')
  for (let slot = 1; slot <= 5; slot++) {
    await page.getByLabel('Name', { exact: true }).fill(`Family member ${slot}`)
    await page.getByRole('button', { name: 'Save profile', exact: true }).click()
    const target = page.getByRole('region', { name: `Birth profile ${slot}`, exact: true })
    await target.getByRole('button', { name: 'Save selected profile', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(target.getByText(`Family member ${slot}`, { exact: true })).toBeVisible()
  }
  await page.reload()
  for (let slot = 1; slot <= 5; slot++) await expect(page.getByRole('region', { name: `Birth profile ${slot}`, exact: true }).getByText(`Family member ${slot}`, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Restore saved family', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByText('Saved family birth details restored to this device.')).toBeVisible()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Family member 5')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
