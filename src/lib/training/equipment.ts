export const equipmentTypes = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight/loadable'] as const;

export type EquipmentType = (typeof equipmentTypes)[number];

const equipmentAliases: Record<string, EquipmentType> = {
  barbell: 'Barbell',
  'trap bar': 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  'belt squat': 'Machine',
  bodyweight: 'Bodyweight/loadable',
  'bodyweight/loadable': 'Bodyweight/loadable'
};

export const toEquipmentType = (value: string): EquipmentType => {
  const normalized = value.trim().toLowerCase();

  return equipmentAliases[normalized] ?? 'Machine';
};

export const isEquipmentType = (value: string): value is EquipmentType =>
  equipmentTypes.includes(value as EquipmentType);

export const isBodyweightLoadableEquipment = (value: string) => value === 'Bodyweight/loadable';

export const formatBodyweightLoad = (bodyweight: string, addedWeight: string) => `BW ${bodyweight} + ${addedWeight}`;

export const parseBodyweightLoad = (loadText: string) => {
  const normalized = loadText.trim();

  const canonicalMatch = normalized.match(/^bw\s*([0-9]+(?:\.[0-9]+)?)\s*\+\s*([0-9]+(?:\.[0-9]+)?)$/i);
  if (canonicalMatch) {
    return {
      bodyweight: canonicalMatch[1],
      addedWeight: canonicalMatch[2]
    };
  }

  if (/^bodyweight$/i.test(normalized)) {
    return {
      bodyweight: '',
      addedWeight: '0'
    };
  }

  if (/^[0-9]+(?:\.[0-9]+)?$/.test(normalized)) {
    return {
      bodyweight: '',
      addedWeight: normalized
    };
  }

  return null;
};
