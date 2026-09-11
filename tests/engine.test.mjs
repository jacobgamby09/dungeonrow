import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,makeCard,makeMonster,beginTurn,refill,assign,choosePerfectLoot,scrap,resetAssignments,preview,resolve,choose,deck,exportRun,exportCSV} from '../dist/engine.mjs';
import {MONSTERS} from '../dist/data.mjs';
const e=(type,value)=>({type,value});
function fixture(names=['goblin','slime','guard','skeleton'],cards=[[e('attack',3)],[e('attack',2)],[e('attack',1),e('attack',1)],[e('block',3)]],opts={}){
  const g=createGame(opts);g.row=names.map((name,i)=>name?makeMonster(name,`test${i}`,opts.combatModel):null);
  while(g.row.length<4)g.row.push(null);
  g.hand=cards.map((es,i)=>makeCard(g,`Test ${i}`,es));g.draw=[];g.discard=[];beginTurn(g);return g;
}
const a=(g,c,i,slot)=>assign(g,g.hand[c].id,i,slot==='self'?'self':g.row[slot].id);
test('multiple Perfects choose independently while overkill loot is mandatory',()=>{
  for(const combatModel of ['classic','persistent-hp']){
    const g=fixture(['rat','rat','bat'],[[e('attack',2)],[e('attack',2)],[e('attack',4)],[e('block',3)]],{combatModel});
    a(g,0,0,0);a(g,1,0,1);a(g,2,0,2);
    choosePerfectLoot(g,'test0','skip');choosePerfectLoot(g,'test1','take');
    assert.throws(()=>choosePerfectLoot(g,'test2','skip'));
    assert.equal(exportRun(g).current.lootChoices.test0,'skip');
    resolve(g);const kills=g.history[0].kills;
    assert.deepEqual(kills.map(k=>k.lootDecision),['skip','take','mandatory']);
    assert.equal(kills[0].loot,null);assert.equal(kills[1].loot.effects[0].value,2);
    assert.equal(kills[2].loot.upgraded,false);assert.equal(deck(g).length,6);
    assert.ok(exportCSV(g).includes('loot_choices'));assert.ok(exportCSV(g).includes('skip'));
  }
});
test('invalidating a Perfect clears its choice; reassigning and reset default to take',()=>{
  const g=fixture(['rat','guard'],[[e('attack',2)],[e('attack',1)]]);
  a(g,0,0,0);choosePerfectLoot(g,'test0','skip');a(g,1,0,0);
  assert.deepEqual(g.lootChoices,{});
  assign(g,g.hand[1].id,0,null);choosePerfectLoot(g,'test0','skip');
  resetAssignments(g);assert.deepEqual(g.lootChoices,{});
  a(g,0,0,0);resolve(g);assert.equal(g.current.kills[0].lootDecision,'take');
  assert.throws(()=>choosePerfectLoot(g,'test0','skip'));
});
test('Scrapping an attacking card invalidates its Perfect loot choice',()=>{
  const g=fixture(['rat'],[[e('attack',2)],[e('block',3)]]);
  a(g,0,0,0);choosePerfectLoot(g,'test0','skip');scrap(g,g.hand[0].id);
  assert.deepEqual(g.lootChoices,{});assert.equal(preview(g).kills.length,0);
});
test('wounded Perfects may skip loot and death still resolves immediately',()=>{
  const g=fixture(['guard','troll'],[[e('attack',2)]],{combatModel:'persistent-hp'});
  g.row[0].hp=2;g.hp=1;a(g,0,0,0);choosePerfectLoot(g,'test0','skip');resolve(g);
  assert.equal(g.result,'lost');assert.equal(g.phase,'finished');
  assert.equal(g.history[0].kills[0].perfect,true);assert.equal(g.history[0].kills[0].loot,null);
  assert.equal(g.history[0].kills[0].lootDecision,'skip');
});
test('bosses and non-kills never allow a loot choice',()=>{
  const g=fixture(['rat'],[[e('attack',8)]]);assert.throws(()=>choosePerfectLoot(g,'test0','skip'));
  boss(g);a(g,0,0,0);assert.throws(()=>choosePerfectLoot(g,'boss1','skip'));
  resolve(g);assert.equal(g.history[0].kills[0].lootDecision,'none');
  assert.equal(g.row[0].stage,2);
});
function boss(g,stage=1,slot=0){g.row[slot]={id:`boss${stage}`,name:'Gravekeeper',boss:true,stage,threat:[8,11,14][stage-1],floor:4,effects:[]};g.bossSpawned=true;g.dungeon=[];beginTurn(g);}
test('setup: 10 cards, 25 monsters, four occupied slots, floor bands and repeatable seed',()=>{
  const g=createGame(),h=createGame();assert.equal(deck(g).length,10);assert.equal(g.hand.length,4);assert.equal(g.dungeon.length,21);
  assert.deepEqual(g.row,h.row);assert.deepEqual(g.hand,h.hand);assert.deepEqual(g.dungeon,h.dungeon);
  assert.deepEqual([...g.row,...g.dungeon].map(m=>m.floor),[...Array(9).fill(1),...Array(9).fill(2),...Array(7).fill(3)]);
  assert.notDeepEqual(g.hand,createGame({seed:'different'}).hand);
});
for(const decision of ['endure','leave']){
  test(`GDD example A with ${decision}`,()=>{
    const g=fixture();a(g,0,0,0);a(g,2,0,0);a(g,1,0,1);a(g,2,1,1);a(g,3,0,'self');
    assert.equal(preview(g).attacker.name,'Guard');resolve(g);assert.equal(g.hp,18);assert.equal(g.phase,'choice');
    assert.deepEqual(g.current.kills.map(k=>[k.loot.name,k.loot.effects.map(e=>e.value)]),[['Goblin Dagger',[3,2]],['Slime Salve',[3]]]);
    choose(g,decision);assert.equal(g.row[3].threat,6);assert.equal(g.row[2]?.name==='Guard',decision==='leave');
    if(decision==='leave')assert.equal(g.row[2].threat,6);
    assert.equal(g.history[0].kills.length,2);
  });
  test(`GDD example B with ${decision}`,()=>{
    const g=fixture();a(g,0,0,3);a(g,1,0,3);a(g,3,0,'self');resolve(g);assert.equal(g.hp,18);
    assert.deepEqual(g.current.kills[0].loot.effects,[e('attack',5)]);choose(g,decision);
    assert.equal(g.row[0].threat,5);assert.equal(g.row[1].threat,4);assert.equal(g.row[2]?.name==='Guard',decision==='leave');
  });
}
test('exact match upgrades only the first effect; overkill gives normal loot',()=>{
  const g=fixture(['goblin'],[[e('attack',4),e('attack',4)]]);a(g,0,0,0);a(g,0,1,0);resolve(g);
  assert.equal(g.history[0].kills[0].perfect,false);assert.deepEqual(g.history[0].kills[0].loot.effects,[e('attack',2),e('attack',2)]);
});
test('insufficient attacks do not persist as monster damage',()=>{
  const g=fixture(['goblin'],[[e('attack',2)]]);a(g,0,0,0);resolve(g);assert.equal(g.hp,16);choose(g,'leave');assert.equal(g.row[0].threat,5);
});
test('Heal resolves before damage and is capped',()=>{
  const g=fixture(['guard'],[[e('heal',7)],[e('block',3)]]);g.hp=19;a(g,0,0,'self');a(g,1,0,'self');
  assert.equal(preview(g).hpAfter,18);resolve(g);assert.equal(g.hp,18);assert.equal(g.current.healed,1);
});
test('excess Block cannot heal and disappears next turn',()=>{
  const g=fixture(['rat'],[[e('block',9)]]);g.hp=10;a(g,0,0,'self');resolve(g);assert.equal(g.hp,10);choose(g,'leave');assert.equal(preview(g).block,0);
});
test('death is immediate before a choice and before refill',()=>{
  const g=fixture(['guard']);g.hp=5;resolve(g);assert.equal(g.phase,'finished');assert.equal(g.result,'lost');assert.equal(g.hp,0);assert.equal(g.history.length,1);assert.throws(()=>choose(g,'endure'));
});
test('leftmost surviving monster wins ties, including after a kill',()=>{
  const g=fixture(['guard','skeleton','guard'],[[e('attack',5)]]);assert.equal(preview(g).attacker.id,'test0');a(g,0,0,0);assert.equal(preview(g).attacker.id,'test1');
});
test('no survivors means no attack and no Endure/Leave, new monsters enter fresh',()=>{
  const g=fixture(['rat'],[[e('attack',2)]]);a(g,0,0,0);resolve(g);assert.equal(g.phase,'planning');assert.equal(g.hp,20);assert.equal(g.history[0].decision,'none');
  for(const m of g.row)assert.equal(m.threat,MONSTERS.find(d=>d.key===m.key).threat);
});
test('reshuffle draws the remaining cards but never duplicates a card from the hand',()=>{
  const g=fixture();g.hand=[];g.draw=[makeCard(g,'A',[e('attack',1)])];g.discard=[makeCard(g,'B',[e('attack',2)]),makeCard(g,'C',[e('attack',3)])];
  beginTurn(g);assert.equal(g.hand.length,3);assert.equal(new Set(g.hand.map(c=>c.id)).size,3);assert.equal(g.draw.length,0);assert.equal(g.discard.length,0);
});
test('invalid assignment leaves state unchanged',()=>{
  const g=fixture();const before=JSON.stringify(g.assignments);assert.throws(()=>a(g,0,0,'self'));assert.throws(()=>a(g,3,0,0));assert.throws(()=>assign(g,'missing',0,'self'));assert.equal(JSON.stringify(g.assignments),before);
});
test('undo returns every effect and scraps only before End Turn',()=>{
  const g=fixture(undefined,undefined,{scrap:true});a(g,0,0,0);scrap(g,g.hand[1].id);resetAssignments(g);assert.deepEqual(g.assignments,{});assert.equal(g.scrapId,null);
  resolve(g);assert.throws(()=>resetAssignments(g));
});
test('whole-card Scrap removes all its effects, permanently, and only one card per turn',()=>{
  const g=fixture(['goblin'],[[e('attack',4),e('block',9)],[e('heal',3)]],{scrap:true});
  const id=g.hand[0].id;a(g,0,0,0);a(g,0,1,'self');scrap(g,id);assert.deepEqual(g.assignments,{});assert.throws(()=>a(g,0,0,0));
  assert.equal(preview(g).block,0);assert.equal(preview(g).kills.length,0);resolve(g);choose(g,'endure');
  assert.ok(!deck(g).some(c=>c.id===id));assert.equal(g.history[0].scrap.id,id);
});
test('changing the scrapped card keeps the previously selected card',()=>{
  const g=fixture(undefined,undefined,{scrap:true});const first=g.hand[0].id,second=g.hand[1].id;scrap(g,first);scrap(g,second);resolve(g);choose(g,'endure');assert.ok(deck(g).some(c=>c.id===first));assert.ok(!deck(g).some(c=>c.id===second));
});
test('Scrap is standard; older runs can explicitly disable it',()=>{
  const g=createGame();scrap(g,g.hand[0].id);assert.equal(g.scrapId,g.hand[0].id);
  const legacy=createGame({scrap:false});assert.throws(()=>scrap(legacy,legacy.hand[0].id));
});
test('boss waits when the last normal card fills the row',()=>{
  const g=fixture(['rat','rat','rat',null]);g.dungeon=[makeMonster('ogre','last')];refill(g);assert.equal(g.bossSpawned,false);assert.equal(g.row[3].key,'ogre');g.row[1]=null;refill(g);assert.equal(g.row[1].stage,1);assert.equal(g.row[1].threat,8);
});
test('boss can enter alongside old monsters when dungeon empties during refill',()=>{
  const g=fixture(['rat',null,null,null]);g.dungeon=[makeMonster('ogre','last')];refill(g);assert.equal(g.row[0].key,'rat');assert.equal(g.row[1].key,'ogre');assert.equal(g.row[2].stage,1);assert.equal(g.row[3],null);
});
test('stage transition reserves the same slot and cannot attack or escalate on arrival',()=>{
  const g=fixture([null,'rat'],[[e('attack',20)]]);boss(g);a(g,0,0,0);resolve(g);assert.equal(g.phase,'choice');assert.equal(g.hp,18);assert.equal(g.row[0],null);assert.equal(g.current.kills[0].loot,null);
  choose(g,'endure');assert.equal(g.row[0].stage,2);assert.equal(g.row[0].threat,11);assert.equal(g.hp,18);
});
test('boss attack auto-retains, escalates, and is not logged as Leave',()=>{
  const g=fixture([null],[[e('block',9)]]);boss(g);a(g,0,0,'self');resolve(g);assert.equal(g.phase,'planning');assert.equal(g.row[0].threat,9);assert.equal(g.history[0].decision,'boss-stays');assert.throws(()=>choose(g,'endure'));
});
test('killing stage 3 wins before the other monster can kill the player',()=>{
  const g=fixture([null,'ogre'],[[e('attack',14)]]);boss(g,3);g.hp=1;a(g,0,0,0);assert.equal(preview(g).damage,0);resolve(g);assert.equal(g.result,'won');assert.equal(g.hp,1);assert.equal(g.history[0].kills[0].loot,null);
});
test('every-other-turn escalation happens after turns 2,4,...',()=>{
  const g=fixture(['rat'],[[e('block',20)]],{escalation:2});a(g,0,0,'self');resolve(g);choose(g,'leave');assert.equal(g.row[0].threat,2);resolve(g);choose(g,'leave');assert.equal(g.row[0].threat,3);
});
test('JSON and CSV export contain turn choices, settings, observations and final deck',()=>{
  const g=fixture();resolve(g,{loot:'"Dagger", ønsket\nmen ikke valgt',intentionalPerfects:'ingen'});choose(g,'endure');const out=exportRun(g,'run-note');
  assert.equal(out.turns[0].decision,'endure');assert.equal(out.gdd,'1.5-classic-perfect-loot-test');assert.equal(out.finalDeck.length,4);assert.equal(out.current.turn,2);assert.equal(out.runNotes,'run-note');
  assert.ok(exportCSV(g).includes('intentionalPerfects'));assert.ok(exportCSV(g).includes('scrap_enabled'));out.finalDeck.length=0;assert.equal(deck(g).length,4);
});
test('deterministic replay uses identical seed, settings and actions',()=>{
  const replay=()=>{const g=createGame({seed:'replay'});for(let i=0;i<4&&g.phase!=='finished';i++){for(const c of g.hand)c.effects.forEach((e,j)=>assign(g,c.id,j,e.type==='attack'?g.row.find(Boolean).id:'self'));resolve(g);if(g.phase==='choice')choose(g,'endure');}return exportRun(g);};
  const clean=v=>JSON.parse(JSON.stringify(v,(k,x)=>['startedAt','endedAt'].includes(k)?undefined:x));assert.deepEqual(clean(replay()),clean(replay()));
});
test('100 automated smoke runs finish without corrupting cards, row or logs',()=>{
  for(let seed=0;seed<100;seed++){
    const g=createGame({seed:`smoke-${seed}`,scrap:seed%2===0});
    while(g.phase!=='finished'&&g.turn<150){
      for(const c of g.hand)c.effects.forEach((e,j)=>assign(g,c.id,j,e.type==='attack'?g.row.find(Boolean).id:'self'));
      resolve(g);if(g.phase==='choice')choose(g,'endure');
      assert.equal(g.row.length,4);assert.equal(new Set(deck(g).map(c=>c.id)).size,deck(g).length);
      assert.ok(g.hp<=g.maxHP);assert.equal(g.history.length,g.phase==='finished'?g.turn:g.turn-1);
    }
    assert.equal(g.phase,'finished');
  }
});

const hpFixture=(names=['guard'],cards=[[e('attack',3)],[e('attack',2)]],opts={})=>fixture(names,cards,{combatModel:'persistent-hp',...opts});
test('HP model starts with separate HP/ATK, while keeping the same seed and card order',()=>{
  const g=createGame({combatModel:'persistent-hp'}),classic=createGame();
  assert.equal(g.gdd,'1.5-hp-atk-perfect-loot-test');assert.deepEqual(g.hand,classic.hand);
  for(const m of [...g.row,...g.dungeon]){assert.equal(m.hp,m.threat);assert.equal(m.maxHp,m.threat);assert.equal(m.atk,Math.max(1,m.threat-2));}
  assert.throws(()=>createGame({combatModel:'unknown'}));
});
test('HP preview and undo never apply damage, and wounding never lowers ATK',()=>{
  const g=hpFixture();a(g,0,0,0);const p=preview(g);
  assert.equal(p.remainingHP.test0,2);assert.equal(g.row[0].hp,5);assert.equal(g.row[0].atk,3);assert.equal(p.damage,3);
  resetAssignments(g);assert.equal(preview(g).remainingHP.test0,5);assert.equal(g.row[0].hp,5);
});
test('partial damage persists after Leave; only ATK escalates',()=>{
  const g=hpFixture();a(g,0,0,0);resolve(g);
  assert.equal(g.row[0].hp,2);assert.equal(g.row[0].atk,3);assert.equal(g.hp,17);assert.equal(g.current.attacker.hp,2);
  choose(g,'leave');assert.equal(g.row[0].hp,2);assert.equal(g.row[0].maxHp,5);assert.equal(g.row[0].atk,4);
  assert.deepEqual(g.history[0].monsterDamage,[{id:'test0',name:'Guard',hpBefore:5,hpAfter:2,assignedAttack:3,atk:3}]);
});
test('nonattacking survivors also retain wounds when the attacker is Endured',()=>{
  const g=hpFixture(['ogre','guard'],[[e('attack',3)]]);a(g,0,0,1);resolve(g);assert.equal(g.current.attacker.name,'Ogre');choose(g,'endure');
  assert.equal(g.row[1].hp,2);assert.equal(g.row[1].atk,4);
});
test('later exact remaining HP gives Perfect loot, overkill gives normal loot',()=>{
  for(const amount of [2,3]){
    const g=hpFixture();a(g,0,0,0);resolve(g);choose(g,'leave');
    g.hand=[makeCard(g,'Finisher',[e('attack',amount)])];beginTurn(g);a(g,0,0,0);resolve(g);
    const kill=g.current?.kills[0]||g.history.at(-1).kills[0];
    assert.equal(kill.monster.hp,2);assert.equal(kill.perfect,amount===2);assert.equal(kill.loot.effects[0].value,amount===2?5:4);
  }
});
test('attacker is chosen by ATK, not remaining HP; leftmost wins ATK ties',()=>{
  const g=hpFixture(['troll','guard']);g.row[0].hp=1;g.row[1].atk=9;
  assert.equal(preview(g).attacker.name,'Guard');g.row[1].atk=8;assert.equal(preview(g).attacker.name,'Troll');
});
test('Scrap removes the whole card without damaging monsters in HP mode',()=>{
  const g=hpFixture(['guard'],[[e('attack',3),e('attack',1)]],{scrap:true});a(g,0,0,0);scrap(g,g.hand[0].id);resolve(g);
  assert.equal(g.row[0].hp,5);assert.deepEqual(g.current.monsterDamage,[]);
});
test('HP mode escalates ATK only after even turns in alternate-turn variant',()=>{
  const g=hpFixture(['guard'],[[e('attack',1)]],{escalation:2});a(g,0,0,0);resolve(g);choose(g,'leave');
  assert.equal(g.row[0].hp,4);assert.equal(g.row[0].atk,3);resolve(g);choose(g,'leave');assert.equal(g.row[0].hp,4);assert.equal(g.row[0].atk,4);
});
test('HP boss retains wounds, escalates ATK, and resets both stats at next stage',()=>{
  const g=hpFixture([null],[[e('attack',3)],[e('block',20)]]);g.dungeon=[];refill(g);beginTurn(g);
  assert.equal(g.row[0].hp,8);assert.equal(g.row[0].atk,6);
  a(g,0,0,0);a(g,1,0,'self');resolve(g);
  assert.equal(g.row[0].hp,5);assert.equal(g.row[0].atk,7);assert.equal(g.history[0].decision,'boss-stays');
  g.hand=[makeCard(g,'Finish',[e('attack',6)])];beginTurn(g);a(g,0,0,0);const hp=g.hp;resolve(g);
  assert.equal(g.row[0].stage,2);assert.equal(g.row[0].hp,11);assert.equal(g.row[0].maxHp,11);assert.equal(g.row[0].atk,9);assert.equal(g.hp,hp);
});
test('HP stage 3 wins immediately even with a lethal survivor',()=>{
  const g=hpFixture(['ogre',null],[[e('attack',2)]]);g.row[1]={id:'boss3',boss:true,stage:3,name:'Gravekeeper',hp:2,maxHp:14,atk:18,threat:14};g.hp=1;g.bossSpawned=true;
  a(g,0,0,1);assert.equal(preview(g).damage,0);resolve(g);assert.equal(g.result,'won');assert.equal(g.hp,1);assert.equal(g.history[0].kills[0].perfect,true);
});
test('HP model exports its ruleset, combat mode and wound data in JSON/CSV',()=>{
  const g=hpFixture();a(g,0,0,0);resolve(g);choose(g,'leave');const out=exportRun(g);
  assert.equal(out.settings.combatModel,'persistent-hp');assert.equal(out.gdd,'1.5-hp-atk-perfect-loot-test');assert.equal(out.turns[0].end.row[0].hp,2);assert.equal(out.turns[0].end.row[0].atk,4);
  assert.ok(exportCSV(g).includes('combat_model'));assert.ok(exportCSV(g).includes('hpBefore'));assert.ok(exportCSV(g).includes('persistent-hp'));
});
test('100 HP smoke runs complete without negative survivor HP or losing wounds',()=>{
  for(let seed=0;seed<100;seed++){
    const g=createGame({seed:`hp-smoke-${seed}`,combatModel:'persistent-hp'});
    while(g.phase!=='finished'&&g.turn<150){
      const strongest=g.row.filter(Boolean).reduce((a,b)=>a.atk>=b.atk?a:b);
      for(const c of g.hand)c.effects.forEach((ef,i)=>assign(g,c.id,i,ef.type==='attack'?strongest.id:'self'));
      resolve(g);if(g.phase==='choice')choose(g,seed%2?'endure':'leave');
      for(const m of g.row.filter(Boolean)){assert.ok(m.hp>0&&m.hp<=m.maxHp);assert.ok(m.atk>=1);}
    }
    assert.equal(g.phase,'finished');
  }
});
