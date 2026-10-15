'use strict';
// ============================================================ 第二幕 · 霜原: 4 regions, 3 mobs + 1 elite, 4 bosses, 4 map mechanics
// Everything for the act lives here; it registers itself into ACTS[1] / EDEF / AI / MECH / SPR at load time.

// ---------------------------------------------------------------- sprites
const WOLF_ROWS = [
  ['............', '.o.o........', 'owowo.......', 'owwwwooooo..', 'oewwwwwwwwo.', '.owwwwwwwwwo', '..owwwwwwwo.', '..owo.owo...', '..oo..oo....'],
  ['............', '.o.o........', 'owowo.......', 'owwwwooooo..', 'oewwwwwwwwo.', '.owwwwwwwwwo', '..owwwwwwwo.', '.owo...owo..', '.oo.....oo..']];
SPR.wolf = WOLF_ROWS.map(r => makeSprite(r, { o: '#1a2030', w: '#b8c4d8', e: '#60d8ff' }));
SPR.wolfKing = WOLF_ROWS.map(r => makeSprite(r, { o: '#10141e', w: '#6a7a98', e: '#ffe060' }));
SPR.wisp = [
  ['...oo...', '..owwo..', '.owccwo.', 'owceecwo', 'owccccwo', '.owccwo.', '..o..o..', '.o....o.'],
  ['...oo...', '..owwo..', '.owccwo.', 'owceecwo', 'owccccwo', '.owccwo.', '.o.oo.o.', '..o..o..']]
  .map(r => makeSprite(r, { o: '#2a4a7a', w: '#e0f4ff', c: '#8ad0ff', e: '#1a2a5a' }));
const YETI_TOP = ['...oooooo...', '..owwwwwwo..', '.owweewweo..', '.owwwwwwwwo.', 'owwwmmmmwwwo', 'owwwwwwwwwwo',
  'owowwwwwwowo', 'owowwwwwwowo', '.o.owwwwo.o.'];
SPR.yeti = [[...YETI_TOP, '...ow..wo...', '..oww..wwo..', '..ooo..ooo..'], [...YETI_TOP, '..ow....wo..', '.oww....wwo.', '.ooo....ooo.']]
  .map(r => makeSprite(r, { o: '#2a3448', w: '#e8eef8', e: '#3a6aa0', m: '#8a98b0' }));
SPR.frostGolem = GOLEM_ROWS.map(r => makeSprite(r, { o: '#14203a', g: '#6a8ab8', y: '#e0f8ff', l: '#a8e0ff' }));
SPR.troll = makeSprite([
  '.....oooooo.......', '....owwwwwwo......', '...owweewweewo....', '...owwwwwwwwwo....', '..oowwwmmmmwwoo...',
  '.owwwwwwwwwwwwwo..', 'owwbwwwwwwwwwbwwo.', 'owwbbwwwwwwwbbwwo.', 'owwbbwwwwwwwbbwwo.', '.owwbwwwwwwwbwwo..',
  '..oowwwwwwwwwoo...', '...owwwwwwwwwo....', '...owwwo.owwwo....', '..owwwwo.owwwwo...', '..ooooo...ooooo...'],
  { o: '#1a2438', w: '#7a9ac0', e: '#ffe060', m: '#e8f4ff', b: '#a8d0f0' });
SPR.crystalHeart = makeSprite([
  '.......oo.......', '......occo......', '.....occwco.....', '....occwwcco....', '...occcwwccco...', '..occcceecccco..',
  '.occcceeeeccco..', 'occcceeEEeecccco', 'occcceeEEeecccco', '.occcceeeeccco..', '..occcceecccco..', '...occccccccoo..',
  '....occccccco...', '.....occccco....', '......ooooo.....'],
  { o: '#1a2a5a', c: '#7ab8f0', w: '#e8f8ff', e: '#4a6ad0', E: '#ffffff' });
SPR.frostQueen = makeSprite([
  '...c..c..c..c...', '...cc.cccc.cc...', '....cccccccc....', '....owwwwwwo....', '...owweewweewo..', '...owwwwwwwwo...',
  '....owwmmwwo....', '...oobbbbbboo...', '..obbbbwwbbbbo..', '.obbbbwwwwbbbbo.', 'obbbbbwwwwbbbbbo', 'obbbbbbwwbbbbbbo',
  '.obbbbbbbbbbbbo.', '..obbbbbbbbbbo..', '...obbbbbbbbo...', '...oooooooooo...'],
  { o: '#141c38', w: '#f0f4ff', e: '#3a6aff', m: '#c8d8f0', b: '#5a7ad8', c: '#c8f0ff' });

// ---------------------------------------------------------------- projectiles: ice shard (chills on hit), snowball (heavy, short)
const chill = (t = 1.6) => p => { p.slow = Math.max(p.slow, t); };
SHOT_DRAW.ice = s => { const a = Math.atan2(s.vy, s.vx), c = Math.cos(a), d = Math.sin(a);
  for (let i = -3; i <= 2; i++) px(s.x + c * i, s.y + d * i, 1, 1, i > 0 ? '#ffffff' : i < -1 ? '#4a8ac8' : '#a8e0ff'); };
SHOT_DRAW.snow = s => { px(s.x - 2, s.y - 2, 5, 5, '#c8d8ec'); px(s.x - 1, s.y - 2, 3, 1, '#ffffff'); px(s.x - 2, s.y - 1, 1, 3, '#ffffff'); };
Object.assign(SHOT_SPARK, { ice: ['#c8f0ff', '#ffffff'], snow: ['#ffffff', '#c8d8ec'] });
Object.assign(SHOT_LIGHT, { ice: [150, 210, 255], snow: [200, 220, 240] });
const iceShot = (x, y, a, sp, o = {}) => enemyShot(x, y, a, sp, 'ice', { onHit: chill(o.chill || 1.4), ...o });

// ---------------------------------------------------------------- mobs + elite
Object.assign(ENAME, { wolf: '雪狼', wisp: '冰精', yeti: '雪人' });
Object.assign(EDEF, {
  wolf: { hp: 9, hw: 5, hh: 3, h: 9, spr: e => SPR.wolf[e.moving ? Math.floor(e.anim * (e.state === 1 ? 14 : 8)) % 2 : 0], gold: [1, 2], col: ['#b8c4d8', '#60d8ff'] },
  wisp: { hp: 6, hw: 4, hh: 3, h: 8, fly: true, spr: e => SPR.wisp[Math.floor(e.anim * 5) % 2], gold: [1, 2], col: ['#8ad0ff', '#e0f4ff'], glow: [140, 200, 255] },
  yeti: { hp: 26, hw: 6, hh: 5, h: 12, spr: anim2(SPR.yeti, 3), gold: [3, 5], col: ['#e8eef8', '#8a98b0'], heavy: true },
  frostGolem: { hp: 70, hw: 8, hh: 6, h: 13, spr: anim2(SPR.frostGolem, 3), gold: [9, 12], col: ['#6a8ab8', '#e0f8ff', '#a8e0ff'], elite: true, heavy: true, scale: 1.4,
    name: '冰霜魔像', tele: e => e.state === 1 },
});
Object.assign(AI, {
  // wolf: weaves in, crouches, then a fast pounce
  wolf: (e, dt, ang, d) => {
    const hw = G.time < (G.howlT || 0) ? 1.45 : 1;          // the wolf king's howl whips the pack into a frenzy
    // A pack of three or more hunts together: the lead comes straight, the others swing wide to each side and
    // show their pounce lane (a short line) a little longer, so a backward roll escapes the pincer.
    let pack = 0, lead = null, slot = 0;
    for (const o of G.enemies) if (o.kind === 'wolf' && o.hp > 0) { if (!lead) lead = o; if (o === e) slot = pack; pack++; }
    const flank = pack >= 3;
    if (e.state === 0) { if (e.t <= 0 && d < 90) { e.state = 2; e.t = flank ? ENEMY_ATTACK.minionTell : MELEE_COMBAT.windup; e.hx = Math.cos(ang); e.hy = Math.sin(ang); e.flash = 0.05;
        if (flank) warnShape({ shape: 'line', x: e.x, y: e.y - 2, a: ang, len: 58, w: 10 }, e.t, () => {}, [190, 225, 255]); }
      const side = flank && lead !== e && d > 40 ? (slot % 2 ? 1 : -1) * .9 : 0;
      return V(ang + side + Math.sin(e.anim * 2.4) * (side ? .35 : .9), 44 * fspd() * hw); }
    if (e.state === 2) { if (e.t <= 0) { e.state = 1; e.t = 0.32; } return Z0; }
    if (e.t <= 0) { e.state = 0; e.t = rnd(0.9, 1.6) / fspd() / hw; }
    return { x: e.hx * 170 * hw, y: e.hy * 170 * hw };
  },
  // ice wisp: hovers at range, fires a 3-shard fan that chills
  wisp: (e, dt, ang, d) => {
    if (e.t <= 0) { e.t = rnd(2, 2.8) / fspd(); e.flash = 0.08; SFX.magic(); for (const k of [-0.22, 0, 0.22]) iceShot(e.x, e.y - 7, ang + k, 78); }
    const want = d > 95 ? 1 : d < 65 ? -1 : 0;
    return { x: Math.cos(ang) * 26 * want + Math.cos(ang + Math.PI / 2) * 20 * Math.sin(e.anim * 1.4), y: Math.sin(ang) * 26 * want + Math.sin(e.anim * 3) * 6 };
  },
  // yeti: lumbers toward you, lobs a heavy snowball that leaves a frost patch
  yeti: (e, dt, ang, d) => {
    if (e.t <= 0 && d < 160 && rand() < .4) { e.t = rnd(2.6, 3.4) / fspd(); e.flash = .1; SFX.heavy(); yetiSnowball(e, ang); return Z0; }
    if (e.t <= 0 && d < 140) { e.t = rnd(2.4, 3.2) / fspd(); e.flash = 0.1; SFX.heavy();
      const tx = G.player.x, ty = G.player.y;
      warn(tx, ty, 12, 0.75, w => { areaHit(w.x, w.y, w.r, 1); SFX.slam(); shake(3); ring(w.x, w.y, w.r + 3, [200, 230, 255], 0.3);
        G.flames.push({ x: w.x, y: w.y, r: 12, life: 3, ice: true }); burst(w.x, w.y, 16, ['#ffffff', '#c8d8ec'], { sp: 80, life: 0.4, up: true }); }, [140, 200, 255]); }
    return V(ang, 20 * fspd());
  },
  // frost golem (elite): slam -> ring of ice shards + frost patch
  frostGolem: (e, dt, ang, d) => {
    if (e.state === 0) { if (d < 54 && e.t <= 0) { e.state = 1; e.t = 0.8; } return V(ang, 24 * fspd()); }
    e.flash = Math.floor(e.t * 16) % 2 ? 0.05 : 0;
    if (e.t <= 0) { e.state = 0; e.t = rnd(1.5, 2.1) / fspd(); SFX.slam(); shake(6);
      ring(e.x, e.y - 3, 36, [160, 220, 255], 0.3); areaHit(e.x, e.y - 3, 34); G.flames.push({ x: e.x, y: e.y, r: 22, life: 3.5, ice: true });
      const o = rnd(0, 1); for (let i = 0; i < 12; i++) iceShot(e.x, e.y - 5, o + i * Math.PI / 6, 70);
      burst(e.x, e.y, 22, ['#a8e0ff', '#ffffff', '#6a8ab8'], { sp: 90, life: 0.4 }); }
    return Z0;
  },
});

// ---------------------------------------------------------------- map mechanics
const T_ICE = 5;
const tileAt = (r, x, y) => { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx < 0 || ty < 0 || tx >= RW || ty >= RH ? 1 : r.tiles[ty * RW + tx]; };
const onIce = (r, x, y) => tileAt(r, x, y) === T_ICE;
// paint ice sheets: a few blobby patches on fight rooms, kept off the door lanes' first tile
function paintIce(r, n) {
  const t = r.tiles;
  for (let k = 0; k < Math.ceil(n * 1.25); k++) { const cx = rint(4, RW - 5), cy = rint(2, RH - 3), rx = rnd(2.5, 4.5) * 1.1, ry = rnd(1.6, 2.6) * 1.1;
    for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
      if (t[y * RW + x] !== 0 || roomSafeLane(x, y)) continue;
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 + (hash2(x * 3, y * 7) - 0.5) * 0.6) t[y * RW + x] = T_ICE; } }
}
function bakeIce(r, g) {                                    // glossy pale tiles with cracks + rim
  const t = r.tiles, P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { if (t[ty * RW + tx] !== T_ICE) continue;
    const x = tx * TS, y = ty * TS, v = hash2(tx * 5, ty * 3);
    P(x, y, TS, TS, v > 0.5 ? '#b8d8f0' : '#a8cce8'); P(x, y, TS, 1, '#d8ecfa');
    if (v > 0.3) { for (let i = 0; i < 6; i++) P(x + 3 + i * 1.5 | 0, y + 4 + (i * 5 % 7), 1, 1, '#88b0d0'); }
    if (v > 0.75) P(x + 9, y + 3, 3, 1, '#ffffff');
    const edge = (dx, dy) => { const u = tx + dx, w = ty + dy; return u < 0 || w < 0 || u >= RW || w >= RH || t[w * RW + u] !== T_ICE; };
    if (edge(0, -1)) P(x, y, TS, 1, '#ffffff'); if (edge(0, 1)) P(x, y + TS - 1, TS, 1, '#6a90b0');
    if (edge(-1, 0)) P(x, y, 1, TS, '#e8f4ff'); if (edge(1, 0)) P(x + TS - 1, y, 1, TS, '#7a9ec0'); }
}
// ice: on an ice tile your velocity only eases toward the input (slide), and rolls go twice as far
const MECH_ICE = {
  build(r) { if (r.type !== 'boss') paintIce(r, isFight(r) ? 3 : 2); else paintIce(r, 4); },
  art(r, g) { bakeIce(r, g); },
  move(r, p, dt, vx, vy) {
    if (!onIce(r, p.x, p.y - 2)) { p.ivx = vx; p.ivy = vy; return null; }
    const k = clamp(dt * 2.2);                            // low grip
    p.ivx = lerp(p.ivx || 0, vx, k); p.ivy = lerp(p.ivy || 0, vy, k);
    if (Math.hypot(p.ivx, p.ivy) > 30 && spawnP(0.2)) G.parts.push({ x: p.x + rnd(-2, 2), y: p.y, vx: -p.ivx * 0.1, vy: -2, life: 0.3, max: 0.3, col: '#ffffff', size: 1, grav: 0, add: false });
    return { x: p.ivx * 1.1, y: p.ivy * 1.1 };
  },
  rollMul(r, p) { return onIce(r, p.x, p.y - 2) ? 1.9 : 1; },
};
// wind: calm -> 0.9 s warning (streaks + arrow) -> 2.2 s gust that pushes the player and all projectiles one way
const WIND_DIRS = [[1, 0], [-1, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
const calmRoom = r => r.type === 'start' || r.type === 'shop' || r.type === 'shrine';
const MECH_WIND = {
  update(r, dt) {
    const W = r.wind = r.wind || { t: rnd(2, 3.5), ph: 0, d: [1, 0] };
    if (calmRoom(r)) { W.ph = 0; return; }
    W.t -= dt;
    if (W.t <= 0) { W.ph = (W.ph + 1) % 3; W.t = [rnd(3.2, 4.8), 0.9, 2.2][W.ph]; if (W.ph === 1) { W.d = pick(WIND_DIRS); SFX.puff(); } if (W.ph === 2) noise(1.6, { vol: 0.12, freq: 600, type: 'lowpass' }); }
    if (W.ph === 2) for (const s of G.shots) { const k = s.friendly ? 40 : 75; s.vx += W.d[0] * k * dt; s.vy += W.d[1] * k * dt; }
  },
  move(r, p, dt, vx, vy) { const W = r.wind; return W && W.ph === 2 ? { x: vx + W.d[0] * 58, y: vy + W.d[1] * 58 } : null; },
  emissive(r, time) {                                        // drifting snow; streaks while the wind blows
    const W = r.wind || { ph: 0, d: [1, 0] }, gust = W.ph === 2, warnW = W.ph === 1;
    for (let i = 0; i < 46; i++) { const sp = gust ? 150 : 14, a = hash2(i, 3), b = hash2(i, 9);
      const x = ((a * RPW + time * sp * (gust ? W.d[0] : 0.4) + Math.sin(time + i) * 6) % RPW + RPW) % RPW;
      const y = ((b * RPH + time * (gust ? sp * W.d[1] : 18)) % RPH + RPH) % RPH;
      g.globalAlpha = 0.5 + 0.3 * hash2(i, 5); px(x, y, gust && W.d[1] === 0 ? 4 : 1, gust && W.d[0] === 0 ? 4 : 1, '#e8f4ff'); }
    g.globalAlpha = 1;
    if (warnW && Math.floor(time * 8) % 2) {                // arrow on the upwind wall
      const cx = RPW / 2 - W.d[0] * 120, cy = RPH / 2 - W.d[1] * 56;
      for (let i = 0; i < 9; i++) px(cx + W.d[0] * i - W.d[1] * 0, cy + W.d[1] * i, 1, 1, '#ffffff');
      for (let i = 1; i < 4; i++) { px(cx + W.d[0] * (8 - i) - W.d[1] * i, cy + W.d[1] * (8 - i) - W.d[0] * i, 1, 1, '#ffffff');
        px(cx + W.d[0] * (8 - i) + W.d[1] * i, cy + W.d[1] * (8 - i) + W.d[0] * i, 1, 1, '#ffffff'); } }
  },
};
// crystal cave: pillars are ice crystals (tile 6, solid). Hit them (melee or shots) to shatter them into 8 shards
// that hurt everything nearby, enemies and you alike. Bosses can grow new ones.
const T_CRYS = 6, CRYS_HP = 2;
// never grow a crystal on top of an actor (they would be stuck inside a solid tile)
const tileFree = (tx, ty) => {
  // Downed teammates revive in place, so their connected bodies also reserve the tile.
  const players = [G.player, ...(typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive()
    ? coopRuntimeActors().map(a => a.context.player) : [])];
  return [...players, ...G.enemies].every(a => !a || Math.abs(a.x - (tx * TS + 8)) > 8 + a.hw || a.y - a.hh > ty * TS + TS + 1 || a.y < ty * TS - 1);
};
function addCrystal(r, tx, ty) {
  const i = ty * RW + tx; if (tx < 2 || ty < 1 || tx > RW - 3 || ty > RH - 2 || r.tiles[i] !== 0 || roomSafeLane(tx, ty)) return false;
  if (r === G.room && !tileFree(tx, ty)) return false;
  r.tiles[i] = T_CRYS; (r.crys = r.crys || new Map()).set(i, { hp: CRYS_HP, f: 0 }); return true;
}
function hitCrystal(r, i, n = 1) {
  const c = r.crys && r.crys.get(i); if (!c) return;
  c.hp -= n; c.f = 0.12; SFX.block();
  const x = (i % RW) * TS + 8, y = Math.floor(i / RW) * TS + 8;
  burst(x, y - 4, 6, ['#c8f0ff', '#ffffff'], { sp: 50, life: 0.3 });
  if (c.hp > 0) return;
  r.crys.delete(i); r.tiles[i] = 0; SFX.boom(); shake(3);
  burst(x, y - 4, 24, ['#a8e0ff', '#ffffff', '#6aa8d8'], { sp: 110, life: 0.5 });
  const dmg = Math.max(2, playerDmg() * 1.2), o = rnd(0, 1);
  for (let k = 0; k < 8; k++) { const a = o + k * Math.PI / 4;
    G.shots.push({ x, y: y - 4, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 3, dmg, crit: false, kb: 120, friendly: true, neutral: true, born: G.time,
      life: 0.55, kind: 'ice', hit: new Set(), pierce: 1, onHit: chill(1.2) }); }
}
const MECH_CRYSTAL = {
  tile: { [T_CRYS]: { solid: () => true } },
  build(r) {
    if (r.type === 'boss') { for (const [x, y] of [[3, 2], [16, 7]].map(([x, y]) => roomLayoutTile(x, y))) addCrystal(r, x, y); return; }
    if (!isFight(r)) return;
    for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] === 2) { r.tiles[i] = 0; addCrystal(r, i % RW, Math.floor(i / RW)); }
    for (let k = 0; k < 4; k++) { const x = rint(3, RW - 4), y = rint(2, RH - 3); if (!roomSafeLane(x, y)) addCrystal(r, x, y); }
  },
  melee(r, x, y, reach, face, arc) {
    if (!r.crys) return;
    for (const i of [...r.crys.keys()]) { const cx = (i % RW) * TS + 8, cy = Math.floor(i / RW) * TS + 8, d = dist(x, y, cx, cy);
      if (d < reach + 8 && (d < 12 || Math.abs(angDiff(face, Math.atan2(cy - y, cx - x))) < arc + 0.3)) hitCrystal(r, i); }
  },
  shotWall(r, x, y, s) { if (!s.friendly) return; const i = Math.floor(y / TS) * RW + Math.floor(x / TS); if (r.crys && r.crys.has(i)) hitCrystal(r, i); },
  update(r, dt) { if (r.crys) for (const c of r.crys.values()) c.f -= dt; },
  draw(r, time) {
    if (!r.crys) return;
    for (const [i, c] of r.crys) { const x = (i % RW) * TS, y = Math.floor(i / RW) * TS, wh = c.f > 0, cr = c.hp < CRYS_HP;
      px(x + 2, y + 13, 13, 3, 'rgba(0,0,0,0.4)');
      px(x + 5, y + 1, 6, 14, wh ? '#ffffff' : '#7ab8f0'); px(x + 3, y + 5, 3, 9, wh ? '#ffffff' : '#5a98d8'); px(x + 11, y + 4, 3, 10, wh ? '#ffffff' : '#4a80c0');
      px(x + 6, y + 2, 2, 10, '#e8f8ff'); px(x + 4, y + 6, 1, 6, '#c8e8ff');
      if (cr) { px(x + 7, y + 5, 1, 3, '#1a3a6a'); px(x + 8, y + 8, 1, 3, '#1a3a6a'); px(x + 6, y + 10, 2, 1, '#1a3a6a'); }
      if (Math.floor(time * 2 + i) % 5 === 0) px(x + 7, y + 3, 1, 1, '#ffffff'); }
  },
  light(r, ox, oy, time) { if (r.crys) for (const i of r.crys.keys()) light((i % RW) * TS + 8 + ox, Math.floor(i / RW) * TS + 6 + oy, 34, [120, 190, 255], 0.35 + 0.05 * Math.sin(time * 2 + i)); },
};
// fortress: standing still or walking slowly builds cold; full cold freezes you solid for a moment.
// Moving, rolling and braziers (warm light circles) thaw it. Shown as a frost bar under the hearts.
const COLD_MAX = 100;
const MECH_COLD = {
  build(r) {
    r.braziers = [];
    if (calmRoom(r)) return;
    // floor, pillar or spike tiles can host a brazier (one spike layout covers every spot, the room still needs heat)
    const spots = [[3, 2], [16, 7], [16, 2], [3, 7], [6, 2], [13, 7]].map(([x, y]) => roomLayoutTile(x, y))
      .filter(([x, y]) => !roomSafeLane(x, y) && [0, 2, 4].includes(r.tiles[y * RW + x]));
    for (const [x, y] of spots.slice(0, r.type === 'boss' ? 4 : 2)) { r.tiles[y * RW + x] = 2; r.braziers.push({ x: x * TS + 8, y: y * TS + 12 }); }
  },
  art(r, g) { const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };       // iron bowls on the pillar tiles
    for (const b of r.braziers || []) { P(b.x - 6, b.y - 8, 12, 4, '#3a3440'); P(b.x - 5, b.y - 8, 10, 1, '#5a5468'); P(b.x - 2, b.y - 4, 4, 6, '#2a2430'); P(b.x - 5, b.y + 2, 10, 2, '#3a3440'); } },
  update(r, dt) {
    const p = G.player;
    if (calmRoom(r) || !r.locked && r.type !== 'boss') { G.cold = Math.max(0, (G.cold || 0) - dt * 60); return; }
    const sp = Math.hypot(p.kbx, p.kby) > 40 ? 99 : p.moving && p.stun <= 0 ? p.speed : 0;
    if (p.stun > 0) return;                                 // no extra cold while already frozen
    let warm = false; for (const b of r.braziers || []) if (dist(p.x, p.y, b.x, b.y + 8) < 34) warm = true;
    if (warm) G.cold = Math.max(0, G.cold - dt * 70);
    else if (p.rolling > 0) G.cold = Math.max(0, G.cold - dt * 120);
    else if (sp < 30) G.cold += dt * 26 * curDiff().speed;
    else G.cold = Math.max(0, G.cold - dt * 9);
    if (G.cold >= COLD_MAX && p.stun <= 0) { G.cold = 35; p.stun = 1.1; p.slow = 1.5; SFX.block(); shake(3); addFloat(p.x, p.y - 22, '冻僵了!', '#a8e0ff', true);
      burst(p.x, p.y - 8, 20, ['#ffffff', '#a8e0ff'], { sp: 60, life: 0.5 }); }
  },
  draw(r, time) {
    for (const b of r.braziers || []) { const f = Math.floor(time * 12 + b.x) % 3;
      px(b.x - 3, b.y - 12 - f, 6, 4 + f, '#ff8a30'); px(b.x - 2, b.y - 14 - f, 4, 3, '#ffd060'); px(b.x - 1, b.y - 15 - f, 2, 2, '#fff6c0');
      if (spawnP(0.25)) G.parts.push({ x: b.x + rnd(-3, 3), y: b.y - 14, vx: rnd(-4, 4), vy: rnd(-26, -12), life: 0.5, max: 0.5, col: '#ffb040', size: 1, grav: 0, add: true }); }
    // frosted screen edge while cold is high
    const k = clamp((G.cold - 40) / 60); if (k > 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, OY);
      g.globalAlpha = 0.35 * k; g.fillStyle = '#c8f0ff'; g.fillRect(0, 0, LW, 3 + k * 4); g.fillRect(0, VIEW_H - 3 - k * 4, LW, 3 + k * 4);
      g.fillRect(0, 0, 3 + k * 6, VIEW_H); g.fillRect(LW - 3 - k * 6, 0, 3 + k * 6, VIEW_H); g.restore(); }
  },
  light(r, ox, oy, time) { for (const b of r.braziers || []) light(b.x + ox, b.y - 10 + oy, 76 + Math.sin(time * 9 + b.x) * 4, [255, 150, 70], 0.75); },
  hud() {                                                  // frost bar (drawn on the low-res canvas under the hearts)
    if (!G.cold) return; const w = 76, k = clamp(G.cold / COLD_MAX);
    g.fillStyle = '#2a3a50'; g.fillRect(5, 17, w, 1); g.fillStyle = k > 0.75 && Math.floor(G.time * 8) % 2 ? '#ffffff' : '#8ad0ff'; g.fillRect(5, 17, Math.round(w * k), 1);
  },
};
Object.assign(MECH, { ice: MECH_ICE, wind: MECH_WIND, crystal: MECH_CRYSTAL, cold: MECH_COLD });

// ---------------------------------------------------------------- bosses
// shared: a ring of telegraphed ice spikes around (x, y) at radius rad
function spikeRing(x, y, rad, n, delay, o = 0, environment = false) {
  for (let i = 0; i < n; i++) { const a = o + i * Math.PI * 2 / n, sx = clamp(x + Math.cos(a) * rad, 22, RPW - 22), sy = clamp(y + Math.sin(a) * rad * 0.62, 26, RPH - 18);
    warn(sx, sy, 7, delay, w => { areaHit(w.x, w.y, w.r, 1, environment); burst(w.x, w.y - 3, 6, ['#ffffff', '#a8e0ff'], { sp: 60, life: 0.3, up: true }); }, [140, 210, 255]); }
}
// 冰霜巨魔: chase / stomp -> 3 expanding spike rings / boulder that bursts into shards + frost patch / ground-slide charge
function updTroll(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0.25; e.k = 0; e.t = [1.6, 1.8, 2.0, 1.4][e.pat] / sp;
    if (e.pat === 3) e.tele = 0.65 / sp;
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang, 30 * sp);
  if (e.pat === 1 && e.sub <= 0 && e.k === 0) { e.k = 1; SFX.slam(); shake(7); ring(e.x, e.y - 3, 30, [160, 220, 255], 0.3); areaHit(e.x, e.y - 3, 26, 2);
    for (let j = 0; j < (enr ? 4 : 3); j++) G.later.push({ t: j * 0.35, fn: () => spikeRing(e.x, e.y, 34 + j * 26, 10 + j * 4, 0.55, j * 0.3) }); }
  if (e.pat === 2 && e.sub <= 0 && e.k < (enr ? 2 : 1)) { e.k++; e.sub = 0.7; e.flash = 0.1; SFX.heavy();
    const tx = clamp(p.x, 30, RPW - 30), ty = clamp(p.y, 34, RPH - 22);
    warn(tx, ty, 16, 0.85, w => { areaHit(w.x, w.y, w.r, 2); SFX.boom(); shake(5); ring(w.x, w.y, w.r + 4, [180, 230, 255], 0.3);
      G.flames.push({ x: w.x, y: w.y, r: 18, life: 4, ice: true });
      const o = rnd(0, 1); for (let i = 0; i < 10; i++) iceShot(w.x, w.y - 4, o + i * Math.PI / 5, 72); }, [140, 200, 255]); }
  if (e.pat === 3) {                                          // belly-slide charge, leaves frost
    if (e.tele > 0) { e.tele -= dt; e.t = Math.max(e.t, 0.6); e.cx = Math.cos(ang); e.cy = Math.sin(ang); return Z0; }
    if (e.sub <= 0) { e.sub = 0.1; G.flames.push({ x: e.x, y: e.y - 2, r: 10, life: 2.5, ice: true }); }
    return { x: e.cx * 170 * sp, y: e.cy * 170 * sp };
  }
  return Z0;
}
// 雪原狼王: triple pounce / summon + howl (pack frenzy) / ice-breath fan
function updWolfKing(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0; e.k = 0; e.t = [1.3, 2.4, 1.6, 1.8][e.pat] / sp; e.state = 0;
    if (e.pat === 2 && G.enemies.length < 6) { for (let i = 0; i < (enr ? 3 : 2); i++) { const s = freeSpot(G.room, 40, p.x, p.y); spawnEnemy('wolf', s.x, s.y, 0.6); }
      G.howlT = G.time + 4; SFX.boss(); addFloat(e.x, e.y - 26, '嗷呜——', '#a8d8ff', true); ring(e.x, e.y - 6, 60, [170, 210, 255], 0.5); shake(4); }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.sin(e.anim * 2) * 0.6, 50 * sp);
  if (e.pat === 1) {                                          // 3 pounces: crouch 0.3 -> leap 0.28
    if (e.k >= (enr ? 4 : 3)) return Z0;
    if (e.state === 0) { e.state = 2; e.sub = 0.32 / sp; e.hx = Math.cos(ang); e.hy = Math.sin(ang); e.flash = 0.06; e.t = Math.max(e.t, 0.8); }
    if (e.state === 2) { if (e.sub <= 0) { e.state = 1; e.sub = 0.28; SFX.swing(); } return Z0; }
    if (e.sub <= 0) { e.state = 0; e.k++; } return { x: e.hx * 210 * sp, y: e.hy * 210 * sp };
  }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.55; SFX.puff();
    for (let i = -3; i <= 3; i++) iceShot(e.x, e.y - 7, ang + i * 0.16, 95 + Math.abs(i) * 4, { chill: 1.8 }); }
  return Z0;
}
// 晶簇母体: never moves. Crystal lines erupt toward you / shield phase (immune until its 4 guard crystals are shattered) / shard nova
const GUARD = [[7, 3], [12, 3], [7, 6], [12, 6]].map(([x, y]) => roomLayoutTile(x, y));
function updCrystalHeart(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player, R = G.room;
  e.kbx = e.kby = 0;
  if (e.immune) {                                           // shield up: wait for the guard crystals (or time out)
    e.shieldT -= dt;
    const left = (e.guard || []).filter(i => R.crys && R.crys.has(i)).length;
    if (!left || e.shieldT <= 0) { e.immune = false; e.t = 1.2; SFX.boom(); shake(6); addFloat(e.x, e.y - 26, '护盾破碎!', '#ffffff', true);
      burst(e.x, e.y - 10, 40, ['#ffffff', '#a8e0ff'], { sp: 120, life: 0.6 });
      if (!left) { e.hp -= Math.round(e.max * 0.06); e.flash = 0.3; } }
    if (spawnP(0.3)) { const a = rnd(0, 6.28); G.parts.push({ x: e.x + Math.cos(a) * 14, y: e.y - 10 + Math.sin(a) * 9, vx: 0, vy: -8, life: 0.4, max: 0.4, col: '#c8f0ff', size: 1, grav: 0, add: true }); }
    return Z0;
  }
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 4); e.sub = 0.2; e.k = 0; e.t = [2.0, 1.6, 0.4, 1.8][e.pat] / sp;
    if (e.pat === 2) { for (const [x, y] of GUARD) if (!R.crys || !R.crys.has(y * RW + x)) addCrystal(R, x, y);
      e.guard = GUARD.map(([x, y]) => y * RW + x).filter(i => R.crys && R.crys.has(i));
      if (e.guard.length) { e.immune = true; e.shieldT = 7; SFX.magic(); addFloat(e.x, e.y - 26, '晶壁护体 · 击碎周围冰晶', '#a8e0ff', true); } }
  }
  e.sub -= dt;
  if (e.pat === 0 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.75 / sp;   // crystal line: spikes march from the boss to where you stand
    const a = Math.atan2(p.y - e.y, p.x - e.x) + (e.k === 2 ? 0.35 : e.k === 3 ? -0.35 : 0);
    for (let i = 1; i <= 9; i++) { const x = e.x + Math.cos(a) * i * 15, y = e.y + Math.sin(a) * i * 11;
      if (x < 20 || x > RPW - 20 || y < 24 || y > RPH - 16) break;
      warn(x, y, 7, 0.45 + i * 0.07, w => { areaHit(w.x, w.y, w.r, 1); burst(w.x, w.y - 3, 5, ['#ffffff', '#7ab8f0'], { sp: 50, life: 0.3, up: true }); }, [120, 190, 255]); } }
  if (e.pat === 1 && e.sub <= 0 && e.k < 3) { e.k++; e.sub = 0.45 / sp; SFX.shoot();  // spinning shard spiral
    const n = enr ? 14 : 10, o = e.anim * 0.9 + e.k * 0.2; for (let i = 0; i < n; i++) iceShot(e.x, e.y - 10, o + i * Math.PI * 2 / n, 62); }
  if (e.pat === 3 && e.sub <= 0 && e.k < (enr ? 5 : 3)) { e.k++; e.sub = 0.5 / sp;   // crystals rain where you are
    const x = clamp(p.x + rnd(-14, 14), 26, RPW - 26), y = clamp(p.y + rnd(-10, 10), 30, RPH - 20);
    warn(x, y, 13, 0.8, w => { areaHit(w.x, w.y, w.r, 1); SFX.block(); ring(w.x, w.y, w.r + 3, [180, 230, 255], 0.25);
      if (rand() < 0.5) addCrystal(G.room, Math.floor(w.x / TS), Math.floor(w.y / TS)); }, [140, 200, 255]); }
  return Z0;
}
// 冰霜女王 (act boss): sweeping frost beam / freezing zones / mirror images that also cast / blizzard nova
function beamHits(x0, y0, a, len, w, p = G.player) {         // is the player within w px of the segment?
  const dx = p.x - x0, dy = (p.y - 6) - y0, t = clamp((dx * Math.cos(a) + dy * Math.sin(a)) / len) * len;
  return Math.hypot(dx - Math.cos(a) * t, dy - Math.sin(a) * t) < w;
}
function updFrostQueen(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1, p = G.player;
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 5); e.sub = 0.2; e.k = 0; e.t = [1.4, 2.6, 1.8, 2.0, 1.6][e.pat] / sp; e.beam = null;
    if (e.pat === 1) { e.beam = { a: ang - 1.1, da: (rand() < 0.5 ? 1 : -1), tele: 0.7 / sp }; if (e.beam.da < 0) e.beam.a = ang + 1.1; }
    const room = (enr ? 3 : 2) - G.enemies.filter(o => o.kind === 'mirrorQueen').length;
    if (e.pat === 3 && room > 0) {
      for (let i = 0; i < Math.min(room, enr ? 2 : 1); i++) { const s = freeSpot(G.room, 50, p.x, p.y, 'fly'); spawnEnemy('mirrorQueen', s.x, s.y, 0.5); }
      SFX.magic(); addFloat(e.x, e.y - 28, '镜像', '#c8d8ff', true); }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang + Math.PI / 2 * Math.sin(e.anim), 26 * sp);
  if (e.pat === 1 && e.beam) {                                // beam: telegraph line, then sweeps ~2.2 rad
    const B = e.beam;
    if (B.tele > 0) { B.tele -= dt; e.t = Math.max(e.t, 1.2); return Z0; }
    B.a += B.da * 1.4 * sp * dt;
    enemyBeamAttack(e, 6, false, 1.5);
    if (spawnP(0.6)) { const r = rnd(10, 160); G.parts.push({ x: e.x + Math.cos(B.a) * r, y: e.y - 12 + Math.sin(B.a) * r, vx: 0, vy: -10, life: 0.3, max: 0.3, col: '#ffffff', size: 1, grav: 0, add: true }); }
    return Z0;
  }
  if (e.pat === 2 && e.sub <= 0 && e.k < (enr ? 4 : 3)) { e.k++; e.sub = 0.45 / sp;   // freezing zones under/near you
    const x = clamp(p.x + (e.k > 1 ? rnd(-40, 40) : 0), 28, RPW - 28), y = clamp(p.y + (e.k > 1 ? rnd(-24, 24) : 0), 32, RPH - 20);
    // freezes only when the hit actually lands (not through i-frames), so zones cannot chain-stun
    warn(x, y, 15, 0.9, w => { const i0 = p.inv; areaHit(w.x, w.y, w.r, 1); if (p.inv > i0 && p.inv > 0.9) p.stun = Math.max(p.stun, 0.7);
      G.flames.push({ x: w.x, y: w.y, r: 15, life: 3, ice: true }); SFX.block(); ring(w.x, w.y, w.r + 3, [200, 240, 255], 0.3); }, [160, 220, 255]); }
  if (e.pat === 4 && e.sub <= 0 && e.k < (enr ? 3 : 2)) { e.k++; e.sub = 0.6 / sp; SFX.shoot();
    const n = enr ? 20 : 16, o = e.k * 0.16; for (let i = 0; i < n; i++) iceShot(e.x, e.y - 12, o + i * Math.PI * 2 / n, 70); }
  return Z0;
}
// mirror image: fragile, drifts around and fires slow shard fans; shatters when the queen dies
function updMirror(e, dt, ang, d) {
  if (e.t <= 0) { e.t = rnd(1.6, 2.2) / fspd(); for (const k of [-0.3, 0, 0.3]) iceShot(e.x, e.y - 10, ang + k, 66); SFX.magic(); }
  return { x: Math.cos(ang + Math.PI / 2) * 30 * Math.sin(e.anim * 0.9), y: Math.sin(e.anim * 1.7) * 18 + (d < 60 ? -Math.sin(ang) * 20 : 0) };
}

// ---------------------------------------------------------------- regions
// pool: [kind, budget cost, weight, min floor]. pal/amb tint the room art and lighting; mech = map mechanic id
const ACT2 = [
  { name: '冰封湖', pal: { wall: [92, 110, 134], floor: [120, 140, 160], mortar: [44, 54, 72], deco: [200, 230, 255] }, amb: 'rgb(150,170,200)',
    pool: [['wolf', 1.2, 3, 1], ['wisp', 1.2, 2, 1], ['bat', 1, 1, 1], ['yeti', 2.4, 1, 2]], elite: 'frostGolem', boss: 'troll', bossSub: '冰湖的守望者',
    hazard: 0, mech: 'ice', mechName: '冰面（滑行）', mechTip: '冰面会让你滑行，翻滚距离加倍' },
  { name: '暴雪隘口', pal: { wall: [100, 108, 124], floor: [150, 156, 170], mortar: [58, 62, 76], deco: [230, 240, 255] }, amb: 'rgb(140,150,170)',
    pool: [['wolf', 1.2, 3, 1], ['wisp', 1.2, 2, 1], ['yeti', 2.4, 1, 1]], elite: 'frostGolem', boss: 'wolfKing', bossSub: '狼群之主',
    hazard: 4, mech: 'wind', mechName: '暴风（推力）', mechTip: '强风会把你和弹道推向同一方向' },
  { name: '冰晶洞窟', pal: { wall: [58, 70, 112], floor: [70, 82, 120], mortar: [26, 30, 56], deco: [140, 200, 255] }, amb: 'rgb(110,124,180)',
    pool: [['wisp', 1.2, 3, 1], ['wolf', 1.2, 2, 1], ['yeti', 2.4, 1, 2]], elite: 'frostGolem', boss: 'crystalHeart', bossSub: '洞窟的心脏',
    hazard: 0, mech: 'crystal', mechName: '冰晶柱（可击碎）', mechTip: '击碎冰晶柱会向四周飞出碎片，敌我皆伤' },
  { name: '永冻要塞', pal: { wall: [84, 92, 112], floor: [96, 104, 122], mortar: [36, 40, 54], deco: [180, 210, 240] }, amb: 'rgb(120,130,160)',
    pool: [['yeti', 2.4, 2, 1], ['wisp', 1.2, 2, 1], ['wolf', 1.2, 2, 1]], elite: 'frostGolem', boss: 'frostQueen', bossSub: '永冬的主宰',
    hazard: 4, mech: 'cold', mechName: '寒冷（会冻僵）', mechTip: '站着不动会积累寒冷，靠近火盆或翻滚可以驱寒' },
];
// ---------------------------------------------------------------- bosses + regions (one table per act; see js/act-kit.js)
registerActContent(2, {
  enemies: {
    troll: { hp: 330, hw: 9, hh: 6, h: 15, spr: () => SPR.troll, gold: [0, 0], col: ['#7a9ac0', '#e8f4ff', '#a8d0f0'], boss: true, name: '冰霜巨魔' },
    wolfKing: { hp: 300, hw: 7, hh: 4, h: 10, scale: 1.8, spr: e => SPR.wolfKing[e.moving ? Math.floor(e.anim * 10) % 2 : 0], gold: [0, 0], col: ['#6a7a98', '#ffe060', '#b8c4d8'], boss: true, name: '雪原狼王',
      tele: e => e.pat === 1 && e.state === 2 },
    crystalHeart: { hp: 360, hw: 8, hh: 6, h: 15, spr: () => SPR.crystalHeart, gold: [0, 0], col: ['#7ab8f0', '#ffffff', '#4a6ad0'], boss: true, name: '晶簇母体',
      fx: (e, time, y) => { if (!e.immune) return; g.globalAlpha = 0.35 + 0.2 * Math.sin(time * 6); ellipse(e.x, y - 8, 16, 14, '#c8f0ff'); ellipse(e.x, y - 8, 15, 13, '#ffffff'); g.globalAlpha = 1; } },
    frostQueen: { hp: 480, hw: 8, hh: 5, h: 16, spr: () => SPR.frostQueen, gold: [0, 0], col: ['#5a7ad8', '#f0f4ff', '#c8f0ff'], boss: true, name: '冰霜女王',
      fx: (e, time, y) => { const B = e.beam; if (e.pat !== 1 || !B) return;
        const x0 = e.x, y0 = y - 12, L = ROOM_BEAM_RANGE, c = Math.cos(B.a), s = Math.sin(B.a);
        if (B.tele > 0) { if (Math.floor(time * 16) % 2) for (let i = 12; i < L; i += 3) px(x0 + c * i, y0 + s * i, 1, 1, '#a8e0ff'); return; }
        for (let i = 8; i < L; i++) { const x = x0 + c * i, yy = y0 + s * i; if (x < 0 || x > RPW || yy < 0 || yy > RPH) break;
          px(x - s * 1.5, yy + c * 1.5, 1, 1, '#6ab8f0'); px(x, yy, 1, 1, '#ffffff'); px(x + s * 1.5, yy - c * 1.5, 1, 1, '#6ab8f0'); } },
      onDeath: e => { for (const o of G.enemies) if (o.kind === 'mirrorQueen') o.hp = 0; } },
    mirrorQueen: { hp: 14, hw: 6, hh: 4, h: 14, fly: true, alpha: 0.55, spr: () => SPR.frostQueen, gold: [0, 0], col: ['#c8d8ff', '#ffffff'], name: '镜像', glow: [170, 210, 255] },
  },
  ai: {
    troll: updTroll, wolfKing: updWolfKing, crystalHeart: updCrystalHeart, frostQueen: updFrostQueen, mirrorQueen: updMirror,
  },
  bossLight: { troll: [150, 210, 255], wolfKing: [255, 230, 120], crystalHeart: [120, 190, 255], frostQueen: [170, 220, 255] },
  regions: ACT2,
});
