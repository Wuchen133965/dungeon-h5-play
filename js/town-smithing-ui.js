'use strict';
// The smith's workbench exposes the full material chain without leaving the original town.
const SMITH_TABS = [{ id: 'blueprints', name: '装备图纸', w: 64 }, { id: 'silver', name: '打造银武', w: 68 },
  { id: 'refining', name: '熔炼 / 精炼', w: 86 }, { id: 'materials', name: '材料库', w: 69 }];
Object.assign(TOWN.sel, { smithRefining: 0, smithMaterial: 0 });
Object.assign(FORGE_UI, { craftDetail: 'requirements', craftEffectPage: 0, smeltConfirmId: null, materialAction: 'starter', blueprintItem: null, blueprintEffectPage: 0 });
const smithMaterialDef = id => WORKSHOP_MATERIALS.find(m => m.id === id);
function smithChangeTab(id) { forgeUINameCancel(); TOWN.smithTab = id; FORGE_UI.smeltConfirmId = null; UI_HITS.length = 0; SFX.move(); }
function smithCycleTab(delta) {
  const at = Math.max(0, SMITH_TABS.findIndex(t => t.id === TOWN.smithTab)); smithChangeTab(SMITH_TABS[(at + delta + SMITH_TABS.length) % SMITH_TABS.length].id);
}
function smithFrame(k) {
  serviceFrame('armory', k); let x = 12;
  for (const tab of SMITH_TABS) {
    const on = tab.id === TOWN.smithTab;
    forgeUIButton(x, 42, x + tab.w, 54, tab.name, true, on ? '#9bdce5' : '#827e88', () => smithChangeTab(tab.id), on, 5);
    x += tab.w + 2;
  }
}
function smithStatusFooter(action = '操作') {
  const s = workshopState().smith;
  T(`技艺 Lv.${workshopSkill()} · 精力 ${s.energy}/100 · 研究 ${s.research} 点`, 12, 159, 4.3, '#a9bec6', 'left');
  toast(160, 160); hints([['上下/滚轮', '选择'], ['左右', '切页'], ['E', action], ['Esc', '离开']]);
}
function smithNeedRows(materials, x = 142, y = 96, width = 158, rowStep = 9) {
  const state = workshopState(), entries = WORKSHOP_MATERIALS.filter(m => materials[m.id]);
  entries.forEach((m, i) => {
    const have = state.materials[m.id] || 0, need = materials[m.id], xx = x + (i % 2) * width / 2, yy = y + Math.floor(i / 2) * rowStep;
    T(`${m.name} ${have}/${need}`, xx, yy, 4.5, have >= need ? '#b8e7c7' : '#f0a898', 'left');
  });
  return entries.length;
}
function smithMaterialList(materials) { return WORKSHOP_MATERIALS.filter(m => materials[m.id]).map(m => `${m.name} ×${materials[m.id]}`).join('，'); }
function smithSmallPage(key, n, pageSize, y = 135) { forgeUIPage(key, n, pageSize, y); }

// The original unlock operations and all equipment categories remain on wooden racks.
function smithDrawBlueprints(k) {
  smithFrame(k); const { g: rows, r: sr, c: sc } = FORGE_BLUEPRINT_SHOP.cur(), it = rows[sr][sc], owned = isUnlocked(it), col = TIERS[it.tier].col;
  panel(12, 58, 205, 153, '#2a1a14', '#765239', 1);
  for (let i = 0; i < 9; i++) { hg.fillStyle = '#39261c'; hg.fillRect(13 * U, (59 + i * 10) * U, 191 * U, .6 * U); }
  const rackOffset = clamp(sr - 1, 0, Math.max(0, rows.length - 3));
  for (const [delta, x, y, label] of [[-1, 195, 61, '▲'], [1, 20, 149, '▼']]) if (delta < 0 ? rackOffset > 0 : rackOffset + 3 < rows.length) {
    forgeUIButton(x - 8, y - 3, x + 8, y + 3, label, true, '#c8a070', () => {
      TOWN.sel.armory = { r: delta < 0 ? rackOffset - 1 : rackOffset + 3, c: 0 }; SFX.move();
    }, false, 3.8);
  }
  rows.slice(rackOffset, rackOffset + 3).forEach((row, rowIndex) => {
    const ri = rowIndex + rackOffset, y = 64 + rowIndex * 29, count = Math.min(7, row.length), off = ri === sr ? clamp(sc - 3, 0, row.length - count) : 0;
    T(SHOP_ROWS[ri][1], 16, y - 2, 4.4, '#c8a070', 'left');
    hg.fillStyle = '#9a7040'; hg.fillRect(15 * U, (y + 20) * U, 187 * U, 2 * U);
    row.slice(off, off + count).forEach((a, j) => {
      const x = 40 + j * 24, selected = ri === sr && off + j === sc, unlocked = isUnlocked(a);
      uiHit(x - 10, y + 1, x + 10, y + 28, () => { TOWN.sel.armory = { r: ri, c: off + j }; SFX.move(); });
      panel(x - 10, y + 1, x + 10, y + 20, unlocked ? '#2a2026' : '#191319', selected ? '#f1d99e' : unlocked ? TIERS[a.tier].col : '#594554', 1);
      bigIcon(itemIcon(a), x - 8, y + 3, 2, unlocked ? 1 : .7);
      T(unlocked ? '已解锁' : String(a.lock), x, y + 25, 3.6, unlocked ? '#b8e7c7' : META.souls >= a.lock ? '#e8dcc0' : '#f0a898');
    });
    if (off) forgeUIButton(14, y + 8, 24, y + 18, '‹', true, '#c8a070', () => { TOWN.sel.armory = { r: ri, c: off - 1 }; SFX.move(); }, false, 5);
    if (off + count < row.length) forgeUIButton(194, y + 8, 204, y + 18, '›', true, '#c8a070', () => { TOWN.sel.armory = { r: ri, c: off + count }; SFX.move(); }, false, 5);
  });
  panel(210, 58, 308, 153, '#19141c', col, 1); T(it.name, 216, 66, 5.8, col, 'left');
  bigIcon(itemIcon(it), 216, 74, 2); T(`${TIERS[it.tier].name} · ${SLOT_NAME[it.slot]}`, 239, 81, 4.6, '#c8bcd0', 'left');
  T('解锁图纸后，仍需局内随机获得。', 216, 91, 3.4, '#a096aa', 'left');
  const lines = (it.lines || []).flatMap(line => townWrapText(line, 85, 4.1)), pageSize = 5, pages = Math.max(1, Math.ceil(lines.length / pageSize));
  if (FORGE_UI.blueprintItem !== it.id) { FORGE_UI.blueprintItem = it.id; FORGE_UI.blueprintEffectPage = 0; }
  FORGE_UI.blueprintEffectPage = clamp(FORGE_UI.blueprintEffectPage, 0, pages - 1);
  lines.slice(FORGE_UI.blueprintEffectPage * pageSize, (FORGE_UI.blueprintEffectPage + 1) * pageSize)
    .forEach((line, i) => T(line, 216, 97 + i * 6.8, 4.1, '#e0d4c4', 'left'));
  if (pages > 1) {
    T(`效果 ${FORGE_UI.blueprintEffectPage + 1}/${pages}`, 259, 133, 3.8, '#a096aa');
    for (const [delta, x, label] of [[-1, 216, '‹'], [1, 288, '›']]) forgeUIButton(x, 129, x + 14, 136, label, true, '#c8a070', () => {
      FORGE_UI.blueprintEffectPage = (FORGE_UI.blueprintEffectPage + delta + pages) % pages; SFX.move();
    }, false, 4.2);
  }
  forgeUIButton(216, 139, 302, 150, owned ? '图纸已解锁' : `解锁 · ${it.lock} 魂晶`, !owned && META.souls >= it.lock, '#ffb060', () => FORGE_BLUEPRINT_SHOP.ok(), false, 4.2);
  toast(108, 159); hints([['方向', '选择图纸'], ['E', '解锁'], ['Esc', '离开']]);
}

const MENU_SMITH_CRAFT = {
  nav(vx, vy) { if (FORGE_UI.nameEdit) return; if (vx) smithCycleTab(vx); else { FORGE_UI.craftDetail = 'requirements'; FORGE_UI.craftEffectPage = 0; serviceNav('silverCraft', forgeDesigns().length || 1, 0, vy); } },
  wheel(e) {
    if (FORGE_UI.nameEdit) return;
    if (e.deltaY && uiMenuPointer().x >= 134 && FORGE_UI.craftDetail === 'effects') { e.preventDefault(); FORGE_UI.craftEffectPage = Math.max(0, (FORGE_UI.craftEffectPage || 0) + (e.deltaY > 0 ? 1 : -1)); }
    else { FORGE_UI.craftEffectPage = 0; forgeUIWheel('silverCraft', forgeDesigns().length, e); }
  },
  ok() {
    if (FORGE_UI.nameEdit) { forgeUINameFinish(); return; }
    const d = forgeDesigns()[serviceIndex('silverCraft', forgeDesigns().length || 1)];
    if (d) { const ok = forgeCraft(d.id); forgeUIResult(ok); if (ok) { FORGE_UI.craftDetail = 'effects'; forgeUINameStart(forgeDesigns().find(design => design.id === d.id), { menu: 'armory', crafted: true }); } TOWN.smithT = .6; }
  },
  draw(k) {
    smithFrame(k);
    if (FORGE_UI.nameEdit && FORGE_UI.nameEdit.menu === 'armory') {
      const crafted = forgeDesigns().find(d => d.id === FORGE_UI.nameEdit.id);
      if (crafted) {
        panel(12, 58, 127, 147, '#14232b', '#67949e', 1); T('银武打造完成', 20, 68, 5.8, '#9bdce5', 'left');
        forgeUIWeaponPreview(forgeItem(crafted.id), 21, 78, 1.65);
        T(`蓝图编号 ${forgeUIRecipeHash(crafted.recipe)}`, 20, 139, 4.2, '#9ab9c1', 'left');
        panel(134, 58, 308, 147, '#14232b', '#67949e', 1); forgeUITitle(crafted.name, 142, 66, 157, 5.3); forgeUINameContent();
        toast(160, 160); hints([['Enter', '保存名称'], ['Esc', '保留当前名称']]); return;
      }
      forgeUINameCancel();
    }
    const designs = forgeDesigns(), sel = serviceIndex('silverCraft', designs.length || 1), page = Math.floor(sel / 3), d = designs[sel];
    designs.slice(page * 3, page * 3 + 3).forEach((a, i) => {
      serviceRow('silverCraft', page * 3 + i, 58 + i * 22, a.name.slice(0, 15), a.forged ? '已打造 · 已进入个人掉落池' : '等待材料、技艺与部件研究', '#9bdce5', page * 3 + i === sel);
      uiHit(12, 58 + i * 22, 127, 76 + i * 22, () => { TOWN.sel.silverCraft = page * 3 + i; FORGE_UI.craftDetail = 'requirements'; FORGE_UI.craftEffectPage = 0; SFX.move(); });
    });
    smithSmallPage('silverCraft', designs.length, 3, 128);
    if (!d) {
      panel(134, 58, 308, 147, '#16212a', '#67949e', 1);
      T('先保存一份银武设计', 142, 70, 6, '#9bdce5', 'left');
      forgeUIText('找赛琳搭配十个部位、形制与染色，再回布洛克处准备材料并打造。', 142, 86, 156, 4.8, '#ddd4cf', 3, 8);
      forgeUIText('第一步：在材料库领取工坊入门包。第二步：制炭、炼铁。第三步：打造首件银武。', 142, 117, 156, 4.4, '#a9bec6', 3, 7);
    } else {
      const it = forgeItem(d.id), req = workshopRecipeRequirements(d.recipe), detail = FORGE_UI.craftDetail;
      panel(134, 58, 308, 147, '#16212a', '#67949e', 1);
      forgeUITitle(d.name, 142, 65, 118, 5.1); T(forgeUIRecipeHash(d.recipe), 298, 65, 4.1, '#9ab9c1', 'right');
      const views = [{ id: 'requirements', name: '材料 / 工艺' }, { id: 'parts', name: '部件研究' }, { id: 'effects', name: '全部效果' }];
      views.forEach((view, i) => forgeUIButton(142 + i * 53, 73, 191 + i * 53, 82, view.name, true, '#9bdce5', () => { FORGE_UI.craftDetail = view.id; FORGE_UI.craftEffectPage = 0; }, detail === view.id, 3.8));
      if (detail === 'requirements') {
        const state = workshopState();
        T(`技艺 Lv.${workshopSkill()} / 需要 ${req.skill} · 精力 ${state.smith.energy}/${req.energy}`, 142, 90, 4.3, workshopSkill() >= req.skill && state.smith.energy >= req.energy ? '#b8e7c7' : '#f0a898', 'left');
        T(`打造工费 ${req.souls} 魂晶 · 持有 ${META.souls}`, 142, 99, 4.3, META.souls >= req.souls ? '#b8e7c7' : '#f0a898', 'left');
        smithNeedRows(req.materials, 142, 110, 158, 8);
        const locked = FORGE_SLOTS.filter(slot => !workshopPartKnown(slot, d.recipe[slot]));
        T(locked.length ? `还有 ${locked.length} 个部件未掌握 → 查看部件研究` : '全部部件已掌握', 142, 142, 3.9, locked.length ? '#f0a898' : '#b8e7c7', 'left');
      } else if (detail === 'parts') {
        FORGE_SLOTS.forEach((slot, i) => {
          const p = FORGE_PARTS[slot].find(p => p.id === d.recipe[slot]), known = workshopPartKnown(slot, p.id), x = 142 + (i % 2) * 79, y = 90 + Math.floor(i / 2) * 9.4;
          forgeUITitle(`${known ? '✓' : '×'} ${forgeSlotName(slot, d.recipe.type)} · ${p.name}`, x, y, 76, 3.8, known ? '#b8e7c7' : '#f0a898');
        });
        T('红色部件未掌握 · 去找赛琳研究对应部件', 142, 142, 3.8, '#a9bec6', 'left');
      } else {
        forgeUIFullLines([d.name, ...forgeRecipeEffectLines(d.recipe), '养成上限 Lv.50 / 8 阶 · 打造后局内随机获得'], 'craftEffectPage', 142, 89, 158, 4.1, 7, 6.8, 138);
      }
      forgeUIButton(142, 151, 304, 162, d.forged ? '已经打造完成' : req.missing.length ? '需求尚未满足 · 查看红色项目' : `打造银武 · ${req.souls} 魂晶`, !d.forged && !req.missing.length, '#9bdce5', () => this.ok(), false, 4.5);
      if (!d.forged) forgeUIButton(12, 144, 127, 153, '撤回未打造设计', true, '#b69186', () => forgeUIResult(forgeDesignDiscard(d.id)), false, 4);
    }
    smithStatusFooter('打造');
  },
};

function smithRefiningEntries() {
  return WORKSHOP_RECIPES.map(recipe => ({ id: recipe.id, name: recipe.name, recipe })).concat(forgeDesigns().filter(d => d.forged).map(d => ({ id: d.id, name: `熔炼 ${d.name}`, weapon: d })));
}
const MENU_SMITH_REFINING = {
  nav(vx, vy) { FORGE_UI.smeltConfirmId = null; if (vx) smithCycleTab(vx); else serviceNav('smithRefining', smithRefiningEntries().length || 1, 0, vy); },
  wheel(e) { if (!e.deltaY) return; FORGE_UI.smeltConfirmId = null; forgeUIWheel('smithRefining', smithRefiningEntries().length, e); },
  back() { if (!FORGE_UI.smeltConfirmId) return false; FORGE_UI.smeltConfirmId = null; return true; },
  ok() {
    const list = smithRefiningEntries(), a = list[serviceIndex('smithRefining', list.length || 1)]; if (!a) return;
    if (a.recipe) { forgeUIResult(workshopRefine(a.id)); return; }
    if (FORGE_UI.smeltConfirmId !== a.id) { FORGE_UI.smeltConfirmId = a.id; SFX.select(); return; }
    forgeUIResult(workshopSmeltWeapon(a.id)); FORGE_UI.smeltConfirmId = null;
  },
  draw(k) {
    smithFrame(k); const list = smithRefiningEntries(), sel = serviceIndex('smithRefining', list.length || 1), page = Math.floor(sel / 3), a = list[sel];
    list.slice(page * 3, page * 3 + 3).forEach((it, i) => serviceRow('smithRefining', page * 3 + i, 58 + i * 22, it.name.slice(0, 15),
      it.recipe ? `${it.recipe.kind === 'smelt' ? '熔炼' : '精炼'} · 需技艺 ${it.recipe.skill}` : '已打造银武 · 拆解并撤出掉落池', it.recipe ? '#e2bd7c' : '#9bdce5', page * 3 + i === sel));
    smithSmallPage('smithRefining', list.length, 3, 128);
    panel(134, 58, 308, 147, '#211b1c', '#a48664', 1);
    if (a && a.recipe) {
      const r = a.recipe, req = workshopRefineRequirements(a.id), state = workshopState();
      T(r.name, 142, 68, 6, '#e2bd7c', 'left');
      T(`技艺 Lv.${workshopSkill()} / ${r.skill} · 精力 ${state.smith.energy}/${r.energy}`, 142, 80, 4.4, workshopSkill() >= r.skill && state.smith.energy >= r.energy ? '#b8e7c7' : '#f0a898', 'left');
      T('投入材料 · 持有 / 需要', 142, 93, 4.5, '#a9bec6', 'left'); smithNeedRows(r.input, 142, 104, 158, 9);
      forgeUIText(`产出：${smithMaterialList(r.output)}`, 142, 124, 156, 4.4, '#e5d4b4', 2, 7);
      T(`技艺经验 +${r.xp} · 研究点 +${r.research}`, 142, 141, 4.1, '#a9bec6', 'left');
      forgeUIButton(142, 151, 304, 162, req.missing.length ? '需求尚未满足 · 查看红色项目' : `进行${r.kind === 'smelt' ? '熔炼' : '精炼'}`, !req.missing.length, '#e2bd7c', () => this.ok(), false, 4.5);
    } else if (a) {
      const req = workshopSmeltRequirements(a.id), confirming = FORGE_UI.smeltConfirmId === a.id;
      T('熔炼自己的银武', 142, 68, 6, '#9bdce5', 'left');
      forgeUIText(a.weapon.name, 142, 80, 156, 4.5, '#e5d4b4', 1);
      forgeUIText(`返还材料：${smithMaterialList(req.returnMaterials)}`, 142, 94, 156, 4.4, '#b8e7c7', 2, 7);
      T(`消耗精力 ${req.energy} · 持有 ${workshopState().smith.energy}`, 142, 113, 4.3, '#a9bec6', 'left');
      forgeUIText(confirming ? '确认后移除该银武的个人掉落资格与强化记录。魂晶不返还。' : '只可熔炼本人已经打造的成品。装备图纸不算实物材料。', 142, 125, 156, 4.4, confirming ? '#f0a898' : '#a9bec6', 3, 6.4);
      forgeUIButton(142, 151, 304, 162, confirming ? '确认熔炼 · 移除掉落与强化' : '预览熔炼这件银武', !req.missing.length, confirming ? '#ed9c87' : '#9bdce5', () => this.ok(), false, 4.5);
      if (confirming) forgeUIButton(12, 144, 127, 153, '取消熔炼确认', true, '#a9bec6', () => { FORGE_UI.smeltConfirmId = null; SFX.deny(); }, false, 4);
    }
    smithStatusFooter('精炼/熔炼');
  },
};

const MENU_SMITH_MATERIALS = {
  nav(vx, vy) { if (vx) smithCycleTab(vx); else serviceNav('smithMaterial', WORKSHOP_MATERIALS.length, 0, vy); },
  wheel(e) { forgeUIWheel('smithMaterial', WORKSHOP_MATERIALS.length, e); },
  ok() {
    const state = workshopState();
    forgeUIResult(state.smith.starterClaimed ? workshopRest() : workshopClaimStarter());
  },
  draw(k) {
    smithFrame(k); const state = workshopState(), progress = workshopSkillProgress(), selected = serviceIndex('smithMaterial', WORKSHOP_MATERIALS.length), material = WORKSHOP_MATERIALS[selected];
    WORKSHOP_MATERIALS.forEach((m, i) => {
      const y = 58 + i * 11, on = i === selected, hover = uiHit(12, y, 127, y + 10, () => { TOWN.sel.smithMaterial = i; SFX.move(); });
      panel(12, y, 127, y + 10, on || hover ? '#2b3036' : '#18141c', on ? m.col : '#3a3044', 1);
      T(m.name, 18, y + 5, 4.7, m.col, 'left'); T(String(state.materials[m.id]), 119, y + 5, 5, '#eee9dd', 'right');
    });
    panel(134, 58, 308, 147, '#191e22', '#67949e', 1);
    T(`工坊技艺 Lv.${progress.skill} / ${progress.max}`, 142, 68, 5.5, '#9bdce5', 'left');
    T(progress.skill >= progress.max ? '技艺已达到上限' : `技艺经验 ${progress.current}/${progress.next} · 熔炼、精炼、打造可提升`, 142, 79, 4.2, '#a9bec6', 'left');
    T(`精力 ${state.smith.energy}/100 · 研究 ${state.smith.research} 点`, 142, 90, 4.5, '#e5d4b4', 'left');
    T(material.name, 142, 105, 5.4, material.col, 'left');
    forgeUIText(material.description, 142, 116, 156, 4.4, '#c4c1cf', 3, 7);
    forgeUIButton(142, 135, 304, 146, state.smith.starterClaimed ? '工坊入门材料已领取' : '领取工坊入门材料 · 免费一次', !state.smith.starterClaimed, '#9bdce5', () => forgeUIResult(workshopClaimStarter()), false, 4.3);
    forgeUIButton(142, 151, 304, 162, state.smith.energy >= 100 ? '精力充沛 · 无需休整' : '工坊休整 · 15 魂晶恢复全部精力', state.smith.energy < 100 && META.souls >= 15, '#e2bd7c', () => forgeUIResult(workshopRest()), false, 4.3);
    smithStatusFooter(state.smith.starterClaimed ? '休整' : '领取');
  },
};

TOWN_MENU_UI.armory = {
  nav(vx, vy) {
    if (TOWN.smithTab === 'blueprints') {
      const at = FORGE_BLUEPRINT_SHOP.cur(); if (vy > 0 && at.r === at.g.length - 1) { smithChangeTab('silver'); return; }
      FORGE_BLUEPRINT_SHOP.nav(vx, vy); return;
    }
    (TOWN.smithTab === 'silver' ? MENU_SMITH_CRAFT : TOWN.smithTab === 'refining' ? MENU_SMITH_REFINING : MENU_SMITH_MATERIALS).nav(vx, vy);
  },
  wheel(e) {
    if (TOWN.smithTab === 'blueprints') { if (e.deltaY) { e.preventDefault(); this.nav(0, e.deltaY > 0 ? 1 : -1); } return; }
    (TOWN.smithTab === 'silver' ? MENU_SMITH_CRAFT : TOWN.smithTab === 'refining' ? MENU_SMITH_REFINING : MENU_SMITH_MATERIALS).wheel(e);
  },
  back() { return forgeUINameCancel() || TOWN.smithTab === 'refining' && MENU_SMITH_REFINING.back(); },
  ok() { (TOWN.smithTab === 'blueprints' ? FORGE_BLUEPRINT_SHOP : TOWN.smithTab === 'silver' ? MENU_SMITH_CRAFT : TOWN.smithTab === 'refining' ? MENU_SMITH_REFINING : MENU_SMITH_MATERIALS).ok(); },
  draw(k) { (TOWN.smithTab === 'blueprints' ? smithDrawBlueprints : TOWN.smithTab === 'silver' ? t => MENU_SMITH_CRAFT.draw(t) : TOWN.smithTab === 'refining' ? t => MENU_SMITH_REFINING.draw(t) : t => MENU_SMITH_MATERIALS.draw(t))(k); },
};
TOWN_MENUS.armory.talk.push('先制炭炼铁，再依图样打造。材料与技艺都不能少。');
TOWN_MENUS.artificer.talk.push('熔炼、精炼与打造积累研究，帮你掌握新部件。');
