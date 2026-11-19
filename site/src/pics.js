/* Pictures for the hero and the examples. Colour encodes layers:
   green = segments (data), blue = knowledge, red = generation activities. */
const PIC = (() => {
  const C = { ink: '#14233D', ink2: '#48566B', ink3: '#6A7688', rule: '#D6DCE4', grid: '#EDF0F4', gen: '#B5412D', genT: '#F8EAE6', cls: '#1F5BAF', clsT: '#E6EEFA', dat: '#2B7855', datT: '#E3F1E8' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function trace(x0, x1, step, f, seed, noise) {
    const r = rng(seed); const pts = [];
    for (let x = x0; x <= x1 + 0.01; x += step) pts.push([x, f(x) + (r() - 0.5) * noise]);
    return pts;
  }
  const d = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
  const tw = (t, fs) => t.length * fs * 0.56;
  const hann = (x, a, b) => (x < a || x > b) ? 0 : 0.5 - 0.5 * Math.cos(2 * Math.PI * (x - a) / (b - a));

  function defs(id) {
    return `<defs>
      <marker id="${id}-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.ink3}"/></marker>
      <marker id="${id}-ag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.gen}"/></marker>
      <marker id="${id}-ab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.cls}"/></marker>
      <pattern id="${id}-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="${C.datT}"/><line x1="0" y1="0" x2="0" y2="7" stroke="${C.dat}" stroke-opacity=".35" stroke-width="2"/></pattern>
    </defs>`;
  }
  function wrap(id, w, h, inner, label) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" font-family="Instrument Sans, system-ui, sans-serif">${defs(id)}${inner}</svg>`;
  }
  function band(x0, x1, y0, y1, label, opts = {}) {
    let s = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="4" fill="${opts.fill || C.datT}" fill-opacity="${opts.op ?? 0.75}"${opts.dashed ? ` stroke="${C.dat}" stroke-dasharray="4 3"` : ''}/>`;
    s += `<path d="M${x0} ${y0 + 7}V${y0}H${x1}V${y0 + 7}" fill="none" stroke="${C.dat}" stroke-width="1.6"/>`;
    if (label) s += `<text x="${x0 + 5}" y="${y0 - 6}" font-size="12" font-weight="600" fill="${C.dat}">${esc(label)}</text>`;
    return s;
  }
  // kinds: data, scen, gen, qual, ctx, seg
  function chip(cx, y, text, kind, o = {}) {
    const fs = o.fs || 12.5, h = o.h || 28;
    const w = o.w || Math.round(tw(text, fs) + (kind === 'scen' ? 30 : 22));
    const x = o.left != null ? o.left : cx - w / 2;
    const st = {
      data: [C.clsT, C.cls, C.cls, ''], scen: ['#FFFFFF', C.cls, C.ink, ''], gen: [C.genT, C.gen, C.gen, ''],
      qual: ['#FFFFFF', C.ink3, C.ink, ''], ctx: ['#FFFFFF', C.cls, C.ink, '2 3'], seg: [C.datT, C.dat, C.dat, ''],
    }[kind];
    const rx = kind === 'qual' ? h / 2 : 6;
    let s = `<rect class="chip-box" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${st[0]}" stroke="${st[1]}" stroke-width="1.3"${st[3] ? ` stroke-dasharray="${st[3]}"` : ''}/>`;
    if (kind === 'scen') s += `<rect x="${x + 5}" y="${y + 5}" width="3" height="${h - 10}" rx="1.5" fill="${C.cls}"/>`;
    s += `<text x="${x + (kind === 'scen' ? 15 + (w - 15) / 2 - 4 : w / 2)}" y="${y + h / 2 + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-weight="${kind === 'qual' ? 500 : 600}" fill="${st[2]}">${esc(text)}</text>`;
    if (o.kicker) s += `<text x="${x + 2}" y="${y - 6}" font-size="10.5" fill="${C.ink3}">${esc(o.kicker)}</text>`;
    return { s, x, w, h, cx: x + w / 2, r: x + w, b: y + h, y };
  }
  const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 11}" fill="${o.fill || C.ink3}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''}${o.mono ? ' font-family="JetBrains Mono, ui-monospace, monospace"' : ''}${o.italic ? ' font-style="italic"' : ''}>${esc(t)}</text>`;
  const ln = (pts, o = {}) => `<path d="${d(pts)}" fill="none" stroke="${o.stroke || C.ink3}" stroke-width="${o.w || 1.3}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''}${o.cls ? ` class="${o.cls}"` : ''}/>`;
  const axis = (x0, x1, y, ticks) => `<path d="M${x0} ${y}H${x1}" stroke="${C.rule}"/>` + ticks.map(([x, l]) => `<path d="M${x} ${y}v5" stroke="${C.rule}"/>${txt(x, y + 18, l, { anchor: 'middle', fs: 10.5 })}`).join('');

  // ------------------------------------------------------------------ hero
  function hero() {
    const id = 'hero', W = 1200, H = 384;
    const f1 = x => {
      let tr = 0;
      if (x >= 150 && x < 330) tr = -(x - 150) / 180 * 44;
      else if (x >= 330 && x < 540) tr = -44 + (x - 330) / 210 * 30;
      else if (x >= 540) tr = -14 + 5 * Math.sin(x / 45);
      return 158 + 7 * Math.sin(x / 64) + tr - 20 * Math.pow(wear(x), 1.4);
    };
    // wear-out after the anomaly at P7: the temperature drifts up and the vibration amplitude grows
    function wear(x) { return Math.min(1, Math.max(0, (x - 900) / 276)); }
    const burst = (x, a, b) => 24 * Math.sin((x - a) / 5.5) * hann(x, a, b);
    const f2 = x => 282 + 5 * Math.sin(x / 7) + 12 * wear(x) * Math.sin(x / 1.7 + 2 * Math.sin(x / 11)) + burst(x, 470, 560) + burst(x, 700, 790) - 52 * Math.exp(-Math.pow((x - 860) / 5, 2));
    const p1 = trace(24, 1176, 3, f1, 7, 4), p2 = trace(24, 1176, 2, f2, 11, 5);
    let s = '';
    for (let x = 24; x <= 1176; x += 48) s += `<path d="M${x} 84V340" stroke="${C.grid}"/>`;
    s += txt(24, 84, 'spindle temperature', { fs: 11.5 }) + txt(24, 222, 'vibration', { fs: 11.5 });
    s += axis(24, 1176, 344, [[24, '08:00'], [312, '08:30'], [600, '09:00'], [888, '09:30'], [1176, '10:00']]);
    s += `<path class="trace" style="--len:1700" d="${d(p1)}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += `<path class="trace" style="--len:2400" d="${d(p2)}" fill="none" stroke="${C.ink2}" stroke-width="1.3"/>`;
    // step 1: S1 + trend: the least-squares regression line of the S1 data
    const inS1 = p1.filter(([x]) => x >= 150 && x <= 330);
    const mx = inS1.reduce((a, [x]) => a + x, 0) / inS1.length, my = inS1.reduce((a, [, y]) => a + y, 0) / inS1.length;
    const slope = inS1.reduce((a, [x, y]) => a + (x - mx) * (y - my), 0) / inS1.reduce((a, [x]) => a + (x - mx) ** 2, 0);
    const fit = x => my + slope * (x - mx);
    const c1 = chip(240, 12, 'Trend: rising', 'data');
    s += `<g class="step" style="--d:1.3s">${band(150, 330, 96, 186, 'S1', { op: 0.6 })}<path d="M154 ${fit(154).toFixed(1)}L326 ${fit(326).toFixed(1)}" stroke="${C.dat}" stroke-width="1.8" stroke-dasharray="6 4"/></g>`;
    s += `<g class="step chip-g" style="--d:1.55s" tabindex="0" role="button" data-cap="trend">${ln([[240, c1.b], [240, 88]], { stroke: C.cls, dash: '3 3' })}${c1.s}</g>`;
    // step 2: S3 + S4 similarity
    const c2 = chip(630, 12, 'Similarity 0.87', 'data');
    s += `<g class="step" style="--d:1.9s">${band(470, 560, 236, 322, 'S3', { op: 0.6 })}${band(700, 790, 236, 322, 'S4', { op: 0.6 })}</g>`;
    s += `<g class="step chip-g" style="--d:2.15s" tabindex="0" role="button" data-cap="similarity">${ln([[630, c2.b], [630, 60], [515, 60], [515, 226]], { stroke: C.cls, dash: '3 3' })}${ln([[630, 60], [745, 60], [745, 226]], { stroke: C.cls, dash: '3 3' })}${c2.s}</g>`;
    // step 3: anomaly point
    const c3 = chip(860, 12, 'Anomaly', 'data');
    s += `<g class="step" style="--d:2.5s"><circle cx="860" cy="${f2(860) - 2}" r="7" fill="none" stroke="${C.dat}" stroke-width="2"/>${txt(872, f2(860) - 4, 'P7', { fs: 12, fill: C.dat, weight: 600 })}</g>`;
    s += `<g class="step chip-g" style="--d:2.7s" tabindex="0" role="button" data-cap="anomaly">${ln([[860, c3.b], [860, f2(860) - 11]], { stroke: C.cls, dash: '3 3' })}${c3.s}</g>`;
    // step 4: an expert validates the anomaly and records a wear-out phase for the rest of the run (S5)
    const c4 = chip(0, 12, 'Expert validation', 'gen', { left: 972 });
    const c5 = chip(0, 60, 'Wear-out phase, confirmed', 'scen', { left: 972 });
    s += `<g class="step chip-g" style="--d:3.1s" tabindex="0" role="button" data-cap="validation">${ln([[c3.r + 2, 26], [c4.x - 3, 26]], { stroke: C.gen, w: 1.6, marker: id + '-ag' })}${c4.s}${ln([[c4.x + 24, c4.b + 1], [c4.x + 24, c5.y - 3]], { stroke: C.gen, w: 1.6, marker: id + '-ag' })}</g>`;
    s += `<g class="step" style="--d:3.35s">${band(912, 1176, 104, 322, 'S5', { op: 0.32 })}</g>`;
    s += `<g class="step chip-g" style="--d:3.35s" tabindex="0" role="button" data-cap="wearout">${c5.s}${ln([[c5.x + 150, c5.b], [c5.x + 150, 104]], { stroke: C.cls, dash: '3 3' })}</g>`;
    return wrap(id, W, H, s, 'Two sensor channels with annotated segments: a rising trend on S1 with its regression line, a similarity between S3 and S4, an anomaly at point P7, and an expert validation of the anomaly that records a wear-out phase for the rest of the run, segment S5, where the temperature rises and the vibration grows.');
  }

  // ------------------------------------------------------------------ examples
  function segments() {
    const id = 'p1', W = 760, H = 276;
    const f1 = x => 104 + 9 * Math.sin(x / 38) + 6 * Math.sin(x / 11);
    const f2 = x => 196 + 7 * Math.sin(x / 5) + 10 * Math.sin(x / 61);
    let s = '';
    s += `<path d="M40 38V30H720V38" fill="none" stroke="${C.dat}" stroke-width="1.8"/>` + txt(40, 22, 'run42: complete run, two dimensions', { fs: 12, fill: C.dat, weight: 600 });
    s += txt(720, 66, 'spindle temperature', { fs: 11, anchor: 'end' }) + txt(720, 168, 'vibration velocity', { fs: 11, anchor: 'end' });
    s += band(120, 232, 72, 140, 'S1') + band(364, 476, 72, 140, 'S2');
    s += `<path d="${d(trace(40, 720, 3, f1, 3, 4))}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<path d="${d(trace(40, 720, 2, f2, 5, 4))}" fill="none" stroke="${C.ink2}" stroke-width="1.2"/>`;
    s += `<circle cx="430" cy="${f2(430)}" r="6" fill="#fff" stroke="${C.dat}" stroke-width="2"/>` + txt(440, f2(430) - 8, 'P1', { fs: 12, fill: C.dat, weight: 600 });
    s += ln([[236, 152], [360, 152]], { marker: id + '-a' }) + txt(298, 168, 'before', { anchor: 'middle', fs: 11.5, fill: C.ink2, weight: 600 });
    s += [176, 420].map(x => ln([[x, 64], [x, 40]], { stroke: C.dat, dash: '2 3' })).join('');
    s += txt(186, 56, 'is part of', { fs: 10.5, fill: C.dat }) + txt(430, 56, 'is part of', { fs: 10.5, fill: C.dat });
    s += axis(40, 720, 236, [[40, '08:00'], [380, '09:00'], [720, '10:00']]);
    return wrap(id, W, H, s, 'A complete run with two dimensions; segments S1 and S2 on the temperature dimension, S1 before S2, and a single point P1 on the vibration dimension.');
  }

  function segmentKnowledge() {
    const id = 'p2', W = 760, H = 258;
    const f = x => { let tr = 0; if (x > 120 && x < 260) tr = -(x - 120) / 140 * 40; else if (x >= 260 && x < 420) tr = -40 + (x - 260) / 160 * 40; else if (x >= 420 && x < 560) tr = -(x - 420) / 140 * 36; else if (x >= 560) tr = -36 + (x - 560) / 160 * 20; return 128 + tr + 5 * Math.sin(x / 13); };
    let s = '';
    s += band(120, 260, 70, 140, 'S1') + band(420, 560, 70, 140, 'S2');
    s += `<path d="${d(trace(40, 720, 3, f, 9, 5))}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<path d="M126 130L254 92M426 130L554 96" stroke="${C.dat}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    const k = chip(340, 200, 'rising trend', 'data');
    s += ln([[190, 140], [190, 172], [k.cx - 20, 172], [k.cx - 20, 198]], { stroke: C.cls, marker: id + '-ab' });
    s += ln([[490, 140], [490, 172], [k.cx + 20, 172], [k.cx + 20, 198]], { stroke: C.cls, marker: id + '-ab' });
    s += txt(190, 188, 'segment knowledge', { fs: 10.5, anchor: 'middle', fill: C.cls }) + txt(490, 188, 'segment knowledge', { fs: 10.5, anchor: 'middle', fill: C.cls });
    s += k.s;
    const k2 = chip(190, 14, 'slope 0.42 °C per minute', 'data', { fs: 11.5, h: 26 });
    s += ln([[190, 40], [190, 52]], { stroke: C.cls }) + k2.s;
    return wrap(id, W, H, s, 'One knowledge item, rising trend, linked to S1 and to S2 individually. S1 also has a slope value.');
  }

  function multiSegment() {
    const id = 'p3', W = 760, H = 262;
    const beat = (x, c) => -56 * Math.exp(-Math.pow((x - c) / 3.2, 2)) + 14 * Math.exp(-Math.pow((x - c - 9) / 4, 2)) - 10 * Math.exp(-Math.pow((x - c + 22) / 6, 2)) - 14 * Math.exp(-Math.pow((x - c - 38) / 10, 2));
    const centres = [70, 182, 296, 404, 518, 628, 724];
    const f = x => 118 + centres.reduce((a, c) => a + beat(x, c), 0);
    let s = '';
    s += band(150, 236, 46, 140, 'S3', { dashed: true }) + band(486, 572, 46, 140, 'S4', { dashed: true });
    s += `<path d="${d(trace(30, 740, 1.5, f, 4, 2.4))}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`;
    const k = chip(361, 200, 'similarity 0.87', 'data');
    s += ln([[193, 140], [193, 172], [529, 172], [529, 140]], { stroke: C.cls, dash: '4 3' }) + ln([[361, 172], [361, 197]], { stroke: C.cls, marker: id + '-ab' });
    s += txt(371, 189, 'multi segment knowledge', { fs: 10.5, fill: C.cls });
    s += k.s;
    s += axis(30, 740, 236, [[150, '1200'], [236, '1560'], [486, '4810'], [572, '5170']]) + txt(740, 254, 'sample index', { anchor: 'end', fs: 10.5 });
    return wrap(id, W, H, s, 'Two heartbeats S3 and S4 of an ECG lead, jointly linked to one similarity value of 0.87.');
  }

  function groups() {
    const id = 'p4', W = 760, H = 270;
    let s = '';
    const thumbs = [['D1', 'Mon 2 Feb', 1], ['D2', 'Tue 3 Feb', 1], ['D3', 'Sat 7 Feb', 0]];
    const ys = [24, 104, 184];
    thumbs.forEach(([n, day, wk], i) => {
      const y0 = ys[i];
      const f = x => { const t = (x - 30) / 150; return y0 + 54 - (wk ? 34 * Math.exp(-Math.pow((t - 0.38) / 0.12, 2)) + 30 * Math.exp(-Math.pow((t - 0.68) / 0.14, 2)) + 8 : 10 + 6 * Math.sin(t * 6)); };
      s += `<rect x="30" y="${y0}" width="150" height="62" rx="5" fill="${C.datT}" fill-opacity=".7"/>`;
      s += `<path d="${d(trace(34, 176, 2, f, 20 + i, 2.5))}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`;
      s += txt(188, y0 + 26, n, { fs: 12.5, fill: C.dat, weight: 600 }) + txt(188, y0 + 42, day, { fs: 10.5 });
    });
    // outer clustering group
    s += `<rect x="300" y="14" width="440" height="244" rx="10" fill="#fff" stroke="${C.cls}" stroke-width="1.4"/>` + txt(314, 34, 'Clustering, k = 2', { fs: 12.5, fill: C.cls, weight: 600 });
    s += `<rect x="314" y="46" width="412" height="120" rx="8" fill="${C.clsT}" fill-opacity=".6" stroke="${C.cls}"/>` + txt(326, 66, 'Cluster A: weekday profile', { fs: 12, fill: C.cls, weight: 600 });
    s += `<rect x="314" y="176" width="412" height="70" rx="8" fill="${C.clsT}" fill-opacity=".6" stroke="${C.cls}"/>` + txt(326, 196, 'Cluster B: weekend profile', { fs: 12, fill: C.cls, weight: 600 });
    const a1 = chip(0, 80, 'class A', 'data', { left: 330, w: 92 }), a2 = chip(0, 120, 'class A', 'data', { left: 330, w: 92 });
    const m = chip(0, 100, 'medoid: D1', 'data', { left: 570 });
    const b1 = chip(0, 208, 'class B', 'data', { left: 330, w: 92 });
    s += a1.s + a2.s + m.s + b1.s;
    s += ln([[226, 55], [330, 94]], { stroke: C.dat, marker: id + '-a' }) + ln([[226, 135], [330, 134]], { stroke: C.dat, marker: id + '-a' }) + ln([[226, 215], [330, 222]], { stroke: C.dat, marker: id + '-a' });
    s += ln([[422, 94], [500, 94], [500, 114], [568, 114]], { stroke: C.cls, dash: '3 3' }) + ln([[422, 134], [500, 134], [500, 114]], { stroke: C.cls, dash: '3 3' });
    s += txt(506, 152, 'jointly for D1 and D2', { fs: 10.5, fill: C.cls });
    return wrap(id, W, H, s, 'Daily load profiles D1, D2 and D3 clustered into two clusters. Each cluster groups the class assignments of its members, and cluster A also holds the medoid.');
  }

  function relations() {
    const id = 'p5', W = 760, H = 220;
    let s = '';
    const k1 = chip(0, 50, 'rising temperature', 'data', { left: 20, kicker: 'data knowledge' });
    const k2 = chip(0, 50, 'anomalous vibration', 'data', { left: 280, kicker: 'data knowledge' });
    const k3 = chip(0, 50, 'unplanned downtime', 'scen', { left: 540, kicker: 'scenario knowledge' });
    const k4 = chip(0, 160, 'shift change', 'scen', { left: 572, kicker: 'scenario knowledge' });
    s += k1.s + k2.s + k3.s + k4.s;
    s += ln([[k1.r + 4, 64], [k2.x - 4, 64]], { stroke: C.cls, w: 1.6, marker: id + '-ab' }) + txt((k1.r + k2.x) / 2, 98, 'semts-dv:CausalInfluence', { anchor: 'middle', fs: 10.5, mono: true, fill: C.cls });
    s += ln([[k2.r + 4, 64], [k3.x - 4, 64]], { stroke: C.cls, w: 1.6, marker: id + '-ab' }) + txt((k2.r + k3.x) / 2, 98, 'semts-sv:Causes', { anchor: 'middle', fs: 10.5, mono: true, fill: C.cls });
    s += ln([[k3.cx, k3.b + 4], [k3.cx, k4.y - 18]], { stroke: C.cls, w: 1.6, dash: '5 4' }) + txt(k3.cx + 10, 128, 'semts-sv:CoOccursWith', { fs: 10.5, mono: true, fill: C.cls });
    s += txt((k1.r + k2.x) / 2, 50, 'directed', { anchor: 'middle', fs: 10.5 }) + txt((k2.r + k3.x) / 2, 50, 'directed', { anchor: 'middle', fs: 10.5 }) + txt(k3.cx - 10, 128, 'undirected', { anchor: 'end', fs: 10.5 });
    return wrap(id, W, H, s, 'A causal chain: rising temperature influences anomalous vibration, which causes unplanned downtime. The downtime co-occurs with a shift change.');
  }

  function quality() {
    const id = 'p6', W = 760, H = 290;
    let s = '';
    s += `<rect x="20" y="40" width="120" height="50" rx="5" fill="${C.datT}"/>` + `<path d="${d(trace(24, 136, 2, x => 66 + 12 * Math.sin(x / 6) * Math.exp(-Math.pow((x - 90) / 30, 2)), 3, 4))}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>` + txt(20, 32, 'S2', { fs: 12, fill: C.dat, weight: 600 });
    const model = chip(0, 150, 'classifier v3', 'data', { left: 20, kicker: 'model instance' });
    const f1 = chip(0, 196, 'F1 0.88', 'qual', { left: 34, fs: 11.5, h: 24 });
    const run = chip(0, 96, 'classification run', 'gen', { left: 240 });
    const pred = chip(0, 96, 'bearing wear', 'data', { left: 500, kicker: 'segment prediction' });
    const conf = chip(0, 150, 'confidence 0.92', 'qual', { left: 512, fs: 11.5, h: 24 });
    s += model.s + f1.s + run.s + pred.s + conf.s;
    s += ln([[140, 65], [200, 65], [200, 104], [238, 104]], { stroke: C.gen, marker: id + '-ag' }) + txt(150, 58, 'input data', { fs: 10.5, fill: C.gen });
    s += ln([[model.r, 164], [200, 164], [200, 118], [238, 118]], { stroke: C.gen, marker: id + '-ag' }) + txt(model.r + 6, 180, 'input knowledge', { fs: 10.5, fill: C.gen });
    s += ln([[run.r + 2, 110], [pred.x - 4, 110]], { stroke: C.gen, marker: id + '-ag' }) + txt((run.r + pred.x) / 2, 102, 'generated', { anchor: 'middle', fs: 10.5, fill: C.gen });
    s += ln([[pred.x + 30, pred.b], [pred.x + 30, conf.y]], { stroke: C.ink3 }) + ln([[model.x + 30, model.b], [model.x + 30, f1.y]], { stroke: C.ink3 });
    s += txt(pred.x + 38, 140, 'knowledge quality measure', { fs: 10.5 });
    const sel = chip(0, 238, 'model selection', 'gen', { left: 240 });
    const rec = chip(0, 238, 'use XGBoost', 'data', { left: 500, kicker: 'algorithm recommendation' });
    s += sel.s + rec.s;
    s += ln([[model.x + 92, model.b], [model.x + 92, 252], [238, 252]], { stroke: C.gen, marker: id + '-ag' }) + txt(model.x + 100, 246, 'input knowledge', { fs: 10.5, fill: C.gen });
    s += ln([[sel.r + 2, 252], [rec.x - 4, 252]], { stroke: C.gen, marker: id + '-ag' }) + txt((sel.r + rec.x) / 2, 244, 'generated', { anchor: 'middle', fs: 10.5, fill: C.gen });
    return wrap(id, W, H, s, 'A classification run uses segment S2 and a trained model. The resulting prediction carries a confidence of 0.92 and the model an F1 score of 0.88. Model selection turns the evaluated model into method knowledge: a recommendation to use XGBoost.');
  }

  function commonContext() {
    const id = 'p7', W = 760, H = 250;
    const f = x => 150 + 14 * Math.sin(x / 47) + 8 * Math.sin(x / 13) - (x > 300 && x < 520 ? 16 * hann(x, 300, 520) : 0);
    let s = '';
    s += band(120, 260, 112, 196, 'S1') + band(420, 560, 112, 196, 'S2');
    s += `<path d="M40 142H720" stroke="${C.cls}" stroke-dasharray="6 4"/>` + txt(720, 136, '80 °C', { anchor: 'end', fs: 11, fill: C.cls, weight: 600 });
    s += `<path d="${d(trace(40, 720, 3, f, 13, 5))}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
    const k = chip(0, 22, 'Default machine temperature: 80 °C', 'ctx', { left: 210 });
    s += k.s + txt(210, 14, 'common context knowledge, from the machine handbook', { fs: 10.5 });
    s += ln([[k.x + 40, k.b], [190, 104]], { stroke: C.cls, dash: '2 3', w: 1.5 }) + ln([[k.r - 40, k.b], [490, 104]], { stroke: C.cls, dash: '2 3', w: 1.5 });
    s += txt(40, 226, 'Linked with commonContextKnowledge: relevant when reading S1 and S2, but not a statement about them.', { fs: 11, fill: C.ink2 });
    return wrap(id, W, H, s, 'A context statement, default machine temperature 80 °C, linked to segments S1 and S2 as common context.');
  }

  function provenance() {
    const id = 'p8', W = 900, H = 236;
    let s = '';
    const cols = [30, 320, 610], cw = 260;
    const steps = [['1  Feature extraction', 'uses segment S2'], ['2  Classification', 'uses the features of run 1'], ['3  Expert validation', 'uses the class and expert input']];
    const ks = [['data knowledge', 'noise peak at 85 dB', 'data'], ['data knowledge', 'class: bearing wear', 'data'], ['scenario knowledge', 'wear-out phase, confirmed', 'scen']];
    cols.forEach((x, i) => {
      s += `<rect x="${x}" y="16" width="${cw}" height="58" rx="8" fill="${C.genT}" stroke="${C.gen}" stroke-width="1.3"/>`;
      s += txt(x + 14, 40, steps[i][0], { fs: 14, fill: C.gen, weight: 600 }) + txt(x + 14, 60, steps[i][1], { fs: 12, fill: C.ink2 });
      const kind = ks[i][2];
      s += `<rect x="${x}" y="114" width="${cw}" height="62" rx="8" fill="${kind === 'data' ? C.clsT : '#fff'}" stroke="${C.cls}" stroke-width="1.3"/>`;
      if (kind === 'scen') s += `<rect x="${x + 6}" y="120" width="3" height="50" rx="1.5" fill="${C.cls}"/>`;
      s += txt(x + 16, 136, ks[i][0], { fs: 11, fill: C.cls, weight: 600 }) + txt(x + 16, 160, ks[i][1], { fs: 15, fill: C.ink, weight: 600 });
      s += ln([[x + 40, 74], [x + 40, 111]], { stroke: C.gen, marker: id + '-ag' }) + txt(x + 48, 98, 'generated', { fs: 10.5, fill: C.gen });
      if (i < 2) s += ln([[x + cw, 145], [x + cw + 14, 145], [x + cw + 14, 45], [cols[i + 1] - 3, 45]], { stroke: C.gen, marker: id + '-ag' });
    });
    s += ln([[650, 176], [650, 206], [450, 206], [450, 180]], { stroke: C.cls, dash: '4 3', marker: id + '-ab' }) + txt(550, 224, 'semts-sv:Validates', { anchor: 'middle', fs: 10.5, mono: true, fill: C.cls });
    return wrap(id, W, H, s, 'Three chained runs: feature extraction on S2 yields a noise peak, classification turns it into bearing wear, and expert validation confirms the wear-out phase.');
  }

  function forecast() {
    const id = 'p9', W = 900, H = 270;
    const f = x => 150 - 46 * Math.exp(-Math.pow((x - 140) / 40, 2)) - 40 * Math.exp(-Math.pow((x - 290) / 46, 2));
    const g = x => 150 - 44 * Math.exp(-Math.pow((x - 520) / 40, 2)) - 38 * Math.exp(-Math.pow((x - 664) / 46, 2));
    let s = '';
    s += `<rect x="420" y="60" width="300" height="150" rx="4" fill="url(#${id}-hatch)"/>`;
    s += `<path d="M420 67V60H720V67" fill="none" stroke="${C.dat}" stroke-width="1.6"/>` + txt(424, 50, 'F1: artificial segment, no ground truth yet', { fs: 12, fill: C.dat, weight: 600 });
    s += band(40, 420, 60, 210, 'D7: observed day', { op: 0.35 });
    const up = [], lo = [];
    for (let x = 420; x <= 720; x += 4) { const w = 6 + (x - 420) / 300 * 22; up.push([x, g(x) - w]); lo.unshift([x, g(x) + w]); }
    s += `<path d="${d(up.concat(lo))}Z" fill="${C.cls}" fill-opacity=".14"/>`;
    s += `<path d="${d(trace(40, 420, 3, f, 2, 5))}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<path d="${d(trace(420, 720, 4, g, 1, 0))}" fill="none" stroke="${C.cls}" stroke-width="1.8" stroke-dasharray="6 4"/>`;
    s += `<path d="M420 60V216" stroke="${C.ink3}" stroke-dasharray="2 3"/>` + txt(426, 228, 'meets', { fs: 11, fill: C.ink2, weight: 600 });
    const k = chip(0, 78, 'forecast', 'data', { left: 756 });
    const pi = chip(0, 122, '90 % interval', 'data', { left: 756 });
    const q = chip(0, 168, 'MASE 0.74', 'qual', { left: 772, fs: 11.5, h: 24 });
    s += ln([[722, 92], [752, 92]], { stroke: C.cls, dash: '3 3', marker: id + '-ab' }) + ln([[722, 136], [752, 136]], { stroke: C.cls, dash: '3 3', marker: id + '-ab' });
    s += ln([[k.r, 92], [884, 92], [884, 180], [q.r, 180]], { stroke: C.ink3 });
    s += k.s + pi.s + q.s;
    s += axis(40, 720, 244, [[40, '12 Feb'], [420, '13 Feb'], [720, '14 Feb']]);
    return wrap(id, W, H, s, 'An observed day D7 meets an artificial forecast segment F1 with a dashed forecast line, a shaded 90 percent prediction interval and a MASE score.');
  }

  // SemTS graph as memory for AI agents: context goes out, new knowledge comes back
  function agents() {
    const id = 'pa', W = 620, H = 236;
    let s = agentGraph(false);
    const agent = chip(0, 104, 'AI agent', 'gen', { left: 470, w: 120, h: 34, fs: 13.5 });
    s += agent.s + txt(agent.cx, 156, 'a knowledge generation entity', { anchor: 'middle', fs: 10.5, fill: C.gen });
    // retrieve: graph -> agent
    s += `<path d="M280 66C370 54 450 70 490 101" fill="none" stroke="${C.cls}" stroke-width="1.6" marker-end="url(#${id}-ab)"/>`;
    s += txt(300, 40, 'retrieves context', { fs: 12, fill: C.cls, weight: 600 }) + txt(300, 54, 'segments, expert facts, prior results', { fs: 10.5 });
    // write back: agent -> new knowledge in the graph, checked by the shapes
    s += `<g class="step" style="--d:0.4s"><path d="M467 124C420 128 400 200 252 198" fill="none" stroke="${C.gen}" stroke-width="1.6" marker-end="url(#${id}-ag)"/>`;
    s += `<rect x="364" y="152" width="72" height="20" rx="10" fill="#FFFFFF" stroke="${C.ink3}"/>` + txt(400, 166, 'SHACL check', { anchor: 'middle', fs: 10, fill: C.ink });
    s += txt(300, 226, 'writes back new knowledge with its provenance', { fs: 10.5, fill: C.gen });
    s += `<path d="M240 198L214 160" stroke="${C.cls}" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="240" cy="198" r="12" fill="none" stroke="${C.cls}" stroke-width="1" stroke-dasharray="2 2"/><circle cx="240" cy="198" r="8" fill="${C.clsT}" stroke="${C.cls}" stroke-width="1.8"/></g>`;
    return wrap(id, W, H, s, 'An abstract SemTS knowledge graph of data, knowledge and generation nodes: an AI agent retrieves segments, expert facts and prior results from it and writes a new knowledge node back with its provenance after a SHACL check.');
  }
  // The graph of the agents figure, with the new knowledge in place
  function agentGraph(newSolid) {
    let s = `<rect x="14" y="22" width="262" height="196" rx="14" fill="#FFFFFF" stroke="${C.rule}" stroke-width="1.2"/>`;
    const N = {
      d1: [62, 168, 'dat'], d2: [134, 176, 'dat'], d3: [214, 160, 'dat'],
      k1: [70, 74, 'cls'], k2: [146, 56, 'cls'], k3: [224, 80, 'cls'], k4: [112, 112, 'cls'], k5: [188, 118, 'cls'],
      g1: [38, 116, 'gen'], g2: [252, 124, 'gen'],
    };
    if (newSolid) N.k6 = [240, 198, 'cls'];
    const E = [['k1', 'd1'], ['k4', 'd2'], ['k5', 'd2'], ['k3', 'd3'], ['k1', 'k2'], ['k2', 'k3'], ['k4', 'k5'], ['k2', 'k4'], ['g1', 'k1'], ['g1', 'k4'], ['g2', 'k3'], ['g2', 'k5'], ['k5', 'd3']];
    if (newSolid) E.push(['k6', 'd3']);
    E.forEach(([a, b]) => { s += `<path d="M${N[a][0]} ${N[a][1]}L${N[b][0]} ${N[b][1]}" stroke="${C.ink3}" stroke-width="1" opacity=".55"/>`; });
    const col = { dat: [C.dat, C.datT], cls: [C.cls, C.clsT], gen: [C.gen, C.genT] };
    Object.values(N).forEach(([x, y, k]) => { s += `<circle cx="${x}" cy="${y}" r="${k === 'cls' ? 8 : 6.5}" fill="${col[k][1]}" stroke="${col[k][0]}" stroke-width="1.8"/>`; });
    s += txt(30, 42, 'SemTS knowledge graph', { fs: 12.5, fill: C.ink, weight: 600 });
    [['data', C.dat, C.datT, 30], ['knowledge', C.cls, C.clsT, 82], ['generation', C.gen, C.genT, 160]].forEach(([t, c, f, x]) => {
      s += `<circle cx="${x + 4}" cy="206" r="4" fill="${f}" stroke="${c}" stroke-width="1.5"/>` + txt(x + 12, 210, t, { fs: 10.5 });
    });
    return s;
  }
  // A language model writes a report from the graph: an excerpt with text, a pie and a bar chart.
  // Wide layout side by side, narrow layout (phones) stacked.
  function reportPage(px, py) {
    // one page of several, showing section 3
    const pw = 222, ph = 302, x0 = px + 13;
    let s = '';
    [8, 4].forEach(o => { s += `<rect x="${px + o}" y="${py + o}" width="${pw}" height="${ph}" rx="6" fill="#FFFFFF" stroke="${C.rule}" stroke-width="1.1"/>`; });
    s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="#FFFFFF" stroke="${C.ink3}" stroke-width="1.2"/>`;
    s += txt(x0, py + 20, 'Run 42: knowledge report', { fs: 11.5, fill: C.ink, weight: 600 });
    s += txt(x0, py + 33, 'Excerpt, section 3 of 5', { fs: 9 });
    s += `<path d="M${x0} ${py + 41}H${px + pw - 13}" stroke="${C.rule}"/>`;
    s += txt(x0, py + 58, '3 Anomaly and wear-out', { fs: 11, fill: C.ink, weight: 600 });
    const seg = t => `<tspan fill="${C.dat}" font-weight="600">${t}</tspan>`;
    const lines = [
      'At 09:27 the vibration shows an',
      `anomaly at ${seg('P7')} (confidence 0.94).`,
      'An expert validated it as the start',
      'of a wear-out phase. This knowledge',
      'now holds for the rest of the run,',
      `${seg('S5')} from 09:32 to 10:00. In ${seg('S5')} the`,
      'temperature rises and the vibration',
      'amplitude triples.',
    ];
    lines.forEach((l, i) => { s += `<text x="${x0}" y="${py + 77 + i * 13.5}" font-size="10.5" fill="${C.ink2}">${l}</text>`; });
    // pie: share of the run in the wear-out phase (28 of 120 min)
    const cy0 = py + 192;
    s += txt(x0, cy0, 'Run time by state', { fs: 9, fill: C.ink, weight: 600 });
    const pcx = x0 + 24, pcy = cy0 + 31, r = 21, f = 28 / 120;
    const ang = 2 * Math.PI * f, ex = pcx + r * Math.sin(ang), ey = pcy - r * Math.cos(ang);
    s += `<circle cx="${pcx}" cy="${pcy}" r="${r}" fill="#C3CBD6"/>`;
    s += `<path d="M${pcx} ${pcy}V${pcy - r}A${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}Z" fill="${C.cls}"/>`;
    s += `<circle cx="${pcx}" cy="${pcy}" r="${r}" fill="none" stroke="#FFFFFF" stroke-width="1"/>`;
    [['wear-out 28 min', C.cls, 0], ['normal 92 min', '#C3CBD6', 12]].forEach(([t, c, o]) => {
      s += `<rect x="${x0}" y="${pcy + r + 7 + o}" width="7" height="7" rx="1.5" fill="${c}"/>` + txt(x0 + 11, pcy + r + 14 + o, t, { fs: 8.5 });
    });
    // bars: vibration amplitude before S5 and in five steps through S5
    const bx0 = px + 110, base = pcy + r;
    s += txt(bx0, cy0, 'Vibration amplitude', { fs: 9, fill: C.ink, weight: 600 });
    [5, 6.7, 9, 11.2, 13.5, 15.8].forEach((v, i) => {
      const h = v / 15.8 * 44, x = bx0 + i * 14 + (i ? 8 : 0);
      s += `<rect x="${x}" y="${(base - h).toFixed(1)}" width="10" height="${h.toFixed(1)}" rx="1.5" fill="${i ? C.cls : '#C3CBD6'}"/>`;
    });
    s += `<path d="M${bx0 - 2} ${base}H${bx0 + 92}" stroke="${C.ink3}"/>`;
    s += txt(bx0 + 5, base + 11, 'before', { anchor: 'middle', fs: 8.5 });
    s += `<path d="M${bx0 + 22} ${base + 5}V${base + 8}H${bx0 + 88}V${base + 5}" fill="none" stroke="${C.dat}"/>` + txt(bx0 + 55, base + 19, 'S5', { anchor: 'middle', fs: 8.5, fill: C.dat, weight: 600 });
    // the report continues
    s += txt(x0, py + ph - 12, '4  Recommended actions', { fs: 10.5, fill: C.ink3, weight: 600 }) + txt(px + pw - 13, py + ph - 12, '…', { anchor: 'end', fs: 11, fill: C.ink3 });
    return s;
  }
  function report(narrow) {
    const id = narrow ? 'prv' : 'pr', label = 'The SemTS knowledge graph from the agents figure, now with the new knowledge in place, is read by a language model that writes a report. The excerpt shows section 3 of 5: the anomaly at P7 was validated by an expert as the start of a wear-out phase that holds for segment S5, with a pie chart of run time by state and a bar chart of the rising vibration amplitude in S5.';
    if (narrow) {
      const W = 290, H = 622, mx = 145;
      let s = agentGraph(true);
      s += ln([[mx, 222], [mx, 240]], { stroke: C.cls, w: 1.6, marker: id + '-ab' });
      s += `<rect x="${mx - 40}" y="242" width="80" height="44" rx="6" fill="${C.genT}" stroke="${C.gen}" stroke-width="1.5"/>`;
      s += txt(mx, 260, 'Language', { anchor: 'middle', fs: 12.5, fill: C.gen, weight: 600 }) + txt(mx, 275, 'model', { anchor: 'middle', fs: 12.5, fill: C.gen, weight: 600 });
      s += txt(mx + 50, 261, 'writes text,', { fs: 10.5, fill: C.gen }) + txt(mx + 50, 274, 'draws charts', { fs: 10.5, fill: C.gen });
      s += ln([[mx, 288], [mx, 306]], { stroke: C.gen, w: 1.6, marker: id + '-ag' });
      s += reportPage(34, 308);
      return wrap(id, W, H, s, label);
    }
    const W = 640, H = 320, dy = 42, my = 120 + dy;
    let s = `<g transform="translate(0 ${dy})">${agentGraph(true)}</g>`;
    s += ln([[280, my], [298, my]], { stroke: C.cls, w: 1.6, marker: id + '-ab' });
    s += `<rect x="300" y="${my - 22}" width="80" height="44" rx="6" fill="${C.genT}" stroke="${C.gen}" stroke-width="1.5"/>`;
    s += txt(340, my - 4, 'Language', { anchor: 'middle', fs: 12.5, fill: C.gen, weight: 600 }) + txt(340, my + 11, 'model', { anchor: 'middle', fs: 12.5, fill: C.gen, weight: 600 });
    s += txt(340, my + 38, 'writes text,', { anchor: 'middle', fs: 10.5, fill: C.gen }) + txt(340, my + 51, 'draws charts', { anchor: 'middle', fs: 10.5, fill: C.gen });
    s += ln([[382, my], [402, my]], { stroke: C.gen, w: 1.6, marker: id + '-ag' });
    s += reportPage(404, 6);
    return wrap(id, W, H, s, label);
  }
  return { hero, segments, segmentKnowledge, multiSegment, groups, relations, quality, commonContext, provenance, forecast, agents, report };
})();
