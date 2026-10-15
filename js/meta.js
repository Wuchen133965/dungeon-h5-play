'use strict';
// ============================================================ persistent meta progression (局外养成), saved in localStorage
// v3 adds per-act / per-difficulty progress (META.prog). A v2 save is migrated on first load and left in place untouched.
const SAVE_KEY = 'chest_dungeon_meta_v3', OLD_SAVE_KEY = 'chest_dungeon_meta_v2';
const SAVE_BACKUP_KEY = SAVE_KEY + '_backup', SAVE_DAMAGED_KEY = SAVE_KEY + '_damaged';
const freshMeta = () => ({ souls: 0, lv: {}, unlocked: [], seen: [], maxCh: 1, best: 0, runs: 0, wins: 0, kills: 0, prog: {}, ver: 3, treeVer: 2, refund: 0 });
const META = freshMeta();
const META_SAVE = { pending: false, message: '', notice: '', retryIn: 0, readBlocked: false, damaged: null, loading: false };
const metaObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const metaCount = value => Number.isFinite(value) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value))) : 0;
function metaParse(raw) {
  if (!raw) return null;
  try { const value = JSON.parse(raw); return metaObject(value) ? value : null; } catch (_) { return null; }
}
function metaSaveFailed(message = '进度尚未保存，请勿关闭游戏；正在重试保存。') {
  META_SAVE.pending = true; META_SAVE.message = message; META_SAVE.retryIn = 2;
  return false;
}
// Complete a durable LAN receipt before a new town purchase can change the same wallet.
function metaSaveReady() {
  if (META_SAVE.readBlocked) return metaSaveFailed('无法读取已有存档，已停止覆盖；请恢复存储后重新启动游戏。');
  return typeof coopProgressRecover !== 'function' || coopProgressRecover() || metaSaveFailed('联机进度尚未保存，请勿关闭游戏；保存恢复后再操作。');
}
function retryMetaSave(dt) {
  if (!META_SAVE.pending || !Number.isFinite(dt)) return;
  META_SAVE.retryIn -= Math.max(0, dt);
  if (META_SAVE.retryIn > 0) return;
  if (metaSaveReady()) {
    saveMeta();
    // Recovery replaces META objects outside the ordinary progress-packet path.
    // Refresh the host cache before another actor temporarily switches the active save.
    if (typeof coopSyncLocalMeta === 'function') coopSyncLocalMeta();
  }
}
// prog[act] = { open: bool, diff: [{ reg, runs, wins, best }, ...per difficulty] }
//   reg  = furthest region unlocked on that difficulty (1-based; 0 = difficulty locked)
//   wins = act clears on that difficulty (beating its last boss)
const newDiffProg = reg => ({ reg, runs: 0, wins: 0, best: 0 });
function actProg(a) {
  const P = META.prog[a] = metaObject(META.prog[a]) ? META.prog[a] : { open: a === 1, diff: [] };
  P.open = a === 1 || P.open === true;
  if (!Array.isArray(P.diff)) P.diff = [];
  for (let i = 0; i < DIFFS.length; i++) {
    const raw = metaObject(P.diff[i]) ? P.diff[i] : newDiffProg(i === 0 && P.open ? 1 : 0);
    P.diff[i] = { reg: Math.min(actOf(a).regions.length, metaCount(raw.reg)), runs: metaCount(raw.runs), wins: metaCount(raw.wins), best: metaCount(raw.best) };
  }
  if (P.open && !P.diff[0].reg) P.diff[0].reg = 1;
  return P;
}
const actOpen = a => actProg(a).open;
const diffOpen = (a, d) => actProg(a).diff[d].reg > 0;
const regionOpen = (a, d, ch) => actProg(a).diff[d].reg >= ch;
const actCleared = (a, d) => actProg(a).diff[d].wins > 0;
// boss of region ch beaten on difficulty d: open the next region; clearing the act opens the next difficulty and act
function regionBeaten(a, ch, d) {
  const P = actProg(a), D = P.diff[d], n = actOf(a).regions.length;
  D.reg = Math.max(D.reg, Math.min(n, ch + 1));
  if (ch >= n) {
    if (d + 1 < DIFFS.length && !P.diff[d + 1].reg) P.diff[d + 1].reg = 1;
    if (ACTS[a]) { const N = actProg(a + 1); N.open = true; if (!N.diff[0].reg) N.diff[0].reg = 1; }
  }
  if (a === 1) META.maxCh = Math.max(META.maxCh, D.reg);       // legacy field, kept for old builds reading the save
  saveMeta();
}
function migrateV2(s) {
  // old saves: maxCh = furthest chapter unlocked in act 1, wins > 0 = act 1 cleared (normal)
  const P = { open: true, diff: [] };
  P.diff[0] = { reg: clamp(s.maxCh || 1, 1, CHAPTERS.length), runs: s.runs || 0, wins: s.wins || 0, best: s.best || 0 };
  if (P.diff[0].wins > 0) P.diff[1] = newDiffProg(1);
  s.prog = { 1: P };
  if (P.diff[0].wins > 0) s.prog[2] = { open: true, diff: [newDiffProg(1)] };
  s.ver = 3; return s;
}
function loadMeta() {
  META_SAVE.loading = true;
  try { loadMetaData(); } finally { META_SAVE.loading = false; }
}
function loadMetaData() {
  META_SAVE.pending = false; META_SAVE.message = ''; META_SAVE.notice = ''; META_SAVE.readBlocked = false; META_SAVE.damaged = null;
  let saved = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    saved = metaParse(raw);
    if (raw && !saved) META_SAVE.damaged = raw;
    if (!saved) {
      const backup = metaParse(localStorage.getItem(SAVE_BACKUP_KEY));
      const old = backup ? null : metaParse(localStorage.getItem(OLD_SAVE_KEY));
      saved = backup || (old && migrateV2(old));
      if (saved) META_SAVE.notice = backup ? '已从存档备份恢复进度。' : '已从旧版存档恢复进度。';
      else if (raw) META_SAVE.notice = '原存档无法读取，已保留原文；本次从初始进度开始。';
    }
  } catch (_) {
    // Do not replace an unreadable existing save with a fresh session if reads recover later.
    META_SAVE.readBlocked = true;
    metaSaveFailed('无法读取已有存档，已停止覆盖；请恢复存储后重新启动游戏。');
  }
  for (const key of Object.keys(META)) delete META[key];
  Object.assign(META, freshMeta());
  if (saved) {
    for (const [key, value] of Object.entries(saved)) if (!['__proto__', 'constructor', 'prototype'].includes(key)) META[key] = value;
    META.treeVer = saved.treeVer || 1;
  }
  for (const key of ['souls', 'maxCh', 'best', 'runs', 'wins', 'kills', 'refund']) META[key] = metaCount(META[key]);
  if (!Array.isArray(META.unlocked)) META.unlocked = [];
  if (!Array.isArray(META.seen)) META.seen = [];
  if (!metaObject(META.prog)) META.prog = {};
  META.unlockedSet = new Set(META.unlocked); META.seenSet = new Set(META.seen);
  for (let a = 1; a <= ACTS.length; a++) actProg(a);
  if (!metaObject(META.lv)) META.lv = {};
  for (const key of Object.keys(META.lv)) META.lv[key] = metaCount(META.lv[key]);
  respecOldTree();                                           // new talent tree: refund the old one once (talents.js)
  normalizeTownServices();                                  // new residents retain old saves and validate their own fields
  normalizeForgeProgression();                              // train / improve weapons / forge personal silver weapons
  normalizeCostumes();                                      // old saves keep the free original outfit
  normalizeSignIn();                                        // daily supplies and TapTap gift receipts remain personal
  if (CONFIG.devUnlockAct > 1) devUnlock(CONFIG.devUnlockAct);
  saveMeta();
}
// test helper: open acts up to n, as if every earlier act was cleared on normal (only ever raises progress)
function devUnlock(n) {
  n = clamp(Math.floor(n), 1, ACTS.length);
  for (let a = 1; a < n; a++) {
    const P = actProg(a), D = P.diff[0];
    P.open = true; D.reg = Math.max(D.reg, actOf(a).regions.length || 1); D.wins = Math.max(D.wins, 1);
    if (!P.diff[1].reg) P.diff[1].reg = 1;
  }
  const N = actProg(n); N.open = true; if (!N.diff[0].reg) N.diff[0].reg = 1;
  if (n > 1) META.maxCh = Math.max(META.maxCh, CHAPTERS.length);
}
// Shared by solo saves and authoritative LAN transactions, preserving one valid previous generation.
function metaStore(post) {
  const previous = localStorage.getItem(SAVE_KEY);
  if (post === previous) return;
  if (metaParse(previous) && localStorage.getItem(SAVE_BACKUP_KEY) !== previous) localStorage.setItem(SAVE_BACKUP_KEY, previous);
  localStorage.setItem(SAVE_KEY, post);
}
function saveMeta() {
  if (META_SAVE.readBlocked) return metaSaveFailed('无法读取已有存档，已停止覆盖；请恢复存储后重新启动游戏。');
  if (typeof coopProgressRead === 'function' && coopProgressRead().pending) return metaSaveFailed('联机进度尚未保存，请勿关闭游戏；正在恢复存档。');
  if (!META_SAVE.loading) META.savedAt = Date.now();
  META.unlocked = [...META.unlockedSet]; META.seen = [...META.seenSet];
  const { unlockedSet, seenSet, ...o } = META;
  try {
    // Preserve the bad source before replacing it, including when the preservation write needs a retry.
    if (META_SAVE.damaged !== null) {
      localStorage.setItem(SAVE_DAMAGED_KEY, META_SAVE.damaged);
      META_SAVE.damaged = null;
    }
    metaStore(JSON.stringify(o));
    META_SAVE.pending = false; META_SAVE.message = ''; META_SAVE.retryIn = 0;
    return true;
  } catch (_) { return metaSaveFailed(); }
}
const lv = id => META.lv[id] || 0;

// talent tree lives in talents.js (radial web, one sector per class)
const isUnlocked = it => it.silver ? forgeLootItems().some(i => i.id === it.id) : !it.lock || META.unlockedSet.has(it.id);
// Being eligible for a random drop is different from having unlocked permanent weapon cultivation.
function weaponCultivationUnlocked(it, meta = META) {
  if (!it || it.slot !== 'weapon' || it.start || CAMP_STARTERS.includes(it.id)) return false;
  if (it.silver) return forgeLootItems(meta).some(item => item.id === it.id);
  const owns = (set, list) => set && typeof set.has === 'function' ? set.has(it.id) : Array.isArray(list) && list.includes(it.id);
  if (owns(meta.unlockedSet, meta.unlocked)) return true;
  return !it.lock && !!owns(meta.seenSet, meta.seen);
}
function buyUnlock(it) {
  if (!metaSaveReady()) return false;
  if (isUnlocked(it) || META.souls < it.lock) return false;
  META.souls -= it.lock; META.unlockedSet.add(it.id); townServiceEvent('blueprint'); saveMeta(); return true;
}
const soulMul = () => 1 + lv('soul') * 0.2;
const shopMul = () => 1 - lv('shop') * 0.15;

// fresh stat block every recalc: talents first, then equipped items add on top (then class sets, see classes.js)
function baseStats() {
  const s = { maxHp: 6, defense: 0, dmg: 2, atkSpd: 1, reachMul: 1, rangeMul: 1, speed: 82, crit: 0.05, critMul: 2, rollCd: 0.85, luck: 0, chestLuck: 0,
    goldMul: 1, vamp: 0, wave: 0, thorns: 0, revive: lv('undying') && !G.undyingUsed ? 1 : 0, rollCrit: false, scale: 1, block: 0, burn: 0, freeze: 0,
    poison: 0, chain: 0, explode: 0, orbit: 0, shield: false, berserk: 0, magnet: 1, fireImm: false, procMul: 1,
    pierce: 0, wpn: WTYPES.sword, blade: null, homing: false, multi: 1, trinketSlots: 3,
    // class mechanics (tuned by class sets + talents)
    rageT: 2, rageSpd: 1.4, quakeMul: 1, quakeR: 44, splitN: 2, novaCd: 4, novaMul: 1, smiteN: 3, smiteMul: 1, shieldCap: 2, finaleMul: 1,
    ghostP: 0.3, ghostT: 6, insGain: 1, insKill: 0, insCap: 10, insPer: 0.03, minions: 0, minionKind: 'spirit', minionDmg: 1, minionSpd: 1,
    minionBurn: 0, minionPoison: 0, dotMul: 1, holyHeal: 0, regen: 0, healBonus: 0, splashMul: 1,
    guardQuake: false, rollVolley: false, elementEcho: false, sanctuary: false, battleChorus: false, soulGuide: false };
  for (const t of TALENTS) { const l = lv(t.id); if (l && t.fx) t.fx(s, l); }
  forgeApplyTraining(s);
  applyCampMeal(s);
  applyRunUps(s);                        // 属性神殿 upgrades bought this run
  return s;
}
