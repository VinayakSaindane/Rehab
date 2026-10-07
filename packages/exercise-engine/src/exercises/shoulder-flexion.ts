import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from '../angle-calculator';
import { ConfidenceGate } from '../confidence-gate';
import { CompensationDetector, CompensationResult } from '../compensation-detector';
import { RepetitionStateMachine } from '../rep-state-machine';
import { FeedbackEngine } from '../feedback-engine';
import { ExerciseFrameAnalysis } from './elbow-flexion';
import { SupportedLanguage } from '@rehabsense/types';

export class ShoulderFlexionAnalyzer {
  private confidenceGate: ConfidenceGate;
  private compensationDetector: CompensationDetector;
  private stateMachine: RepetitionStateMachine;
  private feedbackEngine: FeedbackEngine;
  private targetReps: number;
  private side: 'left' | 'right';

  constructor(
    prescribedTargetRom = 135,
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
      startAngle: 30,
      targetAngle: prescribedTargetRom,
      returnAngle: 45,
      hysteresisBuffer: 10,
      isAngleDecreasingOnFlex: false, // Elevation increases angle
      prescribedTargetRom,
      romToleranceDegrees: 10
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
    const requiredLandmarkNames = [`${prefix}_hip`, `${prefix}_shoulder`, `${prefix}_elbow`];
    const activeJointIndices = [
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_hip`],
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_shoulder`],
      MEDIAPIPE_LANDMARK_INDEX[`${prefix}_elbow`]
    ];

    const confidenceResult = this.confidenceGate.evaluate(landmarks, requiredLandmarkNames);

    let jointAngle = 0;
    if (landmarks && landmarks.length > 23) {
      const hip = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_hip`]];
      const shoulder = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_shoulder`]];
      const elbow = landmarks[MEDIAPIPE_LANDMARK_INDEX[`${prefix}_elbow`]];
      jointAngle = calculateJointAngle(hip, shoulder, elbow, true);
    }

    const repResult = this.stateMachine.update(
      jointAngle,
      confidenceResult.isPassing,
      confidenceResult.overallConfidence
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
