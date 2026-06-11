import { command } from '$app/server';
import { muscleGroups } from '$lib/server/training/domain/muscles';
import { training } from '$lib/server/training/module';
import { equipmentTypes } from '$lib/training/equipment';
import { z } from 'zod';

const createExerciseInput = z.object({
  name: z.string().trim().min(1),
  primaryMuscle: z.enum(muscleGroups),
  equipment: z.enum(equipmentTypes)
});

const updateExerciseMusclesInput = z.object({
  exerciseId: z.string().trim().min(1),
  primaryMuscles: z.array(z.enum(muscleGroups)).min(1),
  secondaryMuscles: z.array(z.enum(muscleGroups))
});

const updateExerciseNameInput = z.object({
  exerciseId: z.string().trim().min(1),
  name: z.string().trim().min(1)
});

export const addExercise = command(createExerciseInput, async (input) => {
  const result = await training.commands.createExercise(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});

export const saveExerciseMuscles = command(updateExerciseMusclesInput, async (input) => {
  const result = await training.commands.updateExerciseMuscles(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});

export const saveExerciseName = command(updateExerciseNameInput, async (input) => {
  const result = await training.commands.updateExerciseName(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});
