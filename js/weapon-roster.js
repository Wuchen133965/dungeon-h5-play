'use strict';
// ============================================================ 武器名册：把手感铺开，并把每个职业的武器数量拉平到 27 把
// 做法（按用户要求）：
//   1. 精简：把重复度最高的 4 把武器改成「通用」（武器与属性都保留，只是不再计入某个职业的套装件数）；
//   2. 补充：给法师 / 牧师 / 吟游 / 召唤补足到 27 把，并且尽量用**新的武器类型**而不是同类变体；
//   3. 所有新增武器都带 act 标签，走 act-gear.js 的章节限定掉落规则（只在本幕掉落）。
// 本文件在 act-gear-more.js 之后加载，只往 ITEMS / WTYPES / 图标与手持绘制里加东西。

// ---------------------------------------------------------------- 1. 精简：重复度最高的 4 把改为通用
// 判断依据是同一职业内的同类型武器里，属性最接近、最容易互相替代的那几把。
const DEMOTE = ['knight', 'bearded', 'shortbow', 'rogue'];
for (const id of DEMOTE) { const it = ITEM_BY_ID[id]; if (it) it.cls = undefined; }

// ---------------------------------------------------------------- 2. 新武器类型
// 远程弹道全部复用已有的 bolt / rbolt / holy / note / orb / arrow / knife 贴图，不新增弹道种类。
Object.assign(WTYPES, {
  // 战士：两种长柄变体
  halberd: { kind: 'halberd', reach: 35, arc: 0.7, cd: 0.5, mul: 1.5, kb: 180, swingT: 0.16, thrust: true },
  flail: { kind: 'flail', reach: 28, arc: Math.PI, cd: 0.64, mul: 1.75, kb: 210, swingT: 0.2, heavy: true, quake: true },
  // 游侠：投掷长矛
  javelin: { kind: 'javelin', ranged: true, cd: 0.66, mul: 1.5, speed: 260, proj: 'arrow', kb: 120, swingT: 0.14, life: 1.1, r: 4, pierce: 2 },
  // 法师：法球（慢而重）、魔杖（快而轻）、咒刃（近战）
  orb: { kind: 'orb', ranged: true, cd: 0.88, mul: 2.0, speed: 120, proj: 'orb', kb: 130, swingT: 0.16, life: 1.6, r: 6, pierce: 3 },
  wand: { kind: 'wand', ranged: true, cd: 0.26, mul: 0.5, speed: 210, proj: 'bolt', kb: 40, swingT: 0.08, life: 0.7, r: 3 },
  spellblade: { kind: 'spellblade', reach: 25, arc: 1.3, cd: 0.4, mul: 1.15, kb: 140, swingT: 0.14 },
  // 牧师：圣锤（重击）、圣典（穿透圣光）、权杖（近战短柄）、香炉（溅射圣光）
  holyhammer: { kind: 'holyhammer', reach: 30, arc: Math.PI, cd: 0.78, mul: 2.0, kb: 240, swingT: 0.22, heavy: true, quake: true },
  holytome: { kind: 'holytome', ranged: true, cd: 0.72, mul: 1.2, speed: 100, proj: 'holy', kb: 80, swingT: 0.14, life: 1.5, r: 5, pierce: 2, splash: 16 },
  mace: { kind: 'mace', reach: 24, arc: 1.6, cd: 0.5, mul: 1.3, kb: 190, swingT: 0.16 },
  censer: { kind: 'censer', ranged: true, cd: 0.6, mul: 0.75, speed: 110, proj: 'holy', kb: 60, swingT: 0.12, life: 1.0, r: 5, splash: 22 },
  // 吟游：长笛（极快音点）、手鼓（近身音爆）、小提琴（穿透音波）、编钟（重音）
  flute: { kind: 'flute', ranged: true, cd: 0.28, mul: 0.5, speed: 220, proj: 'note', kb: 30, swingT: 0.08, life: 0.7, r: 4, pierce: 99 },
  drum: { kind: 'drum', reach: 26, arc: Math.PI, cd: 0.6, mul: 1.4, kb: 220, swingT: 0.16, quake: true },
  fiddle: { kind: 'fiddle', ranged: true, cd: 0.55, mul: 1.0, speed: 185, proj: 'note', kb: 50, swingT: 0.12, life: 1.1, r: 4, pierce: 99 },
  chime: { kind: 'chime', ranged: true, cd: 0.8, mul: 1.35, speed: 140, proj: 'note', kb: 160, swingT: 0.16, life: 1.0, r: 6, pierce: 99, splash: 20 },
  // 召唤师：召唤书、咒印（近战）、魂灯（追踪）
  rbook: { kind: 'rbook', ranged: true, cd: 0.7, mul: 0.6, speed: 135, proj: 'rbolt', kb: 50, swingT: 0.12, life: 1.0, r: 4, pierce: 1 },
  sigil: { kind: 'sigil', reach: 21, arc: 1.4, cd: 0.45, mul: 1.0, kb: 120, swingT: 0.12 },
  lantern: { kind: 'lantern', ranged: true, cd: 0.62, mul: 0.5, speed: 150, proj: 'rbolt', kb: 60, swingT: 0.12, life: 1.0, r: 4, homing: true },
});
// 近战长度 与 手持画法（远程类型复用已有的杖/枪画法）
Object.assign(WLEN, { halberd: 17, flail: 9, spellblade: 12, holyhammer: 12, mace: 9, drum: 4, sigil: 7, javelin: 0, orb: 0, wand: 0, holytome: 0, censer: 0, flute: 0, fiddle: 0, chime: 0, rbook: 0, lantern: 0 });
const ARROW = (hx, hy, ang, main, dark, hl, len, head) => { const c = Math.cos(ang), s = Math.sin(ang), pc = -s, ps = c;
  for (let i = 0; i < len; i++) px(hx + c * i, hy + s * i, 1, 1, i < 3 ? dark : main);
  for (let j = -head; j <= head; j++) px(hx + c * len + pc * j, hy + s * len + ps * j, 1, 1, j === 0 ? hl : main); };
WEAPON_DRAW.halberd = (hx, hy, a, c3) => ARROW(hx, hy, a, c3[0], c3[1], c3[2], 17, 3);
WEAPON_DRAW.flail = (hx, hy, a, c3) => { const c = Math.cos(a), s = Math.sin(a), pc = -s, ps = c;
  for (let i = 0; i < 7; i++) px(hx + c * i, hy + s * i, 1, 1, c3[1]); px(hx + c * 9 + pc * 2, hy + s * 9 + ps * 2, 3, 3, c3[0]); px(hx + c * 9 + pc * 2, hy + s * 9 + ps * 2, 1, 1, c3[2]); };
WEAPON_DRAW.spellblade = (hx, hy, a, c3) => ARROW(hx, hy, a, c3[0], c3[1], c3[2], 12, 1);
WEAPON_DRAW.holyhammer = (hx, hy, a, c3) => ARROW(hx, hy, a, c3[0], c3[1], c3[2], 12, 2);
WEAPON_DRAW.mace = (hx, hy, a, c3) => { ARROW(hx, hy, a, c3[0], c3[1], c3[2], 9, 2); const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) px(hx + c * 10 - s * (i - 1.5), hy + s * 10 + c * (i - 1.5), 1, 1, i % 2 ? c3[2] : c3[0]); };
WEAPON_DRAW.drum = (hx, hy, a, c3) => { px(hx - 3, hy - 2, 7, 5, c3[0]); px(hx - 3, hy - 2, 7, 1, c3[2]); px(hx - 3, hy + 2, 7, 1, c3[1]); };
WEAPON_DRAW.sigil = (hx, hy, a, c3) => { ellipse(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, 3, 3, c3[0]); px(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, 1, 1, c3[2]); };
WEAPON_DRAW.orb = (hx, hy, a, c3) => { ellipse(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, 4, 4, c3[0]); px(hx + Math.cos(a) * 6 - 1, hy + Math.sin(a) * 6 - 1, 3, 3, c3[2]); };
WEAPON_DRAW.lantern = (hx, hy, a, c3) => { px(hx - 2, hy - 4, 5, 7, c3[1]); px(hx - 1, hy - 3, 3, 5, c3[0]); px(hx, hy - 2, 1, 3, c3[2]); };
WEAPON_DRAW.flute = (hx, hy, a, c3) => { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 11; i++) px(hx + c * i, hy + s * i, 1, 1, i % 3 ? c3[0] : c3[1]); };
WEAPON_DRAW.chime = (hx, hy, a, c3) => { const c = Math.cos(a), s = Math.sin(a), pc = -s, ps = c;
  for (let j = -3; j <= 3; j++) px(hx + c * 8 + pc * j, hy + s * 8 + ps * j, 1, 1, j ? c3[0] : c3[2]); px(hx + c * 9, hy + s * 9, 1, 1, c3[2]); };

// 远程新类型的「拿在手里」画法（不画的话手里是空的）
WEAPON_DRAW.javelin = (hx, hy, a, c3) => { const c = Math.cos(a), s = Math.sin(a), pc = -s, ps = c;
  for (let i = 0; i < 13; i++) px(hx + c * i, hy + s * i, 1, 1, i < 3 ? c3[1] : c3[0]); px(hx + c * 14 + pc, hy + s * 14 + ps, 2, 2, c3[2]); };
WEAPON_DRAW.wand = (hx, hy, a, c3) => { const c = Math.cos(a), s = Math.sin(a);
  for (let i = 0; i < 7; i++) px(hx + c * i, hy + s * i, 1, 1, c3[1]); px(hx + c * 8, hy + s * 8, 2, 2, c3[0]); px(hx + c * 8, hy + s * 8, 1, 1, c3[2]); };
WEAPON_DRAW.holytome = (hx, hy, a, c3) => { px(hx - 3, hy - 3, 7, 6, c3[1]); px(hx - 2, hy - 2, 5, 4, c3[0]); px(hx + 2, hy - 3, 1, 6, c3[2]); };
WEAPON_DRAW.rbook = (hx, hy, a, c3) => { px(hx - 3, hy - 3, 7, 6, c3[1]); px(hx - 2, hy - 2, 5, 4, c3[0]); px(hx, hy - 3, 1, 6, c3[2]); };
WEAPON_DRAW.censer = (hx, hy, a, c3) => { const c = Math.cos(a), s = Math.sin(a);
  for (let i = 0; i < 4; i++) px(hx + c * i, hy + s * i, 1, 1, c3[1]); px(hx + c * 5, hy + s * 5 - 2, 4, 5, c3[0]); px(hx + c * 5 + 1, hy + s * 5 - 1, 2, 3, c3[2]); };
WEAPON_DRAW.fiddle = (hx, hy, a, c3) => { const c = Math.cos(a), s = Math.sin(a);
  px(hx - 3, hy - 3, 6, 7, c3[0]); px(hx - 2, hy - 2, 4, 5, c3[1]); for (let i = 3; i < 11; i++) px(hx + c * i, hy + s * i, 1, 1, c3[1]); };

// ---------------------------------------------------------------- 3. 每幕的职业补充（共 75 把，全部章节限定）
const ROSTER = [
  // ================= 第一幕 · 晨星边境
  { act: 1, id: 'r1_halberd', cls: 'warrior', tier: 1, slot: 'weapon', name: '卫兵战戟', icon: ['spear', '#b4bcd4', '#4a5068', '#ffffff'],
    lines: ['突刺：攻击距离很远', '攻击力 +0.5，范围比长枪宽'], mod: W('halberd', s => { s.dmg += 0.5; }) },
  { act: 1, id: 'r1_javelin', cls: 'ranger', tier: 1, slot: 'weapon', name: '掷矛', icon: ['spear', '#c8a060', '#5a3a22', '#ffffff'],
    lines: ['投出长矛，穿透 2 个敌人', '攻击力 +0.5'], mod: W('javelin', s => { s.pierce += 1; s.dmg += 0.5; }) },
  { act: 1, id: 'r1_knives', cls: 'ranger', tier: 0, slot: 'weapon', name: '铁匠飞刀', icon: ['dagger', '#a8b0c0', '#3a3a4a', '#ffffff'],
    lines: ['快速投出飞刀'], mod: W('knives', s => {}) },
  { act: 1, id: 'r1_wand', cls: 'mage', tier: 0, slot: 'weapon', name: '学徒魔杖', icon: ['staff', '#6aa8ff', '#2a3a5a', '#c8e0ff'],
    lines: ['快速射出细小飞弹', '攻速极快，伤害 ×0.5'], mod: W('wand', s => {}) },
  { act: 1, id: 'r1_sblade', cls: 'mage', tier: 1, slot: 'weapon', name: '法术短刃', icon: ['sword', '#8ad0ff', '#2a4a6a', '#ffffff'],
    lines: ['近战挥砍，命中时溅出火花', '攻击力 +0.25，暴击率 +4%'], mod: W('spellblade', s => { s.dmg += 0.25; s.crit += 0.04; }) },
  { act: 1, id: 'r1_mace', cls: 'cleric', tier: 0, slot: 'weapon', name: '祈祷锤', icon: ['hammer', '#e8dcc0', '#8a7a50', '#ffffff'],
    lines: ['短柄重击，攻击力 +0.25'], mod: W('mace', s => { s.dmg += 0.25; }) },
  { act: 1, id: 'r1_htome', cls: 'cleric', tier: 1, slot: 'weapon', name: '晨祷圣典', icon: ['book', '#fff0c0', '#a08040', '#ffffff'],
    lines: ['放出穿透的圣光', '攻击力 +0.25，治疗量 +半颗心'], mod: W('holytome', s => { s.dmg += 0.25; s.healBonus += 1; }) },
  { act: 1, id: 'r1_scepter', cls: 'cleric', tier: 1, slot: 'weapon', name: '旅人圣杖', icon: ['holy', '#ffe6b0', '#8a6a40', '#ffffff'],
    lines: ['圣光弹，命中时溅射'], mod: W('scepter', s => {}) },
  { act: 1, id: 'r1_flute', cls: 'bard', tier: 0, slot: 'weapon', name: '木笛', icon: ['note', '#d8b070', '#5a3a1a', '#fff0c0'],
    lines: ['吹出细小音符，穿透所有敌人', '攻速极快，伤害 ×0.5'], mod: W('flute', s => {}) },
  { act: 1, id: 'r1_drum', cls: 'bard', tier: 1, slot: 'weapon', name: '行军手鼓', icon: ['orbit', '#c87040', '#5a2a1a', '#ffe0c0'],
    lines: ['敲击四周，把敌人震开', '攻击力 +0.5'], mod: W('drum', s => { s.dmg += 0.5; }) },
  { act: 1, id: 'r1_lute', cls: 'bard', tier: 1, slot: 'weapon', name: '学徒鲁特琴', icon: ['lute', '#e8a060', '#6a3a1a', '#fff0c0'],
    lines: ['弹奏音符，穿透所有敌人', '攻击力 +0.25'], mod: W('lute', s => { s.dmg += 0.25; }) },
  { act: 1, id: 'r1_rbook', cls: 'summoner', tier: 1, slot: 'weapon', name: '召魂笔记', icon: ['book', '#b48aff', '#3a2a5a', '#ffffff'],
    lines: ['召唤 2 只灵体', '自身弹道穿透 1 个敌人'], mod: W('rbook', s => { s.minions += 2; }) },
  { act: 1, id: 'r1_sigil', cls: 'summoner', tier: 1, slot: 'weapon', name: '缚灵咒印', icon: ['gem', '#b48aff', '#2a1a4a', '#e0c8ff'],
    lines: ['近身拍击，攻击力 +0.25', '召唤物伤害 +12%'], mod: W('sigil', s => { s.dmg += 0.25; s.minionDmg *= 1.12; }) },
  // ================= 第二幕 · 霜原
  { act: 2, id: 'r2_javelin', cls: 'ranger', tier: 2, slot: 'weapon', name: '冰锥投矛', icon: ['spear', '#a8e0ff', '#3a6a9a', '#ffffff'],
    lines: ['投出长矛，穿透 2 个敌人', '12% 几率冻结敌人'], mod: W('javelin', s => { s.pierce += 1; s.freeze += 0.12; }) },
  { act: 2, id: 'r2_orb', cls: 'mage', tier: 2, slot: 'weapon', name: '寒霜法球', icon: ['gem', '#c8f0ff', '#3a5a8a', '#ffffff'],
    lines: ['放出缓慢的大法球，穿透 3 个敌人', '伤害 ×2.0，15% 几率冻结'], mod: W('orb', s => { s.freeze += 0.15; }) },
  { act: 2, id: 'r2_wand', cls: 'mage', tier: 1, slot: 'weapon', name: '冰针魔杖', icon: ['staff', '#8ae0ff', '#2a4a6a', '#ffffff'],
    lines: ['快速射出冰针', '攻速极快，8% 几率冻结'], mod: W('wand', s => { s.freeze += 0.08; }) },
  { act: 2, id: 'r2_sblade', cls: 'mage', tier: 2, slot: 'weapon', name: '霜刃', icon: ['sword', '#e0f8ff', '#3a6a9a', '#ffffff'],
    lines: ['近战挥砍，攻击力 +0.5', '15% 几率冻结敌人'], mod: W('spellblade', s => { s.dmg += 0.5; s.freeze += 0.15; }) },
  { act: 2, id: 'r2_hmace', cls: 'cleric', tier: 2, slot: 'weapon', name: '寒铁圣锤', icon: ['hammer', '#c8e0f0', '#3a4a68', '#ffffff'],
    lines: ['环形重击，攻击力 +1', '治疗量 +半颗心'], mod: W('holyhammer', s => { s.dmg += 1; s.healBonus += 1; }) },
  { act: 2, id: 'r2_htome', cls: 'cleric', tier: 2, slot: 'weapon', name: '雪夜圣典', icon: ['book', '#e0f4ff', '#5a7a9a', '#ffffff'],
    lines: ['穿透的圣光，10% 几率冻结', '治疗量 +半颗心'], mod: W('holytome', s => { s.freeze += 0.1; s.healBonus += 1; }) },
  { act: 2, id: 'r2_censer', cls: 'cleric', tier: 2, slot: 'weapon', name: '暖炉香炉', icon: ['lantern', '#ffb060', '#8a4a20', '#fff0c0'],
    lines: ['抛出香炉，命中时范围溅射', '寒冷积累 -25%'], mod: W('censer', s => { s.coldRes *= 0.75; }) },
  { act: 2, id: 'r2_flute', cls: 'bard', tier: 1, slot: 'weapon', name: '冰笛', icon: ['note', '#c8f0ff', '#3a6a8a', '#ffffff'],
    lines: ['快速吹出音符，穿透所有敌人', '10% 几率冻结敌人'], mod: W('flute', s => { s.freeze += 0.1; }) },
  { act: 2, id: 'r2_fiddle', cls: 'bard', tier: 2, slot: 'weapon', name: '雪原小提琴', icon: ['lute', '#ffffff', '#5a7a9a', '#d0f0ff'],
    lines: ['拉出穿透的音波', '攻击力 +0.5，暴击率 +5%'], mod: W('fiddle', s => { s.dmg += 0.5; s.crit += 0.05; }) },
  { act: 2, id: 'r2_chime', cls: 'bard', tier: 2, slot: 'weapon', name: '冰凌编钟', icon: ['note', '#8ae0ff', '#3a5a8a', '#ffffff'],
    lines: ['沉重钟声，击退很强并范围溅射', '攻击力 +0.5，15% 几率冻结'], mod: W('chime', s => { s.dmg += 0.5; s.freeze += 0.15; }) },
  { act: 2, id: 'r2_rbook', cls: 'summoner', tier: 2, slot: 'weapon', name: '霜纹召魂书', icon: ['book', '#a8d8f0', '#2a4a6a', '#ffffff'],
    lines: ['召唤 2 只灵体', '召唤物 25% 几率冻结'], mod: W('rbook', s => { s.minions += 2; s.minionFreeze = 0.25; }) },
  { act: 2, id: 'r2_lantern', cls: 'summoner', tier: 2, slot: 'weapon', name: '极光灯', icon: ['lantern', '#c8f0ff', '#2a4a5a', '#ffffff'],
    lines: ['召唤 2 只灵体，弹道会追踪', '召唤物攻击速度 +20%'], mod: W('lantern', s => { s.minions += 2; s.minionSpd *= 1.2; }) },
  { act: 2, id: 'r2_sigil', cls: 'summoner', tier: 1, slot: 'weapon', name: '冻原印记', icon: ['gem', '#8ac0ff', '#2a3a5a', '#ffffff'],
    lines: ['近身拍击，攻击力 +0.25', '召唤物伤害 +15%'], mod: W('sigil', s => { s.dmg += 0.25; s.minionDmg *= 1.15; }) },
  // ================= 第三幕 · 腐沼
  { act: 3, id: 'r3_javelin', cls: 'ranger', tier: 2, slot: 'weapon', name: '毒刺投矛', icon: ['spear', '#7adc5a', '#2a5a2a', '#d0ffb0'],
    lines: ['投出长矛，穿透 2 个敌人', '24% 几率使敌人中毒'], mod: W('javelin', s => { s.pierce += 1; s.poison += 0.24; }) },
  { act: 3, id: 'r3_orb', cls: 'mage', tier: 2, slot: 'weapon', name: '孢子法球', icon: ['gem', '#b04ad0', '#2a1a3a', '#f0d0ff'],
    lines: ['放出缓慢的大法球，穿透 3 个敌人', '21% 几率使敌人中毒'], mod: W('orb', s => { s.poison += 0.21; }) },
  { act: 3, id: 'r3_wand', cls: 'mage', tier: 2, slot: 'weapon', name: '腐藤魔杖', icon: ['staff', '#6adc5a', '#2a4a2a', '#d0ffc0'],
    lines: ['快速射出飞弹', '18% 几率使敌人中毒'], mod: W('wand', s => { s.poison += 0.18; }) },
  { act: 3, id: 'r3_sblade', cls: 'mage', tier: 2, slot: 'weapon', name: '瘴气短刃', icon: ['sword', '#a8c070', '#3a4a2a', '#ffffff'],
    lines: ['近战挥砍，攻击力 +0.5', '21% 几率使敌人中毒'], mod: W('spellblade', s => { s.dmg += 0.5; s.poison += 0.21; }) },
  { act: 3, id: 'r3_hmace', cls: 'cleric', tier: 2, slot: 'weapon', name: '净化圣锤', icon: ['hammer', '#e0e8c0', '#5a6a30', '#ffffff'],
    lines: ['环形重击，攻击力 +1', '击杀时 6% 回复半颗心'], mod: W('holyhammer', s => { s.dmg += 1; s.vamp += 0.06; }) },
  { act: 3, id: 'r3_mace', cls: 'cleric', tier: 1, slot: 'weapon', name: '驱邪短锤', icon: ['hammer', '#d8dcc0', '#6a6a40', '#ffffff'],
    lines: ['短柄重击，攻击力 +0.5', '6% 几率格挡伤害'], mod: W('mace', s => { s.dmg += 0.5; s.block += 0.06; }) },
  { act: 3, id: 'r3_htome', cls: 'cleric', tier: 2, slot: 'weapon', name: '解毒圣典', icon: ['book', '#c8e8b0', '#4a6a30', '#ffffff'],
    lines: ['穿透的圣光，治疗量 +半颗心', '免疫中毒'], mod: W('holytome', s => { s.healBonus += 1; s.sporeRes = true; }) },
  { act: 3, id: 'r3_drum', cls: 'bard', tier: 2, slot: 'weapon', name: '蛙皮大鼓', icon: ['orbit', '#7a9a4a', '#2a3a1a', '#d0f0a0'],
    lines: ['敲击四周，把敌人震开', '攻击力 +0.5，15% 几率使敌人中毒'], mod: W('drum', s => { s.dmg += 0.5; s.poison += 0.15; }) },
  { act: 3, id: 'r3_flute', cls: 'bard', tier: 2, slot: 'weapon', name: '芦笛', icon: ['note', '#8ac060', '#3a5a20', '#e0ffc0'],
    lines: ['快速吹出音符，穿透所有敌人', '21% 几率使敌人中毒'], mod: W('flute', s => { s.poison += 0.21; }) },
  { act: 3, id: 'r3_chime', cls: 'bard', tier: 2, slot: 'weapon', name: '骨编钟', icon: ['note', '#e4dcc4', '#5a4a3a', '#ffffff'],
    lines: ['沉重钟声，范围溅射并击退', '攻击力 +0.5，治疗量 +半颗心'], mod: W('chime', s => { s.dmg += 0.5; s.healBonus += 1; }) },
  { act: 3, id: 'r3_rbook', cls: 'summoner', tier: 2, slot: 'weapon', name: '腐生召魂书', icon: ['book', '#9a5ab0', '#2a1a3a', '#e0c0ff'],
    lines: ['召唤 3 只灵体', '召唤物 30% 几率使敌人中毒'], mod: W('rbook', s => { s.minions += 3; s.minionPoison += 0.3; }) },
  { act: 3, id: 'r3_lantern', cls: 'summoner', tier: 2, slot: 'weapon', name: '沼灯', icon: ['lantern', '#8ad0a0', '#2a4a3a', '#e0fff0'],
    lines: ['召唤 3 只灵体，弹道会追踪'], mod: W('lantern', s => { s.minions += 3; }) },
  { act: 3, id: 'r3_sigil', cls: 'summoner', tier: 2, slot: 'weapon', name: '菌纹印记', icon: ['gem', '#c890e0', '#3a1a4a', '#ffffff'],
    lines: ['近身拍击，攻击力 +0.5', '召唤物伤害 +18%'], mod: W('sigil', s => { s.dmg += 0.5; s.minionDmg *= 1.18; }) },
  // ================= 第四幕 · 黄沙
  { act: 4, id: 'r4_flail', cls: 'warrior', tier: 2, slot: 'weapon', name: '沙铁连枷', icon: ['hammer', '#d8a860', '#5a3a10', '#fff0c0'],
    lines: ['连枷环击，扫到周围所有敌人', '攻击力 +1，15% 几率引爆'], mod: W('flail', s => { s.dmg += 1; s.explode += 0.15; }) },
  { act: 4, id: 'r4_javelin', cls: 'ranger', tier: 2, slot: 'weapon', name: '烈日投矛', icon: ['spear', '#ecba40', '#8a5a10', '#fff0c0'],
    lines: ['投出长矛，穿透 3 个敌人', '18% 几率点燃敌人'], mod: W('javelin', s => { s.pierce += 2; s.burn += 0.18; }) },
  { act: 4, id: 'r4_orb', cls: 'mage', tier: 2, slot: 'weapon', name: '流沙法球', icon: ['gem', '#e8c060', '#6a4a10', '#fff0b0'],
    lines: ['放出缓慢的大法球，穿透 3 个敌人', '击杀时 15% 几率爆炸'], mod: W('orb', s => { s.explode += 0.15; }) },
  { act: 4, id: 'r4_wand', cls: 'mage', tier: 2, slot: 'weapon', name: '炙沙魔杖', icon: ['staff', '#ffb060', '#5a2a10', '#fff0c0'],
    lines: ['快速射出飞弹', '18% 几率点燃敌人'], mod: W('wand', s => { s.burn += 0.18; }) },
  { act: 4, id: 'r4_sblade', cls: 'mage', tier: 2, slot: 'weapon', name: '日炙弯刃', icon: ['sword', '#ffd060', '#7a4a10', '#ffffff'],
    lines: ['近战挥砍，攻击力 +0.5', '暴击率 +7%'], mod: W('spellblade', s => { s.dmg += 0.5; s.crit += 0.07; }) },
  { act: 4, id: 'r4_hhammer', cls: 'cleric', tier: 2, slot: 'weapon', name: '日轮圣锤', icon: ['hammer', '#ffd040', '#8a5a10', '#ffffff'],
    lines: ['环形重击，攻击力 +1', '18% 几率点燃敌人'], mod: W('holyhammer', s => { s.dmg += 1; s.burn += 0.18; }) },
  { act: 4, id: 'r4_htome', cls: 'cleric', tier: 2, slot: 'weapon', name: '圣火典', icon: ['book', '#ffd070', '#8a4a20', '#ffffff'],
    lines: ['穿透的圣光，15% 几率点燃', '治疗量 +半颗心'], mod: W('holytome', s => { s.burn += 0.15; s.healBonus += 1; }) },
  { act: 4, id: 'r4_censer', cls: 'cleric', tier: 2, slot: 'weapon', name: '焚香炉', icon: ['lantern', '#ff8a30', '#7a2a10', '#ffe0a0'],
    lines: ['抛出香炉，范围溅射', '21% 几率点燃敌人，治疗量 +半颗心'], mod: W('censer', s => { s.burn += 0.21; s.healBonus += 1; }) },
  { act: 4, id: 'r4_fiddle', cls: 'bard', tier: 3, slot: 'weapon', name: '沙暴小提琴', icon: ['lute', '#e8c060', '#6a4a20', '#fff0c0'],
    lines: ['拉出穿透的音波，攻击力 +1', '15% 几率引发连锁闪电'], mod: W('fiddle', s => { s.dmg += 1; s.chain += 0.15; }) },
  { act: 4, id: 'r4_chime', cls: 'bard', tier: 2, slot: 'weapon', name: '金铃', icon: ['note', '#ffe080', '#8a6a10', '#ffffff'],
    lines: ['沉重钟声，范围溅射并击退', '攻击力 +0.5，击杀时 7% 回半颗心'], mod: W('chime', s => { s.dmg += 0.5; s.vamp += 0.07; }) },
  { act: 4, id: 'r4_flute', cls: 'bard', tier: 2, slot: 'weapon', name: '骨笛', icon: ['note', '#e8dcc0', '#6a5a3a', '#ffffff'],
    lines: ['快速吹出音符，穿透所有敌人', '暴击率 +6%'], mod: W('flute', s => { s.crit += 0.06; }) },
  { act: 4, id: 'r4_rbook', cls: 'summoner', tier: 2, slot: 'weapon', name: '葬仪召魂书', icon: ['book', '#d8c090', '#4a3a20', '#ffffff'],
    lines: ['召唤 3 只灵体', '召唤物伤害 +18%'], mod: W('rbook', s => { s.minions += 3; s.minionDmg *= 1.18; }) },
  { act: 4, id: 'r4_lantern', cls: 'summoner', tier: 2, slot: 'weapon', name: '长明灯', icon: ['lantern', '#ffe6b0', '#7a5a20', '#ffffff'],
    lines: ['召唤 3 只灵体，弹道会追踪', '召唤物攻击速度 +25%'], mod: W('lantern', s => { s.minions += 3; s.minionSpd *= 1.25; }) },
  // ================= 第五幕 · 天穹
  { act: 5, id: 'r5_javelin', cls: 'ranger', tier: 3, slot: 'weapon', name: '雷霆投枪', icon: ['spear', '#ffe060', '#5a4a8a', '#ffffff'],
    lines: ['投出长枪，穿透 3 个敌人', '18% 几率引发连锁闪电'], mod: W('javelin', s => { s.pierce += 2; s.chain += 0.18; }) },
  { act: 5, id: 'r5_orb', cls: 'mage', tier: 3, slot: 'weapon', name: '星界法球', icon: ['gem', '#c8a0ff', '#3a1850', '#ffffff'],
    lines: ['放出缓慢的大法球，穿透 3 个敌人', '所有触发几率 ×1.15'], mod: W('orb', s => { s.procMul *= 1.15; }) },
  { act: 5, id: 'r5_sblade', cls: 'mage', tier: 2, slot: 'weapon', name: '雷电短刃', icon: ['sword', '#e0e8ff', '#4a5a8a', '#ffffff'],
    lines: ['近战挥砍，攻击力 +0.5', '15% 几率引发连锁闪电'], mod: W('spellblade', s => { s.dmg += 0.5; s.chain += 0.15; }) },
  { act: 5, id: 'r5_hhammer', cls: 'cleric', tier: 3, slot: 'weapon', name: '雷光圣锤', icon: ['hammer', '#fff0b0', '#5a5a8a', '#ffffff'],
    lines: ['环形重击，攻击力 +1.5', '18% 几率连锁闪电', '治疗量 +半颗心'], mod: W('holyhammer', s => { s.dmg += 1.5; s.chain += 0.18; s.healBonus += 1; }) },
  { act: 5, id: 'r5_mace', cls: 'cleric', tier: 2, slot: 'weapon', name: '星铁短锤', icon: ['hammer', '#d0d8f0', '#4a5068', '#ffffff'],
    lines: ['短柄重击，攻击力 +0.5，格挡 +5%'], mod: W('mace', s => { s.dmg += 0.5; s.block += 0.05; }) },
  { act: 5, id: 'r5_censer', cls: 'cleric', tier: 2, slot: 'weapon', name: '星辉香炉', icon: ['lantern', '#e0d0ff', '#5a3a8a', '#ffffff'],
    lines: ['抛出香炉，范围溅射并追踪', '治疗量 +半颗心'], mod: W('censer', s => { s.homing = true; s.healBonus += 1; }) },
  { act: 5, id: 'r5_flute', cls: 'bard', tier: 2, slot: 'weapon', name: '风笛', icon: ['note', '#d0f8f0', '#3a6a7a', '#ffffff'],
    lines: ['快速吹出音符，穿透所有敌人，会追踪'], mod: W('flute', s => { s.homing = true; }) },
  { act: 5, id: 'r5_fiddle', cls: 'bard', tier: 2, slot: 'weapon', name: '星弦琴', icon: ['lute', '#ffe6b0', '#5a4a8a', '#ffffff'],
    lines: ['拉出穿透的音波，攻击力 +0.5', '灵感积累 +40%'], mod: W('fiddle', s => { s.dmg += 0.5; s.insGain *= 1.4; }) },
  { act: 5, id: 'r5_drum', cls: 'bard', tier: 2, slot: 'weapon', name: '雷霆手鼓', icon: ['orbit', '#ffe080', '#5a4a8a', '#ffffff'],
    lines: ['敲击四周，震开敌人', '15% 几率引发连锁闪电'], mod: W('drum', s => { s.chain += 0.15; }) },
  { act: 5, id: 'r5_lute', cls: 'bard', tier: 3, slot: 'weapon', name: '星语鲁特琴', icon: ['lute', '#ffd060', '#4a3a8a', '#ffffff'],
    lines: ['弹奏音符，穿透所有敌人，攻击力 +1', '每层灵感效果 +1%'], mod: W('lute', s => { s.dmg += 1; s.insPer += 0.01; }) },
  { act: 5, id: 'r5_rbook', cls: 'summoner', tier: 3, slot: 'weapon', name: '星界召魂书', icon: ['book', '#c8a0ff', '#3a2a6a', '#ffffff'],
    lines: ['召唤 3 只灵体', '召唤物伤害 +21%，攻击速度 +20%'], mod: W('rbook', s => { s.minions += 3; s.minionDmg *= 1.21; s.minionSpd *= 1.2; }) },
  { act: 5, id: 'r5_sigil', cls: 'summoner', tier: 2, slot: 'weapon', name: '雷鸣印记', icon: ['gem', '#ffe060', '#3a2a5a', '#ffffff'],
    lines: ['近身拍击，攻击力 +0.5', '召唤物 25% 几率连锁闪电'], mod: W('sigil', s => { s.dmg += 0.5; s.minionChain = 0.25; }) },
  { act: 5, id: 'r5_lantern', cls: 'summoner', tier: 3, slot: 'weapon', name: '观星灯', icon: ['lantern', '#d0e8ff', '#3a4a7a', '#ffffff'],
    lines: ['召唤 4 只灵体，弹道会追踪', '照明范围更大'], mod: W('lantern', s => { s.minions += 4; s.starSight = true; }) },
  // ================= 第六幕 · 虚空终焉
  { act: 6, id: 'r6_orb', cls: 'mage', tier: 3, slot: 'weapon', name: '虚空法球', icon: ['gem', '#b45aff', '#1a0a2a', '#ff3060'],
    lines: ['放出缓慢的大法球，穿透 3 个敌人', '所有触发几率 ×1.18'], mod: W('orb', s => { s.procMul *= 1.18; }) },
  { act: 6, id: 'r6_wand', cls: 'mage', tier: 3, slot: 'weapon', name: '湮灭魔杖', icon: ['staff', '#e0c8ff', '#2a0a40', '#ff3060'],
    lines: ['快速射出飞弹，攻击力 +0.5', '击杀时 12% 几率爆炸'], mod: W('wand', s => { s.dmg += 0.5; s.explode += 0.12; }) },
  { act: 6, id: 'r6_hhammer', cls: 'cleric', tier: 3, slot: 'weapon', name: '终焉圣锤', icon: ['hammer', '#ffd0e0', '#3a1a40', '#ffffff'],
    lines: ['环形重击，攻击力 +1.5', '治疗量 +半颗心', '击杀时 7% 回复半颗心'], mod: W('holyhammer', s => { s.dmg += 1.5; s.healBonus += 1; s.vamp += 0.07; }) },
  { act: 6, id: 'r6_htome', cls: 'cleric', tier: 3, slot: 'weapon', name: '终焉圣典', icon: ['book', '#e8d0ff', '#3a1a50', '#ffffff'],
    lines: ['穿透的圣光，一次射出 2 道', '治疗量 +半颗心'], mod: W('holytome', s => { s.multi = 2; s.healBonus += 1; }) },
  { act: 6, id: 'r6_drum', cls: 'bard', tier: 3, slot: 'weapon', name: '终末战鼓', icon: ['orbit', '#b45aff', '#2a0a40', '#ffb0c0'],
    lines: ['敲击四周，震开敌人，攻击力 +1', '击杀获得 2 层灵感'], mod: W('drum', s => { s.dmg += 1; s.insKill += 2; }) },
  { act: 6, id: 'r6_fiddle', cls: 'bard', tier: 3, slot: 'weapon', name: '虚空提琴', icon: ['lute', '#ff80a0', '#2a0a2a', '#ffffff'],
    lines: ['拉出穿透的音波，攻击力 +1', '18% 几率引发连锁闪电'], mod: W('fiddle', s => { s.dmg += 1; s.chain += 0.18; }) },
  { act: 6, id: 'r6_flute', cls: 'bard', tier: 3, slot: 'weapon', name: '虚空短笛', icon: ['note', '#d0a0ff', '#2a0a40', '#ffffff'],
    lines: ['快速吹出音符，穿透所有敌人并追踪', '12% 几率点燃敌人'], mod: W('flute', s => { s.homing = true; s.burn += 0.12; }) },
  { act: 6, id: 'r6_rbook', cls: 'summoner', tier: 3, slot: 'weapon', name: '虚空召魂书', icon: ['book', '#b48aff', '#1a0a2a', '#ffffff'],
    lines: ['召唤 4 只灵体', '召唤物伤害 +24%'], mod: W('rbook', s => { s.minions += 4; s.minionDmg *= 1.24; }) },
  { act: 6, id: 'r6_sigil', cls: 'summoner', tier: 3, slot: 'weapon', name: '湮灭印记', icon: ['gem', '#ff3060', '#1a0a2a', '#ffffff'],
    lines: ['近身拍击，攻击力 +1', '召唤物 +1，伤害 +15%'], mod: W('sigil', s => { s.dmg += 1; s.minions += 1; s.minionDmg *= 1.15; }) },
  { act: 6, id: 'r6_lantern', cls: 'summoner', tier: 3, slot: 'weapon', name: '裂隙之灯', icon: ['lantern', '#ff80b0', '#2a0a30', '#ffffff'],
    lines: ['召唤 4 只灵体，弹道会追踪', '击杀时 30% 召唤幽魂'], mod: W('lantern', s => { s.minions += 4; s.ghostP += 0.3; }) },
];
for (const it of ROSTER) {
  if (ITEM_BY_ID[it.id]) continue;
  it.gear = true;                                   // 标记为章节限定装备，交给 act-gear.js 的掉落规则
  ITEMS.push(it); ITEM_BY_ID[it.id] = it; GEAR_IDS.add(it.id);
  (GEAR_BY_ACT[it.act] = GEAR_BY_ACT[it.act] || []).push(it);
}

// ---------------------------------------------------------------- 召唤物的冻结与连锁（原逻辑只支持点燃/中毒）
const _minionProcGear = minionProc;
minionProc = function (e) {
  _minionProcGear(e);
  if (!e || e.hp <= 0) return;
  const p = G.player;
  if (p.minionFreeze && rand() < Math.min(p.minionFreeze, COMBAT_LIMITS.freezeChance)) tryFreezeEnemy(e, 0.9);
  if (p.minionChain && rand() < Math.min(p.minionChain, COMBAT_LIMITS.chainChance)) chainLightning(e, Math.max(1, playerDmg() * 0.4), 2);
};
