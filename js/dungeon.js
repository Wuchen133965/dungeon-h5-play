'use strict';
// ============================================================ floor generation (tree of rooms on a grid)
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
const MID_X = RW / 2, MID_Y = RH / 2;
const DOOR_TILES = { n: [[MID_X - 1, 0], [MID_X, 0]], s: [[MID_X - 1, RH - 1], [MID_X, RH - 1]],
  w: [[0, MID_Y - 1], [0, MID_Y]], e: [[RW - 1, MID_Y - 1], [RW - 1, MID_Y]] };
// Keep a two-tile route between every entrance and the central encounter / reward area.
const roomSafeLane = (x, y) => x === MID_X - 1 || x === MID_X || y === MID_Y - 1 || y === MID_Y ||
  (Math.abs(x - (RW - 1) / 2) < 2.1 && Math.abs(y - (RH - 1) / 2) < 2.1);
// Existing hand-drawn layouts use a 20 x 10 reference grid; scale their positions with the room.
const roomLayoutTile = (x, y) => [Math.round(x * (RW - 1) / 19), Math.round(y * (RH - 1) / 9)];
const rkey = (x, y) => x + ',' + y;
// The world is split into acts (幕); each act is a chain of regions (区域) played in one run, 3 floors each, boss at the end.
// A region: own palette, enemy roster, elite guard, boss, floor hazard and (from act 2 on) a map mechanic (mech).
// pool entries: [kind, budget cost, weight, min floor-in-region]
// Act 1 regions (the original three chapters):
const CHAPTERS = [
  { name: '腐朽地窖', pal: { wall: [77, 69, 92], floor: [84, 71, 77], mortar: [34, 28, 44], deco: [200, 190, 170] },
    amb: 'rgb(150,134,184)', pool: [['slime', 1, 3, 1], ['bat', 1, 2, 1], ['skel', 1.6, 2, 1]],
    elite: 'elite', boss: 'boss', bossSub: '地牢之主', hazard: 4, goal: '击败骷髅王' },
  { name: '蛛网密林', pal: { wall: [58, 76, 72], floor: [66, 76, 66], mortar: [24, 34, 32], deco: [90, 150, 80] },
    amb: 'rgb(132,150,150)', pool: [['spider', 1, 3, 1], ['shroom', 1.5, 2, 1], ['bat', 1, 1, 1], ['skel', 1.6, 1, 2]],
    elite: 'queen', boss: 'treant', bossSub: '密林之心', hazard: 4, goal: '击败腐化古树' },
  { name: '熔火深渊', pal: { wall: [86, 50, 58], floor: [80, 58, 56], mortar: [36, 18, 22], deco: [255, 120, 50] },
    amb: 'rgb(168,124,138)', pool: [['imp', 1.6, 2, 1], ['firebat', 1, 2, 1], ['golem', 2.4, 1, 1], ['skel', 1.6, 1, 1], ['spider', 1, 1, 2]],
    elite: 'colossus', boss: 'demon', bossSub: '深渊君主', hazard: 3, goal: '击败炎魔领主' },
];
// rooms: base room count per floor (grows +1 per floor-in-region and +1 per region-in-act). Acts without regions yet are
// shown on the world map as "coming soon". Later acts register their regions from their own files (act2.js ...).
const ACTS = [
  { id: 1, name: '晨星边境', sub: '地窖 · 密林 · 深渊', col: '#ffb432', rooms: 10, regions: CHAPTERS },
  { id: 2, name: '霜原', sub: '冰封与寒潮', col: '#8ae0ff', rooms: 11, regions: [] },
  { id: 3, name: '腐沼', sub: '毒水与菌毯', col: '#8ad05a', rooms: 11, regions: [] },
  { id: 4, name: '黄沙', sub: '流沙与古墓', col: '#ecc060', rooms: 12, regions: [] },
  { id: 5, name: '天穹', sub: '浮岛与雷霆', col: '#c8f0ff', rooms: 12, regions: [] },
  { id: 6, name: '虚空终焉', sub: '裂隙与混沌', col: '#b45aff', rooms: 12, regions: [] },
];
const actOf = a => ACTS[(a || 1) - 1];
const curAct = () => actOf(G.act);
const regionOf = (a, ch) => actOf(a).regions[(ch || 1) - 1];
const chap = () => regionOf(G.act, G.chapter);           // current region (name kept from the chapter era)
const curDiff = () => DIFFS[G.diff || 0];
const lastRegion = () => G.chapter >= curAct().regions.length;

// ---------------------------------------------------------------- map mechanics (地图机制)
// Each region can name a mechanic (region.mech). A mechanic is a bag of optional hooks, all called with the room:
//   build(r, ch, fi)  after tiles are laid out (paint special tiles / place props)   art(r, g)    bake static art onto the room canvas
//   update(r, dt)     every play frame                                               draw(r, t)   world layer, under actors
//   light(r, ox, oy, t) extra lights                                                 move(p, dt, mv) -> {x, y} velocity multiplier/override for the player
//   tile: { [tileValue]: { walk: bool, hurt(p, r) } } special floor tiles (values >= 5); 3 = lava, 4 = spikes are built in
const MECH = {};
const mechOf = r => (r && r.mech && MECH[r.mech]) || null;
const mechCall = (name, ...a) => { const m = mechOf(G.room); return m && m[name] ? m[name](G.room, ...a) : undefined; };

function genFloor(ch, fi, act = G.act || 1) {
  const target = actOf(act).rooms + fi + (ch - 1);
  const boundX = Math.max(4, Math.ceil(Math.sqrt(target) / 2)), boundY = Math.max(3, Math.ceil(target / (boundX * 4)));
  for (let attempt = 0; attempt < 200; attempt++) {
    const rooms = new Map();
    const add = (x, y) => { const r = { gx: x, gy: y, type: 'combat', doors: {}, cleared: false, visited: false, dist: 0 };
      rooms.set(rkey(x, y), r); return r; };
    add(0, 0);
    while (rooms.size < target) {
      const frontier = new Map();
      for (const base of rooms.values()) for (const [dx, dy] of Object.values(DIRS)) {
        const nx = base.gx + dx, ny = base.gy + dy;
        if (rooms.has(rkey(nx, ny)) || Math.abs(nx) > boundX || Math.abs(ny) > boundY) continue;
        let nb = 0; for (const [xx, yy] of Object.values(DIRS)) if (rooms.has(rkey(nx + xx, ny + yy))) nb++;
        if (nb === 1) frontier.set(rkey(nx, ny), [nx, ny]);        // a tree with branching dead ends
      }
      if (!frontier.size) break;                                 // bounded retry; never spin on invalid cells
      add(...pick([...frontier.values()]));
    }
    if (rooms.size < target) continue;
    for (const r of rooms.values()) for (const k in DIRS)
      if (rooms.has(rkey(r.gx + DIRS[k][0], r.gy + DIRS[k][1]))) r.doors[k] = true;
    // BFS distances from the start room
    const start = rooms.get(rkey(0, 0)), q = [start], seen = new Set([start]);
    while (q.length) { const r = q.shift(); for (const k in r.doors) {
      const n = rooms.get(rkey(r.gx + DIRS[k][0], r.gy + DIRS[k][1])); if (!seen.has(n)) { seen.add(n); n.dist = r.dist + 1; q.push(n); } } }
    const ends = [...rooms.values()].filter(r => r !== start && Object.keys(r.doors).length === 1).sort((a, b) => b.dist - a.dist);
    if (ends.length < (attempt < 120 ? 4 : 3) || ends[0].dist < 3) continue;
    start.type = 'start'; start.cleared = true;
    ends[0].type = fi === 3 ? 'boss' : 'stairs';
    ends[1].type = 'treasure'; ends[1].cleared = true;
    ends[2].type = 'shop'; ends[2].cleared = true;
    // every floor has one stat shrine (属性神殿). It is only a statue, so it goes on a pass-through room and
    // leaves the dead ends for challenge / altar / fountain; falls back to a spare dead end if no pass-through exists
    let e0 = 3;
    const pass = [...rooms.values()].filter(r => r.type === 'combat' && r.dist >= 1 && Object.keys(r.doors).length > 1);
    if (pass.length) { const r = pick(pass); r.type = 'shrine'; r.cleared = true; }
    else if (ends.length > 3) { ends[3].type = 'shrine'; ends[3].cleared = true; e0 = 4; }
    // remaining dead ends become special rooms: challenge (extra fight + better chest), blood altar, healing fountain
    const extra = ['challenge', ...(rand() < 0.5 ? ['altar', 'fountain'] : ['fountain', 'altar'])];
    for (let i = e0; i < ends.length && extra.length; i++) { ends[i].type = extra.shift(); ends[i].cleared = ends[i].type !== 'challenge'; }
    // guarantee at least one altar/fountain per floor (from 1-2 on); may sit on a pass-through room.
    // only altar/fountain go there: a challenge needs a dead end and must stay uncleared so its waves spawn
    const support = extra.filter(t => t !== 'challenge'), placed = 2 - support.length;
    const want = (ch > 1 || fi > 1 || act > 1) ? (rand() < 0.35 ? 2 : 1) - placed : 0;
    const mids = [...rooms.values()].filter(r => r.type === 'combat' && r.dist >= 1);   // after all dead-end types are set
    for (let k = 0; k < want && mids.length && support.length; k++) { const r = mids.splice(Math.floor(rand() * mids.length), 1)[0];
      r.type = support.shift(); r.cleared = true; }
    for (const r of rooms.values()) buildRoom(r, ch, fi, act);
    return rooms;
  }
  throw new Error('floor generation failed');
}

// hazard layouts [x, y, w, h] in tiles; kept off the door lanes so entering a room is always safe
const LAVA_PATS = [[[3, 2, 3, 2], [14, 6, 3, 2]], [[3, 6, 3, 2], [14, 2, 3, 2]], [[5, 2, 2, 2], [13, 2, 2, 2], [5, 6, 2, 2], [13, 6, 2, 2]],
  [[3, 2, 5, 1], [12, 7, 5, 1]], [[3, 2, 2, 6], [15, 2, 2, 6]]];
const SPIKE_PATS = [[[3, 2, 5, 2], [12, 6, 5, 2]], [[3, 6, 5, 2], [12, 2, 5, 2]], [[6, 1, 1, 8], [13, 1, 1, 8]], [[2, 2, 16, 1], [2, 7, 16, 1]]];
const isFight = r => r.type === 'combat' || r.type === 'stairs' || r.type === 'challenge';
function buildRoom(r, ch, fi, act = G.act || 1) {
  const REG = regionOf(act, ch);
  r.act = act; r.ch = ch; r.fi = fi; r.mech = REG.mechPick ? REG.mechPick(r) : REG.mech || null;   // mechPick: per-room roll (final heart)
  const t = new Uint8Array(RW * RH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (!x || !y || x === RW - 1 || y === RH - 1) t[y * RW + x] = 1;
  if (isFight(r)) {
    const L = [[], [[5, 3], [14, 3], [5, 6], [14, 6]], [[4, 2], [15, 2], [4, 7], [15, 7], [7, 2], [12, 7]],
      [[7, 3], [12, 3], [7, 6], [12, 6]], [[3, 2], [3, 7], [16, 2], [16, 7], [6, 3], [13, 6]]];
    let P = r.type === 'stairs' ? L[1] : pick(L);
    if (r.type === 'combat' && rand() < 0.3) { P = [];
      for (let i = 0; i < 11; i++) { const x = rint(3, RW - 4), y = rint(2, RH - 3); if (!roomSafeLane(x, y)) P.push([x, y]); }
    } else P = P.map(([x, y]) => roomLayoutTile(x, y));
    for (const [x, y] of P) if (!roomSafeLane(x, y)) t[y * RW + x] = 2;
  }
  // floor hazards: spikes in chapters 1-2 (from floor 2), lava in chapter 3
  const H = REG.hazard;
  if (H && r.type !== 'stairs' && isFight(r) && (ch > 1 || fi > 1 || act > 1) && rand() < 0.45 + fi * 0.1)
    for (const [x0, y0, w, h] of pick(H === 3 ? LAVA_PATS : SPIKE_PATS)) {
      const [x1, y1] = roomLayoutTile(x0, y0), [x2, y2] = roomLayoutTile(x0 + w, y0 + h);
      for (let y = y1; y < Math.min(RH - 1, y2); y++) for (let x = x1; x < Math.min(RW - 1, x2); x++)
        if (t[y * RW + x] === 0 && !roomSafeLane(x, y)) t[y * RW + x] = H;
    }
  r.tiles = t; r.ph = rnd(0, 2.6);
  const M = mechOf(r); if (M && M.build) M.build(r, ch, fi);
  r.hz = []; for (let i = 0; i < t.length; i++) if (t[i] === 3 || t[i] === 4) r.hz.push({ x: (i % RW) * TS, y: Math.floor(i / RW) * TS, v: t[i] });
  r.torches = [[4, 0], [15, 0]].map(([x, y]) => roomLayoutTile(x, y)).map(([x]) => ({ x: x * TS + 8, y: 7, ph: rnd(0, 9) }));
  r.canvas = renderRoom(r, ch, fi, act);
}
// special floor tile under (x, y) handled by the room's mechanic (values >= 5), or null
function mechTileAt(r, x, y) {
  const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
  const w = r.w || RW, h = r.h || RH;
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
  const v = r.tiles[ty * w + tx], M = mechOf(r);
  return v >= 5 && M && M.tile && M.tile[v] ? { v, def: M.tile[v], tx, ty } : null;
}
function hazardAt(r, x, y) {
  const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
  const w = r.w || RW, h = r.h || RH;
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return 0;
  const v = r.tiles[ty * w + tx]; return v === 3 || v === 4 ? v : 0;      // built-in hazards only; >= 5 are mechanic tiles
}
const SPIKE_CYC = 2.6, SPIKE_UP = 1.0;            // spikes are up for the last second of each cycle
const spikePhase = r => (G.time + (r.ph || 0)) % SPIKE_CYC;
const spikesUp = r => spikePhase(r) > SPIKE_CYC - SPIKE_UP;

// ============================================================ collision
function doorAt(r, tx, ty) { for (const d in r.doors) for (const [x, y] of DOOR_TILES[d]) if (x === tx && y === ty) return d; return null; }
function tileSolid(r, tx, ty, who) {
  const w = r.w || RW, h = r.h || RH;
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return r.type === 'town' || who !== 'player';
  const v = r.tiles[ty * w + tx];
  if (v >= 5) { const M = mechOf(r), d = M && M.tile && M.tile[v]; return d ? (d.solid ? d.solid(who) : false) : false; }
  if (v === 0 || v >= 3) return false;          // lava / spikes are walkable (and hurt)
  if (v === 1 && who === 'player' && !r.locked && doorAt(r, tx, ty)) return false;
  if (v === 2 && who === 'fly') return false;
  return true;
}
function boxHits(r, x, y, hw, hh, who) {
  const x0 = Math.floor((x - hw) / TS), x1 = Math.floor((x + hw - 0.01) / TS);
  const y0 = Math.floor((y - hh) / TS), y1 = Math.floor((y - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileSolid(r, tx, ty, who)) return true;
  return false;
}
function moveBox(e, dx, dy, who) {
  let hit = false;
  if (dx) { if (!boxHits(G.room, e.x + dx, e.y, e.hw, e.hh, who)) e.x += dx; else hit = true; }
  if (dy) { if (!boxHits(G.room, e.x, e.y + dy, e.hw, e.hh, who)) e.y += dy; else hit = true; }
  return hit;
}
function freeSpot(r, minDist, fromX, fromY, who = 'walk') {
  for (let i = 0; i < 200; i++) {
    const x = rnd(2.2, RW - 2.2) * TS, y = rnd(2.4, RH - 1.4) * TS;
    if (!boxHits(r, x, y, 6, 6, who) && dist(x, y, fromX, fromY) > minDist && (who === 'fly' || !hazardAt(r, x, y - 3))) return { x, y };
  }
  return { x: RPW / 2, y: RPH / 2 };
}
// ============================================================ static room art (albedo, lit at runtime)
function renderRoom(r, ch, fi, act = G.act || 1) {
  const P = regionOf(act, ch).pal, floor = act * 40 + ch * 3 + fi;
  const M0 = mechOf(r), livePillars = M0 && M0.livePillars;   // mechanics that move pillars draw them live, not baked
  const tilesSave = livePillars ? r.tiles : null; if (livePillars) r.tiles = r.tiles.map(v => v === 2 ? 0 : v);
  const c = document.createElement('canvas'); c.width = RPW; c.height = RPH;
  const g = c.getContext('2d'), seed = r.gx * 31 + r.gy * 17 + floor * 101;
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const sh = (rgb, k) => `rgb(${rgb.map(v => clamp(Math.round(v * k), 0, 255)).join(',')})`;
  // floor flagstones
  for (let ty = 1; ty < RH - 1; ty++) for (let tx = 1; tx < RW - 1; tx++) {
    const v = hash2(tx + seed, ty * 3 + seed), x = tx * TS, y = ty * TS;
    px(x, y, TS, TS, sh(P.floor, 0.92 + v * 0.18));
    px(x, y, TS, 1, sh(P.mortar, 1.2)); px(x, y, 1, TS, sh(P.mortar, 1.2));
    if (v > 0.55) { px(x + 8, y, 1, TS, sh(P.mortar, 1.3)); }
    if (v > 0.86) { for (let i = 0; i < 5; i++) px(x + 3 + i, y + 5 + (i * 7 % 4), 1, 1, sh(P.mortar, 1)); }
    if (hash2(tx * 7 + seed, ty) > 0.93) px(x + 4, y + 9, 2, 1, sh(P.floor, 1.25));
  }
  // walls: brick faces (top wall taller look), dark tops on sides
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    if (r.tiles[ty * RW + tx] !== 1) continue;
    const x = tx * TS, y = ty * TS;
    px(x, y, TS, TS, sh(P.mortar, 1));
    for (let by = 0; by < 4; by++) for (let bx = -1; bx < 2; bx++) {
      const o = (by % 2) * 4, v = hash2(tx * 3 + bx + seed, ty * 5 + by);
      px(x + bx * 8 + o + 1, y + by * 4 + 1, 7, 3, sh(P.wall, 0.88 + v * 0.25));
      px(x + bx * 8 + o + 1, y + by * 4 + 1, 7, 1, sh(P.wall, 1.18 + v * 0.1));
    }
  }
  // clip wall bricks spilling off canvas edges / inner shadow along walls
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(TS, TS, RPW - 2 * TS, 3); g.fillRect(TS, TS, 2, RPH - 2 * TS);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(TS, TS + 3, RPW - 2 * TS, 3);
  g.fillStyle = sh(P.wall, 1.35); g.fillRect(TS, RPH - TS, RPW - 2 * TS, 1);
  // door openings
  for (const d in r.doors) for (const [tx, ty] of DOOR_TILES[d]) {
    const x = tx * TS, y = ty * TS;
    px(x, y, TS, TS, '#0c070c');
    if (d === 'n') px(x, y + 12, TS, 4, sh(P.floor, 0.6));
    if (d === 's') px(x, y, TS, 4, sh(P.floor, 0.6));
    if (d === 'w') px(x + 12, y, 4, TS, sh(P.floor, 0.6));
    if (d === 'e') px(x, y, 4, TS, sh(P.floor, 0.6));
  }
  for (const d in r.doors) {            // door arch frame
    const [[ax, ay]] = DOOR_TILES[d], x = ax * TS, y = ay * TS, col = sh(P.wall, 1.5);
    if (d === 'n' || d === 's') { px(x - 2, y, 2, TS, col); px(x + 2 * TS, y, 2, TS, col); }
    else { px(x, y - 2, TS, 2, col); px(x, y + 2 * TS, TS, 2, col); }
  }
  // pillars (blocks with lit top)
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    if (r.tiles[ty * RW + tx] !== 2) continue;
    const x = tx * TS, y = ty * TS;
    px(x + 1, y + 13, 15, 3, 'rgba(0,0,0,0.45)');
    px(x + 1, y + 1, 14, 14, sh(P.mortar, 1.1));
    px(x + 2, y + 2, 12, 8, sh(P.wall, 1.2)); px(x + 2, y + 2, 12, 2, sh(P.wall, 1.55));
    px(x + 2, y + 10, 12, 4, sh(P.wall, 0.8)); px(x + 7, y + 10, 1, 4, sh(P.mortar, 1.3));
  }
  // hazards: lava pools (base colour, animated glow added at runtime) and spike plates (holes; spikes drawn at runtime)
  const isHz = (tx, ty, v) => tx >= 0 && ty >= 0 && tx < RW && ty < RH && r.tiles[ty * RW + tx] === v;
  for (const h of r.hz) {
    const { x, y, v } = h, tx = x / TS, ty = y / TS;
    if (v === 3) {
      px(x, y, TS, TS, '#b8381a');
      for (let i = 0; i < 6; i++) px(x + Math.floor(hash2(tx + i, ty) * 13), y + Math.floor(hash2(ty + i, tx) * 13), 3, 2, '#e8601e');
      if (!isHz(tx, ty - 1, 3)) { px(x, y, TS, 3, '#3a1a14'); px(x, y + 3, TS, 1, '#ff9a3a'); }
      if (!isHz(tx, ty + 1, 3)) px(x, y + TS - 2, TS, 2, '#4a2018');
      if (!isHz(tx - 1, ty, 3)) px(x, y, 2, TS, '#4a2018');
      if (!isHz(tx + 1, ty, 3)) px(x + TS - 2, y, 2, TS, '#4a2018');
    } else {
      px(x + 1, y + 1, 14, 14, sh(P.mortar, 1.4)); px(x + 1, y + 1, 14, 1, sh(P.wall, 1.1));
      for (const [a, b] of [[3, 3], [9, 3], [6, 8], [3, 12], [11, 11]]) px(x + a, y + b, 2, 2, '#120a10');
    }
  }
  // torch brackets + hanging banners on the top wall
  for (const t of r.torches) { px(t.x - 3, 8, 7, 3, '#54403a'); px(t.x - 1, 11, 3, 4, '#3c3030'); px(t.x - 3, 5, 7, 3, '#7a5636'); }
  if (r.type !== 'combat' || hash2(seed, 1) > 0.5) for (const bx of [118, 190]) {
    px(bx - 1, 1, 13, 2, '#4a3220'); px(bx, 3, 11, 10, '#781a22'); px(bx + 1, 3, 1, 10, '#962830');
    px(bx + 4, 6, 3, 5, '#be963c'); px(bx + 5, 5, 1, 7, '#be963c');
  }
  // floor clutter: bones, skull, cobwebs, moss / embers per biome
  const rr = mulberry32(seed * 7 + 3);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(TS * 1.5 + rr() * (RPW - TS * 3)), y = Math.floor(TS * 1.5 + rr() * (RPH - TS * 3));
    const k = rr(), dc = `rgb(${P.deco.join(',')})`;
    if (k < 0.45) { px(x, y, 9, 1, '#c8bea8'); px(x - 1, y - 1, 2, 3, '#c8bea8'); px(x + 8, y - 1, 2, 3, '#c8bea8'); }
    else if (k < 0.6) { px(x, y, 5, 4, '#cdc3af'); px(x + 1, y + 1, 1, 1, '#281e1e'); px(x + 3, y + 1, 1, 1, '#281e1e'); px(x + 1, y + 4, 3, 1, '#cdc3af'); }
    else { g.globalAlpha = 0.55; for (let j = 0; j < 6; j++) px(x + Math.floor(rr() * 8), y + Math.floor(rr() * 5), 2, 1, dc); g.globalAlpha = 1; }
  }
  g.strokeStyle = 'rgba(160,160,170,0.5)'; g.lineWidth = 1;
  for (let i = 1; i < 7; i++) { g.beginPath(); g.moveTo(TS, TS + i * 2.5); g.lineTo(TS + i * 2.5, TS); g.stroke();
    g.beginPath(); g.moveTo(RPW - TS, TS + i * 2.5); g.lineTo(RPW - TS - i * 2.5, TS); g.stroke(); }
  if (tilesSave) r.tiles = tilesSave;
  const M = mechOf(r); if (M && M.art) M.art(r, g, P);
  return c;
}
