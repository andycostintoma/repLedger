package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"google.golang.org/grpc"

	training "workout-tracker/backend"
	inboundgrpc "workout-tracker/backend/internal/training/inbound/grpc"
	"workout-tracker/backend/internal/training/outbound/postgres"
)

type config struct {
	GRPCAddr    string
	PostgresURL string
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg := loadConfig()
	if err := run(ctx, cfg, logger); err != nil {
		logger.Error("training service stopped", "error", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, cfg config, logger *slog.Logger) error {
	db, err := sql.Open("pgx", cfg.PostgresURL)
	if err != nil {
		return fmt.Errorf("opening postgres: %w", err)
	}
	defer db.Close()

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := db.PingContext(pingCtx); err != nil {
		return fmt.Errorf("pinging postgres: %w", err)
	}
	if err := postgres.SeedDefaultExercises(ctx, db); err != nil {
		return fmt.Errorf("seeding default exercises: %w", err)
	}

	app := training.NewApp(db, logger)
	grpcServer := grpc.NewServer()
	inboundgrpc.RegisterServer(app, grpcServer)

	listener, err := net.Listen("tcp", cfg.GRPCAddr)
	if err != nil {
		return fmt.Errorf("listening on %s: %w", cfg.GRPCAddr, err)
	}

	serveErr := make(chan error, 1)
	go func() {
		logger.Info("training service listening", "grpc_addr", cfg.GRPCAddr)
		serveErr <- grpcServer.Serve(listener)
	}()

	select {
	case <-ctx.Done():
		grpcServer.GracefulStop()
		return nil
	case err := <-serveErr:
		if errors.Is(err, grpc.ErrServerStopped) {
			return nil
		}
		return fmt.Errorf("serving grpc: %w", err)
	}
}

func loadConfig() config {
	return config{
		GRPCAddr:    env("GRPC_ADDR", ":9000"),
		PostgresURL: env("PG_URL", "postgres://training_user:training_pass@localhost:5432/training?sslmode=disable&search_path=training,public"),
	}
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
