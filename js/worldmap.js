'use strict';
// ============================================================ world map (出征法阵): one page per act, regions as nodes on a pixel map
// Three rows, W/S moves between them: act tabs / region nodes / difficulty. A/D changes the focused row, E sets out.
const ENAME = { slime: '软泥', bat: '蝙蝠', skel: '骷髅', spider: '毒蛛', shroom: '孢子菇', imp: '小恶魔', firebat: '火蝠', golem: '熔岩魔像' };
const MAP = { x: 12, y: 49, w: 196, h: 112, img: {} };
const NODES5 = [[22, 98], [60, 74], [98, 62], [136, 30], [174, 16]];      // entry camp + 4 regions, along the land diagonal
// per act: nodes (camp first), sea [deep, shallow, foam], shore, camp name, biome palettes per node, prop kind per node, vein
const MAP_LAYOUT = [
  { nodes: [[24, 93], [66, 75], [112, 45], [166, 21]], sea: ['#1a2a48', '#2a4a6a', '#3a5a80'], shore: '#a89a70', camp: '晨星镇',
    bio: [['#4a7a3a', '#5a8a44', '#3a6a32'], ['#5a5068', '#6a6078', '#4a4258'], ['#2a5a32', '#346a3a', '#1e4a28'], ['#5a2a24', '#6a3428', '#3e1c1a']],
    prop: ['flower', 'rock', 'tree', 'ember'], vein: [3, '#ff7a30', '#e8501e'] },
  { nodes: NODES5, sea: ['#5a7898', '#7a98b8', '#c8dcec'], shore: '#e8f0f8', camp: '霜原营地',
    bio: [['#5a7a7a', '#6a8a88', '#4a6a6a'], ['#9ac0dc', '#b8d8ec', '#7aa0c0'], ['#c8d2de', '#e4ecf4', '#aab6c4'], ['#5a78b0', '#7a98d0', '#46609a'], ['#6e7890', '#8a94aa', '#545e74']],
    prop: ['rock', 'ice', 'snow', 'crystal', 'tower'], vein: null },
  { nodes: NODES5, sea: ['#1e2a1e', '#2a3a28', '#3a4a32'], shore: '#5a5a3a', camp: '沼泽渡口',
    bio: [['#4a6a3a', '#5a7a44', '#3a5a32'], ['#3e5a30', '#4e6a38', '#2e4a26'], ['#6a4a7a', '#7a5a8a', '#56386a'], ['#3a4a5a', '#4a5a6a', '#2a3a4a'], ['#6a2a32', '#7a3a42', '#4a1a22']],
    prop: ['reed', 'reed', 'mushroom', 'mast', 'flesh'], vein: [1, '#6adc5a', '#3a9a3a'] },
  { nodes: NODES5, sea: ['#b89a60', '#c8aa70', '#d8ba80'], shore: '#e8d098', camp: '商队驿站',
    bio: [['#b8984a', '#c8a85a', '#a8883a'], ['#d0b068', '#e0c078', '#c0a058'], ['#8a7a5a', '#9a8a6a', '#6a5a3a'], ['#6a9a4a', '#7aaa5a', '#5a8a3a'], ['#a8a0b8', '#c0b8d0', '#9088a0']],
    prop: ['cactus', 'dune', 'pillar', 'palm', 'mirror'], vein: null },
  { nodes: NODES5, sea: ['#6a9ad8', '#8ab8f0', '#d8ecff'], shore: '#f0f8ff', camp: '云端码头',
    bio: [['#7aa86a', '#8ab87a', '#6a985a'], ['#8ac07a', '#9ad08a', '#6aa05a'], ['#5a6a8a', '#6a7a9a', '#4a5a7a'], ['#a8986a', '#b8a87a', '#887850'], ['#2a2a5a', '#3a3a6a', '#1a1a4a']],
    prop: ['cloud', 'cloud', 'bolt', 'gear', 'star'], vein: null },
  { nodes: NODES5, sea: ['#08040e', '#120a1e', '#2a1a40'], shore: '#3a2a50', camp: '最后的营火',
    bio: [['#3a2a4a', '#4a3a5a', '#2a1a3a'], ['#2a1a40', '#3a2a50', '#1a0e2a'], ['#4a3a5a', '#5a4a6a', '#3a2a4a'], ['#4a1a2a', '#5a2a3a', '#3a0e1a'], ['#1a1028', '#2a1a38', '#0e0818']],
    prop: ['shard', 'rift', 'pillar', 'flesh', 'star'], vein: [1, '#b45aff', '#7a2ad0'] },
];
// tiny map props, drawn into the cached map image (P = pixel rect, rr = seeded rng)
const MAP_PROPS = {
  flower: (P, x, y, rr) => { if (rr() < 0.25) P(x, y, 1, 1, ['#ff6a8a', '#ffe060', '#ffffff'][Math.floor(rr() * 3)]); },
  rock: (P, x, y, rr) => { if (rr() < 0.35) { P(x, y - 2, 2, 3, '#9a90a4'); P(x, y - 2, 2, 1, '#c0b8c8'); } },
  tree: (P, x, y, rr) => { if (rr() < 0.8) { P(x, y - 3, 1, 1, '#4a8a4a'); P(x - 1, y - 2, 3, 1, '#2e6a36'); P(x - 1, y - 1, 3, 1, '#1e4a28'); P(x, y, 1, 1, '#3a2a1a'); } },
  ember: (P, x, y, rr) => { if (rr() < 0.3) { P(x, y - 1, 2, 2, '#2a1414'); P(x, y - 1, 1, 1, '#4a2420'); } },
  ice: (P, x, y, rr) => { if (rr() < 0.4) P(x, y, 2, 1, '#eef8ff'); },
  snow: (P, x, y, rr) => { if (rr() < 0.6) P(x, y, 1, 1, '#ffffff'); },
  crystal: (P, x, y, rr) => { if (rr() < 0.4) { P(x, y - 2, 1, 3, '#a8d8ff'); P(x, y - 2, 1, 1, '#ffffff'); } },
  tower: (P, x, y, rr) => { if (rr() < 0.2) { P(x, y - 3, 2, 4, '#3a4458'); P(x, y - 3, 2, 1, '#8a94aa'); } },
  reed: (P, x, y, rr) => { if (rr() < 0.4) { P(x, y - 1, 1, 2, '#7a9a4a'); P(x + 1, y, 1, 1, '#5a7a3a'); } },
  mushroom: (P, x, y, rr) => { if (rr() < 0.4) { P(x - 1, y - 1, 3, 1, '#c87ad8'); P(x, y, 1, 1, '#e8d8c8'); } },
  mast: (P, x, y, rr) => { if (rr() < 0.15) { P(x, y - 4, 1, 5, '#5a4a3a'); P(x - 1, y - 3, 3, 1, '#7a6a5a'); } },
  flesh: (P, x, y, rr) => { if (rr() < 0.35) P(x, y, 2, 1, '#c87070'); },
  cactus: (P, x, y, rr) => { if (rr() < 0.25) { P(x, y - 2, 1, 3, '#4a7a3a'); P(x - 1, y - 1, 1, 1, '#4a7a3a'); } },
  dune: (P, x, y, rr) => { if (rr() < 0.5) P(x, y, 3, 1, '#f0d898'); },
  pillar: (P, x, y, rr) => { if (rr() < 0.2) { P(x, y - 3, 1, 4, '#c8b890'); P(x - 1, y - 3, 3, 1, '#e8d8b0'); } },
  palm: (P, x, y, rr) => { if (rr() < 0.35) { P(x, y - 1, 1, 2, '#7a5a30'); P(x - 1, y - 2, 3, 1, '#3a8a3a'); } },
  mirror: (P, x, y, rr) => { if (rr() < 0.3) P(x, y, 1, 1, '#ffffff'); },
  cloud: (P, x, y, rr) => { if (rr() < 0.25) { P(x, y, 3, 1, '#ffffff'); P(x + 1, y - 1, 2, 1, '#f0f8ff'); } },
  bolt: (P, x, y, rr) => { if (rr() < 0.25) { P(x, y - 2, 1, 1, '#ffe060'); P(x + 1, y - 1, 1, 1, '#ffe060'); P(x, y, 1, 1, '#ffe060'); } },
  gear: (P, x, y, rr) => { if (rr() < 0.25) { P(x, y, 2, 2, '#a08a50'); P(x, y, 1, 1, '#d8c080'); } },
  star: (P, x, y, rr) => { if (rr() < 0.5) P(x, y, 1, 1, rr() < 0.5 ? '#ffffff' : '#c8a0ff'); },
  shard: (P, x, y, rr) => { if (rr() < 0.35) P(x, y, 1, 2, '#6a3a9a'); },
  rift: (P, x, y, rr) => { if (rr() < 0.25) { P(x, y - 2, 1, 3, '#b45aff'); P(x, y - 1, 1, 1, '#ffffff'); } },
};
function buildMapImg(a) {
  const L = MAP_LAYOUT[a - 1], c = document.createElement('canvas'); c.width = MAP.w; c.height = MAP.h;
  const g = c.getContext('2d'), P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, s = t => t * t * (3 - 2 * t);
    const A = hash2(xi, yi), B = hash2(xi + 1, yi), C = hash2(xi, yi + 1), D = hash2(xi + 1, yi + 1);
    return lerp(lerp(A, B, s(fx)), lerp(C, D, s(fx)), s(fy)); };
  const fbm = (x, y) => vn(x, y) * 0.55 + vn(x * 2.1, y * 2.1) * 0.3 + vn(x * 4.3, y * 4.3) * 0.15;
  const ox = a * 37, biome = new Int8Array(MAP.w * MAP.h).fill(-1);
  for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) {
    // land is a diagonal band from bottom-left to top-right
    const across = (x / MAP.w - (1 - y / MAP.h));
    const land = 0.62 - Math.abs(across) * 0.9 + (fbm(x / 14 + ox, y / 14) - 0.5) * 0.5;
    if (land < 0.18) { const v = fbm(x / 6 + 40 + ox, y / 6); P(x, y, 1, 1, land > 0.13 ? L.sea[1] : v > 0.62 && (x + y) % 3 === 0 ? L.sea[2] : L.sea[0]); continue; }
    if (land < 0.22) { P(x, y, 1, 1, L.shore); continue; }
    let bi = 0, bd = 1e9; L.nodes.forEach(([nx, ny], i) => { const d = dist(x, y, nx, ny) * (0.85 + fbm(x / 9 + i * 7 + ox, y / 9) * 0.4); if (d < bd) { bd = d; bi = i; } });
    const v = fbm(x / 5 + bi * 13 + ox, y / 5), pal = L.bio[bi];
    P(x, y, 1, 1, v > 0.62 ? pal[1] : v < 0.38 ? pal[2] : pal[0]); biome[y * MAP.w + x] = bi;
    if (L.vein && bi >= L.vein[0] && bi === L.nodes.length - 1 && Math.abs(fbm(x / 10 + 3 + ox, y / 10 + 9) - 0.5) < 0.025)
      P(x, y, 1, 1, (x + y) % 2 ? L.vein[1] : L.vein[2]);                                                     // lava / poison / void veins
  }
  const rr = mulberry32(4242 + a);
  for (let i = 0; i < 260; i++) {                                                                         // biome props
    const x = Math.floor(rr() * MAP.w), y = Math.floor(rr() * MAP.h), bi = biome[y * MAP.w + x];
    if (bi >= 0) MAP_PROPS[L.prop[bi]](P, x, y, rr);
  }
  // mountains between neighbouring nodes
  for (let i = 1; i < L.nodes.length - 1; i++) { const [x0, y0] = L.nodes[i], [x1, y1] = L.nodes[i + 1], mx = (x0 + x1) / 2 + 10, my = (y0 + y1) / 2 + 14;
    for (let k = 0; k < 3; k++) { const x = mx + k * 5 - 5, y = my + (k % 2) * 3, h = 6 + (k % 2) * 2;
      for (let j = 0; j < h; j++) P(x - j / 2, y - h + j, 1 + j, 1, j < 2 ? '#e8e8f0' : j < h / 2 ? '#7a7484' : '#5a5464'); } }
  // camp houses around the entry node
  const [cx, cy] = L.nodes[0];
  for (const [hx, hy] of [[-6, -2], [0, -5], [5, -1], [-2, 2]]) { const x = cx + hx, y = cy + hy;
    P(x, y, 4, 3, '#c8b088'); P(x - 1, y - 2, 6, 2, '#a03a2a'); P(x + 1, y + 1, 1, 2, '#3a2418'); }
  return c;
}
const mapImg = a => MAP.img[a] || (MAP.img[a] = buildMapImg(a));
function mapPath(nodes, a, b, t) {               // gentle curve between two nodes
  const [x0, y0] = nodes[a], [x1, y1] = nodes[b], mx = (x0 + x1) / 2 + (y1 - y0) * 0.25, my = (y0 + y1) / 2 - (x1 - x0) * 0.15;
  const u = 1 - t; return [u * u * x0 + 2 * u * t * mx + t * t * x1, u * u * y0 + 2 * u * t * my + t * t * y1];
}
// selection lives in TOWN.sel.map = { row: 0 tabs | 1 regions | 2 difficulty, act, reg, diff }
function mapSel() {
  const S = TOWN.sel.map = TOWN.sel.map || { row: 1, act: latestAct(), reg: 0, diff: 0 };   // first open: newest act
  S.act = clamp(S.act, 1, ACTS.length);
  const n = actOf(S.act).regions.length;
  S.reg = clamp(S.reg, 0, Math.max(0, n - 1)); S.diff = clamp(S.diff, 0, DIFFS.length - 1);
  return S;
}
// furthest act that is open; used to pick the page the map opens on
const latestAct = () => { let a = 1; for (let i = 1; i <= ACTS.length; i++) if (actOpen(i) && ACTS[i - 1].regions.length) a = i; return a; };
function mapOpen() {                               // called when the portal menu opens: jump to the newest open act / region
  const S = mapSel();
  if (!actOpen(S.act) || !actOf(S.act).regions.length) S.act = latestAct();
  if (!diffOpen(S.act, S.diff)) S.diff = 0;
  S.reg = clamp(S.reg, 0, actProg(S.act).diff[S.diff].reg - 1); S.row = 1; TOWN.mapPos = null;
}
// why a launch is not possible right now (or null)
function mapBlock(S) {
  const A = actOf(S.act);
  if (!A.regions.length) return '该幕正在建设中，敬请期待';
  if (!actOpen(S.act)) return `通关「${actOf(S.act - 1).name}」后开放`;
  if (!diffOpen(S.act, S.diff)) return `先在${DIFFS[S.diff - 1].name}难度通关本幕`;
  if (!regionOpen(S.act, S.diff, S.reg + 1)) return '击败上一个区域的首领后解锁';
  return null;
}
const MENU_MAP = {
  nav(vx, vy) {
    const S = mapSel();
    if (vy) { const r = clamp(S.row + vy, 0, 2); if (r !== S.row) { S.row = r; SFX.move(); } return; }
    if (S.row === 0) { const a = clamp(S.act + vx, 1, ACTS.length); if (a !== S.act) { S.act = a; S.reg = 0; if (!diffOpen(a, S.diff)) S.diff = 0; TOWN.mapPos = null; SFX.move(); } }
    else if (S.row === 1) { const n = actOf(S.act).regions.length, r = clamp(S.reg + vx, 0, Math.max(0, n - 1)); if (r !== S.reg) { S.reg = r; SFX.move(); } }
    else { const d = clamp(S.diff + vx, 0, DIFFS.length - 1); if (d !== S.diff) { S.diff = d; SFX.move(); } }
  },
  ok() {
    if (typeof COOP !== 'undefined' && COOP.connected && COOP.phase === 'lobby' && COOP.role !== 'host') {
      townMsg('由房主在出征法阵选择关卡并发起冒险。', '#c8a0ff'); SFX.deny(); return;
    }
    const S = mapSel(), why = mapBlock(S);
    if (why) { townMsg(why, '#ff6070'); SFX.deny(); return; }
    if (typeof COOP !== 'undefined' && COOP.connected && COOP.phase === 'lobby') {
      if (!coopCanRequestReady()) { townMsg('等待旅伴加入并完成角色同步，再发起冒险。', '#c8a0ff'); SFX.deny(); return; }
      if (coopSetConfig({ act: S.act, chapter: S.reg + 1, diff: S.diff })) {
        TOWN.menu = null; TOWN.launch = null; G.prompt = null; resetInput(); coopRequestReady();
      }
      return;
    }
    TOWN.menu = null; TOWN.launch = { t: 0, ch: S.reg + 1, act: S.act, diff: S.diff }; SFX.boss(); G.prompt = null;
  },
  draw(k) {
    const S = mapSel(), time = G.time, A = actOf(S.act), L = MAP_LAYOUT[S.act - 1], n = A.regions.length;
    const P = (x, y, w, h, col) => { hg.fillStyle = col; hg.fillRect(x * U, y * U, w * U, h * U); };
    const pulse = `rgba(255,240,200,${0.55 + 0.45 * Math.sin(time * 6)})`;
    frame(6, 26, 314, 166, '出征法阵 · 世界地图', '#c8a0ff', k);
    menuHeader(TOWN.talk);
    // ---- act tabs
    ACTS.forEach((a, i) => { const x0 = 11 + i * 50, on = a.id === S.act, open = actOpen(a.id) && a.regions.length;
      uiHit(x0, 40, x0 + 47, 47, () => { S.row = 0; MENU_MAP.nav(a.id - S.act, 0); });
      panel(x0, 40, x0 + 47, 47, on ? '#2a1e2a' : '#140c16', on ? (S.row === 0 ? pulse : a.col) : '#3a3044', 1);
      T(`${a.id} ${a.name}`, x0 + 23.5, 43.6, 4.6, open ? (on ? '#fff0d8' : '#c8bcd0') : '#5a5068');
      if (!open) lockGlyph(x0 + 43, 45, '#5a5068'); });
    // ---- map
    panel(MAP.x - 2, MAP.y - 2, MAP.x + MAP.w + 2, MAP.y + MAP.h + 2, '#0a060c', S.row === 1 ? rgba(hexRGB(A.col), 0.8) : '#6a5a78', 1);
    hg.imageSmoothingEnabled = false; hg.drawImage(mapImg(S.act), MAP.x * U, MAP.y * U, MAP.w * U, MAP.h * U);
    const N = i => [MAP.x + L.nodes[i][0], MAP.y + L.nodes[i][1]];
    const fog = (cx, cy, rx, ry) => { for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { const d = Math.hypot(x / rx, y / ry); if (d > 1) continue;
      if (cx + x < MAP.x || cx + x > MAP.x + MAP.w - 2 || cy + y < MAP.y || cy + y > MAP.y + MAP.h - 2) continue;
      P(cx + x, cy + y, 2, 2, `rgba(14,10,22,${clamp((1 - d * d) * 0.85 + 0.1 * Math.sin(time * 1.5 + x * 0.2 + y * 0.3))})`); } };
    const actReady = actOpen(S.act) && n > 0;
    if (!actReady) {                                     // whole page under fog
      fog(MAP.x + MAP.w / 2, MAP.y + MAP.h / 2, 120, 80);
      T(n ? '尚未开放' : '敬请期待', MAP.x + MAP.w / 2, MAP.y + MAP.h / 2 - 4, 9, '#c8bcd0');
      T(n ? `通关「${actOf(S.act - 1).name}」后，迷雾将会散去` : `「${A.name}」正在建设中`, MAP.x + MAP.w / 2, MAP.y + MAP.h / 2 + 8, 5, '#8a7f96');
    } else {
      const D = actProg(S.act).diff[S.diff];
      for (let ch = 2; ch <= n; ch++) if (ch > D.reg) { const [cx, cy] = N(ch); fog(cx, cy, 40, 30); }
      // paths (dotted, lit up to the furthest open region)
      for (let i = 0; i < n; i++) { const open = i + 1 <= D.reg;
        for (let t = 0; t <= 1; t += 0.045) { const [x, y] = mapPath(L.nodes, i, i + 1, t), on = open && Math.floor(t * 22 - time * 3) % 3 === 0;
          P(MAP.x + x - 0.75, MAP.y + y - 0.75, 1.5, 1.5, open ? (on ? '#fff0c8' : '#d8b878') : '#4a4058'); } }
      { const [x, y] = N(0); P(x - 3, y - 9, 1, 8, '#6a4a2a'); P(x - 2, y - 9, 6, 4, A.col); T(L.camp, x, y + 6, 4.5, '#fff0d8'); }
      // region nodes: boss emblem on a badge
      for (let i = 0; i < n; i++) {
        const ch = i + 1, [x, y] = N(ch), open = ch <= D.reg, on = i === S.reg, C = A.regions[i];
        uiHit(x - 12, y - 10, x + 12, y + 17, () => { S.reg = i; S.row = 1; SFX.move(); });
        if (on) { const r = 13 + Math.sin(time * 5) * 1.2; hg.strokeStyle = S.row === 1 ? '#fff0c8' : 'rgba(255,240,200,0.5)'; hg.lineWidth = U * 0.8;
          hg.beginPath(); hg.ellipse(x * U, y * U, r * U, r * 0.8 * U, 0, 0, Math.PI * 2); hg.stroke(); }
        hg.fillStyle = open ? rgba(C.pal.deco, 0.9) : '#2a2030'; hg.beginPath(); hg.ellipse(x * U, y * U, 10 * U, 8 * U, 0, 0, Math.PI * 2); hg.fill();
        hg.fillStyle = open ? '#1a1018' : '#120c14'; hg.beginPath(); hg.ellipse(x * U, y * U, 8.6 * U, 6.6 * U, 0, 0, Math.PI * 2); hg.fill();
        const s = EDEF[C.boss].spr({ anim: 0, moving: false, state: 0 }), sc = 12 / Math.max(s.w, s.h);
        hg.globalAlpha = open ? 1 : 0.25; hg.drawImage(open ? s.img : s.white, (x - s.w * sc / 2) * U, (y - s.h * sc / 2) * U, s.w * sc * U, s.h * sc * U);
        hg.globalAlpha = 1;
        if (!open) lockGlyph(x + 7, y + 6, '#a096aa');
        if (regionCleared(S.act, ch, S.diff)) { P(x + 5, y - 10, 7, 7, '#ffd060'); for (const [a, b] of [[1.5, 3.5], [2.5, 4.5], [3.6, 2.5], [4.6, 1.4]]) P(x + 5 + a, y - 10 + b, 1.2, 1.2, '#2a1a10'); }
        const nm = open ? C.name : '？？？';
        panel(x - tw(nm, 5) / 2 - 4, y + 9, x + tw(nm, 5) / 2 + 4, y + 17, '#100a12', open ? (on ? '#fff0c8' : '#8a7f96') : '#3a3044', 0.9);
        T(nm, x, y + 13.3, 5, open ? (on ? '#fff0c8' : '#e0d4c4') : '#6a5f76');
      }
      // hero token walks to the selected region
      TOWN.mapPos = TOWN.mapPos == null ? S.reg + 1 : TOWN.mapPos + clamp(S.reg + 1 - TOWN.mapPos, -0.06, 0.06);
      { const a = Math.floor(TOWN.mapPos), f = TOWN.mapPos - a, [hx, hy] = a >= n ? L.nodes[n] : mapPath(L.nodes, a, a + 1, f), hs = SPR.hero[Math.floor(time * 6) % 2];
        hg.drawImage(hs.img, (MAP.x + hx - 5) * U, (MAP.y + hy - 22 + Math.sin(time * 4)) * U, hs.w * U, hs.h * U); }
    }
    drawMapInfo(S, A, n, actReady, pulse);
    toast(110, 158);
    hints([['W/S', '切换'], ['A/D', '选择'], ['E', typeof COOP !== 'undefined' && COOP.connected ? '发起冒险' : '出征'], ['Esc', '离开']]);
  },
};
// region boss beaten on that difficulty: the next region is open, or (last region) the act was cleared
const regionCleared = (a, ch, d) => { const D = actProg(a).diff[d]; return ch < actOf(a).regions.length ? D.reg > ch : D.wins > 0; };
const HAZARD_NAME = { 3: '熔岩池', 4: '地刺陷阱' };
const diffDesc = D => D.hp === 1 ? '标准体验' : `敌人血量 ×${D.hp} · 魂晶 ×${D.souls}`;
function drawMapInfo(S, A, n, ready, pulse) {
  panel(213, 47, 309, 161, '#1a1220', rgba(hexRGB(A.col), ready ? 0.8 : 0.35), 1);
  if (!ready) {
    T(`第 ${A.id} 幕`, 219, 55, 5, '#a096aa', 'left'); T(A.name, 219, 64, 8, '#fff0d8', 'left'); T(A.sub, 219, 73, 4.8, '#8a7f96', 'left');
    T(n ? '尚未开放' : '敬请期待', 261, 100, 7, '#6a5f76'); button(219, 140, 303, 154, '尚未开放', false); return;
  }
  const C = A.regions[S.reg], ch = S.reg + 1, D = DIFFS[S.diff], why = mapBlock(S), open = regionOpen(S.act, S.diff, ch);
  T(`第 ${A.id} 幕 · 区域 ${ch}/${n}`, 219, 54, 4.8, '#a096aa', 'left');
  T(open ? C.name : '未知区域', 219, 62.5, 8, open ? '#fff0d8' : '#6a5f76', 'left');
  const tag = regionCleared(S.act, ch, S.diff) ? ['首领已击败', '#82e68c'] : open ? ['可出征', '#ffe6b0'] : ['未解锁', '#ff7080'];
  panel(219, 68, 219 + tw(tag[0], 4.5) + 6, 75, '#100a12', tag[1], 1); T(tag[0], 222, 71.6, 4.5, tag[1], 'left');
  if (open) {
    const left = n - ch + 1, rows = [['首领', EDEF[C.boss].name], ['精英', EDEF[C.elite].name], ['敌人', C.pool.map(q => ENAME[q[0]] || EDEF[q[0]].name).filter(Boolean).slice(0, 4).join('·')],
      ['地形', C.mechName || HAZARD_NAME[C.hazard] || '—'], ['路程', `${left} 个区域 · ${left * CONFIG.floorsPerRegion} 层`], ['补给', ch > 1 ? `起始额外 ${(ch - 1) * CONFIG.catchUpChests} 个宝箱` : '—']];
    rows.forEach(([a, b], i) => { T(a, 219, 81 + i * 6.6, 4.4, '#8a7f96', 'left'); T(b, 235, 81 + i * 6.6, 4.4, '#e8dcc8', 'left'); });
  } else if (!diffOpen(S.act, S.diff)) T(`${D.name}难度尚未解锁`, 219, 88, 4.4, '#a096aa', 'left');
  else T(`击败「${EDEF[A.regions[S.reg - 1].boss].name}」后，迷雾将会散去`, 219, 88, 4.4, '#a096aa', 'left');
  // difficulty chips
  DIFFS.forEach((d, i) => { const x0 = 219 + i * 28.5, on = i === S.diff, ok = diffOpen(S.act, i);
    uiHit(x0, 120, x0 + 26, 128, () => { S.diff = i; S.row = 2; SFX.move(); });
    panel(x0, 120, x0 + 26, 128, on ? '#2a1e2a' : '#140c16', on ? (S.row === 2 ? pulse : d.col) : ok ? rgba(hexRGB(d.col), 0.4) : '#3a3044', 1);
    T(d.name, x0 + 13 - (ok ? 0 : 2), 124, 4.8, ok ? (on ? d.col : '#c8bcd0') : '#5a5068');
    if (!ok) lockGlyph(x0 + 21, 126, '#5a5068');
    if (actCleared(S.act, i)) P2(x0 + 23, 121, 2, 2, '#ffd060'); });
  T(diffOpen(S.act, S.diff) ? diffDesc(D) : `先在${DIFFS[Math.max(0, S.diff - 1)].name}难度通关本幕`, 261, 133, 4.3, diffOpen(S.act, S.diff) ? '#a096aa' : '#ff7080');
  button(219, 139, 303, 154, why ? '尚未开放' : typeof COOP !== 'undefined' && COOP.connected ? `邀请旅伴 · ${D.name}` : `启动法阵 · ${D.name}`, !why, D.col);
}
const P2 = (x, y, w, h, col) => { hg.fillStyle = col; hg.fillRect(x * U, y * U, w * U, h * U); };
const TOWN_MENU_UI = { talent: MENU_TALENT, armory: MENU_SHOP, portal: MENU_MAP, stele: MENU_STELE };
