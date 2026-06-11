import { createExercise as createExerciseInStore, type CreateExerciseInput } from '../../outbound/sqlite/training-catalog-store';

export const createExercise = (input: CreateExerciseInput) => createExerciseInStore(input);
