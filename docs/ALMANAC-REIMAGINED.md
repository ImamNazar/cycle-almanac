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
