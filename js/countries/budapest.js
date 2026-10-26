/* =========================================================================
   Budapest – 2024 Mayoral & General Assembly Election
   Lord Mayor (direct plurality vote) + 33-seat General Assembly
   (32 party list seats via D'Hondt with 5% threshold + 1 seat for Lord Mayor)
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, fmtInt, sum, normalize, clone, argmax, ranked, shade, textOn } = ES.util;
  const ui = ES.ui;

  const TOTAL_VOTERS = 781725;
  const LIST_SEATS = 32;
  const TOTAL_SEATS = 33;
  const MAJORITY = 17;
  const THRESHOLD = 5;

  // Mayoral candidates (2024 Főpolgármester-választás)
  const MAYOR_CANDS = [
    {
      id: 'karacsony',
      name: 'Gergely Karácsony',
      short: 'Karácsony',
      party: 'Párbeszéd–Zöldek – DK – MSZP',
      color: '#3ea84d',
      assemblyParty: 'dk',
    },
    {
      id: 'vitezy',
      name: 'Dávid Vitézy',
      short: 'Vitézy',
      party: 'Vitézy Dáviddal Budapestért – LMP',
      color: '#009ee0',
      assemblyParty: 'vitezy_list',
    },
    {
      id: 'grundtner',
      name: 'András Grundtner',
      short: 'Grundtner',
      party: 'Mi Hazánk Mozgalom',
      color: '#678b1d',
      assemblyParty: 'mihazank',
    },
  ];
  const MAYOR_BY_ID = Object.fromEntries(MAYOR_CANDS.map((c) => [c.id, c]));

  // General Assembly party lists (2024 Fővárosi Közgyűlés)
  // Ordered left-to-right / opposition-to-government for hemicycle display
  const LIST_PARTIES = [
    {
      id: 'dk',
      name: 'DK–MSZP–Párbeszéd',
      short: 'DK–MSZP–P',
      leader: 'Gergely Karácsony',
      color: '#0067aa',
    },
    {
      id: 'mkkp',
      name: 'MKKP (Two-Tailed Dog Party)',
      short: 'MKKP',
      leader: 'Krisztina Baranyi',
      color: '#e93f6f',
    },
    {
      id: 'vitezy_list',
      name: 'Vitézy–LMP (VDB–LMP–Zöldek)',
      short: 'Vitézy–LMP',
      leader: 'Dávid Vitézy',
      color: '#009ee0',
    },
    {
      id: 'tisza',
      name: 'TISZA (Respect & Freedom Party)',
      short: 'TISZA',
      leader: 'Péter Magyar',
      color: '#ed4551',
    },
    {
      id: 'fidesz',
      name: 'FIDESZ–KDNP',
      short: 'FIDESZ',
      leader: 'Alexandra Szentkirályi',
      color: '#fd8100',
    },
  ];
  const LIST_BY_ID = Object.fromEntries(LIST_PARTIES.map((p) => [p.id, p]));

  // Slider order for General Assembly (user's 4 main parties first + Vitézy-LMP)
  const SLIDER_LIST_PARTIES = [
    LIST_BY_ID.tisza,
    LIST_BY_ID.fidesz,
    LIST_BY_ID.dk,
    LIST_BY_ID.mkkp,
    LIST_BY_ID.vitezy_list,
  ];

  // Official 2024 citywide baselines
  const BASE_MAYOR_CITY = {
    karacsony: 47.53,
    vitezy: 47.49,
    grundtner: 4.98,
  };

  const BASE_LIST_CITY = {
    tisza: 27.34,
    fidesz: 28.69,
    dk: 16.62,
    mkkp: 7.89,
    vitezy_list: 10.15,
  };

  // Pure 4-party baseline (TISZA, FIDESZ, DK, MKKP)
  const BASE_LIST_4PARTY = {
    tisza: 34.5,
    fidesz: 31.0,
    dk: 21.0,
    mkkp: 13.5,
    vitezy_list: 0.0,
  };

  // 23 Districts of Budapest (Kerületek I–XXIII) with 2024 valid votes & baseline shares
  // Karácsony won 9 districts (III, IV, VI, VII, VIII, IX, XI, XIII, XIV); Vitézy won 14 districts.
  const DISTRICTS = [
    { id: 1,  roman: 'I.',     name: 'Budavár',                       voters: 13600, mayor: { karacsony: 45.0, vitezy: 51.0, grundtner: 4.0 }, list: { tisza: 26.5, fidesz: 31.8, dk: 14.2, mkkp: 8.8,  vitezy_list: 11.5 } },
    { id: 2,  roman: 'II.',    name: 'Rózsadomb',                     voters: 45900, mayor: { karacsony: 47.0, vitezy: 49.3, grundtner: 3.7 }, list: { tisza: 30.4, fidesz: 27.2, dk: 14.8, mkkp: 9.2,  vitezy_list: 11.2 } },
    { id: 3,  roman: 'III.',   name: 'Óbuda-Békásmegyer',             voters: 62400, mayor: { karacsony: 47.9, vitezy: 47.3, grundtner: 4.8 }, list: { tisza: 28.2, fidesz: 27.9, dk: 17.5, mkkp: 7.8,  vitezy_list: 9.8  } },
    { id: 4,  roman: 'IV.',    name: 'Újpest',                        voters: 43200, mayor: { karacsony: 49.8, vitezy: 44.6, grundtner: 5.6 }, list: { tisza: 27.8, fidesz: 26.8, dk: 20.4, mkkp: 7.2,  vitezy_list: 8.5  } },
    { id: 5,  roman: 'V.',     name: 'Belváros-Lipótváros',           voters: 11700, mayor: { karacsony: 44.3, vitezy: 51.4, grundtner: 4.3 }, list: { tisza: 26.8, fidesz: 33.5, dk: 13.5, mkkp: 7.9,  vitezy_list: 10.8 } },
    { id: 6,  roman: 'VI.',    name: 'Terézváros',                    voters: 15000, mayor: { karacsony: 51.6, vitezy: 44.0, grundtner: 4.4 }, list: { tisza: 29.5, fidesz: 23.4, dk: 16.8, mkkp: 10.5, vitezy_list: 10.2 } },
    { id: 7,  roman: 'VII.',   name: 'Erzsébetváros',                 voters: 19500, mayor: { karacsony: 53.0, vitezy: 42.4, grundtner: 4.6 }, list: { tisza: 28.4, fidesz: 22.8, dk: 18.2, mkkp: 11.2, vitezy_list: 9.8  } },
    { id: 8,  roman: 'VIII.',  name: 'Józsefváros',                   voters: 26000, mayor: { karacsony: 50.0, vitezy: 44.9, grundtner: 5.1 }, list: { tisza: 25.8, fidesz: 27.5, dk: 16.9, mkkp: 10.4, vitezy_list: 9.9  } },
    { id: 9,  roman: 'IX.',    name: 'Ferencváros',                   voters: 24500, mayor: { karacsony: 50.8, vitezy: 44.3, grundtner: 4.9 }, list: { tisza: 27.6, fidesz: 24.5, dk: 15.8, mkkp: 12.8, vitezy_list: 9.8  } },
    { id: 10, roman: 'X.',     name: 'Kőbánya',                       voters: 28200, mayor: { karacsony: 45.0, vitezy: 49.3, grundtner: 5.7 }, list: { tisza: 25.4, fidesz: 31.2, dk: 16.4, mkkp: 6.8,  vitezy_list: 10.4 } },
    { id: 11, roman: 'XI.',    name: 'Újbuda',                        voters: 67500, mayor: { karacsony: 47.9, vitezy: 47.4, grundtner: 4.7 }, list: { tisza: 29.2, fidesz: 26.8, dk: 15.9, mkkp: 8.9,  vitezy_list: 10.8 } },
    { id: 12, roman: 'XII.',   name: 'Hegyvidék',                     voters: 30800, mayor: { karacsony: 43.7, vitezy: 52.4, grundtner: 3.9 }, list: { tisza: 28.8, fidesz: 31.4, dk: 11.8, mkkp: 10.2, vitezy_list: 11.4 } },
    { id: 13, roman: 'XIII.',  name: 'Angyalföld',                    voters: 60800, mayor: { karacsony: 55.9, vitezy: 39.9, grundtner: 4.2 }, list: { tisza: 27.9, fidesz: 21.2, dk: 23.8, mkkp: 8.4,  vitezy_list: 9.5  } },
    { id: 14, roman: 'XIV.',   name: 'Zugló',                         voters: 56100, mayor: { karacsony: 50.8, vitezy: 44.6, grundtner: 4.6 }, list: { tisza: 28.5, fidesz: 25.4, dk: 18.2, mkkp: 8.6,  vitezy_list: 10.1 } },
    { id: 15, roman: 'XV.',    name: 'Rákospalota',                   voters: 32900, mayor: { karacsony: 46.3, vitezy: 47.9, grundtner: 5.8 }, list: { tisza: 25.6, fidesz: 30.8, dk: 17.8, mkkp: 6.5,  vitezy_list: 9.4  } },
    { id: 16, roman: 'XVI.',   name: 'Árpádföld-Mátyásföld',          voters: 36400, mayor: { karacsony: 42.5, vitezy: 52.1, grundtner: 5.4 }, list: { tisza: 26.4, fidesz: 34.2, dk: 13.8, mkkp: 6.4,  vitezy_list: 10.6 } },
    { id: 17, roman: 'XVII.',  name: 'Rákosmente',                    voters: 42000, mayor: { karacsony: 41.9, vitezy: 52.3, grundtner: 5.8 }, list: { tisza: 26.2, fidesz: 34.8, dk: 13.6, mkkp: 6.2,  vitezy_list: 10.4 } },
    { id: 18, roman: 'XVIII.', name: 'Pestszentlőrinc-Pestszentimre', voters: 44600, mayor: { karacsony: 45.9, vitezy: 48.3, grundtner: 5.8 }, list: { tisza: 26.1, fidesz: 31.5, dk: 17.6, mkkp: 6.1,  vitezy_list: 9.6  } },
    { id: 19, roman: 'XIX.',   name: 'Kispest',                       voters: 26400, mayor: { karacsony: 46.6, vitezy: 48.0, grundtner: 5.4 }, list: { tisza: 25.9, fidesz: 29.8, dk: 18.4, mkkp: 6.8,  vitezy_list: 9.7  } },
    { id: 20, roman: 'XX.',    name: 'Pesterzsébet',                  voters: 26000, mayor: { karacsony: 45.5, vitezy: 48.7, grundtner: 5.8 }, list: { tisza: 25.2, fidesz: 31.8, dk: 17.2, mkkp: 6.6,  vitezy_list: 9.8  } },
    { id: 21, roman: 'XXI.',   name: 'Csepel',                        voters: 32100, mayor: { karacsony: 43.9, vitezy: 50.1, grundtner: 6.0 }, list: { tisza: 25.8, fidesz: 32.4, dk: 15.6, mkkp: 6.4,  vitezy_list: 10.2 } },
    { id: 22, roman: 'XXII.',  name: 'Budafok-Tétény',                voters: 26700, mayor: { karacsony: 44.2, vitezy: 50.5, grundtner: 5.3 }, list: { tisza: 27.1, fidesz: 31.6, dk: 14.8, mkkp: 7.4,  vitezy_list: 10.5 } },
    { id: 23, roman: 'XXIII.', name: 'Soroksár',                      voters: 9425,  mayor: { karacsony: 41.4, vitezy: 52.5, grundtner: 6.1 }, list: { tisza: 24.8, fidesz: 34.6, dk: 13.9, mkkp: 6.1,  vitezy_list: 10.8 } },
  ];
  const DIST_BY_ID = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]));

  // Inject compact Budapest-specific helper styles once
  let styleInjected = false;
  function ensureStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const st = el('style', {
      text: `
        .bp-dist-strip text { fill: #e6edf3; font-size: 10.5px; font-weight: 600; pointer-events: none; dominant-baseline: central; text-anchor: start !important; }
        .bp-dist-strip rect.unit { stroke: #1a1f29; stroke-width: 1px; cursor: pointer; transition: opacity 0.12s; }
        .bp-dist-strip rect.unit.override { stroke: #fff; stroke-width: 1.8px; stroke-dasharray: 3,2; }
        .bp-dist-strip rect.unit.hl-dist, .map-wrap path.unit.hl-dist { filter: brightness(1.25); stroke: #fff !important; stroke-width: 2px !important; }
        .bp-map-label { fill: #fff; font-size: 10px; font-weight: 700; text-anchor: middle; dominant-baseline: central; pointer-events: none; paint-order: stroke; stroke: rgba(15,18,24,0.85); stroke-width: 2.5px; stroke-linejoin: round; }
        .bp-kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
        .bp-kpi { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; text-align: center; }
        .bp-kpi .k-val { font-size: 1.2rem; font-weight: 700; }
        .bp-kpi .k-lbl { font-size: 0.75rem; color: #8b949e; }
      `,
    });
    document.head.appendChild(st);
  }

  let state = null;

  function initState() {
    return {
      mapMode: 'mayor', // 'mayor' | 'assembly'
      brush: 'modal',   // 'modal' | 'cycle' | 'erase' | candidateId | partyId
      mayorSliders: clone(BASE_MAYOR_CITY),
      listSliders: clone(BASE_LIST_CITY),
      mayorOverrides: {}, // { [distId]: { karacsony, vitezy, grundtner } }
      listOverrides: {},  // { [distId]: { tisza, fidesz, dk, mkkp, vitezy_list } }
      fourPartyMode: false,
    };
  }

  // Compute non-overridden district shares from current sliders
  function computeNonOverriddenMayor(d) {
    const base = d.mayor;
    const raw = {};
    for (const c of MAYOR_CANDS) {
      const k = c.id;
      const sv = state.mayorSliders[k] || 0;
      const bv = BASE_MAYOR_CITY[k] || 1;
      if (sv <= 0) raw[k] = 0;
      else if (sv >= bv) raw[k] = base[k] + (sv - bv);
      else raw[k] = base[k] * (sv / bv);
    }
    return normalize(raw, 100);
  }

  function getDistrictMayor(id) {
    if (state.mayorOverrides[id]) return normalize(state.mayorOverrides[id], 100);
    return computeNonOverriddenMayor(DIST_BY_ID[id]);
  }

  function computeNonOverriddenList(d) {
    const base = d.list;
    const raw = {};
    for (const p of LIST_PARTIES) {
      const k = p.id;
      const sv = state.listSliders[k] || 0;
      const bv = BASE_LIST_CITY[k] || 1;
      if (sv <= 0) raw[k] = 0;
      else if (sv >= bv) raw[k] = base[k] + (sv - bv);
      else raw[k] = base[k] * (sv / bv);
    }
    const s = sum(raw);
    const sliderSum = sum(state.listSliders);
    const targetSum = Math.min(100, Math.max(0, sliderSum));
    return s > 0 ? normalize(raw, targetSum > 0 ? targetSum : 100) : raw;
  }

  function getDistrictList(id) {
    if (state.listOverrides[id]) return clone(state.listOverrides[id]);
    return computeNonOverriddenList(DIST_BY_ID[id]);
  }

  // Citywide Mayoral aggregation (exact slider values + voter-weighted district override deltas)
  function computeMayoralOutcome() {
    const normSliders = normalize(state.mayorSliders, 100);
    const votes = {};
    for (const c of MAYOR_CANDS) {
      votes[c.id] = TOTAL_VOTERS * ((normSliders[c.id] || 0) / 100);
    }
    for (const d of DISTRICTS) {
      if (state.mayorOverrides[d.id]) {
        const baseD = computeNonOverriddenMayor(d);
        const overD = normalize(state.mayorOverrides[d.id], 100);
        for (const c of MAYOR_CANDS) {
          votes[c.id] += d.voters * ((overD[c.id] - baseD[c.id]) / 100);
        }
      }
    }
    for (const k in votes) votes[k] = Math.max(0, Math.round(votes[k]));
    const tot = sum(votes) || 1;
    const pct = {};
    for (const c of MAYOR_CANDS) pct[c.id] = (votes[c.id] / tot) * 100;

    const distWins = { karacsony: 0, vitezy: 0, grundtner: 0 };
    for (const d of DISTRICTS) {
      const dm = getDistrictMayor(d.id);
      const w = argmax(dm);
      if (w) distWins[w] = (distWins[w] || 0) + 1;
    }

    const rnk = ranked(votes);
    const winner = rnk[0][0];
    const runnerUp = rnk[1][0];
    const marginVotes = rnk[0][1] - rnk[1][1];
    const marginPct = pct[winner] - pct[runnerUp];

    return { votes, pct, totalVotes: tot, winner, runnerUp, marginVotes, marginPct, distWins };
  }

  // Citywide General Assembly outcome (32 D'Hondt list seats + 1 Lord Mayor seat = 33 seats)
  function computeAssemblyOutcome(mayorOutcome) {
    const sSum = sum(state.listSliders);
    const scale = sSum > 100 ? 100 / sSum : 1;
    const votes = {};
    for (const p of LIST_PARTIES) {
      votes[p.id] = TOTAL_VOTERS * (((state.listSliders[p.id] || 0) * scale) / 100);
    }
    for (const d of DISTRICTS) {
      if (state.listOverrides[d.id]) {
        const baseD = computeNonOverriddenList(d);
        const overD = state.listOverrides[d.id];
        for (const p of LIST_PARTIES) {
          votes[p.id] += d.voters * (((overD[p.id] || 0) - (baseD[p.id] || 0)) / 100);
        }
      }
    }
    for (const k in votes) votes[k] = Math.max(0, Math.round(votes[k]));
    const allocatedVotes = sum(votes);
    const othersVotes = Math.max(0, TOTAL_VOTERS - allocatedVotes);
    const totalValid = allocatedVotes + othersVotes || 1;

    const pct = {};
    for (const p of LIST_PARTIES) pct[p.id] = (votes[p.id] / totalValid) * 100;
    const othersPct = (othersVotes / totalValid) * 100;

    // 5% threshold on valid party list votes
    const qualifiedVotes = {};
    for (const p of LIST_PARTIES) {
      if (pct[p.id] >= THRESHOLD) qualifiedVotes[p.id] = votes[p.id];
    }
    const listSeats = ES.methods.dhondt(qualifiedVotes, LIST_SEATS);
    for (const p of LIST_PARTIES) {
      if (!listSeats[p.id]) listSeats[p.id] = 0;
    }

    // 1 Mayor seat goes to the elected Lord Mayor's group
    const mayorCand = MAYOR_BY_ID[mayorOutcome.winner];
    const mayorPartyId = mayorCand.assemblyParty;
    const mayorSeats = {};
    for (const p of LIST_PARTIES) mayorSeats[p.id] = 0;
    let extraMayorParty = null;
    if (LIST_BY_ID[mayorPartyId]) {
      mayorSeats[mayorPartyId] = 1;
    } else {
      extraMayorParty = {
        id: 'mayor_ind',
        name: `${mayorCand.name} (Mayor – ${mayorCand.party})`,
        short: 'Mayor',
        leader: mayorCand.name,
        color: mayorCand.color,
        votes: 0,
        pct: 0,
        listSeats: 0,
        mayorSeat: 1,
        seats: 1,
      };
    }

    const totalSeats = {};
    for (const p of LIST_PARTIES) {
      totalSeats[p.id] = (listSeats[p.id] || 0) + (mayorSeats[p.id] || 0);
    }

    const distWins = {};
    for (const p of LIST_PARTIES) distWins[p.id] = 0;
    for (const d of DISTRICTS) {
      const dl = getDistrictList(d.id);
      const w = argmax(dl);
      if (w) distWins[w] = (distWins[w] || 0) + 1;
    }

    return {
      votes,
      pct,
      othersPct,
      listSeats,
      mayorSeats,
      totalSeats,
      extraMayorParty,
      mayorCand,
      distWins,
    };
  }

  // Paint / cycle a district winner
  function applyWinnerToDistrict(distId, mode, targetId) {
    if (mode === 'mayor') {
      const cur = clone(getDistrictMayor(distId));
      const newWinner =
        targetId === 'cycle'
          ? cur.karacsony >= cur.vitezy && cur.karacsony >= cur.grundtner
            ? 'vitezy'
            : cur.vitezy >= cur.grundtner
            ? 'grundtner'
            : 'karacsony'
          : targetId;
      const others = MAYOR_CANDS.map((c) => c.id).filter((k) => k !== newWinner);
      const out = {};
      out[newWinner] = 53.0;
      const remSum = others.reduce((a, k) => a + (cur[k] || 1), 0) || 1;
      others.forEach((k) => {
        out[k] = Math.round(((cur[k] || 1) / remSum) * 470) / 10;
      });
      state.mayorOverrides[distId] = normalize(out, 100);
    } else {
      const cur = clone(getDistrictList(distId));
      const order = state.fourPartyMode
        ? ['tisza', 'fidesz', 'dk', 'mkkp']
        : ['tisza', 'fidesz', 'dk', 'mkkp', 'vitezy_list'];
      const curWin = argmax(cur) || 'tisza';
      const newWinner =
        targetId === 'cycle'
          ? order[(order.indexOf(curWin) + 1) % order.length]
          : targetId;
      const others = LIST_PARTIES.map((p) => p.id).filter((k) => k !== newWinner);
      const out = {};
      out[newWinner] = 42.0;
      const remSum = others.reduce((a, k) => a + (cur[k] || 1), 0) || 1;
      others.forEach((k) => {
        out[k] = state.fourPartyMode && k === 'vitezy_list' ? 0 : Math.round(((cur[k] || 1) / remSum) * 520) / 10;
      });
      state.listOverrides[distId] = out;
    }
  }

  function render(root) {
    ensureStyles();
    if (!state) state = initState();

    const L = ui.layout();
    root.appendChild(L.root);

    /* ===================================================================
       LEFT COLUMN: Presets, Mayoral Controls, Assembly Party List Controls
       =================================================================== */

    // 1. Scenarios & Presets Card
    const presetCard = ui.card('Scenarios & Presets');
    L.left.appendChild(presetCard.card);
    presetCard.body.appendChild(
      el('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px' } }, [
        el('button', {
          class: 'btn' + (!state.fourPartyMode ? ' btn-primary' : ''),
          text: '2024 Official Result',
          onclick: () => {
            state.fourPartyMode = false;
            state.mayorSliders = clone(BASE_MAYOR_CITY);
            state.listSliders = clone(BASE_LIST_CITY);
            state.mayorOverrides = {};
            state.listOverrides = {};
            mayorSliderCtrl.setValues(state.mayorSliders);
            listSliderCtrl.setValues(state.listSliders);
            update();
          },
        }),
        el('button', {
          class: 'btn' + (state.fourPartyMode ? ' btn-primary' : ''),
          text: '4-Party Assembly (TISZA / FIDESZ / DK / MKKP)',
          onclick: () => {
            state.fourPartyMode = true;
            state.listSliders = clone(BASE_LIST_4PARTY);
            state.listOverrides = {};
            if (state.mapMode !== 'assembly') {
              state.mapMode = 'assembly';
              rebuild();
              return;
            }
            listSliderCtrl.setValues(state.listSliders);
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Vitézy Wins Recount (+0.2%)',
          onclick: () => {
            state.mayorSliders = { karacsony: 47.4, vitezy: 47.6, grundtner: 5.0 };
            state.mayorOverrides = {};
            mayorSliderCtrl.setValues(state.mayorSliders);
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'TISZA Wave Scenario',
          onclick: () => {
            state.listSliders = { tisza: 41.0, fidesz: 25.5, dk: 12.0, mkkp: 11.5, vitezy_list: 6.0 };
            state.listOverrides = {};
            listSliderCtrl.setValues(state.listSliders);
            update();
          },
        }),
      ])
    );

    const clearOverridesRow = el('div', { style: { marginTop: '8px' } });
    presetCard.body.appendChild(clearOverridesRow);

    // 2. Mayoral Election Card (Főpolgármester-választás)
    const mayorCard = ui.card('Lord Mayor Election (Főpolgármester)');
    L.left.appendChild(mayorCard.card);
    const mayorSummaryBox = el('div', { style: { marginBottom: '10px' } });
    mayorCard.body.appendChild(mayorSummaryBox);
    mayorCard.body.appendChild(
      el('div', {
        class: 'muted small',
        style: { marginBottom: '6px' },
        text: 'Citywide candidate vote % (swings all non-overridden districts; winner takes the 1 Mayor seat in the 33-seat Assembly):',
      })
    );
    const mayorSliderCtrl = ui.sliders(
      MAYOR_CANDS.map((c) => ({ id: c.id, name: c.name, leader: c.party, color: c.color })),
      state.mayorSliders,
      {
        max: 70,
        step: 0.05,
        showOthers: false,
        onChange: () => update(),
      }
    );
    mayorCard.body.appendChild(mayorSliderCtrl.el);

    // 3. General Assembly Party Lists Card (Fővárosi Közgyűlés)
    const listCard = ui.card('General Assembly Party Lists (32 D\'Hondt seats)');
    L.left.appendChild(listCard.card);
    listCard.body.appendChild(
      el('div', {
        class: 'muted small',
        style: { marginBottom: '6px' },
        text: 'Citywide party list vote % (5% threshold for the 32 proportional list seats):',
      })
    );
    const listSliderCtrl = ui.sliders(SLIDER_LIST_PARTIES, state.listSliders, {
      max: 60,
      step: 0.1,
      showOthers: true,
      onChange: () => update(),
    });
    listCard.body.appendChild(listSliderCtrl.el);
    listCard.body.appendChild(
      ui.note(
        '<b>2024 Electoral System:</b> Budapest\'s General Assembly (<i>Fővárosi Közgyűlés</i>) has <b>33 members</b>: <b>32 seats</b> allocated proportionally by <b>D\'Hondt</b> among party lists clearing the <b>5% threshold</b>, plus <b>1 seat</b> held ex officio by the directly elected <b>Lord Mayor</b>. In June 2024, Gergely Karácsony defeated Dávid Vitézy by just <b>293 votes</b> (47.53% vs 47.49%) after a citywide recount, while Fidesz–KDNP (10) and TISZA (10) tied at the top of the Assembly list vote.'
      )
    );

    /* ===================================================================
       RIGHT COLUMN: Interactive 23-District Map, 33-Seat Hemicycle, Table, Coalition
       =================================================================== */

    // 1. Map Card with Mode Switcher (Mayoral vs Assembly Lists) & Paint Brush Toolbar
    const modeSwitch = ui.segmented(
      [
        { value: 'mayor', label: '🗳️ Mayoral Race (by District)' },
        { value: 'assembly', label: '🏛️ Assembly Party Lists (by District)' },
      ],
      state.mapMode,
      (v) => {
        state.mapMode = v;
        state.brush = 'modal';
        rebuildToolbar();
        update();
      }
    );
    const mapCard = ui.card('Budapest 23 Districts (Kerületek I–XXIII)', '', modeSwitch);
    L.right.appendChild(mapCard.card);

    const toolbar = el('div', { class: 'map-toolbar' });
    mapCard.body.appendChild(toolbar);

    function rebuildToolbar() {
      toolbar.innerHTML = '';
      const items = [
        { v: 'modal', label: '✏️ Click district to edit %', c: '#58a6ff', isSwatch: false },
        { v: 'cycle', label: '🔄 Cycle district winner', c: '#fff', isSwatch: false },
      ];
      if (state.mapMode === 'mayor') {
        MAYOR_CANDS.forEach((c) => items.push({ v: c.id, label: `Paint ${c.short}`, c: c.color, isSwatch: true }));
      } else {
        SLIDER_LIST_PARTIES.forEach((p) => items.push({ v: p.id, label: `Paint ${p.short}`, c: p.color, isSwatch: true }));
      }
      items.push({ v: 'erase', label: '↺ Reset district', c: '#8b949e', isSwatch: false });

      items.forEach((b) => {
        const chip = el(
          'button',
          {
            class: 'paint-chip' + (state.brush === b.v ? ' active' : ''),
            style: { '--c': b.c },
          },
          [b.isSwatch ? el('span', { class: 'swatch', style: { background: b.c } }) : null, b.label]
        );
        chip.addEventListener('click', () => {
          state.brush = b.v;
          toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
          chip.classList.add('active');
        });
        toolbar.appendChild(chip);
      });
    }
    rebuildToolbar();

    const mapWrap = el('div', { class: 'map-wrap' });
    mapCard.body.appendChild(mapWrap);
    const mapLegendBox = el('div', { style: { marginTop: '8px' } });
    mapCard.body.appendChild(mapLegendBox);

    // Build D3 SVG Map of Budapest's 23 Districts + Right-side Roman Numeral District Strip
    const tip = ui.tooltip();
    const W = 820, H = 560;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);

    const geo = window.GEO_BP;
    const proj = d3.geoMercator().fitExtent(
      [
        [12, 12],
        [575, H - 12],
      ],
      geo
    );
    const path = d3.geoPath().projection(proj);

    function highlightDistrict(id, on) {
      svg.selectAll(`.dist-${id}`).classed('hl-dist', on);
    }

    function onDistrictClick(id) {
      if (state.brush === 'modal') {
        openDistrictModal(id);
        return;
      }
      if (state.brush === 'erase') {
        if (state.mapMode === 'mayor') delete state.mayorOverrides[id];
        else delete state.listOverrides[id];
        update();
        return;
      }
      applyWinnerToDistrict(id, state.mapMode, state.brush);
      update();
    }

    function onDistrictHover(e, id) {
      const d = DIST_BY_ID[id];
      const dm = getDistrictMayor(id);
      const dl = getDistrictList(id);
      const mWin = MAYOR_BY_ID[argmax(dm)];
      const lWin = LIST_BY_ID[argmax(dl)];
      const isOv = state.mapMode === 'mayor' ? !!state.mayorOverrides[id] : !!state.listOverrides[id];

      const mayorLines = MAYOR_CANDS.map(
        (c) =>
          `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:${c.color}">■ ${c.short}</span><b>${fmt(dm[c.id])}%</b></div>`
      ).join('');
      const listLines = SLIDER_LIST_PARTIES.map(
        (p) =>
          `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:${p.color}">■ ${p.short}</span><b>${fmt(dl[p.id])}%</b></div>`
      ).join('');

      tip.show(
        e,
        `<div style="min-width:190px">
          <b>${d.roman} ${d.name}</b> ${isOv ? '<span style="color:#f2c200">(edited)</span>' : ''}<br>
          <span class="muted small">${fmtInt(d.voters)} valid votes (2024)</span>
          <hr style="border:0;border-top:1px solid #30363d;margin:5px 0">
          <div class="small" style="margin-bottom:2px"><b>Mayor:</b> <span style="color:${mWin.color}">${mWin.short}</span></div>
          ${mayorLines}
          <hr style="border:0;border-top:1px solid #30363d;margin:5px 0">
          <div class="small" style="margin-bottom:2px"><b>Assembly List:</b> <span style="color:${lWin.color}">${lWin.short}</span></div>
          ${listLines}
        </div>`
      );
    }

    // Polygon layer
    const distPaths = svg
      .append('g')
      .selectAll('path')
      .data(geo.features)
      .join('path')
      .attr('class', (f) => `unit dist-${f.properties.id}`)
      .attr('d', path)
      .on('click', (e, f) => onDistrictClick(f.properties.id))
      .on('mouseenter', (e, f) => {
        highlightDistrict(f.properties.id, true);
        onDistrictHover(e, f.properties.id);
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', (e, f) => {
        highlightDistrict(f.properties.id, false);
        tip.hide();
      });

    // Centroid Roman numeral labels on the map
    const labelOffsets = {
      1: [-2, 0],
      2: [-4, 4],
      3: [0, 4],
      5: [0, 2],
      6: [0, 0],
      7: [2, 1],
      8: [2, 1],
      9: [2, 4],
      11: [-4, 2],
      12: [-4, 0],
      21: [0, 4],
    };
    svg
      .append('g')
      .selectAll('text')
      .data(geo.features)
      .join('text')
      .attr('class', 'bp-map-label')
      .attr('transform', (f) => {
        const c = path.centroid(f);
        const adj = labelOffsets[f.properties.id] || [0, 0];
        return `translate(${(c[0] + adj[0]).toFixed(1)},${(c[1] + adj[1]).toFixed(1)})`;
      })
      .text((f) => f.properties.short);

    // Right-side 2-column clickable district directory (I. – XXIII.) for instant access to any district
    const stripG = svg.append('g').attr('class', 'bp-dist-strip');
    const colW = 108, rowH = 38, gapX = 8, gapY = 5, startX = 590, startY = 14;
    const stripItems = svg
      .select('.bp-dist-strip')
      .selectAll('g')
      .data(DISTRICTS)
      .join('g')
      .attr('transform', (d, i) => {
        const col = i < 12 ? 0 : 1;
        const row = i < 12 ? i : i - 12;
        return `translate(${startX + col * (colW + gapX)},${startY + row * (rowH + gapY)})`;
      });

    const stripRects = stripItems
      .append('rect')
      .attr('class', (d) => `unit dist-${d.id}`)
      .attr('width', colW)
      .attr('height', rowH)
      .attr('rx', 5)
      .on('click', (e, d) => onDistrictClick(d.id))
      .on('mouseenter', (e, d) => {
        highlightDistrict(d.id, true);
        onDistrictHover(e, d.id);
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', (e, d) => {
        highlightDistrict(d.id, false);
        tip.hide();
      });

    stripItems
      .append('text')
      .attr('x', 7)
      .attr('y', 13)
      .style('font-size', '10.5px')
      .style('font-weight', '700')
      .text((d) => `${d.roman} ${d.name.length > 11 ? d.name.slice(0, 10) + '…' : d.name}`);

    const stripSubText = stripItems
      .append('text')
      .attr('x', 7)
      .attr('y', 27)
      .style('font-size', '9.5px')
      .style('opacity', '0.9');

    // 2. Budapest General Assembly (33 seats: 32 list + 1 Mayor) Card
    const hcCard = ui.card('Budapest General Assembly (Fővárosi Közgyűlés – 33 Seats)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const seatBarBox = el('div', { style: { marginTop: '8px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(seatBarBox);

    // 3. Results Table & Coalition Builder in a 2-column grid or stacked cards
    const tblCard = ui.card('General Assembly & Mayoral Breakdown');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    const coalCard = ui.card('General Assembly Coalition Builder (17 for Majority)');
    L.right.appendChild(coalCard.card);
    const coalBox = el('div');
    coalCard.body.appendChild(coalBox);

    /* ===================================================================
       MODAL FOR EDITING INDIVIDUAL DISTRICT (MAYORAL + ASSEMBLY LISTS)
       =================================================================== */
    function openDistrictModal(distId) {
      const d = DIST_BY_ID[distId];
      ui.modal(
        `${d.roman} ${d.name} <span class="muted small" style="font-weight:400">· ${fmtInt(d.voters)} valid votes</span>`,
        (body, close) => {
          const mValues = clone(getDistrictMayor(distId));
          const lValues = clone(getDistrictList(distId));

          body.appendChild(
            el('div', {
              class: 'muted small',
              style: { marginBottom: '10px' },
              text: 'Quick-assign district winner or fine-tune candidate and party list percentages for this district:',
            })
          );

          // Section A: Mayoral Election in this District
          body.appendChild(el('h4', { style: { margin: '4px 0 6px 0' }, text: '🗳️ Lord Mayor Vote in ' + d.roman + ' ' + d.name }));
          const mQuickRow = el('div', { class: 'row', style: { marginBottom: '8px', flexWrap: 'wrap', gap: '6px' } });
          MAYOR_CANDS.forEach((c) => {
            mQuickRow.appendChild(
              el(
                'button',
                {
                  class: 'btn btn-xs',
                  style: { borderLeft: `3px solid ${c.color}` },
                  onclick: () => {
                    applyWinnerToDistrict(distId, 'mayor', c.id);
                    mCtrl.setValues(getDistrictMayor(distId));
                    update();
                  },
                },
                `Set ${c.short} winner`
              )
            );
          });
          body.appendChild(mQuickRow);

          const mCtrl = ui.sliders(
            MAYOR_CANDS.map((c) => ({ id: c.id, name: c.name, leader: c.party, color: c.color })),
            mValues,
            {
              max: 80,
              step: 0.1,
              showOthers: false,
              onChange: (vals) => {
                state.mayorOverrides[distId] = clone(vals);
                update();
              },
            }
          );
          body.appendChild(mCtrl.el);

          body.appendChild(el('hr', { style: { border: '0', borderTop: '1px solid #30363d', margin: '14px 0' } }));

          // Section B: General Assembly Party Lists in this District
          body.appendChild(el('h4', { style: { margin: '4px 0 6px 0' }, text: '🏛️ General Assembly Party Lists in ' + d.roman + ' ' + d.name }));
          const lQuickRow = el('div', { class: 'row', style: { marginBottom: '8px', flexWrap: 'wrap', gap: '6px' } });
          SLIDER_LIST_PARTIES.forEach((p) => {
            lQuickRow.appendChild(
              el(
                'button',
                {
                  class: 'btn btn-xs',
                  style: { borderLeft: `3px solid ${p.color}` },
                  onclick: () => {
                    applyWinnerToDistrict(distId, 'assembly', p.id);
                    lCtrl.setValues(getDistrictList(distId));
                    update();
                  },
                },
                `Set ${p.short} #1`
              )
            );
          });
          body.appendChild(lQuickRow);

          const lCtrl = ui.sliders(SLIDER_LIST_PARTIES, lValues, {
            max: 70,
            step: 0.1,
            showOthers: true,
            onChange: (vals) => {
              state.listOverrides[distId] = clone(vals);
              update();
            },
          });
          body.appendChild(lCtrl.el);

          // Footer actions
          body.appendChild(
            el('div', { class: 'row', style: { marginTop: '14px', justifyContent: 'space-between' } }, [
              el('button', {
                class: 'btn',
                text: '↺ Reset district to baseline model',
                onclick: () => {
                  delete state.mayorOverrides[distId];
                  delete state.listOverrides[distId];
                  update();
                  close();
                },
              }),
              el('button', { class: 'btn btn-primary', text: 'Done', onclick: close }),
            ])
          );
        },
        { wide: true }
      );
    }

    /* ===================================================================
       LIVE UPDATE FUNCTION
       =================================================================== */
    function update() {
      const mayorOut = computeMayoralOutcome();
      const asmOut = computeAssemblyOutcome(mayorOut);

      // Update override indicator button in Presets card
      const mOvCount = Object.keys(state.mayorOverrides).length;
      const lOvCount = Object.keys(state.listOverrides).length;
      clearOverridesRow.innerHTML = '';
      if (mOvCount > 0 || lOvCount > 0) {
        clearOverridesRow.appendChild(
          el('div', { class: 'row', style: { justifyContent: 'space-between' } }, [
            el('span', {
              class: 'small muted',
              html: `District overrides active: <b>${mOvCount}</b> mayoral, <b>${lOvCount}</b> assembly list`,
            }),
            el('button', {
              class: 'btn btn-xs',
              text: 'Clear all district overrides',
              onclick: () => {
                state.mayorOverrides = {};
                state.listOverrides = {};
                update();
              },
            }),
          ])
        );
      }

      // 1. Update Mayoral Summary Cards
      mayorSummaryBox.innerHTML = '';
      const candCards = el('div', { class: 'cands' });
      MAYOR_CANDS.slice(0, 2).forEach((c) => {
        const isWin = mayorOut.winner === c.id;
        candCards.appendChild(
          el('div', { class: 'cand' + (isWin ? ' win' : ''), style: { '--c': c.color } }, [
            el('div', { class: 'cname', text: c.name }),
            el('div', { class: 'cparty', text: c.party }),
            el('div', { class: 'cval', style: { color: c.color }, text: `${fmt(mayorOut.pct[c.id], 2)}%` }),
            el('div', {
              class: 'muted small',
              text: `${fmtInt(mayorOut.votes[c.id])} votes · ${mayorOut.distWins[c.id]}/23 districts`,
            }),
            isWin ? el('span', { class: 'badge', text: 'ELECTED LORD MAYOR (+1 SEAT)' }) : null,
          ])
        );
      });
      mayorSummaryBox.appendChild(candCards);

      const winCand = MAYOR_BY_ID[mayorOut.winner];
      const runCand = MAYOR_BY_ID[mayorOut.runnerUp];
      mayorSummaryBox.appendChild(
        ui.note(
          `<b style="color:${winCand.color}">${winCand.name}</b> wins the Mayoralty by <b>${fmtInt(mayorOut.marginVotes)} votes</b> (${fmt(mayorOut.marginPct, 2)} pts) over ${runCand.name} and takes the <b>Lord Mayor's seat</b> in the 33-seat General Assembly.`,
          mayorOut.marginVotes < 1500 ? 'warn' : 'info'
        )
      );

      // 2. Update Map Fills & Strip Rects
      if (state.mapMode === 'mayor') {
        distPaths
          .attr('fill', (f) => {
            const id = f.properties.id;
            const dm = getDistrictMayor(id);
            const rnk = ranked(dm);
            const win = MAYOR_BY_ID[rnk[0][0]];
            const margin = rnk[0][1] - (rnk[1] ? rnk[1][1] : 0);
            const t = Math.min(1, 0.55 + margin / 22);
            return shade(win.color, t);
          })
          .classed('override', (f) => !!state.mayorOverrides[f.properties.id]);

        stripRects
          .attr('fill', (d) => {
            const dm = getDistrictMayor(d.id);
            const rnk = ranked(dm);
            const win = MAYOR_BY_ID[rnk[0][0]];
            return shade(win.color, 0.72);
          })
          .classed('override', (d) => !!state.mayorOverrides[d.id]);

        stripSubText.text((d) => {
          const dm = getDistrictMayor(d.id);
          const w = argmax(dm);
          return `${MAYOR_BY_ID[w].short} ${fmt(dm[w], 1)}%`;
        });

        mapLegendBox.innerHTML = '';
        mapLegendBox.appendChild(
          ui.legend(
            MAYOR_CANDS.map((c) => ({
              color: c.color,
              label: `${c.name} (${mayorOut.distWins[c.id]} districts)`,
            }))
          )
        );
      } else {
        distPaths
          .attr('fill', (f) => {
            const id = f.properties.id;
            const dl = getDistrictList(id);
            const rnk = ranked(dl);
            const win = LIST_BY_ID[rnk[0][0]];
            const margin = rnk[0][1] - (rnk[1] ? rnk[1][1] : 0);
            const t = Math.min(1, 0.58 + margin / 18);
            return shade(win.color, t);
          })
          .classed('override', (f) => !!state.listOverrides[f.properties.id]);

        stripRects
          .attr('fill', (d) => {
            const dl = getDistrictList(d.id);
            const rnk = ranked(dl);
            const win = LIST_BY_ID[rnk[0][0]];
            return shade(win.color, 0.72);
          })
          .classed('override', (d) => !!state.listOverrides[d.id]);

        stripSubText.text((d) => {
          const dl = getDistrictList(d.id);
          const w = argmax(dl);
          return `${LIST_BY_ID[w].short} ${fmt(dl[w], 1)}%`;
        });

        mapLegendBox.innerHTML = '';
        mapLegendBox.appendChild(
          ui.legend(
            SLIDER_LIST_PARTIES.map((p) => ({
              color: p.color,
              label: `${p.short} (${asmOut.distWins[p.id]} districts)`,
            }))
          )
        );
      }

      // 3. Update 33-Seat Hemicycle & Seat Bar
      const hemiParties = LIST_PARTIES.map((p) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        leader: p.leader,
        color: p.color,
        seats: asmOut.totalSeats[p.id] || 0,
      }));
      if (asmOut.extraMayorParty) hemiParties.push(asmOut.extraMayorParty);

      ES.hemicycle(hcBox, hemiParties, {
        total: TOTAL_SEATS,
        majority: MAJORITY,
        centerLabel: String(TOTAL_SEATS),
        subtitle: `Majority: ${MAJORITY}`,
      });

      seatBarBox.innerHTML = '';
      seatBarBox.appendChild(
        ui.seatBar(hemiParties, TOTAL_SEATS, MAJORITY, {
          label: `${MAJORITY} of ${TOTAL_SEATS} seats needed for an Assembly majority`,
          unit: 'seats',
        })
      );

      // 4. Update Results Breakdown Table
      tblBox.innerHTML = '';
      const tableRows = SLIDER_LIST_PARTIES.map((p) => ({
        id: p.id,
        name: p.name,
        leader: p.leader,
        color: p.color,
        votes: asmOut.pct[p.id],
        listSeats: asmOut.listSeats[p.id],
        mayorSeat: asmOut.mayorSeats[p.id] ? '1 (Mayor)' : '–',
        seats: asmOut.totalSeats[p.id],
        dim: asmOut.totalSeats[p.id] === 0,
      })).sort((a, b) => b.seats - a.seats || b.votes - a.votes);

      if (asmOut.extraMayorParty) {
        tableRows.push({
          id: asmOut.extraMayorParty.id,
          name: asmOut.extraMayorParty.name,
          leader: asmOut.extraMayorParty.leader,
          color: asmOut.extraMayorParty.color,
          votes: undefined,
          listSeats: 0,
          mayorSeat: '1 (Mayor)',
          seats: 1,
        });
      }
      if (asmOut.othersPct > 0.05) {
        tableRows.push({
          id: 'others',
          name: 'Others / Below 5% threshold (Momentum, Mi Hazánk, etc.)',
          color: '#6e7681',
          votes: asmOut.othersPct,
          listSeats: 0,
          mayorSeat: '–',
          seats: 0,
          dim: true,
        });
      }

      tblBox.appendChild(
        ui.resultsTable(tableRows, {
          nameLabel: 'Assembly List / Group',
          columns: [
            { key: 'votes', label: 'List Vote', fmt: (v) => (v === undefined ? '–' : fmt(v, 2) + '%') },
            { key: 'listSeats', label: 'List Seats (32)' },
            { key: 'mayorSeat', label: 'Mayor (1)' },
            { key: 'seats', label: 'Total (33)' },
          ],
        })
      );

      // 5. Update Coalition Builder
      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hemiParties, TOTAL_SEATS, MAJORITY));
    }

    function rebuild() {
      root.innerHTML = '';
      render(root);
    }

    update();
  }

  ES.register({
    id: 'budapest',
    name: 'Budapest',
    flag: '🏙️',
    title: 'Budapest – 2024 Mayoral & Assembly Election',
    subtitle: 'Lord Mayor (direct vote) & 33-seat General Assembly (32 D\'Hondt list seats + Mayor)',
    render,
  });
})();
