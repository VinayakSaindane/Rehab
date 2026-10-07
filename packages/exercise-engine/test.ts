import assert from 'assert';
import {
  calculateJointAngle,
  calculateJointAngle3D,
  deriveExerciseTemplate,
  KinematicSimulationEngine,
  estimateReps,
  type Point2D
} from './src';

console.log('=== Exercise Engine Comprehensive Test Suite ===');

// 1. Basic 2D & 3D Angle Calculations
console.log('\n[1/4] Testing 2D & 3D Angle Calculations...');
const rightAngle = calculateJointAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
assert.strictEqual(rightAngle, 90.0, `Expected 90.0 deg, got ${rightAngle}`);

const straightLine = calculateJointAngle({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
assert.strictEqual(straightLine, 180.0, `Expected 180.0 deg, got ${straightLine}`);

const acuteAngle = calculateJointAngle({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
assert.strictEqual(acuteAngle, 45.0, `Expected 45.0 deg, got ${acuteAngle}`);

const rightAngle3D = calculateJointAngle3D({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
assert.strictEqual(rightAngle3D, 90.0, `Expected 90.0 deg, got ${rightAngle3D}`);
console.log('✓ 2D and 3D angle calculations passed perfectly.');

// 2. Bidirectional Repetition Counter (Flexion and Extension)
console.log('\n[2/4] Testing Repetition Counter on both flexion and extension waves...');
// Flexion wave (starts extended at 160°, flexes to 80°, repeats 3 times)
const flexionAngles = [
  160, 150, 120, 80, 75, 80, 120, 155, 160,
  150, 120, 80, 75, 80, 120, 155, 160,
  150, 120, 80, 75, 80, 120, 155, 160
];
const flexReps = estimateReps(flexionAngles, 75, 160);
assert.strictEqual(flexReps, 3, `Expected 3 flexion reps, got ${flexReps}`);

// Extension wave (starts flexed at 75°, extends to 160°, repeats 3 times)
const extensionAngles = [
  75, 85, 120, 155, 160, 155, 120, 85, 75,
  85, 120, 155, 160, 155, 120, 85, 75,
  85, 120, 155, 160, 155, 120, 85, 75
];
const extReps = estimateReps(extensionAngles, 75, 160);
assert.strictEqual(extReps, 3, `Expected 3 extension reps, got ${extReps}`);
console.log('✓ Bidirectional rep counter passed on both flexion and extension.');

// 3. Right & Left Arm Elbow Flexion & Extension Recognition
console.log('\n[3/4] Testing Bi-lateral Elbow Recognition...');
// Right arm
const simRight = new KinematicSimulationEngine('NORMAL_REPS', 'right');
const framesRight: Point2D[][] = [];
for (let i = 0; i < 60; i++) framesRight.push(simRight.generateNextFrame());

const resultRight = deriveExerciseTemplate(framesRight);
console.log('Right Arm Result:', {
  joint: resultRight.detectedJoint.name,
  targetJoint: resultRight.detectedJoint.targetJoint,
  side: resultRight.detected_side,
  range: resultRight.angular_range,
  reps: resultRight.estimated_reps,
  confidence: resultRight.derivation_confidence
});
assert.strictEqual(resultRight.detectedJoint.targetJoint, 'Elbow');
assert.strictEqual(resultRight.detected_side, 'right');
assert.strictEqual(resultRight.detectedJoint.name, 'Elbow Flexion & Extension');

// Left arm
const simLeft = new KinematicSimulationEngine('NORMAL_REPS', 'left');
const framesLeft: Point2D[][] = [];
for (let i = 0; i < 60; i++) framesLeft.push(simLeft.generateNextFrame());

const resultLeft = deriveExerciseTemplate(framesLeft);
console.log('Left Arm Result:', {
  joint: resultLeft.detectedJoint.name,
  targetJoint: resultLeft.detectedJoint.targetJoint,
  side: resultLeft.detected_side,
  range: resultLeft.angular_range,
  reps: resultLeft.estimated_reps,
  confidence: resultLeft.derivation_confidence
});
assert.strictEqual(resultLeft.detectedJoint.targetJoint, 'Elbow');
assert.strictEqual(resultLeft.detected_side, 'left');
assert.strictEqual(resultLeft.detectedJoint.name, 'Elbow Flexion & Extension');
console.log('✓ Both right and left arm exercises correctly identified as Elbow.');

// 4. Occlusion & Noise Resistance (Rejecting fake Hip detections)
console.log('\n[4/4] Testing Occlusion Resistance (Preventing fake Hip Flexion classification)...');
const simOccluded = new KinematicSimulationEngine('NORMAL_REPS', 'right');
const framesOccluded: Point2D[][] = [];
for (let i = 0; i < 60; i++) {
  const frame = simOccluded.generateNextFrame();
  // Simulate knees and hips occluded under desk with noisy hallucinated coords
  frame[25].visibility = 0.15; // left knee
  frame[26].visibility = 0.20; // right knee
  frame[25].x += (Math.random() - 0.5) * 0.4;
  frame[25].y += (Math.random() - 0.5) * 0.4;
  frame[27].visibility = 0.05; // ankle
  frame[28].visibility = 0.05;
  framesOccluded.push(frame);
}

const resultOccluded = deriveExerciseTemplate(framesOccluded);
console.log('Occlusion Test Result:', {
  joint: resultOccluded.detectedJoint.name,
  targetJoint: resultOccluded.detectedJoint.targetJoint,
  side: resultOccluded.detected_side,
  confidence: resultOccluded.derivation_confidence
});

assert.strictEqual(resultOccluded.detectedJoint.targetJoint, 'Elbow', 'Must detect Elbow even when lower body is occluded');
assert.notStrictEqual(resultOccluded.detectedJoint.targetJoint, 'Hip', 'Must NEVER misclassify as Hip');
console.log('✓ Successfully disqualified occluded lower-body noise and selected Elbow.');

console.log('\n🎉 ALL EXERCISE ENGINE & AI DETECTION TESTS PASSED PERFECTLY!\n');
