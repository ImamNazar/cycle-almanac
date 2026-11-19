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
