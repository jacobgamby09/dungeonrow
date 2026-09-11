import {STARTER, MONSTERS, BOSS_THREATS, VERSION, GDD, HP_RULESET, upgradedEffects} from './data.mjs';
export const copy = value => structuredClone(value);
const require = (condition, message) => { if (!condition) throw new Error(message); };
export function random(seed) {
  let value = 2166136261;
  for (const c of String(seed)) value = Math.imul(value ^ c.charCodeAt(0),16777619);
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function shuffle(cards, rng) {
  const result = cards.slice();
  for (let i=result.length-1;i>0;i--) {
    const j=Math.floor(rng()*(i+1)); [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
export function makeCard(state, name, effects, upgraded=false) {
  return {id:`c${state.nextCard++}`,name,effects:copy(effects),upgraded};
}
export const hasPersistentHP = state => state.settings.combatModel === 'persistent-hp';
export const monsterHP = (state, monster) => hasPersistentHP(state) ? monster.hp : monster.threat;
export const monsterATK = (state, monster) => hasPersistentHP(state) ? monster.atk : monster.threat;
function combatStats(monster,model) {
  if(model==='persistent-hp') return {...monster,hp:monster.threat,maxHp:monster.threat,atk:Math.max(1,monster.threat-2)};
  return monster;
}
export function makeMonster(key, id, model='classic') {
  const def=MONSTERS.find(m=>m.key===key);
  require(def, 'Unknown monster.');
  return combatStats({...copy(def),id},model);
}
export function deck(state) { return [...state.hand,...state.draw,...state.discard]; }
export function snapshot(state) {
  return copy({hp:state.hp, hand:state.hand, row:state.row, draw:state.draw, discard:state.discard,
    deckSize:deck(state).length, dungeonRemaining:state.dungeon.length, pendingBoss:state.pendingBoss});
}
export function createGame(settings={}) {
  // Classic is retained for existing engine consumers and v1.3 replays. The UI starts in the HP test model.
  const opts={seed:'dungeon-01',startHP:20,scrap:true,escalation:1,combatModel:'classic',...settings};
  require(typeof opts.seed==='string' && opts.seed.length>0 && opts.seed.length<=80,'Seed must contain 1–80 characters.');
  require(Number.isInteger(opts.startHP) && opts.startHP>=1 && opts.startHP<=40,'Starting HP must be 1–40.');
  require([1,2].includes(opts.escalation),'Escalation must be 1 or 2.');
  require(typeof opts.scrap==='boolean','Scrap must be enabled or disabled.');
  require(['classic','persistent-hp'].includes(opts.combatModel),'Unknown combat model.');
  const state={version:VERSION,gdd:opts.combatModel==='classic'?GDD:HP_RULESET,settings:opts,rng:random(opts.seed),nextCard:1,
    hp:opts.startHP,maxHP:Math.max(20,opts.startHP),turn:1,phase:'planning',result:null,
    draw:[],discard:[],hand:[],row:[null,null,null,null],dungeon:[],
    assignments:{},scrapId:null,history:[],current:null,bossSpawned:false,pendingBoss:null,
    highestFloor:1,startedAt:new Date().toISOString(),endedAt:null};
  for(const def of STARTER) for(let i=0;i<def.count;i++) state.draw.push(makeCard(state,def.name,def.effects));
  state.draw=shuffle(state.draw,state.rng);
  let monsterId=0;
  for(let floor=1;floor<=3;floor++) {
    const band=[];
    for(const def of MONSTERS.filter(m=>m.floor===floor))
      for(let i=0;i<def.count;i++) band.push(makeMonster(def.key,`m${++monsterId}`,opts.combatModel));
    state.dungeon.push(...shuffle(band,state.rng));
  }
  refill(state); beginTurn(state); return state;
}
function boss(stage,model) {
  return combatStats({id:`boss${stage}`,key:'boss',name:'Gravekeeper',floor:4,stage,boss:true,
    threat:BOSS_THREATS[stage-1],effects:[],loot:null},model);
}
export function refill(state) {
  if(state.pendingBoss) {
    const {slot,stage}=state.pendingBoss;
    state.row[slot]=boss(stage,state.settings.combatModel); state.pendingBoss=null;
  }
  for(let i=0;i<4;i++) if(!state.row[i] && state.dungeon.length) state.row[i]=state.dungeon.shift();
  if(!state.dungeon.length && !state.bossSpawned) {
    const slot=state.row.indexOf(null);
    if(slot>=0) {state.row[slot]=boss(1,state.settings.combatModel);state.bossSpawned=true;}
  }
  for(const m of state.row) if(m) state.highestFloor=Math.max(state.highestFloor,m.floor);
}
export function beginTurn(state) {
  state.assignments={};state.scrapId=null;state.lootChoices={};state.phase='planning';
  while(state.hand.length<4) {
    if(!state.draw.length && state.discard.length) {
      state.draw=shuffle(state.discard,state.rng);state.discard=[];
    }
    if(!state.draw.length) break;
    state.hand.push(state.draw.shift());
  }
  state.current={turn:state.turn,start:snapshot(state),notes:{},moves:0,startedAt:new Date().toISOString()};
}
export function assign(state, cardId, index, target) {
  require(state.phase==='planning','Assignments are locked.');
  const card=state.hand.find(c=>c.id===cardId), e=card?.effects[index];
  require(e && Number.isInteger(index),'Select an effect from your hand.');
  require(cardId!==state.scrapId,'Undo Scrap for this card first.');
  require(target===null || (e.type==='attack' ? state.row.some(m=>m?.id===target) : target==='self'),'Invalid target for this effect.');
  const key=`${cardId}:${index}`;
  if(target===null) delete state.assignments[key]; else state.assignments[key]=target;
  pruneLootChoices(state);
  state.current.moves++;
}
export function scrap(state, cardId) {
  require(state.phase==='planning' && state.settings.scrap,'Scrap is not enabled.');
  require(cardId===null || state.hand.some(c=>c.id===cardId),'Card is not in your hand.');
  state.scrapId=cardId;
  if(cardId) for(const key of Object.keys(state.assignments)) if(key.startsWith(`${cardId}:`)) delete state.assignments[key];
  pruneLootChoices(state);
  state.current.moves++;
}
export function resetAssignments(state) {
  require(state.phase==='planning','Assignments are locked.');
  state.assignments={};state.scrapId=null;state.lootChoices={};state.current.moves++;
}
function eligiblePerfectLoot(state){
  const p=preview(state);
  return p.kills.filter(m=>!m.boss&&p.attacks[m.id]===monsterHP(state,m));
}
function pruneLootChoices(state){
  const ids=new Set(eligiblePerfectLoot(state).map(m=>m.id));
  for(const id of Object.keys(state.lootChoices))if(!ids.has(id))delete state.lootChoices[id];
}
export function choosePerfectLoot(state,monsterId,decision){
  require(state.phase==='planning','Loot choices are locked.');
  require(['take','skip'].includes(decision),'Choose Take loot or Skip loot.');
  require(eligiblePerfectLoot(state).some(m=>m.id===monsterId),'Only a Perfect Kill lets you skip loot.');
  if(decision==='skip')for(const id of Object.keys(state.lootChoices))if(state.lootChoices[id]==='skip')state.lootChoices[id]='take';
  state.lootChoices[monsterId]=decision;state.current.moves++;
}
export function preview(state) {
  const attacks={};let block=0,heal=0;
  for(const c of state.hand) if(c.id!==state.scrapId) c.effects.forEach((e,i)=>{
    const target=state.assignments[`${c.id}:${i}`];
    if(!target) return;
    if(e.type==='attack') attacks[target]=(attacks[target]||0)+e.value;
    if(e.type==='block' && target==='self') block+=e.value;
    if(e.type==='heal' && target==='self') heal+=e.value;
  });
  const kills=state.row.filter(m=>m && (attacks[m.id]||0)>=monsterHP(state,m));
  const remainingHP=hasPersistentHP(state)?Object.fromEntries(state.row.filter(Boolean).map(m=>[m.id,Math.max(0,m.hp-(attacks[m.id]||0))])):{};
  const won=kills.some(m=>m.boss && m.stage===3);
  const survivors=state.row.filter(m=>m && !kills.includes(m));
  const attacker=won?null:survivors.reduce((a,m)=>!a || monsterATK(state,m)>monsterATK(state,a)?m:a,null);
  const healed=Math.min(state.maxHP,state.hp+heal)-state.hp;
  const damage=attacker?Math.max(0,monsterATK(state,attacker)-block):0;
  return {attacks,remainingHP,block,heal,healed,kills,attacker,damage,hpAfter:state.hp+healed-damage,won};
}
export function resolve(state,notes={}) {
  require(state.phase==='planning','This turn has already resolved.');
  const p=preview(state);
  Object.assign(state.current,{assignments:copy(state.assignments),lootChoices:copy(state.lootChoices),scrap:copy(state.hand.find(c=>c.id===state.scrapId)||null),
    notes:copy(notes),healed:p.healed,block:p.block,kills:[],attacker:copy(p.attacker),damage:p.damage,
    monsterDamage:hasPersistentHP(state)?state.row.filter(m=>m&&(p.attacks[m.id]||0)>0).map(m=>({id:m.id,name:m.name,hpBefore:m.hp,hpAfter:p.remainingHP[m.id],assignedAttack:p.attacks[m.id],atk:m.atk})):[]});
  state.hand=state.hand.filter(c=>c.id!==state.scrapId);
  state.hp+=p.healed;
  for(const m of p.kills) {
    const slot=state.row.findIndex(item=>item?.id===m.id),perfect=p.attacks[m.id]===monsterHP(state,m);
    let loot=null;
    const lootDecision=m.boss?'none':perfect?(state.lootChoices[m.id]||'take'):'mandatory';
    if(!m.boss) {
      if(lootDecision!=='skip'){
        loot=makeCard(state,m.loot,perfect?upgradedEffects(m.effects):m.effects,perfect);
        state.discard.push(loot);
      }
    } else if(m.stage<3) state.pendingBoss={slot,stage:m.stage+1};
    state.current.kills.push({monster:copy(m),perfect,loot:copy(loot),lootDecision});
    state.row[slot]=null;
  }
  if(hasPersistentHP(state)) for(const m of state.row) if(m) m.hp=p.remainingHP[m.id];
  // The attacker snapshot includes the wound from this turn, but ATK is unchanged.
  state.current.attacker=copy(p.attacker);
  if(p.won) {state.current.decision='victory';finishGame(state,'won');return;}
  state.hp-=p.damage;
  if(state.hp<=0) {state.current.decision='death';finishGame(state,'lost');return;}
  if(!p.attacker) finishTurn(state,'none');
  else if(p.attacker.boss) finishTurn(state,'boss-stays');
  else state.phase='choice';
}
export function choose(state,decision) {
  require(state.phase==='choice','There is no Endure/Leave choice.');
  require(['endure','leave'].includes(decision),'Choose Endure or Leave.');
  const id=state.current.attacker?.id,slot=state.row.findIndex(m=>m?.id===id);
  require(slot>=0 && !state.row[slot].boss,'You cannot Endure a boss.');
  if(decision==='endure') state.row[slot]=null;
  finishTurn(state,decision);
}
function finishTurn(state,decision) {
  state.current.decision=decision;state.current.afterResolve=snapshot(state);
  const escalate=state.turn%state.settings.escalation===0;
  if(escalate) for(const m of state.row) if(m) {
    if(hasPersistentHP(state))m.atk++;else m.threat++;
  }
  state.current.escalated=escalate;
  refill(state);
  state.discard.push(...state.hand);state.hand=[];
  state.current.end=snapshot(state);state.current.endedAt=new Date().toISOString();
  state.history.push(state.current);state.turn++;beginTurn(state);
}
function finishGame(state,result) {
  state.phase='finished';state.result=result;state.endedAt=new Date().toISOString();
  state.current.end=snapshot(state);state.current.endedAt=state.endedAt;
  state.history.push(state.current);state.current=null;
}
export function exportRun(state,runNotes='') {
  return {prototype:VERSION,gdd:state.gdd,settings:copy(state.settings),maxHP:state.maxHP,
    startedAt:state.startedAt,endedAt:state.endedAt,result:state.result||'in-progress',
    completedTurns:state.history.length,highestFloor:state.highestFloor,
    turns:copy(state.history),current:state.current?{...copy(state.current),assignments:copy(state.assignments),lootChoices:copy(state.lootChoices),scrapId:state.scrapId,phase:state.phase,state:snapshot(state)}:null,
    finalDeck:copy(deck(state)),runNotes};
}
export function exportCSV(state,runNotes='') {
  const header=['prototype','gdd','seed','start_hp','max_hp','scrap_enabled','escalation_interval','run_started','run_result','turn','hp_start','hp_end','deck_start','deck_end','kills','perfects','damage','attacker','decision','scrap','moves','hand','row_start','assignments','loot','row_end','notes','run_notes','combat_model','monster_damage','loot_choices'];
  const rows=state.history.map(t=>[VERSION,state.gdd,state.settings.seed,state.settings.startHP,state.maxHP,state.settings.scrap,state.settings.escalation,state.startedAt,state.result||'in-progress',t.turn,t.start.hp,t.end.hp,t.start.deckSize,t.end.deckSize,
    t.kills.length,t.kills.filter(k=>k.perfect).length,t.damage,t.attacker?.name||'',t.decision,t.scrap?.name||'',t.moves,
    JSON.stringify(t.start.hand),JSON.stringify(t.start.row),JSON.stringify(t.assignments),JSON.stringify(t.kills.map(k=>k.loot)),JSON.stringify(t.end.row),JSON.stringify(t.notes),runNotes,state.settings.combatModel,JSON.stringify(t.monsterDamage),JSON.stringify(t.kills.filter(k=>k.perfect&&!k.monster.boss).map(k=>({monsterId:k.monster.id,monster:k.monster.name,decision:k.lootDecision})))]);
  // Quoting preserves delimiters; an apostrophe prevents spreadsheet formula evaluation of user notes/seeds.
  const cell=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  return '\uFEFF'+[header,...rows].map(row=>row.map(cell).join(',')).join('\r\n');
}
