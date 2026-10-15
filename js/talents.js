'use strict';
// ============================================================ 天赋树: one core in the middle, web grows outward. 6 class sectors (60° each)
// plus neutral "bridge" nodes on the seams between neighbouring classes. A node opens when ANY linked node has Lv.1+
// (links are undirected; the core is always open). Positions are polar: r = ring 0..10, a = angle in degrees (0 = right, 90 = down).
// fx(s, lv): stat changes applied in baseStats(); flags read elsewhere (start/gold/shop/soul/heal/undying via lv(id)).
// cost: souls per level. The 4th ring of every sector is the class capstone: counts as +1 set piece for that class.

const SECTOR = { warrior: 270, ranger: 330, mage: 30, cleric: 90, bard: 150, summoner: 210 };   // sector centre angle
const pct = v => Math.round(v * 100) + '%';
const TALENT_DEFS = [
  // ---------------------------------------------------------------- core (ring 0-1): general stats
  { id: 'core', r: 0, a: 0, name: '觉醒', max: 1, cost: [5], ic: ['gem', '#ffe6b0', '#8a6a40', '#ffffff'], col: '#ffe6b0',
    link: [], desc: () => '天赋树的起点：生命上限 +1', fx: s => { s.maxHp += 2; } },
  { id: 'atk', r: 1, a: 270, name: '锋刃锻造', max: 3, cost: [15, 30, 55], ic: ['sword', '#e0e4f0', '#7a5636', '#ffffff'], col: '#ffe6b0',
    link: ['core'], desc: l => `基础攻击力 +${l * 0.5}`, fx: (s, l) => { s.dmg += l * 0.5; } },
  { id: 'crit', r: 1, a: 330, name: '洞察要害', max: 3, cost: [20, 40, 70], ic: ['eye', '#ecba40', '#5a4a30', '#ffffff'], col: '#ffe6b0',
    link: ['core'], desc: l => `暴击率 +${l * 4}%`, fx: (s, l) => { s.crit += l * 0.04; } },
  { id: 'aspd', r: 1, a: 30, name: '迅捷之手', max: 3, cost: [25, 50, 85], ic: ['feather', '#8ae0e0', '#3a8a9a', '#ffffff'], col: '#ffe6b0',
    link: ['core'], desc: l => `攻击速度 +${l * 6}%`, fx: (s, l) => { s.atkSpd += l * 0.06; } },
  { id: 'vit', r: 1, a: 90, name: '强健体魄', max: 3, cost: [20, 45, 80], ic: ['heart', '#c83048', '#6a1424', '#ff9aa8'], col: '#ffe6b0',
    link: ['core'], desc: l => `生命上限 +${l} 颗心`, fx: (s, l) => { s.maxHp += l * 2; } },
  { id: 'spd', r: 1, a: 150, name: '轻装疾行', max: 3, cost: [15, 30, 50], ic: ['boots', '#9a6a3a', '#5a3a22', '#d8a060'], col: '#ffe6b0',
    link: ['core'], desc: l => `移动速度 +${l * 5}%`, fx: (s, l) => { s.speed *= 1 + l * 0.05; } },
  { id: 'gold', r: 1, a: 210, name: '鼓鼓行囊', max: 3, cost: [15, 30, 50], ic: ['crown', '#ecba40', '#8a5a10', '#fff0b0'], col: '#ffe6b0',
    link: ['core'], desc: l => `开局携带 ${l * 50} 金币` },
  // ---------------------------------------------------------------- seams (ring 2, between classes): utility, connect two sectors
  { id: 'roll', r: 2, a: 300, name: '翻滚大师', max: 2, cost: [25, 50], ic: ['hourglass', '#ecba40', '#7a5a30', '#fff0b0'], col: '#d8ccbc',
    link: ['atk', 'crit'], desc: l => `翻滚冷却 -${l * 12}%`, fx: (s, l) => { s.rollCd *= 1 - l * 0.12; } },
  { id: 'cdmg', r: 2, a: 0, name: '致命一击', max: 2, cost: [50, 100], ic: ['gem', '#ff4058', '#7a1424', '#ffd0d8'], col: '#d8ccbc',
    link: ['crit', 'aspd'], desc: l => `暴击伤害 ×${2 + l * 0.5}`, fx: (s, l) => { s.critMul += l * 0.5; } },
  { id: 'luck', r: 2, a: 60, name: '寻宝直觉', max: 3, cost: [20, 40, 70], ic: ['clover', '#5ccc5a', '#2a6a2a', '#d0ffc0'], col: '#d8ccbc',
    link: ['aspd', 'vit'], desc: l => `宝箱升阶几率 +${l * 6}%`, fx: (s, l) => { s.luck += l * 0.06; } },
  { id: 'heal', r: 2, a: 120, name: '喘息之机', max: 2, cost: [30, 60], ic: ['food', '#d8a060', '#8a5a30', '#f0d8a0'], col: '#d8ccbc',
    link: ['vit', 'spd'], desc: l => `进入新楼层回复 ${l} 颗心` },
  { id: 'shop', r: 2, a: 180, name: '商人人脉', max: 2, cost: [25, 50], ic: ['dice', '#f0ece0', '#c02838', '#ffffff'], col: '#d8ccbc',
    link: ['spd', 'gold'], desc: l => `商店价格 -${l * 15}%` },
  { id: 'soul', r: 2, a: 240, name: '魂之共鸣', max: 3, cost: [30, 60, 100], ic: ['gem', '#7ad8ff', '#2a5a8a', '#ffffff'], col: '#d8ccbc',
    link: ['gold', 'atk'], desc: l => `魂晶获取 +${l * 20}%` },
  // ---------------------------------------------------------------- outer ring 4 between sectors: big neutral keystones
  { id: 'undying', r: 4, a: 300, name: '不灭意志', max: 1, cost: [180], ic: ['feather', '#ff8a30', '#c02818', '#fff0a0'], col: '#ffe6b0',
    link: ['cap_warrior', 'cap_ranger'], desc: () => '每局一次：倒下时满血复活' },
  { id: 'slot', r: 4, a: 60, name: '饰品扣带', max: 2, cost: [60, 130], ic: ['ring', '#b4bcd4', '#5a6078', '#ffffff'], col: '#ffe6b0',
    link: ['cap_mage', 'cap_cleric'], desc: l => `饰品栏位 ${3 + l} 格`, fx: (s, l) => { s.trinketSlots += l; } },
  { id: 'start', r: 4, a: 180, name: '先祖遗物', max: 2, cost: [40, 100], ic: ['amulet', '#4696ff', '#26407a', '#c8e0ff'], col: '#ffe6b0',
    link: ['cap_bard', 'cap_summoner'], desc: l => ['开局宝箱至少为稀有', '开局宝箱至少为史诗', '开局宝箱必定为传说'][l] },
];
// class sector nodes: [id, ring, angle offset from sector centre, name, max, cost[], icon, desc(l), fx(s, l), links]
// ring 2 nodes hang off the ring-1 core node of that direction; ring 3 needs either ring-2 node; ring 4 = capstone
const SECTOR_NODES = {
  warrior: [
    ['w_iron', 2, -11, '钢铁之躯', 2, [30, 60], ['armor', '#8a92a8', '#4a5068', '#d0d8e8'], l => `生命上限 +${l} 颗心，格挡 +${l * 4}%`, (s, l) => { s.maxHp += l * 2; s.block += l * 0.04; }],
    ['w_rage', 2, 11, '战意沸腾', 2, [35, 70], ['skull', '#e4dcc4', '#8a2a2a', '#ffffff'], l => `战士怒气持续 +${l} 秒，生命越低攻击越高（最多 +${l * 25}%）`, (s, l) => { s.rageT += l; s.berserk += l * 0.25; }],
    ['w_quake', 3, 0, '震地之力', 2, [60, 110], ['hammer', '#8a92a8', '#6a4a30', '#d0d8e8'], l => `战士震地冲击波伤害 +${l * 50}%，范围 +${l * 20}%`, (s, l) => { s.quakeMul += l * 0.5; s.quakeR *= 1 + l * 0.2; }],
  ],
  ranger: [
    ['r_eye', 2, -11, '鹰眼', 2, [30, 60], ['eye', '#8ad05a', '#2a5a2a', '#ffffff'], l => `暴击率 +${l * 4}%，远程弹道射程 +${l * 15}%`, (s, l) => { s.crit += l * 0.04; s.rangeMul = (s.rangeMul || 1) * (1 + l * 0.15); }],
    ['r_step', 2, 11, '疾影步', 2, [30, 60], ['boots', '#6a9a4a', '#2a4a1a', '#d0ffb0'], l => `移动速度 +${l * 5}%，翻滚冷却 -${l * 10}%`, (s, l) => { s.speed *= 1 + l * 0.05; s.rollCd *= 1 - l * 0.1; }],
    ['r_split', 3, 0, '分裂箭', 2, [60, 110], ['bow', '#8ad05a', '#3a5a2a', '#ffffff'], l => `游侠分裂飞刀 +${l} 枚`, (s, l) => { s.splitN += l; }],
  ],
  mage: [
    ['m_focus', 2, -11, '奥术专注', 2, [30, 60], ['book', '#6aa8ff', '#26407a', '#c8e0ff'], l => `所有触发几率 ×${(1 + l * 0.12).toFixed(2)}`, (s, l) => { s.procMul *= 1 + l * 0.12; }],
    ['m_burn', 2, 11, '元素灼烧', 2, [35, 70], ['ring', '#ff7a30', '#8a3a10', '#ffe080'], l => `点燃与中毒伤害 +${l * 30}%`, (s, l) => { s.dotMul += l * 0.3; }],
    ['m_nova', 3, 0, '新星涌动', 2, [60, 110], ['bolt', '#ffe060', '#8a6a10', '#ffffff'], l => `奥术新星冷却 -${l * 0.8} 秒，伤害 +${l * 40}%`, (s, l) => { s.novaCd -= l * 0.8; s.novaMul += l * 0.4; }],
  ],
  cleric: [
    ['c_grace', 2, -11, '恩典', 2, [30, 60], ['holy', '#ffe080', '#8a6a20', '#ffffff'], l => `所有治疗量 +${l} 半颗心`, (s, l) => { s.healBonus += l; }],
    ['c_vigil', 2, 11, '守夜', 2, [35, 70], ['amulet', '#fff0b0', '#a08030', '#ffffff'], l => `圣盾上限 +${l}，每 ${20 - l * 4} 秒回复半颗心`, (s, l) => { s.shieldCap += l; s.regen = s.regen ? Math.min(s.regen, 20 - l * 4) : 20 - l * 4; }],
    ['c_smite', 3, 0, '圣光审判', 2, [60, 110], ['bolt', '#fff6d0', '#a08030', '#ffffff'], l => `圣光审判目标 +${l}，伤害 +${l * 40}%`, (s, l) => { s.smiteN += l; s.smiteMul += l * 0.4; }],
  ],
  bard: [
    ['b_tempo', 2, -11, '节奏感', 2, [30, 60], ['hourglass', '#d8a060', '#6a3a1a', '#fff0c0'], l => `攻击速度 +${l * 6}%，灵感积累 +${l * 50}%`, (s, l) => { s.atkSpd += l * 0.06; s.insGain *= 1 + l * 0.5; }],
    ['b_encore', 2, 11, '安可', 2, [35, 70], ['note', '#ff8ad8', '#6a1a5a', '#ffffff'], l => `灵感上限 +${l * 3}，击杀获得 ${l} 层灵感`, (s, l) => { s.insCap += l * 3; s.insKill += l; }],
    ['b_finale', 3, 0, '华彩终章', 2, [60, 110], ['lute', '#ffd060', '#8a3a10', '#ffffff'], l => `终章伤害 +${l * 50}%`, (s, l) => { s.finaleMul += l * 0.5; }],
  ],
  summoner: [
    ['s_bond', 2, -11, '灵魂契约', 2, [30, 60], ['lantern', '#b48aff', '#3a2a5a', '#ffffff'], l => `召唤物伤害 +${l * 25}%`, (s, l) => { s.minionDmg *= 1 + l * 0.25; }],
    ['s_swift', 2, 11, '迅捷使魔', 2, [35, 70], ['feather', '#c8a0ff', '#3a2a5a', '#ffffff'], l => `召唤物攻击速度 +${l * 20}%`, (s, l) => { s.minionSpd *= 1 + l * 0.2; }],
    ['s_horde', 3, 0, '亡灵大军', 2, [70, 130], ['skull', '#c8a0ff', '#3a1850', '#ffffff'], l => `召唤物 +${l}，幽魂持续 +${l * 2} 秒`, (s, l) => { s.minions += l; s.ghostT += l * 2; }],
  ],
};
const RING1_OF = { warrior: 'atk', ranger: 'crit', mage: 'aspd', cleric: 'vit', bard: 'spd', summoner: 'gold' };
for (const [cls, rows] of Object.entries(SECTOR_NODES)) {
  const C = CLASSES[cls], a0 = SECTOR[cls], ids = rows.map(r => r[0]);
  rows.forEach(([id, r, da, name, max, cost, ic, desc, fx]) => TALENT_DEFS.push({ id, r, a: a0 + da, name, max, cost, ic, desc, fx, col: C.col, cls,
    link: r === 2 ? [RING1_OF[cls]] : ids.filter((_, i) => rows[i][1] === 2) }));
  TALENT_DEFS.push({ id: 'cap_' + cls, r: 4, a: a0, name: `${C.name}精通`, max: 1, cost: [200], ic: C.ic, col: C.col, cls, cap: true,
    link: ids.filter((_, i) => rows[i][1] === 3), desc: () => `${C.name}装备的套装件数 +1（2/3/5 件套更容易达成）` });
}

// Expansion is additive: old IDs, costs and treeVer stay intact, preserving learned talents.
// Each class gains three five-node routes and three keystones. New routes have explicit prerequisites.
const talentBoost = (...mods) => s => {
  for (const [key, value, op] of mods) {
    if (op === 'mul') s[key] = (s[key] ?? 1) * value;
    else if (op === 'flag') s[key] = value;
    else if (op === 'min') s[key] = s[key] ? Math.min(s[key], value) : value;
    else s[key] = (s[key] || 0) + value;
  }
};
// Icon shapes and colours describe effects; class identity remains on the node border.
const TALENT_ICON_PALETTES = {};
for (const [kinds, a, b, c] of [
  ['sword tal_reach tal_crit tal_range tal_pierce tal_multishot tal_wave tal_rollvolley tal_homing tal_execution', '#d8e4f8', '#667a9c', '#ffffff'],
  ['tal_shield armor amulet tal_guardquake', '#78baff', '#305080', '#dcf0ff'],
  ['tal_thorns tal_quake fang tal_bloodarmor', '#ed9e68', '#80432d', '#ffe6ba'],
  ['heart tal_drain tal_rage', '#ed647a', '#87283c', '#ffd4df'],
  ['tal_dodge boots feather hourglass', '#75e0ca', '#2c7e70', '#defff6'],
  ['tal_fire bomb tal_dot', '#ff9445', '#96381e', '#fff0aa'],
  ['tal_frost tal_silence', '#8be4ff', '#327aab', '#efffff'],
  ['tal_poison tal_plague', '#a3e85e', '#46722b', '#efffb9'],
  ['bolt tal_storm', '#ffe365', '#9c7320', '#fffce0'],
  ['tal_proc tal_nova orbit tal_elements tal_starorbit', '#b59aff', '#5b418e', '#f0e6ff'],
  ['tal_heal tal_regen tal_sanctuary', '#82e9a0', '#2b7953', '#eaffed'],
  ['holy tal_smite tal_dawnshield tal_seraph', '#ffe392', '#9b7433', '#fffbed'],
  ['horn book note tal_resonance tal_inspiration tal_chorus tal_muse', '#f69fd8', '#8b4678', '#ffecfa'],
  ['tal_spirit lantern tal_legion tal_soulguide tal_commander', '#c29aff', '#604184', '#f0e4ff'],
  ['magnet clover', '#f6d473', '#967235', '#fff3cd'],
]) for (const kind of kinds.split(' ')) TALENT_ICON_PALETTES[kind] = [a, b, c];
const talentEffectIcon = kind => [kind, ...TALENT_ICON_PALETTES[kind]];
const TALENT_ROUTES = {
  warrior: [
    { name: '壁垒', icons: ['tal_shield', 'heart', 'tal_thorns', 'tal_shield', 'tal_thorns', 'tal_guardquake'], nodes: [
      ['盾面淬火', '格挡率 +4%', talentBoost(['block', .04])],
      ['重甲内衬', '生命上限 +1 颗心', talentBoost(['maxHp', 2])],
      ['反伤棘刺', '受伤时对周围敌人反伤 2 点', talentBoost(['thorns', 2])],
      ['百战坚守', '格挡率 +5%，生命上限 +1 颗心', talentBoost(['block', .05], ['maxHp', 2])],
      ['壁垒锋芒', '反伤 +3 点，近战范围 +8%', talentBoost(['thorns', 3], ['reachMul', 1.08, 'mul'])],
    ], end: ['坚城反击', '格挡或护盾抵挡后释放震地波，冷却 4 秒', talentBoost(['guardQuake', true, 'flag'])] },
    { name: '剑气', icons: ['tal_reach', 'sword', 'feather', 'tal_crit', 'tal_quake', 'tal_wave'], nodes: [
      ['长刃研习', '近战攻击范围 +10%', talentBoost(['reachMul', 1.1, 'mul'])],
      ['沉肩发力', '基础攻击力 +0.5', talentBoost(['dmg', .5])],
      ['剑势连贯', '攻击速度 +6%，近战范围 +5%', talentBoost(['atkSpd', .06], ['reachMul', 1.05, 'mul'])],
      ['破甲重击', '暴击伤害倍率 +0.2', talentBoost(['critMul', .2])],
      ['裂地传承', '战士震地伤害 +30%，范围 +10%', talentBoost(['quakeMul', .3], ['quakeR', 1.1, 'mul'])],
    ], end: ['剑气纵横', '每次主武器攻击额外放出一道穿透剑气', talentBoost(['wave', 1])] },
    { name: '浴血', icons: ['tal_drain', 'tal_rage', 'hourglass', 'tal_drain', 'feather', 'tal_bloodarmor'], nodes: [
      ['浴血呼吸', '击杀时 4% 几率回复半颗心', talentBoost(['vamp', .04])],
      ['狂战血脉', '低血量攻击增幅上限 +15%', talentBoost(['berserk', .15])],
      ['怒火延烧', '战士怒气持续 +1 秒', talentBoost(['rageT', 1])],
      ['嗜血追猎', '击杀治疗几率 +5%，移速 +4%', talentBoost(['vamp', .05], ['speed', 1.04, 'mul'])],
      ['不屈狂怒', '战士怒气攻速倍率 +0.15', talentBoost(['rageSpd', .15])],
    ], end: ['血铸战甲', '格挡率 +10%，反伤 +4，生命上限 +2 心', talentBoost(['block', .1], ['thorns', 4], ['maxHp', 4])] },
  ],
  ranger: [
    { name: '游击', icons: ['tal_dodge', 'boots', 'feather', 'tal_dodge', 'tal_range', 'tal_rollvolley'], nodes: [
      ['轻盈落脚', '闪避冷却 -6%', talentBoost(['rollCd', .94, 'mul'])],
      ['掠影步法', '移动速度 +5%', talentBoost(['speed', 1.05, 'mul'])],
      ['近身速射', '攻击速度 +7%', talentBoost(['atkSpd', .07])],
      ['翻越险境', '闪避冷却 -8%，生命上限 +1 心', talentBoost(['rollCd', .92, 'mul'], ['maxHp', 2])],
      ['追猎视线', '弹道射程 +15%，暴击率 +3%', talentBoost(['rangeMul', 1.15, 'mul'], ['crit', .03])],
    ], end: ['游击猎手', '闪避后下一击追加 2 枚追踪飞刀，伤害各 35%', talentBoost(['rollVolley', true, 'flag'])] },
    { name: '狙击', icons: ['tal_range', 'sword', 'tal_pierce', 'tal_crit', 'tal_multishot', 'tal_homing'], nodes: [
      ['远距测算', '远程弹道射程 +20%', talentBoost(['rangeMul', 1.2, 'mul'])],
      ['箭簇开锋', '基础攻击力 +0.5', talentBoost(['dmg', .5])],
      ['贯穿箭簇', '远程弹道穿透 +1', talentBoost(['pierce', 1])],
      ['弱点标记', '暴击率 +5%，暴击倍率 +0.15', talentBoost(['crit', .05], ['critMul', .15])],
      ['散射研习', '游侠套装的分裂飞刀 +1 枚', talentBoost(['splitN', 1])],
    ], end: ['星引箭矢', '远程弹道获得追踪，穿透 +2', talentBoost(['homing', true, 'flag'], ['pierce', 2])] },
    { name: '毒刃', icons: ['tal_poison', 'tal_reach', 'tal_dot', 'feather', 'tal_crit', 'tal_execution'], nodes: [
      ['淬毒工艺', '攻击附加中毒几率 +8%', talentBoost(['poison', .08])],
      ['暗影锋刃', '近战范围 +8%，暴击率 +3%', talentBoost(['reachMul', 1.08, 'mul'], ['crit', .03])],
      ['毒性渗透', '点燃与中毒伤害 +20%', talentBoost(['dotMul', .2])],
      ['致命节拍', '攻击速度 +8%', talentBoost(['atkSpd', .08])],
      ['猎杀直觉', '暴击倍率 +0.25，移速 +4%', talentBoost(['critMul', .25], ['speed', 1.04, 'mul'])],
    ], end: ['影袭处决', '闪避后下一击必暴击，暴击倍率 +0.4', talentBoost(['rollCrit', true, 'flag'], ['critMul', .4])] },
  ],
  mage: [
    { name: '元素', icons: ['tal_fire', 'tal_frost', 'bolt', 'tal_proc', 'tal_dot', 'tal_elements'], nodes: [
      ['引燃术式', '攻击点燃几率 +8%', talentBoost(['burn', .08])],
      ['寒霜刻印', '攻击冻结几率 +6%', talentBoost(['freeze', .06])],
      ['雷电导引', '攻击连锁闪电几率 +6%', talentBoost(['chain', .06])],
      ['元素催化', '所有攻击特效触发几率 ×1.1', talentBoost(['procMul', 1.1, 'mul'])],
      ['复合咒印', '点燃与中毒伤害 +25%', talentBoost(['dotMul', .25])],
    ], end: ['元素回响', '主武器每命中 4 次，追加一次随机元素', talentBoost(['elementEcho', true, 'flag'])] },
    { name: '环法', icons: ['tal_range', 'tal_shield', 'orbit', 'tal_nova', 'hourglass', 'tal_starorbit'], nodes: [
      ['奥术延伸', '弹道射程 +15%', talentBoost(['rangeMul', 1.15, 'mul'])],
      ['魔力护体', '生命上限 +1 心，格挡率 +3%', talentBoost(['maxHp', 2], ['block', .03])],
      ['环刃入门', '增加 1 把环绕飞刃', talentBoost(['orbit', 1])],
      ['符文共振', '奥术新星伤害 +30%', talentBoost(['novaMul', .3])],
      ['星环加速', '攻击速度 +7%，新星冷却 -0.4 秒', talentBoost(['atkSpd', .07], ['novaCd', -.4])],
    ], end: ['群星护环', '增加 2 把环绕飞刃，持续伤害 +40%', talentBoost(['orbit', 2], ['dotMul', .4])] },
    { name: '灾变', icons: ['bomb', 'tal_nova', 'tal_poison', 'tal_crit', 'bomb', 'tal_storm'], nodes: [
      ['爆燃火种', '击杀爆炸几率 +6%', talentBoost(['explode', .06])],
      ['溅射咒文', '武器溅射范围 +15%', talentBoost(['splashMul', 1.15, 'mul'])],
      ['腐蚀秘术', '攻击中毒几率 +8%', talentBoost(['poison', .08])],
      ['法术暴击', '暴击率 +4%，暴击倍率 +0.2', talentBoost(['crit', .04], ['critMul', .2])],
      ['灾厄扩散', '击杀爆炸几率 +8%，触发几率 ×1.08', talentBoost(['explode', .08], ['procMul', 1.08, 'mul'])],
    ], end: ['雷暴领域', '连锁闪电几率 +18%，武器溅射范围 +35%', talentBoost(['chain', .18], ['splashMul', 1.35, 'mul'])] },
  ],
  cleric: [
    { name: '救赎', icons: ['heart', 'tal_regen', 'tal_heal', 'tal_drain', 'tal_regen', 'tal_sanctuary'], nodes: [
      ['强韧信仰', '生命上限 +1 颗心', talentBoost(['maxHp', 2])],
      ['愈合祷文', '每 18 秒回复半颗心', talentBoost(['regen', 18, 'min'])],
      ['仁慈之手', '所有治疗量 +半颗心', talentBoost(['healBonus', 1])],
      ['生命回流', '击杀时 5% 几率回复半颗心', talentBoost(['vamp', .05])],
      ['余烬复苏', '每 10 秒回复半颗心，生命上限 +1 心', talentBoost(['regen', 10, 'min'], ['maxHp', 2])],
    ], end: ['守护祷言', '每房一次：受伤未倒下且至半血，回复 2 心', talentBoost(['sanctuary', true, 'flag'])] },
    { name: '圣盾', icons: ['tal_shield', 'amulet', 'heart', 'tal_shield', 'tal_thorns', 'tal_dawnshield'], nodes: [
      ['祝福甲片', '格挡率 +4%', talentBoost(['block', .04])],
      ['圣盾容器', '牧师溢出治疗圣盾上限 +1', talentBoost(['shieldCap', 1])],
      ['护佑之躯', '生命上限 +1 心，反伤 +1 点', talentBoost(['maxHp', 2], ['thorns', 1])],
      ['守护誓约', '格挡率 +5%，圣盾上限 +1', talentBoost(['block', .05], ['shieldCap', 1])],
      ['棘光护甲', '受伤反伤 +3 点', talentBoost(['thorns', 3])],
    ], end: ['黎明庇护', '每次进入房间获得一次护盾；圣盾上限 +1', talentBoost(['shield', true, 'flag'], ['shieldCap', 1])] },
    { name: '审判', icons: ['holy', 'tal_fire', 'tal_smite', 'tal_nova', 'holy', 'tal_seraph'], nodes: [
      ['圣光聚焦', '圣光弹命中治疗几率 +3%', talentBoost(['holyHeal', .03])],
      ['净化之火', '攻击点燃几率 +6%', talentBoost(['burn', .06])],
      ['审判扩散', '圣光审判目标 +1', talentBoost(['smiteN', 1])],
      ['神圣增幅', '圣光审判伤害 +30%，溅射范围 +10%', talentBoost(['smiteMul', .3], ['splashMul', 1.1, 'mul'])],
      ['光明回响', '圣光弹命中治疗几率 +4%', talentBoost(['holyHeal', .04])],
    ], end: ['炽天使祝福', '每 10 秒回复半心；圣光弹治疗几率 +10%', talentBoost(['regen', 10, 'min'], ['holyHeal', .1])] },
  ],
  bard: [
    { name: '战歌', icons: ['feather', 'sword', 'tal_frost', 'boots', 'horn', 'tal_chorus'], nodes: [
      ['战鼓起拍', '攻击速度 +6%', talentBoost(['atkSpd', .06])],
      ['高亢和声', '基础攻击力 +0.5', talentBoost(['dmg', .5])],
      ['震颤尾音', '攻击冻结几率 +5%', talentBoost(['freeze', .05])],
      ['鼓舞行军', '移动速度 +6%，攻击速度 +4%', talentBoost(['speed', 1.06, 'mul'], ['atkSpd', .04])],
      ['终章重奏', '吟游套装终章伤害 +30%', talentBoost(['finaleMul', .3])],
    ], end: ['战歌回旋', '主武器每命中 6 次，释放一圈音波攻击', talentBoost(['battleChorus', true, 'flag'])] },
    { name: '灵感', icons: ['tal_inspiration', 'book', 'note', 'tal_resonance', 'tal_inspiration', 'tal_muse'], nodes: [
      ['即兴创作', '吟游套装灵感积累速度 +20%', talentBoost(['insGain', 1.2, 'mul'])],
      ['记忆乐章', '吟游套装灵感上限 +2', talentBoost(['insCap', 2])],
      ['胜利颂歌', '启用吟游灵感后，击杀额外获得 1 层', talentBoost(['insKill', 1])],
      ['余音绕梁', '每层吟游灵感效果 +0.5%', talentBoost(['insPer', .005])],
      ['灵感喷涌', '吟游灵感积累 +25%，上限 +3', talentBoost(['insGain', 1.25, 'mul'], ['insCap', 3])],
    ], end: ['缪斯眷顾', '吟游灵感上限 +5，每层效果 +1.5%', talentBoost(['insCap', 5], ['insPer', .015])] },
    { name: '控场', icons: ['boots', 'tal_range', 'tal_frost', 'tal_dodge', 'tal_proc', 'tal_silence'], nodes: [
      ['漫游之靴', '移动速度 +5%', talentBoost(['speed', 1.05, 'mul'])],
      ['延音技巧', '远程弹道射程 +15%', talentBoost(['rangeMul', 1.15, 'mul'])],
      ['镇魂小调', '攻击冻结几率 +6%', talentBoost(['freeze', .06])],
      ['轻快舞步', '闪避冷却 -8%，格挡率 +3%', talentBoost(['rollCd', .92, 'mul'], ['block', .03])],
      ['颤音共鸣', '所有攻击特效触发几率 ×1.1', talentBoost(['procMul', 1.1, 'mul'])],
    ], end: ['静谧舞台', '攻击冻结几率 +15%，移动速度 +10%', talentBoost(['freeze', .15], ['speed', 1.1, 'mul'])] },
  ],
  summoner: [
    { name: '亡魂', icons: ['tal_spirit', 'hourglass', 'lantern', 'feather', 'tal_spirit', 'tal_soulguide'], nodes: [
      ['魂火饲育', '召唤物伤害 +15%', talentBoost(['minionDmg', 1.15, 'mul'])],
      ['幽魂延续', '套装击杀召唤的幽魂持续 +2 秒', talentBoost(['ghostT', 2])],
      ['亡灵回声', '召唤师五件套召魂几率 +10%', talentBoost(['ghostP', .1])],
      ['魂群躁动', '召唤物攻速 +15%', talentBoost(['minionSpd', 1.15, 'mul'])],
      ['灵界守望', '生命上限 +1 心，召唤物伤害 +15%', talentBoost(['maxHp', 2], ['minionDmg', 1.15, 'mul'])],
    ], end: ['亡魂接引', '每杀 3 敌且临时幽魂少于 3 只时，唤幽魂 6 秒', talentBoost(['soulGuide', true, 'flag'])] },
    { name: '统御', icons: ['tal_spirit', 'feather', 'tal_legion', 'feather', 'tal_legion', 'tal_commander'], nodes: [
      ['使魔学徒', '永久召唤物 +1', talentBoost(['minions', 1])],
      ['灵魂鞭策', '召唤物攻速 +12%', talentBoost(['minionSpd', 1.12, 'mul'])],
      ['群体契约', '召唤物伤害 +20%', talentBoost(['minionDmg', 1.2, 'mul'])],
      ['指挥节律', '召唤物攻速 +15%，自身移速 +3%', talentBoost(['minionSpd', 1.15, 'mul'], ['speed', 1.03, 'mul'])],
      ['军团誓约', '永久召唤物 +1，生命上限 +1 心', talentBoost(['minions', 1], ['maxHp', 2])],
    ], end: ['万灵统帅', '永久召唤物 +2', talentBoost(['minions', 2])] },
    { name: '疫火', icons: ['tal_poison', 'tal_fire', 'tal_dot', 'tal_proc', 'fang', 'tal_plague'], nodes: [
      ['剧毒使魔', '召唤物攻击中毒几率 +10%', talentBoost(['minionPoison', .1])],
      ['燃魂使魔', '召唤物攻击点燃几率 +10%', talentBoost(['minionBurn', .1])],
      ['腐化蔓延', '所有点燃与中毒伤害 +20%', talentBoost(['dotMul', .2])],
      ['疫火契约', '召唤物点燃与中毒几率各 +10%', talentBoost(['minionBurn', .1], ['minionPoison', .1])],
      ['噬魂凶性', '召唤物伤害 +20%，持续伤害 +15%', talentBoost(['minionDmg', 1.2, 'mul'], ['dotMul', .15])],
    ], end: ['灾厄兽群', '召唤物点燃与中毒几率各 +30%', talentBoost(['minionBurn', .3], ['minionPoison', .3])] },
  ],
};
for (const [cls, routes] of Object.entries(TALENT_ROUTES)) {
  routes.forEach((route, branch) => {
    let prev = 'cap_' + cls;
    [...route.nodes, route.end].forEach(([name, text, fx], step) => {
      const id = `path_${cls}_${branch}_${step}`, C = CLASSES[cls];
      TALENT_DEFS.push({ id, r: 5 + step, a: SECTOR[cls] + (branch - 1) * 18, cls, route: route.name,
        name, max: 1, cost: [[75, 110, 155, 210, 280, 420][step]],
        ic: talentEffectIcon(route.icons[step]), col: C.col,
        link: [prev], requires: [prev], keystone: step === 5, desc: () => text, fx });
      prev = id;
    });
  });
}
const TALENT_BRIDGES = [
  ['warrior', 'ranger', '战场拾荒', '拾取范围 +25%，金币掉落 +10%', talentBoost(['magnet', 1.25, 'mul'], ['goldMul', .1]), '冒险老兵', '生命上限 +1 心，暴击倍率 +0.15', talentBoost(['maxHp', 2], ['critMul', .15])],
  ['ranger', 'mage', '精准施法', '弹道射程 +10%，暴击率 +3%', talentBoost(['rangeMul', 1.1, 'mul'], ['crit', .03]), '危险实验', '特效触发几率 ×1.1，格挡率 +3%', talentBoost(['procMul', 1.1, 'mul'], ['block', .03])],
  ['mage', 'cleric', '秘法补给', '宝箱升阶几率 +5%，金币掉落 +10%', talentBoost(['luck', .05], ['goldMul', .1]), '光暗交织', '持续伤害 +15%，所有治疗量 +半颗心', talentBoost(['dotMul', .15], ['healBonus', 1])],
  ['cleric', 'bard', '旅途祝福', '生命上限 +1 心，拾取范围 +20%', talentBoost(['maxHp', 2], ['magnet', 1.2, 'mul']), '朝圣巡礼', '每 14 秒回复半颗心，移速 +5%', talentBoost(['regen', 14, 'min'], ['speed', 1.05, 'mul'])],
  ['bard', 'summoner', '寻宝和鸣', '金币掉落 +15%，宝箱升阶几率 +4%', talentBoost(['goldMul', .15], ['luck', .04]), '灵魂合唱', '召唤物攻速 +10%，自身攻速 +5%', talentBoost(['minionSpd', 1.1, 'mul'], ['atkSpd', .05])],
  ['summoner', 'warrior', '征战契约', '召唤物伤害 +10%，反伤 +1 点', talentBoost(['minionDmg', 1.1, 'mul'], ['thorns', 1]), '生死盟约', '击杀治疗几率 +4%，生命上限 +1 心', talentBoost(['vamp', .04], ['maxHp', 2])],
];
const TALENT_BRIDGE_ICONS = [
  ['magnet', 'heart'], ['tal_range', 'tal_proc'], ['clover', 'tal_heal'],
  ['heart', 'tal_regen'], ['clover', 'tal_resonance'], ['tal_thorns', 'tal_drain'],
];
TALENT_BRIDGES.forEach(([left, right, n1, d1, f1, n2, d2, f2], i) => {
  [[n1, d1, f1, 6, 1], [n2, d2, f2, 9, 4]].forEach(([name, text, fx, r, step], j) => {
    TALENT_DEFS.push({ id: `bridge_${i}_${j}`, name, r, a: SECTOR[left] + 30, max: 1, cost: [j ? 250 : 100],
      ic: talentEffectIcon(TALENT_BRIDGE_ICONS[i][j]), col: '#d8ccbc',
      link: [`path_${left}_2_${step}`, `path_${right}_0_${step}`], desc: () => text, fx });
  });
});

const TALENTS = TALENT_DEFS;
const TALENT_BY_ID = Object.fromEntries(TALENTS.map(t => [t.id, t]));
// undirected adjacency: a node is learnable if it is the core or any neighbour has Lv.1+
const TALENT_ADJ = Object.fromEntries(TALENTS.map(t => [t.id, new Set()]));
for (const t of TALENTS) for (const o of t.link) { TALENT_ADJ[t.id].add(o); TALENT_ADJ[o].add(t.id); }
const talentOpen = t => t.id === 'core' || (t.requires ? t.requires.every(id => lv(id) > 0) : [...TALENT_ADJ[t.id]].some(o => lv(o) > 0));
const talentLockText = t => t.requires ? '前置：' + t.requires.map(id => TALENT_BY_ID[id].name).join('、') : '需要先点亮一个相邻的节点';
const talentCost = t => t.cost[lv(t.id)];
function buyTalent(t) {
  if (!metaSaveReady()) return false;
  const c = talentCost(t);
  if (c === undefined || META.souls < c || !talentOpen(t)) return false;
  META.souls -= c; META.lv[t.id] = lv(t.id) + 1; townServiceEvent('talent'); saveMeta(); return true;
}
// polar -> tree space (px, origin at the core)
const RING_R = [0, 30, 58, 84, 110, 144, 178, 212, 246, 280, 320];
function talentPos(t) { const r = RING_R[t.r], a = t.a * Math.PI / 180; return [Math.cos(a) * r, Math.sin(a) * r * 0.86]; }
// ---------------------------------------------------------------- one-time respec when the old 18-node tree is found in a save
// prices of the old tree, used to refund every soul spent on it. Runs once (META.treeVer).
const OLD_TALENT_COST = { atk: [15, 30, 55, 90], crit: [20, 40, 70], aspd: [25, 50, 85], cdmg: [50, 100], fury: [45, 90], blade: [160],
  vit: [20, 45, 80], roll: [25, 50], heal: [30, 60], spd: [15, 30, 50], vamp: [40, 80], undying: [180],
  gold: [15, 30, 50], luck: [20, 40, 70], shop: [25, 50], start: [40, 100], soul: [30, 60, 100], slot: [60, 130] };
const TREE_VER = 2;
function respecOldTree() {
  if ((META.treeVer || 1) >= TREE_VER) return 0;
  let back = 0;
  for (const [id, l] of Object.entries(META.lv || {})) { const c = OLD_TALENT_COST[id]; if (c) for (let i = 0; i < l && i < c.length; i++) back += c[i]; }
  META.lv = {}; META.souls = (META.souls || 0) + back; META.treeVer = TREE_VER; META.refund = back;
  return back;
}

// Runtime keystones work independently of equipment set thresholds. Secondary damage never re-triggers main-hit counters.
function talentCombatHook(ev, a, b, c) {
  const p = G.player, S = CS();
  if (ev === 'enter') { S.sanctuaryUsed = false; S.rollVolleyReady = false; return; }
  if (G.mode !== 'play') return;
  if (ev === 'guard' && p.guardQuake && (S.guardQuakeAt || 0) <= G.time) {
    S.guardQuakeAt = G.time + 4; quakeWave(p); addFloat(p.x, p.y - 26, '坚城反击', '#ff8a5a');
  }
  if (ev === 'roll' && p.rollVolley) S.rollVolleyReady = true;
  if (ev === 'attack' && p.rollVolley && S.rollVolleyReady) {
    S.rollVolleyReady = false; throwKnives(p, p.face, a * 0.35, 2);
    addFloat(p.x, p.y - 24, '游击追击', '#8ad05a');
  }
  if (ev === 'hit' && !(c && c.fromMinion)) {
    if (p.elementEcho && (S.elementHits = (S.elementHits || 0) + 1) % 4 === 0) {
      const e = a, dmg = b;
      G.later.push({ t: 0.01, fn: () => { if (e.hp > 0) { randomElement(e, dmg); ring(e.x, e.y - 6, 12, [106, 168, 255], 0.25); } } });
    }
    if (p.battleChorus && (S.chorusHits = (S.chorusHits || 0) + 1) % 6 === 0) {
      // Defer until damageEnemy has completed its kill bookkeeping, avoiding duplicate rewards.
      G.later.push({ t: 0.01, fn: () => {
        const d = playerDmg(), attackCtx = newCombatAttack(); ring(p.x, p.y - 6, 56, [255, 138, 216], 0.4); SFX.magic();
        addFloat(p.x, p.y - 26, '战歌回旋', '#ff8ad8');
        for (const e of [...G.enemies]) if (e.hp > 0 && e.spawn <= 0 && dist(p.x, p.y, e.x, e.y) < 56 + e.hw)
          damageEnemy(e, d, false, e.x - p.x, e.y - p.y, { kb: 100, col: '#ff8ad8', attackCtx });
      } });
    }
  }
  // shares the healing-skill cooldown; while it runs the prayer waits for the next qualifying hit
  if (ev === 'hurt' && p.sanctuary && !S.sanctuaryUsed && p.hp > 0 && p.hp <= p.maxHp / 2 && procHeal(p, 4)) {
    S.sanctuaryUsed = true; p.inv = Math.max(p.inv, 1);
    ring(p.x, p.y - 7, 24, [255, 224, 128], 0.45); addFloat(p.x, p.y - 28, '守护祷言', '#ffe080');
  }
  if (ev === 'kill' && p.soulGuide && (S.guideKills = (S.guideKills || 0) + 1) % 3 === 0 &&
      G.minions.filter(m => m.max > 0).length < 3) {
    addMinion('ghost', a.x, a.y, 6);
  }
}
