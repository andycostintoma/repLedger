package domain

type TrainingMethod string

const (
	TrainingMethodRegular  TrainingMethod = "regular"
	TrainingMethodMyoMatch TrainingMethod = "myo-match"
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
