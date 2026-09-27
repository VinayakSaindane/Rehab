import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from './angle-calculator';

/**
 * template-deriver.ts — Auto-derives exercise tracking parameters from a
 * therapist's recorded demonstration clip.
 *
 * Given a sequence of landmark frames sampled from the recording, this module:
 * 1. Tries each candidate joint triplet defined in angle-calculator.ts.
 * 2. Computes the angular range (max - min) across all frames for each triplet.
 * 3. Selects the triplet with the highest angular range as the PRIMARY tracked joint.
 * 4. Derives: target_rom (min achieved angle / peak flexion), rest_angle (max angle /
 *    rest position), hysteresis_buffer (10% of range), and estimated rep count.
 *
 * ZERO raw video is involved — only the numeric 33-point landmark arrays sampled
 * at ~10fps from the client-side MediaPipe run are passed here. Consistent with
 * the existing zero-raw-video architecture.
 */

/** Candidate joint triplet definition */
export interface JointTriplet {
  name: string;               // Human-readable name
  landmarkNames: [string, string, string];  // [A, vertex, C] landmark names
  indices: [number, number, number];        // Corresponding MediaPipe indices
  isAngleDecreasingOnFlex: boolean;         // Anatomical direction
}

/** The auto-derived parameters for the exercise state machine */
export interface DerivedExerciseTemplate {
  /** Which joint triplet was selected */
  detectedJoint: JointTriplet;
  /** Peak flexion/extension reached during recording (the "target") */
  target_rom: number;
  /** Resting angle at start/end of movement (the "rest" state) */
  rest_angle: number;
  /** Recommended hysteresis buffer (10% of total range, min 5°) */
  hysteresis_buffer: number;
  /** Angular range: rest_angle - target_rom (for decreasing) or target_rom - rest_angle */
  angular_range: number;
  /** Estimated rep count (number of full cycles detected in the recording) */
  estimated_reps: number;
  /** Confidence score: how clearly the primary joint dominates over others [0–1] */
  derivation_confidence: number;
  /** Summary of all candidate triplet ranges (for debugging/display) */
  candidateAnalysis: Array<{ triplet: JointTriplet; angularRange: number; minAngle: number; maxAngle: number }>;
}

// ─── Candidate Triplets ────────────────────────────────────────────────────
// The same triplets used in the production exercises, plus wrist/hip extras.
export const CANDIDATE_TRIPLETS: JointTriplet[] = [
  {
    name: 'Elbow Flexion/Extension',
    landmarkNames: ['left_shoulder', 'left_elbow', 'left_wrist'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_elbow'],
      MEDIAPIPE_LANDMARK_INDEX['left_wrist']
    ],
    isAngleDecreasingOnFlex: true
  },
  {
    name: 'Shoulder Flexion/Abduction',
    landmarkNames: ['left_hip', 'left_shoulder', 'left_elbow'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_elbow']
    ],
    isAngleDecreasingOnFlex: false
  },
  {
    name: 'Knee Extension (Sit-to-Stand)',
    landmarkNames: ['left_hip', 'left_knee', 'left_ankle'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_knee'],
      MEDIAPIPE_LANDMARK_INDEX['left_ankle']
    ],
    isAngleDecreasingOnFlex: false
  },
  {
    name: 'Hip Flexion',
    landmarkNames: ['left_shoulder', 'left_hip', 'left_knee'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_knee']
    ],
    isAngleDecreasingOnFlex: true
  },
  {
    name: 'Wrist Extension',
    landmarkNames: ['left_elbow', 'left_wrist', 'left_index'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_elbow'],
      MEDIAPIPE_LANDMARK_INDEX['left_wrist'],
      MEDIAPIPE_LANDMARK_INDEX['left_index']
    ],
    isAngleDecreasingOnFlex: false
  }
];

/**
 * Compute the joint angle for a given triplet on a single landmark frame.
 * Returns 0 if any required landmark is missing.
 */
function computeAngle(landmarks: Point2D[], triplet: JointTriplet): number {
  const [idxA, idxB, idxC] = triplet.indices;
  if (!landmarks[idxA] || !landmarks[idxB] || !landmarks[idxC]) return 0;
  return calculateJointAngle(landmarks[idxA], landmarks[idxB], landmarks[idxC]);
}

/**
 * Estimate the number of complete reps in an angle sequence using a simple
 * zero-crossing / peak-detection approach.
 *
 * Looks for transitions from > (midpoint + threshold) to < (midpoint - threshold)
 * and back, where midpoint = (max + min) / 2.
 */
function estimateReps(angles: number[], minAngle: number, maxAngle: number): number {
  if (angles.length < 4) return 0;
  const midpoint = (minAngle + maxAngle) / 2;
  const threshold = (maxAngle - minAngle) * 0.15; // 15% of range as debounce threshold

  let reps = 0;
  let wasAboveMid = angles[0] > midpoint;
  let crossedBelow = false;

  for (let i = 1; i < angles.length; i++) {
    const isAboveMid = angles[i] > midpoint + threshold;
    const isBelowMid = angles[i] < midpoint - threshold;

    if (wasAboveMid && isBelowMid) {
      crossedBelow = true;
      wasAboveMid = false;
    } else if (!wasAboveMid && crossedBelow && isAboveMid) {
      reps++;
      wasAboveMid = true;
      crossedBelow = false;
    }
  }

  return reps;
}

/**
 * Main derivation function.
 *
 * @param landmarkFrames  Array of 33-point landmark arrays sampled from the recording (~10fps)
 * @returns DerivedExerciseTemplate with all state-machine parameters auto-filled
 */
export function deriveExerciseTemplate(landmarkFrames: Point2D[][]): DerivedExerciseTemplate {
  if (!landmarkFrames || landmarkFrames.length < 5) {
    // Not enough frames — return a sensible default for elbow flexion
    return buildDefaultTemplate();
  }

  // ── Step 1: Compute angle sequence for every candidate triplet ────────────
  const candidateAnalysis = CANDIDATE_TRIPLETS.map(triplet => {
    const angles = landmarkFrames.map(frame => computeAngle(frame, triplet)).filter(a => a > 0);

    if (angles.length < 3) {
      return { triplet, angularRange: 0, minAngle: 0, maxAngle: 0 };
    }

    // Smooth with a simple 3-frame moving average to suppress noise
    const smoothed: number[] = [];
    for (let i = 0; i < angles.length; i++) {
      const start = Math.max(0, i - 1);
      const end = Math.min(angles.length - 1, i + 1);
      const avg = angles.slice(start, end + 1).reduce((s, v) => s + v, 0) / (end - start + 1);
      smoothed.push(avg);
    }

    const minAngle = Math.min(...smoothed);
    const maxAngle = Math.max(...smoothed);
    const angularRange = maxAngle - minAngle;

    return { triplet, angularRange, minAngle, maxAngle };
  });

  // ── Step 2: Select the winner — highest angular range ─────────────────────
  const sorted = [...candidateAnalysis].sort((a, b) => b.angularRange - a.angularRange);
  const winner = sorted[0];

  if (winner.angularRange < 5) {
    // All ranges < 5° — the recording likely captured only static posture, not a rep
    return buildDefaultTemplate();
  }

  // ── Step 3: Derive state machine parameters ────────────────────────────────
  const { triplet, minAngle, maxAngle, angularRange } = winner;

  let target_rom: number;
  let rest_angle: number;

  if (triplet.isAngleDecreasingOnFlex) {
    // For elbow flexion: peak flexion = smallest angle = target_rom
    // resting = largest angle
    target_rom = Math.round(minAngle);
    rest_angle = Math.round(maxAngle);
  } else {
    // For shoulder elevation / knee extension: peak = largest angle = target_rom
    // resting = smallest angle
    target_rom = Math.round(maxAngle);
    rest_angle = Math.round(minAngle);
  }

  const hysteresis_buffer = Math.max(5, Math.round(angularRange * 0.10));

  // ── Step 4: Estimate rep count from angle sequence ─────────────────────────
  const winnerAngles = landmarkFrames
    .map(frame => computeAngle(frame, triplet))
    .filter(a => a > 0);
  const estimated_reps = estimateReps(winnerAngles, minAngle, maxAngle);

  // ── Step 5: Derivation confidence — how dominant the winner is ────────────
  const secondRange = sorted[1]?.angularRange ?? 0;
  const derivation_confidence = secondRange > 0
    ? Math.min(1, Math.round((winner.angularRange / (winner.angularRange + secondRange)) * 100) / 100)
    : 1.0;

  return {
    detectedJoint: triplet,
    target_rom,
    rest_angle,
    hysteresis_buffer,
    angular_range: Math.round(angularRange),
    estimated_reps,
    derivation_confidence,
    candidateAnalysis: sorted
  };
}

/** Sensible fallback when the recording is too short or all angles are 0. */
function buildDefaultTemplate(): DerivedExerciseTemplate {
  return {
    detectedJoint: CANDIDATE_TRIPLETS[0],  // Elbow flexion
    target_rom: 120,
    rest_angle: 155,
    hysteresis_buffer: 8,
    angular_range: 35,
    estimated_reps: 0,
    derivation_confidence: 0,
    candidateAnalysis: []
  };
}
