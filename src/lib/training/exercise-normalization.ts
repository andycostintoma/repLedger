const canonicalExerciseNames: Record<string, string> = {
  'back supported hanging knee raise': 'Back-supported Hanging Leg Raises',
  'back supported hanging leg raise': 'Back-supported Hanging Leg Raises',
  'barbell bench wrist curl': 'Barbell Bench Wrist Curl',
  'belt squat': 'Belt Squat',
  'cable overhead tricep extension rope': 'Cable Overhead Triceps Extension (Rope)',
  'cable rope crunch': 'Cable Rope Crunch',
  'cable rope facepull': 'Cable Rope Facepull',
  'cable rope facepull kneeling': 'Cable Rope Facepull',
  'dumbbell bench wrist curl': 'Dumbbell Bench Wrist Curl',
  'dumbbell curl incline': 'Dumbbell Curl (Incline)',
  'incline curl': 'Dumbbell Curl (Incline)',
  'kneeling rope facepull': 'Cable Rope Facepull',
  'leg press calf': 'Leg Press Calf Raises',
  'leg press calf raise': 'Leg Press Calf Raises',
  'leg extension': 'Leg Extension',
  'lying leg curl': 'Lying Leg Curl',
  'machine crunch': 'Machine Crunch',
  'machine flye': 'Machine Flye',
  'machine hip thrust': 'Machine Hip Thrust',
  'medium grip pulldown': 'Pulldown (Normal Grip)',
  'pendulum squat': 'Pendulum Squat',
  'rope crunch': 'Cable Rope Crunch',
  'rope oh extension': 'Cable Overhead Triceps Extension (Rope)',
  't bar wg row': 'WG T-Bar Row',
  'wg t bar row': 'WG T-Bar Row'
};

export const normalizedExerciseName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\bbb\b/g, 'barbell')
    .replace(/\bdb\b/g, 'dumbbell')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(singularizeExerciseWord)
    .join(' ');

export const canonicalExerciseName = (name: string) => canonicalExerciseNames[normalizedExerciseName(name)] ?? name;

export const canonicalExerciseId = (name: string) => slugify(canonicalExerciseName(name));

export const slugifyExerciseName = (name: string) => slugify(name);

const singularizeExerciseWord = (word: string) => {
  if (word === 'calves') return 'calf';
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if ((word.endsWith('ches') || word.endsWith('shes') || word.endsWith('xes') || word.endsWith('zes')) && word.length > 5) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);

  return word;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/kg/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
