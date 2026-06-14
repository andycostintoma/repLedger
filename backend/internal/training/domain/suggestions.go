package domain

import "fmt"

func BuildMuscleFeedbackSuggestion(feedback MuscleFeedback) string {
	if feedback.Soreness != nil && *feedback.Soreness >= 4 {
		return fmt.Sprintf("%s: high soreness. Hold or reduce next-session volume until soreness normalizes.", feedback.Muscle)
	}

	if feedback.Workload != nil && *feedback.Workload == "too-high" {
		return fmt.Sprintf("%s: workload felt too high. Repeat or reduce next exposure instead of adding sets/load.", feedback.Muscle)
	}

	if feedback.Pump != nil && *feedback.Pump <= 1 && feedback.Workload != nil && *feedback.Workload == "too-low" {
		return fmt.Sprintf("%s: weak pump and low workload. Consider a small next-exposure increase if performance stays in range and pain is low.", feedback.Muscle)
	}

	if feedback.Workload != nil && *feedback.Workload == "too-low" {
		return fmt.Sprintf("%s: workload felt low. Consider a small next-exposure progression if reps stay in the target range.", feedback.Muscle)
	}

	return fmt.Sprintf("%s: feedback looks acceptable. Repeat the plan next exposure unless performance or pain says otherwise.", feedback.Muscle)
}

func BuildPainSuggestion(exerciseName string, muscle MuscleGroup, painAfter int) string {
	return fmt.Sprintf("Pain after %s was %d/10. Hold or reduce loading next exposure and do not add volume for %s.", exerciseName, painAfter, muscle)
}
