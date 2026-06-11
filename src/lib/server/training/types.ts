import type { EquipmentType } from '$lib/training/equipment';

export type TrainingMethod = 'regular' | 'myo-match';

export type TabKey = 'workout' | 'mesos' | 'templates' | 'exercises';

export type MesoStatus = 'current' | 'planned' | 'completed';

export type PlannedExercise = {
  id: string;
  exerciseId: string;
  name: string;
  equipment: EquipmentType;
  method: TrainingMethod;
  programmedSets: number;
  targetRepRange: string;
  previousPerformance: string;
  primaryMuscle: string;
  loggedSets: LoggedSet[];
  feedback: ExerciseFeedback | null;
};

export type LoggedSet = {
  setIndex: number;
  loadText: string;
  reps: number;
  notes: string | null;
  pain: number | null;
};

export type ExerciseFeedback = {
  painAfter: number | null;
  notes: string | null;
};

export type MuscleFeedback = {
  muscle: string;
  soreness: number | null;
  pump: number | null;
  workload: WorkloadRating | null;
  notes: string | null;
};

export type MuscleVolumeFact = {
  muscle: string;
  sessionEffectiveSets: number;
  weekToDateEffectiveSets: number;
};

export type NextSessionSuggestion = {
  muscle: string;
  suggestion: string;
  status: SuggestionStatus;
};

export type SuggestionStatus = 'proposed' | 'accepted' | 'ignored' | 'edited';

export type WorkloadRating = 'too-low' | 'good' | 'too-high';

export type TodayWorkout = {
  id: string;
  sessionId: string;
  name: string;
  date: string | null;
  status: 'planned' | 'in-progress' | 'completed';
  exercises: PlannedExercise[];
  muscles: string[];
  volumeFacts: MuscleVolumeFact[];
  muscleFeedback: MuscleFeedback[];
  suggestions: NextSessionSuggestion[];
};

export type MesocycleSummary = {
  id: string;
  name: string;
  status: MesoStatus;
  weeks: number;
  daysPerWeek: number;
  startedAt: string | null;
  completedAt: string | null;
  sessionCount: number;
  latestSession: string | null;
  sessions: MesocycleSessionSummary[];
};

export type MesocycleSessionSummary = {
  id: string;
  name: string;
  trainingDate: string | null;
  status: 'planned' | 'in-progress' | 'completed';
  weekNumber: number | null;
  dayNumber: number | null;
  source: string | null;
  notes: string | null;
  totalSets: number;
  exercises: MesocycleExerciseSummary[];
};

export type MesocycleExerciseSummary = {
  id: string;
  name: string;
  equipment: EquipmentType;
  primaryMuscle: string;
  method: TrainingMethod;
  targetRepRange: string;
  sets: LoggedSet[];
};

export type TemplateMesocycleSummary = {
  id: string;
  name: string;
  category: string;
  frequency: string;
  gender: string;
  weeks: number;
  daysPerWeek: number;
};

export type ExerciseSummary = {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: EquipmentType;
  history: ExerciseHistoryEntry[];
};

export type ExerciseHistoryEntry = {
  sessionId: string;
  label: string;
  workoutName: string;
  loadText: string;
  reps: number;
  setIndex: number;
};

export type TrainingCatalog = {
  mesocycles: MesocycleSummary[];
  templateMesocycles: TemplateMesocycleSummary[];
  exercises: ExerciseSummary[];
};
