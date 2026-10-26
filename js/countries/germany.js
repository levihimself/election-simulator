/* =========================================================================
   Germany – 2025 Bundestag Election (630 seats, Sainte-Laguë, 16 States)
   Without party leaders; state-level and national percentages.
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, clone, sum, normalize } = ES.util;
  const ui = ES.ui;

  // Ordered left -> right for Bundestag hemicycle (no leaders, per user spec)
  const PARTIES = [
    { id: 'LINKE', short: 'Linke', name: 'Die Linke', color: '#be3075' },
    { id: 'BSW', short: 'BSW', name: 'Bündnis Sahra Wagenknecht (BSW)', color: '#792351' },
    { id: 'SPD', short: 'SPD', name: 'Social Democratic Party (SPD)', color: '#e3000f' },
    { id: 'GRUNE', short: 'Grüne', name: 'Alliance 90 / The Greens', color: '#1aa037' },
    { id: 'SSW', short: 'SSW', name: 'South Schleswig Voters\' Assoc. (SSW)', color: '#0056b3', minority: true },
    { id: 'FDP', short: 'FDP', name: 'Free Democratic Party (FDP)', color: '#ffed00' },
    { id: 'FW', short: 'FW', name: 'Free Voters (Freie Wähler)', color: '#f7a800' },
    { id: 'CDU', short: 'CDU', name: 'Christian Democratic Union (CDU)', color: '#384352' },
    { id: 'CSU', short: 'CSU', name: 'Christian Social Union in Bavaria (CSU)', color: '#0080c8' },
    { id: 'AFD', short: 'AfD', name: 'Alternative for Germany (AfD)', color: '#009ee0' },
  ];
  const PMAP = {};
  PARTIES.forEach((p) => (PMAP[p.id] = p));

  // 16 Bundesländer with approximate 2025 valid Zweitstimmen weights (share of national votes, sum = 100.0)
  // and 2025 Bundestag election Zweitstimmen percentages per state.
  const LANDER = [
    { id: 'DE-NW', code: 'NW', name: 'North Rhine-Westphalia', weight: 21.2, base: { CDU: 30.1, AFD: 16.8, SPD: 20.0, GRUNE: 12.4, LINKE: 8.3, BSW: 4.1, FDP: 4.4, FW: 0.7, CSU: 0, SSW: 0 } },
    { id: 'DE-BY', code: 'BY', name: 'Bavaria', weight: 15.9, base: { CDU: 0, CSU: 37.2, AFD: 19.0, SPD: 11.6, GRUNE: 12.0, LINKE: 5.7, BSW: 3.1, FDP: 4.2, FW: 4.3, SSW: 0 } },
    { id: 'DE-BW', code: 'BW', name: 'Baden-Württemberg', weight: 13.0, base: { CDU: 31.6, AFD: 19.8, SPD: 14.2, GRUNE: 13.6, LINKE: 6.8, BSW: 4.1, FDP: 5.6, FW: 1.4, CSU: 0, SSW: 0 } },
    { id: 'DE-NI', code: 'NI', name: 'Lower Saxony', weight: 9.8, base: { CDU: 28.1, AFD: 17.8, SPD: 23.0, GRUNE: 11.5, LINKE: 8.1, BSW: 3.8, FDP: 4.1, FW: 0.8, CSU: 0, SSW: 0 } },
    { id: 'DE-HE', code: 'HE', name: 'Hesse', weight: 7.3, base: { CDU: 28.9, AFD: 17.8, SPD: 18.4, GRUNE: 12.6, LINKE: 8.7, BSW: 4.4, FDP: 5.0, FW: 1.3, CSU: 0, SSW: 0 } },
    { id: 'DE-SN', code: 'SN', name: 'Saxony', weight: 5.1, base: { CDU: 19.7, AFD: 37.3, SPD: 8.5, GRUNE: 6.5, LINKE: 11.3, BSW: 9.0, FDP: 3.2, FW: 1.6, CSU: 0, SSW: 0 } },
    { id: 'DE-RP', code: 'RP', name: 'Rhineland-Palatinate', weight: 5.0, base: { CDU: 30.6, AFD: 20.1, SPD: 18.6, GRUNE: 10.4, LINKE: 6.5, BSW: 4.2, FDP: 4.6, FW: 2.1, CSU: 0, SSW: 0 } },
    { id: 'DE-BE', code: 'BE', name: 'Berlin', weight: 4.1, base: { CDU: 18.3, AFD: 15.2, SPD: 15.1, GRUNE: 16.8, LINKE: 19.9, BSW: 6.6, FDP: 3.8, FW: 0.6, CSU: 0, SSW: 0 } },
    { id: 'DE-SH', code: 'SH', name: 'Schleswig-Holstein', weight: 3.7, base: { CDU: 27.6, AFD: 16.3, SPD: 18.8, GRUNE: 14.9, LINKE: 7.8, BSW: 3.4, FDP: 4.7, FW: 0.7, CSU: 0, SSW: 4.0 } },
    { id: 'DE-BB', code: 'BB', name: 'Brandenburg', weight: 3.2, base: { CDU: 18.1, AFD: 32.5, SPD: 14.8, GRUNE: 6.6, LINKE: 10.7, BSW: 10.7, FDP: 3.2, FW: 1.5, CSU: 0, SSW: 0 } },
    { id: 'DE-ST', code: 'ST', name: 'Saxony-Anhalt', weight: 2.6, base: { CDU: 19.2, AFD: 37.1, SPD: 11.0, GRUNE: 4.4, LINKE: 10.8, BSW: 11.2, FDP: 3.1, FW: 1.3, CSU: 0, SSW: 0 } },
    { id: 'DE-TH', code: 'TH', name: 'Thuringia', weight: 2.6, base: { CDU: 18.6, AFD: 38.6, SPD: 8.8, GRUNE: 4.2, LINKE: 15.2, BSW: 9.4, FDP: 2.8, FW: 1.4, CSU: 0, SSW: 0 } },
    { id: 'DE-HH', code: 'HH', name: 'Hamburg', weight: 2.2, base: { CDU: 20.7, AFD: 10.9, SPD: 22.7, GRUNE: 19.3, LINKE: 14.4, BSW: 4.0, FDP: 4.5, FW: 0.5, CSU: 0, SSW: 0 } },
    { id: 'DE-MV', code: 'MV', name: 'Mecklenburg-Vorpommern', weight: 2.0, base: { CDU: 17.8, AFD: 35.0, SPD: 12.4, GRUNE: 5.4, LINKE: 12.0, BSW: 10.6, FDP: 3.2, FW: 1.1, CSU: 0, SSW: 0 } },
    { id: 'DE-SL', code: 'SL', name: 'Saarland', weight: 1.2, base: { CDU: 26.9, AFD: 21.6, SPD: 21.9, GRUNE: 7.2, LINKE: 7.3, BSW: 6.2, FDP: 4.3, FW: 1.5, CSU: 0, SSW: 0 } },
    { id: 'DE-HB', code: 'HB', name: 'Bremen', weight: 0.7, base: { CDU: 20.5, AFD: 15.1, SPD: 23.1, GRUNE: 15.6, LINKE: 14.8, BSW: 4.3, FDP: 3.5, FW: 0.5, CSU: 0, SSW: 0 } },
  ];

  // Calibrate exact baseline so weighted sum matches exact 2025 national result:
  // CDU 22.55, CSU 6.02, AFD 20.80, SPD 16.41, GRUNE 11.61, LINKE 8.77, BSW 4.97, FDP 4.33, FW 1.5, SSW 0.16
  const TARGET_NAT = { CDU: 22.55, CSU: 6.02, AFD: 20.80, SPD: 16.41, GRUNE: 11.61, LINKE: 8.77, BSW: 4.97, FDP: 4.33, FW: 1.50, SSW: 0.16 };
  const totalWeight = LANDER.reduce((a, l) => a + l.weight, 0);
  PARTIES.forEach((p) => {
    const rawW = LANDER.reduce((a, l) => a + (l.base[p.id] || 0) * l.weight, 0) / totalWeight;
    if (rawW > 0 && TARGET_NAT[p.id] !== undefined) {
      const factor = TARGET_NAT[p.id] / rawW;
      LANDER.forEach((l) => {
        l.base[p.id] = +((l.base[p.id] || 0) * factor).toFixed(2);
      });
    }
  });

  const LMAP = {};
  LANDER.forEach((l) => (LMAP[l.id] = l));

  let state = null;
  function initState() {
    const stPct = {};
    LANDER.forEach((l) => (stPct[l.id] = clone(l.base)));
    state = {
      selectedLand: 'ALL', // 'ALL' or 'DE-XX'
      brush: 'modal',      // 'modal' or party id
      stPct,
      overridden: {},      // 'DE-XX' -> true
      sswSeat: true,       // SSW exempt as national minority party (won 1 seat in 2025)
      direct3: { CDU: true, CSU: true, AFD: true, SPD: true, GRUNE: true, LINKE: true }, // Grundmandatsklausel (>=3 direct seats)
    };
  }

  function getNationalPct() {
    const nat = {};
    PARTIES.forEach((p) => {
      nat[p.id] = +(LANDER.reduce((a, l) => a + (state.stPct[l.id][p.id] || 0) * l.weight, 0) / totalWeight).toFixed(2);
    });
    return nat;
  }

  function applyNationalTarget(newNat) {
    const curNat = getNationalPct();
    PARTIES.forEach((p) => {
      const target = newNat[p.id] || 0;
      const cur = curNat[p.id] || 0;
      if (Math.abs(target - cur) < 0.01) return;
      LANDER.forEach((l) => {
        // CDU only outside Bavaria, CSU only in Bavaria, SSW only in SH
        if (p.id === 'CDU' && l.id === 'DE-BY') return;
        if (p.id === 'CSU' && l.id !== 'DE-BY') return;
        if (p.id === 'SSW' && l.id !== 'DE-SH') return;
        if (cur > 0.1) {
          state.stPct[l.id][p.id] = +Math.max(0, (state.stPct[l.id][p.id] || 0) * (target / cur)).toFixed(2);
        } else {
          state.stPct[l.id][p.id] = +target.toFixed(2);
        }
      });
    });
  }

  function calculateBundestag() {
    const nat = getNationalPct();
    const totalSeats = 630;
    const sswSeats = state.sswSeat && (state.stPct['DE-SH'].SSW || 0) >= 2.0 ? 1 : 0;
    const poolSeats = totalSeats - sswSeats;

    // Qualifying parties: >= 5.0% nationally OR >= 3 direct seats (Grundmandatsklausel)
    // Note: CDU and CSU are separate parties but both easily clear 5% and win >3 direct seats
    const qualifyingVotes = {};
    PARTIES.forEach((p) => {
      if (p.id === 'SSW') return;
      const pct = nat[p.id] || 0;
      if (pct >= 5.0 || state.direct3[p.id]) {
        qualifyingVotes[p.id] = pct;
      }
    });

    const allocated = ES.methods.sainteLague(qualifyingVotes, poolSeats);
    const seats = {};
    PARTIES.forEach((p) => (seats[p.id] = allocated[p.id] || 0));
    if (sswSeats) seats.SSW = 1;

    // Also distribute each qualifying party's national seats across the 16 states by Sainte-Laguë
    const stateSeats = {};
    LANDER.forEach((l) => (stateSeats[l.id] = {}));
    PARTIES.forEach((p) => {
      const pSeats = seats[p.id] || 0;
      if (pSeats <= 0) return;
      if (p.id === 'SSW') {
        stateSeats['DE-SH'].SSW = pSeats;
        return;
      }
      const stVotes = {};
      LANDER.forEach((l) => {
        stVotes[l.id] = (state.stPct[l.id][p.id] || 0) * l.weight;
      });
      const dist = ES.methods.sainteLague(stVotes, pSeats);
      LANDER.forEach((l) => (stateSeats[l.id][p.id] = dist[l.id] || 0));
    });

    return { nat, seats, stateSeats };
  }

  function strongestPartyInLand(landId) {
    const pcts = state.stPct[landId];
    let best = 'CDU', max = -1;
    PARTIES.forEach((p) => {
      if ((pcts[p.id] || 0) > max) {
        max = pcts[p.id] || 0;
        best = p.id;
      }
    });
    return { party: PMAP[best], pct: max };
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    /* ---- Left Column: State selector + Sliders + Electoral Rules ---- */
    const selCard = ui.card('Select State (Bundesland) or National Swing');
    L.left.appendChild(selCard.card);

    const landOptions = [{ value: 'ALL', label: '🇩🇪 All Germany (National Zweitstimmen %)' }].concat(
      LANDER.map((l) => ({ value: l.id, label: `${l.name} (${l.code}) · weight ${l.weight}%` }))
    );
    const landSelect = ui.select(landOptions, state.selectedLand, (v) => {
      state.selectedLand = v;
      rebuildSliders();
      update();
    });
    landSelect.style.width = '100%';
    selCard.body.appendChild(landSelect);

    const slHeaderSpan = el('span', { text: 'Vote Share (%) – National' });
    const slCard = ui.card('State / National Party Percentages');
    slCard.card.querySelector('h3').replaceWith(slHeaderSpan);
    L.left.appendChild(slCard.card);
    const slContainer = el('div');
    slCard.body.appendChild(slContainer);

    let activeSliders = null;
    function rebuildSliders() {
      slContainer.innerHTML = '';
      if (state.selectedLand === 'ALL') {
        slHeaderSpan.textContent = 'NATIONAL ZWEITSTIMMEN (%) – SWINGS ALL STATES';
        const natVals = getNationalPct();
        activeSliders = ui.sliders(
          PARTIES.filter((p) => p.id !== 'SSW').map((p) => ({ id: p.id, name: p.short, leader: p.name, color: p.color })),
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
        slContainer.appendChild(activeSliders.el);
      } else {
        const land = LMAP[state.selectedLand];
        slHeaderSpan.textContent = `${land.name.toUpperCase()} (${land.code}) – STATE PERCENTAGES`;
        const localParties = PARTIES.filter((p) => {
          if (p.id === 'CDU' && land.id === 'DE-BY') return false;
          if (p.id === 'CSU' && land.id !== 'DE-BY') return false;
          if (p.id === 'SSW' && land.id !== 'DE-SH') return false;
          return true;
        });
        activeSliders = ui.sliders(
          localParties.map((p) => ({ id: p.id, name: p.short, leader: p.name, color: p.color })),
          state.stPct[land.id],
          {
            max: 55,
            step: 0.1,
            onChange: () => {
              state.overridden[land.id] = true;
              update(true);
            },
          }
        );
        slContainer.appendChild(activeSliders.el);
        slContainer.appendChild(
          el('div', { class: 'row', style: { marginTop: '10px' } }, [
            el('button', {
              class: 'btn btn-xs',
              text: `Reset ${land.name} to 2025 Result`,
              onclick: () => {
                state.stPct[land.id] = clone(land.base);
                delete state.overridden[land.id];
                rebuildSliders();
                update();
              },
            }),
            el('button', {
              class: 'btn btn-xs',
              text: '← Back to National Sliders',
              onclick: () => {
                state.selectedLand = 'ALL';
                landSelect.value = 'ALL';
                rebuildSliders();
                update();
              },
            }),
          ])
        );
      }
    }

    const rulesCard = ui.card('2025 Electoral System & Presets');
    L.left.appendChild(rulesCard.card);
    const sswCheck = el('input', { type: 'checkbox' });
    sswCheck.checked = state.sswSeat;
    sswCheck.addEventListener('change', () => {
      state.sswSeat = sswCheck.checked;
      update();
    });
    rulesCard.body.appendChild(
      el('div', { class: 'row', style: { marginBottom: '10px' } }, [
        el('label', { class: 'check small' }, [sswCheck, 'SSW minority exemption (1 seat in Schleswig-Holstein)']),
      ])
    );
    rulesCard.body.appendChild(
      el('div', { class: 'row' }, [
        el('button', {
          class: 'btn',
          text: '2025 Bundestag Result',
          onclick: () => {
            initState();
            landSelect.value = 'ALL';
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'BSW Clears 5% (5.0%)',
          onclick: () => {
            const nat = getNationalPct();
            nat.BSW = 5.1;
            applyNationalTarget(nat);
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'FDP & BSW Clear 5%',
          onclick: () => {
            const nat = getNationalPct();
            nat.BSW = 5.1;
            nat.FDP = 5.1;
            applyNationalTarget(nat);
            rebuildSliders();
            update();
          },
        }),
      ])
    );
    const thresholdNote = el('div', { style: { marginTop: '10px' } });
    rulesCard.body.appendChild(thresholdNote);

    /* ---- Right Column: Map + Hemicycle + Tables ---- */
    const mapCard = ui.card('16 Bundesländer – Click a State to Edit % or Paint Leading Party');
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
    toolbar.appendChild(makeBrush('modal', '🎛️ Select & Edit State %', '#5b8cff'));
    ['CDU', 'CSU', 'AFD', 'SPD', 'GRUNE', 'LINKE', 'BSW', 'FDP'].forEach((pid) => {
      const p = PMAP[pid];
      toolbar.appendChild(makeBrush(p.id, p.short, p.color));
    });
    mapCard.body.appendChild(toolbar);

    const mapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const mapWrap = el('div', { class: 'map-wrap' });
    const stateQuickTable = el('div');
    mapGrid.appendChild(mapWrap);
    mapGrid.appendChild(stateQuickTable);
    mapCard.body.appendChild(mapGrid);

    const hcCard = ui.card('21st German Bundestag (630 Seats · Majority: 316)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const barBox = el('div');
    const coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('National Results & Seat Allocation');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    /* ---- Build Germany SVG Map ---- */
    const tip = ui.tooltip();
    const W = 440, H = 540;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[16, 16], [W - 16, H - 16]], GEO_DE);
    const path = d3.geoPath(proj);

    const landPaths = svg.append('g')
      .selectAll('path')
      .data(GEO_DE.features)
      .join('path')
      .attr('class', 'unit')
      .attr('d', path)
      .on('click', (e, d) => handleLandClick(LMAP[d.properties.id]))
      .on('mouseenter', (e, d) => showLandTip(e, LMAP[d.properties.id]))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g')
      .selectAll('text')
      .data(GEO_DE.features)
      .join('text')
      .attr('transform', (d) => {
        const c = path.centroid(d);
        const adj = { 'DE-BB': [14, 18], 'DE-BE': [0, -2], 'DE-NI': [0, 12], 'DE-HB': [-10, -8] }[d.properties.id] || [0, 0];
        return `translate(${c[0] + adj[0]},${c[1] + adj[1]})`;
      })
      .text((d) => LMAP[d.properties.id].code);

    let lastCalc = null;

    function handleLandClick(land) {
      if (!land) return;
      if (state.brush === 'modal') {
        state.selectedLand = land.id;
        landSelect.value = land.id;
        rebuildSliders();
        openLandModal(land);
        update();
      } else {
        // Assign the painted party to lead in this state (boost to 38% and renormalize others)
        let pid = state.brush;
        if (pid === 'CDU' && land.id === 'DE-BY') pid = 'CSU';
        if (pid === 'CSU' && land.id !== 'DE-BY') pid = 'CDU';
        const cur = state.stPct[land.id];
        const othersSum = Object.keys(cur).reduce((a, k) => a + (k === pid ? 0 : cur[k]), 0);
        const targetShare = 42.0;
        Object.keys(cur).forEach((k) => {
          if (k === pid) cur[k] = targetShare;
          else if (othersSum > 0) cur[k] = +((cur[k] / othersSum) * (100 - targetShare)).toFixed(1);
        });
        state.overridden[land.id] = true;
        if (state.selectedLand === land.id) rebuildSliders();
        else if (state.selectedLand === 'ALL') rebuildSliders();
        update();
      }
    }

    function showLandTip(e, land) {
      if (!land || !lastCalc) return;
      const pcts = state.stPct[land.id];
      const stSeats = lastCalc.stateSeats[land.id] || {};
      const rows = PARTIES.filter((p) => (pcts[p.id] || 0) >= 0.5)
        .sort((a, b) => (pcts[b.id] || 0) - (pcts[a.id] || 0))
        .map(
          (p) =>
            `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right"><b>${fmt(pcts[p.id], 1)}%</b></td><td style="text-align:right;color:#9aa3b5">${stSeats[p.id] || 0} MdB</td></tr>`
        )
        .join('');
      tip.show(
        e,
        `<b>${land.name} (${land.code})</b> · Vote weight ${land.weight}%<table>${rows}</table><div class="muted small" style="margin-top:4px">Click to ${state.brush === 'modal' ? 'edit state percentages' : 'set ' + PMAP[state.brush].short + ' as leading party'}</div>`
      );
    }

    function openLandModal(land) {
      const localParties = PARTIES.filter((p) => {
        if (p.id === 'CDU' && land.id === 'DE-BY') return false;
        if (p.id === 'CSU' && land.id !== 'DE-BY') return false;
        if (p.id === 'SSW' && land.id !== 'DE-SH') return false;
        return true;
      });
      ui.modal(`${land.name} (${land.code}) – State Zweitstimmen %`, (body, close) => {
        body.appendChild(
          el('div', {
            class: 'muted small',
            text: `Adjust party percentages in ${land.name} (accounts for ${land.weight}% of German voters). Changes immediately update the national Bundestag allocation.`,
          })
        );
        const mSliders = ui.sliders(
          localParties.map((p) => ({ id: p.id, name: p.short, leader: p.name, color: p.color })),
          state.stPct[land.id],
          {
            max: 55,
            step: 0.1,
            onChange: () => {
              state.overridden[land.id] = true;
              rebuildSliders();
              update();
            },
          }
        );
        body.appendChild(mSliders.el);
        body.appendChild(
          el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '8px' } }, [
            el('button', {
              class: 'btn',
              text: 'Reset State to 2025 Result',
              onclick: () => {
                state.stPct[land.id] = clone(land.base);
                delete state.overridden[land.id];
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

    function update(fromSliders) {
      lastCalc = calculateBundestag();
      const { nat, seats } = lastCalc;
      if (!fromSliders && state.selectedLand === 'ALL' && activeSliders) {
        activeSliders.setValues(clone(nat));
      }

      landPaths
        .attr('fill', (d) => strongestPartyInLand(d.properties.id).party.color)
        .classed('override', (d) => !!state.overridden[d.properties.id]);

      // Quick interactive table of the 16 states beside the map
      const stRows = LANDER.map((l) => {
        const lead = strongestPartyInLand(l.id);
        return el(
          'tr',
          {
            style: { cursor: 'pointer', background: state.selectedLand === l.id ? 'rgba(91,140,255,0.16)' : '' },
            onclick: () => {
              state.selectedLand = l.id;
              landSelect.value = l.id;
              rebuildSliders();
              update();
            },
          },
          [
            el('td', {}, [
              el('span', { class: 'swatch', style: { background: lead.party.color } }),
              el('span', { text: `${l.code} · ${l.name}` }),
            ]),
            el('td', { class: 'num muted', text: `${l.weight}%` }),
            el('td', { class: 'num', html: `<b style="color:${lead.party.color}">${lead.party.short}</b> ${fmt(lead.pct, 1)}%` }),
          ]
        );
      });
      stateQuickTable.innerHTML = '';
      const stTable = el('table', { class: 'results' }, [
        el('thead', {}, el('tr', {}, [el('th', { text: 'State (Click to edit)' }), el('th', { text: 'Weight' }), el('th', { text: '1st Party' })])),
        el('tbody', {}, stRows),
      ]);
      stateQuickTable.appendChild(stTable);

      // Threshold note (highlight narrow misses like BSW 4.97% or FDP 4.33%)
      const nearMiss = PARTIES.filter((p) => !p.minority && (seats[p.id] || 0) === 0 && (nat[p.id] || 0) >= 3.0);
      thresholdNote.innerHTML = '';
      if (nearMiss.length) {
        const txt = nearMiss.map((p) => `<b>${p.short}</b> (${fmt(nat[p.id], 2)}%)`).join(', ');
        thresholdNote.appendChild(
          ui.note(
            `Under the 5% threshold: ${txt}. Under the 2023 electoral reform, Bundestag size is fixed at 630 seats (Zweitstimmendeckung).`,
            'warn'
          )
        );
      } else {
        thresholdNote.appendChild(ui.note('Fixed 630-seat Bundestag allocated by Sainte-Laguë among parties clearing the 5% national threshold.'));
      }

      const hcParties = PARTIES.map((p) => ({
        id: p.id,
        short: p.short,
        name: p.name,
        color: p.color,
        seats: seats[p.id] || 0,
      }));
      const unionSeats = (seats.CDU || 0) + (seats.CSU || 0);
      ES.hemicycle(hcBox, hcParties, {
        total: 630,
        majority: 316,
        subtitle: `Majority: 316 · CDU/CSU Union: ${unionSeats}`,
      });

      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(hcParties, 630, 316, { label: '316 seats needed for a Bundestag majority', unit: 'seats' }));

      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hcParties, 630, 316));

      // Results table with 2025 baseline comparison
      const base2025 = { CDU: 164, CSU: 44, AFD: 152, SPD: 120, GRUNE: 85, LINKE: 64, SSW: 1, BSW: 0, FDP: 0, FW: 0 };
      const rows = PARTIES.map((p) => {
        const s = seats[p.id] || 0;
        const v = nat[p.id] || 0;
        const diff = s - (base2025[p.id] || 0);
        return {
          color: p.color,
          name: p.short,
          leader: p.name,
          votes: v,
          status: p.minority ? (s > 0 ? 'Minority' : '–') : v >= 5.0 ? '<span class="ok">≥ 5%</span>' : '<span class="no">&lt; 5%</span>',
          seats: s,
          diff: diff === 0 ? '0' : diff > 0 ? `<span class="ok">+${diff}</span>` : `<span class="no">${diff}</span>`,
          dim: s === 0,
        };
      }).sort((a, b) => b.seats - a.seats || b.votes - a.votes);

      tblBox.innerHTML = '';
      tblBox.appendChild(
        ui.resultsTable(rows, {
          nameLabel: 'Party',
          columns: [
            { key: 'votes', label: 'Zweitstimmen', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'status', label: 'Threshold' },
            { key: 'seats', label: 'Seats (630)' },
            { key: 'diff', label: '+/- vs 2025' },
          ],
        })
      );
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'germany',
    name: 'Germany',
    flag: '🇩🇪',
    title: 'Germany – 2025 Bundestag Election',
    subtitle: '630 Seats · 16 Bundesländer · 5% Threshold · Sainte-Laguë',
    render,
  });
})();
