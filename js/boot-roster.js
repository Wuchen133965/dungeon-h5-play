'use strict';
// Move actual footwear into its own slot without replacing IDs, effects, class
// tags, blueprints or chapter gates. Hourglasses and cloaks remain accessories
// and armor. Save migration is handled by the equipment loader.
const BOOT_MIGRATIONS = ['boots', 'g2_spikeboots', 'g3_bogwaders', 'm3_boots'];
for (const id of BOOT_MIGRATIONS) {
  const item = ITEM_BY_ID[id]; if (item) item.slot = 'boots';
}

// The silhouette reflects the build: plated greaves, light trail shoes, rune
// slippers, holy boots, dancing shoes and spirit-bound sandals. Each item also
// carries a distinct palette used for the equipped character's feet.
Object.assign(ICON_ROWS, {
  warboots: ['.ooo.ooo', '.oao.oao', '.oco.oco', '.obo.obo', '.oao.oao', 'oaaooaao', 'oabooabo', 'ooo.ooo.'],
  trailboots: ['........', '.oo..oo.', '.oa..oa.', '.ob..ob.', '.oa..oa.', 'oacoaco.', 'oaaoaao.', 'ooo.ooo.'],
  runeboots: ['..oo.oo.', '.oaooao.', '.ocooco.', '.oaooao.', '.oboobo.', 'oaaoaao.', 'oacoaco.', 'ooo.ooo.'],
  holyboots: ['.oo..oo.', '.oc..oc.', '.oa..oa.', '.oc..oc.', '.oa..oa.', 'oaacoac.', 'oabooab.', 'ooo.ooo.'],
  danceboots: ['........', '..oo.oo.', '..oa.oa.', '..ob.ob.', '..oa.oa.', '.oacoac.', 'oaaoaao.', 'ooo.ooo.'],
  spiritboots: ['........', '.oo..oo.', 'oacoocao', '.oa..oa.', '..o..o..', '.oa..oa.', 'oacoocao', '.oooooo.'],
});

// Eight footwear choices per class: two common / rare / epic / legendary.
// Ranger ice boots and bard leather boots already fill one common position.
// Rare and common items need no blueprint; each class has a freely available
// epic and legendary alternative alongside a smith-unlocked option.
const BOOT_ROSTER = [
  // Warrior: stable movement, guard, rage and quake positioning.
  { id: 'bt_war_gate', cls: 'warrior', tier: 0, slot: 'boots', name: '守门铁靴', icon: ['warboots', '#8f9dac', '#3f4a59', '#d3e1ee'],
    lines: ['移动速度 +6%', '格挡几率 +2%'], mod: s => { s.speed *= 1.06; s.block += 0.02; } },
  { id: 'bt_war_drill', cls: 'warrior', tier: 0, slot: 'boots', name: '练兵护履', icon: ['warboots', '#a19078', '#524736', '#ded0ad'],
    lines: ['翻滚冷却 -5%', '生命上限 +半颗心'], mod: s => { s.rollCd *= 0.95; s.maxHp += 1; } },
  { id: 'bt_war_bramble', cls: 'warrior', tier: 1, slot: 'boots', name: '荆棘战靴', icon: ['warboots', '#8fad87', '#455b3b', '#e1f6c8'],
    lines: ['移动速度 +8%', '受伤时对周围敌人造成 0.5 伤害'], mod: s => { s.speed *= 1.08; s.thorns += 0.5; } },
  { id: 'bt_war_rally', cls: 'warrior', tier: 1, slot: 'boots', name: '奋战步靴', icon: ['warboots', '#bb8878', '#613f39', '#f6d8bb'],
    lines: ['翻滚冷却 -9%', '怒气持续时间 +0.6 秒（战士 3 件）'], mod: s => { s.rollCd *= 0.91; s.rageT += 0.6; } },
  { id: 'bt_war_quake', cls: 'warrior', tier: 2, slot: 'boots', name: '踏岳战靴', icon: ['warboots', '#c4a36f', '#6e502e', '#fff0b8'],
    lines: ['翻滚冷却 -12%', '震地半径 +6（战士 5 件）'], mod: s => { s.rollCd *= 0.88; s.quakeR += 6; } },
  { id: 'bt_war_bastion', cls: 'warrior', tier: 2, slot: 'boots', name: '铁垒护履', icon: ['warboots', '#aec2da', '#496181', '#f4fbff'], lock: 55,
    lines: ['格挡几率 +7%', '移动速度 +8%'], mod: s => { s.block += 0.07; s.speed *= 1.08; } },
  { id: 'bt_war_fortress', cls: 'warrior', tier: 3, slot: 'boots', name: '不屈重靴', icon: ['warboots', '#dfc698', '#80673c', '#fffde2'], lock: 110,
    lines: ['每个房间抵挡一次伤害', '移动速度 +10%'], mod: s => { s.shield = true; s.speed *= 1.1; } },
  { id: 'bt_war_storm', cls: 'warrior', tier: 3, slot: 'boots', name: '破军战履', icon: ['warboots', '#d5a3a5', '#6d414f', '#fff2da'],
    lines: ['翻滚冷却 -15%，翻滚后下一击必暴击', '怒气攻速倍率 +10%（战士 3 件）'], mod: s => { s.rollCd *= 0.85; s.rollCrit = true; s.rageSpd *= 1.1; } },

  // Ranger: ice boots remain chapter-exclusive; these provide alternatives in every act.
  { id: 'bt_rng_light', cls: 'ranger', tier: 0, slot: 'boots', name: '轻羽便鞋', icon: ['trailboots', '#9db485', '#485c38', '#e6f5c9'],
    lines: ['移动速度 +8%', '远程射程 +10%'], mod: s => { s.speed *= 1.08; s.rangeMul *= 1.1; } },
  { id: 'bt_rng_ridge', cls: 'ranger', tier: 1, slot: 'boots', name: '山径猎靴', icon: ['trailboots', '#acb896', '#586449', '#f5f6d9'],
    lines: ['移动速度 +10%', '翻滚冷却 -7%'], mod: s => { s.speed *= 1.1; s.rollCd *= 0.93; } },
  { id: 'bt_rng_sentry', cls: 'ranger', tier: 1, slot: 'boots', name: '定风猎履', icon: ['trailboots', '#94bdba', '#446c6c', '#e7ffff'],
    lines: ['强风不再推动你', '暴击率 +2%'], mod: s => { s.windAnchor = true; s.crit += 0.02; } },
  { id: 'bt_rng_moss', cls: 'ranger', tier: 2, slot: 'boots', name: '苔影长靴', icon: ['trailboots', '#8dcc92', '#3b713b', '#e4ffbc'], lock: 55,
    lines: ['免疫中毒与孢子云', '攻击中毒几率 +9%，移动速度 +8%'], mod: s => { s.sporeRes = true; s.poison += 0.09; s.speed *= 1.08; } },
  { id: 'bt_rng_shadow', cls: 'ranger', tier: 2, slot: 'boots', name: '影隙便鞋', icon: ['trailboots', '#acbad6', '#4c5980', '#e8efff'],
    lines: ['翻滚冷却 -12%，翻滚后下一击必暴击', '移动速度 +10%'], mod: s => { s.rollCd *= 0.88; s.rollCrit = true; s.speed *= 1.1; } },
  { id: 'bt_rng_horizon', cls: 'ranger', tier: 3, slot: 'boots', name: '天际行靴', icon: ['trailboots', '#a6dcc1', '#497867', '#ffffdc'],
    lines: ['移动速度 +16%，远程射程 +25%', '远程弹道穿透 +1'], mod: s => { s.speed *= 1.16; s.rangeMul *= 1.25; s.pierce += 1; } },
  { id: 'bt_rng_falcon', cls: 'ranger', tier: 3, slot: 'boots', name: '隼王猎履', icon: ['trailboots', '#dddfa7', '#738044', '#ffffff'], lock: 115,
    lines: ['翻滚冷却 -19%', '暴击率 +6%'], mod: s => { s.rollCd *= 0.81; s.crit += 0.06; } },

  // Mage: elemental paths and hazard traversal, using existing resistance mechanics.
  { id: 'bt_mag_rune', cls: 'mage', tier: 0, slot: 'boots', name: '符纹软履', icon: ['runeboots', '#8795c5', '#3f4f7c', '#dce8ff'],
    lines: ['翻滚冷却 -5%', '元素与爆炸触发倍率 +5%'], mod: s => { s.rollCd *= 0.95; s.procMul *= 1.05; } },
  { id: 'bt_mag_cinder', cls: 'mage', tier: 0, slot: 'boots', name: '余火便鞋', icon: ['runeboots', '#ba8b8c', '#674c58', '#ffd9c4'],
    lines: ['移动速度 +6%', '攻击点燃几率 +4%'], mod: s => { s.speed *= 1.06; s.burn += 0.04; } },
  { id: 'bt_mag_glacier', cls: 'mage', tier: 1, slot: 'boots', name: '冰纹法靴', icon: ['runeboots', '#a5c6e1', '#52728f', '#efffff'],
    lines: ['寒冷积累 -25%', '攻击冻结几率 +4%'], mod: s => { s.coldRes *= 0.75; s.freeze += 0.04; } },
  { id: 'bt_mag_arcane', cls: 'mage', tier: 1, slot: 'boots', name: '闪光软靴', icon: ['runeboots', '#c2b18d', '#6e5a72', '#fff2cb'],
    lines: ['翻滚冷却 -9%', '攻击连锁闪电几率 +5%'], mod: s => { s.rollCd *= 0.91; s.chain += 0.05; } },
  { id: 'bt_mag_null', cls: 'mage', tier: 2, slot: 'boots', name: '踏空法履', icon: ['runeboots', '#b4a4d7', '#574578', '#f4e5ff'], lock: 55,
    lines: ['虚空裂缝不再吞噬你', '移动速度 +10%'], mod: s => { s.voidStep = true; s.speed *= 1.1; } },
  { id: 'bt_mag_ember', cls: 'mage', tier: 2, slot: 'boots', name: '焰行法靴', icon: ['runeboots', '#e2a38f', '#7c453d', '#ffe8b9'],
    lines: ['免疫熔岩与火焰伤害', '攻击点燃几率 +9%'], mod: s => { s.fireImm = true; s.burn += 0.09; } },
  { id: 'bt_mag_nova', cls: 'mage', tier: 3, slot: 'boots', name: '新星法履', icon: ['runeboots', '#cdc0ee', '#72568f', '#fff9ff'], lock: 110,
    lines: ['移动速度 +10%，元素与爆炸触发倍率 +9%', '奥术新星冷却 -0.7 秒（法师 5 件）'], mod: s => { s.speed *= 1.1; s.procMul *= 1.09; s.novaCd -= 0.7; } },
  { id: 'bt_mag_phase', cls: 'mage', tier: 3, slot: 'boots', name: '相位软靴', icon: ['runeboots', '#b1d6e6', '#4f7186', '#ffffff'],
    lines: ['闪避结束并恢复攻击后释放裂隙', '格挡几率 +6%，翻滚冷却 -12%'], mod: s => { s.riftDash = true; s.block += 0.06; s.rollCd *= 0.88; } },

  // Cleric: mobile healing, holy shielding and resistance for rescue builds.
  { id: 'bt_clr_pilgrim', cls: 'cleric', tier: 0, slot: 'boots', name: '朝圣布靴', icon: ['holyboots', '#beb699', '#675f43', '#f1e9c6'],
    lines: ['移动速度 +8%', '生命上限 +半颗心'], mod: s => { s.speed *= 1.08; s.maxHp += 1; } },
  { id: 'bt_clr_white', cls: 'cleric', tier: 0, slot: 'boots', name: '素祷软履', icon: ['holyboots', '#c3cacc', '#646e77', '#f3faff'],
    lines: ['翻滚冷却 -6%', '格挡几率 +2%'], mod: s => { s.rollCd *= 0.94; s.block += 0.02; } },
  { id: 'bt_clr_mercy', cls: 'cleric', tier: 1, slot: 'boots', name: '慈行圣履', icon: ['holyboots', '#d6c6a2', '#83714d', '#fff3d4'],
    lines: ['移动速度 +8%', '治疗量 +半颗心'], mod: s => { s.speed *= 1.08; s.healBonus += 1; } },
  { id: 'bt_clr_watch', cls: 'cleric', tier: 1, slot: 'boots', name: '守夜短靴', icon: ['holyboots', '#b2c0d3', '#55647e', '#eef6ff'],
    lines: ['翻滚冷却 -9%', '圣光弹命中时 1.5% 回复半颗心'], mod: s => { s.rollCd *= 0.91; s.holyHeal += 0.015; } },
  { id: 'bt_clr_sanctuary', cls: 'cleric', tier: 2, slot: 'boots', name: '圣所长靴', icon: ['holyboots', '#d7dcbd', '#778059', '#ffffff'],
    lines: ['圣盾上限 +1（牧师 3 件）', '移动速度 +10%'], mod: s => { s.shieldCap += 1; s.speed *= 1.1; } },
  { id: 'bt_clr_purify', cls: 'cleric', tier: 2, slot: 'boots', name: '净化圣履', icon: ['holyboots', '#b1d6c3', '#517466', '#e9fff5'], lock: 55,
    lines: ['免疫中毒与孢子云', '生命上限 +1'], mod: s => { s.sporeRes = true; s.maxHp += 2; } },
  { id: 'bt_clr_daybreak', cls: 'cleric', tier: 3, slot: 'boots', name: '晨祷法靴', icon: ['holyboots', '#efddb4', '#a08352', '#ffffff'],
    lines: ['每 10 秒回复半颗心', '移动速度 +10%，翻滚冷却 -6%'], mod: s => { s.regen = s.regen ? Math.min(s.regen, 10) : 10; s.speed *= 1.1; s.rollCd *= 0.94; } },
  { id: 'bt_clr_oath', cls: 'cleric', tier: 3, slot: 'boots', name: '圣约步履', icon: ['holyboots', '#eee5cc', '#938562', '#fffad9'], lock: 110,
    lines: ['每个房间抵挡一次伤害', '治疗量 +半颗心，翻滚冷却 -9%'], mod: s => { s.shield = true; s.healBonus += 1; s.rollCd *= 0.91; } },

  // Bard: leather boots retain their identity; new footwear supports rhythm and finales.
  { id: 'bt_brd_linen', cls: 'bard', tier: 0, slot: 'boots', name: '绸边舞鞋', icon: ['danceboots', '#ba9aa4', '#664650', '#edd0d6'],
    lines: ['翻滚冷却 -5%', '攻击速度 +3%'], mod: s => { s.rollCd *= 0.95; s.atkSpd *= 1.03; } },
  { id: 'bt_brd_rhythm', cls: 'bard', tier: 1, slot: 'boots', name: '轻拍舞靴', icon: ['danceboots', '#d1a599', '#7b514e', '#ffe4d0'],
    lines: ['移动速度 +8%', '命中灵感积累 +15%（吟游 3 件）'], mod: s => { s.speed *= 1.08; s.insGain *= 1.15; } },
  { id: 'bt_brd_duet', cls: 'bard', tier: 1, slot: 'boots', name: '和声软履', icon: ['danceboots', '#b5a4cc', '#64517d', '#efdfff'],
    lines: ['翻滚冷却 -9%', '灵感上限 +1（吟游 3 件）'], mod: s => { s.rollCd *= 0.91; s.insCap += 1; } },
  { id: 'bt_brd_dancer', cls: 'bard', tier: 2, slot: 'boots', name: '旋舞高靴', icon: ['danceboots', '#d895b6', '#824462', '#ffe6ef'], lock: 55,
    lines: ['翻滚冷却 -15%', '移动速度 +10%'], mod: s => { s.rollCd *= 0.85; s.speed *= 1.1; } },
  { id: 'bt_brd_tempo', cls: 'bard', tier: 2, slot: 'boots', name: '疾奏舞鞋', icon: ['danceboots', '#cab18c', '#765b48', '#fff2d8'],
    lines: ['攻击速度 +6%', '每层灵感效果 +0.6%（吟游 3 件）'], mod: s => { s.atkSpd *= 1.06; s.insPer += 0.006; } },
  { id: 'bt_brd_finale', cls: 'bard', tier: 3, slot: 'boots', name: '终章舞履', icon: ['danceboots', '#e7b9d0', '#895b76', '#fff8e0'], lock: 110,
    lines: ['移动速度 +10%', '命中灵感积累 +30%（吟游 3 件）', '终章伤害 +25%（吟游 5 件）'], mod: s => { s.speed *= 1.1; s.insGain *= 1.3; s.finaleMul *= 1.25; } },
  { id: 'bt_brd_ovation', cls: 'bard', tier: 3, slot: 'boots', name: '谢幕礼靴', icon: ['danceboots', '#dfc8a0', '#8b6e57', '#fff7f0'],
    lines: ['移动速度 +10%，格挡几率 +7%', '击杀获得 1 层灵感（吟游 3 件）'], mod: s => { s.speed *= 1.1; s.block += 0.07; s.insKill += 1; } },

  // Summoner: positioning for companions and a later ghost legion path.
  { id: 'bt_sum_tether', cls: 'summoner', tier: 0, slot: 'boots', name: '牵灵草履', icon: ['spiritboots', '#a39bb6', '#544b6b', '#e0d5f7'],
    lines: ['移动速度 +6%', '拾取范围 +40%'], mod: s => { s.speed *= 1.06; s.magnet *= 1.4; } },
  { id: 'bt_sum_wander', cls: 'summoner', tier: 0, slot: 'boots', name: '游魂软鞋', icon: ['spiritboots', '#a1b3bd', '#4e606d', '#ddecff'],
    lines: ['格挡几率 +2%', '召唤物攻击速度 +8%'], mod: s => { s.block += 0.02; s.minionSpd *= 1.08; } },
  { id: 'bt_sum_bond', cls: 'summoner', tier: 1, slot: 'boots', name: '契灵步靴', icon: ['spiritboots', '#b9a0c8', '#654d79', '#f2e0ff'],
    lines: ['翻滚冷却 -9%', '召唤物伤害 +6%'], mod: s => { s.rollCd *= 0.91; s.minionDmg *= 1.06; } },
  { id: 'bt_sum_keeper', cls: 'summoner', tier: 1, slot: 'boots', name: '冰灵软履', icon: ['spiritboots', '#a6c8d5', '#4e7385', '#efffff'],
    lines: ['移动速度 +8%', '召唤物攻击冻结几率 +10%'], mod: s => { s.speed *= 1.08; s.minionFreeze += 0.1; } },
  { id: 'bt_sum_marsh', cls: 'summoner', tier: 2, slot: 'boots', name: '沼灵长靴', icon: ['spiritboots', '#96bd9b', '#446849', '#e8ffcd'],
    lines: ['毒水与潮水不再减速', '召唤物攻击中毒几率 +10%'], mod: s => { s.bogRes = true; s.tideRes = true; s.minionPoison += 0.1; } },
  { id: 'bt_sum_coldwisp', cls: 'summoner', tier: 2, slot: 'boots', name: '霜魂法履', icon: ['spiritboots', '#b5bce6', '#5a5c91', '#f2f4ff'], lock: 55,
    lines: ['移动速度 +8%', '召唤物攻击冻结几率 +15%'], mod: s => { s.speed *= 1.08; s.minionFreeze += 0.15; } },
  { id: 'bt_sum_procession', cls: 'summoner', tier: 3, slot: 'boots', name: '幽行步履', icon: ['spiritboots', '#c5b7dc', '#6d5887', '#fff5ff'],
    lines: ['翻滚冷却 -9%', '击杀召幽魂几率 +10%、寿命 +2 秒（召唤 5 件）'], mod: s => { s.rollCd *= 0.91; s.ghostP += 0.1; s.ghostT += 2; } },
  { id: 'bt_sum_parade', cls: 'summoner', tier: 3, slot: 'boots', name: '万灵行靴', icon: ['spiritboots', '#cadfc7', '#718462', '#fff9df'], lock: 115,
    lines: ['召唤物 +1', '移动速度 +10%，翻滚冷却 -9%'], mod: s => { s.minions += 1; s.speed *= 1.1; s.rollCd *= 0.91; } },
];

for (const item of BOOT_ROSTER) {
  if (ITEM_BY_ID[item.id]) continue;
  ITEMS.push(item); ITEM_BY_ID[item.id] = item;
}
