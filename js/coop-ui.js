'use strict';
const COOP_UI = { open: false, confirmOnly: false, root: null, nodes: {}, refreshing: false, journal: false, t: 0, confirmationFocus: null };
function coopUIElement(tag, parent, text, cls) {
  const el = document.createElement(tag); if (text) el.textContent = text; if (cls) el.className = cls;
  if (parent) parent.appendChild(el); return el;
}
function coopUIRemember(key, value) { try { localStorage.setItem('chest_dungeon_lan_' + key, value); } catch (_) {} }
function coopUIStored(key, fallback) { try { return localStorage.getItem('chest_dungeon_lan_' + key) || fallback; } catch (_) {} return fallback; }
function coopUIBuild() {
  if (COOP_UI.root) return;
  const root = coopUIElement('div', document.body, '', 'lan-overlay'); COOP_UI.root = root; root.id = 'lan-lobby'; root.hidden = true;
  const N = COOP_UI.nodes;
  const button = (parent, text, id, action, primary = false) => {
    const el = coopUIElement('button', parent, text, primary ? 'lan-button lan-primary' : 'lan-button'); el.type = 'button'; el.id = id;
    el.addEventListener('click', action); return el;
  };
  const close = () => { if (COOP.preparing) coopCancelReady(); else coopUIClose(); };
  N.card = coopUIElement('section', root, '', 'lan-card'); N.card.setAttribute('role', 'dialog'); N.card.setAttribute('aria-modal', 'true'); N.card.setAttribute('aria-label', '局域网队伍');
  const head = coopUIElement('header', N.card, '', 'lan-head');
  const titles = coopUIElement('div', head, '', 'lan-titles'); coopUIElement('span', titles, '晨星镇 · 冒险同行', 'lan-kicker');
  N.heading = coopUIElement('h1', titles, '邀请旅伴');
  const x = button(head, '×', 'lan-close', close); x.classList.add('lan-x'); x.setAttribute('aria-label', '回到主城');
  N.linkState = coopUIElement('p', N.card, '', 'lan-link-state');
  N.identity = coopUIElement('label', N.card, '冒险者姓名'); N.name = coopUIElement('input', N.identity); N.name.id = 'lan-name'; N.name.maxLength = 18; N.name.value = coopUIStored('name', '冒险者');
  N.connect = coopUIElement('section', N.card, '', 'lan-connect');
  N.host = button(N.connect, '开启局域网', 'lan-host', () => { coopUIRemember('name', N.name.value); coopHost(N.name.value); }, true);
  const ipLabel = coopUIElement('label', N.connect); N.addressLabel = coopUIElement('span', ipLabel, '6 位数字邀请码'); N.address = coopUIElement('input', ipLabel); N.address.id = 'lan-address'; N.address.maxLength = 1024; N.address.placeholder = '输入 6 位数字邀请码'; N.address.value = coopUIStored(coopIsTap() ? 'tap-room' : 'address', '');
  // Room code is per-room and short-lived, so it is deliberately not remembered between sessions.
  N.codeLabel = coopUIElement('label', N.connect, '房间码'); N.code = coopUIElement('input', N.codeLabel); N.code.id = 'lan-code'; N.code.maxLength = 9; N.code.placeholder = '房主界面上的 6 位数字'; N.code.inputMode = 'numeric';
  N.join = button(N.connect, '加入旅伴的世界', 'lan-join', () => { coopUIRemember('name', N.name.value); coopUIRemember(coopIsTap() ? 'tap-room' : 'address', N.address.value); coopJoin(N.address.value, N.name.value, N.code.value); });
  for (const input of [N.name, N.address, N.code]) { input.autocomplete = 'off'; input.spellcheck = false; }
  N.room = coopUIElement('section', N.card, '', 'lan-room');
  N.connection = coopUIElement('p', N.room, '', 'lan-address-line'); N.connection.id = 'lan-room-address';
  N.share = coopUIElement('div', N.room, '', 'lan-share');
  N.localAddress = coopUIElement('select', N.share); N.localAddress.id = 'lan-local-address'; N.localAddress.setAttribute('aria-label', '可分享的房间地址');
  N.copy = button(N.share, '复制地址', 'lan-copy', async () => {
    const text = N.localAddress.value + (COOP.roomCode ? ' 房间码 ' + COOP.roomCode : '');
    try { await navigator.clipboard.writeText(text); N.copy.textContent = '已复制'; }
    catch (_) { coopNotify((coopIsTap() ? '邀请码：' : '房间地址：') + text + '（可选中文字复制）'); N.note.style.userSelect = 'text'; }
  });
  N.roomCode = coopUIElement('p', N.room, '', 'lan-address-line'); N.roomCode.id = 'lan-room-code'; N.roomCode.style.userSelect = 'text';
  N.party = coopUIElement('div', N.room, '', 'lan-party'); N.slots = [];
  for (let i = 0; i < 4; i++) {
    const row = coopUIElement('div', N.party, '', 'lan-player-line'); row.dataset.slot = String(i);
    const name = coopUIElement('span', row), role = coopUIElement('span', row); N.slots.push({ row, name, role });
  }
  N.roomHint = coopUIElement('p', N.room, '', 'lan-room-hint');
  N.leave = button(N.room, '离开队伍', 'lan-leave', coopLeave); N.leave.classList.add('lan-quiet');
  N.help = coopUIElement('p', N.card, '加入后直接来到房主的主城，可自由走动。房主在出征法阵选关，旅伴同意后一起冒险。', 'lan-help');
  const foot = coopUIElement('footer', N.card, '', 'lan-footer'); N.close = button(foot, '回到主城', 'lan-camp', close); N.close.classList.add('lan-quiet');
  N.note = coopUIElement('p', foot, '', 'lan-note'); N.note.id = 'lan-note'; N.note.setAttribute('role', 'status'); N.note.setAttribute('aria-live', 'polite');
  N.confirm = coopUIElement('section', root, '', 'lan-confirm'); N.confirm.id = 'lan-confirm'; N.confirm.hidden = true;
  N.confirm.setAttribute('role', 'dialog'); N.confirm.setAttribute('aria-modal', 'true'); N.confirm.setAttribute('aria-label', '冒险邀请');
  coopUIElement('span', N.confirm, '出征法阵 · 冒险邀请', 'lan-kicker'); N.confirmHeading = coopUIElement('h2', N.confirm, '一同出发');
  N.confirmDestination = coopUIElement('p', N.confirm, '', 'lan-confirm-destination'); N.confirmDestination.id = 'lan-confirm-destination';
  N.confirmDifficulty = coopUIElement('p', N.confirm, '', 'lan-confirm-difficulty');
  N.confirmParty = coopUIElement('div', N.confirm, '', 'lan-confirm-party'); N.confirmSlots = [];
  for (let i = 0; i < 4; i++) {
    const line = coopUIElement('div', N.confirmParty, '', 'lan-confirm-player'); line.dataset.slot = String(i);
    const name = coopUIElement('span', line), state = coopUIElement('span', line); N.confirmSlots.push({ line, name, state });
  }
  N.confirmHint = coopUIElement('p', N.confirm, '', 'lan-confirm-hint');
  const actions = coopUIElement('div', N.confirm, '', 'lan-confirm-actions');
  N.agree = button(actions, '同意冒险', 'lan-agree', () => coopSetReady(true), true);
  N.decline = button(actions, '暂不出发', 'lan-decline', () => coopCancelReady());
  root.addEventListener('keydown', e => { if (COOP_UI.open) e.stopPropagation(); });
  window.addEventListener('keydown', e => {
    if (!COOP_UI.open) return;
    if (e.code === 'Escape') { e.preventDefault(); close(); }
    e.stopImmediatePropagation();
  }, true);
}
function coopUIChooseTransport(kind) {
  const N = COOP_UI.nodes;
  if (COOP.connected || COOP.busy) return false;
  const previous = coopIsTap() ? 'tap-room' : 'address';
  if (!coopSelectTransport(kind)) return false;
  if (N.address) { coopUIRemember(previous, N.address.value); N.address.value = coopUIStored(kind === 'tap' ? 'tap-room' : 'address', ''); N.code.value = ''; }
  coopUIRefresh(); return true;
}
function coopOpenLobby(kind) {
  if (kind && !COOP.connected && !COOP.busy && !coopUIChooseTransport(kind)) return false;
  if (!coopAvailable() || COOP.phase === 'run') return false;
  if (COOP.preparing) return coopShowConfirmation();
  if (G.mode === 'title' || G.room.type !== 'town') { enterTown(); G.trans = null; G.fade = 0; }
  G.mode = 'town'; TOWN.menu = null; TOWN.launch = null;
  coopUIBuild(); COOP_UI.open = true; COOP_UI.confirmOnly = false; COOP_UI.root.hidden = false; resetInput(); UI_HITS.length = 0;
  coopUIRefresh(); (COOP.connected ? COOP_UI.nodes.close : COOP_UI.nodes.name).focus(); return true;
}
// Referenced by ui.js / coop-town.js input guards but was never defined (found by eslint no-undef), so those
// `typeof coopConfirmationOpen === 'function'` checks were always false. Defined to match what they intend; since the
// confirmation is shown inside the COOP_UI overlay (COOP_UI.open is also checked there), behaviour is unchanged.
function coopConfirmationOpen() { return !!(COOP_UI.open && COOP_UI.confirmOnly && COOP.preparing); }
function coopShowConfirmation() {
  if (!COOP.connected || COOP.phase !== 'lobby' || !COOP.preparing) return false;
  coopUIBuild(); TOWN.menu = null; TOWN.dialogue = null; TOWN.launch = null; G.prompt = null;
  if (G.room && G.room.type === 'town') G.mode = 'town';
  COOP_UI.open = true; COOP_UI.confirmOnly = true; COOP_UI.root.hidden = false;
  resetInput(); UI_HITS.length = 0; coopUIRefresh(); return true;
}
function coopUIClose() {
  COOP_UI.open = false; COOP_UI.confirmOnly = false; COOP_UI.confirmationFocus = null;
  if (COOP_UI.root) { const focused = document.activeElement; if (focused && COOP_UI.root.contains && COOP_UI.root.contains(focused) && focused.blur) focused.blur(); COOP_UI.root.hidden = true; }
  resetInput(); UI_HITS.length = 0;
}
function coopUIRefresh() {
  const N = COOP_UI.nodes; if (!COOP_UI.root || COOP_UI.refreshing) return; COOP_UI.refreshing = true;
  try {
    const host = COOP.connected && COOP.role === 'host', cloud = coopIsTap(), cfg = COOP.config, preparing = !!COOP.preparing && !!COOP.confirmationId;
    if (COOP_UI.confirmOnly && !preparing) { coopUIClose(); return; }
    N.card.hidden = COOP_UI.confirmOnly; N.confirm.hidden = !COOP_UI.confirmOnly || !preparing;
    N.name.disabled = COOP.connected || COOP.busy; N.address.disabled = COOP.connected || COOP.busy; N.code.disabled = COOP.connected || COOP.busy;
    N.identity.hidden = N.connect.hidden = COOP.connected; N.host.disabled = N.join.disabled = COOP.busy;
    N.card.setAttribute('aria-label', cloud ? 'TapTap 队伍' : '局域网队伍');
    COOP_UI.root.dataset.connected = String(COOP.connected); COOP_UI.root.dataset.motion = String(TITLE_SETTINGS.titleMotion);
    N.heading.textContent = COOP.connected ? '同行旅伴' : '邀请旅伴';
    N.linkState.textContent = COOP.busy ? '连接中…' : COOP.connected ? COOP.members.length + ' / 4 位冒险者 · 同一个世界' : cloud ? 'TapTap 联机 · 最多四人' : '局域网 · 最多四人';
    N.host.textContent = cloud ? '创建联机房间' : '开启局域网'; N.addressLabel.textContent = cloud ? '6 位数字邀请码' : '房主的地址';
    N.address.placeholder = cloud ? '输入 6 位数字邀请码' : '192.168.1.8:18777'; N.address.inputMode = cloud ? 'numeric' : 'text'; N.codeLabel.hidden = cloud;
    N.copy.textContent = cloud ? '复制邀请码' : '复制地址';
    N.room.hidden = N.leave.hidden = !COOP.connected; N.help.hidden = COOP.connected;
    N.connection.textContent = host ? cloud ? '分享邀请码，邀请旅伴加入' : '将这个地址和房间码分享给同一局域网的旅伴' : '已进入房主的晨星镇'; N.share.hidden = !host;
    N.roomCode.hidden = !host || !COOP.roomCode; N.roomCode.textContent = host && COOP.roomCode ? '房间码  ' + COOP.roomCode.slice(0, 3) + ' ' + COOP.roomCode.slice(3) : '';
    const addresses = cloud ? [COOP.inviteCode || COOP.tapRoomId || ''] : COOP.addresses.length ? [...COOP.addresses].sort((a, b) => Number(b.startsWith('192.168.')) - Number(a.startsWith('192.168.'))) : ['127.0.0.1'];
    const oldAddress = N.localAddress.value; N.localAddress.replaceChildren();
    const shareAddress = address => cloud ? address : address + ':' + COOP.port;
    for (const address of addresses) { const option = coopUIElement('option', N.localAddress, shareAddress(address)); option.value = shareAddress(address); }
    N.localAddress.value = addresses.some(a => shareAddress(a) === oldAddress) ? oldAddress : shareAddress(addresses[0]);
    N.help.textContent = cloud ? '将邀请码分享给旅伴即可组队，无需连接同一 Wi-Fi。房主选择关卡，全员同意后出发。' : '加入后直接来到房主的主城，可自由走动。房主在出征法阵选关，旅伴同意后一起冒险。';
    N.slots.forEach((slot, i) => { const member = COOP.members[i]; slot.row.hidden = !member; if (!member) return;
      slot.name.textContent = member.name; slot.role.textContent = member.id === COOP.hostId ? '房主' : member.id === COOP.selfId ? '你' : '旅伴'; });
    N.roomHint.textContent = host ? '在主城出征法阵选择关卡，发起冒险邀请。' : '自由探索主城，等待房主发起冒险邀请。';
    N.leave.disabled = COOP.busy; N.note.textContent = COOP.note || '';
    const act = ACTS[cfg.act - 1], region = act && act.regions[cfg.chapter - 1];
    N.confirmHeading.textContent = host ? '等待旅伴' : '一同出发';
    N.confirmDestination.textContent = act && region ? act.name + ' · ' + region.name : '冒险邀请';
    N.confirmDifficulty.textContent = DIFFS[cfg.diff].name + ' · ' + COOP.members.length + ' 人冒险';
    N.confirmSlots.forEach((slot, i) => { const member = COOP.members[i]; slot.line.hidden = !member; if (!member) return;
      slot.name.textContent = member.name + (member.id === COOP.selfId ? ' · 你' : '');
      slot.state.textContent = member.id === COOP.hostId ? '发起者' : COOP.ready[member.id] ? '已同意' : '等待同意';
      slot.line.classList.toggle('agreed', !!COOP.ready[member.id]); });
    const guests = COOP.members.filter(m => m.id !== COOP.hostId), agreed = guests.filter(m => COOP.ready[m.id]).length;
    N.confirmHint.textContent = agreed + ' / ' + guests.length + ' 位旅伴已同意 · 全部同意后自动出发';
    N.agree.hidden = host; N.agree.disabled = !!COOP.ready[COOP.selfId]; N.agree.textContent = N.agree.disabled ? '已同意 · 等待旅伴' : '同意冒险';
    N.decline.textContent = host ? '取消邀请' : '暂不出发';
    if (preparing && COOP_UI.open && COOP_UI.confirmOnly && COOP_UI.confirmationFocus !== COOP.confirmationId) {
      COOP_UI.confirmationFocus = COOP.confirmationId; (host ? N.decline : N.agree).focus();
    }
  } finally { COOP_UI.refreshing = false; }
}
const coopUIOriginalDraw = drawUI;
// CJK names belong on the hi-res layer; the world canvas is only 320 pixels wide.
function coopUIDrawRunNames() {
  if (!coopRuntimeIsActive()) return;
  const [cx, cy] = G.camOff, actors = coopRuntimeActors();
  actors.forEach(actor => {
    const p = actor.context.player, at = coopViewPlayerPosition(actor), x = at.x + cx, y = at.y - heroVisualHeight(p) - 10.5 + OY + cy;
    if (x < 0 || x > LW || y < OY + 4 || y > LH - 4) return;
    T(actor.name, x, y, 4.5, COOP_ACTOR_COLORS[[...COOP_RUNTIME.actors.keys()].indexOf(actor.id) % 4]);
  });
}
function coopUIDrawTownNames() {
  if (typeof coopTownActive !== 'function' || !coopTownActive() || G.mode !== 'town' || TOWN.menu || TOWN.launch) return;
  const [cx, cy] = G.camOff;
  for (const actor of COOP_TOWN.actors.values()) {
    const p = actor.id === COOP.selfId ? G.player : actor.player, x = p.x + cx, y = p.y - heroVisualHeight(p) - 6 + OY + cy;
    if (x < 12 || x > LW - 12 || y < OY + 5 || y > LH - 8) continue;
    const index = COOP.members.findIndex(m => m.id === actor.id), name = actor.name.slice(0, 8) + (actor.name.length > 8 ? '…' : '');
    T(name, x, y, 4.5, COOP_TOWN_COLORS[Math.max(0, index) % 4]);
  }
}
const coopUIOriginalTownLabels = drawTownLabels;
drawTownLabels = function (cx, cy) { coopUIDrawTownNames(); coopUIOriginalTownLabels(cx, cy); };
drawUI = function () {
  if (COOP_UI.open) {
    drawSaveNotice();
    UI_HITS.length = 0; hg.clearRect(0, 0, HC.width, HC.height);

    return;
  }
  coopUIOriginalDraw();
  if (COOP.connected && COOP.phase === 'run' && G.mode !== 'journal') {
    const help = document.getElementById('desktop-help');
    help.textContent = 'WASD 移动 · 左键松手普攻 / 长按蓄力 · 空格闪避 · E 互动 · M 地图 · J 任务 · Tab 装备 · 联机菜单中战斗继续 · 房主带队换房';
  }
  if (!coopAvailable() || !tapCoopAvailable() && !COOP.connected) return;
  if (COOP.connected && COOP.phase === 'run') {
    const actors = coopRuntimeActors();
    const tracker = questTrackerBounds(questTrackedEntries()), px0 = tracker.x < 100 ? LW - 75 : 5;
    actors.filter(a => a.id !== COOP.selfId).forEach((actor, i) => {
      const p = actor.context.player, y = 30 + i * 10, col = COOP_ACTOR_COLORS[actors.indexOf(actor) % 4];
      panel(px0, y - 5, px0 + 70, y + 4, '#100c18', '#392c45', .86);
      T(actor.name.slice(0, 8), px0 + 3, y - 1, 3.5, col, 'left');
      hg.fillStyle = '#362132'; hg.fillRect((px0 + 40) * U, (y - 2) * U, 26 * U, 2 * U);
      hg.fillStyle = actor.downed ? '#c04462' : col; hg.fillRect((px0 + 40) * U, (y - 2) * U, 26 * U * clamp(p.hp / p.maxHp), 2 * U);
      if (actor.downed) T('倒地', px0 + 66, y + 2, 2.7, '#ff8699', 'right');
    });
    const hover = coopUIOriginalHit(LW - 48, LH - 16, LW - 4, LH - 3, coopLeave); T('离开房间', LW - 26, LH - 9, 4, hover ? '#fff0cc' : '#a497af');
    if (G.mode === 'pause') withMenuUI(() => T('联机中世界继续运行 · R 离开并保存收益', 160, 172, 4, '#efbf83'));
    if (G.mode === 'win' || G.mode === 'dead') withMenuUI(() => T(COOP.role === 'host' ? '按任意键带队返回主城，材料与收益已保存。' : '材料与收益已保存，等待房主带队返回主城。', 160, 160, 4, '#efbf83'));
    if (COOP.role === 'client' && performance.now() - COOP.lastSnapshotAt > 2500) T('连接延迟，等待房主…', LW / 2, 25, 5, '#ffbd70');
  } else if (G.room.type === 'town' && G.mode === 'town' && !TOWN.menu && !TOWN.launch) {
    if (COOP.connected) {
      const help = document.getElementById('desktop-help'); help.dataset.context = 'coop-town';
      help.textContent = 'WASD 自由走动 · 左键松手普攻 / 长按蓄力 · 空格闪避 · E 与居民交互 · J 任务 · Tab 属性 · ' +
        (COOP.role === 'host' ? '到出征法阵邀请旅伴冒险' : '等待房主发起冒险邀请');
    }
    const hover = uiHit(5, 3, 66, 17, () => coopOpenLobby(COOP.connected ? undefined : 'tap')); panel(5, 3, 66, 17, '#16202b', hover ? '#cfa663' : '#36556c', .96);
    T(COOP.connected ? '组队房间 ' + COOP.members.length + '/4' : 'TapTap 联机', 35, 10, 5, '#dcc8a0');
  }
};
// Canvas menu clicks become owner-validated commands, never guest-side rewards.
const coopUIOriginalHit = uiHit;
uiHit = function (x0, y0, x1, y1, click) {
  let handler = click;
  if (COOP.connected && COOP.phase === 'run') {
    if (G.mode === 'chest' || G.mode === 'choice') {
      const C = G.mode === 'chest' ? G.cine : G.choice;
      if (C && C.opts && Math.abs(y1 - y0 - 9) < .01) {
        // Item option hit boxes are registered in option order each frame.
        const index = UI_HITS.filter(h => h.coopOption).length;
        handler = () => coopRunAction({ kind: 'select', index, confirm: true });
        const hover = coopUIOriginalHit(x0, y0, x1, y1, handler); UI_HITS[UI_HITS.length - 1].coopOption = true; return hover;
      }
    } else if (G.mode === 'shrine' && Math.abs(y1 - y0 - 16) < .01) {
      const index = Math.max(0, Math.round(((y0 + y1) / 2 - 59) / 19));
      handler = () => coopRunAction({ kind: 'shrine', index, confirm: x0 >= 214 });
    }
  }
  return coopUIOriginalHit(x0, y0, x1, y1, handler);
};
const coopUIOriginalBlur = pauseOnBlur;
pauseOnBlur = function () {
  if (COOP.connected && COOP.phase === 'run') { resetInput(); Input.pointer.active = false; coopRunAction({ kind: 'pause' }); return; }
  if (COOP.connected && COOP.phase === 'lobby') { resetInput(); Input.pointer.active = false; return; }
  coopUIOriginalBlur();
};
const coopUIOriginalFrameBefore = coopNetworkFrameBefore;
coopNetworkFrameBefore = function (dt) {
  if (COOP.connected && COOP.phase === 'run' && G.mode === 'pause' && Input.pressed.has('restart')) { resetInput(); coopLeave(); return true; }
  if (COOP.connected && COOP.phase === 'run' && COOP.role === 'client') {
    if (!COOP_UI.journal && consume('journal')) openQuestJournal();
    if (COOP_UI.journal) { G.mode = 'journal'; updateQuestJournal(); Input.keys.clear(); }
    if (!COOP_UI.journal && G.mode === 'journal') coopRuntimeSelf();
  }
  return coopUIOriginalFrameBefore(dt);
};
const coopUIOriginalOpenJournal = openQuestJournal, coopUIOriginalCloseJournal = closeQuestJournal;
openQuestJournal = function (key) {
  const ok = coopUIOriginalOpenJournal(key);
  if (ok && COOP.connected && COOP.phase === 'run' && COOP.role === 'client') COOP_UI.journal = true;
  return ok;
};
closeQuestJournal = function () { coopUIOriginalCloseJournal(); COOP_UI.journal = false; };
const coopUIOriginalApply = coopRuntimeApply;
coopRuntimeApply = function (snapshot) {
  const ok = coopUIOriginalApply(snapshot);
  if (ok && COOP_UI.journal) G.mode = 'journal'; return ok;
};
