import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from '../angle-calculator';
import { ConfidenceGate, ConfidenceGateResult } from '../confidence-gate';
import { RepetitionStateMachine, RepTransitionResult } from '../rep-state-machine';
import { FeedbackEngine } from '../feedback-engine';
import { FeedbackEvent } from '@rehabsense/types';

export interface ExerciseFrameAnalysis {
  jointAngle: number;
  confidenceResult: ConfidenceGateResult;
  repResult: RepTransitionResult;
  feedbackEvent: FeedbackEvent;
  landmarks: Point2D[];
  activeJointIndices: number[];
}

export class ElbowFlexionAnalyzer {
  private confidenceGate: ConfidenceGate;
  private stateMachine: RepetitionStateMachine;
  private feedbackEngine: FeedbackEngine;
  private targetReps: number;

  constructor(
    prescribedTargetRom = 120,
    targetReps = 10,
    voiceEnabled = true
  ) {
    this.targetReps = targetReps;
    this.confidenceGate = new ConfidenceGate(0.70, 0.75);
    this.stateMachine = new RepetitionStateMachine({
      startAngle: 155,
      targetAngle: prescribedTargetRom,
      returnAngle: 145,
      hysteresisBuffer: 8,
      isAngleDecreasingOnFlex: true,
      prescribedTargetRom,
      romToleranceDegrees: 8
    });
    this.feedbackEngine = new FeedbackEngine(voiceEnabled);
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.feedbackEngine.setVoiceEnabled(enabled);
  }

  public processFrame(landmarks: Point2D[]): ExerciseFrameAnalysis {
    const requiredLandmarkNames = ['left_shoulder', 'left_elbow', 'left_wrist'];
    const activeJointIndices = [
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_elbow'],
      MEDIAPIPE_LANDMARK_INDEX['left_wrist']
    ];

    // 1. Evaluate Confidence Gate
    const confidenceResult = this.confidenceGate.evaluate(landmarks, requiredLandmarkNames);

    // 2. Calculate Angle (Shoulder - Elbow - Wrist)
    let jointAngle = 0;
    if (landmarks && landmarks.length > 15) {
      const shoulder = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_shoulder']];
      const elbow = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_elbow']];
      const wrist = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_wrist']];
      jointAngle = calculateJointAngle(shoulder, elbow, wrist);
    }

    // 3. Update Repetition State Machine (passes confidence gating result)
    const repResult = this.stateMachine.update(
      jointAngle,
      confidenceResult.isPassing,
      confidenceResult.overallConfidence
    );

    // 4. Generate Explainable Feedback
    const feedbackEvent = this.feedbackEngine.generateFeedback(
      confidenceResult,
      repResult,
      this.targetReps
    );

    return {
      jointAngle,
      confidenceResult,
      repResult,
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
    this.stateMachine.reset();
  }
}
