export const muscleCoefficientValues = [0, 0.5, 1] as const;

export type MuscleCoefficientValue = (typeof muscleCoefficientValues)[number];

export const isMuscleCoefficientValue = (value: number): value is MuscleCoefficientValue =>
  muscleCoefficientValues.includes(value as MuscleCoefficientValue);
