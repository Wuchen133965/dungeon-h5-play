'use strict';
// Base armor follows the same rarity ladder for all six classes: 1 common,
// 1 rare, 2 epic and 1 legendary. Keep existing items and unlocks intact;
// these pieces join the ordinary loot pool in every act.
// Keep icon kinds armor / robe / cloak: character-art.js uses these kinds
// to draw the equipped outfit. Each new piece has its own color palette.
const ARMOR_ROSTER = [
  // Ranger: scouting, venom and sustained mobility.
  { id: 'scoutvest', cls: 'ranger', tier: 0, slot: 'armor', name: '斥候皮衣', icon: ['armor', '#768c4b', '#37452a', '#c4d3a2'],
    lines: ['生命上限 +1', '移动速度 +4%'], mod: s => { s.maxHp += 2; s.speed *= 1.04; } },
  { id: 'mistcloak', cls: 'ranger', tier: 2, slot: 'armor', name: '雾隐斗篷', icon: ['cloak', '#527d69', '#233b35', '#b2e0c6'], lock: 50,
    lines: ['7% 几率格挡伤害', '攻击 11% 几率使敌人中毒'], mod: s => { s.block += 0.07; s.poison += 0.11; } },
  { id: 'windguard', cls: 'ranger', tier: 3, slot: 'armor', name: '风行者衣', icon: ['cloak', '#a4d0a7', '#305549', '#f3ffd9'], lock: 120,
    lines: ['生命上限 +2，移动速度 +12%', '翻滚冷却 -15%，弹道射程 +25%'], mod: s => { s.maxHp += 4; s.speed *= 1.12; s.rollCd *= 0.85; s.rangeMul *= 1.25; } },
  // Mage: a safer apprentice, elemental damage and arcane triggers.
  { id: 'spellweave', cls: 'mage', tier: 1, slot: 'armor', name: '符织法袍', icon: ['robe', '#537dc4', '#233654', '#b7e8ff'],
    lines: ['生命上限 +1', '5% 几率格挡伤害'], mod: s => { s.maxHp += 2; s.block += 0.05; } },
  // archrobe already supplies the mage's locked epic blueprint (60 souls).
  { id: 'emberveil', cls: 'mage', tier: 2, slot: 'armor', name: '余烬法衣', icon: ['robe', '#ad6150', '#4b293b', '#ffc184'],
    lines: ['点燃与中毒伤害 +35%', '攻击 11% 几率点燃敌人'], mod: s => { s.dotMul += 0.35; s.burn += 0.11; } },
  { id: 'starweave', cls: 'mage', tier: 3, slot: 'armor', name: '星织长袍', icon: ['robe', '#8c92db', '#313154', '#f0efff'], lock: 120,
    lines: ['生命上限 +2', '攻击 12% 几率引发连锁闪电', '所有触发几率 ×1.15'], mod: s => { s.maxHp += 4; s.chain += 0.12; s.procMul *= 1.15; } },
  // Cleric: protection, healing and a room shield.
  { id: 'wardmantle', cls: 'cleric', tier: 1, slot: 'armor', name: '庇护披肩', icon: ['cloak', '#d5c99d', '#706341', '#fff4d0'],
    lines: ['所有治疗量 +半颗心', '5% 几率格挡伤害'], mod: s => { s.healBonus += 1; s.block += 0.05; } },
  { id: 'mercyvest', cls: 'cleric', tier: 2, slot: 'armor', name: '慈悲法衣', icon: ['robe', '#c3d8cf', '#536f6b', '#f7fff3'], lock: 50,
    lines: ['每 10 秒回复半颗心', '击杀时 5% 回复半颗心'], mod: s => { s.regen = s.regen ? Math.min(s.regen, 10) : 10; s.vamp += 0.05; } },
  { id: 'dawnraiment', cls: 'cleric', tier: 3, slot: 'armor', name: '晨曦圣袍', icon: ['robe', '#f8dda4', '#887349', '#fffff0'], lock: 120,
    lines: ['生命上限 +2，所有治疗量 +半颗心', '每个房间抵挡一次伤害'], mod: s => { s.maxHp += 4; s.healBonus += 1; s.shield = true; } },
  // Bard: inspiration and the existing five-piece finale mechanic.
  { id: 'rhythmjacket', cls: 'bard', tier: 1, slot: 'armor', name: '节拍短衣', icon: ['armor', '#be7394', '#593146', '#ffe0ed'],
    lines: ['生命上限 +1', '命中时灵感积累 +25%（吟游 3 件）'], mod: s => { s.maxHp += 2; s.insGain *= 1.25; } },
  { id: 'echojacket', cls: 'bard', tier: 2, slot: 'armor', name: '回响礼服', icon: ['robe', '#9477c5', '#3e315c', '#ead6ff'], lock: 50,
    lines: ['攻击速度 +7%，格挡几率 +6%', '灵感上限 +3（吟游 3 件）'], mod: s => { s.atkSpd *= 1.07; s.block += 0.06; s.insCap += 3; } },
  { id: 'grandcostume', cls: 'bard', tier: 3, slot: 'armor', name: '华彩乐衣', icon: ['robe', '#e8acc7', '#765447', '#fff1b8'], lock: 120,
    lines: ['生命上限 +2', '每层灵感效果 +1%（吟游 3 件）', '吟游五件套终章伤害 +50%'], mod: s => { s.maxHp += 4; s.insPer += 0.01; s.finaleMul += 0.5; } },
  // Summoner: faster allies, venom and a stronger extra companion.
  { id: 'bondmantle', cls: 'summoner', tier: 1, slot: 'armor', name: '灵契披肩', icon: ['cloak', '#9583b8', '#443453', '#e9dcff'],
    lines: ['生命上限 +1', '召唤物攻击速度 +12%'], mod: s => { s.maxHp += 2; s.minionSpd *= 1.12; } },
  { id: 'soulweave', cls: 'summoner', tier: 2, slot: 'armor', name: '缚魂法衣', icon: ['robe', '#6b9d87', '#2b4742', '#c8ffdd'], lock: 50,
    lines: ['7% 几率格挡伤害', '召唤物攻击 20% 几率使敌人中毒'], mod: s => { s.block += 0.07; s.minionPoison += 0.2; } },
  { id: 'sovereignrobe', cls: 'summoner', tier: 3, slot: 'armor', name: '统灵长袍', icon: ['robe', '#b9a3dc', '#51426b', '#ffe7aa'], lock: 120,
    lines: ['生命上限 +2', '召唤物 +1，召唤物伤害 +24%'], mod: s => { s.maxHp += 4; s.minions += 1; s.minionDmg *= 1.24; } },
];

// lockedItems() derives its list from ITEMS, so blueprint prices, discovery,
// codex, class sets and co-op's static item whitelist share this registration.
for (const it of ARMOR_ROSTER) {
  if (ITEM_BY_ID[it.id]) continue;
  ITEMS.push(it); ITEM_BY_ID[it.id] = it;
}
