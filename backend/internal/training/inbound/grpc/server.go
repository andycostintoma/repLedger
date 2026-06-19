package grpc

import (
	"context"

	"workout-tracker/backend/internal/training/app"
	"workout-tracker/backend/internal/training/app/command"
	"workout-tracker/backend/internal/training/app/query"
	"workout-tracker/backend/internal/training/domain"
	trainingv1 "workout-tracker/backend/pb/training/v1"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type Server struct {
	trainingv1.UnimplementedTrainingServiceServer

	app *app.App
}

func RegisterServer(application *app.App, registrar grpc.ServiceRegistrar) {
	server := Server{app: application}
	trainingv1.RegisterTrainingServiceServer(registrar, server)

	healthServer := health.NewServer()
	healthServer.SetServingStatus("training.v1.TrainingService", healthpb.HealthCheckResponse_SERVING)
	healthpb.RegisterHealthServer(registrar, healthServer)
}

func (s Server) GetTrainingCatalog(ctx context.Context, _ *trainingv1.GetTrainingCatalogRequest) (*trainingv1.GetTrainingCatalogResponse, error) {
	catalog, err := s.app.Queries.GetTrainingCatalog.Handle(ctx, query.GetTrainingCatalog{})
	if err != nil {
		return nil, err
	}

	return trainingCatalogToProto(catalog), nil
}

func (s Server) GetTodayWorkout(ctx context.Context, _ *trainingv1.GetTodayWorkoutRequest) (*trainingv1.GetTodayWorkoutResponse, error) {
	workout, err := s.app.Queries.GetTodayWorkout.Handle(ctx, query.GetTodayWorkout{})
	if err != nil {
		return nil, err
	}
	return todayWorkoutToProto(workout), nil
}

func (s Server) LogSet(ctx context.Context, req *trainingv1.LogSetRequest) (*trainingv1.LogSetResponse, error) {
	var pain *int
	if req.Pain != nil {
		pain = new(int(*req.Pain))
	}
	err := s.app.Commands.LogSet.Handle(ctx, command.LogSet{SessionID: req.GetSessionId(), TemplateExerciseID: req.GetTemplateExerciseId(), SetIndex: int(req.GetSetIndex()), LoadText: req.GetLoadText(), Reps: int(req.GetReps()), Notes: req.Notes, Pain: pain})
	return &trainingv1.LogSetResponse{}, err
}

func (s Server) SaveExerciseFeedback(ctx context.Context, req *trainingv1.SaveExerciseFeedbackRequest) (*trainingv1.SaveExerciseFeedbackResponse, error) {
	var painAfter *int
	if req.PainAfter != nil {
		painAfter = new(int(*req.PainAfter))
	}
	err := s.app.Commands.SaveExerciseFeedback.Handle(ctx, command.SaveExerciseFeedback{SessionID: req.GetSessionId(), TemplateExerciseID: req.GetTemplateExerciseId(), PainAfter: painAfter, Notes: req.Notes})
	return &trainingv1.SaveExerciseFeedbackResponse{}, err
}

func (s Server) SaveMuscleFeedback(ctx context.Context, req *trainingv1.SaveMuscleFeedbackRequest) (*trainingv1.SaveMuscleFeedbackResponse, error) {
	var soreness *int
	if req.Soreness != nil {
		soreness = new(int(*req.Soreness))
	}
	var pump *int
	if req.Pump != nil {
		pump = new(int(*req.Pump))
	}
	err := s.app.Commands.SaveMuscleFeedback.Handle(ctx, command.SaveMuscleFeedback{SessionID: req.GetSessionId(), Muscle: req.GetMuscle(), Soreness: soreness, Pump: pump, Workload: optionalFeedbackWorkloadString(req.Workload), Notes: req.Notes})
	return &trainingv1.SaveMuscleFeedbackResponse{}, err
}

func (s Server) SaveSuggestion(ctx context.Context, req *trainingv1.SaveSuggestionRequest) (*trainingv1.SaveSuggestionResponse, error) {
	err := s.app.Commands.SaveSuggestion.Handle(ctx, command.SaveSuggestion{SessionID: req.GetSessionId(), Muscle: req.GetMuscle(), Suggestion: req.GetSuggestion(), Status: req.GetStatus().StringVal()})
	return &trainingv1.SaveSuggestionResponse{}, err
}

func (s Server) FinishWorkout(ctx context.Context, req *trainingv1.FinishWorkoutRequest) (*trainingv1.FinishWorkoutResponse, error) {
	err := s.app.Commands.FinishWorkout.Handle(ctx, command.FinishWorkout{SessionID: req.GetSessionId()})
	return &trainingv1.FinishWorkoutResponse{}, err
}

func (s Server) CreateMesocycle(ctx context.Context, req *trainingv1.CreateMesocycleRequest) (*trainingv1.CreateMesocycleResponse, error) {
	id, err := s.app.Commands.CreateMesocycle.Handle(ctx, command.CreateMesocycle{Name: req.GetName(), Weeks: int(req.GetWeeks()), DaysPerWeek: int(req.GetDaysPerWeek()), Status: req.GetStatus().StringVal(), TemplateMesoID: req.TemplateMesoId})
	if err != nil {
		return nil, err
	}
	return &trainingv1.CreateMesocycleResponse{Id: id}, nil
}

func (s Server) CreateTemplateMesocycle(ctx context.Context, req *trainingv1.CreateTemplateMesocycleRequest) (*trainingv1.CreateTemplateMesocycleResponse, error) {
	id, err := s.app.Commands.CreateTemplateMesocycle.Handle(ctx, command.CreateTemplateMesocycle{Name: req.GetName(), Category: req.GetCategory(), Frequency: req.GetFrequency(), Gender: req.GetGender(), Weeks: int(req.GetWeeks()), DaysPerWeek: int(req.GetDaysPerWeek())})
	if err != nil {
		return nil, err
	}
	return &trainingv1.CreateTemplateMesocycleResponse{Id: id}, nil
}

func (s Server) CreateExercise(ctx context.Context, req *trainingv1.CreateExerciseRequest) (*trainingv1.CreateExerciseResponse, error) {
	id, err := s.app.Commands.CreateExercise.Handle(ctx, command.CreateExercise{Name: req.GetName(), PrimaryMuscle: req.GetPrimaryMuscle(), Equipment: req.GetEquipment().StringVal(), FamilyID: optionalExerciseFamilyString(req.FamilyId), Coefficients: coefficientsFromProto(req.GetCoefficients())})
	if err != nil {
		return nil, err
	}
	return &trainingv1.CreateExerciseResponse{Id: id}, nil
}

func (s Server) UpdateExerciseName(ctx context.Context, req *trainingv1.UpdateExerciseNameRequest) (*trainingv1.UpdateExerciseNameResponse, error) {
	err := s.app.Commands.UpdateExerciseName.Handle(ctx, command.UpdateExerciseName{ExerciseID: req.GetExerciseId(), Name: req.GetName()})
	return &trainingv1.UpdateExerciseNameResponse{}, err
}

func (s Server) UpdateExerciseCoefficients(ctx context.Context, req *trainingv1.UpdateExerciseCoefficientsRequest) (*trainingv1.UpdateExerciseCoefficientsResponse, error) {
	err := s.app.Commands.UpdateExerciseCoefficients.Handle(ctx, command.UpdateExerciseCoefficients{ExerciseID: req.GetExerciseId(), FamilyID: optionalExerciseFamilyString(req.FamilyId), Coefficients: coefficientsFromProto(req.GetCoefficients())})
	return &trainingv1.UpdateExerciseCoefficientsResponse{}, err
}

func trainingCatalogToProto(catalog domain.TrainingCatalog) *trainingv1.GetTrainingCatalogResponse {
	muscleGroups := make([]trainingv1.MuscleGroup, 0, len(catalog.MuscleGroups))
	for _, muscle := range catalog.MuscleGroups {
		muscleGroups = append(muscleGroups, muscle)
	}

	exercises := make([]*trainingv1.Exercise, 0, len(catalog.Exercises))
	for _, exercise := range catalog.Exercises {
		exercises = append(exercises, exerciseToProto(exercise))
	}

	families := make([]*trainingv1.ExerciseFamily, 0, len(catalog.ExerciseFamilies))
	for _, family := range catalog.ExerciseFamilies {
		families = append(families, &trainingv1.ExerciseFamily{Id: family.ID, Name: family.Name, Category: family.Category, Coefficients: coefficientsToProto(family.Coefficients), Notes: family.Notes})
	}

	templates := make([]*trainingv1.TemplateMesocycle, 0, len(catalog.TemplateMesocycles))
	for _, template := range catalog.TemplateMesocycles {
		templates = append(templates, &trainingv1.TemplateMesocycle{
			Id:          template.ID,
			Name:        template.Name,
			Category:    template.Category,
			Frequency:   template.Frequency,
			Gender:      template.Gender,
			Weeks:       int32(template.Weeks),
			DaysPerWeek: int32(template.DaysPerWeek),
		})
	}

	mesocycles := make([]*trainingv1.Mesocycle, 0, len(catalog.Mesocycles))
	for _, mesocycle := range catalog.Mesocycles {
		protoMeso := &trainingv1.Mesocycle{
			Id:           mesocycle.ID,
			Name:         mesocycle.Name,
			Status:       trainingv1.StringToMesocycleStatus(mesocycle.Status),
			Weeks:        int32(mesocycle.Weeks),
			DaysPerWeek:  int32(mesocycle.DaysPerWeek),
			SessionCount: int32(mesocycle.SessionCount),
			Sessions:     mesocycleSessionsToProto(mesocycle.Sessions),
		}
		protoMeso.StartedAt = mesocycle.StartedAt
		protoMeso.CompletedAt = mesocycle.CompletedAt
		protoMeso.LatestSession = mesocycle.LatestSession
		mesocycles = append(mesocycles, protoMeso)
	}

	return &trainingv1.GetTrainingCatalogResponse{
		MuscleGroups:       muscleGroups,
		Exercises:          exercises,
		ExerciseFamilies:   families,
		TemplateMesocycles: templates,
		Mesocycles:         mesocycles,
	}
}

func todayWorkoutToProto(workout domain.TodayWorkout) *trainingv1.GetTodayWorkoutResponse {
	return &trainingv1.GetTodayWorkoutResponse{
		Id:             workout.ID,
		SessionId:      workout.SessionID,
		Name:           workout.Name,
		Date:           workout.Date,
		Status:         trainingv1.StringToWorkoutStatus(workout.Status),
		Exercises:      plannedExercisesToProto(workout.Exercises),
		Muscles:        musclesToProto(workout.Muscles),
		VolumeFacts:    volumeFactsToProto(workout.VolumeFacts),
		MuscleFeedback: muscleFeedbackToProto(workout.MuscleFeedback),
		Suggestions:    suggestionsToProto(workout.Suggestions),
	}
}

func exerciseToProto(exercise domain.ExerciseSummary) *trainingv1.Exercise {
	primaryMuscles := make([]trainingv1.MuscleGroup, 0, len(exercise.PrimaryMuscles))
	for _, muscle := range exercise.PrimaryMuscles {
		primaryMuscles = append(primaryMuscles, muscle)
	}

	secondaryMuscles := make([]trainingv1.MuscleGroup, 0, len(exercise.SecondaryMuscles))
	for _, muscle := range exercise.SecondaryMuscles {
		secondaryMuscles = append(secondaryMuscles, muscle)
	}

	coefficients := coefficientsToProto(exercise.MuscleCoefficients)

	protoExercise := &trainingv1.Exercise{
		Id:                 exercise.ID,
		Name:               exercise.Name,
		PrimaryMuscle:      exercise.PrimaryMuscle,
		PrimaryMuscles:     primaryMuscles,
		SecondaryMuscles:   secondaryMuscles,
		MuscleCoefficients: coefficients,
		Equipment:          trainingv1.StringToEquipment(exercise.Equipment),
	}
	if exercise.FamilyID != nil {
		familyID := trainingv1.StringToExerciseFamilyCode(*exercise.FamilyID)
		protoExercise.FamilyId = &familyID
	}
	protoExercise.History = exerciseHistoryToProto(exercise.History)
	return protoExercise
}

func coefficientsToProto(coefficients []domain.ExerciseMuscleCoefficient) []*trainingv1.ExerciseMuscleCoefficient {
	items := make([]*trainingv1.ExerciseMuscleCoefficient, 0, len(coefficients))
	for _, coefficient := range coefficients {
		items = append(items, &trainingv1.ExerciseMuscleCoefficient{Muscle: coefficient.Muscle, Coefficient: coefficient.Coefficient})
	}
	return items
}

func plannedExercisesToProto(exercises []domain.PlannedExercise) []*trainingv1.PlannedExercise {
	items := make([]*trainingv1.PlannedExercise, 0, len(exercises))
	for _, exercise := range exercises {
		item := &trainingv1.PlannedExercise{Id: exercise.ID, ExerciseId: exercise.ExerciseID, Name: exercise.Name, Equipment: trainingv1.StringToEquipment(exercise.Equipment), Method: exercise.Method, ProgrammedSets: int32(exercise.ProgrammedSets), TargetRepRange: exercise.TargetRepRange, PreviousPerformance: exercise.PreviousPerformance, PrimaryMuscle: exercise.PrimaryMuscle, LoggedSets: loggedSetsToProto(exercise.LoggedSets)}
		if exercise.Feedback != nil {
			feedback := &trainingv1.ExerciseFeedback{Notes: exercise.Feedback.Notes}
			if exercise.Feedback.PainAfter != nil {
				feedback.PainAfter = new(int32(*exercise.Feedback.PainAfter))
			}
			item.Feedback = feedback
		}
		items = append(items, item)
	}
	return items
}

func loggedSetsToProto(sets []domain.LoggedSet) []*trainingv1.LoggedSet {
	items := make([]*trainingv1.LoggedSet, 0, len(sets))
	for _, set := range sets {
		item := &trainingv1.LoggedSet{SetIndex: int32(set.SetIndex), LoadText: set.LoadText, Reps: int32(set.Reps), Notes: set.Notes}
		if set.Pain != nil {
			item.Pain = new(int32(*set.Pain))
		}
		items = append(items, item)
	}
	return items
}

func musclesToProto(muscles []domain.MuscleGroup) []trainingv1.MuscleGroup {
	values := make([]trainingv1.MuscleGroup, 0, len(muscles))
	for _, muscle := range muscles {
		values = append(values, muscle)
	}
	return values
}

func volumeFactsToProto(facts []domain.MuscleVolumeFact) []*trainingv1.MuscleVolumeFact {
	items := make([]*trainingv1.MuscleVolumeFact, 0, len(facts))
	for _, fact := range facts {
		items = append(items, &trainingv1.MuscleVolumeFact{Muscle: fact.Muscle, SessionDirectSets: fact.SessionDirectSets, SessionIndirectSets: fact.SessionIndirectSets, SessionEffectiveSets: fact.SessionEffectiveSets, WeekToDateDirectSets: fact.WeekToDateDirectSets, WeekToDateIndirectSets: fact.WeekToDateIndirectSets, WeekToDateEffectiveSets: fact.WeekToDateEffectiveSets})
	}
	return items
}

func muscleFeedbackToProto(feedback []domain.MuscleFeedback) []*trainingv1.MuscleFeedback {
	items := make([]*trainingv1.MuscleFeedback, 0, len(feedback))
	for _, item := range feedback {
		protoFeedback := &trainingv1.MuscleFeedback{Muscle: item.Muscle, Workload: optionalFeedbackWorkloadProto(item.Workload), Notes: item.Notes}
		if item.Soreness != nil {
			protoFeedback.Soreness = new(int32(*item.Soreness))
		}
		if item.Pump != nil {
			protoFeedback.Pump = new(int32(*item.Pump))
		}
		items = append(items, protoFeedback)
	}
	return items
}

func suggestionsToProto(suggestions []domain.NextSessionSuggestion) []*trainingv1.NextSessionSuggestion {
	items := make([]*trainingv1.NextSessionSuggestion, 0, len(suggestions))
	for _, suggestion := range suggestions {
		items = append(items, &trainingv1.NextSessionSuggestion{Muscle: suggestion.Muscle, Suggestion: suggestion.Suggestion, Status: trainingv1.StringToSuggestionStatus(suggestion.Status)})
	}
	return items
}

func mesocycleSessionsToProto(sessions []domain.MesocycleSessionSummary) []*trainingv1.MesocycleSession {
	items := make([]*trainingv1.MesocycleSession, 0, len(sessions))
	for _, session := range sessions {
		item := &trainingv1.MesocycleSession{Id: session.ID, Name: session.Name, TrainingDate: session.TrainingDate, Status: trainingv1.StringToWorkoutStatus(session.Status), Source: session.Source, Notes: session.Notes, TotalSets: int32(session.TotalSets), Exercises: mesocycleExercisesToProto(session.Exercises)}
		if session.WeekNumber != nil {
			item.WeekNumber = new(int32(*session.WeekNumber))
		}
		if session.DayNumber != nil {
			item.DayNumber = new(int32(*session.DayNumber))
		}
		items = append(items, item)
	}
	return items
}

func mesocycleExercisesToProto(exercises []domain.MesocycleExerciseSummary) []*trainingv1.MesocycleExercise {
	items := make([]*trainingv1.MesocycleExercise, 0, len(exercises))
	for _, exercise := range exercises {
		items = append(items, &trainingv1.MesocycleExercise{Id: exercise.ID, Name: exercise.Name, Equipment: trainingv1.StringToEquipment(exercise.Equipment), PrimaryMuscle: exercise.PrimaryMuscle, Method: exercise.Method, TargetRepRange: exercise.TargetRepRange, Sets: loggedSetsToProto(exercise.Sets)})
	}
	return items
}

func exerciseHistoryToProto(history []domain.ExerciseHistoryEntry) []*trainingv1.ExerciseHistoryEntry {
	items := make([]*trainingv1.ExerciseHistoryEntry, 0, len(history))
	for _, entry := range history {
		items = append(items, &trainingv1.ExerciseHistoryEntry{SessionId: entry.SessionID, Label: entry.Label, WorkoutName: entry.WorkoutName, LoadText: entry.LoadText, Reps: int32(entry.Reps), SetIndex: int32(entry.SetIndex)})
	}
	return items
}

func coefficientsFromProto(coefficients []*trainingv1.ExerciseMuscleCoefficient) []domain.ExerciseMuscleCoefficient {
	items := make([]domain.ExerciseMuscleCoefficient, 0, len(coefficients))
	for _, coefficient := range coefficients {
		items = append(items, domain.ExerciseMuscleCoefficient{Muscle: coefficient.GetMuscle(), Coefficient: coefficient.GetCoefficient()})
	}
	return items
}

func optionalFeedbackWorkloadString(workload *trainingv1.FeedbackWorkload) *string {
	if workload == nil || workload.IsUnspecified() {
		return nil
	}
	return new(workload.StringVal())
}

func optionalFeedbackWorkloadProto(workload *string) *trainingv1.FeedbackWorkload {
	if workload == nil {
		return nil
	}
	value := trainingv1.StringToFeedbackWorkload(*workload)
	if value.IsUnspecified() {
		return nil
	}
	return &value
}

func optionalExerciseFamilyString(familyID *trainingv1.ExerciseFamilyCode) *string {
	if familyID == nil || familyID.IsUnspecified() {
		return nil
	}
	return new(familyID.StringVal())
}
