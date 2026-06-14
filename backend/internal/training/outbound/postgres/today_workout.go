package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"strings"

	"workout-tracker/backend/internal/training/domain"
	"workout-tracker/backend/internal/training/outbound/postgres/sqlc"
)

func (r CatalogReadModel) GetTodayWorkout(ctx context.Context) (domain.TodayWorkout, error) {
	todaySession, err := r.todaySession(ctx)
	if err != nil {
		return domain.TodayWorkout{}, err
	}
	if todaySession.id == "" {
		return domain.TodayWorkout{Name: "No workout planned", Status: "planned"}, nil
	}

	plannedExercises, err := r.plannedExercises(ctx, todaySession.templateID)
	if err != nil {
		return domain.TodayWorkout{}, err
	}
	sets, err := r.allLoggedSets(ctx, todaySession.id)
	if err != nil {
		return domain.TodayWorkout{}, err
	}
	exerciseFeedback, err := r.exerciseFeedback(ctx, todaySession.id)
	if err != nil {
		return domain.TodayWorkout{}, err
	}
	muscleFeedback, err := r.allMuscleFeedback(ctx, todaySession.id)
	if err != nil {
		return domain.TodayWorkout{}, err
	}
	suggestions, err := r.suggestions(ctx, todaySession.id)
	if err != nil {
		return domain.TodayWorkout{}, err
	}

	volumeExercises := make([]domain.VolumeExercise, 0, len(plannedExercises))
	setRefs := make([]domain.LoggedSetRef, 0, len(sets))
	for _, set := range sets {
		setRefs = append(setRefs, domain.LoggedSetRef{TemplateExerciseID: set.templateExerciseID})
	}

	planned := make([]domain.PlannedExercise, 0, len(plannedExercises))
	for _, exercise := range plannedExercises {
		coefficients, err := r.coefficientMap(ctx, exercise.exerciseID, exercise.primaryMuscle)
		if err != nil {
			return domain.TodayWorkout{}, err
		}
		volumeExercises = append(volumeExercises, domain.VolumeExercise{TemplateExerciseID: exercise.templateExerciseID, Method: exercise.method, Coefficients: coefficients})
		previousPerformance, err := r.previousPerformance(ctx, exercise.exerciseID, todaySession.id)
		if err != nil {
			return domain.TodayWorkout{}, err
		}
		planned = append(planned, domain.PlannedExercise{
			ID:                  exercise.templateExerciseID,
			ExerciseID:          exercise.exerciseID,
			Name:                exercise.name,
			Equipment:           exercise.equipment,
			Method:              exercise.method,
			ProgrammedSets:      exercise.programmedSets,
			TargetRepRange:      exercise.targetRepRange,
			PreviousPerformance: previousPerformance,
			PrimaryMuscle:       exercise.primaryMuscle,
			LoggedSets:          setsForExercise(sets, exercise.templateExerciseID),
			Feedback:            exerciseFeedback[exercise.templateExerciseID],
		})
	}

	muscles := domain.MusclesForExercises(volumeExercises)
	feedback := make([]domain.MuscleFeedback, 0, len(muscles))
	for _, muscle := range muscles {
		if saved, ok := muscleFeedback[muscle]; ok {
			feedback = append(feedback, saved)
			continue
		}
		feedback = append(feedback, domain.MuscleFeedback{Muscle: muscle})
	}

	status := todaySession.status
	if status != "completed" && len(sets) > 0 {
		status = "in-progress"
	}

	return domain.TodayWorkout{
		ID:             todaySession.templateID,
		SessionID:      todaySession.id,
		Name:           todaySession.name,
		Date:           todaySession.trainingDate,
		Status:         status,
		Exercises:      planned,
		Muscles:        muscles,
		VolumeFacts:    domain.BuildMuscleVolumeFacts(volumeExercises, setRefs, nil),
		MuscleFeedback: feedback,
		Suggestions:    suggestions,
	}, nil
}

type plannedExerciseRow struct {
	templateExerciseID string
	exerciseID         string
	name               string
	primaryMuscle      domain.MuscleGroup
	equipment          string
	method             domain.TrainingMethod
	programmedSets     int
	targetRepRange     string
}

type loggedSetRow struct {
	templateExerciseID string
	set                domain.LoggedSet
}

type todaySessionRow struct {
	id           string
	templateID   string
	name         string
	trainingDate *string
	status       string
}

func (r CatalogReadModel) todaySession(ctx context.Context) (todaySessionRow, error) {
	row, err := r.queries.GetTodaySession(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return todaySessionRow{}, nil
		}
		return todaySessionRow{}, fmt.Errorf("getting today's session: %w", err)
	}
	return todaySessionRow{id: row.ID, templateID: row.TemplateID, name: row.Name, trainingDate: nullDatePtr(row.TrainingDate), status: row.Status}, nil
}

func (r CatalogReadModel) plannedExercises(ctx context.Context, templateID string) ([]plannedExerciseRow, error) {
	rows, err := r.queries.ListPlannedExercises(ctx, templateID)
	if err != nil {
		return nil, fmt.Errorf("listing planned exercises: %w", err)
	}

	exercises := make([]plannedExerciseRow, 0, len(rows))
	for _, row := range rows {
		exercise := plannedExerciseRow{
			templateExerciseID: row.TemplateExerciseID,
			exerciseID:         row.ExerciseID,
			name:               row.Name,
			primaryMuscle:      domain.MuscleGroup(row.PrimaryMuscle),
			equipment:          row.Equipment,
			method:             domain.TrainingMethod(row.Method),
			programmedSets:     int(row.ProgrammedSets),
			targetRepRange:     row.TargetRepRange,
		}
		exercises = append(exercises, exercise)
	}
	return exercises, nil
}

func (r CatalogReadModel) allLoggedSets(ctx context.Context, sessionID string) ([]loggedSetRow, error) {
	rows, err := r.queries.ListLoggedSetsBySession(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("listing logged sets: %w", err)
	}

	sets := make([]loggedSetRow, 0, len(rows))
	for _, row := range rows {
		sets = append(sets, loggedSetRow{templateExerciseID: row.TemplateExerciseID, set: domain.LoggedSet{SetIndex: int(row.SetIndex), LoadText: row.LoadText, Reps: int(row.Reps), Notes: nullStringPtr(row.Notes), Pain: nullInt32Ptr(row.Pain)}})
	}
	return sets, nil
}

func (r CatalogReadModel) exerciseFeedback(ctx context.Context, sessionID string) (map[string]*domain.ExerciseFeedback, error) {
	rows, err := r.queries.ListExerciseFeedbackBySession(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("listing exercise feedback: %w", err)
	}

	feedback := map[string]*domain.ExerciseFeedback{}
	for _, row := range rows {
		feedback[row.TemplateExerciseID] = &domain.ExerciseFeedback{PainAfter: nullInt32Ptr(row.PainAfter), Notes: nullStringPtr(row.Notes)}
	}
	return feedback, nil
}

func (r CatalogReadModel) allMuscleFeedback(ctx context.Context, sessionID string) (map[domain.MuscleGroup]domain.MuscleFeedback, error) {
	rows, err := r.queries.ListMuscleFeedbackBySession(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("listing muscle feedback: %w", err)
	}

	feedback := map[domain.MuscleGroup]domain.MuscleFeedback{}
	for _, row := range rows {
		key := domain.MuscleGroup(row.Muscle)
		feedback[key] = domain.MuscleFeedback{Muscle: key, Soreness: nullInt32Ptr(row.Soreness), Pump: nullInt32Ptr(row.Pump), Workload: nullStringPtr(row.Workload), Notes: nullStringPtr(row.Notes)}
	}
	return feedback, nil
}

func (r CatalogReadModel) suggestions(ctx context.Context, sessionID string) ([]domain.NextSessionSuggestion, error) {
	rows, err := r.queries.ListSuggestionsBySession(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("listing suggestions: %w", err)
	}

	suggestions := make([]domain.NextSessionSuggestion, 0, len(rows))
	for _, row := range rows {
		suggestions = append(suggestions, domain.NextSessionSuggestion{Muscle: domain.MuscleGroup(row.Muscle), Suggestion: row.Suggestion, Status: row.Status})
	}
	return suggestions, nil
}

func (r CatalogReadModel) coefficientMap(ctx context.Context, exerciseID string, fallback domain.MuscleGroup) (map[domain.MuscleGroup]float64, error) {
	rows, err := r.queries.ListCoefficientsForExercise(ctx, exerciseID)
	if err != nil {
		return nil, fmt.Errorf("listing exercise coefficients: %w", err)
	}

	coefficients := map[domain.MuscleGroup]float64{}
	for _, row := range rows {
		coefficients[domain.MuscleGroup(row.Muscle)] = row.Coefficient
	}
	if len(coefficients) == 0 {
		coefficients[fallback] = 1
	}
	return coefficients, nil
}

func (r CatalogReadModel) previousPerformance(ctx context.Context, exerciseID string, currentSessionID string) (string, error) {
	rows, err := r.queries.ListPreviousPerformance(ctx, sqlc.ListPreviousPerformanceParams{ExerciseID: exerciseID, ID: currentSessionID})
	if err != nil {
		return "", fmt.Errorf("getting previous performance: %w", err)
	}

	type row struct {
		sessionID, trainingDate, loadText string
		reps                              int
	}
	rowsByDate := make([]row, 0, len(rows))
	for _, data := range rows {
		item := row{sessionID: data.ID, trainingDate: data.TrainingDate.Time.Format("2006-01-02"), loadText: data.LoadText, reps: int(data.Reps)}
		rowsByDate = append(rowsByDate, item)
	}
	if len(rowsByDate) == 0 {
		return "No prior exact exercise logged", nil
	}
	lastDate := rowsByDate[len(rowsByDate)-1].trainingDate
	reps := []int{}
	load := "unknown load"
	for _, item := range rowsByDate {
		if item.trainingDate == lastDate {
			load = item.loadText
			reps = append(reps, item.reps)
		}
	}
	repTexts := make([]string, 0, len(reps))
	for _, rep := range reps {
		repTexts = append(repTexts, fmt.Sprint(rep))
	}
	return fmt.Sprintf("%s: %s x %s", lastDate, load, strings.Join(repTexts, ", ")), nil
}

func setsForExercise(sets []loggedSetRow, templateExerciseID string) []domain.LoggedSet {
	filtered := []domain.LoggedSet{}
	for _, set := range sets {
		if set.templateExerciseID == templateExerciseID {
			filtered = append(filtered, set.set)
		}
	}
	sort.Slice(filtered, func(i, j int) bool { return filtered[i].SetIndex < filtered[j].SetIndex })
	return filtered
}
