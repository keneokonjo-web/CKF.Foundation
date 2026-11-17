// Generates logo marks, wordmarks (text converted to outlines), lock-ups and icons.
// Run:  NODE_PATH=<dir with opentype.js, @fontsource/*> node scripts/build-brand.cjs
const fs = require('fs'), path = require('path'), opentype = require('opentype.js');
const root = path.join(__dirname, '..'), out = path.join(root, 'assets/brand');
const FS = require.resolve('@fontsource/inter/package.json').replace(/inter\/package.json$/, '');
fs.mkdirSync(out, { recursive: true });
const birdD = fs.readFileSync(path.join(__dirname, 'bird-path.txt'), 'utf8').trim();
const BIRD_VB = '194 194 1536 1612';

// ---------- marks ----------
const birdMark = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BIRD_VB}"><path fill="${c}" d="${birdD}"/></svg>`;
// Pillars mark: an arch (doorway of opportunity) with three rising pillars = Education, Health, Opportunity.
const PILLARS_INNER = (c) => `<path d="M16 112V54a44 44 0 0 1 88 0v58" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><rect x="34" y="78" width="14" height="34" rx="2" fill="${c}"/><rect x="53" y="60" width="14" height="52" rx="2" fill="${c}"/><rect x="72" y="40" width="14" height="72" rx="2" fill="${c}"/>`;
const pillarsMark = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 6 104 112">${PILLARS_INNER(c)}</svg>`;
const w = (n, s) => fs.writeFileSync(path.join(out, n), s);
const INK = '#111111', WHITE = '#FFFFFF';
for (const [nm, f] of [['bird', birdMark], ['pillars', pillarsMark]]) {
  w(`mark-${nm}-ink.svg`, f(INK)); w(`mark-${nm}-white.svg`, f(WHITE));
}
// App / favicon icons
const icon = (bg, fg, inner, vb) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="26" fill="${bg}"/>${inner(fg)}</svg>`;
const birdIn = (fg) => `<svg x="24" y="26" width="72" height="68" viewBox="${BIRD_VB}" preserveAspectRatio="xMidYMid meet"><path fill="${fg}" d="${birdD}"/></svg>`;
const pilIn = (fg) => `<g transform="translate(24 22) scale(.72)">${PILLARS_INNER(fg).replace(/viewBox/g,'')}</g>`;
w('icon-bird-ink.svg', icon('#111111', '#FFFFFF', birdIn)); w('icon-bird-light.svg', icon('#F3F1EA', '#111111', birdIn));
w('icon-pillars-green.svg', icon('#0F4146', '#AFFFB9', pilIn)); w('icon-pillars-light.svg', icon('#F3F1EA', '#111111', pilIn));
w('favicon.svg', icon('#0F4146', '#AFFFB9', birdIn));
const circ = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="${bg}"/>${birdIn(fg)}</svg>`;
w('icon-bird-round-ink.svg', circ('#111111', '#FFFFFF')); w('icon-bird-round-light.svg', circ('#F3F1EA', '#111111'));

// ---------- wordmarks ----------
const fontFile = (pkg, weight, style = 'normal') => (b => opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)))(fs.readFileSync(path.join(FS, pkg, 'files', `${pkg}-latin-${weight}-${style}.woff`)));
function run(font, text, size, tracking = 0) { // returns {d: svg markup of glyph paths, width}
  let x = 0, d = '';
  const glyphs = [...text].map(ch => font.charToGlyph(ch));
  glyphs.forEach((g, i) => {
    const gd = g.getPath(0, 0, size).toPathData({ decimalPlaces: 2, flipY: false });
    if (gd) d += `<path transform="translate(${x.toFixed(2)} 0)" d="${gd}"/>`;
    x += g.advanceWidth * size / font.unitsPerEm + tracking * size;
    if (i < glyphs.length - 1) x += (Number(font.getKerningValue(g, glyphs[i + 1])) || 0) * size / font.unitsPerEm;
  });
  return { d, width: x - tracking * size };
}
const ASC = (font, size) => font.ascender * size / font.unitsPerEm;
const WM = {
  canopy:   { label: 'Canopy (Hanken Grotesk)', big: ['hanken-grotesk', 500], small: ['hanken-grotesk', 500], bigText: 'CKF', smallText: 'FOUNDATION', bigTrack: 0.02, smallTrack: 0.34, bigCase: 'CKF' },
  roots:    { label: 'Roots (Cormorant Garamond)', big: ['cormorant-garamond', 600], small: ['cormorant-garamond', 600], bigText: 'CKF', smallText: 'FOUNDATION', bigTrack: 0.06, smallTrack: 0.42 },
  clearing: { label: 'Clearing (EB Garamond)', big: ['eb-garamond', 500], small: ['eb-garamond', 500], bigText: 'CKF', smallText: 'FOUNDATION', bigTrack: 0.04, smallTrack: 0.3 },
  momentum: { label: 'Momentum (Anton)', big: ['anton', 400], small: ['archivo', 800], bigText: 'CKF', smallText: 'FOUNDATION', bigTrack: 0.02, smallTrack: 0.28 },
};
const built = {};
function wordmark(key, color) { // stacked: CKF on top (big), FOUNDATION below spanning same width
  const s = WM[key], fb = fontFile(...s.big), fs_ = fontFile(...s.small);
  const B = run(fb, s.bigText, 100, s.bigTrack);
  const capH = (fb.tables.os2.sCapHeight || fb.ascender * .7) * 100 / fb.unitsPerEm;
  // size small text so its width equals big width
  let sz = 20, S = run(fs_, s.smallText, sz, s.smallTrack); sz = sz * B.width / S.width; S = run(fs_, s.smallText, sz, s.smallTrack);
  const scap = (fs_.tables.os2.sCapHeight || fs_.ascender * .7) * sz / fs_.unitsPerEm;
  const gap = capH * 0.28, H = capH + gap + scap;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${B.width.toFixed(1)} ${H.toFixed(1)}"><g fill="${color}" transform="translate(0 ${capH.toFixed(2)})">${B.d}</g><g fill="${color}" transform="translate(0 ${H.toFixed(2)})">${S.d}</g></svg>`;
  return { svg, w: B.width, h: H };
}
function fullName(key, color) {
  const f = key === 'roots' ? fontFile('cormorant-garamond', 600) : fontFile('hanken-grotesk', 500);
  const lines = ['The Obi (Prof.) Chukuka Okonjo', 'and Prof. Kamene Okonjo', 'Foundation'];
  const size = 60, lh = size * 1.2; let maxW = 0, body = '';
  lines.forEach((t, i) => { const r = run(f, t, size, 0); maxW = Math.max(maxW, r.width); body += `<g fill="${color}" transform="translate(0 ${(size + i * lh).toFixed(1)})">${r.d}</g>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 ${maxW.toFixed(1)} ${(size + 2 * lh + 18).toFixed(1)}">${body}</svg>`;
}
for (const key of Object.keys(WM)) {
  for (const [cn, col] of [['ink', INK], ['white', WHITE]]) {
    const wm = wordmark(key, col); w(`wordmark-${key}-${cn}.svg`, wm.svg);
    // horizontal lock-ups with each mark
    for (const mk of ['bird', 'pillars']) {
      const H = 100, markW = mk === 'bird' ? H * 1536 / 1612 : H * 104 / 112;
      const sc = H / wm.h * 0.9; // wordmark height ~ 90% of mark
      const wmW = wm.w * sc, wmH = wm.h * sc, gap = 34;
      const markInner = mk === 'bird'
        ? `<svg x="0" y="0" width="${markW.toFixed(1)}" height="${H}" viewBox="${BIRD_VB}"><path fill="${col}" d="${birdD}"/></svg>`
        : `<svg x="0" y="0" width="${markW.toFixed(1)}" height="${H}" viewBox="8 6 104 112">${PILLARS_INNER(col)}</svg>`;
      const inner = wm.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      w(`lockup-${mk}-${key}-${cn}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${(markW + gap + wmW).toFixed(1)} ${H}">${markInner}<g transform="translate(${(markW + gap).toFixed(1)} ${((H - wmH) / 2).toFixed(1)}) scale(${sc.toFixed(4)})">${inner}</g></svg>`);
    }
  }
}
for (const k of ['canopy', 'roots']) { w(`fullname-${k}-ink.svg`, fullName(k, INK)); w(`fullname-${k}-white.svg`, fullName(k, WHITE)); }
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(fs.readdirSync(out).filter(f => f.endsWith('.svg')).sort(), null, 1));
console.log(fs.readdirSync(out).length, 'files');
