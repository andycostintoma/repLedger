import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';

import { trainingDbPath } from './path';
import * as schema from './schema';

export type TrainingDatabase = BunSQLiteDatabase<typeof schema>;

let database: TrainingDatabase | null = null;

export const getDb = async (): Promise<TrainingDatabase> => {
  if (database) {
    return database;
  }

  const [{ Database }, { drizzle }] = await Promise.all([import('bun:sqlite'), import('drizzle-orm/bun-sqlite')]);
  const sqlite = new Database(trainingDbPath, { create: true });
  sqlite.run('PRAGMA journal_mode = WAL');
  sqlite.run('PRAGMA busy_timeout = 5000');
  sqlite.run('PRAGMA foreign_keys = ON');

  database = drizzle(sqlite, { schema });

  return database;
};
