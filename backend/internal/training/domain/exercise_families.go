package domain

import "strings"

type ExerciseFamily struct {
	ID           string
	Name         string
	Category     string
	Coefficients map[MuscleGroup]float64
	Notes        *string
}

var ExerciseFamilies = []ExerciseFamily{
	family("free_squat", "Free squat", "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti:    1,
		MuscleGluteMax:      0.5,
		MuscleAdductors:     0.5,
		MuscleErectorSpinae: 0.5,
	}),
	family("supported_squat", "Supported squat", "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti: 1,
		MuscleGluteMax:   0.5,
		MuscleAdductors:  0.5,
	}),
	family("lunge_quad_focused", "Lunge quad-focused", "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti: 1,
		MuscleGluteMax:   0.5,
		MuscleAdductors:  0.5,
	}),
	family("lunge_glute_focused", "Lunge glute-focused", "lower", map[MuscleGroup]float64{
		MuscleGluteMax:   1,
		MuscleQuadsVasti: 0.5,
		MuscleAdductors:  0.5,
	}),
	family("knee_extension", "Knee extension", "lower", map[MuscleGroup]float64{
		MuscleQuadsVasti:    1,
		MuscleRectusFemoris: 1,
	}),
	family("knee_flexion", "Knee flexion", "lower", map[MuscleGroup]float64{
		MuscleHamstringsBiarticular:  1,
		MuscleBicepsFemorisShortHead: 1,
	}),
	family("hip_hinge", "Hip hinge", "lower", map[MuscleGroup]float64{
		MuscleHamstringsBiarticular: 1,
		MuscleGluteMax:              0.5,
		MuscleErectorSpinae:         0.5,
	}),
	family("hip_hinge_from_floor", "Hip hinge from floor", "lower", map[MuscleGroup]float64{
		MuscleErectorSpinae:         0.5,
		MuscleGluteMax:              0.5,
		MuscleHamstringsBiarticular: 0.5,
		MuscleQuadsVasti:            0.5,
	}),
	family("hip_thrust", "Hip thrust", "lower", map[MuscleGroup]float64{
		MuscleGluteMax: 1,
	}),
	family("hip_abduction", "Hip abduction", "lower", map[MuscleGroup]float64{
		MuscleGluteMedMin: 1,
	}),
	family("straight_leg_calf_raise", "Straight-leg calf raise", "lower", map[MuscleGroup]float64{
		MuscleSoleus:        1,
		MuscleGastrocnemius: 1,
	}),
	family("bent_leg_calf_raise", "Bent-leg calf raise", "lower", map[MuscleGroup]float64{
		MuscleSoleus: 1,
	}),
	family("loaded_spinal_flexion", "Loaded spinal flexion", "lower", map[MuscleGroup]float64{
		MuscleAbs: 1,
	}),
	family("horizontal_press_fixed_path", "Horizontal press fixed path", "pressing", map[MuscleGroup]float64{
		MuscleChest:                1,
		MuscleTricepsLateralMedial: 0.5,
		MuscleFrontDelts:           0.5,
	}),
	family("horizontal_press_free_path", "Horizontal press free path", "pressing", map[MuscleGroup]float64{
		MuscleChest:      1,
		MuscleFrontDelts: 0.5,
	}),
	family("chest_fly", "Chest fly", "pressing", map[MuscleGroup]float64{
		MuscleChest: 1,
	}),
	family("vertical_press_fixed_path", "Vertical press fixed path", "pressing", map[MuscleGroup]float64{
		MuscleFrontDelts:           1,
		MuscleSideDelts:            0.5,
		MuscleTricepsLateralMedial: 0.5,
	}),
	family("elbows_out_vertical_press", "Elbows-out vertical press", "pressing", map[MuscleGroup]float64{
		MuscleSideDelts:            1,
		MuscleFrontDelts:           0.5,
		MuscleTricepsLateralMedial: 0.5,
	}),
	family("vertical_pull", "Vertical pull", "pulling", map[MuscleGroup]float64{
		MuscleLats:      1,
		MuscleBiceps:    0.5,
		MuscleUpperBack: 0.5,
	}),
	family("shoulder_extension_pull", "Shoulder extension pull", "pulling", map[MuscleGroup]float64{
		MuscleLats:            1,
		MuscleTricepsLongHead: 0.5,
	}),
	family("row", "Row", "pulling", map[MuscleGroup]float64{
		MuscleUpperBack: 1,
		MuscleLats:      0.5,
		MuscleBiceps:    0.5,
		MuscleRearDelts: 0.5,
	}),
	family("flexion_row", "Flexion row", "pulling", map[MuscleGroup]float64{
		MuscleErectorSpinae: 1,
		MuscleUpperBack:     0.5,
		MuscleLats:          0.5,
		MuscleBiceps:        0.5,
	}),
	family("high_row", "High row", "pulling", map[MuscleGroup]float64{
		MuscleUpperBack: 1,
		MuscleRearDelts: 1,
	}),
	family("shrug", "Shrug", "pulling", map[MuscleGroup]float64{
		MuscleUpperTraps: 1,
	}),
	family("lateral_raise", "Lateral raise", "shoulders", map[MuscleGroup]float64{
		MuscleSideDelts: 1,
	}),
	family("rear_delt_fly", "Rear-delt fly", "shoulders", map[MuscleGroup]float64{
		MuscleRearDelts: 1,
	}),
	family("elbow_flexion", "Elbow flexion", "arms", map[MuscleGroup]float64{
		MuscleBiceps: 1,
	}),
	family("brachioradialis_curl", "Brachioradialis curl", "arms", map[MuscleGroup]float64{
		MuscleBrachioradialis: 1,
		MuscleBiceps:          0.5,
	}),
	family("overhead_triceps_extension", "Overhead triceps extension", "arms", map[MuscleGroup]float64{
		MuscleTricepsLongHead:      1,
		MuscleTricepsLateralMedial: 1,
	}),
	family("triceps_pushdown", "Triceps pushdown", "arms", map[MuscleGroup]float64{
		MuscleTricepsLateralMedial: 1,
	}),
	family("wrist_flexion", "Wrist flexion", "arms", map[MuscleGroup]float64{
		MuscleWristFlexors: 1,
	}),
	family("wrist_extension", "Wrist extension", "arms", map[MuscleGroup]float64{
		MuscleWristExtensors: 1,
	}),
	family("neck_flexion", "Neck flexion", "neck", map[MuscleGroup]float64{
		MuscleNeckFlexors: 1,
	}),
	family("neck_extension", "Neck extension", "neck", map[MuscleGroup]float64{
		MuscleNeckExtensors: 1,
	}),
}

func family(id, name, category string, coefficients map[MuscleGroup]float64) ExerciseFamily {
	return ExerciseFamily{ID: id, Name: name, Category: category, Coefficients: coefficients}
}

func GetExerciseFamily(id string) *ExerciseFamily {
	for _, family := range ExerciseFamilies {
		if family.ID == id {
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
		id string
		ok bool
	}{
		{"hip_hinge", strings.Contains(normalized, "belt squat") && containsAny(normalized, "rdl", "romanian")},
		{"supported_squat", strings.Contains(normalized, "belt squat")},
		{"straight_leg_calf_raise", strings.Contains(normalized, "pendulum") && containsAny(normalized, "calf", "raise")},
		{"supported_squat", strings.Contains(normalized, "pendulum")},
		{"supported_squat", strings.Contains(normalized, "hack squat") || strings.Contains(normalized, "machine squat")},
		{"straight_leg_calf_raise", strings.Contains(normalized, "leg press") && containsAny(normalized, "calf", "raise")},
		{"supported_squat", strings.Contains(normalized, "leg press")},
		{"lunge_glute_focused", containsAny(normalized, "front foot", "long stride") || strings.Contains(normalized, "glute") && containsAny(normalized, "lunge", "split squat", "bulgarian")},
		{"lunge_quad_focused", containsAny(normalized, "lunge", "split squat", "bulgarian")},
		{"free_squat", strings.Contains(normalized, "squat")},
		{"knee_extension", strings.Contains(normalized, "leg extension") || strings.Contains(normalized, "sissy") || strings.Contains(normalized, "reverse nordic")},
		{"knee_flexion", containsAny(normalized, "leg curl", "hamstring curl", "nordic")},
		{"hip_hinge", containsAny(normalized, "rdl", "romanian", "good morning")},
		{"hip_hinge_from_floor", strings.Contains(normalized, "deadlift")},
		{"hip_thrust", strings.Contains(normalized, "hip thrust") || strings.Contains(normalized, "bridge")},
		{"hip_abduction", strings.Contains(normalized, "abduction")},
		{"bent_leg_calf_raise", strings.Contains(normalized, "seated") && strings.Contains(normalized, "calf") || strings.Contains(normalized, "bent") && strings.Contains(normalized, "calf")},
		{"straight_leg_calf_raise", strings.Contains(normalized, "calf") || strings.Contains(normalized, "calves")},
		{"loaded_spinal_flexion", containsAny(normalized, "crunch", "sit up", "situp", "leg raise", "knee raise")},
		{"shoulder_extension_pull", containsAny(normalized, "pullover", "lat prayer", "straight arm")},
		{"vertical_pull", containsAny(normalized, "pullup", "pull-up", "pulldown", "chinup", "chin-up")},
		{"high_row", containsAny(normalized, "face pull", "high row", "rear delt row")},
		{"flexion_row", strings.Contains(normalized, "flexion row")},
		{"row", containsAny(normalized, "row", "t-bar", "tbar")},
		{"shrug", strings.Contains(normalized, "shrug")},
		{"lateral_raise", containsAny(normalized, "lateral raise", "butterfly raise", "upright row")},
		{"rear_delt_fly", containsAny(normalized, "rear delt", "rear-delt", "reverse fly")},
		{"overhead_triceps_extension", containsAny(normalized, "overhead triceps", "oh extension", "skull")},
		{"triceps_pushdown", strings.Contains(normalized, "pushdown")},
		{"brachioradialis_curl", strings.Contains(normalized, "hammer curl") || strings.Contains(normalized, "reverse curl")},
		{"elbow_flexion", containsAny(normalized, "preacher", "bayesian", "incline curl") || strings.Contains(normalized, "curl")},
		{"wrist_extension", strings.Contains(normalized, "wrist") && strings.Contains(normalized, "extension")},
		{"wrist_flexion", strings.Contains(normalized, "wrist")},
		{"neck_flexion", strings.Contains(normalized, "neck") && strings.Contains(normalized, "flex")},
		{"neck_extension", strings.Contains(normalized, "neck") && strings.Contains(normalized, "ext")},
		{"chest_fly", containsAny(normalized, "fly", "flye", "pec deck")},
		{"elbows_out_vertical_press", containsAny(normalized, "elbows out", "out elbows", "frontal plane", "frontal-plane", "butterfly press")},
		{"vertical_press_fixed_path", strings.Contains(normalized, "overhead press") || strings.Contains(normalized, "shoulder press")},
		{"horizontal_press_free_path", containsAny(normalized, "bench", "press", "dip") && (strings.Contains(normalizedEquipment, "dumbbell") || strings.Contains(normalizedEquipment, "cable"))},
		{"horizontal_press_fixed_path", containsAny(normalized, "bench", "press", "dip")},
	}
	for _, check := range checks {
		if check.ok {
			return new(check.id)
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
