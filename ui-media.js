/* JR'SBEAUTYBAR — media: highlights + story-viewer, video-rij, voor & na, feed, bulk-upload */
{
const A = window.APP, U = window.U, ACT = window.ACT;
const { esc, eur, ico, pill, photo, toast, modal, closeModal, go } = A;
const HL = [
  ['Sew-in', 'svc_sewin', 'waves'], ['Pre colored', null, 'precolor'], ['Curls', null, 'curls'], ['Ponytails', 'svc_pony', 'sleek'], ['Bundels', null, 'bundle'],
  ['HU/HD', 'svc_halfup', 'straight'], ['Cliënt view', null, 'waves'], ['Cliënt cam 2k26', null, 'precolor'], ['TikTok’s', null, 'curls']];
window.HIGHLIGHTS = HL;
const HLTXT = { 'Sew-in': 'Volle, natuurlijke sew-ins met jouw gekozen bundels.', 'Pre colored': 'Kleur zonder zelf te verven: honey, burgundy en meer.', 'Curls': 'Definitie en volume voor krullen.', 'Ponytails': 'Sleek, lang en strak voor elke gelegenheid.', 'Bundels': 'Kies je textuur, kleur en lengte.', 'HU/HD': 'Half up half down: deels opgestoken, deels los.', 'Cliënt view': 'Resultaten zoals klanten ze zien.', 'Cliënt cam 2k26': 'Beelden van klanten uit 2026.', 'TikTok’s': 'Korte video’s uit de salon.' };
const src = m => A.safeSrc(m && m.dataUrl);
const byHL = (C, h) => C.media.filter(m => m.highlight === h || (!m.highlight && m.subject === h));

/* ---------- highlights ---------- */
window.highlightsRow = function (C) {
  return `<section class="hl" aria-label="Highlights"><div class="hl-row" role="list">${HL.map(([h, , art]) => { const first = byHL(C, h)[0]; const n = byHL(C, h).length;
    return `<button class="hl-i" role="listitem" data-act="story" data-h="${esc(h)}" aria-label="Bekijk ${esc(h)}${n ? ', ' + n + ' items' : ''}"><span class="ring"><span class="in">${first && A.safeSrc(first.type === 'video' ? first.poster : first.dataUrl) ? `<img src="${esc(first.type === 'video' ? first.poster : first.dataUrl)}" alt="" loading="lazy">` : window.hairArt(art, { seed: h + 'hl' })}</span></span><span class="t">${esc(h)}</span></button>`; }).join('')}</div></section>`;
};
let ST = null;
ACT.story = d => { const C = A.call('pub_catalog', {}, true); const hi = HL.findIndex(x => x[0] === d.h); ST = { hi, i: 0, C, paused: false, t0: Date.now() }; drawStory(); };
function slidesOf(C, hi) {
  const [h, svc, art] = HL[hi]; const items = byHL(C, h);
  if (items.length) return items.map(m => ({ m, h, svc: m.serviceId || svc }));
  return [{ art, h, svc, text: HLTXT[h] }, { art, h, svc, text: 'Eigen foto’s en video’s van deze highlight verschijnen hier zodra ze zijn aangeleverd.', alt: true }];
}
function drawStory() {
  const el = document.getElementById('story'); if (!ST) { el.innerHTML = ''; document.body.style.overflow = ''; return; }
  const sl = slidesOf(ST.C, ST.hi), s = sl[ST.i], dur = s.m && s.m.type === 'video' ? 0 : 5200;
  const media = s.m ? (s.m.type === 'video' && A.safeSrc(s.m.dataUrl) ? `<video src="${esc(s.m.dataUrl)}" ${A.safeSrc(s.m.poster) ? `poster="${esc(s.m.poster)}"` : ''} playsinline autoplay ${s.m.sound ? '' : 'muted'} data-story-video></video>` : src(s.m) ? `<img src="${esc(s.m.dataUrl)}" alt="${esc(s.m.caption || s.h)}" style="object-position:${esc(s.m.focus || '50% 40%')}">` : '') : `<div class="art">${window.hairArt(s.art, { dark: true, seed: s.h + ST.i })}</div>`;
  document.body.style.overflow = 'hidden';
  el.innerHTML = `<div class="story" role="dialog" aria-modal="true" aria-label="Highlight ${esc(s.h)}">
    <div class="st-frame">${media}<div class="st-shade"></div>
      <div class="st-bars">${sl.map((x, i) => `<i><b style="${i < ST.i ? 'width:100%' : i === ST.i && dur ? `animation:stb ${dur}ms linear forwards;${ST.paused ? 'animation-play-state:paused' : ''}` : 'width:0'}"></b></i>`).join('')}</div>
      <div class="st-head"><span class="ring sm"><span class="in">${window.hairArt(HL[ST.hi][2], { seed: s.h + 'hl' })}</span></span><b>${esc(s.h)}</b><small>jr.sbeautybar</small><button class="x" data-act="storyClose" aria-label="Sluiten">${ico('x', 20)}</button></div>
      <button class="st-zone l" data-act="storyNav" data-n="-1" aria-label="Vorige"></button><button class="st-zone r" data-act="storyNav" data-n="1" aria-label="Volgende"></button>
      <div class="st-foot">${s.text || (s.m && s.m.caption) ? `<p>${esc(s.text || s.m.caption)}</p>` : ''}${s.m ? '' : ''}
        <div class="row">${s.svc ? `<button class="btn light sm" data-act="storyBook" data-s="${esc(s.svc)}">Boek deze look</button>` : `<button class="btn light sm" data-act="storyAdvice">Vraag advies</button>`}<button class="btn line-light sm" data-act="storyPause">${ST.paused ? 'Afspelen' : 'Pauze'}</button></div></div></div></div>`;
  clearTimeout(ST.timer);
  if (dur && !ST.paused) ST.timer = setTimeout(() => storyStep(1), dur);
  const v = el.querySelector('[data-story-video]'); if (v) v.onended = () => storyStep(1);
  el.querySelector('.st-zone.r').focus({ preventScroll: true });
}
function storyStep(n) {
  if (!ST) return; const sl = slidesOf(ST.C, ST.hi); ST.i += n; ST.paused = false;
  if (ST.i >= sl.length) { ST.hi++; ST.i = 0; if (ST.hi >= HL.length) { ST = null; return drawStory(); } }
  if (ST.i < 0) { ST.hi = Math.max(0, ST.hi - 1); ST.i = 0; }
  drawStory();
}
ACT.storyNav = d => storyStep(+d.n);
ACT.storyClose = () => { if (ST) clearTimeout(ST.timer); ST = null; drawStory(); };
ACT.storyPause = () => { ST.paused = !ST.paused; const v = document.querySelector('[data-story-video]'); if (v) ST.paused ? v.pause() : v.play().catch(() => {}); drawStory(); };
ACT.storyBook = d => { ACT.storyClose(); U.flow = { step: 2, serviceId: d.s }; go('boeken'); };
ACT.storyAdvice = () => { ACT.storyClose(); go('advies'); };
document.addEventListener('keydown', e => { if (!ST) return; if (e.key === 'ArrowRight') storyStep(1); else if (e.key === 'ArrowLeft') storyStep(-1); else if (e.key === 'Escape') ACT.storyClose(); else if (e.key === ' ') { e.preventDefault(); ACT.storyPause(); } });

/* ---------- video-rij (TikTok-stijl) ---------- */
window.reelsRail = function (C) {
  const vids = C.media.filter(m => m.type === 'video');
  const photos = C.media.filter(m => m.type !== 'video' && A.safeSrc(m.dataUrl));
  const items = vids.length ? vids : photos.length ? photos.slice(0, 8).map(m => ({ fake: true, still: m, h: m.highlight || m.subject, svc: m.serviceId })) : HL.slice(0, 6).map(([h, svc, art]) => ({ fake: true, h, svc, art }));
  return `<section class="sect stack"><div class="row between"><div><span class="kicker">Video’s</span><h2>Uit de salon</h2></div><div class="row"><button class="btn ghost sm" data-act="rail" data-t="reels" data-n="-1" aria-label="Vorige">${ico('back', 18)}</button><button class="btn ghost sm" data-act="rail" data-t="reels" data-n="1" aria-label="Volgende">${ico('chev', 18)}</button></div></div>
  <div class="rail" id="reels" tabindex="0" aria-label="Video’s">${items.map((m, i) => m.fake
    ? `<article class="reel"><div class="reel-media">${m.still ? `<img class="kb" src="${esc(m.still.dataUrl)}" alt="${esc(m.still.caption || m.h)}" loading="lazy" style="object-position:${esc(m.still.focus || '50% 30%')}">` : `<div class="art moving">${window.hairArt(m.art, { dark: true, seed: m.h + 'reel' })}</div><span class="play" aria-hidden="true">${playIco}</span>`}<span class="tag">${m.still ? esc(m.still.caption || 'Video volgt') : 'Video volgt'}</span></div><b>${esc(m.h)}</b><button class="btn quiet sm" data-act="${m.svc ? 'pickSvcGo' : 'go'}" data-id="${esc(m.svc || '')}" data-r="advies">${m.svc ? 'Boek deze look' : 'Vraag advies'}</button></article>`
    : `<article class="reel"><div class="reel-media"><video preload="none" playsinline loop ${m.sound ? '' : 'muted'} ${A.safeSrc(m.poster) ? `poster="${esc(m.poster)}"` : ''} data-src="${esc(A.safeSrc(m.dataUrl) || '')}" aria-label="${esc(m.caption || m.highlight || 'Video')}"></video><button class="play" data-act="reelPlay" aria-label="Video afspelen">${playIco}</button></div><b>${esc(m.highlight || m.subject)}</b>${m.caption ? `<small class="muted">${esc(m.caption)}</small>` : ''}${m.serviceId ? `<button class="btn quiet sm" data-act="pickSvcGo" data-id="${esc(m.serviceId)}">Boek deze look</button>` : ''}</article>`).join('')}</div>
  ${vids.length ? '' : '<p class="muted">Hier komen de TikTok- en Instagram-video’s van de salon, met afspeelknop en posterbeeld.</p>'}</section>`;
};
const playIco = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
ACT.reelPlay = (d, b) => { const v = b.parentElement.querySelector('video'); if (!v) return; if (!v.src && v.dataset.src) v.src = v.dataset.src; if (v.paused) { document.querySelectorAll('.reel video').forEach(x => { if (x !== v) x.pause(); }); v.play().then(() => b.classList.add('on')).catch(() => toast('Afspelen lukt niet in deze weergave', true)); } else { v.pause(); b.classList.remove('on'); } };
ACT.rail = d => { const r = document.getElementById(d.t); if (r) r.scrollBy({ left: (+d.n) * r.clientWidth * .8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };

/* ---------- voor & na ---------- */
window.beforeAfter = function (C) {
  const p = C.media.find(m => m.type === 'voorna' && src(m) && A.safeSrc(m.pairUrl)); if (!p) return '';
  const before = p ? `<img src="${esc(p.pairUrl)}" alt="Voor">` : `<div class="art">${window.hairArt('straight', { seed: 'voor', color: '#4' })}</div>`;
  const after = p ? `<img src="${esc(p.dataUrl)}" alt="Na">` : `<div class="art">${window.hairArt('waves', { seed: 'na', color: '1B' })}</div>`;
  return `<section class="sect"><div class="ba-wrap"><div class="stack"><span class="kicker">Voor &amp; na</span><h2>${p ? esc(p.highlight || p.subject) : 'Zie het verschil'}</h2><p class="muted">${p ? esc(p.caption || 'Zelfde behandeling, gepubliceerd met toestemming.') : 'Schuif om voor en na te vergelijken. Alleen echte voor-en-na’s van dezelfde behandeling worden getoond, met toestemming van de klant.'}</p>${p && p.serviceId ? `<button class="btn sm" data-act="pickSvcGo" data-id="${esc(p.serviceId)}" style="justify-self:start">Boek deze behandeling</button>` : ''}</div>
  <div class="ba" style="--p:50%"><div class="ba-l">${before}<span class="ba-tag">Voor</span></div><div class="ba-r">${after}<span class="ba-tag r">Na</span></div><div class="ba-handle" aria-hidden="true"><span>${ico('back', 14)}${ico('chev', 14)}</span></div><label class="sr" for="baR">Vergelijk voor en na</label><input id="baR" type="range" min="0" max="100" value="50" data-ba>${p ? '' : ''}</div></div></section>`;
};
document.addEventListener('input', e => { if (e.target.matches('[data-ba]')) e.target.closest('.ba').style.setProperty('--p', e.target.value + '%'); });

/* ---------- werkwijze, shop-rij, feed ---------- */
window.howItWorks = () => `<section class="sect stack"><div><span class="kicker">Zo werkt het</span><h2>Van intake tot onderhoud</h2></div><div class="how">${[['Intake & advies', 'We bekijken je haar en wensen, eventueel vooraf met foto’s.', 'straight'], ['Installatie', 'Jouw gekozen bundel ligt klaar; de behandeling is volledig ingepland.', 'waves'], ['Nazorg & onderhoud', 'Je krijgt verzorgingstips en op tijd een voorstel voor onderhoud.', 'curls']].map(([t, d, a]) => `<article class="how-i"><div class="how-art">${window.hairArt(a, { seed: t })}</div><h3 class="serif" style="font-size:24px">${t}</h3><p class="muted">${d}</p></article>`).join('')}</div></section>`;
window.shopRail = C => `<section class="sect stack"><div class="row between"><div><span class="kicker">Shop</span><h2>Haar &amp; verzorging</h2></div><a class="btn ghost sm" href="#shop">Alles bekijken</a></div><div class="rail" id="shoprail">${C.products.map(p => `<button class="prod rail-i" data-act="openProd" data-id="${esc(p.id)}">${photo(C.media.find(m => m.productId === p.id), 'sq', 'Productfoto volgt', { kind: p.category === 'Haarbundels' ? (p.id === 'prd_pony' ? 'sleek' : 'bundle') : p.category === 'Supplementen' ? 'jar' : p.category === 'Verzorging' ? 'bottle' : 'bonnet', color: (p.variants[0] || {}).color, seed: p.id })}<b>${esc(p.name)}</b><span>${p.variants.length > 1 ? 'vanaf ' : ''}${eur(Math.min(...p.variants.map(v => v.priceCents)))}</span></button>`).join('')}</div></section>`;
window.feedGrid = function (C) {
  const ms = C.media.filter(m => m.kind !== 'product').slice(-9).reverse();
  const cells = ms.length ? ms : HL.slice(0, 9).map(([h, , a]) => ({ fake: true, h, a }));
  return `<section class="sect stack"><div class="row between"><div><span class="kicker">@jr.sbeautybar</span><h2>Volg de salon</h2></div><div class="row"><a class="btn ghost sm" href="https://www.instagram.com/jr.sbeautybar/" rel="noopener">Instagram</a><a class="btn ghost sm" href="https://www.tiktok.com/@jr.sbeautybar" rel="noopener">TikTok</a></div></div>
  <div class="feed">${cells.map((m, i) => m.fake ? `<button class="feed-i" data-act="story" data-h="${esc(m.h)}" aria-label="${esc(m.h)}"><div class="art">${window.hairArt(m.a, { seed: m.h + 'f' + i })}</div><span class="ov">${esc(m.h)}</span></button>` : `<button class="feed-i" data-act="story" data-h="${esc(m.highlight || HL[0][0])}" aria-label="${esc(m.caption || m.highlight || 'Bekijk')}">${A.safeSrc(m.type === 'video' ? m.poster : m.dataUrl) ? `<img src="${esc(m.type === 'video' ? m.poster : m.dataUrl)}" alt="" loading="lazy" style="object-position:${esc(m.focus || '50% 40%')}">` : `<div class="art">${window.hairArt('waves', { seed: m.id })}</div>`}${m.type === 'video' ? `<span class="vid">${playIco}</span>` : ''}<span class="ov">${esc(m.highlight || m.subject)}</span></button>`).join('')}</div>
  <p class="muted">Werkt Instagram of TikTok even niet? Boeken en shoppen gaan hier gewoon door.</p></section>`;
};

/* ---------- werkruimte: media in bulk ---------- */
window.vMediaView = function () {
  const r = A.tryCall('own_media'); if (r.err) throw r.err; const M = r.ok; const sv = A.E.state.services; const assets = A.assets;
  const f = U.sel.mf || 'Alle';
  const list = M.filter(m => f === 'Alle' || (m.highlight || m.subject) === f);
  return `<div class="w-top"><h1 class="brandish" style="font-size:clamp(28px,4vw,38px)">Foto’s &amp; video’s</h1><span class="muted">${M.length} items · ${M.filter(m => m.type === 'video').length} video’s</span></div>
  <form data-form="bulkUp" class="card stack"><h3>Uploaden per highlight</h3><p class="muted">Kies meerdere foto’s en video’s tegelijk. Foto’s worden automatisch geoptimaliseerd; van video’s wordt een posterbeeld gemaakt. ${assets ? 'Opslag: veilige bestandsopslag van de app.' : 'Video’s worden opgeslagen zodra de app als gepubliceerde versie geopend is; foto’s werken altijd.'}</p>
    <label class="f">Bestanden<input class="i" type="file" name="files" accept="image/*,video/*" multiple data-bulk></label>${U.sel.bulkN ? `<p class="note">${U.sel.bulkN} bestand(en) gekozen</p>` : ''}
    <div class="grid2"><label class="f">Highlight<select class="i" name="highlight">${HL.map(([h]) => `<option>${esc(h)}</option>`).join('')}</select></label><label class="f">Plek in de app<select class="i" name="kind"><option value="portfolio">Portfolio, story &amp; feed</option><option value="hero">Hoofdbeeld klantscherm</option><option value="product">Productfoto</option></select></label>
    <label class="f">Gekoppelde behandeling<select class="i" name="serviceId"><option value="">Automatisch via highlight</option>${sv.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></label><label class="f">Gekoppeld product<select class="i" name="productId"><option value="">Geen</option>${A.E.state.products.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>
    <label class="f">Bijschrift<input class="i" name="caption" placeholder="Bijv. 22 inch body wave, sew-in"></label><label class="f">Herkomst<input class="i" name="source" value="Instagram/TikTok @jr.sbeautybar" required></label></div>
    <label class="chk"><input type="checkbox" name="consent"><span>Toestemming voor publicatie is vastgelegd (herkenbare klanten: schriftelijk)</span></label><label class="chk"><input type="checkbox" name="sound"><span>Origineel geluid mag aan (alleen met bevestigde muziekrechten)</span></label>
    <div class="row"><button class="btn sm">Uploaden</button><button type="button" class="btn ghost sm" data-act="baNew">Voor-en-na toevoegen</button></div><div id="upProg"></div></form>
  <div class="chips" style="margin:16px 0 10px" role="group" aria-label="Filter">${['Alle', ...HL.map(x => x[0])].map(h => `<button class="chip" data-act="mf" data-h="${esc(h)}" aria-pressed="${f === h}">${esc(h)} ${h === 'Alle' ? M.length : M.filter(m => (m.highlight || m.subject) === h).length}</button>`).join('')}</div>
  ${list.length ? `<div class="mgrid">${list.map(m => `<div class="card stack" style="padding:10px"><div class="mthumb">${m.type === 'video' && A.safeSrc(m.dataUrl) ? `<video src="${esc(m.dataUrl)}" ${A.safeSrc(m.poster) ? `poster="${esc(m.poster)}"` : ''} controls preload="none" playsinline muted></video>` : photo(m, 'sq')}</div>
    <div class="row between"><b>${esc(m.highlight || m.subject)}</b>${pill(m.publish ? 'published' : 'concept', m.publish ? 'Zichtbaar' : 'Verborgen')}</div><small class="muted">${esc(m.type)} · ${esc(m.kind)} · ${esc(m.source || '')}${m.caption ? ' · ' + esc(m.caption) : ''}</small>
    ${m.type !== 'video' ? `<form data-form="mediaFocus" class="stack"><input type="hidden" name="id" value="${esc(m.id)}"><label class="f">Focus links–rechts<input type="range" min="0" max="100" name="x" value="${parseInt(m.focus) || 50}"></label><label class="f">Focus boven–onder<input type="range" min="0" max="100" name="y" value="${parseInt((m.focus || '').split(' ')[1]) || 40}"></label><button class="btn ghost sm">Focus opslaan</button></form>` : ''}
    <div class="row"><button class="btn ghost sm" data-act="mediaToggle" data-id="${esc(m.id)}" data-p="${m.publish ? 0 : 1}">${m.publish ? 'Verbergen' : 'Tonen'}</button><button class="btn danger sm" data-act="mediaRm" data-id="${esc(m.id)}">Verwijderen</button></div></div>`).join('')}</div>` : '<div class="empty">Nog geen foto’s of video’s in deze highlight. De klantomgeving toont tot die tijd illustraties.</div>'}`;
};
ACT.mf = d => { U.sel.mf = d.h; A.render(); };
document.addEventListener('change', e => { if (e.target.matches('[data-bulk]')) { U.sel.bulkFiles = [...e.target.files]; U.sel.bulkN = U.sel.bulkFiles.length; const n = document.querySelector('#upProg'); if (n) n.innerHTML = `<p class="note">${U.sel.bulkN} bestand(en) gekozen</p>`; } });
function posterOf(file) { return new Promise(res => { const v = document.createElement('video'); v.muted = true; v.preload = 'metadata'; v.src = URL.createObjectURL(file); v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); }; v.onseeked = () => { const c = document.createElement('canvas'); const r = Math.min(1, 900 / Math.max(v.videoWidth, v.videoHeight)); c.width = v.videoWidth * r; c.height = v.videoHeight * r; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .8)); URL.revokeObjectURL(v.src); }; v.onerror = () => res(''); setTimeout(() => res(''), 8000); }); }
async function store(file, isVideo) {
  const as = A.assets;
  if (as) { const blob = isVideo ? file : await (await fetch(await A.readImage(file, 1600))).blob(); if (blob.size > 20 * 1024 * 1024) throw new Error(file.name + ' is groter dan 20 MB'); const r = await as.upload(blob); return { url: r.url || '/_blob/' + r.id, id: r.id }; }
  if (isVideo) throw new Error('Video’s opslaan kan in de gepubliceerde app (bestandsopslag niet beschikbaar in deze weergave)');
  return { url: await A.readImage(file, 1600) };
}
ACT.bulkUp = async f => {
  const files = U.sel.bulkFiles || []; if (!files.length) return toast('Kies eerst bestanden', true); if (!f.consent) return toast('Leg eerst de toestemming vast', true);
  const prog = document.getElementById('upProg'); let ok = 0, fail = [];
  const svc = f.serviceId || (HL.find(x => x[0] === f.highlight) || [])[1] || null;
  for (const [i, file] of files.entries()) {
    if (prog) prog.innerHTML = `<div class="prog"><i style="width:${Math.round(i / files.length * 100)}%"></i></div><small>Bezig met ${esc(file.name)} (${i + 1}/${files.length})</small>`;
    try { const isV = /^video\//.test(file.type); const st = await store(file, isV); const poster = isV ? await posterOf(file) : '';
      const r = A.tryCall('own_media_add', { type: isV ? 'video' : 'foto', kind: f.kind, highlight: f.highlight, subject: f.highlight, caption: f.caption, source: f.source, consent: true, publish: true, serviceId: svc, productId: f.productId || null, dataUrl: st.url, assetId: st.id || null, poster, sound: !!f.sound });
      if (r.err) throw r.err; ok++; } catch (e) { fail.push(file.name + ': ' + e.message); }
  }
  U.sel.bulkFiles = null; U.sel.bulkN = 0; toast(`${ok} geüpload${fail.length ? ', ' + fail.length + ' mislukt' : ''}`, !!fail.length); A.render(); if (fail.length) modal('Niet gelukt', `<ul>${fail.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
};
ACT.baNew = () => modal('Voor-en-na toevoegen', `<form data-form="baSave" class="stack"><div class="grid2"><label class="f">Foto vóór<input class="i" type="file" accept="image/*" name="b" data-bafile="b"></label><label class="f">Foto na<input class="i" type="file" accept="image/*" name="a" data-bafile="a"></label></div><label class="f">Highlight<select class="i" name="highlight">${HL.map(([h]) => `<option>${esc(h)}</option>`).join('')}</select></label><label class="f">Bijschrift<input class="i" name="caption"></label><label class="chk"><input type="checkbox" name="same"><span>Beide foto’s tonen dezelfde behandeling bij dezelfde klant</span></label><label class="chk"><input type="checkbox" name="consent"><span>De klant gaf toestemming voor publicatie</span></label><button class="btn">Opslaan</button></form>`);
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.bafile; if (k) { U.sel['ba_' + k] = e.target.files[0]; } });
ACT.baSave = async f => { if (!U.sel.ba_b || !U.sel.ba_a) return toast('Kies beide foto’s', true); if (!f.same || !f.consent) return toast('Bevestig dezelfde behandeling en de toestemming', true);
  try { const b = await store(U.sel.ba_b, false), a = await store(U.sel.ba_a, false); const svc = (HL.find(x => x[0] === f.highlight) || [])[1] || null; const r = A.tryCall('own_media_add', { type: 'voorna', sameTreatment: true, kind: 'portfolio', highlight: f.highlight, caption: f.caption, source: 'Salon', consent: true, publish: true, serviceId: svc, dataUrl: a.url, pairUrl: b.url }); if (r.err) throw r.err; closeModal(); toast('Voor-en-na toegevoegd'); A.render(); } catch (e) { toast(e.message, true); } };
}
