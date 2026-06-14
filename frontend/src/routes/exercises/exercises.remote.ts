import { command } from '$app/server';
import { training } from '$lib/server/training/module';
import { equipmentTypes } from '$lib/training/equipment';
import { muscleCoefficientValues, muscleGroups } from '$lib/training/model';
import { z } from 'zod';

const coefficientValue = z.union(muscleCoefficientValues.map((value) => z.literal(value)) as [z.ZodLiteral<0>, z.ZodLiteral<0.5>, z.ZodLiteral<1>]);

const muscleCoefficientInput = z.object({
  muscle: z.enum(muscleGroups),
  coefficient: coefficientValue
});

const createExerciseInput = z.object({
  name: z.string().trim().min(1),
  primaryMuscle: z.enum(muscleGroups).optional(),
  equipment: z.enum(equipmentTypes),
  familyId: z.string().trim().nullable().optional(),
  muscleCoefficients: z.array(muscleCoefficientInput).optional()
});

const updateExerciseMusclesInput = z.object({
  exerciseId: z.string().trim().min(1),
  familyId: z.string().trim().nullable().optional(),
  muscleCoefficients: z.array(muscleCoefficientInput).optional(),
  primaryMuscles: z.array(z.enum(muscleGroups)).optional(),
  secondaryMuscles: z.array(z.enum(muscleGroups)).optional()
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
