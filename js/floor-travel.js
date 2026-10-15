'use strict';
// Same-floor fast travel uses the existing room lifecycle and co-op room revision.
// It never generates a room, awards a clear, or refreshes entry-only combat bonuses.
function floorTravelRoom(value) {
  if (!(G.rooms instanceof Map)) return null;
  if (typeof value === 'string') return G.rooms.get(value) || null;
  if (!value || !Number.isInteger(value.gx) || !Number.isInteger(value.gy)) return null;
  return G.rooms.get(rkey(value.gx, value.gy)) === value ? value : null;
}
function floorTravelReason(room, pending = false) {
  if (!room || !G.room || G.room.type === 'town') return '只能在当前地牢层内传送';
  if (room.gx === G.room.gx && room.gy === G.room.gy) return '你已在这个房间';
  if (!room.visited) return '先探索这个房间，才能解锁传送';
  if (!room.cleared || room.locked) return '清空这个房间后才能传送';
  if (typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive()) {
    if (!coopRuntimeIsHost() || coopActorId() !== COOP.selfId) return '由房主带领全队传送';
    if (COOP_RUNTIME.ended) return '本次冒险已结束';
    if (coopRuntimeActors().some(a => !a.downed && ['chest', 'choice', 'shrine'].includes(a.context.mode))) return '等待队友完成交互后再传送';
  }
  if (!G.player || G.player.hp <= 0 || !['play', 'map'].includes(G.mode)) return '当前状态无法传送';
  if (!G.room.cleared || G.room.locked || G.enemies.some(e => e.hp > 0)) return '清空当前房间后才能传送';
  if (G.trans && !pending) return '正在切换房间';
  return '';
}
function floorTravelInfo(value) {
  const room = floorTravelRoom(value), key = room ? rkey(room.gx, room.gy) : null;
  const current = !!room && !!G.room && room.gx === G.room.gx && room.gy === G.room.gy;
  const visible = !!room && (!!room.visited || Object.keys(room.doors || {}).some(d => {
    const dir = DIRS[d], neighbor = dir && G.rooms.get(rkey(room.gx + dir[0], room.gy + dir[1]));
    return neighbor && neighbor.visited;
  }));
  const reason = floorTravelReason(room);
  return { room, key, current, visible, unlocked: !!room && !!room.visited && !!room.cleared && !room.locked, canTravel: !reason, reason };
}
function floorTravelSafeAt(room, x, y, occupied = []) {
  if (!room.tiles || x < TS * 2 || x > RPW - TS * 2 || y < TS * 2 || y > RPH - TS * 2) return false;
  // Check the whole footprint: mechanic tiles include ice, pressure plates and void.
  for (const px of [x - 6, x + 6]) for (const py of [y - 8, y + 2])
    if (room.tiles[Math.floor(py / TS) * RW + Math.floor(px / TS)] !== 0) return false;
  if (boxHits(room, x, y, 6, 8, 'walk')) return false;
  const stall = room.stall;
  if (stall && x > stall.x0 - 12 && x < stall.x1 + 12 && y > stall.y0 - 12 && y < stall.y1 + 16) return false;
  const props = [...(room.chests || []), ...(room.shop || []), ...(room.portals || []), ...(room.gears || []),
    room.altar, room.fountain, room.shrine, room.stairs, room.pond, room.pet, room.spring].filter(Boolean);
  if (props.some(p => Number.isFinite(p.x) && Number.isFinite(p.y) && dist(x, y, p.x, p.y) < (p === room.pond ? 56 : Math.max(24, (p.r || 0) + 12)))) return false;
  return !occupied.some(p => dist(x, y, p.x, p.y) < 15);
}
function floorTravelSpot(room, occupied = []) {
  const anchor = { x: RPW / 2, y: RPH / 2 + 30 };
  let best = null, score = Infinity;
  for (let ty = 2; ty < RH - 2; ty++) for (let tx = 2; tx < RW - 2; tx++) {
    const x = tx * TS + 8, y = ty * TS + 10, d = (x - anchor.x) ** 2 + (y - anchor.y) ** 2;
    if (d < score && floorTravelSafeAt(room, x, y, occupied)) { best = { x, y }; score = d; }
  }
  return best;
}
function floorTravelPlace(spot) {
  const p = G.player;
  p.x = p.entryX = spot.x; p.y = p.entryY = spot.y;
  p.kbx = p.kby = p.ivx = p.ivy = 0; p.rolling = p.swing = 0; p.moving = false; p.riftPending = null;
  for (const m of G.minions || []) { m.x = p.x; m.y = p.y; m.vx = m.vy = 0; m.state = 0; m.dash = 0; }
  if (G.pet) { G.pet.x = p.x; G.pet.y = p.y; }
}
function floorTravel(value) {
  const room = floorTravelRoom(value);
  if (floorTravelReason(room)) return false;
  const online = typeof coopRuntimeIsHost === 'function' && coopRuntimeIsHost();
  const count = online ? coopRuntimeActors().length : 1, spots = [];
  for (let i = 0; i < count; i++) {
    const spot = floorTravelSpot(room, spots); if (!spot) return false;
    spots.push(spot);
  }
  const rooms = G.rooms, source = G.room;
  if (G.mode === 'map') G.mode = 'play';
  G.pmode = null; resetInput();
  transition(() => {
    // An old map selection can never jump to a previous floor or override a new room.
    if (G.rooms !== rooms || G.room !== source || floorTravelReason(room, true)) return;
    enterRoom(room, null, { travel: true, spots });
    G.prompt = null; G.camOff = worldCamera(room, G.player); resetInput();
  }, .18);
  return true;
}
