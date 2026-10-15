'use strict';
// ============================================================ hub town (主城): walkable meta map, NPCs open the meta menus,
// the summoning circle in the plaza starts a run. Reuses player movement / combat (training dummy) from the dungeon.
const TOWN_SIZE = { w: 56, h: 30, width: 896, height: 480 };
const PORTAL = { x: 448, y: 240 };
const TRAINING = { x: 176, y: 168 };
const TOWN_ROADS = [
  { x: 416, y: 16, w: 64, h: 448 }, { x: 32, y: 232, w: 832, h: 48 },
  { x: 104, y: 128, w: 736, h: 40 }, { x: 104, y: 400, w: 624, h: 40 },
  ...[104, 248, 544, 688].map(x => ({ x, y: 112, w: 32, h: 328 })),
  { x: 800, y: 224, w: 32, h: 56 },
];
const TOWN_SIGNS = [
  { x: 448, y: 184, text: '← 导师训练    银武锻造 →' },
  { x: 448, y: 326, text: '← 公会补给    军需工坊 →' },
  { x: 448, y: 388, text: '← 餐食换装    档案图鉴 →' },
];
const TOWN_BUILDINGS = [
  { id: 'mentor', x: 208, y: 64, w: 112, h: 48, col: '#4c9a66', sign: '导师帐篷' },
  { id: 'smith', x: 656, y: 64, w: 96, h: 48, col: '#b36a42', sign: '铁匠铺' },
  { id: 'guild', x: 208, y: 176, w: 112, h: 48, col: '#b86758', sign: '冒险者公会' },
  { id: 'quartermaster', x: 656, y: 176, w: 96, h: 48, col: '#688aa8', sign: '军需所' },
  { id: 'cook', x: 208, y: 336, w: 112, h: 48, col: '#c69458', sign: '炊事营' },
  { id: 'archivist', x: 656, y: 336, w: 96, h: 48, col: '#8c6eb2', sign: '档案馆' },
  { id: 'trainer', x: 64, y: 80, w: 112, h: 32, col: '#598878', sign: '历练营' },
  { id: 'refiner', x: 784, y: 192, w: 64, h: 32, col: '#947654', sign: '铸锋工坊' },
  { id: 'stylist', x: 64, y: 352, w: 112, h: 32, col: '#aa729c', sign: '织梦坊' },
  { id: 'artificer', x: 512, y: 80, w: 96, h: 32, col: '#568b9b', sign: '银武设计所' },
  { id: 'supply', x: 64, y: 192, w: 112, h: 32, col: '#9976bb', sign: '七日补给站' },
];
const TOWN_PROPS = [
  { kind: 'npc', id: 'mentor', x: 264, y: 140, r: 6, menu: 'talent', name: '导师 艾琳', role: '天赋树', col: '#82e68c' },
  { kind: 'npc', id: 'smith', x: 704, y: 140, r: 6, menu: 'armory', name: '铁匠 布洛克', role: '铁匠铺 · 装备图纸', col: '#ffb060' },
  { kind: 'npc', id: 'guild', x: 264, y: 252, r: 6, menu: 'guild', name: '委托官 莉娅', role: '公会委托', col: '#ed9685' },
  { kind: 'npc', id: 'quartermaster', x: 704, y: 252, r: 6, menu: 'quartermaster', name: '军需官 雷恩', role: '初始武器 · 试用', col: '#91c0e6' },
  { kind: 'npc', id: 'cook', x: 264, y: 416, r: 6, menu: 'cook', name: '厨师 米洛', role: '出征餐食', col: '#f3c17a' },
  { kind: 'npc', id: 'archivist', x: 704, y: 416, r: 6, menu: 'archivist', name: '书记官 诺拉', role: '功勋奖励', col: '#c4a4ef' },
  { kind: 'npc', id: 'trainer', x: 120, y: 140, r: 6, menu: 'trainer', name: '训练官 塔伦', role: '魂晶训练 · 永久属性', col: '#85cbb4' },
  { kind: 'npc', id: 'refiner', x: 816, y: 252, r: 6, menu: 'refiner', name: '铸锋师 赫德', role: '武器强化 · 升阶', col: '#e2bd7c' },
  { kind: 'npc', id: 'artificer', x: 560, y: 140, r: 6, menu: 'artificer', name: '银武设计师 赛琳', role: '部件组装 · 银武设计', col: '#9bdce5' },
  { kind: 'npc', id: 'stylist', x: 120, y: 416, r: 6, menu: 'costume', name: '时装师 薇绮', role: '魂晶解锁 · 试穿换装', col: '#edb3df' },
  { kind: 'wardrobe', x: 152, y: 418, r: 6 },
  { kind: 'anvil', x: 672, y: 142, r: 6 },
  { kind: 'stele', x: 560, y: 416, r: 7, menu: 'stele', name: '英灵碑', role: '战绩 · 图鉴', col: '#8ac8ff' },
  { kind: 'board', x: 208, y: 252, r: 6, menu: 'board', name: '公会告示板', role: '镇中告示', col: '#e8c46a' }, { kind: 'weaponrack', x: 736, y: 254, r: 6 },
  { kind: 'cookpot', x: 296, y: 416, r: 6 }, { kind: 'bookstand', x: 736, y: 416, r: 6 },
  { kind: 'designbench', x: 528, y: 142, r: 7 }, { kind: 'refinebench', x: 848, y: 252, r: 6 },
  { kind: 'obelisk', x: 386, y: 240, r: 4 }, { kind: 'obelisk', x: 510, y: 240, r: 4 },
  ...[[448, 92], [352, 200], [624, 200], [352, 344], [624, 344], [56, 304], [848, 304]].map(([x, y]) => ({ kind: 'lamp', x, y, r: 3 })),
  { kind: 'dummyPost', x: TRAINING.x, y: TRAINING.y, r: 5 },
];
const townProp = id => TOWN_PROPS.find(o => o.id === id || o.kind === id);
const townBuilding = id => TOWN_BUILDINGS.find(b => b.id === id);
const townHearth = () => { const b = townBuilding('smith'); return { x: b.x + b.w / 2, y: b.y + b.h - 2 }; };
const TOWN_MENUS = {
  talent: { title: '导师 艾琳 · 天赋', col: '#82e68c', talk: ['魂晶是亡者的余烬，也是你的力量。', '每一次倒下，都会让你更强。', '想走得更远？先让身体跟上意志。'] },
  armory: { title: '铁匠 布洛克 · 军械库', col: '#ffb060', talk: ['给我魂晶，我就把图纸送进地牢。', '解锁的装备才会出现在宝箱、商店和祭坛里。', '好铁配好汉，别让我的锤子闲着。'] },
  portal: { title: '出征法阵', col: '#c8a0ff', talk: ['法阵低声嗡鸣，等待你选择目的地。'] },
  stele: { title: '英灵碑 · 战绩与图鉴', col: '#8ac8ff', talk: ['石碑上刻着每一位冒险者的足迹。'] },
};
const TOWN = { room: null, menu: null, sel: { talent: 0, armory: { r: 0, c: 0 }, map: null, stele: 0 }, talk: '', menuT: 0, msg: null, msgT: 0,
  launch: null, hits: [], smithT: 0 };
const lockedItems = () => ITEMS.filter(i => i.lock).sort((a, b) => a.lock - b.lock);
function townMsg(s, col = '#ffe6b0') { TOWN.msg = { s, col }; TOWN.msgT = 1.6; }

SPR.mentor = makeSprite(['...oooo.....', '..oHHHHo..g.', '.oHHHHHHo.G.', '.oHsssHHo.b.', '.oHeseHHo.b.', '.oHsssHHo.b.',
  '..oRRRRoo.b.', '.oRRyRRRRob.', 'oRRRyRRRRsb.', 'oRRRyRRRRob.', '.oRRyRRRo.b.', '.oRRyRRRo.b.', 'oRRRyRRRRob.', 'ooooooooooo.'],
  { o: '#1a1018', H: '#3a6a4a', s: '#e8c8a0', e: '#201018', R: '#2a4a3a', y: '#ecba40', b: '#6a4a2a', g: '#a0ffb0', G: '#3aa060' });
SPR.smith = makeSprite(['....oooo....', '...osssso...', '...oseseo...', '...osssso...', '..ohhhhhho..', '.oothhhhtoo.',
  'osttaaaattso', 'osotaaaatoso', 'osoaaAaaaoso', '.o.aaaaaa.o.', '...aaAaaa...', '...oaaaao...', '...ob..bo...', '...oo..oo...'],
  { o: '#1a1018', s: '#e0a878', e: '#201010', h: '#8a4a20', t: '#a03a2a', a: '#5a3a28', A: '#3a2418', b: '#2a1a14' });
SPR.dummy = makeSprite(['...oooo...', '..oyyyyo..', '..oyxyxo..', '..oyyyyo..', '...oyyo...', 'oooobboooo', 'oyyybbyyyo',
  'oooyrryooo', '..oyrwryo.', '..oyrryyo.', '...oyyyo..', '....bb....', '....bb....', '...obbo...', '..oooooo..'],
  { o: '#3a2418', y: '#c8a860', x: '#3a2418', b: '#6a4a2a', r: '#c03030', w: '#ffffff' });
EDEF.dummy = { hp: 9999, hw: 5, hh: 4, h: 15, spr: () => SPR.dummy, gold: [0, 0], col: ['#c8a860', '#6a4a2a', '#c03030'], heavy: true };
AI.dummy = () => Z0;

// ---------------------------------------------------------------- town: workshops around a walkable plaza
function buildTown() {
  const { w, h } = TOWN_SIZE, t = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (!x || !y || x === w - 1 || y === h - 1) t[y * w + x] = 1;
  for (const b of TOWN_BUILDINGS) for (let y = b.y / TS; y < (b.y + b.h) / TS; y++)
    for (let x = b.x / TS; x < (b.x + b.w) / TS; x++) t[y * w + x] = 2;
  const r = { gx: 0, gy: 0, type: 'town', w, h, doors: {}, cleared: true, visited: true, tiles: t, hz: [], ph: 0, chests: [], pickups: [],
    torches: [] };
  r.canvas = renderTown(r);
  return r;
}
function renderTown(r) {
  const { width: W, height: H } = TOWN_SIZE;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), p = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const v = hash2(x * .7, y * 1.3); p(x, y, 2, 2, v > .85 ? '#4e7a3a' : v > .4 ? '#3e6a32' : '#36602c');
  }
  const stone = (x, y) => ((x - PORTAL.x) / 104) ** 2 + ((y - PORTAL.y) / 74) ** 2 < 1 ||
    TOWN_ROADS.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  for (let y = 16; y < H - 16; y += 8) for (let x = 16; x < W - 16; x += 8) {
    if (!stone(x + 4, y + 4)) continue;
    const v = hash2(x + 3, y * 2 + 7);
    p(x, y, 8, 8, '#4a4250'); p(x + 1, y + 1, 7, 7, v > .6 ? '#8a8094' : v > .25 ? '#7a7084' : '#6e6478');
    p(x + 1, y + 1, 6, 1, '#9a90a4');
  }
  const wall = (x, y) => {
    p(x, y, TS, TS, '#2a2230');
    for (let by = 0; by < 4; by++) for (let bx = -1; bx < 2; bx++) {
      const xx = x + bx * 8 + (by % 2) * 4 + 1;
      p(xx, y + by * 4 + 1, 7, 3, hash2(xx, y + by * 5) > .5 ? '#6a6070' : '#5a5062');
      p(xx, y + by * 4 + 1, 7, 1, '#7e748a');
    }
  };
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.tiles[y * r.w + x] === 1) wall(x * TS, y * TS);
  // A closed south gate and a crest over the north avenue.
  p(PORTAL.x - 16, H - TS, 32, TS, '#3a2a20');
  for (const x of [PORTAL.x - 14, PORTAL.x + 1]) { p(x, H - TS + 2, 13, 14, '#6a4a2a'); for (let i = 0; i < 3; i++) p(x, H - TS + 4 + i * 4, 13, 1, '#4a3220'); }
  p(PORTAL.x - 18, H - TS - 1, 36, 2, '#9a90a4'); p(PORTAL.x - 10, 2, 20, 12, '#3a2a40'); p(PORTAL.x - 4, 5, 8, 6, '#c8a0ff');
  for (const b of TOWN_BUILDINGS) {
    const { x, y, w, h, col, id } = b;
    p(x + 3, y + h, w, 4, 'rgba(0,0,0,.28)');
    p(x, y, w, h, '#3a2830'); p(x + 2, y + 2, w - 4, h - 3, '#6a574f');
    if (id === 'mentor') {
      for (let i = 0; i < w / 16; i++) { p(x + i * 16, y, 16, 31, i % 2 ? '#2e6e48' : '#c8bea4'); p(x + i * 16, y, 16, 3, i % 2 ? col : '#e0d8c0'); }
      for (let i = 0; i < w; i += 4) p(x + i, y + 29, 3, 3, '#ecba40');
      p(x + 32, y + 18, 32, 30, '#1a1218'); p(x + 34, y + 20, 28, 28, '#2a1a20');
      for (let i = 0; i < 5; i++) p(x + 38 + i * 4, y + 26 + (i % 2) * 2, 2, 2, '#82e68c');
      p(x + 12, y + 6, 12, 20, '#2a5a3a'); p(x + 17, y + 9, 2, 12, '#ecba40'); p(x + 14, y + 13, 8, 2, '#ecba40');
    } else if (['trainer', 'refiner', 'stylist', 'artificer', 'supply'].includes(id)) {
      // Small open-front pavilions keep the lower streets clear and match their 32px footprint.
      for (let ry = 0; ry < 16; ry += 4) { p(x - 2, y + ry, w + 4, 3, col); p(x - 2, y + ry + 3, w + 4, 1, '#3e303c'); }
      p(x, y + 16, w, 3, '#392d29'); p(x + 4, y + 19, 4, 13, '#543b2b'); p(x + w - 8, y + 19, 4, 13, '#543b2b');
      p(x + 9, y + 19, w - 18, 13, '#2d292d'); p(x + 12, y + 28, w - 24, 3, '#7c6650');
      if (id === 'trainer') { p(x + 12, y + 21, 10, 6, '#477965'); p(x + 16, y + 20, 2, 8, '#bae0c3'); }
      else if (id === 'stylist') { for (let i = 0; i < 3; i++) { p(x + 12 + i * 12, y + 21, 8, 8, ['#d7575f', '#63ae86', '#93bce8'][i]); p(x + 15 + i * 12, y + 21, 2, 8, '#ffe0a1'); } }
      else if (id === 'artificer') { p(x + 20, y + 21, w - 40, 9, '#426572'); p(x + 26, y + 22, 20, 6, '#b7d3d6'); p(x + 28, y + 24, 12, 1, '#568b9b'); }
      else if (id === 'supply') { for (let i = 0; i < 3; i++) { p(x + 15 + i * 25, y + 21, 18, 10, '#78543c'); p(x + 16 + i * 25, y + 24, 16, 1, '#cfa568'); p(x + 21 + i * 25, y + 20, 4, 11, '#bd8aff'); } }
      else { p(x + 12, y + 22, 16, 5, '#747d86'); p(x + 12, y + 22, 16, 1, '#e0d2a9'); p(x + 39, y + 21, 8, 7, '#80604a'); }
    } else {
      // Timber facades, tiled roofs, a doorway, and two lit windows.
      for (const xx of [x + 1, x + 29, x + w - 5]) p(xx, y + 16, 4, h - 16, '#4a3220');
      for (let ry = 0; ry < 18; ry += 4) { p(x - 3, y + ry, w + 6, 3, col); p(x - 3, y + ry + 3, w + 6, 1, '#3e303c'); }
      p(x - 4, y + 18, w + 8, 3, '#3a2428'); p(x + w / 2 - 10, y + 28, 20, 20, '#24141b');
      for (const xx of [x + 10, x + w - 26]) { p(xx, y + 26, 16, 13, '#362630'); p(xx + 2, y + 28, 12, 9, '#b39468'); p(xx + 7, y + 28, 2, 9, '#49342c'); }
      if (id === 'smith') {
        p(x + 68, y - 7, 10, 23, '#4a4148'); p(x + 69, y - 7, 8, 2, '#877a80');
        p(x + 32, y + 28, 32, 20, '#1a0c08'); p(x + 34, y + 30, 28, 18, '#3a1408');
        p(x + 30, y + 25, 36, 3, '#9a8580');
      }
      if (id === 'guild') { p(x + 7, y + 3, 14, 14, '#763c35'); p(x + 10, y + 6, 8, 8, '#efce91'); p(x + 13, y + 4, 2, 12, '#fff1bd'); }
      if (id === 'quartermaster') for (const xx of [x + 5, x + 74]) { p(xx, y + 38, 17, 10, '#82603d'); p(xx + 1, y + 40, 15, 1, '#b8955b'); p(xx + 7, y + 38, 2, 10, '#493321'); }
      if (id === 'cook') { p(x + 70, y - 5, 8, 21, '#7d685d'); p(x + 69, y - 5, 10, 2, '#aa978a'); p(x + 6, y + 39, 20, 9, '#7a4a29'); p(x + 8, y + 40, 16, 3, '#e3b068'); }
      if (id === 'archivist') for (let i = 0; i < 5; i++) { p(x + 8 + i * 3, y + 29, 2, 8, ['#9e6aa8', '#8ab0cf', '#c0a777'][i % 3]); p(x + 8 + i * 3, y + 31, 2, 1, '#e3d5b5'); }
    }
    // A text-free sign; the UI layer supplies crisp CJK labels.
    p(x + 18, y + h - 10, w - 36, 8, '#4c3528'); p(x + 19, y + h - 9, w - 38, 6, '#816342');
  }
  ctx.restore();
  const rng = mulberry32(77);
  for (let i = 0; i < 260; i++) {
    const x = 20 + rng() * (W - 40), y = 20 + rng() * (H - 40);
    if (stone(x, y) || TOWN_BUILDINGS.some(b => x > b.x - 4 && x < b.x + b.w + 4 && y > b.y - 10 && y < b.y + b.h + 12)) continue;
    p(x, y, 2, 2, ['#ff6a8a', '#ffe060', '#c8a0ff', '#ffffff'][i % 4]); p(x, y + 2, 1, 2, '#2a5a24');
  }
  // Training yard, benches and small planted gardens make side streets distinct.
  p(TRAINING.x - 32, TRAINING.y - 16, 64, 32, '#806344'); for (let i = 0; i < 4; i++) p(TRAINING.x - 32, TRAINING.y - 16 + i * 8, 64, 1, '#695037');
  for (const [x, y] of [[352, 96], [624, 96], [336, 368], [624, 368], [40, 440], [808, 440]]) { p(x, y, 24, 3, '#a27a47'); p(x + 2, y + 3, 20, 3, '#755235'); p(x + 3, y + 6, 2, 4, '#493420'); p(x + 19, y + 6, 2, 4, '#493420'); }
  // Silverwork is an outdoor drafting table, framed by a low rug and component trays.
  const bench = townProp('designbench');
  if (bench) { p(bench.x - 20, bench.y - 16, 56, 25, '#476775'); p(bench.x - 18, bench.y - 14, 52, 21, '#314b58'); p(bench.x - 16, bench.y - 12, 48, 1, '#6b99a5'); }
  for (let a = 0; a < Math.PI * 2; a += .04) {
    p(Math.round(PORTAL.x + Math.cos(a) * 30), Math.round(PORTAL.y + Math.sin(a) * 15), 1, 1, '#3a3044');
    p(Math.round(PORTAL.x + Math.cos(a) * 24), Math.round(PORTAL.y + Math.sin(a) * 12), 1, 1, '#4a4058');
  }
  // Central direction sign for the larger town.
  for (const sign of TOWN_SIGNS) { p(sign.x - 1, sign.y - 2, 3, 18, '#5a3a24'); p(sign.x - 45, sign.y - 4, 90, 8, '#9a7646'); p(sign.x - 43, sign.y - 2, 86, 4, '#755235'); }
  return c;
}

// ---------------------------------------------------------------- runtime
function enterTown(fromRun = false) {
  Object.assign(G, { mode: 'town', parts: [], floats: [], shots: [], enemies: [], pickups: [], chests: [], uiCoins: [], rings: [], bolts: [],
    warns: [], later: [], flames: [], cine: null, choice: null, banner: null, prompt: null, hitstop: 0, shake: 0, flash: 0, hurtFlash: 0,
    eq: { weapon: campStarterItem(), armor: null, boots: null, trinkets: [] }, gold: 0, chapter: 1, floor: 1, gfloor: 1, act: 1, diff: 0, runUp: {}, shrineUI: null,
    minions: [], holyShield: 0, ins: 0, cls: {}, campMeal: null });
  if (!TOWN.room) TOWN.room = buildTown();
  G.room = TOWN.room; G.rooms = new Map([[rkey(0, 0), G.room]]);
  G.player = newPlayer(PORTAL.x, PORTAL.y + 34); G.player.face = -Math.PI / 2; recalcStats();
  spawnEnemy('dummy', TRAINING.x, TRAINING.y, 0);
  TOWN.menu = null; TOWN.dialogue = null; TOWN.launch = null; TOWN.hits = [];
  resetInput();
  G.trans = { t: 0, out: 0, fn: () => {}, done: true }; G.fade = 1;
  if (fromRun && metaSaveReady()) saveMeta();
  showBanner('晨星镇', fromRun ? `带回魂晶 +${G.soulGain || 0} · 可回公会交付任务` : '拜访居民，准备出征，探索更远的地牢', '#ffe6b0');
}
const townNear = () => {
  const p = G.player; let best = null, bd = 22;
  for (const o of TOWN_PROPS) if (o.menu) { const d = dist(p.x, p.y, o.x, o.y + 6); if (d < bd) { bd = d; best = o; } }
  const dp = dist(p.x, p.y, PORTAL.x, PORTAL.y); if (dp < 24 && dp < bd) best = { menu: 'portal', x: PORTAL.x, y: PORTAL.y, name: '出征法阵', col: '#c8a0ff' };
  return best;
};
function updTown(dt) {
  const p = G.player;
  TOWN.msgT -= dt; TOWN.smithT -= dt; if (TOWN.pulse) TOWN.pulse.t -= dt;
  if (TOWN.launch) { updLaunch(dt); return; }
  if (TOWN.menu) { updTownMenu(dt); return; }
  if (consume('pause')) { G.pmode = 'town'; G.mode = 'pause'; return; }
  if (updTransition(dt)) { updParts(dt); return; }
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  p.hp = p.maxHp;
  updPlayer(dt);
  for (const o of TOWN_PROPS) {                                      // props are round solid blockers
    const dx = p.x - o.x, dy = (p.y - o.y) * 1.6, d = Math.hypot(dx, dy), m = o.r + p.hw;
    if (d < m && d > 0.01) { const k = (m - d) / d; moveBox(p, dx * k, dy * k / 1.6, 'player'); }
  }
  for (const e of G.enemies) { e.anim += dt; e.flash -= dt; e.kbx = e.kby = 0; e.x = TRAINING.x; e.y = TRAINING.y; updEnemyFreeze(e, dt);
    updDots(e, dt); if (e.hp < e.max) { TOWN.hits.push({ n: e.max - e.hp, t: G.time }); e.hp = e.max; } }
  TOWN.hits = TOWN.hits.filter(h => G.time - h.t < 3);
  updShots(dt); updParts(dt);
  // ambient: forge sparks, portal motes
  const hearth = townHearth(), pot = townProp('cookpot');
  if (rand() < 0.12) G.parts.push({ x: hearth.x + rnd(-8, 8), y: hearth.y - 2, vx: rnd(-10, 10), vy: rnd(-30, -10), life: 0.5, max: 0.5, col: pick(['#ff8a30', '#ffd060']), size: 1, grav: 0, add: true });
  if (pot && rand() < 0.06) G.parts.push({ x: pot.x + rnd(-3, 3), y: pot.y - 8, vx: rnd(-3, 3), vy: -10, life: .7, max: .7, col: '#e4d8c8', size: 1, grav: 0, add: false });
  if (rand() < 0.4) { const a = rnd(0, Math.PI * 2); G.parts.push({ x: PORTAL.x + Math.cos(a) * 26, y: PORTAL.y + Math.sin(a) * 13, vx: 0, vy: rnd(-20, -8),
    life: 0.8, max: 0.8, col: pick(['#c8a0ff', '#8a5aff', '#ffffff']), size: 1, grav: 0, add: true }); }
  const n = townNear(); G.prompt = null;
  if (n) {
    G.prompt = { text: n.menu === 'portal' ? (typeof COOP !== 'undefined' && COOP.connected && COOP.role === 'client' ? '等待房主发起冒险' : '查看世界地图 · 出征') : n.menu === 'stele' ? '查看英灵碑' : n.menu === 'board' ? '查看公会告示板' : `与 ${n.name} 交谈`, sub: n.role ? n.role : '选择要前往的区域', col: n.col,
      x: n.x, y: n.menu === 'portal' ? PORTAL.y + OY - 32 : n.y + OY + 16 };
    const scene = townQuestScene(n.menu);
    if (scene) { G.prompt.sub = '有任务线索 · 交谈或调查'; if (scene.inspect) G.prompt.text = `调查 ${n.name}`; }
    if (consume('interact')) { openTownInteraction(n.menu); SFX.select(); }
  }
}
function openTownMenu(m) {
  if (m === 'portal' && typeof COOP !== 'undefined' && COOP.connected && COOP.phase === 'lobby' && COOP.role !== 'host') {
    townMsg('由房主在出征法阵选择关卡并发起冒险。', '#c8a0ff'); resetInput(); return false;
  }
  const M = TOWN_MENUS[m]; TOWN.menu = m; TOWN.menuT = 0; TOWN.talk = pick(M.talk); TOWN.msg = null;
  if (m === 'portal') mapOpen();
  if (m === 'stele') MENU_STELE.reveal();
  if (m === 'armory') TOWN.smithT = 0.4;
  townServiceEvent('talk', m);
  resetInput();
}
function updTownMenu(dt) {
  const M = TOWN_MENU_UI[TOWN.menu]; TOWN.menuT += dt;
  updParts(dt);
  const vy = navPressed(), vx = navXPressed();
  if (vx || vy) M.nav(vx, vx ? 0 : vy);
  if (backPressed()) {
    if (!(M.back && M.back())) { if (TOWN.menu === 'dialogue') leaveTownDialogue(); else TOWN.menu = null; }
    resetInput(); SFX.deny(); return;
  }
  if (TOWN.menuT < 0.15 || !confirmPressed()) return;
  M.ok();
}
// stepping into the circle: player is pulled to the centre, light column, then fade into the dungeon
function updLaunch(dt) {
  const L = TOWN.launch, p = G.player; L.t += dt;
  p.x = lerp(p.x, PORTAL.x, clamp(dt * 6)); p.y = lerp(p.y, PORTAL.y + 2, clamp(dt * 6)); p.moving = false;
  updParts(dt);
  if (rand() < 0.9) for (let i = 0; i < 3; i++) { const a = rnd(0, Math.PI * 2), r = rnd(4, 30);
    G.parts.push({ x: PORTAL.x + Math.cos(a) * r, y: PORTAL.y + Math.sin(a) * r * 0.5, vx: 0, vy: rnd(-120, -60), life: 0.5, max: 0.5,
      col: pick(['#c8a0ff', '#ffffff', '#8a5aff']), size: rand() < 0.3 ? 2 : 1, grav: 0, add: true }); }
  shake(Math.min(4, L.t * 3));
  if (L.t > 0.9 && !L.flash) { L.flash = true; G.flash = 0.5; SFX.stairs(); }
  if (L.t > 1.15) { TOWN.launch = null; newRun(L.ch, L.act || 1, L.diff || 0); G.mode = 'play'; if (G.banner) G.banner.t = 0; }
}

// ---------------------------------------------------------------- town drawing (called from renderWorld when G.room is the town)
function drawTownFloor(time) {                       // summoning circle: rotating runes, brighter while launching
  const L = TOWN.launch, k = L ? 1 + L.t * 2 : 1, near = dist(G.player.x, G.player.y, PORTAL.x, PORTAL.y) < 24;
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2 + time * 0.4, x = PORTAL.x + Math.cos(a) * 27, y = PORTAL.y + Math.sin(a) * 13.5;
    px(x, y, 1, 1, i % 3 ? '#8a5aff' : '#e0c8ff'); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - time * 0.7;
    const x0 = PORTAL.x + Math.cos(a) * 24, y0 = PORTAL.y + Math.sin(a) * 12, x1 = PORTAL.x + Math.cos(a + 2.09) * 24, y1 = PORTAL.y + Math.sin(a + 2.09) * 12;
    for (let t = 0; t <= 1; t += 0.05) px(lerp(x0, x1, t), lerp(y0, y1, t), 1, 1, near || L ? '#b48aff' : '#6a4aa8'); }
  g.globalAlpha = clamp(0.25 * k + (near ? 0.15 : 0) + 0.08 * Math.sin(time * 3)); ellipse(PORTAL.x, PORTAL.y, 20, 10, '#f0d8ff'); g.globalAlpha = 1;
}
function townDrawables(time) {
  for (const o of TOWN_PROPS) drawListAdd(o.y, DK_TOWN_PROP, o);
}
function drawTownProp(o, time) {
  const { x, y } = o;
  if (o.menu && !TOWN.menu && townQuestScene(o.menu)) {
    const fy = y - 31 + Math.round(Math.sin(time * 3) * 1.5);
    px(x - 4, fy + 2, 8, 7, '#e8c46a'); px(x - 2, fy, 4, 11, '#e8c46a');
    px(x - 1, fy + 2, 2, 4, '#382020'); px(x - 1, fy + 7, 2, 2, '#382020');
  }
  if (o.kind === 'npc') {
    shadow(x, y, 5);
    const bob = Math.round(Math.sin(time * 2 + x) * 0.6), sm = o.id === 'smith' && TOWN.smithT > 0;
    const s = SPR[o.id];
    drawSpr(g, s, x, y + bob, { flip: G.player.x < x, sy: sm ? 0.92 : 1, sx: sm ? 1.06 : 1 });
    if (o.id === 'smith') {                           // hammer raised / striking
      const up = TOWN.smithT > 0 ? Math.floor(TOWN.smithT * 12) % 2 : Math.floor(time * 1.2) % 4 === 0;
      const hx = G.player.x < x ? x - 7 : x + 7;
      px(hx, y - (up ? 15 : 9), 1, 6, '#6a4a2a'); px(hx - 2, y - (up ? 17 : 10), 5, 3, '#8a8e9e');
    }
    if (!TOWN.menu && dist(G.player.x, G.player.y, x, y + 6) > 22) {     // floating "!" marker
      const fy = y - 22 + Math.round(Math.sin(time * 4 + x) * 1.5); px(x - 1, fy, 2, 4, o.col); px(x - 1, fy + 5, 2, 2, o.col); }
    return;
  }
  if (['board', 'cookpot', 'weaponrack', 'bookstand', 'designbench', 'refinebench', 'wardrobe'].includes(o.kind)) {
    shadow(x, y, 7); drawSpr(g, SPR[o.kind], x, y); return;
  }
  if (o.kind === 'anvil') { shadow(x, y, 7); px(x - 7, y - 7, 14, 3, '#5a5e6e'); px(x - 7, y - 7, 14, 1, '#9a9eae'); px(x - 4, y - 4, 8, 2, '#3a3e4a');
    px(x - 5, y - 2, 10, 2, '#4a4e5a'); px(x + 6, y - 8, 3, 2, '#5a5e6e'); return; }
  if (o.kind === 'stele') { shadow(x, y, 8);
    px(x - 7, y - 26, 14, 26, '#4a4860'); px(x - 7, y - 26, 14, 2, '#7a7890'); px(x - 8, y - 3, 16, 3, '#3a3850');
    px(x - 5, y - 27, 10, 2, '#7a7890'); px(x - 3, y - 28, 6, 1, '#7a7890');
    for (let i = 0; i < 5; i++) px(x - 4, y - 21 + i * 4, 8 - (i % 2) * 2, 1, '#8ac8ff');
    if (dist(G.player.x, G.player.y, x, y + 6) > 22 && !TOWN.menu) { const fy = y - 36 + Math.round(Math.sin(time * 4) * 1.5); px(x - 1, fy, 2, 4, o.col); px(x - 1, fy + 5, 2, 2, o.col); }
    return; }
  if (o.kind === 'obelisk') { shadow(x, y, 4); px(x - 3, y - 18, 6, 18, '#3a3048'); px(x - 2, y - 20, 4, 2, '#3a3048'); px(x - 3, y - 18, 1, 18, '#5a4a70');
    px(x - 1, y - 15, 2, 2, '#c8a0ff'); px(x - 1, y - 10, 2, 2, '#8a5aff'); return; }
  if (o.kind === 'lamp') { shadow(x, y, 3); px(x - 1, y - 18, 2, 18, '#3a3040'); px(x - 3, y - 22, 6, 5, '#2a2030'); px(x - 2, y - 21, 4, 3, '#ffd080'); px(x - 4, y - 23, 8, 1, '#4a4050'); return; }
  if (o.kind === 'dummyPost') { px(x - 9, y + 1, 18, 2, '#5a4a38'); return; }
}
function townLights(ox, oy, time) {
  const hearth = townHearth(), mentor = townBuilding('mentor'), pot = townProp('cookpot'), stele = townProp('stele'), bench = townProp('designbench');
  light(hearth.x + ox, hearth.y - 6 + oy, 70 + Math.sin(time * 11) * 4, [255, 130, 50], 0.8);
  light(mentor.x + mentor.w / 2 + ox, mentor.y + 26 + oy, 50, [120, 230, 140], 0.45);
  if (pot) light(pot.x + ox, pot.y - 6 + oy, 32, [255, 180, 95], .45);
  const L = TOWN.launch, k = L ? 1 + L.t * 1.5 : 1;
  light(PORTAL.x + ox, PORTAL.y - 4 + oy, 80 * Math.min(k, 2), [190, 120, 255], 0.6 * Math.min(k, 1.6));
  for (const o of TOWN_PROPS) if (o.kind === 'lamp') light(o.x + ox, o.y - 20 + oy, 56, [255, 200, 120], 0.7);
  if (stele) light(stele.x + ox, stele.y - 16 + oy, 40, [120, 190, 255], 0.4);
  if (bench) light(bench.x + ox, bench.y - 6 + oy, 30, [120, 220, 235], .28);
  for (const o of TOWN_PROPS) if (o.kind === 'obelisk') light(o.x + ox, o.y - 14 + oy, 26, [190, 120, 255], 0.4);
}
function townEmissive(time) {
  const hearth = townHearth();
  for (let i = 0; i < 6; i++) { const f = Math.floor(time * 12 + i * 3) % 3;          // hearth fire
    px(hearth.x - 10 + i * 4, hearth.y - 4 - f, 3, 4 + f, i % 2 ? '#ff8a30' : '#ffd060'); }
  const L = TOWN.launch;
  if (L) { const w = Math.min(20, L.t * 30); g.globalAlpha = clamp(L.t * 1.2);
    for (let y = -OY; y < PORTAL.y; y++) { const ww = w * (0.6 + 0.4 * Math.sin(y * 0.3 + G.time * 20)); px(PORTAL.x - ww / 2, y, ww, 1, y % 3 ? '#b48aff' : '#f0d8ff'); }
    g.globalAlpha = 1; }
}
