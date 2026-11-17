// Builds the CKF brand pack (bird logo only) into brand-pack/CKF-Brand-Pack and copies site icons into public/assets.
// Needs: opentype.js, @fontsource/hanken-grotesk, @fontsource/cormorant-garamond, playwright (+ ImageMagick `convert` for .ico).
// Run:  NODE_PATH=<node_modules> node scripts/build-brand-pack.cjs
const fs = require('fs'), path = require('path'), cp = require('child_process'), opentype = require('opentype.js');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PACK = path.join(ROOT, 'brand-pack/CKF-Brand-Pack'), PUB = path.join(ROOT, 'public/assets');
const FS = path.dirname(require.resolve('@fontsource/inter/package.json')).replace(/inter$/, '');
const birdD = fs.readFileSync(path.join(__dirname, 'bird-path.txt'), 'utf8').trim();
const VB = '194 194 1536 1612', BW = 1536, BH = 1612;
const C = { forest: '#2F4B2A', deep: '#1B2E19', sage: '#BDD5AE', leaf: '#6E9A58', mint: '#CFE6BE', paper: '#F3F1F1', ink: '#1B1C1A', white: '#FFFFFF' };
const mkdir = p => fs.mkdirSync(p, { recursive: true });
['logo/svg', 'logo/png', 'icons', 'social', 'colors', 'fonts'].forEach(d => mkdir(path.join(PACK, d)));
mkdir(path.join(PUB, 'brand'));
const W = (rel, s) => fs.writeFileSync(path.join(PACK, rel), s);

// ---------- text -> outlines ----------
const font = (pkg, wt, st = 'normal') => { const b = fs.readFileSync(path.join(FS, pkg, 'files', `${pkg}-latin-${wt}-${st}.woff`)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
function run(f, text, size, track = 0) {
  let x = 0, d = ''; const gl = [...text].map(c => f.charToGlyph(c));
  gl.forEach((g, i) => { const gd = g.getPath(0, 0, size).toPathData({ decimalPlaces: 2, flipY: false }); if (gd) d += `<path transform="translate(${x.toFixed(2)} 0)" d="${gd}"/>`; x += g.advanceWidth * size / f.unitsPerEm + track * size; if (i < gl.length - 1) x += (Number(f.getKerningValue(g, gl[i + 1])) || 0) * size / f.unitsPerEm; });
  return { d, w: x - track * size };
}
const H6 = font('hanken-grotesk', 600), H5 = font('hanken-grotesk', 500), CG = font('cormorant-garamond', 600);
const cap = (f, s) => (f.tables.os2.sCapHeight || f.ascender * 0.7) * s / f.unitsPerEm;

// ---------- logo builders (colour = fill) ----------
const bird = (c, x = 0, y = 0, h = 100) => { const w = h * BW / BH; return `<svg x="${x}" y="${y}" width="${w.toFixed(2)}" height="${h}" viewBox="${VB}"><path fill="${c}" d="${birdD}"/></svg>`; };
function wordBlock(c) { // CKF over FOUNDATION, left aligned; returns {g,w,h}
  const a = run(H6, 'CKF', 100, 0.2), b = run(H5, 'FOUNDATION', 100, 0.34), ca = cap(H6, 100), cb = cap(H5, 100);
  const sa = 36 / ca, sb = (36 * 0.46) / cb; // CKF cap = 36, FOUNDATION cap = 16.6
  const h = 36 + 14 + 16.6;
  return { w: Math.max(a.w * sa, b.w * sb), h, g: `<g fill="${c}"><g transform="translate(0 36) scale(${sa.toFixed(4)})">${a.d}</g><g transform="translate(0 ${h.toFixed(2)}) scale(${sb.toFixed(4)})">${b.d}</g></g>` };
}
function horizontal(c) { const wb = wordBlock(c), mh = 100, mw = mh * BW / BH, gap = 28; const tw = mw + gap + wb.w; return { w: tw, h: mh, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tw.toFixed(1)} ${mh}">${bird(c, 0, 0, mh)}<g transform="translate(${(mw + gap).toFixed(1)} ${((mh - wb.h) / 2).toFixed(1)})">${wb.g}</g></svg>` }; }
function stacked(c) { const wb = wordBlock(c), mh = 100, mw = mh * BW / BH, gap = 26, tw = Math.max(wb.w, mw), th = mh + gap + wb.h; return { w: tw, h: th, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tw.toFixed(1)} ${th.toFixed(1)}">${bird(c, (tw - mw) / 2, 0, mh)}<g transform="translate(${((tw - wb.w) / 2).toFixed(1)} ${mh + gap})">${wb.g}</g></svg>` }; }
function fullname(c) {
  const lines = ['The Obi (Prof.) Chukuka Okonjo', 'and Prof. Kamene Okonjo', 'Foundation'], size = 30, lh = 38, rs = lines.map(t => run(CG, t, size, 0.005)), tw = Math.max(...rs.map(r => r.w));
  const mh = 110, mw = mh * BW / BH, gap = 26, th = lh * 2 + size * 0.8, total = mw + gap + tw;
  const body = rs.map((r, i) => `<g transform="translate(${(mw + gap).toFixed(1)} ${(mh / 2 - th / 2 + size * 0.8 + i * lh).toFixed(1)})" fill="${c}">${r.d}</g>`).join('');
  return { w: total, h: mh, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total.toFixed(1)} ${mh}">${bird(c, 0, 0, mh)}${body}</svg>` };
}
const mark = c => ({ w: BW / BH * 100, h: 100, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}"><path fill="${c}" d="${birdD}"/></svg>`, vb: [BW, BH] });
const sets = { forest: C.forest, white: C.white, black: C.ink, sage: C.sage };
const logos = []; // [filename, svg, w, h, background-for-preview]
for (const [n, c] of Object.entries(sets)) {
  const m = mark(c), h = horizontal(c), s = stacked(c), f = fullname(c);
  logos.push([`ckf-mark-${n}`, m.svg, BW, BH, n], [`ckf-horizontal-${n}`, h.svg, h.w * 10, h.h * 10, n], [`ckf-stacked-${n}`, s.svg, s.w * 10, s.h * 10, n], [`ckf-fullname-${n}`, f.svg, f.w * 10, f.h * 10, n]);
}
logos.forEach(([n, svg]) => W(`logo/svg/${n}.svg`, svg));

// ---------- icons & social (SVG source, rendered to PNG/JPG below) ----------
const squareIcon = (bg, fg, rx = 0, pad = 0.2) => { const s = 512, bh = s * (1 - 2 * pad), bw = bh * BW / BH; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}"><rect width="${s}" height="${s}" rx="${rx}" fill="${bg}"/>${bird(fg, (s - bw) / 2, (s - bh) / 2, bh)}</svg>`; };
const roundIcon = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="${bg}"/>${bird(fg, 256 - 140 * BW / BH, 256 - 140, 280)}</svg>`;
const icons = { 'favicon': squareIcon(C.forest, C.sage, 112), 'icon-forest': squareIcon(C.forest, C.sage), 'icon-light': squareIcon(C.paper, C.forest), 'icon-sage': squareIcon(C.sage, C.deep), 'avatar-round-forest': roundIcon(C.forest, C.sage), 'avatar-round-light': roundIcon(C.paper, C.forest) };
W('icons/favicon.svg', icons.favicon);
const banner = (w, h, withTag = true) => { const wb = wordBlock(C.mint), t = run(H5, 'Education. Health. Opportunity.', 100, 0), bh = h * 0.34, bw = bh * BW / BH, tx = w * 0.36; const tsz = Math.min(h * 0.12, w * 0.05); const k = tsz / 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="g" cx="85%" cy="30%" r="110%"><stop offset="0" stop-color="#43693A"/><stop offset=".5" stop-color="${C.forest}"/><stop offset="1" stop-color="${C.deep}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><g opacity=".1">${bird(C.mint, w * 0.62, h * -0.05, h * 1.1)}</g>${bird(C.mint, w * 0.07, h / 2 - bh / 2, bh)}<g transform="translate(${(w * 0.07 + bw + h * 0.08).toFixed(1)} ${(h / 2 - wb.h * (bh / 100) / 2).toFixed(1)}) scale(${(bh / 100).toFixed(4)})">${wb.g}</g>${withTag ? `<g transform="translate(${(w * 0.07).toFixed(1)} ${(h * 0.86).toFixed(1)}) scale(${k.toFixed(4)})" fill="${C.mint}" opacity=".9">${t.d}</g>` : ''}</svg>`; };
const social = { 'og-image-1200x630': [1200, 630, banner(1200, 630)], 'x-header-1500x500': [1500, 500, banner(1500, 500)], 'linkedin-banner-1584x396': [1584, 396, banner(1584, 396, false)], 'facebook-cover-1640x624': [1640, 624, banner(1640, 624)] };

// ---------- guidelines page (HTML -> PDF) ----------
const b64 = f => fs.readFileSync(f).toString('base64');
const ffs = [['Hanken Grotesk', 300, 'hanken-grotesk'], ['Hanken Grotesk', 400, 'hanken-grotesk'], ['Hanken Grotesk', 500, 'hanken-grotesk'], ['Hanken Grotesk', 600, 'hanken-grotesk'], ['Cormorant Garamond', 500, 'cormorant-garamond'], ['Cormorant Garamond', 600, 'cormorant-garamond']].map(([fam, w, p]) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${b64(path.join(FS, p, 'files', `${p}-latin-${w}-normal.woff2`))}) format('woff2')}`).join('');
const inl = n => fs.readFileSync(path.join(PACK, 'logo/svg', n + '.svg'), 'utf8').replace('<svg ', '<svg style="width:100%;height:100%" ');
const sw = [['Forest', C.forest, 'Primary. Headlines, buttons, logo on light.', '47 / 75 / 42', '38 / 0 / 44 / 71'], ['Deep forest', C.deep, 'Dark sections, footer, logo background.', '27 / 46 / 25', '41 / 0 / 46 / 82'], ['Sage', C.sage, 'Accent on dark, soft tiles.', '189 / 213 / 174', '11 / 0 / 18 / 16'], ['Leaf', C.leaf, 'Small accents, rules, map highlights.', '110 / 154 / 88', '29 / 0 / 43 / 40'], ['Mint', C.mint, 'Large headline colour on forest.', '207 / 230 / 190', '10 / 0 / 17 / 10'], ['Paper', C.paper, 'Page background.', '243 / 241 / 241', '0 / 1 / 1 / 5'], ['Ink', C.ink, 'Body text.', '27 / 28 / 26', '4 / 0 / 7 / 89']];
const guide = `<!doctype html><html><head><meta charset="utf-8"><style>${ffs}
@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;font:400 11pt/1.55 'Hanken Grotesk';color:${C.ink}}
.pg{width:297mm;height:210mm;padding:18mm 20mm;position:relative;page-break-after:always;overflow:hidden;background:${C.paper}}
.pg.dk{background:${C.deep};color:${C.mint}}.pg.fo{background:${C.forest};color:#EAF3E2}
h1{font-weight:300;font-size:46pt;line-height:1;letter-spacing:-.03em;margin:0 0 6mm}h2{font-family:'Cormorant Garamond';font-weight:600;text-transform:uppercase;font-size:28pt;line-height:1;margin:0 0 6mm;color:${C.forest}}.dk h2,.fo h2{color:${C.sage}}
h3{font-size:9pt;letter-spacing:.18em;text-transform:uppercase;font-weight:500;margin:0 0 3mm;color:${C.leaf}}
p{margin:0 0 3mm;max-width:120mm}.f{position:absolute;left:20mm;right:20mm;bottom:10mm;font-size:8pt;opacity:.6;display:flex;justify-content:space-between}
.g{display:grid;gap:8mm}.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}
.box{border-radius:2mm;padding:8mm;display:flex;align-items:center;justify-content:center;height:46mm}.box svg{max-height:100%;max-width:100%}
.sw{border-radius:2mm;overflow:hidden;border:.2mm solid #d6d3d0;background:#fff}.sw i{display:block;height:24mm}.sw div{padding:3mm 4mm;font-size:8.5pt;line-height:1.4}.sw b{font-size:10pt}
.sp{font-size:30pt;line-height:1.05;margin:2mm 0}.no{position:relative}.no::after{content:"✕";position:absolute;right:3mm;top:2mm;color:#a3321c;font-size:12pt}
ul{padding-left:5mm;margin:0 0 3mm}li{margin-bottom:1.5mm}</style></head><body>
<div class="pg fo"><div style="position:absolute;right:-30mm;top:-10mm;width:200mm;height:210mm;opacity:.1;color:${C.mint}">${inl('ckf-mark-white')}</div>
<div style="width:70mm;height:30mm">${inl('ckf-horizontal-white')}</div><h1 style="margin-top:62mm;color:${C.mint}">Brand<br>guidelines</h1><p>The Obi (Prof.) Chukuka Okonjo and Prof. Kamene Okonjo Foundation (CKF)<br>Education. Health. Opportunity. A legacy that lives on.</p><div class="f"><span>Version 1.0</span><span>For internal and partner use</span></div></div>

<div class="pg"><h3>01 · Who we are</h3><h2>Mission, vision and voice</h2><div class="g g2"><div><h3 style="margin-top:4mm">Mission</h3><p>The Obi (Prof.) Chukuka Okonjo and Prof. Kamene Okonjo Foundation (CKF) honors our parents' lifelong commitment to education, service, and community by helping less privileged Nigerians, especially in Ogwashi-Ukwu, Delta State, build healthier and more self-reliant lives.</p><p><b>Short:</b> Carrying our parents' legacy forward by investing in education, health, and opportunity for the people of Ogwashi-Ukwu and beyond.</p></div>
<div><h3 style="margin-top:4mm">Vision</h3><p>We see an Ogwashi-Ukwu, and a Nigeria, where every child can get an education, every family can get quality primary care, and every young person has the skills and opportunity to build a livelihood and lift their community.</p><p><b>Short:</b> Healthy, educated, thriving communities where no one is held back by poverty.</p><h3 style="margin-top:6mm">Tagline</h3><p style="font-family:'Cormorant Garamond';font-size:20pt;font-weight:600;line-height:1.1;color:${C.forest}">Education. Health. Opportunity.<br>A legacy that lives on.</p></div></div>
<h3 style="margin-top:6mm">Objective</h3><p style="max-width:230mm">Assisting less privileged Nigerians, particularly in Ogwashi-Ukwu, Delta State, with: access to education through scholarships and other support for indigent students, as well as technology training and other practical skills; access to primary health care; community welfare such as environmental cleanups; and support to SMEs or other job-creating activities for youth.</p><div class="f"><span>CKF brand guidelines</span><span>2</span></div></div>

<div class="pg"><h3>02 · Logo</h3><h2>The swallow</h2><p>The CKF mark is the swallow supplied by the Foundation. Use it alone, or with the CKF / FOUNDATION wordmark. Always use the supplied files; never redraw or retype.</p>
<div class="g g4" style="margin-top:6mm"><div class="box" style="background:#fff"><div style="width:30mm;height:32mm">${inl('ckf-mark-forest')}</div></div><div class="box" style="background:${C.forest}"><div style="width:30mm;height:32mm">${inl('ckf-mark-sage')}</div></div><div class="box" style="background:${C.deep}"><div style="width:30mm;height:32mm">${inl('ckf-mark-white')}</div></div><div class="box" style="background:${C.sage}"><div style="width:30mm;height:32mm">${inl('ckf-mark-black')}</div></div></div>
<div class="g g3" style="margin-top:6mm"><div class="box" style="background:#fff;height:34mm"><div style="width:62mm;height:24mm">${inl('ckf-horizontal-forest')}</div></div><div class="box" style="background:${C.forest};height:34mm"><div style="width:62mm;height:24mm">${inl('ckf-horizontal-white')}</div></div><div class="box" style="background:#fff;height:34mm"><div style="width:30mm;height:30mm">${inl('ckf-stacked-forest')}</div></div></div><p style="margin-top:4mm;font-size:9pt">Left to right: mark, horizontal lock-up, stacked lock-up. Files: logo/svg and logo/png.</p><div class="f"><span>CKF brand guidelines</span><span>3</span></div></div>

<div class="pg"><h3>03 · Using the logo</h3><h2>Space, size, don'ts</h2><div class="g g2"><div><h3>Clear space</h3><p>Keep a margin around the logo equal to the width of the swallow's head (about a quarter of the mark's width) on every side. Nothing else sits inside it.</p><h3 style="margin-top:6mm">Minimum size</h3><ul><li>Mark: 16 px on screen / 8 mm in print</li><li>Horizontal lock-up: 110 px / 28 mm wide</li><li>Stacked lock-up: 70 px / 18 mm wide</li></ul><h3 style="margin-top:6mm">Colour</h3><p>Forest or black on light backgrounds. White, sage or mint on forest, deep forest or dark photographs. One colour only.</p></div>
<div><h3>Please don't</h3><div class="g g3"><div class="box no" style="background:#fff;height:32mm"><div style="width:28mm;height:30mm;transform:scaleX(1.5)">${inl('ckf-mark-forest')}</div></div><div class="box no" style="background:#fff;height:32mm"><div style="width:28mm;height:30mm;transform:rotate(25deg)">${inl('ckf-mark-forest')}</div></div><div class="box no" style="background:#f1c5ba;height:32mm"><div style="width:28mm;height:30mm">${inl('ckf-mark-forest')}</div></div><div class="box no" style="background:#fff;height:32mm"><div style="width:28mm;height:30mm;filter:drop-shadow(2mm 2mm 1mm #888)">${inl('ckf-mark-forest')}</div></div><div class="box no" style="background:#fff;height:32mm"><div style="width:28mm;height:30mm;opacity:.25">${inl('ckf-mark-forest')}</div></div><div class="box no" style="background:#f4d36b;height:32mm"><div style="width:28mm;height:30mm;color:red">${inl('ckf-mark-sage')}</div></div></div><p style="margin-top:3mm;font-size:9pt">Don't stretch, rotate, recolour, add effects, fade, or place on low-contrast or busy backgrounds.</p></div></div><div class="f"><span>CKF brand guidelines</span><span>4</span></div></div>

<div class="pg"><h3>04 · Colour</h3><h2>Greens, paper and ink</h2><div class="g g4" style="grid-template-columns:repeat(7,1fr);gap:4mm">${sw.map(s => `<div class="sw"><i style="background:${s[1]}"></i><div><b>${s[0]}</b><br>${s[1]}<br>RGB ${s[3]}<br>CMYK ${s[4]}<br><span style="opacity:.7">${s[2]}</span></div></div>`).join('')}</div><p style="margin-top:8mm;max-width:230mm">Use forest and deep forest for most surfaces. Sage and mint are for contrast on dark. Leaf is a small accent only. Keep large areas calm: one dark green, one paper, one soft sage. CMYK values are close approximations; always proof printed colour.</p><div class="f"><span>CKF brand guidelines</span><span>5</span></div></div>

<div class="pg"><h3>05 · Typography</h3><h2>Two typefaces</h2><div class="g g2"><div><h3>Hanken Grotesk · headlines and interface</h3><div class="sp" style="font-weight:300;font-size:40pt;letter-spacing:-.03em;color:${C.forest}">Education. Health.</div><p>Weights 300, 400, 500, 600. Light weight, tight tracking for large headlines; 400 for body; 500–600 for small labels and the wordmark. Free, open-source (SIL OFL).</p></div>
<div><h3>Cormorant Garamond · display and quotes</h3><div class="sp" style="font-family:'Cormorant Garamond';font-weight:500;text-transform:uppercase;font-size:34pt;color:${C.forest}">A legacy that lives on</div><p>Weights 500 and 600, usually uppercase for headings, italic for a single emphasised word. Free, open-source (SIL OFL).</p></div></div><h3 style="margin-top:8mm">Fallbacks</h3><p>Helvetica or Arial for Hanken Grotesk; Georgia for Cormorant Garamond. Font files are in the fonts folder.</p><div class="f"><span>CKF brand guidelines</span><span>6</span></div></div>

<div class="pg dk"><h3 style="color:${C.sage}">06 · Imagery and tone</h3><h2>Real people, in colour</h2><div class="g g2"><div><ul><li>Use colour photographs of real people, places and programmes. Do not convert photographs to black and white.</li><li>Show dignity and agency; people doing, learning and leading, not only receiving.</li><li>Credit photographers and licences. Ask consent for images of children.</li><li>Placeholder stock images must be replaced before launch.</li></ul></div><div><ul><li><b>Tone:</b> warm, plain, specific, hopeful. Short sentences.</li><li><b>Say:</b> "a legacy that lives on", "less privileged Nigerians", "Ogwashi-Ukwu".</li><li><b>Avoid:</b> pity language, unverified statistics, jargon.</li><li><b>Numbers:</b> only publish figures CKF can document.</li></ul></div></div><div class="f"><span>CKF brand guidelines</span><span>7</span></div></div></body></html>`;

(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const png = async (svg, w, h, out, bg) => { const t = path.join(PACK, '..', '_t.html'); fs.writeFileSync(t, `<body style="margin:0;background:${bg || 'transparent'}"><div style="width:${w}px;height:${h}px">${svg.replace('<svg ', '<svg style="width:100%;height:100%;display:block" ')}</div>`); await p.setViewportSize({ width: w, height: h }); await p.goto('file://' + t); await p.screenshot({ path: out, omitBackground: !bg }); };
  for (const [n, svg, w, h] of logos) { const W2 = 2000, H2 = Math.round(W2 * h / w); await png(svg, W2, H2, path.join(PACK, 'logo/png', n + '.png')); }
  for (const [n, svg] of Object.entries(icons)) { await png(svg, 1024, 1024, path.join(PACK, 'icons', n + '.png')); }
  for (const s of [16, 32, 48, 180, 192, 512]) await png(icons['icon-forest'], s, s, path.join(PACK, 'icons', `icon-${s}.png`));
  await png(icons['icon-forest'], 180, 180, path.join(PUB, 'brand/apple-touch-icon.png')); await png(icons.favicon, 512, 512, path.join(PUB, 'brand/icon-512.png')); await png(icons.favicon, 192, 192, path.join(PUB, 'brand/icon-192.png'));
  fs.copyFileSync(path.join(PACK, 'icons/favicon.svg'), path.join(PUB, 'brand/favicon.svg'));
  cp.execSync(`convert ${PACK}/icons/icon-16.png ${PACK}/icons/icon-32.png ${PACK}/icons/icon-48.png ${PACK}/icons/favicon.ico`);
  for (const [n, [w, h, svg]] of Object.entries(social)) await png(svg, w, h, path.join(PACK, 'social', n + '.jpg'), C.forest);
  fs.copyFileSync(path.join(PACK, 'social/og-image-1200x630.jpg'), path.join(PUB, 'og-image.jpg'));
  // palette image + files
  const palHtml = `<body style="margin:0;display:flex;font:500 22px 'Hanken Grotesk',sans-serif">${sw.map(s => `<div style="flex:1;height:560px;background:${s[1]};color:${['Paper', 'Sage', 'Mint'].includes(s[0]) ? C.ink : '#fff'};padding:26px;display:flex;flex-direction:column;justify-content:flex-end"><b>${s[0]}</b><span style="font-weight:400;font-size:18px">${s[1]}</span></div>`).join('')}`;
  fs.writeFileSync(path.join(PACK, '..', '_t.html'), `<style>${ffs}</style>` + palHtml); await p.setViewportSize({ width: 1600, height: 560 }); await p.goto('file://' + path.join(PACK, '..', '_t.html')); await p.waitForTimeout(300); await p.screenshot({ path: path.join(PACK, 'colors/CKF-palette.png') });
  W('colors/palette.json', JSON.stringify(Object.fromEntries(sw.map(s => [s[0].toLowerCase().replace(' ', '-'), { hex: s[1], rgb: s[3], cmyk_approx: s[4], use: s[2] }])), null, 2));
  W('colors/ckf-colors.css', ':root{\n' + sw.map(s => `  --ckf-${s[0].toLowerCase().replace(' ', '-')}: ${s[1]};`).join('\n') + '\n}\n');
  await p.setViewportSize({ width: 1123, height: 794 }); fs.writeFileSync(path.join(PACK, '..', '_g.html'), guide); await p.goto('file://' + path.join(PACK, '..', '_g.html')); await p.waitForTimeout(500);
  await p.pdf({ path: path.join(PACK, 'CKF-Brand-Guidelines.pdf'), width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
  await b.close(); fs.rmSync(path.join(PACK, '..', '_t.html')); fs.rmSync(path.join(PACK, '..', '_g.html'));
  // fonts + licences
  for (const [pkg, files] of [['hanken-grotesk', [300, 400, 500, 600]], ['cormorant-garamond', [500, 600]]]) { const d = path.join(PACK, 'fonts', pkg); mkdir(d); for (const w of files) for (const e of ['woff2', 'woff']) fs.copyFileSync(path.join(FS, pkg, 'files', `${pkg}-latin-${w}-normal.${e}`), path.join(d, `${pkg}-${w}.${e}`)); if (fs.existsSync(path.join(FS, pkg, 'LICENSE'))) fs.copyFileSync(path.join(FS, pkg, 'LICENSE'), path.join(d, 'LICENSE-OFL.txt')); }
  W('README.txt', `CKF FOUNDATION · BRAND PACK (v1.0)\nThe Obi (Prof.) Chukuka Okonjo and Prof. Kamene Okonjo Foundation\nEducation. Health. Opportunity. A legacy that lives on.\n\nCKF-Brand-Guidelines.pdf  how to use everything below\nlogo/svg, logo/png        swallow mark, horizontal and stacked lock-ups, full-name lock-up (forest, white, black, sage). PNGs are 2000 px wide with transparent backgrounds.\nicons/                    favicon (.svg/.ico), app icons 16-512 px, round and square avatars (1024 px)\nsocial/                   Open Graph / link preview, X header, LinkedIn banner, Facebook cover\ncolors/                   palette image, palette.json, ckf-colors.css\nfonts/                    Hanken Grotesk and Cormorant Garamond (SIL Open Font License)\n\nThe logo is the swallow supplied by the Foundation, traced to vector. Wordmarks are converted to outlines, so no font is needed to use them.\n`);
  console.log('done');
})();
