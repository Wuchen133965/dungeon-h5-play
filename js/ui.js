'use strict';
// ============================================================ hi-res text/UI layer (crisp CJK text over the pixel canvas)
let HC, hg, U = 4;
const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif';
// Rasterize short labels at the current UI resolution, including their existing six-pass outline.
// A pixel budget bounds memory even on Retina displays; alpha and position remain draw-time values.
const UI_TEXT_CACHE = new Map(), UI_TEXT_MAX_PIXELS = 2 * 1024 * 1024, UI_TEXT_MAX_ENTRIES = 256;
let uiTextPixels = 0;
function clearUITextCache() { UI_TEXT_CACHE.clear(); uiTextPixels = 0; }
function uiTextSprite(s, size, col) {
  s = String(s);
  if (s.length > 40) return null;
  const font = Math.round(size * U), key = `${U}:${font}:${col}:${s}`;
  const cached = UI_TEXT_CACHE.get(key); if (cached) return cached;
  hg.font = `bold ${font}px ${FONT}`;
  const metrics = hg.measureText(s), width = metrics.width, pad = Math.ceil(U * 2) + 2;
  const w = Math.ceil(Math.max(width, metrics.actualBoundingBoxRight || 0) + pad * 2), h = Math.ceil(font * 2 + pad * 2);
  if (!(w > 0 && h > 0) || w * h > UI_TEXT_MAX_PIXELS / 8) return null;
  while (UI_TEXT_CACHE.size && (UI_TEXT_CACHE.size >= UI_TEXT_MAX_ENTRIES || uiTextPixels + w * h > UI_TEXT_MAX_PIXELS)) {
    const first = UI_TEXT_CACHE.keys().next().value, old = UI_TEXT_CACHE.get(first);
    uiTextPixels -= old.canvas.width * old.canvas.height; UI_TEXT_CACHE.delete(first);
  }
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const x = canvas.getContext('2d'), mid = Math.round(h / 2), o = Math.max(1, Math.round(U * .5));
  x.font = hg.font; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#0a060c';
  for (const [dx, dy] of [[o, o], [o * 1.6, o * 1.6], [-o, 0], [o, 0], [0, -o], [0, o]]) x.fillText(s, pad + dx, mid + dy);
  x.fillStyle = col; x.fillText(s, pad, mid);
  const sprite = { canvas, width, pad, mid }; UI_TEXT_CACHE.set(key, sprite); uiTextPixels += w * h; return sprite;
}
function initUI() { HC = document.getElementById('hi'); hg = HC.getContext('2d'); addEventListener('resize', resize); resize(); }
function withUIOffset(x, y, draw) {
  const previous = { ...UI_LAYOUT };
  UI_LAYOUT.x += x; UI_LAYOUT.y += y;
  hg.save(); hg.translate(x * U, y * U);
  try { return draw(); } finally { hg.restore(); Object.assign(UI_LAYOUT, previous); }
}
function withMenuUI(draw) {
  const offset = uiMenuOffset(), previous = UI_LAYOUT.menu; UI_LAYOUT.menu = true;
  try { return withUIOffset(offset.x, offset.y, draw); } finally { UI_LAYOUT.menu = previous; }
}
function uiBackdrop(fill) {
  hg.save(); hg.setTransform(1, 0, 0, 1, 0, 0);
  hg.fillStyle = fill; hg.fillRect(0, 0, HC.width, HC.height); hg.restore();
}
function resize() {
  const st = document.getElementById('stage');
  const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight), dpr = Math.min(devicePixelRatio || 1, 2);
  const scale = Math.min(w / BASE_W, h / BASE_H);
  const width = Math.max(BASE_W, Math.round(w / scale)), height = Math.max(BASE_H, Math.round(h / scale));
  const changed = width !== LW || height !== LH;
  LW = width; LH = height; VIEW_H = LH - OY;
  st.style.width = w + 'px'; st.style.height = h + 'px';
  HC.width = Math.round(w * dpr); HC.height = Math.round(h * dpr); U = HC.width / LW;
  if (changed && CV && LCV && VIG) resizeWorldBuffers();
  if (G.room && G.player) G.camOff = worldCamera();
  clearUITextCache();
  UI_HITS.length = 0;
}
function T(s, x, y, size, col, align = 'center', alpha = 1) {
  if (alpha <= 0) return;
  hg.globalAlpha = clamp(alpha); hg.font = `bold ${Math.round(size * U)}px ${FONT}`;
  hg.textAlign = align; hg.textBaseline = 'middle';
  const sprite = uiTextSprite(s, size, col);
  if (sprite) {
    const shift = align === 'center' ? sprite.width / 2 : align === 'right' || align === 'end' ? sprite.width : 0;
    hg.drawImage(sprite.canvas, Math.round(x * U - shift - sprite.pad), Math.round(y * U - sprite.mid));
    hg.globalAlpha = 1; return;
  }
  const o = Math.max(1, Math.round(U * 0.5));
  hg.fillStyle = '#0a060c';
  for (const [dx, dy] of [[o, o], [o * 1.6, o * 1.6], [-o, 0], [o, 0], [0, -o], [0, o]]) hg.fillText(s, x * U + dx, y * U + dy);
  hg.fillStyle = col; hg.fillText(s, x * U, y * U); hg.globalAlpha = 1;
}
function panel(x0, y0, x1, y1, fill, border, alpha = 0.92) {
  const u = U * 0.75, a = x0 * U, b = y0 * U, c = x1 * U, d = y1 * U;
  hg.globalAlpha = alpha;
  hg.fillStyle = border; hg.fillRect(a + u, b, c - a - 2 * u, d - b); hg.fillRect(a, b + u, c - a, d - b - 2 * u);
  hg.fillStyle = fill; hg.fillRect(a + 2 * u, b + u, c - a - 4 * u, d - b - 2 * u); hg.fillRect(a + u, b + 2 * u, c - a - 2 * u, d - b - 4 * u);
  hg.globalAlpha = 1;
}
function tw(s, size) { hg.font = `bold ${Math.round(size * U)}px ${FONT}`; return hg.measureText(s).width / U; }
const key = k => `[${k}] `;
const lineCol = s => s.startsWith('“') ? '#a096aa' : /回复|复活|穿透|荆棘|必定/.test(s) ? '#82e68c' : '#f0f0f0';

// Aggregate only explicitly tagged damage events; original events are untouched for co-op delivery.
// Critical, DOT colour, attacker, target, privacy and 80ms time buckets stay separate.
function visibleDamageFloats() {
  const result = [], groups = new Map();
  for (const f of G.floats) {
    if (!coopRuntimeFxVisible(f)) continue;
    if (!f.damageTarget || !Number.isFinite(f.amount) || !Number.isFinite(f.born)) { result.push(f); continue; }
    const key = JSON.stringify([f.damageTarget, f.damageSource, f.privateId, f.col, !!f.big, Math.floor(f.born / .08)]);
    const prior = groups.get(key);
    if (prior) {
      prior.amount += f.amount; prior.text = String(prior.amount) + (prior.big ? '!' : '');
      prior.life = Math.max(prior.life, f.life);
    } else { const copy = { ...f }; groups.set(key, copy); result.push(copy); }
  }
  return result;
}
const UI_SAVE_NOTICE = { element: null, pending: false, notice: '', text: '', until: 0, shown: '' };
function drawSaveNotice(now = Date.now()) {
  if (typeof META_SAVE === 'undefined') return;
  const ui = UI_SAVE_NOTICE;
  if (META_SAVE.notice !== ui.notice) { ui.notice = META_SAVE.notice; ui.text = META_SAVE.notice; ui.until = now + 6000; }
  if (ui.pending && !META_SAVE.pending) { ui.text = '养成进度已保存。'; ui.until = now + 6000; }
  ui.pending = META_SAVE.pending;
  const text = META_SAVE.pending ? META_SAVE.message || '进度尚未保存，请勿关闭游戏；正在重试保存。' : now < ui.until ? ui.text : '';
  if (!ui.element && text) {
    ui.element = document.createElement('div'); ui.element.setAttribute('role', 'status'); ui.element.setAttribute('aria-live', 'polite');
    ui.element.style.cssText = 'position:fixed;z-index:1000;left:50%;bottom:34px;transform:translateX(-50%);max-width:calc(100vw - 32px);box-sizing:border-box;padding:10px 16px;border:1px solid #dba45c;border-radius:6px;background:rgba(22,14,20,.97);color:#ffe3b3;font:14px/1.5 sans-serif;text-align:center;pointer-events:none;';
    document.body.appendChild(ui.element);
  }
  if (ui.element && ui.shown !== text) { ui.element.textContent = text; ui.element.hidden = !text; ui.shown = text; }
}

// Presentation only: timers always come from this player's simulation / host snapshot.
const ATTACK_RECOVERY_UI = { source: null, pending: false, lastAlt: null, readyAt: null, readyLabel: '', block: '', blockMax: 0 };
function resetAttackRecoveryUI(source = null) {
  Object.assign(ATTACK_RECOVERY_UI, { source, pending: false, lastAlt: null, readyAt: null, readyLabel: '', block: '', blockMax: 0 });
}
function attackRecoveryDisplay(now = Date.now() / 1000) {
  const p = G.player, S = ATTACK_RECOVERY_UI, run = typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive();
  if (!combatInput() || !p || !(p.hp > 0) || !p.wpn || G.cine || G.choice || G.shrineUI || G.trans || G.fade > 0 ||
      typeof COOP_UI !== 'undefined' && (COOP_UI.open || COOP_UI.journal) ||
      typeof coopConfirmationOpen === 'function' && coopConfirmationOpen()) { resetAttackRecoveryUI(); return null; }
  let source = p;
  if (run) {
    const actor = COOP_RUNTIME.actors.get(COOP.selfId);
    if (!actor || !actor.connected || actor.downed || COOP_RUNTIME.ended || COOP.role === 'client' &&
        (COOP_RUNTIME.lastApplied < 0 || performance.now() - COOP.lastSnapshotAt > 2500)) { resetAttackRecoveryUI(); return null; }
    source = `${COOP.sessionId}:run:${COOP_RUNTIME.runId}:${COOP.selfId}`;
  } else if (typeof coopTownActive === 'function' && coopTownActive()) source = `${COOP.sessionId}:town:${COOP_TOWN.townId}:${COOP.selfId}`;
  if (S.source !== source) resetAttackRecoveryUI(source);
  const attacked = S.lastAlt !== null && p.alt !== S.lastAlt;
  S.lastAlt = p.alt;
  const timer = key => Number.isFinite(p[key]) ? Math.max(0, p[key]) : 0;
  const rolling = timer('rolling'), recovery = timer('rollAttackT'), weapon = timer('atkT'), stun = timer('stun');
  if (rolling || recovery) { S.pending = true; S.readyAt = null; }
  if (!S.pending && S.readyAt === null) return null;
  const blocked = (status, label, remaining, maximum) => {
    if (S.block !== status) { S.block = status; S.blockMax = remaining; }
    S.blockMax = Math.max(S.blockMax, remaining);
    return { status, label, remaining, progress: clamp(1 - remaining / Math.max(maximum || S.blockMax, .001)), alpha: 1 };
  };
  if (stun) return blocked('stunned', '眩晕中', stun);
  if (rolling) return blocked('rolling', '闪避中', .5, .5);
  if (recovery) return blocked('recovery', '攻击恢复', recovery, .5);
  if (!run && G.hitstop > 0) return null;
  if (run && COOP.role === 'client' && (Input.pressed.has('roll') || COOP.edges.has('roll'))) return null;
  if (S.pending) {
    // Held attacks can already have fired on this frame, resetting normal atkT.
    if (!(attacked && p.swing > 0) && weapon) return blocked('weapon', '武器冷却', weapon);
    S.pending = false; S.readyAt = now; S.readyLabel = attacked && p.swing > 0 ? '恢复完成' : '可攻击';
  }
  if (now - S.readyAt >= .45) { S.readyAt = null; return null; }
  if (S.readyLabel === '可攻击' && weapon) {
    if (!attacked) return null;
    S.readyLabel = '恢复完成';
  }
  return { status: 'ready', label: S.readyLabel, remaining: 0, progress: 1, alpha: clamp((.45 - (now - S.readyAt)) / .15) };
}
// A thin ground ring follows the hero's feet; recovery briefly turns it green before fading.
function drawAttackRecovery(display) {
  const p = G.player;
  if (!display || !p || !G.camOff) return;
  const { progress, alpha } = display, ready = display.status === 'ready';
  // Co-op guests follow the same smoothed position used to draw their own hero.
  let px0 = p.x, py0 = p.y;
  if (typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive()) {
    const actor = COOP_RUNTIME.actors.get(COOP.selfId);
    if (actor) { const at = coopViewPlayerPosition(actor); px0 = at.x; py0 = at.y; }
  }
  const scale = p.scale || 1, cx = (px0 + G.camOff[0]) * U, cy = (py0 + G.camOff[1] + OY + 2 * scale) * U;
  const rx = 6 * scale * U, ry = 2.3 * scale * U, lw = Math.max(1, .8 * U), a0 = -Math.PI / 2;
  const col = ready ? '#92e5aa' : display.status === 'stunned' ? '#a8c8ff' : '#ffc17d';
  hg.save(); hg.lineCap = 'round';
  hg.globalAlpha = .35 * alpha; hg.strokeStyle = '#140c16'; hg.lineWidth = lw + U * .6;
  hg.beginPath(); hg.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); hg.stroke();
  hg.globalAlpha = .85 * alpha; hg.strokeStyle = col; hg.lineWidth = lw;
  if (ready || progress >= .999) { hg.beginPath(); hg.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); hg.stroke(); }
  else if (progress > 0) { hg.beginPath(); hg.ellipse(cx, cy, rx, ry, 0, a0, a0 + Math.PI * 2 * progress); hg.stroke(); }
  hg.restore(); hg.globalAlpha = 1;
}

// ============================================================ low-res HUD (hearts, coins, souls, minimap, gear slots)
function slotBox(x, y, it, empty = '#2a2030') {
  g.fillStyle = '#100a14'; g.fillRect(x - 1, y - 1, 11, 11);
  g.fillStyle = it ? rgba(TIERS[it.tier].rgb, 0.85) : empty; g.fillRect(x - 1, y - 1, 11, 1); g.fillRect(x - 1, y + 9, 11, 1);
  g.fillRect(x - 1, y - 1, 1, 11); g.fillRect(x + 9, y - 1, 1, 11);
  if (it) drawSpr(g, itemIcon(it), x + 4.5, y + 9);
}
function drawHUDLow() {
  const p = G.player;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
  if (G.mode === 'title') return;
  const inTown = G.room.type === 'town';
  if (inTown) return; // The hub has its own persistent-progression HUD, including while menus are open.
  // Local translucent plates keep status readable without a full-width black border.
  g.fillStyle = 'rgba(16,10,20,.65)';
  const middle = (LW - BASE_W) / 2, right = LW - BASE_W;
  for (const [x, width] of [[2, 90], [111 + middle, 85], [200 + right, 78], [284 + right, 34]]) g.fillRect(x, 2, width, HUD_H - 4);
  const hearts = p.maxHp / 2, two = hearts > 9;
  // Deep talent builds can exceed two rows of hearts: use a compact, exact health bar.
  if (hearts > 18) {
    g.fillStyle = '#4a1420'; g.fillRect(4, 5, 88, 10);
    g.fillStyle = '#c83048'; g.fillRect(5, 6, Math.round(86 * clamp(p.hp / p.maxHp)), 8);
    g.fillStyle = '#ff8aa0'; g.fillRect(5, 6, Math.round(86 * clamp(p.hp / p.maxHp)), 1);
  }
  for (let i = 0; i < Math.min(hearts, hearts > 18 ? 0 : 18); i++) {
    const v = p.hp - i * 2;
    const hop = p.hp <= 2 && v > 0 && Math.floor(G.time * 4) % 2 ? -1 : 0;
    const row = two ? Math.floor(i / 9) : 0, col = two ? i % 9 : i;
    const x = 9 + col * 9, y = (two ? 9 + row * 8 : 13) + hop;
    drawSpr(g, SPR.heartEmpty, x, y);
    if (v > 0) {
      const s = SPR.heart, fill = s.w * clamp(v / 2);
      g.save(); g.beginPath(); g.rect(Math.round(x - s.w / 2), Math.round(y - s.h), fill, s.h); g.clip();
      drawSpr(g, s, x, y); g.restore();
    }
  }
  if (p.shieldUp) { g.fillStyle = '#ffe080'; g.fillRect(4, two ? 16 : 15, 2, 2); }
  mechCall('hud'); classHud();
  g.save(); g.translate(right, 0);
  drawSpr(g, SPR.coin, 208, 12 + (G.goldPulse > 0 ? -1 : 0));
  const sb = G.soulPulse > 0 ? -1 : 0; g.fillStyle = '#7ad8ff'; g.fillRect(247, 7 + sb, 3, 5); g.fillStyle = '#c8f0ff'; g.fillRect(248, 6 + sb, 1, 7);
  // minimap
  const miniRooms = [...G.rooms.values()], bounds = {
    minX: Math.min(...miniRooms.map(r => r.gx)), maxX: Math.max(...miniRooms.map(r => r.gx)),
    minY: Math.min(...miniRooms.map(r => r.gy)), maxY: Math.max(...miniRooms.map(r => r.gy)),
  };
  const stepX = Math.min(6, 43 / Math.max(1, bounds.maxX - bounds.minX + 1)), stepY = Math.min(4, 17 / Math.max(1, bounds.maxY - bounds.minY + 1));
  const miniW = (bounds.maxX - bounds.minX + 1) * stepX, miniH = (bounds.maxY - bounds.minY + 1) * stepY;
  const mx = 317 - miniW, my = Math.max(1, (HUD_H - miniH) / 2);
  for (const r of miniRooms) {
    const known = r.visited || Object.keys(r.doors).some(d => { const n = G.rooms.get(rkey(r.gx + DIRS[d][0], r.gy + DIRS[d][1])); return n && n.visited; });
    if (!known) continue;
    const x = mx + (r.gx - bounds.minX) * stepX, y = my + (r.gy - bounds.minY) * stepY, cur = r === G.room;
    g.fillStyle = cur ? '#ffffff' : r.visited ? '#8a7f96' : '#3a3244'; g.fillRect(x, y, Math.max(2, stepX - 1), Math.max(1, stepY - 1));
    const ic = { treasure: '#ffb432', shop: '#4696ff', stairs: '#b45aff', boss: '#ff4058', challenge: '#ff8a40', altar: '#ff4058', fountain: '#6ac8ff', shrine: '#ffd060' }[r.type];
    if (ic && !cur && !(r.type === 'fountain' && r.fountain.used) && !(r.type === 'altar' && r.altar.used)) { g.fillStyle = ic; g.fillRect(x + Math.floor((stepX - 1) / 2), y + Math.floor((stepY - 1) / 2), 1, 1); }
  }
  g.restore();
  // gear slots along the bottom wall: weapon | armor | boots | trinkets (capped)
  const by = LH - 12;
  slotBox(4, by, G.eq.weapon); slotBox(16, by, G.eq.armor); slotBox(28, by, G.eq.boots);
  g.fillStyle = '#4a4058'; g.fillRect(40, by + 1, 1, 7);
  for (let i = 0; i < p.trinketSlots; i++) slotBox(43 + i * 12, by, G.eq.trinkets[i] || null);
  // coins / souls flying into the HUD
  for (const c of G.uiCoins) if (coopRuntimeFxVisible(c, true)) {
    const u = easeOutCubic(c.t), tx = (c.soul ? 248 : 208) + right, x = lerp(c.x + G.camOff[0], tx, u), y = lerp(c.y + G.camOff[1], 9, u) - Math.sin(u * Math.PI) * 18;
    g.fillStyle = c.soul ? '#7ad8ff' : '#ecba40'; g.fillRect(Math.round(x) - 1, Math.round(y) - 2, 3, 4);
    g.fillStyle = c.soul ? '#ffffff' : '#fffad2'; g.fillRect(Math.round(x) - 1, Math.round(y) - 2, 1, 1);
  }
  // boss bar
  const b = G.enemies.find(e => EDEF[e.kind].boss && e.spawn <= 0);
  g.save(); g.translate(middle, 0);
  if (b) { g.fillStyle = '#100a14'; g.fillRect(99, HUD_H + 7, 122, 6); g.fillStyle = '#4a1420'; g.fillRect(100, HUD_H + 8, 120, 4);
    g.fillStyle = b.enraged ? '#ff4058' : '#c02838'; g.fillRect(100, HUD_H + 8, Math.round(120 * b.hp / b.max), 4);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(100, HUD_H + 8, Math.round(120 * b.hp / b.max), 1);
    g.fillStyle = '#241d19'; g.fillRect(100, HUD_H + 15, 120, 2);
    g.fillStyle = b.broken > 0 ? '#ffd080' : b.breakResist > 0 ? '#6c6574' : '#e0ac60';
    const posture = b.broken > 0 ? b.broken / MELEE_COMBAT.breakDuration : (b.posture || 0) / bossPostureMax(b);
    g.fillRect(100, HUD_H + 15, Math.round(120 * clamp(posture)), 2); }
  g.restore();
}
function drawUI() {
  drawSaveNotice();
  UI_HITS.length = 0;
  updateHelpText();
  hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, HC.width, HC.height);
  const attackRecovery = attackRecoveryDisplay();
  if (G.mode === 'title') { withMenuUI(drawTitle); return; }
  if (G.mode === 'journal') { withMenuUI(drawQuestJournal); return; }
  const p = G.player, [cx, cy] = G.camOff, inTown = G.room.type === 'town';
  if (!inTown && p.maxHp > 36) T(`生命 ${formatHearts(p.hp)} / ${formatHearts(p.maxHp)} ♥`, 48, 10.5, 5.5, '#fff0e8');
  if (inTown) drawTownHeader();
  else {
    T(String(G.gold), LW - 106, 10.5, 8, G.goldPulse > 0 ? '#fff0a0' : '#ffdc5a', 'left');
    T(String(G.runSouls), LW - 67, 10.5, 8, G.soulPulse > 0 ? '#ffffff' : '#9ae0ff', 'left');
    T(`${G.chapter}-${G.floor} · ${chap().name}`, LW / 2, 10.5, 7, '#d8ccbc');
    if (G.diff) T(curDiff().name, LW / 2 + tw(`${G.chapter}-${G.floor} · ${chap().name}`, 7) / 2 + 4, 10.5, 5, curDiff().col, 'left');
  }
  const b = G.enemies.find(e => EDEF[e.kind].boss && e.spawn <= 0);
  if (b) {
    T(EDEF[b.kind].name, LW / 2, HUD_H + 23, 6, '#ff8a9a');
    const status = b.broken > 0 ? `破势 · 反击 ${b.broken.toFixed(1)}s` : b.restT > 0 ? `招式收势 · 反击 ${b.restT.toFixed(1)}s`
      : b.breakResist > 0 ? `破势抗性 ${b.breakResist.toFixed(1)}s` : `破势 ${Math.floor(b.posture || 0)} / ${bossPostureMax(b)}`;
    T(status, LW / 2, HUD_H + 32, 4.7, enemyCombatWindow(b) ? '#ffd080' : '#c4ab83');
  }
  for (const f of visibleDamageFloats()) T(f.text, f.x + cx, f.y + OY + cy, f.big ? 8 : 6, f.col, 'center', f.life * 2);
  if (!inTown && typeof coopUIDrawRunNames === 'function') coopUIDrawRunNames();
  // interaction prompt
  if (inTown && G.mode === 'town') drawTownLabels(cx, cy);
  if (G.room.shop && (G.mode === 'play' || G.mode === 'chest')) for (const sh of G.room.shop) if (!sh.sold)        // price tags on the counter
    T(String(sh.price), sh.x + cx, 69.4 + OY + cy, 4.5, G.gold >= sh.price ? '#3a2410' : '#c02838');
  if ((G.mode === 'play' || (G.mode === 'town' && !TOWN.menu && !TOWN.launch)) && G.prompt) {
    const { sub, col } = G.prompt, text = G.prompt.text;
    const x = G.prompt.x + cx, y = G.prompt.y + cy;
    const kw = Math.max(8, tw(keyLabel('E'), 5.5) + 6), w = Math.max(tw(text, 6) + kw + 4, sub ? tw(sub, 5) : 0) + 12;
    const px0 = clamp(x - w / 2, 2, LW - 2 - w), bob = Math.sin(G.time * 5) * 0.6;
    panel(px0, y - 8 + bob, px0 + w, y + (sub ? 9 : 5) + bob, '#100c12', col || '#c8aa6e', 0.88);
    hg.fillStyle = col || '#c8aa6e'; hg.fillRect((x - 1.5) * U, (y - 10 + bob) * U, 3 * U, 2 * U);
    const tx = px0 + (w - (tw(text, 6) + kw + 4)) / 2;
    keycap('E', tx, y - 1.5 + bob, 5.5); T(text, tx + kw + 4, y - 1.5 + bob, 6, '#fff0c8', 'left');
    if (sub) T(sub, px0 + w / 2, y + 5 + bob, 5, '#c0b4c8');
  }
  // floor / room banner
  if (G.banner && !G.cine && G.mode !== 'choice' && G.mode !== 'shrine' && !(G.mode === 'town' && TOWN.menu)) {
    const bn = G.banner, a = clamp(bn.t * 4) * clamp((2.4 - bn.t) * 3);
    T(bn.title, LW / 2, LH * 62 / BASE_H, 15, bn.col, 'center', a); if (bn.sub) T(bn.sub, LW / 2, LH * 62 / BASE_H + 16, 7, '#c8bcd0', 'center', a);
  }
  if (G.mode === 'town' && TOWN.menu) withMenuUI(() => drawTownMenu(TOWN.menu));
  if (G.cine) drawCineUI();
  if (G.mode === 'choice') withMenuUI(drawChoice);
  if (G.mode === 'shrine') withMenuUI(drawShrineMenu);
  if (G.mode === 'pause') withMenuUI(drawPause);
  if (G.mode === 'dead' || G.mode === 'win') withMenuUI(drawEnd);
  if ((G.mode === 'town' && !TOWN.menu && !TOWN.launch) || (G.mode === 'play' && !G.cine)) {
    const quests = questTrackedEntries();
    drawQuestTrackerDirection(quests);
    drawQuestTracker(quests);
  }
  drawAttackRecovery(attackRecovery);
}
function drawCineUI() {
  const C = G.cine, tier = TIERS[C.shown], x = C.c.x + G.camOff[0], y = C.c.y + OY + G.camOff[1];
  if (!C.opened) {
    const hop = C.hop > 0 ? Math.sin((1 - C.hop / 0.25) * Math.PI) * 4 : 0;
    T(tier.name + '!'.repeat(C.shown), x, y - 40 - hop, hop ? 14 : 11, tier.col);
    return;
  }
  const u = C.t - C.openAt;
  if (C.cardT < 0 && u > C_RISE + 0.35) {                      // the card's rarity badge replaces this banner
    const k = clamp((u - C_RISE - 0.35) / 0.4), bx = lerp(-120, LW / 2, easeOutBack(k, 1.2));
    T(tier.name + '宝箱!', bx, 30, 14, tier.col);
  }
  if (C.cardT < 0) return;
  const w = 208, x0 = (LW - w) / 2;
  drawItemCard(C.item, x0, 40, w, C.cardT, C.opts, C.sel, C.cardT > 0.4);
}
// item card: name, tier tag, slot, effect lines, and (if the slot is full) a selectable option list
const ITEM_CARD_PAGE = { key: null, page: 0 };
function itemCardEffectLines(text, width) {
  const lines = []; let line = '';
  for (const token of String(text).match(/[+-]?\d+(?:\.\d+)?%?|[A-Za-z][A-Za-z0-9.]*|[\s\S]/g) || []) {
    if (line && tw(line + token, 5.5) > width) { lines.push(line.trim()); line = ''; }
    line += token;
  }
  if (line) lines.push(line.trim());
  return lines;
}
function drawItemCardPreview(it, x, y) {
  const tier = TIERS[it.tier], width = 58, height = 34;
  panel(x, y, x + width, y + height, '#100c17', tier.col, 1);
  const image = it.silver ? forgeUIWeaponImage(it) : (it.big ? SPR[it.big] : itemIcon(it)).img;
  const fit = Math.min((width - 8) / image.width, (height - 8) / image.height);
  hg.imageSmoothingEnabled = false;
  hg.drawImage(image, (x + (width - image.width * fit) / 2) * U,
    (y + (height - image.height * fit) / 2) * U, image.width * fit * U, image.height * fit * U);
}
function drawItemCard(it, x0, y0, w, t, opts, sel, ready) {
  const ic = TIERS[it.tier], n = opts ? opts.length : 0;
  const cardHeight = UI_LAYOUT.menu ? BASE_H : LH;
  const name = typeof forgeItemName === 'function' ? forgeItemName(it) : it.name;
  let title = name, tail = '', titleSize = 9;
  if (tw(name, 9) > w - 46) {
    titleSize = 6; const chars = Array.from(name);
    while (chars.length && tw(chars.join(''), titleSize) > w - 46) chars.pop();
    title = chars.join(''); tail = Array.from(name).slice(chars.length).join('');
  }
  const header = tail ? 42 : 34, effects = forgeItemLines(it);
  const allLines = effects.flatMap(line => itemCardEffectLines(line, w - 90));
  const lh = it.silver ? 8.5 : 9, actions = n ? 8 + n * 10 : 8;
  const capacity = Math.max(1, Math.floor((cardHeight - 4 - header - actions - 12 - 11) / lh));
  const paged = allLines.length > capacity, pages = paged ? Math.ceil(allLines.length / capacity) : 1;
  const cardKey = it.id + ':' + G.mode;
  if (ITEM_CARD_PAGE.key !== cardKey) { ITEM_CARD_PAGE.key = cardKey; ITEM_CARD_PAGE.page = 0; }
  ITEM_CARD_PAGE.page = clamp(ITEM_CARD_PAGE.page, 0, pages - 1);
  const lines = paged ? allLines.slice(ITEM_CARD_PAGE.page * capacity, (ITEM_CARD_PAGE.page + 1) * capacity) : allLines;
  const bodyHeight = Math.max(34, lines.length * lh);
  const h = header + bodyHeight + (paged ? 11 : 0) + actions + 12;
  y0 = UI_LAYOUT.menu || G.mode === 'chest' ? Math.max(2, (cardHeight - h) / 2) : Math.min(y0, cardHeight - 2 - h);
  ITEM_CARD_PAGE.y0 = y0;                // final card top, read by gear-fx.js
  panel(x0, y0, x0 + w, y0 + h, '#18101a', ic.col, 0.95);
  T(title, x0 + 8, y0 + 11, titleSize, ic.col, 'left');
  if (tail) T(tail, x0 + 8, y0 + 19, Math.min(6, (w - 16) / Math.max(1, tw(tail, 1))), ic.col, 'left');
  panel(x0 + w - 28, y0 + 5, x0 + w - 6, y0 + 17, '#3a2410', ic.col, 1);
  T(ic.name, x0 + w - 17, y0 + 11.3, 6, '#fff0d0');
  T(slotText(it), x0 + 8, y0 + header - 12, 5, '#a096aa', 'left');
  if (it.cls) {                                               // class tag + set count you would reach by taking it (n / next threshold)
    const C = CLASSES[it.cls], worn = equipList().includes(it), opt = opts && opts[sel];
    const n = ((G.player.setN || {})[it.cls] || 0) + (worn || opt && opt.sell ? 0 : 1) - (!worn && opt && opt.replaces && opt.replaces.cls === it.cls ? 1 : 0);
    T(`${C.name} ${n}/${SET_AT.find(k => k >= n) || SET_AT[2]}`, x0 + w - 8, y0 + header - 12, 5, C.col, 'right'); }
  hg.fillStyle = rgba(ic.rgb, 0.45); hg.fillRect((x0 + 6) * U, (y0 + header - 7) * U, (w - 12) * U, Math.max(1, U * 0.6));
  drawItemCardPreview(it, x0 + 8, y0 + header - 3);
  lines.forEach((s, i) => { const a = clamp((t - 0.3 - i * 0.12) / 0.2);
    T(s, x0 + 74 + (1 - a) * 8, y0 + header + 1 + i * lh, 5.5, lineCol(s), 'left', a); });
  let yy = y0 + header + 1 + bodyHeight;
  if (paged) {
    T(`效果 ${ITEM_CARD_PAGE.page + 1}/${pages}`, x0 + w / 2, yy, 4.8, '#c8bcd0');
    for (const [delta, x, label] of [[-1, x0 + 7, '◀'], [1, x0 + w - 23, '▶']]) {
      const hover = ready && uiHit(x, yy - 4, x + 16, yy + 4, () => { ITEM_CARD_PAGE.page = (ITEM_CARD_PAGE.page + delta + pages) % pages; SFX.move(); });
      panel(x, yy - 4, x + 16, yy + 4, hover ? '#35404a' : '#26313a', ic.col, 1);
      T(label, x + 8, yy, 4.8, '#eee9dd');
    }
    yy += 11;
  }
  if (n) {
    T(it.slot === 'trinket' ? '饰品栏已满，选择：' : `${SLOT_NAME[it.slot]}栏已占用，选择：`, x0 + 8, yy + 2, 5, '#ff9a6a', 'left');
    opts.forEach((o, i) => { const on = i === sel, y = yy + 11 + i * 10;
      if (ready) uiHit(x0 + 5, y - 4.5, x0 + w - 5, y + 4.5, () => {
        const menu = G.mode === 'choice' ? G.choice : G.cine;
        if (!menu || menu.item !== it) return;
        menu.sel = i; pulse('confirm'); SFX.select();
      });
      if (on) { hg.fillStyle = 'rgba(255,220,140,0.16)'; hg.fillRect((x0 + 5) * U, (y - 4.5) * U, (w - 10) * U, 9 * U); }
      T((on ? '▶ ' : '   ') + o.label, x0 + 8, y, 5.5, on ? '#fff0c8' : o.col || '#c0b4c8', 'left'); });
    yy += 8 + n * 10;
  }
  if (ready) {
    if (!n) {
      const label = it.slot === 'use' ? '使用' : '装备', y = yy + 7;
      const hover = uiHit(x0 + 5, y - 5, x0 + w - 5, y + 5, () => {
        if (typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive()) coopRunAction({ kind: 'select', index: 0, confirm: true });
        else pulse('confirm');
      });
      panel(x0 + 5, y - 5, x0 + w - 5, y + 5, '#2a241c', hover ? '#fff0c8' : ic.col, .95);
      T(label, x0 + w / 2, y, 5.5, '#fff0c8');
      return;
    }
    const footer = n ? [['W/S', '选择'], ['E', '确认']] : [['E', it.slot === 'use' ? '使用' : '装备']];
    if (it.silver && G.mode === 'choice') footer.push(['Esc', '取消']);
    hints(footer, yy + 5, x0 + w / 2);
  }
}
function drawChoice() {
  const C = G.choice;
  uiBackdrop('rgba(8,4,12,0.55)');
  drawItemCard(C.item, 160 - 104, 34, 208, C.t + 1, C.opts, C.sel, C.t >= .2);
  if (!C.item.silver) hints([['Esc', '取消']], 171);
}
const firstLine = it => itemDescriptionLines(it).filter(l => !l.startsWith('“')).slice(0, 2).join('，');
function drawGearPanel(x0, y0, w) {
  const p = G.player, e = G.eq;
  const rows = [['武器', e.weapon], ['防具', e.armor], ['鞋子', e.boots], ...Array.from({ length: p.trinketSlots }, (_, i) => [`饰品${i + 1}`, e.trinkets[i]])];
  const rh = rows.length > 8 ? 8 : 10, h = 12 + rows.length * rh;
  panel(x0, y0, x0 + w, y0 + h, '#18101a', '#6a5a78', 0.92);
  T(`装备  (饰品 ${e.trinkets.length}/${p.trinketSlots})`, x0 + 6, y0 + 7, 6, '#ffe6b0', 'left');
  rows.forEach(([lab, it], i) => { const y = y0 + 16 + i * rh;
    T(lab, x0 + 6, y, 5, '#8a7f96', 'left');
    if (!it) { T('— 空 —', x0 + 30, y, 5.5, '#4a4058', 'left'); return; }
    if (it.cls) { hg.fillStyle = CLASSES[it.cls].col; hg.fillRect((x0 + 26) * U, (y - 1.5) * U, 2 * U, 3 * U); }
    let name = forgeItemName(it);
    if (tw(name, 6) > (w - 36) * .65) {
      const chars = Array.from(name);
      while (chars.length && tw(chars.join('') + '…', 6) > (w - 36) * .65) chars.pop();
      name = chars.join('') + '…';
    }
    T(name, x0 + 30, y, 6, TIERS[it.tier].col, 'left');
    const fl = firstLine(it), room = w - 36 - tw(name, 6);
    let cut = fl.length > room / 4.6 ? fl.slice(0, Math.max(2, Math.floor(room / 4.6) - 1)) + '…' : fl;
    if (tw(cut, 4.5) > room - 2) {
      const chars = Array.from(fl);
      while (chars.length && tw(chars.join('') + '…', 4.5) > room - 2) chars.pop();
      cut = chars.length ? chars.join('') + '…' : '';
    }
    T(cut, x0 + 32 + tw(name, 6), y + 0.5, 4.5, '#b0a4b8', 'left'); });
  return h;
}
function drawStatsPanel(x0, y0, w) {
  const p = G.player, pc = v => Math.round(v * 100) + '%';
  const rows = [['攻击力', (p.dmg * p.wpn.mul).toFixed(1)], ['攻速', ((classHook('atkSpd') || 1) / p.atkCd).toFixed(1) + '/秒'], ['暴击', `${pc(p.crit)} ×${p.critMul}`],
    ['移速', pc(p.speed / 82)], ['翻滚冷却', p.rollCd.toFixed(2) + 's'], ['宝箱升阶', '+' + pc(p.luck + (p.chestLuck || 0))],
    ['防御', `${p.defense}${p.wpn.ranged ? '' : '（含近战 +' + CONFIG.meleeDefense + '）'}`],
    ['抵扣/次', `${formatHearts(p.defense * CONFIG.defensePointValue)}♥ · ≤${pc(CONFIG.defenseMaxReduction)}`]];
  const procs = [['点燃', 'burn'], ['冻结', 'freeze'], ['中毒', 'poison'], ['闪电', 'chain'], ['爆炸', 'explode']].filter(q => p[q[1]] > 0);
  if (procs.length) rows.push(['触发', procs.map(q => q[0] + pc(gearProcChance(q[1], p))).join(' ')]);
  if (p.block) rows.push(['格挡', pc(p.block)]);
  if (p.minions) {
    rows.push(['召唤物', `${p.minions} 只 ×${p.minionDmg.toFixed(1)}`]);
    rows.push(['召唤攻速', pc(minionAttackSpeed(p))]);
    rows.push(['召唤上限', pc(MINION_EFFECTIVE_SPEED_CAP) + '（分摊前）']);
  }
  const rh = Math.min(8.6, 108 / rows.length), h = 12 + rows.length * rh;
  panel(x0, y0, x0 + w, y0 + h, '#18101a', '#6a5a78', 0.92);
  T('属性', x0 + 6, y0 + 7, 6, '#ffe6b0', 'left');
  rows.forEach(([a, b], i) => { T(a, x0 + 6, y0 + 16 + i * rh, 4.8, '#8a7f96', 'left'); T(b, x0 + w - 6, y0 + 16 + i * rh, 5, '#f0e8dc', 'right'); });
  return h;
}
function drawPause() {
  UI_HITS.length = 0;
  uiBackdrop('rgba(8,4,12,0.7)');
  const town = G.pmode === 'town';
  frame(6, 26, 314, 162, town ? '暂停 · 晨星镇' : `暂停 · ${floorLabel()} ${chap().name} · ${curDiff().name}`, '#ffe6b0');
  const gh = drawGearPanel(12, 36, 190), sh = drawStatsPanel(208, 36, 100);
  // class sets go under whichever column has more room left (frame bottom ~ 162)
  if (!town) { const gl = 160 - (36 + gh + 3), sl = 160 - (36 + sh + 3);
    if (gl >= sl) drawSetPanel(12, 36 + gh + 3, 190, gl); else drawSetPanel(208, 36 + sh + 3, 100, sl); }
  if (town) {
    const hover = uiHit(246, 164, 311, 176, returnToTitle);
    T('返回主菜单', 279, 170, 5.5, hover ? '#fff1d4' : '#baaac7');
  }
  hints(town ? [['Tab / Esc', '继续']] : [['Tab / Esc', '继续'], ['R', '放弃本局（保留魂晶）']], 172);
}
function drawTitle() {
  drawTitleScreen();
}
// ============================================================ hub town UI: name tags, NPC menus (talents / armory / portal / stele)
// macOS 上按 F11 会被系统抢去显示桌面，全屏用的是 ⌃⌘F；底部的操作提示跟着平台走
const FULLSCREEN_KEY = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '') ? '⌃⌘F' : 'F';
function updateHelpText() {
  const help = document.getElementById('desktop-help');
  const online = typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive();
  const context = G.mode === 'map' ? 'map' : G.mode === 'journal' ? 'journal' : G.mode === 'town' && TOWN.menu === 'dialogue' ? 'story' : G.mode === 'title' ? 'title' : G.mode === 'pause' || (G.mode === 'town' && TOWN.menu) ? 'menu' : G.room.type === 'town' ? 'hub' : 'combat';
  help.hidden = !['hub', 'combat'].includes(context);
  const state = context + (online ? ':coop' : '');
  if (help.dataset.context === state) return;
  help.dataset.context = state;
  help.textContent = {
    title: `鼠标点击 / W、S 或方向键选择 · Enter / E 确认 · 左右调整设置 · Esc 返回 · ${FULLSCREEN_KEY} 全屏 · N 静音`,
    hub: `WASD 移动 · E 与附近居民 / 建筑交互 · J 任务追踪 · 前往法阵出征 · Tab 属性 · Esc 暂停 · ${FULLSCREEN_KEY} 全屏 · N 静音`,
    menu: `鼠标点击 / 方向键选择 · E / Enter 确认 · J 任务追踪 · Esc 返回 · ${FULLSCREEN_KEY} 全屏 · N 静音`,
    map: '点击已解锁房间传送 · 方向键选择 / E 确认 · 滚轮查看详情 · M / Esc 关闭 · ' + (online ? '联机战斗继续，房主带队传送' : '查看地图时战斗暂停'),
    story: '鼠标点击继续 / E / Enter 交谈 · 左方向键回看 · Esc 暂时离开 · 读完确认后推进任务',
    journal: '方向键 / 鼠标选择任务 · E / Enter 追踪目标 · J / Esc 返回 · ' + (online ? '联机战斗继续，请留意周围' : '查看任务时战斗暂停'),
    combat: `WASD 移动 · 鼠标瞄准 / 点按松手普攻 / 长按蓄力 · 空格闪避 · E 互动 · M 地图 · J 任务 · Tab 装备 · Esc 暂停 / 返回 · ${FULLSCREEN_KEY} 全屏 · N 静音`,
  }[context];
}
function drawTownHeader() {
  withUIOffset(LW - BASE_W, 0, () => {
  panel(224, 3, 314, 17, '#16202b', '#36556c', 1);
  // Keep the original pixel crystal above the opaque town HUD panel.
  hg.fillStyle = '#7ad8ff'; hg.fillRect(232 * U, 8 * U, 3 * U, 5 * U);
  hg.fillStyle = '#c8f0ff'; hg.fillRect(233 * U, 7 * U, U, 7 * U);
  T(`魂晶 ${META.souls}`, 308, 10.5, 7, '#9ae0ff', 'right');
  });
}
function drawTownLabels(cx, cy) {
  if (TOWN.menu || TOWN.launch) return;
  for (const b of TOWN_BUILDINGS) {
    const x = b.x + b.w / 2 + cx, y = b.y + b.h - 6 + OY + cy;
    if (x > -30 && x < LW + 30 && y > OY + 3 && y < LH - 4) T(b.sign, x, y, 4, '#ffe8bb');
  }
  for (const o of TOWN_PROPS) if (o.menu) {
    const near = dist(G.player.x, G.player.y, o.x, o.y + 6) < 22, y = o.y + OY + cy + 7, x = o.x + cx;
    if (x < 28 || x > LW - 28 || y < OY + 7 || y > LH - 13) continue;
    if (!near) { T(o.name, o.x + cx, y, 4.5, '#e8dcc8', 'center', 0.85); T(o.role, o.x + cx, y + 5.5, 4, o.col, 'center', 0.85); }
  }
  const dps = TOWN.hits.reduce((a, h) => a + h.n, 0) / 3;
  const x = TRAINING.x + cx, y = TRAINING.y + OY + cy;
  if (x > 28 && x < LW - 28 && y > OY + 22 && y < LH - 12) {
    T('训练木桩', x, y + 8, 4.5, '#e8dcc8', 'center', .85);
    if (dps > 0) T(`DPS ${dps.toFixed(1)}`, x, y - 22, 5, '#ffd040', 'center');
  }
  const px = PORTAL.x + cx, py = PORTAL.y + OY + cy + 20;
  if (dist(G.player.x, G.player.y, PORTAL.x, PORTAL.y) >= 24 && px > 28 && px < LW - 28 && py > OY + 8 && py < LH - 8)
    T('出征法阵', px, py, 4.5, '#c8a0ff', 'center', .85);
  for (const sign of TOWN_SIGNS) if (sign.x + cx > 45 && sign.x + cx < LW - 45 && sign.y + OY + cy > OY + 5 && sign.y + OY + cy < LH - 8)
    T(sign.text, sign.x + cx, sign.y + OY + cy, 3.7, '#ffe6b0');
}
function drawTownMenu(m) {
  const k = easeOutCubic(clamp(TOWN.menuT / 0.18));
  uiBackdrop(`rgba(8,4,12,${0.62 * k})`);
  hg.save(); hg.globalAlpha = 1; hg.translate(0, (1 - k) * 8 * U);
  TOWN_MENU_UI[m].draw(1);
  drawTownStoryOffer(m);
  hg.restore();
}
function drawEnd() {
  UI_HITS.length = 0;
  const a = clamp(G.endT * 2), win = G.mode === 'win', col = win ? '#ffb432' : '#ff4058';
  uiBackdrop(`rgba(6,3,10,${0.72 * a})`);
  T(win ? '通关!' : '你倒下了', 160, 30, 20, col, 'center', a);
  if (a < 1) return;
  panel(50, 46, 270, 140, '#140c16', rgba(hexRGB(col), 0.7), 0.95);
  const tm = Math.floor(G.runTime), rows = [['到达', `${floorLabel()} ${chap().name}`], ['难度', curDiff().name], ['击败敌人', G.runKills], ['金币', G.gold],
    ['用时', `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`]];
  rows.forEach(([k, v], i) => { const al = clamp(G.endT * 3 - 1.5 - i * 0.25); T(k, 62, 56 + i * 9, 5.5, '#8a7f96', 'left', al); T(String(v), 160, 56 + i * 9, 6, '#e8dcc8', 'right', al); });
  // gear icons on the right
  equipList().forEach((it, i) => { const x = 178 + (i % 4) * 22, y = 52 + Math.floor(i / 4) * 22, al = clamp(G.endT * 3 - 2 - i * 0.12);
    panel(x, y, x + 19, y + 19, '#2a2026', TIERS[it.tier].col, al); hg.globalAlpha = al; bigIcon(itemIcon(it), x + 1.5, y + 1.5, 2, al); });
  hg.fillStyle = rgba(hexRGB(col), 0.3); hg.fillRect(58 * U, 96 * U, 204 * U, 0.6 * U);
  const sg = Math.round(G.soulGain * clamp((G.endT - 1.2) / 0.8));
  T(`魂晶  +${sg}`, 160, 106, 9, '#9ae0ff', 'center', clamp(G.endT * 2 - 2));
  const notes = [lv('soul') ? `含魂之共鸣 +${lv('soul') * 20}%` : '', curDiff().souls > 1 ? `${curDiff().name} ×${curDiff().souls}` : '', win ? `通关奖励 +${CONFIG.winSoulBonus}` : ''].filter(Boolean);
  T(notes.join('  ·  '), 160, 116, 5, '#6aa8c8', 'center', clamp(G.endT * 2 - 2.2));
  T(`当前魂晶 ${META.souls} · 回主城训练、培养武器与锻造`, 160, 126, 5, '#a096aa', 'center', clamp(G.endT * 2 - 2.4));
  const materials = workshopRunMaterials({ runKills: G.runKills, runSouls: G.runSouls, gfloor: G.gfloor, win });
  const delivery = WORKSHOP_MATERIALS.filter(m => materials[m.id] > 0).map(m => `${m.name} +${materials[m.id]}`).join(' · ');
  if (delivery) T(`带回材料：${delivery}`, 160, 135, 4.5, '#c4bba7', 'center', clamp(G.endT * 2 - 2.6));
  if (G.endT > 1.2 && Math.floor(G.time * 2) % 2) T('按任意键 / 点击返回主城', 160, 156, 7.5, '#fff0c8');
}
