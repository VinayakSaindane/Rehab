import { Point2D } from './angle-calculator';

export type SimulationPattern = 'NORMAL_REPS' | 'UNDER_RANGE_REP' | 'LOW_CONFIDENCE';

export class KinematicSimulationEngine {
  private frameCount: number = 0;
  private currentRep: number = 1;
  private pattern: SimulationPattern = 'NORMAL_REPS';
  private activeSide: 'left' | 'right' = 'right';

  constructor(initialPattern: SimulationPattern = 'NORMAL_REPS', side: 'left' | 'right' = 'right') {
    this.pattern = initialPattern;
    this.activeSide = side;
  }

  public setPattern(pattern: SimulationPattern): void {
    this.pattern = pattern;
  }

  public setActiveSide(side: 'left' | 'right'): void {
    this.activeSide = side;
  }

  /**
   * Generates a 33-point MediaPipe-compatible normalized landmark set
   * simulating realistic posture during elbow flexion and extension.
   */
  public generateNextFrame(): Point2D[] {
    this.frameCount++;
    const t = this.frameCount * 0.05; // ~20-30 fps cadence

    // Default landmark visibility
    let visibility = 0.96;
    if (this.pattern === 'LOW_CONFIDENCE') {
      visibility = 0.55; // Deliberately drops below 0.70 threshold to trigger gate
    }

    // Kinematic arm angle generation:
    // When extended: wrist is down -> angle ~160 deg
    // When flexed: wrist moves up towards shoulder -> angle ~45-120 deg
    const cycle = (Math.sin(t) + 1) / 2; // 0.0 to 1.0

    let targetFlexionFactor = cycle;
    if (this.pattern === 'UNDER_RANGE_REP') {
      // Intentionally cap flexion to simulate under-range movement (~108 deg instead of 120 deg)
      targetFlexionFactor = cycle * 0.65;
    }

    const armLength = 0.20;
    const flexAngleRad = targetFlexionFactor * 2.1; // ~120 degrees arc

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
    landmarks[11] = { x: 0.42, y: 0.35, z: 0, visibility }; // left shoulder
    landmarks[12] = { x: 0.58, y: 0.35, z: 0, visibility }; // right shoulder

    if (this.activeSide === 'right') {
      // Active Right Arm (moving through flexion & extension)
      const rElbowX = 0.58;
      const rElbowY = 0.54;
      const rWristX = rElbowX + armLength * Math.sin(flexAngleRad) * 0.4;
      const rWristY = rElbowY + armLength * Math.cos(flexAngleRad);

      landmarks[14] = { x: rElbowX, y: rElbowY, z: 0, visibility }; // right elbow
      landmarks[16] = { x: rWristX, y: rWristY, z: 0, visibility }; // right wrist

      // Left Arm (Resting at side)
      landmarks[13] = { x: 0.42, y: 0.54, z: 0, visibility }; // left elbow
      landmarks[15] = { x: 0.41, y: 0.74, z: 0, visibility }; // left wrist
    } else {
      // Active Left Arm
      const lElbowX = 0.42;
      const lElbowY = 0.54;
      const lWristX = lElbowX - armLength * Math.sin(flexAngleRad) * 0.4;
      const lWristY = lElbowY + armLength * Math.cos(flexAngleRad);

      landmarks[13] = { x: lElbowX, y: lElbowY, z: 0, visibility }; // left elbow
      landmarks[15] = { x: lWristX, y: lWristY, z: 0, visibility }; // left wrist

      // Right Arm (Resting)
      landmarks[14] = { x: 0.58, y: 0.54, z: 0, visibility }; // right elbow
      landmarks[16] = { x: 0.59, y: 0.74, z: 0, visibility }; // right wrist
    }

    // Hips (stable upright posture)
    landmarks[23] = { x: 0.44, y: 0.65, z: 0, visibility }; // left hip
    landmarks[24] = { x: 0.56, y: 0.65, z: 0, visibility }; // right hip

    // Knees (stable upright posture)
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
