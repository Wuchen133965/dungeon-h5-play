'use strict';
// ============================================================ pixel sprites from strings
function makeSprite(rows, pal) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const mk = (fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; };
  const paint = (x, flip, white) => rows.forEach((r, j) => [...r].forEach((ch, i) => {
    const p = pal[ch]; if (!p) return; x.fillStyle = white ? '#fff' : p; x.fillRect(flip ? w - 1 - i : i, j, 1, 1); }));
  return { w, h, img: mk(x => paint(x, false, false)), flip: mk(x => paint(x, true, false)),
    white: mk(x => paint(x, false, true)), whiteFlip: mk(x => paint(x, true, true)) };
}
// draw sprite anchored at bottom-centre (feet)
function drawSpr(g, s, x, y, o = {}) {
  const sx = o.sx || 1, sy = o.sy || 1, img = o.white ? (o.flip ? s.whiteFlip : s.white) : (o.flip ? s.flip : s.img);
  const w = Math.round(s.w * sx), h = Math.round(s.h * sy);
  if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  g.drawImage(img, Math.round(x - w / 2), Math.round(y - h), w, h);
  g.globalAlpha = 1;
}

const OUT = '#1a1018';
const SPR = {};
SPR.hero = [
  ['....pp....', '...ppp....', '..oooooo..', '.ohhhhhho.', '.ohhhvvvo.', '.ohhhhhho.', '..oHHHHo..',
   '.obbbbbbo.', 'obbBggBbbo', 'oBbbbbbbBo', '.obbbbbbo.', '..olo.olo.', '..ofo.ofo.', '..oo..oo..'],
  ['....pp....', '...ppp....', '..oooooo..', '.ohhhhhho.', '.ohhhvvvo.', '.ohhhhhho.', '..oHHHHo..',
   '.obbbbbbo.', 'obbBggBbbo', 'oBbbbbbbBo', '.obbbbbbo.', '.olo..olo.', '.ofo..ofo.', '.oo....oo.'],
].map(r => makeSprite(r, { o: OUT, p: '#d83040', h: '#b4bcd4', H: '#6a7090', v: '#20182a', b: '#3a64b8',
  B: '#26407a', g: '#ecba40', l: '#5a4a5a', f: '#3a2a2a' }));
SPR.slime = makeSprite(['...ooooo...', '..oggggwo..', '.ogggggwwo.', 'ogggggggggo', 'oggegggeggo',
  'ogggggggggo', 'oGgggggggGo', '.oGGGGGGGo.', '..ooooooo..'],
  { o: '#14301a', g: '#5ccc5a', G: '#2f8a3c', w: '#d8ffd0', e: '#10200f' });
SPR.slimeBig = makeSprite(['....ooooooo....', '..oogggggggwoo..', '.oggggggggwwwgo.', 'oggggggggggwggo',
  'ogggeegggeegggo', 'ogggeegggeegggo', 'ogggggggggggggo', 'oGgggggggggggGo', 'oGGgggggggggGGo',
  '.oGGGGGGGGGGGo.', '..ooooooooooo..'],
  { o: '#2a1238', g: '#b45ae0', G: '#7a2fa8', w: '#f4d8ff', e: '#1a0a20' });
SPR.bat = [
  ['oo.........oo', 'owo..o.o..owo', 'owwooooooowwo', '.owwoeoeowwo.', '..ooooooooo..', '....o...o....'],
  ['.....o.o.....', '...ooooooo...', '.owwoeoeowwo.', 'owwwooooowwwo', 'oww.......wwo', 'oo.........oo'],
].map(r => makeSprite(r, { o: '#2a1830', w: '#7a4a9a', e: '#ff4050' }));
SPR.skel = [
  ['...oooo...', '..owwwwo..', '.owwwwwwo.', '.owewwewo.', '.owwwwwwo.', '..owddwo..', '...owwo...',
   '..oowwoo..', '.owowwowo.', '.o.owwo.o.', '...oooo...', '...ow.wo..', '...ow.wo..', '...oo.oo..'],
  ['...oooo...', '..owwwwo..', '.owwwwwwo.', '.owewwewo.', '.owwwwwwo.', '..owddwo..', '...owwo...',
   '..oowwoo..', '.owowwowo.', '.o.owwo.o.', '...oooo...', '..ow..wo..', '..ow..wo..', '..oo..oo..'],
].map(r => makeSprite(r, { o: '#3a3040', w: '#ddd6c0', e: '#ff3c3c', d: '#8a8070' }));
SPR.boss = makeSprite([
  '....g...gg...g....', '....gg.gggg.gg....', '....gggrggrggg....', '...owwwwwwwwwwo...',
  '..owwwwwwwwwwwwo..', '..owweewwwweewwo..', '..owweewwwweewwo..', '..owwwwwwwwwwwwo..',
  '...owwwwoowwwwo...', '....owowowowo.....', '..ppppoowwoopppp..', '.pppppowwwwoppppp.',
  'ppPpppwwwwwwpppPpp', 'pPPpppowwwwopppPPp', 'pPppppowwwwoppppPp', 'opppppowwwwopppppo',
  '.opppppowwopppppo.', '..oppppppppppppo..', '..oPPPPPPPPPPPPo..', '...o..o....o..o...',
  '..oo..oo..oo..oo..'],
  { o: '#20142a', w: '#e4dcc4', e: '#ff3050', p: '#5e2c80', P: '#3a1850', g: '#ecba40', r: '#e02848' });
SPR.heart = makeSprite(['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#dc2838', w: '#ffc8c8' });
SPR.heartHalf = makeSprite(['.rr.ee.', 'rwrreee', 'rrrreee', '.rrree.', '..rre..', '...e...'], { r: '#dc2838', w: '#ffc8c8', e: '#3a2830' });
SPR.heartEmpty = makeSprite(['.ee.ee.', 'eeeeeee', 'eeeeeee', '.eeeee.', '..eee..', '...e...'], { e: '#3a2830' });
SPR.coin = makeSprite(['.ggg.', 'gwggG', 'ggGgG', 'ggggG', '.GGG.'], { g: '#ecba40', G: '#9c681e', w: '#fffad2' });
SPR.stairs = makeSprite(['oooooooooooooooo', 'oaaaaaaaaaaaaaao', 'obbbbbbbbbbbbbbo', 'o..aaaaaaaaaa..o',
  'o..bbbbbbbbbb..o', 'o....aaaaaa....o', 'o....bbbbbb....o', 'o......aa......o', 'o......bb......o', 'o..............o'],
  { o: '#1a1018', a: '#8a8098', b: '#4a4058' });
// big legendary sword (same art as the chest video)
SPR.dawn = makeSprite(['....w....', '...wlw...', '...wls...', '...wls...', '...wls...', '...wls...', '..wwlss..',
  ...Array(9).fill(['..wlls..', '..wlls..']).flat(), '..wlls..', '.gGGrGGg.', 'ggGGrGGgg', '.gGGGGGg.',
  '...hHh...', '...Hhh...', '...hHh...', '...Hhh...', '...hHh...', '...ggg...', '...grg...', '...ggg...'],
  { w: '#f5f8ff', l: '#b2c6ee', s: '#6e82ba', g: '#ecba40', G: '#9c681e', r: '#e6283c', h: '#6e3c22', H: '#462414' });

// ============================================================ item icons (8x8, tinted per item)
const ICON_ROWS = {
  sword: ['......oc', '.....oca', '....oca.', 'o..oca..', 'oo.ca...', '.obo....', 'obo.o...', 'oo......'],
  boots: ['..oooo..', '..oaao..', '..oaao..', '..oaco..', '.oaaaoo.', 'oaaaaaao', 'obbbbbbo', '.oooooo.'],
  food: ['........', '..oooo..', '.oaaaao.', 'oacaacao', 'oaaaaaao', 'obbbbbbo', '.oooooo.', '........'],
  amulet: ['.o....o.', '..o..o..', '...oo...', '..oaao..', '.oacaao.', '.oaaaao.', '..oaao..', '...oo...'],
  heart: ['.oo.oo..', 'oacoaao.', 'oaaaaao.', 'oaaaaao.', '.oaaao..', '..oao...', '...o....', '........'],
  dice: ['.oooooo.', 'oaaaaaao', 'oabaabao', 'oaaaaaao', 'oaaaaaao', 'oabaabao', 'oaaaaaao', '.oooooo.'],
  fang: ['........', '.oooooo.', 'obbbbbbo', 'oaobboao', 'oao..oao', '.oo..oo.', '........', '........'],
  armor: ['.oo..oo.', 'oaaooaao', 'oaaaaaao', '.oacaao.', '.oaaaao.', '.oaaaao.', '.obbbbo.', '..oooo..'],
  feather: ['......oo', '.....oao', '....oaco', '...oaco.', '..oaao..', '.oaao...', '.obo....', 'o.......'],
  hourglass: ['oooooooo', '.obbbbo.', '..oaao..', '...oo...', '...oo...', '..oaao..', '.oaaaao.', 'oooooooo'],
  gem: ['..oooo..', '.oacaao.', 'oaccaaao', 'oaaaaabo', '.oaaabo.', '..oabo..', '...oo...', '........'],
  axe: ['...oooo.', '..oacaao', '..oaaaao', '...obaoo', '..obo...', '.obo....', 'obo.....', 'oo......'],
  dagger: ['........', '.....oco', '....oca.', '...oca..', '.o.ca...', '..ob....', '.obo....', '.oo.....'],
  spear: ['.....ooo', '.....oco', '....oaao', '...ob.o.', '..ob....', '.ob.....', 'ob......', 'o.......'],
  staff: ['..oooo..', '.oacaao.', '.oaaaao.', '..oboo..', '...bo...', '...bo...', '...bo...', '...oo...'],
  bow: ['.oo.....', '.obo...a', '..obo..a', '...ob.ca', '...ob.ca', '..obo..a', '.obo...a', '.oo.....'],
  hammer: ['oooooooo', 'oaaccaao', 'oaaaaaao', 'oooboooo', '...bo...', '...bo...', '...bo...', '...oo...'],
  cloak: ['..oooo..', '.oaccao.', '.oaaaao.', 'oaaaaaao', 'oaaabaao', 'oaabbaao', 'oabbbbao', 'oooooooo'],
  whet: ['........', '........', '..oooooo', '.ocaaaao', 'oaaaaabo', 'obbbbbo.', 'oooooo..', '........'],
  clover: ['.oo.oo..', 'oaaoaao.', 'oacaaao.', '.oaaao..', 'oaaaaao.', 'oaaoaao.', '.oobboo.', '....bo..'],
  ring: ['...oo...', '..ocao..', '..oaao..', '.oo..oo.', 'ob....bo', 'ob....bo', '.ob..bo.', '..oooo..'],
  magnet: ['.oo..oo.', 'occoocco', 'oaaooaao', 'oaaooaao', 'oaaooaao', 'oaaaaaao', '.oaaaao.', '..oooo..'],
  flask: ['..oooo..', '..obbo..', '..ocao..', '.ocaaao.', 'oaaaaaao', 'oaaaaaao', '.oaaaao.', '..oooo..'],
  eye: ['........', '..oooo..', '.obbbbo.', 'obaccabo', 'obaooabo', '.obbbbo.', '..oooo..', '........'],
  orbit: ['...oo...', '..ocao..', '.o....o.', 'oa....co', 'oc....ao', '.o....o.', '..oaco..', '...oo...'],
  bolt: ['....ooo.', '...oaao.', '..oaao..', '.oaaaao.', '..oaao..', '.oaao...', '.oao....', '.oo.....'],
  skull: ['.oooooo.', 'oaaaaaao', 'obbaabbo', 'obbaabbo', 'oaaaaaao', '.oaaaao.', '.oaoaoo.', '..oooo..'],
  bomb: ['.....oc.', '....ob..', '..oooo..', '.oaaaao.', 'oacaaaao', 'oaaaaaao', '.oaaaao.', '..oooo..'],
  crown: ['o..o..o.', 'oaoaoao.', 'oaaaaao.', 'oacacao.', 'oaaaaao.', 'obbbbbo.', 'oooooo..', '........'],
  book: ['oooooooo', 'oaaaaabo', 'oacaaabo', 'oaacaabo', 'oaaaaabo', 'oaaaaabo', 'obbbbbbo', 'oooooooo'],
  coin: ['..oooo..', '.oaccaao', 'oacccaao', 'oaaccaao', 'oaaacaao', 'oaacaaao', '.obbbbo.', '..oooo..'],
};
// Talent symbols use silhouettes that describe their effects, even at 8x8.
Object.assign(ICON_ROWS, {
  tal_shield: ['.oooooo.', 'oaccaabo', 'oaacaabo', 'oaacaabo', '.oaabbo.', '.oabbo..', '..oao...', '...o....'],
  tal_thorns: ['a..aa..a', '.a.aa.a.', '..oooo..', 'aoaccboa', 'aoaaaboa', '..oooo..', '.a.aa.a.', 'a..aa..a'],
  tal_reach: ['......oc', '.....oca', 'c...oca.', '.c.oca..', '..oca..c', '.oao..c.', 'oboo.c..', 'oo......'],
  tal_crit: ['..aaaa..', '.a....ac', 'a.aaaoca', 'a.aocca.', 'a.aaca.a', 'a..a...a', '.a....a.', '..aaaa..'],
  tal_quake: ['.oooooo.', '.oaccaao', '.oaaabao', '..ooboo.', '....bo..', 'a..abo.a', '.acaa.a.', 'aa..abaa'],
  tal_drain: ['...a....', '..aca...', '.oacbo..', 'oaacbbo.', 'oaabbbo.', '.obboo.c', '..oo..cc', '.......c'],
  tal_rage: ['..a..a..', '.acaaca.', 'oaaaaaao', 'oocaaoco', 'oaaaaaao', '.oabbbo.', '..oaao..', '...oo...'],
  tal_dodge: ['..aaaa..', '.ac..ba.', 'ac....ba', 'a...cc.a', 'a...ca.a', 'ab.....a', '.ab..aaa', '..aa..a.'],
  tal_range: ['......a.', 'a.a..aca', 'aaaaaacc', 'a.a..aca', '......a.', '..a.a...', '.a.a....', '........'],
  tal_pierce: ['..bo.bo.', '..bo.boa', 'aaaaaacc', '..bo.boa', '..bo.bo.', '..bo.bo.', '..bo.bo.', '........'],
  tal_multishot: ['......ac', '.....ac.', '..a.ac..', 'aaa...ac', 'aaaaaacc', 'aaa...ac', '..a.ac..', '.....ac.'],
  tal_fire: ['....a...', '...ac...', '..acaa..', '.aacaba.', '.acaaabo', 'oacaabao', '.oaabbo.', '..oooo..'],
  tal_frost: ['a..aa..a', '.a.aa.a.', '..aaaa..', 'aaaccaaa', 'aaaccaaa', '..aaaa..', '.a.aa.a.', 'a..aa..a'],
  tal_poison: ['...a....', '..aca...', '.oaabo..', 'oaaaaabo', 'oaobaobo', 'oaabaabo', '.obbbbo.', '..oooo..'],
  tal_proc: ['...aa...', '..a..a..', '.a.cc.a.', 'a.cccc.a', 'a.bccb.a', '.a.bb.a.', '..a..a..', '...aa...'],
  tal_dot: ['..a..a..', '.aca.ac.', 'oaaboabo', 'oabboabo', '.oo..oo.', 'a..a..a.', '.a..a..a', '........'],
  tal_nova: ['a..cc..a', '.a.cc.a.', '..acca..', 'cccaaccc', 'cccaaccc', '..abba..', '.a.bb.a.', 'a..bb..a'],
  tal_heal: ['..oooo..', '..oaco..', 'oooacooo', 'oaacccao', 'oaaacabo', 'oooaaooo', '..obbo..', '..oooo..'],
  tal_regen: ['..aaa...', '.a...ac.', 'a.oo.ac.', 'aoccooac', 'aaccaaac', '.aaaaba.', '..abba..', '...ba...'],
  tal_smite: ['...cc...', '..cccc..', '...aa...', '.a.aa.a.', '.c.cc.c.', '.a.aa.a.', 'obobobob', 'oooooooo'],
  tal_spirit: ['..oooo..', '.ocaaao.', 'oaobaabo', 'oaobaabo', 'oaaaaabo', '.oaabao.', '..obbo..', '.o.o.o..'],
  tal_legion: ['..oooo..', '..ocao..', '.oaooao.', 'oo....oo', 'oco..oco', 'oao..oao', 'obo..obo', 'o.o..o.o'],
  tal_resonance: ['..a..a..', '.a.c..a.', 'a.c.c..a', 'a.c.bc.a', 'a.c.bc.a', 'a.c.c..a', '.a.c..a.', '..a..a..'],
  tal_inspiration: ['.aaaa.c.', '.acba.cc', '.ab.a.c.', '.ab.a...', '.ab.a...', 'cabaa...', 'oaaao...', '.ooo....'],
  // Each route capstone has its own compound symbol.
  tal_guardquake: ['.oooooo.', '.oaccaao', '.oaacbao', '..oaabo.', '..obbo..', 'a..ao..a', '.acaa.a.', 'aa..abaa'],
  tal_wave: ['......oc', '..c..oca', '.c..oca.', 'c..oca.c', '..oca.c.', '.oba.c..', 'obo.c...', 'oo.c....'],
  tal_bloodarmor: ['.oo..oo.', 'oaaooaao', 'ocaaabao', '.oaacbo.', '.ocabbo.', '.oababo.', '.obbbbo.', '..oooo..'],
  tal_rollvolley: ['..aaaa.c', '.a...aca', 'a..a.oa.', 'a..c....', 'a.oca..a', '.oao..ba', 'oba..aaa', 'oo....a.'],
  tal_homing: ['aaaa....', 'a..ba...', 'a...ba.a', 'a....acc', '.....a.a', '..a..a..', '.a.aa...', 'a.......'],
  tal_execution: ['.c....oc', 'ccc..oca', '.c..oca.', '...oca..', '.o.ca...', '..ob..a.', '.obo.aaa', '.oo...a.'],
  tal_elements: ['.a...a.a', 'aca...a.', 'aab.aaaa', 'abb...a.', '..cc.a..', '.cccc...', '..cc..a.', '.c..c..a'],
  tal_starorbit: ['c..aa..c', '.c....c.', 'a..cc..a', 'a.cccc.a', 'a..cc..a', 'a.bbbb.a', '.b....b.', 'c..bb..c'],
  tal_storm: ['.aaaaaa.', 'aaacabba', '...ca...', '..ca....', '.caaa...', '..ac..a.', '.a..a..a', 'aaaabaaa'],
  tal_sanctuary: ['...aa...', '..acca..', '.acccca.', 'a..cc..a', 'a.cccc.a', 'a..cc..a', 'a..aa..a', 'abbbbbaa'],
  tal_dawnshield: ['..c..c..', '.c.cc.c.', '..cccc..', 'oaaaaaao', 'oacccaao', '.oaacbo.', '..obbo..', '...oo...'],
  tal_seraph: ['a..cc..a', 'aa.cc.aa', 'aca..aca', 'aacaacaa', '.aaccaa.', '..acca..', '...aa...', '..abba..'],
  tal_chorus: ['..aaaa..', '.ac..ba.', 'ac.aa.ba', 'a..a.a.a', 'a..a.a.a', 'abcaac.a', '.abaaca.', '..aa..a.'],
  tal_muse: ['...cc...', '..cccc..', 'aaa.aaa.', 'abacaba.', 'abacaba.', '.baacba.', '..abba..', '...aa...'],
  tal_silence: ['c..cc..c', '.c.cc.c.', '..cccc..', 'cccaaccc', '..abba..', 'a..bb..a', 'a......a', 'abbbbbaa'],
  tal_soulguide: ['...oo...', '..o..o..', '.oooooo.', '.obccbo.', '.obcabo.', '.obabbo.', '.oooooo.', '..a..a..'],
  tal_commander: ['a..a..a.', 'aacacaa.', '.aaaaa..', '..oooo..', 'o.ocao.o', 'acoaaoac', 'aboaboab', 'o..oo..o'],
  tal_plague: ['a......a', 'aa.ca.aa', '.aaaaaa.', 'oacbacbo', 'oaobaobo', '.oabbbo.', '..oabo..', '...aa...'],
});
// ---------------------------------------------------------------- chapter 2 / 3 enemies & bosses
SPR.shroom = makeSprite(['...oooo...', '.oorrwroo.', 'orrwrrrrro', 'orrrrrwrro', 'oorrrrrroo', '.oooooooo.',
  '..oseeso..', '..osssso..', '..osssso..', '...oooo...'], { o: '#2a1418', r: '#b04ad0', w: '#f0e0f8', s: '#e8d8b8', e: '#20101a' });
const SPIDER_ROWS = [
  ['..o.....o..', '.o.ooooo.o.', 'o.obbbbbo.o', '.obebbbebo.', 'oobbbbbbboo', 'o.obbbbbo.o', '.o.ooooo.o.', '..o.....o..'],
  ['.o.......o.', '..ooooooo..', 'ooobbbbbooo', '.obebbbebo.', '.obbbbbbbo.', 'ooobbbbbooo', '..ooooooo..', '.o.......o.']];
SPR.spider = SPIDER_ROWS.map(r => makeSprite(r, { o: '#140a10', b: '#4a5a3a', e: '#ff4050' }));
SPR.queen = SPIDER_ROWS.map(r => makeSprite(r, { o: '#1a0a20', b: '#6a2a8a', e: '#ffd040' }));
const IMP_ROWS = ['o.......o', 'oo.....oo', '.orrrrro.', 'orryrryro', 'orrrrrrro', '.orrwwro.', '..orrro..'];
SPR.imp = [[...IMP_ROWS, '.oorrroo.', 'o.orrro.o', '..or.ro..', '..oo.oo..'],
  [...IMP_ROWS, 'o.orrro.o', '.oorrroo.', '..or.ro..', '.oo...oo.']]
  .map(r => makeSprite(r, { o: '#2a0a0a', r: '#d0402a', y: '#ffe060', w: '#ffd0a0' }));
const GOLEM_TOP = ['...oooooo...', '..oggggggo..', '..ogyggygo..', '..oggllggo..', '.oooggggooo.', 'ogggglggggo.',
  'oggglllgggo.', 'ogoggglggogo', 'ogoggggggogo', '.o.oggggo.o.'];
const GOLEM_ROWS = [[...GOLEM_TOP, '...og..go...', '..ogg..ggo..', '..ooo..ooo..'],
  [...GOLEM_TOP, '..og....go..', '.ogg....ggo.', '.ooo....ooo.']];
SPR.golem = GOLEM_ROWS.map(r => makeSprite(r, { o: '#1a1010', g: '#5a4a48', y: '#ffb020', l: '#ff6020' }));
SPR.colossus = GOLEM_ROWS.map(r => makeSprite(r, { o: '#1a0808', g: '#3a2a2a', y: '#ffe060', l: '#ff8a20' }));
SPR.firebat = [
  ['oo.........oo', 'owo..o.o..owo', 'owwooooooowwo', '.owwoeoeowwo.', '..ooooooooo..', '....o...o....'],
  ['.....o.o.....', '...ooooooo...', '.owwoeoeowwo.', 'owwwooooowwwo', 'oww.......wwo', 'oo.........oo'],
].map(r => makeSprite(r, { o: '#3a1008', w: '#d0602a', e: '#ffe060' }));
SPR.treant = makeSprite([
  '....oooo..oooo....', '..ooLllloollllLoo.', '.oLlllllllllllllLo', 'oLllLllllllllLllLo', 'oLLlllllllllllllLo',
  '.oLLLllllllllLLLo.', '..ooLLobbbbboLLoo.', '....oobbbbbbboo...', '....obeebbbeebo...', '....obeebbbeebo...',
  '....obbbbbbbbbo...', '....obbmmmmmbbo...', '....obbbmmmbbbo...', '...obbbbbbbbbbbo..', '..obbobbbbbbbobbo.',
  '.obbo.obbbbbo.obbo', '.obo..obbbbbo..obo', 'obo...obbbbbo...ob', 'oo...obbbobbbo...o', '....obbbo.obbbo...',
  '...obbbo...obbbo..', '...oooo.....oooo..'],
  { o: '#141a10', L: '#2a6a2a', l: '#4a9a3a', b: '#6a4a2a', e: '#ffe060', m: '#1a0a08' });
SPR.demon = makeSprite([
  '.o................o.', '.oo..............oo.', '..oo..oooooooo..oo..', '...ooorrrrrrrrooo...', '....orrrrrrrrrro....',
  '...orryyrrrryyrro...', '...orryyrrrryyrro...', '...orrrrrrrrrrrro...', '....orrwwwwwwrro....', '.....orrwwwwrro.....',
  '..ooooorrrrrrooooo..', '.oRRRRorrrrrroRRRRo.', 'oRRRRRorrrrrroRRRRRo', 'oRRoRRorrllrroRRoRRo', 'oRo.oRorrllrroRo.oRo',
  '.o..ooorrrrrrooo..o.', '......orrrrrro......', '......orrrrrro......', '.....orrro.orrro....', '.....orro...orro....',
  '....orrro...orrro...', '....ooooo...ooooo...'],
  { o: '#1a0808', r: '#a8281e', R: '#5a1410', y: '#ffe060', w: '#ffb050', l: '#ff7020' });
const ICON_CACHE = {};
function icon(kind, a, b, c) {
  const k = kind + a + b + c;
  return ICON_CACHE[k] || (ICON_CACHE[k] = makeSprite(ICON_ROWS[kind], { o: OUT, a, b, c }));
}
