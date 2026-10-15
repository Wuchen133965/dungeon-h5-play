'use strict';
// Permanent growth and silverwork stay at their residents' workstations in the walkable town.
Object.assign(TOWN_MENUS, {
  trainer: { title: '训练官 塔伦 · 历练', col: '#85cbb4', talk: ['把魂晶化为根基，下一次也会更强。', '八项基本功，每一级都永久保留。'] },
  refiner: { title: '铸锋师 赫德 · 强化', col: '#e2bd7c', talk: ['我提升武器的潜力，你仍要在地牢找到它。', '等级到达当前上限，才能升阶。'] },
  artificer: { title: '银武设计师 赛琳 · 组装', col: '#9bdce5', talk: ['先选部件，再把设计交给布洛克。', '银武更强，也值得投入更多魂晶。'] },
});
Object.assign(TOWN.sel, { trainer: 0, refiner: 0, artificer: 0, silverCraft: 0 });
TOWN.smithTab = 'blueprints';
const FORGE_UI = { recipe: null, action: 'upgrade', preview: new Map(), group: 'structure', designDetail: 'part', effectPage: 0 };
const FORGE_UI_GROUPS = [{ id: 'structure', name: '武器结构', slots: ['type', 'head', 'grip', 'guard', 'pommel', 'shaft', 'edge'] },
  { id: 'arcane', name: '灵能构造', slots: ['core', 'rune', 'channel', 'socket'] },
  { id: 'form', name: '形制 / 染色', slots: ['length', 'weight', 'balance', 'dye'] }, { id: 'library', name: '我的蓝图', slots: [] }];
const forgeUICost = c => Number.isFinite(c) ? `${c} 魂晶` : '已达上限';
function forgeUIText(s, x, y, width, size = 4.6, col = '#c8bcd0', rows = 3, step = 6.2) {
  townWrapText(String(s || ''), width, size).slice(0, rows).forEach((t, i) => T(t, x, y + i * step, size, col, 'left'));
}
function forgeUIResult(ok) { serviceResult(ok, FORGE_MESSAGE || '已完成', FORGE_MESSAGE || '当前无法操作'); }
function forgeUIButton(x0, y0, x1, y1, label, enabled, col, run, selected = false, size = 5) {
  const hover = enabled && uiHit(x0, y0, x1, y1, run);
  panel(x0, y0, x1, y1, hover ? '#35404a' : enabled ? '#26313a' : '#19151d', selected ? '#f4e6bd' : enabled ? col : '#4a4058', 1);
  T(label, (x0 + x1) / 2, (y0 + y1) / 2, size, enabled ? '#eee9dd' : '#83798c');
}
function forgeUIPage(key, n, pageSize, y = 136) {
  const pages = Math.max(1, Math.ceil(n / pageSize)), page = Math.floor(serviceIndex(key, Math.max(1, n)) / pageSize);
  for (const [delta, x, label] of [[-1, 12, '◀'], [1, 106, '▶']]) {
    forgeUIButton(x, y, x + 21, y + 11, label, pages > 1, '#a096aa', () => {
      if (key === 'artificer' && typeof forgeUINameCancel === 'function') forgeUINameCancel();
      TOWN.sel[key] = ((page + delta + pages) % pages) * pageSize; SFX.move();
    });
  }
  T(`${n ? page + 1 : 0} / ${n ? pages : 0} 页`, 69.5, y + 5.5, 4.6, '#a096aa');
}
function forgeUIWheel(key, n, e) {
  if (!e.deltaY || !n) return;
  e.preventDefault(); serviceNav(key, n, 0, e.deltaY > 0 ? 1 : -1);
}
function forgeUIWeaponPreview(it, x, y, scale = 1) {
  if (!it) return;
  if (!it.silver || typeof drawSilverWeapon !== 'function') { bigIcon(itemIcon(it), x, y, scale * 2); return; }
  const c = forgeUIWeaponImage(it);
  const fit = Math.min(48 * scale / c.width, 32 * scale / c.height);
  hg.imageSmoothingEnabled = false; hg.drawImage(c, x * U, y * U, c.width * fit * U, c.height * fit * U);
}
function forgeUIWeaponImage(it) {
  let c = FORGE_UI.preview.get(it.id);
  if (!c) {
    c = document.createElement('canvas'); c.width = 112; c.height = 96;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    drawSilverWeapon(it, 20, 64, -Math.PI / 9, 1.7, ctx);
    // Trim the transparent margin so the assembled parts remain legible on small PC windows.
    const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
    let left = c.width, top = c.height, right = -1, bottom = -1;
    for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) if (pixels[(yy * c.width + xx) * 4 + 3]) {
      left = Math.min(left, xx); top = Math.min(top, yy); right = Math.max(right, xx); bottom = Math.max(bottom, yy);
    }
    if (right >= left) {
      const trim = document.createElement('canvas'); trim.width = right - left + 5; trim.height = bottom - top + 5;
      trim.getContext('2d').drawImage(c, left, top, right - left + 1, bottom - top + 1, 2, 2, right - left + 1, bottom - top + 1); c = trim;
    }
    FORGE_UI.preview.set(it.id, c);
    if (FORGE_UI.preview.size > 32) FORGE_UI.preview.delete(FORGE_UI.preview.keys().next().value);
  }
  return c;
}
function forgeUIWeaponCard(it, title, col, lines) {
  panel(134, 43, 308, 133, '#17131c', '#5e6569', 1);
  T(title, 142, 52, Math.max(4.3, Math.min(6.5, 6.5 * 156 / Math.max(156, tw(title, 6.5)))), col, 'left');
  forgeUIWeaponPreview(it, 141, 57, .85);
  lines.slice(0, 7).forEach((s, i) => forgeUIText(s, 189, 65 + i * 8.3, 110, 4.5, i < 2 ? '#eee5d2' : '#a9a5b2', 1));
}

const MENU_TRAINING = {
  nav(vx, vy) { serviceNav('trainer', FORGE_TRAINING.length, vx, vy); },
  wheel(e) { forgeUIWheel('trainer', FORGE_TRAINING.length, e); },
  ok() { const d = FORGE_TRAINING[serviceIndex('trainer', FORGE_TRAINING.length)]; forgeUIResult(forgeTrain(d.id)); },
  draw(k) {
    const col = serviceFrame('trainer', k), sel = serviceIndex('trainer', FORGE_TRAINING.length), page = Math.floor(sel / 4), d = FORGE_TRAINING[sel];
    FORGE_TRAINING.slice(page * 4, page * 4 + 4).forEach((a, i) => serviceRow('trainer', page * 4 + i, 45 + i * 21, a.name,
      `Lv.${forgeTrainingState(a.id)} / ${a.max} · ${forgeUICost(forgeTrainingCost(a.id))}`, a.col || col, page * 4 + i === sel));
    panel(134, 43, 308, 133, '#171c1b', '#507465', 1);
    bigIcon(icon(d.icon || 'gem', d.col || col, '#45635b', '#e8efd0'), 142, 51, 2);
    T(d.name, 165, 56, 6.5, d.col || col, 'left');
    const level = forgeTrainingState(d.id), cost = forgeTrainingCost(d.id);
    T(`永久训练 Lv.${level} / ${d.max}`, 165, 65, 4.8, '#a0bdb0', 'left');
    forgeUIText(`当前累计：${d.summary ? d.summary(level) : level + ' 级'}`, 142, 79, 154, 5, '#b8e7c7', 2);
    forgeUIText(`每一级：${d.description.replace(/^每级/, '')}`, 142, 98, 154, 4.8, '#eee3ce', 2);
    T('魂晶支付 · 所有后续冒险永久生效', 142, 122, 4.5, '#a096aa', 'left');
    forgeUIButton(142, 139, 300, 154, Number.isFinite(cost) ? `训练下一级 · ${cost} 魂晶` : '这项训练已经完成', Number.isFinite(cost) && META.souls >= cost, col, () => this.ok());
    forgeUIPage('trainer', FORGE_TRAINING.length, 4);
    toast(160, 160); hints([['上下/滚轮', '选择'], ['E', '训练'], ['Esc', '离开']]);
  },
};

const MENU_REFINER = {
  nav(vx, vy) { if (vx) { FORGE_UI.action = FORGE_UI.action === 'upgrade' ? 'ascend' : 'upgrade'; SFX.move(); } else serviceNav('refiner', forgeWeapons().length || 1, 0, vy); },
  wheel(e) { forgeUIWheel('refiner', forgeWeapons().length, e); },
  ok() {
    const weapons = forgeWeapons(); if (!weapons.length) { townMsg('先解锁武器：购买图纸、局内获得，或自己打造银武。', '#a096aa'); return; }
    const it = weapons[serviceIndex('refiner', weapons.length)];
    forgeUIResult(FORGE_UI.action === 'ascend' ? forgeAscend(it.id) : forgeUpgrade(it.id));
  },
  draw(k) {
    const col = serviceFrame('refiner', k), weapons = forgeWeapons(), sel = serviceIndex('refiner', weapons.length || 1), page = Math.floor(sel / 4), it = weapons[sel];
    weapons.slice(page * 4, page * 4 + 4).forEach((a, i) => {
      const s = forgeWeaponState(a.id), name = forgeItemName(a);
      serviceRow('refiner', page * 4 + i, 44 + i * 21, name.slice(0, 15) + (name.length > 15 ? '…' : ''), `${a.silver ? '银武' : '普通武器'} · ${s.rank} 阶 · Lv.${s.level}`, a.silver ? '#9bdce5' : TIERS[a.tier].col, page * 4 + i === sel);
    });
    forgeUIPage('refiner', weapons.length, 4);
    if (!it) {
      serviceDetail('尚无可培养武器', 'hammer', col, ['有图纸：先去布洛克处解锁。', '无图纸：先在局内发现这把武器。', '银武：自己设计并打造完成。', '初始军械不强化，局内仍随机获得。']);
      toast(160, 160); hints([['Esc', '离开']]); return;
    }
    const state = forgeWeaponState(it.id), cap = forgeWeaponCap(it.id), upgrade = forgeUpgradeCost(it.id), ascend = forgeAscendCost(it.id);
    forgeUIWeaponCard(it, forgeItemName(it), it.silver ? '#9bdce5' : col, [
      `Lv.${state.level} / ${cap} · ${state.rank} / ${forgeWeaponRankCap(it.id)} 阶`,
      `最终等级上限 ${forgeWeaponMaxLevel(it.id)}`,
      ...forgeWeaponBonus(it.id),
      '养成随武器进入下一次冒险。',
    ]);
    T('仅提升武器潜力 · 局内仍需随机获得', 142, 128, 4.3, '#a096aa', 'left');
    forgeUIButton(137, 139, 221, 154, `强化 · ${forgeUICost(upgrade)}`, Number.isFinite(upgrade) && META.souls >= upgrade, col,
      () => { FORGE_UI.action = 'upgrade'; this.ok(); }, FORGE_UI.action === 'upgrade', 4.6);
    forgeUIButton(226, 139, 307, 154, Number.isFinite(ascend) ? `升阶 · ${ascend} 魂晶` : state.rank >= forgeWeaponRankCap(it.id) ? '升阶已满' : `Lv.${cap} 后升阶`, Number.isFinite(ascend) && META.souls >= ascend, '#9bdce5',
      () => { FORGE_UI.action = 'ascend'; this.ok(); }, FORGE_UI.action === 'ascend', 4.6);
    toast(160, 160); hints([['上下/滚轮', '选武器'], ['左右', '强化/升阶'], ['E', '确认'], ['Esc', '离开']]);
  },
};

function forgeUIDraft() {
  FORGE_UI.recipe = forgeRecipeNormalize(FORGE_UI.recipe) || forgeRecipeNormalize({
    type: FORGE_TYPES[0].id, head: FORGE_PARTS.head[0].id, grip: FORGE_PARTS.grip[0].id, core: FORGE_PARTS.core[0].id, rune: FORGE_PARTS.rune[0].id,
  });
  return FORGE_UI.recipe;
}
function forgeUIGroup() { return FORGE_UI_GROUPS.find(g => g.id === FORGE_UI.group) || FORGE_UI_GROUPS[0]; }
function forgeUIGroupChange(id) {
  forgeUINameCancel(); FORGE_UI.group = id; TOWN.sel.artificer = 0; FORGE_UI.effectPage = 0; FORGE_UI.designDetail = 'part'; UI_HITS.length = 0; SFX.move();
}
function forgeUISlotName(slot, recipe = forgeUIDraft()) {
  if (slot === 'type') return '武器类型';
  if (slot === 'dye') return '金属染色';
  const dimension = FORGE_DIMENSIONS.find(d => d.id === slot);
  return dimension ? dimension.name : forgeSlotName(slot, recipe.type);
}
function forgeUIPartChoices(slot, recipe = forgeUIDraft()) {
  if (slot === 'type') return FORGE_TYPES;
  if (slot === 'dye') return FORGE_DYES;
  const dimension = FORGE_DIMENSIONS.find(d => d.id === slot);
  return dimension ? dimension.options : forgePartChoices(slot, recipe);
}
function forgeUIRecipeHash(recipe) {
  let n = 2166136261;
  for (const c of forgeRecipeId(recipe)) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); }
  return (n >>> 0).toString(16).slice(-4).toUpperCase();
}
function forgeUIDesignName(recipe) { return forgeRecipeLabel(recipe); }
function forgeUIPartChange(delta, forcedSlot) {
  if (FORGE_UI.nameEdit) return;
  const recipe = forgeUIDraft(), slot = forcedSlot || forgeUIGroup().slots[serviceIndex('artificer', forgeUIGroup().slots.length)], parts = forgeUIPartChoices(slot, recipe);
  if (!parts || !parts.length) return;
  FORGE_UI.compareRecipe = { ...recipe };
  const at = Math.max(0, parts.findIndex(p => p.id === recipe[slot]));
  recipe[slot] = parts[(at + delta + parts.length) % parts.length].id;
  // A type's physical parts must stay compatible; each replaced part is shown in the editor.
  if (slot === 'type') for (const key of FORGE_SLOTS) {
    const available = forgePartChoices(key, recipe);
    if (!available.some(p => p.id === recipe[key])) recipe[key] = available[0].id;
  }
  FORGE_UI.effectPage = 0; SFX.move();
}
function forgeUITitle(text, x, y, width, size = 5.3, col = '#d3eced') {
  const lines = townWrapText(text, width, size);
  T(lines[0] + (lines.length > 1 ? '…' : ''), x, y, size, col, 'left');
}
function forgeUIFullLines(lines, key = 'effectPage', x = 142, y = 89, width = 158, size = 4.3, count = 7, step = 6.8, footY = 138) {
  const wrapped = lines.flatMap(s => townWrapText(s, width, size)), pages = Math.max(1, Math.ceil(wrapped.length / count));
  const page = FORGE_UI[key] = clamp(FORGE_UI[key] || 0, 0, pages - 1);
  wrapped.slice(page * count, page * count + count).forEach((s, i) => T(s, x, y + i * step, size, '#c7d7db', 'left'));
  forgeUIButton(x, footY, x + 20, footY + 8, '◀', pages > 1, '#9bdce5', () => { FORGE_UI[key] = (page - 1 + pages) % pages; }, false, 4);
  T(`${page + 1}/${pages} 页 · 全部效果可翻阅`, x + width / 2, footY + 4, 3.8, '#9ab9c1');
  forgeUIButton(x + width - 20, footY, x + width, footY + 8, '▶', pages > 1, '#9bdce5', () => { FORGE_UI[key] = (page + 1) % pages; }, false, 4);
  return { page, pages, wrapped };
}
function forgeUIDifference(recipe) {
  const prior = FORGE_UI.compareRecipe || forgeRecipeNormalize({ type: recipe.type, head: 'iron', grip: 'oak', core: 'star', rune: 'power' });
  const before = baseStats(), after = baseStats();
  forgeItem(forgeRecipeId(prior)).mod(before); forgeItem(forgeRecipeId(recipe)).mod(after);
  applyCostumeStats(before, wornCostume().id); applyCostumeStats(after, wornCostume().id);
  const stats = [['dmg', '攻击力', false], ['atkSpd', '攻击速度', true], ['reachMul', '近战距离', true], ['rangeMul', '弹道距离', true],
    ['maxHp', '生命上限', false], ['speed', '移动速度', false], ['crit', '暴击率', true], ['critMul', '暴伤倍率', false],
    ['block', '格挡率', true], ['dodge', '闪避率', true], ['rollCd', '闪避冷却', false], ['burn', '点燃率', true], ['freeze', '冻结率', true],
    ['chain', '闪电率', true], ['poison', '中毒率', true], ['explode', '击杀爆炸率', true], ['vamp', '击杀吸血率', true],
    ['magnet', '拾取范围', false], ['pierce', '穿透', false], ['wave', '剑气', false], ['multi', '远程弹道', false],
    ['dotMul', '持续伤害倍率', true], ['procMul', '元素触发倍率', true], ['thorns', '反伤', false],
    ['goldMul', '金币掉落倍率', true], ['chestLuck', '宝箱升阶率', true], ['luck', '幸运升阶率', true]];
  const out = stats.filter(([key]) => Number.isFinite(before[key]) && Number.isFinite(after[key]) && Math.abs(after[key] - before[key]) > .0001).map(([key, name, percent]) => {
    const n = after[key] - before[key]; return `${name} ${n >= 0 ? '+' : ''}${(n * (percent ? 100 : 1)).toFixed(percent ? 1 : 2)}${percent ? '%' : ''}`;
  });
  if (!!before.homing !== !!after.homing) out.push(`远程追踪：${after.homing ? '启用' : '移除'}`);
  return ['与上一次改装相比：', ...(out.length ? out : ['属性相同，可以自由比较外观。']), '长度、厚重、重心同时改变优势与代价。'];
}
// A single native text field provides Chinese IME without letting typing operate the game.
let FORGE_NAME_INPUT = null;
function forgeUINameCancel() {
  if (!FORGE_UI.nameEdit) return false;
  FORGE_UI.nameEdit = null; if (FORGE_NAME_INPUT) { FORGE_NAME_INPUT.remove(); FORGE_NAME_INPUT = null; }
  resetInput(); return true;
}
function forgeUINameFinish() {
  if (!FORGE_UI.nameEdit || !FORGE_NAME_INPUT) return;
  const id = FORGE_UI.nameEdit.id, value = FORGE_NAME_INPUT.value;
  const ok = forgeDesignRename(id, value); forgeUINameCancel(); forgeUIResult(ok);
}
function forgeUINameStart(design, options = {}) {
  forgeUINameCancel(); resetInput();
  const input = FORGE_NAME_INPUT = document.createElement('input');
  input.id = 'forge-design-name'; input.type = 'text'; input.maxLength = 32; input.value = design.name;
  input.setAttribute('aria-label', '银武蓝图名称'); input.autocomplete = 'off'; input.spellcheck = false;
  Object.assign(input.style, { position: 'fixed', zIndex: 30, background: '#14232b', border: '2px solid #9bdce5', color: '#eee9dd', fontFamily: 'monospace', boxSizing: 'border-box', padding: '2px 4px', outline: 'none' });
  FORGE_UI.nameEdit = { id: design.id, menu: options.menu || 'artificer', crafted: options.crafted === true };
  let composing = false;
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; });
  for (const event of ['keydown', 'keyup']) input.addEventListener(event, e => {
    e.stopImmediatePropagation();
    if (event === 'keydown' && !e.repeat && !composing && !e.isComposing && e.keyCode !== 229 && e.key === 'Escape') { e.preventDefault(); forgeUINameCancel(); }
    else if (event === 'keydown' && !e.repeat && !composing && !e.isComposing && e.keyCode !== 229 && e.key === 'Enter') { e.preventDefault(); forgeUINameFinish(); }
  }, true);
  input.addEventListener('wheel', e => e.stopPropagation());
  document.body.appendChild(input); forgeUINamePosition(); input.focus(); input.select();
}
function forgeUINamePosition() {
  if (!FORGE_UI.nameEdit) return;
  const edit = FORGE_UI.nameEdit;
  if (G.mode !== 'town' || TOWN.menu !== edit.menu || edit.menu === 'artificer' && FORGE_UI.group !== 'library' || edit.menu === 'armory' && TOWN.smithTab !== 'silver') { forgeUINameCancel(); return; }
  const b = document.getElementById('stage').getBoundingClientRect(), input = FORGE_NAME_INPUT, offset = uiMenuOffset();
  Object.assign(input.style, { left: `${b.left + b.width * (142 + offset.x) / LW}px`, top: `${b.top + b.height * (93 + offset.y) / LH}px`, width: `${b.width * 157 / LW}px`, height: `${b.height * 14 / LH}px`, fontSize: `${b.width * 4.8 / LW}px` });
}
function forgeUINameContent() {
  const crafted = FORGE_UI.nameEdit && FORGE_UI.nameEdit.crafted;
  T(crafted ? '打造完成！给你的银武起个名字' : '给这份武器蓝图起个名字', 142, 82, 4.5, '#9bdce5', 'left');
  forgeUINamePosition(); T('最多 32 字符 · 支持中文输入', 142, 117, 4.2, '#9ab9c1', 'left');
  T(crafted ? '命名后，仍需在局内随机获得。' : 'Enter 保存 · Esc 撤销，保留原名', 142, 130, 4.2, '#c7d7db', 'left');
  forgeUIButton(142, 151, 216, 162, crafted ? '保留当前名称' : '取消命名', true, '#b69186', () => forgeUINameCancel(), false, 4.5);
  forgeUIButton(221, 151, 304, 162, '保存武器名称', true, '#9bdce5', () => forgeUINameFinish(), false, 4.5);
}
const MENU_ARTIFICER = {
  nav(vx, vy) {
    if (FORGE_UI.nameEdit) return;
    if (FORGE_UI.group === 'library') { if (vx) { const n = FORGE_UI_GROUPS.length, at = FORGE_UI_GROUPS.findIndex(g => g.id === FORGE_UI.group); forgeUIGroupChange(FORGE_UI_GROUPS[(at + vx + n) % n].id); } else serviceNav('artificer', forgeDesigns().length || 1, 0, vy); }
    else if (vx) forgeUIPartChange(vx); else { serviceNav('artificer', forgeUIGroup().slots.length, 0, vy); FORGE_UI.effectPage = 0; }
  },
  wheel(e) {
    if (!e.deltaY || FORGE_UI.nameEdit) return; e.preventDefault();
    if (uiMenuPointer().x >= 134 && FORGE_UI.designDetail !== 'part') FORGE_UI.effectPage = Math.max(0, (FORGE_UI.effectPage || 0) + (e.deltaY > 0 ? 1 : -1));
    else if (FORGE_UI.group === 'library') serviceNav('artificer', forgeDesigns().length || 1, 0, e.deltaY > 0 ? 1 : -1);
    else if (e.shiftKey) forgeUIPartChange(e.deltaY > 0 ? 1 : -1);
    else { serviceNav('artificer', forgeUIGroup().slots.length, 0, e.deltaY > 0 ? 1 : -1); FORGE_UI.effectPage = 0; }
  },
  back() { return forgeUINameCancel(); },
  ok() {
    if (FORGE_UI.nameEdit) { forgeUINameFinish(); return; }
    if (FORGE_UI.group === 'library') {
      const d = forgeDesigns()[serviceIndex('artificer', forgeDesigns().length || 1)]; if (d) { FORGE_UI.recipe = { ...d.recipe }; FORGE_UI.compareRecipe = { ...d.recipe }; forgeUIGroupChange('structure'); townMsg('蓝图已载入，修改后可另存一份新设计。', '#9bdce5'); }
      return;
    }
    const recipe = forgeUIDraft(); forgeUIResult(forgeDesignSave(recipe, forgeUIDesignName(recipe)));
  },
  draw(k) {
    const col = serviceFrame('artificer', k); let tx = 12;
    FORGE_UI_GROUPS.forEach(group => { forgeUIButton(tx, 42, tx + 71, 53, group.name, true, col, () => forgeUIGroupChange(group.id), FORGE_UI.group === group.id, 4.5); tx += 75; });
    const group = forgeUIGroup(), library = group.id === 'library', designs = forgeDesigns(), count = library ? designs.length : group.slots.length;
    const sel = serviceIndex('artificer', count || 1), page = Math.floor(sel / 4), d = library ? designs[sel] : null;
    const recipe = library && d ? d.recipe : forgeUIDraft(), id = forgeRecipeId(recipe), it = forgeItem(id), saved = designs.find(d => d.id === id);
    const slot = !library ? group.slots[sel] : null, choices = slot ? forgeUIPartChoices(slot, recipe) : [], choice = choices.find(p => p.id === recipe[slot]);
    const isPart = !!slot && FORGE_SLOTS.includes(slot), known = !isPart || workshopPartKnown(slot, choice.id), workshop = workshopState();
    if (library) designs.slice(page * 4, page * 4 + 4).forEach((design, i) => {
      const index = page * 4 + i, y = 58 + i * 19;
      serviceRow('artificer', index, y, design.name.slice(0, 15), `${forgeUIRecipeHash(design.recipe)} · ${design.forged ? '已打造' : '待打造'}`, col, index === sel);
      uiHit(12, y, 127, y + 18, () => { forgeUINameCancel(); TOWN.sel.artificer = index; FORGE_UI.effectPage = 0; SFX.move(); });
    });
    else group.slots.slice(page * 4, page * 4 + 4).forEach((key, i) => {
      const index = page * 4 + i, selected = forgeUIPartChoices(key, recipe).find(p => p.id === recipe[key]), y = 58 + i * 19;
      const learned = !FORGE_SLOTS.includes(key) || workshopPartKnown(key, selected.id);
      serviceRow('artificer', index, y, forgeUISlotName(key, recipe), selected.name + (learned ? '' : ' · 未掌握'), learned ? selected.col || col : '#edb096', index === sel);
      for (const [delta, x] of [[-1, 108], [1, 117]]) forgeUIButton(x, y + 1, x + 9, y + 9, delta < 0 ? '‹' : '›', true, col, () => { TOWN.sel.artificer = index; forgeUIPartChange(delta, key); }, false, 5);
    });
    forgeUIPage('artificer', count, 4, 137);
    T(`蓝图 ${designs.length}/${FORGE_DESIGN_MAX} · 部件 ${FORGE_SLOTS.length} 槽`, 12, 153, 4.1, '#9ab9c1', 'left');
    panel(134, 58, 308, 147, '#14232b', '#67949e', 1);
    forgeUITitle(library && d ? d.name : forgeRecipeLabel(recipe), 142, 66, 157, 5.3);
    if (FORGE_UI.nameEdit) {
      forgeUINameContent();
    } else if (library && !d) {
      forgeUIText('还没有蓝图。自由搭配结构、灵能、形制与染色，再保存你的创作。', 142, 85, 156, 4.8, '#c7d7db', 5, 9);
    } else {
      [['part', library ? '外观' : '部件'], ['effects', '全部效果'], ['compare', '改装对比']].forEach(([mode, title], i) => forgeUIButton(142 + i * 53, 73, 191 + i * 53, 82, title, true, col, () => { FORGE_UI.designDetail = mode; FORGE_UI.effectPage = 0; }, FORGE_UI.designDetail === mode, 3.9));
      if (FORGE_UI.designDetail === 'effects') forgeUIFullLines(forgeRecipeEffectLines(recipe));
      else if (FORGE_UI.designDetail === 'compare') forgeUIFullLines(forgeUIDifference(recipe));
      else if (library) {
        forgeUIWeaponPreview(it, 142, 89, 1.1);
        T(`蓝图编号 ${forgeUIRecipeHash(recipe)}`, 200, 95, 4.7, col, 'left');
        T(d.forged ? '打造完成 · 个人掉落池' : '已保存 · 交铁匠打造', 200, 106, 4.1, '#9ab9c1', 'left');
        const synergy = forgeRecipeSynergies(recipe);
        forgeUIText(synergy.length ? `协同：${synergy.map(s => s.name).join('、')}` : '混搭构造 · 可继续改装再保存', 142, 133, 156, 4.1, '#c7d7db', 2, 6);
      } else {
        forgeUIWeaponPreview(it, 140, 97, 1.05);
        forgeUITitle(`${forgeUISlotName(slot, recipe)} ${choices.findIndex(p => p.id === choice.id) + 1}/${choices.length}`, 200, 91, 98, 4.3, col);
        forgeUIText(choice.description || (slot === 'dye' ? '自由染色，只改变武器外观。' : ''), 200, 102, 98, 4.1, choice.col || col, 3, 6.6);
        if (isPart) {
          T(known ? `已掌握 · ${choice.tier || 1} 级部件` : `需技艺 ${choice.requiredSkill} · 研究 ${choice.researchCost} 点`, 142, 134, 4.1, known ? '#b8e7c7' : '#edb096', 'left');
          forgeUIText(`材料：${typeof smithMaterialList === 'function' ? smithMaterialList(choice.materials || {}) || '无需额外材料' : ''}`, 142, 142, 156, 3.8, '#9ab9c1', 1);
        } else T(slot === 'dye' ? '染色不增加材料与工费' : slot === 'type' ? '不同武器有各自可用的结构部件' : '形制改变属性权衡与打造需求', 142, 138, 4.1, '#9ab9c1', 'left');
      }
      if (library) {
        forgeUIButton(142, 151, 216, 162, '自定武器名称', !!d, col, () => forgeUINameStart(d), false, 4.5);
        forgeUIButton(221, 151, 304, 162, '载入 / 继续改装', !!d, col, () => this.ok(), false, 4.3);
      } else {
        forgeUIButton(142, 151, 216, 162, !isPart ? '自由设计' : known ? '部件已掌握' : `研究 · ${choice.researchCost} 点`, isPart && !known && workshopSkill() >= choice.requiredSkill && workshop.smith.research >= choice.researchCost, col, () => forgeUIResult(workshopLearn(slot, choice.id)), false, 4.3);
        forgeUIButton(221, 151, 304, 162, saved ? saved.forged ? '银武已打造' : '蓝图已保存' : '保存蓝图 · 免费', !saved && designs.length < FORGE_DESIGN_MAX, col, () => this.ok(), false, 4.5);
      }
    }
    toast(160, 160); hints(FORGE_UI.nameEdit ? [['Enter', '保存名称'], ['Esc', '撤销']] : [['上下/滚轮', '选部位'], ['左右', '换部件'], ['E', library ? '载入' : '保存'], ['Esc', '离开']]);
  },
};

// The material workbench extends these original wooden blueprint racks.
const FORGE_BLUEPRINT_SHOP = TOWN_MENU_UI.armory;
Object.assign(TOWN_MENU_UI, { trainer: MENU_TRAINING, refiner: MENU_REFINER, artificer: MENU_ARTIFICER });
TOWN_MENUS.armory.talk.push('银武先在赛琳处设计，再交给我锻造。');
