import type { TrainingMethod } from '../types';

const myoMatchSetEquivalents: Record<number, number> = {
  1: 1,
  2: 2.5,
  3: 4.5,
  4: 7,
  5: 10
};

export const getLoggedSetEquivalents = (method: TrainingMethod, loggedSetCount: number) => {
  if (loggedSetCount <= 0) {
    return 0;
  }

  if (method === 'regular') {
    return loggedSetCount;
  }

  return myoMatchSetEquivalents[Math.min(loggedSetCount, 5)] ?? 0;
};
