import { upsertSuggestion, type SaveSuggestionInput } from '../../outbound/sqlite/today-workout-store';

export const saveSuggestion = (input: SaveSuggestionInput) => upsertSuggestion(input);
