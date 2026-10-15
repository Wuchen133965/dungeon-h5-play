'use strict';
// Character art only. Loaded after all acts so their sprite references are registered.
// Foot anchors, entity sizes and combat timing remain owned by the gameplay code.
const ORIGINAL_ACTOR_FRAMES = Object.fromEntries(Object.entries(SPR).filter(([, sprite]) => Array.isArray(sprite)));
// Gear and the selected town outfit share the same cached pixel renderer.
const HERO_GEAR_ART = new Map();
function spriteFromCanvas(canvas) {
  const w = canvas.width, h = canvas.height;
  const variant = (flip, white) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (flip) { x.translate(w, 0); x.scale(-1, 1); }
    x.drawImage(canvas, 0, 0);
    if (white) { x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); }
    return c;
  };
  return { w, h, img: canvas, flip: variant(true, false), white: variant(false, true), whiteFlip: variant(true, true) };
}
function heroAppearance(p, eq = G.eq) {
  const frame = p.moving ? Math.floor(p.walk * 8) % 2 : 0;
  const outfit = Object.hasOwn(COSTUME_FRAMES, p.costume) ? p.costume : 'adventurer';
  // Costumes cover body gear visually, while the real weapon, charms and all gear stats remain equipped.
  const armor = outfit === 'adventurer' ? eq.armor : null, boots = outfit === 'adventurer' ? eq.boots : null, trinkets = eq.trinkets || [];
  const base = outfit === 'adventurer' ? SPR.hero[frame] : COSTUME_FRAMES[outfit][frame];
  if (outfit !== 'adventurer') return base;
  if (!armor && !boots && !trinkets.length) return base;
  const key = [outfit, armor ? armor.id : '', boots ? boots.id : '', ...trinkets.map(it => it.id), frame].join(':');
  if (HERO_GEAR_ART.has(key)) return HERO_GEAR_ART.get(key);
  const c = document.createElement('canvas'); c.width = base.w + 2; c.height = base.h;
  const x = c.getContext('2d'); x.drawImage(base.img, 1, 0);
  const rect = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  if (armor) {
    const [kind, main, dark, hi] = armor.icon;
    const im = x.getImageData(0, 0, c.width, c.height), colors = { '58,100,184': main, '38,64,122': dark };
    for (let i = 0; i < im.data.length; i += 4) {
      const col = colors[Array.from(im.data.slice(i, i + 3)).join(',')];
      if (col) for (let j = 0; j < 3; j++) im.data[i + j] = parseInt(col.slice(1 + j * 2, 3 + j * 2), 16);
    }
    x.putImageData(im, 0, 0);
    if (kind === 'robe') {
      rect(3, 10, 6, 3, dark); rect(4, 10, 4, 3, main); rect(5, 8, 1, 5, hi);
      if (armor.id === 'stagecoat') { rect(3, 8, 1, 3, hi); rect(8, 8, 1, 3, hi); }
      if (armor.id === 'archrobe' || armor.id === 'callrobe') { rect(6, 10, 2, 1, hi); rect(7, 9, 1, 3, hi); }
    } else if (kind === 'armor') {
      rect(2, 7, 2, 1, hi); rect(8, 7, 2, 1, hi); rect(4, 8, 1, 2, hi);
      if (armor.id === 'mail') for (let y = 8; y <= 10; y++) for (let a = 4; a <= 7; a++) if ((a + y) % 2) rect(a, y, 1, 1, dark);
      if (armor.id === 'leather') { rect(4, 8, 4, 1, dark); rect(6, 8, 1, 3, dark); }
      if (armor.id === 'thorn') { rect(1, 7, 1, 3, hi); rect(10, 7, 1, 3, hi); rect(4, 9, 1, 1, dark); }
      if (armor.id === 'magma') { rect(5, 8, 1, 2, hi); rect(6, 9, 1, 2, hi); rect(7, 10, 1, 1, hi); }
      if (armor.id === 'bonemail') for (let y = 8; y < 11; y++) { rect(4, y, 4, 1, y % 2 ? dark : hi); }
      if (['plate', 'aegis', 'sanctum'].includes(armor.id)) { rect(5, 8, 2, 3, hi); rect(4, 9, 4, 1, hi); }
    }
  }
  // Independent boots use the equipped pair's palette while keeping the original foot anchors.
  if (boots) {
    const [, main, dark, hi] = boots.icon, left = frame ? 2 : 3;
    for (const foot of [left, 7]) {
      rect(foot, 11, 2, 2, dark); rect(foot, 11, 2, 1, main); rect(foot, 11, 1, 1, hi);
    }
  }
  // Necklaces, rings and carried charms use the actual equipped item's palette.
  trinkets.forEach((it, i) => {
    const [kind, main, dark, hi] = it.icon;
    if (kind === 'feather') { rect(7, 1, 1, 3, dark); rect(8, 0, 1, 3, main); rect(8, 0, 1, 1, hi); }
    else if (kind === 'amulet') { rect(5, 7, 2, 1, dark); rect(6, 8, 1, 2, main); rect(6, 8, 1, 1, hi); }
    else if (kind === 'ring') rect(i % 2 ? 9 : 2, 9, 1, 1, main);
    else { const a = 3 + i; rect(a, 10, 1, 2, dark); rect(a, 11, 1, 1, main); }
  });
  const spr = spriteFromCanvas(c); HERO_GEAR_ART.set(key, spr); return spr;
}
function drawEquippedWeapon(it, kind, hx, hy, ang, cols, sc) {
  const [main, dark, hi] = cols, c = Math.cos(ang), s = Math.sin(ang);
  const dot = (along, across, col) => px(hx + (c * along - s * across) * sc, hy + (s * along + c * across) * sc, sc, sc, col);
  if (it.id === 'club') {
    for (let i=0;i<12;i++) for(let j=-(i>5?1:0);j<=(i>5?1:0);j++) dot(i,j,j===-1?hi:i<5?dark:main);
    return;
  }
  const length = it.id === 'shortbow' ? 0.8 : ['longbow','star'].includes(it.id) ? 1.2 : 1;
  drawWeapon(kind,hx,hy,ang,cols,sc*length);
  if (it.id === 'trident') {
    for(const side of [-1,1]) { for(let i=12;i<18;i++) dot(i,side*3,i===17?hi:main); for(let j=0;j<=3;j++) dot(12,side*j,main); }
  }
  if (['twin','viper'].includes(it.id)) for(let i=1;i<6;i++) dot(i,-3,i===5?hi:main);
  if (it.id === 'bearded') for(let i=8;i<12;i++) dot(i,4,main);
  if (it.id === 'dragon') for(let i=7;i<11;i++) for(let j=-3;j<0;j++) dot(i,j,j===-3?hi:main);
  if (it.id === 'dawn' || it.id === 'oath') { for(let j=-2;j<=2;j++) dot(2,j,dark); dot(2,0,hi); for(let i=4;i<11;i++) dot(i,-1,hi); }
  if (it.id === 'froststaff') { dot(12,-2,hi); dot(12,2,main); dot(14,0,hi); }
}
function drawHeroCape(p, time, flip) {
  const armor = G.eq.armor;
  if (Object.hasOwn(COSTUME_FRAMES, p.costume) || !armor || armor.icon[0] !== 'cloak') return;
  const [, main, dark, hi] = armor.icon, sc = p.scale;
  const sway = Math.round(Math.sin(p.walk * 10 + time * 2) * (p.moving ? 1.5 : 0.5));
  const x = p.x + (flip ? 1 : -4) * sc, y = p.y - 7 * sc;
  for (let i = 0; i < 7; i++) {
    const off = Math.round(sway * i / 7);
    px(x + off, y + i * sc, 4 * sc, sc, dark);
    px(x + off + sc, y + i * sc, 2 * sc, sc, main);
    if (i === 6) px(x + off + sc, y + i * sc, sc, sc, hi);
  }
}

// Hand-drawn silhouettes: translucent slime core, wing bones, rib cage, segmented carapace.
SPR.slime = makeSprite([
  '.....ooooo.....', '...oohhhhhoo...', '..ohwwwgggggo..', '.ohwwggggggggo.',
  '.ohwgggggggggo.', 'ohgggeeggeegggo', 'ohgggeeggeegggo', 'ogggggnnngggggo',
  'ogggGggnggGgggo', '.ogGGBggBGGGgo.', '.oGGGBBBBGGGGo.', '..oooo..ooooo..',
], { o: '#163640', h: '#94e6a1', w: '#e5f8be', g: '#52b878', G: '#2d8068', B: '#275664', e: '#132738', n: '#b7e796' });
SPR.slimeBig = makeSprite([
  '......g...g......', '.....gGg.gGg.....', '...oogggggggoo...', '..ohhhhhhhhhhho..',
  '.ohwwmmmmmmmmmho.', 'ohwwmmmwwmmmmmmho', 'ohwmmmmmmmmmmmmmo', 'ohmmmeemmmmeemmmo',
  'ommmmeemmmmeemmmo', 'ommmmmmnnnmmmmmmo', '.omMMmmnmnmmMMmo.', '.oMMMMmnnnmMMMMo.',
  '..oMMMBmBmBMMMo..', '...oooo...oooo...',
], { o: '#302444', h: '#dba7f2', w: '#fce0e9', m: '#a367ce', M: '#694294', B: '#453463', e: '#241b37', n: '#e7b5f5', g: '#f3d481', G: '#a6774a' });
const ART_BAT = [
  ['o...............o', 'oho...........oho', 'ohhho..o.o..ohhho', 'ohmhhoooooohhmhho', '.ohmmhohhhohmmho.', '..ohhhewewhhhho..', '...ooohhhoooo....', '......offo.......', '......o..o.......'],
  ['....o.......o....', '...oho.....oho...', '..ohmho.o.ohmho..', '.ohmmhooooohmmho.', 'ohmmhohhhhohmmhho', 'ohhhoo ewe oohhho'.replaceAll(' ', 'h'), 'ohoo..ohho...ooho', 'oo....offo.....oo', '......o..o.......'],
];
for (const [key, colors] of [['bat', ['#9873b8', '#503d78', '#ed82a1']], ['firebat', ['#eaae64', '#a34840', '#fff3b0']]])
  SPR[key] = ART_BAT.map(r => makeSprite(r, { o: '#292238', h: colors[0], m: colors[1], e: colors[2], w: '#fff2d9', f: '#ddd5bd' }));
const ART_SKEL_TOP = [
  '....oooooo....', '...obwwwwbo...', '..obwhwwhwbo..', '..oweeeeewwo..', '..owewwewewo..',
  '...owbnwbwo...', '....owwwwo....', '.oo..onno..oo.', 'obboobwwboobbo', 'owwoobnnboowwo',
  '.oo.obwwbo.oo.', '.oo.obnnbo.oo.', '....oggggo....', '....occcco....',
];
SPR.skel = [
  ['....ow..wo....', '....ob..bo....', '...oww..wwo...', '...ooo..ooo...'],
  ['...ow....wo...', '...ob....bo...', '..oww....wwo..', '..ooo....ooo..'],
].map(feet => makeSprite([...ART_SKEL_TOP, ...feet], { o: '#28253a', b: '#9f9b89', w: '#e9dfbf', h: '#fff4da', e: '#dd6b68', n: '#48404e', g: '#b38d53', c: '#53647c' }));
SPR.shroom = makeSprite([
  '......oooo......', '....oommmmoo....', '..oomwhmmmwmoo..', '.omwwhmmmmmmwmo.', 'ommmmmmwwmmmmhmo',
  'omwwmmmmmmmwwhmo', '.oMMMMMMMMMMMMo.', '..onnnnnnnnnno..', '....otetteto....', '....otttttto....',
  '...otTttttTto...', '...otTttttTto...', '..ooTTTTTTTToo..',
], { o: '#34223e', m: '#b75d9e', M: '#713e7f', w: '#f1cbb6', h: '#e791ad', n: '#b58587', t: '#ddc9b1', T: '#a88c99', e: '#383346' });
const ART_SPIDER = [
  ['..o.........o..', '.oho.ooooo.oho.', 'oh.ooBBBBBoo.ho', '.oohBbBbBbBhoo.', 'ooBBBeBeBeBBboo', '.oohBbbbbbBhoo.', 'oh.ooBBBBBoo.ho', '.oho.ooooo.oho.', '..o.........o..'],
  ['.o...........o.', '..ohoooooooho..', 'oohoBBBBBBB ohoo'.replace(' ', ''), '.oohBbBbBbBhoo.', '.ohBBeBeBeBBho.', 'oohoBbbbbbB ohoo'.replace(' ', ''), '..ohoBBBBBoho..', '.o...ooooo...o.', 'o.............o'],
];
for (const [key, colors] of [['spider', ['#839567', '#44565a', '#f48772']], ['queen', ['#b283ca', '#644b88', '#ffe597']]])
  SPR[key] = ART_SPIDER.map(r => makeSprite(r, { o: '#242436', h: colors[0], B: colors[1], b: colors[0], e: colors[2] }));

const ART_GOLEM_TOP = [
  '......oooooo......', '.....ohHHHHho.....', '....ohHhHHHHho....',
  '....oHyeHHyeHo....', '....oHHHLLHHHo....', '.....oHHLLHHo.....',
  '..ooooHHHHHHoooo..', '.ohHHhoHLLHohHHho.', 'ohHHHhoHyyHohHHHho',
  'ohHLHHoLyyLoHHLHho', 'oHHLHHoHLLHoHHLHHo', '.oHLHoHHLLHHoHLHo.',
  '.oHHHoHHLHHHoHHHo.', '..ooo.oLLLLo.ooo..',
];
const ART_GOLEM_FEET = [
  ['.....oHH..HHo.....', '....ohHH..HHho....', '....oHHH..HHHo....', '....oooo..oooo....'],
  ['....oHH....HHo....', '...ohHH....HHho...', '...oHHH....HHHo...', '...oooo....oooo...'],
];
const GOLEM_MATERIALS = {
  golem: ['#746674', '#aca0a1', '#c85140', '#ffc07c'],
  colossus: ['#554352', '#9b7281', '#e8794a', '#ffe5ac'],
  frostGolem: ['#6699b7', '#b5dfeb', '#9deded', '#f3ffff'],
  sandColossus: ['#ae865d', '#e6c89a', '#68576b', '#ffe3a0'],
  cloudGolem: ['#92a6c1', '#e4e9eb', '#657ab4', '#fff1a2'],
  voidColossus: ['#574968', '#9483b0', '#a250af', '#f9a1d8'],
};
for (const [key, [H, h, L, y]] of Object.entries(GOLEM_MATERIALS))
  SPR[key] = ART_GOLEM_FEET.map(feet => makeSprite([...ART_GOLEM_TOP, ...feet], { o: '#222336', H, h, L, y, e: '#fff5de' }));
const ART_IMP_TOP = [
  '.o...........o.', '.oho.......oho.', '..ohhooooohho..', '...ohrrrrrho...',
  '..ohryrrryrho..', '..orrerrrerro..', '..orrrnnnrrro..', '...orwrrwro....',
  '....orrrro.....', '.oo.orRRro.oo..', 'oRRoorrrooRRo..', 'oRo.orrrro.oRo.',
  '.o..orrRro..o..',
];
for (const [key, colors] of [['imp', ['#c65b50', '#73384c', '#e6b780', '#ffdc7e']], ['chaosImp', ['#ab65b8', '#633c82', '#eab1cd', '#b6f5e0']]])
  SPR[key] = [
    ['....or..ro.....', '...orr..rro....', '...ooo..ooo....'],
    ['...or....ro....', '..orr....rro...', '..ooo....ooo...'],
  ].map(feet => makeSprite([...ART_IMP_TOP, ...feet], { o: '#2b2338', r: colors[0], R: colors[1], h: colors[2], y: colors[3], e: '#fff8d6', n: '#6b344d', w: '#f3dbc2' }));

// anim2 closes over the original frame array. Update those arrays in place so
// enemies using that helper receive the redesign as well as direct SPR lookups.
for (const [key, frames] of Object.entries(ORIGINAL_ACTOR_FRAMES)) {
  if (SPR[key] !== frames) { frames.splice(0, frames.length, ...SPR[key]); SPR[key] = frames; }
}

// Bake directional material shading once for every enemy, including all six acts.
// Silhouettes and alpha are preserved; no per-frame pixel reads or random texture flicker.
const MATERIAL_ART = new WeakMap();
function materialSprite(s) {
  if (MATERIAL_ART.has(s)) return MATERIAL_ART.get(s);
  const c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
  const ctx = c.getContext('2d'); ctx.drawImage(s.img, 0, 0);
  const im = ctx.getImageData(0, 0, s.w, s.h), src = new Uint8ClampedArray(im.data);
  const solid = (x, y) => x >= 0 && x < s.w && y >= 0 && y < s.h && src[(y * s.w + x) * 4 + 3] > 0;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const i = (y * s.w + x) * 4;
    if (!src[i + 3]) continue;
    const bright = Math.max(src[i], src[i + 1], src[i + 2]);
    if (bright < 75) continue; // preserve dark outlines, eyes and carved recesses
    const edge = !solid(x, y - 1) || !solid(x - 1, y);
    const shade = !solid(x + 1, y) || !solid(x, y + 1);
    const k = edge ? 0.2 : shade ? -0.19 : (0.5 - y / s.h) * 0.18;
    for (let ch = 0; ch < 3; ch++) im.data[i + ch] = k > 0 ? src[i + ch] + (255 - src[i + ch]) * k : src[i + ch] * (1 + k);
  }
  ctx.putImageData(im, 0, 0);
  const flip = document.createElement('canvas'); flip.width = s.w; flip.height = s.h;
  const fg = flip.getContext('2d'); fg.translate(s.w, 0); fg.scale(-1, 1); fg.drawImage(c, 0, 0);
  const result = { ...s, img: c, flip }; MATERIAL_ART.set(s, result); return result;
}
for (const def of Object.values(EDEF)) {
  const original = def.spr;
  def.spr = e => materialSprite(original(e));
}
