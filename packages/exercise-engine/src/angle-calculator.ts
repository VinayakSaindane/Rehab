export interface Point2D {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Calculates the internal angle in degrees at vertex B formed by line segments BA and BC.
 * Uses the dot product: cos(theta) = (BA . BC) / (|BA| * |BC|)
 * Output is in the range [0, 180] degrees.
 */
export function calculateJointAngle(
  pointA: Point2D,
  vertexB: Point2D,
  pointC: Point2D
): number {
  if (!pointA || !vertexB || !pointC) {
    return 0;
  }

  // Vector BA: from vertex B to point A
  const vBAx = pointA.x - vertexB.x;
  const vBAy = pointA.y - vertexB.y;

  // Vector BC: from vertex B to point C
  const vBCx = pointC.x - vertexB.x;
  const vBCy = pointC.y - vertexB.y;

  const dotProduct = vBAx * vBCx + vBAy * vBCy;
  const magBA = Math.sqrt(vBAx * vBAx + vBAy * vBAy);
  const magBC = Math.sqrt(vBCx * vBCx + vBCy * vBCy);

  if (magBA === 0 || magBC === 0) {
    return 0;
  }

  // Clamp cosine value between -1.0 and 1.0 to prevent NaN from floating point inaccuracies
  const cosine = Math.max(-1.0, Math.min(1.0, dotProduct / (magBA * magBC)));
  const radians = Math.acos(cosine);
  const degrees = (radians * 180) / Math.PI;

  return Math.round(degrees * 10) / 10;
}

/**
 * MediaPipe Pose Landmark standard indices mapping
 */
export const MEDIAPIPE_LANDMARK_INDEX: Record<string, number> = {
  nose: 0,
  left_eye_inner: 1,
  left_eye: 2,
  left_eye_outer: 3,
  right_eye_inner: 4,
  right_eye: 5,
  right_eye_outer: 6,
  left_ear: 7,
  right_ear: 8,
  mouth_left: 9,
  mouth_right: 10,
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_wrist: 15,
  right_wrist: 16,
  left_pinky: 17,
  right_pinky: 18,
  left_index: 19,
  right_index: 20,
  left_thumb: 21,
  right_thumb: 22,
  left_hip: 23,
  right_hip: 24,
  left_knee: 25,
  right_knee: 26,
  left_ankle: 27,
  right_ankle: 28,
  left_heel: 29,
  right_heel: 30,
  left_foot_index: 31,
  right_foot_index: 32
};
