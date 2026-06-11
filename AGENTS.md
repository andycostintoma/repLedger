# Workout Tracker

This is the SvelteKit training PWA for the Health area.

## Agent Policy

- Follow `areas/health/AGENTS.md` and preserve Health area rules.
- Never modify `../raw/` sources unless the user explicitly asks.
- Store generated/local app data under `../ops/data/training/`.
- Use SQLite as the primary datastore.
- Keep V1 training-only: no nutrition, Fitbit, Cronometer, or Google Health integration.
- Keep the first implementation focused on reliable logging and volume math.
- Do not add automatic progression, live coaching, myo-reps, or deload/end-of-meso logic in V1 unless the user explicitly expands scope.

## Product Target

- Build this app to mirror the RP Hypertrophy app as closely as practical for a single-user local app, while using the user's own training rules and data model.
- Match the RP app's mobile-first feel, dense logging flow, fast tap targets, dark UI, and app-like navigation instead of a generic dashboard/web form layout.
- Treat the RP app as the reference for information architecture and interaction patterns:
  - `Workout` tab for today's workout and fast set logging.
  - `Mesos` tab for current and past mesocycles, with calendar-style inspection by week/day.
  - `Templates` tab for viewing and creating template mesos.
  - `Exercises` tab for viewing and creating exercises, filters, and exercise history.
- Prefer RP-style flows where the user can get from opening the app to logging a set with minimal friction.
- Mirror the RP app's screen intent and navigation structure before adding extra custom features.
- When there is a tradeoff between generic CRUD simplicity and the RP-style training flow, prefer the RP-style flow unless it conflicts with an explicit local rule in this file or `../wiki/` protocols.
- Use the RP app as UX inspiration, not as a source of training logic. Training logic must follow the user's locked rules in this repo.
- Keep adapting the app toward "my own RP app for my system" rather than a generic workout tracker.

## Stack

- SvelteKit + TypeScript with strict settings.
- Bun as the runtime/server and package manager.
- Drizzle ORM with SQLite.
- Plain Tailwind CSS for styling.
- `neverthrow` for explicit Result-style error handling in app/domain/db helpers.
- Use server `load` functions for initial page data.
- Use Svelte remote functions as the default for typed app-internal reads and writes.
- Use form actions only when a plain form-native flow is simpler.
- Do not add SvelteKit server routes by default; reserve `+server.ts` routes for concrete HTTP/API needs.

## Coding Rules

- Prefer small route-local components until reuse is obvious.
- Keep database access server-only.
- Keep real database and domain logic in server-only modules under `src/lib/server/`.
- Prefer explicit domain types and discriminated union errors.
- Avoid `throw` in app/domain/db helpers; return `Result` or `ResultAsync` instead.
- Allow SvelteKit boundary control flow such as redirects only at route/action boundaries.
- Feedback should affect proposed next-session suggestions, not mutate the current workout live.

## Architecture Rules

- Structure backend training code as a small modular monolith: inbound SvelteKit routes/remote functions call app commands/queries, app code calls pure domain policy and outbound SQLite adapters.
- Keep dependency direction one-way: `routes`/remote adapters -> `src/lib/server/training/module.ts` -> `app/commands` or `app/queries` -> `domain` plus outbound repository/read-model interfaces.
- Put pure training rules in `src/lib/server/training/domain/`; domain modules must not import Drizzle, SvelteKit, `$app/*`, or database schema.
- Put use-case orchestration in `src/lib/server/training/app/commands/` and `src/lib/server/training/app/queries/`; one file per command/query unless a use case is genuinely tiny and coupled.
- Put Drizzle/SQLite persistence and row mapping under `src/lib/server/training/outbound/sqlite/`; do not leak Drizzle schema types into routes, remote functions, or domain policy.
- Keep seed data isolated under `src/lib/server/training/seeds/` or explicit seed scripts. Do not add new lazy seeding inside normal query/command handlers.
- Use `src/lib/server/training/module.ts` as the composition root for route and remote imports. Avoid importing SQL implementation files directly from SvelteKit routes or `.remote.ts` files.
- Split frontend by SvelteKit routes first: `workout`, `mesos`, `templates`, and `exercises` are app screens, with route-local `.svelte` components colocated beside the route.
- Promote UI/helpers to `$lib/ui/` or client-safe `$lib/training/` only after reuse is real. Avoid broad `components`, `utils`, or wildcard barrel files.
- Prefer URL params/search params and SvelteKit shallow routing for durable tab/detail/modal state instead of manual `window.history` handling.

## V1 Training Rules

- Support only regular sets and myo-match.
- Do not require RIR for logging.
- Do not log myo-match mini-set reps.
- Use the V1 myo-match set-equivalent table:
  - 1 programmed myo-match set = 1.0
  - 2 programmed myo-match sets = 2.5
  - 3 programmed myo-match sets = 4.5
  - 4 programmed myo-match sets = 7.0
  - 5 programmed myo-match sets = 10.0
- Regular sets count normally.
- Count volume by actual muscle using coefficients seeded from `../wiki/protocols/mesocycle-week-1-working-plan.md`.
- Show session effective volume, week-to-date volume, previous performance, and feedback summaries as facts.
