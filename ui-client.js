/* JR'SBEAUTYBAR — klantomgeving: home, boeken, shop, account, offerte, advies, VIP, chat */
{
const A = window.APP, U = window.U, ACT = window.ACT;
const { call, esc, eur, dt, dlong, dshort, hm, ico, pill, photo, toast, modal, closeModal, go } = A;
const J = A.J;

const SOCIAL = [['Instagram', 'https://www.instagram.com/jr.sbeautybar/'], ['TikTok', 'https://www.tiktok.com/@jr.sbeautybar']];
const firstName = n => String(n || '').replace(/^Voorbeeldklant /, '').split(' ')[0];
const LOOKS = ['Sew-in', 'Pre colored', 'Curls', 'Ponytails', 'HU/HD', 'Bundels'];
const LOOK_SVC = { 'Sew-in': 'svc_sewin', 'Ponytails': 'svc_pony', 'HU/HD': 'svc_halfup' };

function me() { return U.ctok ? call('cli_me', {}, true) : null; }
function cat() { return call('pub_catalog', {}, true); }

window.renderClient = function (r) {
  const C = cat(), M = me();
  const tab = ['boeken', 'advies'].includes(r) ? 'boeken' : ['shop', 'bundelbouwer', 'gids', 'afrekenen'].includes(r) || r.startsWith('product-') ? 'shop' : ['account', 'offerte'].includes(r) ? 'account' : r === 'home' ? 'home' : 'meer';
  const top = [['behandelingen', 'Behandelingen'], ['looks', 'Looks'], ['lookfinder', 'Look-finder'], ['shop', 'Shop'], ['vip', 'VIP']];
  const nav = [['home', 'Home', 'home'], ['boeken', 'Boeken', 'cal'], ['shop', 'Shop', 'bag'], ['account', 'Account', 'user']];
  const cartN = U.cart.reduce((a, i) => a + i.qty, 0);
  let body;
  if (r === 'boeken') body = viewBook(C, M); else if (r === 'shop') body = window.shopView ? window.shopView(C, M) : viewShop(C, M); else if (r === 'account') body = viewAccount(C, M);
  else if (r === 'offerte') body = viewQuote(); else if (r === 'advies') body = viewAdvice(C, M); else if (r === 'vip') body = window.vipPage(C, M, viewVip(C, M)); else if (window.renderPage && window.renderPage.has(r)) body = window.renderPage(r, C, M); else body = viewHome(C, M);
  return `<header class="c-top"><a class="wordmark script" href="#home" aria-label="JR'SBEAUTYBAR, home">JR’s beauty bar</a>
    <nav class="c-nav-top" aria-label="Hoofdmenu">${top.map(([k, l]) => `<a href="#${k}" ${r === k || (k === 'behandelingen' && r.startsWith('behandeling-')) ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <span class="row" style="gap:6px;flex-wrap:nowrap"><a class="btn ghost sm hide-m" href="#account" aria-label="Mijn account">${ico('user', 18)}</a><a class="btn sm hide-m" href="#boeken">Boek nu</a>${cartN ? `<button class="btn ghost sm cart-fab" data-act="openCart" aria-label="Winkelwagen, ${cartN} artikelen">${ico('bag', 18)} ${cartN}</button>` : ''}<button class="btn sm" data-act="openChat" aria-label="Open de chat">${ico('chat', 18)}<span class="hide-s">Chat</span></button><button class="btn ghost sm" data-act="menu" aria-label="Menu openen" aria-expanded="false">${ico('more', 18)}<span class="hide-xs">Menu</span></button></span></header>
    <main class="c-main" id="main">${body}
    ${window.richFooter ? window.richFooter(C) : ''}</main>
    <nav class="c-bot" aria-label="Hoofdmenu">${nav.map(([k, l, i]) => `<a href="#${k}" ${tab === k ? 'aria-current="page"' : ''}>${ico(i)}<span>${l}</span></a>`).join('')}</nav>
`;
};

/* ---------- HOME ---------- */
function nextFree(C) { let d = A.todayISO(); for (let i = 0; i < 21; i++, d = J.addDays(d, 1)) { if (!(C.hours[J.weekday(d)] || []).length) continue; const r = call('pub_slots', { serviceId: 'svc_sewin', date: d }, true); if (r && r.slots.length) return r.slots[0].start; } return null; }
function viewHome(C, M) {
  const name = M ? firstName(M.client.name) : null;
  const next = M && M.appointments.find(a => ['confirmed', 'hold', 'offered', 'option'].includes(a.status) && a.start > Date.now());
  const offer = M && M.appointments.find(a => a.status === 'offered');
  const look = U.sel.look || 'Alle';
  const items = C.media.filter(m => m.kind !== 'product' && m.type !== 'video' && (look === 'Alle' || m.subject === look || m.highlight === look));
  const heroes = C.media.filter(m => m.type !== 'video' && A.safeSrc(m.dataUrl)).sort((a, b) => (b.kind === 'hero') - (a.kind === 'hero')).slice(0, 6);
  const nf = nextFree(C); const fees = (C.surcharges || []).filter(x => x.to >= A.todayISO());
  const pop = ['svc_sewin', 'svc_sewin_glam', 'svc_pony', 'svc_halfup', 'svc_qw_glam', 'svc_silk'].map(id => C.services.find(x => x.id === id)).filter(Boolean);
  const minOf = k => Math.min(...C.services.filter(x => x.category === k && x.bookable).map(x => x.priceCents));
  return `${window.feedHome(C, M, nf)}<div class="after-feed">
  <section class="imm" id="imm" hidden>${heroes.length ? `<div class="imm-bg hero-slides" aria-hidden="true">${heroes.map((m, i) => `<img src="${esc(m.dataUrl)}" alt="" class="${i ? '' : 'on'}" style="object-position:${esc(m.focus || '50% 30%')}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('')}</div>` : `<div class="imm-bg">${window.hairArt('hero', { dark: true })}</div>`}
    <div class="imm-shade"></div>
    <div class="imm-in"><p class="imm-kick">${name ? 'Welkom terug, ' + esc(name) : 'Hair studio · Rotterdam · Wereldwijde verzending'}</p>
      <h1 class="imm-logo" aria-label="JR’s beauty bar"><span>JR’s</span> <span>beauty bar</span></h1>
      <p class="imm-tag">Sew-ins · Quick weaves · Ponytails · Half up half down · Silk press</p>
      <div class="row imm-cta"><a class="btn light" href="#boeken">Boek nu</a><a class="btn line-light" href="#behandelingen">Bekijk het menu</a></div>
      ${nf ? `<a class="live" href="#boeken" data-act="quickNext" data-t="${nf}"><i></i>Eerstvolgende plek: <b>${esc(dt(nf))}</b></a>` : ''}</div>
    <div class="imm-scroll" aria-hidden="true"><span></span></div></section>
  ${window.highlightsRow(C)}
  ${fees.length ? `<div class="fee-band">${fees.map(f => `✦ <b>${esc(f.label)}</b> +${eur(f.cents)} · ${esc(dshort(J.amsToUtc(f.from, '12:00')))} t/m ${esc(dshort(J.amsToUtc(f.to, '12:00')))}`).join(' ')}</div>` : ''}
  ${offer ? `<div class="note warn" style="margin-top:20px"><b>Er is een plek vrijgekomen:</b> ${esc(offer.service)} op ${esc(dt(offer.start))}. Nog <span data-until="${offer.offerExpires}"></span> min geldig. <span class="row" style="margin-top:8px"><button class="btn sm" data-act="acceptOffer" data-id="${esc(offer.id)}">Plek aannemen</button><button class="btn quiet sm" data-act="declineOffer" data-id="${esc(offer.id)}">Nee, dank je</button></span></div>` : ''}
  ${next ? `<div style="margin-top:20px">${nextCard(next)}</div>` : ''}
  <section class="sect stack"><div class="row between"><div><span class="kicker">Meest geboekt</span><h2>Populair in de salon</h2></div><a class="btn quiet sm" href="#behandelingen">Hele menu →</a></div>
    <div class="rail pop" id="poprail">${pop.map(x => { const ph = svcPhoto(C, x); return `<article class="pop-c"><a href="#behandeling-${esc(x.id.replace(/^svc_/, ''))}" class="pop-ph">${ph ? `<img src="${esc(ph.dataUrl)}" alt="${esc(ph.caption || x.name)}" loading="lazy" style="object-position:${esc(ph.focus || '50% 30%')}">` : window.hairArt(window.lookArt(x.name), { seed: x.id })}<span class="pop-dur">${x.durationMin} min</span></a><div class="pop-b"><b>${esc(x.name)}</b><span class="num">${eur(x.priceCents)}</span></div>${x.desc ? `<small class="muted">${esc(x.desc)}</small>` : ''}<button class="btn sm block" data-act="pickSvcGo" data-id="${esc(x.id)}">Boek</button></article>`; }).join('')}</div></section>
  <section class="sect stack"><div><span class="kicker">Het menu</span><h2>Kies je categorie</h2></div><div class="cat-tiles">${window.BCATS.map(([k, l]) => { const ph = C.media.find(m => m.type !== 'video' && ({ weave: 'Sew-in', ponytails: 'Ponytails', halfup: 'Cliënt view', natural: 'Bundels', styling: 'Cliënt view' })[k] === m.highlight && m.id !== (C.media[0] || {}).id); const mn = minOf(k); return `<a class="cat-t" href="#behandelingen" data-act="catGo" data-c="${k}">${ph ? `<img src="${esc(ph.dataUrl)}" alt="" loading="lazy" style="object-position:${esc(ph.focus || '50% 30%')}">` : window.hairArt('waves', { dark: true, seed: k })}<span><b class="serif">${esc(l)}</b>${isFinite(mn) ? `<small>vanaf ${eur(mn)}</small>` : ''}</span></a>`; }).join('')}</div></section>
  ${window.reelsRail(C)}
  <section class="sect stack" aria-labelledby="pf"><div class="row between"><div><span class="kicker">Portfolio</span><h2 id="pf">Kies je look</h2></div><a class="btn quiet sm" href="#looks">Alle looks →</a></div>
    <div class="chips" role="group" aria-label="Filter looks">${['Alle', 'Sew-in', 'Ponytails', 'Bundels', 'Cliënt view', 'Curls'].map(l => `<button class="chip" data-act="look" data-l="${esc(l)}" aria-pressed="${look === l}">${esc(l)}</button>`).join('')}</div>
    ${items.length ? `<div class="gallery">${items.slice(0, 8).map(m => `<a class="look" href="#${m.serviceId ? 'boeken' : 'advies'}" data-act="lookOpen" data-s="${esc(m.serviceId || '')}" data-peek="${esc(m.dataUrl)}">${photo(m)}<b>${esc(m.highlight || m.subject)}</b><span class="muted">${esc(m.caption || '')}</span></a>`).join('')}</div>` : '<div class="empty">Nog geen looks in deze categorie.</div>'}</section>
  ${window.beforeAfter(C)}
  ${window.discoverBand()}
  <section class="sect"><a class="loc-card" href="#contact"><span class="loc-pin">${ico('home', 20)}</span><span><b class="serif" style="font-size:22px">Kom langs in Rotterdam</b><br><small class="muted">${esc((C.address || {}).street || '')}, ${esc((C.address || {}).zip || '')} ${esc((C.address || {}).city || '')} · op afspraak</small></span>${ico('chev', 18)}</a></section>
  <section class="sect"><div class="vipband"><span class="kicker" style="color:#d6b293">VIP Spots</span><h2>Eerder toegang tot de beste plekken</h2>
    <p>VIP-klanten zien geselecteerde plekken eerder en kunnen ruim vooruit een datum aanvragen voor een bruiloft of fotoshoot.</p>
    <div class="row"><a class="btn light sm" href="#vip">${M && M.client.vip ? 'Vraag een datum aan' : 'Meer over VIP'}</a>${M && M.client.vip ? pill('ok', 'Jij bent VIP') : ''}</div></div></section>
  ${window.feedGrid(C)}
  <details class="d sect"><summary>Zet JR’s beauty bar op je beginscherm</summary><div><p><b>iPhone/iPad (Safari):</b> tik op Deel en kies “Zet op beginscherm”.</p><p><b>Android (Chrome):</b> tik op ⋮ en kies “Toevoegen aan startscherm”.</p><p class="muted">Je hoeft niets te downloaden.</p></div></details></div>`;
}
ACT.quickNext = d => { U.flow = { step: 4, serviceId: 'svc_sewin', extras: [], date: J.amsParts(+d.t).date, start: +d.t }; go('boeken'); };
ACT.catGo = d => { U.sel.bcat = d.c; go('behandelingen'); setTimeout(() => { const el = document.getElementById('cat-' + d.c); if (el) el.scrollIntoView({ block: 'start' }); }, 60); };
function nextCard(a) {
  const restOpen = a.totalCents - 0;
  return `<section class="card next" style="margin-bottom:16px" aria-label="Je volgende afspraak"><div class="head"><h3>Je volgende afspraak</h3>${pill(a.status)}</div>
    <p style="font-size:18px;font-weight:800">${esc(dt(a.start))}</p><p>${esc(a.service)}${a.variant ? ' · ' + esc(a.variant) : ''}</p>
    ${a.status === 'hold' ? `<p class="note warn">Rond je aanbetaling af binnen <span data-until="${a.holdExpires}"></span> minuten.</p>` : ''}
    <div class="row"><a class="btn ghost sm" href="#account">Bekijk of wijzig</a></div></section>`;
}
ACT.pickSvcGo = d => { U.flow = { step: 2, serviceId: d.id }; go('boeken'); };
ACT.look = d => { U.sel.look = d.l; A.render(); };
ACT.lookOpen = d => { if (d.s) { U.flow = { step: 2, serviceId: d.s }; go('boeken'); } else go('advies'); };

/* ---------- BOEKEN ---------- */
const STEPS = ['Behandeling', 'Details', 'Variant', 'Tijd', 'Controle', 'Betalen', 'Bevestigd'];
const BCATS = [['weave', 'Weave'], ['ponytails', 'Ponytails / Bun'], ['halfup', 'Half up half down'], ['natural', 'Natural hair'], ['styling', 'Styling only']];
window.BCATS = BCATS;
const svcPhoto = (C, s) => C.media.find(m => m.serviceId === s.id && m.type !== 'video') || C.media.find(m => m.type !== 'video' && ({ weave: 'Sew-in', ponytails: 'Ponytails', halfup: 'HU/HD', natural: 'Cliënt view', styling: 'Cliënt view' })[s.category] === m.highlight);
window.svcPhoto = svcPhoto;
function feeFor(C, ms) { const d = J.amsParts(ms).date; return (C.surcharges || []).find(x => d >= x.from && d <= x.to) || null; }
function receipt(C, F, s, compact) {
  if (!s) return `<aside class="rcpt empty-r"><span class="kicker">Jouw afspraak</span><p class="muted">Kies een behandeling om te beginnen.</p></aside>`;
  const ex = (F.extras || []).map(id => C.services.find(x => x.id === id)).filter(Boolean);
  const v = F.variantId && C.products.flatMap(p => p.variants.map(x => ({ ...x, product: p.name }))).find(x => x.id === F.variantId);
  const fee = F.start ? feeFor(C, F.start) : null;
  const mins = s.durationMin + ex.reduce((t, x) => t + x.durationMin, 0);
  const tot = s.priceCents + ex.reduce((t, x) => t + x.priceCents, 0) + (v ? v.priceCents : 0) + (fee ? fee.cents : 0);
  const next = F.step === 2 ? 'flowNext' : F.step === 4 && F.start ? 'flowNext' : F.step === 3 ? 'flowNext' : null;
  return `<aside class="rcpt${compact ? ' compact' : ''}" aria-label="Jouw afspraak"><div class="r-head"><span class="kicker">Jouw afspraak</span><b class="r-total num">${eur(tot)}</b></div>
    <ul class="r-lines"><li><span>${esc(s.name)}</span><span class="num">${eur(s.priceCents)}</span></li>${ex.map(x => `<li><span>+ ${esc(x.name)}</span><span class="num">${eur(x.priceCents)}</span></li>`).join('')}${v ? `<li><span>${esc(v.product)} · ${esc(v.label)}</span><span class="num">${eur(v.priceCents)}</span></li>` : ''}${fee ? `<li class="fee"><span>${esc(fee.label)}</span><span class="num">${eur(fee.cents)}</span></li>` : ''}</ul>
    <div class="r-meta"><span>${ico('cal', 16)} ${F.start ? esc(dt(F.start)) : 'Nog geen tijd gekozen'}</span><span>⏱ ${Math.floor(mins / 60) ? Math.floor(mins / 60) + ' u ' : ''}${mins % 60 ? mins % 60 + ' min' : ''}</span></div>
    ${next ? `<button class="btn block" data-act="${next}">${F.step === 4 ? 'Gegevens invullen' : F.step === 3 ? 'Kies een tijd' : 'Kies een tijd'}</button>` : ''}</aside>`;
}
function stepper(F, s) {
  const L = [['Dienst', 1], ['Extra’s', 2], ['Tijd', 4], ['Gegevens', 5], ['Klaar', 7]];
  return `<ol class="stepper" aria-label="Stappen">${L.map(([l, n], i) => `<li class="${F.step >= n ? 'done' : ''} ${F.step === n || (n === 2 && F.step === 3) || (n === 5 && F.step === 6) ? 'on' : ''}"><i>${F.step > n && !(n === 2 && F.step === 3) ? '✓' : i + 1}</i><span>${l}</span></li>`).join('')}</ol>`;
}
function viewBook(C, M) {
  const F = U.flow; const s = F.serviceId && C.services.find(x => x.id === F.serviceId);
  if (C.leadingAgenda === 'salonized') return `<h1>Boeken</h1><div class="note" style="margin-top:12px">In deze overgangsfase is de huidige boekingspagina leidend, zodat er geen dubbele boekingen ontstaan.</div><p><a class="btn" href="${esc(C.salonizedUrl)}" rel="noopener">Naar de boekingspagina</a></p>`;
  const back = F.step > 1 && F.step < 6 ? `<button class="btn quiet sm" data-act="flowBack">${ico('back', 18)} Terug</button>` : '';
  const fees = (C.surcharges || []).filter(x => x.to >= A.todayISO());
  let body = '';
  if (F.step === 1) {
    const cat = U.sel.bcat || 'weave'; const q = (U.sel.bq || '').toLowerCase();
    const list = C.services.filter(x => x.bookable && !x.extra && (q ? (x.name + ' ' + (x.desc || '')).toLowerCase().includes(q) : x.category === cat));
    body = `<header class="b-head"><h1 class="serif">Kies je behandeling</h1>${fees.map(f => `<p class="fee-chip">✦ ${esc(f.label)}: +${eur(f.cents)} · ${esc(dshort(J.amsToUtc(f.from, '12:00')))} t/m ${esc(dshort(J.amsToUtc(f.to, '12:00')))}</p>`).join('')}</header>
      <div class="b-tools"><label class="search"><span class="sr">Zoek een dienst</span>${ico('search', 18)}<input class="i" placeholder="Zoek een dienst…" value="${esc(U.sel.bq || '')}" data-bq></label>
      <div class="tabs" role="tablist">${BCATS.map(([k, l]) => `<button role="tab" class="tab" data-act="bcat" data-c="${k}" aria-selected="${!q && cat === k}">${l}</button>`).join('')}</div></div>
      <div class="svc-list">${list.map(x => { const ph = svcPhoto(C, x); return `<button class="svc-row" data-act="pickSvc" data-id="${esc(x.id)}" aria-pressed="${F.serviceId === x.id}"><span class="sr-ph">${ph ? `<img src="${esc(ph.dataUrl)}" alt="" loading="lazy" style="object-position:${esc(ph.focus || '50% 30%')}">` : window.hairArt(window.lookArt(x.name), { seed: x.id })}</span><span class="sr-txt"><b>${esc(x.name)}</b><small>${x.durationMin} minuten${x.desc ? ' · ' + esc(x.desc) : ''}</small>${x.warn ? `<small class="warn-t">${esc(x.warn)}</small>` : ''}</span><span class="sr-price num">${eur(x.priceCents)}</span><span class="sr-add" aria-hidden="true">${F.serviceId === x.id ? '✓' : '+'}</span></button>`; }).join('') || '<div class="empty">Geen behandeling gevonden.</div>'}</div>`;
  } else if (F.step === 2 || F.step === 3) {
    const ex = C.services.filter(x => x.extra && x.bookable); const ph = svcPhoto(C, s);
    const showHair = F.step === 3 || F.showHair;
    const bundles = C.products.filter(p => p.category === 'Haarbundels').flatMap(p => p.variants.map(v => ({ ...v, product: p.name })));
    body = `<section class="b-detail"><div class="bd-ph">${ph ? `<img src="${esc(ph.dataUrl)}" alt="${esc(ph.caption || s.name)}" style="object-position:${esc(ph.focus || '50% 30%')}">` : window.hairArt(window.lookArt(s.name), { seed: s.id })}</div>
      <div class="stack"><span class="kicker">${esc((BCATS.find(c => c[0] === s.category) || [, ''])[1])}</span><h1 class="serif">${esc(s.name)}</h1><div class="row" style="gap:8px">${pill('info', s.durationMin + ' minuten')}<b class="serif" style="font-size:28px">${eur(s.priceCents)}</b></div>
      ${s.desc ? `<p>${esc(s.desc)}</p>` : ''}${s.warn ? `<p class="note warn">${esc(s.warn)}</p>` : ''}${s.prep ? `<p class="note"><b>Voorbereiding:</b> ${esc(s.prep)}</p>` : ''}${s.supplies ? `<p class="note"><b>Benodigdheden:</b> ${esc(s.supplies)} — neem je eigen haar mee of bestel het in de shop.</p>` : ''}</div></section>
      <section class="sect stack"><div><span class="kicker">Extra’s</span><h2>Maak het compleet</h2></div><div class="extras">${ex.map(x => { const on = (F.extras || []).includes(x.id); return `<button class="xtra" data-act="toggleExtra" data-id="${esc(x.id)}" aria-pressed="${on}"><span class="x-chk">${on ? '✓' : '+'}</span><span><b>${esc(x.name)}</b><small>${x.durationMin} min${x.desc ? ' · ' + esc(x.desc) : ''}</small></span><b class="num">${eur(x.priceCents)}</b></button>`; }).join('')}</div></section>
      ${s.allowVariant ? `<section class="sect stack"><div class="row between"><div><span class="kicker">Optioneel</span><h2>Haar laten klaarleggen</h2></div>${showHair ? '' : '<button class="btn ghost sm" data-act="showHair">Bekijk bundels</button>'}</div>${showHair ? `<p class="muted">Liever je eigen haar? Dan sla je dit over.</p><div class="rail">${bundles.map(v => `<button class="bundle-card pick" data-act="pickVar" data-id="${esc(v.id)}" aria-pressed="${F.variantId === v.id}"><div class="bc-art">${window.hairArt('bundle', { color: v.color, seed: v.id })}</div><b>${esc(v.label)}</b><small class="muted">${esc(v.product)}</small><span class="row between"><b>${eur(v.priceCents)}</b>${v.available > 0 ? pill('ok', 'Op voorraad') : pill('', 'Op bestelling')}</span></button>`).join('')}</div>${F.variantId ? '<button class="btn quiet sm" data-act="clearVar">Toch zonder bundel</button>' : ''}` : '<p class="muted">Je kunt ook je eigen haar meenemen.</p>'}</section>` : ''}
      <div class="sticky-cta">${back}<button class="btn" data-act="toTime">Kies een tijd</button></div>`;
  } else if (F.step === 4) {
    const days = []; let d = A.todayISO(); for (let i = 0; i < 35; i++) { days.push(d); d = J.addDays(d, 1); }
    const cnt = {}; for (const x of days) cnt[x] = (C.hours[J.weekday(x)] || []).length ? ((call('pub_slots', { serviceId: s.id, date: x, variantId: F.variantId, extras: F.extras }, true) || { slots: [] }).slots.length) : -1;
    if (!F.date || !cnt[F.date]) F.date = days.find(x => cnt[x] > 0) || days[0];
    const res = call('pub_slots', { serviceId: s.id, date: F.date, variantId: F.variantId, extras: F.extras }, true) || { slots: [] };
    const parts = [['Ochtend', x => J.amsParts(x.start).hh < 12], ['Middag', x => { const h = J.amsParts(x.start).hh; return h >= 12 && h < 17; }], ['Avond', x => J.amsParts(x.start).hh >= 17]];
    body = `<header class="b-head"><h1 class="serif">Wanneer kom je?</h1><p class="muted">${esc(s.name)}${(F.extras || []).length ? ' + ' + F.extras.length + ' extra' : ''} · tijden zijn inclusief afronding</p></header>
      ${res.surcharge ? `<p class="fee-chip">✦ ${esc(res.surcharge.label)}: +${eur(res.surcharge.cents)} op deze datum</p>` : ''}
      <div class="days2" role="group" aria-label="Kies een dag">${days.map(x => { const t = J.amsToUtc(x, '12:00'), n = cnt[x]; return `<button class="day2" data-act="pickDay" data-d="${x}" aria-pressed="${F.date === x}" ${n <= 0 ? 'disabled' : ''} aria-label="${esc(dlong(t))}${n > 0 ? ', ' + n + ' tijden vrij' : ', vol of gesloten'}"><small>${esc(new Intl.DateTimeFormat('nl-NL', { timeZone: J.TZ, weekday: 'short' }).format(t))}</small><b>${+x.slice(8)}</b><small>${esc(new Intl.DateTimeFormat('nl-NL', { timeZone: J.TZ, month: 'short' }).format(t))}</small><i class="av-dot ${n > 6 ? 'hi' : n > 0 ? 'lo' : ''}"></i></button>`; }).join('')}</div>
      <h3 style="margin:18px 0 10px">${esc(dlong(J.amsToUtc(F.date, '12:00')))}</h3>
      ${res.slots.length ? parts.map(([l, f]) => { const ps = res.slots.filter(f); return ps.length ? `<div class="part"><span class="kicker">${l}</span><div class="slots">${ps.map(x => `<button class="slot" data-act="pickSlot" data-t="${x.start}" aria-pressed="${F.start === x.start}">${x.time}${x.vip ? '<small>VIP</small>' : ''}</button>`).join('')}</div></div>` : ''; }).join('')
        : `<div class="empty">Geen vrije tijden op deze dag. <button class="btn quiet sm" data-act="wlFromFlow">Zet je op de wachtlijst</button></div>`}
      <div class="sticky-cta">${back}<button class="btn" data-act="flowNext" ${F.start ? '' : 'disabled'}>Gegevens invullen</button></div>`;
  } else if (F.step === 5) {
    const ex = (F.extras || []).map(id => C.services.find(x => x.id === id)).filter(Boolean);
    const v = F.variantId && C.products.flatMap(p => p.variants).find(x => x.id === F.variantId); const fee = feeFor(C, F.start);
    const total = s.priceCents + ex.reduce((t, x) => t + x.priceCents, 0) + (v ? v.priceCents : 0) + (fee ? fee.cents : 0); const dep = Math.min(total, s.depositCents + (v && s.needsVariant ? v.priceCents : 0));
    body = `<header class="b-head"><h1 class="serif">Bijna klaar</h1><p class="muted">${esc(dt(F.start))} · ${esc(s.name)}</p></header><form data-form="confirmBooking" class="stack lg" novalidate>
      ${M ? `<div class="me-card"><span class="av">${esc(M.client.name.replace(/^Voorbeeldklant /, '').slice(0, 1))}</span><span><b>${esc(M.client.name)}</b><br><small>${esc(M.client.phone)}</small></span></div>` : `<div class="grid2"><label class="f">Naam<input class="i" name="name" autocomplete="name" required></label><label class="f">Telefoonnummer<input class="i" name="phone" type="tel" inputmode="tel" autocomplete="tel" required></label></div><label class="f">E-mail (optioneel)<input class="i" name="email" type="email" autocomplete="email"></label>`}
      ${s.warn ? `<label class="chk"><input type="checkbox" name="qw" required><span>Ik begrijp dat een quick weave niet hetzelfde is als een sew-in.</span></label>` : ''}
      ${s.prep || s.supplies ? `<p class="note">${s.prep ? '<b>Voorbereiding:</b> ' + esc(s.prep) + ' ' : ''}${s.supplies ? '<b>Neem mee:</b> ' + esc(s.supplies) : ''}</p>` : ''}
      <label class="f">Opmerking voor de salon (optioneel)<textarea class="i" name="note" maxlength="500" placeholder="Bijv. lengte of kleur die je meeneemt"></textarea></label>
      <label class="chk"><input type="checkbox" name="terms" required><span>Ik ga akkoord met de voorwaarden: annuleren of verplaatsen kan tot 48 uur vooraf. <small>(Voorlopige tekst, door de salon te bevestigen.)</small></span></label>
      ${F.error ? `<p class="note bad" role="alert">${esc(F.error)}</p>` : ''}
      <div class="sticky-cta">${back}<span class="row"><b class="num">${eur(total)}</b><button class="btn" type="submit">${dep ? 'Naar betalen' : 'Afspraak vastleggen'}</button></span></div></form>`;
  } else if (F.step === 6) {
    const a = M && M.appointments.find(x => x.id === F.appointmentId);
    if (!a || a.status === 'expired') body = `<h1>Reservering verlopen</h1><p class="note warn" style="margin-top:12px">De tijd voor betalen is verstreken. Je plek is weer vrijgegeven; er is niets afgeschreven.</p><button class="btn" data-act="restartAt4">Kies opnieuw een tijd</button>`;
    else if (a.status === 'confirmed') { F.step = 7; return viewBook(C, M); }
    else if (a.status === 'exception') body = `<h1>Betaling ontvangen</h1><p class="note warn" style="margin-top:12px">Je betaling kwam binnen nadat de reservering was verlopen. Je afspraak is daardoor <b>nog niet bevestigd</b>. De salon neemt contact met je op.</p><a class="btn" href="#account">Naar mijn account</a>`;
    else body = `<h1 class="serif">Aanbetaling</h1><p class="muted">Je plek blijft nog <b><span data-until="${a.holdExpires}"></span></b> minuten voor je vastgehouden.</p>${payBox(F.payment, 'flow')}${F.error ? `<p class="note bad" role="alert">${esc(F.error)}</p>` : ''}`;
  } else if (F.step === 7) {
    const a = M && M.appointments.find(x => x.id === F.appointmentId); const sv = a && C.services.find(x => x.id === a.serviceId);
    const post = M && M.payments.find(p => p.id === F.appointmentId);
    body = `<section class="done"><svg class="tick" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36"/><path d="M24 41l11 11 22-24"/></svg><h1 class="serif">Je afspraak staat vast</h1><p class="done-when">${esc(dt(a.start))}</p><p>${esc(a.service)}${(a.extras || []).length ? ' + ' + a.extras.length + ' extra' : ''}</p>
      <div class="card stack" style="text-align:left;max-width:460px;width:100%"><div class="sum"><span>Kom om</span><b class="num">${esc(hm(a.start))}</b><span>Adres</span><span>${esc((C.address || {}).street || '')}, ${esc((C.address || {}).zip || '')} ${esc((C.address || {}).city || '')}</span>${a.surcharge ? `<span>${esc(a.surcharge.label)}</span><span class="num">${eur(a.surcharge.cents)}</span>` : ''}<span>Te betalen bij de afspraak</span><b class="num">${eur(post ? post.open : a.totalCents)}</b></div>
      ${sv && (sv.prep || sv.supplies) ? `<p class="note">${sv.prep ? '<b>Voorbereiding:</b> ' + esc(sv.prep) + ' ' : ''}${sv.supplies ? '<b>Neem mee:</b> ' + esc(sv.supplies) : ''}</p>` : ''}<p class="muted">Je ontvangt een bevestiging en een dag vooraf een herinnering.</p></div>
      <div class="row" style="justify-content:center"><a class="btn" href="#account">Mijn afspraken</a><button class="btn ghost" data-act="newFlow">Nog een afspraak</button></div></section>`;
  }
  const side = F.step >= 2 && F.step <= 5;
  return `${F.step < 7 ? stepper(F, s) : ''}<div class="${side ? 'book-grid' : ''}"><div class="book-main">${body}</div>${side ? receipt(C, F, s) : ''}</div>`;
}
ACT.bcat = d => { U.sel.bcat = d.c; U.sel.bq = ''; A.render(); };
document.addEventListener('input', e => { if (e.target.matches('[data-bq]')) { U.sel.bq = e.target.value; clearTimeout(U.bqT); U.bqT = setTimeout(() => { A.render(); const i = document.querySelector('[data-bq]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); } });
ACT.toggleExtra = d => { const F = U.flow; F.extras = F.extras || []; F.extras = F.extras.includes(d.id) ? F.extras.filter(x => x !== d.id) : [...F.extras, d.id]; F.start = null; A.render(); };
ACT.showHair = () => { U.flow.showHair = true; A.render(); };
ACT.clearVar = () => { U.flow.variantId = null; A.render(); };
ACT.toTime = () => { U.flow.step = 4; U.flow.error = null; A.render(); };
ACT.pickSvc = d => { const keep = U.flow && U.flow.extras; U.flow = { step: 2, serviceId: d.id, extras: keep || [] }; A.render(); window.scrollTo(0, 0); };
ACT.pickVar = d => { U.flow.variantId = U.flow.variantId === d.id ? null : d.id; U.flow.start = null; A.render(); };
ACT.skipVar = () => { U.flow.variantId = null; U.flow.step = 4; A.render(); };
ACT.pickDay = d => { U.flow.date = d.d; U.flow.start = null; A.render(); };
ACT.pickSlot = d => { U.flow.start = +d.t; A.render(); };
ACT.newFlow = () => { U.flow = { step: 1 }; A.render(); };
ACT.restartAt4 = () => { U.flow.step = 4; U.flow.start = null; U.flow.error = null; A.render(); };
ACT.flowBack = () => { const F = U.flow; F.step = F.step === 4 ? 2 : F.step - 1; F.error = null; A.render(); };
ACT.flowNext = () => { const F = U.flow; F.step = F.step <= 3 ? 4 : F.step + 1; F.error = null; A.render(); window.scrollTo(0, 0); };
ACT.confirmBooking = (f) => {
  const F = U.flow;
  if (!f.terms) { F.error = 'Vink de voorwaarden aan om verder te gaan.'; return A.render(); }
  if (!U.ctok) { const r = A.tryCall('pub_client_start', { name: f.name, phone: f.phone, email: f.email, channel: 'webchat' }); if (r.err) { F.error = r.err.message; return A.render(); } U.ctok = r.ok.token; A.lsSet('jrs_ctok', U.ctok); }
  if (document.querySelector('[name=qw]') && !f.qw) { F.error = 'Bevestig dat je de juiste dienst hebt gekozen.'; return A.render(); }
  const r = A.tryCall('cli_book', { serviceId: F.serviceId, start: F.start, variantId: F.variantId, extras: F.extras || [], note: f.note });
  if (r.err) { F.error = r.err.message; if (r.err.code === 'SLOT_TAKEN') { F.step = 4; F.start = null; toast(r.err.message + ' Kies een andere tijd.', true); } if (r.err.code === 'INTAKE_FIRST') { U.flow = { step: 2, serviceId: 'svc_intake' }; toast('Voor deze behandeling plannen we eerst een intake.', true); } return A.render(); }
  F.appointmentId = r.ok.appointment.id; F.payment = r.ok.payment; F.step = r.ok.payment ? 6 : 7; A.render();
};
ACT.wlFromFlow = () => { if (!U.ctok) { toast('Ga eerst verder via Mijn account, dan zetten we je op de wachtlijst.'); return go('account'); } openWaitlist(U.flow.serviceId); };

/* betaalvak: testomgeving van de betaalprovider */
function payBox(p, ctx) {
  if (!p) return '';
  return `<div class="card stack" style="margin-top:12px"><div class="head"><h3>Betalen ${eur(p.amountCents)}</h3>${pill('pending', 'Testomgeving')}</div>
    <p class="muted">In de live versie opent hier de beveiligde betaalpagina van de provider (bijv. iDEAL). Je afspraak wordt pas bevestigd na een geverifieerde bevestiging van de provider.</p>
    <button class="btn block" data-act="testPay" data-ref="${esc(p.providerRef)}" data-s="paid" data-ctx="${ctx}">Betaal ${eur(p.amountCents)} (test: geslaagd)</button>
    <div class="row"><button class="btn ghost sm" data-act="testPay" data-ref="${esc(p.providerRef)}" data-s="failed" data-ctx="${ctx}">Test: betaling mislukt</button><button class="btn ghost sm" data-act="testLate" data-ref="${esc(p.providerRef)}" data-ctx="${ctx}">Test: bevestiging te laat</button></div></div>`;
}
ACT.testPay = d => {
  const r = A.tryCall('pub_test_checkout', { providerRef: d.ref, status: d.s });
  if (r.err) { toast(r.err.message, true); return; }
  if (d.s === 'failed') { toast('Betaling mislukt — je kunt het opnieuw proberen', true); const n = A.tryCall('cli_pay_retry', { providerRef: d.ref }); if (n.ok) { if (d.ctx === 'flow') { U.flow.payment = n.ok; U.flow.error = 'De betaling is mislukt. Je plek blijft vastgehouden zolang de teller loopt; probeer het opnieuw.'; } else if (d.ctx !== 'acc') modal('Opnieuw betalen', payBox(n.ok, d.ctx)); } else if (n.err && d.ctx === 'flow') U.flow.error = n.err.message; }
  else { toast('Betaling ontvangen'); if (d.ctx === 'order') { U.cart = []; A.lsSet('jrs_cart', '[]'); U.orderDone = U.orderPending; U.orderPending = null; U.orderPay = null; U.co = null; closeModal(); if (A.route() === 'afrekenen') { go('account'); return; } } if (d.ctx === 'quote') closeModal(); if (d.ctx === 'link') closeModal(); }
  A.render();
};
ACT.testLate = d => { // test: laat de reservering verlopen en stuur daarna de bevestiging
  const p = A.E.state.payments.find(x => x.providerRef === d.ref); if (!p) return;
  const ref = A.E.state.appointments.find(x => x.id === p.refId) || A.E.state.orders.find(x => x.id === p.refId); if (ref) ref.holdExpires = Date.now() - 1000;
  ACT.testPay({ ref: d.ref, s: 'paid', ctx: d.ctx });
};

window.payBoxPublic = (p, ctx) => payBox(p, ctx);
/* ---------- ADVIES / INTAKE ---------- */
function viewAdvice(C, M) {
  const ph = U.sel.photos || [];
  return `${window.appHead('Advies', 'Advies bij een foto', 'Vertel wat je wilt en voeg eventueel foto’s toe van je huidige haar en de gewenste look. Zo kan de salon je goed adviseren.', 'straight')}
  <form data-form="sendIntake" class="stack lg" style="margin-top:14px" novalidate>
    ${M ? '' : `<div class="grid2"><label class="f">Naam<input class="i" name="name" autocomplete="name" required></label><label class="f">Telefoonnummer<input class="i" name="phone" type="tel" autocomplete="tel" required></label></div>`}
    <div class="grid2"><label class="f">Huidige haarlengte<select class="i" name="length"><option>Kort</option><option>Schouderlengte</option><option>Lang</option></select></label>
    <label class="f">Gewenste kleur<input class="i" name="color" placeholder="bijv. 1B natuurzwart"></label>
    <label class="f">Gewenste lengte<input class="i" name="wantLength" placeholder="bijv. 22 inch"></label>
    <label class="f">Textuur<select class="i" name="texture"><option>Straight</option><option>Body wave</option><option>Curly</option><option>Weet ik nog niet</option></select></label></div>
    <label class="f">Wat wil je laten doen?<textarea class="i" name="wish" placeholder="Bijvoorbeeld: sew-in voor een bruiloft in juni"></textarea></label>
    <div class="grid2"><label class="f">Foto van je huidige haar<input class="i" type="file" accept="image/*" data-photo="huidig"></label><label class="f">Foto van de gewenste look<input class="i" type="file" accept="image/*" data-photo="gewenst"></label></div>
    ${ph.length ? `<div class="thumbs">${ph.map((p, i) => `<figure style="margin:0"><img src="${esc(p.dataUrl)}" alt="Foto ${esc(p.kind)}"><figcaption class="muted">${esc(p.kind)} <button class="btn quiet sm" data-act="rmPhoto" data-i="${i}">Verwijder</button></figcaption></figure>`).join('')}</div>` : ''}
    <label class="chk"><input type="checkbox" name="consent"><span>Ik geef toestemming om mijn foto’s op te slaan bij mijn klantkaart. Alleen de salon kan ze zien en ik kan ze altijd laten verwijderen.</span></label>
    ${U.sel.adviceErr ? `<p class="note bad" role="alert">${esc(U.sel.adviceErr)}</p>` : ''}
    <div class="row"><button class="btn" type="submit">Verstuur aanvraag</button></div></form>`;
}
document.addEventListener('change', async e => {
  const k = e.target.dataset && e.target.dataset.photo; if (!k) return;
  try { const url = await A.readImage(e.target.files[0]); U.sel.photos = [...(U.sel.photos || []), { kind: k, dataUrl: url }]; A.render(); } catch (er) { toast(er.message, true); }
});
ACT.rmPhoto = d => { U.sel.photos.splice(+d.i, 1); A.render(); };
ACT.sendIntake = f => {
  if (!U.ctok) { const r = A.tryCall('pub_client_start', { name: f.name, phone: f.phone }); if (r.err) { U.sel.adviceErr = r.err.message; return A.render(); } U.ctok = r.ok.token; A.lsSet('jrs_ctok', U.ctok); }
  const r = A.tryCall('cli_intake', { answers: { lengte: f.length, kleur: f.color, gewensteLengte: f.wantLength, textuur: f.texture, wens: f.wish }, prefs: { color: f.color, length: f.wantLength, texture: f.texture }, photos: U.sel.photos || [], consent: !!f.consent });
  if (r.err) { U.sel.adviceErr = r.err.message; return A.render(); }
  U.sel.photos = []; U.sel.adviceErr = null;
  modal('Aanvraag ontvangen', `<p>Dank je! De salon bekijkt je aanvraag en neemt contact op. Wil je alvast een behandeling bekijken?</p><div class="row end" style="margin-top:14px"><button class="btn ghost" data-act="closeModal">Later</button><button class="btn" data-act="toIntake">Bekijk behandelingen</button></div>`);
};
ACT.toIntake = () => { closeModal(); U.flow = { step: 1 }; go('boeken'); };

/* ---------- SHOP ---------- */
function viewShop(C, M) {
  const cats = [...new Set(C.products.map(p => p.category))]; const sel = U.sel.cat || 'Alle';
  const list = C.products.filter(p => sel === 'Alle' || p.category === sel);
  const ph = p => C.media.find(m => m.productId === p.id);
  return `${U.orderDone ? `<div class="note ok" role="status" style="margin-bottom:12px">Bestelling ${esc(U.orderDone)} is betaald. Je ziet de status bij Mijn account. <button class="btn quiet sm" data-act="dismissOrder">Sluiten</button></div>` : ''}
  ${window.appHead('Shop', 'Haar &amp; verzorging', 'Haarbundels, accessoires en verzorging. Afhalen in de salon in Rotterdam of verzending wereldwijd.', 'bundle', '<a class="btn ghost sm" href="#bundelbouwer" style="justify-self:start">Open de bundelbouwer</a>')}
  <div class="chips" style="margin:12px 0" role="group" aria-label="Categorie">${['Alle', ...cats].map(c => `<button class="chip" data-act="shopCat" data-c="${esc(c)}" aria-pressed="${sel === c}">${esc(c)}</button>`).join('')}</div>
  ${list.length ? `<div class="products">${list.map(p => { const min = Math.min(...p.variants.map(v => v.priceCents)); const av = p.variants.reduce((a, v) => a + Math.max(0, v.available), 0); return `<button class="prod" data-act="openProd" data-id="${esc(p.id)}">${photo(ph(p), 'sq', 'Productfoto volgt', { kind: p.category === 'Haarbundels' ? (p.id === 'prd_pony' ? 'sleek' : 'bundle') : p.category === 'Supplementen' ? 'jar' : p.category === 'Verzorging' ? 'bottle' : /bonnet/i.test(p.name) ? 'bonnet' : 'bottle', color: (p.variants[0] || {}).color, seed: p.id })}<b>${esc(p.name)}</b><span>${p.variants.length > 1 ? 'vanaf ' : ''}${eur(min)}</span><span>${av ? pill('Betaald', 'Op voorraad') : pill('', 'Op bestelling')}</span></button>`; }).join('')}</div>` : '<div class="empty">Nog geen producten in deze categorie.</div>'}
  <p class="muted" style="margin-top:14px">Producten en prijzen zijn voorbeelddata tot het assortiment is bevestigd.</p>
  ${M && M.orders.length ? `<h2 style="margin-top:24px">Eerder besteld</h2><div class="list">${M.orders.slice(-3).reverse().map(o => `<div class="li"><span class="num">${esc(o.number)}</span><span>${esc(o.items.map(i => i.qty + '× ' + i.name).join(', '))}</span><button class="btn ghost sm" data-act="reorder" data-id="${esc(o.id)}">Opnieuw</button></div>`).join('')}</div>` : ''}`;
}
ACT.dismissOrder = () => { U.orderDone = null; A.render(); };
ACT.shopCat = d => { U.sel.cat = d.c; A.render(); };
ACT.openProd = d => {
  const p = cat().products.find(x => x.id === d.id); const m = cat().media.find(x => x.productId === p.id);
  modal(p.name, `${photo(m, 'wide', 'Exacte productfoto per variant volgt', { kind: p.category === 'Supplementen' ? 'jar' : p.category === 'Verzorging' ? 'bottle' : /bonnet/i.test(p.name) ? 'bonnet' : p.id === 'prd_pony' ? 'sleek' : 'bundle', color: (p.variants[0] || {}).color, seed: p.id + 'w' })}<p>${esc(p.description)}</p>${p.supplement ? `<p class="note">${esc(p.approvedInfo)}<br><b>Gezondheidsvragen?</b> Overleg met je huisarts of apotheek.</p>` : ''}
    <form data-form="addCart" class="stack" style="margin-top:10px"><fieldset style="border:0;padding:0;margin:0" class="stack"><legend class="f" style="font-weight:700;margin-bottom:6px">Kies een variant</legend>
    ${p.variants.map((v, i) => `<label class="svc" style="cursor:pointer"><span class="chk"><input type="radio" name="v" value="${esc(v.id)}" ${i === p.variants.findIndex(x => x.available > 0) || (i === 0 && !p.variants.some(x => x.available > 0)) ? 'checked' : ''} ${v.available < 1 ? 'disabled' : ''}><span><b>${esc(v.label)}</b><br>${v.available > 0 ? `<small>${v.available} op voorraad</small>` : '<small>Niet op voorraad — vraag het aan via de chat</small>'}</span></span><span class="price">${eur(v.priceCents)}</span></label>`).join('')}</fieldset>
    <label class="f">Aantal<input class="i" type="number" name="qty" min="1" max="10" value="1" inputmode="numeric"></label>
    <button class="btn block" ${p.variants.some(v => v.available > 0) ? '' : 'disabled'}>In winkelwagen</button>
    ${p.variants.some(v => v.available < 1) ? '<button type="button" class="btn ghost block" data-act="openChat" data-prefill="Ik zoek een variant die niet op voorraad is">Vraag een niet-beschikbare variant aan</button>' : ''}</form>`);
};
ACT.addCart = f => { if (!f.v) return toast('Kies een variant', true); const q = Math.max(1, parseInt(f.qty, 10) || 1); const ex = U.cart.find(i => i.variantId === f.v); if (ex) ex.qty += q; else U.cart.push({ variantId: f.v, qty: q }); A.lsSet('jrs_cart', JSON.stringify(U.cart)); closeModal(); toast('Toegevoegd aan je winkelwagen'); A.render(); };
ACT.openCart = () => {
  const C = cat(); const vs = C.products.flatMap(p => p.variants.map(v => ({ ...v, name: p.name })));
  const items = U.cart.map(i => ({ ...i, v: vs.find(v => v.id === i.variantId) })).filter(i => i.v);
  const sub = items.reduce((a, i) => a + i.qty * i.v.priceCents, 0);
  modal('Winkelwagen', items.length ? `<div class="list">${items.map((i, n) => `<div class="li"><span class="num">${i.qty}×</span><span><b>${esc(i.v.name)}</b><br><small>${esc(i.v.label)}${i.v.available < i.qty ? ' · nog ' + Math.max(0, i.v.available) + ' beschikbaar' : ''}</small></span><span class="row"><b class="num">${eur(i.qty * i.v.priceCents)}</b><button class="btn quiet sm" data-act="rmCart" data-i="${n}">Verwijder</button></span></div>`).join('')}</div>
    <form data-form="checkout" class="stack" style="margin-top:14px"><fieldset style="border:0;padding:0;margin:0" class="stack"><legend style="font-weight:700">Afhalen of bezorgen</legend>
    <label class="chk"><input type="radio" name="type" value="afhalen" checked><span>${esc(C.pickup)} — gratis</span></label><label class="chk"><input type="radio" name="type" value="bezorgen"><span>Bezorgen</span></label></fieldset>
    <div class="grid2"><label class="f">Land<select class="i" name="country">${C.shipping.map(s => `<option value="${esc(s.country)}">${esc(s.country)} — ${eur(s.rateCents)}</option>`).join('')}</select></label><label class="f">Adres (bij bezorgen)<input class="i" name="address" autocomplete="street-address"></label></div>
    ${!U.ctok ? `<div class="grid2"><label class="f">Naam<input class="i" name="name" autocomplete="name"></label><label class="f">Telefoonnummer<input class="i" name="phone" type="tel" autocomplete="tel"></label></div>` : ''}
    <div class="sum"><span>Subtotaal</span><b class="num">${eur(sub)}</b><span class="muted">Verzending</span><span class="muted">bij keuze bezorgen</span></div>
    <p class="muted">Artikelen worden 15 minuten voor je vastgehouden tijdens betalen. Prijs en voorraad worden bij afrekenen opnieuw gecontroleerd.</p>
    <button class="btn block">Afrekenen</button></form>` : '<div class="empty">Je winkelwagen is leeg.</div>');
};
ACT.rmCart = d => { U.cart.splice(+d.i, 1); A.lsSet('jrs_cart', JSON.stringify(U.cart)); ACT.openCart(); A.render(); };
ACT.checkout = f => {
  if (!U.ctok) { const r = A.tryCall('pub_client_start', { name: f.name, phone: f.phone }); if (r.err) return toast(r.err.message, true); U.ctok = r.ok.token; A.lsSet('jrs_ctok', U.ctok); }
  U.cartKey = U.cartKey || 'ck_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const r = A.tryCall('cli_order', { items: U.cart, delivery: { type: f.type, country: f.country, address: f.address }, idempotencyKey: U.cartKey });
  if (r.err) return toast(r.err.message, true);
  U.orderPending = r.ok.order.number; U.cartKey = null;
  modal('Betalen', `<p>Bestelling ${esc(r.ok.order.number)} · totaal <b>${eur(r.ok.order.totalCents)}</b>${r.ok.order.delivery.rateCents ? ' (incl. ' + eur(r.ok.order.delivery.rateCents) + ' verzending)' : ''}. Vastgehouden nog <b><span data-until="${r.ok.order.holdExpires}"></span></b> min.</p>${payBox(r.ok.payment, 'order')}`);
};
ACT.reorder = d => {
  const r = call('cli_reorder', { id: d.id }); if (!r) return;
  const ok = r.items.filter(i => i.live && i.qty > 0);
  modal('Opnieuw bestellen', `<p class="muted">We hebben prijs en voorraad opnieuw gecontroleerd.</p><div class="list">${r.items.map(i => `<div class="li"><span class="num">${i.qty}×</span><span><b>${esc(i.name)}</b>${i.changed ? `<br><small>Prijs gewijzigd: ${eur(i.oldPrice)} → ${eur(i.price)}</small>` : ''}${i.short ? `<br><small>Nog ${Math.max(0, i.available)} beschikbaar</small>` : ''}</span><b class="num">${eur(i.price * i.qty)}</b></div>`).join('')}</div>
    <div class="row end" style="margin-top:12px"><button class="btn ghost" data-act="closeModal">Annuleren</button><button class="btn" data-act="reorderAdd" data-items='${esc(JSON.stringify(ok.map(i => ({ variantId: i.variantId, qty: i.qty }))))}' ${ok.length ? '' : 'disabled'}>Toevoegen aan winkelwagen</button></div>`);
};
ACT.reorderAdd = d => { for (const it of JSON.parse(d.items)) { const ex = U.cart.find(i => i.variantId === it.variantId); if (ex) ex.qty += it.qty; else U.cart.push(it); } A.lsSet('jrs_cart', JSON.stringify(U.cart)); closeModal(); ACT.openCart(); A.render(); };

/* ---------- ACCOUNT ---------- */
function viewAccount(C, M) {
  if (!M) return `${window.appHead('Mijn account', 'Welkom', 'Je hoeft niets te downloaden of een wachtwoord te maken. Vul je naam en telefoonnummer in en je ziet al je afspraken, bestellingen en betalingen.', 'sleek')}
    <form data-form="identify" class="card stack" style="margin-top:14px" novalidate><h3>Ga verder met je gegevens</h3><div class="grid2"><label class="f">Naam<input class="i" name="name" autocomplete="name" required></label><label class="f">Telefoonnummer<input class="i" name="phone" type="tel" autocomplete="tel" required></label></div><button class="btn">Ga verder</button></form>
    <form data-form="linkLogin" class="card stack" style="margin-top:12px"><h3>Heb je een persoonlijke link?</h3><p class="muted">Die staat in je bevestiging. In de voorbeeldomgeving kun je <b>demo-amira</b> (VIP) of <b>demo-naomi</b> gebruiken.</p><label class="f">Code uit je link<input class="i" name="link" autocomplete="off"></label><button class="btn ghost">Openen</button></form>`;
  const up = M.appointments.filter(a => a.start > Date.now() && ['confirmed', 'hold', 'offered', 'option', 'exception'].includes(a.status));
  const past = M.appointments.filter(a => !up.includes(a)).slice(-6).reverse();
  return `${window.appHead('Mijn account', 'Hoi ' + esc(firstName(M.client.name)), 'Hier vind je je afspraken, betalingen, bestellingen en alles wat je met de salon deelt.', 'sleek', '<button class="btn ghost sm" data-act="logoutClient" style="justify-self:start">Uitloggen</button>')}
  ${M.client.vip ? `<p>${pill('Bevestigd', 'VIP')} <a href="#vip">VIP-aanvraag doen</a></p>` : ''}
  ${hairPassport(C, M)}
  <section class="stack" style="margin-top:16px"><h2>Afspraken</h2>${up.length ? up.map(a => `<div class="card"><div class="head"><b>${esc(dt(a.start))}</b>${pill(a.status)}</div><p>${esc(a.service)}</p>
    ${a.status === 'hold' ? `<p class="note warn">Betaal je aanbetaling binnen <span data-until="${a.holdExpires}"></span> min.</p>${payBox(A.E.state.payments.find(p => p.refId === a.id && p.status === 'pending'), 'acc')}` : ''}
    ${a.status === 'offered' ? `<div class="row"><button class="btn sm" data-act="acceptOffer" data-id="${esc(a.id)}">Plek aannemen</button><button class="btn ghost sm" data-act="declineOffer" data-id="${esc(a.id)}">Afslaan</button></div>` : ''}
    ${a.status === 'exception' ? '<p class="note warn">Je betaling kwam binnen na het verlopen van de reservering. De salon neemt contact met je op.</p>' : ''}
    ${a.status === 'confirmed' ? (a.start - Date.now() > A.E.state.settings.cancelHours * 36e5 ? `<div class="row"><button class="btn ghost sm" data-act="reschedule" data-id="${esc(a.id)}">Verplaatsen</button><button class="btn ghost sm" data-act="cancelMine" data-id="${esc(a.id)}">Annuleren</button></div>` : `<p class="muted">Wijzigen binnen ${A.E.state.settings.cancelHours} uur gaat via de salon. <button class="btn quiet sm" data-act="openChat" data-prefill="Ik wil mijn afspraak van ${esc(dt(a.start))} wijzigen">Stuur een bericht</button></p>`) : ''}</div>`).join('') : `<div class="empty">Geen komende afspraken. <a href="#boeken">Boek een afspraak</a></div>`}
  ${past.length ? `<details class="d"><summary>Eerdere afspraken (${past.length})</summary><div class="list">${past.map(a => `<div class="li"><span>${esc(dshort(a.start))}</span><span>${esc(a.service)}</span>${pill(a.status)}</div>`).join('')}</div></details>` : ''}</section>
  <section class="stack" style="margin-top:20px"><h2>Betalingen</h2>${M.payLinks.map(l => `<div class="note warn">Openstaand bedrag ${eur(l.amountCents)} <button class="btn sm" data-act="payLink" data-ref="${esc(l.providerRef)}">Betaal via je link</button></div>`).join('')}
    ${M.payments.length ? `<div class="list">${M.payments.map(p => `<div class="li"><span>${pill(p.status)}</span><span>${esc(p.label)}<br><small>Betaald ${eur(p.paid)} van ${eur(p.total)}</small></span><b class="num">${p.open ? eur(p.open) + ' open' : ''}</b></div>`).join('')}</div>` : '<div class="empty">Nog geen betalingen.</div>'}</section>
  <section class="stack" style="margin-top:20px"><h2>Bestellingen</h2>${M.orders.length ? `<div class="list">${M.orders.slice().reverse().map(o => `<div class="li"><span class="num">${esc(o.number)}</span><span>${esc(o.items.map(i => i.qty + '× ' + i.name).join(', '))}<br><small>${esc(o.delivery.type === 'bezorgen' ? 'Bezorgen naar ' + o.delivery.country : 'Afhalen')} · ${eur(o.totalCents)}</small></span><span class="row">${o.status === 'hold' ? pill('pending', 'Wacht op betaling') : ''}<button class="btn ghost sm" data-act="reorder" data-id="${esc(o.id)}">Opnieuw</button></span>${o.status !== 'hold' && window.orderTimeline ? `<div style="grid-column:1/-1">${window.orderTimeline(o)}</div>` : ''}</div>`).join('')}</div>` : '<div class="empty">Nog geen bestellingen.</div>'}</section>
  ${M.quotes.length ? `<section class="stack" style="margin-top:20px"><h2>Offertes</h2><div class="list">${M.quotes.map(q => `<div class="li"><span class="num">${esc(q.number)}</span><span>${eur(q.totalCents)}</span><span class="row">${pill(q.status)}<button class="btn ghost sm" data-act="openQuote" data-t="${esc(q.token)}">Bekijk</button></span></div>`).join('')}</div></section>` : ''}
  <section class="stack" style="margin-top:20px"><div class="row between"><h2>Wachtlijst</h2><button class="btn ghost sm" data-act="openWaitlist">Aanmelden</button></div>${M.waitlist.filter(w => w.status !== 'afgemeld').map(w => `<div class="li"><span>${esc((C.services.find(s => s.id === w.serviceId) || {}).name)}</span><span class="muted">${esc(w.status)}</span><button class="btn quiet sm" data-act="wlLeave" data-id="${esc(w.id)}">Afmelden</button></div>`).join('') || '<p class="muted">Je staat niet op de wachtlijst.</p>'}</section>
  ${M.vipRequests.length ? `<section class="stack" style="margin-top:20px"><h2>VIP-aanvragen</h2>${M.vipRequests.map(v => `<div class="li"><span>${esc(v.date)}</span><span>${esc(v.occasion || '')}${v.optionExpires && v.status === 'Optie' ? `<br><small>Optie vervalt ${esc(dshort(v.optionExpires))}</small>` : ''}</span>${pill(v.status)}</div>`).join('')}</section>` : ''}
  ${(f => f.length ? `<section class="stack" style="margin-top:20px"><h2>Bewaarde looks</h2><div class="gallery">${f.map(m => `<a class="look" href="#boeken" data-act="lookOpen" data-s="${esc(m.serviceId || '')}">${photo(m)}<b>${esc(m.highlight || m.subject)}</b></a>`).join('')}</div></section>` : '')(window.feedFavs(C))}
  <section class="stack" style="margin-top:20px"><h2>Foto’s en privacy</h2><p class="muted">${M.intakes.reduce((a, i) => a + i.photos, 0)} foto’s opgeslagen bij je intake${M.client.photoConsent ? ' met jouw toestemming' : ''}.</p><div class="row"><button class="btn ghost sm" data-act="delPhotos" ${M.intakes.some(i => i.photos) ? '' : 'disabled'}>Verwijder mijn foto’s</button></div></section>
  ${M.messages.length ? `<details class="d" style="margin-top:20px"><summary>Berichten van de salon (${M.messages.length})</summary><div class="list">${M.messages.slice().reverse().map(m => `<div><small>${esc(dt(m.sendAt))} · ${esc(m.type)}</small><p>${esc(m.text)}</p></div>`).join('')}</div></details>` : ''}`;
}
function hairPassport(C, M) {
  const done = M.appointments.filter(a => a.status === 'completed').sort((a, b) => b.start - a.start); if (!done.length) return '';
  const last = done[0], s = C.services.find(x => x.id === last.serviceId) || {}; const weeks = s.followUpWeeks || 4; const maint = !!s.followUpWeeks; const due = last.start + weeks * 7 * 864e5;
  const pct = Math.max(0, Math.min(1, (Date.now() - last.start) / (due - last.start))); const left = Math.ceil((due - Date.now()) / 864e5); const C2 = 2 * Math.PI * 52;
  return `<section class="passport"><div class="pp-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="52" class="v" style="stroke-dasharray:${C2};stroke-dashoffset:${C2 * (1 - pct)}"/></svg><span><b class="serif">${left > 0 ? left : 0}</b><small>dagen</small></span></div>
    <div class="stack" style="gap:6px"><span class="kicker" style="color:#d6b293">Haarpaspoort</span><h2 class="serif" style="color:var(--cream)">${maint ? (left > 0 ? 'Onderhoud over ' + left + ' dagen' : 'Tijd voor onderhoud') : (left > 0 ? 'Je look is ' + Math.floor((Date.now() - last.start) / 864e5) + ' dagen oud' : 'Tijd voor een nieuwe look')}</h2><p style="color:rgb(246 241 234/.75);margin:0">Laatste behandeling: ${esc(last.service)} op ${esc(dshort(last.start))}. ${s.care ? esc(s.care) : ''}</p><div class="row"><button class="btn light sm" data-act="pickSvcGo" data-id="${esc(last.serviceId)}">${maint ? 'Plan onderhoud' : 'Boek opnieuw'}</button></div></div>
    <ol class="pp-tl">${done.slice(0, 6).map(a => `<li><b>${esc(dshort(a.start))}</b><span>${esc(a.service)}</span></li>`).join('')}</ol></section>`;
}
ACT.identify = f => { const r = A.tryCall('pub_client_start', { name: f.name, phone: f.phone }); if (r.err) return toast(r.err.message, true); U.ctok = r.ok.token; A.lsSet('jrs_ctok', U.ctok); A.render(); };
ACT.linkLogin = f => { const r = A.tryCall('pub_client_link', { link: (f.link || '').trim() }); if (r.err) return toast(r.err.message, true); U.ctok = r.ok.token; A.lsSet('jrs_ctok', U.ctok); A.render(); };
ACT.logoutClient = () => { call('pub_logout', { _t: U.ctok }, true); U.ctok = null; U.cart = []; U.flow = { step: 1 }; U.sel = {}; A.lsDel('jrs_ctok'); A.lsDel('jrs_cart'); U.chatOpen = false; toast('Je bent uitgelogd'); go('home'); };
ACT.cancelMine = d => A.confirmBox('Afspraak annuleren?', 'Je plek wordt vrijgegeven en mogelijk aangeboden aan iemand op de wachtlijst.', 'doCancelMine', { id: d.id }, true);
ACT.doCancelMine = d => { closeModal(); if (call('cli_cancel', { id: d.id })) toast('Afspraak geannuleerd'); A.render(); };
ACT.acceptOffer = d => { const r = call('cli_accept_offer', { id: d.id }); if (!r) return A.render(); if (r.payment) modal('Aanbetaling', `<p>Rond je aanbetaling af om de plek vast te leggen.</p>${payBox(r.payment, 'link')}`); else toast('De plek is van jou!'); A.render(); };
ACT.declineOffer = d => { call('cli_cancel', { id: d.id }); A.render(); };
ACT.reschedule = d => { const a = me().appointments.find(x => x.id === d.id); U.sel.rs = { id: d.id, serviceId: a.serviceId, date: J.amsParts(a.start).date }; rsModal(); };
function rsModal() {
  const R = U.sel.rs; const res = call('pub_slots', { serviceId: R.serviceId, date: R.date, exceptId: R.id }, true) || { slots: [] };
  modal('Kies een nieuw tijdstip', `<div class="row"><button class="btn ghost sm" data-act="rsDay" data-n="-1" aria-label="Vorige dag">${ico('back', 18)}</button><b>${esc(dlong(J.amsToUtc(R.date, '12:00')))}</b><button class="btn ghost sm" data-act="rsDay" data-n="1" aria-label="Volgende dag">${ico('chev', 18)}</button></div>
  ${res.slots.length ? `<div class="slots" style="margin-top:12px">${res.slots.map(s => `<button class="slot" data-act="rsPick" data-t="${s.start}">${s.time}</button>`).join('')}</div>` : '<div class="empty" style="margin-top:12px">Geen vrije tijden op deze dag.</div>'}<p class="muted">Je huidige afspraak blijft staan tot het verplaatsen gelukt is.</p>`);
}
ACT.rsDay = d => { U.sel.rs.date = J.addDays(U.sel.rs.date, +d.n); rsModal(); };
ACT.rsPick = d => { const r = call('cli_reschedule', { id: U.sel.rs.id, start: +d.t }); if (r) { closeModal(); toast('Verplaatst naar ' + dt(r.appointment.start)); A.render(); } else rsModal(); };
function openWaitlist(serviceId) {
  const C = cat(); const D = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  modal('Wachtlijst', `<form data-form="wlJoin" class="stack"><label class="f">Behandeling<select class="i" name="serviceId">${C.services.filter(s => s.bookable).map(s => `<option value="${esc(s.id)}" ${s.id === serviceId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
    <fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:700">Welke dagen passen?</legend><div class="row">${[2, 3, 4, 5, 6].map(i => `<label class="chk"><input type="checkbox" name="d${i}">${D[i]}</label>`).join('')}</div></fieldset>
    <fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:700">Welk dagdeel?</legend><div class="row">${['ochtend', 'middag', 'avond'].map(p => `<label class="chk"><input type="checkbox" name="p_${p}">${p}</label>`).join('')}</div></fieldset>
    <p class="muted">Komt er een passende plek vrij, dan krijg je een tijdelijk aanbod. Reageer je niet op tijd, dan gaat het naar de volgende.</p><button class="btn">Aanmelden</button></form>`);
}
ACT.openWaitlist = () => openWaitlist();
ACT.wlJoin = f => { const days = [2, 3, 4, 5, 6].filter(i => f['d' + i]); const parts = ['ochtend', 'middag', 'avond'].filter(p => f['p_' + p]); if (call('cli_waitlist', { serviceId: f.serviceId, days, parts })) { closeModal(); toast('Je staat op de wachtlijst'); A.render(); } };
ACT.wlLeave = d => { call('cli_waitlist_leave', { id: d.id }); A.render(); };
ACT.delPhotos = () => A.confirmBox('Foto’s verwijderen?', 'Al je intakefoto’s worden definitief verwijderd.', 'doDelPhotos', {}, true);
ACT.doDelPhotos = () => { closeModal(); const r = call('cli_delete_photos'); if (r) toast(r.deleted + ' foto’s verwijderd'); A.render(); };
ACT.payLink = d => { const r = call('cli_pay_link', { providerRef: d.ref }); if (r) modal('Openstaand bedrag', payBox({ providerRef: d.ref, amountCents: r.amountCents }, 'link')); };
ACT.openQuote = d => { U.quoteToken = d.t; go('offerte'); };

/* ---------- OFFERTE ---------- */
function viewQuote() {
  if (!U.quoteToken) { const t = A.lsGet('jrs_open_quote'); if (t) { U.quoteToken = t; A.lsDel('jrs_open_quote'); } }
  if (!U.quoteToken) return `<h1>Offerte</h1><div class="empty" style="margin-top:12px">Open je offerte via de persoonlijke link die je van de salon kreeg.</div>`;
  const q = call('pub_quote', { token: U.quoteToken }); if (!q) return '<h1>Offerte niet gevonden</h1>';
  const st = q.steps || {};
  const step = (ok, l) => `<li>${ok ? pill('Betaald', 'Gedaan') : pill('Nog te ontvangen', 'Open')} ${esc(l)}</li>`;
  return `<h1>Offerte ${esc(q.number)}</h1><p class="muted">Voor ${esc(q.client)} · geldig tot ${esc(dlong(q.validUntil))}</p>
  <div class="card stack" style="margin-top:12px"><div class="sum">${q.lines.map(l => `<span>${esc(l.label)}</span><span class="num">${eur(l.cents)}</span>`).join('')}<span class="t">Totaal</span><span class="t num">${eur(q.totalCents)}</span><span>Aanbetaling</span><b class="num">${eur(q.depositCents)}</b></div>
  ${q.slot ? `<p><b>Gereserveerd:</b> ${esc(q.slot.service)} op ${esc(dt(q.slot.start))} ${pill(q.slot.status)}</p>` : ''}<p class="muted">${esc(q.terms)}</p></div>
  <h3 style="margin:16px 0 6px">Stappen</h3><ul class="stack" style="list-style:none;padding:0">${step(st.akkoord, 'Akkoord met de offerte')}${step(st.aanbetaling, 'Aanbetaling betaald')}${step(st.tijdslot, 'Tijdslot beschikbaar')}</ul>
  ${q.status === 'bevestigd' ? '<p class="note ok">Alles is rond: je afspraak is bevestigd.</p>' : q.status === 'verlopen' ? '<p class="note">Deze offerte is verlopen. Neem contact op voor een nieuwe.</p>' : q.status === 'actie nodig' ? '<p class="note warn">Je aanbetaling is ontvangen, maar het tijdslot is niet meer beschikbaar. De salon neemt contact op.</p>' : `<button class="btn" data-act="acceptQuote">${st.akkoord ? 'Betaal de aanbetaling' : 'Akkoord en betalen'}</button>`}`;
}
ACT.acceptQuote = () => { const r = call('pub_quote_accept', { token: U.quoteToken }); if (!r) return; if (r.payment) modal('Aanbetaling', payBox(r.payment, 'quote')); A.render(); };

/* ---------- VIP ---------- */
function viewVip(C, M) {
  if (!M || !M.client.vip) return `<h1>VIP Spots</h1><p style="margin-top:12px">VIP-klanten krijgen eerder toegang tot geselecteerde plekken (standaard 48 uur voordat ze voor iedereen open gaan), voorrang bij passende annuleringen en kunnen ruim vooruit een datum aanvragen.</p><p class="muted">VIP-status wordt door de salon toegekend.</p>${M ? '' : '<a class="btn ghost" href="#account">Log in</a>'}`;
  return `<h1>VIP-aanvraag</h1><p class="muted">Vraag ruim vooruit een datum aan, bijvoorbeeld voor je bruiloft of fotoshoot. Je ziet de status: Aangevraagd, Optie of Bevestigd.</p>
  <form data-form="vipReq" class="card stack" style="margin-top:12px"><div class="grid2"><label class="f">Gewenste datum<input class="i" type="date" name="date" min="${A.todayISO()}" required></label><label class="f">Behandeling<select class="i" name="serviceId">${C.services.filter(s => s.bookable).map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></label></div>
  <label class="f">Gelegenheid<input class="i" name="occasion" placeholder="Bruiloft, fotoshoot, verjaardag…"></label><label class="f">Toelichting<textarea class="i" name="note"></textarea></label><button class="btn">Aanvraag versturen</button></form>
  ${M.vipRequests.length ? `<h2 style="margin-top:20px">Je aanvragen</h2><div class="list">${M.vipRequests.map(v => `<div class="li"><span>${esc(v.date)}</span><span>${esc(v.occasion)}${v.status === 'Optie' && v.optionExpires ? `<br><small>Optie vervalt ${esc(dshort(v.optionExpires))}</small>` : ''}</span>${pill(v.status)}</div>`).join('')}</div>` : ''}`;
}
ACT.vipReq = f => { if (!f.date) return toast('Kies een datum', true); if (call('cli_vip_request', f)) { toast('Aanvraag verstuurd'); A.render(); } };

/* ---------- CHAT ---------- */
window.renderChat = function () {
  const el = document.getElementById('chat');
  if (!U.chatOpen || A.route().startsWith('werk')) { el.innerHTML = ''; return; }
  const C = cat(); const hist = U.ctok ? (call('cli_chat_history', {}, true) || { messages: [] }) : { messages: [] };
  const msgs = hist.messages.length ? hist.messages : [{ from: 'bot', text: C.tone.greeting, data: { chips: ['Boeken', 'Prijzen', 'Advies bij een foto', 'Shop'] } }];
  const last = msgs[msgs.length - 1];
  const extra = last && last.from === 'bot' && last.data ? botExtras(last.data) : '';
  el.innerHTML = `<section class="chat" role="dialog" aria-label="Chat met JR’SBEAUTYBAR"><header><button class="x" data-act="closeChat" aria-label="Chat sluiten">${ico('x', 20)}</button><div><b class="brand" style="font-size:19px">JR’SBEAUTYBAR</b><br><small>${hist.status === 'human' ? 'Je chat nu met de salon' : hist.status === 'handoff' ? 'Doorgegeven aan de salon' : 'Assistent van de salon · antwoorden uit goedgekeurde informatie'}</small></div></header>
    <div class="msgs" id="msgs" aria-live="polite">${msgs.map(m => `<div class="msg ${m.from}"><span class="who">${m.from === 'client' ? 'Jij' : m.from === 'staff' ? 'Salon' : 'Assistent'}</span>${esc(m.text)}</div>`).join('')}${extra}</div>
    ${U.ctok ? `<form class="composer" data-form="chatSend"><label class="sr" for="chatIn">Bericht</label><input class="i" id="chatIn" name="text" autocomplete="off" enterkeyhint="send" placeholder="Typ je vraag…" value="${esc(U.chatPrefill || '')}"><button class="btn" aria-label="Versturen">${ico('send', 18)}</button></form>`
      : `<form class="composer" data-form="chatStart" style="flex-wrap:wrap"><input class="i" name="name" autocomplete="name" placeholder="Je naam" aria-label="Naam"><input class="i" name="phone" type="tel" autocomplete="tel" placeholder="Telefoon" aria-label="Telefoonnummer"><button class="btn">Start chat</button></form>`}</section>`;
  U.chatPrefill = '';
  const m = document.getElementById('msgs'); if (m) m.scrollTop = m.scrollHeight;
};
function botExtras(d) {
  let h = '';
  if (d.chips) h += `<div class="row">${d.chips.map(c => `<button class="chip" data-act="chip" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
  if (d.services) h += `<div class="row">${d.services.map(s => `<button class="chip" data-act="chatSvc" data-id="${esc(s.id)}" data-n="${esc(s.name)}">${esc(s.name)}</button>`).join('')}</div>`;
  if (d.slots) h += `<div class="slots">${d.slots.map(s => `<button class="slot" data-act="chatSlot" data-s="${esc(s.serviceId)}" data-t="${s.start}">${esc(dshort(s.start))}<small>${s.time}</small></button>`).join('')}</div>`;
  if (d.appointments) h += d.appointments.map(a => `<div class="msg bot"><b>${esc(a.service)}</b><br>${esc(dt(a.start))}<div class="row" style="margin-top:6px"><button class="btn ghost sm" data-act="chatResched" data-id="${esc(a.id)}">Verplaatsen</button><button class="btn ghost sm" data-act="cancelMine" data-id="${esc(a.id)}">Annuleren</button></div></div>`).join('');
  return h;
}
ACT.openChat = d => { U.chatOpen = true; U.chatPrefill = (d && d.prefill) || ''; closeModal(); A.render(); setTimeout(() => { const i = document.getElementById('chatIn'); if (i) i.focus(); }, 30); };
ACT.closeChat = () => { U.chatOpen = false; A.render(); };
ACT.chatStart = f => { const r = A.tryCall('pub_client_start', { name: f.name, phone: f.phone, channel: 'webchat' }); if (r.err) return toast(r.err.message, true); U.ctok = r.ok.token; A.lsSet('jrs_ctok', U.ctok); A.render(); };
function say(text) { if (!text.trim()) return; call('cli_chat', { text }); window.renderChat(); const i = document.getElementById('chatIn'); if (i) i.focus(); }
ACT.chatSend = f => say(f.text || '');
ACT.chip = d => { const map = { 'Boeken': 'Ik wil een afspraak boeken', 'Prijzen': 'Wat zijn de prijzen?', 'Wachtlijst': null, 'Shop': null, 'Advies bij een foto': null, 'VIP-aanvraag': null };
  if (d.c === 'Shop') { U.chatOpen = false; return go('shop'); } if (d.c === 'Advies bij een foto') { U.chatOpen = false; return go('advies'); } if (d.c === 'VIP-aanvraag') { U.chatOpen = false; return go('vip'); } if (d.c === 'Wachtlijst') return openWaitlist(); say(map[d.c] || d.c); };
ACT.chatSvc = d => say('Ik wil ' + d.n + ' boeken');
ACT.chatSlot = d => {
  const s = cat().services.find(x => x.id === d.s);
  if (s.needsVariant || s.depositCents) { U.flow = { step: s.needsVariant ? 3 : 5, serviceId: s.id, start: +d.t, date: J.amsParts(+d.t).date }; U.chatOpen = false; toast('Kies je bundel en rond de boeking af'); return go('boeken'); }
  A.confirmBox('Afspraak vastleggen?', `${s.name} op ${dt(+d.t)}. De bevestiging volgt pas als het vastleggen gelukt is.`, 'chatBook', { s: d.s, t: d.t });
};
ACT.chatBook = d => { closeModal(); const r = A.tryCall('cli_book', { serviceId: d.s, start: +d.t }); const conv = A.E.state.conversations.find(c => c.clientId === (A.E.state.sessions[U.ctok] || {}).clientId && c.channel === 'webchat');
  if (conv) conv.messages.push({ from: 'bot', text: r.err ? `Dat lukte niet: ${r.err.message} Kies een ander tijdstip.` : `Gelukt! Je afspraak staat vast op ${dt(r.ok.appointment.start)}. ${A.E.state.settings.tone.closing || ''}`, at: Date.now(), data: r.err ? { chips: ['Boeken'] } : null });
  A.render(); };
ACT.chatResched = d => { U.chatOpen = false; ACT.reschedule(d); };
}
