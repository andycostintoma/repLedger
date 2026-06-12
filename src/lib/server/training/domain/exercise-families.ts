import type {EquipmentType} from '$lib/training/equipment';

import type {MuscleCoefficientValue} from './coefficients';
import type {MuscleGroup} from './muscles';

export type ExerciseFamilyCategory = 'lower' | 'pressing' | 'pulling' | 'shoulders' | 'arms' | 'neck';

export type ExerciseFamily = {
    id: string;
    name: string;
    category: ExerciseFamilyCategory;
    coefficients: Partial<Record<MuscleGroup, MuscleCoefficientValue>>;
    notes?: string;
};

export const exerciseFamilies = [
    family('free_squat', 'Free squat', 'lower', {
        quads_vasti: 1,
        glute_max: 0.5,
        adductors: 0.5,
        erector_spinae: 0.5
    }),
    family('supported_squat', 'Supported squat', 'lower', {
        quads_vasti: 1,
        glute_max: 0.5,
        adductors: 0.5
    }),
    family('lunge_quad_focused', 'Lunge quad-focused', 'lower', {
        quads_vasti: 1,
        glute_max: 0.5,
        adductors: 0.5
    }),
    family('lunge_glute_focused', 'Lunge glute-focused', 'lower', {
        glute_max: 1,
        quads_vasti: 0.5,
        adductors: 0.5
    }),
    family('knee_extension', 'Knee extension', 'lower', {
        quads_vasti: 1,
        rectus_femoris: 1
    }),
    family('knee_flexion', 'Knee flexion', 'lower', {
        hamstrings_biarticular: 1,
        biceps_femoris_short_head: 1
    }),
    family('hip_hinge', 'Hip hinge', 'lower', {
        hamstrings_biarticular: 1,
        glute_max: 0.5,
        erector_spinae: 0.5
    }),
    family('hip_hinge_from_floor', 'Hip hinge from floor', 'lower', {
        erector_spinae: 0.5,
        glute_max: 0.5,
        hamstrings_biarticular: 0.5,
        quads_vasti: 0.5
    }),
    family('hip_thrust', 'Hip thrust', 'lower', {
        glute_max: 1
    }),
    family('hip_abduction', 'Hip abduction', 'lower', {
        glute_med_min: 1
    }),
    family('straight_leg_calf_raise', 'Straight-leg calf raise', 'lower', {
        soleus: 1,
        gastrocnemius: 1
    }),
    family('bent_leg_calf_raise', 'Bent-leg calf raise', 'lower', {
        soleus: 1
    }),
    family('loaded_spinal_flexion', 'Loaded spinal flexion', 'lower', {
        abs: 1
    }),
    family('horizontal_press_fixed_path', 'Horizontal press fixed path', 'pressing', {
        chest: 1,
        triceps_lateral_medial: 0.5,
        front_delts: 0.5
    }),
    family('horizontal_press_free_path', 'Horizontal press free path', 'pressing', {
        chest: 1,
        front_delts: 0.5
    }),
    family('chest_fly', 'Chest fly', 'pressing', {
        chest: 1
    }),
    family('vertical_press_fixed_path', 'Vertical press fixed path', 'pressing', {
        front_delts: 1,
        side_delts: 0.5,
        triceps_lateral_medial: 0.5
    }),
    family('elbows_out_vertical_press', 'Elbows-out vertical press', 'pressing', {
        side_delts: 1,
        front_delts: 0.5,
        triceps_lateral_medial: 0.5
    }),
    family('vertical_pull', 'Vertical pull', 'pulling', {
        lats: 1,
        biceps: 0.5,
        upper_back: 0.5
    }),
    family('shoulder_extension_pull', 'Shoulder extension pull', 'pulling', {
        lats: 1,
        triceps_long_head: 0.5
    }),
    family('row', 'Row', 'pulling', {
        upper_back: 1,
        lats: 0.5,
        biceps: 0.5,
        rear_delts: 0.5
    }),
    family('flexion_row', 'Flexion row', 'pulling', {
        erector_spinae: 1,
        upper_back: 0.5,
        lats: 0.5,
        biceps: 0.5
    }),
    family('high_row', 'High row', 'pulling', {
        upper_back: 1,
        rear_delts: 1
    }),
    family('shrug', 'Shrug', 'pulling', {
        upper_traps: 1
    }),
    family('lateral_raise', 'Lateral raise', 'shoulders', {
        side_delts: 1
    }),
    family('rear_delt_fly', 'Rear-delt fly', 'shoulders', {
        rear_delts: 1
    }),
    family('elbow_flexion', 'Elbow flexion', 'arms', {
        biceps: 1
    }),
    family('brachioradialis_curl', 'Brachioradialis curl', 'arms', {
        brachioradialis: 1,
        biceps: 0.5
    }),
    family('overhead_triceps_extension', 'Overhead triceps extension', 'arms', {
        triceps_long_head: 1,
        triceps_lateral_medial: 1
    }),
    family('triceps_pushdown', 'Triceps pushdown', 'arms', {
        triceps_lateral_medial: 1
    }),
    family('wrist_flexion', 'Wrist flexion', 'arms', {
        wrist_flexors: 1
    }),
    family('wrist_extension', 'Wrist extension', 'arms', {
        wrist_extensors: 1
    }),
    family('neck_flexion', 'Neck flexion', 'neck', {
        neck_flexors: 1
    }),
    family('neck_extension', 'Neck extension', 'neck', {
        neck_extensors: 1
    })
] as const satisfies ExerciseFamily[];

export const exerciseFamilyIds = exerciseFamilies.map((family) => family.id);

export type ExerciseFamilyId = (typeof exerciseFamilyIds)[number];

export const isExerciseFamilyId = (value: string): value is ExerciseFamilyId =>
    exerciseFamilyIds.includes(value as ExerciseFamilyId);

export const getExerciseFamily = (familyId: string | null | undefined) =>
    exerciseFamilies.find((family) => family.id === familyId) ?? null;

export const getExerciseFamilyCoefficients = (familyId: string | null | undefined) =>
    getExerciseFamily(familyId)?.coefficients ?? {};

export const suggestExerciseFamilyId = (name: string, equipment?: EquipmentType | string | null): ExerciseFamilyId | null => {
    const normalized = name.toLowerCase();
    const normalizedEquipment = equipment?.toLowerCase() ?? '';

    if (normalized.includes('belt squat') && /rdl|romanian/.test(normalized)) return 'hip_hinge';
    if (normalized.includes('belt squat')) return 'supported_squat';
    if (normalized.includes('pendulum') && /calf|raise/.test(normalized)) return 'straight_leg_calf_raise';
    if (normalized.includes('pendulum')) return 'supported_squat';
    if (normalized.includes('hack squat') || normalized.includes('machine squat')) return 'supported_squat';
    if (normalized.includes('leg press') && /calf|raise/.test(normalized)) return 'straight_leg_calf_raise';
    if (normalized.includes('leg press')) return 'supported_squat';
    if (/glute.*(lunge|split squat|bulgarian)|front.?foot.?elevated|long.?stride/.test(normalized)) return 'lunge_glute_focused';
    if (/lunge|split squat|bulgarian/.test(normalized)) return 'lunge_quad_focused';
    if (/squat/.test(normalized)) return 'free_squat';
    if (normalized.includes('leg extension')) return 'knee_extension';
    if (normalized.includes('sissy') || normalized.includes('reverse nordic')) return 'knee_extension';
    if (/leg curl|hamstring curl|nordic/.test(normalized)) return 'knee_flexion';
    if (/rdl|romanian|good morning/.test(normalized)) return 'hip_hinge';
    if (normalized.includes('deadlift')) return 'hip_hinge_from_floor';
    if (normalized.includes('hip thrust') || normalized.includes('bridge')) return 'hip_thrust';
    if (normalized.includes('abduction')) return 'hip_abduction';
    if (/seated.*calf|bent.*calf/.test(normalized)) return 'bent_leg_calf_raise';
    if (/calf|calves/.test(normalized)) return 'straight_leg_calf_raise';
    if (/crunch|sit ?up|leg raise|knee raise/.test(normalized)) return 'loaded_spinal_flexion';
    if (/pullover|lat prayer|straight.?arm/.test(normalized)) return 'shoulder_extension_pull';
    if (/pull.?up|pulldown|chin.?up/.test(normalized)) return 'vertical_pull';
    if (/face ?pull|high row|rear.?delt row/.test(normalized)) return 'high_row';
    if (/flexion row/.test(normalized)) return 'flexion_row';
    if (/row|t-bar|tbar/.test(normalized)) return 'row';
    if (normalized.includes('shrug')) return 'shrug';
    if (/lateral raise|butterfly raise|upright row/.test(normalized)) return 'lateral_raise';
    if (/rear.?delt|reverse fly/.test(normalized)) return 'rear_delt_fly';
    if (/overhead triceps|oh extension|skull.?over|skull.?crusher/.test(normalized)) return 'overhead_triceps_extension';
    if (/pushdown/.test(normalized)) return 'triceps_pushdown';
    if (/hammer curl|reverse curl/.test(normalized)) return 'brachioradialis_curl';
    if (/preacher/.test(normalized)) return 'elbow_flexion';
    if (/bayesian|incline curl/.test(normalized)) return 'elbow_flexion';
    if (/curl/.test(normalized)) return 'elbow_flexion';
    if (/wrist.*extension/.test(normalized)) return 'wrist_extension';
    if (/wrist/.test(normalized)) return 'wrist_flexion';
    if (/neck.*flex/.test(normalized)) return 'neck_flexion';
    if (/neck.*ext/.test(normalized)) return 'neck_extension';
    if (/flye?|pec deck/.test(normalized)) return 'chest_fly';
    if (/(elbows?.*out|out.*elbows?|frontal plane|frontal-plane|butterfly press)/.test(normalized)) {
        return 'elbows_out_vertical_press';
    }
    if (/overhead press|shoulder press/.test(normalized)) return 'vertical_press_fixed_path';
    if (/bench|press|dip/.test(normalized) && (normalizedEquipment.includes('dumbbell') || normalizedEquipment.includes('cable'))) {
        return 'horizontal_press_free_path';
    }
    if (/bench|press|dip/.test(normalized)) return 'horizontal_press_fixed_path';

    return null;
};

function family(
    id: string,
    name: string,
    category: ExerciseFamilyCategory,
    coefficients: Partial<Record<MuscleGroup, MuscleCoefficientValue>>,
    notes?: string
): ExerciseFamily {
    return {id, name, category, coefficients, notes};
}
