/* Browser smoke tests. Run: npm install --no-save playwright && npx playwright install chromium && node tests/browser.test.js */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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
    for (const viewport of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
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
      assert.equal(await page.locator('.al6-today').count(), 1, "Editorial Today experience renders");
      assert.equal(await page.locator('.al6-today__date').count(), 1, "Today shows a human-readable date");
      assert.equal(await page.locator('.al6-today__private').count(), 1, "Local privacy is clearly signposted");
      assert.equal(await page.locator('.al6-today__aside').count(), 1, "Editorial companion card renders");
      assert.match(await page.locator('#v5-portal-title').innerText(), /How are you feeling today/i, "New Today heading appears");
      assert.equal(await page.locator('.al6-today .v5-portal__action').count(), 3, "Journal, calendar and insights shortcuts remain available");
      assert.equal(await page.locator('.al6-today .v5-checkin__choice').count() > 10, true, "Working check-in choices remain visible");
      if (viewport.width <= 390) {
        const editorialBounds = await page.locator('.al6-today, .al6-today__layout, .al6-today__aside, .al6-today .v5-portal__actions').evaluateAll(els => els.map(el => {
          const rect = el.getBoundingClientRect(); return { cls: el.className, left: rect.left, right: rect.right, width: innerWidth };
        }));
        assert.equal(editorialBounds.every(x => x.left >= -2 && x.right <= x.width + 2), true, "Editorial mobile surfaces fit viewport: " + JSON.stringify(editorialBounds));
      }

      assert.equal(await page.locator('.al6-today__layout').evaluate(el => getComputedStyle(el).animationName), "none", "Today respects reduced-motion preference");
      // Keep actual rendered screenshots for human visual review of the draft PR.
      const shotDir = path.join("artifacts", "almanac-6-screens");
      fs.mkdirSync(shotDir, { recursive: true });
      await page.screenshot({ path: path.join(shotDir, `today-${viewport.width}.png`), fullPage: true });
      // Phase 3 editorial pages must remain reachable and preserve functional navigation.
      await page.locator('.dock__btn[data-tab="calendar"]').click();
      assert.equal(await page.locator('.al6-calendar').count(), 1, "Editorial Calendar renders");
      assert.equal(await page.locator('.al6-calendar .cal__head').evaluate(el => getComputedStyle(el).animationName), "none", "Calendar respects reduced-motion preference");
      if (viewport.width <= 390) {
        const calendarWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.equal(calendarWidth.scroll <= calendarWidth.viewport + 2, true, "Calendar must not overflow narrow viewports: " + JSON.stringify(calendarWidth));
      }
      await page.screenshot({ path: path.join(shotDir, `calendar-${viewport.width}.png`), fullPage: true });
      assert.equal(await page.locator('.al6-calendar [data-act="cal-step"]').count(), 2, "Month navigation remains available");
      await page.locator('.al6-calendar [data-act="cal-step"][data-step="1"]').click();
      assert.equal(await page.locator('.al6-calendar').count(), 1, "Calendar remains rendered after moving forward a month");
      await page.locator('.al6-calendar [data-act="cal-step"][data-step="-1"]').click();
      await page.locator('.dock__btn[data-tab="insights"]').click();
      assert.equal(await page.locator('.al6-insights-intro').count(), 1, "Editorial Insights intro renders");
      assert.equal(await page.locator('.al6-observation').count(), 1, "Recorded observations remain visible");
      await page.screenshot({ path: path.join(shotDir, `insights-${viewport.width}.png`), fullPage: true });
      await page.locator('.dock__btn[data-tab="today"]').click();
      // Fertility language must communicate uncertainty rather than guarantee safety.
      const predictionCopy = await page.locator('.status').first().innerText();
      assert.equal(/8 times in 10|fertile window has closed for this cycle/i.test(predictionCopy), false, "Prediction copy avoids unsupported certainty");

      if (viewport.width <= 390) {
        const geometry = await page.locator('.v5-portal, .v5-checkin, .dock').evaluateAll(els => els.map(el => {
          const r = el.getBoundingClientRect();
          return { className: el.className, left: r.left, right: r.right, width: innerWidth };
        }));
        assert.equal(geometry.every(g => g.left >= -2 && g.right <= g.width + 2), true, "Primary mobile surfaces fit within the viewport: " + JSON.stringify(geometry));
      }


      // Larger default text must not introduce horizontal page scrolling.
      if (viewport.width <= 390) {
        const originalFontSize = await page.locator('html').evaluate(el => el.style.fontSize);
        await page.locator('html').evaluate(el => { el.style.fontSize = '200%'; });
        const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.equal(overflow.document <= overflow.viewport + 2, true, "200% root text size does not cause horizontal overflow: " + JSON.stringify(overflow));
        await page.locator('html').evaluate((el, size) => { el.style.fontSize = size; }, originalFontSize);
      }
      assert.equal(await page.locator('.al6-today').evaluate(el => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'), true, "Editorial Today paper surface remains visible without motion");
      if (viewport.width < 720) {
        assert.equal(await page.locator('.v5-portal').evaluate(el => getComputedStyle(el, '::after').animationName), 'none', "Mobile disables decorative planet animation");
      }

      assert.equal(await page.locator('.dock__btn[aria-current="page"]').count(), 1, "Exactly one navigation tab is current");
      assert.equal(await page.locator('.dock__btn[data-tab="today"]').getAttribute('aria-current'), 'page', "Today navigation is announced as current");
      // Keyboard users must be able to reach and activate primary navigation.
      await page.locator('.dock__btn[data-tab="calendar"]').focus();
      assert.equal(await page.locator('.dock__btn[data-tab="calendar"]').evaluate(el => document.activeElement === el), true, "Calendar dock control accepts keyboard focus");
      await page.keyboard.press("Enter");
      assert.equal(await page.locator('.dock__btn[data-tab="calendar"]').getAttribute('aria-current'), 'page', "Enter activates the calendar");
      assert.equal(await page.locator('#page').evaluate(el => document.activeElement === el), true, "Navigation moves focus to main content");
      await page.locator('.dock__btn[data-tab="today"]').focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator('.dock__btn[data-tab="today"]').getAttribute('aria-current'), 'page', "Keyboard can return to Today");

      assert.equal(await page.locator('.dock__btn').first().evaluate(el => getComputedStyle(el).touchAction), 'manipulation', "Dock supports reliable touch activation");

      assert.equal(await page.locator('.v5-portal__action').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s', "Phase 3 interactions respect reduced motion");
      assert.equal(await page.locator('.v5-portal__action').first().evaluate(el => getComputedStyle(el, '::after').display), 'none', "Decorative shimmer is disabled under reduced motion");
      assert.equal(await page.locator('.v5-checkin__choice').first().evaluate(el => getComputedStyle(el).touchAction), 'manipulation', "Daily check-in is touch optimized");
      if (viewport.width <= 390) {
        const smallTargets = await page.locator('.v5-checkin__choice, .dock__btn, .v5-timeline-dates button').evaluateAll(els => els.filter(el => {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = el.getBoundingClientRect();
          return rect.width < 24 || rect.height < 24;
        }).map(el => ({ selector: el.className, label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })));
        assert.deepEqual(smallTargets, [], "Primary mobile controls meet 24px minimum target dimensions");
      }


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
      assert.match(await page.locator('.v5-portal__action--primary').innerText(), /Storage unavailable/, "Journal action also warns that the entry is not saved");
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
      // Offline mode must support new observations, not merely reading cached history.
      await page.locator('.dock__btn[data-tab="today"]').click();
      const offlineMood = page.locator('.v5-checkin__choice[data-k="mood"][data-v="4"]');
      const offlineWasSelected = await offlineMood.getAttribute('aria-pressed') === 'true';
      await offlineMood.click();
      await page.waitForFunction(() => document.querySelector('.v5-checkin__save')?.dataset.status === 'saved');
      const offlineExpected = !offlineWasSelected;
      await page.reload({ waitUntil: "load" });
      await page.waitForFunction(() => !!window.__almanac);
      assert.equal(await page.locator('.v5-checkin__choice[data-k="mood"][data-v="4"]').getAttribute('aria-pressed'), String(offlineExpected), "Offline observation survives offline reload");

      await context.setOffline(false);
      // Essential navigation controls must expose an accessible name.
      const unnamedTabs = await page.locator('[data-tab]').evaluateAll(els => els.filter(el => {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        return !(el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim();
      }).map(el => el.outerHTML.slice(0, 200)));
      assert.deepEqual(unnamedTabs, [], "Navigation tabs have accessible names");
      assert.deepEqual(errors, [], "No uncaught browser errors");
      // Corrupt saved data must not be silently overwritten or called saved.
      const corruptContext = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const corruptPage = await corruptContext.newPage();
      await corruptPage.addInitScript(() => {
        try { localStorage.setItem("almanac.v1", "{broken-json"); } catch {}
      });
      await corruptPage.goto("http://127.0.0.1:8765/", { waitUntil: "load" });
      await corruptPage.waitForFunction(() => !!window.__almanac);
      assert.equal(await corruptPage.evaluate(() => localStorage.getItem("almanac.v1")), "{broken-json", "Unreadable original data remains intact");
      // Onboarding may precede Daily Studio, so inspect its state after opting for sample data.
      await corruptPage.locator('[data-act="ob-sample"]').click();
      assert.equal(await corruptPage.locator(".v5-checkin__save").getAttribute("data-status"), "error", "Unreadable storage is never shown as saved");
      await corruptContext.close();

      await context.close();
      console.log("PASS viewport", viewport.width);
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
