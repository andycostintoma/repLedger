import { error } from '@sveltejs/kit';

import { training } from '$lib/server/training/module';

export const load = async () => {
  const workout = await training.queries.getTodayWorkout();

  if (workout.isErr()) {
    error(500, workout.error.message);
  }

  return {
    workout: workout.value
  };
};
