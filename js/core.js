/* =========================================================================
   Election Simulator – Core Engine & Game UI Library
   Exposes global `ES` with: register(), methods, hemicycle(), leaderImg(), sfx, ui, util
   ========================================================================= */
(function () {
  'use strict';

  const ES = (window.ES = window.ES || {});
  ES.countries = [];

  /** Register a country module. */
  ES.register = function (module) {
    ES.countries.push(module);
  };

  /* --------------------------------------------------------------------- */
  /* Hungarian Political Leader Portraits Lookup                            */
  /* --------------------------------------------------------------------- */
  const LEADER_PORTRAITS = [
    ['magyar péter', 'img/leaders/magyar_peter.jpg'],
    ['péter magyar', 'img/leaders/magyar_peter.jpg'],
    ['orbán', 'img/leaders/orban_viktor.jpg'],
    ['toroczkai', 'img/leaders/toroczkai_laszlo.jpg'],
    ['dobrev', 'img/leaders/dobrev_klara.jpg'],
    ['gyurcsány', 'img/leaders/gyurcsany_ferenc.jpg'],
    ['gergely kovács', 'img/leaders/kovacs_gergely.jpg'],
    ['kovács gergely', 'img/leaders/kovacs_gergely.jpg'],
    ['márki-zay', 'img/leaders/marki_zay_peter.jpg'],
    ['karácsony', 'img/leaders/karacsony_gergely.jpg'],
    ['vitézy', 'img/leaders/vitezy_david.jpg'],
    ['szentkirályi', 'img/leaders/szentkiralyi_alexandra.jpg'],
    ['baranyi', 'img/leaders/baranyi_krisztina.jpg'],
    ['vona', 'img/leaders/vona_gabor.jpg'],
    ['szél', 'img/leaders/szel_bernadett.jpg'],
    ['fekete-győr', 'img/leaders/fekete_gyor_andras.jpg'],
    ['schiffer', 'img/leaders/schiffer_andras.jpg'],
    ['mesterházy', 'img/leaders/mesterhazy_attila.jpg'],
    ['ibolya dávid', 'img/leaders/david_ibolya.jpg'],
    ['kuncze', 'img/leaders/kuncze_gabor.jpg'],
    ['medgyessy', 'img/leaders/medgyessy_peter.jpg'],
    ['nyers', 'img/leaders/nyers_rezso.jpg'],
    ['horn', 'img/leaders/horn_gyula.jpg'],
    ['torgyán', 'img/leaders/torgyan_jozsef.jpg'],
    ['csurka', 'img/leaders/csurka_istvan.jpg'],
    ['bálint magyar', 'img/leaders/magyar_balint.jpg'],
    ['pető', 'img/leaders/peto_ivan.jpg'],
    ['jános kis', 'img/leaders/kis_janos.jpg'],
    ['antall', 'img/leaders/antall_jozsef.jpg'],
    ['boross', 'img/leaders/boross_peter.jpg'],
    ['lezsák', 'img/leaders/lezsak_sandor.jpg'],
    ['surján', 'img/leaders/surjan_laszlo.jpg'],
    ['keresztes', 'img/leaders/keresztes_sandor.jpg'],
    ['ferenc józsef nagy', 'img/leaders/nagy_ferenc_jozsef.jpg'],
    ['thürmer', 'img/leaders/thuermer_gyula.jpg'],
  ];

  const WIKI_PORTRAIT_CACHE = {};
  const WIKI_TITLE_OVERRIDES = {
    'Frank Underwood': 'Kevin_Spacey',
    'Claire Underwood': 'Robin_Wright',
    'Will Conway': 'Joel_Kinnaman',
    'Heather Dunbar': 'Elizabeth_Marvel',
    'Jackie Sharp': 'Molly_Parker',
    'Catherine Durant': 'Jayne_Atkinson',
    'J.D. Vance': 'JD_Vance',
    'Mette Frederiksen': 'Mette_Frederiksen',
    'Troels Lund Poulsen': 'Troels_Lund_Poulsen',
    'Lars Løkke Rasmussen': 'Lars_Løkke_Rasmussen',
    'Alex Vanopslagh': 'Alex_Vanopslagh',
    'Pia Olsen Dyhr': 'Pia_Olsen_Dyhr',
    'Morten Messerschmidt': 'Morten_Messerschmidt',
    'Inger Støjberg': 'Inger_Støjberg',
    'Pelle Dragsted': 'Pelle_Dragsted',
    'Volodymyr Zelensky': 'Volodymyr_Zelenskyy',
    'Petro Poroshenko': 'Petro_Poroshenko',
    'Yulia Tymoshenko': 'Yulia_Tymoshenko',
    'Yuriy Boyko': 'Yuriy_Boyko',
    'Sviatoslav Vakarchuk': 'Sviatoslav_Vakarchuk',
    'Vladimir Putin': 'Vladimir_Putin',
    'Gennady Zyuganov': 'Gennady_Zyuganov',
    'Grigory Yavlinsky': 'Grigory_Yavlinsky',
    'Vladimir Zhirinovsky': 'Vladimir_Zhirinovsky',
    'Alexei Navalny': 'Alexei_Navalny',
    'Sergey Sobyanin': 'Sergey_Sobyanin',
    'Donald Tusk': 'Donald_Tusk',
    'Jarosław Kaczyński': 'Jarosław_Kaczyński',
    'Rafał Trzaskowski': 'Rafał_Trzaskowski',
    'Karol Nawrocki': 'Karol_Nawrocki',
    'Sławomir Mentzen': 'Sławomir_Mentzen',
    'Szymon Hołownia': 'Szymon_Hołownia',
    'Liz Truss': 'Liz_Truss',
    'Rishi Sunak': 'Rishi_Sunak',
    'Penny Mordaunt': 'Penny_Mordaunt',
    'Kemi Badenoch': 'Kemi_Badenoch',
    'Tom Tugendhat': 'Tom_Tugendhat',
    'Suella Braverman': 'Suella_Braverman',
    'Nadhim Zahawi': 'Nadhim_Zahawi',
    'Jeremy Hunt': 'Jeremy_Hunt',
    'Keir Starmer': 'Keir_Starmer',
    'Nigel Farage': 'Nigel_Farage',
    'Ed Davey': 'Ed_Davey',
    'Tony Blair': 'Tony_Blair',
    'John Major': 'John_Major',
    'Boris Johnson': 'Boris_Johnson',
    'Jeremy Corbyn': 'Jeremy_Corbyn',
    'Paddy Ashdown': 'Paddy_Ashdown',
    'Alex Salmond': 'Alex_Salmond',
    'David Trimble': 'David_Trimble',
    'Betty Boothroyd': 'Betty_Boothroyd',
    'Nicola Sturgeon': 'Nicola_Sturgeon',
    'Zohran Mamdani': 'Zohran_Mamdani',
    'Andrew Cuomo': 'Andrew_Cuomo',
    'Curtis Sliwa': 'Curtis_Sliwa',
  };
  const PORTRAIT_PALETTE = [
    ['#1d4ed8', '#93c5fd'], ['#b91c1c', '#fca5a5'], ['#047857', '#6ee7b7'],
    ['#6d28d9', '#c4b5fd'], ['#b45309', '#fcd34d'], ['#0f766e', '#5eead4'],
    ['#be123c', '#fda4af'], ['#1e3a8a', '#bfdbfe'], ['#374151', '#d1d5db'],
  ];

  function resolveWikiPortrait(cleanName) {
    if (WIKI_PORTRAIT_CACHE[cleanName] !== undefined) return;
    WIKI_PORTRAIT_CACHE[cleanName] = null;
    const wikiTitle = WIKI_TITLE_OVERRIDES[cleanName] || cleanName.replace(/\s+/g, '_');
    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(wikiTitle))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.thumbnail && d.thumbnail.source) {
          WIKI_PORTRAIT_CACHE[cleanName] = d.thumbnail.source;
          document.querySelectorAll('img[data-leader="' + CSS.escape(cleanName) + '"]').forEach((img) => {
            img.src = d.thumbnail.source;
          });
        }
      })
      .catch(() => {});
  }

  ES.leaderImg = function (str) {
    if (!str) return null;
    const low = String(str).toLowerCase();
    for (let i = 0; i < LEADER_PORTRAITS.length; i++) {
      if (low.includes(LEADER_PORTRAITS[i][0])) return LEADER_PORTRAITS[i][1];
    }
    const clean = String(str).replace(/🃏/g, '').split('/')[0].split('&')[0].split('(')[0].trim();
    if (!clean || clean === 'Various' || clean === 'Unaffiliated' || clean === 'TBD' || clean.length < 3) return null;
    if (WIKI_PORTRAIT_CACHE[clean]) return WIKI_PORTRAIT_CACHE[clean];
    resolveWikiPortrait(clean);
    const words = clean.replace(/[^a-zA-ZÀ-ÿ0-9\s-]/g, '').trim().split(/\s+/);
    const initials = (words[0]?.[0] || 'P') + (words.length > 1 ? words[words.length - 1][0] : '');
    let h = 0;
    for (let i = 0; i < clean.length; i++) h = (h * 31 + clean.charCodeAt(i)) >>> 0;
    const [bg1, bg2] = PORTRAIT_PALETTE[h % PORTRAIT_PALETTE.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="64" height="64" rx="32" fill="url(#g)"/><circle cx="32" cy="24" r="11" fill="${bg2}" opacity="0.32"/><path d="M12,58 C14,42 50,42 52,58" fill="${bg2}" opacity="0.28"/><text x="32" y="37" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="21" fill="#ffffff">${initials.toUpperCase()}</text></svg>`;
    setTimeout(() => {
      document.querySelectorAll('img.leader-avatar, img.leader-avatar-sm').forEach((img) => {
        if (!img.dataset.leader && img.alt) {
          const cName = String(img.alt).replace(/🃏/g, '').split('/')[0].split('&')[0].split('(')[0].trim();
          img.dataset.leader = cName;
          if (WIKI_PORTRAIT_CACHE[cName]) img.src = WIKI_PORTRAIT_CACHE[cName];
        }
      });
    }, 20);
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  const PARTY_SYMBOLS = {
    A: '🌹', SPD: '🌹', PSOE: '🌹', lab: '🌹', MSZP: '🌹', SD: '🌹', ps: '🌹', LEWICA: '🌹',
    Ø: '★', O_RED: '★', LINKE: '★', LEFT: '★', lfi: '★', pcf: '☭', KPRF: '☭', ZYUGANOV: '☭', MSZMP: '☭', SUMAR: '★', PODEMOS: '🟣',
    SF: '🌿', F: '🌿', GRUNE: '🌻', GREENS: '🌻', green: '🌍', GPC: '🌍', eco: '🌻', ALT: '🌱', Å: '🌱', LMP: '🌱', YABLOKO: '🍏', YAVLINSKY: '🍏',
    ld: '🕊️', V: '🛡️', I: '⚡', B: '🧭', M: '🟣', FDP: '⚡', RENEW: '⚡', LPC: '🍁', KO: '🧡',
    con: '🌳', C: '🛡️', CDU: '✚', CSU: '🦁', EPP: '★', PP: '🕊️', lr: '🇫🇷', PIS: '🦅', CPC: '🍁', FIDESZ: '🍊', TISZA: '🌊',
    DEM: '🫏', D: '🫏', GOP: '🐘', R: '🐘',
    SN: '🔱', ZELENSKY: '🔱', PES: '🇪🇺', POROSHENKO: '🇪🇺', BAT: '❤️', TYMOSHENKO: '❤️', OPZZH: '🕊️', HOLOS: '🎸',
    UR: '🐻', PUTIN: '🇷🇺', LDPR: '🦅', ZHIRINOVSKY: '🦅', RODINA: '🚩', NAVALNY: '⚡', SOBYANIN: '🏛️',
    TD: '🍀', KONF: '⚔️', MENTZEN: '⚔️', TRZASKOWSKI: '🇵🇱', NAWROCKI: '🦅',
    O_DPP: '🇩🇰', O: '🇩🇰', AE: '🇩🇰', Æ: '🇩🇰', H: '🛡️',
    ref: '➡️', AFD: '➡️', rn: '🔥', VOX: '🛡️', FDI: '🔥', LIKUD: '🕎',
  };

  ES.partyLogo = function (p, opt = {}) {
    if (!p) return null;
    const color = p.color || '#3b82f6';
    const txtColor = util.textOn ? util.textOn(color) : '#ffffff';
    let label = (p.short || p.shortParty || p.code || (p.name ? p.name.split(' ')[0] : p.id || '')).slice(0, 5);
    const sym = p.logo || PARTY_SYMBOLS[p.id] || PARTY_SYMBOLS[p.short] || PARTY_SYMBOLS[label] || '';
    const isSm = opt.size === 'sm';
    return el('span', {
      class: isSm ? 'party-logo party-logo-sm' : 'party-logo',
      style: {
        background: color,
        '--p-color': color,
        color: txtColor,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
      },
      title: p.name ? `${p.name} (${label})` : label,
      html: sym ? `<span>${sym}</span><span>${label}</span>` : label,
    });
  };

  /* --------------------------------------------------------------------- */
  /* Game Sound Effects (Web Audio API Synthesizer)                         */
  /* --------------------------------------------------------------------- */
  let audioCtx = null;
  const sfx = (ES.sfx = {
    enabled: true,
    _ctx() {
      if (!this.enabled) return null;
      if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return audioCtx;
    },
    click(freq = 520) {
      const ctx = this._ctx();
      if (!ctx) return;
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.045);
        g.gain.setValueAtTime(0.045, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.055);
      } catch (e) {}
    },
    fanfare() {
      const ctx = this._ctx();
      if (!ctx) return;
      [440, 554.37, 659.25].forEach((f, idx) => {
        try {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          const t0 = ctx.currentTime + idx * 0.055;
          o.frequency.setValueAtTime(f, t0);
          g.gain.setValueAtTime(0.05, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(t0);
          o.stop(t0 + 0.25);
        } catch (e) {}
      });
    },
  });

  /* --------------------------------------------------------------------- */
  /* Utilities                                                              */
  /* --------------------------------------------------------------------- */
  const util = (ES.util = {});

  util.rng = function (seed) {
    let a = typeof seed === 'string' ? util.hash(seed) : seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  util.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  util.noise = function (rnd) {
    return (rnd() + rnd() + rnd() - 1.5) / 1.5;
  };
  util.sum = (obj) => Object.values(obj).reduce((a, b) => a + (+b || 0), 0);
  util.normalize = function (obj, total = 100) {
    const s = util.sum(obj);
    const out = {};
    for (const k in obj) out[k] = s > 0 ? ((+obj[k] || 0) / s) * total : 0;
    return out;
  };
  util.clone = (o) => JSON.parse(JSON.stringify(o));
  util.fmt = (n, d = 1) => (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
  util.fmtInt = (n) => Math.round(n).toLocaleString('en-US');
  util.argmax = function (obj) {
    let best = null, bv = -Infinity;
    for (const k in obj) if (obj[k] > bv) { bv = obj[k]; best = k; }
    return best;
  };
  util.ranked = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  util.el = function (tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return e;
  };
  util.textOn = function (hex) {
    const c = (hex || '#888').replace('#', '');
    const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
    const r = parseInt(f.substr(0, 2), 16), g = parseInt(f.substr(2, 2), 16), b = parseInt(f.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff';
  };
  util.shade = function (hex, t) {
    const c = (hex || '#888888').replace('#', '');
    const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
    const base = [0x2a, 0x30, 0x3c];
    const rgb = [0, 2, 4].map((i, j) => Math.round(parseInt(f.substr(i, 2), 16) * t + base[j] * (1 - t)));
    return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  };

  /* --------------------------------------------------------------------- */
  /* Seat allocation methods                                                */
  /* --------------------------------------------------------------------- */
  const methods = (ES.methods = {});

  function highestAverages(votes, seats, divisor, firstDivisor) {
    const res = {};
    const keys = Object.keys(votes).filter((k) => votes[k] > 0);
    keys.forEach((k) => (res[k] = 0));
    for (let s = 0; s < seats; s++) {
      let best = null, bestQ = -1;
      for (const k of keys) {
        const d = res[k] === 0 && firstDivisor ? firstDivisor : divisor(res[k]);
        const q = votes[k] / d;
        if (q > bestQ) { bestQ = q; best = k; }
      }
      if (best === null) break;
      res[best]++;
    }
    return res;
  }
  methods.dhondt = (votes, seats) => highestAverages(votes, seats, (n) => n + 1);
  methods.sainteLague = (votes, seats) => highestAverages(votes, seats, (n) => 2 * n + 1);
  methods.hare = (votes, seats) => methods.largestRemainder(votes, seats, 'hare');
  methods.largestRemainder = function (votes, seats, quota = 'hare') {
    const total = util.sum(votes);
    const res = {};
    if (total <= 0 || seats <= 0) return res;
    const q = quota === 'droop' ? Math.floor(total / (seats + 1)) + 1 : total / seats;
    const rem = [];
    let used = 0;
    for (const k in votes) {
      const exact = votes[k] / q;
      res[k] = Math.floor(exact);
      used += res[k];
      rem.push([k, exact - res[k]]);
    }
    rem.sort((a, b) => b[1] - a[1]);
    for (let i = 0; used < seats && i < rem.length; i++, used++) res[rem[i][0]]++;
    while (used > seats) {
      const k = rem[rem.length - 1][0];
      if (res[k] > 0) { res[k]--; used--; }
      rem.pop();
    }
    return res;
  };
  methods.applyThreshold = function (votes, threshold) {
    const total = util.sum(votes);
    const out = {};
    for (const k in votes) {
      const t = typeof threshold === 'function' ? threshold(k) : threshold;
      if (total > 0 && (votes[k] / total) * 100 >= t) out[k] = votes[k];
    }
    return out;
  };

  /* --------------------------------------------------------------------- */
  /* Political Spectrum & Ideology Database (11 Countries)                  */
  /* --------------------------------------------------------------------- */
  const DEFAULT_IDEOLOGY_DB = {
    hungary: [
      { id: 'MSZMP', short: 'MSZMP', name: "MSZMP (Workers' Party)", leader: 'Gyula Thürmer', era: '1990', pos: 'Far-left', score: 1.0, tags: 'Communism, Marxism-Leninism', bloc: 'Extra-parliamentary', color: '#990000' },
      { id: 'MSZP', short: 'MSZP', name: 'MSZP (Hungarian Socialist Party)', leader: 'Gyula Horn / Péter Medgyessy / Ferenc Gyurcsány', era: '1990–2018', pos: 'Centre-left', score: 3.2, tags: 'Social democracy, Pro-Europeanism', bloc: 'Left-liberal bloc', color: '#e11d48' },
      { id: 'SZDSZ', short: 'SZDSZ', name: 'SZDSZ (Alliance of Free Democrats)', leader: 'János Kis / Iván Pető / Gábor Kuncze', era: '1990–2006', pos: 'Centre', score: 4.8, tags: 'Social liberalism, Economic liberalism', bloc: 'Left-liberal bloc', color: '#38bdf8' },
      { id: 'FIDESZ_1990', short: 'Fidesz (90–94)', name: 'Fidesz (Alliance of Young Democrats)', leader: 'Viktor Orbán', era: '1990–1994', pos: 'Centre', score: 5.0, tags: 'Liberalism, Youth politics, Anti-communism', bloc: 'Early liberal era', color: '#fb923c' },
      { id: 'FIDESZ', short: 'Fidesz–KDNP', name: 'Fidesz – Hungarian Civic Alliance & KDNP', leader: 'Viktor Orbán', era: '1998–2026 Sept', pos: 'Right-wing to Far-right', score: 8.2, tags: 'National conservatism, Right-wing populism, Christian democracy', bloc: 'Governing right bloc', color: '#ff6a00' },
      { id: 'MDF', short: 'MDF', name: 'MDF (Hungarian Democratic Forum)', leader: 'József Antall / Péter Boross / Ibolya Dávid', era: '1990–2010', pos: 'Centre-right', score: 6.5, tags: 'National conservatism, Christian democracy, Liberal conservatism', bloc: 'Conservative bloc', color: '#15803d' },
      { id: 'KDNP', short: 'KDNP', name: "KDNP (Christian Democratic People's Party)", leader: 'László Surján', era: '1990–1994', pos: 'Centre-right to Right-wing', score: 7.2, tags: 'Christian democracy, Social conservatism', bloc: 'Conservative bloc', color: '#ca8a04' },
      { id: 'FKGP', short: 'FKGP', name: "FKGP (Independent Smallholders' Party)", leader: 'József Torgyán', era: '1990–1998', pos: 'Right-wing', score: 7.5, tags: 'Agrarianism, National conservatism, Social conservatism', bloc: 'Conservative bloc', color: '#65a30d' },
      { id: 'MIEP', short: 'MIÉP', name: 'MIÉP (Hungarian Justice and Life Party)', leader: 'István Csurka', era: '1994–2006', pos: 'Far-right', score: 9.5, tags: 'Hungarian ultranationalism, Radical right', bloc: 'Far-right', color: '#78350f' },
      { id: 'LMP', short: 'LMP', name: "LMP – Hungary's Green Party", leader: 'András Schiffer / Bernadett Szél', era: '2010–2018', pos: 'Centre-left', score: 3.8, tags: 'Green politics, Eco-politics, Direct democracy', bloc: 'Green opposition', color: '#4ade80' },
      { id: 'JOBBIK_EARLY', short: 'Jobbik (10–14)', name: 'Jobbik (Movement for a Better Hungary)', leader: 'Gábor Vona', era: '2010–2014', pos: 'Far-right', score: 9.2, tags: 'Hungarian nationalism, Radical right', bloc: 'Far-right era', color: '#4b5563' },
      { id: 'JOBBIK', short: 'Jobbik (2018)', name: "Jobbik (People's Party shift)", leader: 'Gábor Vona', era: '2018', pos: 'Centre-right to Right-wing', score: 7.0, tags: "Conservative people's party, Patriotism", bloc: 'Moderate shift', color: '#1f9d72' },
      { id: 'UNITY', short: 'Összefogás', name: 'Összefogás (MSZP–E14–DK–PM–MLP)', leader: 'Attila Mesterházy', era: '2014', pos: 'Centre-left', score: 3.4, tags: 'Social democracy, Social liberalism, Green politics', bloc: 'Joint opposition', color: '#ef4444' },
      { id: 'DK', short: 'DK', name: 'DK (Democratic Coalition)', leader: 'Ferenc Gyurcsány / Klára Dobrev', era: '2018–2026 Sept', pos: 'Centre-left', score: 3.5, tags: 'Social liberalism, Social democracy, European federalism', bloc: 'Opposition', color: '#2563eb' },
      { id: 'MOMENTUM', short: 'Momentum', name: 'Momentum Movement', leader: 'András Fekete-Győr', era: '2018', pos: 'Centre', score: 5.0, tags: 'Centrism, Liberalism, Pro-Europeanism', bloc: 'Liberal opposition', color: '#a855f7' },
      { id: 'MKKP', short: 'MKKP', name: 'MKKP (Hungarian Two-Tailed Dog Party)', leader: 'Gergely Kovács', era: '2018–2026 Sept', pos: 'Centre / Satirical', score: 4.5, tags: 'Joke party, Political satire, Grassroots anti-corruption', bloc: 'Non-aligned', color: '#9ca3af' },
      { id: 'EM', short: 'Egységben', name: 'Egységben Magyarországért (United Opposition)', leader: 'Péter Márki-Zay', era: '2022', pos: 'Big tent', score: 4.8, tags: 'Anti-Orbán big tent, Pro-Europeanism, Rule of law', bloc: 'United opposition', color: '#0284c7' },
      { id: 'MEMO', short: 'MEMO', name: 'Megoldás Mozgalom (Solution Movement)', leader: 'György Gattyán', era: '2022', pos: 'Centre', score: 5.5, tags: 'Technocracy, Digitalization', bloc: 'Extra-parliamentary', color: '#eab308' },
      { id: 'MIHAZANK', short: 'Mi Hazánk', name: 'Mi Hazánk Mozgalom (Our Homeland Movement)', leader: 'László Toroczkai', era: '2022–2026 Sept', pos: 'Far-right', score: 9.5, tags: 'Hungarian ultranationalism, Hard Euroscepticism', bloc: 'Far-right', color: '#65a30d' },
      { id: 'TISZA', short: 'TISZA', name: 'TISZA (Respect and Freedom Party)', leader: 'Péter Magyar', era: '2026 Apr & Sept', pos: 'Centre-right / Big tent', score: 5.8, tags: 'Civic conservatism, Centrism, Anti-corruption, Pro-Europeanism', bloc: 'Governing party 2026', color: '#00b4d8' },
      { id: 'MNOO', short: 'MNOÖ', name: 'MNOÖ (German Minority List)', leader: 'Imre Ritter', era: '2018–2022', pos: 'Minority / Centre-right', score: 6.0, tags: 'Ethnic German minority representation', bloc: 'Minority seat', color: '#64748b' },
    ],
    budapest: [
      { id: 'karacsony', short: 'Karácsony', name: 'Párbeszéd–Zöldek – DK – MSZP (Mayoral)', leader: 'Gergely Karácsony', era: '2024 Mayoral', pos: 'Centre-left', score: 3.4, tags: 'Green politics, Social democracy, Pro-Europeanism', bloc: 'Mayor', color: '#2eb872' },
      { id: 'vitezy', short: 'Vitézy', name: 'Vitézy Dáviddal Budapestért – LMP (Mayoral)', leader: 'Dávid Vitézy', era: '2024 Mayoral', pos: 'Centre', score: 5.2, tags: 'Urbanism, Technocracy, Green conservatism', bloc: 'Mayoral candidate', color: '#19a7ce' },
      { id: 'grundtner', short: 'Grundtner', name: 'Mi Hazánk Mozgalom (Mayoral)', leader: 'András Grundtner', era: '2024 Mayoral', pos: 'Far-right', score: 9.5, tags: 'Hungarian nationalism, National conservatism', bloc: 'Mayoral candidate', color: '#689f38' },
      { id: 'tisza', short: 'TISZA', name: 'TISZA (Respect & Freedom Party)', leader: 'Péter Magyar', era: '2024 Assembly', pos: 'Centre-right / Big tent', score: 5.8, tags: 'Civic conservatism, Anti-corruption, Pro-Europeanism', bloc: 'Assembly list', color: '#00b4d8' },
      { id: 'fidesz', short: 'FIDESZ', name: 'FIDESZ–KDNP', leader: 'Alexandra Szentkirályi', era: '2024 Assembly', pos: 'Right-wing', score: 8.2, tags: 'National conservatism, Right-wing populism', bloc: 'Assembly list', color: '#ff6a00' },
      { id: 'dk', short: 'DK–MSZP–P', name: 'DK–MSZP–Párbeszéd Alliance', leader: 'Gergely Karácsony', era: '2024 Assembly', pos: 'Centre-left', score: 3.4, tags: 'Social democracy, Green politics, Social liberalism', bloc: 'Assembly list', color: '#2eb872' },
      { id: 'mkkp', short: 'MKKP', name: 'MKKP (Two-Tailed Dog Party)', leader: 'Krisztina Baranyi', era: '2024 Assembly', pos: 'Centre / Satirical', score: 4.5, tags: 'Political satire, Transparency, Grassroots', bloc: 'Assembly list', color: '#9ca3af' },
      { id: 'vitezy_list', short: 'Vitézy–LMP', name: 'Vitézy Dáviddal Budapestért – LMP', leader: 'Dávid Vitézy', era: '2024 Assembly', pos: 'Centre', score: 5.2, tags: 'Urban policy, Technocracy, Green politics', bloc: 'Assembly list', color: '#19a7ce' },
      { id: 'mayor_ind', short: 'Mayor', name: 'Mayor of Budapest (Ex-officio)', leader: 'Gergely Karácsony', era: '2024 Assembly', pos: 'Centre-left', score: 3.4, tags: 'Green politics, Social democracy', bloc: 'Mayor seat', color: '#2eb872' },
    ],
    eu: [
      { id: 'LEFT', short: 'The Left', name: 'The Left in the European Parliament (GUE/NGL)', leader: 'Manon Aubry & Martin Schirdewan', era: '2024 EP', pos: 'Left-wing to Far-left', score: 1.8, tags: 'Democratic socialism, Left-wing populism, Soft Euroscepticism', bloc: 'EP Group', color: '#b71c1c' },
      { id: 'SD', short: 'S&D', name: 'Progressive Alliance of Socialists and Democrats', leader: 'Iratxe García', era: '2024 EP', pos: 'Centre-left', score: 3.3, tags: 'Social democracy, Pro-Europeanism', bloc: 'EP Group', color: '#e53935' },
      { id: 'GREENS', short: 'Greens/EFA', name: 'Greens / European Free Alliance', leader: 'Terry Reintke & Bas Eickhout', era: '2024 EP', pos: 'Centre-left', score: 3.6, tags: 'Green politics, Regionalism, European federalism', bloc: 'EP Group', color: '#43a047' },
      { id: 'RENEW', short: 'Renew', name: 'Renew Europe', leader: 'Valérie Hayer', era: '2024 EP', pos: 'Centre', score: 5.0, tags: 'Liberalism, Social liberalism, Pro-Europeanism', bloc: 'EP Group', color: '#fdd835' },
      { id: 'EPP', short: 'EPP', name: "European People's Party (EPP)", leader: 'Manfred Weber', era: '2024 EP', pos: 'Centre-right', score: 6.4, tags: 'Christian democracy, Liberal conservatism, Pro-Europeanism', bloc: 'EP Group', color: '#2b6cb0' },
      { id: 'ECR', short: 'ECR', name: 'European Conservatives and Reformists (ECR)', leader: 'Nicola Procaccini & Joachim Brudziński', era: '2024 EP', pos: 'Right-wing', score: 7.8, tags: 'National conservatism, Economic liberalism, Soft Euroscepticism', bloc: 'EP Group', color: '#1976d2' },
      { id: 'PFE', short: 'PfE', name: 'Patriots for Europe (PfE)', leader: 'Jordan Bardella', era: '2024 EP', pos: 'Right-wing to Far-right', score: 8.6, tags: 'National conservatism, Right-wing populism, Euroscepticism', bloc: 'EP Group', color: '#1e3a8a' },
      { id: 'ESN', short: 'ESN', name: 'Europe of Sovereign Nations (ESN)', leader: 'René Aust & Stanisław Tyszka', era: '2024 EP', pos: 'Far-right', score: 9.4, tags: 'Ultranationalism, Hard Euroscepticism, Right-wing populism', bloc: 'EP Group', color: '#4a2c2a' },
      { id: 'NI', short: 'NI', name: 'Non-Inscrits (Non-Attached Members)', leader: 'Unaffiliated', era: '2024 EP', pos: 'Non-aligned / Mixed', score: 5.5, tags: 'Various / Unaffiliated national parties', bloc: 'EP Group', color: '#78909c' },
    ],
    germany: [
      { id: 'LINKE', short: 'Linke', name: 'Die Linke (The Left)', leader: 'Jan van Aken & Ines Schwerdtner', era: '2025 Bundestag', pos: 'Left-wing', score: 2.0, tags: 'Democratic socialism, Anti-capitalism', bloc: 'Opposition', color: '#be3075' },
      { id: 'BSW', short: 'BSW', name: 'Bündnis Sahra Wagenknecht (BSW)', leader: 'Sahra Wagenknecht', era: '2025 Bundestag', pos: 'Left-conservative', score: 3.0, tags: 'Left-conservatism, Left-wing populism, Economic nationalism', bloc: 'Non-aligned', color: '#7b2cbf' },
      { id: 'SPD', short: 'SPD', name: 'Social Democratic Party of Germany (SPD)', leader: 'Olaf Scholz / Lars Klingbeil', era: '2025 Bundestag', pos: 'Centre-left', score: 3.6, tags: 'Social democracy, Pro-Europeanism', bloc: 'Centre-left', color: '#e3000f' },
      { id: 'GRUNE', short: 'Grüne', name: 'Alliance 90 / The Greens (Bündnis 90/Die Grünen)', leader: 'Robert Habeck', era: '2025 Bundestag', pos: 'Centre-left', score: 3.8, tags: 'Green politics, Social liberalism, Pro-Europeanism', bloc: 'Centre-left', color: '#46962b' },
      { id: 'SSW', short: 'SSW', name: "South Schleswig Voters' Association (SSW)", leader: 'Stefan Seidler', era: '2025 Bundestag', pos: 'Centre-left / Minority', score: 4.4, tags: 'Danish & Frisian minority interests, Social liberalism', bloc: 'Regional minority', color: '#005ca9' },
      { id: 'FDP', short: 'FDP', name: 'Free Democratic Party (FDP)', leader: 'Christian Lindner', era: '2025 Bundestag', pos: 'Centre to Centre-right', score: 5.8, tags: 'Classical liberalism, Economic liberalism', bloc: 'Liberal', color: '#ffed00' },
      { id: 'FW', short: 'FW', name: 'Free Voters (Freie Wähler)', leader: 'Hubert Aiwanger', era: '2025 Bundestag', pos: 'Centre-right', score: 6.2, tags: 'Liberal conservatism, Regionalism, Localism', bloc: 'Centre-right', color: '#f59e0b' },
      { id: 'CDU', short: 'CDU', name: 'Christian Democratic Union (CDU)', leader: 'Friedrich Merz', era: '2025 Bundestag', pos: 'Centre-right', score: 6.5, tags: 'Christian democracy, Liberal conservatism', bloc: 'Union', color: '#3b4a62' },
      { id: 'CSU', short: 'CSU', name: 'Christian Social Union in Bavaria (CSU)', leader: 'Markus Söder', era: '2025 Bundestag', pos: 'Centre-right', score: 7.0, tags: 'Christian democracy, Bavarian regionalism, Conservatism', bloc: 'Union', color: '#008ac5' },
      { id: 'AFD', short: 'AfD', name: 'Alternative for Germany (AfD)', leader: 'Alice Weidel', era: '2025 Bundestag', pos: 'Far-right', score: 9.2, tags: 'German nationalism, Right-wing populism, Euroscepticism', bloc: 'Far-right', color: '#009ee0' },
    ],
    france: [
      { id: 'melenchon', short: 'LFI (Pres.)', name: 'La France Insoumise (Presidential)', leader: 'Jean-Luc Mélenchon', era: '2027 Presidential', pos: 'Left-wing to Far-left', score: 1.8, tags: 'Democratic socialism, Eco-socialism, Left-wing populism', bloc: 'Left', color: '#cc2443' },
      { id: 'roussel', short: 'PCF (Pres.)', name: 'Parti Communiste Français (Presidential)', leader: 'Fabien Roussel', era: '2027 Presidential', pos: 'Left-wing to Far-left', score: 2.0, tags: 'Communism, Democratic socialism', bloc: 'Left', color: '#dd0000' },
      { id: 'tondelier', short: 'Écologistes (Pres.)', name: 'Les Écologistes – EELV (Presidential)', leader: 'Marine Tondelier', era: '2027 Presidential', pos: 'Centre-left to Left-wing', score: 2.8, tags: 'Green politics, Alter-globalization', bloc: 'Left', color: '#00c000' },
      { id: 'glucksmann', short: 'PS–PP (Pres.)', name: 'Place Publique / Parti Socialiste (Presidential)', leader: 'Raphaël Glucksmann', era: '2027 Presidential', pos: 'Centre-left', score: 3.4, tags: 'Social democracy, European federalism', bloc: 'Left', color: '#ff5588' },
      { id: 'attal', short: 'Renaissance (Pres.)', name: 'Renaissance / Ensemble (Presidential)', leader: 'Gabriel Attal', era: '2027 Presidential', pos: 'Centre', score: 5.0, tags: 'Social liberalism, Centrism, Pro-Europeanism', bloc: 'Centre', color: '#ffca28' },
      { id: 'philippe', short: 'Horizons (Pres.)', name: 'Horizons / Ensemble (Presidential)', leader: 'Édouard Philippe', era: '2027 Presidential', pos: 'Centre-right', score: 5.8, tags: 'Liberal conservatism, Christian democracy', bloc: 'Centre', color: '#38bdf8' },
      { id: 'retailleau', short: 'LR (Pres.)', name: 'Les Républicains (Presidential)', leader: 'Bruno Retailleau', era: '2027 Presidential', pos: 'Right-wing', score: 7.4, tags: 'Gaullism, Liberal conservatism, National conservatism', bloc: 'Right', color: '#0066cc' },
      { id: 'nda', short: 'DLF (Pres.)', name: 'Debout la France (Presidential)', leader: 'Nicolas Dupont-Aignan', era: '2027 Presidential', pos: 'Right-wing to Far-right', score: 8.3, tags: 'Sovereigntism, Social Gaullism, Euroscepticism', bloc: 'Far-right', color: '#4f46e5' },
      { id: 'rn', short: 'RN', name: 'Rassemblement National', leader: 'Jordan Bardella / Marine Le Pen', era: '2027 Pres. & Leg.', pos: 'Far-right', score: 8.9, tags: 'French nationalism, Right-wing populism, Euroscepticism', bloc: 'Far-right', color: '#1e3a8a' },
      { id: 'zemmour', short: 'Reconquête (Pres.)', name: 'Reconquête! (Presidential)', leader: 'Éric Zemmour', era: '2027 Presidential', pos: 'Far-right', score: 9.7, tags: 'Ultranationalism, National conservatism, Identitarianism', bloc: 'Far-right', color: '#312e81' },
      { id: 'lfi', short: 'LFI', name: 'La France Insoumise (Legislative)', leader: 'Jean-Luc Mélenchon / Mathilde Panot', era: '2027 Legislative', pos: 'Left-wing to Far-left', score: 1.8, tags: 'Democratic socialism, Left-wing populism', bloc: 'New Popular Front', color: '#cc2443' },
      { id: 'pcf', short: 'PCF', name: 'Parti Communiste Français (Legislative)', leader: 'Fabien Roussel', era: '2027 Legislative', pos: 'Left-wing to Far-left', score: 2.0, tags: 'Communism, Socialism', bloc: 'New Popular Front', color: '#dd0000' },
      { id: 'eco', short: 'Écologistes', name: 'Les Écologistes – EELV (Legislative)', leader: 'Marine Tondelier', era: '2027 Legislative', pos: 'Centre-left to Left-wing', score: 2.8, tags: 'Green politics, Political ecology', bloc: 'New Popular Front', color: '#22c55e' },
      { id: 'ps', short: 'PS–PP', name: 'Parti Socialiste – Place Publique (Legislative)', leader: 'Olivier Faure / Raphaël Glucksmann', era: '2027 Legislative', pos: 'Centre-left', score: 3.4, tags: 'Social democracy, Pro-Europeanism', bloc: 'New Popular Front', color: '#f43f5e' },
      { id: 'ren', short: 'Renaissance', name: 'Renaissance (Legislative)', leader: 'Gabriel Attal', era: '2027 Legislative', pos: 'Centre', score: 5.0, tags: 'Liberalism, Centrism, Pro-Europeanism', bloc: 'Ensemble', color: '#facc15' },
      { id: 'modem', short: 'MoDem', name: 'Mouvement Démocrate (Legislative)', leader: 'François Bayrou', era: '2027 Legislative', pos: 'Centre', score: 5.2, tags: 'Centrism, Christian democracy, Pro-Europeanism', bloc: 'Ensemble', color: '#fb923c' },
      { id: 'hor', short: 'Horizons', name: 'Horizons (Legislative)', leader: 'Édouard Philippe', era: '2027 Legislative', pos: 'Centre-right', score: 5.8, tags: 'Liberal conservatism', bloc: 'Ensemble', color: '#38bdf8' },
      { id: 'div', short: 'LIOT / Rég.', name: 'LIOT / Regionalists / Miscellaneous', leader: 'Laurent Panifous / Régionalistes', era: '2027 Legislative', pos: 'Centre / Regionalist', score: 5.0, tags: 'Regionalism, Centrism, Localism', bloc: 'Others', color: '#94a3b8' },
      { id: 'lr', short: 'LR', name: 'Les Républicains (Legislative)', leader: 'Bruno Retailleau', era: '2027 Legislative', pos: 'Centre-right to Right-wing', score: 7.3, tags: 'Gaullism, Conservatism', bloc: 'Right', color: '#2563eb' },
      { id: 'udr', short: 'UDR', name: 'Union des Droites pour la République', leader: 'Éric Ciotti', era: '2027 Legislative', pos: 'Right-wing to Far-right', score: 8.4, tags: 'National conservatism, Right-wing alliance', bloc: 'RN-UDR Alliance', color: '#1d4ed8' },
      { id: 'rec', short: 'Reconquête', name: 'Reconquête! (Legislative)', leader: 'Éric Zemmour', era: '2027 Legislative', pos: 'Far-right', score: 9.7, tags: 'Ultranationalism, National conservatism', bloc: 'Far-right', color: '#4c1d95' },
    ],
    uk: [
      { id: 'green', short: 'Grn', name: 'Green Party of England and Wales', leader: 'Carla Denyer & Adrian Ramsay', era: '2024 Parliamentary', pos: 'Left-wing', score: 2.5, tags: 'Green politics, Eco-socialism, Progressivism', bloc: 'GB', color: '#02a95b' },
      { id: 'lab', short: 'Lab', name: 'Labour Party', leader: 'Keir Starmer', era: '2024 Parliamentary', pos: 'Centre-left', score: 3.7, tags: 'Social democracy, Third Way', bloc: 'GB', color: '#e4003b' },
      { id: 'snp', short: 'SNP', name: 'Scottish National Party', leader: 'John Swinney', era: '2024 Parliamentary', pos: 'Centre-left', score: 3.5, tags: 'Scottish independence, Social democracy', bloc: 'Scotland', color: '#fdf38e' },
      { id: 'pc', short: 'PC', name: 'Plaid Cymru', leader: 'Rhun ap Iorwerth', era: '2024 Parliamentary', pos: 'Centre-left', score: 3.4, tags: 'Welsh nationalism, Democratic socialism, Social democracy', bloc: 'Wales', color: '#008142' },
      { id: 'ld', short: 'LD', name: 'Liberal Democrats', leader: 'Ed Davey', era: '2024 Parliamentary', pos: 'Centre', score: 4.6, tags: 'Social liberalism, Liberalism, Pro-Europeanism', bloc: 'GB', color: '#faa61a' },
      { id: 'con', short: 'Con', name: 'Conservative and Unionist Party', leader: 'Rishi Sunak / Kemi Badenoch', era: '2024 Parliamentary', pos: 'Centre-right to Right-wing', score: 7.0, tags: 'Conservatism, Economic liberalism, British unionism', bloc: 'GB', color: '#0087dc' },
      { id: 'ref', short: 'Ref', name: 'Reform UK', leader: 'Nigel Farage', era: '2024 Parliamentary', pos: 'Right-wing to Far-right', score: 8.6, tags: 'Right-wing populism, National conservatism, Euroscepticism', bloc: 'GB', color: '#12b6cf' },
      { id: 'sf', short: 'SF', name: 'Sinn Féin', leader: 'Mary Lou McDonald / Michelle O\'Neill', era: '2024 Parliamentary', pos: 'Left-wing', score: 2.4, tags: 'Irish republicanism, Democratic socialism', bloc: 'Northern Ireland', color: '#326760' },
      { id: 'sdlp', short: 'SDLP', name: 'Social Democratic and Labour Party', leader: 'Colum Eastwood', era: '2024 Parliamentary', pos: 'Centre-left', score: 3.6, tags: 'Social democracy, Irish nationalism', bloc: 'Northern Ireland', color: '#2aa82c' },
      { id: 'apni', short: 'All', name: 'Alliance Party of Northern Ireland', leader: 'Naomi Long', era: '2024 Parliamentary', pos: 'Centre', score: 4.8, tags: 'Liberalism, Non-sectarianism', bloc: 'Northern Ireland', color: '#f6cb2f' },
      { id: 'uup', short: 'UUP', name: 'Ulster Unionist Party', leader: 'Mike Nesbitt', era: '2024 Parliamentary', pos: 'Centre-right', score: 6.6, tags: 'Ulster unionism, Conservatism', bloc: 'Northern Ireland', color: '#48a5ee' },
      { id: 'dup', short: 'DUP', name: 'Democratic Unionist Party', leader: 'Gavin Robinson', era: '2024 Parliamentary', pos: 'Right-wing', score: 7.8, tags: 'Ulster loyalism, British unionism, Social conservatism', bloc: 'Northern Ireland', color: '#d46a4c' },
      { id: 'tuv', short: 'TUV', name: 'Traditional Unionist Voice', leader: 'Jim Allister', era: '2024 Parliamentary', pos: 'Right-wing to Far-right', score: 8.7, tags: 'Hardline Ulster unionism, Social conservatism', bloc: 'Northern Ireland', color: '#0c3a6a' },
      { id: 'other', short: 'Ind/Oth', name: 'Independent / Other', leader: 'Various', era: '2024 Parliamentary', pos: 'Various', score: 5.0, tags: 'Independent / Localism', bloc: 'UK', color: '#8892a6' },
      { id: 'speaker', short: 'Spk', name: 'Speaker of the House of Commons', leader: 'Lindsay Hoyle', era: '2024 Parliamentary', pos: 'Non-partisan', score: 5.0, tags: 'Parliamentary impartiality', bloc: 'Chorley', color: '#d4af37' },
    ],
    usa: [
      { id: 'DEM', short: 'Democrats', name: 'Democratic Party', leader: 'Gavin Newsom / Kamala Harris', era: '2028 Presidential', pos: 'Centre-left', score: 3.8, tags: 'Modern American liberalism, Social liberalism, Progressivism', bloc: 'Blue States', color: '#2e6fd8' },
      { id: 'GOP', short: 'Republicans', name: 'Republican Party (GOP)', leader: 'J.D. Vance / Marco Rubio', era: '2028 Presidential', pos: 'Right-wing', score: 7.8, tags: 'American conservatism, National conservatism, Right-wing populism', bloc: 'Red States', color: '#d8343b' },
    ],
    israel: [
      { id: 'HADASH', short: "Hadash–Ta'al", name: "Hadash–Ta'al (Joint List)", leader: 'Ayman Odeh & Ahmad Tibi', era: '2026 Knesset', pos: 'Left-wing', score: 1.8, tags: 'Arab-Jewish socialism, Two-state solution, Secularism', bloc: 'Arab bloc', color: '#dc2626' },
      { id: 'BALAD', short: 'Balad', name: 'Balad (National Democratic Assembly)', leader: 'Sami Abu Shehadeh', era: '2026 Knesset', pos: 'Left-wing', score: 2.2, tags: 'Arab nationalism, Left-wing nationalism, State of all its citizens', bloc: 'Arab bloc', color: '#991b1b' },
      { id: 'RAAM', short: "Ra'am", name: "United Arab List (Ra'am)", leader: 'Mansour Abbas', era: '2026 Knesset', pos: 'Centre / Social conservative', score: 4.5, tags: 'Arab Israeli interests, Islamic democracy, Social conservatism', bloc: 'Arab / Swing', color: '#16a34a' },
      { id: 'DEM', short: 'The Democrats', name: 'The Democrats (Labor–Meretz Union)', leader: 'Yair Golan', era: '2026 Knesset', pos: 'Centre-left to Left-wing', score: 3.0, tags: 'Social democracy, Labor Zionism, Liberal Zionism', bloc: 'Opposition bloc', color: '#e11d48' },
      { id: 'YA', short: 'Yesh Atid', name: 'Yesh Atid', leader: 'Yair Lapid', era: '2026 Knesset', pos: 'Centre', score: 4.8, tags: 'Liberal Zionism, Secularism, Centrism', bloc: 'Opposition bloc', color: '#f97316' },
      { id: 'YASHAR', short: 'Yashar! (Eisenkot)', name: 'Yashar! with Eisenkot (Straight!)', leader: 'Gadi Eisenkot', era: '2026 Knesset', pos: 'Centre', score: 5.1, tags: 'Centrism, National security, Institutionalism, Liberal Zionism', bloc: 'Opposition bloc', color: '#06b6d4' },
      { id: 'NU', short: 'Blue & White', name: 'National Unity (Blue and White)', leader: 'Benny Gantz', era: '2026 Knesset', pos: 'Centre to Centre-right', score: 5.5, tags: 'Statism (Mamlachtiyut), Liberal conservatism, Pragmatism', bloc: 'Opposition bloc', color: '#38bdf8' },
      { id: 'BENNETT', short: "Bennett (B'Yachad)", name: "Bennett 2026 / B'Yachad", leader: 'Naftali Bennett', era: '2026 Knesset', pos: 'Right-wing', score: 7.2, tags: 'National conservatism, Economic liberalism, Religious-secular bridge', bloc: 'Opposition bloc', color: '#059669' },
      { id: 'YB', short: 'Yisrael Beiteinu', name: 'Yisrael Beiteinu', leader: 'Avigdor Lieberman', era: '2026 Knesset', pos: 'Right-wing', score: 7.4, tags: 'Secular nationalism, Revisionist Zionism', bloc: 'Opposition bloc', color: '#0284c7' },
      { id: 'LIKUD', short: 'Likud', name: 'Likud – National Liberal Movement', leader: 'Benjamin Netanyahu', era: '2026 Knesset', pos: 'Right-wing', score: 7.6, tags: 'National conservatism, Revisionist Zionism, Right-wing populism', bloc: 'Netanyahu bloc', color: '#1d4ed8' },
      { id: 'SHAS', short: 'Shas', name: 'Shas (Sephardic Shomrei Torah)', leader: 'Aryeh Deri', era: '2026 Knesset', pos: 'Right-wing (Religious)', score: 7.8, tags: 'Sephardic Haredi interests, Religious conservatism, Welfare', bloc: 'Netanyahu bloc', color: '#d97706' },
      { id: 'UTJ', short: 'UTJ', name: 'United Torah Judaism', leader: 'Yitzhak Goldknopf & Moshe Gafni', era: '2026 Knesset', pos: 'Right-wing (Religious)', score: 8.0, tags: 'Ashkenazi Haredi interests, Halakhic conservatism', bloc: 'Netanyahu bloc', color: '#475569' },
      { id: 'RZ', short: 'Religious Zionism', name: 'Religious Zionism (Mafdal – Tkuma)', leader: 'Bezalel Smotrich', era: '2026 Knesset', pos: 'Far-right', score: 9.1, tags: 'Religious Zionism, Hardline settlement expansion, Social conservatism', bloc: 'Netanyahu bloc', color: '#7c3aed' },
      { id: 'OY', short: 'Otzma Yehudit', name: 'Otzma Yehudit (Jewish Power)', leader: 'Itamar Ben-Gvir', era: '2026 Knesset', pos: 'Far-right', score: 9.6, tags: 'Ultranationalism, Kahanism-inspired religious nationalism', bloc: 'Netanyahu bloc', color: '#b91c1c' },
    ],
    canada: [
      { id: 'NDP', short: 'NDP', name: 'New Democratic Party (NDP)', leader: 'Jagmeet Singh', era: '2025 Federal', pos: 'Centre-left to Left-wing', score: 2.8, tags: 'Social democracy, Democratic socialism', bloc: 'Progressive', color: '#f58220' },
      { id: 'GPC', short: 'Green', name: 'Green Party of Canada', leader: 'Elizabeth May & Jonathan Pedneault', era: '2025 Federal', pos: 'Centre-left', score: 3.4, tags: 'Green politics, Environmentalism', bloc: 'Green', color: '#3d9b35' },
      { id: 'BQ', short: 'Bloc', name: 'Bloc Québécois', leader: 'Yves-François Blanchet', era: '2025 Federal', pos: 'Centre-left', score: 3.6, tags: 'Quebec nationalism, Quebec sovereignty, Social democracy', bloc: 'Quebec regional', color: '#00a7e1' },
      { id: 'LPC', short: 'Liberal', name: 'Liberal Party of Canada', leader: 'Mark Carney', era: '2025 Federal', pos: 'Centre to Centre-left', score: 4.5, tags: 'Liberalism, Social liberalism, Centrism', bloc: 'Liberal', color: '#d71920' },
      { id: 'CPC', short: 'Conservative', name: 'Conservative Party of Canada', leader: 'Pierre Poilievre', era: '2025 Federal', pos: 'Centre-right to Right-wing', score: 7.2, tags: 'Conservatism, Fiscal conservatism, Right-wing populism', bloc: 'Conservative', color: '#1a4782' },
      { id: 'PPC', short: 'PPC', name: "People's Party of Canada", leader: 'Maxime Bernier', era: '2025 Federal', pos: 'Right-wing to Far-right', score: 8.8, tags: 'Right-wing populism, Libertarian conservatism', bloc: 'Right', color: '#6f2da8' },
    ],
    italy: [
      { id: 'AVS', short: 'AVS', name: 'Alleanza Verdi e Sinistra', leader: 'Angelo Bonelli & Nicola Fratoianni', era: '2022 General', pos: 'Left-wing', score: 2.3, tags: 'Eco-socialism, Green politics, Democratic socialism', bloc: 'Centre-left coalition', color: '#16a34a' },
      { id: 'M5S', short: 'M5S', name: 'Movimento 5 Stelle', leader: 'Giuseppe Conte', era: '2022 General', pos: 'Centre-left / Populist', score: 3.3, tags: 'Left-wing populism, Environmentalism, Social welfare', bloc: 'Unaligned', color: '#f59e0b' },
      { id: 'PD', short: 'PD', name: 'Partito Democratico', leader: 'Enrico Letta', era: '2022 General', pos: 'Centre-left', score: 3.6, tags: 'Social democracy, Christian left, Pro-Europeanism', bloc: 'Centre-left coalition', color: '#e11d48' },
      { id: 'PE', short: '+Europa', name: '+Europa (More Europe)', leader: 'Emma Bonino', era: '2022 General', pos: 'Centre', score: 4.6, tags: 'Social liberalism, European federalism, Civil rights', bloc: 'Centre-left coalition', color: '#eab308' },
      { id: 'SVP', short: 'SVP / Reg.', name: 'Südtiroler Volkspartei & Regional Minorities', leader: 'Philipp Achammer / Cateno De Luca', era: '2022 General', pos: 'Centre / Regionalist', score: 5.2, tags: 'Regionalism, Autonomy, Christian democracy', bloc: 'Regional', color: '#64748b' },
      { id: 'AZIV', short: 'Az–IV', name: 'Azione – Italia Viva (Terzo Polo)', leader: 'Carlo Calenda & Matteo Renzi', era: '2022 General', pos: 'Centre', score: 5.3, tags: 'Liberalism, Social liberalism, Reformism, Pro-Europeanism', bloc: 'Third Pole', color: '#db2777' },
      { id: 'NM', short: 'Noi Mod.', name: 'Noi Moderati', leader: 'Maurizio Lupi', era: '2022 General', pos: 'Centre-right', score: 6.3, tags: 'Christian democracy, Liberal conservatism', bloc: 'Centre-right coalition', color: '#38bdf8' },
      { id: 'FI', short: 'Forza Italia', name: 'Forza Italia', leader: 'Silvio Berlusconi', era: '2022 General', pos: 'Centre-right', score: 6.7, tags: 'Liberal conservatism, Christian democracy', bloc: 'Centre-right coalition', color: '#0087dc' },
      { id: 'LEGA', short: 'Lega', name: 'Lega per Salvini Premier', leader: 'Matteo Salvini', era: '2022 General', pos: 'Right-wing to Far-right', score: 8.4, tags: 'Right-wing populism, Regionalism, National conservatism', bloc: 'Centre-right coalition', color: '#008055' },
      { id: 'FDI', short: 'FdI', name: "Fratelli d'Italia (Brothers of Italy)", leader: 'Giorgia Meloni', era: '2022 General', pos: 'Right-wing to Far-right', score: 8.6, tags: 'National conservatism, Right-wing populism', bloc: 'Centre-right coalition', color: '#0b3b6a' },
    ],
    spain: [
      { id: 'PODEMOS', short: 'Podemos', name: 'Podemos', leader: 'Ione Belarra / Irene Montero', era: '2023–2026 Congreso', pos: 'Left-wing to Far-left', score: 1.9, tags: 'Left-wing populism, Democratic socialism, Feminism', bloc: 'Left bloc', color: '#7e22ce' },
      { id: 'BILDU', short: 'EH Bildu', name: 'Euskal Herria Bildu', leader: 'Arnaldo Otegi / Mertxe Aizpurua', era: '2023–2026 Congreso', pos: 'Left-wing', score: 2.1, tags: 'Basque nationalism, Basque independence, Democratic socialism', bloc: 'Regional Left', color: '#00b48d' },
      { id: 'ERC', short: 'ERC', name: 'Esquerra Republicana de Catalunya', leader: 'Oriol Junqueras / Gabriel Rufián', era: '2023–2026 Congreso', pos: 'Left-wing', score: 2.4, tags: 'Catalan independence, Catalan republicanism, Social democracy', bloc: 'Regional Left', color: '#ffb232' },
      { id: 'SUMAR', short: 'Sumar', name: 'Movimiento Sumar & Allies', leader: 'Yolanda Díaz', era: '2023–2026 Congreso', pos: 'Left-wing', score: 2.5, tags: 'Democratic socialism, Green politics, Progressivism, Labor rights', bloc: 'Left bloc', color: '#e51c55' },
      { id: 'BNG', short: 'BNG', name: 'Bloque Nacionalista Galego', leader: 'Ana Pontón / Néstor Rego', era: '2023–2026 Congreso', pos: 'Left-wing', score: 2.6, tags: 'Galician nationalism, Socialism, Euroscepticism', bloc: 'Regional Left', color: '#38bdf8' },
      { id: 'PSOE', short: 'PSOE', name: 'Partido Socialista Obrero Español (PSOE)', leader: 'Pedro Sánchez', era: '2023–2026 Congreso', pos: 'Centre-left', score: 3.6, tags: 'Social democracy, Pro-Europeanism, Federalism', bloc: 'Left bloc', color: '#ef1c27' },
      { id: 'PNV', short: 'EAJ-PNV', name: 'Partido Nacionalista Vasco (EAJ-PNV)', leader: 'Aitor Esteban / Andoni Ortuzar', era: '2023–2026 Congreso', pos: 'Centre to Centre-right', score: 5.8, tags: 'Basque nationalism, Christian democracy, Liberalism', bloc: 'Regional Centre', color: '#16a34a' },
      { id: 'CC', short: 'CC / Reg.', name: 'Coalición Canaria & Regionalists (UPN)', leader: 'Fernando Clavijo / Cristina Valido', era: '2023–2026 Congreso', pos: 'Centre to Centre-right', score: 5.9, tags: 'Canary regionalism, Centrism, Autonomy', bloc: 'Regional Centre', color: '#eab308' },
      { id: 'JUNTS', short: 'Junts', name: 'Junts per Catalunya', leader: 'Carles Puigdemont / Míriam Nogueras', era: '2023–2026 Congreso', pos: 'Centre-right', score: 6.3, tags: 'Catalan independence, Liberal conservatism', bloc: 'Regional Right', color: '#00c3b2' },
      { id: 'PP', short: 'PP', name: "Partido Popular (People's Party)", leader: 'Alberto Núñez Feijóo', era: '2023–2026 Congreso', pos: 'Centre-right to Right-wing', score: 7.1, tags: 'Conservatism, Christian democracy, Economic liberalism, Spanish unionism', bloc: 'Right bloc', color: '#0056a3' },
      { id: 'VOX', short: 'Vox', name: 'Vox', leader: 'Santiago Abascal', era: '2023–2026 Congreso', pos: 'Right-wing to Far-right', score: 8.9, tags: 'Spanish ultranationalism, National conservatism, Right-wing populism', bloc: 'Right bloc', color: '#63be21' },
      { id: 'SALF', short: 'SALF', name: 'Se Acabó la Fiesta (SALF)', leader: 'Alvise Pérez', era: '2026 Polls', pos: 'Far-right', score: 9.2, tags: 'Anti-establishment populism, Anti-corruption, Right-wing populism', bloc: 'Right bloc', color: '#78350f' },
    ],
    denmark: [
      { id: 'O_RED', short: 'Ø (Enhedslisten)', name: 'Red–Green Alliance (Enhedslisten)', leader: 'Pelle Dragsted', era: '2026 Folketing', pos: 'Left-wing to Far-left', score: 1.8, tags: 'Eco-socialism, Democratic socialism, Anti-capitalism', bloc: 'Red bloc', color: '#e11d48' },
      { id: 'ALT', short: 'Å (Alternativet)', name: 'The Alternative (Alternativet)', leader: 'Franciska Rosenkilde', era: '2026 Folketing', pos: 'Left-wing', score: 2.5, tags: 'Green politics, Degrowth, Progressivism', bloc: 'Red bloc', color: '#16a34a' },
      { id: 'SF', short: 'F (Green Left)', name: 'Green Left (Socialistisk Folkeparti)', leader: 'Pia Olsen Dyhr', era: '2026 Folketing', pos: 'Left-wing', score: 2.8, tags: 'Green socialism, Popular socialism, Pro-Europeanism', bloc: 'Red bloc (Gov 2026)', color: '#ec4899' },
      { id: 'A', short: 'A (Soc. Dem.)', name: 'Social Democrats (Socialdemokratiet)', leader: 'Mette Frederiksen', era: '2026 Folketing', pos: 'Centre-left', score: 3.7, tags: 'Social democracy, Welfare state, Strict immigration policy', bloc: 'Red bloc (Gov 2026)', color: '#c8102e' },
      { id: 'B', short: 'B (Radikale)', name: 'Social Liberal Party (Radikale Venstre)', leader: 'Martin Lidegaard', era: '2026 Folketing', pos: 'Centre', score: 4.7, tags: 'Social liberalism, Green liberalism, Pro-Europeanism', bloc: 'Centre (Gov 2026)', color: '#7c3aed' },
      { id: 'M', short: 'M (Moderaterne)', name: 'Moderates (Moderaterne)', leader: 'Lars Løkke Rasmussen', era: '2026 Folketing', pos: 'Centre', score: 5.4, tags: 'Centrism, Pragmatism, Reformism', bloc: 'Centre (Gov 2026)', color: '#8b5cf6' },
      { id: 'V', short: 'V (Venstre)', name: "Venstre, Denmark's Liberal Party", leader: 'Troels Lund Poulsen', era: '2026 Folketing', pos: 'Centre-right', score: 6.7, tags: 'Conservative liberalism, Agrarianism, Economic liberalism', bloc: 'Blue bloc', color: '#0284c7' },
      { id: 'C', short: 'C (Konservative)', name: "Conservative People's Party", leader: 'Mona Juul', era: '2026 Folketing', pos: 'Centre-right', score: 7.0, tags: 'Liberal conservatism, Green conservatism', bloc: 'Blue bloc', color: '#15803d' },
      { id: 'I', short: 'I (Liberal Alliance)', name: 'Liberal Alliance', leader: 'Alex Vanopslagh', era: '2026 Folketing', pos: 'Right-wing', score: 7.7, tags: 'Classical liberalism, Libertarianism, Free market', bloc: 'Blue bloc', color: '#06b6d4' },
      { id: 'AE', short: 'Æ (Danmarksdem.)', name: 'Denmark Democrats (Danmarksdemokraterne)', leader: 'Inger Støjberg', era: '2026 Folketing', pos: 'Right-wing', score: 8.2, tags: 'Right-wing populism, Rural interests, Decentralized Denmark', bloc: 'Blue bloc', color: '#1e40af' },
      { id: 'O_DPP', short: 'O (Dansk Folkeparti)', name: "Danish People's Party", leader: 'Morten Messerschmidt', era: '2026 Folketing', pos: 'Right-wing to Far-right', score: 8.7, tags: 'Danish nationalism, National conservatism, Hard Euroscepticism', bloc: 'Blue bloc', color: '#eab308' },
      { id: 'H', short: 'H (Borgernes Parti)', name: "Citizens' Party (Borgernes Parti)", leader: 'Lars Boje Mathiesen', era: '2026 Folketing', pos: 'Far-right', score: 9.2, tags: 'Right-wing populism, Anti-establishment', bloc: 'Blue bloc', color: '#475569' },
    ],
    poland: [
      { id: 'LEWICA', short: 'Lewica', name: 'The Left (Nowa Lewica & Razem)', leader: 'Włodzimierz Czarzasty / Magdalena Biejat / Adrian Zandberg', era: '2023–2025', pos: 'Centre-left to Left-wing', score: 2.7, tags: 'Social democracy, Progressivism, Secularism', bloc: 'Oct 15 Coalition', color: '#be123c' },
      { id: 'KO', short: 'KO', name: 'Civic Coalition (Koalicja Obywatelska)', leader: 'Donald Tusk / Rafał Trzaskowski', era: '2023–2025', pos: 'Centre to Centre-right', score: 5.1, tags: 'Liberalism, Pro-Europeanism, Christian democracy', bloc: 'Oct 15 Coalition', color: '#f97316' },
      { id: 'TD', short: 'Trzecia Droga', name: 'Third Way (Polska 2050 – PSL)', leader: 'Szymon Hołownia & Władysław Kosiniak-Kamysz', era: '2023–2025', pos: 'Centre to Centre-right', score: 5.9, tags: 'Christian democracy, Centrism, Agrarianism', bloc: 'Oct 15 Coalition', color: '#16a34a' },
      { id: 'PIS', short: 'PiS', name: 'Law and Justice (Prawo i Sprawiedliwość)', leader: 'Jarosław Kaczyński / Karol Nawrocki', era: '2023–2025', pos: 'Right-wing', score: 8.1, tags: 'National conservatism, Christian right, Welfare statism', bloc: 'United Right', color: '#1e3a8a' },
      { id: 'KONF', short: 'Konfederacja', name: 'Confederation Liberty and Independence', leader: 'Sławomir Mentzen & Krzysztof Bosak', era: '2023–2025', pos: 'Far-right', score: 9.3, tags: 'Right-wing libertarianism, Polish nationalism, Hard Euroscepticism', bloc: 'Far-right', color: '#1e293b' },
    ],
    ukraine: [
      { id: 'OPZZH', short: 'OPZZH', name: 'Opposition Platform — For Life', leader: 'Yuriy Boyko', era: '2019', pos: 'Syncretic / Regionalist', score: 4.2, tags: 'Social conservatism, Regionalism', bloc: 'Opposition', color: '#1d4ed8' },
      { id: 'BAT', short: 'Batkivshchyna', name: 'All-Ukrainian Union "Fatherland"', leader: 'Yulia Tymoshenko', era: '2019', pos: 'Centre-left / Populist', score: 4.5, tags: 'Social populism, Pro-Europeanism, Christian democracy', bloc: 'Opposition', color: '#dc2626' },
      { id: 'SN', short: 'Sluha Narodu', name: 'Servant of the People', leader: 'Volodymyr Zelensky', era: '2019', pos: 'Centre', score: 5.0, tags: 'Centrism, Anti-corruption, Digitalization, Pro-Europeanism', bloc: 'Governing Majority', color: '#16a34a' },
      { id: 'HOLOS', short: 'Holos', name: 'Holos (Voice)', leader: 'Sviatoslav Vakarchuk', era: '2019', pos: 'Centre to Centre-right', score: 5.5, tags: 'Liberalism, Pro-Europeanism, Anti-oligarchy', bloc: 'Pro-European', color: '#f97316' },
      { id: 'PES', short: 'Euro. Solidarity', name: 'European Solidarity', leader: 'Petro Poroshenko', era: '2019', pos: 'Centre-right', score: 6.8, tags: 'Liberal conservatism, Civic nationalism, NATO/EU integration', bloc: 'Pro-European', color: '#7c2d12' },
    ],
    russia: [
      { id: 'KPRF', short: 'KPRF', name: 'Communist Party of the Russian Federation', leader: 'Gennady Zyuganov', era: '2000–2013', pos: 'Far-left (Socially conservative)', score: 1.6, tags: 'Communism, Marxism-Leninism, Soviet patriotism', bloc: 'Systemic opposition', color: '#dc2626' },
      { id: 'YABLOKO', short: 'Yabloko', name: 'Russian United Democratic Party "Yabloko"', leader: 'Grigory Yavlinsky', era: '2000–2013', pos: 'Centre-left to Centre', score: 4.2, tags: 'Social liberalism, Pro-Europeanism, Civil rights', bloc: 'Liberal opposition', color: '#16a34a' },
      { id: 'NAVALNY', short: 'Navalny (RPR)', name: 'Alexei Navalny (RPR-PARNAS)', leader: 'Alexei Navalny', era: '2013 Moscow', pos: 'Centre / Anti-corruption', score: 5.2, tags: 'Anti-corruption, Democratic reform, Civic nationalism', bloc: 'Non-systemic opposition', color: '#2563eb' },
      { id: 'SPS', short: 'SPS', name: 'Union of Right Forces', leader: 'Boris Nemtsov', era: '2000–2003', pos: 'Centre-right', score: 6.4, tags: 'Economic liberalism, Free-market reform', bloc: 'Liberal opposition', color: '#0284c7' },
      { id: 'UR', short: 'United Russia', name: 'United Russia / Vladimir Putin / Sergey Sobyanin', leader: 'Vladimir Putin', era: '2000–2013', pos: 'Big tent / Statist', score: 7.4, tags: 'Russian statism, National conservatism', bloc: 'Ruling bloc', color: '#1e40af' },
      { id: 'RODINA', short: 'Rodina', name: 'Motherland — National Patriotic Union', leader: 'Dmitry Rogozin', era: '2003 Duma', pos: 'Left-wing nationalism', score: 8.0, tags: 'Russian nationalism, Welfare statism', bloc: 'Nationalist', color: '#b45309' },
      { id: 'LDPR', short: 'LDPR', name: 'Liberal Democratic Party of Russia', leader: 'Vladimir Zhirinovsky', era: '2000–2013', pos: 'Far-right', score: 9.4, tags: 'Russian ultranationalism, Right-wing populism', bloc: 'Systemic opposition', color: '#eab308' },
    ],
  };

  function loadIdeologyDB() {
    const db = util.clone(DEFAULT_IDEOLOGY_DB);
    try {
      const raw = localStorage.getItem('es_ideology_overrides_v1');
      if (raw) {
        const ov = JSON.parse(raw);
        for (const cid in ov) {
          if (!db[cid]) continue;
          ov[cid].forEach((u) => {
            const target = db[cid].find((x) => x.id === u.id);
            if (target) {
              if (u.pos) target.pos = u.pos;
              if (u.score !== undefined) target.score = Math.max(1, Math.min(10, +u.score || 5));
              if (u.tags !== undefined) target.tags = u.tags;
            }
          });
        }
      }
    } catch (e) {}
    return db;
  }

  ES.IDEOLOGY_DB = loadIdeologyDB();
  ES.saveIdeologyOverrides = function () {
    try {
      const ov = {};
      for (const cid in ES.IDEOLOGY_DB) {
        ov[cid] = ES.IDEOLOGY_DB[cid].map((x) => ({ id: x.id, pos: x.pos, score: x.score, tags: x.tags }));
      }
      localStorage.setItem('es_ideology_overrides_v1', JSON.stringify(ov));
    } catch (e) {}
  };
  ES.resetIdeologyOverrides = function () {
    try { localStorage.removeItem('es_ideology_overrides_v1'); } catch (e) {}
    ES.IDEOLOGY_DB = util.clone(DEFAULT_IDEOLOGY_DB);
  };

  ES.getActiveHungaryEra = function () {
    const activeBtn = document.querySelector('.hu-year-btn.active');
    if (!activeBtn) return '2026';
    return activeBtn.textContent.trim();
  };

  ES.getIdeology = function (partyOrId, countryId) {
    if (!partyOrId) return null;
    const cid = countryId || ES.activeCountryId || location.hash.slice(1) || 'hungary';
    const list = ES.IDEOLOGY_DB[cid] || [];
    const rawId = typeof partyOrId === 'string' ? partyOrId : partyOrId.id;
    const nameStr = typeof partyOrId === 'object' ? (partyOrId.name || partyOrId.short || '') : '';

    // Hungary historical shift handling (Fidesz 1990-1994 vs 1998+, Jobbik 2010-2014 vs 2018)
    if (cid === 'hungary' && rawId) {
      const yr = ES.getActiveHungaryEra();
      if (rawId === 'FIDESZ' && (yr.startsWith('1990') || yr.startsWith('1994'))) {
        const early = list.find((x) => x.id === 'FIDESZ_1990');
        if (early) return early;
      }
      if (rawId === 'JOBBIK' && (yr.startsWith('2010') || yr.startsWith('2014'))) {
        const earlyJ = list.find((x) => x.id === 'JOBBIK_EARLY');
        if (earlyJ) return earlyJ;
      }
    }

    if (rawId) {
      const exact = list.find((x) => x.id === rawId || x.id.toLowerCase() === String(rawId).toLowerCase());
      if (exact) return exact;
    }
    if (nameStr) {
      const low = nameStr.toLowerCase();
      if (cid === 'usa') {
        if (low.includes('democrat')) return list.find((x) => x.id === 'DEM');
        if (low.includes('republican') || low.includes('gop')) return list.find((x) => x.id === 'GOP');
      }
      const byName = list.find(
        (x) =>
          (x.short && low === x.short.toLowerCase()) ||
          (x.name && low === x.name.toLowerCase()) ||
          (x.short && low.startsWith(x.short.toLowerCase()))
      );
      if (byName) return byName;
    }
    return null;
  };

  ES.spectrumClass = function (pos, score) {
    const p = String(pos || '').toLowerCase();
    if (p.includes('big tent') || p.includes('satirical') || p.includes('non-aligned') || p.includes('non-partisan') || p.includes('various') || p.includes('minority')) {
      if (!p.includes('centre-left') && !p.includes('centre-right')) return 'ideo-syncretic';
    }
    const s = +score || 5.0;
    if (s <= 1.9) return 'ideo-far-left';
    if (s <= 2.9) return 'ideo-left';
    if (s <= 4.3) return 'ideo-centre-left';
    if (s <= 5.6) return 'ideo-centre';
    if (s <= 7.1) return 'ideo-centre-right';
    if (s <= 8.4) return 'ideo-right';
    return 'ideo-far-right';
  };

  ES.scoreToLabel = function (s) {
    if (s <= 1.9) return 'Far-Left';
    if (s <= 2.9) return 'Left-Wing';
    if (s <= 4.3) return 'Centre-Left';
    if (s <= 5.6) return 'Centre';
    if (s <= 7.1) return 'Centre-Right';
    if (s <= 8.4) return 'Right-Wing';
    return 'Far-Right';
  };

  ES.ideologyBadge = function (partyOrInfo, opts = {}) {
    const info = partyOrInfo && partyOrInfo.pos && partyOrInfo.score !== undefined ? partyOrInfo : ES.getIdeology(partyOrInfo, opts.countryId);
    if (!info) return null;
    const cls = ES.spectrumClass(info.pos, info.score);
    const shortPos = info.pos
      .replace('Centre-left to Left-wing', 'Centre-left / Left')
      .replace('Left-wing to Far-left', 'Left / Far-left')
      .replace('Centre-right to Right-wing', 'Centre-right / Right')
      .replace('Right-wing to Far-right', 'Right / Far-right')
      .replace('Centre to Centre-right', 'Centre / C-Right')
      .replace('Centre to Centre-left', 'Centre / C-Left')
      .replace('Centre-left to Centre', 'C-Left / Centre')
      .replace('Right-wing (Religiously conservative)', 'Right (Religious)')
      .replace('Far-left (Socially conservative)', 'Far-left');
    const badge = util.el('span', { class: 'ideo-badge ' + cls }, [
      util.el('span', { text: shortPos }),
      opts.hideScore ? null : util.el('span', { class: 'ideo-score', text: '· ' + Number(info.score).toFixed(1) }),
    ]);
    const tip = ES.ui.tooltip();
    badge.addEventListener('mouseenter', (e) => {
      tip.show(
        e,
        `<div style="line-height:1.45">
          <b>${info.name || info.short}</b> ${info.era ? `<span class="muted">(${info.era})</span>` : ''}<br>
          <span style="color:var(--gold);font-weight:700">🧭 ${info.pos}</span> · Score: <b>${Number(info.score).toFixed(1)} / 10</b><br>
          <span style="color:#a5b4fc">🏷️ ${info.tags || '—'}</span>
        </div>`
      );
    });
    badge.addEventListener('mousemove', (e) => tip.move(e));
    badge.addEventListener('mouseleave', () => tip.hide());
    return badge;
  };

  /**
   * Interactive 1.0 (Far-Left) to 10.0 (Far-Right) Political Spectrum & Center of Gravity Widget
   */
  ES.spectrumWidget = function (items, opts = {}) {
    const wrap = util.el('div', { class: 'spectrum-widget' });
    const tip = ES.ui.tooltip();

    function update(curItems) {
      wrap.innerHTML = '';
      const enriched = [];
      let totalW = 0;
      let weightedSum = 0;
      let leftW = 0, centreW = 0, rightW = 0;

      (curItems || []).forEach((p) => {
        const w = +(p.weight !== undefined ? p.weight : p.seats !== undefined ? p.seats : p.votes || 0);
        if (w <= 0) return;
        const info = ES.getIdeology(p, opts.countryId);
        if (!info) return;
        const sc = +info.score || 5.0;
        totalW += w;
        weightedSum += w * sc;
        if (sc <= 4.3) leftW += w;
        else if (sc <= 6.0) centreW += w;
        else rightW += w;
        enriched.push({ p, info, w, sc });
      });

      if (!enriched.length || totalW <= 0) {
        wrap.style.display = 'none';
        return;
      }
      wrap.style.display = 'flex';
      const cog = weightedSum / totalW;
      const cogPct = Math.max(2, Math.min(98, ((cog - 1) / 9) * 100));
      const unit = opts.unit || (opts.isVotes ? '%' : 'seats');
      const fmtW = (v) => (opts.isVotes ? util.fmt((v / totalW) * 100, 1) + '%' : Math.round(v));

      const head = util.el('div', { class: 'spectrum-head' }, [
        util.el('div', { class: 'spectrum-title', html: `🧭 ${opts.title || 'Political Spectrum Compass'} <span class="muted" style="font-size:11px;font-weight:500;text-transform:none">(1.0 Left → 10.0 Right)</span>` }),
        util.el('div', { class: 'spectrum-blocs' }, [
          util.el('span', { class: 'spectrum-bloc-pill', style: { color: 'var(--bad)' }, html: `Left: <b>${fmtW(leftW)}</b>` }),
          util.el('span', { class: 'spectrum-bloc-pill', style: { color: 'var(--gold)' }, html: `Centre: <b>${fmtW(centreW)}</b>` }),
          util.el('span', { class: 'spectrum-bloc-pill', style: { color: 'var(--accent)' }, html: `Right: <b>${fmtW(rightW)}</b>` }),
          util.el('span', {
            class: 'spectrum-bloc-pill',
            style: { borderColor: 'var(--gold)', color: 'var(--gold)' },
            html: `⚖️ Avg: <b>${cog.toFixed(1)}</b> (${ES.scoreToLabel(cog)})`,
          }),
        ]),
      ]);
      wrap.appendChild(head);

      const trackWrap = util.el('div', { class: 'spectrum-track-wrap' }, [
        util.el('div', { class: 'spectrum-track' }),
        util.el('div', { class: 'spectrum-center-tick', title: 'Ideological Centre (5.5)' }),
        util.el('div', { class: 'spectrum-cog', style: { left: cogPct.toFixed(2) + '%' } }),
      ]);

      // Sort smaller bubbles on top of larger ones so none are hidden
      enriched
        .slice()
        .sort((a, b) => b.w - a.w)
        .forEach(({ p, info, w, sc }) => {
          const share = w / totalW;
          const sz = Math.round(16 + Math.sqrt(share) * 18);
          const leftPct = Math.max(2, Math.min(98, ((sc - 1) / 9) * 100));
          const col = p.color || info.color || '#38bdf8';
          const shortCode = (p.short || info.short || p.name || '').slice(0, 3).toUpperCase();
          const node = util.el(
            'div',
            {
              class: 'spectrum-node',
              style: {
                left: leftPct.toFixed(2) + '%',
                width: sz + 'px',
                height: sz + 'px',
                background: col,
                color: util.textOn(col),
              },
            },
            sz >= 22 ? shortCode : ''
          );
          node.addEventListener('mouseenter', (e) => {
            tip.show(
              e,
              `<div style="line-height:1.45">
                <b style="color:${col}">■</b> <b>${p.name || info.name}</b><br>
                <span style="color:var(--gold);font-weight:700">${info.pos}</span> · Score: <b>${sc.toFixed(1)} / 10</b><br>
                <span style="color:#a5b4fc">${info.tags}</span><br>
                <b>${opts.isVotes ? util.fmt(w, 1) + '%' : w + ' ' + unit}</b> (${util.fmt(share * 100, 1)}%)
              </div>`
            );
          });
          node.addEventListener('mousemove', (e) => tip.move(e));
          node.addEventListener('mouseleave', () => tip.hide());
          trackWrap.appendChild(node);
        });

      wrap.appendChild(trackWrap);
      wrap.appendChild(
        util.el('div', { class: 'spectrum-scale' }, [
          util.el('span', { text: '1.0 Far-Left' }),
          util.el('span', { text: '3.0 Centre-Left' }),
          util.el('span', { text: '5.5 Centre' }),
          util.el('span', { text: '7.5 Centre-Right' }),
          util.el('span', { text: '10.0 Far-Right' }),
        ])
      );
    }

    update(items);
    return { el: wrap, update };
  };

  /* --------------------------------------------------------------------- */
  /* Hemicycle (parliament) diagram                                         */
  /* --------------------------------------------------------------------- */
  ES.hemicycle = function (container, parties, opts = {}) {
    container.innerHTML = '';
    const active = parties.filter((p) => p.seats > 0);
    const total = opts.total || active.reduce((a, p) => a + p.seats, 0);
    const majority = opts.majority || Math.floor(total / 2) + 1;
    const W = 400, H = 215, cx = 200, cy = 200, R = 190;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'hemicycle');

    if (total > 0) {
      const r0 = total < 40 ? 0.3 : total < 120 ? 0.36 : 0.4;
      let rows = 1, caps = [];
      for (; rows < 60; rows++) {
        const d = (1 - r0) / rows;
        caps = [];
        for (let i = 0; i < rows; i++) {
          const ri = r0 + d * (i + 0.5);
          caps.push(Math.max(1, Math.floor((Math.PI * ri) / d) + 1));
        }
        if (caps.reduce((a, b) => a + b, 0) >= total) break;
      }
      const d = (1 - r0) / rows;
      const capObj = {};
      caps.forEach((c, i) => (capObj[i] = c));
      const perRow = methods.largestRemainder(capObj, total, 'hare');
      const seats = [];
      for (let i = 0; i < rows; i++) {
        const n = perRow[i] || 0;
        const ri = r0 + d * (i + 0.5);
        for (let j = 0; j < n; j++) {
          const ang = n === 1 ? Math.PI / 2 : Math.PI - (Math.PI * j) / (n - 1);
          seats.push({ ang, r: ri });
        }
      }
      seats.sort((a, b) => b.ang - a.ang || a.r - b.r);
      const seatR = Math.min(d * 0.42, 0.08) * R;
      let idx = 0;
      const tip = ES.ui.tooltip();
      active.forEach((p) => {
        const pic = p.img || ES.leaderImg(p.leader || p.name);
        const ideo = ES.getIdeology(p);
        for (let s = 0; s < p.seats && idx < seats.length; s++, idx++) {
          const st = seats[idx];
          const c = document.createElementNS(svgNS, 'circle');
          c.setAttribute('cx', (cx + Math.cos(st.ang) * st.r * R).toFixed(2));
          c.setAttribute('cy', (cy - Math.sin(st.ang) * st.r * R).toFixed(2));
          c.setAttribute('r', seatR.toFixed(2));
          c.setAttribute('fill', p.color);
          c.setAttribute('data-party', p.id);
          c.addEventListener('mouseenter', (e) => {
            svg.querySelectorAll(`circle[data-party="${CSS.escape(p.id)}"]`).forEach((x) => x.classList.add('hl'));
            const imgHtml = pic ? `<img src="${pic}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid ${p.color};float:left;margin-right:8px;" />` : '';
            const ideoHtml = ideo
              ? `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px">
                  <span style="color:var(--gold);font-weight:700">🧭 ${ideo.pos}</span> · <b>${Number(ideo.score).toFixed(1)}/10</b><br>
                  <span style="color:#a5b4fc">${ideo.tags}</span>
                </div>`
              : '';
            tip.show(
              e,
              `<div style="overflow:hidden">${imgHtml}<b style="color:${p.color}">■</b> <b>${p.name}</b>${p.leader ? `<br><small>${p.leader}</small>` : ''}<br><b>${p.seats}</b> seats (${util.fmt((p.seats / total) * 100)}%)${ideoHtml}</div>`
            );
          });
          c.addEventListener('mousemove', (e) => tip.move(e));
          c.addEventListener('mouseleave', () => {
            svg.querySelectorAll('circle.hl').forEach((x) => x.classList.remove('hl'));
            tip.hide();
          });
          if (opts.onSeatClick) c.addEventListener('click', () => opts.onSeatClick(p));
          svg.appendChild(c);
        }
      });
      for (; idx < seats.length && idx < total; idx++) {
        const st = seats[idx];
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', cx + Math.cos(st.ang) * st.r * R);
        c.setAttribute('cy', cy - Math.sin(st.ang) * st.r * R);
        c.setAttribute('r', seatR);
        c.setAttribute('fill', 'var(--track-bg, #d8e2ef)');
        svg.appendChild(c);
      }
    }
    const t1 = document.createElementNS(svgNS, 'text');
    t1.setAttribute('x', cx); t1.setAttribute('y', cy - 22);
    t1.setAttribute('class', 'hc-total');
    t1.textContent = opts.centerLabel || total;
    svg.appendChild(t1);
    const t2 = document.createElementNS(svgNS, 'text');
    t2.setAttribute('x', cx); t2.setAttribute('y', cy - 4);
    t2.setAttribute('class', 'hc-sub');
    t2.textContent = opts.subtitle || `Majority: ${majority}`;
    svg.appendChild(t2);
    container.appendChild(svg);

    if (opts.showSpectrum !== false && active.length > 0) {
      const spec = ES.spectrumWidget(
        active.map((p) => ({ ...p, weight: p.seats })),
        { title: 'Parliament Ideological Balance', unit: 'seats' }
      );
      container.appendChild(spec.el);
    }
    return svg;
  };

  /* --------------------------------------------------------------------- */
  /* UI helpers                                                             */
  /* --------------------------------------------------------------------- */
  const ui = (ES.ui = {});
  const el = util.el;

  let tipEl = null;
  ui.tooltip = function () {
    if (!tipEl) {
      tipEl = el('div', { class: 'es-tooltip' });
      document.body.appendChild(tipEl);
    }
    return {
      show(e, html) { tipEl.innerHTML = html; tipEl.style.display = 'block'; this.move(e); },
      move(e) {
        const pad = 14;
        let x = e.clientX + pad, y = e.clientY + pad;
        const r = tipEl.getBoundingClientRect();
        if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
        if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
        tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
      },
      hide() { tipEl.style.display = 'none'; },
    };
  };

  ui.card = function (title, extraClass = '', headerRight = null) {
    const body = el('div', { class: 'card-body' });
    const card = el('section', { class: 'card ' + extraClass }, [
      title ? el('header', { class: 'card-head' }, [el('h3', { text: title }), headerRight]) : null,
      body,
    ]);
    return { card, body };
  };

  ui.segmented = function (options, value, onChange) {
    const wrap = el('div', { class: 'segmented' });
    options.forEach((o) => {
      const b = el('button', { class: o.value === value ? 'active' : '', text: o.label, title: o.title || '' });
      b.addEventListener('click', () => {
        sfx.click(580);
        wrap.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        onChange(o.value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  };

  ui.select = function (options, value, onChange) {
    const s = el('select', { class: 'es-select' });
    options.forEach((o) => {
      const opt = el('option', { value: o.value, text: o.label });
      if (String(o.value) === String(value)) opt.selected = true;
      s.appendChild(opt);
    });
    s.addEventListener('change', () => { sfx.click(500); onChange(s.value); });
    return s;
  };

  /**
   * Percentage sliders – automatically displays leader portrait + Political Spectrum badge & Ideology tags!
   */
  ui.sliders = function (parties, values, opts = {}) {
    const max = opts.max || 70;
    const step = opts.step || 0.1;
    const root = el('div', { class: 'sliders' });
    const rows = {};
    const totalEl = el('div', { class: 'slider-total' });
    let specCtrl = null;

    function updateSpectrum() {
      if (!specCtrl) return;
      specCtrl.update(
        parties.map((p) => ({
          ...p,
          weight: Math.max(0, +values[p.id] || 0),
        }))
      );
    }

    function updateTotal() {
      const s = util.sum(values);
      const others = 100 - s;
      totalEl.innerHTML = '';
      if (opts.showOthers !== false) {
        totalEl.appendChild(el('span', { class: others < -0.05 ? 'warn' : '', html: `Total <b>${util.fmt(s)}%</b> · ${others >= 0 ? `Others/unallocated <b>${util.fmt(others)}%</b>` : `<b>${util.fmt(-others)}%</b> over 100 – values will be scaled`}` }));
      } else {
        totalEl.appendChild(el('span', { class: Math.abs(others) > 0.05 ? 'warn' : '', html: `Total <b>${util.fmt(s)}%</b>${Math.abs(others) > 0.05 ? ' – will be scaled to 100%' : ''}` }));
      }
      const nb = el('button', { class: 'btn btn-xs', text: 'Normalize to 100%' });
      nb.addEventListener('click', () => {
        sfx.click(640);
        const n = util.normalize(values, 100);
        for (const k in n) values[k] = Math.round(n[k] * 10) / 10;
        refresh();
        opts.onChange && opts.onChange(values);
      });
      totalEl.appendChild(nb);
      updateSpectrum();
    }

    parties.forEach((p) => {
      const range = el('input', { type: 'range', min: 0, max, step, value: values[p.id] || 0 });
      range.style.setProperty('--c', p.color);
      const num = el('input', { type: 'number', min: 0, max: 100, step, value: util.fmt(values[p.id] || 0) });
      const set = (v, src) => {
        v = Math.max(0, Math.min(100, +v || 0));
        values[p.id] = v;
        if (src !== range) range.value = v;
        if (src !== num) num.value = util.fmt(v);
        fill();
        updateTotal();
        opts.onChange && opts.onChange(values);
      };
      const fill = () => {
        const pct = (Math.min(values[p.id] || 0, max) / max) * 100;
        range.style.background = `linear-gradient(90deg, ${p.color} ${pct}%, var(--track-bg, #d8e2ef) ${pct}%)`;
      };
      range.addEventListener('input', () => set(range.value, range));
      num.addEventListener('change', () => set(num.value, num));

      const ideoForPic = ES.getIdeology(p); const pic = p.img || ES.leaderImg(p.leader) || (ideoForPic && ES.leaderImg(ideoForPic.leader)) || ES.leaderImg(p.name);
      const ideo = ES.getIdeology(p);
      const badge = ideo ? ES.ideologyBadge(ideo) : null;
      const logoBadge = ES.partyLogo(p);
      const row = el('div', { class: 'slider-row' }, [
        el('div', { class: 'slider-label' }, [
          pic
            ? el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
                el('img', { class: 'leader-avatar', src: pic, alt: p.leader || p.name, style: { '--c': p.color } }),
                logoBadge,
              ])
            : logoBadge,
          el('div', { class: 'slider-names' }, [
            el('div', { class: 'pname-row' }, [
              el('span', { class: 'pname', text: p.name }),
              badge,
            ]),
            p.leader ? el('span', { class: 'pleader', text: p.leader }) : null,
            ideo && ideo.tags ? el('span', { class: 'ideo-tags', text: ideo.tags, title: ideo.tags }) : null,
          ]),
        ]),
        range,
        el('div', { class: 'num-wrap' }, [num, el('span', { text: '%' })]),
      ]);
      rows[p.id] = { range, num, fill };
      fill();
      root.appendChild(row);
    });
    root.appendChild(totalEl);

    if (opts.showSpectrum !== false) {
      specCtrl = ES.spectrumWidget(
        parties.map((p) => ({ ...p, weight: Math.max(0, +values[p.id] || 0) })),
        { title: 'Vote-Weighted Spectrum', isVotes: true }
      );
      root.appendChild(specCtrl.el);
    }

    updateTotal();

    function refresh() {
      parties.forEach((p) => {
        const r = rows[p.id];
        if (!r) return;
        r.range.value = values[p.id] || 0;
        r.num.value = util.fmt(values[p.id] || 0);
        r.fill();
      });
      updateTotal();
    }
    return {
      el: root,
      refresh,
      setValues(v) { for (const k in values) delete values[k]; Object.assign(values, v); refresh(); },
    };
  };

  /** Results table – automatically displays leader portrait + Political Spectrum badge & Ideology tags */
  ui.resultsTable = function (rows, opts = {}) {
    const cols = opts.columns || [
      { key: 'votes', label: 'Votes', fmt: (v) => (v === undefined ? '–' : util.fmt(v) + '%') },
      { key: 'seats', label: 'Seats' },
    ];
    const t = el('table', { class: 'results' });
    t.appendChild(el('thead', {}, el('tr', {}, [el('th', { text: opts.nameLabel || 'Party' }), ...cols.map((c) => el('th', { text: c.label }))])));
    const tb = el('tbody');
    rows.forEach((r) => {
      const ideoForPic = ES.getIdeology(r); const pic = r.img || ES.leaderImg(r.leader) || (ideoForPic && ES.leaderImg(ideoForPic.leader)) || ES.leaderImg(r.name);
      const ideo = ES.getIdeology(r);
      const badge = ideo ? ES.ideologyBadge(ideo) : null;
      tb.appendChild(
        el('tr', { class: r.dim ? 'dim' : '' }, [
          el('td', {}, [
            pic ? el('img', { class: 'leader-avatar-sm', src: pic, alt: r.leader || r.name, style: { '--c': r.color } }) : null,
            ES.partyLogo(r, { size: 'sm' }),
            el('span', { class: 'rname', text: r.name }),
            badge,
            r.leader ? el('span', { class: 'rleader' + (pic ? ' with-pic' : ''), text: r.leader }) : null,
            ideo && ideo.tags ? el('span', { class: 'r-ideo-Sub' + (pic ? ' with-pic' : ''), text: '🏷️ ' + ideo.tags }) : null,
          ]),
          ...cols.map((c) => el('td', { class: 'num', html: String(c.fmt ? c.fmt(r[c.key], r) : r[c.key] === undefined ? '–' : r[c.key]) })),
        ])
      );
    });
    t.appendChild(tb);
    return t;
  };

  /** Horizontal stacked seat bar with majority line. */
  ui.seatBar = function (parties, total, majority, opts = {}) {
    const wrap = el('div', { class: 'seatbar-wrap' });
    const bar = el('div', { class: 'seatbar' });
    const tip = ui.tooltip();
    parties.filter((p) => p.seats > 0).forEach((p) => {
      const ideo = ES.getIdeology(p);
      const seg = el('div', { class: 'seg', style: { width: (p.seats / total) * 100 + '%', background: p.color, color: util.textOn(p.color) } }, (p.seats / total) > 0.055 ? String(p.seats) : '');
      seg.addEventListener('mouseenter', (e) => {
        const ideoLine = ideo ? `<br><span style="color:var(--gold)">${ideo.pos} (${Number(ideo.score).toFixed(1)}/10)</span>` : '';
        tip.show(e, `<b>${p.name}</b><br>${p.seats}${opts.unit ? ' ' + opts.unit : ''}${ideoLine}`);
      });
      seg.addEventListener('mousemove', (e) => tip.move(e));
      seg.addEventListener('mouseleave', () => tip.hide());
      bar.appendChild(seg);
    });
    bar.appendChild(el('div', { class: 'majline', style: { left: (majority / total) * 100 + '%' } }));
    wrap.appendChild(bar);
    if (opts.label !== false) wrap.appendChild(el('div', { class: 'seatbar-label', text: opts.label || `${majority} needed for a majority` }));
    if (total === 538) {
      const spec = ES.spectrumWidget(
        parties.filter((p) => p.seats > 0 && p.name !== 'Toss-up').map((p) => ({ ...p, weight: p.seats })),
        { title: 'Electoral College Spectrum', unit: 'EV' }
      );
      wrap.appendChild(spec.el);
    }
    return wrap;
  };

  /**
   * Game-Style Coalition Studio & Government Builder
   * Works across all parliamentary systems and highlights selected coalition inside the hemicycle!
   */
  const coalitionMemory = {}; // remembers selected party IDs per total-seat count so slider moves keep coalition intact
  ui.coalition = function (parties, total, majority, opts = {}) {
    const wrap = el('div', { class: 'coalition', id: 'es-coalition-studio' });
    const active = parties.filter((p) => p.seats > 0);
    const sorted = active.slice().sort((a, b) => b.seats - a.seats);
    const memKey = opts.key || String(total);
    if (!coalitionMemory[memKey]) {
      coalitionMemory[memKey] = new Set(sorted.length ? [sorted[0].id] : []);
    }
    const chosen = coalitionMemory[memKey];
    // remove parties that now have 0 seats
    Array.from(chosen).forEach((id) => {
      if (!active.some((p) => p.id === id)) chosen.delete(id);
    });

    const head = el('div', { class: 'coal-head' });
    head.appendChild(el('div', { class: 'coal-title', html: '🤝 Coalition Maker &amp; Government Formation' }));

    const presets = el('div', { class: 'coal-presets' });
    function applySet(ids, playSound = true) {
      chosen.clear();
      ids.forEach((id) => chosen.add(id));
      syncCards();
      upd(playSound);
    }

    if (sorted.length > 0) {
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: '1st Party Solo',
          onclick: () => applySet([sorted[0].id]),
        })
      );
    }
    if (sorted.length >= 2) {
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: 'Grand Coalition (Top 2)',
          onclick: () => applySet([sorted[0].id, sorted[1].id]),
        })
      );
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: 'Min. Winning',
          onclick: () => {
            const pick = [];
            let sumS = 0;
            for (const p of sorted) {
              if (sumS < majority) {
                pick.push(p.id);
                sumS += p.seats;
              }
            }
            applySet(pick);
          },
        })
      );
      // Ideological Bloc Presets
      const leftIds = active.filter((p) => { const i = ES.getIdeology(p); return i && i.score <= 5.3; }).map((p) => p.id);
      const centreIds = active.filter((p) => { const i = ES.getIdeology(p); return i && i.score >= 3.3 && i.score <= 6.8; }).map((p) => p.id);
      const rightIds = active.filter((p) => { const i = ES.getIdeology(p); return i && i.score >= 5.5; }).map((p) => p.id);
      if (leftIds.length > 0) {
        presets.appendChild(
          el('button', {
            class: 'btn btn-xs',
            text: '🟥 Left-Centre Bloc',
            title: 'Select all Left, Centre-Left, and Centrist parties (Score ≤ 5.3)',
            onclick: () => applySet(leftIds),
          })
        );
      }
      if (centreIds.length > 1) {
        presets.appendChild(
          el('button', {
            class: 'btn btn-xs',
            text: '🟨 Centrist Bloc',
            title: 'Select Centre-Left, Centre, and Centre-Right parties (Score 3.3–6.8)',
            onclick: () => applySet(centreIds),
          })
        );
      }
      if (rightIds.length > 0) {
        presets.appendChild(
          el('button', {
            class: 'btn btn-xs',
            text: '🟦 Right-Centre Bloc',
            title: 'Select all Centre-Right, Right-Wing, and Far-Right parties (Score ≥ 5.5)',
            onclick: () => applySet(rightIds),
          })
        );
      }
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: 'Anti-1st Bloc',
          onclick: () => applySet(sorted.slice(1).map((p) => p.id)),
        })
      );
    }
    presets.appendChild(
      el('button', {
        class: 'btn btn-xs',
        text: 'Clear',
        onclick: () => applySet([], false),
      })
    );
    head.appendChild(presets);
    wrap.appendChild(head);

    const list = el('div', { class: 'coalition-list' });
    const cardEls = {};

    active.forEach((p) => {
      const pic = p.img || ES.leaderImg(p.leader) || ES.leaderImg(p.name);
      const ideo = ES.getIdeology(p);
      const badge = ideo ? ES.ideologyBadge(ideo) : null;
      const card = el(
        'button',
        { class: 'coal-card' + (chosen.has(p.id) ? ' on' : ''), style: { '--c': p.color } },
        [
          pic
            ? el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
                el('img', { class: 'leader-avatar-sm', src: pic, alt: p.leader || p.name, style: { '--c': p.color } }),
                ES.partyLogo(p, { size: 'sm' }),
              ])
            : ES.partyLogo(p, { size: 'sm' }),
          el('div', { class: 'coal-card-info' }, [
            el('span', { class: 'coal-card-name', text: p.short || p.name }),
            badge,
            el('span', { class: 'coal-card-sub', text: p.leader || `${util.fmt((p.seats / total) * 100, 1)}% of seats` }),
          ]),
          el('span', { class: 'coal-card-seats', style: { color: p.color }, text: p.seats }),
        ]
      );
      card.addEventListener('click', () => {
        if (chosen.has(p.id)) chosen.delete(p.id);
        else chosen.add(p.id);
        card.classList.toggle('on', chosen.has(p.id));
        upd(true);
      });
      cardEls[p.id] = card;
      list.appendChild(card);
    });
    wrap.appendChild(list);

    function syncCards() {
      for (const id in cardEls) {
        cardEls[id].classList.toggle('on', chosen.has(id));
      }
    }

    // Meter bar + Status bar + Ideological Cohesion bar
    const meter = el('div', { class: 'coal-meter' });
    const status = el('div', { class: 'coal-status-bar' });
    const ideoBar = el('div', { class: 'coal-ideo-bar' });
    wrap.appendChild(meter);
    wrap.appendChild(status);
    wrap.appendChild(ideoBar);

    function upd(withSound) {
      const selParties = active.filter((p) => chosen.has(p.id));
      const s = selParties.reduce((a, p) => a + p.seats, 0);
      const superMaj = Math.ceil((total * 2) / 3);
      const ok = s >= majority;
      const isSuper = s >= superMaj;

      if (withSound) {
        if (ok) sfx.fanfare();
        else sfx.click(480);
      }

      // Update stacked meter bar
      meter.innerHTML = '';
      selParties.forEach((p) => {
        meter.appendChild(
          el('div', {
            class: 'coal-meter-seg',
            style: { width: (p.seats / total) * 100 + '%', background: p.color },
            title: `${p.short || p.name}: ${p.seats}`,
          })
        );
      });
      // 50% majority line & 2/3 line
      meter.appendChild(el('div', { class: 'majline', style: { left: (majority / total) * 100 + '%' }, title: `Majority: ${majority}` }));
      if (superMaj < total) {
        meter.appendChild(
          el('div', {
            class: 'majline',
            style: { left: (superMaj / total) * 100 + '%', background: '#f5b82e', width: '2px' },
            title: `⅔ Supermajority: ${superMaj}`,
          })
        );
      }

      // Lead party / PM
      const leadParty = selParties.slice().sort((a, b) => b.seats - a.seats)[0];
      const leadText = leadParty
        ? `Lead Partner: <b style="color:${leadParty.color}">${leadParty.short || leadParty.name}</b>${leadParty.leader ? ` (${leadParty.leader})` : ''}`
        : 'Click party cards above to assemble a governing coalition';

      status.innerHTML = `
        <div>
          <span style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700">${s} / ${total}</span>
          <span class="muted small">seats (${util.fmt((s / Math.max(1, total)) * 100, 1)}%)</span>
          · ${
            isSuper
              ? '<span class="badge" style="background:var(--gold);color:#111">★ ⅔ SUPERMAJORITY GOVERNMENT</span>'
              : ok
              ? '<span class="badge">✔ MAJORITY COALITION FORMED</span>'
              : s === 0
              ? '<span class="muted small">No parties selected</span>'
              : `<span class="no">Minority (${majority - s} seats short of ${majority})</span>`
          }
        </div>
        <div class="small muted">${leadText}</div>
      `;

      // Calculate Coalition Ideological Position & Cohesion
      const scored = selParties
        .map((p) => ({ p, info: ES.getIdeology(p) }))
        .filter((x) => x.info);
      if (scored.length > 0 && s > 0) {
        ideoBar.style.display = 'flex';
        const wSum = scored.reduce((a, x) => a + x.p.seats * x.info.score, 0);
        const wSeats = scored.reduce((a, x) => a + x.p.seats, 0);
        const avgScore = wSeats > 0 ? wSum / wSeats : 5.0;
        const scores = scored.map((x) => +x.info.score);
        const minS = Math.min(...scores);
        const maxS = Math.max(...scores);
        const span = maxS - minS;
        const cohesionHtml =
          scored.length === 1
            ? '<span style="color:var(--ok);font-weight:700">🟢 Single-Party Cohesion (Span 0.0)</span>'
            : span <= 1.8
            ? `<span style="color:var(--ok);font-weight:700">🟢 High Ideological Cohesion (Span ${span.toFixed(1)})</span>`
            : span <= 3.5
            ? `<span style="color:var(--warn);font-weight:700">🟡 Moderate Compromise Coalition (Span ${span.toFixed(1)})</span>`
            : `<span style="color:var(--bad);font-weight:700">🟠 Cross-Spectrum Tension (Span ${span.toFixed(1)})</span>`;
        ideoBar.innerHTML = `
          <div>🧭 Coalition Orientation: <b style="color:var(--gold)">${ES.scoreToLabel(avgScore)}</b> <span class="muted">(Weighted Score: <b>${avgScore.toFixed(1)} / 10</b>)</span></div>
          <div>${cohesionHtml}</div>
        `;
      } else {
        ideoBar.style.display = 'none';
      }

      // Highlight selected coalition in any hemicycle on the page
      document.querySelectorAll('svg.hemicycle').forEach((svg) => {
        if (s > 0 && selParties.length < active.length) {
          svg.classList.add('has-coalition');
          svg.querySelectorAll('circle[data-party]').forEach((c) => {
            c.classList.toggle('coal-on', chosen.has(c.getAttribute('data-party')));
          });
        } else {
          svg.classList.remove('has-coalition');
          svg.querySelectorAll('circle.coal-on').forEach((c) => c.classList.remove('coal-on'));
        }
      });
    }

    setTimeout(() => upd(false), 0);
    return wrap;
  };

  /** Modal dialog. */
  ui.modal = function (title, build, opts = {}) {
    sfx.click(620);
    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const body = el('div', { class: 'modal-body' });
    const box = el('div', { class: 'modal ' + (opts.wide ? 'wide' : '') }, [
      el('header', { class: 'modal-head' }, [el('h3', { html: title }), el('button', { class: 'btn btn-icon', text: '✕', onclick: close })]),
      body,
    ]);
    const overlay = el('div', { class: 'modal-overlay' }, box);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    build(body, close);
    return { close };
  };

  ui.legend = function (items) {
    return el('div', { class: 'legend' }, items.map((i) => el('span', { class: 'legend-item' }, [el('span', { class: 'swatch', style: { background: i.color } }), i.label])));
  };

  ui.note = (html, kind = 'info') => el('div', { class: 'note note-' + kind, html });

  ui.layout = function () {
    const left = el('div', { class: 'col col-left' });
    const right = el('div', { class: 'col col-right' });
    const root = el('div', { class: 'layout' }, [left, right]);
    return { root, left, right };
  };

  /* --------------------------------------------------------------------- */
  /* Flags (inline SVG)                                                     */
  /* --------------------------------------------------------------------- */
  const FLAGS = {
    hungary: '<rect width="30" height="7" fill="#CE2939"/><rect y="7" width="30" height="6" fill="#fff"/><rect y="13" width="30" height="7" fill="#477050"/>',
    budapest: '<rect width="30" height="7" fill="#d4213d"/><rect y="7" width="30" height="6" fill="#f2c200"/><rect y="13" width="30" height="7" fill="#1d4f9c"/>',
    germany: '<rect width="30" height="7" fill="#000"/><rect y="7" width="30" height="6" fill="#DD0000"/><rect y="13" width="30" height="7" fill="#FFCE00"/>',
    france: '<rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ED2939"/>',
    eu: '<rect width="30" height="20" fill="#003399"/>' + Array.from({ length: 12 }, (_, i) => `<circle cx="${(15 + 6 * Math.cos((i * Math.PI) / 6)).toFixed(2)}" cy="${(10 + 6 * Math.sin((i * Math.PI) / 6)).toFixed(2)}" r="0.9" fill="#FFCC00"/>`).join(''),
    uk: '<rect width="30" height="20" fill="#012169"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="4"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" stroke-width="1.5"/><path d="M15,0 V20 M0,10 H30" stroke="#fff" stroke-width="6"/><path d="M15,0 V20 M0,10 H30" stroke="#C8102E" stroke-width="3.5"/>',
    usa: Array.from({ length: 7 }, (_, i) => `<rect y="${(i * 20) / 6.5}" width="30" height="${20 / 13}" fill="#B22234"/>`).join('') + '<rect width="13" height="10.8" fill="#3C3B6E"/>',
    israel: '<rect width="30" height="20" fill="#fff"/><rect y="2" width="30" height="3" fill="#0038b8"/><rect y="15" width="30" height="3" fill="#0038b8"/><polygon points="15,6.2 18.2,11.8 11.8,11.8" fill="none" stroke="#0038b8" stroke-width="1.1"/><polygon points="15,13.8 18.2,8.2 11.8,8.2" fill="none" stroke="#0038b8" stroke-width="1.1"/>',
    canada: '<rect width="7.5" height="20" fill="#d80621"/><rect x="7.5" width="15" height="20" fill="#fff"/><rect x="22.5" width="7.5" height="20" fill="#d80621"/><path d="M15,4.5 L16.3,8 L19.2,7.5 L17.4,10.5 L19.5,12 L16,12.5 L16,16 L14,16 L14,12.5 L10.5,12 L12.6,10.5 L10.8,7.5 L13.7,8 Z" fill="#d80621"/>',
    italy: '<rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/>',
    spain: '<rect width="30" height="5" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/><rect y="15" width="30" height="5" fill="#AA151B"/><rect x="6" y="7.2" width="2.8" height="5.6" rx="0.8" fill="#AA151B"/>',
    denmark: '<rect width="30" height="20" fill="#C8102E"/><rect x="9" width="3.2" height="20" fill="#fff"/><rect y="8.4" width="30" height="3.2" fill="#fff"/>',
    poland: '<rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#DC143C"/>',
    ukraine: '<rect width="30" height="10" fill="#005BBB"/><rect y="10" width="30" height="10" fill="#FFD500"/>',
    russia: '<rect width="30" height="6.6" fill="#fff"/><rect y="6.6" width="30" height="6.8" fill="#0039A6"/><rect y="13.4" width="30" height="6.6" fill="#D52B1E"/>',
  };
  ES.flag = function (id, h = 18) {
    const s = FLAGS[id];
    if (!s) return null;
    const span = el('span', { class: 'flag-svg' });
    span.innerHTML = `<svg viewBox="0 0 30 20" height="${h}" width="${(h * 1.5).toFixed(0)}">${s}</svg>`;
    return span;
  };

  /* --------------------------------------------------------------------- */
  /* Interactive 11-Country Political Spectrum & Ideology Explorer Modal    */
  /* --------------------------------------------------------------------- */
  const COUNTRY_LABELS = {
    hungary: 'Hungary',
    budapest: 'Budapest',
    eu: 'European Union',
    germany: 'Germany',
    france: 'France',
    uk: 'United Kingdom',
    usa: 'USA',
    israel: 'Israel',
    canada: 'Canada',
    italy: 'Italy',
    spain: 'Spain',
    denmark: 'Denmark',
    poland: 'Poland',
    ukraine: 'Ukraine',
    russia: 'Russia',
  };

  ES.openIdeologyModal = function (initialCid, onUpdate) {
    let selCid = initialCid || ES.activeCountryId || 'hungary';
    if (!ES.IDEOLOGY_DB[selCid]) selCid = 'hungary';

    ui.modal(
      '🧭 Political Spectrum &amp; Party Ideology Codex (11 Countries)',
      (body, close) => {
        const topRow = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } }, [
          el('div', { class: 'small muted', html: 'Inspect or customize Left–Right Spectrum Positions, 1–10 Scores, and Ideologies across all 11 countries.' }),
          el('div', { class: 'row', style: { gap: '6px' } }, [
            el('a', {
              class: 'btn btn-xs btn-primary',
              href: 'election_simulator_parties.xlsx',
              download: 'election_simulator_parties.xlsx',
              text: '📥 Download Excel (.xlsx)',
              style: { textDecoration: 'none' },
            }),
            el('button', {
              class: 'btn btn-xs',
              text: '↺ Reset Defaults',
              onclick: () => {
                ES.resetIdeologyOverrides();
                renderTab();
                onUpdate && onUpdate();
              },
            }),
          ]),
        ]);
        body.appendChild(topRow);

        const tabs = el('div', { class: 'codex-tabs' });
        const content = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
        body.appendChild(tabs);
        body.appendChild(content);

        function renderTab() {
          tabs.innerHTML = '';
          Object.keys(ES.IDEOLOGY_DB).forEach((cid) => {
            const btn = el(
              'button',
              {
                class: 'btn btn-xs' + (cid === selCid ? ' btn-primary' : ''),
                onclick: () => {
                  sfx.click(540);
                  selCid = cid;
                  renderTab();
                },
              },
              [ES.flag(cid, 12), el('span', { style: { marginLeft: '5px' }, text: COUNTRY_LABELS[cid] || cid })]
            );
            tabs.appendChild(btn);
          });

          content.innerHTML = '';
          const list = ES.IDEOLOGY_DB[selCid] || [];

          // Render interactive spectrum overview for all parties in this country
          const spec = ES.spectrumWidget(
            list.map((p) => ({ ...p, weight: 10 })),
            { countryId: selCid, title: `${COUNTRY_LABELS[selCid] || selCid} Party Spectrum Overview (Equal Weight)`, unit: 'pts' }
          );
          content.appendChild(spec.el);

          const tbl = el('table', { class: 'codex-table' });
          tbl.appendChild(
            el('thead', {}, [
              el('tr', {}, [
                el('th', { text: 'Party / Candidate' }),
                el('th', { text: 'Era / Election' }),
                el('th', { text: 'Position on Spectrum' }),
                el('th', { text: 'Score (1–10)' }),
                el('th', { text: 'Ideology / Tags' }),
              ]),
            ])
          );
          const tb = el('tbody');
          list.forEach((item) => {
            const badgeWrap = el('div', { style: { marginTop: '3px' } }, [ES.ideologyBadge(item, { countryId: selCid })]);
            const posInput = el('input', {
              class: 'codex-input',
              type: 'text',
              value: item.pos,
              onchange: () => {
                item.pos = posInput.value.trim() || item.pos;
                ES.saveIdeologyOverrides();
                badgeWrap.innerHTML = '';
                badgeWrap.appendChild(ES.ideologyBadge(item, { countryId: selCid }));
                spec.update(list.map((p) => ({ ...p, weight: 10 })));
                onUpdate && onUpdate();
              },
            });
            const scoreInput = el('input', {
              class: 'codex-input',
              type: 'number',
              min: 1,
              max: 10,
              step: 0.1,
              value: Number(item.score).toFixed(1),
              style: { width: '68px' },
              onchange: () => {
                item.score = Math.max(1, Math.min(10, +scoreInput.value || 5));
                scoreInput.value = Number(item.score).toFixed(1);
                ES.saveIdeologyOverrides();
                badgeWrap.innerHTML = '';
                badgeWrap.appendChild(ES.ideologyBadge(item, { countryId: selCid }));
                spec.update(list.map((p) => ({ ...p, weight: 10 })));
                onUpdate && onUpdate();
              },
            });
            const tagsInput = el('input', {
              class: 'codex-input',
              type: 'text',
              value: item.tags,
              onchange: () => {
                item.tags = tagsInput.value.trim();
                ES.saveIdeologyOverrides();
                badgeWrap.innerHTML = '';
                badgeWrap.appendChild(ES.ideologyBadge(item, { countryId: selCid }));
                onUpdate && onUpdate();
              },
            });

            tb.appendChild(
              el('tr', {}, [
                el('td', {}, [
                  el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
                    el('span', { class: 'swatch', style: { background: item.color || '#38bdf8' } }),
                    el('b', { text: item.short || item.id }),
                  ]),
                  el('div', { class: 'small muted', text: item.name }),
                  badgeWrap,
                ]),
                el('td', { class: 'small muted', text: item.era || '—' }),
                el('td', {}, [posInput]),
                el('td', {}, [scoreInput]),
                el('td', {}, [tagsInput]),
              ])
            );
          });
          tbl.appendChild(tb);
          content.appendChild(tbl);
        }

        renderTab();
      },
      { wide: true }
    );
  };

  /* --------------------------------------------------------------------- */
  /* App shell & Theme Switcher (Light Faded Blue-Gray-White / Dark Mode)   */
  /* --------------------------------------------------------------------- */
  ES.start = function () {
    const nav = document.getElementById('country-nav');
    const hud = document.getElementById('hud-tools');
    const app = document.getElementById('app');
    let current = null;

    let theme = 'light';
    try {
      const savedTheme = localStorage.getItem('es_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') theme = savedTheme;
    } catch (e) {}

    function applyTheme(t) {
      theme = t === 'dark' ? 'dark' : 'light';
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try { localStorage.setItem('es_theme', theme); } catch (e) {}
    }
    applyTheme(theme);

    if (hud) {
      const themeBtn = el('button', {
        class: 'btn btn-xs',
        text: theme === 'dark' ? '☀️ Light Theme' : '🌙 Dark Theme',
        title: 'Switch between Light (Blue-Gray-White) and Dark Theme',
        onclick: () => {
          sfx.click(560);
          applyTheme(theme === 'dark' ? 'light' : 'dark');
          themeBtn.textContent = theme === 'dark' ? '☀️ Light Theme' : '🌙 Dark Theme';
        },
      });
      const ideoBtn = el('button', {
        class: 'btn btn-xs',
        text: '🧭 Ideology & Spectrum',
        title: 'Open the 11-Country Political Spectrum & Party Ideology Codex',
        onclick: () => {
          ES.openIdeologyModal(current ? current.id : 'hungary', () => {
            if (current) open(current.id);
          });
        },
      });
      const coalBtn = el('button', {
        class: 'btn btn-gold btn-xs',
        text: '🤝 Coalition Studio',
        title: 'Jump to the interactive Coalition Maker',
        onclick: () => {
          const studio = document.querySelector('.coalition');
          if (studio) {
            sfx.click(660);
            studio.scrollIntoView({ behavior: 'smooth', block: 'center' });
            studio.style.boxShadow = '0 0 0 3px var(--gold), 0 0 28px rgba(245,184,46,0.6)';
            setTimeout(() => (studio.style.boxShadow = ''), 1600);
          }
        },
      });
      const sfxBtn = el('button', {
        class: 'btn btn-xs active',
        text: '🔊 SFX On',
        onclick: () => {
          sfx.enabled = !sfx.enabled;
          sfxBtn.textContent = sfx.enabled ? '🔊 SFX On' : '🔇 SFX Off';
          sfxBtn.classList.toggle('active', sfx.enabled);
          if (sfx.enabled) sfx.click(600);
        },
      });
      hud.appendChild(themeBtn);
      hud.appendChild(ideoBtn);
      hud.appendChild(coalBtn);
      hud.appendChild(sfxBtn);
    }

    function open(id) {
      const m = ES.countries.find((c) => c.id === id) || ES.countries[0];
      if (!m) return;
      if (current && current.destroy) current.destroy();
      current = m;
      ES.activeCountryId = m.id;
      nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === m.id));
      app.innerHTML = '';
      const head = el('div', { class: 'country-head' }, [
        el('div', { class: 'country-head-left' }, [
          ES.flag(m.id, 32) || el('span', { class: 'flag', text: m.flag || '' }),
          el('div', {}, [el('h2', { text: m.title || m.name }), m.subtitle ? el('div', { class: 'muted', text: m.subtitle }) : null]),
        ]),
        el('div', { class: 'row', style: { gap: '8px' } }, [
          el('button', {
            class: 'btn',
            text: '🧭 Party Ideologies & Spectrum',
            onclick: () => {
              ES.openIdeologyModal(m.id, () => open(m.id));
            },
          }),
          m.id !== 'usa'
            ? el('button', {
                class: 'btn btn-gold',
                text: '🤝 Build Governing Coalition',
                onclick: () => {
                  const studio = document.querySelector('.coalition');
                  if (studio) {
                    sfx.click(660);
                    studio.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    studio.style.boxShadow = '0 0 0 3px var(--gold), 0 0 28px rgba(245,184,46,0.6)';
                    setTimeout(() => (studio.style.boxShadow = ''), 1600);
                  }
                },
              })
            : null,
        ]),
      ]);
      app.appendChild(head);
      const body = el('div', { class: 'country-body' });
      app.appendChild(body);
      try {
        m.render(body);
      } catch (err) {
        console.error(err);
        body.appendChild(ui.note('Error rendering this simulator: ' + err.message, 'warn'));
      }
      if (location.hash.slice(1) !== m.id) history.replaceState(null, '', '#' + m.id);
    }
    ES.countries.forEach((c) => {
      const b = el('button', { 'data-id': c.id }, [ES.flag(c.id, 15) || el('span', { class: 'flag', text: c.flag || '' }), el('span', { text: c.name })]);
      b.addEventListener('click', () => { sfx.click(540); open(c.id); });
      nav.appendChild(b);
    });
    window.addEventListener('hashchange', () => { if (!current || location.hash.slice(1) !== current.id) open(location.hash.slice(1)); });
    open(location.hash.slice(1));
  };
})();
