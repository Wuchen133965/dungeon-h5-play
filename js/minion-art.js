'use strict';
// Appearance follows the owner's weapon, including remote actors. Combat kinds and timings stay in classes.js.
const MINION_ART_ROWS = {
  spirit: [
    ['....oo....', '...owwo...', '..owhhwo..', '.owheehwo.', '..owhhwo..', '...owwo...', '..o.ww.o..', '....oo....'],
    ['....oo....', '...owwo...', '..owhhwo..', '.owheehwo.', '..owhhwo..', '...owwo...', '...owwo...', '..o....o..'],
  ],
  skeleton: [
    ['...oooo...', '..owhhwo..', '..oewweo..', '...owwo...', '.o.owwo.o.', 'owookkoowo', '.o.owwo.o.', '...okko...', '..ow..wo..', '..oo..oo..'],
    ['...oooo...', '..owhhwo..', '..oewweo..', '...owwo...', '.o.owwo.o.', 'owookkoowo', '.o.owwo.o.', '...okko...', '.ow....wo.', '.oo....oo.'],
  ],
  raven: [
    ['o..........o', 'owo......owo', '.owwoooowwo.', '..owwwwwwo..', '...oeewwo...', '....owwoh...', '....owwo....', '...o.oo.o...'],
    ['....o..o....', '...owoo wo..'.replace(' ', ''), '..owwwwwwo..', '.owweewwwwo.', 'owwoowwoowwo', 'oo..owwoh.oo', '....owwo....', '...o.oo.o...'],
  ],
  mushroom: [
    ['...oooooo...', '..owhwwhwo..', '.owwwhhwwwo.', 'owhwwwwwwhwo', '.okkkkkkkko.', '...oseeso...', '...osssso...', '..owsSSswo..', '...owwwo....', '..oo..oo....'],
    ['...oooooo...', '..owhwwhwo..', '.owwwhhwwwo.', 'owhwwwwwwhwo', '.okkkkkkkko.', '...oseeso...', '...osssso...', '..owsSSswo..', '...owwwo....', '.oo....oo...'],
  ],
  scarab: [
    ['....hhhh....', '...ohwwho...', '..oowhhwoo..', '.ohowwwwoh o.'.replace(' ', ''), 'oh.oweewo.ho', '.o.owwwwo.o.', 'oh.owkkwo.ho', '.oh.oooo.ho.', '...o....o...'],
    ['....hhhh....', '...ohwwho...', '..oowhhwoo..', 'oh.owwwwo.ho', '.ohoweewoh o.'.replace(' ', ''), 'oh.owwwwo.ho', '.ohowkkwoh o.'.replace(' ', ''), '..o.oooo.o..', '....o..o....'],
  ],
  lich: [
    ['...h.h.h...', '...ohhho...', '..oowwwoo..', '..okeeko...', '...owwo....', '..oowwkoo..', '.owwkhkwwo.', '..okwkwko..', '..okwwwko..', '.o..o.o..o.'],
    ['...h.h.h...', '...ohhho...', '..oowwwoo..', '..okeeko...', '...owwo....', '..oowwkoo..', '.owwkhkwwo.', '..okwkwko..', '..okwwwko..', '..o..o..o..'],
  ],
  knight: [
    ['....h.....', '...ohho...', '..owhwwo..', '..okeeko..', '...okko...', '.oowhwwoo.', 'owokhkwkwo', 'owokkkwkwo', '.o.owwo.o.', '..ow..wo..', '..oo..oo..'],
    ['....h.....', '...ohho...', '..owhwwo..', '..okeeko..', '...okko...', '.oowhwwoo.', 'owokhkwkwo', 'owokkkwkwo', '.o.owwo.o.', '.ow....wo.', '.oo....oo.'],
  ],
  shade: [
    ['..o.....o..', '..oko.oko..', '...owwwo...', '..okwwwko..', '..okeewko..', '...owwwo...', '..okwkwko..', '.okkwwwkko.', '..o.ww.o...', '....oo.....'],
    ['..o.....o..', '..oko.oko..', '...owwwo...', '..okwwwko..', '..okeewko..', '...owwwo...', '..okwkwko..', '.okkwwwkko.', '...owwo....', '..o....o...'],
  ],
  void: [
    ['...o....o...', '...ow..wo...', '..owwoowwo..', '.owwkhkwwwo.', 'owwkhee hkww o'.replaceAll(' ', ''), '.owwkhkwwwo.', '..owwoowwo..', '.o..w..w..o.', '...o....o...'],
    ['...o....o...', '..owo..owo..', '..owwoowwo..', '.owwkhkwwwo.', 'owwkhee hkww o'.replaceAll(' ', ''), '.owwkhkwwwo.', '..owwoowwo..', '...ow..wo...', '.o........o.'],
  ],
  book: [
    ['...hh.......', '...hho......', '...owwo.....', '..oweewo....', '.oooowwoooo.', 'owhhhokhhwwo', 'owhwhokhwhwo', 'owhhh ohhhwwo'.replace(' ', ''), '.oooohooooo.', '..o......o..'],
    ['....hh......', '...ohh......', '...owwo.....', '..oweewo....', '.oooowwoooo.', 'owhwhokhhhwo', 'owhhhokhwhwo', 'owhhh ohhhwwo'.replace(' ', ''), '.oooohooooo.', '...o....o...'],
  ],
  sigil: [
    ['....hoho....', '...ohhhho...', '...okwwko...', '..okwhewko..', '...okeeko...', '.ooowhhwooo.', 'owkoowwookwo', '.oo.owwo.oo.', '...okk kko...'.replace(' ', ''), '..oo....oo..'],
    ['....hoho....', '...ohhhho...', '...okwwko...', '..okwhewko..', '...okeeko...', '.ooowhhwooo.', 'owkoowwookwo', '.oo.owwo.oo.', '...okk kko...'.replace(' ', ''), '.oo......oo.'],
  ],
  lantern: [
    ['.....h......', '....ohho....', '....ohwo....', '...ohwwho...', '...oheeho...', '..ooohhooo..', '..okwkkwko..', '..owhwwhwo..', '..okwwwwko..', '..oohhhoo...', '...o...o....'],
    ['....h.......', '...ohhho....', '....ohwo....', '...ohwwho...', '...oheeho...', '..ooohhooo..', '..okwkkwko..', '..owhwwhwo..', '..okwwwwko..', '..oohhhoo...', '....o.o.....'],
  ],
  star: [
    ['.....h......', '....ohho....', '.o..ohho..o.', '.owohwwhowo.', '..owheehwo..', '...owwwwo...', '..owhwwhwo..', '.owoo..oowo.', '.oo......oo.', '.....oo.....'],
    ['.....h......', '....ohho....', '....ohho....', '.ooohwwhooo.', '.owwheehwwo.', '...owwwwo...', '..owhwwhwo..', '..ooo..ooo..', '...o....o...', '.....oo.....'],
  ],
};
const MINION_WEAPON_SHAPE = {
  spiritrod: 'spirit', lichstaff: 'lich', legion: 'knight', m1_rod: 'skeleton', m2_rod: 'raven',
  m3_rod: 'mushroom', g3_mycotome: 'mushroom', m4_rod: 'scarab', m6_rod: 'void', g6_shadeband: 'shade',
  r2_lantern: 'star', r3_lantern: 'shade', r4_lantern: 'lich', r5_lantern: 'star', r6_lantern: 'void',
};
SPR.hound = [
  ['..........o...', 'o........owo..', 'owoooooo.owo..', '.owhhhhhhoeeo.', '..owkwkwwohho.', '..owkwkwwooo..', '...owwwwo.....', '..ow.o.wo.....', '..oo...oo.....'],
  ['..........o...', '.o.......owo..', '.owooooo.owo..', '..owhhhhhoeeo.', '..owkwkwwohho.', '..owkwkwwooo..', '...owwwwo.....', '.ow.....wo....', '.oo.....oo....'],
].map(rows => makeSprite(rows, { o: '#2a2738', w: '#bcb6a9', h: '#eee6c6', k: '#4e4d59', e: '#da98ff' }));
SPR.ghost = [
  ['...ooo...', '..owhwo..', '.oweewho.', '.owwhwwo.', '..owhwo..', '.owhhwwo.', '..owwwo..', '.o.o.o.o.'],
  ['...ooo...', '..owhwo..', '.oweewho.', '.owwhwwo.', '..owhwo..', '.owhhwwo.', '..owwwo..', '..o.o.o..'],
].map(rows => makeSprite(rows, { o: '#224d49', w: '#8acfb9', h: '#d6fff0', e: '#ffffff' }));
const MINION_WEAPON_ART = new WeakMap();
function minionAppearance(m, weapon) {
  if (m.kind !== 'spirit' || !weapon || weapon.cls !== 'summoner') return SPR[m.kind] || SPR.spirit;
  if (MINION_WEAPON_ART.has(weapon)) return MINION_WEAPON_ART.get(weapon);
  const shape = MINION_WEAPON_SHAPE[weapon.id] || (weapon.icon[0] === 'book' ? 'book' : weapon.icon[0] === 'gem' ? 'sigil' : weapon.icon[0] === 'lantern' ? 'lantern' : 'spirit');
  const [, w, k, h] = weapon.icon;
  const palette = { o: '#252238', w, k, h, e: '#fff8dc', s: '#e3e3c7', S: '#a0999a' };
  // Chapter emblems and weapon-family details retain different identities within a shared silhouette.
  const frames = MINION_ART_ROWS[shape].map(rows => {
    const c = makeSprite(rows, palette), canvas = document.createElement('canvas'); canvas.width = c.w; canvas.height = c.h;
    const ctx = canvas.getContext('2d'); ctx.drawImage(c.img, 0, 0);
    ctx.fillStyle = h;
    const act = weapon.act || 1;
    if (act === 2) { ctx.fillRect(1, 2, 1, 3); ctx.fillRect(0, 3, 3, 1); }
    else if (act === 3) { ctx.fillRect(0, 3, 2, 1); ctx.fillRect(1, 4, 1, 2); }
    else if (act === 4) { ctx.fillRect(1, 2, 2, 1); ctx.fillRect(2, 1, 1, 3); }
    else if (act === 5) { ctx.fillRect(0, 2, 3, 1); ctx.fillRect(1, 1, 1, 3); }
    else if (act === 6) { ctx.fillRect(0, 1, 1, 3); ctx.fillRect(2, 1, 1, 3); }
    if (weapon.icon[0] === 'book' && shape !== 'book') { ctx.fillRect(c.w - 4, c.h - 4, 3, 2); ctx.fillStyle = k; ctx.fillRect(c.w - 3, c.h - 4, 1, 2); }
    return spriteFromCanvas(canvas);
  });
  MINION_WEAPON_ART.set(weapon, frames); return frames;
}
