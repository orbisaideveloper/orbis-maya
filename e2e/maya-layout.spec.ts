import {expect,test} from '@playwright/test'
for(const height of [620,780]){
 test(`keeps header and navigation inside a ${height}px mobile viewport`,async({page})=>{
  await page.setViewportSize({width:360,height});await page.goto('/?maya-design=1#/');
  const top=page.locator('.dashboard-topbar'),nav=page.locator('.dashboard-bottom-nav');await expect(top).toBeVisible();await expect(page.locator('.dashboard-card')).toHaveCount(6);
  for(const target of [top,nav]){const box=await target.boundingBox();expect(box).not.toBeNull();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(height+1)}
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+1)).toBe(true);
  await page.goto('/?maya-design=1#/astro');await expect(page.locator('.crystal-header')).toBeVisible();await page.locator('#maya-content').evaluate(el=>{el.scrollTop=el.scrollHeight});
  for(const target of [page.locator('.crystal-header'),nav]){const box=await target.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(height+1)}
 })
}

for(const width of [320,360,393,412,720]){
 test(`centers the complete home frame at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:780});await page.goto('/?maya-design=1#/');
  await expect(page.locator('.dashboard-card')).toHaveCount(6);
  for(const selector of ['.maya-shell','.dashboard-topbar','.dashboard-insight','.dashboard-grid','.dashboard-bottom-nav']){
   const box=await page.locator(selector).boundingBox();expect(box).not.toBeNull();
   expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);
   expect(Math.abs(box!.x-(width-box!.x-box!.width))).toBeLessThanOrEqual(2);
  }
  for(const card of await page.locator('.dashboard-card').all()){
   const box=await card.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 })
}
