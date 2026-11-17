# Almanac · your cycle, season by season

A private, accurate menstrual cycle tracker that runs entirely in the browser.
Your period, fertile window and personal patterns are drawn as a landscape that
follows your cycle **and the real time of day**.

- **Private by design.** No account, no server, no analytics, no cookies. Everything
  you log is saved on your own device and never sent anywhere.
- **Honest about uncertainty.** Predictions are ranges, not a single date, and the app
  says so when it's only guessing.
- **Real facts, with sources.** Every number traces to ACOG, Mayo Clinic, the NHS or
  published research (listed in the app under Learn → Sources).
- **Works offline** and installs like an app on a phone.
- Plain HTML, CSS and JavaScript. No build step, no installs.

## What's inside

- **Today**: a living landscape (sky follows the clock, season follows your phase, the two hills are
  your hormones), your cycle ribbon, next-period range, fertile window, a **7-day outlook**, and
  **one-tap logging** of mood and the symptoms people commonly report in your current season.
- **Calendar**: periods, likely start window, fertile window and ovulation, all readable without relying on colour.
- **Insights**: your rhythm, a **cycle wheel** for this cycle, **cycle strips** for every past cycle,
  your own patterns by phase, gentle "worth mentioning to a clinician" notes, a printable
  **doctor summary** and calendar export.
- **Learn** (searchable, with jump links): **pictures** (cycle wheel, hormone chart, a uterus/ovary
  diagram for each season), **how-to guides** (temperature, LH tests, cervical mucus), **safety**
  (tampons, cups and toxic shock signs; PMS and PMDD; contraception and bleeding), **life stages**
  (first periods to menopause), myths and facts, when to see a doctor, a glossary, and sources.

---

## Put it online (GitHub Pages)

1. Go to <https://github.com/new>
   - Repository name: `cycle-almanac` (anything works)
   - **Public**
   - Leave "Add a README" **unticked**
   - **Create repository**
2. Click **uploading an existing file**.
3. Unzip the download. Open the folder and select **everything inside it**
   (`index.html`, `manifest.webmanifest`, `sw.js`, `README.md`, and the
   **`assets`** and **`tests`** folders), then **drag** them onto the page.

   > Drag them. Don't use "choose your files": the file picker skips folders, and
   > without `assets` the site shows up blank and unstyled.
   > Before committing, check the list includes things like `assets/css/style.css`,
   > `assets/js/engine.js` and `assets/fonts/…`.
4. Scroll down and click **Commit changes**.
5. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder
   `/ (root)` → **Save**.
6. After a minute or two it's live at
   `https://<your-username>.github.io/cycle-almanac/`

**Updating later:** drag the changed files into the repo again and commit. Because the
app works offline, a returning visitor sees the new version on their *next* visit, so
open the site, then close and reopen it (or refresh twice). If an installed phone app
still shows the old version, close it fully and reopen it.

---

## How the numbers are worked out

| Thing | How Almanac does it | Basis |
|---|---|---|
| Typical cycle | 21–35 days (adults), up to 45 (teens) | ACOG |
| Day 1 | First day of real bleeding (light flow or more). Spotting alone doesn't start a cycle | Standard definition |
| Next period | Mean of your last 6 cycles with an **80% prediction interval** from how much they vary (`mean ± t·s·√(1+1/n)`). Under 3 cycles → wider, labelled "rough guess" | Statistics; checked by simulation (below) |
| Ovulation | About **14 days before the next period**, *not* "day 14". Replaced by your own evidence (LH test, or the temperature "3-over-6" rule) when you log it, and it learns your personal luteal length | Bull 2019 (luteal ≈ 12.4 d), Lenton 1984 (≈ 14 d) |
| Fertile window | 5 days before ovulation + ovulation day (6 days) | Sperm survive up to 5 days; egg 12–24 h; Wilcox 1995 |
| Hormone hills | Schematic estrogen and progesterone shapes stretched to your cycle. **Not** your measured levels | Stricker 2006 reference ranges |
| Patterns | Averages of mood/energy/pain per phase from days *you* logged. States a pattern only with ≥ 4 days in each of two phases and a meaningful gap | — |
| "See a doctor" notes | ACOG / Mayo / FIGO thresholds. Nothing is diagnosed | — |

**Calibration check.** In a simulation of 24,000 people (cycle variability 1.5–6 days),
the "likely range" contained the real next cycle **82–84%** of the time once 3+ cycles
were logged, and **78%** for the rougher 1–2 cycle estimate, so "about 8 times in 10"
is accurate. Run it yourself: `node tests/engine.test.js`.

### Things it deliberately does *not* do
- It is **not contraception.** Calendar-based fertile-window estimates are unreliable.
  This is stated wherever a fertile window appears.
- It does **not** diagnose anything.
- With **hormonal contraception** it hides phases and fertile windows (many methods
  change ovulation). During **pregnancy/postpartum** you can pause predictions.
- It does not send notifications (a static site can't do that privately).

### Be aware
- Browsers can clear saved site data. **Safari may remove it if you don't visit for
  about a week**, unless the app is added to the Home Screen. Settings has a one-tap
  backup and restore.
- Calendar (.ics) events you add are visible to anyone who shares that calendar.

---

## Editing the content

All wording and facts are in **`assets/js/content.js`** (phases, myths, warning signs,
sources). Reference numbers (cycle ranges, ovulation offset) are in `REF` at the top of
`assets/js/engine.js`. If you change a fact, change its source note too.

## Tests

```
node tests/engine.test.js
```
37 checks: date maths (including daylight-saving days), period detection, predictions,
the calibration simulation, ovulation evidence, phases, flags, and example data.

## Files

```
index.html            the app shell
manifest.webmanifest  makes it installable
sw.js                 offline support
assets/js/engine.js   all the cycle logic (pure, tested)
assets/js/content.js  all the words and facts
assets/js/scene.js    the landscape
assets/js/figures.js  every picture and icon (wheel, charts, diagrams)
assets/js/app.js      the interface
assets/css/style.css  the design
assets/fonts/         Fraunces + Figtree (SIL Open Font License)
tests/                engine tests
```

*Almanac is an information tool, not medical advice. If something worries you, or
your cycle changes, talk to a clinician.*
