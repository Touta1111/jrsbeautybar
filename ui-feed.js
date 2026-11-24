/* JR'SBEAUTYBAR — de startpagina als verticale look-feed (zoals Reels), met merk-kaarten ertussen */
{
const A = window.APP, U = window.U, ACT = window.ACT;
const { esc, eur, ico, toast, go, dt, dshort } = A;
const J = A.J;
const favs = () => { try { return JSON.parse(A.lsGet('jrs_favs')) || []; } catch (e) { return []; } };
const heart = on => `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.6 4.5c2 0 3.5 1.1 4.4 2.5.9-1.4 2.4-2.5 4.4-2.5 3.6 0 5.7 3.8 4.2 7.3C19.5 16.4 12 21 12 21z" fill="${on ? '#e8506a' : 'none'}" stroke="${on ? '#e8506a' : '#fff'}" stroke-width="1.8"/></svg>`;
const plus = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
const book = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
const stories = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="12" r="9" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="4"/></svg>';

window.feedHome = function (C, M, nf) {
  const looks = C.media.filter(m => m.type !== 'video' && A.safeSrc(m.dataUrl));
  const F = favs(); const fees = (C.surcharges || []).filter(x => x.to >= A.todayISO());
  const svcOf = id => C.services.find(s => s.id === id);
  const cards = [];
  cards.push(`<article class="fc intro" data-i="0"><div class="fc-bg hero-slides">${looks.slice(0, 5).map((m, i) => `<img src="${esc(m.dataUrl)}" alt="" class="${i ? '' : 'on'}" style="object-position:${esc(m.focus || '50% 30%')}">`).join('')}</div><div class="fc-shade"></div>
    <div class="fc-in"><p class="fc-kick">${M ? 'Welkom terug, ' + esc(M.client.name.replace(/^Voorbeeldklant /, '').split(' ')[0]) : 'Hair studio · Rotterdam'}</p><h1 class="fc-logo"><span>JR’s</span> <span>beauty bar</span></h1>
    <p class="fc-tag">Sew-ins · Quick weaves · Ponytails · Half up half down · Silk press</p>
    ${nf ? `<button class="live" data-act="quickNext" data-t="${nf}"><i></i>Eerst vrij: <b>${esc(dt(nf))}</b></button>` : ''}
    <div class="row"><a class="btn light" href="#boeken">Boek nu</a><a class="btn line-light" href="#behandelingen">Menu</a></div></div>
    <div class="swipe-hint" aria-hidden="true"><span></span>Swipe voor looks</div></article>`);
  looks.forEach((m, i) => {
    const s = svcOf(m.serviceId); const on = F.includes(m.id); const n = i + 1;
    cards.push(`<article class="fc look-c" data-i="${cards.length}"><div class="fc-bg"><img src="${esc(m.dataUrl)}" alt="${esc(m.caption || m.highlight)}" loading="${i < 2 ? 'eager' : 'lazy'}" style="object-position:${esc(m.focus || '50% 30%')}"></div><div class="fc-shade"></div>
      <div class="fc-rail"><button class="fr-b fav ${on ? 'on' : ''}" data-act="fav" data-id="${esc(m.id)}" aria-pressed="${on}" aria-label="${on ? 'Niet meer bewaren' : 'Bewaar deze look'}">${heart(on)}<small>${on ? 'Bewaard' : 'Bewaar'}</small></button>
        ${s ? `<button class="fr-b" data-act="pickSvcGo" data-id="${esc(s.id)}" aria-label="Boek ${esc(s.name)}">${book}<small>Boek</small></button>` : ''}<button class="fr-b" data-act="story" data-h="${esc(m.highlight || 'Sew-in')}" aria-label="Bekijk stories">${stories}<small>Stories</small></button></div>
      <div class="fc-in look-in"><span class="fc-pill">${esc(m.highlight || m.subject)}</span>${s ? `<h2 class="fc-title">${esc(s.name)}</h2><p class="fc-meta">${s.durationMin} min · <b>${eur(s.priceCents)}</b>${s.desc ? ' · ' + esc(s.desc) : ''}</p>` : `<h2 class="fc-title">${esc(m.caption || m.highlight)}</h2>`}${m.caption && s ? `<p class="fc-cap">${esc(m.caption)}</p>` : ''}
        ${s ? `<button class="btn light sm" data-act="pickSvcGo" data-id="${esc(s.id)}">Boek deze look</button>` : `<a class="btn light sm" href="#advies">Vraag advies</a>`}</div>
      <span class="fc-n" aria-hidden="true">${String(n).padStart(2, '0')} / ${String(looks.length).padStart(2, '0')}</span></article>`);
    if (i === 2) cards.push(`<article class="fc menu-c" data-i="${cards.length}"><div class="fc-in" style="position:relative"><p class="fc-kick">Het menu</p><h2 class="fc-title big">Kies je categorie</h2><div class="mc-list">${window.BCATS.map(([k, l]) => { const ps = C.services.filter(x => x.category === k && x.bookable); const mn = Math.min(...ps.map(x => x.priceCents)); return `<button class="mc-row" data-act="catGo" data-c="${k}"><span class="serif">${esc(l)}</span><small>${ps.length} diensten · vanaf ${eur(mn)}</small>${ico('chev', 18)}</button>`; }).join('')}</div></div></article>`);
    if (i === 6) cards.push(`<article class="fc vip-c" data-i="${cards.length}"><div class="fc-in" style="position:relative"><p class="fc-kick">${fees.length ? 'Feestdagen' : 'VIP Spots'}</p>${fees.length ? `<h2 class="fc-title big">${esc(fees[0].label)}</h2><p class="fc-meta">+${eur(fees[0].cents)} per afspraak van ${esc(dshort(J.amsToUtc(fees[0].from, '12:00')))} t/m ${esc(dshort(J.amsToUtc(fees[0].to, '12:00')))}. Boek op tijd, december loopt vol.</p>` : ''}<h2 class="fc-title ${fees.length ? '' : 'big'}">VIP: eerder toegang</h2><p class="fc-meta">Geselecteerde plekken eerder zien en ruim vooruit een datum aanvragen voor je bruiloft of fotoshoot.</p><div class="row"><a class="btn light sm" href="#vip">Meer over VIP</a><a class="btn line-light sm" href="#boeken">Boek nu</a></div></div></article>`);
  });
  const a = C.address || {};
  cards.push(`<article class="fc end-c" data-i="${cards.length}"><div class="fc-in" style="position:relative"><p class="fc-kick">Tot snel</p><h2 class="fc-logo small">JR’s beauty bar</h2><p class="fc-meta">${esc(a.street || '')}, ${esc(a.zip || '')} ${esc(a.city || '')} · op afspraak</p><div class="end-grid">${[['behandelingen', 'Menu'], ['looks', 'Alle looks'], ['lookfinder', 'Look-finder'], ['shop', 'Shop'], ['vip', 'VIP'], ['contact', 'Route']].map(([h, l]) => `<a href="#${h}">${l}</a>`).join('')}</div><button class="btn light" data-act="feedTop">Terug naar boven</button></div></article>`);
  return `<section class="feed-wrap"><aside class="feed-side"><span class="wordmark script" style="font-size:54px">JR’s beauty bar</span><p class="muted">Sew-ins, quick weaves, ponytails, half up half down en silk press in Rotterdam.</p>
    ${nf ? `<button class="live dark" data-act="quickNext" data-t="${nf}"><i></i>Eerstvolgende plek: <b>${esc(dt(nf))}</b></button>` : ''}
    <nav class="side-links">${[['behandelingen', 'Het menu', C.services.filter(s => s.bookable).length + ' diensten'], ['looks', 'Looks', looks.length + ' foto’s'], ['lookfinder', 'Look-finder', '5 vragen'], ['shop', 'Shop', 'haar & verzorging'], ['vip', 'VIP Spots', 'eerder toegang'], ['contact', 'Contact', a.city || '']].map(([h, l, x]) => `<a href="#${h}"><span class="serif">${l}</span><small>${esc(x)}</small></a>`).join('')}</nav>
    ${fees.map(f => `<p class="fee-chip">✦ ${esc(f.label)} +${eur(f.cents)} · ${esc(dshort(J.amsToUtc(f.from, '12:00')))} t/m ${esc(dshort(J.amsToUtc(f.to, '12:00')))}</p>`).join('')}
    <p class="muted" style="font-size:13px">Gebruik ↑ ↓ of scroll in de feed.</p></aside>
    <div class="feed-phone"><div class="reelfeed" id="rf" tabindex="0" aria-label="Looks van de salon, scroll verticaal">${cards.join('')}</div><div class="feed-dots" aria-hidden="true">${cards.map((_, i) => `<i data-d="${i}"></i>`).join('')}</div></div>
    <aside class="feed-right"><span class="kicker" style="color:#d6b293">Snel boeken</span><h2 class="serif" style="color:var(--cream);font-size:34px">Eerst vrij</h2>${quick(C).map(q => `<button class="qb" data-act="quickBook" data-s="${esc(q.s.id)}" data-t="${q.t}"><span><b class="serif">${esc(q.s.name)}</b><small>${q.s.durationMin} min · ${eur(q.s.priceCents)}</small></span><span class="qt">${esc(dt(q.t))}</span></button>`).join('')}<a class="btn line-light sm" href="#behandelingen" style="justify-self:start">Hele menu</a></aside></section>`;
};
function quick(C) { const out = []; for (const id of ['svc_sewin', 'svc_pony', 'svc_halfup', 'svc_silk']) { const s = C.services.find(x => x.id === id); if (!s) continue; let d = A.todayISO(); for (let i = 0; i < 14; i++, d = J.addDays(d, 1)) { if (!(C.hours[J.weekday(d)] || []).length) continue; const r = A.call('pub_slots', { serviceId: id, date: d }, true); if (r && r.slots.length) { out.push({ s, t: r.slots[0].start }); break; } } } return out; }
ACT.quickBook = d => { U.flow = { step: 4, serviceId: d.s, extras: [], date: J.amsParts(+d.t).date, start: +d.t }; go('boeken'); };
ACT.fav = (d, b) => { let F = favs(); const on = !F.includes(d.id); F = on ? [...F, d.id] : F.filter(x => x !== d.id); A.lsSet('jrs_favs', JSON.stringify(F)); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.innerHTML = heart(on) + `<small>${on ? 'Bewaard' : 'Bewaar'}</small>`; if (on) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); toast('Bewaard bij Mijn account'); } };
ACT.feedTop = () => { const f = document.getElementById('rf'); if (f) f.scrollTo({ top: 0, behavior: 'smooth' }); };
window.feedFavs = C => { const F = favs(); return C.media.filter(m => F.includes(m.id)); };
/* actieve kaart, puntjes en toetsen */
let fio = null;
window.feedWire = function () {
  const f = document.getElementById('rf'); if (!f) return;
  if (fio) fio.disconnect();
  fio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > .6) { f.querySelectorAll('.fc.act').forEach(x => x.classList.remove('act')); e.target.classList.add('act'); const i = +e.target.dataset.i; document.querySelectorAll('.feed-dots i').forEach((d, j) => d.classList.toggle('on', j === i)); } }), { root: f, threshold: [.6] });
  f.querySelectorAll('.fc').forEach(c => fio.observe(c));
  f.onkeydown = e => { if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); f.scrollBy({ top: (e.key.includes('Down') ? 1 : -1) * f.clientHeight, behavior: 'smooth' }); } };
  const setH = () => { const top = f.getBoundingClientRect().top + scrollY; const nav = document.querySelector('.c-bot'); const nb = nav && getComputedStyle(nav).display !== 'none' ? nav.offsetHeight : 0; document.documentElement.style.setProperty('--feedH', Math.max(460, innerHeight - (top - scrollY) - nb) + 'px'); };
  setH(); addEventListener('resize', setH, { passive: true });
  /* dubbel tikken = bewaren, zoals in sociale apps */
  f.ondblclick = e => { const c = e.target.closest('.look-c'); if (!c || e.target.closest('button,a')) return; const b = c.querySelector('[data-act=fav]'); if (b && !b.classList.contains('on')) ACT.fav(b.dataset, b); const h = document.createElement('span'); h.className = 'burst'; h.style.left = e.offsetX + 'px'; h.style.top = e.offsetY + 'px'; h.innerHTML = heart(true); c.appendChild(h); setTimeout(() => h.remove(), 900); };
};
}
