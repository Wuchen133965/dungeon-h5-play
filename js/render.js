'use strict';
// ============================================================ low-res world renderer with multiplicative lighting
let CV, g, LCV, lg, VIG;
function initRender() {
  CV = document.getElementById('game'); LCV = document.createElement('canvas'); VIG = document.createElement('canvas');
  resizeWorldBuffers();
}
function resizeWorldBuffers() {
  CV.width = LW; CV.height = LH; g = CV.getContext('2d'); g.imageSmoothingEnabled = false;
  LCV.width = Math.ceil(LW / 2); LCV.height = Math.ceil(LH / 2); lg = LCV.getContext('2d');
  VIG.width = LW; VIG.height = LH;
  const v = VIG.getContext('2d'), gr = v.createRadialGradient(LW / 2, LH / 2 + 8, 60, LW / 2, LH / 2 + 8, 210);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)'); v.fillStyle = gr; v.fillRect(0, 0, LW, LH);
}
// Light sprites: the radial gradient (alpha 1 / .45 / 0) is pre-rendered once per colour and radius bucket into an
// offscreen canvas, then stamped with drawImage + globalAlpha = k. On the additive ('lighter') light map this equals
// the old per-call gradient with alpha k, k*.45, 0. Radii are bucketed upward and the sprite is scaled to the exact size.
const LIGHT_SPRITES = new Map(), LIGHT_BUCKET = 4, LIGHT_CACHE_MAX = 512;
function lightSprite(rgb, r) {
  const cr = Math.round(rgb[0]) & 255, cg = Math.round(rgb[1]) & 255, cb = Math.round(rgb[2]) & 255;
  const rb = Math.max(LIGHT_BUCKET, Math.ceil(r / LIGHT_BUCKET) * LIGHT_BUCKET), key = ((cr << 16) | (cg << 8) | cb) * 4096 + rb;
  let c = LIGHT_SPRITES.get(key);
  if (!c) {
    if (LIGHT_SPRITES.size >= LIGHT_CACHE_MAX) LIGHT_SPRITES.clear();
    c = document.createElement('canvas'); c.width = c.height = rb * 2;
    const x = c.getContext('2d'), gr = x.createRadialGradient(rb, rb, 0, rb, rb, rb), col = [cr, cg, cb];
    gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(0.5, rgba(col, 0.45)); gr.addColorStop(1, rgba(col, 0));
    x.fillStyle = gr; x.fillRect(0, 0, rb * 2, rb * 2); LIGHT_SPRITES.set(key, c);
  }
  return c;
}
function light(x, y, r, rgb, k = 1) {
  x /= 2; y /= 2; r /= 2;
  if (!(r > 0) || !(k > 0)) return;
  if (x + r <= 0 || y + r <= 0 || x - r >= LCV.width || y - r >= LCV.height) return;
  if (k > 1) {   // over-bright (chest reveal): alpha above 1 only saturates the centre stop, so keep the exact gradient
    const gr = lg.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(rgb, k)); gr.addColorStop(0.5, rgba(rgb, k * 0.45)); gr.addColorStop(1, rgba(rgb, 0));
    lg.fillStyle = gr; lg.fillRect(x - r, y - r, r * 2, r * 2); return;
  }
  lg.globalAlpha = k; lg.drawImage(lightSprite(rgb, r), x - r, y - r, r * 2, r * 2); lg.globalAlpha = 1;
}
const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const SHOT_LIGHT = { bolt: [120, 180, 255], arrow: [220, 200, 160], wave: [190, 130, 255], fire: [255, 130, 40], spore: [190, 90, 220],
  goo: [180, 90, 224], leaf: [120, 220, 90], bone: [200, 180, 140] };
const BOSS_LIGHT = { boss: [255, 60, 80], treant: [140, 255, 90], demon: [255, 110, 40] };

// ---------------- pooled y-sorted draw list (reused every frame; entries are {y, kind, a, b})
const DK_CHEST = 1, DK_PICKUP = 2, DK_ENEMY = 3, DK_MOUND = 4, DK_MINION = 5, DK_ACTOR_MINION = 6, DK_PLAYER = 7, DK_COOP_PLAYER = 8,
  DK_ICE = 9, DK_TOWN_PROP = 10, DK_COOP_TOWN_ACTOR = 11;
const DRAW_LIST = [], DRAW_POOL = [];
let drawListLen = 0;
const drawListOrder = (a, b) => a.y - b.y;
function drawListBegin() { drawListLen = 0; }
function drawListAdd(y, kind, a, b) {
  const e = DRAW_POOL[drawListLen] || (DRAW_POOL[drawListLen] = { y: 0, kind: 0, a: null, b: null });
  e.y = y; e.kind = kind; e.a = a; e.b = b; DRAW_LIST[drawListLen++] = e;
}
function drawListEntry(e, time) {
  const a = e.a;
  switch (e.kind) {
    case DK_CHEST: { const [ox, oy, sq] = chestPose(a); drawChest(g, a, ox, oy, sq); break; }
    case DK_PICKUP: drawPickup(a, time); break;
    case DK_ENEMY: drawEnemy(a, time); break;
    case DK_MOUND: drawMound(a, time); break;
    case DK_MINION: drawMinion(a, time); break;
    case DK_ACTOR_MINION: drawMinion(a, time, e.b.context.player, e.b.context.eq.weapon); break;
    case DK_PLAYER: drawPlayer(a, time); break;
    case DK_COOP_PLAYER: coopRuntimeDrawPlayer(a, time); break;
    case DK_ICE: drawIceBlock(a, time); break;
    case DK_TOWN_PROP: drawTownProp(a, time); break;
    case DK_COOP_TOWN_ACTOR: coopTownDrawActor(a, time); break;
  }
}
function drawListFlush(time) {
  DRAW_LIST.length = drawListLen; DRAW_LIST.sort(drawListOrder);       // Array#sort is stable: equal y keeps insertion order
  for (let i = 0; i < drawListLen; i++) { const e = DRAW_LIST[i]; drawListEntry(e, time); e.a = e.b = null; }
}
function renderWorld(time) {
  if (G.mode === 'title') {
    titleScenePaint(time); return;
  }
  const R = typeof coopRuntimeVisibleRoom === 'function' ? coopRuntimeVisibleRoom() : G.room, p = G.player;
  const [cameraX, cameraY] = worldCamera(R, p);
  const sx = cameraX + (G.shake > 0.3 ? Math.round(rnd(-G.shake, G.shake)) : 0), sy = cameraY + (G.shake > 0.3 ? Math.round(rnd(-G.shake, G.shake) * 0.6) : 0);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#07040a'; g.fillRect(0, 0, LW, LH);
  g.setTransform(1, 0, 0, 1, sx, sy + OY);
  g.drawImage(R.canvas, 0, 0);
  drawHazards(R, time);
  if (R.locked) for (const d in R.doors) for (const [tx, ty] of DOOR_TILES[d]) {
    const x = tx * TS, y = ty * TS;
    for (let i = 1; i < 16; i += 4) (d === 'n' || d === 's') ? px(x + i, y, 2, TS, '#6a6478') : px(x, y + i, TS, 2, '#6a6478');
    (d === 'n' || d === 's') ? px(x, y + 7, TS, 2, '#4a4458') : px(x + 7, y, 2, TS, '#4a4458');
  }
  if (R.stairs) { R.stairs.portal ? drawPortal(R.stairs, time) : drawSpr(g, SPR.stairs, R.stairs.x, R.stairs.y + 5); }
  if (R.shop) drawShop(R, time);
  if (R.altar) drawAltar(R.altar, time);
  if (R.fountain) drawFountain(R.fountain, time);
  if (R.shrine) drawShrine(R.shrine, time);
  mechCall('draw', time);
  const town = R.type === 'town';
  if (town) drawTownFloor(time);
  for (const f of G.flames) drawFloorFire(f, time);
  for (const w of G.warns) drawWarn(w, time);
  // y-sorted drawables: pooled entries in a module-level list, no per-frame closures/arrays
  drawListBegin();
  for (const c of G.chests) drawListAdd(c.y, DK_CHEST, c);
  for (const c of G.pickups) if (coopRuntimeFxVisible(c, true)) drawListAdd(c.y, DK_PICKUP, c);
  for (const e of G.enemies) drawListAdd(e.y + (e.fly ? 6 : 0), e.hidden ? DK_MOUND : DK_ENEMY, e);
  const party = typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive() ? coopRuntimeActors() : null;
  if (party) for (const a of party) for (const m of a.context.minions || []) drawListAdd(m.y + 4, DK_ACTOR_MINION, m, a);
  else for (const m of G.minions || []) drawListAdd(m.y + 4, DK_MINION, m);
  if (town) townDrawables(time);
  if (town && typeof coopTownDrawables === 'function') coopTownDrawables(time);
  if (party) for (const a of party) drawListAdd(a.context.player.y, DK_COOP_PLAYER, a);
  else drawListAdd(p.y, DK_PLAYER, p);
  if (p.stun > 0) drawListAdd(p.y + 0.1, DK_ICE, p);
  drawListFlush(time);
  for (const s of G.shots) drawShot(s);
  for (const q of G.parts) if (!q.add && coopRuntimeFxVisible(q)) { g.globalAlpha = clamp(q.life / q.max * 1.5); px(q.x, q.y, q.size, q.size, q.col); }
  g.globalAlpha = 1;
  // ---------------- lighting
  lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over';
  lg.fillStyle = town ? 'rgb(176,160,190)' : R.godDark ? 'rgb(30,22,44)' : mechCall('amb') || chap().amb; lg.fillRect(0, 0, LW / 2, LH / 2);   // dark rooms override ambient
  lg.globalCompositeOperation = 'lighter';
  const ox = sx, oy = sy + OY;
  for (const t of R.torches) light(t.x + ox, t.y + oy, 112 + Math.sin(time * 9 + t.ph) * 5 + Math.sin(time * 23 + t.ph) * 3, [255, 160, 80], 0.85);
  for (const m of G.minions || []) light(m.x + ox, m.y - 8 + oy, 26, MINION_LIGHT[m.kind] || [180, 140, 255], 0.4);
  light(p.x + ox, p.y - 6 + oy, 90, [160, 150, 180], 0.7);
  if (party) for (const a of party) if (a.context.player !== p && !a.downed) light(a.context.player.x + ox, a.context.player.y - 6 + oy, 75, [160, 150, 180], 0.55);
  if (town) townLights(ox, oy, time);
  for (const h of R.hz) if (h.v === 3 && (h.x / TS + h.y / TS) % 2 === 0) light(h.x + 8 + ox, h.y + 8 + oy, 40, [255, 110, 40], 0.4 + 0.08 * Math.sin(time * 3 + h.x));
  for (const c of G.chests) if (!c.opened) light(c.x + ox, c.y - 6 + oy, 34, TIERS[c.tier].rgb, 0.6);
  if (G.cine) { const C = G.cine, k = C.opened ? 1.25 : 0.5 + clamp(C.t / C_SHAKE) * 0.6;
    light(C.c.x + ox, C.c.y - 14 + oy, C.opened ? 170 : 90, mixRGB(TIERS[C.shown].rgb, [255, 255, 255], 0.3), k); }
  for (const s of G.shots) light(s.x + ox, s.y + oy, s.friendly ? 34 : 20, SHOT_LIGHT[s.kind] || SHOT_LIGHT.bone, 0.5);
  for (const f of G.flames) if (!(f.kind === 'tar' && !f.lit)) light(f.x + ox, f.y + oy, 30, f.kind === 'wall' ? [150, 210, 255] : f.kind === 'shock' ? [255, 240, 140] : f.spore ? [120, 230, 90] : f.ice ? [140, 200, 255] : [255, 120, 40], (f.ice || f.spore ? 0.3 : 0.5) * clamp(f.life));
  for (const w of G.warns) light(w.x + ox, w.y + oy, w.r * 2.4, w.col, 0.35 * (1 - w.t / w.max));
  if (R.stairs) light(R.stairs.x + ox, R.stairs.y + oy, R.stairs.portal ? 70 : 50, R.stairs.portal ? [200, 120, 255] : [110, 160, 255], 0.6);
  if (R.shop) { light(R.stall.cx + ox, 46 + oy, 110, [255, 200, 130], 0.55); for (const s of R.shop) if (!s.sold) light(s.x + ox, 56 + oy, 26, TIERS[s.item.tier].rgb, 0.45); }
  if (R.altar) light(R.altar.x + ox, R.altar.y - 8 + oy, R.altar.used ? 30 : 60, R.altar.used ? [120, 60, 60] : [255, 50, 70], 0.55);
  if (R.shrine) light(R.shrine.x + ox, R.shrine.y - 18 + oy, 74 + Math.sin(time * 2) * 4, [255, 210, 110], 0.6);
  if (R.fountain) light(R.fountain.x + ox, R.fountain.y - 6 + oy, 60, R.fountain.used ? [80, 90, 120] : [90, 180, 255], 0.55);
  for (const e of G.enemies) if (EDEF[e.kind].glow) light(e.x + ox, e.y - 6 + oy, 30, EDEF[e.kind].glow, 0.35);
    else if (BOSS_LIGHT[e.kind]) light(e.x + ox, e.y - 14 + oy, 64, BOSS_LIGHT[e.kind], 0.35);
    else if (e.kind === 'imp' || e.kind === 'firebat' || e.kind === 'colossus') light(e.x + ox, e.y - 6 + oy, 30, [255, 120, 40], 0.35);
  mechCall('light', ox, oy, time);
  if (G.flash > 0) { lg.fillStyle = rgba([255, 255, 255], G.flash * 2); lg.fillRect(0, 0, LW / 2, LH / 2); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.imageSmoothingEnabled = false;
  g.drawImage(LCV, 0, 0, LW, LH);
  // ---------------- emissive / additive pass
  g.globalCompositeOperation = 'lighter'; g.setTransform(1, 0, 0, 1, ox, oy);
  for (const t of R.torches) drawFlame(t, time);
  if (town) townEmissive(time);
  mechCall('emissive', time);
  if (typeof gearFxEmissive === 'function') gearFxEmissive(time);
  for (const q of G.parts) if (q.add && coopRuntimeFxVisible(q)) { g.globalAlpha = clamp(q.life / q.max * 1.5); px(q.x, q.y, q.size, q.size, q.col); }
  g.globalAlpha = 1;
  for (const s of G.shots) if (s.friendly || s.kind === 'fire') drawShot(s, true);
  drawRings(); drawBolts(); drawOrbit(p, time);
  if (party) for (const a of party) if (a.context.player !== p && !a.downed) drawOrbit(a.context.player, time);
  if (p.shieldUp) { g.globalAlpha = 0.35 + 0.15 * Math.sin(time * 5); ellipse(p.x, p.y - 7, 9, 10, '#ffe080'); g.globalAlpha = 1; }
  g.setTransform(1, 0, 0, 1, ox, sy);
  g.globalCompositeOperation = 'source-over';
  drawChestFX(g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(VIG, 0, 0);
  if (G.flash > 0) { g.fillStyle = rgba([255, 250, 230], clamp(G.flash * 2.4)); g.fillRect(0, 0, LW, LH); }
  if (G.hurtFlash > 0) { g.fillStyle = rgba([200, 20, 40], G.hurtFlash); g.fillRect(0, 0, LW, LH); }
  if (G.fade > 0) { g.fillStyle = rgba([7, 4, 10], clamp(G.fade)); g.fillRect(0, 0, LW, LH); }
  G.camOff = [sx, sy];
}
function ellipse(x, y, rx, ry, col, step = 0) {          // 1px ellipse outline
  g.fillStyle = col; const n = Math.max(12, Math.round((rx + ry) * 1.6));
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + step; g.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), 1, 1); }
}
function drawHazards(R, time) {
  if (!R.hz.length) return;
  const ph = spikePhase(R), up = spikesUp(R), warnS = !up && ph > SPIKE_CYC - SPIKE_UP - 0.45;
  for (const h of R.hz) {
    if (h.v === 3) {                                         // lava: slow bubbling highlights
      for (let i = 0; i < 2; i++) { const k = (time * 0.6 + hash2(h.x + i, h.y)) % 1, bx = h.x + 3 + Math.floor(hash2(h.y, h.x + i * 7) * 10);
        g.globalAlpha = Math.sin(k * Math.PI); px(bx, h.y + 4 + Math.floor(k * 7), 2, 1, '#ffd060'); }
      g.globalAlpha = 1; continue;
    }
    for (const [a, b] of [[3, 3], [9, 3], [6, 8], [3, 12], [11, 11]]) {
      const x = h.x + a, y = h.y + b;
      if (up) { px(x, y - 3, 2, 4, '#c8ccd8'); px(x, y - 3, 1, 1, '#ffffff'); px(x + 1, y - 1, 1, 2, '#6a6e80'); }
      else if (warnS && Math.floor(time * 12) % 2) px(x, y - 1, 2, 2, '#8a8e9e');
    }
  }
}
function drawWarn(w, time) {                                 // telegraph: filling ring, red ground
  if (w.shape && w.shape !== 'circle') { drawShapedWarn(w, time); return; }
  const k = 1 - w.t / w.max, sy = w.encounter ? 1 : .6;
  g.globalAlpha = 0.18 + 0.2 * k; g.fillStyle = rgba(w.col);
  for (let y = -w.r * sy; y <= w.r * sy; y += 1) { const hw = Math.sqrt(Math.max(0, 1 - (y / (w.r * sy)) ** 2)) * w.r * k;
    g.fillRect(Math.round(w.x - hw), Math.round(w.y + y), Math.round(hw * 2), 1); }
  g.globalAlpha = 0.6 + 0.4 * Math.sin(time * 30); ellipse(w.x, w.y, w.r, w.r * sy, rgba(w.col)); g.globalAlpha = 1;
}
// Shaped telegraphs (enemy-attacks.js): translucent fill that grows with the timer, pulsing coloured edge and a
// light outer rim so lines and cones stay readable on a phone. Plain data only, so guests draw the same thing.
function shapedWarnPath(w, grow) {
  g.beginPath();
  if (w.shape === 'circle') { g.arc(w.x, w.y, w.r * grow, 0, Math.PI * 2); }
  else if (w.shape === 'line' || w.shape === 'rect') {
    const c = Math.cos(w.a), s = Math.sin(w.a), h = w.w / 2;
    const u0 = w.shape === 'line' ? 0 : -w.len / 2, u1 = u0 + w.len * grow;
    const pt = (u, v) => [w.x + c * u - s * v, w.y + s * u + c * v];
    for (const [u, v] of [[u0, -h], [u1, -h], [u1, h], [u0, h]]) { const [x, y] = pt(u, v); g.lineTo(x, y); }
    g.closePath();
  } else if (w.shape === 'cone') {
    g.moveTo(w.x, w.y); g.arc(w.x, w.y, Math.max(1, w.len * grow), w.a - w.arc, w.a + w.arc); g.closePath();
  } else if (w.shape === 'donut') {
    const r0 = w.r0, r1 = r0 + (w.r1 - r0) * grow, sy = w.encounter ? 1 : .6;
    g.ellipse(w.x, w.y, r1, r1 * sy, 0, 0, Math.PI * 2); g.ellipse(w.x, w.y, r0, r0 * sy, 0, 0, Math.PI * 2, true);
  }
}
function drawShapedWarn(w, time) {
  const k = clamp(1 - w.t / w.max), locked = w.track && w.t <= w.track;
  g.save();
  g.globalAlpha = .16 + .22 * k; g.fillStyle = rgba(w.col); shapedWarnPath(w, w.shape === 'donut' || w.shape === 'cone' ? 1 : k); g.fill('evenodd');
  shapedWarnPath(w, 1);
  g.globalAlpha = .55 + .45 * Math.abs(Math.sin(time * (locked ? 40 : 24))); g.strokeStyle = rgba(w.col); g.lineWidth = locked ? 2 : 1.5; g.stroke();
  g.globalAlpha = .35 + .4 * k; g.strokeStyle = locked ? '#ffffff' : '#ffe6c8'; g.lineWidth = .75; g.stroke();
  g.restore();
}
function drawMound(e, time) {                                // burrowed enemy: moving bulge of earth (cannot be hit)
  const w = Math.max(5, e.hw), b = Math.round(Math.sin(time * 14 + e.anim) * 0.6);
  shadow(e.x, e.y, w); px(e.x - w, e.y - 2 + b, w * 2, 3, '#4a3a2a'); px(e.x - w + 2, e.y - 3 + b, w * 2 - 4, 1, '#6a5a40');
  if (Math.floor(time * 10 + e.x) % 3 === 0) px(e.x + rnd(-w, w), e.y - 4, 1, 1, '#8a7a5a');
}
function drawIceBlock(p, time) {                             // player frozen solid
  const x = Math.round(p.x), y = Math.round(p.y);
  g.globalAlpha = 0.55; px(x - 7, y - 17, 14, 18, '#a8e0ff'); g.globalAlpha = 0.8;
  px(x - 7, y - 17, 14, 1, '#ffffff'); px(x - 7, y - 17, 1, 18, '#e8f8ff'); px(x + 6, y - 17, 1, 18, '#6aa8d8'); px(x - 7, y, 14, 1, '#6aa8d8');
  px(x - 4, y - 14, 2, 5, '#ffffff'); g.globalAlpha = 1;
}
function drawGroundArea(f, time) {                           // tar / shock / sweeping wall (enemy-attacks.js)
  const k = clamp(f.life * 1.5);
  if (f.kind === 'wall') {
    const c = Math.cos(f.a), s = Math.sin(f.a), arm = (v0, v1, thick, col, alpha) => {
      g.globalAlpha = alpha; g.fillStyle = col; g.beginPath();
      for (const [u, v] of [[-thick, v0], [thick, v0], [thick, v1], [-thick, v1]]) g.lineTo(f.x + c * u - s * v, f.y + s * u + c * v);
      g.closePath(); g.fill(); };
    const h = f.len / 2, armed = f.delay > 0, spans = [];
    let from = -h;
    for (const c of (f.gw > 0 ? [f.gc, f.gc2] : []).filter(c => c !== undefined && c !== null).sort((a, b) => a - b)) {
      spans.push([from, Math.max(from, c - f.gw / 2)]); from = Math.min(h, c + f.gw / 2); }
    spans.push([from, h]);
    for (const [v0, v1] of spans) if (v1 > v0) {
      if (armed) { arm(v0, v1, 5, '#ffffff', .25 + .25 * Math.abs(Math.sin(time * 20))); continue; }
      arm(v0, v1, 5, f.col || '#9ad8ff', .55); arm(v0, v1, 2, '#ffffff', .8);
    }
    if (armed) { g.globalAlpha = .5; for (let i = 1; i <= 3; i++) px(f.x + c * i * 10 - 1, f.y + s * i * 10 - 1, 2, 2, '#ffffff'); }  // direction pips
    g.globalAlpha = 1; return;
  }
  if (f.kind === 'tar') {
    g.globalAlpha = .55 * k; ellipse(f.x, f.y, f.r, f.r * .55, f.lit ? '#ff8a30' : '#2a1a10');
    g.globalAlpha = .45 * k; g.fillStyle = f.lit ? '#a8401a' : '#1a120c'; g.beginPath(); g.ellipse(f.x, f.y, f.r - 1, (f.r - 1) * .55, 0, 0, Math.PI * 2); g.fill();
    if (!f.lit && f.ignite < .5 && Math.floor(time * 16) % 2) { g.globalAlpha = .8; ellipse(f.x, f.y, f.r, f.r * .55, '#ffd060'); }
    if (f.lit) for (let i = 0; i < 4; i++) { const a = i * 1.6 + time * 2, x = f.x + Math.cos(a) * f.r * .5, y = f.y + Math.sin(a) * f.r * .25;
      g.globalAlpha = k; px(x - 1, y - 3 - Math.floor(time * 14 + i) % 3, 2, 3, i % 2 ? '#ff8a30' : '#ffd060'); }
    g.globalAlpha = 1; return;
  }
  if (f.kind === 'shock') {
    const armed = f.delay > 0;
    g.globalAlpha = armed ? .3 + .3 * Math.abs(Math.sin(time * 18)) : .5 * k; ellipse(f.x, f.y, f.r, f.r * .55, armed ? '#ffffff' : '#ffe060');
    if (!armed) for (let i = 0; i < 3; i++) { const a = hash2(i, Math.floor(time * 12)) * 6.28, r = f.r * .7;
      g.globalAlpha = k; px(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * .55, 1, 2, '#ffffff'); }
    g.globalAlpha = 1;
  }
}
function drawFloorFire(f, time) {
  if (f.kind) { drawGroundArea(f, time); return; }
  const k = clamp(f.life * 1.5);
  if (f.spore) {                                              // poison cloud: drifting green puffs
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + time * 0.8, r = f.r * (0.3 + 0.6 * hash2(i, f.x));
      g.globalAlpha = 0.28 * k; px(f.x + Math.cos(a) * r - 2, f.y + Math.sin(a) * r * 0.5 - 5 - (time * 6 + i * 3) % 6, 4, 3, i % 2 ? '#7adc5a' : '#b0f090'); }
    g.globalAlpha = 0.2 * k; ellipse(f.x, f.y, f.r, f.r * 0.5, '#6adc5a'); g.globalAlpha = 1; return;
  }
  if (f.ice) {                                                // frost patch: pale ellipse with glints
    g.globalAlpha = 0.35 * k; ellipse(f.x, f.y, f.r, f.r * 0.55, '#c8f0ff');
    g.globalAlpha = 0.18 * k; for (let y = -f.r * 0.5; y <= f.r * 0.5; y += 2) { const hw = Math.sqrt(Math.max(0, 1 - (y / (f.r * 0.55)) ** 2)) * f.r;
      g.fillStyle = '#e8f8ff'; g.fillRect(Math.round(f.x - hw), Math.round(f.y + y), Math.round(hw * 2), 1); }
    g.globalAlpha = k; for (let i = 0; i < 3; i++) if (Math.floor(time * 3 + i * 1.7 + f.x) % 3 === 0) px(f.x + Math.cos(i * 2.1) * f.r * 0.6, f.y + Math.sin(i * 2.1) * f.r * 0.3, 1, 1, '#ffffff');
    g.globalAlpha = 1; return;
  }
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + time * 2, r = f.r * (0.4 + 0.5 * hash2(i, f.x));
    const x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r * 0.5, fl = Math.floor(time * 14 + i) % 3;
    g.globalAlpha = k; px(x - 1, y - 2 - fl, 2, 3 + fl, i % 2 ? '#ff8a30' : '#ffd060'); }
  g.globalAlpha = 1;
}
function drawRings() {
  for (const r of G.rings) if (coopRuntimeFxVisible(r)) { const u = r.t / r.life, rad = r.max * easeOutCubic(u);
    if (r.encounter) {
      g.save(); shapedWarnPath(r, 1); g.globalAlpha = .3 * (1 - u); g.fillStyle = rgba(r.col); g.fill('evenodd');
      g.globalAlpha = 1 - u; g.strokeStyle = '#ffe5c8'; g.lineWidth = 2; g.stroke(); g.restore(); continue;
    }
    if (r.chargeStyle) { drawChargedImpact(r, u); continue; }
    g.globalAlpha = 1 - u; ellipse(r.x, r.y, rad, rad * 0.6, rgba(r.col)); ellipse(r.x, r.y, rad - 1, rad * 0.6 - 1, rgba(r.col, 0.5)); }
  g.globalAlpha = 1;
}
function drawBolts() {
  for (const b of G.bolts) if (coopRuntimeFxVisible(b)) {
    const n = 7, a = clamp(b.life / 0.18);
    let x0 = b.x0, y0 = b.y0;
    for (let i = 1; i <= n; i++) { const t = i / n, x1 = lerp(b.x0, b.x1, t) + (i < n ? rnd(-4, 4) : 0), y1 = lerp(b.y0, b.y1, t) + (i < n ? rnd(-4, 4) : 0);
      const st = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let j = 0; j <= st; j++) { g.globalAlpha = a; px(lerp(x0, x1, j / st), lerp(y0, y1, j / st), 1, 1, j % 3 ? '#ffe060' : '#ffffff'); }
      x0 = x1; y0 = y1; }
  }
  g.globalAlpha = 1;
}
function drawOrbit(p, time) {
  if (!p.orbitN) return;
  for (let i = 0; i < p.orbitN; i++) {
    const a = p.orbA + i * Math.PI * 2 / p.orbitN, x = p.x + Math.cos(a) * 18, y = p.y - 6 + Math.sin(a) * 12, s = a + Math.PI / 2;
    for (let j = -3; j <= 3; j++) px(x + Math.cos(s) * j, y + Math.sin(s) * j, 1, 1, Math.abs(j) < 2 ? '#ffffff' : '#a0b0d0');
  }
}
function drawPortal(s, time) {
  for (let i = 0; i < 3; i++) ellipse(s.x, s.y - 2, 13 - i * 3, 7 - i * 1.6, ['#5a2a90', '#b45aff', '#f0d0ff'][i], time * (2 + i));
  px(s.x - 2, s.y - 3, 4, 2, '#ffffff');
  if (spawnP(0.3)) G.parts.push({ x: s.x + rnd(-10, 10), y: s.y + rnd(-4, 2), vx: 0, vy: rnd(-24, -10), life: 0.6, max: 0.6, col: '#c8a0ff', size: 1, grav: 0, add: true });
}
function drawAltar(A, time) {
  const x = A.x, y = A.y;
  shadow(x, y + 4, 9);
  px(x - 9, y - 6, 18, 10, '#3a2a30'); px(x - 9, y - 6, 18, 2, '#5a4048'); px(x - 7, y - 2, 14, 1, '#2a1a20');
  px(x - 3, y - 1, 6, 3, A.used ? '#4a2020' : '#a81828'); px(x - 2, y - 1, 2, 1, A.used ? '#5a2a2a' : '#ff6070');
  if (A.used) return;
  const ic = itemIcon(A.item); drawSpr(g, ic, x, y - 9 + Math.round(Math.sin(time * 3) * 1.2));
  if (spawnP(0.2)) G.parts.push({ x: x + rnd(-6, 6), y: y - 6, vx: 0, vy: rnd(-20, -8), life: 0.5, max: 0.5, col: '#ff4058', size: 1, grav: 0, add: true });
}
function drawFountain(F, time) {
  const x = F.x, y = F.y;
  shadow(x, y + 4, 12);
  px(x - 12, y - 4, 24, 8, '#5a5a6a'); px(x - 12, y - 4, 24, 2, '#8a8a9a'); px(x - 10, y - 2, 20, 4, F.used ? '#2a2a38' : '#2a6ac0');
  if (!F.used) { for (let i = 0; i < 4; i++) px(x - 8 + ((i * 5 + Math.floor(time * 6)) % 16), y - 1, 2, 1, '#a0e0ff');
    px(x - 1, y - 12, 2, 9, '#8a8a9a'); px(x - 3, y - 13, 6, 2, '#a0a0b0');
    for (let i = 0; i < 3; i++) { const k = (time * 1.5 + i / 3) % 1; px(x - 3 + i * 3, y - 13 + k * 10, 1, 2, '#c0f0ff'); } }
  else { px(x - 1, y - 12, 2, 9, '#6a6a7a'); px(x - 3, y - 13, 6, 2, '#7a7a8a'); }
}
function shadow(x, y, w) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(Math.round(x - w), Math.round(y - 1), w * 2, 2);
  g.fillRect(Math.round(x - w + 1), Math.round(y - 2), w * 2 - 2, 4); }
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const WLEN = { sword: 12, axe: 11, dagger: 6, spear: 17, hammer: 11, staff: 12, bow: 0 };
// held weapon drawn as a pixel line from the hand along `ang`
const WEAPON_DRAW = {};                                      // extra held-weapon looks: kind -> fn(hx, hy, ang, cols, sc)
function drawWeapon(kind, hx, hy, ang, cols, sc = 1) {
  if (WEAPON_DRAW[kind]) return WEAPON_DRAW[kind](hx, hy, ang, cols, sc);
  const [main, dark, hl] = cols, c = Math.cos(ang), s = Math.sin(ang), pc = Math.cos(ang + Math.PI / 2), ps = Math.sin(ang + Math.PI / 2);
  if (kind === 'bow') {
    for (let a = -1.25; a <= 1.25; a += 0.18) px(hx + Math.cos(ang + a) * 6 * sc, hy + Math.sin(ang + a) * 6 * sc, 1, 1, a > -0.3 && a < 0.3 ? hl : dark);
    const ex = Math.cos(ang + 1.25) * 6 * sc, ey = Math.sin(ang + 1.25) * 6 * sc, fx = Math.cos(ang - 1.25) * 6 * sc, fy = Math.sin(ang - 1.25) * 6 * sc;
    for (let t = 0; t <= 1; t += 0.12) px(hx + lerp(ex, fx, t) - c * 1.5, hy + lerp(ey, fy, t) - s * 1.5, 1, 1, '#e8e0d0');
    return;
  }
  const L = Math.round(WLEN[kind] * sc), grip = kind === 'spear' || kind === 'staff' || kind === 'hammer' || kind === 'axe' ? L - 3 : 2;
  for (let i = 0; i < L; i++) px(hx + c * i, hy + s * i, 1, 1, i < grip ? dark : main);
  if (kind === 'sword' || kind === 'dagger') for (let j = -1; j <= 1; j++) px(hx + c * 2 + pc * j, hy + s * 2 + ps * j, 1, 1, dark);
  if (kind === 'axe') for (let i = L - 4; i < L; i++) for (let j = 1; j <= 3; j++) px(hx + c * i + pc * j, hy + s * i + ps * j, 1, 1, j === 3 ? hl : main);
  if (kind === 'hammer') for (let i = L - 3; i < L; i++) for (let j = -3; j <= 3; j++) px(hx + c * i + pc * j, hy + s * i + ps * j, 1, 1, i === L - 1 ? hl : main);
  if (kind === 'spear') { px(hx + c * L, hy + s * L, 1, 1, hl); for (const j of [-1, 1]) px(hx + c * (L - 2) + pc * j, hy + s * (L - 2) + ps * j, 1, 1, main); }
  if (kind === 'staff') { px(hx + c * L - 1, hy + s * L - 1, 3, 3, main); px(hx + c * L, hy + s * L - 1, 1, 1, hl); }
}
function drawPlayer(p, time) {
  if (drawChargedPlayer(p, time)) return;
  const flip = Math.cos(p.face) < -0.05, sc = p.scale, w = p.wpn, it = G.eq.weapon;
  shadow(p.x, p.y, 5);
  if (p.inv > 0 && p.rolling <= 0 && Math.floor(time * 18) % 2) return;
  const spr = heroAppearance(p);
  if (p.rolling > 0) {
    for (let i = 1; i <= 2; i++) drawSpr(g, spr, p.x - p.rdx * i * 5, p.y - p.rdy * i * 5, { flip, sx: 1.15 * sc, sy: 0.7 * sc, alpha: 0.25 });
    drawSpr(g, spr, p.x, p.y, { flip, sx: 1.15 * sc, sy: 0.7 * sc }); return;
  }
  drawHeroCape(p, time, flip);
  const bob = p.moving ? Math.abs(Math.sin(p.walk * 16)) * -1 : 0;
  const cols = p.blade === 'dawn' ? ['#fff6d0', '#ecba40', '#ffffff'] : [it.icon[1], it.icon[2], it.icon[3]];
  const trail = hexRGB(p.blade === 'dawn' ? '#ffe68c' : w.ranged ? '#ffffff' : mixHex(cols[0], '#ffffff'));
  const cx = p.x, cy = p.y - 7 * sc;
  if (p.swing > 0 && !w.ranged) {
    const u = 1 - p.swing / p.swingT, r = Math.max(8, p.reach * sc - 3);
    if (w.thrust) {                                            // spear: forward stab with a streak
      const k = Math.sin(u * Math.PI), a = p.swingAng, off = k * 12;
      for (let i = 4; i < r; i++) { g.fillStyle = rgba(trail, 0.15 + 0.5 * (i / r) * k); g.fillRect(Math.round(cx + Math.cos(a) * i), Math.round(cy + Math.sin(a) * i * 0.85), 1, 1); }
      drawSpr(g, spr, p.x, p.y + bob, { flip, sx: sc, sy: sc });
      drawEquippedWeapon(it, w.kind, cx + Math.cos(a) * off, cy + Math.sin(a) * off * 0.85, a, cols, sc);
      return;
    }
    const half = Math.min(w.arc, 1.3) + (w.quake ? 1.8 : 0), dir = w.kind === 'dagger' ? p.alt : 1;
    const a0 = p.swingAng - half * dir, span = 2 * half * easeOutCubic(u), a1 = a0 + span * dir;
    for (let t = 0; t < span; t += 0.07) {                     // slash arc
      const a = a0 + t * dir, k = t / (2 * half);
      g.fillStyle = rgba(trail, 0.25 + 0.6 * k * (1 - u * 0.6));
      g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.85), 2, 2);
      g.fillRect(Math.round(cx + Math.cos(a) * (r - 3)), Math.round(cy + Math.sin(a) * (r - 3) * 0.85), 1, 1);
    }
    drawSpr(g, spr, p.x, p.y + bob, { flip, sx: sc, sy: sc });
    drawEquippedWeapon(it, w.kind, cx + Math.cos(a1) * 2, cy + Math.sin(a1) * 2, a1, cols, sc);
  } else {
    const dir = flip ? -1 : 1, hx = cx + 4 * dir, hy = p.y - 5;
    const aim = p.swing > 0 || (w.ranged && G.enemies.length);
    const ang = w.ranged ? (aim ? p.face : -Math.PI / 2 + dir * 0.35) : -Math.PI / 2 + dir * 0.12;
    const back = Math.sin(p.face) < -0.5;                    // facing up: weapon drawn behind
    const recoil = p.swing > 0 ? -2 * (p.swing / p.swingT) : 0;
    const draw = () => drawEquippedWeapon(it, w.kind, hx + Math.cos(ang) * recoil, hy + Math.sin(ang) * recoil, ang, cols, sc);
    if (back) draw();
    drawSpr(g, spr, p.x, p.y + bob, { flip, sx: sc, sy: sc });
    if (!back) draw();
  }
}
const mixHex = (a, b, t = 0.5) => { const m = mixRGB(hexRGB(a), hexRGB(b), t); return '#' + m.map(v => v.toString(16).padStart(2, '0')).join(''); };
function drawEnemy(e, time) {
  const D = EDEF[e.kind], s = D.spr(e), sc = D.artScale || e.sc || 1;
  if (e.spawn > 0) {
    const k = clamp(e.spawn / 0.6);
    for (let i = 0; i < 10; i++) { const a = i * 0.628 + time * 4, r = (4 + 10 * k) * sc;
      px(e.x + Math.cos(a) * r, e.y - 3 + Math.sin(a) * r * 0.5, 1, 1, i % 2 ? '#b45aff' : '#ff4058'); }
    drawSpr(g, s, e.x, e.y, { alpha: clamp(1 - k), flip: e.face, sx: sc, sy: sc }); return;
  }
  const fy = e.fly ? 7 + Math.sin(e.anim * 6) * 2 : 0;
  shadow(e.x, e.y, Math.max(3, e.hw - (e.z > 2 ? 2 : 0)));
  drawEnemyCombatTell(e, time, s.h * sc + (e.fly ? 9 : 0));
  let sx = 1, sy = 1;
  if (e.kind === 'slime' || e.kind === 'elite') {
    if (e.state === 0) { sx = 1 + 0.08 * Math.sin(e.anim * 7); sy = 2 - sx; } else { sx = 0.88; sy = 1.14; }
  }
  if (e.kind === 'shroom' && e.t < 0.3) { sx = 1.15; sy = 0.85; }
  if (e.kind === 'treant') { sx = 1 + 0.03 * Math.sin(e.anim * 2); sy = 2 - sx; }
  const tele = D.tele ? D.tele(e) : (D.boss && e.pat === 3 && e.tele > 0) || ((e.kind === 'golem' || e.kind === 'colossus') && e.state === 1);
  const white = e.flash > 0 || ((tele || e.contactT > 0 || e.skillT > 0) && Math.floor(time * 16) % 2 === 0);
  if (D.boss && e.enraged) { for (let i = 0; i < 2; i++) px(e.x + rnd(-8, 8), e.y - rnd(4, 22), 1, 1, '#ff4058'); }
  const y = e.y - e.z - fy, o = { flip: e.face, white, sx: sx * sc, sy: sy * sc, alpha: D.alpha };
  drawSpr(g, s, e.x, y, o);
  // status overlays: frozen (icy tint), poison (green bubbles), burn handled by particles in updDots
  if (e.frozen > 0) { drawSpr(g, s, e.x, y, { ...o, white: true, alpha: 0.45 }); g.fillStyle = 'rgba(140,220,255,0.35)';
    g.fillRect(Math.round(e.x - e.hw - 1), Math.round(y - e.h - 1), e.hw * 2 + 2, e.h + 2); }
  if (e.pstack > 0 && Math.floor(time * 6 + e.anim) % 3 === 0) px(e.x + rnd(-e.hw, e.hw), y - rnd(2, e.h), 1, 1, '#6adc5a');
  if (e.burn > 0 && spawnP(0.25)) G.parts.push({ x: e.x + rnd(-e.hw, e.hw), y: y - rnd(0, e.h), vx: 0, vy: rnd(-26, -12), life: 0.3, max: 0.3,
    col: pick(['#ff8a30', '#ffd060']), size: 1, grav: 0, add: true });
  if (D.fx) D.fx(e, time, y);                                 // per-kind extra visuals (beams, shields ...)
  if (D.elite && !D.boss && e.hp < e.max) {                   // small hp bar over elites
    const w = Math.max(14, e.hw * 2 + 4), bx = Math.round(e.x - w / 2), by = Math.round(y - e.h - 5);
    px(bx - 1, by - 1, w + 2, 3, '#100a14'); px(bx, by, Math.round(w * e.hp / e.max), 1, '#ff4058');
  }
  drawBossMechanic(e, time, y);
  if (e.affix) drawEnemyAffixes(e, time, Math.round(y - e.h - 8));    // elite affix badges (enemy-elites.js)
}
function drawPickup(c, time) {
  const y = c.y - c.z;
  shadow(c.x, c.y, c.kind === 'coin' ? 2 : 3);
  if (c.kind === 'coin') {
    const w = [2, 1, 0, 1][Math.floor(time * 8 + c.ph) % 4];
    px(c.x - w, y - 5, w * 2 + 1, 5, '#ecba40'); px(c.x - w, y - 5, 1, 1, '#fffad2');
    if (w) px(c.x + w, y - 4, 1, 4, '#9c681e');
  } else if (c.kind === 'soul') {
    const b = Math.round(Math.sin(time * 6 + c.ph) * 1.5);
    px(c.x - 1, y - 7 + b, 3, 4, '#7ad8ff'); px(c.x, y - 8 + b, 1, 6, '#c8f0ff'); px(c.x, y - 6 + b, 1, 1, '#ffffff');
  } else drawSpr(g, SPR.heart, c.x, y - 1 + Math.sin(time * 5) * 1.2);
}
const SHOT_DRAW = {};                                        // extra projectile looks registered by act files: kind -> fn(s)
function drawShot(s, emissive = false) {
  const em = s.friendly || s.kind === 'fire';
  if (em !== emissive) return;
  if (SHOT_DRAW[s.kind]) return SHOT_DRAW[s.kind](s);
  const a = Math.atan2(s.vy, s.vx), c = Math.cos(a), d = Math.sin(a);
  switch (s.kind) {
    case 'wave': { const k = clamp(s.life / 0.2);
      for (let i = -6; i <= 6; i++) { const b = a + i * 0.16, r = 5 - Math.abs(i) * 0.25;
        g.fillStyle = rgba([210, 170, 255], k * (1 - Math.abs(i) / 8)); g.fillRect(Math.round(s.x + Math.cos(b) * r), Math.round(s.y + Math.sin(b) * r), 2, 2); }
      return; }
    case 'bolt': px(s.x - 2, s.y - 2, 4, 4, '#3a7aff'); px(s.x - 1, s.y - 1, 2, 2, '#ffffff');
      for (let i = 1; i < 5; i++) { g.globalAlpha = 1 - i / 5; px(s.x - c * i * 2, s.y - d * i * 2, 2, 2, '#6aa8ff'); } g.globalAlpha = 1; return;
    case 'arrow': for (let i = -4; i <= 3; i++) px(s.x + c * i, s.y + d * i, 1, 1, i > 1 ? '#ffffff' : i < -2 ? '#ff8a8a' : '#c8b088'); return;
    case 'fire': { const f = Math.floor(s.rot) % 2;
      px(s.x - 2, s.y - 2, 4, 4, '#c03a10'); px(s.x - 1, s.y - 1 - f, 3, 3, '#ff8a30'); px(s.x, s.y - f, 1, 1, '#fff0a0');
      if (spawnP(0.3)) G.parts.push({ x: s.x, y: s.y, vx: rnd(-6, 6), vy: rnd(-14, -4), life: 0.25, max: 0.25, col: '#ff8a30', size: 1, grav: 0, add: true });
      return; }
    case 'goo': px(s.x - 1, s.y - 1, 3, 3, '#b45aff'); px(s.x - 1, s.y - 1, 1, 1, '#f4d8ff'); return;
    case 'spore': { const r = Math.floor(s.rot / 3) % 2; px(s.x - 1 - r, s.y - 1, 3 + r, 3, '#b04ad0'); px(s.x, s.y, 1, 1, '#f0e0f8'); return; }
    case 'leaf': px(s.x - c * 2, s.y - d * 2, 1, 1, '#2a6a2a'); px(s.x - 1, s.y - 1, 3, 2, '#4a9a3a'); px(s.x, s.y - 1, 1, 1, '#b0f090'); return;
  }
  const cc = Math.cos(s.rot) * 2, dd = Math.sin(s.rot) * 2;
  px(s.x - cc, s.y - dd, 1, 1, '#ddd6c0'); px(s.x, s.y, 1, 1, '#fff'); px(s.x + cc, s.y + dd, 1, 1, '#ddd6c0');
  px(s.x - cc * 1.5, s.y - dd * 1.5, 1, 1, '#ddd6c0'); px(s.x + cc * 1.5, s.y + dd * 1.5, 1, 1, '#ddd6c0');
}
function drawFlame(t, time) {
  const f = Math.floor(time * 12 + t.ph) % 3;
  px(t.x - 2, 2, 5, 3, '#c24a18'); px(t.x - 1, 1 - (f === 1 ? 1 : 0), 3, 4, '#ff8a30');
  px(t.x, 0 - f % 2, 1, 4, '#ffd060'); px(t.x, 3, 1, 1, '#fff6c0');
  if (spawnP(0.08)) G.parts.push({ x: t.x + rnd(-1, 1), y: 0, vx: rnd(-4, 4), vy: rnd(-14, -6), life: 0.6, max: 0.6, col: '#ff9a40', size: 1, grav: 0, add: true });
}
// travelling merchant: striped awning, back shelf, merchant behind a counter, wares on cloth with price tags
const MERCHANT = makeSprite(['....oooo....', '...oppppo...', '..oppppppo..', '.ooooooooo..', '..osssso....', '..oseseo....',
  '..osssso.oo.', '.oggwwggoyo.', 'ogggwwgggoo.', 'oggggggggo..', 'oyyggggyyo..', '.ogggggggo..'],
  { o: '#1a1018', p: '#5a3a8a', s: '#e0b890', e: '#201018', g: '#2a6a7a', w: '#e8e0d0', y: '#ecba40' });
function drawShop(R, time) {
  const S = R.stall, x0 = S.x0, x1 = S.x1, mx = S.cx, cy = 64;
  px(x0 + 2, S.y1 - 1, x1 - x0 - 4, 3, 'rgba(0,0,0,0.35)');
  // back shelf with sacks / jars / bolts of cloth
  px(x0 + 8, 30, x1 - x0 - 16, 22, '#3a2418'); px(x0 + 8, 30, x1 - x0 - 16, 1, '#5a3a22');
  px(x0 + 8, 40, x1 - x0 - 16, 2, '#6a4a2a'); px(x0 + 8, 50, x1 - x0 - 16, 2, '#6a4a2a');
  for (let i = 0; i < 9; i++) { const x = x0 + 14 + i * 13, k = i % 3;
    if (k === 0) { px(x, 34, 6, 6, '#8a6a3a'); px(x + 1, 33, 4, 1, '#6a4a2a'); }
    else if (k === 1) { px(x + 1, 35, 4, 5, ['#3a7ad8', '#d83a5a', '#5ac85a'][i % 3]); px(x + 2, 34, 2, 1, '#c8c8d8'); }
    else { px(x, 45, 7, 5, '#c8a868'); px(x + 2, 44, 3, 1, '#a08048'); } }
  // merchant (bobs, looks at the player)
  drawSpr(g, MERCHANT, mx, 59 + Math.round(Math.sin(time * 2.2) * 0.6), { flip: G.player.x < mx });
  // awning posts + striped canopy with scalloped edge
  for (const x of [x0 + 2, x1 - 5]) { px(x, 22, 3, cy - 14, '#5a3a22'); px(x, 22, 1, cy - 14, '#7a5a32'); }
  for (let x = x0 - 4; x < x1 + 4; x += 8) { const red = ((x - x0 + 4) >> 3) % 2 === 0;
    px(x, 16, 8, 9, red ? '#c03a3a' : '#f0e4c8'); px(x, 16, 8, 1, red ? '#e05a5a' : '#ffffff');
    px(x + 1, 25, 6, 2, red ? '#c03a3a' : '#f0e4c8'); px(x + 2, 27, 4, 1, red ? '#a02a2a' : '#d8ccb0'); }
  // hanging sign with a coin
  px(mx - 8, 27, 1, 2, '#3a2418'); px(mx + 7, 27, 1, 2, '#3a2418'); px(mx - 12, 29, 24, 8, '#6a4a2a'); px(mx - 11, 30, 22, 6, '#8a6a3a');
  drawSpr(g, SPR.coin, mx - 5, 35); px(mx, 32, 8, 1, '#3a2418'); px(mx, 34, 6, 1, '#3a2418');
  // counter: plank top, cloth runner with gold trim, front boards
  px(x0, cy - 4, x1 - x0, 5, '#8a5a32'); px(x0, cy - 4, x1 - x0, 1, '#b07a46'); px(x0, cy + 1, x1 - x0, 8, '#5a3a22');
  for (let x = x0 + 10; x < x1; x += 14) px(x, cy + 1, 1, 8, '#3a2418');
  px(x0, cy + 8, x1 - x0, 1, '#2a1810');
  px(x0 + 6, cy - 4, x1 - x0 - 12, 2, '#3a5a9a'); px(x0 + 6, cy - 2, x1 - x0 - 12, 1, '#2a4070');
  for (let x = x0 + 8; x < x1 - 6; x += 6) px(x, cy - 1, 2, 2, '#ecba40');
  // wares on stands, paper price tags pinned to the counter front
  for (const s of R.shop) {
    px(s.x - 5, cy - 6, 10, 2, '#3a2a30'); px(s.x - 4, cy - 7, 8, 1, '#5a4a50');
    if (s.sold) { px(s.x - 3, cy - 9, 6, 2, '#2a1a20'); continue; }
    const on = G.prompt && G.prompt.shop === s;
    drawSpr(g, itemIcon(s.item), s.x, cy - 8 + Math.round(Math.sin(time * 3 + s.x) * 1.2) - (on ? 2 : 0));
    const col = TIERS[s.item.tier].col;
    px(s.x - 7, cy + 2, 14, 6, on ? '#fff0c8' : '#e8dcc0'); px(s.x - 7, cy + 2, 14, 1, col); px(s.x - 7, cy + 7, 14, 1, '#8a7050');
  }
}
