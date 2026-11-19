/* Browser smoke tests. Run: npm install --no-save playwright && npx playwright install chromium && node tests/browser.test.js */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");

(async () => {
  const server = spawn("python3", ["-m", "http.server", "8765", "--bind", "127.0.0.1"], { stdio: "ignore" });
  let browser;
  try {
    for (let i = 0; i < 40; i++) {
      try { const r = await fetch("http://127.0.0.1:8765/"); if (r.ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
      if (i === 39) throw Error("Local test server did not start");
    }
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      const context = await browser.newContext({ viewport, acceptDownloads: true, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("http://127.0.0.1:8765/", { waitUntil: "load" });
      await page.waitForFunction(() => !!window.__almanac);
      // Start with sample data to avoid relying on a specific calendar date.
      await page.locator('[data-act="ob-sample"]').click();
      await page.waitForTimeout(200);
      assert.equal(await page.locator('.v5-checkin__row').count(), 4, "Daily Studio offers mood, energy, pain and flow");
      assert.equal(await page.locator('.v5-portal').evaluate(el => getComputedStyle(el).backgroundImage !== 'none'), true, "Cosmic atmosphere remains visible without motion");
      if (viewport.width < 720) {
        assert.equal(await page.locator('.v5-portal').evaluate(el => getComputedStyle(el, '::after').animationName), 'none', "Mobile disables decorative planet animation");
      }

      assert.equal(await page.locator('.dock__btn[aria-current="page"]').count(), 1, "Exactly one navigation tab is current");
      assert.equal(await page.locator('.dock__btn[data-tab="today"]').getAttribute('aria-current'), 'page', "Today navigation is announced as current");
      assert.equal(await page.locator('.dock__btn').first().evaluate(el => getComputedStyle(el).touchAction), 'manipulation', "Dock supports reliable touch activation");

      assert.equal(await page.locator('.v5-portal__action').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s', "Phase 3 interactions respect reduced motion");
      assert.equal(await page.locator('.v5-portal__action').first().evaluate(el => getComputedStyle(el, '::after').display), 'none', "Decorative shimmer is disabled under reduced motion");
      assert.equal(await page.locator('.v5-checkin__choice').first().evaluate(el => getComputedStyle(el).touchAction), 'manipulation', "Daily check-in is touch optimized");

      const noPain = page.locator('.v5-checkin__choice[data-k="pain"][data-v="0"]');
      if (await noPain.getAttribute('aria-pressed') === 'true') await noPain.click();
      assert.equal(await noPain.getAttribute('aria-pressed'), 'false', "Pain can be left unrecorded");
      await noPain.click();
      assert.equal(await noPain.getAttribute('aria-pressed'), 'true', "No pain is explicitly recorded");
      await noPain.click();
      assert.equal(await noPain.getAttribute('aria-pressed'), 'false', "Tapping again removes a quick observation");
      // One-tap check-in must persist and allow removal by tapping again.
      await page.locator('.v5-checkin__choice[data-k="mood"]').first().click();
      assert.equal(await page.locator('.v5-checkin__choice[data-k="mood"]').first().getAttribute('aria-pressed'), 'true', "Mood quick choice selected");
      await page.waitForFunction(() => document.querySelector('.v5-checkin__save')?.dataset.status === 'saved');
      assert.match(await page.locator('.v5-checkin__save').innerText(), /Saved on this device/, "Save status confirms completed storage write");
      // Almanac debounces local writes; wait for durable storage before reload.
      await page.waitForFunction(() => {
        try {
          const saved = JSON.parse(localStorage.getItem("almanac.v1") || "{}");
          const today = new Date();
          const iso = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
          return saved.logs && saved.logs[iso] && saved.logs[iso].mood === 1;
        } catch { return false; }
      });
      await page.reload();
      await page.waitForFunction(() => !!window.__almanac);
      assert.equal(await page.locator('.v5-checkin__choice[data-k="mood"]').first().getAttribute('aria-pressed'), 'true', "Mood choice persists after reload");
      await page.locator('.v5-checkin__choice[data-k="mood"]').first().click();
      assert.equal(await page.locator('.v5-checkin__choice[data-k="mood"]').first().getAttribute('aria-pressed'), 'false', "Tapping again removes quick choice");
      assert.equal(await page.locator('.v5-checkin').count(), 1, "Only one quick check-in panel");
      assert.equal(await page.locator('.v5-checkin__choice[data-k="mood"][data-v="4"]').count(), 1, "Mood option is unique");
      // A blocked storage write must never be reported as successfully saved.
      await page.evaluate(() => {
        window.__originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function () { throw new DOMException("Storage blocked", "QuotaExceededError"); };
      });
      await page.locator('.v5-checkin__choice[data-k="energy"]').first().click();
      await page.waitForFunction(() => document.querySelector('.v5-checkin__save')?.dataset.status === 'error');
      assert.match(await page.locator('.v5-checkin__save').innerText(), /Not saved/, "Failed storage is explicitly reported");
      await page.evaluate(() => { Storage.prototype.setItem = window.__originalSetItem; });
      await page.locator('.v5-checkin__choice[data-k="energy"]').first().click();
      await page.waitForFunction(() => document.querySelector('.v5-checkin__save')?.dataset.status === 'saved');
      assert.match(await page.locator('.v5-checkin__save').innerText(), /Saved on this device/, "Saving recovers after storage becomes available");
      // Almanac 5: the Daily Studio must open the existing private journal.
      assert.equal(await page.locator(".v5-portal").count(), 1, "Daily Studio visible");
      assert.equal(await page.locator(".v5-portal").evaluate(el => getComputedStyle(el, "::after").animationName), "none", "Decorative orb respects reduced motion");
      assert.equal(await page.locator(".v5-portal").evaluate(el => getComputedStyle(el).animationName), "none", "Entrance effects respect reduced motion");
      await page.locator('.v5-portal [data-act="log"]').click();
      assert.equal(await page.locator('#sheet[open]').count(), 1, "Daily Studio opens log sheet");
      await page.locator('#sheet [data-act="close"]').click();
      // Time-window switching changes the real date controls, not stored data.
      assert.equal(await page.locator('.orbit-journal__day').count(), 14, "14-day constellation default");
      await page.locator('[data-act="constellation-range"][data-days="28"]').click();
      assert.equal(await page.locator('.orbit-journal__day').count(), 28, "28-day constellation");
      assert.equal(await page.locator('[data-act="constellation-range"][data-days="28"]').getAttribute('aria-pressed'), 'true', "28-day control selected");
      await page.locator('[data-act="constellation-range"][data-days="14"]').click();
      assert.equal(await page.locator('.orbit-journal__day').count(), 14, "14-day constellation restored");
      const currentLastDay = await page.locator('.orbit-journal__day').last().getAttribute('data-day');
      await page.locator('[data-act="constellation-step"][data-step="1"]').click();
      const earlierLastDay = await page.locator('.orbit-journal__day').last().getAttribute('data-day');
      assert.notEqual(earlierLastDay, currentLastDay, "Earlier navigates to different recorded dates");
      assert.equal(await page.locator('[data-act="constellation-step"][data-step="-1"]').isEnabled(), true, "Later available after going back");
      await page.locator('[data-act="constellation-now"]').click();
      assert.equal(await page.locator('.orbit-journal__day').last().getAttribute('data-day'), currentLastDay, "Back to today restores current window");
      assert.equal(await page.locator('[data-act="constellation-step"][data-step="-1"]').isDisabled(), true, "Cannot navigate into future");
      assert.equal(await page.locator('.v5-timeline-preview').count(), 1, "Day-in-focus preview is visible");
      const firstTimelineDay = await page.locator('.orbit-journal__day').first().getAttribute('data-day');
      await page.locator('.v5-timeline-dates button').first().click();
      assert.equal(await page.locator('.v5-timeline-dates button').first().getAttribute('aria-pressed'), 'true', "Selecting a timeline day marks it active");
      assert.equal(await page.locator('.v5-timeline-preview [data-act="log"]').getAttribute('data-day'), firstTimelineDay, "Preview journal action targets selected day");
      await page.locator('.v5-timeline-preview [data-act="log"]').click();
      assert.equal(await page.locator('#sheet[open]').count(), 1, "Preview opens selected day journal");
      await page.locator('#sheet [data-act="close"]').click();


      assert.equal(await page.locator(".ritual-card").count(), 1, "Rituals visible on Today");
      await page.locator('[data-act="ritual-pick"][data-ritual="walk"]').click();
      await page.locator('[data-act="ritual-save"][data-result="better"]').click();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk" && x.result === "better")), true, "Ritual reflection recorded");
      await page.reload();
      await page.waitForFunction(() => !!window.__almanac, { timeout: 10000 }).catch(async error => { throw new Error(`App did not initialise after reload: ${error.message}; page errors: ${JSON.stringify(errors)}; page: ${page.url()}; scripts: ${await page.locator("script[src]").evaluateAll(els => els.map(e => e.src))}`); });
      assert.equal(await page.evaluate(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk" && x.result === "better")), true, "Ritual reflection persisted");
      await page.locator('[data-tab="insights"]').first().click();
      assert.equal(await page.locator(".v5-observation__row").count(), 3, "Observatory shows three dimensions");
      assert.equal(await page.locator(".v5-observation__cell").count(), 84, "Observatory has 28 days per dimension");
      assert.equal(await page.locator(".v5-observation__summary").count(), 3, "Each observed dimension has an explanatory summary");
      assert.equal(await page.locator('.v5-observation__coverage [role="progressbar"]').count(), 1, "Observatory exposes coverage progress");
      const coverage = Number(await page.locator('.v5-observation__coverage [role="progressbar"]').getAttribute('aria-valuenow'));
      assert.equal(coverage >= 0 && coverage <= 28, true, "Coverage is within valid day range");

      const todayIso = await page.evaluate(() => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); });
      await page.evaluate(iso => { const saved = window.__almanac.data; saved.logs[iso] = { ...(saved.logs[iso] || {}), pain: 0 }; }, todayIso);
      await page.locator('[data-tab="today"]').first().click();
      await page.locator('[data-tab="insights"]').first().click();
      assert.match(await page.locator(".v5-observation__row").nth(2).locator(".v5-observation__cell").last().getAttribute("aria-label"), /pain 0 of 3/, "Zero pain is a valid recorded observation");
      const currentObsDate = await page.locator(".v5-observation__row").first().locator(".v5-observation__cell").last().getAttribute("aria-label");
      await page.locator('[data-act="observatory-step"][data-step="1"]').click();
      assert.notEqual(await page.locator(".v5-observation__row").first().locator(".v5-observation__cell").last().getAttribute("aria-label"), currentObsDate, "Previous Observatory window shows earlier dates");
      assert.equal(await page.locator('[data-act="observatory-step"][data-step="-1"]').isEnabled(), true, "Next window enabled when browsing history");
      await page.locator('[data-act="observatory-timeline"]').click();
      assert.equal(await page.locator('.orbit-journal__day').count(), 28, "Historical Observatory opens 28-day Timeline");
      assert.equal(await page.locator('.orbit-journal__day').last().getAttribute('data-day'), await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 28); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); }), "Historical deep link preserves selected date window");
      await page.locator('[data-tab="insights"]').first().click();
      await page.locator('[data-act="observatory-step"][data-step="-1"]').click();
      assert.equal(await page.locator('[data-act="observatory-step"][data-step="-1"]').isDisabled(), true, "Observatory does not navigate into future");
      await page.locator('[data-act="observatory-timeline"]').click();
      assert.equal(await page.locator('.orbit-journal__day').count(), 28, "Observatory opens matching 28-day Living Timeline");
      assert.equal(await page.locator('[data-act="constellation-range"][data-days="28"]').getAttribute('aria-pressed'), 'true', "28-day window selected from Observatory");
      await page.locator('[data-tab="insights"]').first().click();


      assert.equal(await page.getByText(/felt better on 1 of 1 reflected occasions/i).count() > 0, true, "Insight reflects log");
      await page.locator('[data-tab="calendar"]').first().click();
      const date = page.locator('[data-act="cal-select"]').first();
      await date.click();
      assert.equal(await page.locator(".cal-detail").count(), 1, "Calendar day selection opens details");
      await page.locator('[data-act="cal-step"][data-step="1"]').click();
      assert.equal(await page.locator(".cal-detail").count(), 0, "Month change clears selection");
      await page.locator('[data-act="cal-today"]').click();
      assert.equal(await page.locator(".cal-detail").count(), 1, "Jump to today selects date");
      await page.locator('[data-act="settings"]').first().click();
      // Backup is a private local JSON download, including reflections.
      const exportButton = page.locator('[data-act="export"]');
      if (await exportButton.count()) {
        const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
        const backup = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
        assert.ok(Object.values(backup.rituals || {}).flat().some(x => x.id === "walk"), "Backup includes Rituals");
        // Restore the downloaded file after removing the reflection.
        await page.locator('[data-act="close"]').first().click();
        await page.locator('[data-tab="today"]').first().click();
        await page.locator('[data-act="ritual-pick"][data-ritual="walk"]').click();
        await page.locator('[data-act="ritual-remove"][data-ritual="walk"]').click();
        assert.equal(await page.evaluate(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk")), false, "Ritual removal works");
        await page.locator('[data-act="settings"]').first().click();
        page.once("dialog", dialog => dialog.accept());
        await page.locator('#in-file').setInputFiles({ name: "almanac-backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
        await page.waitForFunction(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk" && x.result === "better"));
        // Writes are debounced; wait for durable storage before testing a reload.
        await page.waitForFunction(() => { try { return Object.values(JSON.parse(localStorage.getItem("almanac.v1") || "{}").rituals || {}).flat().some(x => x.id === "walk" && x.result === "better"); } catch { return false; } });
        await page.reload();
        await page.waitForFunction(() => !!window.__almanac);
        assert.equal(await page.evaluate(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk" && x.result === "better")), true, "Backup restore persists");
      } else throw Error("Export button not found in settings");
      // Confirm the service worker has cached the shell before testing an offline reload.
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        await navigator.serviceWorker.controller || await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Service worker did not take control")), 10000);
          navigator.serviceWorker.addEventListener("controllerchange", () => { clearTimeout(timeout); resolve(); }, { once: true });
        });
      });
      await context.setOffline(true);
      await page.reload({ waitUntil: "load" });
      await page.waitForFunction(() => !!window.__almanac);
      assert.equal(await page.evaluate(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk" && x.result === "better")), true, "Offline reload preserves saved reflection");
      await page.locator('[data-tab="calendar"]').first().click();
      assert.equal(await page.locator('[data-act="cal-select"]').count() > 0, true, "Calendar works offline");
      await context.setOffline(false);
      // Essential navigation controls must expose an accessible name.
      const unnamedTabs = await page.locator('[data-tab]').evaluateAll(els => els.filter(el => {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        return !(el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim();
      }).map(el => el.outerHTML.slice(0, 200)));
      assert.deepEqual(unnamedTabs, [], "Navigation tabs have accessible names");
      assert.deepEqual(errors, [], "No uncaught browser errors");
      await context.close();
      console.log("PASS viewport", viewport.width);
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
