'use strict';
// The floor map is a local menu; multiplayer keeps the authoritative world running.
const FLOOR_MAP = { open: false, selected: null, scope: '', pointer: '', note: '', scroll: 0, scrollMax: 0 };
const FLOOR_ROOM_STYLE = {
  start: ['入口', '起', '#c8b8ff'], combat: ['战斗房', '战', '#b7a5c7'], treasure: ['宝藏房', '宝', '#ffd060'],
  shop: ['旅行商人', '商', '#79b8ff'], shrine: ['属性神殿', '祈', '#ffe6a0'], altar: ['鲜血祭坛', '祭', '#ff8999'],
  fountain: ['生命之泉', '泉', '#81dbff'], challenge: ['挑战房', '挑', '#ffa56b'], stairs: ['楼梯房', '梯', '#bda0ff'],
  boss: ['首领房', '王', '#ff7b91'], pond: ['清泉钓点', '钓', '#81d9ce'], spring: ['野温泉', '温', '#a8e5ee'], pet: ['歇脚处', '宠', '#efbe90'],
};
function floorMapScope() {
  const online = coopRuntimeIsActive();
  return `${online ? COOP_RUNTIME.runId + ':' + COOP_RUNTIME.roomRevision : ''}:${G.act}:${G.chapter}:${G.floor}:${G.room && rkey(G.room.gx, G.room.gy)}`;
}
function floorMapAlive() {
  const actor = coopRuntimeIsActive() && COOP_RUNTIME.actors.get(COOP.selfId);
  return G.room && G.room.type !== 'town' && G.player && G.player.hp > 0 &&
    (!coopRuntimeIsActive() || actor && actor.connected && !actor.downed && !COOP_RUNTIME.ended);
}
function openFloorMap() {
  if (FLOOR_MAP.open || G.mode !== 'play' || !floorMapAlive() || G.trans || COOP_UI.open) return false;
  Object.assign(FLOOR_MAP, { open: true, selected: rkey(G.room.gx, G.room.gy), scope: floorMapScope(), pointer: '', note: '', scroll: 0 });
  resetInput(); UI_HITS.length = 0;
  if (coopRuntimeIsActive()) {
    COOP.edges.clear();
    if (COOP.role === 'client') coopRunAction({ kind: 'pause', roomRevision: COOP_RUNTIME.roomRevision });
    else COOP_RUNTIME.actors.get(COOP.selfId).context.mode = 'map';
  }
  G.mode = 'map'; SFX.move(); return true;
}
function closeFloorMap(resume = true) {
  if (!FLOOR_MAP.open) return;
  FLOOR_MAP.open = false; FLOOR_MAP.note = ''; resetInput(); UI_HITS.length = 0;
  if (coopRuntimeIsActive()) {
    COOP.edges.clear();
    const actor = COOP_RUNTIME.actors.get(COOP.selfId);
    if (COOP.role === 'client') {
      if (resume && actor && !actor.downed && !COOP_RUNTIME.ended) coopRunAction({ kind: 'resume', roomRevision: COOP_RUNTIME.roomRevision });
      if (G.mode === 'map') G.mode = resume && actor?.context.mode === 'pause' ? 'play' : actor?.context.mode || 'play';
    } else {
      if (G.mode === 'map') G.mode = 'play';
      if (actor && actor.context.mode === 'map') actor.context.mode = G.mode;
    }
  } else if (G.mode === 'map') G.mode = G.room?.type === 'town' ? 'town' : 'play';
}
function floorMapValidate() {
  if (FLOOR_MAP.open && (!floorMapAlive() || FLOOR_MAP.scope !== floorMapScope() ||
      !['play', 'map', 'pause'].includes(G.mode))) closeFloorMap(false);
}
function floorMapSelect(room) {
  const key = rkey(room.gx, room.gy);
  if (FLOOR_MAP.selected !== key) { FLOOR_MAP.scroll = 0; FLOOR_MAP.note = ''; }
  FLOOR_MAP.selected = key;
}
function floorMapTravelSelected() {
  const room = G.rooms.get(FLOOR_MAP.selected), info = floorTravelInfo(room);
  if (!FLOOR_MAP.open || !info.canTravel) { FLOOR_MAP.note = info.reason; SFX.deny(); return false; }
  if (!floorTravel(room)) { FLOOR_MAP.note = floorTravelInfo(room).reason || '暂时无法传送'; SFX.deny(); return false; }
  closeFloorMap(); SFX.select(); return true;
}
function floorMapNavigate(dx, dy) {
  const current = G.rooms.get(FLOOR_MAP.selected) || G.room;
  let next = null, score = Infinity;
  for (const room of G.rooms.values()) {
    if (room === current || !floorTravelInfo(room).visible) continue;
    const x = room.gx - current.gx, y = room.gy - current.gy, forward = x * dx + y * dy;
    if (forward <= 0) continue;
    const cross = Math.abs(x * dy - y * dx), rank = forward + cross * 4;
    if (rank < score) { score = rank; next = room; }
  }
  if (next) { floorMapSelect(next); SFX.move(); }
}
function updateFloorMap() {
  if (consume('mute')) toggleMute();
  if (consume('map') || consume('pause')) { closeFloorMap(); return; }
  const dx = navXPressed(), dy = navPressed();
  if (dx || dy) floorMapNavigate(dx, dy);
  if (confirmPressed()) floorMapTravelSelected();
  // Navigation is local and never becomes a movement/attack command for the host.
  resetInput();
}
function floorMapLayout() {
  const rooms = [...G.rooms.values()].filter(room => floorTravelInfo(room).visible);
  const xs = rooms.map(r => r.gx), ys = rooms.map(r => r.gy);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const cell = Math.min(30, 186 / Math.max(1, maxX - minX + 1), 100 / Math.max(1, maxY - minY + 1));
  const x = 109 - (maxX - minX) * cell / 2, y = 98 - (maxY - minY) * cell / 2;
  return { rooms, cell, at: room => [x + (room.gx - minX) * cell, y + (room.gy - minY) * cell] };
}
function floorMapLines(text, x, y, width, size = 4.5, col = '#cbbdd3') {
  let line = '', rows = 0;
  for (const char of String(text || '')) {
    if (line && tw(line + char, size) > width) { T(line, x, y + rows++ * 6, size, col, 'left'); line = ''; }
    line += char;
  }
  if (line) { T(line, x, y + rows++ * 6, size, col, 'left'); }
  return rows * 6;
}
function drawFloorMap() {
  const map = floorMapLayout(), online = coopRuntimeIsActive(), client = online && COOP.role === 'client';
  const visited = [...G.rooms.values()].filter(r => r.visited).length;
  uiBackdrop('rgba(6,3,10,.82)');
  frame(6, 17, 314, 173, '本层地图', '#ae95d5');
  T(`${chap().name} · 第 ${G.floor} 层 · ${curDiff().name}`, 15, 31, 5.4, '#e5d7ee', 'left');
  T(`已探索 ${visited} / ${G.rooms.size}`, 15, 40, 4.4, '#a899b8', 'left');
  T(online ? '联机战斗继续' : '查看地图时暂停', 201, 40, 4.3, online ? '#ffd18c' : '#b8c9ac', 'right');
  const close = uiHit(291, 21, 307, 34, () => { closeFloorMap(); SFX.move(); });
  T('×', 299, 27, 10, close ? '#ffffff' : '#bbaaca');
  panel(12, 46, 206, 151, '#0e0b15', '#3b304e', 1);
  const known = new Set(map.rooms.map(r => rkey(r.gx, r.gy))), drawn = new Set();
  for (const room of map.rooms) for (const d of Object.keys(room.doors)) {
    const other = G.rooms.get(rkey(room.gx + DIRS[d][0], room.gy + DIRS[d][1]));
    if (!other || !known.has(rkey(other.gx, other.gy))) continue;
    const id = [rkey(room.gx, room.gy), rkey(other.gx, other.gy)].sort().join('/'); if (drawn.has(id)) continue; drawn.add(id);
    const [x, y] = map.at(room), [nx, ny] = map.at(other);
    hg.strokeStyle = room.visited && other.visited ? '#6c577f' : '#30283d'; hg.lineWidth = U * 1.3;
    hg.beginPath(); hg.moveTo(x * U, y * U); hg.lineTo(nx * U, ny * U); hg.stroke();
  }
  const pointer = `${Input.pointer.x}:${Input.pointer.y}:${Input.pointer.active}`;
  for (const room of map.rooms) {
    const info = floorTravelInfo(room), [x, y] = map.at(room), size = Math.min(19, map.cell * .74), half = size / 2;
    const style = room.visited ? FLOOR_ROOM_STYLE[room.type] || FLOOR_ROOM_STYLE.combat : ['未探索', '?', '#71667e'];
    const hover = uiHit(x - half, y - half, x + half, y + half, () => { floorMapSelect(room); floorMapTravelSelected(); });
    if (hover && pointer !== FLOOR_MAP.pointer) floorMapSelect(room);
    const selected = FLOOR_MAP.selected === rkey(room.gx, room.gy), color = info.current ? '#e7dcff' : style[2];
    panel(x - half, y - half, x + half, y + half, info.current ? '#433251' : info.unlocked ? '#252033' : '#15121c', selected ? '#ffe6b0' : color, 1);
    if (selected) { hg.strokeStyle = '#ffe6b0'; hg.lineWidth = .65 * U; hg.strokeRect((x - half - 1.5) * U, (y - half - 1.5) * U, (size + 3) * U, (size + 3) * U); }
    T(info.current ? '你' : style[1], x, y, Math.min(6.8, size * .48), color);
    if (info.unlocked && !info.current) { hg.fillStyle = '#8bd0a8'; hg.fillRect((x + half - 2) * U, (y + half - 2) * U, 2 * U, 2 * U); }
  }
  FLOOR_MAP.pointer = pointer;
  T('你  当前位置', 16, 158, 4, '#e7dcff', 'left'); T('■ 已解锁', 79, 158, 4, '#8bd0a8', 'left'); T('? 未探索', 143, 158, 4, '#9b8ca8', 'left');
  T('点击已解锁房间直接传送', 109, 167, 4.1, '#b7a2c8');
  const selectedRoom = G.rooms.get(FLOOR_MAP.selected) || G.room, info = floorTravelInfo(selectedRoom);
  const style = selectedRoom.visited ? FLOOR_ROOM_STYLE[selectedRoom.type] || FLOOR_ROOM_STYLE.combat : ['未探索房间', '?', '#8e8299'];
  panel(213, 46, 307, 151, '#1a1323', '#584165', 1);
  T(style[0], 220, 55, 7, style[2], 'left');
  T(info.current ? '当前位置' : info.unlocked ? '已探索 · 可传送' : selectedRoom.visited ? '尚未清理完成' : '进入后解锁传送', 220, 66, 4.4, info.unlocked ? '#b4e0bd' : '#b7a3c5', 'left');
  const details = floorMapRoomDetails(selectedRoom);
  let y = 77 - FLOOR_MAP.scroll;
  hg.save(); hg.beginPath(); hg.rect(217 * U, 72 * U, 85 * U, 48 * U); hg.clip();
  if (details) {
    const rows = [];
    if (details.chests !== null) rows.push(`剩余宝箱  ${details.chests}`);
    if (details.goods !== null && selectedRoom.type === 'shop') rows.push(`可购商品  ${details.goods}`);
    if (details.fountain !== null) rows.push('生命之泉  ' + (details.fountain ? '可使用' : '已使用'));
    if (details.altar !== null) rows.push('鲜血祭坛  ' + (details.altar ? '可献祭' : '已使用'));
    if (details.pond !== null) rows.push(`剩余抛竿  ${details.pond} 次`);
    if (details.pet !== null) rows.push('小动物  ' + (details.pet ? '等待互动' : '已互动'));
    if (details.exit) rows.push(details.exit);
    for (const row of rows) y += floorMapLines(row, 220, y, 79, 4.5, '#ded0e4') + 1;
    if (details.mechanic) y += floorMapLines(details.mechanic, 220, y + 1, 79, 4.4, '#dfbc8d') + 1;
    if (details.description) y += floorMapLines(details.description, 220, y + 1, 79, 4.3, '#a799b9');
  } else y += floorMapLines('尚未进入这个房间。探索后显示房型、补给和出口详情。', 220, y, 79, 4.7);
  hg.restore();
  FLOOR_MAP.scrollMax = Math.max(0, y + FLOOR_MAP.scroll - 119);
  FLOOR_MAP.scroll = Math.min(FLOOR_MAP.scroll, FLOOR_MAP.scrollMax);
  const touch = typeof MOBILE_INPUT !== 'undefined' && MOBILE_INPUT.enabled;
  if (FLOOR_MAP.scrollMax) T(touch ? '上下滑动查看详情' : '滚轮查看详情', 299, 122, 3.5, '#a28faf', 'right');
  const reason = FLOOR_MAP.note || info.reason;
  if (reason) floorMapLines(reason, 220, 127, 79, 4.2, client ? '#b9c6ec' : '#d5bca2');
  const canTravel = info.canTravel, hover = uiHit(213, 156, 307, 169, floorMapTravelSelected);
  panel(213, 156, 307, 169, canTravel ? hover ? '#39563b' : '#263b2b' : '#201927', canTravel ? '#97cc9a' : '#55465f', 1);
  T(info.current ? '你在这里' : client ? '由房主带队传送' : touch ? '传送到这里' : '传送到这里  E', 260, 163, 5.2, canTravel ? '#e6f4db' : '#a391ae');
}
const floorMapOriginalUpdate = update;
update = function (dt) {
  floorMapValidate();
  if (!FLOOR_MAP.open && consume('map')) openFloorMap();
  if (FLOOR_MAP.open) {
    updateFloorMap();
    if (FLOOR_MAP.open && !coopRuntimeIsActive()) { G.simDt = 0; return; }
  }
  return floorMapOriginalUpdate(dt);
};
const floorMapOriginalApply = coopRuntimeApply;
coopRuntimeApply = function (snapshot) {
  const ok = floorMapOriginalApply(snapshot);
  if (ok && FLOOR_MAP.open) { floorMapValidate(); if (FLOOR_MAP.open) G.mode = 'map'; }
  return ok;
};
const floorMapOriginalDrawUI = drawUI;
drawUI = function () {
  floorMapValidate();
  if (FLOOR_MAP.open) {
    drawSaveNotice(); UI_HITS.length = 0; hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, HC.width, HC.height); updateHelpText(); withMenuUI(drawFloorMap); return;
  }
  floorMapOriginalDrawUI();
  if (G.mode === 'play' && floorMapAlive() && !COOP_UI.open) {
    withUIOffset(LW - BASE_W, 0, () => {
    const hover = uiHit(274, 0, 320, HUD_H, openFloorMap);
    hg.strokeStyle = hover ? '#ead6ff' : '#554463'; hg.lineWidth = .5 * U;
    hg.strokeRect(273.5 * U, .5 * U, 46 * U, (HUD_H - 1) * U);
    T('M', 317, 3.5, 3.5, hover ? '#ffffff' : '#d0b5e5');
    });
  }
};
addEventListener('load', () => document.getElementById('stage').addEventListener('wheel', e => {
  if (!FLOOR_MAP.open || e.ctrlKey || e.metaKey || !e.deltaY) return;
  Object.assign(Input.pointer, { clientX: e.clientX, clientY: e.clientY, active: true }); syncPointer();
  const point = uiMenuPointer();
  if (point.x < 213 || point.x > 307 || point.y < 72 || point.y > 124) return;
  e.preventDefault(); FLOOR_MAP.scroll = clamp(FLOOR_MAP.scroll + Math.sign(e.deltaY) * 16, 0, FLOOR_MAP.scrollMax);
}, { passive: false }));
