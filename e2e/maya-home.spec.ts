import { expect, test } from '@playwright/test'
test('all six design cards, three themes and browser navigation work on mobile',async({page})=>{
  await page.goto('/?maya-design=1#/')
  const grid=page.getByRole('region',{name:'Maya experiences'})
  await expect(grid.getByRole('link')).toHaveCount(6)
  for(const path of ['/dream','/astro','/chat','/history','/today','/settings']){
    await grid.locator(`a[href="#${path}"]`).click()
    await expect(page.getByRole('navigation',{name:'Maya bottom navigation'})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.goBack();await expect(grid).toBeVisible()
  }
  await page.goto('/?maya-design=1#/settings')
  for(const [name,theme] of [['Astral Blue','astral-blue'],['Astral Gold','astral-gold'],['Plain Light','plain-light']]){
    await page.getByRole('button',{name,exact:true}).click()
    await expect(page.locator('.maya-shell')).toHaveClass(new RegExp(`theme-${theme}`))
    await page.reload();await expect(page.locator('.maya-shell')).toHaveClass(new RegExp(`theme-${theme}`))
  }
})
test('Home stays 2×3 and its navigation fits supported portrait phone sizes',async({page})=>{
  for(const size of [{width:320,height:740},{width:390,height:780},{width:412,height:915}]){
    await page.setViewportSize(size);await page.goto('/?maya-design=1#/')
    const cards=page.locator('.dashboard-card');await expect(cards).toHaveCount(6)
    const boxes=await cards.evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y}}))
    expect(boxes[0].y).toBe(boxes[1].y);expect(boxes[2].y).toBe(boxes[3].y);expect(boxes[4].y).toBe(boxes[5].y)
    expect(boxes[1].x).toBeGreaterThan(boxes[0].x)
    await expect(page.getByRole('navigation',{name:'Maya bottom navigation'})).toBeInViewport()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  }
})
test('normal Dream still requires login, not a design-only bypass',async({page})=>{
  await page.goto('/#/dream');await expect(page.getByRole('heading',{name:'ORBIS account',level:1})).toBeVisible()
  await page.goto('/#/unknown');await expect(page.getByRole('status')).toContainText('পৃষ্ঠাটি পাওয়া যায়নি')
})


test('Orbis Astro welcome and account fit mobile without product navigation',async({page})=>{
  for(const size of [{width:320,height:740},{width:390,height:780},{width:412,height:915}]){
    await page.setViewportSize(size);await page.goto('/#/welcome')
    await expect(page.getByRole('heading',{name:'অর্বিস অ্যাস্ট্রো'})).toBeVisible()
    await expect(page.getByText('Ask Maya',{exact:true})).toBeVisible()
    await expect(page.getByRole('navigation')).toHaveCount(0)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.goto('/#/account')
    await expect(page.locator('.entry-brand img')).toHaveAttribute('src','/brand/orbis-maya.png')
    await expect(page.getByRole('navigation')).toHaveCount(0)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  }
})
