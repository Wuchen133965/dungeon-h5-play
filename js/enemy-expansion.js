'use strict';
// ============================================================ 1.9.0 enemy expansion (acts 1-5)
// New regulars and their sprites (recoloured from existing rows), registered into EDEF / AI / ENAME / region pools.
// Attacks use enemy-attacks.js: shaped telegraphs (plain data, guests draw them), tracked aim that locks before
// landing, armoured casts broken by a full charge and short punish windows after heavy moves.
// Upgrades to existing enemies live next to their original AI (entities.js / act2..5.js).

// ---------------------------------------------------------------- sprites
const EXP_SKEL_FEET = [['....ow..wo....', '....ob..bo....', '...oww..wwo...', '...ooo..ooo...'], ['...ow....wo...', '...ob....bo...', '..oww....wwo..', '..ooo....ooo..']];
const expSkel = pal => EXP_SKEL_FEET.map(feet => makeSprite([...ART_SKEL_TOP, ...feet], pal));
SPR.skelArcher = expSkel({ o: '#1e2a22', b: '#7a8a6a', w: '#d8d4b8', h: '#f0ecd8', e: '#ffb040', n: '#2e3a2c', g: '#8a6a3a', c: '#3a6a4a' });
SPR.iceLancer = expSkel({ o: '#141e34', b: '#5a7aa8', w: '#d8ecff', h: '#ffffff', e: '#60d8ff', n: '#22324e', g: '#a8e0ff', c: '#3a5a8a' });
// big rolling snowball (yeti): the act-2 snow shot, scaled up when its radius says so
const SHOT_DRAW_SNOW = SHOT_DRAW.snow;
SHOT_DRAW.snow = s => {
  if (!(s.r >= 6)) return SHOT_DRAW_SNOW(s);
  ellipse(s.x, s.y, s.r, s.r, '#8aa0bc'); g.fillStyle = '#e8f0fa'; g.beginPath(); g.arc(s.x, s.y, s.r - 1, 0, Math.PI * 2); g.fill();
  const a = s.rot * .5; px(s.x + Math.cos(a) * 3 - 1, s.y + Math.sin(a) * 3 - 1, 2, 2, '#b8c8dc'); px(s.x - 2, s.y - s.r + 2, 3, 1, '#ffffff');
};

// ---------------------------------------------------------------- shared moves
// Snowball: a lane telegraph, then a heavy ball rolls straight and shatters into six shards on the wall.
function yetiSnowball(e, ang) {
  warnShape({ shape: 'line', x: e.x, y: e.y - 6, a: ang, len: 220, w: 16 }, .6, w => {
    if (e.hp <= 0 || e.meleeStagger > 0) return;
    const ball = enemyShot(e.x, e.y - 6, w.a, 92, 'snow', { r: 7, life: 4, onHit: chill(1.4) });
    ball.onWall = s => { const back = Math.atan2(s.vy, s.vx) + Math.PI;
      emitPattern(s.x - Math.cos(back + Math.PI) * 4, s.y - Math.sin(back + Math.PI) * 4, { type: 'fan', n: 6, a: back, spread: 2.2, sp: 70, make: (x, y, a, sp) => iceShot(x, y, a, sp) });
      shake(2); SFX.slam(); };
    enemyPunish(e, .6);
  }, [180, 215, 255]);
}
const keepRange = (ang, d, near, far, sp, wob = 0) => {
  const want = d > far ? 1 : d < near ? -1 : 0;
  return { x: Math.cos(ang) * sp * want + Math.cos(ang + Math.PI / 2) * sp * .6 * wob, y: Math.sin(ang) * sp * want };
};

// ---------------------------------------------------------------- act 1: skeleton archer
// Stops, draws for 0.6 s while a thin lane follows you (locks for the last 0.2 s), looses a fast arrow, then
// lowers the bow for 0.8 s. A flinch during the draw cancels the shot.
function updSkelArcher(e, dt, ang, d) {
  if (e.state === 2) {
    if (!trackedWarnLive(e)) { e.state = 0; e.t = rnd(1, 1.6) / fspd(); return Z0; }
    retargetWarn(e, Math.atan2(G.player.y - 6 - (e.y - 9), G.player.x - e.x), e.x, e.y - 9); return Z0;
  }
  if (e.t <= 0 && d < 190) {
    e.state = 2; e.flash = .06; SFX.shoot();
    trackedWarn(e, { shape: 'line', x: e.x, y: e.y - 9, a: Math.atan2(G.player.y - 6 - (e.y - 9), G.player.x - e.x), len: 200, w: 8, track: .2 }, .6, w => {
      if (e.hp <= 0) return;
      enemyShot(e.x, e.y - 9, w.a, 170, 'bone', { r: 3, life: 2 }); SFX.shoot();
      e.state = 0; e.t = rnd(2, 2.8) / fspd(); enemyPunish(e, .8);
    }, [255, 220, 150]);
    return Z0;
  }
  return keepRange(ang, d, 80, 125, 26, Math.sin(e.anim));
}
// ---------------------------------------------------------------- act 2: ice lancer
// Armoured 1.0 s cast (three armour pips): a piercing spear lane locks 0.25 s before it lands and leaves frost.
// A full charge (or three ordinary hits) breaks the armour and cancels the throw.
function updIceLancer(e, dt, ang, d) {
  if (e.state === 2) {
    if (!trackedWarnLive(e) || e.armorBroken) { cancelTrackedWarn(e); e.state = 0; e.armorBroken = false; e.t = rnd(1.4, 2) / fspd(); return Z0; }
    retargetWarn(e, Math.atan2(G.player.y - 3 - (e.y - 6), G.player.x - e.x), e.x, e.y - 6); return Z0;
  }
  if (e.t <= 0 && d < 170) {
    e.state = 2; e.flash = .1; SFX.magic(); enemyArmorCast(e, 1, 3);
    trackedWarn(e, { shape: 'line', x: e.x, y: e.y - 6, a: Math.atan2(G.player.y - 3 - (e.y - 6), G.player.x - e.x), len: 190, w: 10, track: .25 }, 1, w => {
      if (e.hp <= 0 || e.state !== 2) return;
      shapeHit(w, 1, { onHit: chill(1.6) }); SFX.magic(); shake(2);
      for (const k of [.35, .7, 1]) G.flames.push({ x: w.x + Math.cos(w.a) * w.len * k, y: w.y + 6 + Math.sin(w.a) * w.len * k, r: 10, life: 2.5, ice: true });
      for (let i = 0; i < 6; i++) { const k = i / 5; burst(w.x + Math.cos(w.a) * w.len * k, w.y + Math.sin(w.a) * w.len * k, 3, ['#c8f0ff', '#ffffff'], { sp: 40, life: .3 }); }
      e.state = 0; e.armor = null; e.t = rnd(2.4, 3.2) / fspd(); enemyPunish(e, .6);
    }, [140, 200, 255]);
    return Z0;
  }
  return keepRange(ang, d, 70, 115, 22, Math.sin(e.anim * 1.2));
}

// ---------------------------------------------------------------- room-wide coordination (host only)
// Pack / tide moves are shared by the whole room: one cooldown per room and key, kept off the snapshot.
const ROOM_MOVE_CD = new WeakMap();
function roomMoveReady(key, cooldown) {
  const room = G.room; if (!room) return false;
  const cds = ROOM_MOVE_CD.get(room) || {}; ROOM_MOVE_CD.set(room, cds);
  if ((cds[key] || 0) > G.time) return false;
  cds[key] = G.time + cooldown; return true;
}
const aliveOf = kind => G.enemies.filter(o => o.kind === kind && o.hp > 0 && o.spawn <= 0);
// ---------------------------------------------------------------- act 3
// Leech: now and then burrows (a moving mound, cannot be hit), then erupts in a ring around where you stand.
// Standing still inside the ring is safe; rolling out of it is not.
function updLeech(e, dt, ang, d) {
  if (e.state === 3) {                                         // underground, homing
    if (e.t <= 0) { e.state = 4; const p = G.player;
      warnShape({ shape: 'donut', x: p.x, y: p.y - 3, r0: 14, r1: 36 }, .6, w => {
        e.hidden = false; e.x = clamp(w.x, 16, RPW - 16); e.y = clamp(w.y + 3, 20, RPH - 12); e.state = 0; e.t = rnd(3.5, 5) / fspd();
        shapeHit(w); SFX.slam(); burst(w.x, w.y, 14, ['#6a2a3a', '#4a3a2a', '#ff6070'], { sp: 80, life: .4, up: true }); enemyPunish(e, .6);
      }, [255, 90, 110]); }
    return V(ang, 60 * fspd());
  }
  if (e.state === 4) { if (e.t < -1.5) { e.hidden = false; e.state = 0; e.t = 2; } return Z0; }   // waiting (surfaces anyway if the warn was cleared)
  if (e.state === 0 && e.t <= 0 && d < 90 && d > 24) { e.state = 3; e.t = 1; e.hidden = true; clearEnemyContact(e); SFX.puff(); return Z0; }
  if (e.state === 0 && e.t <= 0) e.t = rnd(1, 2);
  return V(ang + Math.sin(e.anim * 2) * .5, 30 * fspd());
}
// Drowned: three or more in the room call a tide — a wall of water crossing the room with one gap.
function drownedTide(e) {
  const crew = aliveOf('drowned'); if (crew.length < 3 || crew[0] !== e || !roomMoveReady('tide', 9)) return;
  const fromLeft = G.player.x > RPW / 2, gap = clamp(G.player.y + rnd(-50, 50), 40, RPH - 40);
  sweepWall({ x: fromLeft ? 12 : RPW - 12, y: RPH / 2, a: fromLeft ? 0 : Math.PI, len: RPH, sp: 72, dist: RPW - 24, gc: gap - RPH / 2, gw: 40, delay: .8, col: '#7ad0e8' });
  SFX.puff(); addFloat(e.x, e.y - e.h - 8, '潮浪!', '#a8e8ff');
}
// Bog spitter: lobs tar where you stand; the tar slows, then ignites 1.2 s after landing.
function updBogSpitter(e, dt, ang, d) {
  if (e.t <= 0 && d < 160) {
    e.t = rnd(2.6, 3.4) / fspd(); e.flash = .08; SFX.puff();
    const p = G.player, x = clamp(p.x + rnd(-8, 8), 20, RPW - 20), y = clamp(p.y - 3 + rnd(-6, 6), 24, RPH - 14);
    warnShape({ shape: 'circle', x, y, r: 16 }, .7, w => { groundArea({ kind: 'tar', x: w.x, y: w.y, r: 18, ignite: 1.2, life: 3.2 }); SFX.slam();
      burst(w.x, w.y, 10, ['#2a1a10', '#4a3a2a'], { sp: 50, life: .35 }); }, [150, 110, 70]);
    burst(e.x, e.y - 8, 6, ['#2a1a10', '#5a4a32'], { sp: 50, life: .3, ang: Math.atan2(y - e.y, x - e.x), spread: .6 });
  }
  return keepRange(ang, d, 70, 120, 20, Math.sin(e.anim * 1.3));
}
// ---------------------------------------------------------------- act 4
// Sand caster: armoured 1 s cast (break it with a full charge), then three crossing sand-blade lanes fall in turn.
function updSandCaster(e, dt, ang, d) {
  if (e.state === 2) {
    if (!trackedWarnLive(e) || e.armorBroken) { cancelTrackedWarn(e); e.state = 0; e.armorBroken = false; e.t = rnd(1.6, 2.2) / fspd(); }
    return Z0;
  }
  if (e.t <= 0 && d < 180) {
    e.state = 2; e.flash = .1; SFX.magic(); enemyArmorCast(e, 1, 3);
    trackedWarn(e, { shape: 'circle', x: e.x, y: e.y - 2, r: 12 }, 1, () => {
      if (e.hp <= 0 || e.state !== 2) return;
      e.state = 0; e.armor = null; e.t = rnd(3, 3.8) / fspd(); enemyPunish(e, .7);
      const p = G.player, a0 = rnd(0, Math.PI);
      warnChain([0, 1, 2].map(i => ({ shape: 'rect', x: p.x + rnd(-10, 10), y: p.y - 3 + rnd(-8, 8), a: a0 + i * Math.PI / 3, len: 170, w: 12, t: .6,
        col: [235, 190, 110], fn: w => { if (shapeHit(w)) shake(2); SFX.slam(); for (let k = -2; k <= 2; k++) burst(w.x + Math.cos(w.a) * k * 30, w.y + Math.sin(w.a) * k * 30, 3, ['#d8a860', '#fff0c0'], { sp: 40, life: .3 }); } })), .3);
    }, [235, 190, 110]);
    return Z0;
  }
  return keepRange(ang, d, 80, 130, 20, Math.sin(e.anim));
}
// Beetles: five or more form a line and charge together down telegraphed lanes.
function beetleTide(e, dt, ang) {
  if (e.state === 5) { if (e.t < -.3) e.state = 0; return Z0; }   // lining up (lane telegraph showing)
  if (e.state === 1) { if (e.t <= 0) { e.state = 0; enemyPunish(e, .4); } return { x: e.hx * 150, y: e.hy * 150 }; }   // charging (contact live)
  const swarm = aliveOf('beetle'); if (swarm.length < 5 || swarm[0] !== e || !roomMoveReady('beetles', 8)) return null;
  const cx = swarm.reduce((s, b) => s + b.x, 0) / swarm.length, cy = swarm.reduce((s, b) => s + b.y, 0) / swarm.length;
  const a = Math.atan2(G.player.y - cy, G.player.x - cx);
  for (const b of swarm.slice(0, 7)) {
    b.state = 5; b.t = .6; b.hx = Math.cos(a); b.hy = Math.sin(a);
    warnShape({ shape: 'line', x: b.x, y: b.y - 2, a, len: 120, w: 10 }, .6, () => { if (b.hp > 0 && b.state === 5) { b.state = 1; b.t = .8; } }, [235, 200, 120]);
  }
  SFX.move(); return Z0;
}
// ---------------------------------------------------------------- act 5
// Storm beacon: a fixed pylon that arrives in pairs; every 3 s the pair arcs (lane telegraph 0.8 s). Break one.
function updStormBeacon(e, dt) {
  e.kbx = e.kby = 0;                                           // a fixed pylon (harmless to touch)
  if (!e.paired) { e.paired = true;
    if (aliveOf('stormBeacon').length + G.enemies.filter(o => o.kind === 'stormBeacon' && o.spawn > 0).length < 2) {
      const s = freeSpot(G.room, 60, RPW - e.x, RPH - e.y); const o = spawnEnemy('stormBeacon', s.x, s.y, .5); o.paired = true; } }
  const mates = aliveOf('stormBeacon'), mate = mates.find(o => o !== e);
  if (!mate || mates.indexOf(e) % 2 || e.t > 0) return Z0;
  e.t = 3 / fspd();
  const a = Math.atan2(mate.y - e.y, mate.x - e.x), len = dist(e.x, e.y, mate.x, mate.y);
  warnShape({ shape: 'rect', x: (e.x + mate.x) / 2, y: (e.y + mate.y) / 2 - 8, a, len, w: 10 }, .8, w => {
    if (e.hp <= 0 || mate.hp <= 0) return;
    if (shapeHit(w, 1, { onHit: zap(.25) })) shake(2); SFX.zap();
    G.bolts.push({ x0: e.x, y0: e.y - 14, x1: mate.x, y1: mate.y - 14, life: .22 });
  }, [255, 240, 140]);
  return Z0;
}
// Jellies: two drifting close together (< 90 px) arc between them.
function jellyArc(e) {
  if (e.arcT > G.time) return;
  const mate = aliveOf('jelly').find(o => o !== e && dist(o.x, o.y, e.x, e.y) < 90 && !(o.arcT > G.time)); if (!mate) return;
  e.arcT = mate.arcT = G.time + rnd(4, 5.5);
  warnShape({ shape: 'rect', x: (e.x + mate.x) / 2, y: (e.y + mate.y) / 2 - 6, a: Math.atan2(mate.y - e.y, mate.x - e.x), len: dist(e.x, e.y, mate.x, mate.y), w: 9 }, .7, w => {
    if (e.hp <= 0 || mate.hp <= 0) return;
    shapeHit(w, 1, { onHit: zap(.3) }); SFX.zap(); G.bolts.push({ x0: e.x, y0: e.y - 6, x1: mate.x, y1: mate.y - 6, life: .2 });
  }, [190, 160, 255]);
}
SPR.bogSpitter = strideFrames(ZOMBIE_TOP, 'b').map(r => makeSprite(r, { o: '#100a06', g: '#5a4a32', e: '#ffb040', d: '#1a120c', b: '#3a2a1a' }));
SPR.sandCaster = [[...MUMMY_TOP, '...ow.wo..', '...ob.wo..', '...oo.oo..'], [...MUMMY_TOP, '..ow..bo..', '..ow..wo..', '..oo..oo..']]
  .map(r => makeSprite(r, { o: '#2a1a08', w: '#e8b860', b: '#a86a28', e: '#ffe060' }));
SPR.stormBeacon = [['..oo..', '.oyyo.', '..oo..', '.obbo.', '.obbo.', '.obwo.', 'oobboo', 'obbbbo', 'oooooo'],
  ['..oo..', '.oyyo.', '.oyyo.', '.obbo.', '.obwo.', '.obbo.', 'oobboo', 'obbbbo', 'oooooo']].map(r => makeSprite(r, { o: '#1a2030', b: '#6a7a98', w: '#c8e0ff', y: '#ffe060' }));

Object.assign(ENAME, { skelArcher: '骷髅弓手', iceLancer: '冰枪手', bogSpitter: '焦油喷吐者', sandCaster: '沙暴术士', stormBeacon: '雷鸣信标' });
Object.assign(EDEF, {
  skelArcher: { hp: 7, hw: 4, hh: 4, h: 14, spr: anim2(SPR.skelArcher, 5), gold: [2, 3], col: ['#d8d4b8', '#3a6a4a'] },
  iceLancer: { hp: 12, hw: 4, hh: 4, h: 14, spr: anim2(SPR.iceLancer, 4), gold: [2, 4], col: ['#d8ecff', '#5a7aa8'] },
  bogSpitter: { hp: 10, hw: 4, hh: 4, h: 12, spr: anim2(SPR.bogSpitter, 4), gold: [2, 3], col: ['#5a4a32', '#2a1a10'] },
  sandCaster: { hp: 13, hw: 4, hh: 4, h: 12, spr: anim2(SPR.sandCaster, 4), gold: [2, 4], col: ['#e8b860', '#a86a28'] },
  stormBeacon: { hp: 14, hw: 4, hh: 4, h: 9, scale: 1.3, heavy: true, harmless: true, spr: e => SPR.stormBeacon[Math.floor(e.anim * 4) % 2], gold: [1, 2], col: ['#6a7a98', '#ffe060'], glow: [255, 240, 140],
    onDeath: e => { groundArea({ kind: 'shock', x: e.x, y: e.y, r: 18, delay: .5, life: 2.3 }); SFX.zap(); } },   // a broken pylon discharges
});
Object.assign(AI, { skelArcher: updSkelArcher, iceLancer: updIceLancer, bogSpitter: updBogSpitter, sandCaster: updSandCaster, stormBeacon: updStormBeacon });
// Pools: [kind, budget cost, weight, min floor-in-region]; new regulars are light additions from floor 2 on.
const ENEMY_EXPANSION_POOLS = [
  [1, 0, ['skelArcher', 1.6, 1, 2]], [1, 2, ['skelArcher', 1.6, 1, 2]],
  [2, 0, ['iceLancer', 1.8, 1, 2]], [2, 2, ['iceLancer', 1.8, 1, 2]], [2, 3, ['iceLancer', 1.8, 1, 1]],
  [3, 0, ['bogSpitter', 1.6, 1, 2]], [3, 1, ['bogSpitter', 1.6, 1, 2]], [3, 2, ['bogSpitter', 1.6, 1, 1]],
  [4, 0, ['sandCaster', 1.8, 1, 2]], [4, 1, ['sandCaster', 1.8, 1, 1]], [4, 3, ['sandCaster', 1.8, 1, 2]],
  [5, 1, ['stormBeacon', 2.2, 1, 2]], [5, 2, ['stormBeacon', 2.2, 1, 2]],
];
for (const [act, region, entry] of ENEMY_EXPANSION_POOLS) {
  const r = ACTS[act - 1] && ACTS[act - 1].regions[region];
  if (r && !r.pool.some(q => q[0] === entry[0])) r.pool.push(entry);
}
