import {createGame,assign,choosePerfectLoot,scrap,resetAssignments,preview,resolve,choose,deck,exportRun,exportCSV,hasPersistentHP,monsterHP,monsterATK} from './engine.mjs';
import {LABELS,SYMBOLS,effectText,upgradedEffects,VERSION} from './data.mjs';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let game=createGame({combatModel:'persistent-hp'}),selected=null,selectedCard=null,suppressClickUntil=0;
const effectsHTML=effects=>effects.map(e=>`<span class="effect-${e.type}">${SYMBOLS[e.type]} ${LABELS[e.type]} ${e.value}</span>`).join('');
const HEART='<svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const SWORD='<svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 16 12-12v5L11 18M6 13l5 5M8 16l-4 4M3 18l3 3"/></svg>';
function combatStats(m,damage,remaining,attacker,planning,perfect,killed){
  const after=planning?remaining:m.hp,loss=m.hp-after;
  return `<span class="combat-stats">
    <span class="monster-health">
      <span class="health-heading">${HEART}<span>Health <span class="stat-abbr">/ HP</span></span></span>
      <span class="health-value"><strong>${m.hp}</strong><span>/ ${m.maxHp}</span></span>
      <span class="hp-track" aria-hidden="true"><span class="hp-fill" style="width:${100*after/m.maxHp}%"></span><span class="hp-loss" style="width:${100*loss/m.maxHp}%"></span></span>
      <span class="hp-preview ${planning&&damage>0?'has-damage':''}">${planning&&damage>0?`${m.hp} → ${after} HP <span>after damage</span>`:m.hp<m.maxHp?'Wounded · damage persists':'Full health'}</span>
    </span>
    <span class="monster-atk"><span class="attack-heading">${SWORD}<span>Attack</span></span><strong>${m.atk}</strong></span>
    <span class="attacker-label">${attacker?(planning?'Attacks you':'Attacked you'):killed?(perfect?'Perfect kill ✓':'Defeated ✓'):'Does not attack'}</span>
  </span>`;
}
const targetName=id=>id==='self'?'You':game.row.find(m=>m?.id===id)?.name||'—';
function announce(text){$('message').textContent=text;}
function act(fn){try{fn();render();}catch(e){announce(e.message);}}
const mobileMedia=matchMedia('(max-width:720px), (max-width:1000px) and (max-height:600px)');
const dockObserver=new ResizeObserver(()=>measureDock());
function measureDock(){
  const dock=$('board').querySelector('.mobile-turnbar,.decision,.result');
  document.documentElement.style.setProperty('--dock-height',`${mobileMedia.matches&&dock?dock.getBoundingClientRect().height:0}px`);
}
function updateDockSpace(){
  dockObserver.disconnect();
  const dock=$('board').querySelector('.mobile-turnbar,.decision,.result');
  if(dock)dockObserver.observe(dock);
  measureDock();
}
function showMonsterDetails(id){
  const m=game.row.find(m=>m?.id===id);if(!m)return;
  const p=preview(game),perfect=game.phase==='planning'&&(p.attacks[id]||0)===monsterHP(game,m);
  $('monster-details-title').textContent=m.name;
  $('monster-details-content').innerHTML=`<p>${m.boss?`Boss · Stage ${m.stage} of 3`:`Floor ${m.floor}`}</p><p>${hasPersistentHP(game)?`Health: ${m.hp} / ${m.maxHp} HP · Attack: ${m.atk}`:`Threat: ${m.threat}`}</p>
    <h3>${m.boss?'Boss rules':esc(m.loot)}</h3><p>${m.boss?'No loot. You cannot Endure a boss. Defeat Stage 3 to win.':`${effectText(perfect?upgradedEffects(m.effects):m.effects)}${perfect?' · Perfect upgrade':''}. Taken loot goes to discard.`}</p>
    <p>${hasPersistentHP(game)?'Wounds persist between turns. Losing HP does not lower Attack. An exact remaining-HP kill earns a choice: take upgraded loot or skip it.':'Meet Threat to kill. An exact match earns a choice: take upgraded loot or skip it.'}</p>`;
  $('monster-details').showModal();
}
const menuSections=[$('rules'),$('test-panel'),document.querySelector('.notebook')].map(node=>{
  const anchor=document.createComment('Desktop panel position');node.before(anchor);return {node,anchor};
});
function syncMobileMenu(){
  if(!mobileMedia.matches)$('mobile-menu').close();
  for(const {node,anchor} of menuSections){if(mobileMedia.matches)$('menu-content').append(node);else anchor.after(node);}
  measureDock();
}
$('menu-toggle').addEventListener('click',()=>$('mobile-menu').showModal());
document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('[data-open-panel]').forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.openPanel;$(id).hidden=!$(id).hidden;
  $(id==='rules'?'rules-toggle':'test-toggle').setAttribute('aria-expanded',String(!$(id).hidden));
  if(!$(id).hidden)$(id).scrollIntoView({block:'nearest'});
}));
mobileMedia.addEventListener('change',syncMobileMenu);
syncMobileMenu();
function render(){
  const focused=document.activeElement;
  const focusKey=focused?.dataset?.effect || focused?.dataset?.target;
  const focusId=focused?.id,focusCard=focused?.dataset?.card,focusLoot=focused?.dataset?.lootMonster,focusLootChoice=focused?.dataset?.lootChoice;
  const planning=game.phase==='planning',p=preview(game),total=deck(game).length;
  const persistent=hasPersistentHP(game),pressure=persistent?'Attack':'Threat';
  const monsterHTML=game.row.map((m,i)=>{
    if(!m)return `<div class="empty-slot"><span class="slot-num">0${i+1}</span><span>${game.pendingBoss?.slot===i?'Next boss stage':'Empty slot'}</span></div>`;
    const threshold=monsterHP(game,m),n=p.attacks[m.id]||0,killed=planning&&n>=threshold,perfect=killed&&n===threshold;
    const skipLoot=perfect&&!m.boss&&game.lootChoices[m.id]==='skip';
    const attacker=planning?p.attacker?.id===m.id:game.phase==='choice'&&game.current.attacker?.id===m.id;
    return `<div class="monster-slot"><button class="monster ${m.boss?'boss':''} ${attacker?'attacker':''} ${killed?'killed':''} ${perfect?'perfect':''} ${skipLoot?'loot-skipped':''}" data-target="${m.id}" ${planning?'':'disabled'} aria-label="${esc(m.name)}, ${persistent?`${m.hp} of ${m.maxHp} HP, Attack ${m.atk}${planning&&n>0?`, ${p.remainingHP[m.id]} HP after damage`:''}`:`Threat ${m.threat}`}${attacker?planning?', attacks you':', attacked you':''}${perfect?', Perfect kill':killed?', defeated':''}, ${m.loot?`loot ${esc(m.loot)}, ${effectText(m.effects)}`:`boss-stage ${m.stage}`}">
      <span class="meta"><span>${m.boss?`BOSS · STAGE ${m.stage}/3`:`FLOOR ${m.floor} · 0${i+1}`}</span><span>${persistent?'':attacker?'ATTACKING':perfect?'PERFECT':killed?'KILL':''}</span></span>
      <span class="name">${m.name}</span>${persistent?combatStats(m,n,p.remainingHP[m.id],attacker,planning,perfect,killed):`<span class="threat-row"><span class="threat">${m.threat}</span><span class="threat-label">Threat</span></span><span class="attack-meter"><span><strong>${planning?n:0}</strong> / ${threshold} Attack</span><span class="kill-label">${perfect?'Perfect ✓':killed?'Defeated ✓':''}</span></span>`}
      <span class="loot"><small>${m.boss?'FINAL STAND':skipLoot?'PERFECT · NO LOOT':perfect?'PERFECT LOOT · +1':'LOOT ON KILL'}</small><span class="loot-name">${m.loot||'No loot'}</span><span class="effects-inline">${m.boss?`Stage ${m.stage} of 3`:skipLoot?'No loot will be added':effectsHTML(perfect?upgradedEffects(m.effects):m.effects)}</span></span>
    </button>${perfect&&!m.boss?`<div class="loot-options" role="group" aria-label="Perfect loot for ${esc(m.name)}"><span>Perfect reward</span><div><button data-loot-monster="${m.id}" data-loot-choice="take" aria-pressed="${!skipLoot}">Take loot</button><button data-loot-monster="${m.id}" data-loot-choice="skip" aria-pressed="${skipLoot}">Skip loot</button></div></div>`:''}<button class="monster-info mobile-only" data-info="${m.id}" aria-label="Details for ${esc(m.name)}" aria-haspopup="dialog">ⓘ</button></div>`;
  }).join('');
  const handHTML=game.hand.map(c=>`<article class="hand-card ${c.upgraded?'upgraded':''} ${game.scrapId===c.id?'scrapped':''} ${selectedCard===c.id?'selected-card':''}">
    <div class="card-head"><div><h3 class="card-name">${c.name}</h3>${c.upgraded?'<span class="upgrade">PERFECT LOOT</span>':''}</div></div>
    <div class="tokens">${c.effects.map((e,i)=>{const key=`${c.id}:${i}`,assigned=game.assignments[key];return `<button class="token effect-${e.type} ${selected?.key===key?'active':''} ${assigned?'assigned':''}" data-effect="${key}" aria-label="${c.name}, ${LABELS[e.type]} ${e.value}, effect ${i+1}${assigned?', assigned to '+targetName(assigned):''}" aria-pressed="${selected?.key===key}" ${!planning||game.scrapId===c.id?'disabled':''}><span>${LABELS[e.type]}</span><strong>${e.value}</strong></button>`;}).join('')}</div>
    <div class="destinations">${game.scrapId===c.id?'Removed at End Turn':c.effects.map((e,i)=>{const t=game.assignments[`${c.id}:${i}`];return t?`${e.value} → ${targetName(t)}`:'';}).filter(Boolean).join(' · ')||'Unassigned'}</div>
    ${game.settings.scrap?`<button class="card-scrap" data-card="${c.id}" ${planning?'':'disabled'} aria-pressed="${game.scrapId===c.id}" aria-label="${game.scrapId===c.id?'Undo Scrap for':'Scrap'} ${c.name}" title="Scrap one whole card per turn. No effects or replacement. You can undo before End Turn."><span class="desktop-only">${game.scrapId===c.id?'↶ Undo Scrap':'Scrap card'}</span><span class="mobile-only">${game.scrapId===c.id?'Undo':'Scrap'}</span></button>`:''}
  </article>`).join('');
  const last=game.history.at(-1);
  let banner='';
  if(game.phase==='choice'){
    const a=game.current.attacker;
    banner=`<section class="decision" aria-live="polite"><div><h2>${a.name} attacked: ${game.current.damage} damage</h2><p>${persistent?`Enemy has ${a.hp} HP remaining. `:''}Endure removes it without loot. Leave keeps it; ${game.turn%game.settings.escalation===0?`${pressure} becomes ${monsterATK(game,a)+1}.`:'no escalation this turn.'}</p></div><div class="decision-actions"><button data-choice="endure">Endure<small>Remove without loot</small></button><button data-choice="leave">Leave<small>Keep enemy</small></button></div></section>`;
  } else if(game.phase==='finished') {
    banner=`<section class="result" aria-live="polite"><div><h2>${game.result==='won'?'Gravekeeper defeated.':'Run over.'}</h2><p>${game.history.length} turns · ${game.history.reduce((n,t)=>n+t.kills.length,0)} kills · ${game.history.reduce((n,t)=>n+t.kills.filter(k=>k.perfect).length,0)} Perfects. ${game.result==='won'?'You survived Dungeon Row.':'Export this run or try a new seed.'}</p></div><button class="primary" data-restart>New run</button></section>`;
  }
  const hint=selected?`<strong>${LABELS[selected.type]} ${selected.value}</strong> selected. Choose ${selected.type==='attack'?'a monster':'your HP'}, or click the effect again to unassign it.`:selectedCard?'Whole card selected. Click Scrap.':'Click or drag an effect to a target. You can undo any assignment.';
  $('board').innerHTML=`<div class="stats"><button class="hp" data-target="self" ${planning?'':'disabled'} aria-label="Your health, ${game.hp} of ${game.maxHP} HP, target for Block and Heal"><span class="heart">${HEART}</span><span><strong>${game.hp} <small>/ ${game.maxHP}</small></strong><small>Your health · Block / Heal here</small></span></button><div class="stats-right"><div class="stat"><strong>${String(game.turn).padStart(2,'0')}</strong><small>Turn</small></div><div class="stat"><strong>${game.dungeon.length}</strong><small title="Unrevealed monsters, excluding the row and boss">Mobs left <br>in dungeon</small></div><div class="stat"><strong>${total}</strong><small>In your deck</small></div></div></div>
    <div class="section-label model-heading"><h1>${persistent?'Persistent HP + Attack':'Classic Threat'}</h1><span>+1 ${pressure} ${game.settings.escalation===1?'after every turn':'after even turns'}</span></div>
    <div class="row">${monsterHTML}</div>
    <div class="outcome-strip">${planning?`<span>${p.won?'<strong>Stage 3 defeated · you win immediately</strong>':p.attacker?`<strong>${p.attacker.name}</strong> attacks with ${monsterATK(game,p.attacker)} ${persistent?'Attack':''}`:'<strong>No enemy attacks</strong>'}</span><span><span class="healing">+${p.healed} Heal</span> · ${p.block} Block · <span class="damage">${p.damage} damage</span> → <strong>${p.hpAfter} HP</strong></span>`:`<span>${game.phase==='choice'?'Choose what happens to the attacker.':'Run finished.'}</span>`}</div>
    ${banner}<section class="hand-area"><div class="section-label"><h2>Your hand</h2><span class="draw-count">${game.draw.length} in draw · ${game.discard.length} in discard</span><button class="mobile-only quiet" data-reset ${planning?'':'disabled'}>Reset</button></div><div class="hand">${handHTML||'<p class="fine">No cards available. You can still end the turn.</p>'}</div><div class="hand-actions"><div class="hand-actions-left"><button data-reset ${planning?'':'disabled'}>Reset assignments</button>${game.settings.scrap?`<button class="scrap-target" data-scrap ${planning?'':'disabled'}>${game.scrapId?'Undo Scrap':'Scrap · one whole card'}</button>`:''}</div><button class="primary" id="end-turn" ${planning?'':'disabled'}>End Turn <span aria-hidden="true">→</span></button></div>${game.settings.scrap?'<p class="scrap-hint">Scrap up to 1 card per turn. Use its button to remove it instead of playing it. No replacement card.</p>':''}<p class="selection-hint">${planning?hint:game.phase==='choice'?'Assignments are locked until you choose Endure or Leave.':'Start a new run to play again.'}</p></section>`;
  $('board').dataset.selection=planning&&selected?selected.type:'';
  $('board').dataset.phase=game.phase;
  $('board').insertAdjacentHTML('beforeend',planning?`<section class="mobile-turnbar mobile-only" aria-label="Turn controls">
    <div class="mobile-selection" role="status">${selected?`${LABELS[selected.type]} ${selected.value} selected · tap ${selected.type==='attack'?'a monster':'your health'}`:game.scrapId?'1 card marked for Scrap · 3 cards to play':'Tap an effect, then its target'}</div>
    <div class="mobile-forecast"><div><span>Heal +${p.healed} · Block ${p.block}</span><strong class="${p.hpAfter<=0?'lethal':''}">${p.won?'Victory this turn':`Damage ${p.damage} → ${p.hpAfter} HP`}</strong></div><button class="primary" id="mobile-end-turn">End Turn →</button></div>
  </section>`:'');
  updateDockSpace();
  $('deck-count').textContent=`${total} cards`;
  $('deck-list').innerHTML=[['In hand',game.hand],['Draw · order hidden',game.draw.slice().sort((a,b)=>a.name.localeCompare(b.name))],['Discard',game.discard]].map(([name,cards])=>`<div class="deck-group"><h3>${name} · ${cards.length}</h3><div class="deck-items">${cards.map(c=>`<span class="deck-item">${c.name}${c.upgraded?' ★':''} · ${effectText(c.effects)}</span>`).join('')||'<span class="fine">Empty</span>'}</div></div>`).join('');
  $('log-count').textContent=`${game.history.length} completed turns`;
  $('history-list').innerHTML=game.history.map(t=>`<div class="log-entry"><strong>Turn ${t.turn}</strong> · ${t.start.hp} → ${t.end.hp} HP · ${t.kills.map(k=>`${k.monster.name}${k.perfect?' ★':''}${k.lootDecision==='skip'?' (loot skipped)':''}`).join(', ')||'no kills'} · ${t.decision==='boss-stays'?'boss stays automatically':t.decision} ${t.scrap?'· Scrap: '+t.scrap.name:''}</div>`).join('')||'<p class="fine">No completed turns yet.</p>';
  $('seed-label').textContent=`Seed: ${game.settings.seed} · v${VERSION}`;
  $('build-label').textContent=`v${VERSION} · ${persistent?'HP + ATK TEST':'CLASSIC THREAT'}`;
  $('rules-turns').innerHTML=`<li>Draw 4 cards. Assign the effects you want to use.</li><li>Heal resolves first. ${persistent?'Attack reduces monster HP; wounds persist between turns. At 0 HP, the monster dies. Dealing exactly its remaining HP on the killing turn earns a choice: take upgraded loot or skip it.':'Attack equal to or above Threat kills; an exact match earns a choice: take upgraded loot or skip it. Insufficient Attack has no effect.'} Normal kills always give loot. Choose Take loot or Skip loot on each Perfect before End Turn; Take loot is selected by default. Taken loot goes to discard.</li><li>The surviving enemy with the highest ${pressure} attacks. Ties go to the leftmost enemy. Block reduces damage.${persistent?' Losing HP does not lower Attack.':''}</li><li>Choose Endure: remove the attacker without loot. Or Leave: keep it${persistent?' with its remaining HP':''}.</li><li>Survivors gain +1 ${pressure}${game.settings.escalation===2?' after even turns':''}.${persistent?' HP does not increase.':''} Empty slots refill. Discard your hand.</li>`;
  $('rules-model').textContent=persistent?'HP starts at printed Threat. Attack starts at max(1, Threat − 2). Boss stages follow the same model; each new stage enters with full HP and fresh Attack.':'Classic v1.3: Threat is both the kill threshold and attack strength. Monster wounds do not persist.';
  if(last && game.phase==='planning') $('board').dataset.lastTurn=last.turn;
  if(focusKey){
    const replacement=[...$('board').querySelectorAll('button')].find(b=>b.dataset.effect===focusKey||b.dataset.target===focusKey);
    if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});
  } else if(focusLoot){
    [...$('board').querySelectorAll('[data-loot-monster]')].find(b=>b.dataset.lootMonster===focusLoot&&b.dataset.lootChoice===focusLootChoice)?.focus({preventScroll:true});
  } else if(focusCard){
    const cardButton=[...$('board').querySelectorAll('[data-card]')].find(b=>b.dataset.card===focusCard);
    if(cardButton&&!cardButton.disabled)cardButton.focus({preventScroll:true});
  } else if(focusId==='end-turn'||focusId==='mobile-end-turn'){
    ($('board').querySelector('[data-choice]')||$('board').querySelector('[data-restart]')||(mobileMedia.matches?$('mobile-end-turn'):$('end-turn')))?.focus({preventScroll:true});
  }
}
function selectEffect(key){
  const [id,index]=key.split(':'),c=game.hand.find(c=>c.id===id),e=c?.effects[Number(index)];
  if(!e)return;
  if(selected?.key===key){assign(game,id,Number(index),null);selected=null;}
  else selected={key,id,index:Number(index),...e};
  selectedCard=null;
}
function assignTarget(target){
  if(!selected){announce('Select an effect from your hand first.');return;}
  assign(game,selected.id,selected.index,target);selected=null;announce('Assigned. You can move the effect again before End Turn.');
}
function observerNotes(){return {loot:$('loot-note').value,lines:$('lines-note').value,intentionalPerfects:$('perfect-note').value};}
function clearNotes(){for(const id of ['loot-note','lines-note','perfect-note'])$(id).value='';}
function finish(){resolve(game,observerNotes());selected=null;selectedCard=null;clearNotes();announce(game.phase==='choice'?'Choose Endure or Leave.':game.phase==='finished'?'Run finished.':`Turn ${game.turn}. Your new hand is ready.`);}
$('board').addEventListener('click',event=>{
  if(performance.now()<suppressClickUntil){event.preventDefault();return;}
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.info){showMonsterDetails(b.dataset.info);return;}
  act(()=>{
    if(b.dataset.lootMonster){choosePerfectLoot(game,b.dataset.lootMonster,b.dataset.lootChoice);announce(b.dataset.lootChoice==='skip'?'Perfect loot skipped. You can change this before End Turn.':'Upgraded loot selected.');}
    else if(b.dataset.effect)selectEffect(b.dataset.effect);
    else if(b.dataset.target)assignTarget(b.dataset.target);
    else if(b.dataset.card){scrap(game,game.scrapId===b.dataset.card?null:b.dataset.card);selectedCard=null;selected=null;announce(game.scrapId?'Card marked for Scrap. Its effects are disabled; it will be removed at End Turn.':'Scrap undone. You can use the card again.');}
    else if(b.hasAttribute('data-scrap')){
      if(game.scrapId)scrap(game,null);
      else if(selectedCard||selected)scrap(game,selectedCard||selected.id);
      else throw Error('Use Scrap card on a card, or select one of its effects first.');
      selected=null;selectedCard=null;
    }
    else if(b.hasAttribute('data-reset')){resetAssignments(game);selected=null;selectedCard=null;}
    else if(b.id==='end-turn'||b.id==='mobile-end-turn')finish();
    else if(b.dataset.choice){choose(game,b.dataset.choice);announce(`Turn ${game.turn}. Your new hand is ready.`);}
    else if(b.hasAttribute('data-restart')){if(mobileMedia.matches)$('mobile-menu').showModal();$('test-panel').hidden=false;$('test-toggle').setAttribute('aria-expanded','true');$('seed').focus();$('test-panel').scrollIntoView({block:'start'});}
  });
});
for(const [button,panel]of [['rules-toggle','rules'],['test-toggle','test-panel']])$(button).addEventListener('click',()=>{$(panel).hidden=!$(panel).hidden;$(button).setAttribute('aria-expanded',String(!$(panel).hidden));});
$('new-run').addEventListener('submit',event=>{event.preventDefault();act(()=>{
  game=createGame({seed:$('seed').value.trim(),startHP:Number($('start-hp').value),escalation:Number($('escalation').value),combatModel:$('combat-model').value});
  selected=null;selectedCard=null;clearNotes();$('run-notes').value='';$('test-panel').hidden=true;$('test-toggle').setAttribute('aria-expanded','false');$('mobile-menu').close();announce('New run started.');
});});
function download(format){
  const run=exportRun(game,$('run-notes').value);
  if(run.current&&game.phase==='planning')run.current.notes=observerNotes();
  const content=format==='json'?JSON.stringify(run,null,2):exportCSV(game,$('run-notes').value);
  const url=URL.createObjectURL(new Blob([content],{type:format==='json'?'application/json':'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`dungeon-row-${game.settings.seed.replace(/[^a-z0-9_-]/gi,'_')}-${game.settings.combatModel}-turn${game.turn}.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  announce(`${format.toUpperCase()} exported.`);
}
$('export-json').addEventListener('click',()=>download('json'));$('export-csv').addEventListener('click',()=>download('csv'));

// Pointer events keep the same drag behavior for mouse, pen and touch.
let drag=null;
$('board').addEventListener('pointerdown',event=>{
  const source=event.target.closest('[data-effect],[data-card]');
  if(!source||source.disabled||game.phase!=='planning'||event.button!==0)return;
  drag={source,pointerId:event.pointerId,key:source.dataset.effect,cardId:source.dataset.card,
    startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false,ghost:null,frame:null};
  source.setPointerCapture(event.pointerId);
});
function dragFrame(){
  if(!drag?.active)return;
  if(drag.y<65)window.scrollBy(0,-14);
  else if(drag.y>window.innerHeight-65)window.scrollBy(0,14);
  document.querySelectorAll('.drop-hover').forEach(el=>el.classList.remove('drop-hover'));
  const target=document.elementFromPoint(drag.x,drag.y)?.closest('[data-target],[data-scrap]');
  if(target&&!target.disabled)target.classList.add('drop-hover');
  drag.frame=requestAnimationFrame(dragFrame);
}
document.addEventListener('pointermove',event=>{
  if(!drag||drag.pointerId!==event.pointerId)return;
  drag.x=event.clientX;drag.y=event.clientY;
  if(!drag.active&&Math.hypot(drag.x-drag.startX,drag.y-drag.startY)>8){
    drag.active=true;drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost';
    if(drag.key){const [id,i]=drag.key.split(':'),e=game.hand.find(c=>c.id===id).effects[Number(i)];drag.ghost.textContent=`${LABELS[e.type]} ${e.value}`;}
    else drag.ghost.textContent=game.hand.find(c=>c.id===drag.cardId).name;
    document.body.append(drag.ghost);drag.frame=requestAnimationFrame(dragFrame);
  }
  if(drag.active){event.preventDefault();drag.ghost.style.left=`${drag.x}px`;drag.ghost.style.top=`${drag.y}px`;}
},{passive:false});
function stopDrag(event,cancelled=false){
  if(!drag||drag.pointerId!==event.pointerId)return;
  const old=drag;drag=null;cancelAnimationFrame(old.frame);old.ghost?.remove();
  document.querySelectorAll('.drop-hover').forEach(el=>el.classList.remove('drop-hover'));
  if(old.source.hasPointerCapture(event.pointerId))old.source.releasePointerCapture(event.pointerId);
  if(!old.active)return;
  suppressClickUntil=performance.now()+350;event.preventDefault();
  if(cancelled)return;
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-target],[data-scrap]');
  if(!target||target.disabled){announce('No change. Drop the effect on a valid target.');return;}
  act(()=>{
    if(target.hasAttribute('data-scrap')){
      scrap(game,old.cardId||old.key.split(':')[0]);selected=null;selectedCard=null;
      announce('Whole card selected for Scrap. It provides no effects.');
    }else if(old.key){
      const [id,i]=old.key.split(':');assign(game,id,Number(i),target.dataset.target);
      selected=null;selectedCard=null;announce('Effect assigned.');
    }else throw Error('Whole cards can only be dragged to Scrap.');
  });
}
document.addEventListener('pointerup',event=>stopDrag(event),{capture:true});
document.addEventListener('pointercancel',event=>stopDrag(event,true),{capture:true});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&game.phase==='planning'&&!document.querySelector('dialog[open]')){selected=null;selectedCard=null;render();announce('Selection cleared. Assignments kept.');}
});

// Expose only information already visible on the board; never reveal the draw order.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tool={name:'get_dungeon_row_state',title:'Read Dungeon Row',
    description:'Read the visible hand, row, assignments and predicted outcome of the current turn. Does not change the game or reveal upcoming cards.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:input=>{
      if(input&&Object.keys(input).length)throw Error('This tool takes no arguments.');
      const p=preview(game);
      return {turn:game.turn,phase:game.phase,combatModel:game.settings.combatModel,hp:game.hp,maxHP:game.maxHP,row:structuredClone(game.row),hand:structuredClone(game.hand),
        assignments:{...game.assignments},lootChoices:{...game.lootChoices},scrapId:game.scrapId,
        forecast:game.phase==='planning'?{healing:p.healed,block:p.block,attacker:p.attacker?.id||null,damage:p.damage,hpAfter:p.hpAfter,monsterHPAfter:p.remainingHP,kills:p.kills.map(m=>m.id),victory:p.won}:null};
    }};
  try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability. */}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
render();
