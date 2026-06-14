import { command } from '$app/server';
import { training } from '$lib/server/training/module';
import { z } from 'zod';

const createMesocycleInput = z.object({
  name: z.string().trim().min(1),
  status: z.enum(['current', 'planned', 'completed']),
  weeks: z.number().int().min(1).max(52),
  daysPerWeek: z.number().int().min(1).max(7),
  templateMesoId: z.string().trim().min(1).nullable().optional()
});

export const addMesocycle = command(createMesocycleInput, async (input) => {
  const result = await training.commands.createMesocycle(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});

const createTemplateMesocycleInput = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  frequency: z.string().trim().min(1),
  gender: z.string().trim().min(1),
  weeks: z.number().int().min(1).max(52),
  daysPerWeek: z.number().int().min(1).max(7)
});

export const addTemplateMesocycle = command(createTemplateMesocycleInput, async (input) => {
  const result = await training.commands.createTemplateMesocycle(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});
