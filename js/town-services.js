'use strict';
// The town residents provide persistent errands, one-run meals, starter gear and earned honours.
const CAMP_STARTERS = ['rusty', 'hatchet', 'twin', 'shortbow', 'club'];
const CAMP_MEALS = [
  { id: 'hearty', name: '暖胃炖汤', icon: 'food', col: '#ff9a80', effect: '生命上限 +1 颗心', lines: ['下次出征生效，持续整局。', '出征时补满新增的生命。'] },
  { id: 'swift', name: '猎人便当', icon: 'boots', col: '#82e68c', effect: '移动速度 +5%', lines: ['下次出征生效，持续整局。', '适合游走、躲避和探索。'] },
  { id: 'lucky', name: '幸运果派', icon: 'clover', col: '#ffd060', effect: '宝箱升阶几率 +4%', lines: ['下次出征生效，持续整局。', '每次升阶判定增加 4 个百分点。'] },
];
const campCount = n => Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
const CAMP_HONOURS = [
  { id: 'return', name: '归来的旅人', goal: 1, reward: 10, icon: 'boots', count: () => campCount(META.runs), desc: '完成 1 次冒险并返回主城' },
  { id: 'hunter', name: '初露锋芒', goal: 50, reward: 15, icon: 'sword', count: () => campCount(META.kills), desc: '累计击败 50 只敌人' },
  { id: 'veteran', name: '久战之勇', goal: 200, reward: 25, icon: 'armor', count: () => campCount(META.kills), desc: '累计击败 200 只敌人' },
  { id: 'victory', name: '破晓英雄', goal: 1, reward: 35, icon: 'crown', count: () => campCount(META.wins), desc: '完整通关任意一幕 1 次' },
  { id: 'collector', name: '遗物学徒', goal: 10, reward: 10, icon: 'book', count: () => codexItems().filter(i => META.seenSet.has(i.id)).length, desc: '图鉴发现 10 件不同装备' },
  { id: 'scholar', name: '博识之眼', goal: 30, reward: 20, icon: 'eye', count: () => codexItems().filter(i => META.seenSet.has(i.id)).length, desc: '图鉴发现 30 件不同装备' },
  { id: 'blueprints', name: '工坊赞助者', goal: 3, reward: 20, icon: 'hammer', count: () => ITEMS.filter(i => i.lock && META.unlockedSet.has(i.id)).length, desc: '在铁匠铺解锁 3 张图纸' },
  { id: 'talents', name: '勤学之心', goal: 10, reward: 20, icon: 'gem', count: () => TALENTS.reduce((n, t) => n + Math.min(t.max, campCount(lv(t.id))), 0), desc: '累计习得 10 级天赋' },
];
function normalizeTownServices() {
  const raw = META.camp && typeof META.camp === 'object' && !Array.isArray(META.camp) ? META.camp : {};
  const quests = normalizeQuestState(raw);
  META.camp = { ver: 3, starter: CAMP_STARTERS.includes(raw.starter) ? raw.starter : 'rusty',
    nextMeal: CAMP_MEALS.some(m => m.id === raw.nextMeal) ? raw.nextMeal : null,
    ...quests, tracker: { collapsed: !!(raw.tracker && raw.tracker.collapsed),
      focus: raw.tracker && typeof raw.tracker.focus === 'string' ? raw.tracker.focus : null },
    claimed: Array.isArray(raw.claimed) ? [...new Set(raw.claimed.filter(id => CAMP_HONOURS.some(h => h.id === id)))] : [] };
  questMainCurrent();
  TOWN.sel.guildMain = Math.min(META.camp.main.stage, CAMP_MAIN.length - 1);
}
const townCamp = () => { if (!META.camp) normalizeTownServices(); return META.camp; };
function campStarterItem() { return ITEM_BY_ID[townCamp().starter] || ITEM_BY_ID.rusty; }
function takeCampMeal() {
  const camp = townCamp(), meal = camp.nextMeal;
  camp.nextMeal = null; saveMeta(); return meal;
}
function applyCampMeal(s) {
  // baseStats is rebuilt for every equipment swap. The meal never changes stored talent or gear values.
  if (!G.campMeal || G.mode === 'town' || G.mode === 'title' || (G.mode === 'pause' && G.pmode === 'town')) return;
  if (G.campMeal === 'hearty') s.maxHp += 2;
  else if (G.campMeal === 'swift') s.speed *= 1.05;
  else if (G.campMeal === 'lucky') s.chestLuck += 0.04;
}
function setCampMeal(id) {
  if (!metaSaveReady()) return false;
  if (G.mode !== 'town' || (id !== null && !CAMP_MEALS.some(m => m.id === id))) return false;
  townCamp().nextMeal = id; if (id) townServiceEvent('meal', { id }); saveMeta(); return true;
}
function setCampStarter(id) {
  if (!metaSaveReady()) return false;
  if (G.mode !== 'town' || !CAMP_STARTERS.includes(id)) return false;
  townCamp().starter = id; G.eq.weapon = campStarterItem(); recalcStats(); townServiceEvent('starter', { id }); saveMeta(); return true;
}
// Compatibility names used by the NPC menus; the quest engine owns progress and persistence.
const acceptCampContract = id => acceptSideQuest(id);
const abandonCampContract = id => abandonSideQuest(id);
const claimCampContract = id => claimSideQuest(id);
const acceptCampMain = () => acceptMainQuest();
const claimCampMain = () => claimMainQuest();
function townServiceEvent(kind, payload) { recordQuestEvent(kind, payload); }
function claimCampHonour(id) {
  if (!metaSaveReady()) return false;
  const h = CAMP_HONOURS.find(q => q.id === id), camp = townCamp();
  if (G.mode !== 'town' || !h || camp.claimed.includes(id) || h.count() < h.goal) return false;
  camp.claimed.push(id); META.souls += h.reward; saveMeta(); return true;
}

Object.assign(TOWN_MENUS, {
  guild: { title: '委托官 莉娅 · 公会', col: '#e8c46a', talk: ['主线引领远行，支线可同时接取三项。', '地牢里的每一步，都有人需要你的帮助。'] },
  cook: { title: '厨师 米洛 · 营地食堂', col: '#ff9a80', talk: ['出发前先吃好，一餐只够一次冒险。', '热汤、便当还是果派？我请客！'] },
  quartermaster: { title: '军需官 雷恩 · 初始军械', col: '#8ac8ff', talk: ['选好趁手的普通武器，去木桩旁试试。', '下次出征时，就带上你选的这把。'] },
  archivist: { title: '书记官 诺拉 · 功勋档案', col: '#c8a0ff', talk: ['功勋只奖一次，但足迹会永远记在这里。', '发现、学习和战斗，都值得被记录。'] },
});
Object.assign(TOWN.sel, { guild: 0, guildMain: 0, cook: 0, quartermaster: 0, archivist: 0 });
TOWN.guildTab = 'main';
function serviceIndex(key, n) { return TOWN.sel[key] = clamp(Math.floor(TOWN.sel[key] || 0), 0, n - 1); }
function serviceNav(key, n, vx, vy) { const d = vy || vx; if (!d) return; TOWN.sel[key] = (serviceIndex(key, n) + d + n) % n; SFX.move(); }
function serviceFrame(key, k) { const M = TOWN_MENUS[key]; frame(6, 26, 314, 166, M.title, M.col, k); menuHeader(TOWN.talk); return M.col; }
function serviceRow(key, i, y, title, sub, col, on) {
  const hover = uiHit(12, y, 127, y + 18, () => { TOWN.sel[key] = i; SFX.move(); });
  panel(12, y, 127, y + 18, on || hover ? '#302536' : '#1a1220', on ? col : '#3a3044', 1);
  T(title, 17, y + 5.6, 5.5, on ? '#fff0d8' : '#ddd0dc', 'left');
  T(sub, 17, y + 12.3, 4.3, col, 'left');
}
function serviceDetail(title, glyph, col, lines) {
  panel(134, 43, 308, 133, '#1a1220', col, 1);
  bigIcon(icon(glyph, col, '#5a4050', '#fff4d0'), 143, 50, 2);
  T(title, 165, 57.5, 6.5, col, 'left');
  lines.forEach((s, i) => T(s, 142, 76 + i * 8, 4.8, i === 0 ? '#f0e0d0' : '#a096aa', 'left'));
}
function serviceFoot(action) { toast(160, 160); hints([['方向', '选择'], ['E', action], ['Esc', '离开']]); }
function serviceResult(ok, yes, no = '当前无法领取') {
  const pending = META_SAVE.pending;
  townMsg(pending ? META_SAVE.message : ok ? yes : no, pending ? '#ffcf80' : ok ? '#82e68c' : '#ff6070'); (ok ? SFX.buy : SFX.deny)();
}

function questDetailLines(q, state, done = false) {
  const lines = townWrapText(q.lore || q.desc || '', 157, 4.8).slice(0, 2);
  while (lines.length < 2) lines.push('');
  const p = state ? questProgress(q, state) : null;
  const label = done ? '本章剧情与目标已交付。' : p && p.ready ? '目标全部达成，返回公会交付。' : questStepLabel(q, state || { step: 0, progress: 0 });
  lines.push(p && !done && !p.ready ? `当前目标 ${p.step + 1} / ${p.total}` : done ? '已记入晨星档案' : p ? '等待交付' : `共 ${q.steps.length} 个顺序目标`);
  lines.push(...townWrapText(label, 157, 4.8).slice(0, 2));
  while (lines.length < 5) lines.push('');
  lines.push(p && !done && !p.ready ? `本目标进度：${p.current} / ${p.goal}` : q.repeatable ? '交付后可以重新接取。' : '剧情委托仅可交付一次。');
  lines.push(`委托报酬：${q.reward} 魂晶`);
  return lines;
}
function questRowState(q, state) {
  const p = questProgress(q, state);
  return p.ready ? '目标全部达成 · 可交付' : `${p.step + 1}/${p.total} 步 · ${p.current}/${p.goal}`;
}
TOWN.guildFilter = { main: 'all', side: 'all' };
const GUILD_OWNER_NAMES = { guild: '莉娅 · 公会', mentor: '艾琳 · 导师', smith: '布洛克 · 工坊', quartermaster: '雷恩 · 军需', cook: '米洛 · 食堂', archivist: '诺拉 · 档案' };
function guildFilterGroups(main) {
  return main ? [{ id: 'all', name: '全部剧情篇' }, ...[...new Set(CAMP_MAIN.map(q => q.arc))].map(arc => ({ id: arc, name: arc }))] :
    [{ id: 'all', name: '全部委托人' }, { id: 'active', name: '正在进行' }, ...Object.entries(GUILD_OWNER_NAMES).map(([id, name]) => ({ id, name }))];
}
function guildView(main = TOWN.guildTab === 'main') {
  const data = main ? CAMP_MAIN : CAMP_CONTRACTS, tab = main ? 'main' : 'side', filter = TOWN.guildFilter[tab], key = main ? 'guildMain' : 'guild';
  const active = new Set(townCamp().contracts.map(q => q.id));
  const indices = data.flatMap((q, i) => filter === 'all' || (main ? q.arc === filter : filter === 'active' ? active.has(q.id) : q.owner === filter) ? [i] : []);
  if (indices.length && !indices.includes(TOWN.sel[key])) TOWN.sel[key] = indices[0];
  return { main, key, indices, at: indices.indexOf(TOWN.sel[key]), q: indices.length ? data[TOWN.sel[key]] : null };
}
function guildChangeFilter(delta) {
  const main = TOWN.guildTab === 'main', tab = main ? 'main' : 'side', groups = guildFilterGroups(main), at = Math.max(0, groups.findIndex(g => g.id === TOWN.guildFilter[tab]));
  TOWN.guildFilter[tab] = groups[(at + delta + groups.length) % groups.length].id; guildView(main); SFX.move();
}
function guildPage(delta) {
  const v = guildView(), pages = Math.ceil(v.indices.length / 3);
  if (!pages) return;
  TOWN.sel[v.key] = v.indices[((Math.floor(v.at / 3) + delta + pages) % pages) * 3]; SFX.move();
}
function guildCurrentChapter() {
  TOWN.guildTab = 'main'; TOWN.guildFilter.main = 'all'; TOWN.sel.guildMain = Math.min(townCamp().main.stage, CAMP_MAIN.length - 1); SFX.move();
}
const MENU_GUILD = {
  nav(vx, vy) {
    if (vx) { TOWN.guildTab = TOWN.guildTab === 'main' ? 'side' : 'main'; guildView(); SFX.move(); }
    else if (vy) { const v = guildView(); if (v.indices.length) { TOWN.sel[v.key] = v.indices[(v.at + vy + v.indices.length) % v.indices.length]; SFX.move(); } }
  },
  wheel(e) { if (Math.abs(e.deltaY) < 1) return; e.preventDefault(); guildPage(e.deltaY > 0 ? 1 : -1); },
  ok() {
    const camp = townCamp(), view = guildView();
    if (!view.q) { serviceResult(false, '', '没有正在进行的支线'); return; }
    if (view.main) {
      const sel = TOWN.sel.guildMain, m = camp.main, q = view.q;
      if (sel < m.stage) { openTownQuestReview(q); return; }
      if (sel !== m.stage) { serviceResult(false, '', '请先完成当前主线'); return; }
      if (!m.accepted) {
        const ok = acceptCampMain(); serviceResult(ok, `接下主线：${q.name}`);
        const scene = ok && questScene({ scope: 'main', q, state: m });
        if (scene && !scene.inspect && scene.npc === 'guild') openTownDialogue(scene, 'guild');
      } else serviceResult(claimCampMain(), `主线交付 · 魂晶 +${q.reward}`, '请先完成当前剧情与目标');
      TOWN.sel.guildMain = Math.min(camp.main.stage, CAMP_MAIN.length - 1);
      if (TOWN.guildFilter.main !== 'all') TOWN.guildFilter.main = CAMP_MAIN[TOWN.sel.guildMain].arc;
      return;
    }
    const q = view.q, job = camp.contracts.find(j => j.id === q.id);
    if (job) serviceResult(claimCampContract(q.id), `支线交付 · 魂晶 +${q.reward}`, '请先完成当前剧情与目标');
    else {
      const ok = acceptCampContract(q.id); serviceResult(ok, `接取支线：${q.name}`, camp.sideCompleted.includes(q.id) ? '这项居民委托已经完成' : '最多并接 3 项，请先交付或放弃');
      const state = ok && camp.contracts.find(j => j.id === q.id), scene = state && questScene({ scope: 'side', q, state });
      if (scene && !scene.inspect && scene.npc === 'guild') openTownDialogue(scene, 'guild');
    }
  },
  draw(k) {
    const col = serviceFrame('guild', k), camp = townCamp(), main = TOWN.guildTab === 'main', view = guildView(main), sel = TOWN.sel[view.key], page = Math.max(0, Math.floor(view.at / 3)), q = view.q;
    for (const [tab, x, label] of [['main', 12, `主线 ${CAMP_MAIN.length}`], ['side', 71, `支线 ${CAMP_CONTRACTS.length}`]]) {
      const on = TOWN.guildTab === tab, hover = uiHit(x, 42, x + 56, 53, () => { TOWN.guildTab = tab; guildView(); SFX.move(); });
      panel(x, 42, x + 56, 53, on || hover ? '#3c3030' : '#1a1220', on ? col : '#3a3044', 1); T(label, x + 28, 47.5, 4.8, on ? '#fff0d8' : '#a096aa');
    }
    const groups = guildFilterGroups(main), group = groups.find(g => g.id === TOWN.guildFilter[main ? 'main' : 'side']) || groups[0];
    for (const [delta, x, label] of [[-1, 12, '◀'], [1, 114, '▶']]) {
      const hover = uiHit(x, 54, x + 13, 64, () => guildChangeFilter(delta));
      panel(x, 54, x + 13, 64, hover ? '#3c3030' : '#1a1220', '#796448', 1); T(label, x + 6.5, 59, 4.3, col);
    }
    T(`${group.name} · ${view.indices.length}`, 69.5, 59, 4.3, '#c8bcd0');
    const data = main ? CAMP_MAIN : CAMP_CONTRACTS;
    view.indices.slice(page * 3, page * 3 + 3).forEach((i, j) => {
      const it = data[i]; let state;
      if (main) state = i < camp.main.stage ? '已完成' : i > camp.main.stage ? '前序章节未完成' : !camp.main.accepted ? '等待接取' : questRowState(it, camp.main);
      else { const job = camp.contracts.find(a => a.id === it.id); state = job ? questRowState(it, job) : camp.sideCompleted.includes(it.id) ? '已完成 · 居民的谢意' : `可接取 · ${it.reward} 魂晶`; }
      serviceRow(view.key, i, 66 + j * 19, main ? `${String(i + 1).padStart(2, '0')} ${it.name}` : it.name, state, main ? col : it.col, i === sel);
    });
    if (!q) {
      serviceDetail('当前没有支线', 'book', col, ['接取的支线会显示在这里。', '可以按委托人查找居民任务。', `已接取：${camp.contracts.length} / 3`, '使用分类箭头查看其他委托。']);
      button(142, 139, 300, 153, '暂无可交付委托', false, col);
    } else if (main) {
      const m = camp.main, mine = sel === m.stage, ready = mine && m.accepted && questReady(q, m);
      serviceDetail(`${String(sel + 1).padStart(2, '0')} · ${q.name}`, q.icon, col, questDetailLines(q, mine && m.accepted ? m : null, sel < m.stage));
      button(142, 139, 300, 153, sel < m.stage ? '回顾本章剧情' : sel > m.stage ? '完成前序章节后开放' : !m.accepted ? '接下晨星主线' : ready ? `交付 · 魂晶 +${q.reward}` : '前往当前目标继续剧情', sel < m.stage || mine && (!m.accepted || ready), col);
    } else {
      const job = camp.contracts.find(j => j.id === q.id), done = camp.sideCompleted.includes(q.id), ready = job && questReady(q, job);
      serviceDetail(q.name, q.icon, q.col, questDetailLines(q, job, done));
      if (job) {
        const hover = uiHit(17, 137, 122, 151, () => { abandonCampContract(q.id); townMsg(`已放弃 ${q.name}`, '#ff9a80'); guildView(); SFX.deny(); });
        panel(17, 137, 122, 151, hover ? '#42242a' : '#241620', '#a06468', 1); T('放弃这项支线', 69.5, 144, 5, '#f0b0aa');
      } else T(`已接 ${camp.contracts.length}/3 · 完成 ${camp.sideCompleted.length}`, 17, 144, 4.3, col, 'left');
      button(142, 139, 300, 153, done ? '居民委托已完成' : ready ? `交付 · 魂晶 +${q.reward}` : job ? '前往当前目标继续委托' : camp.contracts.length >= 3 ? '支线已满 · 最多 3 项' : '接取支线', !done && (ready || !job && camp.contracts.length < 3), q.col);
    }
    if (main) {
      const hover = uiHit(17, 137, 122, 151, guildCurrentChapter);
      panel(17, 137, 122, 151, hover ? '#3c3030' : '#241620', '#796448', 1);
      T(camp.main.stage >= CAMP_MAIN.length ? '全部完成 · 查看末章' : `定位当前 ${camp.main.stage + 1}/${CAMP_MAIN.length}`, 69.5, 144, 4.8, col);
    }
    const pages = Math.ceil(view.indices.length / 3);
    for (const [delta, x, label] of [[-1, 17, '◀'], [1, 101, '▶']]) {
      const hover = uiHit(x, 125, x + 21, 135, () => guildPage(delta));
      panel(x, 125, x + 21, 135, hover ? '#302536' : '#241620', col, 1); T(label, x + 10.5, 130, 5, col);
    }
    T(pages ? `${page + 1} / ${pages} 页` : '0 项', 69.5, 130, 4.5, '#c8bcd0');
    toast(160, 160); hints([['左右', '主线/支线'], ['上下/滚轮', '浏览'], ['E', '接取/交付'], ['Esc', '离开']]);
  },
};
const MENU_COOK = {
  nav(vx, vy) { serviceNav('cook', CAMP_MEALS.length, vx, vy); },
  ok() { const meal = CAMP_MEALS[serviceIndex('cook', CAMP_MEALS.length)]; serviceResult(setCampMeal(meal.id), `已预订 ${meal.name}`, '请返回主城再预订'); },
  draw(k) {
    serviceFrame('cook', k); const sel = serviceIndex('cook', CAMP_MEALS.length), meal = CAMP_MEALS[sel], next = townCamp().nextMeal;
    CAMP_MEALS.forEach((m, i) => serviceRow('cook', i, 44 + i * 24, m.name, next === m.id ? '已预订 · 下次出征生效' : m.effect, m.col, i === sel));
    serviceDetail(meal.name, meal.icon, meal.col, [meal.effect, ...meal.lines, '免费预订，仅能保留一种餐食。', '更换预订会替换原来的餐食。']);
    T('出征后自动消耗预订', 17, 123, 4.5, '#a096aa', 'left');
    if (next) { const hover = uiHit(17, 132, 122, 146, () => { setCampMeal(null); townMsg('已取消餐食预订', '#a096aa'); SFX.select(); });
      panel(17, 132, 122, 146, hover ? '#302536' : '#241620', '#a06468', 1); T('取消下次餐食', 69.5, 139, 5, '#d8c4c0'); }
    button(142, 139, 300, 153, next === meal.id ? '已预订 · 再次确认' : '免费预订这份餐食', true, meal.col); serviceFoot('预订');
  },
};
const MENU_QUARTERMASTER = {
  nav(vx, vy) { serviceNav('quartermaster', CAMP_STARTERS.length, vx, vy); },
  ok() { const id = CAMP_STARTERS[serviceIndex('quartermaster', CAMP_STARTERS.length)]; serviceResult(setCampStarter(id), `初始武器：${ITEM_BY_ID[id].name}`, '请返回主城再整备'); },
  draw(k) {
    const col = serviceFrame('quartermaster', k), sel = serviceIndex('quartermaster', CAMP_STARTERS.length), it = ITEM_BY_ID[CAMP_STARTERS[sel]], cur = townCamp().starter;
    CAMP_STARTERS.forEach((id, i) => serviceRow('quartermaster', i, 43 + i * 19, ITEM_BY_ID[id].name, cur === id ? '已选定 · 下次出征携带' : '普通武器 · 免费整备', col, i === sel));
    serviceDetail(it.name, it.icon[0], col, [...it.lines, '选定后可在主城木桩试用。', '每次出征都会携带这把武器。', '开局宝箱仍然保留。']);
    T('只提供普通初始武器', 17, 150, 4.5, '#a096aa', 'left');
    button(142, 139, 300, 153, cur === it.id ? '重新整备这把武器' : '设为初始武器并试用', true, col); serviceFoot('整备');
  },
};
const MENU_ARCHIVIST = {
  nav(vx, vy) { serviceNav('archivist', CAMP_HONOURS.length, vx, vy); },
  ok() { const h = CAMP_HONOURS[serviceIndex('archivist', CAMP_HONOURS.length)]; serviceResult(claimCampHonour(h.id), `功勋奖励 · 魂晶 +${h.reward}`, '功勋尚未达成或已经领取'); },
  draw(k) {
    const col = serviceFrame('archivist', k), sel = serviceIndex('archivist', CAMP_HONOURS.length), h = CAMP_HONOURS[sel], page = Math.floor(sel / 4), claimed = townCamp().claimed;
    CAMP_HONOURS.slice(page * 4, page * 4 + 4).forEach((a, j) => serviceRow('archivist', page * 4 + j, 44 + j * 20, a.name,
      claimed.includes(a.id) ? '奖励已领取' : `${Math.min(a.goal, a.count())}/${a.goal} · ${a.count() >= a.goal ? '可领取' : '积累中'}`, col, page * 4 + j === sel));
    serviceDetail(h.name, h.icon, col, [h.desc, `达成奖励：${h.reward} 魂晶`, '每项功勋只能领取一次。', '按存档中已有的冒险记录计算。']);
    T(`${Math.min(h.goal, h.count())} / ${h.goal} · ${claimed.includes(h.id) ? '已领取' : h.count() >= h.goal ? '已达成' : '未达成'}`, 142, 116, 5.5, h.count() >= h.goal ? '#82e68c' : '#a096aa', 'left');
    for (const [delta, x, label] of [[-1, 17, '◀'], [1, 101, '▶']]) {
      const hover = uiHit(x, 132, x + 21, 145, () => { TOWN.sel.archivist = ((page + delta + 2) % 2) * 4; SFX.move(); });
      panel(x, 132, x + 21, 145, hover ? '#302536' : '#241620', col, 1); T(label, x + 10.5, 138.5, 5, col);
    }
    T(`${page + 1} / 2 页`, 69.5, 138.5, 4.5, '#c8bcd0');
    button(142, 139, 300, 153, claimed.includes(h.id) ? '奖励已领取' : `领取 · 魂晶 +${h.reward}`, !claimed.includes(h.id) && h.count() >= h.goal, col); serviceFoot('领取');
  },
};
Object.assign(TOWN_MENU_UI, { guild: MENU_GUILD, cook: MENU_COOK, quartermaster: MENU_QUARTERMASTER, archivist: MENU_ARCHIVIST });
