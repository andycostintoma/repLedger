import { getTodayWorkout as getTodayWorkoutFromStore } from '../../outbound/sqlite/today-workout-store';

export const getTodayWorkout = () => getTodayWorkoutFromStore();
