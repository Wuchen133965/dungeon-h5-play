'use strict';
// ============================================================ 高品质装备特效（只影响画面）
// 史诗 < 银武 < 传说 逐级加特效：手持武器光晕与流光、挥砍拖尾加宽、弹道尾迹、命中火花、
// 身上的传说防具 / 鞋子 / 饰品光环，以及装备栏与装备卡的动态描边。
// 只读装备、不改任何数值或判定；不调用 rand()，所有闪烁都由时间和坐标哈希决定，单机与联机画面一致。

// visual grade of one item: 0 none, 1 epic, 2 silver weapon, 3 legendary
const gearFxGrade = it => !it ? 0 : it.silver ? 2 : it.tier >= 3 ? 3 : it.tier === 2 ? 1 : 0;
// colours per grade: [main glow, bright core, accent]
const GEAR_FX_COL = {
  1: { glow: [190, 110, 255], core: '#e4c8ff', acc: '#b45aff' },
  2: { glow: [170, 230, 255], core: '#f2fbff', acc: '#8ad8ff' },
  3: { glow: [255, 190, 70], core: '#fff4c8', acc: '#ffb432' },
};
// legendary pieces worn besides the weapon (0..6) -> aura strength
const gearFxAuraN = eq => !eq ? 0 : [eq.armor, eq.boots, ...(eq.trinkets || [])].filter(it => gearFxGrade(it) === 3).length;
const gearFxTw = (t, seed) => 0.5 + 0.5 * Math.sin(t * 7 + seed * 2.3);          // twinkle 0..1

// ---------------------------------------------------------------- hero: aura behind, weapon glow and sparkles in front
function gearFxAura(p, eq, time) {
  const n = gearFxAuraN(eq); if (!n) return;
  const k = Math.min(1, 0.5 + n * 0.16), cx = p.x, cy = p.y - 7 * (p.scale || 1);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.globalAlpha = (0.6 + 0.15 * Math.sin(time * 3)) * k;
  ellipse(cx, p.y - 1, 9 + n * 0.6, 3.2, '#ffd27a');
  if (n >= 2) { g.globalAlpha = .4 * k; ellipse(cx, p.y - 1, 11 + n * .6, 4.2, '#fff0b0'); }
  for (let i = 0; i < 5 + n; i++) {
    const ph = (time * 0.7 + hash2(i, 3.1)) % 1, a = i * 2.39 + time * 0.9;
    g.globalAlpha = Math.sin(ph * Math.PI) * .95 * k;
    px(cx + Math.cos(a) * (7 + hash2(i, 9) * 3), cy + 7 - ph * 18, n >= 3 ? 2 : 1, 2, i % 2 ? '#fff0b0' : '#ffb432');
  }
  g.restore();
}
function gearFxWeapon(p, it, time) {
  if (p.charging && p.chargeT >= COMBAT_CHARGE.tell || p.attackLevel && p.swing > 0) return;
  const gr = gearFxGrade(it); if (!gr || p.rolling > 0) return;
  g.save();
  const C = GEAR_FX_COL[gr], w = p.wpn || {}, sc = p.scale || 1, flip = Math.cos(p.face) < -0.05, dir = flip ? -1 : 1;
  const cx = p.x, cy = p.y - 7 * sc, L = ((typeof WLEN !== 'undefined' && WLEN[w.kind]) || 10) * sc;
  let hx = cx + 4 * dir, hy = p.y - 5, ang;
  if (p.swing > 0 && !w.ranged) { ang = p.swingAng; hx = cx; hy = cy; }
  else ang = w.ranged ? ((p.swing > 0 || (G.enemies && G.enemies.length)) ? p.face : -Math.PI / 2 + dir * 0.35) : -Math.PI / 2 + dir * 0.12;
  const c = Math.cos(ang), s = Math.sin(ang), tipX = hx + c * Math.max(4, L), tipY = hy + s * Math.max(4, L);
  // soft glow along the blade / at the focus
  g.globalCompositeOperation = 'lighter';
  for (let i = 2; i <= Math.max(4, L); i += 2) {
    const size = gr === 3 ? 7 : 5, x = Math.round(hx + c * i), y = Math.round(hy + s * i);
    g.globalAlpha = (gr === 3 ? .5 : gr === 2 ? .4 : .3) * (.85 + .15 * Math.sin(time * 6 - i * .5));
    g.fillStyle = rgba(C.glow); g.fillRect(x - (size >> 1), y - (size >> 1), size, size);
    g.globalAlpha = gr === 3 ? .8 : .6; g.fillStyle = C.core; g.fillRect(x - 1, y - 1, 2, 2);
  }
  // travelling sheen: a bright pixel running from grip to tip (silver and legendary)
  if (gr >= 2) { const u = (time * 1.6) % 1; g.globalAlpha = Math.sin(u * Math.PI);
    px(hx + c * L * u - 1, hy + s * L * u - 1, 2, 2, C.core); }
  // tip star: epic blinks, legendary/silver hold a 4-point star
  const tw = gearFxTw(time, p.x * 0.1);
  g.globalAlpha = .75 + .25 * tw;
  px(tipX - 1, tipY - 1, 2, 2, '#ffffff');
  if (gr >= 2) { const r = gr === 3 ? 4 : 3; px(tipX - r, tipY, 1, 1, C.core); px(tipX + r, tipY, 1, 1, C.core); px(tipX, tipY - r, 1, 1, C.core); px(tipX, tipY + r, 1, 1, C.core); }
  // Legendary: four bright embers orbit the hand
  if (gr === 3) for (let i = 0; i < 4; i++) { const a = time * 3.2 + i * Math.PI / 2;
    g.globalAlpha = .9; px(hx + Math.cos(a) * 7, hy + Math.sin(a) * 4, 2, 2, i % 2 ? C.core : C.acc); }
  // wider, brighter slash arc while swinging
  if (p.swing > 0 && !w.ranged && !w.thrust) {
    const u = 1 - p.swing / (p.swingT || 0.15), r = Math.max(8, (p.reach || 18) * sc - 3) + 1;
    const half = Math.min(w.arc || 1.2, 1.3) + (w.quake ? 1.8 : 0), sd = w.kind === 'dagger' ? p.alt : 1;
    const a0 = p.swingAng - half * sd, span = 2 * half * easeOutCubic(u);
    for (let t = 0; t < span; t += 0.09) { const a = a0 + t * sd, kk = t / (2 * half);
      g.globalAlpha = (.55 + .4 * kk) * (1 - u * .35);
      g.fillStyle = rgba(C.glow); g.fillRect(Math.round(cx + Math.cos(a) * (r + 1)), Math.round(cy + Math.sin(a) * (r + 1) * 0.85), gr === 3 ? 4 : gr === 2 ? 3 : 2, gr === 3 ? 4 : gr === 2 ? 3 : 2);
      if (gr >= 2 && hash2(Math.floor(t * 40), Math.floor(time * 20)) > 0.7) px(cx + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3) * 0.85, 1, 1, C.core); }
  } else if (p.swing > 0 && w.thrust) {
    const k = Math.sin((1 - p.swing / (p.swingT || 0.14)) * Math.PI), r = Math.max(8, (p.reach || 30) * sc);
    for (let i = 6; i < r; i += 2) { g.globalAlpha = .9 * k * (.5 + .5 * i / r); g.fillStyle = rgba(C.glow);
      g.fillRect(Math.round(cx + Math.cos(p.swingAng) * i), Math.round(cy + Math.sin(p.swingAng) * i * 0.85) - 2, gr === 3 ? 3 : 2, 5); }
  }
  g.restore();
}
// Draw after scene lighting so weapon glows retain their colour in dark rooms.
function gearFxEmissive(time) {
  const heroes = typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive()
    ? coopRuntimeActors().filter(a => !a.downed).map(a => a.context) : [{ player: G.player, eq: G.eq }];
  if (typeof coopTownActive === 'function' && coopTownActive())
    for (const a of COOP_TOWN.actors.values()) if (a.id !== COOP.selfId) heroes.push(a);
  g.save();
  for (const { player: p, eq } of heroes) {
    if (!p || !eq || p.rolling > 0 || p.inv > 0 && Math.floor(time * 18) % 2) continue;
    gearFxAura(p, eq, time); gearFxWeapon(p, eq.weapon, time);
  }
  g.restore();
}

// ---------------------------------------------------------------- projectiles: the main volley carries the weapon grade (attack() reads p.gfx), draw a coloured trail
const _gearFxRecalc = recalcStats;
recalcStats = function () { const out = _gearFxRecalc.apply(this, arguments); if (G.player) G.player.gfx = gearFxGrade(G.eq && G.eq.weapon); return out; };
const _gearFxDrawShot = drawShot;
drawShot = function (s, emissive = false) {
  const gr = s.gfx;
  if (gr && emissive && s.friendly && GEAR_FX_COL[gr]) {
    const C = GEAR_FX_COL[gr], sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, n = gr === 3 ? 11 : gr === 2 ? 8 : 5;
    for (let i = 1; i <= n; i++) { g.globalAlpha = (1 - i / (n + 1)) * (gr === 1 ? .7 : .95);
      g.fillStyle = rgba(C.glow); g.fillRect(Math.round(s.x - ux * i * 2.5), Math.round(s.y - uy * i * 2.5), gr >= 2 && i < 5 ? 3 : 2, gr >= 2 && i < 5 ? 3 : 2); }
    if (gr >= 2) { g.globalAlpha = 0.6 + 0.4 * Math.sin(G.time * 20 + s.x); px(s.x - uy * 2, s.y + ux * 2, 1, 1, C.core); px(s.x + uy * 2, s.y - ux * 2, 1, 1, C.core); }
    g.globalAlpha = 1;
  }
  return _gearFxDrawShot(s, emissive);
};

// ---------------------------------------------------------------- hits: a burst of coloured sparks (cosmetic particles only)
const GEAR_FX_MAX_SPARKS = 320, GEAR_FX_MAX_RINGS = 24;
const GEAR_FX_BUDGET = { time: null, parts: null, rings: null, sparks: 0, circles: 0 };
function gearFxHitBudget() {
  const b = GEAR_FX_BUDGET;
  if (b.time !== G.time || b.parts !== G.parts || b.rings !== G.rings) {
    b.time = G.time; b.parts = G.parts; b.rings = G.rings; b.sparks = b.circles = 0;
    for (const p of G.parts) if (p.gearSpark && p.life > 0) b.sparks++;
    for (const r of G.rings) if (r.gearSpark && r.t < r.life) b.circles++;
  }
  return b;
}
const _gearFxDamageEnemy = damageEnemy;
damageEnemy = function (e, n, crit, dx, dy, o = {}) {
  const alive = e && e.hp > 0 && !e.hidden;
  const out = _gearFxDamageEnemy.apply(this, arguments);
  if (!alive || !o.proc || o.fromMinion || !G.eq) return out;
  const gr = o.shot ? o.shot.gfx || 0 : gearFxGrade(G.eq.weapon);
  if (!gr) return out;
  const budget = gearFxHitBudget(), C = GEAR_FX_COL[gr], m = Math.min(gr === 3 ? 11 : gr === 2 ? 8 : 5, Math.max(0, GEAR_FX_MAX_SPARKS - budget.sparks));
  const x = e.x, y = e.y - (e.h || 8) / 2, seed = (G.time * 60) | 0;
  for (let i = 0; i < m; i++) { const a = (i / m) * Math.PI * 2 + hash2(seed, i) * 0.8, sp = 40 + hash2(i, seed) * 50;
    G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 10, life: .32, max: .32, col: i % 2 ? C.core : C.acc, size: gr >= 2 && i % 2 === 0 ? 2 : 1, grav: 60, add: true, gearSpark: true }); }
  budget.sparks += m;
  if (gr === 3 && budget.circles < GEAR_FX_MAX_RINGS) {
    G.rings.push({ x, y, max: crit ? 20 : 12, col: C.glow, life: crit ? .3 : .18, t: 0, gearSpark: true }); budget.circles++;
  }
  return out;
};

// ---------------------------------------------------------------- UI: animated frame on gear slots and item cards
const _gearFxSlotBox = slotBox;
slotBox = function (x, y, it, empty) {
  _gearFxSlotBox(x, y, it, empty);
  const gr = gearFxGrade(it); if (!gr) return;
  const C = GEAR_FX_COL[gr], t = G.time || 0, per = 40, u = (t * (gr === 3 ? 0.9 : 0.6)) % 1, k = Math.floor(u * per);
  // a bright pixel runs around the 11x11 frame; legendary has two
  const at = i => { i = ((i % per) + per) % per; return i < 10 ? [x - 1 + i, y - 1] : i < 20 ? [x + 9, y - 1 + i - 10] : i < 30 ? [x + 9 - (i - 20), y + 9] : [x - 1, y + 9 - (i - 30)]; };
  for (const off of gr === 3 ? [0, per / 2] : [0]) { const [ax, ay] = at(k + off); g.globalAlpha = 0.9; px(ax, ay, 1, 1, C.core); g.globalAlpha = 0.5; const [bx, by] = at(k + off - 1); px(bx, by, 1, 1, C.acc); }
  if (gr >= 2) { g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5); px(x + 8, y, 1, 1, '#ffffff'); }
  g.globalAlpha = 1;
};
const _gearFxDrawItemCard = drawItemCard;
drawItemCard = function (it, x0, y0, w, t, opts, sel, ready) {
  _gearFxDrawItemCard(it, x0, y0, w, t, opts, sel, ready);
  const gr = gearFxGrade(it); if (!gr || typeof hg === 'undefined') return;
  // shimmer band sweeping across the title row
  if (Number.isFinite(ITEM_CARD_PAGE.y0)) y0 = ITEM_CARD_PAGE.y0;               // the card may have been moved up to fit
  const C = GEAR_FX_COL[gr], u = ((G.time || 0) * (gr === 3 ? 0.55 : 0.4)) % 1.6, bx = x0 + 4 + u * (w - 8);
  if (u > 1) return;
  hg.save(); hg.globalCompositeOperation = 'lighter';
  for (let i = -4; i <= 4; i++) { hg.globalAlpha = (1 - Math.abs(i) / 5) * (gr === 1 ? 0.12 : 0.2);
    hg.fillStyle = rgba(C.glow); hg.fillRect((bx + i) * U, (y0 + 2) * U, U, 16 * U); }
  if (gr === 3) for (let i = 0; i < 3; i++) { const sx = x0 + 6 + hash2(i, Math.floor((G.time || 0) * 2)) * (w - 12), sy = y0 + 4 + hash2(Math.floor((G.time || 0) * 2), i) * 12;
    hg.globalAlpha = 0.7; hg.fillStyle = C.core; hg.fillRect(sx * U, sy * U, U * 0.8, U * 0.8); }
  hg.restore();
};
