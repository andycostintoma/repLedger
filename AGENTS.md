# repLedger

Full-stack training PWA for the Health area.

## Agent Policy

- Follow `areas/health/AGENTS.md` and preserve Health area rules.
- Use the Go training service plus Postgres as the active backend. Do not add SQLite or Drizzle persistence.
- Keep V1 training-only: no nutrition, Fitbit, Cronometer, or Google Health integration.
- Keep V1 focused on reliable logging, catalog/template editing, and volume math.
- Do not add automatic progression, live coaching, myo-reps, or deload/end-of-meso logic unless the user explicitly expands scope.

## Product Target

- Build toward "my own RP app for my system": mobile-first, dark UI, dense logging flow, fast tap targets, and app-like navigation.
- Use RP Hypertrophy as UX inspiration for screen intent and information architecture, not as the source of training logic.
- Primary screens: `Workout`, `Mesos`, `Templates`, `Exercises`.
- Prefer RP-style training flows over generic CRUD/dashboard layouts when they do not conflict with local training rules.

## Stack

- Root layout: `backend/`, `frontend/`, `proto/`, plus root orchestration files.
- Backend: Go 1.26, Postgres, Atlas, sqlc, gRPC.
- Frontend: SvelteKit + TypeScript, Bun, Svelte remote functions, plain Tailwind CSS, `neverthrow` for BFF Result-style errors.
- Shared contracts: protobuf definitions under `proto/`; generated Go proto files under `backend/pb/`.
- Local wiring: root `docker-compose.yml` runs Postgres and the Go training service.

## Architecture Rules

### Backend

- Keep backend code in the single Go module under `backend/`.
- Dependency direction: inbound gRPC -> app commands/queries -> domain + outbound Postgres adapters.
- Domain rules live in `backend/internal/training/domain/`.
- Use cases live in `backend/internal/training/app/{command,query}/`.
- Postgres adapters live in `backend/internal/training/outbound/postgres/`.
- All handwritten Postgres SQL belongs in `backend/internal/training/outbound/postgres/queries.sql` and must be consumed through generated sqlc methods. Do not put SQL strings in Go adapter files.
- Built-in exercise families are canonical domain taxonomy/rules in Go code. Store user exercise references/overrides in DB (`family_id`, muscle coefficients), not the built-in family definitions.
- Go code targets 1.26: use `new(value)` for value pointers instead of temporary locals or pointer-conversion helpers.

### Frontend

- SvelteKit is a BFF and presentation layer only.
- Dependency direction: routes/remotes -> `frontend/src/lib/server/training/module.ts` -> outbound gRPC client -> Go service.
- Do not put domain rules, use-case handlers, repositories, SQL, Drizzle, SQLite, or direct Postgres access in the frontend.
- Keep frontend training model code limited to presentation/BFF DTOs and validation constants in `$lib/training/model.ts`.
- Put service transport code under `frontend/src/lib/server/training/outbound/grpc/`.
- Use server `load` functions for initial page data and remote functions for typed app-internal mutations/reads.
- Use form actions only when a plain form-native flow is simpler; reserve `+server.ts` routes for concrete HTTP/API needs.
- Keep backend access server-only.
- Prefer small route-local components; promote UI/helpers to `$lib/ui/` or `$lib/training/` only after reuse is real.
- Prefer URL params/search params and SvelteKit shallow routing for durable tab/detail/modal state.
- Avoid broad `components`, `utils`, or wildcard barrel files.

## V1 Training Rules

- Support only regular sets and myo-match.
- Do not require RIR for logging.
- Do not log myo-match mini-set reps.
- Myo-match set equivalents: `1 -> 1.0`, `2 -> 2.5`, `3 -> 4.5`, `4 -> 7.0`, `5 -> 10.0`.
- Regular sets count normally.
- Count volume by actual muscle using the Go backend training domain as the source of truth.
- Exercise coefficients are coarse V1 values: `0`, `0.5`, `0.75`, `1.0`.
- Feedback should affect proposed next-session suggestions, not mutate the current workout live.
- Show session effective volume, week-to-date volume, previous performance, and feedback summaries as facts.
