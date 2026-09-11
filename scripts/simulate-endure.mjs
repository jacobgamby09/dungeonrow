// A bounded policy experiment, not a solver for optimal long-term play.
import {mkdir,writeFile} from 'node:fs/promises';
import {createGame,assign,resolve,choose,exportRun} from '../dist/engine.mjs';
const out=new URL('../output/experiments/',import.meta.url);
await mkdir(out,{recursive:true});
const policies=['always-endure','leave-wounded'];
function decisionFor(policy,monster,remainingHP){
  return policy==='leave-wounded'&&remainingHP<=monster.maxHp/2?'leave':'endure';
}
function plan(game,policy){
  const row=game.row.filter(Boolean),tokens=[];let block=0;
  for(const c of game.hand)c.effects.forEach((e,index)=>{
    if(e.type==='attack')tokens.push({card:c.id,index,value:e.value});
    else {assign(game,c.id,index,'self');if(e.type==='block')block+=e.value;}
  });
  const sums=row.map(()=>0),targets=[],seen=tokens.map(()=>new Set());
  let best=null,bestTargets=[];
  const greater=(a,b)=>!b||a.some((v,i)=>v!==b[i]&&a.slice(0,i).every((x,j)=>x===b[j])&&v>b[i]);
  function visit(i){
    if(i<tokens.length){
      const key=sums.join(',');if(seen[i].has(key))return;seen[i].add(key);
      for(let j=0;j<row.length;j++)if(sums[j]<row[j].hp){
        sums[j]+=tokens[i].value;targets[i]=j;visit(i+1);sums[j]-=tokens[i].value;
      }
      targets[i]=-1;visit(i+1);return;
    }
    let attacker=-1,won=0,bossKills=0,lootValue=0,kills=0,perfects=0,partial=0;
    row.forEach((m,j)=>{
      if(sums[j]>=m.hp){
        kills++;const perfect=sums[j]===m.hp;perfects+=Number(perfect);
        if(m.boss){bossKills++;if(m.stage===3)won=1;}
        else lootValue+=m.effects.reduce((n,e)=>n+e.value,0)+Number(perfect);
      }else if(attacker<0||m.atk>row[attacker].atk)attacker=j;
    });
    const damage=won||attacker<0?0:Math.max(0,row[attacker].atk-block);
    row.forEach((m,j)=>{
      if(sums[j]>=m.hp)return;
      // Do not reward wounding an attacker that this policy immediately discards.
      if(j===attacker&&!m.boss&&decisionFor(policy,m,m.hp-sums[j])==='endure')return;
      partial+=sums[j];
    });
    const score=[won,-damage,bossKills,lootValue,kills,partial,perfects,-sums.reduce((a,b)=>a+b,0)];
    if(greater(score,best)){best=score;bestTargets=targets.slice();}
  }
  visit(0);
  for(let i=0;i<tokens.length;i++)if(bestTargets[i]>=0)assign(game,tokens[i].card,tokens[i].index,row[bestTargets[i]].id);
}
function run(seed,policy){
  const game=createGame({seed,combatModel:'persistent-hp',startHP:20,escalation:1,scrap:false});
  while(game.phase!=='finished'&&game.turn<=150){
    plan(game,policy);resolve(game,{experiment:'Automatic policy experiment; not a human playtest.'});
    if(game.phase==='choice'){
      const attacker=game.current.attacker;
      choose(game,decisionFor(policy,attacker,attacker.hp));
    }
  }
  const sum=f=>game.history.reduce((n,t)=>n+f(t),0);
  return {game,result:{seed,policy,result:game.result||'capped',turns:game.history.length,hp:game.hp,floor:game.highestFloor,
    kills:sum(t=>t.kills.length),perfects:sum(t=>t.kills.filter(k=>k.perfect).length),leaves:sum(t=>Number(t.decision==='leave')),
    endures:sum(t=>Number(t.decision==='endure')),bossStagesKilled:sum(t=>t.kills.filter(k=>k.monster.boss).length),
    damage:sum(t=>t.damage),healing:sum(t=>t.healed),deck:game.hand.length+game.draw.length+game.discard.length}};
}
const seeds=['dungeon-01',...Array.from({length:29},(_,i)=>`endure-test-${String(i+1).padStart(2,'0')}`)];
const results=[];
for(const seed of seeds)for(const policy of policies){
  const {game,result}=run(seed,policy);results.push(result);
  if(seed==='dungeon-01'){
    await writeFile(new URL(`${seed}-${policy}.json`,out),JSON.stringify(exportRun(game,`Automated experiment: ${policy}. Not a human run.`),null,2));
    console.log(JSON.stringify(result));
  }
}
const summary=policies.map(policy=>{
  const rs=results.filter(r=>r.policy===policy),avg=k=>Number((rs.reduce((n,r)=>n+r[k],0)/rs.length).toFixed(2));
  return {policy,runs:rs.length,wins:rs.filter(r=>r.result==='won').length,bossReached:rs.filter(r=>r.floor===4).length,
    capped:rs.filter(r=>r.result==='capped').length,averageTurns:avg('turns'),averageKills:avg('kills'),averageLeaves:avg('leaves'),averageBossStages:avg('bossStagesKilled')};
});
const method={
  rules:'1.4-hp-atk-test / prototype 0.2.0',settings:{startHP:20,scrap:false,escalation:1},
  planner:'Uses only visible hand and row. Enumerates attack allocations, including unused tokens. Always uses Block/Heal. Priorities in order: immediate victory; least damage this turn; boss stages killed; summed printed values of acquired loot; number of kills; damage retained on survivors; Perfect count; least Attack spent.',
  choice:{'always-endure':'Endure every eligible attacking monster. Bosses remain as required by rules.','leave-wounded':'Leave if the attacking monster has half or less of its maximum HP remaining; otherwise Endure.'},
  limitations:'No lookahead or draw-order knowledge. Same deterministic planner in both policies, with future wound value excluded for an attacker the policy discards. Runs diverge after choices, so later hands/rows differ. This compares these two policies under one heuristic, not all possible Endure/Leave strategies. Scrap stays off to isolate the choice policy.'
};
await writeFile(new URL('endure-comparison.json',out),JSON.stringify({method,summary,results},null,2));
console.log(JSON.stringify({summary},null,2));
