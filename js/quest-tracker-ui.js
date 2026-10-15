'use strict';
// A journal freezes the simulation and preserves the NPC menu or pause screen underneath it.
const QUEST_TRACK_UI = { returnMode: null, selected: null };
function questTrackerPrefs() {
  return townCamp().tracker || { collapsed: false, focus: null };
}
function questTrackerFocus(entries = questTrackedEntries()) {
  return entries.find(e => e.key === questTrackerPrefs().focus) || entries[0] || null;
}
function openQuestJournal(key) {
  if (!['town', 'play', 'pause'].includes(G.mode) || TOWN.launch || G.trans && !G.trans.done) return false;
  const entries = questTrackedEntries(), focus = questTrackerFocus(entries);
  QUEST_TRACK_UI.returnMode = G.mode;
  QUEST_TRACK_UI.selected = entries.some(e => e.key === key) ? key : focus && focus.key;
  G.mode = 'journal'; resetInput(); SFX.move(); return true;
}
function closeQuestJournal() {
  if (G.mode !== 'journal') return;
  G.mode = QUEST_TRACK_UI.returnMode || (G.room.type === 'town' ? 'town' : 'play');
  QUEST_TRACK_UI.returnMode = null; resetInput(); SFX.move();
}
function focusTrackedQuest(key, close = true) {
  if (!metaSaveReady()) return false;
  if (!questTrackedEntries().some(e => e.key === key)) return false;
  const camp = townCamp(); camp.tracker = { ...questTrackerPrefs(), focus: key }; saveMeta();
  QUEST_TRACK_UI.selected = key;
  if (close) closeQuestJournal();
  return true;
}
function toggleQuestTracker() {
  if (!metaSaveReady()) return false;
  const camp = townCamp(); camp.tracker = { ...questTrackerPrefs(), collapsed: !questTrackerPrefs().collapsed };
  saveMeta(); SFX.move();
}
function updateQuestJournal() {
  if (consume('mute')) toggleMute();
  if (consume('journal') || consume('pause')) { closeQuestJournal(); return; }
  const entries = questTrackedEntries();
  const at = Math.max(0, entries.findIndex(e => e.key === QUEST_TRACK_UI.selected));
  const d = navPressed() || navXPressed();
  if (d && entries.length) { QUEST_TRACK_UI.selected = entries[(at + d + entries.length) % entries.length].key; SFX.move(); }
  if (confirmPressed() && entries.length) focusTrackedQuest((entries.find(e => e.key === QUEST_TRACK_UI.selected) || entries[0]).key);
  Input.pressed.clear(); Input.anyPressed = false;
}
function questTrackerText(text, width, size) {
  text = String(text || '');
  if (tw(text, size) <= width) return text;
  let out = '';
  for (const ch of text) { if (tw(out + ch + '…', size) > width) break; out += ch; }
  return out + '…';
}
const questTrackerCount = e => e.status === 'ready' ? '可交付' : e.status === 'unaccepted' ? '待接取' : `${e.current}/${e.goal}`;
const questTrackerTag = e => e.scope === 'main' ? `主线 ${e.chapter}` : '支线';
const questTrackerDestination = e => `${e.route.kind === 'town' && G.room.type !== 'town' ? '回镇 · ' : ''}${e.route.label}`;
function questTrackerBounds(entries) {
  const collapsed = questTrackerPrefs().collapsed, h = collapsed ? 11 : 13 + Math.max(1, entries.length) * 25 + 9;
  const prompt = G.prompt, [cx, cy] = G.camOff;
  // Move away from a nearby interaction prompt so the task panel never covers the action text.
  const right = LW - 96;
  const x = prompt && prompt.x + cx > right - 22 && prompt.y + cy < 25 + h + 9 ? 6 : right;
  return { x, y: 25, w: 90, h };
}
function drawQuestTracker(entries) {
  const { x, y, w, h } = questTrackerBounds(entries), focus = questTrackerFocus(entries), collapsed = questTrackerPrefs().collapsed;
  panel(x, y, x + w, y + h, '#120d19', '#63516d', .88);
  const headHover = uiHit(x + 2, y + 1, x + w - 15, y + 11, () => openQuestJournal());
  T(`任务追踪 ${entries.length} · J`, x + 5, y + 6, 4.6, headHover ? '#fff0c8' : '#dbc8e9', 'left');
  const foldHover = uiHit(x + w - 14, y + 1, x + w - 2, y + 11, toggleQuestTracker);
  T(collapsed ? '+' : '−', x + w - 8, y + 6, 6, foldHover ? '#ffffff' : '#dbc8e9');
  if (collapsed) return;
  entries.forEach((entry, i) => {
    const yy = y + 12 + i * 25, col = entry.status === 'ready' ? '#82e68c' : entry.scope === 'main' ? '#e8c46a' : '#91c0e6';
    const hover = uiHit(x + 2, yy, x + w - 2, yy + 24, () => openQuestJournal(entry.key));
    if (focus && entry.key === focus.key || hover) {
      hg.fillStyle = hover ? 'rgba(180,160,200,.18)' : 'rgba(180,160,200,.08)'; hg.fillRect((x + 2) * U, yy * U, (w - 4) * U, 24 * U);
      hg.fillStyle = col; hg.fillRect((x + 2) * U, (yy + 2) * U, U, 20 * U);
    }
    T(questTrackerText(`${entry.scope === 'main' ? '主' : '支'} ${entry.title}`, w - 35, 4.5), x + 5, yy + 5, 4.5, col, 'left');
    T(questTrackerCount(entry), x + w - 5, yy + 5, 4, col, 'right');
    T(questTrackerText(entry.objective, w - 10, 4.3), x + 5, yy + 12.4, 4.3, '#eee2ee', 'left');
    T(questTrackerText(`→ ${questTrackerDestination(entry)}`, w - 10, 4.1), x + 5, yy + 19.6, 4.1, '#bcb0ca', 'left');
  });
  if (!entries.length) {
    T('暂无进行中的委托', x + 5, y + 19, 4.4, '#eee2ee', 'left');
    T('去西侧公会找莉娅接支线', x + 5, y + 29, 4, '#bcb0ca', 'left');
  }
  T('点击任务查看完整指引', x + w / 2, y + h - 4.5, 3.8, '#9b8da8');
}
function drawQuestJournal() {
  UI_HITS.length = 0;
  uiBackdrop('rgba(8,4,12,.88)');
  const entries = questTrackedEntries(), focus = questTrackerFocus(entries);
  const selected = entries.find(e => e.key === QUEST_TRACK_UI.selected) || focus;
  const col = '#d5b878';
  frame(6, 26, 314, 165, '任务日志 · 目标与去向', col);
  T(typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive() ? '联机战斗继续，请留意周围' : '查看任务时战斗暂停', 160, 35, 4.5, '#a99db5');
  entries.forEach((entry, i) => {
    const yy = 42 + i * 28, on = selected && selected.key === entry.key;
    const hover = uiHit(12, yy, 122, yy + 26, () => { QUEST_TRACK_UI.selected = entry.key; SFX.move(); });
    const c = entry.scope === 'main' ? '#e8c46a' : '#91c0e6';
    panel(12, yy, 122, yy + 26, on || hover ? '#332839' : '#1b1323', on ? c : '#45364f');
    T(questTrackerText(`${questTrackerTag(entry)} · ${entry.title}`, 100, 5), 17, yy + 6, 5, c, 'left');
    T(questTrackerText(entry.objective, 100, 4.3), 17, yy + 14, 4.3, '#ddcfdf', 'left');
    T(`${questTrackerCount(entry)}${focus && focus.key === entry.key ? ' · 正在追踪' : ''}`, 17, yy + 22, 4.2, on ? '#fff0c8' : '#9d91aa', 'left');
  });
  panel(129, 42, 308, 147, '#1b1323', col);
  if (selected) {
    const entry = selected, c = entry.status === 'ready' ? '#82e68c' : col;
    T(questTrackerText(entry.title, 161, 7), 138, 52, 7, c, 'left');
    T(entry.status === 'ready' ? '目标已完成 · 等待交付' : entry.status === 'unaccepted' ? '尚未接取主线' : `${questTrackerTag(entry)} · 第 ${entry.step + 1} / ${entry.total} 个目标`, 138, 64, 4.8, '#ad9fbb', 'left');
    townWrapText(entry.objective, 161, 5.8).slice(0, 2).forEach((line, i) => T(line, 138, 76 + i * 7.5, 5.8, '#f0e4ec', 'left'));
    T(`当前进度：${questTrackerCount(entry)}`, 138, 94, 5, c, 'left');
    townWrapText(`前往：${questTrackerDestination(entry)}`, 161, 5.1).slice(0, 2).forEach((line, i) => T(line, 138, 105 + i * 7, 5.1, '#afd9ee', 'left'));
    const detail = `${entry.route.kind === 'town' && G.room.type !== 'town' ? '先返回晨星镇。' : ''}${entry.route.detail}`;
    townWrapText(detail, 161, 4.3).slice(0, 5).forEach((line, i) => T(line, 138, 122 + i * 5.2, 4.3, '#bcafc7', 'left'));
    const trackHover = uiHit(129, 151, 217, 163, () => focusTrackedQuest(entry.key));
    panel(129, 151, 217, 163, trackHover ? '#465536' : '#2c3b26', '#82aa69');
    T('追踪这个目标', 173, 157, 5, '#ddf2c8');
  } else {
    T('暂无进行中的任务', 218.5, 70, 7, '#e8c46a');
    T('主线已经全部完成。', 138, 93, 5.5, '#ddd0df', 'left');
    T('可到西侧公会找莉娅接取支线。', 138, 108, 5, '#afd9ee', 'left');
  }
  const closeHover = uiHit(223, 151, 308, 163, closeQuestJournal);
  panel(223, 151, 308, 163, closeHover ? '#42324c' : '#2b2035', '#8a729a'); T('返回游戏', 265.5, 157, 5, '#ddcfeb');
  hints([['上下', '选择任务'], ['E / Enter', '追踪'], ['J / Esc', '返回']], 173);
}
function drawQuestTrackerDirection(entries) {
  const entry = questTrackerFocus(entries);
  if (G.mode !== 'town' || !entry) return;
  const point = entry.route.point || (entry.route.kind === 'dungeon' ? PORTAL : null);
  if (!point) return;
  const p = G.player, [cx, cy] = G.camOff;
  const dx = point.x - p.x, dy = point.y - p.y, d = Math.hypot(dx, dy);
  if (d < 24) return; // The existing nearby E / training prompt handles arrival.
  const px = p.x + cx, py = p.y + OY + cy - 7;
  const sx = dx / d, sy = dy / d, x = clamp(px + sx * 24, 14, LW - 14), y = clamp(py + sy * 24, 47, LH - 25);
  const col = entry.scope === 'main' ? '#ffd060' : '#91c0e6';
  hg.save(); hg.translate(x * U, y * U); hg.rotate(Math.atan2(dy, dx));
  hg.fillStyle = '#100a14'; hg.beginPath(); hg.moveTo(7 * U, 0); hg.lineTo(-4 * U, -5 * U); hg.lineTo(-2 * U, 0); hg.lineTo(-4 * U, 5 * U); hg.closePath(); hg.fill();
  hg.fillStyle = col; hg.beginPath(); hg.moveTo(5 * U, 0); hg.lineTo(-2 * U, -3 * U); hg.lineTo(-U, 0); hg.lineTo(-2 * U, 3 * U); hg.closePath(); hg.fill(); hg.restore();
}
