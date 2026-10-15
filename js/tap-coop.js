'use strict';
// Tap is injected by the TapTap H5 runtime; no client secret or SDK download is needed.
const TAP_COOP = { manager: null, listener: null, listeners: new Set(), room: null, rawSelf: null, selfId: null,
  phase: 'lobby', generation: 0, queue: [], states: new Map(), bases: new Map(), active: null, timer: null,
  nonce: '', seq: 0, receiver: null, resyncAt: 0, rosterKey: '', snapshotReady: false, sending: false, inFlight: 0, nextSendAt: 0 };
function tapCoopAvailable() {
  return !!(window.tap && typeof window.tap.getOnlineBattleManager === 'function' || window.dungeonDesktop?.tapBattle?.supported);
}
let tapCoopDesktopManager = null;
// Reversible random invitation labels: platform room IDs remain internal.
// The checksum catches typing errors; it is not an authentication mechanism.
const TAP_INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function tapInviteKey() {
  const bytes = new Uint8Array(4);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}
function tapInviteChecksum(bytes) {
  let value = 0x811c9dc5;
  for (const byte of bytes) value = Math.imul(value ^ byte, 0x01000193) >>> 0;
  return (value ^ (value >>> 16)) & 65535;
}
function tapInviteCode(roomId, key) {
  if (!/^[a-f0-9]{8}$/.test(key)) return roomId; // Existing rooms can still share their original ID.
  const raw = window.fflate.strToU8(roomId), bytes = new Uint8Array(raw.length + 6);
  for (let i = 0; i < 4; i++) bytes[i] = parseInt(key.slice(i * 2, i * 2 + 2), 16);
  for (let i = 0; i < raw.length; i++) bytes[i + 4] = raw[i] ^ bytes[i % 4];
  const sum = tapInviteChecksum(bytes.subarray(0, -2)); bytes[bytes.length - 2] = sum >>> 8; bytes[bytes.length - 1] = sum & 255;
  let value = 0, bits = 0, text = '';
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { bits -= 5; text += TAP_INVITE_ALPHABET[(value >>> bits) & 31]; }
  }
  if (bits) text += TAP_INVITE_ALPHABET[(value << (5 - bits)) & 31];
  return 'DH-' + text.match(/.{1,4}/g).join('-');
}
// 6-digit invitations: TapTap has no code lookup service, so the room type carries the
// code ("dungeon-h5-<version>-<digits>", <= 32 bytes) and getRoomList({ roomType }) finds it.
// The digits are also stored in the room properties and re-checked after joining.
function tapInviteDigits() {
  const value = new Uint32Array(1), limit = 4294000000;   // 4294000000 % 1e6 === 0: no modulo bias
  do {
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(value);
    else value[0] = Math.floor(Math.random() * limit);
  } while (value[0] >= limit);
  return String(value[0] % 1000000).padStart(6, '0');
}
function tapInviteDigitsRead(input) {
  const text = String(input || '').replace(/[\s\-－—]/g, '');
  return /^\d{6}$/.test(text) ? text : null;
}
function tapCoopRoomType(digits) { return `dungeon-h5-${COOP_VERSION}` + (digits ? '-' + digits : ''); }
async function tapCoopRoomsByCode(manager, digits) {
  const result = await tapCoopCall(manager, 'getRoomList', { data: { roomType: tapCoopRoomType(digits), offset: 0, limit: 10 } });
  return (Array.isArray(result.rooms) ? result.rooms : []).filter(room => room && typeof room.id === 'string' && room.id &&
    room.type === tapCoopRoomType(digits) && tapCoopJson(room.customProperties).inviteDigits === digits);
}
function tapInviteRead(input) {
  const digits = tapInviteDigitsRead(input);
  if (digits) return { roomId: null, key: null, digits };
  const text = String(input || '').trim();
  if (!/^DH-/i.test(text)) {
    if (!text || text.length > 128 || /[\s\u0000-\u001f]/.test(text)) throw Error('请输入房主分享的邀请码。');
    return { roomId: text, key: null };
  }
  const encoded = text.slice(3).toUpperCase().replace(/[\s-]/g, '');
  if (encoded.length < 12 || encoded.length > 840) throw Error('邀请码不完整，请重新复制。');
  let value = 0, bits = 0; const list = [];
  for (const char of encoded) {
    const index = TAP_INVITE_ALPHABET.indexOf(char); if (index < 0) throw Error('邀请码包含无效字符。');
    value = (value << 5) | index; bits += 5;
    if (bits >= 8) { bits -= 8; list.push((value >>> bits) & 255); }
  }
  const bytes = new Uint8Array(list), end = bytes.length - 2;
  if (end < 5 || (bits && (value & ((1 << bits) - 1))) || tapInviteChecksum(bytes.subarray(0, end)) !== (bytes[end] << 8 | bytes[end + 1]))
    throw Error('邀请码校验失败，请重新复制。');
  const key = [...bytes.subarray(0, 4)].map(b => b.toString(16).padStart(2, '0')).join('');
  const raw = bytes.slice(4, end); for (let i = 0; i < raw.length; i++) raw[i] ^= bytes[i % 4];
  const roomId = window.fflate.strFromU8(raw);
  if (!roomId || roomId.length > 128 || /[\s\u0000-\u001f]/.test(roomId) || tapInviteCode(roomId, key).replace(/-/g, '').slice(2) !== encoded)
    throw Error('邀请码校验失败，请重新复制。');
  return { roomId, key };
}
function tapCoopGetManager() {
  if (window.tap && typeof window.tap.getOnlineBattleManager === 'function') return window.tap.getOnlineBattleManager();
  if (tapCoopDesktopManager) return tapCoopDesktopManager;
  const bridge = window.dungeonDesktop.tapBattle, listeners = new Set();
  const manager = { registerListener: listener => listeners.add(listener), unregisterListener: listener => listeners.delete(listener) };
  bridge.onEvent(event => { for (const listener of listeners) listener[event.type]?.(event.data || {}); });
  for (const method of ['connect', 'disconnect', 'createRoom', 'getRoomList', 'joinRoom', 'leaveRoom', 'sendCustomMessage', 'updateRoomProperties', 'kickRoomPlayer'])
    manager[method] = async options => {
      const result = await bridge.request(method, options.data || {});
      if (!result.ok) throw Error(result.error || 'TapTap 联机请求失败'); return result.data || {};
    };
  tapCoopDesktopManager = manager; return manager;
}
function tapCoopId(raw) {
  if (typeof raw !== 'string' || !raw || window.fflate.strToU8(raw).length > 80) throw Error('TapTap 玩家标识无效');
  return 'tap-' + tapWireBase64(window.fflate.strToU8(raw)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function tapCoopJson(raw) { try { return typeof raw === 'string' ? JSON.parse(raw) : raw || {}; } catch (_) { return {}; } }
function tapCoopEmit(event) { for (const listener of TAP_COOP.listeners) listener(event); }
function tapCoopCall(object, method, options = {}) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error, result) => {
      if (finished) return; finished = true; clearTimeout(timer);
      if (error) reject(Error(String(error.errMsg || error.message || error.reason || error).slice(0, 160))); else resolve(result || {});
    };
    const timer = setTimeout(() => finish(Error('TapTap 连接超时，请重试')), method === 'connect' && window.dungeonDesktop?.tapBattle?.supported ? 80000 : 15000);
    try {
      if (typeof object[method] !== 'function') throw Error('当前 TapTap 版本不支持此联机功能，请更新客户端');
      const promise = object[method]({ ...options, success: result => finish(null, result), fail: error => finish(error) });
      if (promise && typeof promise.then === 'function') promise.then(result => finish(null, result), error => finish(error));
    } catch (error) { finish(error); }
  });
}
function tapCoopRoster() {
  const T = TAP_COOP; if (!T.room) return;
  const players = T.room.players.filter(p => p.status !== 0).map(p => ({ id: tapCoopId(p.id), name: coopName(tapCoopJson(p.customProperties).name) }));
  players.sort((a, b) => Number(b.id === tapCoopId(T.room.ownerId)) - Number(a.id === tapCoopId(T.room.ownerId)));
  const key = JSON.stringify(players); if (key === T.rosterKey) return; T.rosterKey = key;
  tapCoopEmit({ type: 'roster', selfId: T.selfId, hostId: tapCoopId(T.room.ownerId), players });
}
function tapCoopStop(reason) {
  const T = TAP_COOP; T.generation++; clearTimeout(T.timer); T.timer = null;
  T.room = null; T.rawSelf = T.selfId = null; T.phase = 'lobby'; T.queue = []; T.states.clear(); T.bases.clear();
  T.active = null; T.receiver = null; T.sending = false; T.inFlight = 0; T.nextSendAt = 0; T.rosterKey = ''; T.snapshotReady = false;
  if (reason) tapCoopEmit({ type: 'closed', reason });
}
function tapCoopReceive(from, packet) {
  const T = TAP_COOP;
  if (packet.to && packet.to !== T.selfId) return;
  if (packet.type === 'tap:batch') {
    if (Array.isArray(packet.packets) && packet.packets.length <= 32) for (const child of packet.packets)
      if (child && typeof child.type === 'string' && child.type !== 'tap:batch') tapCoopReceive(from, child);
    return;
  }
  if (packet.type === 'tap:keyframe') {
    if (T.rawSelf !== T.room.ownerId || Date.now() - T.resyncAt < 500) return;
    T.resyncAt = Date.now(); T.bases.clear();
    if (COOP.phase === 'run') coopSendSnapshot(); else COOP_TOWN.fullT = 1;
    return;
  }
  if (packet.type === 'snapshot' && from === tapCoopId(T.room.ownerId)) T.snapshotReady = true;
  if (packet.type === 'start' && from === tapCoopId(T.room.ownerId)) { T.phase = 'run'; T.snapshotReady = false; }
  tapCoopEmit({ type: 'packet', from, packet });
}
function tapCoopInstall(manager) {
  const T = TAP_COOP;
  if (T.manager === manager && T.listener) return;
  if (T.manager && T.listener && typeof T.manager.unregisterListener === 'function') T.manager.unregisterListener(T.listener);
  T.manager = manager;
  const entered = info => {
    if (!T.room || info.roomId && info.roomId !== T.room.id || !info.playerInfo?.id) return;
    const player = info.playerInfo;
    if (T.rawSelf === T.room.ownerId && T.phase === 'run' && !T.room.players.some(p => p.id === player.id)) {
      tapCoopCall(manager, 'kickRoomPlayer', { data: { playerId: player.id } }).catch(() => {}); return;
    }
    const index = T.room.players.findIndex(p => p.id === player.id);
    if (index < 0) T.room.players.push(player); else T.room.players[index] = player;
    tapCoopRoster();
    // A newly joined client has no baseline for the host's existing town stream.
    T.bases.clear(); COOP_TOWN.fullT = 1;
  };
  const left = info => {
    if (!T.room || info.roomId && info.roomId !== T.room.id) return;
    const id = info.playerInfo?.id || info.playerId;
    if (id === T.rawSelf || id === T.room.ownerId) {
      tapCoopStop('room closed'); tapCoopCall(manager, 'disconnect').catch(() => {}); return;
    }
    T.room.players = T.room.players.filter(p => p.id !== id); tapCoopRoster();
  };
  const message = info => {
    if (!T.room) return;
    const rawId = info.playerId || info.fromPlayerId;
    if (rawId === T.rawSelf || !T.room.players.some(p => p.id === rawId)) return;
    if (T.rawSelf !== T.room.ownerId && rawId !== T.room.ownerId) return;
    T.receiver(tapCoopId(rawId), info.message ?? info.msg);
  };
  const properties = info => {
    if (!T.room || info.id && info.id !== T.room.id) return;
    if (info.ownerId && info.ownerId !== T.room.ownerId) { tapCoopStop('room closed'); return; }
    const custom = tapCoopJson(info.customProperties ?? info.properties);
    if (custom.phase) T.room.customProperties = JSON.stringify(custom);
  };
  // The public JS reference and the official H5 MCP guide use these two event spellings.
  T.listener = { playerEnterRoom: entered, onPlayerEntered: entered, playerLeaveRoom: left, onPlayerLeft: left,
    playerOffline: left, onPlayerOffline: left, onCustomMessage: message, onCustomMessageReceived: message,
    onRoomPropertiesChange: properties, onRoomPropertiesChanged: properties,
    onDisconnected: () => tapCoopStop('network disconnected'),
    onAuthRequired: () => coopNotify('请在 TapTap PC 客户端确认登录授权。'),
    onPlayerKicked: left, onBattleServiceError: info => {
      tapCoopStop('network disconnected'); tapCoopEmit({ type: 'error', message: info.errorMessage || 'TapTap 联机服务异常' });
    } };
  manager.registerListener(T.listener);
}
async function tapCoopConnect() {
  const T = TAP_COOP, generation = T.generation;
  if (!tapCoopAvailable()) throw Error('请在 TapTap 内打开游戏后使用联机');
  const manager = tapCoopGetManager(); tapCoopInstall(manager);
  if (typeof window.tap?.login === 'function') await tapCoopCall(window.tap, 'login');
  const result = await tapCoopCall(manager, 'connect');
  if (generation !== T.generation) throw Error('连接已取消');
  T.rawSelf = result.playerId; T.selfId = tapCoopId(result.playerId); return manager;
}
function tapCoopAdopt(room) {
  const T = TAP_COOP, properties = tapCoopJson(room?.customProperties);
  const digits = tapInviteDigitsRead(properties.inviteDigits) === properties.inviteDigits ? properties.inviteDigits : null;
  if (!room || typeof room.id !== 'string' || !room.id || room.id.length > 128 || !room.ownerId ||
      !Array.isArray(room.players) || room.players.length > 4 || room.type !== tapCoopRoomType(digits) ||
      properties.version !== COOP_VERSION || properties.protocol !== COOP_PROTOCOL || properties.phase !== 'lobby' ||
      !room.players.some(p => p.id === T.rawSelf) || !room.players.some(p => p.id === room.ownerId)) throw Error('房间正在冒险或游戏版本不同，请重新创建房间');
  T.room = { ...room, players: room.players.slice() }; T.phase = 'lobby'; T.rosterKey = '';
  T.nonce = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); T.seq = 0; T.bases.clear();
  T.snapshotReady = T.rawSelf === room.ownerId;
  T.receiver = tapWireReceiver(room.id, tapCoopReceive, () => {
    if (Date.now() - T.resyncAt > 1000) { T.resyncAt = Date.now(); tapCoopSend({ type: 'tap:keyframe' }); }
  });
  tapCoopRoster(); return { ok: true, selfId: T.selfId, tapRoomId: room.id, inviteCode: digits || tapInviteCode(room.id, properties.inviteKey) };
}
async function tapCoopEnter(options, host) {
  try {
    const invitation = host ? { key: tapInviteKey() } : tapInviteRead(options.roomId);
    const manager = await tapCoopConnect();
    const playerCfg = { customProperties: JSON.stringify({ name: options.name, version: COOP_VERSION }) };
    if (host) {
      // A fresh code must not already name a waiting room (1 in a million per open room; retry a few times).
      for (let attempt = 0; attempt < 5 && !invitation.digits; attempt++) {
        const digits = tapInviteDigits();
        if (!(await tapCoopRoomsByCode(manager, digits)).length) invitation.digits = digits;
      }
      if (!invitation.digits) throw Error('暂时无法生成邀请码，请稍后重试。');
    } else if (invitation.digits) {
      const rooms = (await tapCoopRoomsByCode(manager, invitation.digits)).filter(room => {
        const p = tapCoopJson(room.customProperties); return p.phase === 'lobby' && p.version === COOP_VERSION && p.protocol === COOP_PROTOCOL;
      });
      if (!rooms.length) throw Error('没有找到这个邀请码的房间：请核对 6 位数字，或房间已开始冒险、已解散。');
      if (rooms.length > 1) throw Error('这个邀请码对应多个房间，请让房主重新创建房间。');
      invitation.roomId = rooms[0].id;
    }
    const result = await tapCoopCall(manager, host ? 'createRoom' : 'joinRoom', { data: host ? {
      roomCfg: { maxPlayerCount: 4, type: tapCoopRoomType(invitation.digits), name: options.name.slice(0, 16) + '的冒险队',
        matchParams: { level: '0', score: '0' }, customProperties: JSON.stringify({ version: COOP_VERSION, protocol: COOP_PROTOCOL, phase: 'lobby', inviteKey: invitation.key, inviteDigits: invitation.digits }) }, playerCfg,
    } : { roomId: invitation.roomId, playerCfg } });
    const joined = tapCoopJson(result.roomInfo?.customProperties);
    if (!host && (invitation.key && joined.inviteKey !== invitation.key || invitation.digits && joined.inviteDigits !== invitation.digits))
      throw Error('这个邀请码已失效，请向房主要新的邀请码。');
    return tapCoopAdopt(result.roomInfo);
  } catch (error) {
    const manager = TAP_COOP.manager;
    tapCoopStop();
    if (manager) { await tapCoopCall(manager, 'leaveRoom').catch(() => {}); await tapCoopCall(manager, 'disconnect').catch(() => {}); }
    return { ok: false, error: error.message };
  }
}
function tapCoopWake() {
  const T = TAP_COOP;
  if (!T.timer && !T.sending && T.room && T.inFlight < 8) T.timer = setTimeout(tapCoopTick, Math.max(0, T.nextSendAt - Date.now()));
}
function tapCoopSend(packet) {
  const T = TAP_COOP; if (!T.room) return;
  if (packet.type === 'phase') {
    if (T.rawSelf !== T.room.ownerId || !['run', 'lobby'].includes(packet.value)) return;
    T.phase = packet.value; T.snapshotReady = T.rawSelf === T.room.ownerId || packet.value === 'lobby'; T.states.clear();
    T.queue.push({ phase: packet.value });
  } else {
    const channel = tapWireChannel(packet);
    if (channel) {
      const previous = T.states.get(channel);
      if (packet.type === 'snapshot') for (const key of COOP_FX_KEYS) {
        // Bound cosmetic bursts on the paced Tap link; combat bullets and warnings stay complete.
        packet.snapshot.world.fx[key] = [...(previous?.snapshot.world.fx[key] || []), ...packet.snapshot.world.fx[key]].slice(-64);
      }
      // At most one unsent world state; slow links never collect seconds of old movement.
      for (const key of T.states.keys()) if (key.split(':')[0] === channel.split(':')[0] && key !== channel) T.states.delete(key);
      T.states.set(channel, packet);
    } else {
      const last = T.queue[T.queue.length - 1];
      if (packet.type === 'input' && last?.type === 'input' && last.runId === packet.runId &&
          last.command.roomRevision === packet.command.roomRevision && last.command.inputReset === packet.command.inputReset &&
          last.command.steps.length + packet.command.steps.length <= coopInputQueueLimit()) {
        packet.command.steps = [...last.command.steps, ...packet.command.steps]; T.queue.pop();
      } else if (packet.type === 'town:input' && last?.type === 'town:input' && last.townId === packet.townId) {
        if (packet.command.steps && last.command.steps && packet.command.inputReset === last.command.inputReset &&
            packet.command.blocked === last.command.blocked && last.command.steps.length + packet.command.steps.length <= coopInputQueueLimit()) {
          packet.command.steps = [...last.command.steps, ...packet.command.steps]; T.queue.pop();
        } else if (!packet.command.steps && !last.command.steps) {
          packet.command.pressed = [...new Set([...last.command.pressed, ...packet.command.pressed])];
          packet.command.attack ||= last.command.attack; T.queue.pop();
        }
      }
      T.queue.push(packet);
    }
  }
  if (T.queue.length > 128) { tapCoopStop('network overloaded'); return; }
  tapCoopWake();
}
async function tapCoopTick() {
  const T = TAP_COOP; T.timer = null;
  if (!T.room || T.sending) return;
  const generation = T.generation; T.sending = true;
  const failed = error => { if (generation === T.generation) { tapCoopStop('send failed'); coopNotify('TapTap 联机发送失败：' + error.message); } };
  try {
    // Reliable events and inputs can pass between a keyframe's chunks.
    const queued = T.queue.shift();
    if (queued?.phase) {
      const customProperties = JSON.stringify({ ...tapCoopJson(T.room.customProperties), version: COOP_VERSION, protocol: COOP_PROTOCOL, phase: queued.phase });
      T.nextSendAt = Date.now() + 80;
      await tapCoopCall(T.manager, 'updateRoomProperties', { data: { customProperties } });
    } else {
      let active = T.active;
      if (queued?.wire) active = queued.wire;
      else if (queued) {
        const batch = [queued]; let bytes = JSON.stringify(queued).length;
        while (T.queue.length && !T.queue[0].phase && !T.queue[0].wire && batch.length < 32) {
          const size = JSON.stringify(T.queue[0]).length;
          if (bytes + size > 16384) break;
          bytes += size; batch.push(T.queue.shift());
        }
        active = { ...tapWireEncode(batch.length > 1 ? { type: 'tap:batch', packets: batch } : queued, null, T.room.id, T.nonce, ++T.seq), index: 0, control: true };
      }
      else if (!active && T.states.size) {
        const [channel, packet] = T.states.entries().next().value; T.states.delete(channel);
        active = { ...tapWireEncode(packet, T.bases.get(channel), T.room.id, T.nonce, ++T.seq), index: 0 };
      }
      if (!active) return;
      // Pace dispatches, not acknowledgements: a slow SDK receipt must not stop
      // input/snapshot delivery. Pending receipts stay bounded; failures still close the session.
      T.nextSendAt = Date.now() + 80; T.inFlight++;
      tapCoopCall(T.manager, 'sendCustomMessage', { data: { msg: active.chunks[active.index], type: 0 } }).then(() => {
        if (generation === T.generation) { T.inFlight--; if (T.queue.length || T.active || T.states.size) tapCoopWake(); }
      }, failed);
      active.index++;
      if (active.index === active.chunks.length) {
        if (active.channel) { T.bases.set(active.channel, { packet: active.packet, seq: active.seq }); while (T.bases.size > 8) T.bases.delete(T.bases.keys().next().value); }
        if (!active.control) T.active = null;
      } else if (active.control) {
        // Large reliable controls finish before later controls; the state stream can wait.
        T.queue.unshift({ wire: active });
      } else T.active = active;
    }
  } catch (error) { failed(error); }
  finally {
    if (generation === T.generation) { T.sending = false; if (T.queue.length || T.active || T.states.size) tapCoopWake(); }
  }
}
const TAP_COOP_BRIDGE = { kind: 'tap', inputHz: 12, snapshotHz: 8,
  get inputReady() { return TAP_COOP.snapshotReady; },
  host: options => tapCoopEnter(options, true), join: options => tapCoopEnter(options, false), send: tapCoopSend,
  leave: async () => {
    const manager = TAP_COOP.manager; tapCoopStop();
    if (manager) { await tapCoopCall(manager, 'leaveRoom').catch(() => {}); await tapCoopCall(manager, 'disconnect').catch(() => {}); }
    return { ok: true };
  },
  onEvent: listener => { TAP_COOP.listeners.add(listener); return () => TAP_COOP.listeners.delete(listener); }
};
