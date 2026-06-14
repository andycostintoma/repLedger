package query

import (
	"context"
	"fmt"

	"workout-tracker/backend/internal/training/domain"
)

type CatalogReadModel interface {
	GetTrainingCatalog(ctx context.Context) (domain.TrainingCatalog, error)
	GetTodayWorkout(ctx context.Context) (domain.TodayWorkout, error)
}

type GetTrainingCatalog struct{}

type GetTrainingCatalogHandler struct {
	readModel CatalogReadModel
}

type GetTodayWorkout struct{}

type GetTodayWorkoutHandler struct {
	readModel CatalogReadModel
}

func NewGetTodayWorkoutHandler(readModel CatalogReadModel) GetTodayWorkoutHandler {
	return GetTodayWorkoutHandler{readModel: readModel}
}

func (h GetTodayWorkoutHandler) Handle(ctx context.Context, _ GetTodayWorkout) (domain.TodayWorkout, error) {
	workout, err := h.readModel.GetTodayWorkout(ctx)
	if err != nil {
		return domain.TodayWorkout{}, fmt.Errorf("getting today workout: %w", err)
	}
	return workout, nil
}

func NewGetTrainingCatalogHandler(readModel CatalogReadModel) GetTrainingCatalogHandler {
	return GetTrainingCatalogHandler{readModel: readModel}
}

func (h GetTrainingCatalogHandler) Handle(ctx context.Context, _ GetTrainingCatalog) (domain.TrainingCatalog, error) {
	catalog, err := h.readModel.GetTrainingCatalog(ctx)
	if err != nil {
		return domain.TrainingCatalog{}, fmt.Errorf("getting training catalog: %w", err)
	}
	return catalog, nil
}
