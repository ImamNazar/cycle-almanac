/* ==========================================================================
   ALMANAC — the engine
   Pure logic. No DOM, no network. Runs in the browser (window.Almanac) and in
   Node (module.exports) so it can be tested.

   Everything a person logs is a day-keyed object:
     logs["2026-10-04"] = { flow:0-4, mood:1-5, energy:1-5, pain:0-3,
                            sym:["cramps",…], lh:"neg"|"pos", mucus:"dry"|…,
                            bbt:36.55 (°C), note:"…" }
   Periods, cycles, phases, predictions and patterns are all DERIVED from that,
   so fixing an old entry silently fixes everything downstream.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Almanac = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ dates
     A "day" is a whole number (days since 1970-01-01, UTC). Doing date maths on
     integers means daylight-saving changes can never shift a prediction.      */
  const MS = 86400000;
  const pad = n => String(n).padStart(2, "0");
  const toDay = iso => { const p = iso.split("-").map(Number); return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / MS); };
  const fromDay = n => { const d = new Date(n * MS); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); };
  const localDay = (d = new Date()) => toDay(d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()));
  const weekday = n => (((n + 3) % 7) + 7) % 7;               // Monday = 0 … Sunday = 6

  /* --------------------------------------------------------- reference data
     Every number here comes from a published source (see content.js → SOURCES). */
  const REF = {
    adult: { min: 21, max: 35 },        // ACOG: typical adult cycle, first day of one period to first day of next
    teen:  { min: 21, max: 45 },        // ACOG: for adolescents the upper limit is 45 days
    ovuToNext: 14,                      // ovulation ≈ 14 days before the next period starts (luteal phase 12–14 days
                                        //   on average: Bull 2019 = 12.4, Lenton 1984 = ~14; midpoint)
    fertileBefore: 5,                   // sperm survive up to 5 days; the egg 12–24 h → 6-day window (5 + ovulation day)
    validCycle: [15, 60],               // cycles outside this are treated as "probably a missed log", not used to predict
    bbtRise: 0.2                        // °C: the third high temperature must clear the 6-day baseline by this much
  };

  /* -------------------------------------------------------------- statistics */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const median = a => { const s = [...a].sort((x, y) => x - y), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

  // One-sided 90% Student-t values → a two-sided 80% prediction interval
  const T80 = [null, 3.078, 1.886, 1.638, 1.533, 1.476, 1.440, 1.415, 1.397, 1.383, 1.372];
  const t80 = df => (df < 1 ? T80[1] : df <= 10 ? T80[df] : df <= 15 ? 1.341 : df <= 30 ? 1.310 : 1.282);

  /* How long will the NEXT cycle be?
     With 3+ logged cycles we estimate an 80% prediction interval under a simple statistical model:
       mean ± t · s · √(1 + 1/n)      (the √(1+1/n) accounts for not knowing the true mean)
     With fewer we say so, and use a deliberately wide band.                    */
  function predictLength(lengths, usual) {
    const [lo, hi] = REF.validCycle;
    const use = lengths.filter(l => l >= lo && l <= hi).slice(-6);
    const n = use.length;
    if (n >= 3) {
      const s = sd(use);
      return { mean: mean(use), half: Math.max(2, Math.ceil(t80(n - 1) * s * Math.sqrt(1 + 1 / n))), n, sd: s, basis: "personal" };
    }
    if (n >= 1) return { mean: mean(use), half: 5, n, sd: n > 1 ? sd(use) : null, basis: "early" };
    return { mean: usual || 28, half: 6, n: 0, sd: null, basis: "default" };
  }

  /* -------------------------------------------------------- periods & cycles
     Bleeding days = flow of light (2) or more. Spotting (1) does not start a
     period (a new cycle begins with the first day of real bleeding). Bleeding
     days separated by up to two dry days are one period.                       */
  function derivePeriods(logs) {
    const days = Object.keys(logs).filter(k => (logs[k].flow || 0) >= 2).map(toDay).sort((a, b) => a - b);
    const periods = []; let cur = null;
    for (const d of days) {
      if (cur && d - cur.end <= 3) { cur.end = d; cur.days.push(d); }
      else { cur = { start: d, end: d, days: [d] }; periods.push(cur); }
    }
    return periods.map(p => ({
      start: p.start, end: p.end, length: p.end - p.start + 1,
      heavyDays: p.days.filter(x => logs[fromDay(x)].flow === 4).length
    }));
  }

  /* ----------------------------------------------------- ovulation evidence
     Two kinds of real evidence, both optional:
       • LH test: first positive → ovulation expected ~24–36 h later (we use +1 day)
       • Temperature: "3 over 6" rule (as used by symptothermal methods) → ovulation
         happened about a day before the first sustained rise.  Confirms AFTER the fact.
     Cervical mucus is shown but not used to pin a day down.                    */
  function bbtShift(t) {
    for (let i = 6; i + 2 < t.length; i++) {
      if (t[i][0] - t[i - 6][0] > 12) continue;                // the six baseline readings must be recent
      const base = Math.max(...t.slice(i - 6, i).map(x => x[1]));
      const a = t[i], b = t[i + 1], c = t[i + 2];
      if (b[0] - a[0] > 2 || c[0] - b[0] > 2) continue;        // allow at most one missed morning
      if (a[1] > base && b[1] > base && c[1] >= base + REF.bbtRise) return a[0];
    }
    return null;
  }
  function ovulationEvidence(logs, from, to) {
    const temps = [];
    for (let d = from; d <= to; d++) { const l = logs[fromDay(d)]; if (l && typeof l.bbt === "number") temps.push([d, l.bbt]); }
    const s = bbtShift(temps);
    if (s != null) return { day: s - 1, source: "temp", confirmed: true };
    for (let d = from; d <= to; d++) { const l = logs[fromDay(d)]; if (l && l.lh === "pos") return { day: d + 1, source: "lh", confirmed: false }; }
    return null;
  }

  function buildCycles(periods, logs) {
    const out = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const a = periods[i], b = periods[i + 1];
      const c = { start: a.start, next: b.start, length: b.start - a.start, periodLen: a.length, heavyDays: a.heavyDays };
      const ev = ovulationEvidence(logs, a.start, b.start - 1);
      if (ev) {
        const o2n = b.start - ev.day;
        if (o2n >= 8 && o2n <= 20) { c.ovu = ev.day; c.ovuSource = ev.source; c.ovuConfirmed = ev.confirmed; c.ovuToNext = o2n; }
      }
      out.push(c);
    }
    return out;
  }

  /* ---------------------------------------------------------------- phases
     winter = bleeding · spring = follicular · summer = ovulation window (the
     estimate ±1 day, because estimates are uncertain) · autumn = luteal.      */
  function phaseOf(day, c) {
    if (day <= c.bleedEnd) return "winter";
    if (day < c.ovu - 1) return "spring";
    if (day <= c.ovu + 1) return "summer";
    return "autumn";
  }

  /* ---------------------------------------------------- hormone landscape
     SCHEMATIC curves in "relative to ovulation" time, so they stretch correctly
     for any cycle length. Shapes follow the reference ranges in Stricker et al.
     2006: estradiol rises to a peak ~1–2 days before ovulation, with a smaller
     luteal bump; progesterone is near zero until ovulation, peaks ~a week later,
     and falls before the next period.  Heights are normalised 0–1: not levels. */
  const g = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2);
  const estrogen = t => 0.10 + 0.84 * g(t, -1.4, t < -1.4 ? 3.4 : 1.7) + 0.38 * g(t, 7, 3.6);
  const progesterone = t => 0.04 + 0.96 * (1 / (1 + Math.exp(-(t - 0.2) * 1.8))) * g(t, 7, t < 7 ? 3.2 : 3.4);
  function curves(cycleLen, ovuOffset, n = 80) {
    const E = [], P = [];
    for (let i = 0; i < n; i++) {
      const d = (i / (n - 1)) * cycleLen, t = d - ovuOffset;
      E.push(estrogen(t)); P.push(progesterone(t));
    }
    return { E, P };
  }

  /* ------------------------------------------------------------- analysis */
  function analyze(data, today) {
    const S = Object.assign({ mode: "natural", age: "adult", defaultCycle: null, defaultPeriod: 5 }, data.settings || {});
    const logs = data.logs || {};
    const range = S.age === "teen" ? REF.teen : REF.adult;
    const periods = derivePeriods(logs).filter(p => p.start <= today);
    const cycles = buildCycles(periods, logs);
    const lens = cycles.map(c => c.length);
    const last = periods[periods.length - 1] || null;

    const doneP = periods.filter(p => p.end < today - 1).slice(-6).map(p => p.length);
    const periodMean = doneP.length ? mean(doneP) : (S.defaultPeriod || 5);
    const lutealObs = cycles.filter(c => c.ovuToNext).slice(-6).map(c => c.ovuToNext);
    const o2n = lutealObs.length >= 2 ? Math.round(mean(lutealObs)) : REF.ovuToNext;

    const usable = lens.filter(l => l >= REF.validCycle[0] && l <= REF.validCycle[1]);
    const stats = {
      n: lens.length, mean: usable.length ? mean(usable) : null, sd: usable.length > 1 ? sd(usable) : null,
      median: usable.length ? median(usable) : null,
      min: usable.length ? Math.min(...usable) : null, max: usable.length ? Math.max(...usable) : null,
      periodMean, periodN: doneP.length, ovuToNext: o2n, ovuToNextN: lutealObs.length
    };

    const out = { settings: S, mode: S.mode, range, today, periods, cycles, stats, last, current: null, upcoming: [], flags: [], hasData: periods.length > 0 };
    if (!last || S.mode === "paused") { out.flags = computeFlags(S, range, periods, cycles, logs, today, last); return out; }

    const pr = predictLength(lens, S.defaultCycle);
    const len = Math.round(pr.mean);
    const inPeriod = last.end >= today - 1;
    const bleedEnd = inPeriod ? Math.max(last.end, today) : last.end;
    const day = today - last.start + 1;

    for (let k = 1; k <= 3; k++) {
      const half = Math.max(2, Math.ceil(pr.half * Math.sqrt(k)));
      const start = last.start + Math.round(k * pr.mean);
      out.upcoming.push({ k, start, lo: start - half, hi: start + half, half });
    }
    const next = out.upcoming[0];
    const late = !inPeriod && today > next.hi ? { days: today - next.start, beyond: today - next.hi } : null;

    if (S.mode === "hormonal") {
      out.current = { day, inPeriod, phase: inPeriod ? "bleed" : "steady", bleedEnd, next, late, predLen: len, basis: pr };
      out.flags = computeFlags(S, range, periods, cycles, logs, today, last);
      return out;
    }

    // ---- natural cycle: ovulation estimate for the current cycle
    const ev = ovulationEvidence(logs, last.start, today);
    const uncert = Math.max(2, Math.round(Math.sqrt(next.half ** 2 + 4)));
    let ovu = next.start - o2n, ovuLo = ovu - uncert, ovuHi = ovu + uncert, source = "calendar", confirmed = false;
    if (ev) { ovu = ev.day; ovuLo = ovu - 1; ovuHi = ovu + 1; source = ev.source; confirmed = ev.confirmed; }
    else ovu = Math.max(ovu, bleedEnd + 3);
    const cc = { start: last.start, bleedEnd, ovu };
    const phase = day < 1 ? "winter" : (late && !ev) ? "autumn" : phaseOf(today, cc);

    const bounds = {
      winter: [last.start, bleedEnd], spring: [bleedEnd + 1, ovu - 2],
      summer: [ovu - 1, ovu + 1], autumn: [ovu + 2, Math.max(next.start - 1, today)]
    }[phase];
    const phaseLen = Math.max(1, bounds[1] - bounds[0] + 1);
    const phaseDay = clamp(today - bounds[0] + 1, 1, phaseLen);

    const fStart = ovu - REF.fertileBefore;
    const fertile = {
      start: fStart, end: ovu, loStart: confirmed ? fStart : ovuLo - REF.fertileBefore, hiEnd: confirmed ? ovu : ovuHi,
      status: today < fStart ? "before" : today <= ovu ? "in" : "after", daysTo: fStart - today
    };

    // ovulation for the current + two future cycles (for the calendar)
    const ovulations = [{ cycleStart: last.start, day: ovu, lo: ovuLo, hi: ovuHi, source, confirmed }];
    for (let j = 0; j < 2; j++) {
      const nx = out.upcoming[j + 1], me = out.upcoming[j];
      const u = Math.max(2, Math.round(Math.sqrt(nx.half ** 2 + 4)));
      ovulations.push({ cycleStart: me.start, day: nx.start - o2n, lo: nx.start - o2n - u, hi: nx.start - o2n + u, source: "calendar", confirmed: false });
    }

    out.current = {
      day, inPeriod, phase, bleedEnd, phaseStart: bounds[0], phaseEnd: bounds[1], phaseLen, phaseDay,
      progress: clamp(phaseDay / phaseLen, 0, 1), next, late, predLen: len, basis: pr,
      ovu: { day: ovu, lo: ovuLo, hi: ovuHi, source, confirmed, uncertainty: uncert }, fertile, ovulations,
      imprecise: !confirmed && uncert > 5
    };
    out.flags = computeFlags(S, range, periods, cycles, logs, today, last);
    return out;
  }

  /* --------------------------------------------------------------- flags
     Gentle "worth mentioning to a clinician" notes. Thresholds are the ones
     published by ACOG / Mayo Clinic / FIGO; nothing here diagnoses anything.  */
  function computeFlags(S, range, periods, cycles, logs, today, last) {
    const f = [];
    const out = c => c.length < range.min || c.length > range.max;
    const lastN = cycles.slice(-3);
    if (lastN.length === 3 && lastN.every(out)) f.push({ id: "cycle-out-3", level: "talk", data: { lens: lastN.map(c => c.length), range } });
    else if (cycles.length && out(cycles[cycles.length - 1])) f.push({ id: "cycle-out-1", level: "info", data: { len: cycles[cycles.length - 1].length, range } });

    const six = cycles.slice(-6).map(c => c.length).filter(l => l >= 15 && l <= 60);
    if (six.length >= 3 && Math.max(...six) - Math.min(...six) > 9) f.push({ id: "variation", level: "info", data: { span: Math.max(...six) - Math.min(...six) } });

    const longP = periods.slice(-3).filter(p => p.length > 7 && p.end < today - 1);
    if (longP.length) f.push({ id: "period-long", level: "talk", data: { len: Math.max(...longP.map(p => p.length)) } });

    if (last && S.mode === "natural" && today - last.start >= 90) f.push({ id: "no-period", level: "talk", data: { days: today - last.start } });

    const recent = Object.keys(logs).filter(k => toDay(k) >= today - 90 && toDay(k) <= today);
    if (recent.some(k => (logs[k].sym || []).includes("soaking") || (logs[k].sym || []).includes("clots"))) f.push({ id: "heavy", level: "talk", data: {} });
    if (recent.filter(k => logs[k].pain === 3).length >= 3) f.push({ id: "pain", level: "talk", data: {} });

    const inP = d => periods.some(p => d >= p.start - 1 && d <= p.end + 1);
    if (recent.filter(k => logs[k].flow === 1 && !inP(toDay(k))).length >= 3) f.push({ id: "spotting", level: "info", data: {} });
    return f;
  }

  /* ------------------------------------------------------ your own patterns
     Average mood / energy / pain for each phase, using only days YOU logged.
     A statement is made only when both phases have ≥ 4 logged days and the
     difference is big enough to matter.                                        */
  function patterns(data, A) {
    const logs = data.logs || {}, o2n = A.stats.ovuToNext;
    const ctxs = [];
    A.cycles.forEach(c => {
      const bleedEnd = c.start + c.periodLen - 1;
      ctxs.push({ start: c.start, next: c.next, bleedEnd, ovu: Math.max(c.ovu != null ? c.ovu : c.next - o2n, bleedEnd + 3) });
    });
    if (A.current && A.current.ovu) ctxs.push({ start: A.last.start, next: Infinity, bleedEnd: A.current.bleedEnd, ovu: A.current.ovu.day });
    const dims = { mood: { sum: {}, n: {} }, energy: { sum: {}, n: {} }, pain: { sum: {}, n: {} } };
    const sym = {}, daysIn = {};
    for (const k of Object.keys(logs)) {
      const d = toDay(k), c = ctxs.find(x => d >= x.start && d < x.next);
      if (!c) continue;
      const ph = phaseOf(d, c), L = logs[k];
      daysIn[ph] = (daysIn[ph] || 0) + 1;
      for (const m of Object.keys(dims)) if (typeof L[m] === "number") { dims[m].sum[ph] = (dims[m].sum[ph] || 0) + L[m]; dims[m].n[ph] = (dims[m].n[ph] || 0) + 1; }
      (L.sym || []).forEach(s => { (sym[ph] = sym[ph] || {})[s] = (sym[ph][s] || 0) + 1; });
    }
    const res = { dims: {}, symptoms: {}, daysIn, statements: [] };
    for (const m of Object.keys(dims)) {
      res.dims[m] = {};
      for (const ph of Object.keys(dims[m].n)) res.dims[m][ph] = { n: dims[m].n[ph], mean: dims[m].sum[ph] / dims[m].n[ph] };
      const ok = Object.entries(res.dims[m]).filter(([, v]) => v.n >= 4);
      if (ok.length >= 2) {
        const hi = ok.reduce((a, b) => (b[1].mean > a[1].mean ? b : a)), lo = ok.reduce((a, b) => (b[1].mean < a[1].mean ? b : a));
        const need = m === "pain" ? 0.5 : 0.6;
        if (hi[1].mean - lo[1].mean >= need) res.statements.push({ dim: m, hi: hi[0], lo: lo[0], hiMean: hi[1].mean, loMean: lo[1].mean, hiN: hi[1].n, loN: lo[1].n });
      }
    }
    for (const ph of Object.keys(sym)) {
      if ((daysIn[ph] || 0) < 5) continue;
      res.symptoms[ph] = Object.entries(sym[ph]).map(([id, c]) => ({ id, count: c, pct: Math.round((100 * c) / daysIn[ph]) })).sort((a, b) => b.count - a.count).slice(0, 4);
    }
    return res;
  }

  /* ------------------------------------------------------- example data
     Clearly-labelled synthetic data so people can explore before logging.     */
  function makeSample(today, opts = {}) {
    let seed = 20261110;
    const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const cycleDay = opts.cycleDay || 12;
    const lens = [29, 31, 28, 30, 27, 30, 29];
    const logs = {};
    let start = today - (cycleDay - 1);
    const starts = [start];
    for (let i = lens.length - 1; i >= 0; i--) { start -= lens[i]; starts.unshift(start); }
    const flowPat = [3, 4, 3, 2, 2, 1];
    const pick = (b, spread) => clamp(Math.round(b + (rnd() - 0.5) * spread), 1, 5);
    starts.forEach((st, ci) => {
      const isLast = ci === starts.length - 1, len = isLast ? 29 : lens[ci];
      const plen = 4 + Math.floor(rnd() * 3), ovu = st + len - 14 + Math.round((rnd() - 0.5) * 2);
      const endDay = isLast ? today : st + len - 1;
      for (let d = st; d <= endDay; d++) {
        const i = d - st; if (d > today) break;
        const L = {};
        if (i < plen) L.flow = flowPat[Math.min(i, 5)] || 2;
        const ph = i < plen ? "w" : d < ovu - 1 ? "s" : d <= ovu + 1 ? "m" : "a";
        const pre = !isLast && d > st + len - 6;
        if (rnd() < 0.8) {
          const base = { w: [3.0, 2.4, 1.3], s: [3.9, 3.8, 0.3], m: [4.1, 4.0, 0.3], a: [pre ? 2.7 : 3.4, pre ? 2.6 : 3.1, pre ? 0.9 : 0.3] }[ph];
          L.mood = pick(base[0], 1.6); L.energy = pick(base[1], 1.6); L.pain = clamp(Math.round(base[2] + (rnd() - 0.5) * 1.2), 0, 3);
        }
        const sy = [];
        if (i < 2 && rnd() < 0.7) sy.push("cramps");
        if (i < plen && rnd() < 0.4) sy.push("fatigue");
        if (pre && rnd() < 0.6) sy.push("bloating");
        if (pre && rnd() < 0.5) sy.push("irritable");
        if (pre && rnd() < 0.4) sy.push("breast");
        if (rnd() < 0.06) sy.push("headache");
        if (sy.length) L.sym = sy;
        if (ci >= starts.length - 4 && d <= today) {
          L.bbt = Math.round((d > ovu ? 36.72 : 36.34) * 100 + (rnd() - 0.5) * 12) / 100;
          if (d === ovu - 1) L.lh = "pos"; else if (d >= ovu - 4 && d < ovu - 1) L.lh = "neg";
          if (d >= ovu - 3 && d <= ovu) L.mucus = d >= ovu - 1 ? "eggwhite" : "watery";
        }
        if (Object.keys(L).length) logs[fromDay(d)] = L;
      }
    });
    return logs;
  }

  return {
    REF, MS, toDay, fromDay, localDay, weekday, clamp, mean, sd, median,
    predictLength, derivePeriods, bbtShift, ovulationEvidence, buildCycles, phaseOf,
    estrogen, progesterone, curves, analyze, patterns, computeFlags, makeSample
  };
});
