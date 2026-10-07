import { SessionRepMetric } from '@rehabsense/types';
import { KinematicAngleSmoother, SmoothedAngleOutput } from './angle-smoother';
import { MotionDetector, MotionDirection, MotionDetectionResult } from './motion-detector';

export type RepState = 'REST' | 'READY' | 'MOVING' | 'TARGET_ZONE' | 'RETURNING' | 'COMPLETED' | 'COOLDOWN';

export interface RepStateMachineConfig {
  startAngle: number;
  targetAngle: number;
  returnAngle: number;
  hysteresisBuffer: number;
  isAngleDecreasingOnFlex: boolean; // True for elbow flexion (160 -> 120), false for knee ext / shoulder elev (30 -> 135)
  prescribedTargetRom: number;
  romToleranceDegrees: number;
  /** Minimum range of motion in degrees required to count as a repetition (default: 25) */
  minRomDegrees?: number;
  /** Minimum duration in milliseconds for a repetition to be valid (default: 500ms) */
  minRepDurationMs?: number;
  /** Maximum duration in milliseconds before timing out an abandoned movement (default: 8000ms) */
  maxRepDurationMs?: number;
  /** Minimum dwell time in target zone in milliseconds (default: 80ms) */
  minTargetDwellMs?: number;
  /** Mandatory refractory cooldown in milliseconds after repetition completion (default: 500ms) */
  cooldownMs?: number;
  /** Number of consecutive stable frames required in start position to establish READY (default: 3) */
  readyFramesRequired?: number;
  /** Smoothing filter alpha factor (default: 0.35) */
  smoothingAlpha?: number;
}

export interface RepDebugInfo {
  rawAngle: number;
  smoothedAngle: number;
  angularVelocity: number;
  motionState: 'IDLE' | 'FLEXING' | 'EXTENDING' | 'STATIONARY';
  isMotionDetected: boolean;
  currentRom: number;
  peakRomThisRep: number;
  startRomThisRep: number;
  excursionThisRep: number;
  minRomRequired: number;
  repDurationMs: number;
  repRejectionReason: string | null;
  repAcceptedReason: string | null;
  confidenceScore: number;
  currentState: RepState;
}

export interface RepTransitionResult {
  currentState: RepState;
  previousState: RepState;
  completedReps: number;
  validReps: number;
  currentRom: number;
  peakRomThisRep: number;
  isRepCompletedThisFrame: boolean;
  completedRepMetric: SessionRepMetric | null;
  statusMessage: string;
  // Enhanced telemetry:
  smoothedAngle: number;
  rawAngle: number;
  angularVelocity: number;
  isMotionDetected: boolean;
  motionDirection: MotionDirection;
  repRejectionReason: string | null;
  repAcceptedReason: string | null;
  debug: RepDebugInfo;
}

export class RepetitionStateMachine {
  private config: RepStateMachineConfig;
  private state: RepState = 'REST';
  private completedReps: number = 0;
  private validReps: number = 0;
  private peakRomThisRep: number = 0;
  private startRomThisRep: number = 0;
  private repStartTimeMs: number = 0;
  private allRepMetrics: SessionRepMetric[] = [];

  // Temporal validation & filtering
  private smoother: KinematicAngleSmoother;
  private motionDetector: MotionDetector;
  private minRomDegrees: number;
  private minRepDurationMs: number;
  private maxRepDurationMs: number;
  private minTargetDwellMs: number;
  private cooldownMs: number;
  private readyFramesRequired: number;

  // Internal state tracking
  private readyFrameCount: number = 0;
  private movingFrameCount: number = 0;
  private targetDwellTimeMs: number = 0;
  private cooldownStartTimeMs: number = 0;
  private lastTimestampMs: number = 0;
  private repRejectionReason: string | null = null;
  private repAcceptedReason: string | null = null;

  constructor(config: RepStateMachineConfig) {
    this.config = config;
    this.minRomDegrees = config.minRomDegrees ?? 25;
    this.minRepDurationMs = config.minRepDurationMs ?? 500;
    this.maxRepDurationMs = config.maxRepDurationMs ?? 8000;
    this.minTargetDwellMs = config.minTargetDwellMs ?? 80;
    this.cooldownMs = config.cooldownMs ?? 500;
    this.readyFramesRequired = config.readyFramesRequired ?? 3;

    this.smoother = new KinematicAngleSmoother(
      config.smoothingAlpha ?? 0.30,
      0.65,
      25
    );

    this.motionDetector = new MotionDetector({
      isAngleDecreasingOnFlex: config.isAngleDecreasingOnFlex,
      velocityThresholdDegPerSec: 14,
      displacementThresholdDeg: 5
    });

    this.reset();
  }

  public reset(): void {
    this.state = 'REST';
    this.completedReps = 0;
    this.validReps = 0;
    this.peakRomThisRep = this.config.startAngle;
    this.startRomThisRep = this.config.startAngle;
    this.repStartTimeMs = Date.now();
    this.allRepMetrics = [];
    this.readyFrameCount = 0;
    this.movingFrameCount = 0;
    this.targetDwellTimeMs = 0;
    this.cooldownStartTimeMs = 0;
    this.lastTimestampMs = 0;
    this.repRejectionReason = null;
    this.repAcceptedReason = null;
    this.smoother.reset(this.config.startAngle);
    this.motionDetector.reset(this.config.startAngle);
  }

  public update(
    rawAngle: number,
    confidencePassed: boolean,
    confidenceScore: number,
    timestampMs: number = Date.now()
  ): RepTransitionResult {
    const prevState = this.state;
    let isRepCompletedThisFrame = false;
    let completedRepMetric: SessionRepMetric | null = null;
    let statusMessage = 'Maintain starting position';

    // B22: Use 0 for the very first frame — was 33, which advanced repStartTimeMs artifically
    const dtMs = this.lastTimestampMs > 0 ? Math.max(1, timestampMs - this.lastTimestampMs) : 0;
    this.lastTimestampMs = timestampMs;

    // 1. Landmark Smoothing
    const smoothOutput: SmoothedAngleOutput = this.smoother.filter(rawAngle, timestampMs);
    const currentAngle = smoothOutput.smoothedAngle;
    const angularVelocity = smoothOutput.angularVelocity;

    // 2. Motion Detection (Decoupled from Rep Counting)
    const motionResult: MotionDetectionResult = this.motionDetector.evaluate(
      currentAngle,
      angularVelocity,
      confidencePassed
    );

    // 3. Confidence Gate Handling: If confidence is low, freeze state without losing progress
    if (!confidencePassed) {
      if (this.state === 'MOVING' || this.state === 'TARGET_ZONE' || this.state === 'RETURNING') {
        // Shift rep start time to prevent timeout due to occlusion
        this.repStartTimeMs += dtMs;
      }
      return this.buildResult(
        rawAngle,
        currentAngle,
        angularVelocity,
        prevState,
        isRepCompletedThisFrame,
        null,
        'Movement analysis paused — adjust camera position',
        motionResult,
        confidenceScore
      );
    }

    const {
      startAngle,
      targetAngle,
      returnAngle,
      hysteresisBuffer,
      isAngleDecreasingOnFlex,
      prescribedTargetRom,
      romToleranceDegrees
    } = this.config;

    // Update peak ROM while inside active movement states
    if (this.state === 'MOVING' || this.state === 'TARGET_ZONE' || this.state === 'RETURNING') {
      if (isAngleDecreasingOnFlex) {
        if (currentAngle < this.peakRomThisRep) {
          this.peakRomThisRep = currentAngle;
        }
      } else {
        if (currentAngle > this.peakRomThisRep) {
          this.peakRomThisRep = currentAngle;
        }
      }
    }

    // 4. Exercise State Machine Transitions
    switch (this.state) {
      case 'REST': {
        this.peakRomThisRep = currentAngle;
        this.startRomThisRep = currentAngle;
        this.targetDwellTimeMs = 0;
        this.movingFrameCount = 0;

        // Check if joint is within acceptable starting zone
        const isInStartZone = isAngleDecreasingOnFlex
          ? currentAngle >= (startAngle - hysteresisBuffer)
          : currentAngle <= (startAngle + hysteresisBuffer);

        if (isInStartZone) {
          this.readyFrameCount++;
          if (this.readyFrameCount >= this.readyFramesRequired) {
            this.state = 'READY';
            this.startRomThisRep = currentAngle;
            this.peakRomThisRep = currentAngle;
            this.motionDetector.setAnchorAngle(currentAngle);
            statusMessage = 'Ready — begin movement smoothly';
          } else {
            statusMessage = 'Calibrating starting position...';
          }
        } else {
          this.readyFrameCount = 0;
          statusMessage = 'Position joint at resting posture';
        }
        break;
      }

      case 'READY': {
        statusMessage = 'Ready — begin movement smoothly';

        // Check if user initiated movement in the prescribed anatomical direction past hysteresis boundary
        // B6: Compare to this.startRomThisRep (captured from user's actual resting posture)
        //     NOT config.startAngle (nominal default). Fixes reps never triggering when user's
        //     natural rest angle differs from the clinical default (e.g. 165° vs 170°).
        const hasCrossedThreshold = isAngleDecreasingOnFlex
          ? currentAngle < (this.startRomThisRep - hysteresisBuffer - 2)
          : currentAngle > (this.startRomThisRep + hysteresisBuffer + 2);

        const isCorrectDirection = isAngleDecreasingOnFlex
          ? (motionResult.direction === 'FLEXING' || angularVelocity < -8)
          : (motionResult.direction === 'EXTENDING' || angularVelocity > 8);

        if (hasCrossedThreshold && isCorrectDirection) {
          this.movingFrameCount++;
          // Require 2 consecutive frames to confirm intentional movement (rejects single-frame flutter)
          if (this.movingFrameCount >= 2) {
            this.state = 'MOVING';
            this.repStartTimeMs = timestampMs;
            this.peakRomThisRep = currentAngle;
            this.targetDwellTimeMs = 0;
            this.repRejectionReason = null;
            this.repAcceptedReason = null;
            statusMessage = `Moving — target is ${prescribedTargetRom}°`;
          }
        } else {
          this.movingFrameCount = 0;
          // While stationary or relaxing at rest, keep calibrated to resting posture
          const isAtRestOrRelaxing = isAngleDecreasingOnFlex
            ? currentAngle >= this.startRomThisRep
            : currentAngle <= this.startRomThisRep;
          if (motionResult.direction === 'STATIONARY' || isAtRestOrRelaxing) {
            this.startRomThisRep = currentAngle;
            this.peakRomThisRep = currentAngle;
          }
          // Drift check: if drifted away from start without moving direction, reset to REST
          const hasDriftedFar = isAngleDecreasingOnFlex
            ? currentAngle < (startAngle - hysteresisBuffer - 12)
            : currentAngle > (startAngle + hysteresisBuffer + 12);
          if (hasDriftedFar) {
            this.state = 'REST';
            this.readyFrameCount = 0;
          }
        }
        break;
      }

      case 'MOVING': {
        statusMessage = `Moving — target is ${prescribedTargetRom}°`;
        const currentExcursion = Math.abs(currentAngle - this.startRomThisRep);

        // Check whether target zone is reached
        const reachedTarget = isAngleDecreasingOnFlex
          ? currentAngle <= (targetAngle + romToleranceDegrees / 2)
          : currentAngle >= (targetAngle - romToleranceDegrees / 2);

        // Check whether user reversed movement prematurely before reaching target
        // B7: Removed extra +8 from both sides — that bonus caused micro-jitter past peak to
        //     abort reps mid-movement. hysteresisBuffer alone is sufficient reversal confirmation.
        const returningPrematurely = isAngleDecreasingOnFlex
          ? currentAngle > (this.peakRomThisRep + hysteresisBuffer)
          : currentAngle < (this.peakRomThisRep - hysteresisBuffer);

        // Check for movement timeout (e.g. held halfway or abandoned)
        const isTimedOut = (timestampMs - this.repStartTimeMs) > this.maxRepDurationMs;

        if (reachedTarget) {
          this.targetDwellTimeMs += dtMs;
          if (this.targetDwellTimeMs >= this.minTargetDwellMs) {
            this.state = 'TARGET_ZONE';
            statusMessage = 'Target range reached! Hold momentarily and return';
          }
        } else if (returningPrematurely) {
          // If the excursion reached minimum required ROM, proceed to RETURNING as an under-range rep
          if (currentExcursion >= this.minRomDegrees) {
            this.state = 'RETURNING';
            statusMessage = 'Returning to starting position';
          } else {
            // Small movement / jitter below minimum ROM: REJECT and reset to REST without counting!
            this.repRejectionReason = `Insufficient ROM: excursion ${Math.round(currentExcursion)}° < min ${this.minRomDegrees}°`;
            this.state = 'REST';
            this.readyFrameCount = 0;
            statusMessage = 'Movement too small to count — perform full motion';
          }
        } else if (isTimedOut) {
          this.repRejectionReason = `Movement timed out (> ${Math.round(this.maxRepDurationMs / 1000)}s)`;
          this.state = 'REST';
          this.readyFrameCount = 0;
          statusMessage = 'Movement timed out — return to start and try again';
        }
        break;
      }

      case 'TARGET_ZONE': {
        statusMessage = 'Target reached! Slowly return to starting position';

        // Hysteresis boundary to enter return phase
        const isReturning = isAngleDecreasingOnFlex
          ? currentAngle > (targetAngle + hysteresisBuffer)
          : currentAngle < (targetAngle - hysteresisBuffer);

        const isReturnDirection = isAngleDecreasingOnFlex
          ? (motionResult.direction === 'EXTENDING' || angularVelocity > 8)
          : (motionResult.direction === 'FLEXING' || angularVelocity < -8);

        if (isReturning && isReturnDirection) {
          this.state = 'RETURNING';
          statusMessage = 'Returning to starting position';
        }
        break;
      }

      case 'RETURNING': {
        statusMessage = 'Returning to resting position';

        // Check if returned to start/return boundary
        const returnedToRest = isAngleDecreasingOnFlex
          ? currentAngle >= (returnAngle - 2)
          : currentAngle <= (returnAngle + 2);

        const isTimedOut = (timestampMs - this.repStartTimeMs) > this.maxRepDurationMs;

        if (returnedToRest) {
          const totalExcursion = Math.abs(this.peakRomThisRep - this.startRomThisRep);
          const durationMs = timestampMs - this.repStartTimeMs;

          // ── VALIDATION GATE CHECKS ──
          // 1. Minimum ROM validation
          if (totalExcursion < this.minRomDegrees) {
            this.repRejectionReason = `Insufficient ROM: ${Math.round(totalExcursion)}° < min ${this.minRomDegrees}°`;
            this.state = 'COOLDOWN';
            this.cooldownStartTimeMs = timestampMs;
            statusMessage = `Movement too small (${Math.round(totalExcursion)}° / min ${this.minRomDegrees}°)`;
            break;
          }

          // 2. Minimum duration validation (rejects rapid jitter / camera glitches)
          if (durationMs < this.minRepDurationMs) {
            this.repRejectionReason = `Repetition too fast: ${durationMs}ms < min ${this.minRepDurationMs}ms`;
            this.state = 'COOLDOWN';
            this.cooldownStartTimeMs = timestampMs;
            statusMessage = 'Movement too rapid — maintain controlled tempo';
            break;
          }

          // ── REPETITION VALIDATED & COUNTED ──
          this.completedReps++;
          isRepCompletedThisFrame = true;

          const durationSec = Math.max(0.5, durationMs / 1000);

          // Evaluate clinical target ROM adherence
          const targetMet = isAngleDecreasingOnFlex
            ? this.peakRomThisRep <= (prescribedTargetRom + romToleranceDegrees)
            : this.peakRomThisRep >= (prescribedTargetRom - romToleranceDegrees);

          let flag: string | undefined = undefined;
          if (!targetMet) {
            flag = 'range_below_target';
          } else {
            this.validReps++;
          }

          completedRepMetric = {
            repNumber: this.completedReps,
            peakRom: Math.round(this.peakRomThisRep),
            startRom: Math.round(this.startRomThisRep),
            durationSeconds: Math.round(durationSec * 10) / 10,
            isValid: targetMet,
            flag,
            confidenceScore: Math.round(confidenceScore * 100) / 100
          };

          this.allRepMetrics.push(completedRepMetric);
          this.repAcceptedReason = `Repetition #${this.completedReps} complete (ROM ${Math.round(totalExcursion)}°, ${completedRepMetric.durationSeconds}s)`;

          statusMessage = targetMet
            ? `Repetition ${this.completedReps} complete! Excellent control.`
            : `Repetition ${this.completedReps} recorded. Range below prescribed target.`;

          this.state = 'COMPLETED';
          this.cooldownStartTimeMs = timestampMs;
        } else if (isTimedOut) {
          this.repRejectionReason = 'Return movement timed out';
          this.state = 'REST';
          this.readyFrameCount = 0;
          statusMessage = 'Return movement timed out';
        }
        break;
      }

      case 'COMPLETED': {
        // Transition directly into refractory COOLDOWN
        this.state = 'COOLDOWN';
        this.cooldownStartTimeMs = timestampMs;
        statusMessage = 'Take a breath and prepare for next repetition';
        break;
      }

      case 'COOLDOWN': {
        statusMessage = 'Take a breath and prepare for next repetition';
        const elapsedCooldown = timestampMs - this.cooldownStartTimeMs;

        // Must wait out cooldown duration (anti-double counting)
        if (elapsedCooldown >= this.cooldownMs) {
          // In addition, user MUST be back in resting zone before starting next rep
          // B8: Removed -4/+4 bonus — it let user stay 12° away from start and still count as
          //     rested, causing double-counting on knee/shoulder exercises.
          const isBackInRest = isAngleDecreasingOnFlex
            ? currentAngle >= (startAngle - hysteresisBuffer)
            : currentAngle <= (startAngle + hysteresisBuffer);

          if (isBackInRest) {
            this.state = 'READY';
            this.readyFrameCount = 0;
            this.startRomThisRep = currentAngle;
            this.peakRomThisRep = currentAngle;
            this.motionDetector.setAnchorAngle(currentAngle);
            statusMessage = 'Ready — begin next repetition';
          } else {
            this.state = 'REST';
            this.readyFrameCount = 0;
            statusMessage = 'Return joint to resting position';
          }
        }
        break;
      }
    }

    return this.buildResult(
      rawAngle,
      currentAngle,
      angularVelocity,
      prevState,
      isRepCompletedThisFrame,
      completedRepMetric,
      statusMessage,
      motionResult,
      confidenceScore
    );
  }

  private buildResult(
    rawAngle: number,
    currentAngle: number,
    angularVelocity: number,
    prevState: RepState,
    isRepCompletedThisFrame: boolean,
    completedRepMetric: SessionRepMetric | null,
    statusMessage: string,
    motionResult: MotionDetectionResult,
    confidenceScore: number
  ): RepTransitionResult {
    const excursion = Math.abs(this.peakRomThisRep - this.startRomThisRep);
    const duration = this.state === 'MOVING' || this.state === 'TARGET_ZONE' || this.state === 'RETURNING'
      ? Math.max(0, this.lastTimestampMs - this.repStartTimeMs)
      : 0;

    const debug: RepDebugInfo = {
      rawAngle: Math.round(rawAngle * 10) / 10,
      smoothedAngle: Math.round(currentAngle * 10) / 10,
      angularVelocity: Math.round(angularVelocity * 10) / 10,
      motionState: motionResult.direction === 'STATIONARY' ? 'STATIONARY' : motionResult.direction,
      isMotionDetected: motionResult.isMotionDetected,
      currentRom: Math.round(currentAngle * 10) / 10,
      peakRomThisRep: Math.round(this.peakRomThisRep * 10) / 10,
      startRomThisRep: Math.round(this.startRomThisRep * 10) / 10,
      excursionThisRep: Math.round(excursion * 10) / 10,
      minRomRequired: this.minRomDegrees,
      repDurationMs: duration,
      repRejectionReason: this.repRejectionReason,
      repAcceptedReason: this.repAcceptedReason,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      currentState: this.state
    };

    return {
      currentState: this.state,
      previousState: prevState,
      completedReps: this.completedReps,
      validReps: this.validReps,
      currentRom: currentAngle,
      peakRomThisRep: this.peakRomThisRep,
      isRepCompletedThisFrame,
      completedRepMetric,
      statusMessage,
      smoothedAngle: currentAngle,
      rawAngle: Math.round(rawAngle * 10) / 10,
      angularVelocity,
      isMotionDetected: motionResult.isMotionDetected,
      motionDirection: motionResult.direction,
      repRejectionReason: this.repRejectionReason,
      repAcceptedReason: this.repAcceptedReason,
      debug
    };
  }

  public getMetrics(): SessionRepMetric[] {
    return [...this.allRepMetrics];
  }

  public getSummary(targetReps: number) {
    const total = this.allRepMetrics.length;
    if (total === 0) {
      return {
        completedReps: 0,
        validReps: 0,
        averageRom: 0,
        maxRom: 0,
        flags: []
      };
    }

    // B17: averageRom MUST be mean excursion (|peak - start| per rep), NOT mean peak angle.
    //      The old code reported raw peak angle (e.g. 118°) to the therapist dashboard as
    //      "average ROM", which is clinically wrong (should be the arc, e.g. 37°).
    const romSum = this.allRepMetrics.reduce((sum, r) => sum + Math.abs(r.peakRom - r.startRom), 0);
    const averageRom = Math.round(romSum / total);
    const maxRom = this.config.isAngleDecreasingOnFlex
      ? Math.min(...this.allRepMetrics.map(r => r.peakRom)) // More flexion = smaller angle
      : Math.max(...this.allRepMetrics.map(r => r.peakRom));

    const flags: string[] = [];
    const underRangeCount = this.allRepMetrics.filter(r => r.flag === 'range_below_target').length;
    if (underRangeCount > 0) {
      flags.push('range_below_target');
    }
    if (this.completedReps < targetReps) {
      flags.push('incomplete_target_reps');
    }

    return {
      completedReps: this.completedReps,
      validReps: this.validReps,
      averageRom,
      maxRom,
      flags
    };
  }
}
