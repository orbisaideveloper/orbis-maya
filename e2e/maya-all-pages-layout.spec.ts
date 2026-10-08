import {expect,test} from '@playwright/test'
for(const width of [360,393,412]){
 test(`all Maya pages fit and center at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:780});
  for(const route of ['/','/astro','/dream','/chat','/history','/today','/settings','/profile','/notifications','/account','/welcome']){
   await page.goto(`/?maya-design=1#${route}`);await expect(page.locator('.maya-shell')).toBeVisible();
   if(route==='/')await expect(page.locator('.dashboard-card')).toHaveCount(6);
   if(['/astro','/dream','/chat','/history','/profile'].includes(route))await expect(page.locator('.maya-shell.entry-shell')).toHaveCount(0);
   if(['/chat','/dream'].includes(route))await expect(page.locator('.chat-panel textarea')).toBeVisible();
   const dimensions=await page.locator('.maya-shell').evaluate(el=>{const shell=el.getBoundingClientRect(),style=getComputedStyle(el);const main=el.querySelector('#maya-content')!.getBoundingClientRect();return {left:shell.left,right:shell.right,width:shell.width,viewport:innerWidth,paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight),mainLeft:main.left,mainRight:main.right,sizing:style.boxSizing}});
   expect(dimensions.sizing,route).toBe('border-box');expect(dimensions.left,route).toBeGreaterThanOrEqual(-1);expect(dimensions.right,route).toBeLessThanOrEqual(width+1);
   expect(Math.abs(dimensions.left-(width-dimensions.right)),route).toBeLessThanOrEqual(2);
   expect(Math.abs(dimensions.paddingLeft-dimensions.paddingRight),route).toBeLessThanOrEqual(1);
   expect(dimensions.mainLeft,route).toBeGreaterThanOrEqual(dimensions.left+dimensions.paddingLeft-1);expect(dimensions.mainRight,route).toBeLessThanOrEqual(dimensions.right-dimensions.paddingRight+1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBe(true);
   const nav=page.locator('.dashboard-bottom-nav');if(await nav.count()){const box=await nav.boundingBox();expect(Math.abs(box!.x-(width-box!.x-box!.width)),route).toBeLessThanOrEqual(2)}
  }
 })
}
