/* =========================================================================
   Hungary – National Assembly (Országgyűlés) Election Simulator (1990–2026 Sept)
   Covers:
   - 1990–2010 three-tier mixed system (386 seats: 176 SMC + 152 regional + 58 comp)
   - 2014–2026 two-tier mixed system (199 seats: 106 SMC + 93 national list w/ winner comp)
   - 2026 redistricting (Budapest 18→16 SMCs, Pest County 12→14 SMCs)
   - April 2026 Election & September 2026 Opinion Poll / Scenario
   ========================================================================= */
(function () {
  'use strict';
  const { el, fmt, fmtInt, sum, normalize, clone, rng, noise, argmax, ranked, textOn, shade } = ES.util;
  const ui = ES.ui;
  const methods = ES.methods;

  /* --------------------------------------------------------------------- */
  /* Inject minor Hungary-specific styles once                             */
  /* --------------------------------------------------------------------- */
  if (!document.getElementById('es-hu-style')) {
    const st = document.createElement('style');
    st.id = 'es-hu-style';
    st.textContent = `
      .hu-year-bar { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
      .hu-year-btn { background: var(--bg2); color: var(--muted); border: 1px solid var(--line); border-radius: 7px; padding: 5px 9px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.15s; }
      .hu-year-btn:hover { color: var(--text); border-color: var(--accent); }
      .hu-year-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .hu-year-btn.poll { border-style: dashed; }
      .hu-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 8px; margin: 10px 0; }
      .hu-kpi { background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; }
      .hu-kpi .k-lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; }
      .hu-kpi .k-val { font-size: 15px; font-weight: 700; margin-top: 2px; }
      .hu-county-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; }
      .hu-county-box { background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; }
      .hu-county-head { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
      .hu-diff-pos { color: var(--ok); font-size: 11px; margin-left: 4px; }
      .hu-diff-neg { color: var(--bad); font-size: 11px; margin-left: 4px; }
      .hu-superline { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #ffb547; box-shadow: 0 0 0 1px rgba(0,0,0,0.5); }
    `;
    document.head.appendChild(st);
  }

  /* --------------------------------------------------------------------- */
  /* Counties & Constituency Metadata (1990–2010, 2014–2022, 2026)         */
  /* --------------------------------------------------------------------- */
  // [code, name, smc1990, smc2014, smc2026, regSeats1990, Centers/Towns]
  const COUNTIES = [
    ['BP', 'Budapest', 32, 18, 16, 28, [
      'I–V. Belváros–Budavár', 'II. Rózsadomb–Pesthidegkút', 'III. Óbuda–Békásmegyer', 'IV. Újpest–Káposztásmegyer',
      'VI–VII. Terézváros–Erzsébetváros', 'VIII–IX. Józsefváros–Ferencváros', 'X. Kőbánya', 'XI. Újbuda–Szentimreváros',
      'XI–XXII. Kelenföld–Budafok', 'XII. Hegyvidék', 'XIII. Angyalföld–Újlipótváros', 'XIV. Zugló',
      'XV. Rákospalota–Újpalota', 'XVI. Árpádföld–Mátyásföld', 'XVII. Rákosmente', 'XVIII. Pestszentlőrinc',
      'XIX–XX. Kispest–Pesterzsébet', 'XXI–XXIII. Csepel–Soroksár'
    ]],
    ['PE', 'Pest', 16, 12, 14, 14, [
      'Érd', 'Budakeszi', 'Szentendre', 'Vác', 'Dunakeszi', 'Gödöllő', 'Vecsés',
      'Szigetszentmiklós', 'Nagykáta', 'Monor', 'Dabas', 'Cegléd', 'Budaörs', 'Veresegyház'
    ]],
    ['BA', 'Baranya', 7, 4, 4, 6, ['Pécs I.', 'Pécs II.', 'Mohács', 'Szigetvár', 'Komló', 'Siklós', 'Pécsvárad']],
    ['BK', 'Bács-Kiskun', 10, 6, 6, 8, ['Kecskemét I.', 'Kecskemét II.', 'Kalocsa', 'Kiskunfélegyháza', 'Kiskunhalas', 'Baja', 'Kiskőrös', 'Kunszentmiklós', 'Tiszakécske', 'Bácsalmás']],
    ['BE', 'Békés', 7, 4, 4, 6, ['Békéscsaba', 'Békés', 'Gyula', 'Orosháza', 'Szarvas', 'Mezőkovácsháza', 'Szeghalom']],
    ['BZ', 'Borsod-Abaúj-Zemplén', 13, 7, 7, 11, ['Miskolc I.', 'Miskolc II.', 'Ózd', 'Kazincbarcika', 'Sátoraljaújhely', 'Tiszaújváros', 'Mezőkövesd', 'Edelény', 'Encs', 'Szerencs', 'Sajószentpéter', 'Szikszó', 'Miskolc III.']],
    ['CS', 'Csongrád-Csanád', 7, 4, 4, 6, ['Szeged I.', 'Szeged II.', 'Szentes', 'Hódmezővásárhely', 'Makó', 'Csongrád', 'Mórahalom']],
    ['FE', 'Fejér', 7, 5, 5, 6, ['Székesfehérvár I.', 'Székesfehérvár II.', 'Bicske', 'Dunaújváros', 'Sárbogárd', 'Mór', 'Gárdony']],
    ['GY', 'Győr-Moson-Sopron', 7, 5, 5, 6, ['Győr I.', 'Győr II.', 'Csorna', 'Sopron', 'Mosonmagyaróvár', 'Kapuvár', 'Pannonhalma']],
    ['HB', 'Hajdú-Bihar', 9, 6, 6, 8, ['Debrecen I.', 'Debrecen II.', 'Debrecen III.', 'Berettyóújfalu', 'Hajdúszoboszló', 'Hajdúböszörmény', 'Balmazújváros', 'Hajdúnánás', 'Püspökladány']],
    ['HE', 'Heves', 6, 3, 3, 5, ['Eger', 'Gyöngyös', 'Hatvan', 'Heves', 'Füzesabony', 'Pétervására']],
    ['JN', 'Jász-Nagykun-Szolnok', 8, 4, 4, 6, ['Szolnok', 'Jászberény', 'Karcag', 'Törökszentmiklós', 'Mezőtúr', 'Kunszentmárton', 'Tiszafüred', 'Jászapáti']],
    ['KE', 'Komárom-Esztergom', 5, 3, 3, 4, ['Tatabánya', 'Esztergom', 'Komárom', 'Oroszlány', 'Tata']],
    ['NO', 'Nógrád', 4, 2, 2, 4, ['Salgótarján', 'Balassagyarmat', 'Pásztó', 'Szécsény']],
    ['SO', 'Somogy', 6, 4, 4, 5, ['Kaposvár', 'Barcs', 'Marcali', 'Siófok', 'Nagyatád', 'Fonyód']],
    ['SZ', 'Szabolcs-Szatmár-Bereg', 10, 6, 6, 9, ['Nyíregyháza I.', 'Nyíregyháza II.', 'Kisvárda', 'Vásárosnamény', 'Mátészalka', 'Nyírbátor', 'Tiszavasvári', 'Baktalórántháza', 'Fehérgyarmat', 'Nagykálló']],
    ['TO', 'Tolna', 5, 3, 3, 4, ['Szekszárd', 'Dombóvár', 'Paks', 'Bonyhád', 'Tamási']],
    ['VA', 'Vas', 5, 3, 3, 4, ['Szombathely', 'Sárvár', 'Körmend', 'Celldömölk', 'Kőszeg']],
    ['VE', 'Veszprém', 7, 4, 4, 6, ['Veszprém', 'Balatonfüred', 'Tapolca', 'Pápa', 'Ajka', 'Várpalota', 'Zirc']],
    ['ZA', 'Zala', 5, 3, 3, 4, ['Zalaegerszeg', 'Keszthely', 'Nagykanizsa', 'Lenti', 'Zalaszentgrót']],
  ];

  /* --------------------------------------------------------------------- */
  /* Historical Elections & Scenarios (1990 – 2026 Sept)                   */
  /* --------------------------------------------------------------------- */
  // Note: `parties` are ordered left-to-right ideologically for the hemicycle.
  // `smcPlan` specifies exact historical SMC seat distribution per party at baseline.
  const SCENARIOS = {
    '1990': {
      id: '1990',
      label: '1990',
      fullTitle: '1990 Parliamentary Election (May 1990)',
      era: '1990',
      totalSeats: 386,
      smcTotal: 176,
      regTotal: 152,
      compTotal: 58,
      baseThreshold: 4,
      turnout: '65.1%',
      pmOutcome: 'József Antall (MDF–FKGP–KDNP coalition, 229 seats)',
      summary: 'First free multi-party election after the fall of Communism. MDF defeated SZDSZ in the second round of SMCs and formed a center-right coalition under PM József Antall.',
      parties: [
        { id: 'MSZMP', name: 'MSZMP (Workers\' Party)', short: 'MSZMP', leader: 'Gyula Thürmer', color: '#991b1b', threshold: 4, votes: 3.7, actualSeats: 0, actualSMC: 0 },
        { id: 'MSZP', name: 'MSZP (Socialist Party)', short: 'MSZP', leader: 'Rezső Nyers / Gyula Horn', color: '#e11d48', threshold: 4, votes: 10.9, actualSeats: 33, actualSMC: 2 },
        { id: 'SZDSZ', name: 'SZDSZ (Free Democrats)', short: 'SZDSZ', leader: 'János Kis', color: '#3b82f6', threshold: 4, votes: 21.4, actualSeats: 92, actualSMC: 37 },
        { id: 'FIDESZ', name: 'Fidesz (Young Democrats)', short: 'Fidesz', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 4, votes: 9.0, actualSeats: 21, actualSMC: 2 },
        { id: 'MDF', name: 'MDF (Democratic Forum)', short: 'MDF', leader: 'József Antall', color: '#2e8b57', threshold: 4, votes: 24.7, actualSeats: 164, actualSMC: 118 },
        { id: 'KDNP', name: 'KDNP (Christian Democrats)', short: 'KDNP', leader: 'László Surján', color: '#eab308', threshold: 4, votes: 6.5, actualSeats: 21, actualSMC: 4 },
        { id: 'FKGP', name: 'FKGP (Smallholders)', short: 'FKGP', leader: 'Vince Vörös / József Torgyán', color: '#84cc16', threshold: 4, votes: 11.7, actualSeats: 44, actualSMC: 13 },
      ],
    },
    '1994': {
      id: '1994',
      label: '1994',
      fullTitle: '1994 Parliamentary Election (May 1994)',
      era: '1990',
      totalSeats: 386,
      smcTotal: 176,
      regTotal: 152,
      compTotal: 58,
      baseThreshold: 5,
      turnout: '68.9%',
      pmOutcome: 'Gyula Horn (MSZP–SZDSZ supermajority coalition, 278 seats)',
      summary: 'MSZP led by Gyula Horn won an absolute majority of seats on 33% of the list vote by sweeping 149 of 176 SMCs, and formed a ⅔ coalition with SZDSZ.',
      parties: [
        { id: 'MSZP', name: 'MSZP (Socialist Party)', short: 'MSZP', leader: 'Gyula Horn', color: '#e11d48', threshold: 5, votes: 33.0, actualSeats: 209, actualSMC: 149 },
        { id: 'SZDSZ', name: 'SZDSZ (Free Democrats)', short: 'SZDSZ', leader: 'Iván Pető / Gábor Kuncze', color: '#3b82f6', threshold: 5, votes: 19.7, actualSeats: 69, actualSMC: 17 },
        { id: 'FIDESZ', name: 'Fidesz', short: 'Fidesz', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 5, votes: 7.0, actualSeats: 20, actualSMC: 0 },
        { id: 'MDF', name: 'MDF (Democratic Forum)', short: 'MDF', leader: 'Péter Boross', color: '#2e8b57', threshold: 5, votes: 11.7, actualSeats: 38, actualSMC: 5 },
        { id: 'KDNP', name: 'KDNP (Christian Democrats)', short: 'KDNP', leader: 'László Surján', color: '#eab308', threshold: 5, votes: 7.0, actualSeats: 22, actualSMC: 3 },
        { id: 'FKGP', name: 'FKGP (Smallholders)', short: 'FKGP', leader: 'József Torgyán', color: '#84cc16', threshold: 5, votes: 8.8, actualSeats: 26, actualSMC: 2 },
        { id: 'MIEP', name: 'MIÉP (Justice & Life)', short: 'MIÉP', leader: 'István Csurka', color: '#92400e', threshold: 5, votes: 1.6, actualSeats: 0, actualSMC: 0 },
      ],
    },
    '1998': {
      id: '1998',
      label: '1998',
      fullTitle: '1998 Parliamentary Election (May 1998)',
      era: '1990',
      totalSeats: 386,
      smcTotal: 176,
      regTotal: 152,
      compTotal: 58,
      baseThreshold: 5,
      turnout: '56.3%',
      pmOutcome: 'Viktor Orbán (Fidesz–FKGP–MDF coalition, 213 seats)',
      summary: 'Although MSZP won the largest list vote share (32.9%), strategic second-round SMC coordination between Fidesz, MDF, and FKGP gave Viktor Orbán his first government.',
      parties: [
        { id: 'MSZP', name: 'MSZP (Socialist Party)', short: 'MSZP', leader: 'Gyula Horn', color: '#e11d48', threshold: 5, votes: 32.9, actualSeats: 134, actualSMC: 54 },
        { id: 'SZDSZ', name: 'SZDSZ (Free Democrats)', short: 'SZDSZ', leader: 'Gábor Kuncze', color: '#3b82f6', threshold: 5, votes: 7.6, actualSeats: 24, actualSMC: 2 },
        { id: 'MDF', name: 'MDF (Fidesz SMC ally)', short: 'MDF', leader: 'Sándor Lezsák / Ibolya Dávid', color: '#2e8b57', threshold: 5, votes: 2.8, actualSeats: 17, actualSMC: 17 },
        { id: 'FIDESZ', name: 'Fidesz (Civic Party)', short: 'Fidesz', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 5, votes: 29.5, actualSeats: 148, actualSMC: 91 },
        { id: 'FKGP', name: 'FKGP (Smallholders)', short: 'FKGP', leader: 'József Torgyán', color: '#84cc16', threshold: 5, votes: 13.2, actualSeats: 48, actualSMC: 12 },
        { id: 'MIEP', name: 'MIÉP (Justice & Life)', short: 'MIÉP', leader: 'István Csurka', color: '#92400e', threshold: 5, votes: 5.5, actualSeats: 14, actualSMC: 0 },
      ],
    },
    '2002': {
      id: '2002',
      label: '2002',
      fullTitle: '2002 Parliamentary Election (April 2002)',
      era: '1990',
      totalSeats: 386,
      smcTotal: 176,
      regTotal: 152,
      compTotal: 58,
      baseThreshold: 5,
      turnout: '70.5%',
      pmOutcome: 'Péter Medgyessy (MSZP–SZDSZ coalition, 198 seats)',
      summary: 'Intensely polarized two-bloc race. Fidesz–MDF won the most total seats (188), but MSZP (178) and SZDSZ (20) reached a 198-seat majority (10-seat margin).',
      parties: [
        { id: 'MSZP', name: 'MSZP (Socialist Party)', short: 'MSZP', leader: 'Péter Medgyessy', color: '#e11d48', threshold: 5, votes: 42.1, actualSeats: 178, actualSMC: 78 },
        { id: 'SZDSZ', name: 'SZDSZ (Free Democrats)', short: 'SZDSZ', leader: 'Gábor Kuncze', color: '#3b82f6', threshold: 5, votes: 5.6, actualSeats: 20, actualSMC: 3 },
        { id: 'FIDESZ', name: 'Fidesz–MDF Alliance', short: 'Fidesz–MDF', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 41.1, actualSeats: 188, actualSMC: 95 },
        { id: 'MIEP', name: 'MIÉP (Justice & Life)', short: 'MIÉP', leader: 'István Csurka', color: '#92400e', threshold: 5, votes: 4.4, actualSeats: 0, actualSMC: 0 },
      ],
    },
    '2006': {
      id: '2006',
      label: '2006',
      fullTitle: '2006 Parliamentary Election (April 2006)',
      era: '1990',
      totalSeats: 386,
      smcTotal: 176,
      regTotal: 152,
      compTotal: 58,
      baseThreshold: 5,
      turnout: '67.8%',
      pmOutcome: 'Ferenc Gyurcsány (MSZP–SZDSZ coalition, 210 seats)',
      summary: 'First time since 1990 an incumbent government won re-election. MSZP and SZDSZ coordinated in the second round of SMCs to win 210 seats combined.',
      parties: [
        { id: 'MSZP', name: 'MSZP (Socialist Party)', short: 'MSZP', leader: 'Ferenc Gyurcsány', color: '#e11d48', threshold: 5, votes: 43.2, actualSeats: 190, actualSMC: 104 },
        { id: 'SZDSZ', name: 'SZDSZ (Free Democrats)', short: 'SZDSZ', leader: 'Gábor Kuncze', color: '#3b82f6', threshold: 5, votes: 6.5, actualSeats: 20, actualSMC: 4 },
        { id: 'MDF', name: 'MDF (Democratic Forum)', short: 'MDF', leader: 'Ibolya Dávid', color: '#2e8b57', threshold: 5, votes: 5.0, actualSeats: 11, actualSMC: 0 },
        { id: 'FIDESZ', name: 'Fidesz–KDNP Alliance', short: 'Fidesz–KDNP', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 42.0, actualSeats: 164, actualSMC: 68 },
        { id: 'MIEP', name: 'MIÉP–Jobbik Third Way', short: 'MIÉP–Jobbik', leader: 'István Csurka / Dávid Kovács', color: '#92400e', threshold: 10, votes: 2.2, actualSeats: 0, actualSMC: 0 },
      ],
    },
    '2010': {
      id: '2010',
      label: '2010',
      fullTitle: '2010 Parliamentary Election (April 2010)',
      era: '1990',
      totalSeats: 386,
      smcTotal: 176,
      regTotal: 152,
      compTotal: 58,
      baseThreshold: 5,
      turnout: '64.4%',
      pmOutcome: 'Viktor Orbán (Fidesz–KDNP ⅔ supermajority, 263 seats)',
      summary: 'Watershed election: Fidesz–KDNP won 52.7% of list votes and 173 of 176 SMCs, achieving a 263-seat (68.1%) supermajority and adopting a new constitution and 199-seat electoral law.',
      parties: [
        { id: 'MSZP', name: 'MSZP (Socialist Party)', short: 'MSZP', leader: 'Attila Mesterházy', color: '#e11d48', threshold: 5, votes: 19.3, actualSeats: 59, actualSMC: 3 },
        { id: 'LMP', name: 'LMP (Politics Can Be Different)', short: 'LMP', leader: 'András Schiffer', color: '#4ade80', threshold: 5, votes: 7.5, actualSeats: 16, actualSMC: 0 },
        { id: 'MDF', name: 'MDF (Democratic Forum)', short: 'MDF', leader: 'Lajos Bokros / Ibolya Dávid', color: '#2e8b57', threshold: 5, votes: 2.7, actualSeats: 0, actualSMC: 0 },
        { id: 'FIDESZ', name: 'Fidesz–KDNP', short: 'Fidesz–KDNP', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 52.7, actualSeats: 263, actualSMC: 173 },
        { id: 'JOBBIK', name: 'Jobbik', short: 'Jobbik', leader: 'Gábor Vona', color: '#15803d', threshold: 5, votes: 16.7, actualSeats: 47, actualSMC: 0 },
      ],
    },
    '2014': {
      id: '2014',
      label: '2014',
      fullTitle: '2014 Parliamentary Election (April 2014)',
      era: '2014',
      totalSeats: 199,
      smcTotal: 106,
      listTotal: 93,
      minoritySeat: false,
      turnout: '61.7%',
      pmOutcome: 'Viktor Orbán (Fidesz–KDNP ⅔ supermajority, 133 seats)',
      summary: 'First election under the 2011 electoral law (199 seats, single-round FPTP in 106 SMCs, winner compensation). Fidesz–KDNP won 96 SMCs and exactly 133 seats (⅔) on 44.9% of the list vote.',
      parties: [
        { id: 'UNITY', name: 'Összefogás (MSZP–E14–DK–PM–MLP)', short: 'Összefogás', leader: 'Attila Mesterházy', color: '#e11d48', threshold: 15, votes: 25.6, actualSeats: 38, actualSMC: 10 },
        { id: 'LMP', name: 'LMP (Politics Can Be Different)', short: 'LMP', leader: 'András Schiffer / Bernadett Szél', color: '#4ade80', threshold: 5, votes: 5.3, actualSeats: 5, actualSMC: 0 },
        { id: 'FIDESZ', name: 'Fidesz–KDNP', short: 'Fidesz–KDNP', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 44.9, actualSeats: 133, actualSMC: 96 },
        { id: 'JOBBIK', name: 'Jobbik', short: 'Jobbik', leader: 'Gábor Vona', color: '#15803d', threshold: 5, votes: 20.2, actualSeats: 23, actualSMC: 0 },
      ],
    },
    '2018': {
      id: '2018',
      label: '2018',
      fullTitle: '2018 Parliamentary Election (April 2018)',
      era: '2014',
      totalSeats: 199,
      smcTotal: 106,
      listTotal: 93,
      minoritySeat: true,
      turnout: '70.2%',
      pmOutcome: 'Viktor Orbán (Fidesz–KDNP ⅔ supermajority, 133 seats + 1 German minority)',
      summary: 'Fragmented opposition allowed Fidesz–KDNP (49.3%) to sweep 91 of 106 SMCs (while opposition parties won 15 SMCs mainly in Budapest) and retain its 133-seat ⅔ supermajority.',
      parties: [
        { id: 'MSZP', name: 'MSZP–Párbeszéd', short: 'MSZP–P', leader: 'Gergely Karácsony', color: '#e11d48', threshold: 10, votes: 11.9, actualSeats: 20, actualSMC: 10 },
        { id: 'DK', name: 'DK (Democratic Coalition)', short: 'DK', leader: 'Ferenc Gyurcsány', color: '#2563eb', threshold: 5, votes: 5.4, actualSeats: 9, actualSMC: 3 },
        { id: 'LMP', name: 'LMP', short: 'LMP', leader: 'Bernadett Szél', color: '#4ade80', threshold: 5, votes: 7.1, actualSeats: 8, actualSMC: 1 },
        { id: 'MOMENTUM', name: 'Momentum Movement', short: 'Momentum', leader: 'András Fekete-Győr', color: '#a855f7', threshold: 5, votes: 3.1, actualSeats: 0, actualSMC: 0 },
        { id: 'MKKP', name: 'MKKP (Two-Tailed Dog)', short: 'MKKP', leader: 'Gergely Kovács', color: '#94a3b8', threshold: 5, votes: 1.7, actualSeats: 0, actualSMC: 0 },
        { id: 'JOBBIK', name: 'Jobbik', short: 'Jobbik', leader: 'Gábor Vona', color: '#15803d', threshold: 5, votes: 19.1, actualSeats: 26, actualSMC: 1 },
        { id: 'FIDESZ', name: 'Fidesz–KDNP', short: 'Fidesz–KDNP', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 49.3, actualSeats: 133, actualSMC: 91 },
      ],
    },
    '2022': {
      id: '2022',
      label: '2022',
      fullTitle: '2022 Parliamentary Election (April 2022)',
      era: '2014',
      totalSeats: 199,
      smcTotal: 106,
      listTotal: 93,
      minoritySeat: true,
      turnout: '70.2%',
      pmOutcome: 'Viktor Orbán (Fidesz–KDNP ⅔ supermajority, 135 seats)',
      summary: 'Six opposition parties united as Egységben Magyarországért (PM candidate Péter Márki-Zay), winning 17 of 18 Budapest SMCs plus Pécs and Szeged, but Fidesz–KDNP surged to 54.1% nationally (135 seats).',
      parties: [
        { id: 'EM', name: 'Egységben Magyarországért (6-party)', short: 'Egységben', leader: 'Péter Márki-Zay', color: '#2563eb', threshold: 15, votes: 34.4, actualSeats: 57, actualSMC: 19 },
        { id: 'MKKP', name: 'MKKP (Two-Tailed Dog)', short: 'MKKP', leader: 'Gergely Kovács', color: '#94a3b8', threshold: 5, votes: 3.3, actualSeats: 0, actualSMC: 0 },
        { id: 'MEMO', name: 'Megoldás Mozgalom', short: 'MEMO', leader: 'György Gattyán', color: '#06b6d4', threshold: 5, votes: 1.0, actualSeats: 0, actualSMC: 0 },
        { id: 'FIDESZ', name: 'Fidesz–KDNP', short: 'Fidesz–KDNP', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 54.1, actualSeats: 135, actualSMC: 87 },
        { id: 'MIHAZANK', name: 'Mi Hazánk (Our Homeland)', short: 'Mi Hazánk', leader: 'László Toroczkai', color: '#65a30d', threshold: 5, votes: 5.9, actualSeats: 6, actualSMC: 0 },
      ],
    },
    '2026': {
      id: '2026',
      label: '2026 (Apr election)',
      fullTitle: '2026 Parliamentary Election (April 12, 2026)',
      era: '2026',
      totalSeats: 199,
      smcTotal: 106,
      listTotal: 93,
      minoritySeat: false,
      turnout: '79.0%',
      pmOutcome: 'Péter Magyar (TISZA ⅔ supermajority, 141 seats)',
      summary: 'Historic political turnover on record 79.0% turnout: Péter Magyar\'s TISZA Party won 53.18% of the list vote and 97 of 106 SMCs (141 seats total, a ⅔ supermajority), ending Viktor Orbán\'s 16-year rule (Fidesz–KDNP: 38.61%, 52 seats; Mi Hazánk: 5.63%, 6 seats). Includes the 2026 map redistricting (Budapest 16 SMCs, Pest 14 SMCs).',
      parties: [
        { id: 'DK', name: 'DK (Democratic Coalition)', short: 'DK', leader: 'Klára Dobrev / Ferenc Gyurcsány', color: '#2563eb', threshold: 5, votes: 1.0, actualSeats: 0, actualSMC: 0 },
        { id: 'MKKP', name: 'MKKP (Two-Tailed Dog)', short: 'MKKP', leader: 'Gergely Kovács', color: '#94a3b8', threshold: 5, votes: 1.4, actualSeats: 0, actualSMC: 0 },
        { id: 'TISZA', name: 'TISZA (Respect & Freedom)', short: 'TISZA', leader: 'Péter Magyar', color: '#0ea5e9', threshold: 5, votes: 53.2, actualSeats: 141, actualSMC: 97 },
        { id: 'FIDESZ', name: 'Fidesz–KDNP', short: 'Fidesz–KDNP', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 38.6, actualSeats: 52, actualSMC: 9 },
        { id: 'MIHAZANK', name: 'Mi Hazánk (Our Homeland)', short: 'Mi Hazánk', leader: 'László Toroczkai', color: '#65a30d', threshold: 5, votes: 5.6, actualSeats: 6, actualSMC: 0 },
      ],
    },
    '2026_sept': {
      id: '2026_sept',
      label: '2026 Sept (Poll / Scenario)',
      fullTitle: 'September 2026 Opinion Poll / Post-Election Scenario (Medián / PolitPro)',
      era: '2026',
      totalSeats: 199,
      smcTotal: 106,
      listTotal: 93,
      minoritySeat: false,
      turnout: '~72% (projected)',
      pmOutcome: 'Péter Magyar (TISZA projected >¾ majority, ~159 seats)',
      summary: 'September 2026 post-election polling scenario (Medián / PolitPro aggregate among decided voters): PM Péter Magyar\'s governing TISZA Party leads around 61%, while opposition Fidesz–KDNP stands near 27% and Mi Hazánk at 7.5%. Actual column shows April 2026 election seats for comparison.',
      parties: [
        { id: 'DK', name: 'DK (Democratic Coalition)', short: 'DK', leader: 'Klára Dobrev', color: '#2563eb', threshold: 5, votes: 1.5, actualSeats: 0, actualSMC: 0 },
        { id: 'MKKP', name: 'MKKP (Two-Tailed Dog)', short: 'MKKP', leader: 'Gergely Kovács', color: '#94a3b8', threshold: 5, votes: 2.8, actualSeats: 0, actualSMC: 0 },
        { id: 'TISZA', name: 'TISZA (Respect & Freedom)', short: 'TISZA', leader: 'Péter Magyar (PM)', color: '#0ea5e9', threshold: 5, votes: 61.0, actualSeats: 141, actualSMC: 97 },
        { id: 'FIDESZ', name: 'Fidesz–KDNP', short: 'Fidesz–KDNP', leader: 'Viktor Orbán', color: '#ff7a00', threshold: 10, votes: 27.0, actualSeats: 52, actualSMC: 9 },
        { id: 'MIHAZANK', name: 'Mi Hazánk (Our Homeland)', short: 'Mi Hazánk', leader: 'László Toroczkai', color: '#65a30d', threshold: 5, votes: 7.5, actualSeats: 6, actualSMC: 0 },
      ],
    },
  };

  /* --------------------------------------------------------------------- */
  /* Build deterministic constituencies & baseline percentages per scenario */
  /* --------------------------------------------------------------------- */
  const scenarioCache = {};

  function getScenarioData(scenId) {
    if (scenarioCache[scenId]) return scenarioCache[scenId];
    const scen = SCENARIOS[scenId];
    // For 2026_sept, use the 2026 April election baseline map so swings are measured directly from April 2026!
    if (scenId === '2026_sept') {
      const apr = getScenarioData('2026');
      const data = {
        scen,
        defaultVotes: {},
        baseRefVotes: clone(apr.defaultVotes),
        constituencies: clone(apr.constituencies),
      };
      scen.parties.forEach((p) => (data.defaultVotes[p.id] = p.votes));
      scenarioCache[scenId] = data;
      return data;
    }

    const defaultVotes = {};
    scen.parties.forEach((p) => (defaultVotes[p.id] = p.votes));

    // Build flat list of constituencies grouped by county
    const constituencies = [];
    COUNTIES.forEach(([code, cname, smc90, smc14, smc26, reg90, towns]) => {
      const count = scen.era === '1990' ? smc90 : scen.era === '2026' ? smc26 : smc14;
      for (let i = 1; i <= count; i++) {
        const id = `${code}-${String(i).padStart(2, '0')}`;
        const town = towns[i - 1] || `${cname} #${i}`;
        // Urban score: Budapest = 1.0, Pest & county seats (i === 1 or 2) = 0.65, rural = 0.15
        const urban = code === 'BP' ? 1.0 : code === 'PE' ? 0.65 : i === 1 ? 0.62 : i === 2 && count >= 5 ? 0.48 : 0.15;
        constituencies.push({
          id,
          code,
          countyName: cname,
          num: i,
          name: `${cname} ${String(i).padStart(2, '0')} · ${town}`,
          shortTown: town,
          urban,
          regSeats90: reg90,
          countySmcCount: count,
        });
      }
    });

    // Assign each constituency its historical baseline winner and margin so that at defaultVotes,
    // the exact historical SMC seat count and geographic pattern (Budapest/urban vs rural) emerge.
    const rnd = rng('HU-' + scenId);
    const partyList = scen.parties;
    const sortedBySMC = [...partyList].sort((a, b) => b.actualSMC - a.actualSMC);
    const mainParty = sortedBySMC[0].id;
    const secondParty = (sortedBySMC[1] || sortedBySMC[0]).id;

    // Score constituencies by how favorable they are to non-main parties (urban vs rural depending on era)
    const scored = constituencies.map((c, idx) => {
      let oppAffinity = c.urban + noise(rnd) * 0.14;
      // In 2026, Fidesz's 14 remaining SMCs were rural strongholds in GY, VA, SZ, BK, HB, TO, ZA
      if (scenId === '2026') {
        const fidStrong = ['SZ', 'GY', 'VA', 'BK', 'TO', 'ZA', 'SO'].includes(c.code) && c.num >= 2;
        oppAffinity = (fidStrong ? 0.85 : 0.2) - c.urban * 0.5 + noise(rnd) * 0.12;
      } else if (scenId === '1994' || scenId === '2006') {
        // MSZP was strong in Budapest & industrial East; Fidesz/MDF stronger in Western rural counties
        const westRight = ['GY', 'VA', 'ZA', 'VE', 'BK', 'TO'].includes(c.code) && c.num >= 2;
        oppAffinity = (westRight ? 0.75 : 0.3) - c.urban * 0.25 + noise(rnd) * 0.15;
      } else if (scenId === '1998' || scenId === '2002') {
        // MSZP/SZDSZ strong in Budapest & industrial/urban seats
        oppAffinity = c.urban * 0.8 + (['BZ', 'HE', 'NO', 'MS'].includes(c.code) ? 0.25 : 0) + noise(rnd) * 0.12;
      } else if (scenId === '1990') {
        // SZDSZ strong in Budapest & northwest; FKGP strong in Békés, Bács, Somogy
        oppAffinity = c.urban * 0.7 + (['GY', 'KE', 'BE', 'BK', 'SO'].includes(c.code) ? 0.25 : 0) + noise(rnd) * 0.12;
      }
      return { idx, c, oppAffinity };
    });

    scored.sort((a, b) => b.oppAffinity - a.oppAffinity);

    // Allocate exact historical SMC winners along the affinity ranking
    const assignedWinner = new Array(constituencies.length).fill(mainParty);
    let cursor = 0;
    for (let k = 1; k < sortedBySMC.length; k++) {
      const p = sortedBySMC[k];
      for (let s = 0; s < p.actualSMC && cursor < scored.length; s++, cursor++) {
        assignedWinner[scored[cursor].idx] = p.id;
      }
    }

    // Now build realistic baseline percentages `basePcts` for each constituency
    constituencies.forEach((c, idx) => {
      const winId = assignedWinner[idx];
      // Rank within winner's group determines margin (from 1.4% swing seat up to 18% stronghold)
      const rankPos = scored.findIndex((x) => x.idx === idx);
      const isMain = winId === mainParty;
      const relPos = isMain
        ? (rankPos - cursor) / Math.max(1, constituencies.length - cursor)
        : (cursor - 1 - rankPos) / Math.max(1, cursor);
      const margin = 1.6 + Math.pow(Math.max(0, relPos), 1.15) * (scenId === '2010' || scenId === '2026' ? 21 : 15);

      const raw = {};
      scen.parties.forEach((p) => {
        const n = noise(rnd) * 1.2;
        raw[p.id] = Math.max(0.4, defaultVotes[p.id] + n);
      });

      const runnerUpId = winId === mainParty ? secondParty : mainParty;
      const twoPartyAvg = (raw[winId] + raw[runnerUpId]) / 2;
      raw[winId] = Math.max(raw[winId], twoPartyAvg + margin / 2);
      raw[runnerUpId] = Math.max(2.0, raw[winId] - margin);

      // Ensure no third party accidentally exceeds runnerUpId
      scen.parties.forEach((p) => {
        if (p.id !== winId && p.id !== runnerUpId && raw[p.id] >= raw[runnerUpId]) {
          raw[p.id] = Math.max(0.5, raw[runnerUpId] - 1.5);
        }
      });

      c.basePcts = normalize(raw, 100);
      c.histWinner = winId;
    });

    const data = {
      scen,
      defaultVotes,
      baseRefVotes: clone(defaultVotes),
      constituencies,
    };
    scenarioCache[scenId] = data;
    return data;
  }

  /* --------------------------------------------------------------------- */
  /* Simulation Engine (1990–2010 and 2014–2026 systems)                   */
  /* --------------------------------------------------------------------- */
  function runSimulation(state) {
    const data = getScenarioData(state.scenId);
    const scen = data.scen;
    const parties = scen.parties;
    const pMap = {};
    parties.forEach((p) => (pMap[p.id] = p));

    // 1. Compute national list votes (scaled to 100% of party votes if needed)
    const rawTotal = sum(state.votes);
    const scale = rawTotal > 100 ? 100 / rawTotal : 1;
    const natPct = {};
    parties.forEach((p) => (natPct[p.id] = (state.votes[p.id] || 0) * scale));

    // 2. Compute constituency-level percentages & winners
    const smcSeats = {};
    parties.forEach((p) => (smcSeats[p.id] = 0));

    const constResults = data.constituencies.map((c) => {
      let pcts;
      let isOverride = false;
      if (state.customPcts[c.id]) {
        pcts = normalize(state.customPcts[c.id], 100);
        isOverride = true;
      } else {
        const swung = {};
        parties.forEach((p) => {
          const ref = data.baseRefVotes[p.id] || 0;
          const cur = natPct[p.id] || 0;
          const delta = cur - ref;
          // If user drags a party near 0, scale down proportionally; otherwise uniform swing
          const val = cur <= 0.05 ? 0 : ref > 0 && cur < ref * 0.5 ? c.basePcts[p.id] * (cur / ref) : c.basePcts[p.id] + delta;
          swung[p.id] = Math.max(0, val);
        });
        pcts = sum(swung) > 0 ? normalize(swung, 100) : clone(c.basePcts);
      }

      let winner = argmax(pcts);
      if (state.winnerOverrides[c.id] && pMap[state.winnerOverrides[c.id]]) {
        const forced = state.winnerOverrides[c.id];
        isOverride = true;
        if (winner !== forced) {
          // Adjust pcts minimally so forced winner leads for realistic fragment votes
          const adj = clone(pcts);
          const topVal = pcts[winner] || 30;
          adj[forced] = topVal + 2.0;
          pcts = normalize(adj, 100);
          winner = forced;
        }
      }

      const rnk = ranked(pcts);
      const runnerUp = rnk[1] ? rnk[1][0] : winner;
      const margin = (pcts[winner] || 0) - (pcts[runnerUp] || 0);
      smcSeats[winner] = (smcSeats[winner] || 0) + 1;

      return {
        c,
        pcts,
        winner,
        runnerUp,
        margin,
        isOverride,
      };
    });

    // 3. Allocate List & Compensation Seats according to the era's electoral law
    const listSeats = {};
    const regSeats = {};
    const compSeats = {};
    parties.forEach((p) => {
      listSeats[p.id] = 0;
      regSeats[p.id] = 0;
      compSeats[p.id] = 0;
    });

    const totalNatPartyPct = sum(natPct) || 100;
    const eligible = {};
    parties.forEach((p) => {
      const share = (natPct[p.id] / Math.max(100, totalNatPartyPct)) * 100;
      const req = state.enforceThresholds ? p.threshold : 0;
      eligible[p.id] = share >= req && natPct[p.id] > 0;
    });

    const votersPerSMC = 52000;
    const totalValidVotes = scen.smcTotal * votersPerSMC;
    const fragmentVotes = {};
    parties.forEach((p) => (fragmentVotes[p.id] = 0));

    if (scen.era === '1990') {
      // 1990–2010: 152 Regional List seats (with ~28 remainder seats rolling over to National Compensation List = 124 Reg + 86 Comp = 210 list seats)
      const effectiveRegTotal = 124;
      const effectiveCompTotal = scen.regTotal + scen.compTotal - effectiveRegTotal; // 86
      const eligVotes = {};
      parties.forEach((p) => {
        if (eligible[p.id]) eligVotes[p.id] = natPct[p.id] * totalValidVotes * 0.01;
      });
      const regAlloc = methods.dhondt(eligVotes, effectiveRegTotal);
      for (const k in regAlloc) regSeats[k] = regAlloc[k];

      // Losing SMC candidates generate fragment votes for compensation seats
      constResults.forEach((cr) => {
        parties.forEach((p) => {
          if (eligible[p.id] && p.id !== cr.winner) {
            fragmentVotes[p.id] += (cr.pcts[p.id] / 100) * votersPerSMC;
          }
        });
      });
      const compAlloc = methods.dhondt(fragmentVotes, effectiveCompTotal);
      for (const k in compAlloc) compSeats[k] = compAlloc[k];
      parties.forEach((p) => (listSeats[p.id] = regSeats[p.id] + compSeats[p.id]));
    } else {
      // 2014–2026: 93 National List seats (minus 1 if German minority seat is active)
      const minorityCount = state.minoritySeat ? 1 : 0;
      const availListSeats = scen.listTotal - minorityCount;

      constResults.forEach((cr) => {
        const winVotes = (cr.pcts[cr.winner] / 100) * votersPerSMC;
        const secondVotes = (cr.pcts[cr.runnerUp] / 100) * votersPerSMC;
        parties.forEach((p) => {
          if (!eligible[p.id]) return;
          if (p.id === cr.winner) {
            if (state.winnerComp) {
              fragmentVotes[p.id] += Math.max(0, (winVotes - secondVotes - 1) * 1.45);
            }
          } else {
            fragmentVotes[p.id] += (cr.pcts[p.id] / 100) * votersPerSMC * 0.85;
          }
        });
      });

      const dHondtPool = {};
      parties.forEach((p) => {
        if (eligible[p.id]) {
          const directListVotes = (natPct[p.id] / 100) * totalValidVotes * 1.18;
          dHondtPool[p.id] = directListVotes + fragmentVotes[p.id];
        }
      });
      const alloc = methods.dhondt(dHondtPool, availListSeats);
      for (const k in alloc) listSeats[k] = alloc[k];
    }

    const totalSeatsByParty = {};
    parties.forEach((p) => {
      totalSeatsByParty[p.id] = (smcSeats[p.id] || 0) + (listSeats[p.id] || 0);
    });

    return {
      scen,
      parties,
      pMap,
      natPct,
      eligible,
      constResults,
      smcSeats,
      listSeats,
      regSeats,
      compSeats,
      totalSeatsByParty,
      minorityCount: scen.era !== '1990' && state.minoritySeat ? 1 : 0,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Persistent Module State                                               */
  /* --------------------------------------------------------------------- */
  let state = null;

  function initScenarioState(scenId) {
    const data = getScenarioData(scenId);
    state = {
      scenId,
      votes: clone(data.defaultVotes),
      winnerOverrides: {},
      customPcts: {},
      brush: 'inspect',
      winnerComp: true,
      minoritySeat: !!data.scen.minoritySeat,
      enforceThresholds: true,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Render UI                                                             */
  /* --------------------------------------------------------------------- */
  function render(root) {
    if (!state) initScenarioState('2026');
    root.innerHTML = '';

    const data = getScenarioData(state.scenId);
    const scen = data.scen;
    const L = ui.layout();
    root.appendChild(L.root);

    /* =================================================================== */
    /* LEFT COLUMN: Scenario Selector, Sliders, Electoral Options          */
    /* =================================================================== */

    // 1. Election Year / Scenario Card
    const scenCard = ui.card('Election Year & Scenario (1990 – Sept 2026)');
    L.left.appendChild(scenCard.card);

    const yearBar = el('div', { class: 'hu-year-bar' });
    Object.values(SCENARIOS).forEach((s) => {
      const btn = el('button', {
        class: 'hu-year-btn' + (s.id === state.scenId ? ' active' : '') + (s.id === '2026_sept' ? ' poll' : ''),
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

    const metaGrid = el('div', { class: 'hu-meta' }, [
      el('div', { class: 'hu-kpi' }, [
        el('div', { class: 'k-lbl', text: 'System & Seats' }),
        el('div', { class: 'k-val', text: `${scen.totalSeats} seats (${scen.smcTotal} SMC)` }),
      ]),
      el('div', { class: 'hu-kpi' }, [
        el('div', { class: 'k-lbl', text: 'Turnout' }),
        el('div', { class: 'k-val', text: scen.turnout }),
      ]),
    ]);
    scenCard.body.appendChild(metaGrid);
    scenCard.body.appendChild(
      ui.note(`<b>${scen.fullTitle}:</b> ${scen.summary}<br><span class="muted">Historical outcome: ${scen.pmOutcome}</span>`, 'info')
    );

    // 2. National Party List % Sliders Card
    const resetNatBtn = el('button', {
      class: 'btn btn-xs',
      text: 'Reset to baseline',
      onclick: () => {
        sliderCtrl.setValues(clone(data.defaultVotes));
        state.winnerOverrides = {};
        state.customPcts = {};
        updateAll();
      },
    });
    const slidersCard = ui.card('National List Vote % (with Party Leaders)', '', resetNatBtn);
    L.left.appendChild(slidersCard.card);

    // Order sliders by default vote share descending for intuitive use
    const partiesByVote = [...scen.parties].sort((a, b) => b.votes - a.votes);
    const sliderCtrl = ui.sliders(partiesByVote, state.votes, {
      max: 75,
      step: 0.1,
      showOthers: true,
      onChange: () => updateAll(),
    });
    slidersCard.body.appendChild(sliderCtrl.el);

    // 3. Electoral Rules & Simulation Controls Card
    const rulesCard = ui.card('Electoral System & Controls');
    L.left.appendChild(rulesCard.card);

    const optWrap = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' } });

    const threshChk = el('input', { type: 'checkbox', checked: state.enforceThresholds });
    threshChk.addEventListener('change', () => {
      state.enforceThresholds = threshChk.checked;
      updateAll();
    });
    optWrap.appendChild(
      el('label', { class: 'check' }, [
        threshChk,
        el('span', {
          text:
            scen.era === '1990'
              ? `Enforce ${scen.baseThreshold}% national threshold (10% for two-party lists)`
              : 'Enforce 5% / 10% (2-party) / 15% (3+ party) list thresholds',
        }),
      ])
    );

    if (scen.era !== '1990') {
      const wcChk = el('input', { type: 'checkbox', checked: state.winnerComp });
      wcChk.addEventListener('change', () => {
        state.winnerComp = wcChk.checked;
        updateAll();
      });
      optWrap.appendChild(
        el('label', { class: 'check' }, [
          wcChk,
          el('span', { text: 'Include winner compensation (győzteskompenzáció: winner − 2nd − 1)' }),
        ])
      );

      const minChk = el('input', { type: 'checkbox', checked: state.minoritySeat });
      minChk.addEventListener('change', () => {
        state.minoritySeat = minChk.checked;
        updateAll();
      });
      optWrap.appendChild(
        el('label', { class: 'check' }, [
          minChk,
          el('span', { text: 'German nationality preferential seat (MNOÖ – 1 seat from 93 list)' }),
        ])
      );
    }

    rulesCard.body.appendChild(optWrap);

    const actionRow = el('div', { class: 'row', style: { marginBottom: '10px' } }, [
      el('button', {
        class: 'btn btn-xs',
        text: 'Clear All Constituency Overrides',
        onclick: () => {
          state.winnerOverrides = {};
          state.customPcts = {};
          updateAll();
        },
      }),
      el('button', {
        class: 'btn btn-xs',
        text: 'Equal Two-Way Race (45%–45%)',
        onclick: () => {
          const top2 = partiesByVote.slice(0, 2);
          const next = {};
          scen.parties.forEach((p) => (next[p.id] = p.votes));
          if (top2.length === 2) {
            next[top2[0].id] = 45.0;
            next[top2[1].id] = 45.0;
          }
          sliderCtrl.setValues(next);
          updateAll();
        },
      }),
    ]);
    rulesCard.body.appendChild(actionRow);

    const sysNoteText =
      scen.era === '1990'
        ? `<b>1990–2010 Electoral System (386 seats):</b> 176 single-member constituencies (SMCs) across Budapest (32) and 19 counties + 152 regional county list seats + 58 national compensation list seats allocated via D'Hondt using fragment votes cast for losing SMC candidates (${scen.baseThreshold}% threshold).`
        : `<b>2014–2026 Electoral System (199 seats):</b> 106 single-member constituencies (FPTP) + 93 national list seats allocated by D'Hondt on party-list votes plus fragment votes from both losing SMC candidates and winning candidates' surplus (<i>winner − runner-up − 1</i>). ${
            scen.era === '2026'
              ? '<b>2026 Redistricting:</b> Budapest was reduced from 18 to 16 SMCs and Pest County increased from 12 to 14 SMCs.'
              : ''
          }`;
    rulesCard.body.appendChild(ui.note(sysNoteText, 'info'));

    /* =================================================================== */
    /* RIGHT COLUMN: Hemicycle, Constituencies Grid, Results, Coalition    */
    /* =================================================================== */

    // 1. Parliament Hemicycle & PM Candidate Summary Card
    const hcCard = ui.card(`Országgyűlés – ${scen.totalSeats} Seats (Majority: ${Math.floor(scen.totalSeats / 2) + 1} · ⅔ Supermajority: ${Math.ceil((scen.totalSeats * 2) / 3)})`);
    L.right.appendChild(hcCard.card);
    const candBox = el('div', { style: { marginBottom: '12px' } });
    const hcBox = el('div');
    const seatBarBox = el('div');
    hcCard.body.appendChild(candBox);
    hcCard.body.appendChild(hcBox);
    hcCard.body.appendChild(seatBarBox);

    // 2. Constituencies (OEVK) Interactive Tile Grid Card
    const overrideBadge = el('span', { class: 'badge out', text: '0 custom overrides' });
    const mapCard = ui.card(
      `Single-Member Constituencies (${scen.smcTotal} OEVKs · Budapest + 19 Counties)`,
      '',
      overrideBadge
    );
    L.right.appendChild(mapCard.card);

    // Paint-brush toolbar
    const toolbar = el('div', { class: 'map-toolbar' });
    const brushItems = [
      { id: 'inspect', label: '🔍 Inspect / Edit Constituency %', color: '#5b8cff' },
      ...partiesByVote.map((p) => ({ id: p.id, label: `Paint: ${p.short}`, color: p.color })),
      { id: 'reset', label: '↺ Reset Tile', color: '#9aa3b5' },
    ];
    brushItems.forEach((b) => {
      const chip = el(
        'button',
        {
          class: 'paint-chip' + (state.brush === b.id ? ' active' : ''),
          style: { '--c': b.color },
        },
        [
          b.id !== 'inspect' && b.id !== 'reset'
            ? el('span', { class: 'swatch', style: { background: b.color } })
            : null,
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

    const countyGridEl = el('div', { class: 'hu-county-grid' });
    mapCard.body.appendChild(countyGridEl);

    const tip = ui.tooltip();
    const tileEls = {};
    const countyHeaderSeatEls = {};

    // Build county boxes and constituency tiles once; update fills dynamically
    COUNTIES.forEach(([code, cname]) => {
      const countyConsts = data.constituencies.filter((c) => c.code === code);
      const countLabel = el('span', { text: `${countyConsts.length}` });
      countyHeaderSeatEls[code] = countLabel;

      const box = el('div', { class: 'hu-county-box' });
      box.appendChild(
        el('div', { class: 'hu-county-head' }, [
          el('span', { text: `${cname} (${countyConsts.length})` }),
          countLabel,
        ])
      );
      const tilesWrap = el('div', { class: 'tiles' });
      countyConsts.forEach((c) => {
        const t = el('div', { class: 'tile', text: String(c.num) });
        t.addEventListener('click', () => onTileClick(c.id));
        t.addEventListener('mouseenter', (e) => showTileTooltip(e, c.id));
        t.addEventListener('mousemove', (e) => tip.move(e));
        t.addEventListener('mouseleave', () => tip.hide());
        tileEls[c.id] = t;
        tilesWrap.appendChild(t);
      });
      box.appendChild(tilesWrap);
      countyGridEl.appendChild(box);
    });

    // 3. Results Table & Coalition Builder (side-by-side grid2)
    const bottomGrid = el('div', { class: 'grid2' });
    L.right.appendChild(bottomGrid);

    const tblCard = ui.card('Detailed Seat Breakdown & Historical Comparison');
    const coalCard = ui.card('Coalition & Supermajority Builder');
    bottomGrid.appendChild(tblCard.card);
    bottomGrid.appendChild(coalCard.card);

    let lastSim = null;

    function showTileTooltip(e, cid) {
      if (!lastSim) return;
      const cr = lastSim.constResults.find((x) => x.c.id === cid);
      if (!cr) return;
      const winP = lastSim.pMap[cr.winner];
      const rowsHtml = ranked(cr.pcts)
        .slice(0, 6)
        .map(([pid, pct]) => {
          const p = lastSim.pMap[pid];
          if (!p) return '';
          return `<tr>
            <td><span style="color:${p.color}">■</span> ${p.short}</td>
            <td style="color:#9aa3b5;font-size:11px">${p.leader.split('/')[0].trim()}</td>
            <td style="text-align:right;font-weight:${pid === cr.winner ? '700' : '400'}">${fmt(pct, 1)}%</td>
          </tr>`;
        })
        .join('');
      tip.show(
        e,
        `<b>${cr.c.name}</b>${cr.isOverride ? ' <span style="color:#ffb547">(Custom Override)</span>' : ''}<br>` +
          `Winner: <b style="color:${winP.color}">${winP.short}</b> (${winP.leader}) · Margin: <b>+${fmt(cr.margin, 1)}%</b>` +
          `<table>${rowsHtml}</table>` +
          `<div class="muted small" style="margin-top:4px">Click tile to edit constituency % or override winner</div>`
      );
    }

    function onTileClick(cid) {
      if (state.brush === 'reset') {
        delete state.winnerOverrides[cid];
        delete state.customPcts[cid];
        updateAll();
        return;
      }
      if (state.brush !== 'inspect') {
        state.winnerOverrides[cid] = state.brush;
        delete state.customPcts[cid];
        updateAll();
        return;
      }
      openConstituencyModal(cid);
    }

    function openConstituencyModal(cid) {
      if (!lastSim) return;
      const cr = lastSim.constResults.find((x) => x.c.id === cid);
      if (!cr) return;
      const localVals = clone(cr.pcts);

      ui.modal(`Constituency: ${cr.c.name}`, (body, close) => {
        body.appendChild(
          el('div', {
            class: 'muted small',
            html: `Quick-assign winner or customize party vote shares specifically for <b>${cr.c.name}</b>. Fragment votes and national winner compensation will automatically recompute.`,
          })
        );

        // Quick winner override buttons
        const winRow = el('div', { class: 'row' }, [
          el('span', { class: 'muted small', text: 'Force winner:' }),
        ]);
        partiesByVote.forEach((p) => {
          const b = el(
            'button',
            {
              class: 'chip' + (state.winnerOverrides[cid] === p.id ? ' on' : ''),
              style: { '--c': p.color },
              onclick: () => {
                state.winnerOverrides[cid] = p.id;
                delete state.customPcts[cid];
                updateAll();
                close();
              },
            },
            [el('span', { class: 'swatch', style: { background: p.color } }), `${p.short} (${p.leader.split('/')[0].trim()})`]
          );
          winRow.appendChild(b);
        });
        body.appendChild(winRow);

        // Per-constituency % sliders
        const modalSliders = ui.sliders(partiesByVote, localVals, {
          max: 85,
          step: 0.1,
          showOthers: false,
          onChange: (vals) => {
            delete state.winnerOverrides[cid];
            state.customPcts[cid] = clone(vals);
            updateAll();
          },
        });
        body.appendChild(modalSliders.el);

        const foot = el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '6px' } }, [
          el('button', {
            class: 'btn',
            text: '↺ Reset Constituency to National Model',
            onclick: () => {
              delete state.winnerOverrides[cid];
              delete state.customPcts[cid];
              updateAll();
              close();
            },
          }),
          el('button', { class: 'btn btn-primary', text: 'Done', onclick: close }),
        ]);
        body.appendChild(foot);
      });
    }

    function updateAll() {
      const sim = (lastSim = runSimulation(state));
      const total = scen.totalSeats;
      const majority = Math.floor(total / 2) + 1;
      const superMaj = Math.ceil((total * 2) / 3);

      // 1. Update Top Candidate Cards (top 3 parties by seats/votes)
      candBox.innerHTML = '';
      const sortedParties = [...scen.parties].sort(
        (a, b) => (sim.totalSeatsByParty[b.id] || 0) - (sim.totalSeatsByParty[a.id] || 0) || (sim.natPct[b.id] || 0) - (sim.natPct[a.id] || 0)
      );
      const topCards = el('div', { class: 'cands' });
      sortedParties.slice(0, 3).forEach((p) => {
        const seats = sim.totalSeatsByParty[p.id] || 0;
        const smc = sim.smcSeats[p.id] || 0;
        const lst = sim.listSeats[p.id] || 0;
        const isSuper = seats >= superMaj;
        const isMaj = seats >= majority;
        topCards.appendChild(
          el('div', { class: 'cand' + (isMaj ? ' win' : ''), style: { '--c': p.color } }, [
            el('div', { class: 'cname', text: p.leader }),
            el('div', { class: 'cparty', text: `${p.name} · ${fmt(sim.natPct[p.id], 1)}% list` }),
            el('div', { class: 'cval', style: { color: p.color }, text: `${seats} seats` }),
            el('div', { class: 'muted small', text: `${smc} SMC + ${lst} List (${fmt((seats / total) * 100, 1)}%)` }),
            isSuper
              ? el('span', { class: 'badge', text: '⅔ CONSTITUTIONAL SUPERMAJORITY' })
              : isMaj
              ? el('span', { class: 'badge', text: 'ABSOLUTE MAJORITY' })
              : null,
          ])
        );
      });
      candBox.appendChild(topCards);

      // 2. Update Hemicycle (left-to-right ideological order)
      const hcParties = scen.parties.map((p) => ({
        id: p.id,
        name: p.name,
        leader: `PM/Leader: ${p.leader} · ${sim.smcSeats[p.id]} SMC + ${sim.listSeats[p.id]} List`,
        color: p.color,
        seats: sim.totalSeatsByParty[p.id] || 0,
      }));
      if (sim.minorityCount > 0) {
        hcParties.push({
          id: 'MNOO',
          name: 'MNOÖ (German Nationality List)',
          leader: 'Imre Ritter (Preferential minority seat)',
          color: '#94a3b8',
          seats: sim.minorityCount,
        });
      }
      const leadParty = sortedParties[0];
      const leadSeats = sim.totalSeatsByParty[leadParty.id] || 0;
      ES.hemicycle(hcBox, hcParties, {
        total,
        majority,
        centerLabel: leadSeats >= majority ? `${leadParty.short} ${leadSeats}` : String(total),
        subtitle: `Maj: ${majority} · ⅔ Supermaj: ${superMaj}`,
      });

      // 3. Update Seat Bar (with both 50% majority line and ⅔ supermajority line)
      seatBarBox.innerHTML = '';
      const sbEl = ui.seatBar(
        hcParties.map((p) => ({ name: `${p.name} (${p.seats})`, color: p.color, seats: p.seats })),
        total,
        majority,
        {
          label: `White line: Majority (${majority}) · Amber line: ⅔ Supermajority (${superMaj})`,
          unit: 'seats',
        }
      );
      const barInner = sbEl.querySelector('.seatbar');
      if (barInner) {
        barInner.appendChild(
          el('div', {
            class: 'hu-superline',
            style: { left: (superMaj / total) * 100 + '%' },
            title: `⅔ Supermajority (${superMaj} seats)`,
          })
        );
      }
      seatBarBox.appendChild(sbEl);

      // 4. Update Constituency Tiles & County summaries
      let overrideCount = 0;
      const countyWinCounts = {};
      sim.constResults.forEach((cr) => {
        const t = tileEls[cr.c.id];
        if (!t) return;
        const winP = sim.pMap[cr.winner];
        const strength = Math.min(1, 0.48 + (cr.margin / 24) * 0.52);
        const bg = shade(winP.color, strength);
        t.style.background = bg;
        t.style.color = textOn(bg);
        t.classList.toggle('override', cr.isOverride);
        if (cr.isOverride) overrideCount++;

        countyWinCounts[cr.c.code] = countyWinCounts[cr.c.code] || {};
        countyWinCounts[cr.c.code][cr.winner] = (countyWinCounts[cr.c.code][cr.winner] || 0) + 1;
      });

      overrideBadge.textContent =
        overrideCount > 0 ? `${overrideCount} custom override${overrideCount > 1 ? 's' : ''}` : 'Model baseline';
      overrideBadge.className = 'badge ' + (overrideCount > 0 ? '' : 'out');

      COUNTIES.forEach(([code]) => {
        const hdr = countyHeaderSeatEls[code];
        if (!hdr) return;
        const cw = countyWinCounts[code] || {};
        hdr.innerHTML = ranked(cw)
          .map(([pid, n]) => `<span style="color:${sim.pMap[pid].color}">${sim.pMap[pid].short}:${n}</span>`)
          .join(' ');
      });

      // 5. Update Detailed Results Table
      tblCard.body.innerHTML = '';
      const tableRows = sortedParties.map((p) => {
        const tot = sim.totalSeatsByParty[p.id] || 0;
        const diff = tot - p.actualSeats;
        const diffStr =
          diff === 0
            ? '<span class="muted">±0</span>'
            : diff > 0
            ? `<span class="hu-diff-pos">+${diff}</span>`
            : `<span class="hu-diff-neg">${diff}</span>`;
        return {
          color: p.color,
          name: p.short,
          leader: `${p.leader} (${p.threshold}% thr.)`,
          votes: sim.natPct[p.id],
          smc: sim.smcSeats[p.id] || 0,
          list:
            scen.era === '1990'
              ? `${sim.regSeats[p.id]}+${sim.compSeats[p.id]}`
              : sim.listSeats[p.id] || 0,
          seats: `<b>${tot}</b> <span class="muted small">(${fmt((tot / total) * 100, 1)}%)</span>`,
          actual: `${p.actualSeats}${diffStr}`,
          dim: tot === 0 && p.actualSeats === 0,
        };
      });

      if (sim.minorityCount > 0) {
        tableRows.push({
          color: '#94a3b8',
          name: 'MNOÖ (German Minority)',
          leader: 'Imre Ritter (Preferential quota)',
          votes: undefined,
          smc: 0,
          list: 1,
          seats: `<b>1</b> <span class="muted small">(0.5%)</span>`,
          actual: '1<span class="muted">±0</span>',
          dim: false,
        });
      }

      tblCard.body.appendChild(
        ui.resultsTable(tableRows, {
          nameLabel: 'Party & Leader',
          columns: [
            { key: 'votes', label: 'List %', fmt: (v) => (v === undefined ? '–' : fmt(v, 1) + '%') },
            { key: 'smc', label: 'SMC' },
            { key: 'list', label: scen.era === '1990' ? 'Reg+Comp' : 'List' },
            { key: 'seats', label: 'Sim Seats' },
            { key: 'actual', label: scen.id === '2026_sept' ? 'Apr 26' : 'Actual' },
          ],
        })
      );

      // 6. Update Coalition Builder
      coalCard.body.innerHTML = '';
      const coalParties = sortedParties.map((p) => ({
        id: p.id,
        name: p.name,
        short: `${p.short} – ${p.leader.split('/')[0].trim()}`,
        color: p.color,
        seats: sim.totalSeatsByParty[p.id] || 0,
      }));
      if (sim.minorityCount > 0) {
        coalParties.push({
          id: 'MNOO',
          name: 'MNOÖ',
          short: 'MNOÖ (German Minority)',
          color: '#94a3b8',
          seats: 1,
        });
      }
      const coalWidget = ui.coalition(coalParties, total, majority);
      const firstChip = coalWidget.querySelector('.chip');
      if (firstChip) firstChip.click();
      coalCard.body.appendChild(coalWidget);
    }

    updateAll();
  }

  ES.register({
    id: 'hungary',
    name: 'Hungary',
    flag: '🇭🇺',
    title: 'Hungary – National Assembly (Országgyűlés)',
    subtitle: '1990–2010: 386 seats (176 SMC + 152 Reg + 58 Comp) · 2014–2026 Sept: 199 seats (106 SMC + 93 List)',
    render,
  });
})();
