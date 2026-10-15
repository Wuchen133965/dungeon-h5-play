'use strict';
// ============================================================ 第三幕 · 腐沼: 4 regions, 3 mobs + 1 elite, 4 bosses, 4 map mechanics
// poison water / spreading fungus / tides + phasing ghosts / egg sacs. Registers into ACTS[2] / EDEF / AI / MECH / SPR.

// ---------------------------------------------------------------- sprites
SPR.leech = [['..........', '..oooooo..', '.ommmmmmo.', 'omemmmmmmo', 'ommmmmmmmo', '.oooooooo.'],
  ['..........', '...oooooo.', '..ommmmmmo', '.omemmmmmo', 'ommmmmmmo.', '.ooooooo..']].map(r => makeSprite(r, { o: '#1a1010', m: '#6a2a3a', e: '#ff6070' }));
SPR.frog = [['...oo..oo...', '..oeeooeeo..', '.oggggggggo.', 'oggggwwggggo', 'oggggggggggo', '.oGGGGGGGGo.', 'oGo.oooo.oGo', 'oo........oo'],
  ['............', '...oo..oo...', '..oeeooeeo..', '.oggggggggo.', 'oggggwwggggo', 'oGGGGGGGGGGo', '.oGooooooGo.', '..oo....oo..']]
  .map(r => makeSprite(r, { o: '#14200e', g: '#6a9a3a', G: '#3a6a22', w: '#e0f0a0', e: '#ffe060' }));
const ZOMBIE_TOP = ['...oooo...', '..oggggo..', '..oegego..', '..oggggo..', '...oddo...', '.oobbbboo.', 'og.obbo.go', 'og.obbo.go', '...obbo...'];
SPR.bloat = strideFrames(ZOMBIE_TOP, 'b')
  .map(r => makeSprite(r, { o: '#14100e', g: '#8aa070', e: '#ff4040', d: '#3a2a2a', b: '#6a5a4a' }));
SPR.drowned = strideFrames(ZOMBIE_TOP, 'b')
  .map(r => makeSprite(r, { o: '#0e1a24', g: '#7ab0b8', e: '#c0ffff', d: '#2a3a4a', b: '#3a5a6a' }));
SPR.bogKing = GOLEM_ROWS.map(r => makeSprite(r, { o: '#0e140a', g: '#4a6a2a', y: '#d0ff70', l: '#8ac040' }));
SPR.toad = makeSprite([
  '....oooo....oooo....', '...oeeeeo..oeeeeo...', '...oeEEeo..oeEEeo...', '..ooggggoooogggggo..', '.oggggggggggggggggo.',
  'oggggggggggggggggggo', 'oggwwwwwwwwwwwwwwggo', 'oggwmmmmmmmmmmmmwggo', 'ogggwwwwwwwwwwwwgggo', 'oggggggggggggggggggo',
  '.oGGGGGGGGGGGGGGGGo.', 'oGGooGGGGGGGGGGooGGo', 'oGo..oooooooooo..oGo', 'oo..................'],
  { o: '#101a08', g: '#5a8a2a', G: '#3a5a1a', w: '#d8e8a0', m: '#8a2a3a', e: '#ffe060', E: '#101a08' });
SPR.mycelia = makeSprite([
  '.....oooooooo.....', '...oorrrwrrrroo...', '..orrwrrrrrwrrro..', '.orrrrrrwrrrrrrro.', 'orrwrrrrrrrrrwrrro', 'oooooooooooooooooo',
  '......osseeso.....', '......osssssso....', '.....ossssssso....', '.....osssssso.....', '....ossssssso.....', '....oooooooo......'],
  { o: '#1a0a1a', r: '#9a3ab0', w: '#f0d0ff', s: '#e0d0b8', e: '#3a1a3a' });
SPR.captain = makeSprite([
  '....oooooooooo....', '...obbbbbbbbbbo...', '..obbbbyyyybbbbo..', '.oooooooooooooooo.', '....owwwwwwwwo....', '....owewwwweewo...',
  '....owwwwwwwwo....', '.....owwmmwwo.....', '...ocooccccoocco..', '..occccccccccccco.', '.occccyccccyccccco', '.occcccccccccccco.',
  '..occccccccccco...', '...oooocccoooo....', '......occco.......', '.......ooo........'],
  { o: '#081420', b: '#1a2a3a', y: '#ecba40', w: '#a8e8e0', e: '#40ffd0', m: '#2a4a4a', c: '#2a6a6a' });
SPR.broodmother = makeSprite([
  '..o...........o...', '.o.o.oooooo.o.o...', 'o...ommmmmmo...o..', '...ommemmemmo.....', '..ommmmmmmmmmo....', '.ommmmrrrrmmmmo...',
  'ommmmrrrrrrmmmmo..', 'ommmrrrrrrrrmmmo..', 'ommmmrrrrrrmmmmo..', '.ommmmmmmmmmmmo...', '..oommmmmmmmoo....', 'o.o..oooooo..o.o..', '.o............o...'],
  { o: '#1a0810', m: '#8a2a3a', r: '#d85060', e: '#ffe060' });
SPR.eggsac = [['..oooo..', '.ommmmo.', 'ommwmmmo', 'ommmmmmo', 'ommmmmmo', '.oooooo.'], ['.oooooo.', 'ommmmmmo', 'ommwmmmo', 'ommmmmmo', 'ommmmmmo', '.oooooo.']]
  .map(r => makeSprite(r, { o: '#2a0a14', m: '#c86a7a', w: '#ffd0d8' }));
SPR.hatchling = SPIDER_ROWS.map(r => makeSprite(r, { o: '#1a0810', b: '#a83a4a', e: '#ffe060' }));

// ---------------------------------------------------------------- projectiles + shared helpers
const poisonP = (t = 3) => p => { p.tox = Math.max(p.tox, t); };
SHOT_DRAW.spit = s => { px(s.x - 1, s.y - 1, 3, 3, '#7adc5a'); px(s.x - 1, s.y - 1, 1, 1, '#d0ffb0'); };
SHOT_DRAW.water = s => { px(s.x - 1, s.y - 2, 3, 4, '#5ab0d0'); px(s.x, s.y - 2, 1, 1, '#d8f8ff'); };
Object.assign(SHOT_SPARK, { spit: ['#7adc5a', '#d0ffb0'], water: ['#5ab0d0', '#d8f8ff'] });
Object.assign(SHOT_LIGHT, { spit: [120, 230, 90], water: [110, 190, 230] });
const spitShot = (x, y, a, sp, o = {}) => enemyShot(x, y, a, sp, 'spit', { onHit: poisonP(o.tox || 3), ...o });
// green cloud on the floor that poisons while you stand in it (handled with G.flames, see entities.js)
const poisonCloud = (x, y, r = 14, life = 3) => G.flames.push({ x, y, r, life, spore: true });

// ---------------------------------------------------------------- mobs + elite
Object.assign(ENAME, { leech: '沼泽蛭', frog: '毒蛙', bloat: '腐尸', drowned: '溺亡水手' });
Object.assign(EDEF, {
  leech: { hp: 10, hw: 5, hh: 3, h: 6, spr: e => SPR.leech[Math.floor(e.anim * 4) % 2], gold: [1, 2], col: ['#6a2a3a', '#ff6070'],
    onTouch: e => { e.hp = Math.min(e.max, e.hp + 4); addFloat(e.x, e.y - 10, '吸血', '#ff6070'); } },
  frog: { hp: 8, hw: 5, hh: 3, h: 8, spr: e => SPR.frog[e.z > 1 ? 1 : 0], gold: [1, 2], col: ['#6a9a3a', '#e0f0a0'] },
  bloat: { hp: 14, hw: 4, hh: 4, h: 12, spr: anim2(SPR.bloat, 4), gold: [2, 3], col: ['#8aa070', '#6a5a4a'],
    onDeath: e => { if (e.noBoom) return; warn(e.x, e.y, 20, 0.5, w => { areaHit(w.x, w.y, w.r, 1); SFX.boom(); poisonCloud(w.x, w.y, 18, 3.5);
      burst(w.x, w.y, 22, ['#7adc5a', '#8aa070', '#d0ffb0'], { sp: 90, life: 0.45 }); }, [120, 230, 90]); } },
  drowned: { hp: 9, hw: 4, hh: 4, h: 12, fly: true, alpha: 0.75, spr: anim2(SPR.drowned, 4), gold: [1, 2], col: ['#7ab0b8', '#c0ffff'], glow: [110, 220, 220] },
  bogKing: { hp: 75, hw: 8, hh: 6, h: 13, spr: anim2(SPR.bogKing, 3), gold: [9, 12], col: ['#4a6a2a', '#d0ff70', '#8ac040'], elite: true, heavy: true, scale: 1.4,
    name: '沼泽巨像', tele: e => e.state === 1 },
});
Object.assign(AI, {
  leech: (e, dt, ang, d) => updLeech(e, dt, ang, d),
  // frog: hop toward you, spit 2 poison globs between hops
  frog: (e, dt, ang, d) => {
    if (e.state === 0 && e.t <= 0) {
      if (d < 120 && rand() < 0.5) { e.t = rnd(1.1, 1.6) / fspd(); e.flash = 0.06; SFX.puff(); for (const k of [-0.15, 0.15]) spitShot(e.x, e.y - 5, ang + k, 80); }
      else { e.state = 1; e.t = 0.42; e.hx = Math.cos(ang + rnd(-0.6, 0.6)); e.hy = Math.sin(ang + rnd(-0.6, 0.6)); } }
    if (e.state === 1) { e.z = Math.sin((1 - e.t / 0.42) * Math.PI) * 9; if (e.t <= 0) { e.state = 0; e.z = 0; e.t = rnd(0.5, 1) / fspd(); } return { x: e.hx * 80, y: e.hy * 80 }; }
    return Z0;
  },
  bloat: (e, dt, ang) => V(ang, 22 * fspd()),
  // drowned: a ghost, floats over wrecks and pillars toward you, throws a water bolt now and then
  drowned: (e, dt, ang, d) => { drownedTide(e);
    if (e.t <= 0 && d < 130) { e.t = rnd(2, 3) / fspd(); enemyShot(e.x, e.y - 8, ang, 75, 'water'); SFX.shoot(); }
    return V(ang + Math.sin(e.anim * 1.7) * 0.4, 28 * fspd()); },
  bogKing: (e, dt, ang, d) => {
    if (e.state === 0) { if (d < 56 && e.t <= 0) { e.state = 1; e.t = 0.8; } return V(ang, 22 * fspd()); }
    e.flash = Math.floor(e.t * 16) % 2 ? 0.05 : 0;
    if (e.t <= 0) { e.state = 0; e.t = rnd(1.6, 2.2) / fspd(); SFX.slam(); shake(6); ring(e.x, e.y - 3, 36, [140, 230, 90], 0.3); areaHit(e.x, e.y - 3, 34);
      poisonCloud(e.x, e.y, 26, 4); const o = rnd(0, 1); for (let i = 0; i < 10; i++) spitShot(e.x, e.y - 5, o + i * Math.PI / 5, 66);
      burst(e.x, e.y, 22, ['#4a6a2a', '#d0ff70', '#7adc5a'], { sp: 90, life: 0.4 }); }
    return Z0;
  },
});

// ---------------------------------------------------------------- map mechanics
const T_BOG = 7, T_MOSS = 8;
const doorLane = roomSafeLane;
function paintBlobs(r, v, n, rx0, rx1, ry0, ry1) {
  const t = r.tiles;
  for (let k = 0; k < Math.ceil(n * 1.25); k++) { const cx = rint(3, RW - 4), cy = rint(2, RH - 3), rx = rnd(rx0, rx1) * 1.1, ry = rnd(ry0, ry1) * 1.1;
    for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
      if (t[y * RW + x] !== 0 || doorLane(x, y)) continue;
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 + (hash2(x * 3 + v, y * 7) - 0.5) * 0.7) t[y * RW + x] = v; } }
}
const edgeOf = (t, tx, ty, v) => (dx, dy) => { const u = tx + dx, w = ty + dy; return u < 0 || w < 0 || u >= RW || w >= RH || t[w * RW + u] !== v; };
const playerTile = (r, p) => { const tx = Math.floor(p.x / TS), ty = Math.floor((p.y - 2) / TS); return tx < 0 || ty < 0 || tx >= RW || ty >= RH ? 0 : r.tiles[ty * RW + tx]; };
// bog: poison water slows and poisons you (not swamp natives); lily pads inside the water are safe stepping stones
const SWAMP_NATIVE = new Set(['leech', 'frog', 'toad', 'bogKing']);
const MECH_BOG = {
  build(r) { if (calmRoom(r)) return; paintBlobs(r, T_BOG, r.type === 'boss' ? 3 : 3, 2.5, 4.5, 1.5, 2.6);
    r.pads = []; for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] === T_BOG && hash2(i, 41) > 0.82) { r.tiles[i] = 0; r.pads.push(i); } },
  art(r, g) { const t = r.tiles, P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { if (t[ty * RW + tx] !== T_BOG) continue;
      const x = tx * TS, y = ty * TS, v = hash2(tx * 5, ty * 3), E = edgeOf(t, tx, ty, T_BOG);
      P(x, y, TS, TS, v > 0.5 ? '#2e4a24' : '#284220'); if (v > 0.6) P(x + 4, y + 6, 5, 1, '#3e5e2e');
      if (E(0, -1)) P(x, y, TS, 2, '#1a2a14'); if (E(0, 1)) P(x, y + TS - 1, TS, 1, '#4a6a32'); if (E(-1, 0)) P(x, y, 1, TS, '#1a2a14'); if (E(1, 0)) P(x + TS - 1, y, 1, TS, '#1a2a14'); }
    for (const i of r.pads || []) { const x = (i % RW) * TS, y = Math.floor(i / RW) * TS;
      P(x, y, TS, TS, '#284220'); P(x + 2, y + 3, 12, 10, '#4a8a3a'); P(x + 3, y + 2, 10, 12, '#4a8a3a'); P(x + 8, y + 3, 2, 5, '#284220'); P(x + 4, y + 4, 3, 1, '#7ab85a'); } },
  update(r, dt) {
    const p = G.player; if (playerTile(r, p) === T_BOG && p.rolling <= 0) { p.tox = Math.max(p.tox, 0.6); }
    for (const e of G.enemies) e.bogged = !e.fly && !SWAMP_NATIVE.has(e.kind) && tileAt(r, e.x, e.y - 2) === T_BOG;
  },
  move(r, p, dt, vx, vy) { return playerTile(r, p) === T_BOG ? { x: vx * 0.6, y: vy * 0.6 } : null; },
  draw(r, time) { for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] === T_BOG && Math.floor(time * 1.3 + hash2(i, 7) * 9) % 7 === 0) {
      const x = (i % RW) * TS + 4 + hash2(i, 3) * 8, y = Math.floor(i / RW) * TS + 4 + hash2(i, 5) * 8, k = (time * 1.3 + hash2(i, 7) * 9) % 1;
      g.globalAlpha = 1 - k; ellipse(x, y, 1 + k * 4, 0.6 + k * 2, '#6a9a4a'); g.globalAlpha = 1; } },
};
// fungus: moss spreads one tile every few seconds while the room is locked; moss slows you. Dead enemies leave spore clouds.
const MECH_FUNGUS = {
  build(r) { if (calmRoom(r)) return; paintBlobs(r, T_MOSS, 2, 1.5, 2.5, 1, 1.6); r.mossT = 0; },   // moss is drawn live (it grows)
  update(r, dt) {
    const p = G.player;
    if (r.locked && (r.mossT = (r.mossT || 0) + dt) > 1.4) { r.mossT = 0;
      const cand = []; for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] === T_MOSS) { const x = i % RW, y = Math.floor(i / RW);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, w = y + dy; if (u > 0 && w > 0 && u < RW - 1 && w < RH - 1 && r.tiles[w * RW + u] === 0 && !doorLane(u, w)) cand.push(w * RW + u); } }
      if (cand.length) r.tiles[pick(cand)] = T_MOSS; }
    if (playerTile(r, p) === T_MOSS) p.slow = Math.max(p.slow, 0.15);
  },
  kill(r, e) { if (!EDEF[e.kind].boss && rand() < 0.6) poisonCloud(e.x, e.y, 13, 2.6); },
  draw(r, time) {
    for (let i = 0; i < r.tiles.length; i++) { if (r.tiles[i] !== T_MOSS) continue;
      const x = (i % RW) * TS, y = Math.floor(i / RW) * TS, v = hash2(i, 13);
      g.globalAlpha = 0.85; px(x, y, TS, TS, v > 0.5 ? '#5a3a6a' : '#4e3260'); g.globalAlpha = 1;
      for (let k = 0; k < 4; k++) px(x + 2 + hash2(i, k) * 11, y + 2 + hash2(k, i) * 11, 2, 2, k % 2 ? '#9a6ab0' : '#c890e0');
      if (Math.floor(time * 2 + v * 9) % 6 === 0) px(x + 7, y + 6, 1, 1, '#f0d0ff'); }
  },
};
// tide: every ~9 s the water rises over the lower part of the room for 4 s (warned 1.2 s ahead); wading through it is slow.
// The level goes 0 -> 1 (1 = water up to the room's middle row).
const TIDE_TOP = RPH * 0.5;
const MECH_TIDE = {
  update(r, dt) {
    const W = r.tide = r.tide || { t: rnd(3, 5), ph: 0, lv: 0 };
    if (calmRoom(r)) { W.lv = 0; return; }
    W.t -= dt;
    if (W.t <= 0) { W.ph = (W.ph + 1) % 3; W.t = [rnd(5, 7), 1.2, 4][W.ph]; if (W.ph === 1) { SFX.puff(); noise(1.4, { vol: 0.14, freq: 300, type: 'lowpass' }); } }
    W.lv = clamp(W.lv + (W.ph === 2 ? dt * 1.4 : -dt * 0.9));
    for (const e of G.enemies) e.bogged = !e.fly && tideAt(r, e.y);
  },
  move(r, p, dt, vx, vy) { return tideAt(r, p.y) ? { x: vx * 0.55, y: vy * 0.55 } : null; },
  draw(r, time) {
    const W = r.tide; if (!W) return;
    if (W.ph === 1 && Math.floor(time * 6) % 2) { g.globalAlpha = 0.4; px(TS, TIDE_TOP, RPW - 2 * TS, 1, '#8ad8ff'); g.globalAlpha = 1; }
    if (W.lv <= 0) return;
    const top = lerp(RPH - TS, TIDE_TOP, W.lv);
    g.globalAlpha = 0.42; g.fillStyle = '#2a6a8a'; g.fillRect(TS, top, RPW - 2 * TS, RPH - TS - top); g.globalAlpha = 0.7;
    for (let x = TS; x < RPW - TS; x += 4) px(x, top + Math.sin(time * 3 + x * 0.3) * 1.2, 3, 1, '#a8e8ff');
    g.globalAlpha = 1;
  },
};
const tideAt = (r, y) => r.tide && r.tide.lv > 0.05 && y > lerp(RPH - TS, TIDE_TOP, r.tide.lv);
// egg sacs: fight rooms start with 2-4 sacs (harmless enemies). Each hatches 3 hatchlings after 10 s unless destroyed.
// The room only counts as cleared once the sacs are gone too (they are enemies), so you must deal with them.
Object.assign(EDEF, {
  eggsac: { hp: 12, hw: 5, hh: 4, h: 7, harmless: true, heavy: true, spr: e => SPR.eggsac[Math.floor(e.anim * (e.t < 3 ? 6 : 2)) % 2], gold: [0, 1], col: ['#c86a7a', '#ffd0d8'],
    tele: e => e.t < 2 },
  hatchling: { hp: 4, hw: 4, hh: 3, h: 7, spr: e => SPR.hatchling[Math.floor(e.anim * 12) % 2], gold: [0, 1], col: ['#a83a4a', '#ffe060'] },
});
AI.eggsac = (e, dt) => { e.kbx = e.kby = 0;
  if (e.t <= 0) { e.hp = 0; e.noBoom = true; SFX.puff(); burst(e.x, e.y - 4, 18, ['#c86a7a', '#ffd0d8', '#ffffff'], { sp: 70, life: 0.4 });
    for (let i = 0; i < 3; i++) spawnEnemy('hatchling', e.x + rnd(-8, 8), e.y + rnd(-5, 5), 0.1); }
  return Z0; };
AI.hatchling = (e, dt, ang) => V(ang + Math.sin(e.anim * 6) * 0.8, 62 * fspd());
Object.assign(ENAME, { eggsac: '卵囊', hatchling: '幼虫' });
const MECH_NEST = {
  spawn(r) {                                                // called from spawnWave hook below
    if (r.type !== 'combat' && r.type !== 'stairs' && r.type !== 'challenge') return;
    for (let i = 0, n = rint(2, r.type === 'combat' ? 4 : 2); i < n; i++) { const s = freeSpot(r, 50, G.player.x, G.player.y); const e = spawnEnemy('eggsac', s.x, s.y, 0.3); e.t = rnd(9, 12); }
  },
  draw(r, time) { for (const e of G.enemies) if (e.kind === 'eggsac' && e.spawn <= 0 && e.t < 10) {
    const k = clamp(1 - e.t / 10), w = Math.round(14 * k); px(e.x - 7, e.y + 3, 14, 1, '#2a0a14'); px(e.x - 7, e.y + 3, w, 1, k > 0.8 ? '#ff4058' : '#c86a7a'); } },
};
Object.assign(MECH, { bog: MECH_BOG, fungus: MECH_FUNGUS, tide: MECH_TIDE, nest: MECH_NEST });

// ---------------------------------------------------------------- bosses
// 沼泽巨蟾: hops / tongue lash that drags you in / belly flop shockwave / spits a fan that leaves poison puddles
function updToad(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0.2; e.k = 0; e.state = 0; e.t = [1.6, 1.5, 1.8, 1.6][e.pat] / sp; e.tongue = null;
    if (e.pat === 1) { e.tongue = { a: ang, len: 0, tele: 0.55 / sp, hit: false }; }
  }
  e.sub -= dt;
  if (e.pat === 0) {                                          // hops toward you
    if (e.state === 0 && e.sub <= 0) { e.state = 1; e.hopT = 0.5; e.hx = Math.cos(ang); e.hy = Math.sin(ang); }
    if (e.state === 1) { e.hopT -= dt; e.z = Math.sin((1 - e.hopT / 0.5) * Math.PI) * 14;
      if (e.hopT <= 0) { e.state = 0; e.z = 0; e.sub = 0.3; SFX.slam(); shake(3); areaHit(e.x, e.y, 18); } return { x: e.hx * 90 * sp, y: e.hy * 90 * sp }; }
    return Z0;
  }
  if (e.pat === 1 && e.tongue) {                              // tongue: telegraph line, shoots out to 150 px, pulls you in on hit
    const T = e.tongue;
    if (T.tele > 0) { T.tele -= dt; T.a = ang; e.t = Math.max(e.t, 0.8); return Z0; }
    T.len = Math.min(150, T.len + dt * 520);
    if (!T.hit && p.rolling <= 0 && beamHits(e.x, e.y - 8, T.a, T.len, 5)) { T.hit = true; const i0 = p.inv; hurtPlayer(1, e.x, e.y);
      if (p.inv > i0) { const d = norm({ x: e.x - p.x, y: e.y - p.y }); p.kbx = d.x * 420; p.kby = d.y * 420; } }   // only a landed hit drags you in
    return Z0;
  }
  if (e.pat === 2 && e.sub <= 0 && e.k === 0) { e.k = 1; SFX.boom(); shake(8);   // belly flop: 2 expanding rings
    for (let j = 0; j < (enr ? 3 : 2); j++) G.later.push({ t: j * 0.3, fn: () => { ring(e.x, e.y - 2, 30 + j * 26, [140, 230, 90], 0.35);
      spikeRing(e.x, e.y, 30 + j * 26, 10 + j * 4, 0.45, j * 0.4); } }); }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.5 / sp; SFX.puff();
    for (let i = -2; i <= 2; i++) { const s = spitShot(e.x, e.y - 8, ang + i * 0.22, 92); s.onHit = poisonP(3); }
    G.later.push({ t: 0.7, fn: () => poisonCloud(clamp(p.x, 30, RPW - 30), clamp(p.y, 30, RPH - 20), 15, 3) }); }
  return Z0;
}
// 菌王: drifts slowly / plants spore pods (burst into clouds if not popped in time) / spore spiral / splits off clones at 66% and 33%
function updMycelia(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  for (const th of [0.66, 0.33]) if (!e['split' + th] && e.hp < e.max * th) { e['split' + th] = true; SFX.puff(); addFloat(e.x, e.y - 26, '分裂!', '#c890e0', true);
    for (let i = 0; i < 2; i++) { const s = freeSpot(G.room, 30, p.x, p.y); spawnEnemy('sporeling', s.x, s.y, 0.4); } }
  if (e.t <= 0) { if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 3); e.sub = 0.2; e.k = 0; e.t = [1.8, 2.0, 2.2][e.pat] / sp;
    if (e.pat === 1) for (let i = 0; i < (enr ? 4 : 3); i++) { const s = freeSpot(G.room, 40, p.x, p.y); const pod = spawnEnemy('sporepod', s.x, s.y, 0.3); pod.t = 4; } }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.sin(e.anim) * 0.8, 18 * sp);
  if (e.pat === 2 && e.sub <= 0 && e.k < 6) { e.k++; e.sub = 0.3 / sp; const n = enr ? 9 : 7, o = e.k * 0.25 + e.anim;
    for (let i = 0; i < n; i++) enemyShot(e.x, e.y - 8, o + i * Math.PI * 2 / n, 58, 'spore', { life: 2.4, onHit: poisonP(2.5) }); SFX.puff(); }
  return Z0;
}
Object.assign(EDEF, {
  sporeling: { hp: 30, hw: 6, hh: 4, h: 10, scale: 1, spr: () => SPR.shroom, gold: [1, 2], col: ['#b04ad0', '#f0e0f8'], name: '孢子分身' },
  sporepod: { hp: 6, hw: 4, hh: 3, h: 6, harmless: true, heavy: true, spr: e => SPR.eggsac[Math.floor(e.anim * (e.t < 1.5 ? 8 : 2)) % 2], gold: [0, 0], col: ['#b04ad0', '#f0d0ff'],
    tele: e => e.t < 1.2 },
});
AI.sporeling = (e, dt, ang) => { if (e.t <= 0) { e.t = rnd(2, 2.8); for (let i = 0; i < 6; i++) enemyShot(e.x, e.y - 5, i * Math.PI / 3 + e.anim, 48, 'spore', { life: 2, onHit: poisonP(2) }); SFX.puff(); }
  return V(ang + Math.sin(e.anim) * 0.8, 14); };
AI.sporepod = (e, dt) => { e.kbx = e.kby = 0; if (e.t <= 0) { e.hp = 0; e.noBoom = true; poisonCloud(e.x, e.y, 22, 4); SFX.boom(); ring(e.x, e.y, 22, [180, 120, 220], 0.3); } return Z0; };
// 幽灵船长: cannon volley (telegraphed impacts) / anchor throw that returns / summons drowned sailors / passes through pillars
function updCaptain(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.t <= 0) { if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0.2; e.k = 0; e.t = [1.4, 2.0, 2.0, 1.6][e.pat] / sp;
    if (e.pat === 3 && G.enemies.filter(o => o.kind === 'drowned').length < 4) for (let i = 0; i < (enr ? 3 : 2); i++) { const s = freeSpot(G.room, 40, p.x, p.y, 'fly'); spawnEnemy('drowned', s.x, s.y, 0.6); } }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.PI / 2 * Math.sin(e.anim * 0.7), 34 * sp);
  if (e.pat === 1 && e.sub <= 0 && e.k < (enr ? 8 : 6)) { e.k++; e.sub = 0.22 / sp; SFX.shoot();       // cannon volley
    const x = clamp(p.x + rnd(-36, 36), 24, RPW - 24), y = clamp(p.y + rnd(-24, 24), 28, RPH - 18);
    warn(x, y, 12, 0.85, w => { areaHit(w.x, w.y, w.r, 1); SFX.boom(); shake(3); ring(w.x, w.y, w.r + 3, [120, 220, 220], 0.3); burst(w.x, w.y, 14, ['#5ab0d0', '#ffffff'], { sp: 80, life: 0.4, up: true }); }, [90, 200, 220]); }
  if (e.pat === 2 && e.k === 0 && e.sub <= 0) { e.k = 1; SFX.heavy();                                // anchor: out and back
    const a = Math.atan2(p.y - e.y, p.x - e.x), s = enemyShot(e.x, e.y - 8, a, 190, 'anchor', { r: 6, life: 2.2, dmg: 1 });
    s.home = e; s.out = 0.55; }
  return Z0;
}
SHOT_DRAW.anchor = s => { const a = s.rot * 0.6, c = Math.cos(a), d = Math.sin(a);
  for (let i = -4; i <= 4; i++) px(s.x + c * i, s.y + d * i, 1, 1, '#8a9aa8'); for (let i = -3; i <= 3; i++) px(s.x - d * i + c * 4, s.y + c * i + d * 4, 1, 1, '#b8c8d8'); };
Object.assign(SHOT_SPARK, { anchor: ['#8a9aa8', '#ffffff'] }); Object.assign(SHOT_LIGHT, { anchor: [150, 200, 220] });
// 巢母 (act boss): lays eggs / acid rain / burrows and erupts under you (unhittable while burrowed) / spit fan
function updBrood(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.hidden) {                                             // burrowed: a mound chases you for ~1.6 s, then erupts 0.6 s later
    e.sub -= dt; e.kbx = e.kby = 0; e.t = Math.max(e.t, 0.1);
    if (e.sub > 0.6) return V(ang, 95 * sp);
    if (e.sub > 0) { if (!e.erupt) { e.erupt = true; warn(e.x, e.y, 20, 0.6, () => {}, [220, 80, 100]); } return Z0; }
    e.hidden = false; e.erupt = false; SFX.boom(); shake(7); areaHit(e.x, e.y, 22, 2); ring(e.x, e.y, 26, [220, 90, 110], 0.35);
    burst(e.x, e.y, 30, ['#6a5040', '#d85060', '#ffe060'], { sp: 110, life: 0.5, up: true });
    const o = rnd(0, 1); for (let i = 0; i < (enr ? 12 : 8); i++) spitShot(e.x, e.y - 6, o + i * Math.PI * 2 / (enr ? 12 : 8), 70);
    e.t = 1.2; return Z0;
  }
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 5); e.sub = 0.2; e.k = 0; e.t = [1.4, 1.8, 2.2, 0.1, 1.6][e.pat] / sp;
    if (e.pat === 1 && G.enemies.filter(o => o.kind === 'eggsac').length < 6) for (let i = 0; i < (enr ? 3 : 2); i++) {
      const s = freeSpot(G.room, 40, p.x, p.y); const egg = spawnEnemy('eggsac', s.x, s.y, 0.3); egg.t = rnd(5, 7); }
    if (e.pat === 3) { e.hidden = true; e.sub = 2.2; SFX.slam(); burst(e.x, e.y, 20, ['#6a5040', '#8a7a5a'], { sp: 70, life: 0.4, up: true }); }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.sin(e.anim * 2) * 0.7, 40 * sp);
  if (e.pat === 2 && e.sub <= 0 && e.k < (enr ? 8 : 6)) { e.k++; e.sub = 0.26 / sp;          // acid rain
    const x = clamp(p.x + rnd(-44, 44), 24, RPW - 24), y = clamp(p.y + rnd(-28, 28), 28, RPH - 18);
    warn(x, y, 10, 0.75, w => { areaHit(w.x, w.y, w.r, 1); poisonCloud(w.x, w.y, 10, 2); }, [120, 230, 90]); }
  if (e.pat === 4 && e.sub <= 0 && e.k < 2) { e.k++; e.sub = 0.5; SFX.puff(); for (let i = -3; i <= 3; i++) spitShot(e.x, e.y - 6, ang + i * 0.17, 88); }
  return Z0;
}

// ---------------------------------------------------------------- regions
const ACT3 = [
  { name: '毒沼泽', pal: { wall: [58, 72, 50], floor: [70, 82, 58], mortar: [26, 34, 22], deco: [140, 200, 90] }, amb: 'rgb(128,150,118)',
    pool: [['leech', 1.2, 3, 1], ['frog', 1.4, 3, 1], ['bloat', 1.8, 1, 2]], elite: 'bogKing', boss: 'toad', bossSub: '泥沼之王',
    hazard: 0, mech: 'bog', mechName: '毒水（减速中毒）', mechTip: '毒水会让你减速并中毒，踩着荷叶走' },
  { name: '菌毯森林', pal: { wall: [74, 56, 82], floor: [80, 66, 84], mortar: [32, 22, 36], deco: [200, 140, 230] }, amb: 'rgb(140,124,156)',
    pool: [['shroom', 1.5, 2, 1], ['frog', 1.4, 2, 1], ['bloat', 1.8, 2, 1], ['leech', 1.2, 1, 2]], elite: 'bogKing', boss: 'mycelia', bossSub: '万菌之源',
    hazard: 0, mech: 'fungus', mechName: '菌毯（会蔓延）', mechTip: '菌毯会不断蔓延，敌人死后留下孢子云' },
  { name: '沉船墓地', pal: { wall: [58, 66, 78], floor: [76, 80, 84], mortar: [24, 28, 36], deco: [120, 200, 210] }, amb: 'rgb(118,136,152)',
    pool: [['drowned', 1.3, 3, 1], ['bloat', 1.8, 2, 1], ['leech', 1.2, 1, 1]], elite: 'bogKing', boss: 'captain', bossSub: '亡者之舰',
    hazard: 4, mech: 'tide', mechName: '涨潮（减速）', mechTip: '潮水会定时涌入房间下半部分，幽灵可以穿过障碍' },
  { name: '血肉巢穴', pal: { wall: [92, 46, 54], floor: [84, 56, 60], mortar: [38, 16, 22], deco: [230, 110, 130] }, amb: 'rgb(160,118,124)',
    pool: [['hatchling', 0.6, 3, 1], ['bloat', 1.8, 2, 1], ['frog', 1.4, 1, 1], ['spider', 1, 1, 2]], elite: 'bogKing', boss: 'brood', bossSub: '万虫之母',
    hazard: 0, mech: 'nest', mechName: '卵囊（会孵化）', mechTip: '卵囊过一会儿就会孵出幼虫，要尽快打破' },
];
// ---------------------------------------------------------------- bosses + regions (one table per act; see js/act-kit.js)
registerActContent(3, {
  enemies: {
    toad: { hp: 360, hw: 10, hh: 6, h: 14, spr: () => SPR.toad, gold: [0, 0], col: ['#5a8a2a', '#d8e8a0', '#8a2a3a'], boss: true, name: '沼泽巨蟾',
      fx: (e, time, y) => { const T = e.tongue; if (e.pat !== 1 || !T) return; const c = Math.cos(T.a), s = Math.sin(T.a), x0 = e.x, y0 = y - 8;
        if (T.tele > 0) { if (Math.floor(time * 16) % 2) for (let i = 10; i < 150; i += 4) px(x0 + c * i, y0 + s * i, 1, 1, '#ff8a9a'); return; }
        for (let i = 4; i < T.len; i++) px(x0 + c * i, y0 + s * i, 2, 2, '#d85060'); px(x0 + c * T.len - 1, y0 + s * T.len - 1, 3, 3, '#ff8a9a'); } },
    mycelia: { hp: 340, hw: 9, hh: 6, h: 12, spr: () => SPR.mycelia, gold: [0, 0], col: ['#9a3ab0', '#f0d0ff', '#e0d0b8'], boss: true, name: '菌王' },
    captain: { hp: 380, hw: 8, hh: 5, h: 16, fly: true, alpha: 0.85, spr: () => SPR.captain, gold: [0, 0], col: ['#2a6a6a', '#a8e8e0', '#ecba40'], boss: true, name: '幽灵船长' },
    brood: { hp: 520, hw: 9, hh: 6, h: 13, scale: 1.2, spr: () => SPR.broodmother, gold: [0, 0], col: ['#8a2a3a', '#d85060', '#ffe060'], boss: true, name: '巢母',
      onDeath: () => { for (const o of G.enemies) if (o.kind === 'eggsac') { o.hp = 0; o.noBoom = true; } } },
  },
  ai: {
    toad: updToad, mycelia: updMycelia, captain: updCaptain, brood: updBrood,
  },
  bossLight: { toad: [140, 230, 90], mycelia: [200, 120, 240], captain: [90, 220, 210], brood: [230, 90, 110] },
  regions: ACT3,
});
