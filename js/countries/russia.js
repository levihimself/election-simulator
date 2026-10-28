/* =========================================================================
   Russia – 2000 Presidential, 2003 State Duma (450 Seats), & 2013 Moscow Mayoral
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, normalize } = ES.util;
  const ui = ES.ui;

  const PRES_2000 = [
    { id: 'PUTIN', short: 'Putin', name: 'Vladimir Putin (Independent / Unity)', leader: 'Vladimir Putin', color: '#1e40af', base: 53.44 },
    { id: 'ZYUGANOV', short: 'Zyuganov', name: 'Gennady Zyuganov (Communist Party – KPRF)', leader: 'Gennady Zyuganov', color: '#dc2626', base: 29.49 },
    { id: 'YAVLINSKY', short: 'Yavlinsky', name: 'Grigory Yavlinsky (Yabloko)', leader: 'Grigory Yavlinsky', color: '#16a34a', base: 5.85 },
    { id: 'TULEYEV', short: 'Tuleyev', name: 'Aman Tuleyev (Kemerovo Governor)', leader: 'Aman Tuleyev', color: '#0284c7', base: 2.95 },
    { id: 'ZHIRINOVSKY', short: 'Zhirinovsky', name: 'Vladimir Zhirinovsky (LDPR)', leader: 'Vladimir Zhirinovsky', color: '#eab308', base: 2.70 },
    { id: 'TITOV', short: 'Titov', name: 'Konstantin Titov (Samara Governor)', leader: 'Konstantin Titov', color: '#7c3aed', base: 1.47 },
    { id: 'PAMFILOVA', short: 'Pamfilova', name: 'Ella Pamfilova (For Civic Dignity)', leader: 'Ella Pamfilova', color: '#ec4899', base: 1.01 },
  ];

  const DUMA_2003 = [
    { id: 'UR', short: 'United Russia', name: 'United Russia (Yedinaya Rossiya)', leader: 'Boris Gryzlov', color: '#1e40af', base: 37.57, smd: 103 },
    { id: 'KPRF', short: 'KPRF', name: 'Communist Party (KPRF)', leader: 'Gennady Zyuganov', color: '#dc2626', base: 12.61, smd: 12 },
    { id: 'LDPR', short: 'LDPR', name: 'Liberal Democratic Party (LDPR)', leader: 'Vladimir Zhirinovsky', color: '#eab308', base: 11.45, smd: 0 },
    { id: 'RODINA', short: 'Rodina', name: 'Motherland (Rodina Bloc)', leader: 'Dmitry Rogozin', color: '#b45309', base: 9.02, smd: 8 },
    { id: 'YABLOKO', short: 'Yabloko', name: 'Yabloko', leader: 'Grigory Yavlinsky', color: '#16a34a', base: 4.30, smd: 4 },
    { id: 'SPS', short: 'SPS', name: 'Union of Right Forces (SPS)', leader: 'Boris Nemtsov', color: '#0284c7', base: 3.97, smd: 3 },
    { id: 'IND', short: 'Ind. / Minor', name: "Independents, People's Party & Agrarians", leader: 'Gennady Raikov', color: '#64748b', base: 8.50, smd: 95 },
  ];

  const MOSCOW_2013 = [
    { id: 'SOBYANIN', short: 'Sobyanin', name: 'Sergey Sobyanin (Independent / United Russia)', leader: 'Sergey Sobyanin', color: '#1e40af', base: 51.37 },
    { id: 'NAVALNY', short: 'Navalny', name: 'Alexei Navalny (RPR-PARNAS)', leader: 'Alexei Navalny', color: '#2563eb', base: 27.24 },
    { id: 'MELNIKOV', short: 'Melnikov', name: 'Ivan Melnikov (Communist Party – KPRF)', leader: 'Ivan Melnikov', color: '#dc2626', base: 10.69 },
    { id: 'MITROKHIN', short: 'Mitrokhin', name: 'Sergey Mitrokhin (Yabloko)', leader: 'Sergey Mitrokhin', color: '#16a34a', base: 3.51 },
    { id: 'DEGTYARYOV', short: 'Degtyaryov', name: 'Mikhail Degtyaryov (LDPR)', leader: 'Mikhail Degtyaryov', color: '#eab308', base: 2.86 },
    { id: 'LEVICHEV', short: 'Levichev', name: 'Nikolai Levichev (A Just Russia)', leader: 'Nikolai Levichev', color: '#f97316', base: 2.79 },
  ];

  let state = null;
  function initState() {
    const p00 = {}, d03 = {}, m13 = {};
    PRES_2000.forEach((p) => (p00[p.id] = p.base));
    DUMA_2003.forEach((p) => (d03[p.id] = p.base));
    MOSCOW_2013.forEach((p) => (m13[p.id] = p.base));
    state = { mode: 'pres2000', p00, d03, m13, overrides: {} };
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    const modeCard = ui.card('Russian Election Mode');
    L.left.appendChild(modeCard.card);
    modeCard.body.appendChild(ui.segmented([
      { value: 'pres2000', label: '🇷🇺 2000 Presidential' },
      { value: 'duma2003', label: '🏛️ 2003 State Duma (450)' },
      { value: 'moscow2013', label: '🏙️ 2013 Moscow Mayoral' },
    ], state.mode, (v) => { state.mode = v; state.overrides = {}; rebuild(); }));

    const activeList = state.mode === 'pres2000' ? PRES_2000 : state.mode === 'duma2003' ? DUMA_2003 : MOSCOW_2013;
    const activeVals = state.mode === 'pres2000' ? state.p00 : state.mode === 'duma2003' ? state.d03 : state.m13;

    const slCard = ui.card('Candidate / Party Vote Share (%)');
    L.left.appendChild(slCard.card);
    const sliders = ui.sliders(activeList, activeVals, { max: 70, step: 0.1, onChange: () => update() });
    slCard.body.appendChild(sliders.el);

    const isMoscow = state.mode === 'moscow2013';
    const mapCard = ui.card(isMoscow ? 'Moscow 12 Administrative Okrugs Map (2013 Mayoral)' : 'Russian Federal Clusters Map (Click to Flip Winner)');
    L.right.appendChild(mapCard.card);
    const mapWrap = el('div', { class: 'map-wrap' });
    mapCard.body.appendChild(mapWrap);

    const hcCard = ui.card(state.mode === 'duma2003' ? '4th Russian State Duma (450 Seats · Majority 226)' : 'Election Vote Share & Runoff Threshold (50% + 1)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div'), barBox = el('div'), coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('Official Results Breakdown');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    const tip = ui.tooltip();
    const W = 500, H = 360;
    const geoData = isMoscow ? window.GEO_MOSCOW : window.GEO_RU;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], geoData);
    const path = d3.geoPath(proj);

    const regPaths = svg.append('g').selectAll('path').data(geoData.features).join('path')
      .attr('class', 'unit').attr('d', path)
      .on('click', (e, d) => {
        const rid = d.properties.id;
        const ids = activeList.map((x) => x.id);
        const cur = state.overrides[rid] || ids[0];
        state.overrides[rid] = ids[(ids.indexOf(cur) + 1) % ids.length];
        update();
      })
      .on('mouseenter', (e, d) => {
        tip.show(e, `<b>${d.properties.name}</b> (${d.properties.code})<br>Click to cycle winner`);
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g').selectAll('text').data(geoData.features).join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => d.properties.code);

    function update() {
      const norm = normalize(activeVals, 100);
      regPaths.attr('fill', (d) => {
        const rid = d.properties.id;
        if (state.overrides[rid]) return (activeList.find((x) => x.id === state.overrides[rid]) || activeList[0]).color;
        if (state.mode === 'pres2000') {
          if (rid === 'RU-KEM' && norm.TULEYEV > 2.0) return '#0284c7';
          if (rid === 'RU-CHR' && norm.ZYUGANOV > 26.0) return '#dc2626';
        }
        if (state.mode === 'moscow2013' && (rid === 'MOW-CAO' || rid === 'MOW-UZAO') && norm.NAVALNY > 35.0) return '#2563eb';
        return activeList.slice().sort((a, b) => (norm[b.id] || 0) - (norm[a.id] || 0))[0].color;
      });

      if (state.mode === 'duma2003') {
        const prQual = {};
        DUMA_2003.forEach((p) => {
          if (p.id !== 'IND' && (norm[p.id] || 0) >= 5.0) prQual[p.id] = norm[p.id];
        });
        const prSeats = ES.methods.largestRemainder(prQual, 225, 'hare');
        const hcParties = DUMA_2003.map((p) => ({
          ...p, pr: prSeats[p.id] || 0, smd: p.smd, seats: (prSeats[p.id] || 0) + p.smd, votes: norm[p.id] || 0,
        }));
        ES.hemicycle(hcBox, hcParties, { total: 450, majority: 226, subtitle: '450 Seats · 225 Party List (5% Threshold) + 225 Single-Member' });
        barBox.innerHTML = '';
        barBox.appendChild(ui.seatBar(hcParties, 450, 226, { label: '226 Deputies needed for a State Duma majority', unit: 'seats' }));
        coalBox.innerHTML = '';
        coalBox.appendChild(ui.coalition(hcParties, 450, 226, { key: 'ru_duma03' }));
        tblBox.innerHTML = '';
        tblBox.appendChild(ui.resultsTable(hcParties.slice().sort((a, b) => b.seats - a.seats), {
          nameLabel: 'Party & Leader',
          columns: [
            { key: 'votes', label: 'PR Vote %', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'pr', label: 'PR List (225)' },
            { key: 'smd', label: 'Districts (225)' },
            { key: 'seats', label: 'Total (450)', fmt: (v) => `<b>${v}</b>` },
          ],
        }));
      } else {
        const sorted = activeList.map((p) => ({ ...p, votes: norm[p.id] || 0, seats: Math.round(norm[p.id] || 0) })).sort((a, b) => b.votes - a.votes);
        ES.hemicycle(hcBox, sorted, { total: 100, majority: 51, centerLabel: sorted[0].short, subtitle: `${sorted[0].name}: ${fmt(sorted[0].votes, 2)}%` });
        barBox.innerHTML = '';
        barBox.appendChild(ui.seatBar(sorted, 100, 50, { label: '50% + 1 required to avoid a second-round runoff', unit: '%' }));
        coalBox.innerHTML = '';
        tblBox.innerHTML = '';
        tblBox.appendChild(ui.resultsTable(sorted, {
          nameLabel: 'Candidate',
          columns: [{ key: 'votes', label: 'Vote Share %', fmt: (v) => `<b>${fmt(v, 2)}%</b>` }],
        }));
      }
    }

    function rebuild() { root.innerHTML = ''; render(root); }
    update();
  }

  ES.register({
    id: 'russia',
    name: 'Russia',
    flag: '🇷🇺',
    title: 'Russia – 2000 Presidential, 2003 State Duma & 2013 Moscow Mayoral',
    subtitle: '2000 Presidential · 2003 State Duma (450 Seats) · 2013 Moscow Mayoral Election',
    render,
  });
})();
