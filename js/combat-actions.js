'use strict';
// One input state machine for authority and prediction; no damage or RNG in replay.
const COMBAT_CHARGE = Object.freeze({ tell: .22, full: .8 });
const WEAPON_MOVES = {
  sword: ['横斩三连', '强化横斩', 'sweep'], spellblade: ['咒刃三连', '咒刃重斩', 'wave'],
  dagger: ['交替刺击', '交叉斩', 'cross'], claws: ['交替爪击', '交叉斩', 'cross'],
  axe: ['宽幅横扫', '宽扫重击', 'circle'], greatsword: ['重剑横扫', '前方劈斩', 'line'],
  spear: ['长枪突刺', '贯穿突刺', 'thrust'], halberd: ['刺扫交替', '贯穿突刺', 'thrust'],
  hammer: ['重锤', '前方震地', 'slam'], holyhammer: ['圣锤', '圣光震地', 'slam'], mace: ['短锤', '前方震地', 'slam'],
  flail: ['延迟链击', '链锤重击', 'outer'], whip: ['鞭梢抽击', '扇形扫击', 'sweep'],
  bow: ['直射箭', '贯穿重箭', 'arrow'], crossbow: ['重弩贯穿', '重弩狙击', 'arrow'], javelin: ['重投矛', '远程贯穿', 'arrow'],
  knives: ['交替飞刀', '双连飞刀', 'fan'], chakram: ['往返各半伤害', '悬停后返回，往返合计1.5倍', 'return'],
  staff: ['法术弹', '双连法术弹', 'burst'], wand: ['快速飞弹', '双连飞弹', 'beam'],
  tome: ['穿透魔球', '内核法球', 'blast'], orb: ['终点爆破', '扩大爆破', 'orb'],
  scepter: ['溅射圣光', '强化圣光', 'blast'], holytome: ['穿透圣光', '加宽圣光', 'beam'], censer: ['抛物落点', '小范围净化', 'field'],
  lute: ['波动音符', '双音和弦', 'fan'], flute: ['直线音点', '双连音点', 'beam'], fiddle: ['摆动音波', '双连音波', 'crosswave'],
  horn: ['扇形推击', '双重音浪', 'pulse'], drum: ['近身震荡', '双段震荡', 'double'], chime: ['延迟重音', '定点钟鸣', 'blast'],
  rod: ['召唤射手', '集火指令', 'command'], rbook: ['召唤法师', '集火指令', 'command'], sigil: ['召唤护卫', '集火指令', 'command'], lantern: ['召唤追踪者', '集火指令', 'command'],
};
function cancelPlayerCharge(p) { if (!p) return; p.charging = false; p.chargeT = 0; p.chargeWeapon = ''; }
function chargeRoomKey() { const r = G.room; return `${G.act}:${G.chapter}:${G.floor}:${r?.gx}:${r?.gy}`; }
function stepPlayerCharge(p, keys, pressed, dt, fire, contextAllowed = combatInput()) {
  const has = (v, k) => v instanceof Set ? v.has(k) : v.includes(k), room = chargeRoomKey();
  const invalid = p.stun > 0 || !playerAttackRecovered(p) || G.trans || !contextAllowed ||
    (typeof COOP_UI !== 'undefined' && COOP_UI.open && (!coopRuntimeIsActive() || coopActorId() === COOP.selfId)) || has(pressed, 'attackCancel') || has(pressed, 'roll');
  if (invalid || (p.charging && (p.chargeWeapon !== (p.weaponId || p.wpn.kind) || p.chargeRoom !== room))) { cancelPlayerCharge(p); return; }
  if (has(keys, 'normalAttack') || has(pressed, 'normalAttack')) {
    cancelPlayerCharge(p);
    if (p.atkT <= 0) fire(0);
    return;
  }
  if (has(pressed, 'attack') && p.atkT <= 0 && !p.charging) {
    p.charging = true; p.chargeT = 0; p.chargeWeapon = p.weaponId || p.wpn.kind; p.chargeRoom = room;
  }
  if (!p.charging) return;
  if (has(pressed, 'attackUp')) {
    const level = p.chargeT + 1e-9 >= COMBAT_CHARGE.full ? 1 : 0;
    cancelPlayerCharge(p); fire(level); return;
  }
  // Absence of input is never a release (packet gaps, focus loss, canceled touches).
  if (!has(keys, 'attack')) { cancelPlayerCharge(p); return; }
  p.chargeT = Math.min(COMBAT_CHARGE.full, p.chargeT + dt);
}
// Charge buys coverage and timing, not attack-speed-scaled burst damage.
function chargedWeaponMultiplier() { return 1.5; }
function weaponMove(p, level) {
  const w = p.wpn, def = WEAPON_MOVES[w.kind];
  if (!def) throw Error('未配置的武器招式: ' + w.kind);
  p.combo = (G.time - (p.comboAt || -100) < 1.2 ? p.combo || 0 : 0) % 3 + 1; p.comboAt = G.time;
  const m = { shape: level ? def[2] : 'normal', damage: level ? chargedWeaponMultiplier(w) : 1,
    range: 1, speed: 1, pierce: 0, arc: w.arc || 0, motion: '', level };
  if (!level) {
    if (['sword', 'spellblade'].includes(w.kind) && p.combo === 3) m.arc *= 1.2;
    if (w.kind === 'halberd' && p.combo % 2 === 0) m.arc = 1.4;
    if (['lute', 'fiddle'].includes(w.kind)) m.motion = w.kind === 'lute' ? 'sine' : 'weave';
    if (w.kind === 'orb') m.motion = 'orb';
    if (['censer', 'chime', 'flail'].includes(w.kind)) m.shape = w.kind === 'flail' ? 'delay' : 'blast';
    return m;
  }
  m.range = 1.15;
  if (['circle', 'wave', 'outer'].includes(m.shape)) m.shape = w.kind === 'flail' ? 'slam' : 'sweep';
  if (['sweep', 'cross'].includes(m.shape)) m.arc = Math.min(Math.PI * .9, w.arc * 1.15);
  if (['line', 'thrust'].includes(m.shape)) m.arc = .35;
  if (m.shape === 'arrow') { m.range = 1.1; m.pierce = 1; }
  if (['fan', 'burst', 'beam', 'crosswave', 'pulse'].includes(m.shape)) m.shape = w.kind === 'holytome' ? 'holy' : 'pair';
  if (w.kind === 'tome' || w.kind === 'orb') { m.shape = 'orb'; m.motion = 'orb'; m.range = 1.1; }
  if (w.kind === 'fiddle' || w.kind === 'lute') m.motion = 'weave';
  if (m.shape === 'return') m.motion = 'hover';
  if (m.shape === 'field') m.shape = 'blast';
  if (m.shape === 'double') m.shape = 'drum';
  return m;
}
function weaponInShape(p, e, m) {
  const dx = e.x - p.x, dy = e.y - e.h / 2 - (p.y - 6), reach = p.reach * p.scale * m.range;
  const distance = Math.hypot(dx, dy), angle = Math.abs(angDiff(p.face, Math.atan2(dy, dx)));
  return distance < reach + e.hw && (distance < 6 || angle < m.arc) && (m.shape !== 'outer' || distance > reach * .35);
}
function weaponMeleeHit(p, e, m, dmg, crit, attackCtx) {
  const apply = (amount, proc) => {
    const target = e.link || e, hp = target.hp;
    damageEnemy(e, amount, crit, e.x - p.x, e.y - p.y, { kb: p.wpn.kb, proc, melee: true, meleeHeavy: !!p.wpn.heavy, meleeCharged: !!m.level, attackCtx });
    if (m.level && target.hp < hp) chargedImpact(e.x, e.y - e.h / 2, chargedPoseKind(p.wpn), attackCtx);
  };
  // Split integer damage once: minimum-one rounding must not double fast dagger DPS.
  if (m.shape === 'cross' || (['dagger', 'claws'].includes(p.wpn.kind) && p.combo === 3)) {
    const total = Math.max(1, Math.round(dmg)), first = Math.ceil(total / 2); apply(first, true);
    if (total > first) {
      const second = () => { if (e.hp > 0 && (!m.level || weaponInShape(p, e, m))) apply(total - first, false); };
      if (m.level) queueChargedAction(G.player, .07, second); else G.later.push({ t: .07, fn: second });
    }
  } else apply(dmg, true);
}
function weaponArea(x, y, r, dmg, crit, ctx, extra = {}) {
  if (extra.impactStyle) chargedImpact(x, y, extra.impactStyle, ctx);
  else ring(x, y, r, [130, 220, 255], .25);
  for (const e of G.enemies) if (e.spawn <= 0 && !e.hidden && !e.air && e.hp > 0 && dist(x, y, e.x, e.y - e.h / 2) < r + e.hw)
    damageEnemy(e, dmg, crit, e.x - x, e.y - y, { kb: 80, proc: true, attackCtx: ctx, ...extra });
}
function weaponDelayed(x, y, r, delay, fn) {
  const id = typeof coopActorId === 'function' ? coopActorId() : null, room = G.room;
  warn(x, y, r, delay, () => { if (G.room === room) { if (id) coopWithActor(id, fn); else fn(); } }, [100, 210, 255]);
}
// Runtime callbacks keep ownership via coopWithActor; none are serialized into snapshots.
function queueChargedAction(p, delay, fn) {
  const room = G.room, weapon = G.eq.weapon.id;
  G.later.push({ t: delay, fn: () => {
    if (G.room === room && G.player === p && G.eq.weapon.id === weapon && p.hp > 0 && p.stun <= 0 && p.rolling <= 0) fn();
  } });
}
function chargedPoseKind(w) {
  if (['rod', 'rbook', 'sigil', 'lantern'].includes(w.kind)) return 'command';
  if (['dagger', 'claws'].includes(w.kind)) return 'cross';
  if (['spear', 'halberd', 'whip'].includes(w.kind)) return 'thrust';
  if (['hammer', 'holyhammer', 'mace', 'flail'].includes(w.kind)) return 'slam';
  if (['bow', 'crossbow', 'javelin'].includes(w.kind)) return 'arrow';
  if (['knives', 'chakram'].includes(w.kind)) return 'throw';
  if (['scepter', 'holytome', 'censer'].includes(w.kind)) return 'holy';
  if (['lute', 'flute', 'fiddle', 'horn', 'drum', 'chime'].includes(w.kind)) return 'note';
  return w.ranged ? 'cast' : 'slash';
}
function setPlayerAttackVisual(p, level) {
  p.attackLevel = level; p.attackPose = level ? chargedPoseKind(p.wpn) : '';
  if (level) { p.swingT = .28; p.swing = .28; }
}
function emitChargedVolley(p, m, dmg, crit, ctx) {
  const w = p.wpn, a = p.swingAng, n = p.multi || 1, share = n > 1 ? (1 + MULTI_SHARE * (n - 1)) / n : 1;
  const total = Math.max(1, Math.round(dmg)), parts = m.shape === 'pair' && total > 1 ? [Math.ceil(total / 2), Math.floor(total / 2)] : [total];
  // Read attack properties now. Changing equipment before a delayed shot cancels it.
  const spec = { r: w.r + (m.shape === 'holy' ? 1 : 0), crit, kb: w.kb, friendly: true,
    life: w.life * (p.rangeMul || 1) * m.range, kind: w.proj, pierce: (w.pierce || 0) + p.pierce + m.pierce,
    homing: p.homing, proc: true, splash: w.splash ? w.splash * p.splashMul : 0, main: true, attackCtx: ctx,
    terminalDamage: m.shape === 'orb' ? Math.floor(total / 4) : 0,
    gfx: p.gfx || 0, motion: m.motion, motionT: 0, phase: 0, baseSpeed: w.speed, attackLevel: 1, chargeStyle: p.attackPose };
  parts.forEach((amount, phase) => queueChargedAction(p, .07 + phase * .08, () => {
    for (let i = 0; i < n; i++) {
      const angle = a + (i - (n - 1) / 2) * .16;
      G.shots.push({ ...spec, x: p.x + Math.cos(angle) * 6, y: p.y - 6 + Math.sin(angle) * 6,
        vx: Math.cos(angle) * w.speed, vy: Math.sin(angle) * w.speed, dmg: (amount - (m.shape === 'orb' ? Math.floor(total / 4) : 0)) * share, hit: new Set(), baseA: angle, chargePart: phase });
    }
  }));
}
function weaponSpecialAttack(p, m, dmg, crit, ctx) {
  const shape = m.shape, a = p.swingAng, x = p.x, y = p.y - 6, reach = p.reach * p.scale, ranged = !!p.wpn.ranged;
  if (shape === 'command') {
    const target = nearestEnemy(x + Math.cos(a) * 100, y + Math.sin(a) * 100, 90);
    const tx = target ? target.x : x + Math.cos(a) * 100, ty = target ? target.y - target.h / 2 : y + Math.sin(a) * 100;
    for (const q of G.minions) if (!q.max) { q.commandUntil = G.time + 1.5; q.commandX = tx; q.commandY = ty; }
    Object.assign(p, { commandMarkX: tx, commandMarkY: ty, commandMarkT: G.time + .45 });
  }
  if (['slam', 'blast', 'delay', 'drum'].includes(shape)) {
    const far = shape === 'blast' ? Math.min(100, p.wpn.speed ? p.wpn.speed * p.wpn.life * .65 : reach) : shape === 'slam' ? reach * .7 : 0;
    const tx = clamp(x + Math.cos(a) * far, 12, RPW - 12), ty = clamp(y + Math.sin(a) * far, 12, RPH - 12);
    const r = shape === 'delay' ? reach : shape === 'slam' ? Math.min(20, reach * .6) : shape === 'drum' ? reach : m.level ? 20 : 18;
    const fire = amount => weaponArea(tx, ty, r, amount, crit, ctx, { melee: !ranged, ranged, meleeHeavy: !!p.wpn.heavy, meleeCharged: !!m.level, impactStyle: m.level && chargedPoseKind(p.wpn) === 'holy' ? 'holy' : '' });
    if (shape === 'drum') {
      const total = Math.max(1, Math.round(dmg)), first = Math.ceil(total / 2);
      queueChargedAction(p, .07, () => fire(first));
      if (total > first) queueChargedAction(p, .15, () => fire(total - first));
    } else if (m.level) queueChargedAction(p, .07, () => fire(dmg));
    else weaponDelayed(tx, ty, r, shape === 'delay' ? .12 : .35, () => fire(dmg));
    if (!m.level) SFX.magic(); return true;
  }
  if (m.level && p.wpn.ranged) { emitChargedVolley(p, m, dmg, crit, ctx); return true; }
  return false;
}
function stepWeaponShots(dt) {
  for (const s of G.shots) {
    if (!s.motion) continue;
    s.motionT += dt;
    if (s.motion === 'sine' || s.motion === 'weave') {
      const a = s.baseA + Math.sin(s.motionT * (s.motion === 'sine' ? 8 : 12)) * .35;
      s.vx = Math.cos(a) * s.baseSpeed; s.vy = Math.sin(a) * s.baseSpeed;
    }
    if (s.motion === 'orb' && (s.life <= dt || boxHits(G.room, s.x + s.vx * dt, s.y + s.vy * dt + 6, 1, 1, 'shot'))) detonateWeaponShot(s);
  }
}
function detonateWeaponShot(s) {
  if (s.detonated) return;
  s.detonated = true; s.life = 0;
  const damage = s.terminalDamage ?? s.dmg, r = s.attackLevel ? 18 : 16;
  if (damage > 0) weaponArea(s.x, s.y, r, damage, s.crit, s.attackCtx, { ranged: !!s.main, fromMinion: !!s.minion });
  else ring(s.x, s.y, r, [130, 220, 255], .15);
}
const COMBAT_DRAW_PLAYER = drawPlayer;
drawPlayer = function (p, time) {
  COMBAT_DRAW_PLAYER(p, time);
  if (p.commandMarkT > G.time) {
    g.save(); g.globalAlpha = clamp((p.commandMarkT - G.time) / .2);
    const x = p.commandMarkX, y = p.commandMarkY, color = '#d5a5ff';
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
      px(x + dx * 7 - (dx > 0 ? 3 : 0), y + dy * 7, 4, 1, color);
      px(x + dx * 7, y + dy * 7 - (dy > 0 ? 3 : 0), 1, 4, color);
    }
    g.restore();
  }
  if (p.charging && p.chargeT >= COMBAT_CHARGE.tell) {
    const k = clamp(p.chargeT / COMBAT_CHARGE.full), y = p.y - heroVisualHeight(p) - 10;
    px(p.x - 9, y, 18, 3, '#18202e'); px(p.x - 8, y + 1, 16 * k, 1, k >= 1 ? '#fff0a0' : '#80ddff');
    g.save(); g.strokeStyle = k >= 1 ? '#fff0a0' : '#80ddff'; g.lineWidth = 1;
    g.beginPath(); g.arc(p.x, p.y - 6, 10, p.face - .5, p.face + .5); g.stroke(); g.restore();
  }
};
// Item mods are the source of truth; include untagged and chapter-only weapons.
for (const item of ITEMS) if (item.slot === 'weapon') {
  const s = {}; item.mod(s); const def = WEAPON_MOVES[s.wpn?.kind];
  if (!def) throw Error('武器缺少招式: ' + item.id);
  item.lines.push('点按：' + def[0], '蓄力：' + def[1]);
}
function summonWeaponRole(p = G.player) {
  if (G.eq.weapon?.cls !== 'summoner') return 'shooter';
  return ({ rod: 'shooter', rbook: 'caster', sigil: 'guard', lantern: 'seeker' })[p.wpn.kind] || 'shooter';
}
function minionAttackTarget(m, fallback) {
  if (m.max || (!(m.commandUntil > G.time) && summonWeaponRole() !== 'seeker')) return fallback;
  const x = m.commandUntil > G.time ? m.commandX : G.player.x + Math.cos(G.player.face) * 100;
  const y = m.commandUntil > G.time ? m.commandY : G.player.y - 6 + Math.sin(G.player.face) * 100;
  return nearestEnemy(x, y, 90) || fallback;
}
function minionRoleAttack(m, M, tgt) {
  const role = m.kind === 'ghost' ? 'shooter' : summonWeaponRole(), period = role === 'seeker' ? 1.4 : 1;
  if (role === 'guard' && dist(m.x, m.y, tgt.x, tgt.y) > 20 + tgt.hw) return false;
  m.t = M.cd * period;
  const dmg = minionDmg(M) * period, ctx = newCombatAttack();
  m.commandUntil = 0;
  if (role === 'guard') {
    damageEnemy(tgt, dmg, false, tgt.x - m.x, tgt.y - m.y, { kb: 65, fromMinion: true, attackCtx: ctx }); minionProc(tgt);
    m.guardRest = .3; ring(m.x, m.y - 6, 12, [180, 150, 255], .15); return true;
  }
  if (role === 'caster') {
    const tx = tgt.x, ty = tgt.y - tgt.h / 2;
    weaponDelayed(tx, ty, 17, .3, () => {
      weaponArea(tx, ty, 17, dmg, false, ctx, { proc: false, fromMinion: true }); minionProc(tgt);
    });
    return true;
  }
  const a = Math.atan2(tgt.y - tgt.h / 2 - (m.y - 8), tgt.x - m.x);
  G.shots.push({ x: m.x, y: m.y - 8, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 3, dmg, crit: false, kb: 30, friendly: true, life: .9,
    kind: 'rbolt', hit: new Set(), pierce: 0, homing: role === 'seeker' || m.kind === 'ghost', proc: false, minion: true, attackCtx: ctx,
    onHitE: e => { minionProc(e); } });
  return true;
}
// Charged silhouettes and trajectories are rendered locally from the same pose timer.
// No particle spawning or gameplay mutation in any draw helper.
function chargedLine(x1, y1, x2, y2, color, width = 1) {
  g.strokeStyle = color; g.lineWidth = width; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
function drawChargedPlayer(p, time) {
  const preparing = p.charging && p.chargeT >= COMBAT_CHARGE.tell;
  if (p.rolling > 0 || (!preparing && !(p.attackLevel && p.swing > 0))) return false;
  if (p.inv > 0 && Math.floor(time * 18) % 2) return true;
  const pose = preparing ? chargedPoseKind(p.wpn) : p.attackPose || chargedPoseKind(p.wpn);
  const a = preparing ? p.face : p.swingAng, u = preparing ? 0 : clamp(1 - p.swing / p.swingT), k = clamp((u - .25) / .45);
  const sc = p.scale || 1, x = p.x, y = p.y - 7 * sc, flip = Math.cos(a) < -.05, w = p.wpn, item = G.eq.weapon;
  const color = pose === 'holy' ? '#fff1ad' : pose === 'command' ? '#d5a5ff' : pose === 'note' ? '#ffb4df' : pose === 'arrow' ? '#ffe1a0' : item.cls === 'cleric' ? '#fff0b8' : '#a8dbff';
  const cols = [item.icon[1], item.icon[2], item.icon[3]], ready = preparing ? clamp(p.chargeT / .8) : 1;
  let angle = a, hx = x + Math.cos(a) * 3, hy = y + Math.sin(a) * 3;
  if (pose === 'slash' || pose === 'cross') angle = a - 1.15 + 2.05 * k;
  if (pose === 'slam') { angle = a - 1.4 + 1.5 * k; hx -= Math.cos(a) * (1 - k) * 3; hy -= 2 * (1 - k); }
  if (pose === 'thrust') { hx += Math.cos(a) * (-4 + k * 11); hy += Math.sin(a) * (-4 + k * 11); }
  if (pose === 'arrow') { hx -= Math.cos(a) * (preparing ? ready * 4 : (1 - k) * 4); hy -= Math.sin(a) * (preparing ? ready * 4 : (1 - k) * 4); }
  if (['cast', 'holy', 'note', 'command'].includes(pose)) { hy -= (preparing ? ready : 1 - k) * 3; angle = a - .4 * (1 - k); }
  g.save(); shadow(p.x, p.y, 5); drawHeroCape(p, time, flip);
  drawSpr(g, heroAppearance(p), x, p.y, { flip, sx: sc, sy: sc });
  drawEquippedWeapon(item, w.kind, hx, hy, angle, cols, sc);
  if (preparing) {
    const fx = hx + Math.cos(a) * 7, fy = hy + Math.sin(a) * 7;
    if (pose === 'arrow') {
      const bx = x + Math.cos(a) * 7, by = y + Math.sin(a) * 7, pull = 3 + ready * 5;
      chargedLine(bx - Math.sin(a) * 7, by + Math.cos(a) * 7, bx - Math.cos(a) * pull, by - Math.sin(a) * pull, '#fff0c5');
      chargedLine(bx + Math.sin(a) * 7, by - Math.cos(a) * 7, bx - Math.cos(a) * pull, by - Math.sin(a) * pull, '#fff0c5');
      chargedLine(bx - Math.cos(a) * pull, by - Math.sin(a) * pull, bx + Math.cos(a) * 7, by + Math.sin(a) * 7, '#e9c16b');
    } else if (pose === 'holy') {
      g.strokeStyle = '#d7bd61'; g.lineWidth = 1; g.beginPath(); g.arc(fx, fy - 3, 5 + ready, 0, Math.PI * 2); g.stroke();
      px(fx - 1, fy - 8, 2, 10, '#fff1ad'); px(fx - 4, fy - 5, 8, 2, '#fff9e5');
    } else if (pose === 'cast') {
      const rot = time * 2;
      g.save(); g.translate(fx, fy); g.rotate(rot); g.strokeStyle = '#91bcff'; g.lineWidth = 1; g.strokeRect(-4 - ready, -4 - ready, 8 + ready * 2, 8 + ready * 2); g.restore();
      px(fx - 1, fy - 1, 2, 2, '#e8e1ff');
    } else if (pose === 'note') {
      for (let i = 0; i < 3; i++) { const off = i * 2 - 2; chargedLine(fx - 5, fy + off, fx + 5, fy + off, '#c98aaf'); }
      px(fx - 1, fy - 5, 1, 7, '#ffe0ee'); px(fx - 4, fy + 1, 4, 2, '#fff0f8');
    }
    const tip = ((WLEN[w.kind] || 7) + 1) * sc;
    px(hx + Math.cos(angle) * tip, hy + Math.sin(angle) * tip, 2, 2, ready >= 1 ? '#fff0b0' : color);
    if (['cast', 'holy', 'note', 'command'].includes(pose)) for (let i = 0; i < 2; i++) {
      const b = time * 5 + i * Math.PI; px(hx + Math.cos(b) * 5, hy + Math.sin(b) * 3 - 4, 1, 1, color);
    }
  } else if (u > .24 && u < .85) {
    const reach = Math.max(8, (p.reach || 20) * sc * 1.15), alpha = Math.sin(k * Math.PI);
    g.globalAlpha = Math.max(.2, alpha);
    if (pose === 'slash' || pose === 'cross') {
      if (pose === 'cross') {
        for (const side of [-1, 1]) {
          const b = a + side * .6, cx = x + Math.cos(a) * reach * .6, cy = y + Math.sin(a) * reach * .6;
          chargedLine(cx - Math.cos(b) * 7, cy - Math.sin(b) * 7, cx + Math.cos(b) * 7, cy + Math.sin(b) * 7, color, 2);
        }
      } else {
        const half = w.kind === 'greatsword' ? .35 : Math.min(w.arc * 1.15, 1.3);
        const r = reach - 2, from = a - half, to = a + half;
        g.globalAlpha = Math.max(.35, alpha * .65); g.fillStyle = '#4d8bd8';
        g.beginPath(); g.arc(x, y, r, from, to); g.arc(x, y, Math.max(2, r - 5), to, from, true); g.closePath(); g.fill();
        g.globalAlpha = Math.max(.55, alpha); g.strokeStyle = '#e7f8ff'; g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, r, from, to); g.stroke();
        g.globalAlpha = .45; g.strokeStyle = '#75b7ff'; g.lineWidth = 1;
        g.beginPath(); g.arc(x, y, Math.max(2, r - 7), from + .1, to - .1); g.stroke();
        const tip = from + (to - from) * k, tx = x + Math.cos(tip) * r, ty = y + Math.sin(tip) * r;
        g.globalAlpha = 1; px(tx - 2, ty, 5, 1, '#ffffff'); px(tx, ty - 2, 1, 5, '#ffffff');
      }
    } else if (pose === 'thrust') {
      chargedLine(x + Math.cos(a) * 5, y + Math.sin(a) * 5, x + Math.cos(a) * reach * k, y + Math.sin(a) * reach * k, color, 2);
      if (w.kind === 'whip') px(x + Math.cos(a) * reach - 1, y + Math.sin(a) * reach - 1, 3, 3, '#fff3cc');
    } else if (pose === 'slam') {
      const tx = x + Math.cos(a) * reach * .6, ty = y + Math.sin(a) * reach * .6;
      for (let i = -2; i <= 2; i++) chargedLine(tx, ty, tx + i * 3, ty + Math.abs(i) * 2 + 2, color);
    } else if (pose === 'arrow' || pose === 'throw') {
      chargedLine(hx, hy, hx + Math.cos(a) * 9, hy + Math.sin(a) * 9, color, 2);
    } else if (pose === 'note') {
      for (const r of [5 + k * 8, 3 + k * 5]) { g.strokeStyle = color; g.lineWidth = 1; g.beginPath(); g.arc(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, r, a - .7, a + .7); g.stroke(); }
    } else if (pose === 'holy') {
      const tx = hx + Math.cos(a) * 9, ty = hy + Math.sin(a) * 9;
      px(tx - 1, ty - 6, 2, 12, '#fff1ad'); px(tx - 4, ty - 3, 8, 2, '#fff9e5');
      g.strokeStyle = '#d7bd61'; g.lineWidth = 1; g.beginPath(); g.arc(tx, ty, 8, 0, Math.PI * 2); g.stroke();
    } else if (pose === 'cast') {
      const tx = hx + Math.cos(a) * 8, ty = hy + Math.sin(a) * 8;
      g.strokeStyle = '#a8bfff'; g.lineWidth = 1; g.strokeRect(tx - 5, ty - 5, 10, 10); px(tx - 1, ty - 1, 3, 3, '#ffffff');
    } else { px(hx + Math.cos(a) * 7 - 1, hy + Math.sin(a) * 7 - 1, 3, 3, color); }
  }
  g.restore(); return true;
}
const CHARGE_DRAW_SHOT = drawShot;
function chargedProjectileStyle(s) {
  return s.attackLevel && s.friendly && ['arrow', 'cast', 'holy', 'note'].includes(s.chargeStyle) ? s.chargeStyle : '';
}
drawShot = function (s, emissive = false) {
  const style = chargedProjectileStyle(s);
  if (!style) { CHARGE_DRAW_SHOT(s, emissive); return; }
  if (!emissive) return;
  const a = Math.hypot(s.vx, s.vy) > 0 ? Math.atan2(s.vy, s.vx) : s.baseA || 0;
  g.save(); g.translate(s.x, s.y); g.rotate(a);
  if (style === 'arrow') {
    // Heavy golden arrow, long shaft and broad head; the faded fletching is only a trail.
    g.globalAlpha = .25; px(-19, -2, 11, 4, '#d7aa50');
    g.globalAlpha = 1; px(-9, -1, 16, 2, '#211927'); px(-8, 0, 15, 1, '#ffe5a0');
    for (let i = 0; i < 4; i++) px(7 - i, -i, 1, i * 2 + 1, i < 2 ? '#fff7dc' : '#e9b849');
    chargedLine(-9, 0, -13, -3, '#e9c16b'); chargedLine(-9, 0, -13, 3, '#e9c16b');
  } else if (style === 'holy') {
    // A traveling cross with a halo, visibly distinct from the ordinary round holy bolt.
    g.globalAlpha = .3; px(-10, -2, 10, 4, '#e4c867'); g.globalAlpha = 1;
    g.strokeStyle = '#d6b853'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.stroke();
    px(-7, -1, 14, 2, '#fff1ad'); px(1, -5, 2, 10, '#fff9e5'); px(0, -1, 4, 2, '#ffffff');
  } else if (style === 'note') {
    // The leading crescent is the projectile; translucent trailing crescents show the sound wave.
    for (let i = 2; i >= 0; i--) {
      g.globalAlpha = i ? .22 : 1; g.strokeStyle = i ? '#d78fb9' : '#ffd3ed'; g.lineWidth = i ? 1 : 2;
      g.beginPath(); g.arc(-i * 4, 0, Math.max(4, s.r) + i, -.95, .95); g.stroke();
    }
    g.globalAlpha = 1; px(-2, -4, 1, 6, '#fff2fb'); px(-4, 1, 3, 2, '#ffb1de');
  } else {
    // Faceted energy crystal and rune collar. Alternate twin colors without changing their trajectories.
    const color = s.chargePart ? '#cdadff' : '#94caff', r = s.motion === 'orb' ? Math.max(5, s.r) : 4;
    g.globalAlpha = .3; chargedLine(-15, 0, -4, 0, color, 3); g.globalAlpha = 1;
    for (let i = -r; i <= r; i++) { const h = Math.max(1, r - Math.abs(i)); px(i, -h / 2, 1, h, '#242440'); if (h > 1) px(i, -h / 2 + 1, 1, h - 1, color); }
    px(-1, -1, 3, 2, '#ffffff');
    g.strokeStyle = color; g.lineWidth = 1; g.beginPath(); g.ellipse(-4, 0, 2, r + 2, 0, 0, Math.PI * 2); g.stroke();
    if (s.motion === 'orb') { g.beginPath(); g.arc(0, 0, r + 1, -.8, .8); g.stroke(); }
  }
  g.restore();
};

// Bounded impact marks share the existing cosmetic-event stream in co-op.
function chargedImpact(x, y, style, ctx) {
  const budget = combatAttackState(ctx);
  if ((budget.impactFxCount || 0) >= 4) return;
  budget.impactFxCount = (budget.impactFxCount || 0) + 1;
  G.rings.push({ x, y, max: 9, col: [200, 230, 255], life: .18, t: 0, chargeStyle: style });
}
function drawChargedImpact(r, u) {
  g.save(); g.globalAlpha = 1 - u;
  if (r.chargeStyle === 'holy') {
    const radius = 6 + u * 5;
    g.strokeStyle = '#e9d68b'; g.lineWidth = 1; g.beginPath(); g.arc(r.x, r.y, radius, 0, Math.PI * 2); g.stroke();
    px(r.x - 1, r.y - 7, 2, 14, '#fff1ad'); px(r.x - 5, r.y - 3, 10, 2, '#fff9e5');
  } else {
    const radius = 3 + u * 8;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + .25, inner = Math.max(0, radius - 4);
      chargedLine(r.x + Math.cos(a) * inner, r.y + Math.sin(a) * inner, r.x + Math.cos(a) * radius, r.y + Math.sin(a) * radius, i % 2 ? '#7fb9ff' : '#fff6d5');
    }
    if (u < .4) { px(r.x - 2, r.y - 1, 5, 2, '#ffffff'); px(r.x - 1, r.y - 2, 2, 5, '#ffffff'); }
  }
  g.restore();
}
