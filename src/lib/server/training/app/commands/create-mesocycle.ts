import { createMesocycle as createMesocycleInStore, type CreateMesocycleInput } from '../../outbound/sqlite/training-catalog-store';

export const createMesocycle = (input: CreateMesocycleInput) => createMesocycleInStore(input);
