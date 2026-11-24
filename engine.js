/* JR'SBEAUTYBAR — server-laag (demo-engine).
   Elke actie loopt via api(naam, args, token). Rollen worden hier gecontroleerd,
   niet in de interface. Productie: dezelfde regels draaien als Postgres-functies in Supabase (schema jrs). */
(function (root) {
'use strict';
const TZ = 'Europe/Amsterdam';
const MIN = 60000, HOUR = 3600000, DAY = 86400000;

/* ---------- tijd ---------- */
const partsFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' });
function amsParts(ms) {
  const o = {}; for (const p of partsFmt.formatToParts(new Date(ms))) o[p.type] = p.value;
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
  return { y: +o.year, m: +o.month, d: +o.day, hh: +o.hour, mm: +o.minute, wd, date: `${o.year}-${o.month}-${o.day}` };
}
function offsetMs(ms) { const p = amsParts(ms); return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm) - Math.floor(ms / MIN) * MIN; }
function amsToUtc(date, hhmm) { // 'YYYY-MM-DD', 'HH:MM' Amsterdamse wandtijd -> ms UTC
  const [y, m, d] = date.split('-').map(Number), [hh, mm] = (hhmm || '00:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm); let t = guess - offsetMs(guess); t = guess - offsetMs(t); return t;
}
function addDays(date, n) { const [y, m, d] = date.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); }
function weekday(date) { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
function hm(ms) { const p = amsParts(ms); return String(p.hh).padStart(2, '0') + ':' + String(p.mm).padStart(2, '0'); }
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

/* ---------- hulp ---------- */
let seq = 0;
const uid = p => p + '_' + Date.now().toString(36) + (++seq).toString(36) + Math.random().toString(36).slice(2, 6);
const tok = () => Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('');
class ApiError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (code, msg) => { throw new ApiError(code, msg); };
const clone = o => JSON.parse(JSON.stringify(o));
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function sig(secret, e) { let h = 2166136261; for (const c of secret + '|' + e.eventId + '|' + e.providerRef + '|' + e.status + '|' + e.amountCents) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

/* ---------- voorbeelddata (duidelijk gemarkeerd) ---------- */
function seed(now, opts = {}) {
  const today = amsParts(now).date;
  const S = (id, name, cat, price, dur, o = {}) => Object.assign({ id, name, category: cat, priceCents: price, durationMin: dur, prepMin: 15, bufferMin: 15, intakeRequired: false, depositCents: 0, needsVariant: false, followUpWeeks: 0, care: '', live: true, verify: { status: 'voorbeeld', source: 'Voorbeelddata — Salonized gaf 403 op 24-11-2026', checkedAt: '2026-11-24' } }, o);
  const R = (id, name, cat, price, dur, desc, o = {}) => S(id, name, cat, price, dur, Object.assign({ desc, prepMin: 0, bufferMin: 10, verify: { status: 'bevestigd', source: 'Salonized-boekingspagina (screenshots 24-11-2026)', checkedAt: '2026-11-24' } }, o));
  const QW = 'Een quick weave is niet hetzelfde als een sew-in. Kies vooraf de juiste dienst.';
  const real = [
    R('svc_sewin', 'Regular sewin', 'weave', 11000, 145, 'Blowdry and straightening included.', { followUpWeeks: 6, care: 'Slaap met een zijden bonnet, was je haar om de 7–10 dagen en kom na 6 weken voor onderhoud.', allowVariant: true }),
    R('svc_sewin_glam', 'Sewin full glam', 'weave', 12500, 155, 'Blowdry, layers & pin curls included.', { followUpWeeks: 6, care: 'Slaap met een zijden bonnet en pin je curls ’s nachts op.', allowVariant: true }),
    R('svc_qw', 'Regular Quick weave', 'weave', 11000, 140, 'This service does not include cutting and curling.', { warn: QW, care: 'Houd je eigen haar onder de quick weave droog en schoon.', allowVariant: true }),
    R('svc_sewin_bob', 'Sewin (Bob)', 'weave', 12000, 150, '', { followUpWeeks: 6, allowVariant: true }),
    R('svc_qw_flip', 'Flip over quick weave', 'weave', 12500, 140, '', { warn: QW, allowVariant: true }),
    R('svc_qw_glam', 'Full glam quick weave', 'weave', 12000, 140, 'Incl. cutting & curling.', { warn: QW, allowVariant: true }),
    R('svc_qw_bob', 'Quick weave (Bob cut)', 'weave', 11500, 110, '', { warn: QW, allowVariant: true }),
    R('svc_pony', 'Mid ponytail', 'ponytails', 7000, 80, 'Gelieve met gesteild haar op uw afspraak te verschijnen.', { prep: 'Kom met gesteild haar.', allowVariant: true, care: 'Slaap met een zijden sjaal om je edges en haal de ponytail binnen 7 dagen voorzichtig uit.' }),
    R('svc_pony3', '3 part ponytail', 'ponytails', 8500, 80, 'Gelieve met gesteild haar op uw afspraak te verschijnen.', { prep: 'Kom met gesteild haar.', allowVariant: true }),
    R('svc_bun', 'Bun', 'ponytails', 7000, 70, 'Benodigdheden: 1 pak pre-stretched hair.', { supplies: '1 pak pre-stretched hair', prep: 'Kom met gesteild haar.' }),
    R('svc_pony_braid', 'Braided ponytail', 'ponytails', 7000, 70, 'JR’sBeautybar werkt alleen op gestijld haar.', { supplies: '2 pakken pre-stretched hair', prep: 'Kom met gestijld haar.' }),
    R('svc_halfup', 'Regular Half up half down', 'halfup', 8500, 120, '2/3 bundels.', { supplies: '2 à 3 bundels', allowVariant: true }),
    R('svc_halfup_bun', 'Half up half down with a bun', 'halfup', 8000, 90, ''),
    R('svc_silk', 'Silk press', 'natural', 6000, 75, 'Includes blowout + straightening.', { care: 'Wrap je haar ’s nachts en vermijd vocht om de silk press langer te laten zitten.' }),
    R('svc_refresh', 'Regular refresh', 'styling', 4000, 40, 'Includes blowdry & straightening.'),
    R('svc_refresh_glam', 'Full glam refresh', 'styling', 4500, 50, ''),
    R('svc_x_bang1', 'One bang', 'extra', 1000, 10, '', { bufferMin: 0, extra: true }),
    R('svc_x_bang2', 'Two bangs', 'extra', 1000, 15, '', { bufferMin: 0, extra: true }),
    R('svc_x_flipwig', 'Flip over wig styling', 'extra', 4000, 60, 'Includes braid down & hair styling.', { bufferMin: 0, extra: true }),
    S('svc_intake', 'Adviesgesprek (voorstel)', 'intake', 0, 30, { live: false, prepMin: 0, bufferMin: 10, verify: { status: 'onbevestigd', source: 'Voorstel uit masterprompt — niet op Salonized', checkedAt: '2026-11-24' } })
  ];
  const legacy = [
    S('svc_intake', 'Intake & haaradvies', 'intake', 0, 30, { prepMin: 0, bufferMin: 10, allowVariant: true, care: '' }),
    S('svc_sewin', 'Sew-in installatie', 'extensions', 18500, 180, { intakeRequired: true, depositCents: 5000, needsVariant: true, followUpWeeks: 6, care: 'Slaap met een zijden bonnet.' }),
    S('svc_precol', 'Pre-colored install', 'extensions', 21000, 210, { intakeRequired: true, depositCents: 5000, needsVariant: true, followUpWeeks: 6, care: 'Sulfaatvrije shampoo.' }),
    S('svc_pony', 'Sleek ponytail', 'styling', 6500, 75, { depositCents: 2000, needsVariant: true, care: 'Haal de ponytail binnen 7 dagen voorzichtig uit.' }),
    S('svc_curls', 'Curls styling', 'styling', 5500, 60, { care: 'Gebruik een leave-in.' }),
    S('svc_maint', 'Onderhoud sew-in', 'extensions', 9500, 120, { depositCents: 2500, followUpWeeks: 6 }),
    S('svc_hu', 'HU/HD-unit op maat', 'extensions', 0, 60, { live: false, verify: { status: 'onbevestigd', source: 'test', checkedAt: '2026-11-24' } })
  ];
  const services = opts.legacy ? legacy : real;
  const V = (id, label, color, length, price, stock, o = {}) => Object.assign({ id, label, color, length, priceCents: price, stock, leadDays: 10, reorderPoint: 2 }, o);
  let products = [
    { id: 'prd_bundle_body', name: 'Body wave bundel', category: 'Haarbundels', description: 'Voorbeeldproduct — vervang door haar eigen assortiment en productfoto.', live: true,
      variants: [V('var_bw_1b_18', '1B natuurzwart · 18"', '1B', '18"', 7900, 4), V('var_bw_1b_22', '1B natuurzwart · 22"', '1B', '22"', 9400, 1), V('var_bw_4_22', '#4 chocoladebruin · 22"', '#4', '22"', 9900, 0, { leadDays: 14 })] },
    { id: 'prd_bundle_pre', name: 'Pre-colored bundel', category: 'Haarbundels', description: 'Voorbeeldproduct.', live: true,
      variants: [V('var_pc_hl_20', 'Honey highlights · 20"', 'Honey', '20"', 11900, 2), V('var_pc_bg_24', 'Burgundy · 24"', 'Burgundy', '24"', 12900, 1)] },
    { id: 'prd_pony', name: 'Ponytail extension', category: 'Haarbundels', description: 'Voorbeeldproduct.', live: true, variants: [V('var_pony_1b_26', '1B · 26"', '1B', '26"', 5900, 3)] },
    { id: 'prd_bonnet', name: 'Zijden bonnet', category: 'Accessoires', description: 'Voorbeeldproduct.', live: true, variants: [V('var_bonnet', 'Zwart', 'zwart', '', 1495, 12, { leadDays: 7 })] },
    { id: 'prd_shampoo', name: 'Sulfaatvrije shampoo', category: 'Verzorging', description: 'Voorbeeldproduct.', live: true, variants: [V('var_shampoo', '250 ml', '', '', 1895, 8)] },
    { id: 'prd_vit', name: 'Haarvitamines', category: 'Supplementen', supplement: true, live: true, description: 'Voorbeeldproduct.',
      approvedInfo: 'Voorbeeldtekst: 60 capsules, 2 per dag bij de maaltijd. Ingrediëntenlijst en waarschuwingen volgen van de leverancier.', variants: [V('var_vit', '60 capsules', '', '', 2495, 6)] }
  ];
  if (!opts.legacy) products = catalog();
  const clients = [
    { id: 'cli_demo_a', name: 'Voorbeeldklant Amira', phone: '0600000001', email: 'amira@voorbeeld.nl', channel: 'instagram', vip: true, prefs: { color: '1B', length: '22"', texture: 'body wave' }, photoConsent: false, createdAt: now - 90 * DAY, token: 'demo-amira', notes: '' },
    { id: 'cli_demo_b', name: 'Voorbeeldklant Naomi', phone: '0600000002', email: 'naomi@voorbeeld.nl', channel: 'whatsapp', vip: false, prefs: {}, photoConsent: false, createdAt: now - 30 * DAY, token: 'demo-naomi', notes: '' }
  ];
  const hours = { 0: [], 1: [], 2: [['09:30', '18:00']], 3: [['09:30', '18:00']], 4: [['09:30', '20:00']], 5: [['09:30', '18:00']], 6: [['09:00', '17:00']] };
  return {
    meta: { schema: 4, demo: true, createdAt: now },
    settings: {
      salonName: "JR'SBEAUTYBAR", tz: TZ, hours, breaks: [['13:00', '13:30']], leave: [], blocks: [],
      slotStepMin: 15, longThroughBreakMin: 150, surcharges: opts.legacy ? [] : [{ id: 'hol26', label: 'Holiday Fee', from: '2026-12-07', to: '2026-12-30', cents: 2500 }], holdMinutes: 15, waitlistOfferMinutes: 60, vipWindowHours: 48, vipPriority: true, cancelHours: 48, maxDaysAhead: 365,
      vipReminders: { intakeDaysBefore: 60, orderHairExtraDays: 7, confirmDaysBefore: 14, warnDaysAhead: 3 },
      reminderHours: 24, shipping: [{ country: 'Nederland', rateCents: 695 }, { country: 'België', rateCents: 995 }, { country: 'Duitsland', rateCents: 1195 }],
      address: { street: 'Abraham Kuyperlaan 51A', zip: '3038 PH', city: 'Rotterdam' }, pickup: 'Afhalen in de salon: Abraham Kuyperlaan 51A, 3038 PH Rotterdam', leadingAgenda: 'app', salonizedUrl: 'https://jrsbeautybar-1.salonized.com/services',
      tone: { greeting: 'Hoi! Welkom bij JR’SBEAUTYBAR. Waar kan ik je mee helpen?', closing: 'Tot snel in de salon!', confirmed: false },
      providerSecret: 'test_' + tok().slice(0, 12), providerMode: 'test', employeePerms: ['vandaag', 'agenda', 'inbox', 'klanten', 'voorraad']
    },
    users: [{ id: 'usr_owner', name: 'Jada Ramoss', role: 'owner', pin: '2468' }, { id: 'usr_emp', name: 'Medewerker (voorbeeld)', role: 'employee', pin: '1357' }],
    sessions: {}, clients, services, products,
    appointments: [], reservations: [], orders: [], payments: [], providerEvents: {}, audit: [],
    conversations: [], knowledge: [
      { id: 'kn_hours', q: 'Openingstijden', keywords: ['open', 'openingstijden', 'geopend', 'wanneer open'], answer: 'We werken op afspraak van dinsdag t/m zaterdag. Kijk bij Boeken voor de vrije tijden.', status: 'published', approvedBy: 'Voorbeelddata', approvedAt: now, scope: 'algemeen', history: [] },
      { id: 'kn_loc', q: 'Waar zit de salon?', keywords: ['adres', 'waar zit', 'locatie', 'waar zitten', 'rotterdam', 'parkeren', 'waar is'], answer: 'JR’s beauty bar zit aan de Abraham Kuyperlaan 51A, 3038 PH Rotterdam. Je komt op afspraak.', status: 'published', approvedBy: 'Adres aangeleverd 24-11-2026', approvedAt: now, scope: 'algemeen', history: [] },
      { id: 'kn_ship', q: 'Verzending', keywords: ['verzend', 'verzending', 'buitenland', 'shipping', 'opsturen', 'bezorgen'], answer: 'We verzenden wereldwijd. De verzendkosten zie je per land bij het afrekenen.', status: 'published', approvedBy: 'Voorbeelddata', approvedAt: now, scope: 'algemeen', history: [] }
    ],
    rules: [
      { id: 'rule_intake', key: 'intakeFirst', text: 'Nieuwe klant voor extensions → eerst intake', enabled: !!opts.legacy, status: opts.legacy ? 'published' : 'concept', approvedBy: 'Voorstel (configureerbaar)', approvedAt: now },
      { id: 'rule_hold', key: 'holdDuringPayment', text: 'Tijd en voorraad blijven 15 minuten vastgehouden tijdens betalen', enabled: true, status: 'published', approvedBy: 'Voorstel (configureerbaar)', approvedAt: now }
    ],
    unanswered: [], training: { idx: 0, answers: {}, status: 'nieuw' }, waitlist: [], quotes: [], vipSpots: [], vipRequests: [], tasks: [], intakes: [], media: [], outbox: [], paylinks: [], imports: [],
    _today: today
  };
}

/* ---------- voorbeeldassortiment (prijzen en voorraad zijn voorbeelddata; de salon past ze aan in de Studio) ---------- */
function catalog() {
  let r = 11; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const V = (id, label, color, length, price, o = {}) => Object.assign({ id, label, color, length, priceCents: price, stock: Math.floor(rnd() * 7), leadDays: 10, reorderPoint: 2 }, o);
  const COL = [['1B', 'Natuurzwart 1B', 0], ['#4', 'Chocoladebruin #4', 500], ['Honey', 'Honey highlights', 1500], ['613', 'Blond 613', 2000], ['Burgundy', 'Burgundy 99J', 1500]];
  const TEX = [['straight', 'Straight', 'Steil en glad; ideaal voor sleek sew-ins en silk-press looks.', ['1B', '#4', 'Honey', '613']], ['bodywave', 'Body wave', 'Losse, zachte golven met veel beweging.', ['1B', '#4', 'Honey', 'Burgundy']], ['deepwave', 'Deep wave', 'Diepe, gedefinieerde golven voor volume.', ['1B', '#4']], ['kinky', 'Kinky straight', 'Steil met een natuurlijke, licht ruwe textuur die opgaat in natuurlijk haar.', ['1B']], ['curly', 'Curly', 'Volle krullen voor een natuurlijke curly look.', ['1B', '#4']]];
  const L = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
  const out = [];
  for (const [k, n, d, cols] of TEX) out.push({ id: 'prd_b_' + k, name: n + ' bundel', category: 'Haarbundels', type: 'bundel', texture: n, description: d, live: true, sample: true,
    variants: cols.flatMap(c => { const col = COL.find(x => x[0] === c); return L.filter(l => !(c === '613' && l > 26)).map(l => V(`var_${k}_${c.replace('#', 'c')}_${l}`, `${col[1]} · ${l}"`, c, l + '"', 4900 + (l - 12) / 2 * 600 + col[2])); }) });
  out.push({ id: 'prd_closure', name: 'Lace closure 4x4', category: 'Closures & frontals', type: 'closure', texture: 'Straight / Body wave', description: 'Voor een natuurlijke scheiding bij een sew-in of quick weave.', live: true, sample: true, variants: [14, 16, 18, 20].flatMap(l => [['1B', 'Straight'], ['1B', 'Body wave']].map(([c, t]) => V(`var_cl44_${t[0]}_${l}`, `${t} · ${l}"`, c, l + '"', 6900 + (l - 14) / 2 * 800))) });
  out.push({ id: 'prd_closure55', name: 'HD lace closure 5x5', category: 'Closures & frontals', type: 'closure', texture: 'Straight', description: 'Groter scheidingsvlak met dunne HD-lace.', live: true, sample: true, variants: [16, 18, 20].map(l => V(`var_cl55_${l}`, `Straight · ${l}"`, '1B', l + '"', 8900 + (l - 16) / 2 * 900)) });
  out.push({ id: 'prd_frontal', name: 'Lace frontal 13x4', category: 'Closures & frontals', type: 'frontal', texture: 'Straight / Body wave', description: 'Van oor tot oor, voor een volledig open haarlijn.', live: true, sample: true, variants: [16, 18, 20, 22].flatMap(l => ['Straight', 'Body wave'].map(t => V(`var_fr_${t[0]}_${l}`, `${t} · ${l}"`, '1B', l + '"', 11900 + (l - 16) / 2 * 1000))) });
  out.push({ id: 'prd_pony', name: 'Ponytail extension', category: 'Ponytails', type: 'ponytail', texture: 'Straight', description: 'Wrap-around ponytail voor een sleek mid- of high ponytail.', live: true, sample: true, variants: [V('var_pony_1b_22', '1B · 22"', '1B', '22"', 5900), V('var_pony_1b_26', '1B · 26"', '1B', '26"', 6900, { stock: 4 }), V('var_pony_1b_30', '1B · 30"', '1B', '30"', 7900)] });
  out.push({ id: 'prd_braid', name: 'Pre-stretched braiding hair', category: 'Braiding hair', type: 'braiding', texture: 'Pre-stretched', description: 'Nodig voor een Bun (1 pak) of Braided ponytail (2 pakken).', live: true, sample: true, variants: [V('var_braid_1b', '1B · per pak', '1B', '', 695, { stock: 24, reorderPoint: 6 }), V('var_braid_2', '#2 · per pak', '#4', '', 695, { stock: 12, reorderPoint: 6 })] });
  const care = (id, name, cat, desc, price, stock) => ({ id, name, category: cat, type: 'care', description: desc, live: true, sample: true, variants: [V('var_' + id.slice(4), 'Standaard', '', '', price, { stock })] });
  out.push(care('prd_shampoo', 'Sulfaatvrije shampoo', 'Verzorging', 'Mild voor extensions en je eigen haar.', 1895, 8), care('prd_cond', 'Hydraterende conditioner', 'Verzorging', 'Houdt bundels zacht en ontwarbaar.', 1895, 6), care('prd_edge', 'Edge control', 'Verzorging', 'Voor strakke edges bij ponytails en buns.', 1295, 10), care('prd_mousse', 'Wrap mousse', 'Verzorging', 'Voor een gladde wrap en minder pluis.', 1495, 5));
  out.push(care('prd_bonnet', 'Zijden bonnet', 'Accessoires', 'Beschermt je haar ’s nachts.', 1495, 12), care('prd_scarf', 'Satijnen edge scarf', 'Accessoires', 'Houdt edges en ponytails strak tijdens het slapen.', 995, 15), care('prd_brush', 'Wig- en extensionborstel', 'Accessoires', 'Ontwart zonder te trekken.', 1295, 7));
  return out;
}

/* ---------- engine ---------- */
function createEngine(opts = {}) {
  let clock = opts.now || (() => Date.now());
  let S = opts.state || seed(clock(), opts);
  const save = opts.save || (() => {});
  { const ow = (S.users || []).find(u => u.id === 'usr_owner'); if (ow && ow.name === 'Eigenares') ow.name = 'Jada Ramoss'; }
  if (!S.settings.address) { S.settings.address = { street: 'Abraham Kuyperlaan 51A', zip: '3038 PH', city: 'Rotterdam' }; S.settings.pickup = 'Afhalen in de salon: Abraham Kuyperlaan 51A, 3038 PH Rotterdam'; }
  const now = () => clock();
  const audit = (who, action, detail) => S.audit.push({ at: now(), who, action, detail });
  const svc = id => S.services.find(s => s.id === id) || fail('NOT_FOUND', 'Dienst niet gevonden');
  const findVariant = id => { for (const p of S.products) for (const v of p.variants) if (v.id === id) return { p, v }; fail('NOT_FOUND', 'Variant niet gevonden'); };
  const client = id => S.clients.find(c => c.id === id) || fail('NOT_FOUND', 'Klant niet gevonden');

  function session(token) {
    const s = token && S.sessions[token];
    if (!s || s.exp < now()) return { role: 'public' };
    return s;
  }
  const staffName = s => (S.users.find(u => u.id === s.userId) || {}).name || 'onbekend';

  /* --- voorraad --- */
  const activeRes = r => r.status === 'active' || (r.status === 'hold' && r.expires > now());
  function available(variantId, exceptRef) {
    const { v } = findVariant(variantId);
    const used = S.reservations.filter(r => r.variantId === variantId && activeRes(r) && !(exceptRef && r.ref.id === exceptRef)).reduce((a, r) => a + r.qty, 0);
    return v.stock - used;
  }
  function reserve(variantId, qty, ref, status, expires) {
    if (available(variantId) < qty) fail('OUT_OF_STOCK', 'Deze variant is net niet meer op voorraad');
    const r = { id: uid('res'), variantId, qty, ref, status, expires: expires || null, createdAt: now() };
    S.reservations.push(r); return r;
  }
  const releaseRef = (refId, why) => S.reservations.filter(r => r.ref.id === refId && (r.status === 'hold' || r.status === 'active')).forEach(r => { r.status = 'released'; r.releasedWhy = why; });

  /* --- agenda --- */
  const blocking = a => ['confirmed', 'option', 'offered'].includes(a.status) || (a.status === 'hold' && a.holdExpires > now());
  function busyRanges(exceptId) {
    const r = S.appointments.filter(a => blocking(a) && a.id !== exceptId).map(a => [a.blockStart, a.blockEnd, a.id]);
    for (const b of S.settings.blocks) r.push([b.start, b.end, b.id]);
    return r;
  }
  function occupied(serviceId, start, extraMin = 0) { const s = svc(serviceId); return { blockStart: start - s.prepMin * MIN, start, end: start + (s.durationMin + extraMin) * MIN, blockEnd: start + (s.durationMin + extraMin + s.bufferMin) * MIN }; }
  function withinOpening(bs, be, dur) {
    const p = amsParts(bs), date = p.date;
    if (amsParts(be - 1).date !== date) return false;
    if (S.settings.leave.some(l => date >= l.from && date <= l.to)) return false;
    const ranges = S.settings.hours[weekday(date)] || [];
    const ok = ranges.some(([a, b]) => bs >= amsToUtc(date, a) && be <= amsToUtc(date, b));
    if (!ok) return false;
    if (S.settings.longThroughBreakMin && dur >= S.settings.longThroughBreakMin) return true;
    return !S.settings.breaks.some(([a, b]) => bs < amsToUtc(date, b) && be > amsToUtc(date, a));
  }
  function vipSpotAt(start) { return S.vipSpots.find(v => v.start === start && v.status === 'vip' && v.releaseAt > now()); }
  function slotFree(serviceId, start, opt = {}) {
    const o = occupied(serviceId, start, opt.extraMin || 0);
    if (start < now() + 30 * MIN) return 'Dit tijdstip ligt te dichtbij of in het verleden';
    if (!withinOpening(o.blockStart, o.blockEnd, svc(serviceId).durationMin + (opt.extraMin || 0))) return 'Buiten openingstijden, pauze of verlof';
    if (busyRanges(opt.exceptId).some(([a, b]) => o.blockStart < b && o.blockEnd > a)) return 'Dit tijdstip is net bezet';
    const vs = vipSpotAt(start);
    if (vs && !opt.vip) return 'Dit is een VIP-plek';
    return null;
  }
  function surchargeFor(start) { const d = amsParts(start).date; return (S.settings.surcharges || []).find(x => d >= x.from && d <= x.to) || null; }
  function slotsFor(serviceId, date, opt = {}) {
    const s = svc(serviceId); const out = [];
    const ranges = S.settings.hours[weekday(date)] || [];
    for (const [a, b] of ranges) for (let t = toMin(a) + s.prepMin; t + s.durationMin + (opt.extraMin || 0) + s.bufferMin <= toMin(b); t += Math.max(S.settings.slotStepMin, 15)) {
      const start = amsToUtc(date, String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'));
      if (opt.earliest && start < opt.earliest) continue;
      if (!slotFree(serviceId, start, opt)) out.push({ start, time: hm(start), vip: !!vipSpotAt(start) });
    }
    return out;
  }

  /* --- berichten (klaargezet; kanaal nog niet gekoppeld) --- */
  function queue(clientId, type, text, sendAt, ref) { S.outbox.push({ id: uid('msg'), clientId, type, text, sendAt: sendAt || now(), ref: ref || null, status: 'gepland', createdAt: now() }); }
  function confirmAppointment(a, who) {
    a.status = 'confirmed'; a.confirmedAt = now(); a.holdExpires = null;
    S.reservations.filter(r => r.ref.id === a.id && r.status === 'hold').forEach(r => { r.status = 'active'; r.expires = null; });
    const s = svc(a.serviceId);
    const when = fmtDT(a.start);
    queue(a.clientId, 'bevestiging', `Je afspraak voor ${s.name} staat vast op ${when}. Adres: ${S.settings.address ? S.settings.address.street + ', ' + S.settings.address.zip + ' ' + S.settings.address.city : ''}. ${restText(a)}`, now(), { type: 'appointment', id: a.id });
    queue(a.clientId, 'reminder', `Herinnering: morgen ${s.name} om ${hm(a.start)}.`, a.start - S.settings.reminderHours * HOUR, { type: 'appointment', id: a.id });
    if (s.care) queue(a.clientId, 'nazorg', `Onderhoudstips na je ${s.name}: ${s.care}` + (a.variantId ? ' Bijpassende producten vind je in de shop.' : ''), a.end + 2 * HOUR, { type: 'appointment', id: a.id });
    if (s.followUpWeeks) queue(a.clientId, 'vervolg', `Tijd voor onderhoud? Boek je volgende afspraak voor ${s.name}.`, a.end + (s.followUpWeeks - 1) * 7 * DAY, { type: 'appointment', id: a.id });
    S.tasks.push({ id: uid('tsk'), text: `Nieuwe afspraak: ${client(a.clientId).name} · ${s.name} · ${when}`, due: now(), done: false, ref: { type: 'appointment', id: a.id }, kind: 'nieuw' });
    audit(who || 'systeem', 'afspraak bevestigd', a.id);
  }
  function restText(a) { const paid = paidFor(a.id); const rest = a.totalCents - paid; return rest > 0 ? `Resterend bij de afspraak: ${eur(rest)}.` : 'Volledig betaald.'; }

  /* --- betalingen --- */
  const paidFor = refId => S.payments.filter(p => p.refId === refId).reduce((a, p) => a + (p.status === 'paid' ? p.amountCents : 0) - (p.status === 'refunded' ? p.amountCents : 0), 0);
  function startPayment(refType, refId, clientId, amountCents, kind) {
    const p = { id: uid('pay'), refType, refId, clientId, kind, amountCents, method: 'online', status: 'pending', providerRef: 'tr_test_' + tok().slice(0, 10), createdAt: now(), log: [{ at: now(), by: 'klant', what: 'betaling gestart (testomgeving)' }] };
    S.payments.push(p); return p;
  }
  function applyPaid(p) {
    if (p.refType === 'appointment') {
      const a = S.appointments.find(x => x.id === p.refId);
      if (a.status === 'hold' && a.holdExpires > now()) confirmAppointment(a, 'betaalprovider');
      else if (a.status === 'hold' || a.status === 'expired') {
        a.status = 'exception'; p.exception = true;
        S.tasks.push({ id: uid('tsk'), text: `Late betaling na verlopen reservering: ${client(a.clientId).name} betaalde ${eur(p.amountCents)} — kies: alternatief tijdstip of terugbetalen`, due: now(), done: false, ref: { type: 'payment', id: p.id }, kind: 'uitzondering', ownerOnly: true });
      }
    } else if (p.refType === 'order') {
      const o = S.orders.find(x => x.id === p.refId);
      if (o.status === 'hold' && o.holdExpires > now()) { o.status = 'betaald'; (o.history = o.history || []).push({ at: now(), status: 'betaald' }); S.reservations.filter(r => r.ref.id === o.id).forEach(r => { r.status = 'used'; }); for (const it of o.items) findVariant(it.variantId).v.stock -= it.qty; queue(o.clientId, 'bevestiging', `Bedankt voor je bestelling ${o.number}. We laten weten wanneer hij klaarligt of verzonden is.`, now(), { type: 'order', id: o.id }); }
      else if (o.status !== 'betaald') { o.status = 'exception'; p.exception = true; S.tasks.push({ id: uid('tsk'), text: `Late betaling voor verlopen bestelling ${o.number} — controleer voorraad of betaal terug`, due: now(), done: false, ref: { type: 'payment', id: p.id }, kind: 'uitzondering', ownerOnly: true }); }
    } else if (p.refType === 'quote') {
      const q = S.quotes.find(x => x.id === p.refId); q.depositPaid = true; evaluateQuote(q);
    }
  }
  function providerEvent(e) { // geverifieerde bevestiging van de provider; idempotent
    if (sig(S.settings.providerSecret, e) !== e.signature) fail('BAD_SIGNATURE', 'Handtekening ongeldig — genegeerd');
    if (S.providerEvents[e.eventId]) return { duplicate: true };
    S.providerEvents[e.eventId] = now();
    const p = S.payments.find(x => x.providerRef === e.providerRef) || fail('NOT_FOUND', 'Onbekende betaling');
    if (e.status === 'paid') { if (p.status === 'paid') return { duplicate: true }; p.status = 'paid'; p.paidAt = now(); p.log.push({ at: now(), by: 'provider', what: 'betaald' }); applyPaid(p); }
    else if (e.status === 'failed') { if (p.status === 'pending') { p.status = 'failed'; p.log.push({ at: now(), by: 'provider', what: 'mislukt' }); } }
    else if (e.status === 'refunded') { const r = S.payments.find(x => x.id === p.refundOf) ; p.status = 'refunded'; p.log.push({ at: now(), by: 'provider', what: 'terugbetaald' }); }
    return { ok: true };
  }
  function signedEvent(providerRef, status) { const p = S.payments.find(x => x.providerRef === providerRef); const e = { eventId: 'evt_' + tok().slice(0, 12), providerRef, status, amountCents: p ? p.amountCents : 0 }; e.signature = sig(S.settings.providerSecret, e); return e; }

  /* --- financiële posten --- */
  function posts() {
    const out = [], t = now();
    const mk = (type, ref, clientId, label, total, deposit, due, extra) => {
      const pays = S.payments.filter(p => p.refId === ref.id);
      const paid = pays.filter(p => p.status === 'paid').reduce((a, p) => a + p.amountCents, 0);
      const refunds = pays.filter(p => p.status === 'refunded').reduce((a, p) => a + p.amountCents, 0);
      const open = Math.max(0, total - paid + refunds);
      let status = open === 0 ? 'Betaald' : due > t ? 'Gepland' : (t - due > DAY ? 'Te laat' : 'Nog te ontvangen');
      if (extra && extra.exception) status = 'Uitzondering';
      out.push({ id: ref.id, type, clientId, client: (S.clients.find(c => c.id === clientId) || {}).name, label, total, deposit, paid, refunds, open, due, status, payments: pays.map(p => p.id) });
    };
    for (const a of S.appointments) if (['confirmed', 'completed', 'exception'].includes(a.status) && a.totalCents > 0) {
      const paid = paidFor(a.id); const depDue = a.createdAt; const due = paid >= a.depositCents ? a.start : depDue;
      mk('Afspraak', a, a.clientId, svc(a.serviceId).name + ' · ' + fmtDT(a.start), a.totalCents, a.depositCents, due, { exception: a.status === 'exception' });
    }
    for (const o of S.orders) if (['betaald', 'klaar', 'verzonden', 'exception'].includes(o.status)) mk('Bestelling', o, o.clientId, 'Bestelling ' + o.number, o.totalCents, 0, o.createdAt, { exception: o.status === 'exception' });
    return out.sort((a, b) => a.due - b.due);
  }

  /* --- timers (bij elke aanroep) --- */
  function tick() {
    const t = now();
    for (const a of S.appointments) {
      if (a.status === 'hold' && a.holdExpires <= t) { a.status = 'expired'; releaseRef(a.id, 'reservering verlopen'); }
      if (a.status === 'offered' && a.offerExpires <= t) { a.status = 'expired'; const w = S.waitlist.find(x => x.id === a.waitlistId); if (w) { w.status = 'verlopen aanbod'; w.offeredAt = null; } offerNext(a.slotFromCancel); }
      if (a.status === 'option' && a.optionExpires && a.optionExpires <= t) { a.status = 'expired'; releaseRef(a.id, 'optie verlopen'); const v = S.vipRequests.find(r => r.appointmentId === a.id); if (v && v.status !== 'Bevestigd') { v.status = 'Vervallen'; queue(v.clientId, 'vip', 'Je optie is vervallen. Neem contact op als je nog een datum wilt.', t); } }
      if (a.status === 'confirmed' && a.end < t - 2 * HOUR) { a.status = 'completed'; S.reservations.filter(r => r.ref.id === a.id && r.status === 'active').forEach(r => { r.status = 'used'; findVariant(r.variantId).v.stock -= r.qty; }); }
    }
    for (const o of S.orders) if (o.status === 'hold' && o.holdExpires <= t) { o.status = 'verlopen'; releaseRef(o.id, 'bestelling niet betaald'); }
    for (const v of S.vipSpots) if (v.status === 'vip' && v.releaseAt <= t) v.status = 'open';
    for (const q of S.quotes) if (['verzonden', 'akkoord'].includes(q.status) && q.validUntil <= t) { q.status = 'verlopen'; if (q.appointmentId) { const a = S.appointments.find(x => x.id === q.appointmentId); if (a && a.status === 'option') { a.status = 'expired'; releaseRef(a.id, 'offerte verlopen'); } } }
    for (const m of S.outbox) if (m.status === 'gepland' && m.sendAt <= t) m.status = 'klaar om te versturen';
    for (const pl of S.paylinks) if (pl.status === 'ingepland' && pl.sendAt <= t) sendPaylink(pl);
  }

  /* --- wachtlijst --- */
  function matchesPref(w, start, serviceId) {
    const p = amsParts(start); const part = p.hh < 12 ? 'ochtend' : p.hh < 17 ? 'middag' : 'avond';
    if (w.serviceId !== serviceId) { const a = svc(w.serviceId), b = svc(serviceId); if (a.durationMin + a.prepMin + a.bufferMin > b.durationMin + b.prepMin + b.bufferMin) return false; }
    return (!w.days.length || w.days.includes(p.wd)) && (!w.parts.length || w.parts.includes(part));
  }
  function offerNext(slot) {
    if (!slot) return null;
    const cand = S.waitlist.filter(w => w.status === 'wachtend' && matchesPref(w, slot.start, slot.serviceId) && !(slot.tried || []).includes(w.id));
    const vipOn = S.settings.vipPriority;
    cand.sort((a, b) => (vipOn ? (client(b.clientId).vip - client(a.clientId).vip) : 0) || a.createdAt - b.createdAt);
    const w = cand[0]; if (!w) return null;
    const serviceId = w.serviceId;
    if (slotFree(serviceId, slot.start, { vip: true })) return null;
    const o = occupied(serviceId, slot.start); const s = svc(serviceId);
    const a = { id: uid('apt'), clientId: w.clientId, serviceId, ...o, status: 'offered', offerExpires: now() + S.settings.waitlistOfferMinutes * MIN, waitlistId: w.id, slotFromCancel: { ...slot, tried: [...(slot.tried || []), w.id] }, totalCents: s.priceCents, depositCents: s.depositCents, createdAt: now(), source: 'wachtlijst' };
    S.appointments.push(a); w.status = 'aanbod'; w.offerAppointmentId = a.id;
    queue(w.clientId, 'wachtlijst', `Er is een plek vrij: ${s.name} op ${fmtDT(a.start)}. Het aanbod geldt tot ${hm(a.offerExpires)}.`, now(), { type: 'appointment', id: a.id });
    return a;
  }

  /* --- booking --- */
  function needsIntake(c, s) {
    const r = S.rules.find(x => x.key === 'intakeFirst');
    if (!r || !r.enabled || r.status !== 'published' || !s.intakeRequired) return false;
    const had = S.appointments.some(a => a.clientId === c.id && a.serviceId === 'svc_intake' && ['confirmed', 'completed'].includes(a.status)) || S.intakes.some(i => i.clientId === c.id && i.reviewed);
    return !had;
  }
  function book(c, args, source) {
    const s = svc(args.serviceId);
    if (!s.live || !['bevestigd', 'voorbeeld'].includes(s.verify.status)) fail('NOT_BOOKABLE', 'Deze behandeling is nog niet bevestigd en daarom niet online boekbaar. Vraag advies via de chat.');
    if (S.settings.leadingAgenda === 'salonized' && source !== 'eigenares') fail('LEADING_ELSEWHERE', 'Boeken loopt in deze fase via de huidige boekingspagina.');
    if (source !== 'eigenares' && needsIntake(c, s)) fail('INTAKE_FIRST', 'Voor deze behandeling plannen we eerst een intake.');
    if (s.needsVariant && !args.variantId) fail('VARIANT_REQUIRED', 'Kies eerst een variant.');
    const extras = (args.extras || []).map(id => svc(id)).filter(x => x.extra && x.live);
    const extraMin = extras.reduce((t, x) => t + x.durationMin, 0), extraCents = extras.reduce((t, x) => t + x.priceCents, 0);
    const why = slotFree(s.id, args.start, { vip: c.vip, extraMin }); if (why) fail('SLOT_TAKEN', why);
    if (args.start > now() + S.settings.maxDaysAhead * DAY) fail('TOO_FAR', 'Zo ver vooruit kun je via een VIP-aanvraag plannen.');
    if (args.variantId) { const { v } = findVariant(args.variantId); if (available(args.variantId) < 1 && args.start < now() + v.leadDays * DAY) fail('OUT_OF_STOCK', 'Deze variant is niet op voorraad vóór deze datum. Kies een latere datum of een andere variant.'); }
    const variantPrice = args.variantId ? findVariant(args.variantId).v.priceCents : 0;
    const fee = surchargeFor(args.start);
    const total = s.priceCents + variantPrice + extraCents + (fee ? fee.cents : 0);
    const deposit = Math.min(total, s.depositCents + (args.variantId && s.needsVariant ? variantPrice : 0));
    const hold = deposit > 0;
    const a = { id: uid('apt'), clientId: c.id, serviceId: s.id, ...occupied(s.id, args.start, extraMin), extras: extras.map(x => x.id), extraMin, surcharge: fee ? { label: fee.label, cents: fee.cents } : null, status: hold ? 'hold' : 'confirmed', holdExpires: hold ? now() + S.settings.holdMinutes * MIN : null, variantId: args.variantId || null, totalCents: total, depositCents: deposit, createdAt: now(), source, intakeId: args.intakeId || null, note: args.note || '' };
    S.appointments.push(a);
    if (args.variantId) {
      if (available(args.variantId) >= 1) reserve(args.variantId, 1, { type: 'appointment', id: a.id }, hold ? 'hold' : 'active', a.holdExpires);
      else S.tasks.push({ id: uid('tsk'), text: `Inkopen: ${findVariant(args.variantId).v.label} voor ${c.name} (${fmtDT(a.start)})`, due: a.start - findVariant(args.variantId).v.leadDays * DAY, done: false, kind: 'inkoop', ref: { type: 'appointment', id: a.id } });
    }
    const vs = vipSpotAt(args.start); if (vs) vs.status = 'taken';
    let pay = null;
    if (hold) pay = startPayment('appointment', a.id, c.id, deposit, 'aanbetaling'); else confirmAppointment(a, source);
    return { appointment: pub(a), payment: pay && { id: pay.id, providerRef: pay.providerRef, amountCents: pay.amountCents } };
  }
  function cancelAppointment(a, who, reason) {
    const wasBlocking = ['confirmed', 'hold', 'option'].includes(a.status);
    a.status = 'cancelled'; a.cancelledAt = now(); a.cancelReason = reason || '';
    releaseRef(a.id, 'geannuleerd');
    audit(who, 'afspraak geannuleerd', a.id);
    let offer = null; if (wasBlocking && a.start > now()) offer = offerNext({ start: a.start, serviceId: a.serviceId });
    return offer;
  }
  const pub = a => ({ ...a, service: svc(a.serviceId).name, client: (S.clients.find(c => c.id === a.clientId) || {}).name });

  /* --- offertes & VIP --- */
  function evaluateQuote(q) {
    const a = q.appointmentId && S.appointments.find(x => x.id === q.appointmentId);
    q.steps = { akkoord: !!q.acceptedAt, aanbetaling: !!q.depositPaid || q.depositCents === 0, tijdslot: !!a && ['option', 'confirmed'].includes(a.status) };
    if (q.steps.akkoord && q.steps.aanbetaling) {
      if (a && a.status === 'option') { confirmAppointment(a, 'offerte'); q.status = 'bevestigd'; const v = S.vipRequests.find(r => r.quoteId === q.id); if (v) { v.status = 'Bevestigd'; planVipReminders(v, a); } }
      else if (!a || !['confirmed'].includes(a.status)) { q.status = 'actie nodig'; S.tasks.push({ id: uid('tsk'), text: `Offerte ${q.number}: aanbetaling ontvangen maar tijdslot niet meer beschikbaar — kies nieuw tijdstip`, due: now(), done: false, kind: 'uitzondering', ownerOnly: true, ref: { type: 'quote', id: q.id } }); }
    }
  }
  function planVipReminders(v, a) {
    const r = S.settings.vipReminders; const lead = a.variantId ? findVariant(a.variantId).v.leadDays : 14;
    v.reminders = [
      { type: 'Intake plannen', dueAt: a.start - r.intakeDaysBefore * DAY, done: false },
      { type: 'Haar bestellen', dueAt: a.start - (lead + r.orderHairExtraDays) * DAY, done: false },
      { type: 'Definitief bevestigen', dueAt: a.start - r.confirmDaysBefore * DAY, done: false }
    ];
  }
  function sendPaylink(pl) {
    const post = posts().find(p => p.id === pl.refId); const amount = post ? post.open : 0;
    if (amount <= 0) { pl.status = 'niet nodig (al betaald)'; return; }
    const pay = startPayment(pl.refType, pl.refId, pl.clientId, amount, 'restbedrag'); pay.log[0].by = 'eigenares';
    pl.paymentId = pay.id; pl.amountCents = amount; pl.status = 'klaargezet'; pl.sentAt = now();
    queue(pl.clientId, 'betaallink', `Je openstaande bedrag is ${eur(amount)}. Betaal veilig via je persoonlijke link.`, now(), { type: pl.refType, id: pl.refId });
  }

  /* --- chatbot --- */
  const HEALTH = ['zwanger', 'borstvoeding', 'medicijn', 'medicatie', 'allergie', 'allergisch', 'ziekte', 'dokter', 'arts', 'bloeddruk', 'schildklier', 'haaruitval', 'tekort'];
  function kbMatch(text) {
    const t = ' ' + norm(text) + ' '; let best = null, score = 0;
    for (const k of S.knowledge) if (k.status === 'published') { let sc = 0; for (const w of k.keywords) if (t.includes(' ' + norm(w) + ' ') || (norm(w).length > 4 && t.includes(norm(w)))) sc += norm(w).split(' ').length; if (sc > score) { score = sc; best = k; } }
    return score > 0 ? best : null;
  }
  function serviceMatch(text) { const t = norm(text); const by = id => S.services.find(x => x.id === id && x.live) || null; const live = S.services.filter(s => s.live && !s.extra); let best = null, sc = 0; for (const s of live) { const n = norm(s.name).split(' ').filter(w => w.length > 2 && !['regular', 'with'].includes(w)); const k = n.filter(w => t.includes(w)).length / Math.max(1, n.length); if (k > sc) { sc = k; best = s; } } if (best && sc >= .5) return best; return t.includes('quick') ? by('svc_qw') : t.includes('extension') || t.includes('weave') || t.includes('sew') ? by('svc_sewin') : t.includes('pony') ? by('svc_pony') : t.includes('silk') ? by('svc_silk') : t.includes('bun') ? by('svc_bun') : best; }
  function nextSlots(serviceId, n, vip) { const out = []; let d = amsParts(now()).date; for (let i = 0; i < 21 && out.length < n; i++, d = addDays(d, 1)) for (const s of slotsFor(serviceId, d, { vip })) { if (out.length < n) out.push({ ...s, date: d }); } return out; }
  function botAnswer(c, conv, text) {
    const t = norm(text), tone = S.settings.tone;
    const reply = (txt, extra = {}) => ({ text: txt, ...extra });
    if (/^(hoi|hey|hallo|hi|goedemiddag|goedemorgen|goedenavond)\b/.test(t) && t.split(' ').length <= 3) return reply(tone.greeting, { chips: ['Boeken', 'Prijzen', 'Advies bij een foto', 'Shop'] });
    if (HEALTH.some(w => t.includes(w)) || (t.includes('supplement') || t.includes('vitamine')) && /mag ik|kan ik|veilig|gezond/.test(t)) {
      const sup = S.products.filter(p => p.supplement && p.live).map(p => `${p.name}: ${p.approvedInfo}`).join(' ');
      return reply(`${sup ? 'Dit is de productinformatie die we mogen delen: ' + sup + ' ' : ''}Voor persoonlijke gezondheidsvragen kunnen we geen advies geven. Overleg met je huisarts of apotheek.`, { tag: 'gezondheid' });
    }
    if (/supplement|vitamine/.test(t)) { const sup = S.products.filter(p => p.supplement && p.live); return reply(sup.map(p => `${p.name} — ${eur(p.variants[0].priceCents)}. ${p.approvedInfo}`).join('\n') || 'We hebben op dit moment geen supplementen in de shop.', { chips: ['Shop'] }); }
    if (/verplaats|verzet|ander tijdstip|annuleer|afzeggen|cancel/.test(t)) {
      const mine = S.appointments.filter(a => a.clientId === c.id && ['confirmed', 'hold'].includes(a.status) && a.start > now());
      if (!mine.length) return reply('Ik zie geen komende afspraak op je naam. Klopt dat niet? Dan geef ik je vraag door aan de salon.');
      const late = mine.filter(a => a.start - now() < S.settings.cancelHours * HOUR);
      if (late.length && /annuleer|afzeggen|cancel/.test(t)) return handoff(c, conv, text, 'Annulering binnen de annuleringstermijn');
      return reply('Welke afspraak wil je wijzigen? Ik pas niets aan tot het gelukt is.', { appointments: mine.map(pub) });
    }
    const s = serviceMatch(text);
    if (/\bboek|\bvrij|\bplek|beschikbaar|wanneer kan|tijden|afspraak (maken|plannen|inplannen)|inplannen/.test(t)) {
      if (!s) return reply('Voor welke behandeling wil je boeken?', { services: S.services.filter(x => x.live).map(x => ({ id: x.id, name: x.name })) });
      if (needsIntake(c, s)) { const sl = nextSlots('svc_intake', 3, c.vip); return reply(`Voor ${s.name} plannen we eerst een intake, zodat we je haar en wensen goed kennen. Dit zijn de eerste vrije intaketijden:`, { slots: sl.map(x => ({ ...x, serviceId: 'svc_intake' })) }); }
      const sl = nextSlots(s.id, 4, c.vip);
      if (!sl.length) return reply(`Ik zie de komende drie weken geen vrije tijd voor ${s.name}. Zal ik je op de wachtlijst zetten?`, { chips: ['Wachtlijst'] });
      return reply(`Vrije tijden voor ${s.name} (${eur(s.priceCents)}, ${s.durationMin} min):`, { slots: sl.map(x => ({ ...x, serviceId: s.id })), needsVariant: s.needsVariant });
    }
    if (/prijs|prijz|kost|kosten|tarief|hoeveel/.test(t)) {
      if (s) return reply(`${s.name}: ${s.priceCents ? eur(s.priceCents) : 'prijs op aanvraag'}, ongeveer ${Math.round(s.durationMin / 6) / 10} uur.${s.depositCents ? ' Aanbetaling ' + eur(s.depositCents) + '.' : ''}${s.needsVariant ? ' Haar wordt apart berekend per bundel.' : ''}`, { chips: ['Boeken'] });
      return reply(S.services.filter(x => x.live).map(x => `• ${x.name}: ${x.priceCents ? eur(x.priceCents) : 'op aanvraag'}`).join('\n'), { chips: ['Boeken'] });
    }
    const k = kbMatch(text); if (k) return reply(k.answer, { knowledgeId: k.id });
    if (/vip/.test(t)) return reply('Als VIP krijg je eerder toegang tot geselecteerde plekken en kun je ruim vooruit een datum aanvragen, bijvoorbeeld voor een bruiloft of fotoshoot.', { chips: ['VIP-aanvraag'] });
    return handoff(c, conv, text, 'Geen goedgekeurd antwoord gevonden');
  }
  function handoff(c, conv, text, reason) {
    const key = norm(text).split(' ').filter(w => w.length > 3).sort().slice(0, 4).join(' ') || norm(text);
    let u = S.unanswered.find(x => x.key === key);
    if (u) { u.count++; if (!u.clientIds.includes(c.id)) u.clientIds.push(c.id); u.last = now(); } else S.unanswered.push(u = { id: uid('unq'), key, question: text, count: 1, clientIds: [c.id], asked: false, last: now(), resolved: false });
    const upcoming = S.appointments.filter(a => a.clientId === c.id && a.start > now() && ['confirmed', 'hold'].includes(a.status)).map(a => svc(a.serviceId).name + ' ' + fmtDT(a.start));
    conv.status = 'handoff';
    conv.handoff = { question: text, reason, summary: `${c.name}${c.vip ? ' (VIP)' : ''} vraagt: “${text.slice(0, 140)}”. ${reason}.`, context: [c.prefs && c.prefs.color ? `Voorkeur: ${c.prefs.color} ${c.prefs.length || ''} ${c.prefs.texture || ''}` : 'Nog geen voorkeuren bekend', upcoming.length ? 'Komend: ' + upcoming.join(', ') : 'Geen komende afspraak', 'Kanaal: ' + conv.channel], draft: `Hoi ${c.name.split(' ').pop()}, goede vraag! ` + (reason.includes('Annulering') ? 'Ik kijk even met je mee wat er mogelijk is voor je afspraak.' : 'Ik zoek het voor je uit en kom er zo snel mogelijk bij je op terug.'), at: now() };
    return { text: 'Goede vraag! Die geef ik door aan de salon. Je krijgt hier zo snel mogelijk persoonlijk antwoord.', handoff: true };
  }
  function convFor(c, channel) {
    let conv = S.conversations.find(x => x.clientId === c.id && x.channel === (channel || 'webchat'));
    if (!conv) S.conversations.push(conv = { id: uid('cnv'), clientId: c.id, channel: channel || 'webchat', messages: [], status: 'bot', unread: 0, createdAt: now() });
    return conv;
  }

  /* --- agenda-assistent --- */
  const DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  function parseCommand(text) {
    const t = norm(text.replace(/(\d{1,2})[.:](\d{2})/g, '$1:$2')).replace(/(\d{1,2}) (\d{2})\b/g, '$1:$2');
    const raw = text.toLowerCase().replace(/(\d{1,2})\.(\d{2})/g, '$1:$2');
    const today = amsParts(now()).date; let date = null;
    if (/\bovermorgen\b/.test(t)) date = addDays(today, 2); else if (/\bmorgen\b/.test(t)) date = addDays(today, 1); else if (/\bvandaag\b/.test(t)) date = today;
    const dm = DAYS.findIndex(d => t.includes(d));
    if (!date && dm >= 0) { let diff = (dm - weekday(today) + 7) % 7; if (diff === 0) diff = 7; if (/volgende week/.test(t)) diff += 7; date = addDays(today, diff); }
    const md = raw.match(/(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/);
    if (!date && md) { let y = amsParts(now()).y; let d = `${y}-${String(MONTHS.indexOf(md[2]) + 1).padStart(2, '0')}-${md[1].padStart(2, '0')}`; if (d < today) d = `${y + 1}` + d.slice(4); date = d; }
    const nd = raw.match(/\b(\d{1,2})-(\d{1,2})(?:-(\d{4}))?\b/); if (!date && nd) { const y = nd[3] || amsParts(now()).y; date = `${y}-${nd[2].padStart(2, '0')}-${nd[1].padStart(2, '0')}`; }
    if (!date) return { error: 'Ik herken geen datum. Probeer bijvoorbeeld “Blokkeer volgende vrijdag vanaf 14.00 uur”.' };
    const ranges = S.settings.hours[weekday(date)] || [];
    const open = ranges[0] ? ranges[0][0] : '09:00', close = ranges.length ? ranges[ranges.length - 1][1] : '18:00';
    const times = [...raw.matchAll(/\b(\d{1,2}):(\d{2})\b|\b(\d{1,2})\s*uur\b/g)].map(m => m[1] ? m[1].padStart(2, '0') + ':' + m[2] : m[3].padStart(2, '0') + ':00');
    let from = open, to = close;
    if (/hele dag|vrij|verlof/.test(t) && !times.length) { from = '00:00'; to = '23:59'; }
    else if (/vanaf/.test(t) && times[0]) from = times[0];
    else if (/tot/.test(t) && times.length === 1) to = times[0];
    else if (times.length >= 2) { from = times[0]; to = times[1]; } else if (times.length === 1) from = times[0];
    const start = amsToUtc(date, from), end = amsToUtc(date, to);
    if (end <= start) return { error: 'De eindtijd ligt vóór de begintijd.' };
    const affected = S.appointments.filter(a => ['confirmed', 'hold', 'option', 'offered'].includes(a.status) && a.blockStart < end && a.blockEnd > start).map(pub);
    return { date, from, to, start, end, label: /pauze/.test(t) ? 'Pauze' : 'Geblokkeerd', affected, weekdayName: DAYS[weekday(date)], closedDay: !ranges.length };
  }

  /* --- voorraadprognose --- */
  function forecast(weeks = 6) {
    const horizon = now() + weeks * 7 * DAY, out = [];
    for (const p of S.products) for (const v of p.variants) {
      const res = S.reservations.filter(r => r.variantId === v.id && activeRes(r));
      const needed = res.reduce((a, r) => a + r.qty, 0);
      const pending = S.tasks.filter(x => x.kind === 'inkoop' && !x.done && x.text.includes(v.label)).length;
      const appts = res.map(r => S.appointments.find(a => a.id === r.ref.id)).filter(Boolean).filter(a => a.start < horizon);
      const firstNeed = appts.length ? Math.min(...appts.map(a => a.start)) : null;
      const vipNeed = appts.some(a => client(a.clientId).vip);
      const after = v.stock - needed - pending;
      let alert = null;
      if (after < 0 || pending) alert = { level: 'tekort', text: `Tekort van ${Math.max(-after, pending)} — bestel vóór ${fmtD((firstNeed || now() + v.leadDays * DAY) - v.leadDays * DAY)}` };
      else if (after <= v.reorderPoint) alert = { level: 'laag', text: `Na reserveringen nog ${after} over (bestelpunt ${v.reorderPoint})` };
      out.push({ productId: p.id, product: p.name, variantId: v.id, label: v.label, stock: v.stock, reserved: needed, pending, after, leadDays: v.leadDays, firstNeed, vip: vipNeed, alert });
    }
    return out;
  }

  /* --- training --- */
  const TRAINING = [
    { key: 'diensten', q: 'Hoi! Welke behandelingen doen jullie allemaal?', kw: ['behandelingen', 'diensten', 'wat doen jullie', 'aanbod'] },
    { key: 'prijzen', q: 'Wat kost een sew-in ongeveer, inclusief haar?', kw: ['prijs sew in', 'kost een sew in', 'inclusief haar'] },
    { key: 'duur', q: 'Hoe lang ben ik ongeveer bij je voor een installatie?', kw: ['hoe lang', 'duur', 'duurt'] },
    { key: 'voorwaarden', q: 'Wat moet ik weten voordat ik boek?', kw: ['voorwaarden', 'voordat ik boek', 'regels'] },
    { key: 'intake', q: 'Moet ik eerst langskomen voor een intake?', kw: ['intake', 'eerst langskomen', 'consult'], rule: 'Nieuwe klant voor extensions → eerst intake' },
    { key: 'aanbetaling', q: 'Moet ik een aanbetaling doen? Krijg ik die terug?', kw: ['aanbetaling', 'deposit', 'terug'], rule: 'Aanbetaling vereist bij extensions' },
    { key: 'annuleren', q: 'Wat als ik moet annuleren of te laat ben?', kw: ['annuleren', 'te laat', 'afzeggen', 'no show'], rule: 'Annuleren tot 48 uur vooraf' },
    { key: 'assortiment', q: 'Welk haar verkoop je en welke lengtes zijn er?', kw: ['welk haar', 'bundels', 'lengtes', 'assortiment'] },
    { key: 'voorbereiding', q: 'Hoe moet ik mijn haar voorbereiden voor de afspraak?', kw: ['voorbereiden', 'voorbereiding', 'gewassen', 'voor de afspraak'] },
    { key: 'vip', q: 'Hoe word ik VIP en wat krijg ik dan?', kw: ['vip', 'vip worden', 'voordelen'] },
    { key: 'nazorg', q: 'Hoe verzorg ik mijn extensions daarna?', kw: ['verzorgen', 'verzorg', 'nazorg', 'wassen', 'na de behandeling'] },
    { key: 'toon', q: 'Laatste vraag: hoe begroet je klanten in je eigen woorden?', kw: [], tone: true }
  ];

  /* --- API --- */
  const OWNER = 'owner', STAFF = 'staff', CLIENT = 'client', PUBLIC = 'public';
  const need = (s, lvl, perm) => {
    if (lvl === PUBLIC) return;
    if (lvl === CLIENT) { if (s.role !== 'client') fail('FORBIDDEN', 'Log in via je persoonlijke link'); return; }
    if (lvl === STAFF) { if (s.role !== 'owner' && s.role !== 'employee') fail('FORBIDDEN', 'Geen toegang'); if (s.role === 'employee' && perm && !S.settings.employeePerms.includes(perm)) fail('FORBIDDEN', 'Dit onderdeel is niet aan jou toegewezen'); return; }
    if (lvl === OWNER && s.role !== 'owner') fail('FORBIDDEN', 'Alleen de eigenares heeft toegang');
  };
  const mineAppt = (s, id) => { const a = S.appointments.find(x => x.id === id); if (!a || a.clientId !== s.clientId) fail('NOT_FOUND', 'Niet gevonden'); return a; };

  const H = {
    /* publiek */
    pub_catalog: [PUBLIC, () => ({ address: S.settings.address, surcharges: S.settings.surcharges || [], faq: S.knowledge.filter(k => k.status === 'published').map(k => ({ q: k.q, a: k.answer })), rules: S.rules.filter(r => r.status === 'published' && r.enabled).map(r => r.text), cancelHours: S.settings.cancelHours, vipWindowHours: S.settings.vipWindowHours, salon: S.settings.salonName, tone: S.settings.tone, leadingAgenda: S.settings.leadingAgenda, salonizedUrl: S.settings.salonizedUrl, shipping: S.settings.shipping, pickup: S.settings.pickup, hours: S.settings.hours,
      services: S.services.filter(s => s.live).map(s => ({ ...s, bookable: ['bevestigd', 'voorbeeld'].includes(s.verify.status) })),
      products: S.products.filter(p => p.live).map(p => ({ ...p, variants: p.variants.map(v => ({ ...v, available: available(v.id) })) })),
      media: S.media.filter(m => m.publish && m.consent).map(m => ({ id: m.id, kind: m.kind, type: m.type || 'foto', highlight: m.highlight || '', subject: m.subject, caption: m.caption || '', serviceId: m.serviceId, productId: m.productId, dataUrl: m.dataUrl, poster: m.poster || '', pairUrl: m.pairUrl || '', sound: !!m.sound, focus: m.focus, createdAt: m.createdAt })) })],
    pub_slots: [PUBLIC, (s, a) => { const c = s.role === 'client' ? client(s.clientId) : null; const sv = svc(a.serviceId); let earliest = null; if (a.variantId) { const { v } = findVariant(a.variantId); if (available(a.variantId) < 1) earliest = now() + v.leadDays * DAY; } const own = a.exceptId && c && S.appointments.some(x => x.id === a.exceptId && x.clientId === c.id) ? a.exceptId : undefined; const extraMin = (a.extras || []).map(id => S.services.find(x => x.id === id)).filter(Boolean).reduce((t, x) => t + x.durationMin, 0); return { date: a.date, slots: slotsFor(sv.id, a.date, { vip: c && c.vip, earliest, exceptId: own, extraMin }), earliest, surcharge: (S.settings.surcharges || []).find(x => a.date >= x.from && a.date <= x.to) || null }; }],
    pub_login_staff: [PUBLIC, (s, a) => { const u = S.users.find(x => x.pin === String(a.pin)); if (!u) fail('BAD_PIN', 'Onjuiste pincode'); const t = tok(); S.sessions[t] = { role: u.role, userId: u.id, exp: now() + 12 * HOUR }; audit(u.name, 'ingelogd', u.role); return { token: t, role: u.role, name: u.name, perms: u.role === 'owner' ? 'alles' : S.settings.employeePerms }; }],
    pub_client_start: [PUBLIC, (s, a) => {
      const name = (a.name || '').trim(), phone = (a.phone || '').replace(/\D/g, '');
      if (name.length < 2 || phone.length < 9) fail('VALIDATION', 'Vul je naam en een geldig telefoonnummer in');
      let c = S.clients.find(x => x.phone.replace(/\D/g, '') === phone);
      if (c && c.name.toLowerCase() !== name.toLowerCase() && !a.linkToken) fail('VERIFY', 'Dit nummer is al bekend. Open je persoonlijke link uit je bevestiging om verder te gaan.');
      if (!c) { c = { id: uid('cli'), name, phone, email: a.email || '', channel: a.channel || 'webchat', vip: false, prefs: {}, photoConsent: false, createdAt: now(), token: tok(), notes: '' }; S.clients.push(c); }
      const t = tok(); S.sessions[t] = { role: 'client', clientId: c.id, exp: now() + 30 * DAY }; return { token: t, client: { id: c.id, name: c.name, vip: c.vip } };
    }],
    pub_client_link: [PUBLIC, (s, a) => { const c = S.clients.find(x => x.token === a.link) || fail('NOT_FOUND', 'Deze link is ongeldig of verlopen'); const t = tok(); S.sessions[t] = { role: 'client', clientId: c.id, exp: now() + 30 * DAY }; return { token: t, client: { id: c.id, name: c.name, vip: c.vip } }; }],
    pub_quote: [PUBLIC, (s, a) => { const q = S.quotes.find(x => x.token === a.token) || fail('NOT_FOUND', 'Offerte niet gevonden'); const ap = q.appointmentId && S.appointments.find(x => x.id === q.appointmentId); return { ...q, token: undefined, client: client(q.clientId).name, slot: ap ? { start: ap.start, status: ap.status, service: svc(ap.serviceId).name } : null }; }],
    pub_quote_accept: [PUBLIC, (s, a) => { const q = S.quotes.find(x => x.token === a.token) || fail('NOT_FOUND', 'Offerte niet gevonden'); if (q.status === 'verlopen') fail('EXPIRED', 'Deze offerte is verlopen'); if (!q.acceptedAt) { q.acceptedAt = now(); q.status = 'akkoord'; } evaluateQuote(q); let pay = null; if (!q.depositPaid && q.depositCents > 0) { pay = S.payments.find(p => p.refId === q.id && p.status === 'pending') || startPayment('quote', q.id, q.clientId, q.depositCents, 'aanbetaling'); } return { status: q.status, steps: q.steps, payment: pay && { providerRef: pay.providerRef, amountCents: pay.amountCents } }; }],
    pub_logout: [PUBLIC, (s, a, token) => { delete S.sessions[token]; return { ok: true }; }],
    /* testomgeving betaalprovider (in productie: webhook van de provider) */
    pub_test_checkout: [PUBLIC, (s, a) => { if (S.settings.providerMode !== 'test') fail('FORBIDDEN', 'Alleen in testomgeving'); return providerEvent(signedEvent(a.providerRef, a.status)); }],
    pub_provider_webhook: [PUBLIC, (s, a) => providerEvent(a)],

    /* klant */
    cli_me: [CLIENT, s => { const c = client(s.clientId); const appts = S.appointments.filter(a => a.clientId === c.id && !['expired'].includes(a.status)).map(pub).sort((a, b) => a.start - b.start);
      const myPosts = posts().filter(p => p.clientId === c.id).map(p => ({ id: p.id, label: p.label, total: p.total, paid: p.paid, open: p.open, status: p.status, due: p.due }));
      const openLinks = S.payments.filter(p => p.clientId === c.id && p.status === 'pending' && p.kind === 'restbedrag').map(p => ({ providerRef: p.providerRef, amountCents: p.amountCents, refId: p.refId }));
      return { client: { id: c.id, name: c.name, phone: c.phone, email: c.email, vip: c.vip, prefs: c.prefs, photoConsent: c.photoConsent, link: c.token }, appointments: appts, orders: S.orders.filter(o => o.clientId === c.id && o.status !== 'verlopen'), payments: myPosts, payLinks: openLinks,
        waitlist: S.waitlist.filter(w => w.clientId === c.id), vipRequests: S.vipRequests.filter(v => v.clientId === c.id).map(v => ({ ...v, reminders: undefined })), quotes: S.quotes.filter(q => q.clientId === c.id && q.status !== 'concept').map(q => ({ number: q.number, status: q.status, totalCents: q.totalCents, token: q.token })), intakes: S.intakes.filter(i => i.clientId === c.id).map(i => ({ id: i.id, createdAt: i.createdAt, photos: i.photos.length, answers: i.answers })), messages: S.outbox.filter(m => m.clientId === c.id && m.status !== 'gepland').slice(-10) }; }],
    cli_book: [CLIENT, (s, a) => book(client(s.clientId), a, 'klant')],
    cli_intake: [CLIENT, (s, a) => { const c = client(s.clientId); if (a.photos && a.photos.length && !a.consent) fail('CONSENT', 'Geef toestemming om foto’s op te slaan, of verwijder de foto’s'); const i = { id: uid('int'), clientId: c.id, answers: a.answers || {}, photos: (a.photos || []).map(p => ({ id: uid('pho'), kind: p.kind, dataUrl: p.dataUrl })), consent: !!a.consent, createdAt: now(), reviewed: false }; S.intakes.push(i); if (a.consent) c.photoConsent = true; Object.assign(c.prefs, a.prefs || {}); S.tasks.push({ id: uid('tsk'), text: `Intake van ${c.name} beoordelen${i.photos.length ? ' (' + i.photos.length + ' foto’s)' : ''}`, due: now(), done: false, kind: 'intake', ref: { type: 'intake', id: i.id } }); return { id: i.id }; }],
    cli_delete_photos: [CLIENT, s => { const c = client(s.clientId); let n = 0; for (const i of S.intakes.filter(x => x.clientId === c.id)) { n += i.photos.length; i.photos = []; } c.photoConsent = false; audit(c.name, 'foto’s verwijderd op verzoek', n); return { deleted: n }; }],
    cli_cancel: [CLIENT, (s, a) => { const ap = mineAppt(s, a.id); if (!['confirmed', 'hold', 'offered'].includes(ap.status)) fail('STATE', 'Deze afspraak kan niet meer geannuleerd worden'); if (ap.status === 'offered') { ap.status = 'declined'; const w = S.waitlist.find(x => x.id === ap.waitlistId); if (w) w.status = 'wachtend'; offerNext(ap.slotFromCancel); return { ok: true }; } if (ap.status === 'confirmed' && ap.start - now() < S.settings.cancelHours * HOUR) fail('LATE', `Annuleren kan tot ${S.settings.cancelHours} uur vooraf. Stuur de salon een bericht.`); cancelAppointment(ap, client(s.clientId).name, 'door klant'); return { ok: true }; }],
    cli_reschedule: [CLIENT, (s, a) => { const ap = mineAppt(s, a.id); if (ap.status !== 'confirmed') fail('STATE', 'Alleen bevestigde afspraken kun je verplaatsen'); if (ap.start - now() < S.settings.cancelHours * HOUR) fail('LATE', 'Verplaatsen binnen de termijn gaat via de salon.'); const why = slotFree(ap.serviceId, a.start, { exceptId: ap.id, vip: client(s.clientId).vip, extraMin: ap.extraMin || 0 }); if (why) fail('SLOT_TAKEN', why); const old = { start: ap.start, serviceId: ap.serviceId }; Object.assign(ap, occupied(ap.serviceId, a.start, ap.extraMin || 0)); S.outbox.filter(m => m.ref && m.ref.id === ap.id && m.type === 'reminder').forEach(m => m.sendAt = ap.start - S.settings.reminderHours * HOUR); queue(ap.clientId, 'bevestiging', `Je afspraak is verplaatst naar ${fmtDT(ap.start)}.`, now(), { type: 'appointment', id: ap.id }); offerNext(old); return { appointment: pub(ap) }; }],
    cli_accept_offer: [CLIENT, (s, a) => { const ap = mineAppt(s, a.id); if (ap.status !== 'offered' || ap.offerExpires <= now()) fail('EXPIRED', 'Dit aanbod is verlopen'); const w = S.waitlist.find(x => x.id === ap.waitlistId); if (w) w.status = 'geboekt'; if (ap.depositCents > 0) { ap.status = 'hold'; ap.holdExpires = now() + S.settings.holdMinutes * MIN; const p = startPayment('appointment', ap.id, ap.clientId, ap.depositCents, 'aanbetaling'); return { payment: { providerRef: p.providerRef, amountCents: p.amountCents } }; } confirmAppointment(ap, 'wachtlijst'); return { ok: true }; }],
    cli_waitlist: [CLIENT, (s, a) => { svc(a.serviceId); const w = { id: uid('wl'), clientId: s.clientId, serviceId: a.serviceId, days: a.days || [], parts: a.parts || [], createdAt: now(), status: 'wachtend' }; S.waitlist.push(w); return w; }],
    cli_waitlist_leave: [CLIENT, (s, a) => { const w = S.waitlist.find(x => x.id === a.id && x.clientId === s.clientId) || fail('NOT_FOUND', 'Niet gevonden'); w.status = 'afgemeld'; return { ok: true }; }],
    cli_vip_request: [CLIENT, (s, a) => { const c = client(s.clientId); if (!a.date || !a.serviceId) fail('VALIDATION', 'Kies een datum en behandeling'); const v = { id: uid('vip'), clientId: c.id, date: a.date, serviceId: a.serviceId, occasion: a.occasion || '', note: a.note || '', status: 'Aangevraagd', createdAt: now() }; S.vipRequests.push(v); S.tasks.push({ id: uid('tsk'), text: `VIP-aanvraag van ${c.name}: ${svc(a.serviceId).name} op ${fmtD(amsToUtc(a.date, '12:00'))} (${a.occasion || 'gelegenheid onbekend'})`, due: now(), done: false, kind: 'vip', ref: { type: 'vip', id: v.id } }); return v; }],
    cli_chat: [CLIENT, (s, a) => { const c = client(s.clientId); const conv = convFor(c, a.channel); conv.messages.push({ from: 'client', text: String(a.text).slice(0, 1000), at: now() }); conv.unread++;
      if (conv.status === 'human') return { paused: true };
      if (conv.status === 'handoff') { const r = { text: 'Je bericht is toegevoegd aan je vraag bij de salon. Je krijgt persoonlijk antwoord.' }; conv.messages.push({ from: 'bot', text: r.text, at: now() }); return r; }
      const r = botAnswer(c, conv, a.text); conv.messages.push({ from: 'bot', text: r.text, at: now(), data: r }); return r; }],
    cli_chat_history: [CLIENT, (s, a) => { const c = client(s.clientId); const conv = convFor(c, a.channel); return { status: conv.status, messages: conv.messages }; }],
    cli_order: [CLIENT, (s, a) => { const c = client(s.clientId); if (!a.items || !a.items.length) fail('VALIDATION', 'Je winkelwagen is leeg');
      let delivery = { type: 'afhalen', rateCents: 0 }; if (a.delivery && a.delivery.type === 'bezorgen') { const sh = S.settings.shipping.find(x => x.country === a.delivery.country) || fail('VALIDATION', 'We verzenden nog niet naar dit land'); delivery = { type: 'bezorgen', country: sh.country, rateCents: sh.rateCents, address: a.delivery.address || '' }; if (!delivery.address) fail('VALIDATION', 'Vul je bezorgadres in'); }
      if (a.idempotencyKey) { const ex = S.orders.find(o => o.idempotencyKey === a.idempotencyKey && o.clientId === c.id); if (ex) { const p = S.payments.find(x => x.refId === ex.id && x.status === 'pending'); return { order: ex, payment: p && { providerRef: p.providerRef, amountCents: p.amountCents }, duplicate: true }; } }
      const o = { id: uid('ord'), number: 'JR-' + String(S.orders.length + 1001), clientId: c.id, items: [], delivery, status: 'hold', holdExpires: now() + S.settings.holdMinutes * MIN, createdAt: now(), idempotencyKey: a.idempotencyKey || null };
      for (const it of a.items) { const { p, v } = findVariant(it.variantId); if (!p.live) fail('NOT_FOUND', 'Product niet beschikbaar'); o.items.push({ variantId: v.id, name: p.name + ' · ' + v.label, qty: it.qty, priceCents: v.priceCents }); }
      const created = []; try { for (const it of o.items) created.push(reserve(it.variantId, it.qty, { type: 'order', id: o.id }, 'hold', o.holdExpires)); } catch (e) { created.forEach(r => r.status = 'released'); throw e; }
      o.totalCents = o.items.reduce((x, i) => x + i.qty * i.priceCents, 0) + delivery.rateCents; S.orders.push(o);
      const p = startPayment('order', o.id, c.id, o.totalCents, 'bestelling'); return { order: o, payment: { providerRef: p.providerRef, amountCents: p.amountCents } }; }],
    cli_reorder: [CLIENT, (s, a) => { const o = S.orders.find(x => x.id === a.id && x.clientId === s.clientId) || fail('NOT_FOUND', 'Niet gevonden'); return { items: o.items.map(i => { const { p, v } = findVariant(i.variantId); const av = available(v.id); return { variantId: v.id, name: i.name, qty: Math.min(i.qty, Math.max(av, 0)), oldPrice: i.priceCents, price: v.priceCents, available: av, live: p.live, changed: v.priceCents !== i.priceCents, short: av < i.qty }; }) }; }],
    cli_pay_retry: [CLIENT, (s, a) => { const p = S.payments.find(x => x.providerRef === a.providerRef && x.clientId === s.clientId) || fail('NOT_FOUND', 'Niet gevonden'); if (p.status !== 'failed') fail('STATE', 'Deze betaling hoeft niet opnieuw'); const ref = p.refType === 'appointment' ? S.appointments.find(x => x.id === p.refId) : p.refType === 'order' ? S.orders.find(x => x.id === p.refId) : S.quotes.find(x => x.id === p.refId); if (ref.holdExpires && ref.holdExpires <= now()) fail('EXPIRED', 'De reservering is verlopen. Begin opnieuw.'); const n = startPayment(p.refType, p.refId, p.clientId, p.amountCents, p.kind); return { providerRef: n.providerRef, amountCents: n.amountCents }; }],
    cli_pay_link: [CLIENT, (s, a) => { const p = S.payments.find(x => x.providerRef === a.providerRef && x.clientId === s.clientId) || fail('NOT_FOUND', 'Niet gevonden'); return { amountCents: p.amountCents, status: p.status }; }],

    /* werkruimte */
    stf_today: [STAFF, s => { const date = amsParts(now()).date; const start = amsToUtc(date, '00:00'), end = amsToUtc(addDays(date, 1), '00:00');
      const appts = S.appointments.filter(a => a.start >= start && a.start < end && ['confirmed', 'completed', 'hold', 'option', 'offered', 'exception'].includes(a.status)).map(a => ({ ...pub(a), variant: a.variantId ? findVariant(a.variantId).v.label : null, reserved: S.reservations.some(r => r.ref.id === a.id && r.status === 'active') })).sort((a, b) => a.start - b.start);
      const out = { date, appointments: appts, bundles: appts.filter(a => a.variant).map(a => ({ time: hm(a.start), client: a.client, variant: a.variant, reserved: a.reserved })),
        purchases: forecast().filter(f => f.alert), unanswered: S.conversations.filter(c => c.status === 'handoff').map(c => ({ id: c.id, client: client(c.clientId).name, question: c.handoff.question, at: c.handoff.at })),
        tasks: S.tasks.filter(t => !t.done && (!t.ownerOnly || s.role === 'owner')).sort((a, b) => a.due - b.due).slice(0, 30),
        vipReminders: S.vipRequests.flatMap(v => (v.reminders || []).filter(r => !r.done && r.dueAt - S.settings.vipReminders.warnDaysAhead * DAY <= now()).map(r => ({ ...r, requestId: v.id, client: client(v.clientId).name, date: v.date }))),
        repeated: S.unanswered.filter(u => u.count >= 2 && !u.resolved) };
      if (s.role === 'owner') { const ps = posts(); const due = ps.filter(p => p.status === 'Nog te ontvangen' || p.status === 'Te laat'); out.receivable = { count: due.length, cents: due.reduce((a, p) => a + p.open, 0), late: ps.filter(p => p.status === 'Te laat').length }; }
      return out; }],
    stf_agenda: [STAFF, (s, a) => { need(s, STAFF, 'agenda'); const from = amsToUtc(a.from, '00:00'), to = amsToUtc(addDays(a.to, 1), '00:00'); return { appointments: S.appointments.filter(x => x.start >= from && x.start < to && !['expired', 'declined'].includes(x.status)).map(x => ({ ...pub(x), variant: x.variantId ? findVariant(x.variantId).v.label : null, vip: client(x.clientId).vip })), blocks: S.settings.blocks.filter(b => b.start < to && b.end > from), hours: S.settings.hours, vipSpots: S.vipSpots.filter(v => v.start >= from && v.start < to) }; }, 'agenda'],
    stf_waitlist: [STAFF, () => S.waitlist.filter(w => !['afgemeld'].includes(w.status)).map(w => ({ ...w, client: client(w.clientId).name, vip: client(w.clientId).vip, service: svc(w.serviceId).name })).sort((a, b) => (S.settings.vipPriority ? b.vip - a.vip : 0) || a.createdAt - b.createdAt), 'agenda'],
    stf_slots: [STAFF, (s, a) => ({ slots: slotsFor(a.serviceId, a.date, { vip: true, exceptId: a.exceptId }) })],
    stf_parse_command: [STAFF, (s, a) => parseCommand(a.text), 'agenda'],
    stf_apply_block: [STAFF, (s, a) => { const p = parseCommand(a.text); if (p.error) fail('PARSE', p.error); if (p.start !== a.start || p.end !== a.end) fail('CHANGED', 'De voorvertoning is veranderd. Controleer opnieuw.'); const b = { id: uid('blk'), start: p.start, end: p.end, label: p.label, by: staffName(s), at: now() }; S.settings.blocks.push(b); audit(staffName(s), 'agenda geblokkeerd', `${p.date} ${p.from}-${p.to}`); return { block: b, affected: p.affected }; }, 'agenda'],
    stf_remove_block: [STAFF, (s, a) => { S.settings.blocks = S.settings.blocks.filter(b => b.id !== a.id); audit(staffName(s), 'blokkade verwijderd', a.id); return { ok: true }; }, 'agenda'],
    stf_move: [STAFF, (s, a) => { const ap = S.appointments.find(x => x.id === a.id) || fail('NOT_FOUND', 'Niet gevonden'); const why = slotFree(ap.serviceId, a.start, { exceptId: ap.id, vip: true, extraMin: ap.extraMin || 0 }); if (why) fail('SLOT_TAKEN', why); const old = { start: ap.start, serviceId: ap.serviceId }; Object.assign(ap, occupied(ap.serviceId, a.start, ap.extraMin || 0)); S.outbox.filter(m => m.ref && m.ref.id === ap.id && m.type === 'reminder').forEach(m => m.sendAt = ap.start - S.settings.reminderHours * HOUR); queue(ap.clientId, 'bevestiging', `Je afspraak is verplaatst naar ${fmtDT(ap.start)}.`, now(), { type: 'appointment', id: ap.id }); audit(staffName(s), 'afspraak verplaatst', ap.id); offerNext(old); return { appointment: pub(ap) }; }, 'agenda'],
    stf_cancel: [STAFF, (s, a) => { const ap = S.appointments.find(x => x.id === a.id) || fail('NOT_FOUND', 'Niet gevonden'); const offer = cancelAppointment(ap, staffName(s), a.reason || 'door salon'); queue(ap.clientId, 'annulering', `Je afspraak op ${fmtDT(ap.start)} is geannuleerd door de salon.${a.reason ? ' Reden: ' + a.reason : ''}`, now()); return { offer: offer && pub(offer) }; }, 'agenda'],
    stf_book_for: [STAFF, (s, a) => book(client(a.clientId), a, 'eigenares'), 'agenda'],
    stf_clients: [STAFF, (s, a) => { const q = norm(a.q || ''); return S.clients.filter(c => !q || norm(c.name + ' ' + c.phone).includes(q)).map(c => ({ id: c.id, name: c.name, phone: c.phone, vip: c.vip, channel: c.channel, next: (S.appointments.filter(x => x.clientId === c.id && x.start > now() && x.status === 'confirmed').sort((x, y) => x.start - y.start)[0] || {}).start || null })); }, 'klanten'],
    stf_client_card: [STAFF, (s, a) => { const c = client(a.id); const card = { client: { ...c, token: undefined }, appointments: S.appointments.filter(x => x.clientId === c.id && !['expired'].includes(x.status)).map(x => ({ ...pub(x), variant: x.variantId ? findVariant(x.variantId).v.label : null })).sort((x, y) => y.start - x.start),
      intakes: S.intakes.filter(i => i.clientId === c.id), orders: S.orders.filter(o => o.clientId === c.id && o.status !== 'verlopen'), bundles: S.reservations.filter(r => S.appointments.some(x => x.id === r.ref.id && x.clientId === c.id) && r.status !== 'released').map(r => ({ ...r, label: findVariant(r.variantId).v.label })),
      conversations: S.conversations.filter(x => x.clientId === c.id).map(x => ({ id: x.id, channel: x.channel, status: x.status, last: x.messages.slice(-1)[0] })), waitlist: S.waitlist.filter(w => w.clientId === c.id), vip: S.vipRequests.filter(v => v.clientId === c.id), aftercare: S.outbox.filter(m => m.clientId === c.id && ['nazorg', 'vervolg'].includes(m.type)) };
      if (s.role === 'owner') card.payments = posts().filter(p => p.clientId === c.id); return card; }, 'klanten'],
    stf_client_update: [STAFF, (s, a) => { const c = client(a.id); for (const k of ['name', 'phone', 'email', 'notes']) if (a[k] !== undefined) c[k] = a[k]; if (a.prefs) Object.assign(c.prefs, a.prefs); if (a.vip !== undefined) { need(s, OWNER); c.vip = !!a.vip; } audit(staffName(s), 'klantkaart bijgewerkt', c.id); return { ok: true }; }, 'klanten'],
    stf_intake_review: [STAFF, (s, a) => { const i = S.intakes.find(x => x.id === a.id) || fail('NOT_FOUND', 'Niet gevonden'); i.reviewed = true; i.reviewedBy = staffName(s); i.reviewedAt = now(); S.tasks.filter(t => t.ref && t.ref.id === i.id).forEach(t => t.done = true); return { ok: true }; }, 'klanten'],
    stf_delete_photos: [STAFF, (s, a) => { const c = client(a.clientId); let n = 0; for (const i of S.intakes.filter(x => x.clientId === c.id)) { n += i.photos.length; i.photos = []; } c.photoConsent = false; audit(staffName(s), 'foto’s verwijderd', c.id); return { deleted: n }; }, 'klanten'],
    stf_inbox: [STAFF, () => S.conversations.map(c => ({ id: c.id, client: client(c.clientId).name, clientId: c.clientId, vip: client(c.clientId).vip, channel: c.channel, status: c.status, unread: c.unread, last: c.messages.slice(-1)[0], handoff: c.handoff })).sort((a, b) => (b.last ? b.last.at : 0) - (a.last ? a.last.at : 0)), 'inbox'],
    stf_conversation: [STAFF, (s, a) => { const c = S.conversations.find(x => x.id === a.id) || fail('NOT_FOUND', 'Niet gevonden'); c.unread = 0; return { ...c, client: client(c.clientId).name, clientId: c.clientId }; }, 'inbox'],
    stf_take_over: [STAFF, (s, a) => { const c = S.conversations.find(x => x.id === a.id); c.status = 'human'; c.takenBy = staffName(s); audit(staffName(s), 'gesprek overgenomen', c.id); return { ok: true }; }, 'inbox'],
    stf_reply: [STAFF, (s, a) => { const c = S.conversations.find(x => x.id === a.id); if (!a.text || !a.text.trim()) fail('VALIDATION', 'Leeg bericht'); c.messages.push({ from: 'staff', text: a.text.trim(), at: now(), by: staffName(s) }); if (c.status === 'handoff') c.status = 'human'; const u = c.handoff && S.unanswered.find(x => x.question === c.handoff.question); return { ok: true, suggestKnowledge: !!u }; }, 'inbox'],
    stf_release_bot: [STAFF, (s, a) => { const c = S.conversations.find(x => x.id === a.id); c.status = 'bot'; c.handoff = null; return { ok: true }; }, 'inbox'],
    stf_orders: [STAFF, () => S.orders.filter(o => o.status !== 'verlopen').slice().reverse().map(o => ({ ...o, client: (S.clients.find(c => c.id === o.clientId) || {}).name })), 'voorraad'],
    stf_order_status: [STAFF, (s, a) => { const o = S.orders.find(x => x.id === a.id) || fail('NOT_FOUND', 'Niet gevonden'); if (!['klaar', 'verzonden', 'afgehaald', 'geleverd'].includes(a.status)) fail('VALIDATION', 'Onbekende status'); if (!['betaald', 'klaar', 'verzonden'].includes(o.status)) fail('STATE', 'Alleen betaalde bestellingen'); o.status = a.status; o.track = a.track || o.track || ''; (o.history = o.history || []).push({ at: now(), status: a.status, by: staffName(s) }); queue(o.clientId, 'bestelling', a.status === 'klaar' ? `Je bestelling ${o.number} ligt klaar om af te halen.` : a.status === 'verzonden' ? `Je bestelling ${o.number} is verzonden.${o.track ? ' Track & trace: ' + o.track : ''}` : `Status van bestelling ${o.number}: ${a.status}.`, now(), { type: 'order', id: o.id }); audit(staffName(s), 'bestelling ' + a.status, o.number); return o; }, 'voorraad'],
    stf_forecast: [STAFF, (s, a) => forecast(a.weeks || 6), 'voorraad'],
    stf_stock_update: [STAFF, (s, a) => { const { v } = findVariant(a.variantId); const old = v.stock; v.stock = Math.max(0, parseInt(a.stock, 10) || 0); if (a.purchased) S.tasks.filter(t => t.kind === 'inkoop' && !t.done && t.text.includes(v.label)).forEach(t => { t.done = true; }); audit(staffName(s), 'voorraad aangepast', `${v.label}: ${old} → ${v.stock}`); return { ok: true }; }, 'voorraad'],
    stf_task_done: [STAFF, (s, a) => { const t = S.tasks.find(x => x.id === a.id) || fail('NOT_FOUND', 'Niet gevonden'); if (t.ownerOnly) need(s, OWNER); t.done = true; t.doneBy = staffName(s); return { ok: true }; }],
    stf_vip_reminder_done: [STAFF, (s, a) => { const v = S.vipRequests.find(x => x.id === a.id); const r = v.reminders.find(x => x.type === a.type); r.done = true; r.doneBy = staffName(s); return { ok: true }; }],

    /* alleen eigenares */
    own_products: [OWNER, () => S.products],
    own_product_save: [OWNER, (s, a) => { let p = S.products.find(x => x.id === a.id); if (!p) { p = { id: uid('prd'), variants: [], live: false }; S.products.push(p); } Object.assign(p, { name: a.name, category: a.category, description: a.description, supplement: !!a.supplement, approvedInfo: a.approvedInfo || '', live: !!a.live }); if (a.variants) p.variants = a.variants.map(v => ({ id: v.id || uid('var'), label: v.label, color: v.color || '', length: v.length || '', priceCents: Math.round(v.priceCents), stock: v.stock | 0, leadDays: v.leadDays | 0, reorderPoint: v.reorderPoint | 0 })); audit(staffName(s), 'product opgeslagen', p.name + (p.live ? ' (live)' : ' (concept)')); return p; }],
    own_services: [OWNER, () => S.services],
    own_service_save: [OWNER, (s, a) => { let v = S.services.find(x => x.id === a.id); if (!v) { v = { id: uid('svc'), verify: { status: 'onbevestigd', source: 'handmatig', checkedAt: fmtISO(now()) } }; S.services.push(v); } for (const k of ['name', 'category', 'priceCents', 'durationMin', 'prepMin', 'bufferMin', 'depositCents', 'followUpWeeks', 'care', 'intakeRequired', 'needsVariant', 'live']) if (a[k] !== undefined) v[k] = a[k]; if (a.confirm) v.verify = { status: 'bevestigd', source: 'Bevestigd door eigenares', checkedAt: fmtISO(now()), by: staffName(s) }; if (v.live && !['bevestigd', 'voorbeeld'].includes(v.verify.status)) v.live = false; audit(staffName(s), 'dienst opgeslagen', v.name); return v; }],
    own_settings: [OWNER, () => ({ ...S.settings, providerSecret: '••••' })],
    own_settings_save: [OWNER, (s, a) => { for (const k of ['address', 'hours', 'breaks', 'longThroughBreakMin', 'slotStepMin', 'leave', 'vipWindowHours', 'vipPriority', 'holdMinutes', 'waitlistOfferMinutes', 'cancelHours', 'shipping', 'pickup', 'leadingAgenda', 'reminderHours', 'vipReminders', 'employeePerms', 'tone']) if (a[k] !== undefined) S.settings[k] = a[k]; audit(staffName(s), 'instellingen opgeslagen', Object.keys(a).join(', ')); return { ok: true }; }],
    own_finance: [OWNER, (s, a) => { const ps = posts(); return { posts: ps, totals: { receivable: ps.filter(p => p.status === 'Nog te ontvangen').reduce((x, p) => x + p.open, 0), late: ps.filter(p => p.status === 'Te laat').reduce((x, p) => x + p.open, 0), planned: ps.filter(p => p.status === 'Gepland').reduce((x, p) => x + p.open, 0) }, payments: S.payments.map(p => ({ ...p, client: (S.clients.find(c => c.id === p.clientId) || {}).name })) }; }],
    own_register_payment: [OWNER, (s, a) => { if (!['pin', 'overboeking', 'contant'].includes(a.method)) fail('VALIDATION', 'Kies pin, overboeking of contant'); const cents = Math.round(a.amountCents); if (!(cents > 0)) fail('VALIDATION', 'Vul een bedrag in'); const post = posts().find(p => p.id === a.refId) || fail('NOT_FOUND', 'Post niet gevonden'); if (cents > post.open) fail('VALIDATION', `Het bedrag is hoger dan het openstaande bedrag (${eur(post.open)})`); const p = { id: uid('pay'), refType: post.type === 'Afspraak' ? 'appointment' : 'order', refId: post.id, clientId: post.clientId, kind: 'handmatig', amountCents: cents, method: a.method, status: 'paid', paidAt: now(), createdAt: now(), log: [{ at: now(), by: staffName(s), what: `${a.method} geregistreerd` }] }; S.payments.push(p); audit(staffName(s), 'betaling geregistreerd', `${a.method} ${eur(cents)} op ${post.label}`); return { payment: p }; }],
    own_refund: [OWNER, (s, a) => { const p = S.payments.find(x => x.id === a.id) || fail('NOT_FOUND', 'Niet gevonden'); if (p.status !== 'paid') fail('STATE', 'Alleen betaalde posten kun je terugbetalen'); const cents = Math.round(a.amountCents || p.amountCents); const r = { id: uid('pay'), refType: p.refType, refId: p.refId, clientId: p.clientId, kind: 'terugbetaling', amountCents: cents, method: p.method, status: p.method === 'online' ? 'refund_pending' : 'refunded', providerRef: p.method === 'online' ? 'rf_test_' + tok().slice(0, 10) : null, refundOf: p.id, createdAt: now(), log: [{ at: now(), by: staffName(s), what: 'terugbetaling ' + (p.method === 'online' ? 'aangevraagd bij provider' : 'geregistreerd') }] }; S.payments.push(r); if (p.exception) S.tasks.filter(t => t.ref && t.ref.id === p.id).forEach(t => t.done = true); audit(staffName(s), 'terugbetaling', eur(cents)); return { refund: r }; }],
    own_paylink: [OWNER, (s, a) => { const post = posts().find(p => p.id === a.refId) || fail('NOT_FOUND', 'Post niet gevonden'); const pl = { id: uid('pl'), refId: post.id, refType: post.type === 'Afspraak' ? 'appointment' : 'order', clientId: post.clientId, status: a.when === 'nu' ? 'nu' : a.when === 'later' ? 'ingepland' : 'concept', sendAt: a.when === 'later' ? a.sendAt : null, createdAt: now(), by: staffName(s) }; S.paylinks.push(pl); if (pl.status === 'nu') sendPaylink(pl); return pl; }],
    own_paylink_send: [OWNER, (s, a) => { const pl = S.paylinks.find(x => x.id === a.id); sendPaylink(pl); return pl; }],
    own_day_close: [OWNER, (s, a) => { const date = a.date || amsParts(now()).date; const from = amsToUtc(date, '00:00'), to = amsToUtc(addDays(date, 1), '00:00'); const pays = S.payments.filter(p => (p.paidAt || p.createdAt) >= from && (p.paidAt || p.createdAt) < to); const by = {}; for (const p of pays.filter(p => p.status === 'paid')) by[p.method] = (by[p.method] || 0) + p.amountCents; const ps = posts(); return { date, received: by, receivedTotal: Object.values(by).reduce((x, y) => x + y, 0), refunds: pays.filter(p => p.kind === 'terugbetaling').reduce((x, p) => x + p.amountCents, 0), open: ps.filter(p => ['Nog te ontvangen', 'Te laat'].includes(p.status)), planned: ps.filter(p => p.status === 'Gepland').reduce((x, p) => x + p.open, 0), attention: S.tasks.filter(t => !t.done && (t.kind === 'uitzondering' || t.kind === 'inkoop')), appointments: S.appointments.filter(x => x.start >= from && x.start < to && ['confirmed', 'completed'].includes(x.status)).length }; }],
    own_quote_create: [OWNER, (s, a) => { const c = client(a.clientId); const lines = (a.lines || []).filter(l => l.label && l.cents > 0); if (!lines.length) fail('VALIDATION', 'Voeg minimaal één regel toe'); const total = lines.reduce((x, l) => x + Math.round(l.cents), 0);
      const q = { id: uid('quo'), number: 'OFF-' + (S.quotes.length + 101), token: tok(), clientId: c.id, intakeId: a.intakeId || null, lines, totalCents: total, depositCents: Math.min(total, Math.round(a.depositCents || 0)), validUntil: now() + (a.validDays || 7) * DAY, terms: a.terms || 'Aanbetaling wordt verrekend met het totaal. Annuleren kan tot 48 uur vooraf.', status: 'verzonden', createdAt: now(), steps: {} }; S.quotes.push(q);
      if (a.serviceId && a.start) { const why = slotFree(a.serviceId, a.start, { vip: true }); if (why) fail('SLOT_TAKEN', why); const sv = svc(a.serviceId); const ap = { id: uid('apt'), clientId: c.id, serviceId: sv.id, ...occupied(sv.id, a.start), status: 'option', optionExpires: q.validUntil, variantId: a.variantId || null, totalCents: total, depositCents: q.depositCents, createdAt: now(), source: 'offerte' }; S.appointments.push(ap); q.appointmentId = ap.id; if (a.variantId && available(a.variantId) > 0) reserve(a.variantId, 1, { type: 'appointment', id: ap.id }, 'active'); else if (a.variantId) S.tasks.push({ id: uid('tsk'), text: `Inkopen: ${findVariant(a.variantId).v.label} voor offerte ${q.number}`, due: a.start - findVariant(a.variantId).v.leadDays * DAY, done: false, kind: 'inkoop', ref: { type: 'appointment', id: ap.id } }); }
      if (a.vipRequestId) { const v = S.vipRequests.find(x => x.id === a.vipRequestId); v.status = 'Optie'; v.quoteId = q.id; v.appointmentId = q.appointmentId; v.optionExpires = q.validUntil; queue(c.id, 'vip', `Je datum staat in optie tot ${fmtD(q.validUntil)}. Bekijk en accepteer je offerte via je persoonlijke link.`, now()); }
      queue(c.id, 'offerte', `Je persoonlijke offerte ${q.number} staat klaar (${eur(total)}).`, now(), { type: 'quote', id: q.id }); evaluateQuote(q); q.status = 'verzonden'; audit(staffName(s), 'offerte gemaakt', q.number); return q; }],
    own_quotes: [OWNER, () => S.quotes.map(q => ({ ...q, client: client(q.clientId).name }))],
    own_vip: [OWNER, () => ({ requests: S.vipRequests.map(v => ({ ...v, client: client(v.clientId).name, service: svc(v.serviceId).name })), spots: S.vipSpots, windowHours: S.settings.vipWindowHours, priority: S.settings.vipPriority, clients: S.clients.filter(c => c.vip).map(c => ({ id: c.id, name: c.name })) })],
    own_vip_spot: [OWNER, (s, a) => { const v = { id: uid('vs'), start: a.start, serviceId: a.serviceId || null, releaseAt: now() + S.settings.vipWindowHours * HOUR, status: 'vip', createdAt: now() }; S.vipSpots.push(v); return v; }],
    own_vip_status: [OWNER, (s, a) => { const v = S.vipRequests.find(x => x.id === a.id); v.status = a.status; if (a.status === 'Vervallen' && v.appointmentId) { const ap = S.appointments.find(x => x.id === v.appointmentId); if (ap && ap.status === 'option') { ap.status = 'expired'; releaseRef(ap.id, 'VIP-optie ingetrokken'); } } return v; }],
    own_knowledge: [OWNER, () => ({ knowledge: S.knowledge, rules: S.rules, unanswered: S.unanswered, training: S.training, questions: TRAINING, tone: S.settings.tone })],
    own_training_answer: [OWNER, (s, a) => { const T = S.training; const q = TRAINING[a.idx]; if (!q) fail('NOT_FOUND', 'Vraag bestaat niet'); T.answers[q.key] = { text: a.skip ? '' : String(a.text || '').trim(), skipped: !!a.skip, at: now() }; T.idx = Math.max(T.idx, a.idx + 1); T.status = T.idx >= TRAINING.length ? 'klaar' : 'bezig'; return T; }],
    own_training_pause: [OWNER, (s, a) => { S.training.status = a.paused ? 'gepauzeerd' : 'bezig'; return S.training; }],
    own_training_suggestions: [OWNER, () => { const out = []; for (const q of TRAINING) { const ans = S.training.answers[q.key]; if (!ans || !ans.text) continue; if (q.tone) out.push({ kind: 'toon', key: q.key, text: ans.text }); else out.push({ kind: 'antwoord', key: q.key, q: q.q, keywords: q.kw, answer: ans.text }); if (q.rule) out.push({ kind: 'regel', key: q.key + '_regel', text: q.rule, basedOn: ans.text }); } return out; }],
    own_knowledge_save: [OWNER, (s, a) => { let k = S.knowledge.find(x => x.id === a.id); if (!k) { k = { id: uid('kn'), status: 'concept', history: [], scope: 'algemeen' }; S.knowledge.push(k); } if (k.answer && k.answer !== a.answer) k.history.push({ at: now(), answer: k.answer, by: staffName(s) }); Object.assign(k, { q: a.q, keywords: (a.keywords || []).map(x => String(x).trim()).filter(Boolean), answer: a.answer }); if (a.publish) { k.status = 'published'; k.approvedBy = staffName(s); k.approvedAt = now(); } else if (k.status !== 'published') k.status = 'concept'; if (a.unansweredId) { const u = S.unanswered.find(x => x.id === a.unansweredId); if (u) { u.resolved = true; u.asked = true; } } audit(staffName(s), a.publish ? 'kennis gepubliceerd' : 'kennis opgeslagen als concept', k.q); return k; }],
    own_knowledge_retract: [OWNER, (s, a) => { const k = S.knowledge.find(x => x.id === a.id); k.status = 'ingetrokken'; k.retractedBy = staffName(s); k.retractedAt = now(); audit(staffName(s), 'kennis ingetrokken', k.q); return k; }],
    own_rule_save: [OWNER, (s, a) => { let r = S.rules.find(x => x.id === a.id || (a.key && x.key === a.key)); if (!r) { r = { id: uid('rule'), key: a.key || uid('k') }; S.rules.push(r); } Object.assign(r, { text: a.text, enabled: a.enabled !== false, status: a.publish ? 'published' : (a.retract ? 'ingetrokken' : 'concept') }); if (a.publish) { r.approvedBy = staffName(s); r.approvedAt = now(); } audit(staffName(s), 'regel ' + r.status, r.text); return r; }],
    own_tone_publish: [OWNER, (s, a) => { S.settings.tone = { greeting: a.greeting, closing: a.closing || '', confirmed: true, approvedBy: staffName(s), approvedAt: now() }; audit(staffName(s), 'aanspreekstijl gepubliceerd', a.greeting); return S.settings.tone; }],
    own_unanswered_ask: [OWNER, (s, a) => { const u = S.unanswered.find(x => x.id === a.id); u.asked = true; return u; }],
    own_insights: [OWNER, () => {
      const t = now(), wk = 7 * DAY; const done = S.appointments.filter(a => ['confirmed', 'completed'].includes(a.status));
      const mon = d => { const p = amsParts(d); const date = addDays(p.date, -((p.wd + 6) % 7)); return amsToUtc(date, '00:00'); };
      const w0 = mon(t); const weeks = []; for (let i = 7; i >= 0; i--) { const a = w0 - i * wk, b = a + wk; const L = done.filter(x => x.start >= a && x.start < b); weeks.push({ from: a, cents: L.reduce((x, y) => x + y.totalCents, 0), n: L.length }); }
      const heat = {}; for (const a of done) { const p = amsParts(a.start); const k = p.wd + '-' + p.hh; heat[k] = (heat[k] || 0) + 1; }
      const bySvc = {}; for (const a of done) { const k = a.serviceId; bySvc[k] = bySvc[k] || { n: 0, cents: 0 }; bySvc[k].n++; bySvc[k].cents += a.totalCents; }
      const top = Object.entries(bySvc).map(([id, v]) => ({ id, name: svc(id).name, ...v })).sort((a, b) => b.n - a.n).slice(0, 6);
      const monthStart = amsToUtc(amsParts(t).date.slice(0, 8) + '01', '00:00');
      const month = done.filter(a => a.start >= monthStart && a.start <= t + 31 * DAY && amsParts(a.start).m === amsParts(t).m);
      const firstBy = {}; for (const a of done.slice().sort((x, y) => x.start - y.start)) if (!firstBy[a.clientId]) firstBy[a.clientId] = a.start;
      const recent = done.filter(a => a.start >= t - 30 * DAY && a.start <= t);
      const newC = new Set(recent.filter(a => firstBy[a.clientId] >= t - 30 * DAY).map(a => a.clientId)).size, retC = new Set(recent.map(a => a.clientId)).size - newC;
      let open = 0, booked = 0; for (let i = 0; i < 7; i++) { const d = addDays(amsParts(t).date, i); for (const [a, b] of S.settings.hours[weekday(d)] || []) open += toMin(b) - toMin(a); }
      for (const a of S.appointments.filter(a => blocking(a) && a.start >= t && a.start < t + 7 * DAY)) booked += (a.blockEnd - a.blockStart) / MIN;
      const nextWeek = done.filter(a => a.start >= t && a.start < t + 7 * DAY).length;
      return { weeks, heat, top, monthCents: month.reduce((x, y) => x + y.totalCents, 0), monthN: month.length, avg: done.length ? Math.round(done.reduce((x, y) => x + y.totalCents, 0) / done.length) : 0, occupancy: open ? Math.min(1, booked / open) : 0, newC, retC, nextWeek, hours: S.settings.hours, demo: S.meta.demo };
    }],
    own_audit: [OWNER, () => S.audit.slice(-200).reverse()],
    own_outbox: [OWNER, () => S.outbox.slice().sort((a, b) => b.sendAt - a.sendAt).slice(0, 200).map(m => ({ ...m, client: (S.clients.find(c => c.id === m.clientId) || {}).name }))],
    own_media_add: [OWNER, (s, a) => { if (!a.consent) fail('CONSENT', 'Leg eerst vast dat er toestemming is voor publicatie'); if (a.type === 'voorna' && !a.sameTreatment) fail('CONSENT', 'Voor-en-na alleen als beide foto’s dezelfde behandeling tonen'); const m = { id: uid('med'), kind: a.kind || 'portfolio', type: a.type || 'foto', highlight: a.highlight || '', subject: a.subject || a.highlight || '', caption: a.caption || '', source: a.source, consent: true, serviceId: a.serviceId || null, productId: a.productId || null, dataUrl: a.dataUrl, poster: a.poster || '', pairUrl: a.pairUrl || '', assetId: a.assetId || null, sound: !!a.sound, focus: a.focus || '50% 40%', publish: !!a.publish, createdAt: now() }; S.media.push(m); return { id: m.id }; }],
    own_media_import: [OWNER, (s, a) => { let n = 0; for (const x of a.items || []) if (!S.media.some(m => m.id === x.id)) { S.media.push({ ...x, consent: true, publish: x.publish !== false, createdAt: x.createdAt || now() }); n++; } return { added: n }; }],
    own_media: [OWNER, () => S.media.map(m => ({ ...m, dataUrl: m.dataUrl }))],
    own_media_update: [OWNER, (s, a) => { const m = S.media.find(x => x.id === a.id); Object.assign(m, { focus: a.focus ?? m.focus, publish: a.publish ?? m.publish, serviceId: a.serviceId ?? m.serviceId, highlight: a.highlight ?? m.highlight, caption: a.caption ?? m.caption, kind: a.kind ?? m.kind }); if (a.remove) S.media = S.media.filter(x => x.id !== a.id); return { ok: true }; }],
    own_import_preview: [OWNER, (s, a) => { const rows = parseCSV(a.csv || ''); if (!rows.length) fail('VALIDATION', 'Geen regels gevonden'); const head = rows[0].map(h => norm(h)); const idx = k => head.findIndex(h => h.includes(k)); const iN = idx('naam'), iT = Math.max(idx('telefoon'), idx('phone')), iE = idx('mail'), iA = idx('afspraak'), iD = idx('aanbetaling');
      const out = { total: rows.length - 1, new: [], duplicates: [], missing: [], oldAppointments: 0, futureAppointments: 0, deposits: 0, conflicts: [] }; const seen = new Set();
      for (const r of rows.slice(1)) { const name = r[iN] || '', phone = (r[iT] || '').replace(/\D/g, ''); if (!name || !phone) { out.missing.push({ row: r.join(', '), missing: [!name && 'naam', !phone && 'telefoon'].filter(Boolean) }); continue; } if (S.clients.some(c => c.phone.replace(/\D/g, '') === phone) || seen.has(phone)) { out.duplicates.push({ name, phone }); continue; } seen.add(phone); out.new.push({ name, phone, email: iE >= 0 ? r[iE] : '' });
        if (iA >= 0 && r[iA]) { const d = r[iA].slice(0, 10); if (d < amsParts(now()).date) out.oldAppointments++; else { out.futureAppointments++; const [dd, tt] = r[iA].split(' '); const st = amsToUtc(dd, tt || '10:00'); if (busyRanges().some(([x, y]) => st < y && st + HOUR > x)) out.conflicts.push({ name, when: r[iA] }); } } if (iD >= 0 && parseFloat(r[iD])) out.deposits++; }
      const imp = { id: uid('imp'), at: now(), preview: out, status: 'preview' }; S.imports.push(imp); return { id: imp.id, ...out }; }],
    own_import_apply: [OWNER, (s, a) => { const imp = S.imports.find(x => x.id === a.id) || fail('NOT_FOUND', 'Importvoorbeeld niet gevonden'); if (imp.status !== 'preview') fail('STATE', 'Deze import is al verwerkt'); for (const n of imp.preview.new) S.clients.push({ id: uid('cli'), name: n.name, phone: n.phone, email: n.email || '', channel: 'salonized-import', vip: false, prefs: {}, photoConsent: false, createdAt: now(), token: tok(), notes: 'Geïmporteerd uit Salonized' }); imp.status = 'verwerkt'; imp.appliedBy = staffName(s); audit(staffName(s), 'import verwerkt', imp.preview.new.length + ' klanten'); return { imported: imp.preview.new.length, manual: { appointments: imp.preview.futureAppointments, deposits: imp.preview.deposits, conflicts: imp.preview.conflicts.length } }; }],
    own_client_link: [OWNER, (s, a) => ({ link: client(a.id).token })]
  };

  function api(name, args = {}, token) {
    const h = H[name]; if (!h) fail('NOT_FOUND', 'Onbekende actie');
    const s = session(token);
    tick();
    need(s, h[0], h[2]);
    const snapshot = JSON.stringify(S);
    try { const r = h[1](s, args, token); save(S); return clone(r === undefined ? { ok: true } : r); }
    catch (e) { S = JSON.parse(snapshot); throw e; } // transactie: alles of niets
  }

  return { api, get state() { return S; }, setClock(f) { clock = f; }, reset() { S = seed(now(), opts); save(S); }, ApiError, signedEvent: r => signedEvent(r, 'paid'), _sig: sig, TRAINING };
}

/* ---------- opmaak ---------- */
const eurFmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
function eur(c) { return eurFmt.format((c || 0) / 100); }
const dtFmt = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const dFmt = new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
function fmtDT(ms) { return dtFmt.format(new Date(ms)).replace(' om ', ' ') ; }
function fmtD(ms) { return dFmt.format(new Date(ms)); }
function fmtISO(ms) { return amsParts(ms).date; }
function parseCSV(text) { const rows = []; for (const line of text.split(/\r?\n/)) { if (!line.trim()) continue; const sep = line.includes(';') ? ';' : ','; const cells = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === sep && !q) { cells.push(cur.trim()); cur = ''; } else cur += ch; } cells.push(cur.trim()); rows.push(cells); } return rows; }

const JRS = { createEngine, seed, eur, fmtDT, fmtD, fmtISO, hm, amsParts, amsToUtc, addDays, weekday, TZ, DAY, HOUR, MIN };
if (typeof module !== 'undefined') module.exports = JRS; else root.JRS = JRS;
})(typeof window !== 'undefined' ? window : globalThis);
