'use strict';
// ============================================================ 全局配置 + 难度表（纯数据，方便直接改数值）
// 改完刷新浏览器即可生效。这里的值也可以在「数值表.xlsx」的「全局」「难度」表里改（表里改过的值会覆盖这里）。

// ---------------------------------------------------------------- 全局
const CONFIG = {
  floorsPerRegion: 3,          // 每个区域的层数（最后一层末尾是首领房）
  enemyHpPerFloor: 0.2,        // 普通敌人：一局内每深入一层血量 +20%
  eliteHpPerFloor: 0.1,        // 精英：每层 +10%
  enemySpeedPerFloor: 0.06,    // 敌人行动速度：每层 +6%
  enemyHpPerAct: 0.12,         // 每往后一幕，敌人基础血量 +12%（每局都从零开始，所以幕间增幅要克制）
  bossHpPerAct: 0.15,          // 首领基础血量每幕 +15%
  defensePointValue: 0.025,   // 每点防御抵扣的伤害（1 点伤害 = 半颗心）
  defenseMaxReduction: 0.4,   // 防御最多抵扣本次伤害的 40%，重击仍需闪避
  meleeDefense: 4,            // 持近战武器额外防御，覆盖所有职业的近战武器
  enemyDamagePerAct: 0.04,    // 敌人每往后一幕伤害 +4%，第六幕 +20%
  enemyDamagePerDifficulty: 0.1, // 困难/极难敌伤分别 +10%/+20%，与幕倍率相乘
  heartDrop: 0.06,             // 普通敌人掉心几率（精英必掉）
  bossEnrage: 0.5,             // 首领血量低于这个比例进入狂暴
  catchUpChests: 2,            // 从后面的区域出征时，每跳过一个区域补给的宝箱数
  winSoulBonus: 30,            // 通关一幕额外魂晶
  // 测试用：读档时把进度直接开到第 N 幕（前面的幕视为普通难度已通关）。1 = 关闭。
  // 只会增加进度、不会回退；改回 1 不会收回已经开启的进度。公开发布前记得改回 1。
  devUnlockAct: 1,
  // 掉落：先抽职业再抽装备（每个职业概率相同，中立装备也算一组）；
  // 有这么大的几率改为掉你身上件数最多的那个职业，方便凑套装
  classBias: 0.35,
  // 趣味房（垂钓池 / 温泉 / 小动物）：每层最多一间，第 2 幕起出现，收益都刻意做得很小
  funRoomChance: 0.65,         // 每层出现趣味房的几率
  funPondCasts: 2,             // 垂钓池每层的抛竿次数（避免靠钓鱼无限回血）
  funPetPickup: 1.35,          // 小动物带来的拾取范围倍率
  linkMaxSegs: 2,              // 沙虫等「分段传伤」的敌人：同一次攻击最多按几节体节结算（出土重叠时防叠加）
};

// ---------------------------------------------------------------- 难度
// hp/speed/budget: 敌人血量、行动速度、每房刷怪预算的倍率
// elite: 普通战斗房额外刷一只精英的几率；bossElite: 首领房是否带一只精英
// enrage: 首领狂暴阈值（覆盖全局 bossEnrage）；heart: 掉心几率倍率；fountain: 泉水回复比例
// souls: 魂晶收益倍率；chestMin: 宝箱最低品质（0 普通 1 稀有 2 史诗）；luck: 宝箱升阶几率加成
const DIFFS = [
  { id: 'normal', name: '普通', col: '#82e68c', hp: 1.0, speed: 1.0,  budget: 1.0,  elite: 0,    bossElite: false, enrage: 0.5, heart: 1.0,  fountain: 1.0, souls: 1.0, chestMin: 0, luck: 0 },
  { id: 'hard',   name: '困难', col: '#ffb040', hp: 1.5, speed: 1.15, budget: 1.25, elite: 0.15, bossElite: false, enrage: 0.6, heart: 0.67, fountain: 1.0, souls: 1.6, chestMin: 1, luck: 0 },
  { id: 'nightmare', name: '极难', col: '#ff4058', hp: 2.2, speed: 1.3, budget: 1.5, elite: 0.3, bossElite: true, enrage: 0.7, heart: 0.34, fountain: 0.5, souls: 2.5, chestMin: 1, luck: 0.1 },
];
