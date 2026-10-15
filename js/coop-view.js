'use strict';
// ============================================================ co-op: client view interpolation / prediction + actor drawing (split from coop-runtime.js)
// ---------------------------------------------------------------- client view smoothing (render only)
// Game state stays exactly as the host sent it; only the drawn positions glide.
// Teammates, enemies and all projectiles interpolate at the received snapshot cadence.
// The local hero replays unacknowledged input.
// rt is host time for interpolation; buffer covers the actual snapshot interval plus jitter.
const COOP_VIEW = { ents: new Map(), since: 0, viewSince: 0, frameDriven: false, hostT: null, rt: null, shotT: null, delay: .11, jitter: 0, pending: [], pred: null, command: null, outbox: [], inputReset: 0, inputRate: 1, cine: null };
const COOP_VIEW_DELAY = 0.11, COOP_VIEW_HIST = 10;
const COOP_VIEW_POSE_KEYS = ['x', 'y', 'walk', 'moving', 'face', 'rolling', 'rdx', 'rdy', 'swing', 'swingT', 'swingAng', 'alt', 'anim', 'flash', 'rot', 'charging', 'chargeT', 'chargeWeapon', 'chargeRoom', 'attackLevel', 'attackShape', 'attackPose', 'commandMarkX', 'commandMarkY', 'commandMarkT'];
const COOP_VIEW_POSE_POOL = [], COOP_VIEW_SHOT_AT = { x: 0, y: 0, life: 0, rot: 0 };
function coopViewReset() { const V = COOP_VIEW; V.ents.clear(); V.since = V.viewSince = 0; V.hostT = null; V.rt = null; V.shotT = null; V.delay = COOP_VIEW_DELAY; V.jitter = 0; V.pending = []; V.pred = null; V.command = null; V.outbox = []; V.inputReset = 0; V.inputRate = 1; V.cine = null; }
function coopViewEach(fn) {
  for (const e of G.enemies || []) if (e && e.nid) fn('e' + e.nid, e);
  for (const s of G.shots || []) if (s && s.nid) fn('s' + s.nid, s);
  for (const c of G.pickups || []) if (c && c.nid) fn('k' + c.nid, c);
  for (const a of COOP_RUNTIME.actors.values()) {
    if (a.context.player) fn('a' + a.id, a.context.player);
    for (const m of a.context.minions || []) if (m && m.nid) fn('m' + m.nid, m);
  }
}
const coopViewFresh = o => ({ x: o.x, y: o.y, ax: o.x, ay: o.y, vx: 0, vy: 0 });
function coopViewCanPredict() {
  const p = G.player, a = COOP_RUNTIME.actors.get(COOP.selfId);
  return !!(p && a && !a.downed && !COOP_RUNTIME.ended && G.mode === 'play' && !G.trans &&
    !(typeof COOP_UI !== 'undefined' && COOP_UI.open));
}
function coopViewInput(command) { COOP_VIEW.command = command; }
function coopViewQueueInput(command) {
  const V = COOP_VIEW, p = V.pred || G.player;
  if (command.pressed.includes('attackUp') && !command.pressed.includes('attackCancel') && !command.pressed.includes('roll') && p?.charging && p.chargeT >= .8) SFX.chargeRelease(p.wpn.ranged);
  if (V.outbox.length >= coopInputQueueLimit()) {
    V.outbox = []; V.pending = []; V.pred = null;
    COOP.send({ type: 'input:reset', runId: COOP.runId });
  }
  const step = { seq: COOP.inputStepSeq = (COOP.inputStepSeq || 0) + 1,
    keys: [...command.keys], pressed: [...command.pressed], pointer: { ...command.pointer } };
  V.outbox.push(step); V.command = step;
}
// Movement and pose only. Combat effects and damage remain authoritative.
function coopViewStep(p, command, dt) {
  const keys = command.keys || [], mv = norm({ x: Number(keys.includes('right')) - Number(keys.includes('left')),
    y: Number(keys.includes('down')) - Number(keys.includes('up')) });
  p.atkT -= dt; p.rollT -= dt; p.swing -= dt; p.slow -= dt;
  updAttackRecovery(p, dt);
  if (p.stun > 0) { cancelPlayerCharge(p); p.stun -= dt; p.moving = false; playerKnockbackStep(p, dt, .8); return; }
  if (p.rolling > 0) {
    cancelPlayerCharge(p);
    const rk = mechCall('rollMul', p) || 1;
    p.rolling -= dt; moveBox(p, p.rdx * 205 * rk * dt, p.rdy * 205 * rk * dt, 'player');
    if (G.room.stall) pushOut(p, G.room.stall); return;
  }
  const sp = p.speed * playerSwingMove(p) * (p.charging && p.chargeT >= COMBAT_CHARGE.tell ? .75 : 1) * (p.slow > 0 ? .6 : 1);
  let vx = mv.x * sp, vy = mv.y * sp;
  // Terrain movement hooks only change this clone; discard the ice hook's cosmetic spawn during replay.
  const parts = G.parts; G.parts = [];
  try { const mm = mechCall('move', p, dt, vx, vy); if (mm) { vx = mm.x; vy = mm.y; } }
  finally { G.parts = parts; }
  const kb = playerKnockbackStep(p, dt);
  moveBox(p, vx * dt + kb.x, vy * dt + kb.y, 'player');
  if (G.room.stall) pushOut(p, G.room.stall);
  p.x = clamp(p.x, 4, RPW - 4); p.y = clamp(p.y, 7, RPH - 3);
  p.moving = Math.hypot(mv.x, mv.y) > .15;
  if (p.moving) { p.walk += dt; if (p.swing <= 0 && !command.pointer?.active) p.face = Math.atan2(mv.y, mv.x); }
  if (command.pointer?.active && Number.isFinite(command.pointer.worldX) && Number.isFinite(command.pointer.worldY))
    p.face = Math.atan2(command.pointer.worldY - (p.y - 6), command.pointer.worldX - p.x);
  if ((command.pressed || []).includes('roll') && p.rollT <= 0) {
    const d = p.moving ? mv : { x: Math.cos(p.face), y: Math.sin(p.face) };
    cancelPlayerCharge(p); p.rdx = d.x; p.rdy = d.y; p.rolling = .2; p.rollAttackT = .5; p.rollT = p.rollCd;
  }
  stepPlayerCharge(p, keys, command.pressed || [], dt, level => {
    const lunge = level ? 0 : playerAttackLunge(p);
    playerAttackPose(p, playerAttackSpeed(p)); setPlayerAttackVisual(p, level);
    p.kbx += Math.cos(p.face) * lunge; p.kby += Math.sin(p.face) * lunge;
  });
}
function coopViewPredict() {
  const q = { ...G.player };
  for (const b of COOP_VIEW.pending) coopViewStep(q, b.command, b.dt);
  return q;
}
function coopViewSnapshot(roomChanged, hostTime, ack, inputAck, inputReset, inputQueued) {
  const V = COOP_VIEW;
  if (roomChanged) coopViewReset();
  // Let a temporary host backlog drain by slowing input production and its
  // matching prediction together, never by rushing authoritative combat time.
  V.inputRate = Number.isInteger(inputQueued) && inputQueued > 3 && inputQueued <= coopInputQueueLimit() ? .9 : 1;
  const gap = V.hostT === null || !Number.isFinite(hostTime) ? 0.05 : clamp(hostTime - V.hostT, 0.016, 1.5);
  if (V.hostT !== null && Number.isFinite(hostTime)) {
    // Use arrival variation rather than RTT: a stable high-latency link needs no extra interpolation buffer.
    V.jitter += (Math.abs(V.viewSince - gap) - V.jitter) * .1;
    // Tap snapshots are nominally 8 Hz and may span several 80ms message slots.
    // A 75ms buffer repeatedly runs dry even on a perfectly stable 8 Hz stream.
    const target = clamp(Math.max(.075, gap + .025) + 2 * V.jitter, .075, 1.5);
    V.delay += (target - V.delay) * (target > V.delay ? .5 : .03);
  }
  V.hostT = Number.isFinite(hostTime) ? hostTime : null; V.since = V.viewSince = 0;
  const next = new Map();
  coopViewEach((key, o) => {
    if (!Number.isFinite(o.x) || !Number.isFinite(o.y)) return;
    const prior = V.ents.get(key);
    const old = prior && (prior.blinkSeq || 0) === (o.blinkSeq || 0) ? prior : null;
    const it = old || coopViewFresh(o); it.blinkSeq = o.blinkSeq || 0;
    if (key[0] === 's') {
      if (o.seg) {
        const segments = it.segments || (it.segments = []);
        if (!segments.length || segments[segments.length - 1].t !== o.seg.t) {
          segments.push(o.seg); if (segments.length > COOP_VIEW_HIST) segments.shift();
        }
      } else it.segments = null;
    }
    if (old) { it.vx = clamp((o.x - old.ax) / gap, -420, 420); it.vy = clamp((o.y - old.ay) / gap, -420, 420); }
    if (key[0] === 's' && Number.isFinite(o.vx) && Number.isFinite(o.vy)) { it.vx = o.vx; it.vy = o.vy; }
    if (old && key[0] !== 's' && !(o === G.player && coopViewCanPredict()) && Math.hypot(o.x - old.ax, o.y - old.ay) > Math.max(48, gap * 420)) {
      it.x = o.x; it.y = o.y; it.h = null; if (key[0] !== 's') it.vx = it.vy = 0;
    }   // Room changes reset prediction; a delayed self position is not a teleport.
    // position history in host time: teammates, enemies, minions and pickups are drawn by interpolating it
    if (Number.isFinite(hostTime)) { const h = it.h || (it.h = []);
      if (!old && key[0] === 's' && Number.isFinite(o.bornAt) && o.bornAt < hostTime &&
          Number.isFinite(o.bornX) && Number.isFinite(o.bornY)) h.push([o.bornAt, o.bornX, o.bornY]);
      if (!h.length || hostTime > h[h.length - 1][0]) { h.push([hostTime, o.x, o.y]); if (h.length > COOP_VIEW_HIST) h.shift(); } }
    it.ax = o.x; it.ay = o.y; next.set(key, it);
  });
  V.ents = next;
  // Increasing the buffer slows the render clock; it never rewinds displayed positions.
  if (Number.isFinite(hostTime)) { const want = hostTime - V.delay;
    if (V.rt === null || roomChanged) V.rt = want; }
  // Movement the host has already applied is inside the authoritative position; replay only the newer keys.
  if (Number.isSafeInteger(inputReset) && inputReset >= 0 && inputReset !== V.inputReset) {
    // An overflow, expired queue, room change or menu transition is an explicit
    // resynchronization, never a false acknowledgement of discarded movement.
    V.inputReset = inputReset; V.pending = []; V.outbox = []; V.command = null;
  }
  V.pending = V.pending.filter(b => Number.isSafeInteger(inputAck) && b.step ? b.seq > inputAck : (b.packet || b.seq) > (ack || 0)).slice(-90);
  V.pred = coopViewCanPredict() ? coopViewPredict() : null;
  const C = G.cine;
  if (!C || G.mode !== 'chest') V.cine = null;
  else {
    if (!V.cine || V.cine.startAt !== C.startAt || V.cine.x !== C.c.x || V.cine.y !== C.c.y || C.t < V.cine.sourceT - .05)
      V.cine = { startAt: C.startAt, x: C.c.x, y: C.c.y, t: C.t };
    V.cine.t = Math.max(V.cine.t, C.t); V.cine.sourceT = C.t;
    if (C.opened && Number.isSafeInteger(C.sparkSeed) && V.cine.seed !== C.sparkSeed) {
      V.cine.seed = C.sparkSeed; V.cine.sparks = chestSparks(C);
    }
  }
}
// position at host time t from a [t, x, y] history: blend the two samples around t, hold the newest when t runs past it
function coopViewSample(h, t) {
  if (t <= h[0][0]) return [h[0][1], h[0][2]];
  for (let i = h.length - 1; i > 0; i--) if (h[i - 1][0] <= t) {
    const a = h[i - 1], b = h[i]; if (t >= b[0]) return [b[1], b[2]];
    const u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  }
  const z = h[h.length - 1]; return [z[1], z[2]];
}
function coopViewTick(dt, viewDt = dt) {
  const V = COOP_VIEW; if (!(dt > 0 || viewDt > 0)) return;
  V.since += dt; V.viewSince += viewDt;
  if (V.cine && G.cine && G.mode === 'chest' && viewDt > 0 && V.viewSince <= .5) {
    const want = G.cine.t + V.viewSince;
    V.cine.t += viewDt * clamp(1 + (want - V.cine.t - viewDt) * 4, .85, 1.15);
  }
  if (V.rt !== null && V.hostT !== null) {                     // advance the render clock, gently re-centred on the snapshot stream
    const want = V.hostT + V.viewSince - V.delay;
    const lag = want - (V.rt + viewDt), rate = clamp(1 + lag * 4, .85, 1.5);
    V.rt = Math.max(V.rt, Math.min(V.rt + viewDt * rate, V.hostT));      // never runs backwards or past the newest sample
    // Own bullets use a paced present clock; changing the interpolation delay must not rewind or jump them.
    const present = V.rt + V.delay;
    if (V.shotT === null) V.shotT = present;
    else V.shotT = Math.max(V.shotT, Math.min(V.shotT + viewDt * clamp(1 + (present - V.shotT - viewDt) * 4, .85, 1.5), V.hostT + V.delay));
  }
  const ext = Math.min(V.viewSince, 0.1), k = 1 - Math.exp(-viewDt * 18), self = G.player;
  let move = { x: 0, y: 0 };
  if (coopViewCanPredict() && typeof COOP !== 'undefined') {
    if (!V.pred) V.pred = { ...self };
    if (dt > 0 && V.since <= coopInputQueueLimit() * COOP_INPUT_STEP) {
      const command = V.command || { keys: [...Input.keys], pressed: [], pointer: { ...Input.pointer } };
      // This frame occurs AFTER the last send; its movement cannot be covered by that packet's ack.
      V.pending.push({ seq: command.seq || (COOP.inputSeq || 0) + 1, packet: (COOP.inputSeq || 0) + 1,
        step: Number.isSafeInteger(command.seq), command, dt });
      if (V.pending.length > 90) V.pending.shift();
      const x = V.pred.x, y = V.pred.y; coopViewStep(V.pred, command, dt);
      move = { x: V.pred.x - x, y: V.pred.y - y };
    }
  } else { V.pending = []; V.pred = null; }
  V.command = null;
  const updatePosition = (key, o) => {
    if (!Number.isFinite(o.x) || !Number.isFinite(o.y)) return;
    let it = V.ents.get(key); if (!it) V.ents.set(key, it = coopViewFresh(o));
    it.segRot = null;
    if (o === self && V.pred) {
      it.x += move.x; it.y += move.y; it.x += (V.pred.x - it.x) * k; it.y += (V.pred.y - it.y) * k;
    } else if (key[0] === 's' && o.seg && V.hostT !== null) {
      // Straight shots have an exact trajectory: draw them at their true position for the frame's time, no buffer
      // needed. Our own shots use the present (they leave our predicted hero); others match the enemies' clock.
      // Both clocks advance smoothly between arrivals (rt is the paced render clock); a late snapshot cannot jerk them.
      const t = o.friendly && o.ownerId === COOP.selfId || V.rt === null ? V.shotT ?? V.hostT : V.rt;
      const segment = it.segments?.findLast(s => s.t <= t);
      if (segment) {
        coopShotAt(o, t, COOP_VIEW_SHOT_AT, segment); it.x = COOP_VIEW_SHOT_AT.x; it.y = COOP_VIEW_SHOT_AT.y; it.segRot = COOP_VIEW_SHOT_AT.rot;
      } else if (it.h?.length) { const at = coopViewSample(it.h, t); it.x = at[0]; it.y = at[1]; }
    } else if (!it.h || !it.h.length || V.rt === null) {
      // Legacy snapshots without host-time history retain bounded smoothing.
      if (V.viewSince <= 0.1) { it.x += it.vx * viewDt; it.y += it.vy * viewDt; }
      it.x += (o.x + it.vx * ext - it.x) * k; it.y += (o.y + it.vy * ext - it.y) * k;
    } else {
      // everything else is interpolated between two received positions: never guessed ahead, so never pulled back
      if (o === self) { it.x += (o.x - it.x) * k; it.y += (o.y - it.y) * k; }   // own hero while not predicting (menus, downed)
      else { const at = coopViewSample(it.h, V.rt); it.x = at[0]; it.y = at[1]; }
    }
    const target = o === self && V.pred ? V.pred : o;
    if ((o === self || !it.h) && Math.hypot(target.x - it.x, target.y - it.y) > 64) { it.x = target.x; it.y = target.y; }
  };
  // Fixed input ticks only move our predicted hero. Remote presentation advances
  // once per displayed frame, even when a slow frame needs several input ticks.
  if (viewDt > 0) coopViewEach(updatePosition);
  else if (self) updatePosition('a' + COOP.selfId, self);
  // Cosmetic effects are local: let them move and fade. Keep simDt at 0 so draw-time ambient spawns stay host-driven.
  if (viewDt > 0) { updParts(viewDt); G.simDt = 0; coopRuntimeDecayChestFx(G.chestFx, viewDt); }
}
// Swap in the drawn positions / animation clocks for one render pass; returns the undo.
function coopViewApply() {
  const V = COOP_VIEW, ext = Math.min(V.viewSince, 0.5), saved = [], undoCosmetics = coopViewCosmeticApply();
  coopViewEach((key, o) => {
    const it = V.ents.get(key); if (!it || !Number.isFinite(it.x)) return;
    const values = COOP_VIEW_POSE_POOL.pop() || []; values[0] = o;
    let n = 1;
    for (const k of COOP_VIEW_POSE_KEYS) if (k in o) { values[n++] = k; values[n++] = o[k]; }
    values.length = n;
    saved.push(values);
    o.x = it.x; o.y = it.y;
    if (o === G.player && V.pred) for (const k of ['walk', 'moving', 'face', 'rolling', 'rdx', 'rdy', 'swing', 'swingT', 'swingAng', 'alt', 'attackLevel', 'attackPose', 'charging', 'chargeT']) o[k] = V.pred[k];
    if (key[0] === 'a' && o !== G.player) { if (o.moving && Number.isFinite(o.walk)) o.walk += ext; if (o.swing > 0) o.swing = Math.max(0, o.swing - ext); }
    if (key[0] === 'e') { if (Number.isFinite(o.anim)) o.anim += ext; if (o.flash > 0) o.flash -= ext; }
    if (key[0] === 's' && o.seg && Number.isFinite(it.segRot)) {   // spin follows the same trajectory clock as the position
      o.rot = it.segRot;
    } else if (key[0] === 's' && Number.isFinite(o.rot) && !(o.hold > 0)) o.rot += ext * 14;
  });
  let restored = false;
  return () => {
    if (restored) return; restored = true;
    undoCosmetics();
    for (const values of saved) {
      for (let i = 1; i < values.length; i += 2) values[0][values[i]] = values[i + 1];
      values[0] = null; // Never retain a removed entity through the render cache.
      if (COOP_VIEW_POSE_POOL.length < 512) COOP_VIEW_POSE_POOL.push(values);
    }
  };
}
// Presentation only: authority still decides opening, rolled loot and whether a card is ready.
// World, HUD and item-card draws share one clock and restore every host-owned value afterwards.
function coopViewCosmeticApply() {
  const V = COOP_VIEW, ext = Math.min(V.viewSince, .5), time = G.time, cine = G.cine, coins = G.uiCoins;
  const c = cine && cine.c, open = c && c.open;
  const hadHop = cine && Object.hasOwn(cine, 'hop');
  const savedCine = cine && { t: cine.t, hop: cine.hop, cardT: cine.cardT, shown: cine.shown, sparks: cine.sparks };
  G.time = time + ext;
  G.uiCoins = (coins || []).map(u => ({ ...u, t: u.t + ext * 2.2 })).filter(u => u.t < 1);
  if (cine && V.cine && G.mode === 'chest') {
    const t = V.cine.t, age = Math.max(0, t - cine.t);
    // uiContext uses this object's identity to guard clicks; preserve it while drawing.
    Object.assign(cine, { t, hop: Math.max(0, (cine.hop || 0) - age), cardT: cine.cardT < 0 ? cine.cardT : cine.cardT + age });
    if (!cine.opened) for (let i = 0; i < cine.times.length; i++) if (t >= cine.times[i] && G.cine.shown <= cine.ups[i]) {
      G.cine.shown = cine.ups[i]; G.cine.hop = Math.max(0, .25 - (t - cine.times[i]));
    }
    if (cine.opened) {
      c.open = Math.min(1.15, open + age * 6);
      const sparks = V.cine.sparks || cine.sparks, u = V.cine.sparks ? Math.max(0, t - cine.openAt) : age;
      const decay = Math.pow(.985, u * 60), travel = (1 - decay) / (.015 * 60);
      G.cine.sparks = sparks.filter(s => s.life > u).map(s => ({ ...s, life: s.life - u,
        x: s.x + s.vx * travel, y: s.y + s.vy * u + 70 * u * (u + 1 / 60) }));
    }
  }
  return () => {
    G.time = time; G.cine = cine; G.uiCoins = coins; if (c) c.open = open;
    if (savedCine) { Object.assign(cine, savedCine); if (!hadHop) delete cine.hop; }
  };
}
function coopRuntimeDrawPlayer(actor, time) {
  // Appearance helpers read equipment; drawing never needs combat attribution or META swaps.
  const eq = G.eq; G.eq = actor.context.eq;
  try {
    const p = actor.context.player;
    if (actor.downed) { shadow(p.x, p.y, 7); g.globalAlpha = 0.55; drawSpr(g, heroAppearance(p), p.x, p.y + 3, { sy: 0.3 }); g.globalAlpha = 1; }
    else drawPlayer(p, time);
    const index = [...COOP_RUNTIME.actors.keys()].indexOf(actor.id), col = COOP_ACTOR_COLORS[index % 4];
    const height = heroVisualHeight(p);
    px(p.x - 5, p.y - height - 5, 10, 2, '#100a14'); px(p.x - 5, p.y - height - 5, Math.max(0, 10 * p.hp / p.maxHp), 1, actor.downed ? '#ff6070' : col);
  } finally { G.eq = eq; }
}
// UI draws after the world has restored authoritative positions. Read only the needed actor.
function coopViewPlayerPosition(actor) {
  const p = actor.context.player;
  if (COOP.role === 'client' && COOP_RUNTIME.lastApplied >= 0) {
    const at = COOP_VIEW.ents.get('a' + actor.id);
    if (at && Number.isFinite(at.x) && Number.isFinite(at.y)) return at;
  }
  return p;
}
