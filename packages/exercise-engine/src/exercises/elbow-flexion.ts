import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from '../angle-calculator';
import { ConfidenceGate, ConfidenceGateResult } from '../confidence-gate';
import { CompensationDetector, CompensationResult } from '../compensation-detector';
import { RepetitionStateMachine, RepTransitionResult, RepDebugInfo } from '../rep-state-machine';
import { FeedbackEngine } from '../feedback-engine';
import { getExerciseConfig } from '../exercise-configs';
import { FeedbackEvent, SupportedLanguage } from '@rehabsense/types';

export interface ExerciseFrameAnalysis {
  jointAngle: number;
  rawAngle: number;
  smoothedAngle: number;
  confidenceResult: ConfidenceGateResult;
  repResult: RepTransitionResult;
  feedbackEvent: FeedbackEvent;
  compensationResult: CompensationResult;
  landmarks: Point2D[];
  activeJointIndices: number[];
  debug: RepDebugInfo;
}

export class ElbowFlexionAnalyzer {
  private confidenceGate: ConfidenceGate;
  private compensationDetector: CompensationDetector;
  private stateMachine: RepetitionStateMachine;
  private feedbackEngine: FeedbackEngine;
  private targetReps: number;
  private side: 'left' | 'right';

  constructor(
    prescribedTargetRom = 120,
    targetReps = 10,
    voiceEnabled = true,
    side: 'left' | 'right' = 'left',
    language: SupportedLanguage = 'en'
  ) {
    this.targetReps = targetReps;
    this.side = side;
    const profile = getExerciseConfig('elbow-flexion', prescribedTargetRom);

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
    const requiredLandmarkNames = [`${prefix}_shoulder`, `${prefix}_elbow`, `${prefix}_wrist`];
    const activeJointIndices = [
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_shoulder`],
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_elbow`],
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_wrist`]
    ];

    // 1. Evaluate Confidence Gate
    const confidenceResult = this.confidenceGate.evaluate(landmarks, requiredLandmarkNames);

    // 2. Calculate Angle (Shoulder - Elbow - Wrist)
    let rawAngle = 0;
    if (landmarks && landmarks.length > 15) {
      const shoulder = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_shoulder`]];
      const elbow = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_elbow`]];
      const wrist = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_wrist`]];
      rawAngle = calculateJointAngle(shoulder, elbow, wrist, true);
    }

    // 3. Update Repetition State Machine (passes confidence gating result & timestamp)
    const repResult = this.stateMachine.update(
      rawAngle,
      confidenceResult.isPassing,
      confidenceResult.overallConfidence,
      timestampMs
    );

    // 4. Evaluate Compensatory Movement (only when confidence passes & actively repping)
    const inRep = repResult.currentState === 'MOVING' || repResult.currentState === 'TARGET_ZONE';
    const compensationResult = confidenceResult.isPassing
      ? this.compensationDetector.evaluate(landmarks, inRep)
      : { hasCompensation: false, compensation_flags: [], reasons: [] };

    // 5. Generate Explainable Feedback
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
