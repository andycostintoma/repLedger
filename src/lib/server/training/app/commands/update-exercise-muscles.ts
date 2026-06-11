import { updateExerciseMuscles as updateExerciseMusclesInStore, type UpdateExerciseMusclesInput } from '../../outbound/sqlite/training-catalog-store';

export const updateExerciseMuscles = (input: UpdateExerciseMusclesInput) => updateExerciseMusclesInStore(input);
