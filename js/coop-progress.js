'use strict';
// Only the host's confirmed, addressed run messages can advance this machine's own save.
// A bounded write-ahead receipt makes a replay (including after a crash/restart) harmless.
const COOP_PROGRESS_KEY = 'chest_dungeon_coop_receipts_v1';
const COOP_PROGRESS_MAX_RUNS = 64;
const COOP_PROGRESS_SHARED = new Set(['kill', 'boss', 'clear', 'visit']);
const COOP_PROGRESS_PERSONAL = new Set(['chest', 'discover', 'goldspend', 'heal', 'altar']);
const COOP_PROGRESS_ROOMS = new Set(['start', 'combat', 'challenge', 'stairs', 'boss', 'treasure', 'shop', 'fountain', 'altar', 'shrine', 'pond', 'pet', 'spring']);
let coopProgressLedger = null;

function coopProgressSession() { return typeof COOP !== 'undefined' ? COOP : null; }
function coopProgressId(id) { return typeof id === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(id); }
function coopProgressInt(n, lo, hi) { return Number.isSafeInteger(n) && n >= lo && n <= hi; }
function coopProgressRemoteActor() {
  const c = coopProgressSession();
  return !!(c && c.connected && c.role === 'host' && typeof coopActorId === 'function' && coopActorId() && coopActorId() !== c.selfId);
}
function coopProgressStore(ledger) {
  try { localStorage.setItem(COOP_PROGRESS_KEY, JSON.stringify(ledger)); return true; } catch (_) { return metaSaveFailed(); }
}
function coopProgressRead() {
  if (coopProgressLedger) return coopProgressLedger;
  let raw;
  try { raw = JSON.parse(localStorage.getItem(COOP_PROGRESS_KEY) || 'null'); } catch (_) {}
  const runs = raw && raw.ver === 1 && Array.isArray(raw.runs) ? raw.runs.slice(-COOP_PROGRESS_MAX_RUNS).filter(r =>
    r && coopProgressId(r.id) && coopProgressInt(r.seq, 0, 10000000) && coopProgressInt(r.act, 1, ACTS.length) &&
    coopProgressInt(r.diff, 0, DIFFS.length - 1)).map(r => ({ id: r.id, seq: r.seq, act: r.act, diff: r.diff, started: !!r.started, settled: !!r.settled })) : [];
  const pending = raw && raw.pending && coopProgressId(raw.pending.id) && coopProgressInt(raw.pending.seq, 0, 10000000) &&
    typeof raw.pending.post === 'string' && raw.pending.post.length < 524288 ? raw.pending : null;
  return coopProgressLedger = { ver: 1, runs, pending };
}
function coopProgressRestore(raw) {
  const own = JSON.parse(raw);
  for (const key of Object.keys(META)) delete META[key];
  Object.assign(META, own, { unlockedSet: new Set(own.unlocked || []), seenSet: new Set(own.seen || []) });
}
function coopProgressSnapshot() {
  const { unlockedSet, seenSet, ...own } = META;
  own.unlocked = [...unlockedSet]; own.seen = [...seenSet];
  return JSON.stringify(own);
}
function coopProgressRecover() {
  const ledger = coopProgressRead();
  if (!ledger.pending) return true;
  const p = ledger.pending;
  // This post-image was created locally, never supplied by a network peer.
  try {
    const own = JSON.parse(p.post);
    if (!own || own.ver !== 3 || !own.camp || !Array.isArray(own.seen) || !Array.isArray(own.unlocked)) {
      ledger.pending = null; return coopProgressStore(ledger);
    }
    // Once the primary write succeeded, META may already contain newer local changes.
    // Finishing its receipt must not restore an older post-image over those changes.
    if (localStorage.getItem(SAVE_KEY) !== p.post) {
      metaStore(p.post);
      coopProgressRestore(p.post);
    }
    const run = ledger.runs.find(r => r.id === p.id);
    if (!run) { ledger.pending = null; return coopProgressStore(ledger); }
    run.seq = Math.max(run.seq, p.seq); run.started = !!p.started; run.settled = !!p.settled;
    const done = { ver: 1, runs: ledger.runs, pending: null };
    if (!coopProgressStore(done)) return false;
    coopProgressLedger = done; return true;
  } catch (_) { return metaSaveFailed(); }
}
function coopProgressValidContext(p, allowDisconnected = false) {
  const c = coopProgressSession();
  if (!c || (!c.connected && !allowDisconnected) || c.phase !== 'run' || coopProgressRemoteActor()) return false;
  if (!p || p.sessionId !== c.sessionId || p.runId !== c.runId || p.playerId !== c.selfId ||
      !coopProgressId(p.runId) || !coopProgressId(p.sessionId) || !coopProgressId(p.playerId)) return false;
  if (p.eventId !== undefined && p.eventId !== `${p.runId}:${p.seq}`) return false;
  if (!coopProgressInt(p.seq, 1, 10000000) || !coopProgressInt(p.act, 1, ACTS.length) ||
      !coopProgressInt(p.chapter, 1, actOf(p.act).regions.length) || !coopProgressInt(p.floor, 1, CONFIG.floorsPerRegion) ||
      !coopProgressInt(p.diff, 0, DIFFS.length - 1) || !COOP_PROGRESS_ROOMS.has(p.roomType)) return false;
  const ctx = c.runContext || G;
  if (ctx.act !== p.act || ctx.diff !== p.diff) return false;
  return true;
}
function coopProgressTransaction(p, mutate, settled = false) {
  if (!coopProgressRecover()) return false;
  const ledger = coopProgressRead(), old = ledger.runs.find(r => r.id === p.runId);
  if (old && (old.settled || p.seq <= old.seq || old.act !== p.act || old.diff !== p.diff)) return false;
  const before = coopProgressSnapshot();
  try {
    mutate();
    let post = coopProgressSnapshot();
    const runs = ledger.runs.filter(r => r.id !== p.runId);
    const next = { id: p.runId, seq: old ? old.seq : 0, act: p.act, diff: p.diff, started: true, settled: false };
    runs.push(next);
    if (post === before) {
      // Even irrelevant events need a durable sequence, otherwise an old replay could advance a newly accepted quest.
      // No META change means no full post-image or primary save is needed.
      next.seq = p.seq; next.settled = settled;
      const done = { ver: 1, runs: runs.slice(-COOP_PROGRESS_MAX_RUNS), pending: null };
      if (!coopProgressStore(done)) return false;
      coopProgressLedger = done; return true;
    }
    META.savedAt = Date.now(); post = coopProgressSnapshot();
    const pending = { id: p.runId, seq: p.seq, started: true, settled, post };
    const prepared = { ver: 1, runs: runs.slice(-COOP_PROGRESS_MAX_RUNS), pending };
    if (!coopProgressStore(prepared)) { coopProgressRestore(before); return false; }
    coopProgressLedger = prepared;
    metaStore(post);
    next.seq = p.seq; next.settled = settled;
    const done = { ver: 1, runs: prepared.runs, pending: null };
    if (coopProgressStore(done)) coopProgressLedger = done;
    // A failed final receipt write leaves the durable post-image for recovery; it never grants twice.
    return true;
  } catch (_) { coopProgressRestore(before); return metaSaveFailed(); }
}
function coopProgressQuestEvent(kind, data) {
  // Use each participant's current steps; NPC conversations and rewards stay in their own camp.
  for (const { q, state } of questActiveEntries()) {
    refreshQuestState(q, state);
    const step = q.steps[state.step];
    if (step && step.type === 'event' && step.event === kind && questEventMatches(step, data)) {
      const amount = kind === 'goldspend' ? data.amount : 1;
      state.progress = Math.min(questGoal(step), state.progress + amount);
      refreshQuestState(q, state);
    }
  }
}
function coopProgressEventData(p) {
  const input = p.payload && typeof p.payload === 'object' && !Array.isArray(p.payload) ? p.payload : {};
  const data = { act: p.act, chapter: p.chapter, floor: p.floor, diff: p.diff, type: p.roomType };
  if (p.kind === 'visit') {
    if (!['shop', 'shrine', 'treasure', 'fountain', 'altar', 'challenge'].includes(input.type) || input.type !== p.roomType) return null;
  } else if (p.kind === 'discover') {
    const item = typeof input.id === 'string' ? forgeItem(input.id) : null;
    if (!item || item.slot === 'use' || item.silver && !forgeLootItems().some(it => it.id === item.id)) return null;
    data.id = input.id;
  } else if (p.kind === 'goldspend') {
    if (!coopProgressInt(input.amount, 1, 100000) || !['shop', 'shrine'].includes(p.roomType)) return null;
    data.amount = input.amount;
  } else if (p.kind === 'heal') {
    if (!coopProgressInt(input.amount, 1, 10000) || input.source !== 'fountain' || p.roomType !== 'fountain') return null;
    data.amount = input.amount; data.source = 'fountain';
  } else if (p.kind === 'altar' && p.roomType !== 'altar') return null;
  else if (p.kind === 'boss' && p.roomType !== 'boss') return null;
  else if (p.kind === 'clear' && !['combat', 'challenge', 'stairs', 'boss'].includes(p.roomType)) return null;
  return data;
}
function coopProgressApplyEvent(p) {
  if (!coopProgressValidContext(p) || p.type !== 'progress:event' ||
      !(COOP_PROGRESS_SHARED.has(p.kind) || COOP_PROGRESS_PERSONAL.has(p.kind))) return false;
  const data = coopProgressEventData(p); if (!data) return false;
  return coopProgressTransaction(p, () => {
    const newDiscovery = p.kind !== 'discover' || coopProgressSession().role === 'host' || !META.seenSet.has(data.id);
    if (p.kind === 'discover') META.seenSet.add(data.id);
    if (p.kind === 'discover') {
      const item = forgeNormalWeapon(data.id);
      if (item && !item.lock) META.unlockedSet.add(item.id);
    }
    // The remote simulation has only a minimal gear profile, so it cannot know a guest's historical codex.
    // The host's own finishTake already updates its local seenSet before emitting an authoritative discovery.
    if (newDiscovery) coopProgressQuestEvent(p.kind, data);
  });
}
function coopProgressApplyRegion(p) {
  if (!coopProgressValidContext(p) || p.type !== 'progress:region' || p.roomType !== 'boss') return false;
  return coopProgressTransaction(p, () => coopProgressUnlockRegion(p));
}
function coopProgressUnlockRegion(p) {
  const P = actProg(p.act), D = P.diff[p.diff], n = actOf(p.act).regions.length;
  P.open = true; if (!D.reg) D.reg = 1;
  D.reg = Math.max(D.reg, Math.min(n, p.chapter + 1));
  if (p.chapter >= n) {
    if (p.diff + 1 < DIFFS.length && !P.diff[p.diff + 1].reg) P.diff[p.diff + 1].reg = 1;
    if (ACTS[p.act]) { const N = actProg(p.act + 1); N.open = true; if (!N.diff[0].reg) N.diff[0].reg = 1; }
  }
  if (p.act === 1) META.maxCh = Math.max(META.maxCh, D.reg);
}
function coopProgressApplySettlement(p, allowDisconnected = false) {
  if (!coopProgressValidContext(p, allowDisconnected) || p.type !== 'progress:settle' || typeof p.win !== 'boolean' ||
      !coopProgressInt(p.runSouls, 0, 1000000) || !coopProgressInt(p.runKills, 0, 1000000) ||
      !coopProgressInt(p.gfloor, 1, actOf(p.act).regions.length * CONFIG.floorsPerRegion) ||
      p.gfloor !== (p.chapter - 1) * CONFIG.floorsPerRegion + p.floor ||
      (p.win && (p.chapter !== actOf(p.act).regions.length || p.floor !== CONFIG.floorsPerRegion))) return false;
  let gain = 0;
  const ok = coopProgressTransaction(p, () => {
    gain = Math.round((p.runSouls + (p.win ? CONFIG.winSoulBonus : 0)) * soulMul() * DIFFS[p.diff].souls);
    META.souls += gain; META.runs++; META.kills += p.runKills; if (p.win) META.wins++;
    workshopRewardRun(p);
    const P = actProg(p.act), D = P.diff[p.diff];
    P.open = true; D.reg = Math.max(1, D.reg); D.runs++; if (p.win) D.wins++;
    D.best = Math.max(D.best, p.gfloor); META.best = Math.max(META.best, p.gfloor);
    if (p.win) {
      coopProgressUnlockRegion(p);
      const data = { act: p.act, chapter: p.chapter, floor: p.floor, diff: p.diff, type: p.roomType };
      coopProgressQuestEvent('win', data); if (p.diff >= 1) coopProgressQuestEvent('hardwin', data);
    }
  }, true);
  if (ok) { G.banked = true; G.soulGain = gain; }
  return ok;
}
function coopProgressBeginRun(p) {
  const c = coopProgressSession();
  if (!c || !p || !c.connected || c.phase !== 'run' || p.sessionId !== c.sessionId || p.runId !== c.runId ||
      p.playerId !== c.selfId || !coopProgressId(p.runId) || !coopProgressInt(p.act, 1, ACTS.length) ||
      !coopProgressInt(p.diff, 0, DIFFS.length - 1) || !coopProgressRecover()) return false;
  const old = coopProgressRead().runs.find(r => r.id === p.runId);
  if (old) return old.act === p.act && old.diff === p.diff && !old.settled;
  // Host newRun already consumes its meal; a guest consumes only their own booking here.
  const before = coopProgressSnapshot();
  try {
    if (c.role === 'client') townCamp().nextMeal = null;
    const ledger = coopProgressRead(), run = { id: p.runId, seq: 0, act: p.act, diff: p.diff, started: true, settled: false };
    const prepared = { ver: 1, runs: [...ledger.runs, run].slice(-COOP_PROGRESS_MAX_RUNS),
      pending: { id: p.runId, seq: 0, started: true, settled: false, post: coopProgressSnapshot() } };
    if (!coopProgressStore(prepared)) { coopProgressRestore(before); return false; }
    coopProgressLedger = prepared;
    return coopProgressRecover();
  } catch (_) { coopProgressRestore(before); return metaSaveFailed(); }
}
function coopProgressProfile() {
  coopProgressRecover();
  const levels = {};
  for (const t of TALENTS) if (coopProgressInt(META.lv[t.id], 1, t.max)) levels[t.id] = META.lv[t.id];
  const camp = townCamp();
  const forge = forgeCombatProfile(META.forge);
  // Older versions allowed cultivating undiscovered weapons; keep those records in the save but do not publish unusable growth.
  forge.weapons = Object.fromEntries(Object.entries(forge.weapons).filter(([id]) => weaponCultivationUnlocked(forgeItem(id))));
  return { lv: levels, unlocked: ITEMS.filter(it => META.unlockedSet.has(it.id) || forgeNormalWeapon(it.id) && weaponCultivationUnlocked(it)).map(it => it.id), starter: camp.starter, meal: camp.nextMeal,
    clearedActs: ACTS.map((_, i) => i + 1).filter(act => themeCleared(act)),
    forge, costume: wornCostume().id };
}
function coopProgressRecipients() {
  const c = coopProgressSession(), members = c && Array.isArray(c.members) ? c.members : [];
  const ids = members.map(m => typeof m === 'string' ? m : m && m.id).filter(coopProgressId);
  if (c && !ids.includes(c.selfId)) ids.unshift(c.selfId);
  return [...new Set(ids)].slice(0, 4);
}
function coopProgressPacket(type, playerId, extra = {}) {
  const c = coopProgressSession();
  if (!c || !c.connected || c.role !== 'host' || c.phase !== 'run' || !coopProgressId(c.runId)) return null;
  if (c._progressRun !== c.runId) { c._progressRun = c.runId; c._progressSequence = 0; c._progressRegions = new Set(); c._progressSettled = new Set(); }
  const seq = ++c._progressSequence;
  return { type, sessionId: c.sessionId, runId: c.runId, playerId, seq, eventId: `${c.runId}:${seq}`,
    act: G.act, chapter: G.chapter, floor: G.floor, diff: G.diff, roomType: G.room && G.room.type || 'start', ...extra };
}
function coopProgressSend(packet) {
  const c = coopProgressSession();
  if (!packet || !c || typeof c.emitProgress !== 'function') return false;
  c.emitProgress(packet); return true;
}
function coopProgressEmit(kind, payload, actorId) {
  const c = coopProgressSession();
  if (!c || !c.connected || c.role !== 'host' || c.phase !== 'run' ||
      !(COOP_PROGRESS_SHARED.has(kind) || COOP_PROGRESS_PERSONAL.has(kind))) return false;
  const id = actorId || (typeof coopActorId === 'function' ? coopActorId() : c.selfId) || c.selfId;
  const ids = COOP_PROGRESS_SHARED.has(kind) ? coopProgressRecipients() : coopProgressRecipients().filter(i => i === id);
  for (const playerId of ids) coopProgressSend(coopProgressPacket('progress:event', playerId, { kind, payload: payload === undefined ? {} : payload }));
  return ids.length > 0;
}
function coopProgressRegion(act, chapter, diff) {
  if (act && typeof act === 'object') return coopProgressApplyRegion(act);
  const c = coopProgressSession();
  if (!c || !c.connected || c.role !== 'host' || c.phase !== 'run') return false;
  // Initialize sequence state before checking the per-run region receipt.
  if (c._progressRun !== c.runId) { c._progressRun = c.runId; c._progressSequence = 0; c._progressRegions = new Set(); c._progressSettled = new Set(); }
  const key = `${act}:${chapter}:${diff}`;
  if (c._progressRegions.has(key)) return false;
  c._progressRegions.add(key);
  for (const playerId of coopProgressRecipients()) coopProgressSend(coopProgressPacket('progress:region', playerId, { act, chapter, diff, roomType: 'boss' }));
  return true;
}
function coopProgressSettle(win, actorId, stats) {
  const c = coopProgressSession();
  if (!c || !c.connected || c.role !== 'host' || c.phase !== 'run') return false;
  const id = actorId || (typeof coopActorId === 'function' ? coopActorId() : c.selfId) || c.selfId;
  if (!coopProgressRecipients().includes(id)) return false;
  const packet = coopProgressPacket('progress:settle', id, { win: !!win,
    runSouls: stats ? stats.runSouls : G.runSouls, runKills: stats ? stats.runKills : G.runKills, gfloor: stats ? stats.gfloor : G.gfloor });
  if (!packet || c._progressSettled.has(id)) return false;
  c._progressSettled.add(id); return coopProgressSend(packet);
}
function coopProgressDisconnect(stats) {
  const c = coopProgressSession();
  if (!c || c.phase !== 'run' || !stats || !coopProgressRecover()) return false;
  const old = coopProgressRead().runs.find(r => r.id === c.runId);
  if (old && old.settled) return false;
  const packet = { type: 'progress:settle', sessionId: c.sessionId, runId: c.runId, playerId: c.selfId,
    seq: (old ? old.seq : 0) + 1, win: false, act: stats.act, chapter: stats.chapter, floor: stats.floor, diff: stats.diff,
    roomType: stats.roomType || 'combat', runSouls: stats.runSouls, runKills: stats.runKills, gfloor: stats.gfloor };
  return coopProgressApplySettlement(packet, true);
}

// The actor context can use stats and gear, but may never write a remote player's fake META into this machine's save.
const coopProgressOriginalSave = saveMeta;
saveMeta = function (...args) { if (!coopProgressRemoteActor()) return coopProgressOriginalSave(...args); };
const coopProgressOriginalEvent = townServiceEvent;
townServiceEvent = function (kind, payload) {
  const c = coopProgressSession();
  if (c && c.connected && c.phase === 'run') {
    if (c.role === 'host') coopProgressEmit(kind, payload);
    return;
  }
  return coopProgressOriginalEvent(kind, payload);
};
