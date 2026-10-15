'use strict';
// Presentation-only quest snapshots. Reading the tracker never advances or saves the journal.
const QUEST_TRACK_TOWN = {
  guild: { menu: 'guild', label: '莉娅 · 西侧公会' },
  mentor: { menu: 'talent', label: '艾琳 · 西北导师帐篷' },
  smith: { menu: 'armory', label: '布洛克 · 东北工坊' },
  quartermaster: { menu: 'quartermaster', label: '雷恩 · 东侧军需所' },
  cook: { menu: 'cook', label: '米洛 · 西南炊事营' },
  archivist: { menu: 'archivist', label: '诺拉 · 东南档案馆' },
  board: { menu: 'board', label: '告示板 · 西侧公会门前' },
  stele: { menu: 'stele', label: '英灵碑 · 东南档案区' },
  portal: { menu: 'portal', label: '出征法阵 · 镇中央广场' },
};
const QUEST_TRACK_ROOMS = { combat: '战斗房', stairs: '出口房', boss: '首领房', challenge: '挑战房',
  treasure: '宝物房', shop: '旅行商店', shrine: '属性神殿', fountain: '生命之泉', altar: '生命祭坛' };
function questTrackedTownRoute(id, detail) {
  const place = QUEST_TRACK_TOWN[id] || QUEST_TRACK_TOWN.guild;
  const prop = typeof TOWN_PROPS !== 'undefined' && TOWN_PROPS.find(o => o.menu === place.menu);
  const point = id === 'portal' && typeof PORTAL !== 'undefined' ? { x: PORTAL.x, y: PORTAL.y } :
    prop ? { x: prop.x, y: prop.y + 6 } : undefined;
  return { kind: 'town', menu: place.menu, label: place.label, detail, ...(point ? { point } : {}) };
}
function questTrackedActName(a) {
  const act = typeof ACTS !== 'undefined' && ACTS.find(item => item.id === a);
  return act ? `第 ${a} 幕 ${act.name}` : `第 ${a} 幕`;
}
function questTrackedDiffName(d) {
  return typeof DIFFS !== 'undefined' && DIFFS[d] ? DIFFS[d].name : `难度 ${d + 1}`;
}
function questTrackedUnlockHint(match, hard) {
  // actOpen/diffOpen/regionOpen call actProg, which rewrites META.prog even for reads.
  // Use their normalized-save rules directly so a HUD refresh preserves every state reference.
  const all = typeof ACTS !== 'undefined' ? ACTS : [], prog = META.prog || {};
  const isOpen = a => prog[a] ? !!prog[a].open : a === 1;
  const region = (a, d) => {
    const p = prog[a], saved = p && Array.isArray(p.diff) && p.diff[d];
    return saved ? questCount(saved.reg) : d === 0 && isOpen(a) ? 1 : 0;
  };
  if (Number.isFinite(match.act)) {
    const a = match.act;
    if (!isOpen(a)) return `尚未开放：先完整通关${questTrackedActName(Math.max(1, a - 1))}的普通难度。`;
    const d = Number.isFinite(match.diff) ? match.diff : hard ? 1 : 0;
    if (!region(a, d)) return `难度未开放：先完整通关${questTrackedActName(a)}的${questTrackedDiffName(Math.max(0, d - 1))}难度。`;
    if (Number.isFinite(match.chapter) && region(a, d) < match.chapter) {
      const act = all.find(item => item.id === a), previous = act && act.regions[match.chapter - 2];
      return `区域未开放：先在${questTrackedDiffName(d)}难度击败${previous ? previous.name : `第 ${match.chapter - 1} 区域`}首领。`;
    }
  } else if (hard || Number.isFinite(match.diff) && match.diff > 0) {
    const d = Number.isFinite(match.diff) ? match.diff : 1;
    if (!all.some(a => isOpen(a.id) && region(a.id, d)))
      return `难度未开放：先完整通关任意一幕的${questTrackedDiffName(Math.max(0, d - 1))}难度。`;
  }
  return '';
}
function questTrackedDungeonRoute(step) {
  const match = step.match || {}, event = step.event, hard = event === 'hardwin';
  const location = [Number.isFinite(match.act) ? questTrackedActName(match.act) : '任意已开放地牢'];
  if (Number.isFinite(match.chapter)) {
    const act = Number.isFinite(match.act) && typeof ACTS !== 'undefined' && ACTS.find(a => a.id === match.act);
    const region = act && act.regions[match.chapter - 1];
    location.push(region ? region.name : `第 ${match.chapter} 区域`);
  }
  if (Number.isFinite(match.floor)) location.push(`第 ${match.floor} 层`);
  if (Number.isFinite(match.diff)) location.push(`${questTrackedDiffName(match.diff)}难度`);
  else if (hard) location.push('困难或更高难度');
  const roomType = match.type || (event === 'heal' && match.source === 'fountain' ? 'fountain' : event === 'altar' ? 'altar' : undefined);
  if (roomType) location.push(QUEST_TRACK_ROOMS[roomType] || roomType);
  const actions = {
    kill: '击败地牢敌人；营地训练木桩不计入。',
    clear: '清完战斗房的全部敌人和波次后计入。',
    chest: '打开地牢中尚未开启的宝箱后计入。',
    boss: `击败区域首领；首领位于每个区域的第 ${typeof CONFIG !== 'undefined' && CONFIG.floorsPerRegion || 3} 层。`,
    win: '走完这一幕的所有区域，击败最终首领并离开地牢完成通关。',
    hardwin: '在困难或更高难度走完一幕所有区域，击败最终首领并离开地牢。',
    visit: `通过地牢地图寻找${QUEST_TRACK_ROOMS[roomType] || '目标房间'}；首次进入房间才计入，重复进入同一房间不计入。`,
    heal: '受伤后使用生命之泉并实际恢复生命；满生命时使用不计入。',
    altar: '在生命祭坛确认支付生命并完成交换后计入。',
    goldspend: '在旅行商店购买装备或属性神殿升级，实际花费的金币累计计入；取消不计入。',
    discover: step.type === 'owned' ? '已有图鉴记录自动计入；在地牢获得尚未记录的装备可增加记录。' :
      '在地牢获得或出售尚未记录的装备后计入；图鉴全收集时可直接核对。',
  };
  const gate = questTrackedUnlockHint(match, hard);
  const detail = [gate, '从镇中央的出征法阵选择目的地。', actions[event] || step.label].filter(Boolean).join(' ');
  const route = { kind: 'dungeon', label: location.join(' · '), detail };
  for (const key of ['act', 'chapter', 'floor', 'diff']) if (Number.isFinite(match[key])) route[key] = match[key];
  if (roomType) route.roomType = roomType;
  return route;
}
function questTrackedStepRoute(step) {
  if (step.type === 'dialogue') return questTrackedTownRoute(step.npc, '靠近后按 E 对话，读完并确认本段任务剧情。');
  if (step.event === 'inspect') return questTrackedTownRoute(step.target, '靠近后按 E 调查，读完并确认调查内容；只查看普通服务不会完成调查。');
  const match = step.match || {};
  if (step.event === 'meal') {
    const meal = typeof CAMP_MEALS !== 'undefined' && CAMP_MEALS.find(m => m.id === match.id);
    return questTrackedTownRoute('cook', `按 E 打开餐食服务，预订${meal ? meal.name : '一份出征餐'}；取消预订不计入。`);
  }
  if (step.event === 'starter') {
    const item = typeof ITEM_BY_ID !== 'undefined' && ITEM_BY_ID[match.id];
    return questTrackedTownRoute('quartermaster', `按 E 打开军需服务，确认选择${item ? item.name : '初始武器'}。`);
  }
  if (step.event === 'practice') {
    const item = typeof ITEM_BY_ID !== 'undefined' && ITEM_BY_ID[match.id];
    const wrong = match.id && (!G.eq || !G.eq.weapon || G.eq.weapon.id !== match.id);
    const weapon = item ? item.name : match.id || '当前武器';
    const detail = `${wrong ? `先到东侧军需所找雷恩选择${weapon}，再到木桩旁。` : ''}使用${weapon}，鼠标左键命中训练木桩；只计算实际命中。`;
    if (wrong) return questTrackedTownRoute('quartermaster', detail);
    return { kind: 'town', label: '训练木桩 · 西北训练场', detail,
      ...(typeof TRAINING !== 'undefined' ? { point: { x: TRAINING.x, y: TRAINING.y } } : {}) };
  }
  if (step.event === 'blueprint') return questTrackedTownRoute('smith', '按 E 打开装备图纸，使用魂晶解锁图纸；已有解锁自动计入。');
  if (step.event === 'talent') return questTrackedTownRoute('mentor', '按 E 打开天赋树，学习或提升天赋；已有天赋等级自动计入。');
  return questTrackedDungeonRoute(step);
}
function questTrackedEntry(scope, q, state, chapter) {
  const copy = { ...state, ...(Array.isArray(state.legacyTalks) ? { legacyTalks: [...state.legacyTalks] } : {}) };
  const progress = questProgress(q, copy), status = copy.accepted === false ? 'unaccepted' : progress.ready ? 'ready' : 'active';
  const objective = status === 'unaccepted' ? '到公会接取当前主线' : progress.label;
  const route = status === 'unaccepted' ? questTrackedTownRoute('guild', '靠近莉娅按 E，在主线列表接取当前章节。') :
    status === 'ready' ? questTrackedTownRoute('guild', '靠近莉娅按 E，选择对应任务并交付，领取魂晶奖励。') : questTrackedStepRoute(q.steps[progress.step]);
  return { key: `${scope}:${q.id}`, scope, questId: q.id, title: q.name, ...(chapter ? { chapter } : {}),
    step: progress.step, total: progress.total, current: progress.current, goal: progress.goal, status, objective, route };
}
function questTrackedEntries() {
  const camp = META.camp;
  if (!camp || !camp.main) return [];
  const entries = [], main = camp.main, stage = questCount(main.stage), q = CAMP_MAIN[stage];
  if (q) entries.push(questTrackedEntry('main', q, main, stage + 1));
  for (const state of (Array.isArray(camp.contracts) ? camp.contracts : []).slice(0, 3)) {
    const side = CAMP_CONTRACTS.find(q => q.id === state.id);
    if (side) entries.push(questTrackedEntry('side', side, state));
  }
  return entries;
}
