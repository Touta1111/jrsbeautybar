/* JR'SBEAUTYBAR — webshop: losse bundels, closures, frontals, ponytails, braiding hair, verzorging; set samenstellen, winkelwagen, afrekenen, bestelstatus */
{
const A = window.APP, U = window.U, ACT = window.ACT;
const { esc, eur, ico, pill, toast, modal, closeModal, go, dt, dshort, call } = A;
const SW = { '1B': '#1a1512', '#4': '#5a3520', 'Honey': '#b37a3c', '613': '#e6cf9a', 'Burgundy': '#6e1f2b', '': '#c8a58a' };
const CATS = ['Haarbundels', 'Closures & frontals', 'Ponytails', 'Braiding hair', 'Verzorging', 'Accessoires'];
const slugP = id => id.replace(/^prd_/, '').replace(/_/g, '-');
const bySlug = (C, s) => C.products.find(p => slugP(p.id) === s);
const len = v => parseInt(v.length) || 0;
const optA = v => v.label.split(' · ')[0];
const kindOf = p => p.type === 'care' ? (p.category === 'Accessoires' ? 'bonnet' : 'bottle') : 'bundle';
const tile = (p, v, cls = '') => `<div class="sp-tile ${cls}">${window.hairArt(kindOf(p), { color: (v || p.variants[0] || {}).color, seed: p.id })}<span class="sp-type">${esc(p.type === 'bundel' ? p.texture : p.category)}</span></div>`;
const cartN = () => U.cart.reduce((a, i) => a + i.qty, 0);
const saveCart = () => A.lsSet('jrs_cart', JSON.stringify(U.cart));
const addCart = (variantId, qty) => { const ex = U.cart.find(i => i.variantId === variantId); if (ex) ex.qty += qty; else U.cart.push({ variantId, qty }); saveCart(); const b = document.querySelector('.cart-fab'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } };
const allVariants = C => C.products.flatMap(p => p.variants.map(v => ({ ...v, p })));

/* ---------- winkel ---------- */
window.shopView = function (C, M) {
  const S = U.sh || (U.sh = { cat: 'Haarbundels', tex: '', col: '', lmin: 12, lmax: 30, stock: false, sort: 'pop', q: '' });
  let list = C.products.filter(p => p.live && (S.q ? (p.name + ' ' + (p.texture || '') + ' ' + p.description).toLowerCase().includes(S.q.toLowerCase()) : p.category === S.cat));
  const hair = S.cat === 'Haarbundels' && !S.q;
  const match = p => p.variants.filter(v => (!S.col || v.color === S.col) && (!hair || !len(v) || (len(v) >= S.lmin && len(v) <= S.lmax)) && (!S.stock || v.available > 0));
  if (hair && S.tex) list = list.filter(p => p.texture === S.tex);
  list = list.filter(p => match(p).length);
  const minP = p => Math.min(...match(p).map(v => v.priceCents));
  if (S.sort === 'low') list.sort((a, b) => minP(a) - minP(b)); else if (S.sort === 'high') list.sort((a, b) => minP(b) - minP(a));
  const bundlesPh = C.media.filter(m => m.highlight === 'Bundels' && A.safeSrc(m.dataUrl));
  const texs = [...new Set(C.products.filter(p => p.category === 'Haarbundels').map(p => p.texture))];
  const cols = [...new Set(C.products.filter(p => p.category === 'Haarbundels').flatMap(p => p.variants.map(v => v.color)))];
  return `${U.orderDone ? `<div class="note ok" role="status" style="margin:10px 0">Bestelling ${esc(U.orderDone)} is betaald. Volg de status bij Mijn account. <button class="btn quiet sm" data-act="dismissOrder">Sluiten</button></div>` : ''}
  <section class="shop-hero"><div class="sh-ph">${bundlesPh.slice(0, 2).map(m => `<img src="${esc(m.dataUrl)}" alt="${esc(m.caption || 'Bundels')}" style="object-position:${esc(m.focus || '50% 30%')}">`).join('')}</div>
    <div class="stack sh-tx"><span class="kicker" style="color:#d6b293">Shop</span><h1 class="serif">Haar, los of als set</h1><p>Losse bundels in elke lengte, closures, frontals, ponytails, braiding hair en verzorging. Afhalen in Rotterdam of verzending wereldwijd.</p>
    <div class="row"><a class="btn light sm" href="#bundelbouwer">Stel een set samen</a><button class="btn line-light sm" data-act="openCart">Winkelwagen (${cartN()})</button></div></div></section>
  <div class="shop-bar"><label class="search"><span class="sr">Zoek</span>${ico('search', 18)}<input class="i" placeholder="Zoek op textuur, kleur of product…" value="${esc(S.q)}" data-shq></label>
    <div class="tabs" role="tablist">${CATS.map(c => `<button class="tab" role="tab" data-act="shCat" data-c="${esc(c)}" aria-selected="${!S.q && S.cat === c}">${esc(c)} <small>${C.products.filter(p => p.category === c && p.live).length}</small></button>`).join('')}</div></div>
  <div class="shop-grid">${hair ? `<aside class="filters" aria-label="Filters"><div class="fgroup"><b>Textuur</b><div class="chips wrap">${['', ...texs].map(t => `<button class="chip" data-act="shTex" data-t="${esc(t)}" aria-pressed="${S.tex === t}">${t ? esc(t) : 'Alle'}</button>`).join('')}</div></div>
    <div class="fgroup"><b>Kleur</b><div class="swatch-row">${['', ...cols].map(c => `<button class="sw-dot" data-act="shCol" data-c="${esc(c)}" aria-pressed="${S.col === c}" aria-label="${c ? esc(c) : 'Alle kleuren'}" title="${c ? esc(c) : 'Alle'}" style="--c:${c ? SW[c] || '#888' : 'conic-gradient(#1a1512,#b37a3c,#e6cf9a,#6e1f2b,#1a1512)'}"></button>`).join('')}</div></div>
    <div class="fgroup"><b>Lengte <span class="num">${S.lmin}″ – ${S.lmax}″</span></b><div class="range2"><input type="range" min="12" max="30" step="2" value="${S.lmin}" data-lmin aria-label="Minimale lengte"><input type="range" min="12" max="30" step="2" value="${S.lmax}" data-lmax aria-label="Maximale lengte"></div></div>
    <label class="chk"><input type="checkbox" data-shstock ${S.stock ? 'checked' : ''}><span>Alleen op voorraad</span></label>
    <a class="btn quiet sm" href="#gids">Lengte- en kleurgids →</a></aside>` : ''}
    <div><div class="row between" style="margin-bottom:10px"><span class="muted">${list.length} product${list.length === 1 ? '' : 'en'}</span><label class="f" style="display:flex;gap:8px;align-items:center;font-weight:600">Sorteren<select class="i" data-shsort style="width:auto;min-height:40px">${[['pop', 'Populair'], ['low', 'Prijs laag–hoog'], ['high', 'Prijs hoog–laag']].map(([k, l]) => `<option value="${k}" ${S.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <div class="products2">${list.map(p => { const vs = match(p); const lens = vs.map(len).filter(Boolean); const colsP = [...new Set(p.variants.map(v => v.color))]; const av = vs.reduce((a, v) => a + Math.max(0, v.available), 0);
      return `<article class="pcard"><a href="#product-${slugP(p.id)}" class="pc-link">${tile(p, vs[0])}<b class="serif">${esc(p.name)}</b></a><span class="pc-meta">${lens.length ? `${Math.min(...lens)}″–${Math.max(...lens)}″ · ` : ''}${p.variants.length} varianten</span>
      <div class="pc-sw">${colsP.slice(0, 5).map(c => `<i style="--c:${SW[c] || '#c8a58a'}" title="${esc(c)}"></i>`).join('')}</div><div class="row between"><b class="num">${vs.length > 1 ? 'vanaf ' : ''}${eur(minP(p))}</b>${av ? pill('ok', 'Op voorraad') : pill('', 'Op bestelling')}</div>
      <a class="btn sm block" href="#product-${slugP(p.id)}">Bekijk</a></article>`; }).join('') || '<div class="empty">Geen producten met deze filters. <button class="btn quiet sm" data-act="shReset">Wis filters</button></div>'}</div></div></div>
  <p class="muted" style="margin-top:18px">Assortiment, prijzen en voorraad zijn voorbeelddata; de salon past ze aan in de Studio-app.</p>`;
};
ACT.shCat = d => { U.sh.cat = d.c; U.sh.q = ''; A.render(); };
ACT.shTex = d => { U.sh.tex = d.t; A.render(); };
ACT.shCol = d => { U.sh.col = d.c; A.render(); };
ACT.shReset = () => { Object.assign(U.sh, { tex: '', col: '', lmin: 12, lmax: 30, stock: false, q: '' }); A.render(); };
document.addEventListener('change', e => { const t = e.target; if (!U.sh) return; if (t.matches('[data-shsort]')) { U.sh.sort = t.value; A.render(); } if (t.matches('[data-shstock]')) { U.sh.stock = t.checked; A.render(); } if (t.matches('[data-lmin]')) { U.sh.lmin = Math.min(+t.value, U.sh.lmax); A.render(); } if (t.matches('[data-lmax]')) { U.sh.lmax = Math.max(+t.value, U.sh.lmin); A.render(); } });
document.addEventListener('input', e => { if (e.target.matches('[data-shq]')) { U.sh.q = e.target.value; clearTimeout(U.shT); U.shT = setTimeout(() => { A.render(); const i = document.querySelector('[data-shq]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); } });

/* ---------- productpagina ---------- */
function productPage(C, M, sl) {
  const p = bySlug(C, sl); if (!p) return '<h1>Product niet gevonden</h1>';
  const P = U.pp && U.pp.id === p.id ? U.pp : (U.pp = { id: p.id, a: optA(p.variants.find(v => v.available > 0) || p.variants[0]), l: (p.variants.find(v => v.available > 0) || p.variants[0]).length, qty: 1 });
  const As = [...new Set(p.variants.map(optA))]; const Ls = [...new Set(p.variants.filter(v => optA(v) === P.a).map(v => v.length))].filter(Boolean);
  let v = p.variants.find(x => optA(x) === P.a && x.length === P.l) || p.variants.find(x => optA(x) === P.a); P.l = v.length;
  const looks = C.media.filter(m => ['Bundels', 'Sew-in', 'Cliënt view'].includes(m.highlight) && A.safeSrc(m.dataUrl)).slice(0, 4);
  const pair = C.products.filter(x => x.id !== p.id && (p.type === 'bundel' ? ['closure', 'frontal', 'care'].includes(x.type) : x.type === 'bundel')).slice(0, 4);
  const enough = v.available >= P.qty;
  return `<nav class="crumbs"><a href="#home">Home</a> / <a href="#shop">Shop</a> / <span aria-current="page">${esc(p.name)}</span></nav>
  <section class="pp"><div class="pp-gal">${tile(p, v, 'big')}<div class="pp-thumbs">${looks.map(m => `<img src="${esc(m.dataUrl)}" alt="${esc(m.caption || '')}" loading="lazy" style="object-position:${esc(m.focus || '50% 30%')}">`).join('')}</div>${looks.length ? '<small class="muted">Looks uit de salon — de exacte productfoto per variant volgt.</small>' : ''}</div>
  <div class="stack pp-info"><span class="kicker">${esc(p.category)}${p.texture ? ' · ' + esc(p.texture) : ''}</span><h1 class="serif">${esc(p.name)}</h1><div class="pp-price"><b class="serif num">${eur(v.priceCents * P.qty)}</b>${P.qty > 1 ? `<small class="muted">${P.qty} × ${eur(v.priceCents)}</small>` : ''}</div><p>${esc(p.description)}</p>
    ${As.length > 1 ? `<div class="fgroup"><b>${p.type === 'bundel' || p.type === 'braiding' || p.type === 'ponytail' ? 'Kleur' : 'Variant'}: <span>${esc(P.a)}</span></b><div class="opt-row">${As.map(a => { const c = (p.variants.find(x => optA(x) === a) || {}).color; return `<button class="opt ${p.type === 'bundel' ? 'col' : ''}" data-act="ppA" data-v="${esc(a)}" aria-pressed="${P.a === a}">${p.type === 'bundel' ? `<i style="--c:${SW[c] || '#c8a58a'}"></i>` : ''}${esc(a)}</button>`; }).join('')}</div></div>` : ''}
    ${Ls.length ? `<div class="fgroup"><b>Lengte: <span>${esc(P.l)}</span></b><div class="opt-row">${Ls.map(l => { const x = p.variants.find(y => optA(y) === P.a && y.length === l); return `<button class="opt len" data-act="ppL" data-v="${esc(l)}" aria-pressed="${P.l === l}" ${x.available < 1 ? 'data-out="1"' : ''}>${esc(l)}<small>${eur(x.priceCents)}</small></button>`; }).join('')}</div></div>` : ''}
    <div class="row"><div class="qty"><button data-act="ppQ" data-n="-1" aria-label="Minder">−</button><b class="num">${P.qty}</b><button data-act="ppQ" data-n="1" aria-label="Meer">+</button></div>${v.available > 0 ? pill(enough ? 'ok' : 'warn', enough ? `${v.available} op voorraad` : `Nog ${v.available} op voorraad`) : pill('', `Op bestelling · ±${v.leadDays} dagen`)}</div>
    <div class="row"><button class="btn" data-act="ppAdd" data-id="${esc(v.id)}" ${v.available >= P.qty ? '' : 'disabled'}>In winkelwagen</button>${p.type === 'bundel' || p.type === 'closure' || p.type === 'frontal' ? `<button class="btn ghost" data-act="ppBook" data-id="${esc(v.id)}">Leg klaar bij mijn afspraak</button>` : ''}${v.available < 1 ? `<button class="btn ghost" data-act="openChat" data-prefill="Ik wil ${esc(p.name + ' ' + v.label)} bestellen">Vraag aan</button>` : ''}</div>
    <div class="pp-usp"><span>${ico('home', 18)} Afhalen: ${esc((C.address || {}).street || 'Rotterdam')}</span><span>${ico('bag', 18)} Verzending vanaf ${eur(Math.min(...C.shipping.map(s => s.rateCents)))} · ${C.shipping.length} landen</span><span>${ico('cal', 18)} Leg klaar bij je afspraak, betaal in één keer</span></div>
    ${p.type === 'bundel' ? `<details class="d"><summary>Hoeveel bundels heb ik nodig?</summary><div><p>Als indicatie: 2 bundels tot 16″, 3 bundels tot 22″, 4 bundels vanaf 24″. Bij Regular Half up half down zijn 2 à 3 bundels nodig. Twijfel je? Stuur een foto voor advies.</p></div></details>` : ''}
    <details class="d"><summary>Verzorging</summary><div><p>Was met sulfaatvrije shampoo, ontwar van punt naar wortel en slaap met een zijden bonnet of scarf.</p></div></details></div></section>
  ${pair.length ? `<section class="sect stack"><div><span class="kicker">Vaak samen gekocht</span><h2>Maak het compleet</h2></div><div class="rail">${pair.map(x => `<a class="pcard mini" href="#product-${slugP(x.id)}">${tile(x)}<b class="serif">${esc(x.name)}</b><span class="num">vanaf ${eur(Math.min(...x.variants.map(y => y.priceCents)))}</span></a>`).join('')}</div></section>` : ''}
  <div class="sticky-cta pp-sticky"><span><b>${esc(p.name)}</b><br><small class="muted">${esc(v.label)} · ${eur(v.priceCents)}</small></span><button class="btn" data-act="ppAdd" data-id="${esc(v.id)}" ${v.available >= P.qty ? '' : 'disabled'}>In winkelwagen</button></div>`;
}
ACT.ppA = d => { U.pp.a = d.v; A.render(); };
ACT.ppL = d => { U.pp.l = d.v; A.render(); };
ACT.ppQ = d => { U.pp.qty = Math.max(1, Math.min(10, U.pp.qty + (+d.n))); A.render(); };
ACT.ppAdd = d => { addCart(d.id, U.pp.qty); toast('Toegevoegd aan je winkelwagen'); A.render(); ACT.openCart(); };
ACT.ppBook = d => { U.flow = { step: 2, serviceId: 'svc_sewin', variantId: d.id, extras: [], showHair: true }; toast('Kies je behandeling; de bundel ligt voor je klaar'); go('boeken'); };

/* ---------- set samenstellen ---------- */
function setBuilder(C) {
  const prods = C.products.filter(p => p.type === 'bundel');
  const B = U.set || (U.set = { p: prods[1] ? prods[1].id : prods[0].id, c: '1B', lens: ['18"', '20"', '22"'], cl: '' });
  const p = prods.find(x => x.id === B.p) || prods[0]; const cols = [...new Set(p.variants.map(v => v.color))]; if (!cols.includes(B.c)) B.c = cols[0];
  const vOf = l => p.variants.find(v => v.color === B.c && v.length === l); const allL = [...new Set(p.variants.filter(v => v.color === B.c).map(v => v.length))];
  const items = B.lens.map(vOf).filter(Boolean);
  const tex = p.texture.split(' ')[0]; const cls = C.products.filter(x => x.type === 'closure' || x.type === 'frontal').flatMap(x => x.variants.filter(v => v.label.startsWith(tex) || x.texture === 'Straight' && tex === 'Straight').map(v => ({ ...v, p: x })));
  const clV = cls.find(v => v.id === B.cl);
  const tot = items.reduce((a, v) => a + v.priceCents, 0) + (clV ? clV.priceCents : 0); const short = items.filter(v => v.available < B.lens.filter(l => l === v.length).length);
  const presets = [['Klassiek', ['16"', '18"', '20"']], ['Lang', ['20"', '22"', '24"']], ['Extra lang', ['24"', '26"', '28"']], ['Vol (4)', ['18"', '20"', '22"', '24"']]];
  return `${window.appHead('Set samenstellen', 'Jouw bundelset', 'Kies textuur en kleur, stel per bundel de lengte in en voeg eventueel een closure of frontal toe. Je ziet direct prijs en voorraad.', 'bundle')}
  <section class="set-grid sect"><div class="set-vis"><div class="set-stack">${items.map((v, i) => `<div class="set-b" style="--h:${30 + len(v) * 2.2}%;--i:${i}"><div class="sb-hair" style="--c:${SW[v.color] || '#3b2f28'}"></div><span>${esc(v.length)}</span></div>`).join('')}${clV ? `<div class="set-cl"><span>closure</span></div>` : ''}</div><div class="set-total"><small>Totaal set</small><b class="serif num">${eur(tot)}</b><small>${items.length} bundel${items.length === 1 ? '' : 's'}${clV ? ' + ' + esc(clV.p.name) : ''}</small></div></div>
  <div class="stack lg"><div class="fgroup"><b>Textuur</b><div class="chips wrap">${prods.map(x => `<button class="chip" data-act="setP" data-id="${esc(x.id)}" aria-pressed="${x.id === p.id}">${esc(x.texture)}</button>`).join('')}</div></div>
    <div class="fgroup"><b>Kleur</b><div class="opt-row">${cols.map(c => `<button class="opt col" data-act="setC" data-c="${esc(c)}" aria-pressed="${B.c === c}"><i style="--c:${SW[c] || '#888'}"></i>${esc(c)}</button>`).join('')}</div></div>
    <div class="fgroup"><b>Snel kiezen</b><div class="chips wrap">${presets.map(([n, l]) => `<button class="chip" data-act="setPre" data-l="${esc(l.join(','))}">${n} · ${l.join(' ')}</button>`).join('')}</div></div>
    <div class="fgroup"><b>Bundels</b>${B.lens.map((l, i) => { const v = vOf(l); return `<div class="set-row"><span class="num">Bundel ${i + 1}</span><select class="i" data-setlen="${i}" aria-label="Lengte bundel ${i + 1}">${allL.map(x => `<option ${x === l ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><b class="num">${v ? eur(v.priceCents) : '—'}</b><button class="btn quiet sm" data-act="setRm" data-i="${i}" aria-label="Verwijder bundel ${i + 1}" ${B.lens.length < 2 ? 'disabled' : ''}>✕</button></div>`; }).join('')}${B.lens.length < 5 ? '<button class="btn ghost sm" data-act="setAdd" style="justify-self:start">+ Bundel toevoegen</button>' : ''}</div>
    <div class="fgroup"><b>Closure of frontal</b><select class="i" data-setcl><option value="">Geen</option>${cls.map(v => `<option value="${esc(v.id)}" ${v.id === B.cl ? 'selected' : ''}>${esc(v.p.name)} · ${esc(v.label)} · ${eur(v.priceCents)}</option>`).join('')}</select></div>
    ${short.length ? `<p class="note warn">Niet alles is op voorraad: ${esc([...new Set(short.map(v => v.length))].join(', '))}. Die lengtes worden besteld (±${short[0].leadDays} dagen).</p>` : ''}
    <div class="row"><button class="btn" data-act="setCart" ${short.length ? 'disabled' : ''}>Set in winkelwagen · ${eur(tot)}</button><button class="btn ghost" data-act="setBook">Leg klaar bij afspraak</button></div></div></section>`;
}
ACT.setP = d => { U.set.p = d.id; A.render(); };
ACT.setC = d => { U.set.c = d.c; A.render(); };
ACT.setPre = d => { U.set.lens = d.l.split(','); A.render(); };
ACT.setAdd = () => { U.set.lens.push(U.set.lens[U.set.lens.length - 1] || '20"'); A.render(); };
ACT.setRm = d => { U.set.lens.splice(+d.i, 1); A.render(); };
document.addEventListener('change', e => { if (e.target.matches('[data-setlen]')) { U.set.lens[+e.target.dataset.setlen] = e.target.value; A.render(); } if (e.target.matches('[data-setcl]')) { U.set.cl = e.target.value; A.render(); } });
const setItems = () => { const C = call('pub_catalog', {}, true); const p = C.products.find(x => x.id === U.set.p); const ids = U.set.lens.map(l => (p.variants.find(v => v.color === U.set.c && v.length === l) || {}).id).filter(Boolean); if (U.set.cl) ids.push(U.set.cl); return ids; };
ACT.setCart = () => { setItems().forEach(id => addCart(id, 1)); toast('Set toegevoegd aan je winkelwagen'); A.render(); ACT.openCart(); };
ACT.setBook = () => { const ids = setItems(); U.flow = { step: 2, serviceId: 'svc_sewin', variantId: ids[0], extras: [], showHair: true }; ids.slice(1).forEach(id => addCart(id, 1)); toast('De eerste bundel ligt klaar bij je afspraak; de rest staat in je winkelwagen'); go('boeken'); };

/* ---------- winkelwagen (lade) ---------- */
ACT.openCart = () => {
  const C = call('pub_catalog', {}, true); const all = allVariants(C);
  const items = U.cart.map((i, n) => ({ ...i, n, v: all.find(v => v.id === i.variantId) })).filter(i => i.v);
  const sub = items.reduce((a, i) => a + i.qty * i.v.priceCents, 0);
  const M = U.ctok ? call('cli_me', {}, true) : null; const needBraid = M && M.appointments.some(a => ['svc_bun', 'svc_pony_braid'].includes(a.serviceId) && a.start > Date.now()) && !items.some(i => i.v.p.type === 'braiding');
  document.getElementById('overlay').innerHTML = `<div class="scrim drawer-scrim" data-act="closeModal" data-self="1"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Winkelwagen"><div class="bar"><h2 class="serif">Winkelwagen</h2><button class="x" data-act="closeModal" aria-label="Sluiten">${ico('x', 20)}</button></div>
  ${items.length ? `<div class="cart-list">${items.map(i => `<div class="ci">${tile(i.v.p, i.v, 'sm')}<div class="stack" style="gap:2px"><b>${esc(i.v.p.name)}</b><small class="muted">${esc(i.v.label)}</small>${i.v.available < i.qty ? `<small class="warn-t">Nog ${Math.max(0, i.v.available)} op voorraad</small>` : ''}<div class="qty sm"><button data-act="cQ" data-n="${i.n}" data-d="-1" aria-label="Minder">−</button><b>${i.qty}</b><button data-act="cQ" data-n="${i.n}" data-d="1" aria-label="Meer">+</button></div></div><div class="stack" style="gap:6px;justify-items:end"><b class="num">${eur(i.qty * i.v.priceCents)}</b><button class="btn quiet sm" data-act="cRm" data-n="${i.n}">Verwijder</button></div></div>`).join('')}</div>
  ${needBraid ? `<div class="note">Je hebt een Bun of Braided ponytail gepland. Neem pre-stretched hair mee. <button class="btn sm" data-act="addBraid">Voeg toe</button></div>` : ''}
  <div class="cart-foot"><div class="sum"><span>Subtotaal</span><b class="num">${eur(sub)}</b><span class="muted">Verzending</span><span class="muted">berekend bij afrekenen</span></div><a class="btn block" href="#afrekenen" data-act="toCheckout">Afrekenen</a><button class="btn quiet sm" data-act="closeModal" style="justify-self:center">Verder winkelen</button></div>` : `<div class="empty">Je winkelwagen is leeg.</div><a class="btn" href="#shop" data-act="toShop">Naar de shop</a>`}</aside></div>`;
};
ACT.cQ = d => { const it = U.cart[+d.n]; it.qty = Math.max(1, Math.min(10, it.qty + (+d.d))); saveCart(); ACT.openCart(); A.render(); };
ACT.cRm = d => { U.cart.splice(+d.n, 1); saveCart(); ACT.openCart(); A.render(); };
ACT.addBraid = () => { addCart('var_braid_1b', 1); ACT.openCart(); A.render(); };
ACT.toCheckout = () => { closeModal(); go('afrekenen'); };
ACT.toShop = () => { closeModal(); go('shop'); };

/* ---------- afrekenen ---------- */
function checkout(C, M) {
  const all = allVariants(C); const items = U.cart.map(i => ({ ...i, v: all.find(v => v.id === i.variantId) })).filter(i => i.v);
  const K = U.co || (U.co = { type: 'afhalen', country: C.shipping[0].country });
  if (U.orderPay) { return `<section class="done"><h1 class="serif">Betalen</h1><p>Bestelling ${esc(U.orderPay.number)} · ${eur(U.orderPay.total)}</p><div style="max-width:460px;width:100%;text-align:left">${window.payBoxPublic(U.orderPay.payment, 'order')}</div><p class="muted">Artikelen worden 15 minuten voor je vastgehouden.</p></section>`; }
  if (!items.length) return `${window.appHead('Afrekenen', 'Je winkelwagen is leeg', 'Kies eerst iets in de shop.', 'bundle', '<a class="btn" href="#shop" style="justify-self:start">Naar de shop</a>')}`;
  const sub = items.reduce((a, i) => a + i.qty * i.v.priceCents, 0); const ship = K.type === 'bezorgen' ? (C.shipping.find(s => s.country === K.country) || C.shipping[0]).rateCents : 0;
  return `<nav class="crumbs"><a href="#shop">Shop</a> / <span aria-current="page">Afrekenen</span></nav><div class="book-grid co"><form data-form="placeOrder" class="stack lg book-main"><h1 class="serif" style="font-size:clamp(34px,6vw,52px)">Afrekenen</h1>
    <fieldset class="card stack"><legend class="kicker">1 · Jouw gegevens</legend>${M ? `<div class="me-card"><span class="av">${esc(M.client.name.replace(/^Voorbeeldklant /, '').slice(0, 1))}</span><span><b>${esc(M.client.name)}</b><br><small>${esc(M.client.phone)}</small></span></div>` : `<div class="grid2"><label class="f">Naam<input class="i" name="name" autocomplete="name" required></label><label class="f">Telefoonnummer<input class="i" name="phone" type="tel" autocomplete="tel" required></label></div><label class="f">E-mail<input class="i" name="email" type="email" autocomplete="email"></label>`}</fieldset>
    <fieldset class="card stack"><legend class="kicker">2 · Afhalen of bezorgen</legend><div class="choice"><label class="ch ${K.type === 'afhalen' ? 'on' : ''}"><input type="radio" name="type" value="afhalen" ${K.type === 'afhalen' ? 'checked' : ''} data-cotype><span><b>Afhalen in de salon</b><small>${esc((C.address || {}).street || '')}, ${esc((C.address || {}).city || '')} · gratis</small></span></label><label class="ch ${K.type === 'bezorgen' ? 'on' : ''}"><input type="radio" name="type" value="bezorgen" ${K.type === 'bezorgen' ? 'checked' : ''} data-cotype><span><b>Bezorgen</b><small>vanaf ${eur(Math.min(...C.shipping.map(s => s.rateCents)))} · ${C.shipping.map(s => s.country).join(', ')}</small></span></label></div>
      ${K.type === 'bezorgen' ? `<div class="grid2"><label class="f">Land<select class="i" name="country" data-cocountry>${C.shipping.map(s => `<option ${s.country === K.country ? 'selected' : ''}>${esc(s.country)}</option>`).join('')}</select></label><label class="f">Straat en huisnummer<input class="i" name="street" autocomplete="street-address" required></label><label class="f">Postcode<input class="i" name="zip" autocomplete="postal-code" required></label><label class="f">Plaats<input class="i" name="city" autocomplete="address-level2" required></label></div>` : ''}</fieldset>
    <label class="chk"><input type="checkbox" name="terms" required><span>Ik ga akkoord met de leveringsvoorwaarden. <small>(Voorlopige tekst.)</small></span></label>
    ${U.coErr ? `<p class="note bad" role="alert">${esc(U.coErr)}</p>` : ''}<div class="sticky-cta"><a class="btn quiet sm" href="#shop">${ico('back', 18)} Shop</a><button class="btn">Betalen · ${eur(sub + ship)}</button></div></form>
    <aside class="rcpt"><div class="r-head"><span class="kicker">Je bestelling</span><b class="r-total num">${eur(sub + ship)}</b></div><ul class="r-lines">${items.map(i => `<li><span>${i.qty}× ${esc(i.v.p.name)}<br><small class="muted">${esc(i.v.label)}</small></span><span class="num">${eur(i.qty * i.v.priceCents)}</span></li>`).join('')}<li><span>${K.type === 'bezorgen' ? 'Verzending ' + esc(K.country) : 'Afhalen'}</span><span class="num">${ship ? eur(ship) : 'gratis'}</span></li></ul></aside></div>`;
}
document.addEventListener('change', e => { if (!U.co) return; if (e.target.matches('[data-cotype]')) { U.co.type = e.target.value; A.render(); } if (e.target.matches('[data-cocountry]')) { U.co.country = e.target.value; A.render(); } });
ACT.placeOrder = f => {
  U.coErr = null; if (!f.terms) { U.coErr = 'Vink de voorwaarden aan.'; return A.render(); }
  if (!U.ctok) { const r = A.tryCall('pub_client_start', { name: f.name, phone: f.phone, email: f.email }); if (r.err) { U.coErr = r.err.message; return A.render(); } U.ctok = r.ok.token; A.lsSet('jrs_ctok', U.ctok); }
  U.cartKey = U.cartKey || 'ck_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const delivery = U.co.type === 'bezorgen' ? { type: 'bezorgen', country: f.country || U.co.country, address: [f.street, f.zip, f.city].filter(Boolean).join(', ') } : { type: 'afhalen' };
  const r = A.tryCall('cli_order', { items: U.cart, delivery, idempotencyKey: U.cartKey });
  if (r.err) { U.coErr = r.err.message; return A.render(); }
  U.cartKey = null; U.orderPay = { number: r.ok.order.number, total: r.ok.order.totalCents, payment: r.ok.payment }; U.orderPending = r.ok.order.number; A.render();
};

ACT.openProd = d => { const C = call('pub_catalog', {}, true); const p = C.products.find(x => x.id === d.id); closeModal(); if (p) go('product-' + slugP(p.id)); };
/* ---------- routes koppelen ---------- */
const prev = window.renderPage, prevHas = prev.has;
window.renderPage = function (r, C, M) { if (r.startsWith('product-')) return productPage(C, M, r.slice(8)); if (r === 'afrekenen') return checkout(C, M); if (r === 'bundelbouwer') return setBuilder(C); return prev(r, C, M); };
window.renderPage.has = r => r.startsWith('product-') || r === 'afrekenen' || prevHas(r);

/* ---------- bestelstatus voor klanten ---------- */
window.orderTimeline = o => { const steps = o.delivery.type === 'bezorgen' ? ['betaald', 'verzonden', 'geleverd'] : ['betaald', 'klaar', 'afgehaald']; const lab = { betaald: 'Betaald', klaar: 'Klaar om af te halen', verzonden: 'Verzonden', geleverd: 'Geleverd', afgehaald: 'Afgehaald' }; const i = steps.indexOf(o.status);
  return `<ol class="otl">${steps.map((s, j) => `<li class="${j <= i ? 'on' : ''}"><i></i><span>${lab[s]}</span></li>`).join('')}</ol>${o.track ? `<small class="muted">Track &amp; trace: ${esc(o.track)}</small>` : ''}`; };
}
