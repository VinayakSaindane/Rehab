import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from '../angle-calculator';
import { ConfidenceGate } from '../confidence-gate';
import { CompensationDetector } from '../compensation-detector';
import { RepetitionStateMachine } from '../rep-state-machine';
import { FeedbackEngine } from '../feedback-engine';
import { ExerciseFrameAnalysis } from './elbow-flexion';
import { getExerciseConfig } from '../exercise-configs';
import { SupportedLanguage } from '@rehabsense/types';

export class KneeExtensionAnalyzer {
  private confidenceGate: ConfidenceGate;
  private compensationDetector: CompensationDetector;
  private stateMachine: RepetitionStateMachine;
  private feedbackEngine: FeedbackEngine;
  private targetReps: number;
  private side: 'left' | 'right';

  constructor(
    prescribedTargetRom = 170,
    targetReps = 10,
    voiceEnabled = true,
    side: 'left' | 'right' = 'left',
    language: SupportedLanguage = 'en'
  ) {
    this.targetReps = targetReps;
    this.side = side;
    const profile = getExerciseConfig('knee-extension', prescribedTargetRom);

    this.confidenceGate = new ConfidenceGate(profile.confidenceThreshold, 0.75, 2);
    this.compensationDetector = new CompensationDetector();
    this.stateMachine = new RepetitionStateMachine({
      startAngle: profile.startAngle,
      targetAngle: profile.defaultTargetAngle,
      returnAngle: profile.returnAngle,
      hysteresisBuffer: profile.hysteresisBuffer,
      isAngleDecreasingOnFlex: profile.isAngleDecreasingOnFlex,
      prescribedTargetRom,
      romToleranceDegrees: profile.romToleranceDegrees,
      minRomDegrees: profile.minRomDegrees,
      minRepDurationMs: profile.minRepDurationMs,
      maxRepDurationMs: profile.maxRepDurationMs,
      minTargetDwellMs: profile.minTargetDwellMs,
      cooldownMs: profile.cooldownMs,
      readyFramesRequired: profile.readyFramesRequired,
      smoothingAlpha: profile.smoothingAlpha
    });
    this.feedbackEngine = new FeedbackEngine(voiceEnabled, language);
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.feedbackEngine.setVoiceEnabled(enabled);
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.feedbackEngine.setLanguage(lang);
  }

  public setSide(side: 'left' | 'right'): void {
    this.side = side;
  }

  public getSide(): 'left' | 'right' {
    return this.side;
  }

  public processFrame(landmarks: Point2D[], timestampMs: number = Date.now()): ExerciseFrameAnalysis {
    const prefix = this.side === 'right' ? 'right' : 'left';
    const requiredLandmarkNames = [`${prefix}_hip`, `${prefix}_knee`, `${prefix}_ankle`];
    const activeJointIndices = [
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_hip`],
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_knee`],
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_ankle`]
    ];

    const confidenceResult = this.confidenceGate.evaluate(landmarks, requiredLandmarkNames);

    let rawAngle = 0;
    if (landmarks && landmarks.length > 27) {
      const hip = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_hip`]];
      const knee = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_knee`]];
      const ankle = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_ankle`]];
      rawAngle = calculateJointAngle(hip, knee, ankle, true);
    }

    const repResult = this.stateMachine.update(
      rawAngle,
      confidenceResult.isPassing,
      confidenceResult.overallConfidence,
      timestampMs
    );

    const inRep = repResult.currentState === 'MOVING' || repResult.currentState === 'TARGET_ZONE';
    const compensationResult = confidenceResult.isPassing
      ? this.compensationDetector.evaluate(landmarks, inRep)
      : { hasCompensation: false, compensation_flags: [], reasons: [] };

    const feedbackEvent = this.feedbackEngine.generateFeedback(
      confidenceResult,
      repResult,
      this.targetReps,
      compensationResult,
      this.side
    );

    return {
      jointAngle: repResult.smoothedAngle,
      rawAngle: repResult.rawAngle,
      smoothedAngle: repResult.smoothedAngle,
      confidenceResult,
      repResult,
      compensationResult,
      feedbackEvent,
      landmarks,
      activeJointIndices,
      debug: repResult.debug
    };
  }

  public getSummary() {
    return this.stateMachine.getSummary(this.targetReps);
  }

  public getDetailedMetrics() {
    return this.stateMachine.getMetrics();
  }

  public reset(): void {
    this.confidenceGate.reset();
    this.compensationDetector.reset();
    this.stateMachine.reset();
  }
}
