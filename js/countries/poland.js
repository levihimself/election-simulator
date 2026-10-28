/* =========================================================================
   Poland – 2023 Parliamentary Election (Sejm 460 Seats) & 2025 Presidential Election
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, normalize } = ES.util;
  const ui = ES.ui;

  const SEJM_PARLIAMENT = [
    { id: 'LEWICA', short: 'Lewica', name: 'New Left (Nowa Lewica & Razem)', leader: 'Włodzimierz Czarzasty', color: '#be123c', threshold: 5.0, base23: 8.61 },
    { id: 'KO', short: 'KO', name: 'Civic Coalition (Koalicja Obywatelska)', leader: 'Donald Tusk', color: '#f97316', threshold: 8.0, base23: 30.70 },
    { id: 'TD', short: 'Trzecia Droga', name: 'Third Way (Polska 2050 – PSL)', leader: 'Szymon Hołownia', color: '#16a34a', threshold: 8.0, base23: 14.40 },
    { id: 'PIS', short: 'PiS', name: 'Law and Justice (Prawo i Sprawiedliwość)', leader: 'Jarosław Kaczyński', color: '#1e3a8a', threshold: 5.0, base23: 35.38 },
    { id: 'KONF', short: 'Konfederacja', name: 'Confederation Liberty and Independence', leader: 'Sławomir Mentzen', color: '#1e293b', threshold: 5.0, base23: 7.16 },
  ];

  const PRES_R1 = [
    { id: 'TRZASKOWSKI', short: 'Trzaskowski', name: 'Rafał Trzaskowski (Civic Coalition)', leader: 'Rafał Trzaskowski', color: '#f97316', base: 31.36 },
    { id: 'NAWROCKI', short: 'Nawrocki', name: 'Karol Nawrocki (PiS-backed)', leader: 'Karol Nawrocki', color: '#1e3a8a', base: 29.54 },
    { id: 'MENTZEN', short: 'Mentzen', name: 'Sławomir Mentzen (Konfederacja)', leader: 'Sławomir Mentzen', color: '#1e293b', base: 14.81 },
    { id: 'BRAUN', short: 'Braun', name: 'Grzegorz Braun (KKP)', leader: 'Grzegorz Braun', color: '#78350f', base: 6.34 },
    { id: 'HOLOWNIA', short: 'Hołownia', name: 'Szymon Hołownia (Trzecia Droga)', leader: 'Szymon Hołownia', color: '#16a34a', base: 4.99 },
    { id: 'ZANDBERG', short: 'Zandberg', name: 'Adrian Zandberg (Razem)', leader: 'Adrian Zandberg', color: '#9f1239', base: 4.86 },
    { id: 'BIEJAT', short: 'Biejat', name: 'Magdalena Biejat (Nowa Lewica)', leader: 'Magdalena Biejat', color: '#e11d48', base: 4.23 },
  ];

  const PRES_R2 = [
    { id: 'NAWROCKI', short: 'Nawrocki', name: 'Karol Nawrocki (PiS-backed)', leader: 'Karol Nawrocki', color: '#1e3a8a', base: 50.89 },
    { id: 'TRZASKOWSKI', short: 'Trzaskowski', name: 'Rafał Trzaskowski (Civic Coalition)', leader: 'Rafał Trzaskowski', color: '#f97316', base: 49.11 },
  ];

  const VOIVODESHIPS = [
    { id: 'PL-MZ', code: 'MAZ', name: 'Mazowieckie (Warsaw)', seats: 63, leanKO: 1.08, leanPiS: 0.94 },
    { id: 'PL-SL', code: 'SLK', name: 'Śląskie (Katowice)', seats: 55, leanKO: 1.05, leanPiS: 0.96 },
    { id: 'PL-WP', code: 'WKP', name: 'Wielkopolskie (Poznań)', seats: 40, leanKO: 1.15, leanPiS: 0.82 },
    { id: 'PL-MP', code: 'MLP', name: 'Małopolskie (Kraków)', seats: 41, leanKO: 0.84, leanPiS: 1.18 },
    { id: 'PL-DS', code: 'DLS', name: 'Dolnośląskie (Wrocław)', seats: 34, leanKO: 1.18, leanPiS: 0.84 },
    { id: 'PL-LD', code: 'LDZ', name: 'Łódzkie (Łódź)', seats: 31, leanKO: 0.96, leanPiS: 1.06 },
    { id: 'PL-PM', code: 'POM', name: 'Pomorskie (Gdańsk)', seats: 26, leanKO: 1.28, leanPiS: 0.74 },
    { id: 'PL-LU', code: 'LUB', name: 'Lubelskie (Lublin)', seats: 27, leanKO: 0.66, leanPiS: 1.35 },
    { id: 'PL-PK', code: 'PKR', name: 'Podkarpackie (Rzeszów)', seats: 26, leanKO: 0.58, leanPiS: 1.44 },
    { id: 'PL-KP', code: 'KPM', name: 'Kujawsko-Pomorskie', seats: 25, leanKO: 1.12, leanPiS: 0.88 },
    { id: 'PL-ZP', code: 'ZPM', name: 'Zachodniopomorskie (Szczecin)', seats: 20, leanKO: 1.24, leanPiS: 0.78 },
    { id: 'PL-WM', code: 'WMA', name: 'Warmińsko-Mazurskie (Olsztyn)', seats: 18, leanKO: 1.10, leanPiS: 0.90 },
    { id: 'PL-SK', code: 'SWK', name: 'Świętokrzyskie (Kielce)', seats: 16, leanKO: 0.68, leanPiS: 1.34 },
    { id: 'PL-PD', code: 'PDL', name: 'Podlaskie (Białystok)', seats: 14, leanKO: 0.72, leanPiS: 1.26 },
    { id: 'PL-LB', code: 'LBU', name: 'Lubuskie (Zielona Góra)', seats: 12, leanKO: 1.24, leanPiS: 0.76 },
    { id: 'PL-OP', code: 'OPO', name: 'Opolskie (Opole)', seats: 12, leanKO: 1.14, leanPiS: 0.84 },
  ];

  let state = null;
  function initState() {
    const sejm = {}, r1 = {}, r2 = {};
    SEJM_PARLIAMENT.forEach((p) => (sejm[p.id] = p.base23));
    PRES_R1.forEach((p) => (r1[p.id] = p.base));
    PRES_R2.forEach((p) => (r2[p.id] = p.base));
    state = { mode: 'sejm2023', sejm, r1, r2, overrides: {} };
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    const modeCard = ui.card('Polish Election Mode & Scenarios');
    L.left.appendChild(modeCard.card);
    modeCard.body.appendChild(ui.segmented([
      { value: 'sejm2023', label: '🏛️ 2023 Parliamentary (Sejm 460)' },
      { value: 'pres2025_r1', label: '🗳️ 2025 Presidential (1st Round)' },
      { value: 'pres2025_r2', label: '🏆 2025 Presidential (Runoff)' },
    ], state.mode, (v) => { state.mode = v; state.overrides = {}; rebuild(); }));

    const slCard = ui.card(state.mode === 'sejm2023' ? '2023 Sejm National Vote Share (%)' : '2025 Presidential Candidate Vote Share (%)');
    L.left.appendChild(slCard.card);
    const activeList = state.mode === 'sejm2023' ? SEJM_PARLIAMENT : state.mode === 'pres2025_r1' ? PRES_R1 : PRES_R2;
    const activeVals = state.mode === 'sejm2023' ? state.sejm : state.mode === 'pres2025_r1' ? state.r1 : state.r2;

    const sliders = ui.sliders(activeList, activeVals, {
      max: state.mode === 'pres2025_r2' ? 75 : 50,
      step: 0.1,
      onChange: () => update(),
    });
    slCard.body.appendChild(sliders.el);

    const mapCard = ui.card('16 Polish Voivodeships (Województwa) – Click to Flip Winner');
    L.right.appendChild(mapCard.card);
    const mapWrap = el('div', { class: 'map-wrap' });
    mapCard.body.appendChild(mapWrap);

    const hcCard = ui.card(state.mode === 'sejm2023' ? 'Sejm of the Republic of Poland (460 Seats · Majority 231)' : '2025 Polish Presidential Election Breakdown');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div'), barBox = el('div'), coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('National Results');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    const tip = ui.tooltip();
    const W = 460, H = 410;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_PL);
    const path = d3.geoPath(proj);

    const voivPaths = svg.append('g').selectAll('path').data(window.GEO_PL.features).join('path')
      .attr('class', 'unit').attr('d', path)
      .on('click', (e, d) => {
        const vid = d.properties.id;
        const ids = activeList.map((x) => x.id);
        const cur = state.overrides[vid] || ids[0];
        state.overrides[vid] = ids[(ids.indexOf(cur) + 1) % ids.length];
        update();
      })
      .on('mouseenter', (e, d) => {
        const v = VOIVODESHIPS.find((x) => x.id === d.properties.id);
        tip.show(e, `<b>${v.name}</b> (${v.code})<br>${v.seats} Sejm Deputies · Click to cycle leading party/candidate`);
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g').selectAll('text').data(window.GEO_PL.features).join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => d.properties.code);

    function update() {
      const norm = normalize(activeVals, 100);
      const vWinners = {};
      VOIVODESHIPS.forEach((v) => {
        if (state.overrides[v.id]) {
          vWinners[v.id] = activeList.find((x) => x.id === state.overrides[v.id]) || activeList[0];
          return;
        }
        let best = activeList[0], max = -1;
        activeList.forEach((p) => {
          const mult = (p.id === 'KO' || p.id === 'TRZASKOWSKI' || p.id === 'LEWICA') ? v.leanKO : (p.id === 'PIS' || p.id === 'NAWROCKI') ? v.leanPiS : 1.0;
          const val = (norm[p.id] || 0) * mult;
          if (val > max) { max = val; best = p; }
        });
        vWinners[v.id] = best;
      });

      voivPaths.attr('fill', (d) => vWinners[d.properties.id].color);

      if (state.mode === 'sejm2023') {
        const seats = {};
        SEJM_PARLIAMENT.forEach((p) => (seats[p.id] = 0));
        VOIVODESHIPS.forEach((v) => {
          const localVotes = {};
          SEJM_PARLIAMENT.forEach((p) => {
            if ((norm[p.id] || 0) >= p.threshold) {
              const mult = (p.id === 'KO' || p.id === 'LEWICA') ? v.leanKO : p.id === 'PIS' ? v.leanPiS : 1.0;
              localVotes[p.id] = (norm[p.id] || 0) * mult;
            }
          });
          const alloc = ES.methods.dhondt(localVotes, v.seats);
          Object.entries(alloc).forEach(([pid, s]) => (seats[pid] = (seats[pid] || 0) + s));
        });

        const hcParties = SEJM_PARLIAMENT.map((p) => ({ ...p, seats: seats[p.id] || 0 }));
        ES.hemicycle(hcBox, hcParties, { total: 460, majority: 231, subtitle: 'Majority: 231 · KO + TD + Lewica (Tusk Coalition)' });
        barBox.innerHTML = '';
        barBox.appendChild(ui.seatBar(hcParties, 460, 231, { label: '231 Deputies required for a Sejm majority (460 total)', unit: 'seats' }));
        coalBox.innerHTML = '';
        coalBox.appendChild(ui.coalition(hcParties, 460, 231, { key: 'pl_460' }));

        tblBox.innerHTML = '';
        tblBox.appendChild(ui.resultsTable(hcParties.map((p) => ({ ...p, votes: norm[p.id] || 0 })).sort((a, b) => b.seats - a.seats), {
          nameLabel: 'Party / Coalition',
          columns: [
            { key: 'votes', label: 'Vote %', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'threshold', label: 'Threshold', fmt: (v) => v + '%' },
            { key: 'seats', label: 'Sejm Seats (460)', fmt: (v) => `<b>${v}</b>` },
          ],
        }));
      } else {
        const sorted = activeList.map((p) => ({ ...p, votes: norm[p.id] || 0, seats: Math.round(norm[p.id] || 0) })).sort((a, b) => b.votes - a.votes);
        ES.hemicycle(hcBox, sorted, { total: 100, majority: 51, centerLabel: sorted[0].short, subtitle: `${sorted[0].name}: ${fmt(sorted[0].votes, 2)}%` });
        barBox.innerHTML = '';
        barBox.appendChild(ui.seatBar(sorted, 100, 50, { label: '50% + 1 required for a presidential victory', unit: '%' }));
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
    id: 'poland',
    name: 'Poland',
    flag: '🇵🇱',
    title: 'Poland – 2023 Parliamentary & 2025 Presidential Elections',
    subtitle: 'Sejm (460 Seats · Majority 231) & 2025 Presidential Election (1st Round & Runoff)',
    render,
  });
})();
