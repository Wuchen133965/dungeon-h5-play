'use strict';
// TapTap custom messages are UTF-8 strings <= 2048 bytes. Snapshots use a
// compressed delta stream; controls use independent packets so they can interrupt a large keyframe.
const TAP_WIRE_LIMIT = 512 * 1024, TAP_WIRE_PART = 1800;
function tapWireBase64(bytes) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return window.btoa(text);
}
function tapWireBytes(text) {
  const binary = window.atob(text), out = new Uint8Array(binary.length);
  for (let i = 0; i < out.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
function tapWireSafe(value, depth = 0, budget = { n: 0 }) {
  if (++budget.n > 200000 || depth > 64) throw Error('联机数据过于复杂');
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return;
  if (!value || typeof value !== 'object') throw Error('联机数据格式错误');
  for (const key of Object.keys(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('联机数据键名无效');
    tapWireSafe(value[key], depth + 1, budget);
  }
}
function tapWireDiff(before, after) {
  if (before === after) return null;
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object' || Array.isArray(before) !== Array.isArray(after)) return [0, after];
  const updates = [], removed = [];
  for (const key of Object.keys(after)) {
    const delta = Object.hasOwn(before, key) ? tapWireDiff(before[key], after[key]) : [0, after[key]];
    if (delta) updates.push([key, delta]);
  }
  if (Array.isArray(after)) return updates.length || before.length !== after.length ? [2, after.length, updates] : null;
  for (const key of Object.keys(before)) if (!Object.hasOwn(after, key)) removed.push(key);
  return updates.length || removed.length ? [1, updates, removed] : null;
}
function tapWirePatch(before, delta, depth = 0, budget = { n: 0 }) {
  if (++budget.n > 200000 || depth > 64 || !Array.isArray(delta)) throw Error('联机增量无效');
  if (delta[0] === 0 && delta.length === 2) return delta[1];
  const array = delta[0] === 2;
  if (!(array ? Array.isArray(before) : delta[0] === 1 && before && typeof before === 'object' && !Array.isArray(before))) throw Error('联机增量类型不匹配');
  const updates = delta[array ? 2 : 1], out = array ? before.slice() : { ...before };
  if (!Array.isArray(updates)) throw Error('联机增量无效');
  if (array) {
    if (!Number.isInteger(delta[1]) || delta[1] < 0 || delta[1] > 200000) throw Error('联机数组超限');
    out.length = delta[1];
  } else {
    if (!Array.isArray(delta[2])) throw Error('联机删除列表无效');
    for (const key of delta[2]) delete out[key];
  }
  for (const pair of updates) {
    if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(pair[0]) ||
        array && (!/^\d+$/.test(pair[0]) || Number(pair[0]) >= out.length)) throw Error('联机增量键名无效');
    out[pair[0]] = tapWirePatch(out[pair[0]], pair[1], depth + 1, budget);
  }
  return out;
}
function tapWireChannel(packet) {
  if (packet.type === 'snapshot') return `run:${packet.runId}:${packet.snapshot.roomRevision}`;
  if (packet.type === 'town:snapshot') return `town:${packet.sessionId}:${packet.townId}`;
  return '';
}
function tapWireEncode(packet, base, roomId, nonce, seq) {
  // Keep an immutable sender baseline even when the host's cold caches are reused.
  const copy = JSON.parse(JSON.stringify(packet)); tapWireSafe(copy);
  const channel = tapWireChannel(copy), payload = { c: channel, n: seq, b: channel && base ? base.seq : 0,
    d: channel && base ? tapWireDiff(base.packet, copy) || [1, [], []] : [0, copy] };
  // ASCII JSON escapes preserve emoji even in WebViews without native UTF-8 codecs.
  const json = JSON.stringify(payload).replace(/[\u007f-\uffff]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  const raw = window.fflate.strToU8(json);
  if (raw.length > TAP_WIRE_LIMIT) throw Error('联机数据超过上限');
  const text = tapWireBase64(window.fflate.deflateSync(raw, { level: 1 })), count = Math.ceil(text.length / TAP_WIRE_PART);
  if (count > 256) throw Error('联机数据超过分片上限');
  const chunks = Array.from({ length: count }, (_, index) => JSON.stringify(['dh5tap1', roomId, nonce, seq, index, count, raw.length, text.slice(index * TAP_WIRE_PART, (index + 1) * TAP_WIRE_PART)]));
  for (const chunk of chunks) if (window.fflate.strToU8(chunk).length > 2048) throw Error('联机消息超过平台上限');
  return { channel, packet: copy, seq, chunks };
}
function tapWireReceiver(roomId, deliver, resync) {
  const groups = new Map(), baselines = new Map(), completed = new Map();
  return (from, message) => {
    try {
      if (typeof message !== 'string' || window.fflate.strToU8(message).length > 2048) return;
      const piece = JSON.parse(message);
      if (!Array.isArray(piece) || piece.length !== 8 || piece[0] !== 'dh5tap1' || piece[1] !== roomId ||
          typeof piece[2] !== 'string' || piece[2].length > 40 || !Number.isSafeInteger(piece[3]) || piece[3] < 1 ||
          !Number.isInteger(piece[4]) || !Number.isInteger(piece[5]) || piece[5] < 1 || piece[5] > 256 || piece[4] < 0 || piece[4] >= piece[5] ||
          !Number.isInteger(piece[6]) || piece[6] < 1 || piece[6] > TAP_WIRE_LIMIT || typeof piece[7] !== 'string' || piece[7].length > TAP_WIRE_PART) return;
      const now = Date.now(), peer = from + ':' + piece[2], id = peer + ':' + piece[3];
      for (const [key, group] of groups) if (now - group.at > 30000) groups.delete(key);
      if (completed.get(id)) return;
      let group = groups.get(id);
      if (!group) {
        if (groups.size >= 16 || [...groups.values()].filter(g => g.from === from).length >= 4) return;
        group = { from, at: now, count: piece[5], size: piece[6], chunks: new Array(piece[5]), received: 0 }; groups.set(id, group);
      }
      if (group.count !== piece[5] || group.size !== piece[6]) return;
      if (group.chunks[piece[4]] === undefined) { group.chunks[piece[4]] = piece[7]; group.received++; }
      if (group.received !== group.count) return;
      groups.delete(id); completed.set(id, true); while (completed.size > 128) completed.delete(completed.keys().next().value);
      const bytes = window.fflate.inflateSync(tapWireBytes(group.chunks.join('')), { out: new Uint8Array(group.size) });
      if (bytes.length !== group.size) return;
      const payload = JSON.parse(window.fflate.strFromU8(bytes)); tapWireSafe(payload);
      if (typeof payload.c !== 'string' || payload.c.length > 256 || payload.n !== piece[3] || !Number.isSafeInteger(payload.b) || payload.b < 0) return;
      const key = peer + ':' + payload.c, previous = baselines.get(key);
      if (payload.c && previous && payload.n <= previous.seq) return;
      if (payload.b && (!previous || previous.seq !== payload.b)) { resync(from, payload.c); return; }
      const packet = tapWirePatch(previous?.packet, payload.d); tapWireSafe(packet);
      if (!packet || typeof packet.type !== 'string' || tapWireChannel(packet) !== payload.c) return;
      if (payload.c) { baselines.set(key, { seq: payload.n, packet }); while (baselines.size > 32) baselines.delete(baselines.keys().next().value); }
      deliver(from, packet);
    } catch (_) { /* Invalid platform payloads never touch the game or a delta baseline. */ }
  };
}
