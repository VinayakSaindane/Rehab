import { Point2D, MEDIAPIPE_LANDMARK_INDEX } from './angle-calculator';

export interface ConfidenceGateResult {
  isGated: boolean; // True means low confidence, analysis MUST be paused
  isPassing: boolean; // True means confidence is high, analysis can proceed
  overallConfidence: number; // 0.0 to 1.0
  reason: string | null;
  missingLandmarks: string[];
  consecutivePassingFrames: number;
}

export class ConfidenceGate {
  private minLandmarkVisibility: number;
  private minOverallConfidence: number;
  private smoothedConfidence: number = 0.9;
  private alpha: number = 0.25; // Exponential moving average smoothing factor
  private consecutivePassingFrames: number = 0;
  private requiredConsecutiveFrames: number = 2;

  constructor(
    minLandmarkVisibility = 0.70,
    minOverallConfidence = 0.75,
    requiredConsecutiveFrames = 2
  ) {
    this.minLandmarkVisibility = minLandmarkVisibility;
    this.minOverallConfidence = minOverallConfidence;
    this.requiredConsecutiveFrames = requiredConsecutiveFrames;
  }

  public evaluate(
    landmarks: Point2D[],
    requiredLandmarkNames: string[]
  ): ConfidenceGateResult {
    if (!landmarks || landmarks.length === 0) {
      this.consecutivePassingFrames = 0;
      return {
        isGated: true,
        isPassing: false,
        overallConfidence: 0,
        reason: 'No body landmarks detected in camera frame.',
        missingLandmarks: requiredLandmarkNames,
        consecutivePassingFrames: 0
      };
    }

    const missingLandmarks: string[] = [];
    let visibilitySum = 0;
    let checkedCount = 0;

    for (const name of requiredLandmarkNames) {
      const idx = MEDIAPIPE_LANDMARK_INDEX[name];
      if (idx === undefined || !landmarks[idx]) {
        missingLandmarks.push(name);
        continue;
      }

      const lm = landmarks[idx];
      const vis = lm.visibility !== undefined ? lm.visibility : 1.0;
      visibilitySum += vis;
      checkedCount++;

      // Check if landmark is too close to frame boundary (camera clipping)
      const isOutOfBounds = lm.x < 0.02 || lm.x > 0.98 || lm.y < 0.02 || lm.y > 0.98;

      if (vis < this.minLandmarkVisibility || isOutOfBounds) {
        missingLandmarks.push(name);
      }
    }

    const rawConfidence = checkedCount > 0 ? (visibilitySum / checkedCount) : 0;
    // Exponential smoothing
    this.smoothedConfidence = (this.alpha * rawConfidence) + ((1 - this.alpha) * this.smoothedConfidence);

    const framePasses = missingLandmarks.length === 0 && this.smoothedConfidence >= this.minOverallConfidence;

    if (framePasses) {
      this.consecutivePassingFrames++;
    } else {
      this.consecutivePassingFrames = 0;
    }

    // Require stable tracking across consecutive frames to prevent single-frame flickers
    const isPassing = framePasses && this.consecutivePassingFrames >= this.requiredConsecutiveFrames;

    let reason: string | null = null;
    if (!isPassing) {
      if (missingLandmarks.length > 0) {
        const readableNames = missingLandmarks.map(n => n.replace(/_/g, ' ')).join(', ');
        reason = `Required joints obscured: Please adjust camera so ${readableNames} remain visible.`;
      } else if (!framePasses) {
        reason = 'Tracking confidence low: Ensure adequate room lighting and avoid backlighting.';
      } else {
        reason = 'Stabilizing tracking...';
      }
    }

    return {
      isGated: !isPassing,
      isPassing,
      overallConfidence: Math.round(this.smoothedConfidence * 100) / 100,
      reason,
      missingLandmarks,
      consecutivePassingFrames: this.consecutivePassingFrames
    };
  }

  public reset(): void {
    this.smoothedConfidence = 0.9;
    this.consecutivePassingFrames = 0;
  }
}
