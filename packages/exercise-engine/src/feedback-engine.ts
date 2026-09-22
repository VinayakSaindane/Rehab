import { FeedbackEvent } from '@rehabsense/types';
import { RepTransitionResult } from './rep-state-machine';
import { ConfidenceGateResult } from './confidence-gate';

export class FeedbackEngine {
  private lastSpokenMessage: string = '';
  private lastSpokenTimeMs: number = 0;
  private speechSynthesisEnabled: boolean = true;
  private lastEmittedEvent: FeedbackEvent | null = null;

  constructor(speechSynthesisEnabled = true) {
    this.speechSynthesisEnabled = speechSynthesisEnabled;
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.speechSynthesisEnabled = enabled;
  }

  public generateFeedback(
    confidenceResult: ConfidenceGateResult,
    repResult: RepTransitionResult,
    targetReps: number
  ): FeedbackEvent {
    const now = Date.now();

    // 1. Critical Priority: Confidence Gate Paused
    if (confidenceResult.isGated) {
      const event: FeedbackEvent = {
        type: 'PAUSED_CONFIDENCE',
        message: confidenceResult.reason || 'Movement analysis paused — please adjust your camera.',
        severity: 'warning',
        timestamp: now
      };
      this.maybeSpeak(event.message, 4000);
      this.lastEmittedEvent = event;
      return event;
    }

    // 2. Repetition Completed
    if (repResult.isRepCompletedThisFrame && repResult.completedRepMetric) {
      const isTargetMet = repResult.completedRepMetric.isValid;
      const repNum = repResult.completedReps;

      if (repNum >= targetReps) {
        const event: FeedbackEvent = {
          type: 'COMPLETED',
          message: `Prescribed target of ${targetReps} reps completed! You may finish your session.`,
          severity: 'success',
          timestamp: now
        };
        this.maybeSpeak(event.message, 3000);
        this.lastEmittedEvent = event;
        return event;
      }

      if (isTargetMet) {
        const event: FeedbackEvent = {
          type: 'REP_COMPLETE',
          message: `Repetition ${repNum} completed. Well controlled movement.`,
          severity: 'success',
          timestamp: now
        };
        this.maybeSpeak(`Rep ${repNum}`, 2000);
        this.lastEmittedEvent = event;
        return event;
      } else {
        const event: FeedbackEvent = {
          type: 'RANGE_LOW',
          message: `Repetition ${repNum} recorded. Movement was below the prescribed range.`,
          severity: 'warning',
          timestamp: now
        };
        this.maybeSpeak(`Rep ${repNum}, range below target`, 2500);
        this.lastEmittedEvent = event;
        return event;
      }
    }

    // 3. In-flight status
    let message = repResult.statusMessage;
    let severity: 'info' | 'success' | 'warning' = 'info';

    if (repResult.currentState === 'TARGET_ZONE') {
      message = 'Target reached — control the return motion';
      severity = 'success';
    } else if (repResult.currentState === 'MOVING') {
      message = 'Smooth movement detected';
      severity = 'info';
    }

    const event: FeedbackEvent = {
      type: repResult.currentState === 'TARGET_ZONE' ? 'RANGE_GOOD' : 'REST',
      message,
      severity,
      timestamp: now
    };

    return event;
  }

  private maybeSpeak(text: string, throttleMs = 2500): void {
    if (!this.speechSynthesisEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (text === this.lastSpokenMessage && (now - this.lastSpokenTimeMs) < throttleMs) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;
      window.speechSynthesis.speak(utterance);
      this.lastSpokenMessage = text;
      this.lastSpokenTimeMs = now;
    } catch {
      // Audio synthesis fallback silently ignored if blocked by browser policy
    }
  }
}
