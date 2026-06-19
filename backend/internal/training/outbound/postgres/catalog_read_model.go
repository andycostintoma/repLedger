package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"workout-tracker/backend/internal/training/domain"
	"workout-tracker/backend/internal/training/outbound/postgres/sqlc"
	trainingv1 "workout-tracker/backend/pb/training/v1"
)

type CatalogReadModel struct {
	db      *sql.DB
	queries *sqlc.Queries
}

func NewCatalogReadModel(db *sql.DB) CatalogReadModel {
	return CatalogReadModel{db: db, queries: sqlc.New(db)}
}

func (r CatalogReadModel) GetTrainingCatalog(ctx context.Context) (domain.TrainingCatalog, error) {
	exercises, err := r.listExercises(ctx)
	if err != nil {
		return domain.TrainingCatalog{}, err
	}

	templateMesocycles, err := r.listTemplateMesocycles(ctx)
	if err != nil {
		return domain.TrainingCatalog{}, err
	}

	mesocycles, err := r.listMesocycles(ctx)
	if err != nil {
		return domain.TrainingCatalog{}, err
	}

	return domain.TrainingCatalog{
		MuscleGroups:       append([]domain.MuscleGroup(nil), domain.MuscleGroups...),
		Exercises:          exercises,
		ExerciseFamilies:   exerciseFamilySummaries(),
		TemplateMesocycles: templateMesocycles,
		Mesocycles:         mesocycles,
	}, nil
}

func (r CatalogReadModel) listExercises(ctx context.Context) ([]domain.ExerciseSummary, error) {
	exerciseRows, err := r.queries.ListExercises(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing exercises: %w", err)
	}

	coefficientRows, err := r.queries.ListExerciseMuscleCoefficients(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing exercise muscle coefficients: %w", err)
	}
	coefficientsByExerciseID := map[string][]domain.ExerciseMuscleCoefficient{}
	for _, coefficient := range coefficientRows {
		if coefficient.Coefficient <= 0 {
			continue
		}
		coefficientsByExerciseID[coefficient.ExerciseID] = append(coefficientsByExerciseID[coefficient.ExerciseID], domain.ExerciseMuscleCoefficient{
			Muscle:      trainingv1.StringToMuscleGroup(coefficient.Muscle),
			Coefficient: coefficient.Coefficient,
		})
	}

	exercises := make([]domain.ExerciseSummary, 0, len(exerciseRows))
	for _, row := range exerciseRows {
		exercise := domain.ExerciseSummary{
			ID:                 row.ID,
			Name:               row.Name,
			PrimaryMuscle:      trainingv1.StringToMuscleGroup(row.PrimaryMuscle),
			Equipment:          row.Equipment,
			MuscleCoefficients: append([]domain.ExerciseMuscleCoefficient(nil), coefficientsByExerciseID[row.ID]...),
		}
		if row.FamilyID.Valid {
			exercise.FamilyID = new(row.FamilyID.String)
		}
		if len(exercise.MuscleCoefficients) == 0 {
			exercise.MuscleCoefficients = []domain.ExerciseMuscleCoefficient{{
				Muscle:      exercise.PrimaryMuscle,
				Coefficient: 1,
			}}
		}
		sortCoefficients(exercise.MuscleCoefficients)
		exercise.PrimaryMuscles = musclesWithCoefficient(exercise.MuscleCoefficients, 1)
		exercise.SecondaryMuscles = secondaryMuscles(exercise.MuscleCoefficients)
		if len(exercise.PrimaryMuscles) > 0 {
			exercise.PrimaryMuscle = exercise.PrimaryMuscles[0]
		}
		history, err := r.exerciseHistory(ctx, exercise.ID, exercise.Name)
		if err != nil {
			return nil, err
		}
		exercise.History = history
		exercises = append(exercises, exercise)
	}
	return exercises, nil
}

func (r CatalogReadModel) listTemplateMesocycles(ctx context.Context) ([]domain.TemplateMesocycleSummary, error) {
	rows, err := r.queries.ListTemplateMesocycles(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing template mesocycles: %w", err)
	}

	templates := make([]domain.TemplateMesocycleSummary, 0, len(rows))
	for _, row := range rows {
		templates = append(templates, domain.TemplateMesocycleSummary{
			ID:          row.ID,
			Name:        row.Name,
			Category:    row.Category,
			Frequency:   row.Frequency,
			Gender:      row.Gender,
			Weeks:       int(row.Weeks),
			DaysPerWeek: int(row.DaysPerWeek),
		})
	}
	return templates, nil
}

func (r CatalogReadModel) listMesocycles(ctx context.Context) ([]domain.MesocycleSummary, error) {
	rows, err := r.queries.ListMesocycles(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing mesocycles: %w", err)
	}

	mesocycles := make([]domain.MesocycleSummary, 0, len(rows))
	for _, row := range rows {
		mesocycle := domain.MesocycleSummary{
			ID:          row.ID,
			Name:        row.Name,
			Status:      row.Status,
			Weeks:       int(row.Weeks),
			DaysPerWeek: int(row.DaysPerWeek),
		}
		mesocycle.StartedAt = nullTimePtr(row.StartedAt)
		mesocycle.CompletedAt = nullTimePtr(row.CompletedAt)
		sessions, err := r.mesocycleSessions(ctx, mesocycle.ID)
		if err != nil {
			return nil, err
		}
		mesocycle.Sessions = sessions
		mesocycle.SessionCount = len(sessions)
		mesocycle.LatestSession = latestSessionLabel(sessions)
		mesocycles = append(mesocycles, mesocycle)
	}
	return mesocycles, nil
}

func exerciseFamilySummaries() []domain.ExerciseFamilySummary {
	families := make([]domain.ExerciseFamilySummary, 0, len(domain.ExerciseFamilies))
	for _, family := range domain.ExerciseFamilies {
		coefficients := coefficientsFromMap(family.Coefficients)
		families = append(families, domain.ExerciseFamilySummary{
			ID:           family.ID.StringVal(),
			Name:         family.ID.FriendlyString(),
			Category:     family.Category,
			Coefficients: coefficients,
			Notes:        family.Notes,
		})
	}
	return families
}

func (r CatalogReadModel) mesocycleSessions(ctx context.Context, mesocycleID string) ([]domain.MesocycleSessionSummary, error) {
	rows, err := r.queries.ListMesocycleSessions(ctx, sql.NullString{String: mesocycleID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("listing mesocycle sessions: %w", err)
	}

	sessions := make([]domain.MesocycleSessionSummary, 0, len(rows))
	for _, row := range rows {
		session := domain.MesocycleSessionSummary{
			ID:           row.ID,
			Name:         row.Name,
			Status:       row.Status,
			TrainingDate: nullDatePtr(row.TrainingDate),
			WeekNumber:   nullInt32Ptr(row.WeekNumber),
			DayNumber:    nullInt32Ptr(row.DayNumber),
			Source:       nullStringPtr(row.Source),
			Notes:        nullStringPtr(row.Notes),
		}
		exercises, err := r.sessionExercises(ctx, session.ID)
		if err != nil {
			return nil, err
		}
		session.Exercises = exercises
		for _, exercise := range exercises {
			session.TotalSets += len(exercise.Sets)
		}
		sessions = append(sessions, session)
	}
	return sessions, nil
}

func (r CatalogReadModel) sessionExercises(ctx context.Context, sessionID string) ([]domain.MesocycleExerciseSummary, error) {
	rows, err := r.queries.ListSessionExercises(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("listing session exercises: %w", err)
	}

	exercises := make([]domain.MesocycleExerciseSummary, 0, len(rows))
	for _, row := range rows {
		exercise := domain.MesocycleExerciseSummary{
			ID:             row.ID,
			Name:           row.Name,
			Equipment:      row.Equipment,
			PrimaryMuscle:  trainingv1.StringToMuscleGroup(row.PrimaryMuscle),
			Method:         trainingv1.StringToTrainingMethod(row.Method),
			TargetRepRange: row.TargetRepRange,
		}
		sets, err := r.loggedSets(ctx, sessionID, exercise.ID)
		if err != nil {
			return nil, err
		}
		exercise.Sets = sets
		exercises = append(exercises, exercise)
	}
	return exercises, nil
}

func (r CatalogReadModel) loggedSets(ctx context.Context, sessionID string, templateExerciseID string) ([]domain.LoggedSet, error) {
	rows, err := r.queries.ListLoggedSetsForExercise(ctx, sqlc.ListLoggedSetsForExerciseParams{SessionID: sessionID, TemplateExerciseID: templateExerciseID})
	if err != nil {
		return nil, fmt.Errorf("listing logged sets: %w", err)
	}

	sets := make([]domain.LoggedSet, 0, len(rows))
	for _, row := range rows {
		sets = append(sets, domain.LoggedSet{SetIndex: int(row.SetIndex), LoadText: row.LoadText, Reps: int(row.Reps), Notes: nullStringPtr(row.Notes), Pain: nullInt32Ptr(row.Pain)})
	}
	return sets, nil
}

func (r CatalogReadModel) exerciseHistory(ctx context.Context, exerciseID string, exerciseName string) ([]domain.ExerciseHistoryEntry, error) {
	normalizedName := normalizeExerciseName(exerciseName)
	rows, err := r.queries.ListExerciseHistory(ctx, sqlc.ListExerciseHistoryParams{ID: exerciseID, Name: normalizedName})
	if err != nil {
		return nil, fmt.Errorf("listing exercise history: %w", err)
	}

	bySession := map[string][]domain.ExerciseHistoryEntry{}
	order := []string{}
	for _, row := range rows {
		entry := domain.ExerciseHistoryEntry{
			SessionID:   row.ID,
			WorkoutName: row.WorkoutName,
			LoadText:    row.LoadText,
			Reps:        int(row.Reps),
			SetIndex:    int(row.SetIndex),
		}
		entry.Label = sessionLabel(row.TrainingDate, row.WeekNumber, row.DayNumber, entry.SessionID)
		if _, ok := bySession[entry.SessionID]; !ok {
			order = append(order, entry.SessionID)
		}
		bySession[entry.SessionID] = append(bySession[entry.SessionID], entry)
	}
	history := []domain.ExerciseHistoryEntry{}
	for _, sessionID := range order {
		history = append(history, pickTopHistorySet(bySession[sessionID]))
	}
	return history, nil
}

func musclesWithCoefficient(coefficients []domain.ExerciseMuscleCoefficient, coefficient float64) []domain.MuscleGroup {
	muscles := []domain.MuscleGroup{}
	for _, item := range coefficients {
		if item.Coefficient == coefficient {
			muscles = append(muscles, item.Muscle)
		}
	}
	return muscles
}

func secondaryMuscles(coefficients []domain.ExerciseMuscleCoefficient) []domain.MuscleGroup {
	muscles := []domain.MuscleGroup{}
	for _, item := range coefficients {
		if item.Coefficient > 0 && item.Coefficient < 1 {
			muscles = append(muscles, item.Muscle)
		}
	}
	return muscles
}

func sortCoefficients(coefficients []domain.ExerciseMuscleCoefficient) {
	order := map[domain.MuscleGroup]int{}
	for index, muscle := range domain.MuscleGroups {
		order[muscle] = index
	}
	sort.Slice(coefficients, func(i, j int) bool {
		return order[coefficients[i].Muscle] < order[coefficients[j].Muscle]
	})
}

func coefficientsFromMap(values map[domain.MuscleGroup]float64) []domain.ExerciseMuscleCoefficient {
	coefficients := make([]domain.ExerciseMuscleCoefficient, 0, len(values))
	for muscle, coefficient := range values {
		coefficients = append(coefficients, domain.ExerciseMuscleCoefficient{Muscle: muscle, Coefficient: coefficient})
	}
	sortCoefficients(coefficients)
	return coefficients
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return new(value.String)
}

func nullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *value, Valid: true}
}

func nullTimePtr(value sql.NullTime) *string {
	if !value.Valid {
		return nil
	}
	return new(value.Time.Format(time.DateOnly))
}

func nullDatePtr(value sql.NullTime) *string {
	return nullTimePtr(value)
}

func nullIntPtr(value sql.NullInt64) *int {
	if !value.Valid {
		return nil
	}
	return new(int(value.Int64))
}

func nullInt32Ptr(value sql.NullInt32) *int {
	if !value.Valid {
		return nil
	}
	return new(int(value.Int32))
}

func nullInt32(value *int) sql.NullInt32 {
	if value == nil {
		return sql.NullInt32{}
	}
	return sql.NullInt32{Int32: int32(*value), Valid: true}
}

func dateNullTime(value string) sql.NullTime {
	parsed, err := time.Parse(time.DateOnly, value)
	if err != nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: parsed, Valid: true}
}

func datePtrNullTime(value *string) sql.NullTime {
	if value == nil {
		return sql.NullTime{}
	}
	return dateNullTime(*value)
}

func latestSessionLabel(sessions []domain.MesocycleSessionSummary) *string {
	for index := len(sessions) - 1; index >= 0; index-- {
		session := sessions[index]
		if session.TrainingDate == nil {
			continue
		}
		week := ""
		if session.WeekNumber != nil {
			week = "W" + strconv.Itoa(*session.WeekNumber)
		}
		day := ""
		if session.DayNumber != nil {
			day = "D" + strconv.Itoa(*session.DayNumber)
		}
		prefix := strings.TrimSpace(strings.Join([]string{week, day}, " "))
		label := *session.TrainingDate
		if prefix != "" {
			label = prefix + " · " + label
		}
		return new(label)
	}
	return nil
}

func normalizeExerciseName(name string) string {
	fields := strings.FieldsFunc(strings.ToLower(name), func(r rune) bool {
		return !(r >= 'a' && r <= 'z' || r >= '0' && r <= '9')
	})
	return strings.Join(fields, " ")
}

func sessionLabel(trainingDate sql.NullTime, weekNumber sql.NullInt32, dayNumber sql.NullInt32, sessionID string) string {
	if trainingDate.Valid {
		return trainingDate.Time.Format(time.DateOnly)
	}
	parts := []string{}
	if weekNumber.Valid {
		parts = append(parts, "W"+strconv.Itoa(int(weekNumber.Int32)))
	}
	if dayNumber.Valid {
		parts = append(parts, "D"+strconv.Itoa(int(dayNumber.Int32)))
	}
	if len(parts) == 0 {
		return sessionID
	}
	return strings.Join(parts, " ")
}

func pickTopHistorySet(sets []domain.ExerciseHistoryEntry) domain.ExerciseHistoryEntry {
	sort.Slice(sets, func(i, j int) bool {
		loadI, okI := parseLoad(sets[i].LoadText)
		loadJ, okJ := parseLoad(sets[j].LoadText)
		if okI && okJ && loadI != loadJ {
			return loadI > loadJ
		}
		if okI != okJ {
			return okI
		}
		if sets[i].Reps != sets[j].Reps {
			return sets[i].Reps > sets[j].Reps
		}
		return sets[i].SetIndex < sets[j].SetIndex
	})
	return sets[0]
}

func parseLoad(loadText string) (float64, bool) {
	cleaned := strings.ReplaceAll(loadText, ",", ".")
	start := -1
	for index, r := range cleaned {
		if (r >= '0' && r <= '9') || r == '-' {
			start = index
			break
		}
	}
	if start < 0 {
		return 0, false
	}
	end := start
	for end < len(cleaned) {
		c := cleaned[end]
		if !(c >= '0' && c <= '9' || c == '.' || c == '-') {
			break
		}
		end++
	}
	value, err := strconv.ParseFloat(cleaned[start:end], 64)
	if err != nil {
		return 0, false
	}
	return value, true
}
