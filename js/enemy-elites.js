'use strict';
// ============================================================ 1.9.0 elites and bosses (acts 1-5)
// 1) Elite signature moves: act 2-5 elites alternate their slam with one signature move (replaces, never stacks).
// 2) Elite affixes (P9): hard = 1, nightmare = 1-2; ids only on the enemy (guests draw the badges).
// 3) Bosses: shuffle-bag pattern choice (no repeats, every move once per cycle; BOSS_PATTERN.shuffle = false
//    restores the fixed rotation) and one enrage-only move per boss.

// ---------------------------------------------------------------- 1) elite signatures
const ELITE_SIGNATURES = {
  // ice wall with a gap sweeping from the golem toward you
  frostGolem: (e, ang) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    sweepWall({ x: e.x + c * 10, y: e.y - 3 + s * 10, a: ang, len: 150, sp: 85, dist: 210, gc: rnd(-40, 40), gw: 36, delay: .7, col: '#a8e0ff' });
    SFX.magic(); addFloat(e.x, e.y - e.h - 10, '冰墙', '#a8e0ff');
  },
  // ring of tar around the golem that ignites
  bogKing: (e) => {
    warnShape({ shape: 'donut', x: e.x, y: e.y - 3, r0: 20, r1: 52 }, .7, w => {
      shapeHit(w); SFX.slam(); shake(3);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + rnd(-.2, .2);
        groundArea({ kind: 'tar', x: clamp(w.x + Math.cos(a) * 36, 20, RPW - 20), y: clamp(w.y + Math.sin(a) * 30, 24, RPH - 14), r: 13, ignite: 1.2, life: 3 }); }
    }, [150, 110, 70]);
  },
  // quicksand funnel: drags you in for 0.9 s, then an outer ring — stay close, inside the hole
  sandColossus: (e) => {
    e.funnelT = .9;
    warnShape({ shape: 'donut', x: e.x, y: e.y - 3, r0: 18, r1: 56 }, .9, w => { if (shapeHit(w)) shake(2); SFX.slam(); ring(w.x, w.y, w.r1, [230, 190, 110], .3); }, [230, 190, 110]);
    addFloat(e.x, e.y - e.h - 10, '流沙', '#e8c070');
  },
  // a lightning cross centred on the golem
  cloudGolem: (e) => {
    for (const a of [0, Math.PI / 2]) warnShape({ shape: 'rect', x: e.x, y: e.y - 3, a, len: 230, w: 14 }, .7, w => { shapeHit(w, 1, { onHit: zap(.25) }); SFX.zap();
      G.bolts.push({ x0: w.x - Math.cos(w.a) * w.len / 2, y0: w.y - Math.sin(w.a) * w.len / 2, x1: w.x + Math.cos(w.a) * w.len / 2, y1: w.y + Math.sin(w.a) * w.len / 2, life: .2 }); }, [255, 240, 140]);
  },
};
for (const [kind, sig] of Object.entries(ELITE_SIGNATURES)) {
  const slam = AI[kind];
  AI[kind] = (e, dt, ang, d) => {
    if (e.funnelT > 0) { e.funnelT -= dt; const p = G.player, k = norm({ x: e.x - p.x, y: e.y - p.y }); p.kbx += k.x * 7; p.kby += k.y * 7; }
    if (e.state === 0 && e.t <= 0 && d < 100) {
      if (!e.nextMove) e.nextMove = pickPattern(e, [{ id: 'slam' }, { id: 'sig' }]);
      if (e.nextMove === 'sig') { e.nextMove = null; e.flash = .1; sig(e, ang, d); e.t = rnd(2, 2.6) / fspd(); enemyPunish(e, .7); return Z0; }
    }
    const before = e.state, v = slam(e, dt, ang, d);
    if (before !== 0 && e.state === 0) e.nextMove = null;      // slam finished: choose again next time
    return v;
  };
}

// ---------------------------------------------------------------- 2) elite affixes
const ELITE_AFFIXES = {
  armored: { name: '坚甲', col: '#c8d8ff' },
  aftershock: { name: '余震', col: '#ffb060' },
  hasted: { name: '迅捷', col: '#80f0c0' },
  splitting: { name: '分裂', col: '#d890ff' },
  frostAura: { name: '冰霜', col: '#a8e0ff', aura: 'ice' },
  fireAura: { name: '烈焰', col: '#ff8a30', aura: 'fire' },
  poisonAura: { name: '剧毒', col: '#7adc5a', aura: 'spore' },
  warded: { name: '守护', col: '#ffe080' },
};
const AFFIX_FORBIDDEN = [['armored', 'hasted']];
const AFFIX_AURA_CAP = 2;                       // aura elites allowed on screen at once
function affixAllowed(list, id) {
  if (list.includes(id)) return false;
  if (AFFIX_FORBIDDEN.some(pair => pair.includes(id) && pair.some(o => o !== id && list.includes(o)))) return false;
  if (ELITE_AFFIXES[id].aura) {
    if (list.some(a => ELITE_AFFIXES[a].aura)) return false;
    if (G.enemies.filter(o => o.hp > 0 && (o.affix || []).some(a => ELITE_AFFIXES[a].aura)).length >= AFFIX_AURA_CAP) return false;
  }
  return true;
}
// Called where elites spawn (game.js). Normal difficulty: none; hard: 1; nightmare: 1-2. Elite odds are unchanged.
function rollEliteAffixes(e) {
  if (!e) return e;
  const D = EDEF[e.kind], diff = G.diff || 0;
  if (!D.elite || D.boss || e.split || diff <= 0 || (G.act || 1) > 5) return e;     // act 6 waits for its own pass
  const n = diff >= 2 ? (rand() < .5 ? 2 : 1) : 1, list = [];
  for (let i = 0; i < n; i++) {
    const options = Object.keys(ELITE_AFFIXES).filter(id => affixAllowed(list, id));
    if (options.length) list.push(pick(options));
  }
  return applyAffixes(e, list);
}
function applyAffixes(e, list) {
  e.affix = list.slice();
  if (list.includes('hasted')) e.tmul = (e.tmul || 1) * 1.25;
  return e;
}
const hasAffix = (e, id) => !!(e && e.affix && e.affix.includes(id));
let AFFIX_SOURCE = null;                         // the elite whose AI is running (aftershock reads it)
function affixUpdate(e, dt) {
  if (hasAffix(e, 'armored')) {                  // every wind-up is armoured; breaking it cancels the move
    if (e.state !== 0 && !e.armor && !e.armorSpent) { enemyArmorCast(e, 1.2, 4); e.armorSpent = true; }
    if (e.state === 0) { e.armorSpent = false; if (e.armor) e.armor = null; }
    if (e.armorBroken) { e.armorBroken = false; e.state = 0; e.z = 0; e.t = 1.2; e.nextMove = null; }
  }
  for (const id of e.affix) { const aura = ELITE_AFFIXES[id].aura;
    if (aura && (e.auraT = (e.auraT || 0) - dt) <= 0) { e.auraT = .3;
      G.flames.push({ x: e.x, y: e.y, r: 15, life: .45, ...(aura === 'ice' ? { ice: true } : aura === 'spore' ? { spore: true } : {}) }); } }
}
for (const kind of Object.keys(EDEF).filter(k => EDEF[k].elite && !EDEF[k].boss && AI[k])) {
  const base = AI[kind];
  AI[kind] = (e, dt, ang, d) => {
    if (!e.affix) return base(e, dt, ang, d);
    affixUpdate(e, dt);
    const before = e.state; AFFIX_SOURCE = e;
    try {
      const v = base(e, dt, ang, d);
      if (hasAffix(e, 'hasted') && before !== 0 && e.state === 0) enemyPunish(e, .6);   // faster, but rests after each move
      return v;
    } finally { AFFIX_SOURCE = null; }
  };
}
// aftershock: every slam (areaHit from the elite's own AI) repeats as an outer ring 0.5 s later
// (co-op resolves areaHit once per member; the key keeps it to one ring per slam)
const areaHitBeforeAffix = areaHit;
let aftershockKey = '';
areaHit = function (x, y, r, n = 1, environment = false) {
  const src = AFFIX_SOURCE; areaHitBeforeAffix(x, y, r, n, environment);
  const key = `${G.time}:${x}:${y}:${r}`;
  if (hasAffix(src, 'aftershock') && key !== aftershockKey && (aftershockKey = key)) warnShape({ shape: 'donut', x, y, r0: r, r1: r + 24 }, .5, w => { shapeHit(w); SFX.slam(); ring(w.x, w.y, w.r1, [255, 176, 96], .3); }, [255, 176, 96]);
};
// splitting: two small copies on death (never split again, never carry affixes)
const killEnemyBeforeAffix = killEnemy;
killEnemy = function (e, ...args) {
  const out = killEnemyBeforeAffix(e, ...args);
  if (hasAffix(e, 'splitting') && !e.split && G.room && G.room.type !== 'town') for (let i = 0; i < 2; i++) {
    const c = spawnEnemy(e.kind, e.x + (i ? 10 : -10), e.y, .3);
    c.split = true; c.hp = c.max = Math.max(1, Math.round(e.max * .3)); c.sc = (c.sc || 1) * .7;
    c.hw = Math.max(3, Math.round(c.hw * .7)); c.hh = Math.max(3, Math.round(c.hh * .7)); c.h = Math.max(6, Math.round(c.h * .7));
  }
  return out;
};
// warded: ordinary enemies within 70 px of a warded elite take 30% less damage
const WARD_RANGE = 70;
function wardSource(e) {
  if (!e || EDEF[e.kind].elite || EDEF[e.kind].boss) return null;
  return G.enemies.find(o => o !== e && o.hp > 0 && hasAffix(o, 'warded') && dist(o.x, o.y, e.x, e.y) < WARD_RANGE) || null;
}
const damageEnemyBeforeAffix = damageEnemy;
damageEnemy = function (e, n, ...rest) { return damageEnemyBeforeAffix(e, wardSource(e) ? n * .7 : n, ...rest); };
// badges: a ring in the affix colour plus the names above the elite's hp bar; warded links to protected allies
function drawEnemyAffixes(e, time, top) {
  if (!e.affix || !e.affix.length || e.hidden || e.spawn > 0) return;
  g.save();
  e.affix.forEach((id, i) => { const A = ELITE_AFFIXES[id]; if (!A) return;
    g.globalAlpha = .55; ellipse(e.x, e.y - 1, e.hw + 8 + i * 3, (e.hw + 8 + i * 3) * .5, A.col, time * (i ? -1.5 : 1.5)); });
  if (hasAffix(e, 'warded')) for (const o of G.enemies) if (o !== e && o.hp > 0 && !EDEF[o.kind].elite && !EDEF[o.kind].boss && dist(o.x, o.y, e.x, e.y) < WARD_RANGE) {
    g.globalAlpha = .35; g.strokeStyle = '#ffe080'; g.lineWidth = 1; g.beginPath(); g.moveTo(e.x, e.y - e.h / 2); g.lineTo(o.x, o.y - o.h / 2); g.stroke(); }
  g.globalAlpha = 1; g.font = '6px sans-serif'; g.textAlign = 'center';
  const label = e.affix.map(id => ELITE_AFFIXES[id] ? ELITE_AFFIXES[id].name : '').join('·');
  g.fillStyle = '#000000'; g.fillText(label, e.x + .5, top + .5); g.fillStyle = ELITE_AFFIXES[e.affix[0]] ? ELITE_AFFIXES[e.affix[0]].col : '#ffffff'; g.fillText(label, e.x, top);
  g.restore();
}

// ---------------------------------------------------------------- 3) bosses
const BOSS_PATTERN = { shuffle: true, enrageEvery: 3 };
// Shuffle bag over 0..n-1: each move once per cycle, random order, never the same move twice in a row.
function bossNextPat(e, n) {
  if (!BOSS_PATTERN.shuffle) return (e.pat + 1) % n;
  if (!e.patBag || !e.patBag.length || e.patBag.some(i => i >= n)) e.patBag = Array.from({ length: n }, (_, i) => i);
  const id = pickPattern({ lastPat: e.pat }, e.patBag.map(i => ({ id: i })));
  e.patBag = e.patBag.filter(i => i !== id);
  return id;
}
// One enrage-only move per boss (acts 1-5). Runs at a pattern boundary; e.pat = -1 while it plays out so no
// regular pattern branch runs. Casts stay owned by the boss, so bossRecoveryBoundary waits for them to land.
const bossAim = () => ({ x: G.player.x, y: G.player.y - 3 });
const linesThrough = (x, y, a0, n, o = {}) => Array.from({ length: n }, (_, i) => ({ shape: 'rect', x: x + rnd(-8, 8), y: y + rnd(-6, 6), a: a0 + i * Math.PI / n, len: o.len || 200, w: o.w || 14, t: o.t || .6, col: o.col, fn: o.fn || (w => { if (shapeHit(w)) shake(2); SFX.slam(); }) }));
const BOSS_ENRAGE = {
  boss: { t: 2, name: '骨墙', fn: e => { const fromLeft = G.player.x > e.x;
    sweepWall({ x: fromLeft ? 14 : RPW - 14, y: RPH / 2, a: fromLeft ? 0 : Math.PI, len: RPH, sp: 80, dist: RPW - 28, gc: -RPH / 4 + rnd(-12, 12), gc2: RPH / 4 + rnd(-12, 12), gw: 34, delay: .8, col: '#e4dcc4' }); } },
  treant: { t: 2, name: '根网', when: e => bossThreatEnabled(e, 'root'), fn: e => { const p = bossAim();
    warnChain([0, 1, 2, 3].map(i => ({ shape: 'rect', x: i < 2 ? p.x + (i ? 26 : -26) : p.x, y: i < 2 ? p.y : p.y + (i === 2 ? -18 : 18), a: i < 2 ? Math.PI / 2 : 0,
      len: i < 2 ? RPH : 260, w: 12, t: .6, col: [120, 220, 90], fn: w => { if (bossThreatEnabled(e, 'root')) { shapeHit(w); SFX.slam(); } } })), .25); } },
  demon: { t: 2.2, name: '炎环', fn: e => {
    warnShape({ shape: 'donut', x: e.x, y: e.y - 3, r0: 28, r1: 74 }, .7, w => { shapeHit(w, 1, { fire: true }); SFX.boom(); shake(4); ring(w.x, w.y, w.r1, [255, 120, 40], .35); }, [255, 120, 40]);
    const p = bossAim(); warnChain([0, 1].map(() => ({ shape: 'circle', x: p.x, y: p.y, r: 16, t: .8, col: [255, 140, 40], fn: w => { areaHit(w.x, w.y, w.r, 1); SFX.boom(); G.flames.push({ x: w.x, y: w.y, r: 10, life: 1.6 }); } })), .5); } },
  troll: { t: 1.8, name: '冰墙', fn: (e, ang) => ELITE_SIGNATURES.frostGolem(e, ang) },
  wolfKing: { t: 1.6, name: '围猎', fn: () => { const p = bossAim(), o = rnd(0, 6.28);
    for (let i = 0; i < 3; i++) { const a = o + i * Math.PI * 2 / 3, x = clamp(p.x + Math.cos(a) * 70, 16, RPW - 16), y = clamp(p.y + Math.sin(a) * 50, 20, RPH - 12);
      warnShape({ shape: 'cone', x, y, a: Math.atan2(p.y - y, p.x - x), len: 95, arc: .28 }, .65, w => { shapeHit(w); SFX.slam(); }, [190, 225, 255]); } } },
  crystalHeart: { t: 1.6, name: '晶核读条', fn: e => { enemyArmorCast(e, 1.2, 6);
    trackedWarn(e, { shape: 'donut', x: e.x, y: e.y - 3, r0: 22, r1: 92 }, 1.2, w => { if (e.hp > 0) { shapeHit(w, 1, { onHit: chill(1.6) }); SFX.magic(); shake(4); } e.armor = null; }, [140, 200, 255]); } },
  frostQueen: { t: 1.6, name: '交叉光束', fn: () => { const p = bossAim(), a = rnd(0, Math.PI);
    for (const k of [0, Math.PI / 2]) warnShape({ shape: 'rect', x: p.x, y: p.y, a: a + k, len: 300, w: 16 }, .75, w => { shapeHit(w, 1, { onHit: chill(1.4) }); SFX.magic(); }, [150, 200, 255]); } },
  toad: { t: 1.6, name: '连舌', fn: (e, ang) => warnChain([0, 1].map(() => ({ shape: 'line', x: e.x, y: e.y - 6, a: ang, len: 170, w: 12, t: .55, col: [255, 120, 140],
    fn: w => { const p = G.player, i0 = p.inv; shapeHit(w); if (p.inv > i0) { const k = norm({ x: e.x - p.x, y: e.y - p.y }); p.kbx += k.x * 150; p.kby += k.y * 150; } SFX.slam(); } })), .4) },
  mycelia: { t: 1.8, name: '焦菌', fn: () => { const p = bossAim();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + rnd(-.3, .3), x = clamp(p.x + Math.cos(a) * 30, 20, RPW - 20), y = clamp(p.y + Math.sin(a) * 22, 24, RPH - 14);
      warnShape({ shape: 'circle', x, y, r: 14 }, .6, w => groundArea({ kind: 'tar', x: w.x, y: w.y, r: 15, ignite: 1.2, life: 3 }), [150, 110, 70]); } } },
  captain: { t: 2, name: '潮浪', fn: () => { const fromLeft = G.player.x > RPW / 2;
    sweepWall({ x: fromLeft ? 12 : RPW - 12, y: RPH / 2, a: fromLeft ? 0 : Math.PI, len: RPH, sp: 80, dist: RPW - 24, gc: clamp(G.player.y + rnd(-50, 50), 40, RPH - 40) - RPH / 2, gw: 40, delay: .8, col: '#7ad0e8' }); } },
  brood: { t: 1.4, name: '破土', when: e => !e.hidden, fn: () => { const p = bossAim();
    warnShape({ shape: 'donut', x: p.x, y: p.y, r0: 14, r1: 42 }, .7, w => { shapeHit(w); SFX.slam(); emitPattern(w.x, w.y, { type: 'ring', n: 8, sp: 60, make: (x, y, a, sp) => spitShot(x, y, a, sp) }); }, [120, 230, 90]); } },
  sandworm: { t: 1.4, name: '横扫', when: e => !e.hidden, fn: (e, ang) => warnShape({ shape: 'rect', x: e.x, y: e.y - 3, a: ang + Math.PI / 2, len: 220, w: 20 }, .7, w => { if (shapeHit(w)) shake(3); SFX.slam(); }, [230, 190, 110]) },
  pharaoh: { t: 2, name: '诅咒三线', fn: () => { const p = bossAim(); warnChain(linesThrough(p.x, p.y, rnd(0, Math.PI), 3, { col: [180, 120, 255] }), .3); } },
  sunPriest: { t: 2, name: '日环收缩', fn: e => warnChain([
    { shape: 'donut', x: e.x, y: e.y - 3, r0: 34, r1: 84, t: .7, col: [255, 190, 60], fn: w => { shapeHit(w, 1, { fire: true }); SFX.boom(); } },
    { shape: 'circle', x: e.x, y: e.y - 3, r: 34, t: .7, col: [255, 220, 120], fn: w => { shapeHit(w, 1, { fire: true }); SFX.boom(); } }], .5) },
  mirrorKnight: { t: 1.4, name: '镜像蓄力', fn: (e, ang) => { enemyArmorCast(e, .8, 5);
    trackedWarn(e, { shape: 'cone', x: e.x, y: e.y - 3, a: ang, len: 80, arc: .6 }, .8, w => { if (e.hp > 0) { shapeHit(w, 2); shake(4); SFX.slam(); } e.armor = null; }, [200, 220, 255]); } },
  eagle: { t: 1.6, name: '俯冲', fn: e => { const p = bossAim(), a = Math.atan2(p.y - e.y, p.x - e.x), len = Math.max(30, dist(e.x, e.y, p.x, p.y));
    warnShape({ shape: 'line', x: e.x, y: e.y - 3, a, len, w: 18 }, .6, w => { shapeHit(w); SFX.slam();
      warnShape({ shape: 'donut', x: p.x, y: p.y, r0: 16, r1: 44 }, .55, d => { shapeHit(d); SFX.boom(); }, [210, 230, 255]); }, [210, 230, 255]); } },
  titan: { t: 1.8, name: '雷线', fn: () => { const p = bossAim(), a = rnd(0, Math.PI), c = Math.cos(a + Math.PI / 2), s = Math.sin(a + Math.PI / 2);
    warnChain([-40, 0, 40].map(k => ({ shape: 'rect', x: p.x + c * k, y: p.y + s * k, a, len: 260, w: 14, t: .7, col: [255, 240, 140],
      fn: w => { shapeHit(w, 1, { onHit: zap(.25) }); SFX.zap(); groundArea({ kind: 'shock', x: w.x, y: w.y, r: 14, delay: .4, life: 1.6 }); } })), .25); } },
  warden: { t: 1.4, name: '回溯读条', fn: e => { enemyArmorCast(e, 1, 5); addFloat(e.x, e.y - 30, '回溯读条 · 满蓄力打断', '#40e0ff', true);
    trackedWarn(e, { shape: 'circle', x: e.x, y: e.y - 3, r: 18 }, 1, () => { if (e.hp <= 0) return; e.armor = null; const back = Math.round(e.max * .05); e.hp = Math.min(e.max, e.hp + back);
      addFloat(e.x, e.y - 28, `回溯 +${back}`, '#40e0ff', true); SFX.magic(); }, [64, 224, 255]); } },
  observer: { t: 2, name: '星座连线', fn: () => { const pts = Array.from({ length: 4 }, () => ({ x: rnd(40, RPW - 40), y: rnd(36, RPH - 30) })); const p = bossAim(); pts[1] = { x: p.x, y: p.y };
    warnChain(pts.slice(1).map((q, i) => { const o = pts[i]; return { shape: 'line', x: o.x, y: o.y, a: Math.atan2(q.y - o.y, q.x - o.x), len: dist(o.x, o.y, q.x, q.y), w: 10, t: .6, col: [200, 170, 255], fn: w => { shapeHit(w); SFX.zap(); } }; }), .3); } },
};
function bossEnrageMove(e, ang) {
  const M = BOSS_ENRAGE[e.kind];
  if (!M || !e.enraged || (M.when && !M.when(e))) return false;
  e.enrPick = (e.enrPick || 0) + 1;
  if (e.enrPick % BOSS_PATTERN.enrageEvery) return false;
  e.pat = -1; e.sub = .2; e.k = 0; e.t = M.t; e.lastPat = -1; e.air = false;
  addFloat(e.x, e.y - e.h - 10, M.name, '#ff8060', true);
  M.fn(e, ang);
  return true;
}
