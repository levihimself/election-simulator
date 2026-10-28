/* =========================================================================
   Ukraine – 2019 Presidential Election (Round 1 & Runoff) & 2019 Parliamentary
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, normalize } = ES.util;
  const ui = ES.ui;

  const PRES_R1 = [
    { id: 'ZELENSKY', short: 'Zelensky', name: 'Volodymyr Zelensky (Servant of the People)', leader: 'Volodymyr Zelensky', color: '#16a34a', base: 30.24 },
    { id: 'POROSHENKO', short: 'Poroshenko', name: 'Petro Poroshenko (European Solidarity)', leader: 'Petro Poroshenko', color: '#7c2d12', base: 15.95 },
    { id: 'TYMOSHENKO', short: 'Tymoshenko', name: 'Yulia Tymoshenko (Batkivshchyna)', leader: 'Yulia Tymoshenko', color: '#dc2626', base: 13.40 },
    { id: 'BOYKO', short: 'Boyko', name: 'Yuriy Boyko (Opposition Platform — For Life)', leader: 'Yuriy Boyko', color: '#1d4ed8', base: 11.67 },
    { id: 'HRYTSENKO', short: 'Hrytsenko', name: 'Anatoliy Hrytsenko (Civil Position)', leader: 'Anatoliy Hrytsenko', color: '#ca8a04', base: 6.91 },
    { id: 'SMESHKO', short: 'Smeshko', name: 'Ihor Smeshko (Strength and Honor)', leader: 'Ihor Smeshko', color: '#0284c7', base: 6.04 },
    { id: 'LYASHKO', short: 'Lyashko', name: 'Oleh Lyashko (Radical Party)', leader: 'Oleh Lyashko', color: '#e11d48', base: 5.48 },
  ];

  const PRES_R2 = [
    { id: 'ZELENSKY', short: 'Zelensky', name: 'Volodymyr Zelensky (Servant of the People)', leader: 'Volodymyr Zelensky', color: '#16a34a', base: 73.22 },
    { id: 'POROSHENKO', short: 'Poroshenko', name: 'Petro Poroshenko (European Solidarity)', leader: 'Petro Poroshenko', color: '#7c2d12', base: 24.45 },
  ];

  const RADA_PARTIES = [
    { id: 'SN', short: 'Sluha Narodu', name: 'Servant of the People (Sluha Narodu)', leader: 'Volodymyr Zelensky', color: '#16a34a', base: 43.16, constSeats: 130 },
    { id: 'OPZZH', short: 'OPZZH', name: 'Opposition Platform — For Life', leader: 'Yuriy Boyko', color: '#1d4ed8', base: 13.05, constSeats: 6 },
    { id: 'BAT', short: 'Batkivshchyna', name: 'All-Ukrainian Union "Fatherland"', leader: 'Yulia Tymoshenko', color: '#dc2626', base: 8.18, constSeats: 2 },
    { id: 'PES', short: 'Euro. Solidarity', name: 'European Solidarity', leader: 'Petro Poroshenko', color: '#7c2d12', base: 8.10, constSeats: 2 },
    { id: 'HOLOS', short: 'Holos', name: 'Holos (Voice)', leader: 'Sviatoslav Vakarchuk', color: '#f97316', base: 5.82, constSeats: 3 },
    { id: 'IND', short: 'Ind. / Other', name: 'Independents & Minor Constituency Parties', leader: 'Various', color: '#64748b', base: 4.50, constSeats: 56 },
  ];

  let state = null;
  function initState() {
    const r1 = {}, r2 = {}, rada = {};
    PRES_R1.forEach((p) => (r1[p.id] = p.base));
    PRES_R2.forEach((p) => (r2[p.id] = p.base));
    RADA_PARTIES.forEach((p) => (rada[p.id] = p.base));
    state = { mode: 'rada2019', r1, r2, rada, overrides: {} };
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    const modeCard = ui.card('Ukraine 2019 Election Mode');
    L.left.appendChild(modeCard.card);
    modeCard.body.appendChild(ui.segmented([
      { value: 'rada2019', label: '🏛️ 2019 Parliamentary (Rada)' },
      { value: 'pres2019_r1', label: '🗳️ 2019 Presidential (Round 1)' },
      { value: 'pres2019_r2', label: '🏆 2019 Presidential (Runoff)' },
    ], state.mode, (v) => { state.mode = v; state.overrides = {}; rebuild(); }));

    const activeList = state.mode === 'rada2019' ? RADA_PARTIES : state.mode === 'pres2019_r1' ? PRES_R1 : PRES_R2;
    const activeVals = state.mode === 'rada2019' ? state.rada : state.mode === 'pres2019_r1' ? state.r1 : state.r2;

    const slCard = ui.card('National Vote Share (%)');
    L.left.appendChild(slCard.card);
    const sliders = ui.sliders(activeList, activeVals, {
      max: state.mode === 'pres2019_r2' ? 85 : 60,
      step: 0.1,
      onChange: () => update(),
    });
    slCard.body.appendChild(sliders.el);

    const mapCard = ui.card('25 Ukrainian Oblasts & Kyiv City Map – Click to Flip Winner');
    L.right.appendChild(mapCard.card);
    const mapWrap = el('div', { class: 'map-wrap' });
    mapCard.body.appendChild(mapWrap);

    const hcCard = ui.card(state.mode === 'rada2019' ? 'Verkhovna Rada (424 Elected Seats · 226 Constitutional Majority)' : '2019 Presidential Vote Breakdown');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div'), barBox = el('div'), coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('2019 Ukrainian Election Results');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    const tip = ui.tooltip();
    const W = 520, H = 360;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_UA);
    const path = d3.geoPath(proj);

    const obPaths = svg.append('g').selectAll('path').data(window.GEO_UA.features).join('path')
      .attr('class', 'unit').attr('d', path)
      .on('click', (e, d) => {
        const oid = d.properties.id;
        const ids = activeList.map((x) => x.id);
        const cur = state.overrides[oid] || ids[0];
        state.overrides[oid] = ids[(ids.indexOf(cur) + 1) % ids.length];
        update();
      })
      .on('mouseenter', (e, d) => {
        tip.show(e, `<b>${d.properties.name}</b> (${d.properties.code})<br>Click to cycle winning party/candidate`);
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g').selectAll('text').data(window.GEO_UA.features).join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => d.properties.code);

    function update() {
      const norm = normalize(activeVals, 100);
      obPaths.attr('fill', (d) => {
        const oid = d.properties.id;
        if (state.overrides[oid]) return (activeList.find((x) => x.id === state.overrides[oid]) || activeList[0]).color;
        if (oid === 'UA-LV' && (norm.POROSHENKO > 12 || norm.PES > 6)) {
          return (activeList.find((x) => x.id === 'POROSHENKO' || x.id === 'PES') || activeList[0]).color;
        }
        if ((oid === 'UA-LH' || oid === 'UA-DN') && (norm.BOYKO > 8 || norm.OPZZH > 9)) {
          return (activeList.find((x) => x.id === 'BOYKO' || x.id === 'OPZZH') || activeList[0]).color;
        }
        return activeList.slice().sort((a, b) => (norm[b.id] || 0) - (norm[a.id] || 0))[0].color;
      });

      if (state.mode === 'rada2019') {
        const prQual = {};
        RADA_PARTIES.forEach((p) => {
          if (p.id !== 'IND' && (norm[p.id] || 0) >= 5.0) prQual[p.id] = norm[p.id];
        });
        const prSeats = ES.methods.largestRemainder(prQual, 225, 'hare');
        const hcParties = RADA_PARTIES.map((p) => {
          const scale = p.base > 0 ? (norm[p.id] || 0) / p.base : 1;
          const cSeats = Math.round(p.constSeats * scale);
          return { ...p, pr: prSeats[p.id] || 0, const: cSeats, seats: (prSeats[p.id] || 0) + cSeats, votes: norm[p.id] || 0 };
        });
        const totS = hcParties.reduce((a, p) => a + p.seats, 0);
        ES.hemicycle(hcBox, hcParties, { total: totS, majority: 226, subtitle: '226 Constitutional Majority · 225 PR + 199 Constituency' });
        barBox.innerHTML = '';
        barBox.appendChild(ui.seatBar(hcParties, totS, 226, { label: '226 seats required for a Verkhovna Rada majority', unit: 'seats' }));
        coalBox.innerHTML = '';
        coalBox.appendChild(ui.coalition(hcParties, totS, 226, { key: 'ua_rada' }));
        tblBox.innerHTML = '';
        tblBox.appendChild(ui.resultsTable(hcParties.slice().sort((a, b) => b.seats - a.seats), {
          nameLabel: 'Party & Leader',
          columns: [
            { key: 'votes', label: 'PR Vote %', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'pr', label: 'List (225)' },
            { key: 'const', label: 'Constituency (199)' },
            { key: 'seats', label: 'Total Seats', fmt: (v) => `<b>${v}</b>` },
          ],
        }));
      } else {
        const sorted = activeList.map((p) => ({ ...p, votes: norm[p.id] || 0, seats: Math.round(norm[p.id] || 0) })).sort((a, b) => b.votes - a.votes);
        ES.hemicycle(hcBox, sorted, { total: 100, majority: 51, centerLabel: sorted[0].short, subtitle: `${sorted[0].name}: ${fmt(sorted[0].votes, 2)}%` });
        barBox.innerHTML = '';
        barBox.appendChild(ui.seatBar(sorted, 100, 50, { label: '50% + 1 required to win the Presidency', unit: '%' }));
        coalBox.innerHTML = '';
        tblBox.innerHTML = '';
        tblBox.appendChild(ui.resultsTable(sorted, {
          nameLabel: 'Presidential Candidate',
          columns: [{ key: 'votes', label: 'Popular Vote %', fmt: (v) => `<b>${fmt(v, 2)}%</b>` }],
        }));
      }
    }

    function rebuild() { root.innerHTML = ''; render(root); }
    update();
  }

  ES.register({
    id: 'ukraine',
    name: 'Ukraine',
    flag: '🇺🇦',
    title: 'Ukraine – 2019 Presidential & Parliamentary Elections',
    subtitle: '2019 Presidential (1st Round & Runoff) & Verkhovna Rada (225 PR + 199 Constituency)',
    render,
  });
})();
