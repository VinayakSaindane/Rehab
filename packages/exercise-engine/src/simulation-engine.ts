import { Point2D } from './angle-calculator';

export type SimulationPattern = 'NORMAL_REPS' | 'UNDER_RANGE_REP' | 'LOW_CONFIDENCE';

export class KinematicSimulationEngine {
  private frameCount: number = 0;
  private currentRep: number = 1;
  private pattern: SimulationPattern = 'NORMAL_REPS';

  constructor(initialPattern: SimulationPattern = 'NORMAL_REPS') {
    this.pattern = initialPattern;
  }

  public setPattern(pattern: SimulationPattern): void {
    this.pattern = pattern;
  }

  /**
   * Generates a 33-point MediaPipe-compatible normalized landmark set
   * simulating realistic patient posture during elbow flexion.
   */
  public generateNextFrame(): Point2D[] {
    this.frameCount++;
    const t = this.frameCount * 0.05; // ~20-30 fps cadence

    // Base body coordinates (standing facing camera)
    // Left shoulder ~ (0.42, 0.35)
    // Left elbow ~ (0.42, 0.55)
    // Left wrist moves along an arc around elbow
    const shoulderX = 0.42;
    const shoulderY = 0.35;
    const elbowX = 0.43;
    const elbowY = 0.54;

    // Default landmark visibility
    let visibility = 0.96;
    if (this.pattern === 'LOW_CONFIDENCE') {
      visibility = 0.55; // Deliberately drops below 0.70 threshold to trigger gate
    }

    // Kinematic arm angle generation:
    // When extended: wrist is down at (0.43, 0.74) -> angle ~160 deg
    // When flexed: wrist moves up towards shoulder (0.42, 0.38) -> angle ~45-120 deg
    const cycle = (Math.sin(t) + 1) / 2; // 0.0 to 1.0

    let targetFlexionFactor = cycle;
    if (this.pattern === 'UNDER_RANGE_REP') {
      // Intentionally cap flexion to simulate under-range movement (~108 deg instead of 120 deg)
      targetFlexionFactor = cycle * 0.65;
    }

    // Compute wrist coordinates based on angle
    const armLength = 0.20;
    // Angle in radians from vertical down
    const flexAngleRad = targetFlexionFactor * 2.1; // ~120 degrees arc
    const wristX = elbowX + armLength * Math.sin(flexAngleRad) * 0.4;
    const wristY = elbowY + armLength * Math.cos(flexAngleRad);

    // Build standard 33 MediaPipe landmarks
    const landmarks: Point2D[] = [];
    for (let i = 0; i < 33; i++) {
      landmarks.push({ x: 0.5, y: 0.5, z: 0, visibility });
    }

    // Head
    landmarks[0] = { x: 0.50, y: 0.18, z: 0, visibility }; // nose
    landmarks[2] = { x: 0.48, y: 0.16, z: 0, visibility }; // left eye
    landmarks[5] = { x: 0.52, y: 0.16, z: 0, visibility }; // right eye

    // Shoulders
    landmarks[11] = { x: shoulderX, y: shoulderY, z: 0, visibility }; // left shoulder
    landmarks[12] = { x: 0.58, y: shoulderY, z: 0, visibility }; // right shoulder

    // Left Arm (Active)
    landmarks[13] = { x: elbowX, y: elbowY, z: 0, visibility }; // left elbow
    landmarks[15] = { x: wristX, y: wristY, z: 0, visibility }; // left wrist

    // Right Arm (Resting)
    landmarks[14] = { x: 0.60, y: 0.54, z: 0, visibility }; // right elbow
    landmarks[16] = { x: 0.61, y: 0.74, z: 0, visibility }; // right wrist

    // Hips
    landmarks[23] = { x: 0.44, y: 0.65, z: 0, visibility }; // left hip
    landmarks[24] = { x: 0.56, y: 0.65, z: 0, visibility }; // right hip

    // Knees
    landmarks[25] = { x: 0.44, y: 0.82, z: 0, visibility }; // left knee
    landmarks[26] = { x: 0.56, y: 0.82, z: 0, visibility }; // right knee

    // Ankles
    landmarks[27] = { x: 0.44, y: 0.95, z: 0, visibility }; // left ankle
    landmarks[28] = { x: 0.56, y: 0.95, z: 0, visibility }; // right ankle

    return landmarks;
  }

  public reset(): void {
    this.frameCount = 0;
    this.currentRep = 1;
  }
}
