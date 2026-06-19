package domain

import (
	"strings"

	trainingv1 "workout-tracker/backend/pb/training/v1"
)

type ExerciseFamilyCode = trainingv1.ExerciseFamilyCode

type ExerciseFamily struct {
	ID           ExerciseFamilyCode
	Name         string
	Category     string
	Coefficients map[MuscleGroup]float64
	Notes        *string
}

var ExerciseFamilies = []ExerciseFamily{
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_FREE_SQUAT, "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti:    1,
		MuscleGluteMax:      0.5,
		MuscleAdductors:     0.5,
		MuscleErectorSpinae: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SUPPORTED_SQUAT, "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti: 1,
		MuscleGluteMax:   0.5,
		MuscleAdductors:  0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LUNGE_QUAD_FOCUSED, "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti: 1,
		MuscleGluteMax:   0.5,
		MuscleAdductors:  0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LUNGE_GLUTE_FOCUSED, "lower", map[MuscleGroup]float64{
		MuscleGluteMax:   1,
		MuscleQuadsVasti: 0.5,
		MuscleAdductors:  0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_KNEE_EXTENSION, "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti:    1,
		MuscleRectusFemoris: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_KNEE_FLEXION, "lower", map[MuscleGroup]float64{
		MuscleHamstringsBiarticular:  1,
		MuscleBicepsFemorisShortHead: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_HINGE, "lower", map[MuscleGroup]float64{
		MuscleHamstringsBiarticular: 1,
		MuscleGluteMax:              0.5,
		MuscleErectorSpinae:         0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_HINGE_FROM_FLOOR, "lower", map[MuscleGroup]float64{
		MuscleErectorSpinae:         0.5,
		MuscleGluteMax:              0.5,
		MuscleHamstringsBiarticular: 0.5,
		MuscleQuadsVasti:            0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_THRUST, "lower", map[MuscleGroup]float64{
		MuscleGluteMax: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_ABDUCTION, "lower", map[MuscleGroup]float64{
		MuscleGluteMedMin: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_STRAIGHT_LEG_CALF_RAISE, "lower", map[MuscleGroup]float64{
		MuscleSoleus:        1,
		MuscleGastrocnemius: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BENT_LEG_CALF_RAISE, "lower", map[MuscleGroup]float64{
		MuscleSoleus: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LOADED_SPINAL_FLEXION, "lower", map[MuscleGroup]float64{
		MuscleAbs: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HORIZONTAL_PRESS_FIXED_PATH, "pressing", map[MuscleGroup]float64{
		MuscleChest:                1,
		MuscleTricepsLateralMedial: 0.5,
		MuscleFrontDelts:           0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HORIZONTAL_PRESS_FREE_PATH, "pressing", map[MuscleGroup]float64{
		MuscleChest:      1,
		MuscleFrontDelts: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_CHEST_FLY, "pressing", map[MuscleGroup]float64{
		MuscleChest: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_VERTICAL_PRESS_FIXED_PATH, "pressing", map[MuscleGroup]float64{
		MuscleFrontDelts:           1,
		MuscleSideDelts:            0.5,
		MuscleTricepsLateralMedial: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ELBOWS_OUT_VERTICAL_PRESS, "pressing", map[MuscleGroup]float64{
		MuscleSideDelts:            1,
		MuscleFrontDelts:           0.5,
		MuscleTricepsLateralMedial: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_VERTICAL_PULL, "pulling", map[MuscleGroup]float64{
		MuscleLats:      1,
		MuscleBiceps:    0.5,
		MuscleUpperBack: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SHOULDER_EXTENSION_PULL, "pulling", map[MuscleGroup]float64{
		MuscleLats:            1,
		MuscleTricepsLongHead: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ROW, "pulling", map[MuscleGroup]float64{
		MuscleUpperBack: 1,
		MuscleLats:      0.5,
		MuscleBiceps:    0.5,
		MuscleRearDelts: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_FLEXION_ROW, "pulling", map[MuscleGroup]float64{
		MuscleErectorSpinae: 1,
		MuscleUpperBack:     0.5,
		MuscleLats:          0.5,
		MuscleBiceps:        0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIGH_ROW, "pulling", map[MuscleGroup]float64{
		MuscleUpperBack: 1,
		MuscleRearDelts: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SHRUG, "pulling", map[MuscleGroup]float64{
		MuscleUpperTraps: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LATERAL_RAISE, "shoulders", map[MuscleGroup]float64{
		MuscleSideDelts: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_REAR_DELT_FLY, "shoulders", map[MuscleGroup]float64{
		MuscleRearDelts: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ELBOW_FLEXION, "arms", map[MuscleGroup]float64{
		MuscleBiceps:     1,
		MuscleBrachialis: 0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BRACHIALIS_CURL, "arms", map[MuscleGroup]float64{
		MuscleBrachialis:      1,
		MuscleBrachioradialis: 0.5,
		MuscleBiceps:          0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BRACHIORADIALIS_CURL, "arms", map[MuscleGroup]float64{
		MuscleBrachioradialis: 1,
		MuscleBrachialis:      0.5,
		MuscleBiceps:          0.5,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_OVERHEAD_TRICEPS_EXTENSION, "arms", map[MuscleGroup]float64{
		MuscleTricepsLongHead:      1,
		MuscleTricepsLateralMedial: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_TRICEPS_PUSHDOWN, "arms", map[MuscleGroup]float64{
		MuscleTricepsLateralMedial: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_WRIST_FLEXION, "arms", map[MuscleGroup]float64{
		MuscleWristFlexors: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_WRIST_EXTENSION, "arms", map[MuscleGroup]float64{
		MuscleWristExtensors: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_NECK_FLEXION, "neck", map[MuscleGroup]float64{
		MuscleNeckFlexors: 1,
	}),
	family(trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_NECK_EXTENSION, "neck", map[MuscleGroup]float64{
		MuscleNeckExtensors: 1,
	}),
}

func family(id ExerciseFamilyCode, category string, coefficients map[MuscleGroup]float64) ExerciseFamily {
	return ExerciseFamily{ID: id, Name: id.FriendlyString(), Category: category, Coefficients: coefficients}
}

func GetExerciseFamily(id string) *ExerciseFamily {
	for _, family := range ExerciseFamilies {
		if family.ID == trainingv1.StringToExerciseFamilyCode(id) {
			return new(family)
		}
	}
	return nil
}

func IsExerciseFamilyID(id string) bool {
	return GetExerciseFamily(id) != nil
}

func SuggestExerciseFamilyID(name string, equipment string) *string {
	normalized := strings.ToLower(name)
	normalizedEquipment := strings.ToLower(equipment)

	return firstMatchingFamily(normalized, normalizedEquipment)
}

func firstMatchingFamily(normalized string, normalizedEquipment string) *string {
	checks := []struct {
		id ExerciseFamilyCode
		ok bool
	}{
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_HINGE, strings.Contains(normalized, "belt squat") && containsAny(normalized, "rdl", "romanian")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SUPPORTED_SQUAT, strings.Contains(normalized, "belt squat")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_STRAIGHT_LEG_CALF_RAISE, strings.Contains(normalized, "pendulum") && containsAny(normalized, "calf", "raise")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SUPPORTED_SQUAT, strings.Contains(normalized, "pendulum")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SUPPORTED_SQUAT, strings.Contains(normalized, "hack squat") || strings.Contains(normalized, "machine squat")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_STRAIGHT_LEG_CALF_RAISE, strings.Contains(normalized, "leg press") && containsAny(normalized, "calf", "raise")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SUPPORTED_SQUAT, strings.Contains(normalized, "leg press")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LUNGE_GLUTE_FOCUSED, containsAny(normalized, "front foot", "long stride") || strings.Contains(normalized, "glute") && containsAny(normalized, "lunge", "split squat", "bulgarian")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LUNGE_QUAD_FOCUSED, containsAny(normalized, "lunge", "split squat", "bulgarian")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_FREE_SQUAT, strings.Contains(normalized, "squat")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_KNEE_EXTENSION, strings.Contains(normalized, "leg extension") || strings.Contains(normalized, "sissy") || strings.Contains(normalized, "reverse nordic")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_KNEE_FLEXION, containsAny(normalized, "leg curl", "hamstring curl", "nordic")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_HINGE, containsAny(normalized, "rdl", "romanian", "good morning")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_HINGE_FROM_FLOOR, strings.Contains(normalized, "deadlift")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_THRUST, strings.Contains(normalized, "hip thrust") || strings.Contains(normalized, "bridge")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIP_ABDUCTION, strings.Contains(normalized, "abduction")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BENT_LEG_CALF_RAISE, strings.Contains(normalized, "seated") && strings.Contains(normalized, "calf") || strings.Contains(normalized, "bent") && strings.Contains(normalized, "calf")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_STRAIGHT_LEG_CALF_RAISE, strings.Contains(normalized, "calf") || strings.Contains(normalized, "calves")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LOADED_SPINAL_FLEXION, containsAny(normalized, "crunch", "sit up", "situp", "leg raise", "knee raise")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SHOULDER_EXTENSION_PULL, containsAny(normalized, "pullover", "lat prayer", "straight arm")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_VERTICAL_PULL, containsAny(normalized, "pullup", "pull-up", "pulldown", "chinup", "chin-up")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HIGH_ROW, containsAny(normalized, "face pull", "high row", "rear delt row")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_FLEXION_ROW, strings.Contains(normalized, "flexion row")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ROW, containsAny(normalized, "row", "t-bar", "tbar")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_SHRUG, strings.Contains(normalized, "shrug")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_LATERAL_RAISE, containsAny(normalized, "lateral raise", "butterfly raise", "upright row")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_REAR_DELT_FLY, containsAny(normalized, "rear delt", "rear-delt", "reverse fly")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_OVERHEAD_TRICEPS_EXTENSION, containsAny(normalized, "overhead triceps", "oh extension", "skull")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_TRICEPS_PUSHDOWN, strings.Contains(normalized, "pushdown")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BRACHIORADIALIS_CURL, strings.Contains(normalized, "reverse curl")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_BRACHIALIS_CURL, containsAny(normalized, "hammer curl", "cross-body curl", "cross body curl", "neutral curl")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ELBOW_FLEXION, containsAny(normalized, "preacher", "bayesian", "incline curl") || strings.Contains(normalized, "curl")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_WRIST_EXTENSION, strings.Contains(normalized, "wrist") && strings.Contains(normalized, "extension")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_WRIST_FLEXION, strings.Contains(normalized, "wrist")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_NECK_FLEXION, strings.Contains(normalized, "neck") && strings.Contains(normalized, "flex")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_NECK_EXTENSION, strings.Contains(normalized, "neck") && strings.Contains(normalized, "ext")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_CHEST_FLY, containsAny(normalized, "fly", "flye", "pec deck")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_ELBOWS_OUT_VERTICAL_PRESS, containsAny(normalized, "elbows out", "out elbows", "frontal plane", "frontal-plane", "butterfly press")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_VERTICAL_PRESS_FIXED_PATH, strings.Contains(normalized, "overhead press") || strings.Contains(normalized, "shoulder press")},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HORIZONTAL_PRESS_FREE_PATH, containsAny(normalized, "bench", "press", "dip") && (strings.Contains(normalizedEquipment, "dumbbell") || strings.Contains(normalizedEquipment, "cable"))},
		{trainingv1.ExerciseFamilyCode_EXERCISE_FAMILY_CODE_HORIZONTAL_PRESS_FIXED_PATH, containsAny(normalized, "bench", "press", "dip")},
	}
	for _, check := range checks {
		if check.ok {
			return new(check.id.StringVal())
		}
	}
	return nil
}

func containsAny(value string, needles ...string) bool {
	for _, needle := range needles {
		if strings.Contains(value, needle) {
			return true
		}
	}
	return false
}
