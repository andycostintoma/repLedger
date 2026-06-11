import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { muscleGroups } from '$lib/server/training/domain/muscles';

export const workoutTemplates = sqliteTable('workout_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rotationOrder: integer('rotation_order').notNull()
});

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  primaryMuscle: text('primary_muscle', { enum: muscleGroups }).notNull(),
  equipment: text('equipment').default('unknown').notNull()
});

export const templateMesocycles = sqliteTable('template_mesocycles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  frequency: text('frequency').notNull(),
  gender: text('gender').notNull(),
  weeks: integer('weeks').notNull(),
  daysPerWeek: integer('days_per_week').notNull(),
  updatedAt: text('updated_at').notNull()
});

export const mesocycles = sqliteTable('mesocycles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status', { enum: ['current', 'planned', 'completed'] }).notNull(),
  weeks: integer('weeks').notNull(),
  daysPerWeek: integer('days_per_week').notNull(),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  templateMesoId: text('template_meso_id').references(() => templateMesocycles.id, { onDelete: 'set null' }),
  updatedAt: text('updated_at').notNull()
});

export const workoutTemplateExercises = sqliteTable(
  'workout_template_exercises',
  {
    id: text('id').primaryKey(),
    templateId: text('template_id')
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    programmedSets: integer('programmed_sets').notNull(),
    method: text('method', { enum: ['regular', 'myo-match'] }).notNull(),
    targetRepRange: text('target_rep_range').default('12-20').notNull()
  },
  (table) => [uniqueIndex('workout_template_exercises_position_idx').on(table.templateId, table.position)]
);

export const exerciseMuscleCoefficients = sqliteTable(
  'exercise_muscle_coefficients',
  {
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    muscle: text('muscle', { enum: muscleGroups }).notNull(),
    coefficient: real('coefficient').notNull()
  },
  (table) => [uniqueIndex('exercise_muscle_coefficients_unique_idx').on(table.exerciseId, table.muscle)]
);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  mesocycleId: text('mesocycle_id').references(() => mesocycles.id, { onDelete: 'set null' }),
  templateId: text('template_id')
    .notNull()
    .references(() => workoutTemplates.id, { onDelete: 'restrict' }),
  weekNumber: integer('week_number'),
  dayNumber: integer('day_number'),
  trainingDate: text('training_date'),
  status: text('status', { enum: ['planned', 'in-progress', 'completed'] }).notNull(),
  notes: text('notes'),
  source: text('source'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

export const loggedSets = sqliteTable(
  'logged_sets',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    templateExerciseId: text('template_exercise_id')
      .notNull()
      .references(() => workoutTemplateExercises.id, { onDelete: 'restrict' }),
    setIndex: integer('set_index').notNull(),
    loadText: text('load_text').notNull(),
    reps: integer('reps').notNull(),
    notes: text('notes'),
    pain: integer('pain')
  },
  (table) => [uniqueIndex('logged_sets_unique_set_idx').on(table.sessionId, table.templateExerciseId, table.setIndex)]
);

export const exerciseFeedback = sqliteTable(
  'exercise_feedback',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    templateExerciseId: text('template_exercise_id')
      .notNull()
      .references(() => workoutTemplateExercises.id, { onDelete: 'restrict' }),
    painAfter: integer('pain_after'),
    notes: text('notes'),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [uniqueIndex('exercise_feedback_unique_idx').on(table.sessionId, table.templateExerciseId)]
);

export const muscleFeedback = sqliteTable(
  'muscle_feedback',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    muscle: text('muscle', { enum: muscleGroups }).notNull(),
    soreness: integer('soreness'),
    pump: integer('pump'),
    workload: text('workload', { enum: ['too-low', 'good', 'too-high'] }),
    notes: text('notes'),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [uniqueIndex('muscle_feedback_unique_idx').on(table.sessionId, table.muscle)]
);

export const nextSessionSuggestions = sqliteTable(
  'next_session_suggestions',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    muscle: text('muscle', { enum: muscleGroups }).notNull(),
    suggestion: text('suggestion').notNull(),
    status: text('status', { enum: ['proposed', 'accepted', 'ignored', 'edited'] }).notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [uniqueIndex('next_session_suggestions_unique_idx').on(table.sessionId, table.muscle)]
);
