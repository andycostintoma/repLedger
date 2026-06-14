package app

import (
	"context"
	"log/slog"

	"workout-tracker/backend/internal/training/app/command"
	"workout-tracker/backend/internal/training/app/query"
)

type App struct {
	Commands Commands
	Queries  Queries
}

type Commands struct {
	LogSet                     command.VoidHandler[command.LogSet]
	SaveExerciseFeedback       command.VoidHandler[command.SaveExerciseFeedback]
	SaveMuscleFeedback         command.VoidHandler[command.SaveMuscleFeedback]
	SaveSuggestion             command.VoidHandler[command.SaveSuggestion]
	FinishWorkout              command.VoidHandler[command.FinishWorkout]
	CreateMesocycle            command.CreateHandler[command.CreateMesocycle]
	CreateTemplateMesocycle    command.CreateHandler[command.CreateTemplateMesocycle]
	CreateExercise             command.CreateHandler[command.CreateExercise]
	UpdateExerciseName         command.VoidHandler[command.UpdateExerciseName]
	UpdateExerciseCoefficients command.VoidHandler[command.UpdateExerciseCoefficients]
}

type Queries struct {
	GetTrainingCatalog query.GetTrainingCatalogHandler
	GetTodayWorkout    query.GetTodayWorkoutHandler
}

func New(store interface {
	query.CatalogReadModel
	command.Store
}, _ *slog.Logger) *App {
	return &App{
		Commands: Commands{
			LogSet: command.NewVoidHandler(store, "logging set", func(ctx context.Context, s command.Store, c command.LogSet) error { return s.LogSet(ctx, c) }),
			SaveExerciseFeedback: command.NewVoidHandler(store, "saving exercise feedback", func(ctx context.Context, s command.Store, c command.SaveExerciseFeedback) error {
				return s.SaveExerciseFeedback(ctx, c)
			}),
			SaveMuscleFeedback: command.NewVoidHandler(store, "saving muscle feedback", func(ctx context.Context, s command.Store, c command.SaveMuscleFeedback) error {
				return s.SaveMuscleFeedback(ctx, c)
			}),
			SaveSuggestion: command.NewVoidHandler(store, "saving suggestion", func(ctx context.Context, s command.Store, c command.SaveSuggestion) error {
				return s.SaveSuggestion(ctx, c)
			}),
			FinishWorkout: command.NewVoidHandler(store, "finishing workout", func(ctx context.Context, s command.Store, c command.FinishWorkout) error {
				return s.FinishWorkout(ctx, c)
			}),
			CreateMesocycle: command.NewCreateHandler(store, "creating mesocycle", func(ctx context.Context, s command.Store, c command.CreateMesocycle) (string, error) {
				return s.CreateMesocycle(ctx, c)
			}),
			CreateTemplateMesocycle: command.NewCreateHandler(store, "creating template mesocycle", func(ctx context.Context, s command.Store, c command.CreateTemplateMesocycle) (string, error) {
				return s.CreateTemplateMesocycle(ctx, c)
			}),
			CreateExercise: command.NewCreateHandler(store, "creating exercise", func(ctx context.Context, s command.Store, c command.CreateExercise) (string, error) {
				return s.CreateExercise(ctx, c)
			}),
			UpdateExerciseName: command.NewVoidHandler(store, "updating exercise name", func(ctx context.Context, s command.Store, c command.UpdateExerciseName) error {
				return s.UpdateExerciseName(ctx, c)
			}),
			UpdateExerciseCoefficients: command.NewVoidHandler(store, "updating exercise coefficients", func(ctx context.Context, s command.Store, c command.UpdateExerciseCoefficients) error {
				return s.UpdateExerciseCoefficients(ctx, c)
			}),
		},
		Queries: Queries{
			GetTrainingCatalog: query.NewGetTrainingCatalogHandler(store),
			GetTodayWorkout:    query.NewGetTodayWorkoutHandler(store),
		},
	}
}
