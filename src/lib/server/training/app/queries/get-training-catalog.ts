import { getTrainingCatalog as getTrainingCatalogFromStore } from '../../outbound/sqlite/training-catalog-store';

export const getTrainingCatalog = () => getTrainingCatalogFromStore();
