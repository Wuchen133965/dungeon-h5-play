'use strict';
// Touch uses the same keys and world-space aim as keyboard/mouse and co-op prediction.
const MOBILE_INPUT = { enabled: false, nodes: null, pointers: new Map(), held: new Set(), context: '', aimOwned: false };
const MOBILE_BUTTONS = { roll: 'roll', interact: 'interact', attack: 'normalAttack', charge: 'attack', map: 'map', journal: 'journal',
  pause: 'pause' };
let menuBackNode = null;
function menuBackAction() {
  if (COOP_UI.open || G.trans || TOWN.launch || (typeof FORGE_UI !== 'undefined' && FORGE_UI.nameEdit)) return null;
  if (G.mode === 'title') return TITLE_MENU.page === 'main' ? null : { label: '返回', action: () => titleMenuActivate('back') };
  if (G.mode === 'town' && TOWN.menu) return { label: '关闭', action: () => pulse('pause') };
  if (G.mode === 'pause') return { label: '继续游戏', action: () => pulse('pause') };
  if (G.mode === 'choice' || G.mode === 'shrine') return { label: '返回', action: () => pulse('pause') };
  // Map, journal and the LAN panels already have their own clickable close controls.
  return null;
}
function updateMenuBack() {
  if (!menuBackNode) return;
  const back = menuBackAction(); menuBackNode.hidden = !back;
  if (back && menuBackNode.textContent !== back.label) {
    menuBackNode.textContent = back.label; menuBackNode.setAttribute('aria-label', back.label);
  }
}

function mobileEnable() {
  if (MOBILE_INPUT.enabled) return;
  MOBILE_INPUT.enabled = true; document.documentElement.dataset.mobile = 'true'; resize(); mobileInputUpdate();
}
function mobileSetKeys(next) {
  const m = MOBILE_INPUT;
  for (const action of m.held) if (!next.has(action)) {
    if (![...Input.codes].some(code => KEYMAP[code] === action)) release(action);
  }
  for (const action of next) if (!m.held.has(action)) press(action);
  m.held = next;
}
function mobileHeldKeys() {
  const keys = new Set();
  for (const p of MOBILE_INPUT.pointers.values()) {
    if (p.kind === 'button') keys.add(p.action);
    if (p.kind !== 'stick') continue;
    const length = Math.hypot(p.x, p.y);
    if (length < .22) continue;
    if (Math.abs(p.x) / length > .38) keys.add(p.x < 0 ? 'left' : 'right');
    if (Math.abs(p.y) / length > .38) keys.add(p.y < 0 ? 'up' : 'down');
  }
  return keys;
}
function mobileCancel() {
  const m = MOBILE_INPUT;
  for (const action of m.held) if (![...Input.codes].some(code => KEYMAP[code] === action)) Input.pressed.delete(action);
  if (m.held.has('attack')) release('attack', true);
  m.pointers.clear(); mobileSetKeys(new Set());
  if (m.aimOwned) Input.pointer.active = false;
  m.aimOwned = false;
  if (m.nodes) {
    m.nodes.knob.style.transform = '';
    m.nodes.stick.hidden = true;
    for (const action of Object.keys(MOBILE_BUTTONS)) m.nodes[action].dataset.held = 'false';
    m.nodes.charge.dataset.ready = 'false'; m.nodes.charge.textContent = '蓄力';
  }
}
function mobileInputUpdate() {
  updateMenuBack();
  const m = MOBILE_INPUT;
  if (!m.enabled || !m.nodes) return;
  const portrait = innerHeight > innerWidth, world = combatInput() && !G.trans && !COOP_UI.open && !portrait;
  const context = `${G.mode}:${TOWN.menu || ''}:${!!G.trans}:${COOP_UI.open}:${portrait}`;
  // A menu, room transition, blur or reset must release every finger; never replay held input on return.
  if (context !== m.context || [...m.held].some(action => !Input.keys.has(action) &&
      !(action === 'attack' && Input.pressed.has('attackUp')))) mobileCancel();
  m.context = context;
  m.nodes.root.hidden = portrait || COOP_UI.open; m.nodes.rotate.hidden = !portrait;
  m.nodes.stick.hidden = !world || ![...m.pointers.values()].some(p => p.kind === 'stick'); m.nodes.actions.hidden = !world;
  m.nodes.map.hidden = G.mode !== 'play' && G.mode !== 'map';
  m.nodes.journal.hidden = !world && G.mode !== 'journal';
  m.nodes.tools.hidden = !world;
  m.nodes.tip.hidden = !world;
  const tip = '长按攻击连发 · 蓄力松手释放';
  if (m.nodes.tip.textContent !== tip) m.nodes.tip.textContent = tip;
  const chargePlayer = coopRuntimeIsActive() && COOP.role === 'client' && COOP_VIEW.pred ? COOP_VIEW.pred : G.player;
  const charging = world && chargePlayer?.charging && m.held.has('attack'), ready = charging && chargePlayer.chargeT >= COMBAT_CHARGE.full;
  m.nodes.charge.dataset.ready = ready ? 'true' : 'false';
  const chargeLabel = ready ? '松手释放' : charging ? '蓄力中' : '蓄力';
  if (m.nodes.charge.textContent !== chargeLabel) m.nodes.charge.textContent = chargeLabel;
  if (!world || !G.player) return;
  const p = G.player, finger = [...m.pointers.values()].find(f => f.action === 'attack' || f.action === 'normalAttack');
  if (!finger) {
    // Keep the final aim until the ordered release has been consumed by the simulation.
    if (m.aimOwned && !Input.pressed.has('attackUp') && !Input.pressed.has('normalAttack')) { Input.pointer.active = false; m.aimOwned = false; }
    return;
  }
  let x, y;
  if (finger && Math.hypot(finger.dx, finger.dy) > 12) {
    const direction = norm({ x: finger.dx, y: finger.dy }); x = p.x + direction.x * 80; y = p.y - 6 + direction.y * 80;
  } else {
    const enemy = nearestEnemy(p.x, p.y - 6, Math.max(LW, VIEW_H)), mv = moveVec();
    const face = Math.hypot(mv.x, mv.y) ? Math.atan2(mv.y, mv.x) : p.face;
    x = enemy ? enemy.x : p.x + Math.cos(face) * 80;
    y = enemy ? enemy.y - enemy.h / 2 : p.y - 6 + Math.sin(face) * 80;
  }
  const point = worldToScreen(x, y), rect = document.getElementById('stage').getBoundingClientRect();
  Object.assign(Input.pointer, { x: point.x, y: point.y, clientX: rect.left + point.x * rect.width / LW,
    clientY: rect.top + point.y * rect.height / LH, active: true });
  m.aimOwned = true;
}

function initMobileInput() {
  const m = MOBILE_INPUT, node = id => document.getElementById('mobile-' + id);
  m.nodes = { root: node('controls'), rotate: node('rotate'), stick: node('stick'), knob: node('stick-knob'),
    actions: node('actions'), tools: node('tools'), tip: node('tip') };
  menuBackNode = document.getElementById('menu-back');
  menuBackNode.addEventListener('click', e => {
    const back = menuBackAction(); if (!back) return;
    e.preventDefault(); audioInit(); mobileCancel(); back.action(); updateMenuBack();
  });
  for (const action of Object.keys(MOBILE_BUTTONS)) m.nodes[action] = node(action);
  if (navigator.maxTouchPoints > 0 && matchMedia('(any-pointer: coarse)').matches) mobileEnable();
  const hold = (element, action) => element.addEventListener('pointerdown', e => {
    if (e.button !== 0 || element.hidden) return;
    e.preventDefault(); audioInit(); mobileEnable();
    if (['map', 'journal', 'pause'].includes(action)) { mobileCancel(); pulse(action); return; }
    if (['attack', 'normalAttack'].includes(action) && (Input.keys.has('attack') || Input.pressed.has('attackUp') ||
        [...m.pointers.values()].some(p => p.action === 'attack' || p.action === 'normalAttack'))) return;
    m.pointers.set(e.pointerId, { kind: 'button', action, element, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 });
    element.setPointerCapture(e.pointerId); element.dataset.held = 'true'; mobileSetKeys(mobileHeldKeys());
    if (action === 'normalAttack') mobileInputUpdate();
  });
  for (const [id, action] of Object.entries(MOBILE_BUTTONS)) {
    hold(m.nodes[id], action);
    m.nodes[id].addEventListener('click', e => { if (e.detail === 0) {
      audioInit(); mobileCancel();
      if (action === 'attack') { press('attack'); release('attack'); } else pulse(action);
    } });
  }
  const move = e => {
    const p = m.pointers.get(e.pointerId); if (!p) return;
    e.preventDefault();
    if (p.kind === 'stick') {
      p.x = (e.clientX - p.cx) / p.radius; p.y = (e.clientY - p.cy) / p.radius;
      const length = Math.max(1, Math.hypot(p.x, p.y)); p.x /= length; p.y /= length;
      m.nodes.knob.style.transform = `translate(${p.x * p.radius}px,${p.y * p.radius}px)`;
      mobileSetKeys(mobileHeldKeys());
    } else if (p.action === 'attack' || p.action === 'normalAttack') { p.dx = e.clientX - p.startX; p.dy = e.clientY - p.startY; }
    else if (p.kind === 'detail' && FLOOR_MAP.open) {
      const rect = document.getElementById('stage').getBoundingClientRect();
      FLOOR_MAP.scroll = clamp(FLOOR_MAP.scroll + (p.y - e.clientY) * LH / rect.height, 0, FLOOR_MAP.scrollMax); p.y = e.clientY;
    }
  };
  const up = e => {
    const p = m.pointers.get(e.pointerId); if (!p) return;
    if (p.action === 'attack' && e.type === 'pointerup') mobileInputUpdate();
    if (p.action === 'attack' && e.type !== 'pointerup') release('attack', true);
    m.pointers.delete(e.pointerId); mobileSetKeys(mobileHeldKeys());
    if (p.kind === 'stick') { m.nodes.knob.style.transform = ''; m.nodes.stick.hidden = true; }
    if (p.action) p.element.dataset.held = [...m.pointers.values()].some(f => f.action === p.action) ? 'true' : 'false';
    if (!m.held.has('attack') && !m.held.has('normalAttack') && m.aimOwned && !Input.pressed.has('attackUp') && !Input.pressed.has('normalAttack')) { Input.pointer.active = false; m.aimOwned = false; }
  };
  addEventListener('pointermove', move, { passive: false });
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  for (const element of [m.nodes.stick, ...Object.keys(MOBILE_BUTTONS).map(id => m.nodes[id])]) element.addEventListener('lostpointercapture', up);
  const stage = document.getElementById('stage');
  stage.addEventListener('lostpointercapture', up);
  stage.addEventListener('pointerdown', e => {
    if (!['touch', 'pen'].includes(e.pointerType) || COOP_UI.open) return;
    e.preventDefault(); audioInit(); mobileEnable();
    Object.assign(Input.pointer, { clientX: e.clientX, clientY: e.clientY, active: true }); syncPointer();
    const menuPoint = uiMenuPointer();
    const hit = pointerHit();
    if (hit) hit.click();
    else if (combatInput() && !G.trans && innerWidth >= innerHeight && e.clientX < innerWidth / 2 && Input.pointer.y > OY &&
        ![...m.pointers.values()].some(p => p.kind === 'stick')) {
      m.pointers.set(e.pointerId, { kind: 'stick', element: stage, cx: e.clientX, cy: e.clientY, radius: 38, x: 0, y: 0 });
      m.nodes.stick.style.left = (e.clientX - 56) + 'px'; m.nodes.stick.style.top = (e.clientY - 56) + 'px';
      m.nodes.stick.style.bottom = 'auto'; m.nodes.stick.hidden = false;
      stage.setPointerCapture(e.pointerId);
    }
    else if (G.mode === 'dead' || G.mode === 'win') Input.anyPressed = true;
    else if (FLOOR_MAP.open && menuPoint.x >= 213 && menuPoint.x <= 307 && menuPoint.y >= 72 && menuPoint.y <= 124) {
      m.pointers.set(e.pointerId, { kind: 'detail', y: e.clientY }); stage.setPointerCapture(e.pointerId);
    }
    Input.pointer.active = false;
  });
  addEventListener('blur', mobileCancel);
  addEventListener('resize', mobileCancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) mobileCancel(); });
  mobileInputUpdate();
}
const mobileOriginalDrawUI = drawUI;
drawUI = function () { mobileOriginalDrawUI(); mobileInputUpdate(); };
