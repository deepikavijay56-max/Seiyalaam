/**
 * classifier.ts – device class determination from checklist answers
 *
 * Device classes:
 *  A – Fully working
 *  B – Partly working
 *  C – Repairable fault
 *  D – Salvage only
 *  E – Unsafe / recycle only  (any safety flag forces E)
 *
 * Safety questions: swollen_battery, burn_marks, mains_caps
 * Any "yes" to a safety question → class E immediately.
 *
 * Label results "Based on your answers" – never claim app tested hardware.
 */

export type DeviceClass = 'A' | 'B' | 'C' | 'D' | 'E';

export interface ChecklistAnswers {
  powers_on: boolean;
  main_function: boolean;
  physical_damage: boolean;
  swollen_battery: boolean;   // safety flag
  burn_marks: boolean;        // safety flag
  mains_caps: boolean;        // safety flag
}

/** Any of these keys being true forces class E */
export const SAFETY_KEYS: (keyof ChecklistAnswers)[] = [
  'swollen_battery',
  'burn_marks',
  'mains_caps',
];

/**
 * Classify a device based on checklist answers.
 * Pure function – no side effects.
 *
 * @param answers - Record of question id → boolean answer
 * @returns DeviceClass  A | B | C | D | E
 */
export function classifyDevice(answers: Partial<ChecklistAnswers>): DeviceClass {
  // Safety check first – any safety flag → E
  for (const key of SAFETY_KEYS) {
    if (answers[key] === true) return 'E';
  }

  const powersOn      = answers.powers_on     === true;
  const mainFunction  = answers.main_function  === true;
  const physicalDamage = answers.physical_damage === true;

  if (powersOn && mainFunction && !physicalDamage) return 'A';  // Fully working
  if (powersOn && mainFunction && physicalDamage)  return 'B';  // Partly working
  if (powersOn && !mainFunction)                   return 'C';  // Repairable fault
  if (!powersOn && !physicalDamage)                return 'D';  // Salvage only
  return 'D';                                                    // Default: salvage
}

/** Human-readable class labels */
export const CLASS_LABELS: Record<DeviceClass, string> = {
  A: 'Fully Working',
  B: 'Partly Working',
  C: 'Repairable Fault',
  D: 'Salvage Only',
  E: 'Unsafe – Recycle Only',
};

/** Short descriptions for each class */
export const CLASS_DESCRIPTIONS: Record<DeviceClass, string> = {
  A: 'Based on your answers, this device is fully functional and can be used as-is or donated.',
  B: 'Based on your answers, this device partly works. It can be salvaged or repaired.',
  C: 'Based on your answers, this device has a repairable fault. Some parts are still salvageable.',
  D: 'Based on your answers, this device should be salvaged for parts only.',
  E: 'Based on your answers, this device is unsafe. Please do not attempt to open or use it. Take it to an authorised e-waste recycler.',
};

/** Whether a device class is safe to tear down */
export function isSafeTeardown(deviceClass: DeviceClass): boolean {
  return deviceClass !== 'E';
}

/** Whether a device can be posted as a community listing */
export function isSafeListing(deviceClass: DeviceClass): boolean {
  return deviceClass !== 'E';
}
