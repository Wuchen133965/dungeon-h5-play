'use strict';
// One authoritative room, with an isolated run context for each party member.
// Clients only render snapshots; input never supplies damage, loot or progression.
const COOP_RUNTIME = { active: false, installed: false, actors: new Map(), actorId: null, initializing: false,
  ended: null, roomRevision: 0, seq: 0, lastApplied: -1, runId: null, elapsed: 0, renderOnly: false, originals: {} };
const COOP_PERSONAL_FIELDS = ['player', 'eq', 'gold', 'runSouls', 'runKills', 'runUp', 'cls', 'minions', 'cold', 'corrupt',
  'phoenixUsed', 'undyingUsed', 'holyShield', 'ins', 'pet', 'floorBuff', 'campMeal', 'mode', 'pmode', 'cine', 'choice',
  'shrineUI', 'prompt', 'endT', 'banked', 'soulGain', 'goldPulse', 'soulPulse', 'chests', 'roomLoot', 'chestFx'];
const COOP_INPUT_ACTIONS = new Set(['up', 'down', 'left', 'right', 'normalAttack', 'attack', 'attackUp', 'attackCancel', 'roll', 'interact', 'confirm', 'pause', 'journal', 'restart', 'mute']);
const COOP_ACTOR_COLORS = ['#ffd060', '#8ae0ff', '#a0ef8a', '#dd9cff'];
function coopRuntimeIsActive() { return COOP_RUNTIME.active && typeof COOP !== 'undefined' && COOP.connected; }
function coopRuntimeIsHost() { return coopRuntimeIsActive() && COOP.role === 'host'; }
function coopActorId() { return COOP_RUNTIME.actorId || (typeof COOP !== 'undefined' ? COOP.selfId : null); }
function coopRuntimeActors() { return [...COOP_RUNTIME.actors.values()].filter(a => a.connected); }
function coopRuntimeCount() { return Math.max(1, coopRuntimeActors().length); }
function coopRuntimeRoomKey() { const r = G.room; return `${G.act}:${G.chapter}:${G.floor}:${r ? rkey(r.gx, r.gy) : ''}`; }
function coopRuntimeCapture(actor) { if (actor) for (const k of COOP_PERSONAL_FIELDS) actor.context[k] = G[k]; }
function coopRuntimeLoad(actor) { if (actor) for (const k of COOP_PERSONAL_FIELDS) G[k] = actor.context[k]; }
function coopRuntimeReplaceMeta(value) { for (const k of Object.keys(META)) delete META[k]; Object.assign(META, value); }
function coopWithActor(id, fn) {
  const R = COOP_RUNTIME, actor = R.actors.get(id);
  if (!R.active || !actor) return fn();
  if (R.actorId === id) {
    const shots = new Set(G.shots || []), later = new Set(G.later || []);
    try { return fn(); } finally { coopRuntimeTagEffects(id, shots, later); coopRuntimeCapture(actor); }
  }
  const prevId = R.actorId, prevActor = R.actors.get(prevId), fields = {}, meta = { ...META };
  if (prevActor) coopRuntimeCapture(prevActor);
  for (const k of COOP_PERSONAL_FIELDS) fields[k] = G[k];
  R.actorId = id; coopRuntimeLoad(actor);
  if (!R.renderOnly && actor.meta) coopRuntimeReplaceMeta(actor.meta);
  const beforeShots = new Set(G.shots || []), beforeLater = new Set(G.later || []);
  try { return fn(); }
  finally {
    coopRuntimeTagEffects(id, beforeShots, beforeLater);
    coopRuntimeCapture(actor);
    if (!R.renderOnly && actor.meta) actor.meta = { ...META };
    coopRuntimeReplaceMeta(meta); R.actorId = prevId;
    if (prevActor) coopRuntimeLoad(prevActor); else for (const k of COOP_PERSONAL_FIELDS) G[k] = fields[k];
  }
}
function coopRuntimeTagEffects(id, beforeShots, beforeLater) {
  for (const s of G.shots || []) if (s.friendly && !beforeShots.has(s)) {
    if (!s.ownerId) s.ownerId = id;
    if (!Number.isFinite(s.bornAt)) { s.bornAt = G.time; s.bornX = s.x; s.bornY = s.y; }
  }
  for (const l of G.later || []) if (!beforeLater.has(l) && !l.ownerId && typeof l.fn === 'function') {
    l.ownerId = id; const f = l.fn; l.fn = () => coopWithActor(id, f);
  }
}
// Opening/receiving personal loot must not flash or shake another member's screen.
function coopRuntimeChestFx(fn) {
  if (!coopRuntimeIsHost()) return fn();
  const R = COOP_RUNTIME, id = coopActorId();
  if (R.chestFxOwner === id) return fn();
  const previousOwner = R.chestFxOwner, shared = {}, before = {};
  const visual = G.chestFx || (G.chestFx = { shake: 0, flash: 0, hitstop: 0 });
  for (const k of ['shake', 'flash', 'hitstop']) { shared[k] = G[k]; G[k] = visual[k] || 0; }
  for (const k of COOP_FX_KEYS) before[k] = new Set(G[k] || []);
  R.chestFxOwner = id;
  try { return fn(); }
  finally {
    for (const k of ['shake', 'flash', 'hitstop']) { visual[k] = G[k]; G[k] = shared[k]; }
    for (const k of COOP_FX_KEYS) for (const fx of G[k] || []) if (!before[k].has(fx)) fx.privateId = id;
    R.chestFxOwner = previousOwner;
  }
}
// Being hit shakes the screen, flashes it red and sets hitstop. Those belong to the member
// who was hit: as shared world values the host's camera shook and flashed red for every hit a
// teammate took in a crowd, which reads as the host's own hero jerking back and forth.
function coopRuntimeHurtFx(fn) {
  if (!coopRuntimeIsHost()) return fn();
  const visual = G.chestFx || (G.chestFx = { shake: 0, flash: 0, hitstop: 0 });
  const shared = { shake: G.shake, hurtFlash: G.hurtFlash, hitstop: G.hitstop };
  G.shake = visual.shake || 0; G.hurtFlash = visual.hurtFlash || 0; G.hitstop = visual.hitstop || 0;
  try { return fn(); }
  finally {
    visual.shake = G.shake; visual.hurtFlash = G.hurtFlash; visual.hitstop = G.hitstop;
    G.shake = shared.shake; G.hurtFlash = shared.hurtFlash; G.hitstop = shared.hitstop;
  }
}
function coopRuntimeFxVisible(fx, loot = false) {
  return !coopRuntimeIsActive() || (!fx.privateId || fx.privateId === COOP.selfId) && (!loot || !fx.ownerId || fx.ownerId === COOP.selfId);
}
function coopRuntimeDecayChestFx(visual, dt) {
  if (!visual) return;
  visual.shake = Math.max(0, (visual.shake || 0) - dt * 30);
  visual.flash = Math.max(0, (visual.flash || 0) - dt);
  visual.hitstop = Math.max(0, (visual.hitstop || 0) - dt);
  if (visual.hurtFlash) visual.hurtFlash = Math.max(0, visual.hurtFlash - dt);
}
function coopRuntimeSelf() {
  const a = COOP_RUNTIME.actors.get(COOP.selfId); if (!a) return;
  COOP_RUNTIME.actorId = COOP.selfId; coopRuntimeLoad(a);
}
function coopRuntimeSyncLocalMeta() {
  const a = typeof COOP !== 'undefined' && COOP_RUNTIME.actors.get(COOP.selfId);
  if (!a) return;
  a.meta = { ...META };
  coopRuntimeCapture(a);
}
function coopRuntimeRemoteMeta(profile) {
  const p = profile && profile.profile || profile || {}, lv = {};
  for (const t of TALENTS) if (Number.isInteger(p.lv && p.lv[t.id])) lv[t.id] = clamp(p.lv[t.id], 0, t.max);
  const unlocked = Array.isArray(p.unlocked) ? p.unlocked.filter(id => ITEM_BY_ID[id]) : [];
  // Only the legendary drop eligibility is projected into this actor's temporary META.
  // Quest progress, actual region unlocks and the local player's persistent save stay on their own machine.
  const cleared = Array.isArray(p.clearedActs) ? p.clearedActs.filter(act => Number.isInteger(act) && act >= 1 && act <= ACTS.length) : [];
  const prog = Object.fromEntries(cleared.map(act => [act, { open: true, diff: [{ ...newDiffProg(1), wins: 1 }] }]));
  const costume = typeof p.costume === 'string' && Object.hasOwn(COSTUME_BY_ID, p.costume) ? p.costume : 'adventurer';
  return { souls: 0, lv, unlocked, unlockedSet: new Set(unlocked), seen: [], seenSet: new Set(), prog, ver: 3, treeVer: 2,
    maxCh: 1, best: 0, runs: 0, wins: 0, kills: 0, refund: 0,
    forge: forgeNormalize(p.forge),
    costumes: { owned: [...new Set(['adventurer', costume])], equipped: costume },
    camp: { starter: CAMP_STARTERS.includes(p.starter) ? p.starter : 'rusty', nextMeal: CAMP_MEALS.some(m => m.id === p.meal) ? p.meal : null } };
}
function coopRuntimeFreshContext() {
  return { player: newPlayer(RPW / 2, RPH / 2 + 30), eq: { weapon: ITEM_BY_ID.rusty, armor: null, boots: null, trinkets: [] },
    gold: 0, runSouls: 0, runKills: 0, runUp: {}, cls: {}, minions: [], cold: 0, corrupt: 0, phoenixUsed: false,
    undyingUsed: false, holyShield: 0, ins: 0, pet: null, floorBuff: null, campMeal: null, mode: 'play', pmode: null,
    cine: null, choice: null, shrineUI: null, prompt: null, endT: 0, banked: false, soulGain: 0, goldPulse: 0, soulPulse: 0, chests: [], roomLoot: null,
    chestFx: { shake: 0, flash: 0, hitstop: 0 } };
}
function coopRuntimeStart(config = {}, profiles = {}) {
  coopRuntimeInstall();
  const entries = Array.isArray(profiles) ? profiles.map(p => [p.id, p]) : Object.entries(profiles);
  if (entries.length < 1 || entries.length > 4 || !entries.some(([id]) => id === COOP.selfId)) return false;
  const R = COOP_RUNTIME;
  R.active = true; R.initializing = true; R.actors.clear(); R.actorId = null; R.ended = null;
  R.roomRevision = 0; R.seq = 0; R.lastApplied = -1; R.elapsed = 0; R.runId = config.runId || COOP.runId;
  R.fxSent = null; coopViewReset();
  for (const [id, profile] of entries.slice(0, 4)) {
    const member = (COOP.members || []).find(m => m.id === id);
    R.actors.set(id, { id, name: String(profile.name || member && member.name || id).slice(0, 18), connected: true, downed: false,
      context: coopRuntimeFreshContext(), meta: id === COOP.selfId ? { ...META } : coopRuntimeRemoteMeta(profile),
      loot: new Map(), input: { keys: [], pressed: [], pointer: { active: false } }, inputAt: 0, inputSeen: false, actions: [] });
  }
  if (!R.actors.has(COOP.selfId)) R.actors.set(COOP.selfId, { id: COOP.selfId, name: '房主', connected: true, downed: false,
    context: coopRuntimeFreshContext(), meta: { ...META }, loot: new Map(), input: { keys: [], pressed: [], pointer: { active: false } }, inputAt: 0, inputSeen: false, actions: [] });
  const act = Number(config.act) || 1, chapter = Number(config.ch || config.chapter) || 1, diff = Number(config.diff) || 0;
  if (!ACTS[act - 1] || !ACTS[act - 1].regions[chapter - 1] || !DIFFS[diff]) { coopRuntimeStop(); return false; }
  if (COOP.role !== 'host') {
    // A RAF can run after the start packet and before the first world snapshot.
    // Waiting avatars must already carry valid weapons/stats for the normal renderer.
    G.act = act; G.chapter = chapter; G.floor = 1; G.gfloor = (chapter - 1) * CONFIG.floorsPerRegion + 1; G.diff = diff;
    G.startCh = chapter; G.runTime = 0; G.shots = []; G.enemies = [];
    for (const a of R.actors.values()) coopWithActor(a.id, () => {
      G.eq.weapon = campStarterItem(); G.gold = lv('gold') * 50; G.campMeal = a.meta.camp.nextMeal; recalcStats();
    });
    R.initializing = false; coopRuntimeSelf(); return true;
  }
  // Start the host using its actual save; remote contexts consume their profile meal in memory only.
  const local = R.actors.get(COOP.selfId);
  newRun(chapter, act, diff); coopRuntimeCapture(local); local.meta = { ...META };
  G.trans = null; G.fade = 0; R.actorId = COOP.selfId;
  for (const actor of R.actors.values()) if (actor.id !== COOP.selfId) coopWithActor(actor.id, () => {
    G.eq.weapon = campStarterItem(); G.gold = lv('gold') * 50; G.campMeal = actor.meta.camp.nextMeal;
    recalcStats();
  });
  R.initializing = false; coopRuntimeSetupRoom(null); coopRuntimeSelf(); resetInput(); return true;
}
function coopRuntimeSetupRoom(dir, options = {}) {
  const R = COOP_RUNTIME, room = G.room, local = R.actors.get(COOP.selfId);
  if (!room || !local) return;
  R.roomRevision++;
  const key = coopRuntimeRoomKey(), anchor = { x: local.context.player.x, y: local.context.player.y };
  let i = 0;
  for (const actor of coopRuntimeActors()) coopWithActor(actor.id, () => {
    let loot = actor.loot.get(key);
    if (!loot) {
      loot = { chests: room.chests.map(c => ({ ...c, opened: false, open: 0 })), shop: room.shop && room.shop.map(s => ({ ...s, sold: false })),
        altar: room.altar && { ...room.altar, used: false }, fountain: room.fountain && { ...room.fountain, used: false },
        pond: room.pond && { ...room.pond }, pet: room.pet && { ...room.pet } };
      actor.loot.set(key, loot);
    }
    G.chests = loot.chests; G.roomLoot = loot; G.cine = null; G.choice = null; G.shrineUI = null; G.prompt = null; G.mode = 'play'; G.pmode = null;
    G.chestFx = { shake: 0, flash: 0, hitstop: 0 };
    const p = G.player;
    if (options.travel) floorTravelPlace(options.spots[i]);
    else if (actor.id !== COOP.selfId || R.roomRevision === 1) {
      const offsets = [[0, 0], [-12, 7], [12, 7], [0, 15]], o = offsets[i % 4];
      const s = freeSpotNoActors(room, clamp(anchor.x + o[0], 20, RPW - 20), clamp(anchor.y + o[1], 22, RPH - 14)); p.x = s.x; p.y = s.y;
    }
    p.entryX = p.x; p.entryY = p.y; p.kbx = p.kby = p.ivx = p.ivy = 0; p.rolling = 0;
    p.orbHit.clear();
    if (!options.travel) { p.inv = Math.max(p.inv, 0.8); p.shieldUp = !!p.shield; G.corrupt = 0; G.cold = 0; G.cls.coopSun = {}; classHook('enter', room); }
    i++;
  });
  coopRuntimeSelf();
  G.camOff = worldCamera(G.room, G.player);
}
function coopRuntimeFinishPendingLoot() {
  for (const a of coopRuntimeActors()) coopWithActor(a.id, () => {
    // A host changing rooms must not discard a guest's already-earned item card.
    if (G.cine && G.cine.item) {
      const it = G.cine.item, opts = itemOptions(it);
      const opt = opts ? opts.find(o => o.sell) || opts[0] : undefined;
      finishTake(it, opt); G.cine = null; G.mode = 'play';
    }
    if (G.choice && G.choice.item) { const C = G.choice, opt = C.opts.find(o => o.sell) || C.opts[0];
      if (!C.canTake || C.canTake()) { finishTake(C.item, opt); C.onDone(); }
      G.choice = null; G.mode = 'play'; }
  });
}
const COOP_INPUT_STEP = 1 / 60, COOP_INPUT_QUEUE = 15;
function coopInputQueueLimit() { return typeof coopIsTap === 'function' && coopIsTap() ? 45 : COOP_INPUT_QUEUE; }
function coopInputClear(actor, now) {
  cancelPlayerCharge(actor.context?.player);
  actor.inputSteps = []; actor.inputReset = (actor.inputReset || 0) + 1;
  actor.inputBudget = coopInputQueueLimit(); actor.inputBudgetAt = now;
  actor.input = { keys: [], pressed: [], pointer: { active: false } };
  actor.actions = [];
}
function coopRuntimeClearInput(actor) { coopInputClear(actor, COOP_RUNTIME.elapsed); }
function coopInputEnqueue(actor, steps, reset, now) {
  const limit = coopInputQueueLimit();
  if (!Array.isArray(steps) || !steps.length || steps.length > limit || !Number.isSafeInteger(reset) || reset < 0) return false;
  let previous = 0;
  for (const step of steps) {
    if (!step || typeof step !== 'object' || !Number.isSafeInteger(step.seq) || step.seq <= previous) return false;
    previous = step.seq;
  }
  if (!actor.inputSteps) { actor.inputSteps = []; actor.inputReset = 0; }
  if (reset !== actor.inputReset) return false;
  const fresh = steps.filter(step => step.seq > (actor.inputReceived || 0));
  const budget = Math.min(limit, (actor.inputBudget ?? limit) + Math.max(0, now - (actor.inputBudgetAt || 0)) / COOP_INPUT_STEP);
  actor.inputBudgetAt = now;
  if (fresh.length > Math.floor(budget + 1e-8) || actor.inputSteps.length + fresh.length > limit) { coopInputClear(actor, now); return false; }
  actor.inputBudget = budget - fresh.length;
  for (const step of fresh) actor.inputSteps.push({ ...step, at: now });
  if (fresh.length) actor.inputReceived = fresh[fresh.length - 1].seq;
  return true;
}
function coopRuntimeInputState(actor) {
  if (!actor.inputSteps) return;
  const state = `${COOP_RUNTIME.roomRevision}:${actor.connected}:${actor.downed}:${COOP_RUNTIME.ended}:${actor.context.mode}`;
  if (actor.inputState !== undefined && actor.inputState !== state) coopRuntimeClearInput(actor);
  actor.inputState = state;
  if (actor.inputSteps.length && COOP_RUNTIME.elapsed - actor.inputSteps[0].at > coopInputQueueLimit() * COOP_INPUT_STEP + 1e-9) coopRuntimeClearInput(actor);
}
function coopRuntimeInput(id, command = {}) {
  const actor = COOP_RUNTIME.actors.get(id);
  if (!coopRuntimeIsHost() || !actor || !actor.connected || !command || typeof command !== 'object' || Array.isArray(command)) return false;
  const clean = v => Array.isArray(v) ? [...new Set(v.filter(k => COOP_INPUT_ACTIONS.has(k)))].slice(0, COOP_INPUT_ACTIONS.size) : [];
  const normalized = input => {
    const pointer = input.pointer || {};
    const worldAim = Number.isFinite(pointer.worldX) && Number.isFinite(pointer.worldY)
      ? { worldX: clamp(pointer.worldX, -LW, RPW + LW), worldY: clamp(pointer.worldY, -LH, RPH + LH) } : {};
    return { keys: clean(input.keys), pressed: clean(input.pressed),
      pointer: { active: !!pointer.active, x: Number.isFinite(pointer.x) ? clamp(pointer.x, 0, LW) : 0,
        y: Number.isFinite(pointer.y) ? clamp(pointer.y, 0, LH) : 0, ...worldAim } };
  };
  if (command.steps !== undefined && id !== COOP.selfId) {
    if (!Array.isArray(command.steps) || !command.steps.length || command.steps.length > coopInputQueueLimit() ||
        !Number.isSafeInteger(command.inputReset) || command.inputReset < 0 || command.roomRevision !== COOP_RUNTIME.roomRevision) return false;
    let previous = 0;
    for (const step of command.steps) {
      if (!step || typeof step !== 'object' || !Number.isSafeInteger(step.seq) || step.seq <= previous) return false;
      previous = step.seq;
    }
    if (!actor.inputSteps) { actor.inputSteps = []; actor.inputReset = 0; }
    coopRuntimeInputState(actor);
    if (actor.downed || COOP_RUNTIME.ended) return false;
    if (command.inputReset !== actor.inputReset) return false;
    if (!coopInputEnqueue(actor, command.steps.map(step => ({ ...normalized(step), seq: step.seq })), command.inputReset, COOP_RUNTIME.elapsed)) return false;
  } else {
    // Legacy peers keep latest-state input. Once a peer uses steps it cannot bypass their budget.
    if (actor.inputSteps) return false;
    const input = normalized(command);
    input.pressed = [...new Set([...(actor.input.pressed || []), ...input.pressed])]; actor.input = input;
  }
  actor.inputAt = COOP_RUNTIME.elapsed; actor.inputSeen = true;
  if (command.action) coopRuntimeAction(id, command.action);
  return true;
}
function coopRuntimeAction(id, action) {
  const a = COOP_RUNTIME.actors.get(id);
  if (!coopRuntimeIsHost() || !a || !a.connected || !action || typeof action.kind !== 'string' || a.actions.length >= 16) return false;
  if (!['chest', 'choice', 'shrine', 'pause', 'resume', 'select'].includes(action.kind)) return false;
  // Map controls belong to the room in which that menu was opened. Ordinary
  // pause/resume controls from existing peers may still omit the revision.
  if (action.roomRevision !== undefined && (!Number.isSafeInteger(action.roomRevision) || action.roomRevision !== COOP_RUNTIME.roomRevision)) return false;
  a.actions.push({ kind: action.kind, index: Number.isInteger(action.index) ? clamp(action.index, 0, 20) : undefined,
    confirm: action.confirm !== false, ...(action.roomRevision !== undefined ? { roomRevision: action.roomRevision } : {}) }); return true;
}
function coopRuntimeLocalCommand() {
  const aim = screenToWorld(Input.pointer.x, Input.pointer.y);
  return { keys: [...Input.keys].filter(k => COOP_INPUT_ACTIONS.has(k)), pressed: [...Input.pressed].filter(k => COOP_INPUT_ACTIONS.has(k)),
    pointer: { x: Input.pointer.x, y: Input.pointer.y, worldX: aim.x, worldY: aim.y, active: Input.pointer.active } };
}
function coopRuntimeWithInput(actor, fn) {
  const saved = { keys: Input.keys, pressed: Input.pressed, pointer: Input.pointer, codes: Input.codes, anyPressed: Input.anyPressed };
  const fresh = COOP_RUNTIME.elapsed - actor.inputAt <= 0.35;
  if (!fresh) cancelPlayerCharge(actor.context.player);
  Input.keys = new Set(fresh ? actor.input.keys : []); Input.pressed = new Set(fresh ? actor.input.pressed : []);
  Input.pointer = fresh ? { ...actor.input.pointer } : { active: false }; Input.codes = new Set(); Input.anyPressed = Input.pressed.size > 0;
  if (Input.pointer.active) {
    const pointer = Input.pointer, camera = actor.id === COOP.selfId ? G.camOff : worldCamera(G.room, actor.context.player);
    const aim = Number.isFinite(pointer.worldX) && Number.isFinite(pointer.worldY)
      ? { x: pointer.worldX, y: pointer.worldY }
      : { x: pointer.x - camera[0], y: pointer.y - OY - camera[1] };
    Object.assign(pointer, worldToScreen(aim.x, aim.y));
  }
  actor.input.pressed = [];
  try { return fn(); } finally { Object.assign(Input, saved); }
}
function coopRuntimeNearest(x, y, includeDowned = false) {
  let best = null, bd = Infinity;
  for (const a of coopRuntimeActors()) {
    const p = a.context.player; if (!p || !includeDowned && (a.downed || p.hp <= 0)) continue;
    const d = dist(x, y, p.x, p.y - 5); if (d < bd) { bd = d; best = a; }
  }
  return best;
}
// Enemy AI runs in the context of the member it chases. A full context switch per enemy
// (31 fields, META replace, effect tagging sets) doubled the host tick with a crowd around a
// teammate, so consecutive enemies chasing the same non-current member share one switch.
function coopRuntimeEnemyHold(id) {
  const R = COOP_RUNTIME, actor = R.actors.get(id), home = R.actors.get(R.actorId), fields = {};
  if (home) coopRuntimeCapture(home);
  for (const k of COOP_PERSONAL_FIELDS) fields[k] = G[k];
  R.enemyHold = { id, home: R.actorId, fields, meta: { ...META }, shots: new Set(G.shots || []), later: new Set(G.later || []) };
  R.actorId = id; coopRuntimeLoad(actor);
  if (!R.renderOnly && actor.meta) coopRuntimeReplaceMeta(actor.meta);
}
function coopRuntimeEnemyRelease() {
  const R = COOP_RUNTIME, h = R.enemyHold; if (!h) return;
  R.enemyHold = null;
  const actor = R.actors.get(h.id);
  coopRuntimeTagEffects(h.id, h.shots, h.later);
  if (actor) { coopRuntimeCapture(actor); if (!R.renderOnly && actor.meta) actor.meta = { ...META }; }
  coopRuntimeReplaceMeta(h.meta); R.actorId = h.home;
  const prev = R.actors.get(h.home);
  if (prev) coopRuntimeLoad(prev); else for (const k of COOP_PERSONAL_FIELDS) G[k] = h.fields[k];
}
function coopRuntimeEnemyStep(enemy, dt, step) {
  const R = COOP_RUNTIME, a = coopRuntimeNearest(enemy.x, enemy.y);
  if (!a) { coopRuntimeEnemyRelease(); return; }
  if (R.enemyHold && R.enemyHold.id !== a.id) coopRuntimeEnemyRelease();
  if (R.enemyHold || a.id === R.actorId) coopWithActor(a.id, step);
  else { coopRuntimeEnemyHold(a.id); try { step(); } catch (error) { coopRuntimeEnemyRelease(); throw error; } }
  coopRuntimeEnemyContacts(enemy, a);
  // Keep the switched context only when the very next enemy chases the same member.
  if (R.enemyHold) {
    const list = G.enemies, i = list.indexOf(enemy), next = i >= 0 ? list[i + 1] : null, na = next && coopRuntimeNearest(next.x, next.y);
    if (!na || na.id !== R.enemyHold.id) coopRuntimeEnemyRelease();
  }
}
function coopRuntimeEnemyContacts(enemy, a) {
  const D = EDEF[enemy.kind];
  if (enemy.spawn > 0 || enemy.hp <= 0 || D.harmless || enemy.hidden || enemy.frozen > 0 || enemy.meleeStagger > 0 || enemy.controlHeld || enemy.z >= 4 || enemyCombatWindow(enemy)) return;
  for (const other of COOP_RUNTIME.actors.values()) if (other.connected && other.id !== a.id && !other.downed) {
    const p = other.context.player;
    const touching = enemyTouching(enemy, p);
    const beam = enemyBeamHits(enemy, p);
    // A distant player needs no mutable combat context or scan of the projectile list.
    if (!touching && !beam) continue;
    coopWithActor(other.id, () => {
      if (touching) enemyContactDamage(enemy, p);
      // Sweeping beams belong to the room and can strike every member crossing them.
      if (beam) enemyBeamDamage(enemy, p);
    });
  }
}
function coopRuntimePersonalRoom(actor, fn) {
  const shared = G.room, loot = actor.loot.get(coopRuntimeRoomKey());
  if (!loot) return fn();
  const view = Object.create(shared);
  for (const k of ['shop', 'altar', 'fountain', 'pond', 'pet']) if (loot[k]) view[k] = loot[k];
  G.room = view;
  try { return fn(); } finally { G.room = shared; }
}
function coopRuntimeVisibleRoom() {
  if (!coopRuntimeIsActive() || !G.roomLoot) return G.room;
  const view = Object.create(G.room);
  for (const k of ['shop', 'altar', 'fountain', 'pond', 'pet']) if (G.roomLoot[k]) view[k] = G.roomLoot[k];
  return view;
}
function coopRuntimeMenuStep(dt) {
  if (!['pause', 'journal', 'map', 'chest', 'choice', 'shrine'].includes(G.mode)) return;
  // Menus block new controls; world hazards, existing rolls and status timers keep advancing.
  updPlayer(dt, false);
  const actor = COOP_RUNTIME.actors.get(coopActorId());
  if (!COOP_RUNTIME.ended && actor && !actor.downed) classHook('update', dt);
}
function coopRuntimeActorStep(actor, dt) {
  coopRuntimeInputState(actor);
  if (actor.downed || !actor.connected) { actor.actions = []; actor.input.pressed = []; return; }
  // One real simulation tick consumes at most one input tick. Empty queues still
  // advance cooldowns/physics, but never extrapolate a second copy of held movement.
  const consumed = actor.inputSteps ? actor.inputSteps.shift() : null;
  if (actor.inputSteps) actor.input = consumed || { keys: [], pressed: ['attackCancel'], pointer: { active: false } };
  coopWithActor(actor.id, () => coopRuntimeWithInput(actor, () => {
    for (const action of actor.actions.splice(0)) {
      // A queued packet can outlive a room transition before its actor is stepped.
      if (action.roomRevision !== undefined && action.roomRevision !== COOP_RUNTIME.roomRevision) continue;
      if (action.kind === 'pause' && G.mode === 'play') { G.pmode = 'play'; G.mode = 'pause'; }
      else if (action.kind === 'resume' && G.mode === 'pause') G.mode = G.pmode || 'play';
      else {
        const ui = G.mode === 'chest' ? G.cine : G.mode === 'choice' ? G.choice : G.mode === 'shrine' ? G.shrineUI : null;
        if (ui && action.index !== undefined) {
          const count = G.mode === 'shrine' ? SHRINE_STATS.length : ui.opts ? ui.opts.length : 1;
          if (action.index < count) ui.sel = action.index;
        }
        if (ui && action.confirm) Input.pressed.add('confirm');
      }
    }
    if (consume('mute') && actor.id === COOP.selfId) toggleMute();
    if (G.mode === 'pause') { if (consume('pause')) G.mode = G.pmode || 'play'; }
    else if (G.mode === 'play' && consume('pause')) { G.pmode = 'play'; G.mode = 'pause'; }
    if (G.mode === 'journal') { updateQuestJournal(); }
    else if (consume('journal') && actor.id === COOP.selfId) openQuestJournal();
    if (G.mode !== 'play') coopRuntimeMenuStep(dt);
    if (actor.downed || COOP_RUNTIME.ended) return;
    if (G.mode === 'chest') coopRuntimePersonalRoom(actor, () => updChest(dt));
    else if (G.mode === 'choice') coopRuntimePersonalRoom(actor, () => updChoice(dt));
    else if (G.mode === 'shrine') coopRuntimePersonalRoom(actor, () => updShrine(dt));
    else if (G.mode === 'play') {
      updPlayer(dt);
      if (actor.downed || COOP_RUNTIME.ended) return;
      classHook('update', dt);
      if (actor.id !== COOP.selfId) { G.player.x = clamp(G.player.x, 4, RPW - 4); G.player.y = clamp(G.player.y, 7, RPH - 3); }
      coopRuntimePersonalRoom(actor, () => updPrompt());
      if (actor.id === COOP.selfId && G.mode === 'play') checkExits();
    }
    G.goldPulse = Math.max(0, (G.goldPulse || 0) - dt); G.soulPulse = Math.max(0, (G.soulPulse || 0) - dt);
  }));
  // Receiving an input is separate from incorporating it into the authoritative player state.
  actor.ack = actor.inputSeq || 0;
  if (consumed) actor.inputAck = consumed.seq;
  coopRuntimeInputState(actor);
}
function coopRuntimeShots(dt) {
  const R = COOP_RUNTIME, original = R.originals.updShots, initial = G.shots, groups = new Map(), flames = G.flames;
  for (const s of initial) {
    const owner = s.friendly && !s.neutral ? R.actors.get(s.ownerId) : coopRuntimeNearest(s.x + s.vx * dt, s.y + s.vy * dt);
    const a = owner && owner.connected ? owner : coopRuntimeNearest(s.x, s.y);
    if (!a) continue;
    if (!groups.has(a.id)) groups.set(a.id, []); groups.get(a.id).push(s);
  }
  const survivors = []; G.flames = [];
  try {
    for (const [id, list] of groups) coopWithActor(id, () => {
      G.shots = R.clearEnemyShotsTick ? list.filter(s => s.friendly) : list; original(dt); survivors.push(...G.shots);
    });
  } finally { G.shots = survivors; G.flames = flames; }
  if (R.clearEnemyShotsTick) { G.shots = G.shots.filter(s => s.friendly); R.clearEnemyShotsTick = false; }
  // An enemy projectile is consumed by its first actual collision, while floor patches affect all heroes.
  for (const f of flames) {
    f.life -= dt;
    if (f.kind) stepGroundArea(f, dt);
    for (const a of coopRuntimeActors()) if (!a.downed) coopWithActor(a.id, () => {
      const p = G.player;
      if (f.kind) { groundAreaHit(f, p); return; } if (f.life <= 0.2 || dist(f.x, f.y, p.x, p.y - 2) >= f.r) return;
      if (f.ice) p.slow = Math.max(p.slow, 0.3);
      else if (f.spore) { if (p.rolling <= 0) p.tox = Math.max(p.tox, 2); }
      else hurtPlayer(1, f.x, f.y, true);
    });
  }
  G.flames = flames.filter(f => f.life > 0);
}
function coopRuntimePickups(dt) {
  const clear = !G.enemies.length;
  for (const c of G.pickups) {
    c.t += dt; c.vz -= 320 * dt; c.z += c.vz * dt;
    if (c.z < 0) { c.z = 0; c.vz = Math.abs(c.vz) > 30 ? -c.vz * 0.4 : 0; c.vx *= 0.6; c.vy *= 0.6; }
    let a = c.ownerId ? COOP_RUNTIME.actors.get(c.ownerId) : coopRuntimeNearest(c.x, c.y);
    if (c.kind === 'heart' && !c.ownerId) {
      a = coopRuntimeActors().filter(q => !q.downed && q.context.player.hp < q.context.player.maxHp)
        .sort((u, v) => dist(c.x, c.y, u.context.player.x, u.context.player.y) - dist(c.x, c.y, v.context.player.x, v.context.player.y))[0];
    }
    if (a && !a.downed && a.connected) {
      const p = a.context.player, d = dist(c.x, c.y, p.x, p.y), mag = 42 * (p.magnet || 1);
      if (c.t > 0.45 && (d < mag || clear && c.kind !== 'heart')) {
        const k = (clear ? 260 : 180) * dt / Math.max(d, 1); c.vx += (p.x - c.x) * k * 4; c.vy += (p.y - c.y) * k * 4; c.vx *= 0.9; c.vy *= 0.9;
      }
      if (c.t > 0.3 && d < 8) {
        if (c.kind !== 'heart' || p.hp < p.maxHp) {
          c.done = true;
          if (c.kind === 'heart') coopWithActor(a.id, () => p.heal(2));
          else for (const receiver of coopRuntimeActors()) if (!c.ownerId || receiver.id === c.ownerId) coopWithActor(receiver.id, () => {
            if (c.kind === 'coin') { G.gold += c.v ?? COIN_VAL; G.goldPulse = 0.15; }
            else { G.runSouls++; G.soulPulse = 0.15; }
          });
          if (c.kind === 'coin') SFX.coin(); else if (c.kind === 'soul') SFX.soul();
          if (c.kind !== 'heart') G.uiCoins.push({ x: c.x, y: c.y + OY - c.z, t: 0, soul: c.kind === 'soul', ownerId: c.ownerId });
        }
      }
    }
    moveBox(c, c.vx * dt, c.vy * dt, clear && c.t > 2.5 ? 'fly' : 'walk'); c.vx *= 0.97; c.vy *= 0.97;
  }
  G.pickups = G.room.pickups = G.pickups.filter(c => !c.done);
  for (const u of G.uiCoins) u.t += dt * 2.2; G.uiCoins = G.uiCoins.filter(u => u.t < 1);
}
function coopRuntimeMechanics(dt) {
  // Shared timers/spawns advance once; actor-only effects run in each actor's own gear context.
  const room = G.room, m = mechOf(room), host = COOP_RUNTIME.actors.get(COOP.selfId);
  if (!m || !m.update || !host) return;
  if (room.mech === 'funroom') {
    for (const a of coopRuntimeActors()) if (!a.downed) coopWithActor(a.id, () => coopRuntimePersonalRoom(a, () => {
      const view = G.room;
      if (room.spring) view.spring = { ...room.spring, soak: G.cls.coopSoak || 0 };
      m.update(view, dt); if (view.spring) G.cls.coopSoak = view.spring.soak;
    }));
    return;
  }
  coopWithActor(host.id, () => m.update(room, dt));
  for (const a of coopRuntimeActors()) if (a.id !== host.id && !a.downed) coopWithActor(a.id, () => {
    const p = G.player, key = room.mech;
    if (['cold', 'void', 'godArena', 'quicksand'].includes(key)) { m.update(room, dt); return; }
    if (key === 'bog' && playerTile(room, p) === T_BOG && p.rolling <= 0) p.tox = Math.max(p.tox, 0.6);
    if (key === 'fungus' && playerTile(room, p) === T_MOSS) p.slow = Math.max(p.slow, 0.15);
    if (key === 'corrupt') {
      const k = G.corrupt || 0;
      G.corrupt = room.locked ? Math.min(100, k + dt * 5.5 * curDiff().speed * (p.corruptRes || 1)) : Math.max(0, k - dt * 40);
    }
    if (key === 'tomb') for (const pl of room.plates || []) {
      const i = Math.floor((p.y - 2) / TS) * RW + Math.floor(p.x / TS);
      if (pl.cd <= 0 && p.rolling <= 0 && i === pl.i) { pl.cd = 3; spikeRing((pl.i % RW) * TS + 8, Math.floor(pl.i / RW) * TS + 10, 22, 8, 0.55, rnd(0, 1), true); }
    }
    if (key === 'sun') for (let i = 0; i < (room.shafts || []).length; i++) {
      const s = room.shafts[i], inside = ((p.x - s.x) / s.r) ** 2 + ((p.y - s.y) / (s.r * 0.6)) ** 2 < 1;
      const counters = G.cls.coopSun || (G.cls.coopSun = {}); counters[i] = inside ? (counters[i] || 0) + dt : Math.max(0, (counters[i] || 0) - dt * 2);
      if (counters[i] >= 1.2) { counters[i] = 0; if (!p.sunShade) hurtPlayer(1, s.x, s.y, true, true); }
    }
    if (key === 'clock') {
      p.tmul = 1; for (const z of room.zones || []) if (((p.x - z.x) / z.r) ** 2 + ((p.y - z.y) / (z.r * 0.62)) ** 2 < 1) p.tmul = z.k;
      for (const gear of room.gears || []) { const d = dist(p.x, p.y, gear.x, gear.y);
        if (d < gear.r + p.hw && d > 2) { const t = norm({ x: -(p.y - gear.y), y: p.x - gear.x }); moveBox(p, t.x * gear.w * 22 * dt, t.y * gear.w * 22 * dt, 'player'); } }
    }
    if (key === 'rift' && p.rolling <= 0) {
      const [x, y] = portalPair(room);
      if (x && y && (p.portT || 0) <= G.time) for (const [from, to] of [[x, y], [y, x]]) if (dist(p.x, p.y, from.x, from.y) < 9) { p.x = to.x; p.y = to.y + 2; p.portT = G.time + 1.2; break; }
    }
    if (key === 'funroom') coopRuntimePersonalRoom(a, () => {
      const view = G.room;
      if (room.spring) view.spring = { ...room.spring, soak: G.cls.coopSoak || 0 };
      m.update(view, dt); if (view.spring) G.cls.coopSoak = view.spring.soak;
    });
  });
}
function coopRuntimeEnd(win) {
  const R = COOP_RUNTIME; if (R.ended) return;
  R.ended = win ? 'win' : 'dead';
  for (const a of coopRuntimeActors()) coopWithActor(a.id, () => {
    G.mode = R.ended; G.pmode = null; G.cine = null; G.choice = null; G.shrineUI = null; G.endT = 0;
    G.soulGain = Math.round((G.runSouls + (win ? CONFIG.winSoulBonus : 0)) * soulMul() * curDiff().souls);
    if (typeof coopProgressSettle === 'function') coopProgressSettle(win, a.id, { runSouls: G.runSouls, runKills: G.runKills, gfloor: G.gfloor });
    G.banked = true;
  });
  G.trans = null; if (win) { SFX.win(); G.flash = 0.3; } else { SFX.die(); shake(8); }
  // Keep the current caller's actor selected until its coopWithActor finally restores it.
  // Switching to the host here would copy host gear/stats into the last fallen guest.
}
function coopRuntimeUpdate(dt) {
  if (!coopRuntimeIsActive()) return false;
  const R = COOP_RUNTIME; R.elapsed += dt;
  if (COOP.role !== 'host') { if (R.lastApplied >= 0) coopViewTick(dt, COOP_VIEW.frameDriven ? 0 : dt); G.simDt = 0; return true; }
  G.simDt = 0; G.time += dt; G.runTime = (G.runTime || 0) + (R.ended ? 0 : dt);
  G.shake = Math.max(0, G.shake - dt * 30); G.flash = Math.max(0, G.flash - dt); G.hurtFlash = Math.max(0, G.hurtFlash - dt);
  for (const a of R.actors.values()) coopRuntimeDecayChestFx(a.context.chestFx, dt);
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 2.4) G.banner = null; }
  if (R.ended) {
    for (const a of coopRuntimeActors()) a.context.endT += dt;
    updParts(dt); coopRuntimeSelf(); return true;
  }
  coopRuntimeSelf();
  if (updTransition(dt)) { updParts(dt); coopRuntimeSelf(); return true; }
  if (G.hitstop > 0) G.hitstop = Math.max(0, G.hitstop - dt); // Visual hitstop never suspends remote inputs.
  for (const a of coopRuntimeActors()) coopRuntimeActorStep(a, dt);
  if (!R.ended && !G.trans) {
    coopRuntimeSelf(); try { updEnemies(dt); } finally { coopRuntimeEnemyRelease(); } coopRuntimeShots(dt); updWarns(dt); coopRuntimePickups(dt); coopRuntimeMechanics(dt);
    if (!R.ended && G.room.locked && !G.enemies.length) coopWithActor(COOP.selfId, roomCleared);
  }
  updParts(dt);
  for (const a of coopRuntimeActors()) coopWithActor(a.id, () => updChestLids(dt));
  if (!R.ended && !coopRuntimeActors().some(a => !a.downed && a.context.player.hp > 0)) coopRuntimeEnd(false);
  coopRuntimeSelf(); Input.pressed.clear(); Input.anyPressed = false; return true;
}
function coopRuntimeDisconnect(id) {
  const a = COOP_RUNTIME.actors.get(id); if (!a) return;
  a.connected = false; a.input = { keys: [], pressed: [], pointer: { active: false } }; a.actions = [];
  coopRuntimeInputState(a);
  if (coopRuntimeIsHost() && !COOP_RUNTIME.ended && !coopRuntimeActors().some(p => !p.downed && p.context.player.hp > 0)) coopRuntimeEnd(false);
}
function coopRuntimeStop() {
  const R = COOP_RUNTIME; R.active = false; R.actorId = null; R.actors.clear(); R.ended = null; R.runId = null; R.lastApplied = -1;
  R.fxSent = null; coopViewReset(); resetInput();
}
function coopRuntimeInstall() {
  const R = COOP_RUNTIME; if (R.installed) return; R.installed = true;
  const wrap = (name, original) => R.originals[name] = original;
  wrap('spawnEnemy', spawnEnemy); spawnEnemy = function (...args) { const e = R.originals.spawnEnemy(...args);
    if (coopRuntimeIsHost() && G.room.type !== 'town') { e.hp = Math.max(1, Math.round(e.hp * (1 + 0.65 * (coopRuntimeCount() - 1)))); e.max = e.hp; }
    return e;
  };
  wrap('spawnWave', spawnWave); spawnWave = function (room) {
    const before = G.enemies.length; R.originals.spawnWave(room);
    if (!coopRuntimeIsHost()) return;
    const extra = coopRuntimeCount() - 1; if (!extra) return;
    const C = chap(), base = G.enemies.slice(before).filter(e => !EDEF[e.kind].boss && !e.link);
    const n = room.type === 'boss' ? extra * 2 : Math.max(1, Math.round(base.length * 0.45 * extra));
    if (!['combat', 'challenge', 'stairs', 'boss'].includes(room.type)) return;
    for (let i = 0; i < n; i++) { const e = base[i % Math.max(1, base.length)], kind = room.type === 'boss' ? C.pool[i % C.pool.length][0] : e ? e.kind : C.pool[0][0];
      const s = freeSpot(room, 55, G.player.x, G.player.y, EDEF[kind].fly ? 'fly' : 'walk'); spawnEnemy(kind, s.x, s.y, 0.7 + i * 0.07); }
  };
  wrap('enterRoom', enterRoom); enterRoom = function (...args) {
    if (coopRuntimeIsHost() && !R.initializing) coopRuntimeFinishPendingLoot();
    const out = R.originals.enterRoom(...args);
    if (coopRuntimeIsHost() && !R.initializing) { coopRuntimeCapture(R.actors.get(COOP.selfId)); coopRuntimeSetupRoom(args[1], args[2]); }
    return out;
  };
  wrap('startFloor', startFloor); startFloor = function (...args) {
    const out = R.originals.startFloor(...args);
    if (coopRuntimeIsHost() && !R.initializing) for (const a of coopRuntimeActors()) if (a.id !== COOP.selfId) coopWithActor(a.id, () => {
      if (lv('heal')) G.player.heal(lv('heal') * 2); G.floorBuff = null; G.pet = null; recalcStats();
    });
    return out;
  };
  wrap('spawnChest', spawnChest); spawnChest = function (x, y, tier, force = 0) {
    if (!coopRuntimeIsHost() || R.initializing) return R.originals.spawnChest(x, y, tier, force);
    const key = coopRuntimeRoomKey(), template = mkChest(x, y, tier, force);
    G.room.chests.push(template);
    for (const a of coopRuntimeActors()) { const loot = a.loot.get(key); if (loot) loot.chests.push({ ...template }); }
    burst(x, y - 6, 24, ['#ffffff', TIERS[tier].col], { sp: 70, life: 0.5, up: true }); SFX.door();
  };
  wrap('roomCleared', roomCleared); roomCleared = function () {
    const room = G.room, was = room.cleared; R.originals.roomCleared();
    if (!coopRuntimeIsHost() || was || !room.cleared) return;
    for (const a of coopRuntimeActors()) coopWithActor(a.id, () => {
      if (a.downed) { a.downed = false; G.player.hp = Math.max(1, Math.ceil(G.player.maxHp / 2)); G.player.inv = 2; G.mode = 'play'; G.cine = G.choice = null; addFloat(G.player.x, G.player.y - 20, '队友已复苏', '#82e68c'); }
      if (a.id !== COOP.selfId) classHook('clear', room);
    });
  };
  wrap('gameOver', gameOver); gameOver = function (win) {
    if (!coopRuntimeIsHost()) return R.originals.gameOver(win);
    if (win) return coopRuntimeEnd(true);
    const a = R.actors.get(coopActorId()); if (a) { a.downed = true; G.player.hp = 0; G.player.moving = false; G.cine = G.choice = null; G.mode = 'play'; addFloat(G.player.x, G.player.y - 20, '倒地 · 清房后复苏', '#ff6070'); }
    if (!coopRuntimeActors().some(p => !p.downed && p.context.player.hp > 0)) coopRuntimeEnd(false);
  };
  wrap('bankSouls', bankSouls); bankSouls = function (win) {
    if (!coopRuntimeIsActive()) return R.originals.bankSouls(win);
    if (coopRuntimeIsHost() && typeof coopProgressSettle === 'function') coopProgressSettle(win, coopActorId(), { runSouls: G.runSouls, runKills: G.runKills, gfloor: G.gfloor });
  };
  wrap('regionBeaten', regionBeaten); regionBeaten = function (act, ch, diff) {
    if (!coopRuntimeIsActive()) return R.originals.regionBeaten(act, ch, diff);
    if (coopRuntimeIsHost() && typeof coopProgressRegion === 'function') coopProgressRegion(act, ch, diff);
  };
  wrap('hurtPlayer', hurtPlayer); hurtPlayer = function (...args) {
    if (!coopRuntimeIsHost()) return R.originals.hurtPlayer(...args);
    const a = R.actors.get(coopActorId()); if (!a || a.downed || R.ended) return;
    const mode = G.mode; G.mode = 'play';
    try { return coopRuntimeHurtFx(() => R.originals.hurtPlayer(...args)); } finally { if (!R.ended) G.mode = a.downed ? 'play' : mode; }
  };
  wrap('hitPlayerShot', hitPlayerShot); hitPlayerShot = function (shot, consumeShot = true) {
    if (!coopRuntimeIsHost()) return R.originals.hitPlayerShot(shot, consumeShot);
    let hit = false;
    // A targeting choice must not hide another player's actual collision behind an immune ally.
    for (const actor of R.actors.values()) if (actor.connected && !actor.downed && playerShotOverlap(shot, actor.context.player)) {
      const landed = coopWithActor(actor.id, () => R.originals.hitPlayerShot(shot, consumeShot));
      hit = hit || landed;
      if (landed && consumeShot) break;
    }
    return hit;
  };
  wrap('areaHit', areaHit); areaHit = function (...args) {
    if (!coopRuntimeIsHost()) return R.originals.areaHit(...args);
    for (const a of coopRuntimeActors()) if (!a.downed) coopWithActor(a.id, () => R.originals.areaHit(...args));
  };
  // Shaped telegraphs land on every living member inside the shape (host authoritative), like areaHit.
  wrap('shapeHit', shapeHit); shapeHit = function (...args) {
    if (!coopRuntimeIsHost()) return R.originals.shapeHit(...args);
    let hit = false;
    for (const a of coopRuntimeActors()) if (!a.downed) hit = coopWithActor(a.id, () => R.originals.shapeHit(...args)) || hit;
    return hit;
  };
  // Every actual burn/poison application captures its own actor and damage. Resolving the whole status
  // update in one actor's context would mix a guest's burn with the host's poison and steal death credit.
  wrap('dotStatusSource', dotStatusSource); dotStatusSource = function (kind, legacyOwnerId) {
    if (!coopRuntimeIsHost()) return R.originals.dotStatusSource(kind);
    const id = legacyOwnerId || coopActorId();
    const capture = () => ({ ...R.originals.dotStatusSource(kind), ownerId: id });
    return id && R.actors.has(id) ? coopWithActor(id, capture) : capture();
  };
  wrap('damageEnemyDot', damageEnemyDot); damageEnemyDot = function (e, n, ownerId, o) {
    const hit = () => R.originals.damageEnemyDot(e, n, ownerId, o);
    return coopRuntimeIsHost() && ownerId && R.actors.has(ownerId) ? coopWithActor(ownerId, hit) : hit();
  };
  wrap('killEnemy', killEnemy); killEnemy = function (e, ...args) {
    const fresh = !e.campDeathCounted, id = coopActorId(); R.originals.killEnemy(e, ...args);
    if (coopRuntimeIsHost() && fresh && e.kind !== 'dummy') for (const a of coopRuntimeActors()) if (a.id !== id) coopWithActor(a.id, () => { G.runKills++; G.player.kills++; });
    if (coopRuntimeIsHost() && EDEF[e.kind].boss) R.clearEnemyShotsTick = true;
  };
  wrap('warn', warn); warn = function (x, y, rad, t, fn, col) {
    if (!coopRuntimeIsHost()) return R.originals.warn(x, y, rad, t, fn, col);
    return R.originals.warn(x, y, rad, t, w => { const a = coopRuntimeNearest(w.x, w.y); if (a) coopWithActor(a.id, () => fn(w)); }, col);
  };
  wrap('openChest', openChest); openChest = function () {
    const before = new Set(G.pickups); coopRuntimeChestFx(() => R.originals.openChest());
    if (coopRuntimeIsHost()) for (const p of G.pickups) if (!before.has(p)) p.ownerId = coopActorId();
  };
  wrap('enemyShot', enemyShot); enemyShot = function (x, y, ...args) {
    const shot = R.originals.enemyShot(x, y, ...args);
    if (coopRuntimeIsHost()) { shot.bornAt = G.time; shot.bornX = x; shot.bornY = y; }
    return shot;
  };
  wrap('startChest', startChest); startChest = function (...args) { return coopRuntimeChestFx(() => R.originals.startChest(...args)); };
  wrap('updChest', updChest); updChest = function (...args) { return coopRuntimeChestFx(() => R.originals.updChest(...args)); };
  wrap('takeCineItem', takeCineItem); takeCineItem = function (...args) { return coopRuntimeChestFx(() => R.originals.takeCineItem(...args)); };
  wrap('updShots', updShots);
  wrap('updPrompt', updPrompt); updPrompt = function () {
    if (!coopRuntimeIsHost() || coopActorId() === COOP.selfId || !G.room.stairs) return R.originals.updPrompt();
    const s = G.room.stairs; G.room.stairs = null;
    try { R.originals.updPrompt(); if (!G.prompt && dist(G.player.x, G.player.y, s.x, s.y) < 22) G.prompt = { text: '等房主带队前往下一层', x: s.x, y: s.y + OY + 15 }; }
    finally { G.room.stairs = s; }
  };
  wrap('renderWorld', renderWorld); renderWorld = function (time) {
    if (coopTownActive() && COOP.role === 'client' && coopIsTap()) {
      const undo = coopTownViewApply();
      try { return R.originals.renderWorld(time); } finally { undo(); }
    }
    if (!coopRuntimeIsActive()) return R.originals.renderWorld(time);
    const room = G.room, shake = G.shake, flash = G.flash; G.room = coopRuntimeVisibleRoom();
    G.shake = Math.max(shake || 0, G.chestFx && G.chestFx.shake || 0);
    G.flash = Math.max(flash || 0, G.chestFx && G.chestFx.flash || 0);
    const hurtFlash = G.hurtFlash; G.hurtFlash = Math.max(hurtFlash || 0, G.chestFx && G.chestFx.hurtFlash || 0);
    const undo = COOP.role !== 'host' && R.lastApplied >= 0 ? coopViewApply() : null;
    try { return R.originals.renderWorld(undo ? G.time : time); } finally { if (undo) undo(); G.room = room; G.shake = shake; G.flash = flash; G.hurtFlash = hurtFlash; }
  };
  wrap('drawUI', drawUI); drawUI = function () {
    const undo = coopRuntimeIsActive() && COOP.role === 'client' && R.lastApplied >= 0 ? coopViewCosmeticApply() : null;
    try { return R.originals.drawUI(); } finally { if (undo) undo(); }
  };
  wrap('drawHUDLow', drawHUDLow); drawHUDLow = function () {
    const undo = coopRuntimeIsActive() && COOP.role === 'client' && R.lastApplied >= 0 ? coopViewCosmeticApply() : null;
    try { return R.originals.drawHUDLow(); } finally { if (undo) undo(); }
  };
}
