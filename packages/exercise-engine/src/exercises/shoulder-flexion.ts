import { Point2D, calculateJointAngle, MEDIAPIPE_LANDMARK_INDEX } from '../angle-calculator';
import { ConfidenceGate } from '../confidence-gate';
import { RepetitionStateMachine } from '../rep-state-machine';
import { FeedbackEngine } from '../feedback-engine';
import { ExerciseFrameAnalysis } from './elbow-flexion';

export class ShoulderFlexionAnalyzer {
  private confidenceGate: ConfidenceGate;
  private stateMachine: RepetitionStateMachine;
  private feedbackEngine: FeedbackEngine;
  private targetReps: number;

  constructor(
    prescribedTargetRom = 135,
    targetReps = 10,
    voiceEnabled = true
  ) {
    this.targetReps = targetReps;
    this.confidenceGate = new ConfidenceGate(0.70, 0.75);
    this.stateMachine = new RepetitionStateMachine({
      startAngle: 30,
      targetAngle: prescribedTargetRom,
      returnAngle: 45,
      hysteresisBuffer: 10,
      isAngleDecreasingOnFlex: false, // Elevation increases angle
      prescribedTargetRom,
      romToleranceDegrees: 10
    });
    this.feedbackEngine = new FeedbackEngine(voiceEnabled);
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.feedbackEngine.setVoiceEnabled(enabled);
  }

  public processFrame(landmarks: Point2D[]): ExerciseFrameAnalysis {
    const requiredLandmarkNames = ['left_hip', 'left_shoulder', 'left_elbow'];
    const activeJointIndices = [
      MEDIAPIPE_LANDMARK_INDEX['left_hip'],
      MEDIAPIPE_LANDMARK_INDEX['left_shoulder'],
      MEDIAPIPE_LANDMARK_INDEX['left_elbow']
    ];

    const confidenceResult = this.confidenceGate.evaluate(landmarks, requiredLandmarkNames);

    let jointAngle = 0;
    if (landmarks && landmarks.length > 23) {
      const hip = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_hip']];
      const shoulder = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_shoulder']];
      const elbow = landmarks[MEDIAPIPE_LANDMARK_INDEX['left_elbow']];
      jointAngle = calculateJointAngle(hip, shoulder, elbow);
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
