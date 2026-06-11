import { asc } from 'drizzle-orm';
import { err, ok, type Result } from 'neverthrow';

import { getDb } from '$lib/server/db/client';
import { exercises, loggedSets, mesocycles, sessions, templateMesocycles, workoutTemplateExercises, workoutTemplates } from '$lib/server/db/schema';
import { toEquipmentType, type EquipmentType } from '$lib/training/equipment';
import { normalizedExerciseName } from '$lib/training/exercise-normalization';

import { seedCatalog } from '../../seeds/catalog';
import type { ExerciseHistoryEntry, LoggedSet, MesoStatus, MesocycleExerciseSummary, MesocycleSessionSummary, TrainingCatalog } from '../../types';

type TrainingCatalogError = {
  kind: 'training-catalog-error';
  message: string;
};

export type CreateMesocycleInput = {
  name: string;
  status: MesoStatus;
  weeks: number;
  daysPerWeek: number;
  templateMesoId?: string | null;
};

export type CreateTemplateMesocycleInput = {
  name: string;
  category: string;
  frequency: string;
  gender: string;
  weeks: number;
  daysPerWeek: number;
};

export type CreateExerciseInput = {
  name: string;
  primaryMuscle: string;
  equipment: EquipmentType;
};

export const getTrainingCatalog = async (): Promise<Result<TrainingCatalog, TrainingCatalogError>> => {
  try {
    const db = await getDb();

    seedCatalog(db);

    const savedMesocycles = db.select().from(mesocycles).orderBy(asc(mesocycles.status), asc(mesocycles.name)).all();
    const savedTemplateMesocycles = db.select().from(templateMesocycles).orderBy(asc(templateMesocycles.name)).all();
    const savedExercises = db.select().from(exercises).orderBy(asc(exercises.primaryMuscle), asc(exercises.name)).all();
    const savedSessions = db.select().from(sessions).all();
    const savedWorkoutTemplates = db.select().from(workoutTemplates).all();
    const savedTemplateExercises = db.select().from(workoutTemplateExercises).all();
    const savedLoggedSets = db.select().from(loggedSets).all();

    return ok({
      mesocycles: savedMesocycles.map((mesocycle) => ({
        id: mesocycle.id,
        name: mesocycle.name,
        status: mesocycle.status,
        weeks: mesocycle.weeks,
        daysPerWeek: mesocycle.daysPerWeek,
        startedAt: mesocycle.startedAt,
        completedAt: mesocycle.completedAt,
        sessionCount: savedSessions.filter((session) => session.mesocycleId === mesocycle.id).length,
        latestSession: getLatestSessionLabel(savedSessions.filter((session) => session.mesocycleId === mesocycle.id)),
        sessions: buildMesoSessions({
          mesocycleId: mesocycle.id,
          sessions: savedSessions,
          workoutTemplates: savedWorkoutTemplates,
          templateExercises: savedTemplateExercises,
          exercises: savedExercises,
          loggedSets: savedLoggedSets
        })
      })),
      templateMesocycles: savedTemplateMesocycles.map((template) => ({
        id: template.id,
        name: template.name,
        category: template.category,
        frequency: template.frequency,
        gender: template.gender,
        weeks: template.weeks,
        daysPerWeek: template.daysPerWeek
      })),
      exercises: savedExercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        equipment: toEquipmentType(exercise.equipment),
        history: buildExerciseHistory({
          exercise,
          exercises: savedExercises,
          sessions: savedSessions,
          workoutTemplates: savedWorkoutTemplates,
          templateExercises: savedTemplateExercises,
          loggedSets: savedLoggedSets
        })
      }))
    });
  } catch (error) {
    return err(toTrainingCatalogError(error));
  }
};

export const createMesocycle = async (input: CreateMesocycleInput): Promise<Result<void, TrainingCatalogError>> => {
  try {
    const db = await getDb();
    const now = new Date().toISOString();

    seedCatalog(db);

    db.insert(mesocycles)
      .values({
        id: slugWithTime(input.name),
        name: input.name,
        status: input.status,
        weeks: input.weeks,
        daysPerWeek: input.daysPerWeek,
        startedAt: input.status === 'current' ? now.slice(0, 10) : null,
        completedAt: input.status === 'completed' ? now.slice(0, 10) : null,
        templateMesoId: input.templateMesoId ?? null,
        updatedAt: now
      })
      .run();

    return ok(undefined);
  } catch (error) {
    return err(toTrainingCatalogError(error));
  }
};

export const createTemplateMesocycle = async (input: CreateTemplateMesocycleInput): Promise<Result<void, TrainingCatalogError>> => {
  try {
    const db = await getDb();
    const now = new Date().toISOString();

    seedCatalog(db);

    db.insert(templateMesocycles)
      .values({
        id: slugWithTime(input.name),
        name: input.name,
        category: input.category,
        frequency: input.frequency,
        gender: input.gender,
        weeks: input.weeks,
        daysPerWeek: input.daysPerWeek,
        updatedAt: now
      })
      .run();

    return ok(undefined);
  } catch (error) {
    return err(toTrainingCatalogError(error));
  }
};

export const createExercise = async (input: CreateExerciseInput): Promise<Result<void, TrainingCatalogError>> => {
  try {
    const db = await getDb();

    db.insert(exercises)
        .values({
          id: slugWithTime(input.name),
          name: input.name,
          primaryMuscle: input.primaryMuscle,
          equipment: toEquipmentType(input.equipment)
        })
      .run();

    return ok(undefined);
  } catch (error) {
    return err(toTrainingCatalogError(error));
  }
};

const slugWithTime = (value: string) => `${slugify(value)}-${Date.now().toString(36)}`;

const getLatestSessionLabel = (mesocycleSessions: Array<typeof sessions.$inferSelect>) => {
  const latest = [...mesocycleSessions]
    .filter((session) => session.trainingDate !== null)
    .sort((a, b) => (b.trainingDate ?? '').localeCompare(a.trainingDate ?? ''))[0];

  if (!latest) return null;

  const week = latest.weekNumber ? `W${latest.weekNumber}` : null;
  const day = latest.dayNumber ? `D${latest.dayNumber}` : null;
  const label = [week, day].filter(Boolean).join(' ');

  return label.length > 0 ? `${label} · ${latest.trainingDate}` : latest.trainingDate;
};

const buildMesoSessions = (input: {
  mesocycleId: string;
  sessions: Array<typeof sessions.$inferSelect>;
  workoutTemplates: Array<typeof workoutTemplates.$inferSelect>;
  templateExercises: Array<typeof workoutTemplateExercises.$inferSelect>;
  exercises: Array<typeof exercises.$inferSelect>;
  loggedSets: Array<typeof loggedSets.$inferSelect>;
}): MesocycleSessionSummary[] => {
  const templatesById = new Map(input.workoutTemplates.map((template) => [template.id, template]));
  const exercisesById = new Map(input.exercises.map((exercise) => [exercise.id, exercise]));

  return input.sessions
    .filter((session) => session.mesocycleId === input.mesocycleId)
    .sort(compareSessions)
    .map((session) => {
      const sessionTemplateExercises = input.templateExercises
        .filter((templateExercise) => templateExercise.templateId === session.templateId)
        .sort((a, b) => a.position - b.position);

      const sessionExercises = sessionTemplateExercises.map((templateExercise): MesocycleExerciseSummary | null => {
        const exercise = exercisesById.get(templateExercise.exerciseId);

        if (!exercise) return null;

        return {
          id: templateExercise.id,
          name: exercise.name,
          equipment: toEquipmentType(exercise.equipment),
          primaryMuscle: exercise.primaryMuscle,
          method: templateExercise.method,
          targetRepRange: templateExercise.targetRepRange,
          sets: input.loggedSets
            .filter((set) => set.sessionId === session.id && set.templateExerciseId === templateExercise.id)
            .sort((a, b) => a.setIndex - b.setIndex)
            .map((set): LoggedSet => ({
              setIndex: set.setIndex,
              loadText: set.loadText,
              reps: set.reps,
              notes: set.notes,
              pain: set.pain
            }))
        };
      });

      const exercises = sessionExercises.filter((exercise): exercise is MesocycleExerciseSummary => exercise !== null);

      return {
        id: session.id,
        name: templatesById.get(session.templateId)?.name ?? session.templateId,
        trainingDate: session.trainingDate,
        status: session.status,
        weekNumber: session.weekNumber,
        dayNumber: session.dayNumber,
        source: session.source,
        notes: session.notes,
        totalSets: exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
        exercises
      };
    });
};

const compareSessions = (a: typeof sessions.$inferSelect, b: typeof sessions.$inferSelect) => {
  const weekDiff = (a.weekNumber ?? 999) - (b.weekNumber ?? 999);
  if (weekDiff !== 0) return weekDiff;

  const dayDiff = (a.dayNumber ?? 999) - (b.dayNumber ?? 999);
  if (dayDiff !== 0) return dayDiff;

  return (a.trainingDate ?? '').localeCompare(b.trainingDate ?? '');
};

const buildExerciseHistory = (input: {
  exercise: typeof exercises.$inferSelect;
  exercises: Array<typeof exercises.$inferSelect>;
  sessions: Array<typeof sessions.$inferSelect>;
  workoutTemplates: Array<typeof workoutTemplates.$inferSelect>;
  templateExercises: Array<typeof workoutTemplateExercises.$inferSelect>;
  loggedSets: Array<typeof loggedSets.$inferSelect>;
}): ExerciseHistoryEntry[] => {
  const templatesById = new Map(input.workoutTemplates.map((template) => [template.id, template]));
  const sessionsById = new Map(input.sessions.map((session) => [session.id, session]));
  const matchingExerciseIds = new Set(
    input.exercises
      .filter((exercise) => normalizedExerciseName(exercise.name) === normalizedExerciseName(input.exercise.name))
      .map((exercise) => exercise.id)
  );
  const exerciseTemplateIds = new Set(
    input.templateExercises.filter((templateExercise) => matchingExerciseIds.has(templateExercise.exerciseId)).map((templateExercise) => templateExercise.id)
  );

  return [...sessionsById.values()]
    .map((session) => {
      const sessionSets = input.loggedSets.filter((set) => set.sessionId === session.id && exerciseTemplateIds.has(set.templateExerciseId));
      const topSet = pickTopSet(sessionSets);

      if (!topSet) return null;

      return {
        sessionId: session.id,
        label: sessionLabel(session),
        workoutName: templatesById.get(session.templateId)?.name ?? session.templateId,
        loadText: topSet.loadText,
        reps: topSet.reps,
        setIndex: topSet.setIndex
      };
    })
    .filter((entry): entry is ExerciseHistoryEntry => entry !== null)
    .sort((a, b) => compareHistoryLabels(b.label, a.label));
};

const pickTopSet = (sets: Array<typeof loggedSets.$inferSelect>) =>
  [...sets].sort((a, b) => {
    const loadDiff = (parseLoad(b.loadText) ?? -1) - (parseLoad(a.loadText) ?? -1);
    if (loadDiff !== 0) return loadDiff;

    const repDiff = b.reps - a.reps;
    if (repDiff !== 0) return repDiff;

    return a.setIndex - b.setIndex;
  })[0] ?? null;

const parseLoad = (loadText: string) => {
  const match = loadText.replace(',', '.').match(/-?\d+(?:\.\d+)?/);

  return match?.[0] ? Number(match[0]) : null;
};

const sessionLabel = (session: typeof sessions.$inferSelect) => {
  if (session.trainingDate) return session.trainingDate;

  const week = session.weekNumber ? `W${session.weekNumber}` : null;
  const day = session.dayNumber ? `D${session.dayNumber}` : null;
  const mesoDay = [week, day].filter(Boolean).join(' ');

  return mesoDay.length > 0 ? mesoDay : session.id;
};

const compareHistoryLabels = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';

const toTrainingCatalogError = (error: unknown): TrainingCatalogError => ({
  kind: 'training-catalog-error',
  message: error instanceof Error ? error.message : 'Unknown training catalog error'
});
