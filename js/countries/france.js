/* =========================================================================
   France – 2027 Presidential & Legislative Elections (Two-Round System)
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, fmtInt, sum, normalize, clone, rng, noise, textOn } = ES.util;
  const ui = ES.ui;

  /* -----------------------------------------------------------------------
     Inject France-specific styles once
     ----------------------------------------------------------------------- */
  if (!document.getElementById('es-france-css')) {
    const st = document.createElement('style');
    st.id = 'es-france-css';
    st.textContent = `
      .fr-mode-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 10px 16px; }
      .fr-mode-bar .segmented button { font-weight: 600; padding: 8px 16px; font-size: 13.5px; }
      .fr-cand-checks { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .fr-cand-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border-radius: 999px; background: var(--bg2); border: 1px solid var(--line); color: var(--text); font-size: 12px; cursor: pointer; user-select: none; transition: 0.15s; }
      .fr-cand-chip.off { opacity: 0.42; text-decoration: line-through; }
      .fr-cand-chip.on { border-color: var(--c, var(--accent)); background: color-mix(in srgb, var(--c, var(--accent)) 22%, var(--bg2)); }
      .fr-r1-bars { display: flex; flex-direction: column; gap: 7px; }
      .fr-r1-row { display: grid; grid-template-columns: minmax(145px, 195px) 1fr 56px 96px; gap: 8px; align-items: center; font-size: 12.5px; }
      @media (max-width: 640px) { .fr-r1-row { grid-template-columns: 130px 1fr 48px; } .fr-r1-row .fr-qbadge { display: none; } }
      .fr-r1-track { height: 18px; background: var(--bg2); border-radius: 6px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.05); }
      .fr-r1-fill { height: 100%; border-radius: 5px; transition: width 0.25s; }
      .fr-r1-50line { position: absolute; top: 0; bottom: 0; left: 50%; width: 1.5px; background: rgba(255,255,255,0.45); pointer-events: none; }
      .fr-matrix { width: 100%; border-collapse: collapse; font-size: 12px; }
      .fr-matrix th { text-align: left; color: var(--muted); font-size: 11px; text-transform: uppercase; padding: 6px 6px; border-bottom: 1px solid var(--line); }
      .fr-matrix td { padding: 6px 6px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
      .fr-matrix input[type="number"] { width: 54px; padding: 3px 5px; font-size: 12px; }
      .fr-transfer-mini { display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--track-bg); min-width: 70px; }
      .fr-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 8px; margin-bottom: 12px; }
      .fr-kpi { background: var(--bg2); border: 1px solid var(--line); border-radius: 9px; padding: 9px 11px; display: flex; flex-direction: column; gap: 2px; }
      .fr-kpi .kval { font-size: 20px; font-weight: 800; color: var(--text); }
      .fr-kpi .klbl { font-size: 11px; color: var(--muted); }
      .fr-alliance-list { display: flex; flex-direction: column; gap: 8px; }
      .fr-alliance-item { background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 11px; display: flex; flex-direction: column; gap: 3px; }
      .fr-alliance-item label.check { font-weight: 600; font-size: 13px; }
      .fr-param-row { display: grid; grid-template-columns: 165px 1fr auto; gap: 10px; align-items: center; margin-top: 8px; }
    `;
    document.head.appendChild(st);
  }

  /* -----------------------------------------------------------------------
     1. PRESIDENTIAL ELECTION DATA (2027 Two-Round System)
     ----------------------------------------------------------------------- */
  const PRES_CANDIDATES = [
    { id: 'rn', name: 'Jordan Bardella', altName: 'Marine Le Pen', party: 'Rassemblement National (RN)', shortParty: 'RN', color: '#3b4cca', bloc: 'farright', pos: 88, base: 35.0 },
    { id: 'philippe', name: 'Édouard Philippe', party: 'Horizons / Ensemble', shortParty: 'Horizons', color: '#38bdf8', bloc: 'centre', pos: 56, base: 16.0 },
    { id: 'melenchon', name: 'Jean-Luc Mélenchon', party: 'La France Insoumise (LFI)', shortParty: 'LFI', color: '#cc2443', bloc: 'left', pos: 14, base: 12.5 },
    { id: 'glucksmann', name: 'Raphaël Glucksmann', party: 'Place Publique / PS', shortParty: 'PS–PP', color: '#ec4899', bloc: 'left', pos: 32, base: 11.0 },
    { id: 'attal', name: 'Gabriel Attal', party: 'Renaissance (Ensemble)', shortParty: 'Renaissance', color: '#f59e0b', bloc: 'centre', pos: 49, base: 9.0 },
    { id: 'retailleau', name: 'Bruno Retailleau', party: 'Les Républicains (LR)', shortParty: 'LR', color: '#2563eb', bloc: 'right', pos: 70, base: 7.5 },
    { id: 'tondelier', name: 'Marine Tondelier', party: 'Les Écologistes (EELV)', shortParty: 'Écologistes', color: '#22c55e', bloc: 'left', pos: 25, base: 3.5 },
    { id: 'roussel', name: 'Fabien Roussel', party: 'Parti Communiste Français (PCF)', shortParty: 'PCF', color: '#dc2626', bloc: 'left', pos: 18, base: 2.0 },
    { id: 'zemmour', name: 'Éric Zemmour', party: 'Reconquête (R!)', shortParty: 'Reconquête', color: '#7c3aed', bloc: 'farright', pos: 96, base: 2.0 },
    { id: 'nda', name: 'Nicolas Dupont-Aignan', party: 'Debout la France (DLF)', shortParty: 'DLF', color: '#0284c7', bloc: 'farright', pos: 82, base: 1.5 },
  ];

  // Realistic second-round voter transfer model (returns [pctToA, pctToB] for voters of `fromId`)
  const SPECIFIC_TRANSFERS = {
    // Matchup: RN vs Philippe (Centre-Right)
    'rn|philippe': {
      attal: [5, 82], glucksmann: [4, 68], tondelier: [4, 58], melenchon: [8, 38],
      roussel: [12, 48], retailleau: [32, 52], nda: [64, 18], zemmour: [82, 8],
    },
    // Matchup: RN vs Attal (Centre)
    'rn|attal': {
      philippe: [8, 80], glucksmann: [4, 70], tondelier: [4, 60], melenchon: [8, 40],
      roussel: [12, 50], retailleau: [38, 44], nda: [66, 16], zemmour: [83, 7],
    },
    // Matchup: RN vs Mélenchon (Radical Left)
    'rn|melenchon': {
      glucksmann: [10, 58], tondelier: [5, 72], roussel: [12, 68], attal: [22, 25],
      philippe: [32, 16], retailleau: [58, 6], nda: [78, 5], zemmour: [90, 2],
    },
    // Matchup: RN vs Glucksmann (Social-Democrat Left)
    'rn|glucksmann': {
      melenchon: [7, 65], tondelier: [3, 82], roussel: [10, 72], attal: [14, 62],
      philippe: [22, 50], retailleau: [48, 22], nda: [72, 10], zemmour: [88, 3],
    },
    // Matchup: RN vs Retailleau (Conservative Right)
    'rn|retailleau': {
      philippe: [6, 76], attal: [6, 68], glucksmann: [5, 48], tondelier: [4, 42],
      melenchon: [8, 26], roussel: [12, 35], nda: [55, 30], zemmour: [76, 15],
    },
    // Matchup: Philippe vs Mélenchon
    'philippe|melenchon': {
      attal: [86, 4], retailleau: [80, 2], glucksmann: [32, 50], tondelier: [20, 65],
      roussel: [18, 68], rn: [48, 12], nda: [52, 10], zemmour: [58, 4],
    },
    // Matchup: Philippe vs Glucksmann
    'philippe|glucksmann': {
      attal: [80, 10], retailleau: [82, 5], melenchon: [8, 70], tondelier: [10, 78],
      roussel: [12, 74], rn: [42, 10], nda: [50, 10], zemmour: [56, 4],
    },
  };

  function defaultPresTransfer(fromId, idA, idB) {
    if (fromId === idA) return [96, 1];
    if (fromId === idB) return [1, 96];
    const directKey = `${idA}|${idB}`;
    if (SPECIFIC_TRANSFERS[directKey] && SPECIFIC_TRANSFERS[directKey][fromId]) {
      return SPECIFIC_TRANSFERS[directKey][fromId].slice();
    }
    const revKey = `${idB}|${idA}`;
    if (SPECIFIC_TRANSFERS[revKey] && SPECIFIC_TRANSFERS[revKey][fromId]) {
      const [toB, toA] = SPECIFIC_TRANSFERS[revKey][fromId];
      return [toA, toB];
    }
    // Ideological distance fallback
    const cFrom = PRES_CANDIDATES.find((c) => c.id === fromId);
    const cA = PRES_CANDIDATES.find((c) => c.id === idA);
    const cB = PRES_CANDIDATES.find((c) => c.id === idB);
    if (!cFrom || !cA || !cB) return [35, 35];
    const dA = Math.abs(cFrom.pos - cA.pos);
    const dB = Math.abs(cFrom.pos - cB.pos);
    const wA = Math.max(2, 100 - dA * 1.15);
    const wB = Math.max(2, 100 - dB * 1.15);
    const turnoutShare = Math.min(86, Math.max(45, 92 - Math.min(dA, dB) * 0.7));
    const toA = Math.round((wA / (wA + wB)) * turnoutShare);
    const toB = Math.round(turnoutShare - toA);
    return [toA, toB];
  }

  /* -----------------------------------------------------------------------
     2. LEGISLATIVE ELECTION DATA (Assemblée nationale – 577 seats)
     ----------------------------------------------------------------------- */
  // Left-to-right ideological order for the 577-seat hemicycle
  const LEG_PARTIES = [
    { id: 'lfi', name: 'La France Insoumise (LFI)', short: 'LFI', leader: 'Jean-Luc Mélenchon / Mathilde Panot', color: '#cc2443', bloc: 'left', base: 11.5 },
    { id: 'pcf', name: 'Parti Communiste (PCF)', short: 'PCF', leader: 'Fabien Roussel', color: '#dc2626', bloc: 'left', base: 2.5 },
    { id: 'eco', name: 'Les Écologistes (EELV)', short: 'Écologistes', leader: 'Marine Tondelier', color: '#22c55e', bloc: 'left', base: 4.5 },
    { id: 'ps', name: 'PS – Place Publique', short: 'PS–PP', leader: 'Olivier Faure / Raphaël Glucksmann', color: '#ec4899', bloc: 'left', base: 10.5 },
    { id: 'ren', name: 'Renaissance', short: 'Renaissance', leader: 'Gabriel Attal', color: '#f59e0b', bloc: 'centre', base: 12.5 },
    { id: 'modem', name: 'MoDem', short: 'MoDem', leader: 'François Bayrou', color: '#f97316', bloc: 'centre', base: 3.5 },
    { id: 'hor', name: 'Horizons', short: 'Horizons', leader: 'Édouard Philippe', color: '#38bdf8', bloc: 'centre', base: 5.5 },
    { id: 'div', name: 'Others / Regionalists (LIOT)', short: 'LIOT / Rég.', leader: 'Laurent Panifous / Régionalistes', color: '#94a3b8', bloc: 'other', base: 3.5 },
    { id: 'lr', name: 'Les Républicains (LR)', short: 'LR', leader: 'Bruno Retailleau', color: '#2563eb', bloc: 'right', base: 8.5 },
    { id: 'udr', name: 'UDR (Droite Ciottiste)', short: 'UDR', leader: 'Éric Ciotti', color: '#0284c7', bloc: 'farright', base: 3.5 },
    { id: 'rn', name: 'Rassemblement National (RN)', short: 'RN', leader: 'Jordan Bardella / Marine Le Pen', color: '#3b4cca', bloc: 'farright', base: 32.0 },
    { id: 'rec', name: 'Reconquête (R!)', short: 'Reconquête', leader: 'Éric Zemmour', color: '#7c3aed', bloc: 'farright', base: 2.0 },
  ];

  // Pre-generate 577 deterministic constituencies across French regions
  const REGIONS_577 = [
    { id: 'FR-11', code: 'IDF', name: 'Île-de-France', seats: 97, bias: { left: 1.28, centre: 1.22, right: 0.92, farright: 0.62, other: 0.5 } },
    { id: 'FR-84', code: 'ARA', name: 'Auvergne-Rhône-Alpes', seats: 69, bias: { left: 0.95, centre: 1.02, right: 1.28, farright: 0.96, other: 0.7 } },
    { id: 'FR-32', code: 'HDF', name: 'Hauts-de-France', seats: 50, bias: { left: 0.92, centre: 0.82, right: 0.88, farright: 1.38, other: 0.6 } },
    { id: 'FR-75', code: 'NAQ', name: 'Nouvelle-Aquitaine', seats: 49, bias: { left: 1.12, centre: 1.05, right: 0.85, farright: 0.96, other: 1.15 } },
    { id: 'FR-76', code: 'OCC', name: 'Occitanie', seats: 49, bias: { left: 1.14, centre: 0.86, right: 0.80, farright: 1.22, other: 0.95 } },
    { id: 'FR-44', code: 'GES', name: 'Grand Est', seats: 49, bias: { left: 0.78, centre: 0.96, right: 1.12, farright: 1.28, other: 0.85 } },
    { id: 'FR-93', code: 'PAC', name: "Provence-Alpes-Côte d'Azur", seats: 42, bias: { left: 0.82, centre: 0.84, right: 1.08, farright: 1.44, other: 0.6 } },
    { id: 'FR-52', code: 'PDL', name: 'Pays de la Loire', seats: 30, bias: { left: 1.02, centre: 1.28, right: 1.05, farright: 0.78, other: 0.6 } },
    { id: 'FR-28', code: 'NOR', name: 'Normandie', seats: 28, bias: { left: 0.98, centre: 1.04, right: 0.92, farright: 1.12, other: 0.6 } },
    { id: 'FR-53', code: 'BRE', name: 'Bretagne', seats: 27, bias: { left: 1.18, centre: 1.26, right: 0.85, farright: 0.68, other: 1.65 } },
    { id: 'FR-27', code: 'BFC', name: 'Bourgogne-Franche-Comté', seats: 23, bias: { left: 0.88, centre: 0.92, right: 1.10, farright: 1.22, other: 0.6 } },
    { id: 'FR-24', code: 'CVL', name: 'Centre-Val de Loire', seats: 22, bias: { left: 0.90, centre: 1.04, right: 1.02, farright: 1.12, other: 0.6 } },
    { id: 'FR-94', code: 'COR', name: 'Corse & Outre-Mer / Étranger', seats: 42, bias: { left: 1.18, centre: 0.94, right: 0.85, farright: 0.82, other: 2.85 } },
  ];
  const REG_MAP = {};
  REGIONS_577.forEach((r) => (REG_MAP[r.id] = r));

  const CONSTITUENCIES = (function buildConstituencies() {
    const rnd = rng('france-leg-577-v3');
    const list = [];
    let cid = 1;
    REGIONS_577.forEach((reg) => {
      for (let i = 0; i < reg.seats; i++) {
        // Archetype factor representing local political geography & incumbency
        const u = rnd();
        const arch = u < 0.24 ? 'urban_left'
          : u < 0.44 ? 'affluent_centre'
          : u < 0.55 ? 'lr_stronghold'
          : u < 0.81 ? 'periurban_rn'
          : u < 0.95 ? 'mixed_swing'
          : 'regional_stronghold';

        const mult = {};
        LEG_PARTIES.forEach((p) => {
          let m = reg.bias[p.bloc] || 1.0;
          if (arch === 'urban_left') {
            if (p.id === 'lfi') m *= 1.60;
            else if (p.id === 'eco' || p.id === 'ps') m *= 1.50;
            else if (p.bloc === 'farright') m *= 0.48;
          } else if (arch === 'affluent_centre') {
            if (p.bloc === 'centre') m *= 1.62;
            else if (p.id === 'lr') m *= 1.20;
            else if (p.id === 'lfi' || p.bloc === 'farright') m *= 0.58;
          } else if (arch === 'lr_stronghold') {
            if (p.id === 'lr') m *= 3.45;
            else if (p.bloc === 'centre') m *= 0.65;
            else if (p.bloc === 'left') m *= 0.62;
            else if (p.bloc === 'farright') m *= 0.78;
          } else if (arch === 'periurban_rn') {
            if (p.id === 'rn' || p.id === 'udr') m *= 1.32;
            else if (p.bloc === 'centre') m *= 0.78;
            else if (p.bloc === 'left') m *= 0.80;
          } else if (arch === 'regional_stronghold') {
            if (p.id === 'div') m *= 7.5;
            else if (p.id === 'pcf' && rnd() < 0.3) m *= 4.2;
            else if (p.bloc === 'farright') m *= 0.60;
          }
          // Smooth multiplicative local noise
          const n = Math.exp(noise(rnd) * 0.24);
          mult[p.id] = Math.max(0.15, m * n);
        });

        list.push({
          id: cid++,
          regId: reg.id,
          region: reg.name,
          num: i + 1,
          mult,
          turnoutMod: 0.92 + rnd() * 0.16,
          repRoll: rnd() * 100, // compared against state.leg.repFront (0..100)
          leftSlot: rnd(),
          centreSlot: rnd(),
          frSlot: rnd(),
        });
      }
    });
    return list;
  })();

  function simulateLegislative(legState) {
    const nat = normalize(legState.votes, 100);
    const turnout = Math.max(40, Math.min(90, +legState.turnout || 66.5));
    const repFront = Math.max(0, Math.min(100, +legState.repFront || 0));
    const regOverrides = legState.regOverrides || {};

    // Precompute cumulative slot probabilities for alliance nominations
    function makeSlotPicker(ids) {
      const tot = ids.reduce((a, id) => a + (nat[id] || 0), 0);
      let acc = 0;
      return ids.map((id) => {
        acc += tot > 0 ? (nat[id] || 0) / tot : 1 / ids.length;
        return { id, cum: acc };
      });
    }
    const leftSlots = makeSlotPicker(['lfi', 'ps', 'eco', 'pcf']);
    const centreSlots = makeSlotPicker(['ren', 'hor', 'modem']);
    const frSlots = makeSlotPicker(['rn', 'udr']);

    const pickFrom = (slots, u) => (slots.find((s) => u <= s.cum) || slots[slots.length - 1]).id;

    const r1Seats = {};
    const r2Seats = {};
    const totalSeats = {};
    const regSeats = {};
    REGIONS_577.forEach((r) => {
      regSeats[r.id] = {};
      LEG_PARTIES.forEach((p) => (regSeats[r.id][p.id] = 0));
    });
    LEG_PARTIES.forEach((p) => { r1Seats[p.id] = 0; r2Seats[p.id] = 0; totalSeats[p.id] = 0; });

    let countR1Wins = 0;
    let countDuels = 0;
    let countTriangulars = 0;
    let countQuadrangulars = 0;
    let countWithdrawals = 0;

    const partyById = {};
    LEG_PARTIES.forEach((p) => (partyById[p.id] = p));

    CONSTITUENCIES.forEach((c) => {
      // 1. Raw local party support
      const raw = {};
      const forcedParty = regOverrides[c.regId];
      LEG_PARTIES.forEach((p) => {
        let boost = 1.0;
        if (forcedParty) {
          boost = p.id === forcedParty ? 2.4 : 0.65;
        }
        raw[p.id] = (nat[p.id] || 0) * c.mult[p.id] * boost;
      });

      // 2. Apply Round 1 pre-electoral alliances (joint single candidate per constituency)
      const r1 = clone(raw);
      if (legState.nfp) {
        const nom = pickFrom(leftSlots, c.leftSlot);
        const sumLeft = (r1.lfi || 0) + (r1.ps || 0) + (r1.eco || 0) + (r1.pcf || 0);
        ['lfi', 'ps', 'eco', 'pcf'].forEach((id) => (r1[id] = 0));
        // If LFI is the nominee, slight centrist leakage (~6%); otherwise ~97% retention
        const retain = nom === 'lfi' ? 0.94 : 0.97;
        r1[nom] = sumLeft * retain;
      }
      if (legState.ensemble) {
        const nom = pickFrom(centreSlots, c.centreSlot);
        const sumCentre = (r1.ren || 0) + (r1.hor || 0) + (r1.modem || 0);
        ['ren', 'hor', 'modem'].forEach((id) => (r1[id] = 0));
        r1[nom] = sumCentre * 0.97;
      }
      if (legState.rn_udr) {
        const nom = pickFrom(frSlots, c.frSlot);
        const sumFr = (r1.rn || 0) + (r1.udr || 0);
        r1.rn = 0; r1.udr = 0;
        r1[nom] = sumFr * 0.98;
      }

      const localShares = normalize(r1, 100);
      const localTurnout = Math.max(38, Math.min(88, turnout * c.turnoutMod));
      const qualPctExpressed = (12.5 / localTurnout) * 100;
      const winMinExpressed = Math.max(50.0001, (25.0 / localTurnout) * 100);

      const rankedR1 = Object.entries(localShares)
        .filter(([, v]) => v > 0.01)
        .sort((a, b) => b[1] - a[1]);

      if (rankedR1.length === 0) return;

      // 3. Check Round 1 outright victory (>50% of expressed votes AND >=25% of registered voters)
      if (rankedR1[0][1] >= winMinExpressed) {
        const winId = rankedR1[0][0];
        r1Seats[winId]++;
        totalSeats[winId]++;
        regSeats[c.regId][winId]++;
        countR1Wins++;
        return;
      }

      // 4. Determine Round 2 qualifiers (top 2 + anyone >= 12.5% of registered voters)
      let qualifiers = rankedR1.filter(([, pct], idx) => idx < 2 || pct >= qualPctExpressed).map(([id, pct]) => ({ id, pct, bloc: partyById[id].bloc }));

      // 5. Withdrawals (Désistements) before Round 2
      if (qualifiers.length >= 3) {
        const hasFarRight = qualifiers.some((q) => q.bloc === 'farright');
        const nonFr = qualifiers.filter((q) => q.bloc !== 'farright');

        // Republican Front withdrawal against Far-Right when 3+ candidates qualify
        if (hasFarRight && nonFr.length >= 2 && c.repRoll < repFront) {
          const leadNonFr = nonFr[0].id;
          const beforeLen = qualifiers.length;
          qualifiers = qualifiers.filter((q) => q.bloc === 'farright' || q.id === leadNonFr);
          if (qualifiers.length < beforeLen) countWithdrawals += beforeLen - qualifiers.length;
        } else {
          // Intra-bloc withdrawal if two Left or two Centre candidates qualified separately
          const seenBlocs = new Set();
          const filtered = [];
          qualifiers.forEach((q) => {
            if ((q.bloc === 'left' || q.bloc === 'centre') && seenBlocs.has(q.bloc) && c.repRoll < 75) {
              countWithdrawals++;
            } else {
              seenBlocs.add(q.bloc);
              filtered.push(q);
            }
          });
          qualifiers = filtered;
        }
      }

      if (qualifiers.length === 2) countDuels++;
      else if (qualifiers.length === 3) countTriangulars++;
      else countQuadrangulars++;

      // 6. Simulate Round 2 vote transfers among remaining finalists
      const r2Votes = {};
      qualifiers.forEach((q) => (r2Votes[q.id] = q.pct * 0.96));

      const qualIds = new Set(qualifiers.map((q) => q.id));
      const hasFrFinalist = qualifiers.some((q) => q.bloc === 'farright');
      const repDiscipline = 0.45 + (repFront / 100) * 0.65; // how strongly non-FR voters rally in R2

      rankedR1.forEach(([elimId, elimPct]) => {
        if (qualIds.has(elimId)) return;
        const elimBloc = partyById[elimId].bloc;

        // Compute transfer weights to each finalist
        const weights = {};
        let wSum = 0;
        qualifiers.forEach((q) => {
          let w = 0.04;
          if (q.bloc === elimBloc) {
            w = 0.85;
          } else if (elimBloc === 'left') {
            if (q.bloc === 'centre') w = hasFrFinalist ? 0.68 * repDiscipline : 0.25;
            else if (q.bloc === 'right') w = hasFrFinalist ? 0.56 * repDiscipline : 0.14;
            else if (q.bloc === 'other') w = 0.55;
            else if (q.bloc === 'farright') w = 0.05;
          } else if (elimBloc === 'centre') {
            if (q.bloc === 'right') w = 0.72;
            else if (q.bloc === 'left') w = hasFrFinalist ? (q.id === 'lfi' ? 0.42 : 0.68) * repDiscipline : 0.20;
            else if (q.bloc === 'other') w = 0.58;
            else if (q.bloc === 'farright') w = 0.11;
          } else if (elimBloc === 'right') {
            if (q.bloc === 'centre') w = 0.66;
            else if (q.bloc === 'farright') w = 0.30;
            else if (q.bloc === 'other') w = 0.45;
            else if (q.bloc === 'left') w = q.id === 'lfi' ? 0.05 : 0.22 * repDiscipline;
          } else if (elimBloc === 'farright') {
            if (q.bloc === 'right') w = 0.48;
            else if (q.bloc === 'centre') w = 0.12;
            else if (q.bloc === 'left') w = 0.04;
            else if (q.bloc === 'other') w = 0.18;
          } else {
            w = 0.32;
          }
          weights[q.id] = w;
          wSum += w;
        });

        const maxTransfer = Math.min(0.88, wSum);
        qualifiers.forEach((q) => {
          const share = wSum > 0 ? (weights[q.id] / wSum) * maxTransfer : 0;
          r2Votes[q.id] += elimPct * share;
        });
      });

      const winId = ES.util.argmax(r2Votes);
      r2Seats[winId]++;
      totalSeats[winId]++;
      regSeats[c.regId][winId]++;
    });

    return {
      nat,
      r1Seats,
      r2Seats,
      totalSeats,
      regSeats,
      countR1Wins,
      countDuels,
      countTriangulars,
      countQuadrangulars,
      countWithdrawals,
      qualPctExpressed: (12.5 / turnout) * 100,
    };
  }

  /* -----------------------------------------------------------------------
     MODULE STATE
     ----------------------------------------------------------------------- */
  let state = null;

  function initState() {
    const presVotes = {};
    const presActive = {};
    PRES_CANDIDATES.forEach((c) => {
      presVotes[c.id] = c.base;
      presActive[c.id] = true;
    });

    const legVotes = {};
    LEG_PARTIES.forEach((p) => (legVotes[p.id] = p.base));

    return {
      mode: location.search.includes('mode=leg') ? 'leg' : 'pres', // 'pres' | 'leg'
      pres: {
        rnLeader: 'bardella', // 'bardella' | 'lepen'
        votes: presVotes,
        active: presActive,
        customTransfers: {}, // key: `${idA}|${idB}|${fromId}` -> [toA, toB]
        r2Override: false,
        r2SliderA: 50.0,
        mapRound: 'r2', // 'r1' | 'r2'
        regWinnerOverride: {}, // regId -> candId
      },
      leg: {
        votes: legVotes,
        nfp: true,
        ensemble: true,
        rn_udr: true,
        turnout: 66.7,
        repFront: 75,
        brush: 'cycle',
        regOverrides: {}, // regId -> partyId
      },
    };
  }

  function getCandName(c) {
    if (c.id === 'rn') return state.pres.rnLeader === 'lepen' ? c.altName : c.name;
    return c.name;
  }

  /* -----------------------------------------------------------------------
     RENDER ENTRY POINT
     ----------------------------------------------------------------------- */
  function render(root) {
    if (!state) state = initState();
    root.innerHTML = '';

    // Top mode switcher bar
    const modeBar = el('div', { class: 'fr-mode-bar' }, [
      el('div', { class: 'row' }, [
        el('span', { class: 'muted small', style: { fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }, text: 'Election Type:' }),
        ui.segmented(
          [
            { value: 'pres', label: '🗳️ 2027 Presidential Election (2 Rounds)' },
            { value: 'leg', label: '🏛️ 2027 Legislative – Assemblée nationale (577 Seats)' },
          ],
          state.mode,
          (v) => {
            state.mode = v;
            render(root);
          }
        ),
      ]),
      el('div', { class: 'muted small', text: state.mode === 'pres' ? 'Direct universal suffrage · Two-round runoff system' : '577 single-member constituencies · Two-round system (12.5% of registered voters for R2)' }),
    ]);
    root.appendChild(modeBar);

    const bodyWrap = el('div');
    root.appendChild(bodyWrap);

    if (state.mode === 'pres') renderPresidential(bodyWrap, () => render(root));
    else renderLegislative(bodyWrap, () => render(root));
  }

  /* =======================================================================
     MODE 1: 2027 PRESIDENTIAL ELECTION
     ======================================================================= */
  function renderPresidential(container, fullRebuild) {
    const L = ui.layout();
    container.appendChild(L.root);

    // --- Left Column: Scenario Presets, RN Candidate Toggle, Active Checkboxes, R1 Sliders ---
    const scenCard = ui.card('Scenarios & Candidate Field');
    L.left.appendChild(scenCard.card);

    // RN candidate quick swap
    const rnRow = el('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--line)' } }, [
      el('span', { class: 'small', html: '<b>RN Candidate:</b>' }),
      ui.segmented(
        [
          { value: 'bardella', label: 'Jordan Bardella (RN)' },
          { value: 'lepen', label: 'Marine Le Pen (RN)' },
        ],
        state.pres.rnLeader,
        (v) => {
          state.pres.rnLeader = v;
          fullRebuild();
        }
      ),
    ]);
    scenCard.body.appendChild(rnRow);

    function applyPresPreset(kind) {
      PRES_CANDIDATES.forEach((c) => {
        state.pres.active[c.id] = true;
        state.pres.votes[c.id] = c.base;
      });
      state.pres.r2Override = false;
      if (kind === 'united_centre_philippe') {
        state.pres.active.attal = false;
        Object.assign(state.pres.votes, { rn: 35.0, philippe: 23.5, melenchon: 13.0, glucksmann: 11.5, retailleau: 8.0, tondelier: 3.5, roussel: 2.0, zemmour: 2.0, nda: 1.5 });
      } else if (kind === 'united_centre_attal') {
        state.pres.active.philippe = false;
        Object.assign(state.pres.votes, { rn: 35.5, attal: 21.5, melenchon: 13.0, glucksmann: 11.5, retailleau: 9.5, tondelier: 3.5, roussel: 2.0, zemmour: 2.0, nda: 1.5 });
      } else if (kind === 'united_left_glucksmann') {
        state.pres.active.tondelier = false;
        state.pres.active.roussel = false;
        state.pres.active.attal = false;
        Object.assign(state.pres.votes, { rn: 35.0, philippe: 22.5, glucksmann: 17.5, melenchon: 12.0, retailleau: 9.0, zemmour: 2.5, nda: 1.5 });
      } else if (kind === 'united_left_melenchon') {
        state.pres.active.glucksmann = false;
        state.pres.active.tondelier = false;
        state.pres.active.roussel = false;
        Object.assign(state.pres.votes, { rn: 35.0, melenchon: 22.0, philippe: 17.5, attal: 9.5, retailleau: 11.0, zemmour: 3.0, nda: 2.0 });
      }
      fullRebuild();
    }

    scenCard.body.appendChild(el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Preset Round 1 configurations:' }));
    scenCard.body.appendChild(el('div', { class: 'row', style: { marginBottom: '12px' } }, [
      el('button', { class: 'btn btn-xs', text: '2027 Baseline (All 10)', onclick: () => applyPresPreset('baseline') }),
      el('button', { class: 'btn btn-xs', text: 'United Centre (Philippe)', onclick: () => applyPresPreset('united_centre_philippe') }),
      el('button', { class: 'btn btn-xs', text: 'United Centre (Attal)', onclick: () => applyPresPreset('united_centre_attal') }),
      el('button', { class: 'btn btn-xs', text: 'PS–Eco–PCF Joint + Philippe', onclick: () => applyPresPreset('united_left_glucksmann') }),
      el('button', { class: 'btn btn-xs', text: 'Single Left (Mélenchon)', onclick: () => applyPresPreset('united_left_melenchon') }),
    ]));

    scenCard.body.appendChild(el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Click to include / exclude candidates in Round 1:' }));
    const checksWrap = el('div', { class: 'fr-cand-checks' });
    PRES_CANDIDATES.forEach((c) => {
      const isOn = !!state.pres.active[c.id];
      const chip = el('label', { class: 'fr-cand-chip ' + (isOn ? 'on' : 'off'), style: { '--c': c.color } }, [
        el('input', {
          type: 'checkbox',
          checked: isOn,
          onchange: (e) => {
            const activeCount = PRES_CANDIDATES.filter((x) => state.pres.active[x.id]).length;
            if (!e.target.checked && activeCount <= 2) {
              e.target.checked = true;
              return;
            }
            state.pres.active[c.id] = e.target.checked;
            fullRebuild();
          },
        }),
        el('span', { class: 'swatch', style: { background: c.color } }),
        el('span', { text: `${getCandName(c).split(' ').pop()} (${c.shortParty})` }),
      ]);
      checksWrap.appendChild(chip);
    });
    scenCard.body.appendChild(checksWrap);

    // Active candidates list for Round 1 sliders
    const activeCands = PRES_CANDIDATES.filter((c) => state.pres.active[c.id]).map((c) => ({
      id: c.id,
      name: getCandName(c),
      leader: c.party,
      color: c.color,
    }));

    const activeValues = {};
    activeCands.forEach((c) => (activeValues[c.id] = state.pres.votes[c.id] || 0));

    const r1Card = ui.card('Round 1 Vote Shares (%)');
    L.left.appendChild(r1Card.card);
    const sliderCtrl = ui.sliders(activeCands, activeValues, {
      max: 60,
      step: 0.5,
      showOthers: false,
      onChange: (vals) => {
        for (const k in vals) state.pres.votes[k] = vals[k];
        updatePres();
      },
    });
    r1Card.body.appendChild(sliderCtrl.el);

    // --- Right Column: Hero Runoff Cards, Regional Map, Round 1 Chart, Vote-Transfer Matrix ---
    const heroCard = ui.card('Presidential Outcome & Second Round Runoff');
    L.right.appendChild(heroCard.card);
    const heroBody = el('div');
    heroCard.body.appendChild(heroBody);

    // Interactive France Regional Map for Presidential Election
    const presMapHeader = ui.segmented(
      [
        { value: 'r1', label: 'Round 1 Leader' },
        { value: 'r2', label: 'Round 2 Runoff Winner' },
      ],
      state.pres.mapRound,
      (v) => {
        state.pres.mapRound = v;
        updatePres();
      }
    );
    const presMapCard = ui.card('Interactive Map of French Regions (Click a Region to Flip Winner)', '', presMapHeader);
    L.right.appendChild(presMapCard.card);
    const presMapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const presMapWrap = el('div', { class: 'map-wrap' });
    const presMapSide = el('div');
    presMapGrid.appendChild(presMapWrap);
    presMapGrid.appendChild(presMapSide);
    presMapCard.body.appendChild(presMapGrid);

    const r1ChartCard = ui.card('First Round (Premier Tour) – Qualification for Runoff');
    L.right.appendChild(r1ChartCard.card);
    const r1ChartBody = el('div');
    r1ChartCard.body.appendChild(r1ChartBody);

    const matrixCard = ui.card('Second Round Vote-Transfer Matrix (Report de Voix)');
    L.right.appendChild(matrixCard.card);
    const matrixBody = el('div');
    matrixCard.body.appendChild(matrixBody);

    const presTip = ui.tooltip();
    let presRegPaths = null;
    if (window.GEO_FR && window.GEO_FR.features) {
      const W = 440, H = 420;
      const svg = d3.select(presMapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
      const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_FR);
      const path = d3.geoPath(proj);
      presRegPaths = svg.append('g')
        .selectAll('path')
        .data(window.GEO_FR.features)
        .join('path')
        .attr('class', 'unit')
        .attr('d', path);
      svg.append('g')
        .selectAll('text')
        .data(window.GEO_FR.features)
        .join('text')
        .attr('transform', (d) => `translate(${path.centroid(d)})`)
        .text((d) => (REG_MAP[d.properties.id] || {}).code || d.properties.code);
    }

    let lastPairKey = '';

    function computePresResults() {
      const rawActive = {};
      activeCands.forEach((c) => (rawActive[c.id] = Math.max(0, +state.pres.votes[c.id] || 0)));
      const normR1 = normalize(rawActive, 100);
      const ranked = Object.entries(normR1)
        .map(([id, pct]) => {
          const meta = PRES_CANDIDATES.find((x) => x.id === id);
          return { id, name: getCandName(meta), party: meta.party, shortParty: meta.shortParty, color: meta.color, r1: pct };
        })
        .sort((a, b) => b.r1 - a.r1);

      const top1 = ranked[0];
      const top2 = ranked[1] || ranked[0];
      const outrightR1 = top1.r1 > 50.0;

      // Compute Round 2 via transfer matrix
      let r2RawA = 0;
      let r2RawB = 0;
      let r2Abstain = 0;
      const transfers = {};

      ranked.forEach((c) => {
        const key = `${top1.id}|${top2.id}|${c.id}`;
        const [toA, toB] = state.pres.customTransfers[key] || defaultPresTransfer(c.id, top1.id, top2.id);
        const abst = Math.max(0, 100 - toA - toB);
        transfers[c.id] = { toA, toB, abst };
        r2RawA += (c.r1 * toA) / 100;
        r2RawB += (c.r1 * toB) / 100;
        r2Abstain += (c.r1 * abst) / 100;
      });

      const expSum = r2RawA + r2RawB;
      let r2PctA = expSum > 0 ? (r2RawA / expSum) * 100 : 50;
      let r2PctB = 100 - r2PctA;

      if (state.pres.r2Override) {
        r2PctA = Math.max(0, Math.min(100, +state.pres.r2SliderA || 50));
        r2PctB = 100 - r2PctA;
      }

      const winner = outrightR1 ? top1 : r2PctA >= r2PctB ? top1 : top2;
      return { ranked, top1, top2, outrightR1, r2PctA, r2PctB, r2Abstain, transfers, winner };
    }

    function updatePres() {
      const res = computePresResults();
      const { ranked, top1, top2, outrightR1, r2PctA, r2PctB, r2Abstain, transfers, winner } = res;
      const pairKey = `${top1.id}|${top2.id}`;

      // 1. Hero Card (Candidate cards + Duel Bar + 2-Candidate Semicircle)
      heroBody.innerHTML = '';
      const candsGrid = el('div', { class: 'cands', style: { marginBottom: '12px' } });

      [
        { c: top1, r2: r2PctA },
        { c: top2, r2: r2PctB },
      ].forEach(({ c, r2 }) => {
        const isWin = winner.id === c.id;
        candsGrid.appendChild(
          el('div', { class: 'cand' + (isWin ? ' win' : ''), style: { '--c': c.color } }, [
            el('div', { class: 'cname', text: c.name }),
            el('div', { class: 'cparty', text: `${c.party} · R1: ${fmt(c.r1)}%` }),
            el('div', { class: 'cval', style: { color: c.color }, text: outrightR1 && isWin ? `${fmt(c.r1)}% (R1)` : `${fmt(r2)}%` }),
            el('div', { class: 'row' }, [
              isWin
                ? el('span', { class: 'badge', text: outrightR1 ? 'ELECTED IN ROUND 1 (>50%)' : 'ELECTED PRESIDENT (ROUND 2)' })
                : el('span', { class: 'badge out', text: outrightR1 ? 'ELIMINATED IN R1' : 'RUNNER-UP' }),
            ]),
          ])
        );
      });
      heroBody.appendChild(candsGrid);

      // Duel bar & Gauge layout
      const duelGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
      const duelLeft = el('div');

      const duelBar = el('div', { class: 'seatbar-wrap' }, [
        el('div', { class: 'seatbar' }, [
          el('div', { class: 'seg', style: { width: r2PctA + '%', background: top1.color, color: textOn(top1.color) }, text: r2PctA > 10 ? `${fmt(r2PctA)}%` : '' }),
          el('div', { class: 'seg', style: { width: r2PctB + '%', background: top2.color, color: textOn(top2.color) }, text: r2PctB > 10 ? `${fmt(r2PctB)}%` : '' }),
          el('div', { class: 'majline', style: { left: '50%' } }),
        ]),
        el('div', { class: 'seatbar-label', text: `Second Round Runoff: ${fmt(r2PctA)}% vs ${fmt(r2PctB)}% (50.0% to win · Est. Blank/Abstention: ${fmt(r2Abstain)}%)` }),
      ]);
      duelLeft.appendChild(duelBar);

      // Direct Round 2 override controls
      const ovWrap = el('div', { style: { marginTop: '10px', padding: '10px', background: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--line)' } });
      const ovCheck = el('label', { class: 'check small', style: { fontWeight: '600' } }, [
        el('input', {
          type: 'checkbox',
          checked: state.pres.r2Override,
          onchange: (e) => {
            state.pres.r2Override = e.target.checked;
            if (state.pres.r2Override) state.pres.r2SliderA = Math.round(r2PctA * 10) / 10;
            updatePres();
          },
        }),
        `Manual Round 2 Runoff Slider Override (${top1.name.split(' ').pop()} % vs ${top2.name.split(' ').pop()} %)`,
      ]);
      ovWrap.appendChild(ovCheck);

      if (state.pres.r2Override) {
        const r2Range = el('input', {
          type: 'range',
          min: 20,
          max: 80,
          step: 0.1,
          value: r2PctA,
          style: { marginTop: '8px', '--c': top1.color, background: `linear-gradient(90deg, ${top1.color} ${r2PctA}%, ${top2.color} ${r2PctA}%)` },
          oninput: (e) => {
            state.pres.r2SliderA = +e.target.value;
            updatePres();
          },
        });
        ovWrap.appendChild(r2Range);
      }
      duelLeft.appendChild(ovWrap);

      const statusHtml = outrightR1
        ? `<b style="color:${top1.color}">${top1.name}</b> wins the Presidency outright in the <b>First Round</b> with <b>${fmt(top1.r1)}%</b> (>50% of expressed votes). No second round is needed.`
        : `<b style="color:${winner.color}">${winner.name}</b> (${winner.shortParty}) defeats <b>${winner.id === top1.id ? top2.name : top1.name}</b> in the Second Round runoff by <b>${fmt(Math.max(r2PctA, r2PctB))}%</b> to <b>${fmt(Math.min(r2PctA, r2PctB))}%</b> (margin: +${fmt(Math.abs(r2PctA - r2PctB))} pts).`;
      duelLeft.appendChild(el('div', { style: { marginTop: '10px' } }, ui.note(statusHtml, 'info')));

      const gaugeBox = el('div');
      ES.hemicycle(
        gaugeBox,
        [
          { id: top1.id, name: `${top1.name} (${fmt(r2PctA)}%)`, leader: top1.party, color: top1.color, seats: Math.round(r2PctA * 2) },
          { id: top2.id, name: `${top2.name} (${fmt(r2PctB)}%)`, leader: top2.party, color: top2.color, seats: 200 - Math.round(r2PctA * 2) },
        ],
        {
          total: 200,
          majority: 101,
          centerLabel: `${fmt(Math.max(r2PctA, r2PctB))}%`,
          subtitle: `${winner.name.split(' ').pop()} wins R2`,
        }
      );

      duelGrid.appendChild(duelLeft);
      duelGrid.appendChild(gaugeBox);
      heroBody.appendChild(duelGrid);

      // 2. Round 1 Horizontal Bar Chart
      r1ChartBody.innerHTML = '';
      const barsWrap = el('div', { class: 'fr-r1-bars' });
      const maxBar = Math.max(55, ranked[0].r1 + 5);
      ranked.forEach((c, idx) => {
        const qual = outrightR1 ? idx === 0 : idx < 2;
        const barPct = Math.min(100, (c.r1 / maxBar) * 100);
        barsWrap.appendChild(
          el('div', { class: 'fr-r1-row' }, [
            el('div', { class: 'slider-label' }, [
              el('span', { class: 'swatch', style: { background: c.color } }),
              el('div', { class: 'slider-names' }, [
                el('span', { class: 'pname', text: c.name }),
                el('span', { class: 'pleader', text: c.shortParty }),
              ]),
            ]),
            el('div', { class: 'fr-r1-track' }, [
              el('div', { class: 'fr-r1-fill', style: { width: barPct + '%', background: c.color } }),
            ]),
            el('div', { style: { textAlign: 'right', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }, text: `${fmt(c.r1)}%` }),
            el('div', { class: 'fr-qbadge', style: { textAlign: 'right' } }, [
              qual
                ? el('span', { class: 'badge', text: outrightR1 ? 'R1 WINNER' : 'R2 QUALIFIED' })
                : el('span', { class: 'badge out', text: 'Eliminated' }),
            ]),
          ])
        );
      });
      r1ChartBody.appendChild(barsWrap);

      // 3. Update Presidential Regional Map
      if (presRegPaths) {
        const regData = {};
        REGIONS_577.forEach((reg) => {
          // Compute regional R1 & R2 shares using regional bloc bias
          const regR1Raw = {};
          ranked.forEach((c) => {
            const meta = PRES_CANDIDATES.find((x) => x.id === c.id);
            const bias = reg.bias[meta.bloc] || 1.0;
            regR1Raw[c.id] = c.r1 * bias;
          });
          const regR1 = normalize(regR1Raw, 100);
          const regR1Ranked = Object.entries(regR1)
            .map(([id, pct]) => ({ id, pct, cand: ranked.find((x) => x.id === id) }))
            .sort((a, b) => b.pct - a.pct);

          const metaA = PRES_CANDIDATES.find((x) => x.id === top1.id);
          const metaB = PRES_CANDIDATES.find((x) => x.id === top2.id);
          const wA = r2PctA * (reg.bias[metaA.bloc] || 1.0);
          const wB = r2PctB * (reg.bias[metaB.bloc] || 1.0);
          const regR2A = wA + wB > 0 ? (wA / (wA + wB)) * 100 : 50;
          const regR2B = 100 - regR2A;
          const r2Win = regR2A >= regR2B ? top1 : top2;

          let shownWinner = state.pres.mapRound === 'r1' ? regR1Ranked[0].cand : r2Win;
          const ovId = state.pres.regWinnerOverride[reg.id];
          if (ovId) {
            const found = ranked.find((x) => x.id === ovId);
            if (found) shownWinner = found;
          }
          regData[reg.id] = { reg, regR1Ranked, regR2A, regR2B, r2Win, shownWinner };
        });

        presRegPaths
          .attr('fill', (d) => (regData[d.properties.id] ? regData[d.properties.id].shownWinner.color : '#334155'))
          .classed('override', (d) => !!state.pres.regWinnerOverride[d.properties.id])
          .on('click', (e, d) => {
            const rid = d.properties.id;
            const pool = state.pres.mapRound === 'r1' ? ranked.slice(0, 4) : [top1, top2];
            const cur = regData[rid].shownWinner.id;
            const idx = pool.findIndex((x) => x.id === cur);
            const next = pool[(idx + 1) % pool.length];
            state.pres.regWinnerOverride[rid] = next.id;
            if (ES.sfx) ES.sfx.click();
            updatePres();
          })
          .on('mouseenter', (e, d) => {
            const info = regData[d.properties.id];
            if (!info) return;
            const r1Rows = info.regR1Ranked.slice(0, 4)
              .map((x) => `<tr><td><span style="color:${x.cand.color}">■</span> ${x.cand.name}</td><td style="text-align:right"><b>${fmt(x.pct)}%</b></td></tr>`)
              .join('');
            presTip.show(
              e,
              `<b>${info.reg.name}</b><br>` +
              `<span class="muted">R2 Runoff:</span> <b style="color:${top1.color}">${top1.name.split(' ').pop()} ${fmt(info.regR2A)}%</b> vs <b style="color:${top2.color}">${top2.name.split(' ').pop()} ${fmt(info.regR2B)}%</b>` +
              `<table>${r1Rows}</table>` +
              `<div class="muted small">Click region to cycle winner</div>`
            );
          })
          .on('mousemove', (e) => presTip.move(e))
          .on('mouseleave', () => presTip.hide());

        presMapSide.innerHTML = '';
        const tblRows = REGIONS_577.map((reg) => {
          const info = regData[reg.id];
          const w = info.shownWinner;
          const pct = state.pres.mapRound === 'r1'
            ? (info.regR1Ranked.find((x) => x.id === w.id)?.pct || info.regR1Ranked[0].pct)
            : (w.id === top1.id ? info.regR2A : info.regR2B);
          return el('tr', {
            style: { cursor: 'pointer' },
            onclick: () => {
              const pool = state.pres.mapRound === 'r1' ? ranked.slice(0, 4) : [top1, top2];
              const idx = pool.findIndex((x) => x.id === w.id);
              state.pres.regWinnerOverride[reg.id] = pool[(idx + 1) % pool.length].id;
              updatePres();
            },
          }, [
            el('td', {}, [el('span', { class: 'swatch', style: { background: w.color } }), el('span', { text: `${reg.code} · ${reg.name}` })]),
            el('td', { class: 'num', html: `<b style="color:${w.color}">${w.name.split(' ').pop()}</b> ${fmt(pct)}%` }),
          ]);
        });
        presMapSide.appendChild(el('table', { class: 'results' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Region (Click to flip)' }), el('th', { text: state.pres.mapRound === 'r1' ? 'R1 Leader' : 'R2 Winner' })])),
          el('tbody', {}, tblRows),
        ]));
      }

      // 4. Rebuild Transfer Matrix UI when finalists change or on update
      if (pairKey !== lastPairKey || !matrixBody.hasChildNodes()) {
        lastPairKey = pairKey;
        buildTransferMatrix( ranked, top1, top2, transfers );
      } else {
        updateTransferMatrixBars(ranked, top1, top2, transfers);
      }
    }

    function buildTransferMatrix(ranked, top1, top2, transfers) {
      matrixBody.innerHTML = '';
      const headRow = el('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '8px' } }, [
        el('span', { class: 'muted small', html: `How each Round 1 candidate's voters split in Round 2 between <b style="color:${top1.color}">${top1.name}</b> and <b style="color:${top2.color}">${top2.name}</b>:` }),
        el('button', {
          class: 'btn btn-xs',
          text: 'Reset transfers to default model',
          onclick: () => {
            state.pres.customTransfers = {};
            state.pres.r2Override = false;
            lastPairKey = '';
            updatePres();
          },
        }),
      ]);
      matrixBody.appendChild(headRow);

      const tbl = el('table', { class: 'fr-matrix' });
      tbl.appendChild(
        el('thead', {}, [
          el('tr', {}, [
            el('th', { text: 'R1 Candidate (Share)' }),
            el('th', { html: `→ <span style="color:${top1.color}">${top1.name.split(' ').pop()}</span> (%)` }),
            el('th', { html: `→ <span style="color:${top2.color}">${top2.name.split(' ').pop()}</span> (%)` }),
            el('th', { text: 'Blank / Abstain' }),
            el('th', { text: 'Split' }),
          ]),
        ])
      );

      const tb = el('tbody');
      ranked.forEach((c) => {
        const key = `${top1.id}|${top2.id}|${c.id}`;
        const trf = transfers[c.id];
        const inA = el('input', {
          type: 'number',
          min: 0,
          max: 100,
          step: 1,
          value: trf.toA,
          onchange: () => {
            let a = Math.max(0, Math.min(100, +inA.value || 0));
            let b = Math.max(0, Math.min(100 - a, +inB.value || 0));
            inA.value = a;
            inB.value = b;
            state.pres.customTransfers[key] = [a, b];
            state.pres.r2Override = false;
            updatePres();
          },
        });
        const inB = el('input', {
          type: 'number',
          min: 0,
          max: 100,
          step: 1,
          value: trf.toB,
          onchange: () => {
            let b = Math.max(0, Math.min(100, +inB.value || 0));
            let a = Math.max(0, Math.min(100 - b, +inA.value || 0));
            inA.value = a;
            inB.value = b;
            state.pres.customTransfers[key] = [a, b];
            state.pres.r2Override = false;
            updatePres();
          },
        });

        const abstCell = el('td', { class: 'muted', id: `fr-abst-${c.id}`, text: `${trf.abst}%` });
        const miniBar = el('div', { class: 'fr-transfer-mini', id: `fr-mini-${c.id}` }, [
          el('div', { style: { width: trf.toA + '%', background: top1.color } }),
          el('div', { style: { width: trf.toB + '%', background: top2.color } }),
        ]);

        tb.appendChild(
          el('tr', {}, [
            el('td', {}, [
              el('span', { class: 'swatch', style: { background: c.color, marginRight: '6px' } }),
              el('b', { text: c.name }),
              el('span', { class: 'muted small', id: `fr-r1share-${c.id}`, text: ` (${fmt(c.r1)}%)` }),
            ]),
            el('td', {}, [inA, ' %']),
            el('td', {}, [inB, ' %']),
            abstCell,
            el('td', {}, [miniBar]),
          ])
        );
      });
      tbl.appendChild(tb);
      matrixBody.appendChild(tbl);
    }

    function updateTransferMatrixBars(ranked, top1, top2, transfers) {
      ranked.forEach((c) => {
        const trf = transfers[c.id];
        const sEl = document.getElementById(`fr-r1share-${c.id}`);
        if (sEl) sEl.textContent = ` (${fmt(c.r1)}%)`;
        const aEl = document.getElementById(`fr-abst-${c.id}`);
        if (aEl) aEl.textContent = `${trf.abst}%`;
        const mEl = document.getElementById(`fr-mini-${c.id}`);
        if (mEl && mEl.children.length === 2) {
          mEl.children[0].style.width = trf.toA + '%';
          mEl.children[1].style.width = trf.toB + '%';
        }
      });
    }

    updatePres();
  }

  /* =======================================================================
     MODE 2: 2027 LEGISLATIVE ELECTION (Assemblée nationale – 577 Seats)
     ======================================================================= */
  function renderLegislative(container, fullRebuild) {
    const L = ui.layout();
    container.appendChild(L.root);

    // --- Left Column: Presets, Alliances & Turnout/Barrage Controls, National R1 Sliders ---
    const ctrlCard = ui.card('Alliances, Turnout & Republican Front');
    L.left.appendChild(ctrlCard.card);

    function applyLegPreset(kind) {
      if (kind === 'baseline_2027') {
        LEG_PARTIES.forEach((p) => (state.leg.votes[p.id] = p.base));
        state.leg.nfp = true;
        state.leg.ensemble = true;
        state.leg.rn_udr = true;
        state.leg.turnout = 66.5;
        state.leg.repFront = 75;
      } else if (kind === 'actual_2024') {
        Object.assign(state.leg.votes, {
          lfi: 10.5, pcf: 2.4, eco: 4.8, ps: 10.4,
          ren: 13.0, modem: 3.6, hor: 4.7,
          div: 4.2, lr: 9.8, udr: 3.8, rn: 29.5, rec: 0.8,
        });
        state.leg.nfp = true;
        state.leg.ensemble = true;
        state.leg.rn_udr = true;
        state.leg.turnout = 66.7;
        state.leg.repFront = 88;
      } else if (kind === 'fragmented_left') {
        LEG_PARTIES.forEach((p) => (state.leg.votes[p.id] = p.base));
        state.leg.nfp = false;
        state.leg.ensemble = true;
        state.leg.rn_udr = true;
        state.leg.turnout = 64.0;
        state.leg.repFront = 50;
      } else if (kind === 'no_barrage') {
        LEG_PARTIES.forEach((p) => (state.leg.votes[p.id] = p.base));
        state.leg.nfp = true;
        state.leg.ensemble = true;
        state.leg.rn_udr = true;
        state.leg.turnout = 67.0;
        state.leg.repFront = 0;
      }
      fullRebuild();
    }

    ctrlCard.body.appendChild(el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Scenario presets:' }));
    ctrlCard.body.appendChild(
      el('div', { class: 'row', style: { marginBottom: '12px' } }, [
        el('button', { class: 'btn btn-xs', text: '2027 Baseline (3 Blocs)', onclick: () => applyLegPreset('baseline_2027') }),
        el('button', { class: 'btn btn-xs', text: '2024 Election Actual', onclick: () => applyLegPreset('actual_2024') }),
        el('button', { class: 'btn btn-xs', text: 'Divided Left (No NFP)', onclick: () => applyLegPreset('fragmented_left') }),
        el('button', { class: 'btn btn-xs', text: 'No Republican Front (R2)', onclick: () => applyLegPreset('no_barrage') }),
      ])
    );

    const alliancesWrap = el('div', { class: 'fr-alliance-list' });
    [
      {
        key: 'nfp',
        title: 'New Popular Front (United Left in Round 1)',
        desc: 'LFI, PS–Place Publique, Les Écologistes & PCF field single joint candidates across the 577 seats.',
      },
      {
        key: 'ensemble',
        title: 'Ensemble Alliance (United Centre in Round 1)',
        desc: 'Renaissance (Attal), Horizons (Philippe) & MoDem (Bayrou) field single joint candidates in Round 1.',
      },
      {
        key: 'rn_udr',
        title: 'RN–UDR National Right Alliance (Round 1)',
        desc: 'Jordan Bardella (RN) & Éric Ciotti (UDR) coordinate joint candidates without competing in R1.',
      },
    ].forEach((al) => {
      alliancesWrap.appendChild(
        el('div', { class: 'fr-alliance-item' }, [
          el('label', { class: 'check' }, [
            el('input', {
              type: 'checkbox',
              checked: state.leg[al.key],
              onchange: (e) => {
                state.leg[al.key] = e.target.checked;
                updateLeg();
              },
            }),
            al.title,
          ]),
          el('div', { class: 'muted small', text: al.desc }),
        ])
      );
    });
    ctrlCard.body.appendChild(alliancesWrap);

    // Turnout slider (controls 12.5% of registered voters threshold)
    const turnoutValSpan = el('span', { style: { fontWeight: '700' }, text: `${fmt(state.leg.turnout)}%` });
    const turnoutSubNote = el('div', { class: 'muted small', style: { marginTop: '2px' } });
    const turnoutRange = el('input', {
      type: 'range',
      min: 45,
      max: 85,
      step: 0.5,
      value: state.leg.turnout,
      oninput: (e) => {
        state.leg.turnout = +e.target.value;
        turnoutValSpan.textContent = `${fmt(state.leg.turnout)}%`;
        updateLeg();
      },
    });
    ctrlCard.body.appendChild(
      el('div', { class: 'fr-param-row', style: { marginTop: '12px' } }, [
        el('span', { class: 'small', html: '<b>National Turnout:</b>' }),
        turnoutRange,
        turnoutValSpan,
      ])
    );
    ctrlCard.body.appendChild(turnoutSubNote);

    // Republican Front slider (3rd-place withdrawals in R2)
    const rfValSpan = el('span', { style: { fontWeight: '700' }, text: `${fmtInt(state.leg.repFront)}%` });
    const rfRange = el('input', {
      type: 'range',
      min: 0,
      max: 100,
      step: 5,
      value: state.leg.repFront,
      oninput: (e) => {
        state.leg.repFront = +e.target.value;
        rfValSpan.textContent = `${fmtInt(state.leg.repFront)}%`;
        updateLeg();
      },
    });
    ctrlCard.body.appendChild(
      el('div', { class: 'fr-param-row' }, [
        el('span', { class: 'small', html: '<b>Republican Front (R2):</b>' }),
        rfRange,
        rfValSpan,
      ])
    );
    ctrlCard.body.appendChild(
      el('div', { class: 'muted small', style: { marginTop: '2px' }, text: 'Share of 3-way triangulars where the 3rd-place Left/Centre/LR qualifier withdraws to block the Far-Right.' })
    );

    // National Round 1 Vote Sliders
    const slidersCard = ui.card('National Round 1 Vote Shares (%)');
    L.left.appendChild(slidersCard.card);
    const legSliderCtrl = ui.sliders(LEG_PARTIES, state.leg.votes, {
      max: 45,
      step: 0.5,
      showOthers: false,
      onChange: () => updateLeg(),
    });
    slidersCard.body.appendChild(legSliderCtrl.el);

    // --- Right Column: Hemicycle + Seat Bar, Regional Map, Detailed Table, Coalition Builder ---
    const hcCard = ui.card('Assemblée nationale – 577 Seats (289 for Absolute Majority)');
    L.right.appendChild(hcCard.card);
    const kpiBox = el('div', { class: 'fr-kpis' });
    const hcBox = el('div');
    const barBox = el('div');
    hcCard.body.appendChild(kpiBox);
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);

    // Interactive Regional Map for Legislative Elections
    const legMapCard = ui.card('13 Regions & 577 Constituencies Map (Click a Region to Paint Leading Party)');
    L.right.appendChild(legMapCard.card);
    const legToolbar = el('div', { class: 'map-toolbar' });
    const legBrushList = [
      { id: 'cycle', label: '🔄 Cycle Leading Party', color: '#5b8cff' },
      { id: 'rn', label: 'RN', color: '#3b4cca' },
      { id: 'lfi', label: 'LFI', color: '#cc2443' },
      { id: 'ps', label: 'PS–PP', color: '#ec4899' },
      { id: 'ren', label: 'Renaissance', color: '#f59e0b' },
      { id: 'hor', label: 'Horizons', color: '#38bdf8' },
      { id: 'lr', label: 'LR', color: '#2563eb' },
      { id: 'eco', label: 'Écologistes', color: '#22c55e' },
      { id: 'reset', label: '↺ Clear Overrides', color: '#ffffff' },
    ];
    legBrushList.forEach((b) => {
      const chip = el('button', {
        class: 'paint-chip' + (state.leg.brush === b.id ? ' active' : ''),
        style: { '--c': b.color },
      }, [b.id !== 'cycle' && b.id !== 'reset' ? el('span', { class: 'swatch', style: { background: b.color } }) : null, b.label]);
      chip.addEventListener('click', () => {
        if (b.id === 'reset') {
          state.leg.regOverrides = {};
          updateLeg();
          return;
        }
        state.leg.brush = b.id;
        legToolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
        chip.classList.add('active');
      });
      legToolbar.appendChild(chip);
    });
    legMapCard.body.appendChild(legToolbar);

    const legMapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const legMapWrap = el('div', { class: 'map-wrap' });
    const legMapSide = el('div');
    legMapGrid.appendChild(legMapWrap);
    legMapGrid.appendChild(legMapSide);
    legMapCard.body.appendChild(legMapGrid);

    const legTip = ui.tooltip();
    let legRegPaths = null;
    if (window.GEO_FR && window.GEO_FR.features) {
      const W = 440, H = 420;
      const svg = d3.select(legMapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
      const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_FR);
      const path = d3.geoPath(proj);
      legRegPaths = svg.append('g')
        .selectAll('path')
        .data(window.GEO_FR.features)
        .join('path')
        .attr('class', 'unit')
        .attr('d', path);
      svg.append('g')
        .selectAll('text')
        .data(window.GEO_FR.features)
        .join('text')
        .attr('transform', (d) => `translate(${path.centroid(d)})`)
        .text((d) => (REG_MAP[d.properties.id] || {}).code || d.properties.code);
    }

    const coalCard = ui.card('Coalition & Bloc Majority Builder (289 Needed)');
    L.right.appendChild(coalCard.card);
    const coalBox = el('div');
    coalCard.body.appendChild(coalBox);

    const tblCard = ui.card('Detailed Results by Party & Leader (Round 1 vs Round 2 Seats)');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);
    tblCard.body.appendChild(
      el('div', { style: { marginTop: '10px' } }, [
        ui.note(
          '<b>Electoral system:</b> All 577 deputies are elected in single-member constituencies over two rounds. A candidate wins outright in <b>Round 1</b> with &gt;50% of expressed votes (and ≥25% of registered voters). Otherwise, the top 2 candidates plus any candidate reaching <b>≥12.5% of registered voters</b> qualify for <b>Round 2</b>, where a simple plurality wins.',
          'info'
        ),
      ])
    );

    function updateLeg() {
      const sim = simulateLegislative(state.leg);
      turnoutSubNote.innerHTML = `12.5% of registered voters = <b>${fmt(sim.qualPctExpressed)}% of expressed votes</b> needed to qualify for a 3-way Round 2.`;

      // KPIs
      kpiBox.innerHTML = '';
      [
        { val: sim.countR1Wins, lbl: 'Won Outright in Round 1' },
        { val: sim.countDuels, lbl: 'Round 2 Duels (2-Way)' },
        { val: sim.countTriangulars + sim.countQuadrangulars, lbl: 'Round 2 Triangulars (3+)' },
        { val: sim.countWithdrawals, lbl: 'R2 Withdrawals (Barrage)' },
        { val: `${fmt(sim.qualPctExpressed)}%`, lbl: 'R2 Threshold (% Votes)' },
      ].forEach((k) => {
        kpiBox.appendChild(
          el('div', { class: 'fr-kpi' }, [
            el('div', { class: 'kval', text: k.val }),
            el('div', { class: 'klbl', text: k.lbl }),
          ])
        );
      });

      // Hemicycle parties in ideological left->right order
      const hcParties = LEG_PARTIES.map((p) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        leader: p.leader,
        color: p.color,
        seats: sim.totalSeats[p.id] || 0,
      }));

      ES.hemicycle(hcBox, hcParties, {
        total: 577,
        majority: 289,
        centerLabel: '577',
        subtitle: 'Majority: 289 seats',
      });

      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(hcParties, 577, 289, { label: '289 seats required for an absolute majority in the Assemblée nationale', unit: 'seats' }));

      // Bloc summary note
      const leftSeats = ['lfi', 'pcf', 'eco', 'ps'].reduce((a, id) => a + sim.totalSeats[id], 0);
      const centreSeats = ['ren', 'modem', 'hor'].reduce((a, id) => a + sim.totalSeats[id], 0);
      const rightSeats = sim.totalSeats.lr + sim.totalSeats.div;
      const frSeats = ['rn', 'udr', 'rec'].reduce((a, id) => a + sim.totalSeats[id], 0);

      let majText = `<b>Bloc totals:</b> Left (NFP) <b>${leftSeats}</b> · Centre (Ensemble) <b>${centreSeats}</b> · LR & Others <b>${rightSeats}</b> · National Right (RN–UDR–R!) <b>${frSeats}</b>. `;
      if (frSeats >= 289) majText += `<span class="ok">National Right wins an absolute majority (${frSeats} seats).</span>`;
      else if (leftSeats >= 289) majText += `<span class="ok">New Popular Front wins an absolute majority (${leftSeats} seats).</span>`;
      else if (centreSeats >= 289) majText += `<span class="ok">Ensemble wins an absolute majority (${centreSeats} seats).</span>`;
      else majText += `<span class="warn">Hung Parliament (no single bloc reaches 289 seats — coalition required).</span>`;
      barBox.appendChild(el('div', { style: { marginTop: '8px' } }, ui.note(majText, frSeats >= 289 || leftSeats >= 289 || centreSeats >= 289 ? 'info' : 'warn')));

      // Update Legislative Regional Map
      if (legRegPaths) {
        const regLead = {};
        REGIONS_577.forEach((reg) => {
          const rs = sim.regSeats[reg.id] || {};
          let bestId = 'rn', maxS = -1;
          LEG_PARTIES.forEach((p) => {
            if ((rs[p.id] || 0) > maxS) {
              maxS = rs[p.id] || 0;
              bestId = p.id;
            }
          });
          const party = LEG_PARTIES.find((p) => p.id === bestId) || LEG_PARTIES[0];
          regLead[reg.id] = { reg, party, seats: maxS, allSeats: rs };
        });

        const cycleOrder = ['rn', 'lfi', 'ps', 'ren', 'hor', 'lr', 'eco'];
        legRegPaths
          .attr('fill', (d) => (regLead[d.properties.id] ? regLead[d.properties.id].party.color : '#334155'))
          .classed('override', (d) => !!state.leg.regOverrides[d.properties.id])
          .on('click', (e, d) => {
            const rid = d.properties.id;
            if (state.leg.brush === 'cycle') {
              const cur = state.leg.regOverrides[rid] || regLead[rid].party.id;
              const idx = cycleOrder.indexOf(cur);
              state.leg.regOverrides[rid] = cycleOrder[(idx + 1) % cycleOrder.length];
            } else {
              state.leg.regOverrides[rid] = state.leg.brush;
            }
            if (ES.sfx) ES.sfx.click();
            updateLeg();
          })
          .on('mouseenter', (e, d) => {
            const info = regLead[d.properties.id];
            if (!info) return;
            const sRows = LEG_PARTIES.filter((p) => (info.allSeats[p.id] || 0) > 0)
              .sort((a, b) => (info.allSeats[b.id] || 0) - (info.allSeats[a.id] || 0))
              .map((p) => `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right"><b>${info.allSeats[p.id]} seats</b></td></tr>`)
              .join('');
            legTip.show(
              e,
              `<b>${info.reg.name}</b> (${info.reg.seats} seats)<table>${sRows}</table><div class="muted small">Click to paint / boost leading party</div>`
            );
          })
          .on('mousemove', (e) => legTip.move(e))
          .on('mouseleave', () => legTip.hide());

        legMapSide.innerHTML = '';
        const stRows = REGIONS_577.map((reg) => {
          const info = regLead[reg.id];
          return el('tr', {
            style: { cursor: 'pointer' },
            onclick: () => {
              if (state.leg.brush === 'cycle') {
                const cur = state.leg.regOverrides[reg.id] || info.party.id;
                const idx = cycleOrder.indexOf(cur);
                state.leg.regOverrides[reg.id] = cycleOrder[(idx + 1) % cycleOrder.length];
              } else {
                state.leg.regOverrides[reg.id] = state.leg.brush;
              }
              updateLeg();
            },
          }, [
            el('td', {}, [el('span', { class: 'swatch', style: { background: info.party.color } }), el('span', { text: `${reg.code} · ${reg.name}` })]),
            el('td', { class: 'num muted', text: `${reg.seats}` }),
            el('td', { class: 'num', html: `<b style="color:${info.party.color}">${info.party.short}</b> (${info.seats})` }),
          ]);
        });
        legMapSide.appendChild(el('table', { class: 'results' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Region (Click)' }), el('th', { text: 'Seats' }), el('th', { text: '1st Party' })])),
          el('tbody', {}, stRows),
        ]));
      }

      // Coalition builder
      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hcParties, 577, 289));

      // Results table
      tblBox.innerHTML = '';
      const rows = LEG_PARTIES.map((p) => ({
        id: p.id,
        name: p.name,
        leader: p.leader,
        color: p.color,
        votes: sim.nat[p.id] || 0,
        r1Seats: sim.r1Seats[p.id] || 0,
        r2Seats: sim.r2Seats[p.id] || 0,
        seats: sim.totalSeats[p.id] || 0,
        seatPct: ((sim.totalSeats[p.id] || 0) / 577) * 100,
        dim: (sim.totalSeats[p.id] || 0) === 0,
      })).sort((a, b) => b.seats - a.seats || b.votes - a.votes);

      tblBox.appendChild(
        ui.resultsTable(rows, {
          nameLabel: 'Party & Leader',
          columns: [
            { key: 'votes', label: 'R1 Votes', fmt: (v) => `${fmt(v)}%` },
            { key: 'r1Seats', label: 'R1 Elected' },
            { key: 'r2Seats', label: 'R2 Elected' },
            { key: 'seats', label: 'Total Seats', fmt: (v) => `<b>${v}</b>` },
            { key: 'seatPct', label: 'Seat %', fmt: (v) => `${fmt(v)}%` },
          ],
        })
      );
    }

    updateLeg();
  }

  /* -----------------------------------------------------------------------
     REGISTER FRANCE MODULE
     ----------------------------------------------------------------------- */
  ES.register({
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    title: 'France – 2027 Presidential & Legislative Elections',
    subtitle: 'Two-Round System · Presidential Runoff & 577-Seat Assemblée nationale',
    render,
  });
})();
