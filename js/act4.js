'use strict';
// ============================================================ 第四幕 · 黄沙: 4 regions, 3 mobs + 1 elite, 4 bosses, 4 map mechanics
// quicksand / tomb traps (arrow slits + pressure plates) / scorching sun with shade / mirror walls that bounce shots.

// ---------------------------------------------------------------- sprites
SPR.scorpion = [['.o.......o..', 'o.o.....o.o.', '.ooo...ooo..', '...ommmmo...', '..ommemmmo..', '.ommmmmmmmo.', 'o.ommmmmmo.o', '.o.oooooo.o.'],
  ['..o.....o...', '.o.o...o.o..', '..ooo.ooo...', '...ommmmo...', '..ommemmmo..', '.ommmmmmmmo.', '.oommmmmmoo.', 'o..oooooo..o']]
  .map(r => makeSprite(r, { o: '#2a1808', m: '#c8883a', e: '#ff4040' }));
const MUMMY_TOP = ['...oooo...', '..owwbwo..', '..oewweo..', '..owbwwo..', '...owwo...', '.oowbwwoo.', 'ow.owwbo.w', 'ow.obwwo.o', '...owwbo..'];
SPR.mummy = [[...MUMMY_TOP, '...ow.wo..', '...ob.wo..', '...oo.oo..'], [...MUMMY_TOP, '..ow..bo..', '..ow..wo..', '..oo..oo..']]
  .map(r => makeSprite(r, { o: '#2a2418', w: '#d8ccaa', b: '#9a8a6a', e: '#40ffb0' }));
SPR.beetle = [['.o..o.', 'oooooo', 'obbbbo', 'obggbo', '.oooo.'], ['o....o', '.oooo.', 'obbbbo', 'obggbo', 'o.oo.o']]
  .map(r => makeSprite(r, { o: '#140c04', b: '#3a5a3a', g: '#8ac08a' }));
SPR.sandColossus = GOLEM_ROWS.map(r => makeSprite(r, { o: '#2a1c0c', g: '#b89058', y: '#ffe8a0', l: '#e0b060' }));
SPR.wormHead = makeSprite([
  '....oooooooo....', '..oossssssssoo..', '.ossssssssssssso', 'osswwswwwwswwsso', 'osswrwwwwwwrwsso', 'ossswwwwwwwwssso',
  'osssswwrrwwsssso', '.osssswwwwsssso.', '..oossssssssoo..', '....oooooooo....'],
  { o: '#2a1c0c', s: '#a87840', w: '#f0e0c0', r: '#c02838' });
SPR.wormSeg = makeSprite(['..oooooo..', '.osssssso.', 'ossSSSSsso', 'osSssssSso', 'ossSSSSsso', '.osssssso.', '..oooooo..'],
  { o: '#2a1c0c', s: '#a87840', S: '#d8a860' });
SPR.pharaoh = makeSprite([
  '.....oooooo.....', '....obgbgbgo....', '...obgbgbgbgo...', '...obgbwwbgbo...', '..obgowewewobgo.', '..obgowwwwwobgo.', '..obg.owwwo.bgo.',
  '...oyyyyyyyyo...', '..oywwgwwgwwyo..', '.oywwwwwwwwwwyo.', 'oywwwgyyyygwwwyo', '.oywwwwwwwwwwyo.', '..owwwwwwwwwwo..', '..owwwwwwwwwwo..', '...oooooooooo...'],
  { o: '#1a1408', b: '#2a4aa0', g: '#ecba40', w: '#e8dcc0', e: '#40ffb0', y: '#ecba40' });
SPR.canopic = makeSprite(['..oooo..', '.ogegeo.', '.oggggo.', 'oyyyyyyo', 'owwwwwwo', 'owwgwwwo', 'owwwwwwo', '.oooooo.'],
  { o: '#1a1408', g: '#ecba40', e: '#40ffb0', y: '#c88a30', w: '#d8ccaa' });
SPR.sunPriest = makeSprite([
  '......oooo......', '....oo.yy.oo....', '...o..yyyy..o...', '..o..oooooo..o..', '.....owwwwo.....', '.....oweewo.....', '......owwo......',
  '....ooyyyyoo....', '...oryyrryyro...', '..orryyrryyrro..', '..orryyyyyyrro..', '..orrryyyyrrro..', '...orryyyyrro...', '....oooooooo....'],
  { o: '#2a1404', y: '#ffd040', w: '#f0d8b0', e: '#ff6020', r: '#c84a20' });
SPR.mirrorKnight = makeSprite([
  '....pp....', '...ppp....', '..oooooo..', '.osssssso.', '.osssvvvo.', '.osssssso.', '..oSSSSo..',
  '.osssssso.', 'osswwwwsso', 'oSsssssSso', '.osssssso.', '..oso.oso.', '..oso.oso.', '..oo..oo..'],
  { o: '#141828', p: '#c8d8ff', s: '#b8c4dc', S: '#7a86a8', v: '#40e0ff', w: '#ffffff' });

// ---------------------------------------------------------------- projectiles
SHOT_DRAW.sand = s => { px(s.x - 1, s.y - 1, 3, 3, '#d8a860'); px(s.x - 1, s.y - 1, 1, 1, '#fff0c0'); };
SHOT_DRAW.dart = s => { const a = Math.atan2(s.vy, s.vx), c = Math.cos(a), d = Math.sin(a); for (let i = -3; i <= 2; i++) px(s.x + c * i, s.y + d * i, 1, 1, i > 0 ? '#e8e0d0' : '#8a6a3a'); };
SHOT_DRAW.sun = s => { const r = 3 + Math.sin(s.rot * 0.4) * 0.6; ellipse(s.x, s.y, r, r, '#ffb030'); px(s.x - 1, s.y - 1, 3, 3, '#fff0a0'); };
SHOT_DRAW.mirror = s => { px(s.x - 1, s.y - 2, 3, 5, '#c8d8ff'); px(s.x - 2, s.y - 1, 5, 3, '#c8d8ff'); px(s.x, s.y - 1, 1, 3, '#ffffff'); };
Object.assign(SHOT_SPARK, { sand: ['#d8a860', '#fff0c0'], dart: ['#e8e0d0', '#8a6a3a'], sun: ['#ffb030', '#fff0a0'], mirror: ['#c8d8ff', '#ffffff'] });
Object.assign(SHOT_LIGHT, { sand: [220, 180, 110], dart: [200, 180, 140], sun: [255, 180, 60], mirror: [180, 200, 255] });
const bleed = (t = 2) => p => { p.slow = Math.max(p.slow, t); };

// ---------------------------------------------------------------- mobs + elite
Object.assign(ENAME, { scorpion: '沙蝎', mummy: '木乃伊', beetle: '甲虫' });
Object.assign(EDEF, {
  scorpion: { hp: 11, hw: 5, hh: 3, h: 8, spr: e => SPR.scorpion[e.moving ? Math.floor(e.anim * (e.state === 1 ? 14 : 7)) % 2 : 0], gold: [1, 2], col: ['#c8883a', '#ff4040'],
    tele: e => e.state === 2 },
  mummy: { hp: 30, hw: 4, hh: 4, h: 12, spr: anim2(SPR.mummy, 3), gold: [2, 4], col: ['#d8ccaa', '#9a8a6a'], heavy: true },
  beetle: { hp: 3, hw: 3, hh: 2, h: 5, spr: e => SPR.beetle[Math.floor(e.anim * 12) % 2], gold: [0, 1], col: ['#3a5a3a', '#8ac08a'] },
  sandColossus: { hp: 80, hw: 8, hh: 6, h: 13, spr: anim2(SPR.sandColossus, 3), gold: [9, 12], col: ['#b89058', '#ffe8a0', '#e0b060'], elite: true, heavy: true, scale: 1.4,
    name: '沙岩巨像', tele: e => e.state === 1 },
});
Object.assign(AI, {
  // scorpion: circles in, tail-strike dash that slows you on hit
  scorpion: (e, dt, ang, d) => {
    if (e.state === 0) { if (e.t <= 0 && d < 80) { e.state = 2; e.t = 0.38; e.hx = Math.cos(ang); e.hy = Math.sin(ang);
        warnShape({ shape: 'cone', x: e.x, y: e.y - 3, a: ang, len: 66, arc: .32 }, .38, () => {}, [255, 170, 80]); }
      return V(ang + 0.9 * Math.sin(e.anim * 1.6), 40 * fspd()); }
    if (e.state === 2) { if (e.t <= 0) { e.state = 1; e.t = 0.26; } return Z0; }
    if (e.t <= 0) { e.state = 0; e.t = rnd(1, 1.6) / fspd(); enemyPunish(e, .6); }   // tail stuck after the lunge
    return { x: e.hx * 180, y: e.hy * 180 };
  },
  // mummy: slow and tough; reaches out with a short-range bandage lash that pulls you a little
  mummy: (e, dt, ang, d) => {
    if (e.t <= 0 && d < 70) { e.t = rnd(2.2, 3) / fspd(); e.flash = 0.1; SFX.heavy();
      for (let i = 1; i <= 4; i++) warn(e.x + Math.cos(ang) * i * 14, e.y + Math.sin(ang) * i * 10, 6, 0.5 + i * 0.06, w => { const i0 = G.player.inv; areaHit(w.x, w.y, w.r, 1);
        if (G.player.inv > i0) { const k = norm({ x: e.x - G.player.x, y: e.y - G.player.y }); G.player.kbx += k.x * 160; G.player.kby += k.y * 160; } }, [220, 200, 150]); }
    return V(ang, 14 * fspd());
  },
  beetle: (e, dt, ang) => beetleTide(e, dt, ang) || V(ang + Math.sin(e.anim * 5 + e.x) * 1.1, 70 * fspd()),
  sandColossus: (e, dt, ang, d) => {
    if (e.state === 0) { if (d < 56 && e.t <= 0) { e.state = 1; e.t = 0.8; } return V(ang, 22 * fspd()); }
    e.flash = Math.floor(e.t * 16) % 2 ? 0.05 : 0;
    if (e.t <= 0) { e.state = 0; e.t = rnd(1.6, 2.2) / fspd(); SFX.slam(); shake(6); ring(e.x, e.y - 3, 36, [230, 190, 110], 0.3); areaHit(e.x, e.y - 3, 34);
      const o = rnd(0, 1); for (let i = 0; i < 12; i++) enemyShot(e.x, e.y - 5, o + i * Math.PI / 6, 74, 'sand');
      burst(e.x, e.y, 22, ['#b89058', '#ffe8a0', '#e0b060'], { sp: 90, life: 0.4 }); }
    return Z0;
  },
});
// the scorpion's dash poisons-slows on contact
EDEF.scorpion.onTouch = (e, p) => bleed(1.5)(p);

// ---------------------------------------------------------------- map mechanics
const T_SAND = 9, T_PLATE = 10;
// quicksand: pits drag you toward their centre (you can still walk out, rolling is unaffected); the centre swallows: 1 damage
function sandPits(r) {                                      // connected sand components -> centroids (cached on the room)
  if (r.pits) return r.pits;
  const seen = new Set(), pits = [];
  for (let i = 0; i < r.tiles.length; i++) { if (r.tiles[i] !== T_SAND || seen.has(i)) continue;
    const q = [i], cells = []; seen.add(i);
    while (q.length) { const c = q.pop(); cells.push(c); const x = c % RW, y = Math.floor(c / RW);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (y + dy) * RW + x + dx; if (r.tiles[n] === T_SAND && !seen.has(n)) { seen.add(n); q.push(n); } } }
    const cx = cells.reduce((a, c) => a + (c % RW) * TS + 8, 0) / cells.length, cy = cells.reduce((a, c) => a + Math.floor(c / RW) * TS + 10, 0) / cells.length;
    pits.push({ x: cx, y: cy, cells: new Set(cells) }); }
  return (r.pits = pits);
}
const pitAt = (r, x, y) => { const i = Math.floor(y / TS) * RW + Math.floor(x / TS); return sandPits(r).find(P => P.cells.has(i)) || null; };
const MECH_QUICKSAND = {
  build(r) { if (calmRoom(r)) return; paintBlobs(r, T_SAND, r.type === 'boss' ? 2 : 3, 2, 3.2, 1.4, 2.2); r.pits = null; },
  art(r, g) { const t = r.tiles, P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { if (t[ty * RW + tx] !== T_SAND) continue;
      const x = tx * TS, y = ty * TS, v = hash2(tx * 5, ty * 3), E = edgeOf(t, tx, ty, T_SAND);
      P(x, y, TS, TS, v > 0.5 ? '#b8904e' : '#ac8446'); for (let k = 0; k < 3; k++) P(x + 2, y + 3 + k * 5, 12, 1, '#c8a060');
      if (E(0, -1)) P(x, y, TS, 1, '#7a5a2a'); if (E(-1, 0)) P(x, y, 1, TS, '#7a5a2a'); if (E(1, 0)) P(x + TS - 1, y, 1, TS, '#d8b878'); if (E(0, 1)) P(x, y + TS - 1, TS, 1, '#d8b878'); } },
  move(r, p, dt, vx, vy) {
    const P = pitAt(r, p.x, p.y - 2); if (!P) return null;
    const d = norm({ x: P.x - p.x, y: P.y - p.y }); return { x: vx * 0.7 + d.x * 46, y: vy * 0.7 + d.y * 46 };
  },
  update(r, dt) {
    const p = G.player;
    for (const P of sandPits(r)) if (dist(p.x, p.y, P.x, P.y) < 7 && p.rolling <= 0 && p.inv <= 0) {
      hurtPlayer(1, P.x + rnd(-1, 1), P.y - 1, false, true); addFloat(p.x, p.y - 22, '下陷!', '#d8a860'); burst(p.x, p.y, 14, ['#d8a860', '#8a6a3a'], { sp: 60, life: 0.4, up: true }); }
    for (const e of G.enemies) if (!e.fly && !e.link) e.bogged = !!pitAt(r, e.x, e.y - 2);
  },
  draw(r, time) { for (const P of sandPits(r)) for (let k = 0; k < 3; k++) {             // swirl at the pit centre
    const a = time * 2.2 + k * 2.09, rr = 3 + ((time * 6 + k * 4) % 10);
    g.globalAlpha = 0.6 * (1 - rr / 13); ellipse(P.x, P.y, rr, rr * 0.55, '#6a4a22', 0); px(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr * 0.55, 1, 1, '#f0d8a0'); g.globalAlpha = 1; } },
};
// tomb: arrow slits on the side walls fire across the room (glint first) while it is locked; pressure plates raise a spike ring
const MECH_TOMB = {
  build(r) {
    r.slits = []; r.plates = [];
    if (!isFight(r) && r.type !== 'boss') return;
    const rows = [2, 3, 6, 7].map(y => roomLayoutTile(0, y)[1]).sort(() => rand() - 0.5).slice(0, r.type === 'boss' ? 2 : 3);
    rows.forEach((y, i) => { const left = rand() < 0.5; r.slits.push({ x: left ? TS : RPW - TS, y: y * TS + 8, dir: left ? 1 : -1, t: 1.5 + i * 0.9, cd: 2.8 }); });
    if (r.type === 'boss') return;
    for (let k = 0, n = rint(3, 5); k < n; k++) { const x = rint(4, RW - 5), y = rint(2, RH - 3); if (r.tiles[y * RW + x] === 0 && !doorLane(x, y)) { r.tiles[y * RW + x] = T_PLATE; r.plates.push({ i: y * RW + x, cd: 0 }); } }
  },
  art(r, g) { const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    for (const s of r.slits) { const x = s.dir > 0 ? 0 : RPW - TS; P(x + 4, s.y - 2, 8, 4, '#1a1408'); P(x + 4, s.y - 2, 8, 1, '#5a4a30'); }
    for (const pl of r.plates) { const x = (pl.i % RW) * TS, y = Math.floor(pl.i / RW) * TS; P(x + 2, y + 2, 12, 12, '#6a5a40'); P(x + 3, y + 3, 10, 10, '#8a7a5a'); P(x + 6, y + 6, 4, 4, '#5a4a30'); } },
  update(r, dt) {
    const p = G.player;
    if (r.locked) for (const s of r.slits) { s.t -= dt;
      if (s.t <= 0) { s.t = s.cd; SFX.bow(); const sh = enemyShot(s.x + s.dir * 4, s.y - 6, s.dir > 0 ? 0 : Math.PI, 150, 'dart', { life: 2.4, environment: true }); sh.onHit = bleed(1); } }
    for (const pl of r.plates) { pl.cd -= dt;
      const tx = Math.floor(p.x / TS), ty = Math.floor((p.y - 2) / TS);
      if (pl.cd <= 0 && p.rolling <= 0 && ty * RW + tx === pl.i) { pl.cd = 3; SFX.block(); addFloat(p.x, p.y - 20, '咔哒', '#d8c8a0');
        spikeRing((pl.i % RW) * TS + 8, Math.floor(pl.i / RW) * TS + 10, 22, 8, 0.55, rnd(0, 1), true); } }
  },
  draw(r, time) { for (const s of r.slits) if (r.locked && s.t < 0.5 && Math.floor(time * 14) % 2) px(s.x + s.dir * 2 - 1, s.y - 7, 3, 2, '#fff0c0');
    for (const pl of r.plates) if (pl.cd > 0) { const x = (pl.i % RW) * TS, y = Math.floor(pl.i / RW) * TS; g.globalAlpha = 0.5; px(x + 3, y + 3, 10, 10, '#3a2a18'); g.globalAlpha = 1; } },
  light(r, ox, oy) { for (const s of r.slits) if (r.locked && s.t < 0.5) light(s.x + ox, s.y - 6 + oy, 20, [255, 230, 160], 0.5); },
};
// scorching sun: the room is shady, but 2-3 shafts of sunlight drift across it; standing in one burns (1 dmg / 1.2 s).
// Shafts are clearly lit (bright ellipse + light) and move slowly, so you can read and avoid them.
const MECH_SUN = {
  update(r, dt) {
    if (calmRoom(r) || !r.locked) { r.shafts = null; return; }           // only during the fight (boss rooms stay locked until the kill)
    if (!r.shafts) r.shafts = Array.from({ length: r.type === 'boss' ? 2 : rint(2, 3) }, () => ({ x: rnd(50, RPW - 50), y: rnd(36, RPH - 30), vx: rnd(-14, 14) || 8, vy: rnd(-9, 9) || 6, r: rnd(18, 24), t: 0 }));
    const p = G.player;
    for (const S of r.shafts) { S.x += S.vx * dt; S.y += S.vy * dt;
      if (S.x < 30 || S.x > RPW - 30) S.vx = -S.vx; if (S.y < 30 || S.y > RPH - 24) S.vy = -S.vy;
      if (((p.x - S.x) / S.r) ** 2 + ((p.y - S.y) / (S.r * 0.6)) ** 2 < 1) { S.t += dt;
        if (spawnP(0.4)) G.parts.push({ x: p.x + rnd(-4, 4), y: p.y - rnd(4, 14), vx: 0, vy: -20, life: 0.4, max: 0.4, col: '#ffb040', size: 1, grav: 0, add: true });
        if (S.t >= 1.2) { S.t = 0; hurtPlayer(1, S.x, S.y, true, true); } } else S.t = Math.max(0, S.t - dt * 2); }
  },
  draw(r, time) { for (const S of r.shafts || []) { g.globalAlpha = 0.22 + 0.05 * Math.sin(time * 3); ellipse(S.x, S.y, S.r, S.r * 0.6, '#ffe080');
    for (let y = -S.r * 0.6; y <= S.r * 0.6; y += 2) { const hw = Math.sqrt(Math.max(0, 1 - (y / (S.r * 0.6)) ** 2)) * S.r; g.fillStyle = '#ffd060'; g.globalAlpha = 0.1; g.fillRect(Math.round(S.x - hw), Math.round(S.y + y), Math.round(hw * 2), 1); }
    g.globalAlpha = 1; } },
  light(r, ox, oy, time) { for (const S of r.shafts || []) light(S.x + ox, S.y + oy, S.r * 2.2, [255, 220, 130], 0.75); },
};
// mirror temple: enemy shots bounce off walls once (and live longer); polished pillars glint
const MECH_MIRROR = {
  build(r) { r.mirrorWalls = !calmRoom(r); },
  art(r, g) { const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (r.tiles[ty * RW + tx] === 2) { const x = tx * TS, y = ty * TS; P(x + 3, y + 3, 10, 6, '#c8d8f0'); P(x + 4, y + 4, 3, 4, '#ffffff'); } },
  draw(r, time) { if (!r.mirrorWalls) return; const k = (time * 0.4) % 1, x = TS + k * (RPW - 2 * TS);       // a glint sweeping along the walls
    g.globalAlpha = 0.5; px(x, TS, 6, 1, '#ffffff'); px(RPW - x, RPH - TS - 1, 6, 1, '#ffffff'); g.globalAlpha = 1; },
};
Object.assign(MECH, { quicksand: MECH_QUICKSAND, tomb: MECH_TOMB, sun: MECH_SUN, mirror: MECH_MIRROR });

// ---------------------------------------------------------------- bosses
// 巨型沙虫: a head with 7 body segments that follow its trail. Segments pass 60% of damage to the head. Surfaces and
// chases / burrows (whole body hidden), a mound hunts you, then erupts under you / spits sand fans. Enraged: the body shoots too.
const WORM_SEGS = 7, WORM_GAP = 5;                            // trail points (2 px apart) between segments
function wormBody(e) {
  if (!e.segs) { e.trail = []; e.segs = [];
    for (let i = 0; i < WORM_SEGS; i++) { const s = spawnEnemy('wormSeg', e.x, e.y, 0); s.link = e; s.linkMul = 0.6; s.hp = s.max = 99999; s.idx = i; e.segs.push(s); } }
  const T = e.trail, last = T[T.length - 1];
  if (!last || dist(last.x, last.y, e.x, e.y) >= 2) { T.push({ x: e.x, y: e.y }); if (T.length > (WORM_SEGS + 1) * WORM_GAP + 2) T.shift(); }
  for (const s of e.segs) { const q = T[Math.max(0, T.length - 1 - (s.idx + 1) * WORM_GAP)] || e; s.x = q.x; s.y = q.y; s.hidden = e.hidden; s.kbx = s.kby = 0; s.spawn = 0; }
}
function updWorm(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  wormBody(e); e.kbx = e.kby = 0;
  if (e.hidden) {
    e.sub -= dt; e.t = Math.max(e.t, 0.1);
    if (e.sub > 0.7) return V(ang, 110 * sp);
    if (e.sub > 0) { if (!e.erupt) { e.erupt = true; warn(e.x, e.y, 22, 0.7, () => {}, [230, 170, 90]); } return Z0; }
    e.hidden = false; e.erupt = false; e.trail = [{ x: e.x, y: e.y }];            // body emerges from the hole
    SFX.boom(); shake(8); areaHit(e.x, e.y, 24, 2); ring(e.x, e.y, 28, [230, 180, 100], 0.35);
    burst(e.x, e.y, 34, ['#d8a860', '#8a6a3a', '#fff0c0'], { sp: 120, life: 0.5, up: true });
    const o = rnd(0, 1); for (let i = 0; i < (enr ? 14 : 10); i++) enemyShot(e.x, e.y - 6, o + i * Math.PI * 2 / (enr ? 14 : 10), 72, 'sand');
    e.t = 1.0; return Z0;
  }
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 3); e.sub = 0.2; e.k = 0; e.t = [2.4, 0.1, 1.8][e.pat] / sp;
    if (e.pat === 1) { e.hidden = true; e.sub = 2.3; SFX.slam(); burst(e.x, e.y, 24, ['#d8a860', '#8a6a3a'], { sp: 80, life: 0.4, up: true }); }
  }
  e.sub -= dt;
  if (e.pat === 0) {                                          // surfaced: weaving chase; enraged, the body throws sand at you
    if (enr && e.sub <= 0) { e.sub = 0.9; for (const s of e.segs) if (s.idx % 2) enemyShot(s.x, s.y - 4, Math.atan2(p.y - s.y, p.x - s.x), 70, 'sand'); SFX.shoot(); }
    return V(ang + Math.sin(e.anim * 2.4) * 0.9, 74 * sp);
  }
  if (e.pat === 2 && e.sub <= 0 && e.k < 3) { e.k++; e.sub = 0.45 / sp; SFX.puff();
    for (let i = -3; i <= 3; i++) enemyShot(e.x, e.y - 8, ang + i * 0.15, 96, 'sand'); }
  return Z0;
}
Object.assign(EDEF, {
  wormSeg: { hp: 99999, hw: 5, hh: 4, h: 7, heavy: true, spr: () => SPR.wormSeg, gold: [0, 0], col: ['#a87840', '#d8a860'] },
});
AI.wormSeg = () => Z0;
// 不朽法老: curse beam (locks a line, then blasts) / raises mummies / sarcophagus ward: immune while canopic jars stand,
// the jars slowly heal him, so break them / scarab swarm
function updPharaoh(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.immune) { const jars = G.enemies.filter(o => o.kind === 'canopic' && o.hp > 0);
    if (!jars.length || (e.wardT -= dt) <= 0) { e.immune = false; e.t = 1; SFX.boom(); shake(5); addFloat(e.x, e.y - 26, '守护破除!', '#ffe080', true);
      for (const j of jars) { j.hp = 0; j.noBoom = true; } }
    else if ((e.healT = (e.healT || 0) + dt) > 1) { e.healT = 0; e.hp = Math.min(e.max, e.hp + Math.round(e.max * 0.01 * jars.length)); addFloat(e.x, e.y - 24, '+', '#40ffb0'); }
    return V(ang + Math.PI / 2, 14); }
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 5); e.sub = 0.2; e.k = 0; e.t = [1.4, 1.6, 2.0, 0.5, 1.6][e.pat] / sp; e.beam = null;
    if (e.pat === 1) e.beam = { a: ang, tele: 0.75 / sp, fire: 0.45 };
    if (e.pat === 2 && G.enemies.filter(o => o.kind === 'mummy').length < 3) for (let i = 0; i < (enr ? 3 : 2); i++) { const s = freeSpot(G.room, 50, p.x, p.y); spawnEnemy('mummy', s.x, s.y, 0.8); }
    if (e.pat === 3) { for (const [dx, dy] of [[-60, -24], [60, -24], [-60, 30], [60, 30]].slice(0, enr ? 4 : 3)) { const j = spawnEnemy('canopic', clamp(e.x + dx, 30, RPW - 30), clamp(e.y + dy, 30, RPH - 22), 0.4); }
      e.immune = true; e.wardT = 7; SFX.magic(); addFloat(e.x, e.y - 26, '石棺守护 · 打碎卡诺匹斯罐', '#ffe080', true); }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.sin(e.anim) * 0.7, 26 * sp);
  if (e.pat === 1 && e.beam) { const B = e.beam;
    if (B.tele > 0) { B.tele -= dt; e.t = Math.max(e.t, 0.6); return Z0; }       // line is locked: step out of it
    B.fire -= dt; if (B.fire > 0) enemyBeamAttack(e, 8);
    if (B.fire > 0 && spawnP(0.6)) { const r = rnd(10, 200); G.parts.push({ x: e.x + Math.cos(B.a) * r, y: e.y - 12 + Math.sin(B.a) * r, vx: 0, vy: -10, life: 0.3, max: 0.3, col: '#40ffb0', size: 1, grav: 0, add: true }); }
    return Z0; }
  if (e.pat === 4 && e.sub <= 0 && e.k < (enr ? 10 : 6) && G.enemies.length < 24) { e.k++; e.sub = 0.18; spawnEnemy('beetle', e.x + rnd(-6, 6), e.y + rnd(-4, 4), 0.1); }
  return Z0;
}
// 太阳祭司: orbiting sun orbs that spiral out / a solar ray sweeping a full circle / calls an extra shaft of sunlight onto you / flare nova
function updSunPriest(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player, R = G.room;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0.2; e.k = 0; e.t = [1.8, 3.2, 1.4, 1.8][e.pat] / sp; e.beam = null;
    if (e.pat === 0) { const n = enr ? 8 : 6; for (let i = 0; i < n; i++) { const s = enemyShot(e.x, e.y, 0, 0, 'sun', { r: 4, life: 3.2 });
      s.orbit = { c: e, a: i * Math.PI * 2 / n, w: 2.2 * (i % 2 ? 1 : -1), r: 14, dr: 26 }; s.fire = true; } SFX.magic(); }
    if (e.pat === 1) e.beam = { a: ang + Math.PI * 0.6, da: rand() < 0.5 ? 1 : -1, tele: 0.8 };
    if (e.pat === 2 && R.shafts && R.shafts.length < 4) { R.shafts.push({ x: p.x, y: p.y, vx: (p.x < RPW / 2 ? 10 : -10), vy: 6, r: 22, t: 0.4 }); SFX.fire(); addFloat(p.x, p.y - 24, '烈日!', '#ffb040', true); }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.PI / 2, 22 * sp);
  if (e.pat === 1 && e.beam) { const B = e.beam;
    if (B.tele > 0) { B.tele -= dt; return Z0; }
    B.a += B.da * 1.9 * sp * dt; enemyBeamAttack(e, 6, true); return Z0; }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.55 / sp; SFX.fire();
    const n = enr ? 18 : 14, o = e.k * 0.17; for (let i = 0; i < n; i++) enemyShot(e.x, e.y - 12, o + i * Math.PI * 2 / n, 70, 'fire'); }
  return Z0;
}
// 镜像骑士 (act boss): copies your weapon type. Melee weapon -> lunging slashes (telegraphed arc); ranged -> shoots your
// projectile pattern back at you. A cracked true body can be hit to interrupt a harmless-decoy ritual.
function updMirrorKnight(e, dt, ang, d) {
  const sp = enrage(e), enr = sp > 1, p = G.player, w = p.wpn.kind, melee = !p.wpn.ranged;
  if (e.mirrorRitual) return Z0;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 3); e.sub = 0.2; e.k = 0; e.state = 0; e.t = [1.6, 2.2, 2.0, 1.6][e.pat] / sp; e.immune = false;
    if (e.pat === 2) { startMirrorRitual(e); return Z0; }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.sin(e.anim * 1.4) * 0.6, (melee ? 52 : 30) * sp);
  if (e.pat === 1) {                                          // the copied attack
    if (melee) {
      if (e.state === 0 && e.sub <= 0 && e.k < (enr ? 4 : 3)) { e.state = 1; e.sub = 0.42 / sp; e.ca = ang; e.flash = 0.06; }
      if (e.state === 1) { if (e.sub <= 0) { e.state = 2; e.sub = 0.18; SFX.swing(); e.k++;
          const r = w === 'spear' ? 40 : w === 'hammer' ? 30 : 26, arc = w === 'spear' ? 0.4 : w === 'hammer' ? Math.PI : 1.2;
          const dd = dist(e.x, e.y, p.x, p.y); if (dd < r + 6 && (dd < 8 || Math.abs(angDiff(e.ca, Math.atan2(p.y - e.y, p.x - e.x))) < arc)) hurtPlayer(1, e.x, e.y);
          ring(e.x, e.y - 6, r, [200, 220, 255], 0.2); }
        return Z0; }
      if (e.state === 2) { if (e.sub <= 0) { e.state = 0; e.sub = 0.3 / sp; } return V(e.ca, 160); }
      return V(ang, 40 * sp);
    }
    if (e.sub <= 0 && e.k < (enr ? 6 : 4)) { e.k++; e.sub = 0.45 / sp; SFX.shoot();
      const n = w === 'knives' || p.multi > 1 ? 3 : 1, kind = { bow: 'arrow', staff: 'bolt', tome: 'mirror', scepter: 'mirror', lute: 'mirror', horn: 'mirror', rod: 'mirror', knives: 'dart' }[w] || 'mirror';
      for (let i = 0; i < n; i++) enemyShot(e.x, e.y - 8, ang + (i - (n - 1) / 2) * 0.18, w === 'tome' ? 70 : 120, kind); }
    return V(ang + Math.PI / 2, 20);
  }
  if (e.pat === 2) return Z0;
  return V(ang + Math.PI / 2 * Math.sin(e.anim), 30 * sp);
}

// ---------------------------------------------------------------- regions
const ACT4 = [
  { name: '流沙荒漠', pal: { wall: [140, 108, 70], floor: [170, 136, 90], mortar: [70, 52, 30], deco: [240, 200, 130] }, amb: 'rgb(184,160,130)',
    pool: [['scorpion', 1.3, 3, 1], ['beetle', 0.5, 2, 1], ['mummy', 2, 1, 2]], elite: 'sandColossus', boss: 'sandworm', bossSub: '沙海吞噬者',
    hazard: 0, mech: 'quicksand', mechName: '流沙（会下陷）', mechTip: '流沙会把你拖向中心，陷到底会受伤，翻滚不受影响' },
  { name: '法老陵墓', pal: { wall: [110, 92, 64], floor: [128, 110, 80], mortar: [46, 36, 22], deco: [230, 190, 90] }, amb: 'rgb(150,136,112)',
    pool: [['mummy', 2, 3, 1], ['scorpion', 1.3, 2, 1], ['beetle', 0.5, 2, 1]], elite: 'sandColossus', boss: 'pharaoh', bossSub: '永生之王',
    hazard: 4, mech: 'tomb', mechName: '箭孔与压力板', mechTip: '墙上的箭孔会射箭，踩到压力板会触发地刺' },
  { name: '烈日绿洲', pal: { wall: [100, 120, 70], floor: [150, 140, 96], mortar: [50, 60, 30], deco: [255, 210, 120] }, amb: 'rgb(150,150,120)',
    pool: [['scorpion', 1.3, 3, 1], ['beetle', 0.5, 2, 1], ['firebat', 1, 1, 1], ['mummy', 2, 1, 2]], elite: 'sandColossus', boss: 'sunPriest', bossSub: '烈阳的代言人',
    hazard: 0, mech: 'sun', mechName: '烈日光柱（灼烧）', mechTip: '阳光光柱会在房间里移动，站在里面会被灼伤' },
  { name: '镜之神殿', pal: { wall: [120, 124, 150], floor: [140, 140, 160], mortar: [50, 52, 70], deco: [200, 220, 255] }, amb: 'rgb(156,156,180)',
    pool: [['mummy', 2, 2, 1], ['scorpion', 1.3, 2, 1], ['imp', 1.6, 1, 1], ['beetle', 0.5, 1, 1]], elite: 'sandColossus', boss: 'mirrorKnight', bossSub: '你的倒影',
    hazard: 4, mech: 'mirror', mechName: '镜面（弹道反弹）', mechTip: '敌人的弹道碰到墙会反弹一次' },
];
// ---------------------------------------------------------------- bosses + regions (one table per act; see js/act-kit.js)
registerActContent(4, {
  enemies: {
    sandworm: { hp: 400, hw: 9, hh: 6, h: 10, spr: () => SPR.wormHead, gold: [0, 0], col: ['#a87840', '#f0e0c0', '#c02838'], boss: true, name: '巨型沙虫',
      onDeath: e => { for (const s of e.segs || []) { s.hp = 0; s.noBoom = true; burst(s.x, s.y - 4, 10, ['#a87840', '#d8a860'], { sp: 60, life: 0.4 }); } } },
    pharaoh: { hp: 420, hw: 8, hh: 5, h: 15, spr: () => SPR.pharaoh, gold: [0, 0], col: ['#ecba40', '#e8dcc0', '#2a4aa0'], boss: true, name: '不朽法老',
      fx: (e, time, y) => { if (e.immune) { g.globalAlpha = 0.3 + 0.15 * Math.sin(time * 5); ellipse(e.x, y - 8, 15, 13, '#ffe080'); g.globalAlpha = 1; }
        const B = e.beam; if (e.pat !== 1 || !B) return; const x0 = e.x, y0 = y - 12, c = Math.cos(B.a), s = Math.sin(B.a);
        if (B.tele > 0) { if (Math.floor(time * 14) % 2) for (let i = 10; i < ROOM_BEAM_RANGE; i += 3) px(x0 + c * i, y0 + s * i, 1, 1, '#40ffb0'); return; }
        if (B.fire > 0) for (let i = 8; i < ROOM_BEAM_RANGE; i++) { const x = x0 + c * i, yy = y0 + s * i; if (x < 0 || x > RPW || yy < 0 || yy > RPH) break; px(x - s, yy + c, 2, 2, '#40ffb0'); px(x, yy, 1, 1, '#ffffff'); } } },
    canopic: { hp: 22, hw: 4, hh: 4, h: 8, harmless: true, heavy: true, spr: () => SPR.canopic, gold: [0, 1], col: ['#ecba40', '#40ffb0'], glow: [90, 255, 180] },
    sunPriest: { hp: 400, hw: 8, hh: 5, h: 14, spr: () => SPR.sunPriest, gold: [0, 0], col: ['#ffd040', '#c84a20', '#f0d8b0'], boss: true, name: '太阳祭司',
      fx: (e, time, y) => { const B = e.beam; if (e.pat !== 1 || !B) return; const x0 = e.x, y0 = y - 12, c = Math.cos(B.a), s = Math.sin(B.a);
        if (B.tele > 0) { if (Math.floor(time * 14) % 2) for (let i = 10; i < ROOM_BEAM_RANGE; i += 3) px(x0 + c * i, y0 + s * i, 1, 1, '#ffb040'); return; }
        for (let i = 8; i < ROOM_BEAM_RANGE; i++) { const x = x0 + c * i, yy = y0 + s * i; if (x < 0 || x > RPW || yy < 0 || yy > RPH) break; px(x - s * 1.5, yy + c * 1.5, 1, 1, '#ff8a20'); px(x, yy, 1, 1, '#fff0a0'); px(x + s * 1.5, yy - c * 1.5, 1, 1, '#ff8a20'); } } },
    mirrorKnight: { hp: 560, hw: 5, hh: 4, h: 14, scale: 1.5, spr: () => SPR.mirrorKnight, gold: [0, 0], col: ['#b8c4dc', '#40e0ff', '#ffffff'], boss: true, name: '镜像骑士',
      tele: e => e.pat === 1 && e.state === 1,
      fx: (e, time, y) => { if (!e.immune) return; g.globalAlpha = 0.35 + 0.2 * Math.sin(time * 9); ellipse(e.x, y - 10, 14, 15, '#ffffff'); g.globalAlpha = 1; },
      onBlocked: e => { if (!e.reflect || (e.refT || 0) > G.time) return; e.refT = G.time + 0.25;          // hitting the reflect stance sends a shard back
        const p = G.player; enemyShot(e.x, e.y - 10, Math.atan2(p.y - 6 - (e.y - 10), p.x - e.x), 150, 'mirror'); },
      onDeath: () => { for (const o of G.enemies) if (o.kind === 'mirrorImage') o.hp = 0; } },
    mirrorImage: { hp: 18, hw: 5, hh: 4, h: 14, scale: 1.2, alpha: 0.5, spr: () => SPR.mirrorKnight, gold: [0, 0], col: ['#c8d8ff', '#ffffff'], name: '镜像', glow: [180, 200, 255] },
  },
  ai: {
    canopic: e => { e.kbx = e.kby = 0; return Z0; },
    mirrorImage: (e, dt, ang, d) => { if (e.t <= 0) { e.t = rnd(1.6, 2.4) / fspd(); enemyShot(e.x, e.y - 8, ang, 95, 'mirror'); SFX.magic(); } return V(ang + Math.sin(e.anim) * 1.2, 34 * fspd()); },
    sandworm: updWorm, pharaoh: updPharaoh, sunPriest: updSunPriest, mirrorKnight: updMirrorKnight,
  },
  bossLight: { sandworm: [230, 180, 100], pharaoh: [90, 255, 180], sunPriest: [255, 190, 80], mirrorKnight: [180, 210, 255] },
  regions: ACT4,
});
