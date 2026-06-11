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

// Approximate previous-meso calendar dates (user asked for realistic but not exact).
// Anchor so W6 D2 is near the recorded meso completion date (2026-06-08).
const previousMesoStartDate = '2026-05-03';
const previousMesoDayOffsets = [0, 1, 3, 5];

resetSchema();

const previousMesoSessions: BackfillSession[] = [
  session(1, 1, ['IMG_4044.PNG', 'IMG_4045.PNG', 'IMG_4046.PNG', 'IMG_4047.PNG', 'IMG_4048.PNG'], [
    ex('Dumbbell Press (Medium Incline)', 'Dumbbell', 'chest', sets(['28', 8], ['28', 6])),
    ex('Pulldown (Normal Grip)', 'Cable', 'lats', sets(['59', 9], ['59', 7])),
    ex('Lying NG Machine Chest Press', 'Machine', 'chest', sets(['30', 8], ['30', 6])),
    ex('WG T-Bar Row', 'Machine', 'upper back', sets(['25', 8], ['25', 6])),
    ex('Cable Upright Row', 'Cable', 'side delts', sets(['15', 13], ['15', 10], ['15', 8])),
    ex('Cable Pullover', 'Cable', 'lats', sets(['20', 10], ['20', 8])),
    ex('Cable Overhead Triceps Extension (Rope)', 'Cable', 'triceps long head', sets(['12.5', 9], ['12.5', 7])),
    ex('Dumbbell Curl (Incline)', 'Dumbbell', 'biceps', sets(['10', 13], ['10', 10], ['10', 8])),
    ex('Leg Press Calves', 'Machine', 'gastrocnemius', sets(['20', 13], ['20', 10]))
  ]),
  session(1, 2, ['IMG_4049.PNG', 'IMG_4050.PNG', 'IMG_4051.PNG'], [
    ex('Cable Lateral Raise (Single-Arm)', 'Cable', 'side delts', sets(['5', 10], ['5', 7], ['2.5', 12])),
    ex('Barbell Standing Wrist Curl', 'Barbell', 'wrist flexors', sets(['20', 23], ['20', 20], ['20', 17])),
    ex('Belt Squat', 'Machine', 'quads (vasti)', sets(['35', 8], ['35', 6])),
    ex('Belt Squat RDLs', 'Machine', 'hamstrings (except BF short head)', sets(['40', 10])),
    ex('Leg Extension', 'Machine', 'quads (vasti)', sets(['25', 9], ['25', 7])),
    ex('Hip Abduction Machine', 'Machine', 'glute med/min', sets(['57', 12], ['57', 9])),
    ex('Decline Sit up with Disk', 'Dumbbell', 'abs', sets(['15', 12], ['15', 9]))
  ]),
  session(1, 3, ['IMG_4052.PNG', 'IMG_4053.PNG', 'IMG_4054.PNG', 'IMG_4055.PNG', 'IMG_4056.PNG'], [
    ex('Bench Press (Incline, Medium Grip)', 'Barbell', 'chest', sets(['60', 9], ['60', 6])),
    ex('Machine Flye', 'Machine', 'chest', sets(['41', 10], ['41', 8])),
    ex('Hammer Machine Row (High)', 'Machine', 'lats', sets(['40', 9], ['40', 7])),
    ex('Machine Chest Supported Row (Wide Grip)', 'Machine', 'upper back', sets(['43', 12], ['43', 9])),
    ex('Machine Lateral Raise', 'Machine', 'side delts', sets(['36', 12], ['36', 10], ['36', 8])),
    ex('Cable Rope Facepull', 'Cable', 'rear delts', sets(['12.5', 12], ['12.5', 9])),
    ex('Standing Calf Raise', 'Machine', 'gastrocnemius', sets(['10', 12], ['10', 9])),
    ex('Dumbbell Shrug', 'Dumbbell', 'upper traps', sets(['26', 14], ['26', 10])),
    ex('Cable Rope Crunch', 'Cable', 'abs', sets(['15', 13], ['15', 10]))
  ]),
  session(1, 4, ['IMG_4057.PNG', 'IMG_4058.PNG', 'IMG_4059.PNG', 'IMG_4060.PNG'], [
    ex('EZ Bar Curl (Normal Grip)', 'Barbell', 'biceps', sets(['25', 9], ['25', 7])),
    ex('Cable Triceps Pushdown (Bar)', 'Cable', 'triceps lateral/medial', sets(['20', 10], ['20', 8])),
    ex('Dumbbell Bench Wrist Curl', 'Dumbbell', 'wrist flexors', sets(['6', 20], ['6', 17])),
    ex('Hammer Curl', 'Dumbbell', 'biceps', sets(['8', 12], ['8', 9])),
    ex('Pendulum Squat', 'Machine', 'quads (vasti)', sets(['10', 9], ['10', 6])),
    ex('Horizontal Leg Press', 'Machine', 'quads (vasti)', sets(['45', 10], ['45', 8])),
    ex('Machine Hip Thrust', 'Machine', 'glute max', sets(['25', 11], ['25', 9])),
    ex('Lying Leg Curl', 'Machine', 'hamstrings (except BF short head)', sets(['54', 11]))
  ]),
  session(2, 1, ['IMG_4061.PNG', 'IMG_4062.PNG', 'IMG_4063.PNG', 'IMG_4064.PNG', 'IMG_4065.PNG'], [
    ex('Dumbbell Press (Medium Incline)', 'Dumbbell', 'chest', sets(['28', 9], ['28', 7], ['28', 5])),
    ex('Lying NG Machine Chest Press', 'Machine', 'chest', sets(['30', 9], ['30', 7])),
    ex('Pulldown (Normal Grip)', 'Cable', 'lats', sets(['59', 10], ['59', 8], ['59', 6])),
    ex('WG T-Bar Row', 'Machine', 'upper back', sets(['25', 9], ['25', 7])),
    ex('Cable Pullover', 'Cable', 'lats', sets(['20.4', 12], ['20.4', 9])),
    ex('Trap Bar Shrugs', 'Barbell', 'upper traps', sets(['50', 15], ['50', 12], ['50', 10])),
    ex('Cable Lateral Raise (Single-Arm)', 'Cable', 'side delts', sets(['4.5', 10], ['4.5', 10], ['4.5', 8])),
    ex('Leg Press Calves', 'Machine', 'gastrocnemius', sets(['20', 15], ['20', 13])),
    ex('Decline Sit up with Disk', 'Dumbbell', 'abs', sets(['15', 13], ['15', 10], ['15', 8]))
  ]),
  session(2, 2, ['IMG_4066.PNG', 'IMG_4067.PNG', 'IMG_4068.PNG', 'IMG_4069.PNG'], [
    ex('Cable Overhead Triceps Extension (Rope)', 'Cable', 'triceps long head', sets(['16', 8], ['13.5', 11], ['13.5', 8])),
    ex('Dumbbell Curl (Incline)', 'Dumbbell', 'biceps', sets(['10', 13], ['10', 10], ['10', 8])),
    ex('Barbell Standing Wrist Curl', 'Barbell', 'wrist flexors', sets(['20', 24], ['20', 21], ['20', 18])),
    ex('Reverse Curl', 'Barbell', 'brachioradialis', sets(['20', 12], ['20', 10], ['20', 8])),
    ex('Belt Squat', 'Machine', 'quads (vasti)', sets(['35', 10], ['35', 8], ['35', 6])),
    ex('Belt Squat RDLs', 'Machine', 'hamstrings (except BF short head)', sets(['40', 11], ['40', 9])),
    ex('Leg Extension', 'Machine', 'quads (vasti)', sets(['25', 10], ['25', 8])),
    ex('Hip Abduction Machine', 'Machine', 'glute med/min', sets(['57', 13], ['57', 11], ['57', 8]))
  ]),
  session(2, 3, ['IMG_4070.PNG', 'IMG_4071.PNG', 'IMG_4072.PNG', 'IMG_4073.PNG', 'IMG_4074.PNG'], [
    ex('Bench Press (Incline, Medium Grip)', 'Barbell', 'chest', sets(['60', 10], ['60', 7], ['60', 5])),
    ex('Machine Flye', 'Machine', 'chest', sets(['41', 11], ['41', 8])),
    ex('Hammer Machine Row (High)', 'Machine', 'lats', sets(['40', 10], ['40', 8], ['40', 6])),
    ex('Machine Chest Supported Row (Wide Grip)', 'Machine', 'upper back', sets(['43', 13], ['43', 10])),
    ex('Machine Lateral Raise', 'Machine', 'side delts', sets(['36', 12], ['36', 9], ['36', 7])),
    ex('Cable Rope Facepull', 'Cable', 'rear delts', sets(['12.5', 13], ['12.5', 10], ['12.5', 8])),
    ex('Standing Calf Raise', 'Machine', 'gastrocnemius', sets(['10', 13], ['10', 10])),
    ex('Dumbbell Shrug', 'Dumbbell', 'upper traps', sets(['28', 14], ['28', 11])),
    ex('Cable Rope Crunch', 'Cable', 'abs', sets(['15', 15], ['15', 12], ['15', 9]))
  ]),
  session(2, 4, ['IMG_4075.PNG', 'IMG_4076.PNG', 'IMG_4077.PNG', 'IMG_4078.PNG'], [
    ex('EZ Bar Curl (Normal Grip)', 'Barbell', 'biceps', sets(['25', 10], ['25', 8], ['25', 6])),
    ex('Cable Triceps Pushdown (Bar)', 'Cable', 'triceps lateral/medial', sets(['20.5', 12], ['20.5', 9], ['20.5', 7])),
    ex('Dumbbell Bench Wrist Curl', 'Dumbbell', 'wrist flexors', sets(['6', 22], ['6', 19])),
    ex('Hammer Curl', 'Dumbbell', 'biceps', sets(['8', 13], ['8', 10])),
    ex('Pendulum Squat', 'Machine', 'quads (vasti)', sets(['10', 12], ['10', 9], ['10', 7], ['5', 8], ['5', 6])),
    ex('Machine Hip Thrust', 'Machine', 'glute max', sets(['25', 12], ['25', 10], ['25', 8])),
    ex('Lying Leg Curl', 'Machine', 'hamstrings (except BF short head)', sets(['54', 13], ['54', 10]))
  ]),
  session(3, 1, ['IMG_4079.PNG', 'IMG_4080.PNG', 'IMG_4081.PNG', 'IMG_4082.PNG', 'IMG_4083.PNG'], [
    ex('Dumbbell Press (Medium Incline)', 'Dumbbell', 'chest', sets(['28', 10], ['28', 8], ['28', 6])),
    ex('Lying NG Machine Chest Press', 'Machine', 'chest', sets(['30', 10], ['30', 8])),
    ex('Pulldown (Normal Grip)', 'Cable', 'lats', sets(['59', 11], ['59', 9], ['59', 7])),
    ex('WG T-Bar Row', 'Machine', 'upper back', sets(['25', 10], ['25', 8])),
    ex('Cable Pullover', 'Cable', 'lats', sets(['20.5', 13], ['20.5', 11])),
    ex('Trap Bar Shrugs', 'Barbell', 'upper traps', sets(['60', 12], ['60', 9], ['60', 7])),
    ex('Cable Lateral Raise (Single-Arm)', 'Cable', 'side delts', sets(['4.5', 15], ['4.5', 12], ['4.5', 10])),
    ex('Hanging Knee Raise', 'Bodyweight', 'abs', sets(['78', 12], ['78', 10])),
    ex('Decline Sit up with Disk', 'Dumbbell', 'abs', sets(['15', 15], ['15', 11])),
    ex('Leg Press Calves', 'Machine', 'gastrocnemius', sets(['30', 12], ['20', 14], ['20', 12]))
  ]),
  session(3, 2, ['IMG_4084.PNG', 'IMG_4085.PNG', 'IMG_4086.PNG', 'IMG_4087.PNG'], [
    ex('Cable Overhead Triceps Extension (Rope)', 'Cable', 'triceps long head', sets(['13.5', 13], ['13.5', 11], ['13.5', 9])),
    ex('Dumbbell Curl (Incline)', 'Dumbbell', 'biceps', sets(['10', 14], ['10', 11], ['10', 9])),
    ex('Barbell Standing Wrist Curl', 'Barbell', 'wrist flexors', sets(['25', 17], ['25', 13])),
    ex('Reverse Curl', 'Barbell', 'brachioradialis', sets(['25', 8], ['25', 6])),
    ex('Belt Squat', 'Machine', 'quads (vasti)', sets(['35', 11], ['35', 9], ['35', 7])),
    ex('Belt Squat RDLs', 'Machine', 'hamstrings (except BF short head)', sets(['40', 12], ['40', 10])),
    ex('Leg Extension', 'Machine', 'quads (vasti)', sets(['25', 12], ['25', 9]))
  ]),
  session(3, 3, ['IMG_4088.PNG', 'IMG_4089.PNG', 'IMG_4090.PNG', 'IMG_4091.PNG', 'IMG_4092.PNG'], [
    ex('Bench Press (Incline, Medium Grip)', 'Barbell', 'chest', sets(['60', 11], ['60', 8], ['60', 6])),
    ex('Machine Flye', 'Machine', 'chest', sets(['41', 12], ['41', 9])),
    ex('Cable Overhead Triceps Extension (Rope)', 'Cable', 'triceps long head', sets(['13.5', 13], ['13.5', 10], ['13.5', 8])),
    ex('Nautilus Pulldown', 'Machine', 'lats', sets(['40', 10], ['40', 8], ['40', 6])),
    ex('Cable Pullover', 'Cable', 'lats', sets(['20.4', 14], ['20.4', 11])),
    ex('WG T-Bar Row', 'Machine', 'upper back', sets(['25', 11], ['25', 8], ['25', 6])),
    ex('Dumbbell Curl (Incline)', 'Dumbbell', 'biceps', sets(['10', 13], ['10', 10], ['10', 8])),
    ex('Dumbbell Lateral Raise (Incline)', 'Dumbbell', 'side delts', sets(['8', 12], ['8', 9], ['8', 7])),
    ex('Standing Calf Raise', 'Machine', 'gastrocnemius', sets(['10', 13], ['10', 11], ['10', 9]))
  ]),
  session(3, 4, ['IMG_4093.PNG', 'IMG_4094.PNG', 'IMG_4095.PNG', 'IMG_4096.PNG', 'IMG_4097.PNG'], [
    ex('Dumbbell Bench Wrist Curl', 'Dumbbell', 'wrist flexors', sets(['6', 24], ['6', 24], ['6', 24])),
    ex('Pendulum Squat', 'Machine', 'quads (vasti)', sets(['10', 12], ['10', 10], ['10', 8], ['10', 6], ['10', 5])),
    ex('Machine Hip Thrust', 'Machine', 'glute max', sets(['25', 13], ['25', 11], ['25', 9])),
    ex('Lying Leg Curl', 'Machine', 'hamstrings (except BF short head)', sets(['54', 14], ['54', 11])),
    ex('Trap Bar Deadlift', 'Barbell', 'glute max', sets(['100', 7], ['100', 5])),
    ex('Trap Bar Shrugs', 'Barbell', 'upper traps', sets(['60', 13], ['60', 11], ['60', 9])),
    ex('Cable Rope Crunch', 'Cable', 'abs', sets(['16', 16], ['16', 13], ['16', 11], ['16', 9]))
  ]),
  session(4, 1, ['IMG_4098.PNG', 'IMG_4099.PNG', 'IMG_4100.PNG', 'IMG_4101.PNG', 'IMG_4102.PNG'], [
    ex('Dumbbell Press (Medium Incline)', 'Dumbbell', 'chest', sets(['28', 11], ['28', 8], ['28', 6])),
    ex('Lying NG Machine Chest Press', 'Machine', 'chest', sets(['30', 11], ['30', 9], ['30', 7])),
    ex('Hammer Machine Row (High)', 'Machine', 'lats', sets(['40', 11], ['40', 8], ['40', 6])),
    ex('Nautilus CS NG Rows', 'Machine', 'upper back', sets(['25', 11], ['25', 9], ['25', 7])),
    ex('Machine Lateral Raise', 'Machine', 'side delts', sets(['32', 15], ['32', 12], ['32', 10])),
    ex('Cable Rope Facepull (Kneeling)', 'Cable', 'rear delts', sets(['13.6', 12], ['13.6', 10], ['13.6', 8])),
    ex('EZ Bar Curl (Normal Grip)', 'Barbell', 'biceps', sets(['25', 11], ['25', 9], ['25', 7])),
    ex('Cable Triceps Pushdown (Bar)', 'Cable', 'triceps lateral/medial', sets(['20.5', 12], ['20.5', 10], ['20.5', 8])),
    ex('Leg Press Calves', 'Machine', 'gastrocnemius', sets(['15', 14], ['15', 14], ['15', 14]))
  ]),
  session(4, 2, ['IMG_4103.PNG', 'IMG_4104.PNG', 'IMG_4106.PNG', 'IMG_4107.PNG', 'IMG_4108.PNG'], [
    ex('Barbell Standing Wrist Curl', 'Barbell', 'wrist flexors', sets(['25', 20], ['25', 20], ['25', 20])),
    ex('Belt Squat', 'Machine', 'quads (vasti)', sets(['35', 13], ['35', 10], ['35', 8])),
    ex('Belt Squat RDLs', 'Machine', 'hamstrings (except BF short head)', sets(['40', 13], ['40', 11])),
    ex('Leg Extension', 'Machine', 'quads (vasti)', sets(['25', 13], ['25', 10])),
    ex('Walking Lunges (Glute-Focused, Dumbbell)', 'Dumbbell', 'glute max', sets(['12', 11], ['12', 8])),
    ex('Hip Abduction Machine', 'Machine', 'glute med/min', sets(['74', 13], ['74', 13], ['74', 13])),
    ex('Dumbbell Shrug', 'Dumbbell', 'upper traps', sets(['30', 13], ['30', 11], ['30', 9])),
    ex('Hanging Knee Raise', 'Bodyweight', 'abs', sets(['78', 10], ['78', 6], ['78', 4])),
    ex('Cable Rope Crunch', 'Cable', 'abs', sets(['22.7', 14], ['22.7', 14], ['22.7', 14]))
  ]),
  session(4, 4, ['IMG_4109.PNG', 'IMG_4110.PNG', 'IMG_4111.PNG', 'IMG_4112.PNG', 'IMG_4113.PNG'], [
    ex('Dumbbell Bench Wrist Curl', 'Dumbbell', 'wrist flexors', sets(['8', 21], ['8', 21], ['8', 21], ['8', 21])),
    ex('Pendulum Squat', 'Machine', 'quads (vasti)', sets(['20', 9], ['20', 6], ['20', 4], ['10', 7], ['10', 6])),
    ex('Machine Hip Thrust', 'Machine', 'glute max', sets(['30', 9], ['30', 7], ['30', 5])),
    ex('Lying Leg Curl', 'Machine', 'hamstrings (except BF short head)', sets(['59', 12], ['59', 9])),
    ex('Trap Bar Deadlift', 'Barbell', 'glute max', sets(['100', 9], ['100', 7])),
    ex('Trap Bar Shrugs', 'Barbell', 'upper traps', sets(['70', 13], ['70', 13], ['70', 13])),
    ex('Machine Crunch', 'Machine', 'abs', sets(['36', 13], ['36', 13], ['36', 13], ['36', 13]))
  ]),
  session(5, 1, ['IMG_4114.PNG', 'IMG_4115.PNG', 'IMG_4116.PNG', 'IMG_4117.PNG', 'IMG_4118.PNG'], [
    ex('Dumbbell Press (Medium Incline)', 'Dumbbell', 'chest', sets(['28', 8], ['28', 6], ['28', 5])),
    ex('Lying NG Machine Chest Press', 'Machine', 'chest', sets(['30', 10], ['30', 8], ['30', 6])),
    ex('Hammer Machine Row (High)', 'Machine', 'lats', sets(['40', 12], ['40', 9], ['40', 7])),
    ex('Nautilus CS NG Rows', 'Machine', 'upper back', sets(['25', 12], ['25', 9], ['25', 7])),
    ex('Machine Lateral Raise', 'Machine', 'side delts', sets(['32', 14], ['32', 14], ['32', 14])),
    ex('Cable Rope Facepull (Kneeling)', 'Cable', 'rear delts', sets(['12.5', 14], ['12.5', 14], ['12.5', 14])),
    ex('EZ Bar Curl (Normal Grip)', 'Barbell', 'biceps', sets(['25', 13], ['25', 13], ['25', 13])),
    ex('Cable Triceps Pushdown (Bar)', 'Cable', 'triceps lateral/medial', sets(['20', 14], ['20', 14], ['20', 14])),
    ex('Leg Press Calves', 'Machine', 'gastrocnemius', sets(['15', 16], ['15', 16], ['15', 16], ['15', 16]))
  ]),
  session(5, 2, ['IMG_4119.PNG', 'IMG_4120.PNG', 'IMG_4121.PNG', 'IMG_4122.PNG', 'IMG_4123.PNG'], [
    ex('Barbell Bench Wrist Curl', 'Barbell', 'wrist flexors', sets(['15', 22], ['15', 22], ['15', 22])),
    ex('Belt Squat', 'Machine', 'quads (vasti)', sets(['35', 14], ['35', 11], ['35', 9])),
    ex('Belt Squat RDLs', 'Machine', 'hamstrings (except BF short head)', sets(['40', 14], ['40', 11])),
    ex('Leg Extension', 'Machine', 'quads (vasti)', sets(['25', 13], ['25', 13])),
    ex('Walking Lunges (Glute-Focused, Dumbbell)', 'Dumbbell', 'glute max', sets(['12', 12], ['12', 9])),
    ex('Hip Abduction Machine', 'Machine', 'glute med/min', sets(['57', 14], ['57', 14], ['57', 14])),
    ex('Dumbbell Shrug', 'Dumbbell', 'upper traps', sets(['30', 14], ['30', 12], ['30', 10])),
    ex('Back Supported Hanging Knee Raises', 'Bodyweight', 'abs', sets(['0', 12], ['0', 9], ['0', 6])),
    ex('Cable Rope Crunch', 'Cable', 'abs', sets(['22.5', 15], ['22.5', 15], ['22.5', 15]))
  ]),
  session(5, 3, ['IMG_4124.PNG', 'IMG_4125.PNG', 'IMG_4126.PNG', 'IMG_4127.PNG', 'IMG_4128.PNG'], [
    ex('Bench Press (Incline, Medium Grip)', 'Barbell', 'chest', sets(['60', 11], ['60', 8], ['60', 6])),
    ex('Machine Flye', 'Machine', 'chest', sets(['41', 12], ['41', 9])),
    ex('Cable Overhead Triceps Extension (Rope)', 'Cable', 'triceps long head', sets(['13.5', 13], ['13.5', 10], ['13.5', 8])),
    ex('Pulldown (Normal Grip)', 'Cable', 'lats', sets(['59', 12], ['59', 9], ['59', 7])),
    ex('Cable Pullover', 'Cable', 'lats', sets(['20', 15], ['20', 12], ['20', 10])),
    ex('WG T-Bar Row', 'Machine', 'upper back', sets(['25', 11], ['25', 9])),
    ex('Dumbbell Curl (Incline)', 'Dumbbell', 'biceps', sets(['10', 13], ['10', 13], ['10', 13])),
    ex('Dumbbell Lateral Raise (Incline)', 'Dumbbell', 'side delts', sets(['8', 13], ['8', 13], ['8', 13])),
    ex('Standing Calf Raise', 'Machine', 'gastrocnemius', sets(['10', 13], ['10', 13], ['10', 13]))
  ]),
  session(5, 4, ['IMG_4129.PNG', 'IMG_4130.PNG', 'IMG_4131.PNG', 'IMG_4132.PNG'], [
    ex('Dumbbell Bench Wrist Curl', 'Dumbbell', 'wrist flexors', sets(['8', 22])),
    ex('Pendulum Squat', 'Machine', 'quads (vasti)', sets(['10', 13], ['10', 10], ['10', 8])),
    ex('Machine Hip Thrust', 'Machine', 'glute max', sets(['20', 16], ['20', 16], ['20', 16])),
    ex('Lying Leg Curl', 'Machine', 'hamstrings (except BF short head)', sets(['54', 15], ['54', 15])),
    ex('Trap Bar Deadlift', 'Barbell', 'glute max', sets(['80', 9], ['80', 7])),
    ex('Trap Bar Shrugs', 'Barbell', 'upper traps', sets(['60', 16], ['60', 16], ['60', 16])),
    ex('Machine Crunch', 'Machine', 'abs', sets(['36', 14], ['36', 14], ['36', 14], ['36', 6]))
  ]),
  session(6, 1, ['IMG_4133.PNG', 'IMG_4134.PNG', 'IMG_4135.PNG', 'IMG_4136.PNG', 'IMG_4137.PNG'], [
    ex('Dumbbell Press (Medium Incline)', 'Dumbbell', 'chest', sets(['28', 9], ['28', 7], ['28', 6])),
    ex('Lying NG Machine Chest Press', 'Machine', 'chest', sets(['30', 12], ['30', 9], ['30', 7])),
    ex('Hammer Machine Row (High)', 'Machine', 'lats', sets(['40', 12], ['40', 9], ['40', 7])),
    ex('Nautilus CS NG Rows', 'Machine', 'upper back', sets(['20', 13], ['20', 10], ['20', 8])),
    ex('Machine Lateral Raise', 'Machine', 'side delts', sets(['32', 15], ['32', 15], ['32', 15])),
    ex('Cable Rope Facepull (Kneeling)', 'Cable', 'rear delts', sets(['12.5', 15], ['12.5', 15], ['12.5', 15])),
    ex('EZ Bar Curl (Normal Grip)', 'Barbell', 'biceps', sets(['25', 14], ['25', 14], ['25', 14])),
    ex('Cable Triceps Pushdown (Bar)', 'Cable', 'triceps lateral/medial', sets(['20.5', 16], ['20.5', 16], ['20.5', 16])),
    ex('Pendulum Calf Raises', 'Machine', 'gastrocnemius', sets(['5', 13], ['5', 13], ['5', 13], ['5', 13]))
  ]),
  session(6, 2, ['IMG_4138.PNG', 'IMG_4139.PNG', 'IMG_4140.PNG', 'IMG_4141.PNG', 'IMG_4142.PNG'], [
    ex('Barbell Bench Wrist Curl', 'Barbell', 'wrist flexors', sets(['15', 26], ['15', 26], ['15', 26])),
    ex('Belt Squat', 'Machine', 'quads (vasti)', sets(['35', 15], ['35', 12], ['35', 10])),
    ex('Belt Squat RDLs', 'Machine', 'hamstrings (except BF short head)', sets(['40', 12], ['40', 9])),
    ex('Leg Extension', 'Machine', 'quads (vasti)', sets(['25', 7], ['25', 7])),
    ex('Hip Abduction Machine', 'Machine', 'glute med/min', sets(['57', 11], ['57', 11])),
    ex('Back Supported Hanging Knee Raises', 'Bodyweight', 'abs', sets(['2.5', 8], ['2.5', 8], ['2.5', 8]))
  ])
];

const currentMesoSessions: BackfillSession[] = [
  currentSession(1, 'Upper A', '2026-06-09', [
    ex('Pull-ups', 'Bodyweight', 'lats', sets(['bodyweight', 10], ['bodyweight', 10])),
    ex('30-degree Incline DB Bench', 'Dumbbell', 'chest', sets(['24 kg', 14], ['24 kg', 14])),
    ex('Dips', 'Bodyweight/loadable', 'chest', sets(['setup 11', 9], ['setup 11', 9])),
    ex('CS WG T-bar Rows + Kelso', 'Machine', 'upper back', sets(['20 kg', 12], ['20 kg', 12])),
    ex('Rope OH Extensions', 'Cable', 'triceps long head', sets(['13.5 kg', 13], ['13.5 kg', 13])),
    ex('Incline Curls', 'Dumbbell', 'biceps', sets(['10 kg', 13], ['10 kg', 13])),
    ex('DB Butterfly Raises', 'Dumbbell', 'side delts', sets(['6 kg', 13], ['6 kg', 13], ['6 kg', 13])),
    ex('Kneeling Rope Facepulls', 'Cable', 'rear delts', sets(['16 kg', 12], ['16 kg', 12])),
    ex('Pendulum Calf Raises', 'Machine', 'gastrocnemius', sets(['30 assistance', 12], ['30 assistance', 12], ['30 assistance', 12]))
  ]),
  currentSession(2, 'Lower A', '2026-06-10', [
    ex('DB Bench Wrist Extensions', 'Dumbbell', 'wrist extensors', sets(['4 kg', 20], ['4 kg', 20], ['4 kg', 20])),
    ex('DB Bench Wrist Curls', 'Dumbbell', 'wrist flexors', sets(['8 kg', 20], ['8 kg', 20], ['8 kg', 20])),
    ex('DB Reverse Curls', 'Dumbbell', 'brachioradialis', sets(['8 kg', 12], ['8 kg', 12], ['8 kg', 12])),
    ex('Leg Extensions', 'Machine', 'quads (vasti)', sets(['20', 14], ['20', 14])),
    ex('Pendulum Squats', 'Machine', 'quads (vasti)', sets(['0', 16], ['0', 16])),
    ex('Belt Squat RDLs', 'Belt squat', 'hamstrings (except BF short head)', sets(['40', 15], ['40', 12]), 'regular'),
    ex('Hip Abduction Machine', 'Machine', 'glute med/min', sets(['57', 13], ['57', 13], ['57', 13])),
    ex('Walking Lunges, glute emphasis', 'Dumbbell', 'glute max', sets(['10', 14])),
    ex('Shrugs (BB WG)', 'Barbell', 'upper traps', sets(['40', 20], ['40', 20], ['40', 20])),
    ex('Back-supported Hanging Leg Raises', 'Bodyweight/loadable', 'abs', sets(['setup reglaj 10', 9], ['setup reglaj 10', 9])),
    ex('Rope Crunches', 'Cable', 'abs', sets(['22.5', 15], ['22.5', 15]))
  ]),
  currentSession(3, 'Upper B', '2026-06-11', [
    ex('Medium Grip Pulldowns', 'Cable', 'lats', sets(['50', 16], ['50', 16])),
    ex('Incline BB Bench', 'Barbell', 'chest', sets(['50', 15], ['50', 15])),
    ex('Machine Flyes', 'Machine', 'chest', sets(['36', 13], ['36', 13])),
    ex('Lat Prayers', 'Cable', 'lats', sets(['15', 13], ['15', 13])),
    ex('T-Bar WG Rows', 'Machine', 'upper back', sets(['20', 14], ['20', 14])),
    ex('ZBB Skullcrushers', 'Barbell', 'triceps long head', sets(['5', 16], ['5', 16])),
    ex('Cable Cross Body Lateral Raises', 'Cable', 'side delts', sets(['2.3', 20], ['2.3', 20], ['2.3', 20])),
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
  id: 'previous-training-block',
  name: 'Meso 2 - cutting',
  status: 'completed',
  weeks: 6,
  daysPerWeek: 4,
  startedAt: null,
  completedAt: '2026-06-08',
  templateMesoId: null
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

for (const seededSession of previousMesoSessions) {
  upsertSession(seededSession);
}

for (const seededSession of currentMesoSessions) {
  upsertSession(seededSession);
}

console.log(`seeded ${previousMesoSessions.length} previous-meso sessions and ${currentMesoSessions.length} current-meso sessions into ${dbPath}`);

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
      equipment text not null default 'unknown'
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

function session(weekNumber: number, dayNumber: number, sourceImages: string[], exercises: BackfillExercise[]): BackfillSession {
  return {
    id: `previous-meso-w${weekNumber}-d${dayNumber}`,
    mesocycleId: 'previous-training-block',
    templateName: `Previous Meso W${weekNumber} D${dayNumber}`,
    weekNumber,
    dayNumber,
    trainingDate: previousMesoTrainingDate(weekNumber, dayNumber),
    source: 'raw/programs/last-meso screenshots',
    sourceImages,
    notes: 'Backfilled from screenshot OCR/manual review. The RP screenshots do not expose calendar dates; trainingDate uses an approximate week/day schedule anchored near the meso end date. Ambiguous or nonnumeric rows were omitted.',
    exercises
  };
}

function previousMesoTrainingDate(weekNumber: number, dayNumber: number) {
  const dayOffset = previousMesoDayOffsets[dayNumber - 1] ?? 0;
  // Use UTC anchor so ISO date doesn't shift by local timezone.
  const base = new Date(`${previousMesoStartDate}T00:00:00Z`);
  const offsetDays = (weekNumber - 1) * 7 + dayOffset;
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().slice(0, 10);
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
    const templateExerciseId = `${backfillSession.id}-${exerciseIndex + 1}-${originalExerciseId}`;
    const method = exercise.method ?? 'myo-match';

    db.insert(exercises)
      .values({
        id: exerciseId,
        name: exerciseName,
        primaryMuscle: exercise.primaryMuscle,
        equipment: toEquipmentType(exercise.equipment)
      })
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          name: exerciseName,
          primaryMuscle: exercise.primaryMuscle,
          equipment: toEquipmentType(exercise.equipment)
        }
      })
      .run();

    db.delete(exerciseMuscleCoefficients).where(eq(exerciseMuscleCoefficients.exerciseId, exerciseId)).run();
    db.insert(exerciseMuscleCoefficients)
      .values({ exerciseId, muscle: exercise.primaryMuscle, coefficient: 1 })
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
