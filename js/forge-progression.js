'use strict';
// 局外永久成长与武器工坊。配方决定物品本体，养成属于玩家；同一配方在联机中有相同的物品 ID。
const FORGE_TRAINING = [
  { id: 'vitality', name: '体魄', max: 20, icon: 'heart', col: '#ee8f99', description: '每级生命上限 +半颗心', summary: n => `生命上限 +${n / 2} 颗心`, fx: (s, n) => { s.maxHp += n; } },
  { id: 'power', name: '力量', max: 20, icon: 'sword', col: '#e5ba7b', description: '每级基础攻击力 +0.25', summary: n => `基础攻击力 +${n * 0.25}`, fx: (s, n) => { s.dmg += n * 0.25; } },
  { id: 'haste', name: '迅击', max: 20, icon: 'feather', col: '#91d4d6', description: '每级基础攻击速度 +1.2%', summary: n => `基础攻击速度 +${(n * 1.2).toFixed(1)}%`, fx: (s, n) => { s.atkSpd *= 1 + n * 0.012; } },
  { id: 'stride', name: '步法', max: 20, icon: 'boots', col: '#93c994', description: '每级基础移动速度 +1', summary: n => `基础移动速度 +${n}`, fx: (s, n) => { s.speed += n; } },
  { id: 'precision', name: '洞察', max: 20, icon: 'eye', col: '#e3cf89', description: '每级暴击率 +0.6%', summary: n => `暴击率 +${(n * 0.6).toFixed(1)}%`, fx: (s, n) => { s.crit += n * 0.006; } },
  { id: 'ferocity', name: '破绽', max: 20, icon: 'gem', col: '#c8a2e7', description: '每级暴击伤害倍率 +0.025', summary: n => `暴击伤害倍率 +${(n * 0.025).toFixed(3)}`, fx: (s, n) => { s.critMul += n * 0.025; } },
  { id: 'evasion', name: '身法', max: 20, icon: 'hourglass', col: '#a5bfea', description: '每级闪避恢复效率 +3.5%', summary: n => `闪避冷却缩短 ${Math.round((1 - 1 / (1 + n * 0.035)) * 100)}%`, fx: (s, n) => { s.rollCd /= 1 + n * 0.035; } },
  { id: 'magnet', name: '感知', max: 20, icon: 'magnet', col: '#bdabc7', description: '每级基础拾取范围 +6%', summary: n => `基础拾取范围 +${n * 6}%`, fx: (s, n) => { s.magnet *= 1 + n * 0.06; } },
];
const FORGE_TYPES = [
  { id: 'sword', name: '长剑', icon: 'sword', cls: 'warrior', description: '均衡挥砍，适合近战连击' },
  { id: 'axe', name: '战斧', icon: 'axe', cls: 'warrior', description: '宽幅重劈，单击伤害高' },
  { id: 'spear', name: '长枪', icon: 'spear', cls: 'warrior', description: '远距突刺，保持攻击距离' },
  { id: 'dagger', name: '匕首', icon: 'dagger', cls: 'ranger', description: '快速近身连击，适合触发效果' },
  { id: 'hammer', name: '战锤', icon: 'hammer', cls: 'warrior', description: '环形重击，压制身边敌人' },
  { id: 'staff', name: '法杖', icon: 'staff', cls: 'mage', description: '发射魔法飞弹，远程攻击' },
  { id: 'bow', name: '长弓', icon: 'bow', cls: 'ranger', description: '远程箭矢，自带弹道穿透' },
];
const FORGE_PARTS = {
  head: [
    { id: 'iron', name: '秘银锋体', col: '#c8d8e8', cost: 45, description: '攻击力 +2.2', fx: s => { s.dmg += 2.2; } },
    { id: 'keen', name: '锐晶锋体', col: '#ddbded', cost: 65, description: '攻击力 +1.2，暴击率 +10%', fx: s => { s.dmg += 1.2; s.crit += 0.1; } },
    { id: 'bulwark', name: '重钢锋体', col: '#a8b5c3', cost: 60, description: '攻击力 +1.8，格挡率 +8%', fx: s => { s.dmg += 1.8; s.block += 0.08; } },
    { id: 'long', name: '延展锋体', col: '#90cddd', cost: 55, description: '攻击力 +1.2，攻击距离 +20%', fx: s => { s.dmg += 1.2; s.reachMul *= 1.2; s.rangeMul = (s.rangeMul || 1) * 1.2; } },
    { id: 'rapid', name: '轻羽锋体', col: '#b1dba0', cost: 60, description: '攻击力 +1.2，攻击速度 +15%', fx: s => { s.dmg += 1.2; s.atkSpd *= 1.15; } },
  ],
  grip: [
    { id: 'oak', name: '古木握柄', col: '#966c44', cost: 35, description: '攻击力 +0.8，生命上限 +半颗心', fx: s => { s.dmg += 0.8; s.maxHp += 1; } },
    { id: 'silk', name: '月丝握柄', col: '#bab1d5', cost: 50, description: '暴击伤害倍率 +0.35', fx: s => { s.critMul += 0.35; } },
    { id: 'wind', name: '风纹握柄', col: '#73bba1', cost: 45, description: '移动速度 +8%，闪避冷却 -10%', fx: s => { s.speed *= 1.08; s.rollCd *= 0.9; } },
    { id: 'guard', name: '护誓握柄', col: '#cfb073', cost: 50, description: '生命上限 +1 颗心，格挡率 +6%', fx: s => { s.maxHp += 2; s.block += 0.06; } },
    { id: 'beast', name: '兽牙握柄', col: '#cc8790', cost: 55, description: '攻击速度 +10%，击杀吸血率 +6%', fx: s => { s.atkSpd *= 1.1; s.vamp += 0.06; } },
  ],
  core: [
    { id: 'star', name: '星核', col: '#c8a4ef', cost: 120, description: '攻击力 +1.5，暴击率 +6%', fx: s => { s.dmg += 1.5; s.crit += 0.06; } },
    { id: 'flame', name: '熔火核', col: '#ed9a61', cost: 110, description: '攻击力 +0.8，点燃几率 +35%', fx: s => { s.dmg += 0.8; s.burn += 0.35; } },
    { id: 'frost', name: '寒霜核', col: '#8dd4ec', cost: 110, description: '攻击力 +0.8，冻结几率 +25%', fx: s => { s.dmg += 0.8; s.freeze += 0.25; } },
    { id: 'storm', name: '雷霆核', col: '#eee09a', cost: 125, description: '攻击力 +0.8，连锁闪电几率 +25%', fx: s => { s.dmg += 0.8; s.chain += 0.25; } },
    { id: 'blood', name: '血珀核', col: '#e59ba5', cost: 120, description: '攻击力 +0.8，击杀吸血率 +15%', fx: s => { s.dmg += 0.8; s.vamp += 0.15; } },
  ],
  rune: [
    { id: 'power', name: '破军铭文', col: '#dfa781', cost: 75, description: '攻击力 +1.5', fx: s => { s.dmg += 1.5; } },
    { id: 'precision', name: '鹰眼铭文', col: '#b1d690', cost: 85, description: '暴击率 +8%，弹道穿透 +1', fx: s => { s.crit += 0.08; s.pierce += 1; } },
    { id: 'echo', name: '回响铭文', col: '#c6a7ed', cost: 100, description: '攻击附带 1 道剑气', fx: s => { s.wave += 1; } },
    { id: 'hunt', name: '追猎铭文', col: '#99bbdf', cost: 90, description: '攻击距离 +15%，远程弹道追踪', fx: s => { s.reachMul *= 1.15; s.rangeMul = (s.rangeMul || 1) * 1.15; s.homing = true; } },
    { id: 'fortune', name: '寻宝铭文', col: '#e6ce8d', cost: 80, description: '宝箱升阶几率 +8%，拾取范围 +40%', fx: s => { s.chestLuck += 0.08; s.magnet *= 1.4; } },
  ],
};
// 四个旧部位保留原属性和配方 ID；新增结构并非装饰数字，每个部位有真正的战斗取舍。
const FORGE_SLOTS = ['head', 'grip', 'core', 'rune', 'guard', 'pommel', 'shaft', 'edge', 'channel', 'socket'];
const FORGE_LEGACY_SLOTS = ['head', 'grip', 'core', 'rune'];
const FORGE_DESIGN_MAX = 24;
const FORGE_SLOT_NAMES = {
  head: { default: '锋体', bow: '弓臂', staff: '杖首', hammer: '锤头', axe: '斧首', spear: '枪头', dagger: '匕刃' },
  grip: { default: '握柄', bow: '弓把', staff: '握杖' }, core: { default: '灵核' }, rune: { default: '铭文' },
  guard: { default: '护手', bow: '护弦片', staff: '护环', hammer: '锤箍', spear: '枪翼', axe: '护箍' },
  pommel: { default: '尾饰', bow: '弓尾饰', staff: '杖尾', spear: '枪鐏', hammer: '柄尾' },
  shaft: { default: '连接轴', bow: '弓肢接头', staff: '杖身', spear: '枪杆', hammer: '锤柄', axe: '斧柄' },
  edge: { default: '刃纹', bow: '弓梢', staff: '晶面', hammer: '锤面' },
  channel: { default: '传动', bow: '弦索', staff: '导灵槽', spear: '导力槽' }, socket: { default: '嵌饰' },
};
const FORGE_DIMENSIONS = [
  { id: 'length', name: '长度', options: [
    { id: 0, name: '短巧', description: '距离 -22%，伤害 -10%，攻速 +10%' },
    { id: 1, name: '偏短', description: '距离 -11%，伤害 -5%，攻速 +5%' },
    { id: 2, name: '标准', description: '标准长度，无属性修正' },
    { id: 3, name: '加长', description: '距离 +11%，伤害 +5%，攻速 -5%' },
    { id: 4, name: '超长', description: '距离 +22%，伤害 +10%，攻速 -10%' },
  ] },
  { id: 'weight', name: '厚重', options: [
    { id: 0, name: '纤薄', description: '伤害 -20%，攻速 +16%' },
    { id: 1, name: '轻薄', description: '伤害 -10%，攻速 +8%' },
    { id: 2, name: '标准', description: '标准厚度，无属性修正' },
    { id: 3, name: '厚铸', description: '伤害 +12%，攻速 -11%' },
    { id: 4, name: '重铸', description: '伤害 +25%，攻速 -22%' },
  ] },
  { id: 'balance', name: '重心', options: [
    { id: 0, name: '柄侧', description: '伤害 -8%，攻速 +10%，暴击率 +4%' },
    { id: 1, name: '后置', description: '伤害 -4%，攻速 +5%，暴击率 +2%' },
    { id: 2, name: '居中', description: '均衡重心，无属性修正' },
    { id: 3, name: '前置', description: '伤害 +5%，攻速 -5%，暴击率 -1%' },
    { id: 4, name: '锋侧', description: '伤害 +10%，攻速 -10%，暴击率 -2%' },
  ] },
];
const FORGE_DYES = [
  { id: 'original', name: '原材本色', col: null, accent: null },
  { id: 'steel', name: '冰银', col: '#d9e7ed', accent: '#8fb4d1' },
  { id: 'obsidian', name: '曜黑', col: '#56586e', accent: '#c2b4d8' },
  { id: 'crimson', name: '绯红', col: '#d16972', accent: '#f3c19a' },
  { id: 'azure', name: '苍蓝', col: '#7baedb', accent: '#c2eafa' },
  { id: 'jade', name: '青玉', col: '#8bc6a5', accent: '#d9edb6' },
  { id: 'gold', name: '鎏金', col: '#d9b867', accent: '#fff0b3' },
  { id: 'violet', name: '紫晶', col: '#bba0db', accent: '#f2d7fb' },
];
function forgeRichFX(effects) {
  return s => {
    for (const [key, value] of Object.entries(effects.add || {})) s[key] = (s[key] || 0) + value;
    for (const [key, value] of Object.entries(effects.mul || {})) s[key] = (Number.isFinite(s[key]) ? s[key] : 1) * value;
    for (const [key, value] of Object.entries(effects.set || {})) s[key] = value;
  };
}
function forgeSlotName(slot, type) {
  const names = FORGE_SLOT_NAMES[slot];
  return names ? names[type] || names.default : slot;
}
function forgeRichPart(slot, spec) {
  const [id, name, tier, description, effects, tags = [], types] = spec;
  const colors = { flame: '#ed9961', frost: '#9bdbe9', storm: '#eadb8a', poison: '#93ce83', blood: '#d98a9d',
    star: '#c5a6e6', echo: '#c4abe0', wind: '#90ccb8', guard: '#b0bfcc', heavy: '#9aa7b8', precision: '#d5d6a1', wealth: '#e6c575' };
  const col = colors[tags[0]] || ['#c4d5df', '#a9c7cf', '#cfb0e1', '#c5b888', '#e7d5ad'][tier - 1];
  const metal = tier === 1 ? 'iron' : tier === 2 ? 'steel' : 'fine';
  const materials = {};
  if (['grip', 'shaft'].includes(slot)) { materials.wood = tier < 3 ? 2 : 3; materials[metal] = tier > 2 ? 2 : 1; }
  else if (['core', 'rune', 'socket', 'channel'].includes(slot)) { materials[metal] = tier > 2 ? 2 : 1; materials.essence = tier > 1 ? tier - 1 : 1; }
  else { materials[metal] = tier > 2 ? 3 : 2; }
  if (tags.includes('flame')) materials.coal = 1 + Math.floor(tier / 2);
  if (tags.includes('heavy')) materials[metal]++;
  const index = FORGE_PARTS[slot].length;
  return { id, name, tier, description, effects, tags, types, shape: id, col,
    cost: 20 + tier * 18 + index * 2, requiredSkill: [0, 1, 3, 6, 10, 15][tier], materials,
    researchCost: [0, 4, 8, 18, 30, 48][tier] + index % 3, fx: forgeRichFX(effects) };
}
const FORGE_RICH_SPECS = {
  head: [
    ['cleaver', '阔背锋体', 1, '攻击力 +2.6，攻速 -8%', { add: { dmg: 2.6 }, mul: { atkSpd: .92 } }, ['heavy']],
    ['needle', '针锋刺体', 2, '暴击率 +8%，距离 +18%，伤害 -0.5', { add: { crit: .08, dmg: -.5 }, mul: { reachMul: 1.18, rangeMul: 1.18 } }, ['precision'], ['spear', 'dagger']],
    ['crescent', '月钩刃体', 2, '攻击力 +1.5，剑气 +1，攻速 -6%', { add: { dmg: 1.5, wave: 1 }, mul: { atkSpd: .94 } }, ['echo'], ['sword', 'axe']],
    ['venom', '蛇吻锋体', 3, '中毒几率 +22%，暴击伤害 +0.2', { add: { poison: .22, critMul: .2 } }, ['poison']],
    ['meteor', '陨星锋体', 3, '攻击力 +3.5，攻速 -14%，击杀爆炸 +10%', { add: { dmg: 3.5, explode: .1 }, mul: { atkSpd: .86 } }, ['heavy', 'star']],
    ['prism', '棱光锋体', 4, '远程穿透 +2，射程 +20%，攻速 -8%', { add: { pierce: 2 }, mul: { rangeMul: 1.2, atkSpd: .92 } }, ['precision', 'star'], ['staff', 'bow']],
    ['phoenix', '凤焰锋体', 5, '点燃 +20%，持续伤害 +35%，伤害 +1.5', { add: { burn: .2, dotMul: .35, dmg: 1.5 } }, ['flame']],
  ],
  grip: [
    ['corded', '麻绳缠柄', 1, '攻速 +6%，暴击率 +2%', { add: { crit: .02 }, mul: { atkSpd: 1.06 } }, ['swift']],
    ['leather', '赤革握柄', 1, '生命 +半心，闪避冷却 -6%', { add: { maxHp: 1 }, mul: { rollCd: .94 } }, ['blood']],
    ['thorn', '荆棘握柄', 2, '反伤 +2，格挡率 +4%', { add: { thorns: 2, block: .04 } }, ['guard']],
    ['counter', '配重握柄', 2, '伤害 +1.4，攻速 -5%，暴击伤害 +0.15', { add: { dmg: 1.4, critMul: .15 }, mul: { atkSpd: .95 } }, ['heavy']],
    ['raven', '鸦羽握柄', 3, '移速 +6%，攻速 +8%，生命 -半心', { add: { maxHp: -1 }, mul: { speed: 1.06, atkSpd: 1.08 } }, ['wind', 'swift']],
    ['conduit', '导灵握柄', 4, '元素触发倍率 +12%，连锁闪电 +6%', { add: { chain: .06 }, mul: { procMul: 1.12 } }, ['storm']],
    ['royal', '王印握柄', 5, '暴击伤害 +0.5，金币 +20%，攻速 -5%', { add: { critMul: .5, goldMul: .2 }, mul: { atkSpd: .95 } }, ['wealth', 'precision']],
  ],
  core: [
    ['venom', '翠毒核', 2, '中毒 +25%，持续伤害 +10%', { add: { poison: .25, dotMul: .1 } }, ['poison']],
    ['wind', '岚息核', 2, '攻速 +10%，移速 +5%', { mul: { atkSpd: 1.1, speed: 1.05 } }, ['wind', 'swift']],
    ['stone', '岩卫核', 2, '格挡 +8%，反伤 +1，移速 -4%', { add: { block: .08, thorns: 1 }, mul: { speed: .96 } }, ['guard', 'heavy']],
    ['void', '虚空核', 3, '剑气 +1，暴击率 +5%', { add: { wave: 1, crit: .05 } }, ['echo', 'star']],
    ['sun', '日冕核', 4, '点燃 +20%，击杀爆炸 +12%', { add: { burn: .2, explode: .12 } }, ['flame']],
    ['moon', '月魄核', 4, '冻结 +15%，暴击伤害 +0.35', { add: { freeze: .15, critMul: .35 } }, ['frost', 'precision']],
    ['world', '万象核', 5, '点燃/冻结/中毒/闪电各 +8%，攻速 -8%', { add: { burn: .08, freeze: .08, poison: .08, chain: .08 }, mul: { atkSpd: .92 } }, ['flame', 'frost', 'poison', 'storm']],
  ],
  rune: [
    ['tempo', '节律铭文', 1, '攻速 +7%，伤害 -0.3', { add: { dmg: -.3 }, mul: { atkSpd: 1.07 } }, ['swift']],
    ['bulwark', '壁垒铭文', 2, '格挡 +5%，生命 +半心', { add: { block: .05, maxHp: 1 } }, ['guard']],
    ['venom', '蚀骨铭文', 2, '中毒 +12%，持续伤害 +15%', { add: { poison: .12, dotMul: .15 } }, ['poison']],
    ['thunder', '霹雳铭文', 3, '连锁闪电 +12%，暴击率 +3%', { add: { chain: .12, crit: .03 } }, ['storm']],
    ['sacrifice', '献祭铭文', 3, '伤害 +3，生命 -半心，击杀治疗 +4%', { add: { dmg: 3, maxHp: -1, vamp: .04 } }, ['blood', 'heavy']],
    ['inferno', '焚世铭文', 4, '点燃 +12%，持续伤害 +25%，冻结 -5%', { add: { burn: .12, dotMul: .25, freeze: -.05 } }, ['flame']],
    ['singularity', '星涡铭文', 5, '剑气 +1，触发倍率 +15%，攻速 -8%', { add: { wave: 1 }, mul: { procMul: 1.15, atkSpd: .92 } }, ['star', 'echo']],
  ],
  guard: [
    ['cross', '十字护翼', 1, '格挡 +3%，伤害 +0.3', { add: { block: .03, dmg: .3 } }, ['guard']],
    ['basket', '笼式护翼', 2, '格挡 +7%，攻速 -4%', { add: { block: .07 }, mul: { atkSpd: .96 } }, ['guard']],
    ['crescent', '月牙护翼', 2, '暴击率 +4%，距离 +6%', { add: { crit: .04 }, mul: { reachMul: 1.06, rangeMul: 1.06 } }, ['precision']],
    ['fang', '兽牙护翼', 2, '伤害 +0.8，击杀治疗 +3%', { add: { dmg: .8, vamp: .03 } }, ['blood']],
    ['thorn', '刺棘护翼', 3, '反伤 +3，格挡 +3%', { add: { thorns: 3, block: .03 } }, ['guard', 'poison']],
    ['fire', '灼羽护翼', 3, '点燃 +10%，伤害 +0.6', { add: { burn: .1, dmg: .6 } }, ['flame']],
    ['frost', '冰晶护翼', 3, '冻结 +8%，格挡 +3%', { add: { freeze: .08, block: .03 } }, ['frost']],
    ['wing', '风羽护翼', 3, '攻速 +7%，闪避冷却 -5%', { mul: { atkSpd: 1.07, rollCd: .95 } }, ['wind', 'swift']],
    ['mirror', '灵镜护翼', 4, '元素触发倍率 +8%，格挡 +4%', { add: { block: .04 }, mul: { procMul: 1.08 } }, ['star', 'guard']],
    ['storm', '雷鳞护翼', 4, '连锁闪电 +9%，反伤 +2', { add: { chain: .09, thorns: 2 } }, ['storm']],
    ['tower', '塔盾护翼', 5, '格挡 +12%，生命 +1心，移速 -6%', { add: { block: .12, maxHp: 2 }, mul: { speed: .94 } }, ['guard', 'heavy']],
  ],
  pommel: [
    ['round', '圆钢尾饰', 1, '伤害 +0.5，暴击伤害 +0.05', { add: { dmg: .5, critMul: .05 } }, ['heavy']],
    ['ring', '环扣尾饰', 1, '攻速 +4%，移速 +2%', { mul: { atkSpd: 1.04, speed: 1.02 } }, ['swift']],
    ['bead', '禅珠尾饰', 2, '生命 +半心，格挡 +2%', { add: { maxHp: 1, block: .02 } }, ['guard']],
    ['feather', '翠羽尾饰', 2, '闪避冷却 -7%，移速 +3%', { mul: { rollCd: .93, speed: 1.03 } }, ['wind']],
    ['bell', '回音铃饰', 3, '剑气 +1，伤害 -0.4', { add: { wave: 1, dmg: -.4 } }, ['echo']],
    ['fang', '血牙尾饰', 3, '击杀治疗 +5%，伤害 +0.4', { add: { vamp: .05, dmg: .4 } }, ['blood']],
    ['magnet', '吸金尾饰', 3, '拾取范围 +20%，金币 +10%', { add: { goldMul: .1 }, mul: { magnet: 1.2 } }, ['wealth', 'magnet']],
    ['rune', '符晶尾饰', 4, '元素触发倍率 +8%，暴击率 +3%', { add: { crit: .03 }, mul: { procMul: 1.08 } }, ['star']],
    ['frost', '寒铃尾饰', 4, '冻结 +7%，暴击伤害 +0.2', { add: { freeze: .07, critMul: .2 } }, ['frost']],
    ['thunder', '雷鼓尾饰', 4, '连锁闪电 +8%，伤害 +0.7', { add: { chain: .08, dmg: .7 } }, ['storm']],
    ['crown', '帝冠尾饰', 5, '伤害 +1.8，金币 +20%，攻速 -5%', { add: { dmg: 1.8, goldMul: .2 }, mul: { atkSpd: .95 } }, ['wealth', 'heavy']],
  ],
  shaft: [
    ['ash', '白蜡连接件', 1, '距离 +6%，伤害 +0.3', { add: { dmg: .3 }, mul: { reachMul: 1.06, rangeMul: 1.06 } }, ['hunter']],
    ['hollow', '空心连接件', 1, '攻速 +6%，伤害 -0.3', { add: { dmg: -.3 }, mul: { atkSpd: 1.06 } }, ['swift']],
    ['steel', '精钢连接件', 2, '伤害 +1，攻速 -4%', { add: { dmg: 1 }, mul: { atkSpd: .96 } }, ['heavy']],
    ['bamboo', '翠竹连接件', 2, '移速 +4%，距离 +8%', { mul: { speed: 1.04, reachMul: 1.08, rangeMul: 1.08 } }, ['wind', 'hunter']],
    ['telescopic', '伸缩连接件', 3, '距离 +20%，攻速 -8%', { mul: { reachMul: 1.2, rangeMul: 1.2, atkSpd: .92 } }, ['hunter']],
    ['coiled', '盘簧连接件', 3, '攻速 +10%，闪避冷却 -4%', { mul: { atkSpd: 1.1, rollCd: .96 } }, ['swift']],
    ['heavy', '玄铁连接件', 3, '伤害 +1.8，格挡 +3%，移速 -4%', { add: { dmg: 1.8, block: .03 }, mul: { speed: .96 } }, ['heavy', 'guard']],
    ['conductive', '导雷连接件', 4, '连锁闪电 +10%，射程 +8%', { add: { chain: .1 }, mul: { rangeMul: 1.08, reachMul: 1.08 } }, ['storm']],
    ['honeycomb', '蜂巢连接件', 4, '攻速 +9%，暴击率 +4%', { add: { crit: .04 }, mul: { atkSpd: 1.09 } }, ['swift', 'precision']],
    ['bone', '龙骨连接件', 4, '暴击伤害 +0.25，伤害 +0.8', { add: { critMul: .25, dmg: .8 } }, ['blood']],
    ['astral', '星桥连接件', 5, '距离 +20%，剑气 +1，攻速 -6%', { add: { wave: 1 }, mul: { reachMul: 1.2, rangeMul: 1.2, atkSpd: .94 } }, ['star', 'echo']],
  ],
  edge: [
    ['honed', '研磨纹面', 1, '伤害 +0.6，暴击率 +1%', { add: { dmg: .6, crit: .01 } }, ['precision']],
    ['serrated', '锯齿纹面', 2, '中毒 +8%，伤害 +0.6，攻速 -3%', { add: { poison: .08, dmg: .6 }, mul: { atkSpd: .97 } }, ['poison'], ['sword', 'axe', 'spear', 'dagger']],
    ['grooved', '减重槽纹', 2, '攻速 +6%，伤害 -0.2', { add: { dmg: -.2 }, mul: { atkSpd: 1.06 } }, ['swift']],
    ['diamond', '菱面纹路', 2, '暴击伤害 +0.15，暴击率 +2%', { add: { critMul: .15, crit: .02 } }, ['precision']],
    ['hooked', '倒钩纹面', 3, '伤害 +1.2，暴击伤害 +0.1，攻速 -6%', { add: { dmg: 1.2, critMul: .1 }, mul: { atkSpd: .94 } }, ['heavy'], ['axe', 'dagger', 'spear', 'bow']],
    ['frost', '霜裂纹面', 3, '冻结 +9%，暴击率 +2%', { add: { freeze: .09, crit: .02 } }, ['frost']],
    ['flame', '焰蚀纹面', 3, '点燃 +10%，持续伤害 +10%', { add: { burn: .1, dotMul: .1 } }, ['flame']],
    ['prism', '折光纹面', 4, '远程穿透 +1，射程 +8%', { add: { pierce: 1 }, mul: { rangeMul: 1.08 } }, ['star', 'precision'], ['staff', 'bow']],
    ['storm', '雷织纹面', 4, '连锁闪电 +10%，暴击伤害 +0.1', { add: { chain: .1, critMul: .1 } }, ['storm']],
    ['echo', '波纹纹面', 4, '剑气 +1，攻速 -5%', { add: { wave: 1 }, mul: { atkSpd: .95 } }, ['echo']],
    ['void', '虚刃纹面', 5, '暴击率 +6%，伤害 +1.5，距离 +10%', { add: { crit: .06, dmg: 1.5 }, mul: { reachMul: 1.1, rangeMul: 1.1 } }, ['star', 'hunter']],
  ],
  channel: [
    ['plain', '直通导件', 1, '距离 +5%，攻速 +2%', { mul: { reachMul: 1.05, rangeMul: 1.05, atkSpd: 1.02 } }, ['hunter']],
    ['spring', '回弹导件', 2, '攻速 +7%，伤害 -0.3', { add: { dmg: -.3 }, mul: { atkSpd: 1.07 } }, ['swift']],
    ['taut', '强弦导件', 2, '射程 +18%，伤害 +0.8，攻速 -6%', { add: { dmg: .8 }, mul: { rangeMul: 1.18, atkSpd: .94 } }, ['hunter', 'heavy'], ['bow']],
    ['spiral', '螺旋导件', 2, '远程穿透 +1，攻速 +3%', { add: { pierce: 1 }, mul: { atkSpd: 1.03 } }, ['precision'], ['staff', 'bow']],
    ['forked', '分流导件', 3, '额外远程弹道 +1，伤害 -1', { add: { multi: 1, dmg: -1 } }, ['echo'], ['staff', 'bow']],
    ['blood', '血导件', 3, '击杀治疗 +5%，持续伤害 +8%', { add: { vamp: .05, dotMul: .08 } }, ['blood']],
    ['ember', '焰流导件', 3, '点燃 +8%，触发倍率 +5%', { add: { burn: .08 }, mul: { procMul: 1.05 } }, ['flame']],
    ['frost', '霜流导件', 4, '冻结 +8%，射程 +10%', { add: { freeze: .08 }, mul: { reachMul: 1.1, rangeMul: 1.1 } }, ['frost']],
    ['lightning', '电弧导件', 4, '连锁闪电 +10%，触发倍率 +5%', { add: { chain: .1 }, mul: { procMul: 1.05 } }, ['storm']],
    ['tracking', '星引导件', 4, '远程追踪，射程 +10%，攻速 -5%', { set: { homing: true }, mul: { rangeMul: 1.1, atkSpd: .95 } }, ['star', 'hunter'], ['staff', 'bow']],
    ['resonant', '共鸣导件', 5, '剑气 +1，触发倍率 +10%，攻速 -5%', { add: { wave: 1 }, mul: { procMul: 1.1, atkSpd: .95 } }, ['echo', 'star']],
  ],
  socket: [
    ['garnet', '赤榴嵌饰', 1, '伤害 +0.5，点燃 +3%', { add: { dmg: .5, burn: .03 } }, ['flame']],
    ['amber', '琥珀嵌饰', 2, '生命 +半心，击杀治疗 +2%', { add: { maxHp: 1, vamp: .02 } }, ['blood']],
    ['sapphire', '蓝晶嵌饰', 2, '冻结 +6%，暴击率 +2%', { add: { freeze: .06, crit: .02 } }, ['frost']],
    ['emerald', '翡翠嵌饰', 2, '中毒 +8%，移速 +2%', { add: { poison: .08 }, mul: { speed: 1.02 } }, ['poison']],
    ['topaz', '黄晶嵌饰', 3, '连锁闪电 +8%，暴击伤害 +0.1', { add: { chain: .08, critMul: .1 } }, ['storm']],
    ['moonstone', '月石嵌饰', 3, '暴击率 +5%，闪避冷却 -4%', { add: { crit: .05 }, mul: { rollCd: .96 } }, ['precision']],
    ['lodestone', '磁玉嵌饰', 3, '拾取 +25%，宝箱升阶 +3%', { add: { chestLuck: .03 }, mul: { magnet: 1.25 } }, ['magnet', 'wealth']],
    ['diamond', '金刚嵌饰', 4, '暴击伤害 +0.3，格挡 +3%', { add: { critMul: .3, block: .03 } }, ['precision', 'guard']],
    ['amethyst', '紫晶嵌饰', 4, '元素触发倍率 +10%', { mul: { procMul: 1.1 } }, ['star']],
    ['sunstone', '日石嵌饰', 4, '伤害 +1，点燃 +6%，持续伤害 +15%', { add: { dmg: 1, burn: .06, dotMul: .15 } }, ['flame']],
    ['aurora', '虹辉嵌饰', 5, '触发倍率 +12%，暴击率 +4%，金币 +15%', { add: { crit: .04, goldMul: .15 }, mul: { procMul: 1.12 } }, ['star', 'wealth']],
  ],
};
const FORGE_LEGACY_TAGS = {
  head: { iron: [], keen: ['precision'], bulwark: ['guard'], long: ['hunter'], rapid: ['swift'] },
  grip: { oak: [], silk: ['precision'], wind: ['wind'], guard: ['guard'], beast: ['blood', 'swift'] },
  core: { star: ['star'], flame: ['flame'], frost: ['frost'], storm: ['storm'], blood: ['blood'] },
  rune: { power: [], precision: ['precision'], echo: ['echo'], hunt: ['hunter'], fortune: ['wealth', 'magnet'] },
};
for (const slot of FORGE_SLOTS) {
  if (!FORGE_PARTS[slot]) FORGE_PARTS[slot] = [{ id: 'none', name: '保留素件', col: '#929aa7', cost: 0, tier: 0,
    requiredSkill: 1, materials: {}, researchCost: 0, tags: [], shape: 'none', description: '不加装，保留原始结构', fx: () => {} }];
  else for (const part of FORGE_PARTS[slot]) Object.assign(part, { shape: part.id, tags: FORGE_LEGACY_TAGS[slot][part.id] || [] });
  for (const spec of FORGE_RICH_SPECS[slot]) FORGE_PARTS[slot].push(forgeRichPart(slot, spec));
}
function forgePartChoices(slot, recipeOrType) {
  const type = typeof recipeOrType === 'string' ? recipeOrType : recipeOrType && recipeOrType.type;
  return (FORGE_PARTS[slot] || []).filter(p => !p.types || !type || p.types.includes(type));
}
function forgeRecipeSynergies(recipe) {
  const r = forgeRecipeNormalize(recipe);
  if (!r) return [];
  // The old twenty-part recipes keep exactly their original statistics, even after adding a cosmetic dye.
  if (!FORGE_SLOTS.slice(4).some(slot => r[slot] !== 'none') && !FORGE_LEGACY_SLOTS.some(slot => FORGE_PARTS[slot].findIndex(p => p.id === r[slot]) >= 5)) return [];
  const tags = {};
  for (const slot of FORGE_SLOTS) for (const tag of FORGE_PARTS[slot].find(p => p.id === r[slot]).tags || []) tags[tag] = (tags[tag] || 0) + 1;
  const out = [], add = (id, name, description, effects, condition) => {
    if (condition) out.push({ id, name, description, effects, fx: forgeRichFX(effects) });
  };
  add('firestorm', '焰雷交织', '持续伤害 +20%，连锁闪电 +6%', { add: { dotMul: .2, chain: .06 } }, tags.flame && tags.storm);
  add('winterstorm', '霜雷骤击', '冻结 +6%，暴击率 +4%', { add: { freeze: .06, crit: .04 } }, tags.frost && tags.storm);
  add('bloodvenom', '蚀血循环', '击杀治疗 +5%，持续伤害 +15%', { add: { vamp: .05, dotMul: .15 } }, tags.poison && tags.blood);
  add('swiftprecision', '快刃定准', '暴击率 +4%，攻速 +4%', { add: { crit: .04 }, mul: { atkSpd: 1.04 } }, tags.precision && tags.swift);
  add('ironwall', '重铸壁垒', '格挡 +4%，反伤 +1', { add: { block: .04, thorns: 1 } }, tags.heavy && tags.guard);
  add('astralecho', '星响共鸣', '额外剑气 +1', { add: { wave: 1 } }, tags.star && tags.echo);
  add('windhunt', '风引追猎', '攻击距离 +8%，移速 +3%', { mul: { reachMul: 1.08, rangeMul: 1.08, speed: 1.03 } }, tags.wind && tags.hunter);
  add('goldharvest', '集珍磁场', '金币 +15%，宝箱升阶 +3%', { add: { goldMul: .15, chestLuck: .03 } }, (tags.wealth || 0) >= 2 && (tags.magnet || 0) >= 1);
  add('flamearray', '三重焰阵', '点燃 +12%，持续伤害 +10%', { add: { burn: .12, dotMul: .1 } }, (tags.flame || 0) >= 3);
  add('frostarray', '三重寒阵', '冻结 +10%，暴击伤害 +0.15', { add: { freeze: .1, critMul: .15 } }, (tags.frost || 0) >= 3);
  add('stormarray', '三重雷阵', '连锁闪电 +12%，触发倍率 +5%', { add: { chain: .12 }, mul: { procMul: 1.05 } }, (tags.storm || 0) >= 3);
  add('poisonarray', '三重毒阵', '中毒 +12%，持续伤害 +15%', { add: { poison: .12, dotMul: .15 } }, (tags.poison || 0) >= 3);
  add('guardianarray', '三重守阵', '格挡 +5%，生命 +半心', { add: { block: .05, maxHp: 1 } }, (tags.guard || 0) >= 3);
  add('lightframe', '三重轻构', '攻速 +6%，闪避冷却 -5%', { mul: { atkSpd: 1.06, rollCd: .95 } }, (tags.swift || 0) >= 3);
  add('elementweave', '万象编织', '元素触发倍率 +8%', { mul: { procMul: 1.08 } }, ['flame', 'frost', 'storm', 'poison'].filter(t => tags[t]).length >= 3);
  return out;
}
function forgeApplyDimensions(s, recipe) {
  const l = recipe.length, w = recipe.weight, b = recipe.balance;
  const reach = [.78, .89, 1, 1.11, 1.22][l];
  s.reachMul *= reach; s.rangeMul = (s.rangeMul || 1) * reach;
  s.dmg *= [.90, .95, 1, 1.05, 1.10][l] * [.80, .90, 1, 1.12, 1.25][w] * [.92, .96, 1, 1.05, 1.10][b];
  s.atkSpd *= [1.10, 1.05, 1, .95, .90][l] * [1.16, 1.08, 1, .89, .78][w] * [1.10, 1.05, 1, .95, .90][b];
  s.crit = Math.max(0, s.crit + [.04, .02, 0, -.01, -.02][b]);
  // Negative tradeoffs cannot turn proc probabilities or a low-health build into invalid combat state.
  s.maxHp = Math.max(1, s.maxHp); s.dmg = Math.max(.1, s.dmg); s.freeze = Math.max(0, s.freeze || 0);
}
function forgeRecipeEffectLines(recipe) {
  const r = forgeRecipeNormalize(recipe);
  if (!r) return [];
  const lines = ['银武底座：攻击力 +2，攻速 +10%'];
  for (const slot of FORGE_SLOTS) {
    const p = FORGE_PARTS[slot].find(x => x.id === r[slot]);
    if (p.id !== 'none') lines.push(`${forgeSlotName(slot, r.type)}·${p.name}：${p.description}`);
  }
  for (const d of FORGE_DIMENSIONS) if (r[d.id] !== 2) {
    const option = d.options[r[d.id]]; lines.push(`${d.name}·${option.name}：${option.description}`);
  }
  for (const synergy of forgeRecipeSynergies(r)) lines.push(`协同·${synergy.name}：${synergy.description}`);
  if (r.dye !== 'original') lines.push(`染色·${FORGE_DYES.find(d => d.id === r.dye).name}：仅改变外观`);
  return lines;
}
function forgeRecipeLabel(recipe) {
  const r = forgeRecipeNormalize(recipe);
  if (!r) return '未完成银武';
  const names = { sword: '自制银剑', axe: '自制银斧', spear: '自制银枪', dagger: '自制银匕', hammer: '自制银锤', staff: '自制银杖', bow: '自制银弓' };
  return names[r.type];
}
function forgeAutoNames(recipe) {
  const r = forgeRecipeNormalize(recipe);
  if (!r) return [];
  const type = FORGE_TYPES.find(t => t.id === r.type), core = FORGE_PARTS.core.find(p => p.id === r.core);
  const fourParts = FORGE_LEGACY_SLOTS.map(slot => FORGE_PARTS[slot].find(p => p.id === r[slot]).name.slice(0, 2));
  const shape = r.length !== 2 ? FORGE_DIMENSIONS[0].options[r.length].name : r.weight !== 2 ? FORGE_DIMENSIONS[1].options[r.weight].name : '';
  const shaped = `银武·${shape}${core.name}${type.name}`;
  let hash = 2166136261;
  for (const c of forgeRecipeId(r)) { hash ^= c.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  const suffix = (hash >>> 0).toString(16).slice(-4).toUpperCase();
  // Exact historical generators only. Similar wording or a different hash belongs to the player.
  return [...new Set([`银武·${core.name}${type.name}`, `银武·${fourParts.join('-')}${type.name}`, shaped, `${shaped.slice(0, 24)}·${suffix}`])];
}
function forgeDesignLabel(name, recipe, namedByPlayer = false) {
  const label = typeof name === 'string' ? name.replace(/[\x00-\x1f<>]/g, '').trim().slice(0, 32) : '';
  if (!label || !namedByPlayer && label.startsWith('银武·') && forgeAutoNames(recipe).includes(label)) return forgeRecipeLabel(recipe);
  return label;
}
let FORGE_MESSAGE = '';
const forgeOwn = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const forgeObject = o => !!o && typeof o === 'object' && !Array.isArray(o);
const forgeNumber = (n, max) => Number.isFinite(n) ? clamp(Math.floor(n), 0, max) : 0;
function forgeRecipeNormalize(recipe) {
  if (!forgeObject(recipe) || !FORGE_TYPES.some(t => t.id === recipe.type)) return null;
  const out = { type: recipe.type };
  for (const slot of FORGE_SLOTS) {
    const id = recipe[slot] === undefined && !FORGE_LEGACY_SLOTS.includes(slot) ? 'none' : recipe[slot];
    if (!forgePartChoices(slot, recipe.type).some(p => p.id === id)) return null;
    out[slot] = id;
  }
  for (const dimension of FORGE_DIMENSIONS) {
    const value = recipe[dimension.id] === undefined ? 2 : recipe[dimension.id];
    if (!Number.isInteger(value) || !dimension.options.some(option => option.id === value)) return null;
    out[dimension.id] = value;
  }
  out.dye = recipe.dye === undefined ? 'original' : recipe.dye;
  if (!FORGE_DYES.some(dye => dye.id === out.dye)) return null;
  return out;
}
function forgeRecipeId(recipe) {
  const r = forgeRecipeNormalize(recipe);
  if (!r) return null;
  const legacy = FORGE_SLOTS.slice(4).every(slot => r[slot] === 'none') && FORGE_DIMENSIONS.every(d => r[d.id] === 2) && r.dye === 'original';
  return legacy ? ['silver', r.type, ...FORGE_LEGACY_SLOTS.map(slot => r[slot])].join(':')
    : ['silver2', r.type, ...FORGE_SLOTS.map(slot => r[slot]), ...FORGE_DIMENSIONS.map(d => r[d.id]), r.dye].join(':');
}
function forgeRecipeFromId(id) {
  if (typeof id !== 'string' || id.length > 320) return null;
  const parts = id.split(':');
  let recipe;
  if (parts.length === 6 && parts[0] === 'silver') recipe = { type: parts[1], head: parts[2], grip: parts[3], core: parts[4], rune: parts[5] };
  else if (parts.length === 16 && parts[0] === 'silver2') {
    recipe = { type: parts[1] };
    FORGE_SLOTS.forEach((slot, i) => { recipe[slot] = parts[i + 2]; });
    FORGE_DIMENSIONS.forEach((d, i) => { recipe[d.id] = Number(parts[i + 12]); });
    recipe.dye = parts[15];
  } else return null;
  const r = forgeRecipeNormalize(recipe);
  return r && forgeRecipeId(r) === id ? r : null;
}
function forgeNormalWeapon(id) {
  const it = forgeOwn(ITEM_BY_ID, id) ? ITEM_BY_ID[id] : null;
  return it && it.slot === 'weapon' && !it.silver && !it.start && !CAMP_STARTERS.includes(id) ? it : null;
}
function forgeItem(id) {
  if (typeof id !== 'string') return null;
  if (forgeOwn(ITEM_BY_ID, id)) return ITEM_BY_ID[id];
  const recipe = forgeRecipeFromId(id);
  if (!recipe) return null;
  const type = FORGE_TYPES.find(t => t.id === recipe.type);
  const parts = FORGE_SLOTS.map(slot => FORGE_PARTS[slot].find(p => p.id === recipe[slot]));
  const synergies = forgeRecipeSynergies(recipe);
  const dye = FORGE_DYES.find(d => d.id === recipe.dye);
  const legacy = FORGE_SLOTS.slice(4).every(slot => recipe[slot] === 'none') && FORGE_DIMENSIONS.every(d => recipe[d.id] === 2) && recipe.dye === 'original' && FORGE_LEGACY_SLOTS.every(slot => FORGE_PARTS[slot].findIndex(p => p.id === recipe[slot]) < 5);
  const it = { id, silver: true, recipe, slot: 'weapon', tier: 2, cls: type.cls,
    name: forgeRecipeLabel(recipe), icon: [type.icon, dye.col || parts[0].col, parts[1].col, parts[2].col],
    lines: legacy ? ['银武底座：攻击力 +2，攻速 +10%', ...parts.slice(0, 4).map(p => p.description)] : forgeRecipeEffectLines(recipe),
    synergies: synergies.map(({ id: synergyId, name, description }) => ({ id: synergyId, name, description })),
    mod: s => { const speedBefore = s.atkSpd;
      s.wpn = WTYPES[type.id]; s.dmg += 2; s.atkSpd *= 1.1; for (const p of parts) p.fx(s);
      for (const synergy of synergies) synergy.fx(s); forgeApplyDimensions(s, recipe);
      // Capture the entire weapon, rather than just its final form. The ratio excludes training,
      // talents and other equipment already present in the input stats, so none is applied twice.
      s.wpnSpdMul = s.atkSpd / speedBefore; } };
  ITEM_BY_ID[id] = it;
  return it;
}
function forgeNormalize(raw) {
  const src = forgeObject(raw) ? raw : {}, training = {}, weapons = {}, designs = [];
  for (const t of FORGE_TRAINING) training[t.id] = forgeNumber(forgeObject(src.training) ? src.training[t.id] : 0, t.max);
  if (Array.isArray(src.designs)) for (const d of src.designs) {
    if (designs.length >= FORGE_DESIGN_MAX) break;
    if (!forgeObject(d)) continue;
    const recipe = forgeRecipeNormalize(d.recipe), id = recipe && forgeRecipeId(recipe);
    if (!id || designs.some(x => x.id === id)) continue;
    // A saved ID must describe exactly the saved parts, never an unrelated normal weapon.
    if (d.id !== undefined && d.id !== id) continue;
    const name = forgeDesignLabel(d.name, recipe, d.namedByPlayer === true);
    designs.push({ id, name, recipe, forged: d.forged === true, ...(d.namedByPlayer === true ? { namedByPlayer: true } : {}) });
  }
  if (forgeObject(src.weapons)) for (const [id, w] of Object.entries(src.weapons)) {
    if (!forgeObject(w)) continue;
    const silver = designs.some(d => d.id === id && d.forged), normal = forgeNormalWeapon(id);
    if (!silver && !normal) continue;
    const first = silver ? 10 : 5, step = silver ? 5 : 3;
    let rank = forgeNumber(w.rank, silver ? 8 : 5), level = forgeNumber(w.level, silver ? 50 : 20);
    // Ascension keeps the acquired levels. Repair invalid ranks downward rather than granting free levels.
    rank = Math.min(rank, level < first ? 0 : 1 + Math.floor((level - first) / step));
    level = Math.min(level, first + rank * step);
    weapons[id] = { level, rank };
  }
  return { ver: 1, training, weapons, designs, ...workshopNormalize(src) };
}
function forgeCombatProfile(raw) {
  const { ver, training, weapons, designs } = forgeNormalize(raw);
  return { ver, training, weapons, designs };
}
function normalizeForgeProgression() { META.forge = forgeNormalize(META.forge); }
function forgeProgression() {
  // A durable LAN receipt from v1.3 can restore its old four-part post-image after loadMeta has already migrated.
  const legacyDesign = forgeObject(META.forge) && Array.isArray(META.forge.designs) && META.forge.designs.some(d =>
    forgeObject(d) && forgeObject(d.recipe) && (d.recipe.guard === undefined || d.recipe.length === undefined ||
      d.namedByPlayer !== true && typeof d.name === 'string' && d.name.startsWith('银武·') && forgeAutoNames(d.recipe).includes(d.name)));
  if (!forgeObject(META.forge) || META.forge.ver !== 1 || !forgeObject(META.forge.training) || !forgeObject(META.forge.weapons) || !Array.isArray(META.forge.designs) || !forgeObject(META.forge.materials) || !forgeObject(META.forge.smith) || legacyDesign) normalizeForgeProgression();
  return META.forge;
}
function forgeDesigns() { return forgeProgression().designs; }
function forgeItemName(it, meta = META) {
  if (!it) return '';
  if (it.silver && meta && forgeObject(meta.forge) && Array.isArray(meta.forge.designs)) {
    const design = meta.forge.designs.find(d => forgeObject(d) && d.forged === true && d.id === it.id && forgeRecipeId(d.recipe) === it.id);
    if (design && typeof design.name === 'string') return forgeDesignLabel(design.name, design.recipe, design.namedByPlayer === true);
  }
  return it.name;
}
function forgeTrainingState(id) {
  const t = FORGE_TRAINING.find(x => x.id === id);
  return t ? forgeNumber(forgeProgression().training[id], t.max) : 0;
}
function forgeTrainingCost(id) {
  const t = FORGE_TRAINING.find(x => x.id === id), n = forgeTrainingState(id);
  return t && n < t.max ? 40 + n * 22 + n * n * 7 : Infinity;
}
function forgeSpend(cost) {
  if (G.mode !== 'town') { FORGE_MESSAGE = '请回到主城，与工坊居民交谈。'; return false; }
  if (!Number.isFinite(cost) || cost < 0) { FORGE_MESSAGE = '尚未满足条件，或已经达到上限。'; return false; }
  if (!Number.isFinite(META.souls) || META.souls < cost) { FORGE_MESSAGE = '魂晶不足，完成冒险和委托后再来。'; return false; }
  META.souls -= cost;
  return true;
}
function forgeChanged(message) {
  FORGE_MESSAGE = message;
  if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message;
  if (G.player) recalcStats();
}
function forgeTrain(id) {
  if (!metaSaveReady()) { FORGE_MESSAGE = META_SAVE.message; return false; }
  const t = FORGE_TRAINING.find(x => x.id === id);
  if (!t) { FORGE_MESSAGE = '没有这种基础训练。'; return false; }
  if (!forgeSpend(forgeTrainingCost(id))) return false;
  forgeProgression().training[id] = forgeTrainingState(id) + 1;
  forgeChanged(`${t.name}训练完成，永久成长已保存。`); return true;
}
function forgeWeapons() {
  const normal = ITEMS.filter(it => forgeNormalWeapon(it.id) && forgeWeaponPurchasable(it.id));
  return normal.concat(forgeLootItems());
}
function forgeWeaponOwned(id) {
  return weaponCultivationUnlocked(forgeItem(id));
}
function forgeWeaponPurchasable(id) {
  if (!forgeWeaponOwned(id)) return false;
  const it = forgeNormalWeapon(id);
  // These gates apply to camp purchases. A guest's already acquired weapon bonuses do not depend on the host's chapter progress.
  return !it || (!it.act || actOpen(it.act)) && (!it.legend || themeCleared(it.act));
}
function forgeWeaponState(id) {
  const w = forgeOwn(forgeProgression().weapons, id) ? forgeProgression().weapons[id] : null;
  return { level: forgeNumber(w && w.level, forgeWeaponMaxLevel(id)), rank: forgeNumber(w && w.rank, forgeWeaponRankCap(id)) };
}
function forgeWeaponRankCap(id) { return forgeRecipeFromId(id) ? 8 : 5; }
function forgeWeaponMaxLevel(id) { return forgeRecipeFromId(id) ? 50 : 20; }
function forgeWeaponCap(id) {
  const silver = !!forgeRecipeFromId(id), rank = forgeWeaponState(id).rank;
  return Math.min(forgeWeaponMaxLevel(id), (silver ? 10 : 5) + rank * (silver ? 5 : 3));
}
function forgeUpgradeCost(id) {
  if (!forgeWeaponPurchasable(id)) return Infinity;
  const w = forgeWeaponState(id);
  if (w.level >= forgeWeaponCap(id)) return Infinity;
  return forgeRecipeFromId(id) ? 80 + w.level * 27 + w.level * w.level * 7 + w.rank * 60 : 25 + w.level * 13 + w.level * w.level * 4 + w.rank * 20;
}
function forgeAscendCost(id) {
  if (!forgeWeaponPurchasable(id)) return Infinity;
  const w = forgeWeaponState(id);
  if (w.level < forgeWeaponCap(id) || w.rank >= forgeWeaponRankCap(id)) return Infinity;
  return forgeRecipeFromId(id) ? 650 + w.rank * 410 + w.rank * w.rank * 160 : 180 + w.rank * 180 + w.rank * w.rank * 75;
}
function forgeUpgrade(id) {
  if (!metaSaveReady()) { FORGE_MESSAGE = META_SAVE.message; return false; }
  if (!forgeSpend(forgeUpgradeCost(id))) return false;
  const w = forgeWeaponState(id); w.level++;
  forgeProgression().weapons[id] = w;
  forgeChanged(`${forgeItem(id).name}强化至 ${w.level} 级；局内随机获得后生效。`); return true;
}
function forgeAscend(id) {
  if (!metaSaveReady()) { FORGE_MESSAGE = META_SAVE.message; return false; }
  if (!forgeSpend(forgeAscendCost(id))) return false;
  const w = forgeWeaponState(id); w.rank++;
  forgeProgression().weapons[id] = w;
  forgeChanged(`${forgeItem(id).name}升至 ${w.rank} 阶，已提高强化上限。`); return true;
}
function forgeDesignSave(recipe, name) {
  if (!metaSaveReady()) { FORGE_MESSAGE = META_SAVE.message; return false; }
  if (G.mode !== 'town') { FORGE_MESSAGE = '请在主城完成设计。'; return false; }
  const r = forgeRecipeNormalize(recipe), id = r && forgeRecipeId(r);
  if (!id) { FORGE_MESSAGE = '请为每个部位选择一个有效部件。'; return false; }
  const designs = forgeDesigns();
  if (designs.some(d => d.id === id)) { FORGE_MESSAGE = '已经保存过相同的配方。'; return false; }
  if (designs.length >= FORGE_DESIGN_MAX) { FORGE_MESSAGE = `最多可保存 ${FORGE_DESIGN_MAX} 件银武设计。`; return false; }
  const label = forgeDesignLabel(name, r);
  designs.push({ id, name: label, recipe: r, forged: false });
  FORGE_MESSAGE = '设计已保存，请交给铁匠布洛克锻造。'; if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function forgeDesignRename(id, name) {
  if (!metaSaveReady()) { FORGE_MESSAGE = META_SAVE.message; return false; }
  if (G.mode !== 'town') { FORGE_MESSAGE = '请在主城为设计命名。'; return false; }
  const d = forgeDesigns().find(design => design.id === id);
  const label = typeof name === 'string' ? name.replace(/[\x00-\x1f<>]/g, '').trim().slice(0, 32) : '';
  if (!d || !label) { FORGE_MESSAGE = '请选择已保存的设计，并输入有效名称。'; return false; }
  d.name = label; d.namedByPlayer = true;
  FORGE_MESSAGE = '设计名称已保存，不改变武器配方或联机属性。'; if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function forgeDesignDiscard(id) {
  if (!metaSaveReady()) { FORGE_MESSAGE = META_SAVE.message; return false; }
  if (G.mode !== 'town') { FORGE_MESSAGE = '请在主城撤回设计。'; return false; }
  const designs = forgeDesigns(), i = designs.findIndex(d => d.id === id);
  if (i < 0 || designs[i].forged) { FORGE_MESSAGE = '只能撤回尚未锻造的设计。'; return false; }
  designs.splice(i, 1);
  FORGE_MESSAGE = '设计已撤回，可重新选择部件组装。'; if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function forgeCraftCost(id) {
  const d = forgeDesigns().find(x => x.id === id);
  if (!d || d.forged) return Infinity;
  const r = forgeRecipeNormalize(d.recipe);
  if (!r) return Infinity;
  return workshopAssemblyRequirements(r).souls + FORGE_SLOTS.reduce((n, slot) => n + FORGE_PARTS[slot].find(p => p.id === r[slot]).cost, 0);
}
function forgeCraft(id) {
  return workshopCraft(id);
}
function forgeLootItems(meta = META) {
  const data = meta && meta.forge;
  if (!forgeObject(data) || !Array.isArray(data.designs)) return [];
  const ids = new Set(), out = [];
  for (const d of data.designs.slice(0, FORGE_DESIGN_MAX)) {
    if (!forgeObject(d) || d.forged !== true || ids.has(d.id) || forgeRecipeId(d.recipe) !== d.id) continue;
    const it = forgeItem(d.id);
    if (!it || !it.silver) continue;
    ids.add(d.id); out.push(it);
  }
  return out;
}
function forgeApplyTraining(s, training = forgeProgression().training) {
  for (const t of FORGE_TRAINING) {
    const n = forgeNumber(forgeObject(training) ? training[t.id] : 0, t.max);
    if (n) t.fx(s, n);
  }
}
function forgeWeaponBonus(id) {
  const w = forgeWeaponState(id), silver = !!forgeRecipeFromId(id);
  const dmg = w.level * (silver ? 0.3 : 0.18) + w.rank * (silver ? 0.8 : 0.45);
  const spd = w.level * 0.005 + w.rank * 0.02;
  return [`养成攻击力 +${dmg.toFixed(2)}`, `养成攻击速度 +${Math.round(spd * 100)}%`, '只在本局获得并装备该武器后生效'];
}
function forgeItemLines(it) {
  const lines = itemDescriptionLines(it).slice();
  if (!it || it.slot !== 'weapon' || !forgeWeaponOwned(it.id)) return lines;
  const w = forgeWeaponState(it.id);
  if (!w.level && !w.rank && !it.silver) return lines;
  const bonus = forgeWeaponBonus(it.id);
  return lines.concat([`永久强化 Lv.${w.level}/${forgeWeaponMaxLevel(it.id)} · ${w.rank} 阶`, `${bonus[0]}，${bonus[1].replace('养成', '')}`]);
}
function forgeApplyWeapon(s, it) {
  if (!it || it.slot !== 'weapon' || !forgeWeaponOwned(it.id)) return;
  const w = forgeWeaponState(it.id), silver = it.silver === true;
  s.dmg += w.level * (silver ? 0.3 : 0.18) + w.rank * (silver ? 0.8 : 0.45);
  const speedMul = 1 + w.level * 0.005 + w.rank * 0.02;
  s.atkSpd *= speedMul;
  // Weapon cultivation improves the same minions that inherit its cultivated damage.
  s.wpnSpdMul = (s.wpnSpdMul || 1) * speedMul;
}
