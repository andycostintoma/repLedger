package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"workout-tracker/backend/internal/training/domain"
	"workout-tracker/backend/internal/training/outbound/postgres/sqlc"
	trainingv1 "workout-tracker/backend/pb/training/v1"
)

type defaultExercise struct {
	id        string
	name      string
	familyID  trainingv1.ExerciseFamilyCode
	equipment trainingv1.Equipment
}

var defaultExercises = []defaultExercise{
	{id: "belt-squat", name: "Belt Squat", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SUPPORTED_SQUAT, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "leg-extension", name: "Leg Extension", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_KNEE_EXTENSION, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "walking-lunge-glute-focused", name: "Walking Lunge (glute focused)", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LUNGE_GLUTE_FOCUSED, equipment: trainingv1.Equipment_EQUIPMENT_BODYWEIGHT_LOADABLE},
	{id: "lying-leg-curl", name: "Lying Leg Curl", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_KNEE_FLEXION, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "belt-squat-rdl", name: "Belt Squat RDL", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_HINGE, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "machine-hip-thrust", name: "Machine Hip Thrust", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_THRUST, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "machine-hip-abduction", name: "Machine Hip Abduction", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_ABDUCTION, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "pendulum-calf-raise", name: "Pendulum Calf Raise", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_STRAIGHT_LEG_CALF_RAISE, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "machine-crunch", name: "Machine Crunch", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LOADED_SPINAL_FLEXION, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "back-supported-hanging-leg-raise", name: "Back Supported Hanging Leg Raise", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LOADED_SPINAL_FLEXION, equipment: trainingv1.Equipment_EQUIPMENT_BODYWEIGHT_LOADABLE},
	{id: "15-degree-dumbbell-bench", name: "15° Dumbbell Bench", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HORIZONTAL_PRESS_FREE_PATH, equipment: trainingv1.Equipment_EQUIPMENT_DUMBBELL},
	{id: "machine-chest-flye", name: "Machine Chest Flye", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_CHEST_FLY, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "standing-dumbbell-overhead-press", name: "Standing Dumbbell Overhead Press", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ELBOWS_OUT_VERTICAL_PRESS, equipment: trainingv1.Equipment_EQUIPMENT_DUMBBELL},
	{id: "cable-pulldown", name: "Cable Pulldown", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_VERTICAL_PULL, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "lat-prayer", name: "Lat Prayer", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SHOULDER_EXTENSION_PULL, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "wide-grip-chest-supported-t-bar-row", name: "Wide Grip Chest Supported T-Bar Row", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ROW, equipment: trainingv1.Equipment_EQUIPMENT_MACHINE},
	{id: "flexion-cable-row", name: "Flexion Cable Row", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_FLEXION_ROW, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "rope-facepull", name: "Rope Facepull", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIGH_ROW, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "trap-bar-shrug", name: "Trap Bar Shrug", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SHRUG, equipment: trainingv1.Equipment_EQUIPMENT_BARBELL},
	{id: "cable-cross-body-lateral-raise", name: "Cable Cross Body Lateral Raise", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LATERAL_RAISE, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "cable-reverse-fly", name: "Cable Reverse Fly", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_REAR_DELT_FLY, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "cable-bayesian-curl", name: "Cable Bayesian Curl", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ELBOW_FLEXION, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "incline-dumbbell-hammer-curl", name: "Incline Dumbbell Hammer Curl", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BRACHIALIS_CURL, equipment: trainingv1.Equipment_EQUIPMENT_DUMBBELL},
	{id: "cable-overhead-extension", name: "Cable Overhead Extension", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_OVERHEAD_TRICEPS_EXTENSION, equipment: trainingv1.Equipment_EQUIPMENT_CABLE},
	{id: "dumbbell-bench-wrist-curl", name: "Dumbbell Bench Wrist Curl", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_WRIST_FLEXION, equipment: trainingv1.Equipment_EQUIPMENT_DUMBBELL},
	{id: "dumbbell-bench-wrist-extension", name: "Dumbbell Bench Wrist Extension", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_WRIST_EXTENSION, equipment: trainingv1.Equipment_EQUIPMENT_DUMBBELL},
	{id: "dumbbell-reverse-curl", name: "Dumbbell Reverse Curl", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BRACHIORADIALIS_CURL, equipment: trainingv1.Equipment_EQUIPMENT_DUMBBELL},
	{id: "neck-curl", name: "Neck Curl", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_NECK_FLEXION, equipment: trainingv1.Equipment_EQUIPMENT_BODYWEIGHT_LOADABLE},
	{id: "neck-extension", name: "Neck Extension", familyID: trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_NECK_EXTENSION, equipment: trainingv1.Equipment_EQUIPMENT_BODYWEIGHT_LOADABLE},
}

func SeedDefaultExercises(ctx context.Context, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("beginning default exercise seed transaction: %w", err)
	}
	defer rollback(tx)

	queries := sqlc.New(db).WithTx(tx)
	for _, exercise := range defaultExercises {
		if err := seedDefaultExercise(ctx, queries, exercise); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func seedDefaultExercise(ctx context.Context, queries *sqlc.Queries, exercise defaultExercise) error {
	family := domain.GetExerciseFamily(exercise.familyID.StringVal())
	if family == nil {
		return fmt.Errorf("unknown default exercise family %s", exercise.familyID.StringVal())
	}
	primary, err := primaryMuscle(family.Coefficients)
	if err != nil {
		return fmt.Errorf("default exercise %s: %w", exercise.id, err)
	}

	inserted, err := queries.InsertDefaultExercise(ctx, sqlc.InsertDefaultExerciseParams{ID: exercise.id, Name: exercise.name, PrimaryMuscle: primary.StringVal(), FamilyID: sql.NullString{String: exercise.familyID.StringVal(), Valid: true}, Equipment: exercise.equipment.StringVal()})
	if err != nil {
		return fmt.Errorf("inserting default exercise %s: %w", exercise.id, err)
	}
	if inserted == 0 {
		return nil
	}

	for muscle, coefficient := range family.Coefficients {
		if err := queries.InsertDefaultExerciseMuscleCoefficient(ctx, sqlc.InsertDefaultExerciseMuscleCoefficientParams{ExerciseID: exercise.id, Muscle: muscle.StringVal(), Coefficient: coefficient}); err != nil {
			return fmt.Errorf("inserting default exercise coefficient %s/%s: %w", exercise.id, muscle.StringVal(), err)
		}
	}
	return nil
}

func primaryMuscle(coefficients map[domain.MuscleGroup]float64) (domain.MuscleGroup, error) {
	for _, muscle := range domain.MuscleGroups {
		if coefficients[muscle] == 1 {
			return muscle, nil
		}
	}
	return 0, fmt.Errorf("choose at least one muscle with coefficient 1.0")
}
