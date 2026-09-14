export const VERSION = '0.7.0';
export const GDD = '1.6-classic-single-skip-test';
export const HP_RULESET = '1.8-hp-atk-card-choices-test';
const effects = (...pairs) => pairs.map(([type, value]) => ({ type, value }));
export const STARTER = [
  { name: 'Rusty Strike', count: 3, effects: effects(['attack', 2]) },
  { name: 'Club', count: 2, effects: effects(['attack', 3]) },
  { name: 'Shiv', count: 1, effects: effects(['attack', 1], ['attack', 1]) },
  { name: 'Torch', count: 1, effects: effects(['attack', 1]) },
  { name: 'Block', count: 2, effects: effects(['block', 3]) },
  { name: 'Bandage', count: 1, effects: effects(['heal', 3]) },
];
export const CHOICE_STARTER = STARTER.map(card=>({
  Club:{name:'Guarded Strike',count:2,choice:true,effects:effects(['attack',3],['block',4])},
  Torch:{name:'Expose',count:1,choice:true,effects:[{type:'attack',value:1},{type:'attack',value:4,requires:'wounded'}]},
  Bandage:{name:'Second Wind',count:1,choice:true,effects:effects(['heal',3],['attack',2])},
}[card.name]||card));
export const DIRECTION_REWARDS = {
  executioner:{name:'Executioner',effects:[{type:'attack',value:3,bonusValue:6,bonusWhen:'full'}]},
  rend:{name:'Rend',effects:[{type:'attack',value:3,bonusValue:6,bonusWhen:'wounded'}]},
};
export const MONSTERS = [
  { key:'rat', name:'Rat', floor:1, count:2, threat:2, loot:'Rat Hide', effects:effects(['block',1]) },
  { key:'bat', name:'Bat', floor:1, count:2, threat:3, loot:'Bat Fang', effects:effects(['attack',1],['attack',1]) },
  { key:'slime', name:'Slime', floor:1, count:2, threat:3, loot:'Slime Salve', effects:effects(['heal',2]) },
  { key:'goblin', name:'Goblin', floor:1, count:2, threat:4, loot:'Goblin Dagger', effects:effects(['attack',2],['attack',2]) },
  { key:'guard', name:'Guard', floor:1, count:1, threat:5, loot:'Guard Shield', effects:effects(['block',4]) },
  { key:'skeleton', name:'Skeleton', floor:2, count:2, threat:5, loot:'Bone Blade', effects:effects(['attack',4]) },
  { key:'cultist', name:'Cultist', floor:2, count:2, threat:6, loot:'Dark Potion', effects:effects(['heal',5]) },
  { key:'ghoul', name:'Ghoul', floor:2, count:2, threat:6, loot:'Ghoul Claw', effects:effects(['attack',3],['block',2]) },
  { key:'orc', name:'Orc', floor:2, count:2, threat:7, loot:'Orc Axe', effects:effects(['attack',6]) },
  { key:'wolf', name:'Wolf Rider', floor:2, count:1, threat:8, loot:'Wolf Spear', effects:effects(['attack',3],['attack',3]) },
  { key:'knight', name:'Knight', floor:3, count:2, threat:8, loot:'Tower Shield', effects:effects(['block',6]) },
  { key:'necromancer', name:'Necromancer', floor:3, count:1, threat:9, loot:'Bone Wand', effects:effects(['attack',4],['attack',4]) },
  { key:'troll', name:'Troll', floor:3, count:2, threat:10, loot:'Troll Club', effects:effects(['attack',8]) },
  { key:'vampire', name:'Vampire', floor:3, count:1, threat:10, loot:'Vampire Fang', effects:effects(['attack',5],['heal',2]) },
  { key:'ogre', name:'Ogre', floor:3, count:1, threat:12, loot:'Ogre Maul', effects:effects(['attack',10]) },
];
export const BOSS_THREATS = [8,11,14];
export const LABELS = { attack:'Attack', block:'Block', heal:'Heal' };
export const SYMBOLS = { attack:'↗', block:'◇', heal:'+' };
export function upgradedEffects(list) { return list.map((e,i) => ({...e, value:e.value + (i===0 ? 1:0)})); }
export function effectDescription(e) {
  if(e.requires==='wounded')return 'Previously wounded only';
  if(e.bonusWhen)return `${e.bonusValue} vs ${e.bonusWhen==='full'?'full HP':'previously wounded'}; otherwise ${e.value}`;
  return '';
}
export function effectText(list,choice=false) { return list.map(e=>`${LABELS[e.type]} ${e.value}${effectDescription(e)?` (${effectDescription(e)})`:''}`).join(choice?' OR ':' / '); }
