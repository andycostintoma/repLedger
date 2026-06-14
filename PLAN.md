# Workout Tracker Plan

## Decisions Taken

- Repository layout stays: `backend/`, `frontend/`, `proto/`, plus root `docker-compose.yml` and `PLAN.md`.
- Backend is the source of truth for training domain logic: Go 1.26, Postgres, Atlas, sqlc, gRPC.
- Frontend is BFF + presentation only. It calls the Go service over gRPC from server-only code; the browser never calls gRPC directly.
- All Postgres SQL is authored in `backend/internal/training/outbound/postgres/queries.sql` and generated with sqlc. Go adapter files should call generated methods, not embed SQL strings.
- Built-in exercise families stay in Go domain code as canonical taxonomy/rules. DB stores exercise `family_id` references and muscle-coefficient overrides.
- Existing SQLite data should be preserved unless the user explicitly chooses to discard it.
- Generated Go proto and sqlc files are intended to be committed.

## Incomplete Work

### Data migration

- Decide whether to migrate old local SQLite data or reseed/backfill from source.
- If preserving data, write an explicit one-time migration/import tool that:
  - reads the old SQLite database,
  - writes Postgres through generated sqlc methods or Go commands,
  - verifies row counts and key relationships.
- Do not silently discard existing local logged sets.

### Product work

- Replace primary/secondary exercise-muscle editing with full per-muscle coefficients: `0`, `0.5`, `0.75`, `1.0`.
- Make templates editable.
- Seed the current split as real template sessions.
- Polish workout logging flow.
- Audit volume correctness against the health wiki rules and current split.
- Add progression suggestions only after logging and volume math are reliable.

### Test coverage

- Add Go tests for domain volume math, myo-match equivalents, family coefficient defaults, and feedback suggestion rules.
- Add app/adapter tests around command validation and Postgres persistence once migration shape stabilizes.
- Add frontend tests only around presentation/BFF mapping that is likely to regress.

## Known Tooling Notes

- Use Docker-based sqlc generation from repo root when native macOS sqlc fails: `docker run --rm -v "$PWD":/src -w /src/backend sqlc/sqlc:1.28.0 generate`.
- Atlas validates `backend/schema.sql` against a Docker dev database and can dry-run against the local Compose Postgres service.
