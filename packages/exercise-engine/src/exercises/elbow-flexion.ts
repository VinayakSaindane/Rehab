import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from '../angle-calculator';
import { ConfidenceGate, ConfidenceGateResult } from '../confidence-gate';
import { CompensationDetector, CompensationResult } from '../compensation-detector';
import { RepetitionStateMachine, RepTransitionResult } from '../rep-state-machine';
import { FeedbackEngine } from '../feedback-engine';
import { FeedbackEvent, SupportedLanguage } from '@rehabsense/types';

export interface ExerciseFrameAnalysis {
  jointAngle: number;
  confidenceResult: ConfidenceGateResult;
  repResult: RepTransitionResult;
  feedbackEvent: FeedbackEvent;
  compensationResult: CompensationResult;
  landmarks: Point2D[];
  activeJointIndices: number[];
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
    this.confidenceGate = new ConfidenceGate(0.70, 0.75);
    this.compensationDetector = new CompensationDetector();
    this.stateMachine = new RepetitionStateMachine({
      startAngle: 155,
      targetAngle: prescribedTargetRom,
      returnAngle: 145,
      hysteresisBuffer: 8,
      isAngleDecreasingOnFlex: true,
      prescribedTargetRom,
      romToleranceDegrees: 8
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

  public processFrame(landmarks: Point2D[]): ExerciseFrameAnalysis {
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
    let jointAngle = 0;
    if (landmarks && landmarks.length > 15) {
      const shoulder = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_shoulder`]];
      const elbow = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_elbow`]];
      const wrist = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_wrist`]];
      jointAngle = calculateJointAngle(shoulder, elbow, wrist, true);
    }

    // 3. Update Repetition State Machine (passes confidence gating result)
    const repResult = this.stateMachine.update(
      jointAngle,
      confidenceResult.isPassing,
      confidenceResult.overallConfidence
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
      jointAngle,
      confidenceResult,
      repResult,
      compensationResult,
      feedbackEvent,
      landmarks,
      activeJointIndices
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
