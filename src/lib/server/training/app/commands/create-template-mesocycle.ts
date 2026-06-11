import { createTemplateMesocycle as createTemplateMesocycleInStore, type CreateTemplateMesocycleInput } from '../../outbound/sqlite/training-catalog-store';

export const createTemplateMesocycle = (input: CreateTemplateMesocycleInput) => createTemplateMesocycleInStore(input);
