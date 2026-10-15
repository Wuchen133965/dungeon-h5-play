'use strict';
// Crisp menu ornaments stay separate from the chapter's real pixel scene.
const TITLE_LOGO_CACHE = { scale: 0, mask: null, sheen: null };

function titleText(text, x, y, size, color, options = {}) {
  hg.save();
  hg.font = `${options.weight || 600} ${Math.round(size * U)}px ${options.serif ? '"SimSun","Noto Serif CJK SC",serif' : FONT}`;
  hg.textAlign = options.align || 'left'; hg.textBaseline = 'middle';
  hg.globalAlpha *= options.alpha === undefined ? 1 : options.alpha;
  hg.shadowColor = '#07040a'; hg.shadowBlur = 2 * U; hg.shadowOffsetY = 0.7 * U;
  hg.fillStyle = color; hg.fillText(text, x * U, y * U); hg.restore();
}

function titleEntry(delay = 0, duration = .45) {
  return TITLE_SETTINGS.titleMotion ? easeOutCubic(clamp((TITLE_MENU.t - delay) / duration)) : 1;
}

function titlePhase() {
  return TITLE_SETTINGS.titleMotion ? TITLE_MENU.t : 1.25;
}

function titleDiamond(x, y, size, color) {
  hg.beginPath(); hg.moveTo(x * U, (y - size) * U); hg.lineTo((x + size) * U, y * U);
  hg.lineTo(x * U, (y + size) * U); hg.lineTo((x - size) * U, y * U); hg.closePath();
  hg.fillStyle = color; hg.fill();
}

// Rebuild only when the display scale changes, then sweep light inside the glyphs.
function titleLogo(x, y, alpha) {
  const text = '宝箱地牢', font = `900 ${Math.round(23 * U)}px "SimSun","Noto Serif CJK SC",serif`;
  if (!TITLE_LOGO_CACHE.mask || TITLE_LOGO_CACHE.scale !== U) {
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(101 * U); mask.height = Math.ceil(34 * U);
    const ctx = mask.getContext('2d');
    ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(text, 2 * U, 17 * U);
    const sheen = document.createElement('canvas'); sheen.width = mask.width; sheen.height = mask.height;
    TITLE_LOGO_CACHE.scale = U; TITLE_LOGO_CACHE.mask = mask; TITLE_LOGO_CACHE.sheen = sheen;
  }
  hg.save(); hg.globalAlpha *= alpha;
  hg.font = font; hg.textAlign = 'left'; hg.textBaseline = 'middle';
  const metal = hg.createLinearGradient(0, (y - 13) * U, 0, (y + 12) * U);
  metal.addColorStop(0, '#fff8d2'); metal.addColorStop(.24, '#efce82'); metal.addColorStop(.43, '#bd8d45');
  metal.addColorStop(.48, '#ffe7a8'); metal.addColorStop(.62, '#ffe2a0'); metal.addColorStop(1, '#c39b59');
  hg.shadowColor = 'rgba(236,167,69,.24)'; hg.shadowBlur = 6 * U;
  hg.strokeStyle = '#2d190b'; hg.lineWidth = 1.1 * U; hg.strokeText(text, x * U, (y + .6) * U);
  hg.shadowColor = '#050309'; hg.shadowBlur = 1.7 * U; hg.shadowOffsetY = 1.2 * U;
  hg.fillStyle = metal; hg.fillText(text, x * U, y * U);
  hg.shadowBlur = 0; hg.shadowOffsetY = 0;
  hg.strokeStyle = 'rgba(255,237,181,.32)'; hg.lineWidth = .2 * U; hg.strokeText(text, x * U, y * U);
  if (TITLE_SETTINGS.titleMotion) {
    const cycle = TITLE_MENU.t % 7.6;
    if (cycle < 1.8) {
      const { mask, sheen } = TITLE_LOGO_CACHE, ctx = sheen.getContext('2d'), sweep = -24 + cycle / 1.8 * 150;
      ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, sheen.width, sheen.height); ctx.drawImage(mask, 0, 0);
      const shine = ctx.createLinearGradient((sweep - 15) * U, 0, (sweep + 15) * U, 7 * U);
      shine.addColorStop(0, 'rgba(255,249,213,0)'); shine.addColorStop(.47, 'rgba(255,251,224,.58)');
      shine.addColorStop(.54, 'rgba(255,255,247,.8)'); shine.addColorStop(1, 'rgba(255,249,213,0)');
      ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = shine; ctx.fillRect(0, 0, sheen.width, sheen.height);
      ctx.globalCompositeOperation = 'source-over'; hg.drawImage(sheen, (x - 2) * U, (y - 17) * U);
    }
  }
  hg.restore();
}

function titleRow(item, x, y, width, height, index, size = 7) {
  const hovered = uiHit(x, y - height / 2, x + width, y + height / 2, () => titleMenuActivate(item.id));
  if (hovered) titleMenuHover(item.id);
  const selected = TITLE_MENU.sel === index, color = titleMenuChapter().actData.col;
  const reveal = TITLE_MENU.page === 'main' ? titleEntry(.2 + index * .055, .4) : 1;
  const focus = TITLE_SETTINGS.titleMotion ? easeOutCubic(clamp((TITLE_MENU.focusT || 0) / .24)) : 1;
  hg.save(); hg.globalAlpha *= reveal;
  const rowAlpha = hg.globalAlpha;
  if (selected) {
    const end = x + width * (.65 + .35 * focus), pulse = .9 + Math.sin(titlePhase() * 1.35) * .06;
    const backing = hg.createLinearGradient(x * U, 0, end * U, 0);
    backing.addColorStop(0, 'rgba(83,56,30,.64)'); backing.addColorStop(.58, 'rgba(39,26,27,.62)'); backing.addColorStop(1, 'rgba(20,12,20,0)');
    hg.fillStyle = backing; hg.fillRect(x * U, (y - height / 2) * U, (end - x) * U, height * U);
    const edge = hg.createLinearGradient(x * U, 0, end * U, 0);
    edge.addColorStop(0, 'rgba(255,222,152,.63)'); edge.addColorStop(.62, 'rgba(228,180,102,.18)'); edge.addColorStop(1, 'rgba(228,180,102,0)');
    hg.fillStyle = edge; hg.fillRect(x * U, (y - height / 2) * U, (end - x) * U, Math.max(1, .22 * U));
    hg.globalAlpha *= pulse;
    hg.shadowColor = '#e1b367'; hg.shadowBlur = 2.7 * U; hg.fillStyle = '#efcf90';
    hg.fillRect(x * U, (y - height / 2 + 2) * U, Math.max(1, .55 * U), (height - 4) * U);
    hg.shadowBlur = 0;
    hg.fillStyle = color; hg.globalAlpha *= .22;
    hg.fillRect(x * U, (y + height / 2 - .35) * U, (end - x) * U, Math.max(1, .22 * U));
    hg.globalAlpha = rowAlpha;
  }
  const offset = selected ? 1.1 * focus : 0;
  titleText(item.label, x + 7 + offset, y + (1 - reveal) * 1.4, size, selected ? '#fff2d9' : '#b7aabb', { weight: selected ? 700 : 500 });
  hg.restore();
  return selected;
}

function titleMenuCursor(x, ys) {
  const visual = TITLE_SETTINGS.titleMotion && Number.isFinite(TITLE_MENU.visualSel) ? TITLE_MENU.visualSel : TITLE_MENU.sel;
  const index = clamp(visual, 0, ys.length - 1), lo = Math.floor(index), hi = Math.min(ys.length - 1, lo + 1);
  const y = lerp(ys[lo], ys[hi], index - lo);
  hg.save(); hg.globalAlpha *= TITLE_MENU.page === 'main' ? titleEntry(.18) : 1;
  hg.shadowColor = '#e1b367'; hg.shadowBlur = 3 * U;
  titleDiamond(x, y, 1.5, '#e8c787'); hg.shadowBlur = 0; titleDiamond(x, y, .55, '#fff2d2'); hg.restore();
}

function drawTitleScreen() {
  const chapter = titleMenuChapter(), color = chapter.actData.col;
  // Keep the room visible on the right and give menu text a quiet backing on the left.
  const shade = hg.createLinearGradient(0, 0, HC.width * .7, 0);
  shade.addColorStop(0, 'rgba(7,4,10,.96)'); shade.addColorStop(.58, 'rgba(7,4,10,.83)'); shade.addColorStop(1, 'rgba(7,4,10,0)');
  uiBackdrop(shade);
  if (TITLE_MENU.page !== 'main') { drawTitleSubpage(color); return; }

  const logoEntry = titleEntry(0, .65), slide = (1 - logoEntry) * -3;
  const aura = hg.createRadialGradient(66 * U, 46 * U, 3 * U, 66 * U, 46 * U, 61 * U);
  aura.addColorStop(0, 'rgba(152,104,38,.105)'); aura.addColorStop(1, 'rgba(152,104,38,0)');
  hg.fillStyle = aura; hg.fillRect(0, 0, 139 * U, 108 * U);
  titleText('CHEST DUNGEON', 23 + slide, 27, 4.2, '#b9a783', { weight: 500, alpha: logoEntry });
  titleLogo(20 + slide, 46, logoEntry);
  hg.save(); hg.globalAlpha = titleEntry(.09);
  const rule = hg.createLinearGradient(23 * U, 0, 117 * U, 0);
  rule.addColorStop(0, '#c3a86d'); rule.addColorStop(.63, 'rgba(195,168,109,.38)'); rule.addColorStop(1, 'rgba(195,168,109,0)');
  hg.fillStyle = rule; hg.fillRect(23 * U, 61 * U, 94 * U, Math.max(1, .3 * U));
  titleDiamond(21.2, 61.15, .8, '#ebd39c'); hg.restore();
  titleText(`${chapter.actData.name} · ${chapter.regionData.name}`, 23, 68, 5, '#baaac7', { weight: 500, alpha: titleEntry(.13) });

  const items = titleMenuItems(), gap = items.length > 6 ? 10 : items.length > 5 ? 12 : 14, ys = items.map((_, i) => 84 + i * gap);
  items.forEach((item, i) => titleRow(item, 22, ys[i], 106, Math.min(12, gap), i, i === 0 ? 8.5 : 6.8));
  titleMenuCursor(18, ys);
  titleText('进入晨星镇，继续你的旅途', 29, Math.max(156, ys[ys.length - 1] + 8), 3.8, '#9e90a7', { weight: 400, alpha: titleEntry(.43) });
  titleText(MOBILE_INPUT.enabled ? '点击菜单即可选择' : '鼠标选择 / ↑↓ 导航 · Enter 确认', 23, 170, 3.6, '#74677f', { weight: 400, alpha: titleEntry(.48) });
  titleText(`v${COOP_VERSION} · ${typeof MOBILE_INPUT !== 'undefined' && MOBILE_INPUT.enabled ? '触屏' : 'PC'}`, 305, 171, 3.3, '#92869b', { align: 'right', weight: 400 });
  if (TITLE_MENU.note) titleText(TITLE_MENU.note, 160, 162, 4, '#f3c17c', { align: 'center' });
}

function drawTitleSubpage(color) {
  if (TITLE_MENU.page === 'tap-save') { drawTapSaveMenu(color); return; }
  uiBackdrop('rgba(7,4,10,.5)');
  const titles = { settings: '设置', controls: '操作指南', credits: '制作名单' };
  frame(58, 23, 262, 159, titles[TITLE_MENU.page], color);
  if (TITLE_MENU.page === 'settings') {
    titleText(MOBILE_INPUT.enabled ? '点击调整选项 · 设置会自动保存' : '左右调整选项 · 设置会自动保存', 160, 42, 4, '#a69aae', { align: 'center', weight: 400 });
    const items = titleMenuItems(), ys = items.map((_, i) => 54 + i * 14);
    items.forEach((item, i) => {
      const y = ys[i];
      titleRow(item, 72, y, 176, 13, i, 5.8);
      if (item.id === 'volume' || item.id === 'effectVolume') {
        const change = value => { titleMenuSelect(item.id); (item.id === 'volume' ? titleMenuSetVolume : titleMenuSetEffectVolume)(value); SFX.move(); };
        const value = TITLE_SETTINGS[item.id];
        const minus = uiHit(157, y - 6, 171, y + 6, () => change(TITLE_SETTINGS[item.id] - 10));
        const plus = uiHit(218, y - 6, 232, y + 6, () => change(TITLE_SETTINGS[item.id] + 10));
        uiHit(173, y - 6, 214, y + 6, () => { const point = uiMenuPointer(); change((point.x - 175) / 37 * 100); });
        titleText('−', 164, y, 7, minus ? '#ffffff' : '#baaac7', { align: 'center' });
        titleText('+', 225, y, 7, plus ? '#ffffff' : '#baaac7', { align: 'center' });
        hg.fillStyle = '#302635'; hg.fillRect(175 * U, (y - 1.5) * U, 37 * U, 3 * U);
        const volume = hg.createLinearGradient(175 * U, (y - 1.5) * U, 212 * U, (y + 1.5) * U);
        volume.addColorStop(0, '#a67d43'); volume.addColorStop(1, '#f4d998');
        hg.fillStyle = volume; hg.fillRect(175 * U, (y - 1.5) * U, 37 * U * value / 100, 3 * U);
        hg.fillStyle = 'rgba(255,244,211,.35)'; hg.fillRect(175 * U, (y - 1.5) * U, 37 * U * value / 100, Math.max(1, .3 * U));
        titleText(item.value, 246, y, 4.4, '#e3d8e8', { align: 'right' });
      } else if (item.value) titleText(item.value, 239, y, 5, '#ded2e5', { align: 'right' });
    });
    titleMenuCursor(68, ys);
  } else if (TITLE_MENU.page === 'controls') {
    const guide = typeof MOBILE_INPUT !== 'undefined' && MOBILE_INPUT.enabled ? [
      ['移动', '左侧摇杆'], ['瞄准与攻击', '按住攻击自动瞄准 · 拖动手动瞄准'], ['闪避', '点击闪避'], ['互动 / 确认', '点击互动 / 确认'],
      ['任务 / 本层地图', '点击任务 / 地图'], ['属性与装备', '点击装备'], ['暂停 / 返回', '点击装备 / 返回'], ['菜单与地图', '点击选项 · 滑动地图详情'],
    ] : TITLE_GUIDE;
    guide.forEach(([label, value], i) => {
      const y = 45 + i * 10.5;
      titleText(label, 74, y, 4.8, '#a89ab3', { weight: 500 });
      titleText(value, 246, y, 4.4, '#eadfec', { align: 'right', weight: 500 });
    });
    titleRow(titleMenuItems()[0], 91, 143, 138, 13, 0, 5.8);
    titleMenuCursor(87, [143]);
  } else {
    TITLE_CREDITS.forEach(([label, value], i) => {
      const y = 48 + i * 20;
      titleText(label, 75, y, 4.2, '#9c8ba7', { weight: 500 });
      titleText(value, 75, y + 8, 5.1, '#e4d7e8', { weight: 500 });
    });
    titleRow(titleMenuItems()[0], 91, 143, 138, 13, 0, 5.8);
    titleMenuCursor(87, [143]);
  }
  if (TITLE_MENU.note) titleText(TITLE_MENU.note, 160, 166, 4, '#f3c17c', { align: 'center' });
  else titleText(MOBILE_INPUT.enabled ? '点击右上角返回' : 'Esc 返回主菜单', 160, 170, 3.8, '#8f819b', { align: 'center', weight: 400 });
}
