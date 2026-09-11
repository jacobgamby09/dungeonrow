import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createGame,assign,resolve,choose} from '../dist/engine.mjs';
const req=createRequire(process.env.PLAYWRIGHT_PACKAGE || 'C:/Users/JacobGamby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=req('playwright');
await mkdir('tmp/qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],checks=[];
const page=await browser.newPage({viewport:{width:1280,height:1000},acceptDownloads:true});
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
page.on('response',response=>{if(response.status()>=400)errors.push(`HTTP ${response.status()}: ${response.url()}`);});
const url='http://127.0.0.1:4173';
const token=i=>page.locator('[data-effect]').nth(i);
async function fresh(settings={}){
  await page.goto(url);await page.evaluate(()=>{document.querySelector('#seed').value='dungeon-01';document.querySelector('#new-run').requestSubmit();});await page.locator('[data-effect]').first().waitFor();
  {
    await page.getByRole('button',{name:'Test settings',exact:true}).click();
    await page.locator('#combat-model').selectOption(settings.combatModel||'classic');
    if(settings.seed)await page.locator('#seed').fill(settings.seed);
    if(settings.startHP)await page.locator('#start-hp').fill(String(settings.startHP));
    await page.getByRole('button',{name:'Start run',exact:true}).click();
  }
}
async function download(format){
  await page.locator('#history-panel').evaluate(el=>el.open=true);
  const pending=page.waitForEvent('download');await page.locator(`#export-${format}`).click();const file=await pending;
  const dest=`tmp/qa/browser-run.${format}`;await file.saveAs(dest);return readFile(dest,'utf8');
}
async function dragMouse(source,target){
  await source.scrollIntoViewIfNeeded();const a=await source.boundingBox(),b=await target.boundingBox();
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();
  await page.waitForTimeout(380);
}
try{
  await page.goto(url);await page.evaluate(()=>{document.querySelector('#seed').value='dungeon-01';document.querySelector('#new-run').requestSubmit();});await page.locator('[data-effect]').first().waitFor();
  assert.match(await page.locator('h1').innerText(),/HP/);
  assert.match(await page.locator('.monster').first().getAttribute('aria-label'),/5 of 5 HP, Attack 3/);
  await page.screenshot({path:'tmp/qa/hp-desktop.png',fullPage:true});
  await token(0).click();await page.locator('.monster').first().click();
  assert.match(await page.locator('.monster').first().locator('.hp-preview').innerText(),/5 → 2 HP/);
  assert.equal(await page.locator('.monster').first().locator('.health-value strong').innerText(),'5');
  await page.locator('#end-turn').click();
  assert.match(await page.locator('.decision').innerText(),/2 HP remaining/);
  await page.locator('[data-choice="leave"]').click();
  assert.match(await page.locator('.monster').first().getAttribute('aria-label'),/2 of 5 HP, Attack 4/);
  await page.getByRole('button',{name:'Rusty Strike, Attack 2, effect 1',exact:true}).click();await page.locator('.monster').first().click();
  assert.ok(!(await page.locator('.monster').first().getAttribute('class')).includes('perfect'));
  assert.equal(await page.locator('.monster-slot').first().locator('.loot-options').count(),0);
  await page.locator('#end-turn').click();await page.locator('[data-choice="endure"]').click();
  const hpRun=JSON.parse(await download('json'));
  assert.equal(hpRun.settings.combatModel,'persistent-hp');assert.equal(hpRun.gdd,'1.7-hp-atk-one-shot-test');
  assert.equal(hpRun.turns[0].end.row[0].hp,2);assert.equal(hpRun.turns[1].kills[0].oneShot,false);assert.equal(hpRun.turns[1].kills[0].loot.upgraded,false);
  assert.ok((await download('csv')).includes('monster_damage'));
  checks.push('HP mode is default; preview is reversible, wound persists, ATK escalates, later exact HP gives normal loot, exports identify variant');
  await fresh();assert.equal(await page.locator('.monster').count(),4);assert.equal(await page.locator('.hand-card').count(),4);
  await page.screenshot({path:'tmp/qa/desktop.png',fullPage:true});checks.push('desktop rendering');
  await token(0).click();await page.locator('.monster').nth(0).click();
  assert.equal(await page.locator('.monster').nth(0).locator('.attack-meter strong').innerText(),'3');
  await token(2).click();await page.locator('.monster').nth(0).click();
  assert.ok((await page.locator('.monster').nth(0).getAttribute('class')).includes('perfect'));
  assert.ok((await page.locator('.monster').nth(0).innerText()).includes('Block 5'));
  await token(2).click();await token(2).click();assert.equal(await page.locator('.monster').nth(0).locator('.attack-meter strong').innerText(),'3');
  await page.locator('[data-reset]:visible').click();assert.equal(await page.locator('.token.assigned').count(),0);checks.push('click assignment, Perfect preview, undo');
  await dragMouse(token(0),page.locator('.monster').nth(0));assert.equal(await page.locator('.token.assigned').count(),1);
  await dragMouse(token(1),page.locator('[data-target="self"]'));assert.equal(await page.locator('.token.assigned').count(),1);
  assert.match(await page.locator('#message').innerText(),/Invalid/);checks.push('mouse drag and invalid drop');
  await fresh({scrap:true});await token(0).click();await page.locator('.monster').first().click();
  assert.equal(await page.locator('#scrap-enabled').count(),0);
  assert.equal(await page.locator('.card-scrap').count(),4);
  const scrapId=await page.locator('[data-card]').first().getAttribute('data-card');
  await page.locator('[data-card]').first().click();
  assert.equal(await page.locator('.hand-card.scrapped').count(),1);
  assert.equal(await page.locator('.token.assigned').count(),0);
  assert.equal(await page.locator('.hand-card.scrapped .token:disabled').count(),1);
  assert.match(await page.locator('.hand-card.scrapped .card-scrap').innerText(),/Undo Scrap/);
  await page.locator('[data-card]').nth(1).click();
  assert.equal(await page.locator('.hand-card.scrapped').count(),1);
  assert.equal(await page.locator('.hand-card').first().locator('.token:disabled').count(),0);
  await page.locator('[data-card]').nth(1).click();
  assert.equal(await page.locator('.hand-card.scrapped').count(),0);
  await page.locator('[data-card]').first().click();await page.locator('#end-turn').click();
  assert.equal(await page.locator('.card-scrap:not(:disabled)').count(),0);
  await page.locator('[data-choice="endure"]').click();
  const scrapRun=JSON.parse(await download('json'));
  assert.equal(scrapRun.settings.scrap,true);assert.equal(scrapRun.turns[0].scrap.id,scrapId);
  assert.equal(scrapRun.finalDeck.some(c=>c.id===scrapId),false);
  checks.push('Scrap is standard: direct card button, undo, swap, disabled effects, phase lock and permanent removal in export');
  await fresh();await token(0).click();await page.locator('.monster').first().click();
  await dragMouse(page.locator('[data-card]').first(),page.locator('[data-scrap]'));
  assert.equal(await page.locator('.hand-card.scrapped').count(),1);assert.equal(await page.locator('.token.assigned').count(),0);
  await page.locator('[data-scrap]').click();assert.equal(await page.locator('.hand-card.scrapped').count(),0);checks.push('whole-card drag to Scrap and undo');
  await fresh();await page.locator('#observer-panel').evaluate(el=>el.open=true);
  await page.locator('#loot-note').fill('Wanted Guard Shield');await page.locator('#perfect-note').fill('Guard, intentional');
  const pending=JSON.parse(await download('json'));assert.equal(pending.current.notes.loot,'Wanted Guard Shield');
  const expected=createGame();let safety=0;
  while(expected.phase!=='finished'&&safety++<100){
    const strongest=expected.row.filter(Boolean).reduce((a,b)=>a.threat>=b.threat?a:b);
    for(const card of expected.hand)for(let i=0;i<card.effects.length;i++){
      const target=card.effects[i].type==='attack'?strongest.id:'self';
      await page.locator(`[data-effect="${card.id}:${i}"]`).click();if(target!=='self')await page.locator(`[data-target="${target}"]`).click();assign(expected,card.id,i,target);
    }
    await page.locator('#end-turn').click();resolve(expected);
    if(expected.phase==='choice'){await page.locator('[data-choice="endure"]').click();choose(expected,'endure');}
  }
  assert.equal(expected.phase,'finished');assert.equal(await page.locator('.result').count(),1);
  await page.locator('#run-notes').fill('Automated UI check, not a human playtest.');
  const actual=JSON.parse(await download('json'));assert.equal(actual.result,expected.result);assert.equal(actual.turns.length,expected.history.length);
  for(let i=0;i<actual.turns.length;i++){
    assert.equal(actual.turns[i].end.hp,expected.history[i].end.hp);
    assert.deepEqual(actual.turns[i].kills,expected.history[i].kills);
    assert.deepEqual(actual.turns[i].end.row,expected.history[i].end.row);
    assert.deepEqual(actual.turns[i].assignments,expected.history[i].assignments);
  }
  assert.equal(actual.turns[0].notes.loot,'Wanted Guard Shield');
  assert.ok((await download('csv')).includes('scrap_enabled'));checks.push(`complete UI run (${actual.turns.length} turns), notes, JSON/CSV exports match engine`);
  await page.locator('[data-restart]').click();assert.equal(await page.locator('#test-panel').isVisible(),true);checks.push('restart after death');

  await fresh({combatModel:'persistent-hp'});const hpGame=createGame({combatModel:'persistent-hp'});let hpSafety=0;
  while(hpGame.phase!=='finished'&&hpSafety++<100){
    const strongest=hpGame.row.filter(Boolean).reduce((a,b)=>a.atk>=b.atk?a:b);
    for(const c of hpGame.hand)for(let i=0;i<c.effects.length;i++){
      const target=c.effects[i].type==='attack'?strongest.id:'self';
      await page.locator(`[data-effect="${c.id}:${i}"]`).click();if(target!=='self')await page.locator(`[data-target="${target}"]`).click();assign(hpGame,c.id,i,target);
    }
    await page.locator('#end-turn').click();resolve(hpGame);
    if(hpGame.phase==='choice'){const decision=hpGame.turn%2?'leave':'endure';await page.locator(`[data-choice="${decision}"]`).click();choose(hpGame,decision);}
  }
  assert.equal(hpGame.phase,'finished');const hpFull=JSON.parse(await download('json'));
  assert.equal(hpFull.result,hpGame.result);assert.equal(hpFull.turns.length,hpGame.history.length);
  for(let i=0;i<hpFull.turns.length;i++){assert.equal(hpFull.turns[i].end.hp,hpGame.history[i].end.hp);assert.deepEqual(hpFull.turns[i].end.row,hpGame.history[i].end.row);assert.deepEqual(hpFull.turns[i].monsterDamage,hpGame.history[i].monsterDamage);}
  checks.push(`complete HP UI run (${hpFull.turns.length} turns), wounds and ATK match engine`);

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(url);await mobile.evaluate(()=>{document.querySelector('#seed').value='dungeon-01';document.querySelector('#new-run').requestSubmit();});await mobile.locator('[data-effect]').first().waitFor();
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mobile.screenshot({path:'tmp/qa/hp-mobile.png',fullPage:true});
  await mobile.locator('.card-scrap').first().tap();assert.equal(await mobile.locator('.hand-card.scrapped').count(),1);
  await mobile.locator('.card-scrap').first().tap();assert.equal(await mobile.locator('.hand-card.scrapped').count(),0);
  await mobile.locator('[data-effect]').first().tap();await mobile.locator('.monster').first().tap();assert.equal(await mobile.locator('.token.assigned').count(),1);
  await mobile.locator('[data-reset]:visible').tap();
  const source=mobile.locator('[data-effect]').first();await source.evaluate(el=>el.scrollIntoView({block:'center'}));
  const bounds=await source.boundingBox(),cdp=await mobile.context().newCDPSession(mobile);
  const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1,radiusX:4,radiusY:4}]});
  await touch('touchStart',bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await touch('touchMove',bounds.x+bounds.width/2,40);
  await mobile.waitForFunction(()=>{const r=document.querySelector('.monster').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;},{},{timeout:5000});
  const target=await mobile.locator('.monster').first().boundingBox();
  assert.ok(target.y>=0&&target.y<844,'auto-scroll exposes target');
  await touch('touchMove',target.x+target.width/2,target.y+target.height/2);await mobile.waitForTimeout(100);await touch('touchEnd');
  assert.equal(await mobile.locator('.token.assigned').count(),1);checks.push('mobile layout, tap and touch drag with auto-scroll');
  await mobile.close();

  await fresh({combatModel:'persistent-hp'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push('200% text enlargement: no horizontal overflow');
  await page.screenshot({path:'tmp/qa/text-200.png',fullPage:true});
  assert.deepEqual(errors,[]);
  await writeFile('tmp/qa/browser-checks.json',JSON.stringify({checks,errors,webMCP:'Optional API unavailable in this browser; feature-detected fallback verified.'},null,2));
  console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
