/* JR'SBEAUTYBAR — basis: opslag, sessies, router, hulpfuncties */
{
const J = window.JRS;
const KEY = 'jrs_salon_state_v3';
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };

let cloud = null, cloudTimer = null, cloudState = 'lokaal';
function persist(S) {
  S.meta.savedAt = Date.now();
  lsSet(KEY, JSON.stringify(S));
  if (cloud) { clearTimeout(cloudTimer); cloudTimer = setTimeout(async () => { try { await cloud.doc('salon/state').set({ json: JSON.stringify(S), savedAt: S.meta.savedAt }); cloudState = 'opgeslagen'; } catch (e) { cloudState = 'cloud mislukt — lokaal bewaard'; } paintStore(); }, 1200); }
}
function boot(state) { return J.createEngine({ state, save: persist }); }
let saved = null; try { saved = JSON.parse(lsGet(KEY)); } catch (e) {}
if (saved && (!saved.meta || saved.meta.schema !== 4 || !saved.clients.some(c => c.id === 'cli_demo_h0'))) saved = null;
let E = boot(saved || undefined);
if (!saved) seedDemo();
function seedDemo() { // voorbeeldafspraken rond vandaag, zodat de werkruimte gevuld is
  try {
    const t = E.api('pub_login_staff', { pin: '2468' }).token; let d = J.amsParts(Date.now()).date; const plan = [['cli_demo_b', 'svc_silk', null], ['cli_demo_a', 'svc_sewin_glam', null], ['cli_demo_b', 'svc_pony', 'var_pony_1b_26']];
    let i = 0; for (let k = 0; k < 10 && i < plan.length; k++, d = J.addDays(d, 1)) { const sl = E.api('stf_slots', { serviceId: plan[i][1], date: d }, t).slots; if (sl.length) { const r = E.api('stf_book_for', { clientId: plan[i][0], serviceId: plan[i][1], start: sl[Math.min(2, sl.length - 1)].start, variantId: plan[i][2] }, t); if (r.payment) E.api('pub_test_checkout', { providerRef: r.payment.providerRef, status: 'paid' }); i++; } }
    const nao = E.api('pub_client_link', { link: 'demo-naomi' }).token; E.api('cli_chat', { text: 'Hoi!', channel: 'whatsapp' }, nao); E.api('cli_chat', { text: 'Kan ik mijn eigen bundels meenemen naar de afspraak?', channel: 'whatsapp' }, nao);
    // voorbeeldhistorie (8 weken) voor inzichten en het haarpaspoort — duidelijk voorbeelddata
    const S = E.state, svcs = ['svc_sewin', 'svc_sewin_glam', 'svc_pony', 'svc_qw', 'svc_halfup', 'svc_silk', 'svc_refresh', 'svc_pony3', 'svc_qw_glam', 'svc_bun'];
    const names = ['Voorbeeldklant Amira', 'Voorbeeldklant Naomi', 'Voorbeeldklant Sanne', 'Voorbeeldklant Imani', 'Voorbeeldklant Lisa', 'Voorbeeldklant Jada', 'Voorbeeldklant Romy', 'Voorbeeldklant Zoë'];
    names.slice(2).forEach((n, i) => S.clients.push({ id: 'cli_demo_h' + i, name: n, phone: '06000000' + (10 + i), email: '', channel: ['instagram', 'whatsapp', 'webchat'][i % 3], vip: i === 0, prefs: {}, photoConsent: false, createdAt: Date.now() - 80 * 864e5, token: 'demo-h' + i, notes: '' }));
    const cl = ['cli_demo_a', 'cli_demo_b', ...names.slice(2).map((_, i) => 'cli_demo_h' + i)];
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let back = 56; back >= 2; back--) { const d = J.addDays(J.amsParts(Date.now()).date, -back); const h = S.settings.hours[J.weekday(d)] || []; if (!h.length) continue; const n = 1 + Math.floor(rnd() * 3); let cur = 10 * 60 + Math.floor(rnd() * 2) * 30;
      for (let k = 0; k < n; k++) { const pick = svcs[Math.floor(rnd() * svcs.length)]; const sv = S.services.find(x => x.id === pick); const st = J.amsToUtc(d, String(Math.floor(cur / 60)).padStart(2, '0') + ':' + String(cur % 60).padStart(2, '0')); const c = cl[Math.floor(rnd() * cl.length)]; const id = 'apt_hist_' + back + '_' + k;
        S.appointments.push({ id, clientId: c, serviceId: sv.id, blockStart: st, start: st, end: st + sv.durationMin * 6e4, blockEnd: st + (sv.durationMin + sv.bufferMin) * 6e4, status: 'completed', totalCents: sv.priceCents, depositCents: 0, extras: [], extraMin: 0, createdAt: st - 7 * 864e5, source: 'voorbeeld' });
        S.payments.push({ id: 'pay_hist_' + back + '_' + k, refType: 'appointment', refId: id, clientId: c, kind: 'handmatig', amountCents: sv.priceCents, method: rnd() > .5 ? 'pin' : 'contant', status: 'paid', paidAt: st + sv.durationMin * 6e4, createdAt: st, log: [{ at: st, by: 'voorbeeld', what: 'betaald' }] });
        cur += sv.durationMin + sv.bufferMin + 15; if (cur > 16 * 60) break; } }
    persist(S);
    E.api('pub_logout', {}, t); E.api('pub_logout', {}, nao);
  } catch (e) { console.warn('Voorbeelddata', e.stack); }
}

const U = window.U = {
  ctok: lsGet('jrs_ctok') || null, stok: null, role: null, staffName: '', perms: [],
  cart: (() => { try { return JSON.parse(lsGet('jrs_cart')) || []; } catch (e) { return []; } })(),
  flow: { step: 1 }, chatOpen: false, sel: {}, agendaDate: null, agendaView: 'dag', inboxSel: null, clientSel: null, payFilter: 'open', paySort: 'due', pin: '', train: null
};

function call(name, args, quiet) {
  const tokn = /^(stf_|own_)/.test(name) ? U.stok : (/^cli_/.test(name) ? U.ctok : (name === 'pub_logout' ? (args && args._t) : (U.ctok || U.stok)));
  try { return E.api(name, args || {}, tokn); }
  catch (e) {
    if (e.code === 'FORBIDDEN' && /^cli_/.test(name) && U.ctok) { U.ctok = null; lsDel('jrs_ctok'); }
    if (!quiet) toast(e.message || 'Er ging iets mis. Probeer het opnieuw.', true);
    if (e.code === undefined) console.error(e);
    return null;
  }
}
function tryCall(name, args) { try { return { ok: E.api(name, args || {}, /^(stf_|own_)/.test(name) ? U.stok : U.ctok) }; } catch (e) { return { err: e }; } }

const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = J.eur, dt = J.fmtDT, dlong = J.fmtD, hm = J.hm;
const dshort = ms => new Intl.DateTimeFormat('nl-NL', { timeZone: J.TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ms));
const todayISO = () => J.amsParts(Date.now()).date;
const cents = v => Math.round(parseFloat(String(v).replace(/\./g, '').replace(',', '.')) * 100) || 0;
const eurIn = c => ((c || 0) / 100).toFixed(2).replace('.', ',');

const ICON = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', send: '<path d="M4 12l16-8-6 16-2-6z"/>', chev: '<path d="M9 5l7 7-7 7"/>'
};
const ico = (n, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

const PILL = {
  confirmed: ['ok', 'Bevestigd'], completed: ['info', 'Afgerond'], hold: ['warn', 'Wacht op betaling'], option: ['info', 'Optie'], offered: ['warn', 'Aanbod wachtlijst'], cancelled: ['', 'Geannuleerd'], expired: ['', 'Verlopen'], exception: ['bad', 'Actie nodig'], declined: ['', 'Afgewezen'],
  'Betaald': ['ok', 'Betaald'], 'Gepland': ['info', 'Gepland'], 'Nog te ontvangen': ['warn', 'Nog te ontvangen'], 'Te laat': ['bad', 'Te laat'], 'Uitzondering': ['bad', 'Uitzondering'],
  'Aangevraagd': ['warn', 'Aangevraagd'], 'Optie': ['info', 'Optie'], 'Bevestigd': ['ok', 'Bevestigd'], 'Vervallen': ['', 'Vervallen'],
  published: ['ok', 'Live voor klanten'], concept: ['warn', 'Concept'], ingetrokken: ['', 'Ingetrokken'],
  paid: ['ok', 'Betaald'], pending: ['warn', 'In afwachting'], failed: ['bad', 'Mislukt'], refunded: ['info', 'Terugbetaald'], refund_pending: ['warn', 'Terugbetaling loopt'],
  bevestigd: ['ok', 'Bevestigd'], voorbeeld: ['warn', 'Voorbeelddata'], onbevestigd: ['bad', 'Niet bevestigd'], betaald: ['ok', 'Betaald'], verlopen: ['', 'Verlopen'], verzonden: ['info', 'Verzonden'], akkoord: ['info', 'Akkoord'], 'actie nodig': ['bad', 'Actie nodig']
};
const pill = (k, label) => { const p = ['ok', 'warn', 'bad', 'info'].includes(k) ? [k, label] : (PILL[k] || ['', k]); return `<span class="pill ${p[0]}">${esc(label || p[1])}</span>`; };

/* foto's: verkleinen voor opslag en snelheid */
function readImage(file, max = 1280) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('Kies een afbeelding'));
    const fr = new FileReader(); fr.onerror = () => rej(new Error('Kon het bestand niet lezen'));
    fr.onload = () => { const img = new Image(); img.onload = () => { const r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); }; img.onerror = () => rej(new Error('Ongeldige afbeelding')); img.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
const safeSrc = u => (typeof u === 'string' && (/^data:(image|video)\//.test(u) || u.startsWith('/_blob/') || /^media\/[\w.\-]+$/.test(u))) ? u : null;
function photo(m, cls = '', label = 'Foto volgt', art) {
  const src = m ? safeSrc(m.type === 'video' ? m.poster : m.dataUrl) : null;
  if (src) return `<div class="photo ${cls}"><img src="${esc(src)}" alt="${esc(m.subject || 'Werk van de salon')}" loading="lazy" decoding="async" style="object-position:${esc(m.focus || '50% 40%')}"></div>`;
  const a = art || {}; const kind = a.kind || window.lookArt(a.hint || label);
  return `<div class="photo ${cls}" role="img" aria-label="${esc(label)}"><div class="art">${window.hairArt(kind, a)}</div>${a.tag ? `<span class="tag">${esc(a.tag)}</span>` : ''}</div>`;
}
/* toast & dialoog */
let toastT; function toast(msg, bad) { const el = document.getElementById('toast'); el.innerHTML = `<div class="toast ${bad ? 'bad' : ''}" role="status">${esc(msg)}</div>`; clearTimeout(toastT); toastT = setTimeout(() => el.innerHTML = '', bad ? 5200 : 3200); }
let lastFocus = null;
function modal(title, body, opts = {}) {
  lastFocus = document.activeElement;
  document.getElementById('overlay').innerHTML = `<div class="scrim" data-act="closeModal" data-self="1"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="bar"><h2>${esc(title)}</h2><button class="x" data-act="closeModal" aria-label="Sluiten">${ico('x', 20)}</button></div>${body}</div></div>`;
  const f = document.querySelector('#overlay .sheet input, #overlay .sheet button:not(.x), #overlay .sheet select'); (f || document.querySelector('#overlay .x')).focus();
}
function closeModal() { document.getElementById('overlay').innerHTML = ''; if (lastFocus && lastFocus.isConnected) lastFocus.focus(); }
function confirmBox(title, text, act, data, danger) { modal(title, `<p>${esc(text)}</p><div class="row end" style="margin-top:16px"><button class="btn ghost" data-act="closeModal">Terug</button><button class="btn ${danger ? 'danger' : ''}" data-act="${esc(act)}" ${Object.entries(data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>Bevestigen</button></div>`); }

/* router */
const route = () => (location.hash || '#home').slice(1) || 'home';
function go(r) { if (location.hash.slice(1) === r) render(); else location.hash = r; window.scrollTo(0, 0); }
window.addEventListener('hashchange', () => { closeModal(); const run = () => { render(); window.scrollTo(0, 0); }; if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(run); else run(); });

/* acties via data-act */
const ACT = window.ACT = {};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.self && e.target !== b) return;
  const f = ACT[b.dataset.act]; if (!f) return;
  e.preventDefault(); f(b.dataset, b, e);
});
document.addEventListener('submit', e => { const f = e.target.dataset.form; if (!f || !ACT[f]) return; e.preventDefault(); const o = Object.fromEntries(new FormData(e.target)); if (e.submitter && e.submitter.name) o[e.submitter.name] = e.submitter.value; ACT[f](o, e.target); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.getElementById('overlay').innerHTML) closeModal(); else if (U.chatOpen) { U.chatOpen = false; renderChat(); } } });
ACT.closeModal = closeModal;
ACT.go = d => go(d.r);

/* demobalk */
const MODE = window.APP_MODE === 'studio' ? 'studio' : 'klant';
function demoBar() {
  const r = route(); const sys = ['testrapport', 'oplevering'].includes(r);
  return `<div class="demo" id="demo"><span><b>${MODE === 'studio' ? 'Studio-app' : 'Klantapp'}</b> · voorbeeldomgeving · testbetalingen · <span id="store">${esc(cloudState)}</span></span>
  <span class="row" style="gap:6px">${MODE === 'studio' ? `<a class="lnk" href="index.html">Open de klantapp</a>` : `<a class="lnk" href="studio.html">Open de Studio-app</a>`}
  ${sys ? `<button class="lnk" data-act="go" data-r="${MODE === 'studio' ? 'werk' : 'home'}">Terug</button>` : ''}<button class="lnk" data-act="go" data-r="testrapport">Testrapport</button><button class="lnk" data-act="go" data-r="oplevering">Oplevering</button></span></div>`;
}
const studioOnly = () => `<main class="c-main" style="max-width:640px"><h1 class="serif" style="margin-top:30px">De werkruimte is een aparte app</h1><p class="muted">Afspraken, inbox, voorraad en betalingen staan in de Studio-app van de salon. Klanten hebben daar geen toegang toe.</p><a class="btn" href="studio.html">Open de Studio-app</a></main>`;
function paintStore() { const el = document.getElementById('store'); if (el) el.textContent = cloudState; }

function render() {
  if (!window.renderWork || !window.renderClient || !window.viewTests) return;
  const r = route(); const app = document.getElementById('app');
  document.body.classList.remove('has-sticky');
  let html;
  document.body.classList.toggle('studio', MODE === 'studio');
  if (r === 'testrapport') html = window.viewTests(); else if (r === 'oplevering') html = window.viewDelivery();
  else if (MODE === 'studio') html = window.renderWork(r.startsWith('werk') ? r : 'werk');
  else if (r.startsWith('werk')) html = studioOnly(); else html = window.renderClient(r);
  app.innerHTML = demoBar() + html;
  const mainEl = document.getElementById('main'); if (mainEl && render.last !== r) mainEl.classList.add('enter'); render.last = r;
  const d = document.getElementById('demo'); document.documentElement.style.setProperty('--demoH', (d ? d.offsetHeight : 0) + 'px');
  if (document.querySelector('.sticky-cta')) document.body.classList.add('has-sticky');
  renderChat(); reveal(); slides(); if (window.feedWire) window.feedWire();
  const h = app.querySelector('h1'); if (h && window.__nav) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } window.__nav = true;
}

/* animaties: binnenkomen bij scrollen en wisselende hero-foto's */
const RM = matchMedia('(prefers-reduced-motion: reduce)');
let io = null;
function reveal() {
  if (RM.matches || !('IntersectionObserver' in window)) return;
  if (io) io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll('#main .sect, #main .look, #main .reel, #main .svc-big, #main .disc-i, #main .how-i, #main .feed-i, #main .mz, #main .prod, #main .fact').forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', (i % 4) * 70 + 'ms'); io.observe(el); });
}
let slideT = null;
function slides() { clearInterval(slideT); const box = document.querySelector('.fc.intro .hero-slides') || document.querySelector('.hero-slides'); if (!box || RM.matches) return; const im = box.querySelectorAll('img'); if (im.length < 2) return; let i = 0; slideT = setInterval(() => { if (!box.isConnected) return clearInterval(slideT); im[i].classList.remove('on'); i = (i + 1) % im.length; im[i].classList.add('on'); }, 5200); }
document.addEventListener('mousemove', e => { if (RM.matches || matchMedia('(hover: none)').matches) return; const b = e.target.closest && e.target.closest('.imm-cta .btn, .rcpt .btn, .done .btn'); document.querySelectorAll('.mag').forEach(x => { if (x !== b) { x.style.transform = ''; x.classList.remove('mag'); } }); if (!b) return; const r = b.getBoundingClientRect(); b.classList.add('mag'); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
let tick = false;
window.addEventListener('scroll', () => { if (tick || RM.matches) return; tick = true; requestAnimationFrame(() => { tick = false; const im = document.getElementById('imm'); if (im) { const h = im.offsetHeight || 1; im.style.setProperty('--sp', Math.min(1, Math.max(0, scrollY / h)).toFixed(3)); } const hd = document.querySelector('.c-top'); if (hd) hd.classList.toggle('scrolled', scrollY > 10); }); }, { passive: true });

/* aftellen voor reserveringen */
setInterval(() => {
  let expired = false;
  document.querySelectorAll('[data-until]').forEach(el => { const ms = +el.dataset.until - Date.now(); if (ms <= 0) { el.textContent = '0:00'; expired = true; } else el.textContent = Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0'); });
  if (expired && !document.querySelector('#overlay .sheet')) { call('pub_catalog', {}, true); render(); }
}, 1000);

/* uploads naar de opslag van het artefact (foto's en video's) */
(async () => { try { if (window.claude && window.claude.use) { const a = await window.claude.use('assets'); if (a) { window.__assets = a; } } } catch (e) {} })();
/* door de salon aangeleverde media die met de app meegeleverd zijn */
fetch('media.json').then(r => r.ok ? r.json() : null).then(list => { if (!Array.isArray(list) || !list.length) return; const have = new Set(E.state.media.map(m => m.id)); const add = list.filter(x => x && x.id && !have.has(x.id)); if (add.length) { E.state.media.push(...add.map(x => ({ consent: true, publish: true, createdAt: Date.now(), ...x }))); persist(E.state); render(); } }).catch(() => {});

/* gedeelde opslag via het artefact (indien beschikbaar) */
(async () => {
  try {
    if (!window.claude || !window.claude.use) return;
    const db = await Promise.race([window.claude.use('db'), new Promise(r => setTimeout(() => r(null), 10000))]);
    if (!db) return;
    cloud = db; const snap = await db.doc('salon/state').get();
    const remote = snap && (snap.data ? (typeof snap.data === 'function' ? snap.data() : snap.data) : snap);
    if (remote && remote.json && (!E.state.meta.savedAt || remote.savedAt > E.state.meta.savedAt)) { const st = JSON.parse(remote.json); if (st.meta && st.meta.schema === 4) { E = boot(st); lsSet(KEY, remote.json); } }
    cloudState = 'opgeslagen'; render();
  } catch (e) { cloudState = 'lokaal (cloud niet bereikbaar)'; paintStore(); }
})();

window.APP = { safeSrc, get assets() { return window.__assets || null; }, get E() { return E; }, J, call, tryCall, esc, eur, dt, dlong, dshort, hm, todayISO, cents, eurIn, ico, pill, photo, readImage, toast, modal, closeModal, confirmBox, go, route, render, lsSet, lsGet, lsDel,
  resetDemo() { E.reset(); seedDemo(); U.ctok = null; U.stok = null; U.role = null; U.cart = []; lsDel('jrs_ctok'); lsDel('jrs_cart'); go('home'); toast('Voorbeelddata opnieuw geladen'); } };
}
