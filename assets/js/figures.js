/* ==========================================================================
   ALMANAC — figures
   Every picture in the app is drawn here in code (SVG), so it stays crisp,
   follows light/dark mode, works offline and weighs almost nothing.
   All curves and diagrams are SCHEMATIC and labelled as such.
   ========================================================================== */
(function (root) {
  "use strict";
  const A = root.Almanac;
  const f1 = n => (+n).toFixed(1);
  const g = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2);

  /* ----------------------------------------------------------------- icons */
  const svg = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    drop: svg('<path d="M12 3c3 4.5 5.5 7.5 5.5 11a5.5 5.5 0 0 1-11 0C6.5 10.5 9 7.5 12 3z"/>'),
    smile: svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.500 2.200 2.200 3.500 2.200s2.500-.7 3.500-2.200M9 9.500v.2M15 9.500v.2"/>'),
    bolt: svg('<path d="M13 3 5.500 13.500H11L10 21l8-11h-5.500z"/>'),
    pain: svg('<path d="M3 12h3l2-5 3 10 3-8 2 3h5"/>'),
    plus: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    thermo: svg('<path d="M14 14.500V5a2 2 0 0 0-4 0v9.500a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>'),
    strip: svg('<rect x="8" y="2.500" width="8" height="19" rx="2"/><path d="M8 8h8M8 13h8"/>'),
    mucus: svg('<path d="M12 3c3 4.500 5.500 7.500 5.500 11a5.500 5.500 0 0 1-11 0C6.500 10.500 9 7.500 12 3z"/><path d="M9.500 14.500c.5 1.500 1.500 2 2.500 2"/>'),
    note: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>'),
    shield: svg('<path d="M12 3 5 6v6c0 4.500 3 7.500 7 9 4-1.500 7-4.500 7-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    heart: svg('<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.500-7 10-7 10z"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    book: svg('<path d="M5 5h9a4 4 0 0 1 4 4v10H9a4 4 0 0 1-4-4z"/><path d="M5 15a4 4 0 0 1 4-4h9"/>'),
    search: svg('<circle cx="11" cy="11" r="6.500"/><path d="M16 16l5 5"/>'),
    chart: svg('<path d="M4 19h16M6 15l4-5 3 3 5-7"/>'),
    life: svg('<path d="M12 21v-8"/><path d="M12 13c-4 0-6-2-6-6 4 0 6 2 6 6zM12 15c0-3 2-5 6-5 0 3-2 5-6 5z"/>'),
    pill: svg('<rect x="3.500" y="8.500" width="17" height="7" rx="3.500" transform="rotate(-35 12 12)"/><path d="M9.500 9.500l5 5" transform="rotate(0)"/>'),
    alert: svg('<path d="M12 3 2.500 20h19z"/><path d="M12 10v4.500M12 17.500v.2"/>'),
    glossary: svg('<path d="M4 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4zM20 5h-4a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h4z"/>'),
    _: 0
  };
  const PHICON = {
    winter: svg('<path d="M12 3v18M4.200 7.500l15.600 9M4.200 16.500l15.600-9"/><path d="M9.500 4.500 12 7l2.500-2.500M9.500 19.500 12 17l2.500 2.500"/>'),
    spring: svg('<path d="M12 21v-9"/><path d="M12 13c-4.500 0-7-2.500-7-6.500 4 0 7 2 7 6.500zM12 11c0-3.500 2.500-6 6.500-6 0 3.500-2.500 6-6.500 6z"/>'),
    summer: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100"/>'),
    autumn: svg('<path d="M5 19c0-8.500 5-14 14-14 0 9-5.500 14-14 14z"/><path d="M5 19l8-8"/>')
  };
  PHICON.bleed = PHICON.winter; PHICON.steady = PHICON.spring;
  const drops = n => n ? `<span class="drops">${Array.from({ length: n }, () => ICON.drop).join("")}</span>` : `<span class="drops drops--none">${svg('<circle cx="12" cy="12" r="5" stroke-dasharray="2.500 2.500"/>')}</span>`;

  /* ----------------------------------------------------- the cycle wheel */
  const pol = (cx, cy, r, deg) => { const a = deg * Math.PI / 180; return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; };
  function arc(cx, cy, r, a0, a1) {
    const [x0, y0] = pol(cx, cy, r, a0), [x1, y1] = pol(cx, cy, r, a1);
    return `M${f1(x0)} ${f1(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
  }
  /* o: { len, bleedEnd (cycle day), ovu (cycle day), today (cycle day|null), main, sub, label, fertile:true } */
  function wheel(o) {
    const S = 230, cx = S / 2, cy = S / 2, r = 82, sw = 24, len = o.len, per = 360 / len;
    const a = d => (d - 1) * per;                 // start angle of cycle day d
    const segs = [["winter", 1, o.bleedEnd], ["spring", o.bleedEnd + 1, o.ovu - 2], ["summer", o.ovu - 1, o.ovu + 1], ["autumn", o.ovu + 2, len]].filter(s => s[2] >= s[1]);
    const gap = 1.4;
    let out = `<svg class="fig fig--wheel" viewBox="0 0 ${S} ${S}" role="img" aria-label="${o.label || "Cycle wheel"}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="fg-track" stroke-width="${sw}"/>`;
    segs.forEach(([ph, d0, d1]) => { out += `<path d="${arc(cx, cy, r, a(d0) + gap / 2, a(d1 + 1) - gap / 2)}" fill="none" stroke-width="${sw}" stroke-linecap="butt" style="stroke:var(--c-${ph})"/>`; });
    if (o.fertile !== false) out += `<path d="${arc(cx, cy, r + 19, a(o.ovu - 5) + 1, a(o.ovu + 1) - 1)}" fill="none" stroke-width="5" stroke-linecap="round" style="stroke:var(--fertile)"/>`;
    // day ticks
    [1, Math.round(len / 4), Math.round(len / 2), Math.round(len * 3 / 4)].forEach(d => { const [x, y] = pol(cx, cy, r - 24, a(d) + per / 2); out += `<text x="${f1(x)}" y="${f1(y + 3)}" text-anchor="middle" class="fg-tick">${d}</text>`; });
    // ovulation marker
    const [ox, oy] = pol(cx, cy, r, a(o.ovu) + per / 2);
    out += `<circle cx="${f1(ox)}" cy="${f1(oy)}" r="6.500" class="fg-ovu"/>`;
    if (o.today) { const [tx, ty] = pol(cx, cy, r, a(o.today) + per / 2); out += `<circle cx="${f1(tx)}" cy="${f1(ty)}" r="10" class="fg-now"/><circle cx="${f1(tx)}" cy="${f1(ty)}" r="3.500" class="fg-now-dot"/>`; }
    out += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" class="fg-big">${o.main}</text><text x="${cx}" y="${cy + 19}" text-anchor="middle" class="fg-sub">${o.sub || ""}</text></svg>`;
    return out;
  }

  /* ------------------------------------------------- hormones across a cycle */
  const lh = t => 0.07 + 0.93 * g(t, -1, 0.75);
  const fsh = t => 0.14 + 0.50 * g(t, -12.5, 3.4) + 0.36 * g(t, -1, 1.0);
  function hormones() {
    const W = 340, H = 244, L = 14, R = 8, T = 22, B = 84, pw = W - L - R, ph = H - T - B, OV = 15;
    const x = d => L + (d - 1) / 27 * pw, y = v => T + (1 - v) * ph;
    const line = fn => { let s = ""; for (let i = 0; i <= 108; i++) { const d = 1 + i * 27 / 108; s += (i ? "L" : "M") + f1(x(d)) + " " + f1(y(fn(d - OV))); } return s; };
    const bands = [["winter", 0.5, 5.5, "Winter"], ["spring", 5.5, 13.5, "Spring"], ["summer", 13.5, 16.5, "☼"], ["autumn", 16.5, 28.5, "Autumn"]];
    let s = `<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schematic chart of estrogen, progesterone, LH and FSH across a 28-day cycle, with the four phases shaded and the fertile window marked.">`;
    bands.forEach(([p, a, b, n]) => { s += `<rect x="${f1(x(a))}" y="${T}" width="${f1(x(b) - x(a))}" height="${ph}" style="fill:var(--c-${p})" opacity=".17"/>`; if (n) s += `<text x="${f1((x(a) + x(b)) / 2)}" y="${T - 7}" text-anchor="middle" class="fg-band">${n}</text>`; });
    s += `<line x1="${f1(x(OV))}" x2="${f1(x(OV))}" y1="${T}" y2="${T + ph}" class="fg-dash"/><text x="${f1(x(OV) + 4)}" y="${T + 12}" class="fg-note">ovulation</text>`;
    s += `<path d="${line(fsh)}" class="fg-l" style="stroke:#4DA37A"/><path d="${line(lh)}" class="fg-l" style="stroke:#E0A526"/><path d="${line(progesterone)}" class="fg-l" style="stroke:#6A7BD6"/><path d="${line(estrogen)}" class="fg-l" style="stroke:#D2527A"/>`;
    s += `<path d="M${L} ${T + ph} H${W - R}" class="fg-axis"/>`;
    [1, 7, 14, 21, 28].forEach(d => { s += `<text x="${f1(x(d))}" y="${T + ph + 14}" text-anchor="middle" class="fg-tick">${d}</text>`; });
    s += `<text x="${W / 2}" y="${T + ph + 28}" text-anchor="middle" class="fg-note">cycle day (example 28-day cycle)</text>`;
    s += `<rect x="${f1(x(10))}" y="${T + ph + 38}" width="${f1(x(15.9) - x(10))}" height="5" rx="2.500" style="fill:var(--fertile)"/><text x="${f1(x(15.9) + 6)}" y="${T + ph + 44}" class="fg-note">fertile window</text>`;
    const lg = [["Estrogen", "#D2527A"], ["Progesterone", "#6A7BD6"], ["LH", "#E0A526"], ["FSH", "#4DA37A"]];
    lg.forEach(([n, c], i) => { const lx = 14 + i * 82; s += `<line x1="${lx}" x2="${lx + 16}" y1="${H - 12}" y2="${H - 12}" stroke="${c}" stroke-width="3" stroke-linecap="round"/><text x="${lx + 21}" y="${H - 8}" class="fg-note">${n}</text>`; });
    return s + "</svg>";
  }
  const estrogen = A.estrogen, progesterone = A.progesterone;

  /* ------------------------------------------- the four anatomy diagrams */
  function anatomy(phase) {
    const wall = "M60 30 C46 30 38 42 40 56 C42 70 51 79 60 83 C69 79 78 70 80 56 C82 42 74 30 60 30Z";
    const cav = "M60 36 C51 36 47 46 48 55 C49 65 54 71 60 74 C66 71 71 65 72 55 C73 46 69 36 60 36Z";
    const lumenScale = { winter: 0.95, spring: 0.72, summer: 0.52, autumn: 0.34 }[phase];
    const folliclesSmall = (cx, cy) => [[-4, -1], [3, 2], [0, -4]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="1.700" class="fa-fol"/>`).join("");
    let right = "";
    if (phase === "winter") right = folliclesSmall(102, 42);
    if (phase === "spring") right = `${folliclesSmall(100, 44)}<circle cx="106" cy="39" r="5.500" class="fa-fol"/><circle cx="106" cy="39" r="1.800" class="fa-egg"/>`;
    if (phase === "summer") right = `<path d="M108 36 a5.500 5.500 0 1 0 -2 7" class="fa-rupt"/><circle cx="104" cy="31" r="2.300" class="fa-egg"/><path d="M101 28 L96 33" class="fa-arrow"/><path d="M96 33 l1 -3.500 m-1 3.500 l3.500 -1" class="fa-arrow"/>`;
    if (phase === "autumn") right = `<circle cx="105" cy="40" r="5.500" class="fa-cl"/>`;
    const lining = phase === "winter"
      ? `<path d="${cav}" class="fa-cavity"/><g class="fa-drops"><circle cx="57" cy="62" r="1.800"/><circle cx="63" cy="57" r="1.800"/><circle cx="60" cy="68" r="1.800"/><circle cx="55" cy="52" r="1.400"/></g>`
      : `<path d="${cav}" class="fa-lining"/><path d="${cav}" class="fa-lumen" transform="translate(60 56) scale(${lumenScale}) translate(-60 -56)"/>`;
    return `<svg class="fig fig--anat" viewBox="0 0 120 96" role="img" aria-label="Simplified diagram of the uterus and ovaries during the ${phase === "winter" ? "menstrual" : phase === "spring" ? "follicular" : phase === "summer" ? "ovulation" : "luteal"} phase.">
      <path d="M47 38 C38 31 28 31 22 38" class="fa-tube"/><path d="M73 38 C82 31 92 31 98 38" class="fa-tube"/>
      <ellipse cx="18" cy="44" rx="10" ry="7" class="fa-ovary"/>${folliclesSmall(18, 44)}
      <ellipse cx="102" cy="42" rx="10" ry="7.500" class="fa-ovary"/>${right}
      <path d="${wall}" class="fa-wall"/>${lining}</svg>`;
  }

  /* --------------------------------------------- the temperature chart */
  function bbtData() {
    const noise = [0.03, -0.02, 0.05, -0.04, 0.01, 0.06, -0.03, 0.02, -0.05, 0.04, 0.0, -0.02, 0.05, -0.01];
    const rise = [36.68, 36.74, 36.80];                       // days 16–18: three days above the previous six
    const t = [];
    for (let d = 1; d <= 28; d++) {
      const v = d < 16 ? 36.36 + noise[d % 14] * 0.9 : d <= 18 ? rise[d - 16] : 36.76 + noise[(d + 3) % 14] * 0.8;
      t.push([d, Math.round(v * 100) / 100]);
    }
    return t;
  }
  function bbt() {
    const W = 340, H = 190, L = 34, R = 10, T = 18, B = 40, pw = W - L - R, ph = H - T - B, data = bbtData();
    const x = d => L + (d - 1) / 27 * pw, y = v => T + (1 - (v - 36.15) / 0.8) * ph;
    const shift = A.bbtShift(data), base = Math.max(...data.filter(p => p[0] >= shift - 6 && p[0] < shift).map(p => p[1]));
    let s = `<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="Example temperature chart: low temperatures before ovulation, then a sustained rise of about half a degree after it.">`;
    [36.2, 36.4, 36.6, 36.8].forEach(v => { s += `<line x1="${L}" x2="${W - R}" y1="${f1(y(v))}" y2="${f1(y(v))}" class="fg-grid"/><text x="${L - 5}" y="${f1(y(v) + 3)}" text-anchor="end" class="fg-tick">${v.toFixed(1)}</text>`; });
    s += `<rect x="${f1(x(shift - 6) - 3)}" y="${T}" width="${f1(x(shift - 1) - x(shift - 6) + 6)}" height="${ph}" rx="6" style="fill:var(--c-spring)" opacity=".16"/><text x="${f1((x(shift - 6) + x(shift - 1)) / 2)}" y="${T + 11}" text-anchor="middle" class="fg-note">baseline</text>`;
    s += `<rect x="${f1(x(shift) - 3)}" y="${T}" width="${f1(x(shift + 2) - x(shift) + 6)}" height="${ph}" rx="6" style="fill:var(--c-summer)" opacity=".24"/><text x="${f1((x(shift) + x(shift + 2)) / 2)}" y="${T + 11}" text-anchor="middle" class="fg-note">3 higher</text>`;
    s += `<line x1="${f1(x(shift - 6))}" x2="${f1(x(28))}" y1="${f1(y(base))}" y2="${f1(y(base))}" class="fg-dash"/><text x="${W - R}" y="${f1(y(base) + 12)}" text-anchor="end" class="fg-note">coverline</text>`;
    s += `<line x1="${f1(x(shift - 1))}" x2="${f1(x(shift - 1))}" y1="${T}" y2="${T + ph}" class="fg-dash fg-dash--ovu"/>`;
    s += `<path d="M${data.map(p => f1(x(p[0])) + " " + f1(y(p[1]))).join("L")}" fill="none" class="fg-l" style="stroke:var(--accent);stroke-width:2"/>`;
    data.forEach(p => { s += `<circle cx="${f1(x(p[0]))}" cy="${f1(y(p[1]))}" r="2.600" class="fg-dot${p[0] >= shift && p[0] <= shift + 2 ? " fg-dot--hi" : ""}"/>`; });
    s += `<path d="M${L} ${T + ph} H${W - R}" class="fg-axis"/>`;
    [1, 7, 14, 21, 28].forEach(d => { s += `<text x="${f1(x(d))}" y="${T + ph + 14}" text-anchor="middle" class="fg-tick">${d}</text>`; });
    s += `<text x="${f1(x(shift - 1))}" y="${H - 3}" text-anchor="middle" class="fg-note">ovulation about here</text><text x="${W - R}" y="${H - 3}" text-anchor="end" class="fg-note">°C, example data</text></svg>`;
    return s;
  }

  /* ---------------------------------------------------- LH test strips */
  function lhStrips() {
    const items = [["Before the surge", 0.12], ["Surge starting", 0.55], ["Positive", 1]];
    let s = `<svg class="fig fig--lh" viewBox="0 0 340 118" role="img" aria-label="Three ovulation test strips: a faint test line before the surge, a darker line as it starts, and a test line as dark as the control line when positive.">`;
    items.forEach(([n, o], i) => {
      const x = 22 + i * 108;
      s += `<rect x="${x}" y="8" width="64" height="70" rx="9" class="fg-strip"/><rect x="${x + 8}" y="22" width="48" height="6" rx="3" class="fg-ctl"/><rect x="${x + 8}" y="46" width="48" height="6" rx="3" class="fg-tst" opacity="${o}"/>`;
      s += `<text x="${x + 32}" y="96" text-anchor="middle" class="fg-note">${n}</text>`;
    });
    s += `<text x="170" y="112" text-anchor="middle" class="fg-note fg-note--faint">top line = control · lower line = test (kits differ, so follow yours)</text></svg>`;
    return s;
  }

  /* ----------------------------------------------------- mucus scale */
  const MUCUS_GLYPH = {
    dry: svg('<circle cx="12" cy="12" r="4.500" stroke-dasharray="2.500 2.500"/>'),
    sticky: svg('<path d="M7 14c0-3.500 3-5.500 6-4s4 5 1 7-7 1-7-3z"/>'),
    creamy: svg('<path d="M6 15c0-4.500 5-7 9-4s2 8-3 8M9 15c0-2.500 3-3.500 5-2"/>'),
    watery: svg('<path d="M8 6c1.500 2 2.500 3.200 2.500 4.500a2.500 2.500 0 0 1-5 0C5.500 9.200 6.500 8 8 6zM16 11c1.500 2 2.500 3.200 2.500 4.500a2.500 2.500 0 0 1-5 0C13.500 14.200 14.500 13 16 11z"/>'),
    eggwhite: svg('<circle cx="5" cy="14" r="2"/><circle cx="19" cy="14" r="2"/><path d="M7 13c3-8 7-8 10 0M7 15c3-3 7-3 10 0"/>')
  };

  root.AlmanacFigures = { ICON, PHICON, drops, wheel, hormones, anatomy, bbt, bbtData, lhStrips, MUCUS_GLYPH };
})(typeof self !== "undefined" ? self : this);
