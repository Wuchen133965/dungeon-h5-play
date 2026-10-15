'use strict';
// Story scenes use the same walk-up interaction as the residents' regular services.
const TOWN_SPEAKERS = {
  guild: { name: '委托官 莉娅', col: '#edc578', spr: 'guild' },
  mentor: { name: '导师 艾琳', col: '#82e68c', spr: 'mentor' },
  smith: { name: '铁匠 布洛克', col: '#ffb060', spr: 'smith' },
  quartermaster: { name: '军需官 雷恩', col: '#8ac8ff', spr: 'quartermaster' },
  cook: { name: '厨师 米洛', col: '#f3c17a', spr: 'cook' },
  archivist: { name: '书记官 诺拉', col: '#c8a0ff', spr: 'archivist' },
  hero: { name: '冒险者', col: '#e8dcc8', spr: 'hero' },
  narrator: { name: '晨星镇 · 见闻', col: '#c0b8cd', spr: null },
};
function townWrapText(text, width, size) {
  const lines = []; let line = '';
  for (const ch of String(text || '')) {
    if (ch === '\n') { lines.push(line); line = ''; continue; }
    if (line && tw(line + ch, size) > width) {
      const last = [...line].pop();
      // Keep closing punctuation with the preceding character, and an opening quote with the next line.
      if ((/^[，。！？、：；）》」』】…,.!?;:%]$/.test(ch) || /^[（《「『【“]$/.test(last)) && line.length > last.length) {
        lines.push(line.slice(0, -last.length)); line = last + ch;
      } else { lines.push(line); line = ch; }
    }
    else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}
function townQuestScene(menu) {
  return pendingQuestInspect(menu) || pendingQuestDialogue(menu);
}
function openTownInteraction(menu) {
  const scene = townQuestScene(menu);
  if (scene) { openTownDialogue(scene, menu === 'board' ? null : menu); return; }
  if (menu === 'board') {
    openTownDialogue({ title: '公会告示板', scope: 'ambient', lines: [
      { speaker: 'narrator', text: '巡逻、寻物、送信与居民的求助写满了告示板。接取和交付委托，请到旁边找莉娅。' },
    ] }, null); return;
  }
  openTownMenu(menu);
}
function openTownQuestReview(q) {
  const lines = [{ speaker: 'narrator', text: `你翻开公会保存的「${q.name}」记录，回看居民的谈话和当时的线索。` }];
  for (const step of q.steps) {
    if (!step.lines) continue;
    lines.push({ speaker: 'narrator', text: step.setting || step.label }, ...step.lines);
  }
  openTownDialogue({ title: `剧情回顾 · ${q.name}`, scope: 'review', lines }, 'guild');
}
function openTownDialogue(scene, returnMenu) {
  const pages = [];
  for (const line of scene.lines || []) {
    const wrapped = townWrapText(line.text, 226, 6.4);
    for (let i = 0; i < wrapped.length; i += 4) pages.push({ speaker: line.speaker, lines: wrapped.slice(i, i + 4) });
  }
  if (!pages.length) return;
  TOWN.dialogue = { scene, returnMenu, pages, page: 0 };
  TOWN.menu = 'dialogue'; TOWN.menuT = 0; TOWN.msg = null; resetInput();
}
function leaveTownDialogue(service = false) {
  const menu = TOWN.dialogue && TOWN.dialogue.returnMenu;
  TOWN.dialogue = null; TOWN.menu = null; resetInput();
  if (service && menu) openTownMenu(menu);
}
const MENU_DIALOGUE = {
  nav(vx, vy) {
    // Backtracking only revisits pages the player has already read.
    const d = TOWN.dialogue;
    if ((vx < 0 || vy < 0) && d.page > 0) { d.page--; SFX.move(); }
  },
  ok() {
    const d = TOWN.dialogue;
    if (!d) return;
    if (d.page < d.pages.length - 1) { d.page++; TOWN.menuT = 0; resetInput(); SFX.select(); return; }
    const review = d.scene.scope === 'review', complete = review || d.scene.scope === 'ambient' || finishQuestDialogue(d.scene);
    leaveTownDialogue(true);
    if (complete && !review && d.scene.scope !== 'ambient') townMsg('已记下线索 · 任务目标更新', '#82e68c');
    SFX.select();
  },
  draw(k) {
    const d = TOWN.dialogue, page = d.pages[d.page], s = TOWN_SPEAKERS[page.speaker] || TOWN_SPEAKERS.narrator;
    frame(8, 30, 312, 161, d.scene.title || '晨星镇 · 剧情', s.col, k);
    T(d.scene.scope === 'main' ? '主线剧情' : d.scene.scope === 'side' ? '居民支线' : d.scene.scope === 'review' ? '已完成章节 · 回顾' : '镇中见闻', 20, 44, 4.5, '#a096aa', 'left');
    T(`${d.page + 1} / ${d.pages.length}`, 299, 44, 4.5, '#a096aa', 'right');
    panel(18, 58, 70, 122, '#241a2c', s.col, 1);
    const spr = s.spr === 'hero' ? SPR.hero[0] : SPR[s.spr];
    if (spr) {
      const scale = Math.min(3, 44 / spr.w, 43 / spr.h);
      bigIcon(spr, 44 - spr.w * scale / 2, 103 - spr.h * scale, scale);
    }
    else bigIcon(icon('book', s.col, '#5a4050', '#fff4d0'), 31, 76, 3);
    T(page.speaker === 'narrator' ? '见闻' : page.speaker === 'hero' ? '你' : s.name.split(' ').pop(), 44, 111, 5, s.col);
    T(s.name, 81, 64, 6.2, s.col, 'left');
    page.lines.forEach((text, i) => T(text, 81, 80 + i * 11, 6.4, '#f0e6da', 'left'));
    if (d.returnMenu) {
      const hover = uiHit(20, 134, 121, 151, () => leaveTownDialogue(true));
      panel(20, 134, 121, 151, hover ? '#38293e' : '#241a2c', '#796880', 1);
      T('先查看服务', 70.5, 142.5, 5.3, '#c8bcd0');
    } else T(MOBILE_INPUT.enabled ? '点击右上角可暂时离开' : 'Esc 可暂时离开', 20, 143, 4.8, '#a096aa', 'left');
    const endLabel = d.scene.scope === 'review' ? '结束回顾' : d.scene.scope === 'ambient' ? '结束查看' : '记下线索 · 结束对话';
    button(143, 134, 300, 151, d.page === d.pages.length - 1 ? endLabel : '继续对话', true, s.col);
    hints([['E / Enter', '继续'], ['←', '回看'], ['Esc', '离开']]);
  },
};
TOWN_MENU_UI.dialogue = MENU_DIALOGUE;
function drawTownStoryOffer(menu) {
  if (menu === 'dialogue') return;
  const scene = townQuestScene(menu);
  if (!scene) return;
  const hover = uiHit(12, 5, 108, 17, () => openTownDialogue(scene, menu));
  panel(12, 5, 108, 17, hover ? '#4c392b' : '#241820', '#e8c46a', 1);
  T('继续任务对话', 60, 11, 4.8, '#ffe6b0');
}
