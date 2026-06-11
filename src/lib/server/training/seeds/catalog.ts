import type { TrainingDatabase } from '$lib/server/db/client';
import { mesocycles, templateMesocycles } from '$lib/server/db/schema';

const seedTemplateMesocycles = [
  {
    id: 'rp-style-six-day-hypertrophy',
    name: 'RP-style 6 day hypertrophy',
    category: 'Hypertrophy',
    frequency: '6 days/week',
    gender: 'All',
    weeks: 8,
    daysPerWeek: 6
  },
  {
    id: 'upper-lower-four-day-base',
    name: 'Upper/lower 4 day base',
    category: 'Base',
    frequency: '4 days/week',
    gender: 'All',
    weeks: 6,
    daysPerWeek: 4
  }
];

const seedMesocycles = [
  {
    id: 'current-week-1-lower-b',
    name: 'Current hypertrophy meso',
    status: 'current' as const,
    weeks: 8,
    daysPerWeek: 6,
    startedAt: '2026-06-09',
    completedAt: null,
    templateMesoId: 'rp-style-six-day-hypertrophy'
  },
  {
    id: 'previous-training-block',
    name: 'Previous training block',
    status: 'completed' as const,
    weeks: 6,
    daysPerWeek: 5,
    startedAt: null,
    completedAt: '2026-06-08',
    templateMesoId: null
  }
];

export const seedCatalog = (db: TrainingDatabase) => {
  const now = new Date().toISOString();

  seedTemplateMesocycles.forEach((template) => {
    db.insert(templateMesocycles)
      .values({ ...template, updatedAt: now })
      .onConflictDoNothing()
      .run();
  });

  seedMesocycles.forEach((mesocycle) => {
    db.insert(mesocycles)
      .values({ ...mesocycle, updatedAt: now })
      .onConflictDoNothing()
      .run();
  });
};
