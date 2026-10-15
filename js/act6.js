'use strict';
// ============================================================ 第六幕 · 虚空终焉 (final act): 4 regions, 3 mobs + 1 elite, 4 bosses, 4 map mechanics
// rift portals / shifting walls / corruption meter / the final heart mixes the mechanics of every earlier act.

// ---------------------------------------------------------------- sprites
SPR.voidEye = [['..oooo..', '.ommmmo.', 'omwwwwmo', 'omweewmo', 'omwwwwmo', '.ommmmo.', '..oooo..'], ['........', '..oooo..', '.ommmmo.', 'omweewmo', '.ommmmo.', '..oooo..', '........']]
  .map(r => makeSprite(r, { o: '#0a0418', m: '#5a2a90', w: '#e0c8ff', e: '#ff3060' }));
SPR.shade = SPR.hero.map((_, i) => makeSprite([
  ['....pp....', '...ppp....', '..oooooo..', '.ohhhhhho.', '.ohhhvvvo.', '.ohhhhhho.', '..oHHHHo..', '.obbbbbbo.', 'obbBggBbbo', 'oBbbbbbbBo', '.obbbbbbo.', '..olo.olo.', '..ofo.ofo.', '..oo..oo..'],
  ['....pp....', '...ppp....', '..oooooo..', '.ohhhhhho.', '.ohhhvvvo.', '.ohhhhhho.', '..oHHHHo..', '.obbbbbbo.', 'obbBggBbbo', 'oBbbbbbbBo', '.obbbbbbo.', '.olo..olo.', '.ofo..ofo.', '.oo....oo.']][i],
  { o: '#000000', p: '#6a2a90', h: '#2a1a3a', H: '#1a0a2a', v: '#ff3060', b: '#2a1a40', B: '#1a0a2a', g: '#8a5aff', l: '#1a0a2a', f: '#0a0418' }));
const CHAOS_TOP = ['o..oooo..o', '.oommmmoo.', '..omeemo..', '..ommmmo..', '...owwo...', '.oommmmoo.', 'om.ommo.mo', 'om.ommo.mo', '...ommo...'];
SPR.chaosImp = strideFrames(CHAOS_TOP, 'm')
  .map(r => makeSprite(r, { o: '#0a0418', m: '#8a2a8a', e: '#ffe060', w: '#ff60c0' }));
SPR.voidColossus = GOLEM_ROWS.map(r => makeSprite(r, { o: '#05020c', g: '#2a1a40', y: '#ff3060', l: '#8a5aff' }));
SPR.riftWalker = makeSprite([
  '......oooo......', '.....ommmmo.....', '....ommeemmo....', '....ommmmmmo....', '.....owwwwo.....', '...oommmmmmoo...', '..ommwmmmmwmmo..',
  '.ommmwmmmmwmmmo.', 'o.ommmmmmmmmmo.o', '..ommmmwwmmmmo..', '...ommmmmmmmo...', '...omm.oo.mmo...', '...oo..oo..oo...'],
  { o: '#05020c', m: '#3a1a5a', e: '#ff3060', w: '#b45aff' });
SPR.mazeLord = makeSprite([
  '....oooooooooo....', '...owwwwwwwwwwo...', '...owoooooooowo...', '...owoeewweeowo...', '...owooowwooowo...', '...owwwwwwwwwwo...', '....oommmmmmoo....',
  '..oommmmwwmmmmoo..', '.ommmmmwwwwmmmmmo.', 'ommmmmmmwwmmmmmmmo', '.ommmmmmmmmmmmmmo.', '..ommmmmmmmmmmmo..', '..ommmo....ommmo..', '..ooooo....ooooo..'],
  { o: '#05020c', w: '#6a5a8a', e: '#ff3060', m: '#2a2440' });
SPR.fallen = makeSprite([
  '.......pp.......', '......ppp.......', '.....oooooo.....', '....ohhhhhho....', '....ohhhvvvo....', '....ohhhhhho....', '.....oHHHHo.....',
  '...oobbbbbboo...', '..obbbBggBbbbo..', '.oBbbbbbbbbbbBo.', '..obbbbbbbbbbo..', '...obbbbbbbbo...', '....olo..olo....', '....ofo..ofo....', '....oo....oo....'],
  { o: '#05020c', p: '#ff3060', h: '#4a3a5a', H: '#2a1a3a', v: '#ff3060', b: '#3a2a5a', B: '#1a0a2a', g: '#ecba40', l: '#2a1a3a', f: '#140a1a' });
SPR.voidGod = makeSprite([
  '........oooooooo........', '......oommmmmmmmoo......', '....oommmwwwwwwmmmoo....', '...ommmwwwwwwwwwwmmmo...', '..ommmwwwoooooowwwmmmo..',
  '.ommmwwwoeeEEeeowwwmmmo.', '.ommmwwwoeEEEEeowwwmmmo.', '.ommmwwwoeeEEeeowwwmmmo.', '..ommmwwwoooooowwwmmmo..', '...ommmwwwwwwwwwwmmmo...',
  '.o..oommmwwwwwwmmmoo..o.', 'o.o...oommmmmmmmoo...o.o', '...o.o..oooooooo..o.o...', '....o..o........o..o....'],
  { o: '#000000', m: '#2a0a40', w: '#6a2aa0', e: '#ff3060', E: '#ffffff' });

// ---------------------------------------------------------------- projectiles
SHOT_DRAW.voidbolt = s => { px(s.x - 2, s.y - 2, 4, 4, '#3a1a5a'); px(s.x - 1, s.y - 1, 2, 2, '#ff3060'); px(s.x, s.y - 2, 1, 1, '#e0c8ff'); };
Object.assign(SHOT_SPARK, { voidbolt: ['#8a5aff', '#ff3060'] }); Object.assign(SHOT_LIGHT, { voidbolt: [180, 80, 255] });
// enemy homing shot: turns toward the player at most `turn` rad/s for `t` seconds
function seekShot(x, y, a, sp, turn = 1.6, t = 1.2, o = {}) { const s = enemyShot(x, y, a, sp, 'voidbolt', o); s.seek = { turn, t }; return s; }

// ---------------------------------------------------------------- mobs + elite
// chaos imp: every attack borrows a random earlier act mob (bone fan / frost fan / poison spit / sand / wind blade)
const CHAOS_MOVES = [
  e => { for (const k of [-0.2, 0, 0.2]) enemyShot(e.x, e.y - 7, e.ang + k, 90); },
  e => { for (const k of [-0.22, 0, 0.22]) iceShot(e.x, e.y - 7, e.ang + k, 80); },
  e => { for (const k of [-0.15, 0.15]) spitShot(e.x, e.y - 5, e.ang + k, 82); },
  e => { const o = rnd(0, 1); for (let i = 0; i < 6; i++) enemyShot(e.x, e.y - 6, o + i * Math.PI / 3, 70, 'sand'); },
  e => enemyShot(e.x, e.y - 7, e.ang, 110, 'windblade', { onHit: (p, s) => { const k = norm({ x: s.vx, y: s.vy }); p.kbx += k.x * 220; p.kby += k.y * 220; } }),
];
Object.assign(ENAME, { voidEye: '虚空眼', shade: '影子', chaosImp: '混沌魔' });
Object.assign(EDEF, {
  voidEye: { hp: 9, hw: 4, hh: 3, h: 7, fly: true, spr: e => SPR.voidEye[Math.floor(e.anim * 2) % 7 ? 0 : 1], gold: [1, 2], col: ['#5a2a90', '#ff3060'], glow: [170, 70, 255] },
  shade: { hp: 16, hw: 4, hh: 4, h: 14, alpha: 0.8, spr: e => SPR.shade[e.moving ? Math.floor(e.anim * 8) % 2 : 0], gold: [2, 3], col: ['#2a1a40', '#ff3060'] },
  chaosImp: { hp: 14, hw: 4, hh: 4, h: 12, spr: anim2(SPR.chaosImp, 6), gold: [2, 3], col: ['#8a2a8a', '#ffe060'] },
  voidColossus: { hp: 95, hw: 8, hh: 6, h: 13, spr: anim2(SPR.voidColossus, 3), gold: [10, 13], col: ['#2a1a40', '#ff3060', '#8a5aff'], elite: true, heavy: true, scale: 1.4,
    name: '虚空巨像', tele: e => e.state === 1, glow: [170, 60, 255] },
});
Object.assign(AI, {
  // void eye: hovers, fires slow seeking bolts
  voidEye: (e, dt, ang, d) => { if (e.t <= 0) { e.t = rnd(2.2, 3) / fspd(); SFX.magic(); seekShot(e.x, e.y - 7, ang, 62, 1.4, 1.4); }
    const want = d > 100 ? 1 : d < 60 ? -1 : 0; return { x: Math.cos(ang) * 22 * want + Math.cos(ang + Math.PI / 2) * 18 * Math.sin(e.anim), y: Math.sin(ang) * 22 * want }; },
  // shade: mirrors your position through the room centre and slashes when it is close
  shade: (e, dt, ang, d) => { const p = G.player, tx = RPW - p.x, ty = RPH - p.y + 4;
    if (d < 26 && e.t <= 0) { e.t = rnd(0.9, 1.3) / fspd(); e.flash = 0.06; SFX.swing(); warn(e.x + Math.cos(ang) * 10, e.y + Math.sin(ang) * 8, 10, 0.35, w => areaHit(w.x, w.y, w.r, 1), [255, 60, 100]); }
    return { x: clamp((tx - e.x) * 3, -70, 70), y: clamp((ty - e.y) * 3, -60, 60) }; },
  chaosImp: (e, dt, ang, d) => { if (e.t <= 0 && d < 140) { e.t = rnd(1.6, 2.2) / fspd(); e.ang = ang; e.flash = 0.06; SFX.magic(); pick(CHAOS_MOVES)(e); }
    const want = d > 90 ? 1 : d < 55 ? -1 : 0; return { x: Math.cos(ang) * 30 * want + Math.cos(ang + Math.PI / 2) * 22 * Math.sin(e.anim * 1.3), y: Math.sin(ang) * 30 * want }; },
  voidColossus: (e, dt, ang, d) => {
    if (e.state === 0) { if (d < 56 && e.t <= 0) { e.state = 1; e.t = 0.8; } return V(ang, 24 * fspd()); }
    e.flash = Math.floor(e.t * 16) % 2 ? 0.05 : 0;
    if (e.t <= 0) { e.state = 0; e.t = rnd(1.6, 2.2) / fspd(); SFX.slam(); shake(6); ring(e.x, e.y - 3, 36, [180, 70, 255], 0.3); areaHit(e.x, e.y - 3, 34);
      const o = rnd(0, 1); for (let i = 0; i < 8; i++) seekShot(e.x, e.y - 5, o + i * Math.PI / 4, 58, 0.9, 0.9);
      burst(e.x, e.y, 22, ['#2a1a40', '#ff3060', '#8a5aff'], { sp: 90, life: 0.4 }); }
    return Z0;
  },
});

// ---------------------------------------------------------------- map mechanics
// rift: a pair of linked portals (step in one, come out of the other; enemies use them too) + a crack in the floor that
// keeps spitting out voidlings while the room is locked (it stops once 6 of its spawns are dead or the room is cleared)
const portalPair = r => r.portals || [];
const MECH_RIFT = {
  build(r) { r.portals = []; r.crack = null; if (calmRoom(r)) return;
    const a = { x: rnd(40, RPW / 2 - 50), y: rnd(40, RPH - 40) }, b = { x: rnd(RPW / 2 + 50, RPW - 40), y: rnd(40, RPH - 40) };
    for (const P of [a, b]) { const s = freeSpotNoActors(r, P.x, P.y); P.x = s.x; P.y = s.y; }
    r.portals = [a, b];
    if (isFight(r)) { const spot = freeSpotNoActors(r, RPW / 2 + rnd(-60, 60), rnd(46, RPH - 46)); r.crack = { ...spot, t: 2, left: 6 }; } },
  update(r, dt) {
    const p = G.player, [A, B] = portalPair(r); if (!A) return;
    const hop = (u, who) => { if ((u.portT || 0) > G.time) return;
      for (const [P, Q] of [[A, B], [B, A]]) if (dist(u.x, u.y, P.x, P.y) < 9) { u.x = Q.x; u.y = Q.y + 2; u.portT = G.time + 1.2; if (who) { SFX.magic(); burst(Q.x, Q.y - 6, 16, ['#b45aff', '#ffffff'], { sp: 60, life: 0.35 }); } return; } };
    if (p.rolling <= 0) hop(p, true);
    for (const e of G.enemies) if (!e.link && !e.hidden && !EDEF[e.kind].boss) hop(e, false);
    const C = r.crack; if (C && r.locked && C.left > 0 && (C.t -= dt) <= 0 && G.enemies.length < 12) { C.t = rnd(2.6, 3.6) / curDiff().speed;
      const e = spawnEnemy(pick(['voidEye', 'chaosImp', 'shade']), C.x, C.y, 0.6); e.fromCrack = true; SFX.puff(); }
  },
  kill(r, e) { if (e.fromCrack && r.crack) r.crack.left--; },
  draw(r, time) {
    for (const P of portalPair(r)) { for (let i = 0; i < 3; i++) ellipse(P.x, P.y, 9 - i * 2.4, 5 - i * 1.3, ['#3a1a5a', '#8a5aff', '#e0c8ff'][i], time * (3 - i));
      px(P.x - 1, P.y - 1, 2, 2, '#ffffff'); }
    const C = r.crack; if (C && C.left > 0) { for (let i = -6; i <= 6; i++) px(C.x + i * 1.5, C.y + Math.sin(i * 1.7) * 2, 2, 1, i % 2 ? '#ff3060' : '#b45aff');
      if (spawnP(0.2)) G.parts.push({ x: C.x + rnd(-8, 8), y: C.y, vx: 0, vy: rnd(-24, -10), life: 0.5, max: 0.5, col: '#b45aff', size: 1, grav: 0, add: true }); }
  },
  light(r, ox, oy, time) { for (const P of portalPair(r)) light(P.x + ox, P.y + oy, 40, [180, 90, 255], 0.55); const C = r.crack; if (C && C.left > 0) light(C.x + ox, C.y + oy, 34, [255, 60, 120], 0.45); },
};
function freeSpotNoActors(r, x, y) {
  const wanted = { x, y };
  for (let k = 0; k < 40; k++) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    if (r.tiles[ty * RW + tx] === 0 && !doorLane(tx, ty) && !boxHits(r, x, y, 6, 6, 'walk')) return { x, y };
    x = clamp(x + rnd(-24, 24), 28, RPW - 28); y = clamp(y + rnd(-16, 16), 34, RPH - 24);
  }
  // A deterministic fallback respects the whole actor footprint, even next to newly scaled pillars.
  let best = { x: RPW / 2, y: RPH / 2 }, score = Infinity;
  for (let ty = 2; ty < RH - 1; ty++) for (let tx = 2; tx < RW - 2; tx++) {
    const px = tx * TS + 8, py = ty * TS + 10, distance = dist(wanted.x, wanted.y, px, py);
    if (distance < score && r.tiles[ty * RW + tx] === 0 && !doorLane(tx, ty) && !boxHits(r, px, py, 6, 6, 'walk')) { best = { x: px, y: py }; score = distance; }
  }
  return best;
}
// shifting halls: every 8 s the pillar layout swaps (a 0.8 s shimmer warns which tiles will rise); a rising pillar never
// traps anyone, tiles under actors are skipped
const MECH_SHIFT = {
  livePillars: true,                                          // pillars are drawn every frame (see draw), not baked into the room art
  build(r) { r.shiftT = 6; r.layA = []; r.layB = []; if (!isFight(r) && r.type !== 'boss') return;
    for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] === 2) r.layA.push(i);
    for (let k = 0; k < 11; k++) { const x = rint(3, RW - 4), y = rint(2, RH - 3), i = y * RW + x; if (r.tiles[i] === 0 && !doorLane(x, y)) r.layB.push(i); }
    r.layOn = 'A'; },
  update(r, dt) {
    if (!r.locked || !r.layB.length) return;
    r.shiftT -= dt;
    if (r.shiftT <= 0) { r.shiftT = 8; const off = r.layOn === 'A' ? r.layA : r.layB, on = r.layOn === 'A' ? r.layB : r.layA;
      for (const i of off) if (r.tiles[i] === 2) r.tiles[i] = 0;
      for (const i of on) if (r.tiles[i] === 0 && tileFree(i % RW, Math.floor(i / RW))) r.tiles[i] = 2;
      r.layOn = r.layOn === 'A' ? 'B' : 'A'; SFX.slam(); shake(3); }
  },
  draw(r, time) {
    for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] === 2) { const x = (i % RW) * TS, y = Math.floor(i / RW) * TS;       // live pillars (they move)
      px(x + 1, y + 13, 15, 3, 'rgba(0,0,0,0.45)'); px(x + 1, y + 1, 14, 14, '#2a2440'); px(x + 2, y + 2, 12, 8, '#4a3a6a'); px(x + 2, y + 2, 12, 2, '#7a6a9a'); px(x + 2, y + 10, 12, 4, '#1a1428'); }
    if (r.locked && r.shiftT < 0.8 && Math.floor(time * 12) % 2) { const next = r.layOn === 'A' ? r.layB : r.layA;
      for (const i of next) if (r.tiles[i] === 0) { g.globalAlpha = 0.5; px((i % RW) * TS + 2, Math.floor(i / RW) * TS + 2, 12, 12, '#b45aff'); g.globalAlpha = 1; } }
  },
};
// corruption: a meter that fills while the room is locked; every 25% makes the enemies 15% faster and harder hitting
// (their touch deals 2 at 100%). Each kill purifies 12%. Shown as a purple bar and a darkening, red-tinted room.
const MECH_CORRUPT = {
  update(r, dt) {
    if (!r.locked) { G.corrupt = Math.max(0, (G.corrupt || 0) - dt * 40); return; }
    G.corrupt = Math.min(100, (G.corrupt || 0) + dt * 5.5 * curDiff().speed);
    const k = 1 + Math.floor(G.corrupt / 25) * 0.15;
    for (const e of G.enemies) if (!EDEF[e.kind].boss) e.tmul = k;
  },
  kill(r, e) { G.corrupt = Math.max(0, (G.corrupt || 0) - 12); },
  amb: r => { const k = clamp((G.corrupt || 0) / 100); return `rgb(${Math.round(lerp(150, 150, k))},${Math.round(lerp(130, 80, k))},${Math.round(lerp(170, 110, k))})`; },
  hud() { if (!G.corrupt) return; const w = 76, k = clamp(G.corrupt / 100);
    g.fillStyle = '#2a1a3a'; g.fillRect(5, 17, w, 1); g.fillStyle = k >= 1 && Math.floor(G.time * 8) % 2 ? '#ffffff' : '#b45aff'; g.fillRect(5, 17, Math.round(w * k), 1);
    for (let q = 1; q < 4; q++) { g.fillStyle = '#100a14'; g.fillRect(5 + Math.round(w * q / 4), 17, 1, 1); } },
};
// the final heart: every room rolls one mechanic from the earlier acts (and this one), so a floor is a medley.
// The room keeps that choice in r.mech, so all hooks (build/art/update/draw ...) run as if it were that region.
const HEART_POOL = ['ice', 'wind', 'crystal', 'cold', 'bog', 'fungus', 'tide', 'nest', 'quicksand', 'tomb', 'sun', 'mirror', 'void', 'storm', 'clock', 'dark',
  'rift', 'shift', 'corrupt'];
const MECH_HEART_PICK = r => r.type === 'boss' ? 'godArena' : pick(HEART_POOL.filter(m => MECH[m]));
// the god's arena: void tiles (opened in phase III) behave like the sky act's pits, and phase II darkens the room
const MECH_GOD_ARENA = {
  tile: MECH_VOID.tile, art: MECH_VOID.art,
  update(r, dt) { MECH_VOID.update(r, dt); },
  draw(r, time) { for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] === T_VOID) { const x = (i % RW) * TS, y = Math.floor(i / RW) * TS;   // pits opened mid-fight
      px(x, y, TS, TS, '#0e0618'); for (let k = 0; k < 2; k++) px(x + hash2(i, k) * 14, y + hash2(k, i) * 14, 1, 1, (time * 3 + k) % 2 < 1 ? '#ff3060' : '#b45aff'); } },
  light(r, ox, oy, time) { if (r.godDark) { const p = G.player; light(p.x + ox, p.y - 6 + oy, 76, [200, 170, 230], 0.9); } },
};
Object.assign(MECH, { rift: MECH_RIFT, shift: MECH_SHIFT, corrupt: MECH_CORRUPT });

// ---------------------------------------------------------------- bosses
// 裂隙行者: blinks around / opens 3 portals that each spray a bullet fan / pulls you through a portal next to it / seeking volley
function updRiftWalker(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.encounter?.type === 'rift') return updateRiftCombo(e, dt);
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    e.pat = (e.pat + 1) % 4; e.sub = 0.2; e.k = 0; e.t = [1.2, 2.4, 1.4, 1.8][e.pat] / sp;
    if (e.pat === 0 || e.pat === 2) { startRiftCombo(e); return Z0; }
    if (e.pat === 1) e.gates = Array.from({ length: enr ? 4 : 3 }, () => { const s = freeSpot(G.room, 40, p.x, p.y, 'fly'); return { x: s.x, y: s.y - 6, t: 0.7 }; });
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.PI / 2 * Math.sin(e.anim), 40 * sp);
  if (e.pat === 1 && e.gates) { for (const Gt of e.gates) { Gt.t -= dt;
      if (Gt.t <= 0 && !Gt.done) { Gt.done = true; SFX.shoot(); const a = Math.atan2(p.y - 6 - Gt.y, p.x - Gt.x); for (let i = -2; i <= 2; i++) enemyShot(Gt.x, Gt.y, a + i * 0.2, 88, 'voidbolt'); } }
    return Z0; }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.5 / sp; SFX.magic();
    for (let i = 0; i < (enr ? 8 : 6); i++) seekShot(e.x, e.y - 10, i * Math.PI * 2 / (enr ? 8 : 6) + e.k * 0.3, 70, 1.2, 1.0); }
  return Z0;
}
// 迷宫之主: raises walls that split the arena (with a gap you can reach) / walls collapse into debris fans / stomp + shades
function updMazeLord(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player, R = G.room;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    e.pat = (e.pat + 1) % 4; e.sub = 0.2; e.k = 0; e.t = [1.6, 3.2, 1.4, 1.8][e.pat] / sp;
    if (e.pat === 1) {                                           // a vertical or horizontal wall line with a 2-tile gap, warned first
      const vert = rand() < 0.5, lines = Array.from({ length: vert ? RW - 10 : RH - 6 }, (_, i) => i + (vert ? 5 : 3))
        .filter(v => v !== (vert ? MID_X : MID_Y) - 1 && v !== (vert ? MID_X : MID_Y));
      const line = pick(lines), gap = vert ? MID_Y - 1 : MID_X - 1, tiles = [];
      if (vert) for (let y = 1; y < RH - 1; y++) { if (y === gap || y === gap + 1) continue; tiles.push(y * RW + line); }
      else for (let x = 2; x < RW - 2; x++) { if (x === gap || x === gap + 1) continue; tiles.push(line * RW + x); }
      e.wall = { tiles: tiles.filter(i => R.tiles[i] === 0 && !roomSafeLane(i % RW, Math.floor(i / RW))), tele: 0.9, up: false };
    }
    if (e.pat === 3 && G.enemies.filter(o => o.kind === 'shade').length < 3) for (let i = 0; i < (enr ? 2 : 1) + 1; i++) { const s = freeSpot(R, 40, p.x, p.y); spawnEnemy('shade', s.x, s.y, 0.6); }
  }
  e.sub -= dt;
  const W = e.wall;
  if (W && !W.up && (W.tele -= dt) <= 0) { W.up = true; SFX.slam(); shake(5);
    W.tiles = W.tiles.filter(i => R.tiles[i] === 0 && tileFree(i % RW, Math.floor(i / RW))); for (const i of W.tiles) R.tiles[i] = 2; W.life = 3.6; }
  if (W && W.up && (W.life -= dt) <= 0) { for (const i of W.tiles) { R.tiles[i] = 0; const x = (i % RW) * TS + 8, y = Math.floor(i / RW) * TS + 8;
      if (rand() < 0.35) enemyShot(x, y, Math.atan2(p.y - y, p.x - x), 70, 'bone'); } e.wall = null; SFX.boom(); shake(4); }
  if (e.pat === 0) return V(ang, 26 * sp);
  if (e.pat === 2 && e.sub <= 0 && e.k === 0) { e.k = 1; SFX.slam(); shake(6); ring(e.x, e.y - 3, 34, [150, 120, 200], 0.3); areaHit(e.x, e.y - 3, 30, 1);
    spikeRing(e.x, e.y, 40, 12, 0.5, 0); if (enr) G.later.push({ t: 0.4, fn: () => spikeRing(e.x, e.y, 66, 16, 0.5, 0.2) }); }
  return Z0;
}
// 堕落英雄: a dark copy of you that cycles through one signature move of each earlier act boss
//   bone ring (骷髅王) · root lines (腐化古树) · meteor rain (炎魔领主) · spike rings (冰霜巨魔) · tongue pull (沼泽巨蟾) · sun orbs (太阳祭司) · seeking fan
function updFallen(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.t <= 0) { if (bossRecoveryBoundary(e)) return Z0;
    e.pat = (e.pat + 1) % 8; e.sub = 0.2; e.k = 0; e.t = [1.0, 1.2, 1.4, 1.6, 1.2, 1.4, 1.4, 1.2][e.pat] / sp; e.tongue = null;
    if (e.pat > 0) addFloat(e.x, e.y - 26, ['', '骷髅王之怒', '古树之根', '炎魔陨石', '冰霜之环', '巨蟾之舌', '烈日之环', '虚空追猎'][e.pat], '#ff8a9a');
    if (e.pat === 5) e.tongue = { a: ang, len: 0, tele: 0.5 / sp, hit: false };
    if (e.pat === 6) { const n = enr ? 8 : 6; for (let i = 0; i < n; i++) { const s = enemyShot(e.x, e.y, 0, 0, 'sun', { r: 4, life: 3 }); s.orbit = { c: e, a: i * Math.PI * 2 / n, w: 2.4, r: 12, dr: 30 }; s.fire = true; } } }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.sin(e.anim * 2) * 0.6, 48 * sp);
  if (e.pat === 1 && e.sub <= 0 && e.k < 2) { e.k++; e.sub = 0.5; const n = enr ? 16 : 12, o = e.anim; for (let i = 0; i < n; i++) enemyShot(e.x, e.y - 10, o + i * Math.PI * 2 / n, 70); SFX.shoot(); }
  if (e.pat === 2 && e.sub <= 0 && e.k < 3) { e.k++; e.sub = 0.35; const a = Math.atan2(p.y - e.y, p.x - e.x) + (e.k - 2) * 0.35;
    for (let i = 1; i <= 8; i++) { const x = e.x + Math.cos(a) * i * 15, y = e.y + Math.sin(a) * i * 11; if (x < 20 || x > RPW - 20 || y < 24 || y > RPH - 16) break;
      warn(x, y, 7, 0.4 + i * 0.06, w => areaHit(w.x, w.y, w.r, 1), [120, 220, 90]); } }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 7 : 5)) { e.k++; e.sub = 0.25; const x = clamp(p.x + rnd(-40, 40), 24, RPW - 24), y = clamp(p.y + rnd(-26, 26), 28, RPH - 18);
    warn(x, y, 12, 0.75, w => { areaHit(w.x, w.y, w.r, 1); SFX.boom(); G.flames.push({ x: w.x, y: w.y, r: 9, life: 1.8 }); }, [255, 140, 40]); }
  if (e.pat === 4 && e.sub <= 0 && e.k === 0) { e.k = 1; SFX.slam(); shake(5); for (let j = 0; j < 3; j++) G.later.push({ t: j * 0.3, fn: () => spikeRing(e.x, e.y, 30 + j * 24, 10 + j * 4, 0.5, j * 0.3) }); }
  if (e.pat === 5 && e.tongue) { const T = e.tongue;
    if (T.tele > 0) { T.tele -= dt; T.a = ang; return Z0; } T.len = Math.min(140, T.len + dt * 520);
    if (!T.hit && p.rolling <= 0 && beamHits(e.x, e.y - 8, T.a, T.len, 5)) { T.hit = true; const i0 = p.inv; hurtPlayer(1, e.x, e.y);
      if (p.inv > i0) { const d = norm({ x: e.x - p.x, y: e.y - p.y }); p.kbx = d.x * 380; p.kby = d.y * 380; } }
    return Z0; }
  if (e.pat === 7 && e.sub <= 0 && e.k < 2) { e.k++; e.sub = 0.5; SFX.magic(); for (let i = -2; i <= 2; i++) seekShot(e.x, e.y - 8, ang + i * 0.3, 80, 1.3, 1.0); }
  return Z0;
}
// 虚空之神 (final boss): three phases, each mixes the act bosses' best tricks. Between phases a 2 s untouchable transition.
//   I   (100-66%): bone ring · frost beam sweep · seeking volley
//   II  (66-33%) : + rift gates spraying fans · the room turns dark around you
//   III (<33%)   : + void pits open along the walls · black-hole pull with falling stars
function updVoidGod(e, dt, ang) {
  const p = G.player, R = G.room, ph = e.hp > e.max * 0.66 ? 1 : e.hp > e.max * 0.33 ? 2 : 3;
  if (ph !== (e.phase || 1)) {                                   // phase change
    clearVoidCores(e);
    e.phase = ph; e.immune = true; e.phT = 2; e.pat = -1; e.t = 2.2; e.beam = null; e.hole = null; e.gates = null;
    SFX.boss(); shake(10); G.flash = 0.35; addFloat(e.x, e.y - 30, ph === 2 ? '第二阶段 · 群星黯淡' : '第三阶段 · 虚空吞噬', '#ff3060', true);
    for (const s of G.shots) if (!s.friendly) s.life = 0;
    if (ph >= 2) R.godDark = true;                               // (a big burst can skip straight from phase I to III)
    if (ph === 3) for (let i = 0; i < R.tiles.length; i++) { const x = i % RW, y = Math.floor(i / RW);   // void along the side walls
      if (R.tiles[i] === 0 && (x === 2 || x === RW - 3) && y >= 2 && y <= RH - 3 && !doorLane(x, y) && tileFree(x, y)) R.tiles[i] = T_VOID; }
  }
  if (e.immune) { e.phT -= dt; if (e.phT <= 0) e.immune = false; return V(ang + Math.PI / 2, 10); }
  if (ph === 2 && !e.coreStageStarted) startVoidCores(e);
  if (e.coreShield) return Z0;
  const sp = 1 + (ph - 1) * 0.15, n = ph === 1 ? 4 : ph === 2 ? 5 : 6;
  if (e.t <= 0) { if (bossRecoveryBoundary(e)) return Z0;
    e.pat = (e.pat + 1) % n; e.sub = 0.2; e.k = 0; e.t = [1.2, 2.4, 1.6, 1.8, 2.4, 2.6][e.pat] / sp; e.beam = null;
    if (e.pat === 1) e.beam = { a: ang - 1.1, tele: 0.7 };
    if (e.pat === 4) e.gates = Array.from({ length: 3 }, () => { const s = freeSpot(R, 40, p.x, p.y, 'fly'); return { x: s.x, y: s.y - 6, t: 0.7 }; });
    if (e.pat === 5) e.hole = { x: RPW / 2, y: RPH / 2, t: 2.4 }; }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.sin(e.anim) * 0.8, 30 * sp);
  if (e.pat === 1 && e.beam) { const B = e.beam; if (B.tele > 0) { B.tele -= dt; e.t = Math.max(e.t, 1.2); return Z0; }
    B.a += 1.5 * sp * dt; enemyBeamAttack(e, 6, false, 1.2); return Z0; }
  if (e.pat === 2 && e.sub <= 0 && e.k < 3) { e.k++; e.sub = 0.45; const m = 14 + ph * 2, o = e.anim + e.k * 0.2; for (let i = 0; i < m; i++) enemyShot(e.x, e.y - 12, o + i * Math.PI * 2 / m, 66, 'voidbolt'); SFX.shoot(); }
  if (e.pat === 3 && e.sub <= 0 && e.k < 2) { e.k++; e.sub = 0.6; SFX.magic(); for (let i = 0; i < 6 + ph; i++) seekShot(e.x, e.y - 12, i * Math.PI * 2 / (6 + ph), 66, 1.1, 1.0); }
  if (e.pat === 4 && e.gates) { for (const Gt of e.gates) { Gt.t -= dt; if (Gt.t <= 0 && !Gt.done) { Gt.done = true; SFX.shoot();
      const a = Math.atan2(p.y - 6 - Gt.y, p.x - Gt.x); for (let i = -2; i <= 2; i++) enemyShot(Gt.x, Gt.y, a + i * 0.2, 86, 'voidbolt'); } } return Z0; }
  if (e.pat === 5 && e.hole) { const B = e.hole; B.t -= dt;
    if (B.t > 0) { const d = dist(p.x, p.y, B.x, B.y), k = norm({ x: B.x - p.x, y: B.y - p.y }), f = clamp(1 - d / 170) * 140; p.kbx += k.x * f * dt * 4; p.kby += k.y * f * dt * 4;
      if (d < 10) hurtPlayer(1, B.x, B.y - 1); for (const s of G.shots) if (s.friendly && dist(s.x, s.y, B.x, B.y) < 14) s.life = 0;
      if (e.sub <= 0) { e.sub = 0.3; const x = clamp(p.x + rnd(-36, 36), 24, RPW - 24), y = clamp(p.y + rnd(-24, 24), 28, RPH - 18);
        warn(x, y, 10, 0.75, w => { areaHit(w.x, w.y, w.r, 1); SFX.boom(); }, [190, 160, 255]); } }
    return Z0; }
  return Z0;
}
MECH.godArena = MECH_GOD_ARENA;
const beamFx = (col, glow) => (e, time, y) => { const B = e.beam; if (e.pat !== 1 || !B) return; const x0 = e.x, y0 = y - 12, c = Math.cos(B.a), s = Math.sin(B.a);
  if (B.tele > 0) { if (Math.floor(time * 14) % 2) for (let i = 10; i < ROOM_BEAM_RANGE; i += 3) px(x0 + c * i, y0 + s * i, 1, 1, col); return; }
  for (let i = 8; i < ROOM_BEAM_RANGE; i++) { const x = x0 + c * i, yy = y0 + s * i; if (x < 0 || x > RPW || yy < 0 || yy > RPH) break; px(x - s * 1.5, yy + c * 1.5, 1, 1, glow); px(x, yy, 1, 1, '#ffffff'); px(x + s * 1.5, yy - c * 1.5, 1, 1, glow); } };
const gatesFx = e => { if (!e.gates) return; for (const Gt of e.gates) if (!Gt.done) for (let i = 0; i < 2; i++) ellipse(Gt.x, Gt.y, 6 - i * 2, 4 - i, i ? '#ff3060' : '#8a5aff', G.time * 4); };
const holeFx = e => { const B = e.hole; if (e.pat !== 5 || !B || B.t <= 0) return;
  for (let k = 0; k < 3; k++) { const r = 4 + ((G.time * 14 + k * 6) % 20); g.globalAlpha = 1 - r / 24; ellipse(B.x, B.y, r, r * 0.6, '#8a5aff', G.time * 3); }
  g.globalAlpha = 1; px(B.x - 3, B.y - 2, 6, 4, '#000000'); };
// bosses whose arena tiles change mid-fight leave the room clean when they die
const godOnDeath = () => { const R = G.room; for (let i = 0; i < R.tiles.length; i++) if (R.tiles[i] === T_VOID) R.tiles[i] = 0; R.godDark = false; };
// the maze lord's live pillars need drawing in its arena (its walls appear mid-fight)
const MECH_MAZE_ARENA = { draw: MECH_SHIFT.draw, livePillars: true, build(r) { r.layA = []; r.layB = []; r.shiftT = 99; } };
MECH.mazeArena = MECH_MAZE_ARENA;

// ---------------------------------------------------------------- regions
const ACT6 = [
  { name: '虚空裂隙', pal: { wall: [50, 30, 70], floor: [60, 44, 80], mortar: [20, 10, 30], deco: [190, 100, 255] }, amb: 'rgb(130,110,160)',
    pool: [['voidEye', 1.2, 3, 1], ['chaosImp', 1.6, 2, 1], ['shade', 1.6, 1, 2]], elite: 'voidColossus', boss: 'riftWalker', bossSub: '世界的伤口',
    hazard: 0, mech: 'rift', mechName: '传送门与裂缝', mechTip: '传送门两两相连，敌人也会用；裂缝会不断冒出敌人' },
  { name: '变幻回廊', pal: { wall: [44, 40, 66], floor: [64, 58, 84], mortar: [18, 16, 30], deco: [160, 140, 220] }, amb: 'rgb(124,116,150)',
    pool: [['shade', 1.6, 3, 1], ['voidEye', 1.2, 2, 1], ['clockwork', 1.5, 1, 1]], elite: 'voidColossus', boss: 'mazeLord', bossSub: '无尽之廊',
    hazard: 0, mech: 'shift', mechName: '会变动的墙', mechTip: '柱子每 8 秒移动一次，即将升起的位置会提前闪烁' },
  { name: '腐化王座', pal: { wall: [70, 30, 50], floor: [80, 44, 62], mortar: [30, 10, 20], deco: [255, 70, 120] }, amb: 'rgb(150,130,170)',
    pool: [['chaosImp', 1.6, 3, 1], ['shade', 1.6, 2, 1], ['voidEye', 1.2, 2, 1]], elite: 'voidColossus', boss: 'fallen', bossSub: '曾经的你',
    hazard: 4, mech: 'corrupt', mechName: '腐化（越拖越强）', mechTip: '腐化值会随时间上升，敌人变强；击杀敌人可以净化' },
  { name: '终焉之心', pal: { wall: [30, 16, 44], floor: [44, 30, 60], mortar: [10, 4, 18], deco: [255, 60, 120] }, amb: 'rgb(118,100,140)',
    pool: [['voidEye', 1.2, 2, 1], ['chaosImp', 1.6, 2, 1], ['shade', 1.6, 2, 1], ['sylph', 1.2, 1, 1], ['scorpion', 1.3, 1, 1], ['wisp', 1.2, 1, 1]],
    elite: 'voidColossus', boss: 'voidGod', bossSub: '一切的终点', hazard: 0, mech: 'heart', mechPick: MECH_HEART_PICK,
    mechName: '每个房间随机（全部机制）', mechTip: '每个房间都会随机出现前面几幕的一种机制' },
];
// ---------------------------------------------------------------- bosses + regions (one table per act; see js/act-kit.js)
registerActContent(6, {
  enemies: {
    riftWalker: { hp: 460, hw: 8, hh: 5, h: 13, spr: () => SPR.riftWalker, gold: [0, 0], col: ['#3a1a5a', '#ff3060', '#b45aff'], boss: true, name: '裂隙行者', fx: gatesFx },
    mazeLord: { hp: 500, hw: 9, hh: 6, h: 14, spr: () => SPR.mazeLord, gold: [0, 0], col: ['#2a2440', '#6a5a8a', '#ff3060'], boss: true, name: '迷宫之主', heavy: true,
      fx: (e, time) => { const W = e.wall; if (!W || W.up) return; if (Math.floor(time * 12) % 2) for (const i of W.tiles) { g.globalAlpha = 0.5; px((i % RW) * TS + 2, Math.floor(i / RW) * TS + 2, 12, 12, '#b45aff'); g.globalAlpha = 1; } },
      onDeath: e => { if (e.wall && e.wall.up) for (const i of e.wall.tiles) G.room.tiles[i] = 0; e.wall = null; } },
    fallen: { hp: 540, hw: 6, hh: 4, h: 15, scale: 1.4, spr: () => SPR.fallen, gold: [0, 0], col: ['#3a2a5a', '#ff3060', '#ecba40'], boss: true, name: '堕落英雄',
      fx: (e, time, y) => { const T = e.tongue; if (e.pat !== 5 || !T) return; const c = Math.cos(T.a), s = Math.sin(T.a);
        if (T.tele > 0) { if (Math.floor(time * 16) % 2) for (let i = 10; i < 140; i += 4) px(e.x + c * i, y - 8 + s * i, 1, 1, '#ff8a9a'); return; }
        for (let i = 4; i < T.len; i++) px(e.x + c * i, y - 8 + s * i, 2, 2, '#8a2a5a'); } },
    voidGod: { hp: 900, hw: 11, hh: 6, h: 14, fly: true, scale: 1.1, spr: () => SPR.voidGod, gold: [0, 0], col: ['#2a0a40', '#ff3060', '#ffffff'], boss: true, name: '虚空之神',
      fx: (e, time, y) => { beamFx('#ff3060', '#b45aff')(e, time, y); gatesFx(e); holeFx(e);
        if (e.immune) { g.globalAlpha = 0.3 + 0.2 * Math.sin(time * 8); ellipse(e.x, y - 9, 18, 14, '#ff3060'); g.globalAlpha = 1; } } },
  },
  ai: {
    riftWalker: updRiftWalker, mazeLord: updMazeLord, fallen: updFallen, voidGod: updVoidGod,
  },
  bossLight: { riftWalker: [180, 80, 255], mazeLord: [150, 120, 220], fallen: [255, 80, 120], voidGod: [255, 60, 120] },
  regions: ACT6,
});
EDEF.voidGod.onDeath = godOnDeath;
// the maze lord fights in an arena whose pillars are live; give region 2's boss room that mechanic
ACT6[1].mechPick = r => r.type === 'boss' ? 'mazeArena' : 'shift';
