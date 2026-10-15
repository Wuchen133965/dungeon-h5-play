'use strict';
// ============================================================ co-op: host snapshot serialization (split from coop-runtime.js)
// Depends on coop-runtime.js (COOP_RUNTIME, coopRuntimeActors, coopRuntimeCapture). Loaded right after it.
// Display data uses 3 decimals to reduce JSON size. Replay timers retain their
// precision: rounding a near-zero roll timer can add or remove a whole movement tick.
const coopRuntimeQuant = v => Number.isInteger(v) ? v : Math.round(v * 1000) / 1000;
function coopRuntimeWire(value, seen = new WeakSet()) {
  if (value === null || value === undefined || typeof value === 'function') return null;
  if (typeof value !== 'object') return typeof value !== 'number' ? value : Number.isFinite(value) ? coopRuntimeQuant(value) : 0;
  if (value.id && ITEM_BY_ID[value.id] === value) return { $item: value.id };
  if (typeof value.getContext === 'function' || value.nodeType) return null;
  if (seen.has(value)) return null; seen.add(value);
  if (value instanceof Set) { const out = { $set: [...value].map(v => coopRuntimeWire(v, seen)) }; seen.delete(value); return out; }
  if (value instanceof Map) { const out = { $map: [...value].map(([k, v]) => [coopRuntimeWire(k, seen), coopRuntimeWire(v, seen)]) }; seen.delete(value); return out; }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) { const out = Array.from(value, v => coopRuntimeWire(v, seen)); seen.delete(value); return out; }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === 'hit' && v instanceof Set) { out[k] = { $set: [] }; continue; }
    if (k === 'orbHit' && v instanceof Map) { out[k] = { $map: [] }; continue; }
    if (!['canvas', 'img', 'white', 'whiteFlip', 'onDone', 'fn', 'onHit', 'onHitE', 'link', 'home', 'owner', 'room', 'attackCtx'].includes(k) && typeof v !== 'function') out[k] = coopRuntimeWire(v, seen);
  }
  seen.delete(value); return out;
}
function coopRuntimeUnwire(value) {
  if (!value || typeof value !== 'object') return value;
  if (value.$item) return forgeItem(value.$item) || POTION;
  if (value.$set) return new Set(value.$set.map(coopRuntimeUnwire));
  if (value.$map) return new Map(value.$map.map(([k, v]) => [coopRuntimeUnwire(k), coopRuntimeUnwire(v)]));
  if (Array.isArray(value)) return value.map(coopRuntimeUnwire);
  const o = {}; for (const [k, v] of Object.entries(value)) o[k] = coopRuntimeUnwire(v); return o;
}
function coopRuntimeSnapshot() {
  if (!coopRuntimeIsHost()) return null;
  coopRuntimeCapture(COOP_RUNTIME.actors.get(COOP.selfId));
  for (const actor of COOP_RUNTIME.actors.values()) coopRuntimeInputState(actor);
  const R = COOP_RUNTIME, world = {};
  // Stable ids let clients match an entity across snapshots and glide it between them.
  coopRuntimeTagNet(G.enemies, G.shots, G.pickups, ...coopRuntimeActors().map(a => a.context.minions || []));
  for (const k of ['act', 'chapter', 'floor', 'gfloor', 'startCh', 'diff', 'time', 'runTime', 'enemies', 'pickups', 'warns', 'flames', 'banner', 'fade', 'shake', 'flash', 'hurtFlash', 'uiCoins']) world[k] = coopRuntimeWire(G[k]);
  // Tiles and the floor map are cold data: re-wire them only when their content changes, and tag each with a
  // revision so the transport can skip re-diffing them and clients can skip per-tile compares / string signatures.
  world.shots = coopRuntimeShotsWire();
  world.room = coopRuntimeWire({ ...G.room, tiles: null }); world.room.pickups = null; world.room.chests = null;
  world.room.tiles = coopRuntimeTilesWire(G.room); world.tilesRev = R.tilesRev;
  // Cosmetic particles / floating numbers / rings / bolts are simulated locally by clients: only send the new ones.
  world.fx = coopRuntimeFreshFx();
  world.rooms = coopRuntimeRoomsWire(); world.mapRev = R.mapRev;
  return { version: 1, runId: R.runId, seq: ++R.seq, roomRevision: R.roomRevision,
    ended: R.ended, world, actors: coopRuntimeActors().map(a => {
      const cine = a.context.cine;
      const context = coopRuntimeWire(cine && Number.isSafeInteger(cine.sparkSeed) ?
        { ...a.context, cine: { ...cine, sparks: [] } } : a.context);
      if (a.inputSteps) for (const key of ['rolling', 'rollT', 'rollAttackT', 'atkT', 'swing', 'stun', 'slow', 'chargeT'])
        context.player[key] = a.context.player[key];
      return { id: a.id, name: a.name, connected: a.connected, downed: a.downed,
      // ack: newest input packet the host has applied for this member, so its client can replay only newer movement
      ack: a.ack || 0, ...(a.inputSteps ? { inputAck: a.inputAck || 0, inputReset: a.inputReset || 0, inputQueued: a.inputSteps.length } : {}),
      mapRooms: floorMapActorRooms(a), context };
    }) };
}
// ---------------------------------------------------------------- cold-data revisions (host)
// Exact element compare against a private copy (no hashing, so no false "unchanged"). Tiles are mutated in place by
// several mechanics (crystals, walls, fun rooms), so a write-hook counter would be fragile; 392 int compares is not.
function coopRuntimeTilesWire(room) {
  const R = COOP_RUNTIME, tiles = room && room.tiles;
  if (!tiles) { R.tilesRoom = null; R.tilesWire = null; return null; }
  let same = R.tilesRoom === room && R.tilesCopy && R.tilesCopy.length === tiles.length;
  if (same) for (let i = 0; i < tiles.length; i++) if (R.tilesCopy[i] !== tiles[i]) { same = false; break; }
  if (!same) {
    R.tilesRoom = room; R.tilesCopy = Array.from(tiles); R.tilesWire = coopRuntimeWire(tiles);
    R.tilesRev = (R.tilesRev || 0) + 1;
  }
  return R.tilesWire;
}
const coopRuntimeRoomWire = r => ({ gx: r.gx, gy: r.gy, doors: { ...r.doors }, type: r.type, visited: !!r.visited, cleared: !!r.cleared, locked: !!r.locked,
  fountain: r.fountain ? { used: !!r.fountain.used } : null, altar: r.altar ? { used: !!r.altar.used } : null });
function coopRuntimeRoomWireSame(a, r) {
  if (a.gx !== r.gx || a.gy !== r.gy || a.type !== r.type || a.visited !== !!r.visited || a.cleared !== !!r.cleared || a.locked !== !!r.locked ||
      (a.fountain ? !r.fountain || a.fountain.used !== !!r.fountain.used : !!r.fountain) || (a.altar ? !r.altar || a.altar.used !== !!r.altar.used : !!r.altar)) return false;
  const d = r.doors || {}; let n = 0;
  for (const k in d) { if (a.doors[k] !== d[k]) return false; n++; }
  return Object.keys(a.doors).length === n;
}
function coopRuntimeRoomsWire() {
  const R = COOP_RUNTIME, prev = R.roomsWire;
  let same = !!prev && prev.length === G.rooms.size, i = 0;
  if (same) for (const r of G.rooms.values()) if (!coopRuntimeRoomWireSame(prev[i++], r)) { same = false; break; }
  if (!same) { R.roomsWire = [...G.rooms.values()].map(coopRuntimeRoomWire); R.mapRev = (R.mapRev || 0) + 1; }
  return R.roomsWire;
}
// ---------------------------------------------------------------- straight projectiles as trajectory segments
// A straight shot is fully described by seg = { t, x, y, vx, vy, life, rot } (host time, position, per-second
// velocity incl. time scale). While it still matches, x / y / rot / life are left off the wire, so the delta
// transport resends nothing for it; the client derives its position for any time. Turning, held, orbiting,
// boomerang and accelerating shots keep sending positions. A bounce or slow-zone change just starts a new segment.
const coopShotBallistic = s => !s.motion && !s.homing && !s.acc && !(s.seek && s.seek.t > 0) && !s.home && !s.orbit && !(s.hold > 0);
function coopRuntimeShotsWire() {
  const t = G.time;
  return (G.shots || []).map(s => {
    if (!coopShotBallistic(s) || !Number.isFinite(s.x) || !Number.isFinite(s.y)) { s.seg = null; return coopRuntimeWire(s); }
    const k = s.tmul || 1, vx = s.vx * k, vy = s.vy * k, g = s.seg, d = g ? t - g.t : 0;
    if (!g || g.vx !== vx || g.vy !== vy || Math.abs(g.x + vx * d - s.x) > .05 || Math.abs(g.y + vy * d - s.y) > .05)
      s.seg = { t, x: s.x, y: s.y, vx, vy, life: s.life, rot: s.rot || 0 };
    const { x, y, rot, life, ...rest } = s;
    return coopRuntimeWire(rest);
  });
}
// Client: position / life / spin of a segment shot at host time t (written into `out`).
function coopShotAt(s, t, out = s, g = s.seg) {
  const d = t - g.t;
  out.x = g.x + g.vx * d; out.y = g.y + g.vy * d; out.life = g.life - d; out.rot = g.rot + d * 14;
  return out;
}
const coopShotSegValid = g => !!g && typeof g === 'object' && ['t', 'x', 'y', 'vx', 'vy', 'life', 'rot'].every(k => Number.isFinite(g[k]));
// ---------------------------------------------------------------- network economy helpers (host)
function coopRuntimeTagNet(...lists) { const R = COOP_RUNTIME; for (const list of lists) for (const o of list || []) if (!o.nid) o.nid = R.nid = (R.nid || 0) + 1; }
const COOP_FX_KEYS = ['parts', 'floats', 'rings', 'bolts'], COOP_FX_CAP = 220;
function coopRuntimeFreshFx() {
  const R = COOP_RUNTIME, out = {};
  if (!R.fxSent) R.fxSent = new WeakSet();
  for (const k of COOP_FX_KEYS) {
    const fresh = [];
    for (const o of G[k] || []) if (!R.fxSent.has(o)) { R.fxSent.add(o); if (fresh.length < COOP_FX_CAP) fresh.push(o); }
    out[k] = coopRuntimeWire(fresh);
  }
  return out;
}
