import { Database } from 'bun:sqlite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import {
  exerciseMuscleCoefficients,
  exercises,
  loggedSets,
  mesocycles,
  sessions,
  templateMesocycles,
  workoutTemplateExercises,
  workoutTemplates
} from '../src/lib/server/db/schema';
import type { MuscleGroup } from '../src/lib/server/training/domain/muscles';
import { getExerciseFamilyCoefficients, suggestExerciseFamilyId } from '../src/lib/server/training/domain/exercise-families';
import type { MuscleCoefficientValue } from '../src/lib/server/training/domain/coefficients';
import { toEquipmentType } from '../src/lib/training/equipment';
import { canonicalExerciseId, canonicalExerciseName, slugifyExerciseName } from '../src/lib/training/exercise-normalization';

type TrainingMethod = 'regular' | 'myo-match';
type BackfillSet = {
  load: string;
  reps: number;
};

type BackfillExercise = {
  name: string;
  equipment: string;
  primaryMuscle: MuscleGroup;
  method?: TrainingMethod;
  sets: BackfillSet[];
  notes?: string;
};

type BackfillSession = {
  id: string;
  mesocycleId: string;
  templateName: string;
  weekNumber: number;
  dayNumber: number;
  trainingDate: string;
  source: string;
  sourceImages?: string[];
  notes?: string;
  exercises: BackfillExercise[];
};

const dbPath = process.env.TRAINING_DB_PATH ?? '../ops/data/training/training.sqlite';
const sqlite = new Database(dbPath, { create: true });
sqlite.run('PRAGMA journal_mode = WAL');
sqlite.run('PRAGMA busy_timeout = 5000');
sqlite.run('PRAGMA foreign_keys = ON');

const db = drizzle(sqlite);
const now = new Date().toISOString();
const currentSplitTemplateId = 'current-upper-lower-six-day-rotation';

resetSchema();

const currentMesoSessions: BackfillSession[] = [
  currentSession(1, 'Upper A', '2026-06-09', [
    ex('Pull-ups', 'Bodyweight', 'lats', sets(['bodyweight', 10], ['bodyweight', 10])),
    ex('30-degree Incline DB Bench', 'Dumbbell', 'chest', sets(['24 kg', 14], ['24 kg', 14])),
    ex('Dips', 'Bodyweight/loadable', 'chest', sets(['setup 11', 9], ['setup 11', 9])),
    ex('CS WG T-bar Rows + Kelso', 'Machine', 'upper_back', sets(['20 kg', 12], ['20 kg', 12])),
    ex('Rope OH Extensions', 'Cable', 'triceps_long_head', sets(['13.5 kg', 13], ['13.5 kg', 13])),
    ex('Incline Curls', 'Dumbbell', 'biceps', sets(['10 kg', 13], ['10 kg', 13])),
    ex('DB Butterfly Raises', 'Dumbbell', 'side_delts', sets(['6 kg', 13], ['6 kg', 13], ['6 kg', 13])),
    ex('Kneeling Rope Facepulls', 'Cable', 'rear_delts', sets(['16 kg', 12], ['16 kg', 12])),
    ex('Pendulum Calf Raises', 'Machine', 'gastrocnemius', sets(['30 assistance', 12], ['30 assistance', 12], ['30 assistance', 12]))
  ]),
  currentSession(2, 'Lower A', '2026-06-10', [
    ex('DB Bench Wrist Extensions', 'Dumbbell', 'wrist_extensors', sets(['4 kg', 20], ['4 kg', 20], ['4 kg', 20])),
    ex('DB Bench Wrist Curls', 'Dumbbell', 'wrist_flexors', sets(['8 kg', 20], ['8 kg', 20], ['8 kg', 20])),
    ex('DB Reverse Curls', 'Dumbbell', 'brachioradialis', sets(['8 kg', 12], ['8 kg', 12], ['8 kg', 12])),
    ex('Leg Extensions', 'Machine', 'quads_vasti', sets(['20', 14], ['20', 14])),
    ex('Pendulum Squats', 'Machine', 'quads_vasti', sets(['0', 16], ['0', 16])),
    ex('Belt Squat RDLs', 'Belt squat', 'hamstrings_biarticular', sets(['40', 15], ['40', 12]), 'regular'),
    ex('Hip Abduction Machine', 'Machine', 'glute_med_min', sets(['57', 13], ['57', 13], ['57', 13])),
    ex('Walking Lunges, glute emphasis', 'Dumbbell', 'glute_max', sets(['10', 14])),
    ex('Shrugs (BB WG)', 'Barbell', 'upper_traps', sets(['40', 20], ['40', 20], ['40', 20])),
    ex('Back-supported Hanging Leg Raises', 'Bodyweight/loadable', 'abs', sets(['setup reglaj 10', 9], ['setup reglaj 10', 9])),
    ex('Rope Crunches', 'Cable', 'abs', sets(['22.5', 15], ['22.5', 15]))
  ]),
  currentSession(3, 'Upper B', '2026-06-11', [
    ex('Medium Grip Pulldowns', 'Cable', 'lats', sets(['50', 16], ['50', 16])),
    ex('Incline BB Bench', 'Barbell', 'chest', sets(['50', 15], ['50', 15])),
    ex('Machine Flyes', 'Machine', 'chest', sets(['36', 13], ['36', 13])),
    ex('Lat Prayers', 'Cable', 'lats', sets(['15', 13], ['15', 13])),
    ex('T-Bar WG Rows', 'Machine', 'upper_back', sets(['20', 14], ['20', 14])),
    ex('ZBB Skullcrushers', 'Barbell', 'triceps_long_head', sets(['5', 16], ['5', 16])),
    ex('Cable Cross Body Lateral Raises', 'Cable', 'side_delts', sets(['2.3', 20], ['2.3', 20], ['2.3', 20])),
    ex('Bayesian Curls', 'Cable', 'biceps', sets(['4.5', 15], ['4.5', 15])),
    ex('Leg Press Calf Raises', 'Machine', 'gastrocnemius', sets(['20', 19], ['20', 19], ['20', 19]))
  ])
];

upsertTemplateMesocycle({
  id: currentSplitTemplateId,
  name: 'Current upper/lower rotation',
  category: 'Hypertrophy',
  frequency: '6 days/week',
  gender: 'All',
  weeks: 8,
  daysPerWeek: 6
});

upsertMesocycle({
  id: 'current-week-1-lower-b',
  name: 'Current hypertrophy meso',
  status: 'current',
  weeks: 8,
  daysPerWeek: 6,
  startedAt: '2026-06-09',
  completedAt: null,
  templateMesoId: currentSplitTemplateId
});

for (const seededSession of currentMesoSessions) {
  upsertSession(seededSession);
}

console.log(`seeded ${currentMesoSessions.length} current-meso sessions into ${dbPath}`);

function resetSchema() {
  sqlite.exec(`
    drop table if exists next_session_suggestions;
    drop table if exists muscle_feedback;
    drop table if exists exercise_feedback;
    drop table if exists logged_sets;
    drop table if exists sessions;
    drop table if exists exercise_muscle_coefficients;
    drop table if exists workout_template_exercises;
    drop table if exists mesocycles;
    drop table if exists template_mesocycles;
    drop table if exists exercises;
    drop table if exists workout_templates;

    create table workout_templates (
      id text primary key not null,
      name text not null,
      rotation_order integer not null
    );

    create table exercises (
      id text primary key not null,
      name text not null,
      primary_muscle text not null,
      equipment text not null default 'unknown',
      family_id text
    );

    create table template_mesocycles (
      id text primary key not null,
      name text not null,
      category text not null,
      frequency text not null,
      gender text not null,
      weeks integer not null,
      days_per_week integer not null,
      updated_at text not null
    );

    create table mesocycles (
      id text primary key not null,
      name text not null,
      status text not null,
      weeks integer not null,
      days_per_week integer not null,
      started_at text,
      completed_at text,
      template_meso_id text references template_mesocycles(id) on delete set null,
      updated_at text not null
    );

    create table workout_template_exercises (
      id text primary key not null,
      template_id text not null references workout_templates(id) on delete cascade,
      exercise_id text not null references exercises(id) on delete restrict,
      position integer not null,
      programmed_sets integer not null,
      method text not null,
      target_rep_range text not null default '12-20'
    );
    create unique index workout_template_exercises_position_idx on workout_template_exercises(template_id, position);

    create table exercise_muscle_coefficients (
      exercise_id text not null references exercises(id) on delete cascade,
      muscle text not null,
      coefficient real not null
    );
    create unique index exercise_muscle_coefficients_unique_idx on exercise_muscle_coefficients(exercise_id, muscle);

    create table sessions (
      id text primary key not null,
      mesocycle_id text references mesocycles(id) on delete set null,
      template_id text not null references workout_templates(id) on delete restrict,
      week_number integer,
      day_number integer,
      training_date text,
      status text not null,
      notes text,
      source text,
      created_at text not null,
      updated_at text not null
    );

    create table logged_sets (
      id text primary key not null,
      session_id text not null references sessions(id) on delete cascade,
      template_exercise_id text not null references workout_template_exercises(id) on delete restrict,
      set_index integer not null,
      load_text text not null,
      reps integer not null,
      notes text,
      pain integer
    );
    create unique index logged_sets_unique_set_idx on logged_sets(session_id, template_exercise_id, set_index);

    create table exercise_feedback (
      id text primary key not null,
      session_id text not null references sessions(id) on delete cascade,
      template_exercise_id text not null references workout_template_exercises(id) on delete restrict,
      pain_after integer,
      notes text,
      updated_at text not null
    );
    create unique index exercise_feedback_unique_idx on exercise_feedback(session_id, template_exercise_id);

    create table muscle_feedback (
      id text primary key not null,
      session_id text not null references sessions(id) on delete cascade,
      muscle text not null,
      soreness integer,
      pump integer,
      workload text,
      notes text,
      updated_at text not null
    );
    create unique index muscle_feedback_unique_idx on muscle_feedback(session_id, muscle);

    create table next_session_suggestions (
      id text primary key not null,
      session_id text not null references sessions(id) on delete cascade,
      muscle text not null,
      suggestion text not null,
      status text not null,
      updated_at text not null
    );
    create unique index next_session_suggestions_unique_idx on next_session_suggestions(session_id, muscle);
  `);
}

function currentSession(dayNumber: number, templateName: string, trainingDate: string, exercises: BackfillExercise[]): BackfillSession {
  return {
    id: `current-week-1-day-${dayNumber}-${slugify(templateName)}`,
    mesocycleId: 'current-week-1-lower-b',
    templateName,
    weekNumber: 1,
    dayNumber,
    trainingDate,
    source: 'wiki/protocols/mesocycle-week-1-working-plan.md',
    notes: 'Backfilled from completed session logs in the Week 1 working plan.',
    exercises
  };
}

function ex(name: string, equipment: string, primaryMuscle: MuscleGroup, sets: BackfillSet[], method: TrainingMethod = 'myo-match', notes?: string): BackfillExercise {
  return { name, equipment, primaryMuscle, method, sets, notes };
}

function sets(...values: Array<[string, number]>): BackfillSet[] {
  return values.map(([load, reps]) => ({ load, reps }));
}

function exerciseCoefficients(primaryMuscle: MuscleGroup, familyId: string | null): Array<{ muscle: MuscleGroup; coefficient: MuscleCoefficientValue }> {
  const familyCoefficients = Object.entries(getExerciseFamilyCoefficients(familyId)).map(([muscle, coefficient]) => ({
    muscle: muscle as MuscleGroup,
    coefficient
  }));

  return familyCoefficients.length > 0 ? familyCoefficients : [{ muscle: primaryMuscle, coefficient: 1 }];
}

function upsertTemplateMesocycle(template: typeof templateMesocycles.$inferInsert) {
  db.insert(templateMesocycles)
    .values({ ...template, updatedAt: now })
    .onConflictDoUpdate({
      target: templateMesocycles.id,
      set: { ...template, updatedAt: now }
    })
    .run();
}

function upsertMesocycle(mesocycle: Omit<typeof mesocycles.$inferInsert, 'updatedAt'>) {
  db.insert(mesocycles)
    .values({ ...mesocycle, updatedAt: now })
    .onConflictDoUpdate({
      target: mesocycles.id,
      set: { ...mesocycle, updatedAt: now }
    })
    .run();
}

function upsertSession(backfillSession: BackfillSession) {
  const templateId = `${backfillSession.id}-template`;

  db.insert(workoutTemplates)
    .values({ id: templateId, name: backfillSession.templateName, rotationOrder: backfillSession.dayNumber })
    .onConflictDoUpdate({
      target: workoutTemplates.id,
      set: { name: backfillSession.templateName, rotationOrder: backfillSession.dayNumber }
    })
    .run();

  db.insert(sessions)
    .values({
      id: backfillSession.id,
      mesocycleId: backfillSession.mesocycleId,
      templateId,
      weekNumber: backfillSession.weekNumber,
      dayNumber: backfillSession.dayNumber,
      trainingDate: backfillSession.trainingDate,
      status: 'completed',
      notes: buildSessionNotes(backfillSession),
      source: backfillSession.source,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: sessions.id,
      set: {
        mesocycleId: backfillSession.mesocycleId,
        templateId,
        weekNumber: backfillSession.weekNumber,
        dayNumber: backfillSession.dayNumber,
        trainingDate: backfillSession.trainingDate,
        status: 'completed',
        notes: buildSessionNotes(backfillSession),
        source: backfillSession.source,
        updatedAt: now
      }
    })
    .run();

  backfillSession.exercises.forEach((exercise, exerciseIndex) => {
    const originalExerciseId = slugifyExerciseName(exercise.name);
    const exerciseId = canonicalExerciseId(exercise.name);
    const exerciseName = canonicalExerciseName(exercise.name);
    const equipment = toEquipmentType(exercise.equipment);
    const familyId = suggestExerciseFamilyId(exerciseName, equipment);
    const coefficients = exerciseCoefficients(exercise.primaryMuscle, familyId);
    const templateExerciseId = `${backfillSession.id}-${exerciseIndex + 1}-${originalExerciseId}`;
    const method = exercise.method ?? 'myo-match';

    db.insert(exercises)
      .values({
        id: exerciseId,
          name: exerciseName,
          primaryMuscle: exercise.primaryMuscle,
          familyId,
          equipment
        })
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          name: exerciseName,
          primaryMuscle: exercise.primaryMuscle,
          familyId,
          equipment
        }
      })
      .run();

    db.delete(exerciseMuscleCoefficients).where(eq(exerciseMuscleCoefficients.exerciseId, exerciseId)).run();
    db.insert(exerciseMuscleCoefficients)
      .values(coefficients.map(({ muscle, coefficient }) => ({ exerciseId, muscle, coefficient })))
      .run();

    db.insert(workoutTemplateExercises)
      .values({
        id: templateExerciseId,
        templateId,
        exerciseId,
        position: exerciseIndex + 1,
        programmedSets: exercise.sets.length,
        method,
        targetRepRange: '12-20'
      })
      .onConflictDoUpdate({
        target: workoutTemplateExercises.id,
        set: {
          templateId,
          exerciseId,
          position: exerciseIndex + 1,
          programmedSets: exercise.sets.length,
          method,
          targetRepRange: '12-20'
        }
      })
      .run();

    exercise.sets.forEach((set, setIndex) => {
      db.insert(loggedSets)
        .values({
          id: `${templateExerciseId}-set-${setIndex + 1}`,
          sessionId: backfillSession.id,
          templateExerciseId,
          setIndex: setIndex + 1,
          loadText: set.load,
          reps: set.reps,
          notes: exercise.notes ?? null,
          pain: null
        })
        .onConflictDoUpdate({
          target: [loggedSets.sessionId, loggedSets.templateExerciseId, loggedSets.setIndex],
          set: { loadText: set.load, reps: set.reps, notes: exercise.notes ?? null, pain: null }
        })
        .run();
    });
  });
}

function buildSessionNotes(backfillSession: BackfillSession) {
  const images = backfillSession.sourceImages?.map((image) => `raw/programs/last-meso/${image}`).join(', ');
  return [backfillSession.notes, images ? `Source images: ${images}` : null].filter(Boolean).join('\n');
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/kg/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}
