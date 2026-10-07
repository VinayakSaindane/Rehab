/**
 * Client-Side Mock Persistence & Data Engine
 * 
 * Provides local storage backing for Users, Patients, Therapists, Hospitals,
 * Medical Documents, Assignments, and Treatment Plans.
 * Designed to be modular so real backend REST APIs can swap in later.
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'therapist' | 'hospital';
}

export interface MockPatient {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  hospitalId: string;
  therapistId?: string;
  condition: string;
  surgeryDate?: string;
  status: 'Active' | 'Unassigned' | 'Completed';
  currentStreakDays?: number;
  totalSessions?: number;
  phone?: string;
}

export interface MockTherapist {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialty: string;
  hospitalId?: string;
  phone?: string;
}

export interface MockHospital {
  id: string;
  name: string;
  email: string;
  city?: string;
}

export interface MockDocument {
  id: string;
  patientId: string;
  name: string;
  type: 'MRI' | 'X-Ray' | 'Prescription' | 'Physiotherapy Assessment' | 'Previous Treatment Report' | 'Diagnosis Report' | 'Lab Report' | 'Other';
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string; // hospitalId or userId
  uploaderName?: string;
  summary?: string;
  fileData?: string; // Data URL for uploaded or previewable content
}

export interface MockAssignment {
  patientId: string;
  therapistId: string;
  hospitalId: string;
  assignedAt: string;
  status: string;
}

export interface MockTreatmentPlan {
  patientId: string;
  exerciseId: string;
  exerciseName: string;
  targetRom: number;
  targetReps: number;
  sets: number;
  frequencyPerDay: number;
  notes: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  USERS: 'rehab_users',
  PATIENTS: 'rehab_patients',
  THERAPISTS: 'rehab_therapists',
  HOSPITALS: 'rehab_hospitals',
  DOCUMENTS: 'rehab_documents',
  ASSIGNMENTS: 'rehab_assignments',
  TREATMENT_PLANS: 'rehab_treatment_plans',
  INITIALIZED: 'rehab_data_initialized_v2',
};

// Seed Data
const SEED_USERS: MockUser[] = [
  {
    id: 'patient-001',
    name: 'Demo Patient',
    email: 'patient@demo.com',
    password: 'demo123',
    role: 'patient',
  },
  {
    id: 'therapist-001',
    name: 'Dr. Demo',
    email: 'doctor@demo.com',
    password: 'demo123',
    role: 'therapist',
  },
  {
    id: 'hospital-001',
    name: 'Demo Hospital',
    email: 'hospital@demo.com',
    password: 'demo123',
    role: 'hospital',
  },
  {
    id: 'patient-002',
    name: 'Priya Patel',
    email: 'priya@demo.com',
    password: 'demo123',
    role: 'patient',
  },
  {
    id: 'patient-003',
    name: 'Aarav Sharma',
    email: 'aarav@demo.com',
    password: 'demo123',
    role: 'patient',
  },
];

const SEED_HOSPITALS: MockHospital[] = [
  {
    id: 'hospital-001',
    name: 'Demo Hospital',
    email: 'hospital@demo.com',
    city: 'Mumbai',
  },
];

const SEED_THERAPISTS: MockTherapist[] = [
  {
    id: 'therapist-001',
    userId: 'therapist-001',
    name: 'Dr. Demo',
    email: 'doctor@demo.com',
    specialty: 'Lead Orthopedic & Telerehabilitation Physiotherapist',
    hospitalId: 'hospital-001',
    phone: '+91 98200 12345',
  },
  {
    id: 'therapist-002',
    userId: 'therapist-002',
    name: 'Dr. Rajesh Rao',
    email: 'rajesh@demo.com',
    specialty: 'Sports Physiotherapy & Knee Reconstruction Specialist',
    hospitalId: 'hospital-001',
    phone: '+91 98200 54321',
  },
];

const SEED_PATIENTS: MockPatient[] = [
  {
    id: 'patient-001',
    userId: 'patient-001',
    name: 'Demo Patient',
    age: 32,
    gender: 'Male',
    email: 'patient@demo.com',
    hospitalId: 'hospital-001',
    therapistId: 'therapist-001',
    condition: 'Post-operative UCL reconstruction (Elbow Ligament)',
    surgeryDate: '2026-09-01',
    status: 'Active',
    currentStreakDays: 6,
    totalSessions: 10,
    phone: '+91 97654 32100',
  },
  {
    id: 'patient-002',
    userId: 'patient-002',
    name: 'Priya Patel',
    age: 28,
    gender: 'Female',
    email: 'priya@demo.com',
    hospitalId: 'hospital-001',
    therapistId: 'therapist-001',
    condition: 'ACL Reconstruction (Left Knee)',
    surgeryDate: '2026-09-12',
    status: 'Active',
    currentStreakDays: 3,
    totalSessions: 4,
    phone: '+91 98111 22334',
  },
  {
    id: 'patient-003',
    userId: 'patient-003',
    name: 'Aarav Sharma',
    age: 45,
    gender: 'Male',
    email: 'aarav@demo.com',
    hospitalId: 'hospital-001',
    therapistId: undefined, // Initially unassigned for demonstration!
    condition: 'Rotator Cuff Repair (Right Shoulder)',
    surgeryDate: '2026-09-18',
    status: 'Unassigned',
    currentStreakDays: 0,
    totalSessions: 0,
    phone: '+91 99222 33445',
  },
];

const SEED_DOCUMENTS: MockDocument[] = [
  {
    id: 'doc-001',
    patientId: 'patient-001',
    name: 'MRI Report — Right Elbow',
    type: 'MRI',
    fileName: 'mri-right-elbow-coronal.pdf',
    fileSize: '3.4 MB',
    uploadedAt: '2026-09-05T10:30:00Z',
    uploadedBy: 'hospital-001',
    uploaderName: 'Demo Hospital',
    summary: 'High-grade partial tear of UCL anterior bundle; post-surgical anchor in situ without hardware detachment or joint effusion.',
  },
  {
    id: 'doc-002',
    patientId: 'patient-001',
    name: 'Physiotherapy Initial Assessment',
    type: 'Physiotherapy Assessment',
    fileName: 'initial-physio-assessment.pdf',
    fileSize: '1.2 MB',
    uploadedAt: '2026-09-08T14:15:00Z',
    uploadedBy: 'hospital-001',
    uploaderName: 'Demo Hospital',
    summary: 'Active elbow flexion limited to 90°, minimal effusion, extension lag 10°. Prescribed gradual ROM progression with computer vision monitoring.',
  },
  {
    id: 'doc-003',
    patientId: 'patient-001',
    name: 'Orthopedic Surgical Prescription',
    type: 'Prescription',
    fileName: 'ortho-surgical-rx.pdf',
    fileSize: '820 KB',
    uploadedAt: '2026-09-02T09:00:00Z',
    uploadedBy: 'hospital-001',
    uploaderName: 'Demo Hospital',
    summary: 'Prescription for progressive ROM exercises: target 120° flexion, 10 reps, 2x daily. Avoid hyperextension.',
  },
  {
    id: 'doc-004',
    patientId: 'patient-001',
    name: 'Previous Treatment Report',
    type: 'Previous Treatment Report',
    fileName: 'previous-therapy-discharge.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '2026-09-01T16:45:00Z',
    uploadedBy: 'hospital-001',
    uploaderName: 'Demo Hospital',
    summary: 'Previous conservative rehabilitation plateaued. Post-operative telerehab clearance granted with weekly clinical review.',
  },
  {
    id: 'doc-005',
    patientId: 'patient-002',
    name: 'MRI Knee Scan — Left Leg',
    type: 'MRI',
    fileName: 'mri-left-knee.pdf',
    fileSize: '4.1 MB',
    uploadedAt: '2026-09-13T11:20:00Z',
    uploadedBy: 'hospital-001',
    uploaderName: 'Demo Hospital',
    summary: 'ACL reconstruction graft intact, femoral and tibial tunnels well-positioned.',
  },
  {
    id: 'doc-006',
    patientId: 'patient-003',
    name: 'Pre-Operative Shoulder Ultrasound',
    type: 'Diagnosis Report',
    fileName: 'shoulder-usg-report.pdf',
    fileSize: '2.1 MB',
    uploadedAt: '2026-09-17T15:10:00Z',
    uploadedBy: 'hospital-001',
    uploaderName: 'Demo Hospital',
    summary: 'Full thickness supraspinatus tear repaired with bio-absorbable anchors.',
  },
];

const SEED_TREATMENT_PLANS: MockTreatmentPlan[] = [
  {
    patientId: 'patient-001',
    exerciseId: 'elbow-flexion',
    exerciseName: 'Elbow Flexion & Extension',
    targetRom: 120,
    targetReps: 10,
    sets: 2,
    frequencyPerDay: 2,
    notes: 'Focus on smooth eccentric extension. Targets calibrated to current recovery phase.',
    updatedAt: '2026-09-20T10:00:00Z',
  },
  {
    patientId: 'patient-002',
    exerciseId: 'knee-extension',
    exerciseName: 'Knee Extension & Quad Sets',
    targetRom: 90,
    targetReps: 10,
    sets: 3,
    frequencyPerDay: 2,
    notes: 'Maintain neutral hip alignment. Avoid explosive terminal knee extension.',
    updatedAt: '2026-09-18T10:00:00Z',
  },
];

// Helper to safely get from localStorage
function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Helper to safely set in localStorage
function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key} to localStorage:`, err);
  }
}

export const mockStorage = {
  /**
   * Initializes localStorage with realistic clinical demo data if not already present.
   */
  init: () => {
    if (typeof window === 'undefined') return;
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      setLocal(STORAGE_KEYS.USERS, SEED_USERS);
      setLocal(STORAGE_KEYS.HOSPITALS, SEED_HOSPITALS);
      setLocal(STORAGE_KEYS.THERAPISTS, SEED_THERAPISTS);
      setLocal(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
      setLocal(STORAGE_KEYS.DOCUMENTS, SEED_DOCUMENTS);
      setLocal(STORAGE_KEYS.TREATMENT_PLANS, SEED_TREATMENT_PLANS);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  /**
   * Reset data back to default demo state
   */
  reset: () => {
    if (typeof window === 'undefined') return;
    setLocal(STORAGE_KEYS.USERS, SEED_USERS);
    setLocal(STORAGE_KEYS.HOSPITALS, SEED_HOSPITALS);
    setLocal(STORAGE_KEYS.THERAPISTS, SEED_THERAPISTS);
    setLocal(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
    setLocal(STORAGE_KEYS.DOCUMENTS, SEED_DOCUMENTS);
    setLocal(STORAGE_KEYS.TREATMENT_PLANS, SEED_TREATMENT_PLANS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  // ── USERS ─────────────────────────────────────────────────────────────
  getUsers: (): MockUser[] => {
    mockStorage.init();
    return getLocal<MockUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
  },

  findUserByEmail: (email: string): MockUser | undefined => {
    const users = mockStorage.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  },

  findUserById: (id: string): MockUser | undefined => {
    const users = mockStorage.getUsers();
    return users.find((u) => u.id === id);
  },

  createUser: (user: Omit<MockUser, 'id'> & { id?: string }): MockUser => {
    const users = mockStorage.getUsers();
    const newUser: MockUser = {
      id: user.id || `${user.role}-${Date.now()}`,
      name: user.name,
      email: user.email,
      password: user.password || 'demo123',
      role: user.role,
    };
    const updated = [...users, newUser];
    setLocal(STORAGE_KEYS.USERS, updated);

    // If patient or therapist, create corresponding profile
    if (newUser.role === 'patient') {
      const patients = mockStorage.getPatients();
      const newPatient: MockPatient = {
        id: newUser.id,
        userId: newUser.id,
        name: newUser.name,
        age: 30,
        gender: 'Not specified',
        email: newUser.email,
        hospitalId: 'hospital-001',
        condition: 'General Rehabilitation Protocol',
        status: 'Unassigned',
        currentStreakDays: 0,
        totalSessions: 0,
      };
      setLocal(STORAGE_KEYS.PATIENTS, [...patients, newPatient]);
    } else if (newUser.role === 'therapist') {
      const therapists = mockStorage.getTherapists();
      const newTherapist: MockTherapist = {
        id: newUser.id,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        specialty: 'Clinical Physiotherapist',
        hospitalId: 'hospital-001',
      };
      setLocal(STORAGE_KEYS.THERAPISTS, [...therapists, newTherapist]);
    }

    return newUser;
  },

  // ── PATIENTS ──────────────────────────────────────────────────────────
  getPatients: (filter?: { hospitalId?: string; therapistId?: string }): MockPatient[] => {
    mockStorage.init();
    let list = getLocal<MockPatient[]>(STORAGE_KEYS.PATIENTS, SEED_PATIENTS);
    if (filter?.hospitalId) {
      list = list.filter((p) => p.hospitalId === filter.hospitalId);
    }
    if (filter?.therapistId) {
      list = list.filter((p) => p.therapistId === filter.therapistId);
    }
    return list;
  },

  getPatientById: (id: string): MockPatient | undefined => {
    const patients = mockStorage.getPatients();
    return patients.find((p) => p.id === id || p.userId === id);
  },

  updatePatient: (id: string, updates: Partial<MockPatient>): MockPatient | null => {
    const patients = mockStorage.getPatients();
    const idx = patients.findIndex((p) => p.id === id || p.userId === id);
    if (idx === -1) return null;
    const updated = { ...patients[idx], ...updates };
    patients[idx] = updated;
    setLocal(STORAGE_KEYS.PATIENTS, patients);
    return updated;
  },

  createPatient: (data: Omit<MockPatient, 'id'>): MockPatient => {
    const patients = mockStorage.getPatients();
    const newPatient: MockPatient = {
      ...data,
      id: `patient-${Date.now()}`,
    };
    setLocal(STORAGE_KEYS.PATIENTS, [...patients, newPatient]);
    return newPatient;
  },

  // ── THERAPISTS ────────────────────────────────────────────────────────
  getTherapists: (): MockTherapist[] => {
    mockStorage.init();
    return getLocal<MockTherapist[]>(STORAGE_KEYS.THERAPISTS, SEED_THERAPISTS);
  },

  getTherapistById: (id: string): MockTherapist | undefined => {
    const therapists = mockStorage.getTherapists();
    return therapists.find((t) => t.id === id || t.userId === id);
  },

  // ── HOSPITALS ─────────────────────────────────────────────────────────
  getHospitals: (): MockHospital[] => {
    mockStorage.init();
    return getLocal<MockHospital[]>(STORAGE_KEYS.HOSPITALS, SEED_HOSPITALS);
  },

  getHospitalById: (id: string): MockHospital | undefined => {
    const hospitals = mockStorage.getHospitals();
    return hospitals.find((h) => h.id === id);
  },

  // ── DOCUMENTS ─────────────────────────────────────────────────────────
  getDocuments: (patientId?: string): MockDocument[] => {
    mockStorage.init();
    const all = getLocal<MockDocument[]>(STORAGE_KEYS.DOCUMENTS, SEED_DOCUMENTS);
    if (patientId) {
      return all.filter((d) => d.patientId === patientId);
    }
    return all;
  },

  getDocumentById: (id: string): MockDocument | undefined => {
    const docs = mockStorage.getDocuments();
    return docs.find((d) => d.id === id);
  },

  addDocument: (doc: Omit<MockDocument, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string }): MockDocument => {
    const docs = mockStorage.getDocuments();
    const newDoc: MockDocument = {
      id: doc.id || `doc-${Date.now()}`,
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      ...doc,
    };
    setLocal(STORAGE_KEYS.DOCUMENTS, [newDoc, ...docs]);
    return newDoc;
  },

  deleteDocument: (id: string): boolean => {
    const docs = mockStorage.getDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    if (filtered.length === docs.length) return false;
    setLocal(STORAGE_KEYS.DOCUMENTS, filtered);
    return true;
  },

  // ── ASSIGNMENTS ───────────────────────────────────────────────────────
  assignTherapist: (patientId: string, therapistId: string, hospitalId: string = 'hospital-001'): boolean => {
    const patient = mockStorage.getPatientById(patientId);
    if (!patient) return false;

    // Update patient record
    mockStorage.updatePatient(patientId, {
      therapistId,
      status: 'Active',
    });

    // Record assignment log
    const assignments = getLocal<MockAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const newAssignment: MockAssignment = {
      patientId,
      therapistId,
      hospitalId,
      assignedAt: new Date().toISOString(),
      status: 'Active',
    };
    setLocal(STORAGE_KEYS.ASSIGNMENTS, [newAssignment, ...assignments]);

    // Dispatch event for any reactive UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rehabsense:assignment-updated', {
        detail: { patientId, therapistId },
      }));
    }

    return true;
  },

  // ── TREATMENT PLANS & PRESCRIPTIONS ───────────────────────────────────
  getTreatmentPlan: (patientId: string): MockTreatmentPlan | undefined => {
    mockStorage.init();
    const plans = getLocal<MockTreatmentPlan[]>(STORAGE_KEYS.TREATMENT_PLANS, SEED_TREATMENT_PLANS);
    return plans.find((p) => p.patientId === patientId);
  },

  saveTreatmentPlan: (patientId: string, plan: Partial<MockTreatmentPlan>): MockTreatmentPlan => {
    const plans = getLocal<MockTreatmentPlan[]>(STORAGE_KEYS.TREATMENT_PLANS, SEED_TREATMENT_PLANS);
    const existingIdx = plans.findIndex((p) => p.patientId === patientId);
    
    const updatedPlan: MockTreatmentPlan = {
      patientId,
      exerciseId: plan.exerciseId || 'elbow-flexion',
      exerciseName: plan.exerciseName || 'Elbow Flexion & Extension',
      targetRom: plan.targetRom || 120,
      targetReps: plan.targetReps || 10,
      sets: plan.sets || 2,
      frequencyPerDay: plan.frequencyPerDay || 2,
      notes: plan.notes || 'Prescribed progressive range-of-motion protocol.',
      updatedAt: new Date().toISOString(),
      ...(existingIdx >= 0 ? plans[existingIdx] : {}),
      ...plan,
    };

    if (existingIdx >= 0) {
      plans[existingIdx] = updatedPlan;
    } else {
      plans.push(updatedPlan);
    }

    setLocal(STORAGE_KEYS.TREATMENT_PLANS, plans);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rehabsense:treatment-plan-updated', {
        detail: { patientId, plan: updatedPlan },
      }));
    }

    return updatedPlan;
  },
};
