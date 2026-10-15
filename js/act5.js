'use strict';
// ============================================================ 第五幕 · 天穹: 4 regions, 3 mobs + 1 elite, 4 bosses, 4 map mechanics
// void pits (fall = damage + back to the door) / marked lightning tiles + conductive floor / time zones + gears / darkness.

// ---------------------------------------------------------------- sprites
SPR.sylph = [['...oo...', '..owwo..', '.owewwo.', 'owwwwwwo', '.owwwwo.', 'o.owwo.o', '..o..o..'], ['...oo...', '..owwo..', '.owewwo.', 'owwwwwwo', '.owwwwo.', '.o.oo.o.', 'o......o']]
  .map(r => makeSprite(r, { o: '#2a4a5a', w: '#d0f8f0', e: '#40a0c0' }));
const CLOCK_TOP = ['...oooo...', '..obbbbo..', '..obeebo..', '..obbbbo..', '...oyyo...', '.oobbbboo.', 'oy.obbo.yo', 'oy.obbo.yo', '...obbo...'];
SPR.clockwork = strideFrames(CLOCK_TOP, 'b')
  .map(r => makeSprite(r, { o: '#1a140a', b: '#a08a50', y: '#ecba40', e: '#40e0ff' }));
SPR.jelly = [['..oooo..', '.owwwwo.', 'owweewwo', 'owwwwwwo', '.oooooo.', '.o.oo.o.', 'o..o..o.'], ['..oooo..', '.owwwwo.', 'owweewwo', 'owwwwwwo', '.oooooo.', 'o.o..o.o', '.o.oo.o.']]
  .map(r => makeSprite(r, { o: '#3a2a6a', w: '#c8b0ff', e: '#ffffff' }));
SPR.cloudGolem = GOLEM_ROWS.map(r => makeSprite(r, { o: '#3a4a6a', g: '#d8e4f4', y: '#ffe060', l: '#a8c8f0' }));
SPR.eagle = [[
  'oo................oo', 'owoo............oowo', '.owwoo...oo...oowwo.', '..owwwoooyyooowwwo..', '...owwwwwyywwwwwo...', '....owwwweewwwwo....',
  '.....owwwwwwwwo.....', '......owwwwwwo......', '.......owwwwo.......', '........oyyo........', '.......oy..yo.......'],
  ['....................', '....................', 'oooo.....oo.....oooo', 'owwwoooooyyooooowwwo', '.owwwwwwwyywwwwwwwo.', '..oowwwwweewwwwwoo..',
  '....owwwwwwwwwwo....', '......owwwwwwo......', '.......owwwwo.......', '........oyyo........', '.......oy..yo.......']]
  .map(r => makeSprite(r, { o: '#1a2030', w: '#e8eef8', y: '#ecba40', e: '#ff4040' }));
SPR.titan = makeSprite([
  '.....oooooooo.....', '....oyyyyyyyyo....', '...oyoooooooyyo...', '...oyoeewweeoyo...', '...oyooowwoooyo...', '....oyyyyyyyyo....', '..oossssssssssoo..',
  '.osssysssssssyssso', 'ossssyysssssyyssso', 'osssssyyyyyyysssso', '.ossssssyysssssso.', '..osssssssssssso..', '..osssso..osssso..', '..ooooo....ooooo..'],
  { o: '#141a2a', y: '#ffe060', e: '#ffffff', w: '#80c0ff', s: '#5a6a90' });
SPR.warden = makeSprite([
  '......oooooo......', '....oobbbbbboo....', '...obbyyyyyybbo...', '..obyyoooooyyybo..', '..obyoweewoyybo...', '..obyoowwooyybo...', '..obyyyoyoyyybo...',
  '...obbyyyyyybbo...', '....oobbbbbboo....', '.....obbbbbbo.....', '....obbbyybbbo....', '...obbbbyybbbbo...', '...obbbbbbbbbbo...', '....oooooooooo....'],
  { o: '#1a140a', b: '#7a6a40', y: '#ecba40', w: '#ffffff', e: '#40e0ff' });
SPR.observer = makeSprite([
  '.......oooo.......', '.....oowwwwoo.....', '....owwwwwwwwo....', '...owwwoooowwwo...', '..owwwoeeeeowwwo..', '..owwoeeEEeeowwo..', '..owwoeeEEeeowwo..',
  '..owwwoeeeeowwwo..', '...owwwoooowwwo...', '....owwwwwwwwo....', '.o...oowwwwoo...o.', '..o....oooo....o..', '...o..o....o..o...', '....oo......oo....'],
  { o: '#0a0820', w: '#4a3a8a', e: '#c8a0ff', E: '#ffffff' });

// ---------------------------------------------------------------- projectiles
SHOT_DRAW.windblade = s => { const a = Math.atan2(s.vy, s.vx); for (let i = -3; i <= 3; i++) { const b = a + Math.PI / 2, k = Math.abs(i) / 3;
  px(s.x + Math.cos(b) * i - Math.cos(a) * k * 2, s.y + Math.sin(b) * i - Math.sin(a) * k * 2, 1, 1, i ? '#d0f8f0' : '#ffffff'); } };
SHOT_DRAW.spark = s => { px(s.x - 1, s.y - 1, 3, 3, '#ffe060'); px(s.x, s.y, 1, 1, '#ffffff'); if (Math.floor(s.rot) % 2) px(s.x + 1, s.y - 2, 1, 1, '#ffffff'); };
SHOT_DRAW.gearshot = s => { const a = s.rot * 0.5; for (let k = 0; k < 6; k++) px(s.x + Math.cos(a + k * 1.05) * 3, s.y + Math.sin(a + k * 1.05) * 3, 1, 1, '#ecba40'); px(s.x - 1, s.y - 1, 3, 3, '#a08a50'); };
SHOT_DRAW.star = s => { px(s.x, s.y - 2, 1, 5, '#ffffff'); px(s.x - 2, s.y, 5, 1, '#ffffff'); px(s.x - 1, s.y - 1, 3, 3, '#c8a0ff'); };
Object.assign(SHOT_SPARK, { windblade: ['#d0f8f0', '#ffffff'], spark: ['#ffe060', '#ffffff'], gearshot: ['#ecba40', '#a08a50'], star: ['#c8a0ff', '#ffffff'] });
Object.assign(SHOT_LIGHT, { windblade: [180, 240, 230], spark: [255, 230, 120], gearshot: [230, 190, 90], star: [200, 160, 255] });
const zap = (t = 0.25) => p => { p.stun = Math.max(p.stun, t); };
// a short lightning bolt drawn from the sky onto (x, y); r = damage radius
function skyBolt(x, y, r, dmg = 1, environment = false) {
  areaHit(x, y, r, dmg, environment); SFX.zap(); shake(3); ring(x, y, r + 3, [255, 240, 140], 0.25);
  G.bolts.push({ x0: x + rnd(-6, 6), y0: -OY, x1: x, y1: y - 2, life: 0.22 });
  burst(x, y - 2, 12, ['#ffe060', '#ffffff'], { sp: 80, life: 0.3, up: true });
}

// ---------------------------------------------------------------- mobs + elite
Object.assign(ENAME, { sylph: '风灵', clockwork: '发条兵', jelly: '星光水母' });
Object.assign(EDEF, {
  sylph: { hp: 7, hw: 4, hh: 3, h: 7, fly: true, spr: e => SPR.sylph[Math.floor(e.anim * 6) % 2], gold: [1, 2], col: ['#d0f8f0', '#40a0c0'], glow: [160, 240, 230] },
  clockwork: { hp: 14, hw: 4, hh: 4, h: 12, spr: anim2(SPR.clockwork, 6), gold: [2, 3], col: ['#a08a50', '#ecba40'], tele: e => e.state === 2 },
  jelly: { hp: 10, hw: 4, hh: 3, h: 7, fly: true, alpha: 0.85, spr: e => SPR.jelly[Math.floor(e.anim * 3) % 2], gold: [1, 2], col: ['#c8b0ff', '#ffffff'], glow: [180, 150, 255] },
  cloudGolem: { hp: 85, hw: 8, hh: 6, h: 13, spr: anim2(SPR.cloudGolem, 3), gold: [9, 12], col: ['#d8e4f4', '#ffe060', '#a8c8f0'], elite: true, heavy: true, scale: 1.4,
    name: '云岩巨像', tele: e => e.state === 1 },
});
Object.assign(AI, {
  // sylph: keeps its distance and throws a wind blade that knocks you back hard
  sylph: (e, dt, ang, d) => { if (e.t <= 0) { e.t = rnd(1.8, 2.6) / fspd(); e.flash = 0.06; SFX.puff();
      enemyShot(e.x, e.y - 7, ang, 110, 'windblade', { onHit: (p, s) => { const k = norm({ x: s.vx, y: s.vy }); p.kbx += k.x * 260; p.kby += k.y * 260; } }); }
    const want = d > 100 ? 1 : d < 70 ? -1 : 0; return { x: Math.cos(ang) * 34 * want + Math.cos(ang + Math.PI / 2) * 26 * Math.sin(e.anim * 1.3), y: Math.sin(ang) * 34 * want }; },
  // clockwork soldier: winds up (ticking), then charges in a straight line until it hits a wall
  clockwork: (e, dt, ang, d) => {
    if (e.state === 0) { if (e.t <= 0 && d < 150) { e.state = 2; e.t = 0.55; e.hx = Math.cos(ang); e.hy = Math.sin(ang); SFX.move(); e.bounced = false;
        warnShape({ shape: 'line', x: e.x, y: e.y - 4, a: ang, len: 150, w: 10 }, .55, () => {}, [255, 210, 110]); } return V(ang, 20 * fspd()); }
    if (e.state === 2) { if (e.t <= 0) { e.state = 1; e.t = 1.2; } return Z0; }
    if (e.state === 3) { if (e.t <= 0) { e.state = 1; e.t = .9; e.bounced = true; } return Z0; }      // bounce wind-up
    if (e.t <= 0 || boxHits(G.room, e.x + e.hx * 4, e.y + e.hy * 4, e.hw, e.hh, 'walk')) {
      const wall = e.t > 0; shake(1);
      // First wall: reflect and show the new lane for 0.4 s. After the rebound: 0.6 s spent, or 1 s dazed on a second wall.
      if (wall && !e.bounced) { const hx = boxHits(G.room, e.x + e.hx * 4, e.y, e.hw, e.hh, 'walk'), hy = boxHits(G.room, e.x, e.y + e.hy * 4, e.hw, e.hh, 'walk');
        if (hx || !hy) e.hx = -e.hx; if (hy) e.hy = -e.hy;
        e.state = 3; e.t = .4; SFX.move(); warnShape({ shape: 'line', x: e.x, y: e.y - 4, a: Math.atan2(e.hy, e.hx), len: 150, w: 10 }, .4, () => {}, [255, 210, 110]); return Z0; }
      const rebound = e.bounced; e.state = 0; e.bounced = false; e.t = rnd(1.2, 1.8) / fspd();
      if (rebound) { enemyPunish(e, wall ? 1 : .6); if (wall) addFloat(e.x, e.y - e.h - 6, '眩晕', '#ffd080'); }
      return Z0; }
    return { x: e.hx * 150, y: e.hy * 150 };
  },
  // star jelly: drifts; every few seconds pulses a small electric ring around itself (stuns briefly)
  jelly: (e, dt, ang) => { jellyArc(e);
    if (e.t <= 0) { e.t = rnd(2.4, 3.2) / fspd(); warn(e.x, e.y, 18, 0.7, w => { const i0 = G.player.inv; areaHit(w.x, w.y, w.r, 1);
      if (G.player.inv > i0) zap(0.3)(G.player); SFX.zap(); ring(w.x, w.y, w.r + 2, [200, 170, 255], 0.25); }, [190, 160, 255]); }
    return V(ang + Math.sin(e.anim * 0.8) * 1.2, 16); },
  cloudGolem: (e, dt, ang, d) => {
    if (e.state === 0) { if (d < 56 && e.t <= 0) { e.state = 1; e.t = 0.8; } return V(ang, 24 * fspd()); }
    e.flash = Math.floor(e.t * 16) % 2 ? 0.05 : 0;
    if (e.t <= 0) { e.state = 0; e.t = rnd(1.6, 2.2) / fspd(); SFX.slam(); shake(6); ring(e.x, e.y - 3, 36, [220, 235, 255], 0.3); areaHit(e.x, e.y - 3, 34);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + rnd(-0.3, 0.3);
        warn(clamp(e.x + Math.cos(a) * 44, 24, RPW - 24), clamp(e.y + Math.sin(a) * 30, 28, RPH - 18), 10, 0.5 + i * 0.12, w => skyBolt(w.x, w.y, w.r), [255, 240, 140]); }
      burst(e.x, e.y, 22, ['#d8e4f4', '#ffe060', '#ffffff'], { sp: 90, life: 0.4 }); }
    return Z0;
  },
});

// ---------------------------------------------------------------- map mechanics
const T_VOID = 11, T_COND = 12;
// void pits: walls for walking enemies and pickups, open air for fliers / shots; you can walk in and fall:
// 1 damage and you reappear at the door you came in through. Rolling across a 1-tile gap is safe (no fall mid-roll).
const MECH_VOID = {
  tile: { [T_VOID]: { solid: who => who === 'walk' } },
  build(r) { if (calmRoom(r)) return; paintBlobs(r, T_VOID, r.type === 'boss' ? 2 : 3, 1.6, 2.8, 1, 1.8);
    for (let i = 0; i < r.tiles.length; i++) { const x = i % RW, y = Math.floor(i / RW);              // keep a ring around the room centre walkable
      if (r.tiles[i] === T_VOID && roomSafeLane(x, y)) r.tiles[i] = 0; } },
  art(r, g) { const t = r.tiles, P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { if (t[ty * RW + tx] !== T_VOID) continue;
      const x = tx * TS, y = ty * TS, E = edgeOf(t, tx, ty, T_VOID);
      P(x, y, TS, TS, '#0e1630'); for (let k = 0; k < 3; k++) P(x + hash2(tx, ty + k) * 14, y + hash2(ty, tx + k) * 14, 1, 1, '#c8d8ff');
      if (E(0, -1)) { P(x, y, TS, 3, '#8a7a5a'); P(x, y + 3, TS, 2, '#4a3a2a'); }                  // cliff lip
      if (E(-1, 0)) P(x, y, 1, TS, '#3a3a5a'); if (E(1, 0)) P(x + TS - 1, y, 1, TS, '#3a3a5a'); if (E(0, 1)) P(x, y + TS - 1, TS, 1, '#6a7a9a'); } },
  update(r, dt) {
    const p = G.player;
    if (p.rolling > 0 || p.stun > 0 || tileAt(r, p.x, p.y - 1) !== T_VOID) return;
    // fell: always costs a hit (shield / block can still save you), then you are back at the door you came in through
    SFX.die(); burst(p.x, p.y - 4, 16, ['#c8d8ff', '#ffffff'], { sp: 60, life: 0.4 });
    p.inv = 0; hurtPlayer(1, p.x, p.y - 20, false, true); p.inv = Math.max(p.inv, 1.0);
    p.x = p.entryX || RPW / 2; p.y = p.entryY || RPH / 2 + 30; p.kbx = p.kby = 0; p.ivx = p.ivy = 0;
    if (tileAt(r, p.x, p.y - 1) === T_VOID) { const s = freeSpot(r, 0, 0, 0); p.x = s.x; p.y = s.y; }   // never respawn over the void
    addFloat(p.x, p.y - 22, '坠落!', '#c8d8ff', true);
  },
};
// thunder spire: tiles get marked (yellow flicker) and are struck 0.9 s later; conductive plates (T_COND) carry every
// strike that lands on one of them to all other plates, so standing on metal during a storm is a bad idea
const MECH_STORM = {
  build(r) { r.cond = []; if (calmRoom(r)) return;
    for (let k = 0, n = rint(5, 9); k < n; k++) { const x = rint(2, RW - 3), y = rint(2, RH - 3); if (r.tiles[y * RW + x] === 0 && !doorLane(x, y)) { r.tiles[y * RW + x] = T_COND; r.cond.push(y * RW + x); } } },
  art(r, g) { const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    for (const i of r.cond) { const x = (i % RW) * TS, y = Math.floor(i / RW) * TS; P(x + 1, y + 1, 14, 14, '#4a5068'); P(x + 2, y + 2, 12, 12, '#7a86a8');
      for (let k = 0; k < 3; k++) P(x + 3, y + 4 + k * 4, 10, 1, '#a8b4d0'); } },
  update(r, dt) {
    if (!r.locked) return;
    const p = G.player;
    if ((r.boltT = (r.boltT || 1.2) - dt) <= 0) { r.boltT = rnd(0.8, 1.3) / curDiff().speed;
      const near = rand() < 0.6, x = near ? clamp(p.x + rnd(-24, 24), 24, RPW - 24) : rnd(24, RPW - 24), y = near ? clamp(p.y + rnd(-16, 16), 28, RPH - 18) : rnd(28, RPH - 18);
      warn(x, y, 9, 0.9, w => { skyBolt(w.x, w.y, w.r, 1, true);
        const i = Math.floor(w.y / TS) * RW + Math.floor(w.x / TS);
        if (r.cond.includes(i)) for (const j of r.cond) if (j !== i) { const cx = (j % RW) * TS + 8, cy = Math.floor(j / RW) * TS + 10;
          G.bolts.push({ x0: w.x, y0: w.y, x1: cx, y1: cy, life: 0.25 }); areaHit(cx, cy, 9, 1, true); } }, [255, 240, 140]); }
  },
  draw(r, time) { for (const i of r.cond) if (r.locked && Math.floor(time * 3 + i) % 4 === 0) { px((i % RW) * TS + 4 + hash2(i, time | 0) * 8, Math.floor(i / RW) * TS + 6, 1, 1, '#ffe060'); } },
  amb: () => 'rgb(110,118,140)',                               // stormy: darker than the region default
};
// clock tower: two time fields per fight room, a slow one (blue, x0.5) and a fast one (gold, x1.6). They act on enemies,
// enemy shots and you. Gears turn on the floor and push whatever touches them along their rim.
const MECH_CLOCK = {
  build(r) { r.zones = []; r.gears = []; if (calmRoom(r)) return;
    const a = { x: rnd(60, RPW / 2 - 30), y: rnd(44, RPH - 44), r: 34, k: 0.5 }, b = { x: rnd(RPW / 2 + 30, RPW - 60), y: rnd(44, RPH - 44), r: 30, k: 1.6 };
    r.zones = rand() < 0.5 ? [a, b] : [{ ...a, k: 1.6, r: 30 }, { ...b, k: 0.5, r: 34 }];
    if (isFight(r) || r.type === 'boss') for (let k = 0; k < 2; k++) r.gears.push({ x: rnd(50, RPW - 50), y: rnd(40, RPH - 30), r: 14, a: 0, w: (k ? -1 : 1) * 1.6 }); },
  update(r, dt) {
    const p = G.player, zk = (x, y) => { for (const Z of r.zones) if (((x - Z.x) / Z.r) ** 2 + ((y - Z.y) / (Z.r * 0.62)) ** 2 < 1) return Z.k; return 1; };
    for (const e of G.enemies) e.tmul = zk(e.x, e.y);
    for (const s of G.shots) if (!s.friendly) s.tmul = zk(s.x, s.y);
    p.tmul = zk(p.x, p.y);
    for (const G0 of r.gears) { G0.a += G0.w * dt;
      for (const u of [p, ...G.enemies]) { if (!u || u.fly || u.link) continue; const d = dist(u.x, u.y, G0.x, G0.y);
        if (d < G0.r + u.hw && d > 2) { const t = norm({ x: -(u.y - G0.y), y: u.x - G0.x }); moveBox(u, t.x * G0.w * 22 * dt, t.y * G0.w * 22 * dt, u === p ? 'player' : 'walk'); } } }
  },
  move(r, p, dt, vx, vy) { const k = p.tmul || 1; return k !== 1 ? { x: vx * (k < 1 ? 0.65 : 1.25), y: vy * (k < 1 ? 0.65 : 1.25) } : null; },
  draw(r, time) {
    for (const Z of r.zones) { const col = Z.k < 1 ? '#6a9aff' : '#ffc840'; g.globalAlpha = 0.14; ellipse(Z.x, Z.y, Z.r, Z.r * 0.62, col);
      g.globalAlpha = 0.5; ellipse(Z.x, Z.y, Z.r, Z.r * 0.62, col, time * (Z.k < 1 ? 0.6 : 3)); g.globalAlpha = 1; }
    for (const G0 of r.gears) { shadow(G0.x, G0.y + 2, G0.r - 2);
      for (let k = 0; k < 10; k++) { const a = G0.a + k * Math.PI / 5; px(G0.x + Math.cos(a) * G0.r - 1, G0.y + Math.sin(a) * G0.r * 0.6 - 1, 3, 2, '#a08a50'); }
      ellipse(G0.x, G0.y, G0.r - 3, (G0.r - 3) * 0.6, '#7a6a40'); px(G0.x - 2, G0.y - 1, 4, 2, '#ecba40'); }
  },
};
// observatory: the room is pitch dark; only you, your shots, braziers of starlight and glowing things are lit.
// Enemies outside the light are drawn as two glowing eyes. Star lamps (stand next to one) light a wide area.
const MECH_DARK = {
  build(r) { r.lamps = []; if (calmRoom(r)) return; for (const [x, y] of [[4, 2], [15, 7], [15, 2], [4, 7]].map(([x, y]) => roomLayoutTile(x, y)).slice(0, r.type === 'boss' ? 4 : 2)) r.lamps.push({ x: x * TS + 8, y: y * TS + 10 }); },
  amb: () => 'rgb(22,20,40)',
  light(r, ox, oy, time) { const p = G.player; light(p.x + ox, p.y - 6 + oy, 70, [190, 180, 230], 0.9);
    for (const L of r.lamps) light(L.x + ox, L.y - 8 + oy, 70 + Math.sin(time * 2 + L.x) * 4, [190, 170, 255], 0.85); },
  draw(r, time) { for (const L of r.lamps) { px(L.x - 2, L.y - 3, 4, 4, '#3a3050'); const k = Math.floor(time * 4 + L.x) % 2; px(L.x - 1, L.y - 9 - k, 2, 5, '#c8a0ff'); px(L.x, L.y - 10 - k, 1, 1, '#ffffff'); } },
  emissive(r, time) { for (const e of G.enemies) if (!e.hidden && e.spawn <= 0 && Math.floor(time * 2 + e.anim) % 9 !== 0) {   // eyes in the dark (blink now and then)
    const y = e.y - e.z - (e.fly ? 7 : 0) - e.h * 0.75; px(e.x - 2, y, 1, 1, '#ff6070'); px(e.x + 1, y, 1, 1, '#ff6070'); } },
};
Object.assign(MECH, { void: MECH_VOID, storm: MECH_STORM, clock: MECH_CLOCK, dark: MECH_DARK });

// ---------------------------------------------------------------- bosses
// 风暴巨鹰: circles high (fast, untouchable) / marks you and dive-bombs / wing gust that shoves you toward the void / feather fans
function updEagle(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0.2; e.k = 0; e.state = 0; e.t = [2.0, 2.4, 1.6, 1.8][e.pat] / sp; e.air = e.pat === 0;
    if (e.pat === 2) { e.gust = { a: ang, t: 1.0 }; SFX.puff(); noise(1, { vol: 0.15, freq: 500, type: 'lowpass' }); }
  }
  e.sub -= dt;
  if (e.pat === 0) { e.z = lerp(e.z, 18, clamp(dt * 4)); e.ca = (e.ca || 0) + dt * 2.2 * sp;      // high circle
    const cx = RPW / 2 + Math.cos(e.ca) * (RPW / 2 - 50), cy = RPH / 2 + Math.sin(e.ca) * (RPH / 2 - 34); return { x: (cx - e.x) * 3, y: (cy - e.y) * 3 }; }
  e.z = lerp(e.z, 0, clamp(dt * 6));
  if (e.pat === 1) {                                         // dive bombs: mark -> streak -> impact
    if (e.state === 0 && e.sub <= 0 && e.k < (enr ? 4 : 3)) { e.state = 1; e.tx = clamp(p.x, 24, RPW - 24); e.ty = clamp(p.y, 28, RPH - 18); e.sub = 0.55 / sp;
      warn(e.tx, e.ty, 14, e.sub + 0.05, w => { areaHit(w.x, w.y, w.r, 1); SFX.slam(); shake(4); ring(w.x, w.y, w.r + 3, [220, 230, 255], 0.3);
        const o = rnd(0, 1); for (let i = 0; i < 6; i++) enemyShot(w.x, w.y - 4, o + i * Math.PI / 3, 80, 'windblade'); }, [200, 220, 255]); }
    if (e.state === 1) { const k = clamp(dt * 7); e.x = lerp(e.x, e.tx, k); e.y = lerp(e.y, e.ty, k); if (e.sub <= 0) { e.state = 0; e.k++; e.sub = 0.25; } }
    return Z0; }
  if (e.pat === 2 && e.gust) { e.gust.t -= dt; if (e.gust.t > 0) { const k = norm({ x: Math.cos(e.gust.a), y: Math.sin(e.gust.a) }); p.kbx += k.x * 340 * dt * 6; p.kby += k.y * 340 * dt * 6;
      if (spawnP(0.8)) G.parts.push({ x: e.x + rnd(-10, 10), y: e.y - rnd(0, 14), vx: k.x * 160, vy: k.y * 160, life: 0.5, max: 0.5, col: '#e8f4ff', size: 1, grav: 0, add: false }); } return Z0; }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.5 / sp; SFX.swing();
    for (let i = -3; i <= 3; i++) enemyShot(e.x, e.y - 8, ang + i * 0.16, 104, 'windblade'); }
  return Z0;
}
// 雷霆泰坦: chain lightning that hops between conductive plates and you / stomps that charge every plate / overload: the whole room is struck in waves
function updTitan(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player, R = G.room;
  if (e.t <= 0) { if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0.2; e.k = 0; e.t = [1.6, 1.8, 1.6, 3.0][e.pat] / sp; }
  e.sub -= dt;
  if (e.pat === 0) return V(ang, 26 * sp);
  if (e.pat === 1 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.7 / sp;                 // telegraphed chain: titan -> near you -> next
    const pts = [[e.x, e.y - 14], [clamp(p.x + rnd(-10, 10), 20, RPW - 20), clamp(p.y + rnd(-6, 6), 24, RPH - 16)], [rnd(30, RPW - 30), rnd(30, RPH - 22)]];
    for (let i = 1; i < pts.length; i++) warn(pts[i][0], pts[i][1], 10, 0.55 + i * 0.15, w => { G.bolts.push({ x0: pts[i - 1][0], y0: pts[i - 1][1], x1: w.x, y1: w.y, life: 0.25 }); SFX.zap();
      const i0 = p.inv; areaHit(w.x, w.y, w.r, 1); if (p.inv > i0) zap(0.25)(p); }, [255, 240, 140]); }       // a landed strike also stuns briefly
  if (e.pat === 2 && e.sub <= 0 && e.k === 0) { e.k = 1; SFX.slam(); shake(6); ring(e.x, e.y - 3, 34, [255, 240, 150], 0.3); areaHit(e.x, e.y - 3, 30, 1);
    for (const i of R.cond || []) warn((i % RW) * TS + 8, Math.floor(i / RW) * TS + 10, 10, 0.6, w => skyBolt(w.x, w.y, w.r), [255, 240, 140]); }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 4 : 3)) { e.k++; e.sub = 0.75 / sp;                 // overload: checkerboard waves, alternate halves
    if (e.k === 1) addFloat(e.x, e.y - 30, '过载!', '#ffe060', true);
    for (let ty = 2; ty < RH - 1; ty += 2) for (let tx = 2 + ((ty / 2 + e.k) % 2) * 2; tx < RW - 2; tx += 4)
      warn(tx * TS + 8, ty * TS + 6, 9, 0.8, w => { areaHit(w.x, w.y, w.r, 1); if (rand() < 0.3) { SFX.zap(); G.bolts.push({ x0: w.x, y0: -OY, x1: w.x, y1: w.y, life: 0.18 }); } }, [255, 240, 140]); }
  return Z0;
}
// 时之守望者: rewind (jumps back to where it was 3 s ago and regains the hp lost since, max 8% per rewind) / frozen volley
// (bullets hang in the air, then all launch at you at once) / gear throw / clock-hand sweep
function updWarden(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  (e.hist = e.hist || []).push({ x: e.x, y: e.y, hp: e.hp, t: G.time }); while (e.hist.length && G.time - e.hist[0].t > 3.2) e.hist.shift();
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 5); e.sub = 0.2; e.k = 0; e.t = [1.4, 2.2, 1.6, 0.6, 2.4][e.pat] / sp; e.hand = null;
    if (e.pat === 3) { const H = e.hist[0]; if (H) { burst(e.x, e.y - 8, 20, ['#ecba40', '#40e0ff'], { sp: 70, life: 0.4 });
      e.x = H.x; e.y = H.y; const back = Math.min(Math.max(0, H.hp - e.hp), Math.round(e.max * 0.08)); e.hp += back; e.hist = [];
      SFX.magic(); addFloat(e.x, e.y - 28, back ? `回溯 +${back}` : '回溯', '#40e0ff', true); burst(e.x, e.y - 8, 20, ['#ecba40', '#40e0ff'], { sp: 70, life: 0.4 }); } }
    if (e.pat === 4) e.hand = { a: ang - Math.PI / 2, tele: 0.7 };
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.PI / 2 * Math.sin(e.anim * 0.6), 30 * sp);
  if (e.pat === 1 && e.sub <= 0 && e.k < (enr ? 16 : 12)) { e.k++; e.sub = 0.07;                 // frozen volley: place a ring, then launch together
    const a = e.k * Math.PI * 2 / (enr ? 16 : 12), x = e.x + Math.cos(a) * 30, y = e.y - 8 + Math.sin(a) * 20;
    // the ring finishes building at about the same moment for every bullet, then each one aims at you as it launches
    const s = enemyShot(x, y, 0, 0, 'gearshot', { life: 3.2 }); s.hold = 0.9 - e.k * 0.03; s.launch = { aim: true, sp: 120 }; }
  if (e.pat === 2 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.5; SFX.heavy();
    const s = enemyShot(e.x, e.y - 8, Math.atan2(p.y - e.y, p.x - e.x), 170, 'gearshot', { r: 5, life: 2.2 }); s.home = e; s.out = 0.6; }
  if (e.pat === 4 && e.hand) { const H = e.hand;                                                   // clock hand: a long sweeping arm
    if (H.tele > 0) { H.tele -= dt; return Z0; } H.a += 1.6 * sp * dt; if (beamHits(e.x, e.y - 8, H.a, 110, 5)) hurtPlayer(1, e.x, e.y); return Z0; }
  return Z0;
}
// 星界观测者 (act boss): falling stars (marked) / black hole that pulls you in and swallows shots / constellation lines that
// connect star points and burn along them / phase two: the room goes dark around it
function updObserver(e, dt, ang) {
  enrage(e);
  if (e.encounter?.type === 'observer') return Z0;
  if (e.t <= 0) { startObserverCombo(e); return Z0; }
  return V(ang + Math.sin(e.anim), 22);
}

// ---------------------------------------------------------------- regions
const ACT5 = [
  { name: '浮空群岛', pal: { wall: [120, 140, 170], floor: [150, 168, 140], mortar: [60, 72, 90], deco: [230, 240, 255] }, amb: 'rgb(176,188,210)',
    pool: [['sylph', 1.2, 3, 1], ['clockwork', 1.5, 1, 1], ['bat', 1, 2, 1], ['jelly', 1.3, 1, 2]], elite: 'cloudGolem', boss: 'eagle', bossSub: '天空之主',
    hazard: 0, mech: 'void', mechName: '虚空坑（会坠落）', mechTip: '掉进虚空会受伤并回到入口，敌人的击退要小心' },
  { name: '雷霆尖塔', pal: { wall: [70, 78, 104], floor: [92, 98, 120], mortar: [30, 34, 50], deco: [255, 230, 120] }, amb: 'rgb(130,136,160)',
    pool: [['jelly', 1.3, 3, 1], ['sylph', 1.2, 2, 1], ['clockwork', 1.5, 1, 2]], elite: 'cloudGolem', boss: 'titan', bossSub: '风暴之心',
    hazard: 0, mech: 'storm', mechName: '落雷与导电地砖', mechTip: '闪烁的地方会落雷；落在金属板上的雷会传到所有金属板' },
  { name: '时钟塔', pal: { wall: [110, 92, 64], floor: [124, 110, 88], mortar: [50, 40, 26], deco: [236, 186, 64] }, amb: 'rgb(150,140,124)',
    pool: [['clockwork', 1.5, 3, 1], ['sylph', 1.2, 1, 1], ['jelly', 1.3, 1, 1], ['skel', 1.6, 1, 2]], elite: 'cloudGolem', boss: 'warden', bossSub: '光阴之匙',
    hazard: 0, mech: 'clock', mechName: '时间领域与齿轮', mechTip: '蓝色区域让一切变慢，金色区域让一切变快；齿轮会推着你转' },
  { name: '星辰观测台', pal: { wall: [44, 40, 80], floor: [58, 52, 94], mortar: [20, 18, 40], deco: [200, 170, 255] }, amb: 'rgb(110,100,150)',
    pool: [['jelly', 1.3, 2, 1], ['sylph', 1.2, 2, 1], ['clockwork', 1.5, 1, 1], ['imp', 1.6, 1, 2]], elite: 'cloudGolem', boss: 'observer', bossSub: '群星之眼',
    hazard: 0, mech: 'dark', mechName: '黑暗（只看得见光源附近）', mechTip: '房间一片漆黑，光源外的敌人只能看见眼睛' },
];
// ---------------------------------------------------------------- bosses + regions (one table per act; see js/act-kit.js)
registerActContent(5, {
  enemies: {
    eagle: { hp: 380, hw: 9, hh: 5, h: 11, fly: true, spr: e => SPR.eagle[Math.floor(e.anim * (e.pat === 0 ? 8 : 5)) % 2], gold: [0, 0], col: ['#e8eef8', '#ecba40', '#ff4040'], boss: true, name: '风暴巨鹰' },
    titan: { hp: 440, hw: 9, hh: 6, h: 14, spr: () => SPR.titan, gold: [0, 0], col: ['#5a6a90', '#ffe060', '#80c0ff'], boss: true, name: '雷霆泰坦', heavy: true },
    warden: { hp: 420, hw: 8, hh: 6, h: 14, spr: () => SPR.warden, gold: [0, 0], col: ['#7a6a40', '#ecba40', '#40e0ff'], boss: true, name: '时之守望者',
      fx: (e, time, y) => { const H = e.hand; if (e.pat !== 4 || !H) return; const c = Math.cos(H.a), s = Math.sin(H.a);
        if (H.tele > 0) { if (Math.floor(time * 14) % 2) for (let i = 10; i < 110; i += 3) px(e.x + c * i, y - 8 + s * i, 1, 1, '#ecba40'); return; }
        for (let i = 8; i < 110; i++) { px(e.x + c * i, y - 8 + s * i, 2, 2, '#ecba40'); } px(e.x + c * 110 - 2, y - 8 + s * 110 - 2, 4, 4, '#ffffff'); } },
    observer: { hp: 560, hw: 9, hh: 6, h: 14, fly: true, spr: () => SPR.observer, gold: [0, 0], col: ['#4a3a8a', '#c8a0ff', '#ffffff'], boss: true, name: '星界观测者',
      fx: (e, time, y) => {
        const B = e.hole; if (e.pat === 2 && B && B.t > 0) { for (let k = 0; k < 3; k++) { const r = 4 + ((time * 14 + k * 6) % 18); g.globalAlpha = 1 - r / 22; ellipse(B.x, B.y, r, r * 0.6, '#8a5aff', time * 3); }
          g.globalAlpha = 1; px(B.x - 3, B.y - 2, 6, 4, '#000000'); ellipse(B.x, B.y, 4, 3, '#c8a0ff'); }
        if (e.pat === 3 && e.stars) { const tele = e.lineT > 0;
          for (const S of e.stars) { px(S.x, S.y - 2, 1, 5, '#ffffff'); px(S.x - 2, S.y, 5, 1, '#ffffff'); }
          for (let i = 0; i < e.stars.length - 1; i++) { const A = e.stars[i], B2 = e.stars[i + 1], L = dist(A.x, A.y, B2.x, B2.y);
            if (tele && Math.floor(time * 14) % 2) continue;
            for (let t = 0; t < L; t += tele ? 4 : 1) px(lerp(A.x, B2.x, t / L), lerp(A.y, B2.y, t / L) - 6, tele ? 1 : 2, tele ? 1 : 2, tele ? '#c8a0ff' : '#ffffff'); } } } },
  },
  ai: {
    eagle: updEagle, titan: updTitan, warden: updWarden, observer: updObserver,
  },
  bossLight: { eagle: [230, 240, 255], titan: [255, 240, 140], warden: [230, 200, 110], observer: [190, 150, 255] },
  regions: ACT5,
});
