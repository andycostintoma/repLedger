package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"workout-tracker/backend/internal/training/app/command"
	"workout-tracker/backend/internal/training/domain"
	"workout-tracker/backend/internal/training/outbound/postgres/sqlc"
)

func (r CatalogReadModel) LogSet(ctx context.Context, cmd command.LogSet) error {
	if cmd.SetIndex <= 0 {
		return errors.New("set index must be positive")
	}
	if strings.TrimSpace(cmd.LoadText) == "" {
		return errors.New("load is required")
	}
	if cmd.Reps < 0 {
		return errors.New("reps cannot be negative")
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer rollback(tx)
	queries := r.queries.WithTx(tx)
	if err := queries.UpsertLoggedSet(ctx, sqlc.UpsertLoggedSetParams{
		ID:                 fmt.Sprintf("%s-%s-%d", cmd.SessionID, cmd.TemplateExerciseID, cmd.SetIndex),
		SessionID:          cmd.SessionID,
		TemplateExerciseID: cmd.TemplateExerciseID,
		SetIndex:           int32(cmd.SetIndex),
		LoadText:           cmd.LoadText,
		Reps:               int32(cmd.Reps),
		Notes:              nullString(cmd.Notes),
		Pain:               nullInt32(cmd.Pain),
	}); err != nil {
		return fmt.Errorf("upserting logged set: %w", err)
	}
	if err := queries.MarkSessionInProgress(ctx, sqlc.MarkSessionInProgressParams{UpdatedAt: time.Now().UTC(), ID: cmd.SessionID}); err != nil {
		return fmt.Errorf("marking session in progress: %w", err)
	}
	return tx.Commit()
}

func (r CatalogReadModel) SaveExerciseFeedback(ctx context.Context, cmd command.SaveExerciseFeedback) error {
	now := time.Now().UTC()
	err := r.queries.UpsertExerciseFeedback(ctx, sqlc.UpsertExerciseFeedbackParams{
		ID:                 fmt.Sprintf("%s-%s", cmd.SessionID, cmd.TemplateExerciseID),
		SessionID:          cmd.SessionID,
		TemplateExerciseID: cmd.TemplateExerciseID,
		PainAfter:          nullInt32(cmd.PainAfter),
		Notes:              nullString(cmd.Notes),
		UpdatedAt:          now,
	})
	if err != nil {
		return fmt.Errorf("upserting exercise feedback: %w", err)
	}
	if cmd.PainAfter != nil && *cmd.PainAfter >= 4 {
		exerciseName, muscle, err := r.templateExercisePrimary(ctx, cmd.TemplateExerciseID)
		if err == nil {
			return r.upsertGeneratedSuggestion(ctx, cmd.SessionID, muscle, domain.BuildPainSuggestion(exerciseName, muscle, *cmd.PainAfter), "proposed")
		}
	}
	return nil
}

func (r CatalogReadModel) SaveMuscleFeedback(ctx context.Context, cmd command.SaveMuscleFeedback) error {
	if !domain.IsMuscleGroup(string(cmd.Muscle)) {
		return fmt.Errorf("unknown muscle group: %s", cmd.Muscle)
	}
	now := time.Now().UTC()
	err := r.queries.UpsertMuscleFeedback(ctx, sqlc.UpsertMuscleFeedbackParams{
		ID:        fmt.Sprintf("%s-%s", cmd.SessionID, cmd.Muscle),
		SessionID: cmd.SessionID,
		Muscle:    string(cmd.Muscle),
		Soreness:  nullInt32(cmd.Soreness),
		Pump:      nullInt32(cmd.Pump),
		Workload:  nullString(cmd.Workload),
		Notes:     nullString(cmd.Notes),
		UpdatedAt: now,
	})
	if err != nil {
		return fmt.Errorf("upserting muscle feedback: %w", err)
	}
	return r.upsertGeneratedSuggestion(ctx, cmd.SessionID, cmd.Muscle, domain.BuildMuscleFeedbackSuggestion(domain.MuscleFeedback{Muscle: cmd.Muscle, Soreness: cmd.Soreness, Pump: cmd.Pump, Workload: cmd.Workload}), "proposed")
}

func (r CatalogReadModel) SaveSuggestion(ctx context.Context, cmd command.SaveSuggestion) error {
	return r.upsertGeneratedSuggestion(ctx, cmd.SessionID, cmd.Muscle, cmd.Suggestion, cmd.Status)
}

func (r CatalogReadModel) FinishWorkout(ctx context.Context, cmd command.FinishWorkout) error {
	err := r.queries.FinishWorkout(ctx, sqlc.FinishWorkoutParams{TrainingDate: dateNullTime(localDateString()), UpdatedAt: time.Now().UTC(), ID: cmd.SessionID})
	if err != nil {
		return fmt.Errorf("completing workout: %w", err)
	}
	return nil
}

func (r CatalogReadModel) CreateMesocycle(ctx context.Context, cmd command.CreateMesocycle) (string, error) {
	name := strings.TrimSpace(cmd.Name)
	if name == "" {
		return "", errors.New("mesocycle name is required")
	}
	if cmd.Status != "current" && cmd.Status != "planned" && cmd.Status != "completed" {
		return "", fmt.Errorf("invalid mesocycle status: %s", cmd.Status)
	}
	weeks := cmd.Weeks
	daysPerWeek := cmd.DaysPerWeek
	if cmd.TemplateMesoID != nil {
		template, err := r.queries.GetTemplateMesocycle(ctx, *cmd.TemplateMesoID)
		if err != nil {
			return "", fmt.Errorf("getting template mesocycle: %w", err)
		}
		weeks = int(template.Weeks)
		daysPerWeek = int(template.DaysPerWeek)
	}
	if weeks <= 0 {
		return "", errors.New("weeks must be positive")
	}
	if daysPerWeek <= 0 {
		return "", errors.New("days per week must be positive")
	}
	id := slugWithTime(name)
	now := time.Now().UTC()
	var startedAt, completedAt *string
	today := localDateString()
	if cmd.Status == "current" {
		startedAt = new(today)
	} else if cmd.Status == "completed" {
		completedAt = new(today)
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer rollback(tx)
	queries := r.queries.WithTx(tx)
	if err := queries.InsertMesocycle(ctx, sqlc.InsertMesocycleParams{
		ID:             id,
		Name:           name,
		Status:         cmd.Status,
		Weeks:          int32(weeks),
		DaysPerWeek:    int32(daysPerWeek),
		StartedAt:      datePtrNullTime(startedAt),
		CompletedAt:    datePtrNullTime(completedAt),
		TemplateMesoID: nullString(cmd.TemplateMesoID),
		UpdatedAt:      now,
	}); err != nil {
		return "", fmt.Errorf("inserting mesocycle: %w", err)
	}
	if cmd.TemplateMesoID != nil {
		if err := r.createPlannedSessions(ctx, queries, id, weeks, daysPerWeek, now); err != nil {
			return "", err
		}
	}
	return id, tx.Commit()
}

func (r CatalogReadModel) createPlannedSessions(ctx context.Context, queries *sqlc.Queries, mesocycleID string, weeks int, daysPerWeek int, now time.Time) error {
	templates, err := queries.ListWorkoutTemplatesForMesocycle(ctx)
	if err != nil {
		return fmt.Errorf("listing workout templates: %w", err)
	}
	if len(templates) == 0 {
		return errors.New("cannot create sessions from template mesocycle without workout templates")
	}
	for week := 1; week <= weeks; week++ {
		for day := 1; day <= daysPerWeek; day++ {
			template := templates[((week-1)*daysPerWeek+day-1)%len(templates)]
			if err := queries.InsertSession(ctx, sqlc.InsertSessionParams{
				ID:           fmt.Sprintf("%s-w%02d-d%02d", mesocycleID, week, day),
				MesocycleID:  nullString(&mesocycleID),
				TemplateID:   template.ID,
				WeekNumber:   sql.NullInt32{Int32: int32(week), Valid: true},
				DayNumber:    sql.NullInt32{Int32: int32(day), Valid: true},
				TrainingDate: sql.NullTime{},
				Status:       "planned",
				Notes:        sql.NullString{},
				Source:       sql.NullString{String: "template", Valid: true},
				CreatedAt:    now,
				UpdatedAt:    now,
			}); err != nil {
				return fmt.Errorf("inserting planned session week %d day %d: %w", week, day, err)
			}
		}
	}
	return nil
}

func (r CatalogReadModel) CreateTemplateMesocycle(ctx context.Context, cmd command.CreateTemplateMesocycle) (string, error) {
	name := strings.TrimSpace(cmd.Name)
	if name == "" {
		return "", errors.New("template mesocycle name is required")
	}
	id := slugWithTime(name)
	err := r.queries.InsertTemplateMesocycle(ctx, sqlc.InsertTemplateMesocycleParams{ID: id, Name: name, Category: cmd.Category, Frequency: cmd.Frequency, Gender: cmd.Gender, Weeks: int32(cmd.Weeks), DaysPerWeek: int32(cmd.DaysPerWeek), UpdatedAt: time.Now().UTC()})
	return id, err
}

func (r CatalogReadModel) CreateExercise(ctx context.Context, cmd command.CreateExercise) (string, error) {
	name := strings.TrimSpace(cmd.Name)
	if name == "" {
		return "", errors.New("exercise name is required")
	}
	coefficients, primaryMuscle, familyID, err := buildCoefficientRows(cmd.FamilyID, cmd.Coefficients, cmd.PrimaryMuscle)
	if err != nil {
		return "", err
	}
	if familyID == nil {
		familyID = domain.SuggestExerciseFamilyID(name, cmd.Equipment)
	}
	id := slugWithTime(name)
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer rollback(tx)
	queries := r.queries.WithTx(tx)
	if err := queries.InsertExercise(ctx, sqlc.InsertExerciseParams{ID: id, Name: name, PrimaryMuscle: string(primaryMuscle), FamilyID: nullString(familyID), Equipment: cmd.Equipment}); err != nil {
		return "", fmt.Errorf("inserting exercise: %w", err)
	}
	if err := insertCoefficients(ctx, queries, id, coefficients); err != nil {
		return "", err
	}
	return id, tx.Commit()
}

func (r CatalogReadModel) UpdateExerciseName(ctx context.Context, cmd command.UpdateExerciseName) error {
	name := strings.TrimSpace(cmd.Name)
	if name == "" {
		return errors.New("exercise name is required")
	}
	count, err := r.queries.UpdateExerciseName(ctx, sqlc.UpdateExerciseNameParams{ID: cmd.ExerciseID, Name: name})
	if err != nil {
		return fmt.Errorf("updating exercise name: %w", err)
	}
	return requireAffected(count, "exercise not found")
}

func (r CatalogReadModel) UpdateExerciseCoefficients(ctx context.Context, cmd command.UpdateExerciseCoefficients) error {
	coefficients, primaryMuscle, familyID, err := buildCoefficientRows(cmd.FamilyID, cmd.Coefficients, "")
	if err != nil {
		return err
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer rollback(tx)
	queries := r.queries.WithTx(tx)
	count, err := queries.UpdateExercisePrimaryAndFamily(ctx, sqlc.UpdateExercisePrimaryAndFamilyParams{ID: cmd.ExerciseID, PrimaryMuscle: string(primaryMuscle), FamilyID: nullString(familyID)})
	if err != nil {
		return fmt.Errorf("updating exercise coefficients: %w", err)
	}
	if err := requireAffected(count, "exercise not found"); err != nil {
		return err
	}
	if err := queries.DeleteExerciseMuscleCoefficients(ctx, cmd.ExerciseID); err != nil {
		return fmt.Errorf("deleting exercise coefficients: %w", err)
	}
	if err := insertCoefficients(ctx, queries, cmd.ExerciseID, coefficients); err != nil {
		return err
	}
	return tx.Commit()
}

func (r CatalogReadModel) upsertGeneratedSuggestion(ctx context.Context, sessionID string, muscle domain.MuscleGroup, suggestion string, status string) error {
	if !domain.IsMuscleGroup(string(muscle)) {
		return fmt.Errorf("unknown muscle group: %s", muscle)
	}
	return r.queries.UpsertSuggestion(ctx, sqlc.UpsertSuggestionParams{ID: fmt.Sprintf("%s-%s", sessionID, muscle), SessionID: sessionID, Muscle: string(muscle), Suggestion: suggestion, Status: status, UpdatedAt: time.Now().UTC()})
}

func (r CatalogReadModel) templateExercisePrimary(ctx context.Context, templateExerciseID string) (string, domain.MuscleGroup, error) {
	row, err := r.queries.GetTemplateExercisePrimary(ctx, templateExerciseID)
	if err != nil {
		return "", "", err
	}
	return row.Name, domain.MuscleGroup(row.PrimaryMuscle), nil
}

func buildCoefficientRows(familyID *string, explicit []domain.ExerciseMuscleCoefficient, primary domain.MuscleGroup) ([]domain.ExerciseMuscleCoefficient, domain.MuscleGroup, *string, error) {
	coefficientMap := map[domain.MuscleGroup]float64{}
	normalizedFamilyID := normalizeFamilyID(familyID)
	if normalizedFamilyID != nil {
		if family := domain.GetExerciseFamily(*normalizedFamilyID); family != nil {
			for muscle, coefficient := range family.Coefficients {
				coefficientMap[muscle] = coefficient
			}
		}
	}
	if len(explicit) > 0 {
		coefficientMap = map[domain.MuscleGroup]float64{}
		for _, row := range explicit {
			if !domain.IsMuscleGroup(string(row.Muscle)) {
				return nil, "", nil, fmt.Errorf("unknown muscle group: %s", row.Muscle)
			}
			if row.Coefficient != 0.5 && row.Coefficient != 0.75 && row.Coefficient != 1 {
				return nil, "", nil, fmt.Errorf("invalid coefficient for %s", row.Muscle)
			}
			coefficientMap[row.Muscle] = row.Coefficient
		}
	}
	if len(coefficientMap) == 0 && primary != "" {
		if !domain.IsMuscleGroup(string(primary)) {
			return nil, "", nil, fmt.Errorf("unknown muscle group: %s", primary)
		}
		coefficientMap[primary] = 1
	}
	coefficients := coefficientsFromMap(coefficientMap)
	if len(coefficients) == 0 {
		return nil, "", nil, errors.New("choose at least one muscle coefficient")
	}
	var primaryMuscle domain.MuscleGroup
	for _, coefficient := range coefficients {
		if coefficient.Coefficient == 1 {
			primaryMuscle = coefficient.Muscle
			break
		}
	}
	if primaryMuscle == "" {
		return nil, "", nil, errors.New("choose at least one muscle with coefficient 1.0")
	}
	return coefficients, primaryMuscle, normalizedFamilyID, nil
}

func normalizeFamilyID(familyID *string) *string {
	if familyID == nil || strings.TrimSpace(*familyID) == "" {
		return nil
	}
	trimmed := strings.TrimSpace(*familyID)
	if !domain.IsExerciseFamilyID(trimmed) {
		return nil
	}
	return new(trimmed)
}

func insertCoefficients(ctx context.Context, queries *sqlc.Queries, exerciseID string, coefficients []domain.ExerciseMuscleCoefficient) error {
	for _, coefficient := range coefficients {
		if err := queries.InsertExerciseMuscleCoefficient(ctx, sqlc.InsertExerciseMuscleCoefficientParams{ExerciseID: exerciseID, Muscle: string(coefficient.Muscle), Coefficient: coefficient.Coefficient}); err != nil {
			return fmt.Errorf("inserting exercise coefficient: %w", err)
		}
	}
	return nil
}

func requireAffected(count int64, message string) error {
	if count == 0 {
		return errors.New(message)
	}
	return nil
}

func rollback(tx *sql.Tx) {
	_ = tx.Rollback()
}

var slugInvalidChars = regexp.MustCompile(`[^a-z0-9]+`)

func slugWithTime(value string) string {
	slug := strings.Trim(slugInvalidChars.ReplaceAllString(strings.ToLower(strings.TrimSpace(value)), "-"), "-")
	if slug == "" {
		slug = "item"
	}
	return fmt.Sprintf("%s-%s", slug, strconvTime())
}

func strconvTime() string {
	return strings.ToLower(strconv.FormatInt(time.Now().UnixMilli(), 36))
}

func localDateString() string {
	return time.Now().Format("2006-01-02")
}
