'use strict';
// The camp is shared scenery and movement; each resident's menu and save remain local.
// Only the owner simulates visiting players. Clients send directions, never positions.
const COOP_TOWN = { active: false, role: null, sessionId: null, townId: null, room: null, originalRoom: null,
  actors: new Map(), elapsed: 0, snapshotT: 0, fullT: 1, seq: 0, lastApplied: -1, inputSeq: 0, inputT: 0,
  rollEdge: false, attackEdge: false, received: false, retired: new Set(), localBefore: null,
  commandBefore: null, inputStepSeq: 0, pending: [], outbox: [], inputReset: 0, inputRate: 1, offset: { x: 0, y: 0 } };
const COOP_TOWN_DIRECTIONS = new Set(['up', 'down', 'left', 'right']);
const COOP_TOWN_KEYS = new Set([...COOP_TOWN_DIRECTIONS, 'normalAttack']);
const COOP_TOWN_POSE = ['x', 'y', 'face', 'walk', 'moving', 'rolling', 'rdx', 'rdy', 'rollT', 'rollAttackT', 'atkT', 'swing', 'swingT', 'swingAng', 'alt', 'kbx', 'kby', 'attackLevel', 'attackPose', 'charging', 'chargeT'];
const COOP_TOWN_COLORS = ['#ffd060', '#8ae0ff', '#a0ef8a', '#dd9cff'];
const COOP_TOWN_SWING_TIMES = Object.values(WTYPES).map(weapon => weapon.swingT).filter(value => Number.isFinite(value) && value > 0);
const COOP_TOWN_SWING_MIN = Math.min(.15, ...COOP_TOWN_SWING_TIMES), COOP_TOWN_SWING_MAX = Math.max(.28, ...COOP_TOWN_SWING_TIMES);
function coopTownActive() {
  return COOP_TOWN.active && typeof COOP !== 'undefined' && COOP.connected && COOP.phase === 'lobby' &&
    G.room && G.room.type === 'town';
}
function coopTownLocalBlocked() {
  return G.mode !== 'town' || !!TOWN.menu || !!TOWN.launch || typeof COOP_UI !== 'undefined' && COOP_UI.open ||
    typeof coopConfirmationOpen === 'function' && coopConfirmationOpen();
}
function coopTownPlayer(starter = 'rusty', levels = {}, forge = {}, costume = 'adventurer') {
  const p = newPlayer(0, 0), item = ITEM_BY_ID[CAMP_STARTERS.includes(starter) ? starter : 'rusty'];
  const stats = { maxHp: 6, dmg: 2, speed: 82, rollCd: .85, crit: .05, critMul: 2, magnet: 1, scale: 1, wpn: WTYPES.sword, reachMul: 1, atkSpd: 1 };
  // Talent effects are pure stat transforms. Missing unrelated fields are irrelevant to camp movement.
  for (const talent of TALENTS) {
    const level = levels && levels[talent.id];
    if (Number.isInteger(level) && level > 0 && level <= talent.max && talent.fx) talent.fx(stats, level);
  }
  forgeApplyTraining(stats, forgeNormalize(forge).training);
  item.mod(stats);
  applyCostumeStats(stats, costume);
  Object.assign(p, { speed: stats.speed, rollCd: stats.rollCd, scale: 1, wpn: stats.wpn, weaponId: item.id,
    reach: (stats.wpn.reach || 0) * (Number.isFinite(stats.reachMul) ? stats.reachMul : 1),
    atkCd: stats.wpn.cd / stats.atkSpd, hp: 1, maxHp: 1, costume: Object.hasOwn(COSTUME_BY_ID, costume) ? costume : 'adventurer' });
  return { player: p, eq: { weapon: item, armor: null, boots: null, trinkets: [] } };
}
function coopTownFreeSpot(anchor, index) {
  const room = COOP_TOWN.room, offsets = [[0, 0], [-30, 2], [30, 2], [0, 28]], offset = offsets[index % 4];
  const available = (x, y) => !boxHits(room, x, y, 4, 4, 'player') &&
    !TOWN_PROPS.some(o => Math.hypot(x - o.x, (y - o.y) * 1.6) < o.r + 5) &&
    ![...COOP_TOWN.actors.values()].some(a => Math.hypot(x - a.player.x, y - a.player.y) < 12);
  const x0 = clamp(anchor.x + offset[0], 22, TOWN_SIZE.width - 22), y0 = clamp(anchor.y + offset[1], 24, TOWN_SIZE.height - 18);
  for (let radius = 0; radius <= 160; radius += 8) for (let i = 0; i < (radius ? 16 : 1); i++) {
    const angle = i * Math.PI / 8, x = clamp(x0 + Math.cos(angle) * radius, 22, TOWN_SIZE.width - 22),
      y = clamp(y0 + Math.sin(angle) * radius, 24, TOWN_SIZE.height - 18);
    if (available(x, y)) return { x, y };
  }
  // The plaza has a known open arrival lane even if the owner's current spot is crowded.
  return { x: PORTAL.x, y: PORTAL.y + 34 };
}
function coopTownEnsure() {
  if (typeof COOP === 'undefined' || !COOP.connected || COOP.phase !== 'lobby') return false;
  const T = COOP_TOWN;
  if (T.active) {
    if (T.sessionId === COOP.sessionId || COOP.role === 'client' && !T.sessionId && !T.received) {
      if (COOP.sessionId) T.sessionId = COOP.sessionId;
      if (COOP.role === 'host') coopTownRoster();
      return true;
    }
    coopTownStop(); T.retired.clear();
  }
  if (T.sessionId && T.sessionId !== COOP.sessionId) T.retired.clear();
  T.active = true; T.role = COOP.role; T.sessionId = COOP.sessionId; T.elapsed = 0;
  T.snapshotT = 0; T.fullT = 1; T.seq = 0; T.lastApplied = -1; T.inputSeq = 0; T.inputT = 0;
  T.attackEdges = new Set(); T.rollEdge = T.attackEdge = false; T.received = COOP.role === 'host'; T.localBefore = null;
  T.commandBefore = null; T.inputStepSeq = 0; T.pending = []; T.outbox = []; T.inputReset = 0; T.inputRate = 1;
  T.offset = { x: 0, y: 0 };
  // A room created from the title enters the existing camp without moving its owner.
  if (COOP.role === 'host') {
    if (!G.room || G.room.type !== 'town') enterTown();
    else if (G.mode === 'title') { G.mode = 'town'; G.trans = null; G.fade = 0; G.banner = null; resetInput(); }
    T.room = G.room; T.townId = coopUniqueId(); coopTownRoster();
  } else {
    T.originalRoom = TOWN.room;
    // The connection UI and return-from-run flow already enter camp. Reusing it avoids
    // replaying the arrival fade and replacing the local return banner a second time.
    if (!G.room || G.room.type !== 'town' || G.mode === 'title') enterTown();
    T.room = null; T.townId = null;
  }
  return true;
}
function coopTownRoster() {
  const T = COOP_TOWN;
  if (!T.active || !COOP.connected || COOP.phase !== 'lobby') return;
  const ids = new Set(COOP.members.map(m => m.id));
  for (const id of T.actors.keys()) if (!ids.has(id)) T.actors.delete(id);
  if (COOP.role !== 'host') return;
  for (let index = 0; index < COOP.members.length; index++) {
    const member = COOP.members[index], profile = COOP.profiles[member.id] || {}, starter = profile.starter || member.starter || 'rusty';
    let actor = T.actors.get(member.id);
    if (!actor) {
      const appearance = coopTownPlayer(starter, profile.lv, profile.forge, profile.costume), spot = member.id === COOP.selfId ? G.player : coopTownFreeSpot(G.player, index);
      actor = { id: member.id, name: member.name, ...appearance, starter, profileKey: '', input: { keys: [], roll: false, attack: false, blocked: true }, inputAt: -1, seen: 0, ack: 0 };
      actor.player.x = spot.x; actor.player.y = spot.y; actor.player.face = -Math.PI / 2;
      T.actors.set(member.id, actor); T.fullT = 1;
    }
    actor.name = member.name;
    if (member.id === COOP.selfId) { actor.player = G.player; actor.eq = G.eq; actor.starter = G.eq.weapon.id; }
    else {
      const profileKey = JSON.stringify([starter, profile.lv || {}, profile.forge || {}, profile.costume || 'adventurer']);
      if (actor.profileKey !== profileKey) {
        const appearance = coopTownPlayer(starter, profile.lv, profile.forge, profile.costume);
        actor.player.speed = appearance.player.speed; actor.player.rollCd = appearance.player.rollCd;
        actor.player.wpn = appearance.player.wpn; actor.player.reach = appearance.player.reach; actor.player.atkCd = appearance.player.atkCd;
        actor.player.costume = appearance.player.costume;
        actor.eq = appearance.eq; actor.starter = appearance.eq.weapon.id; actor.profileKey = profileKey;
      }
    }
  }
}
function coopTownCommand() {
  const blocked = coopTownLocalBlocked();
  return { keys: blocked ? [] : [...Input.keys].filter(k => COOP_TOWN_KEYS.has(k)),
    pressed: blocked ? [] : [...Input.pressed].filter(k => ['roll', 'normalAttack', 'attack', 'attackUp', 'attackCancel'].includes(k)),
    attack: !blocked && (Input.keys.has('attack') || Input.pressed.has('attack')), face: G.player.face, blocked };
}
function coopTownValidCommand(command) {
  return command && typeof command === 'object' && !Array.isArray(command) && typeof command.blocked === 'boolean' &&
    Array.isArray(command.keys) && command.keys.length <= 5 && command.keys.every(k => COOP_TOWN_KEYS.has(k)) &&
    Array.isArray(command.pressed) && command.pressed.length <= 5 && command.pressed.every(k => ['roll', 'normalAttack', 'attack', 'attackUp', 'attackCancel'].includes(k)) &&
    (command.attack === undefined || typeof command.attack === 'boolean') &&
    (command.face === undefined || Number.isFinite(command.face) && Math.abs(command.face) <= Math.PI * 2);
}
function coopTownStep(player, command) {
  coopTownMove({ player, input: { ...command, roll: command.pressed.includes('roll') }, inputAt: COOP_TOWN.elapsed }, COOP_INPUT_STEP);
}
function coopTownResetInput() {
  const T = COOP_TOWN;
  T.pending = []; T.outbox = []; T.localBefore = T.commandBefore = null; T.inputRate = 1;
  T.offset = { x: 0, y: 0 };
  if (T.active && T.received && COOP.role === 'client' && coopIsTap())
    COOP.send({ type: 'town:reset', sessionId: COOP.sessionId, townId: T.townId });
}
function coopTownPacket(from, packet) {
  if (!packet || typeof packet.type !== 'string' || !packet.type.startsWith('town:')) return false;
  const T = COOP_TOWN;
  if (!T.active || !COOP.connected || COOP.phase !== 'lobby' || !COOP.sessionId || packet.sessionId !== COOP.sessionId) return true;
  if (COOP.role === 'host') {
    const actor = T.actors.get(from);
    if (from === COOP.selfId || !actor || !COOP.members.some(m => m.id === from) || packet.townId !== T.townId) return true;
    if (packet.type === 'town:reset' && coopIsTap()) { coopInputClear(actor, T.elapsed); actor.input.blocked = true; return true; }
    if (packet.type !== 'town:input' || !Number.isSafeInteger(packet.seq) || packet.seq <= actor.seen ||
        !coopTownValidCommand(packet.command)) return true;
    if (packet.command.steps !== undefined) {
      const steps = packet.command.steps;
      if (!coopIsTap() || !Array.isArray(steps) || !steps.length || steps.length > coopInputQueueLimit() || !steps.every(coopTownValidCommand)) return true;
      const normalized = steps.map(step => ({ seq: step.seq, keys: [...new Set(step.keys)], pressed: [...step.pressed],
        attack: step.attack === true, face: step.face, blocked: step.blocked }));
      if (coopInputEnqueue(actor, normalized, packet.command.inputReset, T.elapsed)) actor.seen = packet.seq;
      return true;
    }
    if (actor.inputSteps) return true;
    actor.seen = packet.seq;
    actor.input = { keys: [...new Set(packet.command.keys)], roll: actor.input.roll || packet.command.pressed.includes('roll'),
      attack: packet.command.attack === true, pressed: [...new Set([...(actor.input.pressed || []), ...packet.command.pressed])], face: packet.command.face, blocked: packet.command.blocked };
    if (actor.input.blocked) { actor.input.keys = []; actor.input.roll = false; actor.input.attack = false; }
    actor.inputAt = T.elapsed; return true;
  }
  if (from !== COOP.hostId || packet.type !== 'town:snapshot' || typeof packet.townId !== 'string' ||
      packet.townId.length < 1 || packet.townId.length > 96 || T.retired.has(packet.townId) ||
      T.townId && packet.townId !== T.townId || !Number.isSafeInteger(packet.seq) || packet.seq <= T.lastApplied) return true;
  const actors = packet.actors, ids = new Set();
  if (!Array.isArray(actors) || actors.length < 1 || actors.length > 4 || actors.length !== COOP.members.length) return true;
  for (const actor of actors) {
    if (!actor || typeof actor !== 'object' || ids.has(actor.id) || !COOP.members.some(m => m.id === actor.id) ||
        !CAMP_STARTERS.includes(actor.starter) ||
        actor.attackLevel !== undefined && ![0, 1].includes(actor.attackLevel) ||
        actor.attackPose !== undefined && !['', 'slash', 'cross', 'thrust', 'slam', 'arrow', 'throw', 'cast', 'holy', 'note', 'command'].includes(actor.attackPose) ||
        actor.charging !== undefined && typeof actor.charging !== 'boolean' ||
        actor.chargeT !== undefined && (!Number.isFinite(actor.chargeT) || actor.chargeT < 0 || actor.chargeT > .8) || actor.costume !== undefined && (typeof actor.costume !== 'string' || !Object.hasOwn(COSTUME_BY_ID, actor.costume)) || !['x', 'y', 'face', 'walk', 'rolling', 'rdx', 'rdy', 'rollT', 'swing', 'swingT', 'swingAng', 'alt'].every(k => Number.isFinite(actor[k])) ||
        actor.x < 16 || actor.x > TOWN_SIZE.width - 16 || actor.y < 16 || actor.y > TOWN_SIZE.height - 12 ||
        Math.abs(actor.face) > Math.PI * 2 || actor.walk < 0 || actor.walk > 1e9 || actor.rolling < 0 || actor.rolling > .21 ||
        Math.abs(actor.rdx) > 1 || Math.abs(actor.rdy) > 1 || actor.rollT < 0 || actor.rollT > 5 ||
        actor.swing < 0 || actor.swing > COOP_TOWN_SWING_MAX || actor.swingT < COOP_TOWN_SWING_MIN || actor.swingT > COOP_TOWN_SWING_MAX ||
        Math.abs(actor.swingAng) > Math.PI * 2 || Math.abs(actor.alt) !== 1 ||
        typeof actor.moving !== 'boolean' || !Number.isSafeInteger(actor.ack) || actor.ack < 0) return true;
    if (actor.inputAck !== undefined && (!Number.isSafeInteger(actor.inputAck) || actor.inputAck < 0 ||
        !Number.isSafeInteger(actor.inputReset) || actor.inputReset < 0 || !Number.isInteger(actor.inputQueued) ||
        actor.inputQueued < 0 || actor.inputQueued > coopInputQueueLimit() ||
        !['atkT', 'rollAttackT', 'kbx', 'kby'].every(k => Number.isFinite(actor[k])) ||
        actor.atkT < 0 || actor.atkT > 5 || actor.rollAttackT < 0 || actor.rollAttackT > .51 ||
        Math.abs(actor.kbx) > 2048 || Math.abs(actor.kby) > 2048)) return true;
    ids.add(actor.id);
  }
  if (!ids.has(COOP.selfId)) return true;
  if (packet.room !== undefined) {
    const room = packet.room;
    if (!room || room.w !== TOWN_SIZE.w || room.h !== TOWN_SIZE.h || !Array.isArray(room.tiles) ||
        room.tiles.length !== TOWN_SIZE.w * TOWN_SIZE.h || room.tiles.some(v => !Number.isInteger(v) || v < 0 || v > 2)) return true;
    const changed = !T.room || room.tiles.some((v, i) => v !== T.room.tiles[i]);
    if (changed) {
      T.room = { gx: 0, gy: 0, type: 'town', w: room.w, h: room.h, doors: {}, cleared: true, visited: true,
        tiles: new Uint8Array(room.tiles), hz: [], ph: 0, chests: [], pickups: [], torches: [] };
      T.room.canvas = renderTown(T.room); TOWN.room = T.room;
    }
  }
  if (!T.room) return true;
  T.sessionId = COOP.sessionId; T.townId = packet.townId; T.lastApplied = packet.seq;
  G.room = T.room; G.rooms = new Map([[rkey(0, 0), T.room]]);
  for (const state of actors) {
    const member = COOP.members.find(m => m.id === state.id), self = state.id === COOP.selfId;
    let actor = T.actors.get(state.id);
    if (!actor || actor.starter !== state.starter && !self) {
      actor = { id: state.id, name: member.name, ...coopTownPlayer(state.starter), starter: state.starter };
      T.actors.set(state.id, actor);
    }
    actor.name = member.name; actor.ack = state.ack;
    const p = self ? G.player : actor.player;
    if (!self) p.costume = state.costume || 'adventurer';
    if (self && coopIsTap() && state.inputAck !== undefined) {
      if (state.inputReset !== T.inputReset) { T.inputReset = state.inputReset; T.pending = []; T.outbox = []; }
      T.pending = T.pending.filter(step => step.seq > state.inputAck).slice(-90);
      T.inputRate = state.inputQueued > 3 ? .9 : 1;
      const predicted = { ...p };
      for (const k of COOP_TOWN_POSE) predicted[k] = state[k];
      for (const step of T.pending) coopTownStep(predicted, step);
      const dx = p.x - predicted.x, dy = p.y - predicted.y;
      T.offset = T.received && !coopTownLocalBlocked() && Math.hypot(dx + T.offset.x, dy + T.offset.y) < 24
        ? { x: dx + T.offset.x, y: dy + T.offset.y } : { x: 0, y: 0 };
      for (const k of COOP_TOWN_POSE) p[k] = predicted[k];
      if (coopTownLocalBlocked()) { p.moving = false; p.rolling = p.swing = 0; }
    } else if (!self || !T.received || Math.hypot(p.x - state.x, p.y - state.y) > 10 || coopTownLocalBlocked() ||
        ![...Input.keys].some(k => COOP_TOWN_DIRECTIONS.has(k)) && p.rolling <= 0 && !state.moving && state.rolling <= 0) {
      p.x = state.x; p.y = state.y;
      if (!self || !T.received) for (const k of ['face', 'walk', 'moving', 'rolling', 'rdx', 'rdy', 'rollT', 'swing', 'swingT', 'swingAng', 'alt', 'attackLevel', 'attackPose', 'charging', 'chargeT']) p[k] = state[k];
    }
    if (self) { actor.player = G.player; actor.eq = G.eq; actor.starter = G.eq.weapon.id; }
  }
  T.received = true; coopTownRoster();
  if (packet.room !== undefined) COOP.send({ type: 'transport:townMapAck', townId: T.townId });
  return true;
}
function coopTownMove(actor, dt) {
  const T = COOP_TOWN, p = actor.player, fresh = T.elapsed - actor.inputAt <= .35;
  const command = fresh && !actor.input.blocked ? actor.input : { keys: [], roll: false, attack: false };
  if (!fresh || actor.input.blocked) cancelPlayerCharge(p);
  p.rollT = Math.max(0, p.rollT - dt); p.atkT = Math.max(0, p.atkT - dt); p.swing = Math.max(0, p.swing - dt); p.inv = 0;
  updAttackRecovery(p, dt);
  if (fresh && actor.input.blocked) { p.rolling = p.swing = 0; p.moving = false; actor.input.roll = false; actor.input.pressed = []; actor.ack = actor.seen; return; }
  let vx = +command.keys.includes('right') - +command.keys.includes('left'), vy = +command.keys.includes('down') - +command.keys.includes('up');
  const length = Math.hypot(vx, vy); if (length) { vx /= length; vy /= length; }
  if (p.rolling > 0) {
    cancelPlayerCharge(p); p.rolling = Math.max(0, p.rolling - dt); moveBox(p, p.rdx * 205 * dt, p.rdy * 205 * dt, 'player');
  } else {
    const speed = p.speed * (p.charging && p.chargeT >= COMBAT_CHARGE.tell ? .75 : 1) * (p.swing > 0 ? p.wpn.heavy ? .4 : .55 : 1);
    const kb = playerKnockbackStep(p, dt);
    moveBox(p, vx * speed * dt + kb.x, vy * speed * dt + kb.y, 'player'); p.moving = length > .15;
    if (p.moving) { p.walk += dt; p.face = Math.atan2(vy, vx); }
    if (Number.isFinite(command.face)) p.face = command.face;
    if (command.roll && p.rollT <= 0) {
      cancelPlayerCharge(p); p.rdx = length ? vx : Math.cos(p.face); p.rdy = length ? vy : Math.sin(p.face);
      p.rolling = .2; p.rollAttackT = .5; p.rollT = p.rollCd;
    }
    // Camp attacks are visual only here. Each machine retains its own training dummy.
    stepPlayerCharge(p, command.attack ? [...command.keys, 'attack'] : command.keys, command.pressed || [], dt, level => {
      const lunge = level ? 0 : playerAttackLunge(p);
      playerAttackPose(p); setPlayerAttackVisual(p, level);
      p.kbx += Math.cos(p.face) * lunge; p.kby += Math.sin(p.face) * lunge;
    }, true);
  }
  actor.input.roll = false; actor.input.pressed = []; actor.ack = actor.seen;
  for (const o of TOWN_PROPS) {
    let dx = p.x - o.x, dy = (p.y - o.y) * 1.6, distance = Math.hypot(dx, dy), minimum = o.r + p.hw;
    if (distance >= minimum) continue;
    if (distance < .01) { dx = 1; dy = 0; distance = 1; }
    const k = (minimum - distance) / distance; moveBox(p, dx * k, dy * k / 1.6, 'player');
  }
}
function coopTownFrameBefore(dt) {
  if (!coopTownActive()) return;
  const T = COOP_TOWN; T.elapsed += clamp(Number.isFinite(dt) ? dt : 0, 0, .05);
  const decay = Math.exp(-dt * 18); T.offset.x *= decay; T.offset.y *= decay;
  if (coopTownLocalBlocked()) { G.player.moving = false; G.player.rolling = G.player.swing = 0; }
  if (COOP.role === 'host') return;
  if (coopIsTap()) {
    T.commandBefore = coopTownCommand(); T.localBefore = { ...G.player }; T.inputT += dt;
    if (!T.received) { Input.keys.clear(); Input.pressed.delete('roll'); }
    return;
  }
  const command = coopTownCommand();
  T.attackEdges ||= new Set(); for (const edge of command.pressed) T.attackEdges.add(edge);
  T.rollEdge ||= command.pressed.includes('roll'); T.attackEdge ||= command.attack;
  T.inputT += dt;
  const inputStep = 1 / (coopBridge()?.inputHz || 30);
  if (T.received && T.inputT >= inputStep) {
    T.inputT %= inputStep;
    COOP.send({ type: 'town:input', sessionId: COOP.sessionId, townId: T.townId, seq: ++T.inputSeq,
      command: { keys: command.keys, pressed: command.blocked ? [] : [...new Set([...T.attackEdges, ...(T.rollEdge ? ['roll'] : [])])],
        attack: !command.blocked && T.attackEdge, face: command.face, blocked: command.blocked } });
    T.rollEdge = T.attackEdge = false; T.attackEdges.clear();
  }
  // Waiting players cannot roam a different local town before receiving the owner's map.
  if (!T.received) { Input.keys.clear(); Input.pressed.delete('roll'); }
}
function coopTownFrameAfter(dt) {
  if (!coopTownActive()) return;
  const T = COOP_TOWN;
  if (COOP.role === 'client') {
    if (!coopIsTap() || !T.received || !T.localBefore || !T.commandBefore) return;
    if (T.outbox.length >= coopInputQueueLimit() || T.pending.length >= 90) coopTownResetInput();
    if (!T.localBefore) return;
    const blocked = T.commandBefore.blocked || coopTownLocalBlocked();
    const step = { ...T.commandBefore, seq: ++T.inputStepSeq, face: G.player.face, blocked,
      keys: blocked ? [] : T.commandBefore.keys, pressed: blocked ? [] : T.commandBefore.pressed, attack: !blocked && T.commandBefore.attack };
    // Keep local dummy damage/effects, but use the same motion step as the owner and replay.
    coopTownStep(T.localBefore, step);
    for (const k of COOP_TOWN_POSE) G.player[k] = T.localBefore[k];
    T.pending.push(step); T.outbox.push(step); T.localBefore = T.commandBefore = null;
    const inputStep = 1 / (coopBridge()?.inputHz || 30);
    if (T.inputT >= inputStep) {
      T.inputT %= inputStep;
      COOP.send({ type: 'town:input', sessionId: COOP.sessionId, townId: T.townId, seq: ++T.inputSeq,
        command: { ...step, steps: T.outbox.splice(0), inputReset: T.inputReset } });
    }
    return;
  }
  coopTownRoster();
  const room = G.room; G.room = T.room;
  try { for (const actor of T.actors.values()) if (actor.id !== COOP.selfId) {
    if (actor.inputSteps) {
      if (actor.inputSteps.length && T.elapsed - actor.inputSteps[0].at > coopInputQueueLimit() * COOP_INPUT_STEP + 1e-9)
        coopInputClear(actor, T.elapsed);
      const step = actor.inputSteps.shift();
      actor.input = step ? { ...step, roll: step.pressed.includes('roll') } : { keys: [], roll: false, blocked: actor.input.blocked };
      actor.inputAt = T.elapsed; coopTownMove(actor, COOP_INPUT_STEP);
      if (step) actor.inputAck = step.seq;
    } else coopTownMove(actor, clamp(dt, 0, .05));
  } }
  finally { G.room = room; }
  T.snapshotT += dt; T.fullT += dt;
  const snapshotStep = 1 / (coopBridge()?.snapshotHz || 20);
  if (T.snapshotT < snapshotStep) return;
  T.snapshotT %= snapshotStep;
  const packet = { type: 'town:snapshot', sessionId: COOP.sessionId, townId: T.townId, seq: ++T.seq,
    actors: COOP.members.map(member => {
      const actor = T.actors.get(member.id), p = actor.player;
      return { id: actor.id, x: p.x, y: p.y, face: p.face, walk: p.walk, moving: !!p.moving,
        rolling: Math.max(0, p.rolling), rdx: p.rdx, rdy: p.rdy, rollT: Math.max(0, p.rollT),
        attackLevel: p.attackLevel || 0, attackPose: p.attackPose || '', charging: !!p.charging, chargeT: p.chargeT || 0,
        swing: Math.max(0, p.swing), swingT: p.swingT, swingAng: p.swingAng, alt: p.alt,
        starter: actor.starter, costume: p.costume || 'adventurer', ack: actor.ack || 0,
        ...(actor.inputSteps ? { inputAck: actor.inputAck || 0, inputReset: actor.inputReset || 0, inputQueued: actor.inputSteps.length,
          atkT: Math.max(0, p.atkT), rollAttackT: p.rollAttackT || 0, kbx: p.kbx || 0, kby: p.kby || 0 } : {}) };
    }) };
  if (T.fullT >= 1) { T.fullT %= 1; packet.room = { w: T.room.w, h: T.room.h, tiles: [...T.room.tiles] }; }
  COOP.send(packet);
}
function coopTownStop() {
  const T = COOP_TOWN;
  if (T.townId) { T.retired.add(T.townId); while (T.retired.size > 8) T.retired.delete(T.retired.values().next().value); }
  if (T.role === 'client' && T.originalRoom) {
    TOWN.room = T.originalRoom;
    if (G.room && G.room.type === 'town') { G.room = T.originalRoom; G.rooms = new Map([[rkey(0, 0), G.room]]); }
  }
  T.active = false; T.role = null; T.townId = null; T.room = null; T.originalRoom = null; T.actors.clear();
  T.received = false; T.rollEdge = T.attackEdge = false; T.inputSeq = 0; T.lastApplied = -1; T.localBefore = null;
  T.commandBefore = null; T.pending = []; T.outbox = []; T.inputReset = 0; T.inputRate = 1;
  T.offset = { x: 0, y: 0 };
}
function coopTownViewApply() {
  const p = G.player, x = p.x, y = p.y;
  p.x += COOP_TOWN.offset.x; p.y += COOP_TOWN.offset.y;
  return () => { p.x = x; p.y = y; };
}
function coopTownDrawActor(actor, time) {
  const self = actor.id === COOP.selfId, p = self ? G.player : actor.player;
  if (!self) {
    const player = G.player, eq = G.eq;
    try { G.player = p; G.eq = actor.eq; drawPlayer(p, time); }
    finally { G.player = player; G.eq = eq; }
  }
  const index = COOP.members.findIndex(m => m.id === actor.id), color = COOP_TOWN_COLORS[Math.max(0, index) % 4];
  px(p.x - 1, p.y - heroVisualHeight(p) - 3, 2, 1, color);
}
function coopTownDrawables(time) {
  if (!coopTownActive()) return;
  for (const actor of COOP_TOWN.actors.values()) {
    const player = actor.id === COOP.selfId ? G.player : actor.player;
    // The local hero stays in renderWorld; its entry adds a small party color marker.
    drawListAdd(player.y + .01, DK_COOP_TOWN_ACTOR, actor);
  }
}
