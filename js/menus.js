'use strict';
// ============================================================ framed NPC menus: talent tree, smith shop, world map, hero stele
// shared widgets ---------------------------------------------------------------
const keyLabel = k => k;
function keycap(k, x, y, size = 5) {                 // small key glyph, returns its width
  const s = keyLabel(k), w = Math.max(size * 1.6, tw(s, size) + size * 1.1);
  panel(x, y - size * 0.9, x + w, y + size * 0.9, '#3a3044', '#b0a4b8', 1);
  hg.fillStyle = 'rgba(0,0,0,0.45)'; hg.fillRect((x + 1) * U, (y + size * 0.9 - 1.2) * U, (w - 2) * U, 0.7 * U);
  T(s, x + w / 2, y - 0.2, size, '#fff6e0');
  return w;
}
function hints(list, y = 172, cx = 160) {             // centred row of [key, label]
  if (typeof MOBILE_INPUT !== 'undefined' && MOBILE_INPUT.enabled) {
    // Touch menus have direct item/action buttons and one visible close control.
    // Keep abandoning an adventure accessible without displaying keyboard glyphs.
    const abandon = list.find(([key]) => key === 'R');
    const previous = TOWN.dialogue?.page > 0 && list.some(([key]) => key === '←');
    const extra = abandon ? { label: abandon[1], action: 'restart' } : previous ? { label: '上一页', action: 'left' } : null;
    if (extra) {
      const w = tw(extra.label, 5) + 14, hover = uiHit(cx - w / 2, y - 5, cx + w / 2, y + 5, () => pulse(extra.action));
      panel(cx - w / 2, y - 5, cx + w / 2, y + 5, '#2a1821', '#985e65');
      T(extra.label, cx, y, 5, hover ? '#fff0d8' : '#d7a0a7');
    }
    return;
  }
  const size = 5, gap = 8;
  const ws = list.map(([k, l]) => Math.max(size * 1.6, tw(keyLabel(k), size) + size * 1.1) + 2.5 + tw(l, size));
  let x = cx - (ws.reduce((a, b) => a + b, 0) + gap * (list.length - 1)) / 2;
  list.forEach(([k, l], i) => {
    const action = { E: 'confirm', Esc: 'pause', 'Tab / Esc': 'pause', R: 'restart' }[k];
    if (action) uiHit(x, y - 5, x + ws[i], y + 5, () => pulse(action));
    const w = keycap(k, x, y, size); T(l, x + w + 2.5, y, size, '#c8bcd0', 'left'); x += ws[i] + gap; });
}
// window: dark body, coloured rim, faint inner rim, corner rivets, title plate on the top edge
function frame(x0, y0, x1, y1, title, col, k = 1) {
  panel(x0, y0, x1, y1, '#140c16', col, 0.97 * k);
  panel(x0 + 2, y0 + 2, x1 - 2, y1 - 2, '#140c16', rgba(hexRGB(col), 0.22), 0.97 * k);
  hg.fillStyle = col; for (const [x, y] of [[x0 + 3, y0 + 3], [x1 - 5, y0 + 3], [x0 + 3, y1 - 5], [x1 - 5, y1 - 5]]) hg.fillRect(x * U, y * U, 2 * U, 2 * U);
  const w = tw(title, 7) + 22;
  panel(160 - w / 2, y0 - 6, 160 + w / 2, y0 + 7, '#2a1a22', col, k);
  hg.fillStyle = col; hg.fillRect((160 - w / 2 + 4) * U, (y0 + 0.2) * U, 2 * U, 1 * U); hg.fillRect((160 + w / 2 - 6) * U, (y0 + 0.2) * U, 2 * U, 1 * U);
  T(title, 160, y0 + 0.5, 7, '#fff0d8', 'center', k);
}
function menuHeader(talk) {                           // NPC line on the left, soul count on the right
  T(`“${talk}”`, 12, 34, 5, '#a096aa', 'left');
  const w = tw(String(META.souls), 6.5);
  hg.fillStyle = '#7ad8ff'; hg.fillRect((305 - w - 6) * U, 31.5 * U, 3 * U, 5 * U); hg.fillStyle = '#c8f0ff'; hg.fillRect((305 - w - 5) * U, 31 * U, 1 * U, 6 * U);
  T(String(META.souls), 306, 34, 6.5, '#9ae0ff', 'right');
}
function toast(x, y) { if (TOWN.msgT > 0 && TOWN.msg) { const w = tw(TOWN.msg.s, 6) + 14, a = clamp(TOWN.msgT * 3);
  panel(x - w / 2, y - 6, x + w / 2, y + 6, '#100a12', TOWN.msg.col, 0.92 * a); T(TOWN.msg.s, x, y, 6, TOWN.msg.col, 'center', a); } }
function bigIcon(ic, x, y, s = 2, alpha = 1) { hg.imageSmoothingEnabled = false; hg.globalAlpha = alpha;
  hg.drawImage(ic.img, x * U, y * U, ic.w * s * U, ic.h * s * U); hg.globalAlpha = 1; }
function button(x0, y0, x1, y1, label, ok, col = '#82e68c') {
  const hover = ok && uiHit(x0, y0, x1, y1, () => pulse('confirm'));
  panel(x0, y0, x1, y1, hover ? '#3b4c2d' : ok ? '#24301e' : '#1e1622', ok ? col : '#4a4058', 1);
  if (ok) { hg.fillStyle = rgba(hexRGB(col), 0.18); hg.fillRect((x0 + 1.5) * U, (y0 + 1.5) * U, (x1 - x0 - 3) * U, 2 * U); }
  T(label, (x0 + x1) / 2, (y0 + y1) / 2 + 0.3, 6, ok ? '#f4ffe8' : '#8a7f96');
}
function lockGlyph(x, y, col = '#8a7f96') { hg.fillStyle = col; hg.fillRect((x - 2) * U, (y - 1) * U, 5 * U, 4 * U);
  hg.fillRect((x - 1.5) * U, (y - 4) * U, 1 * U, 3 * U); hg.fillRect((x + 1.5) * U, (y - 4) * U, 1 * U, 3 * U); hg.fillRect((x - 1.5) * U, (y - 4.5) * U, 4 * U, 1 * U); }

// ============================================================ talent tree (导师): radial web, pannable view centred on the selection
// view: the tree lives in its own space (origin = core, see talentPos). A 196x118 window at (11,41) follows the selected node.
const TV = { x0: 11, y0: 53, w: 196, h: 98 };
function talentState(t) { const L = lv(t.id); return L >= t.max ? 'max' : L > 0 ? 'learn' : talentOpen(t) ? 'open' : 'lock'; }
const talentCol = t => t.cls ? CLASSES[t.cls].col : t.col;
function drawTalentIcon(t, x, y, scale, alpha) {
  bigIcon(icon(...t.ic), x, y, scale, alpha);
  if (!t.keystone) return;
  const w = 8 * scale, mark = scale * U;
  hg.globalAlpha = alpha; hg.fillStyle = '#ffd060';
  for (const [dx, dy] of [[-scale, -scale], [w, -scale], [-scale, w], [w, w]])
    hg.fillRect((x + dx) * U, (y + dy) * U, mark, mark);
  hg.globalAlpha = 1;
}
const MENU_TALENT = {
  zoom(delta) {
    TOWN.tzoom = clamp((TOWN.tzoom || 0.7) * Math.pow(1.2, delta), 0.16, 1.3);
    UI_HITS.length = 0;
  },
  wheel(e) {
    const m = uiMenuPointer();
    if (!m.active || m.x < TV.x0 || m.x > TV.x0 + TV.w || m.y < TV.y0 || m.y > TV.y0 + TV.h || !e.deltaY) return;
    e.preventDefault(); this.zoom(e.deltaY < 0 ? 1 : -1);
  },
  // directional pick: nearest node whose direction from the current one is within ~70° of the input, linked nodes preferred
  nav(vx, vy) {
    const cur = TALENTS[TOWN.sel.talent], [cx, cy] = talentPos(cur), want = Math.atan2(vy, vx);
    let best = -1, bs = 1e9;
    TALENTS.forEach((t, i) => { if (t === cur) return; const [x, y] = talentPos(t), d = Math.hypot(x - cx, y - cy);
      const off = Math.abs(angDiff(want, Math.atan2(y - cy, x - cx))); if (off > 1.2) return;
      const sc = d * (1 + off * 1.6) * (TALENT_ADJ[cur.id].has(t.id) ? 0.7 : 1); if (sc < bs) { bs = sc; best = i; } });
    if (best >= 0) { TOWN.sel.talent = best; SFX.move(); }
  },
  ok() {
    const t = TALENTS[TOWN.sel.talent], c = talentCost(t);
    if (c === undefined) { townMsg('已满级', '#a096aa'); SFX.deny(); }
    else if (!talentOpen(t)) { townMsg(talentLockText(t), '#ff6070'); SFX.deny(); }
    else if (buyTalent(t)) { townMsg(`${t.name} 提升至 Lv.${lv(t.id)}`, '#82e68c'); SFX.buy(); recalcStats(); TOWN.pulse = { id: t.id, t: 0.5 };
      burst(64, 54, 24, ['#82e68c', '#d0ffb0', '#ffffff'], { sp: 70, life: 0.6, up: true }); }
    else { townMsg('魂晶不足', '#ff6070'); SFX.deny(); }
  },
  draw(k) {
    frame(6, 26, 314, 166, '导师 艾琳 · 天赋树', '#82e68c', k);
    menuHeader(TOWN.talk);
    const sel = TALENTS[TOWN.sel.talent], time = G.time, [sx, sy] = talentPos(sel);
    const zoom = TOWN.tzoom || 0.7;
    CLASS_IDS.forEach((cls, i) => {
      const C = CLASSES[cls], x = 11 + i * 33, on = sel.cls === cls;
      const hover = uiHit(x, 40, x + 31, 49, () => { TOWN.sel.talent = TALENTS.findIndex(t => t.id === 'cap_' + cls); TOWN.tzoom = 0.7; SFX.move(); });
      panel(x, 40, x + 31, 49, hover || on ? '#2a2030' : '#140c16', on ? C.col : '#3a3044', 1);
      T(C.name, x + 15.5, 44.5, 4.5, C.col);
    });
    // Follow the selected node at every depth; zooming out reveals the whole 10-ring tree.
    const tx = -sx * zoom, ty = -sy * zoom;
    TOWN.tcam = TOWN.tcam || { x: tx, y: ty }; TOWN.tcam.x = lerp(TOWN.tcam.x, tx, 0.25); TOWN.tcam.y = lerp(TOWN.tcam.y, ty, 0.25);
    const ox = TV.x0 + TV.w / 2 + TOWN.tcam.x, oy = TV.y0 + TV.h / 2 + TOWN.tcam.y;
    const P = t => { const [x, y] = talentPos(t); return [ox + x * zoom, oy + y * zoom]; };
    panel(TV.x0, TV.y0, TV.x0 + TV.w, TV.y0 + TV.h, '#0e0a12', '#3a3044', 1);
    hg.save(); hg.beginPath(); hg.rect((TV.x0 + 1) * U, (TV.y0 + 1) * U, (TV.w - 2) * U, (TV.h - 2) * U); hg.clip();
    // class sectors: faint wedges + names on the rim
    for (const c of CLASS_IDS) { const a = SECTOR[c] * Math.PI / 180, col = hexRGB(CLASSES[c].col);
      hg.fillStyle = rgba(col, 0.07); hg.beginPath(); hg.moveTo(ox * U, oy * U);
      hg.ellipse(ox * U, oy * U, 340 * zoom * U, 340 * zoom * 0.86 * U, 0, a - Math.PI / 6 + 0.02, a + Math.PI / 6 - 0.02); hg.closePath(); hg.fill();
      T(CLASSES[c].name, ox + Math.cos(a) * 340 * zoom, oy + Math.sin(a) * 340 * zoom * 0.86, 5.5, rgba(col, 0.9)); }
    for (let r = 1; r < RING_R.length; r++) { hg.strokeStyle = 'rgba(255,255,255,0.04)'; hg.lineWidth = U * 0.5; hg.beginPath(); hg.ellipse(ox * U, oy * U, RING_R[r] * zoom * U, RING_R[r] * zoom * 0.86 * U, 0, 0, Math.PI * 2); hg.stroke(); }
    // links
    hg.lineCap = 'round';
    for (const t of TALENTS) for (const o of t.link) { const O = TALENT_BY_ID[o], on = lv(t.id) > 0 && lv(o) > 0, half = lv(t.id) > 0 || lv(o) > 0;
      const [x0, y0] = P(t), [x1, y1] = P(O);
      hg.strokeStyle = on ? talentCol(t) : half ? 'rgba(200,190,210,0.45)' : '#2e2636'; hg.lineWidth = U * (on ? 1 : 0.7);
      hg.beginPath(); hg.moveTo(x0 * U, y0 * U); hg.lineTo(x1 * U, y1 * U); hg.stroke(); }
    // nodes
    for (const t of TALENTS) {
      const [cx, cy] = P(t), st = talentState(t), col = talentCol(t), L = lv(t.id), on = t === sel, big = t.cap || t.keystone || t.id === 'core' || t.r === 4;
      const rr = (big ? 7.5 : 6) * zoom, pulse = TOWN.pulse && TOWN.pulse.id === t.id && TOWN.pulse.t > 0 ? TOWN.pulse.t * 2 : 0;
      uiHit(Math.max(TV.x0 + 1, cx - rr), Math.max(TV.y0 + 1, cy - rr),
        Math.min(TV.x0 + TV.w - 1, cx + rr), Math.min(TV.y0 + TV.h - 1, cy + rr),
        () => { TOWN.sel.talent = TALENTS.indexOf(t); SFX.move(); });
      if (on) { const a = 0.6 + 0.4 * Math.sin(time * 6); panel(cx - rr - 2 - pulse, cy - rr - 2 - pulse, cx + rr + 2 + pulse, cy + rr + 2 + pulse, '#140c16', `rgba(255,255,255,${a})`, 1); }
      const border = st === 'max' ? '#ffd060' : st === 'learn' ? col : st === 'open' ? '#8a7f96' : '#2e2636';
      if (zoom < 0.4) { hg.fillStyle = border; hg.fillRect((cx - rr) * U, (cy - rr) * U, rr * 2 * U, rr * 2 * U); }
      else panel(cx - rr, cy - rr, cx + rr, cy + rr, st === 'lock' ? '#120c14' : st === 'open' ? '#1e1626' : '#2a1e2a', border, 1);
      if (zoom >= 0.4 && (st === 'learn' || st === 'max')) { hg.fillStyle = rgba(hexRGB(col), 0.2); hg.fillRect((cx - rr + 1.5) * U, (cy - rr + 1.5) * U, (rr * 2 - 3) * U, (rr * 2 - 3) * U); }
      drawTalentIcon(t, cx - 4 * (big ? 1.2 : 1) * zoom, cy - 4 * (big ? 1.2 : 1) * zoom, (big ? 1.2 : 1) * zoom, st === 'lock' ? 0.45 : st === 'open' ? 0.75 : 1);
      if (t.max > 1 && zoom >= 0.5) for (let j = 0; j < t.max; j++) { hg.fillStyle = j < L ? (st === 'max' ? '#ffd060' : col) : '#3a3044'; hg.fillRect((cx - t.max * 1.5 + j * 3 + 0.3) * U, (cy + rr + 1) * U, 2.2 * U, 1.2 * U); }
    }
    hg.restore();
    T(`${TALENTS.filter(t => lv(t.id) > 0).length}/${TALENTS.length} 已学`, 13, 157, 4.5, '#8a7f96', 'left');
    for (const [label, x, fn] of [['−', 92, () => this.zoom(-1)], ['总览', 110, () => { TOWN.sel.talent = 0; TOWN.tzoom = 0.16; }], ['+', 139, () => this.zoom(1)]]) {
      const w = label === '总览' ? 26 : 15, hover = uiHit(x, 153, x + w, 162, fn);
      panel(x, 153, x + w, 162, hover ? '#3a3044' : '#1a1220', '#6a5a78', 1); T(label, x + w / 2, 157.5, 5, '#e0d4c4');
    }
    T(`${Math.round(zoom * 100)}%`, 203, 157, 4.5, '#8a7f96', 'right');
    // detail panel
    const t = sel, L = lv(t.id), c = talentCost(t), st = talentState(t), col = talentCol(t);
    panel(212, 41, 308, 159, '#1a1220', rgba(hexRGB(col), 0.6), 1);
    panel(217, 46, 237, 66, '#2a1e2a', t.keystone ? '#ffd060' : col, 1); drawTalentIcon(t, 219, 48, 2, st === 'lock' ? 0.65 : 1);
    T(t.name, 242, 52, 6.5, '#fff0d8', 'left');
    T(`${t.route || (t.cls ? CLASSES[t.cls].name + '分支' : t.id === 'core' ? '核心' : '通用')}${t.keystone ? '·终极' : ''} · Lv.${L}/${t.max}`, 242, 61, 4.8, col, 'left');
    T('当前', 218, 74, 4.8, '#8a7f96', 'left'); talentText(L ? t.desc(L) : '未习得', 218, 81, L ? '#82e68c' : '#6a5f76');
    if (c !== undefined) { T('下一级', 218, 96, 4.8, '#8a7f96', 'left'); talentText(t.desc(L + 1), 218, 103, '#f0e8dc'); }
    if (t.cap) T(`套装效果见暂停界面的「职业套装」`, 218, 118, 4.2, '#8a7f96', 'left');
    if (!talentOpen(t)) T(talentLockText(t), 218, 124, 4.6, '#ff7080', 'left');
    const ok = c !== undefined && talentOpen(t) && META.souls >= c;
    button(218, 132, 302, 148, c === undefined ? '已满级' : !talentOpen(t) ? '未解锁' : `习得 · ${c} 魂晶`, ok);
    if (META.refund) {                                         // one-time notice (6 s) after the tree was rebuilt
      if (TOWN.refundEnd === undefined) TOWN.refundEnd = G.time + 6;
      TOWN.refundT = TOWN.refundEnd - G.time;
      const s = `天赋树已重做，返还魂晶 ${META.refund}`, w = tw(s, 5.5) + 14;
      panel(TV.x0 + TV.w / 2 - w / 2, TV.y0 + 4, TV.x0 + TV.w / 2 + w / 2, TV.y0 + 15, '#100a12', '#82e68c', 0.95); T(s, TV.x0 + TV.w / 2, TV.y0 + 9.5, 5.5, '#82e68c');
      if (TOWN.refundT <= 0) { META.refund = 0; saveMeta(); } }
    toast(110, 144);
    hints([['方向', '选择'], ['滚轮', '缩放'], ['E', '习得'], ['Esc', '离开']]);
  },
};
// Wrap by rendered width so full effects remain readable in the narrow detail column.
function talentText(s, x, y, col) {
  let line = '', row = 0;
  for (const char of s) {
    if (line && tw(line + char, 4.5) > 84) { T(line, x, y + row * 5.5, 4.5, col, 'left'); row++; line = ''; }
    line += char;
  }
  if (line) T(line, x, y + row * 5.5, 4.5, col, 'left');
}

// ============================================================ smith shop (铁匠铺): blueprints on wall racks, buy with souls
const SHOP_ROWS = [['weapon', '武器架'], ['armor', '护甲架'], ['boots', '鞋架'], ['trinket', '饰品柜']];
const shopGrid = () => SHOP_ROWS.map(([sl]) => lockedItems().filter(i => i.slot === sl));
const MENU_SHOP = {
  cur() { const g = shopGrid(), s = TOWN.sel.armory; const r = clamp(s.r || 0, 0, g.length - 1); return { g, r, c: clamp(s.c || 0, 0, g[r].length - 1) }; },
  nav(vx, vy) {
    const { g, r, c } = this.cur();
    if (vx) TOWN.sel.armory = { r, c: (c + vx + g[r].length) % g[r].length };
    if (vy) { const nr = (r + vy + g.length) % g.length; TOWN.sel.armory = { r: nr, c: Math.min(c, g[nr].length - 1) }; }
    SFX.move();
  },
  ok() {
    const { g, r, c } = this.cur(), it = g[r][c];
    if (isUnlocked(it)) { townMsg('已解锁，会出现在宝箱、商店与祭坛中', '#a096aa'); SFX.deny(); }
    else if (buyUnlock(it)) { townMsg(`解锁 ${it.name}`, TIERS[it.tier].col); SFX.buy(); SFX.slam(); TOWN.smithT = 0.6; shake(2); TOWN.pulse = { id: it.id, t: 0.5 };
      burst(232, 60, 26, ['#ffd060', '#ff8a30', '#ffffff'], { sp: 90, life: 0.5, up: true }); }
    else { townMsg('魂晶不足', '#ff6070'); SFX.deny(); }
  },
  draw(k) {
    frame(6, 26, 314, 166, '铁匠铺 · 布洛克', '#ffb060', k);
    menuHeader(TOWN.talk);
    const { g, r: sr, c: sc } = this.cur(), time = G.time, P = (x, y, w, h, col) => { hg.fillStyle = col; hg.fillRect(x * U, y * U, w * U, h * U); };
    // back wall: wooden planks
    P(11, 41, 194, 120, '#2a1a14');
    for (let i = 0; i < 12; i++) { P(11, 41 + i * 10, 194, 0.6, '#1a100c'); P(11 + ((i * 37) % 180), 41 + i * 10, 0.6, 10, '#1a100c'); }
    // The selected rack stays in a three-shelf viewport; extra categories never cover the footer.
    const rackOffset = clamp(sr - 1, 0, Math.max(0, g.length - 3));
    for (const [delta, y, label] of [[-1, 44, '▲'], [1, 155, '▼']]) if (delta < 0 ? rackOffset > 0 : rackOffset + 3 < g.length) {
      const arrowX = delta < 0 ? 195 : 20;
      uiHit(arrowX - 8, y - 4, arrowX + 9, y + 4, () => { TOWN.sel.armory = { r: delta < 0 ? rackOffset - 1 : rackOffset + 3, c: 0 }; SFX.move(); });
      T(label, arrowX, y, 4.5, '#c8a070');
    }
    g.slice(rackOffset, rackOffset + 3).forEach((row, rowIndex) => {
      const ri = rowIndex + rackOffset, y = 48 + rowIndex * 36;
      T(SHOP_ROWS[ri][1], 16, y - 3, 5, '#c8a070', 'left');
      P(14, y + 25, 188, 3, '#6a4a2a'); P(14, y + 25, 188, 0.8, '#9a7040'); P(14, y + 28, 188, 1.2, 'rgba(0,0,0,0.5)');   // shelf board
      for (const bx of [20, 196]) P(bx, y + 28, 2, 4, '#4a3220');                                                        // brackets
      // up to 5 items keep the classic 36px spacing; longer rows show a 7-wide window that scrolls with the selection
      const many = row.length > 5, vis = Math.min(row.length, 7), off = ri === sr ? clamp(sc - 3, 0, row.length - vis) : 0;
      const step = many ? 25 : 36, x0 = many ? 42 : 46;              // first plaque clears the row label on the left
      if (off > 0) { T('◀', 31, y + 13, 5, '#c8a070');
        uiHit(26, y + 6, 35, y + 20, () => { TOWN.sel.armory = { r: ri, c: off - 1 }; SFX.move(); }); }
      if (off + vis < row.length) { T('▶', 204, y + 13, 5, '#c8a070');
        uiHit(201, y + 6, 210, y + 20, () => { TOWN.sel.armory = { r: ri, c: off + vis }; SFX.move(); }); }
      row.slice(off, off + vis).forEach((it, j) => {
        const ci = off + j, x = x0 + j * step, on = ri === sr && ci === sc, un = isUnlocked(it), col = TIERS[it.tier].col;
        const pulse = TOWN.pulse && TOWN.pulse.id === it.id && TOWN.pulse.t > 0 ? TOWN.pulse.t : 0;
        if (on) { const a = 0.55 + 0.35 * Math.sin(time * 6); panel(x - 15, y - 1, x + 15, y + 33, 'rgba(0,0,0,0)', `rgba(255,230,160,${a})`, 1); }
        uiHit(x - 11, y + 3, x + 11, y + 36, () => { TOWN.sel.armory = { r: ri, c: ci }; SFX.move(); });
        // hook + display plaque in tier colour
        P(x - 0.5, y + 1, 1, 3, '#8a8e9e');
        panel(x - 11, y + 3, x + 11, y + 23, un ? '#2a2026' : '#1a1418', un ? col : rgba(hexRGB(col), 0.45), 1);
        bigIcon(itemIcon(it), x - 8, y + 5 - (on ? Math.round(Math.sin(time * 4)) : 0) - pulse * 4, 2, un ? 1 : 0.85);
        // price tag hanging under the shelf
        const tag = un ? '已拥有' : String(it.lock), tcol = un ? '#82e68c' : META.souls >= it.lock ? '#e8f8ff' : '#ff7080';
        const w = tw(tag, 4.5) + (un ? 5 : 9);
        P(x - 0.3, y + 28, 0.6, 2, '#c8b088');
        panel(x - w / 2, y + 30, x + w / 2, y + 36.5, un ? '#1e3020' : '#e8dcc0', un ? '#4a8a4a' : '#8a7050', 1);
        if (!un) { P(x - w / 2 + 2, y + 31.6, 1.6, 3.2, '#3a8ad8'); }
        T(tag, x + (un ? 0 : 1.5), y + 33.3, 4.5, un ? tcol : META.souls >= it.lock ? '#2a2030' : '#c02838');
      });
    });
    // detail card
    const it = g[sr][sc], un = isUnlocked(it), col = TIERS[it.tier].col;
    panel(210, 41, 309, 161, '#1a1220', rgba(hexRGB(col), 0.7), 1);
    panel(215, 46, 237, 68, '#2a2026', col, 1); bigIcon(itemIcon(it), 218, 49, 2);
    T(it.name, 242, 52, 7, col, 'left');
    panel(242, 57, 242 + tw(TIERS[it.tier].name, 4.5) + 6, 65, '#3a2410', col, 1); T(TIERS[it.tier].name, 245, 61.2, 4.5, '#fff0d0', 'left');
    T(SLOT_NAME[it.slot] + (it.cls ? ' · ' : ''), 250 + tw(TIERS[it.tier].name, 4.5), 61.2, 4.5, '#a096aa', 'left');
    if (it.cls) T(CLASSES[it.cls].name, 250 + tw(TIERS[it.tier].name, 4.5) + tw(SLOT_NAME[it.slot] + ' · ', 4.5), 61.2, 4.5, CLASSES[it.cls].col, 'left');
    itemDescriptionLines(it).forEach((s, i) => T(s, 216, 77 + i * 9, 5.2, lineCol(s), 'left'));
    T(un ? '已加入战利品池：宝箱 · 商店 · 祭坛' : '解锁后会出现在宝箱、商店与祭坛中', 216, 124, 4.5, '#8a7f96', 'left');
    button(216, 132, 303, 148, un ? '已拥有图纸' : `购买图纸 · ${it.lock} 魂晶`, !un && META.souls >= it.lock, '#ffb060');
    toast(108, 158);
    hints([['方向', '选择'], ['E', '购买'], ['Esc', '离开']]);
  },
};

// world map (出征法阵) lives in worldmap.js

// ============================================================ hero stele (英灵碑): run records + browsable gear codex
// grouped by class (neutral last), then slot, then tier; a thin class-coloured bar under each cell
const SLOT_ORDER = { weapon: 0, armor: 1, boots: 2, trinket: 3 };
let CODEX = null;
const codexItems = () => (CODEX || (CODEX = ITEMS.filter(i => i.slot !== 'use').map((it, i) => [it, i])
  .sort(([a, i], [b, j]) => (CLASS_IDS.indexOf(a.cls) + 1 || 99) - (CLASS_IDS.indexOf(b.cls) + 1 || 99) || SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot] || a.tier - b.tier || i - j)
  .map(([it]) => it))).concat(typeof forgeLootItems === 'function' ? forgeLootItems() : []);
const CODEX_COLS = 20, CODEX_CELL = 10.5;
const CODEX_VIEW = { x: 86, y: 52, rows: 4 };
const codexMaxRow = () => Math.max(0, Math.ceil(codexItems().length / CODEX_COLS) - CODEX_VIEW.rows);
const MENU_STELE = {
  reveal() {
    const row = Math.floor(TOWN.sel.stele / CODEX_COLS), top = TOWN.codexRow || 0;
    TOWN.codexRow = clamp(row < top ? row : row >= top + CODEX_VIEW.rows ? row - CODEX_VIEW.rows + 1 : top, 0, codexMaxRow());
    TOWN.codexWheel = 0;
  },
  scroll(rows) {
    const top = TOWN.codexRow || 0, next = clamp(top + rows, 0, codexMaxRow());
    if (next === top) return;
    TOWN.codexRow = next; UI_HITS.length = 0;
  },
  wheel(e) {
    const m = uiMenuPointer();
    if (!m.active || m.x < 84 || m.x > 309 || m.y < 40 || m.y > 105 || !e.deltaY) return;
    e.preventDefault();
    const pixels = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 120 : 1);
    if (Math.sign(pixels) !== Math.sign(TOWN.codexWheel || 0)) TOWN.codexWheel = 0;
    TOWN.codexWheel = (TOWN.codexWheel || 0) + pixels;
    const rows = Math.trunc(TOWN.codexWheel / 40);
    if (rows) { this.scroll(rows); TOWN.codexWheel %= 40; }
  },
  nav(vx, vy) {
    const n = codexItems().length, cur = TOWN.sel.stele, row = Math.floor(cur / CODEX_COLS);
    if (vy && (row + vy < 0 || row + vy >= Math.ceil(n / CODEX_COLS))) return;
    const s = vy ? Math.min(n - 1, cur + vy * CODEX_COLS) : cur + vx;
    if (s < 0 || s >= n) return;
    TOWN.sel.stele = s; this.reveal(); SFX.move();
  },
  ok() { TOWN.menu = null; },
  draw(k) {
    frame(6, 26, 314, 166, '英灵碑 · 战绩与图鉴', '#8ac8ff', k);
    menuHeader(TOWN.talk);
    const gear = codexItems(), seen = gear.filter(i => META.seenSet.has(i.id)).length;
    // regions opened (normal difficulty) across all acts that have content; act clears on any difficulty
    let regOpen = 0, regAll = 0, deep = '—';
    ACTS.forEach(a => { if (!a.regions.length) return; regAll += a.regions.length; const P = actProg(a.id);
      if (P.open) { regOpen += P.diff[0].reg; const b = Math.max(...P.diff.map(d => d.best)); if (b) deep = `${a.name} ${Math.ceil(b / CONFIG.floorsPerRegion)}-${(b - 1) % CONFIG.floorsPerRegion + 1}`; } });
    const tl = TALENTS.reduce((a, t) => a + lv(t.id), 0), tm = TALENTS.reduce((a, t) => a + t.max, 0);
    const rows = [['出征', META.runs], ['通关', META.wins], ['最深', deep], ['击杀', META.kills || 0], ['区域', `${regOpen}/${regAll}`],
      ['天赋', `${tl}/${tm}`], ['图纸', `${lockedItems().filter(isUnlocked).length}/${lockedItems().length}`], ['图鉴', `${seen}/${gear.length}`]];
    panel(11, 41, 79, 161, '#1a1220', '#3a4a68', 1);
    T('战绩', 45, 48, 6, '#8ac8ff');
    rows.forEach(([a, b], i) => { const y = 59 + i * 12.4; T(a, 17, y, 5.5, '#8a7f96', 'left'); T(String(b), 73, y, 6, '#f0e8dc', 'right');
      if (i < rows.length - 1) { hg.fillStyle = 'rgba(138,200,255,0.12)'; hg.fillRect(16 * U, (y + 6) * U, 58 * U, 0.5 * U); } });
    // Fixed viewport: 20 columns, four visible rows; details remain stationary below it.
    const cols = CODEX_COLS, sel = TOWN.sel.stele = clamp(TOWN.sel.stele, 0, gear.length - 1), cs = CODEX_CELL;
    const top = TOWN.codexRow = clamp(TOWN.codexRow || 0, 0, codexMaxRow()), totalRows = Math.ceil(gear.length / cols);
    T('装备图鉴', 86, 44, 5.5, '#8ac8ff', 'left');
    T(`${top + 1}–${Math.min(top + CODEX_VIEW.rows, totalRows)} / ${totalRows} 行`, 307, 44, 4.8, '#a096aa', 'right');
    panel(84, 49, 297, 96, '#100a14', '#3a3044', 1);
    const start = top * cols, end = Math.min(gear.length, (top + CODEX_VIEW.rows) * cols);
    for (let i = start; i < end; i++) {
      const it = gear[i], x = CODEX_VIEW.x + (i % cols) * cs, y = CODEX_VIEW.y + (Math.floor(i / cols) - top) * cs;
      const has = META.seenSet.has(it.id), on = i === sel;
      uiHit(x, y, x + cs - 0.8, y + cs - 0.8, () => { TOWN.sel.stele = i; SFX.move(); });
      panel(x, y, x + cs - 0.8, y + cs - 0.8, has ? '#2a2026' : '#120c14', on ? '#fff0c8' : has ? rgba(TIERS[it.tier].rgb, 0.8) : '#2a2232', 1);
      if (it.cls) { hg.fillStyle = rgba(hexRGB(CLASSES[it.cls].col), has ? 0.9 : 0.35); hg.fillRect((x + 0.8) * U, (y + cs - 2.2) * U, (cs - 2.4) * U, 0.7 * U); }
      if (has) bigIcon(itemIcon(it), x + 1, y + 0.7, 1); else T('?', x + cs / 2 - 0.4, y + cs / 2 - 0.2, 4.5, '#3a3044');
    }
    const maxRow = codexMaxRow();
    for (const [dir, y] of [[-1, 50], [1, 87]]) {
      const enabled = dir < 0 ? top > 0 : top < maxRow;
      const hover = enabled && uiHit(299, y, 309, y + 9, () => { this.scroll(dir); TOWN.codexWheel = 0; });
      panel(299, y, 309, y + 9, hover ? '#3a3044' : '#1a1220', enabled ? '#8ac8ff' : '#3a3044', 1);
      T(dir < 0 ? '▲' : '▼', 304, y + 4.5, 4.5, enabled ? '#8ac8ff' : '#4a4058');
    }
    panel(301, 61, 307, 85, '#100a14', '#3a3044', 1);
    const thumbH = Math.max(5, 22 * Math.min(1, CODEX_VIEW.rows / totalRows)), thumbY = 62 + (maxRow ? top / maxRow : 0) * (22 - thumbH);
    hg.fillStyle = '#8ac8ff'; hg.fillRect(302 * U, thumbY * U, 4 * U, thumbH * U);
    T('滚轮 / 右侧箭头上下滚动 · 点击装备查看详情', 86, 101, 4.5, '#8a7f96', 'left');
    const it = gear[sel], has = META.seenSet.has(it.id), y0 = 108;
    panel(86, y0, 309, 161, '#1a1220', has ? rgba(TIERS[it.tier].rgb, 0.6) : '#3a3044', 1);
    if (has) {
      const name = forgeItemName(it), quality = `${TIERS[it.tier].name} · ${SLOT_NAME[it.slot]}${it.cls ? ' · ' + CLASSES[it.cls].name : ''}${it.lock && !isUnlocked(it) ? ' · 需在铁匠铺解锁' : ''}`;
      let title = name;
      if (it.silver) {
        const width = 301 - 92 - tw(quality, 4.5) - 6;
        if (tw(title, 6.5) > width) {
          const chars = Array.from(title);
          while (chars.length && tw(chars.join('') + '…', 6.5) > width) chars.pop();
          title = chars.join('') + '…';
        }
      }
      T(title, 92, y0 + 7, 6.5, TIERS[it.tier].col, 'left');
      T(quality, it.silver ? 301 : 92 + tw(title, 6.5) + 6, y0 + 7.3, 4.5, it.cls ? CLASSES[it.cls].col : '#a096aa', it.silver ? 'right' : 'left');
      const lines = forgeItemLines(it), lh = Math.min(7, 34 / Math.max(1, lines.length));
      lines.forEach((l, i) => T(l, 92, y0 + 16 + i * lh, Math.min(4.8, lh * .85), lineCol(l), 'left')); }
    else T('尚未发现。在地牢中获得后会记录在此。', 92, y0 + 10, 5, '#6a5f76', 'left');
    hints([['方向', '浏览图鉴'], ['Esc', '离开']]);
  },
};
// TOWN_MENU_UI is assembled in worldmap.js (loaded after this file, defines MENU_MAP)
