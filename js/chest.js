'use strict';
// ============================================================ chests + the opening cinematic (ported from the video)
const C_SHAKE = 1.7, C_RISE = 0.25, C_CARD = 1.0;      // shake build-up, rise delay after open, card delay after open
function spawnChest(x, y, tier, force = 0) {
  G.chests.push(mkChest(x, y, tier, force));
  burst(x, y - 6, 24, ['#ffffff', TIERS[tier].col], { sp: 70, life: 0.5, up: true });
  SFX.door();
}
function startChest(c) {
  if (c.opened) return;                                    // a chest may only begin its opening once
  townServiceEvent('chest');
  // roll upgrades up front, then reveal them one by one during the shake
  let tier = c.tier; const ups = [];
  while (tier < 3 && (tier < (c.force || 0) || rand() < 0.38 + G.player.luck + (G.player.chestLuck || 0) + curDiff().luck - tier * 0.06)) { tier++; ups.push(tier); }
  const times = ups.map((_, i) => 0.55 + (i + 1) * (C_SHAKE - 0.7) / (ups.length + 1));
  const item = rollItem(tier);
  G.cine = { c, t: 0, startAt: G.time, tier0: c.tier, ups, times, shown: c.tier, final: tier, item, opened: false, cardT: -1, done: false,
    sparks: [], rays: rnd(0, 6), opts: null, sel: 0 };
  resetInput(); G.mode = 'chest'; c.opened = true;
}
function cineTier() { return G.cine.shown; }
function updChest(dt) {
  const C = G.cine; if (!C) return;
  C.t += dt;
  if (!C.opened) {
    const k = clamp(C.t / C_SHAKE);
    if (rand() < 0.25 + k * 0.6) SFX.rattle(k);
    C.times.forEach((tm, i) => { if (C.t >= tm && C.shown < C.ups[i]) { C.shown = C.ups[i]; C.hop = 0.25; SFX.upgrade(C.shown);
      burst(C.c.x, C.c.y - 10, 18, [TIERS[C.shown].col, '#ffffff'], { sp: 80, life: 0.45 }); shake(2); } });
    if (C.hop > 0) C.hop -= dt;
    if (C.t >= C_SHAKE || confirmPressed()) openChest();
    return;
  }
  const u = C.t - C.openAt;
  if (u > C_CARD && C.cardT < 0) { C.cardT = 0; SFX.pickup(); C.opts = itemOptions(C.item); C.sel = 0; }
  if (C.cardT >= 0) C.cardT += dt;
  for (const s of C.sparks) { s.life -= dt; s.vy += 140 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.985; }
  C.sparks = C.sparks.filter(s => s.life > 0);
  if (C.cardT < 0.4) return;
  if (C.opts) {                                     // slots full: pick replace / sell
    const v = navPressed();
    if (v) { C.sel = (C.sel + v + C.opts.length) % C.opts.length; SFX.move(); }
  }
  if (confirmPressed()) takeCineItem();
}
function takeCineItem() {
  const C = G.cine, it = C.item, opt = C.opts ? C.opts[C.sel] : undefined, sold = opt && opt.sell;
  finishTake(it, opt);
  if (!sold) {
    addFloat(G.player.x, G.player.y - 20, it.name, TIERS[it.tier].col, true);
    burst(G.player.x, G.player.y - 8, 26, [TIERS[it.tier].col, '#ffffff'], { sp: 90, life: 0.6, up: true });
  }
  SFX.select(); G.cine = null; G.mode = 'play';
}
function openChest() {
  const C = G.cine, c = C.c;
  C.shown = C.final; C.opened = true; C.openAt = C.t; c.open = 0.001;
  SFX.open(); shake(8); G.flash = 0.35; G.hitstop = 0.06;
  // Co-op transmits one cosmetic seed instead of 90 moving particles every snapshot.
  // The single-player path keeps its original random sequence.
  if (typeof coopRuntimeIsHost === 'function' && coopRuntimeIsHost()) C.sparkSeed = Math.floor(C.rays * 0x10000000) >>> 0;
  C.sparks = chestSparks(C);
  dropGold(c.x, c.y - 10, [4, 8, 14, 24][C.final], G.player.goldMul);
}
function chestSparks(C) {
  const random = Number.isSafeInteger(C.sparkSeed) ? mulberry32(C.sparkSeed) : rand;
  const range = (a, b) => a + (b - a) * random(), colors = ['#ffffff', '#ffdc78', TIERS[C.final].col, TIERS[C.final].col], sparks = [];
  for (let i = 0; i < 90; i++) {
    const a = random() < .8 ? range(-Math.PI, 0) : range(0, Math.PI), speed = range(40, 150);
    sparks.push({ x: C.c.x + range(-6, 6), y: C.c.y - 12, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life: range(.5, 1.4), col: colors[Math.floor(random() * colors.length)] });
  }
  return sparks;
}

// ---------------------------------------------------------------- low-res chest sprite (front view, like the video)
const WOOD_D = '#542e1a', WOOD = '#844c26', WOOD_L = '#aa6834', GOLDC = [236, 186, 64];
function drawChest(g, c, ox = 0, oy = 0, sq = 1) {
  const C = G.cine && G.cine.c === c ? G.cine : null;
  const tier = C ? C.shown : c.tier, col = TIERS[tier].rgb;
  const trim = tier === 3 ? GOLDC : mixRGB(col, GOLDC, 0.45), trimD = trim.map(v => v * 0.6 | 0);
  const T = rgba(trim), TD = rgba(trimD);
  const hw = Math.round(11 * (2 - sq) * 0.5 + 5.5), bh = Math.round(9 * sq);
  const x0 = Math.round(c.x - hw + ox), x1 = Math.round(c.x + hw + ox), yb = Math.round(c.y + oy), yt = yb - bh;
  const R = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  R(x0 - 2, yb - 1, x1 - x0 + 5, 3, 'rgba(0,0,0,0.5)');
  R(x0, yt, x1 - x0 + 1, bh + 1, WOOD_D);
  for (let i = 0, y = yt + 1; y < yb; y += 3, i++) R(x0 + 1, y, x1 - x0 - 1, 2, i % 2 ? WOOD_L : WOOD);
  R(x0, yt, x1 - x0 + 1, 1, T); R(x0, yb, x1 - x0 + 1, 1, TD);
  for (const bx of [x0, x0 + 4, x1 - 5, x1 - 1]) R(bx, yt, 2, bh + 1, bx === x0 || bx === x1 - 1 ? TD : T);
  const op = c.open, lh = Math.round(7 * sq);
  if (op <= 0) {
    const ly = yt - lh;
    R(x0, ly + 2, x1 - x0 + 1, lh - 1, WOOD); R(x0 + 2, ly, x1 - x0 - 3, 2, WOOD_L);
    R(x0 + 1, ly + 3, x1 - x0 - 1, 1, WOOD_L); R(x0, yt - 1, x1 - x0 + 1, 1, T);
    for (const bx of [x0 + 4, x1 - 5]) R(bx, ly + 1, 2, lh, T);
    const lx = Math.round(c.x + ox);
    R(lx - 2, yt - 2, 5, 5, T); R(lx - 1, yt - 1, 3, 3, TD); R(lx, yt, 1, 2, '#1a100c');
    if (C && !C.opened) {                                   // light leaking through the seam
      const k = clamp(C.t / C_SHAKE), leak = mixRGB(col, [255, 255, 255], 0.5 * k);
      R(x0 + 1, yt - 1, x1 - x0 - 1, 1, rgba(leak)); if (k > 0.4) R(x0 + 3, yt - 2, x1 - x0 - 5, 1, rgba(leak, 0.8));
    }
  } else {
    R(x0 + 1, yt - 2, x1 - x0 - 1, 3, rgba(mixRGB(col, [255, 255, 255], 0.35)));
    R(x0 + 3, yt - 3, x1 - x0 - 5, 1, '#fffae6');
    const h2 = Math.max(2, Math.round(lh * 0.9 * Math.min(op, 1.15))), ly1 = yt - 3, ly0 = ly1 - h2;
    R(x0 - 1, ly0, x1 - x0 + 3, h2 + 1, '#462616');
    for (let y = ly0 + 2; y < ly1; y += 3) R(x0, y, x1 - x0 + 1, 1, '#623820');
    R(x0 - 1, ly0, x1 - x0 + 3, 1, T); R(x0 - 1, ly1, x1 - x0 + 3, 1, TD);
  }
}
// shake / squash state for the chest being opened (matches the video's build-up)
function chestPose(c) {
  const C = G.cine;
  if (!C || C.c !== c) return [0, 0, 1];
  if (!C.opened) {
    const k = clamp(C.t / C_SHAKE), amp = 0.4 + 2.4 * k, t = C.t * 30;
    let sq = 1 + 0.06 * k * Math.sin(t * 0.9), oy = 0;
    if (C.hop > 0) { const u = 1 - C.hop / 0.25; oy = -Math.round(4 * Math.sin(u * Math.PI)); sq = 1 + 0.12 * Math.sin(u * Math.PI); }
    return [Math.round(amp * Math.sin(t * 1.9)), oy + Math.round(amp * 0.4 * Math.sin(t * 2.7)), sq];
  }
  const u = C.t - C.openAt;
  return [0, 0, u < 0.12 ? 1 - 0.18 * Math.sin(u / 0.12 * Math.PI) : 1];
}
function updChestLids(dt) {
  for (const c of G.chests) {
    if (c.open > 0) c.open = Math.min(1.15, c.open + dt * 6);
    if (c.open > 1.1 && !(G.cine && G.cine.c === c)) c.open = 1;
  }
}
// additive light FX in low-res space (beam, rays, rising item, sparks)
function drawChestFX(g) {
  const C = G.cine; if (!C) return;
  const c = C.c, col = TIERS[C.shown].rgb, x = c.x, y = c.y + OY;
  g.save(); g.globalCompositeOperation = 'lighter';
  if (!C.opened) {
    const k = clamp(C.t / C_SHAKE);
    const gr = g.createRadialGradient(x, y - 8, 0, x, y - 8, 20 + 30 * k);
    gr.addColorStop(0, rgba(col, 0.25 + 0.4 * k)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(x - 60, y - 70, 120, 120);
  } else {
    const u = C.t - C.openAt, fade = clamp(1 - (C.cardT > 0 ? C.cardT * 0.3 : 0), 0.45, 1);
    const bw = 10 + 6 * Math.sin(u * 4) + clamp(1 - u * 3) * 18, top = Math.max(0, y - 14 - u * 600);
    const bg = g.createLinearGradient(x - bw, 0, x + bw, 0);
    bg.addColorStop(0, rgba(col, 0)); bg.addColorStop(0.5, rgba(mixRGB(col, [255, 255, 255], 0.5), 0.7 * fade)); bg.addColorStop(1, rgba(col, 0));
    g.fillStyle = bg; g.fillRect(x - bw, top, bw * 2, y - 12 - top);
    const ry = itemY(C), rr = 34 + 4 * Math.sin(u * 3);
    if (u > C_RISE) {
      const a0 = C.rays + u * 0.8;
      for (let i = 0; i < 10; i++) {
        const a = a0 + i * Math.PI / 5;
        g.fillStyle = rgba(col, 0.22 * fade); g.beginPath(); g.moveTo(x, ry);
        g.lineTo(x + Math.cos(a - 0.12) * rr * 2, ry + Math.sin(a - 0.12) * rr * 2);
        g.lineTo(x + Math.cos(a + 0.12) * rr * 2, ry + Math.sin(a + 0.12) * rr * 2); g.fill();
      }
      const hg = g.createRadialGradient(x, ry, 0, x, ry, rr);
      hg.addColorStop(0, rgba([255, 255, 255], 0.55 * fade)); hg.addColorStop(0.4, rgba(col, 0.35 * fade)); hg.addColorStop(1, rgba(col, 0));
      g.fillStyle = hg; g.fillRect(x - rr, ry - rr, rr * 2, rr * 2);
    }
    for (const s of C.sparks) { g.fillStyle = s.col; g.globalAlpha = clamp(s.life * 2); g.fillRect(Math.round(s.x), Math.round(s.y + OY), 1, 1); }
    g.globalAlpha = 1;
  }
  g.restore();
  if (C.opened && C.t - C.openAt > C_RISE) {                 // the item itself (normal blend, white outline glow)
    const it = C.item, s = it.big ? SPR[it.big] : itemIcon(it), ry = itemY(C);
    const sc = it.big ? 1 : 2, h = s.h * sc;
    const bob = Math.round(Math.sin((C.t - C.openAt) * 3) * 1.5);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawSpr(g, s, x + dx, ry + h / 2 + bob + dy, { sx: sc, sy: sc, white: true, alpha: 0.9 });
    drawSpr(g, s, x, ry + h / 2 + bob, { sx: sc, sy: sc });
  }
}
function itemY(C) {
  const u = clamp((C.t - C.openAt - C_RISE) / 0.7), y0 = C.c.y + OY - 10, y1 = C.c.y + OY - 52;
  return Math.round(lerp(y0, y1, easeOutBack(u, 1.2)));
}
