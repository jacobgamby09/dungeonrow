import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createGame,assign,resolve,choose} from '../dist/engine.mjs';
const req=createRequire(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/JacobGamby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=req('playwright');
await mkdir('tmp/qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const url='http://127.0.0.1:4173';
async function openMenu(){await page.locator('#menu-toggle').tap();}
async function closeMenu(){await page.locator('#mobile-menu [data-close-dialog]').tap();}
async function download(){
  await openMenu();await page.locator('#history-panel').evaluate(el=>el.open=true);
  const pending=page.waitForEvent('download');await page.locator('#export-json').tap();
  const file=await pending;await file.saveAs('tmp/qa/mobile-run.json');await closeMenu();
  return JSON.parse(await readFile('tmp/qa/mobile-run.json','utf8'));
}
try{
  await page.goto(url);await page.locator('#mobile-end-turn').waitFor();
  assert.equal(await page.locator('.scrap-target').isVisible(),false);
  assert.equal(await page.locator('.notebook').isVisible(),false);
  assert.ok(await page.evaluate(()=>document.querySelector('.hand').getBoundingClientRect().bottom<=document.querySelector('.mobile-turnbar').getBoundingClientRect().top),'Hand and dock fit on a 390 × 844 screen');
  await page.screenshot({path:'tmp/qa/mobile-390.png',fullPage:true});
  await page.locator('[data-effect]').first().tap();
  assert.equal(await page.locator('#board').getAttribute('data-selection'),'attack');
  const before=await download();
  await page.locator('[data-info]').first().tap();
  assert.equal(await page.locator('#monster-details').isVisible(),true);
  assert.match(await page.locator('#monster-details-content').innerText(),/Guard Shield/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#board').getAttribute('data-selection'),'attack');
  await page.locator('.monster').first().tap();
  assert.match(await page.locator('.hp-preview').first().innerText(),/5 → 2 HP/);
  await page.screenshot({path:'tmp/qa/mobile-preview.png',fullPage:true});
  await page.locator('.card-scrap').first().tap();
  assert.equal(await page.locator('.token.assigned').count(),0);
  assert.equal(await page.locator('.hand-card.scrapped').count(),1);
  await page.locator('.card-scrap').first().tap();
  assert.equal(await page.locator('.hand-card.scrapped').count(),0);
  checks.push('Compact board fits; target selection, independent details dialog, damage preview, direct Scrap and Undo');

  await openMenu();await page.locator('[data-open-panel="rules"]').tap();
  assert.equal(await page.locator('#rules').isVisible(),true);
  await page.locator('#observer-panel').evaluate(el=>el.open=true);
  await page.locator('#loot-note').fill('Mobile notes survive layout changes');
  await closeMenu();
  await page.setViewportSize({width:1280,height:1000});
  assert.equal(await page.locator('#rules').isVisible(),true);
  assert.equal(await page.locator('#loot-note').inputValue(),'Mobile notes survive layout changes');
  assert.equal(await page.locator('#menu-toggle').isVisible(),false);
  assert.equal(await page.locator('#end-turn').isVisible(),true);
  await page.setViewportSize({width:390,height:844});
  const after=await download();
  assert.deepEqual(after.current.state.hand,before.current.state.hand);
  assert.equal(after.current.notes.loot,'Mobile notes survive layout changes');
  checks.push('Menu rules, notes and exports; resizing restores desktop panels without resetting the game');

  for(const size of [{width:320,height:568},{width:430,height:932},{width:667,height:375},{width:844,height:390}]){
    await page.setViewportSize(size);
    await page.locator('#menu-toggle').waitFor({state:'visible'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
    await page.locator('.hand').evaluate(el=>el.scrollIntoView({block:'end'}));
    assert.ok(await page.evaluate(()=>document.querySelector('.hand').getBoundingClientRect().bottom<=document.querySelector('.mobile-turnbar').getBoundingClientRect().top+1),'Hand can scroll clear of fixed controls');
    await page.screenshot({path:`tmp/qa/mobile-${size.width}.png`,fullPage:true});
  }
  checks.push('320px and 430px phones plus landscape: no horizontal overflow; hand scrolls clear of the dock');

  await page.setViewportSize({width:390,height:844});await page.goto(url);
  const expected=createGame({combatModel:'persistent-hp'});let safety=0;
  while(expected.phase!=='finished'&&safety++<100){
    const strongest=expected.row.filter(Boolean).reduce((a,b)=>a.atk>=b.atk?a:b);
    for(const c of expected.hand)for(let i=0;i<c.effects.length;i++){
      const target=c.effects[i].type==='attack'?strongest.id:'self';
      await page.locator(`[data-effect="${c.id}:${i}"]`).tap();
      assert.equal(await page.locator('#board').getAttribute('data-selection'),c.effects[i].type==='attack'?'attack':'');
      if(target!=='self')await page.locator(`[data-target="${target}"]`).tap();assign(expected,c.id,i,target);
    }
    await page.locator('#mobile-end-turn').tap();resolve(expected);
    if(expected.phase==='choice'){
      assert.equal(await page.locator('.mobile-turnbar').count(),0);
      assert.equal(await page.locator('.decision').evaluate(el=>getComputedStyle(el).position),'fixed');
      if(expected.turn===1)await page.screenshot({path:'tmp/qa/mobile-choice.png',fullPage:true});
      const decision=expected.turn%2?'leave':'endure';await page.locator(`[data-choice="${decision}"]`).tap();choose(expected,decision);
    }
  }
  assert.equal(expected.phase,'finished');assert.equal(await page.locator('.result').isVisible(),true);
  const run=await download();assert.equal(run.result,expected.result);assert.equal(run.turns.length,expected.history.length);
  for(let i=0;i<run.turns.length;i++){
    assert.deepEqual(run.turns[i].assignments,expected.history[i].assignments);
    assert.equal(run.turns[i].end.hp,expected.history[i].end.hp);
    assert.deepEqual(run.turns[i].end.row,expected.history[i].end.row);
  }
  await page.locator('[data-restart]').tap();assert.equal(await page.locator('#mobile-menu').isVisible(),true);
  assert.equal(await page.locator('#test-panel').isVisible(),true);
  await page.locator('#combat-model').selectOption('classic');await page.locator('#new-run button[type=submit]').tap();
  assert.equal(await page.locator('#mobile-menu').isVisible(),false);
  assert.equal(await page.locator('.threat').count(),4);
  checks.push(`Full mobile run (${run.turns.length} turns), Attack/Block/Heal, fixed Endure/Leave, death, export and restart into classic mode`);
  assert.deepEqual(errors,[]);
  await writeFile('tmp/qa/mobile-checks.json',JSON.stringify({checks,errors},null,2));
  console.log(JSON.stringify({checks,errors},null,2));
}catch(e){await page.screenshot({path:'tmp/qa/mobile-failure.png',fullPage:true});throw e;}
finally{await browser.close();}
