'use strict';
// The title is a quiet room from the remembered region, using the gameplay renderer.
// No gameplay update / spawn / enter hooks run here; this room belongs only to the title.
let TITLE_SCENE = null;
const TITLE_LAYOUT_W = 320, TITLE_LAYOUT_H = 160;
function titleSceneInvalidate() { TITLE_SCENE = null; }

const TITLE_AIR_THEMES = [
  { kind: 'ember', color: [239, 153, 92], accent: [255, 228, 171], drift: [1.2, -5.5], count: 18 },
  { kind: 'snow', color: [142, 207, 249], accent: [237, 247, 255], drift: [2.8, 5.6], count: 22 },
  { kind: 'spore', color: [129, 189, 125], accent: [210, 242, 159], drift: [1.1, -2.6], count: 18 },
  { kind: 'sand', color: [229, 183, 105], accent: [255, 233, 184], drift: [-5.8, 1.2], count: 20 },
  { kind: 'stardust', color: [154, 192, 245], accent: [241, 237, 255], drift: [-1.7, -1.6], count: 18 },
  { kind: 'void', color: [180, 111, 230], accent: [244, 181, 236], drift: [0.8, -3.2], count: 18 },
];

function titleSceneTexture(width, height, paint) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  return canvas;
}

// Soft textures are baked once per chapter. The animation only repositions these
// small canvases and a bounded set of pixel motes; no new gradients per frame.
function titleSceneAir(chapter, seed) {
  const theme = TITLE_AIR_THEMES[chapter.act - 1];
  const tint = mixRGB(theme.color, chapter.regionData.pal.deco, 0.16);
  const rr = mulberry32(seed ^ 0x616972);
  const particles = Array.from({ length: theme.count }, (_, i) => ({
    x: 143 + rr() * 177, y: 12 + rr() * 136, phase: rr() * Math.PI * 2,
    speed: 0.55 + rr() * 0.8, depth: i % 3 === 0 ? 0 : 1, size: i % 7 === 0 ? 2 : 1,
    accent: i % 4 === 0,
  }));
  const radial = (color, width, height, strength) => titleSceneTexture(width, height, (ctx, w, h) => {
    ctx.save(); ctx.scale(1, h / w);
    const gradient = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gradient.addColorStop(0, rgba(color, strength)); gradient.addColorStop(0.34, rgba(color, strength * 0.45));
    gradient.addColorStop(0.7, rgba(color, strength * 0.13)); gradient.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, w); ctx.restore();
  });
  const beam = titleSceneTexture(128, TITLE_LAYOUT_H, (ctx, w, h) => {
    const side = ctx.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, rgba(tint, 0)); side.addColorStop(0.2, rgba(tint, 0.16));
    side.addColorStop(0.48, rgba(tint, 0.42)); side.addColorStop(0.76, rgba(tint, 0.12));
    side.addColorStop(1, rgba(tint, 0)); ctx.fillStyle = side;
    ctx.beginPath(); ctx.moveTo(45, 0); ctx.lineTo(60, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    const fade = ctx.createLinearGradient(0, 0, 0, h);
    fade.addColorStop(0, 'rgba(0,0,0,0.95)'); fade.addColorStop(0.25, 'rgba(0,0,0,0.8)');
    fade.addColorStop(0.72, 'rgba(0,0,0,0.23)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h);
  });
  return { theme, particles, color: rgba(tint), accent: rgba(theme.accent),
    beam, mist: radial(tint, 160, 60, 0.45), glow: radial(tint, 64, 64, 0.8),
    treasureGlow: radial([255, 191, 92], 96, 72, 0.82) };
}

function titleSceneMotes(scene, t, depth) {
  const air = scene.air, theme = air.theme;
  const wrap = (value, size) => ((value % size) + size) % size;
  for (let i = 0; i < air.particles.length; i++) {
    const mote = air.particles[i]; if (mote.depth !== depth) continue;
    const sway = Math.sin(t * 0.45 + mote.phase) * (theme.kind === 'snow' ? 5 : 2.5);
    const x = Math.round(137 + wrap(mote.x - 137 + theme.drift[0] * t * mote.speed + sway, 183));
    const y = Math.round(8 + wrap(mote.y - 8 + theme.drift[1] * t * mote.speed, TITLE_LAYOUT_H - 16));
    const breath = 0.5 + 0.5 * Math.sin(t * (0.75 + mote.speed * 0.2) + mote.phase);
    g.globalAlpha = (depth ? 0.2 : 0.1) + breath * (depth ? 0.4 : 0.18);
    g.fillStyle = mote.accent ? air.accent : air.color;
    if (theme.kind === 'snow') {
      g.fillRect(x, y, mote.size, 1);
      if (mote.size === 2) { g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); }
    } else if (theme.kind === 'sand') g.fillRect(x, y, mote.size + 1, 1);
    else if (theme.kind === 'void') {
      g.fillRect(x, y, 1, mote.size + 1);
      if (mote.accent) g.fillRect(x + 2, y - 1, 1, 1);
    } else {
      g.fillRect(x, y, mote.size, 1);
      if (theme.kind === 'stardust' && mote.accent && breath > 0.5) {
        g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
      }
      if (theme.kind === 'ember' && mote.size === 2) { g.globalAlpha *= 0.38; g.fillRect(x, y + 1, 1, 2); }
      if (theme.kind === 'spore' && mote.accent) {
        g.globalAlpha *= 0.24; g.drawImage(air.glow, x - 6, y - 6, 13, 13);
      }
    }
  }
  g.globalAlpha = 1;
}

function titleSceneAtmosphere(scene, t, front) {
  const air = scene.air;
  g.save(); g.scale(RPW / TITLE_LAYOUT_W, RPH / TITLE_LAYOUT_H); g.globalCompositeOperation = 'screen';
  if (!front) {
    // Two slow shafts give the actual floor depth, and leave the menu side quiet.
    g.globalAlpha = 0.52 + 0.07 * Math.sin(t * 0.42);
    g.drawImage(air.beam, 167 + Math.sin(t * 0.16) * 9, -3, 132, TITLE_LAYOUT_H + 4);
    g.globalAlpha = 0.29 + 0.04 * Math.sin(t * 0.35 + 1.4);
    g.drawImage(air.beam, 244 + Math.sin(t * 0.12 + 1) * 7, 0, 78, TITLE_LAYOUT_H);
    for (let i = 0; i < 3; i++) {
      g.globalAlpha = 0.33 + Math.sin(t * 0.24 + i * 2.1) * 0.05;
      g.drawImage(air.mist, 132 + i * 51 + Math.sin(t * 0.18 + i) * 12,
        84 + i * 11 + Math.cos(t * 0.14 + i) * 3, 142, 44);
    }
  } else {
    // A translucent lower foreground veil moves independently of the rear haze.
    g.globalAlpha = 0.28 + Math.sin(t * 0.21 + 2) * 0.04;
    g.drawImage(air.mist, 137 + Math.sin(t * 0.13) * 17, 124, 204, 39);
  }
  titleSceneMotes(scene, t, front ? 1 : 0);
  g.restore();
}

function titleSceneTreasure(scene, t) {
  const chest = scene.chest, air = scene.air;
  const breath = 0.5 + 0.5 * Math.sin(t * 1.3);
  g.save(); g.globalCompositeOperation = 'screen';
  g.globalAlpha = 0.16 + breath * 0.09;
  g.drawImage(air.treasureGlow, chest.x - 43, chest.y - 41, 86, 65);
  g.globalAlpha = 0.08 + breath * 0.045;
  g.drawImage(air.glow, chest.x - 29, chest.y - 21, 58, 37);
  // The ellipse is a ground reflection. Four tiny glyph fragments orbit slowly,
  // and three staggered star glints rise around the unopened treasure.
  g.globalAlpha = 0.24 + breath * 0.09;
  ellipse(chest.x, chest.y + 2, 20 + breath, 5.5, air.accent);
  g.fillStyle = air.accent;
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + t * 0.16, x = Math.round(chest.x + Math.cos(angle) * 22), y = Math.round(chest.y + 2 + Math.sin(angle) * 6);
    g.globalAlpha = 0.2 + 0.14 * Math.sin(t * 0.9 + i * 1.7);
    g.fillRect(x, y, 2, 1); g.fillRect(x + 1, y - 1, 1, 2);
  }
  for (let i = 0; i < 3; i++) {
    const phase = ((t * 0.17 + i / 3) % 1 + 1) % 1;
    const x = Math.round(chest.x + Math.sin(i * 3.1 + t * 0.24) * 18), y = Math.round(chest.y - 6 - phase * 22);
    const gleam = Math.sin(phase * Math.PI);
    g.globalAlpha = gleam * 0.58; g.fillRect(x, y, 1, 1);
    if (gleam > 0.86) { g.globalAlpha *= 0.6; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
  }
  g.restore();
}

function titleSceneRandom(seed, fn) {
  const saved = rand;
  try { rand = mulberry32(seed >>> 0); return fn(); }
  finally { rand = saved; }
}

function titleSceneBuild(chapter) {
  const seed = 0x7469746c ^ chapter.act * 1301 ^ chapter.region * 739;
  return titleSceneRandom(seed, () => {
    const room = { gx: 0, gy: 0, type: 'combat', doors: { n: true, e: true },
      locked: false, cleared: true, visited: true, dist: 0 };
    buildRoom(room, chapter.region, 2, chapter.act);
    // These mechanisms normally create their visual state on their first combat update.
    // Set a harmless tableau directly, and let the same draw / light hooks paint it.
    if (room.mech === 'tide') room.tide = { t: 0, ph: 2, lv: 0.62 };
    if (room.mech === 'sun') room.shafts = [
      { x: 192 * RPW / TITLE_LAYOUT_W, y: 52 * RPH / TITLE_LAYOUT_H, vx: 0, vy: 0, r: 23, t: 0 },
      { x: 271 * RPW / TITLE_LAYOUT_W, y: 96 * RPH / TITLE_LAYOUT_H, vx: 0, vy: 0, r: 18, t: 0 },
    ];
    if (room.mech === 'wind') room.wind = { t: 0, ph: 0, d: [1, 0] };
    // A cache helper such as sandPits may populate only this scene's own room.
    const free = (x, y) => {
      let best = { x, y }, score = Infinity;
      for (let ty = 2; ty < RH - 1; ty++) for (let tx = Math.ceil(RW * .55); tx < RW - 2; tx++) {
        if (room.tiles[ty * RW + tx] !== 0 || room.tiles[ty * RW + tx - 1] !== 0 || room.tiles[ty * RW + tx + 1] !== 0) continue;
        const cx = tx * TS + 8, cy = ty * TS + 12, d = dist(cx, cy, x, y);
        if (d < score) { score = d; best = { x: cx, y: cy }; }
      }
      return best;
    };
    return { key: chapter.act + ':' + chapter.region, seed, room, air: titleSceneAir(chapter, seed),
      chest: { ...free(250 * RPW / TITLE_LAYOUT_W, 97 * RPH / TITLE_LAYOUT_H), tier: 3, open: 0, opened: false },
      hero: free(209 * RPW / TITLE_LAYOUT_W, 115 * RPH / TITLE_LAYOUT_H) };
  });
}

// The old drawing helpers read G directly. Give them independent title objects for
// the duration of this synchronous draw, then restore every field and reference.
function titleSceneView(values, fn) {
  const saved = Object.fromEntries(Object.keys(values).map(k => [k, { exists: Object.prototype.hasOwnProperty.call(G, k), value: G[k] }]));
  try { Object.assign(G, values); return fn(); }
  finally {
    for (const [key, entry] of Object.entries(saved)) {
      if (entry.exists) G[key] = entry.value;
      else delete G[key];
    }
  }
}

function titleScenePaint(time) {
  const chapter = titleMenuChapter();
  const key = chapter.act + ':' + chapter.region;
  if (!TITLE_SCENE || TITLE_SCENE.key !== key) TITLE_SCENE = titleSceneBuild(chapter);
  const scene = TITLE_SCENE, room = scene.room, mechanism = mechOf(room);
  const t = typeof TITLE_SETTINGS !== 'undefined' && !TITLE_SETTINGS.titleMotion ? 1.25 : time;
  const weapon = G.eq.weapon || ITEM_BY_ID.rusty;
  const equipment = { weapon, armor: G.eq.armor, boots: G.eq.boots, trinkets: [...(G.eq.trinkets || [])] };
  const player = { ...(G.player || newPlayer(scene.hero.x, scene.hero.y)), ...scene.hero,
    face: 0, scale: 1, moving: false, walk: 0, rolling: 0, inv: 0, swing: 0, stun: 0,
    wpn: G.player && G.eq.weapon ? G.player.wpn : WTYPES.sword };
  const scaleX = LW / RPW, scaleY = LH / RPH;
  const lightCanvas = LCV, lightContext = lg;
  g.save();
  lg.save();
  try {
    titleSceneRandom(scene.seed + Math.floor(t * 12), () => titleSceneView({
      room, player, eq: equipment, enemies: [], parts: [], cine: null,
      time: t, act: chapter.act, chapter: chapter.region, cold: 0, corrupt: 0, simDt: 0,
    }, () => {
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = false;
      g.drawImage(room.canvas, 0, 0, LW, LH);
      g.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      drawHazards(room, t);
      if (mechanism && mechanism.draw) mechanism.draw(room, t);
      titleSceneAtmosphere(scene, t, false);
      if (scene.chest.y < player.y) { drawChest(g, scene.chest); drawPlayer(player, t); }
      else { drawPlayer(player, t); drawChest(g, scene.chest); }

      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalAlpha = 1;
      lg.globalCompositeOperation = 'source-over';
      lg.fillStyle = mechanism && mechanism.amb ? mechanism.amb(room) : chapter.regionData.amb;
      lg.fillRect(0, 0, LW / 2, LH / 2);
      lg.globalCompositeOperation = 'lighter';
      lg.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      for (const torch of room.torches) light(torch.x, torch.y,
        112 + Math.sin(t * 9 + torch.ph) * 5 + Math.sin(t * 23 + torch.ph) * 3, [255, 160, 80], 0.85);
      light(player.x, player.y - 6, 90, [160, 150, 180], 0.7);
      light(scene.chest.x, scene.chest.y - 6, 34, TIERS[scene.chest.tier].rgb, 0.6);
      for (const hazard of room.hz) if (hazard.v === 3 && (hazard.x / TS + hazard.y / TS) % 2 === 0)
        light(hazard.x + 8, hazard.y + 8, 40, [255, 110, 40], 0.4 + 0.08 * Math.sin(t * 3 + hazard.x));
      if (mechanism && mechanism.light) mechanism.light(room, 0, 0, t);

      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      g.globalCompositeOperation = 'multiply'; g.drawImage(lightCanvas, 0, 0, LW, LH);
      g.globalCompositeOperation = 'lighter'; g.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      titleSceneTreasure(scene, t);
      for (const torch of room.torches) drawFlame(torch, t);
      if (mechanism && mechanism.emissive) mechanism.emissive(room, t);
      titleSceneAtmosphere(scene, t, true);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over'; g.drawImage(VIG, 0, 0);
    }));
  } finally {
    // Lighting uses the existing offscreen buffer; retain its context and state.
    lightContext.restore(); g.restore();
  }
  return scene;
}
