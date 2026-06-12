import { eq } from 'drizzle-orm';

import type { TrainingDatabase } from '$lib/server/db/client';
import { exerciseMuscleCoefficients, exercises, sessions, workoutTemplateExercises, workoutTemplates } from '$lib/server/db/schema';
import { toEquipmentType, type EquipmentType } from '$lib/training/equipment';

import { suggestExerciseFamilyId } from '../domain/exercise-families';
import type { MuscleGroup } from '../domain/muscles';
import { getMusclesForExercises } from '../domain/volume';
import type { TrainingMethod } from '../types';

type LowerBSeedExercise = {
  exerciseId: string;
  templateExerciseId: string;
  name: string;
  equipment: EquipmentType;
  method: TrainingMethod;
  programmedSets: number;
  primaryMuscle: MuscleGroup;
  coefficients: Partial<Record<MuscleGroup, number>>;
};

export const lowerBTemplateId = 'week-1-day-4-lower-b';
export const lowerBSessionId = '2026-06-11-lower-b';

const trainingDate: string | null = null;
const targetRepRange = '12-20';

export const lowerBPriorWeekVolume: Partial<Record<MuscleGroup, number>> = {
  abs: 5,
  biceps: 10,
  gastrocnemius: 9,
  chest: 10,
  brachioradialis: 3,
  front_delts: 5,
  glute_max: 4.4,
  glute_med_min: 4.5,
  hamstrings_biarticular: 2,
  lats: 10,
  quads_vasti: 5.5,
  rear_delts: 7.5,
  side_delts: 9,
  triceps_lateral_medial: 7.5,
  triceps_long_head: 5,
  upper_back: 8.75,
  upper_traps: 6.75,
  wrist_extensors: 3,
  wrist_flexors: 3
};

export const lowerBExercises: LowerBSeedExercise[] = [
  {
    exerciseId: 'barbell-bench-wrist-curl',
    templateExerciseId: 'lower-b-01-bb-bench-wrist-curls',
    name: 'Barbell Bench Wrist Curl',
    equipment: 'Barbell',
    method: 'myo-match',
    programmedSets: 3,
    primaryMuscle: 'wrist_flexors',
    coefficients: { wrist_flexors: 1 }
  },
  {
    exerciseId: 'belt-squat',
    templateExerciseId: 'lower-b-02-belt-squats',
    name: 'Belt Squat',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'quads_vasti',
    coefficients: { quads_vasti: 1, glute_max: 0.5, adductors: 0.5 }
  },
  {
    exerciseId: 'lying-leg-curl',
    templateExerciseId: 'lower-b-03-lying-leg-curls',
    name: 'Lying Leg Curl',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 3,
    primaryMuscle: 'hamstrings_biarticular',
    coefficients: { biceps_femoris_short_head: 1, hamstrings_biarticular: 1 }
  },
  {
    exerciseId: 'machine-hip-thrust',
    templateExerciseId: 'lower-b-04-machine-hip-thrusts',
    name: 'Machine Hip Thrust',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'glute_max',
    coefficients: { glute_max: 1 }
  },
  {
    exerciseId: 'deficit-trap-bar-squats-no-touch',
    templateExerciseId: 'lower-b-05-deficit-trap-bar-squats-no-touch',
    name: 'Deficit Trap Bar Squats, no touch',
    equipment: 'Barbell',
    method: 'regular',
    programmedSets: 1,
    primaryMuscle: 'quads_vasti',
    coefficients: { quads_vasti: 1, glute_max: 0.5, adductors: 0.5 }
  },
  {
    exerciseId: 'trap-bar-shrugs',
    templateExerciseId: 'lower-b-06-trap-bar-shrugs',
    name: 'Trap Bar Shrugs',
    equipment: 'Barbell',
    method: 'myo-match',
    programmedSets: 3,
    primaryMuscle: 'upper_traps',
    coefficients: { upper_traps: 1 }
  },
  {
    exerciseId: 'reverse-crunches',
    templateExerciseId: 'lower-b-07-reverse-crunches',
    name: 'Reverse Crunches',
    equipment: 'Bodyweight/loadable',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'abs',
    coefficients: { 'abs': 1 }
  },
  {
    exerciseId: 'machine-crunch',
    templateExerciseId: 'lower-b-08-machine-crunches',
    name: 'Machine Crunch',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'abs',
    coefficients: { 'abs': 1 }
  }
];

export const getLowerBMuscles = () => getMusclesForExercises(lowerBExercises);

export const seedLowerB = (db: TrainingDatabase) => {
  const now = new Date().toISOString();

  db.insert(workoutTemplates)
    .values({ id: lowerBTemplateId, name: 'Lower B', rotationOrder: 4 })
    .onConflictDoUpdate({
      target: workoutTemplates.id,
      set: { name: 'Lower B', rotationOrder: 4 }
    })
    .run();

  lowerBExercises.forEach((exercise, index) => {
    const familyId = suggestExerciseFamilyId(exercise.name, exercise.equipment);

    db.insert(exercises)
      .values({
        id: exercise.exerciseId,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        familyId,
        equipment: toEquipmentType(exercise.equipment)
      })
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          name: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
          familyId,
          equipment: toEquipmentType(exercise.equipment)
        }
      })
      .run();

    db.insert(workoutTemplateExercises)
      .values({
        id: exercise.templateExerciseId,
        templateId: lowerBTemplateId,
        exerciseId: exercise.exerciseId,
        position: index + 1,
        programmedSets: exercise.programmedSets,
        method: exercise.method,
        targetRepRange
      })
      .onConflictDoUpdate({
        target: workoutTemplateExercises.id,
        set: {
          position: index + 1,
          programmedSets: exercise.programmedSets,
          method: exercise.method,
          targetRepRange
        }
      })
      .run();

    getMusclesForExercises([exercise]).forEach((muscle) => {
      const coefficient = exercise.coefficients[muscle] ?? 0;

      db.insert(exerciseMuscleCoefficients)
        .values({
          exerciseId: exercise.exerciseId,
          muscle,
          coefficient
        })
        .onConflictDoUpdate({
          target: [exerciseMuscleCoefficients.exerciseId, exerciseMuscleCoefficients.muscle],
          set: { coefficient }
        })
        .run();
    });
  });

  db.insert(sessions)
    .values({
      id: lowerBSessionId,
      templateId: lowerBTemplateId,
      trainingDate,
      status: 'planned',
      notes: null,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: sessions.id,
      set: { templateId: lowerBTemplateId, updatedAt: now }
    })
    .run();

  const currentSession = db.select().from(sessions).where(eq(sessions.id, lowerBSessionId)).get();

  if (currentSession?.status !== 'completed') {
    db.update(sessions)
      .set({ trainingDate, updatedAt: now })
      .where(eq(sessions.id, lowerBSessionId))
      .run();
  }
};
