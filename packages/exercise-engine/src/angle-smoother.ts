/**
 * angle-smoother.ts — Adaptive Kinematic Angle Smoother & Outlier Rejection Filter
 *
 * Designed specifically for MediaPipe Pose landmark joint angle sequences.
 * 
 * Key Features:
 * 1. Adaptive Exponential Smoothing:
 *    - At low velocities (holding position / slight tremor): uses lower alpha for strong jitter suppression.
 *    - At high velocities (active human movement): dynamically raises alpha to eliminate phase lag / latency.
 * 2. Outlier / Single-Frame Glitch Rejection:
 *    - Human physiological joint velocity rarely exceeds 350-400 deg/s in rehabilitation exercises.
 *    - Single-frame spikes (> 35 deg per frame) caused by MediaPipe landmark swap or occlusion are clamped.
 * 3. Bidirectional velocity computation:
 *    - Computes filtered angular velocity (deg/sec) for reliable movement direction detection.
 */

export interface SmoothedAngleOutput {
  rawAngle: number;
  smoothedAngle: number;
  angularVelocity: number; // deg/second (positive = increasing, negative = decreasing)
  isGlitchRejected: boolean;
}

export class KinematicAngleSmoother {
  private baseAlpha: number;
  private maxAlpha: number;
  private maxRealisticDeltaPerFrame: number;
  private previousSmoothedAngle: number | null = null;
  private previousTimestampMs: number | null = null;
  private smoothedVelocity: number = 0;

  /**
   * @param baseAlpha Base smoothing factor for stationary posture (default: 0.25)
   * @param maxAlpha Max smoothing factor during rapid movement (default: 0.65)
   * @param maxRealisticDeltaPerFrame Maximum degrees a joint can move in one 33ms frame (default: 25)
   */
  constructor(
    baseAlpha: number = 0.25,
    maxAlpha: number = 0.65,
    maxRealisticDeltaPerFrame: number = 25
  ) {
    this.baseAlpha = baseAlpha;
    this.maxAlpha = maxAlpha;
    this.maxRealisticDeltaPerFrame = maxRealisticDeltaPerFrame;
  }

  /**
   * Filters incoming raw angle.
   * @param rawAngle Raw calculated joint angle (0 - 180 degrees)
   * @param timestampMs Timestamp of current frame in milliseconds
   */
  public filter(rawAngle: number, timestampMs: number = Date.now()): SmoothedAngleOutput {
    // Initial frame
    if (this.previousSmoothedAngle === null || this.previousTimestampMs === null) {
      this.previousSmoothedAngle = rawAngle;
      this.previousTimestampMs = timestampMs;
      this.smoothedVelocity = 0;
      return {
        rawAngle,
        smoothedAngle: Math.round(rawAngle * 10) / 10,
        angularVelocity: 0,
        isGlitchRejected: false
      };
    }

    const dtMs = Math.max(1, timestampMs - this.previousTimestampMs);
    const dtSeconds = dtMs / 1000;

    // Outlier / Spike Clamping
    const rawDelta = rawAngle - this.previousSmoothedAngle;
    let clampedAngle = rawAngle;
    let isGlitchRejected = false;

    // Scale allowed delta by time elapsed (normalizing for frame rate, baseline 33ms)
    // B13: Cap at 3× base to prevent spike gate disabling after tab-background (dtMs can be 500ms+)
    const allowedDelta = Math.min(
      this.maxRealisticDeltaPerFrame * 3,
      Math.max(10, this.maxRealisticDeltaPerFrame * (dtMs / 33.3))
    );
    if (Math.abs(rawDelta) > allowedDelta) {
      // Single-frame spike detected — clamp to max realistic change
      clampedAngle = this.previousSmoothedAngle + Math.sign(rawDelta) * allowedDelta;
      isGlitchRejected = true;
    }

    // Velocity-Adaptive Alpha:
    // If delta is small (< 3 deg), use baseAlpha for rock-solid stability against landmark tremor.
    // If delta is larger (> 10 deg), smoothly increase alpha up to maxAlpha for responsive tracking.
    const deltaMag = Math.abs(clampedAngle - this.previousSmoothedAngle);
    const velocityFactor = Math.min(1.0, Math.max(0.0, (deltaMag - 2.0) / 8.0));
    const adaptiveAlpha = this.baseAlpha + (this.maxAlpha - this.baseAlpha) * velocityFactor;

    // Exponential Moving Average
    const smoothed = adaptiveAlpha * clampedAngle + (1 - adaptiveAlpha) * this.previousSmoothedAngle;

    // Compute smoothed velocity (degrees per second)
    const instantaneousVelocity = (smoothed - this.previousSmoothedAngle) / dtSeconds;
    // Low-pass filter velocity with alpha = 0.35
    this.smoothedVelocity = 0.35 * instantaneousVelocity + 0.65 * this.smoothedVelocity;

    this.previousSmoothedAngle = smoothed;
    this.previousTimestampMs = timestampMs;

    return {
      rawAngle,
      smoothedAngle: Math.round(smoothed * 10) / 10,
      angularVelocity: Math.round(this.smoothedVelocity * 10) / 10,
      isGlitchRejected
    };
  }

  /**
   * Reset filter state (e.g. at start of new exercise set).
   */
  public reset(initialAngle?: number): void {
    this.previousSmoothedAngle = initialAngle !== undefined ? initialAngle : null;
    this.previousTimestampMs = null;
    this.smoothedVelocity = 0;
  }
}
