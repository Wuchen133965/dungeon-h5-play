'use strict';
// Boss-only regalia. Each body keeps its original identity, with authored
// silhouettes, layered materials and four cached animation poses around it.
const BOSS_ART = {
  boss: ['king', '#956bc2', '#ffd58a', '#f3ecd0'],
  treant: ['tree', '#527d56', '#b6cb75', '#edd395'],
  demon: ['demon', '#993c4d', '#ff9862', '#ffe9ac'],
  troll: ['ice', '#668eac', '#a8e0ee', '#eefeff'],
  wolfKing: ['wolf', '#5d7596', '#b6dcf0', '#ffe2a1'],
  crystalHeart: ['crystal', '#695caa', '#8fcdf2', '#eeffff'],
  frostQueen: ['queen', '#6d76c1', '#b8e5f4', '#f8fcff'],
  toad: ['toad', '#53744d', '#a9c56e', '#f4dea3'],
  mycelia: ['mushroom', '#77558a', '#d49bc8', '#f7d8c1'],
  captain: ['captain', '#39666b', '#9dd9c7', '#eed390'],
  brood: ['brood', '#793b53', '#d07c8e', '#f3d6a0'],
  sandworm: ['worm', '#94704e', '#d6b47b', '#f5e4bf'],
  pharaoh: ['pharaoh', '#4b629a', '#dabc6e', '#fff0b8'],
  sunPriest: ['sun', '#984f3d', '#eab45a', '#fff0ac'],
  mirrorKnight: ['knight', '#7486a9', '#b8d6e8', '#eaffff'],
  eagle: ['eagle', '#7289a5', '#c3dce2', '#fff0b6'],
  titan: ['titan', '#5a7195', '#b1cadf', '#ffe6a2'],
  warden: ['clock', '#7f7055', '#d1b477', '#bff7ed'],
  observer: ['stars', '#62538b', '#ba9edd', '#edf4ff'],
  riftWalker: ['rift', '#65476e', '#b580b7', '#f0bfdf'],
  mazeLord: ['maze', '#56526e', '#a899bb', '#efb3d7'],
  fallen: ['fallen', '#655273', '#b899cc', '#f3c08b'],
  voidGod: ['void', '#503665', '#b77dc9', '#ffe0f5'],
};
const BOSS_SPRITE_CACHE = new WeakMap();
function bossSprite(source, kind, pose) {
  let variants = BOSS_SPRITE_CACHE.get(source);
  if (!variants) { variants = new Map(); BOSS_SPRITE_CACHE.set(source, variants); }
  const key = kind + ':' + pose;
  if (variants.has(key)) return variants.get(key);
  const [theme, main, trim, light] = BOSS_ART[kind];
  const c = document.createElement('canvas'); c.width = 48; c.height = 42;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const dark = '#252333', deep = '#151722', wave = [0, 1, 0, -1][pose], cx = 24;
  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const line = (x, y, ex, ey, col, width = 1) => {
    const n = Math.max(Math.abs(ex - x), Math.abs(ey - y), 1);
    for (let i = 0; i <= n; i++) rect(x + (ex - x) * i / n, y + (ey - y) * i / n, width, width, col);
  };
  const poly = (points, col) => {
    const lo = Math.floor(Math.min(...points.map(p => p[1]))), hi = Math.ceil(Math.max(...points.map(p => p[1])));
    for (let y = lo; y <= hi; y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) rect(Math.ceil(xs[i]), y, Math.floor(xs[i + 1]) - Math.ceil(xs[i]) + 1, 1, col);
    }
  };
  const gem = (x, y, r, col = trim) => {
    poly([[x,y-r],[x+r,y],[x,y+r+1],[x-r,y]], dark);
    poly([[x,y-r+1],[x+r-1,y],[x,y+r],[x-r+1,y]], col);
    line(x,y-r+1,x-1,y,light); line(x,y,x,y+r-1,main);
  };
  const fan = (x, y, r, count, start, span, col = trim) => {
    for (let i = 0; i < count; i++) {
      const a = start + i * span / Math.max(1, count - 1);
      const ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
      line(x, y, ex, ey, dark, 3); line(x, y, ex, ey, col); rect(ex, ey, 1, 1, light);
    }
  };
  const ring = (x, y, rx, ry, col, offset = 0) => {
    for (let i = 0; i < 90; i++) { const a = i * Math.PI * 2 / 90 + offset; rect(x + Math.cos(a) * rx, y + Math.sin(a) * ry, 1, 1, col); }
  };
  const banner = (x, y, side) => {
    line(x, y, x, 38, trim);
    poly([[x+side,y+2],[x+side*8,y+3],[x+side*(8+wave),y+21],[x+side*4,y+18],[x+side,y+20]], dark);
    poly([[x+side*2,y+3],[x+side*7,y+4],[x+side*(7+wave),y+18],[x+side*3,y+16]], main);
    gem(x+side*4,y+8,2); line(x+side*3,y+12,x+side*5,y+12,trim);
  };

  // Rear silhouettes: each theme has a different contour rather than a shared aura.
  switch (theme) {
    case 'king': banner(9,8,-1); banner(39,8,1); break;
    case 'tree':
      for (const s of [-1,1]) { line(24,33,24+s*13,12,main,3); line(24+s*8,20,24+s*17,18,trim,2);
        line(24+s*12,14,24+s*13,5,trim,2); line(24+s*10,17,24+s*5,8,main,2);
        for (let i=0;i<4;i++) { const x=24+s*(8+i*3); poly([[x-3,12-i+wave],[x,8-i+wave],[x+4,12-i+wave],[x,16-i+wave]],main); rect(x,10-i+wave,2,1,trim); }
        line(24,38,24+s*16,40,main,2); line(24+s*9,38,24+s*12,34,trim); } break;
    case 'demon': case 'eagle':
      for (const s of [-1,1]) {
        poly([[24+s*6,20],[24+s*15,10+wave],[24+s*22,7+wave],[24+s*20,24],[24+s*13,22],[24+s*8,30]],dark);
        poly([[24+s*8,20],[24+s*15,12+wave],[24+s*21,9+wave],[24+s*18,23],[24+s*12,21]],main);
        for (let i=0;i<4;i++) line(24+s*8,20,24+s*(20-i*2),12+i*4+wave,theme==='eagle'?light:trim);
      } break;
    case 'ice': case 'crystal': case 'queen':
      for (const s of [-1,1]) for (let i=0;i<3;i++) {
        const x=24+s*(8+i*5), y=12+i*5+(i%2?wave:0);
        poly([[x, y-7],[x+3,y+2],[x+1,33],[x-3,y+2]],dark);
        poly([[x,y-5],[x+2,y+2],[x,30],[x-2,y+2]],main); line(x,y-5,x,26,trim); rect(x,y-5,1,3,light);
      } break;
    case 'wolf':
      for (const s of [-1,1]) for (let i=0;i<5;i++) poly([[24+s*3,17+i*3],[24+s*(10+i),12+i*3+wave],[24+s*8,31]],i%2?trim:main);
      break;
    case 'toad':
      for (const s of [-1,1]) { poly([[24+s*7,23],[24+s*17,20],[24+s*21,31],[24+s*18,39],[24+s*8,38]],dark);
        poly([[24+s*8,25],[24+s*16,23],[24+s*18,31],[24+s*15,37],[24+s*9,36]],main);
        for(let i=0;i<4;i++) gem(24+s*(12+i%2*3),26+i*3,2,trim); } break;
    case 'mushroom':
      for (const s of [-1,1]) { line(24+s*12,20,24+s*10,36,trim,2);
        poly([[24+s*12,12+wave],[24+s*21,21],[24+s*3,21]],dark);
        poly([[24+s*12,14+wave],[24+s*19,20],[24+s*5,20]],main);
        for(let i=0;i<3;i++) rect(24+s*(8+i*3),18,2,1,light); } break;
    case 'captain': banner(8,12,-1); line(40,15,40,35,trim,2); ring(40,13,3,3,trim); line(35,31,40,37,trim,2); line(40,37,45,31,trim,2); break;
    case 'brood':
      for (const s of [-1,1]) for (let i=0;i<4;i++) { line(24+s*7,23+i*3,24+s*(16+i),15+i*5+wave,dark,3); line(24+s*7,23+i*3,24+s*(16+i),15+i*5+wave,trim); line(24+s*(16+i),15+i*5+wave,24+s*(20-i),23+i*5,main,2); } break;
    case 'worm':
      for(const s of [-1,1]) for(let i=0;i<4;i++) gem(24+s*(15-i),22+i*4,4,main); break;
    case 'pharaoh':
      for(const s of [-1,1]) { poly([[24+s*5,9],[24+s*15,13],[24+s*17,34],[24+s*8,29]],dark);
        for(let i=0;i<8;i++) line(24+s*7,12+i*2,24+s*(13+i/3),15+i*2,i%2?trim:main,2); }
      line(5,17,5,39,trim,2); line(5,17,9,14,trim,2); break;
    case 'sun': fan(24,19,19,13,Math.PI,Math.PI,trim); ring(24,19,14,14,main); break;
    case 'knight': case 'fallen':
      poly([[16,18],[32,18],[39+wave,38],[26,36],[11-wave,39]],dark);
      poly([[17,19],[31,19],[35+wave,36],[24,33],[14-wave,37]],main);
      line(7,10,7,36,light,2); line(3,28,11,28,trim,2);
      poly([[36,22],[43,24],[42,35],[37,38],[34,33]],dark); poly([[37,24],[41,25],[40,34],[37,35]],trim); break;
    case 'titan':
      for(const s of [-1,1]) { rect(24+s*16-4,17,9,14,dark); rect(24+s*16-3,18,7,10,main); rect(24+s*16-3,18,7,2,trim);
        line(24+s*16,8,24+s*16,17,trim,2); line(24+s*19,12,24+s*16,14,light); gem(24+s*16,23,3); } break;
    case 'clock':
      ring(24,20,18,18,dark); ring(24,20,16,16,trim);
      for(let i=0;i<12;i++) { const a=i*Math.PI/6; rect(23+Math.cos(a)*18,19+Math.sin(a)*18,3,3,main); }
      line(24,20,24+Math.cos(pose*Math.PI/2)*13,20+Math.sin(pose*Math.PI/2)*13,light);
      break;
    case 'stars': case 'void':
      ring(24,23,21,12,main); ring(24,23,17,17,trim);
      for(let i=0;i<6;i++) { const a=i*Math.PI/3+pose*0.13; gem(24+Math.cos(a)*19,23+Math.sin(a)*15,theme==='void'?3:2); }
      if(theme==='void') { ring(24,23,22,18,main); for(const s of [-1,1]) line(24+s*10,28,24+s*18,38+wave,trim); } break;
    case 'rift':
      for(const s of [-1,1]) { const x=24+s*17; poly([[x,7+wave],[x+s*3,18],[x,34],[x-s*4,26],[x-s*1,13]],dark); line(x,9+wave,x-s*2,21,light); line(x-s*2,21,x,32,trim); } break;
    case 'maze':
      for(const s of [-1,1]) { rect(24+s*16-4,9,8,26,dark); rect(24+s*16-3,10,6,24,main);
        for(let i=0;i<4;i++) { const y=12+i*5; line(24+s*16-2,y,24+s*16+2,y,trim); line(24+s*16+2,y,24+s*16+2,y+3,trim); } }
      break;
  }

  // Body remains centered above its original foot anchor. Major structures stay
  // around the upper body so ground telegraphs and exits remain legible.
  const scale = EDEF[kind].scale || 1;
  const h = Math.max(22, Math.min(29, Math.round(source.h * scale)));
  const w = Math.min(32, Math.round(source.w * h / source.h));
  const x0 = Math.round(cx-w/2), y0=41-h;
  ctx.drawImage(source.img,x0,y0,w,h);
  // Foreground fittings: crowns, ribbing, veins, fur collars and inset gems.
  switch(theme) {
    case 'king': case 'queen': case 'pharaoh': case 'fallen':
      for(let i=-2;i<=2;i++) { const y=y0-3-Math.abs(i)%2*2; line(24+i*3,y,24+i*3,y0+1,trim,2); rect(24+i*3,y,1,1,light); }
      line(17,y0+1,31,y0+1,trim,2); gem(24,y0+1,2);
      for(const s of [-1,1]) { gem(24+s*8,y0+12,3); line(24+s*6,y0+14,24+s*4,37,trim); }
      break;
    case 'tree': for(let i=0;i<5;i++) { line(20+i*2,29,19+i*2,37,trim); rect(20+i*2,30+i%3,1,2,dark); } gem(24,30,3); break;
    case 'demon':
      for(const s of [-1,1]) { line(24+s*7,y0+4,24+s*11,y0-3,trim,2); line(24+s*11,y0-3,24+s*10,y0-6,light); }
      for(let i=0;i<3;i++) { line(19,27+i*3,23,29+i*3,trim); line(25,29+i*3,29,27+i*3,trim); } gem(24,29,3); break;
    case 'ice': case 'titan': case 'maze':
      for(const s of [-1,1]) { rect(24+s*10-3,24,6,2,trim); rect(24+s*10-2,27,4,1,light); }
      gem(24,29,4); line(24,32,22,36,trim); break;
    case 'wolf':
      for(let i=0;i<5;i++) line(x0+6+i*2,y0+6,x0+4+i*2,y0+11,trim);
      gem(x0+9,y0+9,2); line(x0+w-5,y0+8,x0+w-5,y0+12,light); break;
    case 'crystal': for(const s of [-1,1]) gem(24+s*5,29,4); gem(24,23+wave,6); break;
    case 'toad':
      for(const s of [-1,1]) { gem(24+s*8,y0+5,3); for(let i=0;i<3;i++) rect(24+s*(5+i*3),33+i%2,2,1,trim); }
      line(18,35,30,35,light); break;
    case 'mushroom':
      poly([[24,y0-4],[37,y0+5],[11,y0+5]],dark); poly([[24,y0-3],[34,y0+4],[14,y0+4]],main);
      for(let i=0;i<5;i++) rect(17+i*3,y0+2+(i%2?-1:0),2,1,light);
      for(const s of [-1,1]) line(24+s*5,30,24+s*7,39,trim); break;
    case 'captain':
      poly([[12,y0+3],[15,y0-3],[24,y0],[33,y0-3],[36,y0+3]],dark);
      line(14,y0+2,34,y0+2,trim); gem(24,y0,2); line(20,29,27,34,trim); rect(21,33,6,2,trim); break;
    case 'brood': for(let i=0;i<3;i++) { gem(20,27+i*4,2); gem(28,27+i*4,2); } line(24,24,24,38,trim); break;
    case 'worm':
      ring(24,30,10,7,dark); for(let i=0;i<10;i++) { const a=i*Math.PI/5; line(24+Math.cos(a)*10,30+Math.sin(a)*7,24+Math.cos(a)*7,30+Math.sin(a)*4,light); } break;
    case 'sun': gem(24,y0,4); line(19,28,29,28,trim); line(24,28,24,38,trim); break;
    case 'knight':
      gem(24,y0+3,3); for(const s of [-1,1]) { line(24+s*4,29,24+s*7,27,light); line(24+s*5,31,24+s*8,35,trim); } break;
    case 'eagle':
      for(const s of [-1,1]) for(let i=0;i<4;i++) line(24+s*5,28,24+s*(8+i*2),27+i*2,trim);
      gem(24,y0+4,3); break;
    case 'clock': gem(24,35,3); line(24,23,24+wave*3,29,light); break;
    case 'stars': case 'void':
      ring(24,29,8,5,trim); gem(24+wave,29,3,light); if(theme==='void') { gem(14,26,2); gem(34,26,2); } break;
    case 'rift': gem(24,28,4); line(20,32,17,38+wave,trim); line(28,32,32,37-wave,trim); break;
  }
  const result = spriteFromCanvas(c); variants.set(key,result); return result;
}
for (const [kind] of Object.entries(BOSS_ART)) {
  const def = EDEF[kind], original = def.spr;
  // Art is baked in world-pixel size; collision/AI retain the entity's own scale.
  def.artScale = 1;
  def.spr = e => bossSprite(original(e),kind,Math.floor(e.anim * 3) % 4);
}
