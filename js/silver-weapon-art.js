'use strict';
// Each chosen part has a visible place on the assembled weapon, in previews and in combat.
function drawSilverWeaponLegacy(it, hx, hy, ang, sc = 1, ctx = g) {
  const r = it && it.recipe; if (!r) return;
  const part = slot => FORGE_PARTS[slot].find(p => p.id === r[slot]);
  const head = part('head'), grip = part('grip'), core = part('core'), rune = part('rune');
  if (!head || !grip || !core || !rune) return;
  const hi = FORGE_PARTS.head.indexOf(head), gi = FORGE_PARTS.grip.indexOf(grip), ri = FORGE_PARTS.rune.indexOf(rune);
  const c = Math.cos(ang), s = Math.sin(ang), steel = '#e7eff5', shadow = '#344052';
  const dot = (a, b, col, size = 1) => {
    ctx.fillStyle = col; ctx.fillRect(Math.round(hx + (c * a - s * b) * sc), Math.round(hy + (s * a + c * b) * sc), Math.max(1, size * sc), Math.max(1, size * sc));
  };
  const rod = (from, to, col, across = 0) => { for (let i = from; i <= to; i++) dot(i, across, col); };
  const L = (WLEN[r.type] || 12) + (hi % 3), long = ['spear', 'staff', 'hammer', 'axe'].includes(r.type);
  if (r.type === 'bow') {
    for (let a = -1.3; a <= 1.3; a += .14) {
      const x = Math.cos(a) * 7, y = Math.sin(a) * 7;
      dot(x, y, head.col); dot(x + 1, y, steel);
      if (hi % 2) dot(x + 2, y, shadow);
    }
    for (let i = -6; i <= 6; i++) dot(1.5, i, '#cbdbe6');
    rod(4, 7, grip.col); dot(6, 0, core.col, 2);
    dot(5, -4, rune.col); dot(5, 4, rune.col);
  } else {
    const handle = long ? L - (r.type === 'staff' ? 2 : 4) : 3;
    rod(0, L, shadow); rod(0, handle, grip.col);
    for (let i = 0; i <= handle; i += 2 + gi % 2) dot(i, -1, steel);
    if (['sword', 'dagger', 'spear'].includes(r.type)) {
      rod(handle + 1, L, head.col); rod(handle + 1, L - 1, steel, -1); dot(L + 1, 0, steel);
      if (hi >= 2) rod(handle + 2, L - 2, head.col, 1);
      if (r.type !== 'spear') for (let j = -2 - gi % 2; j <= 2 + gi % 2; j++) dot(handle, j, grip.col);
      else for (const j of [-1, 1]) { dot(L - 2, j, head.col); dot(L - 3, j, steel); }
    } else if (r.type === 'axe') {
      for (let i = L - 4; i <= L; i++) for (let j = 1; j <= 4; j++) dot(i, j, j === 4 ? steel : head.col);
      if (hi % 2) for (let i = L - 3; i < L; i++) for (let j = -3; j < 0; j++) dot(i, j, j === -3 ? steel : head.col);
    } else if (r.type === 'hammer') {
      for (let i = L - 3; i <= L; i++) for (let j = -3 - hi % 2; j <= 3 + hi % 2; j++)
        dot(i, j, i === L ? steel : j === 0 ? core.col : head.col);
    } else if (r.type === 'staff') {
      for (let j = -2; j <= 2; j++) { dot(L - 1 - Math.abs(j), j, head.col); dot(L + 1 - Math.abs(j), j, steel); }
      dot(L - 1, 0, core.col, 2); dot(L + 1, 0, core.col);
      if (hi % 2) { dot(L - 2, -3, rune.col); dot(L - 2, 3, rune.col); }
    }
    dot(1, -1, core.col, 2); dot(-1, 0, steel);
    const mark = r.type === 'staff' ? L - 4 : Math.max(handle + 2, L - 3);
    dot(mark, 0, rune.col); dot(mark - 1, -1, rune.col);
    if (ri % 2) dot(mark + 1, 1, rune.col);
    if (ri >= 2) dot(mark - 2, 0, rune.col);
  }
}
// The four-part recipes already in saves retain their exact silhouette. New fittings occupy
// separate physical locations rather than merely recolouring the same icon.
function drawSilverWeapon(it, hx, hy, ang, sc = 1, ctx = g) {
  const r = it && it.recipe && forgeRecipeNormalize(it.recipe);
  if (!r) return;
  if (['head', 'grip', 'core', 'rune'].every(slot => FORGE_PARTS[slot].findIndex(p => p.id === r[slot]) < 5) &&
      ['guard', 'pommel', 'shaft', 'edge', 'channel', 'socket'].every(slot => !r[slot] || r[slot] === 'none') &&
      (r.length === undefined || r.length === 2) && (r.weight === undefined || r.weight === 2) &&
      (r.balance === undefined || r.balance === 2) && (!r.dye || r.dye === 'original')) {
    drawSilverWeaponLegacy(it, hx, hy, ang, sc, ctx); return;
  }
  const parts = Object.fromEntries(FORGE_SLOTS.map(slot => [slot, FORGE_PARTS[slot].find(p => p.id === r[slot])]));
  const index = slot => Math.max(0, FORGE_PARTS[slot].indexOf(parts[slot]));
  const present = slot => parts[slot] && parts[slot].id !== 'none';
  const dye = typeof FORGE_DYES === 'undefined' ? null : FORGE_DYES.find(d => d.id === r.dye);
  const dyed = dye && dye.id !== 'original';
  const metal = dyed ? dye.col : parts.head.col;
  const shine = dyed ? dye.accent : '#edf4fa', dark = '#263344';
  const leather = parts.grip.col, core = parts.core.col, rune = parts.rune.col;
  const c = Math.cos(ang), s = Math.sin(ang);
  const dot = (a, b, col, size = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(hx + (c * a - s * b) * sc), Math.round(hy + (s * a + c * b) * sc), Math.max(1, size * sc), Math.max(1, size * sc));
  };
  const line = (a, b, col, across = 0) => { for (let x = Math.round(a); x <= Math.round(b); x++) dot(x, across, col); };
  const bar = (a, b, top, bottom, col) => {
    for (let x = Math.round(a); x <= Math.round(b); x++) for (let y = Math.round(top); y <= Math.round(bottom); y++) dot(x, y, col);
  };
  const jewel = (a, b, col, radius = 2) => {
    for (let y = -radius; y <= radius; y++) for (let x = -radius; x <= radius; x++)
      if (Math.abs(x) + Math.abs(y) <= radius) dot(a + x, b + y, Math.abs(x) + Math.abs(y) === radius ? dark : col);
    dot(a, b - 1, shine);
  };
  const length = [0.78, 0.89, 1, 1.11, 1.22][r.length === undefined ? 2 : r.length];
  const weight = [0.7, 0.85, 1, 1.2, 1.4][r.weight === undefined ? 2 : r.weight];
  const balance = (r.balance === undefined ? 2 : r.balance) - 2;
  const L = Math.max(r.type === 'dagger' ? 5 : 7, Math.round((WLEN[r.type] || 14) * length) + (index('head') % 3));
  const long = ['spear', 'staff', 'axe', 'hammer'].includes(r.type);
  const h = Math.min(L - 2, Math.max(2, r.type === 'staff' ? L - 4 : long ? L - 6 + balance : 4 + balance));
  const thick = Math.max(1, Math.ceil(weight * (r.type === 'dagger' ? 1 : 2)));
  const headStyle = index('head') % 4;

  if (r.type === 'bow') {
    // Head = bow limbs, shaft = arrow stock, edge = arrowhead, channel = bowstring.
    const span = Math.max(7, Math.round(8 * length)), bend = 5 + Math.round(weight * 2);
    for (let y = -span; y <= span; y++) {
      const a = 3 + Math.round(Math.sqrt(Math.max(0, 1 - y * y / (span * span))) * bend);
      for (let w = 0; w < Math.max(1, Math.round(weight)); w++) dot(a + w, y, metal);
      dot(a + Math.max(1, Math.round(weight)), y, shine);
      if ((y + span) % (2 + headStyle) === 0) dot(a - 1, y, parts.head.col);
    }
    for (let y = -span; y <= span; y++) dot(3, y, present('channel') ? parts.channel.col : '#d6c9af');
    bar(7 + balance, 9 + balance, -2, 2, leather); dot(8 + balance, -1, core); dot(8 + balance, 1, core);
    line(0, L + 2, present('shaft') ? parts.shaft.col : '#a08967', -2);
    for (const side of [-1, 1]) { dot(0, -2 + side, shine); dot(1, -2 + side, leather); }
    const tip = present('edge') ? parts.edge.col : metal;
    for (let x = L; x <= L + 3; x++) for (let y = -1; y <= 1; y++) if (x < L + 3 || !y) dot(x, y - 2, tip);
    if (present('guard')) {
      const reach = 2 + index('guard') % 3;
      bar(10 + balance, 11 + balance, -reach, reach, dyed ? metal : parts.guard.col); dot(11 + balance, -reach, shine);
    }
    if (present('pommel')) {
      line(5 - balance, 7 - balance, dark, span + 1); jewel(7 - balance, span + 1, parts.pommel.col, 1 + index('pommel') % 2);
    }
    if (present('socket')) {
      jewel(10, -span + 3, dyed ? metal : parts.socket.col, 2); dot(10, -span + 3, core, 1 + index('socket') % 2);
    }
    for (let y = -span + 2; y < span - 1; y += 4) dot(8, y, rune);
    if (present('shaft')) for (let x = 2; x < L - 1; x += 3) dot(x, -3, parts.shaft.col);
    if (present('channel')) for (let y = -span; y <= span; y += 3) dot(2, y, parts.channel.col);
    return;
  }

  // A continuous stock is built first; grips, fittings and mechanisms are layered onto it.
  line(-1, L, dark); line(0, Math.max(2, h), leather);
  for (let a = 0; a <= h; a += 2 + index('grip') % 3) dot(a, -1, index('grip') % 2 ? shine : dark);
  if (present('shaft')) {
    const shaftCol = parts.shaft.col;
    line(2, Math.max(3, h - 1), shaftCol, 1);
    for (let a = 2; a < h; a += 3 + index('shaft') % 2) { dot(a, -1, metal); dot(a, 1, shine); }
    if (index('shaft') % 3 === 1) line(3, h - 2, shaftCol, -2);
    if (index('shaft') % 3 === 2) for (let a = 3; a < h; a += 4) dot(a, 2, shaftCol);
  }

  if (['sword', 'dagger'].includes(r.type)) {
    for (let a = h + 1; a <= L; a++) {
      const width = a > L - 2 ? Math.max(0, thick - (a - L + 2)) : thick;
      for (let b = -width; b <= width; b++) dot(a, b, b === -width ? shine : b === width ? dark : metal);
      if (headStyle === 1 && a % 3 === 0) dot(a, thick + 1, metal);
      if (headStyle === 2 && a < L - 1) dot(a, -thick - 1, metal);
      if (headStyle === 3 && a > h + 2 && a < L - 1) dot(a, thick + 1, parts.head.col);
    }
    dot(L + 1, 0, shine);
  } else if (r.type === 'spear') {
    const start = Math.max(h + 1, L - 6), span = 2 + Math.round(weight * 2);
    for (let a = start; a <= L + 2; a++) {
      const width = Math.max(0, span - Math.abs(a - (L - 2)));
      for (let b = -width; b <= width; b++) dot(a, b, b === -width ? shine : b === width ? dark : metal);
    }
    if (headStyle % 2) for (const side of [-1, 1]) {
      line(L - 5, L, metal, side * span); dot(L, side * span, shine); dot(L - 6, side, metal);
    }
    if (headStyle === 3) for (let a = L - 4; a < L; a++) dot(a, span + 1, parts.head.col);
  } else if (r.type === 'axe') {
    const span = 3 + Math.round(weight * 2), lower = headStyle % 2 ? -span : -1;
    for (let a = L - 5; a <= L + 1; a++) for (let b = lower; b <= span; b++) {
      if (a === L - 5 && Math.abs(b) > 1 || a === L + 1 && Math.abs(b) < span - 1) continue;
      dot(a, b, Math.abs(b) === span ? shine : a === L - 5 ? dark : metal);
    }
    if (headStyle >= 2) for (let a = L - 3; a < L; a++) dot(a, span + 1, metal);
  } else if (r.type === 'hammer') {
    const span = 2 + Math.round(weight * 2), a = L - 4;
    bar(a, L + 1, -span, span, metal); line(a, L + 1, shine, -span); line(a, L + 1, dark, span);
    if (headStyle === 1 || headStyle === 3) for (const side of [-1, 1]) for (let b = 0; b < 3; b++) dot(L - 1 - b, side * (span + 1 + b % 2), shine);
    if (headStyle >= 2) { bar(L - 3, L - 2, -span + 1, span - 1, dark); dot(L - 2, 0, core); }
  } else if (r.type === 'staff') {
    const radius = 2 + Math.round(weight * 2), tip = L - 1;
    for (let b = -radius; b <= radius; b++) {
      const a = tip - Math.round(Math.abs(b) / 2);
      dot(a, b, metal); dot(a + 2, b, shine);
      if (headStyle % 2 && Math.abs(b) > radius - 2) dot(a - 1, b + Math.sign(b), metal);
    }
    jewel(tip + 1, 0, core, 2 + headStyle % 2); dot(tip + 1, -1, shine);
    if (headStyle >= 2) { dot(tip - 1, -radius - 1, rune); dot(tip - 1, radius + 1, rune); }
  }

  // Guard, pommel, cutting edge, energy groove and sockets remain independently recognisable.
  if (present('guard')) {
    const at = Math.min(h, L - 4), width = 3 + index('guard') % 4;
    for (let b = -width; b <= width; b++) {
      const a = at + (index('guard') % 2 ? Math.floor(Math.abs(b) / 2) : 0);
      dot(a, b, dyed ? metal : parts.guard.col); if (Math.abs(b) === width) dot(a + 1, b, shine);
    }
    if (index('guard') % 3 === 0) { dot(at - 1, -width, parts.guard.col); dot(at - 1, width, parts.guard.col); }
    for (let a = 1; a <= Math.floor(index('guard') / 4); a++) { dot(at - a, -width - 1, parts.guard.col); dot(at - a, width + 1, parts.guard.col); }
  }
  if (present('pommel')) {
    const radius = Math.max(1, 2 + Math.round((2 - balance) / 2) + index('pommel') % 2);
    jewel(-2, 0, dyed ? metal : parts.pommel.col, Math.min(4, radius));
    if (index('pommel') % 3 === 1) { dot(-3, -radius - 1, parts.pommel.col); dot(-3, radius + 1, parts.pommel.col); }
    if (index('pommel') % 3 === 2) { line(-5, -3, parts.pommel.col, 1); dot(-5, 2, rune); }
  }
  if (present('edge')) {
    const col = parts.edge.col, style = index('edge') % 3;
    const start = ['axe', 'hammer', 'staff'].includes(r.type) ? L - 4 : h + 2;
    const offset = r.type === 'axe' ? 4 + Math.round(weight * 2) : thick + 1;
    for (let a = start; a <= L; a++) {
      dot(a, -offset, col);
      if (style === 1 && a % 2 === 0) dot(a, -offset - 1, shine);
      if (style === 2 && a % 3 === 0) dot(a + 1, offset, col);
    }
    for (let a = 0; a < Math.floor(index('edge') / 4); a++) dot(L - 2 - a * 2, -offset - 2, col);
  }
  if (present('channel')) {
    const col = parts.channel.col, style = index('channel') % 3;
    for (let a = Math.max(2, h + 1); a <= L - 1; a++) {
      const off = style === 1 ? (a % 3 === 0 ? 1 : 0) : -1;
      dot(a, off, col); if (style === 2 && a % 3 === 0) dot(a, 1, col);
    }
    if (long) for (let a = 3; a < h; a += 3) dot(a, 0, col);
  }
  const coreAt = r.type === 'staff' ? L - 6 : Math.min(h - 1, 3);
  const coreStyle = index('core'), coreRadius = 1 + Math.floor(coreStyle / 4);
  if (coreStyle % 4 === 0) jewel(coreAt, 0, core, coreRadius);
  else if (coreStyle % 4 === 1) {
    bar(coreAt - coreRadius, coreAt + coreRadius, -coreRadius, coreRadius, dark);
    bar(coreAt - coreRadius + 1, coreAt + coreRadius - 1, -coreRadius + 1, coreRadius - 1, core);
    dot(coreAt - coreRadius, -coreRadius, shine);
  } else if (coreStyle % 4 === 2) {
    jewel(coreAt - 1, -1, core, coreRadius); jewel(coreAt + 1, 1, core, coreRadius);
  } else {
    for (let b = -coreRadius - 1; b <= coreRadius + 1; b++) { dot(coreAt, b, core); dot(coreAt + 1, b, Math.abs(b) === coreRadius + 1 ? dark : shine); }
  }
  if (present('socket')) {
    const at = r.type === 'staff' ? L - 3 : Math.min(L - 4, h + 3), side = index('socket') % 2 ? 1 : -1;
    jewel(at, side * (thick + 2), dyed ? metal : parts.socket.col, 2);
    dot(at, side * (thick + 2), core);
    if (index('socket') % 3 === 0) { dot(at - 2, side * (thick + 2), parts.socket.col); dot(at + 2, side * (thick + 2), parts.socket.col); }
  }
  // Fittings must leave an actual graspable strip. The wrapping seam and strap also make
  // all twelve grips distinguishable when a large pommel and core occupy the short handle.
  bar(0, 1, -1, 1, leather); dot(0, -1, shine);
  const wrapY = 2 + Math.floor(index('grip') / 4);
  for (let a = 0; a <= index('grip') % 4; a++) dot(-a, wrapY, leather);
  dot(-(index('grip') % 4), wrapY + 1, index('grip') % 2 ? shine : leather);
  const mark = r.type === 'staff' ? L - 7 : Math.max(h + 2, L - 3);
  dot(mark, 0, rune); dot(mark - 1, -1, rune);
  if (index('rune') % 2) dot(mark + 1, 1, rune);
  if (index('rune') >= 2) dot(mark - 2, 0, rune);
  if (present('shaft')) {
    // Keep the connector visible even on a short dagger with a large core and socket fitted.
    const side = present('socket') && index('socket') % 2 ? -1 : 1;
    const links = Math.floor(index('shaft') / 4);
    for (let b = 3; b <= 3 + links; b++) dot(Math.max(1, h - 2), side * b, parts.shaft.col);
    dot(Math.max(1, h - 2), side * (4 + links), metal);
  }
}
const SILVER_ORIGINAL_DRAW = drawEquippedWeapon;
drawEquippedWeapon = function (it, kind, hx, hy, ang, cols, sc) {
  if (it && it.silver && it.recipe) return drawSilverWeapon(it, hx, hy, ang, sc);
  return SILVER_ORIGINAL_DRAW(it, kind, hx, hy, ang, cols, sc);
};
