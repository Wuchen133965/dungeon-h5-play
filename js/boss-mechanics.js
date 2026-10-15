'use strict';
// Local 1.9.2 pilot: three readable boss mechanics. Host owns timers and damage;
// presentation uses only plain entity fields already carried by the snapshots.
const BOSS_MECHANIC_PARTS = new WeakMap(), BOSS_MECHANIC_OWNER = new WeakMap();
function bossThreatEnabled(e, type) { return e.hp > 0 && (e[type + 'DisabledUntil'] || 0) <= G.time; }
function bossMechanicRest(e, time = 1.35) {
  e.t = 0; e.restActive = true; e.bossCycleStarted = true; e.noContact = false;
  e.kbx = e.kby = 0; enemyPunish(e, time);
}
function startKingRush(e, left, speed) {
  const p = G.player, a = Math.atan2(p.y - e.y, p.x - e.x);
  e.kingRush = { stage: 'tell', t: .7, left, a, speed: 175 * speed, lastX: e.x, lastY: e.y, elapsed: 0 };
  e.tele = .7; e.noContact = true; e.t = 10;
  trackedWarn(e, { shape: 'line', x: e.x, y: e.y - 3, a, len: 175 * speed * .5, w: 18 }, .7, () => {}, [255, 100, 70]);
  addFloat(e.x, e.y - e.h - 10, left > 1 ? '连冲 · 2' : '冲锋', '#ffb080');
}
function updateKingRush(e, dt, speed) {
  const q = e.kingRush; q.t -= dt;
  if (q.stage === 'tell') {
    e.tele = Math.max(0, q.t);
    if (q.t <= 0) { q.stage = 'dash'; q.t = .5; q.lastX = e.x; q.lastY = e.y; e.noContact = false; }
    return Z0;
  }
  q.elapsed += dt;
  const moved = Math.hypot(e.x - q.lastX, e.y - q.lastY);
  q.lastX = e.x; q.lastY = e.y;
  const wall = q.elapsed > .08 && moved < q.speed * dt * .25;
  if (wall || q.t <= 0) {
    if (!wall && q.left > 1) { startKingRush(e, q.left - 1, speed); return Z0; }
    e.kingRush = null; e.tele = 0; cancelTrackedWarn(e); bossMechanicRest(e);
    addFloat(e.x, e.y - e.h - 10, wall ? '撞墙 · 反击!' : '力竭 · 反击!', '#9ae8aa');
    if (wall) { SFX.slam(); shake(3); }
    return Z0;
  }
  return V(q.a, q.speed);
}
// Find a walkable tile near the boss, so melee never needs to cross a wall to hit a component.
function bossPartSpot(e, side) {
  const candidates = [];
  for (let y = 2; y < RH - 2; y++) for (let x = 2; x < RW - 2; x++) {
    if (G.room.tiles[y * RW + x] !== 0 || !tileFree(x, y)) continue;
    const px = (x + .5) * TS, py = (y + .5) * TS;
    candidates.push({ x: px, y: py, score: Math.hypot(px - (e.x + side * 42), py - e.y) });
  }
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0] || freeSpot(G.room, 20, G.player.x, G.player.y);
}
function ensureTreantRoots(e) {
  let parts = BOSS_MECHANIC_PARTS.get(e);
  if (!parts) { parts = {}; BOSS_MECHANIC_PARTS.set(e, parts); }
  for (const [i, type] of ['root', 'spore'].entries()) {
    if (parts[type]?.hp > 0 || !bossThreatEnabled(e, type)) continue;
    const spot = bossPartSpot(e, i ? 1 : -1), node = spawnEnemy('treantRoot', spot.x, spot.y, .7);
    Object.assign(node, { hp: Math.max(3, Math.round(e.max * .08)), mechanicPart: type, noContact: true });
    node.max = node.hp; parts[type] = node; BOSS_MECHANIC_OWNER.set(node, e);
  }
}
// Components share the owner's hit ledger, including charged shots and flywheel legs.
// Their HP is a break threshold, not extra boss HP, and they never pay kill/loot procs.
function bossMechanicBeforeHit(e, n, crit, dx, dy, o, budget) {
  if (e.kind === 'voidGod' && e.coreShield && !o.coreTransfer) return true;
  if (e.mechanicPart === 'decoy') {
    if (n > 0) { e.hp = 0; e.dead = true; burst(e.x, e.y - 8, 5, ['#b8d8ef'], { sp: 30, life: .2 }); }
    return true;
  }
  if ((e.kind === 'treant' || e.kind === 'voidGod') && !budget.damagePaid) {
    budget.damageCap = Math.max(1, Math.round(n * (o.melee && enemyCombatWindow(e) ? e.broken > 0 ? 1.2 : 1.1 : 1)));
    budget.damagePaid = new WeakMap(); budget.procPaid = new WeakSet();
  }
  if (e.kind !== 'treantRoot' && e.kind !== 'voidCore') return false;
  const owner = BOSS_MECHANIC_OWNER.get(e);
  if (!owner || owner.hp <= 0 || e.spawn > 0 || !(n > 0)) return true;
  const before = owner.hp;
  damageEnemy(owner, n, crit, dx, dy, { ...o, kb: 0, coreTransfer: e.kind === 'voidCore' });
  const paid = Math.max(0, before - owner.hp);
  e.hp -= paid; e.flash = paid ? .1 : e.flash;
  if (e.hp <= 0) {
    e.hp = 0; e.dead = true;
    if (e.kind === 'voidCore') { encounterCancel(e); voidCoreBroken(owner); return true; }
    owner[e.mechanicPart + 'DisabledUntil'] = G.time + 8;
    addFloat(e.x, e.y - e.h - 8, (e.mechanicPart === 'root' ? '根刺' : '孢子') + '停止 8 秒', '#9ae8aa');
    // Stop root tells already on the ground; spore bullets already fired remain visible and dodgeable.
    if (e.mechanicPart === 'root') G.warns = G.warns.filter(w => !(w.threat === 'root' && ENEMY_CAST_OWNERS.get(w) === owner));
    burst(e.x, e.y - 5, 10, ['#7ad060', '#e0cb70'], { sp: 50, life: .35 });
  }
  return true;
}
function bossMechanicAfterHit(e) {
  if (e.mirrorRitual) finishMirrorRitual(e, true);
}
function startMirrorRitual(e) {
  const p = G.player;
  e.immune = e.reflect = false; e.mirrorRitual = true; e.noContact = true; e.t = 10;
  const parts = [];
  for (const side of [-1, 1]) {
    const spot = bossPartSpot(e, side), m = spawnEnemy('mirrorDecoy', spot.x, spot.y, 0);
    m.mechanicPart = 'decoy'; m.noContact = true; m.face = e.face;
    BOSS_MECHANIC_OWNER.set(m, e); parts.push(m);
  }
  BOSS_MECHANIC_PARTS.set(e, parts);
  addFloat(e.x, e.y - e.h - 14, '击中裂光真身 · 打断', '#ffe4a0', true);
  const a = Math.atan2(p.y - 3 - (e.y - 3), p.x - e.x);
  trackedWarn(e, { shape: 'cone', x: e.x, y: e.y - 3, a, len: 90, arc: .6 }, 2.2, w => {
    if (!e.mirrorRitual || e.hp <= 0) return;
    shapeHit(w, 1); SFX.slam(); finishMirrorRitual(e, false);
  }, [255, 90, 110]);
}
function finishMirrorRitual(e, interrupted) {
  e.mirrorRitual = false; cancelTrackedWarn(e);
  for (const m of BOSS_MECHANIC_PARTS.get(e) || []) { m.hp = 0; m.dead = true; }
  BOSS_MECHANIC_PARTS.delete(e); bossMechanicRest(e);
  addFloat(e.x, e.y - e.h - 10, interrupted ? '识破 · 反击!' : '收招 · 反击!', '#9ae8aa');
}
EDEF.treantRoot = { hp: 3, hw: 6, hh: 5, h: 12, spr: () => SPR.shroom, gold: [0, 0], col: ['#80c860', '#e4c870'], harmless: true, name: '古树根瘤' };
EDEF.mirrorDecoy = { hp: 18, hw: 5, hh: 4, h: 14, scale: 1.5, artScale: 1, spr: EDEF.mirrorKnight.spr,
  gold: [0, 0], col: ['#c8d8ff', '#ffffff'], harmless: true, name: '无害幻影' };
for (const kind of ['treantRoot', 'mirrorDecoy']) AI[kind] = e => {
  const owner = BOSS_MECHANIC_OWNER.get(e);
  if (!owner || owner.hp <= 0) { e.hp = 0; e.dead = true; }
  e.kbx = e.kby = 0; return Z0;
};
function drawBossMechanic(e, time, y) {
  drawEncounterMechanic(e, y);
  if (e.kind === 'treantRoot') {
    const col = e.mechanicPart === 'root' ? '#ffb36d' : '#d4a0ff';
    g.save(); g.strokeStyle = col; g.lineWidth = 1;
    g.beginPath(); g.ellipse(e.x, y - 2, 10, 6, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = col; g.font = '7px sans-serif'; g.textAlign = 'center';
    g.fillText(e.mechanicPart === 'root' ? '根刺' : '孢子', e.x, y - 18);
    px(e.x - 9, y - 15, 18, 2, '#241724'); px(e.x - 9, y - 15, 18 * clamp(e.hp / e.max), 2, col); g.restore();
  }
  if (e.mirrorRitual) {
    g.save(); g.strokeStyle = '#fff0a0'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(e.x - 3, y - 20); g.lineTo(e.x + 2, y - 15); g.lineTo(e.x - 2, y - 10); g.lineTo(e.x + 3, y - 6); g.stroke();
    g.strokeStyle = '#ffd060'; g.lineWidth = 1; g.beginPath(); g.arc(e.x, y - 12, 16, -.8, .8); g.stroke(); g.restore();
  }
}
