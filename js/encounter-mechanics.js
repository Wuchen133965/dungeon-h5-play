'use strict';
// 1.9.3: bounded elite combinations and the remaining three boss mechanics.
// Each sequence uses shared, serializable warnings; only authority runs callbacks.
function encounterCancel(e) {
  e.encounterToken = (e.encounterToken || 0) + 1;
  G.warns = G.warns.filter(w => !(w.encounter && ENEMY_CAST_OWNERS.get(w) === e));
  cancelTrackedWarn(e); e.encounter = null; e.armor = null; e.noContact = false;
}
function encounterAfterImpact(e) {
  if (e.hp > 0 && e.encounter && (e.armorBroken || e.broken > 0 || e.frozen > 0 || e.meleeStagger > 0)) {
    e.armorBroken = false; encounterRest(e);
  }
}
function encounterRest(e, time = 1.3) {
  encounterCancel(e); e.state = 0; e.kbx = e.kby = 0;
  if (EDEF[e.kind].boss) bossMechanicRest(e, time);
  else { e.t = 1.8; e.eliteNext = false; enemyPunish(e, time); }
}
function encounterWarn(e, shape, delay, hit) {
  const token = e.encounterToken;
  return enemyCombatCall(e, () => {
    const w = trackedWarn(e, shape, delay, mark => {
      if (e.hp <= 0 || e.encounterToken !== token) return;
      if (e.armorBroken) { e.armorBroken = false; encounterRest(e); return; }
      hit(mark);
    }, [255, 100, 90]);
    w.encounter = true; return w;
  });
}
// One short footprint at impact, reused by the snapshot's existing local FX stream.
function encounterStrike(w) {
  shapeHit(w, 1);
  const fx = { encounter: true, life: .22, t: 0, max: w.r, col: [255, 148, 100] };
  for (const key of ['shape', 'x', 'y', 'a', 'r', 'len', 'w', 'arc', 'r0', 'r1']) if (w[key] !== undefined) fx[key] = w[key];
  G.rings.push(fx);
}
const ELITE_COMBOS = {
  elite: { name: '跳压 · 外环', shapes: (e, p) => [
    { shape: 'circle', x: p.x, y: p.y - 3, r: 18 }, { shape: 'donut', x: p.x, y: p.y - 3, r0: 22, r1: 44 }] },
  queen: { name: '蛛刃 · 交错', shapes: (e, p, a) => [-.35, .35].map(k => ({ shape: 'line', x: e.x, y: e.y - 3, a: a + k, len: 100, w: 12 })) },
  colossus: { name: '熔锤 · 外环', shapes: (e, p, a) => [
    { shape: 'cone', x: e.x, y: e.y - 3, a, len: 48, arc: .65 }, { shape: 'donut', x: e.x, y: e.y - 3, r0: 24, r1: 55 }] },
  frostGolem: { name: '裂冰 · 双线', shapes: (e, p, a) => [-18, 18].map(k => ({ shape: 'line', x: e.x - Math.sin(a) * k, y: e.y - 3 + Math.cos(a) * k, a, len: 125, w: 12 })) },
  bogKing: { name: '毒涌 · 外环', shapes: (e, p) => [
    { shape: 'circle', x: p.x, y: p.y - 3, r: 15 }, { shape: 'donut', x: p.x, y: p.y - 3, r0: 22, r1: 48 }] },
  sandColossus: { name: '沙刺 · 横扫', shapes: (e, p, a) => [
    { shape: 'line', x: e.x, y: e.y - 3, a, len: 120, w: 14 }, { shape: 'cone', x: e.x, y: e.y - 3, a, len: 50, arc: .7 }] },
  cloudGolem: { name: '雷线 · 换向', shapes: e => [0, Math.PI / 2].map(a => ({ shape: 'rect', x: e.x, y: e.y - 3, a, len: 150, w: 12 })) },
  voidColossus: { name: '虚空 · 内外', shapes: e => [
    { shape: 'donut', x: e.x, y: e.y - 3, r0: 24, r1: 52 }, { shape: 'cone', x: e.x, y: e.y - 3, a: Math.atan2(G.player.y - e.y, G.player.x - e.x), len: 48, arc: .6 }] },
};
function eliteComboSlot() {
  const cap = G.enemies.some(e => EDEF[e.kind].boss && e.hp > 0) ? 2 : 3;
  return G.enemies.filter(e => e.hp > 0 && e.encounter?.type === 'elite').length < cap;
}
function startEliteCombo(e, ang) {
  if (!eliteComboSlot()) return false;
  encounterCancel(e); e.armorBroken = false; e.noContact = true; e.state = 8;
  const move = ELITE_COMBOS[e.kind], p = { x: G.player.x, y: G.player.y };
  e.encounter = { type: 'elite', step: 0, shapes: move.shapes(e, p, ang) };
  if (hasAffix(e, 'armored')) enemyArmorCast(e, 1.5, 4);
  addFloat(e.x, e.y - e.h - 10, move.name, '#ffb080');
  const next = () => {
    const q = e.encounter; if (!q) return;
    encounterWarn(e, q.shapes[q.step], .75, w => {
      encounterStrike(w); SFX.slam();
      if (++q.step < q.shapes.length) next(); else encounterRest(e, 1.3);
    });
  };
  next(); return true;
}
for (const kind of Object.keys(ELITE_COMBOS)) {
  const original = AI[kind];
  AI[kind] = (e, dt, a, d) => {
    if (e.encounter?.type === 'elite') {
      if (e.armorBroken) { e.armorBroken = false; encounterRest(e); }
      return Z0;
    }
    if (!e.split && e.state === 0 && e.t <= 0 && d < 100 && e.eliteNext) {
      if (!startEliteCombo(e, a)) e.t = .2;
      return Z0;
    }
    const ready = e.state === 0 && e.t <= 0, v = original(e, dt, a, d);
    if (ready && (e.state !== 0 || e.t > 0 || e.restT > 0)) e.eliteNext = true;
    return v;
  };
}
// Every blink reveals its destination before moving, then separately warns the locked dash.
function startRiftCombo(e) {
  encounterCancel(e); e.noContact = true; e.armorBroken = false;
  e.riftCycle = (e.riftCycle || 0) % 3 + 1;
  e.encounter = { type: 'rift', left: e.riftCycle, stage: 'arrival' };
  riftArrival(e);
}
function riftArrival(e) {
  const q = e.encounter, spot = bossPartSpot(G.player, rand() < .5 ? -2 : 2);
  q.stage = 'arrival'; q.x = spot.x; q.y = spot.y;
  e.noContact = true;
  addFloat(spot.x, spot.y - 20, '裂隙现身 · ' + q.left, '#d0b0ff');
  encounterWarn(e, { shape: 'circle', x: spot.x, y: spot.y - 3, r: 12 }, .7, () => {
    e.x = q.x; e.y = q.y; e.blinkSeq = (e.blinkSeq || 0) + 1;
    q.stage = 'tell'; q.a = Math.atan2(G.player.y - e.y, G.player.x - e.x);
    encounterWarn(e, { shape: 'line', x: e.x, y: e.y - 3, a: q.a, len: 70, w: 18 }, .7, () => {
      q.stage = 'dash'; q.t = .5; q.lastX = e.x; q.lastY = e.y; q.elapsed = 0; e.noContact = false;
    });
  });
}
function updateRiftCombo(e, dt) {
  const q = e.encounter; if (!q || q.stage !== 'dash') return Z0;
  q.t -= dt; q.elapsed += dt;
  const wall = q.elapsed > .08 && Math.hypot(e.x - q.lastX, e.y - q.lastY) < 140 * dt * .25;
  q.lastX = e.x; q.lastY = e.y;
  if (q.t <= 0 || wall) {
    if (--q.left > 0) riftArrival(e); else { encounterRest(e, 1.5); addFloat(e.x, e.y - 25, '裂隙平息 · 反击!', '#9ae8aa'); }
    return Z0;
  }
  return V(q.a, 140);
}
// Three aimed falls -> two crossing lines -> recovery. No random legacy bullets underneath.
function startObserverCombo(e) {
  encounterCancel(e); e.armorBroken = false; e.noContact = true; e.hole = e.stars = null;
  e.encounter = { type: 'observer', step: 0 }; e.observerCycle = (e.observerCycle || 0) + 1;
  const fall = () => {
    const q = e.encounter; if (!q) return;
    q.x = G.player.x; q.y = G.player.y - 3;
    encounterWarn(e, { shape: 'circle', x: q.x, y: q.y, r: 12 }, .8, w => {
      encounterStrike(w); SFX.boom();
      if (++q.step < 3) fall(); else {
        addFloat(e.x, e.y - 28, '星座连线', '#d0b0ff');
        q.step = 3;
        for (const a of [Math.PI / 4, -Math.PI / 4]) encounterWarn(e,
          { shape: 'rect', x: q.x, y: q.y, a, len: 160, w: 10 }, .8, mark => {
            encounterStrike(mark); SFX.zap();
            if (++q.step === 5) { encounterRest(e, 1.5); addFloat(e.x, e.y - 28, '星光消散 · 反击!', '#9ae8aa'); }
          });
      }
    });
  };
  addFloat(e.x, e.y - 28, '落星 · 三连', '#d0b0ff'); fall();
}
function clearVoidCores(e) {
  for (const core of BOSS_MECHANIC_PARTS.get(e) || []) {
    if (core.kind !== 'voidCore') continue;
    encounterCancel(core); core.hp = 0; core.dead = true;
  }
  BOSS_MECHANIC_PARTS.delete(e); e.coreShield = false; e.noContact = false;
}
function startVoidCores(e) {
  clearVoidCores(e); e.coreStageStarted = true; e.coreShield = true; e.noContact = true;
  e.beam = e.hole = e.gates = null; e.t = 0;
  const parts = []; BOSS_MECHANIC_PARTS.set(e, parts);
  for (const [i, side] of [-1, 1].entries()) {
    const p = bossPartSpot(e, side), core = spawnEnemy('voidCore', p.x, p.y, .7);
    core.hp = core.max = Math.max(3, Math.round(e.max * .04)); core.mechanicPart = 'core'; core.t = 1 + i * .8;
    BOSS_MECHANIC_OWNER.set(core, e); parts.push(core);
  }
  addFloat(e.x, e.y - 30, '击破双核心 · 本体显露', '#ffb0ef', true);
}
function voidCoreBroken(e) {
  if (e.hp <= 0) { clearVoidCores(e); return; }
  const parts = BOSS_MECHANIC_PARTS.get(e) || [];
  if (parts.length && parts.every(c => c.hp <= 0)) {
    e.coreShield = false; e.noContact = false; bossMechanicRest(e, 2);
    addFloat(e.x, e.y - 30, '核心破碎 · 反击!', '#9ae8aa', true);
  }
}
EDEF.voidCore = { hp: 3, hw: 6, hh: 5, h: 12, spr: () => SPR.voidEye[0], gold: [0, 0],
  col: ['#d09aff', '#ff70bf'], glow: [225, 160, 255], harmless: true, name: '裂隙核心' };
AI.voidCore = (e) => {
  e.kbx = e.kby = 0;
  const owner = BOSS_MECHANIC_OWNER.get(e);
  if (!owner || owner.hp <= 0 || !owner.coreShield) { encounterCancel(e); e.hp = 0; e.dead = true; return Z0; }
  if (e.t <= 0 && !e.encounter) {
    e.encounterToken = (e.encounterToken || 0) + 1; e.encounter = { type: 'core' };
    const a = Math.atan2(G.player.y - e.y, G.player.x - e.x);
    encounterWarn(e, { shape: 'line', x: e.x, y: e.y - 3, a, len: 110, w: 10 }, .8, w => {
      if (owner.hp > 0 && owner.coreShield) encounterStrike(w);
      e.encounter = null; e.t = 2.4;
    });
  }
  return Z0;
};
function drawEncounterMechanic(e, y) {
  if (e.coreShield) {
    g.save(); g.strokeStyle = '#cb8aff'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(e.x, y - 14, 20, 24, 0, 0, Math.PI * 2); g.stroke();
    g.font = '7px sans-serif'; g.fillStyle = '#f4c8ff'; g.textAlign = 'center'; g.fillText('双核护盾', e.x, y - 42); g.restore();
  }
  if (e.kind === 'voidCore') {
    g.save(); g.strokeStyle = '#f4d4ff'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(e.x, y - 6, 9, 8, 0, 0, Math.PI * 2); g.stroke();
    g.font = '7px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#f4d4ff'; g.fillText('核心', e.x, y - 21); g.restore();
    px(e.x - 9, y - 17, 18, 2, '#241724'); px(e.x - 9, y - 17, 18 * clamp(e.hp / e.max), 2, '#db90ff');
  }
}
