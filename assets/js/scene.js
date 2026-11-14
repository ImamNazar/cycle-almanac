/* ==========================================================================
   ALMANAC — the scene
   One illustration, generated in code, that changes with:
     • the real time of day      → sky colour, sun / moon / stars, window light
     • your cycle phase          → season: bare & snowy / blossom / full summer / autumn
     • your hormones             → the two hills ARE the estrogen and progesterone curves
     • today                     → a lantern stands on the hills at "you are here"
   ========================================================================== */
(function (root) {
  "use strict";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => "#" + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const f1 = n => n.toFixed(1);

  /* ------------------------------------------------------------------ sky */
  const SKY = [
    [0, "#0A0F2C", "#1A2150"], [4.5, "#0E1438", "#252E63"], [6, "#46457F", "#F0A27E"], [7.5, "#78A9E3", "#F7DDBF"],
    [11, "#5BA3E6", "#CBE7F8"], [16, "#6AA6E3", "#D7ECF7"], [18, "#6F8FD0", "#F8C48A"], [19.7, "#3E3578", "#E6806F"],
    [21.2, "#151B45", "#2A3270"], [24, "#0A0F2C", "#1A2150"]
  ];
  function sky(h) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (h >= a[0] && h <= b[0]) { const t = (h - a[0]) / (b[0] - a[0]); return [mix(a[1], b[1], t), mix(a[2], b[2], t)]; }
    }
    return [SKY[0][1], SKY[0][2]];
  }
  const night = h => (h < 4.5 || h >= 21.5) ? 1 : h < 7.5 ? 1 - (h - 4.5) / 3 : h < 18 ? 0 : (h - 18) / 3.5;

  /* --------------------------------------------------------------- palettes */
  const PAL = {
    winter: { back: "#8393BC", front: "#B1BDD9", ground: "#E8EDF6", trunk: "#5A4A4A" },
    spring: { back: "#86BE9E", front: "#A6D6A0", ground: "#BDE29F", trunk: "#6B4F43", a: "#F5B8CB", b: "#FFE0EA", c: "#8CCB8A" },
    summer: { back: "#5FA65F", front: "#8BC16A", ground: "#A8CE5C", trunk: "#6A4B35", a: "#4F9E54", b: "#79BB5A", c: "#E8A317" },
    autumn: { back: "#B97B52", front: "#D79B58", ground: "#C98C45", trunk: "#5E4034", a: "#D8642E", b: "#E9A63A", c: "#B9452B" },
    meadow: { back: "#8FB8A0", front: "#B2D3A2", ground: "#C7E0A8", trunk: "#6B4F43", a: "#8CCB8A", b: "#A9D8A0", c: "#F5D88A" }
  };
  const SEASON_OF = { winter: "winter", spring: "spring", summer: "summer", autumn: "autumn", bleed: "winter", steady: "meadow" };

  /* ------------------------------------------------------------------ tree */
  function tree(cx, baseY, season, progress, pal, nightK, seed) {
    const r = rng(seed), br = [], tips = [], mids = [];
    (function grow(x, y, ang, len, w, d) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      br.push(`<path d="M${f1(x)} ${f1(y)} Q${f1((x + x2) / 2 + (r() - .5) * len * .3)} ${f1((y + y2) / 2)} ${f1(x2)} ${f1(y2)}" stroke-width="${f1(w)}"/>`);
      if (d <= 0) { tips.push([x2, y2]); return; }
      if (d <= 3) mids.push([x2, y2]);
      const kids = d > 3 ? 2 : (r() < .45 ? 3 : 2);
      for (let i = 0; i < kids; i++) {
        const spread = kids === 2 ? (i ? 1 : -1) * (.34 + r() * .3) : (i - 1) * (.5 + r() * .25);
        grow(x2, y2, ang + spread, len * (.7 + r() * .12), Math.max(w * .66, .8), d - 1);
      }
    })(cx, baseY, -Math.PI / 2, 40, 7.5, 5);

    const dim = c => mix(c, "#0B1030", nightK * .6);
    let leaves = "", extra = "";
    const pts = tips.concat(mids);
    if (season === "spring") {
      const dens = .18 + .82 * progress;
      pts.forEach(([x, y]) => { for (let i = 0; i < 3; i++) if (r() < dens) leaves += `<circle cx="${f1(x + (r() - .5) * 16)}" cy="${f1(y + (r() - .5) * 14)}" r="${f1(2.6 + r() * 2.4)}" fill="${dim(r() < .7 ? pal.a : pal.b)}"/>`; });
      pts.forEach(([x, y]) => { if (r() < .4 * progress) leaves += `<circle cx="${f1(x + (r() - .5) * 10)}" cy="${f1(y + (r() - .5) * 10)}" r="2.4" fill="${dim(pal.c)}"/>`; });
    } else if (season === "summer") {
      pts.forEach(([x, y]) => { for (let i = 0; i < 4; i++) leaves += `<circle cx="${f1(x + (r() - .5) * 20)}" cy="${f1(y + (r() - .5) * 18)}" r="${f1(5 + r() * 4)}" fill="${dim(r() < .5 ? pal.a : pal.b)}"/>`; });
      pts.forEach(([x, y]) => { if (r() < .22) leaves += `<circle cx="${f1(x + (r() - .5) * 12)}" cy="${f1(y + 5 + (r() - .5) * 8)}" r="2.6" fill="${dim(pal.c)}"/>`; });
    } else if (season === "autumn" || season === "meadow") {
      const dens = season === "meadow" ? .9 : 1 - .72 * progress;
      pts.forEach(([x, y]) => { for (let i = 0; i < 4; i++) if (r() < dens) leaves += `<circle cx="${f1(x + (r() - .5) * 18)}" cy="${f1(y + (r() - .5) * 16)}" r="${f1(3.4 + r() * 3.2)}" fill="${dim([pal.a, pal.b, pal.c][(r() * 3) | 0])}"/>`; });
      if (season === "autumn") for (let i = 0; i < 10 + progress * 22; i++) extra += `<ellipse cx="${f1(cx - 60 + r() * 120)}" cy="${f1(baseY + 4 + r() * 12)}" rx="3" ry="1.5" fill="${dim([pal.a, pal.b, pal.c][(r() * 3) | 0])}"/>`;
    } else {   // winter: bare, with snow
      pts.forEach(([x, y]) => { if (r() < .8) extra += `<ellipse cx="${f1(x)}" cy="${f1(y - 1.5)}" rx="${f1(3 + r() * 3)}" ry="1.6" fill="${mix("#FFFFFF", "#9FB0D6", nightK * .6)}"/>`; });
    }
    return `<g stroke="${dim(pal.trunk)}" fill="none" stroke-linecap="round">${br.join("")}</g>${extra}${leaves}`;
  }

  /* --------------------------------------------------------------- the scene */
  let uidN = 0;
  function render(o) {
    const uid = "s" + (++uidN);
    const h = o.hour, nK = night(h), [top, bot] = sky(h);
    const season = SEASON_OF[o.phase] || "meadow", pal = PAL[season];
    const nightLand = c => mix(c, "#0B1030", nK * .6);
    const W = 400, H = 470, N = 80;
    const r = rng(11);

    // hills: back = progesterone, front = estrogen (or gentle rolling hills if there's no cycle data)
    const E = o.curves ? o.curves.E : Array.from({ length: N }, (_, i) => .35 + .18 * Math.sin(i / 9) + .08 * Math.sin(i / 3.3));
    const P = o.curves ? o.curves.P : Array.from({ length: N }, (_, i) => .45 + .22 * Math.sin(i / 13 + 1.2) + .06 * Math.sin(i / 4));
    const ridge = (arr, base, amp, wob) => arr.map((v, i) => [(i / (N - 1)) * W, base - amp * v + Math.sin(i * .9 + wob) * 1.1]);
    const back = ridge(P, 338, 108, 0), front = ridge(E, 382, 96, 2);
    const path = pts => "M0 470 L" + pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join(" L") + " L400 470 Z";
    const line = pts => "M" + pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join(" L");
    const yAt = (pts, x) => { const i = clamp(Math.round((x / W) * (N - 1)), 0, N - 1); return pts[i][1]; };

    // sun and moon
    let bodies = "";
    if (h >= 5.5 && h <= 20.5) {
      const t = (h - 6) / 14, x = 40 + 320 * clamp(t, 0, 1), y = 238 - 150 * Math.sin(Math.PI * clamp(t, 0, 1));
      const warm = 1 - Math.sin(Math.PI * clamp(t, 0, 1));
      const col = mix("#FFF1B8", "#FF9A55", warm * .9), glow = mix("#FFE9A8", "#FF8A4C", warm);
      bodies += `<circle cx="${f1(x)}" cy="${f1(y)}" r="46" fill="${glow}" opacity=".25"/><circle cx="${f1(x)}" cy="${f1(y)}" r="26" fill="${glow}" opacity=".35"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${season === "summer" ? 17 : 14}" fill="${col}"/>`;
    }
    if (nK > .45) {
      const t = ((h >= 18 ? h - 18 : h + 6) / 12), x = 40 + 320 * clamp(t, 0, 1), y = 232 - 120 * Math.sin(Math.PI * clamp(t, 0, 1));
      bodies += `<g opacity="${f1(clamp(nK * 1.2, 0, 1))}"><circle cx="${f1(x)}" cy="${f1(y)}" r="30" fill="#DDE4FF" opacity=".14"/><circle cx="${f1(x)}" cy="${f1(y)}" r="12" fill="#F4F1E6"/><circle cx="${f1(x + 4)}" cy="${f1(y - 3)}" r="2.4" fill="#DAD6C4"/><circle cx="${f1(x - 3)}" cy="${f1(y + 4)}" r="1.8" fill="#DAD6C4"/></g>`;
    }
    let stars = "";
    if (nK > .2) for (let i = 0; i < 46; i++) { const x = r() * W, y = r() * 200, s = r() * 1.3 + .4; stars += `<circle class="star${i % 4 === 0 ? " tw" : ""}" cx="${f1(x)}" cy="${f1(y)}" r="${f1(s)}" fill="#F6F0D8" opacity="${f1(nK * (.35 + r() * .6))}" style="animation-delay:${f1(r() * 4)}s"/>`; }

    // clouds (drift continuously, even when re-rendered)
    const cloudCol = mix("#FFFFFF", "#7A86B8", nK * .75);
    const cloudOp = (season === "winter" || season === "autumn" ? .8 : .6) * (1 - nK * .35);
    const clk = o.clock || 0;
    const cloud = (y, s, dur, off) => `<g class="cloud" style="animation-duration:${dur}s;animation-delay:-${f1((clk + off) % dur)}s;transform-box:fill-box"><g transform="translate(0 ${y}) scale(${s})" fill="${cloudCol}" opacity="${f1(cloudOp)}"><ellipse cx="0" cy="0" rx="34" ry="11"/><ellipse cx="-18" cy="-6" rx="18" ry="11"/><ellipse cx="10" cy="-10" rx="22" ry="13"/><ellipse cx="26" cy="-2" rx="16" ry="8"/></g></g>`;
    const clouds = cloud(78, 1, 190, 20) + cloud(128, .7, 240, 90) + cloud(54, .55, 290, 150);

    // lantern: stands on whichever hill is higher at today's position
    const lx = clamp(o.todayX == null ? .5 : o.todayX, .04, .96) * W;
    const ly = Math.min(yAt(back, lx), yAt(front, lx));
    const lit = .35 + nK * .65;
    const lantern = `<g class="lantern"><circle cx="${f1(lx)}" cy="${f1(ly - 30)}" r="${f1(16 + nK * 14)}" fill="#FFD27A" opacity="${f1(.18 + nK * .34)}"/><line x1="${f1(lx)}" y1="${f1(ly + 2)}" x2="${f1(lx)}" y2="${f1(ly - 24)}" stroke="#3A2D3F" stroke-width="2.2" stroke-linecap="round"/><rect x="${f1(lx - 5)}" y="${f1(ly - 38)}" width="10" height="14" rx="3" fill="#FFE2A0" opacity="${f1(lit + .15)}" stroke="#3A2D3F" stroke-width="1.6"/><path d="M${f1(lx - 6)} ${f1(ly - 38)} L${f1(lx)} ${f1(ly - 44)} L${f1(lx + 6)} ${f1(ly - 38)}" fill="#3A2D3F"/><circle class="flame" cx="${f1(lx)}" cy="${f1(ly - 31)}" r="2.4" fill="#FF9D3C"/></g>`;

    // cottage
    const cx = 304, cy = 440, win = clamp(.2 + nK * .95, 0, 1);
    const smoke = (season === "winter" || season === "autumn") ? `<circle class="smoke" cx="${cx + 13}" cy="${cy - 40}" r="3" fill="#fff" opacity=".5"/><circle class="smoke s2" cx="${cx + 13}" cy="${cy - 40}" r="3" fill="#fff" opacity=".5"/>` : "";
    const cottage = `<g>${smoke}<rect x="${cx + 9}" y="${cy - 38}" width="8" height="14" fill="${nightLand("#8A6A5C")}"/><rect x="${cx - 22}" y="${cy - 28}" width="44" height="28" fill="${nightLand("#EBD9BE")}"/><path d="M${cx - 27} ${cy - 27} L${cx} ${cy - 50} L${cx + 27} ${cy - 27} Z" fill="${nightLand(season === "winter" ? "#F4F7FC" : "#B5654A")}"/><rect x="${cx - 14}" y="${cy - 20}" width="10" height="10" rx="1.5" fill="#FFD27A" opacity="${f1(win)}" stroke="${nightLand("#6E5547")}" stroke-width="1.2"/><rect x="${cx + 4}" y="${cy - 18}" width="9" height="18" rx="1.5" fill="${nightLand("#7A5646")}"/></g>`;

    const aria = o.label || "A landscape that follows your cycle";
    const grain = `<filter id="${uid}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .55 0"/></filter>`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${aria}" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="${uid}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>${grain}
<filter id="${uid}h" x="-5%" y="-10%" width="110%" height="130%"><feDropShadow dx="0" dy="-2" stdDeviation="3" flood-color="#0B1030" flood-opacity="${f1(.14 + nK * .12)}"/></filter></defs>
<rect width="${W}" height="${H}" fill="url(#${uid}g)"/>${stars}${bodies}${clouds}
<path d="${path(back)}" fill="${nightLand(pal.back)}" filter="url(#${uid}h)"/><path d="${line(back)}" fill="none" stroke="${mix(nightLand(pal.back), "#FFFFFF", .35)}" stroke-width="1.6" opacity=".55"/>
<path d="${path(front)}" fill="${nightLand(pal.front)}" filter="url(#${uid}h)"/><path d="${line(front)}" fill="none" stroke="${mix(nightLand(pal.front), "#FFFFFF", .4)}" stroke-width="1.6" opacity=".6"/>
${lantern}
<path d="M0 412 Q120 398 250 410 T400 404 L400 470 L0 470 Z" fill="${nightLand(pal.ground)}" filter="url(#${uid}h)"/>
${cottage}${tree(98, 440, season, o.progress == null ? .5 : o.progress, pal, nK, 7)}
<rect width="${W}" height="${H}" filter="url(#${uid}n)" opacity=".16" style="mix-blend-mode:multiply" pointer-events="none"/>
</svg>`;
  }

  /* -------------------------------------------------------------- particles
     Gentle, sparse, and off entirely for people who prefer reduced motion.   */
  function particles(canvas, getState) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, parts = [], kind = "", last = 0, w = 0, h = 0, dpr = 1;
    const ctx = canvas.getContext("2d");
    function fit() { const b = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); w = b.width; h = b.height; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed(); }
    function seed() {
      const s = getState(); kind = s.kind; parts = [];
      const n = { snow: 46, petal: 24, leaf: 22, firefly: 16 }[kind] || 0;
      for (let i = 0; i < n; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, v: .25 + Math.random() * .6, r: 1 + Math.random() * 2.2, p: Math.random() * 6.3, c: Math.random() });
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return; last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.p += .02;
        if (kind === "snow") { p.y += p.v * 1.1; p.x += Math.sin(p.p) * .35; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
        else if (kind === "petal") { p.y += p.v * 1.1; p.x += Math.sin(p.p) * .7 + .15; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.p); ctx.fillStyle = p.c < .5 ? "rgba(255,196,214,.9)" : "rgba(255,240,245,.9)"; ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.7, p.r, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
        else if (kind === "leaf") { p.y += p.v * 1.2; p.x += Math.sin(p.p) * .9 - .1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.p * 1.3); ctx.fillStyle = p.c < .34 ? "rgba(216,100,46,.9)" : p.c < .67 ? "rgba(233,166,58,.9)" : "rgba(185,69,43,.9)"; ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.9, p.r * 1.1, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
        else if (kind === "firefly") { p.x += Math.sin(p.p * .7) * .5; p.y += Math.cos(p.p * .5) * .4; const a = .35 + .65 * (Math.sin(p.p * 2) * .5 + .5); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7); g.addColorStop(0, `rgba(255,236,150,${a})`); g.addColorStop(1, "rgba(255,236,150,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 6.283); ctx.fill(); }
        if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; }
        if (p.x > w + 10) p.x = -10; if (p.x < -10) p.x = w + 10;
      }
    }
    return {
      start() { if (reduce) return; fit(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); },
      refresh() { if (reduce) return; const k = getState().kind; if (k !== kind) seed(); },
      stop() { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, w, h); },
      fit
    };
  }

  root.AlmanacScene = { render, particles, sky, night, mix, PAL };
})(typeof self !== "undefined" ? self : this);
