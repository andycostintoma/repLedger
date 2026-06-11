import { completeWorkout, type CompleteWorkoutInput } from '../../outbound/sqlite/today-workout-store';

export const finishWorkout = (input: CompleteWorkoutInput) => completeWorkout(input);
