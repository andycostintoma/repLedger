package domain

import trainingv1 "workout-tracker/backend/pb/training/v1"

type MuscleGroup = trainingv1.MuscleGroup

const (
	MuscleQuadsVasti             = trainingv1.MuscleGroup_MUSCLE_GROUP_QUADS_VASTI
	MuscleRectusFemoris          = trainingv1.MuscleGroup_MUSCLE_GROUP_RECTUS_FEMORIS
	MuscleAdductors              = trainingv1.MuscleGroup_MUSCLE_GROUP_ADDUCTORS
	MuscleHamstringsBiarticular  = trainingv1.MuscleGroup_MUSCLE_GROUP_HAMSTRINGS_BIARTICULAR
	MuscleBicepsFemorisShortHead = trainingv1.MuscleGroup_MUSCLE_GROUP_BICEPS_FEMORIS_SHORT_HEAD
	MuscleGluteMax               = trainingv1.MuscleGroup_MUSCLE_GROUP_GLUTE_MAX
	MuscleGluteMedMin            = trainingv1.MuscleGroup_MUSCLE_GROUP_GLUTE_MED_MIN
	MuscleErectorSpinae          = trainingv1.MuscleGroup_MUSCLE_GROUP_ERECTOR_SPINAE
	MuscleAbs                    = trainingv1.MuscleGroup_MUSCLE_GROUP_ABS
	MuscleWristFlexors           = trainingv1.MuscleGroup_MUSCLE_GROUP_WRIST_FLEXORS
	MuscleWristExtensors         = trainingv1.MuscleGroup_MUSCLE_GROUP_WRIST_EXTENSORS
	MuscleBrachioradialis        = trainingv1.MuscleGroup_MUSCLE_GROUP_BRACHIORADIALIS
	MuscleBiceps                 = trainingv1.MuscleGroup_MUSCLE_GROUP_BICEPS
	MuscleTricepsLateralMedial   = trainingv1.MuscleGroup_MUSCLE_GROUP_TRICEPS_LATERAL_MEDIAL
	MuscleTricepsLongHead        = trainingv1.MuscleGroup_MUSCLE_GROUP_TRICEPS_LONG_HEAD
	MuscleFrontDelts             = trainingv1.MuscleGroup_MUSCLE_GROUP_FRONT_DELTS
	MuscleSideDelts              = trainingv1.MuscleGroup_MUSCLE_GROUP_SIDE_DELTS
	MuscleRearDelts              = trainingv1.MuscleGroup_MUSCLE_GROUP_REAR_DELTS
	MuscleChest                  = trainingv1.MuscleGroup_MUSCLE_GROUP_CHEST
	MuscleLats                   = trainingv1.MuscleGroup_MUSCLE_GROUP_LATS
	MuscleUpperBack              = trainingv1.MuscleGroup_MUSCLE_GROUP_UPPER_BACK
	MuscleUpperTraps             = trainingv1.MuscleGroup_MUSCLE_GROUP_UPPER_TRAPS
	MuscleSoleus                 = trainingv1.MuscleGroup_MUSCLE_GROUP_SOLEUS
	MuscleGastrocnemius          = trainingv1.MuscleGroup_MUSCLE_GROUP_GASTROCNEMIUS
	MuscleNeckExtensors          = trainingv1.MuscleGroup_MUSCLE_GROUP_NECK_EXTENSORS
	MuscleNeckFlexors            = trainingv1.MuscleGroup_MUSCLE_GROUP_NECK_FLEXORS
	MuscleBrachialis             = trainingv1.MuscleGroup_MUSCLE_GROUP_BRACHIALIS
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
	MuscleBrachialis,
}

func IsMuscleGroup(value string) bool {
	return !trainingv1.StringToMuscleGroup(value).IsUnspecified()
}
