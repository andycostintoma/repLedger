import type { TrainingDatabase } from '$lib/server/db/client';
import { mesocycles, templateMesocycles } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';

const currentSplitTemplateId = 'current-upper-lower-six-day-rotation';
const removedTemplateMesoIds = ['rp-style-six-day-hypertrophy', 'upper-lower-four-day-base'];

const seedTemplateMesocycles = [
  {
    id: currentSplitTemplateId,
    name: 'Current upper/lower rotation',
    category: 'Hypertrophy',
    frequency: '6 days/week',
    gender: 'All',
    weeks: 8,
    daysPerWeek: 6
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
    templateMesoId: currentSplitTemplateId
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
      .onConflictDoUpdate({
        target: templateMesocycles.id,
        set: { ...template, updatedAt: now }
      })
      .run();
  });

  seedMesocycles.forEach((mesocycle) => {
    db.insert(mesocycles)
      .values({ ...mesocycle, updatedAt: now })
      .onConflictDoUpdate({
        target: mesocycles.id,
        set: { ...mesocycle, updatedAt: now }
      })
      .run();
  });

  db.delete(templateMesocycles).where(inArray(templateMesocycles.id, removedTemplateMesoIds)).run();
};
