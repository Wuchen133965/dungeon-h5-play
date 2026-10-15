'use strict';
// ============================================================ 属性神殿: spend run gold on permanent-for-this-run base stat upgrades
// each stat has its own price ladder; max 5 levels per stat. Levels live in G.runUp and reset every run.
const SHRINE_COST = [100, 300, 500, 800, 1000];
const SHRINE_MAX = SHRINE_COST.length;
const SHRINE_STATS = [
  { id: 'dmg', name: '攻击力', per: '+0.5', ic: ['sword', '#e0e4f0', '#7a5636', '#ffffff'], app: (s, n) => { s.dmg += n * 0.5; } },
  { id: 'hp', name: '生命上限', per: '+1 颗心', ic: ['heart', '#c83048', '#6a1424', '#ff9aa8'], app: (s, n) => { s.maxHp += n * 2; } },
  { id: 'aspd', name: '攻击速度', per: '+8%', ic: ['feather', '#8ae0e0', '#3a8a9a', '#ffffff'], app: (s, n) => { s.atkSpd += n * 0.08; } },
  { id: 'crit', name: '暴击率', per: '+5%', ic: ['eye', '#ecba40', '#5a4a30', '#ffffff'], app: (s, n) => { s.crit += n * 0.05; } },
  { id: 'spd', name: '移动速度', per: '+6%', ic: ['boots', '#9a6a3a', '#5a3a22', '#d8a060'], app: (s, n) => { s.speed *= 1 + n * 0.06; } },
];
const runUp = id => (G.runUp && G.runUp[id]) || 0;
function applyRunUps(s) { for (const st of SHRINE_STATS) if (runUp(st.id)) st.app(s, runUp(st.id)); }

function openShrine() { G.shrineUI = { sel: G.shrineUI ? G.shrineUI.sel : 0, t: 0, msg: null, msgT: 0, pulse: -1, pt: 0 }; G.mode = 'shrine'; SFX.select(); }
function updShrine(dt) {
  const S = G.shrineUI; S.t += dt; S.msgT -= dt; S.pt -= dt;
  const v = navPressed(); if (v) { S.sel = (S.sel + v + SHRINE_STATS.length) % SHRINE_STATS.length; SFX.move(); }
  if (S.t < 0.15) return;
  if (backPressed()) { G.mode = 'play'; SFX.deny(); return; }
  if (!confirmPressed()) return;
  const st = SHRINE_STATS[S.sel], L = runUp(st.id), c = SHRINE_COST[L];
  const say = (m, col) => { S.msg = { s: m, col }; S.msgT = 1.4; };
  if (L >= SHRINE_MAX) { say('已满级', '#a096aa'); SFX.deny(); return; }
  if (G.gold < c) { say(`金币不足（还差 ${c - G.gold}）`, '#ff6070'); SFX.deny(); return; }
  G.gold -= c; G.goldPulse = 0.2; G.runUp[st.id] = L + 1; recalcStats(); townServiceEvent('goldspend', { amount: c }); SFX.buy();
  S.pulse = S.sel; S.pt = 0.5; say(`${st.name} 提升至 ${L + 1}/${SHRINE_MAX}`, '#82e68c');
  const R = G.room.shrine; burst(R.x, R.y - 16, 26, ['#ffe080', '#fff6d0', '#ffffff'], { sp: 80, life: 0.6, up: true });
}

// ---------------- world prop: a stone pedestal with a golden hero statue (not solid; sits in the room centre)
function drawShrine(S, time) {
  const x = S.x, y = S.y;
  shadow(x, y + 4, 14);
  px(x - 14, y - 2, 28, 6, '#4a4458'); px(x - 14, y - 2, 28, 1, '#7a7488'); px(x - 12, y + 4, 24, 1, '#2a2434');   // base step
  px(x - 9, y - 8, 18, 7, '#5a5468'); px(x - 9, y - 8, 18, 1, '#8a8498'); px(x - 4, y - 6, 8, 3, '#3a3448');      // plinth
  px(x - 3, y - 5, 6, 1, '#ecba40');
  const b = Math.round(Math.sin(time * 2) * 0.6);
  // statue: legs, body, arms raising a sword
  px(x - 3, y - 13, 2, 5, '#b08a30'); px(x + 1, y - 13, 2, 5, '#b08a30');
  px(x - 4, y - 21, 8, 8, '#d8a838'); px(x - 4, y - 21, 2, 8, '#f0c850'); px(x - 2, y - 17, 4, 1, '#8a6a20');
  px(x - 3, y - 26, 6, 5, '#e8b840'); px(x - 3, y - 26, 6, 1, '#fff0a0');                                           // head
  px(x - 6, y - 21, 2, 5, '#c89830'); px(x + 4, y - 25, 2, 6, '#c89830');                                           // arms
  px(x + 4, y - 36 + b, 2, 11, '#fff6d0'); px(x + 2, y - 26 + b, 6, 1, '#b08a30');                                  // raised sword
  if (spawnP(0.25)) G.parts.push({ x: x + rnd(-10, 10), y: y - rnd(2, 30), vx: 0, vy: rnd(-16, -6), life: 0.7, max: 0.7, col: '#ffe080', size: 1, grav: 0, add: true });
}

// ---------------- menu (hi-res UI layer)
function drawShrineMenu() {
  const S = G.shrineUI, time = G.time;
  uiBackdrop('rgba(8,4,12,0.6)');
  frame(40, 30, 280, 164, '属性神殿 · 英灵祈愿', '#ffd060');
  T('“献上金币，英灵将赐予你力量。本局有效，每项最多 5 次。”', 160, 44, 5, '#a096aa');
  // gold on the right of the subtitle row
  T(`持有 ${G.gold} 金币`, 272, 44, 5.5, '#ffdc5a', 'right');
  SHRINE_STATS.forEach((st, i) => {
    const y = 58 + i * 19, on = i === S.sel, L = runUp(st.id), max = L >= SHRINE_MAX, c = SHRINE_COST[L];
    uiHit(48, y - 7, 214, y + 9, () => { S.sel = i; SFX.move(); });
    uiHit(214, y - 7, 272, y + 9, () => { S.sel = i; pulse('confirm'); });
    const bump = S.pulse === i && S.pt > 0 ? S.pt : 0;
    panel(48, y - 7, 272, y + 9, on ? '#2a2016' : '#1a1218', on ? `rgba(255,214,110,${0.6 + 0.3 * Math.sin(time * 6)})` : '#3a3044', 1);
    bigIcon(icon(...st.ic), 52, y - 6 - bump * 3, 2);
    T(st.name, 74, y - 1, 6.5, on ? '#fff0c8' : '#e0d4c4', 'left');
    T(`每级 ${st.per}`, 74, y + 5.5, 4.5, '#8a7f96', 'left');
    for (let k = 0; k < SHRINE_MAX; k++) {                       // level pips
      const x = 134 + k * 12, f = k < L;
      hg.fillStyle = f ? '#ffd060' : '#2a2230'; hg.fillRect(x * U, (y - 2) * U, 9 * U, 5 * U);
      hg.fillStyle = f ? '#fff0b0' : '#3a3044'; hg.fillRect(x * U, (y - 2) * U, 9 * U, 1 * U);
    }
    const tag = max ? '已满级' : `${c} 金币`, ok = !max && G.gold >= c;
    T(tag, 266, y + 0.5, 6, max ? '#82e68c' : ok ? '#ffdc5a' : '#c04050', 'right');
  });
  if (S.msgT > 0 && S.msg) { const w = tw(S.msg.s, 6) + 14, a = clamp(S.msgT * 3);
    panel(160 - w / 2, 150 - 6, 160 + w / 2, 150 + 6, '#100a12', S.msg.col, 0.95 * a); T(S.msg.s, 160, 150, 6, S.msg.col, 'center', a); }
  else T('价格阶梯：100 → 300 → 500 → 800 → 1000（每项属性各自计算）', 160, 152, 4.5, '#6a5f76');
  hints([['W/S', '选择'], ['E', '强化'], ['Esc', '离开']], 172);
}
