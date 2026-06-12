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
  const sessionDirectVolume = new Map<MuscleGroup, number>();
  const sessionIndirectVolume = new Map<MuscleGroup, number>();

  input.exercises.forEach((exercise) => {
    const loggedSetCount = input.savedSets.filter((set) => set.templateExerciseId === exercise.templateExerciseId).length;
    const setEquivalents = getLoggedSetEquivalents(exercise.method, loggedSetCount);

    getMusclesForExercises([exercise]).forEach((muscle) => {
      const coefficient = exercise.coefficients[muscle] ?? 0;

      sessionVolume.set(muscle, (sessionVolume.get(muscle) ?? 0) + setEquivalents * coefficient);

      if (coefficient === 1) {
        sessionDirectVolume.set(muscle, (sessionDirectVolume.get(muscle) ?? 0) + setEquivalents);
      } else if (coefficient > 0) {
        sessionIndirectVolume.set(muscle, (sessionIndirectVolume.get(muscle) ?? 0) + setEquivalents);
      }
    });
  });

  return getMusclesForExercises(input.exercises).map((muscle) => ({
    muscle,
    sessionDirectSets: roundVolume(sessionDirectVolume.get(muscle) ?? 0),
    sessionIndirectSets: roundVolume(sessionIndirectVolume.get(muscle) ?? 0),
    sessionEffectiveSets: roundVolume(sessionVolume.get(muscle) ?? 0),
    weekToDateDirectSets: roundVolume(sessionDirectVolume.get(muscle) ?? 0),
    weekToDateIndirectSets: roundVolume(sessionIndirectVolume.get(muscle) ?? 0),
    weekToDateEffectiveSets: roundVolume((input.priorWeekVolume[muscle] ?? 0) + (sessionVolume.get(muscle) ?? 0))
  }));
};

export const roundVolume = (value: number) => Math.round(value * 4) / 4;
