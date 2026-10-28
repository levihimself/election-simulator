/* =========================================================================
   Denmark – 2026 General Election (Folketinget · 179 Seats · Majority 90)
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, clone, normalize } = ES.util;
  const ui = ES.ui;

  const TOTAL_SEATS = 179, DK_PROPER_SEATS = 175, MAJORITY = 90, THRESHOLD = 2.0;

  const PARTIES = [
    { id: 'O_RED', short: 'Ø', code: 'Ø', name: 'Red–Green Alliance (Enhedslisten)', leader: 'Pelle Dragsted', color: '#e11d48', bloc: 'red', base2026: 6.34, base2022: 5.13 },
    { id: 'ALT', short: 'Å', code: 'Å', name: 'The Alternative (Alternativet)', leader: 'Franciska Rosenkilde', color: '#16a34a', bloc: 'red', base2026: 2.58, base2022: 3.33 },
    { id: 'SF', short: 'SF', code: 'F', name: 'Green Left (Socialistisk Folkeparti)', leader: 'Pia Olsen Dyhr', color: '#ec4899', bloc: 'red', base2026: 11.59, base2022: 8.30 },
    { id: 'A', short: 'Soc.Dem.', code: 'A', name: 'Social Democrats (Socialdemokratiet)', leader: 'Mette Frederiksen', color: '#c8102e', bloc: 'red', base2026: 21.85, base2022: 27.50 },
    { id: 'B', short: 'Radikale', code: 'B', name: 'Social Liberal Party (Radikale Venstre)', leader: 'Martin Lidegaard', color: '#7c3aed', bloc: 'red', base2026: 5.82, base2022: 3.79 },
    { id: 'M', short: 'Moderaterne', code: 'M', name: 'Moderates (Moderaterne)', leader: 'Lars Løkke Rasmussen', color: '#8b5cf6', bloc: 'centre', base2026: 7.68, base2022: 9.27 },
    { id: 'C', short: 'Konserv.', code: 'C', name: "Conservative People's Party", leader: 'Mona Juul', color: '#15803d', bloc: 'blue', base2026: 7.59, base2022: 5.51 },
    { id: 'V', short: 'Venstre', code: 'V', name: "Venstre, Denmark's Liberal Party", leader: 'Troels Lund Poulsen', color: '#0284c7', bloc: 'blue', base2026: 10.14, base2022: 13.32 },
    { id: 'I', short: 'Lib. All.', code: 'I', name: 'Liberal Alliance', leader: 'Alex Vanopslagh', color: '#06b6d4', bloc: 'blue', base2026: 9.37, base2022: 7.89 },
    { id: 'AE', short: 'Danm.Dem.', code: 'Æ', name: 'Denmark Democrats (Danmarksdemokraterne)', leader: 'Inger Støjberg', color: '#1e40af', bloc: 'blue', base2026: 5.75, base2022: 8.12 },
    { id: 'O_DPP', short: 'DF', code: 'O', name: "Danish People's Party (Dansk Folkeparti)", leader: 'Morten Messerschmidt', color: '#eab308', bloc: 'blue', base2026: 9.10, base2022: 2.64 },
    { id: 'H', short: 'Borgernes', code: 'H', name: "Citizens' Party (Borgernes Parti)", leader: 'Lars Boje Mathiesen', color: '#475569', bloc: 'blue', base2026: 2.13, base2022: 0.0 },
  ];

  const ATLANTIC_PARTIES = [
    { id: 'GL_IA', short: 'IA (GL)', name: 'Inuit Ataqatigiit (Greenland)', leader: 'Múte Bourup Egede', color: '#be123c', seats: 1 },
    { id: 'GL_NAL', short: 'Naleraq (GL)', name: 'Naleraq (Greenland)', leader: 'Pele Broberg', color: '#ea580c', seats: 1 },
    { id: 'FO_JF', short: 'Javnaðarfl. (FO)', name: 'Social Democratic Party (Faroes)', leader: 'Aksel V. Johannesen', color: '#dc2626', seats: 1 },
    { id: 'FO_SB', short: 'Sambandsfl. (FO)', name: 'Union Party (Faroes)', leader: 'Bárður á Steig Nielsen', color: '#0369a1', seats: 1 },
  ];

  const PMAP = {};
  PARTIES.forEach((p) => (PMAP[p.id] = p));

  const STORKREDSE = [
    { id: 'DK-KB', code: 'KB', name: 'Københavns Storkreds', seats: 17, weight: 12.8, base: { A: 16.5, SF: 17.8, O_RED: 13.8, B: 9.8, I: 9.5, M: 7.4, C: 6.8, V: 5.8, ALT: 5.6, O_DPP: 4.2, AE: 1.4, H: 1.4 } },
    { id: 'DK-KO', code: 'KO', name: 'Københavns Omegns Storkreds', seats: 11, weight: 8.6, base: { A: 22.8, SF: 12.2, O_DPP: 10.4, C: 9.2, M: 8.8, I: 8.6, V: 7.5, B: 6.8, O_RED: 6.2, AE: 3.2, ALT: 2.2, H: 2.1 } },
    { id: 'DK-NS', code: 'NS', name: 'Nordsjællands Storkreds', seats: 10, weight: 8.0, base: { A: 18.5, C: 12.4, I: 12.2, SF: 10.8, V: 10.6, M: 9.4, O_DPP: 8.8, B: 7.4, O_RED: 4.2, AE: 2.6, ALT: 1.8, H: 1.3 } },
    { id: 'DK-BH', code: 'BH', name: 'Bornholms Storkreds', seats: 2, weight: 0.8, base: { A: 31.5, V: 14.5, O_DPP: 12.8, SF: 10.2, C: 6.8, AE: 6.2, O_RED: 5.8, M: 5.2, I: 3.8, B: 1.5, ALT: 1.0, H: 0.7 } },
    { id: 'DK-SL', code: 'SL', name: 'Sjællands Storkreds', seats: 20, weight: 14.5, base: { A: 24.8, O_DPP: 12.6, SF: 11.4, V: 10.2, M: 8.4, I: 8.2, AE: 6.8, C: 6.2, O_RED: 4.4, B: 3.4, H: 2.2, ALT: 1.4 } },
    { id: 'DK-FY', code: 'FY', name: 'Fyns Storkreds', seats: 12, weight: 8.8, base: { A: 24.2, SF: 12.0, V: 10.4, O_DPP: 9.6, I: 8.8, M: 8.0, C: 7.2, O_RED: 5.8, AE: 5.4, B: 4.4, ALT: 2.2, H: 2.0 } },
    { id: 'DK-SJ', code: 'SJ', name: 'Sydjyllands Storkreds', seats: 17, weight: 12.2, base: { A: 22.6, V: 13.2, O_DPP: 11.8, I: 9.6, AE: 8.8, SF: 8.6, C: 6.8, M: 6.8, B: 3.6, O_RED: 3.2, H: 3.2, ALT: 1.8 } },
    { id: 'DK-OJ', code: 'OJ', name: 'Østjyllands Storkreds', seats: 18, weight: 14.2, base: { A: 20.8, SF: 13.2, I: 10.8, V: 9.8, B: 7.2, C: 7.0, O_RED: 6.8, M: 6.8, O_DPP: 6.6, AE: 4.8, ALT: 3.6, H: 2.6 } },
    { id: 'DK-VJ', code: 'VJ', name: 'Vestjyllands Storkreds', seats: 13, weight: 9.2, base: { A: 21.0, V: 16.5, AE: 10.8, O_DPP: 9.6, I: 9.2, C: 8.4, SF: 8.2, M: 6.4, B: 3.4, O_RED: 2.6, H: 2.5, ALT: 1.4 } },
    { id: 'DK-NJ', code: 'NJ', name: 'Nordjyllands Storkreds', seats: 15, weight: 10.9, base: { A: 25.4, V: 12.4, AE: 10.4, SF: 9.8, O_DPP: 9.4, I: 8.8, C: 6.6, M: 6.2, O_RED: 4.0, B: 3.4, H: 2.2, ALT: 1.4 } },
  ];

  const totalWeight = STORKREDSE.reduce((a, s) => a + s.weight, 0);
  PARTIES.forEach((p) => {
    const raw = STORKREDSE.reduce((a, s) => a + (s.base[p.id] || 0) * s.weight, 0) / totalWeight;
    if (raw > 0) {
      const f = p.base2026 / raw;
      STORKREDSE.forEach((s) => (s.base[p.id] = +((s.base[p.id] || 0) * f).toFixed(2)));
    }
  });

  const SMAP = {};
  STORKREDSE.forEach((s) => (SMAP[s.id] = s));

  let state = null;
  function initState() {
    const stPct = {};
    STORKREDSE.forEach((s) => (stPct[s.id] = clone(s.base)));
    state = { selectedKreds: 'ALL', brush: 'edit', stPct, overridden: {} };
  }

  function getNationalPct() {
    const nat = {};
    PARTIES.forEach((p) => {
      nat[p.id] = +(STORKREDSE.reduce((a, s) => a + (state.stPct[s.id][p.id] || 0) * s.weight, 0) / totalWeight).toFixed(2);
    });
    return nat;
  }

  function applyNationalTarget(newNat) {
    const curNat = getNationalPct();
    PARTIES.forEach((p) => {
      const target = newNat[p.id] || 0;
      const cur = curNat[p.id] || 0;
      STORKREDSE.forEach((s) => {
        if (cur > 0.05) state.stPct[s.id][p.id] = +Math.max(0, (state.stPct[s.id][p.id] || 0) * (target / cur)).toFixed(2);
        else state.stPct[s.id][p.id] = +target.toFixed(2);
      });
    });
  }

  function calculateFolketing() {
    const nat = normalize(getNationalPct(), 100);
    const kredsSeats = {}, partyKredsTot = {}, kredsWinner = {};
    PARTIES.forEach((p) => (partyKredsTot[p.id] = 0));

    STORKREDSE.forEach((s) => {
      const pcts = normalize(state.stPct[s.id], 100);
      const alloc = ES.methods.dhondt(pcts, s.seats);
      kredsSeats[s.id] = alloc;
      Object.entries(alloc).forEach(([pid, n]) => (partyKredsTot[pid] = (partyKredsTot[pid] || 0) + n));
      let bestP = 'A', bestV = -1;
      PARTIES.forEach((p) => {
        if ((pcts[p.id] || 0) > bestV) { bestV = pcts[p.id]; bestP = p.id; }
      });
      kredsWinner[s.id] = { party: PMAP[bestP], pct: bestV };
    });

    const qualVotes = {};
    PARTIES.forEach((p) => {
      if ((nat[p.id] || 0) >= THRESHOLD || (partyKredsTot[p.id] || 0) > 0) qualVotes[p.id] = nat[p.id];
    });
    const total175 = ES.methods.sainteLague(qualVotes, DK_PROPER_SEATS);
    const tillaegsSeats = {};
    PARTIES.forEach((p) => {
      const tot = total175[p.id] || 0;
      tillaegsSeats[p.id] = Math.max(0, tot - (partyKredsTot[p.id] || 0));
    });

    return { nat, total175, partyKredsTot, tillaegsSeats, kredsSeats, kredsWinner };
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    const scenCard = ui.card('2026 Danish General Election Scenarios');
    L.left.appendChild(scenCard.card);
    scenCard.body.appendChild(el('div', { class: 'row', style: { gap: '6px', marginBottom: '8px' } }, [
      el('button', { class: 'btn btn-primary', text: '2026 Official Election (24 Mar 2026)', onclick: () => { initState(); rebuildSliders(); update(); } }),
      el('button', {
        class: 'btn',
        text: '2022 Election Result (SVM Majority)',
        onclick: () => {
          const t = {};
          PARTIES.forEach((p) => (t[p.id] = p.base2022));
          applyNationalTarget(t);
          rebuildSliders();
          update();
        },
      }),
      el('button', {
        class: 'btn',
        text: 'Blue Bloc 90+ Majority Surge',
        onclick: () => {
          applyNationalTarget({ A: 18.5, SF: 10.5, V: 13.8, I: 12.4, O_DPP: 11.2, C: 9.2, AE: 7.5, M: 5.5, O_RED: 5.0, B: 3.8, H: 2.2, ALT: 1.4 });
          rebuildSliders();
          update();
        },
      }),
    ]));

    const selCard = ui.card('Select Storkreds or National Vote Share (%)');
    L.left.appendChild(selCard.card);
    const kredsOpts = [{ value: 'ALL', label: '🇩🇰 All Denmark – National Vote Share (%)' }].concat(
      STORKREDSE.map((s) => ({ value: s.id, label: `${s.name} (${s.code}) · ${s.seats} Kredsmandater` }))
    );
    const kredsSelect = ui.select(kredsOpts, state.selectedKreds, (v) => { state.selectedKreds = v; rebuildSliders(); update(); });
    kredsSelect.style.width = '100%';
    selCard.body.appendChild(kredsSelect);

    const slCard = ui.card('Party Vote Shares (%)');
    L.left.appendChild(slCard.card);
    const slBox = el('div');
    slCard.body.appendChild(slBox);

    let activeSliders = null;
    function rebuildSliders() {
      slBox.innerHTML = '';
      if (state.selectedKreds === 'ALL') {
        const natVals = getNationalPct();
        activeSliders = ui.sliders(
          PARTIES.map((p) => ({ id: p.id, short: p.code, name: `${p.short} (${p.code})`, leader: p.leader, color: p.color })),
          natVals,
          { max: 35, step: 0.1, onChange: (vals) => { applyNationalTarget(vals); update(true); } }
        );
        slBox.appendChild(activeSliders.el);
      } else {
        const kr = SMAP[state.selectedKreds];
        activeSliders = ui.sliders(
          PARTIES.map((p) => ({ id: p.id, short: p.code, name: `${p.short} (${p.code})`, leader: p.leader, color: p.color })),
          state.stPct[kr.id],
          { max: 40, step: 0.1, onChange: () => { state.overridden[kr.id] = true; update(true); } }
        );
        slBox.appendChild(activeSliders.el);
      }
    }

    const mapCard = ui.card('10 Multi-Member Storkredse Map (Click to Edit or Paint)');
    L.right.appendChild(mapCard.card);
    const toolbar = el('div', { class: 'map-toolbar' });
    const makeBrush = (id, label, color) => {
      const b = el('button', { class: 'paint-chip' + (state.brush === id ? ' active' : ''), style: { '--c': color } }, [
        id !== 'edit' ? el('span', { class: 'swatch', style: { background: color } }) : null, label,
      ]);
      b.addEventListener('click', () => {
        state.brush = id;
        toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      });
      return b;
    };
    toolbar.appendChild(makeBrush('edit', '🎛️ Edit Storkreds %', '#5b8cff'));
    PARTIES.forEach((p) => toolbar.appendChild(makeBrush(p.id, `${p.code} · ${p.short}`, p.color)));
    mapCard.body.appendChild(toolbar);

    const mapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const mapWrap = el('div', { class: 'map-wrap' });
    const krTableBox = el('div');
    mapGrid.appendChild(mapWrap);
    mapGrid.appendChild(krTableBox);
    mapCard.body.appendChild(mapGrid);

    const hcCard = ui.card('Folketinget – 179 Seats (90 Needed for Majority)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div'), barBox = el('div'), coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('2026 Folketing Results (Constituency + Leveling + North Atlantic)');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    const tip = ui.tooltip();
    const W = 460, H = 380;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_DK);
    const path = d3.geoPath(proj);

    const krPaths = svg.append('g').selectAll('path').data(window.GEO_DK.features).join('path')
      .attr('class', 'unit').attr('d', path)
      .on('click', (e, d) => {
        const kr = SMAP[d.properties.id];
        if (state.brush === 'edit') {
          state.selectedKreds = kr.id;
          kredsSelect.value = kr.id;
          rebuildSliders();
        } else {
          state.stPct[kr.id][state.brush] = 36.0;
          state.overridden[kr.id] = true;
          rebuildSliders();
        }
        update();
      })
      .on('mouseenter', (e, d) => {
        const kr = SMAP[d.properties.id];
        const pcts = normalize(state.stPct[kr.id], 100);
        const top = PARTIES.slice().sort((a, b) => (pcts[b.id] || 0) - (pcts[a.id] || 0)).slice(0, 5)
          .map((p) => `<tr><td><span style="color:${p.color}">■</span> ${p.code} (${p.short})</td><td style="text-align:right"><b>${fmt(pcts[p.id], 1)}%</b></td></tr>`).join('');
        tip.show(e, `<b>${kr.name}</b> · ${kr.seats} Kredsmandater<table>${top}</table>`);
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g').selectAll('text').data(window.GEO_DK.features).join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => d.properties.code);

    function update(fromSliders) {
      const calc = calculateFolketing();
      const { nat, total175, partyKredsTot, tillaegsSeats, kredsWinner } = calc;
      if (!fromSliders && state.selectedKreds === 'ALL' && activeSliders) activeSliders.setValues(clone(nat));

      krPaths.attr('fill', (d) => kredsWinner[d.properties.id].party.color);

      krTableBox.innerHTML = '';
      krTableBox.appendChild(el('table', { class: 'results' }, [
        el('thead', {}, el('tr', {}, [el('th', { text: 'Storkreds' }), el('th', { text: 'Seats' }), el('th', { text: '1st Party' })])),
        el('tbody', {}, STORKREDSE.map((s) => {
          const w = kredsWinner[s.id];
          return el('tr', {
            style: { cursor: 'pointer' },
            onclick: () => { state.selectedKreds = s.id; kredsSelect.value = s.id; rebuildSliders(); update(); },
          }, [
            el('td', {}, [el('span', { class: 'swatch', style: { background: w.party.color } }), `${s.code} · ${s.name}`]),
            el('td', { class: 'num muted', text: s.seats }),
            el('td', { class: 'num', html: `<b style="color:${w.party.color}">${w.party.code}</b> ${fmt(w.pct, 1)}%` }),
          ]);
        })),
      ]));

      const allParties = PARTIES.map((p) => ({
        id: p.id, short: p.code, name: p.name, leader: p.leader, color: p.color, seats: total175[p.id] || 0,
      })).concat(ATLANTIC_PARTIES);

      ES.hemicycle(hcBox, allParties, { total: TOTAL_SEATS, majority: MAJORITY, subtitle: 'Majority: 90 · 175 Denmark + 4 Greenland/Faroes' });
      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(allParties, TOTAL_SEATS, MAJORITY, { label: '90 mandates required for a Folketing majority (179 total)', unit: 'seats' }));
      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(allParties, TOTAL_SEATS, MAJORITY, { key: 'dk_179' }));

      const rows = PARTIES.map((p) => ({
        id: p.id, color: p.color, short: p.code, name: `${p.name} (${p.code})`, leader: p.leader,
        votes: nat[p.id] || 0, kreds: partyKredsTot[p.id] || 0, till: tillaegsSeats[p.id] || 0,
        seats: total175[p.id] || 0, dim: (total175[p.id] || 0) === 0,
      })).sort((a, b) => b.seats - a.seats || b.votes - a.votes);

      tblBox.innerHTML = '';
      tblBox.appendChild(ui.resultsTable(rows, {
        nameLabel: 'Party & Leader',
        columns: [
          { key: 'votes', label: 'Vote %', fmt: (v) => fmt(v, 2) + '%' },
          { key: 'kreds', label: 'Kreds (135)' },
          { key: 'till', label: 'Leveling (40)' },
          { key: 'seats', label: 'Total Seats', fmt: (v) => `<b>${v}</b>` },
        ],
      }));
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'denmark',
    name: 'Denmark',
    flag: '🇩🇰',
    title: 'Denmark – 2026 General Election (Folketinget)',
    subtitle: '179 Seats · 90 Majority · 10 Storkredse (135 Kredsmandater + 40 Tillægsmandater) + 4 North Atlantic',
    render,
  });
})();
