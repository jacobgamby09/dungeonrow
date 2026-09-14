// Visible-state heuristic experiment, not an optimal solver or an estimate of human win rate.
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const count=Number(process.env.SIM_SEEDS||200);
assert.ok(Number.isInteger(count)&&count>0);
const out=path.join(root,'output','experiments','one-shot-balance');
const oldDir=path.join(root,'tmp','simulation-v051');
await mkdir(out,{recursive:true});await mkdir(oldDir,{recursive:true});
const oldCommit=execFileSync('git',['rev-parse','ed0e317'],{cwd:root,encoding:'utf8'}).trim();
const currentCommit=execFileSync('git',['rev-parse','03b98e7'],{cwd:root,encoding:'utf8'}).trim();
for(const file of ['engine.mjs','data.mjs']){
  await writeFile(path.join(oldDir,file),execFileSync('git',['show',`${oldCommit}:dist/${file}`],{cwd:root}));
}
const oneShotDir=path.join(root,'tmp','simulation-v060');
await mkdir(oneShotDir,{recursive:true});
for(const file of ['engine.mjs','data.mjs'])await writeFile(path.join(oneShotDir,file),execFileSync('git',['show',`${currentCommit}:dist/${file}`],{cwd:root}));
const engines={perfect:await import(pathToFileURL(path.join(oldDir,'engine.mjs'))),
  'one-shot':await import(pathToFileURL(path.join(oneShotDir,'engine.mjs')))};
const quality=effects=>effects.reduce((n,e)=>n+e.value*({attack:1,block:0.9,heal:1.2}[e.type]),0);
const better=(a,b)=>!b||a.some((v,i)=>v!==b[i]&&a.slice(0,i).every((x,j)=>x===b[j])&&v>b[i]);
const policyDescription={
  cautious:'Lexicographically maximize immediate victory, survival and resulting HP; then the balanced score.',
  balanced:'Maximize immediate victory and survival, then 1.5*HP after turn + 2.5*normal kills/removals + 6*boss stages + 0.35*retained damage + future loot and Scrap value.',
  endure:'always: Endure every normal attacker; wounded: Leave attackers at <= half max HP and Endure others; selective: Leave at >=8 HP after the turn when the hit is fully blocked, the attacker is at <=half HP, or its upgraded loot value exceeds current deck mean by >=1. Otherwise Endure. Bosses stay.',
  scrap:'off: never scrap; on: consider each hand card with weighted value <=3.2 while deck size >8, plus no scrap. Removal bonus 1.8*(deck mean - card value), capped at 6, scaled by remaining normal monsters.',
  loot:'Weighted card values: Attack 1, Block 0.9, Heal 1.2. Skip at most one eligible loot below current deck mean, choosing the weakest. All other loot mandatory/default take. Future loot value = 0.7*(loot value - deck mean), scaled by remaining normal monsters.',
  information:'Planner receives only current HP, visible row/hand, deck size and unordered known deck composition, and number of unrevealed monsters. No future row, draw order, RNG state, seed or rollout access.',
};

function plan(view,config){
  const {row,hand,hp,maxHP,deckSize,mean,dungeonRemaining}=view;
  const future=Math.min(1,(dungeonRemaining+row.filter(m=>!m.boss).length)/12);
  const options=[null,...(config.scrap&&deckSize>8?hand.filter(c=>quality(c.effects)<=3.2).map(c=>c.id):[])];
  let best=null,result=null;
  for(const scrapId of options){
    const tokens=[];let heal=0,block=0;
    for(const card of hand)if(card.id!==scrapId)card.effects.forEach((e,index)=>{
      if(e.type==='attack')tokens.push({id:card.id,index,value:e.value});
      else if(e.type==='heal')heal+=e.value;else if(e.type==='block')block+=e.value;
    });
    const scrapCard=hand.find(c=>c.id===scrapId);
    const scrapValue=scrapCard?future*Math.min(6,1.8*(mean-quality(scrapCard.effects))):0;
    const sums=row.map(()=>0),targets=[],seen=tokens.map(()=>new Set());
    function visit(i){
      if(i<tokens.length){
        const key=sums.join(',');if(seen[i].has(key))return;seen[i].add(key);
        for(let j=0;j<row.length;j++)if(sums[j]<row[j].hp){
          sums[j]+=tokens[i].value;targets[i]=j;visit(i+1);sums[j]-=tokens[i].value;
        }
        targets[i]=-1;visit(i+1);return;
      }
      let attacker=-1,won=0,bossKills=0,kills=0,lootValue=0,skipId=null,skipCost=0;
      for(let j=0;j<row.length;j++){
        const m=row[j];
        if(sums[j]>=m.hp){
          if(m.boss){bossKills++;if(m.stage===3)won=1;}
          else{
            kills++;
            const reward=config.rules==='perfect'?sums[j]===m.hp:m.hp===m.maxHp;
            const effects=m.effects.map((e,i)=>({...e,value:e.value+(reward&&i===0?1:0)}));
            const cost=quality(effects)-mean;lootValue+=cost;
            if(reward&&cost<skipCost){skipCost=cost;skipId=m.id;}
          }
        }else if(attacker<0||m.atk>row[attacker].atk)attacker=j;
      }
      lootValue-=skipCost;
      const damage=won||attacker<0?0:Math.max(0,row[attacker].atk-block);
      const hpAfter=Math.min(maxHP,hp+heal)-damage;
      const enemy=row[attacker];
      const wounded=enemy&&enemy.hp-sums[attacker]<=enemy.maxHp/2;
      const valuable=enemy&&!enemy.boss&&quality(enemy.effects.map((e,i)=>({...e,value:e.value+(i===0?1:0)})))>=mean+1;
      const leave=config.endure==='wounded'?wounded:config.endure==='selective'&&hpAfter>=8&&(damage===0||wounded||valuable);
      const decision=enemy&&!enemy.boss?(leave?'leave':'endure'):null;
      let partial=0;
      for(let j=0;j<row.length;j++)if(sums[j]<row[j].hp&&!(j===attacker&&decision==='endure'))partial+=sums[j];
      const score=1.5*hpAfter+2.5*(kills+Number(decision==='endure'))+6*bossKills+0.35*partial+future*0.7*lootValue+scrapValue;
      const rank=[won,Number(hpAfter>0),...(config.style==='cautious'?[hpAfter]:[]),score,-Number(!!scrapId),-sums.reduce((a,b)=>a+b,0)];
      if(better(rank,best)){
        best=rank;result={scrapId,skipId,decision,hpAfter,damage,won:!!won,
          assignments:tokens.flatMap((t,k)=>targets[k]<0?[]:[{id:t.id,index:t.index,target:row[targets[k]].id}])};
      }
    }
    visit(0);
  }
  return result;
}

function visible(g,engine){
  const cards=engine.deck(g);
  return {hp:g.hp,maxHP:g.maxHP,hand:structuredClone(g.hand),row:structuredClone(g.row.filter(Boolean)),
    deckSize:cards.length,mean:cards.reduce((n,c)=>n+quality(c.effects),0)/cards.length,dungeonRemaining:g.dungeon.length};
}
function run(seed,config,record=false){
  const E=engines[config.rules],g=E.createGame({seed,combatModel:'persistent-hp',startHP:20,scrap:true,escalation:1});
  let alone=null;const acquired=new Map(),delays=[];
  while(g.phase!=='finished'&&g.turn<=150){
    for(const c of g.hand)if(acquired.has(c.id)&&acquired.get(c.id).drawn===null){
      const item=acquired.get(c.id);item.drawn=g.turn;delays.push(g.turn-item.turn);
    }
    if(!alone&&g.row.some(m=>m?.boss)&&g.row.every(m=>!m||m.boss)&&g.dungeon.length===0)alone={turn:g.turn,hp:g.hp};
    const p=plan(visible(g,E),config);
    if(p.scrapId)E.scrap(g,p.scrapId);
    for(const card of g.hand)if(card.id!==p.scrapId)card.effects.forEach((e,i)=>{if(e.type!=='attack')E.assign(g,card.id,i,'self');});
    for(const a of p.assignments)E.assign(g,a.id,a.index,a.target);
    if(p.skipId)E.choosePerfectLoot(g,p.skipId,'skip');
    const actual=E.preview(g);
    assert.equal(actual.hpAfter,p.hpAfter);assert.equal(actual.damage,p.damage);assert.equal(actual.won,p.won);
    const turn=g.turn;
    E.resolve(g,{simulation:config.id});
    if(g.phase==='choice')E.choose(g,p.decision);
    const t=g.history.at(-1);assert.equal(t.turn,turn);
    assert.ok(t.kills.filter(k=>k.lootDecision==='skip').length<=1);
    for(const k of t.kills){
      if(k.loot)acquired.set(k.loot.id,{turn,drawn:null});
      if(config.rules==='one-shot')assert.equal(k.oneShot,k.monster.hp===k.monster.maxHp);
    }
  }
  const sum=f=>g.history.reduce((n,t)=>n+f(t),0),normal=sum(t=>t.kills.filter(k=>!k.monster.boss).length);
  return {seed,config:config.id,result:g.result||'capped',turns:g.history.length,hp:g.hp,floor:g.highestFloor,
    normalKills:normal,rewardKills:sum(t=>t.kills.filter(k=>!k.monster.boss&&(k.oneShot||k.perfect)).length),
    overkillRewards:sum(t=>t.kills.filter(k=>!k.monster.boss&&k.oneShot&&t.monsterDamage.find(m=>m.id===k.monster.id).assignedAttack>k.monster.hp).length),
    scraps:sum(t=>Number(!!t.scrap)),skips:sum(t=>t.kills.filter(k=>k.lootDecision==='skip').length),
    endures:sum(t=>Number(t.decision==='endure')),leaves:sum(t=>Number(t.decision==='leave')),
    damage:sum(t=>t.damage),healing:sum(t=>t.healed),deck:E.deck(g).length,
    bossReached:g.highestFloor===4,alone:!!alone,aloneWon:!!alone&&g.result==='won',aloneStartHP:alone?.hp??null,
    aloneHPChange:alone?g.hp-alone.hp:null,bossStages:sum(t=>t.kills.filter(k=>k.monster.boss).length),
    lootAcquired:acquired.size,lootNeverDrawn:[...acquired.values()].filter(x=>x.drawn===null).length,
    lootDrawDelayTotal:delays.reduce((a,b)=>a+b,0),lootDrawn:delays.length,
    ...(record?{trace:E.exportRun(g,'Automated visible-state policy, not a human playtest.')}:{})};
}
const configs=[];
for(const rules of ['perfect','one-shot'])for(const style of ['cautious','balanced'])for(const endure of ['always','wounded','selective'])for(const scrap of [false,true]){
  configs.push({id:`${rules}/${style}/${endure}/${scrap?'scrap':'no-scrap'}`,rules,style,endure,scrap});
}
const seeds=Array.from({length:count},(_,i)=>`balance-2026-09-11-${String(i+1).padStart(4,'0')}`);
const caseSeeds=['896275e7-c70e-460b-949d-d5b76603129e','84c0fa1f-0ffb-4e54-9f58-aaceef12d09d'];
if(process.argv.includes('--case-traces')){
  for(const config of configs.filter(c=>c.rules==='one-shot'&&c.scrap&&c.endure==='selective')){
    const {trace,...result}=run(caseSeeds[0],config,true);
    await writeFile(path.join(out,`user-seed-${config.style}.json`),JSON.stringify({policy:config,...trace},null,2));
    console.log(JSON.stringify(result));
  }
}else{
const results=[],cases=[];
const startedAt=new Date().toISOString();
for(const config of configs){
  const start=Date.now();
  for(const seed of seeds)results.push(run(seed,config));
  for(const seed of caseSeeds)cases.push(run(seed,config));
  console.log(JSON.stringify({config:config.id,runs:count,wins:results.filter(r=>r.config===config.id&&r.result==='won').length,seconds:Math.round((Date.now()-start)/1000)}));
  await writeFile(path.join(root,'tmp','simulation-checkpoint.json'),JSON.stringify({configs,results,cases},null,2));
}
const round=v=>Number(v.toFixed(3));
const summaries=configs.map(c=>{
  const rs=results.filter(r=>r.config===c.id),sum=k=>rs.reduce((n,r)=>n+r[k],0),avg=k=>round(sum(k)/rs.length);
  const wins=rs.filter(r=>r.result==='won').length,p=wins/rs.length,z=1.96,den=1+z*z/rs.length;
  const center=(p+z*z/(2*rs.length))/den,half=z*Math.sqrt(p*(1-p)/rs.length+z*z/(4*rs.length**2))/den;
  return {...c,runs:rs.length,wins,winRate:round(p),wilson95:[round(center-half),round(center+half)],
    bossReached:sum('bossReached'),alone:sum('alone'),aloneWins:sum('aloneWon'),
    rewardRate:round(sum('rewardKills')/sum('normalKills')),averageTurns:avg('turns'),averageDeck:avg('deck'),
    averageScraps:avg('scraps'),averageSkips:avg('skips'),averageEndures:avg('endures'),averageLeaves:avg('leaves'),
    lootNeverDrawnRate:round(sum('lootNeverDrawn')/sum('lootAcquired')),meanDelayAmongDrawn:round(sum('lootDrawDelayTotal')/sum('lootDrawn')),
    capped:rs.filter(r=>r.result==='capped').length};
});
const paired=summaries.filter(c=>c.rules==='one-shot').map(c=>{
  const oldId=c.id.replace('one-shot/','perfect/'),a=results.filter(r=>r.config===oldId),b=results.filter(r=>r.config===c.id);
  const differences=b.map((r,i)=>Number(r.result==='won')-Number(a[i].result==='won'));
  const mean=differences.reduce((s,x)=>s+x,0)/count;
  const variance=count>1?differences.reduce((s,x)=>s+(x-mean)**2,0)/(count-1):0;
  return {config:c.id,winRateDifference:round(mean),approxPaired95:[round(mean-1.96*Math.sqrt(variance/count)),round(mean+1.96*Math.sqrt(variance/count))],
    onlyOneShotWins:differences.filter(x=>x===1).length,onlyPerfectWins:differences.filter(x=>x===-1).length};
});
const method={startedAt,finishedAt:new Date().toISOString(),seeds:count,totalRuns:results.length,caseRuns:cases.length,
  source:{perfect:oldCommit,oneShot:currentCommit},policyDescription,
  settings:{combatModel:'persistent-hp',startHP:20,scrapEnabled:true,escalation:1,turnCap:150},
  limitations:['Heuristic bots, no optimal play or human win-rate estimate.','Same initial seeds across cells; later draws diverge when actions/decks change.',
    'Loot delay is conditional on being drawn before termination; never-drawn cards may be useful in a longer run.',
    'Boss-alone wins are conditional on reaching that state, not proof that every boss fight is easy.',
    'Intervals describe seed variability for these fixed bots, not uncertainty about human behavior.'],
};
await writeFile(path.join(out,'results.json'),JSON.stringify({method,summaries,paired,results,cases},null,2));
console.log(JSON.stringify({summaries,paired},null,2));
}
