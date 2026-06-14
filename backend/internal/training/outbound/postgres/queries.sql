-- name: ListExercises :many
SELECT id, name, primary_muscle, family_id, equipment
FROM exercises
ORDER BY lower(name), id;

-- name: ListExerciseMuscleCoefficients :many
SELECT exercise_id, muscle, coefficient
FROM exercise_muscle_coefficients
ORDER BY exercise_id, muscle;

-- name: ListTemplateMesocycles :many
SELECT id, name, category, frequency, gender, weeks, days_per_week
FROM template_mesocycles
ORDER BY lower(name), id;

-- name: ListMesocycles :many
SELECT id, name, status, weeks, days_per_week, started_at, completed_at, template_meso_id
FROM mesocycles
ORDER BY CASE status WHEN 'current' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END, lower(name), id;

-- name: ListMesocycleSessions :many
SELECT s.id, COALESCE(w.name, s.template_id) AS name, s.training_date, s.status, s.week_number, s.day_number, s.source, s.notes
FROM sessions s
LEFT JOIN workout_templates w ON w.id = s.template_id
WHERE s.mesocycle_id = $1
ORDER BY COALESCE(s.week_number, 999), COALESCE(s.day_number, 999), COALESCE(s.training_date, '9999-12-31'), s.id;

-- name: ListSessionExercises :many
SELECT te.id, e.name, e.equipment, e.primary_muscle, te.method, te.target_rep_range
FROM sessions s
JOIN workout_template_exercises te ON te.template_id = s.template_id
JOIN exercises e ON e.id = te.exercise_id
WHERE s.id = $1
ORDER BY te.position;

-- name: ListLoggedSetsForExercise :many
SELECT set_index, load_text, reps, notes, pain
FROM logged_sets
WHERE session_id = $1 AND template_exercise_id = $2
ORDER BY set_index;

-- name: ListExerciseHistory :many
SELECT s.id, s.training_date, s.week_number, s.day_number, COALESCE(w.name, s.template_id) AS workout_name, l.load_text, l.reps, l.set_index
FROM logged_sets l
JOIN sessions s ON s.id = l.session_id
JOIN workout_template_exercises te ON te.id = l.template_exercise_id
JOIN exercises e ON e.id = te.exercise_id
LEFT JOIN workout_templates w ON w.id = s.template_id
WHERE e.id = $1 OR lower(regexp_replace(e.name, '[^a-z0-9]+', ' ', 'g')) = $2
ORDER BY COALESCE(s.training_date, '0001-01-01') DESC, s.week_number DESC NULLS LAST, s.day_number DESC NULLS LAST, l.set_index;

-- name: ListPlannedExercises :many
SELECT te.id AS template_exercise_id, e.id AS exercise_id, e.name, e.primary_muscle, e.equipment, te.method, te.programmed_sets, te.target_rep_range
FROM workout_template_exercises te
JOIN exercises e ON e.id = te.exercise_id
WHERE te.template_id = $1
ORDER BY te.position;

-- name: ListLoggedSetsBySession :many
SELECT template_exercise_id, set_index, load_text, reps, notes, pain
FROM logged_sets
WHERE session_id = $1
ORDER BY template_exercise_id, set_index;

-- name: ListExerciseFeedbackBySession :many
SELECT template_exercise_id, pain_after, notes
FROM exercise_feedback
WHERE session_id = $1;

-- name: ListMuscleFeedbackBySession :many
SELECT muscle, soreness, pump, workload, notes
FROM muscle_feedback
WHERE session_id = $1;

-- name: ListSuggestionsBySession :many
SELECT muscle, suggestion, status
FROM next_session_suggestions
WHERE session_id = $1
ORDER BY muscle;

-- name: GetTodaySession :one
SELECT s.id, s.template_id, COALESCE(w.name, s.template_id) AS name, s.training_date, s.status
FROM sessions s
JOIN mesocycles m ON m.id = s.mesocycle_id
LEFT JOIN workout_templates w ON w.id = s.template_id
WHERE m.status = 'current' AND s.status <> 'completed'
ORDER BY COALESCE(s.week_number, 999), COALESCE(s.day_number, 999), COALESCE(s.training_date, '9999-12-31'), s.created_at, s.id
LIMIT 1;

-- name: ListCoefficientsForExercise :many
SELECT muscle, coefficient
FROM exercise_muscle_coefficients
WHERE exercise_id = $1
ORDER BY muscle;

-- name: ListPreviousPerformance :many
SELECT s.id, s.training_date, l.load_text, l.reps
FROM logged_sets l
JOIN sessions s ON s.id = l.session_id
JOIN workout_template_exercises te ON te.id = l.template_exercise_id
WHERE te.exercise_id = $1 AND s.id <> $2 AND s.training_date IS NOT NULL
ORDER BY s.training_date, l.set_index;

-- name: UpsertLoggedSet :exec
INSERT INTO logged_sets (id, session_id, template_exercise_id, set_index, load_text, reps, notes, pain)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (session_id, template_exercise_id, set_index)
DO UPDATE SET load_text = EXCLUDED.load_text, reps = EXCLUDED.reps, notes = EXCLUDED.notes, pain = EXCLUDED.pain;

-- name: UpsertExerciseFeedback :exec
INSERT INTO exercise_feedback (id, session_id, template_exercise_id, pain_after, notes, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (session_id, template_exercise_id)
DO UPDATE SET pain_after = EXCLUDED.pain_after, notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at;

-- name: UpsertMuscleFeedback :exec
INSERT INTO muscle_feedback (id, session_id, muscle, soreness, pump, workload, notes, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (session_id, muscle)
DO UPDATE SET soreness = EXCLUDED.soreness, pump = EXCLUDED.pump, workload = EXCLUDED.workload, notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at;

-- name: UpsertSuggestion :exec
INSERT INTO next_session_suggestions (id, session_id, muscle, suggestion, status, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (session_id, muscle)
DO UPDATE SET suggestion = EXCLUDED.suggestion, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

-- name: FinishWorkout :exec
UPDATE sessions
SET status = 'completed', training_date = $1, updated_at = $2
WHERE id = $3;

-- name: MarkSessionInProgress :exec
UPDATE sessions
SET status = 'in-progress', updated_at = $1
WHERE id = $2 AND status = 'planned';

-- name: GetTemplateMesocycle :one
SELECT id, name, category, frequency, gender, weeks, days_per_week
FROM template_mesocycles
WHERE id = $1;

-- name: ListWorkoutTemplatesForMesocycle :many
SELECT id, name, rotation_order
FROM workout_templates
ORDER BY rotation_order, id;

-- name: InsertMesocycle :exec
INSERT INTO mesocycles (id, name, status, weeks, days_per_week, started_at, completed_at, template_meso_id, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: InsertSession :exec
INSERT INTO sessions (id, mesocycle_id, template_id, week_number, day_number, training_date, status, notes, source, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);

-- name: InsertTemplateMesocycle :exec
INSERT INTO template_mesocycles (id, name, category, frequency, gender, weeks, days_per_week, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: InsertExercise :exec
INSERT INTO exercises (id, name, primary_muscle, family_id, equipment)
VALUES ($1, $2, $3, $4, $5);

-- name: UpdateExerciseName :execrows
UPDATE exercises
SET name = $2
WHERE id = $1;

-- name: UpdateExercisePrimaryAndFamily :execrows
UPDATE exercises
SET primary_muscle = $2, family_id = $3
WHERE id = $1;

-- name: DeleteExerciseMuscleCoefficients :exec
DELETE FROM exercise_muscle_coefficients
WHERE exercise_id = $1;

-- name: InsertExerciseMuscleCoefficient :exec
INSERT INTO exercise_muscle_coefficients (exercise_id, muscle, coefficient)
VALUES ($1, $2, $3)
ON CONFLICT (exercise_id, muscle)
DO UPDATE SET coefficient = excluded.coefficient;

-- name: GetTemplateExercisePrimary :one
SELECT e.name, e.primary_muscle
FROM workout_template_exercises te
JOIN exercises e ON e.id = te.exercise_id
WHERE te.id = $1;
