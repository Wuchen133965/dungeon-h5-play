'use strict';
// ============================================================ 章节限定装备（扩充）+ 近战手感调整
// 第 1 到第 6 幕各再补 8 件，共 48 件：5 件武器 + 3 件饰品。全都带 act 标签，走 act-gear.js 那套规则
// （只在本幕掉落、品质最高的那件要先通关该幕）。另外新增 5 种武器类型，并把近战整体调得好用一些。
// 本文件在 act-gear.js 之后加载，只往 ITEMS / WTYPES / 图标表里加东西，不改动其他文件。

// ---------------------------------------------------------------- 近战手感
// 近战的问题不是伤害，而是「要贴上去才打得到」：远程能站远处输出，近战却常常够不着。
// 处理办法：近战武器整体加长 3 像素（约 15%），重武器稍微加快，攻击时带一小步前冲，贴身手感更黏。
CONFIG.meleeLunge = CONFIG.meleeLunge ?? 90;        // 近战命中目标时向前冲的力度（0 = 关闭）
for (const [kind, reach] of [['sword', 26], ['axe', 29], ['dagger', 20], ['hammer', 33], ['spear', 42]]) WTYPES[kind].reach = reach;
WTYPES.axe.cd = 0.54;                               // 重劈原本 0.58，稍微快一点
WTYPES.hammer.cd = 0.74;                            // 环形重击原本 0.8

// ---------------------------------------------------------------- 五种新武器类型
Object.assign(WTYPES, {
  // 巨剑：慢、范围大、一劈一排
  greatsword: { kind: 'greatsword', reach: 30, arc: 1.9, cd: 0.62, mul: 2.1, kb: 230, swingT: 0.2, heavy: true },
  // 长鞭：近战里距离最远，伤害低但出手快，适合边打边退
  whip: { kind: 'whip', reach: 36, arc: 1.5, cd: 0.34, mul: 0.75, kb: 90, swingT: 0.12 },
  // 十字弩：慢速重弩，一发穿透多个敌人
  crossbow: { kind: 'crossbow', ranged: true, cd: 0.75, mul: 1.7, speed: 320, proj: 'bolt', kb: 140, swingT: 0.16, life: 1.1, r: 4, pierce: 2 },
  // 飞轮：扔出去切一遍，再飞回手里（回收逻辑在本文件末尾）
  chakram: { kind: 'chakram', ranged: true, cd: 0.6, mul: 0.95, speed: 230, proj: 'chakram', kb: 70, swingT: 0.1, life: 1.5, r: 5, pierce: 99 },
  // 利爪：极快、极短，靠连击和暴击
  claws: { kind: 'claws', reach: 19, arc: 0.95, cd: 0.15, mul: 0.45, kb: 50, swingT: 0.08 },
});
Object.assign(WLEN, { greatsword: 15, whip: 26, claws: 5, crossbow: 0, chakram: 0 });
WEAPON_DRAW.greatsword = (hx, hy, ang, [main, dark, hl], sc) => { const c = Math.cos(ang), s = Math.sin(ang), pc = -s, ps = c;
  for (let i = 0; i < 13; i++) px(hx + c * i, hy + s * i, 1, 1, i < 3 ? dark : main);
  for (let j = -2; j <= 2; j++) px(hx + c * 13 + pc * j, hy + s * 13 + ps * j, 1, 1, j === 0 ? hl : main);
  px(hx + c * 3 - pc, hy + s * 3 - ps, 1, 1, dark); px(hx + c * 3 + pc, hy + s * 3 + ps, 1, 1, dark);
};
WEAPON_DRAW.whip = (hx, hy, ang, [main, dark, hl]) => { const c = Math.cos(ang), s = Math.sin(ang);
  for (let i = 0; i < 24; i++) { const k = Math.sin(i * 0.7) * 3; px(hx + c * i - s * k, hy + s * i + c * k, 1, 1, i > 20 ? hl : i % 4 ? main : dark); } };
WEAPON_DRAW.claws = (hx, hy, ang, [main, dark, hl]) => { const c = Math.cos(ang), s = Math.sin(ang), pc = -s, ps = c;
  for (const j of [-2, 0, 2]) for (let i = 0; i < 5; i++) px(hx + c * i + pc * j, hy + s * i + ps * j, 1, 1, i > 2 ? hl : main);
  px(hx - pc * 2, hy - ps * 2, 3, 3, dark); };
WEAPON_DRAW.crossbow = (hx, hy, ang, [main, dark, hl]) => { const c = Math.cos(ang), s = Math.sin(ang), pc = -s, ps = c;
  for (let i = 0; i < 8; i++) px(hx + c * i, hy + s * i, 1, 1, i < 3 ? dark : main);
  for (const j of [-5, -4, 4, 5]) px(hx + c * 7 + pc * j, hy + s * 7 + ps * j, 1, 1, dark);
  px(hx + c * 7 - pc * 3, hy + s * 7 - ps * 3, 1, 1, hl); px(hx + c * 7 + pc * 3, hy + s * 7 + ps * 3, 1, 1, hl); };
WEAPON_DRAW.chakram = (hx, hy, ang, [main, dark, hl]) => { ellipse(hx, hy, 4, 4, main); ellipse(hx, hy, 3, 3, dark); px(hx - 1, hy - 1, 2, 2, hl); };
Object.assign(SHOT_DRAW, {
  chakram: s => { const a = s.rot * 2; ellipse(s.x, s.y, 5, 5, '#c8c0d8'); for (let k = 0; k < 4; k++) px(s.x + Math.cos(a + k * 1.57) * 5, s.y + Math.sin(a + k * 1.57) * 5, 2, 2, k % 2 ? '#ffffff' : '#8a92a8');
    px(s.x - 1, s.y - 1, 2, 2, '#5a6078'); },
});
Object.assign(SHOT_SPARK, { chakram: ['#c8c0d8', '#ffffff'] });
Object.assign(SHOT_LIGHT, { chakram: [190, 180, 210] });
Object.assign(ICON_ROWS, {
  gsword: ['.....ooc', '....oca.', '...oca..', '..oca...', '.oca....', 'ooc.o...', 'oo......', '........'],
  whip: ['........', 'o.......', 'oo......', '.oo.....', '..oo.o..', '...ooo..', '....oo..', '........'],
  xbow: ['........', 'o..o..o.', '.o.o.o..', '..ooo...', 'ooacoo..', '..obo...', '..obo...', '...o....'],
  chakram: ['..ooo...', '.ocaco..', 'oca..ao.', 'oa....co', 'oa....co', 'oca..ao.', '.ocaco..', '..ooo...'],
  claw: ['........', 'o.oo.oo.', 'ooaooao.', '.oaaaao.', '..oaao..', '..obbo..', '...oo...', '........'],
});

// ---------------------------------------------------------------- 每幕 8 件
const MORE_GEAR = [
  // ---------------- 第一幕 · 晨星边境（基础幕，品质 0～1）
  { act: 1, id: 'm1_gsword', cls: 'warrior', tier: 1, slot: 'weapon', name: '铁卫巨剑', icon: ['gsword', '#b4bcd4', '#4a5068', '#ffffff'],
    lines: ['巨剑：出手慢，范围大', '攻击力 +0.5'], mod: W('greatsword', s => { s.dmg += 0.5; }) },
  { act: 1, id: 'm1_whip', cls: 'ranger', tier: 1, slot: 'weapon', name: '驯兽长鞭', icon: ['whip', '#c8a060', '#5a3a22', '#ffffff'],
    lines: ['长鞭横扫，攻击距离很长', '攻击力 -0.25，暴击率 +3%'], mod: W('whip', s => { s.dmg -= 0.25; s.crit += 0.03; }) },
  { act: 1, id: 'm1_claw', cls: 'ranger', tier: 1, slot: 'weapon', name: '掘墓者利爪', icon: ['claw', '#9aa0b0', '#3a3a4a', '#ffffff'],
    lines: ['利爪连击，攻速极快', '攻击力 -0.25，暴击率 +5%'], mod: W('claws', s => { s.dmg -= 0.25; s.crit += 0.05; }) },
  { act: 1, id: 'm1_scepter', cls: 'cleric', tier: 1, slot: 'weapon', name: '圣水短杖', icon: ['holy', '#ffe080', '#8a6a20', '#ffffff'],
    lines: ['圣光弹，命中时溅射', '攻击力 +0.25'], mod: W('scepter', s => { s.dmg += 0.25; }) },
  { act: 1, id: 'm1_rod', cls: 'summoner', tier: 1, slot: 'weapon', name: '骸骨召魂杖', icon: ['staff', '#e4dcc4', '#5a4a3a', '#ffffff'],
    lines: ['召唤 2 只灵体协助战斗'], mod: W('rod', s => { s.minions += 2; }) },
  { act: 1, id: 'm1_hymnal', cls: 'bard', tier: 0, slot: 'trinket', name: '赞美诗集', icon: ['book', '#e8d8a0', '#6a5030', '#ffffff'],
    lines: ['灵感积累 +40%', '每 18 秒回复半颗心'], mod: s => { s.insGain *= 1.4; s.regen = s.regen ? Math.min(s.regen, 18) : 18; } },
  { act: 1, id: 'm1_lantern', cls: '', tier: 0, slot: 'trinket', name: '矿灯吊坠', icon: ['lantern', '#ffd060', '#6a4a20', '#fff6c0'],
    lines: ['拾取范围 +25%', '击杀时 4% 回复半颗心'], mod: s => { s.magnet *= 1.25; s.vamp += 0.04; } },
  { act: 1, id: 'm1_keys', cls: '', tier: 0, slot: 'trinket', name: '锈蚀钥匙串', icon: ['ring', '#c8a060', '#5a3a22', '#ffffff'],
    lines: ['宝箱升阶几率 +6%', '金币掉落 +20%'], mod: s => { s.luck += 0.06; s.goldMul += 0.2; } },
  // ---------------- 第二幕 · 霜原
  { act: 2, id: 'm2_gsword', cls: 'warrior', tier: 2, slot: 'weapon', name: '霜牙巨剑', icon: ['gsword', '#a8e0ff', '#3a6a9a', '#ffffff'],
    lines: ['巨剑，攻击力 +1', '15% 几率冻结敌人'], mod: W('greatsword', s => { s.dmg += 1; s.freeze += 0.15; }) },
  { act: 2, id: 'm2_whip', cls: 'ranger', tier: 2, slot: 'weapon', name: '冰棘长鞭', icon: ['whip', '#8ae0ff', '#3a5a8a', '#ffffff'],
    lines: ['长鞭横扫，攻击距离 +15%', '12% 几率冻结敌人'], mod: W('whip', s => { s.reachMul *= 1.15; s.freeze += 0.12; }) },
  { act: 2, id: 'm2_staff', cls: 'mage', tier: 2, slot: 'weapon', name: '落雪法杖', icon: ['staff', '#e0f4ff', '#5a7a9a', '#ffffff'],
    lines: ['发射魔法飞弹，穿透 +1', '12% 几率冻结敌人'], mod: W('staff', s => { s.pierce += 1; s.freeze += 0.12; }) },
  { act: 2, id: 'm2_scepter', cls: 'cleric', tier: 2, slot: 'weapon', name: '寒星圣杖', icon: ['holy', '#c8f0ff', '#3a6a9a', '#ffffff'],
    lines: ['圣光弹，10% 几率冻结敌人', '所有治疗量 +半颗心'], mod: W('scepter', s => { s.freeze += 0.1; s.healBonus += 1; }) },
  { act: 2, id: 'm2_rod', cls: 'summoner', tier: 2, slot: 'weapon', name: '寒鸦召魂杖', icon: ['staff', '#8ac0ff', '#2a3a5a', '#ffffff'],
    lines: ['召唤 2 只灵体', '召唤物攻击速度 +25%'], mod: W('rod', s => { s.minions += 2; s.minionSpd *= 1.25; }) },
  { act: 2, id: 'm2_pendant', cls: 'mage', tier: 1, slot: 'trinket', name: '冰晶吊坠', icon: ['gem', '#8ae0ff', '#3a6a9a', '#ffffff'],
    lines: ['所有触发几率 ×1.09', '冻结的敌人受到的伤害 +20%'], mod: s => { s.procMul *= 1.09; s.frostBite += 0.2; } },
  { act: 2, id: 'm2_sleighbell', cls: 'bard', tier: 1, slot: 'trinket', name: '雪橇铃', icon: ['note', '#e8eef8', '#5a6a8a', '#ffffff'],
    lines: ['移动速度 +8%', '灵感积累 +30%'], mod: s => { s.speed *= 1.08; s.insGain *= 1.3; } },
  { act: 2, id: 'm2_bracer', cls: '', tier: 1, slot: 'trinket', name: '毛皮护腕', icon: ['whet', '#e8eef8', '#8a98b0', '#ffffff'],
    lines: ['生命上限 +1', '寒冷积累速度 -35%'], mod: s => { s.maxHp += 2; s.coldRes *= 0.65; } },
  // ---------------- 第三幕 · 腐沼
  { act: 3, id: 'm3_gsword', cls: 'warrior', tier: 2, slot: 'weapon', name: '沼铁巨剑', icon: ['gsword', '#8aa070', '#3a4a2a', '#d0ffb0'],
    lines: ['巨剑，攻击力 +1', '18% 几率使敌人中毒'], mod: W('greatsword', s => { s.dmg += 1; s.poison += 0.18; }) },
  { act: 3, id: 'm3_claw', cls: 'ranger', tier: 2, slot: 'weapon', name: '毒牙利爪', icon: ['claw', '#6adc5a', '#2a5a2a', '#d0ffc0'],
    lines: ['利爪连击', '24% 几率使敌人中毒'], mod: W('claws', s => { s.poison += 0.24; }) },
  { act: 3, id: 'm3_horn', cls: 'bard', tier: 2, slot: 'weapon', name: '蛙鸣号角', icon: ['horn', '#6a9a3a', '#2a4a1a', '#d0f0a0'],
    lines: ['吹出扇形音波，一次 3 道', '10% 几率定住敌人'], mod: W('horn', s => { s.multi = 3; s.freeze += 0.1; }) },
  { act: 3, id: 'm3_scepter', cls: 'cleric', tier: 2, slot: 'weapon', name: '净毒圣杖', icon: ['holy', '#a8e060', '#4a6a20', '#ffffff'],
    lines: ['圣光弹，命中时溅射', '15% 几率使敌人中毒', '所有治疗量 +半颗心'], mod: W('scepter', s => { s.poison += 0.15; s.healBonus += 1; }) },
  { act: 3, id: 'm3_rod', cls: 'summoner', tier: 2, slot: 'weapon', name: '菌丝召魂杖', icon: ['staff', '#9a3ab0', '#3a1a3a', '#f0d0ff'],
    lines: ['召唤 3 只灵体', '召唤物攻击 35% 几率中毒'], mod: W('rod', s => { s.minions += 3; s.minionPoison += 0.35; }) },
  { act: 3, id: 'm3_moss', cls: 'cleric', tier: 1, slot: 'trinket', name: '苔藓护符', icon: ['amulet', '#6a9a3a', '#2a4a1a', '#d0f0a0'],
    lines: ['所有治疗量 +半颗心', '每 20 秒回复半颗心'], mod: s => { s.healBonus += 1; s.regen = s.regen ? Math.min(s.regen, 20) : 20; } },
  { act: 3, id: 'm3_flute', cls: 'bard', tier: 1, slot: 'trinket', name: '蛙皮小笛', icon: ['note', '#7adc5a', '#2a5a2a', '#d0ffb0'],
    lines: ['攻击速度 +6%', '击杀获得 1 层灵感'], mod: s => { s.atkSpd *= 1.06; s.insKill += 1; } },
  { act: 3, id: 'm3_boots', cls: '', tier: 1, slot: 'trinket', name: '泥浆靴', icon: ['boots', '#5a6a3a', '#2a3a1a', '#a8c070'],
    lines: ['移动速度 +6%', '免疫中毒与孢子云'], mod: s => { s.speed *= 1.06; s.sporeRes = true; } },
  // ---------------- 第四幕 · 黄沙
  { act: 4, id: 'm4_gsword', cls: 'warrior', tier: 2, slot: 'weapon', name: '沙铁巨剑', icon: ['gsword', '#d8a860', '#6a4a20', '#fff0c0'],
    lines: ['巨剑，攻击力 +1', '击杀时 12% 几率爆炸'], mod: W('greatsword', s => { s.dmg += 1; s.explode += 0.12; }) },
  { act: 4, id: 'm4_crossbow', cls: 'ranger', tier: 2, slot: 'weapon', name: '流沙重弩', icon: ['xbow', '#d8a860', '#5a3a10', '#ffe080'],
    lines: ['弩箭慢而穿透 3 个敌人', '攻击力 +0.5'], mod: W('crossbow', s => { s.pierce += 1; s.dmg += 0.5; }) },
  { act: 4, id: 'm4_chakram', cls: 'ranger', tier: 2, slot: 'weapon', name: '回旋沙轮', icon: ['chakram', '#ecba40', '#8a5a10', '#ffffff'],
    lines: ['飞轮扔出去切过敌人，再飞回手里', '穿透所有敌人'], mod: W('chakram', s => { s.chakReturn = true; }) },
  { act: 4, id: 'm4_scepter', cls: 'cleric', tier: 2, slot: 'weapon', name: '烈日圣杖', icon: ['holy', '#ffd040', '#c84a20', '#fff6d0'],
    lines: ['圣光弹，18% 几率点燃敌人', '所有治疗量 +半颗心'], mod: W('scepter', s => { s.burn += 0.18; s.healBonus += 1; }) },
  { act: 4, id: 'm4_rod', cls: 'summoner', tier: 2, slot: 'weapon', name: '法老召魂杖', icon: ['staff', '#ecba40', '#6a4a20', '#fff0c0'],
    lines: ['召唤 3 只灵体', '召唤物伤害 +18%'], mod: W('rod', s => { s.minions += 3; s.minionDmg *= 1.18; }) },
  { act: 4, id: 'm4_scarab', cls: 'mage', tier: 2, slot: 'trinket', name: '圣甲虫吊坠', icon: ['amulet', '#3a8a5a', '#1a3a2a', '#8affc8'],
    lines: ['所有触发几率 ×1.15'], mod: s => { s.procMul *= 1.15; } },
  { act: 4, id: 'm4_metronome', cls: 'bard', tier: 2, slot: 'trinket', name: '沙漏节拍器', icon: ['hourglass', '#ecba40', '#7a5a30', '#fff0b0'],
    lines: ['攻击速度 +7%', '每层灵感效果 +1%'], mod: s => { s.atkSpd *= 1.07; s.insPer += 0.01; } },
  { act: 4, id: 'm4_sundial', cls: '', tier: 2, slot: 'trinket', name: '日晷', icon: ['orbit', '#ecba40', '#5a4a30', '#ffffff'],
    lines: ['移动速度 +8%', '翻滚冷却 -9%'], mod: s => { s.speed *= 1.08; s.rollCd *= 0.91; } },
  // ---------------- 第五幕 · 天穹
  { act: 5, id: 'm5_gsword', cls: 'warrior', tier: 3, slot: 'weapon', name: '雷纹巨剑', icon: ['gsword', '#ffe060', '#5a6a90', '#ffffff'],
    lines: ['巨剑，攻击力 +1.5', '18% 几率引发连锁闪电'], mod: W('greatsword', s => { s.dmg += 1.5; s.chain += 0.18; }) },
  { act: 5, id: 'm5_crossbow', cls: 'ranger', tier: 3, slot: 'weapon', name: '雷霆重弩', icon: ['xbow', '#ffe080', '#5a4a8a', '#ffffff'],
    lines: ['弩箭穿透 3 个敌人，攻击力 +1', '15% 几率引发连锁闪电'], mod: W('crossbow', s => { s.pierce += 1; s.dmg += 1; s.chain += 0.15; }) },
  { act: 5, id: 'm5_chakram', cls: 'ranger', tier: 3, slot: 'weapon', name: '风暴飞轮', icon: ['chakram', '#c8f0ff', '#3a6a8a', '#ffffff'],
    lines: ['飞轮扔出去切过敌人，再飞回手里', '15% 几率引发连锁闪电'], mod: W('chakram', s => { s.chakReturn = true; s.chain += 0.15; }) },
  { act: 5, id: 'm5_tome', cls: 'mage', tier: 2, slot: 'weapon', name: '星辉魔典', icon: ['book', '#c8a0ff', '#3a2a6a', '#ffffff'],
    lines: ['奥术球，穿透 2 个敌人', '所有触发几率 ×1.12'], mod: W('tome', s => { s.procMul *= 1.12; }) },
  { act: 5, id: 'm5_scepter', cls: 'cleric', tier: 2, slot: 'weapon', name: '星辉圣杖', icon: ['holy', '#e8d0ff', '#5a3a8a', '#ffffff'],
    lines: ['圣光弹会追踪敌人', '所有治疗量 +半颗心'], mod: W('scepter', s => { s.homing = true; s.healBonus += 1; }) },
  { act: 5, id: 'm5_scope', cls: 'mage', tier: 2, slot: 'trinket', name: '观星镜', icon: ['eye', '#c8a0ff', '#3a2a6a', '#ffffff'],
    lines: ['所有触发几率 ×1.12', '远程弹道射程 +20%'], mod: s => { s.procMul *= 1.12; s.rangeMul = (s.rangeMul || 1) * 1.2; } },
  { act: 5, id: 'm5_chime', cls: 'bard', tier: 2, slot: 'trinket', name: '风铃', icon: ['note', '#d0f8f0', '#3a6a7a', '#ffffff'],
    lines: ['灵感积累 +50%', '移动速度 +8%'], mod: s => { s.insGain *= 1.5; s.speed *= 1.08; } },
  { act: 5, id: 'm5_feather', cls: '', tier: 2, slot: 'trinket', name: '风羽护符', icon: ['feather', '#e8eef8', '#5a6a8a', '#ffffff'],
    lines: ['翻滚冷却 -15%', '拾取范围 ×2'], mod: s => { s.rollCd *= 0.85; s.magnet *= 2; } },
  // ---------------- 第六幕 · 虚空终焉
  { act: 6, id: 'm6_gsword', cls: 'warrior', tier: 3, slot: 'weapon', name: '湮灭巨剑', icon: ['gsword', '#b45aff', '#2a0a40', '#ff3060'],
    lines: ['巨剑，攻击力 +1.5', '击杀时 15% 几率爆炸'], mod: W('greatsword', s => { s.dmg += 1.5; s.explode += 0.15; }) },
  { act: 6, id: 'm6_claw', cls: 'ranger', tier: 3, slot: 'weapon', name: '裂隙利爪', icon: ['claw', '#b45aff', '#3a1a5a', '#ffffff'],
    lines: ['利爪连击，暴击率 +9%', '闪避结束并恢复攻击后释放裂隙'], mod: W('claws', s => { s.crit += 0.09; s.riftDash = true; }) },
  { act: 6, id: 'm6_lute', cls: 'bard', tier: 2, slot: 'weapon', name: '终末竖琴', icon: ['lute', '#8a5aff', '#2a1a40', '#ff3060'],
    lines: ['弹奏音符，穿透所有敌人', '攻击力 +0.5，灵感积累 ×1.5'], mod: W('lute', s => { s.dmg += 0.5; s.insGain *= 1.5; }) },
  { act: 6, id: 'm6_scepter', cls: 'cleric', tier: 3, slot: 'weapon', name: '终焉圣杖', icon: ['holy', '#ffffff', '#5a2a8a', '#e0c8ff'],
    lines: ['一次发射 2 枚圣光弹', '所有治疗量 +半颗心'], mod: W('scepter', s => { s.multi = 2; s.healBonus += 1; }) },
  { act: 6, id: 'm6_rod', cls: 'summoner', tier: 3, slot: 'weapon', name: '虚空召魂杖', icon: ['staff', '#2a1a40', '#0a0418', '#b45aff'],
    lines: ['召唤 4 只灵体', '召唤物伤害 +24%'], mod: W('rod', s => { s.minions += 4; s.minionDmg *= 1.24; }) },
  { act: 6, id: 'm6_pendant', cls: 'mage', tier: 3, slot: 'trinket', name: '混沌吊坠', icon: ['gem', '#b45aff', '#2a0a40', '#ff8af0'],
    lines: ['所有触发几率 ×1.18', '攻击力 +0.5'], mod: s => { s.procMul *= 1.18; s.dmg += 0.5; } },
  { act: 6, id: 'm6_bell', cls: 'bard', tier: 3, slot: 'trinket', name: '终末编钟', icon: ['note', '#ffd060', '#5a2a8a', '#ffffff'],
    lines: ['灵感上限 +4', '每 16 秒回复半颗心'], mod: s => { s.insCap += 4; s.regen = s.regen ? Math.min(s.regen, 16) : 16; } },
  { act: 6, id: 'm6_eye', cls: '', tier: 3, slot: 'trinket', name: '虚空之眼', icon: ['eye', '#ff3060', '#2a0a40', '#ffffff'],
    lines: ['生命上限 +1', '击杀时 8% 回复半颗心'], mod: s => { s.maxHp += 2; s.voidLeech += 0.08; } },
];
for (const it of MORE_GEAR) {
  if (ITEM_BY_ID[it.id]) continue;
  ITEMS.push(it); ITEM_BY_ID[it.id] = it; GEAR_IDS.add(it.id);
  (GEAR_BY_ACT[it.act] = GEAR_BY_ACT[it.act] || []).push(it);
}

// ---------------------------------------------------------------- 近战前冲 + 飞轮回收
// 近战命中时向前迈一小步，贴身更顺手（力度可用 CONFIG.meleeLunge 调，0 = 关闭）
const _attack = attack;
// 冲量 L 经 playerKnockbackStep(.82 衰减) 累计位移约 L/10.8 像素
const LUNGE_DIST_PER_IMPULSE = 1 / (0.18 * 60);
CONFIG.meleeStandoff = CONFIG.meleeStandoff ?? 6;   // 前冲后与敌人碰撞箱至少保留的间隙（像素）
function playerAttackLunge(p) {
  const w = p.wpn, lunge = CONFIG.meleeLunge;
  // 先看挥砍前前方有没有敌人（要在结算伤害之前判断，否则一击必杀的敌人已经归零，就冲不起来了）
  // 只冲到“站位距离”为止：已经贴身/在有效距离内时不再前冲，避免连续攻击一点点挤进敌人身体里。
  if (!lunge || w.ranged || p.rolling > 0) return 0;
  const reach = (p.reach || 0) * p.scale, py = p.y - 6;
  let room = Infinity;
  for (const e of G.enemies) {
    if (e.spawn > 0 || e.hp <= 0) continue;
    const d = dist(p.x, py, e.x, e.y - e.h / 2);
    if (!(d < reach * 1.3 + e.hw && (d < 8 || Math.abs(angDiff(p.face, Math.atan2(e.y - e.h / 2 - py, e.x - p.x))) < w.arc + 0.3))) continue;
    const keep = (e.hw || 0) + (p.hw || 4) + Math.max(CONFIG.meleeStandoff, reach * 0.55);
    room = Math.min(room, d - keep);
  }
  if (room === Infinity || room <= 0) return 0;
  return Math.min(lunge, room / LUNGE_DIST_PER_IMPULSE);
}
attack = function (level = 0) {
  if (!playerAttackRecovered(G.player)) return;
  const p = G.player, lunge = level ? 0 : playerAttackLunge(p);
  _attack(level);
  if (!lunge) return;
  p.kbx += Math.cos(p.face) * lunge; p.kby += Math.sin(p.face) * lunge;
};
// 飞轮：飞出去一段时间后掉头回玩家手里，接住就算结束（伤害仍由原来的弹道逻辑结算）
const _classHookGear = classHook;
classHook = function (ev, a, b, c) {
  const out = _classHookGear(ev, a, b, c);
  if (ev !== 'update' || !G.shots.length) return out;
  const p = G.player, dt = a;
  for (const s of G.shots) {
    if (s.ownerId && coopRuntimeIsActive() && s.ownerId !== coopActorId()) continue;
    // 出手时记下速度，回程按这个固定速度飞回来（不能用「当前速度」，否则速度衰减到 0 就会卡在半空）
    if (!s.chak) { if (s.kind === 'chakram' && s.friendly) s.chak = { t: 0.42, back: false, hold: s.motion === 'hover' ? .15 : 0, sp: Math.hypot(s.vx, s.vy) || 230, ret: 3 }; else continue; }
    const C = s.chak;
    if (!C.back) {
      C.t -= dt;
      if (C.t > 0) continue;
      if (C.hold > 0) { C.hold = Math.max(0, C.hold - dt); s.vx = s.vy = 0; s.phase = 1; continue; }
      C.back = true; s.phase = 2;
      if (s.motion === 'hover') { const back = Math.atan2(p.y - 6 - s.y, p.x - s.x); s.vx = Math.cos(back) * C.sp; s.vy = Math.sin(back) * C.sp; }
    }
    const d = dist(s.x, s.y, p.x, p.y - 6);
    if (d < 12 || (C.ret -= dt) <= 0) { s.life = 0; if (spawnP(0.5)) burst(s.x, s.y, 6, ['#c8c0d8', '#ffffff'], { sp: 40, life: 0.25 }); continue; }
    const ang = Math.atan2(p.y - 6 - s.y, p.x - s.x), k = clamp(dt * 8);
    s.vx = lerp(s.vx, Math.cos(ang) * C.sp, k); s.vy = lerp(s.vy, Math.sin(ang) * C.sp, k);
    s.life = Math.max(s.life, 0.3);                       // 回程路上别被寿命掐掉
  }
  return out;
};
