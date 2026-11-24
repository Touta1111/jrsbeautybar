/* Getekende haar-illustraties als tijdelijke beelden — geen klantfoto's, duidelijk gemarkeerd. */
{
const PAL = {
  '1B': ['#1a1512', '#3b2f28', '#5a4638'], '#4': ['#3a2418', '#6b4329', '#8d5c3a'], 'Honey': ['#4a2e18', '#a36a32', '#e0ad6b'],
  'Burgundy': ['#2a0d12', '#6e1f2b', '#a33a48'], 'zwart': ['#141210', '#2c2622', '#4a403a'], 'default': ['#1a1512', '#4a3a30', '#8a6a52']
};
function rnd(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
let n = 0;
function strands(R, pal, o) {
  const { count, w, amp, x0, x1, top, bottom } = o; let out = '';
  const waves = o.waves || 3, H = bottom - top;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1), x = x0 + (x1 - x0) * t + (R() - .5) * 6, ph = (o.sync ? 0 : (R() - .5) * .8), a = amp * (.85 + R() * .3), spread = (t - .5) * (o.spread || 50);
    const pts = []; const N = waves * 4;
    for (let k = 0; k <= N; k++) { const y = top + H * k / N, f = k / N; pts.push([x + spread * f * f + Math.sin(k * Math.PI / 2 + ph) * a * Math.min(1, f * 2.2), y]); }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let k = 1; k < pts.length; k++) { const [px, py] = pts[k - 1], [cx, cy] = pts[k]; const my = (py + cy) / 2; d += ` C${px.toFixed(1)} ${my.toFixed(1)} ${cx.toFixed(1)} ${my.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`; }
    const c = pal[Math.floor(R() * pal.length)];
    out += `<path d="${d}" stroke="${c}" stroke-width="${(w * (.5 + R() * .8)).toFixed(2)}" stroke-opacity="${(.45 + R() * .5).toFixed(2)}" fill="none" stroke-linecap="round"/>`;
  }
  return out;
}
function ringlet(R, pal, cx, top, len, r) { let d = `M${cx} ${top}`; const turns = Math.floor(len / (r * 1.1)); for (let k = 0; k < turns; k++) { const y = top + k * r * 1.1; d += ` C${cx + r * 1.4} ${y + r * .2} ${cx + r * 1.2} ${y + r * 1.1} ${cx} ${y + r * .9} C${cx - r * 1.2} ${y + r * .8} ${cx - r * 1.1} ${y + r * 1.4} ${cx} ${y + r * 1.1}`; } return `<path d="${d}" stroke="${pal[Math.floor(R() * pal.length)]}" stroke-width="${(2.2 + R() * 2.2).toFixed(1)}" fill="none" stroke-linecap="round" opacity="${(.7 + R() * .3).toFixed(2)}"/>`; }
window.hairArt = function (kind, opt = {}) {
  const id = 'ha' + (++n), R = rnd(kind + (opt.seed || '')), pal = PAL[opt.color] || (kind === 'precolor' ? PAL.Honey : PAL.default);
  const bgA = opt.dark ? '#221c17' : '#efe4d6', bgB = opt.dark ? '#120f0c' : '#dcc8b3';
  const shine = `<linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  let body = '';
  if (kind === 'bottle') body = `<ellipse cx="200" cy="452" rx="90" ry="14" fill="#000" opacity=".15"/><rect x="186" y="96" width="28" height="40" rx="4" fill="#141210"/><rect x="150" y="132" width="100" height="320" rx="26" fill="#f8f2ea" stroke="#d8c4b0"/><rect x="164" y="146" width="16" height="290" rx="8" fill="#fff" opacity=".7"/><text x="200" y="300" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="28" font-weight="700" fill="#141210">JR</text><text x="200" y="324" text-anchor="middle" font-family="Manrope,sans-serif" font-size="10" fill="#8a6a52">CARE</text>`;
  else if (kind === 'jar') body = `<ellipse cx="200" cy="420" rx="100" ry="14" fill="#000" opacity=".15"/><rect x="142" y="170" width="116" height="40" rx="8" fill="#141210"/><rect x="132" y="204" width="136" height="212" rx="22" fill="#efe2d2" stroke="#c8a58a"/><rect x="148" y="216" width="14" height="186" rx="7" fill="#fff" opacity=".6"/><text x="200" y="318" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="30" font-weight="700" fill="#141210">JR</text><text x="200" y="342" text-anchor="middle" font-family="Manrope,sans-serif" font-size="10" fill="#8a6a52">HAIR VITAMINS</text>`;
  else if (kind === 'bonnet') body = `<ellipse cx="200" cy="380" rx="140" ry="18" fill="#000" opacity=".16"/><path d="M70 340 C70 200 140 140 200 140 C260 140 330 200 330 340 Z" fill="#141210"/><path d="M110 300 C120 220 160 180 210 172" stroke="#fff" stroke-opacity=".22" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="62" y="330" width="276" height="30" rx="15" fill="#2a2420"/><path d="M80 345 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#c8a58a" stroke-width="2" fill="none"/>`;
  else if (kind === 'bundle') {
    body = `<ellipse cx="200" cy="452" rx="120" ry="16" fill="#000" opacity=".16"/>` + strands(R, pal, { count: 70, w: 2.4, amp: 7, waves: 4, x0: 140, x1: 260, top: 128, bottom: 436, spread: 10 }) +
      `<rect x="128" y="96" width="144" height="34" rx="6" fill="#f6efe6" stroke="#c8a58a"/><text x="200" y="119" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="17" font-weight="700" fill="#141210">JR</text>
      <rect x="150" y="160" width="100" height="240" fill="url(#${id}s)" opacity=".7"/>`;
  } else if (kind === 'curls') {
    for (let i = 0; i < 22; i++) { const cx = 70 + i * 12.5 + (R() - .5) * 10, top = 30 + R() * 40; body += ringlet(R, pal, cx, top, 380 + R() * 80, 9 + R() * 6); }
  } else if (kind === 'sleek') {
    body = `<path d="M188 120 C150 200 150 330 176 470 C190 500 214 500 226 470 C252 330 252 200 214 120Z" fill="${pal[0]}"/>` + strands(R, pal, { count: 36, w: 1.8, amp: 4, waves: 2, x0: 178, x1: 222, top: 128, bottom: 478, spread: 18 }) +
      `<rect x="180" y="104" width="42" height="22" rx="11" fill="#c8a58a"/><path d="M196 140 C186 230 188 360 198 460" stroke="url(#${id}s)" stroke-width="14" fill="none" opacity=".9"/>`;
  } else {
    const wave = kind === 'precolor' ? 16 : kind === 'straight' ? 2 : 20;
    body = strands(R, pal, { count: kind === 'hero' ? 120 : 90, w: 2.2, amp: wave, waves: kind === 'straight' ? 2 : 4, sync: true, x0: 40, x1: 360, top: -10, bottom: 520, spread: 60 }) + `<rect x="0" y="0" width="400" height="500" fill="url(#${id}s)" opacity=".35"/>`;
  }
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${id}b" cx=".35" cy=".25" r="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></radialGradient>${shine}</defs><rect width="400" height="500" fill="url(#${id}b)"/>${body}</svg>`;
};
window.lookArt = function (hint) {
  const h = String(hint || '').toLowerCase();
  if (/curl|krul/.test(h)) return 'curls'; if (/pony/.test(h)) return 'sleek'; if (/pre|honey|color/.test(h)) return 'precolor'; if (/bundel|bundle/.test(h)) return 'bundle'; if (/hu|hd|unit|straight/.test(h)) return 'straight'; return 'waves';
};
}
/* Elegante merk-tegels in plaats van tekeningen (geen nep-haar, geen nepfoto's) */
{
  const SW = { '1B': '#1a1512', '#4': '#5a3520', 'Honey': '#b37a3c', 'Burgundy': '#6e1f2b', 'zwart': '#141210' };
  let k = 0;
  window.hairArtOrig = window.hairArt;
  window.hairArt = function (kind, o = {}) {
    const id = 'mt' + (++k), dark = !!o.dark, c = SW[o.color];
    const a = dark ? '#2a221c' : '#efe3d4', b = dark ? '#100d0b' : '#d9c4ae', ink = dark ? '#e9d3bd' : '#3b2c22';
    const label = ({ bottle: 'care', jar: 'vitamins', bonnet: 'silk', bundle: c ? '' : 'bundles' })[kind] || '';
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${id}" cx=".3" cy=".2" r="1.1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient><linearGradient id="${id}l" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <rect width="400" height="500" fill="url(#${id})"/><rect width="400" height="500" fill="url(#${id}l)"/>
      <circle cx="200" cy="250" r="150" fill="none" stroke="${ink}" stroke-opacity=".16"/><circle cx="200" cy="250" r="118" fill="none" stroke="${ink}" stroke-opacity=".1"/>
      ${c ? `<circle cx="200" cy="232" r="78" fill="${c}"/><circle cx="176" cy="206" r="26" fill="#fff" opacity=".12"/>` : `<text x="200" y="285" text-anchor="middle" font-family="Alex Brush, Cormorant Garamond, serif" font-size="150" fill="${ink}" fill-opacity=".85">JR</text>`}
      ${label ? `<text x="200" y="372" text-anchor="middle" font-family="Manrope, sans-serif" font-size="15" letter-spacing="6" fill="${ink}" fill-opacity=".6">${label.toUpperCase()}</text>` : ''}
      ${c ? `<text x="200" y="372" text-anchor="middle" font-family="Manrope, sans-serif" font-size="15" letter-spacing="6" fill="${ink}" fill-opacity=".6">${(o.color || '').toUpperCase()}</text>` : ''}</svg>`;
  };
}
