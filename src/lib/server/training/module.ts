import { createExercise } from './app/commands/create-exercise';
import { createMesocycle } from './app/commands/create-mesocycle';
import { createTemplateMesocycle } from './app/commands/create-template-mesocycle';
import { finishWorkout } from './app/commands/finish-workout';
import { logSet } from './app/commands/log-set';
import { saveExerciseFeedback } from './app/commands/save-exercise-feedback';
import { saveMuscleFeedback } from './app/commands/save-muscle-feedback';
import { saveSuggestion } from './app/commands/save-suggestion';
import { updateExerciseName } from './app/commands/update-exercise-name';
import { updateExerciseMuscles } from './app/commands/update-exercise-muscles';
import { getTodayWorkout } from './app/queries/get-today-workout';
import { getTrainingCatalog } from './app/queries/get-training-catalog';

export const training = {
  commands: {
    createExercise,
    createMesocycle,
    createTemplateMesocycle,
    finishWorkout,
    logSet,
    saveExerciseFeedback,
    saveMuscleFeedback,
    saveSuggestion,
    updateExerciseName,
    updateExerciseMuscles
  },
  queries: {
    getTodayWorkout,
    getTrainingCatalog
  }
};
