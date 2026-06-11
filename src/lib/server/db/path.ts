import { fileURLToPath } from 'node:url';

import { env } from '$env/dynamic/private';

const defaultTrainingDbPath = fileURLToPath(
  new URL('../../../../../ops/data/training/training.sqlite', import.meta.url)
);

export const trainingDbPath = env['TRAINING_DB_PATH'] ?? defaultTrainingDbPath;
