import { upsertMuscleFeedback, type SaveMuscleFeedbackInput } from '../../outbound/sqlite/today-workout-store';

export const saveMuscleFeedback = (input: SaveMuscleFeedbackInput) => upsertMuscleFeedback(input);
