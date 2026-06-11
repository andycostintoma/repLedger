import { updateExerciseName as updateExerciseNameInStore, type UpdateExerciseNameInput } from '../../outbound/sqlite/training-catalog-store';

export const updateExerciseName = (input: UpdateExerciseNameInput) => updateExerciseNameInStore(input);
