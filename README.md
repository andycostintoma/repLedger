# repLedger

A personal, mobile-first strength-training app for logging workouts and making training volume visible.

repLedger focuses on the training ledger: exercises, sets, mesocycles, performance history, and effective volume per muscle. It is an early-stage, single-user project, not a production-ready hosted service.

## Current functionality

- Log regular and myo-match sets, then finish a workout.
- Organize training into mesocycles and session templates.
- Browse and create exercises with muscle assignments.
- View previous performance, session volume, and week-to-date volume.
- Record exercise and muscle feedback.
- Use a mobile-first SvelteKit interface with a PWA manifest.

The implementation is evolving. Template editing, full per-muscle coefficient editing, logging polish, and automated test coverage remain unfinished; see [PLAN.md](PLAN.md).

## Architecture

```text
Browser → SvelteKit server / BFF → gRPC → Go training service → PostgreSQL
```

The Go backend owns training rules and persistence. SvelteKit handles presentation and server-side transport; the browser does not connect directly to gRPC or PostgreSQL.

| Directory | Responsibility |
| --- | --- |
| `backend/` | Go 1.26 service, domain rules, commands/queries, PostgreSQL adapters |
| `frontend/` | SvelteKit, TypeScript, Tailwind CSS, Bun, PWA configuration |
| `proto/` | Shared protobuf contracts and generation configuration |

PostgreSQL queries are authored for sqlc; Atlas configuration and the database schema live in `backend/`.

## Run locally

Prerequisites: Docker with Compose, Bun, and a Node.js runtime compatible with the frontend tooling. Go 1.26 is needed only when running or testing the backend outside Docker. On Nix-managed machines, provide development tools through Nix rather than global package installs.

```sh
git clone https://github.com/andycostintoma/repLedger.git
cd repLedger
docker compose up --build -d
```

Compose starts PostgreSQL on port `5432` and the training gRPC service on port `9000`. The database schema is initialized on the first start of a fresh PostgreSQL volume; existing volumes are not automatically migrated. Default exercises are seeded by the backend at startup.

In a separate terminal:

```sh
cd repLedger/frontend
bun install --frozen-lockfile
bun run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

### Configuration

| Variable | Used by | Default |
| --- | --- | --- |
| `TRAINING_GRPC_ADDR` | SvelteKit server | `127.0.0.1:9000` |
| `GRPC_ADDR` | Go service | `:9000` |
| `PG_URL` | Go service | Local PostgreSQL `training` database; see `backend/cmd/server/main.go` |

Compose supplies the backend connection settings. Its database credentials and unencrypted gRPC transport are for trusted local development only; do not expose this setup publicly. PWA support does not imply offline workout persistence.

To stop services without deleting their data:

```sh
docker compose down
```

The Go module, frontend package, and Compose storage identifiers retain the original internal `workout-tracker` name. Keeping these stable avoids coupling the display-name change to a module or database migration.

## Development checks

```sh
# From backend/
go test ./...

# From frontend/
bun run check
bun run build
```

These are development checks, not a claim of comprehensive test coverage.

## Scope and roadmap

Near-term work is reliable logging, editable catalogs/templates, accurate muscle-volume accounting, and tests. Migration of older local SQLite logs remains an explicit decision; PostgreSQL is the active persistence layer, and existing logs should not be discarded implicitly.

Nutrition integrations, live coaching, and automatic progression are outside the current V1 scope. See [PLAN.md](PLAN.md) for the detailed backlog and [AGENTS.md](AGENTS.md) for architecture constraints.

## License

[MIT](LICENSE).
