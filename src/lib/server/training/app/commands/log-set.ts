import { upsertLoggedSet, type SaveLoggedSetInput } from '../../outbound/sqlite/today-workout-store';

export const logSet = (input: SaveLoggedSetInput) => upsertLoggedSet(input);
