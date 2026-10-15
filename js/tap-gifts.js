'use strict';
// Public app ID and genuine backend voucher IDs. The sign-in event is not yet provisioned.
const TAP_SIGNIN_CONFIG = { clientId: 'lyw4bfbfzkpreack7s', eventUrl: '', activityIds: {
  1: 'TDS20261015000739CVA', 3: 'TDS20261015001444SEA', 5: 'TDS20261015001545MXT', 7: 'TDS20261015001602OMO',
} };
const TAP_GIFT_RECEIPT_KEY = 'chest_dungeon_tap_gift_pending_v1';
const TAP_GIFTS = { busy: false, message: '' };
let TAP_GIFT_INPUT = null;
function tapGiftConfigured() { return !window.dungeonDesktop && TAP_SIGNIN_REWARDS.some(r => typeof TAP_SIGNIN_CONFIG.activityIds[r.day] === 'string' && TAP_SIGNIN_CONFIG.activityIds[r.day]); }
function tapGiftAccount() { return TAP_PROGRESS.connected && !TAP_PROGRESS.conflict && TAP_PROGRESS.binding ? TAP_PROGRESS.binding.uuid : null; }
async function tapGiftRequest(body) {
  if (window.dungeonDesktop) throw Error('TapTap 礼包请在 H5 版本中兑换');
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), 15000) : null;
  try {
    const response = await fetch('https://poster-api.xd.cn/api/v1.0/cdk/game/submit-simple', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      ...(controller ? { signal: controller.signal } : {}), body: JSON.stringify(body),
    });
    if (!response.ok) throw Error('礼包服务暂不可用，请稍后重试');
    return await response.json();
  } finally { if (timeout !== null) clearTimeout(timeout); }
}
async function tapGiftSha1(text) {
  const bytes = new Uint8Array([...unescape(encodeURIComponent(text))].map(c => c.charCodeAt(0)));
  const result = await window.crypto.subtle.digest('SHA-1', bytes);
  return [...new Uint8Array(result)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function tapGiftRewardIndex(receipt) { return TAP_SIGNIN_REWARDS.findIndex(r => TAP_SIGNIN_CONFIG.activityIds[r.day] && TAP_SIGNIN_CONFIG.activityIds[r.day] === receipt.activity_id); }
function tapGiftExpectedContent(reward) {
  return [{ name: '魂晶', number: reward.souls }, ...Object.entries(reward.materials).map(([id, number]) => ({ name: WORKSHOP_MATERIALS.find(m => m.id === id).name, number })),
    ...(reward.costume ? [{ name: '紫曜星卫', number: 1 }] : [])];
}
async function tapGiftValidate(receipt, fresh = true) {
  if (!receipt || receipt.success !== true || receipt.error !== 0 || !Number.isSafeInteger(receipt.timestamp) ||
      typeof receipt.nonce_str !== 'string' || !/^[a-zA-Z0-9]{1,128}$/.test(receipt.nonce_str) ||
      typeof receipt.sign !== 'string' || !/^[a-f0-9]{40}$/i.test(receipt.sign) || tapGiftRewardIndex(receipt) < 0 ||
      fresh && Math.abs(Date.now() / 1000 - receipt.timestamp) > 300) throw Error('礼包结果校验未通过，请检查活动配置或时间');
  if (await tapGiftSha1(`${receipt.timestamp}${receipt.nonce_str}${TAP_SIGNIN_CONFIG.clientId}`) !== receipt.sign.toLowerCase()) throw Error('礼包签名校验失败');
  // The game grants a fixed, reviewed catalog; the network response cannot invent items or quantities.
  const content = typeof receipt.content === 'string' ? JSON.parse(receipt.content) : receipt.content_obj;
  const expected = tapGiftExpectedContent(TAP_SIGNIN_REWARDS[tapGiftRewardIndex(receipt)]);
  const canonical = items => Array.isArray(items) && items.length === expected.length &&
    items.every(i => i && typeof i.name === 'string' && Number.isSafeInteger(i.number) && i.number > 0) ?
    items.map(i => `${i.name}:${i.number}`).sort().join('|') : null;
  if (canonical(content) !== canonical(expected) || receipt.content_obj && canonical(receipt.content_obj) !== canonical(expected)) throw Error('礼包道具与签到奖励配置不一致');
  return tapGiftRewardIndex(receipt);
}
async function tapGiftRecover() {
  const uuid = tapGiftAccount(); if (!uuid || !signinSafe()) return false;
  const saved = localStorage.getItem(TAP_GIFT_RECEIPT_KEY); if (!saved) return false;
  const pending = JSON.parse(saved); if (!pending || pending.uuid !== uuid) return false;
  const index = await tapGiftValidate(pending.receipt, false);
  if (tapGiftAccount() !== uuid || !signinSafe() || !metaSaveReady()) return false;
  const id = pending.receipt.activity_id, state = signinState();
  let awarded = false;
  if (!state.gifts.includes(id)) { state.gifts.push(id); awarded = grantSharedSigninReward(TAP_SIGNIN_REWARDS[index].day, TAP_SIGNIN_REWARDS[index]); signinPersist(); }
  if (!META_SAVE.pending) localStorage.removeItem(TAP_GIFT_RECEIPT_KEY);
  TAP_GIFTS.message = META_SAVE.pending ? META_SAVE.message : awarded ? '礼包已领取，奖励已存入角色' : '该日补给已领取，不重复发放奖励'; return true;
}
async function redeemTapGift(code) {
  if (TAP_GIFTS.busy) return false;
  const uuid = tapGiftAccount();
  if (!tapGiftConfigured()) { TAP_GIFTS.message = 'TapTap 签到活动尚未配置'; return false; }
  if (!uuid) { TAP_GIFTS.message = '请先连接 TapTap 云存档，确认当前角色账号'; return false; }
  if (!window.crypto?.subtle || !window.crypto?.getRandomValues) { TAP_GIFTS.message = '当前环境无法连接礼包服务，请在 TapTap 内打开游戏'; return false; }
  if (!signinSafe() || !metaSaveReady() || !/^[a-zA-Z0-9_-]{4,128}$/.test(code.trim())) { TAP_GIFTS.message = '请在营地输入有效的礼包码'; return false; }
  TAP_GIFTS.busy = true; TAP_GIFTS.message = '正在核销礼包，请稍候';
  try {
    if (localStorage.getItem(TAP_GIFT_RECEIPT_KEY)) {
      if (await tapGiftRecover()) return true;
      throw Error('另一个账号的礼包结果待保存，请先切回对应账号');
    }
    const timestamp = Math.floor(Date.now() / 1000), nonce = new Uint8Array(12);
    window.crypto.getRandomValues(nonce);
    const nonce_str = [...nonce].map(v => v.toString(16).padStart(2, '0')).join('');
    const character_id = 'sg_' + (await tapGiftSha1(uuid)).slice(0, 40);
    const sign = await tapGiftSha1(`${timestamp}${nonce_str}${TAP_SIGNIN_CONFIG.clientId}`);
    if (tapGiftAccount() !== uuid || !signinSafe()) throw Error('账号或游戏状态已变化，请重新兑换');
    const receipt = await tapGiftRequest({ client_id: TAP_SIGNIN_CONFIG.clientId, gift_code: code.trim(), character_id, nonce_str, timestamp, sign, lang: 'zh_CN' });
    if (receipt.error === 100025 || receipt.error === 100017) throw Error('该礼包已兑换，请检查当前角色');
    const errors = { 100008:'礼包已过期',100009:'礼包活动尚未开放',100011:'点击过快，请稍候再试',100016:'礼包码无效',100018:'礼包兑换方式未配置正确' };
    if (errors[receipt.error]) throw Error(errors[receipt.error]);
    await tapGiftValidate(receipt);
    localStorage.setItem(TAP_GIFT_RECEIPT_KEY, JSON.stringify({ uuid, receipt }));
    if (await tapGiftRecover()) return true;
    throw Error('礼包结果已保存，请切回对应账号并返回营地领取');
  } catch (error) { TAP_GIFTS.message = error.name === 'AbortError' ? '礼包服务响应超时，请稍后检查兑换结果' : error.message || '兑换未完成，请稍后重试'; return false; }
  finally { TAP_GIFTS.busy = false; }
}
function tapSigninEventOpen() {
  const url = TAP_SIGNIN_CONFIG.eventUrl;
  if (/^https:\/\/www\.taptap\.cn\/events\/game-sign\/[a-zA-Z0-9_-]+\/?$/.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
}
function tapGiftInputClose() {
  if (!TAP_GIFT_INPUT) return false;
  TAP_GIFT_INPUT.remove(); TAP_GIFT_INPUT = null; resetInput(); return true;
}
function tapGiftInputSubmit() {
  if (!TAP_GIFT_INPUT) return;
  const code = TAP_GIFT_INPUT.value; tapGiftInputClose(); void redeemTapGift(code);
}
function tapGiftInputOpen() {
  if (!tapGiftConfigured() || !signinSafe() || TAP_GIFTS.busy) return;
  tapGiftInputClose(); resetInput();
  const input = TAP_GIFT_INPUT = document.createElement('input'); input.type = 'text'; input.maxLength = 128; input.id = 'tap-gift-code';
  input.placeholder = '输入 TapTap 签到礼包码'; input.setAttribute('aria-label', 'TapTap 签到礼包码'); input.autocomplete = 'off'; input.spellcheck = false;
  Object.assign(input.style, { position:'fixed',zIndex:30,background:'#20132d',border:'2px solid #bd8aff',color:'#eee3fb',boxSizing:'border-box',padding:'2px 4px',fontFamily:'monospace' });
  for (const event of ['keydown', 'keyup']) input.addEventListener(event, e => {
    e.stopImmediatePropagation();
    if (event === 'keydown' && !e.repeat && !e.isComposing && e.key === 'Escape') { e.preventDefault(); tapGiftInputClose(); }
    if (event === 'keydown' && !e.repeat && !e.isComposing && e.key === 'Enter') { e.preventDefault(); tapGiftInputSubmit(); }
  }, true);
  input.addEventListener('wheel', e => e.stopPropagation());
  document.body.appendChild(input); tapGiftInputPosition(); input.focus();
}
function tapGiftInputPosition() {
  if (!TAP_GIFT_INPUT) return;
  if (G.mode !== 'town' || TOWN.menu !== 'signin' || SIGNIN_UI.tab !== 'tap') { tapGiftInputClose(); return; }
  const box = document.getElementById('stage').getBoundingClientRect(), offset = uiMenuOffset();
  Object.assign(TAP_GIFT_INPUT.style, { left:`${box.left + box.width * (14 + offset.x) / LW}px`,top:`${box.top + box.height * (118 + offset.y) / LH}px`,
    width:`${box.width * 202 / LW}px`,height:`${box.height * 12 / LH}px`,fontSize:`${box.width * 4.2 / LW}px` });
}
