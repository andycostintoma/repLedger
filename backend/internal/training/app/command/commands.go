package command

import (
	"context"
	"fmt"

	"workout-tracker/backend/internal/training/domain"
)

type Store interface {
	LogSet(ctx context.Context, cmd LogSet) error
	SaveExerciseFeedback(ctx context.Context, cmd SaveExerciseFeedback) error
	SaveMuscleFeedback(ctx context.Context, cmd SaveMuscleFeedback) error
	SaveSuggestion(ctx context.Context, cmd SaveSuggestion) error
	FinishWorkout(ctx context.Context, cmd FinishWorkout) error
	CreateMesocycle(ctx context.Context, cmd CreateMesocycle) (string, error)
	CreateTemplateMesocycle(ctx context.Context, cmd CreateTemplateMesocycle) (string, error)
	CreateExercise(ctx context.Context, cmd CreateExercise) (string, error)
	UpdateExerciseName(ctx context.Context, cmd UpdateExerciseName) error
	UpdateExerciseCoefficients(ctx context.Context, cmd UpdateExerciseCoefficients) error
}

type LogSet struct {
	SessionID          string
	TemplateExerciseID string
	SetIndex           int
	LoadText           string
	Reps               int
	Notes              *string
	Pain               *int
}

type SaveExerciseFeedback struct {
	SessionID          string
	TemplateExerciseID string
	PainAfter          *int
	Notes              *string
}

type SaveMuscleFeedback struct {
	SessionID string
	Muscle    domain.MuscleGroup
	Soreness  *int
	Pump      *int
	Workload  *string
	Notes     *string
}

type SaveSuggestion struct {
	SessionID  string
	Muscle     domain.MuscleGroup
	Suggestion string
	Status     string
}

type FinishWorkout struct {
	SessionID string
}

type CreateMesocycle struct {
	Name           string
	Weeks          int
	DaysPerWeek    int
	Status         string
	TemplateMesoID *string
}

type CreateTemplateMesocycle struct {
	Name        string
	Category    string
	Frequency   string
	Gender      string
	Weeks       int
	DaysPerWeek int
}

type CreateExercise struct {
	Name          string
	PrimaryMuscle domain.MuscleGroup
	Equipment     string
	FamilyID      *string
	Coefficients  []domain.ExerciseMuscleCoefficient
}

type UpdateExerciseName struct {
	ExerciseID string
	Name       string
}

type UpdateExerciseCoefficients struct {
	ExerciseID   string
	FamilyID     *string
	Coefficients []domain.ExerciseMuscleCoefficient
}

type VoidHandler[C any] struct {
	store Store
	name  string
	call  func(context.Context, Store, C) error
}

func NewVoidHandler[C any](store Store, name string, call func(context.Context, Store, C) error) VoidHandler[C] {
	return VoidHandler[C]{store: store, name: name, call: call}
}

func (h VoidHandler[C]) Handle(ctx context.Context, cmd C) error {
	if err := h.call(ctx, h.store, cmd); err != nil {
		return fmt.Errorf("%s: %w", h.name, err)
	}
	return nil
}

type CreateHandler[C any] struct {
	store Store
	name  string
	call  func(context.Context, Store, C) (string, error)
}

func NewCreateHandler[C any](store Store, name string, call func(context.Context, Store, C) (string, error)) CreateHandler[C] {
	return CreateHandler[C]{store: store, name: name, call: call}
}

func (h CreateHandler[C]) Handle(ctx context.Context, cmd C) (string, error) {
	id, err := h.call(ctx, h.store, cmd)
	if err != nil {
		return "", fmt.Errorf("%s: %w", h.name, err)
	}
	return id, nil
}
