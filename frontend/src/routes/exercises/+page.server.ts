import { error } from '@sveltejs/kit';

import { training } from '$lib/server/training/module';

export const load = async ({ url }) => {
  const catalog = await training.queries.getTrainingCatalog();

  if (catalog.isErr()) {
    error(500, catalog.error.message);
  }

  return {
    catalog: catalog.value,
    selectedExerciseId: url.searchParams.get('exercise')
  };
};
