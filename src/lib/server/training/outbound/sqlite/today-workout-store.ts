import { asc, eq, inArray } from 'drizzle-orm';
import { err, ok, type Result } from 'neverthrow';

import { getDb, type TrainingDatabase } from '$lib/server/db/client';
import {
  exerciseFeedback,
  exerciseMuscleCoefficients,
  exercises,
  loggedSets,
  muscleFeedback,
  nextSessionSuggestions,
  sessions,
  workoutTemplateExercises
} from '$lib/server/db/schema';
import { toEquipmentType } from '$lib/training/equipment';

import { buildMuscleFeedbackSuggestion, buildPainSuggestion } from '../../domain/suggestions';
import type { MuscleGroup } from '../../domain/muscles';
import { buildMuscleVolumeFacts, getMusclesForExercises } from '../../domain/volume';
import { lowerBExercises, lowerBPriorWeekVolume, lowerBSessionId, lowerBTemplateId, seedLowerB } from '../../seeds/lower-b';
import type { SuggestionStatus, TodayWorkout, WorkloadRating } from '../../types';

type TrainingStoreError = {
  kind: 'training-store-error';
  message: string;
};

export type SaveLoggedSetInput = {
  sessionId: string;
  templateExerciseId: string;
  setIndex: number;
  loadText: string;
  reps: number;
  notes: string | null;
  pain: number | null;
};

export type SaveLoggedSetOutput = {
  sessionId: string;
  templateExerciseId: string;
  setIndex: number;
};

export type SaveExerciseFeedbackInput = {
  sessionId: string;
  templateExerciseId: string;
  painAfter: number | null;
  notes: string | null;
};

export type SaveMuscleFeedbackInput = {
  sessionId: string;
  muscle: MuscleGroup;
  soreness: number | null;
  pump: number | null;
  workload: WorkloadRating | null;
  notes: string | null;
};

export type SaveSuggestionInput = {
  sessionId: string;
  muscle: MuscleGroup;
  suggestion: string;
  status: SuggestionStatus;
};

export type CompleteWorkoutInput = {
  sessionId: string;
};

export const getTodayWorkout = async (): Promise<Result<TodayWorkout, TrainingStoreError>> => {
  try {
    const db = await getDb();

    seedLowerB(db);

    const plannedExercises = db
      .select({
        templateExerciseId: workoutTemplateExercises.id,
        exerciseId: exercises.id,
        name: exercises.name,
        primaryMuscle: exercises.primaryMuscle,
        equipment: exercises.equipment,
        method: workoutTemplateExercises.method,
        programmedSets: workoutTemplateExercises.programmedSets,
        targetRepRange: workoutTemplateExercises.targetRepRange
      })
      .from(workoutTemplateExercises)
      .innerJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
      .where(eq(workoutTemplateExercises.templateId, lowerBTemplateId))
      .orderBy(asc(workoutTemplateExercises.position))
      .all();

    const coefficientsByExerciseId = loadExerciseCoefficientMap(
      db,
      plannedExercises.map((exercise) => exercise.exerciseId)
    );
    const volumeExercises = plannedExercises.map((exercise) => ({
      templateExerciseId: exercise.templateExerciseId,
      method: exercise.method,
      coefficients: coefficientsByExerciseId.get(exercise.exerciseId) ?? { [exercise.primaryMuscle]: 1 }
    }));

    const savedSets = db.select().from(loggedSets).where(eq(loggedSets.sessionId, lowerBSessionId)).all();
    const savedExerciseFeedback = db.select().from(exerciseFeedback).where(eq(exerciseFeedback.sessionId, lowerBSessionId)).all();
    const savedMuscleFeedback = db.select().from(muscleFeedback).where(eq(muscleFeedback.sessionId, lowerBSessionId)).all();
    const savedSuggestions = db.select().from(nextSessionSuggestions).where(eq(nextSessionSuggestions.sessionId, lowerBSessionId)).all();
    const savedSession = db.select().from(sessions).where(eq(sessions.id, lowerBSessionId)).get();
    const muscles = getMusclesForExercises(volumeExercises);
    const volumeFacts = buildMuscleVolumeFacts({ exercises: volumeExercises, savedSets, priorWeekVolume: lowerBPriorWeekVolume });
    const status = savedSession?.status === 'completed' ? 'completed' : savedSets.length > 0 ? 'in-progress' : 'planned';

    return ok({
      id: lowerBTemplateId,
      sessionId: lowerBSessionId,
      name: 'Lower B',
      date: savedSession?.trainingDate ?? null,
      status,
      exercises: plannedExercises.map((exercise) => {
        const seedExercise = lowerBExercises.find((seed) => seed.templateExerciseId === exercise.templateExerciseId);

        if (!seedExercise) {
          throw new Error(`Missing domain exercise seed for ${exercise.templateExerciseId}`);
        }

        return {
          id: exercise.templateExerciseId,
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          equipment: toEquipmentType(exercise.equipment),
          method: exercise.method,
          programmedSets: exercise.programmedSets,
          targetRepRange: exercise.targetRepRange,
          previousPerformance: getPreviousPerformance(db, exercise.exerciseId),
          primaryMuscle: exercise.primaryMuscle,
          loggedSets: savedSets
            .filter((set) => set.templateExerciseId === exercise.templateExerciseId)
            .sort((a, b) => a.setIndex - b.setIndex)
            .map((set) => ({
              setIndex: set.setIndex,
              loadText: set.loadText,
              reps: set.reps,
              notes: set.notes,
              pain: set.pain
            })),
          feedback:
            savedExerciseFeedback.find((feedback) => feedback.templateExerciseId === exercise.templateExerciseId) ?? null
        };
      }),
      muscles,
      volumeFacts,
      muscleFeedback: muscles.map((muscle) => {
        const feedback = savedMuscleFeedback.find((entry) => entry.muscle === muscle);

        return {
          muscle,
          soreness: feedback?.soreness ?? null,
          pump: feedback?.pump ?? null,
          workload: feedback?.workload ?? null,
          notes: feedback?.notes ?? null
        };
      }),
      suggestions: savedSuggestions
        .sort((a, b) => a.muscle.localeCompare(b.muscle))
        .map((suggestion) => ({
          muscle: suggestion.muscle,
          suggestion: suggestion.suggestion,
          status: suggestion.status
        }))
    });
  } catch (error) {
    return err(toTrainingStoreError(error));
  }
};

export const upsertExerciseFeedback = async (input: SaveExerciseFeedbackInput): Promise<Result<void, TrainingStoreError>> => {
  try {
    const db = await getDb();

    seedLowerB(db);

    const now = new Date().toISOString();

    db.insert(exerciseFeedback)
      .values({
        id: `${input.sessionId}-${input.templateExerciseId}`,
        sessionId: input.sessionId,
        templateExerciseId: input.templateExerciseId,
        painAfter: input.painAfter,
        notes: input.notes,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [exerciseFeedback.sessionId, exerciseFeedback.templateExerciseId],
        set: {
          painAfter: input.painAfter,
          notes: input.notes,
          updatedAt: now
        }
      })
      .run();

    const exercise = lowerBExercises.find((seed) => seed.templateExerciseId === input.templateExerciseId);

    if (exercise && input.painAfter !== null && input.painAfter >= 4) {
      upsertGeneratedSuggestion(
        db,
        input.sessionId,
        exercise.primaryMuscle,
        buildPainSuggestion({ exerciseName: exercise.name, muscle: exercise.primaryMuscle, painAfter: input.painAfter })
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(toTrainingStoreError(error));
  }
};

export const upsertMuscleFeedback = async (input: SaveMuscleFeedbackInput): Promise<Result<void, TrainingStoreError>> => {
  try {
    const db = await getDb();

    seedLowerB(db);

    const now = new Date().toISOString();

    db.insert(muscleFeedback)
      .values({
        id: `${input.sessionId}-${input.muscle}`,
        sessionId: input.sessionId,
        muscle: input.muscle,
        soreness: input.soreness,
        pump: input.pump,
        workload: input.workload,
        notes: input.notes,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [muscleFeedback.sessionId, muscleFeedback.muscle],
        set: {
          soreness: input.soreness,
          pump: input.pump,
          workload: input.workload,
          notes: input.notes,
          updatedAt: now
        }
      })
      .run();

    upsertGeneratedSuggestion(db, input.sessionId, input.muscle, buildMuscleFeedbackSuggestion(input));

    return ok(undefined);
  } catch (error) {
    return err(toTrainingStoreError(error));
  }
};

export const upsertSuggestion = async (input: SaveSuggestionInput): Promise<Result<void, TrainingStoreError>> => {
  try {
    const db = await getDb();

    seedLowerB(db);

    upsertGeneratedSuggestion(db, input.sessionId, input.muscle, input.suggestion, input.status);

    return ok(undefined);
  } catch (error) {
    return err(toTrainingStoreError(error));
  }
};

export const completeWorkout = async (input: CompleteWorkoutInput): Promise<Result<void, TrainingStoreError>> => {
  try {
    const db = await getDb();

    seedLowerB(db);

    db.update(sessions)
      .set({
        status: 'completed',
        trainingDate: localDateString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(sessions.id, input.sessionId))
      .run();

    return ok(undefined);
  } catch (error) {
    return err(toTrainingStoreError(error));
  }
};

export const upsertLoggedSet = async (input: SaveLoggedSetInput): Promise<Result<SaveLoggedSetOutput, TrainingStoreError>> => {
  try {
    const db = await getDb();

    seedLowerB(db);

    db.insert(loggedSets)
      .values({
        id: `${input.sessionId}-${input.templateExerciseId}-${input.setIndex}`,
        sessionId: input.sessionId,
        templateExerciseId: input.templateExerciseId,
        setIndex: input.setIndex,
        loadText: input.loadText,
        reps: input.reps,
        notes: input.notes,
        pain: input.pain
      })
      .onConflictDoUpdate({
        target: [loggedSets.sessionId, loggedSets.templateExerciseId, loggedSets.setIndex],
        set: {
          loadText: input.loadText,
          reps: input.reps,
          notes: input.notes,
          pain: input.pain
        }
      })
      .run();

    return ok({
      sessionId: input.sessionId,
      templateExerciseId: input.templateExerciseId,
      setIndex: input.setIndex
    });
  } catch (error) {
    return err(toTrainingStoreError(error));
  }
};

const getPreviousPerformance = (db: TrainingDatabase, exerciseId: string) => {
  const previousSets = db
    .select({
      sessionId: sessions.id,
      trainingDate: sessions.trainingDate,
      loadText: loggedSets.loadText,
      reps: loggedSets.reps
    })
    .from(loggedSets)
    .innerJoin(sessions, eq(loggedSets.sessionId, sessions.id))
    .innerJoin(workoutTemplateExercises, eq(loggedSets.templateExerciseId, workoutTemplateExercises.id))
    .where(eq(workoutTemplateExercises.exerciseId, exerciseId))
    .orderBy(asc(sessions.trainingDate), asc(loggedSets.setIndex))
    .all()
    .filter((set) => set.sessionId !== lowerBSessionId && set.trainingDate !== null);

  if (previousSets.length === 0) {
    return 'No prior exact exercise logged';
  }

  const lastDate = previousSets.at(-1)?.trainingDate;
  const lastSets = previousSets.filter((set) => set.trainingDate === lastDate);
  const load = lastSets[0]?.loadText ?? 'unknown load';
  const reps = lastSets.map((set) => set.reps).join(', ');

  return `${lastDate}: ${load} x ${reps}`;
};

const loadExerciseCoefficientMap = (db: TrainingDatabase, exerciseIds: string[]) => {
  const coefficientsByExerciseId = new Map<string, Partial<Record<MuscleGroup, number>>>();

  if (exerciseIds.length === 0) {
    return coefficientsByExerciseId;
  }

  const coefficientRows = db
    .select({
      exerciseId: exerciseMuscleCoefficients.exerciseId,
      muscle: exerciseMuscleCoefficients.muscle,
      coefficient: exerciseMuscleCoefficients.coefficient
    })
    .from(exerciseMuscleCoefficients)
    .where(inArray(exerciseMuscleCoefficients.exerciseId, exerciseIds))
    .all();

  coefficientRows.forEach((row) => {
    const coefficients = coefficientsByExerciseId.get(row.exerciseId) ?? {};
    coefficients[row.muscle] = row.coefficient;
    coefficientsByExerciseId.set(row.exerciseId, coefficients);
  });

  return coefficientsByExerciseId;
};

const localDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const upsertGeneratedSuggestion = (
  db: TrainingDatabase,
  currentSessionId: string,
  muscle: MuscleGroup,
  suggestion: string,
  status: SuggestionStatus = 'proposed'
) => {
  const now = new Date().toISOString();

  db.insert(nextSessionSuggestions)
    .values({
      id: `${currentSessionId}-${muscle}`,
      sessionId: currentSessionId,
      muscle,
      suggestion,
      status,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [nextSessionSuggestions.sessionId, nextSessionSuggestions.muscle],
      set: {
        suggestion,
        status,
        updatedAt: now
      }
    })
    .run();
};

const toTrainingStoreError = (error: unknown): TrainingStoreError => ({
  kind: 'training-store-error',
  message: error instanceof Error ? error.message : 'Unknown training store error'
});
