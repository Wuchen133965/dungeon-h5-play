'use strict';
// TapTap H5 APIs are supplied by the host. Ordinary browsers retain local-only saves.
// No client secret / session key belongs in this file. An authenticated archive UUID
// binds a local save to a cloud slot; nickname/avatar are never used as account IDs.
const TAP_SAVE_KEY = 'chest_dungeon_tap_sync_v1', TAP_RESTORE_KEY = TAP_SAVE_KEY + '_restore';
const TAP_SLOT = 'DungeonMetaV3', TAP_SAVE_LIMIT = 524288, TAP_UPLOAD_INTERVAL = 600000;
const TAP_HONOUR_IDS = { return: 'DungeonReturn', hunter: 'DungeonHunter', veteran: 'DungeonVeteran', victory: 'DungeonVictory',
  collector: 'DungeonCollector', scholar: 'DungeonScholar', blueprints: 'DungeonBlueprints', talents: 'DungeonTalents' };
const TAP_PROGRESS = { binding: null, connected: false, busy: false, conflict: false, remote: null, candidate: null,
  status: '连接后自动同步局外进度', nextAt: 0, uploadAt: 0, achievement: null, pending: null, retryAt: 0, achievementNote: '', restoring: false, loginChecked: false, loginAt: 0, enabled: true };

function tapSaveAvailable() {
  const t = window.tap;
  return !!(t && typeof t.getCloudSaveManager === 'function' && typeof t.getFileSystemManager === 'function' && t.env && t.env.USER_DATA_PATH);
}
function tapAchievementAvailable() { return !!(window.tap && typeof window.tap.createAchievementManager === 'function'); }
function tapProgressSafe() {
  return ['title', 'town'].includes(G.mode) && !COOP.connected && !coopProgressRemoteActor() && !META_SAVE.readBlocked && !META_SAVE.pending && !coopProgressRead().pending;
}
function tapSaveCanonical(value) {
  if (Array.isArray(value)) return '[' + value.map(tapSaveCanonical).join(',') + ']';
  if (metaObject(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + tapSaveCanonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function tapSaveParse(raw) {
  if (typeof raw !== 'string' || raw.length > TAP_SAVE_LIMIT) throw new Error('云存档过大或格式不正确');
  const data = JSON.parse(raw, (key, value) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('云存档包含不支持的字段');
    return value;
  });
  if (!data || data.game !== TAP_SLOT || data.schema !== 1 || !metaObject(data.meta) || data.meta.ver !== 3 || data.meta.treeVer !== 2 ||
      !metaObject(data.meta.lv) || !metaObject(data.meta.prog) || !metaObject(data.meta.camp) ||
      !['unlocked', 'seen'].every(k => Array.isArray(data.meta[k]) && data.meta[k].every(v => typeof v === 'string')) ||
      !['souls', 'runs', 'kills', 'wins', 'best', 'refund', 'maxCh'].every(k => Number.isSafeInteger(data.meta[k]) && data.meta[k] >= 0) ||
      !data.receipts || data.receipts.ver !== 1 || data.receipts.pending !== null || !Array.isArray(data.receipts.runs) ||
      data.receipts.runs.length > COOP_PROGRESS_MAX_RUNS || !data.receipts.runs.every(r => r && coopProgressId(r.id) &&
        coopProgressInt(r.seq, 0, 10000000) && coopProgressInt(r.act, 1, ACTS.length) && coopProgressInt(r.diff, 0, DIFFS.length - 1))) {
    throw new Error('云存档版本或内容不兼容，已保留本机进度');
  }
  return data;
}
function tapSaveCanUpload() {
  return !coopProgressRemoteActor() && !META_SAVE.readBlocked && !META_SAVE.pending && !coopProgressRead().pending;
}
function tapSaveTime(data) {
  const t = data.meta.savedAt ?? data.savedAt;
  return Number.isSafeInteger(t) && t > 0 ? t : 0;
}
// Compare the actual save time, never the time an old file was loaded or uploaded.
function tapSavePreferCloud(local, remote, loginAt) {
  const a = tapSaveTime(local), b = tapSaveTime(remote);
  const valid = t => t > 0 && t <= loginAt + 300000;
  if (!valid(b)) return false;
  if (!valid(a)) return true;
  return Math.abs(loginAt - b) < Math.abs(loginAt - a);
}
function tapSaveSnapshot(background = false) {
  if (!(background ? tapSaveCanUpload() : tapProgressSafe())) throw new Error('请返回首页并退出组队后同步');
  const raw = localStorage.getItem(SAVE_KEY), receipts = coopProgressRead();
  return tapSaveParse(JSON.stringify({ game: TAP_SLOT, schema: 1, savedAt: metaParse(raw)?.savedAt || 0, meta: JSON.parse(raw), receipts }));
}
function tapSaveContent(data) { return tapSaveCanonical({ meta: data.meta, receipts: data.receipts }); }
function tapSaveReadBinding() {
  try {
    const b = JSON.parse(localStorage.getItem(TAP_SAVE_KEY) || 'null');
    if (b && typeof b.uuid === 'string' && b.uuid && typeof b.fileId === 'string' && typeof b.content === 'string' && b.content.length < TAP_SAVE_LIMIT) {
      b.ack = Array.isArray(b.ack) ? b.ack.filter(id => Object.values(TAP_HONOUR_IDS).includes(id)) : [];
      return b;
    }
  } catch (_) { /* Broken sync preferences never invalidate the character save. */ }
  return null;
}
function tapSaveBind(slot, data) {
  const old = TAP_PROGRESS.binding;
  const b = { uuid: slot.uuid, fileId: slot.fileId, content: tapSaveContent(data), uploadAt: TAP_PROGRESS.uploadAt,
    ack: old && old.uuid === slot.uuid ? old.ack : [] };
  localStorage.setItem(TAP_SAVE_KEY, JSON.stringify(b));
  TAP_PROGRESS.binding = b; TAP_PROGRESS.connected = true; TAP_PROGRESS.conflict = false;
  TAP_PROGRESS.remote = slot; TAP_PROGRESS.candidate = data; TAP_PROGRESS.retryAt = 0;
}
function tapSaveCall(object, method, options = {}) {
  return new Promise((resolve, reject) => {
    let done = false, timer;
    const finish = (ok, value) => {
      if (done) return; done = true;
      if (timer && typeof clearTimeout === 'function') clearTimeout(timer);
      ok ? resolve(value) : reject(new Error('TapTap 连接未完成，请检查登录或网络后重试'));
    };
    if (typeof setTimeout === 'function') timer = setTimeout(() => finish(false), 30000);
    try {
      const result = object[method]({ ...options, success: r => finish(true, r), fail: r => finish(false, r) });
      if (result && typeof result.then === 'function') result.then(r => finish(true, r), r => finish(false, r));
    } catch (_) { finish(false); }
  });
}
async function tapSaveSlot(manager) {
  const list = await tapSaveCall(manager, 'getArchiveList');
  if (!list || !Array.isArray(list.saves)) throw new Error('无法读取云存档列表');
  const slots = list.saves.filter(s => s && s.name === TAP_SLOT);
  if (slots.length > 1) throw new Error('发现多个云存档，请先在 TapTap 整理存档');
  const slot = slots[0] || null;
  if (slot && (!slot.uuid || !slot.fileId)) throw new Error('云存档信息不完整');
  return slot;
}
async function tapSaveDownload(manager, slot) {
  const file = await tapSaveCall(manager, 'getArchiveData', { archiveUUID: slot.uuid, archiveFileId: slot.fileId,
    targetFilePath: window.tap.env.USER_DATA_PATH + '/dungeon-download.json' });
  const result = await tapSaveCall(window.tap.getFileSystemManager(), 'readFile', { filePath: file.filePath, encoding: 'utf8' });
  return tapSaveParse(result.data);
}
function tapSaveConflict(slot, data, message) {
  TAP_PROGRESS.connected = false; TAP_PROGRESS.conflict = true; TAP_PROGRESS.remote = slot; TAP_PROGRESS.candidate = data;
  TAP_PROGRESS.status = message; TAP_PROGRESS.pending = null;
}
function tapSaveMergeReceipts(a, b) {
  const runs = new Map();
  for (const r of [...a.runs, ...b.runs]) {
    const old = runs.get(r.id);
    if (!old) runs.set(r.id, { ...r });
    else { old.seq = Math.max(old.seq, r.seq); old.started = old.started || r.started; old.settled = old.settled || r.settled; }
  }
  return { ver: 1, runs: [...runs.values()].slice(-COOP_PROGRESS_MAX_RUNS), pending: null };
}
// A redo journal makes replacing the character and replay receipts crash-safe.
// The previous complete pair is retained as a manual recovery backup.
function tapSaveFinishRestore() {
  const raw = localStorage.getItem(TAP_RESTORE_KEY);
  if (!raw) return true;
  const journal = JSON.parse(raw), data = tapSaveParse(journal.data);
  if (!journal.binding || !journal.binding.uuid || !journal.binding.fileId) throw new Error('云存档恢复记录无效');
  if (journal.before) localStorage.setItem(TAP_SAVE_KEY + '_backup', journal.before);
  localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify(data.meta));
  localStorage.setItem(SAVE_KEY, JSON.stringify(data.meta));
  localStorage.setItem(COOP_PROGRESS_KEY, JSON.stringify(data.receipts));
  localStorage.setItem(TAP_SAVE_KEY, JSON.stringify(journal.binding));
  localStorage.removeItem(TAP_RESTORE_KEY);
  coopProgressLedger = null;
  TAP_PROGRESS.binding = tapSaveReadBinding();
  return true;
}
function tapSaveRestore(data, slot) {
  const current = tapSaveSnapshot(), old = TAP_PROGRESS.binding;
  const merged = { ...data, meta: { ...data.meta, savedAt: tapSaveTime(data) }, receipts: tapSaveMergeReceipts(current.receipts, data.receipts) };
  const binding = { uuid: slot.uuid, fileId: slot.fileId, content: tapSaveContent(data), uploadAt: TAP_PROGRESS.uploadAt,
    ack: old && old.uuid === slot.uuid ? old.ack : [] };
  localStorage.setItem(TAP_RESTORE_KEY, JSON.stringify({ data: JSON.stringify(merged), binding, before: JSON.stringify(current) }));
  TAP_PROGRESS.restoring = true;
  try {
    tapSaveFinishRestore(); loadMeta();
    if (META_SAVE.pending || META_SAVE.readBlocked) throw new Error('恢复尚未完成，请恢复本机存储后重启');
    TITLE_MENU.hasProgress = titleMenuStoredProgress(META);
    TAP_PROGRESS.connected = true; TAP_PROGRESS.conflict = false;
    TAP_PROGRESS.status = '已使用云端进度；本机旧进度已备份';
  } catch (error) {
    META_SAVE.readBlocked = true; metaSaveFailed('云存档恢复尚未完成，请恢复本机存储后重启');
    throw error;
  } finally { TAP_PROGRESS.restoring = false; }
}
async function tapSaveSync(choice = '', login = false) {
  const s = TAP_PROGRESS;
  if (!tapSaveAvailable() || s.busy) return false;
  const background = !login && !choice && !!s.binding && !s.conflict;
  const safe = () => background ? tapSaveCanUpload() : tapProgressSafe();
  if (!safe()) { s.status = '请返回首页并退出组队后同步'; return false; }
  if (choice && !s.conflict) return false;
  s.enabled = true;
  if (login) s.loginAt = Date.now();
  s.busy = true; s.status = '正在核对云端进度…';
  let initialContent;
  try {
    initialContent = tapSaveContent(tapSaveSnapshot(background));
    const manager = window.tap.getCloudSaveManager(), slot = await tapSaveSlot(manager);
    if (!safe()) throw new Error('同步暂停，请返回首页并退出组队');
    const b = s.binding;
    // A confirmation is valid only for the exact account/remote version shown.
    if (choice && ((slot && (!s.remote || slot.uuid !== s.remote.uuid || slot.fileId !== s.remote.fileId)) || (!slot && s.remote))) {
      choice = ''; s.connected = false;
    }
    let remote = null;
    if (slot && (!b || b.uuid !== slot.uuid || b.fileId !== slot.fileId || !s.connected || choice || login)) remote = await tapSaveDownload(manager, slot);
    if (!safe()) throw new Error('同步暂停，请返回首页并退出组队');
    const local = tapSaveSnapshot(background);
    if (login && !choice) {
      if (b && (!slot || b.uuid !== slot.uuid)) {
        tapSaveConflict(slot, remote, '账号或云存档已变化，已保留本机进度，请选择当前账号的存档'); return false;
      }
      if (slot && remote) {
        if (tapSaveContent(local) === initialContent && tapSavePreferCloud(local, remote, s.loginAt)) {
          tapSaveRestore(remote, slot); s.remote = slot; s.candidate = remote;
          s.status = '已自动使用保存时间更近的云端存档；本机旧档已备份';
        } else {
          tapSaveBind(slot, remote); s.status = '已使用本机存档，10 分钟后自动保存云端';
        }
        s.nextAt = Date.now() + TAP_UPLOAD_INTERVAL; tapAchievementSync(); return true;
      }
      // First connection with no cloud archive: establish one baseline, then use the ten-minute interval.
      if (!slot && !b) choice = 'local';
    }
    if (choice === 'cloud' && remote) {
      tapSaveRestore(remote, slot); s.remote = slot; s.candidate = remote;
      s.nextAt = Date.now() + TAP_UPLOAD_INTERVAL; tapAchievementSync(); return true;
    }
    if (!choice && slot && remote && tapSaveContent(remote) === tapSaveContent(local)) {
      tapSaveBind(slot, remote); s.status = '云端与本机进度一致';
      s.nextAt = Date.now() + TAP_UPLOAD_INTERVAL; tapAchievementSync(); return true;
    }
    if (!choice && ((!slot && (!b || !s.connected)) || (slot && (!b || b.uuid !== slot.uuid || b.fileId !== slot.fileId)))) {
      tapSaveConflict(slot, remote, !slot ? '当前账号暂无云存档，是否保存本机进度？' : '本机与云端进度不同，请选择保留哪份');
      return false;
    }
    if ((!slot && choice !== 'local') || (slot && b && slot.uuid !== b.uuid && choice !== 'local')) {
      tapSaveConflict(slot, remote, '账号或云存档已变化，请重新选择'); return false;
    }
    if (!choice && b && b.content === tapSaveContent(local)) {
      s.connected = true; s.status = '已同步，局外进度将自动保存'; s.nextAt = Date.now() + TAP_UPLOAD_INTERVAL;
      tapAchievementSync(); return true;
    }
    // Explicit local choice may create a slot, but cannot bypass upload throttling.
    const wait = TAP_UPLOAD_INTERVAL - (Date.now() - s.uploadAt);
    if (wait > 0) { s.status = `等待 ${Math.ceil(wait / 1000)} 秒后再保存云端`; s.nextAt = s.uploadAt + TAP_UPLOAD_INTERVAL; return false; }
    const data = tapSaveSnapshot(background);
    if (remote) data.receipts = tapSaveMergeReceipts(data.receipts, remote.receipts);
    const filePath = window.tap.env.USER_DATA_PATH + '/dungeon-upload.json';
    await tapSaveCall(window.tap.getFileSystemManager(), 'writeFile', { filePath, data: JSON.stringify(data), encoding: 'utf8' });
    if (!safe()) throw new Error('同步暂停，请返回首页并退出组队');
    // Revalidate immediately before upload; the SDK has no compare-and-swap API.
    const check = await tapSaveSlot(manager);
    if (!safe()) throw new Error('同步暂停，请返回首页并退出组队');
    if ((slot && (!check || slot.uuid !== check.uuid || slot.fileId !== check.fileId)) || (!slot && check)) {
      s.connected = false; throw new Error('云端进度刚刚变化，请重新同步并选择');
    }
    s.uploadAt = Date.now();
    // Persist the attempted call time too: restart/timeout must not evade the limit.
    localStorage.setItem(TAP_SAVE_KEY + '_uploadAt', String(s.uploadAt));
    const result = await tapSaveCall(manager, slot ? 'updateArchive' : 'createArchive', {
      ...(slot ? { archiveUUID: slot.uuid } : {}), archiveFilePath: filePath,
      archiveMetaData: { name: TAP_SLOT, summary: `宝箱地牢 · 冒险 ${data.meta.runs} 次 · 魂晶 ${data.meta.souls}`, extra: 'schema1', playtime: 0 } });
    if (!result || !result.uuid || !result.fileId || (slot && result.uuid !== slot.uuid)) throw new Error('上传结果未确认，请重新核对云端');
    if (!safe()) throw new Error('云端已收到进度，返回首页后将再次核对');
    // Commit merged replay receipts locally before recording the acknowledged snapshot.
    const receipts = tapSaveMergeReceipts(coopProgressRead(), data.receipts);
    if (!coopProgressStore(receipts)) throw new Error('本机保存待恢复，云端已经收到进度');
    coopProgressLedger = receipts;
    tapSaveBind({ ...result, name: TAP_SLOT }, data);
    s.status = '云存档已保存，局外进度将自动同步'; s.nextAt = Date.now() + TAP_UPLOAD_INTERVAL;
    tapAchievementSync(); return true;
  } catch (error) {
    s.connected = false; s.status = error.message || '同步未完成，本机进度仍然保留';
    s.nextAt = Date.now() + TAP_UPLOAD_INTERVAL; return false;
  } finally { s.busy = false; s.loginChecked = true; }
}

function tapAchievementManager() {
  const s = TAP_PROGRESS;
  if (s.achievement) return s.achievement;
  if (!tapAchievementAvailable()) return null;
  const manager = window.tap.createAchievementManager({ toastEnable: true });
  manager.registerListener({
    onAchievementSuccess(code, achievement) {
      const p = s.pending;
      if (!p || !achievement || achievement.achievementId !== p.id || !s.connected || !s.binding || s.binding.uuid !== p.uuid) return;
      // Only an unlock confirmation acknowledges a normal achievement.
      if (code !== 70001) return;
      s.pending = null;
      const ack = [...new Set([...s.binding.ack, p.id])];
      try { const b = { ...s.binding, ack }; localStorage.setItem(TAP_SAVE_KEY, JSON.stringify(b)); s.binding = b; s.achievementNote = '已达成功勋已同步到 TapTap'; }
      catch (_) { s.achievementNote = '成就已达成，本机确认待保存'; }
    },
    onAchievementFailure(id) {
      if (s.pending && id === s.pending.id) { s.pending = null; s.retryAt = Date.now() + TAP_UPLOAD_INTERVAL; }
      s.achievementNote = '成就未同步，请检查登录、网络或后台成就配置';
    },
  });
  s.achievement = manager; return manager;
}
function tapAchievementSync() {
  const s = TAP_PROGRESS;
  if (!s.connected || !s.binding || !tapAchievementAvailable() || !tapProgressSafe() || s.pending || Date.now() < s.retryAt) return;
  const honour = CAMP_HONOURS.find(h => h.count() >= h.goal && !s.binding.ack.includes(TAP_HONOUR_IDS[h.id]));
  if (!honour) return;
  try {
    const manager = tapAchievementManager(), id = TAP_HONOUR_IDS[honour.id];
    s.pending = { id, uuid: s.binding.uuid, until: Date.now() + 15000 };
    manager.unlockAchievement({ achievementId: id });
  } catch (_) { s.pending = null; s.retryAt = Date.now() + TAP_UPLOAD_INTERVAL; s.achievementNote = '成就服务暂不可用，稍后重试'; }
}
function tapAchievementsShow() {
  try { tapAchievementManager().showAchievements(); }
  catch (_) { TAP_PROGRESS.achievementNote = '成就服务暂不可用，请在 TapTap 内打开游戏'; }
}
function tapSaveCancel() {
  if (TAP_PROGRESS.busy) return;
  try { localStorage.removeItem(TAP_SAVE_KEY); }
  catch (_) { TAP_PROGRESS.status = '暂不同步未保存，请恢复本机存储后重试'; return; }
  TAP_PROGRESS.conflict = false; TAP_PROGRESS.connected = false; TAP_PROGRESS.binding = null; TAP_PROGRESS.enabled = false; TAP_PROGRESS.loginChecked = true;
  TAP_PROGRESS.pending = null; TAP_PROGRESS.status = '仅保存到本机；可随时重新连接';
}
function tapProgressTick() {
  const s = TAP_PROGRESS;
  if (!tapSaveAvailable() || !s.enabled || !tapSaveCanUpload()) return;
  const now = Date.now();
  if (!s.loginChecked) { if (!s.busy && tapProgressSafe()) tapSaveSync('', true); return; }
  if (s.pending && now >= s.pending.until) { s.pending = null; s.retryAt = now + TAP_UPLOAD_INTERVAL; s.achievementNote = '成就尚未确认，将稍后重试'; }
  // Account verification precedes each batch. Do not send achievements from a
  // stale cached connection between polls; tapSaveSync triggers one unlock.
  if (!s.busy && !s.conflict && now >= s.nextAt) {
    if (!s.binding && !tapProgressSafe()) return;
    s.nextAt = now + TAP_UPLOAD_INTERVAL; tapSaveSync('', !s.binding);
  }
}
function tapSaveMenuItems() {
  const s = TAP_PROGRESS, items = s.conflict ? [{ id: 'tap-local', label: s.remote ? '保留本机进度（覆盖云端）' : '将本机进度保存到当前账号' },
    ...(s.candidate ? [{ id: 'tap-cloud', label: '使用云端进度（本机先备份）' }] : []), { id: 'tap-cancel', label: '暂不同步' }] :
    [{ id: 'tap-sync', label: s.busy ? '正在同步…' : '连接 / 同步云存档' }];
  if (tapAchievementAvailable()) items.push({ id: 'tap-achievements', label: '查看 TapTap 成就' });
  return [...items, { id: 'back', label: '返回主菜单' }];
}
function drawTapSaveMenu(color) {
  const s = TAP_PROGRESS;
  frame(42, 23, 278, 162, '云存档与成就', color);
  titleText(s.status, 160, 42, 4.5, '#f3c17c', { align: 'center' });
  const local = `本机：魂晶 ${META.souls} · 冒险 ${META.runs} · 击败 ${META.kills}`;
  titleText(local, 56, 57, 4.5, '#eadfec');
  const cloud = s.candidate && s.candidate.meta;
  titleText(cloud ? `云端：魂晶 ${cloud.souls} · 冒险 ${cloud.runs} · 击败 ${cloud.kills}` : '云端：连接后查看当前账号进度', 56, 68, 4.5, '#b7aabb');
  titleText('回城 / 通关保存本机；云端每 10 分钟同步', 56, 80, 3.7, '#9c8ba7');
  const items = titleMenuItems(), ys = items.map((_, i) => 96 + i * 12);
  items.forEach((item, i) => titleRow(item, 55, ys[i], 211, 11, i, 5)); titleMenuCursor(51, ys);
  titleText(s.achievementNote || '功勋达成后同步；营地奖励仍在功勋官处领取', 160, 170, 3.8, '#a69aae', { align: 'center' });
}
function tapProgressInit() {
  if (!TAP_PROGRESS.restoring) { TAP_PROGRESS.loginChecked = false; TAP_PROGRESS.loginAt = Date.now(); TAP_PROGRESS.enabled = true; }
  TAP_PROGRESS.binding = tapSaveReadBinding();
  try { TAP_PROGRESS.uploadAt = Math.max(0, Number(localStorage.getItem(TAP_SAVE_KEY + '_uploadAt')) || 0); } catch (_) { /* No background writes while local reads fail. */ }
}
const tapProgressLoadMeta = loadMeta;
loadMeta = function () {
  try { tapSaveFinishRestore(); }
  catch (_) { META_SAVE.readBlocked = true; metaSaveFailed('云存档恢复尚未完成，请恢复本机存储后重启'); return; }
  tapProgressLoadMeta(); tapProgressInit();
};
