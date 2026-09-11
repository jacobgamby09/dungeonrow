import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const req=createRequire(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/JacobGamby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=req('playwright');const browser=await chromium.launch();
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},isMobile:mobile,hasTouch:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const click=async l=>mobile?l.tap():l.click();
  const current=()=>page.locator('#current-seed').textContent();
  const board=()=>page.locator('.row,.hand').allTextContents();
  async function start(seed=''){
   if(mobile){await click(page.locator('#menu-toggle'));await click(page.locator('[data-open-panel="test-panel"]'));}
   else await click(page.locator('#test-toggle'));
   await page.locator('#seed').fill(seed);await click(page.locator('#new-run button[type=submit]'));
  }
  await page.goto(process.env.DUNGEON_ROW_URL||'http://127.0.0.1:4173');await page.locator('.monster').first().waitFor();
  const first=await current(),firstBoard=await board();assert.notEqual(first,'dungeon-01');
  assert.equal(await page.locator('#seed').inputValue(),'');
  await start();const second=await current();assert.notEqual(second,first);
  await start('   ');assert.notEqual(await current(),second);
  await start(first);assert.equal(await current(),first);assert.deepEqual(await board(),firstBoard);
  await start(first);assert.deepEqual(await board(),firstBoard);
  await page.reload();await page.locator('.monster').first().waitFor();assert.notEqual(await current(),first);
  assert.deepEqual(errors,[]);await page.close();
  console.log(`${mobile?'Mobile':'Desktop'}: random initial/restarted seeds, whitespace fallback, reproducible manual seed and fresh reload passed`);
 }
}finally{await browser.close();}
