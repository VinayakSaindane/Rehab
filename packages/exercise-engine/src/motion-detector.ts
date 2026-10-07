/**
 * motion-detector.ts — Decoupled Kinematic Motion Detector
 *
 * Separates low-level motion detection from higher-level repetition counting (Requirement 10).
 *
 * Capabilities:
 * - Detects whether physical movement is actively occurring based on angular displacement and velocity.
 * - Discerns motion direction ('FLEXING' vs 'EXTENDING' vs 'STATIONARY').
 * - Calculates instantaneous and smoothed velocity (deg/sec).
 * - Distinguishes sustained intentional movement from minor body sway / posture drift.
 */

export type MotionDirection = 'FLEXING' | 'EXTENDING' | 'STATIONARY';

export interface MotionDetectionResult {
  /** True when movement exceeds both noise floor and minimum velocity threshold */
  isMotionDetected: boolean;
  /** Direction of movement relative to anatomical flex/extend definition */
  direction: MotionDirection;
  /** Angular velocity in degrees per second (positive: increasing angle, negative: decreasing angle) */
  angularVelocity: number;
  /** Absolute displacement in degrees from the calibrated resting anchor */
  displacementFromAnchor: number;
  /** Motion confidence score (0.0 to 1.0) */
  motionConfidence: number;
}

export interface MotionDetectorConfig {
  /** Velocity threshold (deg/s) to classify movement vs stationary (default: 15 deg/s) */
  velocityThresholdDegPerSec?: number;
  /** Displacement threshold (deg) from anchor before confirming movement (default: 5 deg) */
  displacementThresholdDeg?: number;
  /** True if decreasing angle corresponds to anatomical flexion (e.g. elbow) */
  isAngleDecreasingOnFlex?: boolean;
}

export class MotionDetector {
  private velocityThreshold: number;
  private displacementThreshold: number;
  private isAngleDecreasingOnFlex: boolean;
  private anchorAngle: number | null = null;
  private consecutiveMotionFrames: number = 0;

  constructor(config: MotionDetectorConfig = {}) {
    this.velocityThreshold = config.velocityThresholdDegPerSec ?? 14;
    this.displacementThreshold = config.displacementThresholdDeg ?? 5;
    this.isAngleDecreasingOnFlex = config.isAngleDecreasingOnFlex ?? true;
  }

  /**
   * Set or calibrate the stationary anchor angle (usually captured in REST / READY state).
   */
  public setAnchorAngle(angle: number): void {
    this.anchorAngle = angle;
  }

  /**
   * Evaluates the current smoothed angle and velocity to produce motion telemetry.
   */
  public evaluate(
    currentAngle: number,
    angularVelocity: number,
    confidencePassed: boolean
  ): MotionDetectionResult {
    if (!confidencePassed) {
      this.consecutiveMotionFrames = 0;
      return {
        isMotionDetected: false,
        direction: 'STATIONARY',
        angularVelocity: 0,
        displacementFromAnchor: 0,
        motionConfidence: 0
      };
    }

    if (this.anchorAngle === null) {
      this.anchorAngle = currentAngle;
    }

    const displacement = Math.abs(currentAngle - this.anchorAngle);
    const speed = Math.abs(angularVelocity);

    // Determine direction
    let direction: MotionDirection = 'STATIONARY';
    if (speed >= this.velocityThreshold) {
      if (this.isAngleDecreasingOnFlex) {
        // Lower angle = flexing (e.g. elbow)
        direction = angularVelocity < 0 ? 'FLEXING' : 'EXTENDING';
      } else {
        // Higher angle = extending / elevating (e.g. knee extension, shoulder elevation)
        direction = angularVelocity > 0 ? 'EXTENDING' : 'FLEXING';
      }
    }

    // Motion is confirmed when speed exceeds threshold OR significant displacement has occurred
    const hasVelocity = speed >= this.velocityThreshold;
    const hasDisplacement = displacement >= this.displacementThreshold;
    const isMovingCandidate = hasVelocity || (hasDisplacement && speed >= this.velocityThreshold * 0.6);

    if (isMovingCandidate) {
      this.consecutiveMotionFrames++;
    } else {
      this.consecutiveMotionFrames = Math.max(0, this.consecutiveMotionFrames - 1);
    }

    // Require at least 2 consecutive frames of motion to filter single-frame noise
    const isMotionDetected = this.consecutiveMotionFrames >= 2;

    // Confidence: higher when both speed and displacement are clear
    const velocityConfidence = Math.min(1.0, speed / (this.velocityThreshold * 2.5));
    const displacementConfidence = Math.min(1.0, displacement / (this.displacementThreshold * 2.0));
    const motionConfidence = Math.round(((velocityConfidence * 0.6) + (displacementConfidence * 0.4)) * 100) / 100;

    return {
      isMotionDetected,
      direction,
      angularVelocity,
      displacementFromAnchor: Math.round(displacement * 10) / 10,
      motionConfidence
    };
  }

  public reset(newAnchor?: number): void {
    this.anchorAngle = newAnchor !== undefined ? newAnchor : null;
    this.consecutiveMotionFrames = 0;
  }
}
