'use strict';
// ============================================================ run state & flow
const G = { mode: 'title', parts: [], floats: [], shots: [], enemies: [], pickups: [], chests: [], uiCoins: [], rings: [], bolts: [],
  warns: [], later: [], flames: [], eq: { weapon: null, armor: null, boots: null, trinkets: [] }, gold: 0, floor: 1, chapter: 1, gfloor: 1,
  act: 1, diff: 0, startCh: 1, shake: 0, hitstop: 0, flash: 0, hurtFlash: 0, fade: 0, time: 0, camOff: [0, 0], runKills: 0, runSouls: 0 };
const PRICE = [40, 70, 120, 200];
// "幕名 区域-层" label for HUD / banners / end screen
const floorLabel = () => `${curAct().name} ${G.chapter}-${G.floor}`;

// one run = one act, starting from region ch (1-based) at difficulty d (index into DIFFS)
function newRun(ch = 1, act = 1, d = 0) {
  const campMeal = takeCampMeal();
  Object.assign(G, { mode: 'play', campMeal, parts: [], floats: [], shots: [], enemies: [], uiCoins: [], rings: [], bolts: [], warns: [], later: [], flames: [],
    eq: { weapon: campStarterItem(), armor: null, boots: null, trinkets: [] }, gold: lv('gold') * 50, shake: 0, hitstop: 0, flash: 0,
    hurtFlash: 0, fade: 1, cine: null, choice: null, trans: null, runTime: 0, banner: null, endT: 0, runKills: 0, runSouls: 0,
    act, diff: d, startCh: ch, banked: false, soulGain: 0, phoenixUsed: false, undyingUsed: false, runUp: {}, shrineUI: null, cold: 0, howlT: 0,
    minions: [], holyShield: 0, ins: 0, cls: {} });
  G.player = newPlayer(RPW / 2, RPH / 2 + 30);
  recalcStats();
  startFloor(ch, 1);
  G.trans = { t: 0, out: 0, fn: () => {}, done: true };      // fade in from black
}
function startFloor(ch, fi) {
  titleMenuRememberChapter(G.act, ch);
  const first = ch === G.startCh && fi === 1;
  G.chapter = ch; G.floor = fi; G.gfloor = (ch - 1) * CONFIG.floorsPerRegion + fi; G.rooms = genFloor(ch, fi, G.act);
  const n = G.gfloor;
  for (const r of G.rooms.values()) {
    r.chests = []; r.pickups = [];
    if (r.type === 'treasure') r.chests.push(mkChest(RPW / 2, RPH / 2 + 6, Math.max(curDiff().chestMin, n >= 3 && rand() < 0.5 ? 2 : 1)));
    if (r.type === 'shop') buildShop(r, n);
    if (r.type === 'altar') r.altar = { x: RPW / 2, y: RPH / 2 + 2, used: false, item: rollItem(rand() < 0.25 + n * 0.03 ? 3 : 2) };
    if (r.type === 'fountain') r.fountain = { x: RPW / 2, y: RPH / 2 + 2, used: false };
    if (r.type === 'shrine') r.shrine = { x: RPW / 2, y: RPH / 2 + 4 };
    if (r.type === 'challenge') r.wave = 2;
  }
  const start = G.rooms.get(rkey(0, 0));
  if (first) {
    start.chests.push(mkChest(RPW / 2, RPH / 2 - 8, 0, 1 + lv('start')));   // starter chest; talent raises its minimum tier
    for (let i = 0; i < (ch - 1) * CONFIG.catchUpChests; i++)              // starting deeper: catch-up chests
      start.chests.push(mkChest(RPW / 2 + (i % 3 - 1) * 42, RPH / 2 - 34 + Math.floor(i / 3) * 25, 1 + (i % 2)));
  }
  enterRoom(start, null);
  showBanner(`${chap().name} · 第 ${fi} 层`, fi === 1 && chap().mechTip ? chap().mechTip : `${curAct().name} · 区域 ${ch}/${curAct().regions.length} · ${curDiff().name}`);
  if (!first && lv('heal')) G.player.heal(lv('heal') * 2);
}
function buildShop(r, n) {
  const items = [], used = new Set();
  for (const t of [rand() < 0.3 + n * 0.04 ? 2 : 1, rand() < 0.08 * n ? 2 : rand() < 0.5 ? 1 : 0, rand() < 0.03 * n ? 3 : rand() < 0.5 ? 1 : 0]) {
    const it = rollItem(t, used); used.add(it.id); items.push(it); }
  items.push(POTION);
  // merchant stall backs onto the top wall; shifted aside when the door is on the top wall. Door lanes stay clear.
  const sx = r.doors.n ? 76 : 0, cx = RPW / 2 + sx;
  r.stall = { x0: cx - 68, y0: 16, x1: cx + 68, y1: 72, cx };
  r.shop = items.map((it, i) => ({ item: it, x: cx + (i - 1.5) * 30, y: 64,
    price: Math.max(1, Math.round((it === POTION ? 30 : PRICE[it.tier] + rint(0, 3) * 5) * shopMul())), sold: false }));
}
function mkChest(x, y, tier, force = 0) { return { x, y, tier, force, open: 0, opened: false }; }
const ROOM_BANNER = { treasure: ['宝藏房', ''], shop: ['旅行商人', '用金币换取装备与补给'], altar: ['鲜血祭坛', '以生命换取宝物'],
  fountain: ['生命之泉', '饮用以回复生命'], shrine: ['属性神殿', '花费金币强化基础属性'], challenge: ['挑战房', '击退两波敌人，获得珍贵宝箱'] };
function enterRoom(r, dir, options = {}) {
  const firstVisit = !r.visited;
  G.room = r; r.visited = true; G.chests = r.chests; G.pickups = r.pickups; if (!options.travel) G.corrupt = 0;
  if (G.player) { G.player.tmul = 1; cancelPlayerCharge(G.player); }
  G.shots = []; G.enemies = []; G.parts = []; G.floats = []; G.rings = []; G.bolts = []; G.warns = []; G.later = []; G.flames = [];
  const p = G.player, e = dir ? OPP[dir] : null;
  if (!e) { p.x = RPW / 2; p.y = RPH / 2 + 30; }
  else if (e === 'w') { p.x = TS * 1.6; p.y = RPH / 2 + 4; }
  else if (e === 'e') { p.x = RPW - TS * 1.6; p.y = RPH / 2 + 4; }
  else if (e === 'n') { p.x = RPW / 2; p.y = TS * 1.6 + 6; }
  else { p.x = RPW / 2; p.y = RPH - TS * 1.2; }
  G.camOff = worldCamera(r, p);
  p.kbx = p.kby = 0; p.ivx = p.ivy = 0; p.rolling = 0;
  if (!options.travel) { p.inv = Math.max(p.inv, 0.5); p.shieldUp = !!p.shield; }
  p.orbHit.clear();
  p.entryX = p.x; p.entryY = p.y;                             // where void pits send you back to
  if (options.travel) floorTravelPlace(options.spots[0]);
  else classHook('enter', r);                                 // minions follow you through the door
  if (!r.cleared) { r.locked = true; spawnWave(r); }
  else r.locked = false;
  if (ROOM_BANNER[r.type] && !r.seen) showBanner(...ROOM_BANNER[r.type], r.type === 'challenge' ? '#ff8a40' : undefined);
  r.seen = true;
  if (firstVisit && ['shop', 'shrine', 'treasure', 'fountain', 'altar', 'challenge'].includes(r.type)) townServiceEvent('visit', { type: r.type });
}
function spawnWave(r) {
  const C = chap(), f = G.floor, p = G.player;
  if (r.type === 'boss') { const D = EDEF[C.boss];
    spawnEnemy(C.boss, RPW / 2, RPH / 2 - 6, 1.6); showBanner(D.name, C.bossSub, '#ff4058'); SFX.boss();
    if (curDiff().bossElite) { const s = freeSpot(r, 60, p.x, p.y); rollEliteAffixes(spawnEnemy(C.elite, s.x, s.y, 2.2)); }
    return; }
  let budget = (3 + f * 1.4 + (G.chapter - 1) * 1.2 + r.dist * 0.4) * curDiff().budget;
  if (r.type === 'challenge') budget += 2;
  if (r.type === 'stairs') { const s = freeSpot(r, 60, p.x, p.y); rollEliteAffixes(spawnEnemy(C.elite, s.x, s.y, 0.9)); budget -= 2;
    showBanner(EDEF[C.elite].name, '击败守卫以开启楼梯', '#b45aff'); }
  if (r.type === 'challenge' && r.wave === 1) { const s = freeSpot(r, 60, p.x, p.y); rollEliteAffixes(spawnEnemy(C.elite, s.x, s.y, 0.9)); budget -= 3; }
  if (r.type === 'combat' && rand() < curDiff().elite) { const s = freeSpot(r, 60, p.x, p.y); rollEliteAffixes(spawnEnemy(C.elite, s.x, s.y, 0.9)); budget -= 3; }
  mechCall('spawn');                                          // map mechanics can add their own spawns (egg sacs ...)
  const pool = C.pool.filter(q => f >= q[3]), tw = pool.reduce((a, q) => a + q[2], 0);
  while (budget > 0) {
    let k = rnd(0, tw), q = pool[0]; for (const it of pool) { if ((k -= it[2]) <= 0) { q = it; break; } }
    const s = freeSpot(r, 70, p.x, p.y, EDEF[q[0]].fly ? 'fly' : 'walk');
    spawnEnemy(q[0], s.x, s.y, 0.5 + rnd(0, 0.5)); budget -= q[1];
  }
}
function roomCleared() {
  const r = G.room, C = chap();
  if (r.cleared) return;                                    // only the first clear is a real progression event
  if (r.type === 'challenge' && r.wave > 1) { r.wave--; SFX.wave2(); showBanner('第二波!', '', '#ff8a40'); spawnWave(r); return; }
  r.locked = false; r.cleared = true; SFX.door(); shake(2);
  classHook('clear', r);
  if (['combat', 'challenge', 'stairs', 'boss'].includes(r.type)) townServiceEvent('clear');
  const spot = (x, y) => boxHits(r, x, y, 8, 6, 'walk') || hazardAt(r, x, y - 3) ? freeSpot(r, 0, 0, 0) : { x, y };
  if (r.type === 'boss') {
    r.stairs = { x: RPW / 2, y: 44, portal: true };
    const easy = G.act === 1 && G.chapter === 1;
    const s = spot(RPW / 2, RPH / 2 + 10); spawnChest(s.x, s.y, easy ? 2 : 3, easy ? 3 : 0);
    showBanner(`${EDEF[C.boss].name} 已被击败`, !lastRegion() ? '穿过传送门前往下一个区域' : '打开宝箱领取战利品', '#ffb432');
    regionBeaten(G.act, G.chapter, G.diff);
  } else if (r.type === 'stairs') {
    r.stairs = { x: RPW / 2, y: RPH / 2 };
    const s = spot(RPW / 2, RPH / 2 + 34); spawnChest(s.x, s.y, rand() < 0.35 ? 2 : 1);
  } else if (r.type === 'challenge') {
    const s = spot(RPW / 2, RPH / 2); spawnChest(s.x, s.y, 2); dropSouls(RPW / 2, RPH / 2, 3);
  } else if (rand() < 0.3 + G.player.luck * 0.5) {
    const s = spot(RPW / 2, RPH / 2); spawnChest(s.x, s.y, rand() < 0.25 ? 1 : 0);
  }
}
function showBanner(title, sub, col = '#ffe6b0') { G.banner = { title, sub, col, t: 0 }; }

function transition(fn, out = 0.3) { if (!G.trans) G.trans = { t: 0, out, fn, done: false }; }
function updTransition(dt) {
  const T = G.trans; if (!T) return false;
  T.t += dt;
  if (!T.done) { G.fade = clamp(T.t / T.out); if (T.t >= T.out) { T.fn(); T.done = true; T.t = 0; } }
  else { G.fade = 1 - clamp(T.t / 0.25); if (T.t >= 0.25) { G.trans = null; G.fade = 0; } }
  return true;
}
// bank this run's souls into the persistent save (once per run)
function bankSouls(win) {
  if (G.banked) return; G.banked = true;
  const bonus = win ? CONFIG.winSoulBonus : 0;
  G.soulGain = Math.round((G.runSouls + bonus) * soulMul() * curDiff().souls);
  META.souls += G.soulGain; META.runs++; META.kills += G.runKills; if (win) META.wins++;
  workshopRewardRun({ runKills: G.runKills, runSouls: G.runSouls, gfloor: G.gfloor, win: !!win });
  const P = actProg(G.act), d = P.diff[G.diff];
  d.runs++; if (win) d.wins++;
  d.best = Math.max(d.best, G.gfloor); META.best = Math.max(META.best, G.gfloor);
  if (win) { townServiceEvent('win'); if (G.diff >= 1) townServiceEvent('hardwin'); }
  saveMeta();
}
function gameOver(win) {
  G.mode = win ? 'win' : 'dead'; G.endT = 0; Input.anyPressed = false; G.cine = null; G.choice = null;
  bankSouls(win);
  if (win) { SFX.win(); G.flash = 0.3; } else { SFX.die(); shake(8); G.hitstop = 0.5;
    burst(G.player.x, G.player.y - 7, 40, ['#ff4058', '#3a64b8', '#b4bcd4'], { sp: 90, life: 0.9 }); }
}
// equip choice overlay (shop / altar purchases when the slot is already full)
function offerItem(it, onDone, canTake = null) {
  const opts = itemOptions(it);
  if (!opts) { if (!canTake || canTake()) { finishTake(it); onDone(); } return; }
  G.choice = { item: it, opts, sel: 0, onDone, canTake, t: 0 }; G.pmode = 'play'; G.mode = 'choice';
}
function updChoice(dt) {
  const C = G.choice; C.t += dt;
  const v = navPressed(); if (v) { C.sel = (C.sel + v + C.opts.length) % C.opts.length; SFX.move(); }
  if (C.t < 0.2) return;
  if (confirmPressed()) {
    if (!C.canTake || C.canTake()) { finishTake(C.item, C.opts[C.sel]); C.onDone(); SFX.select(); }
    G.choice = null; G.mode = 'play';
  }
  else if (backPressed()) { G.choice = null; G.mode = 'play'; SFX.deny(); }
}
// context-sensitive [E] interactions: chests, shop, altar, fountain, stairs
function updPrompt() {
  G.prompt = null;
  const p = G.player, R = G.room;
  if (G.enemies.length) return;
  let best = null, bd = 20;
  const near = (x, y, o) => { const d = dist(p.x, p.y, x, y); if (d < bd) { bd = d; best = o; } };
  for (const c of G.chests) if (!c.opened) near(c.x, c.y + 4, { type: 'chest', c });
  if (R.shop) for (const s of R.shop) if (!s.sold) near(s.x, s.y + 14, { type: 'shop', s });
  if (R.altar && !R.altar.used) near(R.altar.x, R.altar.y + 6, { type: 'altar' });
  if (R.fountain && !R.fountain.used) near(R.fountain.x, R.fountain.y + 6, { type: 'fountain' });
  if (R.shrine) near(R.shrine.x, R.shrine.y + 8, { type: 'shrine' });
  if (R.stairs) near(R.stairs.x, R.stairs.y, { type: 'stairs' });
  if (!best) return;
  const k = '', sub = it => `${slotText(it)} · ${itemDescriptionLines(it).filter(l => !l.startsWith('“')).join('，')}`;
  if (best.type === 'chest') G.prompt = { text: k + '打开宝箱', x: best.c.x, y: best.c.y + OY + 14 };
  if (best.type === 'shop') { const s = best.s;
    G.prompt = { text: `${k}购买 ${s.item.name}  ${s.price} 金币`, sub: sub(s.item), col: TIERS[s.item.tier].col, x: s.x, y: s.y + OY + 34, shop: s }; }
  if (best.type === 'altar') { const it = R.altar.item;
    G.prompt = { text: `${k}献祭 1 颗心：${it.name}`, sub: sub(it), col: TIERS[it.tier].col, x: R.altar.x, y: R.altar.y + OY + 16 }; }
  if (best.type === 'fountain') G.prompt = { text: k + '饮用泉水（回复全部生命）', x: R.fountain.x, y: R.fountain.y + OY + 16 };
  if (best.type === 'shrine') G.prompt = { text: k + '祈愿 · 强化属性', sub: `持有 ${G.gold} 金币`, col: '#ffd060', x: R.shrine.x, y: R.shrine.y + OY + 18 };
  if (best.type === 'stairs') G.prompt = { text: k + (R.stairs.portal ? (!lastRegion() ? `前往 ${regionOf(G.act, G.chapter + 1).name}` : '离开地牢') : `前往第 ${G.floor + 1} 层`),
    x: R.stairs.x, y: R.stairs.y + OY + 15 };
  if (!consume('interact')) return;
  if (best.type === 'chest') startChest(best.c);
  else if (best.type === 'shop') {
    const s = best.s;
    if (G.gold < s.price) { addFloat(s.x, s.y - 14, '金币不足', '#ff6070'); SFX.deny(); return; }
    offerItem(s.item, () => { G.gold -= s.price; s.sold = true; townServiceEvent('goldspend', { amount: s.price }); SFX.buy();
      addFloat(s.x, s.y - 14, s.item.name, TIERS[s.item.tier].col, true);
      burst(s.x, s.y - 6, 20, [TIERS[s.item.tier].col, '#ffffff'], { sp: 70, life: 0.5, up: true }); });
  } else if (best.type === 'altar') {
    const A = R.altar;
    if (p.hp <= 2) { addFloat(A.x, A.y - 14, '生命不足', '#ff6070'); SFX.deny(); return; }
    offerItem(A.item, () => { A.used = true; p.hp = Math.round((p.hp - 2) * 1000) / 1000; townServiceEvent('altar'); G.hurtFlash = 0.3; SFX.hurt(); shake(4);
      burst(A.x, A.y - 8, 30, ['#ff4058', '#ffffff', TIERS[A.item.tier].col], { sp: 90, life: 0.6, up: true });
      addFloat(A.x, A.y - 14, A.item.name, TIERS[A.item.tier].col, true); }, () => {
      // Co-op combat continues while the choice is open; recheck before granting or selling the item.
      if (A.used || p.hp <= 2) { addFloat(A.x, A.y - 14, A.used ? '祭坛已使用' : '生命不足', '#ff6070'); SFX.deny(); return false; }
      return true;
    });
  } else if (best.type === 'fountain') {
    const fk = curDiff().fountain, hpBefore = p.hp; R.fountain.used = true; SFX.heal();
    if (fk >= 1) { p.hp = p.maxHp; addFloat(p.x, p.y - 20, '生命全满', '#82e68c', true); }
    else p.heal(Math.max(2, Math.round(p.maxHp * fk / 2) * 2));      // whole hearts only
    if (p.hp > hpBefore) townServiceEvent('heal', { amount: p.hp - hpBefore, source: 'fountain' });
    burst(R.fountain.x, R.fountain.y - 6, 30, ['#6ac8ff', '#d0f0ff', '#ffffff'], { sp: 80, life: 0.6, up: true });
  } else if (best.type === 'shrine') openShrine();
  else {
    SFX.stairs();
    if (R.stairs.portal) transition(() => !lastRegion() ? startFloor(G.chapter + 1, 1) : gameOver(true), 0.6);
    else transition(() => startFloor(G.chapter, G.floor + 1), 0.5);
  }
}
function checkExits() {
  const p = G.player, R = G.room;
  let d = null;
  if (p.x < 3) d = 'w'; else if (p.x > RPW - 3) d = 'e'; else if (p.y < 6) d = 'n'; else if (p.y > RPH - 2) d = 's';
  if (!d || !R.doors[d]) return;
  const n = G.rooms.get(rkey(R.gx + DIRS[d][0], R.gy + DIRS[d][1]));
  transition(() => enterRoom(n, d), 0.18);
}
// ============================================================ main update
function update(dt) {
  if (!combatInput() || G.trans || COOP_UI.open) cancelPlayerCharge(G.player);
  if (typeof coopRuntimeUpdate === 'function' && coopRuntimeUpdate(dt)) return;
  G.simDt = 0;                                  // set by updParts; stays 0 on frames where the world is frozen
  if (G.mode === 'title') { G.time += dt; titleMenuUpdate(dt); return; }
  if (G.mode === 'journal') { updateQuestJournal(); return; }
  if (consume('journal') && openQuestJournal()) return;
  G.time += dt; G.goldPulse = (G.goldPulse || 0) - dt; G.soulPulse = (G.soulPulse || 0) - dt;
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 2.4) G.banner = null; }
  if (consume('mute')) toggleMute();
  G.shake = Math.max(0, G.shake - dt * 30); G.flash -= dt; G.hurtFlash -= dt;
  if (G.mode === 'town') { updTown(dt); Input.pressed.clear(); Input.anyPressed = false; return; }
  if (G.mode === 'dead' || G.mode === 'win') {
    G.endT += dt; updParts(dt); updTransition(dt);
    if (G.endT < 1.2) Input.anyPressed = false;
    else if (Input.anyPressed) { Input.anyPressed = false; Input.pressed.clear(); transition(() => enterTown(true), 0.4); }
    return;
  }
  if (G.mode === 'pause') {
    if (consume('pause')) G.mode = G.pmode || 'play';
    else if (consume('restart') && G.pmode !== 'town') { bankSouls(false); enterTown(true); }
    Input.anyPressed = false; Input.pressed.clear(); return;
  }
  if (G.mode === 'shrine') { updShrine(dt); updParts(dt); Input.pressed.clear(); Input.anyPressed = false; return; }
  if (G.mode === 'choice') { updChoice(dt); updParts(dt); Input.pressed.clear(); Input.anyPressed = false; return; }
  if (consume('pause')) { G.pmode = G.mode; G.mode = 'pause'; resetInput(); return; }
  if (updTransition(dt)) { updParts(dt); return; }
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  if (G.mode === 'chest') { updChest(dt); updPickups(dt); updParts(dt); updChestLids(dt); }
  else {
    G.runTime += dt;
    updPlayer(dt); updEnemies(dt); updShots(dt); updWarns(dt); updPickups(dt); updParts(dt); updChestLids(dt);
    mechCall('update', dt); classHook('update', dt);
    if (G.mode !== 'play') return;
    if (G.room.locked && !G.enemies.length) roomCleared();
    updPrompt(); checkExits();
  }
  Input.pressed.clear(); Input.anyPressed = false;
}
function returnToTitle() {
  if (G.mode !== 'pause' || G.pmode !== 'town') return;
  saveMeta(); G.mode = 'title'; G.pmode = null; G.banner = null; G.trans = null; G.fade = 0;
  titleMenuReset();
}
let last = 0;
let gameSimDebt = 0, gameSimRunId = null;
const GAME_SIM_STEP = 1 / 60, GAME_SIM_MAX_GAP = .25;
let gameFramePending = null, gameFrameGeneration = 0;
let stageEl = null, stageCursor = null;   // cached #stage element and last cursor written (avoid a DOM lookup + style write per frame)
function scheduleGameFrame() {
  const generation = ++gameFrameGeneration;
  if (gameFramePending) {
    if (gameFramePending.kind === 'timer' && typeof clearTimeout === 'function') clearTimeout(gameFramePending.id);
    else if (gameFramePending.kind === 'raf' && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(gameFramePending.id);
    gameFramePending = null;
  }
  const frame = now => {
    if (generation !== gameFrameGeneration) return;
    gameFramePending = null; if (!last) last = now; loop(now);
  };
  const networkConnected = typeof COOP !== 'undefined' && COOP.connected;
  if (networkConnected && document.hidden && typeof setTimeout === 'function') {
    gameFramePending = { kind: 'timer', id: setTimeout(() => frame(typeof performance !== 'undefined' ? performance.now() : Date.now()), 16) };
  } else gameFramePending = { kind: 'raf', id: requestAnimationFrame(frame) };
}
function updateGameStep(dt) {
  const mode = G.mode, context = uiContext();
  mobileInputUpdate();
  update(dt);
  if (typeof FORGE_UI !== 'undefined' && FORGE_UI.nameEdit && (G.mode !== 'town' || TOWN.menu !== (FORGE_UI.nameEdit.menu || 'artificer'))) forgeUINameCancel();
  if (G.mode !== mode || uiContext() !== context) resetInput();
}
function gameNetworkFrameId() {
  if (typeof COOP === 'undefined' || !COOP.connected) return null;
  return COOP.phase === 'run' ? COOP.runId : coopIsTap() ? 'tap-town:' + COOP.sessionId : null;
}
function loop(now) {
  const elapsed = Math.max(0, (now - last) / 1000 || 0); last = now;
  retryMetaSave(elapsed);
  tapProgressTick();
  bgmUpdateVolume();
  syncPointer();
  const runId = gameNetworkFrameId();
  const viewFrame = runId && COOP.role === 'client' && COOP.phase === 'run' && coopRuntimeIsActive();
  if (viewFrame) COOP_VIEW.frameDriven = true;
  try {
  if (runId !== gameSimRunId) { gameSimDebt = 0; gameSimRunId = runId; }
  if (runId) {
    // Bounded catch-up keeps host simulation independent of drawing without a runaway loop after sleep.
    const inputRate = COOP.role === 'client' ? COOP.phase === 'run' ? COOP_VIEW.inputRate : COOP_TOWN.inputRate : 1;
    gameSimDebt = Math.min(gameSimDebt + elapsed * inputRate, GAME_SIM_MAX_GAP);
    let simulated = 0;
    while (gameSimDebt + 1e-9 >= GAME_SIM_STEP) {
      gameSimDebt = Math.max(0, gameSimDebt - GAME_SIM_STEP);
      updateGameStep(GAME_SIM_STEP); simulated += GAME_SIM_STEP;
      if (gameNetworkFrameId() !== runId) { gameSimDebt = 0; break; }
    }
    if (COOP.role === 'host') G.simDt = simulated;
  } else updateGameStep(Math.min(.05, elapsed));
  } finally { if (viewFrame) COOP_VIEW.frameDriven = false; }
  // Input/prediction may temporarily run at 90%; presentation follows every display frame.
  if (viewFrame && coopRuntimeIsActive() && COOP_RUNTIME.lastApplied >= 0) coopViewTick(0, Math.min(elapsed, .25));
  // A minimized host still simulates and sends snapshots, without drawing invisible canvases.
  if (!document.hidden) {
    renderWorld(G.time); drawHUDLow(); drawUI();
    const cursor = pointerHit() ? 'pointer' : combatInput() ? 'crosshair' : 'default';
    if (cursor !== stageCursor) { stageCursor = cursor; (stageEl || (stageEl = document.getElementById('stage'))).style.cursor = cursor; }
  }
  scheduleGameFrame();
}
function boot() {
  initCostumeArt();
  titleMenuInit();
  loadMeta();
  initRender(); initUI(); initDesktopInput(); initMobileInput();
  enterTown(); G.mode = 'title'; G.trans = null; G.fade = 0; G.banner = null;
  titleMenuReset();
  scheduleGameFrame();
}
window.addEventListener('load', boot);
// Foreground drawing follows display refresh; background network sessions still advance on a timer.
document.addEventListener('visibilitychange', () => { if (typeof COOP !== 'undefined' && COOP.connected) scheduleGameFrame(); });
