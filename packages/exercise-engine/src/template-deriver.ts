import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from './angle-calculator';

/**
 * template-deriver.ts — Robust AI Exercise Recognition & Parameter Derivation
 *
 * Given a sequence of landmark frames sampled from a clinician/patient demonstration,
 * this module:
 * 1. Evaluates bi-lateral candidate joint triplets (left and right arms/legs).
 * 2. Enforces strict landmark visibility gating (rejects occluded/hallucinated landmarks).
 * 3. Analyzes endpoint kinetic spatial displacement to confirm genuine limb movement
 *    (preventing stationary or occluded hips/knees from masquerading as hip exercises).
 * 4. Runs bidirectional Schmitt-trigger repetition detection across smoothed waveforms.
 * 5. Computes a multi-factor kinematic score to accurately classify the active joint.
 * 6. Derives robust calibrated thresholds: target_rom, rest_angle, and hysteresis_buffer.
 *
 * ZERO raw video is involved — only numeric 33-point coordinates are processed,
 * preserving complete privacy by design.
 */

/** Candidate joint triplet definition */
export interface JointTriplet {
  id?: string;
  name: string;                               // Clinical display name e.g. "Elbow Flexion & Extension"
  targetJoint: 'Elbow' | 'Shoulder' | 'Knee' | 'Hip' | 'Wrist' | string;
  side: 'left' | 'right' | 'bilateral';
  landmarkNames: [string, string, string];   // [A, vertex, C] landmark names
  indices: [number, number, number];        // Corresponding MediaPipe indices
  isAngleDecreasingOnFlex: boolean;         // Anatomical direction
  endpointIndex: number;                     // Distal moving landmark index (wrist for elbow, ankle for knee)
  vertexIndex: number;                       // Joint vertex index (elbow, shoulder, knee, etc.)
}

/** Analysis details for a single candidate triplet */
export interface CandidateAnalysisItem {
  triplet: JointTriplet;
  angularRange: number;
  minAngle: number;
  maxAngle: number;
  estimatedReps: number;
  visibilityCoverage: number;
  kineticDisplacement: number;
  score: number;
}

/** The auto-derived parameters for the exercise state machine */
export interface DerivedExerciseTemplate {
  /** Which joint triplet was selected */
  detectedJoint: JointTriplet;
  /** Peak flexion/extension reached during recording (the calibrated target) */
  target_rom: number;
  /** Resting angle at start/end of movement */
  rest_angle: number;
  /** Recommended hysteresis buffer (10% of total range, min 5°, max 15°) */
  hysteresis_buffer: number;
  /** Angular range (degrees) */
  angular_range: number;
  /** Estimated rep count detected in the demonstration */
  estimated_reps: number;
  /** Confidence score: how clearly the primary joint dominates over others [0–1] */
  derivation_confidence: number;
  /** Active side detected: 'left' | 'right' */
  detected_side: 'left' | 'right' | 'bilateral';
  /** Summary of all candidate triplet ranges and scores */
  candidateAnalysis: CandidateAnalysisItem[];
}

// ─── Bi-lateral Candidate Triplets ───────────────────────────────────────────
export const CANDIDATE_TRIPLETS: JointTriplet[] = [
  // ── Elbow Flexion & Extension (Right Arm) ──
  {
    id: 'elbow_right',
    name: 'Elbow Flexion & Extension',
    targetJoint: 'Elbow',
    side: 'right',
    landmarkNames: ['right_shoulder', 'right_elbow', 'right_wrist'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['right_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['right_elbow'],
      MEDIAPIPE_LANDMARK_INDEX['right_wrist']
    ],
    isAngleDecreasingOnFlex: true,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['right_wrist'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['right_elbow']
  },

  // ── Elbow Flexion & Extension (Left Arm) ──
  {
    id: 'elbow_left',
    name: 'Elbow Flexion & Extension',
    targetJoint: 'Elbow',
    side: 'left',
    landmarkNames: ['left_shoulder', 'left_elbow', 'left_wrist'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_elbow'],
      MEDIAPIPE_LANDMARK_INDEX['left_wrist']
    ],
    isAngleDecreasingOnFlex: true,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['left_wrist'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['left_elbow']
  },

  // ── Shoulder Flexion (Right Arm Elevations) ──
  {
    id: 'shoulder_flex_right',
    name: 'Shoulder Flexion (Elevations)',
    targetJoint: 'Shoulder',
    side: 'right',
    landmarkNames: ['right_hip', 'right_shoulder', 'right_elbow'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['right_hip'],
      MEDIAPIPE_LANDMARK_INDEX['right_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['right_elbow']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['right_elbow'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['right_shoulder']
  },

  // ── Shoulder Flexion (Left Arm Elevations) ──
  {
    id: 'shoulder_flex_left',
    name: 'Shoulder Flexion (Elevations)',
    targetJoint: 'Shoulder',
    side: 'left',
    landmarkNames: ['left_hip', 'left_shoulder', 'left_elbow'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_elbow']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['left_elbow'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['left_shoulder']
  },

  // ── Shoulder Abduction (Right Arm Lateral Raise) ──
  {
    id: 'shoulder_abd_right',
    name: 'Shoulder Abduction (Lateral Raise)',
    targetJoint: 'Shoulder',
    side: 'right',
    landmarkNames: ['right_hip', 'right_shoulder', 'right_elbow'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['right_hip'],
      MEDIAPIPE_LANDMARK_INDEX['right_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['right_elbow']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['right_elbow'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['right_shoulder']
  },

  // ── Shoulder Abduction (Left Arm Lateral Raise) ──
  {
    id: 'shoulder_abd_left',
    name: 'Shoulder Abduction (Lateral Raise)',
    targetJoint: 'Shoulder',
    side: 'left',
    landmarkNames: ['left_hip', 'left_shoulder', 'left_elbow'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_elbow']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['left_elbow'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['left_shoulder']
  },

  // ── Seated Knee Extension (Right Quad Sets) ──
  {
    id: 'knee_ext_right',
    name: 'Seated Knee Extension (Quad Sets)',
    targetJoint: 'Knee',
    side: 'right',
    landmarkNames: ['right_hip', 'right_knee', 'right_ankle'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['right_hip'],
      MEDIAPIPE_LANDMARK_INDEX['right_knee'],
      MEDIAPIPE_LANDMARK_INDEX['right_ankle']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['right_ankle'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['right_knee']
  },

  // ── Seated Knee Extension (Left Quad Sets) ──
  {
    id: 'knee_ext_left',
    name: 'Seated Knee Extension (Quad Sets)',
    targetJoint: 'Knee',
    side: 'left',
    landmarkNames: ['left_hip', 'left_knee', 'left_ankle'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_knee'],
      MEDIAPIPE_LANDMARK_INDEX['left_ankle']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['left_ankle'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['left_knee']
  },

  // ── Hip Flexion (Right Hip) ──
  {
    id: 'hip_right',
    name: 'Hip Flexion',
    targetJoint: 'Hip',
    side: 'right',
    landmarkNames: ['right_shoulder', 'right_hip', 'right_knee'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['right_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['right_hip'],
      MEDIAPIPE_LANDMARK_INDEX['right_knee']
    ],
    isAngleDecreasingOnFlex: true,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['right_knee'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['right_hip']
  },

  // ── Hip Flexion (Left Hip) ──
  {
    id: 'hip_left',
    name: 'Hip Flexion',
    targetJoint: 'Hip',
    side: 'left',
    landmarkNames: ['left_shoulder', 'left_hip', 'left_knee'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_knee']
    ],
    isAngleDecreasingOnFlex: true,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['left_knee'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['left_hip']
  },

  // ── Wrist Extension (Right) ──
  {
    id: 'wrist_right',
    name: 'Wrist Extension',
    targetJoint: 'Wrist',
    side: 'right',
    landmarkNames: ['right_elbow', 'right_wrist', 'right_index'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['right_elbow'],
      MEDIAPIPE_LANDMARK_INDEX['right_wrist'],
      MEDIAPIPE_LANDMARK_INDEX['right_index']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['right_index'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['right_wrist']
  },

  // ── Wrist Extension (Left) ──
  {
    id: 'wrist_left',
    name: 'Wrist Extension',
    targetJoint: 'Wrist',
    side: 'left',
    landmarkNames: ['left_elbow', 'left_wrist', 'left_index'],
    indices: [
      MEDIAPIPE_LANDMARK_INDEX['left_elbow'],
      MEDIAPIPE_LANDMARK_INDEX['left_wrist'],
      MEDIAPIPE_LANDMARK_INDEX['left_index']
    ],
    isAngleDecreasingOnFlex: false,
    endpointIndex: MEDIAPIPE_LANDMARK_INDEX['left_index'],
    vertexIndex: MEDIAPIPE_LANDMARK_INDEX['left_wrist']
  }
];

/**
 * Computes the joint angle for a single landmark frame with strict visibility gating.
 * Returns null if any landmark in the triplet has low confidence or is occluded.
 */
function computeValidAngle(landmarks: Point2D[], triplet: JointTriplet): number | null {
  const [idxA, idxB, idxC] = triplet.indices;
  const pA = landmarks[idxA];
  const pB = landmarks[idxB];
  const pC = landmarks[idxC];
  if (!pA || !pB || !pC) return null;

  // Visibility threshold: reject occluded or hallucinated landmarks (especially out-of-frame knees/hips)
  const MIN_VISIBILITY = 0.45;
  if (pA.visibility !== undefined && pA.visibility < MIN_VISIBILITY) return null;
  if (pB.visibility !== undefined && pB.visibility < MIN_VISIBILITY) return null;
  if (pC.visibility !== undefined && pC.visibility < MIN_VISIBILITY) return null;

  const angle = calculateJointAngle(pA, pB, pC);
  return (angle > 0 && !isNaN(angle)) ? angle : null;
}

/**
 * Calculates spatial path / kinetic displacement of the moving extremity landmark
 * across valid frames. Genuine limb movement produces significant displacement (0.15–0.50),
 * while stationary limbs or occluded sensor noise produce very low spatial displacement.
 */
function computeEndpointDisplacement(frames: Point2D[][], endpointIndex: number): number {
  const validPoints = frames
    .map(f => f[endpointIndex])
    .filter(p => p && (p.visibility === undefined || p.visibility >= 0.45));

  if (validPoints.length < 4) return 0;

  const xs = validPoints.map(p => p.x);
  const ys = validPoints.map(p => p.y);
  const dx = Math.max(...xs) - Math.min(...xs);
  const dy = Math.max(...ys) - Math.min(...ys);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Robustly estimates cyclic repetitions across both flexion (start extended)
 * and extension (start flexed) movements using hysteresis zone crossings.
 */
export function estimateReps(angles: number[], minAngle: number, maxAngle: number): number {
  if (angles.length < 6) return 0;
  const range = maxAngle - minAngle;
  if (range < 12) return 0;

  const midpoint = (minAngle + maxAngle) / 2;
  const threshold = range * 0.18; // 18% debounce threshold
  const upperZone = midpoint + threshold;
  const lowerZone = midpoint - threshold;

  let reps = 0;
  let zone: 'UPPER' | 'LOWER' | 'MIDDLE' =
    angles[0] >= upperZone ? 'UPPER' : angles[0] <= lowerZone ? 'LOWER' : 'MIDDLE';
  let hasVisitedOpposite = false;

  for (let i = 1; i < angles.length; i++) {
    const a = angles[i];
    if (zone === 'UPPER') {
      if (a <= lowerZone) {
        zone = 'LOWER';
        if (hasVisitedOpposite) {
          reps++;
          hasVisitedOpposite = false;
        } else {
          hasVisitedOpposite = true;
        }
      }
    } else if (zone === 'LOWER') {
      if (a >= upperZone) {
        zone = 'UPPER';
        if (hasVisitedOpposite) {
          reps++;
          hasVisitedOpposite = false;
        } else {
          hasVisitedOpposite = true;
        }
      }
    } else {
      // Transition from middle
      if (a >= upperZone) {
        zone = 'UPPER';
      } else if (a <= lowerZone) {
        zone = 'LOWER';
      }
    }
  }

  return reps;
}

/**
 * Calculates robust minimum and maximum angles using outlier-rejection percentiles.
 */
function getRobustAngles(angles: number[]): { minAngle: number; maxAngle: number; angularRange: number } {
  if (angles.length === 0) return { minAngle: 0, maxAngle: 0, angularRange: 0 };
  if (angles.length < 6) {
    const min = Math.min(...angles);
    const max = Math.max(...angles);
    return { minAngle: Math.round(min), maxAngle: Math.round(max), angularRange: Math.round(max - min) };
  }
  const sorted = [...angles].sort((a, b) => a - b);
  // 5th and 95th percentiles to reject rogue 1-frame spikes/glitches
  const p05 = sorted[Math.floor(sorted.length * 0.05)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return {
    minAngle: Math.round(p05),
    maxAngle: Math.round(p95),
    angularRange: Math.max(0, Math.round(p95 - p05))
  };
}

/**
 * Main derivation function: Auto-detects the active joint and derives tracking parameters.
 *
 * @param landmarkFrames  Array of 33-point landmark arrays sampled from the demonstration
 * @returns DerivedExerciseTemplate with all state-machine parameters auto-filled
 */
export function deriveExerciseTemplate(landmarkFrames: Point2D[][]): DerivedExerciseTemplate {
  if (!landmarkFrames || landmarkFrames.length < 5) {
    return buildDefaultTemplate();
  }

  const totalFrames = landmarkFrames.length;

  // ── Step 1: Evaluate each candidate triplet with visibility & kinetic filters ──
  const candidateAnalysis: CandidateAnalysisItem[] = CANDIDATE_TRIPLETS.map(triplet => {
    // Collect angles on frames where all 3 landmarks are reliably visible
    const validAngles: number[] = [];
    for (const frame of landmarkFrames) {
      const a = computeValidAngle(frame, triplet);
      if (a !== null) validAngles.push(a);
    }

    const visibilityCoverage = totalFrames > 0 ? validAngles.length / totalFrames : 0;

    // Disqualify if the triplet was not visible in a majority of frames
    // (Prevents occluded lower body from generating phantom ranges)
    if (validAngles.length < 5 || visibilityCoverage < 0.40) {
      return {
        triplet,
        angularRange: 0,
        minAngle: 0,
        maxAngle: 0,
        estimatedReps: 0,
        visibilityCoverage,
        kineticDisplacement: 0,
        score: 0
      };
    }

    // Smooth angles with a 3-frame moving average
    const smoothed: number[] = [];
    for (let i = 0; i < validAngles.length; i++) {
      const start = Math.max(0, i - 1);
      const end = Math.min(validAngles.length - 1, i + 1);
      const avg = validAngles.slice(start, end + 1).reduce((s, v) => s + v, 0) / (end - start + 1);
      smoothed.push(avg);
    }

    const { minAngle, maxAngle, angularRange } = getRobustAngles(smoothed);
    const kineticDisplacement = computeEndpointDisplacement(landmarkFrames, triplet.endpointIndex);
    const reps = estimateReps(smoothed, minAngle, maxAngle);

    // Disqualify if angular movement is negligible (< 15° is baseline postural sway)
    if (angularRange < 15) {
      return {
        triplet,
        angularRange,
        minAngle,
        maxAngle,
        estimatedReps: reps,
        visibilityCoverage,
        kineticDisplacement,
        score: 0
      };
    }

    // Kinetic displacement factor: genuine limb movements displace the extremity
    const displacementFactor = 1.0 + Math.min(1.5, kineticDisplacement * 3.5);

    // Repetition factor: cyclic repetitions indicate purposeful exercise
    const repFactor = reps >= 1 ? 1.4 : 1.0;

    // Anatomical plausibility: Hip flexion requires genuine knee displacement.
    // If someone is sitting/standing and performing an arm exercise, minor torso sway
    // should NEVER beat active arm movement.
    let anatomicalWeight = 1.0;
    if (triplet.targetJoint === 'Hip' && kineticDisplacement < 0.08) {
      anatomicalWeight = 0.2;
    }

    const score = Math.round(
      angularRange * visibilityCoverage * displacementFactor * repFactor * anatomicalWeight * 10
    ) / 10;

    return {
      triplet,
      angularRange,
      minAngle,
      maxAngle,
      estimatedReps: reps,
      visibilityCoverage,
      kineticDisplacement,
      score
    };
  });

  // ── Step 2: Rank candidates by kinematic score ─────────────────────────────
  const sorted = [...candidateAnalysis].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  if (!winner || winner.score === 0 || winner.angularRange < 15) {
    // Fall back to default template if no clear movement detected
    return buildDefaultTemplate();
  }

  // ── Step 3: Derive state machine parameters ────────────────────────────────
  const { triplet, minAngle, maxAngle, angularRange } = winner;

  let target_rom: number;
  let rest_angle: number;

  if (triplet.isAngleDecreasingOnFlex) {
    // For elbow flexion/extension:
    // Peak flexion reached = minAngle (e.g. 70°–100°)
    // Resting position = maxAngle (e.g. 150°–165°)
    target_rom = Math.round(minAngle);
    rest_angle = Math.round(maxAngle);
  } else {
    // For shoulder elevation / knee extension:
    // Peak reached = maxAngle (e.g. 135°–170°)
    // Resting position = minAngle
    target_rom = Math.round(maxAngle);
    rest_angle = Math.round(minAngle);
  }

  const hysteresis_buffer = Math.max(5, Math.min(15, Math.round(angularRange * 0.10)));

  // ── Step 4: Calculate derivation confidence ────────────────────────────────
  const secondScore = sorted[1]?.score ?? 0;
  const derivation_confidence = secondScore > 0
    ? Math.min(1.0, Math.round((winner.score / (winner.score + secondScore * 0.5)) * 100) / 100)
    : 0.96;

  return {
    detectedJoint: triplet,
    target_rom,
    rest_angle,
    hysteresis_buffer,
    angular_range: Math.round(angularRange),
    estimated_reps: winner.estimatedReps,
    derivation_confidence,
    detected_side: triplet.side,
    candidateAnalysis: sorted
  };
}

/** Sensible default when recording is too short or static. */
function buildDefaultTemplate(): DerivedExerciseTemplate {
  return {
    detectedJoint: CANDIDATE_TRIPLETS[0], // Elbow Flexion & Extension (Right Arm)
    target_rom: 120,
    rest_angle: 155,
    hysteresis_buffer: 8,
    angular_range: 35,
    estimated_reps: 0,
    derivation_confidence: 0.1,
    detected_side: 'right',
    candidateAnalysis: []
  };
}
