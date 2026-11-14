/* Run with:  node tests/engine.test.js   (no dependencies) */
const assert = require("assert");
const A = require("../assets/js/engine.js");
let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log("  ok  " + name); } catch (e) { console.error("FAIL  " + name + "\n      " + e.message); process.exitCode = 1; } };

console.log("\nDates");
test("round-trips ISO <-> day number", () => {
  for (const iso of ["1970-01-01", "2024-02-29", "2026-10-25", "2026-03-29", "2031-12-31"]) assert.strictEqual(A.fromDay(A.toDay(iso)), iso);
});
test("daylight-saving weekends are exactly 1 day apart", () => {
  assert.strictEqual(A.toDay("2026-10-26") - A.toDay("2026-10-25"), 1);   // EU clocks go back
  assert.strictEqual(A.toDay("2026-04-06") - A.toDay("2026-04-05"), 1);   // AU clocks go back
  assert.strictEqual(A.toDay("2026-03-09") - A.toDay("2026-03-08"), 1);   // US clocks go forward
});
test("weekday: 2026-11-10 is a Tuesday (Mon=0)", () => assert.strictEqual(A.weekday(A.toDay("2026-11-10")), 1));
test("cycle length across a year boundary and leap day", () => {
  assert.strictEqual(A.toDay("2025-01-05") - A.toDay("2024-12-08"), 28);
  assert.strictEqual(A.toDay("2024-03-01") - A.toDay("2024-02-01"), 29);
});

console.log("\nPeriods");
const L = (obj) => obj;
test("spotting does not start a period", () => {
  const p = A.derivePeriods({ "2026-01-01": { flow: 1 }, "2026-01-02": { flow: 3 }, "2026-01-03": { flow: 3 } });
  assert.strictEqual(p.length, 1); assert.strictEqual(p[0].start, A.toDay("2026-01-02")); assert.strictEqual(p[0].length, 2);
});
test("a two-day gap stays one period; a three-day gap starts a new one", () => {
  const a = A.derivePeriods({ "2026-01-01": { flow: 3 }, "2026-01-04": { flow: 2 } });
  assert.strictEqual(a.length, 1);
  const b = A.derivePeriods({ "2026-01-01": { flow: 3 }, "2026-01-05": { flow: 2 } });
  assert.strictEqual(b.length, 2);
});
test("heavy days are counted", () => {
  const p = A.derivePeriods({ "2026-01-01": { flow: 4 }, "2026-01-02": { flow: 4 }, "2026-01-03": { flow: 2 } });
  assert.strictEqual(p[0].heavyDays, 2);
});

console.log("\nPrediction");
test("no history: uses the usual length, wide band, says so", () => {
  const p = A.predictLength([], 30);
  assert.strictEqual(p.mean, 30); assert.strictEqual(p.basis, "default");
});
test("one or two cycles: 'early' basis", () => assert.strictEqual(A.predictLength([28, 30], 28).basis, "early"));
test("three+ regular cycles: narrow band, personal basis", () => {
  const p = A.predictLength([28, 28, 28, 28], 28);
  assert.strictEqual(p.basis, "personal"); assert.strictEqual(p.half, 2);
});
test("irregular cycles produce a wider band than regular ones", () => {
  const reg = A.predictLength([28, 29, 28, 29, 28], 28), irr = A.predictLength([24, 35, 27, 41, 30], 28);
  assert.ok(irr.half > reg.half + 3, `irregular ${irr.half} vs regular ${reg.half}`);
});
test("implausible gaps (a missed log) are ignored for prediction", () => {
  const p = A.predictLength([28, 29, 28, 95, 28], 28);
  assert.ok(Math.abs(p.mean - 28.25) < 0.01 && p.n === 4);
});
test("uses only the most recent six cycles", () => {
  const p = A.predictLength([40, 40, 28, 28, 28, 28, 28, 28], 28);
  assert.strictEqual(Math.round(p.mean), 28);
});

console.log("\nCalibration: does '80% range' actually mean ~80%?");
(function calibration() {
  let seed = 7; const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const norm = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const rows = [];
  for (const n of [3, 4, 5, 6]) {
    let hit = 0, tot = 0, hitWide = 0, totWide = 0;
    for (let u = 0; u < 6000; u++) {
      const mu = 24 + rnd() * 10, sigma = 1.5 + rnd() * 4.5;          // person-to-person: SD 1.5–6 days
      const draw = () => Math.round(mu + sigma * norm());
      const hist = Array.from({ length: n }, draw), truth = draw();
      const p = A.predictLength(hist, 28), c = Math.round(p.mean);
      const inside = truth >= c - p.half && truth <= c + p.half;
      tot++; hit += inside;
      if (sigma >= 3) { totWide++; hitWide += inside; }
    }
    rows.push({ n, all: (100 * hit / tot).toFixed(1) + "%", sdGE3: (100 * hitWide / totWide).toFixed(1) + "%" });
  }
  console.table(rows);
  for (const r of rows) assert.ok(parseFloat(r.sdGE3) > 74 && parseFloat(r.sdGE3) < 92, `n=${r.n}: coverage ${r.sdGE3} outside 74–92%`);
  passed++;
  // also the 'early' (1–2 cycles) band
  let h = 0, t = 0;
  for (let u = 0; u < 6000; u++) {
    const mu = 24 + rnd() * 10, sigma = 1.5 + rnd() * 4.5, draw = () => Math.round(mu + sigma * norm());
    const hist = [draw(), draw()], truth = draw(), p = A.predictLength(hist, 28), c = Math.round(p.mean);
    t++; h += truth >= c - p.half && truth <= c + p.half;
  }
  console.log("  early band (2 cycles, ±5 days) coverage: " + (100 * h / t).toFixed(1) + "%");
})();

console.log("\nOvulation evidence");
const temps = (arr, start) => { const l = {}; arr.forEach((t, i) => { l[A.fromDay(start + i)] = { bbt: t }; }); return l; };
test("3-over-6 rule finds the shift", () => {
  const t = [36.3, 36.4, 36.3, 36.35, 36.3, 36.4, 36.3, 36.75, 36.8, 36.85, 36.8];
  const logs = temps(t, 100);
  const ev = A.ovulationEvidence(logs, 100, 120);
  assert.strictEqual(ev.source, "temp"); assert.strictEqual(ev.day, 100 + 7 - 1); assert.ok(ev.confirmed);
});
test("no sustained shift -> no confirmation", () => {
  const t = [36.3, 36.4, 36.3, 36.35, 36.3, 36.4, 36.3, 36.75, 36.3, 36.35, 36.3];
  assert.strictEqual(A.ovulationEvidence(temps(t, 100), 100, 120), null);
});
test("a single warm night is not a shift", () => {
  const t = [36.3, 36.3, 36.3, 36.3, 36.3, 36.3, 36.9, 36.3, 36.3, 36.3];
  assert.strictEqual(A.bbtShift(t.map((x, i) => [i, x])), null);
});
test("LH positive -> ovulation expected the next day, marked 'likely'", () => {
  const logs = { [A.fromDay(110)]: { lh: "neg" }, [A.fromDay(111)]: { lh: "pos" } };
  const ev = A.ovulationEvidence(logs, 100, 130);
  assert.strictEqual(ev.day, 112); assert.strictEqual(ev.confirmed, false);
});

console.log("\nAnalysis");
function history(startISO, lengths, periodLen = 5) {
  const logs = {}; let d = A.toDay(startISO);
  lengths.forEach(len => { for (let i = 0; i < periodLen; i++) logs[A.fromDay(d + i)] = { flow: i < 2 ? 3 : 2 }; d += len; });
  for (let i = 0; i < periodLen; i++) logs[A.fromDay(d + i)] = { flow: 3 };
  return { logs, lastStart: d };
}
test("ovulation lands ~14 days before the predicted next period, not on 'day 14'", () => {
  const h = history("2026-01-01", [35, 35, 35, 35]);
  const today = h.lastStart + 7;
  const a = A.analyze({ settings: {}, logs: h.logs }, today);
  assert.strictEqual(a.current.next.start, h.lastStart + 35);
  assert.strictEqual(a.current.ovu.day, h.lastStart + 35 - 14);                     // cycle day 22, not 14
  assert.strictEqual(a.current.ovu.day - a.last.start + 1, 22);
});
test("a 24-day cycle ovulates around day 11", () => {
  const h = history("2026-01-01", [24, 24, 24, 24]);
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 3);
  assert.strictEqual(a.current.ovu.day - a.last.start + 1, 11);
});
test("fertile window is 6 days: 5 before ovulation + ovulation day", () => {
  const h = history("2026-01-01", [28, 28, 28, 28]);
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 2);
  assert.strictEqual(a.current.fertile.end - a.current.fertile.start + 1, 6);
});
test("phases walk winter -> spring -> summer -> autumn", () => {
  const h = history("2026-01-01", [28, 28, 28, 28]);
  const seen = [];
  for (let off = 1; off <= 28; off++) { const p = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + off - 1).current.phase; if (seen[seen.length - 1] !== p) seen.push(p); }
  assert.deepStrictEqual(seen, ["winter", "spring", "summer", "autumn"]);
});
test("confirmed ovulation (temperature) replaces the calendar estimate and learns the luteal length", () => {
  const h = history("2026-01-01", [28, 28, 28]);
  const lastStart = h.lastStart; const ovu = lastStart + 14;
  for (let i = 0; i < 22; i++) h.logs[A.fromDay(lastStart + i)] = Object.assign({}, h.logs[A.fromDay(lastStart + i)], { bbt: (lastStart + i) > ovu ? 36.8 : 36.3 });
  const a = A.analyze({ settings: {}, logs: h.logs }, lastStart + 21);
  assert.ok(a.current.ovu.confirmed); assert.strictEqual(a.current.ovu.day, ovu);
});
test("hormonal-contraception mode makes no ovulation or fertile-window claims", () => {
  const h = history("2026-01-01", [28, 28, 28]);
  const a = A.analyze({ settings: { mode: "hormonal" }, logs: h.logs }, h.lastStart + 9);
  assert.strictEqual(a.current.ovu, undefined); assert.strictEqual(a.current.fertile, undefined);
});
test("paused mode makes no predictions", () => {
  const h = history("2026-01-01", [28, 28, 28]);
  const a = A.analyze({ settings: { mode: "paused" }, logs: h.logs }, h.lastStart + 9);
  assert.strictEqual(a.current, null); assert.strictEqual(a.upcoming.length, 0);
});
test("no data: analysis does not crash", () => {
  const a = A.analyze({ settings: {}, logs: {} }, 20000);
  assert.strictEqual(a.hasData, false); assert.strictEqual(a.current, null);
});
test("a late period is reported only once it is outside the likely range", () => {
  const h = history("2026-01-01", [28, 28, 28, 28]);
  const early = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 28 + 1).current;
  assert.strictEqual(early.late, null);
  const late = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 28 + 6).current;
  assert.ok(late.late && late.late.beyond > 0);
});
test("irregular cycles are flagged as too imprecise to pinpoint ovulation", () => {
  const h = history("2026-01-01", [24, 38, 27, 41, 30]);
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 5);
  assert.ok(a.current.imprecise);
});

console.log("\nFlags");
test("three cycles in a row outside 21–35 days -> 'talk to someone'", () => {
  const h = history("2026-01-01", [40, 41, 42, 40]);
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 4);
  assert.ok(a.flags.some(f => f.id === "cycle-out-3"));
});
test("teen range allows 45 days", () => {
  const h = history("2026-01-01", [40, 41, 42, 40]);
  const a = A.analyze({ settings: { age: "teen" }, logs: h.logs }, h.lastStart + 4);
  assert.ok(!a.flags.some(f => f.id.startsWith("cycle-out")));
});
test("90+ days since last period -> flag", () => {
  const h = history("2026-01-01", [28, 28]);
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 95);
  assert.ok(a.flags.some(f => f.id === "no-period"));
});
test("regular cycles raise no flags", () => {
  const h = history("2026-01-01", [28, 29, 28, 30, 28]);
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 5);
  assert.strictEqual(a.flags.length, 0);
});
test("'soaking a pad every hour' is flagged", () => {
  const h = history("2026-01-01", [28, 28, 28]);
  h.logs[A.fromDay(h.lastStart + 1)].sym = ["soaking"];
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 2);
  assert.ok(a.flags.some(f => f.id === "heavy"));
});

console.log("\nCurves & patterns");
test("progesterone peaks after ovulation; estrogen peaks just before", () => {
  let pe = -99, pp = -99, tE = 0, tP = 0;
  for (let t = -14; t <= 14; t += 0.25) { if (A.estrogen(t) > pe) { pe = A.estrogen(t); tE = t; } if (A.progesterone(t) > pp) { pp = A.progesterone(t); tP = t; } }
  assert.ok(tE >= -3 && tE <= 0, "estrogen peak at " + tE); assert.ok(tP >= 5 && tP <= 9, "progesterone peak at " + tP);
});
test("progesterone is near baseline before ovulation", () => assert.ok(A.progesterone(-6) < 0.08));
test("patterns stay silent without enough data", () => {
  const h = history("2026-01-01", [28, 28, 28]);
  const a = A.analyze({ settings: {}, logs: h.logs }, h.lastStart + 3);
  assert.strictEqual(A.patterns({ logs: h.logs }, a).statements.length, 0);
});
test("the example data produces a sensible analysis", () => {
  const today = A.toDay("2026-11-10");
  const logs = A.makeSample(today, { cycleDay: 12 });
  const a = A.analyze({ settings: {}, logs }, today);
  assert.ok(a.cycles.length >= 6 && a.stats.mean > 27 && a.stats.mean < 31);
  assert.strictEqual(a.current.day, 12);
  assert.ok(a.cycles.slice(-3).every(c => c.ovuConfirmed), "last cycles should have temperature-confirmed ovulation");
  const pat = A.patterns({ logs }, a);
  assert.ok(pat.statements.length >= 1, "example data should show at least one pattern");
});

console.log("\n" + passed + " checks passed" + (process.exitCode ? " — WITH FAILURES" : ""));
