/* =========================================================================
   USA – 2028 Presidential election (Electoral College, 2020-census apportionment)
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt } = ES.util;
  const ui = ES.ui;

  const DEM = '#2e6fd8', GOP = '#d8343b', TOSS = '#8a8f99';
  const COLORS = { D: DEM, R: GOP, T: TOSS };

  const CANDIDATES = {
    D: [{ id: 'newsom', name: 'Gavin Newsom', home: 'California' }, { id: 'harris', name: 'Kamala Harris', home: 'California' }],
    R: [{ id: 'vance', name: 'J.D. Vance', home: 'Ohio' }, { id: 'rubio', name: 'Marco Rubio', home: 'Florida' }],
  };

  // FIPS -> [postal, name, electoral votes (2024–2028)]
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
  // Congressional-district electors (Maine & Nebraska)
  const DISTRICTS = [
    { id: 'ME1', name: "Maine's 1st district", ev: 1 }, { id: 'ME2', name: "Maine's 2nd district", ev: 1 },
    { id: 'NE1', name: "Nebraska's 1st district", ev: 1 }, { id: 'NE2', name: "Nebraska's 2nd district", ev: 1 }, { id: 'NE3', name: "Nebraska's 3rd district", ev: 1 },
  ];
  const SMALL = ['VT', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'DC'];

  const UNITS = {}; // postal/district id -> {id,name,ev}
  Object.values(STATES).forEach(([p, n, ev]) => (UNITS[p] = { id: p, name: n, ev }));
  DISTRICTS.forEach((d) => (UNITS[d.id] = d));

  const DEM_2024 = ['CA', 'CO', 'CT', 'DE', 'DC', 'HI', 'IL', 'ME', 'ME1', 'MD', 'MA', 'MN', 'NH', 'NJ', 'NM', 'NY', 'OR', 'RI', 'VT', 'VA', 'WA', 'NE2'];
  const DEM_2020 = DEM_2024.concat(['AZ', 'GA', 'MI', 'NV', 'PA', 'WI']);
  // Swing states at the 2024 margin (<~6 pts) – used for "Toss-ups" preset
  const SWING = ['AZ', 'GA', 'MI', 'NV', 'NC', 'PA', 'WI', 'NE2', 'ME2', 'MN', 'NH', 'VA'];

  function preset(name) {
    const s = {};
    Object.keys(UNITS).forEach((k) => {
      if (name === 'blank') s[k] = 'T';
      else if (name === '2020') s[k] = DEM_2020.includes(k) ? 'D' : 'R';
      else s[k] = DEM_2024.includes(k) ? 'D' : 'R';
      if (name === 'swing' && SWING.includes(k)) s[k] = 'T';
    });
    return s;
  }

  let state = null;

  function render(root) {
    if (!state) state = { map: preset('2024'), brush: 'cycle', D: { p: 'newsom', vp: 'harris' }, R: { p: 'vance', vp: 'rubio' } };
    const L = ui.layout();
    root.appendChild(L.root);

    /* ----- tickets ----- */
    const tk = ui.card('Tickets');
    L.left.appendChild(tk.card);
    function ticketRow(party) {
      const list = CANDIDATES[party];
      const opts = list.map((c) => ({ value: c.id, label: c.name }));
      const wrap = el('div', { class: 'ticket', style: { borderLeft: `4px solid ${COLORS[party]}`, paddingLeft: '10px', marginBottom: '10px' } });
      wrap.appendChild(el('div', { class: 'pname', text: party === 'D' ? 'Democratic Party' : 'Republican Party' }));
      const pSel = ui.select(opts, state[party].p, (v) => {
        state[party].p = v;
        if (state[party].vp === v) state[party].vp = list.find((c) => c.id !== v).id;
        rebuild();
      });
      const vpOpts = [{ value: '', label: '— other / TBD —' }].concat(opts.filter((o) => o.value !== state[party].p));
      const vSel = ui.select(vpOpts, state[party].vp, (v) => { state[party].vp = v; update(); });
      wrap.appendChild(el('div', { class: 'row', style: { marginTop: '6px' } }, [el('span', { class: 'muted small', text: 'President' }), pSel, el('span', { class: 'muted small', text: 'VP' }), vSel]));
      return wrap;
    }
    tk.body.appendChild(ticketRow('D'));
    tk.body.appendChild(ticketRow('R'));

    /* ----- totals ----- */
    const tot = ui.card('Electoral College');
    L.left.appendChild(tot.card);
    const totBody = el('div');
    tot.body.appendChild(totBody);

    /* ----- presets ----- */
    const pr = ui.card('Starting maps');
    L.left.appendChild(pr.card);
    pr.body.appendChild(el('div', { class: 'row' }, [
      el('button', { class: 'btn', text: '2024 result', onclick: () => { state.map = preset('2024'); update(); } }),
      el('button', { class: 'btn', text: '2020 result', onclick: () => { state.map = preset('2020'); update(); } }),
      el('button', { class: 'btn', text: 'Swing states open', onclick: () => { state.map = preset('swing'); update(); } }),
      el('button', { class: 'btn', text: 'All toss-up', onclick: () => { state.map = preset('blank'); update(); } }),
    ]));
    pr.body.appendChild(ui.note('Maine and Nebraska split their electors: 2 go to the statewide winner and 1 to the winner of each congressional district. If nobody reaches 270, the House of Representatives decides (one vote per state delegation).'));

    /* ----- map ----- */
    const mp = ui.card('Map – click states to flip them');
    L.right.appendChild(mp.card);
    const toolbar = el('div', { class: 'map-toolbar' });
    [
      { v: 'cycle', label: 'Click to cycle D → R → toss-up', c: '#fff' },
      { v: 'D', label: 'Paint Democratic', c: DEM },
      { v: 'R', label: 'Paint Republican', c: GOP },
      { v: 'T', label: 'Paint toss-up', c: TOSS },
    ].forEach((b) => {
      const chip = el('button', { class: 'paint-chip' + (state.brush === b.v ? ' active' : ''), style: { '--c': b.c } }, [b.v !== 'cycle' ? el('span', { class: 'swatch', style: { background: b.c } }) : null, b.label]);
      chip.addEventListener('click', () => { state.brush = b.v; toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active')); chip.classList.add('active'); });
      toolbar.appendChild(chip);
    });
    mp.body.appendChild(toolbar);
    const mapWrap = el('div', { class: 'map-wrap' });
    mp.body.appendChild(mapWrap);

    /* ----- hemicycle ----- */
    const hc = ui.card('Electoral votes');
    L.right.appendChild(hc.card);
    const hcBox = el('div');
    hc.body.appendChild(hcBox);

    const tip = ui.tooltip();
    const svgNS = 'http://www.w3.org/2000/svg';
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

    const statePaths = svg.append('g').selectAll('path').data(geo.features.filter((f) => STATES[f.id])).join('path')
      .attr('class', 'unit').attr('d', path);
    bind(statePaths, (d) => STATES[d.id][0]);
    // labels for larger states
    svg.append('g').selectAll('text').data(geo.features.filter((f) => STATES[f.id] && !SMALL.includes(STATES[f.id][0]))).join('text')
      .attr('transform', (d) => {
        const c = path.centroid(d);
        const adj = { FL: [12, 0], LA: [-8, 0], MI: [10, 18], ID: [0, 15], CA: [-6, 0], KY: [6, 2], AK: [0, 0], HI: [-8, 8] }[STATES[d.id][0]] || [0, 0];
        return `translate(${c[0] + adj[0]},${c[1] + adj[1]})`;
      })
      .text((d) => STATES[d.id][0] + ' ' + STATES[d.id][2]);

    // side boxes for small NE states + districts
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
    const cand = (party, id) => CANDIDATES[party].find((c) => c.id === id);

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
          el('div', { class: 'cname', text: n }),
          el('div', { class: 'cparty', text: `${pn} · VP: ${vp}` }),
          el('div', { class: 'cval', style: { color: COLORS[p] }, text: t[p] }),
          winner === p ? el('span', { class: 'badge', text: 'WINS PRESIDENCY' }) : null,
        ]));
      });
      totBody.appendChild(cards);
      totBody.appendChild(ui.seatBar([{ name: dName, color: DEM, seats: t.D }, { name: 'Toss-up', color: TOSS, seats: t.T }, { name: rName, color: GOP, seats: t.R }].map((x) => x), 538, 270, { label: '270 electoral votes to win', unit: 'EV' }));
      let status;
      if (winner) status = `<b style="color:${COLORS[winner]}">${winner === 'D' ? dName : rName}</b> is elected President with ${t[winner]} electoral votes.`;
      else if (t.T === 0) status = '<b>269–269 tie!</b> The House of Representatives would choose the President (contingent election).';
      else status = `${t.T} electoral votes still undecided. ${dName} needs ${Math.max(0, 270 - t.D)}, ${rName} needs ${Math.max(0, 270 - t.R)}.`;
      totBody.appendChild(ui.note(status, winner ? 'info' : 'warn'));

      ES.hemicycle(hcBox, [
        { id: 'D', name: `${dName} (Democratic)`, color: DEM, seats: t.D },
        { id: 'T', name: 'Toss-up', color: TOSS, seats: t.T },
        { id: 'R', name: `${rName} (Republican)`, color: GOP, seats: t.R },
      ], { total: 538, majority: 270, subtitle: '270 to win', centerLabel: winner ? (winner === 'D' ? 'DEM' : 'GOP') : '538' });
    }
    function rebuild() { root.innerHTML = ''; render(root); }
    update();
  }

  ES.register({ id: 'usa', name: 'USA', flag: '🇺🇸', title: 'United States – 2028 Presidential Election', subtitle: 'Electoral College · 538 electors · 270 to win', render });
})();
