/* =========================================================================
   Spain – General Elections (Congreso de los Diputados · 350 Seats · Majority 176)
   Default: Latest 2026 Opinion Polls + 2023 General Election (23J) Preset
   Provincial D'Hondt (3% Threshold) across 17 Autonomous Communities + Ceuta & Melilla
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, clone, normalize } = ES.util;
  const ui = ES.ui;

  const TOTAL_SEATS = 350;
  const MAJORITY = 176;
  const THRESHOLD = 3.0;

  // Ordered left -> centre-left -> regionalist -> centre-right -> right/far-right for Congreso hemicycle
  const PARTIES = [
    { id: 'PODEMOS', short: 'Podemos', name: 'Podemos', leader: 'Ione Belarra / Irene Montero', color: '#7e22ce', bloc: 'left' },
    { id: 'BILDU', short: 'EH Bildu', name: 'Euskal Herria Bildu', leader: 'Arnaldo Otegi / Mertxe Aizpurua', color: '#00b48d', bloc: 'reg_left', regional: ['ES-PV', 'ES-NC'] },
    { id: 'ERC', short: 'ERC', name: 'Esquerra Republicana de Catalunya', leader: 'Oriol Junqueras / Gabriel Rufián', color: '#ffb232', bloc: 'reg_left', regional: ['ES-CT'] },
    { id: 'SUMAR', short: 'Sumar', name: 'Movimiento Sumar & Allies', leader: 'Yolanda Díaz', color: '#e51c55', bloc: 'left' },
    { id: 'BNG', short: 'BNG', name: 'Bloque Nacionalista Galego', leader: 'Ana Pontón / Néstor Rego', color: '#38bdf8', bloc: 'reg_left', regional: ['ES-GA'] },
    { id: 'PSOE', short: 'PSOE', name: 'Partido Socialista Obrero Español', leader: 'Pedro Sánchez', color: '#ef1c27', bloc: 'left' },
    { id: 'PNV', short: 'EAJ-PNV', name: 'Partido Nacionalista Vasco (EAJ-PNV)', leader: 'Aitor Esteban / Aitor Telleria', color: '#16a34a', bloc: 'reg_centre', regional: ['ES-PV', 'ES-NC'] },
    { id: 'CC', short: 'CC / Reg.', name: 'Coalición Canaria & Regionalists (UPN)', leader: 'Fernando Clavijo / Cristina Valido', color: '#eab308', bloc: 'reg_centre', regional: ['ES-CN', 'ES-NC'] },
    { id: 'JUNTS', short: 'Junts', name: 'Junts per Catalunya', leader: 'Carles Puigdemont / Míriam Nogueras', color: '#00c3b2', bloc: 'reg_right', regional: ['ES-CT'] },
    { id: 'PP', short: 'PP', name: 'Partido Popular', leader: 'Alberto Núñez Feijóo', color: '#0056a3', bloc: 'right' },
    { id: 'VOX', short: 'Vox', name: 'Vox', leader: 'Santiago Abascal', color: '#63be21', bloc: 'right' },
    { id: 'SALF', short: 'SALF', name: 'Se Acabó la Fiesta (SALF)', leader: 'Alvise Pérez', color: '#78350f', bloc: 'right' },
  ];

  const PMAP = {};
  PARTIES.forEach((p) => (PMAP[p.id] = p));

  // 17 Autonomous Communities + Ceuta & Melilla (350 seats total, subdivided into actual provincial district magnitudes!)
  const COMMUNITIES = [
    {
      id: 'ES-AN', code: 'AND', name: 'Andalucía', seats: 61, weight: 17.8,
      provinces: [12, 11, 9, 7, 6, 6, 5, 5],
      base: { PP: 36.2, PSOE: 27.8, VOX: 19.5, SUMAR: 7.5, PODEMOS: 3.4, SALF: 2.2 },
    },
    {
      id: 'ES-CT', code: 'CAT', name: 'Catalunya', seats: 48, weight: 15.2,
      provinces: [32, 6, 6, 4],
      base: { PSOE: 30.8, JUNTS: 13.8, ERC: 12.6, PP: 15.2, VOX: 10.5, SUMAR: 9.8, PODEMOS: 3.2, SALF: 1.2 },
    },
    {
      id: 'ES-MD', code: 'MAD', name: 'Comunidad de Madrid', seats: 37, weight: 14.4,
      provinces: [37],
      base: { PP: 39.5, PSOE: 24.5, VOX: 17.2, SUMAR: 9.2, PODEMOS: 4.2, SALF: 2.6 },
    },
    {
      id: 'ES-VC', code: 'VAL', name: 'Comunitat Valenciana', seats: 33, weight: 10.8,
      provinces: [16, 12, 5],
      base: { PP: 34.5, PSOE: 26.8, VOX: 19.8, SUMAR: 9.5, PODEMOS: 3.1, SALF: 2.2 },
    },
    {
      id: 'ES-CL', code: 'CYL', name: 'Castilla y León', seats: 31, weight: 5.4,
      provinces: [5, 4, 4, 4, 3, 3, 3, 3, 2],
      base: { PP: 40.5, PSOE: 28.0, VOX: 19.2, SUMAR: 4.5, PODEMOS: 2.5, SALF: 1.8 },
    },
    {
      id: 'ES-GA', code: 'GAL', name: 'Galicia', seats: 23, weight: 5.9,
      provinces: [8, 7, 4, 4],
      base: { PP: 42.5, PSOE: 25.5, BNG: 13.8, VOX: 8.2, SUMAR: 5.8, PODEMOS: 2.2, SALF: 1.0 },
    },
    {
      id: 'ES-CM', code: 'CLM', name: 'Castilla-La Mancha', seats: 21, weight: 4.4,
      provinces: [6, 5, 4, 3, 3],
      base: { PP: 38.2, PSOE: 29.5, VOX: 21.5, SUMAR: 4.2, PODEMOS: 2.4, SALF: 1.9 },
    },
    {
      id: 'ES-PV', code: 'PVA', name: 'País Vasco (Euskadi)', seats: 18, weight: 4.7,
      provinces: [8, 6, 4],
      base: { BILDU: 27.2, PNV: 25.5, PSOE: 21.8, PP: 11.5, SUMAR: 5.8, PODEMOS: 3.8, VOX: 3.2, SALF: 0.6 },
    },
    {
      id: 'ES-CN', code: 'CNR', name: 'Canarias', seats: 15, weight: 4.1,
      provinces: [8, 7],
      base: { PSOE: 29.2, PP: 30.0, VOX: 15.5, CC: 12.2, SUMAR: 6.2, PODEMOS: 3.5, SALF: 1.8 },
    },
    {
      id: 'ES-AR', code: 'ARA', name: 'Aragón', seats: 13, weight: 2.9,
      provinces: [7, 3, 3],
      base: { PP: 36.5, PSOE: 27.5, VOX: 18.8, SUMAR: 7.5, PODEMOS: 3.0, SALF: 2.0 },
    },
    {
      id: 'ES-MC', code: 'MUR', name: 'Región de Murcia', seats: 10, weight: 3.1,
      provinces: [10],
      base: { PP: 39.0, VOX: 26.5, PSOE: 22.0, SUMAR: 5.5, PODEMOS: 2.8, SALF: 2.5 },
    },
    {
      id: 'ES-EX', code: 'EXT', name: 'Extremadura', seats: 9, weight: 2.4,
      provinces: [5, 4],
      base: { PP: 37.5, PSOE: 33.5, VOX: 17.5, SUMAR: 4.8, PODEMOS: 2.6, SALF: 1.5 },
    },
    {
      id: 'ES-IB', code: 'BAL', name: 'Illes Balears', seats: 8, weight: 2.2,
      provinces: [8],
      base: { PP: 34.8, PSOE: 26.5, VOX: 18.5, SUMAR: 10.5, PODEMOS: 3.5, SALF: 2.0 },
    },
    {
      id: 'ES-AS', code: 'AST', name: 'Principado de Asturias', seats: 7, weight: 2.3,
      provinces: [7],
      base: { PP: 35.2, PSOE: 31.0, VOX: 15.5, SUMAR: 9.5, PODEMOS: 4.0, SALF: 1.6 },
    },
    {
      id: 'ES-NC', code: 'NAV', name: 'Comunidad Foral de Navarra', seats: 5, weight: 1.4,
      provinces: [5],
      base: { PSOE: 25.0, BILDU: 19.5, PP: 17.5, CC: 14.5, VOX: 9.5, SUMAR: 6.5, PNV: 3.5, PODEMOS: 2.8 },
    },
    {
      id: 'ES-CB', code: 'CAN', name: 'Cantabria', seats: 5, weight: 1.3,
      provinces: [5],
      base: { PP: 41.0, PSOE: 28.5, VOX: 17.2, SUMAR: 5.5, PODEMOS: 2.8, SALF: 1.8 },
    },
    {
      id: 'ES-RI', code: 'RIO', name: 'La Rioja', seats: 4, weight: 0.7,
      provinces: [4],
      base: { PP: 42.5, PSOE: 31.0, VOX: 14.8, SUMAR: 5.0, PODEMOS: 2.6, SALF: 1.5 },
    },
    {
      id: 'ES-CE', code: 'CEM', name: 'Ceuta & Melilla', seats: 2, weight: 0.3,
      provinces: [1, 1],
      base: { PP: 41.5, PSOE: 28.5, VOX: 22.0, SUMAR: 3.5, PODEMOS: 1.5, SALF: 1.5 },
    },
  ];

  // Calibrate baseline so weighted national sum matches the Latest October 2026 Spain Poll Average:
  // PP 31.8%, PSOE 26.2%, Vox 18.2%, Sumar 6.2%, Podemos 3.2%, ERC 1.9%, Junts 1.8%, EH Bildu 1.5%, PNV 1.2%, SALF 1.8%, BNG 0.9%, CC/UPN 0.7%
  const TARGET_2026_POLL = {
    PP: 31.8,
    PSOE: 26.2,
    VOX: 18.2,
    SUMAR: 6.2,
    PODEMOS: 3.2,
    ERC: 1.9,
    JUNTS: 1.8,
    SALF: 1.8,
    BILDU: 1.5,
    PNV: 1.2,
    BNG: 0.9,
    CC: 0.7,
  };

  const totalWeight = COMMUNITIES.reduce((a, c) => a + c.weight, 0);
  PARTIES.forEach((p) => {
    const rawW = COMMUNITIES.reduce((a, c) => a + (c.base[p.id] || 0) * c.weight, 0) / totalWeight;
    if (rawW > 0 && TARGET_2026_POLL[p.id] !== undefined) {
      const factor = TARGET_2026_POLL[p.id] / rawW;
      COMMUNITIES.forEach((c) => {
        if (c.base[p.id]) c.base[p.id] = +((c.base[p.id] || 0) * factor).toFixed(2);
      });
    }
  });

  const CMAP = {};
  COMMUNITIES.forEach((c) => (CMAP[c.id] = c));

  let state = null;
  function initState() {
    const commPct = {};
    COMMUNITIES.forEach((c) => (commPct[c.id] = clone(c.base)));
    state = {
      selectedComm: 'ALL',
      brush: 'edit',
      commPct,
      overridden: {},
    };
  }

  function getNationalPct() {
    const nat = {};
    PARTIES.forEach((p) => {
      nat[p.id] = +(COMMUNITIES.reduce((a, c) => a + (state.commPct[c.id][p.id] || 0) * c.weight, 0) / totalWeight).toFixed(2);
    });
    return nat;
  }

  function applyNationalTarget(newNat) {
    const curNat = getNationalPct();
    PARTIES.forEach((p) => {
      const target = newNat[p.id] || 0;
      const cur = curNat[p.id] || 0;
      if (Math.abs(target - cur) < 0.01) return;
      COMMUNITIES.forEach((c) => {
        if (p.regional && !p.regional.includes(c.id)) {
          state.commPct[c.id][p.id] = 0;
          return;
        }
        if (cur > 0.05 && (state.commPct[c.id][p.id] || 0) > 0) {
          state.commPct[c.id][p.id] = +Math.max(0, (state.commPct[c.id][p.id] || 0) * (target / cur)).toFixed(2);
        } else {
          const eligWeight = p.regional
            ? COMMUNITIES.filter((x) => p.regional.includes(x.id)).reduce((a, x) => a + x.weight, 0)
            : totalWeight;
          state.commPct[c.id][p.id] = +((target * totalWeight) / Math.max(1, eligWeight)).toFixed(2);
        }
      });
    });
  }

  function calculateCongreso() {
    const nat = normalize(getNationalPct(), 100);
    const totalSeats = {};
    const commSeats = {};
    const commWinner = {};
    PARTIES.forEach((p) => (totalSeats[p.id] = 0));

    COMMUNITIES.forEach((c) => {
      const pcts = normalize(state.commPct[c.id], 100);
      commSeats[c.id] = {};
      PARTIES.forEach((p) => (commSeats[c.id][p.id] = 0));

      // Allocate across each province in this Autonomous Community via D'Hondt (3% provincial threshold)
      c.provinces.forEach((provMag, pIdx) => {
        const provVotes = {};
        PARTIES.forEach((p) => {
          const v = pcts[p.id] || 0;
          if (v >= THRESHOLD || provMag === 1) {
            // Slight deterministic provincial tilt inside multi-province communities
            const mod = c.provinces.length > 1 ? 1 + ((pIdx % 2 === 0 ? 1 : -1) * (p.bloc === 'right' ? -0.04 : 0.04)) : 1;
            provVotes[p.id] = v * mod;
          }
        });
        const alloc = ES.methods.dhondt(provVotes, provMag, 0);
        Object.entries(alloc).forEach(([pid, s]) => {
          commSeats[c.id][pid] = (commSeats[c.id][pid] || 0) + s;
          totalSeats[pid] = (totalSeats[pid] || 0) + s;
        });
      });

      // Determine leading party in this Autonomous Community
      let bestP = 'PP', bestV = -1;
      PARTIES.forEach((p) => {
        if ((pcts[p.id] || 0) > bestV) {
          bestV = pcts[p.id] || 0;
          bestP = p.id;
        }
      });
      commWinner[c.id] = { party: PMAP[bestP], pct: bestV };
    });

    return { nat, totalSeats, commSeats, commWinner };
  }

  function applyPreset(kind) {
    state.overridden = {};
    COMMUNITIES.forEach((c) => (state.commPct[c.id] = clone(c.base)));
    if (kind === '2026_polls') {
      // Already at TARGET_2026_POLL
    } else if (kind === '2023_actual') {
      // July 2023 General Election (23J): PP 33.1%, PSOE 31.7%, Vox 12.4%, Sumar 12.3% (incl. Podemos), ERC 1.9%, Junts 1.6%, Bildu 1.4%, PNV 1.1%, BNG 0.6%, CC 0.5%
      applyNationalTarget({
        PP: 33.06, PSOE: 31.68, VOX: 12.38, SUMAR: 12.33, PODEMOS: 0.0,
        ERC: 1.89, JUNTS: 1.60, BILDU: 1.36, PNV: 1.12, BNG: 0.62, CC: 0.68, SALF: 0.0,
      });
    } else if (kind === 'sanchez_majority') {
      applyNationalTarget({
        PSOE: 31.5, PP: 30.2, VOX: 13.5, SUMAR: 10.8, PODEMOS: 3.2,
        ERC: 2.1, JUNTS: 1.9, BILDU: 1.6, PNV: 1.3, BNG: 0.9, CC: 0.7, SALF: 1.0,
      });
    } else if (kind === 'right_landslide') {
      applyNationalTarget({
        PP: 36.5, PSOE: 24.0, VOX: 19.5, SUMAR: 5.5, PODEMOS: 2.8,
        SALF: 2.4, JUNTS: 1.8, ERC: 1.7, BILDU: 1.4, PNV: 1.2, BNG: 0.8, CC: 0.7,
      });
    }
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    /* ---- Left Column: Scenarios, Community Selector, Sliders ---- */
    const scenCard = ui.card('Spanish General Election Scenarios & Polls');
    L.left.appendChild(scenCard.card);

    scenCard.body.appendChild(
      el('div', { class: 'row', style: { gap: '6px', marginBottom: '8px' } }, [
        el('button', {
          class: 'btn btn-primary',
          text: 'Latest 2026 Polls (PP + Vox Lead)',
          onclick: () => {
            applyPreset('2026_polls');
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: '2023 Actual Election (23J – Sánchez Investiture)',
          onclick: () => {
            applyPreset('2023_actual');
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Left + Regionalists 178+ Majority',
          onclick: () => {
            applyPreset('sanchez_majority');
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Right Surge (PP + Vox Super-Bloc)',
          onclick: () => {
            applyPreset('right_landslide');
            rebuildSliders();
            update();
          },
        }),
      ])
    );

    scenCard.body.appendChild(
      ui.note(
        '<b>Spanish Electoral System (350 Deputies):</b> Allocated across 50 multi-member provinces (grouped into 17 Autonomous Communities) using <b>D\'Hondt</b> with a 3% provincial threshold, plus 2 single-member seats in Ceuta &amp; Melilla. Small inland provinces strongly reward the top 2–3 nationwide parties, while nationalist parties (<b>Junts, ERC, EH Bildu, PNV, BNG, CC</b>) win concentrated seats in their home communities.'
      )
    );

    const commCard = ui.card('Select Autonomous Community or National Vote Share (%)');
    L.left.appendChild(commCard.card);
    const commOpts = [{ value: 'ALL', label: '🇪🇸 All Spain – National Vote Share (%)' }].concat(
      COMMUNITIES.map((c) => ({ value: c.id, label: `${c.name} (${c.code}) · ${c.seats} Deputies` }))
    );
    const commSelect = ui.select(commOpts, state.selectedComm, (v) => {
      state.selectedComm = v;
      rebuildSliders();
      update();
    });
    commSelect.style.width = '100%';
    commCard.body.appendChild(commSelect);

    const slHeaderSpan = el('span', { text: 'Party Vote Shares (%)' });
    const slCard = ui.card('Party Vote Shares (%)');
    slCard.card.querySelector('h3').replaceWith(slHeaderSpan);
    L.left.appendChild(slCard.card);
    const slBox = el('div');
    slCard.body.appendChild(slBox);

    let activeSliders = null;
    function rebuildSliders() {
      slBox.innerHTML = '';
      if (state.selectedComm === 'ALL') {
        slHeaderSpan.textContent = 'NATIONAL VOTE SHARE (%) – CONGRESO DE LOS DIPUTADOS';
        const natVals = getNationalPct();
        activeSliders = ui.sliders(
          PARTIES.map((p) => ({ id: p.id, name: p.short, leader: p.leader, color: p.color })),
          natVals,
          {
            max: 45,
            step: 0.1,
            onChange: (vals) => {
              applyNationalTarget(vals);
              update(true);
            },
          }
        );
        slBox.appendChild(activeSliders.el);
      } else {
        const comm = CMAP[state.selectedComm];
        slHeaderSpan.textContent = `${comm.name.toUpperCase()} (${comm.seats} SEATS) – COMMUNITY VOTE %`;
        const eligParties = PARTIES.filter((p) => !p.regional || p.regional.includes(comm.id));
        activeSliders = ui.sliders(
          eligParties.map((p) => ({ id: p.id, name: p.short, leader: p.leader, color: p.color })),
          state.commPct[comm.id],
          {
            max: 55,
            step: 0.1,
            onChange: () => {
              state.overridden[comm.id] = true;
              update(true);
            },
          }
        );
        slBox.appendChild(activeSliders.el);
        slBox.appendChild(
          el('div', { class: 'row', style: { marginTop: '10px' } }, [
            el('button', {
              class: 'btn btn-xs',
              text: `Reset ${comm.code} to Baseline`,
              onclick: () => {
                state.commPct[comm.id] = clone(comm.base);
                delete state.overridden[comm.id];
                rebuildSliders();
                update();
              },
            }),
            el('button', {
              class: 'btn btn-xs',
              text: '← Back to National Sliders',
              onclick: () => {
                state.selectedComm = 'ALL';
                commSelect.value = 'ALL';
                rebuildSliders();
                update();
              },
            }),
          ])
        );
      }
    }

    /* ---- Right Column: Map + Hemicycle + Coalition Studio + Table ---- */
    const mapCard = ui.card('17 Autonomous Communities + Ceuta & Melilla Map (Click to Edit % or Paint)');
    L.right.appendChild(mapCard.card);

    const toolbar = el('div', { class: 'map-toolbar' });
    const makeBrush = (id, label, color) => {
      const b = el(
        'button',
        { class: 'paint-chip' + (state.brush === id ? ' active' : ''), style: { '--c': color } },
        [id !== 'edit' ? el('span', { class: 'swatch', style: { background: color } }) : null, label]
      );
      b.addEventListener('click', () => {
        state.brush = id;
        toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      });
      return b;
    };
    toolbar.appendChild(makeBrush('edit', '🎛️ Select & Edit Community %', '#5b8cff'));
    ['PP', 'PSOE', 'VOX', 'SUMAR', 'PODEMOS', 'JUNTS', 'ERC', 'BILDU', 'PNV', 'BNG', 'CC'].forEach((pid) => {
      const p = PMAP[pid];
      toolbar.appendChild(makeBrush(p.id, p.short, p.color));
    });
    mapCard.body.appendChild(toolbar);

    const mapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const mapWrap = el('div', { class: 'map-wrap' });
    const commTableBox = el('div', { style: { maxHeight: '360px', overflowY: 'auto' } });
    mapGrid.appendChild(mapWrap);
    mapGrid.appendChild(commTableBox);
    mapCard.body.appendChild(mapGrid);

    const hcCard = ui.card('Congreso de los Diputados – 350 Seats (176 Needed for Majority)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const barBox = el('div');
    const blocNoteBox = el('div', { style: { marginTop: '10px' } });
    const coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(blocNoteBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('National Results – Congress of Deputies (350 Seats)');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    // Build SVG Map of Spain
    const tip = ui.tooltip();
    const W = 500, H = 390;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_ES);
    const path = d3.geoPath(proj);

    const commPaths = svg.append('g')
      .selectAll('path')
      .data(window.GEO_ES.features)
      .join('path')
      .attr('class', 'unit')
      .attr('d', path)
      .on('click', (e, d) => handleCommClick(CMAP[d.properties.id]))
      .on('mouseenter', (e, d) => showCommTip(e, CMAP[d.properties.id]))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g')
      .selectAll('text')
      .data(window.GEO_ES.features)
      .join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => d.properties.code);

    let lastCalc = null;

    function handleCommClick(comm) {
      if (!comm) return;
      if (state.brush === 'edit') {
        state.selectedComm = comm.id;
        commSelect.value = comm.id;
        rebuildSliders();
        update();
      } else {
        const pid = state.brush;
        const pObj = PMAP[pid];
        if (pObj.regional && !pObj.regional.includes(comm.id)) {
          // Allow regional party override if painted explicitly
        }
        const cur = state.commPct[comm.id];
        const othersSum = Object.keys(cur).reduce((a, k) => a + (k === pid ? 0 : cur[k]), 0);
        const targetShare = 42.0;
        Object.keys(cur).forEach((k) => {
          if (k === pid) cur[k] = targetShare;
          else if (othersSum > 0) cur[k] = +((cur[k] / othersSum) * (100 - targetShare)).toFixed(1);
        });
        cur[pid] = targetShare;
        state.overridden[comm.id] = true;
        rebuildSliders();
        update();
      }
      if (ES.sfx) ES.sfx.click();
    }

    function showCommTip(e, comm) {
      if (!comm || !lastCalc) return;
      const pcts = normalize(state.commPct[comm.id], 100);
      const cSeats = lastCalc.commSeats[comm.id] || {};
      const rows = PARTIES.filter((p) => (pcts[p.id] || 0) >= 1.0 || (cSeats[p.id] || 0) > 0)
        .sort((a, b) => (pcts[b.id] || 0) - (pcts[a.id] || 0))
        .slice(0, 7)
        .map((p) => `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right">${fmt(pcts[p.id], 1)}%</td><td style="text-align:right"><b>${cSeats[p.id] || 0}</b></td></tr>`)
        .join('');
      tip.show(
        e,
        `<b>${comm.name}</b> · ${comm.seats} Deputies<table><tr><td>Party</td><td style="text-align:right">Vote</td><td style="text-align:right">Seats</td></tr>${rows}</table>`
      );
    }

    function update(fromSliders) {
      const calc = calculateCongreso();
      lastCalc = calc;
      const { nat, totalSeats, commSeats, commWinner } = calc;

      if (!fromSliders && state.selectedComm === 'ALL' && activeSliders) {
        activeSliders.setValues(clone(nat));
      }

      commPaths
        .attr('fill', (d) => {
          const w = commWinner[d.properties.id];
          return w ? w.party.color : '#334155';
        })
        .classed('override', (d) => !!state.overridden[d.properties.id]);

      const cRows = COMMUNITIES.map((c) => {
        const w = commWinner[c.id];
        return el('tr', {
          style: { cursor: 'pointer', background: state.selectedComm === c.id ? 'rgba(91,140,255,0.16)' : '' },
          onclick: () => handleCommClick(c),
        }, [
          el('td', {}, [
            el('span', { class: 'swatch', style: { background: w.party.color } }),
            el('span', { text: `${c.code} · ${c.name}` }),
          ]),
          el('td', { class: 'num muted', text: c.seats }),
          el('td', { class: 'num', html: `<b style="color:${w.party.color}">${w.party.short}</b> ${fmt(w.pct, 1)}%` }),
        ]);
      });
      commTableBox.innerHTML = '';
      commTableBox.appendChild(
        el('table', { class: 'results' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Community (Click)' }), el('th', { text: 'Seats' }), el('th', { text: '1st Party' })])),
          el('tbody', {}, cRows),
        ])
      );

      const hcParties = PARTIES.map((p) => ({
        id: p.id,
        short: p.short,
        name: p.name,
        leader: p.leader,
        color: p.color,
        seats: totalSeats[p.id] || 0,
      }));

      const rightBloc = ['PP', 'VOX', 'SALF'].reduce((a, id) => a + (totalSeats[id] || 0), 0);
      const leftBloc = ['PSOE', 'SUMAR', 'PODEMOS'].reduce((a, id) => a + (totalSeats[id] || 0), 0);
      const regBloc = ['ERC', 'JUNTS', 'BILDU', 'PNV', 'BNG', 'CC'].reduce((a, id) => a + (totalSeats[id] || 0), 0);
      const investitureBloc = leftBloc + regBloc;

      ES.hemicycle(hcBox, hcParties, {
        total: TOTAL_SEATS,
        majority: MAJORITY,
        subtitle: `Majority: 176 · Right Bloc (PP+Vox): ${rightBloc} · Left (PSOE+Sumar): ${leftBloc} · Regionalists: ${regBloc}`,
      });

      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(hcParties, TOTAL_SEATS, MAJORITY, { label: '176 Deputies required for an absolute majority in the Congreso', unit: 'Deputies' }));

      blocNoteBox.innerHTML = '';
      blocNoteBox.appendChild(
        ui.note(
          `<b>Spanish Parliamentary Blocs:</b> Right Bloc (PP + Vox + SALF): <b>${rightBloc} seats</b> · Progressive Bloc (PSOE + Sumar + Podemos): <b>${leftBloc} seats</b> · Nationalist &amp; Regional Parties (Junts, ERC, EH Bildu, EAJ-PNV, BNG, CC): <b>${regBloc} seats</b> (Combined Left + Regional Investiture Bloc: <b>${investitureBloc} seats</b>).`,
          rightBloc >= MAJORITY || investitureBloc >= MAJORITY ? 'info' : 'warn'
        )
      );

      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hcParties, TOTAL_SEATS, MAJORITY));

      const rows = PARTIES.map((p) => {
        const s = totalSeats[p.id] || 0;
        const v = nat[p.id] || 0;
        return {
          id: p.id,
          color: p.color,
          name: p.short,
          leader: `${p.leader} (${p.name})`,
          votes: v,
          scope: p.regional ? '<span class="muted">Regional</span>' : 'National',
          seats: s,
          seatPct: (s / TOTAL_SEATS) * 100,
          dim: s === 0,
        };
      }).sort((a, b) => b.seats - a.seats || b.votes - a.votes);

      tblBox.innerHTML = '';
      tblBox.appendChild(
        ui.resultsTable(rows, {
          nameLabel: 'Party & Leader',
          columns: [
            { key: 'votes', label: 'Nat. Vote %', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'scope', label: 'Scope' },
            { key: 'seats', label: 'Deputies (350)', fmt: (v) => `<b>${v}</b>` },
            { key: 'seatPct', label: 'Seat %', fmt: (v) => fmt(v, 1) + '%' },
          ],
        })
      );
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'spain',
    name: 'Spain',
    flag: '🇪🇸',
    title: 'Spain – General Elections (Congreso de los Diputados)',
    subtitle: '350 Deputies · Majority 176 · Provincial D\'Hondt (3% Threshold) · 17 Autonomous Communities + Ceuta & Melilla',
    render,
  });
})();
