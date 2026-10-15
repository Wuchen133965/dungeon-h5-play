'use strict';
// ============================================================ constants
const BASE_W = 320, BASE_H = 180, OY = 0, HUD_H = 20;
let LW = BASE_W, LH = BASE_H;              // expanded local viewport; world coordinates remain unchanged
const TS = 16, RW = 28, RH = 14;            // tile size, larger dungeon room grid
const RPW = RW * TS, RPH = RH * TS;         // world room size in px (448 x 224)
let VIEW_H = LH;                          // HUD overlays the world; no reserved top strip
const ROOM_BEAM_RANGE = Math.hypot(RPW, RPH);
const TIERS = [
  { name: '普通', col: '#d8cbb0', rgb: [216, 203, 176] },
  { name: '稀有', col: '#4696ff', rgb: [70, 150, 255] },
  { name: '史诗', col: '#b45aff', rgb: [180, 90, 255] },
  { name: '传说', col: '#ffb432', rgb: [255, 180, 50] },
];

// ============================================================ math / rng
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (u, k = 1.7) => { u -= 1; return 1 + (k + 1) * u * u * u + k * u * u; };
const easeOutCubic = u => 1 - Math.pow(1 - u, 3);
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const norm = v => { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; };
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
function mulberry32(s) {
  return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
let rand = mulberry32((Date.now() ^ 0x5bd1e995) >>> 0);
const rnd = (a = 0, b = 1) => a + (b - a) * rand();
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(rand() * arr.length)];
const hash2 = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
const rgba = (rgb, a = 1) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// ============================================================ desktop keyboard / mouse input
const Input = { keys: new Set(), pressed: new Set(), codes: new Set(), anyPressed: false,
  pointer: { x: 0, y: 0, clientX: 0, clientY: 0, active: false } };
const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'roll',
  KeyE: 'interact', Enter: 'confirm', KeyR: 'restart', KeyP: 'pause', Tab: 'pause',
  Escape: 'pause', KeyM: 'map', KeyN: 'mute', KeyJ: 'journal' };
function press(a) { if (!Input.keys.has(a)) Input.pressed.add(a); Input.keys.add(a); Input.anyPressed = true; }
function release(a, cancel = false) {
  if (a === 'attack' && Input.keys.has(a)) Input.pressed.add(cancel ? 'attackCancel' : 'attackUp');
  Input.keys.delete(a);
}
function consume(a) { if (Input.pressed.has(a)) { Input.pressed.delete(a); return true; } return false; }
function pulse(a) { Input.pressed.add(a); Input.anyPressed = true; }
function resetInput() { Input.keys.clear(); Input.pressed.clear(); if (typeof G !== 'undefined') cancelPlayerCharge(G.player); Input.codes.clear(); Input.anyPressed = false; }
const navPressed = () => consume('up') ? -1 : consume('down') ? 1 : 0;
const navXPressed = () => consume('left') ? -1 : consume('right') ? 1 : 0;
const backPressed = () => consume('pause');
const confirmPressed = () => consume('interact') || consume('confirm');
function moveVec() {
  let x = Number(Input.keys.has('right')) - Number(Input.keys.has('left'));
  let y = Number(Input.keys.has('down')) - Number(Input.keys.has('up'));
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  return { x, y };
}
const combatInput = () => G.mode === 'play' || (G.mode === 'town' && !TOWN.menu && !TOWN.launch);
// Cameras are local view state. Actors / projectiles always retain world coordinates.
function worldCamera(room = G.room, player = G.player) {
  if (!room || !player) return [0, 0];
  const width = room.canvas ? room.canvas.width : (room.w || RW) * TS;
  const height = room.canvas ? room.canvas.height : (room.h || RH) * TS;
  return [Math.round(width < LW ? (LW - width) / 2 : clamp(LW / 2 - player.x, LW - width, 0)),
    Math.round(height < VIEW_H ? (VIEW_H - height) / 2 : clamp(VIEW_H / 2 - player.y, VIEW_H - height, 0))];
}
function screenToWorld(x, y) { return { x: x - G.camOff[0], y: y - OY - G.camOff[1] }; }
function worldToScreen(x, y) { return { x: x + G.camOff[0], y: y + OY + G.camOff[1] }; }
function aimAtPointer(p) {
  const m = Input.pointer; if (!m.active) return;
  const point = screenToWorld(m.x, m.y), dx = point.x - p.x, dy = point.y - (p.y - 6);
  if (Math.hypot(dx, dy) > 1) p.face = Math.atan2(dy, dx);
}
// Rebuilt from visible controls each frame; the context guard prevents stale / covered controls firing.
const UI_HITS = [];
const UI_LAYOUT = { x: 0, y: 0, menu: false };
const uiMenuOffset = () => ({ x: (LW - BASE_W) / 2, y: (LH - BASE_H) / 2 });
function uiMenuPointer() {
  const offset = uiMenuOffset(), m = Input.pointer;
  return { ...m, x: m.x - offset.x, y: m.y - offset.y };
}
const uiContext = () => G.mode === 'town' ? TOWN.menu : G.mode === 'choice' ? G.choice : G.mode === 'chest' ? G.cine : G.mode;
function uiHit(x0, y0, x1, y1, click) {
  if (x1 <= x0 || y1 <= y0 || (G.mode === 'town' && TOWN.menu && TOWN.menuT < 0.18)) return false;
  x0 += UI_LAYOUT.x; x1 += UI_LAYOUT.x; y0 += UI_LAYOUT.y; y1 += UI_LAYOUT.y;
  UI_HITS.push({ x0, y0, x1, y1, click, mode: G.mode, context: uiContext() });
  const m = Input.pointer;
  return m.active && m.x >= x0 && m.x <= x1 && m.y >= y0 && m.y <= y1;
}
function pointerHit() {
  const m = Input.pointer;
  return m.active && UI_HITS.findLast(h => h.mode === G.mode && h.context === uiContext() &&
    m.x >= h.x0 && m.x <= h.x1 && m.y >= h.y0 && m.y <= h.y1);
}
function syncPointer() {
  const m = Input.pointer; if (!m.active) return;
  const r = document.getElementById('stage').getBoundingClientRect();
  m.x = (m.clientX - r.left) * LW / r.width; m.y = (m.clientY - r.top) * LH / r.height;
  if (m.x < 0 || m.x > LW || m.y < 0 || m.y > LH) m.active = false;
}
function pauseOnBlur() {
  resetInput(); Input.pointer.active = false;
  if (['play', 'town', 'chest', 'choice', 'shrine'].includes(G.mode)) { G.pmode = G.mode; G.mode = 'pause'; }
}
function initDesktopInput() {
  const stage = document.getElementById('stage');
  addEventListener('keydown', e => {
    const inputTarget = e.target;
    if (e.isComposing || inputTarget && (inputTarget.tagName === 'INPUT' || inputTarget.tagName === 'TEXTAREA' || inputTarget.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return; // preserve browser shortcuts
    audioInit();
    if (e.code === 'KeyF') {
      e.preventDefault();
      if (!e.repeat) {
        titleMenuToggleFullscreen();
      }
      return;
    }
    const a = KEYMAP[e.code];
    if (a) { e.preventDefault(); if (!e.repeat) { Input.codes.add(e.code); press(a); } }
    else if (!e.repeat) Input.anyPressed = true;
  });
  addEventListener('keyup', e => {
    Input.codes.delete(e.code); const a = KEYMAP[e.code];
    if (a && ![...Input.codes].some(c => KEYMAP[c] === a)) release(a);
  });
  const track = e => {
    if (e.pointerType !== 'mouse') return;
    Object.assign(Input.pointer, { clientX: e.clientX, clientY: e.clientY, active: true }); syncPointer();
  };
  stage.addEventListener('pointermove', track);
  stage.addEventListener('wheel', e => {
    const menu = typeof TOWN_MENU_UI !== 'undefined' && TOWN_MENU_UI[TOWN.menu];
    if (e.ctrlKey || e.metaKey || G.mode !== 'town' || !menu || !menu.wheel || TOWN.menuT < 0.18) return;
    Object.assign(Input.pointer, { clientX: e.clientX, clientY: e.clientY, active: true }); syncPointer();
    menu.wheel(e);
  }, { passive: false });
  stage.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; Input.pointer.active = false; release('attack', true); Input.pressed.delete('attack'); });
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    e.preventDefault(); audioInit(); track(e);
    const hit = pointerHit();
    if (hit) { hit.click(); return; }
    if (G.mode === 'title') return;
    if (G.mode === 'dead' || G.mode === 'win') { Input.anyPressed = true; return; }
    if (combatInput() && Input.pointer.y >= OY) press('attack');
  });
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0) release('attack'); });
  addEventListener('pointercancel', e => { if (e.pointerType !== 'mouse') return; release('attack', true); Input.pressed.delete('attack'); });
  stage.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('blur', pauseOnBlur);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseOnBlur(); });
  document.addEventListener('fullscreenchange', resize);
}
