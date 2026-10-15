'use strict';
// Both entry points share the first seven-day reward ledger; later camp cycles remain renewable.
const SIGNIN_REWARDS = Object.freeze([
  { souls: 40, materials: { ore: 4 } }, { souls: 25, materials: { ore: 3 } },
  { souls: 60, materials: { iron: 4 } }, { souls: 35, materials: { iron: 3 } },
  { souls: 80, materials: { steel: 3 } }, { souls: 50, materials: { fine: 1 } },
  { souls: 120, materials: { essence: 3 }, costume: 'violetStar' },
]);
const TAP_SIGNIN_REWARDS = Object.freeze([
  { day: 1, souls: 40, materials: { ore: 4 } }, { day: 3, souls: 60, materials: { iron: 4 } },
  { day: 5, souls: 80, materials: { steel: 3 } }, { day: 7, souls: 120, materials: { essence: 3 }, costume: 'violetStar' },
]);
const SIGNIN_DAY_MS = 86400000;
function signinDay(now = Date.now()) { return Number.isFinite(now) && now >= 0 ? Math.floor((now + 28800000) / SIGNIN_DAY_MS) : -1; }
function normalizeSignIn(meta = META) {
  const raw = metaObject(meta.signin) ? meta.signin : {};
  const total = Math.min(1000000, metaCount(raw.total));
  const sharedDays = new Set(Array.isArray(raw.sharedDays) ? raw.sharedDays.filter(d => Number.isInteger(d) && d >= 1 && d <= 7) : []);
  for (let day = 1; day <= Math.min(total, 7); day++) sharedDays.add(day);
  if (typeof TAP_SIGNIN_CONFIG !== 'undefined' && Array.isArray(raw.gifts)) {
    for (const [day, id] of Object.entries(TAP_SIGNIN_CONFIG.activityIds)) if (raw.gifts.includes(id)) sharedDays.add(Number(day));
  }
  meta.signin = { ver: 2, total, sharedDays: [...sharedDays].sort((a, b) => a - b),
    lastDay: Number.isSafeInteger(raw.lastDay) && raw.lastDay >= 0 ? raw.lastDay : -1,
    gifts: Array.isArray(raw.gifts) ? [...new Set(raw.gifts.filter(v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(v)))].slice(-256) : [] };
  return meta.signin;
}
function signinState() { return META.signin && Array.isArray(META.signin.sharedDays) ? META.signin : normalizeSignIn(); }
function signinSafe() { return G.mode === 'town' && !TOWN.launch && !coopProgressRemoteActor() && !META_SAVE.readBlocked && !META_SAVE.pending; }
function signinAvailable(now = Date.now()) { return signinSafe() && signinDay(now) > signinState().lastDay; }
function signinNext() { return signinState().total % SIGNIN_REWARDS.length; }
function signinRewardLines(reward) {
  return [`魂晶 +${reward.souls}`, ...Object.entries(reward.materials).map(([id, n]) => `${WORKSHOP_MATERIALS.find(m => m.id === id).name} +${n}`),
    ...(reward.costume ? [costumeState().owned.includes(reward.costume) ? '皮肤已拥有 · 不重复发放' : '史诗皮肤 · 紫曜星卫'] : [])];
}
function grantSigninReward(reward) {
  META.souls = Math.min(Number.MAX_SAFE_INTEGER, META.souls + reward.souls);
  const bag = workshopState().materials;
  for (const [id, n] of Object.entries(reward.materials)) bag[id] = Math.min(WORKSHOP_MATERIAL_MAX, bag[id] + n);
  if (reward.costume) {
    const state = costumeState();
    if (!state.owned.includes(reward.costume)) state.owned.push(reward.costume);
  }
}
function grantSharedSigninReward(day, reward) {
  const state = signinState();
  if (state.sharedDays.includes(day)) return false;
  state.sharedDays.push(day); grantSigninReward(reward); return true;
}
function signinPersist() { saveMeta(); coopSyncLocalMeta(); }
function claimDailySignIn(now = Date.now()) {
  if (!signinAvailable(now) || !metaSaveReady()) return false;
  const state = signinState(), index = signinNext(), reward = SIGNIN_REWARDS[index];
  // Claim day and every reward are persisted in the same save generation, before any repeated click.
  state.lastDay = signinDay(now);
  if (state.total < 7) grantSharedSigninReward(index + 1, reward); else grantSigninReward(reward);
  state.total++; signinPersist(); return true;
}
Object.assign(TOWN_MENUS, { signin: { title: '补给官 星露 · 七日补给', col: '#b993ef',
  talk: ['每天来营地，我都会留一份补给。', '累计七天，紫曜星卫便属于你。'] } });
TOWN_PROPS.push({ kind: 'npc', id: 'supply', x: 120, y: 252, r: 6, menu: 'signin', name: '补给官 星露', role: '七日签到 · TapTap 礼包', col: '#ba97f0' });
SPR.supply = makeSprite([
  '...oooooo....','..oppppppo...','.oppPPppppo..','.opsssssppo..','..oseseeso...','..ossssssso..',
  '.ooppppppoo..','ospppYpppso..','osppYYpppso..','.opppYpppob..','.opppPpppobb.','.opppPpppobb.',
  '..oppppppo...','..obbobbo....','..ooo.ooo....',
], { o:'#201526',p:'#9976bb',P:'#684281',s:'#ebc5a0',e:'#35223e',Y:'#ffe2aa',b:'#735234' });
