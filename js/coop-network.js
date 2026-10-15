'use strict';
// The native LAN relay carries commands. Only the room owner advances the simulation.
const COOP_PROTOCOL = 7, COOP_VERSION = '1.9.5';
const COOP = { connected: false, role: null, selfId: null, hostId: 'host', phase: 'lobby', sessionId: null,
  runId: null, runContext: null, members: [], profiles: {}, ready: {}, config: { act: 1, chapter: 1, diff: 0 },
  preparing: false, confirmationId: null, confirmationSeq: 0, confirmationMembers: [], confirmationProfiles: {}, confirmationConfig: null,
  profileT: 0, publishedProfile: null,
  addresses: [], port: 18777, roomCode: null, tapRoomId: null, inviteCode: null, transport: '', note: '', busy: false, pending: [], inputSeq: 0, inputSeen: {}, inputT: 0,
  snapshotT: 0, edges: new Set(), latest: null, lastSnapshotAt: 0, lastStats: null, returning: false,
  send(packet) { const bridge = coopBridge(); if (bridge && COOP.connected) bridge.send(packet); },
  emitProgress(packet) { if (COOP.pending.length < 4096) COOP.pending.push(packet); }
};
function coopLanBridge() { return window.dungeonDesktop && window.dungeonDesktop.lan; }
function coopBridge() {
  if (COOP.transport === 'tap') return tapCoopAvailable() ? TAP_COOP_BRIDGE : null;
  if (COOP.transport === 'lan') return coopLanBridge();
  return tapCoopAvailable() ? TAP_COOP_BRIDGE : coopLanBridge();
}
function coopAvailable() { return !!coopBridge(); }
let coopBoundBridge = null, coopBridgeUnsubscribe = null;
function coopBindBridge() {
  const bridge = coopBridge();
  if (bridge !== coopBoundBridge) {
    if (coopBridgeUnsubscribe) coopBridgeUnsubscribe();
    coopBoundBridge = bridge;
    coopBridgeUnsubscribe = bridge ? bridge.onEvent(event => { if (bridge === coopBridge()) coopOnEvent(event); }) : null;
  }
  return bridge;
}
function coopSelectTransport(kind) {
  if (COOP.connected || COOP.busy || !['lan', 'tap'].includes(kind) || (kind === 'lan' ? !coopLanBridge() : !tapCoopAvailable())) return false;
  COOP.transport = kind; COOP.note = ''; coopBindBridge(); return true;
}
function coopIsTap() { return coopBridge()?.kind === 'tap'; }
function coopUniqueId() { return 'lan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12); }
function coopNotify(note) {
  const raw = String(note || ''), errors = { 'room full': '房间已满，最多 4 人。', 'game already started': '房间已经出征，请等待本局结束后加入。',
    'use a local IPv4 address': '请使用房主的局域网 IPv4 地址。', 'local network only': '仅支持局域网连接。',
    'connection timed out': '连接超时，请检查地址、局域网和 Windows 专用网络权限。', 'handshake timed out': '连接超时，请检查地址与游戏版本。',
    'invalid port': '端口应为 1—65535 的整数。', 'room closed': '房间已关闭。',
    'version mismatch': '联机版本不同，请所有队员更新到同一版本。', 'room busy': '正在处理房间连接，请稍候。',
    'invalid room code': '房间码不正确，请向房主确认 6 位房间码。', 'too many attempts': '房间码错误次数过多，请 1 分钟后再试。' };
  COOP.note = (errors[raw] || (/ECONNREFUSED|EHOSTUNREACH|ETIMEDOUT/.test(raw) ? '无法连接房主，请确认房间已创建、地址正确，并允许专用网络访问。' :
    /EADDRINUSE/.test(raw) ? '端口已被占用，请先关闭已有的组队房间。' : raw)).slice(0, 180);
  if (typeof coopUIRefresh === 'function') coopUIRefresh();
}
// Room code typed by a joiner: six digits, spaces/dashes ignored; same alphabet as desktop/lan.cjs.
const COOP_ROOM_CODE_ALPHABET = '0123456789';
function coopRoomCode(value) {
  const code = String(value || '').toUpperCase().replace(/[\s-]/g, '');
  return code.length === 6 && [...code].every(c => COOP_ROOM_CODE_ALPHABET.includes(c)) ? code : null;
}
function coopName(name) { return String(name || '冒险者').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 18) || '冒险者'; }
function coopValidConfig(value) {
  if (!value || !Number.isInteger(value.act) || !Number.isInteger(value.chapter) || !Number.isInteger(value.diff)) return null;
  return ACTS[value.act - 1] && ACTS[value.act - 1].regions[value.chapter - 1] && DIFFS[value.diff]
    ? { act: value.act, chapter: value.chapter, diff: value.diff } : null;
}
// Only bounded character growth and personal recipes cross the LAN; wallets and quest saves stay local.
function coopValidForgeProfile(raw, unlocked) {
  if (raw === undefined) return forgeCombatProfile();
  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  if (!object(raw) || raw.ver !== 1 || !object(raw.training) || !object(raw.weapons) ||
      !Array.isArray(raw.designs) || raw.designs.length > FORGE_DESIGN_MAX) return null;
  const training = new Map(FORGE_TRAINING.map(t => [t.id, t]));
  for (const [id, level] of Object.entries(raw.training)) {
    const def = training.get(id);
    if (!def || !Number.isInteger(level) || level < 0 || level > def.max) return null;
  }
  const designs = new Set();
  for (const d of raw.designs) {
    if (!object(d) || typeof d.id !== 'string' || typeof d.name !== 'string' || d.name.length > 64 ||
        typeof d.forged !== 'boolean' || !object(d.recipe) || designs.has(d.id)) return null;
    const recipe = forgeRecipeNormalize(d.recipe);
    if (!recipe || forgeRecipeId(recipe) !== d.id) return null;
    designs.add(d.id);
  }
  const forged = new Set(raw.designs.filter(d => d.forged).map(d => d.id));
  if (Object.keys(raw.weapons).length > ITEMS.filter(i => i.slot === 'weapon').length + FORGE_DESIGN_MAX) return null;
  for (const [id, state] of Object.entries(raw.weapons)) {
    const item = forgeItem(id);
    if (!item || item.slot !== 'weapon' || item.start || CAMP_STARTERS.includes(id) || !object(state)) return null;
    const silver = !!item.silver;
    if (silver ? !forged.has(id) : !unlocked.includes(id)) return null;
    if (!Number.isInteger(state.rank) || state.rank < 0 || state.rank > (silver ? 8 : 5) ||
        !Number.isInteger(state.level) || state.level < (state.rank ? (silver ? 10 + (state.rank - 1) * 5 : 5 + (state.rank - 1) * 3) : 0) ||
        state.level > (silver ? 10 + state.rank * 5 : 5 + state.rank * 3)) return null;
  }
  const clean = forgeCombatProfile(raw);
  // Canonical order avoids cancelling a ready invitation for an equivalent profile.
  clean.training = Object.fromEntries(Object.entries(clean.training).sort(([a], [b]) => a.localeCompare(b)));
  clean.weapons = Object.fromEntries(Object.entries(clean.weapons).sort(([a], [b]) => a.localeCompare(b)));
  clean.designs.sort((a, b) => a.id.localeCompare(b.id));
  return clean;
}
function coopValidProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !value.lv || typeof value.lv !== 'object' ||
      !Array.isArray(value.unlocked) || value.unlocked.length > ITEMS.length || !CAMP_STARTERS.includes(value.starter) ||
      value.meal !== null && !CAMP_MEALS.some(m => m.id === value.meal)) return null;
  const lv = {};
  for (const t of TALENTS) {
    const n = value.lv[t.id]; if (n === undefined) continue;
    if (!Number.isInteger(n) || n < 0 || n > t.max) return null;
    if (n) lv[t.id] = n;
  }
  if (value.unlocked.some(id => typeof id !== 'string' || !ITEMS.some(it => it.id === id))) return null;
  const clearedActs = value.clearedActs === undefined ? [] : value.clearedActs;
  if (!Array.isArray(clearedActs) || clearedActs.length > ACTS.length || new Set(clearedActs).size !== clearedActs.length ||
      clearedActs.some(act => !Number.isInteger(act) || act < 1 || act > ACTS.length)) return null;
  const costume = value.costume === undefined ? 'adventurer' : value.costume;
  if (typeof costume !== 'string' || !Object.hasOwn(COSTUME_BY_ID, costume)) return null;
  const unlocked = [...new Set(value.unlocked)], forge = coopValidForgeProfile(value.forge, unlocked);
  if (!forge) return null;
  return { lv, unlocked, starter: value.starter, meal: value.meal, clearedActs: clearedActs.slice().sort((a, b) => a - b), forge, costume };
}
function coopOwnProfile() { return { ...coopProgressProfile(), name: coopName(COOP.members.find(m => m.id === COOP.selfId)?.name) }; }
function coopProfileKey(value) {
  const profile = coopValidProfile(value); if (!profile) return null;
  profile.unlocked.sort(); return JSON.stringify(profile);
}
function coopClearConfirmation(note) {
  if (COOP.confirmationId && COOP.role === 'host') COOP.confirmationSeq++;
  COOP.preparing = false; COOP.confirmationId = null; COOP.confirmationMembers = [];
  COOP.confirmationProfiles = {}; COOP.confirmationConfig = null; COOP.ready = {};
  for (const m of COOP.members) m.ready = COOP.ready[m.id] = false;
  if (note) COOP.note = note;
}
function coopStoreProfile(id, profile) {
  const key = coopProfileKey(profile), previous = coopProfileKey(COOP.profiles[id]);
  if (!key) return false;
  COOP.profiles[id] = profile;
  if (key !== previous && COOP.preparing) coopClearConfirmation('角色整备已变化，请房主重新发起远征。');
  return key !== previous;
}
function coopPublishProfile(force = false) {
  if (!COOP.connected || COOP.phase !== 'lobby') return;
  const profile = coopOwnProfile(), key = coopProfileKey(profile);
  if (COOP.role === 'host') { if (coopStoreProfile(COOP.selfId, profile) || force) coopBroadcastLobby(); }
  else if (key && (key !== COOP.publishedProfile || force)) {
    COOP.send({ type: 'profile', protocol: COOP_PROTOCOL, version: COOP_VERSION, profile });
  }
  COOP.publishedProfile = key;
}
function coopBroadcastLobby() {
  if (COOP.role !== 'host' || !COOP.connected || COOP.phase !== 'lobby') return;
  COOP.members.forEach(m => m.ready = !!COOP.ready[m.id]);
  COOP.send({ type: 'lobby', protocol: COOP_PROTOCOL, version: COOP_VERSION, sessionId: COOP.sessionId,
    config: COOP.config, preparing: COOP.preparing, confirmationId: COOP.confirmationId, confirmationSeq: COOP.confirmationSeq,
    note: COOP.note, members: COOP.members.map(m => ({ id: m.id, name: m.name, ready: !!m.ready,
      starter: COOP.profiles[m.id]?.starter || null })) });
  if (typeof coopUIRefresh === 'function') coopUIRefresh();
}
async function coopHost(name, port = 18777) {
  if (!coopAvailable() || COOP.busy || COOP.connected) return false;
  const bridge = coopBindBridge();
  coopClearConfirmation(); COOP.confirmationSeq = 0; COOP.publishedProfile = null;
  COOP.busy = true; COOP.role = 'host'; COOP.sessionId = coopUniqueId(); COOP.note = '正在创建房间…';
  if (typeof coopUIRefresh === 'function') coopUIRefresh();
  try {
    const result = await bridge.host({ name: coopName(name), port: Number(port) });
    if (!result.ok) { COOP.role = null; coopNotify(result.error || '创建房间失败'); return false; }
    COOP.selfId = result.selfId; COOP.connected = true; COOP.addresses = result.addresses || COOP.addresses; COOP.port = result.port || Number(port);
    COOP.roomCode = typeof result.roomCode === 'string' ? result.roomCode : null;
    COOP.tapRoomId = result.tapRoomId || null;
    COOP.inviteCode = result.inviteCode || null;
    coopPublishProfile(); coopNotify(coopIsTap() ? '房间已创建，将邀请码分享给队友即可加入。' : '房间已创建，将地址和房间码告诉同一局域网的队友。');
    if (typeof coopTownEnsure === 'function') coopTownEnsure();
    if (typeof scheduleGameFrame === 'function') scheduleGameFrame();
    if (typeof coopUIClose === 'function') coopUIClose(); return true;
  } catch (e) { COOP.role = null; coopNotify(e.message || '创建房间失败'); return false; }
  finally { COOP.busy = false; if (typeof coopUIRefresh === 'function') coopUIRefresh(); }
}
async function coopJoin(address, name, roomCode) {
  if (!coopAvailable() || COOP.busy || COOP.connected) return false;
  const bridge = coopBindBridge(), cloud = coopIsTap(), roomId = String(address || '').trim();
  const match = String(address || '').trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/);
  if (cloud ? !roomId || roomId.length > 1024 || /[\u0000-\u001f]/.test(roomId) : !match) { coopNotify(cloud ? '请输入房主分享的邀请码。' : '请输入房主的局域网 IPv4 地址，例如 192.168.1.8:18777'); return false; }
  const code = coopRoomCode(roomCode);
  if (!cloud && !code) { coopNotify('请输入房主界面显示的 6 位房间码。'); return false; }
  coopClearConfirmation(); COOP.confirmationSeq = 0; COOP.publishedProfile = null;
  COOP.busy = true; COOP.role = 'client'; COOP.sessionId = null; COOP.note = '正在连接房主…';
  if (typeof coopUIRefresh === 'function') coopUIRefresh();
  try {
    const result = await bridge.join(cloud ? { roomId, name: coopName(name) } : { address: match[1], port: Number(match[2] || 18777), name: coopName(name), code });
    if (!result.ok) { COOP.role = null; coopNotify(result.error || '加入房间失败'); return false; }
    COOP.selfId = result.selfId; COOP.tapRoomId = result.tapRoomId || null; COOP.inviteCode = result.inviteCode || null; COOP.connected = true; coopPublishProfile();
    if (typeof coopTownEnsure === 'function') coopTownEnsure();
    if (typeof scheduleGameFrame === 'function') scheduleGameFrame();
    if (typeof coopUIClose === 'function') coopUIClose(); return true;
  } catch (e) { COOP.role = null; coopNotify(e.message || '加入房间失败'); return false; }
  finally { COOP.busy = false; if (typeof coopUIRefresh === 'function') coopUIRefresh(); }
}
function coopCanRequestReady() {
  return COOP.connected && COOP.role === 'host' && COOP.phase === 'lobby' && !COOP.busy && !COOP.preparing &&
    COOP.members.length >= 2 && COOP.members.length <= 4 && COOP.members.every(m => coopProfileKey(COOP.profiles[m.id])) &&
    !!coopValidConfig(COOP.config) && regionOpen(COOP.config.act, COOP.config.diff, COOP.config.chapter);
}
function coopRequestReady() {
  if (!COOP.connected || COOP.role !== 'host' || COOP.phase !== 'lobby' || COOP.preparing) return false;
  coopPublishProfile();
  if (!coopCanRequestReady()) { coopNotify('需要至少 2 人，且所有队员的角色整备已同步。'); return false; }
  coopClearConfirmation(); COOP.confirmationSeq++; COOP.confirmationId = coopUniqueId() + ':' + COOP.confirmationSeq; COOP.preparing = true;
  COOP.confirmationMembers = COOP.members.map(m => m.id);
  for (const m of COOP.members) COOP.confirmationProfiles[m.id] = coopProfileKey(COOP.profiles[m.id]);
  COOP.ready[COOP.selfId] = true;
  COOP.confirmationConfig = JSON.stringify(COOP.config); COOP.note = '请所有队员确认本次远征，全部同意后自动出发。';
  coopBroadcastLobby(); if (typeof coopShowConfirmation === 'function') coopShowConfirmation(); return true;
}
function coopCancelReady(confirmationId = COOP.confirmationId) {
  if (!COOP.connected || COOP.phase !== 'lobby' || !COOP.preparing || !confirmationId || confirmationId !== COOP.confirmationId) return false;
  if (COOP.role === 'host') { coopClearConfirmation('远征确认已取消，可以继续整备。'); coopBroadcastLobby(); }
  else { COOP.send({ type: 'cancelReady', confirmationId }); coopNotify('正在取消本次远征确认…'); }
  return true;
}
function coopSetReady(value, confirmationId = COOP.confirmationId) {
  if (!COOP.connected || COOP.phase !== 'lobby' || !COOP.preparing || !confirmationId || confirmationId !== COOP.confirmationId) return false;
  if (typeof value !== 'boolean') return false;
  if (!value) return coopCancelReady(confirmationId);
  const previousProfile = COOP.publishedProfile;
  coopPublishProfile();
  if (!COOP.preparing || confirmationId !== COOP.confirmationId || COOP.role === 'client' && previousProfile !== COOP.publishedProfile) return false;
  if (COOP.role === 'host') {
    COOP.ready[COOP.selfId] = true; coopBroadcastLobby(); if (coopCanStart()) coopStartRun();
  } else COOP.send({ type: 'ready', confirmationId, value: true });
  return true;
}
function coopSetConfig(value) {
  const next = coopValidConfig(value);
  if (!next || !COOP.connected || COOP.role !== 'host' || COOP.phase !== 'lobby' || !regionOpen(next.act, next.diff, next.chapter)) return false;
  COOP.config = next;
  coopClearConfirmation('出征地区已更新，请房主发起远征确认。');
  coopBroadcastLobby(); return true;
}
function coopCanStart() {
  return COOP.connected && COOP.role === 'host' && COOP.phase === 'lobby' && COOP.preparing && !!COOP.confirmationId &&
    COOP.members.length >= 2 && COOP.members.length <= 4 && COOP.confirmationMembers.length === COOP.members.length &&
    COOP.confirmationMembers.every(id => COOP.members.some(m => m.id === id)) &&
    COOP.confirmationConfig === JSON.stringify(COOP.config) &&
    COOP.members.every(m => COOP.ready[m.id] && coopProfileKey(COOP.profiles[m.id]) === COOP.confirmationProfiles[m.id]) &&
    !!coopValidConfig(COOP.config) && regionOpen(COOP.config.act, COOP.config.diff, COOP.config.chapter);
}
function coopBegin(config, profiles, runId) {
  if (typeof coopTownStop === 'function') coopTownStop();
  coopClearConfirmation();
  COOP.phase = 'run'; COOP.runId = runId; COOP.runContext = { act: config.act, diff: config.diff };
  COOP.pending = []; COOP.inputSeq = 0; COOP.inputStepSeq = 0; COOP.inputSeen = {}; COOP.inputT = 0; COOP.inputBudget = 2; COOP.keySig = ''; COOP.snapshotT = 0;
  COOP.edges.clear(); COOP.lastStats = null; COOP.lastSnapshotAt = performance.now();
  if (!coopRuntimeStart({ ...config, ch: config.chapter, runId }, profiles)) return false;
  coopProgressBeginRun({ ...config, floor: 1, sessionId: COOP.sessionId, runId, playerId: COOP.selfId });
  coopSyncLocalMeta();
  if (typeof coopUIClose === 'function') coopUIClose(); resetInput();
  if (typeof scheduleGameFrame === 'function') scheduleGameFrame(); return true;
}
function coopStartRun() {
  coopPublishProfile();
  if (!coopCanStart()) { coopNotify('请由房主发起远征确认，并等待所有人同意。'); return false; }
  const confirmationId = COOP.confirmationId, confirmationSeq = COOP.confirmationSeq;
  const config = { ...COOP.config }, profiles = {};
  for (const m of COOP.members) profiles[m.id] = { ...COOP.profiles[m.id], name: m.name };
  const runId = coopUniqueId();
  if (!coopBegin(config, profiles, runId)) { COOP.phase = 'lobby'; coopNotify('关卡创建失败'); coopBroadcastLobby(); return false; }
  COOP.send({ type: 'phase', value: 'run' });
  COOP.send({ type: 'start', protocol: COOP_PROTOCOL, version: COOP_VERSION, sessionId: COOP.sessionId, runId, config, profiles,
    confirmationId, confirmationSeq });
  coopFlushProgress(); coopSendSnapshot(); return true;
}
function coopStats() {
  return { act: G.act, chapter: G.chapter, floor: G.floor, diff: G.diff, roomType: G.room?.type || 'start',
    runSouls: Math.max(0, Math.round(G.runSouls || 0)), runKills: Math.max(0, Math.round(G.runKills || 0)), gfloor: G.gfloor || 1 };
}
function coopSyncLocalMeta() {
  if (COOP_RUNTIME.active && COOP.role === 'host') coopRuntimeSyncLocalMeta();
}
function coopApplyProgress(packet) {
  let ok = false;
  if (packet.type === 'progress:event') ok = coopProgressApplyEvent(packet);
  else if (packet.type === 'progress:region') ok = coopProgressApplyRegion(packet);
  else if (packet.type === 'progress:settle') ok = coopProgressApplySettlement(packet);
  // A failed storage transaction restores fresh META objects; refresh the actor cache too.
  coopSyncLocalMeta(); return ok;
}
function coopFlushProgress() {
  if (COOP.role !== 'host') return;
  for (const p of COOP.pending.splice(0)) {
    if (p.playerId === COOP.selfId) coopApplyProgress(p);
    else COOP.send({ ...p, to: p.playerId });
  }
}
function coopSendSnapshot() {
  const snapshot = coopRuntimeSnapshot(); if (!snapshot) return;
  COOP.lastStats = coopStats(); COOP.send({ type: 'snapshot', sessionId: COOP.sessionId, runId: COOP.runId, snapshot });
}
function coopRunAction(action) {
  if (!COOP.connected || COOP.phase !== 'run') return false;
  if (COOP.role === 'host') return coopRuntimeAction(COOP.selfId, action);
  COOP.send({ type: 'action', runId: COOP.runId, action }); return true;
}
function coopReturnLobby(remote = false) {
  if (!COOP.connected || COOP.phase !== 'run' || COOP.returning || !remote && COOP.role !== 'host') return false;
  if (!remote && !COOP_RUNTIME.ended) { coopNotify('本局结束后由房主带队返回营地。'); return false; }
  COOP.returning = true; coopFlushProgress();
  if (COOP.role === 'host') { COOP.send({ type: 'returnLobby', sessionId: COOP.sessionId, runId: COOP.runId }); COOP.send({ type: 'phase', value: 'lobby' }); }
  coopRuntimeStop(); COOP_UI.journal = false; COOP.phase = 'lobby'; COOP.runId = null; COOP.runContext = null; COOP.edges.clear();
  coopClearConfirmation(); COOP.publishedProfile = null;
  enterTown(true); COOP.returning = false; coopPublishProfile();
  if (typeof coopTownEnsure === 'function') coopTownEnsure();
  if (typeof coopUIClose === 'function') coopUIClose(); return true;
}
function coopFinishDisconnect(reason) {
  const wasRun = COOP.phase === 'run', wasConnected = COOP.connected;
  if (wasRun && COOP.runId) { coopFlushProgress(); coopProgressDisconnect(COOP.lastStats || coopStats()); }
  if (typeof coopTownStop === 'function') coopTownStop();
  coopRuntimeStop(); COOP_UI.journal = false; COOP.connected = false; COOP.phase = 'lobby'; COOP.role = null; COOP.selfId = null; COOP.roomCode = null; COOP.tapRoomId = null; COOP.inviteCode = null;
  COOP.sessionId = null; COOP.runId = null; COOP.runContext = null; COOP.members = []; COOP.profiles = {}; COOP.ready = {};
  coopClearConfirmation(); COOP.confirmationSeq = 0; COOP.publishedProfile = null; COOP.profileT = 0;
  COOP.pending = []; COOP.edges.clear(); COOP.busy = false;
  if (wasRun) enterTown(true);
  if (wasConnected) coopNotify(reason === 'left' ? '已离开房间，本次已获得的魂晶和任务进度已保存。' : '与房主的连接已断开，本次已获得的魂晶和任务进度已保存。');
  if (typeof coopUIClose === 'function') coopUIClose();
}
async function coopLeave() {
  if (!COOP.connected || COOP.busy) return;
  coopFinishDisconnect('left');
  try { await coopBridge().leave(); } catch (_) {}
}
function coopOnPacket(from, packet) {
  if (!packet || typeof packet !== 'object' || typeof packet.type !== 'string' || !COOP.connected) return;
  if (COOP.phase === 'lobby' && typeof coopTownPacket === 'function' && coopTownPacket(from, packet)) return;
  if (COOP.role === 'host') {
    if (!COOP.members.some(m => m.id === from) || from === COOP.selfId) return;
    if (COOP.phase === 'lobby') {
      if (packet.type === 'profile') {
        const profile = coopValidProfile(packet.profile);
        if (packet.protocol !== COOP_PROTOCOL || packet.version !== COOP_VERSION || !profile) {
          delete COOP.profiles[from];
          if (COOP.preparing) coopClearConfirmation('队员角色同步失败，本次远征确认已取消。');
          coopBroadcastLobby();
          COOP.send({ type: 'refused', to: from, message: '游戏版本不同，请使用相同的 ' + COOP_VERSION + ' 版本。' }); return;
        }
        coopStoreProfile(from, profile); coopBroadcastLobby();
      } else if ((packet.type === 'ready' || packet.type === 'cancelReady') && COOP.preparing &&
          packet.confirmationId === COOP.confirmationId && COOP.confirmationMembers.includes(from)) {
        if (packet.type === 'cancelReady' || packet.value === false) { coopClearConfirmation('队员取消了本次远征，可以继续整备。'); coopBroadcastLobby(); }
        else if (packet.value === true && coopProfileKey(COOP.profiles[from]) === COOP.confirmationProfiles[from]) {
          COOP.ready[from] = true; coopBroadcastLobby(); if (coopCanStart()) coopStartRun();
        }
      }
    } else if (packet.runId === COOP.runId) {
      if (packet.type === 'input:reset') {
        const actor = COOP_RUNTIME.actors.get(from);
        if (actor && actor.connected && actor.inputSteps) coopRuntimeClearInput(actor);
      } else if (packet.type === 'input' && packet.command && typeof packet.command === 'object' && !Array.isArray(packet.command) &&
          Number.isSafeInteger(packet.seq) && packet.seq > (COOP.inputSeen[from] || 0)) {
        if (coopRuntimeInput(from, packet.command)) {
          COOP.inputSeen[from] = packet.seq;
          COOP_RUNTIME.actors.get(from).inputSeq = packet.seq;
        }
      } else if (packet.type === 'action') coopRuntimeAction(from, packet.action);
    }
    return;
  }
  if (from !== COOP.hostId) return;
  if (packet.type === 'refused') { const message = packet.message; coopLeave().then(() => coopNotify(message)); return; }
  if (packet.type === 'lobby' && COOP.phase === 'lobby') {
    if (packet.protocol !== COOP_PROTOCOL || packet.version !== COOP_VERSION || !coopValidConfig(packet.config) || !coopProgressId(packet.sessionId) ||
        !Array.isArray(packet.members) || packet.members.length > 4 || packet.members.length !== COOP.members.length ||
        new Set(packet.members.map(m => m?.id)).size !== packet.members.length ||
        packet.members.some(m => !m || !COOP.members.some(peer => peer.id === m.id) || m.starter !== null && !CAMP_STARTERS.includes(m.starter)) ||
        !Number.isSafeInteger(packet.confirmationSeq) || packet.confirmationSeq < COOP.confirmationSeq ||
        typeof packet.preparing !== 'boolean' || (packet.preparing ? !coopProgressId(packet.confirmationId) : packet.confirmationId !== null) ||
        packet.confirmationSeq === COOP.confirmationSeq && packet.confirmationId !== COOP.confirmationId) return;
    const newlyPreparing = packet.preparing && packet.confirmationId !== COOP.confirmationId;
    COOP.sessionId = packet.sessionId; COOP.config = coopValidConfig(packet.config);
    if (typeof coopTownEnsure === 'function') coopTownEnsure();
    COOP.preparing = packet.preparing; COOP.confirmationId = packet.confirmationId; COOP.confirmationSeq = packet.confirmationSeq;
    for (const m of COOP.members) {
      const peer = packet.members.find(x => x.id === m.id); COOP.ready[m.id] = m.ready = COOP.preparing && peer.ready === true;
      m.starter = peer.starter;
    }
    coopNotify(typeof packet.note === 'string' ? packet.note : COOP.preparing ? '请确认本次远征，全部同意后自动出发。' : '已连接队伍，等待房主发起远征。');
    if (newlyPreparing && typeof coopShowConfirmation === 'function') coopShowConfirmation(); return;
  }
  if (packet.type === 'start' && COOP.phase === 'lobby') {
    const config = coopValidConfig(packet.config);
    if (!config || packet.sessionId !== COOP.sessionId || !coopProgressId(packet.runId) || packet.version !== COOP_VERSION || packet.protocol !== COOP_PROTOCOL ||
        !COOP.preparing || !COOP.confirmationId || packet.confirmationId !== COOP.confirmationId || packet.confirmationSeq !== COOP.confirmationSeq ||
        JSON.stringify(config) !== JSON.stringify(COOP.config) || !COOP.members.every(m => COOP.ready[m.id])) return;
    const profiles = {};
    for (const m of COOP.members) { const profile = coopValidProfile(packet.profiles?.[m.id]); if (!profile) return; profiles[m.id] = { ...profile, name: m.name }; }
    coopBegin(config, profiles, packet.runId); return;
  }
  if (packet.sessionId !== COOP.sessionId || packet.runId !== COOP.runId || COOP.phase !== 'run') return;
  if (packet.type === 'snapshot') {
    if (coopRuntimeApply(packet.snapshot)) { COOP.lastSnapshotAt = performance.now(); COOP.lastStats = coopStats(); }
  } else if (packet.type.startsWith('progress:')) coopApplyProgress(packet);
  else if (packet.type === 'returnLobby') coopReturnLobby(true);
}
function coopOnEvent(event) {
  if (!event || typeof event.type !== 'string') return;
  if (event.type === 'roster') {
    if (COOP.role !== 'host' && COOP.role !== 'client') return;
    const previous = COOP.members;
    COOP.connected = true; COOP.selfId = event.selfId; COOP.hostId = event.hostId;
    COOP.members = event.players.map(m => ({ id: m.id, name: coopName(m.name), ready: !!COOP.ready[m.id] }));
    if (event.addresses) COOP.addresses = event.addresses; if (event.port) COOP.port = event.port;
    if (COOP.role === 'host' && typeof event.roomCode === 'string') COOP.roomCode = event.roomCode;
    if (COOP.role === 'host') {
      if (COOP.phase === 'lobby' && COOP.preparing && (previous.length !== COOP.members.length ||
          previous.some(old => !COOP.members.some(m => m.id === old.id)))) coopClearConfirmation('队伍成员已变化，请房主重新发起远征。');
      for (const old of previous) if (!COOP.members.some(m => m.id === old.id)) {
        if (COOP.phase === 'run') coopRuntimeDisconnect(old.id);
        delete COOP.profiles[old.id]; delete COOP.ready[old.id];
      }
      if (COOP.phase === 'lobby') coopPublishProfile(true);
    } else if (!previous.length && COOP.phase === 'lobby') coopPublishProfile();
    if (COOP.phase === 'lobby' && typeof coopTownRoster === 'function') coopTownRoster();
    if (typeof coopUIRefresh === 'function') coopUIRefresh();
  } else if (event.type === 'packet') coopOnPacket(event.from, event.packet);
  else if (event.type === 'closed') coopFinishDisconnect(event.reason);
  else if (event.type === 'error') coopNotify(event.message || '局域网连接异常');
  else if (event.type === 'network') {
    resetInput(); COOP.edges.clear(); COOP.inputT = 0; COOP.keySig = '';
    if (typeof coopViewReset === 'function') coopViewReset();
    if (COOP.phase === 'lobby' && typeof coopTownResetInput === 'function') coopTownResetInput();
    if (!event.reconnecting && COOP.role === 'client' && COOP.phase === 'run') COOP.send({ type: 'input:reset', runId: COOP.runId });
    if (!event.reconnecting) { COOP.publishedProfile = null; coopPublishProfile(true); }
    coopNotify(event.reconnecting ? '连接暂时中断，正在重新连接房主…' : '连接已恢复。');
  }
}
function coopNetworkFrameBefore(dt) {
  if (COOP.connected && COOP.phase === 'lobby') {
    if (typeof coopTownFrameBefore === 'function') coopTownFrameBefore(dt);
    COOP.profileT += dt;
    if (COOP.profileT >= .2) { COOP.profileT %= .2; coopPublishProfile(); }
  }
  if (!COOP.connected || COOP.phase !== 'run') return false;
  if (COOP.role === 'client' && coopIsTap() && !coopBridge().inputReady) { resetInput(); return false; }
  if ((G.mode === 'win' || G.mode === 'dead') && G.endT >= 1.2 && Input.anyPressed) {
    resetInput(); if (COOP.role === 'host') coopReturnLobby(); else coopNotify('等待房主带队返回营地，也可点击离开房间。');
    return true;
  }
  const command = coopRuntimeLocalCommand();
  if (COOP.role === 'host') coopRuntimeInput(COOP.selfId, command);
  else {
    if (consume('mute')) { toggleMute(); command.pressed = command.pressed.filter(k => k !== 'mute'); command.keys = command.keys.filter(k => k !== 'mute'); }
    command.pressed.forEach(k => COOP.edges.add(k)); COOP.latest = command; COOP.inputT += dt;
    // Send edges on this frame. A small token bucket bounds rapid changes to 45/s, below the relay budget.
    coopViewQueueInput(command);
    const inputHz = coopBridge()?.inputHz || 30, budgetHz = coopBridge()?.inputHz || 45;
    COOP.inputBudget = Math.min(2, (COOP.inputBudget ?? 2) + dt * budgetHz);
    const keySig = command.keys.slice().sort().join();
    const urgent = keySig !== COOP.keySig || COOP.edges.size > 0;
    if ((COOP.inputT >= 1 / inputHz || urgent) && COOP.inputBudget >= 1) {
      COOP.inputBudget--; COOP.inputT = 0; COOP.keySig = keySig;
      COOP.send({ type: 'input', runId: COOP.runId, seq: ++COOP.inputSeq, command: { ...command, pressed: [...COOP.edges],
        steps: COOP_VIEW.outbox.splice(0), roomRevision: COOP_RUNTIME.roomRevision, inputReset: COOP_VIEW.inputReset } }); COOP.edges.clear();
    }
    Input.pressed.clear(); Input.anyPressed = false;
  }
  return false;
}
function coopNetworkFrameAfter(dt) {
  if (COOP.connected && COOP.phase === 'lobby' && typeof coopTownFrameAfter === 'function') coopTownFrameAfter(dt);
  if (!COOP.connected || COOP.phase !== 'run' || COOP.role !== 'host') return;
  coopFlushProgress(); COOP.lastStats = coopStats(); COOP.snapshotT += dt;
  const snapshotStep = 1 / (coopBridge()?.snapshotHz || 20);
  if (COOP.snapshotT >= snapshotStep) { COOP.snapshotT %= snapshotStep; coopSendSnapshot(); }
}
// Run after the runtime hook so LAN clients never enter the single-player updater.
coopRuntimeInstall();
const coopNetworkOriginalUpdate = update;
update = function (dt) {
  if (coopNetworkFrameBefore(dt)) return;
  if (typeof COOP_UI !== 'undefined' && COOP_UI.open) { G.time += dt; resetInput(); }
  else coopNetworkOriginalUpdate(dt);
  coopNetworkFrameAfter(dt);
};
const coopNetworkOriginalNewRun = newRun;
newRun = function (...args) {
  if (COOP.connected && COOP.phase === 'lobby' && !COOP_RUNTIME.initializing) { coopOpenLobby(); return; }
  return coopNetworkOriginalNewRun(...args);
};
window.addEventListener('load', () => { coopBindBridge(); coopProgressRecover(); });
