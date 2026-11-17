/* ==========================================================================
   ALMANAC — the app
   State lives in one object (`data`) saved to this device's localStorage.
   Nothing is ever sent anywhere.
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Almanac, C = window.AlmanacContent, SC = window.AlmanacScene, F = window.AlmanacFigures;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KEY = "almanac.v1";
  const LOC = navigator.language || "en";
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- storage */
  const guessWeek = () => { try { return ["US", "CA", "MX", "BR", "JP", "IN", "PH", "IL", "SA", "ZA", "TW", "HK", "KR", "CO", "PE"].includes(new Intl.Locale(LOC).maximize().region) ? "sun" : "mon"; } catch (e) { return "mon"; } };
  const fresh = () => ({ v: 1, settings: { mode: "natural", age: "adult", unit: "C", weekStart: guessWeek(), defaultCycle: null, defaultPeriod: 5, onboarded: false, lastBackup: null }, logs: {}, sample: false });
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw), f = fresh(); d.settings = Object.assign(f.settings, d.settings || {}); d.logs = d.logs && typeof d.logs === "object" ? d.logs : {}; return d; } } catch (e) { /* storage blocked or corrupt */ }
    return fresh();
  }
  let data = load(), saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { toast("Couldn't save on this device. Private browsing can block saving."); } }, 120);
  }

  /* ---------------------------------------------------------------- time */
  let NOW = new Date(), TODAY = A.localDay(NOW), AN = null, PAT = null;
  const recompute = () => { AN = A.analyze(data, TODAY); PAT = A.patterns(data, AN); };
  const dayDate = n => new Date(n * 86400000);
  const fmt = (n, o) => new Intl.DateTimeFormat(LOC, Object.assign({ timeZone: "UTC" }, o)).format(dayDate(n));
  const fShort = n => fmt(n, { day: "numeric", month: "short" });
  const fLong = n => fmt(n, { weekday: "long", day: "numeric", month: "long" });
  const fRange = (a, b) => { if (a === b) return fShort(a); try { return new Intl.DateTimeFormat(LOC, { day: "numeric", month: "short", timeZone: "UTC" }).formatRange(dayDate(a), dayDate(b)); } catch (e) { return fShort(a) + " – " + fShort(b); } };
  const rel = n => { const d = n - TODAY; return d === 0 ? "today" : d === 1 ? "tomorrow" : d === -1 ? "yesterday" : d > 0 ? "in " + d + " days" : -d + " days ago"; };
  const greeting = () => { const h = NOW.getHours(); return h < 5 ? "Still up?" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night"; };
  const cToUnit = c => data.settings.unit === "F" ? c * 9 / 5 + 32 : c;
  const unitToC = v => data.settings.unit === "F" ? (v - 32) * 5 / 9 : v;
  const isoNow = () => A.fromDay(TODAY);
  const pName = p => (C.PHASES[p] || {}).name || "";

  /* --------------------------------------------------------------- icons */
  const I = {
    drop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4.5 5.5 7.5 5.5 11a5.5 5.5 0 0 1-11 0C6.5 10.500 9 7.500 12 3z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    chev: d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}"/></svg>`,
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ------------------------------------------------------------ UI state */
  const ui = { tab: "today", month: null, day: null, ob: null };
  const monthOf = d => { const iso = A.fromDay(d); return { y: +iso.slice(0, 4), m: +iso.slice(5, 7) - 1 }; };
  ui.month = monthOf(TODAY);

  /* ------------------------------------------------------------- helpers */
  const cycleDayOf = d => { let p = null; for (const x of AN.periods) { if (x.start <= d) p = x; else break; } return p ? d - p.start + 1 : null; };
  const sampleBanner = () => data.sample ? `<div class="banner"><span><b>Example data.</b> This is made-up so you can explore. It isn't anyone's real cycle.</span><button class="link" data-act="clear-sample" type="button">Start with my own</button></div>` : "";
  const modeOf = () => data.settings.mode;

  function toast(msg, undo) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button" data-act="undo">Undo</button>' : ""}`;
    t.classList.add("on"); toast.undo = undo || null;
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), undo ? 6000 : 3200);
  }

  /* ============================================================ LOGGING */
  function setLog(iso, patch) {
    const cur = Object.assign({}, data.logs[iso], patch);
    for (const k of Object.keys(cur)) { const v = cur[k]; if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) delete cur[k]; }
    if (Object.keys(cur).length) data.logs[iso] = cur; else delete data.logs[iso];
    save(); recompute();
  }
  function startPeriodToday() {
    const iso = isoNow(), before = data.logs[iso] ? JSON.parse(JSON.stringify(data.logs[iso])) : null;
    setLog(iso, { flow: (data.logs[iso] && data.logs[iso].flow >= 2) ? data.logs[iso].flow : 3 });
    toast("Period started. Day 1 is today.", () => { if (before) data.logs[iso] = before; else delete data.logs[iso]; save(); render(); });
    render();
  }

  /* ========================================================== COMPONENTS */
  function ribbon(c) {
    const st = AN.last.start, total = Math.max(c.predLen, c.day), o = c.ovu.day;
    const w1 = c.bleedEnd - st + 1, w2 = Math.max(0, o - 2 - c.bleedEnd), w3 = 3, w4 = Math.max(1, total - w1 - w2 - w3);
    const segs = [["winter", w1], ["spring", w2], ["summer", w3], ["autumn", w4]].filter(s => s[1] > 0);
    const sum = segs.reduce((s, x) => s + x[1], 0);
    const pct = v => (100 * v / sum).toFixed(2) + "%";
    const f0 = o - 5 - st, f1 = o + 1 - st;
    const aria = `Cycle day ${c.day} of about ${c.predLen}. ${pName(c.phase)}, ${C.PHASES[c.phase].sci.toLowerCase()}.`;
    return `<div class="ribbon" role="img" aria-label="${esc(aria)}">
      <div class="ribbon__bar">${segs.map(s => `<i style="flex:${s[1]};background:var(--c-${s[0]})"></i>`).join("")}
        <span class="ribbon__now" style="left:${pct(clamp(c.day - 0.5, 0, sum))}"></span></div>
      <div class="ribbon__fert" style="left:${pct(clamp(f0, 0, sum))};width:${pct(clamp(f1, 0, sum) - clamp(f0, 0, sum))}" title="Estimated fertile window"><span>Fertile window</span></div>
      <div class="ribbon__legend"><span><i style="background:var(--c-winter)"></i>Winter</span><span><i style="background:var(--c-spring)"></i>Spring</span><span><i style="background:var(--c-summer)"></i>Summer</span><span><i style="background:var(--c-autumn)"></i>Autumn</span></div>
    </div>`;
  }
  const clamp = A.clamp;

  function fact(ico, title, sub) { return `<li class="fact"><span class="fact__ico">${ico}</span><span><b class="fact__t">${title}</b><span class="fact__s">${sub}</span></span></li>`; }

  function nextFact(c) {
    const n = c.next, b = c.basis;
    if (c.inPeriod) return fact(I.drop, "Period in progress", `Day ${c.day} of your period`);
    if (c.late) return fact(I.clock, "Later than your usual range", `Cycles run late for lots of reasons: stress, illness, travel, changes in routine. If there's any chance you could be pregnant, a test is most reliable from the first day of a missed period.`);
    const confidence = b.basis === "personal" ? `Usually inside this range about 8 times in 10, based on your last ${b.n} cycles.` : b.basis === "early" ? `A rough guess from ${b.n} cycle${b.n > 1 ? "s" : ""}. Log 2 or 3 more and it'll sharpen.` : `A rough starting guess (${c.predLen} days). It sharpens as you log cycles.`;
    return fact(I.drop, `Next period: ${fLong(n.start)} <small>(${rel(n.start)})</small>`, `Likely ${fRange(n.lo, n.hi)}. ${confidence}`);
  }
  function fertileFact(c) {
    const f = c.fertile, o = c.ovu;
    const src = o.source === "temp" ? "confirmed by your temperature" : o.source === "lh" ? "expected from your LH test" : "estimated from the calendar";
    let t, s;
    if (o.confirmed && f.status === "after") { t = "Ovulation likely happened around " + fShort(o.day); s = "Confirmed by your temperature, so the fertile window has closed for this cycle."; }
    else if (f.status === "in") { t = "You're in your likely fertile window"; s = `Ovulation is ${src} around ${fShort(o.day)}. The window runs ${fRange(f.start, f.end)}.`; }
    else if (f.status === "before") { t = "Likely fertile window: " + fRange(f.start, f.end); s = `Opens ${rel(f.start)}. Ovulation ${src}.`; }
    else { t = "Your likely fertile window has passed"; s = `Ovulation was ${src} around ${fShort(o.day)}.`; }
    if (c.imprecise && !o.confirmed) s += " Your cycles vary a lot, so a calendar can't pinpoint this. LH tests, mucus or temperature are far more precise.";
    return fact(I.sun, t, s);
  }

  /* ============================================================== PAGES */
  function pageToday() {
    const S = data.settings, c = AN.current;
    let h = sampleBanner();
    if (!AN.hasData) return h + `<section class="card status"><p class="eyebrow">${greeting()}</p>
      <h1 class="status__h">Welcome to <span class="status__ph">Almanac</span></h1>
      <p class="status__line">Log the first day of your last period and the landscape above starts following your cycle.</p>
      <div class="actions"><button class="btn" data-act="start-period" type="button">My period started today</button><button class="btn btn--ghost" data-act="pick-start" type="button">It started earlier</button></div>
      <p class="fine">Everything stays on this device. No account, no server.</p></section>` + todayLogCard() + learnTeaser();
    if (S.mode === "paused") return h + `<section class="card status"><p class="eyebrow">${greeting()}</p><h1 class="status__h">Predictions <span class="status__ph">paused</span></h1>
      <p class="status__line">Cycle estimates are off, which makes sense during pregnancy, postpartum or whenever your cycle isn't following its usual pattern. You can still log how you feel, and switch predictions back on in Settings.</p>
      <div class="actions"><button class="btn" data-act="log" type="button">Log today</button></div></section>` + todayLogCard() + flagsHTML();

    const P = C.PHASES[c.phase];
    const hormonal = S.mode === "hormonal";
    h += `<section class="card status" aria-labelledby="st-h"><p class="eyebrow">${greeting()}</p>
      <span class="status__badge" aria-hidden="true">${F.PHICON[c.phase] || ""}</span>
      <h1 class="status__h" id="st-h">Day ${c.day} <span class="status__ph">${P.name}</span></h1>
      <p class="status__sci">${P.sci}</p><p class="status__line">${P.line}</p>
      ${hormonal ? "" : ribbon(c)}
      <ul class="facts">${nextFact(c)}${hormonal ? "" : fertileFact(c)}</ul>
      ${hormonal ? "" : `<p class="fine">Fertile-window dates are estimates and <b>not birth control</b>.</p>`}
      <div class="actions">${actionsFor(c)}</div></section>`;
    h += outlookCard() + todayLogCard() + flagsHTML() + seasonCard(c);
    return h;
  }
  function actionsFor(c) {
    const L = data.logs[isoNow()] || {}, flowToday = (L.flow || 0) >= 2;
    if (c.inPeriod && !flowToday) return `<button class="btn" data-act="log" type="button">Still bleeding? Log flow</button><button class="btn btn--ghost" data-act="period-over" type="button">My period's over</button>`;
    if (!c.inPeriod) return `<button class="btn" data-act="log" type="button">Log today</button><button class="btn btn--ghost" data-act="start-period" type="button">Period started today</button>`;
    return `<button class="btn" data-act="log" type="button">Log today</button>`;
  }
  /* ---- one-tap logging on Today: mood plus the symptoms people commonly report in this season */
  const PHASE_SYMS = {
    winter: ["cramps", "backache", "fatigue", "headache", "bloating", "nausea"],
    spring: ["headache", "fatigue", "acne", "insomnia", "anxious", "lowmood"],
    summer: ["bloating", "breast", "headache", "cramps", "cravings", "irritable"],
    autumn: ["bloating", "breast", "irritable", "cravings", "insomnia", "lowmood"]
  };
  const symName = id => C.SYMPTOMS.concat(C.ALERT_SYMPTOMS).find(x => x[0] === id) || [id, id, ""];
  function todayLogCard() {
    const L = data.logs[isoNow()] || {}, c = AN.current;
    const ids = (c && PHASE_SYMS[c.phase]) || ["cramps", "headache", "bloating", "fatigue", "irritable", "insomnia"];
    const extra = (L.sym || []).filter(x => !ids.includes(x));
    const moods = C.MOOD.map(m => `<button type="button" class="qm${L.mood === +m[0] ? " on" : ""}" data-act="quick" data-k="mood" data-v="${m[0]}" aria-pressed="${L.mood === +m[0]}"><span class="qm__e">${m[1]}</span><small>${m[2]}</small></button>`).join("");
    const syms = ids.concat(extra).map(id => { const x = symName(id), on = (L.sym || []).includes(id); return `<button type="button" class="chip chip--btn${on ? " on" : ""}" data-act="quick-sym" data-v="${id}" aria-pressed="${on}">${x[2]} ${x[1]}</button>`; }).join("");
    const also = [];
    if (L.flow != null) also.push("Flow: " + C.FLOW[L.flow][1].toLowerCase());
    if (L.energy) also.push("Energy: " + C.ENERGY[L.energy - 1][1].toLowerCase());
    if (L.pain != null) also.push("Pain: " + C.PAIN[L.pain][1].toLowerCase());
    if (L.bbt != null) also.push(cToUnit(L.bbt).toFixed(2) + "°" + data.settings.unit);
    if (L.lh) also.push("LH " + (L.lh === "pos" ? "positive" : "negative"));
    if (L.mucus) also.push("Mucus: " + L.mucus.replace("eggwhite", "egg-white"));
    return `<section class="card" aria-labelledby="ql-h"><div class="row"><h2 class="h3 ih" id="ql-h">${F.ICON.smile}How are you today?</h2><button class="link" data-act="log" type="button">More</button></div>
      <div class="qmoods" role="group" aria-label="Mood">${moods}</div>
      <p class="qlabel">${c && PHASE_SYMS[c.phase] ? "Commonly reported in " + pName(c.phase).toLowerCase() : "Feeling anything?"}</p>
      <div class="chips" role="group" aria-label="Symptoms">${syms}</div>
      ${also.length ? `<div class="chips chips--also">${also.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>` : ""}
      <p class="fine">Tap to log. Tap again to undo. <b>More</b> adds flow, energy, pain, temperature and notes.</p></section>`;
  }

  /* ---- the next seven days */
  function outlookDay(d) {
    const c = AN.current, S = data.settings, up = AN.upcoming, o2n = AN.stats.ovuToNext, pM = Math.max(1, Math.round(AN.stats.periodMean));
    const logged = ((data.logs[A.fromDay(d)] || {}).flow || 0) >= 2;
    const res = { d, phase: null, tag: "", kind: "" };
    const inRange = up.find(u => d >= u.lo && d <= u.hi);
    if (S.mode === "hormonal") {
      res.phase = "steady";
      if (logged || (c.inPeriod && d <= AN.last.start + pM - 1 && d >= TODAY)) { res.phase = "bleed"; res.tag = "Bleed"; res.kind = "period"; }
      else if (inRange && d >= TODAY) { res.tag = inRange.start === d ? "Bleed expected" : "Bleed may start"; res.kind = "pred"; }
      return res;
    }
    if (c.late && d >= TODAY) { res.phase = "autumn"; res.tag = d === TODAY ? "Period due" : ""; res.kind = d === TODAY ? "pred" : ""; return res; }
    let ctx;
    if (d < up[0].start || (c.inPeriod && d <= AN.last.start + pM - 1)) ctx = { start: AN.last.start, bleedEnd: c.inPeriod ? Math.max(c.bleedEnd, AN.last.start + pM - 1) : c.bleedEnd, ovu: c.ovu.day };
    else { const j = d >= up[1].start ? 1 : 0; ctx = { start: up[j].start, bleedEnd: up[j].start + pM - 1, ovu: up[j + 1].start - o2n }; }
    res.phase = A.phaseOf(d, ctx);
    const confirmedPast = ctx.start === AN.last.start && c.ovu.confirmed && d > ctx.ovu;
    if (logged || (res.phase === "winter" && ctx.start === AN.last.start && c.inPeriod)) { res.tag = "Period"; res.kind = "period"; }
    else if (d === ctx.ovu && !confirmedPast) { res.tag = "Ovulation"; res.kind = "ovu"; }
    else if (d >= ctx.ovu - 5 && d < ctx.ovu && !confirmedPast) { res.tag = "Fertile"; res.kind = "fert"; }
    else if (inRange && d >= TODAY && ctx.start !== AN.last.start || (inRange && d >= TODAY && d >= up[0].lo)) { res.tag = inRange.start === d ? "Period expected" : "Period may start"; res.kind = "pred"; }
    return res;
  }
  function outlookCard() {
    if (!AN.current || !AN.upcoming.length || data.settings.mode === "paused") return "";
    const tiles = Array.from({ length: 7 }, (_, i) => outlookDay(TODAY + i)).map((o, i) => {
      const ph = o.phase || "spring";
      return `<li class="out out--${o.kind || "none"}${i === 0 ? " is-now" : ""}" style="--ph:var(--c-${ph === "bleed" ? "winter" : ph === "steady" ? "spring" : ph})" aria-label="${esc(fLong(o.d) + (o.tag ? ": " + o.tag : "") + (o.phase && o.phase !== "steady" && o.phase !== "bleed" ? ", " + pName(o.phase) : ""))}">
        <span class="out__dow">${i === 0 ? "Today" : fmt(o.d, { weekday: "short" })}</span><b class="out__n">${fmt(o.d, { day: "numeric" })}</b>
        <span class="out__ico">${F.PHICON[o.phase] || ""}</span><span class="out__tag">${o.tag || "&nbsp;"}</span></li>`;
    }).join("");
    return `<section class="card card--flush"><div class="row row--pad"><h2 class="h3 ih">${F.ICON.clock}Next 7 days</h2><button class="link" data-tab="calendar" type="button">Calendar</button></div>
      <ol class="outlook" aria-label="Seven day outlook">${tiles}</ol><p class="fine fine--pad">Estimates from your cycle history. Not birth control.</p></section>`;
  }

  function seasonCard(c) {
    const P = C.PHASES[c.phase];
    if (!P.what) return `<section class="card"><h2 class="h3">${P.name}</h2><p>${P.line}</p></section>`;
    return `<section class="card"><h2 class="h3">${P.name} <span class="muted">· ${P.sci}</span></h2>
      <details class="fold" open><summary>What's happening</summary>${P.what.map(t => `<p>${t}</p>`).join("")}<p class="hormones"><b>Hormones.</b> ${P.hormones}</p></details>
      <details class="fold"><summary>Commonly reported</summary><p>${P.common}</p></details>
      <details class="fold"><summary>What may help</summary><ul class="list">${P.help.map(t => `<li>${t}</li>`).join("")}</ul></details>
      <button class="link" data-tab="learn" type="button">Read about all four seasons</button></section>`;
  }
  function learnTeaser() { return `<section class="card card--tight"><h2 class="h3">New to tracking?</h2><p>Read how the four phases work, in plain language with sources.</p><button class="btn btn--ghost" data-tab="learn" type="button">Open Learn</button></section>`; }
  function flagsHTML() {
    if (!AN.flags.length) return "";
    return AN.flags.map(f => { const x = C.FLAGS[f.id](f.data); return `<section class="card flag flag--${f.level}" role="note"><h2 class="h3">${esc(x.t)}</h2><p>${esc(x.b)}</p></section>`; }).join("");
  }

  /* ------------------------------------------------------------ calendar */
  function dayInfo(d) {
    const iso = A.fromDay(d), L = data.logs[iso] || {}, cls = [], lab = [], S = data.settings;
    const bleed = (L.flow || 0) >= 2;
    if (bleed) { cls.push("is-period"); lab.push("period" + (L.flow === 4 ? ", heavy flow" : "")); } else if (L.flow === 1) { cls.push("is-spot"); lab.push("spotting"); }
    const c = AN.current;
    if (AN.hasData && S.mode !== "paused") {
      if (d >= TODAY && !bleed) for (const u of AN.upcoming) if (d >= u.lo && d <= u.hi) { cls.push(d === u.start ? "is-pred is-mid" : "is-pred"); lab.push(d === u.start ? "period expected (best estimate)" : "period may start"); break; }
      if (S.mode === "natural" && c) for (const o of c.ovulations) {
        if (d >= o.day - 5 && d <= o.day) { cls.push("is-fert"); lab.push("estimated fertile window"); }
        else if (!o.confirmed && ((d >= o.lo - 5 && d < o.day - 5) || (d > o.day && d <= o.hi))) { cls.push("is-fert-lo"); lab.push("possible fertile window"); }
        if (d === o.day) { cls.push("is-ovu"); lab.push(o.confirmed ? "ovulation, confirmed by temperature" : o.source === "lh" ? "ovulation expected from LH test" : "estimated ovulation"); }
      }
    }
    if (S.mode === "natural") for (const cy of AN.cycles) if (cy.ovuConfirmed && cy.ovu === d && !cls.includes("is-ovu")) { cls.push("is-ovu"); lab.push("ovulation, confirmed by temperature"); }
    if (d === TODAY) { cls.push("is-today"); lab.unshift("today"); }
    if (L.mood || L.energy || L.pain != null || (L.sym && L.sym.length) || L.note || L.bbt != null || L.lh || L.mucus) cls.push("has-log");
    return { iso, cls, lab };
  }
  function pageCalendar() {
    const { y, m } = ui.month, first = A.toDay(`${y}-${String(m + 1).padStart(2, "0")}-01`);
    const nm = m === 11 ? A.toDay(`${y + 1}-01-01`) : A.toDay(`${y}-${String(m + 2).padStart(2, "0")}-01`), dim = nm - first;
    const sun = data.settings.weekStart === "sun", off = sun ? (A.weekday(first) + 1) % 7 : A.weekday(first);
    const ref = A.toDay("2026-11-09") - (sun ? 1 : 0);
    const dows = Array.from({ length: 7 }, (_, i) => `<span title="${fmt(ref + i, { weekday: "long" })}">${fmt(ref + i, { weekday: "narrow" })}</span>`).join("");
    let cells = "";
    for (let i = 0; i < off; i++) cells += `<li class="day day--blank" aria-hidden="true"></li>`;
    for (let n = 0; n < dim; n++) {
      const d = first + n, inf = dayInfo(d), label = fLong(d) + (inf.lab.length ? ", " + inf.lab.join(", ") : "");
      const inner = `<span class="day__n">${n + 1}</span>`;
      cells += d <= TODAY ? `<li class="day ${inf.cls.join(" ")}"><button type="button" data-act="log" data-day="${inf.iso}" aria-label="${esc(label)}">${inner}</button></li>`
        : `<li class="day ${inf.cls.join(" ")}" aria-label="${esc(label)}"><span>${inner}</span></li>`;
    }
    const natural = data.settings.mode === "natural";
    return sampleBanner() + `<section class="card"><div class="cal__head"><button class="icon" data-act="cal-step" data-step="-1" type="button" aria-label="Previous month">${I.chev(-1)}</button>
      <h1 class="cal__title">${fmt(first, { month: "long", year: "numeric" })}</h1>
      <button class="icon" data-act="cal-step" data-step="1" type="button" aria-label="Next month">${I.chev(1)}</button></div>
      <div class="cal__dow" aria-hidden="true">${dows}</div><ol class="cal">${cells}</ol>
      <ul class="legend"><li><i class="lg lg--period"></i>Period</li><li><i class="lg lg--pred"></i>Likely start</li>${natural ? '<li><i class="lg lg--fert"></i>Fertile window (estimate)</li><li><i class="lg lg--ovu"></i>Ovulation</li>' : ""}<li><i class="lg lg--log"></i>Logged</li></ul>
      <div class="row"><button class="link" data-act="cal-today" type="button">Jump to today</button><span class="fine">Tap a day to log it</span></div></section>`;
  }

  /* ------------------------------------------------------------- insights */
  function lengthChart() {
    const cs = AN.cycles.slice(-12); if (!cs.length) return "";
    const W = 320, H = 170, pl = 30, pr = 6, pt = 16, pb = 26, r = AN.range;
    const lens = cs.map(c => c.length), ymin = Math.min(15, Math.min(...lens) - 2), ymax = Math.max(45, Math.max(...lens) + 3);
    const y = v => pt + (ymax - v) / (ymax - ymin) * (H - pt - pb), bw = (W - pl - pr) / cs.length, w = bw * 0.62;
    const bars = cs.map((c, i) => {
      const x = pl + i * bw + (bw - w) / 2, out = c.length < r.min || c.length > r.max;
      return `<rect x="${x.toFixed(1)}" y="${y(c.length).toFixed(1)}" width="${w.toFixed(1)}" height="${(y(ymin) - y(c.length)).toFixed(1)}" rx="3" class="bar${out ? " bar--out" : ""}"/>
        <text x="${(x + w / 2).toFixed(1)}" y="${(y(c.length) - 4).toFixed(1)}" text-anchor="middle" class="bar__v">${c.length}</text>
        <text x="${(x + w / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="bar__m">${fmt(c.start, { month: "short" })}</text>`;
    }).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of your last ${cs.length} cycle lengths in days: ${lens.join(", ")}. The shaded band is the usual ${r.min} to ${r.max} days.">
      <rect x="${pl}" y="${y(r.max).toFixed(1)}" width="${W - pl - pr}" height="${(y(r.min) - y(r.max)).toFixed(1)}" class="band"/>
      <text x="${pl - 4}" y="${(y(r.max) + 3).toFixed(1)}" text-anchor="end" class="axis">${r.max}</text><text x="${pl - 4}" y="${(y(r.min) + 3).toFixed(1)}" text-anchor="end" class="axis">${r.min}</text>${bars}</svg>`;
  }
  function pageInsights() {
    const st = AN.stats, S = data.settings;
    let h = sampleBanner();
    if (st.n < 1) {
      h += `<section class="card"><h1 class="h2">Your rhythm</h1><p>Almanac needs at least two logged periods to measure a cycle. Once you have them, you'll see your average, how much it varies, and a chart here.</p></section>`;
    } else {
      const r = AN.range, sdT = st.sd != null ? st.sd.toFixed(1) : null, span = st.max - st.min;
      let verdict;
      if (st.n < 3) verdict = `Only ${st.n} cycle${st.n > 1 ? "s" : ""} so far. Three or more makes this meaningful.`;
      else if (span <= 7 && st.min >= r.min && st.max <= r.max) verdict = `Your cycles look regular: ${st.min} to ${st.max} days, inside the usual ${r.min}–${r.max}.`;
      else if (span > 9) verdict = `Your cycles vary by ${span} days. That's wider than the roughly 7 to 9 days considered regular, so predictions are wide.`;
      else verdict = `Your cycles run ${st.min} to ${st.max} days.`;
      h += `<section class="card"><h1 class="h2">Your rhythm</h1><div class="stats">
        <div class="stat"><b>${st.mean.toFixed(1)}</b><span>average cycle (days)</span></div>
        <div class="stat"><b>${st.min}–${st.max}</b><span>shortest to longest</span></div>
        <div class="stat"><b>${st.periodMean ? st.periodMean.toFixed(1) : "–"}</b><span>average period (days)</span></div>
        ${st.ovuToNextN >= 2 ? `<div class="stat"><b>${st.ovuToNext}</b><span>days, ovulation to period</span></div>` : sdT ? `<div class="stat"><b>±${sdT}</b><span>typical swing (days)</span></div>` : ""}</div>
        <p>${verdict}</p>${lengthChart()}
        <p class="fine">For comparison: in a study of over 600,000 logged cycles the average was 29.3 days, and only 13% were exactly 28. Typical adult cycles run ${r.min} to ${r.max} days.</p></section>`;
    }
    h += flagsHTML();
    h += wheelCard() + stripsCard();
    h += patternsCard() + symptomsCard();
    h += `<section class="card"><h2 class="h3">Take it with you</h2>
      <p>A one-page summary of your cycles to bring to an appointment, or your predictions as calendar events.</p>
      <div class="actions"><button class="btn btn--ghost" data-act="summary" type="button">Doctor summary</button>${AN.upcoming.length ? '<button class="btn btn--ghost" data-act="ics" type="button">Add predictions to calendar</button>' : ""}</div>
      <p class="fine">Calendar events can be seen by anyone who shares that calendar. Check before you add them.</p></section>`;
    return h;
  }
  function wheelCard() {
    const c = AN.current; if (!c || data.settings.mode !== "natural") return "";
    const st = AN.last.start, len = Math.max(c.predLen, c.day);
    const fig = F.wheel({ len, bleedEnd: c.bleedEnd - st + 1, ovu: clamp(c.ovu.day - st + 1, c.bleedEnd - st + 4, len - 2), today: c.day, main: "Day " + c.day, sub: pName(c.phase),
      label: `Cycle wheel. Day ${c.day} of about ${len}, ${pName(c.phase)}. Estimated fertile window days ${c.fertile.start - st + 1} to ${c.fertile.end - st + 1}.` });
    return `<section class="card"><h2 class="h3 ih">${F.ICON.chart}This cycle at a glance</h2><div class="wheelbox">${fig}</div>
      <ul class="wlegend"><li><i style="background:var(--c-winter)"></i>Winter</li><li><i style="background:var(--c-spring)"></i>Spring</li><li><i style="background:var(--c-summer)"></i>Summer</li><li><i style="background:var(--c-autumn)"></i>Autumn</li><li><i class="wl-f"></i>Fertile window</li><li><i class="wl-o"></i>Ovulation (est.)</li></ul>
      <p class="fine">Drawn to scale for your own cycle length. The ringed dot is today.</p></section>`;
  }
  function stripsCard() {
    const cs = AN.cycles.slice(-8); if (!cs.length) return "";
    const natural = data.settings.mode === "natural", o2n = AN.stats.ovuToNext, cur = AN.current;
    const max = Math.max(...cs.map(c => c.length), cur ? Math.max(cur.predLen, cur.day) : 0, 28);
    const w = v => (100 * v / max).toFixed(2) + "%";
    const seg = (ph, n) => n > 0 ? `<i style="width:${w(n)};background:var(--c-${ph})"></i>` : "";
    const rows = cs.map(c => {
      let bar, mk = "";
      if (natural) {
        const od = (c.ovu != null ? c.ovu : c.next - o2n) - c.start + 1, b = c.periodLen, od2 = Math.max(od, b + 3);
        bar = seg("winter", b) + seg("spring", od2 - 2 - b) + seg("summer", 3) + seg("autumn", c.length - (od2 + 1));
        mk = `<span class="strip__o${c.ovuConfirmed ? " is-conf" : ""}" style="left:${w(od2 - 0.5)}" title="${c.ovuConfirmed ? "Ovulation confirmed" : "Ovulation estimated"}"></span>`;
      } else bar = seg("winter", c.periodLen) + `<i style="width:${w(c.length - c.periodLen)};background:var(--line)"></i>`;
      return `<li class="strip"><span class="strip__d">${fShort(c.start)}</span><span class="strip__bar">${bar}${mk}</span><span class="strip__n">${c.length}</span></li>`;
    });
    if (cur && natural) {
      const st = AN.last.start, b = cur.bleedEnd - st + 1, od = clamp(cur.ovu.day - st + 1, b + 3, cur.predLen - 2), len = Math.max(cur.predLen, cur.day);
      rows.push(`<li class="strip strip--now"><span class="strip__d">${fShort(st)}</span><span class="strip__bar">${seg("winter", b)}${seg("spring", od - 2 - b)}${seg("summer", 3)}${seg("autumn", len - (od + 1))}<span class="strip__o${cur.ovu.confirmed ? " is-conf" : ""}" style="left:${w(od - 0.5)}"></span><span class="strip__t" style="left:${w(cur.day - 0.5)}"></span></span><span class="strip__n">now</span></li>`);
    }
    return `<section class="card"><h2 class="h3 ih">${F.ICON.chart}Your last ${cs.length} cycles</h2><ul class="strips" aria-label="Each row is one cycle; the number is its length in days">${rows.join("")}</ul>
      <p class="fine">Each bar is one cycle, drawn to the same scale. ${natural ? "A solid dot is ovulation confirmed by your own temperature or LH test; a hollow dot is an estimate. The last row is the current cycle (predicted), and the tick is today." : "The coloured part is your bleeding."}</p></section>`;
  }
  function patternsCard() {
    const logged = Object.values(data.logs).filter(l => l.mood || l.energy || l.pain != null).length;
    const dims = [["mood", "Mood", 5, "higher is better"], ["energy", "Energy", 5, "higher is more"], ["pain", "Pain", 3, "higher is more pain"]];
    const rows = dims.map(([k, name, max, hint]) => {
      const d = PAT.dims[k], ph = ["winter", "spring", "summer", "autumn"].filter(p => d[p]);
      if (!ph.length) return "";
      return `<div class="pdim"><h3 class="h4">${name} <span class="muted">${hint}</span></h3>${ph.map(p => `<div class="prow"><span class="prow__l">${pName(p)}</span><span class="prow__bar"><i style="width:${Math.round(100 * d[p].mean / max)}%;background:var(--c-${p})"></i></span><span class="prow__v">${d[p].mean.toFixed(1)} <small>${d[p].n} days</small></span></div>`).join("")}</div>`;
    }).join("");
    const sent = PAT.statements.map(s => `<li>Your <b>${s.dim}</b> score averages highest in <b>${pName(s.hi)}</b> (${s.hiMean.toFixed(1)}) and lowest in <b>${pName(s.lo)}</b> (${s.loMean.toFixed(1)}).</li>`).join("");
    return `<section class="card"><h2 class="h3">Your patterns</h2>${rows ? (sent ? `<ul class="list">${sent}</ul>` : `<p>No clear pattern yet. That's useful too: it can simply mean your mood and energy don't swing much with your cycle.</p>`) + rows + `<p class="fine">Averages use only days you logged. Almanac only states a pattern when two phases each have at least 4 logged days and the gap is meaningful. Small samples can mislead.</p>` : `<p>Log mood, energy or pain on a few days each cycle and Almanac will show how they move with your phases. You've logged ${logged} day${logged === 1 ? "" : "s"} so far. A first look appears after about two cycles.</p>`}</section>`;
  }
  function symptomsCard() {
    const ph = ["winter", "spring", "summer", "autumn"].filter(p => PAT.symptoms[p] && PAT.symptoms[p].length);
    if (!ph.length) return "";
    const name = id => (C.SYMPTOMS.concat(C.ALERT_SYMPTOMS).find(x => x[0] === id) || [id, id])[1];
    return `<section class="card"><h2 class="h3">Symptoms by season</h2>${ph.map(p => `<div class="srow"><span class="dot" style="background:var(--c-${p})"></span><b>${pName(p)}</b><span>${PAT.symptoms[p].map(s => `${esc(name(s.id))} ${s.pct}%`).join(" · ")}</span></div>`).join("")}<p class="fine">Share of the days you logged in each phase.</p></section>`;
  }

  /* ---------------------------------------------------------------- learn */
  const GUIDE_SUB = { temp: "Confirms ovulation after the fact", lh: "Predicts ovulation about a day ahead", mucus: "Your body's own fertility signal", products: "Tampons, cups, pads and toxic shock signs", pms: "PMS, PMDD and when to get help", bc: "What hormonal methods do to bleeding" };
  const mucusScale = () => `<ol class="mscale">${C.MUCUS_INFO.map(m => `<li><span class="mscale__ico">${F.MUCUS_GLYPH[m[0]]}</span><span><b>${m[1]}</b><small>${m[2]}</small></span><span class="mscale__bar" role="img" aria-label="Fertility ${m[3]} of 5"><i style="width:${m[3] * 20}%"></i></span></li>`).join("")}</ol>`;
  const figBox = (svg, cap) => `<figure class="figbox">${svg}<figcaption>${cap}</figcaption></figure>`;
  function guideCard(g) {
    const fig = g.fig === "bbt" ? figBox(F.bbt(), "Example temperature chart with made-up data. A sustained rise after ovulation confirms it happened.")
      : g.fig === "lh" ? figBox(F.lhStrips(), "How an ovulation test typically looks as the LH surge arrives.") : g.fig === "mucus" ? mucusScale() : "";
    return `<details class="card lsec fold fold--big" id="guide-${g.id}"><summary><span class="ph-ico ph-ico--g">${F.ICON[g.ico]}</span><span><b>${g.title}</b><small>${GUIDE_SUB[g.id] || ""}</small></span></summary>
      <p>${g.intro}</p>${fig}<ol class="steps">${g.steps.map(t => `<li>${t}</li>`).join("")}</ol><ul class="notes">${g.notes.map(t => `<li>${t}</li>`).join("")}</ul></details>`;
  }
  function pageLearn() {
    const ih = (ico, t) => `<h2 class="h3 ih">${F.ICON[ico] || ""}${t}</h2>`;
    const seasons = ["winter", "spring", "summer", "autumn"].map(k => { const P = C.PHASES[k];
      return `<details class="card lsec fold fold--big" id="season-${k}" style="--ph:var(--c-${k})"><summary><span class="ph-ico">${F.PHICON[k]}</span><span><b>${P.name}</b><small>${P.sci}</small></span></summary>
        <figure class="anat"><div class="anat__fig">${F.anatomy(k)}</div><figcaption>${C.ANATOMY[k]} <small>Simplified diagram.</small></figcaption></figure>
        <p class="muted">${P.days}</p>${P.what.map(t => `<p>${t}</p>`).join("")}<p class="hormones"><b>Hormones.</b> ${P.hormones}</p>
        <h3 class="h4">Commonly reported</h3><p>${P.common}</p><h3 class="h4">What may help</h3><ul class="list">${P.help.map(t => `<li>${t}</li>`).join("")}</ul></details>`; }).join("");
    const jumps = [["sec-charts", "Pictures"], ["sec-seasons", "Seasons"], ["sec-howto", "How-to"], ["sec-safety", "Safety"], ["sec-life", "Life stages"], ["sec-myths", "Myths"], ["sec-glossary", "Glossary"]]
      .map(j => `<button type="button" class="chip chip--btn" data-act="jump" data-to="${j[0]}">${j[1]}</button>`).join("");
    const wheel = F.wheel({ len: 28, bleedEnd: 5, ovu: 15, today: null, main: "28", sub: "day example", label: "An example 28-day cycle wheel: bleeding on days 1 to 5, ovulation around day 15, and a fertile window from day 10 to 15." });
    return `<section class="card"><h1 class="h2">Learn</h1><p>A cycle is counted from the first day of one period to the day before the next. For adults it's usually <b>21 to 35 days</b>; for teenagers up to <b>45</b>. The four seasons are our way of picturing the four phases. The science underneath is the standard one, and every season shows its scientific name.</p></section>
      <section class="card card--tight"><label class="searchbox">${F.ICON.search}<span class="sr">Search Learn</span><input id="learn-q" type="search" placeholder="Search: ovulation, cramps, tampons…" autocomplete="off" enterkeyhint="search"></label>
        <div class="jumps" role="group" aria-label="Jump to a section">${jumps}</div><p class="fine" id="learn-count" aria-live="polite"></p></section>
      <h2 class="lhead" id="sec-charts">${F.ICON.chart}The cycle in pictures</h2>
      <section class="card lsec">${ih("chart", "The cycle wheel")}<div class="wheelbox">${wheel}</div>
        <ul class="wlegend"><li><i style="background:var(--c-winter)"></i>Winter · menstrual</li><li><i style="background:var(--c-spring)"></i>Spring · follicular</li><li><i style="background:var(--c-summer)"></i>Summer · ovulation</li><li><i style="background:var(--c-autumn)"></i>Autumn · luteal</li><li><i class="wl-f"></i>Fertile window</li></ul>
        <p class="fine">An example 28-day cycle. Yours will differ. Ovulation sits about 14 days before your next period, not always on day 14.</p></section>
      <section class="card lsec">${ih("chart", "Hormones across a cycle")}${F.hormones()}
        <ul class="list"><li><b>Estrogen</b> climbs through spring, peaks just before ovulation, then has a smaller rise in autumn.</li><li><b>LH</b> spikes about a day before ovulation. This is what ovulation tests detect.</li><li><b>Progesterone</b> stays low until ovulation, peaks about a week later, then falls before your period.</li><li><b>FSH</b> is highest early in the cycle, with a smaller rise at mid-cycle.</li></ul>
        <p class="fine">Schematic shapes from published reference ranges. They show the pattern, not anyone's actual levels.</p></section>
      <h2 class="lhead" id="sec-seasons">${F.PHICON.spring}The four seasons</h2>${seasons}
      <section class="card lsec">${ih("shield", "The fertile window")}<p>${C.FERTILE_FACT}</p><p class="fine">Almanac's fertile window is an estimate. It is not contraception.</p></section>
      <h2 class="lhead" id="sec-howto">${F.ICON.thermo}How-to guides</h2>${C.GUIDES.filter(g => ["temp", "lh", "mucus"].includes(g.id)).map(guideCard).join("")}
      <h2 class="lhead" id="sec-safety">${F.ICON.shield}Safety and wellbeing</h2>${C.GUIDES.filter(g => ["products", "pms", "bc"].includes(g.id)).map(guideCard).join("")}
      <section class="card lsec" id="sec-life">${ih("life", "Life stages")}${C.LIFE.map(l => `<div class="item" data-item><h3 class="h4">${l[0]}</h3><p>${l[1]}</p></div>`).join("")}</section>
      <section class="card lsec" id="sec-myths">${ih("alert", "Myths and facts")}${C.MYTHS.map(m => `<details class="fold"><summary>${m[0]}</summary><p>${m[1]}</p></details>`).join("")}</section>
      <section class="card lsec">${ih("alert", "When to see a doctor")}<ul class="list">${C.SEE_DOCTOR.map(t => `<li>${t}</li>`).join("")}</ul><h3 class="h4">Get urgent care for</h3><ul class="list">${C.URGENT.map(t => `<li>${t}</li>`).join("")}</ul></section>
      <section class="card lsec">${ih("book", "How Almanac works out its numbers")}${C.HOW.map(h => `<details class="fold"><summary>${h[0]}</summary><p>${h[1]}</p></details>`).join("")}</section>
      <section class="card lsec" id="sec-glossary">${ih("glossary", "Glossary")}<dl class="gloss">${C.GLOSSARY.map(g => `<div data-item><dt>${g[0]}</dt><dd>${g[1]}</dd></div>`).join("")}</dl></section>
      <section class="card lsec">${ih("book", "Sources")}<ul class="list list--small">${C.SOURCES.concat(C.MORE_SOURCES).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="fine"><b>Almanac is an information tool, not medical advice.</b> It can't diagnose anything and it isn't a contraceptive. If something worries you, or your cycle changes, talk to a clinician.</p></section>
      <p class="muted nomatch" id="learn-none" hidden>Nothing matches that. Try a simpler word, like "pain" or "ovulation".</p>`;
  }
  function filterLearn(raw) {
    const q = raw.trim().toLowerCase(); let shown = 0;
    $$("#page .lhead").forEach(h => (h.hidden = !!q));
    $$("#page .lsec").forEach(sec => {
      const hit = !q || sec.textContent.toLowerCase().includes(q); sec.hidden = !hit; if (!hit) return; shown++;
      if (q && sec.tagName === "DETAILS") sec.open = true;
      $$(".fold, [data-item]", sec).forEach(it => { const m = !q || it.textContent.toLowerCase().includes(q); it.hidden = !m; if (q && m && it.tagName === "DETAILS") it.open = true; });
    });
    $("#learn-none").hidden = !(q && shown === 0);
    $("#learn-count").textContent = q ? (shown ? shown + " section" + (shown === 1 ? "" : "s") + " match" + (shown === 1 ? "es" : "") : "") : "";
  }

  /* ============================================================== SHEETS */
  const sheet = $("#sheet");
  function openSheet(kind, html, cls) {
    sheet.className = "sheet " + (cls || ""); sheet.dataset.kind = kind; sheet.innerHTML = html;
    if (!sheet.open) sheet.showModal();
    const b = $(".sheet__body", sheet); if (b) b.scrollTop = 0;
  }
  sheet.addEventListener("close", () => { if (sheet.open) return;   /* a new sheet was opened in the meantime */ sheet.innerHTML = ""; delete sheet.dataset.kind; render(); });
  sheet.addEventListener("cancel", e => { if (sheet.dataset.kind === "onboard") e.preventDefault(); });
  sheet.addEventListener("click", e => { if (e.target === sheet && sheet.dataset.kind !== "onboard") sheet.close(); });
  const frame = (title, body, foot) => `<header class="sheet__head"><div class="sheet__title"><h2 id="sh-t">${title}</h2></div><button class="icon" data-act="close" type="button" aria-label="Close">${I.x}</button></header><div class="sheet__body">${body}</div>${foot ? `<footer class="sheet__foot">${foot}</footer>` : ""}`;

  /* ---- the daily log */
  const seg = (k, opts, name) => `<div class="seg" role="radiogroup" aria-label="${name}">${opts.map(o => `<button type="button" role="radio" class="seg__b" data-act="set" data-k="${k}" data-v="${o.v}" aria-checked="false">${o.html}</button>`).join("")}</div>`;
  function logHTML(iso) {
    const d = A.toDay(iso), natural = data.settings.mode === "natural", L = data.logs[iso] || {};
    const flow = seg("flow", C.FLOW.map(f => ({ v: f[0], html: `${F.drops([0, 1, 1, 2, 3][+f[0]])}<span class="fl-l">${f[1]}</span>` })), "Flow");
    const mood = seg("mood", C.MOOD.map(f => ({ v: f[0], html: `<span class="em">${f[1]}</span><small>${f[2]}</small>` })), "Mood");
    const energy = seg("energy", C.ENERGY.map(f => ({ v: f[0], html: f[1] })), "Energy");
    const pain = seg("pain", C.PAIN.map(f => ({ v: f[0], html: f[1] })), "Pain");
    const chip = (id, label, alert, em) => `<button type="button" class="chip chip--btn${alert ? " chip--alert" : ""}" data-act="sym" data-v="${id}" aria-pressed="false">${em || ""} ${label}</button>`;
    const fert = natural ? `<details class="fold adv" ${L.lh || L.mucus || L.bbt != null ? "open" : ""}><summary>Fertility signs <small>optional, but they make predictions much sharper</small></summary>
      <fieldset><legend>${F.ICON.strip}LH (ovulation) test</legend>${seg("lh", [{ v: "neg", html: "Negative" }, { v: "pos", html: "Positive" }], "LH test")}</fieldset>
      <fieldset><legend>${F.ICON.mucus}Cervical mucus</legend>${seg("mucus", C.MUCUS.map(f => ({ v: f[0], html: f[1] })), "Cervical mucus")}</fieldset>
      <label class="field"><span>${F.ICON.thermo}Morning temperature <small>(°${data.settings.unit}, before getting up)</small></span><input type="number" inputmode="decimal" step="0.01" id="in-bbt" placeholder="${data.settings.unit === "F" ? "97.70" : "36.50"}" value="${L.bbt != null ? cToUnit(L.bbt).toFixed(2) : ""}"></label></details>` : "";
    return `<header class="sheet__head sheet__head--day"><button class="icon" data-act="day-step" data-step="-1" type="button" aria-label="Previous day">${I.chev(-1)}</button>
      <div class="sheet__title"><h2 id="sh-t">${d === TODAY ? "Today" : fmt(d, { weekday: "long" })}</h2><p class="sheet__sub" id="sh-sub"></p></div>
      <button class="icon" data-act="day-step" data-step="1" type="button" aria-label="Next day" ${d >= TODAY ? "disabled" : ""}>${I.chev(1)}</button></header>
      <div class="sheet__body">
        <fieldset><legend>${F.ICON.drop}Flow</legend>${flow}</fieldset>
        <fieldset><legend>${F.ICON.smile}Mood</legend>${mood}</fieldset>
        <fieldset><legend>${F.ICON.bolt}Energy</legend>${energy}</fieldset>
        <fieldset><legend>${F.ICON.pain}Pain</legend>${pain}</fieldset>
        <fieldset><legend>${F.ICON.plus}Symptoms</legend><div class="chips">${C.SYMPTOMS.map(s => chip(s[0], s[1], false, s[2])).join("")}</div>
          <div class="chips chips--alert">${C.ALERT_SYMPTOMS.map(s => chip(s[0], s[1], true, s[2])).join("")}</div></fieldset>
        ${fert}
        <label class="field"><span>${F.ICON.note}Note</span><textarea id="in-note" rows="2" maxlength="500" placeholder="Anything worth remembering">${esc(L.note || "")}</textarea></label>
        <button class="link link--danger" data-act="clear-day" type="button">Clear this day</button>
      </div><footer class="sheet__foot"><button class="btn" data-act="close" type="button">Done</button></footer>`;
  }
  function syncLog() {
    const iso = ui.day, L = data.logs[iso] || {};
    $$("[data-act='set']", sheet).forEach(b => { const on = String(L[b.dataset.k]) === b.dataset.v; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    $$("[data-act='sym']", sheet).forEach(b => { const on = (L.sym || []).includes(b.dataset.v); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    const cd = cycleDayOf(A.toDay(iso)), sub = $("#sh-sub", sheet);
    if (sub) sub.textContent = fmt(A.toDay(iso), { day: "numeric", month: "long", year: "numeric" }) + (cd && cd < 120 ? " · cycle day " + cd : "");
  }
  function openLog(iso) { ui.day = iso; openSheet("log", logHTML(iso)); syncLog(); }

  /* ---- reading the landscape */
  function hillsSheet() {
    openSheet("info", frame("Reading the landscape", `
      <p>The scene above is drawn from your cycle, and it changes as the day goes on.</p>
      <ul class="list"><li><b>The two hills are your hormones.</b> The front hill is <b>estrogen</b>, which climbs through spring and peaks just before ovulation. The back hill is <b>progesterone</b>, which stays low until ovulation and peaks about a week later. They're typical shapes, stretched to your cycle length. They are <b>not</b> measurements of your own levels.</li>
      <li><b>The lantern</b> marks today on that landscape.</li>
      <li><b>The season</b> follows your phase: winter for your period, spring while follicles grow, summer around ovulation, autumn through the luteal phase.</li>
      <li><b>The sky</b> follows the real time where you are.</li></ul>
      <p class="fine">If you use hormonal contraception, or have predictions paused, the hills are gentle and general, because the typical hormone pattern doesn't apply.</p>`, `<button class="btn" data-act="close" type="button">Got it</button>`));
  }

  /* ---- settings */
  let deferredInstall = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; });
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function settingsSheet() {
    const S = data.settings;
    const radio = (name, val, cur, title, sub) => `<label class="opt"><input type="radio" name="${name}" value="${val}" ${cur === val ? "checked" : ""} data-in="${name}"><span><b>${title}</b><small>${sub}</small></span></label>`;
    const back = S.lastBackup ? "Last backup: " + fLong(S.lastBackup) : "You haven't made a backup yet.";
    openSheet("settings", frame("Settings", `
      <section class="set"><h3 class="h4">Your cycle</h3>
        ${radio("mode", "natural", S.mode, "Natural cycle", "Full phase, ovulation and fertile-window estimates.")}
        ${radio("mode", "hormonal", S.mode, "Hormonal contraception", "Pill, ring, patch, implant, injection or hormonal IUD. Many methods change or stop ovulation, so Almanac tracks bleeding and symptoms and leaves out phases and fertility estimates.")}
        ${radio("mode", "paused", S.mode, "Pause predictions", "Pregnant, postpartum, or your cycle isn't following a usual pattern. You can still log.")}
        <label class="opt opt--check"><input type="checkbox" data-in="age" ${S.age === "teen" ? "checked" : ""}><span><b>I'm under 18</b><small>Teen cycles run longer (21–45 days is typical) and settle during the first few years.</small></span></label></section>
      <section class="set"><h3 class="h4">Starting guesses</h3>
        <div class="two"><label class="field"><span>Usual cycle <small>days</small></span><input type="number" inputmode="numeric" min="15" max="60" data-in="defaultCycle" placeholder="not sure" value="${S.defaultCycle || ""}"></label>
        <label class="field"><span>Usual period <small>days</small></span><input type="number" inputmode="numeric" min="1" max="12" data-in="defaultPeriod" value="${S.defaultPeriod || 5}"></label></div>
        <p class="fine">Used only until Almanac has logged cycles of its own to learn from.</p></section>
      <section class="set"><h3 class="h4">Display</h3>
        <div class="two"><label class="field"><span>Temperature</span><select data-in="unit"><option value="C" ${S.unit === "C" ? "selected" : ""}>°C</option><option value="F" ${S.unit === "F" ? "selected" : ""}>°F</option></select></label>
        <label class="field"><span>Week starts</span><select data-in="weekStart"><option value="mon" ${S.weekStart === "mon" ? "selected" : ""}>Monday</option><option value="sun" ${S.weekStart === "sun" ? "selected" : ""}>Sunday</option></select></label></div></section>
      <section class="set"><h3 class="h4">Your data</h3>
        <p><b>It stays on this device.</b> There's no account and no server, and nothing is sent anywhere. The site is hosted as plain files, so whoever hosts it can see that a page was loaded (like any website), but never what you log.</p>
        <p class="fine">Heads up: browsers can clear saved site data. Safari may remove it if you don't visit for about a week unless the app is added to your Home Screen. A backup keeps you safe. ${back}</p>
        <div class="actions"><button class="btn btn--ghost" data-act="export" type="button">Download backup</button><button class="btn btn--ghost" data-act="import" type="button">Restore backup</button></div>
        <input type="file" id="in-file" accept="application/json,.json" hidden>
        ${deferredInstall ? '<div class="actions"><button class="btn btn--ghost" data-act="install" type="button">Install as an app</button></div>' : isiOS ? '<p class="fine">To install on iPhone or iPad: tap Share in Safari, then <b>Add to Home Screen</b>.</p>' : ""}
        <button class="link link--danger" data-act="erase" type="button">Erase everything on this device</button></section>
      <section class="set"><h3 class="h4">About</h3><p class="fine">Almanac is an information tool, not medical advice, and not contraception. Numbers and thresholds come from ACOG, Mayo Clinic, the NHS and the studies listed under Learn → Sources. Fonts: Fraunces and Figtree (SIL Open Font License).</p></section>`, `<button class="btn" data-act="close" type="button">Done</button>`));
  }
  function onInput(e) {
    const t = e.target, k = t.dataset.in, S = data.settings; if (!k) return;
    if (k === "mode") S.mode = t.value;
    else if (k === "age") S.age = t.checked ? "teen" : "adult";
    else if (k === "defaultCycle") { const v = parseInt(t.value, 10); S.defaultCycle = v >= 15 && v <= 60 ? v : null; }
    else if (k === "defaultPeriod") { const v = parseInt(t.value, 10); S.defaultPeriod = v >= 1 && v <= 12 ? v : 5; }
    else if (k === "unit") S.unit = t.value;
    else if (k === "weekStart") S.weekStart = t.value;
    save(); recompute();
  }

  /* ---- onboarding */
  function obHTML() {
    const o = ui.ob, today = isoNow();
    if (o.step === 0) return `<div class="ob"><div class="ob__art" aria-hidden="true">${SC.render({ hour: 17.2, phase: "spring", progress: .6, todayX: .42, curves: A.curves(29, 15), label: "" })}</div>
      <div class="ob__body"><p class="eyebrow">Almanac</p><h1 class="ob__h">Your cycle, season by season.</h1>
      <p>A calm, accurate way to understand your period, your fertile window and your own patterns, drawn as a landscape that follows your cycle and the time of day.</p>
      <ul class="ticks"><li><b>Private by design.</b> No account, no server. Everything stays on this device.</li><li><b>Honest about uncertainty.</b> Predictions come as ranges, and it tells you when it's only guessing.</li><li><b>Real facts, with sources.</b> Every number traces back to ACOG, Mayo Clinic or published research.</li></ul>
      <div class="actions actions--col"><button class="btn" data-act="ob-next" type="button">Set up in 30 seconds</button><button class="btn btn--ghost" data-act="ob-sample" type="button">Look around with example data</button></div></div></div>`;
    if (o.step === 1) return `<div class="ob ob--form"><div class="ob__body"><p class="eyebrow">Step 1 of 2</p><h1 class="ob__h">When did your last period start?</h1>
      <p>The first day of real bleeding. Your best guess is fine, and you can fix it later.</p>
      <label class="field"><span>First day of your last period</span><input type="date" id="ob-date" max="${today}" value="${o.date || ""}"></label>
      <label class="field"><span>How many days does a period usually last?</span><input type="number" id="ob-plen" inputmode="numeric" min="1" max="12" value="${o.plen}"></label>
      <label class="field"><span>Usual cycle length <small>in days, if you know. Otherwise leave blank</small></span><input type="number" id="ob-clen" inputmode="numeric" min="15" max="60" placeholder="not sure" value="${o.clen}"></label>
      <div class="actions actions--col"><button class="btn" data-act="ob-next" type="button">Continue</button><button class="link" data-act="ob-skipdate" type="button">I don't remember. I'll start fresh</button></div></div></div>`;
    return `<div class="ob ob--form"><div class="ob__body"><p class="eyebrow">Step 2 of 2</p><h1 class="ob__h">One last thing</h1>
      <fieldset class="opts"><legend>Which describes you best?</legend>
      <label class="opt"><input type="radio" name="ob-mode" value="natural" ${o.mode === "natural" ? "checked" : ""}><span><b>Natural cycle</b><small>No hormonal contraception. You get full estimates.</small></span></label>
      <label class="opt"><input type="radio" name="ob-mode" value="hormonal" ${o.mode === "hormonal" ? "checked" : ""}><span><b>Hormonal contraception</b><small>Almanac tracks bleeding and symptoms, but leaves out phases and fertile windows, because many methods change ovulation.</small></span></label>
      <label class="opt"><input type="radio" name="ob-mode" value="paused" ${o.mode === "paused" ? "checked" : ""}><span><b>Just logging for now</b><small>Pregnant, postpartum, or irregular. No predictions.</small></span></label></fieldset>
      <label class="opt opt--check"><input type="checkbox" id="ob-teen" ${o.teen ? "checked" : ""}><span><b>I'm under 18</b><small>Adjusts the ranges Almanac compares you to.</small></span></label>
      <div class="actions actions--col"><button class="btn" data-act="ob-finish" type="button">Open my Almanac</button><button class="link" data-act="ob-back" type="button">Back</button></div></div></div>`;
  }
  function openOnboarding() { ui.ob = { step: 0, date: "", plen: 5, clen: "", mode: "natural", teen: false }; openSheet("onboard", obHTML(), "sheet--full"); }
  function obRead() {
    const o = ui.ob, g = id => $("#" + id, sheet);
    if (g("ob-date")) { o.date = g("ob-date").value; o.plen = clamp(parseInt(g("ob-plen").value, 10) || 5, 1, 12); o.clen = g("ob-clen").value; }
    const m = $("input[name='ob-mode']:checked", sheet); if (m) o.mode = m.value;
    if (g("ob-teen")) o.teen = g("ob-teen").checked;
  }
  function obFinish() {
    obRead(); const o = ui.ob, S = data.settings;
    S.mode = o.mode; S.age = o.teen ? "teen" : "adult"; S.defaultPeriod = o.plen;
    const c = parseInt(o.clen, 10); S.defaultCycle = c >= 15 && c <= 60 ? c : null; S.onboarded = true;
    if (o.date) { const st = A.toDay(o.date); const pat = [3, 4, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2]; for (let i = 0; i < o.plen; i++) if (st + i <= TODAY) data.logs[A.fromDay(st + i)] = { flow: pat[i] || 2 }; }
    save(); try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* optional */ }
    sheet.close(); toast("All set. Welcome to Almanac.");
  }

  /* ------------------------------------------------- backup / import / erase */
  function download(name, type, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  function exportData() { data.settings.lastBackup = TODAY; save(); download("almanac-backup-" + isoNow() + ".json", "application/json", JSON.stringify(data, null, 1)); toast("Backup downloaded."); }
  function sanitizeLogs(src) {
    const out = {}, iso = /^\d{4}-\d{2}-\d{2}$/, ok = (v, a, b) => Number.isInteger(v) && v >= a && v <= b, symIds = C.SYMPTOMS.concat(C.ALERT_SYMPTOMS).map(x => x[0]);
    for (const k of Object.keys(src || {})) {
      if (!iso.test(k) || isNaN(A.toDay(k))) continue; const s = src[k] || {}, l = {};
      if (ok(s.flow, 0, 4)) l.flow = s.flow; if (ok(s.mood, 1, 5)) l.mood = s.mood; if (ok(s.energy, 1, 5)) l.energy = s.energy; if (ok(s.pain, 0, 3)) l.pain = s.pain;
      if (Array.isArray(s.sym)) { const y = s.sym.filter(x => symIds.includes(x)); if (y.length) l.sym = y; }
      if (s.lh === "pos" || s.lh === "neg") l.lh = s.lh; if (C.MUCUS.some(m => m[0] === s.mucus)) l.mucus = s.mucus;
      if (typeof s.bbt === "number" && s.bbt >= 34 && s.bbt <= 42) l.bbt = s.bbt; if (typeof s.note === "string" && s.note) l.note = s.note.slice(0, 500);
      if (Object.keys(l).length) out[k] = l;
    }
    return out;
  }
  function importFile(file) {
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (!d || typeof d.logs !== "object") throw 0; const logs = sanitizeLogs(d.logs); data.logs = logs; if (d.settings) { const f = fresh().settings, s = d.settings; data.settings = Object.assign(f, { mode: ["natural", "hormonal", "paused"].includes(s.mode) ? s.mode : "natural", age: s.age === "teen" ? "teen" : "adult", unit: s.unit === "F" ? "F" : "C", weekStart: s.weekStart === "sun" ? "sun" : "mon", defaultCycle: Number.isInteger(s.defaultCycle) ? s.defaultCycle : null, defaultPeriod: Number.isInteger(s.defaultPeriod) ? s.defaultPeriod : 5, onboarded: true }); } data.sample = false; save(); recompute(); toast("Restored " + Object.keys(logs).length + " logged days."); sheet.close(); } catch (e) { toast("That file doesn't look like an Almanac backup."); } };
    r.readAsText(file);
  }
  function icsText() {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", cmp = n => A.fromDay(n).replace(/-/g, "");
    const ev = AN.upcoming.map(u => ["BEGIN:VEVENT", `UID:almanac-${u.start}@device`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${cmp(u.start)}`, `DTEND;VALUE=DATE:${cmp(u.start + 1)}`, "SUMMARY:Period expected (estimate)", `DESCRIPTION:Best estimate only. Likely between ${fShort(u.lo)} and ${fShort(u.hi)}.`, "END:VEVENT"].join("\r\n"));
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Almanac//EN", "CALSCALE:GREGORIAN"].concat(ev, ["END:VCALENDAR"]).join("\r\n");
  }

  /* ----------------------------------------------------------- doctor summary */
  function printHTML() {
    const st = AN.stats, rows = AN.cycles.slice(-12).reverse().map(c => `<tr><td>${fmt(c.start, { day: "numeric", month: "short", year: "numeric" })}</td><td>${c.length}</td><td>${c.periodLen}</td><td>${c.heavyDays || ""}</td></tr>`).join("");
    const flags = AN.flags.map(f => { const x = C.FLAGS[f.id](f.data); return `<li><b>${esc(x.t)}.</b> ${esc(x.b)}</li>`; }).join("");
    const notes = Object.keys(data.logs).filter(k => data.logs[k].note).sort().slice(-12).map(k => `<li>${fmt(A.toDay(k), { day: "numeric", month: "short" })}: ${esc(data.logs[k].note)}</li>`).join("");
    const sym = ["winter", "spring", "summer", "autumn"].filter(p => PAT.symptoms[p]).map(p => `<li><b>${C.PHASES[p].sci}:</b> ${PAT.symptoms[p].map(s => esc(((C.SYMPTOMS.concat(C.ALERT_SYMPTOMS).find(x => x[0] === s.id) || [0, s.id])[1])) + " " + s.pct + "%").join(", ")}</li>`).join("");
    return `<article class="pr"><h1>Cycle summary</h1><p class="pr__sub">Prepared ${fmt(TODAY, { day: "numeric", month: "long", year: "numeric" })} from the person's own log in Almanac. ${data.sample ? "<b>EXAMPLE DATA, NOT A REAL PERSON.</b>" : ""}</p>
      <table class="pr__kv"><tr><td>Cycles logged</td><td>${st.n}</td></tr><tr><td>Average cycle</td><td>${st.mean ? st.mean.toFixed(1) + " days (range " + st.min + "–" + st.max + ")" : "not enough data"}</td></tr><tr><td>Average period</td><td>${st.periodN ? st.periodMean.toFixed(1) + " days" : "not enough data"}</td></tr><tr><td>Last period started</td><td>${AN.last ? fmt(AN.last.start, { day: "numeric", month: "long", year: "numeric" }) : "not logged"}</td></tr><tr><td>Contraception setting</td><td>${{ natural: "None (natural cycle)", hormonal: "Hormonal contraception", paused: "Predictions paused" }[data.settings.mode]}</td></tr></table>
      <h2>Recent cycles</h2><table class="pr__t"><thead><tr><th>Period started</th><th>Cycle length (days)</th><th>Period length (days)</th><th>Heavy-flow days</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No complete cycles yet</td></tr>'}</tbody></table>
      ${flags ? `<h2>Things worth discussing</h2><ul>${flags}</ul>` : ""}${sym ? `<h2>Symptoms by phase (share of logged days)</h2><ul>${sym}</ul>` : ""}${notes ? `<h2>Notes</h2><ul>${notes}</ul>` : ""}
      <p class="pr__fine">Generated on the person's device. Self-reported, and not a medical record or diagnosis. Reference ranges: ACOG (adult cycle 21–35 days, adolescent up to 45; period 2–7 days).</p></article>`;
  }

  /* ============================================================ THE SCENE */
  let fx = null, lastScene = 0;
  function sceneState() {
    const c = AN.current, S = data.settings, hour = NOW.getHours() + NOW.getMinutes() / 60;
    const base = { hour, clock: Date.now() / 1000, curves: null, todayX: 0.5, progress: 0.5, phase: "steady", label: "A gentle landscape" };
    if (!c || S.mode === "paused") return base;
    if (S.mode === "hormonal") return Object.assign(base, { phase: c.phase, todayX: clamp((c.day - 1) / Math.max(c.predLen, c.day), 0, 1), label: "A landscape at " + (c.phase === "bleed" ? "winter" : "spring") });
    const curves = A.curves(c.predLen, c.ovu.day - AN.last.start);
    const span = Math.max(c.predLen, c.day);
    return { hour, clock: base.clock, curves: span === c.predLen ? curves : A.curves(span, c.ovu.day - AN.last.start), todayX: clamp((c.day - 0.5) / span, 0, 1), progress: c.progress, phase: c.phase,
      label: `${pName(c.phase)}: ${C.PHASES[c.phase].sci.toLowerCase()}. Two hills show typical estrogen and progesterone. A lantern marks today, day ${c.day}.` };
  }
  function fxKind(st) {
    const nk = SC.night(st.hour);
    return { winter: "snow", bleed: "snow", spring: "petal", autumn: "leaf", summer: nk > .3 ? "firefly" : "", steady: nk > .3 ? "firefly" : "" }[st.phase] || "";
  }
  function updateScene() {
    const st = sceneState(); lastScene = Date.now();
    $("#scene").innerHTML = SC.render(st);
    const top = SC.sky(st.hour)[0], tc = $("#theme-color"); if (tc) tc.content = top;
    if (!fx) { fx = SC.particles($("#fx"), () => ({ kind: fxKind(sceneState()) })); fx.start(); } else fx.refresh();
  }

  /* ================================================================= RENDER */
  const PHASE_ACCENT = { winter: "winter", spring: "spring", summer: "summer", autumn: "autumn", bleed: "winter", steady: "spring" };
  function render() {
    recompute();
    document.body.dataset.view = ui.tab;
    document.body.dataset.phase = AN.current ? PHASE_ACCENT[AN.current.phase] || "spring" : "spring";
    $("#page").innerHTML = ({ today: pageToday, calendar: pageCalendar, insights: pageInsights, learn: pageLearn })[ui.tab]();
    $$(".dock__btn").forEach(b => b.setAttribute("aria-current", b.dataset.tab === ui.tab ? "page" : "false"));
    updateScene();
  }
  function go(tab) { ui.tab = tab; render(); window.scrollTo(0, 0); $("#page").focus({ preventScroll: true }); if (fx) requestAnimationFrame(() => fx.fit()); }

  /* ================================================================= EVENTS */
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-act],[data-tab]"); if (!t || t === document.body) return;   // body must never count as a button
    if (t.dataset.tab && !t.dataset.act) return go(t.dataset.tab);
    const act = t.dataset.act;
    switch (act) {
      case "close": return sheet.close();
      case "settings": return settingsSheet();
      case "hills": return hillsSheet();
      case "log": return openLog(t.dataset.day || isoNow());
      case "day-step": { const d = clamp(A.toDay(ui.day) + (+t.dataset.step), 0, TODAY); if (d <= TODAY) { ui.day = A.fromDay(d); openSheet("log", logHTML(ui.day)); syncLog(); } return; }
      case "set": { const k = t.dataset.k, v = t.dataset.v, L = data.logs[ui.day] || {}, num = ["flow", "mood", "energy", "pain"].includes(k) ? +v : v; setLog(ui.day, { [k]: L[k] === num ? undefined : num }); return syncLog(); }
      case "sym": { const L = data.logs[ui.day] || {}, s = new Set(L.sym || []); s.has(t.dataset.v) ? s.delete(t.dataset.v) : s.add(t.dataset.v); setLog(ui.day, { sym: [...s] }); return syncLog(); }
      case "clear-day": { delete data.logs[ui.day]; save(); recompute(); $$("#in-bbt,#in-note", sheet).forEach(x => (x.value = "")); return syncLog(); }
      case "quick": { const L = data.logs[isoNow()] || {}, v = +t.dataset.v; setLog(isoNow(), { [t.dataset.k]: L[t.dataset.k] === v ? undefined : v }); return render(); }
      case "quick-sym": { const L = data.logs[isoNow()] || {}, st = new Set(L.sym || []); st.has(t.dataset.v) ? st.delete(t.dataset.v) : st.add(t.dataset.v); setLog(isoNow(), { sym: [...st] }); return render(); }
      case "jump": { const el = document.getElementById(t.dataset.to); if (el) { const d = $("#learn-q"); if (d && d.value) { d.value = ""; filterLearn(""); } el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" }); } return; }
      case "start-period": return startPeriodToday();
      case "period-over": setLog(isoNow(), { flow: 0 }); toast("Marked: period over."); return render();
      case "pick-start": return openOnboarding() || (ui.ob.step = 1, openSheet("onboard", obHTML(), "sheet--full"));
      case "cal-step": { let { y, m } = ui.month; m += +t.dataset.step; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } ui.month = { y, m }; return render(); }
      case "cal-today": ui.month = monthOf(TODAY); return render();
      case "undo": if (toast.undo) { toast.undo(); } $("#toast").classList.remove("on"); return;
      case "summary": $("#print").innerHTML = printHTML(); return setTimeout(() => window.print(), 60);
      case "ics": return download("almanac-predictions.ics", "text/calendar", icsText());
      case "export": return exportData();
      case "import": return $("#in-file", sheet).click();
      case "install": if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } return;
      case "erase": if (confirm("Erase everything Almanac has saved on this device? This can't be undone. Download a backup first if you might want it.")) { data = fresh(); try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } render(); openOnboarding(); } return;
      case "clear-sample": if (confirm("Remove the example data and start with your own?")) { data = fresh(); save(); render(); openOnboarding(); } return;
      case "ob-next": obRead(); ui.ob.step = Math.min(2, ui.ob.step + 1); return openSheet("onboard", obHTML(), "sheet--full");
      case "ob-back": obRead(); ui.ob.step = Math.max(0, ui.ob.step - 1); return openSheet("onboard", obHTML(), "sheet--full");
      case "ob-skipdate": obRead(); ui.ob.date = ""; ui.ob.step = 2; return openSheet("onboard", obHTML(), "sheet--full");
      case "ob-finish": return obFinish();
      case "ob-sample": data = fresh(); data.settings.onboarded = true; data.sample = true; data.logs = A.makeSample(TODAY, { cycleDay: 12 }); save(); sheet.close(); return;
    }
  });
  document.addEventListener("change", e => {
    if (e.target.id === "in-file" && e.target.files[0]) return importFile(e.target.files[0]);
    if (e.target.dataset.in) onInput(e);
    if (e.target.id === "in-bbt") {
      const raw = e.target.value.trim();
      if (raw === "") return setLog(ui.day, { bbt: undefined });
      const c = unitToC(parseFloat(raw));
      if (isNaN(c) || c < 34 || c > 42) { toast("That doesn't look like a body temperature, so it wasn't saved."); const L = data.logs[ui.day] || {}; e.target.value = L.bbt != null ? cToUnit(L.bbt).toFixed(2) : ""; return; }
      setLog(ui.day, { bbt: Math.round(c * 100) / 100 });
    }
  });
  document.addEventListener("input", e => {
    if (e.target.id === "learn-q") return filterLearn(e.target.value);
    if (e.target.id === "in-note") { clearTimeout(onInput.nt); onInput.nt = setTimeout(() => setLog(ui.day, { note: e.target.value.trim() }), 300); }
  });

  /* ---------------------------------------------------------------- boot */
  function tick() {
    NOW = new Date(); const t = A.localDay(NOW);
    if (t !== TODAY) { TODAY = t; if (!sheet.open) render(); return; }
    if (Date.now() - lastScene > 4 * 60 * 1000 && !sheet.open) updateScene();
  }
  setInterval(tick, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { tick(); if (fx) fx.refresh(); } });
  addEventListener("resize", () => { if (fx) fx.fit(); });
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js").catch(() => { });

  recompute(); render();
  if (!data.settings.onboarded && !AN.hasData) openOnboarding();

  window.__almanac = { get data() { return data; }, set data(d) { data = d; }, render, get AN() { return AN; }, setToday(d) { TODAY = d; render(); }, openLog, settingsSheet };
})();
