package domain

import trainingv1 "workout-tracker/backend/pb/training/v1"

type TrainingMethod = trainingv1.TrainingMethod

const (
	TrainingMethodRegular  = trainingv1.TrainingMethod_TRAINING_METHOD_REGULAR
	TrainingMethodMyoMatch = trainingv1.TrainingMethod_TRAINING_METHOD_MYO_MATCH
)

var myoMatchSetEquivalents = map[int]float64{
	1: 1,
	2: 2.5,
	3: 4.5,
	4: 7,
	5: 10,
}

func LoggedSetEquivalents(method TrainingMethod, loggedSetCount int) float64 {
	if loggedSetCount <= 0 {
		return 0
	}
	if method == TrainingMethodRegular {
		return float64(loggedSetCount)
	}
	if loggedSetCount > 5 {
		loggedSetCount = 5
	}
	return myoMatchSetEquivalents[loggedSetCount]
}
