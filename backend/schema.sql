CREATE SCHEMA IF NOT EXISTS public;

COMMENT ON SCHEMA public IS 'standard public schema';

CREATE SCHEMA IF NOT EXISTS training;

SET search_path TO training, public;

CREATE TABLE IF NOT EXISTS workout_templates (
  id             text NOT NULL PRIMARY KEY,
  name           text NOT NULL,
  rotation_order int  NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id             text NOT NULL PRIMARY KEY,
  name           text NOT NULL,
  primary_muscle text NOT NULL,
  family_id      text,
  equipment      text NOT NULL DEFAULT 'unknown'
);

CREATE TABLE IF NOT EXISTS exercise_muscle_coefficients (
    exercise_id text         NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
    muscle      text         NOT NULL,
    coefficient numeric(4,2) NOT NULL CHECK (coefficient IN (0.50, 0.75, 1.00)),
    PRIMARY KEY (exercise_id, muscle)
    );

CREATE TABLE IF NOT EXISTS template_mesocycles (
  id            text        NOT NULL PRIMARY KEY,
  name          text        NOT NULL,
  category      text        NOT NULL,
  frequency     text        NOT NULL,
  gender        text        NOT NULL,
  weeks         int         NOT NULL CHECK (weeks > 0),
  days_per_week int         NOT NULL CHECK (days_per_week > 0),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mesocycles (
  id               text        NOT NULL PRIMARY KEY,
  name             text        NOT NULL,
  status           text        NOT NULL CHECK (status IN ('current', 'planned', 'completed')),
  weeks            int         NOT NULL CHECK (weeks > 0),
  days_per_week    int         NOT NULL CHECK (days_per_week > 0),
  started_at       date,
  completed_at     date,
  template_meso_id text REFERENCES template_mesocycles (id) ON DELETE SET NULL,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id               text NOT NULL PRIMARY KEY,
  template_id      text NOT NULL REFERENCES workout_templates (id) ON DELETE CASCADE,
  exercise_id      text NOT NULL REFERENCES exercises (id) ON DELETE RESTRICT,
  position         int  NOT NULL,
  programmed_sets  int  NOT NULL CHECK (programmed_sets > 0),
  method           text NOT NULL CHECK (method IN ('regular', 'myo-match')),
  target_rep_range text NOT NULL DEFAULT '12-20',
  UNIQUE (template_id, position)
);

CREATE TABLE IF NOT EXISTS sessions (
  id            text        NOT NULL PRIMARY KEY,
  mesocycle_id  text REFERENCES mesocycles (id) ON DELETE SET NULL,
  template_id   text        NOT NULL REFERENCES workout_templates (id) ON DELETE RESTRICT,
  week_number   int,
  day_number    int,
  training_date date,
  status        text        NOT NULL CHECK (status IN ('planned', 'in-progress', 'completed')),
  notes         text,
  source        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logged_sets (
  id                   text NOT NULL PRIMARY KEY,
  session_id           text NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  template_exercise_id text NOT NULL REFERENCES workout_template_exercises (id) ON DELETE RESTRICT,
  set_index            int  NOT NULL CHECK (set_index > 0),
  load_text            text NOT NULL,
  reps                 int  NOT NULL CHECK (reps >= 0),
  notes                text,
  pain                 int CHECK (pain BETWEEN 0 AND 10),
  UNIQUE (session_id, template_exercise_id, set_index)
);

CREATE TABLE IF NOT EXISTS exercise_feedback (
  id                   text        NOT NULL PRIMARY KEY,
  session_id           text        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  template_exercise_id text        NOT NULL REFERENCES workout_template_exercises (id) ON DELETE RESTRICT,
  pain_after           int CHECK (pain_after BETWEEN 0 AND 10),
  notes                text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, template_exercise_id)
);

CREATE TABLE IF NOT EXISTS muscle_feedback (
  id         text        NOT NULL PRIMARY KEY,
  session_id text        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  muscle     text        NOT NULL,
  soreness   int CHECK (soreness BETWEEN 0 AND 10),
  pump       int CHECK (pump BETWEEN 0 AND 10),
  workload   text CHECK (workload IN ('too-low', 'good', 'too-high')),
  notes      text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, muscle)
);

CREATE TABLE IF NOT EXISTS next_session_suggestions (
  id         text        NOT NULL PRIMARY KEY,
  session_id text        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  muscle     text        NOT NULL,
  suggestion text        NOT NULL,
  status     text        NOT NULL CHECK (status IN ('proposed', 'accepted', 'ignored', 'edited')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, muscle)
);

CREATE INDEX IF NOT EXISTS exercises_name_idx ON exercises (lower(name));
CREATE INDEX IF NOT EXISTS sessions_training_date_idx ON sessions (training_date);
CREATE INDEX IF NOT EXISTS logged_sets_session_idx ON logged_sets (session_id);
