'use strict';
// ============================================================ weapons, armor, boots, trinkets, consumables + slot rules
// weapon archetypes: change how the attack button behaves
const WTYPES = {
  sword: { kind: 'sword', reach: 26, arc: 1.25, cd: 0.36, mul: 1, kb: 150, swingT: 0.15 },
  axe: { kind: 'axe', reach: 29, arc: 1.75, cd: 0.58, mul: 1.9, kb: 230, swingT: 0.2, heavy: true },
  spear: { kind: 'spear', reach: 42, arc: 0.42, cd: 0.42, mul: 1.25, kb: 170, swingT: 0.14, thrust: true },
  dagger: { kind: 'dagger', reach: 20, arc: 1.1, cd: 0.19, mul: 0.6, kb: 70, swingT: 0.09 },
  hammer: { kind: 'hammer', reach: 33, arc: Math.PI, cd: 0.8, mul: 2.4, kb: 260, swingT: 0.22, heavy: true, quake: true },
  staff: { kind: 'staff', ranged: true, cd: 0.42, mul: 0.9, speed: 150, proj: 'bolt', kb: 60, swingT: 0.12, life: 0.95, r: 4 },
  bow: { kind: 'bow', ranged: true, cd: 0.5, mul: 1.35, speed: 240, proj: 'arrow', kb: 90, swingT: 0.12, pierce: 1, life: 0.8, r: 3 },
};
const SLOT_NAME = { weapon: '武器', armor: '防具', boots: '鞋子', trinket: '饰品', use: '消耗品' };
const W = (k, extra) => s => { s.wpn = WTYPES[k]; if (extra) extra(s); };
// icon: [kind, main, dark, highlight]. lock: soul cost to unlock in camp (not in loot pool until unlocked)
const ITEMS = [
  // ---------------- weapons
  { id: 'rusty', tier: 0, slot: 'weapon', start: true, name: '生锈铁剑', icon: ['sword', '#a09888', '#6a4a30', '#d8d0c0'],
    lines: ['平平无奇的剑', '挥砍攻击'], mod: W('sword') },
  { id: 'steel', tier: 0, slot: 'weapon', name: '精钢长剑', icon: ['sword', '#c8d0e4', '#7a5636', '#ffffff'],
    lines: ['挥砍攻击', '攻击力 +0.5'], mod: W('sword', s => { s.dmg += 0.5; }) },
  { id: 'hatchet', tier: 0, slot: 'weapon', name: '樵夫斧', icon: ['axe', '#b4bcd4', '#7a5636', '#ffffff'],
    lines: ['重劈：伤害 ×1.9', '范围更宽，攻速较慢'], mod: W('axe') },
  { id: 'twin', tier: 0, slot: 'weapon', name: '双刃匕首', icon: ['dagger', '#c8d0e4', '#5a3a22', '#ffffff'],
    lines: ['疾刺连击：攻速极快', '伤害 ×0.6'], mod: W('dagger') },
  { id: 'pike', tier: 1, slot: 'weapon', name: '骑士长枪', icon: ['spear', '#c8d0e4', '#7a5636', '#ffffff'],
    lines: ['突刺：攻击距离极远', '伤害 ×1.25，范围狭窄'], mod: W('spear') },
  { id: 'wand', tier: 1, slot: 'weapon', name: '学徒法杖', icon: ['staff', '#4696ff', '#6a4a30', '#c8e0ff'],
    lines: ['发射魔法飞弹', '远程攻击，伤害 ×0.9'], mod: W('staff') },
  { id: 'hunt', tier: 1, slot: 'weapon', name: '猎弓', icon: ['bow', '#ffffff', '#8a5a30', '#d8d0c0'],
    lines: ['发射箭矢，远程攻击', '伤害 ×1.35，穿透 1 个敌人'], mod: W('bow') },
  { id: 'maul', tier: 1, slot: 'weapon', name: '震地战锤', icon: ['hammer', '#8a92a8', '#6a4a30', '#d0d8e8'], lock: 30,
    lines: ['环形重击：伤害 ×2.4', '打击身边所有敌人', '攻速很慢'], mod: W('hammer') },
  { id: 'frostpike', tier: 2, slot: 'weapon', name: '寒霜之矛', icon: ['spear', '#8ae0ff', '#3a6a9a', '#ffffff'],
    lines: ['突刺攻击', '攻击力 +0.5', '15% 几率冻结敌人'], mod: W('spear', s => { s.dmg += 0.5; s.freeze += 0.15; }) },
  { id: 'viper', tier: 2, slot: 'weapon', name: '蛇牙双匕', icon: ['dagger', '#6adc5a', '#2a5a2a', '#d0ffc0'],
    lines: ['疾刺连击', '30% 几率使敌人中毒'], mod: W('dagger', s => { s.poison += 0.3; }) },
  { id: 'lavahammer', tier: 2, slot: 'weapon', name: '熔岩战锤', icon: ['hammer', '#ff7a30', '#5a2a1a', '#ffd060'], lock: 50,
    lines: ['环形重击', '攻击力 +0.5', '30% 几率点燃敌人'], mod: W('hammer', s => { s.dmg += 0.5; s.burn += 0.3; }) },
  { id: 'storm', tier: 2, slot: 'weapon', name: '雷鸣法杖', icon: ['staff', '#ffe060', '#5a4a6a', '#ffffff'], lock: 60,
    lines: ['追踪魔法飞弹', '21% 几率引发连锁闪电'], mod: W('staff', s => { s.homing = true; s.chain += 0.21; }) },
  // more weapons per archetype (no unlock needed)
  { id: 'knight', tier: 1, slot: 'weapon', name: '骑士佩剑', icon: ['sword', '#d8e0f0', '#3a64b8', '#ffffff'],
    lines: ['挥砍攻击', '攻击力 +0.5，暴击率 +5%'], mod: W('sword', s => { s.dmg += 0.5; s.crit += 0.05; }) },
  { id: 'flamesword', tier: 2, slot: 'weapon', name: '炎纹剑', icon: ['sword', '#ffb070', '#8a3a10', '#fff0c0'],
    lines: ['挥砍攻击', '攻击力 +0.5', '21% 几率点燃敌人'], mod: W('sword', s => { s.dmg += 0.5; s.burn += 0.21; }) },
  { id: 'oath', tier: 3, slot: 'weapon', name: '守誓长剑', icon: ['sword', '#fff0c0', '#8a6a20', '#ffffff'],
    lines: ['挥砍攻击', '攻击力 +0.75，暴击率 +5%', '“誓言比钢铁更坚韧。”'], mod: W('sword', s => { s.dmg += 0.75; s.crit += 0.05; }) },
  { id: 'bearded', tier: 1, slot: 'weapon', name: '胡须战斧', icon: ['axe', '#c8ccd8', '#5a3a22', '#ffffff'],
    lines: ['重劈：伤害 ×1.9', '攻击力 +0.5'], mod: W('axe', s => { s.dmg += 0.5; }) },
  { id: 'bloodaxe', tier: 2, slot: 'weapon', name: '嗜血战斧', icon: ['axe', '#d83a4a', '#5a1a1a', '#ffb0b8'],
    lines: ['重劈，攻击力 +0.5', '击杀时 7% 回复半颗心'], mod: W('axe', s => { s.dmg += 0.5; s.vamp += 0.07; }) },
  { id: 'trident', tier: 1, slot: 'weapon', name: '海民三叉戟', icon: ['spear', '#6ac8d8', '#2a5a6a', '#d0ffff'],
    lines: ['突刺攻击', '攻击距离 +15%'], mod: W('spear', s => { s.reachMul *= 1.15; }) },
  { id: 'rogue', tier: 1, slot: 'weapon', name: '盗贼短刃', icon: ['dagger', '#a0a8c0', '#2a2a3a', '#ffffff'],
    lines: ['疾刺连击', '暴击率 +9%'], mod: W('dagger', s => { s.crit += 0.09; }) },
  { id: 'club', tier: 0, slot: 'weapon', name: '粗木大棒', icon: ['hammer', '#9a6a3a', '#5a3a22', '#d8a060'],
    lines: ['环形重击：伤害 ×2.4', '木头做的，攻击力 -0.25'], mod: W('hammer', s => { s.dmg -= 0.25; }) },
  { id: 'ironhammer', tier: 2, slot: 'weapon', name: '铁卫重锤', icon: ['hammer', '#b4bcd4', '#4a5068', '#ffffff'],
    lines: ['环形重击', '攻击力 +0.5', '6% 几率格挡伤害'], mod: W('hammer', s => { s.dmg += 0.5; s.block += 0.06; }) },
  { id: 'emberstaff', tier: 1, slot: 'weapon', name: '余烬法杖', icon: ['staff', '#ff7a30', '#5a3a22', '#ffe080'],
    lines: ['发射魔法飞弹', '18% 几率点燃敌人'], mod: W('staff', s => { s.burn += 0.18; }) },
  { id: 'froststaff', tier: 2, slot: 'weapon', name: '冰晶法杖', icon: ['staff', '#8ae0ff', '#3a5a8a', '#ffffff'],
    lines: ['发射魔法飞弹，穿透 +1', '15% 几率冻结敌人'], mod: W('staff', s => { s.freeze += 0.15; s.pierce += 1; }) },
  { id: 'shortbow', tier: 0, slot: 'weapon', name: '短弓', icon: ['bow', '#d8d0c0', '#6a4a30', '#ffffff'],
    lines: ['发射箭矢，射速 +9%', '攻击力 -0.25'], mod: W('bow', s => { s.atkSpd *= 1.09; s.dmg -= 0.25; }) },
  { id: 'longbow', tier: 2, slot: 'weapon', name: '紫杉长弓', icon: ['bow', '#ffffff', '#3a5a2a', '#c8f0b0'],
    lines: ['发射箭矢', '攻击力 +0.5，穿透 +1'], mod: W('bow', s => { s.dmg += 0.5; s.pierce += 1; }) },
  // gold weapons below need a blueprint from the smith (souls)
  { id: 'dawn', tier: 3, slot: 'weapon', name: '黎明之刃', icon: ['sword', '#f5f8ff', '#ecba40', '#ffffff'], big: 'dawn', lock: 150,
    lines: ['攻击力 +1.5，暴击率 +9%', '攻击范围 +25%', '击杀时 12% 回复半颗心', '“它在黑暗中依然闪耀。”'],
    mod: W('sword', s => { s.dmg += 1.5; s.crit += 0.09; s.vamp += 0.12; s.reachMul *= 1.25; s.blade = 'dawn'; }) },
  { id: 'dragon', tier: 3, slot: 'weapon', name: '屠龙巨斧', icon: ['axe', '#ff6040', '#5a2a1a', '#ffd060'], lock: 100,
    lines: ['重劈，攻击力 +1.5', '击杀时 30% 几率爆炸', '“龙骨为柄，龙焰为锋。”'], mod: W('axe', s => { s.dmg += 1.5; s.explode += 0.3; }) },
  { id: 'star', tier: 3, slot: 'weapon', name: '星辰之弓', icon: ['bow', '#ffe080', '#5a4a8a', '#ffffff'], lock: 120,
    lines: ['一次射出 3 支箭矢', '暴击率 +6%', '“每一支箭都指向一颗星。”'], mod: W('bow', s => { s.multi = 3; s.crit += 0.06; }) },
  // ---------------- armor
  { id: 'leather', tier: 0, slot: 'armor', name: '皮甲', icon: ['armor', '#9a6a3a', '#5a3a22', '#d8a060'],
    lines: ['生命上限 +1'], mod: s => { s.maxHp += 2; } },
  { id: 'mail', tier: 0, slot: 'armor', name: '锁子甲', icon: ['armor', '#8a92a8', '#4a5068', '#d0d8e8'],
    lines: ['生命上限 +1', '6% 几率格挡伤害'], mod: s => { s.maxHp += 2; s.block += 0.06; } },
  { id: 'cloak', tier: 1, slot: 'armor', name: '旅者斗篷', icon: ['cloak', '#3a8a6a', '#1a4a3a', '#8ae0b0'],
    lines: ['移动速度 +10%', '翻滚冷却 -12%'], mod: s => { s.speed *= 1.1; s.rollCd *= 0.88; } },
  { id: 'thorn', tier: 1, slot: 'armor', name: '荆棘胸甲', icon: ['armor', '#5ca04a', '#2a5a2a', '#b0f090'],
    lines: ['生命上限 +1', '受伤时释放 3 点荆棘伤害'], mod: s => { s.maxHp += 2; s.thorns += 3; } },
  { id: 'plate', tier: 2, slot: 'armor', name: '圣骑士板甲', icon: ['armor', '#e0e4f0', '#8a7a40', '#ffffff'],
    lines: ['生命上限 +2', '9% 几率格挡伤害', '移动速度 -8%'], mod: s => { s.maxHp += 4; s.block += 0.09; s.speed *= 0.92; } },
  { id: 'shadow', tier: 2, slot: 'armor', name: '影舞者外衣', icon: ['cloak', '#5a4a8a', '#2a1a4a', '#c0a0ff'],
    lines: ['翻滚冷却 -24%', '翻滚后下一击必定暴击'], mod: s => { s.rollCd *= 0.76; s.rollCrit = true; } },
  { id: 'magma', tier: 2, slot: 'armor', name: '熔岩护甲', icon: ['armor', '#c04a20', '#5a1a10', '#ffb060'], lock: 50,
    lines: ['免疫熔岩与火焰伤害', '生命上限 +1', '攻击 9% 几率点燃'], mod: s => { s.fireImm = true; s.maxHp += 2; s.burn += 0.09; } },
  { id: 'aegis', tier: 3, slot: 'armor', name: '守护者圣铠', icon: ['armor', '#ffe080', '#8a6a20', '#ffffff'], lock: 120,
    lines: ['生命上限 +2', '每个房间抵挡一次伤害', '“誓言化作永不熄灭的光盾。”'], mod: s => { s.maxHp += 4; s.shield = true; } },
  // ---------------- trinkets (limited slots)
  { id: 'whet', tier: 0, slot: 'trinket', name: '磨刀石', icon: ['whet', '#8a92a8', '#4a5068', '#d0d8e8'],
    lines: ['攻击力 +0.5'], mod: s => { s.dmg += 0.5; } },
  { id: 'boots', tier: 0, slot: 'trinket', name: '旧皮靴', icon: ['boots', '#9a6a3a', '#5a3a22', '#d8a060'],
    lines: ['移动速度 +12%'], mod: s => { s.speed *= 1.12; } },
  { id: 'clover', tier: 0, slot: 'trinket', name: '四叶草', icon: ['clover', '#5ccc5a', '#2a6a2a', '#d0ffc0'],
    lines: ['宝箱升阶几率 +12%', '金币掉落 +25%'], mod: s => { s.luck += 0.12; s.goldMul += 0.25; } },
  { id: 'ironring', tier: 0, slot: 'trinket', name: '铁指环', icon: ['ring', '#b4bcd4', '#5a6078', '#ffffff'],
    lines: ['生命上限 +1'], mod: s => { s.maxHp += 2; } },
  { id: 'magnet', tier: 0, slot: 'trinket', name: '磁石', icon: ['magnet', '#d83040', '#5a6078', '#ffffff'],
    lines: ['拾取范围 ×2', '金币掉落 +20%'], mod: s => { s.magnet *= 2; s.goldMul += 0.2; } },
  { id: 'charm', tier: 1, slot: 'trinket', name: '猎手护符', icon: ['amulet', '#4696ff', '#26407a', '#c8e0ff'],
    lines: ['暴击率 +9%'], mod: s => { s.crit += 0.09; } },
  { id: 'feather', tier: 1, slot: 'trinket', name: '疾风之羽', icon: ['feather', '#8ae0e0', '#3a8a9a', '#ffffff'],
    lines: ['攻击速度 +13%'], mod: s => { s.atkSpd *= 1.13; } },
  { id: 'dice', tier: 1, slot: 'trinket', name: '赌徒骰子', icon: ['dice', '#f0ece0', '#c02838', '#ffffff'],
    lines: ['宝箱升阶几率 +20%', '金币掉落 +50%'], mod: s => { s.luck += 0.2; s.goldMul += 0.5; } },
  { id: 'fang', tier: 1, slot: 'trinket', name: '吸血蝠牙', icon: ['fang', '#f0ece0', '#9a2a3a', '#ffffff'],
    lines: ['击杀敌人时', '9% 几率回复半颗心'], mod: s => { s.vamp += 0.09; } },
  { id: 'ember', tier: 1, slot: 'trinket', name: '余烬指环', icon: ['ring', '#ff7a30', '#8a3a10', '#ffe080'],
    lines: ['攻击 15% 几率点燃敌人', '燃烧持续造成伤害'], mod: s => { s.burn += 0.15; } },
  { id: 'frost', tier: 1, slot: 'trinket', name: '霜冻护符', icon: ['amulet', '#8ae0ff', '#3a6a9a', '#ffffff'],
    lines: ['攻击 9% 几率冻结敌人'], mod: s => { s.freeze += 0.09; } },
  { id: 'venom', tier: 1, slot: 'trinket', name: '毒液瓶', icon: ['flask', '#6adc5a', '#2a5a2a', '#d0ffc0'],
    lines: ['攻击 21% 几率使敌人中毒', '中毒可叠加 3 层'], mod: s => { s.poison += 0.21; } },
  { id: 'lens', tier: 1, slot: 'trinket', name: '鹰眼透镜', icon: ['eye', '#ecba40', '#5a4a30', '#ffffff'],
    lines: ['攻击范围 +20%', '远程弹道穿透 +1'], mod: s => { s.reachMul *= 1.2; s.pierce += 1; } },
  { id: 'giant', tier: 2, slot: 'trinket', name: '巨人之心', icon: ['heart', '#c83048', '#6a1424', '#ff9aa8'],
    lines: ['生命上限 +2', '体型与攻击范围变大'], mod: s => { s.maxHp += 4; s.scale += 0.12; } },
  { id: 'wave', tier: 2, slot: 'trinket', name: '剑气宝石', icon: ['gem', '#b45aff', '#5a2a90', '#f0d0ff'],
    lines: ['攻击时放出一道剑气', '剑气可穿透敌人'], mod: s => { s.wave += 1; } },
  { id: 'orbit', tier: 2, slot: 'trinket', name: '环绕飞刃', icon: ['orbit', '#d0d8ea', '#5a6078', '#ffffff'],
    lines: ['2 把飞刃环绕自身', '自动切割靠近的敌人'], mod: s => { s.orbit += 2; } },
  { id: 'thunder', tier: 2, slot: 'trinket', name: '雷霆之核', icon: ['bolt', '#ffe060', '#8a6a10', '#ffffff'],
    lines: ['攻击 18% 几率引发', '连锁闪电弹射 2 个敌人'], mod: s => { s.chain += 0.18; } },
  { id: 'skull', tier: 2, slot: 'trinket', name: '狂战士头骨', icon: ['skull', '#e4dcc4', '#8a2a2a', '#ffffff'],
    lines: ['生命越低攻击越高', '最多 +60% 伤害'], mod: s => { s.berserk += 0.6; } },
  { id: 'sand', tier: 2, slot: 'trinket', name: '时之沙', icon: ['hourglass', '#ecba40', '#7a5a30', '#fff0b0'],
    lines: ['翻滚冷却 -27%', '翻滚后下一击必定暴击'], mod: s => { s.rollCd *= 0.73; s.rollCrit = true; } },
  { id: 'powder', tier: 2, slot: 'trinket', name: '爆裂火药', icon: ['bomb', '#4a4058', '#1a1018', '#ff7a30'], lock: 40,
    lines: ['击杀时 21% 几率爆炸', '对周围敌人造成伤害'], mod: s => { s.explode += 0.21; } },
  { id: 'deadly', tier: 2, slot: 'trinket', name: '致命宝石', icon: ['gem', '#ff4058', '#7a1424', '#ffd0d8'], lock: 45,
    lines: ['暴击伤害 ×2.5（原为 ×2）', '暴击率 +3%'], mod: s => { s.critMul += 0.5; s.crit += 0.03; } },
  { id: 'phoenix', tier: 3, slot: 'trinket', name: '不死鸟之羽', icon: ['feather', '#ff8a30', '#c02818', '#fff0a0'],
    lines: ['死亡时满血复活一次', '复活后此物品消失', '“灰烬之中，必有余火。”'], mod: s => { s.revive += 1; } },
  { id: 'crown', tier: 3, slot: 'trinket', name: '贪婪王冠', icon: ['crown', '#ecba40', '#8a5a10', '#fff0b0'], lock: 80,
    lines: ['金币掉落 ×2', '宝箱升阶几率 +25%', '“越多越好。”'], mod: s => { s.goldMul *= 2; s.luck += 0.25; } },
  { id: 'chaos', tier: 3, slot: 'trinket', name: '混沌之眼', icon: ['eye', '#b45aff', '#3a1850', '#ff8af0'], lock: 100,
    lines: ['所有触发几率 ×1.36', '（点燃/冻结/中毒/闪电/爆炸）', '“它也在看着你。”'], mod: s => { s.procMul *= 1.36; } },
  { id: 'heartstone', tier: 3, slot: 'trinket', name: '永恒之心', icon: ['heart', '#ff6080', '#8a1430', '#ffffff'],
    lines: ['生命上限 +2', '击杀时 6% 回复半颗心', '“它仍在跳动。”'], mod: s => { s.maxHp += 4; s.vamp += 0.06; } },
  { id: 'tome', tier: 3, slot: 'trinket', name: '剑圣秘典', icon: ['book', '#c8a0ff', '#4a2a6a', '#ffffff'], lock: 90,
    lines: ['攻击时放出 2 道剑气', '攻击速度 +9%', '“一剑破万法。”'], mod: s => { s.wave += 2; s.atkSpd *= 1.09; } },
  // ---------------- consumables (used instantly, no slot)
  { id: 'ration', tier: 0, slot: 'use', name: '冒险干粮', icon: ['food', '#d8a060', '#8a5a30', '#f0d8a0'],
    lines: ['回复 2 颗心'], use: p => p.heal(4) },
];
const POTION = { id: 'potion', tier: 0, slot: 'use', name: '生命药水', icon: ['flask', '#e83050', '#7a1424', '#ffd0d8'],
  lines: ['回复 2 颗心'], use: p => p.heal(4) };
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
// gold economy is scaled x5 (each coin pickup = COIN_VAL gold) so the stat shrine's 100..1000 prices fit
const COIN_VAL = 5;
const SELL = [15, 30, 50, 90];
// stat ceilings applied after gear, sets and talents (recalcStats)
// healBonus: extra half-hearts added to each heal; regen: fastest allowed "every N seconds" interval
const GEAR_CAPS = { crit: 0.6, block: 0.3, vamp: 0.25, procMul: 2, atkSpd: 2, rollCd: 0.35, shieldCap: 4,
  defense: 40,
  healBonus: 2, regen: 10, holyHeal: 0.12, toxOnHit: 0.12, voidLeech: 0.12,
  minions: 12, minionDmg: 3, minionSpd: 2, finalAtkSpd: 3,
  dotMul: 6, goldMul: 4, magnet: 10, finaleMul: 8 };
// Control and chain limits apply to the combined effect, including talents and proc multipliers.
const COMBAT_LIMITS = { freezeChance: 0.45, freezeDuration: 1.5, freezeResist: 2,
  burnChance: 0.6, poisonChance: 0.6, chainChance: 0.5,
  explodeChance: 0.65, explodeCd: 0.4, explodeDepth: 2, explodeBursts: 4, explodeDecay: 0.75 };
// Every on-hit status is capped on its *combined* chance (stat × procMul), not on the stat alone:
// burn / poison / chain used to be raw p.stat * procMul and reached a guaranteed 100% hit rate.
const PROC_CAP = { freeze: 'freezeChance', explode: 'explodeChance',
  burn: 'burnChance', poison: 'poisonChance', chain: 'chainChance' };
function gearProcChance(stat, p = G.player) {
  const cap = COMBAT_LIMITS[PROC_CAP[stat]] ?? 1;
  return Math.max(0, Math.min(cap, (p[stat] || 0) * p.procMul));
}
// A fixed bonus on every swing scales linearly with attack speed, which erases the trade-off of a
// low-per-hit fast weapon (daggers out-damaged hammers through waves, quakes and lightning alone).
// Per-attack gear procs therefore share a short cooldown. Lives here so entities.js can use it too.
function attackProc(key, cd) {
  const cs = G.cls || (G.cls = {}), k = 'ap' + key;
  if (G.time < (cs[k] || 0)) return false;
  cs[k] = G.time + cd;
  return true;
}
// cleric overheal shield: seconds between two gained layers
const HOLY_SHIELD_CD = 4;
// block chance: after a block, the next GUARD_CD seconds cannot be blocked again (shields have their own timer)
const GUARD_CD = 2;
// shield skills (room shield, cleric holy shield) share one cooldown: at most one absorbed hit per SHIELD_CD seconds
const SHIELD_CD = 10;
// healing skills (kill / hit procs, regen, set and talent heals) share one cooldown: at most one heal per HEAL_CD seconds.
// Potions, food, hearts, fountains and room services are not skills and stay free. A single heal gains at most +100% from healBonus.
const HEAL_CD = 10;
// multi-shot: every projectile after the first shares damage, a 3-shot volley totals ×2.2 instead of ×3
const MULTI_SHARE = 0.6;

// Heavy armor trades the other roles' offensive/mobility effects for reliable protection.
// Kept separate from mod(): workbook effect overrides must not erase intrinsic armor.
const ARMOR_DEFENSE = {
  warrior: [8, 12, 16, 20], ranger: [4, 6, 8, 10], mage: [2, 3, 4, 5],
  cleric: [5, 7, 9, 11], bard: [3, 4, 6, 8], summoner: [2, 3, 4, 5],
  neutral: [4, 6, 8, 10],
};
function armorDefense(it) {
  if (!it || it.slot !== 'armor') return 0;
  return Number.isFinite(it.defense) ? clamp(it.defense, 0, GEAR_CAPS.defense)
    : (ARMOR_DEFENSE[it.cls] || ARMOR_DEFENSE.neutral)[clamp(it.tier | 0, 0, 3)];
}
function itemDescriptionLines(it) {
  const lines = it && it.lines || [];
  return it && it.slot === 'armor' ? [`防御 +${armorDefense(it)}`, ...lines] : lines;
}

function equippedIds() { return new Set(equipList().map(i => i.id)); }
function rollItem(tier, exclude = new Set()) {
  const own = equippedIds(), ok = i => !i.start && isUnlocked(i) && !own.has(i.id) && !exclude.has(i.id) && !(i.id === 'phoenix' && G.phoenixUsed);
  for (let t = tier; t >= 0; t--) {
    let pool = ITEMS.concat(forgeLootItems()).filter(i => i.tier === t && ok(i));
    if (!pool.length) continue;
    // pick a class first so every class drops equally often regardless of how many items it has;
    // CONFIG.classBias of the time the drop leans to the class you are already wearing most of
    const groups = {}; for (const i of pool) (groups[i.cls || ''] = groups[i.cls || ''] || []).push(i);
    const keys = Object.keys(groups), lead = leadClass();
    const k = lead && groups[lead] && rand() < CONFIG.classBias ? lead : pick(keys);
    pool = groups[k];
    // items never seen before get double weight so new unlocks show up quickly
    return pick(pool.flatMap(i => META.seenSet.has(i.id) ? [i] : [i, i]));
  }
  return POTION;
}
// class with the most equipped pieces (ties -> none), used to bias loot
function leadClass() {
  const n = {}; for (const it of equipList()) if (it.cls) n[it.cls] = (n[it.cls] || 0) + 1;
  const best = Object.entries(n).sort((a, b) => b[1] - a[1]);
  return best.length && (best.length === 1 || best[0][1] > best[1][1]) ? best[0][0] : null;
}
function itemIcon(it) { return icon(...it.icon); }
// Only one copy of a given trinket counts. Stacking five identical trinkets used to multiply every
// chance and multiplier at once (see GEAR_CAPS), which is what made most of the extreme builds possible.
function trinketAlreadyOn(it) { return it.slot === 'trinket' && G.eq.trinkets.some(t => t.id === it.id); }
const equipList = () => {
  const seen = new Set();
  return [G.eq.weapon, G.eq.armor, G.eq.boots, ...G.eq.trinkets].filter(Boolean).filter(it => {
    if (it.slot !== 'trinket') return true;                    // weapons / armor / boots are single-slot already
    if (seen.has(it.id)) return false;                         // also covers old saves and LAN payloads
    seen.add(it.id); return true;
  });
};

// recompute player stats from talents + gear (so swapping gear is always clean)
function recalcStats() {
  const p = G.player, s = baseStats();
  if (p.weaponId !== G.eq.weapon.id) cancelPlayerCharge(p);
  p.weaponId = G.eq.weapon.id;
  for (const it of equipList()) { it.mod(s); s.defense += armorDefense(it); forgeApplyWeapon(s, it); }
  applySets(s, equipList());                // class set tiers (classes.js)
  const costume = wornCostume();
  applyCostumeStats(s, costume.id);         // one worn outfit, after gear; never stacks across recalculations
  // hard caps so stacked gear cannot turn chances into certainties
  const CAP = GEAR_CAPS;
  s.defense = clamp(s.defense + (s.wpn.ranged ? 0 : CONFIG.meleeDefense), 0, CAP.defense);
  s.crit = Math.min(s.crit, CAP.crit); s.block = Math.min(s.block, CAP.block); s.vamp = Math.min(s.vamp, CAP.vamp);
  s.procMul = Math.min(s.procMul, CAP.procMul); s.atkSpd = Math.min(s.atkSpd, CAP.atkSpd); s.rollCd = Math.max(s.rollCd, CAP.rollCd);
  s.minions = Math.min(s.minions, CAP.minions); s.minionDmg = Math.min(s.minionDmg, CAP.minionDmg); s.minionSpd = Math.min(s.minionSpd, CAP.minionSpd);
  s.shieldCap = Math.min(s.shieldCap, CAP.shieldCap); s.healBonus = Math.min(s.healBonus, CAP.healBonus);
  if (s.regen > 0) s.regen = Math.max(s.regen, CAP.regen);
  for (const k of ['holyHeal', 'toxOnHit', 'voidLeech']) if (s[k]) s[k] = Math.min(s[k], CAP[k]);
  for (const k of ['dotMul', 'goldMul', 'magnet', 'finaleMul']) s[k] = Math.min(s[k], CAP[k]);
  // Weapon-only speed includes silver parts, synergies, form and cultivation, but excludes role gear.
  s.wpnSpdMul = s.wpnSpdMul || 1;
  s.minionCadence = s.wpnSpdMul;
  s.critMul = Math.round(s.critMul * 100) / 100;
  const prevMax = p.maxHp;
  Object.assign(p, s);
  p.costume = costume.id;
  if (!s.riftDash) p.riftPending = null;
  p.reach = (s.wpn.reach || 0) * s.reachMul; p.atkCd = s.wpn.cd / s.atkSpd;
  if (prevMax === undefined) p.hp = p.maxHp;
  else if (p.maxHp > prevMax) p.hp += p.maxHp - prevMax;
  p.hp = Math.min(Math.round(p.hp * 1000) / 1000, p.maxHp);
  p.orbitN = s.orbit;
}
// options shown on the item card. Each: { label, fn } ; fn applies the choice
function itemOptions(it) {
  const e = G.eq, sell = SELL[it.tier];
  const sellOpt = { label: `出售  +${sell} 金币`, col: '#ffdc5a', sell: true, fn: () => { gainGold(sell); } };
  if (it.slot === 'use') return null;
  if (it.slot === 'weapon' || it.slot === 'armor' || it.slot === 'boots') {
    const old = e[it.slot];
    if (!old) return null;
    const oldName = old.silver ? forgeItemName(old) : old.name;
    const shortName = old.silver && Array.from(oldName).length > 6 ? Array.from(oldName).slice(0, 6).join('') + '…' : oldName;
    return [{ label: `装备  (替换 ${shortName}，+${SELL[old.tier]} 金币)`, replaces: old, fn: () => { gainGold(SELL[old.tier]); e[it.slot] = it; } }, sellOpt];
  }
  if (trinketAlreadyOn(it)) return [{ ...sellOpt, label: `出售  +${sell} 金币（同类饰品只能装备一件）` }];
  if (e.trinkets.length < G.player.trinketSlots) return null;
  return [...e.trinkets.map((o, i) => ({ label: `替换 ${o.name}  (+${SELL[o.tier]} 金币)`, replaces: o, fn: () => { gainGold(SELL[o.tier]); e.trinkets[i] = it; } })), sellOpt];
}
function equipDirect(it) {
  if (it.slot === 'use') { it.use(G.player); return; }
  if (it.slot === 'trinket') { if (!trinketAlreadyOn(it)) G.eq.trinkets.push(it); }
  else G.eq[it.slot] = it;
}
function finishTake(it, opt) {            // opt === undefined -> free slot / consumable
  const discovered = it.slot !== 'use' && !META.seenSet.has(it.id);
  if (opt) opt.fn(); else equipDirect(it);
  if (it.slot !== 'use') META.seenSet.add(it.id);
  if (it.slot === 'weapon' && !it.lock && !it.silver && !it.start && !CAMP_STARTERS.includes(it.id)) META.unlockedSet.add(it.id);
  recalcStats();
  if (discovered) townServiceEvent('discover', { id: it.id });
}
// short slot summary for HUD / card: e.g. "饰品 2/3"
const slotText = it => it.slot === 'trinket' ? `饰品 ${G.eq.trinkets.length}/${G.player.trinketSlots}` : SLOT_NAME[it.slot];
function gainGold(n) { if (n <= 0) return; G.gold += n; G.goldPulse = 0.2; SFX.coin(); addFloat(G.player.x, G.player.y - 26, `+${n} 金币`, '#ffdc5a'); }
