'use strict';
// ============================================================ 主题装备: 8 pieces per act (acts 2-6), each tagged with `act`.
// Drop rules (rollItem wrapper below): themed gear only drops inside its own act; while in an act, 30% of rolls are taken from
// that act's theme pool first; the legendary of an act only drops after that act has been cleared once (any difficulty).
// Every act has one piece that resists its map mechanic. Gear behaviour lives in GEAR_HOOK (called through classHook).
// Loaded after the act files and classes.js; touches no other file except through the wrappers at the bottom.

// stat fields used only by this gear, defaulted on every recalc (baseStats has no entry for them).
// recalcStats() merges the fresh stat block with Object.assign(p, s), which only overwrites the keys s actually has:
// a field that is missing here would therefore survive unequipping and keep working forever. Every flag a gear `mod`
// writes has to be listed (or be part of baseStats), and tools/tests/run.js#stat_residue fails if one is forgotten.
const GEAR_STATS = { iceGrip: false, coldRes: 1, frostNova: 0, frostBite: 0, windAnchor: false, bogRes: false, sporeRes: false, tideRes: false, toxOnHit: 0, venomBurst: 0, sporeBurst: 0,
  sandFoot: false, sunShade: false, mirrorWard: 0, sandSlash: 0, voidStep: false, zapRes: false, timeBoost: false, starSight: false, stormCall: 0,
  corruptRes: 1, riftDash: false, voidLeech: 0, oblivion: false,
  stormOnAttack: false, chakReturn: false, minionFreeze: 0, minionChain: 0,
  wpnSpdMul: 1 };                 // complete weapon speed multiplier; reset when unequipped
const ACT_GEAR = [
  // ------------------------------------------------------------ 第二幕 · 霜原
  { act: 2, id: 'g2_icebrand', cls: 'warrior', tier: 1, slot: 'weapon', name: '霜纹战斧', icon: ['axe', '#a8e0ff', '#3a6a9a', '#ffffff'],
    lines: ['重劈，攻击力 +0.5', '20% 几率冻结敌人'], mod: W('axe', s => { s.dmg += 0.5; s.freeze += 0.2; }) },
  { act: 2, id: 'g2_wolfbow', cls: 'ranger', tier: 1, slot: 'weapon', name: '狼牙骨弓', icon: ['bow', '#e8eef8', '#6a7a98', '#ffffff'],
    lines: ['发射箭矢，穿透 +1', '暴击率 +5%'], mod: W('bow', s => { s.pierce += 1; s.crit += 0.05; }) },
  { act: 2, id: 'g2_snowstaff', cls: 'mage', tier: 2, slot: 'weapon', name: '暴雪法杖', icon: ['staff', '#e0f4ff', '#4a6a9a', '#ffffff'],
    lines: ['发射魔法飞弹', '18% 几率冻结敌人', '冻结的敌人受到的伤害 +30%'], mod: W('staff', s => { s.freeze += 0.18; s.frostBite = 0.3; }) },
  { act: 2, id: 'g2_furcoat', cls: '', tier: 1, slot: 'armor', name: '雪狼毛皮大衣', icon: ['cloak', '#e8eef8', '#8a98b0', '#ffffff'],
    lines: ['生命上限 +1', '寒冷积累速度 -60%', '冰面上不会打滑'], mod: s => { s.maxHp += 2; s.coldRes *= 0.4; s.iceGrip = true; } },
  { act: 2, id: 'g2_spikeboots', cls: 'ranger', tier: 0, slot: 'trinket', name: '冰爪靴', icon: ['boots', '#a8c8e0', '#3a4a68', '#ffffff'],
    lines: ['移动速度 +8%', '冰面上不会打滑'], mod: s => { s.speed *= 1.08; s.iceGrip = true; } },
  { act: 2, id: 'g2_hearthstone', cls: 'cleric', tier: 1, slot: 'trinket', name: '炉心石', icon: ['gem', '#ff8a30', '#8a3a10', '#ffe080'],
    lines: ['每 14 秒回复半颗心', '寒冷积累速度 -40%'], mod: s => { s.regen = s.regen ? Math.min(s.regen, 14) : 14; s.coldRes *= 0.6; } },
  { act: 2, id: 'g2_anchor', cls: 'warrior', tier: 2, slot: 'trinket', name: '冰川锚链', icon: ['ring', '#8a92a8', '#3a4458', '#d0d8e8'],
    lines: ['生命上限 +1，格挡 +4%', '强风推不动你'], mod: s => { s.maxHp += 2; s.block += 0.04; s.windAnchor = true; } },
  { act: 2, id: 'g2_crown', cls: 'mage', tier: 3, slot: 'trinket', name: '永冬之冠', icon: ['crown', '#c8f0ff', '#4a6ad0', '#ffffff'], legend: true,
    lines: ['所有触发几率 ×1.12', '冻结敌人时向四周飞出冰刺', '“冬天从不在乎你的名字。”'], mod: s => { s.procMul *= 1.12; s.frostNova += 1; } },
  // ------------------------------------------------------------ 第三幕 · 腐沼
  { act: 3, id: 'g3_toadspear', cls: 'warrior', tier: 1, slot: 'weapon', name: '蟾舌长矛', icon: ['spear', '#6a9a3a', '#3a5a1a', '#d0f0a0'],
    lines: ['突刺攻击，攻击距离 +20%', '24% 几率使敌人中毒'], mod: W('spear', s => { s.reachMul *= 1.2; s.poison += 0.24; }) },
  { act: 3, id: 'g3_blowgun', cls: 'ranger', tier: 1, slot: 'weapon', name: '沼民吹箭', icon: ['dagger', '#7adc5a', '#2a5a2a', '#d0ffb0'],
    lines: ['快速投出飞刀', '36% 几率使敌人中毒'], mod: W('knives', s => { s.poison += 0.36; }) },
  { act: 3, id: 'g3_mycotome', cls: 'summoner', tier: 2, slot: 'weapon', name: '菌丝魔典', icon: ['book', '#9a3ab0', '#3a1a3a', '#f0d0ff'],
    lines: ['召唤 2 只灵体', '召唤物攻击 30% 几率中毒', '敌人死亡时 25% 几率留下孢子云（只伤敌人）'], mod: W('rod', s => { s.minions += 2; s.minionPoison += 0.3; s.sporeBurst += 0.25; }) },
  { act: 3, id: 'g3_bogwaders', cls: '', tier: 0, slot: 'armor', name: '沼泽涉水靴甲', icon: ['armor', '#5a6a3a', '#2a3a1a', '#a8c070'],
    lines: ['生命上限 +1', '毒水与潮水不再减速'], mod: s => { s.maxHp += 2; s.bogRes = true; s.tideRes = true; } },
  { act: 3, id: 'g3_mask', cls: 'cleric', tier: 1, slot: 'trinket', name: '药草面罩', icon: ['amulet', '#8ac040', '#3a5a1a', '#e0ffb0'],
    lines: ['不会中毒', '孢子云对你无效'], mod: s => { s.sporeRes = true; } },
  { act: 3, id: 'g3_leechcharm', cls: 'cleric', tier: 1, slot: 'trinket', name: '血蛭护符', icon: ['fang', '#c84a5a', '#5a1a2a', '#ffb0b8'],
    lines: ['击杀时 7% 回复半颗心', '攻击中毒的敌人时 5% 回复半颗心'], mod: s => { s.vamp += 0.07; s.toxOnHit += 0.05; } },
  { act: 3, id: 'g3_frogdrum', cls: 'bard', tier: 2, slot: 'trinket', name: '蛙皮手鼓', icon: ['note', '#6a9a3a', '#2a4a1a', '#d0f0a0'],
    lines: ['攻击速度 +7%', '灵感积累 +50%'], mod: s => { s.atkSpd *= 1.07; s.insGain *= 1.5; } },
  { act: 3, id: 'g3_heartrot', cls: 'mage', tier: 3, slot: 'trinket', name: '腐心', icon: ['heart', '#6adc5a', '#2a4a1a', '#d0ffc0'], legend: true,
    lines: ['点燃与中毒伤害 +36%', '中毒的敌人死亡时爆出毒雾（只伤敌人）', '“它还在发酵。”'], mod: s => { s.dotMul += 0.36; s.venomBurst += 1; } },
  // ------------------------------------------------------------ 第四幕 · 黄沙
  { act: 4, id: 'g4_khopesh', cls: 'warrior', tier: 1, slot: 'weapon', name: '镰形弯刀', icon: ['sword', '#ecba40', '#6a4a20', '#fff0c0'],
    lines: ['挥砍攻击，攻击力 +0.5', '每第 4 次挥砍扬起一道沙刃'], mod: W('sword', s => { s.dmg += 0.5; s.sandSlash += 1; }) },
  { act: 4, id: 'g4_scorpbow', cls: 'ranger', tier: 2, slot: 'weapon', name: '蝎尾弩', icon: ['bow', '#c8883a', '#5a3a10', '#ffe080'],
    lines: ['发射箭矢，攻击力 +0.5', '30% 几率使敌人中毒'], mod: W('bow', s => { s.dmg += 0.5; s.poison += 0.3; }) },
  { act: 4, id: 'g4_sunrod', cls: 'cleric', tier: 1, slot: 'weapon', name: '日轮权杖', icon: ['holy', '#ffd040', '#c84a20', '#fff6d0'],
    lines: ['发射圣光弹，命中时溅射', '15% 几率点燃敌人'], mod: W('scepter', s => { s.burn += 0.15; }) },
  { act: 4, id: 'g4_wraps', cls: '', tier: 1, slot: 'armor', name: '沙行者裹布', icon: ['robe', '#d8ccaa', '#8a7a5a', '#ffffff'],
    lines: ['移动速度 +8%', '流沙拖不动你', '烈日光柱不会灼伤你'], mod: s => { s.speed *= 1.08; s.sandFoot = true; s.sunShade = true; } },
  { act: 4, id: 'g4_scarab', cls: 'summoner', tier: 1, slot: 'trinket', name: '圣甲虫护符', icon: ['amulet', '#3a8a5a', '#1a3a2a', '#8affc8'],
    lines: ['召唤物 +1', '召唤物伤害 +12%'], mod: s => { s.minions += 1; s.minionDmg *= 1.12; } },  { act: 4, id: 'g4_mirror', cls: 'mage', tier: 2, slot: 'trinket', name: '镜面护符', icon: ['eye', '#c8d8ff', '#4a5a8a', '#ffffff'],
    lines: ['被敌人弹道击中时 25% 几率', '把弹道反射回去'], mod: s => { s.mirrorWard += 0.25; } },
  { act: 4, id: 'g4_sistrum', cls: 'bard', tier: 1, slot: 'weapon', name: '叉铃', icon: ['lute', '#ecba40', '#8a6a20', '#fff0c0'],
    lines: ['弹奏音符，穿透所有敌人', '暴击率 +6%'], mod: W('lute', s => { s.crit += 0.06; }) },
  { act: 4, id: 'g4_ankh', cls: 'cleric', tier: 3, slot: 'trinket', name: '安卡之钥', icon: ['holy', '#ffe080', '#2a4aa0', '#ffffff'], legend: true,
    lines: ['生命上限 +2，所有治疗 +半颗心', '每个房间抵挡一次伤害', '“死亡只是另一扇门。”'], mod: s => { s.maxHp += 4; s.healBonus += 1; s.shield = true; } },
  // ------------------------------------------------------------ 第五幕 · 天穹
  { act: 5, id: 'g5_thunderhammer', cls: 'warrior', tier: 2, slot: 'weapon', name: '雷鸣之锤', icon: ['hammer', '#ffe060', '#5a6a90', '#ffffff'],
    lines: ['环形重击，攻击力 +0.5', '21% 几率引发连锁闪电'], mod: W('hammer', s => { s.dmg += 0.5; s.chain += 0.21; }) },
  { act: 5, id: 'g5_gale', cls: 'ranger', tier: 1, slot: 'weapon', name: '疾风短弓', icon: ['bow', '#d0f8f0', '#3a6a7a', '#ffffff'],
    lines: ['发射箭矢，射速 +15%', '攻击力 -0.25'], mod: W('bow', s => { s.atkSpd *= 1.15; s.dmg -= 0.25; }) },
  { act: 5, id: 'g5_clockstaff', cls: 'mage', tier: 1, slot: 'weapon', name: '发条法杖', icon: ['staff', '#ecba40', '#7a6a40', '#ffffff'],
    lines: ['发射魔法飞弹', '加速领域里攻速再 +30%，减速领域不影响你'], mod: W('staff', s => { s.timeBoost = true; }) },
  { act: 5, id: 'g5_cloudplate', cls: '', tier: 1, slot: 'armor', name: '云纹轻甲', icon: ['armor', '#d8e4f4', '#6a7a9a', '#ffffff'],
    lines: ['生命上限 +1', '掉进虚空坑不会受伤（仍会回到入口）', '雷击不会麻痹你'], mod: s => { s.maxHp += 2; s.voidStep = true; s.zapRes = true; } },
  { act: 5, id: 'g5_lantern', cls: 'summoner', tier: 1, slot: 'trinket', name: '星光提灯', icon: ['lantern', '#c8a0ff', '#3a2a6a', '#ffffff'],
    lines: ['召唤物 +1', '黑暗中你的照明范围翻倍'], mod: s => { s.minions += 1; s.starSight = true; } },
  { act: 5, id: 'g5_feather', cls: 'bard', tier: 2, slot: 'trinket', name: '风暴之羽', icon: ['feather', '#e8eef8', '#3a4a68', '#ffe060'],
    lines: ['移动速度 +10%，翻滚冷却 -12%', '击杀时 20% 几率召唤一道落雷'], mod: s => { s.speed *= 1.1; s.rollCd *= 0.88; s.stormCall += 0.2; } },
  { act: 5, id: 'g5_halo', cls: 'cleric', tier: 1, slot: 'trinket', name: '晨星光环', icon: ['ring', '#fff0b0', '#a08030', '#ffffff'],
    lines: ['所有治疗量 +半颗心', '每 16 秒回复半颗心'], mod: s => { s.healBonus += 1; s.regen = s.regen ? Math.min(s.regen, 16) : 16; } },
  { act: 5, id: 'g5_skybreaker', cls: 'warrior', tier: 3, slot: 'weapon', name: '破天之刃', icon: ['sword', '#e8eef8', '#ecba40', '#ffffff'], legend: true,
    lines: ['攻击力 +1.5，攻击范围 +20%', '每次攻击都召唤一道落雷', '“天空也会流血。”'], mod: W('sword', s => { s.dmg += 1.5; s.reachMul *= 1.2; s.stormCall += 1; s.stormOnAttack = true; }) },
  // ------------------------------------------------------------ 第六幕 · 虚空终焉
  { act: 6, id: 'g6_riftblade', cls: 'ranger', tier: 2, slot: 'weapon', name: '裂隙双刃', icon: ['dagger', '#b45aff', '#3a1a5a', '#ffffff'],
    lines: ['疾刺连击，暴击率 +7%', '闪避结束并恢复攻击后释放裂隙'], mod: W('dagger', s => { s.crit += 0.07; s.riftDash = true; }) },
  { act: 6, id: 'g6_voidtome', cls: 'mage', tier: 2, slot: 'weapon', name: '虚空魔典', icon: ['book', '#3a1a5a', '#0a0418', '#ff3060'],
    lines: ['奥术球，穿透 2 个敌人', '18% 几率引发连锁闪电', '所有触发几率 ×1.09'], mod: W('tome', s => { s.chain += 0.18; s.procMul *= 1.09; }) },
  { act: 6, id: 'g6_shadeband', cls: 'summoner', tier: 1, slot: 'weapon', name: '影缚魔杖', icon: ['staff', '#2a1a40', '#0a0418', '#8a5aff'],
    lines: ['召唤 2 只灵体', '召唤物攻击速度 +25%'], mod: W('rod', s => { s.minions += 2; s.minionSpd *= 1.25; }) },
  { act: 6, id: 'g6_sigil', cls: '', tier: 1, slot: 'armor', name: '净化圣徽铠', icon: ['armor', '#e0c8ff', '#3a2a5a', '#ffffff'],
    lines: ['生命上限 +1，格挡 +5%', '腐化积累速度 -60%'], mod: s => { s.maxHp += 2; s.block += 0.05; s.corruptRes *= 0.4; } },
  { act: 6, id: 'g6_voidfang', cls: 'warrior', tier: 1, slot: 'trinket', name: '虚空獠牙', icon: ['fang', '#b45aff', '#3a1a5a', '#ffffff'],
    lines: ['攻击力 +0.5', '击杀时 8% 回复半颗心'], mod: s => { s.dmg += 0.5; s.voidLeech += 0.08; } },
  { act: 6, id: 'g6_lastsong', cls: 'bard', tier: 2, slot: 'weapon', name: '终末挽歌', icon: ['horn', '#8a5aff', '#2a1a40', '#ff3060'],
    lines: ['吹出 3 道扇形音波', '击杀时获得 2 层灵感'], mod: W('horn', s => { s.multi = 3; s.insKill += 2; }) },
  { act: 6, id: 'g6_censer', cls: 'cleric', tier: 2, slot: 'trinket', name: '永燃香炉', icon: ['lantern', '#ffe080', '#5a2a5a', '#ffffff'],
    lines: ['圣盾上限 +1', '每 12 秒回复半颗心'], mod: s => { s.shieldCap += 1; s.regen = s.regen ? Math.min(s.regen, 12) : 12; } },
  { act: 6, id: 'g6_oblivion', cls: '', tier: 3, slot: 'trinket', name: '湮灭之核', icon: ['orb', '#2a0a40', '#000000', '#ff3060'], legend: true,
    lines: ['你造成的伤害 +25%', '击杀时 15% 几率让周围敌人一起湮灭（首领与精英除外）', '“一切终将归于虚无。”'], mod: s => { s.oblivion = true; } },
];

// ---------------------------------------------------------------- register the gear
const GEAR = ACT_GEAR.filter(it => !ITEM_BY_ID[it.id]);
for (const it of GEAR) { ITEMS.push(it); ITEM_BY_ID[it.id] = it; }
const GEAR_BY_ACT = {}; for (const it of GEAR) (GEAR_BY_ACT[it.act] = GEAR_BY_ACT[it.act] || []).push(it);
const GEAR_IDS = new Set(GEAR.map(i => i.id));
// the legendary of an act only starts dropping after that act has been cleared once (any difficulty)
const themeCleared = act => (META.prog[act] && META.prog[act].diff.some(d => d.wins > 0)) || false;

// ---------------------------------------------------------------- stat defaults (baseStats has no fields for these)
const _baseStats = baseStats;
baseStats = function () { const s = _baseStats(); for (const k in GEAR_STATS) if (!(k in s)) s[k] = GEAR_STATS[k]; return s; };

// ---------------------------------------------------------------- damage + combat hooks
const _playerDmg = playerDmg;
playerDmg = function () { const p = G.player; const d = _playerDmg(); return p.oblivion ? d * 1.25 : d; };   // 湮灭之核

const GEAR_PROC_COL = { venom: '#6adc5a', frost: '#a8e0ff', storm: '#ffe060' };

// Player-sourced lightning must never hit the player. skyBolt() in act5.js damages whoever stands in the
// radius, which is intended for the storm-room mechanics, so player gear needs this friendly-only variant.
function skyBoltFriendly(x, y, r, o = {}) {
  areaHitBox(x, y, r, 1, o);
  SFX.zap(); shake(3); ring(x, y, r + 3, [255, 240, 140], 0.25);
  G.bolts.push({ x0: x + rnd(-6, 6), y0: -OY, x1: x, y1: y - 2, life: 0.22 });
  burst(x, y - 2, 12, ['#ffe060', '#ffffff'], { sp: 80, life: 0.3, up: true });
}
// Reserve before enqueueing: branching clouds, executions and explosions use one
// four-burst budget and carry their depth only on the damage that they actually deal.
function queueGearBurst(e, kind, o) {
  const child = reserveKillBurst(o); if (!child) return;
  const origin = { x: e.x, y: e.y }, depth = o.explosionDepth || 0;
  const amount = Math.max(1, playerDmg() * 0.4) * Math.pow(COMBAT_LIMITS.explodeDecay, depth);
  G.later.push({ t: 0.05, fn: () => gearBurst(origin, kind, amount, child) });
}
function gearBurst(e, kind, amount, opts = {}) {              // small themed burst on a hit / kill
  if (kind === 'venom') { ring(e.x, e.y - 4, 26, [110, 220, 90], 0.3); burst(e.x, e.y - 4, 14, ['#6adc5a', '#d0ffb0'], { sp: 80, life: 0.4 });
    const dmg = amount === undefined ? Math.max(1, playerDmg() * 0.4) : amount, attackCtx = newCombatAttack();
    for (const o of G.enemies) if (o !== e && o.spawn <= 0 && o.hp > 0 && dist(e.x, e.y, o.x, o.y) < 30) {
      damageEnemy(o, dmg, false, o.x - e.x, o.y - e.y, { ...opts, attackCtx, kb: 40, col: GEAR_PROC_COL.venom }); } }
  else if (kind === 'oblivion') { const r = 34, attackCtx = newCombatAttack();
    ring(e.x, e.y - 4, r, [255, 60, 120], 0.35);
    burst(e.x, e.y - 4, 20, ['#ff3060', '#2a0a40', '#ffffff'], { sp: 100, life: 0.5 });
    for (const o of G.enemies) if (o.spawn <= 0 && o.hp > 0 && !o.link && !EDEF[o.kind].boss && !EDEF[o.kind].elite && dist(e.x, e.y, o.x, o.y) < r)
      damageEnemy(o, Math.max(1, o.hp + (o.max || 0)), false, o.x - e.x, o.y - e.y, { ...opts, attackCtx, quiet: true, kb: 0 }); }
  else if (kind === 'frost') { ring(e.x, e.y - 4, 34, [160, 220, 255], 0.35); burst(e.x, e.y - 4, 16, ['#ffffff', '#a8e0ff'], { sp: 90, life: 0.45, up: true });
    const o = rnd(0, 1); for (let i = 0; i < 6; i++) { const a = o + i * Math.PI / 3;
      G.shots.push({ x: e.x, y: e.y - 4, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 3, dmg: Math.max(1, playerDmg() * 0.3), crit: false, kb: 60,
        friendly: true, neutral: true, born: G.time, life: 0.5, kind: 'ice', hit: new Set(), pierce: 1 }); } }
  else if (kind === 'storm') { areaHitBox(e.x, e.y, 12, 1); }
}
function areaHitBox(x, y, r, n, o = {}) {                     // friendly-only lightning splash
  const attackCtx = newCombatAttack();
  for (const e of G.enemies) if (e.spawn <= 0 && e.hp > 0 && dist(x, y, e.x, e.y) < r + e.hw) damageEnemy(e, Math.max(1, playerDmg() * 0.8), false, e.x - x, e.y - y, { ...o, attackCtx, kb: 60, col: GEAR_PROC_COL.storm });
}
const _classHook = classHook;
classHook = function (ev, a, b, c) {
  const out = _classHook(ev, a, b, c);
  const p = G.player; if (!p || !p.set) return out;
  const S = CS();
  switch (ev) {
    case 'attack':
      if (p.stormOnAttack && attackProc('storm', 0.35)) skyBoltFriendly(clamp(p.x + Math.cos(p.face) * 26, 20, RPW - 20), clamp(p.y - 8 + Math.sin(p.face) * 18, 26, RPH - 18), 10);   // 破天之刃
      if (p.sandSlash && (S.sandN = (S.sandN || 0) + 1) % 4 === 0 && attackProc('sand', 0.5)) {                  // 镰形弯刀
        G.shots.push({ x: p.x + Math.cos(p.face) * 8, y: p.y - 6, vx: Math.cos(p.face) * 190, vy: Math.sin(p.face) * 190, r: 5,
          dmg: Math.max(1, playerDmg() * 0.7), crit: false, kb: 120, friendly: true, life: 0.45, kind: 'sand', hit: new Set(), pierce: 2, proc: true, attackCtx: c }); }
      return out;
    case 'hit': {                                            // (enemy, dmg, opts)
      const e = a, o = c || {};
      if (e.hp <= 0) return out;
      if (p.toxOnHit && e.poison > 0 && rand() < p.toxOnHit) procHeal(p);                                          // 血蛭护符
      return out;
    }
    case 'kill': {
      const e = a, opts = b || {};
      if (p.voidLeech && rand() < p.voidLeech) procHeal(p);                                                        // 虚空獠牙
      // 腐心 needs poison; 菌丝魔典 can trigger from any kill. A combined loadout creates one cloud.
      const poisonCloud = p.venomBurst && e.poison > 0 && rand() < p.venomBurst;
      if (!e.noBoom && (poisonCloud || (p.sporeBurst && rand() < p.sporeBurst))) queueGearBurst(e, 'venom', opts);
      if (!e.noBoom && p.stormCall && rand() < p.stormCall && attackProc('stormcall', 0.3)) {
        const child = reserveKillBurst(opts);
        if (child) { const x = e.x, y = e.y - 4; G.later.push({ t: 0.05, fn: () => skyBoltFriendly(x, y, 12, child) }); }
      }
      // 首领与精英均免疫湮灭。Executions share the same budget as venom and regular explosions.
      if (!e.noBoom && p.oblivion && !EDEF[e.kind].boss && !EDEF[e.kind].elite && rand() < 0.15) queueGearBurst(e, 'oblivion', opts);
      return out;
    }
    case 'roll':
      // Replace the pending strike on each roll; endless rolling cannot queue a burst of attacks.
      if (p.riftDash) p.riftPending = { dx: p.rdx, dy: p.rdy };
      return out;
    case 'update': {
      if (!p.riftDash) p.riftPending = null;
      else if (p.riftPending && playerAttackRecovered(p)) {
        const a0 = Math.atan2(p.riftPending.dy, p.riftPending.dx); p.riftPending = null;
        G.shots.push({ x: p.x, y: p.y - 6, vx: Math.cos(a0) * 260, vy: Math.sin(a0) * 260, r: 6, dmg: Math.max(1, playerDmg() * 0.6), crit: true,
          kb: 80, friendly: true, life: 0.35, kind: 'mirror', hit: new Set(), pierce: 99, proc: true });
      }
      if (p.starSight && G.room && (G.room.mech === 'dark' || G.room.godDark))                                   // 星光提灯: a much wider lamp
        light(p.x + (G.camOff[0] || 0), p.y - 6 + (G.camOff[1] || 0) + OY, 130, [200, 180, 240], 0.45);
      if (p.sporeRes) p.tox = 0;                                                                                // 药草面罩: immune to poison
      if (p.zapRes && p.stun > 0 && p.stun < 0.4) p.stun = 0;                                                    // 云纹轻甲: lightning does not stun
      if (p.frostNova) for (const e of G.enemies) if (e.frozen > 0 && !e.frostNovaDone) {                        // 永冬之冠
        e.frostNovaDone = true; gearBurst(e, 'frost'); }
      for (const e of G.enemies) if (e.frozen <= 0) e.frostNovaDone = false;
      return out;
    }
  }
  return out;
};

// 镜面护符: incoming enemy shots can be reflected back as your own
const _enemyShot = enemyShot;
enemyShot = function (x, y, ang, sp, kind = 'bone', o = {}) {
  const s = _enemyShot(x, y, ang, sp, kind, o);
  const prev = s.onHit;
  s.onHit = (p, sh) => {
    if (prev) prev(p, sh);
    // The ward belongs to whoever is actually hit, not to whoever the shot was aimed at: reading
    // G.player when the shot was created let one member's charm reflect for another member.
    const ward = p && p.mirrorWard;
    if (ward && rand() < ward) { SFX.block(); addFloat(p.x, p.y - 24, '镜面反射', '#c8d8ff');
      G.shots.push({ x: sh.x, y: sh.y, vx: -sh.vx * 1.4, vy: -sh.vy * 1.4, r: sh.r, dmg: Math.max(1, playerDmg() * 0.8), crit: false, kb: 80,
        friendly: true, life: 1.4, kind: sh.kind, hit: new Set(), pierce: 0, proc: true }); }
  };
  return s;
};

// ---------------------------------------------------------------- map-mechanic resistance (wraps the existing mech hooks)
const _mech = {};
function wrapMech(id, key, fn) {
  const M = MECH[id]; if (!M) return;
  _mech[id] = _mech[id] || {}; _mech[id][key] = M[key];
  M[key] = fn(_mech[id][key], M);
}
wrapMech('ice', 'move', orig => (r, p, dt, vx, vy) => (p.iceGrip ? null : orig(r, p, dt, vx, vy)));                       // 雪狼毛皮大衣: no sliding
wrapMech('wind', 'move', orig => (r, p, dt, vx, vy) => (p.windAnchor ? null : orig(r, p, dt, vx, vy)));                   // 冰川锚链: wind does not push
wrapMech('bog', 'move', orig => (r, p, dt, vx, vy) => (p.bogRes ? null : orig(r, p, dt, vx, vy)));                        // 沼泽涉水靴甲
wrapMech('tide', 'move', orig => (r, p, dt, vx, vy) => (p.tideRes ? null : orig(r, p, dt, vx, vy)));
wrapMech('quicksand', 'move', orig => (r, p, dt, vx, vy) => (p.sandFoot ? null : orig(r, p, dt, vx, vy)));                // 沙行者裹布
wrapMech('clock', 'move', orig => (r, p, dt, vx, vy) => { const out = orig(r, p, dt, vx, vy);
  if (out && p.timeBoost && Math.hypot(out.x, out.y) < Math.hypot(vx, vy) - 0.01) return null;                            // 发条法杖: slow fields do nothing
  return out; });
// cold: scale how fast the meter fills
wrapMech('cold', 'update', orig => (r, dt) => { const p = G.player, before = G.cold || 0; orig(r, dt);
  if ((G.cold || 0) > before && p.coldRes < 1) G.cold = before + (G.cold - before) * p.coldRes; });                       // 毛皮大衣 / 炉心石
// corruption: same idea
wrapMech('corrupt', 'update', orig => (r, dt) => { const before = G.corrupt || 0; orig(r, dt);
  const p = G.player; if ((G.corrupt || 0) > before && p.corruptRes < 1) G.corrupt = before + (G.corrupt - before) * p.corruptRes; });   // 净化圣徽铠
// quicksand centre + void pit fall: no damage for the right boots
const noDamage = (orig, resist) => (r, dt) => { const p = G.player;
  if (!resist(p)) return orig(r, dt);
  const hp = p.hp, inv = p.inv, fire = p.fireImm; orig(r, dt); p.hp = Math.max(p.hp, hp); p.inv = Math.max(p.inv, inv); };
wrapMech('quicksand', 'update', orig => noDamage(orig, p => p.sandFoot));
wrapMech('void', 'update', orig => noDamage(orig, p => p.voidStep));
wrapMech('sun', 'update', orig => (r, dt) => { const p = G.player, was = p.fireImm;                        // 沙行者裹布: sunlight does not burn
  if (p.sunShade) p.fireImm = true; orig(r, dt); p.fireImm = was; });

// ---------------------------------------------------------------- drop rules: themed gear only inside its own act
const _rollItem = rollItem;
const gearUnseen = i => META.seenSet.has(i.id) ? [i] : [i, i];
rollItem = function (tier, exclude = new Set()) {
  const act = G.act || 1, own = equippedIds();
  const usable = i => i.tier <= tier && !own.has(i.id) && !exclude.has(i.id) && isUnlocked(i) && !(i.legend && !themeCleared(act));
  if (GEAR_BY_ACT[act] && rand() < (CONFIG.actGearChance ?? 0.3)) {          // 先抽本幕的主题装备
    const pool = GEAR_BY_ACT[act].filter(usable);
    if (pool.length) return pick(pool.flatMap(gearUnseen));
  }
  // a themed piece only belongs to its own act's pool; everything else is hidden from the general roll
  const inPool = i => usable(i) && i.act === act;
  const hidden = ITEMS.filter(i => GEAR_IDS.has(i.id) && !inPool(i));
  for (const i of hidden) ITEMS.splice(ITEMS.indexOf(i), 1);
  const out = _rollItem(tier, exclude);
  ITEMS.push(...hidden);
  return out;
};
