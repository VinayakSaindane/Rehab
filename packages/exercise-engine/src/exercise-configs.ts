/**
 * exercise-configs.ts — Clinical Kinematic Profiles & Threshold Configurations
 *
 * Configurable parameters per exercise (Requirement 12).
 * Each exercise specifies its anatomical angles, minimum ROM, duration boundaries,
 * hysteresis margins, and smoothing factors.
 */

export interface ExerciseKinematicProfile {
  id: string;
  name: string;
  primaryJoint: string;
  /** Anatomical resting / start angle in degrees */
  startAngle: number;
  /** Default target ROM in degrees */
  defaultTargetAngle: number;
  /** Return angle boundary where arm/leg returns to resting posture */
  returnAngle: number;
  /** Minimum range of motion in degrees required to count as a repetition */
  minRomDegrees: number;
  /** Hysteresis buffer in degrees preventing state boundary chatter */
  hysteresisBuffer: number;
  /** True if decreasing angle represents concentric movement (e.g. elbow 160 -> 120) */
  isAngleDecreasingOnFlex: boolean;
  /** Clinical target tolerance for marking repetition as valid */
  romToleranceDegrees: number;
  /** Minimum repetition duration in milliseconds (rejects twitch/jitter < ~0.5s) */
  minRepDurationMs: number;
  /** Maximum repetition duration in milliseconds before timing out */
  maxRepDurationMs: number;
  /** Minimum dwell time in target zone in milliseconds (rejects 1-frame spikes) */
  minTargetDwellMs: number;
  /** Mandatory refractory cooldown in milliseconds after repetition completion */
  cooldownMs: number;
  /** Number of consecutive stable frames required in start position to establish READY */
  readyFramesRequired: number;
  /** Smoothing filter alpha factor (0.1 to 0.8) */
  smoothingAlpha: number;
  /** Minimum landmark visibility threshold */
  confidenceThreshold: number;
}

export const EXERCISE_CONFIGS: Record<string, ExerciseKinematicProfile> = {
  'elbow-flexion': {
    id: 'elbow-flexion',
    name: 'Elbow Flexion & Extension',
    primaryJoint: 'Elbow',
    startAngle: 155,
    defaultTargetAngle: 120,
    returnAngle: 145,
    minRomDegrees: 28, // Arm must flex by at least 28° to qualify as a rep
    hysteresisBuffer: 8,
    isAngleDecreasingOnFlex: true,
    romToleranceDegrees: 8,
    minRepDurationMs: 600, // At least 0.6 seconds
    maxRepDurationMs: 8000,
    minTargetDwellMs: 80,
    cooldownMs: 500,
    readyFramesRequired: 4,
    smoothingAlpha: 0.35,
    confidenceThreshold: 0.70
  },

  'knee-extension': {
    id: 'knee-extension',
    name: 'Seated Knee Extension (Quad Sets)',
    primaryJoint: 'Knee',
    startAngle: 95,
    defaultTargetAngle: 170,
    returnAngle: 115,
    minRomDegrees: 38, // Knee must extend by at least 38°
    hysteresisBuffer: 8,
    isAngleDecreasingOnFlex: false,
    romToleranceDegrees: 8,
    minRepDurationMs: 700,
    maxRepDurationMs: 8000,
    minTargetDwellMs: 100,
    cooldownMs: 600,
    readyFramesRequired: 4,
    smoothingAlpha: 0.35,
    confidenceThreshold: 0.70
  },

  'shoulder-flexion': {
    id: 'shoulder-flexion',
    name: 'Shoulder Flexion (Elevations)',
    primaryJoint: 'Shoulder',
    startAngle: 30,
    defaultTargetAngle: 135,
    returnAngle: 50,
    minRomDegrees: 45, // Arm must elevate by at least 45°
    hysteresisBuffer: 10,
    isAngleDecreasingOnFlex: false,
    romToleranceDegrees: 10,
    minRepDurationMs: 800,
    maxRepDurationMs: 9000,
    minTargetDwellMs: 120,
    cooldownMs: 600,
    readyFramesRequired: 4,
    smoothingAlpha: 0.35,
    confidenceThreshold: 0.70
  },

  'shoulder-abduction': {
    id: 'shoulder-abduction',
    name: 'Shoulder Abduction (Lateral Raise)',
    primaryJoint: 'Shoulder',
    startAngle: 20,
    defaultTargetAngle: 90,
    returnAngle: 35,
    minRomDegrees: 35, // Arm must abduct by at least 35°
    hysteresisBuffer: 8,
    isAngleDecreasingOnFlex: false,
    romToleranceDegrees: 8,
    minRepDurationMs: 800,
    maxRepDurationMs: 9000,
    minTargetDwellMs: 100,
    cooldownMs: 600,
    readyFramesRequired: 4,
    smoothingAlpha: 0.35,
    confidenceThreshold: 0.70
  },

  'sit-to-stand': {
    id: 'sit-to-stand',
    name: 'Sit-to-Stand Functional Transfer',
    primaryJoint: 'Knee & Hip',
    startAngle: 90,
    defaultTargetAngle: 165,
    returnAngle: 110,
    minRomDegrees: 45, // Full sit-to-stand requires at least 45° knee extension
    hysteresisBuffer: 10,
    isAngleDecreasingOnFlex: false,
    romToleranceDegrees: 10,
    minRepDurationMs: 900,
    maxRepDurationMs: 10000,
    minTargetDwellMs: 150,
    cooldownMs: 800,
    readyFramesRequired: 5,
    smoothingAlpha: 0.35,
    confidenceThreshold: 0.70
  }
};

/**
 * Retrieve configuration profile for a specific exercise, allowing clinician overrides.
 */
export function getExerciseConfig(
  exerciseId: string,
  prescribedTargetRom?: number
): ExerciseKinematicProfile {
  // B3: Throw on unknown ID — silent elbow-flexion fallback caused wrong isAngleDecreasingOnFlex
  //     for knee/shoulder exercises, inverting the entire state machine.
  if (!EXERCISE_CONFIGS[exerciseId]) {
    throw new Error(`[ExerciseEngine] Unknown exerciseId: "${exerciseId}". Did you mean one of: ${Object.keys(EXERCISE_CONFIGS).join(', ')}?`);
  }
  const profile = EXERCISE_CONFIGS[exerciseId];
  if (prescribedTargetRom !== undefined && !isNaN(prescribedTargetRom)) {
    return {
      ...profile,
      defaultTargetAngle: prescribedTargetRom
    };
  }
  return { ...profile };
}
