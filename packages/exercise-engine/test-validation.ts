import assert from 'assert';
import {
  RepetitionStateMachine,
  KinematicAngleSmoother,
  MotionDetector,
  getExerciseConfig
} from './src';

console.log('=== Exercise Engine Temporal Movement-Validation Suite ===');
console.log('Testing realistic kinematic scenarios (Requirements A through L)\n');

const profile = getExerciseConfig('elbow-flexion', 120);

function createStateMachine() {
  return new RepetitionStateMachine({
    startAngle: profile.startAngle,
    targetAngle: profile.defaultTargetAngle,
    returnAngle: profile.returnAngle,
    hysteresisBuffer: profile.hysteresisBuffer,
    isAngleDecreasingOnFlex: profile.isAngleDecreasingOnFlex,
    prescribedTargetRom: 120,
    romToleranceDegrees: profile.romToleranceDegrees,
    minRomDegrees: profile.minRomDegrees,
    minRepDurationMs: profile.minRepDurationMs,
    maxRepDurationMs: profile.maxRepDurationMs,
    minTargetDwellMs: profile.minTargetDwellMs,
    cooldownMs: profile.cooldownMs,
    readyFramesRequired: profile.readyFramesRequired,
    smoothingAlpha: profile.smoothingAlpha
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario A: User stays completely still
// Expected: 0 reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('[Scenario A] User stays completely still...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 60; i++) {
    sm.update(155.0, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 0, `Expected 0 reps, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Stationary posture correctly registered 0 reps.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario B: Small random elbow movements (sub-threshold excursion)
// Expected: 0 reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario B] Small random elbow movements (wobbles 155° <-> 146°)...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  // Calibrate in resting position
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Subtle twitches of ~9 degrees (below 28° minRomDegrees)
  const twitches = [154, 150, 147, 146, 148, 152, 155, 153, 147, 151, 154, 155];
  for (let rep = 0; rep < 4; rep++) {
    for (const angle of twitches) {
      sm.update(angle, true, 0.95, timeMs);
      timeMs += 33;
    }
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 0, `Expected 0 reps for sub-ROM twitches, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Sub-threshold twitches correctly rejected (0 reps).');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario C: Camera / landmark jitter
// Expected: 0 false reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario C] High-frequency landmark jitter around rest...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 90; i++) {
    // Alternating random noise ±5°
    const noise = (i % 2 === 0 ? 5 : -5) * (0.8 + 0.2 * (i % 3));
    sm.update(155 + noise, true, 0.90, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 0, `Expected 0 reps from jitter, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Landmark jitter filtered out with 0 false reps.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario D: One complete valid repetition
// Expected: exactly 1 rep
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario D] One complete valid repetition (normal tempo ~2.5s)...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  // 1. Ready phase (10 frames)
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // 2. Concentric flexion phase (155 down to 105 over 35 frames, ~1.1s)
  for (let i = 0; i <= 35; i++) {
    const angle = 155 - (50 * (i / 35));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  // 3. Peak hold (6 frames, ~200ms)
  for (let i = 0; i < 6; i++) {
    sm.update(105, true, 0.95, timeMs);
    timeMs += 33;
  }
  // 4. Eccentric return phase (105 back to 155 over 35 frames, ~1.1s)
  for (let i = 0; i <= 35; i++) {
    const angle = 105 + (50 * (i / 35));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  // 5. Rest follow-through (15 frames)
  for (let i = 0; i < 15; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 1, `Expected exactly 1 rep, got ${summary.completedReps}`);
  assert.strictEqual(summary.validReps, 1, `Expected 1 valid rep, got ${summary.validReps}`);
  console.log('  ✓ PASSED: Standard complete rep counted exactly 1 valid rep.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario E: One slow valid repetition
// Expected: exactly 1 rep
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario E] One slow valid repetition (~4.2s)...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Slow flexion (60 frames, ~2.0s)
  for (let i = 0; i <= 60; i++) {
    const angle = 155 - (48 * (i / 60));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Hold (10 frames)
  for (let i = 0; i < 10; i++) {
    sm.update(107, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Slow return (60 frames, ~2.0s)
  for (let i = 0; i <= 60; i++) {
    const angle = 107 + (48 * (i / 60));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  for (let i = 0; i < 15; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 1, `Expected 1 rep for slow controlled rep, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Slow rehabilitation tempo counted smoothly (1 rep).');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario F: One fast valid repetition
// Expected: exactly 1 rep
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario F] One fast valid repetition (~0.9s)...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Brisk flexion (14 frames = 460ms)
  for (let i = 0; i <= 14; i++) {
    const angle = 155 - (48 * (i / 14));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Hold (4 frames)
  for (let i = 0; i < 4; i++) {
    sm.update(107, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Brisk return (14 frames = 460ms)
  for (let i = 0; i <= 14; i++) {
    const angle = 107 + (48 * (i / 14));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  for (let i = 0; i < 15; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 1, `Expected 1 rep for brisk rep (>600ms), got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Fast valid rep counted properly (1 rep).');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario G: User starts movement but does not complete ROM
// Expected: 0 reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario G] User starts movement but reverses with insufficient ROM...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Moves from 155 to 140 (excursion 15° < 28° minRomDegrees) and reverses back to 155
  for (let i = 0; i <= 15; i++) {
    const angle = 155 - (15 * (i / 15));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  for (let i = 0; i <= 15; i++) {
    const angle = 140 + (15 * (i / 15));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  for (let i = 0; i < 20; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 0, `Expected 0 reps for insufficient ROM, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Incomplete excursion below minimum ROM was rejected (0 reps).');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario H: User reaches target position but does not return
// Expected: 0 reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario H] User flexes to target position but stays held without returning...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Flexes down to 105
  for (let i = 0; i <= 30; i++) {
    const angle = 155 - (50 * (i / 30));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Stays at 105 for 60 frames
  for (let i = 0; i < 60; i++) {
    sm.update(105, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 0, `Expected 0 reps when not returned, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Half-repetition without return correctly registered 0 reps.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario I: One rep with temporary landmark noise (single drop/spike)
// Expected: exactly 1 rep
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario I] Repetition with single-frame noise spike...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Flex down
  for (let i = 0; i <= 30; i++) {
    let angle = 155 - (50 * (i / 30));
    // Introduce an artificial 1-frame coordinate glitch halfway
    if (i === 15) angle = 50; // anomalous 50 deg spike
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Hold
  for (let i = 0; i < 6; i++) {
    sm.update(105, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Return
  for (let i = 0; i <= 30; i++) {
    const angle = 105 + (50 * (i / 30));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  for (let i = 0; i < 15; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 1, `Expected 1 rep despite 1-frame spike, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Glitch-rejection smoother prevented spike from breaking rep (1 rep).');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario J: User performs 3 continuous valid reps
// Expected: exactly 3 reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario J] Three continuous valid repetitions...');
{
  const sm = createStateMachine();
  let timeMs = 1000;

  for (let rep = 1; rep <= 3; rep++) {
    // Rest/cooldown wait (18 frames = 600ms)
    for (let i = 0; i < 18; i++) {
      sm.update(155, true, 0.95, timeMs);
      timeMs += 33;
    }
    // Flex (30 frames)
    for (let i = 0; i <= 30; i++) {
      const angle = 155 - (48 * (i / 30));
      sm.update(angle, true, 0.95, timeMs);
      timeMs += 33;
    }
    // Hold (6 frames)
    for (let i = 0; i < 6; i++) {
      sm.update(107, true, 0.95, timeMs);
      timeMs += 33;
    }
    // Return (30 frames)
    for (let i = 0; i <= 30; i++) {
      const angle = 107 + (48 * (i / 30));
      sm.update(angle, true, 0.95, timeMs);
      timeMs += 33;
    }
  }

  // Final rest
  for (let i = 0; i < 20; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }

  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 3, `Expected exactly 3 reps, got ${summary.completedReps}`);
  assert.strictEqual(summary.validReps, 3, `Expected 3 valid reps, got ${summary.validReps}`);
  console.log('  ✓ PASSED: Three successive reps counted with 100% precision (3/3).');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario K: One physical movement held at target position
// Expected: exactly 1 rep, NOT multiple reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario K] Arm held at peak target position for 3.5 seconds...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Flex
  for (let i = 0; i <= 30; i++) {
    const angle = 155 - (50 * (i / 30));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Hold at peak for 110 frames (~3.6 seconds)
  for (let i = 0; i < 110; i++) {
    sm.update(105, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Before return: rep count must still be 0
  assert.strictEqual(sm.getSummary(10).completedReps, 0, 'Must NOT count rep while still holding at target!');

  // Now return
  for (let i = 0; i <= 30; i++) {
    const angle = 105 + (50 * (i / 30));
    sm.update(angle, true, 0.95, timeMs);
    timeMs += 33;
  }
  for (let i = 0; i < 15; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 1, `Expected exactly 1 rep, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Extended peak hold produced exactly 1 rep upon return, with zero double-counting.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario L: Rapid shaking of the elbow (high-frequency tremor)
// Expected: 0 false reps
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Scenario L] High-frequency elbow shaking (10 Hz tremor)...');
{
  const sm = createStateMachine();
  let timeMs = 1000;
  for (let i = 0; i < 10; i++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  // Rapid oscillation between 155 and 125 every 3 frames (100ms cycle)
  for (let cycle = 0; cycle < 15; cycle++) {
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
    sm.update(130, true, 0.95, timeMs);
    timeMs += 33;
    sm.update(155, true, 0.95, timeMs);
    timeMs += 33;
  }
  const summary = sm.getSummary(10);
  assert.strictEqual(summary.completedReps, 0, `Expected 0 reps for rapid shaking, got ${summary.completedReps}`);
  console.log('  ✓ PASSED: Rapid trembling correctly disqualified by temporal duration filter (0 reps).');
}

console.log('\n===============================================================');
console.log('🎉 ALL 12 REALISTIC BIOMECHANICAL FAILURE SCENARIOS PASSED 100%');
console.log('===============================================================\n');
