import type { MuscleGroup } from './muscles';
import type { WorkloadRating } from '../types';

type MuscleFeedbackSuggestionInput = {
  muscle: MuscleGroup;
  soreness: number | null;
  pump: number | null;
  workload: WorkloadRating | null;
};

export const buildMuscleFeedbackSuggestion = (input: MuscleFeedbackSuggestionInput) => {
  if (input.soreness !== null && input.soreness >= 4) {
    return `${input.muscle}: high soreness. Hold or reduce next-session volume until soreness normalizes.`;
  }

  if (input.workload === 'too-high') {
    return `${input.muscle}: workload felt too high. Repeat or reduce next exposure instead of adding sets/load.`;
  }

  if (input.pump !== null && input.pump <= 1 && input.workload === 'too-low') {
    return `${input.muscle}: weak pump and low workload. Consider a small next-exposure increase if performance stays in range and pain is low.`;
  }

  if (input.workload === 'too-low') {
    return `${input.muscle}: workload felt low. Consider a small next-exposure progression if reps stay in the target range.`;
  }

  return `${input.muscle}: feedback looks acceptable. Repeat the plan next exposure unless performance or pain says otherwise.`;
};

export const buildPainSuggestion = (input: { exerciseName: string; muscle: MuscleGroup; painAfter: number }) =>
  `Pain after ${input.exerciseName} was ${input.painAfter}/10. Hold or reduce loading next exposure and do not add volume for ${input.muscle}.`;
