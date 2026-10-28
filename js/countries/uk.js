/* =========================================================================
   United Kingdom – Parliament & Elections Simulator
   Covers:
   - 2024 General Election (Keir Starmer Labour landslide, 650 constituencies, FPTP)
   - 2019 General Election (Boris Johnson "Get Brexit Done" 80-seat majority)
   - 1997 General Election (Tony Blair "New Labour" 179-seat landslide)
   - 2022 July–September Conservative Party Leadership Election
     (Liz Truss vs Rishi Sunak vs Penny Mordaunt vs Kemi Badenoch, toggleable candidates,
      interactive percentage sliders, MP ballot rounds 1–5, and final membership postal vote)
   ========================================================================= */
(function () {
  'use strict';

  const { el, fmt, fmtInt, clone, shade, textOn, ranked, argmax } = ES.util;
  const ui = ES.ui;

  /* --------------------------------------------------------------------- */
  /* Inject UK-specific styles once                                        */
  /* --------------------------------------------------------------------- */
  if (!document.getElementById('es-uk-style')) {
    const st = document.createElement('style');
    st.id = 'es-uk-style';
    st.textContent = `
      .uk-year-bar { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
      .uk-year-btn { background: var(--bg2); color: var(--muted); border: 1px solid var(--line); border-radius: 7px; padding: 5px 9px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.15s; }
      .uk-year-btn:hover { color: var(--text); border-color: var(--accent); }
      .uk-year-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .uk-year-btn.contest { border-style: dashed; }
      .uk-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin: 10px 0; }
      .uk-kpi { background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; }
      .uk-kpi .k-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; }
      .uk-kpi .k-val { font-size: 15px; font-weight: 700; margin-top: 2px; }
      .uk-map-layout { display: grid; grid-template-columns: 1fr 220px; gap: 12px; align-items: start; }
      @media (max-width: 1180px) { .uk-map-layout { grid-template-columns: 1fr; } }
      .uk-hex-svg { width: 100%; height: auto; max-height: 760px; display: block; margin: 0 auto; user-select: none; }
      .uk-hex-svg path.unit { stroke: var(--card); stroke-width: 3.2; transition: opacity 0.12s; cursor: pointer; }
      .uk-hex-svg path.unit:hover { stroke: var(--heading); stroke-width: 9; filter: brightness(1.15); }
      .uk-hex-svg path.unit.override { stroke: var(--heading); stroke-width: 7; stroke-dasharray: 12 6; }
      .uk-hex-svg path.unit.dimmed { opacity: 0.16; }
      .uk-hex-svg path.unit.search-hit { stroke: var(--heading); stroke-width: 10; }
      .uk-hex-svg path.reg-boundary { fill: none; stroke: rgba(15,23,42,0.42); stroke-width: 5.5; pointer-events: none; stroke-linecap: round; stroke-linejoin: round; }
      .uk-side-panel { display: flex; flex-direction: column; gap: 10px; background: var(--bg2); border: 1px solid var(--line); border-radius: 10px; padding: 10px; }
      .uk-search-input { width: 100%; background: var(--card); color: var(--text); border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; font-size: 12.5px; outline: none; }
      .uk-search-input:focus { border-color: var(--accent); }
      .uk-seat-list { max-height: 410px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 2px; }
      .uk-seat-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 5px 7px; border-radius: 6px; background: var(--card); border: 1px solid transparent; cursor: pointer; font-size: 11.5px; text-align: left; color: var(--text); }
      .uk-seat-item:hover { border-color: var(--accent); background: var(--card2); }
      .uk-seat-item .sname { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .uk-seat-item .smeta { font-size: 10.5px; color: var(--muted); white-space: nowrap; }
      .uk-diff-pos { color: var(--ok); font-size: 11px; margin-left: 4px; }
      .uk-diff-neg { color: var(--bad); font-size: 11px; margin-left: 4px; }
      .uk-superline { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #ffb547; box-shadow: 0 0 0 1px rgba(0,0,0,0.5); }

      /* Tory Leadership Roster Styles */
      .uk-cand-roster { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 10px; margin-top: 10px; }
      .uk-cand-card { background: var(--bg2); border: 1px solid var(--line); border-radius: 9px; padding: 12px; display: flex; flex-direction: column; gap: 8px; transition: 0.18s; position: relative; }
      .uk-cand-card.eliminated { opacity: 0.52; filter: grayscale(0.65); border-style: dashed; }
      .uk-cand-card.winner { border-color: var(--gold, #f59e0b); box-shadow: 0 0 14px rgba(245, 158, 11, 0.22); }
      .uk-cand-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .uk-cand-info { display: flex; align-items: center; gap: 9px; min-width: 0; }
      .uk-cand-names { min-width: 0; }
      .uk-cand-name { font-weight: 700; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .uk-cand-role { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .uk-cand-toggle { cursor: pointer; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 700; border: 1px solid var(--line); background: var(--card); transition: 0.15s; flex-shrink: 0; }
      .uk-cand-toggle.active { background: var(--ok, #10b981); color: #fff; border-color: var(--ok, #10b981); }
      .uk-cand-toggle.elim { background: var(--bg); color: var(--muted); }
      .uk-cand-wing { font-size: 10.5px; font-weight: 600; color: var(--accent); background: rgba(59,130,246,0.1); border-radius: 5px; padding: 2px 6px; align-self: flex-start; }
      .uk-cand-trail { display: flex; flex-wrap: wrap; gap: 4px; font-size: 10.5px; color: var(--muted); }
      .uk-cand-trail span { background: var(--card); border: 1px solid var(--line); border-radius: 4px; padding: 1px 5px; }
      .uk-cand-meter { display: flex; justify-content: space-between; align-items: baseline; font-weight: 700; margin-top: 2px; }
      .uk-stage-bar { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
      .uk-stage-btn { background: var(--card); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 4px 8px; font-size: 11.5px; font-weight: 600; cursor: pointer; transition: 0.15s; }
      .uk-stage-btn:hover { border-color: var(--accent); }
      .uk-stage-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

      /* Inline Candidate Percentage Slider on Cards */
      .uk-cand-slider-box { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--line); }
      .uk-cand-slider-head { display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px; color: var(--muted); font-weight: 600; }
      .uk-cand-slider-row { display: flex; align-items: center; gap: 8px; }
      .uk-cand-range { flex: 1; height: 6px; -webkit-appearance: none; appearance: none; background: var(--track-bg, #2a3346); border-radius: 3px; outline: none; cursor: pointer; }
      .uk-cand-range::-webkit-slider-thumb { -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%; background: var(--c, #3b82f6); border: 2px solid #fff; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
      .uk-cand-num { width: 62px; background: var(--card); border: 1px solid var(--line); border-radius: 5px; color: var(--text); padding: 3px 6px; font-size: 11.5px; font-weight: 700; text-align: right; }
    `;
    document.head.appendChild(st);
  }

  /* --------------------------------------------------------------------- */
  /* Historical Scenarios Metadata                                         */
  /* --------------------------------------------------------------------- */
  const SCENARIOS = {
    '2024': {
      id: '2024',
      label: '2024 General',
      fullTitle: '2024 UK General Election (July 2024)',
      type: 'general',
      totalSeats: 650,
      majority: 326,
      turnout: '59.8%',
      pmOutcome: 'Keir Starmer (Labour majority, 411 seats)',
      summary: 'Keir Starmer led Labour to an overwhelming 174-seat House of Commons majority, ending 14 years of Conservative government. The Conservative vote collapsed from 43.6% to 23.7%, losing 251 seats as the right-of-center vote split with Nigel Farage\'s Reform UK.',
      parties: [
        { id: 'lab', name: 'Labour', short: 'Lab', leader: 'Keir Starmer', color: '#E4003B', votes: 33.7, actualSeats: 411, gb: true },
        { id: 'con', name: 'Conservative', short: 'Con', leader: 'Rishi Sunak', color: '#0087DC', votes: 23.7, actualSeats: 121, gb: true },
        { id: 'ref', name: 'Reform UK', short: 'Ref', leader: 'Nigel Farage', color: '#12B6CF', votes: 14.3, actualSeats: 5, gb: true },
        { id: 'ld', name: 'Liberal Democrats', short: 'LD', leader: 'Ed Davey', color: '#FAA61A', votes: 12.2, actualSeats: 72, gb: true },
        { id: 'green', name: 'Green Party', short: 'Grn', leader: 'Carla Denyer & Adrian Ramsay', color: '#02A95B', votes: 6.7, actualSeats: 4, gb: true },
        { id: 'snp', name: 'Scottish National Party', short: 'SNP', leader: 'John Swinney', color: '#FDF38E', votes: 2.5, actualSeats: 9, reg: 'S92000003', regScale: 11.5 },
        { id: 'pc', name: 'Plaid Cymru', short: 'PC', leader: 'Rhun ap Iorwerth', color: '#005B54', votes: 0.7, actualSeats: 4, reg: 'W92000004', regScale: 21.5 },
        { id: 'sf', name: 'Sinn Féin', short: 'SF', leader: 'Mary Lou McDonald', color: '#326760', votes: 0.7, actualSeats: 7, reg: 'N92000002', regScale: 36.0 },
        { id: 'dup', name: 'DUP', short: 'DUP', leader: 'Gavin Robinson', color: '#D46A4C', votes: 0.6, actualSeats: 5, reg: 'N92000002', regScale: 36.0 },
        { id: 'apni', name: 'Alliance', short: 'All', leader: 'Naomi Long', color: '#F6CB2F', votes: 0.4, actualSeats: 1, reg: 'N92000002', regScale: 36.0 },
        { id: 'sdlp', name: 'SDLP', short: 'SDLP', leader: 'Colum Eastwood', color: '#2AA82C', votes: 0.3, actualSeats: 2, reg: 'N92000002', regScale: 36.0 },
        { id: 'uup', name: 'UUP', short: 'UUP', leader: 'Doug Beattie', color: '#48A5EE', votes: 0.3, actualSeats: 1, reg: 'N92000002', regScale: 36.0 },
        { id: 'tuv', name: 'TUV', short: 'TUV', leader: 'Jim Allister', color: '#0C3A6A', votes: 0.2, actualSeats: 1, reg: 'N92000002', regScale: 36.0 },
        { id: 'speaker', name: 'Speaker', short: 'Spk', leader: 'Lindsay Hoyle', color: '#9aa3b5', votes: 0.1, actualSeats: 1 },
        { id: 'other', name: 'Independents & Others', short: 'Ind/Oth', leader: 'Jeremy Corbyn & Others', color: '#8a8f99', votes: 3.6, actualSeats: 6, gb: true },
      ],
    },
    '2019': {
      id: '2019',
      label: '2019 General',
      fullTitle: '2019 UK General Election (December 2019)',
      type: 'general',
      totalSeats: 650,
      majority: 326,
      turnout: '67.3%',
      pmOutcome: 'Boris Johnson (Conservative majority, 365 seats)',
      summary: 'Boris Johnson campaigned on the slogan "Get Brexit Done", winning an 80-seat majority—the Conservatives\' largest parliamentary majority since Margaret Thatcher in 1987—by demolishing Labour\'s historic "Red Wall" across the North, Midlands, and Wales.',
      parties: [
        { id: 'con', name: 'Conservative', short: 'Con', leader: 'Boris Johnson', color: '#0087DC', votes: 43.6, actualSeats: 365, notional2024: 372, gb: true },
        { id: 'lab', name: 'Labour', short: 'Lab', leader: 'Jeremy Corbyn', color: '#E4003B', votes: 32.1, actualSeats: 202, notional2024: 200, gb: true },
        { id: 'ld', name: 'Liberal Democrats', short: 'LD', leader: 'Jo Swinson', color: '#FAA61A', votes: 11.5, actualSeats: 11, notional2024: 8, gb: true },
        { id: 'snp', name: 'Scottish National Party', short: 'SNP', leader: 'Nicola Sturgeon', color: '#FDF38E', votes: 3.9, actualSeats: 48, notional2024: 48, reg: 'S92000003', regScale: 11.5 },
        { id: 'green', name: 'Green Party', short: 'Grn', leader: 'Jonathan Bartley & Siân Berry', color: '#02A95B', votes: 2.7, actualSeats: 1, notional2024: 1, gb: true },
        { id: 'ref', name: 'Brexit Party', short: 'Brexit', leader: 'Nigel Farage', color: '#12B6CF', votes: 2.0, actualSeats: 0, notional2024: 0, gb: true },
        { id: 'pc', name: 'Plaid Cymru', short: 'PC', leader: 'Adam Price', color: '#005B54', votes: 0.5, actualSeats: 4, notional2024: 2, reg: 'W92000004', regScale: 21.5 },
        { id: 'dup', name: 'DUP', short: 'DUP', leader: 'Arlene Foster', color: '#D46A4C', votes: 0.5, actualSeats: 8, notional2024: 8, reg: 'N92000002', regScale: 36.0 },
        { id: 'sf', name: 'Sinn Féin', short: 'SF', leader: 'Mary Lou McDonald', color: '#326760', votes: 0.5, actualSeats: 7, notional2024: 7, reg: 'N92000002', regScale: 36.0 },
        { id: 'apni', name: 'Alliance', short: 'All', leader: 'Naomi Long', color: '#F6CB2F', votes: 0.4, actualSeats: 1, notional2024: 1, reg: 'N92000002', regScale: 36.0 },
        { id: 'sdlp', name: 'SDLP', short: 'SDLP', leader: 'Colum Eastwood', color: '#2AA82C', votes: 0.4, actualSeats: 2, notional2024: 2, reg: 'N92000002', regScale: 36.0 },
        { id: 'uup', name: 'UUP', short: 'UUP', leader: 'Steve Aiken', color: '#48A5EE', votes: 0.3, actualSeats: 0, notional2024: 0, reg: 'N92000002', regScale: 36.0 },
        { id: 'speaker', name: 'Speaker', short: 'Spk', leader: 'Lindsay Hoyle', color: '#9aa3b5', votes: 0.1, actualSeats: 1, notional2024: 1 },
        { id: 'other', name: 'Independents & Others', short: 'Ind/Oth', leader: 'Various', color: '#8a8f99', votes: 1.5, actualSeats: 1, notional2024: 0, gb: true },
      ],
    },
    '1997': {
      id: '1997',
      label: '1997 General',
      fullTitle: '1997 UK General Election (May 1997)',
      type: 'general',
      totalSeats: 650,
      majority: 326,
      turnout: '71.4%',
      pmOutcome: 'Tony Blair (Labour majority, 418 seats)',
      summary: 'Tony Blair\'s modernized "New Labour" swept to power in a historic landslide victory, winning 418 seats (a majority of 179) and ending 18 consecutive years of Conservative rule under Margaret Thatcher and John Major. The Conservatives were completely wiped out in Scotland and Wales.',
      parties: [
        { id: 'lab', name: 'Labour', short: 'Lab', leader: 'Tony Blair', color: '#E4003B', votes: 43.2, actualSeats: 418, gb: true },
        { id: 'con', name: 'Conservative', short: 'Con', leader: 'John Major', color: '#0087DC', votes: 30.7, actualSeats: 165, gb: true },
        { id: 'ld', name: 'Liberal Democrats', short: 'LD', leader: 'Paddy Ashdown', color: '#FAA61A', votes: 16.8, actualSeats: 46, gb: true },
        { id: 'ref', name: 'Referendum Party', short: 'Ref', leader: 'James Goldsmith', color: '#12B6CF', votes: 3.1, actualSeats: 0, gb: true },
        { id: 'snp', name: 'Scottish National Party', short: 'SNP', leader: 'Alex Salmond', color: '#FDF38E', votes: 2.0, actualSeats: 6, reg: 'S92000003', regScale: 11.5 },
        { id: 'uup', name: 'UUP', short: 'UUP', leader: 'David Trimble', color: '#48A5EE', votes: 0.8, actualSeats: 10, reg: 'N92000002', regScale: 36.0 },
        { id: 'sdlp', name: 'SDLP', short: 'SDLP', leader: 'John Hume', color: '#2AA82C', votes: 0.6, actualSeats: 3, reg: 'N92000002', regScale: 36.0 },
        { id: 'pc', name: 'Plaid Cymru', short: 'PC', leader: 'Dafydd Wigley', color: '#005B54', votes: 0.5, actualSeats: 4, reg: 'W92000004', regScale: 21.5 },
        { id: 'sf', name: 'Sinn Féin', short: 'SF', leader: 'Gerry Adams', color: '#326760', votes: 0.4, actualSeats: 2, reg: 'N92000002', regScale: 36.0 },
        { id: 'dup', name: 'DUP', short: 'DUP', leader: 'Ian Paisley', color: '#D46A4C', votes: 0.3, actualSeats: 2, reg: 'N92000002', regScale: 36.0 },
        { id: 'green', name: 'Green Party', short: 'Grn', leader: 'Peg Alexander', color: '#02A95B', votes: 0.3, actualSeats: 0, gb: true },
        { id: 'speaker', name: 'Speaker', short: 'Spk', leader: 'Betty Boothroyd', color: '#9aa3b5', votes: 0.1, actualSeats: 1 },
        { id: 'other', name: 'Independents & Others', short: 'Ind/Oth', leader: 'Martin Bell & Others', color: '#8a8f99', votes: 1.2, actualSeats: 3, gb: true },
      ],
    },
    '2022_tory': {
      id: '2022_tory',
      label: '2022 Tory Leadership',
      fullTitle: 'July–September 2022 Conservative Leadership Election',
      type: 'leadership',
      totalSeats: 358,
      majority: 180,
      turnout: '82.2% (141,725 member votes)',
      pmOutcome: 'Liz Truss (57.4% member vote vs Rishi Sunak 42.6%)',
      summary: 'Triggered by Boris Johnson\'s resignation on July 7, 2022. Eight candidates contested five parliamentary ballot rounds among 358 Conservative MPs, after which Liz Truss and Rishi Sunak advanced to a nationwide postal vote of 172,437 party members.',
      candidates: [
        {
          id: 'truss',
          name: 'Liz Truss',
          office: 'Foreign Secretary',
          wing: 'Free Enterprise · Low Tax Thatcherite',
          color: '#0087DC',
          mpVotesR1: 50,
          mpVotesR2: 64,
          mpVotesR3: 71,
          mpVotesR4: 86,
          mpVotesR5: 113,
          memberVotes: 81326,
          memberPct: 57.4,
          eliminatedRound: null,
          transferAffinities: { sunak: 0.25, mordaunt: 0.35, badenoch: 0.25, braverman: 0.15 },
        },
        {
          id: 'sunak',
          name: 'Rishi Sunak',
          office: 'Former Chancellor of the Exchequer',
          wing: 'One Nation · Fiscal Discipline & Sound Money',
          color: '#1e3a8a',
          mpVotesR1: 88,
          mpVotesR2: 101,
          mpVotesR3: 115,
          mpVotesR4: 118,
          mpVotesR5: 137,
          memberVotes: 60399,
          memberPct: 42.6,
          eliminatedRound: null,
          transferAffinities: { truss: 0.25, mordaunt: 0.40, tugendhat: 0.20, hunt: 0.15 },
        },
        {
          id: 'mordaunt',
          name: 'Penny Mordaunt',
          office: 'Minister of State for Trade Policy',
          wing: 'Broad-Church Patriotic · Defense & Unity',
          color: '#0284c7',
          mpVotesR1: 67,
          mpVotesR2: 83,
          mpVotesR3: 82,
          mpVotesR4: 92,
          mpVotesR5: 105,
          memberVotes: null,
          memberPct: 48.0,
          eliminatedRound: 5,
          transferAffinities: { truss: 0.52, sunak: 0.48 },
        },
        {
          id: 'badenoch',
          name: 'Kemi Badenoch',
          office: 'Former Equalities & Local Govt Minister',
          wing: 'Grassroots Right · Anti-Woke & Small State',
          color: '#7c3aed',
          mpVotesR1: 40,
          mpVotesR2: 49,
          mpVotesR3: 58,
          mpVotesR4: 59,
          mpVotesR5: 0,
          memberVotes: null,
          memberPct: null,
          eliminatedRound: 4,
          transferAffinities: { truss: 0.62, mordaunt: 0.22, sunak: 0.16 },
        },
        {
          id: 'tugendhat',
          name: 'Tom Tugendhat',
          office: 'Foreign Affairs Committee Chair',
          wing: 'Centrist One Nation · Military Veteran',
          color: '#059669',
          mpVotesR1: 37,
          mpVotesR2: 32,
          mpVotesR3: 31,
          mpVotesR4: 0,
          mpVotesR5: 0,
          memberVotes: null,
          memberPct: null,
          eliminatedRound: 3,
          transferAffinities: { sunak: 0.48, mordaunt: 0.36, truss: 0.16 },
        },
        {
          id: 'braverman',
          name: 'Suella Braverman',
          office: 'Attorney General for England and Wales',
          wing: 'European Research Group (ERG) · Tough on Borders',
          color: '#dc2626',
          mpVotesR1: 32,
          mpVotesR2: 27,
          mpVotesR3: 0,
          mpVotesR4: 0,
          mpVotesR5: 0,
          memberVotes: null,
          memberPct: null,
          eliminatedRound: 2,
          transferAffinities: { truss: 0.65, badenoch: 0.22, mordaunt: 0.08, sunak: 0.05 },
        },
        {
          id: 'zahawi',
          name: 'Nadhim Zahawi',
          office: 'Chancellor of the Exchequer (appointed July)',
          wing: 'Pro-Enterprise · Low Corporation Tax',
          color: '#d97706',
          mpVotesR1: 25,
          mpVotesR2: 0,
          mpVotesR3: 0,
          mpVotesR4: 0,
          mpVotesR5: 0,
          memberVotes: null,
          memberPct: null,
          eliminatedRound: 1,
          transferAffinities: { truss: 0.38, sunak: 0.32, mordaunt: 0.30 },
        },
        {
          id: 'hunt',
          name: 'Jeremy Hunt',
          office: 'Former Foreign & Health Secretary',
          wing: 'One Nation Traditionalist · Fiscal Pragmatism',
          color: '#64748b',
          mpVotesR1: 18,
          mpVotesR2: 0,
          mpVotesR3: 0,
          mpVotesR4: 0,
          mpVotesR5: 0,
          memberVotes: null,
          memberPct: null,
          eliminatedRound: 1,
          transferAffinities: { sunak: 0.60, mordaunt: 0.25, tugendhat: 0.10, truss: 0.05 },
        },
      ],
    },
  };

  /* --------------------------------------------------------------------- */
  /* Stage Baseline Percentage Helper                                      */
  /* --------------------------------------------------------------------- */
  function getStageBaselinePcts(stageId) {
    const pcts = {};
    if (stageId === 'members') {
      pcts.truss = 57.4;
      pcts.sunak = 42.6;
    } else if (stageId === 'r5') {
      pcts.sunak = 38.6;
      pcts.truss = 31.8;
      pcts.mordaunt = 29.6;
    } else if (stageId === 'r4') {
      pcts.sunak = 33.1;
      pcts.mordaunt = 25.8;
      pcts.truss = 24.1;
      pcts.badenoch = 16.5;
    } else if (stageId === 'r3') {
      pcts.sunak = 32.2;
      pcts.mordaunt = 23.0;
      pcts.truss = 19.9;
      pcts.badenoch = 16.2;
      pcts.tugendhat = 8.7;
    } else if (stageId === 'r2') {
      pcts.sunak = 28.4;
      pcts.mordaunt = 23.3;
      pcts.truss = 18.0;
      pcts.badenoch = 13.8;
      pcts.tugendhat = 9.0;
      pcts.braverman = 7.6;
    } else if (stageId === 'alt_mordaunt') {
      pcts.mordaunt = 66.8;
      pcts.sunak = 33.2;
    } else if (stageId === 'alt_badenoch') {
      pcts.badenoch = 56.0;
      pcts.truss = 44.0;
    } else {
      // r1 or all
      pcts.sunak = 24.6;
      pcts.mordaunt = 18.7;
      pcts.truss = 14.0;
      pcts.badenoch = 11.2;
      pcts.tugendhat = 10.3;
      pcts.braverman = 8.9;
      pcts.zahawi = 7.0;
      pcts.hunt = 5.0;
    }
    SCENARIOS['2022_tory'].candidates.forEach((c) => {
      if (pcts[c.id] === undefined) pcts[c.id] = 0;
    });
    return pcts;
  }

  /* --------------------------------------------------------------------- */
  /* Persistent Module State                                               */
  /* --------------------------------------------------------------------- */
  let state = null;

  function initScenarioState(scenId) {
    const scen = SCENARIOS[scenId] || SCENARIOS['2024'];
    if (scen.type === 'general') {
      const defaultVotes = {};
      scen.parties.forEach((p) => { defaultVotes[p.id] = p.votes; });
      state = {
        scenId,
        type: 'general',
        votes: defaultVotes,
        baseVotes: clone(defaultVotes),
        swingMode: 'uns', // 'uns' (Uniform National Swing) | 'prop' (Proportional Swing)
        brush: 'inspect', // 'inspect' | partyId | 'reset'
        regionFilter: 'ALL',
        searchQuery: '',
        overrides: {},
        customVotes: {},
      };
    } else {
      // Conservative Leadership Contest State
      const activeCands = {};
      scen.candidates.forEach((c) => {
        // By default, stage is members ballot (Truss vs Sunak active)
        activeCands[c.id] = c.id === 'truss' || c.id === 'sunak';
      });
      const initialPcts = getStageBaselinePcts('members');
      state = {
        scenId,
        type: 'leadership',
        stage: 'members', // 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'members' | 'custom'
        electorate: 'member', // 'mp' | 'member'
        activeCandidates: activeCands,
        candidatePcts: clone(initialPcts),
        overrides: {},
        customVotes: {},
      };
    }
  }

  /* --------------------------------------------------------------------- */
  /* General Election 650-Constituency Simulation Model                    */
  /* --------------------------------------------------------------------- */
  function computeGeneralSim(scen, state) {
    const pMap = {};
    scen.parties.forEach((p) => (pMap[p.id] = p));

    const constituencies = window.UK2024?.constituencies || {};
    const baseNat = state.baseVotes;
    const curNat = state.votes;

    const seatsByParty = {};
    const voteTotals = {};
    scen.parties.forEach((p) => {
      seatsByParty[p.id] = 0;
      voteTotals[p.id] = 0;
    });

    let totalVotesCast = 0;
    let flips = 0;
    const constResults = {};

    for (const gss in constituencies) {
      const c = constituencies[gss];
      const isNI = c.reg === 'N92000002';
      const isScot = c.reg === 'S92000003';
      const isWales = c.reg === 'W92000004';

      // 1. Establish baseline local vote shares for this constituency in this scenario
      let baseLocal = {};
      let baselineWinner = c.w24;

      if (scen.id === '2024') {
        baseLocal = clone(c.v);
        baselineWinner = c.w24;
      } else if (scen.id === '2019') {
        baselineWinner = c.w19 || 'con';
        baseLocal = clone(c.v);
        if (baselineWinner === 'con' && (baseLocal.con || 0) < (baseLocal.lab || 0)) {
          const tmp = baseLocal.con || 25;
          baseLocal.con = Math.max(38, (baseLocal.lab || 30) + 6);
          baseLocal.lab = Math.max(15, tmp - 4);
        }
      } else if (scen.id === '1997') {
        // 1997 baseline: Labour swept Scotland, Wales, urban & suburban England
        if (isNI) {
          baselineWinner = gss.endsWith('1') || gss.endsWith('2') ? 'dup' : gss.endsWith('3') ? 'sf' : gss.endsWith('4') ? 'sdlp' : 'uup';
        } else if (isScot) {
          baselineWinner = (c.v.snp || 0) > 22 ? 'snp' : (c.v.ld || 0) > 25 ? 'ld' : 'lab';
        } else if (isWales) {
          baselineWinner = (c.v.pc || 0) > 20 ? 'pc' : (c.v.ld || 0) > 24 ? 'ld' : 'lab';
        } else {
          // England: Blair won 351 seats
          if (c.w24 === 'ld' || ((c.v.ld || 0) > 28 && c.reg === 'E12000009')) baselineWinner = 'ld';
          else if (c.w24 === 'speaker') baselineWinner = 'speaker';
          else if (c.w24 === 'lab' || c.w19 === 'lab' || (c.v.lab || 0) > 30) baselineWinner = 'lab';
          else baselineWinner = 'con';
        }
        baseLocal = clone(c.v);
      }

      // 2. Apply Custom Constituency Sliders OR National Swing
      let shares = {};
      const hasCustom = !!(state.customVotes && state.customVotes[gss]);

      if (hasCustom) {
        shares = clone(state.customVotes[gss]);
      } else if (c.w24 === 'speaker' && !(state.overrides && state.overrides[gss])) {
        shares = clone(baseLocal);
      } else {
        const raw = {};
        for (const p of scen.parties) {
          const pid = p.id;
          if (pid === 'speaker') {
            if (baseLocal.speaker) raw.speaker = baseLocal.speaker;
            continue;
          }
          // Regional restrictions
          if (isNI && p.gb && !baseLocal[pid]) continue;
          if (!isNI && p.reg === 'N92000002' && !baseLocal[pid]) continue;
          if (!isScot && pid === 'snp' && !baseLocal[pid]) continue;
          if (!isWales && pid === 'pc' && !baseLocal[pid]) continue;

          const bLoc = baseLocal[pid] || (baselineWinner === pid ? 38 : 3.0);
          const bNat = baseNat[pid] || 1.0;
          const cNat = curNat[pid] !== undefined ? curNat[pid] : bNat;
          const delta = cNat - bNat;
          const scale = p.regScale || 1.0;

          if (state.swingMode === 'prop') {
            raw[pid] = Math.max(0, bLoc * (cNat / bNat));
          } else {
            raw[pid] = Math.max(0, bLoc + delta * scale);
          }
        }

        const rawSum = Object.values(raw).reduce((a, b) => a + b, 0);
        if (rawSum > 0) {
          for (const k in raw) shares[k] = (raw[k] / rawSum) * 100;
        } else {
          shares = clone(baseLocal);
        }
      }

      // Rank local candidates
      const rankedLocal = Object.entries(shares).sort((a, b) => b[1] - a[1]);
      let winner = rankedLocal[0] ? rankedLocal[0][0] : baselineWinner;
      const runnerUp = rankedLocal[1] ? rankedLocal[1][0] : 'con';
      const margin = rankedLocal[0] && rankedLocal[1] ? rankedLocal[0][1] - rankedLocal[1][1] : 0;

      const forcedWinner = state.overrides && state.overrides[gss];
      if (forcedWinner) winner = forcedWinner;

      seatsByParty[winner] = (seatsByParty[winner] || 0) + 1;
      if (winner !== baselineWinner) flips++;

      const electorate = c.el || 72000;
      const turnPct = parseFloat(scen.turnout) || 60;
      const totVotes = c.tot || Math.round((electorate * turnPct) / 100);
      totalVotesCast += totVotes;

      for (const pid in shares) {
        voteTotals[pid] = (voteTotals[pid] || 0) + (shares[pid] / 100) * totVotes;
      }

      constResults[gss] = {
        gss,
        c,
        baselineWinner,
        shares,
        ranked: rankedLocal,
        winner,
        runnerUp,
        margin,
        isOverride: !!(forcedWinner || hasCustom),
        forcedWinner: forcedWinner || null,
        hasCustom,
      };
    }

    const votePct = {};
    for (const pid in voteTotals) {
      votePct[pid] = totalVotesCast > 0 ? (voteTotals[pid] / totalVotesCast) * 100 : 0;
    }

    return {
      scen,
      pMap,
      seatsByParty,
      votePct,
      constResults,
      flips,
      totalVotesCast,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Conservative Leadership Contest Simulation Model                      */
  /* --------------------------------------------------------------------- */
  function computeLeadershipSim(scen, state) {
    const candidates = scen.candidates;
    const cMap = {};
    candidates.forEach((c) => (cMap[c.id] = c));

    const isMemberMode = state.electorate === 'member';
    const activeCands = candidates.filter((c) => state.activeCandidates[c.id]);

    // Calculate sum of raw percentages set by user sliders/inputs
    let rawTotalPct = 0;
    activeCands.forEach((c) => {
      rawTotalPct += Math.max(0, +state.candidatePcts[c.id] || 0);
    });

    const pcts = {};
    const votes = {};
    const totalElectorate = isMemberMode ? 141725 : 358;

    candidates.forEach((c) => {
      if (state.activeCandidates[c.id]) {
        const raw = Math.max(0, +state.candidatePcts[c.id] || 0);
        // Normalize percentage to 100% across all active candidates
        const norm = rawTotalPct > 0 ? (raw / rawTotalPct) * 100 : (100 / (activeCands.length || 1));
        pcts[c.id] = norm;
        votes[c.id] = Math.round((norm / 100) * totalElectorate);
      } else {
        pcts[c.id] = 0;
        votes[c.id] = 0;
      }
    });

    const rankedCands = activeCands.slice().sort((a, b) => (pcts[b.id] || 0) - (pcts[a.id] || 0));
    const winner = rankedCands[0] || candidates[0];
    const runnerUp = rankedCands[1] || null;
    const margin = runnerUp ? (votes[winner.id] || 0) - (votes[runnerUp.id] || 0) : votes[winner.id] || 0;
    const marginPct = runnerUp ? (pcts[winner.id] || 0) - (pcts[runnerUp.id] || 0) : pcts[winner.id] || 0;

    return {
      scen,
      cMap,
      votes,
      pcts,
      rankedCands,
      winner,
      runnerUp,
      margin,
      marginPct,
      totalActiveVotes: totalElectorate,
      isMemberMode,
      rawTotalPct,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Render View                                                           */
  /* --------------------------------------------------------------------- */
  function render(root) {
    if (!state) initScenarioState('2024');
    root.innerHTML = '';

    const scen = SCENARIOS[state.scenId] || SCENARIOS['2024'];
    const L = ui.layout();
    root.appendChild(L.root);

    /* =================================================================== */
    /* LEFT COLUMN: Scenario Selector, Sliders, Rules / Candidates         */
    /* =================================================================== */

    // 1. Election Year & Scenario Switcher Card (mirrors Hungary!)
    const scenCard = ui.card('Election Year & Contest (1997 – 2024)');
    L.left.appendChild(scenCard.card);

    const yearBar = el('div', { class: 'uk-year-bar' });
    Object.values(SCENARIOS).forEach((s) => {
      const btn = el('button', {
        class: 'uk-year-btn' + (s.id === state.scenId ? ' active' : '') + (s.type === 'leadership' ? ' contest' : ''),
        text: s.label,
        title: s.fullTitle,
        onclick: () => {
          initScenarioState(s.id);
          render(root);
        },
      });
      yearBar.appendChild(btn);
    });
    scenCard.body.appendChild(yearBar);

    const scenSelect = ui.select(
      Object.values(SCENARIOS).map((s) => ({ value: s.id, label: s.fullTitle })),
      state.scenId,
      (val) => {
        initScenarioState(val);
        render(root);
      }
    );
    scenSelect.style.width = '100%';
    scenCard.body.appendChild(scenSelect);

    const metaGrid = el('div', { class: 'uk-meta' }, [
      el('div', { class: 'uk-kpi' }, [
        el('div', { class: 'k-lbl', text: scen.type === 'general' ? 'System & Seats' : 'Electorate' }),
        el('div', { class: 'k-val', text: scen.type === 'general' ? `${scen.totalSeats} seats (FPTP)` : '358 MPs / 172k Members' }),
      ]),
      el('div', { class: 'uk-kpi' }, [
        el('div', { class: 'k-lbl', text: 'Turnout' }),
        el('div', { class: 'k-val', text: scen.turnout }),
      ]),
      el('div', { class: 'uk-kpi' }, [
        el('div', { class: 'k-lbl', text: 'Majority Line' }),
        el('div', { class: 'k-val', text: `${scen.majority} ${scen.type === 'general' ? 'seats' : 'MPs (50%)'}` }),
      ]),
    ]);
    scenCard.body.appendChild(metaGrid);
    scenCard.body.appendChild(
      ui.note(`<b>${scen.fullTitle}:</b> ${scen.summary}<br><span class="muted">Historical Outcome: <b>${scen.pmOutcome}</b></span>`, 'info')
    );

    /* ------------------------------------------------------------------- */
    /* GENERAL ELECTION MODE: Left Controls (2024, 2019, 1997)             */
    /* ------------------------------------------------------------------- */
    let generalSliderCtrl = null;
    let leadershipSliderCtrl = null;

    if (scen.type === 'general') {
      const resetNatBtn = el('button', {
        class: 'btn btn-xs',
        text: '↺ Reset to baseline',
        onclick: () => {
          generalSliderCtrl.setValues(clone(state.baseVotes));
          state.overrides = {};
          state.customVotes = {};
          updateAll();
        },
      });

      const slidersCard = ui.card('National Popular Vote % (with Party Leaders)', '', resetNatBtn);
      L.left.appendChild(slidersCard.card);

      const partiesByVote = [...scen.parties].sort((a, b) => b.votes - a.votes);
      generalSliderCtrl = ui.sliders(partiesByVote, state.votes, {
        max: 65,
        step: 0.1,
        showOthers: true,
        onChange: () => updateAll(),
      });
      slidersCard.body.appendChild(generalSliderCtrl.el);

      // Electoral System & Simulation Controls Card
      const rulesCard = ui.card('Electoral System & Swing Controls');
      L.left.appendChild(rulesCard.card);

      const optWrap = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' } });

      const swingSelect = ui.select(
        [
          { value: 'uns', label: 'Uniform National Swing (UNS – Standard UK Model)' },
          { value: 'prop', label: 'Proportional Swing (Scales with Local Share)' },
        ],
        state.swingMode,
        (val) => {
          state.swingMode = val;
          updateAll();
        }
      );
      optWrap.appendChild(el('label', { class: 'small muted', text: 'Constituency Swing Method:' }));
      optWrap.appendChild(swingSelect);

      const actionRow = el('div', { class: 'row', style: { marginTop: '8px', gap: '6px' } }, [
        el('button', {
          class: 'btn btn-xs',
          text: 'Clear All Constituency Edits',
          onclick: () => {
            state.overrides = {};
            state.customVotes = {};
            updateAll();
          },
        }),
        el('button', {
          class: 'btn btn-xs',
          text: 'Equal Two-Way Race (Lab 38% – Con 38%)',
          onclick: () => {
            const next = clone(state.baseVotes);
            next.lab = 38.0;
            next.con = 38.0;
            generalSliderCtrl.setValues(next);
            updateAll();
          },
        }),
      ]);
      rulesCard.body.appendChild(optWrap);
      rulesCard.body.appendChild(actionRow);
      rulesCard.body.appendChild(
        ui.note(
          `<b>First-Past-The-Post (FPTP):</b> The UK is divided into 650 single-member constituencies across England (543), Scotland (57), Wales (32), and Northern Ireland (18). The candidate with the most votes in each constituency wins the seat. 326 seats are needed for an absolute majority in the House of Commons.`,
          'info'
        )
      );
    } else {
      /* ------------------------------------------------------------------- */
      /* CONSERVATIVE LEADERSHIP MODE: Left Controls (Sliders & Toggles)     */
      /* ------------------------------------------------------------------- */
      // 1. Stages & Electorate Card
      const stageCard = ui.card('Contest Stages & Voting Body');
      L.left.appendChild(stageCard.card);

      const stageBar = el('div', { class: 'uk-stage-bar' });
      const stages = [
        { id: 'r1', label: 'Round 1 (8 Cands)', elect: 'mp', active: ['truss', 'sunak', 'mordaunt', 'badenoch', 'tugendhat', 'braverman', 'zahawi', 'hunt'] },
        { id: 'r2', label: 'Round 2 (6 Cands)', elect: 'mp', active: ['truss', 'sunak', 'mordaunt', 'badenoch', 'tugendhat', 'braverman'] },
        { id: 'r3', label: 'Round 3 (5 Cands)', elect: 'mp', active: ['truss', 'sunak', 'mordaunt', 'badenoch', 'tugendhat'] },
        { id: 'r4', label: 'Round 4 (4 Cands)', elect: 'mp', active: ['truss', 'sunak', 'mordaunt', 'badenoch'] },
        { id: 'r5', label: 'Round 5 (Final 3)', elect: 'mp', active: ['truss', 'sunak', 'mordaunt'] },
        { id: 'members', label: 'Members Ballot (Truss vs Sunak)', elect: 'member', active: ['truss', 'sunak'] },
        { id: 'alt_mordaunt', label: 'Alt: Mordaunt vs Sunak', elect: 'member', active: ['mordaunt', 'sunak'] },
        { id: 'alt_badenoch', label: 'Alt: Badenoch vs Truss', elect: 'member', active: ['badenoch', 'truss'] },
        { id: 'all', label: 'All 8 Active', elect: 'mp', active: ['truss', 'sunak', 'mordaunt', 'badenoch', 'tugendhat', 'braverman', 'zahawi', 'hunt'] },
      ];

      stages.forEach((stg) => {
        const btn = el('button', {
          class: 'uk-stage-btn' + (state.stage === stg.id ? ' active' : ''),
          text: stg.label,
          onclick: () => {
            state.stage = stg.id;
            state.electorate = stg.elect;
            scen.candidates.forEach((c) => {
              state.activeCandidates[c.id] = stg.active.includes(c.id);
            });
            state.candidatePcts = getStageBaselinePcts(stg.id);
            render(root);
          },
        });
        stageBar.appendChild(btn);
      });
      stageCard.body.appendChild(stageBar);

      const electSelect = ui.select(
        [
          { value: 'mp', label: 'Parliamentary Ballot (358 Conservative MPs · 180 to Win)' },
          { value: 'member', label: 'Party Membership Postal Ballot (172,437 Members · 50% to Win)' },
        ],
        state.electorate,
        (val) => {
          state.electorate = val;
          updateAll();
        }
      );
      stageCard.body.appendChild(el('div', { style: { marginBottom: '6px' } }, [
        el('label', { class: 'small muted', text: 'Select Voting Body / Electorate:' }),
        electSelect,
      ]));

      // 2. Candidate Percentage Sliders Card (Interactive Sliders for Active Candidates!)
      const resetCandsBtn = el('button', {
        class: 'btn btn-xs',
        text: '↺ Reset to Stage Baseline',
        onclick: () => {
          state.candidatePcts = getStageBaselinePcts(state.stage);
          if (leadershipSliderCtrl) leadershipSliderCtrl.setValues(state.candidatePcts);
          updateAll();
        },
      });

      const slidersCard = ui.card('Candidate Vote % Sliders (Drag to Adjust)', '', resetCandsBtn);
      L.left.appendChild(slidersCard.card);

      const activeCandidateObjs = scen.candidates.filter((c) => state.activeCandidates[c.id]);
      const sliderVals = {};
      activeCandidateObjs.forEach((c) => {
        sliderVals[c.id] = Math.round((state.candidatePcts[c.id] !== undefined ? state.candidatePcts[c.id] : 0) * 10) / 10;
      });

      leadershipSliderCtrl = ui.sliders(
        activeCandidateObjs.map((c) => ({
          id: c.id,
          name: c.name,
          leader: `${c.office} · ${c.wing.split('·')[0].trim()}`,
          color: c.color,
          short: c.name.split(' ')[1] || c.name,
        })),
        sliderVals,
        {
          max: 100,
          step: 0.1,
          showOthers: false,
          onChange: (vals) => {
            for (const cid in vals) {
              state.candidatePcts[cid] = vals[cid];
            }
            state.stage = 'custom';
            updateAll(false);
          },
        }
      );
      slidersCard.body.appendChild(leadershipSliderCtrl.el);

      // 3. Toggle Candidates (Active vs Eliminated) Card
      const toggleCard = ui.card('Toggle Candidates (Active vs Eliminated)');
      L.left.appendChild(toggleCard.card);

      const toggleWrap = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
      scen.candidates.forEach((c) => {
        const isActive = !!state.activeCandidates[c.id];
        const row = el('div', {
          class: 'uk-seat-item',
          style: { cursor: 'default', background: isActive ? 'var(--card)' : 'var(--bg2)', opacity: isActive ? '1' : '0.6' }
        }, [
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 } }, [
            el('span', { class: 'swatch', style: { background: c.color } }),
            el('div', { style: { minWidth: 0 } }, [
              el('div', { class: 'sname', text: c.name }),
              el('div', { class: 'smeta', text: c.office }),
            ]),
          ]),
          el('button', {
            class: 'uk-cand-toggle ' + (isActive ? 'active' : 'elim'),
            text: isActive ? '✔ In Contest' : '✖ Eliminated',
            onclick: () => {
              const nextState = !state.activeCandidates[c.id];
              state.activeCandidates[c.id] = nextState;
              state.stage = 'custom';

              // If candidate is toggled OFF, transfer their votes to other active candidates
              if (!nextState) {
                const elimPct = state.candidatePcts[c.id] || 0;
                state.candidatePcts[c.id] = 0;
                const remaining = scen.candidates.filter((x) => state.activeCandidates[x.id]);
                if (remaining.length > 0 && elimPct > 0) {
                  let weightSum = 0;
                  const weights = {};
                  remaining.forEach((rem) => {
                    const w = (c.transferAffinities && c.transferAffinities[rem.id]) || 0.15;
                    weights[rem.id] = w;
                    weightSum += w;
                  });
                  if (weightSum > 0) {
                    remaining.forEach((rem) => {
                      state.candidatePcts[rem.id] = (state.candidatePcts[rem.id] || 0) + (weights[rem.id] / weightSum) * elimPct;
                    });
                  }
                }
              } else {
                // Restore candidate to an estimated baseline percentage
                const basePcts = getStageBaselinePcts('r1');
                state.candidatePcts[c.id] = basePcts[c.id] || 15;
              }

              render(root);
            },
          }),
        ]);
        toggleWrap.appendChild(row);
      });
      toggleCard.body.appendChild(toggleWrap);
      toggleCard.body.appendChild(
        ui.note(
          `<b>1922 Committee Rules:</b> MPs cast secret ballots in progressive elimination rounds until two candidates remain. Any candidate who is toggled off has their support dynamically transferred to the remaining candidates based on ideological faction affinities.`,
          'info'
        )
      );
    }

    /* =================================================================== */
    /* RIGHT COLUMN: Top Cards, Hemicycle, Seat Bar, Map/Roster, Tables   */
    /* =================================================================== */

    // 1. Top PM / Candidate Cards Box
    const candBox = el('div', { style: { marginBottom: '12px' } });
    L.right.appendChild(candBox);

    // 2. Hemicycle Card (650 seats Commons or 358 Tory MPs)
    const hcTitle = scen.type === 'general'
      ? `House of Commons – 650 Constituencies (Majority: 326 Seats)`
      : `Parliamentary Party Benches – 358 Conservative MPs (Majority: 180 Seats)`;
    const hcCard = ui.card(hcTitle);
    L.right.appendChild(hcCard.card);
    const hcBox = el('div');
    const seatBarBox = el('div');
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(seatBarBox);

    // 3. Middle Section: Hex Map (General Elections) OR Candidate Roster (Leadership)
    let updateMapFills = null;
    let overrideBadge = null;

    if (scen.type === 'general') {
      overrideBadge = el('span', { class: 'badge out', text: 'Model baseline' });
      const mapCard = ui.card(`Constituencies Cartogram (650 Hexes · England, Scotland, Wales & NI)`, '', overrideBadge);
      L.right.appendChild(mapCard.card);

      // Paint-brush toolbar
      const toolbar = el('div', { class: 'map-toolbar' });
      const brushItems = [
        { id: 'inspect', label: '🔍 Inspect / Edit %', color: '#5b8cff' },
        ...scen.parties.slice(0, 7).map((p) => ({ id: p.id, label: `Paint: ${p.short}`, color: p.color })),
        { id: 'reset', label: '↺ Reset Seat', color: '#9aa3b5' },
      ];
      brushItems.forEach((b) => {
        const chip = el(
          'button',
          {
            class: 'paint-chip' + (state.brush === b.id ? ' active' : ''),
            style: { '--c': b.color },
          },
          [
            b.id !== 'inspect' && b.id !== 'reset' ? el('span', { class: 'swatch', style: { background: b.color } }) : null,
            b.label,
          ]
        );
        chip.addEventListener('click', () => {
          state.brush = b.id;
          toolbar.querySelectorAll('.paint-chip').forEach((x) => x.classList.remove('active'));
          chip.classList.add('active');
        });
        toolbar.appendChild(chip);
      });
      mapCard.body.appendChild(toolbar);

      // Hex map layout + Side search & seat panel
      const mapLayout = el('div', { class: 'uk-map-layout' });
      mapCard.body.appendChild(mapLayout);

      const mapWrap = el('div');
      mapLayout.appendChild(mapWrap);

      const sidePanel = el('div', { class: 'uk-side-panel' });
      mapLayout.appendChild(sidePanel);

      const regionSelect = ui.select(
        [
          { value: 'ALL', label: 'All Regions (650 seats)' },
          { value: 'E12000007', label: 'London (75)' },
          { value: 'E12000008', label: 'South East (91)' },
          { value: 'E12000002', label: 'North West (73)' },
          { value: 'E12000006', label: 'East of England (61)' },
          { value: 'E12000009', label: 'South West (58)' },
          { value: 'E12000005', label: 'West Midlands (57)' },
          { value: 'S92000003', label: 'Scotland (57)' },
          { value: 'E12000003', label: 'Yorks & Humber (54)' },
          { value: 'E12000004', label: 'East Midlands (47)' },
          { value: 'W92000004', label: 'Wales (32)' },
          { value: 'E12000001', label: 'North East (27)' },
          { value: 'N92000002', label: 'Northern Ireland (18)' },
        ],
        state.regionFilter,
        (val) => {
          state.regionFilter = val;
          updateAll();
        }
      );
      sidePanel.appendChild(regionSelect);

      const searchInput = el('input', {
        class: 'uk-search-input',
        type: 'text',
        placeholder: 'Search constituency or MP...',
        value: state.searchQuery,
      });
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        updateAll();
      });
      sidePanel.appendChild(searchInput);

      const seatListHeader = el('div', { class: 'small muted', style: { fontWeight: '600' } });
      const seatListEl = el('div', { class: 'uk-seat-list' });
      sidePanel.appendChild(seatListHeader);
      sidePanel.appendChild(seatListEl);

      // Render Hexagonal SVG with D3
      const R = 34;
      const dx = R * Math.sqrt(3);
      const dy = R * 1.5;
      const hx = (R * Math.sqrt(3)) / 2;
      const hy = R / 2;

      const hexes = window.HEX_UK?.hexes || {};
      const hexNodes = [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      for (const gss in hexes) {
        const h = hexes[gss];
        const cx = (h.q + ((h.r & 1) !== 0 ? 0.5 : 0)) * dx;
        const cy = -h.r * dy;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        hexNodes.push({ gss, cx, cy, region: h.region });
      }

      const padX = 110, padY = 36;
      const vbX = (minX - padX).toFixed(1);
      const vbY = (minY - padY).toFixed(1);
      const vbW = (maxX - minX + padX * 2).toFixed(1);
      const vbH = (maxY - minY + padY * 2).toFixed(1);

      const svg = d3
        .select(mapWrap)
        .append('svg')
        .attr('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`)
        .attr('class', 'uk-hex-svg');

      const hexPathD = `M 0,${-R.toFixed(2)} L ${hx.toFixed(2)},${-hy.toFixed(2)} L ${hx.toFixed(2)},${hy.toFixed(2)} L 0,${R.toFixed(2)} L ${(-hx).toFixed(2)},${hy.toFixed(2)} L ${(-hx).toFixed(2)},${-hy.toFixed(2)} Z`;

      const tip = ui.tooltip();
      let lastSim = null;

      function handleHexClick(gss) {
        if (state.brush === 'inspect') {
          openConstituencyModal(gss);
          return;
        }
        if (state.brush === 'reset') {
          delete state.overrides[gss];
          delete state.customVotes[gss];
        } else {
          state.overrides[gss] = state.brush;
        }
        updateAll();
      }

      function showHexTip(e, gss) {
        if (!lastSim) return;
        const r = lastSim.constResults[gss];
        if (!r) return;
        const c = r.c;
        const winP = lastSim.pMap[r.winner] || scen.parties[0];
        const baseP = lastSim.pMap[r.baselineWinner] || scen.parties[0];

        const top4 = r.ranked
          .slice(0, 4)
          .map(([pid, pct]) => {
            const p = lastSim.pMap[pid] || scen.parties[0];
            return `<tr><td><span style="color:${p.color}">■</span> ${p.short}</td><td style="text-align:right"><b>${fmt(pct, 1)}%</b></td></tr>`;
          })
          .join('');

        const gainText =
          r.winner === r.baselineWinner
            ? `<span style="color:${winP.color}"><b>${winP.short} hold</b></span>`
            : `<span style="color:${winP.color}"><b>${winP.short} gain</b> from ${baseP.short}</span>`;

        tip.show(
          e,
          `<b>${c.n}</b> <span class="muted">(${gss})</span><br>` +
            `${gainText}${r.isOverride ? ' · <i>Custom Override</i>' : ''}<br>` +
            `<span class="muted">Incumbent MP: ${c.mp} (${baseP.short})</span>` +
            `<table>${top4}</table>` +
            `<span class="muted small">Click to ${state.brush === 'inspect' ? 'inspect / edit' : 'paint'}</span>`
        );
      }

      const hexPaths = svg
        .append('g')
        .selectAll('path.unit')
        .data(hexNodes, (d) => d.gss)
        .join('path')
        .attr('class', 'unit')
        .attr('transform', (d) => `translate(${d.cx.toFixed(2)},${d.cy.toFixed(2)})`)
        .attr('d', hexPathD)
        .on('click', (e, d) => handleHexClick(d.gss))
        .on('mouseenter', (e, d) => showHexTip(e, d.gss))
        .on('mousemove', (e) => tip.move(e))
        .on('mouseleave', () => tip.hide());

      // Region boundary path lines
      const coordLookup = {};
      hexNodes.forEach((n) => {
        coordLookup[`${Math.round(n.cx)},${Math.round(n.cy)}`] = n;
      });
      const boundarySegments = [];
      const edgeDirs = [
        { dcx: hx, dcy: -dy, x1: 0, y1: -R, x2: hx, y2: -hy },
        { dcx: dx, dcy: 0, x1: hx, y1: -hy, x2: hx, y2: hy },
        { dcx: hx, dcy: dy, x1: hx, y1: hy, x2: 0, y2: R },
      ];
      hexNodes.forEach((n) => {
        edgeDirs.forEach((ed) => {
          const nb = coordLookup[`${Math.round(n.cx + ed.dcx)},${Math.round(n.cy + ed.dcy)}`];
          if (nb && nb.region !== n.region) {
            boundarySegments.push(
              `M ${(n.cx + ed.x1).toFixed(1)},${(n.cy + ed.y1).toFixed(1)} L ${(n.cx + ed.x2).toFixed(1)},${(n.cy + ed.y2).toFixed(1)}`
            );
          }
        });
      });
      svg.append('path').attr('class', 'reg-boundary').attr('d', boundarySegments.join(' '));

      // Modal constituency editor
      function openConstituencyModal(gss) {
        const c = window.UK2024.constituencies[gss];
        const r = lastSim?.constResults[gss];
        if (!c || !r) return;

        ui.modal(`${c.n} <span class="muted small">(${gss})</span>`, (body, close) => {
          const localVals = {};
          scen.parties.forEach((p) => {
            localVals[p.id] = Math.round((r.shares[p.id] || 0) * 10) / 10;
          });

          const winP = lastSim.pMap[r.winner] || scen.parties[0];
          body.appendChild(
            el('div', { class: 'note note-info', style: { marginBottom: '10px' } }, [
              el('div', { html: `Projected Winner: <b style="color:${winP.color}">■ ${winP.name}</b> (${fmt(r.ranked[0]?.[1] || 0, 1)}%)` }),
              el('div', { class: 'small muted', text: `MP: ${c.mp} · Baseline Winner: ${r.baselineWinner.toUpperCase()}` }),
            ])
          );

          // Quick override buttons
          const chipRow = el('div', { class: 'row', style: { gap: '6px', marginBottom: '10px' } });
          scen.parties.slice(0, 5).forEach((p) => {
            chipRow.appendChild(
              el('button', {
                class: 'paint-chip' + (state.overrides[gss] === p.id ? ' active' : ''),
                style: { '--c': p.color },
                text: p.short,
                onclick: () => {
                  state.overrides[gss] = p.id;
                  updateAll();
                  close();
                },
              })
            );
          });
          body.appendChild(chipRow);

          // Local sliders
          const localSliders = ui.sliders(scen.parties.slice(0, 6), localVals, {
            max: 85,
            step: 0.1,
            showOthers: false,
            onChange: (vals) => {
              delete state.overrides[gss];
              state.customVotes[gss] = clone(vals);
              updateAll();
            },
          });
          body.appendChild(localSliders.el);

          const foot = el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '10px' } }, [
            el('button', {
              class: 'btn',
              text: '↺ Reset to National Model',
              onclick: () => {
                delete state.overrides[gss];
                delete state.customVotes[gss];
                updateAll();
                close();
              },
            }),
            el('button', { class: 'btn btn-primary', text: 'Done', onclick: close }),
          ]);
          body.appendChild(foot);
        });
      }

      updateMapFills = function (sim) {
        lastSim = sim;
        const qLower = state.searchQuery.toLowerCase();
        const hasFilter = state.regionFilter !== 'ALL' || qLower.length > 0;
        const matchedSeats = [];

        hexPaths
          .attr('fill', (d) => {
            const r = sim.constResults[d.gss];
            if (!r) return '#333';
            const winP = sim.pMap[r.winner] || scen.parties[0];
            return winP.color;
          })
          .classed('override', (d) => sim.constResults[d.gss]?.isOverride)
          .classed('dimmed', (d) => {
            const r = sim.constResults[d.gss];
            if (!r) return false;
            const regMatch = state.regionFilter === 'ALL' || r.c.reg === state.regionFilter;
            const textMatch =
              !qLower ||
              r.c.n.toLowerCase().includes(qLower) ||
              r.c.mp.toLowerCase().includes(qLower) ||
              d.gss.toLowerCase().includes(qLower);
            if (regMatch && textMatch) {
              matchedSeats.push(r);
              return false;
            }
            return hasFilter;
          })
          .classed('search-hit', (d) => {
            if (!qLower) return false;
            const r = sim.constResults[d.gss];
            return (
              r.c.n.toLowerCase().includes(qLower) ||
              r.c.mp.toLowerCase().includes(qLower) ||
              d.gss.toLowerCase().includes(qLower)
            );
          });

        // Update side panel list
        matchedSeats.sort((a, b) => a.c.n.localeCompare(b.c.n));
        seatListHeader.textContent = `${matchedSeats.length} of 650 constituencies:`;
        seatListEl.innerHTML = '';
        matchedSeats.slice(0, 75).forEach((r) => {
          const winP = sim.pMap[r.winner] || scen.parties[0];
          const item = el('button', {
            class: 'uk-seat-item',
            onclick: () => openConstituencyModal(r.gss),
          }, [
            el('div', { style: { minWidth: 0, overflow: 'hidden' } }, [
              el('div', { class: 'sname', text: r.c.n }),
              el('div', { class: 'smeta', text: `${r.c.mp} · Maj ${fmt(r.margin, 1)}%` }),
            ]),
            el('span', { class: 'badge', style: { background: winP.color, color: textOn(winP.color), flexShrink: 0 }, text: winP.short }),
          ]);
          seatListEl.appendChild(item);
        });

        const ovCount = Object.keys(state.overrides).length + Object.keys(state.customVotes).length;
        overrideBadge.textContent = ovCount > 0 ? `${ovCount} custom override${ovCount > 1 ? 's' : ''}` : 'Model baseline';
        overrideBadge.className = 'badge ' + (ovCount > 0 ? '' : 'out');
      };
    } else {
      /* ------------------------------------------------------------------- */
      /* LEADERSHIP CONTEST: Candidate Roster Cards with Live Pct Adjustment */
      /* ------------------------------------------------------------------- */
      const candRosterCard = ui.card('Leadership Candidates (Adjust % or Toggle Active)');
      L.right.appendChild(candRosterCard.card);
      const rosterGrid = el('div', { class: 'uk-cand-roster' });
      candRosterCard.body.appendChild(rosterGrid);

      updateMapFills = function (sim) {
        rosterGrid.innerHTML = '';
        scen.candidates.forEach((c) => {
          const isActive = !!state.activeCandidates[c.id];
          const isWin = sim.winner.id === c.id;
          const votesVal = sim.votes[c.id] || 0;
          const pctVal = sim.pcts[c.id] || 0;
          const pic = ES.leaderImg && ES.leaderImg(c.name);

          // Inline candidate slider row for editing percentage directly on card
          let sliderRow = null;
          if (isActive) {
            const curVal = Math.round((state.candidatePcts[c.id] !== undefined ? state.candidatePcts[c.id] : pctVal) * 10) / 10;
            const cRange = el('input', {
              type: 'range',
              class: 'uk-cand-range',
              min: '0',
              max: '100',
              step: '0.1',
              value: String(curVal),
              style: { '--c': c.color },
            });
            const cNum = el('input', {
              type: 'number',
              class: 'uk-cand-num',
              min: '0',
              max: '100',
              step: '0.1',
              value: fmt(curVal, 1),
            });

            function onCardPctChange(newVal) {
              const val = Math.max(0, Math.min(100, +newVal || 0));
              state.candidatePcts[c.id] = val;
              state.stage = 'custom';
              if (leadershipSliderCtrl) {
                leadershipSliderCtrl.setValues(state.candidatePcts);
              }
              updateAll(false);
            }

            cRange.addEventListener('input', () => {
              cNum.value = fmt(cRange.value, 1);
              onCardPctChange(cRange.value);
            });
            cNum.addEventListener('change', () => {
              cRange.value = cNum.value;
              onCardPctChange(cNum.value);
            });

            sliderRow = el('div', { class: 'uk-cand-slider-box' }, [
              el('div', { class: 'uk-cand-slider-head' }, [
                el('span', { text: 'Adjust Candidate % Share:' }),
                el('span', { style: { color: c.color, fontWeight: '700' }, text: `${fmt(pctVal, 1)}%` }),
              ]),
              el('div', { class: 'uk-cand-slider-row' }, [
                cRange,
                cNum,
                el('span', { class: 'small muted', text: '%' }),
              ]),
            ]);
          }

          const card = el('div', {
            class: 'uk-cand-card' + (isWin ? ' winner' : '') + (!isActive ? ' eliminated' : ''),
            style: { '--c': c.color },
          }, [
            el('div', { class: 'uk-cand-head' }, [
              el('div', { class: 'uk-cand-info' }, [
                pic ? el('img', { class: 'leader-avatar', src: pic, alt: c.name, style: { '--c': c.color } }) : null,
                el('div', { class: 'uk-cand-names' }, [
                  el('div', { class: 'uk-cand-name', text: c.name }),
                  el('div', { class: 'uk-cand-role', text: c.office }),
                ]),
              ]),
              el('button', {
                class: 'uk-cand-toggle ' + (isActive ? 'active' : 'elim'),
                text: isActive ? '✔ In Race' : '✖ Eliminated',
                onclick: () => {
                  const nextState = !state.activeCandidates[c.id];
                  state.activeCandidates[c.id] = nextState;
                  state.stage = 'custom';
                  if (!nextState) {
                    state.candidatePcts[c.id] = 0;
                  } else {
                    const basePcts = getStageBaselinePcts('r1');
                    state.candidatePcts[c.id] = basePcts[c.id] || 15;
                  }
                  render(root);
                },
              }),
            ]),
            el('span', { class: 'uk-cand-wing', text: c.wing }),
            el('div', { class: 'uk-cand-trail' }, [
              el('span', { text: `R1: ${c.mpVotesR1}` }),
              c.mpVotesR2 ? el('span', { text: `R2: ${c.mpVotesR2}` }) : null,
              c.mpVotesR3 ? el('span', { text: `R3: ${c.mpVotesR3}` }) : null,
              c.mpVotesR4 ? el('span', { text: `R4: ${c.mpVotesR4}` }) : null,
              c.mpVotesR5 ? el('span', { text: `R5: ${c.mpVotesR5}` }) : null,
              c.memberPct ? el('span', { text: `Mem: ${c.memberPct}%` }) : null,
            ]),
            el('div', { class: 'uk-cand-meter' }, [
              el('span', { style: { color: c.color }, text: isActive ? (sim.isMemberMode ? `${fmtInt(Math.round(votesVal))} members` : `${Math.round(votesVal)} MPs`) : 'Eliminated' }),
              el('span', { class: 'muted small', text: isActive ? `${fmt(pctVal, 1)}%` : '–' }),
            ]),
            el('div', { class: 'seatbar-wrap', style: { height: '8px' } }, [
              el('div', {
                style: { width: `${Math.min(100, pctVal)}%`, background: c.color, height: '100%', borderRadius: '4px', transition: 'width 0.15s' },
              }),
            ]),
            sliderRow,
          ]);
          rosterGrid.appendChild(card);
        });
      };
    }

    // 4. Bottom Grid: Detailed Results Table & Coalition / Factions Builder
    const bottomGrid = el('div', { class: 'grid2' });
    L.right.appendChild(bottomGrid);

    const tblCard = ui.card(scen.type === 'general' ? 'Detailed Seat Breakdown & Historical Comparison' : 'Ballot Round Breakdown & Vote Transfers');
    const rightSideCard = ui.card(scen.type === 'general' ? 'House of Commons Coalition Builder' : 'Ideological Factions & Candidate Transfers');
    bottomGrid.appendChild(tblCard.card);
    bottomGrid.appendChild(rightSideCard.card);

    /* =================================================================== */
    /* LIVE SIMULATION UPDATE DISPATCHER                                   */
    /* =================================================================== */
    function updateAll(syncSliders = true) {
      if (scen.type === 'general') {
        const sim = computeGeneralSim(scen, state);
        const total = scen.totalSeats;
        const majority = scen.majority;

        // 1. Top Candidate Cards
        candBox.innerHTML = '';
        const sortedParties = [...scen.parties].sort(
          (a, b) => (sim.seatsByParty[b.id] || 0) - (sim.seatsByParty[a.id] || 0) || (sim.votePct[b.id] || 0) - (sim.votePct[a.id] || 0)
        );
        const topCards = el('div', { class: 'cands' });
        sortedParties.slice(0, 3).forEach((p) => {
          const seats = sim.seatsByParty[p.id] || 0;
          const isMaj = seats >= majority;
          const pic = ES.leaderImg && ES.leaderImg(p.leader);
          topCards.appendChild(
            el('div', { class: 'cand' + (isMaj ? ' win' : ''), style: { '--c': p.color } }, [
              el('div', { class: 'cand-top' }, [
                pic ? el('img', { class: 'leader-avatar-lg', src: pic, alt: p.leader, style: { '--c': p.color } }) : null,
                el('div', {}, [
                  el('div', { class: 'cname', text: p.leader }),
                  el('div', { class: 'cparty', text: `${p.name} · ${fmt(sim.votePct[p.id] || p.votes, 1)}% vote` }),
                ]),
              ]),
              el('div', { class: 'cval', style: { color: p.color }, text: `${seats} seats` }),
              el('div', { class: 'muted small', text: `${fmt((seats / total) * 100, 1)}% of Parliament (${seats - majority >= 0 ? '+' + (seats - (total - seats)) + ' majority' : seats - majority + ' short'})` }),
              isMaj
                ? el('span', { class: 'badge', text: `✔ ${seats - (total - seats)}-SEAT OVERALL MAJORITY` })
                : el('span', { class: 'badge out', text: 'HUNG PARLIAMENT' }),
            ])
          );
        });
        candBox.appendChild(topCards);

        // 2. Hemicycle
        const hcParties = scen.parties.map((p) => ({
          id: p.id,
          name: p.name,
          leader: `Party: ${p.name} (${p.leader})`,
          color: p.color,
          seats: sim.seatsByParty[p.id] || 0,
        }));
        const leadParty = sortedParties[0];
        const leadSeats = sim.seatsByParty[leadParty.id] || 0;
        ES.hemicycle(hcBox, hcParties, {
          total,
          majority,
          centerLabel: leadSeats >= majority ? `${leadParty.short} +${leadSeats - (total - leadSeats)}` : String(total),
          subtitle: `Majority threshold: ${majority} seats`,
        });

        // 3. Seat Bar
        seatBarBox.innerHTML = '';
        seatBarBox.appendChild(
          ui.seatBar(
            hcParties.map((p) => ({ name: `${p.name} (${p.seats})`, color: p.color, seats: p.seats })),
            total,
            majority,
            { label: `326 seats needed for absolute majority in the House of Commons (650 total)`, unit: 'seats' }
          )
        );

        // 4. Update Hex Map
        if (updateMapFills) updateMapFills(sim);

        // 5. Results Table
        tblCard.body.innerHTML = '';
        const tableRows = sortedParties
          .filter((p) => (sim.seatsByParty[p.id] || 0) > 0 || (sim.votePct[p.id] || 0) > 0.1 || p.actualSeats > 0)
          .map((p) => {
            const tot = sim.seatsByParty[p.id] || 0;
            const baseSeats = p.notional2024 !== undefined ? p.notional2024 : p.actualSeats;
            const diff = tot - baseSeats;
            const diffStr =
              diff === 0
                ? '<span class="muted">±0</span>'
                : diff > 0
                ? `<span class="uk-diff-pos">+${diff}</span>`
                : `<span class="uk-diff-neg">${diff}</span>`;
            return {
              color: p.color,
              name: p.name,
              leader: p.leader,
              votes: sim.votePct[p.id],
              seats: `<b>${tot}</b> <span class="muted small">(${fmt((tot / total) * 100, 1)}%)</span>`,
              actual: `${baseSeats}${diffStr}`,
              dim: tot === 0 && baseSeats === 0,
            };
          });

        tblCard.body.appendChild(
          ui.resultsTable(tableRows, {
            nameLabel: 'Party & Leader',
            columns: [
              { key: 'votes', label: 'Vote %', fmt: (v) => fmt(v, 1) + '%' },
              { key: 'seats', label: 'Sim Seats' },
              { key: 'actual', label: scen.id === '2019' ? '2019 Notional' : 'Baseline' },
            ],
          })
        );

        // 6. Coalition Builder
        rightSideCard.body.innerHTML = '';
        rightSideCard.body.appendChild(
          ui.coalition(
            sortedParties.map((p) => ({ id: p.id, name: p.name, short: p.short, leader: p.leader, color: p.color, seats: sim.seatsByParty[p.id] || 0 })),
            total,
            majority,
            { key: 'uk-' + state.scenId }
          )
        );
      } else {
        /* Conservative Leadership Live Update */
        const sim = computeLeadershipSim(scen, state);
        const total = sim.totalActiveVotes;
        const majority = sim.isMemberMode ? Math.round(total / 2) : 180;

        // 1. Top Cards
        candBox.innerHTML = '';
        const topCards = el('div', { class: 'cands' });
        sim.rankedCands.slice(0, 3).forEach((c, idx) => {
          const v = sim.votes[c.id] || 0;
          const pct = sim.pcts[c.id] || 0;
          const isWin = idx === 0 && (v >= majority || sim.rankedCands.length === 1);
          const pic = ES.leaderImg && ES.leaderImg(c.name);
          topCards.appendChild(
            el('div', { class: 'cand' + (isWin ? ' win' : ''), style: { '--c': c.color } }, [
              el('div', { class: 'cand-top' }, [
                pic ? el('img', { class: 'leader-avatar-lg', src: pic, alt: c.name, style: { '--c': c.color } }) : null,
                el('div', {}, [
                  el('div', { class: 'cname', text: c.name }),
                  el('div', { class: 'cparty', text: `${c.office} · ${c.wing.split('·')[0].trim()}` }),
                ]),
              ]),
              el('div', { class: 'cval', style: { color: c.color }, text: sim.isMemberMode ? `${fmtInt(Math.round(v))} members` : `${Math.round(v)} MPs` }),
              el('div', { class: 'muted small', text: `${fmt(pct, 1)}% of valid ballots cast` }),
              isWin
                ? el('span', { class: 'badge', text: '★ 56TH PRIME MINISTER / PARTY LEADER' })
                : el('span', { class: 'badge out', text: idx === 1 ? 'RUNNER-UP' : `${idx + 1}RD PLACE` }),
            ])
          );
        });
        candBox.appendChild(topCards);

        // 2. Hemicycle of Conservative MPs
        const hcParties = sim.rankedCands.map((c) => ({
          id: c.id,
          name: c.name,
          leader: `${c.name} (${c.wing})`,
          color: c.color,
          seats: Math.round(sim.isMemberMode ? (sim.votes[c.id] / total) * 358 : sim.votes[c.id]),
        }));
        ES.hemicycle(hcBox, hcParties, {
          total: 358,
          majority: 180,
          centerLabel: sim.winner ? `${sim.winner.name.split(' ')[1]} ${fmt(sim.pcts[sim.winner.id], 1)}%` : '358',
          subtitle: `Absolute majority: 180 Conservative MPs`,
        });

        // 3. Seat Bar
        seatBarBox.innerHTML = '';
        seatBarBox.appendChild(
          ui.seatBar(
            hcParties.map((p) => ({ name: `${p.name} (${p.seats})`, color: p.color, seats: p.seats })),
            358,
            180,
            { label: `180 votes required for an outright majority of Conservative MPs`, unit: 'MPs' }
          )
        );

        // 4. Update Candidate Cards in Roster
        if (updateMapFills) updateMapFills(sim);

        // 5. Results Table
        tblCard.body.innerHTML = '';
        const tableRows = scen.candidates.map((c) => {
          const isActive = !!state.activeCandidates[c.id];
          const v = sim.votes[c.id] || 0;
          const pct = sim.pcts[c.id] || 0;
          return {
            color: c.color,
            name: c.name,
            leader: `${c.office} · ${c.wing}`,
            r1: c.mpVotesR1,
            r5: c.mpVotesR5 || '–',
            mem: c.memberPct ? `${c.memberPct}%` : '–',
            simVotes: isActive ? `<b>${sim.isMemberMode ? fmtInt(Math.round(v)) : Math.round(v)}</b> <span class="muted small">(${fmt(pct, 1)}%)</span>` : '<span class="muted">Eliminated</span>',
            status: isActive ? (sim.winner.id === c.id ? '<span class="ok">★ Winner</span>' : 'Active') : '<span class="no">Eliminated</span>',
            dim: !isActive,
          };
        });

        tblCard.body.appendChild(
          ui.resultsTable(tableRows, {
            nameLabel: 'Candidate & Office',
            columns: [
              { key: 'r1', label: 'R1 MPs' },
              { key: 'r5', label: 'R5 MPs' },
              { key: 'mem', label: 'Hist. Mem %' },
              { key: 'simVotes', label: sim.isMemberMode ? 'Sim Member Votes' : 'Sim MP Votes' },
              { key: 'status', label: 'Status' },
            ],
          })
        );

        // 6. Ideological Factions & Transfers Panel
        rightSideCard.body.innerHTML = '';
        const factions = [
          { name: 'Thatcherite / Free Enterprise Right', cands: ['truss', 'badenoch', 'braverman'], color: '#0087DC' },
          { name: 'One Nation / Treasury Pragmatists', cands: ['sunak', 'hunt', 'tugendhat'], color: '#1e3a8a' },
          { name: 'Broad-Church Patriotic / Moderate', cands: ['mordaunt', 'zahawi'], color: '#0284c7' },
        ];

        const factionWrap = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
        factions.forEach((f) => {
          let fVotes = 0;
          f.cands.forEach((cid) => {
            if (state.activeCandidates[cid]) fVotes += sim.votes[cid] || 0;
          });
          const fPct = total > 0 ? (fVotes / total) * 100 : 0;
          factionWrap.appendChild(
            el('div', { class: 'uk-kpi' }, [
              el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                el('span', { style: { fontWeight: '700', color: f.color }, text: f.name }),
                el('span', { style: { fontWeight: '700' }, text: `${fmt(fPct, 1)}%` }),
              ]),
              el('div', { class: 'seatbar-wrap', style: { height: '8px', marginTop: '6px' } }, [
                el('div', { style: { width: `${Math.min(100, fPct)}%`, background: f.color, height: '100%', borderRadius: '4px' } }),
              ]),
              el('div', { class: 'small muted', style: { marginTop: '4px' }, text: `Candidates: ${f.cands.map((cid) => scen.candidates.find((c) => c.id === cid).name).join(', ')}` }),
            ])
          );
        });
        rightSideCard.body.appendChild(factionWrap);
      }
    }

    updateAll();
  }

  ES.register({
    id: 'uk',
    name: 'UK',
    flag: '🇬🇧',
    title: 'United Kingdom – Parliament & Elections',
    subtitle: 'General Elections (1997, 2019, 2024) · 2022 Conservative Leadership Election · 650 constituencies',
    render,
  });
})();
