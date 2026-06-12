export const muscleGroups = [
  'quads_vasti',
  'rectus_femoris',
  'adductors',
  'hamstrings_biarticular',
  'biceps_femoris_short_head',
  'glute_max',
  'glute_med_min',
  'erector_spinae',
  'abs',
  'wrist_flexors',
  'wrist_extensors',
  'brachioradialis',
  'biceps',
  'triceps_lateral_medial',
  'triceps_long_head',
  'front_delts',
  'side_delts',
  'rear_delts',
  'chest',
  'lats',
  'upper_back',
  'upper_traps',
  'soleus',
  'gastrocnemius',
  'neck_extensors',
  'neck_flexors'
] as const;

export type MuscleGroup = (typeof muscleGroups)[number];

export const isMuscleGroup = (value: string): value is MuscleGroup =>
  muscleGroups.includes(value as MuscleGroup);
