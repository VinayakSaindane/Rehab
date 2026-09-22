import { SessionRepMetric } from '@rehabsense/types';

export type RepState = 'REST' | 'MOVING' | 'TARGET_ZONE' | 'RETURNING' | 'COMPLETED';

export interface RepStateMachineConfig {
  startAngle: number;
  targetAngle: number;
  returnAngle: number;
  hysteresisBuffer: number;
  isAngleDecreasingOnFlex: boolean; // True for elbow flexion (160 -> 120), false for shoulder elevation (30 -> 135)
  prescribedTargetRom: number;
  romToleranceDegrees: number;
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

  constructor(config: RepStateMachineConfig) {
    this.config = config;
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
  }

  public update(
    currentAngle: number,
    confidencePassed: boolean,
    confidenceScore: number
  ): RepTransitionResult {
    const prevState = this.state;
    let isRepCompletedThisFrame = false;
    let completedRepMetric: SessionRepMetric | null = null;
    let statusMessage = 'Maintain starting position';

    // If confidence is gated, pause state machine without losing progress, but do not advance
    if (!confidencePassed) {
      return {
        currentState: this.state,
        previousState: prevState,
        completedReps: this.completedReps,
        validReps: this.validReps,
        currentRom: currentAngle,
        peakRomThisRep: this.peakRomThisRep,
        isRepCompletedThisFrame: false,
        completedRepMetric: null,
        statusMessage: 'Movement analysis paused — adjust camera position'
      };
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

    // Track peak ROM achieved during the rep
    if (this.state !== 'REST') {
      if (isAngleDecreasingOnFlex) {
        // Lower angle means greater flexion (e.g. 160 -> 120)
        if (currentAngle < this.peakRomThisRep) {
          this.peakRomThisRep = currentAngle;
        }
      } else {
        // Higher angle means greater elevation (e.g. 30 -> 135)
        if (currentAngle > this.peakRomThisRep) {
          this.peakRomThisRep = currentAngle;
        }
      }
    }

    switch (this.state) {
      case 'REST': {
        this.peakRomThisRep = currentAngle;
        this.startRomThisRep = currentAngle;
        statusMessage = 'Ready — begin movement smoothly';

        const hasStarted = isAngleDecreasingOnFlex
          ? currentAngle < (startAngle - hysteresisBuffer)
          : currentAngle > (startAngle + hysteresisBuffer);

        if (hasStarted) {
          this.state = 'MOVING';
          this.repStartTimeMs = Date.now();
          statusMessage = 'Moving towards prescribed target';
        }
        break;
      }

      case 'MOVING': {
        statusMessage = `Moving — target is ${prescribedTargetRom}°`;

        const reachedTarget = isAngleDecreasingOnFlex
          ? currentAngle <= targetAngle
          : currentAngle >= targetAngle;

        const returningPrematurely = isAngleDecreasingOnFlex
          ? currentAngle > (this.peakRomThisRep + hysteresisBuffer + 10)
          : currentAngle < (this.peakRomThisRep - hysteresisBuffer - 10);

        if (reachedTarget) {
          this.state = 'TARGET_ZONE';
          statusMessage = 'Target range reached! Hold momentarily and return';
        } else if (returningPrematurely) {
          // Patient began returning without reaching full target
          this.state = 'RETURNING';
          statusMessage = 'Returning to starting position';
        }
        break;
      }

      case 'TARGET_ZONE': {
        statusMessage = 'Great range! Slowly return to starting position';

        const isReturning = isAngleDecreasingOnFlex
          ? currentAngle > (targetAngle + hysteresisBuffer)
          : currentAngle < (targetAngle - hysteresisBuffer);

        if (isReturning) {
          this.state = 'RETURNING';
        }
        break;
      }

      case 'RETURNING': {
        statusMessage = 'Returning to resting position';

        const returnedToRest = isAngleDecreasingOnFlex
          ? currentAngle >= returnAngle
          : currentAngle <= returnAngle;

        if (returnedToRest) {
          this.state = 'COMPLETED';
          this.completedReps++;
          isRepCompletedThisFrame = true;

          const durationSec = Math.max(1, (Date.now() - this.repStartTimeMs) / 1000);

          // Evaluate whether target was reached within clinical tolerance
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
          statusMessage = targetMet
            ? `Repetition ${this.completedReps} complete! Excellent control.`
            : `Repetition ${this.completedReps} completed. Range below prescribed target.`;
        }
        break;
      }

      case 'COMPLETED': {
        // Automatically reset to REST for subsequent repetition
        this.state = 'REST';
        this.peakRomThisRep = currentAngle;
        this.startRomThisRep = currentAngle;
        statusMessage = 'Take a breath and begin next repetition';
        break;
      }
    }

    return {
      currentState: this.state,
      previousState: prevState,
      completedReps: this.completedReps,
      validReps: this.validReps,
      currentRom: currentAngle,
      peakRomThisRep: this.peakRomThisRep,
      isRepCompletedThisFrame,
      completedRepMetric,
      statusMessage
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

    const romSum = this.allRepMetrics.reduce((sum, r) => sum + r.peakRom, 0);
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
