'use strict';
// Shared by solo simulation, host authority, guest prediction and rendering.
const MELEE_COMBAT = Object.freeze({ windup: .3, strike: .12, contactRecovery: .8,
  lightMove: .85, heavyMove: .65, stagger: .15, heavyStagger: .18, eliteStagger: .08,
  controlRecovery: .8, bossRecovery: .6, breakDuration: .85, breakRecovery: 8,
  postureHpRatio: .2, meleePostureScale: 1, rangedPostureScale: .5,
  postureDecayDelay: 1.5, postureDecay: 20 });
const ENEMY_SKILL_WINDUPS = new Set(['slime', 'elite', 'frog', 'skel', 'shroom', 'imp', 'firebat',
  'wisp', 'drowned', 'sporeling', 'mirrorQueen', 'mirrorImage', 'sylph', 'voidEye', 'chaosImp']);
const ENEMY_CHARGERS = new Set(['spider', 'queen', 'wolf', 'scorpion', 'clockwork', 'slime', 'elite', 'frog', 'beetle']);
const ENEMY_CAST_OWNERS = new WeakMap();
function playerSwingMove(p) {
  if (!(p.swing > 0)) return 1;
  return p.wpn.ranged ? (p.wpn.heavy ? .4 : .55) : p.wpn.heavy ? MELEE_COMBAT.heavyMove : MELEE_COMBAT.lightMove;
}
function enemyCombatWindow(e) { return (e.broken || 0) > 0 || (e.restT || 0) > 0; }
function clearEnemyContact(e) { e.contactT = 0; e.contactStrike = 0; }
function enemyTouching(e, p) {
  return Math.abs(p.x - e.x) < e.hw + p.hw && Math.abs(p.y - 4 - (e.y - e.hh)) < e.hh + p.hh + (e.fly ? 6 : 0);
}
function enemyContactInReach(e) {
  if (!coopRuntimeIsActive()) return enemyTouching(e, G.player);
  for (const actor of COOP_RUNTIME.actors.values()) {
    const p = actor.context.player;
    if (actor.connected && !actor.downed && p && p.hp > 0 && enemyTouching(e, p)) return true;
  }
  return false;
}
function enemyContactLive(e) {
  const D = EDEF[e.kind];
  if (D.harmless || e.noContact || e.kind === 'dummy' || e.hp <= 0 || e.spawn > 0 || e.hidden ||
      e.frozen > 0 || e.meleeStagger > 0 || e.controlHeld || e.z >= 4 || enemyCombatWindow(e)) return false;
  if (e.link) return enemyContactLive(e.link);
  return D.boss || (ENEMY_CHARGERS.has(e.kind) && e.state === 1) || e.contactStrike > 0;
}
function enemyContactDamage(e, p = G.player) {
  if (!enemyContactLive(e) || !enemyTouching(e, p)) return;
  const D = EDEF[e.kind], before = p.inv;
  // Linked boss parts inherit their owner's contact state and the player's normal invulnerability.
  const ordinary = !D.boss && !e.link && !(ENEMY_CHARGERS.has(e.kind) && e.state === 1), actor = coopRuntimeIsActive() ? coopActorId() : 'solo';
  if (ordinary && e.contactHits?.has(actor)) return;
  hurtPlayer(D.boss || (G.corrupt || 0) >= 100 ? 2 : 1, e.x, e.y);
  if (ordinary && p.inv > before) (e.contactHits || (e.contactHits = new Set())).add(actor);
  if (p.inv > before && D.onTouch) D.onTouch(e, p);
  if (p.inv > before && (e.kind === 'bat' || e.kind === 'firebat')) { e.state = 1; e.t = .6; }
}
function updEnemyContact(e, dt) {
  e.contactCd = Math.max(0, (e.contactCd || 0) - dt);
  e.contactStrike = Math.max(0, (e.contactStrike || 0) - dt);
  const D = EDEF[e.kind];
  if (D.boss || D.harmless || e.kind === 'dummy' || e.link || e.hidden || e.z > 0 ||
      e.skillT > 0 || e.skillReady || e.meleeStagger > 0 || e.frozen > 0 || (e.state !== 0 && e.kind !== 'bat' && e.kind !== 'firebat')) {
    clearEnemyContact(e); return false;
  }
  if (e.contactT > 0) {
    e.contactT = Math.max(0, e.contactT - dt);
    if (e.contactT <= 1e-9) { e.contactT = 0; e.contactStrike = MELEE_COMBAT.strike; e.contactCd = MELEE_COMBAT.contactRecovery; e.contactHits = new Set(); }
    return true;
  }
  if (e.contactStrike > 0) return true;
  if (e.contactCd <= 0 && enemyContactInReach(e)) { e.contactT = MELEE_COMBAT.windup; return true; }
  return false;
}
// Each AI activates its beam only on firing frames; all actors share that exact damage profile.
function enemyBeamAttack(e, width, fire = false, slow = 0) {
  Object.assign(e.beam, { active: true, width, fireDamage: fire, slow });
  enemyBeamDamage(e);
}
function enemyBeamHits(e, p = G.player) {
  const B = e.beam;
  return !!(B && B.active && beamHits(e.x, e.y - 12, B.a, ROOM_BEAM_RANGE, B.width, p));
}
function enemyBeamDamage(e, p = G.player) {
  if (!enemyBeamHits(e, p)) return;
  hurtPlayer(1, e.x, e.y, e.beam.fireDamage);
  if (e.beam.slow > 0) p.slow = Math.max(p.slow, e.beam.slow);
}
function enemySkillWindup(e, dt, ang, distance) {
  if (!ENEMY_SKILL_WINDUPS.has(e.kind) || e.state !== 0 || e.t > 0 || e.contactT > 0 || e.contactStrike > 0) return false;
  if ((e.kind === 'drowned' && distance >= 130) || (e.kind === 'chaosImp' && distance >= 140)) return false;
  if (e.skillT > 0) {
    e.skillT = Math.max(0, e.skillT - dt);
    if (e.skillT <= 1e-9) { e.skillT = 0; e.skillReady = true; return false; }
  } else { e.skillT = MELEE_COMBAT.windup; e.skillAng = ang; }
  return true;
}
// Deferred casts retain their source without putting entity references into packets.
function enemyCombatCall(e, fn) {
  const warns = G.warns.length, later = G.later.length;
  try { return fn(); } finally {
    for (const cast of G.warns.slice(warns).concat(G.later.slice(later))) {
      if (ENEMY_CAST_OWNERS.has(cast)) continue;
      ENEMY_CAST_OWNERS.set(cast, e);
      const original = cast.fn;
      cast.fn = (...args) => enemyCombatCall(e, () => original(...args));
    }
  }
}
function bossRecoveryBoundary(e) {
  if (!e.bossCycleStarted) { e.bossCycleStarted = true; return false; }
  if (e.restActive) { e.restActive = false; return false; }
  if (G.warns.concat(G.later).some(c => c.t > 0 && ENEMY_CAST_OWNERS.get(c) === e)) {
    e.restPending = true; return true;
  }
  e.restPending = false; e.restActive = true; e.restT = MELEE_COMBAT.bossRecovery;
  e.z = 0; e.air = false; e.kbx = e.kby = 0;
  for (const key of ['beam', 'tongue', 'hand', 'gust', 'hole', 'gates']) e[key] = null;
  if (e.kind === 'mirrorKnight') { e.immune = false; e.reflect = false; }
  clearEnemyContact(e); return true;
}
function updEnemyMeleeTimers(e, dt) {
  // Minions use restT only for enemyPunish recovery windows (enemy-attacks.js); bosses add posture below.
  if (e.armor && (e.armor.t -= dt) <= 0) e.armor = null;
  if (!EDEF[e.kind].boss) { if (e.restT > 0) e.restT = Math.max(0, e.restT - dt); return; }
  const broken = e.broken > 0;
  e.broken = Math.max(0, (e.broken || 0) - dt);
  e.restT = Math.max(0, (e.restT || 0) - dt);
  if (!broken) e.breakResist = Math.max(0, (e.breakResist || 0) - dt);
  e.postureHold = Math.max(0, (e.postureHold || 0) - dt);
  if (!(e.postureHold > 0)) e.posture = Math.max(0, (e.posture || 0) - MELEE_COMBAT.postureDecay * dt);
  // Phase changes outrank punish windows; the final boss retains phase immunity.
  if (e.kind === 'voidGod' && (e.hp > e.max * .66 ? 1 : e.hp > e.max * .33 ? 2 : 3) !== (e.phase || 1)) {
    e.broken = e.restT = 0; e.restActive = e.restPending = false; e.posture = 0;
  }
}
// Called only after real HP damage passes the attack/part/return-leg budgets.
// Separate hits in one attack each contribute their actual share; no flat per-hit award or hit-rate cap.
function bossPostureMax(e) { return Math.max(1, Math.ceil(e.max * MELEE_COMBAT.postureHpRatio)); }
function tryBossPosture(e, damage, o) {
  if (!EDEF[e.kind].boss || e.hp <= 0 || e.hidden || e.immune || e.air || e.z > 0 ||
      enemyCombatWindow(e) || e.breakResist > 0 || o.fromMinion || o.shot?.minion) return;
  const scale = o.melee ? MELEE_COMBAT.meleePostureScale
    : o.ranged || (o.shot?.friendly && o.shot.main) ? MELEE_COMBAT.rangedPostureScale : 0;
  if (!(scale > 0 && damage > 0)) return;
  e.postureHold = MELEE_COMBAT.postureDecayDelay;
  const max = bossPostureMax(e);
  e.posture = Math.min(max, (e.posture || 0) + damage * scale);
  if (e.posture >= max) {
    e.posture = 0; e.broken = MELEE_COMBAT.breakDuration; e.breakResist = MELEE_COMBAT.breakRecovery;
    e.kbx = e.kby = 0; clearEnemyContact(e);
    addFloat(e.x, e.y - e.h - 8, '破势!', '#ffd080', true); ring(e.x, e.y - 3, e.hw + 16, [255, 208, 128], .3); SFX.block();
  }
}
function tryMeleeImpact(e, heavy) {
  const D = EDEF[e.kind];
  if (D.boss || e.hp <= 0 || e.hidden || e.immune || e.air || e.z > 0 || D.harmless || e.kind === 'dummy') return;
  // Committed elite combos resist incidental flinches; freeze and armour breaks still interrupt.
  if (e.encounter?.type === 'elite' || e.frozen > 0 || e.meleeStagger > 0 || e.freezeResist > 0) return;
  e.meleeStagger = D.elite || D.heavy ? MELEE_COMBAT.eliteStagger : heavy ? MELEE_COMBAT.heavyStagger : MELEE_COMBAT.stagger;
  e.freezeResist = MELEE_COMBAT.controlRecovery; cancelTrackedWarn(e);
  clearEnemyContact(e); e.contactCd = Math.max(e.contactCd || 0, .25);
}
function drawEnemyCombatTell(e, time, height = e.h) {
  if (e.hidden || e.spawn > 0) return;
  const tell = Math.max(e.contactT || 0, e.skillT || 0, ENEMY_CHARGERS.has(e.kind) && e.state === 2 ? e.t : 0);
  if (tell > 0) {
    const r = e.hw + 5, k = clamp(1 - tell / MELEE_COMBAT.windup);
    g.save(); g.strokeStyle = '#ff8058'; g.lineWidth = 1; g.globalAlpha = .65 + .35 * k;
    g.beginPath(); g.ellipse(e.x, e.y - 2, r, r * .55, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
    const top = e.y - Math.max(height, 14) - 8;
    px(e.x - 1, top, 2, 4, '#ffd080'); px(e.x - 1, top + 6, 2, 1, '#ffd080'); g.restore();
  }
  if (e.armor) {                                    // armoured cast: steel-blue shell, pips = armour left (break with a full charge)
    const r = e.hw + 7, A = e.armor;
    g.save(); g.globalAlpha = .75 + .25 * Math.sin(time * 16); g.strokeStyle = '#c8d8ff'; g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(e.x, e.y - Math.max(height, 14) / 2, r, Math.max(height, 14) / 2 + 4, 0, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < (A.max || 0); i++) px(e.x - A.max * 2 + i * 4, e.y - Math.max(height, 14) - 12, 3, 2, i < A.hp ? '#e8f0ff' : '#4a5468');
    g.restore();
  }
  if (enemyCombatWindow(e)) {
    g.save(); g.globalAlpha = .7; ellipse(e.x, e.y - 2, e.hw + 5, (e.hw + 5) * .5, e.broken > 0 ? '#ffd080' : '#82e6be', time * 2); g.restore();
  }
}
