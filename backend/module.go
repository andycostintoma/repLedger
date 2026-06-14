package backend

import (
	"database/sql"
	"log/slog"

	"workout-tracker/backend/internal/training/app"
	"workout-tracker/backend/internal/training/outbound/postgres"
)

func NewApp(db *sql.DB, logger *slog.Logger) *app.App {
	// Driven adapters first, application second, inbound adapters are registered by cmd/server.
	catalogReadModel := postgres.NewCatalogReadModel(db)
	return app.New(catalogReadModel, logger)
}
