/* =========================================================================
   Italy – 2022 General Elections (Chamber of Deputies · 400 Seats · Rosatellum)
   147 Single-Member FPTP + 245 PR (3% Threshold) + 8 Overseas · 20 Regions Map
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, clone, normalize, rng, noise, argmax } = ES.util;
  const ui = ES.ui;

  const TOTAL_SEATS = 400;
  const MAJORITY = 201;

  // Ordered left -> right for Montecitorio hemicycle
  const PARTIES = [
    { id: 'AVS', short: 'AVS', name: 'Alleanza Verdi e Sinistra', leader: 'Angelo Bonelli & Nicola Fratoianni', color: '#16a34a', bloc: 'csx' },
    { id: 'M5S', short: 'M5S', name: 'Movimento 5 Stelle', leader: 'Giuseppe Conte', color: '#f59e0b', bloc: 'm5s' },
    { id: 'PD', short: 'PD', name: 'Partito Democratico – ID', leader: 'Enrico Letta', color: '#e11d48', bloc: 'csx' },
    { id: 'PE', short: '+Europa', name: '+Europa', leader: 'Emma Bonino', color: '#eab308', bloc: 'csx' },
    { id: 'SVP', short: 'SVP / Reg.', name: 'SVP – Regional Minorities (Sud chiama Nord / UV)', leader: 'Philipp Achammer / Cateno De Luca', color: '#64748b', bloc: 'reg', minority: true },
    { id: 'AZIV', short: 'Az–IV', name: 'Azione – Italia Viva (Terzo Polo)', leader: 'Carlo Calenda & Matteo Renzi', color: '#db2777', bloc: 'tp' },
    { id: 'NM', short: 'Noi Mod.', name: 'Noi Moderati', leader: 'Maurizio Lupi', color: '#38bdf8', bloc: 'cdx' },
    { id: 'FI', short: 'Forza Italia', name: 'Forza Italia', leader: 'Silvio Berlusconi', color: '#0087dc', bloc: 'cdx' },
    { id: 'LEGA', short: 'Lega', name: 'Lega per Salvini Premier', leader: 'Matteo Salvini', color: '#008055', bloc: 'cdx' },
    { id: 'FDI', short: 'FdI', name: 'Fratelli d\'Italia', leader: 'Giorgia Meloni', color: '#0b3b6a', bloc: 'cdx' },
  ];

  const PMAP = {};
  PARTIES.forEach((p) => (PMAP[p.id] = p));

  // 20 Regions of Italy matching window.GEO_IT (147 FPTP constituencies total)
  const REGIONS = [
    { id: 'IT-25', code: 'LOM', name: 'Lombardia', fptp: 23, weight: 17.5, base: { FDI: 28.5, PD: 19.0, LEGA: 13.3, AZIV: 10.1, FI: 7.9, M5S: 7.5, AVS: 3.8, PE: 3.4, NM: 1.0, SVP: 0.2 } },
    { id: 'IT-62', code: 'LAZ', name: 'Lazio', fptp: 13, weight: 9.6, base: { FDI: 31.4, PD: 18.4, M5S: 14.8, AZIV: 8.5, FI: 6.8, LEGA: 6.1, AVS: 3.9, PE: 3.1, NM: 0.7, SVP: 0.2 } },
    { id: 'IT-72', code: 'CAM', name: 'Campania', fptp: 14, weight: 8.2, base: { M5S: 34.6, FDI: 18.1, PD: 15.8, FI: 9.5, AZIV: 5.3, LEGA: 3.9, AVS: 2.7, PE: 2.1, NM: 0.7, SVP: 0.2 } },
    { id: 'IT-34', code: 'VEN', name: 'Veneto', fptp: 12, weight: 8.8, base: { FDI: 32.7, PD: 16.3, LEGA: 14.5, AZIV: 8.4, FI: 7.0, M5S: 5.8, AVS: 3.3, PE: 3.1, NM: 2.0, SVP: 0.2 } },
    { id: 'IT-82', code: 'SIC', name: 'Sicilia', fptp: 12, weight: 7.4, base: { M5S: 28.2, FDI: 20.1, PD: 11.8, FI: 10.9, SVP: 7.8, AZIV: 4.9, LEGA: 5.1, AVS: 2.1, PE: 1.7, NM: 0.9 } },
    { id: 'IT-21', code: 'PIE', name: 'Piemonte', fptp: 11, weight: 7.6, base: { FDI: 26.9, PD: 20.1, LEGA: 10.8, M5S: 10.4, AZIV: 8.7, FI: 7.8, AVS: 4.1, PE: 3.9, NM: 0.8, SVP: 0.2 } },
    { id: 'IT-45', code: 'EMR', name: 'Emilia-Romagna', fptp: 11, weight: 8.1, base: { PD: 28.0, FDI: 25.0, M5S: 10.0, AZIV: 8.6, LEGA: 7.8, FI: 5.6, AVS: 4.5, PE: 3.4, NM: 0.6, SVP: 0.2 } },
    { id: 'IT-75', code: 'PUG', name: 'Puglia', fptp: 10, weight: 6.5, base: { M5S: 27.9, FDI: 23.5, PD: 17.0, FI: 9.2, LEGA: 5.3, AZIV: 4.8, AVS: 3.1, PE: 1.9, NM: 0.7, SVP: 0.2 } },
    { id: 'IT-52', code: 'TOS', name: 'Toscana', fptp: 9, weight: 6.7, base: { PD: 26.3, FDI: 25.9, M5S: 11.1, AZIV: 9.4, LEGA: 6.6, FI: 5.7, AVS: 5.1, PE: 2.9, NM: 0.6, SVP: 0.2 } },
    { id: 'IT-78', code: 'CAL', name: 'Calabria', fptp: 5, weight: 2.7, base: { M5S: 29.4, FDI: 19.0, FI: 15.6, PD: 14.4, LEGA: 5.8, AZIV: 4.1, AVS: 1.9, PE: 1.4, NM: 1.0, SVP: 0.2 } },
    { id: 'IT-42', code: 'LIG', name: 'Liguria', fptp: 4, weight: 2.6, base: { FDI: 24.2, PD: 22.1, M5S: 12.8, LEGA: 9.3, AZIV: 7.4, FI: 6.5, AVS: 4.3, PE: 3.3, NM: 2.6, SVP: 0.2 } },
    { id: 'IT-57', code: 'MAR', name: 'Marche', fptp: 4, weight: 2.6, base: { FDI: 29.1, PD: 20.3, M5S: 13.6, LEGA: 7.9, AZIV: 7.4, FI: 6.6, AVS: 3.3, PE: 2.6, NM: 0.8, SVP: 0.2 } },
    { id: 'IT-88', code: 'SAR', name: 'Sardegna', fptp: 4, weight: 2.4, base: { FDI: 23.6, M5S: 21.8, PD: 18.8, FI: 8.5, LEGA: 6.3, AVS: 5.0, AZIV: 4.6, PE: 2.2, NM: 1.1, SVP: 0.4 } },
    { id: 'IT-32', code: 'TAA', name: 'Trentino-Alto Adige', fptp: 4, weight: 1.8, base: { SVP: 32.8, FDI: 18.8, PD: 16.5, LEGA: 8.6, AZIV: 6.1, AVS: 5.2, M5S: 5.0, FI: 3.4, PE: 2.5, NM: 0.5 } },
    { id: 'IT-65', code: 'ABR', name: 'Abruzzo', fptp: 3, weight: 2.2, base: { FDI: 27.9, M5S: 18.4, PD: 16.6, FI: 11.1, LEGA: 8.1, AZIV: 6.2, AVS: 2.7, PE: 2.0, NM: 0.7, SVP: 0.2 } },
    { id: 'IT-36', code: 'FVG', name: 'Friuli-Venezia Giulia', fptp: 3, weight: 2.1, base: { FDI: 31.3, PD: 18.4, LEGA: 10.9, AZIV: 8.3, M5S: 7.2, FI: 6.7, AVS: 3.7, PE: 3.2, NM: 1.2, SVP: 0.3 } },
    { id: 'IT-55', code: 'UMB', name: 'Umbria', fptp: 2, weight: 1.5, base: { FDI: 30.9, PD: 20.9, M5S: 12.7, AZIV: 8.1, LEGA: 7.8, FI: 6.9, AVS: 3.5, PE: 2.2, NM: 0.7, SVP: 0.2 } },
    { id: 'IT-77', code: 'BAS', name: 'Basilicata', fptp: 1, weight: 0.9, base: { M5S: 24.4, FDI: 19.1, PD: 15.9, AZIV: 12.2, FI: 9.0, LEGA: 7.1, AVS: 3.4, PE: 2.0, NM: 0.8, SVP: 0.2 } },
    { id: 'IT-67', code: 'MOL', name: 'Molise', fptp: 1, weight: 0.5, base: { M5S: 24.2, FDI: 21.4, PD: 18.3, FI: 12.6, LEGA: 5.6, AZIV: 4.8, AVS: 2.9, PE: 1.7, NM: 1.4, SVP: 0.2 } },
    { id: 'IT-23', code: 'VDA', name: 'Valle d\'Aosta', fptp: 1, weight: 0.3, base: { SVP: 38.6, FDI: 16.5, PD: 14.5, LEGA: 8.5, M5S: 7.5, AZIV: 6.5, FI: 4.5, AVS: 2.0, PE: 1.0, NM: 0.4 } },
  ];

  // Calibrate to exact 2022 national percentages
  const TARGET_2022 = { FDI: 26.00, PD: 19.04, M5S: 15.43, LEGA: 8.79, FI: 8.11, AZIV: 7.78, AVS: 3.64, PE: 2.83, SVP: 1.45, NM: 0.91 };
  const totalWeight = REGIONS.reduce((a, r) => a + r.weight, 0);
  PARTIES.forEach((p) => {
    const rawW = REGIONS.reduce((a, r) => a + (r.base[p.id] || 0) * r.weight, 0) / totalWeight;
    if (rawW > 0 && TARGET_2022[p.id] !== undefined) {
      const factor = TARGET_2022[p.id] / rawW;
      REGIONS.forEach((r) => {
        r.base[p.id] = +((r.base[p.id] || 0) * factor).toFixed(2);
      });
    }
  });

  const RMAP = {};
  REGIONS.forEach((r) => (RMAP[r.id] = r));

  // Pre-generate 147 single-member FPTP constituencies across the 20 regions
  const FPTP_SEATS = (function buildFptp() {
    const rnd = rng('italy-rosatellum-147-v1');
    const list = [];
    let cid = 1;
    REGIONS.forEach((reg) => {
      for (let i = 0; i < reg.fptp; i++) {
        const mult = {};
        const u = rnd();
        PARTIES.forEach((p) => {
          let m = 1.0;
          if (reg.code === 'TAA' && i < 2 && p.id === 'SVP') m = 2.6;
          else if ((reg.code === 'EMR' || reg.code === 'TOS') && u < 0.45 && p.bloc === 'csx') m = 1.32;
          else if ((reg.code === 'CAM' || reg.code === 'SIC' || reg.code === 'CAL') && u < 0.35 && p.id === 'M5S') m = 1.38;
          mult[p.id] = m * Math.exp(noise(rnd) * 0.14);
        });
        list.push({ id: cid++, regId: reg.id, num: i + 1, mult, slotRoll: rnd() });
      }
    });
    return list;
  })();

  let state = null;
  function initState() {
    const regPct = {};
    REGIONS.forEach((r) => (regPct[r.id] = clone(r.base)));
    state = {
      selectedReg: 'ALL',
      brush: 'edit',
      regPct,
      overridden: {},
      cdxUnited: true,    // FdI + Lega + FI + NM joint FPTP candidates
      csxUnited: true,    // PD + AVS + +Europa joint FPTP candidates
      campoLargo: false,  // What-if: M5S joins Centre-Left in FPTP
      terzoInCsx: false,  // What-if: Azione-IV joins Centre-Left in FPTP
    };
  }

  function getNationalPct() {
    const nat = {};
    PARTIES.forEach((p) => {
      nat[p.id] = +(REGIONS.reduce((a, r) => a + (state.regPct[r.id][p.id] || 0) * r.weight, 0) / totalWeight).toFixed(2);
    });
    return nat;
  }

  function applyNationalTarget(newNat) {
    const curNat = getNationalPct();
    PARTIES.forEach((p) => {
      const target = newNat[p.id] || 0;
      const cur = curNat[p.id] || 0;
      if (Math.abs(target - cur) < 0.01) return;
      REGIONS.forEach((r) => {
        if (cur > 0.1) {
          state.regPct[r.id][p.id] = +Math.max(0, (state.regPct[r.id][p.id] || 0) * (target / cur)).toFixed(2);
        } else {
          state.regPct[r.id][p.id] = +target.toFixed(2);
        }
      });
    });
  }

  function simulateChamber() {
    const nat = normalize(getNationalPct(), 100);
    const fptpSeats = {};
    const prSeats = {};
    const overseasSeats = { PD: 4, FDI: 2, M5S: 1, LEGA: 1 }; // 8 Estero seats
    const totalSeats = {};
    const regSeats = {};

    PARTIES.forEach((p) => {
      fptpSeats[p.id] = 0;
      prSeats[p.id] = 0;
      totalSeats[p.id] = overseasSeats[p.id] || 0;
    });
    REGIONS.forEach((r) => {
      regSeats[r.id] = {};
      PARTIES.forEach((p) => (regSeats[r.id][p.id] = 0));
    });

    // Helper to pick which coalition partner gets the FPTP seat credit based on vote weights
    function pickPartner(ids, roll) {
      const tot = ids.reduce((a, id) => a + (nat[id] || 0), 0);
      let acc = 0;
      for (const id of ids) {
        acc += tot > 0 ? (nat[id] || 0) / tot : 1 / ids.length;
        if (roll <= acc) return id;
      }
      return ids[0];
    }

    const cdxMembers = ['FDI', 'LEGA', 'FI', 'NM'];
    const csxMembers = ['PD', 'AVS', 'PE'].concat(state.campoLargo ? ['M5S'] : []).concat(state.terzoInCsx ? ['AZIV'] : []);

    // 1. 147 Single-Member FPTP Constituencies (Uninominali)
    FPTP_SEATS.forEach((c) => {
      const rShares = state.regPct[c.regId];
      const local = {};
      PARTIES.forEach((p) => (local[p.id] = (rShares[p.id] || 0) * c.mult[p.id]));

      const scores = {};
      if (state.cdxUnited) {
        scores.CDX = cdxMembers.reduce((a, id) => a + (local[id] || 0), 0) * 0.98;
      } else {
        cdxMembers.forEach((id) => (scores[id] = local[id] || 0));
      }

      if (state.csxUnited) {
        scores.CSX = csxMembers.reduce((a, id) => a + (local[id] || 0), 0) * (state.campoLargo ? 0.92 : 0.97);
      } else {
        csxMembers.forEach((id) => (scores[id] = local[id] || 0));
      }

      PARTIES.forEach((p) => {
        if ((state.cdxUnited && cdxMembers.includes(p.id)) || (state.csxUnited && csxMembers.includes(p.id))) return;
        scores[p.id] = local[p.id] || 0;
      });

      const winKey = argmax(scores);
      let winParty = winKey;
      if (winKey === 'CDX') winParty = pickPartner(cdxMembers, c.slotRoll);
      else if (winKey === 'CSX') winParty = pickPartner(csxMembers, c.slotRoll);

      fptpSeats[winParty]++;
      totalSeats[winParty]++;
      regSeats[c.regId][winParty]++;
    });

    // 2. 245 Proportional Seats (Plurinominali) – Hare Largest Remainder (3% national threshold; SVP exempt)
    const prQual = {};
    PARTIES.forEach((p) => {
      if ((nat[p.id] || 0) >= 3.0 || (p.minority && (nat[p.id] || 0) >= 0.5)) {
        prQual[p.id] = nat[p.id];
      }
    });
    const allocPr = ES.methods.hare(prQual, 245, 0);
    PARTIES.forEach((p) => {
      const s = allocPr[p.id] || 0;
      prSeats[p.id] = s;
      totalSeats[p.id] += s;
    });

    return { nat, fptpSeats, prSeats, overseasSeats, totalSeats, regSeats };
  }

  function strongestInRegion(regId) {
    const pcts = state.regPct[regId];
    let best = 'FDI', max = -1;
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

    /* ---- Left Column: Alliances, Presets, Region Selector, Sliders ---- */
    const scenCard = ui.card('Rosatellum Coalitions & 2022 Scenarios');
    L.left.appendChild(scenCard.card);

    scenCard.body.appendChild(
      el('div', { class: 'row', style: { gap: '6px', marginBottom: '10px' } }, [
        el('button', {
          class: 'btn btn-primary',
          text: '2022 Actual Election Result',
          onclick: () => {
            initState();
            regSelect.value = 'ALL';
            rebuildSliders();
            syncChecks();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'What-If: Campo Largo (PD+M5S)',
          onclick: () => {
            initState();
            state.campoLargo = true;
            regSelect.value = 'ALL';
            rebuildSliders();
            syncChecks();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'What-If: Grand Anti-Right Alliance',
          onclick: () => {
            initState();
            state.campoLargo = true;
            state.terzoInCsx = true;
            regSelect.value = 'ALL';
            rebuildSliders();
            syncChecks();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Divided Right (No CDX Pact)',
          onclick: () => {
            initState();
            state.cdxUnited = false;
            regSelect.value = 'ALL';
            rebuildSliders();
            syncChecks();
            update();
          },
        }),
      ])
    );

    const checksBox = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
    scenCard.body.appendChild(checksBox);

    function syncChecks() {
      checksBox.innerHTML = '';
      [
        { key: 'cdxUnited', label: 'United Centre-Right (FdI + Lega + FI + NM) in 147 FPTP seats' },
        { key: 'csxUnited', label: 'United Centre-Left (PD + AVS + +Europa) in 147 FPTP seats' },
        { key: 'campoLargo', label: 'Campo Largo Pact: M5S (Conte) joins Centre-Left in FPTP seats' },
        { key: 'terzoInCsx', label: 'Draghi Agenda Pact: Azione–IV joins Centre-Left in FPTP seats' },
      ].forEach((item) => {
        const cb = el('input', {
          type: 'checkbox',
          checked: state[item.key],
          onchange: () => {
            state[item.key] = cb.checked;
            update();
          },
        });
        checksBox.appendChild(el('label', { class: 'check small' }, [cb, item.label]));
      });
    }
    syncChecks();

    const selCard = ui.card('Select Region (Regione) or National Vote Share');
    L.left.appendChild(selCard.card);
    const regOpts = [{ value: 'ALL', label: '🇮🇹 All Italy – National PR Vote Share (%)' }].concat(
      REGIONS.map((r) => ({ value: r.id, label: `${r.name} (${r.code}) · ${r.fptp} FPTP seats` }))
    );
    const regSelect = ui.select(regOpts, state.selectedReg, (v) => {
      state.selectedReg = v;
      rebuildSliders();
      update();
    });
    regSelect.style.width = '100%';
    selCard.body.appendChild(regSelect);

    const slHeaderSpan = el('span', { text: 'Party Vote Shares (%)' });
    const slCard = ui.card('Party Vote Shares (%)');
    slCard.card.querySelector('h3').replaceWith(slHeaderSpan);
    L.left.appendChild(slCard.card);
    const slBox = el('div');
    slCard.body.appendChild(slBox);

    let activeSliders = null;
    function rebuildSliders() {
      slBox.innerHTML = '';
      if (state.selectedReg === 'ALL') {
        slHeaderSpan.textContent = 'NATIONAL VOTE SHARE (%) – 3% PR THRESHOLD';
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
        const reg = RMAP[state.selectedReg];
        slHeaderSpan.textContent = `${reg.name.toUpperCase()} (${reg.code}) – REGIONAL VOTE (%)`;
        activeSliders = ui.sliders(
          PARTIES.map((p) => ({ id: p.id, name: p.short, leader: p.leader, color: p.color })),
          state.regPct[reg.id],
          {
            max: 55,
            step: 0.1,
            onChange: () => {
              state.overridden[reg.id] = true;
              update(true);
            },
          }
        );
        slBox.appendChild(activeSliders.el);
        slBox.appendChild(
          el('div', { class: 'row', style: { marginTop: '10px' } }, [
            el('button', {
              class: 'btn btn-xs',
              text: `Reset ${reg.name} to 2022 Result`,
              onclick: () => {
                state.regPct[reg.id] = clone(reg.base);
                delete state.overridden[reg.id];
                rebuildSliders();
                update();
              },
            }),
            el('button', {
              class: 'btn btn-xs',
              text: '← Back to National Sliders',
              onclick: () => {
                state.selectedReg = 'ALL';
                regSelect.value = 'ALL';
                rebuildSliders();
                update();
              },
            }),
          ])
        );
      }
    }

    /* ---- Right Column: 20-Region Map + Hemicycle + Coalition Studio + Table ---- */
    const mapCard = ui.card('20 Italian Regions Map (Click a Region to Edit % or Paint Leading Party)');
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
    toolbar.appendChild(makeBrush('edit', '🎛️ Select & Edit Region %', '#5b8cff'));
    ['FDI', 'PD', 'M5S', 'LEGA', 'FI', 'AZIV', 'AVS', 'SVP'].forEach((pid) => {
      const p = PMAP[pid];
      toolbar.appendChild(makeBrush(p.id, p.short, p.color));
    });
    mapCard.body.appendChild(toolbar);

    const mapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const mapWrap = el('div', { class: 'map-wrap' });
    const regTableBox = el('div', { style: { maxHeight: '460px', overflowY: 'auto' } });
    mapGrid.appendChild(mapWrap);
    mapGrid.appendChild(regTableBox);
    mapCard.body.appendChild(mapGrid);

    const hcCard = ui.card('Chamber of Deputies (Camera dei Deputati · 400 Seats · Majority: 201)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const barBox = el('div');
    const coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('Rosatellum Seat Breakdown (147 Uninominali FPTP + 245 Plurinominali PR + 8 Estero)');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    // Build SVG Map of Italy
    const tip = ui.tooltip();
    const W = 430, H = 500;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_IT);
    const path = d3.geoPath(proj);

    let lastSim = null;

    const regPaths = svg.append('g')
      .selectAll('path')
      .data(window.GEO_IT.features)
      .join('path')
      .attr('class', 'unit')
      .attr('d', path)
      .on('click', (e, d) => handleRegClick(RMAP[d.properties.id]))
      .on('mouseenter', (e, d) => showRegTip(e, RMAP[d.properties.id]))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g')
      .selectAll('text')
      .data(window.GEO_IT.features)
      .join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => (RMAP[d.properties.id] || {}).code || '');

    function handleRegClick(reg) {
      if (!reg) return;
      if (state.brush === 'edit') {
        state.selectedReg = reg.id;
        regSelect.value = reg.id;
        rebuildSliders();
        update();
      } else {
        const pid = state.brush;
        const cur = state.regPct[reg.id];
        const othersSum = Object.keys(cur).reduce((a, k) => a + (k === pid ? 0 : cur[k]), 0);
        const targetShare = 38.0;
        Object.keys(cur).forEach((k) => {
          if (k === pid) cur[k] = targetShare;
          else if (othersSum > 0) cur[k] = +((cur[k] / othersSum) * (100 - targetShare)).toFixed(1);
        });
        state.overridden[reg.id] = true;
        rebuildSliders();
        update();
      }
      if (ES.sfx) ES.sfx.click();
    }

    function showRegTip(e, reg) {
      if (!reg || !lastSim) return;
      const pcts = state.regPct[reg.id];
      const rows = PARTIES.filter((p) => (pcts[p.id] || 0) >= 1.5)
        .sort((a, b) => (pcts[b.id] || 0) - (pcts[a.id] || 0))
        .slice(0, 6)
        .map((p) => `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right"><b>${fmt(pcts[p.id], 1)}%</b></td></tr>`)
        .join('');
      tip.show(
        e,
        `<b>${reg.name} (${reg.code})</b> · ${reg.fptp} FPTP seats<table>${rows}</table><div class="muted small">Click to ${state.brush === 'edit' ? 'edit regional %' : 'paint ' + PMAP[state.brush].short}</div>`
      );
    }

    function update(fromSliders) {
      lastSim = simulateChamber();
      const { nat, fptpSeats, prSeats, overseasSeats, totalSeats } = lastSim;

      if (!fromSliders && state.selectedReg === 'ALL' && activeSliders) {
        activeSliders.setValues(clone(nat));
      }

      regPaths
        .attr('fill', (d) => strongestInRegion(d.properties.id).party.color)
        .classed('override', (d) => !!state.overridden[d.properties.id]);

      const rRows = REGIONS.map((r) => {
        const lead = strongestInRegion(r.id);
        return el('tr', {
          style: { cursor: 'pointer', background: state.selectedReg === r.id ? 'rgba(91,140,255,0.16)' : '' },
          onclick: () => handleRegClick(r),
        }, [
          el('td', {}, [
            el('span', { class: 'swatch', style: { background: lead.party.color } }),
            el('span', { text: `${r.code} · ${r.name}` }),
          ]),
          el('td', { class: 'num muted', text: `${r.fptp}` }),
          el('td', { class: 'num', html: `<b style="color:${lead.party.color}">${lead.party.short}</b> ${fmt(lead.pct, 1)}%` }),
        ]);
      });
      regTableBox.innerHTML = '';
      regTableBox.appendChild(
        el('table', { class: 'results' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Region (Click)' }), el('th', { text: 'FPTP' }), el('th', { text: '1st Party' })])),
          el('tbody', {}, rRows),
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

      const cdxTot = ['FDI', 'LEGA', 'FI', 'NM'].reduce((a, id) => a + (totalSeats[id] || 0), 0);
      const csxTot = ['PD', 'AVS', 'PE'].reduce((a, id) => a + (totalSeats[id] || 0), 0);

      ES.hemicycle(hcBox, hcParties, {
        total: TOTAL_SEATS,
        majority: MAJORITY,
        subtitle: `Majority: 201 · Centre-Right: ${cdxTot} · Centre-Left: ${csxTot} · M5S: ${totalSeats.M5S}`,
      });

      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(hcParties, TOTAL_SEATS, MAJORITY, { label: '201 Deputies required for a Chamber majority', unit: 'Deputies' }));

      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hcParties, TOTAL_SEATS, MAJORITY));

      const rows = PARTIES.map((p) => {
        const s = totalSeats[p.id] || 0;
        const v = nat[p.id] || 0;
        return {
          color: p.color,
          name: p.short,
          leader: `${p.leader} (${p.name})`,
          votes: v,
          fptp: fptpSeats[p.id] || 0,
          pr: (prSeats[p.id] || 0) + (overseasSeats[p.id] || 0),
          seats: s,
          dim: s === 0,
        };
      }).sort((a, b) => b.seats - a.seats || b.votes - a.votes);

      tblBox.innerHTML = '';
      tblBox.appendChild(
        ui.resultsTable(rows, {
          nameLabel: 'Party & Leader',
          columns: [
            { key: 'votes', label: 'Vote %', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'fptp', label: 'FPTP (147)' },
            { key: 'pr', label: 'PR + Estero (253)' },
            { key: 'seats', label: 'Total (400)', fmt: (v) => `<b>${v}</b>` },
          ],
        })
      );
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'italy',
    name: 'Italy',
    flag: '🇮🇹',
    title: 'Italy – 2022 General Elections (Chamber of Deputies)',
    subtitle: '400 Deputies · Rosatellum Mixed System (147 FPTP + 245 PR + 8 Overseas) · 20 Regions',
    render,
  });
})();
