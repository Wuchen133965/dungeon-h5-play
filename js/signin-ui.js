'use strict';
const SIGNIN_UI = { tab: 'daily', selected: 0 };
function signinSelectTab(tab) { if (TAP_GIFT_INPUT) tapGiftInputClose(); SIGNIN_UI.tab = tab; SIGNIN_UI.selected = tab === 'daily' ? signinNext() : 0; resetInput(); }
function signinClaimUI() {
  const day = signinNext(), shared = signinState().total < 7 && signinState().sharedDays.includes(day + 1);
  serviceResult(claimDailySignIn(), shared ? '今日签到已记录 · 补给此前已领取' : `第 ${day + 1} 天补给已领取`, signinState().lastDay >= signinDay() ? '今日已领取，明日再来' : META_SAVE.message || '请返回营地后领取');
  SIGNIN_UI.selected = day;
}
const MENU_SIGNIN = {
  nav(vx, vy) { const n = SIGNIN_UI.tab === 'daily' ? 7 : 4; SIGNIN_UI.selected = (SIGNIN_UI.selected + (vy || vx) + n) % n; },
  ok() { if (SIGNIN_UI.tab === 'daily') signinClaimUI(); else tapGiftInputOpen(); },
  back() { return tapGiftInputClose(); },
  draw(k) {
    serviceFrame('signin', k);
    forgeUIButton(14, 43, 155, 55, '营地七日签到', true, '#c7aaed', () => signinSelectTab('daily'), SIGNIN_UI.tab === 'daily', 5);
    forgeUIButton(165, 43, 306, 55, 'TapTap 签到礼包', true, '#83d4de', () => signinSelectTab('tap'), SIGNIN_UI.tab === 'tap', 5);
    const daily = SIGNIN_UI.tab === 'daily', rewards = daily ? SIGNIN_REWARDS : TAP_SIGNIN_REWARDS, state = signinState(), next = signinNext();
    const today = state.lastDay >= signinDay(), col = '#bd8aff';
    rewards.forEach((reward, i) => {
      const x = 14 + (i % 4) * 73, y = 61 + Math.floor(i / 4) * 28, selected = SIGNIN_UI.selected === i;
      const cycle = Math.floor((state.total - (today ? 1 : 0)) / 7);
      const claimed = daily ? i < (today ? (state.total - 1) % 7 + 1 : next) || cycle === 0 && state.sharedDays.includes(i + 1) : state.sharedDays.includes(reward.day);
      forgeUIButton(x, y, x + 65, y + 24, '', true, reward.costume ? col : '#807295', () => { SIGNIN_UI.selected = i; SFX.move(); }, selected);
      T(`第 ${daily ? i + 1 : reward.day} 天`, x + 32, y + 7, 5, reward.costume ? '#ddb6ff' : '#eee2e8');
      T(claimed ? '补给已领取' : daily ? i === next && !today ? '今日可领' : '待签到' : '站内累计签到', x + 32, y + 17, 3.7, claimed ? '#82e6a0' : '#bfb2cc');
    });
    if (daily) {
      const reward = rewards[SIGNIN_UI.selected];
      signinRewardLines(reward).forEach((line, i) => T(line, 15, 119 + i * 8, 4.5, '#eedfc3', 'left'));
      T('两入口首周奖励共用 · 每日 00:00 更新', 14, 142, 3.7, '#a697b8', 'left');
      const shared = state.total < 7 && state.sharedDays.includes(next + 1);
      forgeUIButton(14, 147, 216, 160, today ? '今日已签到' : shared ? '记录今日签到 · 补给已领取' : `签到领取 · 第 ${next + 1} 天`, signinAvailable(), col, signinClaimUI, false, 5);
    } else {
      const reward = rewards[SIGNIN_UI.selected];
      signinRewardLines(reward).forEach((line, i) => T(line, 15, 96 + i * 8, 4.5, '#eedfc3', 'left'));
      if (!TAP_GIFT_INPUT) T(window.dungeonDesktop ? 'TapTap 礼包请在 H5 版本中兑换' : TAP_SIGNIN_CONFIG.eventUrl ? 'TapTap 签到后，复制礼包码在此兑换' : 'TapTap 站内活动尚未开放', 14, 123, 3.9, '#aebccb', 'left');
      forgeUIButton(14, 134, 112, 146, TAP_GIFT_INPUT ? '确认兑换' : '打开站内活动', TAP_GIFT_INPUT ? !TAP_GIFTS.busy : !!TAP_SIGNIN_CONFIG.eventUrl, '#83d4de', TAP_GIFT_INPUT ? tapGiftInputSubmit : tapSigninEventOpen, false, 4.5);
      forgeUIButton(120, 134, 216, 146, TAP_GIFT_INPUT ? '取消输入' : TAP_GIFTS.busy ? '正在兑换…' : '兑换礼包码', TAP_GIFT_INPUT ? true : tapGiftConfigured() && !TAP_GIFTS.busy, '#bd8aff', TAP_GIFT_INPUT ? tapGiftInputClose : tapGiftInputOpen, false, 4.5);
      T(TAP_GIFTS.message || '与营地首周补给共用 · 奖励不重复领取', 14, 154, 3.7, '#bda7cf', 'left');
    }
    panel(235, 100, 306, 157, '#21152e', col, 1);
    const s = costumePreview('violetStar'), scale = Math.min(2.3, 60 / s.w, 43 / s.h);
    bigIcon(s, 270.5 - s.w * scale / 2, 144 - s.h * scale, scale);
    T('紫曜星卫 · 史诗', 270.5, 151, 3.9, '#d8b0ff');
    if (TAP_GIFT_INPUT) tapGiftInputPosition();
    toast(160, 162);
  },
};
TOWN_MENU_UI.signin = MENU_SIGNIN;
