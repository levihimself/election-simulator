/* =========================================================================
   Election Simulator – core library
   Exposes global `ES` with: register(), methods, hemicycle(), ui, util
   ========================================================================= */
(function () {
  'use strict';

  const ES = (window.ES = window.ES || {});
  ES.countries = [];

  /** Register a country module.
   * module = { id, name, flag (emoji), subtitle, render(container), destroy?() } */
  ES.register = function (module) {
    ES.countries.push(module);
  };

  /* --------------------------------------------------------------------- */
  /* Utilities                                                              */
  /* --------------------------------------------------------------------- */
  const util = (ES.util = {});

  /** Deterministic PRNG (mulberry32). Returns function -> [0,1). */
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
  /** Gaussian-ish noise from rng in [-1,1] (sum of 3 uniforms). */
  util.noise = function (rnd) {
    return (rnd() + rnd() + rnd() - 1.5) / 1.5;
  };
  util.sum = (obj) => Object.values(obj).reduce((a, b) => a + (+b || 0), 0);
  /** Scale values so they add up to `total` (default 100). */
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
  /** Sorted [key, value] pairs, descending. */
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
  /** Pick readable text colour for a background. */
  util.textOn = function (hex) {
    const c = (hex || '#888').replace('#', '');
    const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
    const r = parseInt(f.substr(0, 2), 16), g = parseInt(f.substr(2, 2), 16), b = parseInt(f.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff';
  };
  /** Blend a colour towards white/background by t (0..1) – for margin shading. */
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
  /** D'Hondt. votes: {party: number} */
  methods.dhondt = (votes, seats) => highestAverages(votes, seats, (n) => n + 1);
  /** Sainte-Laguë (Webster). */
  methods.sainteLague = (votes, seats) => highestAverages(votes, seats, (n) => 2 * n + 1);
  /** Largest remainder; quota 'hare' | 'droop'. */
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
    // Droop may over-allocate in rare cases – trim from smallest remainders
    while (used > seats) {
      const k = rem[rem.length - 1][0];
      if (res[k] > 0) { res[k]--; used--; }
      rem.pop();
    }
    return res;
  };
  /** Filter votes by threshold (% of total). thresholdFn(party) may return per-party thresholds. */
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
  /**
   * ES.hemicycle(container, parties, opts)
   * parties: [{ id, name, color, seats, leader? }] in left→right display order
   * opts: { total?, majority?, title?, subtitle?, centerLabel?, onSeatClick?(party) }
   */
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
      // find minimal number of rows
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
      // distribute seats among rows proportional to capacity
      const capSum = caps.reduce((a, b) => a + b, 0);
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
            tip.show(e, `<b style="color:${p.color}">■</b> <b>${p.name}</b>${p.leader ? `<br><small>${p.leader}</small>` : ''}<br>${p.seats} seats (${util.fmt((p.seats / total) * 100)}%)`);
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
      // empty seats (if total > allocated)
      for (; idx < seats.length && idx < total; idx++) {
        const st = seats[idx];
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', cx + Math.cos(st.ang) * st.r * R);
        c.setAttribute('cy', cy - Math.sin(st.ang) * st.r * R);
        c.setAttribute('r', seatR);
        c.setAttribute('fill', '#3a4150');
        svg.appendChild(c);
      }
    }
    // centre labels
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

  /** Card wrapper: returns {card, body} */
  ui.card = function (title, extraClass = '', headerRight = null) {
    const body = el('div', { class: 'card-body' });
    const card = el('section', { class: 'card ' + extraClass }, [
      title ? el('header', { class: 'card-head' }, [el('h3', { text: title }), headerRight]) : null,
      body,
    ]);
    return { card, body };
  };

  /** Segmented control. options: [{value,label}] */
  ui.segmented = function (options, value, onChange) {
    const wrap = el('div', { class: 'segmented' });
    options.forEach((o) => {
      const b = el('button', { class: o.value === value ? 'active' : '', text: o.label, title: o.title || '' });
      b.addEventListener('click', () => {
        wrap.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        onChange(o.value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  };

  /** Select dropdown. options: [{value,label}] */
  ui.select = function (options, value, onChange) {
    const s = el('select', { class: 'es-select' });
    options.forEach((o) => {
      const opt = el('option', { value: o.value, text: o.label });
      if (String(o.value) === String(value)) opt.selected = true;
      s.appendChild(opt);
    });
    s.addEventListener('change', () => onChange(s.value));
    return s;
  };

  /**
   * Percentage sliders.
   * parties: [{id, name, color, leader?}]
   * values: {id: pct} (mutated in place)
   * opts: { onChange(values), max=70, step=0.1, showOthers=true, title }
   * returns { el, setValues(v), refresh() }
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
        range.style.background = `linear-gradient(90deg, ${p.color} ${pct}%, #3a4150 ${pct}%)`;
      };
      range.addEventListener('input', () => set(range.value, range));
      num.addEventListener('change', () => set(num.value, num));
      const row = el('div', { class: 'slider-row' }, [
        el('div', { class: 'slider-label' }, [
          el('span', { class: 'swatch', style: { background: p.color } }),
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

  /** Results table. rows: [{color,name,leader?,votes?(pct),seats,extra?}] ; columns auto */
  ui.resultsTable = function (rows, opts = {}) {
    const cols = opts.columns || [
      { key: 'votes', label: 'Votes', fmt: (v) => (v === undefined ? '–' : util.fmt(v) + '%') },
      { key: 'seats', label: 'Seats' },
    ];
    const t = el('table', { class: 'results' });
    t.appendChild(el('thead', {}, el('tr', {}, [el('th', { text: opts.nameLabel || 'Party' }), ...cols.map((c) => el('th', { text: c.label }))])));
    const tb = el('tbody');
    rows.forEach((r) => {
      tb.appendChild(
        el('tr', { class: r.dim ? 'dim' : '' }, [
          el('td', {}, [
            el('span', { class: 'swatch', style: { background: r.color } }),
            el('span', { class: 'rname', text: r.name }),
            r.leader ? el('span', { class: 'rleader', text: r.leader }) : null,
          ]),
          ...cols.map((c) => el('td', { class: 'num', html: String(c.fmt ? c.fmt(r[c.key], r) : r[c.key] === undefined ? '–' : r[c.key]) })),
        ])
      );
    });
    t.appendChild(tb);
    return t;
  };

  /** Horizontal stacked seat bar with majority line. parties [{name,color,seats}] */
  ui.seatBar = function (parties, total, majority, opts = {}) {
    const wrap = el('div', { class: 'seatbar-wrap' });
    const bar = el('div', { class: 'seatbar' });
    const tip = ui.tooltip();
    parties.filter((p) => p.seats > 0).forEach((p) => {
      const seg = el('div', { class: 'seg', style: { width: (p.seats / total) * 100 + '%', background: p.color, color: util.textOn(p.color) } }, (p.seats / total) > 0.06 ? String(p.seats) : '');
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

  /** Coalition builder: parties [{id,name,color,seats}] */
  ui.coalition = function (parties, total, majority) {
    const wrap = el('div', { class: 'coalition' });
    const chosen = new Set();
    const out = el('div', { class: 'coalition-out' });
    const list = el('div', { class: 'coalition-list' });
    function upd() {
      const s = parties.filter((p) => chosen.has(p.id)).reduce((a, p) => a + p.seats, 0);
      const ok = s >= majority;
      out.innerHTML = `<b>${s}</b> / ${total} seats · ${ok ? '<span class="ok">✔ Majority</span>' : `<span class="no">${majority - s} short</span>`}${s >= Math.ceil((total * 2) / 3) ? ' · <span class="ok">⅔ supermajority</span>' : ''}`;
    }
    parties.filter((p) => p.seats > 0).forEach((p) => {
      const chip = el('button', { class: 'chip', style: { '--c': p.color } }, [el('span', { class: 'swatch', style: { background: p.color } }), `${p.short || p.name} (${p.seats})`]);
      chip.addEventListener('click', () => {
        if (chosen.has(p.id)) chosen.delete(p.id); else chosen.add(p.id);
        chip.classList.toggle('on', chosen.has(p.id));
        upd();
      });
      list.appendChild(chip);
    });
    wrap.appendChild(el('div', { class: 'muted small', text: 'Click parties to build a coalition:' }));
    wrap.appendChild(list);
    wrap.appendChild(out);
    upd();
    return wrap;
  };

  /** Modal dialog. build(body, close) fills content. */
  ui.modal = function (title, build, opts = {}) {
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

  /** Little legend: items [{color,label}] */
  ui.legend = function (items) {
    return el('div', { class: 'legend' }, items.map((i) => el('span', { class: 'legend-item' }, [el('span', { class: 'swatch', style: { background: i.color } }), i.label])));
  };

  /** Notice box */
  ui.note = (html, kind = 'info') => el('div', { class: 'note note-' + kind, html });

  /** Standard two-column layout: returns {root, left, right} */
  ui.layout = function () {
    const left = el('div', { class: 'col col-left' });
    const right = el('div', { class: 'col col-right' });
    const root = el('div', { class: 'layout' }, [left, right]);
    return { root, left, right };
  };

  /* --------------------------------------------------------------------- */
  /* Flags (inline SVG – Windows does not render flag emoji)                */
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
    const app = document.getElementById('app');
    let current = null;
    function open(id) {
      const m = ES.countries.find((c) => c.id === id) || ES.countries[0];
      if (!m) return;
      if (current && current.destroy) current.destroy();
      current = m;
      nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === m.id));
      app.innerHTML = '';
      const head = el('div', { class: 'country-head' }, [
        ES.flag(m.id, 30) || el('span', { class: 'flag', text: m.flag || '' }),
        el('div', {}, [el('h2', { text: m.title || m.name }), m.subtitle ? el('div', { class: 'muted', text: m.subtitle }) : null]),
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
      const b = el('button', { 'data-id': c.id }, [ES.flag(c.id, 14) || el('span', { class: 'flag', text: c.flag || '' }), el('span', { text: c.name })]);
      b.addEventListener('click', () => open(c.id));
      nav.appendChild(b);
    });
    window.addEventListener('hashchange', () => { if (!current || location.hash.slice(1) !== current.id) open(location.hash.slice(1)); });
    open(location.hash.slice(1));
  };
})();
