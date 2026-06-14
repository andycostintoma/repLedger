import {
  createExerciseViaGrpc,
  createMesocycleViaGrpc,
  createTemplateMesocycleViaGrpc,
  finishWorkoutViaGrpc,
  getTodayWorkoutFromGrpc,
  getTrainingCatalogFromGrpc,
  logSetViaGrpc,
  saveExerciseFeedbackViaGrpc,
  saveMuscleFeedbackViaGrpc,
  saveSuggestionViaGrpc,
  updateExerciseMusclesViaGrpc,
  updateExerciseNameViaGrpc
} from './outbound/grpc/training-client';

export const training = {
  commands: {
    createExercise: createExerciseViaGrpc,
    createMesocycle: createMesocycleViaGrpc,
    createTemplateMesocycle: createTemplateMesocycleViaGrpc,
    finishWorkout: finishWorkoutViaGrpc,
    logSet: logSetViaGrpc,
    saveExerciseFeedback: saveExerciseFeedbackViaGrpc,
    saveMuscleFeedback: saveMuscleFeedbackViaGrpc,
    saveSuggestion: saveSuggestionViaGrpc,
    updateExerciseName: updateExerciseNameViaGrpc,
    updateExerciseMuscles: updateExerciseMusclesViaGrpc
  },
  queries: {
    getTodayWorkout: getTodayWorkoutFromGrpc,
    getTrainingCatalog: getTrainingCatalogFromGrpc
  }
};
