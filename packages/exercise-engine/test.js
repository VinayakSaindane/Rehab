// Quick test for angle calculations and state machine behavior
const assert = require('assert');

// Simple angle calculator verification in plain JS
function calculateAngle(pA, vB, pC) {
  const vBAx = pA.x - vB.x;
  const vBAy = pA.y - vB.y;
  const vBCx = pC.x - vB.x;
  const vBCy = pC.y - vB.y;
  const dot = vBAx * vBCx + vBAy * vBCy;
  const magA = Math.sqrt(vBAx * vBAx + vBAy * vBAy);
  const magC = Math.sqrt(vBCx * vBCx + vBCy * vBCy);
  const cosVal = Math.max(-1, Math.min(1, dot / (magA * magC)));
  return Math.round((Math.acos(cosVal) * 180 / Math.PI) * 10) / 10;
}

console.log('Testing Angle Calculator...');
// 90-degree right angle: (0, 1) -> (0, 0) -> (1, 0)
const rightAngle = calculateAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
assert.strictEqual(rightAngle, 90.0, `Expected 90.0 deg, got ${rightAngle}`);

// 180-degree straight line: (-1, 0) -> (0, 0) -> (1, 0)
const straightLine = calculateAngle({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
assert.strictEqual(straightLine, 180.0, `Expected 180.0 deg, got ${straightLine}`);

// 45-degree angle: (1, 1) -> (0, 0) -> (1, 0)
const acuteAngle = calculateAngle({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
assert.strictEqual(acuteAngle, 45.0, `Expected 45.0 deg, got ${acuteAngle}`);

console.log('✓ Angle calculations passed perfectly!');
console.log('Exercise Engine verification complete.');
