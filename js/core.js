/* =========================================================================
   Election Simulator – Core Engine & Game UI Library
   Exposes global `ES` with: register(), methods, hemicycle(), leaderImg(), sfx, ui, util
   ========================================================================= */
(function () {
  'use strict';

  const ES = (window.ES = window.ES || {});
  ES.countries = [];

  /** Register a country module. */
  ES.register = function (module) {
    ES.countries.push(module);
  };

  /* --------------------------------------------------------------------- */
  /* Hungarian Political Leader Portraits Lookup                            */
  /* --------------------------------------------------------------------- */
  const LEADER_PORTRAITS = [
    ['magyar péter', 'img/leaders/magyar_peter.jpg'],
    ['péter magyar', 'img/leaders/magyar_peter.jpg'],
    ['orbán', 'img/leaders/orban_viktor.jpg'],
    ['toroczkai', 'img/leaders/toroczkai_laszlo.jpg'],
    ['dobrev', 'img/leaders/dobrev_klara.jpg'],
    ['gyurcsány', 'img/leaders/gyurcsany_ferenc.jpg'],
    ['gergely kovács', 'img/leaders/kovacs_gergely.jpg'],
    ['kovács gergely', 'img/leaders/kovacs_gergely.jpg'],
    ['márki-zay', 'img/leaders/marki_zay_peter.jpg'],
    ['karácsony', 'img/leaders/karacsony_gergely.jpg'],
    ['vitézy', 'img/leaders/vitezy_david.jpg'],
    ['szentkirályi', 'img/leaders/szentkiralyi_alexandra.jpg'],
    ['baranyi', 'img/leaders/baranyi_krisztina.jpg'],
    ['vona', 'img/leaders/vona_gabor.jpg'],
    ['szél', 'img/leaders/szel_bernadett.jpg'],
    ['fekete-győr', 'img/leaders/fekete_gyor_andras.jpg'],
    ['schiffer', 'img/leaders/schiffer_andras.jpg'],
    ['mesterházy', 'img/leaders/mesterhazy_attila.jpg'],
    ['ibolya dávid', 'img/leaders/david_ibolya.jpg'],
    ['kuncze', 'img/leaders/kuncze_gabor.jpg'],
    ['medgyessy', 'img/leaders/medgyessy_peter.jpg'],
    ['nyers', 'img/leaders/nyers_rezso.jpg'],
    ['horn', 'img/leaders/horn_gyula.jpg'],
    ['torgyán', 'img/leaders/torgyan_jozsef.jpg'],
    ['csurka', 'img/leaders/csurka_istvan.jpg'],
    ['bálint magyar', 'img/leaders/magyar_balint.jpg'],
    ['pető', 'img/leaders/peto_ivan.jpg'],
    ['jános kis', 'img/leaders/kis_janos.jpg'],
    ['antall', 'img/leaders/antall_jozsef.jpg'],
    ['boross', 'img/leaders/boross_peter.jpg'],
    ['lezsák', 'img/leaders/lezsak_sandor.jpg'],
    ['surján', 'img/leaders/surjan_laszlo.jpg'],
    ['keresztes', 'img/leaders/keresztes_sandor.jpg'],
    ['ferenc józsef nagy', 'img/leaders/nagy_ferenc_jozsef.jpg'],
    ['thürmer', 'img/leaders/thuermer_gyula.jpg'],
  ];

  ES.leaderImg = function (str) {
    if (!str) return null;
    const low = String(str).toLowerCase();
    for (let i = 0; i < LEADER_PORTRAITS.length; i++) {
      if (low.includes(LEADER_PORTRAITS[i][0])) return LEADER_PORTRAITS[i][1];
    }
    return null;
  };

  /* --------------------------------------------------------------------- */
  /* Game Sound Effects (Web Audio API Synthesizer)                         */
  /* --------------------------------------------------------------------- */
  let audioCtx = null;
  const sfx = (ES.sfx = {
    enabled: true,
    _ctx() {
      if (!this.enabled) return null;
      if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return audioCtx;
    },
    click(freq = 520) {
      const ctx = this._ctx();
      if (!ctx) return;
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.045);
        g.gain.setValueAtTime(0.045, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.055);
      } catch (e) {}
    },
    fanfare() {
      const ctx = this._ctx();
      if (!ctx) return;
      [440, 554.37, 659.25].forEach((f, idx) => {
        try {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          const t0 = ctx.currentTime + idx * 0.055;
          o.frequency.setValueAtTime(f, t0);
          g.gain.setValueAtTime(0.05, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(t0);
          o.stop(t0 + 0.25);
        } catch (e) {}
      });
    },
  });

  /* --------------------------------------------------------------------- */
  /* Utilities                                                              */
  /* --------------------------------------------------------------------- */
  const util = (ES.util = {});

  util.rng = function (seed) {
    let a = typeof seed === 'string' ? util.hash(seed) : seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  util.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  util.noise = function (rnd) {
    return (rnd() + rnd() + rnd() - 1.5) / 1.5;
  };
  util.sum = (obj) => Object.values(obj).reduce((a, b) => a + (+b || 0), 0);
  util.normalize = function (obj, total = 100) {
    const s = util.sum(obj);
    const out = {};
    for (const k in obj) out[k] = s > 0 ? ((+obj[k] || 0) / s) * total : 0;
    return out;
  };
  util.clone = (o) => JSON.parse(JSON.stringify(o));
  util.fmt = (n, d = 1) => (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
  util.fmtInt = (n) => Math.round(n).toLocaleString('en-US');
  util.argmax = function (obj) {
    let best = null, bv = -Infinity;
    for (const k in obj) if (obj[k] > bv) { bv = obj[k]; best = k; }
    return best;
  };
  util.ranked = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  util.el = function (tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return e;
  };
  util.textOn = function (hex) {
    const c = (hex || '#888').replace('#', '');
    const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
    const r = parseInt(f.substr(0, 2), 16), g = parseInt(f.substr(2, 2), 16), b = parseInt(f.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff';
  };
  util.shade = function (hex, t) {
    const c = (hex || '#888888').replace('#', '');
    const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
    const base = [0x2a, 0x30, 0x3c];
    const rgb = [0, 2, 4].map((i, j) => Math.round(parseInt(f.substr(i, 2), 16) * t + base[j] * (1 - t)));
    return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  };

  /* --------------------------------------------------------------------- */
  /* Seat allocation methods                                                */
  /* --------------------------------------------------------------------- */
  const methods = (ES.methods = {});

  function highestAverages(votes, seats, divisor, firstDivisor) {
    const res = {};
    const keys = Object.keys(votes).filter((k) => votes[k] > 0);
    keys.forEach((k) => (res[k] = 0));
    for (let s = 0; s < seats; s++) {
      let best = null, bestQ = -1;
      for (const k of keys) {
        const d = res[k] === 0 && firstDivisor ? firstDivisor : divisor(res[k]);
        const q = votes[k] / d;
        if (q > bestQ) { bestQ = q; best = k; }
      }
      if (best === null) break;
      res[best]++;
    }
    return res;
  }
  methods.dhondt = (votes, seats) => highestAverages(votes, seats, (n) => n + 1);
  methods.sainteLague = (votes, seats) => highestAverages(votes, seats, (n) => 2 * n + 1);
  methods.largestRemainder = function (votes, seats, quota = 'hare') {
    const total = util.sum(votes);
    const res = {};
    if (total <= 0 || seats <= 0) return res;
    const q = quota === 'droop' ? Math.floor(total / (seats + 1)) + 1 : total / seats;
    const rem = [];
    let used = 0;
    for (const k in votes) {
      const exact = votes[k] / q;
      res[k] = Math.floor(exact);
      used += res[k];
      rem.push([k, exact - res[k]]);
    }
    rem.sort((a, b) => b[1] - a[1]);
    for (let i = 0; used < seats && i < rem.length; i++, used++) res[rem[i][0]]++;
    while (used > seats) {
      const k = rem[rem.length - 1][0];
      if (res[k] > 0) { res[k]--; used--; }
      rem.pop();
    }
    return res;
  };
  methods.applyThreshold = function (votes, threshold) {
    const total = util.sum(votes);
    const out = {};
    for (const k in votes) {
      const t = typeof threshold === 'function' ? threshold(k) : threshold;
      if (total > 0 && (votes[k] / total) * 100 >= t) out[k] = votes[k];
    }
    return out;
  };

  /* --------------------------------------------------------------------- */
  /* Hemicycle (parliament) diagram                                         */
  /* --------------------------------------------------------------------- */
  ES.hemicycle = function (container, parties, opts = {}) {
    container.innerHTML = '';
    const active = parties.filter((p) => p.seats > 0);
    const total = opts.total || active.reduce((a, p) => a + p.seats, 0);
    const majority = opts.majority || Math.floor(total / 2) + 1;
    const W = 400, H = 215, cx = 200, cy = 200, R = 190;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'hemicycle');

    if (total > 0) {
      const r0 = total < 40 ? 0.3 : total < 120 ? 0.36 : 0.4;
      let rows = 1, caps = [];
      for (; rows < 60; rows++) {
        const d = (1 - r0) / rows;
        caps = [];
        for (let i = 0; i < rows; i++) {
          const ri = r0 + d * (i + 0.5);
          caps.push(Math.max(1, Math.floor((Math.PI * ri) / d) + 1));
        }
        if (caps.reduce((a, b) => a + b, 0) >= total) break;
      }
      const d = (1 - r0) / rows;
      const capObj = {};
      caps.forEach((c, i) => (capObj[i] = c));
      const perRow = methods.largestRemainder(capObj, total, 'hare');
      const seats = [];
      for (let i = 0; i < rows; i++) {
        const n = perRow[i] || 0;
        const ri = r0 + d * (i + 0.5);
        for (let j = 0; j < n; j++) {
          const ang = n === 1 ? Math.PI / 2 : Math.PI - (Math.PI * j) / (n - 1);
          seats.push({ ang, r: ri });
        }
      }
      seats.sort((a, b) => b.ang - a.ang || a.r - b.r);
      const seatR = Math.min(d * 0.42, 0.08) * R;
      let idx = 0;
      const tip = ES.ui.tooltip();
      active.forEach((p) => {
        const pic = p.img || ES.leaderImg(p.leader || p.name);
        for (let s = 0; s < p.seats && idx < seats.length; s++, idx++) {
          const st = seats[idx];
          const c = document.createElementNS(svgNS, 'circle');
          c.setAttribute('cx', (cx + Math.cos(st.ang) * st.r * R).toFixed(2));
          c.setAttribute('cy', (cy - Math.sin(st.ang) * st.r * R).toFixed(2));
          c.setAttribute('r', seatR.toFixed(2));
          c.setAttribute('fill', p.color);
          c.setAttribute('data-party', p.id);
          c.addEventListener('mouseenter', (e) => {
            svg.querySelectorAll(`circle[data-party="${CSS.escape(p.id)}"]`).forEach((x) => x.classList.add('hl'));
            const imgHtml = pic ? `<img src="${pic}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid ${p.color};float:left;margin-right:8px;" />` : '';
            tip.show(
              e,
              `<div style="overflow:hidden">${imgHtml}<b style="color:${p.color}">■</b> <b>${p.name}</b>${p.leader ? `<br><small>${p.leader}</small>` : ''}<br><b>${p.seats}</b> seats (${util.fmt((p.seats / total) * 100)}%)</div>`
            );
          });
          c.addEventListener('mousemove', (e) => tip.move(e));
          c.addEventListener('mouseleave', () => {
            svg.querySelectorAll('circle.hl').forEach((x) => x.classList.remove('hl'));
            tip.hide();
          });
          if (opts.onSeatClick) c.addEventListener('click', () => opts.onSeatClick(p));
          svg.appendChild(c);
        }
      });
      for (; idx < seats.length && idx < total; idx++) {
        const st = seats[idx];
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', cx + Math.cos(st.ang) * st.r * R);
        c.setAttribute('cy', cy - Math.sin(st.ang) * st.r * R);
        c.setAttribute('r', seatR);
        c.setAttribute('fill', '#283246');
        svg.appendChild(c);
      }
    }
    const t1 = document.createElementNS(svgNS, 'text');
    t1.setAttribute('x', cx); t1.setAttribute('y', cy - 22);
    t1.setAttribute('class', 'hc-total');
    t1.textContent = opts.centerLabel || total;
    svg.appendChild(t1);
    const t2 = document.createElementNS(svgNS, 'text');
    t2.setAttribute('x', cx); t2.setAttribute('y', cy - 4);
    t2.setAttribute('class', 'hc-sub');
    t2.textContent = opts.subtitle || `Majority: ${majority}`;
    svg.appendChild(t2);
    container.appendChild(svg);
    return svg;
  };

  /* --------------------------------------------------------------------- */
  /* UI helpers                                                             */
  /* --------------------------------------------------------------------- */
  const ui = (ES.ui = {});
  const el = util.el;

  let tipEl = null;
  ui.tooltip = function () {
    if (!tipEl) {
      tipEl = el('div', { class: 'es-tooltip' });
      document.body.appendChild(tipEl);
    }
    return {
      show(e, html) { tipEl.innerHTML = html; tipEl.style.display = 'block'; this.move(e); },
      move(e) {
        const pad = 14;
        let x = e.clientX + pad, y = e.clientY + pad;
        const r = tipEl.getBoundingClientRect();
        if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
        if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
        tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
      },
      hide() { tipEl.style.display = 'none'; },
    };
  };

  ui.card = function (title, extraClass = '', headerRight = null) {
    const body = el('div', { class: 'card-body' });
    const card = el('section', { class: 'card ' + extraClass }, [
      title ? el('header', { class: 'card-head' }, [el('h3', { text: title }), headerRight]) : null,
      body,
    ]);
    return { card, body };
  };

  ui.segmented = function (options, value, onChange) {
    const wrap = el('div', { class: 'segmented' });
    options.forEach((o) => {
      const b = el('button', { class: o.value === value ? 'active' : '', text: o.label, title: o.title || '' });
      b.addEventListener('click', () => {
        sfx.click(580);
        wrap.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        onChange(o.value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  };

  ui.select = function (options, value, onChange) {
    const s = el('select', { class: 'es-select' });
    options.forEach((o) => {
      const opt = el('option', { value: o.value, text: o.label });
      if (String(o.value) === String(value)) opt.selected = true;
      s.appendChild(opt);
    });
    s.addEventListener('change', () => { sfx.click(500); onChange(s.value); });
    return s;
  };

  /**
   * Percentage sliders – automatically displays leader portrait if p.img or ES.leaderImg(p.leader) matches!
   */
  ui.sliders = function (parties, values, opts = {}) {
    const max = opts.max || 70;
    const step = opts.step || 0.1;
    const root = el('div', { class: 'sliders' });
    const rows = {};
    const totalEl = el('div', { class: 'slider-total' });

    function updateTotal() {
      const s = util.sum(values);
      const others = 100 - s;
      totalEl.innerHTML = '';
      if (opts.showOthers !== false) {
        totalEl.appendChild(el('span', { class: others < -0.05 ? 'warn' : '', html: `Total <b>${util.fmt(s)}%</b> · ${others >= 0 ? `Others/unallocated <b>${util.fmt(others)}%</b>` : `<b>${util.fmt(-others)}%</b> over 100 – values will be scaled`}` }));
      } else {
        totalEl.appendChild(el('span', { class: Math.abs(others) > 0.05 ? 'warn' : '', html: `Total <b>${util.fmt(s)}%</b>${Math.abs(others) > 0.05 ? ' – will be scaled to 100%' : ''}` }));
      }
      const nb = el('button', { class: 'btn btn-xs', text: 'Normalize to 100%' });
      nb.addEventListener('click', () => {
        sfx.click(640);
        const n = util.normalize(values, 100);
        for (const k in n) values[k] = Math.round(n[k] * 10) / 10;
        refresh();
        opts.onChange && opts.onChange(values);
      });
      totalEl.appendChild(nb);
    }

    parties.forEach((p) => {
      const range = el('input', { type: 'range', min: 0, max, step, value: values[p.id] || 0 });
      range.style.setProperty('--c', p.color);
      const num = el('input', { type: 'number', min: 0, max: 100, step, value: util.fmt(values[p.id] || 0) });
      const set = (v, src) => {
        v = Math.max(0, Math.min(100, +v || 0));
        values[p.id] = v;
        if (src !== range) range.value = v;
        if (src !== num) num.value = util.fmt(v);
        fill();
        updateTotal();
        opts.onChange && opts.onChange(values);
      };
      const fill = () => {
        const pct = (Math.min(values[p.id] || 0, max) / max) * 100;
        range.style.background = `linear-gradient(90deg, ${p.color} ${pct}%, #252f42 ${pct}%)`;
      };
      range.addEventListener('input', () => set(range.value, range));
      num.addEventListener('change', () => set(num.value, num));

      const pic = p.img || ES.leaderImg(p.leader) || ES.leaderImg(p.name);
      const row = el('div', { class: 'slider-row' }, [
        el('div', { class: 'slider-label' }, [
          pic
            ? el('img', { class: 'leader-avatar', src: pic, alt: p.leader || p.name, style: { '--c': p.color } })
            : el('span', { class: 'swatch', style: { background: p.color } }),
          el('div', { class: 'slider-names' }, [
            el('span', { class: 'pname', text: p.name }),
            p.leader ? el('span', { class: 'pleader', text: p.leader }) : null,
          ]),
        ]),
        range,
        el('div', { class: 'num-wrap' }, [num, el('span', { text: '%' })]),
      ]);
      rows[p.id] = { range, num, fill };
      fill();
      root.appendChild(row);
    });
    root.appendChild(totalEl);
    updateTotal();

    function refresh() {
      parties.forEach((p) => {
        const r = rows[p.id];
        if (!r) return;
        r.range.value = values[p.id] || 0;
        r.num.value = util.fmt(values[p.id] || 0);
        r.fill();
      });
      updateTotal();
    }
    return {
      el: root,
      refresh,
      setValues(v) { for (const k in values) delete values[k]; Object.assign(values, v); refresh(); },
    };
  };

  /** Results table – automatically displays leader portrait if present */
  ui.resultsTable = function (rows, opts = {}) {
    const cols = opts.columns || [
      { key: 'votes', label: 'Votes', fmt: (v) => (v === undefined ? '–' : util.fmt(v) + '%') },
      { key: 'seats', label: 'Seats' },
    ];
    const t = el('table', { class: 'results' });
    t.appendChild(el('thead', {}, el('tr', {}, [el('th', { text: opts.nameLabel || 'Party' }), ...cols.map((c) => el('th', { text: c.label }))])));
    const tb = el('tbody');
    rows.forEach((r) => {
      const pic = r.img || ES.leaderImg(r.leader) || ES.leaderImg(r.name);
      tb.appendChild(
        el('tr', { class: r.dim ? 'dim' : '' }, [
          el('td', {}, [
            pic ? el('img', { class: 'leader-avatar-sm', src: pic, alt: r.leader || r.name, style: { '--c': r.color } }) : null,
            el('span', { class: 'swatch', style: { background: r.color } }),
            el('span', { class: 'rname', text: r.name }),
            r.leader ? el('span', { class: 'rleader' + (pic ? ' with-pic' : ''), text: r.leader }) : null,
          ]),
          ...cols.map((c) => el('td', { class: 'num', html: String(c.fmt ? c.fmt(r[c.key], r) : r[c.key] === undefined ? '–' : r[c.key]) })),
        ])
      );
    });
    t.appendChild(tb);
    return t;
  };

  /** Horizontal stacked seat bar with majority line. */
  ui.seatBar = function (parties, total, majority, opts = {}) {
    const wrap = el('div', { class: 'seatbar-wrap' });
    const bar = el('div', { class: 'seatbar' });
    const tip = ui.tooltip();
    parties.filter((p) => p.seats > 0).forEach((p) => {
      const seg = el('div', { class: 'seg', style: { width: (p.seats / total) * 100 + '%', background: p.color, color: util.textOn(p.color) } }, (p.seats / total) > 0.055 ? String(p.seats) : '');
      seg.addEventListener('mouseenter', (e) => tip.show(e, `<b>${p.name}</b><br>${p.seats}${opts.unit ? ' ' + opts.unit : ''}`));
      seg.addEventListener('mousemove', (e) => tip.move(e));
      seg.addEventListener('mouseleave', () => tip.hide());
      bar.appendChild(seg);
    });
    bar.appendChild(el('div', { class: 'majline', style: { left: (majority / total) * 100 + '%' } }));
    wrap.appendChild(bar);
    if (opts.label !== false) wrap.appendChild(el('div', { class: 'seatbar-label', text: opts.label || `${majority} needed for a majority` }));
    return wrap;
  };

  /**
   * Game-Style Coalition Studio & Government Builder
   * Works across all parliamentary systems and highlights selected coalition inside the hemicycle!
   */
  const coalitionMemory = {}; // remembers selected party IDs per total-seat count so slider moves keep coalition intact
  ui.coalition = function (parties, total, majority, opts = {}) {
    const wrap = el('div', { class: 'coalition', id: 'es-coalition-studio' });
    const active = parties.filter((p) => p.seats > 0);
    const sorted = active.slice().sort((a, b) => b.seats - a.seats);
    const memKey = opts.key || String(total);
    if (!coalitionMemory[memKey]) {
      coalitionMemory[memKey] = new Set(sorted.length ? [sorted[0].id] : []);
    }
    const chosen = coalitionMemory[memKey];
    // remove parties that now have 0 seats
    Array.from(chosen).forEach((id) => {
      if (!active.some((p) => p.id === id)) chosen.delete(id);
    });

    const head = el('div', { class: 'coal-head' });
    head.appendChild(el('div', { class: 'coal-title', html: '🤝 Coalition Maker &amp; Government Formation' }));

    const presets = el('div', { class: 'coal-presets' });
    function applySet(ids, playSound = true) {
      chosen.clear();
      ids.forEach((id) => chosen.add(id));
      syncCards();
      upd(playSound);
    }

    if (sorted.length > 0) {
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: '1st Party Solo',
          onclick: () => applySet([sorted[0].id]),
        })
      );
    }
    if (sorted.length >= 2) {
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: 'Grand Coalition (Top 2)',
          onclick: () => applySet([sorted[0].id, sorted[1].id]),
        })
      );
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: 'Min. Winning Coalition',
          onclick: () => {
            const pick = [];
            let sumS = 0;
            for (const p of sorted) {
              if (sumS < majority) {
                pick.push(p.id);
                sumS += p.seats;
              }
            }
            applySet(pick);
          },
        })
      );
      presets.appendChild(
        el('button', {
          class: 'btn btn-xs',
          text: 'Anti-1st Opposition Bloc',
          onclick: () => applySet(sorted.slice(1).map((p) => p.id)),
        })
      );
    }
    presets.appendChild(
      el('button', {
        class: 'btn btn-xs',
        text: 'Clear',
        onclick: () => applySet([], false),
      })
    );
    head.appendChild(presets);
    wrap.appendChild(head);

    const list = el('div', { class: 'coalition-list' });
    const cardEls = {};

    active.forEach((p) => {
      const pic = p.img || ES.leaderImg(p.leader) || ES.leaderImg(p.name);
      const card = el(
        'button',
        { class: 'coal-card' + (chosen.has(p.id) ? ' on' : ''), style: { '--c': p.color } },
        [
          pic
            ? el('img', { class: 'leader-avatar-sm', src: pic, alt: p.leader || p.name, style: { '--c': p.color } })
            : el('span', { class: 'swatch', style: { background: p.color } }),
          el('div', { class: 'coal-card-info' }, [
            el('span', { class: 'coal-card-name', text: p.short || p.name }),
            el('span', { class: 'coal-card-sub', text: p.leader || `${util.fmt((p.seats / total) * 100, 1)}% of seats` }),
          ]),
          el('span', { class: 'coal-card-seats', style: { color: p.color }, text: p.seats }),
        ]
      );
      card.addEventListener('click', () => {
        if (chosen.has(p.id)) chosen.delete(p.id);
        else chosen.add(p.id);
        card.classList.toggle('on', chosen.has(p.id));
        upd(true);
      });
      cardEls[p.id] = card;
      list.appendChild(card);
    });
    wrap.appendChild(list);

    function syncCards() {
      for (const id in cardEls) {
        cardEls[id].classList.toggle('on', chosen.has(id));
      }
    }

    // Meter bar + Status bar
    const meter = el('div', { class: 'coal-meter' });
    const status = el('div', { class: 'coal-status-bar' });
    wrap.appendChild(meter);
    wrap.appendChild(status);

    function upd(withSound) {
      const selParties = active.filter((p) => chosen.has(p.id));
      const s = selParties.reduce((a, p) => a + p.seats, 0);
      const superMaj = Math.ceil((total * 2) / 3);
      const ok = s >= majority;
      const isSuper = s >= superMaj;

      if (withSound) {
        if (ok) sfx.fanfare();
        else sfx.click(480);
      }

      // Update stacked meter bar
      meter.innerHTML = '';
      selParties.forEach((p) => {
        meter.appendChild(
          el('div', {
            class: 'coal-meter-seg',
            style: { width: (p.seats / total) * 100 + '%', background: p.color },
            title: `${p.short || p.name}: ${p.seats}`,
          })
        );
      });
      // 50% majority line & 2/3 line
      meter.appendChild(el('div', { class: 'majline', style: { left: (majority / total) * 100 + '%' }, title: `Majority: ${majority}` }));
      if (superMaj < total) {
        meter.appendChild(
          el('div', {
            class: 'majline',
            style: { left: (superMaj / total) * 100 + '%', background: '#f5b82e', width: '2px' },
            title: `⅔ Supermajority: ${superMaj}`,
          })
        );
      }

      // Lead party / PM
      const leadParty = selParties.slice().sort((a, b) => b.seats - a.seats)[0];
      const leadText = leadParty
        ? `Lead Partner: <b style="color:${leadParty.color}">${leadParty.short || leadParty.name}</b>${leadParty.leader ? ` (${leadParty.leader})` : ''}`
        : 'Click party cards above to assemble a governing coalition';

      status.innerHTML = `
        <div>
          <span style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700">${s} / ${total}</span>
          <span class="muted small">seats (${util.fmt((s / Math.max(1, total)) * 100, 1)}%)</span>
          · ${
            isSuper
              ? '<span class="badge" style="background:var(--gold);color:#111">★ ⅔ SUPERMAJORITY GOVERNMENT</span>'
              : ok
              ? '<span class="badge">✔ MAJORITY COALITION FORMED</span>'
              : s === 0
              ? '<span class="muted small">No parties selected</span>'
              : `<span class="no">Minority (${majority - s} seats short of ${majority})</span>`
          }
        </div>
        <div class="small muted">${leadText}</div>
      `;

      // Highlight selected coalition in any hemicycle on the page
      document.querySelectorAll('svg.hemicycle').forEach((svg) => {
        if (s > 0 && selParties.length < active.length) {
          svg.classList.add('has-coalition');
          svg.querySelectorAll('circle[data-party]').forEach((c) => {
            c.classList.toggle('coal-on', chosen.has(c.getAttribute('data-party')));
          });
        } else {
          svg.classList.remove('has-coalition');
          svg.querySelectorAll('circle.coal-on').forEach((c) => c.classList.remove('coal-on'));
        }
      });
    }

    setTimeout(() => upd(false), 0);
    return wrap;
  };

  /** Modal dialog. */
  ui.modal = function (title, build, opts = {}) {
    sfx.click(620);
    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const body = el('div', { class: 'modal-body' });
    const box = el('div', { class: 'modal ' + (opts.wide ? 'wide' : '') }, [
      el('header', { class: 'modal-head' }, [el('h3', { html: title }), el('button', { class: 'btn btn-icon', text: '✕', onclick: close })]),
      body,
    ]);
    const overlay = el('div', { class: 'modal-overlay' }, box);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    build(body, close);
    return { close };
  };

  ui.legend = function (items) {
    return el('div', { class: 'legend' }, items.map((i) => el('span', { class: 'legend-item' }, [el('span', { class: 'swatch', style: { background: i.color } }), i.label])));
  };

  ui.note = (html, kind = 'info') => el('div', { class: 'note note-' + kind, html });

  ui.layout = function () {
    const left = el('div', { class: 'col col-left' });
    const right = el('div', { class: 'col col-right' });
    const root = el('div', { class: 'layout' }, [left, right]);
    return { root, left, right };
  };

  /* --------------------------------------------------------------------- */
  /* Flags (inline SVG)                                                     */
  /* --------------------------------------------------------------------- */
  const FLAGS = {
    hungary: '<rect width="30" height="7" fill="#CE2939"/><rect y="7" width="30" height="6" fill="#fff"/><rect y="13" width="30" height="7" fill="#477050"/>',
    budapest: '<rect width="30" height="7" fill="#d4213d"/><rect y="7" width="30" height="6" fill="#f2c200"/><rect y="13" width="30" height="7" fill="#1d4f9c"/>',
    germany: '<rect width="30" height="7" fill="#000"/><rect y="7" width="30" height="6" fill="#DD0000"/><rect y="13" width="30" height="7" fill="#FFCE00"/>',
    france: '<rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ED2939"/>',
    eu: '<rect width="30" height="20" fill="#003399"/>' + Array.from({ length: 12 }, (_, i) => `<circle cx="${(15 + 6 * Math.cos((i * Math.PI) / 6)).toFixed(2)}" cy="${(10 + 6 * Math.sin((i * Math.PI) / 6)).toFixed(2)}" r="0.9" fill="#FFCC00"/>`).join(''),
    uk: '<rect width="30" height="20" fill="#012169"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="4"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" stroke-width="1.5"/><path d="M15,0 V20 M0,10 H30" stroke="#fff" stroke-width="6"/><path d="M15,0 V20 M0,10 H30" stroke="#C8102E" stroke-width="3.5"/>',
    usa: Array.from({ length: 7 }, (_, i) => `<rect y="${(i * 20) / 6.5}" width="30" height="${20 / 13}" fill="#B22234"/>`).join('') + '<rect width="13" height="10.8" fill="#3C3B6E"/>',
  };
  ES.flag = function (id, h = 18) {
    const s = FLAGS[id];
    if (!s) return null;
    const span = el('span', { class: 'flag-svg' });
    span.innerHTML = `<svg viewBox="0 0 30 20" height="${h}" width="${(h * 1.5).toFixed(0)}">${s}</svg>`;
    return span;
  };

  /* --------------------------------------------------------------------- */
  /* App shell                                                              */
  /* --------------------------------------------------------------------- */
  ES.start = function () {
    const nav = document.getElementById('country-nav');
    const hud = document.getElementById('hud-tools');
    const app = document.getElementById('app');
    let current = null;

    if (hud) {
      const coalBtn = el('button', {
        class: 'btn btn-gold btn-xs',
        text: '🤝 Coalition Studio',
        title: 'Jump to the interactive Coalition Maker',
        onclick: () => {
          const studio = document.querySelector('.coalition');
          if (studio) {
            sfx.click(660);
            studio.scrollIntoView({ behavior: 'smooth', block: 'center' });
            studio.style.boxShadow = '0 0 0 3px var(--gold), 0 0 28px rgba(245,184,46,0.6)';
            setTimeout(() => (studio.style.boxShadow = ''), 1600);
          }
        },
      });
      const sfxBtn = el('button', {
        class: 'btn btn-xs active',
        text: '🔊 SFX On',
        onclick: () => {
          sfx.enabled = !sfx.enabled;
          sfxBtn.textContent = sfx.enabled ? '🔊 SFX On' : '🔇 SFX Off';
          sfxBtn.classList.toggle('active', sfx.enabled);
          if (sfx.enabled) sfx.click(600);
        },
      });
      hud.appendChild(coalBtn);
      hud.appendChild(sfxBtn);
    }

    function open(id) {
      const m = ES.countries.find((c) => c.id === id) || ES.countries[0];
      if (!m) return;
      if (current && current.destroy) current.destroy();
      current = m;
      nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === m.id));
      app.innerHTML = '';
      const head = el('div', { class: 'country-head' }, [
        el('div', { class: 'country-head-left' }, [
          ES.flag(m.id, 32) || el('span', { class: 'flag', text: m.flag || '' }),
          el('div', {}, [el('h2', { text: m.title || m.name }), m.subtitle ? el('div', { class: 'muted', text: m.subtitle }) : null]),
        ]),
        m.id !== 'usa'
          ? el('button', {
              class: 'btn btn-gold',
              text: '🤝 Build Governing Coalition',
              onclick: () => {
                const studio = document.querySelector('.coalition');
                if (studio) {
                  sfx.click(660);
                  studio.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  studio.style.boxShadow = '0 0 0 3px var(--gold), 0 0 28px rgba(245,184,46,0.6)';
                  setTimeout(() => (studio.style.boxShadow = ''), 1600);
                }
              },
            })
          : null,
      ]);
      app.appendChild(head);
      const body = el('div', { class: 'country-body' });
      app.appendChild(body);
      try {
        m.render(body);
      } catch (err) {
        console.error(err);
        body.appendChild(ui.note('Error rendering this simulator: ' + err.message, 'warn'));
      }
      if (location.hash.slice(1) !== m.id) history.replaceState(null, '', '#' + m.id);
    }
    ES.countries.forEach((c) => {
      const b = el('button', { 'data-id': c.id }, [ES.flag(c.id, 15) || el('span', { class: 'flag', text: c.flag || '' }), el('span', { text: c.name })]);
      b.addEventListener('click', () => { sfx.click(540); open(c.id); });
      nav.appendChild(b);
    });
    window.addEventListener('hashchange', () => { if (!current || location.hash.slice(1) !== current.id) open(location.hash.slice(1)); });
    open(location.hash.slice(1));
  };
})();
