/* =========================================================================
   Canada – 2025 Federal Election (45th Parliament · 343 Ridings · FPTP)
   10 Provinces & 3 Territories Interactive Map + Coalition Studio
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, clone, normalize, rng, noise, argmax } = ES.util;
  const ui = ES.ui;

  const TOTAL_SEATS = 343;
  const MAJORITY = 172;

  // Ordered left -> right for House of Commons hemicycle
  const PARTIES = [
    { id: 'NDP', short: 'NDP', name: 'New Democratic Party (NDP)', leader: 'Jagmeet Singh', color: '#f37021' },
    { id: 'GPC', short: 'Green', name: 'Green Party of Canada', leader: 'Elizabeth May & Jonathan Pedneault', color: '#3d9b35' },
    { id: 'BQ', short: 'Bloc', name: 'Bloc Québécois', leader: 'Yves-François Blanchet', color: '#33b2cc', qcOnly: true },
    { id: 'LPC', short: 'Liberal', name: 'Liberal Party of Canada', leader: 'Mark Carney', color: '#d71920' },
    { id: 'CPC', short: 'Conservative', name: 'Conservative Party of Canada', leader: 'Pierre Poilievre', color: '#1a4782' },
    { id: 'PPC', short: 'PPC', name: 'People\'s Party of Canada', leader: 'Maxime Bernier', color: '#6f2da8' },
  ];

  const PMAP = {};
  PARTIES.forEach((p) => (PMAP[p.id] = p));

  // 10 Provinces & 3 Territories (343 seats under 2023 Representation Order)
  // Baseline reflects 2025 Federal Election result (Mark Carney Liberals winning strong minority / near-majority vs Poilievre Conservatives)
  const PROVINCES = [
    { id: 'CA-ON', code: 'ON', name: 'Ontario', seats: 122, weight: 38.2, base: { LPC: 46.8, CPC: 43.2, NDP: 6.4, GPC: 1.9, PPC: 1.1, BQ: 0 } },
    { id: 'CA-QC', code: 'QC', name: 'Quebec', seats: 78, weight: 22.8, base: { LPC: 42.5, BQ: 28.2, CPC: 22.4, NDP: 4.5, GPC: 1.3, PPC: 0.9 } },
    { id: 'CA-BC', code: 'BC', name: 'British Columbia', seats: 43, weight: 13.4, base: { CPC: 43.5, LPC: 40.2, NDP: 11.8, GPC: 3.2, PPC: 1.0, BQ: 0 } },
    { id: 'CA-AB', code: 'AB', name: 'Alberta', seats: 37, weight: 11.2, base: { CPC: 61.5, LPC: 26.8, NDP: 8.8, GPC: 1.1, PPC: 1.5, BQ: 0 } },
    { id: 'CA-MB', code: 'MB', name: 'Manitoba', seats: 14, weight: 3.4, base: { CPC: 46.2, LPC: 37.5, NDP: 13.2, GPC: 1.6, PPC: 1.2, BQ: 0 } },
    { id: 'CA-SK', code: 'SK', name: 'Saskatchewan', seats: 14, weight: 3.0, base: { CPC: 63.0, LPC: 23.5, NDP: 10.8, GPC: 1.1, PPC: 1.4, BQ: 0 } },
    { id: 'CA-NS', code: 'NS', name: 'Nova Scotia', seats: 11, weight: 2.9, base: { LPC: 54.5, CPC: 35.0, NDP: 7.5, GPC: 1.8, PPC: 1.0, BQ: 0 } },
    { id: 'CA-NB', code: 'NB', name: 'New Brunswick', seats: 10, weight: 2.3, base: { LPC: 51.0, CPC: 39.5, NDP: 5.2, GPC: 2.8, PPC: 1.2, BQ: 0 } },
    { id: 'CA-NL', code: 'NL', name: 'Newfoundland and Labrador', seats: 7, weight: 1.4, base: { LPC: 53.0, CPC: 37.5, NDP: 7.8, GPC: 0.9, PPC: 0.7, BQ: 0 } },
    { id: 'CA-PE', code: 'PE', name: 'Prince Edward Island', seats: 4, weight: 0.5, base: { LPC: 54.0, CPC: 35.5, NDP: 5.0, GPC: 4.5, PPC: 0.8, BQ: 0 } },
    { id: 'CA-NT', code: 'NT', name: 'Northwest Territories', seats: 1, weight: 0.3, base: { LPC: 46.0, NDP: 28.0, CPC: 23.0, GPC: 2.0, PPC: 1.0, BQ: 0 } },
    { id: 'CA-YT', code: 'YT', name: 'Yukon', seats: 1, weight: 0.3, base: { LPC: 45.0, CPC: 36.0, NDP: 15.0, GPC: 3.0, PPC: 1.0, BQ: 0 } },
    { id: 'CA-NU', code: 'NU', name: 'Nunavut', seats: 1, weight: 0.3, base: { NDP: 42.0, LPC: 36.0, CPC: 19.0, GPC: 2.0, PPC: 1.0, BQ: 0 } },
  ];

  const PROVMAP = {};
  PROVINCES.forEach((p) => (PROVMAP[p.id] = p));
  const totalWeight = PROVINCES.reduce((a, p) => a + p.weight, 0);

  // Pre-build 343 deterministic ridings with local political geography multipliers
  const RIDINGS = (function buildRidings() {
    const rnd = rng('canada-343-ridings-v1');
    const list = [];
    let rid = 1;
    PROVINCES.forEach((prov) => {
      for (let i = 0; i < prov.seats; i++) {
        const u = rnd();
        const mult = { LPC: 1, CPC: 1, NDP: 1, BQ: 1, GPC: 1, PPC: 1 };

        if (prov.code === 'ON') {
          if (u < 0.36) { mult.LPC = 1.28; mult.CPC = 0.76; } // Metro Toronto / Ottawa
          else if (u < 0.68) { mult.LPC = 1.04; mult.CPC = 1.04; } // 905 GTA suburbs battleground
          else if (u < 0.92) { mult.CPC = 1.32; mult.LPC = 0.74; } // Rural / SW Ontario
          else { mult.NDP = 2.65; mult.LPC = 0.88; mult.CPC = 0.82; } // Hamilton / Windsor / Northern ON NDP pockets
          if (i === 0) { mult.GPC = 8.5; mult.LPC = 0.65; mult.CPC = 0.65; } // Kitchener Centre / Guelph Green pocket
        } else if (prov.code === 'QC') {
          if (u < 0.35) { mult.LPC = 1.52; mult.BQ = 0.52; mult.CPC = 0.62; } // Greater Montreal / Outaouais
          else if (u < 0.78) { mult.BQ = 1.42; mult.LPC = 0.82; mult.CPC = 0.78; } // Couronne / Nationalist Francophone ridings
          else if (u < 0.96) { mult.CPC = 1.78; mult.BQ = 1.08; mult.LPC = 0.55; } // Quebec City / Beauce / Chaudière-Appalaches
          else { mult.NDP = 3.8; mult.LPC = 0.85; mult.BQ = 0.85; } // Rosemont—La Petite-Patrie
        } else if (prov.code === 'BC') {
          if (u < 0.38) { mult.LPC = 1.28; mult.CPC = 0.78; } // Vancouver / Burnaby / North Shore
          else if (u < 0.76) { mult.CPC = 1.32; mult.LPC = 0.75; } // Interior / North / Fraser Valley
          else if (u < 0.95) { mult.NDP = 2.15; mult.CPC = 0.92; mult.LPC = 0.75; } // Vancouver Island / East Van
          else { mult.GPC = 6.5; mult.LPC = 0.72; mult.CPC = 0.72; } // Saanich—Gulf Islands
        } else if (prov.code === 'AB' || prov.code === 'SK') {
          if (u < 0.14) { mult.LPC = 1.55; mult.CPC = 0.68; } // Urban Edmonton / Calgary core
          else if (u < 0.22) { mult.NDP = 2.85; mult.CPC = 0.68; mult.LPC = 0.75; } // Edmonton Strathcona / Griesbach
          else { mult.CPC = 1.22; mult.LPC = 0.72; }
        } else if (prov.code === 'MB') {
          if (u < 0.42) { mult.LPC = 1.35; mult.CPC = 0.72; } // South/Central Winnipeg
          else if (u < 0.57) { mult.NDP = 2.45; mult.CPC = 0.68; } // Winnipeg Centre / Elmwood / Churchill
          else { mult.CPC = 1.38; mult.LPC = 0.65; } // Rural Manitoba
        } else {
          // Atlantic & Territories
          if (u < 0.68) { mult.LPC = 1.16; mult.CPC = 0.86; }
          else { mult.CPC = 1.28; mult.LPC = 0.78; }
        }

        PARTIES.forEach((p) => {
          mult[p.id] *= Math.exp(noise(rnd) * 0.14);
        });

        list.push({ id: rid++, provId: prov.id, num: i + 1, mult });
      }
    });
    return list;
  })();

  let state = null;
  function initState() {
    const provPct = {};
    PROVINCES.forEach((p) => (provPct[p.id] = clone(p.base)));
    state = {
      selectedProv: 'ALL',
      brush: 'edit', // 'edit' | partyId
      provPct,
      overridden: {},
    };
  }

  function getNationalPct() {
    const nat = {};
    PARTIES.forEach((p) => {
      nat[p.id] = +(PROVINCES.reduce((a, pr) => a + (state.provPct[pr.id][p.id] || 0) * pr.weight, 0) / totalWeight).toFixed(2);
    });
    return nat;
  }

  function applyNationalTarget(newNat) {
    const curNat = getNationalPct();
    PARTIES.forEach((p) => {
      const target = newNat[p.id] || 0;
      const cur = curNat[p.id] || 0;
      if (Math.abs(target - cur) < 0.01) return;
      PROVINCES.forEach((pr) => {
        if (p.qcOnly && pr.id !== 'CA-QC') return;
        if (cur > 0.1) {
          state.provPct[pr.id][p.id] = +Math.max(0, (state.provPct[pr.id][p.id] || 0) * (target / cur)).toFixed(2);
        } else {
          state.provPct[pr.id][p.id] = +(p.qcOnly ? target * (100 / pr.weight) : target).toFixed(2);
        }
      });
    });
  }

  function simulateCommons() {
    const nat = normalize(getNationalPct(), 100);
    const seats = {};
    const provSeats = {};
    PARTIES.forEach((p) => (seats[p.id] = 0));
    PROVINCES.forEach((pr) => {
      provSeats[pr.id] = {};
      PARTIES.forEach((p) => (provSeats[pr.id][p.id] = 0));
    });

    RIDINGS.forEach((r) => {
      const pShares = state.provPct[r.provId];
      const local = {};
      PARTIES.forEach((p) => {
        if (p.qcOnly && r.provId !== 'CA-QC') return;
        local[p.id] = (pShares[p.id] || 0) * r.mult[p.id];
      });
      const winId = argmax(local);
      seats[winId] = (seats[winId] || 0) + 1;
      provSeats[r.provId][winId] = (provSeats[r.provId][winId] || 0) + 1;
    });

    return { nat, seats, provSeats };
  }

  function leadingPartyInProv(provId, provSeats) {
    const ps = provSeats[provId] || {};
    const pcts = state.provPct[provId];
    let best = 'LPC', maxS = -1, maxV = -1;
    PARTIES.forEach((p) => {
      const s = ps[p.id] || 0;
      const v = pcts[p.id] || 0;
      if (s > maxS || (s === maxS && v > maxV)) {
        maxS = s;
        maxV = v;
        best = p.id;
      }
    });
    return { party: PMAP[best], seats: maxS, pct: pcts[best] || 0 };
  }

  function applyPreset(kind) {
    state.overridden = {};
    PROVINCES.forEach((p) => (state.provPct[p.id] = clone(p.base)));
    if (kind === '2025_actual') {
      // Already baseline
    } else if (kind === 'lpc_majority') {
      applyNationalTarget({ LPC: 46.5, CPC: 36.5, BQ: 6.5, NDP: 7.0, GPC: 2.0, PPC: 1.0 });
    } else if (kind === 'cpc_majority') {
      applyNationalTarget({ CPC: 45.0, LPC: 33.5, BQ: 7.5, NDP: 10.5, GPC: 2.0, PPC: 1.2 });
    } else if (kind === 'tight_minority') {
      applyNationalTarget({ LPC: 39.0, CPC: 39.5, BQ: 8.2, NDP: 9.8, GPC: 2.2, PPC: 1.1 });
    } else if (kind === '2021_result') {
      applyNationalTarget({ CPC: 33.7, LPC: 32.6, NDP: 17.8, BQ: 7.6, PPC: 4.9, GPC: 2.3 });
    }
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    /* ---- Left Column: Scenarios, Province Selector, Sliders ---- */
    const scenCard = ui.card('2025 Canadian Election Scenarios');
    L.left.appendChild(scenCard.card);
    scenCard.body.appendChild(
      el('div', { class: 'row', style: { gap: '6px' } }, [
        el('button', {
          class: 'btn btn-primary',
          text: '2025 Baseline (Carney vs Poilievre)',
          onclick: () => { applyPreset('2025_actual'); rebuildSliders(); update(); },
        }),
        el('button', {
          class: 'btn',
          text: 'Liberal Majority Wave',
          onclick: () => { applyPreset('lpc_majority'); rebuildSliders(); update(); },
        }),
        el('button', {
          class: 'btn',
          text: 'Conservative Majority Wave',
          onclick: () => { applyPreset('cpc_majority'); rebuildSliders(); update(); },
        }),
        el('button', {
          class: 'btn',
          text: 'Hung Minority (BQ/NDP Balance)',
          onclick: () => { applyPreset('tight_minority'); rebuildSliders(); update(); },
        }),
        el('button', {
          class: 'btn',
          text: '2021 Federal Result',
          onclick: () => { applyPreset('2021_result'); rebuildSliders(); update(); },
        }),
      ])
    );

    const selCard = ui.card('Select Province / Territory or National Vote Share');
    L.left.appendChild(selCard.card);
    const provOpts = [{ value: 'ALL', label: '🇨🇦 All Canada – National Vote Share (%)' }].concat(
      PROVINCES.map((p) => ({ value: p.id, label: `${p.name} (${p.code}) · ${p.seats} seats` }))
    );
    const provSelect = ui.select(provOpts, state.selectedProv, (v) => {
      state.selectedProv = v;
      rebuildSliders();
      update();
    });
    provSelect.style.width = '100%';
    selCard.body.appendChild(provSelect);

    const slHeaderSpan = el('span', { text: 'Party Vote Shares (%)' });
    const slCard = ui.card('Party Vote Shares (%)');
    slCard.card.querySelector('h3').replaceWith(slHeaderSpan);
    L.left.appendChild(slCard.card);
    const slBox = el('div');
    slCard.body.appendChild(slBox);

    let activeSliders = null;
    function rebuildSliders() {
      slBox.innerHTML = '';
      if (state.selectedProv === 'ALL') {
        slHeaderSpan.textContent = 'NATIONAL POPULAR VOTE (%) – SWINGS ALL 343 RIDINGS';
        const natVals = getNationalPct();
        activeSliders = ui.sliders(
          PARTIES.map((p) => ({ id: p.id, name: p.short, leader: p.leader, color: p.color })),
          natVals,
          {
            max: 60,
            step: 0.1,
            onChange: (vals) => {
              applyNationalTarget(vals);
              update(true);
            },
          }
        );
        slBox.appendChild(activeSliders.el);
      } else {
        const prov = PROVMAP[state.selectedProv];
        slHeaderSpan.textContent = `${prov.name.toUpperCase()} (${prov.seats} SEATS) – PROVINCIAL VOTE (%)`;
        const localParties = PARTIES.filter((p) => !p.qcOnly || prov.id === 'CA-QC');
        activeSliders = ui.sliders(
          localParties.map((p) => ({ id: p.id, name: p.short, leader: p.leader, color: p.color })),
          state.provPct[prov.id],
          {
            max: 75,
            step: 0.1,
            onChange: () => {
              state.overridden[prov.id] = true;
              update(true);
            },
          }
        );
        slBox.appendChild(activeSliders.el);
        slBox.appendChild(
          el('div', { class: 'row', style: { marginTop: '10px' } }, [
            el('button', {
              class: 'btn btn-xs',
              text: `Reset ${prov.code} to 2025 Baseline`,
              onclick: () => {
                state.provPct[prov.id] = clone(prov.base);
                delete state.overridden[prov.id];
                rebuildSliders();
                update();
              },
            }),
            el('button', {
              class: 'btn btn-xs',
              text: '← Back to National Sliders',
              onclick: () => {
                state.selectedProv = 'ALL';
                provSelect.value = 'ALL';
                rebuildSliders();
                update();
              },
            }),
          ])
        );
      }
    }

    /* ---- Right Column: Map + Hemicycle + Coalition Studio + Table ---- */
    const mapCard = ui.card('10 Provinces & 3 Territories Map (Click to Edit Province % or Paint Winner)');
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
    toolbar.appendChild(makeBrush('edit', '🎛️ Select & Edit Province %', '#5b8cff'));
    ['LPC', 'CPC', 'BQ', 'NDP', 'GPC'].forEach((pid) => {
      const p = PMAP[pid];
      toolbar.appendChild(makeBrush(p.id, p.short, p.color));
    });
    mapCard.body.appendChild(toolbar);

    const mapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const mapWrap = el('div', { class: 'map-wrap' });
    const provTableBox = el('div');
    mapGrid.appendChild(mapWrap);
    mapGrid.appendChild(provTableBox);
    mapCard.body.appendChild(mapGrid);

    const hcCard = ui.card('45th House of Commons – 343 Seats (172 Needed for Majority Government)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const barBox = el('div');
    const coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('National Seat & Popular Vote Breakdown');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    // Build SVG Map of Canada using Conic Conformal projection
    const tip = ui.tooltip();
    const W = 480, H = 430;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoConicConformal().rotate([96, 0]).parallels([49, 77]).fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_CA);
    const path = d3.geoPath(proj);

    let lastSim = null;

    const provPaths = svg.append('g')
      .selectAll('path')
      .data(window.GEO_CA.features)
      .join('path')
      .attr('class', 'unit')
      .attr('d', path)
      .on('click', (e, d) => handleProvClick(PROVMAP[d.properties.id]))
      .on('mouseenter', (e, d) => showProvTip(e, PROVMAP[d.properties.id]))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g')
      .selectAll('text')
      .data(window.GEO_CA.features)
      .join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => d.properties.code);

    function handleProvClick(prov) {
      if (!prov) return;
      if (state.brush === 'edit') {
        state.selectedProv = prov.id;
        provSelect.value = prov.id;
        rebuildSliders();
        update();
      } else {
        let pid = state.brush;
        if (pid === 'BQ' && prov.id !== 'CA-QC') pid = 'LPC';
        const cur = state.provPct[prov.id];
        const othersSum = Object.keys(cur).reduce((a, k) => a + (k === pid ? 0 : cur[k]), 0);
        const targetShare = 48.0;
        Object.keys(cur).forEach((k) => {
          if (k === pid) cur[k] = targetShare;
          else if (othersSum > 0) cur[k] = +((cur[k] / othersSum) * (100 - targetShare)).toFixed(1);
        });
        state.overridden[prov.id] = true;
        rebuildSliders();
        update();
      }
      if (ES.sfx) ES.sfx.click();
    }

    function showProvTip(e, prov) {
      if (!prov || !lastSim) return;
      const pcts = state.provPct[prov.id];
      const pSeats = lastSim.provSeats[prov.id] || {};
      const rows = PARTIES.filter((p) => (pcts[p.id] || 0) >= 0.5 || (pSeats[p.id] || 0) > 0)
        .sort((a, b) => (pSeats[b.id] || 0) - (pSeats[a.id] || 0) || (pcts[b.id] || 0) - (pcts[a.id] || 0))
        .map((p) => `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right">${fmt(pcts[p.id], 1)}%</td><td style="text-align:right"><b>${pSeats[p.id] || 0} MPs</b></td></tr>`)
        .join('');
      tip.show(
        e,
        `<b>${prov.name} (${prov.code})</b> · ${prov.seats} Seats<table>${rows}</table><div class="muted small">Click to ${state.brush === 'edit' ? 'edit province %' : 'paint ' + PMAP[state.brush].short}</div>`
      );
    }

    function update(fromSliders) {
      lastSim = simulateCommons();
      const { nat, seats, provSeats } = lastSim;

      if (!fromSliders && state.selectedProv === 'ALL' && activeSliders) {
        activeSliders.setValues(clone(nat));
      }

      provPaths
        .attr('fill', (d) => leadingPartyInProv(d.properties.id, provSeats).party.color)
        .classed('override', (d) => !!state.overridden[d.properties.id]);

      const pRows = PROVINCES.map((pr) => {
        const lead = leadingPartyInProv(pr.id, provSeats);
        return el('tr', {
          style: { cursor: 'pointer', background: state.selectedProv === pr.id ? 'rgba(91,140,255,0.16)' : '' },
          onclick: () => handleProvClick(pr),
        }, [
          el('td', {}, [
            el('span', { class: 'swatch', style: { background: lead.party.color } }),
            el('span', { text: `${pr.code} · ${pr.name}` }),
          ]),
          el('td', { class: 'num muted', text: `${pr.seats}` }),
          el('td', { class: 'num', html: `<b style="color:${lead.party.color}">${lead.party.short}</b> (${lead.seats})` }),
        ]);
      });
      provTableBox.innerHTML = '';
      provTableBox.appendChild(
        el('table', { class: 'results' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Province (Click)' }), el('th', { text: 'Ridings' }), el('th', { text: '1st Party' })])),
          el('tbody', {}, pRows),
        ])
      );

      const hcParties = PARTIES.map((p) => ({
        id: p.id,
        short: p.short,
        name: p.name,
        leader: p.leader,
        color: p.color,
        seats: seats[p.id] || 0,
      }));

      const topParty = hcParties.slice().sort((a, b) => b.seats - a.seats)[0];
      const govStatus = topParty.seats >= MAJORITY
        ? `${topParty.short} Majority Government (${topParty.seats})`
        : `${topParty.short} Minority (${MAJORITY - topParty.seats} short of 172)`;

      ES.hemicycle(hcBox, hcParties, {
        total: TOTAL_SEATS,
        majority: MAJORITY,
        subtitle: `Majority: 172 MPs · ${govStatus}`,
      });

      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(hcParties, TOTAL_SEATS, MAJORITY, { label: '172 seats required for a House of Commons majority', unit: 'MPs' }));

      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hcParties, TOTAL_SEATS, MAJORITY));

      const rows = PARTIES.map((p) => {
        const s = seats[p.id] || 0;
        const v = nat[p.id] || 0;
        return {
          color: p.color,
          name: p.name,
          leader: p.leader,
          votes: v,
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
            { key: 'votes', label: 'Popular Vote', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'seats', label: 'Seats (343)', fmt: (v) => `<b>${v}</b>` },
            { key: 'seatPct', label: 'Seat Share', fmt: (v) => fmt(v, 1) + '%' },
          ],
        })
      );
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'canada',
    name: 'Canada',
    flag: '🇨🇦',
    title: 'Canada – 2025 Federal Election (45th Parliament)',
    subtitle: '343 Ridings · First-Past-The-Post · 10 Provinces & 3 Territories',
    render,
  });
})();
