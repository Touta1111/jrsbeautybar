/* JR'SBEAUTYBAR — extra pagina's: behandelingen, detail, looks, look-finder, bundelbouwer, gidsen, nazorg, FAQ, over, contact, menu, footer */
{
const A = window.APP, U = window.U, ACT = window.ACT;
const { esc, eur, ico, pill, photo, toast, modal, closeModal, go, dshort } = A;
const J = A.J;
const art = (k, o) => window.hairArt(k, o || {});
const kindOf = n => window.lookArt(n);
const slug = id => id.replace(/^svc_/, '');
const DL = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const CATS = [['weave', 'Weave', 'Sew-ins en quick weaves, van regular tot full glam en bob.'], ['ponytails', 'Ponytails / Bun', 'Sleek, 3 part of braided — altijd op gestijld haar.'], ['halfup', 'Half up half down', 'Deels opgestoken, deels los.'], ['natural', 'Natural hair', 'Op je eigen haar.'], ['styling', 'Styling only', 'Refresh van je huidige install.'], ['extra', 'Extra’s', 'Te combineren met je behandeling.']];
const PAGES = new Set(['behandelingen', 'looks', 'lookfinder', 'bundelbouwer', 'gids', 'nazorg', 'faq', 'over', 'contact']);
const crumbs = (...c) => `<nav class="crumbs" aria-label="Kruimelpad"><a href="#home">Home</a>${c.map(([h, l]) => h ? ` / <a href="#${h}">${esc(l)}</a>` : ` / <span aria-current="page">${esc(l)}</span>`).join('')}</nav>`;
const HP = { waves: 'Sew-in', precolor: 'Ponytails', straight: 'Cliënt view', curls: 'Curls', bundle: 'Bundels', sleek: 'Ponytails', hero: 'Cliënt view' };
let heroUse = 0;
const pageHero = (kicker, title, text, kind, extra = '') => { const C = A.call('pub_catalog', {}, true) || { media: [] }; const ps = C.media.filter(m => m.type !== 'video' && A.safeSrc(m.dataUrl)); const pick = ps.filter(m => m.highlight === HP[kind]); const m = (pick.length ? pick : ps)[(title.length + heroUse) % Math.max(1, (pick.length ? pick : ps).length)];
  return `<header class="app-head"><div class="ah-ph">${m ? `<img src="${esc(m.dataUrl)}" alt="" style="object-position:${esc(m.focus || '50% 30%')}">` : art(kind, { seed: title })}</div><div class="stack" style="gap:6px"><span class="kicker">${esc(kicker)}</span><h1 class="serif">${title}</h1><p class="muted">${text}</p>${extra}</div></header>`; };

window.appHead = (k, t, x, kind, extra) => pageHero(k, t, x, kind || 'waves', extra || '');
window.renderPage = function (r, C, M) {
  if (r.startsWith('behandeling-')) return pService(C, M, 'svc_' + r.slice(12));
  return ({ behandelingen: pServices, looks: pLooks, lookfinder: pFinder, bundelbouwer: pBuilder, gids: pGuide, nazorg: pCare, faq: pFaq, over: pAbout, contact: pContact })[r](C, M);
};
window.renderPage.has = r => PAGES.has(r) || (r.startsWith('behandeling-') && !!A.E.state.services.find(s => s.id === 'svc_' + r.slice(12) && s.live));

/* ---------- behandelingen ---------- */
function svcCard(s) {
  return `<a class="svc-big" href="#behandeling-${esc(slug(s.id))}"><div class="sb-art arch">${art(kindOf(s.name), { seed: s.id + 'big' })}</div><div class="stack" style="gap:6px"><div class="row between"><h3 class="serif" style="font-size:26px">${esc(s.name)}</h3><b class="serif price">${s.priceCents ? eur(s.priceCents) : 'Gratis'}</b></div>
    <div class="row" style="gap:6px">${pill('info', s.durationMin + ' min')}${s.depositCents ? pill('', 'Aanbetaling ' + eur(s.depositCents)) : ''}${s.intakeRequired ? pill('warn', 'Intake vooraf') : ''}${s.needsVariant ? pill('', 'Incl. bundelkeuze') : ''}${s.verify.status !== 'bevestigd' ? pill('', 'Voorbeelddata') : ''}</div>
    <p class="muted">${esc(s.care ? 'Nazorg: ' + s.care : 'Rustig, persoonlijk en op afspraak.')}</p><span class="link">Bekijk behandeling →</span></div></a>`;
}
function pServices(C) {
  const q = (U.sel.mq || '').toLowerCase();
  const fees = (C.surcharges || []).filter(x => x.to >= A.todayISO());
  return pageHero('Behandelingen', 'Het menu', 'Alle behandelingen van de salon met tijd en prijs. Tik op een dienst voor details of zet hem direct in je afspraak.', 'waves', fees.map(f => `<p class="fee-chip">✦ ${esc(f.label)}: +${eur(f.cents)} · ${esc(dshort(J.amsToUtc(f.from, '12:00')))} t/m ${esc(dshort(J.amsToUtc(f.to, '12:00')))}</p>`).join('')) +
  `<div class="menu-tools"><label class="search"><span class="sr">Zoek</span>${ico('search', 18)}<input class="i" placeholder="Zoek in het menu…" value="${esc(U.sel.mq || '')}" data-mq></label><nav class="tabs" aria-label="Categorieën">${CATS.map(([k, t]) => `<a class="tab" href="#behandelingen" data-act="jump" data-to="cat-${k}">${esc(t)}</a>`).join('')}</nav></div>
  ${CATS.map(([k, t, d]) => { const l = C.services.filter(s => s.category === k && s.bookable && (!q || (s.name + ' ' + (s.desc || '')).toLowerCase().includes(q))); return l.length ? `<section class="menu-sec" id="cat-${k}"><div class="ms-head"><h2 class="serif">${esc(t)}</h2><p class="muted">${esc(d)}</p></div><div class="menu-list">${l.map(s => { const ph = window.svcPhoto(C, s); return `<article class="mrow"><a class="mr-main" href="#behandeling-${esc(slug(s.id))}" ${ph ? `data-peek="${esc(ph.dataUrl)}"` : ''}><span class="mr-name"><b>${esc(s.name)}</b><i class="dots" aria-hidden="true"></i><b class="num">${eur(s.priceCents)}</b></span><span class="mr-sub">${s.durationMin} min${s.desc ? ' · ' + esc(s.desc) : ''}${s.supplies ? ' · Neem mee: ' + esc(s.supplies) : ''}</span>${s.warn ? `<span class="mr-warn">${esc(s.warn)}</span>` : ''}</a>${s.extra ? '' : `<button class="mr-add" data-act="pickSvcGo" data-id="${esc(s.id)}" aria-label="Boek ${esc(s.name)}">Boek</button>`}</article>`; }).join('')}</div></section>` : ''; }).join('')}
  <p class="muted" style="margin-top:20px">Bron: Salonized-boekingspagina van de salon, 24-11-2026.</p>`;
}
ACT.jump = d => { const el = document.getElementById(d.to); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
document.addEventListener('input', e => { if (e.target.matches('[data-mq]')) { U.sel.mq = e.target.value; clearTimeout(U.mqT); U.mqT = setTimeout(() => { A.render(); const i = document.querySelector('[data-mq]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); } });
/* foto-preview die meebeweegt met de muis */
(() => { let pk = null; document.addEventListener('mousemove', e => { const a = e.target.closest && e.target.closest('[data-peek]'); if (!a || matchMedia('(hover: none)').matches) { if (pk) pk.style.opacity = 0; return; } if (!pk) { pk = document.createElement('div'); pk.className = 'peek'; document.body.appendChild(pk); } const u = A.safeSrc(a.dataset.peek); if (!u) return; if (pk.dataset.u !== u) { pk.innerHTML = `<img src="${u}" alt="">`; pk.dataset.u = u; } pk.style.opacity = 1; pk.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 120}px) rotate(-3deg)`; }); })();
function pService(C, M, id) {
  const s = C.services.find(x => x.id === id); if (!s) return '<h1>Niet gevonden</h1>';
  const tot = s.prepMin + s.durationMin + s.bufferMin;
  const looks = C.media.filter(m => m.serviceId === s.id);
  const bundles = C.products.filter(p => p.category === 'Haarbundels').flatMap(p => p.variants.map(v => ({ ...v, product: p.name })));
  const faq = C.faq.filter(f => s.name.toLowerCase().split(' ').some(w => w.length > 3 && (f.q + f.a).toLowerCase().includes(w)));
  return crumbs(['behandelingen', 'Behandelingen'], [null, s.name]) + `<section class="sd-hero"><div class="sd-art arch">${looks[0] ? photo(looks[0]) : art(kindOf(s.name), { seed: s.id + 'hero' })}</div>
    <div class="stack" style="gap:14px"><span class="kicker">${esc((CATS.find(c => c[0] === s.category) || [, ''])[1])}</span><h1 class="serif sd-title">${esc(s.name)}</h1>
    <div class="sd-price"><b class="serif">${s.priceCents ? eur(s.priceCents) : 'Gratis'}</b>${s.needsVariant ? '<span class="muted">+ je gekozen bundel</span>' : ''}</div>
    <div class="row" style="gap:6px">${pill('info', s.durationMin + ' minuten')}${s.supplies ? pill('warn', 'Neem mee: ' + s.supplies) : ''}</div>${s.desc ? `<p style="font-size:18px">${esc(s.desc)}</p>` : ''}${s.warn ? `<p class="note warn">${esc(s.warn)}</p>` : ''}
    <div class="row"><button class="btn" data-act="pickSvcGo" data-id="${esc(s.id)}">Boek ${esc(s.name)}</button><a class="btn ghost" href="#advies">Eerst advies</a></div>
    <p class="muted">Bron: ${esc(s.verify.source)}.</p></div></section>
  <section class="sect stack"><div><span class="kicker">Tijdsindeling</span><h2>Zo ziet je afspraak eruit</h2></div>
    <div class="tbar" role="img" aria-label="Voorbereiding ${s.prepMin} minuten, behandeling ${s.durationMin} minuten, afronding ${s.bufferMin} minuten">${s.prepMin ? `<span style="flex:${s.prepMin}" class="p">Voorbereiding<br><b>${s.prepMin} min</b></span>` : ''}<span style="flex:${s.durationMin}" class="m">Behandeling<br><b>${s.durationMin} min</b></span>${s.bufferMin ? `<span style="flex:${s.bufferMin}" class="b">Afronding<br><b>${s.bufferMin} min</b></span>` : ''}</div><p class="muted">Reken op ongeveer ${Math.round(tot / 6) / 10} uur in de salon.</p></section>
  <section class="sect"><div class="sd-grid">
    <div class="card stack"><h3>Voor je afspraak</h3><ul class="ticks">${[s.prep, s.supplies && 'Neem mee: ' + s.supplies + '.', s.allowVariant && 'Geen eigen haar? Laat bij het boeken een bundel uit de shop klaarleggen.', s.warn, `Annuleren of verplaatsen kan tot ${C.cancelHours} uur vooraf.`].filter(Boolean).map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <div class="card stack"><h3>Na je afspraak</h3><ul class="ticks">${[s.care, s.followUpWeeks && `Na ${s.followUpWeeks} weken krijg je een voorstel om onderhoud te boeken.`, 'Je ontvangt onderhoudstips met bijpassende producten.'].filter(Boolean).map(t => `<li>${esc(t)}</li>`).join('')}</ul><a class="btn quiet sm" href="#nazorg" style="justify-self:start">Volledige nazorggids →</a></div></div></section>
  ${s.allowVariant ? `<section class="sect stack"><div class="row between"><div><span class="kicker">Bundels</span><h2>Kies je haar</h2></div><a class="btn ghost sm" href="#bundelbouwer">Bundelbouwer</a></div><div class="rail">${bundles.map(v => `<div class="bundle-card"><div class="bc-art">${art('bundle', { color: v.color, seed: v.id })}</div><b>${esc(v.label)}</b><small class="muted">${esc(v.product)}</small><span class="row between"><b>${eur(v.priceCents)}</b>${v.available > 0 ? pill('ok', v.available + ' op voorraad') : pill('', 'Op bestelling')}</span></div>`).join('')}</div></section>` : ''}
  <section class="sect stack"><div><span class="kicker">Looks</span><h2>Resultaten met ${esc(s.name.toLowerCase())}</h2></div>${looks.length ? `<div class="gallery">${looks.map(m => `<div class="look">${photo(m)}<small class="muted">${esc(m.caption || '')}</small></div>`).join('')}</div>` : `<div class="gallery">${[0, 1, 2, 3].map(i => `<div class="look">${photo(null, '', 'Portfoliofoto volgt', { hint: s.name, seed: s.id + i })}</div>`).join('')}</div>`}</section>
  ${faq.length ? `<section class="sect stack"><div><span class="kicker">Vragen</span><h2>Goed om te weten</h2></div>${faq.map(f => `<details class="d"><summary>${esc(f.q)}</summary><div><p>${esc(f.a)}</p></div></details>`).join('')}</section>` : ''}
  <div class="sticky-cta"><span><b>${esc(s.name)}</b><br><small class="muted">${s.priceCents ? eur(s.priceCents) : 'Gratis'} · ${s.durationMin} min</small></span><button class="btn" data-act="pickSvcGo" data-id="${esc(s.id)}">Boek nu</button></div>`;
}

/* ---------- looks (galerij met lightbox) ---------- */
function lookItems(C) {
  const real = C.media.filter(m => m.kind !== 'product' && m.type !== 'video');
  if (real.length) return real.map(m => ({ m, h: m.highlight || m.subject, svc: m.serviceId }));
  const H = window.HIGHLIGHTS; const out = []; const tall = [1, 0, 0, 1, 0, 1];
  H.forEach(([h, svc, k], i) => [0, 1].forEach(j => out.push({ h, svc, k, seed: h + j, tall: tall[(i + j) % 6] })));
  return out;
}
function pLooks(C) {
  const f = U.sel.lk || 'Alle'; const items = lookItems(C).filter(x => f === 'Alle' || x.h === f);
  return pageHero('Portfolio', 'Looks uit de salon', 'Blader per highlight. Tik op een look om hem groot te bekijken en direct te boeken.', 'precolor') + crumbs([null, 'Looks']) +
  `<div class="chips sect" role="group" aria-label="Filter">${['Alle', ...window.HIGHLIGHTS.map(x => x[0])].map(h => `<button class="chip" data-act="lkF" data-h="${esc(h)}" aria-pressed="${f === h}">${esc(h)}</button>`).join('')}</div>
  <div class="masonry" style="margin-top:14px">${items.map((x, i) => `<button class="mz ${x.tall ? 'tall' : ''}" data-act="lightbox" data-i="${i}" aria-label="Bekijk ${esc(x.h)}">${x.m ? photo(x.m) : `<div class="photo">${'<div class="art">' + art(x.k, { seed: x.seed }) + '</div>'}</div>`}<span class="mz-cap">${esc(x.h)}</span></button>`).join('')}</div>
  ${!C.media.length ? '<p class="muted" style="margin-top:12px">De echte portfoliofoto’s verschijnen hier automatisch zodra ze in de werkruimte zijn geüpload.</p>' : ''}`;
}
ACT.lkF = d => { U.sel.lk = d.h; A.render(); };
ACT.lightbox = d => { const C = A.call('pub_catalog', {}, true); const f = U.sel.lk || 'Alle'; const items = lookItems(C).filter(x => f === 'Alle' || x.h === f); U.sel.lb = { items, i: +d.i }; lb(); };
function lb() { const { items, i } = U.sel.lb; const x = items[i];
  modal(x.h, `<div class="lb">${x.m ? photo(x.m, 'wide') : `<div class="photo wide"><div class="art">${art(x.k, { seed: x.seed })}</div></div>`}</div><p class="muted">${esc((x.m && x.m.caption) || '')} ${i + 1} van ${items.length}</p>
  <div class="row between"><span class="row"><button class="btn ghost sm" data-act="lbNav" data-n="-1" aria-label="Vorige" ${i ? '' : 'disabled'}>${ico('back', 18)}</button><button class="btn ghost sm" data-act="lbNav" data-n="1" aria-label="Volgende" ${i < items.length - 1 ? '' : 'disabled'}>${ico('chev', 18)}</button></span>${x.svc ? `<button class="btn" data-act="lbBook" data-s="${esc(x.svc)}">Boek deze look</button>` : `<button class="btn" data-act="lbAdvice">Vraag advies</button>`}</div>`); }
ACT.lbNav = d => { const L = U.sel.lb; L.i = Math.max(0, Math.min(L.items.length - 1, L.i + (+d.n))); lb(); };
ACT.lbBook = d => { closeModal(); U.flow = { step: 2, serviceId: d.s }; go('boeken'); };
ACT.lbAdvice = () => { closeModal(); go('advies'); };
document.addEventListener('keydown', e => { if (U.sel.lb && document.querySelector('#overlay .lb')) { if (e.key === 'ArrowRight') ACT.lbNav({ n: 1 }); if (e.key === 'ArrowLeft') ACT.lbNav({ n: -1 }); } });

/* ---------- look-finder ---------- */
const Q = [
  ['type', 'Wat wil je laten doen?', [['Sew-in', 'waves'], ['Quick weave', 'straight'], ['Ponytail of bun', 'sleek'], ['Half up half down', 'precolor'], ['Silk press op eigen haar', 'straight'], ['Alleen een refresh', 'waves']]],
  ['length', 'Welke lengte?', [['Bob (kort)', 'straight'], ['Schouder tot borst', 'waves'], ['Lang', 'sleek']]],
  ['finish', 'Welke finish?', [['Sleek & straight', 'straight'], ['Full glam: layers & curls', 'curls']]],
  ['extra', 'Extra’s erbij?', [['Geen', 'straight'], ['Eén bang', 'waves'], ['Twee bangs', 'waves'], ['Flip over wig styling', 'precolor']]],
  ['occasion', 'Waarvoor is het?', [['Dagelijks', 'straight'], ['Feest of verjaardag', 'curls'], ['Bruiloft of fotoshoot', 'precolor']]]];
function finderPick(a) {
  const bob = a.length === 'Bob (kort)', glam = /glam/i.test(a.finish || '');
  const id = { 'Sew-in': bob ? 'svc_sewin_bob' : glam ? 'svc_sewin_glam' : 'svc_sewin', 'Quick weave': bob ? 'svc_qw_bob' : glam ? 'svc_qw_glam' : 'svc_qw', 'Ponytail of bun': glam ? 'svc_pony3' : 'svc_pony', 'Half up half down': glam ? 'svc_halfup' : 'svc_halfup_bun', 'Silk press op eigen haar': 'svc_silk', 'Alleen een refresh': glam ? 'svc_refresh_glam' : 'svc_refresh' }[a.type] || 'svc_sewin';
  const ex = { 'Eén bang': ['svc_x_bang1'], 'Twee bangs': ['svc_x_bang2'], 'Flip over wig styling': ['svc_x_flipwig'] }[a.extra] || [];
  return { id, ex };
}
function pFinder(C) {
  const L = U.lf || (U.lf = { step: 0, a: {} });
  if (L.step < Q.length) { const [k, q, opts] = Q[L.step];
    return `<section class="finder"><div class="stack"><span class="kicker">Look-finder · vraag ${L.step + 1} van ${Q.length}</span><div class="prog"><i style="width:${L.step / Q.length * 100}%"></i></div><h1 class="serif" style="font-size:clamp(34px,6vw,56px)">${esc(q)}</h1></div>
    <div class="f-opts">${opts.map(([o, kk], i) => { const ph = k === 'type' ? C.media.filter(m => m.type !== 'video')[(i * 2) % Math.max(1, C.media.length)] : null; return `<button class="f-opt" data-act="lfPick" data-k="${k}" data-v="${esc(o)}" aria-pressed="${L.a[k] === o}"><span class="f-art">${ph && A.safeSrc(ph.dataUrl) ? `<img src="${esc(ph.dataUrl)}" alt="" style="object-position:${esc(ph.focus || '50% 30%')}">` : art(kk, { seed: o })}</span><b>${esc(o)}</b></button>`; }).join('')}</div>
    <div class="row">${L.step ? `<button class="btn ghost" data-act="lfBack">${ico('back', 18)} Vorige</button>` : ''}<button class="btn quiet" data-act="lfReset">Opnieuw</button></div></section>`; }
  const P = finderPick(L.a); const s = C.services.find(x => x.id === P.id); const ex = P.ex.map(id => C.services.find(x => x.id === id)).filter(Boolean);
  const tot = s.priceCents + ex.reduce((t, x) => t + x.priceCents, 0), mins = s.durationMin + ex.reduce((t, x) => t + x.durationMin, 0);
  const ph = window.svcPhoto(C, s); const vip = L.a.occasion === 'Bruiloft of fotoshoot';
  return `<section class="finder-result"><div class="fr-art arch">${ph ? `<img src="${esc(ph.dataUrl)}" alt="${esc(ph.caption || '')}" style="width:100%;height:100%;object-fit:cover;object-position:${esc(ph.focus || '50% 30%')}">` : art(kindOf(s.name), { seed: 'res' })}</div><div class="stack" style="gap:12px"><span class="kicker">Jouw match</span><h1 class="serif" style="font-size:clamp(38px,6vw,64px)">${esc(s.name)}</h1>
    <p>${esc(Object.values(L.a).join(' · '))}</p>${s.desc ? `<p class="muted">${esc(s.desc)}</p>` : ''}${s.warn ? `<p class="note warn">${esc(s.warn)}</p>` : ''}
    <div class="card stack"><div class="sum"><span>${esc(s.name)}</span><b class="num">${eur(s.priceCents)}</b>${ex.map(x => `<span>+ ${esc(x.name)}</span><span class="num">${eur(x.priceCents)}</span>`).join('')}<span class="t">Totaal</span><b class="t num">${eur(tot)}</b><span>Tijd in de salon</span><span class="num">${mins} min</span></div>${s.supplies ? `<small class="muted">Neem mee: ${esc(s.supplies)}</small>` : ''}</div>
    ${vip ? `<p class="note">Voor een bruiloft of fotoshoot kun je ruim vooruit een datum aanvragen als VIP.</p>` : ''}
    <div class="row"><button class="btn" data-act="lfBook" data-s="${esc(s.id)}" data-x="${esc(P.ex.join(','))}">Boek deze look</button><a class="btn ghost" href="#advies">Stuur foto’s voor advies</a>${vip ? '<a class="btn ghost" href="#vip">VIP-aanvraag</a>' : ''}<button class="btn quiet" data-act="lfReset">Opnieuw</button></div></div></section>`;
}
ACT.lfPick = d => { U.lf.a[d.k] = d.v; U.lf.step++; A.render(); };
ACT.lfBack = () => { U.lf.step = Math.max(0, U.lf.step - 1); A.render(); };
ACT.lfReset = () => { U.lf = { step: 0, a: {} }; A.render(); };
ACT.lfBook = d => { U.flow = { step: 2, serviceId: d.s, extras: (d.x || '').split(',').filter(Boolean) }; go('boeken'); };

/* ---------- bundelbouwer ---------- */
function pBuilder(C) {
  const prods = C.products.filter(p => p.category === 'Haarbundels'); const B = U.bb || (U.bb = { p: prods[0].id, v: null, q: 3 });
  const p = prods.find(x => x.id === B.p) || prods[0]; const v = p.variants.find(x => x.id === B.v) || p.variants.find(x => x.available > 0) || p.variants[0]; B.v = v.id;
  const len = parseInt(v.length) || 20; const tot = v.priceCents * B.q; const enough = v.available >= B.q;
  return pageHero('Bundelbouwer', 'Stel je bundels samen', 'Kies textuur, kleur, lengte en aantal. Je ziet direct prijs en beschikbaarheid, en kunt ze bestellen of laten klaarleggen bij je afspraak.', 'bundle') + crumbs(['shop', 'Shop'], [null, 'Bundelbouwer']) +
  `<section class="sect builder"><div class="bb-preview"><div class="bb-stack">${Array.from({ length: B.q }, (_, i) => `<div class="bb-b" style="--i:${i};--h:${40 + len * 2}%">${art(p.id === 'prd_pony' ? 'sleek' : 'bundle', { color: v.color, seed: v.id + i })}</div>`).join('')}</div><div class="bb-ruler" aria-hidden="true">${[12, 16, 20, 24, 28].map(n => `<span style="bottom:${(n - 10) / 20 * 100}%" class="${n <= len ? 'on' : ''}">${n}″</span>`).join('')}</div></div>
  <div class="stack lg"><fieldset class="stack"><legend class="kicker">Product</legend><div class="chips">${prods.map(x => `<button class="chip" data-act="bbP" data-id="${esc(x.id)}" aria-pressed="${x.id === p.id}">${esc(x.name)}</button>`).join('')}</div></fieldset>
    <fieldset class="stack"><legend class="kicker">Kleur en lengte</legend><div class="swatches">${p.variants.map(x => `<button class="sw" data-act="bbV" data-id="${esc(x.id)}" aria-pressed="${x.id === v.id}"><span class="dot" style="background:${SW[x.color] || '#3b2f28'}"></span><span><b>${esc(x.label)}</b><br><small>${x.available > 0 ? x.available + ' op voorraad' : 'Op bestelling · ' + x.leadDays + ' dagen'}</small></span><b class="num">${eur(x.priceCents)}</b></button>`).join('')}</div></fieldset>
    <fieldset class="stack"><legend class="kicker">Aantal bundels</legend><div class="row"><button class="btn ghost sm" data-act="bbQ" data-n="-1" aria-label="Minder">−</button><b class="serif" style="font-size:34px;min-width:2ch;text-align:center">${B.q}</b><button class="btn ghost sm" data-act="bbQ" data-n="1" aria-label="Meer">+</button><small class="muted">Indicatie: 2 tot 16″, 3 tot 22″, 4 vanaf 24″</small></div></fieldset>
    <div class="card stack"><div class="sum"><span>${B.q}× ${esc(v.label)}</span><b class="num">${eur(tot)}</b></div>${enough ? pill('ok', 'Op voorraad') : pill('warn', `Nog ${Math.max(0, v.available)} op voorraad — rest wordt besteld`)}
    <div class="row"><button class="btn" data-act="bbCart" ${enough ? '' : 'disabled'}>In winkelwagen</button><button class="btn ghost" data-act="bbBook">Klaarleggen bij afspraak</button></div></div></div></section>`;
}
const SW = { '1B': '#1a1512', '#4': '#5a3520', 'Honey': '#b37a3c', 'Burgundy': '#6e1f2b', 'zwart': '#141210' };
ACT.bbP = d => { U.bb.p = d.id; U.bb.v = null; A.render(); };
ACT.bbV = d => { U.bb.v = d.id; A.render(); };
ACT.bbQ = d => { U.bb.q = Math.max(1, Math.min(6, U.bb.q + (+d.n))); A.render(); };
ACT.bbCart = () => { const ex = U.cart.find(i => i.variantId === U.bb.v); if (ex) ex.qty += U.bb.q; else U.cart.push({ variantId: U.bb.v, qty: U.bb.q }); A.lsSet('jrs_cart', JSON.stringify(U.cart)); toast('Toegevoegd aan je winkelwagen'); A.render(); };
ACT.bbBook = () => { U.flow = { step: 2, serviceId: 'svc_sewin', variantId: U.bb.v, extras: [], showHair: true }; go('boeken'); };

/* ---------- gidsen ---------- */
function pGuide(C) {
  const marks = [[12, 'Schouder'], [16, 'Sleutelbeen'], [18, 'Borst'], [22, 'Midden rug'], [26, 'Taille'], [30, 'Heup']];
  const cols = [...new Map(C.products.filter(p => p.category === 'Haarbundels').flatMap(p => p.variants).map(v => [v.color, v])).values()];
  return pageHero('Gidsen', 'Lengte en kleur kiezen', 'Hoe lang valt 22 inch? Welke kleur past? Gebruik deze gidsen voordat je boekt of bestelt.', 'straight') + crumbs([null, 'Gidsen']) +
  `<section class="sect guide"><div class="stack"><span class="kicker">Lengtegids</span><h2>Waar valt je haar?</h2><p class="muted">Gemeten van kruin tot punt, bij steil haar. Krullen en waves vallen korter.</p><div class="list">${marks.map(([n, l]) => `<div class="li" style="grid-template-columns:70px 1fr"><b class="serif" style="font-size:24px">${n}″</b><span>${l}</span></div>`).join('')}</div></div>
  <svg class="silhouet" viewBox="0 0 260 520" role="img" aria-label="Lengtegids van 12 tot 30 inch"><defs><linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1a1512"/><stop offset="1" stop-color="#5a4638"/></linearGradient></defs>
    <ellipse cx="130" cy="70" rx="44" ry="52" fill="#e9dccd"/><path d="M60 160 Q130 120 200 160 L215 470 Q130 495 45 470Z" fill="#e9dccd"/><path d="M84 40 Q130 0 176 40 L196 ${110 + 0} Q206 330 186 470 L170 470 Q180 300 168 120 L92 120 Q80 300 90 470 L74 470 Q54 330 64 110Z" fill="url(#hg)" opacity=".92"/>
    ${marks.map(([n, l], i) => { const y = 150 + i * 62; return `<line x1="12" x2="248" y1="${y}" y2="${y}" stroke="#a87b5a" stroke-dasharray="4 5"/><text x="248" y="${y - 6}" text-anchor="end" font-size="13" font-weight="700" fill="currentColor">${n}″</text>`; }).join('')}</svg></section>
  <section class="sect stack"><div><span class="kicker">Kleurenkaart</span><h2>Kleuren in het assortiment</h2></div><div class="swatch-grid">${cols.map(v => `<div class="swg"><span class="big" style="background:${SW[v.color] || '#3b2f28'}"></span><b>${esc(v.color)}</b><small class="muted">${esc(v.label)}</small></div>`).join('')}<div class="swg"><span class="big" style="background:conic-gradient(#1a1512,#b37a3c,#6e1f2b,#5a3520,#1a1512)"></span><b>Andere kleur?</b><small class="muted">Op aanvraag via de chat</small></div></div><p class="muted">Kleuren op een scherm wijken af van het echte haar; twijfel je, stuur een foto voor advies.</p></section>`;
}

/* ---------- nazorg ---------- */
function pCare(C) {
  const list = C.services.filter(s => s.care); const t = U.sel.care || (list[0] && list[0].id);
  const s = list.find(x => x.id === t) || list[0];
  return pageHero('Nazorg', 'Lang plezier van je haar', 'Per behandeling de verzorging na je afspraak, plus producten die erbij passen.', 'curls') + crumbs([null, 'Nazorg']) +
  `<div class="chips sect" role="tablist">${list.map(x => `<button class="chip" role="tab" data-act="careT" data-id="${esc(x.id)}" aria-pressed="${x.id === s.id}">${esc(x.name)}</button>`).join('')}</div>
  <section class="care-grid" style="margin-top:16px"><div class="card stack"><h2>${esc(s.name)}</h2><p style="font-size:18px">${esc(s.care)}</p>${s.followUpWeeks ? `<p class="note">Plan je onderhoud na ongeveer ${s.followUpWeeks} weken. Je krijgt daar automatisch een voorstel voor.</p>` : ''}<button class="btn sm" data-act="pickSvcGo" data-id="${esc(s.id)}" style="justify-self:start">Plan je volgende afspraak</button></div>
  <div class="card stack"><h3>Algemene tips</h3><ul class="ticks"><li>Slaap met een zijden bonnet of op een zijden kussensloop.</li><li>Ontwar voorzichtig van punt naar wortel.</li><li>Gebruik milde, sulfaatvrije producten.</li><li>Vermijd veel hitte zonder hittebescherming.</li></ul><small class="muted">Algemene tips; de salon kan deze aanvullen.</small></div></section>
  <section class="sect stack"><div><span class="kicker">Bijpassend</span><h2>Producten voor nazorg</h2></div><div class="rail">${C.products.filter(p => p.category !== 'Haarbundels').map(p => `<button class="prod rail-i" data-act="openProd" data-id="${esc(p.id)}">${photo(null, 'sq', 'Productfoto volgt', { kind: p.category === 'Supplementen' ? 'jar' : p.category === 'Verzorging' ? 'bottle' : 'bonnet', seed: p.id })}<b>${esc(p.name)}</b><span>${eur(p.variants[0].priceCents)}</span></button>`).join('')}</div></section>`;
}
ACT.careT = d => { U.sel.care = d.id; A.render(); };

/* ---------- FAQ ---------- */
function pFaq(C) {
  const base = [
    ['Hoe boek ik een afspraak?', 'Via Boeken kies je je behandeling, eventueel extra’s zoals een bang, en een vrije tijd. Je ziet direct de prijs en hoe lang je in de salon bent.'],
    ['Wat is het verschil tussen een sew-in en een quick weave?', 'Een quick weave is niet hetzelfde als een sew-in. Kies vooraf de juiste dienst; twijfel je, stuur dan een foto voor advies.'],
    ['Moet ik met gestijld haar komen?', 'Bij ponytails en buns wel: JR’sBeautybar werkt alleen op gestijld haar.'],
    ['Wat is de Holiday Fee?', (C.surcharges || []).length ? (C.surcharges || []).map(f => `Van ${f.from.split('-').reverse().join('-')} t/m ${f.to.split('-').reverse().join('-')} geldt een toeslag van ${eur(f.cents)} per afspraak.`).join(' ') : 'Op dit moment geldt er geen toeslag.'],
    ['Kan ik annuleren of verplaatsen?', `Dat kan tot ${C.cancelHours} uur vooraf via Mijn account. Daarna gaat het via een bericht aan de salon.`],
    ['Moet ik vooraf betalen?', 'Je betaalt bij je afspraak, tenzij de salon voor een behandeling een aanbetaling vraagt. Dat zie je altijd voordat je bevestigt.'],
    ['Wat als mijn gewenste tijd vol is?', 'Zet je op de wachtlijst. Valt er een passende plek vrij, dan krijg je een tijdelijk aanbod.'],
    ['Hoe werkt VIP?', `VIP-klanten zien geselecteerde plekken ${C.vipWindowHours} uur eerder en kunnen ruim vooruit een datum aanvragen.`],
    ['Verzenden jullie ook naar het buitenland?', `Ja. Op dit moment naar ${C.shipping.map(s => s.country).join(', ')}; de kosten zie je bij het afrekenen.`],
    ['Waar zit de salon?', `Aan de ${(C.address || {}).street}, ${(C.address || {}).zip} ${(C.address || {}).city}. Je komt alleen op afspraak.`],
    ['Wat gebeurt er met mijn foto’s?', 'Foto’s bij je intake bewaren we alleen met jouw toestemming, alleen de salon kan ze zien, en je kunt ze altijd laten verwijderen.']];
  const all = [...base, ...C.faq.map(f => [f.q, f.a])];
  return pageHero('Veelgestelde vragen', 'Alles wat je wilt weten', 'Zoek je antwoord, of stel je vraag in de chat. Staat het er niet bij? Dan gaat je vraag naar de salon.', 'waves') + crumbs([null, 'FAQ']) +
  `<section class="sect stack"><label class="sr" for="faqQ">Zoek in vragen</label><input class="i" id="faqQ" placeholder="Zoek, bijvoorbeeld ‘aanbetaling’" data-faq style="max-width:520px"><div class="stack" id="faqList">${all.map(([q, a]) => `<details class="d" data-q="${esc((q + ' ' + a).toLowerCase())}"><summary>${esc(q)}</summary><div><p>${esc(a)}</p></div></details>`).join('')}</div><p class="muted" id="faqNone" hidden>Geen antwoord gevonden. <button class="btn quiet sm" data-act="openChat">Stel je vraag in de chat</button></p></section>`;
}
document.addEventListener('input', e => { if (!e.target.matches('[data-faq]')) return; const q = e.target.value.toLowerCase().trim(); let n = 0; document.querySelectorAll('#faqList details').forEach(d => { const ok = !q || d.dataset.q.includes(q); d.hidden = !ok; if (ok) n++; }); document.getElementById('faqNone').hidden = n > 0; });

/* ---------- over & contact ---------- */
function pAbout(C) {
  return pageHero('Over de salon', '<span class="script-h">JR’s beauty bar</span>', 'Haar, extensions en verzorging. Op afspraak aan de Abraham Kuyperlaan 51A in Rotterdam, met verzending naar het buitenland.', 'hero') + crumbs([null, 'Over']) +
  `<section class="sect about"><div class="stack"><span class="kicker">Het verhaal</span><h2>Haar eigen woorden volgen hier</h2><p class="muted">Deze plek is gereserveerd voor het verhaal van de eigenares: hoe het begon, waar ze in gespecialiseerd is en wat klanten bij haar kunnen verwachten. We vullen dit in zodra zij de tekst heeft aangeleverd.</p></div>
  <div class="facts">${[['Rotterdam', 'Abraham Kuyperlaan 51A, 3038 PH.'], ['Op afspraak', 'Persoonlijke aandacht, geen inloop.'], ['Wereldwijde verzending', 'Bundels en verzorging, per land te bestellen.'], ['Boeken via de app', 'Geen download nodig; zet hem op je beginscherm.'], ['Extensions & styling', 'Sew-ins, pre-colored, ponytails en curls.']].map(([t, d]) => `<div class="fact"><b class="serif">${t}</b><p class="muted">${d}</p></div>`).join('')}</div></section>
  ${window.highlightsRow ? `<section class="sect stack"><div><span class="kicker">Highlights</span><h2>Bekijk de stories</h2></div>${window.highlightsRow(C)}</section>` : ''}`;
}
function pContact(C) {
  const D = [2, 3, 4, 5, 6, 0, 1];
  return pageHero('Contact', 'We helpen je graag', 'De snelste weg is de chat: de assistent beantwoordt veelgestelde vragen direct en geeft de rest door aan de salon.', 'sleek', `<div class="row"><button class="btn light sm" data-act="openChat">Open de chat</button></div>`) + crumbs([null, 'Contact']) +
  `<section class="sect contact-grid"><div class="card stack"><h3>Openingstijden</h3><div class="list">${D.map(d => { const h = C.hours[d] || []; return `<div class="li" style="grid-template-columns:1fr auto"><span>${DL[d]}</span><b class="num">${h.length ? h.map(x => x.join('–')).join(', ') : 'Gesloten'}</b></div>`; }).join('')}</div><small class="muted">Op afspraak. Tijden zijn voorbeelddata tot ze bevestigd zijn.</small></div>
  <div class="card stack"><h3>Bericht sturen</h3><form data-form="contactMsg" class="stack"><label class="f">Je vraag<textarea class="i" name="text" required></textarea></label><button class="btn sm" style="justify-self:start">Versturen via chat</button></form><p class="muted">Instagram en TikTok: geen DM — stel je vraag hier, dan komt hij direct bij de salon.</p></div>
  <div class="card stack"><h3>Locatie</h3>${addrBlock(C)}</div>
  <div class="card stack"><h3>Volg ons</h3><a class="btn ghost" href="https://www.instagram.com/jr.sbeautybar/" rel="noopener">Instagram @jr.sbeautybar</a><a class="btn ghost" href="https://www.tiktok.com/@jr.sbeautybar" rel="noopener">TikTok @jr.sbeautybar</a></div></section>`;
}
ACT.contactMsg = f => { if (!U.ctok) { U.chatPrefill = f.text; ACT.openChat({ prefill: f.text }); return; } A.call('cli_chat', { text: f.text }); ACT.openChat({}); };

function addrBlock(C) { const a = C.address || {}; const q = encodeURIComponent(`${a.street} ${a.zip} ${a.city}`); return `<address class="addr"><b class="serif">JR’s beauty bar</b><span>${esc(a.street)}</span><span>${esc(a.zip)} ${esc(a.city)}</span></address><div class="row"><a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=${q}" rel="noopener">Route in Google Maps</a><a class="btn ghost sm" href="https://maps.apple.com/?q=${q}" rel="noopener">Apple Kaarten</a></div><p class="muted">Op afspraak. Bel niet aan zonder afspraak.</p>`; }
window.addrBlock = addrBlock;
/* ---------- VIP-pagina ---------- */
window.vipPage = (C, M, inner) => pageHero('VIP Spots', 'Eerder. Persoonlijker.', `VIP-klanten zien geselecteerde plekken ${C.vipWindowHours} uur eerder, krijgen voorrang bij passende annuleringen en kunnen ruim vooruit een datum aanvragen.`, 'precolor') + crumbs([null, 'VIP']) +
  `<section class="sect"><div class="vip-steps">${[['Aangevraagd', 'Je kiest datum, behandeling en gelegenheid.'], ['Optie', 'De salon zet de datum in optie en stuurt een offerte.'], ['Bevestigd', 'Na akkoord en aanbetaling staat alles vast, inclusief je haar.']].map(([t, d]) => `<div class="vs"><span class="pill ${t === 'Bevestigd' ? 'ok' : t === 'Optie' ? 'info' : 'warn'}">${t}</span><p>${d}</p></div>`).join('')}</div></section><section class="sect">${inner}</section>`;

/* ---------- ontdek-band op home ---------- */
window.discoverBand = () => `<section class="sect stack"><div><span class="kicker">Ontdek</span><h2>Vind jouw perfecte look</h2></div><div class="disc">${[['lookfinder', 'Look-finder', 'Vijf vragen, één advies: behandeling, bundel en een indicatie van de prijs.', 'curls', 'Start'], ['bundelbouwer', 'Bundelbouwer', 'Kies kleur, lengte en aantal en zie direct prijs en voorraad.', 'bundle', 'Samenstellen'], ['gids', 'Lengte- & kleurgids', 'Zie waar 22 inch valt en welke kleuren er zijn.', 'straight', 'Bekijk gids']].map(([h, t, d, k, c], i) => `<a class="disc-i ${i === 0 ? 'dark' : ''}" href="#${h}"><div class="disc-art">${art(k, { dark: i === 0, seed: h + 'd' })}</div><div class="stack" style="gap:6px"><h3 class="serif" style="font-size:28px">${t}</h3><p>${d}</p><span class="link">${c} →</span></div></a>`).join('')}</div></section>`;

/* ---------- menu & footer ---------- */
ACT.menu = () => {
  const L = [['home', 'Home', 'waves'], ['behandelingen', 'Behandelingen', 'waves'], ['looks', 'Looks', 'precolor'], ['lookfinder', 'Look-finder', 'curls'], ['shop', 'Shop', 'bundle'], ['bundelbouwer', 'Bundelbouwer', 'bundle'], ['gids', 'Lengte- & kleurgids', 'straight'], ['vip', 'VIP Spots', 'precolor'], ['nazorg', 'Nazorg', 'curls'], ['faq', 'Veelgestelde vragen', 'waves'], ['over', 'Over de salon', 'sleek'], ['contact', 'Contact', 'straight'], ['account', 'Mijn account', 'sleek']];
  modal('Menu', `<nav class="menu" aria-label="Alle pagina’s">${L.map(([h, l, k]) => `<a href="#${h}" data-act="menuGo" data-r="${h}"><span class="mi-art">${art(k, { seed: h + 'm' })}</span><span class="serif">${esc(l)}</span>${ico('chev', 18)}</a>`).join('')}</nav><div class="row" style="margin-top:14px"><a class="btn block" href="#boeken" data-act="menuGo" data-r="boeken">Boek een afspraak</a></div>`);
};
ACT.menuGo = d => { closeModal(); go(d.r); };
window.richFooter = C => `<footer class="footer rich"><div class="f-top"><div class="stack"><span class="wordmark script">JR’s beauty bar</span><p>Haar, extensions en verzorging. Op afspraak, wereldwijde verzending.</p><address class="f-addr">${esc((C.address || {}).street || '')}<br>${esc((C.address || {}).zip || '')} ${esc((C.address || {}).city || '')}</address><div class="row"><a class="btn light sm" href="#boeken">Boek een afspraak</a><button class="btn line-light sm" data-act="openChat">Chat</button></div></div>
  <div class="f-cols">${[['Salon', [['behandelingen', 'Behandelingen'], ['looks', 'Looks'], ['lookfinder', 'Look-finder'], ['vip', 'VIP Spots'], ['over', 'Over']]], ['Shop', [['shop', 'Alle producten'], ['bundelbouwer', 'Bundelbouwer'], ['gids', 'Lengte- & kleurgids'], ['nazorg', 'Nazorg']]], ['Service', [['faq', 'Veelgestelde vragen'], ['contact', 'Contact'], ['account', 'Mijn account'], ['advies', 'Advies bij een foto']]]].map(([t, l]) => `<div><b>${t}</b>${l.map(([h, x]) => `<a href="#${h}">${x}</a>`).join('')}</div>`).join('')}<div><b>Volg ons</b><a href="https://www.instagram.com/jr.sbeautybar/" rel="noopener">Instagram</a><a href="https://www.tiktok.com/@jr.sbeautybar" rel="noopener">TikTok</a></div></div></div>
  <div class="f-bot"><span>© ${new Date().getFullYear()} JR’SBEAUTYBAR</span><span>Website gemaakt door VormVivo Studios</span></div></footer>`;
}
