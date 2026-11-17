// Builds dotted SVG maps of Nigeria (Delta State highlighted) and Delta State (Aniocha South highlighted).
// Boundary data: GADM 4.1 (gadm.org), free for non-commercial / attribution use. Run: node scripts/build-map.cjs
const fs = require('fs'), path = require('path');
const A1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/gadm41_NGA_1.json'))).features;
const A2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/gadm41_NGA_2.json'))).features;
const OUT = path.join(__dirname, '../public/assets/map');
function rings(g) { return g.type === 'Polygon' ? [g.coordinates] : g.coordinates; } // array of polygons (each: [outer, ...holes])
function inRing(x, y, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function inGeom(x, y, polys) { for (const p of polys) { if (inRing(x, y, p[0])) { let hole = false; for (let k = 1; k < p.length; k++) if (inRing(x, y, p[k])) hole = true; if (!hole) return true; } } return false; }
function bbox(polys) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of polys) for (const [x, y] of p[0]) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; }
function build({ name, feats, step, lonR, latR, tone, anchor, r }) {
  const lat0 = (latR[0] + latR[1]) / 2, k = Math.cos(lat0 * Math.PI / 180);
  const items = feats.map(f => { const polys = rings(f.geometry); return { polys, bb: bbox(polys), t: tone(f) }; });
  const groups = {}; let n = 0, W = 0, H = 0;
  const sx = step / k; // lon step so dots are square on screen
  for (let lat = latR[1]; lat >= latR[0]; lat -= step) for (let lon = lonR[0]; lon <= lonR[1]; lon += sx) {
    let hit = null;
    for (const it of items) { if (lon < it.bb[0] || lon > it.bb[2] || lat < it.bb[1] || lat > it.bb[3]) continue; if (inGeom(lon, lat, it.polys)) { if (!hit || it.t.z > hit.z) hit = it.t; } }
    if (!hit) continue;
    const cx = (lon - lonR[0]) / sx, cy = (latR[1] - lat) / step; // in dot units
    (groups[hit.c] = groups[hit.c] || []).push([cx, cy]); n++; W = Math.max(W, cx); H = Math.max(H, cy);
  }
  const u = 10, vbW = Math.ceil((W + 1) * u), vbH = Math.ceil((H + 1) * u);
  let body = ''; Object.entries(groups).sort((a, b) => b[1].length - a[1].length).forEach(([c, pts]) => { body += `<g fill="${c}">` + pts.map(([x, y]) => `<circle cx="${Math.round(x * u + u / 2)}" cy="${Math.round(y * u + u / 2)}" r="${r}"/>`).join('') + '</g>'; });
  fs.writeFileSync(path.join(OUT, name + '.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="${name} dotted map">${body}</svg>`);
  const ax = ((anchor[0] - lonR[0]) / sx * u + u / 2) / vbW * 100, ay = ((latR[1] - anchor[1]) / step * u + u / 2) / vbH * 100;
  console.log(name, 'dots', n, 'viewBox', vbW, vbH, 'anchor %', ax.toFixed(2), ay.toFixed(2), 'svg KB', (fs.statSync(path.join(OUT, name + '.svg')).size / 1024).toFixed(0));
  return { w: vbW, h: vbH, ax: +ax.toFixed(2), ay: +ay.toFixed(2) };
}
const OGWASHI = [6.5333, 6.1833]; // Ogwashi-Ukwu, Aniocha South LGA, Delta State
const FOREST = '#2F4B2A', MID = '#8FB07A', PALE = '#D6E5CB', LIGHT = '#E9F0E2';
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const ng = build({ name: 'nigeria-dots', feats: A1, step: 0.17, lonR: [2.6, 14.8], latR: [4.2, 14], r: 3.6, anchor: OGWASHI,
  tone: f => { const n = f.properties.NAME_1; if (n === 'Delta') return { c: FOREST, z: 3 }; return { c: ['Edo','Anambra','Bayelsa','Rivers','Imo','Kogi','Enugu','Ondo'].includes(n) ? MID : PALE, z: 1 }; } });
const delta = A2.filter(f => f.properties.NAME_1 === 'Delta');
const around = A1.filter(f => ['Edo','Anambra','Bayelsa','Rivers','Imo','Ondo','Kogi'].includes(f.properties.NAME_1));
const dl = build({ name: 'delta-dots', feats: delta, step: 0.03, lonR: [4.9, 6.95], latR: [5.0, 6.6], r: 3.7, anchor: OGWASHI,
  tone: f => { if (f._bg) return { c: LIGHT, z: 0 }; const n = f.properties.NAME_2; if (/AniochaSouth/.test(n)) return { c: FOREST, z: 3 }; return { c: [PALE, MID, '#B9D0A8'][hash(n) % 3], z: 2 }; } });
fs.writeFileSync(path.join(OUT, 'anchors.json'), JSON.stringify({ nigeria: ng, delta: dl }, null, 1));
