'use strict';
// Main-menu state is separate from persistent character progression.
const TITLE_SETTINGS_KEY = 'chest_dungeon_settings_v1';
const TITLE_SETTINGS = { volume: 100, effectVolume: 100, muted: false, titleMotion: true, chapter: { act: 1, region: 1 } };
const TITLE_MENU = { page: 'main', sel: 0, visualSel: 0, focusT: 0, t: 0, note: '', hasProgress: false, fullscreen: false, hoverPoint: null };
const TITLE_GUIDE = [
  ['移动', 'WASD / 方向键'],
  ['瞄准与攻击', '鼠标指向 · 左键攻击（可按住）'],
  ['闪避', '空格'],
  ['互动 / 确认', 'E / Enter'],
  ['任务 / 本层地图', 'J / M'],
  ['属性与装备', 'Tab'],
  ['暂停 / 返回', 'Esc'],
  ['全屏 / 静音', 'F / N'],
];
const TITLE_CREDITS = [
  ['游戏制作', 'Wuchen133965'],
  ['美术风格', '原创像素角色与地牢'],
  ['音效', '程序合成音效'],
  ['冒险', '从晨星镇出发，寻找深处的宝藏'],
];

function titleMenuStoredProgress(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  if (['souls', 'runs', 'kills', 'best', 'wins'].some(k => Number(raw[k]) > 0)) return true;
  if (raw.lv && typeof raw.lv === 'object' && Object.values(raw.lv).some(n => Number(n) > 0)) return true;
  if (['unlocked', 'seen'].some(k => Array.isArray(raw[k]) && raw[k].length > 0)) return true;
  if (Array.isArray(raw.costumes && raw.costumes.owned) && raw.costumes.owned.some(id => id !== 'adventurer' && Object.hasOwn(COSTUME_BY_ID, id))) return true;
  const camp = raw.camp;
  if (!camp || typeof camp !== 'object' || Array.isArray(camp)) return false;
  const main = camp.main;
  if (main && (main.accepted || Number(main.stage) > 0 || Number(main.step) > 0)) return true;
  return !!camp.nextMeal || !!(camp.starter && camp.starter !== 'rusty') ||
    ['contracts', 'sideCompleted', 'claimed'].some(k => Array.isArray(camp[k]) && camp[k].length > 0) || !!camp.contract;
}

function titleMenuDefaultMotion() {
  try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return true; }
}

function titleMenuValidChapter(act, region) {
  if (!Number.isInteger(act) || !Number.isInteger(region) || act < 1 || region < 1) return null;
  const actData = ACTS[act - 1];
  const regionData = actData && Array.isArray(actData.regions) && actData.regions[region - 1];
  return regionData ? { act, region, actData, regionData } : null;
}

// Appearance follows an actually visited dungeon region, never development unlocks or quest chapter numbers.
function titleMenuChapter() {
  const chapter = TITLE_SETTINGS.chapter;
  return chapter && titleMenuValidChapter(chapter.act, chapter.region) || titleMenuValidChapter(1, 1);
}

function titleMenuRememberChapter(act, region) {
  if (!titleMenuValidChapter(act, region)) return false;
  const previous = TITLE_SETTINGS.chapter;
  if (previous && previous.act === act && previous.region === region) return true;
  TITLE_SETTINGS.chapter = { act, region };
  titleMenuPersistSettings();
  if (typeof titleSceneInvalidate === 'function') titleSceneInvalidate();
  return true;
}

// Call before loadMeta(): it writes default progression even for first-time players.
function titleMenuInit() {
  TITLE_SETTINGS.volume = 100; TITLE_SETTINGS.effectVolume = 100; TITLE_SETTINGS.muted = false; TITLE_SETTINGS.titleMotion = titleMenuDefaultMotion();
  TITLE_SETTINGS.chapter = { act: 1, region: 1 }; TITLE_MENU.hasProgress = false;
  try {
    const saved = JSON.parse(localStorage.getItem(TITLE_SETTINGS_KEY) || 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      if (typeof saved.volume === 'number' && Number.isFinite(saved.volume)) TITLE_SETTINGS.volume = Math.round(clamp(saved.volume, 0, 100));
      if (typeof saved.effectVolume === 'number' && Number.isFinite(saved.effectVolume)) TITLE_SETTINGS.effectVolume = Math.round(clamp(saved.effectVolume, 0, 100));
      if (typeof saved.muted === 'boolean') TITLE_SETTINGS.muted = saved.muted;
      if (typeof saved.titleMotion === 'boolean') TITLE_SETTINGS.titleMotion = saved.titleMotion;
      if (saved.chapter && typeof saved.chapter === 'object' && !Array.isArray(saved.chapter) &&
          titleMenuValidChapter(saved.chapter.act, saved.chapter.region)) {
        TITLE_SETTINGS.chapter = { act: saved.chapter.act, region: saved.chapter.region };
      }
    }
  } catch (_) { /* Settings remain usable if storage is unavailable or corrupt. */ }
  try {
    let raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = JSON.parse(localStorage.getItem(OLD_SAVE_KEY) || 'null');
    TITLE_MENU.hasProgress = titleMenuStoredProgress(raw);
  } catch (_) { /* A corrupt save should not advertise a resumable adventure. */ }
  titleMenuApplyAudio();
  titleMenuReset();
}

function titleMenuPersistSettings() {
  try { localStorage.setItem(TITLE_SETTINGS_KEY, JSON.stringify(TITLE_SETTINGS)); } catch (_) { /* Session-only settings. */ }
}

function titleMenuApplyAudio() {
  muted = TITLE_SETTINGS.muted;
  if (MASTER) MASTER.gain.value = TITLE_SETTINGS.muted ? 0 : AUDIO_MASTER_GAIN * TITLE_SETTINGS.volume / 100 * TITLE_SETTINGS.effectVolume / 100;
  if (typeof bgmUpdateVolume === 'function') bgmUpdateVolume();
}

// Also called by the global M shortcut so it shares the menu's stored preference.
function titleMenuSaveAudio() {
  TITLE_SETTINGS.muted = !!muted;
  titleMenuApplyAudio(); titleMenuPersistSettings();
}

function titleMenuSetEffectVolume(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return;
  TITLE_SETTINGS.effectVolume = Math.round(clamp(value, 0, 100));
  titleMenuApplyAudio(); titleMenuPersistSettings();
}
function titleMenuSetVolume(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return;
  TITLE_SETTINGS.volume = Math.round(clamp(value, 0, 100));
  titleMenuApplyAudio(); titleMenuPersistSettings();
}

function titleMenuIsDesktop() {
  return !!(window.dungeonDesktop && typeof window.dungeonDesktop.quit === 'function');
}

function titleMenuFullscreen() {
  if (document.fullscreenElement) return true;
  const bridge = window.dungeonDesktop;
  if (bridge && typeof bridge.isFullscreen === 'function') {
    try { return !!bridge.isFullscreen(); } catch (_) { /* Fall back to the last successful state. */ }
  }
  return TITLE_MENU.fullscreen;
}

function titleMenuToggleFullscreen() {
  const bridge = window.dungeonDesktop;
  let task;
  try {
    if (document.fullscreenElement) task = document.exitFullscreen();
    else if (bridge && typeof bridge.toggleFullscreen === 'function') task = bridge.toggleFullscreen();
    else task = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    Promise.resolve(task).then(result => {
      TITLE_MENU.fullscreen = typeof result === 'boolean' ? result : !!document.fullscreenElement;
      TITLE_MENU.note = '';
    }).catch(() => { TITLE_MENU.note = '全屏未开启，可使用 F / F11 重试'; });
  } catch (_) { TITLE_MENU.note = '全屏未开启，可使用 F / F11 重试'; }
}

function titleMenuClearInput() {
  resetInput();
  UI_HITS.length = 0; // Remove hit boxes from the page that has just closed.
}

function titleMenuReset() {
  TITLE_MENU.page = 'main'; TITLE_MENU.sel = 0; TITLE_MENU.visualSel = 0; TITLE_MENU.focusT = 0; TITLE_MENU.t = 0; TITLE_MENU.note = '';
  TITLE_MENU.hasProgress = TITLE_MENU.hasProgress || titleMenuStoredProgress(META);
  TITLE_MENU.fullscreen = !!document.fullscreenElement; TITLE_MENU.hoverPoint = null;
  titleMenuClearInput();
}

function titleMenuItems() {
  if (TITLE_MENU.page === 'tap-save') return tapSaveMenuItems();
  if (TITLE_MENU.page === 'settings') return [
    { id: 'volume', label: '总音量', value: `${TITLE_SETTINGS.volume}%` },
    { id: 'effectVolume', label: '音效音量', value: `${TITLE_SETTINGS.effectVolume}%` },
    { id: 'mute', label: '静音', value: TITLE_SETTINGS.muted ? '开启' : '关闭' },
    { id: 'fullscreen', label: '全屏', value: titleMenuFullscreen() ? '开启' : '关闭' },
    { id: 'motion', label: '首页动态', value: TITLE_SETTINGS.titleMotion ? '开启' : '关闭' },
    { id: 'defaults', label: '恢复默认设置' },
    { id: 'back', label: '返回主菜单' },
  ];
  if (TITLE_MENU.page === 'controls' || TITLE_MENU.page === 'credits') return [{ id: 'back', label: '返回主菜单' }];
  const items = [
    { id: 'start', label: TITLE_MENU.hasProgress ? '继续冒险' : '开始冒险', hint: '进入晨星镇 · 保留养成进度' },
    { id: 'settings', label: '设置' },
    { id: 'controls', label: '操作指南' },
    { id: 'credits', label: '制作名单' },
  ];
  if (typeof tapCoopAvailable === 'function' && tapCoopAvailable()) {
    items.splice(1, 0, { id: 'coop', label: 'TapTap 联机', hint: '最多 4 人一起闯关' });
  }
  if (titleMenuIsDesktop()) items.push({ id: 'quit', label: '退出游戏' });
  if (tapSaveAvailable() || tapAchievementAvailable()) items.splice(2, 0, { id: 'tap-save', label: '云存档与成就', hint: '同步 TapTap 账号进度' });
  return items;
}

function titleMenuChangePage(page) {
  TITLE_MENU.page = page; TITLE_MENU.sel = 0; TITLE_MENU.visualSel = 0; TITLE_MENU.focusT = 0; TITLE_MENU.t = 0; TITLE_MENU.note = ''; TITLE_MENU.hoverPoint = null;
  titleMenuClearInput();
}

function titleMenuFocus(index) {
  if (TITLE_MENU.sel === index) return;
  TITLE_MENU.sel = index; TITLE_MENU.focusT = 0;
  if (!TITLE_SETTINGS.titleMotion) TITLE_MENU.visualSel = index;
}

function titleMenuSelect(id) {
  const index = titleMenuItems().findIndex(item => item.id === id);
  if (index >= 0) titleMenuFocus(index);
}

// Draw code may call this every frame; stationary hover must not override keyboard navigation.
function titleMenuHover(id) {
  const pointer = Input.pointer, point = `${pointer.x}:${pointer.y}`;
  if (!pointer.active || point === TITLE_MENU.hoverPoint) return;
  TITLE_MENU.hoverPoint = point; titleMenuSelect(id);
}

function titleMenuActivate(id) {
  if (G.mode !== 'title') return false;
  const items = titleMenuItems(), item = items.find(it => it.id === id);
  if (!item) return false; // A stale click must not activate controls on a different page.
  titleMenuFocus(items.indexOf(item));
  if (tapSaveAvailable() && tapSaveCanUpload() && !TAP_PROGRESS.loginChecked && ['start', 'coop', 'coop-tap'].includes(id)) {
    tapProgressTick(); TITLE_MENU.note = '正在比较本机和云端存档，请稍候'; return false;
  }
  if (TAP_PROGRESS.busy && ['start', 'coop', 'coop-tap', 'quit', 'tap-cancel'].includes(id)) {
    TITLE_MENU.note = '云存档正在同步，请稍候'; return false;
  }
  if (id === 'tap-save') { SFX.select(); titleMenuChangePage('tap-save'); return true; }
  if (['tap-sync', 'tap-local', 'tap-cloud'].includes(id)) { tapSaveSync(id === 'tap-local' ? 'local' : id === 'tap-cloud' ? 'cloud' : ''); return true; }
  if (id === 'tap-achievements') { tapAchievementsShow(); return true; }
  if (id === 'tap-cancel') { tapSaveCancel(); titleMenuClearInput(); return true; }
  if (id === 'coop' || id === 'coop-tap') {
    SFX.select(); titleMenuClearInput(); coopOpenLobby('tap'); return true;
  }
  if (id === 'start') {
    SFX.select(); titleMenuClearInput(); enterTown();
    G.trans = null; G.fade = 0; // Title and camp use separate scenes, so no stale camp fade is needed.
    return true;
  }
  if (['settings', 'controls', 'credits'].includes(id)) { SFX.select(); titleMenuChangePage(id); return true; }
  if (id === 'back') { SFX.select(); titleMenuChangePage('main'); return true; }
  if (id === 'quit') {
    titleMenuClearInput();
    try { window.dungeonDesktop.quit(); } catch (_) { TITLE_MENU.note = '退出未完成，可关闭游戏窗口'; }
    return true;
  }
  if (id === 'volume') titleMenuSetVolume(TITLE_SETTINGS.volume >= 100 ? 0 : TITLE_SETTINGS.volume + 10);
  else if (id === 'effectVolume') titleMenuSetEffectVolume(TITLE_SETTINGS.effectVolume >= 100 ? 0 : TITLE_SETTINGS.effectVolume + 10);
  else if (id === 'mute') { TITLE_SETTINGS.muted = !TITLE_SETTINGS.muted; titleMenuApplyAudio(); titleMenuPersistSettings(); }
  else if (id === 'fullscreen') titleMenuToggleFullscreen();
  else if (id === 'motion') { TITLE_SETTINGS.titleMotion = !TITLE_SETTINGS.titleMotion; titleMenuPersistSettings(); }
  else if (id === 'defaults') {
    TITLE_SETTINGS.volume = 100; TITLE_SETTINGS.effectVolume = 100; TITLE_SETTINGS.muted = false; TITLE_SETTINGS.titleMotion = titleMenuDefaultMotion();
    titleMenuApplyAudio(); titleMenuPersistSettings();
    if (titleMenuFullscreen()) titleMenuToggleFullscreen();
    TITLE_MENU.note = '音量、全屏与首页动态已恢复默认';
  }
  SFX.select(); titleMenuClearInput();
  return true;
}

function titleMenuUpdate(dt) {
  TITLE_MENU.t += dt;
  TITLE_MENU.focusT += dt;
  TITLE_MENU.visualSel = TITLE_SETTINGS.titleMotion
    ? TITLE_MENU.sel + (TITLE_MENU.visualSel - TITLE_MENU.sel) * Math.exp(-dt * 18)
    : TITLE_MENU.sel;
  if (consume('mute')) toggleMute();
  const items = titleMenuItems();
  if (backPressed()) {
    if (TITLE_MENU.page !== 'main') { SFX.deny(); titleMenuChangePage('main'); }
    else titleMenuClearInput();
    return;
  }
  const direction = navPressed();
  if (direction) { titleMenuFocus((TITLE_MENU.sel + direction + items.length) % items.length); SFX.move(); }
  const horizontal = navXPressed();
  if (horizontal && TITLE_MENU.page === 'settings') {
    const item = items[TITLE_MENU.sel];
    if (item.id === 'volume') { titleMenuSetVolume(TITLE_SETTINGS.volume + horizontal * 10); SFX.move(); }
    else if (item.id === 'effectVolume') { titleMenuSetEffectVolume(TITLE_SETTINGS.effectVolume + horizontal * 10); SFX.move(); }
    else if (['mute', 'fullscreen', 'motion'].includes(item.id)) { titleMenuActivate(item.id); return; }
  }
  if (confirmPressed()) { titleMenuActivate(items[TITLE_MENU.sel].id); return; }
  Input.pressed.clear(); Input.anyPressed = false;
}
