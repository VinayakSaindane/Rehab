export type UserRole = 'PATIENT' | 'THERAPIST' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  email: string;
  age: number;
  conditionLabel: string; // e.g. "Post-operative upper-limb rehabilitation"
  therapistId: string;
  therapistName: string;
  currentStreakDays: number;
  totalSessionsCompleted: number;
  createdAt: string;
}

export interface Therapist {
  id: string;
  userId: string;
  name: string;
  email: string;
  title: string; // e.g. "Lead Musculoskeletal Physiotherapist"
  clinicName: string;
  activePatientsCount: number;
}

export interface ExerciseRepThresholds {
  startAngle: number;
  targetAngle: number;
  returnAngle: number;
  hysteresisBuffer: number;
}

export interface ExerciseRomDefinition {
  min: number;
  max: number;
  target: number;
  unit: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  bodyRegion: 'Upper Limb' | 'Lower Limb' | 'Core & Trunk' | 'Spine';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  cameraView: 'Frontal (Full Body)' | 'Sagittal (Side Profile)';
  requiredLandmarks: string[];
  instructions: string[];
  commonFeedback: string[];
  defaultRom: ExerciseRomDefinition;
  repStateMachine: ExerciseRepThresholds;
  targetJoint: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  therapistId: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  targetReps: number;
  targetRom: number;
  minRom: number;
  maxRom: number;
  tempoSeconds: {
    concentric: number;
    eccentric: number;
  };
  holdDurationSeconds: number;
  frequencyPerDay: number;
  notes: string;
  cameraOrientation: 'Frontal (Full Body)' | 'Sagittal (Side Profile)';
  feedbackEnabled: boolean;
  status: 'ACTIVE' | 'ADJUSTED' | 'COMPLETED' | 'ARCHIVED';
  updatedAt: string;
}

export interface SessionRepMetric {
  repNumber: number;
  peakRom: number;
  startRom: number;
  durationSeconds: number;
  isValid: boolean;
  flag?: string; // e.g. "range_below_target"
  confidenceScore: number;
}

export interface Session {
  id: string;
  patientId: string;
  prescriptionId?: string;
  exerciseId: string;
  exerciseName: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  targetReps: number;
  completedReps: number;
  validReps: number;
  averageRom: number;
  maxRom: number;
  trackingConfidence: number; // 0.0 - 1.0
  formFlags: string[];
  jointMetrics: SessionRepMetric[];
  patientNotes?: string;
  reviewStatus: 'PENDING_REVIEW' | 'REVIEWED' | 'OVERRIDDEN';
  isManualLog?: boolean;
}

export interface TherapistReview {
  id: string;
  sessionId: string;
  patientId: string;
  therapistId: string;
  reviewedAt: string;
  action: 'ACCEPTED' | 'OVERRIDDEN';
  clinicalReason?: string;
  previousTargetRom?: number;
  newTargetRom?: number;
  notes?: string;
}

export type FeedbackSeverity = 'info' | 'warning' | 'success';

export interface FeedbackEvent {
  type: 'RANGE_LOW' | 'RANGE_GOOD' | 'REP_COMPLETE' | 'PAUSED_CONFIDENCE' | 'REST' | 'COMPLETED' | 'CAMERA_ADJUST';
  message: string;
  severity: FeedbackSeverity;
  timestamp: number;
}

export interface CameraReadinessResult {
  isReady: boolean;
  bodyVisible: boolean;
  lightingAcceptable: boolean;
  poseDetected: boolean;
  requiredLandmarksFound: boolean;
  trackingConfidence: number;
  suggestions: string[];
}
