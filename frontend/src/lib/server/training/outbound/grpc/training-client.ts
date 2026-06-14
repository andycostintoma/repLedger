import {
    type ChannelCredentials,
    type Client,
    type ClientOptions,
    type ClientUnaryCall,
    credentials,
    makeGenericClientConstructor,
    type ServiceError
} from '@grpc/grpc-js';
import {err, ok, type Result} from 'neverthrow';

import {
    CreateExerciseRequest,
    CreateExerciseResponse,
    CreateMesocycleRequest,
    CreateMesocycleResponse,
    CreateTemplateMesocycleRequest,
    CreateTemplateMesocycleResponse,
    type Exercise,
    type ExerciseFamily,
    type ExerciseHistoryEntry,
    type ExerciseMuscleCoefficient as GrpcExerciseMuscleCoefficient,
    FinishWorkoutRequest,
    FinishWorkoutResponse,
    GetTodayWorkoutRequest,
    GetTodayWorkoutResponse,
    GetTrainingCatalogRequest,
    GetTrainingCatalogResponse,
    type LoggedSet as GrpcLoggedSet,
    LogSetRequest,
    LogSetResponse,
    type Mesocycle,
    type MesocycleExercise,
    type MesocycleSession,
    type MuscleFeedback,
    type MuscleVolumeFact,
    type NextSessionSuggestion,
    type PlannedExercise,
    SaveExerciseFeedbackRequest,
    SaveExerciseFeedbackResponse,
    SaveMuscleFeedbackRequest,
    SaveMuscleFeedbackResponse,
    SaveSuggestionRequest,
    SaveSuggestionResponse,
    type TemplateMesocycle,
    UpdateExerciseCoefficientsRequest,
    UpdateExerciseCoefficientsResponse,
    UpdateExerciseNameRequest,
    UpdateExerciseNameResponse
} from '$lib/gen/proto/training/v1/training';
import {equipmentStringVal, stringToEquipment} from '$lib/gen/proto/training/v1/enums/equipment.z.options';
import {
    exerciseFamilyCodeStringVal,
    stringToExerciseFamilyCode
} from '$lib/gen/proto/training/v1/enums/exercise_family_code.z.options';
import {
    feedbackWorkloadStringVal,
    stringToFeedbackWorkload
} from '$lib/gen/proto/training/v1/enums/feedback_workload.z.options';
import {
    mesocycleStatusStringVal,
    stringToMesocycleStatus
} from '$lib/gen/proto/training/v1/enums/mesocycle_status.z.options';
import {muscleGroupStringVal, stringToMuscleGroup} from '$lib/gen/proto/training/v1/enums/muscle_group.z.options';
import {
    stringToSuggestionStatus,
    suggestionStatusStringVal
} from '$lib/gen/proto/training/v1/enums/suggestion_status.z.options';
import {
    stringToTrainingMethod,
    trainingMethodStringVal
} from '$lib/gen/proto/training/v1/enums/training_method.z.options';
import {workoutStatusStringVal} from '$lib/gen/proto/training/v1/enums/workout_status.z.options';

import {type EquipmentType, toEquipmentType} from '$lib/training/equipment';
import {
    type ExerciseMuscleCoefficient,
    isMuscleGroup,
    type LoggedSet,
    type MesocycleSessionSummary,
    type MesoStatus,
    type MuscleCoefficientValue,
    type MuscleGroup,
    type TodayWorkout,
    type TrainingCatalog,
    type WorkloadRating
} from '$lib/training/model';

export type TrainingBackendError = {
    kind: 'training-backend-error';
    message: string;
};

export type SaveLoggedSetInput = {
    sessionId: string;
    templateExerciseId: string;
    setIndex: number;
    loadText: string;
    reps: number;
    notes: string | null;
    pain: number | null;
};

export type SaveExerciseFeedbackInput = {
    sessionId: string;
    templateExerciseId: string;
    painAfter: number | null;
    notes: string | null;
};

export type SaveMuscleFeedbackInput = {
    sessionId: string;
    muscle: MuscleGroup;
    soreness: number | null;
    pump: number | null;
    workload: WorkloadRating | null;
    notes: string | null;
};

export type SaveSuggestionInput = {
    sessionId: string;
    muscle: MuscleGroup;
    suggestion: string;
    status: 'proposed' | 'accepted' | 'ignored' | 'edited';
};

export type CompleteWorkoutInput = {
    sessionId: string;
};

export type CreateMesocycleInput = {
    name: string;
    status: MesoStatus;
    weeks: number;
    daysPerWeek: number;
    templateMesoId?: string | null;
};

export type CreateTemplateMesocycleInput = {
    name: string;
    category: string;
    frequency: string;
    gender: string;
    weeks: number;
    daysPerWeek: number;
};

export type ExerciseMuscleCoefficientInput = {
    muscle: MuscleGroup;
    coefficient: MuscleCoefficientValue;
};

export type CreateExerciseInput = {
    name: string;
    primaryMuscle?: MuscleGroup;
    equipment: EquipmentType;
    familyId?: string | null;
    muscleCoefficients?: ExerciseMuscleCoefficientInput[];
};

export type UpdateExerciseMusclesInput = {
    exerciseId: string;
    familyId?: string | null;
    muscleCoefficients?: ExerciseMuscleCoefficientInput[];
    primaryMuscles?: MuscleGroup[];
    secondaryMuscles?: MuscleGroup[];
};

export type UpdateExerciseNameInput = {
    exerciseId: string;
    name: string;
};

type GrpcTrainingCatalogResponse = GetTrainingCatalogResponse;
type GrpcTodayWorkoutResponse = GetTodayWorkoutResponse;
type GrpcExercise = Exercise;
type GrpcExerciseFamily = ExerciseFamily;
type GrpcTemplateMesocycle = TemplateMesocycle;
type GrpcMesocycle = Mesocycle;
type GrpcPlannedExercise = PlannedExercise;
type GrpcMuscleFeedback = MuscleFeedback;
type GrpcMuscleVolumeFact = MuscleVolumeFact;
type GrpcNextSessionSuggestion = NextSessionSuggestion;
type GrpcMesocycleSession = MesocycleSession;
type GrpcMesocycleExercise = MesocycleExercise;
type GrpcExerciseHistoryEntry = ExerciseHistoryEntry;

type UnaryCallback<TResponse> = (error: ServiceError | null, response: TResponse) => void;

type GeneratedTrainingServiceClient = Client & {
    getTrainingCatalog: (request: GetTrainingCatalogRequest, callback: UnaryCallback<GetTrainingCatalogResponse>) => ClientUnaryCall;
    getTodayWorkout: (request: GetTodayWorkoutRequest, callback: UnaryCallback<GetTodayWorkoutResponse>) => ClientUnaryCall;
    logSet: (request: LogSetRequest, callback: UnaryCallback<LogSetResponse>) => ClientUnaryCall;
    saveExerciseFeedback: (request: SaveExerciseFeedbackRequest, callback: UnaryCallback<SaveExerciseFeedbackResponse>) => ClientUnaryCall;
    saveMuscleFeedback: (request: SaveMuscleFeedbackRequest, callback: UnaryCallback<SaveMuscleFeedbackResponse>) => ClientUnaryCall;
    saveSuggestion: (request: SaveSuggestionRequest, callback: UnaryCallback<SaveSuggestionResponse>) => ClientUnaryCall;
    finishWorkout: (request: FinishWorkoutRequest, callback: UnaryCallback<FinishWorkoutResponse>) => ClientUnaryCall;
    createMesocycle: (request: CreateMesocycleRequest, callback: UnaryCallback<CreateMesocycleResponse>) => ClientUnaryCall;
    createTemplateMesocycle: (request: CreateTemplateMesocycleRequest, callback: UnaryCallback<CreateTemplateMesocycleResponse>) => ClientUnaryCall;
    createExercise: (request: CreateExerciseRequest, callback: UnaryCallback<CreateExerciseResponse>) => ClientUnaryCall;
    updateExerciseName: (request: UpdateExerciseNameRequest, callback: UnaryCallback<UpdateExerciseNameResponse>) => ClientUnaryCall;
    updateExerciseCoefficients: (request: UpdateExerciseCoefficientsRequest, callback: UnaryCallback<UpdateExerciseCoefficientsResponse>) => ClientUnaryCall;
};

const trainingServiceDefinition = {
    getTrainingCatalog: unaryMethod('/training.v1.TrainingService/GetTrainingCatalog', GetTrainingCatalogRequest, GetTrainingCatalogResponse),
    getTodayWorkout: unaryMethod('/training.v1.TrainingService/GetTodayWorkout', GetTodayWorkoutRequest, GetTodayWorkoutResponse),
    logSet: unaryMethod('/training.v1.TrainingService/LogSet', LogSetRequest, LogSetResponse),
    saveExerciseFeedback: unaryMethod('/training.v1.TrainingService/SaveExerciseFeedback', SaveExerciseFeedbackRequest, SaveExerciseFeedbackResponse),
    saveMuscleFeedback: unaryMethod('/training.v1.TrainingService/SaveMuscleFeedback', SaveMuscleFeedbackRequest, SaveMuscleFeedbackResponse),
    saveSuggestion: unaryMethod('/training.v1.TrainingService/SaveSuggestion', SaveSuggestionRequest, SaveSuggestionResponse),
    finishWorkout: unaryMethod('/training.v1.TrainingService/FinishWorkout', FinishWorkoutRequest, FinishWorkoutResponse),
    createMesocycle: unaryMethod('/training.v1.TrainingService/CreateMesocycle', CreateMesocycleRequest, CreateMesocycleResponse),
    createTemplateMesocycle: unaryMethod('/training.v1.TrainingService/CreateTemplateMesocycle', CreateTemplateMesocycleRequest, CreateTemplateMesocycleResponse),
    createExercise: unaryMethod('/training.v1.TrainingService/CreateExercise', CreateExerciseRequest, CreateExerciseResponse),
    updateExerciseName: unaryMethod('/training.v1.TrainingService/UpdateExerciseName', UpdateExerciseNameRequest, UpdateExerciseNameResponse),
    updateExerciseCoefficients: unaryMethod('/training.v1.TrainingService/UpdateExerciseCoefficients', UpdateExerciseCoefficientsRequest, UpdateExerciseCoefficientsResponse)
} as const;

const TrainingServiceClient = makeGenericClientConstructor(trainingServiceDefinition, 'training.v1.TrainingService') as unknown as {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): GeneratedTrainingServiceClient;
};

type MessageCodec<T> = {
    encode: (message: T) => {finish: () => Uint8Array};
    decode: (input: Uint8Array) => T;
};

function unaryMethod<TRequest, TResponse>(path: string, request: MessageCodec<TRequest>, response: MessageCodec<TResponse>) {
    return {
        path,
        requestStream: false,
        responseStream: false,
        requestSerialize: (value: TRequest) => Buffer.from(request.encode(value).finish()),
        requestDeserialize: (value: Buffer) => request.decode(value),
        responseSerialize: (value: TResponse) => Buffer.from(response.encode(value).finish()),
        responseDeserialize: (value: Buffer) => response.decode(value)
    };
}

export const getTrainingCatalogFromGrpc = async (): Promise<Result<TrainingCatalog, TrainingBackendError>> => {
    const result = await callGrpc<GrpcTrainingCatalogResponse>((client, callback) => client.getTrainingCatalog({}, callback));
    return result.map(mapCatalog);
};

export const getTodayWorkoutFromGrpc = async (): Promise<Result<TodayWorkout, TrainingBackendError>> => {
    const result = await callGrpc<GrpcTodayWorkoutResponse>((client, callback) => client.getTodayWorkout({}, callback));
    return result.map(mapTodayWorkout);
};

export const logSetViaGrpc = async (input: SaveLoggedSetInput): Promise<Result<LoggedSet, TrainingBackendError>> => {
    const result = await callGrpc((client, callback) => client.logSet(toGrpcLogSet(input), callback));
    if (result.isErr()) return err(result.error);

    return ok({
        setIndex: input.setIndex,
        loadText: input.loadText,
        reps: input.reps,
        notes: input.notes,
        pain: input.pain
    });
};

export const saveExerciseFeedbackViaGrpc = (input: SaveExerciseFeedbackInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.saveExerciseFeedback(toGrpcExerciseFeedback(input), callback));

export const saveMuscleFeedbackViaGrpc = (input: SaveMuscleFeedbackInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.saveMuscleFeedback(toGrpcMuscleFeedback(input), callback));

export const saveSuggestionViaGrpc = (input: SaveSuggestionInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.saveSuggestion(toGrpcSuggestion(input), callback));

export const finishWorkoutViaGrpc = (input: CompleteWorkoutInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.finishWorkout({sessionId: input.sessionId}, callback));

export const createMesocycleViaGrpc = (input: CreateMesocycleInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.createMesocycle(toGrpcCreateMesocycle(input), callback));

export const createTemplateMesocycleViaGrpc = (input: CreateTemplateMesocycleInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.createTemplateMesocycle(input, callback));

export const createExerciseViaGrpc = (input: CreateExerciseInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.createExercise(toGrpcCreateExercise(input), callback));

export const updateExerciseNameViaGrpc = (input: UpdateExerciseNameInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.updateExerciseName({
        exerciseId: input.exerciseId,
        name: input.name
    }, callback));

export const updateExerciseMusclesViaGrpc = (input: UpdateExerciseMusclesInput): Promise<Result<void, TrainingBackendError>> =>
    voidResult((client, callback) => client.updateExerciseCoefficients(toGrpcUpdateExerciseCoefficients(input), callback));

const voidResult = async <TResponse>(
    call: (client: GeneratedTrainingServiceClient, callback: UnaryCallback<TResponse>) => void
): Promise<Result<void, TrainingBackendError>> => {
    const result = await callGrpc((client, callback) => call(client, callback));
    return result.map(() => undefined);
};

const callGrpc = async <TResponse>(
    call: (client: GeneratedTrainingServiceClient, callback: UnaryCallback<TResponse>) => void
): Promise<Result<TResponse, TrainingBackendError>> => {
    const client = getClient();
    try {
        const response = await new Promise<TResponse>((resolve, reject) => {
            call(client, (error, grpcResponse) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(grpcResponse);
            });
        });

        return ok(response);
    } catch (error) {
        return err({
            kind: 'training-backend-error',
            message: error instanceof Error ? error.message : 'Unable to call the training gRPC service.'
        });
    } finally {
        client.close();
    }
};

const getClient = () =>
    new TrainingServiceClient(process.env['TRAINING_GRPC_ADDR'] ?? '127.0.0.1:9000', credentials.createInsecure());

const mapCatalog = (reply: GrpcTrainingCatalogResponse): TrainingCatalog => ({
    muscleGroups: mapMuscleList(reply.muscleGroups ?? []),
    exerciseFamilies: (reply.exerciseFamilies ?? []).map((family) => ({
        id: family.id ?? '',
        name: family.name ?? '',
        category: family.category ?? '',
        coefficients: mapCoefficients(family.coefficients ?? []),
        notes: family.notes && family.notes.length > 0 ? family.notes : undefined
    })),
    exercises: (reply.exercises ?? []).map(mapExercise),
    templateMesocycles: (reply.templateMesocycles ?? []).map((template) => ({
        id: template.id ?? '',
        name: template.name ?? '',
        category: template.category ?? '',
        frequency: template.frequency ?? '',
        gender: template.gender ?? '',
        weeks: template.weeks ?? 0,
        daysPerWeek: template.daysPerWeek ?? 0
    })),
    mesocycles: (reply.mesocycles ?? []).map((mesocycle) => ({
        id: mesocycle.id ?? '',
        name: mesocycle.name ?? '',
        status: mapMesocycleStatus(mesocycle.status),
        weeks: mesocycle.weeks ?? 0,
        daysPerWeek: mesocycle.daysPerWeek ?? 0,
        startedAt: mesocycle.startedAt ?? null,
        completedAt: mesocycle.completedAt ?? null,
        sessionCount: mesocycle.sessionCount ?? 0,
        latestSession: mesocycle.latestSession ?? null,
        sessions: (mesocycle.sessions ?? []).map(mapMesocycleSession)
    }))
});

const mapTodayWorkout = (reply: GrpcTodayWorkoutResponse): TodayWorkout => ({
    id: reply.id ?? '',
    sessionId: reply.sessionId ?? '',
    name: reply.name ?? '',
    date: reply.date ?? null,
    status: mapWorkoutStatus(reply.status),
    exercises: (reply.exercises ?? []).map((exercise) => ({
        id: exercise.id ?? '',
        exerciseId: exercise.exerciseId ?? '',
        name: exercise.name ?? '',
        equipment: toEquipmentType(equipmentStringVal(exercise.equipment)),
        method: mapTrainingMethod(exercise.method),
        programmedSets: exercise.programmedSets ?? 0,
        targetRepRange: exercise.targetRepRange ?? '',
        previousPerformance: exercise.previousPerformance ?? '',
        primaryMuscle: mapMuscle(exercise.primaryMuscle),
        loggedSets: (exercise.loggedSets ?? []).map(mapLoggedSet),
        feedback: exercise.feedback
            ? {painAfter: exercise.feedback.painAfter ?? null, notes: exercise.feedback.notes ?? null}
            : null
    })),
    muscles: mapMuscleList(reply.muscles ?? []),
    volumeFacts: (reply.volumeFacts ?? []).map((fact) => ({
        muscle: mapMuscle(fact.muscle),
        sessionDirectSets: fact.sessionDirectSets ?? 0,
        sessionIndirectSets: fact.sessionIndirectSets ?? 0,
        sessionEffectiveSets: fact.sessionEffectiveSets ?? 0,
        weekToDateDirectSets: fact.weekToDateDirectSets ?? 0,
        weekToDateIndirectSets: fact.weekToDateIndirectSets ?? 0,
        weekToDateEffectiveSets: fact.weekToDateEffectiveSets ?? 0
    })),
    muscleFeedback: (reply.muscleFeedback ?? []).map((feedback) => ({
        muscle: mapMuscle(feedback.muscle),
        soreness: feedback.soreness ?? null,
        pump: feedback.pump ?? null,
        workload: feedback.workload === undefined ? null : mapWorkloadRating(feedback.workload),
        notes: feedback.notes ?? null
    })),
    suggestions: (reply.suggestions ?? []).map((suggestion) => ({
        muscle: mapMuscle(suggestion.muscle),
        suggestion: suggestion.suggestion ?? '',
        status: mapSuggestionStatus(suggestion.status)
    }))
});

const mapExercise = (exercise: GrpcExercise) => {
    const muscleCoefficients = mapCoefficients(exercise.muscleCoefficients ?? []);
    const primaryMuscles = mapMuscleList(exercise.primaryMuscles ?? []);
    const secondaryMuscles = mapMuscleList(exercise.secondaryMuscles ?? []);
    const primaryMuscle = mapMuscle(
        exercise.primaryMuscle ?? primaryMuscles[0] ?? muscleCoefficients.find((coefficient) => coefficient.coefficient === 1)?.muscle
    );

    return {
        id: exercise.id ?? '',
        name: exercise.name ?? '',
        primaryMuscle,
        primaryMuscles,
        secondaryMuscles,
        muscleCoefficients,
        familyId: exercise.familyId === undefined ? null : nonEmptyString(exerciseFamilyCodeStringVal(exercise.familyId)),
        equipment: toEquipmentType(equipmentStringVal(exercise.equipment)),
        history: (exercise.history ?? []).map((entry) => ({
            sessionId: entry.sessionId ?? '',
            label: entry.label ?? '',
            workoutName: entry.workoutName ?? '',
            loadText: entry.loadText ?? '',
            reps: entry.reps ?? 0,
            setIndex: entry.setIndex ?? 0
        }))
    };
};

const mapMesocycleSession = (session: GrpcMesocycleSession): MesocycleSessionSummary => ({
    id: session.id ?? '',
    name: session.name ?? '',
    trainingDate: session.trainingDate ?? null,
    status: mapWorkoutStatus(session.status),
    weekNumber: session.weekNumber ?? null,
    dayNumber: session.dayNumber ?? null,
    source: session.source ?? null,
    notes: session.notes ?? null,
    totalSets: session.totalSets ?? 0,
    exercises: (session.exercises ?? []).map((exercise) => ({
        id: exercise.id ?? '',
        name: exercise.name ?? '',
        equipment: toEquipmentType(equipmentStringVal(exercise.equipment)),
        primaryMuscle: mapMuscle(exercise.primaryMuscle),
        method: mapTrainingMethod(exercise.method),
        targetRepRange: exercise.targetRepRange ?? '',
        sets: (exercise.sets ?? []).map(mapLoggedSet)
    }))
});

const mapLoggedSet = (set: GrpcLoggedSet) => ({
    setIndex: set.setIndex ?? 0,
    loadText: set.loadText ?? '',
    reps: set.reps ?? 0,
    notes: set.notes ?? null,
    pain: set.pain ?? null
});

const mapCoefficients = (coefficients: GrpcExerciseMuscleCoefficient[]): ExerciseMuscleCoefficient[] =>
    coefficients.map((coefficient) => ({
        muscle: mapMuscle(coefficient.muscle),
        coefficient: coefficient.coefficient ?? 0
    }));

const mapMuscleList = (values: number[]): MuscleGroup[] => values.map((value) => mapMuscle(value));

const mapMuscle = (value: number | undefined): MuscleGroup => {
    const stringVal = muscleGroupStringVal(value ?? 0);
    if (stringVal && isMuscleGroup(stringVal)) return stringVal;
    throw new Error(`Unknown muscle group from gRPC service: ${value ?? '<empty>'}`);
};

const mapMesocycleStatus = (value: number): MesoStatus => {
    const stringVal = mesocycleStatusStringVal(value);
    return stringVal === 'planned' || stringVal === 'completed' ? stringVal : 'current';
};

const mapWorkoutStatus = (value: number): TodayWorkout['status'] => {
    const stringVal = workoutStatusStringVal(value);
    return stringVal === 'completed' || stringVal === 'in-progress' ? stringVal : 'planned';
};

const mapTrainingMethod = (value: number) => {
    const stringVal = trainingMethodStringVal(value);
    return stringVal === 'regular' ? 'regular' : 'myo-match';
};

const mapSuggestionStatus = (value: number) => {
    const stringVal = suggestionStatusStringVal(value);
    return stringVal === 'accepted' || stringVal === 'ignored' || stringVal === 'edited' ? stringVal : 'proposed';
};

const mapWorkloadRating = (value: number): WorkloadRating | null => {
    const stringVal = feedbackWorkloadStringVal(value);
    return stringVal === 'too-low' || stringVal === 'good' || stringVal === 'too-high' ? stringVal : null;
};

const nonEmptyString = (value: string) => value.length > 0 ? value : null;

const toGrpcLogSet = (input: SaveLoggedSetInput) => ({
    sessionId: input.sessionId,
    templateExerciseId: input.templateExerciseId,
    setIndex: input.setIndex,
    loadText: input.loadText,
    reps: input.reps,
    notes: input.notes ?? undefined,
    pain: input.pain ?? undefined
});

const toGrpcExerciseFeedback = (input: SaveExerciseFeedbackInput) => ({
    sessionId: input.sessionId,
    templateExerciseId: input.templateExerciseId,
    painAfter: input.painAfter ?? undefined,
    notes: input.notes ?? undefined
});

const toGrpcMuscleFeedback = (input: SaveMuscleFeedbackInput) => ({
    sessionId: input.sessionId,
    muscle: stringToMuscleGroup(input.muscle),
    soreness: input.soreness ?? undefined,
    pump: input.pump ?? undefined,
    workload: input.workload === null ? undefined : stringToFeedbackWorkload(input.workload),
    notes: input.notes ?? undefined
});

const toGrpcSuggestion = (input: SaveSuggestionInput) => ({
    sessionId: input.sessionId,
    muscle: stringToMuscleGroup(input.muscle),
    suggestion: input.suggestion,
    status: stringToSuggestionStatus(input.status)
});

const toGrpcCreateMesocycle = (input: CreateMesocycleInput): CreateMesocycleRequest => ({
    name: input.name,
    weeks: input.weeks,
    daysPerWeek: input.daysPerWeek,
    status: stringToMesocycleStatus(input.status),
    templateMesoId: input.templateMesoId ?? undefined
});

const toGrpcCreateExercise = (input: CreateExerciseInput): CreateExerciseRequest => ({
    name: input.name,
    primaryMuscle: stringToMuscleGroup(input.primaryMuscle ?? input.muscleCoefficients?.find((coefficient) => coefficient.coefficient === 1)?.muscle ?? ''),
    equipment: stringToEquipment(input.equipment.toLowerCase()),
    familyId: input.familyId ? stringToExerciseFamilyCode(input.familyId) : undefined,
    coefficients: toGrpcCoefficients(input.muscleCoefficients ?? [])
});

const toGrpcUpdateExerciseCoefficients = (input: UpdateExerciseMusclesInput): UpdateExerciseCoefficientsRequest => ({
    exerciseId: input.exerciseId,
    familyId: input.familyId ? stringToExerciseFamilyCode(input.familyId) : undefined,
    coefficients: toGrpcCoefficients(input.muscleCoefficients ?? primarySecondaryToCoefficients(input))
});

const primarySecondaryToCoefficients = (input: UpdateExerciseMusclesInput): ExerciseMuscleCoefficientInput[] => {
    const primary = new Set(input.primaryMuscles ?? []);
    const secondary = (input.secondaryMuscles ?? []).filter((muscle) => !primary.has(muscle));

    return [
        ...[...primary].map((muscle) => ({muscle, coefficient: 1 as const})),
        ...secondary.map((muscle) => ({muscle, coefficient: 0.5 as const}))
    ];
};

const toGrpcCoefficients = (coefficients: ExerciseMuscleCoefficientInput[]) =>
    coefficients.map((coefficient) => ({muscle: stringToMuscleGroup(coefficient.muscle), coefficient: coefficient.coefficient}));
