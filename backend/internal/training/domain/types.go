package domain

type TrainingCatalog struct {
	MuscleGroups       []MuscleGroup
	Exercises          []ExerciseSummary
	ExerciseFamilies   []ExerciseFamilySummary
	TemplateMesocycles []TemplateMesocycleSummary
	Mesocycles         []MesocycleSummary
}

type ExerciseSummary struct {
	ID                 string
	Name               string
	PrimaryMuscle      MuscleGroup
	PrimaryMuscles     []MuscleGroup
	SecondaryMuscles   []MuscleGroup
	MuscleCoefficients []ExerciseMuscleCoefficient
	FamilyID           *string
	Equipment          string
	History            []ExerciseHistoryEntry
}

type ExerciseMuscleCoefficient struct {
	Muscle      MuscleGroup
	Coefficient float64
}

type ExerciseFamilySummary struct {
	ID           string
	Name         string
	Category     string
	Coefficients []ExerciseMuscleCoefficient
	Notes        *string
}

type TemplateMesocycleSummary struct {
	ID          string
	Name        string
	Category    string
	Frequency   string
	Gender      string
	Weeks       int
	DaysPerWeek int
}

type MesocycleSummary struct {
	ID            string
	Name          string
	Status        string
	Weeks         int
	DaysPerWeek   int
	StartedAt     *string
	CompletedAt   *string
	SessionCount  int
	LatestSession *string
	Sessions      []MesocycleSessionSummary
}

type MesocycleSessionSummary struct {
	ID           string
	Name         string
	TrainingDate *string
	Status       string
	WeekNumber   *int
	DayNumber    *int
	Source       *string
	Notes        *string
	TotalSets    int
	Exercises    []MesocycleExerciseSummary
}

type MesocycleExerciseSummary struct {
	ID             string
	Name           string
	Equipment      string
	PrimaryMuscle  MuscleGroup
	Method         TrainingMethod
	TargetRepRange string
	Sets           []LoggedSet
}

type ExerciseHistoryEntry struct {
	SessionID   string
	Label       string
	WorkoutName string
	LoadText    string
	Reps        int
	SetIndex    int
}

type TodayWorkout struct {
	ID             string
	SessionID      string
	Name           string
	Date           *string
	Status         string
	Exercises      []PlannedExercise
	Muscles        []MuscleGroup
	VolumeFacts    []MuscleVolumeFact
	MuscleFeedback []MuscleFeedback
	Suggestions    []NextSessionSuggestion
}

type PlannedExercise struct {
	ID                  string
	ExerciseID          string
	Name                string
	Equipment           string
	Method              TrainingMethod
	ProgrammedSets      int
	TargetRepRange      string
	PreviousPerformance string
	PrimaryMuscle       MuscleGroup
	LoggedSets          []LoggedSet
	Feedback            *ExerciseFeedback
}

type LoggedSet struct {
	SetIndex int
	LoadText string
	Reps     int
	Notes    *string
	Pain     *int
}

type ExerciseFeedback struct {
	PainAfter *int
	Notes     *string
}

type MuscleFeedback struct {
	Muscle   MuscleGroup
	Soreness *int
	Pump     *int
	Workload *string
	Notes    *string
}

type MuscleVolumeFact struct {
	Muscle                  MuscleGroup
	SessionDirectSets       float64
	SessionIndirectSets     float64
	SessionEffectiveSets    float64
	WeekToDateDirectSets    float64
	WeekToDateIndirectSets  float64
	WeekToDateEffectiveSets float64
}

type NextSessionSuggestion struct {
	Muscle     MuscleGroup
	Suggestion string
	Status     string
}
