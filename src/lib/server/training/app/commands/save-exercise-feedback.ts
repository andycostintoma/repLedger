import { upsertExerciseFeedback, type SaveExerciseFeedbackInput } from '../../outbound/sqlite/today-workout-store';

export const saveExerciseFeedback = (input: SaveExerciseFeedbackInput) => upsertExerciseFeedback(input);
