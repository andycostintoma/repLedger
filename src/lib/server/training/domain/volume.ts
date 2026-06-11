import type { MuscleVolumeFact, TrainingMethod } from '../types';
import { muscleGroups, type MuscleGroup } from './muscles';
import { getLoggedSetEquivalents } from './sets';

type VolumeExercise = {
  templateExerciseId: string;
  method: TrainingMethod;
  coefficients: Partial<Record<MuscleGroup, number>>;
};

type LoggedSetRef = {
  templateExerciseId: string;
};

export const getMusclesForExercises = (exercises: VolumeExercise[]) =>
  muscleGroups.filter((muscle) => exercises.some((exercise) => exercise.coefficients[muscle] !== undefined));

export const buildMuscleVolumeFacts = (input: {
  exercises: VolumeExercise[];
  savedSets: LoggedSetRef[];
  priorWeekVolume: Partial<Record<MuscleGroup, number>>;
}): MuscleVolumeFact[] => {
  const sessionVolume = new Map<MuscleGroup, number>();

  input.exercises.forEach((exercise) => {
    const loggedSetCount = input.savedSets.filter((set) => set.templateExerciseId === exercise.templateExerciseId).length;
    const setEquivalents = getLoggedSetEquivalents(exercise.method, loggedSetCount);

    getMusclesForExercises([exercise]).forEach((muscle) => {
      sessionVolume.set(muscle, (sessionVolume.get(muscle) ?? 0) + setEquivalents * (exercise.coefficients[muscle] ?? 0));
    });
  });

  return getMusclesForExercises(input.exercises).map((muscle) => ({
    muscle,
    sessionEffectiveSets: roundVolume(sessionVolume.get(muscle) ?? 0),
    weekToDateEffectiveSets: roundVolume((input.priorWeekVolume[muscle] ?? 0) + (sessionVolume.get(muscle) ?? 0))
  }));
};

export const roundVolume = (value: number) => Math.round(value * 4) / 4;
