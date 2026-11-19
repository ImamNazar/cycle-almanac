# Almanac 5.0 — Living Universe

Status: experimental development branch. **Do not merge or deploy until reviewed.**

## North star
Transform Almanac from a calendar-first cycle tracker into a private, navigable history of lived experience. The experience must be distinctive **and** faster to use than traditional tracking apps. Never imply that visual patterns are medical conclusions.

## Experience pillars
1. **Daily Studio** — a keyboard- and screen-reader-accessible guided check-in, with a one-tap quick log and optional detailed mode. Save through the existing validated log model.
2. **Living Timeline** — a navigable, zoomable view of real logged days, with empty dates clearly distinct from observations. No generated fake entries.
3. **Pattern Observatory** — descriptive comparisons over the user's own history with minimum sample sizes, missing-data labels, and no causal or diagnostic claims.
4. **Explore** — calm, evidence-aware educational cards and interactive explanations.
5. **Private Vault** — backup, restore, export, clear data, and clear explanations of local-only storage.

## Architecture
- Retain `almanac.v1` localStorage and existing data shape during transition. Introduce a pure adapter module for read-only timeline/pattern derivations.
- Extract interface sections into modules incrementally. No large-bang rewrite of cycle calculation logic.
- New interface components must be progressive enhancements, with a fully functional static fallback.
- No network analytics, account requirement, remote storage, trackers, or external health APIs.
- Preserve the cycle engine and all existing prediction uncertainty warnings. Never describe estimates as reliable contraception.

## Delivery stages
1. **Foundation**: architecture, feature flags, robust storage and regression tests.
2. **Daily Studio**: fast and detailed logging; existing data compatibility.
3. **Living Timeline**: responsive pan/zoom with keyboard and list alternatives.
4. **Pattern Observatory**: uncertainty-aware descriptive visualizations.
5. **Private Vault**: import/export validation and recovery flows.
6. **Polish and release**: real screenshots, mobile performance, reduced motion, contrast, offline, migration and end-to-end tests.

## Release gates
- Existing data round-trips unchanged; backed-up test data restores correctly.
- Existing cycle engine tests and mobile/desktop browser tests pass.
- No overflow, hidden controls or inaccessible interactions on narrow phones.
- Animations pause with reduced-motion and don't block input.
- Observed vs estimated vs missing data is always explicit.
- No merge/deployment without explicit approval.

## Release candidate checklist (2026-11-19)

**Automated verification:** GitHub Actions run #132 passed on commit `5943a73`. This is a development candidate, **not** a release approval.

### Implemented and automatically covered
- [x] One-tap check-ins and durable local storage status, including write-failure warnings.
- [x] Living Timeline, accessible date selection and Day in Focus.
- [x] Pattern Observatory with explicit missing days and coverage counts.
- [x] 320px / 390px / desktop browser coverage, reduced-motion checks and keyboard dock navigation.
- [x] Corrupt-storage protection, browser offline smoke tests and existing cycle-engine tests.
- [x] Review of overconfident fertility and temperature-related copy in Today, Calendar, visualizations and Learn.

### Manual release gates (not yet verified)
- [ ] Test actual iPhone Safari and Android Chrome with touch, screen reader and zoomed text.
- [ ] Confirm real-device contrast, focus order, virtual-keyboard behavior and 200% text resizing.
- [ ] Exercise offline reload, install-to-home-screen and reconnect on real devices.
- [ ] Import an actual *test* backup into a fresh browser profile; verify round-trip and recovery without risking personal data.
- [ ] Review remaining health copy and engine assumptions with qualified clinical expertise before describing the tracker as medically validated.
- [ ] Confirm performance on a lower-end phone and visually inspect animation smoothness.
- [ ] Obtain explicit approval for merge and deployment.

### Launch boundaries
The development branch and draft PR are **not** the live site. Do not merge, publish, or represent these manual gates as passed until independently verified.

## Hands-on preview script

The draft branch is **not** hosted at the public GitHub Pages URL. A reviewer needs a locally served checkout or a separately approved, isolated preview. Do not change Pages settings or merge to `main` just to preview.

Use disposable sample data, not private health records. On iPhone Safari and Android Chrome:

1. **First launch:** check onboarding, navigation, contrast and whether the Daily Studio makes sense without instructions.
2. **Check-in:** select and deselect mood, energy, pain (including explicit “none”) and flow; refresh and verify the chosen entries remain.
3. **Timeline:** switch 14/28 days, navigate backwards, choose a date, inspect Day in Focus and return to today. Verify no date button is obscured.
4. **Observatory:** compare an empty period with a recorded period. Ensure empty days do not look like zero scores and that the date range is obvious.
5. **Accessibility:** enable device text enlargement and reduced motion; test external keyboard focus, screen-reader labels and touch without precision tapping.
6. **Offline:** load the app online first, disconnect, reopen, save a disposable observation and reload while still offline.
7. **Data safety:** export disposable data, import into a fresh profile, verify matching entries; then clear test data and verify the app returns to a clean state.
8. **Performance:** test a lower-end phone, scroll through the longest screens and check that animations never block logging or navigation.

### Feedback capture
For each issue record device/browser, viewport or text-size setting, screen, expected behavior, actual behavior and a screenshot if appropriate. Never include private cycle data in screenshots or public issues.

### Decision
Only consider release after automated checks pass, critical manual issues are resolved, and the user explicitly approves merge and deployment.

### Isolated preview package
A separate `Package Almanac 5 preview` GitHub Actions workflow builds a downloadable `almanac-v5-preview.zip` artifact for this PR. This **does not host or deploy the site** and cannot modify GitHub Pages. After a successful workflow run, download the artifact from the run's Artifacts section and unzip it.

For local desktop review, serve the extracted directory over HTTP, for example `python3 -m http.server 8765`, and open `http://localhost:8765/`. Do not open `index.html` directly as a `file://` URL; service-worker behavior requires an appropriate secure origin. Testing on a separate phone requires an explicitly configured HTTPS preview host; localhost on a desktop is not a phone-accessible URL. Never upload real cycle data to preview services.
