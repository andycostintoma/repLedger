package domain

import "math"

type VolumeExercise struct {
	TemplateExerciseID string
	Method             TrainingMethod
	Coefficients       map[MuscleGroup]float64
}

type LoggedSetRef struct {
	TemplateExerciseID string
}

func MusclesForExercises(exercises []VolumeExercise) []MuscleGroup {
	muscles := []MuscleGroup{}
	for _, muscle := range MuscleGroups {
		for _, exercise := range exercises {
			if _, ok := exercise.Coefficients[muscle]; ok {
				muscles = append(muscles, muscle)
				break
			}
		}
	}
	return muscles
}

func BuildMuscleVolumeFacts(exercises []VolumeExercise, savedSets []LoggedSetRef, priorWeekVolume map[MuscleGroup]float64) []MuscleVolumeFact {
	sessionVolume := map[MuscleGroup]float64{}
	sessionDirectVolume := map[MuscleGroup]float64{}
	sessionIndirectVolume := map[MuscleGroup]float64{}

	for _, exercise := range exercises {
		loggedSetCount := 0
		for _, set := range savedSets {
			if set.TemplateExerciseID == exercise.TemplateExerciseID {
				loggedSetCount++
			}
		}

		setEquivalents := LoggedSetEquivalents(exercise.Method, loggedSetCount)
		for _, muscle := range MusclesForExercises([]VolumeExercise{exercise}) {
			coefficient := exercise.Coefficients[muscle]
			sessionVolume[muscle] += setEquivalents * coefficient
			if coefficient == 1 {
				sessionDirectVolume[muscle] += setEquivalents
			} else if coefficient > 0 {
				sessionIndirectVolume[muscle] += setEquivalents
			}
		}
	}

	facts := []MuscleVolumeFact{}
	for _, muscle := range MusclesForExercises(exercises) {
		facts = append(facts, MuscleVolumeFact{
			Muscle:                  muscle,
			SessionDirectSets:       RoundVolume(sessionDirectVolume[muscle]),
			SessionIndirectSets:     RoundVolume(sessionIndirectVolume[muscle]),
			SessionEffectiveSets:    RoundVolume(sessionVolume[muscle]),
			WeekToDateDirectSets:    RoundVolume(sessionDirectVolume[muscle]),
			WeekToDateIndirectSets:  RoundVolume(sessionIndirectVolume[muscle]),
			WeekToDateEffectiveSets: RoundVolume(priorWeekVolume[muscle] + sessionVolume[muscle]),
		})
	}
	return facts
}

func RoundVolume(value float64) float64 {
	return math.Round(value*4) / 4
}
