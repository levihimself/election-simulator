/* =========================================================================
   European Union – 2024 European Parliament Election (720 MEPs, 27 states)
   Political groups without leaders; toggle countries or toggle/edit each
   country's group percentages directly.
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, clone, normalize } = ES.util;
  const ui = ES.ui;

  // Ordered left -> right for hemicycle
  const GROUPS = [
    { id: 'LEFT', short: 'The Left', name: 'The Left (GUE/NGL)', color: '#c92a2a' },
    { id: 'SD', short: 'S&D', name: 'Socialists & Democrats (S&D)', color: '#f0001c' },
    { id: 'GREENS', short: 'Greens/EFA', name: 'Greens / European Free Alliance', color: '#4caf50' },
    { id: 'RENEW', short: 'Renew', name: 'Renew Europe', color: '#f5b800' },
    { id: 'EPP', short: 'EPP', name: "European People's Party (EPP)", color: '#3399ff' },
    { id: 'ECR', short: 'ECR', name: 'European Conservatives & Reformists (ECR)', color: '#0054a5' },
    { id: 'PFE', short: 'PfE', name: 'Patriots for Europe (PfE)', color: '#6b3fa0' },
    { id: 'ESN', short: 'ESN', name: 'Europe of Sovereign Nations (ESN)', color: '#9c6644' },
    { id: 'NI', short: 'NI', name: 'Non-Inscrits (Non-Attached)', color: '#8892a4' },
  ];
  const GMAP = {};
  GROUPS.forEach((g) => (GMAP[g.id] = g));

  // 27 EU Member States with ISO-3166 numeric id (matching GEO_WORLD), 2-letter code, total MEPs, and 2024 initial group seat breakdown (total = 720)
  const STATES = [
    { iso: '276', code: 'DE', name: 'Germany', seats: 96, base: { EPP: 30, SD: 14, GREENS: 16, RENEW: 8, LEFT: 4, ESN: 14, NI: 10 } },
    { iso: '250', code: 'FR', name: 'France', seats: 81, base: { PFE: 30, RENEW: 13, SD: 13, LEFT: 9, EPP: 6, GREENS: 5, ECR: 4, ESN: 1 } },
    { iso: '380', code: 'IT', name: 'Italy', seats: 76, base: { ECR: 24, SD: 21, LEFT: 10, EPP: 9, PFE: 8, GREENS: 4 } },
    { iso: '724', code: 'ES', name: 'Spain', seats: 61, base: { EPP: 22, SD: 20, PFE: 6, LEFT: 4, GREENS: 4, ECR: 1, RENEW: 1, NI: 3 } },
    { iso: '616', code: 'PL', name: 'Poland', seats: 53, base: { EPP: 23, ECR: 20, SD: 3, ESN: 3, RENEW: 1, NI: 3 } },
    { iso: '642', code: 'RO', name: 'Romania', seats: 33, base: { SD: 11, EPP: 10, ECR: 6, RENEW: 3, GREENS: 1, NI: 2 } },
    { iso: '528', code: 'NL', name: 'Netherlands', seats: 31, base: { RENEW: 7, GREENS: 6, PFE: 6, EPP: 6, SD: 4, ECR: 1, LEFT: 1 } },
    { iso: '056', code: 'BE', name: 'Belgium', seats: 22, base: { RENEW: 5, SD: 4, EPP: 3, ECR: 3, PFE: 3, GREENS: 2, LEFT: 2 } },
    { iso: '203', code: 'CZ', name: 'Czechia', seats: 21, base: { PFE: 9, EPP: 5, ECR: 3, GREENS: 1, ESN: 1, NI: 2 } },
    { iso: '300', code: 'GR', name: 'Greece', seats: 21, base: { EPP: 7, LEFT: 4, SD: 3, ECR: 2, PFE: 1, NI: 4 } },
    { iso: '348', code: 'HU', name: 'Hungary', seats: 21, base: { PFE: 11, EPP: 7, SD: 2, ESN: 1 } },
    { iso: '620', code: 'PT', name: 'Portugal', seats: 21, base: { SD: 8, EPP: 7, PFE: 2, RENEW: 2, LEFT: 2 } },
    { iso: '752', code: 'SE', name: 'Sweden', seats: 21, base: { SD: 5, EPP: 5, GREENS: 3, ECR: 3, RENEW: 3, LEFT: 2 } },
    { iso: '040', code: 'AT', name: 'Austria', seats: 20, base: { PFE: 6, EPP: 5, SD: 5, GREENS: 2, RENEW: 2 } },
    { iso: '100', code: 'BG', name: 'Bulgaria', seats: 17, base: { EPP: 6, RENEW: 5, ESN: 3, SD: 2, ECR: 1 } },
    { iso: '208', code: 'DK', name: 'Denmark', seats: 15, base: { RENEW: 4, GREENS: 3, SD: 3, EPP: 2, ECR: 1, PFE: 1, LEFT: 1 } },
    { iso: '246', code: 'FI', name: 'Finland', seats: 15, base: { EPP: 4, LEFT: 3, RENEW: 3, SD: 2, GREENS: 2, ECR: 1 } },
    { iso: '703', code: 'SK', name: 'Slovakia', seats: 15, base: { RENEW: 6, NI: 6, ESN: 2, EPP: 1 } },
    { iso: '372', code: 'IE', name: 'Ireland', seats: 14, base: { RENEW: 6, EPP: 4, LEFT: 3, SD: 1 } },
    { iso: '191', code: 'HR', name: 'Croatia', seats: 12, base: { EPP: 6, SD: 4, ECR: 1, GREENS: 1 } },
    { iso: '440', code: 'LT', name: 'Lithuania', seats: 11, base: { EPP: 3, SD: 2, ECR: 2, RENEW: 2, GREENS: 1, ESN: 1 } },
    { iso: '428', code: 'LV', name: 'Latvia', seats: 9, base: { EPP: 2, ECR: 3, PFE: 1, SD: 1, RENEW: 1, NI: 1 } },
    { iso: '705', code: 'SI', name: 'Slovenia', seats: 9, base: { EPP: 5, RENEW: 2, SD: 1, GREENS: 1 } },
    { iso: '233', code: 'EE', name: 'Estonia', seats: 7, base: { EPP: 2, SD: 2, RENEW: 2, ECR: 1 } },
    { iso: '196', code: 'CY', name: 'Cyprus', seats: 6, base: { EPP: 2, LEFT: 1, SD: 1, NI: 2 } },
    { iso: '442', code: 'LU', name: 'Luxembourg', seats: 6, base: { EPP: 2, SD: 1, RENEW: 1, GREENS: 1, ECR: 1 } },
    { iso: '470', code: 'MT', name: 'Malta', seats: 6, base: { EPP: 3, SD: 3 } },
  ];

  const SMAP = {};
  const ISO_MAP = {};
  const BASE_TOTALS = {};
  GROUPS.forEach((g) => (BASE_TOTALS[g.id] = 0));
  STATES.forEach((s) => {
    const pct = {};
    GROUPS.forEach((g) => {
      const cnt = s.base[g.id] || 0;
      BASE_TOTALS[g.id] += cnt;
      pct[g.id] = +((cnt / s.seats) * 100).toFixed(1);
    });
    const norm = normalize(pct, 100);
    GROUPS.forEach((g) => (norm[g.id] = +norm[g.id].toFixed(1)));
    s.basePct = norm;
    SMAP[s.code] = s;
    ISO_MAP[s.iso] = s;
  });

  const BASE_EU_PCT = { EPP: 26.1, SD: 18.9, PFE: 11.7, ECR: 10.8, RENEW: 10.7, GREENS: 7.4, LEFT: 6.4, ESN: 3.5, NI: 4.5 };

  let state = null;
  function initState() {
    const countryPcts = {};
    STATES.forEach((s) => (countryPcts[s.code] = clone(s.basePct)));
    state = {
      selectedCountry: 'ALL', // 'ALL' or 2-letter state code ('DE', 'FR', 'HU', etc.)
      euPct: clone(BASE_EU_PCT),
      countryPcts,            // live editable % for every single EU country!
      allocMode: 'states',    // 'states' (27 national constituencies) | 'single' (single EU-wide list)
      brush: 'select',        // 'select' (click country to edit its %), 'modal', or group id
      overrides: {},          // code -> { type: 'winner', group: 'EPP' } or { type: 'pct' }
      showAllCountries: true, // show the interactive 27-country percentage switcher table
    };
  }

  function applyEuSwingToCountries(newEuPct) {
    STATES.forEach((st) => {
      if (state.overrides[st.code]) return; // keep manually customized countries intact
      const votes = {};
      GROUPS.forEach((g) => {
        const baseG = Math.max(0.5, BASE_EU_PCT[g.id]);
        const ratio = (newEuPct[g.id] || 0) / baseG;
        const delta = (newEuPct[g.id] || 0) - BASE_EU_PCT[g.id];
        const baseSt = st.basePct[g.id] || 0;
        votes[g.id] = Math.max(0, baseSt * ratio + Math.max(0, delta * 0.25));
      });
      const norm = normalize(votes, 100);
      GROUPS.forEach((g) => (state.countryPcts[st.code][g.id] = +norm[g.id].toFixed(1)));
    });
  }

  function calcStateSeats(st) {
    const ov = state.overrides[st.code];
    if (ov && ov.type === 'winner') {
      const res = {};
      GROUPS.forEach((g) => (res[g.id] = g.id === ov.group ? st.seats : 0));
      return { seats: res, pct: state.countryPcts[st.code], isOverride: true, ovType: 'winner' };
    }
    if (ov && ov.type === 'pct') {
      const seats = ES.methods.dhondt(state.countryPcts[st.code], st.seats);
      return { seats, pct: state.countryPcts[st.code], isOverride: true, ovType: 'pct' };
    }
    // Check if euPct is unchanged from BASE_EU_PCT
    let unchanged = true;
    for (const g of GROUPS) {
      if (Math.abs((state.euPct[g.id] || 0) - BASE_EU_PCT[g.id]) > 0.05) {
        unchanged = false;
        break;
      }
    }
    if (unchanged) {
      const res = {};
      GROUPS.forEach((g) => (res[g.id] = st.base[g.id] || 0));
      return { seats: res, pct: state.countryPcts[st.code], isOverride: false };
    }
    const seats = ES.methods.dhondt(state.countryPcts[st.code], st.seats);
    return { seats, pct: state.countryPcts[st.code], isOverride: false };
  }

  function computeAll() {
    const byState = {};
    const totalSeats = {};
    GROUPS.forEach((g) => (totalSeats[g.id] = 0));

    if (state.allocMode === 'single') {
      const s = ES.methods.dhondt(state.euPct, 720);
      GROUPS.forEach((g) => (totalSeats[g.id] = s[g.id] || 0));
      STATES.forEach((st) => {
        byState[st.code] = calcStateSeats(st);
      });
    } else {
      STATES.forEach((st) => {
        const r = calcStateSeats(st);
        byState[st.code] = r;
        GROUPS.forEach((g) => (totalSeats[g.id] += r.seats[g.id] || 0));
      });
    }
    return { byState, totalSeats };
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    /* ---- Left Column: Country Percentage Toggle + Sliders + Presets ---- */
    const modeCard = ui.card('1. Toggle Country or EU-Wide Percentages');
    L.left.appendChild(modeCard.card);

    modeCard.body.appendChild(
      el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Choose which percentages to control with the sliders below:' })
    );

    const countryOpts = [{ value: 'ALL', label: '🇪🇺 All EU-27 (EU-Wide Group Share %)' }].concat(
      STATES.map((s) => ({ value: s.code, label: `${s.code} – ${s.name} (${s.seats} MEPs)` }))
    );
    const countrySelect = ui.select(countryOpts, state.selectedCountry, (v) => {
      state.selectedCountry = v;
      rebuildSliders();
      update();
    });
    countrySelect.style.width = '100%';
    modeCard.body.appendChild(countrySelect);

    // Quick pill buttons for top/popular countries + EU-27
    const quickCountries = el('div', { class: 'row', style: { marginTop: '8px' } });
    [['ALL', '🇪🇺 EU-27'], ['DE', 'DE (96)'], ['FR', 'FR (81)'], ['IT', 'IT (76)'], ['ES', 'ES (61)'], ['PL', 'PL (53)'], ['HU', 'HU (21)']].forEach(([code, lbl]) => {
      const b = el('button', {
        class: 'btn btn-xs' + (state.selectedCountry === code ? ' active' : ''),
        text: lbl,
        onclick: () => {
          state.selectedCountry = code;
          countrySelect.value = code;
          rebuildSliders();
          update();
        },
      });
      b.dataset.code = code;
      quickCountries.appendChild(b);
    });
    modeCard.body.appendChild(quickCountries);

    modeCard.body.appendChild(
      el('div', { class: 'muted small', style: { margin: '10px 0 6px' }, text: 'Seat allocation formula:' })
    );
    modeCard.body.appendChild(
      ui.segmented(
        [
          { value: 'states', label: '27 Member States (Constituencies)' },
          { value: 'single', label: 'Single EU-Wide List (720)' },
        ],
        state.allocMode,
        (v) => {
          state.allocMode = v;
          update();
        }
      )
    );

    const slHeaderSpan = el('span', { text: 'EU-WIDE GROUP SHARE (%)' });
    const slCard = ui.card('2. Group Percentages');
    slCard.card.querySelector('h3').replaceWith(slHeaderSpan);
    L.left.appendChild(slCard.card);
    const slContainer = el('div');
    slCard.body.appendChild(slContainer);

    function rebuildSliders() {
      quickCountries.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('active', b.dataset.code === state.selectedCountry);
      });
      slContainer.innerHTML = '';

      if (state.selectedCountry === 'ALL') {
        slHeaderSpan.textContent = '🇪🇺 EU-WIDE GROUP SHARE (%) – SWINGS ALL 27 STATES';
        const sliders = ui.sliders(
          GROUPS.map((g) => ({ id: g.id, name: g.short, leader: g.name, color: g.color })),
          state.euPct,
          {
            max: 45,
            step: 0.1,
            onChange: (vals) => {
              applyEuSwingToCountries(vals);
              update();
            },
          }
        );
        slContainer.appendChild(sliders.el);
      } else {
        const st = SMAP[state.selectedCountry];
        slHeaderSpan.textContent = `🎛️ ${st.name.toUpperCase()} (${st.code}) – COUNTRY PERCENTAGES (${st.seats} MEPs)`;

        const seatPreview = el('div', { class: 'note note-info', style: { marginBottom: '10px' } });
        const refreshPreview = () => {
          const calc = calcStateSeats(st);
          const parts = GROUPS.filter((g) => (calc.seats[g.id] || 0) > 0).map(
            (g) => `<b style="color:${g.color}">${g.short}: ${calc.seats[g.id]}</b>`
          );
          seatPreview.innerHTML = `<b>${st.name} (${st.seats} MEPs):</b> ` + (parts.join(' · ') || '–');
        };

        const cSliders = ui.sliders(
          GROUPS.map((g) => ({ id: g.id, name: g.short, leader: g.name, color: g.color })),
          state.countryPcts[st.code],
          {
            max: 75,
            step: 0.5,
            onChange: () => {
              state.overrides[st.code] = { type: 'pct' };
              refreshPreview();
              update();
            },
          }
        );
        refreshPreview();
        slContainer.appendChild(seatPreview);
        slContainer.appendChild(cSliders.el);
        slContainer.appendChild(
          el('div', { class: 'row', style: { marginTop: '10px', justifyContent: 'space-between' } }, [
            el('button', {
              class: 'btn btn-xs',
              text: `Reset ${st.name} to 2024 Result`,
              onclick: () => {
                state.countryPcts[st.code] = clone(st.basePct);
                delete state.overrides[st.code];
                rebuildSliders();
                update();
              },
            }),
            el('button', {
              class: 'btn btn-xs btn-primary',
              text: '← Back to EU-27 Sliders',
              onclick: () => {
                state.selectedCountry = 'ALL';
                countrySelect.value = 'ALL';
                rebuildSliders();
                update();
              },
            }),
          ])
        );
      }
    }

    const prCard = ui.card('Presets & Actions');
    L.left.appendChild(prCard.card);
    prCard.body.appendChild(
      el('div', { class: 'row' }, [
        el('button', {
          class: 'btn',
          text: '2024 Election Result',
          onclick: () => {
            initState();
            countrySelect.value = 'ALL';
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Clear All Country Overrides',
          onclick: () => {
            state.overrides = {};
            applyEuSwingToCountries(state.euPct);
            rebuildSliders();
            update();
          },
        }),
      ])
    );
    prCard.body.appendChild(
      ui.note(
        'Select any country from the dropdown, click a country on the map, or click any row in the <b>27 Member States Table</b> to toggle and customize that country\'s political group percentages!'
      )
    );

    /* ---- Right Column: Map + Country % Switcher + Hemicycle + Table ---- */
    const mapCard = ui.card('Member States Map – Click to Edit Country % or Paint Winner');
    L.right.appendChild(mapCard.card);

    const toolbar = el('div', { class: 'map-toolbar' });
    const makeBrush = (id, label, color) => {
      const b = el(
        'button',
        { class: 'paint-chip' + (state.brush === id ? ' active' : ''), style: { '--c': color } },
        [id !== 'select' && id !== 'modal' ? el('span', { class: 'swatch', style: { background: color } }) : null, label]
      );
      b.addEventListener('click', () => {
        state.brush = id;
        toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      });
      return b;
    };
    toolbar.appendChild(makeBrush('select', '🎛️ Click Country → Toggle Country % Sliders', '#4e86ff'));
    toolbar.appendChild(makeBrush('modal', '🔍 Popup Modal Editor', '#00d4ff'));
    GROUPS.forEach((g) => toolbar.appendChild(makeBrush(g.id, g.short, g.color)));
    mapCard.body.appendChild(toolbar);

    const mapWrap = el('div', { class: 'map-wrap' });
    mapCard.body.appendChild(mapWrap);

    // Interactive 27-Country Percentage Switcher strip/table
    const cListCard = ui.card('All 27 EU Countries – Click Any Country to Toggle its Percentages');
    L.right.appendChild(cListCard.card);
    const cListBox = el('div');
    cListCard.body.appendChild(cListBox);

    const hcCard = ui.card('European Parliament Hemicycle (720 MEPs · Majority: 361)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const barBox = el('div');
    const coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('Seats by Political Group');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    /* ---- Build Europe SVG Map ---- */
    const tip = ui.tooltip();
    const W = 860, H = 500;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const worldFeatures = topojson.feature(GEO_WORLD, GEO_WORLD.objects.countries).features;

    const proj = d3.geoAzimuthalEqualArea()
      .rotate([-14, -52, 0])
      .scale(880)
      .translate([W * 0.46, H * 0.54]);
    const path = d3.geoPath(proj);

    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#0d121c').attr('rx', 10);

    svg.append('g')
      .selectAll('path')
      .data(worldFeatures.filter((f) => !ISO_MAP[f.id]))
      .join('path')
      .attr('d', path)
      .attr('fill', '#1c2436')
      .attr('stroke', '#0d121c')
      .attr('stroke-width', 0.5);

    const euFeatures = worldFeatures.filter((f) => ISO_MAP[f.id]);
    const countryPaths = svg.append('g')
      .selectAll('path')
      .data(euFeatures)
      .join('path')
      .attr('class', 'unit')
      .attr('d', path)
      .on('click', (e, d) => handleCountryClick(ISO_MAP[d.id]))
      .on('mouseenter', (e, d) => showCountryTip(e, ISO_MAP[d.id]))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    const SMALL_CODES = ['MT', 'LU', 'CY', 'BE', 'NL', 'SI', 'EE'];
    svg.append('g')
      .selectAll('text')
      .data(euFeatures.filter((f) => !SMALL_CODES.includes(ISO_MAP[f.id].code)))
      .join('text')
      .attr('transform', (d) => {
        const st = ISO_MAP[d.id];
        const LONLAT = {
          DE: [10.4, 51.1], FR: [2.4, 46.6], IT: [12.6, 42.8], ES: [-3.7, 40.2], PL: [19.4, 52.1],
          RO: [25.0, 45.9], CZ: [15.5, 49.8], GR: [21.8, 39.2], HU: [19.5, 47.2], PT: [-8.2, 39.6],
          SE: [15.2, 62.0], AT: [14.1, 47.6], BG: [25.4, 42.7], DK: [9.5, 56.1], FI: [26.0, 64.0],
          SK: [19.7, 48.7], IE: [-8.2, 53.3], HR: [16.4, 45.2], LT: [23.9, 55.3], LV: [24.6, 56.9],
        }[st.code];
        const pt = LONLAT ? proj(LONLAT) : path.centroid(d);
        return `translate(${pt[0]},${pt[1]})`;
      })
      .text((d) => `${ISO_MAP[d.id].code} (${ISO_MAP[d.id].seats})`);

    const sideStates = STATES.filter((s) => SMALL_CODES.includes(s.code));
    const bx = W - 118, by0 = 22, bh = 28;
    const boxG = svg.append('g')
      .selectAll('g')
      .data(sideStates)
      .join('g')
      .attr('transform', (d, i) => `translate(${bx},${by0 + i * (bh + 5)})`);
    const boxRects = boxG.append('rect')
      .attr('class', 'unit')
      .attr('width', 104)
      .attr('height', bh)
      .attr('rx', 5)
      .on('click', (e, d) => handleCountryClick(d))
      .on('mouseenter', (e, d) => showCountryTip(e, d))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());
    boxG.append('text')
      .attr('x', 52)
      .attr('y', bh / 2 + 1)
      .text((d) => `${d.code} · ${d.name} (${d.seats})`);

    let lastCalc = null;

    function handleCountryClick(st) {
      if (state.brush === 'select') {
        state.selectedCountry = st.code;
        countrySelect.value = st.code;
        rebuildSliders();
        update();
      } else if (state.brush === 'modal') {
        openCountryModal(st);
      } else {
        const cur = state.overrides[st.code];
        if (cur && cur.type === 'winner' && cur.group === state.brush) {
          delete state.overrides[st.code];
          state.countryPcts[st.code] = clone(st.basePct);
        } else {
          state.overrides[st.code] = { type: 'winner', group: state.brush };
          GROUPS.forEach((g) => (state.countryPcts[st.code][g.id] = g.id === state.brush ? 100 : 0));
        }
        if (state.selectedCountry === st.code) rebuildSliders();
        update();
      }
    }

    function showCountryTip(e, st) {
      if (!lastCalc) return;
      const r = lastCalc.byState[st.code];
      const rows = GROUPS.filter((g) => (r.seats[g.id] || 0) > 0 || (r.pct[g.id] || 0) >= 2)
        .sort((a, b) => (r.seats[b.id] || 0) - (r.seats[a.id] || 0) || (r.pct[b.id] || 0) - (r.pct[a.id] || 0))
        .map((g) => `<tr><td><span style="color:${g.color}">■</span> ${g.short}</td><td style="text-align:right"><b>${r.seats[g.id] || 0}</b> MEPs</td><td style="text-align:right;color:#9aa3b5">${fmt(r.pct[g.id] || 0)}%</td></tr>`)
        .join('');
      tip.show(
        e,
        `<b>${st.name} (${st.code})</b> · ${st.seats} MEPs${r.isOverride ? ' <span style="color:#ffb547">(Custom)</span>' : ''}<table>${rows}</table><div class="muted small" style="margin-top:4px">Click to ${state.brush === 'select' ? 'load ' + st.name + ' % sliders on left' : state.brush === 'modal' ? 'open popup editor' : 'assign all seats to ' + GMAP[state.brush].short}</div>`
      );
    }

    function openCountryModal(st) {
      ui.modal(`${st.name} (${st.seats} MEPs) – Country Group %`, (body, close) => {
        body.appendChild(el('div', { class: 'muted small', text: 'Assign all seats of this member state to one group, or adjust its group vote shares below (allocated by D\'Hondt):' }));
        const quickRow = el('div', { class: 'row' });
        GROUPS.forEach((g) => {
          const b = el('button', { class: 'chip', style: { '--c': g.color } }, [
            el('span', { class: 'swatch', style: { background: g.color } }),
            `All ${st.seats} → ${g.short}`,
          ]);
          b.addEventListener('click', () => {
            state.overrides[st.code] = { type: 'winner', group: g.id };
            GROUPS.forEach((x) => (state.countryPcts[st.code][x.id] = x.id === g.id ? 100 : 0));
            rebuildSliders();
            update();
            close();
          });
          quickRow.appendChild(b);
        });
        body.appendChild(quickRow);

        const previewEl = el('div', { class: 'note note-info' });
        function refreshPreview() {
          const s = ES.methods.dhondt(state.countryPcts[st.code], st.seats);
          const parts = GROUPS.filter((g) => s[g.id] > 0).map((g) => `<b style="color:${g.color}">${g.short}: ${s[g.id]}</b>`);
          previewEl.innerHTML = `Projected seats (${st.seats}): ` + (parts.join(' · ') || '–');
        }
        const mSliders = ui.sliders(
          GROUPS.map((g) => ({ id: g.id, name: g.short, leader: g.name, color: g.color })),
          state.countryPcts[st.code],
          {
            max: 75,
            step: 0.5,
            onChange: () => {
              state.overrides[st.code] = { type: 'pct' };
              refreshPreview();
              rebuildSliders();
              update();
            },
          }
        );
        refreshPreview();
        body.appendChild(previewEl);
        body.appendChild(mSliders.el);

        body.appendChild(
          el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '8px' } }, [
            el('button', {
              class: 'btn',
              text: 'Reset Country to 2024 Result',
              onclick: () => {
                state.countryPcts[st.code] = clone(st.basePct);
                delete state.overrides[st.code];
                rebuildSliders();
                update();
                close();
              },
            }),
            el('button', { class: 'btn btn-primary', text: 'Done', onclick: close }),
          ])
        );
      });
    }

    function dominantGroup(seatsObj) {
      let best = 'EPP', max = -1;
      GROUPS.forEach((g) => {
        if ((seatsObj[g.id] || 0) > max) {
          max = seatsObj[g.id] || 0;
          best = g.id;
        }
      });
      return GMAP[best];
    }

    function update() {
      lastCalc = computeAll();
      const { byState, totalSeats } = lastCalc;

      countryPaths
        .attr('fill', (d) => {
          const st = ISO_MAP[d.id];
          return dominantGroup(byState[st.code].seats).color;
        })
        .classed('override', (d) => byState[ISO_MAP[d.id].code].isOverride || state.selectedCountry === ISO_MAP[d.id].code);

      boxRects
        .attr('fill', (d) => dominantGroup(byState[d.code].seats).color)
        .classed('override', (d) => byState[d.code].isOverride || state.selectedCountry === d.code);

      // Render interactive 27-country cards/pills so user can toggle any country's percentages with 1 click
      cListBox.innerHTML = '';
      const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '6px' } });
      STATES.forEach((st) => {
        const r = byState[st.code];
        const dom = dominantGroup(r.seats);
        const topPct = fmt(r.pct[dom.id] || 0, 0);
        const isSel = state.selectedCountry === st.code;
        const btn = el(
          'button',
          {
            class: 'coal-card' + (isSel ? ' on' : ''),
            style: { '--c': dom.color },
            onclick: () => {
              state.selectedCountry = st.code;
              countrySelect.value = st.code;
              rebuildSliders();
              update();
            },
          },
          [
            el('span', { class: 'swatch', style: { background: dom.color } }),
            el('div', { class: 'coal-card-info' }, [
              el('span', { class: 'coal-card-name', text: `${st.code} · ${st.name}` }),
              el('span', { class: 'coal-card-sub', text: `${dom.short} ${topPct}%${r.isOverride ? ' · Custom' : ''}` }),
            ]),
            el('span', { class: 'coal-card-seats', style: { color: dom.color }, text: st.seats }),
          ]
        );
        grid.appendChild(btn);
      });
      cListBox.appendChild(grid);

      const hcParties = GROUPS.map((g) => ({
        id: g.id,
        short: g.short,
        name: g.name,
        color: g.color,
        seats: totalSeats[g.id] || 0,
      }));
      ES.hemicycle(hcBox, hcParties, { total: 720, majority: 361, subtitle: 'Majority: 361 MEPs' });

      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(hcParties, 720, 361, { label: '361 MEPs required for an absolute majority', unit: 'MEPs' }));

      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hcParties, 720, 361, { key: 'eu-720' }));

      const rows = GROUPS.map((g) => {
        const s = totalSeats[g.id] || 0;
        const diff = s - BASE_TOTALS[g.id];
        return {
          color: g.color,
          name: g.short,
          leader: g.name,
          votes: state.euPct[g.id] || 0,
          seats: s,
          share: fmt((s / 720) * 100, 1) + '%',
          diff: diff === 0 ? '0' : diff > 0 ? `<span class="ok">+${diff}</span>` : `<span class="no">${diff}</span>`,
          dim: s === 0,
        };
      }).sort((a, b) => b.seats - a.seats);

      tblBox.innerHTML = '';
      tblBox.appendChild(
        ui.resultsTable(rows, {
          nameLabel: 'Political Group',
          columns: [
            { key: 'votes', label: 'EU Share', fmt: (v) => fmt(v, 1) + '%' },
            { key: 'seats', label: 'MEPs' },
            { key: 'share', label: 'Seat %' },
            { key: 'diff', label: '+/- vs 2024' },
          ],
        })
      );
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'eu',
    name: 'EU',
    flag: '🇪🇺',
    title: 'European Union – 2024 European Parliament Election',
    subtitle: '720 MEPs · 27 Member States · Toggle Countries or Edit Country Percentages',
    render,
  });
})();
