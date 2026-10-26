/* =========================================================================
   European Union – 2024 European Parliament Election (720 MEPs, 27 states)
   Political groups without leaders; toggle countries or adjust percentages.
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, clone, sum, normalize, argmax } = ES.util;
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
  // Totals across EU27: EPP 188, SD 136, PFE 84, ECR 78, RENEW 77, GREENS 53, LEFT 46, ESN 25, NI 33
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
    s.basePct = normalize(pct, 100);
    SMAP[s.code] = s;
    ISO_MAP[s.iso] = s;
  });

  // Compute baseline EU-wide percentages (seat-weighted, normalized to exactly 100.0)
  const BASE_EU_PCT = { EPP: 26.1, SD: 18.9, PFE: 11.7, ECR: 10.8, RENEW: 10.7, GREENS: 7.4, LEFT: 6.4, ESN: 3.5, NI: 4.5 };

  let state = null;
  function initState() {
    state = {
      euPct: clone(BASE_EU_PCT),
      allocMode: 'states', // 'states' (27 national constituencies) | 'single' (single EU-wide list)
      clickMode: 'winner', // 'winner' (toggle country to 1 group) | 'modal' (open country % modal)
      brush: 'EPP',        // 'modal' or group id
      overrides: {},       // code -> { type: 'winner', group: 'EPP' } or { type: 'pct', pct: {...} }
    };
  }

  // Compute seats for a single state
  function calcStateSeats(st) {
    const ov = state.overrides[st.code];
    if (ov && ov.type === 'winner') {
      const res = {};
      GROUPS.forEach((g) => (res[g.id] = g.id === ov.group ? st.seats : 0));
      return { seats: res, pct: normalize({ [ov.group]: 100 }, 100), isOverride: true, ovType: 'winner' };
    }
    if (ov && ov.type === 'pct') {
      const seats = ES.methods.dhondt(ov.pct, st.seats);
      return { seats, pct: ov.pct, isOverride: true, ovType: 'pct' };
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
      return { seats: res, pct: st.basePct, isOverride: false };
    }
    // Proportional swing + small additive floor so new/growing groups can win seats anywhere
    const votes = {};
    GROUPS.forEach((g) => {
      const baseG = Math.max(0.5, BASE_EU_PCT[g.id]);
      const ratio = (state.euPct[g.id] || 0) / baseG;
      const delta = (state.euPct[g.id] || 0) - BASE_EU_PCT[g.id];
      const baseSt = st.basePct[g.id] || 0;
      votes[g.id] = Math.max(0, baseSt * ratio + Math.max(0, delta * 0.25));
    });
    const normPct = normalize(votes, 100);
    const seats = ES.methods.dhondt(normPct, st.seats);
    return { seats, pct: normPct, isOverride: false };
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

    /* ---- Left Column: Mode + Sliders + Presets ---- */
    const modeCard = ui.card('Simulation Mode');
    L.left.appendChild(modeCard.card);
    modeCard.body.appendChild(el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Seat calculation method:' }));
    modeCard.body.appendChild(
      ui.segmented(
        [
          { value: 'states', label: '27 Member States (Constituencies)' },
          { value: 'single', label: 'EU-wide Proportional (720)' },
        ],
        state.allocMode,
        (v) => {
          state.allocMode = v;
          update();
        }
      )
    );

    const slCard = ui.card('EU-wide Group Share (%)');
    L.left.appendChild(slCard.card);
    const sliders = ui.sliders(
      GROUPS.map((g) => ({ id: g.id, name: g.short, leader: g.name, color: g.color })),
      state.euPct,
      {
        max: 45,
        step: 0.1,
        onChange: () => update(),
      }
    );
    slCard.body.appendChild(sliders.el);

    const prCard = ui.card('Presets & Coalitions');
    L.left.appendChild(prCard.card);
    prCard.body.appendChild(
      el('div', { class: 'row' }, [
        el('button', {
          class: 'btn',
          text: '2024 Election Result',
          onclick: () => {
            state.overrides = {};
            sliders.setValues(clone(BASE_EU_PCT));
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Clear Country Overrides',
          onclick: () => {
            state.overrides = {};
            update();
          },
        }),
      ])
    );
    prCard.body.appendChild(
      ui.note(
        'In European Parliament elections, each of the 27 member states acts as a constituency (from 6 MEPs in Malta, Luxembourg and Cyprus up to 96 in Germany). Toggle countries on the map to assign them to a political group, or click a country in <b>Edit %</b> mode to customize its national group breakdown.'
      )
    );

    /* ---- Right Column: Map + Hemicycle + Table + Coalition ---- */
    const mapCard = ui.card('Member States Map – Toggle Country or Edit Breakdown');
    L.right.appendChild(mapCard.card);

    const toolbar = el('div', { class: 'map-toolbar' });
    const makeBrush = (id, label, color) => {
      const b = el(
        'button',
        { class: 'paint-chip' + (state.brush === id ? ' active' : ''), style: { '--c': color } },
        [id !== 'modal' ? el('span', { class: 'swatch', style: { background: color } }) : null, label]
      );
      b.addEventListener('click', () => {
        state.brush = id;
        toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      });
      return b;
    };
    toolbar.appendChild(makeBrush('modal', '🔍 Inspect / Edit Country %', '#5b8cff'));
    GROUPS.forEach((g) => toolbar.appendChild(makeBrush(g.id, g.short, g.color)));
    mapCard.body.appendChild(toolbar);

    const mapWrap = el('div', { class: 'map-wrap' });
    mapCard.body.appendChild(mapWrap);

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
    const W = 860, H = 520;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const worldFeatures = topojson.feature(GEO_WORLD, GEO_WORLD.objects.countries).features;

    const proj = d3.geoAzimuthalEqualArea()
      .rotate([-14, -52, 0])
      .scale(880)
      .translate([W * 0.46, H * 0.54]);
    const path = d3.geoPath(proj);

    // Background ocean
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#141923').attr('rx', 10);

    // Non-EU background countries
    svg.append('g')
      .selectAll('path')
      .data(worldFeatures.filter((f) => !ISO_MAP[f.id]))
      .join('path')
      .attr('d', path)
      .attr('fill', '#232936')
      .attr('stroke', '#141923')
      .attr('stroke-width', 0.5);

    // EU-27 member states
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

    // Labels for EU member states on map
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

    // Side boxes for smaller member states so all 27 are effortless to click
    const sideStates = STATES.filter((s) => SMALL_CODES.includes(s.code));
    const bx = W - 115, by0 = 24, bh = 28;
    const boxG = svg.append('g')
      .selectAll('g')
      .data(sideStates)
      .join('g')
      .attr('transform', (d, i) => `translate(${bx},${by0 + i * (bh + 5)})`);
    const boxRects = boxG.append('rect')
      .attr('class', 'unit')
      .attr('width', 100)
      .attr('height', bh)
      .attr('rx', 5)
      .on('click', (e, d) => handleCountryClick(d))
      .on('mouseenter', (e, d) => showCountryTip(e, d))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());
    boxG.append('text')
      .attr('x', 50)
      .attr('y', bh / 2 + 1)
      .text((d) => `${d.code} · ${d.name} (${d.seats})`);

    let lastCalc = null;

    function handleCountryClick(st) {
      if (state.brush === 'modal') {
        openCountryModal(st);
      } else {
        const cur = state.overrides[st.code];
        if (cur && cur.type === 'winner' && cur.group === state.brush) {
          delete state.overrides[st.code];
        } else {
          state.overrides[st.code] = { type: 'winner', group: state.brush };
        }
        update();
      }
    }

    function showCountryTip(e, st) {
      if (!lastCalc) return;
      const r = lastCalc.byState[st.code];
      const rows = GROUPS.filter((g) => (r.seats[g.id] || 0) > 0)
        .sort((a, b) => r.seats[b.id] - r.seats[a.id])
        .map((g) => `<tr><td><span style="color:${g.color}">■</span> ${g.short}</td><td style="text-align:right"><b>${r.seats[g.id]}</b></td><td style="text-align:right;color:#9aa3b5">${fmt(r.pct[g.id] || 0)}%</td></tr>`)
        .join('');
      tip.show(
        e,
        `<b>${st.name} (${st.code})</b> · ${st.seats} MEPs${r.isOverride ? ' <span style="color:#ffb547">(Custom)</span>' : ''}<table>${rows}</table><div class="muted small" style="margin-top:4px">Click to ${state.brush === 'modal' ? 'edit country breakdown' : 'toggle to ' + GMAP[state.brush].short}</div>`
      );
    }

    function openCountryModal(st) {
      const cur = lastCalc.byState[st.code];
      const localPct = clone(cur.pct);
      ui.modal(`${st.name} (${st.seats} MEPs)`, (body, close) => {
        body.appendChild(el('div', { class: 'muted small', text: 'Quickly assign all seats of this member state to one political group, or fine-tune group vote shares below (allocated by D\'Hondt):' }));
        const quickRow = el('div', { class: 'row' });
        GROUPS.forEach((g) => {
          const b = el('button', { class: 'chip', style: { '--c': g.color } }, [
            el('span', { class: 'swatch', style: { background: g.color } }),
            `All ${st.seats} → ${g.short}`,
          ]);
          b.addEventListener('click', () => {
            state.overrides[st.code] = { type: 'winner', group: g.id };
            update();
            close();
          });
          quickRow.appendChild(b);
        });
        body.appendChild(quickRow);

        const previewEl = el('div', { class: 'note note-info' });
        function refreshPreview() {
          const s = ES.methods.dhondt(localPct, st.seats);
          const parts = GROUPS.filter((g) => s[g.id] > 0).map((g) => `<b style="color:${g.color}">${g.short}: ${s[g.id]}</b>`);
          previewEl.innerHTML = `Projected seats (${st.seats}): ` + (parts.join(' · ') || '–');
        }
        const mSliders = ui.sliders(
          GROUPS.map((g) => ({ id: g.id, name: g.short, leader: g.name, color: g.color })),
          localPct,
          {
            max: 70,
            step: 0.5,
            onChange: () => {
              state.overrides[st.code] = { type: 'pct', pct: clone(localPct) };
              refreshPreview();
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
              text: 'Reset Country to Baseline',
              onclick: () => {
                delete state.overrides[st.code];
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
          const g = dominantGroup(byState[st.code].seats);
          return g.color;
        })
        .classed('override', (d) => byState[ISO_MAP[d.id].code].isOverride);

      boxRects
        .attr('fill', (d) => dominantGroup(byState[d.code].seats).color)
        .classed('override', (d) => byState[d.code].isOverride);

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
      coalBox.appendChild(ui.coalition(hcParties, 720, 361));

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

    update();
  }

  ES.register({
    id: 'eu',
    name: 'EU',
    flag: '🇪🇺',
    title: 'European Union – 2024 European Parliament Election',
    subtitle: '720 MEPs · 27 Member States · Political groups without leaders',
    render,
  });
})();
