/* Testrapport en opleverstatus */
{
const A = window.APP, ACT = window.ACT, U = window.U;
const { esc } = A;
let last = null;
window.viewTests = function () {
  if (!last) { try { const t0 = performance.now(); last = { r: window.runScenarios(window.JRS), ms: Math.round(performance.now() - t0) }; } catch (e) { last = { err: e.message, r: [] }; } }
  const r = last.r, ok = r.filter(x => x.ok).length;
  const names = { 1: 'Instagram-bezoeker boekt intake en reserveert bundel', 2: 'Bot leert één vraag na goedkeuring', 3: 'Annulering → wachtlijst, geen dubbele boeking of laatste bundel', 4: 'VIP-aanvraag maanden vooraf met offerte en aanbetaling', 5: 'Deelbetaling, volledige betaling en rolrechten', 6: 'Concept overnemen, agenda vooraf beoordelen, dagafsluiting', R: 'Regressie: tijdzone, notatie, late betaling, dubbel versturen' };
  const groups = [...new Set(r.map(x => x.sc))];
  return `<main class="c-main" style="padding-bottom:60px"><h1 class="brandish">Testrapport</h1>
  <p class="muted">De scenario’s draaien automatisch op een aparte kopie van de gegevens, met een gesimuleerde klok in Europe/Amsterdam. Jouw voorbeelddata blijft onaangeroerd.</p>
  ${last.err ? `<p class="note bad">Testfout: ${esc(last.err)}</p>` : ''}
  <div class="card row between" style="margin:14px 0"><span class="kpi">${ok} / ${r.length}</span><span>${ok === r.length ? A.pill('ok', 'Alle controles geslaagd') : A.pill('bad', (r.length - ok) + ' mislukt')}</span><button class="btn ghost sm" data-act="rerun">Opnieuw uitvoeren</button></div>
  ${groups.map(g => `<details class="d" ${r.some(x => x.sc === g && !x.ok) ? 'open' : ''} style="margin-bottom:8px"><summary><span>${g === 'R' ? 'Regressie' : 'Scenario ' + g}: ${esc(names[g])}</span>${A.pill(r.filter(x => x.sc === g).every(x => x.ok) ? 'ok' : 'bad', r.filter(x => x.sc === g && x.ok).length + '/' + r.filter(x => x.sc === g).length)}</summary><div class="list">${r.filter(x => x.sc === g).map(x => `<div class="li"><span>${A.pill(x.ok ? 'ok' : 'bad', x.ok ? 'Geslaagd' : 'Mislukt')}</span><span>${esc(x.name)}${x.detail ? `<br><small>${esc(x.detail)}</small>` : ''}</span><span></span></div>`).join('')}</div></details>`).join('')}
  <p class="muted">Uitgevoerd in ${last.ms || 0} ms.</p></main>`;
};
ACT.rerun = () => { last = null; A.render(); };

window.viewDelivery = function () {
  const sec = (t, items) => `<section class="card stack" style="margin-bottom:12px"><h2>${t}</h2><div class="list">${items.map(([s, txt]) => `<div class="li"><span>${A.pill(s === 'klaar' ? 'ok' : s === 'nodig' ? 'bad' : 'warn', s === 'klaar' ? 'Klaar' : s === 'nodig' ? 'Nog nodig' : 'Voorlopig')}</span><span>${txt}</span><span></span></div>`).join('')}</div></section>`;
  return `<main class="c-main" style="padding-bottom:60px"><h1 class="brandish">Oplevering</h1><p class="muted">Wat werkt, wat voorlopig is en wat de salon nog moet aanleveren of laten koppelen.</p><div style="margin-top:14px"></div>
  ${sec('Merkassets van de salon', [['nodig', 'Origineel JR-monogram/logo (SVG of PNG, transparant). Nu: typografisch woordmerk als tijdelijke plek.'], ['voorlopig', 'Kleuren warmwit/ivoor, diep zwart en warme grijzen — afgeleid van het Instagram-profiel, te bevestigen.'], ['voorlopig', 'Lettertypes Cormorant Garamond (koppen) + Manrope (tekst) — te bevestigen.'], ['klaar', '11 eigen foto’s van de salon verwerkt (hero, highlights, looks, feed).'], ['nodig', 'Video’s en productfoto’s.'], ['nodig', 'Gebruiksrechten voor foto’s, video’s en muziek uit Instagram/TikTok.'], ['nodig', 'Voorbeeld van haar aanspreekstijl (wordt gevraagd in de chatbottraining).']])}
  ${sec('Gegevens die bevestigd moeten worden', [['klaar', 'Dienstenlijst met prijzen, duur en omschrijving overgenomen van de Salonized-boekingspagina (screenshots 24-11-2026), inclusief Holiday Fee 7–30 december.'], ['nodig', 'Controle: bovenaan Ponytails/Bun en vóór Weave kunnen nog diensten staan die niet op de screenshots zichtbaar waren.'], ['nodig', 'Actueel assortiment, varianten, voorraad en levertijden.'], ['voorlopig', 'Salonregels (eerst intake, aanbetaling, 48 uur annuleren) staan als voorstel; ze gelden pas na bevestiging.'], ['nodig', 'Salonadres en afhaalinstructies; verzendlanden en tarieven.'], ['nodig', 'Klantexport uit Salonized (CSV) voor de importpreview.']])}
  ${sec('Koppelingen', [['klaar', 'Server-laag met rolcontrole per aanroep, transacties, gelijktijdige boekingen en idempotente betaalbevestigingen (in deze app én als Supabase-backend, schema jrs).'], ['voorlopig', 'Betalingen: testomgeving met ondertekende bevestigingen. Live: provider (bijv. Mollie of Stripe) met webhook naar de backend.'], ['nodig', 'Berichten: officiële WhatsApp Business-, sms- of e-maildienst voor bevestigingen, reminders en marketing (apart instelbaar).'], ['nodig', 'Instagram- en WhatsApp-berichten in de inbox via officiële Meta-koppelingen.'], ['nodig', 'Hosting met eigen domein en installeerbare webapp (manifest) — Cloudflare Pages; de app werkt nu in een beveiligde voorbeeldomgeving.'], ['voorlopig', 'Salonized blijft tot het omschakelmoment leidend als zij dat wil; synchronisatie alleen bij een officiële koppeling.']])}
  ${sec('Getest', [['klaar', 'Scenario’s 1–6 plus regressie automatisch (zie Testrapport).'], ['klaar', 'Schermbreedtes 360, 390, 768, 834, 1024, 1280 en 1440 px in een nagebootste Chromium-browser, plus landschap en 200% tekst.'], ['nodig', 'Echte apparaten: Safari op iPhone, iPad en Mac zijn niet fysiek getest.']])}
  <p class="muted">Website gemaakt door VormVivo Studios</p></main>`;
};
}
