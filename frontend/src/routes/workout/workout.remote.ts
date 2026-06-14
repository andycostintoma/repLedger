import { command } from '$app/server';
import { training } from '$lib/server/training/module';
import { muscleGroups } from '$lib/training/model';
import { z } from 'zod';

const saveLoggedSetInput = z.object({
  sessionId: z.string().min(1),
  templateExerciseId: z.string().min(1),
  setIndex: z.number().int().min(1),
  loadText: z.string().trim().min(1),
  reps: z.number().int().min(0).max(100),
  notes: z.string().trim().nullable(),
  pain: z.number().int().min(0).max(10).nullable()
});

export const saveLoggedSet = command(saveLoggedSetInput, async (input) => {
  const result = await training.commands.logSet(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const, saved: result.value };
});

const saveExerciseFeedbackInput = z.object({
  sessionId: z.string().min(1),
  templateExerciseId: z.string().min(1),
  painAfter: z.number().int().min(0).max(10).nullable(),
  notes: z.string().trim().nullable()
});

export const saveExerciseFeedback = command(saveExerciseFeedbackInput, async (input) => {
  const result = await training.commands.saveExerciseFeedback(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});

const saveMuscleFeedbackInput = z.object({
  sessionId: z.string().min(1),
  muscle: z.enum(muscleGroups),
  soreness: z.number().int().min(0).max(5).nullable(),
  pump: z.number().int().min(0).max(5).nullable(),
  workload: z.enum(['too-low', 'good', 'too-high']).nullable(),
  notes: z.string().trim().nullable()
});

export const saveMuscleFeedback = command(saveMuscleFeedbackInput, async (input) => {
  const result = await training.commands.saveMuscleFeedback(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});

const saveSuggestionInput = z.object({
  sessionId: z.string().min(1),
  muscle: z.enum(muscleGroups),
  suggestion: z.string().trim().min(1),
  status: z.enum(['proposed', 'accepted', 'ignored', 'edited'])
});

export const saveSuggestion = command(saveSuggestionInput, async (input) => {
  const result = await training.commands.saveSuggestion(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});

const finishWorkoutInput = z.object({
  sessionId: z.string().min(1)
});

export const finishWorkout = command(finishWorkoutInput, async (input) => {
  const result = await training.commands.finishWorkout(input);

  if (result.isErr()) {
    return { ok: false as const, error: result.error.message };
  }

  return { ok: true as const };
});
