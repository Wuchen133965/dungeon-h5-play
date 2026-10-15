'use strict';
// Permanent town cosmetics. Ownership only unlocks the choice; exactly one outfit grants its small bonus.
const COSTUMES = [
  {"id": "adventurer", "name": "原初旅装", "tier": "初始", "cost": 0, "col": "#8ab4ee", "effect": "无额外属性", "desc": ["熟悉的钢盔与蓝衣。", "展示实际穿戴的装备。"]},
  {"id": "ember", "name": "赤焰卫士", "tier": "基础", "cost": 500, "col": "#f08a77", "effect": "攻击力 +2%", "stat": "dmg", "bonus": 0.02, "desc": ["赤羽钢盔，红金战衣。", "炽热配色与金边肩饰。"]},
  {"id": "tide", "name": "冰晶术士", "tier": "高级", "cost": 1000, "col": "#9ad5f0", "effect": "攻击速度 +2%", "stat": "atkSpd", "bonus": 0.02, "desc": ["霜蓝兜帽，月白袍边。", "兜帽轮廓与原图一致。"]},
  {"id": "grove", "name": "森角行者", "tier": "基础", "cost": 500, "col": "#8ad6a4", "effect": "移动速度 +2%", "stat": "speed", "bonus": 0.02, "desc": ["鹿角头饰，绿叶披衣。", "自然纹理与木枝装饰。"]},
  {"id": "ninja", "name": "赤影忍者", "tier": "基础", "cost": 500, "col": "#eb7087", "effect": "闪避冷却 -2%", "stat": "rollCd", "bonus": -0.02, "desc": ["黑色忍衣，赤红围巾。", "长围巾垂在肩后。"]},
  {"id": "ranger", "name": "荒野猎手", "tier": "基础", "cost": 500, "col": "#dcad69", "effect": "弹道射程 +2%", "stat": "rangeMul", "bonus": 0.02, "desc": ["宽檐猎帽，棕色皮甲。", "腰带与猎装细节保留。"]},
  {"id": "plague", "name": "鸦面医者", "tier": "高级", "cost": 1000, "col": "#a5c18a", "effect": "持续伤害 +2%", "stat": "dotMul", "bonus": 0.02, "desc": ["黑色礼帽，银白鸟喙。", "墨黑长衣配翠绿徽饰。"]},
  {"id": "pirate", "name": "黑帆船长", "tier": "基础", "cost": 500, "col": "#ecbe76", "effect": "金币收益 +3%", "stat": "goldMul", "bonus": 0.03, "desc": ["骷髅船帽，红金长衣。", "三角帽与衣襟完整保留。"]},
  {"id": "royal", "name": "雷霆武士", "tier": "顶级", "cost": 2000, "col": "#e6c174", "effect": "金币收益 +3%", "stat": "goldMul", "bonus": 0.03, "desc": ["金角兜盔，蓝金重铠。", "肩铠与金色角饰醒目。"]},
  {"id": "beekeeper", "name": "蜂巢守卫", "tier": "基础", "cost": 500, "col": "#efdca5", "effect": "拾取范围 +3%", "stat": "magnet", "bonus": 0.03, "desc": ["米白护帽，蜂巢服饰。", "护帽与罩面边框保留。"]},
  {"id": "cyber", "name": "霓光潜行", "tier": "高级", "cost": 1000, "col": "#75e5e5", "effect": "攻击速度 +2%", "stat": "atkSpd", "bonus": 0.02, "desc": ["黑色兜帽，青光面甲。", "青色光纹贯穿全身。"]},
  {"id": "demon", "name": "熔岩魔铠", "tier": "顶级", "cost": 2000, "col": "#ff9552", "effect": "攻击力 +2%", "stat": "dmg", "bonus": 0.02, "desc": ["赤焰双角，熔岩裂纹。", "深黑战甲映出橙红光。"]},
  {"id": "radiant", "name": "圣辉贤者", "tier": "顶级", "cost": 2000, "col": "#ffe197", "effect": "持续伤害 +2%", "stat": "dotMul", "bonus": 0.02, "desc": ["金色光冠，蓝白圣衣。", "金纹与光冠细节保留。"]},
  {"id": "mushroom", "name": "菌帽旅人", "tier": "基础", "cost": 500, "col": "#ee8d8f", "effect": "金币收益 +3%", "stat": "goldMul", "bonus": 0.03, "desc": ["红白菌帽，林地旅装。", "大菌帽与背带保留。"]},
  {"id": "engineer", "name": "蒸汽工匠", "tier": "高级", "cost": 1000, "col": "#83cdeb", "effect": "攻击速度 +2%", "stat": "atkSpd", "bonus": 0.02, "desc": ["铜色风镜，蓝色工装。", "镜片、围裙与工具扣。"]},
  {"id": "cat", "name": "白夜猫卫", "tier": "基础", "cost": 500, "col": "#eea4c2", "effect": "移动速度 +2%", "stat": "speed", "bonus": 0.02, "desc": ["白色猫耳，金铃颈饰。", "猫耳与长尾完整保留。"]},
  {"id": "shaman", "name": "鹿骨祭司", "tier": "高级", "cost": 1000, "col": "#adcf82", "effect": "召唤物伤害 +2%", "stat": "minionDmg", "bonus": 0.02, "desc": ["鹿骨面饰，青绿祭衣。", "骨角与叶片纹理保留。"]},
  {"id": "shadow", "name": "暮影刺客", "tier": "高级", "cost": 1000, "col": "#b490ef", "effect": "移动速度 +2%", "stat": "speed", "bonus": 0.02, "desc": ["暗色兜帽，紫色围巾。", "披巾与窄身轻甲。"]},
  {"id": "paladin", "name": "誓约圣卫", "tier": "顶级", "cost": 2000, "col": "#e4c57a", "effect": "攻击力 +2%", "stat": "dmg", "bonus": 0.02, "desc": ["赤羽金盔，蓝金圣铠。", "盾徽与肩甲细节保留。"]},
  {"id": "dragon", "name": "赤龙统领", "tier": "顶级", "cost": 2000, "col": "#e77563", "effect": "攻击力 +2%", "stat": "dmg", "bonus": 0.02, "desc": ["赤龙肩饰，暗红龙翼。", "龙首与翼形轮廓保留。"]},
  {"id": "diver", "name": "深海行者", "tier": "高级", "cost": 1000, "col": "#84d2e7", "effect": "移动速度 +2%", "stat": "speed", "bonus": 0.02, "desc": ["铜色潜盔，海蓝视窗。", "圆形铜盔与绿色潜衣。"]},
  { id: 'violetStar', name: '紫曜星卫', tier: '史诗', cost: null, source: 'signin', col: '#bd8aff', effect: '移动速度 +2%', stat: 'speed', bonus: .02,
    desc: ['紫晶冠饰，银边星纹战铠。', '签到终极奖励，无法购买。'] },
];
const COSTUME_BY_ID = Object.fromEntries(COSTUMES.map(c => [c.id, c]));
function normalizeCostumes(meta = META) {
  const raw = metaObject(meta.costumes) ? meta.costumes : {};
  const owned = ['adventurer', ...(Array.isArray(raw.owned) ? raw.owned.filter(id => typeof id === 'string' && Object.hasOwn(COSTUME_BY_ID, id)) : [])];
  meta.costumes = { owned: [...new Set(owned)], equipped: owned.includes(raw.equipped) ? raw.equipped : 'adventurer' };
  return meta.costumes;
}
function costumeState(meta = META) { return meta.costumes || normalizeCostumes(meta); }
function wornCostume(meta = META) {
  const state = costumeState(meta);
  return state.owned.includes(state.equipped) && Object.hasOwn(COSTUME_BY_ID, state.equipped) ? COSTUME_BY_ID[state.equipped] : COSTUMES[0];
}
function applyCostumeStats(stats, id) {
  const costume = Object.hasOwn(COSTUME_BY_ID, id) ? COSTUME_BY_ID[id] : COSTUMES[0];
  if (costume.stat) stats[costume.stat] *= 1 + costume.bonus;
}
function wearCostume(id) {
  if (G.mode !== 'town' || TOWN.launch || !Object.hasOwn(COSTUME_BY_ID, id) || id !== 'adventurer' && !COSTUME_ART.ready || !metaSaveReady()) return false;
  const state = costumeState(), costume = COSTUME_BY_ID[id];
  if (state.equipped === id) return false;
  if (!state.owned.includes(id)) {
    if (costume.source === 'signin') return false;
    if (META.souls < costume.cost) return false;
    META.souls -= costume.cost; state.owned.push(id);
  }
  state.equipped = id; recalcStats(); saveMeta();
  // A changed outfit is part of combat preparation and invalidates the old ready confirmation.
  if (typeof coopPublishProfile === 'function') coopPublishProfile();
  return true;
}

// The reference cutouts are baked at boot by costume-art.js.
const COSTUME_FRAMES = {};
// Display labels follow the art height without changing collision boxes or combat aim points.
function heroVisualHeight(p) { return (Object.hasOwn(COSTUME_FRAMES, p.costume) ? COSTUME_FRAMES[p.costume][0].h : p.h || 14) * (p.scale || 1); }
SPR.stylist = makeSprite([
  '....ooooo.....', '...ohhhhho....', '...oHhhhho....', '...ohsssso....', '...oeseseo....', '...ossssso....',
  '..opppPppo....', '..opypPppo....', '.ospyppPpso...', '..opYppPpoyyo.', '..opypPpoyoyo.', '..opppPpo.yy..',
  '..opppPPo.....', '...opppo......', '...ob.bo......', '..ooo.ooo.....',
], { o: '#1a1018', h: '#50374e', H: '#ae7590', s: '#ecc3a4', e: '#282032', p: '#b579a9', P: '#68456f', y: '#ffe2a0', Y: '#eec17a', b: '#423047' });
SPR.wardrobe = makeSprite([
  '..oooooooooooo..', '..obbbbbbbbbbo..', '..obBBBBBBBBbo..', '..obByyyByyybo..', '..obBgBgBpBpbo..', '..obBgBgBpPpbo..',
  '..obBgggBpppbo..', '..obBgggBpppbo..', '..obBGgGBPyPbo..', '..obBBBBBBBBbo..', '..obbbbbbbbbbo..', '...oo......oo...',
], { o: '#241a28', b: '#654635', B: '#302638', g: '#58a383', G: '#346455', p: '#9c73b5', P: '#694579', y: '#f0cf86' });
Object.assign(TOWN_MENUS, { costume: { title: '时装师 薇绮 · 织梦坊', col: '#d6bc91', talk: ['挑一身喜欢的战装，陪你去冒险。', '魂晶解锁一次，以后随时来换装。'] } });
TOWN.sel.costume = 0;
function costumePage(delta) {
  const pages = Math.ceil(COSTUMES.length / 5), page = Math.floor(serviceIndex('costume', COSTUMES.length) / 5);
  TOWN.sel.costume = ((page + delta + pages) % pages) * 5; SFX.move();
}
const MENU_COSTUME = {
  nav(vx, vy) { if (vx) costumePage(vx); else serviceNav('costume', COSTUMES.length, 0, vy); },
  wheel(e) { forgeUIWheel('costume', COSTUMES.length, e); },
  ok() {
    const c = COSTUMES[serviceIndex('costume', COSTUMES.length)], owned = costumeState().owned.includes(c.id);
    serviceResult(wearCostume(c.id), owned ? `已穿戴 ${c.name}` : `已解锁并穿戴 ${c.name}`, c.source === 'signin' && !owned ? '到补给官处累计签到 7 天领取' : META.souls < c.cost && !owned ? '魂晶不足，可先预览外观' : COSTUME_ART.error || '已穿戴这套时装');
  },
  draw(k) {
    serviceFrame('costume', k);
    const sel = serviceIndex('costume', COSTUMES.length), c = COSTUMES[sel], state = costumeState(), owned = state.owned.includes(c.id), wearing = state.equipped === c.id;
    const first = Math.floor(sel / 5) * 5;
    COSTUMES.slice(first, first + 5).forEach((item, row) => serviceRow('costume', first + row, 43 + row * 19, item.name,
      state.equipped === item.id ? '正在穿戴' : state.owned.includes(item.id) ? `${item.tier} · 已解锁` : item.source === 'signin' ? '史诗 · 签到限定' : `${item.tier} · ${item.cost} 魂晶`, item.col, first + row === sel));
    forgeUIPage('costume', COSTUMES.length, 5, 143);
    panel(134, 43, 308, 133, '#1a1220', c.col, 1);
    T(c.name, 143, 53, 6.5, c.col, 'left');
    T(c.tier + '时装', 299, 53, 4.5, c.col, 'right');
    panel(142, 64, 191, 117, '#231b2d', '#4c3d5a', 1);
    const sprite = costumePreview(c.id);
    const scale = Math.min(3, 43 / sprite.w, 44 / sprite.h);
    bigIcon(sprite, 166.5 - sprite.w * scale / 2, 109 - sprite.h * scale, scale);
    T(c.effect, 199, 73, 5.4, '#ffe5b0', 'left');
    c.desc.forEach((line, i) => T(line, 199, 88 + i * 8, 4.5, '#c4b6cb', 'left'));
    T(wearing ? '已穿戴 · 加成生效' : owned ? '试穿预览 · 尚未穿戴' : '试穿预览 · 尚未解锁', 142, 125, 4.7, wearing ? '#82e68c' : '#a096aa', 'left');
    T('仅穿戴加成 · 武器按实际装备', 142, 135, 4.3, '#c4b6cb', 'left');
    button(142, 143, 300, 156, wearing ? '正在穿戴' : owned ? '穿戴这套时装' : c.source === 'signin' ? '签到累计 7 天解锁' : `解锁并穿戴 · ${c.cost} 魂晶`, !wearing && !COSTUME_ART.error && (owned || c.source !== 'signin' && META.souls >= c.cost), c.col);
    toast(160, 160); hints([['上下/滚轮', '选择'], ['左右', '翻页'], ['E', '穿戴'], ['Esc', '离开']]);
  },
};
TOWN_MENU_UI.costume = MENU_COSTUME;
