export const muscleGroups = [
  'quads (vasti)',
  'rectus femoris',
  'adductors',
  'hamstrings (except BF short head)',
  'biceps femoris short head',
  'glute max',
  'glute med/min',
  'erector spinae',
  'abs',
  'wrist flexors',
  'wrist extensors',
  'brachioradialis',
  'biceps',
  'triceps lateral/medial',
  'triceps long head',
  'front delts',
  'side delts',
  'rear delts',
  'chest',
  'lats',
  'upper back',
  'upper traps',
  'soleus',
  'gastrocnemius',
  'neck extensors',
  'neck flexors'
] as const;

export type MuscleGroup = (typeof muscleGroups)[number];

export const isMuscleGroup = (value: string): value is MuscleGroup =>
  muscleGroups.includes(value as MuscleGroup);
