'use strict';
// ============================================================ shared act content registration (acts 2..6)
// Each act file ends with ONE declarative table: its boss/minion enemy definitions, their AI, boss lighting and the
// act's regions. registerActContent applies them in the same order the act files used to (EDEF, AI, BOSS_LIGHT,
// then the regions), so registry insertion order and gameplay are unchanged. actContentProblems() cross-checks the
// tables (every region's pool / elite / boss / fixed mechanic resolves; per-room mechPick rolls are not static) and is run by tools/tests/act-content.cjs.
// Two-frame walk cycle shared by the biped regulars (rows = TOP + 3 leg rows); c is the leg colour key.
const strideFrames = (top, c) => [[...top, `...o${c}.${c}o..`, `...o${c}.${c}o..`, '...oo.oo..'], [...top, `..o${c}..${c}o..`, `..o${c}..${c}o..`, '..oo..oo..']];
const ACT_CONTENT = {};
function registerActContent(actNo, content) {
  const act = ACTS[actNo - 1];
  if (!act) throw new Error('registerActContent: unknown act ' + actNo);
  Object.assign(EDEF, content.enemies || {});
  Object.assign(AI, content.ai || {});
  Object.assign(BOSS_LIGHT, content.bossLight || {});
  act.regions.push(...(content.regions || []));
  ACT_CONTENT[actNo] = content;
}
function actContentProblems() {
  const problems = [];
  ACTS.forEach((act, i) => act.regions.forEach((r, j) => {
    const where = `act ${i + 1} region ${j + 1} (${r.name})`;
    for (const [kind] of r.pool || []) if (!EDEF[kind]) problems.push(`${where}: pool enemy ${kind} has no EDEF`);
    if (r.elite && !EDEF[r.elite]) problems.push(`${where}: elite ${r.elite} has no EDEF`);
    if (r.boss && !(EDEF[r.boss] && EDEF[r.boss].boss)) problems.push(`${where}: boss ${r.boss} is not a boss EDEF`);
    if (r.boss && !AI[r.boss]) problems.push(`${where}: boss ${r.boss} has no AI`);
    if (r.mech && typeof r.mechPick !== 'function' && !MECH[r.mech]) problems.push(`${where}: mechanic ${r.mech} is not registered`);
  }));
  for (const [actNo, content] of Object.entries(ACT_CONTENT)) for (const [kind, def] of Object.entries(content.enemies || {})) {
    if (def.boss && !AI[kind]) problems.push(`act ${actNo}: boss ${kind} has no AI`);
    if (def.boss && !BOSS_LIGHT[kind]) problems.push(`act ${actNo}: boss ${kind} has no BOSS_LIGHT`);
  }
  return problems;
}
