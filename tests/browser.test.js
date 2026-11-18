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
      assert.equal(await page.locator(".ritual-card").count(), 1, "Rituals visible on Today");
      await page.locator('[data-act="ritual-pick"][data-ritual="walk"]').click();
      await page.locator('[data-act="ritual-save"][data-result="better"]').click();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk" && x.result === "better")), true, "Ritual reflection recorded");
      await page.reload();
      await page.waitForFunction(() => !!window.__almanac, { timeout: 10000 }).catch(async error => { throw new Error(`App did not initialise after reload: ${error.message}; page errors: ${JSON.stringify(errors)}; page: ${page.url()}; scripts: ${await page.locator("script[src]").evaluateAll(els => els.map(e => e.src))}`); });
      assert.equal(await page.evaluate(() => Object.values(window.__almanac.data.rituals || {}).flat().some(x => x.id === "walk" && x.result === "better")), true, "Ritual reflection persisted");
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
