/* =========================================================================
   Israel – 2026 Legislative Elections (26th Knesset · 120 Seats · 3.25% Threshold)
   Default: Latest October 2026 Opinion Polls (with Gadi Eisenkot's Yashar! Party)
   National Proportional Representation (Bader-Ofer / D'Hondt) + Interactive Map
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, clone, normalize } = ES.util;
  const ui = ES.ui;

  const TOTAL_SEATS = 120;
  const MAJORITY = 61;
  const THRESHOLD = 3.25;

  // Ordered left/Arab -> centre-left -> centre (Eisenkot/Lapid/Gantz) -> centre-right (Bennett/Lieberman) -> right/Haredi/far-right
  const PARTIES = [
    { id: 'HADASH', short: "Hadash–Ta'al", name: "Hadash–Ta'al (Joint List)", leader: 'Ayman Odeh & Ahmad Tibi', color: '#dc2626', bloc: 'arab' },
    { id: 'BALAD', short: 'Balad', name: "Balad (Tajammu')", leader: 'Sami Abu Shehadeh', color: '#991b1b', bloc: 'arab' },
    { id: 'RAAM', short: "Ra'am", name: "United Arab List (Ra'am)", leader: 'Mansour Abbas', color: '#16a34a', bloc: 'arab' },
    { id: 'DEM', short: 'The Democrats', name: 'The Democrats (Labor–Meretz)', leader: 'Yair Golan', color: '#e11d48', bloc: 'opp' },
    { id: 'YA', short: 'Yesh Atid', name: 'Yesh Atid', leader: 'Yair Lapid', color: '#f97316', bloc: 'opp' },
    { id: 'YASHAR', short: 'Yashar! (Eisenkot)', name: 'Yashar! with Eisenkot (Straight!)', leader: 'Gadi Eisenkot', color: '#06b6d4', bloc: 'opp' },
    { id: 'NU', short: 'Blue & White', name: 'National Unity (Blue & White)', leader: 'Benny Gantz', color: '#38bdf8', bloc: 'opp' },
    { id: 'BENNETT', short: "Bennett (B'Yachad)", name: "Bennett 2026 / B'Yachad", leader: 'Naftali Bennett', color: '#059669', bloc: 'opp' },
    { id: 'YB', short: 'Yisrael Beiteinu', name: 'Yisrael Beiteinu', leader: 'Avigdor Lieberman', color: '#0284c7', bloc: 'opp' },
    { id: 'LIKUD', short: 'Likud', name: 'Likud', leader: 'Benjamin Netanyahu', color: '#1d4ed8', bloc: 'coal' },
    { id: 'SHAS', short: 'Shas', name: 'Shas (Sephardic Haredi)', leader: 'Aryeh Deri', color: '#d97706', bloc: 'coal' },
    { id: 'UTJ', short: 'UTJ', name: 'United Torah Judaism', leader: 'Yitzhak Goldknopf & Moshe Gafni', color: '#475569', bloc: 'coal' },
    { id: 'RZ', short: 'Religious Zionism', name: 'Religious Zionism', leader: 'Bezalel Smotrich', color: '#7c3aed', bloc: 'coal' },
    { id: 'OY', short: 'Otzma Yehudit', name: 'Otzma Yehudit (Jewish Power)', leader: 'Itamar Ben-Gvir', color: '#b91c1c', bloc: 'coal' },
  ];

  const PMAP = {};
  PARTIES.forEach((p) => (PMAP[p.id] = p));

  // 8 Regional Districts (matching window.GEO_IL)
  const DISTRICTS = [
    {
      id: 'IL-HM', code: 'HM', name: 'Central District (HaMerkaz)', weight: 25.5,
      base: { YASHAR: 23.5, LIKUD: 17.5, BENNETT: 15.0, DEM: 8.5, YB: 7.0, SHAS: 5.5, OY: 5.0, RZ: 4.5, UTJ: 3.0, YA: 3.0, NU: 2.8, HADASH: 2.2, RAAM: 1.5, BALAD: 1.0 },
    },
    {
      id: 'IL-TA', code: 'TA', name: 'Tel Aviv District (Gush Dan)', weight: 18.0,
      base: { YASHAR: 26.5, DEM: 15.0, LIKUD: 13.5, BENNETT: 12.5, UTJ: 6.0, YB: 5.0, YA: 4.8, SHAS: 4.5, NU: 3.5, OY: 3.2, RZ: 2.5, HADASH: 1.5, RAAM: 0.8, BALAD: 0.7 },
    },
    {
      id: 'IL-HZ', code: 'HZ', name: 'Northern District (HaZafon)', weight: 14.5,
      base: { HADASH: 22.0, RAAM: 14.5, LIKUD: 14.0, YASHAR: 11.5, BENNETT: 8.5, YB: 7.5, OY: 5.8, BALAD: 4.8, SHAS: 3.8, DEM: 3.0, RZ: 2.2, YA: 1.0, NU: 0.8, UTJ: 0.6 },
    },
    {
      id: 'IL-HD', code: 'HD', name: 'Southern District (HaDarom)', weight: 13.5,
      base: { LIKUD: 24.5, YASHAR: 13.0, BENNETT: 11.5, OY: 10.5, SHAS: 9.5, YB: 9.5, UTJ: 5.5, RZ: 5.0, RAAM: 4.2, DEM: 2.8, YA: 1.5, NU: 1.3, HADASH: 0.7, BALAD: 0.5 },
    },
    {
      id: 'IL-HA', code: 'HA', name: 'Haifa District', weight: 11.5,
      base: { YASHAR: 21.0, LIKUD: 15.0, HADASH: 12.5, BENNETT: 11.5, YB: 9.5, DEM: 8.5, OY: 4.5, RAAM: 4.0, SHAS: 3.5, UTJ: 2.5, YA: 2.5, NU: 2.0, BALAD: 1.5, RZ: 1.5 },
    },
    {
      id: 'IL-JM', code: 'JM', name: 'Jerusalem District', weight: 10.5,
      base: { UTJ: 24.0, LIKUD: 18.0, SHAS: 16.0, BENNETT: 9.5, OY: 8.5, RZ: 8.0, YASHAR: 7.5, DEM: 4.5, YB: 1.5, YA: 0.8, NU: 0.7, HADASH: 0.4, RAAM: 0.4, BALAD: 0.2 },
    },
    {
      id: 'IL-GO', code: 'GO', name: 'Golan & Upper Galilee', weight: 1.3,
      base: { YASHAR: 23.0, LIKUD: 18.5, BENNETT: 15.5, DEM: 13.0, YB: 8.5, OY: 6.0, RZ: 5.0, YA: 3.0, NU: 2.5, SHAS: 2.0, HADASH: 1.5, RAAM: 0.8, UTJ: 0.4, BALAD: 0.3 },
    },
    {
      id: 'IL-JS', code: 'JS', name: 'Judea & Samaria (Area C)', weight: 5.2,
      base: { RZ: 23.0, OY: 20.0, LIKUD: 18.5, BENNETT: 14.0, UTJ: 10.0, SHAS: 6.0, YASHAR: 4.0, YB: 2.0, DEM: 1.0, NU: 0.7, YA: 0.5, HADASH: 0.1, RAAM: 0.1, BALAD: 0.1 },
    },
  ];

  // Calibrate baseline so weighted district sum matches the Latest October 2026 Poll (Channel 12 Poll:
  // Yashar! 23, Likud 21, Bennett/B'Yachad 15, The Democrats 10, Hadash-Ta'al 9, Yisrael Beiteinu 8,
  // Otzma Yehudit 8, Shas 8, UTJ 7, Religious Zionism 6, Ra'am 5 = 120 MKs)
  const TARGET_OCT_2026 = {
    YASHAR: 17.90,
    LIKUD: 16.35,
    BENNETT: 11.70,
    DEM: 7.85,
    HADASH: 7.05,
    YB: 6.30,
    OY: 6.30,
    SHAS: 6.25,
    UTJ: 5.50,
    RZ: 4.75,
    RAAM: 3.95,
    YA: 2.40,
    NU: 2.10,
    BALAD: 1.60,
  };

  const totalWeight = DISTRICTS.reduce((a, d) => a + d.weight, 0);
  PARTIES.forEach((p) => {
    const rawW = DISTRICTS.reduce((a, d) => a + (d.base[p.id] || 0) * d.weight, 0) / totalWeight;
    if (rawW > 0 && TARGET_OCT_2026[p.id] !== undefined) {
      const factor = TARGET_OCT_2026[p.id] / rawW;
      DISTRICTS.forEach((d) => {
        d.base[p.id] = +((d.base[p.id] || 0) * factor).toFixed(2);
      });
    }
  });

  const DMAP = {};
  DISTRICTS.forEach((d) => (DMAP[d.id] = d));

  // Traditional Bader-Ofer surplus vote-sharing pairs (Heskemey Odafim)
  const SURPLUS_PAIRS = [
    ['YASHAR', 'BENNETT'],
    ['DEM', 'YB'],
    ['LIKUD', 'OY'],
    ['SHAS', 'UTJ'],
    ['HADASH', 'RAAM'],
    ['YA', 'NU'],
  ];

  let state = null;
  function initState() {
    const distPct = {};
    DISTRICTS.forEach((d) => (distPct[d.id] = clone(d.base)));
    state = {
      selectedDist: 'ALL',
      brush: 'edit', // 'edit' | partyId
      distPct,
      overridden: {},
      baderOfer: true,
    };
  }

  function getNationalPct() {
    const nat = {};
    PARTIES.forEach((p) => {
      nat[p.id] = +(DISTRICTS.reduce((a, d) => a + (state.distPct[d.id][p.id] || 0) * d.weight, 0) / totalWeight).toFixed(2);
    });
    return nat;
  }

  function applyNationalTarget(newNat) {
    const curNat = getNationalPct();
    PARTIES.forEach((p) => {
      const target = newNat[p.id] || 0;
      const cur = curNat[p.id] || 0;
      if (Math.abs(target - cur) < 0.01) return;
      DISTRICTS.forEach((d) => {
        if (cur > 0.1 && (state.distPct[d.id][p.id] || 0) > 0) {
          state.distPct[d.id][p.id] = +Math.max(0, (state.distPct[d.id][p.id] || 0) * (target / cur)).toFixed(2);
        } else {
          state.distPct[d.id][p.id] = +target.toFixed(2);
        }
      });
    });
  }

  function calculateKnesset() {
    const natRaw = getNationalPct();
    const nat = normalize(natRaw, 100);

    // Filter parties clearing 3.25% threshold
    const qualified = {};
    PARTIES.forEach((p) => {
      if ((nat[p.id] || 0) >= THRESHOLD) {
        qualified[p.id] = nat[p.id];
      }
    });

    const seats = {};
    PARTIES.forEach((p) => (seats[p.id] = 0));

    if (!state.baderOfer) {
      const alloc = ES.methods.dhondt(qualified, TOTAL_SEATS, THRESHOLD);
      PARTIES.forEach((p) => (seats[p.id] = alloc[p.id] || 0));
    } else {
      const combinedVotes = {};
      const used = new Set();
      SURPLUS_PAIRS.forEach(([a, b]) => {
        if (qualified[a] && qualified[b]) {
          combinedVotes[`${a}+${b}`] = qualified[a] + qualified[b];
          used.add(a);
          used.add(b);
        }
      });
      Object.keys(qualified).forEach((pid) => {
        if (!used.has(pid)) combinedVotes[pid] = qualified[pid];
      });

      const listSeats = ES.methods.dhondt(combinedVotes, TOTAL_SEATS, 0);
      Object.entries(listSeats).forEach(([key, s]) => {
        if (key.includes('+')) {
          const [a, b] = key.split('+');
          const sub = ES.methods.dhondt({ [a]: qualified[a], [b]: qualified[b] }, s, 0);
          seats[a] = sub[a] || 0;
          seats[b] = sub[b] || 0;
        } else {
          seats[key] = s;
        }
      });
    }

    const wastedPct = PARTIES.reduce((acc, p) => acc + ((seats[p.id] || 0) === 0 ? (nat[p.id] || 0) : 0), 0);
    return { nat, seats, wastedPct };
  }

  function strongestPartyInDist(distId) {
    const pcts = state.distPct[distId];
    let best = 'YASHAR', max = -1;
    PARTIES.forEach((p) => {
      if ((pcts[p.id] || 0) > max) {
        max = pcts[p.id] || 0;
        best = p.id;
      }
    });
    return { party: PMAP[best], pct: max };
  }

  function applyPreset(kind) {
    state.overridden = {};
    DISTRICTS.forEach((d) => (state.distPct[d.id] = clone(d.base)));
    if (kind === 'oct2026_ch12') {
      // Already at TARGET_OCT_2026 (Channel 12 Poll: Yashar! 23, Likud 21, Bennett 15, Democrats 10, Hadash 9, YB 8, OY 8, Shas 8, UTJ 7, RZ 6, Ra'am 5)
    } else if (kind === 'oct2026_ch13') {
      // Channel 13 Poll (Oct 2026): Yashar! 22, Likud 19, Bennett 14, Democrats 10, Hadash 9, YB 8, OY 8, RZ 8, UTJ 7, Shas 7, Ra'am 7
      applyNationalTarget({
        YASHAR: 17.3, LIKUD: 15.0, BENNETT: 11.1, DEM: 7.9, HADASH: 7.1, YB: 6.3,
        OY: 6.3, RZ: 6.2, UTJ: 5.6, SHAS: 5.6, RAAM: 5.5, YA: 2.3, NU: 2.1, BALAD: 1.7,
      });
    } else if (kind === 'separate_lists') {
      // All centrist/opposition parties running separately above threshold (Eisenkot + Bennett + Lapid + Gantz)
      applyNationalTarget({
        LIKUD: 18.5, BENNETT: 15.5, YASHAR: 13.5, DEM: 8.5, YA: 7.2, YB: 7.0,
        SHAS: 6.8, OY: 6.2, UTJ: 5.5, NU: 4.2, HADASH: 4.1, RAAM: 3.9, RZ: 3.4, BALAD: 1.7,
      });
    } else if (kind === '2022_actual') {
      applyNationalTarget({
        LIKUD: 23.41, YA: 17.79, NU: 9.08, SHAS: 8.25, DEM: 6.85, UTJ: 5.88,
        OY: 5.80, RZ: 5.04, YB: 4.48, RAAM: 4.07, HADASH: 3.75, BALAD: 2.91, YASHAR: 0.0, BENNETT: 0.0,
      });
    }
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    /* ---- Left Column: Scenarios, District Selector, Sliders ---- */
    const scenCard = ui.card('2026 Knesset Opinion Polls & Scenarios');
    L.left.appendChild(scenCard.card);

    scenCard.body.appendChild(
      el('div', { class: 'row', style: { gap: '6px', marginBottom: '10px' } }, [
        el('button', {
          class: 'btn btn-primary',
          text: 'Latest Poll – Ch12 (Eisenkot 23, Likud 21)',
          onclick: () => {
            applyPreset('oct2026_ch12');
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Ch13 Poll (Eisenkot 22, Likud 19)',
          onclick: () => {
            applyPreset('oct2026_ch13');
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: 'Separate Lists (Eisenkot + Bennett + Lapid + Gantz)',
          onclick: () => {
            applyPreset('separate_lists');
            rebuildSliders();
            update();
          },
        }),
        el('button', {
          class: 'btn',
          text: '2022 Actual (25th Knesset)',
          onclick: () => {
            applyPreset('2022_actual');
            rebuildSliders();
            update();
          },
        }),
      ])
    );

    const boCheck = el('input', { type: 'checkbox', checked: state.baderOfer });
    boCheck.addEventListener('change', () => {
      state.baderOfer = boCheck.checked;
      update();
    });
    scenCard.body.appendChild(
      el('label', { class: 'check small' }, [
        boCheck,
        'Bader-Ofer Surplus-Vote Agreements (Heskemey Odafim between allied lists)',
      ])
    );

    // District selector
    const distCard = ui.card('Select District or National Vote Share (%)');
    L.left.appendChild(distCard.card);
    const distOpts = [{ value: 'ALL', label: '🇮🇱 All Israel – National Vote Share (%)' }].concat(
      DISTRICTS.map((d) => ({ value: d.id, label: `${d.name} (${d.code}) · weight ${d.weight}%` }))
    );
    const distSelect = ui.select(distOpts, state.selectedDist, (v) => {
      state.selectedDist = v;
      rebuildSliders();
      update();
    });
    distSelect.style.width = '100%';
    distCard.body.appendChild(distSelect);

    const slHeaderSpan = el('span', { text: 'Party Vote Shares (%)' });
    const slCard = ui.card('Party Vote Shares (%)');
    slCard.card.querySelector('h3').replaceWith(slHeaderSpan);
    L.left.appendChild(slCard.card);
    const slBox = el('div');
    slCard.body.appendChild(slBox);

    let activeSliders = null;
    function rebuildSliders() {
      slBox.innerHTML = '';
      if (state.selectedDist === 'ALL') {
        slHeaderSpan.textContent = 'NATIONAL KNESSET VOTE SHARE (%) – 3.25% THRESHOLD';
        const natVals = getNationalPct();
        activeSliders = ui.sliders(
          PARTIES.map((p) => ({ id: p.id, name: p.short, leader: p.leader, color: p.color })),
          natVals,
          {
            max: 35,
            step: 0.1,
            onChange: (vals) => {
              applyNationalTarget(vals);
              update(true);
            },
          }
        );
        slBox.appendChild(activeSliders.el);
      } else {
        const dist = DMAP[state.selectedDist];
        slHeaderSpan.textContent = `${dist.name.toUpperCase()} – DISTRICT VOTE SHARE (%)`;
        activeSliders = ui.sliders(
          PARTIES.map((p) => ({ id: p.id, name: p.short, leader: p.leader, color: p.color })),
          state.distPct[dist.id],
          {
            max: 45,
            step: 0.1,
            onChange: () => {
              state.overridden[dist.id] = true;
              update(true);
            },
          }
        );
        slBox.appendChild(activeSliders.el);
        slBox.appendChild(
          el('div', { class: 'row', style: { marginTop: '10px' } }, [
            el('button', {
              class: 'btn btn-xs',
              text: `Reset ${dist.code} to Baseline`,
              onclick: () => {
                state.distPct[dist.id] = clone(dist.base);
                delete state.overridden[dist.id];
                rebuildSliders();
                update();
              },
            }),
            el('button', {
              class: 'btn btn-xs',
              text: '← Back to National Sliders',
              onclick: () => {
                state.selectedDist = 'ALL';
                distSelect.value = 'ALL';
                rebuildSliders();
                update();
              },
            }),
          ])
        );
      }
    }

    /* ---- Right Column: Map + Hemicycle + Coalition Studio + Table ---- */
    const mapCard = ui.card('Interactive Map of Israeli Districts (Click to Edit % or Paint Leading Party)');
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
    toolbar.appendChild(makeBrush('edit', '🎛️ Select & Edit District %', '#5b8cff'));
    ['YASHAR', 'LIKUD', 'BENNETT', 'DEM', 'HADASH', 'YB', 'OY', 'SHAS', 'UTJ', 'RZ', 'RAAM', 'YA', 'NU'].forEach((pid) => {
      const p = PMAP[pid];
      toolbar.appendChild(makeBrush(p.id, p.short, p.color));
    });
    mapCard.body.appendChild(toolbar);

    const mapGrid = el('div', { class: 'grid2', style: { alignItems: 'center' } });
    const mapWrap = el('div', { class: 'map-wrap' });
    const distTableBox = el('div');
    mapGrid.appendChild(mapWrap);
    mapGrid.appendChild(distTableBox);
    mapCard.body.appendChild(mapGrid);

    const hcCard = ui.card('26th Knesset – 120 Seats (61 Needed for Governing Majority)');
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const barBox = el('div');
    const blocNoteBox = el('div', { style: { marginTop: '10px' } });
    const coalBox = el('div', { style: { marginTop: '12px' } });
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(barBox);
    hcCard.body.appendChild(blocNoteBox);
    hcCard.body.appendChild(coalBox);

    const tblCard = ui.card('National Knesset Results & Threshold Status (3.25% = 4 Seats Min.)');
    L.right.appendChild(tblCard.card);
    const tblBox = el('div');
    tblCard.body.appendChild(tblBox);

    // Build SVG Map of Israel
    const tip = ui.tooltip();
    const W = 380, H = 540;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[18, 18], [W - 18, H - 18]], window.GEO_IL);
    const path = d3.geoPath(proj);

    const distPaths = svg.append('g')
      .selectAll('path')
      .data(window.GEO_IL.features)
      .join('path')
      .attr('class', 'unit')
      .attr('d', path)
      .on('click', (e, d) => handleDistClick(DMAP[d.properties.id]))
      .on('mouseenter', (e, d) => showDistTip(e, DMAP[d.properties.id]))
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    svg.append('g')
      .selectAll('text')
      .data(window.GEO_IL.features)
      .join('text')
      .attr('transform', (d) => `translate(${path.centroid(d)})`)
      .text((d) => d.properties.code);

    function handleDistClick(dist) {
      if (!dist) return;
      if (state.brush === 'edit') {
        state.selectedDist = dist.id;
        distSelect.value = dist.id;
        rebuildSliders();
        update();
      } else {
        const pid = state.brush;
        const cur = state.distPct[dist.id];
        const othersSum = Object.keys(cur).reduce((a, k) => a + (k === pid ? 0 : cur[k]), 0);
        const targetShare = 36.0;
        Object.keys(cur).forEach((k) => {
          if (k === pid) cur[k] = targetShare;
          else if (othersSum > 0) cur[k] = +((cur[k] / othersSum) * (100 - targetShare)).toFixed(1);
        });
        state.overridden[dist.id] = true;
        rebuildSliders();
        update();
      }
      if (ES.sfx) ES.sfx.click();
    }

    function showDistTip(e, dist) {
      if (!dist) return;
      const pcts = state.distPct[dist.id];
      const rows = PARTIES.filter((p) => (pcts[p.id] || 0) >= 1.5)
        .sort((a, b) => (pcts[b.id] || 0) - (pcts[a.id] || 0))
        .slice(0, 7)
        .map((p) => `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right"><b>${fmt(pcts[p.id], 1)}%</b></td></tr>`)
        .join('');
      tip.show(
        e,
        `<b>${dist.name}</b> · Weight ${dist.weight}%<table>${rows}</table><div class="muted small">Click to ${state.brush === 'edit' ? 'edit district sliders' : 'paint ' + PMAP[state.brush].short}</div>`
      );
    }

    function update(fromSliders) {
      const calc = calculateKnesset();
      const { nat, seats, wastedPct } = calc;

      if (!fromSliders && state.selectedDist === 'ALL' && activeSliders) {
        activeSliders.setValues(clone(nat));
      }

      distPaths
        .attr('fill', (d) => strongestPartyInDist(d.properties.id).party.color)
        .classed('override', (d) => !!state.overridden[d.properties.id]);

      const dRows = DISTRICTS.map((d) => {
        const lead = strongestPartyInDist(d.id);
        return el('tr', {
          style: { cursor: 'pointer', background: state.selectedDist === d.id ? 'rgba(91,140,255,0.16)' : '' },
          onclick: () => handleDistClick(d),
        }, [
          el('td', {}, [
            el('span', { class: 'swatch', style: { background: lead.party.color } }),
            el('span', { text: `${d.code} · ${d.name}` }),
          ]),
          el('td', { class: 'num muted', text: `${d.weight}%` }),
          el('td', { class: 'num', html: `<b style="color:${lead.party.color}">${lead.party.short}</b> ${fmt(lead.pct, 1)}%` }),
        ]);
      });
      distTableBox.innerHTML = '';
      distTableBox.appendChild(
        el('table', { class: 'results' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'District (Click to edit)' }), el('th', { text: 'Weight' }), el('th', { text: '1st Party' })])),
          el('tbody', {}, dRows),
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

      const netanyahuBloc = ['LIKUD', 'SHAS', 'UTJ', 'RZ', 'OY'].reduce((a, id) => a + (seats[id] || 0), 0);
      const changeBloc = ['YASHAR', 'BENNETT', 'DEM', 'YB', 'YA', 'NU'].reduce((a, id) => a + (seats[id] || 0), 0);
      const arabParties = ['HADASH', 'RAAM', 'BALAD'].reduce((a, id) => a + (seats[id] || 0), 0);

      ES.hemicycle(hcBox, hcParties, {
        total: TOTAL_SEATS,
        majority: MAJORITY,
        subtitle: `Majority: 61 · Change Bloc (Eisenkot/Bennett/Golan/Liberman): ${changeBloc} · Netanyahu Bloc: ${netanyahuBloc}`,
      });

      barBox.innerHTML = '';
      barBox.appendChild(ui.seatBar(hcParties, TOTAL_SEATS, MAJORITY, { label: '61 MKs required for a Knesset governing majority', unit: 'MKs' }));

      blocNoteBox.innerHTML = '';
      const underThreshold = PARTIES.filter((p) => (seats[p.id] || 0) === 0 && (nat[p.id] || 0) >= 1.2)
        .map((p) => `<b>${p.short}</b> (${fmt(nat[p.id], 2)}%)`).join(', ');
      blocNoteBox.appendChild(
        ui.note(
          `<b>Latest Poll Bloc Tally:</b> Zionist Change/Opposition Bloc (Yashar!, Bennett, Democrats, Yisrael Beiteinu, Yesh Atid, Blue & White): <b>${changeBloc} MKs</b> · Netanyahu Right/Haredi Coalition: <b>${netanyahuBloc} MKs</b> · Arab Parties (Hadash–Ta'al, Ra'am, Balad): <b>${arabParties} MKs</b>.` +
          (underThreshold ? `<br><span class="warn">Below 3.25% threshold (${fmt(wastedPct, 1)}% wasted votes): ${underThreshold}.</span>` : ''),
          netanyahuBloc >= 61 || changeBloc >= 61 ? 'info' : 'warn'
        )
      );

      coalBox.innerHTML = '';
      coalBox.appendChild(ui.coalition(hcParties, TOTAL_SEATS, MAJORITY));

      const rows = PARTIES.map((p) => {
        const s = seats[p.id] || 0;
        const v = nat[p.id] || 0;
        return {
          id: p.id,
          color: p.color,
          name: p.short,
          leader: `${p.leader} (${p.name})`,
          votes: v,
          status: v >= THRESHOLD ? '<span class="ok">≥ 3.25%</span>' : '<span class="no">&lt; 3.25%</span>',
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
            { key: 'votes', label: 'Vote %', fmt: (v) => fmt(v, 2) + '%' },
            { key: 'status', label: 'Threshold' },
            { key: 'seats', label: 'MKs (120)', fmt: (v) => `<b>${v}</b>` },
            { key: 'seatPct', label: 'Seat %', fmt: (v) => fmt(v, 1) + '%' },
          ],
        })
      );
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'israel',
    name: 'Israel',
    flag: '🇮🇱',
    title: 'Israel – 2026 General Elections (26th Knesset)',
    subtitle: '120 Seats · Latest Oct 2026 Polls (Yashar! / Eisenkot) · 3.25% Threshold · 8 Regional Districts',
    render,
  });
})();
