import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from '../angle-calculator';
import { ConfidenceGate } from '../confidence-gate';
import { RepetitionStateMachine } from '../rep-state-machine';
import { FeedbackEngine } from '../feedback-engine';
import { ExerciseFrameAnalysis } from './elbow-flexion';

export class SitToStandAnalyzer {
  private confidenceGate: ConfidenceGate;
  private stateMachine: RepetitionStateMachine;
  private feedbackEngine: FeedbackEngine;
  private targetReps: number;

  constructor(
    prescribedTargetRom = 165,
    targetReps = 10,
    voiceEnabled = true
  ) {
    this.targetReps = targetReps;
    this.confidenceGate = new ConfidenceGate(0.70, 0.75);
    this.stateMachine = new RepetitionStateMachine({
      startAngle: 90, // Seated ~ 90 degrees knee bend
      targetAngle: prescribedTargetRom, // Standing ~ 165-175 degrees
      returnAngle: 105,
      hysteresisBuffer: 10,
      isAngleDecreasingOnFlex: false, // Standing increases angle
      prescribedTargetRom,
      romToleranceDegrees: 10
    });
    this.feedbackEngine = new FeedbackEngine(voiceEnabled);
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.feedbackEngine.setVoiceEnabled(enabled);
  }

  public processFrame(landmarks: Point2D[]): ExerciseFrameAnalysis {
    const requiredLandmarkNames = ['left_hip', 'left_knee', 'left_ankle'];
    const activeJointIndices = [
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_knee'],
      MEDIAPIPE_LANDMARK_INDEX['left_ankle']
    ];

    const confidenceResult = this.confidenceGate.evaluate(landmarks, requiredLandmarkNames);

    let jointAngle = 0;
    if (landmarks && landmarks.length > 27) {
      const hip = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_hip']];
      const knee = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_knee']];
      const ankle = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_ankle']];
      jointAngle = calculateJointAngle(hip, knee, ankle);
    }

    const repResult = this.stateMachine.update(
      jointAngle,
      confidenceResult.isPassing,
      confidenceResult.overallConfidence
    );

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
