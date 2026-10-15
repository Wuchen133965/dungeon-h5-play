'use strict';
// Town residents and their workstations. Sprites share the existing foot anchor.
// Silhouettes include the tools of each trade, so roles remain readable at 1x.
SPR.guild = makeSprite([
  '....oooo......',
  '...ohhhho.....',
  '..ohHhhhho....',
  '..ohsssSho....',
  '..oheseSho....',
  '...osssho.....',
  '...orrroo.....',
  '..orrRrrro....',
  '.orrryrRrro...',
  '.osrrYrRrsowwo',
  '.osrrbrRrowWwo',
  '..orrbrRrowWwo',
  '..orrbrRroowwo',
  '..orRrrRro....',
  '...oRRRRo.....',
  '...ob..bo.....',
  '...ob..bo.....',
  '..ooo..ooo....',
], { o: '#1a1018', h: '#824627', H: '#ba7642', s: '#e9bc93', S: '#c78763', e: '#281623',
  r: '#9e3c37', R: '#62282d', y: '#ffe39a', Y: '#c89a40', b: '#45302a', w: '#ead8a6', W: '#b59460' });

SPR.cook = makeSprite([
  '...ooooooo....',
  '..owwwWwwwwo..',
  '..owwwwwwwwo..',
  '...owwwWwwo...',
  '...ooooooo....',
  '...ossssso....',
  '...oseseso....',
  '...ossssso....',
  '..obwwwwwbo.g.',
  '.obwwwwwWwbogg',
  'osbbwwwwwbbsgo',
  'osobwwwwWbosgo',
  '..obbbbbbbo.go',
  '..obwwWwwbo.go',
  '...owwwWwo..g.',
  '...ooooooo..g.',
  '...ob..bo.....',
  '..ooo..ooo....',
], { o: '#1a1018', w: '#f4eee0', W: '#cfc4ac', s: '#e0ae7e', e: '#322018', b: '#987048', g: '#c9d5dc' });

SPR.quartermaster = makeSprite([
  '....oooo......',
  '...ommMMo.....',
  '..ommmmMMo....',
  '..omMmmmMo....',
  '..oossssoo....',
  '...oseseso....',
  '...ossssso....',
  '.ooammmmaoo...',
  'omMammmmamMo..',
  'osbammmmabso..',
  'oooobbbbbooo..',
  'obBbobgbbosyo.',
  'obBbommmmo.yo.',
  'obBbobbbbo.yy.',
  'oooooddddo....',
  '....od.do.....',
  '....ob.bo.....',
  '...ooo.ooo....',
], { o: '#1a1018', m: '#667e98', M: '#a1b7c6', a: '#364b64', s: '#cfa17b', e: '#292126',
  b: '#634532', B: '#987452', g: '#c9b276', y: '#e6c371', d: '#3f4c60' });

SPR.archivist = makeSprite([
  '....ooooo.....',
  '...ohhhhho....',
  '...oHhhhho....',
  '...ohsssso....',
  '...oeseseo....',
  '...oyoyoyo....',
  '...ossssso....',
  '...opPPpo.....',
  '..opppPppo....',
  '..oppypPpoooo.',
  '.opppypposgggo',
  '.ospPyppogwwgo',
  '..oppypPogwwgo',
  '..oppppPoggggo',
  '..opPppPpoooo.',
  '.opppppPPpo...',
  '.oooooooooo...',
  '..ooo..ooo....',
], { o: '#1a1018', h: '#363048', H: '#66546d', s: '#e7bca0', e: '#292132', y: '#dfbc6c',
  p: '#7963a2', P: '#473657', g: '#37665f', w: '#ebd6a4' });

SPR.board = makeSprite([
  '...oooooooooooo...',
  '..obbbbbbbbbbbbo..',
  '.obBBBBBBBBBBBBbo.',
  '.obBywwyBywwyBBbo.',
  '.obBwwwwBwwwWBBbo.',
  '.obBwWWwBwWWwBBbo.',
  '.obBwwwwBwwwwBBbo.',
  '.obBBBBBBBBBBBBbo.',
  '.obBywwwwyBBBBBbo.',
  '.obBwwwwwwBywwBbo.',
  '.obBwwWWwwBwwwBbo.',
  '.obBwwwwwwBwwWBbo.',
  '.obBBBBBBBBBBBBbo.',
  '..obbbbbbbbbbbbo..',
  '...oo........oo...',
  '...bb........bb...',
  '...bb........bb...',
  '..oooo......oooo..',
], { o: '#241a1c', b: '#67472e', B: '#956941', w: '#decca0', W: '#967c52', y: '#dbad48' });

SPR.cookpot = makeSprite([
  '.....v...v......',
  '....v...v.......',
  '.....v...v......',
  '....oooooooo....',
  '...ommMmmmMmo...',
  '..oomggggggmoo..',
  '.omommmmmmmmomo.',
  '..oomMMmmmmmoo..',
  '...omMmmmmmo....',
  '....oooooo......',
  '...bbffffbb.....',
  '..bBfyffyfbB....',
  '...bbyyybbb.....',
  '..oooo..oooo....',
], { o: '#1a1018', m: '#3f454f', M: '#8a97a0', g: '#88935a', v: '#bdc4af', b: '#64482c',
  B: '#987049', f: '#cb6530', y: '#ffc165' });

SPR.weaponrack = makeSprite([
  '....m......m......',
  '....M.....mMm.....',
  '..oomoooooomoooo..',
  '..obmbbbbbbmbbbo..',
  '..obMBBBBBBMBBbo..',
  '..obmBBaaBBmBBbo..',
  '..obmBaAaaBmBBbo..',
  '..obmBaAaaBmBBbo..',
  '..obmBBaaBBmBBbo..',
  '..obmBBBBBBmBBbo..',
  '..obmBBooBBmBBbo..',
  '..obyyoggoyyBBbo..',
  '..obmboggobmBBbo..',
  '..obbbbbbbbbbbbo..',
  '...oo........oo...',
  '...bb........bb...',
  '...bb........bb...',
  '..oooo......oooo..',
], { o: '#1a1018', b: '#634532', B: '#8d6845', m: '#a1b5c3', M: '#d5e3e7', a: '#566b83',
  A: '#819eb4', y: '#d6b15c', g: '#886748' });

SPR.bookstand = makeSprite([
  '...oooooooo...',
  '..oggggggggo..',
  '.ogwwwowwwggo.',
  '.ogwWwowWwggo.',
  '.ogwwwowwwggo.',
  '.ogwWwowWwggo.',
  '.ogwwwowwwggo.',
  '.oygggoggggyo.',
  '..obbbbbbbbo..',
  '...obbbbbo....',
  '.....bb.......',
  '.....bb.......',
  '....obbo......',
  '...obbbbo.....',
  '..obbbbbbbo...',
  '..ooooooooo...',
], { o: '#241a1c', b: '#704a30', g: '#50776c', w: '#ead7a4', W: '#a18758', y: '#dfbf69' });

// A travelling drillmaster: cropped hair, a teal tabard, bracers and a crystal weight.
SPR.trainer = makeSprite([
  '....oooo......', '...ohhhhho....', '...ohHHhho....', '...ossssso....',
  '...oseseso....', '...ossssso....', '..oabbbbaoo...', '.oaaTTTTaAao..',
  'osaaTtTTaaaso.', 'osbbTtTTbbsCo.', '.oobTTTTboCCo.', '..oTbbbbToCCo.',
  '..oTtTTTToo...', '..oTTTTTTo....', '...od..do.....', '...ob..bo.....',
  '...ob..bo.....', '..ooo..ooo....',
], { o: '#1a1018', h: '#504335', H: '#a09174', s: '#ddb18b', e: '#292018',
  a: '#4b665d', A: '#8aa98a', T: '#367767', t: '#245547', b: '#76553c', d: '#42534c', C: '#94e2d9' });

// The tempering specialist carries long tongs rather than the smith's broad hammer.
SPR.refiner = makeSprite([
  '....oooo......', '...ohhhhho....', '..ohhHHhho....', '..ohsssshho...',
  '...oseseso....', '...owwwwwo....', '...owWWwwo....', '..ommRRmmoo...',
  '.omMMrRMMmmo..', '.osmarRmaso.t.', '.osmaRRmaso.t.', '..ombyybmo..t.',
  '..omRRrRmo.tT.', '..omRrrRmo.tT.', '...obbbbo...t.', '...ob..bo...t.',
  '...ob..bo.....', '..ooo..ooo....',
], { o: '#1a1018', h: '#4b3b36', H: '#8e7c67', s: '#cda37b', e: '#302119',
  w: '#dccdb7', W: '#aa947e', m: '#666e78', M: '#a3aeb4', R: '#805535', r: '#b37c48',
  a: '#463e36', b: '#3b302b', y: '#e2bd7c', t: '#7395a2', T: '#bcd7d9' });

// Silver designs are drafted by a goggled engineer with a luminous component case.
SPR.artificer = makeSprite([
  '....oooo......', '...ohhhhho....', '..ohHHhhho....', '..ohyyyyho....',
  '..osbggbso....', '..ossssso.....', '...obBBbo.....', '..obccCCbo....',
  '.obcccCcbbo...', '.oscbbCcsoooo.', '.oscbyCcboggo.', '..occyCcogGgo.',
  '..occCCcogGgo.', '..obbbbbbgggo.', '..occCCcoooo..', '...od..do.....',
  '...ob..bo.....', '..ooo..ooo....',
], { o: '#1a1018', h: '#3e5470', H: '#7295af', s: '#ebc49d', y: '#dabb6d',
  b: '#6f573e', B: '#9b7850', c: '#457d8e', C: '#9dc8d3', g: '#60bccd', G: '#d5f5ea', d: '#354958' });

SPR.designbench = makeSprite([
  '..oooooooooooooooo..', '.obbbbbbbbbbbbbbbbo.', '.obgggggwwwwwwbbbbo.',
  '.obgGgggwWwWwwbCCbo.', '.obggGggwwWwwwbCCbo.', '.obgggggwwwwwwbbbbo.',
  '.obbbbbbbbbbbbbbbbo.', '..oooooooooooooooo..', '...bb........bb.....',
  '...bB........bB.....', '...bb........bb.....', '..oooo......oooo....',
], { o: '#241a1c', b: '#5e4838', B: '#98794d', g: '#325d6a', G: '#74c7d2', w: '#cbdcd5', W: '#7aa0a1', C: '#8de5ed' });
SPR.refinebench = makeSprite([
  '......m...m........', '..ooooMoooMoooo...', '.obbbbmbbbbmbbbo..', '.obbbbmBBbbmbbbo..',
  '.obggggbbbbbbbo...', '.obgGGgbbbYYbbo...', '.obggggbbbYYbbo...', '.obbbbbbbbbbbbo...',
  '..oooooooooooo....', '...bb......bb.....', '...bb......bb.....', '..oooo....oooo....',
], { o: '#241a1c', b: '#704b32', B: '#a27742', m: '#82949e', M: '#cad6d6', g: '#526371', G: '#c4e2e0', Y: '#e2bd7c' });
