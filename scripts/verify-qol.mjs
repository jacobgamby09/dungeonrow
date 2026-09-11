import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const req=createRequire(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/JacobGamby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=req('playwright');const browser=await chromium.launch();
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},isMobile:mobile,hasTouch:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const click=async l=>mobile?l.tap():l.click();
  const end=()=>click(page.locator(mobile?'#mobile-end-turn':'#end-turn'));
  const predicted=()=>page.locator('.hp-projection strong').innerText();
  await page.goto(process.env.DUNGEON_ROW_URL||'http://127.0.0.1:4173');await page.evaluate(()=>{document.querySelector('#seed').value='dungeon-01';document.querySelector('#new-run').requestSubmit();});
  assert.equal(await predicted(),'17');await end();await click(page.locator('[data-choice="endure"]'));
  const block=()=>page.locator('.token.effect-block').first();
  await click(block());assert.equal(await block().getAttribute('aria-pressed'),'true');
  assert.equal(await predicted(),'17');assert.match(await page.locator('.hp-feedback').innerText(),/All damage blocked/);
  await click(block());assert.equal(await block().getAttribute('aria-pressed'),'false');assert.equal(await predicted(),'14');
  await click(block());await end();await click(page.locator('[data-choice="endure"]'));
  const heal=()=>page.locator('.token.effect-heal').first();
  await click(heal());await click(block());assert.equal(await predicted(),'20');
  assert.match(await page.locator('.hp-feedback').innerText(),/\+3 healed/);
  assert.equal(await page.locator('#board').getAttribute('data-selection'),'');
  await click(heal());assert.equal(await predicted(),'17');await click(heal());
  const scrap=()=>page.locator('.hand-card').filter({has:page.locator('.token.effect-heal')}).first().locator('.card-scrap');
  await click(scrap());assert.equal(await predicted(),'17');await click(scrap());
  assert.equal(await heal().getAttribute('aria-pressed'),'false');await click(heal());
  assert.equal(await predicted(),'20');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`tmp/qa/qol-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  await end();assert.match(await page.locator('.hp').getAttribute('aria-label'),/Your health, 20 of 20 HP/);
  assert.deepEqual(errors,[]);await page.close();
  console.log(`${mobile?'Mobile':'Desktop'}: one-tap Block/Heal, undo, capped HP forecast, Scrap interaction and committed HP passed`);
 }
}finally{await browser.close();}
