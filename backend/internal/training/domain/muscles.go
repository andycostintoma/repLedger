package domain

type MuscleGroup string

const (
	MuscleQuadsVasti             MuscleGroup = "quads_vasti"
	MuscleRectusFemoris          MuscleGroup = "rectus_femoris"
	MuscleAdductors              MuscleGroup = "adductors"
	MuscleHamstringsBiarticular  MuscleGroup = "hamstrings_biarticular"
	MuscleBicepsFemorisShortHead MuscleGroup = "biceps_femoris_short_head"
	MuscleGluteMax               MuscleGroup = "glute_max"
	MuscleGluteMedMin            MuscleGroup = "glute_med_min"
	MuscleErectorSpinae          MuscleGroup = "erector_spinae"
	MuscleAbs                    MuscleGroup = "abs"
	MuscleWristFlexors           MuscleGroup = "wrist_flexors"
	MuscleWristExtensors         MuscleGroup = "wrist_extensors"
	MuscleBrachioradialis        MuscleGroup = "brachioradialis"
	MuscleBiceps                 MuscleGroup = "biceps"
	MuscleTricepsLateralMedial   MuscleGroup = "triceps_lateral_medial"
	MuscleTricepsLongHead        MuscleGroup = "triceps_long_head"
	MuscleFrontDelts             MuscleGroup = "front_delts"
	MuscleSideDelts              MuscleGroup = "side_delts"
	MuscleRearDelts              MuscleGroup = "rear_delts"
	MuscleChest                  MuscleGroup = "chest"
	MuscleLats                   MuscleGroup = "lats"
	MuscleUpperBack              MuscleGroup = "upper_back"
	MuscleUpperTraps             MuscleGroup = "upper_traps"
	MuscleSoleus                 MuscleGroup = "soleus"
	MuscleGastrocnemius          MuscleGroup = "gastrocnemius"
	MuscleNeckExtensors          MuscleGroup = "neck_extensors"
	MuscleNeckFlexors            MuscleGroup = "neck_flexors"
)

var MuscleGroups = []MuscleGroup{
	MuscleQuadsVasti,
	MuscleRectusFemoris,
	MuscleAdductors,
	MuscleHamstringsBiarticular,
	MuscleBicepsFemorisShortHead,
	MuscleGluteMax,
	MuscleGluteMedMin,
	MuscleErectorSpinae,
	MuscleAbs,
	MuscleWristFlexors,
	MuscleWristExtensors,
	MuscleBrachioradialis,
	MuscleBiceps,
	MuscleTricepsLateralMedial,
	MuscleTricepsLongHead,
	MuscleFrontDelts,
	MuscleSideDelts,
	MuscleRearDelts,
	MuscleChest,
	MuscleLats,
	MuscleUpperBack,
	MuscleUpperTraps,
	MuscleSoleus,
	MuscleGastrocnemius,
	MuscleNeckExtensors,
	MuscleNeckFlexors,
}

func IsMuscleGroup(value string) bool {
	for _, muscle := range MuscleGroups {
		if string(muscle) == value {
			return true
		}
	}
	return false
}
