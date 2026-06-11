import { eq } from 'drizzle-orm';

import type { TrainingDatabase } from '$lib/server/db/client';
import { exerciseMuscleCoefficients, exercises, sessions, workoutTemplateExercises, workoutTemplates } from '$lib/server/db/schema';
import { toEquipmentType, type EquipmentType } from '$lib/training/equipment';

import { getMusclesForExercises } from '../domain/volume';
import type { TrainingMethod } from '../types';

type LowerBSeedExercise = {
  exerciseId: string;
  templateExerciseId: string;
  name: string;
  equipment: EquipmentType;
  method: TrainingMethod;
  programmedSets: number;
  primaryMuscle: string;
  coefficients: Record<string, number>;
};

export const lowerBTemplateId = 'week-1-day-4-lower-b';
export const lowerBSessionId = '2026-06-11-lower-b';

const trainingDate: string | null = null;
const targetRepRange = '12-20';

export const lowerBPriorWeekVolume: Record<string, number> = {
  abs: 5,
  biceps: 10,
  calves: 9,
  chest: 10,
  forearms: 9,
  'front delts': 5,
  'glute med': 4.5,
  glutes: 4.4,
  hamstrings: 2,
  lats: 10,
  quads: 5.5,
  'rear delts': 7.5,
  'side delts': 9,
  'triceps long head direct': 5,
  'triceps total / lateral-medial': 7.5,
  'upper back': 8.75,
  'upper traps': 6.75
};

export const lowerBExercises: LowerBSeedExercise[] = [
  {
    exerciseId: 'barbell-bench-wrist-curl',
    templateExerciseId: 'lower-b-01-bb-bench-wrist-curls',
    name: 'Barbell Bench Wrist Curl',
    equipment: 'Barbell',
    method: 'myo-match',
    programmedSets: 3,
    primaryMuscle: 'forearms',
    coefficients: { forearms: 1 }
  },
  {
    exerciseId: 'belt-squat',
    templateExerciseId: 'lower-b-02-belt-squats',
    name: 'Belt Squat',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'quads',
    coefficients: { quads: 1, glutes: 0.75 }
  },
  {
    exerciseId: 'lying-leg-curl',
    templateExerciseId: 'lower-b-03-lying-leg-curls',
    name: 'Lying Leg Curl',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 3,
    primaryMuscle: 'hamstrings',
    coefficients: { hamstrings: 1 }
  },
  {
    exerciseId: 'machine-hip-thrust',
    templateExerciseId: 'lower-b-04-machine-hip-thrusts',
    name: 'Machine Hip Thrust',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'glutes',
    coefficients: { glutes: 1 }
  },
  {
    exerciseId: 'deficit-trap-bar-squats-no-touch',
    templateExerciseId: 'lower-b-05-deficit-trap-bar-squats-no-touch',
    name: 'Deficit Trap Bar Squats, no touch',
    equipment: 'Barbell',
    method: 'regular',
    programmedSets: 1,
    primaryMuscle: 'quads',
    coefficients: { quads: 1, glutes: 0.75 }
  },
  {
    exerciseId: 'trap-bar-shrugs',
    templateExerciseId: 'lower-b-06-trap-bar-shrugs',
    name: 'Trap Bar Shrugs',
    equipment: 'Barbell',
    method: 'myo-match',
    programmedSets: 3,
    primaryMuscle: 'upper traps',
    coefficients: { 'upper traps': 1 }
  },
  {
    exerciseId: 'reverse-crunches',
    templateExerciseId: 'lower-b-07-reverse-crunches',
    name: 'Reverse Crunches',
    equipment: 'Bodyweight/loadable',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'abs',
    coefficients: { abs: 1 }
  },
  {
    exerciseId: 'machine-crunch',
    templateExerciseId: 'lower-b-08-machine-crunches',
    name: 'Machine Crunch',
    equipment: 'Machine',
    method: 'myo-match',
    programmedSets: 2,
    primaryMuscle: 'abs',
    coefficients: { abs: 1 }
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
    db.insert(exercises)
      .values({
        id: exercise.exerciseId,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        equipment: toEquipmentType(exercise.equipment)
      })
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          name: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
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

    Object.entries(exercise.coefficients).forEach(([muscle, coefficient]) => {
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
