# Almanac Reimagined — Lively-inspired rebuild

Status: research + architecture baseline. New branch from production main; previous editorial redesign remains archived in its own draft PR. No merge or deployment.

## Reference research (22 November 2026)
- Official Lively site: https://livelycycle.com — period calendar, cycle syncing, pregnancy/postpartum, partner sharing, symptom patterns, historical dashboard, health markers, reports, journal, AI advisor.
- Independent walkthrough: https://screensdesign.com/showcase/lively-cycle-period-tracker — interactive Lively Board with Doing / Moving / Eating; grouped symptom logging; editable symptoms; custom dashboard sections; phase graphics and calendar.
- Google Play listing: https://play.google.com/store/apps/details?id=com.app.lively_app — personalized phase information and logging.

## Product positioning
A calm, joyful, inclusive, private-by-default cycle journal. Borrow interaction patterns and broad aesthetic principles only; original brand, icons, illustrations, typography, copy and layouts. Avoid claiming predictions are medically accurate or that a cycle determines mood, exercise capacity or nutritional needs.

## Experience principles
1. **One clear daily action**: today’s cycle status, optional check-in, relevant insight and three small discovery cards.
2. **Warm visual personality**: peach, apricot, lilac, rose, cream; rounded panels; custom botanical and abstract organic illustrations; friendly editorial headings; no legacy dark cosmic UI.
3. **Cycle information with uncertainty**: distinguish observed periods from estimates; allow irregular cycles, hormonal contraception and paused predictions.
4. **Flexible not prescriptive**: activities/food/movement are optional general wellness suggestions, not medical or nutritional rules.
5. **No pressure**: no streaks, gamified health guilt, mandatory partner sharing or paywalls.
6. **Local-only first**: never upload intimate health data; all optional sharing/export is user-initiated and explicitly scoped.
7. **Accessible**: responsive 320px+, semantic controls, keyboard navigation, screen reader announcements, high contrast, reduced motion.

## New information architecture
- Today: welcoming greeting, cycle card and timeline, fast check-in, personalized optional cards (Do / Move / Nourish / Rest), journal shortcut.
- Calendar: clear month grid, recorded vs estimated indicators, daily timeline and accessible day details.
- Log: quick mood, energy, flow, pain, sleep, symptoms, notes, BBT, LH and cervical mucus; customizable symptom list later.
- Insights: cycle length, period duration, symptom trends, observations, context and clear data sufficiency thresholds.
- Discover: four phases explained, evidence-aware health literacy, practical general wellness ideas.
- Settings: data export/import, privacy, notifications opt-in, prediction mode, accessibility, backup/restore.

## Features retained from Almanac
Existing offline engine and local storage; period estimates with uncertainty, daily mood/energy/pain/flow; symptoms and journal; calendar; cycle analytics; BBT and LH; observations; wellness rituals; export; learn content; backup/restore; sample data and onboarding. Preserve existing data schema and migration path.

## Feature roadmap
### Foundation
Original responsive shell, token system, navigation, component primitives, simple non-cosmic design. Keep engine and local data safe.
### Core
Today, Calendar, Log, Insights and Discover screens rebuilt as independent components. Eliminate duplicated V5 dashboard content; no hidden legacy interface as a substitute for rebuilding.
### Personalization
User-editable dashboard sections, favorite tips, custom symptoms, optional gentle reminders; maintain clear control over what is saved.
### Advanced (opt-in, after core)
Printable care reports, explicit privacy-safe selective sharing (no cloud by default), pregnancy/postpartum support only with separately researched medical content. Do not imply AI advisor exists without an actual privacy-preserving implementation.

## Technical approach
- Create separate assets/css/reimagined.css and assets/js/reimagined.js rather than stacking a fourth stylesheet over legacy visuals.
- Replace index shell and route rendering incrementally while retaining existing engine, storage and backup logic; test migrations with real and corrupted storage cases.
- A new entrypoint should use original SVG/vector illustrations and locally hosted fonts/assets only.
- Avoid external analytics and CDN scripts.
- Test 320/390/768/1280, offline, reduced-motion, keyboard, storage errors, navigation and data round-trip.

## Delivery gates
1. Architecture and original design system.
2. Interactive mobile-first shell + Today prototype.
3. Complete feature parity, including advanced logs and export.
4. Visual and accessibility review at every breakpoint.
5. All CI green and user approval before any merge/deployment.

## Safety boundaries
This is a tracking and reflection tool, not diagnosis, fertility confirmation or contraception. Ovulation estimates are not reliable birth control. Health suggestions should be qualified, nonjudgmental and evidence-aware.

## Whole-product parity standard (user-approved direction)
The Lively reference applies to the entire product, including:
- Navigation architecture, tab placement, wayfinding, back behavior and discoverability.
- Today/home composition, illustrations, cycle status, phase guidance and daily suggestions.
- Calendar interactions, month switching, dates, estimates and editing.
- Logging entry points, speed, grouped symptoms, editable preferences and history.
- Insights, reports, journal, wellness recommendations and personalization.
- Onboarding, empty states, settings, data controls, responsive behavior and transitions.

**Implementation requirement:** Do not declare a screen finished just because its colors match. Evaluate full user journeys, interaction density, hierarchy, responsive behavior, accessibility and original illustration quality. Do not copy Lively assets, exact screens or proprietary copy.

## Measurable improvements beyond reference
- Local-first with no account and no external analytics by default.
- Export/import, recovery and privacy controls in the primary settings flow.
- Clearly labeled estimates, uncertainty, and flexible prediction modes.
- Customizable symptom and dashboard choices; inclusive and nonjudgmental language.
- Works offline and on narrow screens; reduced motion and keyboard support.
- Evidence-aware suggestions with no false promise of health outcomes.

## Mandatory acceptance walkthrough
1. New user can understand and navigate every tab without onboarding completion.
2. Existing user data migrates unchanged; every recorded symptom, note and period remains accessible.
3. Log a day in under a few interactions, edit it, revisit it on the calendar, and see it in Insights.
4. Every screen works at 320, 390, 768 and 1280 pixels without overflow or inaccessible controls.
5. Reduced-motion, keyboard, and offline states are exercised by automated tests.
6. No deployment or merge before feature parity, visual review and explicit approval.

## Feature-parity audit — 22 November 2026

Compared the rebuilt `assets/js/reimagined.js` against the existing `assets/js/app.js` and engine. **A shared data schema does not mean the UI is at feature parity.**

| Capability | Reimagined status | Next action |
| --- | --- | --- |
| Five-tab Today / Calendar / Log / Insights / Discover | Implemented | Visual and keyboard review |
| Period, mood, energy, pain, symptoms, notes | Implemented | Test historical edits and reload |
| BBT, LH, cervical mucus | Implemented | Verify saved values, unit presentation and empty states |
| Cycle history, mood and symptom charts | Implemented | Validate interpretation with sparse data |
| First-run onboarding | Basic | Restore preference and cycle-length guidance |
| Backup export and import | Implemented | Additional malformed-data and restore tests |
| Offline engine and service worker | Present | Offline upgrade and cache tests |
| Personal rituals and reflections | **Not exposed** | Rebuild private ritual controls and summaries |
| Sample/demo mode | **Not exposed** | Add reversible sample mode without replacing real entries |
| Rich learning library and search | **Reduced** | Rebuild educational topic browser with source context |
| Custom dashboard / sections | **Not exposed** | Add section visibility preferences |
| Calendar export and printable report | **Not exposed** | Restore explicit user-initiated export |
| More detailed observation charts | **Not exposed** | Build BBT / LH / mucus visual summaries |
| Guided settings / age and cycle preferences | **Reduced** | Restore safely with validation |

### Release gates
- Do not merge until parity decisions are documented, the major missing core features are implemented or deliberately deferred, and a real visual review is complete.
- Preserve `almanac.v1` compatibility; never overwrite personal logs merely to show sample data.
- Keep medical estimates uncertain and never treat them as contraception guidance.


## Release-candidate gate review — 22 November 2026

**Current decision: candidate for hands-on review, not approved for release.** Latest tested commit `27cc487` passed verification #290 and packaging #87. These results cover scripted browser checks, not real-device usability, installation or comprehensive accessibility auditing.

### Verified automatically
- Navigation, logging, calendar, insights, discovery and settings across 320 / 390 / 768 / 1280 px test viewports.
- Invalid backup rejection, valid backup restore, storage-write failure rollback and demo isolation.
- Custom symptom handling, mood/symptom chart counts and reduced-motion page entrance.
- Offline service-worker reload with journal retained on the same browser/device.

### Manual checks required before release approval
- [ ] Install from a supported Android browser and verify launch icon, standalone navigation and offline reopen.
- [ ] On iPhone Safari, test Add to Home Screen, safe-area spacing, keyboard overlays, scrolling and offline reopen.
- [ ] Navigate all five tabs using keyboard alone; check focus visibility, dialog focus management and Escape behavior.
- [ ] Review with VoiceOver or TalkBack: form labels, status messages, calendar date labels and chart alternatives.
- [ ] Export a real backup, store it safely, restore into a separate test profile, and compare all journal entries.
- [ ] Verify upgrading an existing installation preserves `almanac.v1` data and refreshes cached assets.
- [ ] Inspect actual visual layouts and content on narrow phones and tablets, including long translated or user-defined labels.
- [ ] Decide whether calendar export / printable reports and richer onboarding are required for initial launch or explicitly deferred.
- [ ] Review all educational and prediction wording; do not present estimates as contraception or diagnosis.
- [ ] Obtain explicit approval before changing PR #7 from draft, merging or deploying.

### Release notes (draft)
Almanac Reimagined introduces a five-tab local-first cycle journal with configurable dashboard sections, optional observations, private reflections, custom symptoms, educational browsing, offline app shell and user-controlled backup import/export. Existing stored data must remain compatible; users should export a backup before any major upgrade.

### Rollback preparation
Keep the previous deployed commit identifiable. If a release has a serious regression, restore the previous app shell without clearing browser storage or changing the `almanac.v1` key. Confirm a rollback in a separate test profile before using it for real users.


### Final product walkthrough and release-readiness audit — 22 November 2026
- Reviewed implementation paths for all five tabs: Today onboarding and check-in; Calendar selection and estimates; Log entries and custom symptoms; Insights summaries; Discover search and educational cards.
- Fixed a Today onboarding state-integrity issue: if the browser rejects the save, the in-memory onboarding flag is restored instead of appearing complete until reload. Added a browser regression test that simulates storage failure.
- Existing automated coverage includes the five-tab responsive/focus sweep, offline reload, backup recovery, custom symptoms and invalid import rejection. Check CI for the latest commit before calling the release candidate verified.
- **Release remains blocked on hands-on device and assistive-technology checks** listed above; no real-device testing was performed by this audit.
- Keep PR #7 in draft. No merge or deployment until explicit approval.


## Real-device acceptance checklist — release gate

**Scope:** release candidate `816dc69` (Verify #316 and Package #100 passed). This checklist is **not evidence that any physical-device tests have run**. Use a dedicated test profile and fictional journal entries; never paste real health information into bug reports.

### Test setup
- [ ] Record device model, OS version, browser version, installed-app or browser mode, tester, test date, and result for each case.
- [ ] Open the development-branch preview in a separate staging/test environment, **not** the existing production GitHub Pages URL. If no staging URL is available, do not use the production site as a substitute.
- [ ] Prepare a disposable sample journal with at least two cycles, one custom symptom, a note, one temperature and an LH observation. Record the expected values for comparison.
- [ ] Save a backup to a secure location before changing or clearing any browser data. Do not reset storage on a real user's device.

### iPhone — Safari and Add to Home Screen
- [ ] In Safari, load staging, complete onboarding, open Today / Calendar / Log / Insights / Discover, and verify each screen is readable without horizontal scrolling.
- [ ] Use Safari Share → Add to Home Screen. Launch from the Home Screen and confirm the app opens with working navigation, icons and safe-area padding.
- [ ] Check 320–390 px equivalent narrow layouts, portrait/landscape rotation, keyboard appearance, date selection, and that Save and navigation controls are not obscured.
- [ ] Log an entry, fully close and reopen the Home Screen app, and confirm the same entry remains.
- [ ] With the app successfully loaded once online, switch to Airplane Mode, reopen, visit all five tabs, and confirm previously saved entries remain visible. Restore connectivity and check for errors.

### Android — Chrome installation
- [ ] In Chrome, open staging, install via browser menu or install prompt when available, and verify app name/icon and standalone launch.
- [ ] Exercise all five tabs in portrait and landscape, especially bottom navigation, long labels, Calendar day selection, and Settings dialog.
- [ ] Log and edit a sample entry, force-close and reopen the installed app, and verify persistence.
- [ ] After one online load, disable Wi-Fi and mobile data, reopen and navigate all five tabs. Reconnect and verify updates do not erase entries.
- [ ] Confirm device back navigation and browser history do not trap the user or unexpectedly discard an unsaved note.

### Backup, restore, and upgrades
- [ ] Export the disposable test journal; confirm the downloaded JSON contains the expected test entries and settings.
- [ ] Import into a **separate test profile/device** and confirm dates, flow, notes, custom symptoms, observations, and settings match the source. Import replaces current entries; confirm warning is visible.
- [ ] Attempt an invalid JSON backup; confirm the app rejects it and preserves existing journal entries.
- [ ] With a disposable corrupted-storage test profile, verify a valid backup restores successfully and a misleading empty export is blocked before recovery.
- [ ] Upgrade an existing installed test build to the new service-worker version. Confirm fresh UI assets load online, cached shell opens offline, and `almanac.v1` data survives. Never clear production browser data for this test.

### Accessibility — keyboard, VoiceOver and TalkBack
- [ ] Navigate all five tabs with an external keyboard: logical Tab order, visible focus, no focus traps, main-content focus after tab changes.
- [ ] Open Settings, move focus within it, close with Escape and the Close button, and confirm focus returns to a sensible location.
- [ ] With iPhone VoiceOver and Android TalkBack, inspect navigation labels and active-tab announcements; calendar date/selection labels; input labels and errors; check-in selections; charts and text alternatives; and backup status messages.
- [ ] Increase device text size and enable bold text or display zoom where available; verify content remains usable without clipping.
- [ ] Enable Reduce Motion and confirm no essential information depends on animation.
- [ ] Check contrast in bright and dim conditions, with particular attention to muted labels and selection states.

### Five-tab functional sign-off
- [ ] Today: onboarding, dashboard cards, quick check-in and optional display preferences.
- [ ] Calendar: previous/next month, today jump, selected date, recorded versus estimated markers and explanatory caveats.
- [ ] Log: all choices, notes, custom symptoms, temperature/LH/mucus observations, edit existing entry and reload.
- [ ] Insights: correct summaries and observation history for the sample data; no unsupported fertility certainty.
- [ ] Discover: search, no-results state, open/close educational topics and long text at narrow widths.

### Evidence and release decision
For each device/test case record **Pass / Fail / Blocked / Not run**, screenshot or short reproduction steps for failures (with fictional data only), and a linked GitHub issue if needed. **No unchecked item counts as passed.** Block release for data loss, failed restore, broken offline reopening, inaccessible primary navigation or major mobile clipping. Record any accepted minor issues explicitly.

**Current decision: NOT READY FOR RELEASE APPROVAL** until these manual gates are signed off. Keep PR #7 draft; no merge or deployment without explicit user authorization.
