'use strict';
// ============================================================ enemy attack primitives (1.9.0)
// Shaped telegraphs, chained telegraphs, punish windows, budgeted bullet patterns and a pattern picker.
// Telegraphs stay plain data in G.warns (shape/a/len/w/r0/r1/arc numbers); the callback lives in w.fn, which
// coopRuntimeWire drops, so guests draw the same shapes. Damage resolves on the host for every living member
// (shapeHit is wrapped like areaHit in coop-runtime.js).
const ENEMY_ATTACK = Object.freeze({
  minionTell: .35, bossTell: .55,      // minimum telegraph durations
  minRadius: 10, minWidth: 8,          // smallest readable ground shapes on a phone in landscape
  shotBudget: 60,                      // enemy projectiles allowed on screen before patterns thin out
  minShots: 3,
});
const WARN_SHAPES = ['circle', 'line', 'cone', 'donut', 'rect'];
// Light/legacy radius for shaped warns (render light and anything that still reads w.r).
function warnShapeRadius(o) {
  if (o.shape === 'donut') return o.r1;
  if (o.shape === 'circle') return Math.max(ENEMY_ATTACK.minRadius, o.r || 0);
  return Math.max(ENEMY_ATTACK.minRadius, Math.min(18, (o.w || 0) * .8));
}
// warnShape({ shape, x, y, a, len, w, r, r0, r1, arc }, t, fn, col): circle = old warn(); line starts at x,y along a;
// rect is centred on x,y; cone has its apex at x,y (len = radius, arc = half angle); donut is safe inside r0.
function warnShape(o, t, fn, col = [255, 60, 80]) {
  const before = G.warns.length;
  warn(o.x, o.y, warnShapeRadius(o), t, fn, col);
  const w = G.warns[before]; if (!w) return null;
  w.shape = WARN_SHAPES.includes(o.shape) ? o.shape : 'circle';
  if (w.shape !== 'circle') w.a = o.a || 0;
  if (w.shape === 'line' || w.shape === 'rect' || w.shape === 'cone') w.len = o.len;
  if (w.shape === 'line' || w.shape === 'rect') w.w = Math.max(ENEMY_ATTACK.minWidth, o.w || 0);
  if (w.shape === 'cone') w.arc = o.arc || .5;
  if (w.shape === 'donut') { w.r0 = o.r0; w.r1 = Math.max(o.r1, o.r0 + ENEMY_ATTACK.minRadius); }
  if (o.track) w.track = o.track;    // number: seconds before landing when a tracking line locks (drawn brighter)
  return w;
}
function shapeContains(w, x, y, pad = 3) {
  const dx = x - w.x, dy = y - w.y;
  if (w.shape === 'line' || w.shape === 'rect') {
    const c = Math.cos(w.a), s = Math.sin(w.a), u = dx * c + dy * s, v = -dx * s + dy * c;
    const lo = w.shape === 'line' ? 0 : -w.len / 2, hi = w.shape === 'line' ? w.len : w.len / 2;
    return u >= lo - pad && u <= hi + pad && Math.abs(v) <= w.w / 2 + pad;
  }
  const d = Math.hypot(dx, dy);
  if (w.shape === 'cone') return d <= w.len + pad && (d < 6 || Math.abs(angDiff(w.a, Math.atan2(dy, dx))) <= w.arc);
  if (w.shape === 'donut') return d > w.r0 && d < w.r1 + pad;    // standing inside the hole (or hugging its edge) is safe
  return d < w.r + pad;
}
// Hurts the current-context player when inside the shape (host wraps this to resolve every member).
function shapeHit(w, n = 1, o = {}) {
  const p = G.player; if (!p || p.hp <= 0 || !shapeContains(w, p.x, p.y - 3)) return false;
  const before = p.inv; hurtPlayer(n, w.x, w.y, !!o.fire);
  if (p.inv > before && o.onHit) o.onHit(p);
  return p.inv > before;
}
// A list of shaped warns that appear one after another (gap seconds apart); each item: { ...shape, t, fn, col }.
// Two items on the same spot punish a roll that was spent on the first one.
function warnChain(list, gap = .3) {
  list.forEach((item, i) => {
    const place = () => warnShape(item, item.t || .6, item.fn, item.col);
    if (i === 0 || gap <= 0) place(); else G.later.push({ t: gap * i, fn: place });
  });
  return list.length;
}
// Recovery after a heavy move: contact and AI pause, the green window ring shows, and a full charge fits inside.
function enemyPunish(e, t = .8) { e.restT = Math.max(e.restT || 0, t); clearEnemyContact(e); return e.restT; }
function enemyShotCount() { let n = 0; for (const s of G.shots) if (!s.friendly) n++; return n; }
// Budgeted projectile patterns. o: { type, n, a, spread, sp, kind, shot, make(x,y,a,sp) }; returns the shots fired.
function emitPattern(x, y, o) {
  const free = ENEMY_ATTACK.shotBudget - enemyShotCount();
  const want = o.n || 8, n = Math.max(0, Math.min(want, Math.max(free, Math.min(want, ENEMY_ATTACK.minShots))));
  if (free <= 0 && !o.force) return 0;
  const sp = o.sp || 70, a = o.a || 0, fire = (ang, speed) => o.make ? o.make(x, y, ang, speed) : enemyShot(x, y, ang, speed, o.kind || 'bone', o.shot || {});
  for (let i = 0; i < n; i++) {
    if (o.type === 'fan') { const spread = o.spread ?? .8; fire(a + (n > 1 ? (i / (n - 1) - .5) * spread : 0), sp); }
    else if (o.type === 'wave') { const spread = o.spread ?? 1.2; fire(a + (n > 1 ? (i / (n - 1) - .5) * spread : 0), sp * (.75 + .25 * Math.cos(i / Math.max(1, n - 1) * Math.PI * 2))); }
    else if (o.type === 'aimedBurst') fire(a, sp * (1 - i * .12));
    else fire(a + i * Math.PI * 2 / n, sp);          // ring / spiral (spiral = ring with a caller-advanced a)
  }
  return n;
}
// Weighted choice that never repeats the previous move (unless it is the only option) and honours distance bands.
// table: [{ id, w = 1, min, max, when(e) }] -> id. Host-only (rand), so guests never need it.
function pickPattern(e, table, d = G.player ? dist(e.x, e.y, G.player.x, G.player.y) : 0) {
  const fits = m => (m.min === undefined || d >= m.min) && (m.max === undefined || d <= m.max) && (!m.when || m.when(e));
  let pool = table.filter(m => fits(m) && m.id !== e.lastPat);
  if (!pool.length) pool = table.filter(fits);
  if (!pool.length) return table[0].id;
  let roll = rand() * pool.reduce((s, m) => s + (m.w ?? 1), 0);
  for (const m of pool) { roll -= m.w ?? 1; if (roll <= 0) { e.lastPat = m.id; return m.id; } }
  e.lastPat = pool[pool.length - 1].id; return e.lastPat;
}
// ---------------------------------------------------------------- P3 armoured casts
// e.armor = { t, hp, max }: while it lasts ordinary hits only chip the armour (no flinch). A full charge (melee
// release or charged shot) or emptying the armour breaks it: the cast is cancelled (AI reads e.armorBroken),
// a minion staggers 0.6 s, a boss opens a 0.8 s punish window. One attack pays armour once.
const ENEMY_ARMOR = Object.freeze({ breakStagger: .6, bossWindow: .8 });
function enemyArmorCast(e, t, hp = 3) { e.armor = { t, hp, max: hp }; e.armorBroken = false; return e.armor; }
function enemyArmorHit(e, o = {}) {
  const A = e.armor; if (!A || !(A.t > 0)) { e.armor = null; return false; }
  const state = o.attackCtx ? combatAttackState(o.attackCtx) : null, paid = state && (state.armorPaid || (state.armorPaid = new WeakSet()));
  if (paid && paid.has(e)) return true;
  if (paid) paid.add(e);
  const charged = !!(o.meleeCharged || (o.shot && o.shot.attackLevel));
  if (!charged && --A.hp > 0) { if ((e.armorFxT || 0) <= G.time) { e.armorFxT = G.time + .3; addFloat(e.x, e.y - e.h - 6, '护甲', '#c8d8ff'); } return true; }
  e.armor = null; e.armorBroken = true; clearEnemyContact(e); cancelTrackedWarn(e);
  addFloat(e.x, e.y - e.h - 8, '破甲!', '#ffd080', true); ring(e.x, e.y - 3, e.hw + 14, [255, 208, 128], .3); SFX.block();
  if (EDEF[e.kind].boss) { enemyPunish(e, ENEMY_ARMOR.bossWindow); return false; }    // bosses still take posture
  e.meleeStagger = ENEMY_ARMOR.breakStagger; e.freezeResist = MELEE_COMBAT.controlRecovery; e.skillT = 0; e.skillReady = false;
  return true;
}
// ---------------------------------------------------------------- tracked telegraphs (aim follows, then locks)
// The warn object stays in G.warns (plain data, synced); the enemy -> warn link lives in a WeakMap, never in packets.
const TRACKED_WARNS = new WeakMap();
function trackedWarn(e, o, t, fn, col) { const w = warnShape(o, t, fn, col); if (w) TRACKED_WARNS.set(e, w); return w; }
function trackedWarnLive(e) { const w = TRACKED_WARNS.get(e); return w && w.t > 0 && G.warns.includes(w) ? w : null; }
function retargetWarn(e, a, x, y) {
  const w = trackedWarnLive(e); if (!w || (w.track && w.t <= w.track)) return w;
  w.a = a; if (x !== undefined) { w.x = x; w.y = y; } return w;
}
// A flinch or armour break interrupts the cast: its telegraph disappears and never lands.
function cancelTrackedWarn(e) {
  const w = TRACKED_WARNS.get(e); if (!w) return false;
  TRACKED_WARNS.delete(e); const had = G.warns.includes(w); if (had) G.warns = G.warns.filter(x => x !== w); return had;
}
// ---------------------------------------------------------------- P5 ground areas v2 / P6 sweeping walls
// Both live in G.flames as plain numbers (kind + timers), so guests draw them from the snapshot like fire patches.
// stepGroundArea runs once per patch per frame; groundAreaHit once per patch per living member (host).
//   tar:   slows; after `ignite` seconds it catches fire (damage until it burns out)
//   shock: harmless while `delay` counts down (drawn as a warning), then damages
//   wall:  after `delay` it sweeps from (x0,y0) along a at sp for `dist`; len across, one optional gap
//          (gc = gap centre offset, gw = gap width, optional gc2 = second gap). Rolling through it (invulnerable) is safe.
function groundArea(o) {
  const f = { x: o.x, y: o.y, r: o.r || 14, life: o.life || 2, kind: o.kind, delay: o.delay || 0 };
  if (o.kind === 'tar') f.ignite = o.ignite ?? 1.2;
  if (o.kind === 'wall') Object.assign(f, { x0: o.x, y0: o.y, a: o.a || 0, len: o.len, sp: o.sp || 70, d: 0, dist: o.dist, gc: o.gc ?? 0, gw: o.gw || 0, ...(o.gc2 !== undefined ? { gc2: o.gc2 } : {}),
    life: (o.delay || 0) + o.dist / (o.sp || 70), r: 10 });
  G.flames.push(f); return f;
}
function stepGroundArea(f, dt) {
  if (f.delay > 0) { f.delay = Math.max(0, f.delay - dt); return; }
  if (f.kind === 'tar' && f.ignite > 0 && (f.ignite -= dt) <= 0) {
    f.ignite = 0; f.lit = 1; SFX.fire(); burst(f.x, f.y, 12, ['#ff8a30', '#ffd060', '#3a2a1a'], { sp: 70, life: .4, up: true });
  }
  if (f.kind === 'wall') { f.d = Math.min(f.dist, f.d + f.sp * dt); f.x = f.x0 + Math.cos(f.a) * f.d; f.y = f.y0 + Math.sin(f.a) * f.d; }
}
function wallContains(f, x, y, pad = 3) {
  const c = Math.cos(f.a), s = Math.sin(f.a), dx = x - f.x, dy = y - f.y, u = dx * c + dy * s, v = -dx * s + dy * c;
  if (Math.abs(u) > 5 + pad || Math.abs(v) > f.len / 2) return false;
  return !(f.gw > 0 && (Math.abs(v - f.gc) < f.gw / 2 - pad || (f.gc2 !== undefined && Math.abs(v - f.gc2) < f.gw / 2 - pad)));
}
function groundAreaHit(f, p) {
  if (f.delay > 0 || f.life <= .1 || !p || p.hp <= 0) return;
  if (f.kind === 'wall') { if (p.rolling <= 0 && wallContains(f, p.x, p.y - 3)) hurtPlayer(1, f.x, f.y); return; }
  if (dist(f.x, f.y, p.x, p.y - 2) >= f.r) return;
  if (f.kind === 'tar') { if (f.lit) hurtPlayer(1, f.x, f.y, true); else p.slow = Math.max(p.slow, .45); return; }
  if (f.kind === 'shock') hurtPlayer(1, f.x, f.y);
}
// Cheap to sync: one plain entry, moved by the host each tick.
function sweepWall(o) { return groundArea({ ...o, kind: 'wall', delay: Math.max(ENEMY_ATTACK.minionTell, o.delay ?? .7) }); }
