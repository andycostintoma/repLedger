import type { MuscleVolumeFact, TrainingMethod } from '../types';
import { getLoggedSetEquivalents } from './sets';

type VolumeExercise = {
  templateExerciseId: string;
  method: TrainingMethod;
  coefficients: Record<string, number>;
};

type LoggedSetRef = {
  templateExerciseId: string;
};

export const getMusclesForExercises = (exercises: VolumeExercise[]) =>
  [...new Set(exercises.flatMap((exercise) => Object.keys(exercise.coefficients)))].sort();

export const buildMuscleVolumeFacts = (input: {
  exercises: VolumeExercise[];
  savedSets: LoggedSetRef[];
  priorWeekVolume: Record<string, number>;
}): MuscleVolumeFact[] => {
  const sessionVolume = new Map<string, number>();

  input.exercises.forEach((exercise) => {
    const loggedSetCount = input.savedSets.filter((set) => set.templateExerciseId === exercise.templateExerciseId).length;
    const setEquivalents = getLoggedSetEquivalents(exercise.method, loggedSetCount);

    Object.entries(exercise.coefficients).forEach(([muscle, coefficient]) => {
      sessionVolume.set(muscle, (sessionVolume.get(muscle) ?? 0) + setEquivalents * coefficient);
    });
  });

  return getMusclesForExercises(input.exercises).map((muscle) => ({
    muscle,
    sessionEffectiveSets: roundVolume(sessionVolume.get(muscle) ?? 0),
    weekToDateEffectiveSets: roundVolume((input.priorWeekVolume[muscle] ?? 0) + (sessionVolume.get(muscle) ?? 0))
  }));
};

export const roundVolume = (value: number) => Math.round(value * 4) / 4;
