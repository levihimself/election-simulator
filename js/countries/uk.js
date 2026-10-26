/* =========================================================================
   United Kingdom – 2024 General Election (650 constituencies, FPTP, Hex Map)
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, fmtInt, clone, shade, textOn } = ES.util;
  const ui = ES.ui;

  const TOTAL_SEATS = 650;
  const MAJORITY = 326; // Speaker + 7 Sinn Féin abstentionists reduce working majority in practice, 326 is formal half+1

  // Ideological / display metadata for UK parties (NO party leaders per specification)
  const PARTIES = [
    { id: 'lab', short: 'Lab', name: 'Labour', color: '#E4003B', gb: true, order: 6 },
    { id: 'con', short: 'Con', name: 'Conservative', color: '#0087DC', gb: true, order: 11 },
    { id: 'ref', short: 'Ref', name: 'Reform UK', color: '#12B6CF', gb: true, order: 14 },
    { id: 'ld', short: 'LD', name: 'Liberal Democrats', color: '#FAA61A', gb: true, order: 7 },
    { id: 'green', short: 'Grn', name: 'Green Party', color: '#02A95B', gb: true, order: 2 },
    { id: 'snp', short: 'SNP', name: 'Scottish National Party', color: '#FDF38E', reg: 'S92000003', regScale: 11.5, order: 3 },
    { id: 'pc', short: 'PC', name: 'Plaid Cymru', color: '#005B54', reg: 'W92000004', regScale: 21.5, order: 4 },
    { id: 'other', short: 'Ind/Oth', name: 'Independent / Other', color: '#8a8f99', gb: true, order: 9 },
    { id: 'sf', short: 'SF', name: 'Sinn Féin', color: '#326760', reg: 'N92000002', regScale: 36.0, order: 1 },
    { id: 'dup', short: 'DUP', name: 'DUP', color: '#D46A4C', reg: 'N92000002', regScale: 36.0, order: 13 },
    { id: 'apni', short: 'All', name: 'Alliance', color: '#F6CB2F', reg: 'N92000002', regScale: 36.0, order: 8 },
    { id: 'sdlp', short: 'SDLP', name: 'SDLP', color: '#2AA82C', reg: 'N92000002', regScale: 36.0, order: 5 },
    { id: 'uup', short: 'UUP', name: 'UUP', color: '#48A5EE', reg: 'N92000002', regScale: 36.0, order: 12 },
    { id: 'tuv', short: 'TUV', name: 'TUV', color: '#0C3A6A', reg: 'N92000002', regScale: 36.0, order: 15 },
    { id: 'speaker', short: 'Spk', name: 'Speaker', color: '#9aa3b5', order: 10 },
  ];

  const PARTY_MAP = {};
  PARTIES.forEach((p) => (PARTY_MAP[p.id] = p));

  const GB_SLIDER_PARTIES = PARTIES.filter((p) => ['lab', 'con', 'ref', 'ld', 'green', 'snp', 'pc', 'other'].includes(p.id));
  const NI_SLIDER_PARTIES = PARTIES.filter((p) => ['sf', 'dup', 'apni', 'uup', 'sdlp', 'tuv'].includes(p.id));
  const HEMICYCLE_ORDER = PARTIES.slice().sort((a, b) => a.order - b.order);

  // Inject small module-scoped styles for UK hex map, search results & controls
  let styleInjected = false;
  function ensureStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const st = document.createElement('style');
    st.textContent = `
      .uk-map-layout { display: grid; grid-template-columns: 1fr 220px; gap: 12px; align-items: start; }
      @media (max-width: 1180px) { .uk-map-layout { grid-template-columns: 1fr; } }
      .uk-hex-svg { width: 100%; height: auto; max-height: 760px; display: block; margin: 0 auto; user-select: none; }
      .uk-hex-svg path.unit { stroke: #12151c; stroke-width: 3.2; transition: opacity 0.12s; }
      .uk-hex-svg path.unit:hover { stroke: #ffffff; stroke-width: 9; filter: brightness(1.2); }
      .uk-hex-svg path.unit.override { stroke: #ffffff; stroke-width: 7; stroke-dasharray: 12 6; }
      .uk-hex-svg path.unit.dimmed { opacity: 0.16; }
      .uk-hex-svg path.unit.search-hit { stroke: #ffffff; stroke-width: 10; }
      .uk-hex-svg path.reg-boundary { fill: none; stroke: rgba(255,255,255,0.52); stroke-width: 5.5; pointer-events: none; stroke-linecap: round; stroke-linejoin: round; }
      .uk-side-panel { display: flex; flex-direction: column; gap: 10px; background: var(--bg2); border: 1px solid var(--line); border-radius: 10px; padding: 10px; }
      .uk-search-input { width: 100%; background: var(--card); color: var(--text); border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; font-size: 12.5px; outline: none; }
      .uk-search-input:focus { border-color: var(--accent); }
      .uk-seat-list { max-height: 410px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 2px; }
      .uk-seat-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 5px 7px; border-radius: 6px; background: var(--card); border: 1px solid transparent; cursor: pointer; font-size: 11.5px; text-align: left; color: var(--text); }
      .uk-seat-item:hover { border-color: var(--accent); background: var(--card2); }
      .uk-seat-item .sname { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .uk-seat-item .smeta { font-size: 10.5px; color: var(--muted); white-space: nowrap; }
      .uk-summary-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
      @media (max-width: 700px) { .uk-summary-kpis { grid-template-columns: repeat(2, 1fr); } }
      .uk-kpi { background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; }
      .uk-kpi .k-lbl { font-size: 11px; color: var(--muted); }
      .uk-kpi .k-val { font-size: 18px; font-weight: 700; margin-top: 2px; }
      .uk-bars { display: flex; flex-direction: column; gap: 5px; margin: 6px 0; }
      .uk-bar-row { display: grid; grid-template-columns: 110px 1fr 48px; gap: 8px; align-items: center; font-size: 12px; }
      .uk-bar-track { height: 10px; background: #2c3342; border-radius: 5px; overflow: hidden; }
      .uk-bar-fill { height: 100%; border-radius: 5px; }
      .uk-results-wrap table.results td:first-child { flex-wrap: nowrap; }
    `;
    document.head.appendChild(st);
  }

  let state = null;

  function initState() {
    const baseNat = clone(window.UK2024.national2024);
    return {
      nat: baseNat,
      swingMode: 'uns', // 'uns' (Uniform National Swing) | 'prop' (Proportional Swing)
      mapShade: 'winner', // 'winner' | 'margin' | 'flips'
      brush: 'inspect', // 'inspect' | partyId | 'reset'
      regionFilter: 'ALL',
      searchQuery: '',
      showNI: false,
      overrides: {}, // gss -> partyId (direct winner override / painted)
      customVotes: {}, // gss -> { partyId: pct } (per-constituency slider edits)
    };
  }

  // Compute simulated vote shares and winner for a single constituency
  function computeConstituency(gss) {
    const c = window.UK2024.constituencies[gss];
    const baseNat = window.UK2024.national2024;
    const nat = state.nat;

    // Start from either custom constituency sliders or national swing model
    let shares = {};
    const hasCustomVotes = !!state.customVotes[gss];

    if (hasCustomVotes) {
      shares = clone(state.customVotes[gss]);
    } else if (c.w24 === 'speaker' && !state.overrides[gss]) {
      // Chorley (Speaker Lindsay Hoyle) uncontested by major GB parties in 2024
      shares = clone(c.v);
    } else {
      // Check if national sliders are at exact 2024 baseline
      let isBaseline = true;
      for (const k in baseNat) {
        if (Math.abs((nat[k] || 0) - baseNat[k]) > 0.04) {
          isBaseline = false;
          break;
        }
      }
      if (isBaseline) {
        shares = clone(c.v);
      } else {
        const isNI = c.reg === 'N92000002';
        const isScot = c.reg === 'S92000003';
        const isWales = c.reg === 'W92000004';
        const raw = {};

        for (const p of PARTIES) {
          const pid = p.id;
          if (pid === 'speaker') {
            if (c.v.speaker) raw.speaker = c.v.speaker;
            continue;
          }
          // Regional eligibility
          if (isNI && p.gb && !c.v[pid]) continue;
          if (!isNI && p.reg === 'N92000002' && !c.v[pid]) continue;
          if (!isScot && pid === 'snp' && !c.v[pid]) continue;
          if (!isWales && pid === 'pc' && !c.v[pid]) continue;

          const baseLocal = c.v[pid] || 0;
          const bNat = baseNat[pid] || 0.1;
          const curNat = nat[pid] !== undefined ? nat[pid] : bNat;
          const deltaNat = curNat - bNat;
          const scale = p.regScale || 1.0;

          if (state.swingMode === 'prop') {
            // Proportional swing
            if (baseLocal > 0) {
              raw[pid] = Math.max(0, baseLocal * (curNat / bNat));
            } else if (deltaNat > 0 && ((p.gb && !isNI) || p.reg === c.reg)) {
              raw[pid] = deltaNat * scale * 0.5;
            }
          } else {
            // Uniform National Swing (scaled to regional vote pool for SNP/PC/NI)
            if (baseLocal > 0 || (deltaNat > 0 && ((p.gb && !isNI) || p.reg === c.reg))) {
              raw[pid] = Math.max(0, baseLocal + deltaNat * scale);
            }
          }
        }

        const totalRaw = Object.values(raw).reduce((a, b) => a + b, 0);
        if (totalRaw > 0) {
          for (const k in raw) shares[k] = (raw[k] / totalRaw) * 100;
        } else {
          shares = clone(c.v);
        }
      }
    }

    // Rank parties by share
    const ranked = Object.entries(shares).sort((a, b) => b[1] - a[1]);
    let winner = ranked[0] ? ranked[0][0] : c.w24;
    let runnerUp = ranked[1] ? ranked[1][0] : 'con';
    let margin = ranked[0] && ranked[1] ? ranked[0][1] - ranked[1][1] : ranked[0] ? ranked[0][1] : 0;

    const forcedWinner = state.overrides[gss];
    if (forcedWinner) {
      winner = forcedWinner;
    }

    return {
      gss,
      c,
      shares,
      ranked,
      winner,
      runnerUp,
      margin,
      isOverride: !!(forcedWinner || hasCustomVotes),
      forcedWinner: forcedWinner || null,
      hasCustomVotes,
    };
  }

  // Compute full 650-seat simulation
  function simulateAll() {
    const seats = {};
    const voteTotals = {};
    let totalVotes = 0;
    PARTIES.forEach((p) => {
      seats[p.id] = 0;
      voteTotals[p.id] = 0;
    });

    const resultsByGss = {};
    const constituencies = window.UK2024.constituencies;
    let flips = 0;

    for (const gss in constituencies) {
      const r = computeConstituency(gss);
      resultsByGss[gss] = r;
      seats[r.winner] = (seats[r.winner] || 0) + 1;
      if (r.winner !== r.c.w24) flips++;

      const tot = r.c.tot || 45000;
      totalVotes += tot;
      let sumSh = 0;
      for (const pid in r.shares) {
        voteTotals[pid] = (voteTotals[pid] || 0) + (r.shares[pid] / 100) * tot;
        sumSh += r.shares[pid];
      }
      if (sumSh < 99.99) {
        voteTotals.other = (voteTotals.other || 0) + ((100 - sumSh) / 100) * tot;
      }
    }

    const votePct = {};
    for (const pid in voteTotals) {
      votePct[pid] = totalVotes > 0 ? (voteTotals[pid] / totalVotes) * 100 : 0;
    }

    return { seats, votePct, resultsByGss, flips };
  }

  // Open modal for inspecting/editing a single constituency
  function openConstituencyModal(gss, onUpdate) {
    const c = window.UK2024.constituencies[gss];
    const regInfo = window.UK2024.regions[c.reg] || { name: c.reg };
    const isNI = c.reg === 'N92000002';
    const isScot = c.reg === 'S92000003';
    const isWales = c.reg === 'W92000004';

    // Determine relevant parties for sliders in this constituency
    const modalParties = PARTIES.filter((p) => {
      if (c.v[p.id] !== undefined && c.v[p.id] > 0) return true;
      if (isNI) return p.reg === 'N92000002' || p.id === 'other';
      if (p.gb) return true;
      if (isScot && p.id === 'snp') return true;
      if (isWales && p.id === 'pc') return true;
      return false;
    });

    ui.modal(`${c.n} <span class="muted small">(${gss} · ${regInfo.name})</span>`, (body) => {
      const currentSim = computeConstituency(gss);
      const localVals = {};
      modalParties.forEach((p) => {
        localVals[p.id] = Math.round((currentSim.shares[p.id] || 0) * 10) / 10;
      });

      const statusBox = el('div');
      body.appendChild(statusBox);

      // Winner override chips
      const overrideWrap = el('div', {}, [
        el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Quick winner override (or adjust party vote shares below):' }),
      ]);
      const chipRow = el('div', { class: 'row', style: { gap: '6px' } });

      function renderModalStatus() {
        const r = computeConstituency(gss);
        const winP = PARTY_MAP[r.winner] || PARTY_MAP.other;
        const w24P = PARTY_MAP[c.w24] || PARTY_MAP.other;
        const w19P = PARTY_MAP[c.w19] || PARTY_MAP.other;
        const turnout = c.el > 0 ? fmt((c.tot / c.el) * 100, 1) : '–';

        statusBox.innerHTML = '';
        statusBox.appendChild(
          el('div', { class: 'note note-info' }, [
            el('div', {
              html: `Projected Winner: <b style="color:${winP.color}">■ ${winP.name}</b> ${
                r.forcedWinner
                  ? `<span class="badge" style="margin-left:6px">Manual Winner Override</span>`
                  : `(${fmt(r.ranked[0]?.[1] || 0, 1)}%, majority <b>${fmt(r.margin, 1)}%</b>)`
              }`,
            }),
            el('div', {
              class: 'small muted',
              style: { marginTop: '4px' },
              html: `2024 Winner: <b style="color:${w24P.color}">${w24P.short}</b> (${c.mp}) · 2019 Notional: <b style="color:${w19P.color}">${w19P.short}</b> · Electorate: ${fmtInt(c.el)} · 2024 Turnout: ${turnout}% (${fmtInt(c.tot)} votes)`,
            }),
          ])
        );

        // Mini bar breakdown of 2024 actual vs current simulated
        const bars = el('div', { class: 'uk-bars' });
        r.ranked.slice(0, 6).forEach(([pid, pct]) => {
          const p = PARTY_MAP[pid] || PARTY_MAP.other;
          bars.appendChild(
            el('div', { class: 'uk-bar-row' }, [
              el('span', { html: `<span class="swatch" style="background:${p.color};margin-right:5px"></span>${p.short}` }),
              el('div', { class: 'uk-bar-track' }, [
                el('div', { class: 'uk-bar-fill', style: { width: `${Math.min(100, pct)}%`, background: p.color } }),
              ]),
              el('span', { class: 'num muted', style: { textAlign: 'right' }, text: `${fmt(pct, 1)}%` }),
            ])
          );
        });
        statusBox.appendChild(bars);

        chipRow.querySelectorAll('.paint-chip').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset.pid === (state.overrides[gss] || ''));
        });
      }

      const modelBtn = el(
        'button',
        {
          class: 'paint-chip' + (!state.overrides[gss] ? ' active' : ''),
          'data-pid': '',
          style: { '--c': '#5b8cff' },
          text: 'Use Sliders / Model',
          onclick: () => {
            delete state.overrides[gss];
            renderModalStatus();
            onUpdate();
          },
        }
      );
      chipRow.appendChild(modelBtn);

      modalParties.forEach((p) => {
        const b = el(
          'button',
          {
            class: 'paint-chip' + (state.overrides[gss] === p.id ? ' active' : ''),
            'data-pid': p.id,
            style: { '--c': p.color },
            onclick: () => {
              state.overrides[gss] = p.id;
              renderModalStatus();
              onUpdate();
            },
          },
          [el('span', { class: 'swatch', style: { background: p.color } }), p.short]
        );
        chipRow.appendChild(b);
      });
      overrideWrap.appendChild(chipRow);
      body.appendChild(overrideWrap);

      // Sliders for constituency vote shares
      const sliderGroup = ui.sliders(modalParties, localVals, {
        max: 80,
        step: 0.1,
        showOthers: false,
        onChange: (vals) => {
          delete state.overrides[gss];
          state.customVotes[gss] = clone(vals);
          renderModalStatus();
          onUpdate();
        },
      });
      body.appendChild(sliderGroup.el);

      // Footer buttons: Reset to 2024 actual | Reset to national model
      const foot = el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '4px' } }, [
        el('button', {
          class: 'btn',
          text: 'Reset constituency to national model',
          onclick: () => {
            delete state.overrides[gss];
            delete state.customVotes[gss];
            const fresh = computeConstituency(gss);
            const nextVals = {};
            modalParties.forEach((p) => (nextVals[p.id] = Math.round((fresh.shares[p.id] || 0) * 10) / 10));
            sliderGroup.setValues(nextVals);
            renderModalStatus();
            onUpdate();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Load 2024 constituency result',
          onclick: () => {
            delete state.overrides[gss];
            const nextVals = {};
            modalParties.forEach((p) => (nextVals[p.id] = Math.round((c.v[p.id] || 0) * 10) / 10));
            state.customVotes[gss] = clone(nextVals);
            sliderGroup.setValues(nextVals);
            renderModalStatus();
            onUpdate();
          },
        }),
      ]);
      body.appendChild(foot);

      renderModalStatus();
    });
  }

  function applyPreset(name) {
    state.overrides = {};
    state.customVotes = {};
    if (name === '2024') {
      Object.assign(state.nat, clone(window.UK2024.national2024));
    } else if (name === '2019') {
      // 2019 notional result on 2024 boundaries
      Object.assign(state.nat, {
        lab: 32.1, con: 43.6, ld: 11.6, ref: 2.0, green: 2.7, snp: 3.9, pc: 0.5,
        sf: 0.6, dup: 0.8, apni: 0.4, sdlp: 0.4, uup: 0.3, tuv: 0.0, other: 1.0, speaker: 0.1,
      });
      for (const gss in window.UK2024.constituencies) {
        state.overrides[gss] = window.UK2024.constituencies[gss].w19;
      }
    } else if (name === 'tight3way') {
      Object.assign(state.nat, {
        lab: 28.0, con: 25.0, ref: 21.5, ld: 12.0, green: 7.0, snp: 2.5, pc: 0.7,
        sf: 0.7, dup: 0.6, apni: 0.4, uup: 0.3, sdlp: 0.3, tuv: 0.2, other: 0.7, speaker: 0.1,
      });
    } else if (name === 'conrecovery') {
      Object.assign(state.nat, {
        lab: 29.5, con: 35.0, ref: 10.5, ld: 11.5, green: 6.5, snp: 2.7, pc: 0.7,
        sf: 0.7, dup: 0.6, apni: 0.4, uup: 0.3, sdlp: 0.3, tuv: 0.2, other: 1.0, speaker: 0.1,
      });
    } else if (name === 'hung') {
      Object.assign(state.nat, {
        lab: 30.0, con: 29.0, ref: 14.5, ld: 13.0, green: 6.8, snp: 2.8, pc: 0.7,
        sf: 0.7, dup: 0.6, apni: 0.4, uup: 0.3, sdlp: 0.3, tuv: 0.2, other: 0.6, speaker: 0.1,
      });
    }
  }

  function render(root) {
    ensureStyles();
    if (!state) state = initState();

    const L = ui.layout();
    root.appendChild(L.root);

    /* =====================================================================
       LEFT COLUMN: Presets, Swing Model, National Sliders, Coalition Builder
       ===================================================================== */

    // 1. Presets & Reset card
    const presetCard = ui.card('Scenarios & Presets');
    L.left.appendChild(presetCard.card);
    presetCard.body.appendChild(
      el('div', { class: 'row', style: { gap: '6px', marginBottom: '10px' } }, [
        el('button', {
          class: 'btn btn-primary',
          text: '2024 Actual Result',
          onclick: () => {
            applyPreset('2024');
            gbSliders.setValues(state.nat);
            niSliders.setValues(state.nat);
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: '2019 Notional',
          onclick: () => {
            applyPreset('2019');
            gbSliders.setValues(state.nat);
            niSliders.setValues(state.nat);
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: '3-Way Split (Lab/Con/Ref)',
          onclick: () => {
            applyPreset('tight3way');
            gbSliders.setValues(state.nat);
            niSliders.setValues(state.nat);
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Con Recovery',
          onclick: () => {
            applyPreset('conrecovery');
            gbSliders.setValues(state.nat);
            niSliders.setValues(state.nat);
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Hung Parliament',
          onclick: () => {
            applyPreset('hung');
            gbSliders.setValues(state.nat);
            niSliders.setValues(state.nat);
            update();
          },
        }),
      ])
    );

    const swingRow = el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '6px' } }, [
      el('span', { class: 'muted small', text: 'Swing projection method:' }),
      ui.segmented(
        [
          { value: 'uns', label: 'Uniform Swing (UNS)', title: 'Applies additive percentage point change to each constituency' },
          { value: 'prop', label: 'Proportional Swing', title: 'Scales each party share proportionally to its 2024 baseline' },
        ],
        state.swingMode,
        (v) => {
          state.swingMode = v;
          update();
        }
      ),
    ]);
    presetCard.body.appendChild(swingRow);

    const overrideBanner = el('div', { style: { marginTop: '8px' } });
    presetCard.body.appendChild(overrideBanner);

    // 2. National Vote Share Sliders card
    const sliderCard = ui.card('National Vote Share (%)');
    L.left.appendChild(sliderCard.card);

    const gbSliders = ui.sliders(GB_SLIDER_PARTIES, state.nat, {
      max: 55,
      step: 0.1,
      showOthers: true,
      onChange: () => update(),
    });
    sliderCard.body.appendChild(gbSliders.el);

    // Collapsible Northern Ireland sliders (18 seats, separate party system)
    const niToggleBtn = el('button', {
      class: 'btn btn-xs',
      style: { marginTop: '10px', width: '100%' },
      text: state.showNI ? '▲ Hide Northern Ireland party sliders (18 seats)' : '▼ Show Northern Ireland party sliders (18 seats)',
    });
    const niWrap = el('div', { style: { display: state.showNI ? 'block' : 'none', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--line)' } });
    const niSliders = ui.sliders(NI_SLIDER_PARTIES, state.nat, {
      max: 5,
      step: 0.05,
      showOthers: false,
      onChange: () => update(),
    });
    niWrap.appendChild(el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Northern Ireland parties (% of UK-wide vote; scaled across the 18 NI seats):' }));
    niWrap.appendChild(niSliders.el);
    niToggleBtn.addEventListener('click', () => {
      state.showNI = !state.showNI;
      niWrap.style.display = state.showNI ? 'block' : 'none';
      niToggleBtn.textContent = state.showNI ? '▲ Hide Northern Ireland party sliders (18 seats)' : '▼ Show Northern Ireland party sliders (18 seats)';
    });
    sliderCard.body.appendChild(niToggleBtn);
    sliderCard.body.appendChild(niWrap);

    // 3. Results Table card
    const tableCard = ui.card('National Results & Seat Breakdown');
    L.left.appendChild(tableCard.card);
    const tableBox = el('div', { class: 'uk-results-wrap' });
    tableCard.body.appendChild(tableBox);

    // 4. Coalition Builder card
    const coalCard = ui.card('Coalition & Majority Builder');
    L.left.appendChild(coalCard.card);
    const coalBox = el('div');
    coalCard.body.appendChild(coalBox);

    // 5. Electoral system note
    L.left.appendChild(
      ui.note(
        '<b>Electoral system:</b> All 650 House of Commons MPs are elected by <b>First-Past-The-Post (FPTP)</b> in single-member constituencies across England (543), Scotland (57), Wales (32) and Northern Ireland (18). A party needs <b>326 seats</b> for an overall majority (though the Speaker and 7 Sinn Féin abstentionist MPs do not vote, making 322 an effective working majority). Baseline data contains official 2024 constituency results.'
      )
    );

    /* =====================================================================
       RIGHT COLUMN: Summary KPIs & Seat Bar, 650-Hex Map + Search, Hemicycle
       ===================================================================== */

    // 1. Top Summary + Seat Bar card
    const sumCard = ui.card('House of Commons Summary (650 Seats)');
    L.right.appendChild(sumCard.card);
    const sumBox = el('div');
    sumCard.body.appendChild(sumBox);

    // 2. Interactive 650-Constituency Hex Map card
    const mapHeaderRight = ui.segmented(
      [
        { value: 'winner', label: 'Winner' },
        { value: 'margin', label: 'Majority Shade' },
        { value: 'flips', label: 'Gains vs 2024' },
      ],
      state.mapShade,
      (v) => {
        state.mapShade = v;
        update();
      }
    );
    const mapCard = ui.card('650-Constituency Hex Cartogram (ODI Leeds 2024 Boundaries)', '', mapHeaderRight);
    L.right.appendChild(mapCard.card);

    // Paint-brush toolbar
    const toolbar = el('div', { class: 'map-toolbar' });
    const brushItems = [
      { v: 'inspect', label: '🔍 Inspect / Edit Seat', c: '#5b8cff' },
      { v: 'lab', label: 'Lab', c: PARTY_MAP.lab.color },
      { v: 'con', label: 'Con', c: PARTY_MAP.con.color },
      { v: 'ld', label: 'LD', c: PARTY_MAP.ld.color },
      { v: 'ref', label: 'Ref', c: PARTY_MAP.ref.color },
      { v: 'green', label: 'Grn', c: PARTY_MAP.green.color },
      { v: 'snp', label: 'SNP', c: PARTY_MAP.snp.color },
      { v: 'pc', label: 'PC', c: PARTY_MAP.pc.color },
      { v: 'sf', label: 'SF', c: PARTY_MAP.sf.color },
      { v: 'dup', label: 'DUP', c: PARTY_MAP.dup.color },
      { v: 'other', label: 'Ind/Oth', c: PARTY_MAP.other.color },
      { v: 'reset', label: '↺ Erase Override', c: '#ffffff' },
    ];
    brushItems.forEach((b) => {
      const chip = el(
        'button',
        {
          class: 'paint-chip' + (state.brush === b.v ? ' active' : ''),
          style: { '--c': b.c },
          title: b.v === 'inspect' ? 'Click any constituency hex to open its vote-share editor modal' : `Click or drag across hexes to paint ${b.label}`,
        },
        [b.v !== 'inspect' && b.v !== 'reset' ? el('span', { class: 'swatch', style: { background: b.c } }) : null, b.label]
      );
      chip.addEventListener('click', () => {
        state.brush = b.v;
        toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
        chip.classList.add('active');
      });
      toolbar.appendChild(chip);
    });
    mapCard.body.appendChild(toolbar);

    // Map + Sidebar (Region filter & Constituency search)
    const mapGrid = el('div', { class: 'uk-map-layout' });
    const mapWrap = el('div', { class: 'map-wrap' });
    const sidePanel = el('div', { class: 'uk-side-panel' });
    mapGrid.appendChild(mapWrap);
    mapGrid.appendChild(sidePanel);
    mapCard.body.appendChild(mapGrid);

    // Build Region filter & Search in sidePanel
    const regionOpts = [{ value: 'ALL', label: 'All UK (650 seats)' }].concat(
      Object.entries(window.UK2024.regions).map(([id, r]) => ({
        value: id,
        label: `${r.short} (${r.seats})`,
      }))
    );
    const regionSelect = ui.select(regionOpts, state.regionFilter, (val) => {
      state.regionFilter = val;
      update();
    });
    regionSelect.style.width = '100%';

    const searchInput = el('input', {
      type: 'text',
      class: 'uk-search-input',
      placeholder: 'Search constituency, MP or code...',
      value: state.searchQuery,
    });
    searchInput.addEventListener('input', () => {
      state.searchQuery = searchInput.value.trim();
      update();
    });

    const seatListHeader = el('div', { class: 'muted small' });
    const seatListEl = el('div', { class: 'uk-seat-list' });

    sidePanel.appendChild(el('div', { class: 'small', style: { fontWeight: '600' }, text: 'Filter by Region / Nation' }));
    sidePanel.appendChild(regionSelect);
    sidePanel.appendChild(el('div', { class: 'small', style: { fontWeight: '600', marginTop: '4px' }, text: 'Find Constituency / MP' }));
    sidePanel.appendChild(searchInput);
    sidePanel.appendChild(seatListHeader);
    sidePanel.appendChild(seatListEl);

    // Build SVG Hex Map from window.HEX_UK
    const tip = ui.tooltip();
    const hexes = window.HEX_UK.hexes;
    const R = 28;
    const dx = Math.sqrt(3) * R;
    const dy = 1.5 * R;
    const hx = dx / 2;
    const hy = R / 2;

    // Precompute centers and bounding box
    const hexNodes = [];
    const coordLookup = {};
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const gss in hexes) {
      const h = hexes[gss];
      const isOddR = (h.r & 1) !== 0;
      const cx = (h.q + (isOddR ? 0.5 : 0)) * dx;
      const cy = -h.r * dy;
      if (cx - hx < minX) minX = cx - hx;
      if (cx + hx > maxX) maxX = cx + hx;
      if (cy - R < minY) minY = cy - R;
      if (cy + R > maxY) maxY = cy + R;
      const node = { gss, q: h.q, r: h.r, region: h.region, cx, cy };
      hexNodes.push(node);
      coordLookup[`${Math.round(cx)},${Math.round(cy)}`] = node;
    }

    const padX = 110;
    const padY = 36;
    const vbX = (minX - padX).toFixed(1);
    const vbY = (minY - padY).toFixed(1);
    const vbW = (maxX - minX + padX * 2).toFixed(1);
    const vbH = (maxY - minY + padY * 2).toFixed(1);

    const svg = d3
      .select(mapWrap)
      .append('svg')
      .attr('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`)
      .attr('class', 'uk-hex-svg');

    const hexPathD = `M 0,${-R.toFixed(2)} L ${hx.toFixed(2)},${-hy.toFixed(2)} L ${hx.toFixed(2)},${hy.toFixed(2)} L 0,${R.toFixed(2)} L ${(-hx).toFixed(2)},${hy.toFixed(2)} L ${(-hx).toFixed(2)},${-hy.toFixed(2)} Z`;

    // Drag-to-paint support
    let isPainting = false;
    window.addEventListener('mouseup', () => {
      isPainting = false;
    });

    function handleHexAction(gss, isDrag) {
      if (state.brush === 'inspect') {
        if (!isDrag) openConstituencyModal(gss, update);
        return;
      }
      if (state.brush === 'reset') {
        delete state.overrides[gss];
        delete state.customVotes[gss];
      } else {
        state.overrides[gss] = state.brush;
      }
      update();
    }

    let lastSim = null;

    function showHexTooltip(e, gss) {
      if (!lastSim) return;
      const r = lastSim.resultsByGss[gss];
      const c = r.c;
      const regName = window.UK2024.regions[c.reg]?.short || c.reg;
      const winP = PARTY_MAP[r.winner] || PARTY_MAP.other;
      const w24P = PARTY_MAP[c.w24] || PARTY_MAP.other;
      const top4 = r.ranked
        .slice(0, 4)
        .map(([pid, pct]) => {
          const p = PARTY_MAP[pid] || PARTY_MAP.other;
          return `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right"><b>${fmt(pct, 1)}%</b></td></tr>`;
        })
        .join('');

      const gainText =
        r.winner === c.w24
          ? `<span style="color:${winP.color}">${winP.short} hold</span>`
          : `<span style="color:${winP.color}"><b>${winP.short} gain</b> from ${w24P.short}</span>`;

      tip.show(
        e,
        `<b>${c.n}</b> <span class="muted">(${regName})</span><br>` +
          `${gainText}${r.isOverride ? ' · <i>Edited</i>' : ''}<br>` +
          `<span class="muted">2024 MP: ${c.mp} (${w24P.short})</span>` +
          `<table>${top4}</table>` +
          `<span class="muted" style="font-size:10.5px">Click to ${state.brush === 'inspect' ? 'edit constituency' : 'paint'}</span>`
      );
    }

    const hexPaths = svg
      .append('g')
      .selectAll('path.unit')
      .data(hexNodes, (d) => d.gss)
      .join('path')
      .attr('class', 'unit')
      .attr('transform', (d) => `translate(${d.cx.toFixed(2)},${d.cy.toFixed(2)})`)
      .attr('d', hexPathD)
      .on('mousedown', (e, d) => {
        if (e.button !== 0) return;
        if (state.brush !== 'inspect') {
          isPainting = true;
          handleHexAction(d.gss, false);
        }
      })
      .on('click', (e, d) => {
        if (state.brush === 'inspect') handleHexAction(d.gss, false);
      })
      .on('mouseenter', (e, d) => {
        if (isPainting && state.brush !== 'inspect') {
          handleHexAction(d.gss, true);
        }
        showHexTooltip(e, d.gss);
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    // Compute and draw region boundary lines between adjacent hexes of different regions
    const boundarySegments = [];
    const edgeDirs = [
      { dcx: hx, dcy: -dy, x1: 0, y1: -R, x2: hx, y2: -hy },
      { dcx: dx, dcy: 0, x1: hx, y1: -hy, x2: hx, y2: hy },
      { dcx: hx, dcy: dy, x1: hx, y1: hy, x2: 0, y2: R },
    ];
    hexNodes.forEach((n) => {
      edgeDirs.forEach((ed) => {
        const nb = coordLookup[`${Math.round(n.cx + ed.dcx)},${Math.round(n.cy + ed.dcy)}`];
        if (nb && nb.region !== n.region) {
          boundarySegments.push(
            `M ${(n.cx + ed.x1).toFixed(1)},${(n.cy + ed.y1).toFixed(1)} L ${(n.cx + ed.x2).toFixed(1)},${(n.cy + ed.y2).toFixed(1)}`
          );
        }
      });
    });
    svg.append('path').attr('class', 'reg-boundary').attr('d', boundarySegments.join(' '));

    // Add subtle region labels in the sea around the perimeter of the hex map
    const regionLabelCoords = [
      { id: 'S92000003', label: 'SCOTLAND', q: 45.5, r: -5 },
      { id: 'N92000002', label: 'N. IRELAND', q: 43, r: -13 },
      { id: 'E12000001', label: 'NORTH EAST', q: 60.5, r: -14 },
      { id: 'E12000002', label: 'NORTH WEST', q: 47.5, r: -22 },
      { id: 'E12000003', label: 'YORKS & HUMBER', q: 66.5, r: -21 },
      { id: 'W92000004', label: 'WALES', q: 44.5, r: -33 },
      { id: 'E12000006', label: 'EAST', q: 72, r: -30 },
      { id: 'E12000007', label: 'LONDON', q: 71.5, r: -39 },
      { id: 'E12000008', label: 'SOUTH EAST', q: 71, r: -44.5 },
      { id: 'E12000009', label: 'SOUTH WEST', q: 43.5, r: -41 },
    ];
    svg
      .append('g')
      .selectAll('text')
      .data(regionLabelCoords)
      .join('text')
      .attr('x', (d) => (d.q + ((d.r & 1) !== 0 ? 0.5 : 0)) * dx)
      .attr('y', (d) => -d.r * dy)
      .style('font-size', '28px')
      .style('fill', '#9aa3b5')
      .style('letter-spacing', '1.5px')
      .text((d) => d.label);

    // 3. 650-Seat Hemicycle card
    const hcCard = ui.card('House of Commons Hemicycle (650 Seats · 326 Majority)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    hcCard.body.appendChild(hcBox);

    /* =====================================================================
       LIVE UPDATE FUNCTION
       ===================================================================== */
    function update() {
      const sim = simulateAll();
      lastSim = sim;

      // 1. Update override status banner
      const ovCount = Object.keys(state.overrides).length + Object.keys(state.customVotes).length;
      overrideBanner.innerHTML = '';
      if (ovCount > 0) {
        const clearBtn = el('button', {
          class: 'btn btn-xs',
          style: { marginLeft: '8px' },
          text: 'Clear all seat edits',
          onclick: () => {
            state.overrides = {};
            state.customVotes = {};
            update();
          },
        });
        const noteEl = ui.note(
          `<b>${ovCount} constituenc${ovCount === 1 ? 'y has' : 'ies have'} custom overrides/edits.</b> `,
          'warn'
        );
        noteEl.appendChild(clearBtn);
        overrideBanner.appendChild(noteEl);
      }

      // 2. Update Hex Map fills and filter/search classes
      const qLower = state.searchQuery.toLowerCase();
      const hasFilter = state.regionFilter !== 'ALL' || qLower.length > 0;
      const matchedSeats = [];

      hexPaths
        .attr('fill', (d) => {
          const r = sim.resultsByGss[d.gss];
          const winP = PARTY_MAP[r.winner] || PARTY_MAP.other;
          if (state.mapShade === 'flips') {
            return r.winner !== r.c.w24 ? winP.color : shade(winP.color, 0.22);
          }
          if (state.mapShade === 'margin') {
            const t = Math.min(1, Math.max(0.32, 0.32 + (r.margin / 32) * 0.68));
            return shade(winP.color, t);
          }
          return winP.color;
        })
        .classed('override', (d) => sim.resultsByGss[d.gss].isOverride)
        .classed('dimmed', (d) => {
          const r = sim.resultsByGss[d.gss];
          const regMatch = state.regionFilter === 'ALL' || r.c.reg === state.regionFilter;
          const textMatch =
            !qLower ||
            r.c.n.toLowerCase().includes(qLower) ||
            r.c.mp.toLowerCase().includes(qLower) ||
            d.gss.toLowerCase().includes(qLower);
          if (regMatch && textMatch) {
            matchedSeats.push(r);
            return false;
          }
          return hasFilter;
        })
        .classed('search-hit', (d) => {
          if (!qLower) return false;
          const r = sim.resultsByGss[d.gss];
          return (
            r.c.n.toLowerCase().includes(qLower) ||
            r.c.mp.toLowerCase().includes(qLower) ||
            d.gss.toLowerCase().includes(qLower)
          );
        });

      // 3. Update Side Panel Constituency List
      matchedSeats.sort((a, b) => a.c.n.localeCompare(b.c.n));
      seatListHeader.textContent = `${matchedSeats.length} of 650 constituencies (click to edit):`;
      seatListEl.innerHTML = '';
      matchedSeats.slice(0, 80).forEach((r) => {
        const winP = PARTY_MAP[r.winner] || PARTY_MAP.other;
        const item = el(
          'button',
          {
            class: 'uk-seat-item',
            onclick: () => openConstituencyModal(r.gss, update),
          },
          [
            el('div', { style: { minWidth: 0, overflow: 'hidden' } }, [
              el('div', { class: 'sname', text: r.c.n }),
              el('div', { class: 'smeta', text: `${r.c.mp} · Maj ${fmt(r.margin, 1)}%` }),
            ]),
            el(
              'span',
              {
                class: 'badge',
                style: { background: winP.color, color: textOn(winP.color), flexShrink: 0 },
                text: winP.short,
              }
            ),
          ]
        );
        seatListEl.appendChild(item);
      });

      // 4. Update Top Summary KPIs + Seat Bar
      sumBox.innerHTML = '';
      const sortedBySeats = PARTIES.map((p) => ({
        ...p,
        seats: sim.seats[p.id] || 0,
        votes: sim.votePct[p.id] || 0,
        diff: (sim.seats[p.id] || 0) - (window.UK2024.seats2024[p.id] || 0),
      })).sort((a, b) => b.seats - a.seats || b.votes - a.votes);

      const topParty = sortedBySeats[0];
      const secondParty = sortedBySeats[1];
      const majDiff = topParty.seats - MAJORITY;

      const kpis = el('div', { class: 'uk-summary-kpis' }, [
        el('div', { class: 'uk-kpi' }, [
          el('div', { class: 'k-lbl', text: 'Largest Party' }),
          el('div', { class: 'k-val', style: { color: topParty.color }, text: `${topParty.name} (${topParty.seats})` }),
        ]),
        el('div', { class: 'uk-kpi' }, [
          el('div', { class: 'k-lbl', text: 'Outcome (326 for Majority)' }),
          el('div', {
            class: 'k-val',
            style: { color: majDiff >= 0 ? 'var(--ok)' : 'var(--warn)' },
            text: majDiff >= 0 ? `${topParty.short} Majority (${topParty.seats - (TOTAL_SEATS - topParty.seats)})` : `Hung (${-majDiff} short)`,
          }),
        ]),
        el('div', { class: 'uk-kpi' }, [
          el('div', { class: 'k-lbl', text: 'Official Opposition' }),
          el('div', { class: 'k-val', style: { color: secondParty.color }, text: `${secondParty.short} (${secondParty.seats})` }),
        ]),
        el('div', { class: 'uk-kpi' }, [
          el('div', { class: 'k-lbl', text: 'Seats Changing Hands' }),
          el('div', { class: 'k-val', text: `${sim.flips} / 650` }),
        ]),
      ]);
      sumBox.appendChild(kpis);

      const barParties = HEMICYCLE_ORDER.map((p) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        color: p.color,
        seats: sim.seats[p.id] || 0,
      }));
      sumBox.appendChild(
        ui.seatBar(barParties, TOTAL_SEATS, MAJORITY, {
          label: `326 seats required for an overall House of Commons majority (650 total)`,
          unit: 'seats',
        })
      );

      // 5. Update Hemicycle (left-to-right ideological order, WITHOUT leaders)
      ES.hemicycle(hcBox, barParties, {
        total: TOTAL_SEATS,
        majority: MAJORITY,
        centerLabel: majDiff >= 0 ? `${topParty.short} +${topParty.seats - (TOTAL_SEATS - topParty.seats)}` : '650',
        subtitle: `Majority: ${MAJORITY}`,
      });

      // 6. Update Results Table (Vote %, 2024 Seats, Projected Seats, +/- vs 2024)
      tableBox.innerHTML = '';
      const tableRows = sortedBySeats
        .filter((p) => p.seats > 0 || p.votes >= 0.15 || (window.UK2024.seats2024[p.id] || 0) > 0)
        .map((p) => ({
          color: p.color,
          name: p.name,
          votes: p.votes,
          voteDiff: p.votes - (window.UK2024.national2024[p.id] || 0),
          s24: window.UK2024.seats2024[p.id] || 0,
          seats: p.seats,
          diff: p.diff,
          seatPct: (p.seats / TOTAL_SEATS) * 100,
          dim: p.seats === 0,
        }));

      tableBox.appendChild(
        ui.resultsTable(tableRows, {
          nameLabel: 'Party',
          columns: [
            { key: 'votes', label: 'Vote %', fmt: (v) => fmt(v, 1) + '%' },
            { key: 's24', label: '2024' },
            { key: 'seats', label: 'Seats', fmt: (v) => `<b>${v}</b>` },
            {
              key: 'diff',
              label: '+/- 2024',
              fmt: (v) =>
                v > 0
                  ? `<span class="ok">+${v}</span>`
                  : v < 0
                  ? `<span class="no">${v}</span>`
                  : '<span class="muted">0</span>',
            },
            { key: 'seatPct', label: 'Seat %', fmt: (v) => fmt(v, 1) + '%' },
          ],
        })
      );

      // 7. Update Coalition Builder
      coalBox.innerHTML = '';
      coalBox.appendChild(
        ui.coalition(
          sortedBySeats.map((p) => ({ id: p.id, name: p.name, short: p.short, color: p.color, seats: p.seats })),
          TOTAL_SEATS,
          MAJORITY
        )
      );
    }

    update();
  }

  ES.register({
    id: 'uk',
    name: 'UK',
    flag: '🇬🇧',
    title: 'United Kingdom – 2024 General Election',
    subtitle: 'House of Commons · 650 constituencies · First-Past-The-Post · 326 for a majority',
    render,
  });
})();
