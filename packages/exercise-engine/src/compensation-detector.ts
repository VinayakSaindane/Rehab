import { Point2D, MEDIAPIPE_LANDMARK_INDEX } from './angle-calculator';

/**
 * CompensationDetector — deterministic, threshold-based detection of compensatory
 * movement patterns during rehabilitation exercises.
 *
 * Reads secondary landmarks from the standard MediaPipe 33-point output to flag:
 *  - trunk_lean:      Spinal tilt > TRUNK_LEAN_THRESHOLD from vertical during a rep
 *  - shoulder_hike:   Ipsilateral shoulder rises more than SHOULDER_HIKE_THRESHOLD
 *                     relative to the contralateral shoulder during arm exercises
 *  - pelvic_shift:    Horizontal hip midpoint moves > PELVIC_SHIFT_THRESHOLD relative
 *                     to starting position (side-loading / uneven weight shift)
 *
 * Matches the style of confidence-gate.ts: plain class, deterministic threshold checks,
 * no ML, outputs a typed result object.
 */

export interface CompensationResult {
  hasCompensation: boolean;
  compensation_flags: string[];         // snake_case strings matching SessionCreate.compensation_flags
  reasons: string[];                    // Human-readable explanations for HUD display
  faultSide?: 'left' | 'right' | null;  // Identifies whether left or right body posture is compromised
}

// ── Thresholds ──────────────────────────────────────────────────────────────
// Trunk lean: angle (degrees) of shoulder-midpoint → hip-midpoint vector from vertical.
// A perfectly upright torso is 0°. >8° indicates compensatory lean.
const TRUNK_LEAN_THRESHOLD_DEG = 8;

// Shoulder hike: normalized-coordinate delta between left_shoulder.y and right_shoulder.y.
// Positive means the left shoulder is higher in image space (lower y value in MediaPipe).
// >0.04 normalized units (~roughly 3-4 cm at typical camera distance) is significant.
const SHOULDER_HIKE_THRESHOLD = 0.04;

// Pelvic shift: absolute horizontal (x) drift of the hip midpoint from baseline.
// >0.06 normalized units indicates meaningful lateral weight shift.
const PELVIC_SHIFT_THRESHOLD = 0.06;

export class CompensationDetector {
  /** Baseline hip-midpoint x captured at the start of each rep, to detect drift. */
  private baselineHipMidX: number | null = null;

  /**
   * Call once per animation frame (after the confidence gate passes).
   * @param landmarks  Full 33-point MediaPipe landmark array for this frame.
   * @param inRep      True when the repetition state machine is in MOVING or TARGET_ZONE.
   */
  public evaluate(landmarks: Point2D[], inRep: boolean): CompensationResult {
    const flags: string[] = [];
    const reasons: string[] = [];

    let faultSide: 'left' | 'right' | null = null;

    if (!landmarks || landmarks.length < 29) {
      // Not enough landmarks to evaluate secondary metrics.
      return { hasCompensation: false, compensation_flags: [], reasons: [], faultSide: null };
    }

    const leftShoulder  = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_shoulder']];
    const rightShoulder = landmarks[MEDIAPIPE_LANDMARK_INDEX['right_shoulder']];
    const leftHip       = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_hip']];
    const rightHip      = landmarks[MEDIAPIPE_LANDMARK_INDEX['right_hip']];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return { hasCompensation: false, compensation_flags: [], reasons: [], faultSide: null };
    }

    // ── 1. Trunk Lean ──────────────────────────────────────────────────────
    // Compute the angle of the spine vector (shoulder midpoint → hip midpoint) from vertical.
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidX      = (leftHip.x + rightHip.x) / 2;
    const hipMidY      = (leftHip.y + rightHip.y) / 2;

    // Spine vector in normalized image coords (Y increases downward in MediaPipe).
    const spineVecX = shoulderMidX - hipMidX;
    const spineVecY = shoulderMidY - hipMidY; // should be negative (shoulder above hip)

    // Angle from the vertical axis (0, -1) in degrees.
    const spineLength = Math.sqrt(spineVecX ** 2 + spineVecY ** 2);
    if (spineLength > 0.01) {
      // Dot product with vertical upward unit vector (0, -1)
      const dotVertical = spineVecY * -1; // = -spineVecY since vertical is (0,-1)
      const cosAngle = Math.max(-1, Math.min(1, dotVertical / spineLength));
      const trunkLeanDeg = (Math.acos(cosAngle) * 180) / Math.PI;

      if (inRep && trunkLeanDeg > TRUNK_LEAN_THRESHOLD_DEG) {
        flags.push('trunk_lean');
        const leanSide: 'left' | 'right' = spineVecX < 0 ? 'left' : 'right';
        faultSide = faultSide || leanSide;
        reasons.push(
          `Trunk lean detected (${trunkLeanDeg.toFixed(1)}° towards ${leanSide}). Keep your back straight and avoid leaning.`
        );
      }
    }

    // ── 2. Shoulder Hike ──────────────────────────────────────────────────
    // In MediaPipe, y=0 is the top of the frame. A smaller y means HIGHER in frame.
    // If the left shoulder y is significantly lower (smaller) than the right, the left is hiked.
    // We flag if either shoulder hikes relative to the other beyond the threshold.
    if (inRep) {
      const shoulderDeltaY = rightShoulder.y - leftShoulder.y; // positive → left shoulder hiked
      const absDelta = Math.abs(shoulderDeltaY);
      if (absDelta > SHOULDER_HIKE_THRESHOLD) {
        const hikedSide: 'left' | 'right' = shoulderDeltaY > 0 ? 'left' : 'right';
        flags.push('shoulder_hike');
        faultSide = faultSide || hikedSide;
        reasons.push(
          `Shoulder hike detected on ${hikedSide} side. Relax your shoulder and keep it level.`
        );
      }
    }

    // ── 3. Pelvic Shift ───────────────────────────────────────────────────
    // Capture hip-midpoint x at the start of the rep; flag drift during the rep.
    const currentHipMidX = hipMidX;

    if (!inRep) {
      // Between reps — reset baseline to current position.
      this.baselineHipMidX = currentHipMidX;
    } else if (this.baselineHipMidX !== null) {
      const hipDrift = currentHipMidX - this.baselineHipMidX;
      if (Math.abs(hipDrift) > PELVIC_SHIFT_THRESHOLD) {
        const shiftSide: 'left' | 'right' = hipDrift > 0 ? 'right' : 'left';
        flags.push('pelvic_shift');
        faultSide = faultSide || shiftSide;
        reasons.push(
          `Uneven weight shift detected towards ${shiftSide}. Keep your hips stable and distribute weight evenly.`
        );
      }
    }

    return {
      hasCompensation: flags.length > 0,
      compensation_flags: flags,
      reasons,
      faultSide
    };
  }

  /** Reset baseline state between exercise sets or when the analyzer is reset. */
  public reset(): void {
    this.baselineHipMidX = null;
  }
}
