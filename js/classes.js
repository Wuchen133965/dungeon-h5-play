'use strict';
// ============================================================ 职业 + 套装质变
// There is no class to pick. Every weapon / armor / boots / trinket carries a class tag; wearing 2 / 3 / 5 pieces of the same class
// unlocks that class's tiers in one run (the 5th tier is a qualitative change). Talents in that class's sector of the tree
// strengthen the same mechanics, and the sector capstone (职业精通) counts as one extra piece.
// Loaded after render.js: registers weapon archetypes, items, icons, projectile looks and the runtime hooks (CLASS_HOOK).

const CLASSES = {
  warrior: { name: '战士', col: '#ff8a5a', ic: ['sword', '#e0e4f0', '#7a5636', '#ffffff'] },
  ranger: { name: '游侠', col: '#8ad05a', ic: ['bow', '#ffffff', '#8a5a30', '#d8d0c0'] },
  mage: { name: '法师', col: '#6aa8ff', ic: ['staff', '#4696ff', '#6a4a30', '#c8e0ff'] },
  cleric: { name: '牧师', col: '#ffe080', ic: ['holy', '#ffe080', '#8a6a20', '#ffffff'] },
  bard: { name: '吟游诗人', col: '#ff8ad8', ic: ['lute', '#e8a060', '#6a3a1a', '#fff0c0'] },
  summoner: { name: '召唤师', col: '#b48aff', ic: ['lantern', '#b48aff', '#3a2a5a', '#ffffff'] },
};
const CLASS_IDS = Object.keys(CLASSES);
const SET_AT = [2, 3, 5];                                    // pieces needed for tier 1 / 2 / 3
// tier texts (pause screen + item cards)
const SET_FX = {
  warrior: ['攻击力 +1', '受击后 2 秒攻速 +40%（怒气）', '质变·震地：每第 3 次攻击放出冲击波'],
  ranger: ['暴击率 +10%', '穿透 +1，翻滚后下一击必定暴击', '质变·分裂：弹道命中分裂出 2 枚追踪飞刀，近战附带飞刀'],
  mage: ['触发几率 ×1.25', '攻击 25% 几率附加随机元素', '质变·奥术新星：每 4 秒在身边爆发并附加元素'],
  cleric: ['清理房间回复半颗心', '满血治疗转为圣盾（最多 4 层），击杀 10% 回复半颗心', '质变·圣光审判：回复生命时圣光打击 3 个敌人，每 10 秒回复半颗心'],
  bard: ['移动速度 +10%', '命中积累灵感（最多 10 层），每层攻击与攻速 +3%', '质变·终章：灵感满层奏响终章，全屏伤害并定身'],
  summoner: ['召唤物 +1', '召唤物伤害 +50%，攻击 20% 几率使敌人中毒', '质变·军团：召唤物 +2、攻速 +50%，击杀 30% 召唤幽魂'],
};

// ---------------------------------------------------------------- icons for the new item kinds
Object.assign(ICON_ROWS, {
  holy: ['...oo...', '..oaao..', '.ooaaoo.', 'oaaccaao', '.ooaaoo.', '...bo...', '...bo...', '...oo...'],
  lute: ['......oo', '.....oao', '....oao.', '..ooao..', '.oaabo..', 'oacaao..', 'oaaao...', '.ooo....'],
  horn: ['........', 'o.......', 'ooo.....', 'oacoooo.', 'oaaaaaao', 'oaaaaaao', 'ooboooo.', 'o.......'],
  lantern: ['...oo...', '..o..o..', '.oooooo.', '.oacaao.', '.oaaaao.', '.oacaao.', '.oooooo.', '...oo...'],
  robe: ['..oooo..', '.oaooao.', 'oaaccaao', '.oaaaao.', '.oaaaao.', 'oaaaaaao', 'oaabbaao', 'oooooooo'],
  note: ['....ooo.', '....oaao', '....o.oo', '....o...', '..ooo...', '.oaao...', '.oaao...', '..oo....'],
  orb: ['..oooo..', '.oaaaco.', 'oaaaacao', 'oaaaaaao', 'oaaaaaao', 'oabaaabo', '.obbbbo.', '..oooo..'],
});

// ---------------------------------------------------------------- weapon archetypes (ranged unless noted)
Object.assign(WTYPES, {
  knives: { kind: 'knives', ranged: true, cd: 0.24, mul: 0.5, speed: 220, proj: 'knife', kb: 50, swingT: 0.08, life: 0.6, r: 3 },
  tome: { kind: 'tome', ranged: true, cd: 0.62, mul: 1.4, speed: 85, proj: 'orb', kb: 90, swingT: 0.14, life: 1.8, r: 6, pierce: 2 },
  scepter: { kind: 'scepter', ranged: true, cd: 0.48, mul: 0.85, speed: 150, proj: 'holy', kb: 70, swingT: 0.12, life: 0.9, r: 4, splash: 16 },
  lute: { kind: 'lute', ranged: true, cd: 0.5, mul: 0.8, speed: 115, proj: 'note', kb: 40, swingT: 0.12, life: 1.0, r: 5, pierce: 99 },
  rod: { kind: 'rod', ranged: true, cd: 0.55, mul: 0.5, speed: 140, proj: 'rbolt', kb: 40, swingT: 0.12, life: 0.8, r: 3 },
  horn: { kind: 'horn', ranged: true, cd: 0.72, mul: 0.75, speed: 125, proj: 'note', kb: 120, swingT: 0.14, life: 0.7, r: 5, pierce: 99 },
});

// ---------------------------------------------------------------- class tags for the existing items (untagged = neutral)
const CLASS_OF = {
  warrior: ['steel', 'hatchet', 'pike', 'maul', 'frostpike', 'lavahammer', 'knight', 'flamesword', 'oath', 'bearded', 'bloodaxe', 'trident', 'club',
    'ironhammer', 'dawn', 'dragon', 'mail', 'plate', 'thorn', 'magma', 'aegis', 'whet', 'giant', 'skull', 'wave', 'tome', 'orbit'],
  ranger: ['twin', 'rogue', 'viper', 'hunt', 'shortbow', 'longbow', 'star', 'cloak', 'shadow', 'charm', 'feather', 'lens', 'sand', 'deadly'],
  mage: ['wand', 'emberstaff', 'froststaff', 'storm', 'ember', 'frost', 'thunder', 'chaos', 'powder'],
  cleric: ['fang', 'heartstone', 'ironring', 'phoenix'],
  bard: ['boots'],
  summoner: ['venom'],
};
// ---------------------------------------------------------------- new class items
const NEW_ITEMS = [
  // ranger: throwing knives
  { id: 'kunai', cls: 'ranger', tier: 0, slot: 'weapon', name: '苦无', icon: ['dagger', '#b4bcd4', '#3a3a4a', '#ffffff'],
    lines: ['快速投出飞刀', '射速极快，伤害 ×0.5'], mod: W('knives') },
  { id: 'shuriken', cls: 'ranger', tier: 2, slot: 'weapon', name: '风魔手里剑', icon: ['orbit', '#c8d0e4', '#3a3a4a', '#ffffff'],
    lines: ['一次投出 3 枚飞刀', '穿透 +1'], mod: W('knives', s => { s.multi = 3; s.pierce += 1; }) },
  // mage: tomes (slow piercing orbs)
  { id: 'primer', cls: 'mage', tier: 0, slot: 'weapon', name: '学徒魔典', icon: ['book', '#6aa8ff', '#26407a', '#c8e0ff'],
    lines: ['释放缓慢的奥术球', '伤害 ×1.4，穿透 2 个敌人'], mod: W('tome') },
  { id: 'pyro', cls: 'mage', tier: 2, slot: 'weapon', name: '炎爆魔典', icon: ['book', '#ff7a30', '#5a1a10', '#ffe080'],
    lines: ['奥术球', '24% 几率点燃敌人', '击杀时 15% 几率爆炸'], mod: W('tome', s => { s.burn += 0.24; s.explode += 0.15; }) },
  { id: 'astral', cls: 'mage', tier: 3, slot: 'weapon', name: '星界魔典', icon: ['book', '#c8a0ff', '#3a1850', '#ffffff'], lock: 110,
    lines: ['一次释放 2 枚奥术球', '所有触发几率 ×1.18', '“群星在书页间低语。”'], mod: W('tome', s => { s.multi = 2; s.procMul *= 1.18; }) },
  { id: 'apprentice', cls: 'mage', tier: 0, slot: 'armor', name: '学徒法袍', icon: ['robe', '#4a6ad0', '#1a2a5a', '#c8e0ff'],
    lines: ['攻击速度 +6%', '所有触发几率 ×1.09'], mod: s => { s.atkSpd *= 1.06; s.procMul *= 1.09; } },
  { id: 'archrobe', cls: 'mage', tier: 2, slot: 'armor', name: '大法师长袍', icon: ['robe', '#8a5ad8', '#2a1850', '#e8d0ff'], lock: 60,
    lines: ['生命上限 +1', '所有触发几率 ×1.18'], mod: s => { s.maxHp += 2; s.procMul *= 1.18; } },
  // cleric: scepters (holy bolts that splash)
  { id: 'acolyte', cls: 'cleric', tier: 0, slot: 'weapon', name: '侍僧圣杖', icon: ['holy', '#ffe080', '#8a6a20', '#ffffff'],
    lines: ['发射圣光弹，命中时溅射', '伤害 ×0.85'], mod: W('scepter') },
  { id: 'sunrod', cls: 'cleric', tier: 1, slot: 'weapon', name: '曙光权杖', icon: ['holy', '#ffd060', '#a05a10', '#fff6d0'],
    lines: ['圣光弹，攻击力 +0.5', '命中时 4% 几率回复半颗心'], mod: W('scepter', s => { s.dmg += 0.5; s.holyHeal += 0.04; }) },
  { id: 'seraph', cls: 'cleric', tier: 3, slot: 'weapon', name: '炽天使权杖', icon: ['holy', '#ffffff', '#ecba40', '#fff6d0'], lock: 110,
    lines: ['一次发射 2 枚追踪圣光弹', '命中时 6% 几率回复半颗心', '“光不会询问黑暗的名字。”'], mod: W('scepter', s => { s.multi = 2; s.homing = true; s.holyHeal += 0.06; }) },
  { id: 'vestment', cls: 'cleric', tier: 0, slot: 'armor', name: '祭司长袍', icon: ['robe', '#f0e8d0', '#8a6a40', '#ffffff'],
    lines: ['生命上限 +1', '每 12 秒回复半颗心'], mod: s => { s.maxHp += 2; s.regen = s.regen ? Math.min(s.regen, 12) : 12; } },
  { id: 'sanctum', cls: 'cleric', tier: 2, slot: 'armor', name: '圣所铠甲', icon: ['armor', '#fff0b0', '#a08030', '#ffffff'],
    lines: ['生命上限 +2', '6% 几率格挡伤害', '所有治疗量 +半颗心'], mod: s => { s.maxHp += 4; s.block += 0.06; s.healBonus += 1; } },
  { id: 'rosary', cls: 'cleric', tier: 0, slot: 'trinket', name: '念珠', icon: ['amulet', '#d8c8a0', '#6a5030', '#ffffff'],
    lines: ['每 15 秒回复半颗心'], mod: s => { s.regen = s.regen ? Math.min(s.regen, 15) : 15; } },
  { id: 'chalice', cls: 'cleric', tier: 1, slot: 'trinket', name: '圣杯', icon: ['flask', '#ffe080', '#8a6a20', '#ffffff'],
    lines: ['所有治疗量 +半颗心', '击杀时 4% 回复半颗心'], mod: s => { s.healBonus += 1; s.vamp += 0.04; } },
  { id: 'relic', cls: 'cleric', tier: 2, slot: 'trinket', name: '圣者遗骨', icon: ['skull', '#fff0c8', '#a08040', '#ffffff'],
    lines: ['攻击力 +0.25', '圣光溅射范围 +50%'], mod: s => { s.dmg += 0.25; s.splashMul *= 1.5; } },
  // bard: lute / horn (piercing sound waves) + inspiration
  { id: 'travellute', cls: 'bard', tier: 0, slot: 'weapon', name: '旅人鲁特琴', icon: ['lute', '#e8a060', '#6a3a1a', '#fff0c0'],
    lines: ['弹奏音符，穿透所有敌人', '伤害 ×0.8'], mod: W('lute') },
  { id: 'warhorn', cls: 'bard', tier: 1, slot: 'weapon', name: '战争号角', icon: ['horn', '#d8b060', '#6a4a20', '#fff0c0'],
    lines: ['吹出扇形音波，击退敌人', '一次 3 道音波'], mod: W('horn', s => { s.multi = 3; }) },
  { id: 'harp', cls: 'bard', tier: 2, slot: 'weapon', name: '精灵竖琴', icon: ['lute', '#8ae0c0', '#2a6a5a', '#ffffff'],
    lines: ['追踪音符，穿透所有敌人', '15% 几率引发连锁闪电'], mod: W('lute', s => { s.homing = true; s.chain += 0.15; }) },
  { id: 'maestro', cls: 'bard', tier: 3, slot: 'weapon', name: '大师之琴', icon: ['lute', '#ffd060', '#8a3a10', '#ffffff'], lock: 110,
    lines: ['攻击力 +1，一次 2 道音符', '灵感积累速度 ×2', '“整个地牢都在为你伴奏。”'], mod: W('lute', s => { s.dmg += 1; s.multi = 2; s.insGain *= 2; }) },
  { id: 'minstrel', cls: 'bard', tier: 0, slot: 'armor', name: '吟游斗篷', icon: ['cloak', '#c84a8a', '#5a1a3a', '#ffb0d8'],
    lines: ['移动速度 +8%', '翻滚冷却 -6%'], mod: s => { s.speed *= 1.08; s.rollCd *= 0.94; } },
  { id: 'stagecoat', cls: 'bard', tier: 2, slot: 'armor', name: '名伶礼服', icon: ['robe', '#ff8ad8', '#6a1a5a', '#ffffff'],
    lines: ['生命上限 +1，暴击率 +5%', '击杀时获得 2 层灵感'], mod: s => { s.maxHp += 2; s.crit += 0.05; s.insKill += 2; } },
  { id: 'metronome', cls: 'bard', tier: 0, slot: 'trinket', name: '节拍器', icon: ['hourglass', '#d8a060', '#6a3a1a', '#fff0c0'],
    lines: ['攻击速度 +6%'], mod: s => { s.atkSpd *= 1.06; } },
  { id: 'fork', cls: 'bard', tier: 1, slot: 'trinket', name: '音叉', icon: ['note', '#c8d0e4', '#5a6078', '#ffffff'],
    lines: ['攻击 8% 几率定身敌人'], mod: s => { s.freeze += 0.08; } },
  { id: 'score', cls: 'bard', tier: 1, slot: 'trinket', name: '古老乐谱', icon: ['book', '#e8d8a0', '#6a5030', '#ffffff'],
    lines: ['灵感上限 +5', '每层灵感效果 +1%'], mod: s => { s.insCap += 5; s.insPer += 0.01; } },
  { id: 'musebell', cls: 'bard', tier: 3, slot: 'trinket', name: '缪斯之铃', icon: ['note', '#ffd060', '#8a5a10', '#ffffff'], lock: 90,
    lines: ['每层灵感效果翻倍', '“听，她在歌唱。”'], mod: s => { s.insPer *= 2; } },
  // summoner: rods + minion gear
  { id: 'spiritrod', cls: 'summoner', tier: 0, slot: 'weapon', name: '唤灵短杖', icon: ['staff', '#b48aff', '#3a2a5a', '#ffffff'],
    lines: ['召唤 1 只灵体协助战斗', '自身攻击较弱，伤害 ×0.5'], mod: W('rod', s => { s.minions += 1; }) },
  { id: 'bonewand', cls: 'summoner', tier: 1, slot: 'weapon', name: '骸骨魔杖', icon: ['staff', '#e4dcc4', '#5a4a3a', '#ffffff'],
    lines: ['召唤 2 只骸骨猎犬', '猎犬会扑咬敌人'], mod: W('rod', s => { s.minions += 2; s.minionKind = 'hound'; }) },
  { id: 'lichstaff', cls: 'summoner', tier: 2, slot: 'weapon', name: '巫妖法杖', icon: ['staff', '#6adc8a', '#1a4a3a', '#d0ffe0'],
    lines: ['召唤 2 只灵体', '召唤物攻击 30% 几率点燃'], mod: W('rod', s => { s.minions += 2; s.minionBurn += 0.3; }) },
  { id: 'legion', cls: 'summoner', tier: 3, slot: 'weapon', name: '军团权杖', icon: ['lantern', '#ffd060', '#5a2a8a', '#ffffff'], lock: 110,
    lines: ['召唤 3 只灵体', '召唤物伤害 +30%', '“它们曾是英雄。”'], mod: W('rod', s => { s.minions += 3; s.minionDmg *= 1.3; }) },
  { id: 'callrobe', cls: 'summoner', tier: 0, slot: 'armor', name: '唤灵长袍', icon: ['robe', '#7a5ad0', '#2a1a4a', '#d8c8ff'],
    lines: ['召唤物 +1'], mod: s => { s.minions += 1; } },
  { id: 'bonemail', cls: 'summoner', tier: 2, slot: 'armor', name: '骸骨甲', icon: ['armor', '#e4dcc4', '#5a4a3a', '#ffffff'],
    lines: ['生命上限 +1', '召唤物伤害 +18%'], mod: s => { s.maxHp += 2; s.minionDmg *= 1.18; } },
  { id: 'soulbell', cls: 'summoner', tier: 0, slot: 'trinket', name: '招魂铃', icon: ['lantern', '#b48aff', '#3a2a5a', '#ffffff'],
    lines: ['召唤物 +1'], mod: s => { s.minions += 1; } },
  { id: 'soulgem', cls: 'summoner', tier: 1, slot: 'trinket', name: '灵魂宝石', icon: ['gem', '#b48aff', '#3a1850', '#f0d0ff'],
    lines: ['召唤物伤害 +24%'], mod: s => { s.minionDmg *= 1.24; } },
  { id: 'collar', cls: 'summoner', tier: 2, slot: 'trinket', name: '统御项圈', icon: ['ring', '#c8a0ff', '#3a2a5a', '#ffffff'],
    lines: ['召唤物攻击速度 +40%', '召唤物 +1'], mod: s => { s.minionSpd *= 1.4; s.minions += 1; } },
];
for (const [cls, ids] of Object.entries(CLASS_OF)) for (const id of ids) if (ITEM_BY_ID[id]) ITEM_BY_ID[id].cls = cls;
for (const it of NEW_ITEMS) { ITEMS.push(it); ITEM_BY_ID[it.id] = it; }
const classLine = it => it.cls ? `${CLASSES[it.cls].name}装备` : '';

// ---------------------------------------------------------------- set counting + stat tiers (called from recalcStats)
// pieces per class: equipped items + 1 if the class capstone talent is learned
function classCounts(list) {
  const n = Object.fromEntries(CLASS_IDS.map(c => [c, 0]));
  for (const it of list) if (it && it.cls) n[it.cls]++;
  for (const c of CLASS_IDS) if (lv('cap_' + c)) n[c]++;
  return n;
}
const tierOf = n => SET_AT.filter(k => n >= k).length;          // 0..3
// stat-side tier effects; behaviour-side effects read p.set[cls] at runtime
const SET_STATS = {
  warrior: [s => { s.dmg += 1; }, null, null],
  ranger: [s => { s.crit += 0.1; }, s => { s.pierce += 1; s.rollCrit = true; }, null],
  mage: [s => { s.procMul *= 1.25; }, null, null],
  cleric: [null, s => { s.vamp += 0.1; }, s => { s.regen = s.regen ? Math.min(s.regen, 10) : 10; }],
  bard: [s => { s.speed *= 1.1; }, null, null],
  summoner: [s => { s.minions += 1; }, s => { s.minionDmg *= 1.5; s.minionPoison += 0.2; }, s => { s.minions += 2; s.minionSpd *= 1.5; }],
};
function applySets(s, list) {
  const n = classCounts(list); s.set = {}; s.setN = n;
  for (const c of CLASS_IDS) { const t = tierOf(n[c]); s.set[c] = t; for (let i = 0; i < t; i++) if (SET_STATS[c][i]) SET_STATS[c][i](s); }
  for (const c of CLASS_IDS) for (let i = 1; i <= s.set[c]; i++) { const f = TALENT_SET_BONUS[c + i]; if (f) f(s); }   // talents that boost a set tier
}
// talent hooks into set tiers are filled by the talent tree (talents.js): key = class + tier
const TALENT_SET_BONUS = {};

// ---------------------------------------------------------------- runtime: one dispatcher, called from the core loop
// G.cls holds per-run class state: rageT (warrior), swings (warrior), novaT (mage), regenT (cleric), ins (bard)
const T3 = c => G.player && G.player.set && G.player.set[c] >= 3;
const T2 = c => G.player && G.player.set && G.player.set[c] >= 2;
const T1 = c => G.player && G.player.set && G.player.set[c] >= 1;
const CS = () => G.cls || (G.cls = {});
function playerAttackSpeed(p, state = G.cls || {}, inspiration = G.ins || 0, time = G.time) {
  if (!p || !p.set) return 1;
  let m = 1;
  if (p.set.warrior >= 2 && state.rageT > time) m *= p.rageSpd;
  if (p.set.bard >= 2) m *= 1 + inspiration * p.insPer;
  return Math.min(m, GEAR_CAPS.finalAtkSpd / p.atkSpd);
}
function classHook(ev, a, b, c) {
  const p = G.player; if (!p || !p.set) return;
  const S = CS();
  talentCombatHook(ev, a, b, c);
  switch (ev) {
    case 'atkSpd': return playerAttackSpeed(p, S);
    case 'attack': {
      if (T3('warrior') && (S.swings = (S.swings || 0) + 1) % 3 === 0 && attackProc('quake', 0.45)) quakeWave(p);
      if (T3('ranger') && !p.wpn.ranged) throwKnives(p, p.face, a * 0.35, p.splitN);
      return;
    }
    case 'hit': {                                           // (enemy, dmg, opts)
      const e = a, o = c || {};
      if (T2('mage') && rand() < 0.25 * p.procMul) randomElement(e, b);
      // The attack token survives later swings and is shared by the whole volley.
      // An old piercing note cannot claim the next attack's inspiration budget.
      if (T2('bard') && !o.fromMinion) {
        const source = o.attackCtx || (o.shot && (o.shot.attackCtx || (o.shot.attackCtx = newCombatAttack()))) || newCombatAttack();
        const state = combatAttackState(source);
        if (!state.inspirationPaid) { state.inspirationPaid = true; addIns(0.5 * p.insGain); }
      }
      if (T3('ranger') && o.shot && o.shot.main && !o.shot.split) {
        throwKnives(p, Math.atan2(o.shot.vy, o.shot.vx), b * 0.35, p.splitN, o.shot.x, o.shot.y, e); }
      if (p.holyHeal && rand() < p.holyHeal && o.shot && o.shot.kind === 'holy') procHeal(p);
      return;
    }
    case 'kill': {
      const e = a;
      if (p.insKill) addIns(p.insKill);
      if (T3('summoner') && !b?.fromMinion && !b?.shot?.minion && rand() < p.ghostP) addMinion('ghost', e.x, e.y, p.ghostT);
      return;
    }
    case 'hurt': if (T2('warrior')) { S.rageT = G.time + p.rageT; addFloat(p.x, p.y - 26, '怒!', '#ff8a5a', true); } return;
    case 'heal': {                                          // (healed, overflow)
      // overheal shield: at most one layer every HOLY_SHIELD_CD seconds, capped by shieldCap (itself capped in recalcStats)
      if (T2('cleric') && b > 0 && G.holyShield < p.shieldCap && G.time >= (S.shieldT || 0)) {
        G.holyShield++; S.shieldT = G.time + HOLY_SHIELD_CD;
        ring(p.x, p.y - 7, 14, [255, 230, 140], 0.3); addFloat(p.x, p.y - 26, '圣盾', '#ffe080'); }
      if (T3('cleric') && (a > 0 || b > 0)) smite(p);
      return;
    }
    case 'shieldBreak': {
      const attackCtx = newCombatAttack();
      SFX.block(); ring(p.x, p.y - 7, 30, [255, 230, 140], 0.35); addFloat(p.x, p.y - 22, '圣盾破碎', '#ffe080');
      for (const e of G.enemies) if (e.spawn <= 0 && e.hp > 0 && dist(p.x, p.y, e.x, e.y) < 40) damageEnemy(e, playerDmg() * 1.5, false, e.x - p.x, e.y - p.y, { kb: 180, col: '#ffe080', attackCtx });
      return;
    }
    case 'clear': if (T1('cleric')) procHeal(p); return;
    case 'enter': p.riftPending = null; syncMinions(true); return;
    case 'update': {
      const dt = a;
      // regen ticks are a healing skill: the timer holds at full until the shared heal cooldown allows it
      if (p.regen > 0 && (S.regenT = (S.regenT || 0) + dt) >= p.regen && (p.hp < p.maxHp || T2('cleric')) && procHeal(p)) S.regenT = 0;
      else if (S.regenT > p.regen) S.regenT = p.regen;
      if (T3('mage') && G.enemies.length && (S.novaT = (S.novaT || 0) + dt) >= Math.max(1.2, p.novaCd)) { S.novaT = 0; arcaneNova(p); }
      tryBardFinale();
      if (G.ins > 0 && !G.enemies.length) G.ins = Math.max(0, G.ins - dt * 2);       // inspiration fades out of combat
      syncMinions(false); updMinions(dt);
      return;
    }
  }
}

// ---------------------------------------------------------------- class abilities
function quakeWave(p) {                                     // warrior 5: ground shock around the player
  const r = p.quakeR, d = playerDmg() * 0.8 * p.quakeMul, attackCtx = newCombatAttack();
  SFX.slam(); shake(3); ring(p.x, p.y - 3, r, [255, 170, 110], 0.3);
  burst(p.x, p.y, 16, ['#ff8a5a', '#ffd0a0', '#8a8098'], { sp: 90, life: 0.35 });
  for (const e of G.enemies) if (e.spawn <= 0 && e.hp > 0 && !e.air && dist(p.x, p.y, e.x, e.y) < r + e.hw) damageEnemy(e, d, false, e.x - p.x, e.y - p.y, { kb: 200, col: '#ff8a5a', attackCtx });
}
// ranger 5: homing knives, either from the player (melee swing) or split off a projectile hit (never chain-splits)
function throwKnives(p, ang, dmg, n, x = p.x, y = p.y - 6, skip = null) {
  for (let i = 0; i < n; i++) { const a = ang + (i - (n - 1) / 2) * 0.5 + (skip ? Math.PI * 0.15 * (i % 2 ? 1 : -1) : 0);
    G.shots.push({ x, y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 3, dmg: Math.max(1, dmg), crit: false, kb: 40, friendly: true, life: 0.55,
      kind: 'knife', hit: new Set(skip ? [skip] : []), pierce: 0, homing: true, proc: false, split: true }); }
}
const ELEMENTS = [['burn', '点燃'], ['freeze', '冻结'], ['poison', '中毒'], ['chain', '闪电']];
function randomElement(e, n) {                               // mage 3: one random element on hit
  if (e.hp <= 0) return; const [k] = pick(ELEMENTS);
  if (k === 'burn') applyBurnStatus(e); else if (k === 'poison') applyPoisonStatus(e);
  else if (k === 'freeze') tryFreezeEnemy(e, 0.9); else if (k === 'chain') chainLightning(e, Math.max(1, n * 0.5), 2);
}
function arcaneNova(p) {                                     // mage 5: burst around the player, applies an element
  const r = 46, d = playerDmg() * 1.1 * p.novaMul, attackCtx = newCombatAttack();
  SFX.zap(); ring(p.x, p.y - 6, r, [120, 170, 255], 0.35); burst(p.x, p.y - 6, 24, ['#6aa8ff', '#c8e0ff', '#ffffff'], { sp: 110, life: 0.4 });
  for (const e of G.enemies) if (e.spawn <= 0 && e.hp > 0 && dist(p.x, p.y - 6, e.x, e.y - e.h / 2) < r + e.hw) { damageEnemy(e, d, false, e.x - p.x, e.y - p.y, { kb: 120, col: '#8ac0ff', attackCtx }); randomElement(e, d); }
}
function smite(p) {                                          // cleric 5: pillars of light on the nearest enemies
  const S = CS(); if ((S.smiteT || 0) > G.time) return; S.smiteT = G.time + 0.6;
  const list = G.enemies.filter(e => e.spawn <= 0 && e.hp > 0).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y)).slice(0, p.smiteN);
  for (const e of list) { const x = e.x, y = e.y;
    G.later.push({ t: 0.12, fn: () => { if (e.hp > 0) damageEnemy(e, playerDmg() * 1.6 * p.smiteMul, false, 0, -1, { kb: 40, col: '#fff0a0' });
      ring(x, y - 2, 12, [255, 240, 170], 0.3);
      for (let k = 0; k < 10; k++) G.parts.push({ x: x + rnd(-2, 2), y: y - rnd(0, 40), vx: 0, vy: rnd(-30, -10), life: 0.4, max: 0.4, col: k % 2 ? '#ffffff' : '#ffe080', size: 1, grav: 0, add: true }); } }); }
  if (list.length) SFX.magic();
}
// The finale is a full-screen nuke and had no independent cooldown: a piercing note refilled the whole
// inspiration bar in one swing, so it could fire several times per second.
const FINALE_CD = 3;
function addIns(n) {                                         // bard 3/5: inspiration stacks, finale at full
  const p = G.player; if (!T2('bard') || CS().inFinale) return;
  G.ins = Math.min(p.insCap, (G.ins || 0) + n);
  tryBardFinale();
}
function tryBardFinale() {
  const p = G.player, S = CS();
  if (!T3('bard') || S.inFinale || G.mode !== 'play' || G.ins < p.insCap || G.time < (S.finaleT || 0)) return false;
  if (!G.room || G.room.type === 'town' || !G.enemies.some(e => e.spawn <= 0 && e.hp > 0 && !e.dead && !e.hidden)) return false;
  // A full bar waits through cooldown instead of silently being spent.
  G.ins = 0; S.finaleT = G.time + FINALE_CD; finale(p); return true;
}
function finale(p) {
  SFX.win(); shake(6); G.flash = 0.25; addFloat(p.x, p.y - 28, '终章!', '#ff8ad8', true); ring(p.x, p.y - 6, 150, [255, 140, 220], 0.6);
  const d = playerDmg() * 2.5 * p.finaleMul, attackCtx = newCombatAttack(); CS().inFinale = true;
  for (const e of [...G.enemies]) if (e.spawn <= 0 && e.hp > 0 && !e.dead) damageEnemy(e, d, false, e.x - p.x, e.y - p.y, { kb: 160, col: '#ff8ad8', attackCtx });
  for (const e of [...G.enemies]) if (e.spawn <= 0 && e.hp > 0 && !e.dead) tryFreezeEnemy(e, 1.5);
  CS().inFinale = false;
}

// ---------------------------------------------------------------- minions (summoner): untargetable allies that follow you
// spirit: floats, fires homing bolts. hound: dashes and bites. ghost: temporary spirit from the summoner 5-piece.
const MINION = {
  spirit: { cd: 1.0, range: 120, dmg: 0.55 },
  hound: { cd: 0.9, range: 100, dmg: 0.75 },
  ghost: { cd: 0.8, range: 120, dmg: 0.45 },
};
const TEMP_GHOST_CAP = 2, TEMP_GHOST_LIFE = 6;
function addMinion(kind, x, y, life = 0) {
  if (kind === 'ghost') {
    if (G.minions.filter(m => m.kind === 'ghost' && m.life > 0).length >= TEMP_GHOST_CAP) return;
    life = TEMP_GHOST_LIFE;
  } else if (!life && G.minions.filter(m => !m.max).length >= GEAR_CAPS.minions) return;
  G.minions.push({ kind, x, y, vx: 0, vy: 0, t: rnd(0.2, 0.8), a: rnd(0, 6.28), life, max: life, state: 0, anim: rnd(0, 3) });
  burst(x, y - 6, 10, ['#b48aff', '#ffffff'], { sp: 50, life: 0.35 });
}
// keep permanent minions within the stat ceiling; snap them to the player on room entry
function syncMinions(snap) {
  const p = G.player; if (!G.minions) G.minions = [];
  // Repair malformed/old temporary ghosts before counting permanent equipment summons.
  let ghosts = 0;
  G.minions = G.minions.filter(m => {
    if (m.kind !== 'ghost') return true;
    if (!Number.isFinite(m.max) || m.max <= 0) m.max = TEMP_GHOST_LIFE;
    if (!Number.isFinite(m.life)) m.life = TEMP_GHOST_LIFE;
    m.max = Math.min(m.max, TEMP_GHOST_LIFE); m.life = Math.min(m.life, m.max);
    return m.life > 0 && ++ghosts <= TEMP_GHOST_CAP;
  });
  const perm = G.minions.filter(m => !m.max), want = G.room && G.room.type === 'town' ? 0 : Math.min(GEAR_CAPS.minions, Math.max(0, Math.floor(p.minions || 0)));
  for (let i = perm.length; i < want; i++) addMinion(p.minionKind || 'spirit', p.x + rnd(-10, 10), p.y + rnd(-6, 6));
  if (perm.length > want) { const drop = new Set(perm.slice(want)); G.minions = G.minions.filter(m => !drop.has(m)); }
  for (const m of G.minions) if (!m.max && m.kind !== p.minionKind && (m.kind === 'spirit' || m.kind === 'hound')) m.kind = p.minionKind || 'spirit';
  if (snap) { G.minions = G.minions.filter(m => !m.max); for (const m of G.minions) { m.x = p.x + rnd(-10, 10); m.y = p.y + rnd(-6, 6); m.vx = m.vy = 0; } }
}
function updMinions(dt) {
  const p = G.player, attackSpeed = minionAttackSpeed(p);
  for (const m of G.minions) {
    m.anim += dt; m.t -= dt * attackSpeed; if (m.max) { m.life -= dt; if (m.life <= 0) continue; }
    const M = MINION[m.kind], tgt = minionAttackTarget(m, nearestEnemy(m.x, m.y - 6, M.range));
    let gx, gy;
    if (m.kind === 'hound' && m.state === 1) {               // dashing
      m.x += m.vx * dt; m.y += m.vy * dt; m.dash -= dt;
      for (const e of G.enemies) if (e.spawn <= 0 && e.hp > 0 && !m.hit.has(e) && dist(m.x, m.y, e.x, e.y) < e.hw + 5) {
        m.hit.add(e); damageEnemy(e, minionDmg(M), false, m.vx, m.vy, { kb: 90, col: '#d8c8ff', fromMinion: true, attackCtx: m.attackCtx }); minionProc(e); }
      if (m.dash <= 0 || boxHits(G.room, m.x, m.y, 2, 2, 'walk')) { m.state = 0; m.vx = m.vy = 0; }
      continue;
    }
    if (tgt && m.t <= 0) {
      m.t = M.cd;
      if (m.kind === 'hound') { const a = Math.atan2(tgt.y - m.y, tgt.x - m.x); m.state = 1; m.dash = 0.32; m.vx = Math.cos(a) * 190; m.vy = Math.sin(a) * 190; m.hit = new Set(); m.attackCtx = newCombatAttack(); m.commandUntil = 0; SFX.swing(); continue; }
      if (!minionRoleAttack(m, M, tgt)) m.t = 0;
    }
    // drift: orbit the player, lean toward the target
    m.a += dt * 1.2; const orbitR = 16 + (G.minions.indexOf(m) % 3) * 6;
    gx = p.x + Math.cos(m.a) * orbitR; gy = p.y - 2 + Math.sin(m.a) * orbitR * 0.6;
    if (tgt && m.kind === 'spirit' && summonWeaponRole() === 'guard' && !(m.guardRest > 0)) { gx = tgt.x; gy = tgt.y; }
    m.guardRest = Math.max(0, (m.guardRest || 0) - dt);
    if (tgt && m.kind === 'hound') { gx = lerp(gx, tgt.x, 0.5); gy = lerp(gy, tgt.y, 0.5); }
    m.x = lerp(m.x, gx, clamp(dt * 4)); m.y = lerp(m.y, gy, clamp(dt * 4));
  }
  G.minions = G.minions.filter(m => !m.max || m.life > 0);
}
// Armies of up to four allies retain their original cadence; larger armies share
// an attack budget. Keep each hit intact so integer damage cannot punish adding
// an ally. Live ghosts share the cadence too, limiting their on-hit proc rate.
const SUMMON_FULL_SPEED_COUNT = 4;
const MINION_WEAPON_SPEED_MIN = .4, MINION_WEAPON_SPEED_MAX = 2.5, MINION_EFFECTIVE_SPEED_CAP = 3;
const summonSpeedScale = () => {
  const count = (G.minions || []).filter(m => !m.max || m.life > 0).length;
  return Math.sqrt(Math.min(1, SUMMON_FULL_SPEED_COUNT / Math.max(1, count)));
};
// Runtime and the attribute panel use the same final speed. Weapon trade-offs apply once;
// role gear and weapon growth share a ceiling before larger armies split their attack budget.
const minionAttackSpeed = (p = G.player) => {
  const weaponSpeed = clamp(p.minionCadence || 1, MINION_WEAPON_SPEED_MIN, MINION_WEAPON_SPEED_MAX);
  return Math.min(MINION_EFFECTIVE_SPEED_CAP, (p.minionSpd || 1) * weaponSpeed) * summonSpeedScale();
};
const minionDmg = M => Math.max(1, playerDmg() * M.dmg * G.player.minionDmg);
function minionProc(e) {
  const p = G.player; if (e.hp <= 0) return;
  // minion statuses are capped like the player's, otherwise stacked gear makes them certainties again
  if (p.minionBurn && rand() < Math.min(p.minionBurn, COMBAT_LIMITS.burnChance)) applyBurnStatus(e);
  if (p.minionPoison && rand() < Math.min(p.minionPoison, COMBAT_LIMITS.poisonChance)) applyPoisonStatus(e);
}

// ---------------------------------------------------------------- looks: minions, projectiles, held weapons, sounds
const SPIRIT_ROWS = [['..oo..', '.owwo.', 'owewew', 'owwwwo', '.owwo.', 'o.oo.o'], ['..oo..', '.owwo.', 'owewew', 'owwwwo', '.owwo.', '.o..o.']];
SPR.spirit = SPIRIT_ROWS.map(r => makeSprite(r, { o: '#3a2a5a', w: '#c8b0ff', e: '#ffffff' }));
SPR.ghost = SPIRIT_ROWS.map(r => makeSprite(r, { o: '#1a4a3a', w: '#8affc8', e: '#ffffff' }));
SPR.hound = [['........', 'o.......', 'oo.oooo.', 'owwwwwwo', 'oewwwwwo', '.owo.owo', '.oo..oo.'], ['........', 'o.......', 'oo.oooo.', 'owwwwwwo', 'oewwwwwo', 'owo...ow', 'oo....oo']]
  .map(r => makeSprite(r, { o: '#3a3040', w: '#e4dcc4', e: '#b48aff' }));
function drawMinion(m, time, owner = G.player, weapon = G.eq.weapon) {
  const fly = m.kind !== 'hound', bob = fly ? Math.sin(m.anim * 4) * 1.5 + 8 : 0, s = minionAppearance(m, weapon)[Math.floor(m.anim * 6) % 2];
  shadow(m.x, m.y, 3);
  drawSpr(g, s, m.x, m.y - bob, { flip: owner.x < m.x, alpha: m.max ? clamp(m.life / 1.5) * 0.85 : 0.95 });
}
const MINION_LIGHT = { spirit: [180, 140, 255], ghost: [120, 255, 190], hound: [160, 130, 220] };
Object.assign(SHOT_SPARK, { knife: ['#d8e0f0', '#ffffff'], orb: ['#6aa8ff', '#ffffff'], holy: ['#ffe080', '#ffffff'], note: ['#ff8ad8', '#ffffff'], rbolt: ['#b48aff', '#ffffff'] });
Object.assign(SHOT_LIGHT, { knife: [200, 210, 230], orb: [110, 160, 255], holy: [255, 230, 140], note: [255, 140, 220], rbolt: [180, 130, 255] });
SHOT_DRAW.knife = s => { const a = s.rot, c = Math.cos(a), d = Math.sin(a); for (let i = -2; i <= 2; i++) px(s.x + c * i, s.y + d * i, 1, 1, i > 0 ? '#ffffff' : '#a0a8c0'); };
SHOT_DRAW.orb = s => { const r = 3 + Math.sin(s.rot * 0.5) * 0.6; ellipse(s.x, s.y, r, r, '#6aa8ff'); px(s.x - 1, s.y - 1, 3, 3, '#c8e0ff'); px(s.x, s.y, 1, 1, '#ffffff'); };
SHOT_DRAW.holy = s => { px(s.x - 1, s.y - 3, 3, 7, '#ffe080'); px(s.x - 3, s.y - 1, 7, 3, '#ffe080'); px(s.x, s.y - 2, 1, 5, '#ffffff'); px(s.x - 2, s.y, 5, 1, '#ffffff'); };
SHOT_DRAW.note = s => { const k = Math.floor(s.rot / 3) % 2; px(s.x - 2, s.y + 1, 3, 2, '#ff8ad8'); px(s.x, s.y - 4 - k, 1, 5, '#ff8ad8'); px(s.x + 1, s.y - 4 - k, 2, 1, '#ffffff'); };
SHOT_DRAW.rbolt = s => { px(s.x - 1, s.y - 1, 3, 3, '#b48aff'); px(s.x, s.y, 1, 1, '#ffffff'); };
Object.assign(WLEN, { knives: 6, tome: 0, scepter: 12, lute: 0, rod: 12, horn: 0 });
WEAPON_DRAW.tome = (hx, hy, ang, [main, dark, hl]) => { px(hx - 3, hy - 3, 6, 5, dark); px(hx - 2, hy - 2, 4, 3, main); px(hx, hy - 3, 1, 5, hl); };
WEAPON_DRAW.lute = (hx, hy, ang, [main, dark, hl]) => { const c = Math.cos(ang), s = Math.sin(ang);
  px(hx - 2, hy - 1, 4, 4, main); px(hx - 1, hy, 2, 2, dark); for (let i = 2; i < 9; i++) px(hx + c * i, hy + s * i, 1, 1, dark); px(hx + c * 9, hy + s * 9, 2, 1, hl); };
WEAPON_DRAW.horn = (hx, hy, ang, [main, dark, hl]) => { const c = Math.cos(ang), s = Math.sin(ang), pc = -s, ps = c;
  for (let i = 0; i < 7; i++) { const w = i < 4 ? 0 : i - 3; for (let j = -w; j <= w; j++) px(hx + c * i + pc * j, hy + s * i + ps * j, 1, 1, i === 6 ? hl : main); } };
WEAPON_DRAW.scepter = (hx, hy, ang, [main, dark, hl]) => { const c = Math.cos(ang), s = Math.sin(ang);
  for (let i = 0; i < 10; i++) px(hx + c * i, hy + s * i, 1, 1, dark); const x = hx + c * 11, y = hy + s * 11;
  px(x - 1, y - 2, 3, 5, main); px(x - 2, y - 1, 5, 3, main); px(x, y - 1, 1, 3, hl); };
WEAPON_DRAW.rod = (hx, hy, ang, [main, dark, hl]) => { const c = Math.cos(ang), s = Math.sin(ang);
  for (let i = 0; i < 10; i++) px(hx + c * i, hy + s * i, 1, 1, dark); px(hx + c * 11 - 1, hy + s * 11 - 1, 3, 3, main); px(hx + c * 11, hy + s * 11, 1, 1, hl); };
WEAPON_DRAW.knives = (hx, hy, ang, [main, dark]) => { const c = Math.cos(ang), s = Math.sin(ang); for (let i = 0; i < 5; i++) px(hx + c * i, hy + s * i, 1, 1, i < 2 ? dark : main); };
Object.assign(WSFX, { knives: () => SFX.swing(), tome: () => SFX.magic(), scepter: () => SFX.magic(), rod: () => SFX.magic(),
  lute: () => tone(660 + rint(0, 4) * 110, 0.12, { type: 'triangle', vol: 0.13 }), horn: () => tone(220, 0.25, { type: 'sawtooth', vol: 0.12, slide: 1.2 }) });

// ---------------------------------------------------------------- HUD (low-res canvas, top strip): holy shields + inspiration + active sets
function classHud() {
  const p = G.player; if (!p.set) return;
  let x = 86;
  for (let i = 0; i < (G.holyShield || 0); i++) { g.fillStyle = '#ffe080'; g.fillRect(x + i * 5, 5, 3, 4); g.fillStyle = '#ffffff'; g.fillRect(x + i * 5, 5, 3, 1); }
  if (G.holyShield) x += G.holyShield * 5 + 3;
  if (T2('bard')) { const w = 30, k = clamp((G.ins || 0) / p.insCap);
    g.fillStyle = '#3a2038'; g.fillRect(x, 6, w, 2); g.fillStyle = k > 0.9 && Math.floor(G.time * 8) % 2 ? '#ffffff' : '#ff8ad8'; g.fillRect(x, 6, Math.round(w * k), 2); x += w + 4; }
  // one coloured pip per active set tier, bottom-left above the gear slots
  let bx = 4; const by = LH - 16;
  for (const c of CLASS_IDS) { const t = p.set[c]; if (!t) continue; const col = CLASSES[c].col;
    for (let i = 0; i < 3; i++) { g.fillStyle = i < t ? col : '#2a2030'; g.fillRect(bx + i * 3, by, 2, 2); } bx += 11; }
}
// pause-screen panel: classes you wear, piece count, the best active tier and what the next tier gives. Fits into maxH.
function drawSetPanel(x0, y0, w, maxH) {
  const p = G.player, n = p.setN || {}, list = CLASS_IDS.filter(c => n[c] > 0).sort((a, b) => n[b] - n[a]);
  if (!list.length || maxH < 22) return;
  const rowH = 13, fit = Math.max(1, Math.min(list.length, Math.floor((maxH - 12) / rowH)));
  panel(x0, y0, x0 + w, y0 + 11 + fit * rowH, '#18101a', '#6a5a78', 0.92);
  T('职业套装 · 含鞋子', x0 + 6, y0 + 6.5, 5, '#ffe6b0', 'left');
  list.slice(0, fit).forEach((c, i) => { const y = y0 + 15 + i * rowH, C = CLASSES[c], t = p.set[c];
    T(`${C.name} ${n[c]}/${SET_AT[Math.min(t, 2)]}`, x0 + 6, y, 4.8, C.col, 'left');
    for (let k = 0; k < 3; k++) { hg.fillStyle = k < t ? C.col : '#3a3044'; hg.fillRect((x0 + w - 18 + k * 4) * U, (y - 1.5) * U, 3 * U, 3 * U); }
    const txt = t ? SET_FX[c][t - 1] : `${SET_AT[0]} 件：${SET_FX[c][0]}`;
    T(txt.length > 24 ? txt.slice(0, 23) + '…' : txt, x0 + 8, y + 5.5, 4, t ? '#f0e8dc' : '#6a5f76', 'left'); });
}
