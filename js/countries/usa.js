/* =========================================================================
   USA – Complete Multi-Election Sandbox (Presidential EC, Primaries,
   2026 Senate & House Midterms, 2025 NYC Mayor, 15 Politicians + House of Cards)
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, normalize } = ES.util;
  const ui = ES.ui;

  const DEM = '#2e6fd8', GOP = '#d8343b', IND = '#f59e0b', TOSS = '#8a8f99';
  const COLORS = { D: DEM, R: GOP, I: IND, T: TOSS };

  const CANDIDATES = {
    D: [
      { id: 'newsom', name: 'Gavin Newsom', home: 'California', tag: 'Gov. of California' },
      { id: 'harris', name: 'Kamala Harris', home: 'California', tag: 'Former Vice President' },
      { id: 'biden', name: 'Joe Biden', home: 'Delaware', tag: '46th U.S. President' },
      { id: 'barack_obama', name: 'Barack Obama', home: 'Illinois', tag: '44th U.S. President' },
      { id: 'michelle_obama', name: 'Michelle Obama', home: 'Illinois', tag: 'Former First Lady' },
      { id: 'clinton', name: 'Hillary Clinton', home: 'New York', tag: 'Former Sec. of State' },
      { id: 'sanders', name: 'Bernie Sanders', home: 'Vermont', tag: 'U.S. Senator (VT)' },
      { id: 'buttigieg', name: 'Pete Buttigieg', home: 'Michigan', tag: 'Former Sec. of Transportation' },
      { id: 'aoc', name: 'Alexandria Ocasio-Cortez', home: 'New York', tag: 'U.S. Representative (NY-14)' },
      { id: 'frank_underwood', name: '🃏 Frank Underwood', home: 'South Carolina', tag: '46th President (House of Cards)' },
      { id: 'claire_underwood', name: '🃏 Claire Underwood', home: 'Texas', tag: '47th President (House of Cards)' },
      { id: 'heather_dunbar', name: '🃏 Heather Dunbar', home: 'District of Columbia', tag: 'Solicitor General (House of Cards)' },
      { id: 'jackie_sharp', name: '🃏 Jackie Sharp', home: 'California', tag: 'House Deputy Whip (House of Cards)' },
      { id: 'catherine_durant', name: '🃏 Catherine Durant', home: 'Louisiana', tag: 'Sec. of State (House of Cards)' },
    ],
    R: [
      { id: 'trump', name: 'Donald Trump', home: 'Florida', tag: '45th & 47th U.S. President' },
      { id: 'vance', name: 'J.D. Vance', home: 'Ohio', tag: 'Vice President of the U.S.' },
      { id: 'rubio', name: 'Marco Rubio', home: 'Florida', tag: 'Secretary of State' },
      { id: 'desantis', name: 'Ron DeSantis', home: 'Florida', tag: 'Gov. of Florida' },
      { id: 'romney', name: 'Mitt Romney', home: 'Utah', tag: '2012 Nominee / Former Sen.' },
      { id: 'cruz', name: 'Ted Cruz', home: 'Texas', tag: 'U.S. Senator (TX)' },
      { id: 'ryan', name: 'Paul Ryan', home: 'Wisconsin', tag: '54th Speaker of the House' },
      { id: 'ramaswamy', name: 'Vivek Ramaswamy', home: 'Ohio', tag: 'Entrepreneur / 2024 Candidate' },
      { id: 'abbott', name: 'Greg Abbott', home: 'Texas', tag: 'Gov. of Texas' },
      { id: 'carlson', name: 'Tucker Carlson', home: 'Maine', tag: 'Political Commentator' },
      { id: 'will_conway', name: '🃏 Will Conway', home: 'New York', tag: 'Gov. of New York (House of Cards)' },
    ],
  };

  const STATES = {
    '01': ['AL', 'Alabama', 9], '02': ['AK', 'Alaska', 3], '04': ['AZ', 'Arizona', 11], '05': ['AR', 'Arkansas', 6],
    '06': ['CA', 'California', 54], '08': ['CO', 'Colorado', 10], '09': ['CT', 'Connecticut', 7], '10': ['DE', 'Delaware', 3],
    '11': ['DC', 'District of Columbia', 3], '12': ['FL', 'Florida', 30], '13': ['GA', 'Georgia', 16], '15': ['HI', 'Hawaii', 4],
    '16': ['ID', 'Idaho', 4], '17': ['IL', 'Illinois', 19], '18': ['IN', 'Indiana', 11], '19': ['IA', 'Iowa', 6],
    '20': ['KS', 'Kansas', 6], '21': ['KY', 'Kentucky', 8], '22': ['LA', 'Louisiana', 8], '23': ['ME', 'Maine (at-large)', 2],
    '24': ['MD', 'Maryland', 10], '25': ['MA', 'Massachusetts', 11], '26': ['MI', 'Michigan', 15], '27': ['MN', 'Minnesota', 10],
    '28': ['MS', 'Mississippi', 6], '29': ['MO', 'Missouri', 10], '30': ['MT', 'Montana', 4], '31': ['NE', 'Nebraska (at-large)', 2],
    '32': ['NV', 'Nevada', 6], '33': ['NH', 'New Hampshire', 4], '34': ['NJ', 'New Jersey', 14], '35': ['NM', 'New Mexico', 5],
    '36': ['NY', 'New York', 28], '37': ['NC', 'North Carolina', 16], '38': ['ND', 'North Dakota', 3], '39': ['OH', 'Ohio', 17],
    '40': ['OK', 'Oklahoma', 7], '41': ['OR', 'Oregon', 8], '42': ['PA', 'Pennsylvania', 19], '44': ['RI', 'Rhode Island', 4],
    '45': ['SC', 'South Carolina', 9], '46': ['SD', 'South Dakota', 3], '47': ['TN', 'Tennessee', 11], '48': ['TX', 'Texas', 40],
    '49': ['UT', 'Utah', 6], '50': ['VT', 'Vermont', 3], '51': ['VA', 'Virginia', 13], '53': ['WA', 'Washington', 12],
    '54': ['WV', 'West Virginia', 4], '55': ['WI', 'Wisconsin', 10], '56': ['WY', 'Wyoming', 3],
  };
  const DISTRICTS = [
    { id: 'ME1', name: "Maine's 1st district", ev: 1 }, { id: 'ME2', name: "Maine's 2nd district", ev: 1 },
    { id: 'NE1', name: "Nebraska's 1st district", ev: 1 }, { id: 'NE2', name: "Nebraska's 2nd district", ev: 1 }, { id: 'NE3', name: "Nebraska's 3rd district", ev: 1 },
  ];
  const SMALL = ['VT', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'DC'];
  const UNITS = {};
  Object.values(STATES).forEach(([p, n, ev]) => (UNITS[p] = { id: p, name: n, ev }));
  DISTRICTS.forEach((d) => (UNITS[d.id] = d));

  const DEM_2024 = ['CA', 'CO', 'CT', 'DE', 'DC', 'HI', 'IL', 'ME', 'ME1', 'MD', 'MA', 'MN', 'NH', 'NJ', 'NM', 'NY', 'OR', 'RI', 'VT', 'VA', 'WA', 'NE2'];
  const DEM_2020 = DEM_2024.concat(['AZ', 'GA', 'MI', 'NV', 'PA', 'WI']);
  const SWING = ['AZ', 'GA', 'MI', 'NV', 'NC', 'PA', 'WI', 'NE2', 'ME2', 'MN', 'NH', 'VA'];

  const NYC_GENERAL = [
    { id: 'MAMDANI', short: 'Mamdani (D)', name: 'Zohran Mamdani (Democratic / WFP)', leader: 'Zohran Mamdani', color: '#2e6fd8', base: 50.8 },
    { id: 'CUOMO', short: 'Cuomo (Ind)', name: 'Andrew Cuomo (Fight and Deliver / Ind)', leader: 'Andrew Cuomo', color: '#f97316', base: 41.3 },
    { id: 'SLIWA', short: 'Sliwa (R)', name: 'Curtis Sliwa (Republican)', leader: 'Curtis Sliwa', color: '#d8343b', base: 7.0 },
    { id: 'ADAMS', short: 'Adams (Ind)', name: 'Eric Adams (Independent)', leader: 'Eric Adams', color: '#64748b', base: 0.9 },
  ];

  const DEM_PRIMARY = [
    { id: 'newsom', short: 'Newsom', name: 'Gavin Newsom', leader: 'Gavin Newsom', color: '#2563eb', base: 24.0 },
    { id: 'harris', short: 'Harris', name: 'Kamala Harris', leader: 'Kamala Harris', color: '#4f46e5', base: 22.0 },
    { id: 'buttigieg', short: 'Buttigieg', name: 'Pete Buttigieg', leader: 'Pete Buttigieg', color: '#0284c7', base: 14.0 },
    { id: 'aoc', short: 'AOC', name: 'Alexandria Ocasio-Cortez', leader: 'Alexandria Ocasio-Cortez', color: '#db2777', base: 13.0 },
    { id: 'sanders', short: 'Sanders', name: 'Bernie Sanders', leader: 'Bernie Sanders', color: '#16a34a', base: 10.0 },
    { id: 'michelle_obama', short: 'M. Obama', name: 'Michelle Obama', leader: 'Michelle Obama', color: '#7c3aed', base: 9.0 },
    { id: 'frank_underwood', short: 'Underwood', name: '🃏 Frank Underwood', leader: 'Frank Underwood', color: '#1e293b', base: 8.0 },
  ];

  const GOP_PRIMARY = [
    { id: 'trump', short: 'Trump', name: 'Donald Trump', leader: 'Donald Trump', color: '#dc2626', base: 34.0 },
    { id: 'vance', short: 'Vance', name: 'J.D. Vance', leader: 'J.D. Vance', color: '#b91c1c', base: 24.0 },
    { id: 'desantis', short: 'DeSantis', name: 'Ron DeSantis', leader: 'Ron DeSantis', color: '#ea580c', base: 12.0 },
    { id: 'ramaswamy', short: 'Ramaswamy', name: 'Vivek Ramaswamy', leader: 'Vivek Ramaswamy', color: '#d97706', base: 8.0 },
    { id: 'cruz', short: 'Cruz', name: 'Ted Cruz', leader: 'Ted Cruz', color: '#991b1b', base: 6.0 },
    { id: 'abbott', short: 'Abbott', name: 'Greg Abbott', leader: 'Greg Abbott', color: '#7f1d1d', base: 5.0 },
    { id: 'carlson', short: 'Carlson', name: 'Tucker Carlson', leader: 'Tucker Carlson', color: '#ca8a04', base: 5.0 },
    { id: 'romney', short: 'Romney', name: 'Mitt Romney', leader: 'Mitt Romney', color: '#0284c7', base: 3.0 },
    { id: 'will_conway', short: 'Conway', name: '🃏 Will Conway', leader: 'Will Conway', color: '#475569', base: 3.0 },
  ];

  function preset(name) {
    const s = {};
    Object.keys(UNITS).forEach((k) => {
      if (name === 'blank') s[k] = 'T';
      else if (name === '2020') s[k] = DEM_2020.includes(k) ? 'D' : 'R';
      else if (name === 'hoc_2016') s[k] = ['SC', 'NC', 'GA', 'VA', 'PA', 'MI', 'WI', 'CA', 'IL', 'MA', 'MD', 'DE', 'DC', 'CT', 'RI', 'VT', 'NH', 'ME', 'ME1', 'MN', 'WA', 'OR', 'HI', 'NM', 'CO', 'NV'].includes(k) ? 'D' : 'R';
      else s[k] = DEM_2024.includes(k) ? 'D' : 'R';
      if (name === 'swing' && SWING.includes(k)) s[k] = 'T';
    });
    return s;
  }

  let state = null;
  function initState() {
    const nyc = {}, demP = {}, gopP = {};
    NYC_GENERAL.forEach((c) => (nyc[c.id] = c.base));
    DEM_PRIMARY.forEach((c) => (demP[c.id] = c.base));
    GOP_PRIMARY.forEach((c) => (gopP[c.id] = c.base));
    state = {
      mode: 'pres',
      map: preset('2024'),
      brush: 'cycle',
      D: { p: 'newsom', vp: 'harris' },
      R: { p: 'vance', vp: 'rubio' },
      nyc, demP, gopP,
      midtermVote: { D: 48.8, R: 47.2, I: 4.0 },
      nycOverrides: {},
    };
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    const modeCard = ui.card('United States Election Mode');
    L.left.appendChild(modeCard.card);
    modeCard.body.appendChild(ui.segmented([
      { value: 'pres', label: '🇺🇸 Presidential EC' },
      { value: 'prim_dem', label: '🫏 Dem Primary' },
      { value: 'prim_gop', label: '🐘 GOP Primary' },
      { value: 'mid2026_senate', label: '🏛️ 2026 Senate' },
      { value: 'mid2026_house', label: '🏛️ 2026 House' },
      { value: 'nyc2025', label: '🗽 2025 NYC Mayor' },
    ], state.mode, (v) => { state.mode = v; rebuild(); }));

    if (state.mode === 'nyc2025') { renderNYC(L); return; }
    if (state.mode === 'prim_dem' || state.mode === 'prim_gop') { renderPrimary(L, state.mode === 'prim_dem' ? 'D' : 'R'); return; }
    if (state.mode === 'mid2026_senate' || state.mode === 'mid2026_house') { renderMidterm(L, state.mode === 'mid2026_senate' ? 'senate' : 'house'); return; }

    const tk = ui.card('Presidential & Vice-Presidential Tickets (Real + House of Cards Roster)');
    L.left.appendChild(tk.card);
    function ticketRow(party) {
      const list = CANDIDATES[party];
      const opts = list.map((c) => ({ value: c.id, label: `${c.name} (${c.home})` }));
      const selP = list.find((c) => c.id === state[party].p) || list[0];
      const wrap = el('div', { class: 'ticket', style: { borderLeft: `4px solid ${COLORS[party]}`, paddingLeft: '10px', marginBottom: '12px' } });
      wrap.appendChild(el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' } }, [
        el('img', { class: 'leader-avatar-sm', src: ES.leaderImg(selP.name), alt: selP.name, style: { '--c': COLORS[party] } }),
        ES.partyLogo({ id: party, short: party === 'D' ? 'DEM' : 'GOP', color: COLORS[party], name: party === 'D' ? 'Democratic Party' : 'Republican Party' }, { size: 'sm' }),
        el('div', { class: 'pname', style: { fontWeight: '700', color: COLORS[party] }, text: `${party === 'D' ? 'Democratic' : 'Republican'} · ${selP.tag}` }),
      ]));
      const pSel = ui.select(opts, state[party].p, (v) => {
        state[party].p = v;
        if (state[party].vp === v) state[party].vp = list.find((c) => c.id !== v).id;
        rebuild();
      });
      const vpOpts = [{ value: '', label: '— other / TBD —' }].concat(opts.filter((o) => o.value !== state[party].p));
      const vSel = ui.select(vpOpts, state[party].vp, (v) => { state[party].vp = v; rebuild(); });
      wrap.appendChild(el('div', { class: 'row', style: { marginTop: '6px' } }, [
        el('span', { class: 'muted small', text: 'President:' }), pSel,
        el('span', { class: 'muted small', text: 'VP:' }), vSel,
      ]));
      return wrap;
    }
    tk.body.appendChild(ticketRow('D'));
    tk.body.appendChild(ticketRow('R'));

    const tot = ui.card('Electoral College (538 Electors · 270 to Win)');
    L.left.appendChild(tot.card);
    const totBody = el('div');
    tot.body.appendChild(totBody);

    const pr = ui.card('Starting Maps & Scenarios');
    L.left.appendChild(pr.card);
    pr.body.appendChild(el('div', { class: 'row', style: { gap: '6px' } }, [
      el('button', { class: 'btn', text: '2024 Result (Trump 312)', onclick: () => { state.map = preset('2024'); update(); } }),
      el('button', { class: 'btn', text: '2020 Result (Biden 306)', onclick: () => { state.map = preset('2020'); update(); } }),
      el('button', { class: 'btn btn-gold', text: '🃏 House of Cards (Underwood vs Conway)', onclick: () => { state.D.p = 'frank_underwood'; state.D.vp = 'claire_underwood'; state.R.p = 'will_conway'; state.R.vp = 'ryan'; state.map = preset('hoc_2016'); rebuild(); } }),
      el('button', { class: 'btn', text: 'Swing States Open', onclick: () => { state.map = preset('swing'); update(); } }),
      el('button', { class: 'btn', text: 'All Toss-up', onclick: () => { state.map = preset('blank'); update(); } }),
    ]));

    const mp = ui.card('Map – Click States to Flip Them');
    L.right.appendChild(mp.card);
    const toolbar = el('div', { class: 'map-toolbar' });
    [
      { v: 'cycle', label: 'Click to cycle D → R → toss-up', c: '#fff' },
      { v: 'D', label: 'Paint Democratic', c: DEM },
      { v: 'R', label: 'Paint Republican', c: GOP },
      { v: 'T', label: 'Paint Toss-up', c: TOSS },
    ].forEach((b) => {
      const chip = el('button', { class: 'paint-chip' + (state.brush === b.v ? ' active' : ''), style: { '--c': b.c } }, [b.v !== 'cycle' ? el('span', { class: 'swatch', style: { background: b.c } }) : null, b.label]);
      chip.addEventListener('click', () => { state.brush = b.v; toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active')); chip.classList.add('active'); });
      toolbar.appendChild(chip);
    });
    mp.body.appendChild(toolbar);
    const mapWrap = el('div', { class: 'map-wrap' });
    mp.body.appendChild(mapWrap);

    const hc = ui.card('Electoral Votes Hemicycle');
    L.right.appendChild(hc.card);
    const hcBox = el('div');
    hc.body.appendChild(hcBox);

    const tip = ui.tooltip();
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', '0 0 1060 620');
    const geo = topojson.feature(GEO_US, GEO_US.objects.states);
    const path = d3.geoPath();

    function click(id) {
      const cur = state.map[id];
      state.map[id] = state.brush === 'cycle' ? (cur === 'D' ? 'R' : cur === 'R' ? 'T' : 'D') : state.brush;
      update();
    }
    function hover(e, id) {
      const u = UNITS[id];
      const w = state.map[id];
      tip.show(e, `<b>${u.name}</b><br>${u.ev} electoral vote${u.ev > 1 ? 's' : ''}<br><span style="color:${COLORS[w]}">${w === 'D' ? 'Democratic' : w === 'R' ? 'Republican' : 'Toss-up'}</span>`);
    }
    const bind = (sel, idFn) => sel.on('click', (e, d) => click(idFn(d))).on('mouseenter', (e, d) => hover(e, idFn(d))).on('mousemove', (e) => tip.move(e)).on('mouseleave', () => tip.hide());

    const statePaths = svg.append('g').selectAll('path').data(geo.features.filter((f) => STATES[f.id])).join('path').attr('class', 'unit').attr('d', path);
    bind(statePaths, (d) => STATES[d.id][0]);
    svg.append('g').selectAll('text').data(geo.features.filter((f) => STATES[f.id] && !SMALL.includes(STATES[f.id][0]))).join('text')
      .attr('transform', (d) => {
        const c = path.centroid(d);
        const adj = { FL: [12, 0], LA: [-8, 0], MI: [10, 18], ID: [0, 15], CA: [-6, 0], KY: [6, 2] }[STATES[d.id][0]] || [0, 0];
        return `translate(${c[0] + adj[0]},${c[1] + adj[1]})`;
      })
      .text((d) => STATES[d.id][0] + ' ' + STATES[d.id][2]);

    const boxes = SMALL.map((p) => UNITS[p]).concat(DISTRICTS);
    const bx = 985, by0 = 150, bh = 24;
    const boxG = svg.append('g').selectAll('g').data(boxes).join('g').attr('transform', (d, i) => `translate(${bx},${by0 + i * (bh + 4)})`);
    const boxRects = boxG.append('rect').attr('class', 'unit').attr('width', 66).attr('height', bh).attr('rx', 4);
    bind(boxRects, (d) => d.id);
    boxG.append('text').attr('x', 33).attr('y', bh / 2 + 1).text((d) => `${d.id} ${d.ev}`);

    function totals() {
      const t = { D: 0, R: 0, T: 0 };
      for (const k in UNITS) t[state.map[k]] += UNITS[k].ev;
      return t;
    }
    const cand = (party, id) => CANDIDATES[party].find((c) => c.id === id) || CANDIDATES[party][0];

    function update() {
      statePaths.attr('fill', (d) => COLORS[state.map[STATES[d.id][0]]]);
      boxRects.attr('fill', (d) => COLORS[state.map[d.id]]);
      const t = totals();
      const dName = cand('D', state.D.p).name, rName = cand('R', state.R.p).name;
      const dVp = state.D.vp ? cand('D', state.D.vp).name : 'TBD', rVp = state.R.vp ? cand('R', state.R.vp).name : 'TBD';
      const winner = t.D >= 270 ? 'D' : t.R >= 270 ? 'R' : null;
      totBody.innerHTML = '';
      const cards = el('div', { class: 'cands' });
      [['D', dName, dVp, 'Democratic'], ['R', rName, rVp, 'Republican']].forEach(([p, n, vp, pn]) => {
        cards.appendChild(el('div', { class: 'cand' + (winner === p ? ' win' : ''), style: { '--c': COLORS[p] } }, [
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' } }, [
            el('img', { class: 'leader-avatar-sm', src: ES.leaderImg(n), alt: n, style: { '--c': COLORS[p] } }),
            ES.partyLogo({ id: p, short: p === 'D' ? 'DEM' : 'GOP', color: COLORS[p], name: pn }, { size: 'sm' }),
            el('div', { class: 'cname', text: n }),
          ]),
          el('div', { class: 'cparty', text: `${pn} · VP: ${vp}` }),
          el('div', { class: 'cval', style: { color: COLORS[p] }, text: t[p] }),
          winner === p ? el('span', { class: 'badge', text: 'WINS PRESIDENCY' }) : null,
        ]));
      });
      totBody.appendChild(cards);
      totBody.appendChild(ui.seatBar([{ name: dName, color: DEM, seats: t.D }, { name: 'Toss-up', color: TOSS, seats: t.T }, { name: rName, color: GOP, seats: t.R }], 538, 270, { label: '270 electoral votes to win', unit: 'EV' }));
      ES.hemicycle(hcBox, [
        { id: 'D', name: `${dName} (Democratic)`, leader: dName, color: DEM, seats: t.D },
        { id: 'T', name: 'Toss-up', color: TOSS, seats: t.T },
        { id: 'R', name: `${rName} (Republican)`, leader: rName, color: GOP, seats: t.R },
      ], { total: 538, majority: 270, subtitle: '270 to win', centerLabel: winner ? (winner === 'D' ? 'DEM' : 'GOP') : '538' });
    }
    update();

    function renderPrimary(L, party) {
      const isDem = party === 'D';
      const list = isDem ? DEM_PRIMARY : GOP_PRIMARY;
      const vals = isDem ? state.demP : state.gopP;
      const totalDel = isDem ? 3934 : 2429;
      const majDel = Math.floor(totalDel / 2) + 1;

      const slCard = ui.card(isDem ? 'Democratic Presidential Primary Vote (%)' : 'Republican Presidential Primary Vote (%)');
      L.left.appendChild(slCard.card);
      const sl = ui.sliders(list, vals, { max: 65, step: 0.5, onChange: () => updPrim() });
      slCard.body.appendChild(sl.el);

      const hcCard = ui.card(`${isDem ? 'Democratic' : 'Republican'} National Convention Delegates (${totalDel} Total · ${majDel} to Win Nomination)`);
      L.right.appendChild(hcCard.card);
      const hcDiv = el('div'), barDiv = el('div'), tblDiv = el('div', { style: { marginTop: '12px' } });
      hcCard.body.appendChild(hcDiv);
      hcCard.body.appendChild(barDiv);
      hcCard.body.appendChild(tblDiv);

      function updPrim() {
        const norm = normalize(vals, 100);
        const qual = {};
        list.forEach((c) => {
          if ((norm[c.id] || 0) >= (isDem ? 10.0 : 5.0)) qual[c.id] = Math.pow(norm[c.id], isDem ? 1.1 : 1.35);
        });
        const delAlloc = ES.methods.largestRemainder(qual, totalDel, 'hare');
        const rows = list.map((c) => ({ ...c, votes: norm[c.id] || 0, seats: delAlloc[c.id] || 0 })).sort((a, b) => b.seats - a.seats);
        ES.hemicycle(hcDiv, rows, { total: totalDel, majority: majDel, centerLabel: rows[0].seats >= majDel ? rows[0].short : 'Brokered', subtitle: `${majDel} delegates needed for 1st-ballot nomination` });
        barDiv.innerHTML = '';
        barDiv.appendChild(ui.seatBar(rows, totalDel, majDel, { label: `${majDel} pledged delegates required to clinch nomination`, unit: 'delegates' }));
        tblDiv.innerHTML = '';
        tblDiv.appendChild(ui.resultsTable(rows, {
          nameLabel: 'Primary Candidate',
          columns: [
            { key: 'votes', label: 'Primary Vote %', fmt: (v) => fmt(v, 1) + '%' },
            { key: 'seats', label: 'Pledged Delegates', fmt: (v) => `<b>${v}</b>` },
          ],
        }));
      }
      updPrim();
    }

    function renderMidterm(L, chamber) {
      const isSen = chamber === 'senate';
      const totalS = isSen ? 100 : 435;
      const majS = isSen ? 51 : 218;
      const midParties = [
        { id: 'D', short: 'DEM', name: 'Democratic Party', leader: isSen ? 'Chuck Schumer' : 'Hakeem Jeffries', color: DEM },
        { id: 'R', short: 'GOP', name: 'Republican Party', leader: isSen ? 'John Thune' : 'Mike Johnson', color: GOP },
        { id: 'I', short: 'IND', name: 'Independents / Third Party', leader: 'Bernie Sanders', color: IND },
      ];

      const slCard = ui.card(`2026 ${isSen ? 'U.S. Senate' : 'U.S. House'} Generic Ballot (%)`);
      L.left.appendChild(slCard.card);
      const sl = ui.sliders(midParties, state.midtermVote, { max: 65, step: 0.1, onChange: () => updMid() });
      slCard.body.appendChild(sl.el);

      const hcCard = ui.card(isSen ? '120th United States Senate – 2026 Midterm (100 Senators · 51 Majority)' : '120th U.S. House of Representatives – 2026 Midterm (435 Seats · 218 Majority)');
      L.right.appendChild(hcCard.card);
      const hcDiv = el('div'), barDiv = el('div'), tblDiv = el('div', { style: { marginTop: '12px' } });
      hcCard.body.appendChild(hcDiv);
      hcCard.body.appendChild(barDiv);
      hcCard.body.appendChild(tblDiv);

      function updMid() {
        const norm = normalize(state.midtermVote, 100);
        const marginD = (norm.D || 0) - (norm.R || 0);
        let dSeats, rSeats, iSeats;
        if (isSen) {
          iSeats = 2;
          dSeats = Math.max(38, Math.min(60, Math.round(46 + marginD * 0.75)));
          rSeats = 100 - dSeats - iSeats;
        } else {
          iSeats = 0;
          dSeats = Math.max(165, Math.min(275, Math.round(215 + marginD * 4.2)));
          rSeats = 435 - dSeats;
        }
        const rows = [
          { ...midParties[0], votes: norm.D, seats: dSeats },
          { ...midParties[2], votes: norm.I, seats: iSeats },
          { ...midParties[1], votes: norm.R, seats: rSeats },
        ];
        ES.hemicycle(hcDiv, rows, { total: totalS, majority: majS, centerLabel: (dSeats + iSeats) >= majS ? 'DEM Control' : 'GOP Control', subtitle: `Majority: ${majS}` });
        barDiv.innerHTML = '';
        barDiv.appendChild(ui.seatBar(rows, totalS, majS, { label: `${majS} seats required for chamber control`, unit: 'seats' }));
        tblDiv.innerHTML = '';
        tblDiv.appendChild(ui.resultsTable(rows, {
          nameLabel: 'Caucus & Leader',
          columns: [
            { key: 'votes', label: 'National Ballot %', fmt: (v) => fmt(v, 1) + '%' },
            { key: 'seats', label: isSen ? 'Senators (100)' : 'Representatives (435)', fmt: (v) => `<b>${v}</b>` },
          ],
        }));
      }
      updMid();
    }

    function renderNYC(L) {
      const slCard = ui.card('2025 New York City Mayoral Election (Nov 4, 2025)');
      L.left.appendChild(slCard.card);
      const sl = ui.sliders(NYC_GENERAL, state.nyc, { max: 75, step: 0.1, onChange: () => updNYC() });
      slCard.body.appendChild(sl.el);

      const mapCard = ui.card('New York City 5 Boroughs Map (Click Borough to Flip Winner)');
      L.right.appendChild(mapCard.card);
      const mapWrap = el('div', { class: 'map-wrap' });
      mapCard.body.appendChild(mapWrap);

      const hcCard = ui.card('2025 NYC Citywide Vote Share & Borough Breakdown');
      L.right.appendChild(hcCard.card);
      const hcDiv = el('div'), tblDiv = el('div', { style: { marginTop: '12px' } });
      hcCard.body.appendChild(hcDiv);
      hcCard.body.appendChild(tblDiv);

      const tip = ui.tooltip();
      const svg = d3.select(mapWrap).append('svg').attr('viewBox', '0 0 460 360');
      const proj = d3.geoMercator().fitExtent([[18, 18], [442, 342]], window.GEO_NYC);
      const path = d3.geoPath(proj);

      const bPaths = svg.append('g').selectAll('path').data(window.GEO_NYC.features).join('path')
        .attr('class', 'unit').attr('d', path)
        .on('click', (e, d) => {
          const bid = d.properties.id;
          const ids = NYC_GENERAL.map((x) => x.id);
          const cur = state.nycOverrides[bid] || ids[0];
          state.nycOverrides[bid] = ids[(ids.indexOf(cur) + 1) % ids.length];
          updNYC();
        })
        .on('mouseenter', (e, d) => tip.show(e, `<b>${d.properties.name}</b><br>Click to flip borough winner`))
        .on('mousemove', (e) => tip.move(e))
        .on('mouseleave', () => tip.hide());

      svg.append('g').selectAll('text').data(window.GEO_NYC.features).join('text')
        .attr('transform', (d) => `translate(${path.centroid(d)})`)
        .text((d) => d.properties.code);

      function updNYC() {
        const norm = normalize(state.nyc, 100);
        bPaths.attr('fill', (d) => {
          const bid = d.properties.id;
          if (state.nycOverrides[bid]) return NYC_GENERAL.find((c) => c.id === state.nycOverrides[bid]).color;
          if (bid === 'NYC-STI' && norm.SLIWA > 5.0) return '#f97316';
          return NYC_GENERAL.slice().sort((a, b) => (norm[b.id] || 0) - (norm[a.id] || 0))[0].color;
        });
        const sorted = NYC_GENERAL.map((c) => ({ ...c, votes: norm[c.id] || 0, seats: Math.round(norm[c.id] || 0) })).sort((a, b) => b.votes - a.votes);
        ES.hemicycle(hcDiv, sorted, { total: 100, majority: 51, centerLabel: sorted[0].short, subtitle: `Mayor-Elect: ${sorted[0].name} (${fmt(sorted[0].votes, 1)}%)` });
        tblDiv.innerHTML = '';
        tblDiv.appendChild(ui.resultsTable(sorted, {
          nameLabel: 'NYC Mayoral Candidate',
          columns: [{ key: 'votes', label: 'Citywide Vote %', fmt: (v) => `<b>${fmt(v, 2)}%</b>` }],
        }));
      }
      updNYC();
    }

    function rebuild() { root.innerHTML = ''; render(root); }
  }

  ES.register({
    id: 'usa',
    name: 'USA',
    flag: '🇺🇸',
    title: 'United States – Presidential, Primaries, 2026 Midterms & 2025 NYC Mayor',
    subtitle: 'Electoral College (538) · Dem & GOP Primaries · 2026 Senate & House Midterms · 2025 NYC Mayoral',
    render,
  });
})();
