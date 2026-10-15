'use strict';
// ============================================================ 数值表 → 游戏数据
// js/tables.js 由「数值表.xlsx」导出（运行 tools/导出数值表.bat）。本文件在所有内容脚本之后加载，
// 把表里的数值写回游戏对象。表里没有的条目保持代码里的原值，所以代码里新增的怪物、装备、天赋不会因为表没更新而丢失。
// Effects are rebuilt from [stat, op, value] rows; op: '+' add, 'x' multiply, '=' set, 'min' keep the smaller value.
(function applyTables(T) {
  if (!T) return;
  const report = { applied: 0, missing: [] }, miss = (kind, id) => report.missing.push(`${kind}:${id}`);
  const put = (obj, src, keys) => { for (const k of keys) if (src[k] !== undefined && src[k] !== null && src[k] !== '') { obj[k] = src[k]; report.applied++; } };
  const OPS = { '+': (s, k, v) => { s[k] += v; }, 'x': (s, k, v) => { s[k] *= v; }, '=': (s, k, v) => { s[k] = k === 'wpn' ? WTYPES[v] : v; },
    'min': (s, k, v) => { s[k] = s[k] ? Math.min(s[k], v) : v; } };
  const effect = rows => s => { for (const [k, op, v] of rows) OPS[op](s, k, v); };

  if (T.config) for (const [k, v] of Object.entries(T.config)) if (k in CONFIG) { CONFIG[k] = v; report.applied++; } else miss('config', k);
  if (T.econ) for (const [name, arr] of Object.entries(T.econ)) {          // arrays are filled in place (consts elsewhere hold them)
    const target = { PRICE, SELL, SHRINE_COST, SET_AT }[name]; if (!target) { miss('econ', name); continue; }
    target.length = 0; target.push(...arr); report.applied++; }
  if (T.diffs) for (const d of T.diffs) { const D = DIFFS.find(x => x.id === d.id); if (D) put(D, d, Object.keys(d)); else miss('diff', d.id); }
  if (T.acts) for (const a of T.acts) { const A = ACTS.find(x => x.id === a.id); if (A) put(A, a, ['name', 'sub', 'rooms']); else miss('act', a.id); }
  if (T.regions) for (const r of T.regions) {
    const A = ACTS.find(x => x.id === r.act), REG = A && A.regions[r.idx - 1]; if (!REG) { miss('region', `${r.act}-${r.idx}`); continue; }
    put(REG, r, ['name', 'bossSub', 'mechName', 'mechTip', 'elite', 'boss', 'hazard']);
    if (r.pool) { REG.pool.length = 0; REG.pool.push(...r.pool); }
  }
  if (T.enemies) for (const [k, e] of Object.entries(T.enemies)) { const D = EDEF[k]; if (!D) { miss('enemy', k); continue; }
    put(D, e, ['hp', 'hw', 'hh', 'h', 'scale']); if (e.gold) { D.gold = e.gold; report.applied++; }
    // names: elites / bosses / named summons keep theirs on EDEF (banners, boss bar); ordinary mobs only have a label in ENAME
    if (e.name) { if (D.name || typeof ENAME === 'undefined' || !(k in ENAME)) D.name = e.name; else ENAME[k] = e.name; report.applied++; } }
  if (T.wtypes) for (const [k, w] of Object.entries(T.wtypes)) { const W0 = WTYPES[k]; if (!W0) { miss('wtype', k); continue; } put(W0, w, Object.keys(w)); }
  if (T.items) for (const it of T.items) { const I = ITEM_BY_ID[it.id]; if (!I) { miss('item', it.id); continue; }
    put(I, it, ['name', 'tier']); if ('lock' in it) I.lock = it.lock || undefined;
    if (I.slot === 'armor') put(I, it, ['defense']);
    if ('cls' in it) I.cls = it.cls || undefined;
    if (it.lines) I.lines = it.lines;
    if (it.fx && I.mod) I.mod = effect(it.fx);
  }
  if (T.talents) for (const t of T.talents) { const D = TALENT_BY_ID[t.id]; if (!D) { miss('talent', t.id); continue; }
    if (t.cost) { D.cost = t.cost; report.applied++; }
    if (t.desc) D.desc = l => t.desc[Math.max(0, Math.min(t.desc.length - 1, l - 1))];
    if (t.fx && D.fx) { const per = t.fx; D.fx = (s, l) => effect(per[Math.max(0, Math.min(per.length - 1, l - 1))] || [])(s); }
  }
  if (T.shrine) for (const st of T.shrine) { const S = SHRINE_STATS.find(x => x.id === st.id); if (!S) { miss('shrine', st.id); continue; }
    put(S, st, ['name', 'per']);
    if (!('value' in st)) continue;                                          // only the text changed
    const { stat, op, value } = st;
    S.app = op === 'x1n' ? (s, n) => { s[stat] *= 1 + n * value; } : op === 'x' ? (s, n) => { s[stat] *= Math.pow(value, n); } : (s, n) => { s[stat] += n * value; };
  }
  if (typeof SHRINE_MAX !== 'undefined' && T.econ && T.econ.SHRINE_COST && T.econ.SHRINE_COST.length !== SHRINE_MAX)
    console.warn('[数值表] 神殿价格的档数和代码里的最大等级不同，多出来的档不会生效');
  if (report.missing.length) console.warn('[数值表] 这些条目在游戏里找不到，已跳过：', report.missing.join(', '));
  window.TABLES_REPORT = report;
})(typeof TABLES !== 'undefined' ? TABLES : null);
