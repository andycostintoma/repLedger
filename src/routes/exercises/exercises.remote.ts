import { command } from '$app/server';
import { training } from '$lib/server/training/module';
import { equipmentTypes } from '$lib/training/equipment';
import { z } from 'zod';

const createExerciseInput = z.object({
  name: z.string().trim().min(1),
  primaryMuscle: z.string().trim().min(1),
  equipment: z.enum(equipmentTypes)
});

export const addExercise = command(createExerciseInput, async (input) => {
  const result = await training.commands.createExercise(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});
