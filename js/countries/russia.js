/* =========================================================================
   Russia – 2024 Presidential Election (Two-Round System · >50% in Round 1)
   Interactive 83-Region Map & 8 Federal Districts + Second Round Runoff Simulator
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, clone, normalize, textOn } = ES.util;
  const ui = ES.ui;

  const CANDIDATES = [
    { id: 'putin', name: 'Vladimir Putin', party: 'Independent / United Russia (ONF)', shortParty: 'Putin (ONF)', color: '#1d4ed8', base: 88.48, onBallot24: true },
    { id: 'kharitonov', name: 'Nikolay Kharitonov', party: 'Communist Party (CPRF)', shortParty: 'CPRF', color: '#dc2626', base: 4.37, onBallot24: true },
    { id: 'davankov', name: 'Vladislav Davankov', party: 'New People (Novye Lyudi)', shortParty: 'New People', color: '#06b6d4', base: 3.90, onBallot24: true },
    { id: 'slutsky', name: 'Leonid Slutsky', party: 'Liberal Democratic Party (LDPR)', shortParty: 'LDPR', color: '#eab308', base: 3.25, onBallot24: true },
    { id: 'nadezhdin', name: 'Boris Nadezhdin', party: 'Civic Initiative (Opposition – Disqualified)', shortParty: 'Civic Init.', color: '#3b82f6', base: 0.0, onBallot24: false },
    { id: 'duntsova', name: 'Yekaterina Duntsova', party: 'Independent (Democratic Opposition)', shortParty: 'Duntsova', color: '#ec4899', base: 0.0, onBallot24: false },
  ];

  const CMAP = {};
  CANDIDATES.forEach((c) => (CMAP[c.id] = c));

  // 8 Federal Districts of Russia with vote weights & baseline shares
  const FED_DISTRICTS = [
    { id: 'FD-CEN', code: 'CEN', name: 'Central Federal District (Moscow & Central)', weight: 26.8, base: { putin: 87.2, davankov: 4.9, kharitonov: 4.5, slutsky: 3.4, nadezhdin: 0, duntsova: 0 } },
    { id: 'FD-VOL', code: 'VOL', name: 'Volga Federal District (Povolzhye)', weight: 20.1, base: { putin: 88.6, kharitonov: 4.6, davankov: 3.6, slutsky: 3.2, nadezhdin: 0, duntsova: 0 } },
    { id: 'FD-SIB', code: 'SIB', name: 'Siberian Federal District', weight: 11.4, base: { putin: 86.4, kharitonov: 5.1, davankov: 4.6, slutsky: 3.9, nadezhdin: 0, duntsova: 0 } },
    { id: 'FD-SOU', code: 'SOU', name: 'Southern Federal District (Kuban & Don)', weight: 11.2, base: { putin: 90.8, kharitonov: 3.8, slutsky: 2.9, davankov: 2.5, nadezhdin: 0, duntsova: 0 } },
    { id: 'FD-NW', code: 'NW', name: 'Northwestern Federal District (St. Petersburg)', weight: 9.4, base: { putin: 84.2, davankov: 6.4, kharitonov: 5.0, slutsky: 4.4, nadezhdin: 0, duntsova: 0 } },
    { id: 'FD-URA', code: 'URA', name: 'Ural Federal District', weight: 8.4, base: { putin: 86.9, davankov: 4.5, kharitonov: 4.5, slutsky: 4.1, nadezhdin: 0, duntsova: 0 } },
    { id: 'FD-NC', code: 'NC', name: 'North Caucasian Federal District', weight: 7.2, base: { putin: 95.8, kharitonov: 2.1, slutsky: 1.2, davankov: 0.9, nadezhdin: 0, duntsova: 0 } },
    { id: 'FD-FE', code: 'FE', name: 'Far Eastern Federal District', weight: 5.5, base: { putin: 86.6, kharitonov: 4.9, davankov: 4.4, slutsky: 4.1, nadezhdin: 0, duntsova: 0 } },
  ];

  const FDMAP = {};
  FED_DISTRICTS.forEach((fd) => (FDMAP[fd.id] = fd));
  const totalWeight = FED_DISTRICTS.reduce((a, fd) => a + fd.weight, 0);

  // Map any of the 83 GeoJSON region names to one of the 8 Federal Districts
  function classifySubjectToFD(name) {
    const n = (name || '').toLowerCase();
    if (/chechn|dagestan|ingush|ossetia|kabard|karachay|stavropol/.test(n)) return 'FD-NC';
    if (/krasnodar|rostov|volgograd|astrakhan|kalmyk|adyge/.test(n)) return 'FD-SOU';
    if (/petersburg|leningrad|murmansk|karelia|arkhangelsk|nenets|vologda|novgorod|pskov|kaliningrad|komi/.test(n)) return 'FD-NW';
    if (/sverdlovsk|chelyabinsk|tyumen|khanty|yamalo|kurgan/.test(n)) return 'FD-URA';
    if (/primor|khabarovsk|amur|yakutia|sakha|sakhalin|kamchat|magadan|chukot|jewish|buryat|zabaykal|chita/.test(n)) return 'FD-FE';
    if (/novosibirsk|omsk|krasnoyarsk|irkutsk|kemerovo|tomsk|altai|khakass|tuva/.test(n)) return 'FD-SIB';
    if (/tatar|bashkort|samara|nizhny|saratov|perm|udmurt|chuvash|mordov|mari|ulyanovsk|penza|orenburg|kirov/.test(n)) return 'FD-VOL';
    return 'FD-CEN';
  }

  let state = null;
  function initState() {
    const fdPct = {};
    const active = {};
    FED_DISTRICTS.forEach((fd) => (fdPct[fd.id] = clone(fd.base)));
    CANDIDATES.forEach((c) => (active[c.id] = c.onBallot24));
    state = {
      selectedFD: 'ALL',
      brush: 'edit', // 'edit' | candId
      fdPct,
      active,
      subjectOverrides: {}, // 'RU-xx' -> candId
      fdOverridden: {},
      r2Manual: false,
      r2SliderA: 54.0,
    };
  }

  function getNationalPct() {
    const nat = {};
    CANDIDATES.forEach((c) => {
      if (!state.active[c.id]) {
        nat[c.id] = 0;
        return;
      }
      nat[c.id] = +(FED_DISTRICTS.reduce((a, fd) => a + (state.fdPct[fd.id][c.id] || 0) * fd.weight, 0) / totalWeight).toFixed(2);
    });
    return nat;
  }

  function applyNationalTarget(newNat) {
    const curNat = getNationalPct();
    CANDIDATES.forEach((c) => {
      if (!state.active[c.id]) return;
      const target = newNat[c.id] || 0;
      const cur = curNat[c.id] || 0;
      if (Math.abs(target - cur) < 0.01) return;
      FED_DISTRICTS.forEach((fd) => {
        if (cur > 0.1 && (state.fdPct[fd.id][c.id] || 0) > 0) {
          state.fdPct[fd.id][c.id] = +Math.max(0, (state.fdPct[fd.id][c.id] || 0) * (target / cur)).toFixed(2);
        } else {
          state.fdPct[fd.id][c.id] = +target.toFixed(2);
        }
      });
    });
  }

  function computePresidential() {
    const rawNat = getNationalPct();
    const normR1 = normalize(rawNat, 100);

    const ranked = CANDIDATES.filter((c) => state.active[c.id])
      .map((c) => ({ ...c, r1: normR1[c.id] || 0 }))
      .sort((a, b) => b.r1 - a.r1);

    const top1 = ranked[0] || CANDIDATES[0];
    const top2 = ranked[1] || CANDIDATES[1];
    const outrightR1 = top1.r1 > 50.0;

    // Second round runoff projection if no one > 50% in Round 1
    let r2A = 50, r2B = 50;
    if (outrightR1) {
      const sum2 = top1.r1 + top2.r1;
      r2A = sum2 > 0 ? (top1.r1 / sum2) * 100 : 50;
      r2B = 100 - r2A;
    } else {
      let rawA = top1.r1 * 0.96;
      let rawB = top2.r1 * 0.96;
      ranked.slice(2).forEach((elim) => {
        if (elim.id === 'nadezhdin' || elim.id === 'duntsova' || elim.id === 'davankov') {
          if (top2.id !== 'putin') { rawB += elim.r1 * 0.78; rawA += elim.r1 * 0.10; }
          else { rawA += elim.r1 * 0.78; rawB += elim.r1 * 0.10; }
        } else {
          rawA += elim.r1 * 0.48;
          rawB += elim.r1 * 0.36;
        }
      });
      r2A = rawA + rawB > 0 ? (rawA / (rawA + rawB)) * 100 : 50;
      r2B = 100 - r2A;
      if (state.r2Manual) {
        r2A = Math.max(0, Math.min(100, +state.r2SliderA || 50));
        r2B = 100 - r2A;
      }
    }

    const winner = outrightR1 ? top1 : r2A >= r2B ? top1 : top2;
    return { ranked, top1, top2, outrightR1, r2A, r2B, winner };
  }

  function strongestInFD(fdId) {
    const pcts = state.fdPct[fdId];
    let best = 'putin', max = -1;
    CANDIDATES.forEach((c) => {
      if (!state.active[c.id]) return;
      if ((pcts[c.id] || 0) > max) {
        max = pcts[c.id] || 0;
        best = c.id;
      }
    });
    return { cand: CMAP[best], pct: max };
  }

  function applyPreset(kind) {
    state.subjectOverrides = {};
    state.fdOverridden = {};
    state.r2Manual = false;
    FED_DISTRICTS.forEach((fd) => (state.fdPct[fd.id] = clone(fd.base)));
    CANDIDATES.forEach((c) => (state.active[c.id] = c.onBallot24));

    if (kind === '2024_official') {
      // Already at official CEC baseline
    } else if (kind === 'urban_protest') {
      applyNationalTarget({ putin: 68.0, davankov: 16.5, kharitonov: 9.5, slutsky: 6.0 });
      state.fdPct['FD-CEN'].davankov = 38.0; state.fdPct['FD-CEN'].putin = 49.0;
      state.fdPct['FD-NW'].davankov = 42.0; state.fdPct['FD-NW'].putin = 45.0;
      state.subjectOverrides['RU-42'] = 'davankov'; // Moscow
    } else if (kind === 'nadezhdin_ballot') {
      state.active.nadezhdin = true;
      applyNationalTarget({ putin: 58.5, nadezhdin: 22.5, kharitonov: 8.5, davankov: 6.0, slutsky: 4.5 });
      state.fdPct['FD-CEN'].nadezhdin = 36.0; state.fdPct['FD-CEN'].putin = 46.0;
      state.fdPct['FD-NW'].nadezhdin = 39.0; state.fdPct['FD-NW'].putin = 43.0;
    } else if (kind === 'runoff_scenario') {
      state.active.nadezhdin = true;
      state.active.duntsova = true;
      applyNationalTarget({ putin: 46.5, nadezhdin: 26.0, kharitonov: 10.5, davankov: 8.0, duntsova: 5.0, slutsky: 4.0 });
      state.fdPct['FD-CEN'].nadezhdin = 41.0; state.fdPct['FD-CEN'].putin = 36.0;
      state.fdPct['FD-NW'].nadezhdin = 43.0; state.fdPct['FD-NW'].putin = 35.0;
      state.fdPct['FD-URA'].nadezhdin = 34.0; state.fdPct['FD-URA'].putin = 41.0;
    }
  }

  function render(root) {
    if (!state) initState();
    const L = ui.layout();
    root.appendChild(L.root);

    /* ---- Left Column: Scenarios, Candidate Ballot Toggles, Federal District Selector, Sliders ---- */
    const scenCard = ui.card('2024 Presidential Scenarios & Ballot Field');
    L.left.appendChild(scenCard.card);

    scenCard.body.appendChild(
      el('div', { class: 'row', style: { gap: '6px', marginBottom: '10px' } }, [
        el('button', {
          class: 'btn btn-primary',
          text: '2024 Official CEC Result (88.5%)',
          onclick: () => { applyPreset('2024_official'); render(root); },
        }),
        el('button', {
          class: 'btn',
          text: 'Urban Protest Swing (Davankov)',
          onclick: () => { applyPreset('urban_protest'); render(root); },
        }),
        el('button', {
          class: 'btn',
          text: 'Nadezhdin Allowed on Ballot',
          onclick: () => { applyPreset('nadezhdin_ballot'); render(root); },
        }),
        el('button', {
          class: 'btn',
          text: 'Forced 2nd Round Runoff (<50%)',
          onclick: () => { applyPreset('runoff_scenario'); render(root); },
        }),
      ])
    );

    scenCard.body.appendChild(el('div', { class: 'muted small', style: { marginBottom: '6px' }, text: 'Include / exclude candidates on the ballot:' }));
    const chipWrap = el('div', { class: 'row', style: { gap: '6px' } });
    CANDIDATES.forEach((c) => {
      const isOn = !!state.active[c.id];
      const lbl = el('label', {
        class: 'paint-chip' + (isOn ? ' active' : ''),
        style: { '--c': c.color, opacity: isOn ? '1' : '0.45' },
      }, [
        el('input', {
          type: 'checkbox',
          checked: isOn,
          style: { display: 'none' },
          onchange: (e) => {
            const count = CANDIDATES.filter((x) => state.active[x.id]).length;
            if (!e.target.checked && count <= 2) return;
            state.active[c.id] = e.target.checked;
            if (state.active[c.id] && getNationalPct()[c.id] < 0.5) {
              FED_DISTRICTS.forEach((fd) => (state.fdPct[fd.id][c.id] = 12.0));
            }
            render(root);
          },
        }),
        el('span', { class: 'swatch', style: { background: c.color } }),
        `${c.name.split(' ').pop()} (${c.shortParty})`,
      ]);
      chipWrap.appendChild(lbl);
    });
    scenCard.body.appendChild(chipWrap);

    const selCard = ui.card('Select Federal District or All-Russia Vote Share');
    L.left.appendChild(selCard.card);
    const fdOpts = [{ value: 'ALL', label: '🇷🇺 All Russia – National Vote Share (%)' }].concat(
      FED_DISTRICTS.map((fd) => ({ value: fd.id, label: `${fd.name} · weight ${fd.weight}%` }))
    );
    const fdSelect = ui.select(fdOpts, state.selectedFD, (v) => {
      state.selectedFD = v;
      rebuildSliders();
      update();
    });
    fdSelect.style.width = '100%';
    selCard.body.appendChild(fdSelect);

    const slHeaderSpan = el('span', { text: 'First Round Vote Shares (%)' });
    const slCard = ui.card('First Round Vote Shares (%)');
    slCard.card.querySelector('h3').replaceWith(slHeaderSpan);
    L.left.appendChild(slCard.card);
    const slBox = el('div');
    slCard.body.appendChild(slBox);

    let activeSliders = null;
    function rebuildSliders() {
      slBox.innerHTML = '';
      const activeCands = CANDIDATES.filter((c) => state.active[c.id]).map((c) => ({
        id: c.id,
        name: c.name,
        leader: c.party,
        color: c.color,
      }));
      if (state.selectedFD === 'ALL') {
        slHeaderSpan.textContent = 'NATIONAL ROUND 1 VOTE SHARE (%) – >50% WINS OUTRIGHT';
        const natVals = getNationalPct();
        activeSliders = ui.sliders(activeCands, natVals, {
          max: 95,
          step: 0.1,
          showOthers: false,
          onChange: (vals) => {
            applyNationalTarget(vals);
            update(true);
          },
        });
        slBox.appendChild(activeSliders.el);
      } else {
        const fd = FDMAP[state.selectedFD];
        slHeaderSpan.textContent = `${fd.name.toUpperCase()} – DISTRICT VOTE (%)`;
        activeSliders = ui.sliders(activeCands, state.fdPct[fd.id], {
          max: 98,
          step: 0.1,
          showOthers: false,
          onChange: () => {
            state.fdOverridden[fd.id] = true;
            update(true);
          },
        });
        slBox.appendChild(activeSliders.el);
        slBox.appendChild(
          el('div', { class: 'row', style: { marginTop: '10px' } }, [
            el('button', {
              class: 'btn btn-xs',
              text: `Reset ${fd.code} to 2024 Result`,
              onclick: () => {
                state.fdPct[fd.id] = clone(fd.base);
                delete state.fdOverridden[fd.id];
                rebuildSliders();
                update();
              },
            }),
            el('button', {
              class: 'btn btn-xs',
              text: '← Back to National Sliders',
              onclick: () => {
                state.selectedFD = 'ALL';
                fdSelect.value = 'ALL';
                rebuildSliders();
                update();
              },
            }),
          ])
        );
      }
    }

    /* ---- Right Column: Hero Outcome + 83-Region Map + Table ---- */
    const heroCard = ui.card('Presidential Election Outcome (50% + 1 Vote Required in Round 1)');
    L.right.appendChild(heroCard.card);
    const heroBox = el('div');
    heroCard.body.appendChild(heroBox);

    const mapCard = ui.card('83 Federal Subjects & 8 Federal Districts Map (Click Region to Edit or Paint Winner)');
    L.right.appendChild(mapCard.card);

    const toolbar = el('div', { class: 'map-toolbar' });
    const makeBrush = (id, label, color) => {
      const b = el(
        'button',
        { class: 'paint-chip' + (state.brush === id ? ' active' : ''), style: { '--c': color } },
        [id !== 'edit' && id !== 'reset' ? el('span', { class: 'swatch', style: { background: color } }) : null, label]
      );
      b.addEventListener('click', () => {
        if (id === 'reset') {
          state.subjectOverrides = {};
          update();
          return;
        }
        state.brush = id;
        toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      });
      return b;
    };
    toolbar.appendChild(makeBrush('edit', '🎛️ Select Federal District %', '#5b8cff'));
    CANDIDATES.filter((c) => state.active[c.id]).forEach((c) => {
      toolbar.appendChild(makeBrush(c.id, c.name.split(' ').pop(), c.color));
    });
    toolbar.appendChild(makeBrush('reset', '↺ Clear Painted Regions', '#ffffff'));
    mapCard.body.appendChild(toolbar);

    const mapWrap = el('div', { class: 'map-wrap' });
    mapCard.body.appendChild(mapWrap);

    const fdTableCard = ui.card('Results by Federal District & Candidate Breakdown');
    L.right.appendChild(fdTableCard.card);
    const fdTableGrid = el('div', { class: 'grid2' });
    const fdBox = el('div');
    const candTblBox = el('div');
    fdTableGrid.appendChild(fdBox);
    fdTableGrid.appendChild(candTblBox);
    fdTableCard.body.appendChild(fdTableGrid);

    // Build SVG Map of Russia (83 Federal Subjects) using Russia-centered Conic Equal-Area projection
    const tip = ui.tooltip();
    const W = 760, H = 400;
    const svg = d3.select(mapWrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoConicEqualArea().rotate([-100, 0]).parallels([50, 70]).fitExtent([[14, 14], [W - 14, H - 14]], window.GEO_RU);
    const path = d3.geoPath(proj);

    const subjPaths = svg.append('g')
      .selectAll('path')
      .data(window.GEO_RU.features)
      .join('path')
      .attr('class', 'unit')
      .attr('d', path)
      .on('click', (e, d) => {
        const sid = d.properties.id;
        const fdId = classifySubjectToFD(d.properties.name);
        if (state.brush === 'edit') {
          state.selectedFD = fdId;
          fdSelect.value = fdId;
          rebuildSliders();
          update();
        } else {
          state.subjectOverrides[sid] = state.brush;
          update();
        }
        if (ES.sfx) ES.sfx.click();
      })
      .on('mouseenter', (e, d) => {
        const sid = d.properties.id;
        const name = d.properties.name;
        const fdId = classifySubjectToFD(name);
        const fd = FDMAP[fdId];
        const pcts = state.fdPct[fdId];
        const ov = state.subjectOverrides[sid];
        const rows = CANDIDATES.filter((c) => state.active[c.id])
          .sort((a, b) => (pcts[b.id] || 0) - (pcts[a.id] || 0))
          .map((c) => `<tr><td><span style="color:${c.color}">■</span> ${c.name}</td><td style="text-align:right"><b>${fmt(pcts[c.id] || 0, 1)}%</b></td></tr>`)
          .join('');
        tip.show(
          e,
          `<b>${name}</b><br><span class="muted">${fd.name}</span>` +
          (ov ? `<br><span class="badge">Painted Winner: ${CMAP[ov].name}</span>` : '') +
          `<table>${rows}</table><div class="muted small">Click to ${state.brush === 'edit' ? 'edit Federal District sliders' : 'paint ' + CMAP[state.brush].name}</div>`
        );
      })
      .on('mousemove', (e) => tip.move(e))
      .on('mouseleave', () => tip.hide());

    function update(fromSliders) {
      const res = computePresidential();
      const { ranked, top1, top2, outrightR1, r2A, r2B, winner } = res;

      if (!fromSliders && state.selectedFD === 'ALL' && activeSliders) {
        const natMap = {};
        ranked.forEach((c) => (natMap[c.id] = c.r1));
        activeSliders.setValues(natMap);
      }

      // Color 83 Federal Subjects
      subjPaths
        .attr('fill', (d) => {
          const ov = state.subjectOverrides[d.properties.id];
          if (ov && CMAP[ov]) return CMAP[ov].color;
          const fdId = classifySubjectToFD(d.properties.name);
          return strongestInFD(fdId).cand.color;
        })
        .classed('override', (d) => !!state.subjectOverrides[d.properties.id]);

      // Hero Box
      heroBox.innerHTML = '';
      const candsGrid = el('div', { class: 'cands', style: { marginBottom: '12px' } });
      [
        { c: top1, r2: r2A },
        { c: top2, r2: r2B },
      ].forEach(({ c, r2 }) => {
        const isWin = winner.id === c.id;
        candsGrid.appendChild(
          el('div', { class: 'cand' + (isWin ? ' win' : ''), style: { '--c': c.color } }, [
            el('div', { class: 'cname', text: c.name }),
            el('div', { class: 'cparty', text: `${c.party} · Round 1: ${fmt(c.r1, 2)}%` }),
            el('div', { class: 'cval', style: { color: c.color }, text: outrightR1 ? `${fmt(c.r1, 2)}%` : `${fmt(r2, 1)}% (R2)` }),
            el('div', { class: 'row' }, [
              isWin
                ? el('span', { class: 'badge', text: outrightR1 ? 'ELECTED IN ROUND 1 (>50%)' : 'ELECTED IN ROUND 2 RUNOFF' })
                : el('span', { class: 'badge out', text: outrightR1 ? 'DEFEATED IN ROUND 1' : 'RUNNER-UP IN ROUND 2' }),
            ]),
          ])
        );
      });
      heroBox.appendChild(candsGrid);

      const barPctA = outrightR1 ? top1.r1 : r2A;
      const barPctB = outrightR1 ? 100 - top1.r1 : r2B;
      heroBox.appendChild(
        el('div', { class: 'seatbar-wrap' }, [
          el('div', { class: 'seatbar' }, [
            el('div', { class: 'seg', style: { width: barPctA + '%', background: top1.color, color: textOn(top1.color) }, text: `${top1.name.split(' ').pop()} ${fmt(barPctA, 1)}%` }),
            el('div', { class: 'seg', style: { width: barPctB + '%', background: outrightR1 ? '#334155' : top2.color, color: '#fff' }, text: outrightR1 ? `All Others ${fmt(barPctB, 1)}%` : `${top2.name.split(' ').pop()} ${fmt(barPctB, 1)}%` }),
            el('div', { class: 'majline', style: { left: '50%' } }),
          ]),
          el('div', { class: 'seatbar-label', text: outrightR1 ? `Round 1 Majority Threshold: 50.0% (${top1.name} wins outright in Round 1)` : `Second Round Runoff triggered (<50% in Round 1): ${top1.name} vs ${top2.name}` }),
        ])
      );

      // Federal Districts Table
      fdBox.innerHTML = '';
      const fdRows = FED_DISTRICTS.map((fd) => {
        const lead = strongestInFD(fd.id);
        return el('tr', {
          style: { cursor: 'pointer', background: state.selectedFD === fd.id ? 'rgba(91,140,255,0.16)' : '' },
          onclick: () => {
            state.selectedFD = fd.id;
            fdSelect.value = fd.id;
            rebuildSliders();
            update();
          },
        }, [
          el('td', {}, [el('span', { class: 'swatch', style: { background: lead.cand.color } }), el('span', { text: `${fd.code} · ${fd.name.split(' (')[0]}` })]),
          el('td', { class: 'num muted', text: `${fd.weight}%` }),
          el('td', { class: 'num', html: `<b style="color:${lead.cand.color}">${lead.cand.name.split(' ').pop()}</b> ${fmt(lead.pct, 1)}%` }),
        ]);
      });
      fdBox.appendChild(
        el('table', { class: 'results' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Federal District (Click)' }), el('th', { text: 'Weight' }), el('th', { text: 'Leader' })])),
          el('tbody', {}, fdRows),
        ])
      );

      // Candidates Table
      candTblBox.innerHTML = '';
      const cRows = ranked.map((c, idx) => ({
        color: c.color,
        name: c.name,
        leader: c.party,
        r1: c.r1,
        status: outrightR1
          ? (idx === 0 ? '<span class="ok">Elected R1</span>' : '<span class="muted">Defeated</span>')
          : (idx < 2 ? '<span class="ok">Runoff R2</span>' : '<span class="no">Eliminated</span>'),
      }));
      candTblBox.appendChild(
        ui.resultsTable(cRows, {
          nameLabel: 'Candidate & Party',
          columns: [
            { key: 'r1', label: 'Round 1 %', fmt: (v) => `<b>${fmt(v, 2)}%</b>` },
            { key: 'status', label: 'Status' },
          ],
        })
      );
    }

    rebuildSliders();
    update();
  }

  ES.register({
    id: 'russia',
    name: 'Russia',
    flag: '🇷🇺',
    title: 'Russia – 2024 Presidential Election',
    subtitle: 'Two-Round System (>50% in Round 1) · 83 Federal Subjects & 8 Federal Districts',
    render,
  });
})();
