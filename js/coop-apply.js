'use strict';
// ============================================================ co-op: client snapshot validation + apply (split from coop-runtime.js)
// Depends on coop-runtime.js and coop-snapshot.js (coopRuntimeUnwire, COOP_FX_KEYS).
function coopRuntimeApply(snapshot) {
  if (!coopRuntimeIsActive() || COOP.role === 'host' || !snapshot || snapshot.version !== 1 || snapshot.runId !== COOP_RUNTIME.runId || snapshot.seq <= COOP_RUNTIME.lastApplied) return false;
  if (!Number.isSafeInteger(snapshot.seq) || snapshot.seq < 1 || !Number.isSafeInteger(snapshot.roomRevision) || snapshot.roomRevision < 1 ||
      ![null, 'win', 'dead'].includes(snapshot.ended)) return false;
  const R = COOP_RUNTIME, world = snapshot.world;
  if (!world || !world.room || !Array.isArray(snapshot.actors) || snapshot.actors.length > 4) return false;
  if (!Number.isInteger(world.act) || !ACTS[world.act - 1] || !Number.isInteger(world.chapter) || !ACTS[world.act - 1].regions[world.chapter - 1] ||
      !Number.isInteger(world.floor) || world.floor < 1 || world.floor > CONFIG.floorsPerRegion || !DIFFS[world.diff] || !Array.isArray(world.rooms) ||
      !Array.isArray(world.room.tiles) || world.room.tiles.length !== RW * RH || !Array.isArray(world.room.hz) || !Array.isArray(world.room.torches) || !world.room.doors) return false;
  const nextActors = new Map();
  for (const entry of snapshot.actors) {
    if (!entry || typeof entry.id !== 'string' || nextActors.has(entry.id)) return false;
    const prior = R.actors.get(entry.id);
    const context = coopRuntimeUnwire(entry.context);
    if (!context || !context.player || !context.player.wpn || !Number.isFinite(context.player.x) || !Number.isFinite(context.player.y) ||
        !Number.isFinite(context.player.hp) || !Number.isFinite(context.player.maxHp) || !context.eq || !context.eq.weapon || !Array.isArray(context.chests)) return false;
    // Old snapshots omitted the footwear slot. Keep them usable without making boots a trinket.
    if (context.eq.boots === undefined) context.eq.boots = null;
    if (context.player.costume === undefined) context.player.costume = 'adventurer';
    if (typeof context.player.costume !== 'string' || !Object.hasOwn(COSTUME_BY_ID, context.player.costume)) return false;
    if (!coopRuntimeEquipmentValid(context.eq, context.player.trinketSlots)) return false;
    context.player.heal = prior && prior.context.player.heal || newPlayer(0, 0).heal; context.player.orbHit = new Map();
    nextActors.set(entry.id, { ...entry, context });
  }
  if (!nextActors.has(COOP.selfId)) return false;
  const roomChanged = R.roomRevision !== snapshot.roomRevision;
  R.lastApplied = snapshot.seq; R.ended = snapshot.ended; R.roomRevision = snapshot.roomRevision;
  const oldRoom = G.room;
  // tilesRev (host revision of the tile grid) replaces the per-tile compare and the tiles.join signature.
  const tilesRev = Number.isSafeInteger(world.tilesRev) ? world.tilesRev : null;
  const reuseTiles = !roomChanged && !!oldRoom && (tilesRev !== null ? R.appliedTilesRev === tilesRev && R.appliedTilesRunId === R.runId && Array.isArray(oldRoom.tiles) :
    world.room.tiles.every((v, i) => v === oldRoom.tiles[i]));
  // Tiles are cold data. Decode changing room fields without rebuilding the unchanged grid.
  const room = coopRuntimeUnwire({ ...world.room, tiles: null });
  room.tiles = reuseTiles ? oldRoom.tiles : coopRuntimeUnwire(world.room.tiles);
  const signature = !roomChanged && oldRoom && room.tiles === oldRoom.tiles ? oldRoom.coopSignature :
    tilesRev !== null ? `${R.runId}:${snapshot.roomRevision}:t${tilesRev}` : `${R.runId}:${snapshot.roomRevision}:${(room.tiles || []).join(',')}`;
  R.appliedTilesRev = tilesRev; R.appliedTilesRunId = R.runId;
  for (const [k, v] of Object.entries(world)) if (k !== 'room' && k !== 'rooms' && k !== 'camOff' && k !== 'fx' && !COOP_FX_KEYS.includes(k)) G[k] = coopRuntimeUnwire(v);
  // Straight shots arrive as trajectory segments: place them at the snapshot's host time.
  if (Array.isArray(G.shots)) for (const s of G.shots) if (s && s.seg) { if (coopShotSegValid(s.seg)) coopShotAt(s, G.time); else s.seg = null; }
  // Cosmetic effects arrive as "new since last snapshot" and then live and fade locally.
  for (const k of COOP_FX_KEYS) {
    const add = world.fx && Array.isArray(world.fx[k]) ? coopRuntimeUnwire(world.fx[k]).filter(o => o && typeof o === 'object' && coopRuntimeFxVisible(o)) : [];
    const keep = roomChanged || !Array.isArray(G[k]) ? [] : G[k];
    G[k] = keep.concat(add); if (G[k].length > 800) G[k] = G[k].slice(-800);
  }
  room.canvas = oldRoom && oldRoom.coopSignature === signature ? oldRoom.canvas : renderRoom(room, G.chapter, G.floor, G.act);
  room.coopSignature = signature; room.pickups = G.pickups; G.room = room;
  const mapSignature = Number.isSafeInteger(world.mapRev) ? `${R.runId}:m${world.mapRev}` : JSON.stringify(world.rooms);
  if (roomChanged || R.mapSignature !== mapSignature) {
    G.rooms = new Map(world.rooms.map(r => [rkey(r.gx, r.gy), r])); R.mapSignature = mapSignature;
  }
  G.rooms.set(rkey(room.gx, room.gy), room);
  // Reuse client-only actor containers after the entire incoming snapshot has passed validation.
  for (const [id, entry] of nextActors) {
    const actor = R.actors.get(id) || { meta: null, loot: new Map(), input: { keys: [], pressed: [], pointer: { active: false } }, actions: [] };
    Object.assign(actor, entry, { meta: null }); nextActors.set(id, actor);
  }
  R.actors = nextActors;
  coopRuntimeSelf(); G.simDt = 0; G.trans = null; G.later = [];
  const selfEntry = snapshot.actors.find(a => a && a.id === COOP.selfId);
  coopViewSnapshot(roomChanged, G.time, selfEntry && Number.isSafeInteger(selfEntry.ack) ? selfEntry.ack : 0,
    selfEntry && selfEntry.inputAck, selfEntry && selfEntry.inputReset, selfEntry && selfEntry.inputQueued);
  if (roomChanged) G.camOff = worldCamera(G.room, G.player);
  if (G.cine && G.cine.c) { const c = G.chests.find(c => c.x === G.cine.c.x && c.y === G.cine.c.y); if (c) G.cine.c = c; }
  room.chests = G.chests; titleMenuRememberChapter(G.act, G.chapter); return true;
}
function coopRuntimeEquipmentValid(eq, capacity) {
  const itemAt = (it, slot) => it && it.slot === slot && typeof it.mod === 'function' && forgeItem(it.id) === it;
  if (!itemAt(eq.weapon, 'weapon') || eq.armor != null && !itemAt(eq.armor, 'armor') ||
      eq.boots != null && !itemAt(eq.boots, 'boots') || !Array.isArray(eq.trinkets) ||
      !Number.isInteger(capacity) || capacity < 0 || capacity > 16 || eq.trinkets.length > capacity ||
      !eq.trinkets.every(it => itemAt(it, 'trinket'))) return false;
  const items = [eq.weapon, eq.armor, eq.boots, ...eq.trinkets].filter(Boolean);
  return new Set(items.map(it => it.id)).size === items.length;
}
