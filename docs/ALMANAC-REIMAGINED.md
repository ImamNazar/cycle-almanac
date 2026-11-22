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
