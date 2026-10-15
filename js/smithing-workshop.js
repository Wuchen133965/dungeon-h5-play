'use strict';
// 布洛克的工坊：原料 -> 木炭 / 金属 -> 部件研究 -> 消耗精力打造。成品仍只进入个人地牢掉落池。
const WORKSHOP_MATERIALS = [
  { id: 'wood', name: '硬木', icon: 'whet', col: '#c69b68', description: '冒险带回的木料；可制炭、制作握柄。' },
  { id: 'ore', name: '铁矿', icon: 'whet', col: '#a0a9bc', description: '冒险带回的矿石；加入木炭冶炼铁材。' },
  { id: 'scrap', name: '金属残骸', icon: 'armor', col: '#b39d8c', description: '冒险回收的残骸；熔炼获得铁材和更多研究。' },
  { id: 'coal', name: '木炭', icon: 'bomb', col: '#6e6b78', description: '冶炼燃料；由硬木制成。' },
  { id: 'iron', name: '铁材', icon: 'sword', col: '#c8d3df', description: '初级部件的基础金属；可继续炼钢。' },
  { id: 'steel', name: '精钢', icon: 'spear', col: '#a9ccd7', description: '二阶部件用材；工艺达到 3 级可炼制。' },
  { id: 'fine', name: '秘银钢', icon: 'gem', col: '#d5b6ec', description: '三阶部件用材；工艺达到 6 级可炼制。' },
  { id: 'essence', name: '灵质', icon: 'flask', col: '#b48cde', description: '深入地牢或通关后，随有效冒险结算获得的稀有灵核材料。' },
];
const WORKSHOP_RECIPES = [
  { id: 'charcoal', name: '硬木制炭', kind: 'refine', input: { wood: 2 }, output: { coal: 2 }, skill: 1, energy: 6, xp: 3, research: 1 },
  { id: 'iron', name: '铁矿冶炼', kind: 'refine', input: { ore: 2, coal: 1 }, output: { iron: 2 }, skill: 1, energy: 8, xp: 5, research: 2 },
  { id: 'salvage', name: '残骸熔炼', kind: 'smelt', input: { scrap: 2, coal: 1 }, output: { iron: 2 }, skill: 1, energy: 10, xp: 8, research: 4 },
  { id: 'steel', name: '精钢精炼', kind: 'refine', input: { iron: 2, coal: 1 }, output: { steel: 1 }, skill: 3, energy: 10, xp: 7, research: 3 },
  { id: 'fine', name: '秘银钢精炼', kind: 'refine', input: { steel: 2, coal: 1 }, output: { fine: 1 }, skill: 6, energy: 12, xp: 10, research: 5 },
];
const WORKSHOP_STARTER = { wood: 12, ore: 12, scrap: 6, essence: 2 };
const WORKSHOP_DEFAULT_PARTS = ['head:iron', 'grip:oak', 'core:star', 'rune:power', ...FORGE_SLOTS.slice(4).map(slot => `${slot}:none`)];
const WORKSHOP_MATERIAL_MAX = 1000000, WORKSHOP_XP_MAX = 570, WORKSHOP_RESEARCH_MAX = 100000;
// 每个部件都有独立的材料需求；高级部件需要工艺和研究，不只提高魂晶价格。
const WORKSHOP_PART_SPECS = {
  head: {
    iron: [1, { iron: 3 }], keen: [2, { steel: 2, essence: 1 }], bulwark: [2, { steel: 3, iron: 1 }],
    long: [2, { steel: 2, iron: 2 }], rapid: [3, { fine: 2, essence: 1 }],
  },
  grip: {
    oak: [1, { wood: 2, iron: 1 }], silk: [2, { wood: 2, steel: 1, essence: 1 }], wind: [2, { wood: 3, steel: 1 }],
    guard: [2, { wood: 1, steel: 2 }], beast: [3, { wood: 2, fine: 1, essence: 1 }],
  },
  core: {
    star: [1, { iron: 2, essence: 1 }], flame: [2, { steel: 1, coal: 2, essence: 1 }], frost: [2, { steel: 1, essence: 2 }],
    storm: [3, { fine: 1, essence: 2 }], blood: [3, { fine: 1, essence: 2 }],
  },
  rune: {
    power: [1, { iron: 1, coal: 1 }], precision: [2, { steel: 1, iron: 1, essence: 1 }], echo: [3, { fine: 1, essence: 2 }],
    hunt: [2, { steel: 1, wood: 1, essence: 1 }], fortune: [2, { steel: 1, essence: 1 }],
  },
};
for (const slot of FORGE_SLOTS) for (const part of FORGE_PARTS[slot]) {
  const legacySpec = WORKSHOP_PART_SPECS[slot] && WORKSHOP_PART_SPECS[slot][part.id];
  if (!legacySpec) continue; // 丰富部件已有独立材料、工艺门槛和研究需求。
  const [tier, materials] = legacySpec;
  Object.assign(part, { tier, requiredSkill: tier === 3 ? 6 : tier === 2 ? 3 : 1, materials,
    researchCost: tier === 3 ? 18 : tier === 2 ? 8 : 0 });
}
function workshopNormalize(raw) {
  const source = forgeObject(raw) ? raw : {}, bag = forgeObject(source.materials) ? source.materials : {}, materials = {};
  for (const m of WORKSHOP_MATERIALS) materials[m.id] = forgeNumber(bag[m.id], WORKSHOP_MATERIAL_MAX);
  const s = forgeObject(source.smith) ? source.smith : {};
  const keys = new Set(FORGE_SLOTS.flatMap(slot => FORGE_PARTS[slot].map(p => `${slot}:${p.id}`)));
  const learned = [...new Set([...WORKSHOP_DEFAULT_PARTS, ...(Array.isArray(s.learned) ? s.learned.filter(id => typeof id === 'string' && keys.has(id)) : [])])];
  return { materials, smith: { xp: forgeNumber(s.xp, WORKSHOP_XP_MAX), research: forgeNumber(s.research, WORKSHOP_RESEARCH_MAX),
    energy: s.energy === undefined ? 100 : forgeNumber(s.energy, 100), learned, starterClaimed: s.starterClaimed === true } };
}
function workshopState() { return forgeProgression(); }
function workshopSkill() { return Math.min(20, 1 + Math.floor(workshopState().smith.xp / 30)); }
function workshopSkillProgress() {
  const skill = workshopSkill(), xp = workshopState().smith.xp;
  return { skill, xp, current: skill === 20 ? 30 : xp % 30, next: 30, max: 20 };
}
function workshopTown() {
  if (!metaSaveReady()) { FORGE_MESSAGE = META_SAVE.message; return false; }
  if (G.mode === 'town') return true;
  FORGE_MESSAGE = '请回到主城，在布洛克的工坊操作。'; return false;
}
function workshopPartKnown(slot, id) {
  return FORGE_SLOTS.includes(slot) && FORGE_PARTS[slot].some(p => p.id === id) && workshopState().smith.learned.includes(`${slot}:${id}`);
}
function workshopLearn(slot, id) {
  if (!workshopTown()) return false;
  const part = FORGE_SLOTS.includes(slot) && FORGE_PARTS[slot].find(p => p.id === id);
  if (!part) { FORGE_MESSAGE = '没有这种部件。'; return false; }
  if (workshopPartKnown(slot, id)) { FORGE_MESSAGE = '已经掌握这个部件。'; return false; }
  if (workshopSkill() < part.requiredSkill) { FORGE_MESSAGE = `研究${part.name}需要工艺 ${part.requiredSkill} 级。`; return false; }
  const smith = workshopState().smith;
  if (smith.research < part.researchCost) { FORGE_MESSAGE = `研究点不足，需要 ${part.researchCost} 点；精炼和熔炼可以积累。`; return false; }
  smith.research -= part.researchCost; smith.learned.push(`${slot}:${id}`);
  FORGE_MESSAGE = `已掌握${part.name}，现在可以用于打造。`; if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function workshopMaterialMissing(materials, missing) {
  const bag = workshopState().materials;
  for (const m of WORKSHOP_MATERIALS) if (materials[m.id] && bag[m.id] < materials[m.id]) missing.push(`${m.name} ${bag[m.id]}/${materials[m.id]}`);
}
function workshopRefineRequirements(id) {
  const recipe = WORKSHOP_RECIPES.find(r => r.id === id), missing = [];
  if (!recipe) return { materials: {}, skill: 1, energy: 0, missing: ['没有这种精炼配方。'] };
  if (workshopSkill() < recipe.skill) missing.push(`工艺 ${workshopSkill()}/${recipe.skill} 级`);
  workshopMaterialMissing(recipe.input, missing);
  if (workshopState().smith.energy < recipe.energy) missing.push(`工坊精力 ${workshopState().smith.energy}/${recipe.energy}`);
  return { materials: { ...recipe.input }, skill: recipe.skill, energy: recipe.energy, missing };
}
function workshopGain(xp, research) {
  const smith = workshopState().smith;
  smith.xp = Math.min(WORKSHOP_XP_MAX, smith.xp + xp);
  smith.research = Math.min(WORKSHOP_RESEARCH_MAX, smith.research + research);
}
function workshopConsume(materials) {
  const bag = workshopState().materials;
  for (const [id, n] of Object.entries(materials)) bag[id] -= n;
}
function workshopGive(materials) {
  const bag = workshopState().materials;
  for (const [id, n] of Object.entries(materials)) if (forgeOwn(bag, id)) bag[id] = Math.min(WORKSHOP_MATERIAL_MAX, bag[id] + n);
}
function workshopRefine(id) {
  if (!workshopTown()) return false;
  const requirement = workshopRefineRequirements(id), recipe = WORKSHOP_RECIPES.find(r => r.id === id);
  if (requirement.missing.length) { FORGE_MESSAGE = `暂不能精炼：${requirement.missing.join('；')}`; return false; }
  const before = workshopSkill();
  workshopConsume(recipe.input); workshopGive(recipe.output); workshopState().smith.energy -= recipe.energy;
  workshopGain(recipe.xp, recipe.research);
  FORGE_MESSAGE = `${recipe.name}完成，工艺经验 +${recipe.xp}，研究点 +${recipe.research}${workshopSkill() > before ? `，工艺升至 ${workshopSkill()} 级` : ''}。`;
  if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function workshopRest() {
  if (!workshopTown()) return false;
  if (workshopState().smith.energy >= 100) { FORGE_MESSAGE = '精力充沛，暂不需要休整。'; return false; }
  if (!forgeSpend(15)) return false;
  workshopState().smith.energy = 100;
  FORGE_MESSAGE = '花费 15 魂晶休整，工坊精力已恢复至 100。'; if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function workshopClaimStarter() {
  if (!workshopTown()) return false;
  const smith = workshopState().smith;
  if (smith.starterClaimed) { FORGE_MESSAGE = '新手材料包已领取，后续原料需要冒险收集。'; return false; }
  workshopGive(WORKSHOP_STARTER); smith.starterClaimed = true;
  FORGE_MESSAGE = '获得新手材料：硬木 12、铁矿 12、金属残骸 6、灵质 2。'; if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function workshopRecipeRequirements(recipe) {
  const r = forgeRecipeNormalize(recipe), materials = {}, missing = [];
  if (!r) return { materials, skill: 1, energy: 20, souls: Infinity, missing: ['请先选择有效、兼容的武器类型、部件与形制。'] };
  const assembly = workshopAssemblyRequirements(r);
  let skill = assembly.skill, souls = assembly.souls;
  for (const slot of FORGE_SLOTS) {
    const part = FORGE_PARTS[slot].find(p => p.id === r[slot]);
    skill = Math.max(skill, part.requiredSkill); souls += part.cost;
    for (const [id, n] of Object.entries(part.materials)) materials[id] = (materials[id] || 0) + n;
    if (!workshopPartKnown(slot, part.id)) missing.push(`未研究：${part.name}`);
  }
  for (const [id, n] of Object.entries(assembly.materials)) materials[id] = (materials[id] || 0) + n;
  if (workshopSkill() < skill) missing.unshift(`工艺 ${workshopSkill()}/${skill} 级`);
  workshopMaterialMissing(materials, missing);
  const energy = assembly.energy, smith = workshopState().smith;
  if (smith.energy < energy) missing.push(`工坊精力 ${smith.energy}/${energy}`);
  if (!Number.isFinite(META.souls) || META.souls < souls) missing.push(`魂晶 ${Number.isFinite(META.souls) ? META.souls : 0}/${souls}`);
  return { materials, skill, energy, souls, missing };
}
function workshopAssemblyRequirements(recipe) {
  const r = forgeRecipeNormalize(recipe);
  if (!r) return { materials: {}, skill: 1, souls: Infinity, energy: 20 };
  const materials = {}, offset = FORGE_DIMENSIONS.reduce((n, d) => n + Math.abs(r[d.id] - 2), 0);
  const extreme = FORGE_DIMENSIONS.some(d => Math.abs(r[d.id] - 2) === 2);
  // 增长与加厚是真正耗料；偏置重心也需要精细加工。染色不改变强度、费用或协同。
  if (r.length === 3) materials.iron = 1;
  if (r.length === 4) materials.steel = 2;
  if (r.weight === 3) materials.iron = (materials.iron || 0) + 2;
  if (r.weight === 4) materials.steel = (materials.steel || 0) + 3;
  if (offset) materials.coal = Math.ceil(offset / 2);
  if (r.balance !== 2) materials.iron = (materials.iron || 0) + 1;
  const addedParts = FORGE_SLOTS.slice(4).filter(slot => r[slot] !== 'none').length;
  return { materials, skill: extreme ? 3 : offset ? 2 : 1,
    souls: 400 + Math.abs(r.length - 2) * 12 + Math.abs(r.weight - 2) * 18 + Math.abs(r.balance - 2) * 15,
    energy: 20 + addedParts * 2 + offset * 2 };
}
function workshopRecipeMaterialCost(recipe) {
  const r = forgeRecipeNormalize(recipe);
  if (!r) return {};
  const materials = { ...workshopAssemblyRequirements(r).materials };
  for (const slot of FORGE_SLOTS) for (const [id, n] of Object.entries(FORGE_PARTS[slot].find(p => p.id === r[slot]).materials)) materials[id] = (materials[id] || 0) + n;
  return materials;
}
function workshopCraft(id) {
  if (!workshopTown()) return false;
  const d = forgeDesigns().find(x => x.id === id);
  if (!d || d.forged) { FORGE_MESSAGE = d ? '这件银武已经打造完成。' : '请先在银武设计师处保存配方。'; return false; }
  const requirement = workshopRecipeRequirements(d.recipe);
  if (requirement.missing.length) { FORGE_MESSAGE = `暂不能打造：${requirement.missing.join('；')}`; return false; }
  const before = workshopSkill();
  // All gates are checked together above; an incomplete design cannot consume money, metal or energy.
  META.souls -= requirement.souls; workshopConsume(requirement.materials); workshopState().smith.energy -= requirement.energy;
  d.recipe = forgeRecipeNormalize(d.recipe);
  d.forged = true;
  const tierSum = FORGE_SLOTS.reduce((n, slot) => n + FORGE_PARTS[slot].find(p => p.id === d.recipe[slot]).tier, 0);
  workshopGain(12 + requirement.skill * 2, 4 + tierSum);
  FORGE_MESSAGE = `打造完成，已加入个人随机掉落池，研究点 +${4 + tierSum}${workshopSkill() > before ? `，工艺升至 ${workshopSkill()} 级` : ''}。`;
  if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function workshopSmeltRequirements(id) {
  const data = workshopState(), design = data.designs.find(d => d.id === id && d.forged), returned = {}, missing = [];
  if (!design) return { returnMaterials: returned, energy: 10, missing: ['只能熔炼本人已打造的银武成品。'] };
  Object.assign(returned, workshopRecipeMaterialCost(design.recipe));
  for (const material of Object.keys(returned)) returned[material] = Math.floor(returned[material] / 2);
  if (data.smith.energy < 10) missing.push(`工坊精力 ${data.smith.energy}/10`);
  return { returnMaterials: returned, energy: 10, missing };
}
function workshopSmeltWeapon(id) {
  if (!workshopTown()) return false;
  const requirement = workshopSmeltRequirements(id);
  if (requirement.missing.length) { FORGE_MESSAGE = `暂不能熔炼：${requirement.missing.join('；')}`; return false; }
  const data = workshopState(), index = data.designs.findIndex(d => d.id === id);
  data.smith.energy -= requirement.energy; workshopGive(requirement.returnMaterials); workshopGain(12, 8);
  data.designs.splice(index, 1); delete data.weapons[id];
  FORGE_MESSAGE = '银武成品已熔炼，返还一半材料；掉落资格和此武器强化已移除，魂晶不返还。';
  if (!saveMeta()) FORGE_MESSAGE = META_SAVE.message; return true;
}
function workshopRunMaterials(stats) {
  const s = forgeObject(stats) ? stats : {}, kills = forgeNumber(s.runKills, 1000000), souls = forgeNumber(s.runSouls, 1000000);
  if (!kills && !souls) return {};
  const floor = forgeNumber(s.gfloor, 1000), bossDepth = Math.floor(Math.max(0, floor - 1) / CONFIG.floorsPerRegion);
  const reward = { wood: Math.min(12, 2 + Math.floor(kills / 8)), ore: Math.min(12, 2 + Math.floor(kills / 10)),
    scrap: Math.min(14, 1 + Math.floor(kills / 6)), essence: Math.min(4, bossDepth + (s.win === true ? 2 : 0)) };
  if (!reward.essence) delete reward.essence;
  return reward;
}
function workshopRewardRun(stats) {
  const reward = workshopRunMaterials(stats);
  if (!Object.keys(reward).length) return false;
  workshopGive(reward);
  // Saving and replay protection belong to the caller's solo bank / LAN settlement transaction.
  return reward;
}
