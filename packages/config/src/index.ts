import { Exercise } from '@rehabsense/types';

export const MEDICAL_DISCLAIMERS = {
  SHORT: 'RehabSense is a camera-assisted movement monitoring prototype. It does not provide medical diagnoses or replace a licensed physiotherapist.',
  PAIN_WARNING: 'Stop immediately if you experience pain or discomfort and follow your clinician’s guidance.',
  CONFIDENCE_PAUSED: 'Movement analysis paused — we cannot confidently assess your movement. Please adjust your camera or reposition into frame.',
  CLINICIAN_REVIEW: 'Session metrics are recorded for your therapist to review. Targets can be adjusted in consultation with your clinical team.'
};

export const DEMO_CREDENTIALS = {
  PATIENT: {
    email: 'patient@rehabsense.demo',
    password: 'Demo@123',
    name: 'Aarav Mehta',
    role: 'PATIENT'
  },
  THERAPIST: {
    email: 'therapist@rehabsense.demo',
    password: 'Demo@123',
    name: 'Dr. Ananya Sharma',
    role: 'THERAPIST'
  }
};

export const CONFIDENCE_GATE_CONFIG = {
  MIN_LANDMARK_VISIBILITY: 0.70,
  MIN_OVERALL_CONFIDENCE: 0.75,
  DEBOUNCE_FRAMES: 3,
  MAX_FRAME_JITTER_DEGREES: 25.0
};

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'elbow-flexion',
    name: 'Elbow Flexion & Extension',
    description: 'Controlled bending and straightening of the elbow joint to improve range of motion and upper-limb functional mobility.',
    bodyRegion: 'Upper Limb',
    difficulty: 'Beginner',
    cameraView: 'Frontal (Full Body)',
    targetJoint: 'Elbow',
    requiredLandmarks: ['left_shoulder', 'left_elbow', 'left_wrist'],
    instructions: [
      'Position your device camera 6 to 8 feet away at elbow height.',
      'Stand or sit upright with your arm resting at your side.',
      'Smoothly bend your elbow, bringing your hand towards your shoulder.',
      'Pause for 1 second at the top of the movement.',
      'Slowly lower your hand back down to the resting position.'
    ],
    commonFeedback: [
      'Maintain an upright posture without leaning sideways.',
      'Keep your upper arm stationary against your torso.',
      'Ensure your hand and elbow stay clearly visible in the camera frame.'
    ],
    defaultRom: {
      min: 40,
      max: 140,
      target: 120,
      unit: 'degrees'
    },
    repStateMachine: {
      startAngle: 155,
      targetAngle: 120,
      returnAngle: 145,
      hysteresisBuffer: 8
    }
  },
  {
    id: 'shoulder-flexion',
    name: 'Shoulder Flexion',
    description: 'Forward elevation of the arm in the sagittal plane to restore glenohumeral mobility and functional reach.',
    bodyRegion: 'Upper Limb',
    difficulty: 'Intermediate',
    cameraView: 'Sagittal (Side Profile)',
    targetJoint: 'Shoulder',
    requiredLandmarks: ['left_hip', 'left_shoulder', 'left_elbow'],
    instructions: [
      'Stand side-on to your camera so your profile is clearly visible.',
      'Keep your thumb pointing upward and elbow comfortably straight.',
      'Raise your arm forward and upward within your prescribed comfort zone.',
      'Hold momentarily at your peak reach.',
      'Gently lower your arm under control back to your side.'
    ],
    commonFeedback: [
      'Do not arch your lower back to force extra height.',
      'Keep your shoulder relaxed and away from your ear.',
      'Stop before you reach a point of sharp pain or pinch.'
    ],
    defaultRom: {
      min: 50,
      max: 160,
      target: 135,
      unit: 'degrees'
    },
    repStateMachine: {
      startAngle: 30,
      targetAngle: 125,
      returnAngle: 45,
      hysteresisBuffer: 10
    }
  },
  {
    id: 'sit-to-stand',
    name: 'Sit-to-Stand Functional Transfer',
    description: 'Functional lower-limb strengthening and hip/knee extension stability transfer from a standard chair.',
    bodyRegion: 'Lower Limb',
    difficulty: 'Intermediate',
    cameraView: 'Frontal (Full Body)',
    targetJoint: 'Knee & Hip',
    requiredLandmarks: ['left_shoulder', 'left_hip', 'left_knee', 'left_ankle'],
    instructions: [
      'Place a sturdy chair in view of your camera, 8 to 10 feet away.',
      'Cross your arms across your chest or keep hands resting on your thighs.',
      'Lean slightly forward and push through your heels to stand fully upright.',
      'Pause with hips and knees extended.',
      'Slowly lower yourself back into the seat under control.'
    ],
    commonFeedback: [
      'Keep your knees tracking over your second toe, avoid knee collapse inward.',
      'Avoid using momentum or rocking backwards.',
      'Make sure full body from head to feet remains inside the camera framing.'
    ],
    defaultRom: {
      min: 80,
      max: 175,
      target: 165,
      unit: 'degrees'
    },
    repStateMachine: {
      startAngle: 90,
      targetAngle: 160,
      returnAngle: 105,
      hysteresisBuffer: 10
    }
  }
];
