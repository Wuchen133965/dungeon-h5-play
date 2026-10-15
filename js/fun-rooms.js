'use strict';
// ============================================================ 趣味房: 垂钓池 / 温泉 / 小动物
// 每层有机会出现一间（默认 65%，第 2 幕起）。它像属性神殿一样占用一间过道房，不抢挑战房、祭坛、泉水的名额，
// 房间里不刷怪、不锁门、也不会触发本幕的地图机制（机制被替换成 funroom）。
// 三种房间的收益都刻意做得很小：钓两次鱼、泡泉只清异常状态、小猫只是帮你捡东西，一层结束就散。

const FUN = {
  chance: 0.65,        // 每层出现趣味房的几率
  pondCasts: 2,        // 每座垂钓池每层的抛竿次数
  biteMin: 1.2,        // 咬钩最短等待
  biteMax: 3.0,        // 咬钩最长等待
  biteWindow: 0.9,     // 咬钩窗口，错过就脱钩
  fishHeal: 2,         // 普通渔获回复的生命（半颗心为 1）
  fishGold: [18, 34],  // 满血时改成给的金币
  rareGold: 25,        // 稀有鱼额外给的金币
  buffs: [             // 稀有鱼给的本层加成（数值都很小）
    { id: 'spd', name: '轻快', text: '本层移动速度 +12%', apply: p => { p.speed *= 1.12; } },
    { id: 'atk', name: '手感', text: '本层攻击力 +0.6', apply: p => { p.dmg += 0.6; } },
    { id: 'magnet', name: '眼尖', text: '本层拾取范围翻倍', apply: p => { p.magnet *= 2; } },
  ],
  soakTime: 3,         // 泡泉需要静止的秒数
  petMagnet: 26,       // 小猫帮你捡东西的范围
  petPickup: 1.35,     // 小猫带来的拾取范围加成
};
for (const [k, v] of Object.entries({ funRoomChance: FUN.chance, funPondCasts: FUN.pondCasts, funPetPickup: FUN.petPickup }))
  if (!(k in CONFIG)) CONFIG[k] = v;                       // 表里改过就用表里的值

// ---------------------------------------------------------------- 像素素材
SPR.cat = [['.o..o.', 'oooooo', 'oebebo', 'obbbbo', '.o..o.', '.o..o.'], ['.o..o.', 'oooooo', 'oebebo', 'obbbbo', '.o..o.', '..oo..']]
  .map(r => makeSprite(r, { o: '#2a1a10', b: '#c8a060', e: '#ffe060' }));
SPR.dog = [['o....o', 'oooooo', 'oebebo', 'owwwwo', 'obbbbo', 'oo..oo'], ['o...o.', 'oooooo', 'oebebo', 'owwwwo', 'obbbbo', '.oooo.']]
  .map(r => makeSprite(r, { o: '#1a1408', b: '#a87840', e: '#ffe060', w: '#f0e4c8' }));

// ---------------------------------------------------------------- 每层的趣味房
// genFloor 跑完之后把一间过道房改造成趣味房：清掉柱子和地形陷阱，换掉地图机制，再重新烘焙房间底图
const FUN_KINDS = ['pond', 'pet', 'spring'];
const FUN_WEIGHT = { pond: 4, pet: 4, spring: 3 };
// 把一间过道战斗房改造成趣味房（测试里也直接调它，方便指定类型）
function makeFunRoom(rooms, kind, ch, fi, act) {
  const cands = [...rooms.values()].filter(r => r.type === 'combat' && r.dist >= 1 && Object.keys(r.doors).length > 1);
  if (!cands.length) return null;
  const r = pick(cands);
  for (let i = 0; i < r.tiles.length; i++) if (r.tiles[i] >= 2) r.tiles[i] = 0;                   // 陷阱 / 冰面 / 虚空坑等等全部抹掉
  r.hz = []; r.crys = null; r.pits = null; r.plates = null; r.slits = null; r.cond = null; r.zones = null; r.gears = null;
  r.shafts = null; r.braziers = null; r.portals = null; r.crack = null; r.tide = null; r.wind = null; r.lamps = null;
  r.pond = null; r.spring = null; r.pet = null;
  r.type = kind; r.cleared = true; r.locked = false; r.mech = 'funroom';
  if (kind === 'pond') r.pond = { x: RPW / 2, y: RPH / 2 + 4, casts: CONFIG.funPondCasts ?? FUN.pondCasts, state: 'idle', t: 0, ripple: 0 };
  if (kind === 'spring') r.spring = { x: RPW / 2, y: RPH / 2 + 4, r: 30, soak: 0 };
  if (kind === 'pet') r.pet = { x: RPW / 2 - 6, y: RPH / 2 + 6, kind: rand() < 0.6 ? 'cat' : 'dog', petted: false };
  r.canvas = renderRoom(r, ch ?? G.chapter, fi ?? G.floor, act ?? G.act ?? 1);
  return r;
}
const _genFloor = genFloor;
genFloor = function (ch, fi, act) {
  const rooms = _genFloor(ch, fi, act);
  if ((act || G.act || 1) < 2 || rand() > (CONFIG.funRoomChance ?? FUN.chance)) return rooms;      // 第一幕保持原样
  makeFunRoom(rooms, pick(FUN_KINDS.flatMap(k => Array(FUN_WEIGHT[k]).fill(k))), ch, fi, act);
  return rooms;
};
Object.assign(ROOM_BANNER, {
  pond: ['清泉钓点', `按 E 抛竿，共 ${CONFIG.funPondCasts ?? FUN.pondCasts} 次机会`],
  spring: ['野温泉', '站进水里静止片刻，洗去身上的异常状态'],
  pet: ['歇脚处', '有小动物在等你'],
});

// ---------------------------------------------------------------- 房间的地面装饰与光照（走得在地面层画）
MECH.funroom = {
  update(r, dt) {
    const p = G.player;
    if (r.pond && (r.pond.state === 'wait' || r.pond.state === 'bite')) {
      const P = r.pond;
      if (dist(p.x, p.y, P.x, P.y) > 46) { P.state = 'idle'; P.t = 0; addFloat(p.x, p.y - 20, '收竿', '#a8d8ff'); }   // 走远就收竿，不浪费次数
      else if (P.state === 'wait') { P.t -= dt; P.ripple += dt * 2;
        if (P.t <= 0) { P.state = 'bite'; P.t = FUN.biteWindow; SFX.upgrade(1); addFloat(P.x, P.y - 16, '上钩了!', '#ffe080', true); } }
      else if (P.state === 'bite') { P.t -= dt; P.ripple += dt * 6;
        if (P.t <= 0) { P.state = 'idle'; P.t = 0; SFX.deny(); addFloat(P.x, P.y - 16, '脱钩…', '#a096aa'); } }
    }
    if (r.spring) {                                        // 泡泉：站在水里别动
      const S = r.spring, inside = dist(p.x, p.y, S.x, S.y) < S.r && p.rolling <= 0;
      const still = inside && !p.moving;
      S.soak = still ? S.soak + dt : Math.max(0, S.soak - dt * 2);
      if (S.soak >= FUN.soakTime) {
        S.soak = 0; const had = p.tox > 0 || p.stun > 0 || p.slow > 0 || (G.corrupt || 0) > 0;
        p.tox = 0; p.stun = 0; p.slow = 0; G.corrupt = 0;
        if (had) { SFX.heal(); addFloat(p.x, p.y - 22, '神清气爽', '#8ae0ff', true); burst(p.x, p.y - 6, 18, ['#c8f0ff', '#ffffff'], { sp: 60, life: 0.5, up: true }); }
        else if (spawnP(0.5)) addFloat(p.x, p.y - 22, '暖和', '#a8d8ff');
      }
    }
    if (r.pet && r.pet.petted && G.pet && G.pet.room === r) {                       // 被摸过的小家伙跟着你出房间
      const f = G.pet;
      f.x = lerp(f.x, p.x - 14 * (Math.cos(p.face) >= 0 ? -1 : 1), clamp(dt * 3)); f.y = lerp(f.y, p.y + 2, clamp(dt * 3));
      f.anim += dt;
      if (spawnP(0.1)) SFX.move();
    }
  },
  draw(r, time) {
    const P = (x, y, w, h, c) => px(x, y, w, h, c);
    if (r.pond) {                                          // 水塘
      const q = r.pond, rx = 46, ry = 26;
      for (let y = -ry; y <= ry; y++) { const hw = Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) * rx;
        const col = y < -ry * 0.4 ? '#2a6a8a' : y < ry * 0.3 ? '#34789a' : '#2a5f80';
        P(q.x - hw, q.y + y, hw * 2, 1, col); }
      ellipse(q.x, q.y, rx, ry, '#8ac8e0');
      for (let i = 0; i < 5; i++) { const a = time * 0.6 + i * 1.3, rr = 14 + i * 6;      // 缓慢的水光
        px(q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr * 0.5, 2, 1, '#b8e8ff'); }
      if (q.state === 'wait' || q.state === 'bite') {      // 浮标与波纹
        const bob = Math.sin(q.ripple * 3) * 1.5;
        px(q.x - 1, q.y - 12 + bob, 2, 4, '#e8e0d0'); px(q.x, q.y - 13 + bob, 1, 2, '#ff6050');
        const k = q.state === 'bite' ? 2 : 1;
        for (let i = 1; i <= 3; i++) ellipse(q.x, q.y + 2 + bob, 3 + i * 2 * k, (3 + i * 2 * k) * 0.5, '#d0f0ff');
      }
      if (q.casts <= 0) P(q.x - 10, q.y + ry - 2, 20, 2, '#6a5a3a');
      if (spawnP(0.08)) G.parts.push({ x: q.x + rnd(-rx, rx), y: q.y + rnd(-ry, ry) * 0.5, vx: 0, vy: -6, life: 0.8, max: 0.8, col: '#b8e8ff', size: 1, grav: 0, add: true });
    }
    if (r.spring) {                                        // 温泉
      const S = r.spring, rx = S.r, ry = S.r * 0.55;
      for (let y = -ry; y <= ry; y++) { const hw = Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) * rx;
        P(S.x - hw, S.y + y, hw * 2, 1, y < 0 ? '#3a6a7a' : '#2e5d70'); }
      ellipse(S.x, S.y, rx, ry, '#8ad0e0'); P(S.x - rx + 6, S.y - ry + 2, rx * 2 - 12, 2, '#a8e0f0');
      const stones = [[-1, -0.8], [1, -0.7], [-0.9, 0.7], [1.1, 0.6], [0.1, -1.05]];
      for (const [a, b] of stones) { const x = S.x + a * rx * 1.05, y = S.y + b * ry * 1.1;
        P(x - 4, y - 3, 8, 5, '#5a5468'); P(x - 4, y - 3, 8, 1, '#8a8498'); }
      if (spawnP(0.5)) G.parts.push({ x: S.x + rnd(-rx * 0.8, rx * 0.8), y: S.y - rnd(0, 6), vx: rnd(-4, 4), vy: -12, life: 1.1, max: 1.1, col: '#e8f8ff', size: 1, grav: 0, add: false });
      if (S.soak > 0) { const k = clamp(S.soak / FUN.soakTime), w = Math.round(rx * 1.6 * k);   // 泡泉进度
        P(S.x - rx * 0.8, S.y - ry - 8, rx * 1.6, 2, '#2a3a50'); P(S.x - rx * 0.8, S.y - ry - 8, w, 2, '#8ae0ff'); }
    }
    if (r.pet && !r.pet.petted) {                          // 还没被摸走的小动物（摸过之后就由全局钩子画）
      const pt = r.pet, spr = SPR[pt.kind][Math.floor(time * 3) % 2];
      shadow(pt.x, pt.y + 4, 5);
      drawSpr(g, spr, pt.x, pt.y + 4, {});
      if (spawnP(0.06)) px(pt.x + rnd(-3, 3), pt.y - 6, 1, 1, '#ffffff');
      P(pt.x - 9, pt.y + 2, 18, 3, '#4a3a2a');             // 小垫子
    }
  },
  light(r, ox, oy, time) {
    if (r.pond) light(r.pond.x + ox, r.pond.y + oy, 40, [110, 190, 230], 0.4);
    if (r.spring) light(r.spring.x + ox, r.spring.y + oy, 54 + Math.sin(time * 2) * 3, [140, 220, 240], 0.5);
  },
};

// ---------------------------------------------------------------- 交互提示：抛竿 / 起竿 / 摸摸
const _updPrompt = updPrompt;
updPrompt = function () {
  _updPrompt();
  const R0 = G.room, p = G.player;
  if (!R0 || (R0.type !== 'pond' && R0.type !== 'spring' && R0.type !== 'pet')) return;
  const near = (o, d) => o && dist(p.x, p.y, o.x, o.y) < d;
  if (R0.pond && near(R0.pond, 30)) {
    const P = R0.pond;
    if (P.state === 'wait') { G.prompt = { text: '（等鱼上钩…按 E 收竿）', col: '#a8d8ff', x: P.x, y: P.y + OY - 22 }; return; }
    if (P.state === 'bite') { G.prompt = { text: '起竿!', sub: '趁现在按 E', col: '#ffe080', x: P.x, y: P.y + OY - 22 }; }
    else if (P.casts > 0) G.prompt = { text: '抛竿钓鱼', sub: `还剩 ${P.casts} 次`, col: '#8ac8e0', x: P.x, y: P.y + OY - 22 };
    else G.prompt = { text: '鱼都跑了', sub: '这处钓点今天没鱼了', col: '#8a7f96', x: P.x, y: P.y + OY - 22 };
    if (!consume('interact')) return;
    if (P.state === 'bite') { fishLand(P); return; }
    if (P.state === 'wait') { P.state = 'idle'; P.t = 0; SFX.deny(); addFloat(P.x, P.y - 16, '收竿', '#a8d8ff'); return; }
    if (P.casts > 0) { P.casts--; P.state = 'wait'; P.t = rnd(FUN.biteMin, FUN.biteMax); P.ripple = 0; SFX.bow(); addFloat(P.x, P.y - 14, '抛竿', '#8ac8e0'); }
    return;
  }
  if (R0.pet && R0.pet.petted === false && near(R0.pet, 28)) {
    G.prompt = { text: `摸摸${R0.pet.kind === 'cat' ? '这只猫' : '这只狗'}`, sub: '它好像想跟你走一段', col: '#ffe6b0', x: R0.pet.x, y: R0.pet.y + OY - 14 };
    if (!consume('interact')) return;
    R0.pet.petted = true;
    G.pet = { kind: R0.pet.kind, x: R0.pet.x, y: R0.pet.y, anim: 0, room: R0, floor: G.gfloor };
    SFX.pickup(); addFloat(p.x, p.y - 22, R0.pet.kind === 'cat' ? '喵~' : '汪!', '#ffe6b0', true);
    burst(R0.pet.x, R0.pet.y - 4, 12, ['#ffe6b0', '#ffffff'], { sp: 50, life: 0.4, up: true });
    recalcStats();                                        // 拾取范围加成立刻生效
  }
};
// 起竿结算
function fishLand(P) {
  const p = G.player; P.state = 'idle'; P.t = 0;
  const rare = rand() < 0.4;
  if (rare) {
    const b = pick(FUN.buffs), gold = FUN.rareGold + rint(0, 12);
    G.floorBuff = { id: b.id, text: b.text };
    gainGold(gold); recalcStats();
    SFX.win(); shake(2); addFloat(p.x, p.y - 24, '稀有鱼!', '#ffd060', true);
    addFloat(p.x, p.y - 14, b.text, '#82e68c');
    burst(P.x, P.y - 6, 24, ['#ffd060', '#ffffff', '#8ac8e0'], { sp: 90, life: 0.6, up: true });
  } else if (p.hp < p.maxHp) {
    p.heal(FUN.fishHeal); SFX.pickup(); addFloat(p.x, p.y - 20, '渔获：食材', '#82e68c');
    burst(P.x, P.y - 6, 14, ['#8ac8e0', '#ffffff'], { sp: 70, life: 0.5, up: true });
  } else {
    const gold = rint(FUN.fishGold[0], FUN.fishGold[1]);
    gainGold(gold); addFloat(p.x, p.y - 20, `渔获：卖了 ${gold} 金币`, '#ffdc5a');
  }
}

// ---------------------------------------------------------------- 每帧：小猫跟随与捡东西（不在趣味房里也要跑）
const _classHook2 = classHook;
classHook = function (ev, a, b, c) {
  const out = _classHook2(ev, a, b, c);
  if (ev !== 'update' || !G.pet) return out;
  const p = G.player, f = G.pet;
  f.anim += a;
  const tx = p.x + (Math.cos(p.face) >= 0 ? -15 : 15), ty = p.y + 3;
  f.x = lerp(f.x, tx, clamp(a * 3.2)); f.y = lerp(f.y, ty, clamp(a * 3.2));
  for (const c2 of G.pickups) {                          // 帮你把附近的金币和魂晶拨过来
    if (c2.done) continue;
    if (dist(c2.x, c2.y, f.x, f.y) < FUN.petMagnet) { const k = 60 * a / Math.max(dist(c2.x, c2.y, p.x, p.y), 6);
      c2.vx += (p.x - c2.x) * k * 2; c2.vy += (p.y - c2.y) * k * 2; }
  }
  if (spawnP(0.04)) tone(f.kind === 'cat' ? 880 : 520, 0.1, { type: 'triangle', vol: 0.06 });
  return out;
};
// 小猫只陪你一层
const _startFloor = startFloor;
startFloor = function (ch, fi) {
  const had = G.pet;
  _startFloor(ch, fi);
  if (had) { G.pet = null; addFloat(G.player.x, G.player.y - 24, had.kind === 'cat' ? '小猫留在上一层了' : '小狗留在上一层了', '#a096ff'); }
  G.floorBuff = null;                                     // 稀有鱼的本层加成到这就结束
};

// ---------------------------------------------------------------- 属性：本层加成 + 小猫的拾取范围
const _recalcStats = recalcStats;
recalcStats = function () {
  _recalcStats();
  const p = G.player; if (!p) return;
  if (G.floorBuff) { const b = FUN.buffs.find(x => x.id === G.floorBuff.id); if (b) b.apply(p); }
  if (G.pet) p.magnet *= CONFIG.funPetPickup ?? FUN.petPickup;
};

// ---------------------------------------------------------------- 画跟随中的小动物（它在别的房间里也要看得见）
const _renderWorld = renderWorld;
renderWorld = function (time) {
  _renderWorld(time);
  if (!G.pet) return;
  const f = G.pet, spr = SPR[f.kind][Math.floor(f.anim * 4) % 2], [cx, cy] = G.camOff;
  g.setTransform(1, 0, 0, 1, cx, cy + OY);
  shadow(f.x, f.y + 4, 5);
  drawSpr(g, spr, f.x, f.y + 4, { flip: f.x > G.player.x });
  g.setTransform(1, 0, 0, 1, 0, 0);
};
