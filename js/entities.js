'use strict';
// ============================================================ effects
function burst(x, y, n, cols, o = {}) {
  const { sp = 60, life = 0.5, grav = 0, size = 1, add = true, up = false, spread = Math.PI * 2, ang = 0 } = o;
  for (let i = 0; i < n; i++) {
    const a = up ? -Math.PI / 2 + rnd(-1.4, 1.4) : ang + rnd(-spread / 2, spread / 2), s = sp * rnd(0.3, 1);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rnd(0.5, 1), max: life, col: pick(cols),
      size, grav, add });
  }
}
function addFloat(x, y, text, col, big = false, fx = {}) { G.floats.push({ x, y, text, col, life: 0.8, big, ...fx }); }
let damageFloatId = 0;
function damageFloatMeta(e, amount, source = typeof coopActorId === 'function' ? coopActorId() : null) {
  return { damageTarget: e.nid ? 'e' + e.nid : (e.floatId || (e.floatId = 'f' + ++damageFloatId)),
    damageSource: source, born: G.time, amount };
}
function shake(n) { G.shake = Math.max(G.shake, n); }
function ring(x, y, max, col, life = 0.3) { G.rings.push({ x, y, max, col, life, t: 0 }); }
// ambient particles spawned from draw functions: scale the per-frame chance (tuned at 60fps) by the simulated time
// of this frame, so they don't depend on refresh rate and don't pile up while paused (updParts not running)
const spawnP = p => rand() < p * G.simDt * 60;
function updParts(dt) {
  G.simDt = dt;
  for (const q of G.parts) { q.life -= dt; q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; }
  G.parts = G.parts.filter(q => q.life > 0);
  for (const f of G.floats) { f.life -= dt; f.y -= 22 * dt; }
  G.floats = G.floats.filter(f => f.life > 0);
  for (const r of G.rings) r.t += dt;
  G.rings = G.rings.filter(r => r.t < r.life);
  for (const b of G.bolts) b.life -= dt;
  G.bolts = G.bolts.filter(b => b.life > 0);
}

// ============================================================ player (stats come from recalcStats in items.js)
function newPlayer(x, y) {
  return { x, y, hw: 4, hh: 4, h: 14, face: 0, atkT: 0, rollAttackT: 0, swing: 0, swingT: 0.15, swingAng: 0, rollT: 0, rolling: 0, rdx: 1,
    rdy: 0, inv: 0, nextCrit: false, walk: 0, moving: false, kbx: 0, kby: 0, kills: 0, shieldUp: false, orbA: 0, slow: 0, stun: 0, tox: 0, toxT: 0,
    orbHit: new Map(), alt: 1,
    // healBonus at most doubles one heal
    heal(n) { n += Math.min(this.healBonus || 0, n); const b = this.hp; this.hp = Math.min(this.maxHp, Math.round((this.hp + n) * 1000) / 1000);
      const healed = Math.round((this.hp - b) * 1000) / 1000, overflow = Math.max(0, Math.round((n - healed) * 1000) / 1000);
      if (healed > 0) { addFloat(this.x, this.y - 18, '+' + formatHearts(healed) + '♥', '#ff8aa0'); SFX.heal(); }
      classHook('heal', healed, overflow); } };          // (healed, overflow) -> cleric shields / smite
}
// Fixed recovery after the roll ends, independent of weapon speed and roll cooldown.
function updAttackRecovery(p, dt) {
  const remaining = (p.rollAttackT || 0) - dt;
  p.rollAttackT = p.rolling > 0 ? 0.5 : remaining > 1e-9 ? remaining : 0;
}
function playerAttackRecovered(p) { return p.rolling <= 0 && !(p.rollAttackT > 0); }
// Shared with guest prediction: pose/cooldown only, without damage, procs or RNG.
function playerAttackPose(p, speed = 1) {
  p.atkT = p.atkCd / speed; p.swing = p.wpn.swingT; p.swingT = p.wpn.swingT;
  p.alt = -p.alt; p.swingAng = p.face;
}
// Preserve the old 60Hz displacement while integrating the decay independently of render FPS.
function playerKnockbackStep(p, dt, decay = .82) {
  const k = Math.pow(decay, dt * 60), t = (1 - k) / (1 - decay) / 60;
  const offset = { x: (p.kbx || 0) * t, y: (p.kby || 0) * t };
  p.kbx = (p.kbx || 0) * k; p.kby = (p.kby || 0) * k;
  return offset;
}
function updPlayer(dt, controls = true) {
  const p = G.player, mv = controls ? moveVec() : { x: 0, y: 0 };
  p.atkT -= dt; p.rollT -= dt; p.inv -= dt; p.swing -= dt; p.slow -= dt;
  updAttackRecovery(p, dt);
  updOrbit(dt);
  if (p.slow > 0 && spawnP(0.25)) G.parts.push({ x: p.x + rnd(-4, 4), y: p.y - rnd(2, 12), vx: 0, vy: rnd(-8, -2), life: 0.5, max: 0.5, col: '#c8f0ff', size: 1, grav: 0, add: true });
  // poisoned (swamp water, spore clouds, toxic spit): lose half a heart every 1.6 s; poison never takes the last half heart
  if (p.tox > 0) { p.tox -= dt; p.toxT += dt;
    if (spawnP(0.3)) G.parts.push({ x: p.x + rnd(-4, 4), y: p.y - rnd(2, 12), vx: 0, vy: rnd(-14, -4), life: 0.4, max: 0.4, col: '#7adc5a', size: 1, grav: 0, add: true });
    if (p.toxT >= 1.6) { p.toxT = 0; if (p.hp > 1 && (G.mode === 'play' || !controls)) { p.hp = Math.max(1, Math.round((p.hp - 1) * 1000) / 1000); G.hurtFlash = Math.max(G.hurtFlash, 0.1); addFloat(p.x, p.y - 20, '中毒', '#7adc5a'); SFX.puff(); } } }
  else p.toxT = 0;
  if (p.stun > 0) { cancelPlayerCharge(p); p.stun -= dt; p.moving = false; playerKnockbackStep(p, dt, .8); return; }      // frozen solid / stunned
  if (p.rolling > 0) {
    cancelPlayerCharge(p);
    const rk = mechCall('rollMul', p) || 1;                                  // ice: rolls go twice as far
    p.rolling -= dt; moveBox(p, p.rdx * 205 * rk * dt, p.rdy * 205 * rk * dt, 'player'); if (G.room.stall) pushOut(p, G.room.stall);
    if (rand() < 0.5) G.parts.push({ x: p.x + rnd(-3, 3), y: p.y, vx: rnd(-10, 10), vy: rnd(-12, -4), life: 0.35, max: 0.35,
      col: '#8a7a80', size: 2, grav: 0, add: false });
    return;
  }
  const sp = p.speed * playerSwingMove(p) * (p.charging && p.chargeT >= COMBAT_CHARGE.tell ? .75 : 1) * (p.slow > 0 ? 0.6 : 1);
  let vx = mv.x * sp, vy = mv.y * sp;
  const mm = mechCall('move', p, dt, vx, vy); if (mm) { vx = mm.x; vy = mm.y; }        // ice / wind / quicksand ...
  const kb = playerKnockbackStep(p, dt);
  moveBox(p, vx * dt + kb.x, vy * dt + kb.y, 'player');
  if (G.room.stall) pushOut(p, G.room.stall);
  p.moving = Math.hypot(mv.x, mv.y) > 0.15;
  if (p.moving) { p.walk += dt; if (p.swing <= 0 && !Input.pointer.active) p.face = Math.atan2(mv.y, mv.x); }
  if (controls) aimAtPointer(p);
  // floor hazards (lava / spikes); knock the player back the way they came
  const hz = hazardAt(G.room, p.x, p.y - 2), bx = p.x + Math.cos(p.face) * 10, by = p.y + Math.sin(p.face) * 10;
  if (hz === 3 && !p.fireImm) hurtPlayer(1, bx, by, false, true);
  if (hz === 4 && spikesUp(G.room)) hurtPlayer(1, bx, by, false, true);
  const mt = mechTileAt(G.room, p.x, p.y - 2); if (mt && mt.def.on) mt.def.on(p, G.room, dt, mt, bx, by);
  if (controls && consume('roll') && p.rollT <= 0) {
    const d = p.moving ? norm(mv) : { x: Math.cos(p.face), y: Math.sin(p.face) };
    cancelPlayerCharge(p); p.rdx = d.x; p.rdy = d.y; p.rolling = 0.2; p.rollAttackT = 0.5; p.rollT = p.rollCd; p.inv = Math.max(p.inv, 0.28); p.rollId = (p.rollId || 0) + 1; SFX.roll();
    if (p.rollCrit) p.nextCrit = true;
    classHook('roll');
  }
  if (controls) stepPlayerCharge(p, Input.keys, Input.pressed, dt, level => attack(level));
  else cancelPlayerCharge(p);
}
function pushOut(p, b) {                                    // keep the player out of a solid rect (shop stall)
  const l = p.x - (b.x0 - p.hw), r = (b.x1 + p.hw) - p.x, t = p.y - b.y0, d = b.y1 - p.y;
  if (l <= 0 || r <= 0 || t <= 0 || d <= 0) return;
  const m = Math.min(l, r, t, d);
  if (m === l) p.x -= l; else if (m === r) p.x += r; else if (m === t) p.y -= t; else p.y += d;
}
function playerDmg() {
  const p = G.player; let d = p.dmg;
  if (p.berserk) d *= 1 + p.berserk * clamp(1 - p.hp / p.maxHp);
  return d;
}
function nearestEnemy(x, y, maxD, skip) {
  let best = null, bd = maxD;
  for (const e of G.enemies) { if (e.spawn > 0 || e.hp <= 0 || e.hidden || e.coreShield || (skip && skip.has(e))) continue;
    const d = dist(x, y, e.x, e.y - e.h / 2); if (d < bd) { bd = d; best = e; } }
  return best;
}
const WSFX = {};                                             // per weapon-kind attack sound, filled by classes.js
// Runtime-only source state. A volley shares its inspiration budget; every
// projectile keeps its own body-hit budget. Weak keys expire with the attack.
let combatAttackId = 0;
const COMBAT_ATTACK_STATE = new WeakMap();
function newCombatAttack() { return { id: ++combatAttackId }; }
function combatAttackState(source) {
  let state = COMBAT_ATTACK_STATE.get(source);
  if (!state) { state = { inspirationPaid: false, links: new WeakMap() }; COMBAT_ATTACK_STATE.set(source, state); }
  return state;
}
// Keep outbound records intact; a returning flywheel gets one separate, bounded pass.
function shotHitState(s) {
  const state = combatAttackState(s);
  if (s.kind !== 'chakram' || !s.chak?.back) return state;
  return state.returnPhase || (state.returnPhase = { links: new WeakMap() });
}
function attack(level = 0) {
  if (!playerAttackRecovered(G.player)) return;
  const p = G.player, w = p.wpn, py = p.y - 6, attackCtx = newCombatAttack();
  const move = weaponMove(p, level); p.attackShape = move.shape; p.attackLevel = level;
  const speed = classHook('atkSpd') || 1;
  aimAtPointer(p);
  const attackAngle = p.face;
  playerAttackPose(p, speed);
  setPlayerAttackVisual(p, level);
  if (level) SFX.chargeRelease(p.wpn.ranged);
  const crit = p.nextCrit || rand() < p.crit; p.nextCrit = false;
  const dmg = playerDmg() * w.mul * (crit ? p.critMul : 1) * move.damage;
  if (level || w.kind === 'orb' || w.kind === 'chakram') { const budget = combatAttackState(attackCtx); budget.damageCap = Math.max(1, Math.round(dmg)); budget.damagePaid = new WeakMap(); budget.procPaid = new WeakSet(); }
  classHook('attack', dmg, crit, attackCtx);
  if (weaponSpecialAttack(p, move, dmg, crit, attackCtx)) { /* shared post-attack procs below */ }
  else if (w.ranged) {
    (WSFX[w.kind] || (w.kind === 'bow' ? SFX.bow : SFX.magic))();
    const n = move.count || p.multi || 1, share = n > 1 ? (1 + MULTI_SHARE * (n - 1)) / n : 1;
    for (let i = 0; i < n; i++) {
      const a = p.face + (i - (n - 1) / 2) * (move.spread || 0.16);
      G.shots.push({ x: p.x + Math.cos(a) * 6, y: py + Math.sin(a) * 6, vx: Math.cos(a) * w.speed * move.speed, vy: Math.sin(a) * w.speed * move.speed,
        r: w.r, dmg: dmg * share, crit, kb: w.kb, friendly: true, life: w.life * (p.rangeMul || 1) * move.range, kind: w.proj, hit: new Set(), pierce: (w.pierce || 0) + p.pierce + move.pierce,
        homing: p.homing, proc: true, splash: w.splash ? w.splash * p.splashMul : 0, main: true, attackCtx, gfx: p.gfx || 0, motion: move.motion, motionT: 0, phase: 0, baseA: a, baseSpeed: w.speed * move.speed, attackLevel: level });   // gfx: visual grade only (gear-fx.js)
    }
  } else {
    w.heavy ? SFX.heavy() : SFX.swing();
    const strike = () => {
      const source = { ...p, face: attackAngle };
      let hit = false;
      const reach = p.reach * p.scale * move.range;
      for (const e of G.enemies) {
        if (e.spawn > 0 || e.air || e.hidden) continue;
        if (weaponInShape(source, e, move)) {
          weaponMeleeHit(source, e, move, dmg, crit, attackCtx); hit = true;
        }
      }
      mechCall('melee', p.x, p.y - 6, reach, attackAngle, move.arc);                     // e.g. shatter crystal pillars
      if (w.quake) { ring(p.x, p.y - 3, reach + 4, [230, 210, 170], 0.25); shake(2);
        burst(p.x, p.y, 14, ['#8a8098', '#c8bea8'], { sp: 70, life: 0.35 }); }
      if (hit) G.hitstop = crit ? 0.08 : w.heavy ? 0.07 : 0.045;
    };
    if (level) queueChargedAction(p, .07, strike); else strike();
  }
  // 剑气是每击固定附伤：没有冷却的话攻速快的武器会拿到成倍收益（见 items.js 的 attackProc）
  if (p.wave > 0 && attackProc('wave', 0.3)) for (let i = 0; i < p.wave; i++) {
    const a = p.face + (i - (p.wave - 1) / 2) * 0.22;
    G.shots.push({ x: p.x + Math.cos(a) * 8, y: py + Math.sin(a) * 8, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, r: 5,
      dmg: Math.max(1, playerDmg() * 0.6), friendly: true, life: 0.55, kind: 'wave', hit: new Set(), pierce: 99, attackCtx });
  }
}
// orbiting blades: per-enemy hit cooldown so they tick instead of melting
function updOrbit(dt) {
  const p = G.player; if (!p.orbitN) return;
  const attackCtx = newCombatAttack();
  p.orbA += dt * 4.2;
  for (const [e, t] of p.orbHit) { if (t - dt <= 0) p.orbHit.delete(e); else p.orbHit.set(e, t - dt); }
  for (let i = 0; i < p.orbitN; i++) {
    const a = p.orbA + i * Math.PI * 2 / p.orbitN, ox = p.x + Math.cos(a) * 18, oy = p.y - 6 + Math.sin(a) * 12;
    for (const e of G.enemies) if (e.spawn <= 0 && !p.orbHit.has(e) && dist(ox, oy, e.x, e.y - e.h / 2) < e.hw + 4) {
      p.orbHit.set(e, 0.4); damageEnemy(e, Math.max(1, playerDmg() * 0.5), false, e.x - p.x, e.y - p.y, { kb: 60, attackCtx });
    }
  }
}
// healing from skills (gear procs, regen, set and talent heals): one shared HEAL_CD so stacked sources cannot chain-heal.
// Returns false (and heals nothing) while the cooldown runs; a heal at full HP still counts (cleric overheal shield).
function procHeal(p, n = 1) {
  const cs = G.cls || (G.cls = {});
  if (G.time < (cs.healT || 0)) return false;
  cs.healT = G.time + HEAL_CD; p.heal(n); return true;
}
const formatHearts = n => String(Math.round(n * 500) / 1000);
function playerHitDamage(n, p = G.player, environment = false) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  const scale = environment ? 1 : (1 + clamp((G.act || 1) - 1, 0, 5) * CONFIG.enemyDamagePerAct)
    * (1 + clamp(G.diff || 0, 0, 2) * CONFIG.enemyDamagePerDifficulty);
  const raw = n * scale, defense = Number.isFinite(p.defense) ? clamp(p.defense, 0, GEAR_CAPS.defense) : 0;
  const reduced = Math.min(defense * CONFIG.defensePointValue, raw * CONFIG.defenseMaxReduction);
  // Same precision as co-op HP snapshots; repeated small hits must not leave floating-point ghost HP.
  return Math.max(0.001, Math.round((raw - reduced) * 1000) / 1000);
}
function hurtPlayer(n, sx, sy, fire = false, environment = false) {
  const p = G.player;
  if (p.inv > 0 || p.rolling > 0 || G.mode !== 'play') return;
  if (fire && p.fireImm) return;
  n = playerHitDamage(n, p, environment);
  if (!n) return;
  // shields (room shield, cleric holy shield) share SHIELD_CD; block chance has its own short GUARD_CD window
  const cs = G.cls || (G.cls = {}), shield = G.time >= (cs.shieldHitT || 0), guard = G.time >= (cs.guardT || 0);
  if (shield && p.shieldUp) { p.shieldUp = false; p.inv = 0.6; cs.shieldHitT = G.time + SHIELD_CD; SFX.block(); ring(p.x, p.y - 7, 16, [255, 230, 140], 0.3);
    addFloat(p.x, p.y - 20, '圣盾', '#ffe080'); classHook('guard'); return; }
  if (guard && rand() < p.block) { p.inv = 0.5; cs.guardT = G.time + GUARD_CD; SFX.block(); addFloat(p.x, p.y - 20, '格挡', '#c8d8ff'); ring(p.x, p.y - 7, 12, [200, 220, 255], 0.2); classHook('guard'); return; }
  if (shield && G.holyShield > 0) { G.holyShield--; p.inv = 0.6; cs.shieldHitT = G.time + SHIELD_CD; classHook('shieldBreak'); classHook('guard'); return; }      // cleric overheal shield
  p.hp = Math.max(0, Math.round((p.hp - n) * 1000) / 1000); p.inv = 1.0; SFX.hurt(); shake(5); G.hitstop = 0.08; G.hurtFlash = 0.25;
  addFloat(p.x, p.y - 20, '-' + formatHearts(n) + '♥', '#ff8a9a');
  classHook('hurt', n);
  const d = norm({ x: p.x - sx, y: p.y - sy }); p.kbx = d.x * 160; p.kby = d.y * 160;
  burst(p.x, p.y - 7, 10, ['#ff4058', '#ff9aa8'], { sp: 70, life: 0.4 });
  if (p.thorns) {
    const attackCtx = newCombatAttack();
    burst(p.x, p.y - 6, 18, ['#8af070', '#d0ffb0'], { sp: 110, life: 0.35 });
    for (const e of G.enemies) if (e.spawn <= 0 && dist(p.x, p.y, e.x, e.y) < 44) damageEnemy(e, p.thorns, false, e.x - p.x, e.y - p.y, { attackCtx });
  }
  if (p.hp <= 0) {
    if (p.revive > 0) {
      const i = G.eq.trinkets.findIndex(t => t.id === 'phoenix');       // the phoenix feather burns first, then the talent
      if (i >= 0) { G.eq.trinkets.splice(i, 1); G.phoenixUsed = true; } else G.undyingUsed = true;
      recalcStats(); p.hp = p.maxHp; p.inv = 2; SFX.open(); shake(8);
      burst(p.x, p.y - 8, 60, i >= 0 ? ['#ff8a30', '#ffd060', '#fff0a0'] : ['#82e68c', '#d0ffb0', '#ffffff'], { sp: 140, life: 0.9 });
      addFloat(p.x, p.y - 22, i >= 0 ? '浴火重生!' : '不灭意志!', i >= 0 ? '#ffb040' : '#82e68c', true);
    } else gameOver(false);
  }
}
// ============================================================ enemies
const anim2 = (arr, k) => e => arr[e.moving ? Math.floor(e.anim * k) % 2 : 0];
const EDEF = {
  slime: { hp: 6, hw: 5, hh: 4, h: 9, spr: () => SPR.slime, gold: [1, 2], col: ['#5ccc5a', '#2f8a3c', '#d8ffd0'] },
  bat: { hp: 3, hw: 4, hh: 3, h: 6, fly: true, spr: e => SPR.bat[Math.floor(e.anim * 9) % 2], gold: [1, 1], col: ['#7a4a9a', '#ff4050'] },
  skel: { hp: 8, hw: 4, hh: 4, h: 14, spr: anim2(SPR.skel, 5), gold: [2, 3], col: ['#ddd6c0', '#8a8070'] },
  elite: { hp: 30, hw: 7, hh: 5, h: 11, spr: () => SPR.slimeBig, gold: [6, 9], col: ['#b45ae0', '#7a2fa8', '#f4d8ff'], elite: true, name: '巨型软泥' },
  shroom: { hp: 9, hw: 5, hh: 4, h: 10, spr: () => SPR.shroom, gold: [2, 3], col: ['#b04ad0', '#f0e0f8', '#e8d8b8'] },
  spider: { hp: 5, hw: 5, hh: 3, h: 8, spr: e => SPR.spider[Math.floor(e.anim * (e.state === 1 ? 14 : 6)) % 2], gold: [1, 2], col: ['#4a5a3a', '#ff4050'] },
  queen: { hp: 40, hw: 6, hh: 4, h: 8, spr: e => SPR.queen[Math.floor(e.anim * 8) % 2], gold: [7, 10], col: ['#6a2a8a', '#ffd040'], elite: true, scale: 1.7, name: '蛛后' },
  imp: { hp: 7, hw: 4, hh: 4, h: 11, spr: anim2(SPR.imp, 7), gold: [2, 3], col: ['#d0402a', '#ffe060'] },
  golem: { hp: 20, hw: 6, hh: 5, h: 13, spr: anim2(SPR.golem, 3), gold: [3, 5], col: ['#5a4a48', '#ff6020', '#ffb020'], heavy: true },
  firebat: { hp: 4, hw: 4, hh: 3, h: 6, fly: true, spr: e => SPR.firebat[Math.floor(e.anim * 10) % 2], gold: [1, 2], col: ['#d0602a', '#ffe060'] },
  colossus: { hp: 55, hw: 8, hh: 6, h: 13, spr: anim2(SPR.colossus, 3), gold: [9, 12], col: ['#3a2a2a', '#ff8a20', '#ffe060'], elite: true, heavy: true, scale: 1.4, name: '熔岩巨像' },
  boss: { hp: 150, hw: 9, hh: 6, h: 21, spr: () => SPR.boss, gold: [0, 0], col: ['#5e2c80', '#ecba40', '#e4dcc4'], boss: true, name: '骷髅王' },
  treant: { hp: 260, hw: 9, hh: 6, h: 22, spr: () => SPR.treant, gold: [0, 0], col: ['#4a9a3a', '#6a4a2a', '#ffe060'], boss: true, name: '腐化古树' },
  demon: { hp: 400, hw: 10, hh: 6, h: 22, spr: () => SPR.demon, gold: [0, 0], col: ['#a8281e', '#ff7020', '#ffe060'], boss: true, name: '炎魔领主' },
};
function spawnEnemy(kind, x, y, delay = 0.6) {
  const d = EDEF[kind], gf = G.gfloor || 1, a = (G.act || 1) - 1, town = G.room && G.room.type === 'town';
  // hp = base x depth-in-run x act x difficulty (the training dummy in town is exempt)
  const depth = d.boss ? 1 : 1 + (gf - 1) * (d.elite ? CONFIG.eliteHpPerFloor : CONFIG.enemyHpPerFloor);
  const hpMul = town ? 1 : depth * (1 + a * (d.boss ? CONFIG.bossHpPerAct : CONFIG.enemyHpPerAct)) * curDiff().hp;
  const sc = d.scale || 1;
  const e = { kind, x, y, hw: Math.round(d.hw * sc), hh: Math.round(d.hh * sc), h: Math.round(d.h * sc), sc, fly: !!d.fly,
    hp: Math.round(d.hp * hpMul), spawn: delay, flash: 0, anim: rnd(0, 3), t: rnd(0.3, 1.2), state: 0, vx: 0, vy: 0, z: 0,
    kbx: 0, kby: 0, moving: false, phase: 0, pat: 0, burn: 0, poison: 0, pstack: 0, frozen: 0, freezeResist: 0, dotT: 0 };
  e.max = e.hp; G.enemies.push(e); return e;
}
const PROC_COL = { burn: '#ff8a30', freeze: '#8ae0ff', poison: '#6adc5a' };
function damageEnemy(e, n, crit, dx, dy, o = {}) {
  if (e.hp <= 0 || e.hidden || e.dead) return;             // burrowed / already-dead enemies cannot be hit at all
  const attackCtx = o.attackCtx || (o.shot && (o.shot.attackCtx || (o.shot.attackCtx = newCombatAttack()))) || newCombatAttack();
  o = { ...o, attackCtx };
  const budget = combatAttackState(attackCtx);

  if (bossMechanicBeforeHit(e, n, crit, dx, dy, o, budget)) return;

  // Linked body parts (sandworm segments) pass damage on to their owner. While the worm surfaces several
  // segments overlap, so a single swing used to hit them all and multiply its damage (14 -> 77). Each
  // attack now has a transfer budget, so the weak point still rewards piercing hits without stacking.
  if (e.link) {
    e.flash = 0.1;
    const head = e.link, mul = e.linkMul || 1;
    if (head.hp > 0) {
      const links = (o.shot ? shotHitState(o.shot) : budget).links, paid = links.get(head) || 0;
      if (paid < (CONFIG.linkMaxSegs || 2)) {
        links.set(head, paid + 1);
        damageEnemy(head, n * mul, crit, dx, dy, { ...o, kb: 0 });
      }
    }
    return;
  }
  const p = G.player, D = EDEF[e.kind];
  if (e.immune) { if (!o.quiet && (e.immT || 0) <= G.time) { e.immT = G.time + 0.4; addFloat(e.x, e.y - e.h - 2, '免疫', '#a8d8ff'); SFX.block(); if (D.onBlocked) D.onBlocked(e); } return; }
  if (o.melee && D.boss && enemyCombatWindow(e)) n *= e.broken > 0 ? 1.2 : 1.1;
  n = Math.max(1, Math.round(n));
  let legPaid;
  if (o.shot?.friendly && o.shot.kind === 'chakram') {
    const legs = budget.flywheelLegs || (budget.flywheelLegs = [new WeakMap(), new WeakMap()]);
    const back = !!o.shot.chak?.back, total = budget.damageCap || Math.max(1, Math.round(o.shot.dmg));
    legPaid = legs[back ? 1 : 0];
    const cap = back ? Math.floor(total / 2) : Math.ceil(total / 2);
    n = Math.min(n, cap - (legPaid.get(e) || 0));
    if (n <= 0) return;
  }
  if (budget.damagePaid) {
    const used = budget.damagePaid.get(e) || 0; n = Math.min(n, budget.damageCap - used);
    if (n <= 0) return;
    budget.damagePaid.set(e, used + n);
    if (o.proc && budget.procPaid.has(e)) o.proc = false;
    else if (o.proc) budget.procPaid.add(e);
  }
  if (legPaid) legPaid.set(e, (legPaid.get(e) || 0) + n);
  e.hp -= n; e.flash = 0.1;
  bossMechanicAfterHit(e);
  if (e.kind === 'dummy' && o.proc && !o.quiet) townServiceEvent('practice', { id: G.eq.weapon.id });
  const d = norm({ x: dx, y: dy }), kb = (o.kb ?? 150) * (D.boss ? 0.13 : D.elite || D.heavy ? 0.4 : 1);
  e.kbx += d.x * kb; e.kby += d.y * kb;
  if (!o.quiet) {
    addFloat(e.x + rnd(-3, 3), e.y - e.h - 2, crit ? n + '!' : '' + n, o.col || (crit ? '#ffd040' : '#ffffff'), crit, damageFloatMeta(e, n));
    burst(e.x, e.y - e.h / 2, crit ? 10 : 5, D.col, { sp: 70, life: 0.3, ang: Math.atan2(d.y, d.x), spread: 1.6 });
    SFX.hit(); if (crit) shake(3);
  }
  if (o.proc && e.hp > 0) applyProcs(e, n);
  if (o.proc) classHook('hit', e, n, o);
  // Armoured casts absorb ordinary flinches; a full charge (melee or charged shot) breaks them (enemy-attacks.js).
  const armorHeld = e.armor && e.hp > 0 && enemyArmorHit(e, o);
  if (!armorHeld) {
    if (D.boss) tryBossPosture(e, n, o);
    else if (o.melee) tryMeleeImpact(e, o.meleeHeavy);
  }
  encounterAfterImpact(e);
  if (e.hp <= 0) killEnemy(e, o);
}
// Every control source shares this enemy's recovery window, including another party member.
function tryFreezeEnemy(e, duration) {
  if (!e || e.hp <= 0 || e.hidden || EDEF[e.kind].boss || e.frozen > 0 || e.meleeStagger > 0 || e.freezeResist > 0) return false;
  e.frozen = Math.max(0, Math.min(duration, COMBAT_LIMITS.freezeDuration));
  if (!e.frozen) return false;
  e.freezeResist = COMBAT_LIMITS.freezeResist;
  encounterAfterImpact(e);
  addFloat(e.x, e.y - e.h - 8, '冻结', PROC_COL.freeze);
  return true;
}
// Use active simulation time: pausing cannot consume the resistance after a thaw.
function updEnemyFreeze(e, dt) {
  if (e.frozen > 0) e.frozen = Math.max(0, e.frozen - dt);
  else if (e.meleeStagger > 0) e.meleeStagger = Math.max(0, e.meleeStagger - dt);
  else e.freezeResist = Math.max(0, (e.freezeResist || 0) - dt);
}
// Status damage is captured when it is actually applied. Burn has one source; each of the three poison
// layers has its own source. A teammate's plain hit cannot change either source or its damage.
function dotStatusSource(kind) {
  const p = G.player;
  return { ownerId: null, damage: Math.max(0, p.dmg * (kind === 'burn' ? 0.35 : 0.22) * (p.dotMul || 1)) };
}
function syncEnemyDotOwner(e) {
  const sources = (e.burnDot ? [e.burnDot] : []).concat(e.poisonDots || []);
  const owners = new Set(sources.map(s => s.ownerId));
  // Retained for diagnostics/old saves only. Ticks use the individual status records below.
  e.dotOwnerId = owners.size === 1 ? sources[0].ownerId : null;
}
function normalizeEnemyDots(e) {
  // Old fixtures/snapshots can contain just timers and pstack. Normalize once, rather than recalculate
  // their damage against whichever actor is nearest on every subsequent tick.
  const legacyOwner = e.dotOwnerId;
  if (!(e.burn > 0)) e.burnDot = null;
  else if (!e.burnDot) e.burnDot = dotStatusSource('burn', legacyOwner);
  if (!(e.poison > 0) || !(e.pstack > 0)) e.poisonDots = [];
  else {
    const count = Math.min(3, Math.max(0, Math.floor(e.pstack)));
    if (!Array.isArray(e.poisonDots)) e.poisonDots = [];
    while (e.poisonDots.length < count) e.poisonDots.push(dotStatusSource('poison', legacyOwner));
    e.poisonDots.length = count;
  }
  e.pstack = e.poisonDots.length;
  syncEnemyDotOwner(e);
}
function applyBurnStatus(e, duration = 3) {
  if (!e || e.hp <= 0 || e.dead || e.hidden) return;
  // A linked body is one enemy: minion onHitE receives the segment after damage was sent to its head.
  // Storing a separate DOT on each segment would bypass both the head's poison cap and attack budget.
  e = e.link || e;
  if (e.hp <= 0 || e.dead || e.hidden) return;
  normalizeEnemyDots(e);
  e.burn = duration; e.burnDot = dotStatusSource('burn');
  syncEnemyDotOwner(e);
}
function applyPoisonStatus(e, duration = 4) {
  if (!e || e.hp <= 0 || e.dead || e.hidden) return;
  e = e.link || e;
  if (e.hp <= 0 || e.dead || e.hidden) return;
  normalizeEnemyDots(e);
  // A real poison application at the cap replaces only the oldest layer, not every teammate's poison.
  if (e.poisonDots.length >= 3) e.poisonDots.shift();
  e.poisonDots.push(dotStatusSource('poison'));
  e.poison = duration; e.pstack = e.poisonDots.length;
  syncEnemyDotOwner(e);
}
function damageEnemyDot(e, n, ownerId, o) { return damageEnemy(e, n, false, 0, 0, o); }
function applyProcs(e, n) {
  const p = G.player;
  // all four statuses go through gearProcChance so their combined chance (stat × procMul) stays capped
  if (p.burn && rand() < gearProcChance('burn', p)) { if (e.burn <= 0) addFloat(e.x, e.y - e.h - 8, '点燃', PROC_COL.burn); applyBurnStatus(e); }
  if (p.poison && rand() < gearProcChance('poison', p)) applyPoisonStatus(e);
  if (p.freeze && rand() < gearProcChance('freeze', p)) tryFreezeEnemy(e, 1.3);
  if (p.chain && rand() < gearProcChance('chain', p)) chainLightning(e, Math.max(1, n * 0.7), 2);
}
function chainLightning(from, n, jumps) {
  const hit = new Set([from]), attackCtx = newCombatAttack(); let cur = from;
  SFX.zap();
  for (let j = 0; j < jumps; j++) {
    const nx = nearestEnemy(cur.x, cur.y - cur.h / 2, 70, hit); if (!nx) break;
    G.bolts.push({ x0: cur.x, y0: cur.y - cur.h / 2, x1: nx.x, y1: nx.y - nx.h / 2, life: 0.18 });
    hit.add(nx); damageEnemy(nx, n, false, nx.x - cur.x, nx.y - cur.y, { kb: 40, col: '#ffe060', attackCtx }); cur = nx;
  }
}
function explodeAt(x, y, n, o = {}) {
  const attackCtx = newCombatAttack();
  SFX.boom(); shake(4); ring(x, y - 4, 30, [255, 160, 60], 0.3);
  burst(x, y - 4, 26, ['#ff8a30', '#ffd060', '#fff0c0', '#5a4a48'], { sp: 120, life: 0.45 });
  for (const e of G.enemies) if (e.spawn <= 0 && e.hp > 0 && dist(x, y, e.x, e.y) < 30) damageEnemy(e, n, false, e.x - x, e.y - y, { ...o, attackCtx, kb: 200, col: '#ffb060' });
}
// All kill-triggered area effects share a chain, including a change of effect kind.
// The context belongs to this death/damage path, never to a surviving enemy.
function reserveKillBurst(o) {
  const depth = o.explosionDepth || 0, cs = CS();
  if (depth >= COMBAT_LIMITS.explodeDepth) return null;
  const chain = o.explosionChain;
  if (chain ? chain.remaining <= 0 : G.time < (cs.explodeT || 0)) return null;
  const budget = chain || { remaining: COMBAT_LIMITS.explodeBursts };
  if (!chain) { o.explosionChain = budget; cs.explodeT = G.time + COMBAT_LIMITS.explodeCd; }
  budget.remaining--;
  return { explosionChain: budget, explosionDepth: depth + 1 };
}
function queueExplosion(e, o = {}) {
  const p = G.player, depth = o.explosionDepth || 0;
  if (!p.explode || e.noBoom || rand() >= gearProcChance('explode', p)) return;
  const child = reserveKillBurst(o); if (!child) return;
  const x = e.x, y = e.y, d = playerDmg() * 1.2 * Math.pow(COMBAT_LIMITS.explodeDecay, depth);
  G.later.push({ t: 0.05, fn: () => explodeAt(x, y, d, child) });
}
function killEnemy(e, o = {}) {
  if (e.dead) return;                       // idempotent: a chained burst or finale must not settle one death twice
  if (e.encounter) encounterCancel(e);
  if (e.kind === 'voidGod') clearVoidCores(e);
  e.dead = true;
  const p = G.player, D = EDEF[e.kind];
  if (e.kind !== 'dummy' && !e.campDeathCounted) {
    e.campDeathCounted = true; townServiceEvent('kill');
    if (D.boss) townServiceEvent('boss');
  }
  SFX.kill(); p.kills++; G.runKills++;
  burst(e.x, e.y - e.h / 2, D.boss ? 120 : 16, D.col.concat(['#ffffff']), { sp: D.boss ? 160 : 80, life: 0.6 });
  dropGold(e.x, e.y - 4, rint(D.gold[0], D.gold[1]), p.goldMul);
  dropSouls(e.x, e.y - 4, D.boss ? 20 : D.elite ? 4 : rand() < 0.25 ? 1 : 0);
  if (rand() < (D.elite ? 1 : CONFIG.heartDrop * curDiff().heart)) G.pickups.push({ kind: 'heart', x: e.x, y: e.y, hw: 3, hh: 3, vx: 0, vy: 0, z: 6, vz: 70, t: 0 });
  if (rand() < p.vamp) procHeal(p);
  const deathOptions = { ...o };
  classHook('kill', e, deathOptions);
  queueExplosion(e, deathOptions);
  if (D.onDeath) D.onDeath(e);
  mechCall('kill', e);
  if (e.kind === 'elite') for (let i = 0; i < 3; i++) spawnEnemy('slime', e.x + rnd(-10, 10), e.y + rnd(-6, 6), 0.05);
  if (e.kind === 'queen') for (let i = 0; i < 4; i++) spawnEnemy('spider', e.x + rnd(-10, 10), e.y + rnd(-6, 6), 0.05);
  if (D.boss) { shake(12); G.hitstop = 0.4; SFX.boss();
    G.shots = G.shots.filter(s => s.friendly); G.enemies.forEach(o => { if (o !== e) { o.hp = 0; o.noBoom = true; } }); }
}
function dropCoin(x, y, v = COIN_VAL) {
  const a = rnd(0, Math.PI * 2), s = rnd(20, 60);
  G.pickups.push({ kind: 'coin', x, y, hw: 2, hh: 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, z: 4, vz: rnd(60, 110), t: 0, ph: rnd(0, 4), v });
}
// gold multiplier applies to the gold amount, not the coin count, so small drops still benefit from it
// (rounding 1 coin x 1.45 used to give 1 coin). The total is split across the base number of coins.
function dropGold(x, y, coins, mul) {
  const total = Math.round(coins * COIN_VAL * mul);
  if (coins <= 0 || total <= 0) return;
  for (let i = 0; i < coins; i++) dropCoin(x, y, Math.floor(total / coins) + (i < total % coins ? 1 : 0));
}
function dropSouls(x, y, n) {
  for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), s = rnd(20, 50);
    G.pickups.push({ kind: 'soul', x, y, hw: 2, hh: 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, z: 6, vz: rnd(50, 90), t: 0, ph: rnd(0, 4) }); }
}
function enemyShot(x, y, ang, sp, kind = 'bone', o = {}) {
  const s = { x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: o.r || 3, dmg: o.dmg || 1, friendly: false, life: o.life || 3, kind, rot: 0,
    fire: kind === 'fire', acc: o.acc || 0, onHit: o.onHit || null };
  if (o.environment) s.environment = true;
  if (G.room && G.room.mirrorWalls) { s.bounce = 1; s.life *= 1.4; }        // mirror temple: every enemy shot bounces once
  G.shots.push(s); return s;
}
// delayed ground attacks: telegraph circle, then fn() fires (roots, meteors, slams)
function warn(x, y, r, t, fn, col = [255, 60, 80]) { G.warns.push({ x, y, r, t, max: t, fn, col }); }
function updWarns(dt) {
  for (const w of G.warns) { w.t -= dt; if (w.t <= 0) w.fn(w); }
  G.warns = G.warns.filter(w => w.t > 0);
  for (const l of G.later) { l.t -= dt; if (l.t <= 0) l.fn(); }
  G.later = G.later.filter(l => l.t > 0);
}
function areaHit(x, y, r, n = 1, environment = false) { const p = G.player; if (dist(p.x, p.y - 3, x, y) < r + 3) hurtPlayer(n, x, y, false, environment); }
function updDots(e, dt) {
  normalizeEnemyDots(e);
  e.burn -= dt; e.poison -= dt; if (e.poison <= 0) e.pstack = 0;
  normalizeEnemyDots(e);
  if (!e.burnDot && !e.poisonDots.length) return;
  e.dotT -= dt; if (e.dotT > 0) return;
  e.dotT = 0.5;
  if (e.burnDot) { const s = e.burnDot, n = Math.max(1, Math.round(s.damage));
    damageEnemyDot(e, n, s.ownerId, { kb: 0, col: PROC_COL.burn, quiet: true });
    addFloat(e.x + rnd(-3, 3), e.y - e.h, '' + n, PROC_COL.burn, false, damageFloatMeta(e, n, s.ownerId));
    burst(e.x, e.y - e.h / 2, 4, ['#ff8a30', '#ffd060'], { sp: 30, life: 0.3, up: true }); }
  if (e.hp > 0 && e.poisonDots.length) {
    const owners = new Map();
    for (const s of e.poisonDots) owners.set(s.ownerId, (owners.get(s.ownerId) || 0) + s.damage);
    const amounts = [...owners].map(([ownerId, damage], i) => ({ ownerId, damage, n: Math.floor(damage), i }));
    const total = Math.max(1, Math.round(amounts.reduce((sum, s) => sum + s.damage, 0)));
    let left = total - amounts.reduce((sum, s) => sum + s.n, 0);
    // Round the combined poison once, as in solo play; three owners must not each receive a minimum hit.
    const order = amounts.slice().sort((a, b) => (b.damage - b.n) - (a.damage - a.n) || a.i - b.i);
    for (let i = 0; left > 0; i++, left--) order[i % order.length].n++;
    for (const s of amounts) if (s.n > 0 && e.hp > 0) damageEnemyDot(e, s.n, s.ownerId, { kb: 0, quiet: true });
    addFloat(e.x + rnd(-3, 3), e.y - e.h, '' + total, PROC_COL.poison, false, damageFloatMeta(e, total, 'poison'));
  }
}
function updEnemies(dt) {
  for (const e of G.enemies) {
    const step = () => {
    const p = G.player;
    if (e.beam) e.beam.active = false;
    e.anim += dt; e.flash -= dt;
    if (e.spawn > 0) { e.spawn -= dt; return; }
    updDots(e, dt); if (e.hp <= 0) return;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
    let vx = 0, vy = 0;
    const frozen = e.frozen > 0 || e.meleeStagger > 0; e.controlHeld = frozen;
    updEnemyFreeze(e, dt); updEnemyMeleeTimers(e, dt);
    if (frozen) e.z = 0;
    else if (!enemyCombatWindow(e)) {
      e.t -= dt * (e.tmul || 1);
      const skill = enemySkillWindup(e, dt, ang, d), contact = updEnemyContact(e, dt);
      if (!skill && !contact) { const v = enemyCombatCall(e, () => AI[e.kind](e, dt, ang, d)); vx = v.x; vy = v.y; e.skillReady = false; }
    }
    e.moving = Math.hypot(vx, vy) > 3;
    if (e.moving) e.face = vx < 0;
    const sm = (e.bogged ? 0.6 : 1) * (e.tmul || 1);                 // map mechanics: bog water slows, time zones slow / hasten
    moveBox(e, (vx * sm + e.kbx) * dt, (vy * sm + e.kby) * dt, e.fly ? 'fly' : 'walk');
    e.kbx *= 0.85; e.kby *= 0.85;
    if (!frozen) enemyContactDamage(e, p);
    };
    if (typeof coopRuntimeIsHost === 'function' && coopRuntimeIsHost()) coopRuntimeEnemyStep(e, dt, step);
    else step();
  }
  for (let i = 0; i < G.enemies.length; i++) for (let j = i + 1; j < G.enemies.length; j++) {     // soft separation
    const a = G.enemies[i], b = G.enemies[j]; if (a.link || b.link || a.hidden || b.hidden) continue;   // worm segments are placed by their head
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.hw + b.hw;
    if (d > 0 && d < m) { const k = (m - d) / d * 0.5; moveBox(a, -dx * k, -dy * k, a.fly ? 'fly' : 'walk'); moveBox(b, dx * k, dy * k, b.fly ? 'fly' : 'walk'); }
  }
  G.enemies = G.enemies.filter(e => e.hp > 0);
}
const V = (a, s) => ({ x: Math.cos(a) * s, y: Math.sin(a) * s });
const Z0 = { x: 0, y: 0 };
const fspd = () => (1 + CONFIG.enemySpeedPerFloor * ((G.gfloor || 1) - 1)) * (G.room && G.room.type === 'town' ? 1 : curDiff().speed);   // faster deeper in / on harder difficulties
function hopper(e, dt, ang, big) {                          // slime / big slime
  const dur = big ? 0.7 : 0.5;
  if (e.state === 0 && e.t <= 0) { e.state = 1; e.t = dur; e.hx = Math.cos(ang); e.hy = Math.sin(ang); }
  else if (e.state === 1) {
    e.z = Math.sin((1 - e.t / dur) * Math.PI) * (big ? 12 : 6);
    if (e.t <= 0) { e.state = 0; e.z = 0; e.t = rnd(0.5, 1.1) / fspd();
      if (big) { shake(3); SFX.slam(); const o = rnd(0, 1);
        for (let i = 0; i < 10; i++) enemyShot(e.x, e.y - 4, o + i * Math.PI / 5, 62, 'goo');
        burst(e.x, e.y, 14, ['#b45ae0', '#f4d8ff'], { sp: 60, life: 0.4 }); } }
    return { x: e.hx * (big ? 62 : 58), y: e.hy * (big ? 62 : 58) };
  }
  return Z0;
}
function slammer(e, ang, d, big) {                          // golem / colossus: walk, telegraph, slam
  if (e.state === 0) {
    if (d < (big ? 52 : 40) && e.t <= 0) { e.state = 1; e.t = big ? 0.75 : 0.6;
      if (!big) warnShape({ shape: 'circle', x: e.x, y: e.y - 3, r: 24 }, e.t, () => {}, [255, 140, 60]); }
    return V(ang, (big ? 26 : 22) * fspd());
  }
  e.flash = Math.floor(e.t * 16) % 2 ? 0.05 : 0;
  if (e.t <= 0) {
    e.state = 0; e.t = rnd(1.4, 2) / fspd(); SFX.slam(); shake(big ? 6 : 4);
    const r = big ? 34 : 24; ring(e.x, e.y - 3, r, [255, 140, 60], 0.3); areaHit(e.x, e.y - 3, r);
    if (big) { const o = rnd(0, 1); for (let i = 0; i < 14; i++) enemyShot(e.x, e.y - 5, o + i * Math.PI * 2 / 14, 70, 'fire'); }
    else {                                                  // golem: second, outer shock ring (hug it instead of rolling away), then a breather
      warnShape({ shape: 'donut', x: e.x, y: e.y - 3, r0: 24, r1: 46 }, .45, w => { if (shapeHit(w)) shake(2); ring(w.x, w.y, w.r1, [255, 120, 40], .3); SFX.slam(); }, [255, 110, 40]);
      enemyPunish(e, .8);
    }
    burst(e.x, e.y, 22, ['#ff8a30', '#5a4a48', '#ffd060'], { sp: 90, life: 0.4 });
  }
  return Z0;
}
function lunger(e, dt, ang, d, queen) {                     // spider / queen
  if (e.state === 0) {
    if (e.t <= 0 && d < 120) { e.state = 2; e.t = MELEE_COMBAT.windup; e.hx = Math.cos(ang); e.hy = Math.sin(ang); e.flash = 0.05; }
    if (queen && (e.sum = (e.sum || 3) - dt) <= 0 && G.enemies.length < 7) { e.sum = 4;
      for (let i = 0; i < 2; i++) spawnEnemy('spider', e.x + rnd(-12, 12), e.y + rnd(-6, 6), 0.4); }
    return V(ang + Math.sin(e.anim * 3) * 1.2, 22);
  }
  if (e.state === 2) { if (e.t <= 0) { e.state = 1; e.t = queen ? 0.45 : 0.35; } return Z0; }      // tiny wind-up
  if (e.t <= 0) { e.state = 0; e.t = rnd(0.8, 1.5) / fspd();
    if (queen) { for (const k of [-0.5, -0.25, 0, 0.25, 0.5]) enemyShot(e.x, e.y - 4, ang + k, 75, 'goo'); SFX.shoot(); } }
  return { x: e.hx * (queen ? 165 : 150), y: e.hy * (queen ? 165 : 150) };
}
const AI = {
  slime: (e, dt, ang) => hopper(e, dt, ang, false),
  elite: (e, dt, ang) => hopper(e, dt, ang, true),
  bat: (e, dt, ang) => {
    if (e.state === 1) { if (e.t <= 0) e.state = 0; return V(ang, -50); }
    return V(ang + Math.sin(e.anim * 5) * 0.9, 60 * fspd());
  },
  firebat: (e, dt, ang) => {
    if (e.state === 1) { if (e.t <= 0) { e.state = 0; e.t = rnd(1.5, 2.5); } return V(ang, -55); }
    if (e.t <= 0) { e.t = rnd(1.8, 2.8); enemyShot(e.x, e.y - 6, ang, 80, 'fire'); SFX.fire(); }
    return V(ang + Math.sin(e.anim * 6) * 1.0, 70 * fspd());
  },
  skel: (e, dt, ang, d) => {
    const p = G.player, want = d > 85 ? 1 : d < 55 ? -1 : 0;
    if (e.t <= 0) { e.t = rnd(1.6, 2.4) / fspd(); e.flash = 0.06;
      enemyShot(e.x, e.y - 9, Math.atan2(p.y - 6 - (e.y - 9), p.x - e.x), 85); SFX.shoot(); }
    return { x: Math.cos(ang) * 24 * want + Math.cos(ang + Math.PI / 2) * 14 * Math.sin(e.anim), y: Math.sin(ang) * 24 * want };
  },
  shroom: (e, dt, ang) => {
    if (e.t <= 0) { e.t = rnd(2.2, 3) / fspd(); e.flash = 0.08; SFX.puff(); const o = rnd(0, 1);
      for (let i = 0; i < 8; i++) enemyShot(e.x, e.y - 5, o + i * Math.PI / 4, 48, 'spore', { life: 2.2 });
      burst(e.x, e.y - 6, 10, ['#b04ad0', '#f0e0f8'], { sp: 40, life: 0.4 }); }
    return V(ang + Math.sin(e.anim) * 0.8, 12);
  },
  imp: (e, dt, ang, d) => {
    if (e.t <= 0) {
      if (rand() < 0.35) { const s = freeSpot(G.room, 50, G.player.x, G.player.y, 'fly');
        burst(e.x, e.y - 6, 10, ['#d0402a', '#ffe060'], { sp: 50, life: 0.3 }); e.x = s.x; e.y = s.y; e.flash = 0.15; SFX.magic(); }
      else { for (const k of [-0.25, 0, 0.25]) enemyShot(e.x, e.y - 7, ang + k, 90, 'fire'); SFX.fire(); }
      e.t = rnd(1.5, 2.2) / fspd();
    }
    const want = d > 90 ? 1 : d < 60 ? -1 : 0;
    return { x: Math.cos(ang) * 30 * want + Math.cos(ang + Math.PI / 2) * 22 * Math.sin(e.anim * 1.3), y: Math.sin(ang) * 30 * want };
  },
  golem: (e, dt, ang, d) => slammer(e, ang, d, false),
  colossus: (e, dt, ang, d) => slammer(e, ang, d, true),
  spider: (e, dt, ang, d) => lunger(e, dt, ang, d, false),
  queen: (e, dt, ang, d) => lunger(e, dt, ang, d, true),
  boss: (e, dt, ang) => updSkelKing(e, dt, ang),
  treant: (e, dt, ang) => updTreant(e, dt, ang),
  demon: (e, dt, ang) => updDemon(e, dt, ang),
};
function enrage(e, sp = 1.35) {
  const enr = e.hp < e.max * (curDiff().enrage ?? CONFIG.bossEnrage);
  if (enr && !e.enraged) { e.enraged = true; shake(6); SFX.boss(); addFloat(e.x, e.y - 30, '狂暴!', '#ff4058', true); }
  return enr ? sp : 1;
}
// ---------------------------------------------------------------- boss 1: 骷髅王 (aimed rush / safe wall recovery)
function updSkelKing(e, dt, ang) {
  const sp = enrage(e), enr = sp > 1;
  if (e.kingRush) return updateKingRush(e, dt, sp);
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 5); e.sub = 0.2; e.t = [1.5, 1.6, 1.5, 1.2, 0.8][e.pat] / sp;
    if (e.pat === 3) { startKingRush(e, e.hp <= e.max * .5 ? 2 : 1, sp); return Z0; }
    if (e.pat === 4 && G.enemies.length < 4) for (let i = 0; i < (enr ? 3 : 2); i++) {
      const s = freeSpot(G.room, 30, G.player.x, G.player.y, 'fly'); spawnEnemy('bat', s.x, s.y, 0.7); }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang, 30 * sp);
  if (e.pat === 1 && e.sub <= 0) { e.sub = 0.55 / sp; const n = enr ? 16 : 12, o = e.anim * 0.7;
    for (let i = 0; i < n; i++) enemyShot(e.x, e.y - 12, o + i * Math.PI * 2 / n, 68); SFX.shoot(); }
  if (e.pat === 2 && e.sub <= 0) { e.sub = 0.42 / sp;
    for (const k of enr ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.3, 0, 0.3]) enemyShot(e.x, e.y - 12, ang + k, 105); SFX.shoot(); }
  return Z0;
}
// ---------------------------------------------------------------- boss 2: 腐化古树 (breakable root/spore nodes, vine fans)
function updTreant(e, dt, ang) {
  const sp = enrage(e, 1.3), enr = sp > 1, p = G.player;
  ensureTreantRoots(e);
  if (e.t <= 0) {
    if (bossRecoveryBoundary(e)) return Z0;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 5); e.sub = 0.15; e.t = [1.6, 2.0, 2.2, 1.0, 1.8][e.pat] / sp; e.k = 0;
    if (e.pat === 3) { e.t = 0; e.restActive = true; enemyPunish(e, 1.35); return Z0; }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang, 18 * sp);
  if (e.pat === 1 && bossThreatEnabled(e, 'root') && e.sub <= 0 && e.k < (enr ? 5 : 3)) {         // roots erupt under the player
    e.sub = 0.38 / sp; e.k++;
    const x = p.x + rnd(-6, 6), y = p.y - 3 + rnd(-4, 4);
    warn(x, y, 13, 0.7, w => { if (!bossThreatEnabled(e, 'root')) return; areaHit(w.x, w.y, w.r); shake(3); SFX.slam(); ring(w.x, w.y, w.r + 2, [120, 200, 80], 0.25);
      burst(w.x, w.y, 14, ['#6a4a2a', '#4a9a3a', '#c8b080'], { sp: 80, life: 0.4, up: true }); }, [120, 220, 90]);
    G.warns[G.warns.length - 1].threat = 'root';
  }
  if (e.pat === 2 && bossThreatEnabled(e, 'spore') && e.sub <= 0) { e.sub = 0.12 / sp; e.k = (e.k || 0) + 0.42;
    for (let a = 0; a < (enr ? 3 : 2); a++) enemyShot(e.x, e.y - 12, e.k + a * Math.PI * 2 / (enr ? 3 : 2), 70, 'spore', { life: 2.6 }); }
  if (e.pat === 4 && e.sub <= 0) { e.sub = 0.5 / sp;
    for (let k = -3; k <= 3; k++) enemyShot(e.x, e.y - 12, ang + k * 0.13, 100, 'leaf'); SFX.shoot(); }
  return Z0;
}
// ---------------------------------------------------------------- boss 3: 炎魔领主 (fire rings, meteors, charge + flame trail, spiral)
function updDemon(e, dt, ang) {
  const sp = enrage(e, 1.3), enr = sp > 1, p = G.player;
  if (e.t <= 0) {
    if (e.pat === 3 && !e.boundaryFinish) { shake(7); SFX.boom(); ring(e.x, e.y - 4, 34, [255, 120, 40], 0.35); areaHit(e.x, e.y - 4, 30, 2);
      for (let i = 0; i < 14; i++) enemyShot(e.x, e.y - 8, i * Math.PI / 7 + e.anim, 80, 'fire'); }
    e.boundaryFinish = true;
    if (bossRecoveryBoundary(e)) return Z0;
    e.boundaryFinish = false;
    if (bossEnrageMove(e, ang)) return Z0; e.pat = bossNextPat(e, 6); e.sub = 0.2; e.k = 0; e.t = [1.3, 1.8, 2.0, 1.3, 2.0, 1.0][e.pat] / sp;
    if (e.pat === 3) e.tele = 0.6 / sp;
    if (e.pat === 5 && G.enemies.length < 4) for (let i = 0; i < (enr ? 3 : 2); i++) {
      const s = freeSpot(G.room, 40, p.x, p.y, 'fly'); spawnEnemy(i % 2 ? 'firebat' : 'imp', s.x, s.y, 0.8); }
  }
  e.sub -= dt;
  if (e.pat === 0) return V(ang, 34 * sp);
  if (e.pat === 1 && e.sub <= 0) { e.sub = 0.5 / sp; const n = enr ? 18 : 14, o = (e.k++) * 0.11;
    for (let i = 0; i < n; i++) enemyShot(e.x, e.y - 12, o + i * Math.PI * 2 / n, 66, 'fire'); SFX.fire(); }
  if (e.pat === 2 && e.sub <= 0 && e.k < (enr ? 8 : 5)) { e.sub = 0.3 / sp; e.k++;         // meteor rain
    const x = e.k === 1 ? p.x : clamp(p.x + rnd(-50, 50), 24, RPW - 24), y = e.k === 1 ? p.y - 3 : clamp(p.y + rnd(-34, 34), 30, RPH - 22);
    warn(x, y, 14, 0.8, w => { areaHit(w.x, w.y, w.r, 2); SFX.boom(); shake(4); ring(w.x, w.y, w.r + 3, [255, 140, 40], 0.3);
      G.flames.push({ x: w.x, y: w.y, r: 10, life: 2.2 });
      burst(w.x, w.y, 20, ['#ff8a30', '#ffd060', '#5a2a1a'], { sp: 100, life: 0.45, up: true }); });
  }
  if (e.pat === 3) {                                                // telegraphed charge leaving fire on the floor
    if (e.tele > 0) { e.tele -= dt; e.t = Math.max(e.t, 0.6); e.cx = Math.cos(ang); e.cy = Math.sin(ang); e.flash = Math.floor(e.tele * 14) % 2 ? 0.05 : 0; return Z0; }
    if (e.sub <= 0) { e.sub = 0.07; G.flames.push({ x: e.x, y: e.y - 2, r: 8, life: 1.6 }); }
    return { x: e.cx * 180 * sp, y: e.cy * 180 * sp };
  }
  if (e.pat === 4 && e.sub <= 0) { e.sub = 0.1 / sp; e.k += 0.33;
    for (const a of [0, Math.PI]) enemyShot(e.x, e.y - 12, e.k + a, 85, 'fire'); if (enr) enemyShot(e.x, e.y - 12, -e.k, 85, 'fire'); }
  return Z0;
}
// ============================================================ projectiles, floor fire, pickups
const SHOT_SPARK = { wave: ['#d8c0ff', '#ffffff'], bolt: ['#8ac8ff', '#ffffff'], arrow: ['#d8d0c0', '#8a5a30'], goo: ['#b45ae0', '#f4d8ff'],
  fire: ['#ff8a30', '#ffd060'], spore: ['#b04ad0', '#f0e0f8'], leaf: ['#4a9a3a', '#b0f090'], bone: ['#ddd6c0', '#8a8070'] };
function playerShotOverlap(s, p) {
  return s.life > 0 && p.hp > 0 && p.inv <= 0 && p.rolling <= 0 && !(s.fire && p.fireImm) &&
    (s.x - p.x) ** 2 + (s.y - (p.y - 6)) ** 2 < (s.r + 3) ** 2;
}
function hitPlayerShot(s, consumeShot = true) {
  const p = G.player;
  if (!playerShotOverlap(s, p)) return false;
  const inv = p.inv;
  hurtPlayer(s.neutral ? 1 : s.dmg, s.x, s.y, s.fire, !!(s.neutral || s.environment));
  if (!(p.inv > inv)) return false;
  if (consumeShot) { s.life = 0; if (s.onHit) s.onHit(p, s); }
  return true;
}
function updShots(dt) {
  stepWeaponShots(dt);
  const p = G.player;
  for (const s of G.shots) {
    s.life -= dt;
    if (s.homing) {                                               // gently steer toward the nearest enemy
      const t = nearestEnemy(s.x, s.y, 90, s.hit);
      if (t) { const sp = Math.hypot(s.vx, s.vy), a0 = Math.atan2(s.vy, s.vx), a1 = Math.atan2(t.y - t.h / 2 - s.y, t.x - s.x);
        const a = a0 + clamp(angDiff(a0, a1), -6 * dt, 6 * dt); s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp; }   // angDiff(a, b) = b - a: turn toward a1
    }
    if (s.acc) { s.vx *= 1 + s.acc * dt; s.vy *= 1 + s.acc * dt; }
    if (s.seek && s.seek.t > 0) { s.seek.t -= dt;                // enemy seeking shot: turns toward the player for a while
      const sp = Math.hypot(s.vx, s.vy), a0 = Math.atan2(s.vy, s.vx), a1 = Math.atan2(p.y - 6 - s.y, p.x - s.x);
      const a = a0 + clamp(angDiff(a0, a1), -s.seek.turn * dt, s.seek.turn * dt); s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp; }
    if (s.home) {                                                // boomerang (anchor): flies out, then returns to its owner
      s.out -= dt;
      if (s.out <= 0) { const h = s.home, a = Math.atan2(h.y - 8 - s.y, h.x - s.x), sp = Math.hypot(s.vx, s.vy);
        s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp; if (h.hp <= 0 || dist(s.x, s.y, h.x, h.y - 8) < 10) s.life = 0; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.rot = (s.rot || 0) + dt * 14;
      hitPlayerShot(s, false);
      continue;                                                  // ignores walls
    }
    if (s.orbit) {                                               // circles its owner (sun orbs); radius can grow
      const O = s.orbit; O.a += O.w * dt; O.r += (O.dr || 0) * dt;
      s.x = O.c.x + Math.cos(O.a) * O.r; s.y = O.c.y - 10 + Math.sin(O.a) * O.r * 0.7; s.rot = (s.rot || 0) + dt * 14;
      if (O.c.hp <= 0) s.life = 0;
    } else if (s.hold > 0) { s.hold -= dt;                       // frozen in place, then launches (time warden)
      if (s.hold <= 0 && s.launch) { const a = s.launch.aim ? Math.atan2(p.y - 6 - s.y, p.x - s.x) : s.launch.a;   // aim: re-target at launch time
        s.vx = Math.cos(a) * s.launch.sp; s.vy = Math.sin(a) * s.launch.sp; SFX.shoot(); }
    } else { const k = s.tmul || 1; s.x += s.vx * dt * k; s.y += s.vy * dt * k; s.rot = (s.rot || 0) + dt * 14; }
    if (s.friendly && s.kind === 'bolt' && rand() < 0.5)
      G.parts.push({ x: s.x, y: s.y, vx: rnd(-8, 8), vy: rnd(-8, 8), life: 0.25, max: 0.25, col: '#8ac8ff', size: 1, grav: 0, add: true });
    if (!s.ghost && boxHits(G.room, s.x, s.y + 6, 1, 1, 'shot')) {      // 'shot': like walking units, but flies over void pits
      if (s.bounce > 0) {                                        // mirror walls: reflect once instead of breaking
        s.bounce--; s.x -= s.vx * dt; s.y -= s.vy * dt;
        const hx = boxHits(G.room, s.x + s.vx * dt, s.y + 6, 1, 1, 'shot'), hy = boxHits(G.room, s.x, s.y + s.vy * dt + 6, 1, 1, 'shot');
        if (hx || !hy) s.vx = -s.vx; if (hy) s.vy = -s.vy;
        burst(s.x, s.y, 4, ['#ffffff', '#c8d8ff'], { sp: 40, life: 0.2 });
      } else {
        s.life = 0; burst(s.x, s.y, 4, SHOT_SPARK[s.kind] || SHOT_SPARK.bone, { sp: 40, life: 0.25 });
        if (s.onWall) s.onWall(s);
        mechCall('shotWall', s.x, s.y + 6, s);
      }
    }
    if (s.friendly) {
      const hitState = s.kind === 'chakram' && s.chak?.back ? shotHitState(s) : null;
      const hit = hitState ? hitState.hit || (hitState.hit = new Set()) : s.hit;
      for (const e of G.enemies) {
        if (s.life <= 0) break;
        if (e.spawn > 0 || e.hp <= 0 || e.hidden || hit.has(e) || dist(s.x, s.y, e.x, e.y - e.h / 2) >= s.r + e.hw) continue;
        hit.add(e); damageEnemy(e, s.dmg, s.crit, s.vx, s.vy, { kb: s.kb ?? 100, proc: s.proc, fromMinion: !!s.minion, shot: s });
        if (s.onHitE) s.onHitE(e, s);
        if (s.splash) { ring(s.x, s.y, s.splash, [255, 230, 140], 0.25);                        // holy splash
          for (const o of G.enemies) if (o !== e && o.spawn <= 0 && o.hp > 0 && dist(s.x, s.y, o.x, o.y - o.h / 2) < s.splash + o.hw) damageEnemy(o, s.dmg * 0.5, false, o.x - s.x, o.y - s.y, { kb: 60, col: '#ffe080', shot: s, attackCtx: s.attackCtx }); }
        if (s.kind !== 'wave') { if (s.pierce > 0) s.pierce--; else { s.life = 0; burst(s.x, s.y, 6, SHOT_SPARK[s.kind], { sp: 50, life: 0.25 }); } }
        if (s.crit && s.kind !== 'wave') G.hitstop = Math.max(G.hitstop, 0.05);
      }
    }
    if (s.attackLevel && s.motion === 'orb' && s.life <= 0) detonateWeaponShot(s);
    // enemy shots hit the player; neutral shots (shattered crystals) hit both sides, always for 1 on the player
    if (!s.friendly || (s.neutral && G.time - s.born > 0.18)) hitPlayerShot(s);
  }
  G.shots = G.shots.filter(s => s.life > 0);
  // burning floor patches (demon): hurt on contact, unless fire-immune
  for (const f of G.flames) {
    f.life -= dt;
    if (f.kind) { stepGroundArea(f, dt); groundAreaHit(f, p); continue; }      // tar / shock / sweeping walls (enemy-attacks.js)
    if (f.ice) { if (f.life > 0.2 && dist(f.x, f.y, p.x, p.y - 2) < f.r) p.slow = Math.max(p.slow, 0.3); continue; }   // frost patch: chills, no damage
    if (f.spore) { if (f.life > 0.2 && dist(f.x, f.y, p.x, p.y - 2) < f.r && p.rolling <= 0) p.tox = Math.max(p.tox, 2); continue; }   // spore / poison cloud
    if (rand() < 0.3) G.parts.push({ x: f.x + rnd(-f.r, f.r) * 0.7, y: f.y + rnd(-3, 3), vx: 0, vy: rnd(-30, -12), life: 0.35, max: 0.35,
      col: pick(['#ff8a30', '#ffd060']), size: 1, grav: 0, add: true });
    if (f.life > 0.2 && dist(f.x, f.y, p.x, p.y - 2) < f.r) hurtPlayer(1, f.x, f.y, true);
  }
  G.flames = G.flames.filter(f => f.life > 0);
}
function updPickups(dt) {
  const p = G.player, cleared = G.enemies.length === 0, mag = 42 * (p.magnet || 1);
  for (const c of G.pickups) {
    c.t += dt; c.vz -= 320 * dt; c.z += c.vz * dt;
    if (c.z < 0) { c.z = 0; c.vz = Math.abs(c.vz) > 30 ? -c.vz * 0.4 : 0; c.vx *= 0.6; c.vy *= 0.6; }
    const d = dist(c.x, c.y, p.x, p.y);
    if (c.t > 0.45 && (d < mag || (cleared && c.kind !== 'heart'))) {
      const k = (cleared ? 260 : 180) * dt / Math.max(d, 1); c.vx += (p.x - c.x) * k * 4; c.vy += (p.y - c.y) * k * 4;
      c.vx *= 0.9; c.vy *= 0.9;
    }
    moveBox(c, c.vx * dt, c.vy * dt, cleared && c.t > 2.5 ? 'fly' : 'walk'); c.vx *= 0.97; c.vy *= 0.97;   // late loot drifts over pillars
    if (c.t > 0.3 && d < 8) {
      if (c.kind === 'heart' && p.hp >= p.maxHp) continue;          // leave hearts for later when at full hp
      c.done = true;
      if (c.kind === 'coin') { G.gold += c.v ?? COIN_VAL; SFX.coin(); G.goldPulse = 0.15; G.uiCoins.push({ x: c.x, y: c.y + OY - c.z, t: 0, soul: false }); }
      else if (c.kind === 'soul') { G.runSouls++; SFX.soul(); G.soulPulse = 0.15; G.uiCoins.push({ x: c.x, y: c.y + OY - c.z, t: 0, soul: true }); }
      else p.heal(2);
    }
  }
  G.pickups = G.room.pickups = G.pickups.filter(c => !c.done);   // keep room's leftover loot in sync
  for (const u of G.uiCoins) u.t += dt * 2.2;
  G.uiCoins = G.uiCoins.filter(u => u.t < 1);
}
