from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, EmailStr

UserRole = Literal["PATIENT", "THERAPIST", "SUPER_ADMIN"]

# ----------------- Auth Schemas -----------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str
    role: UserRole

class DemoSwitchRequest(BaseModel):
    role: UserRole # 'PATIENT' or 'THERAPIST'

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: str

class UserResponse(UserBase):
    id: str
    created_at: Optional[str] = None

# ----------------- Patient & Therapist -----------------
class PatientResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    age: int
    condition_label: str
    therapist_id: str
    therapist_name: str
    current_streak_days: int
    total_sessions_completed: int
    created_at: str

class TherapistResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    title: str
    clinic_name: str
    active_patients_count: int

# ----------------- Exercise Schemas -----------------
class ExerciseRomDefinition(BaseModel):
    min: float
    max: float
    target: float
    unit: str = "degrees"

class ExerciseRepThresholds(BaseModel):
    start_angle: float
    target_angle: float
    return_angle: float
    hysteresis_buffer: float

class ExerciseBase(BaseModel):
    id: str
    name: str
    description: str
    body_region: str
    difficulty: str
    camera_view: str
    target_joint: str
    required_landmarks: List[str]
    instructions: List[str]
    common_feedback: List[str]
    default_rom: ExerciseRomDefinition
    rep_state_machine: ExerciseRepThresholds

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseResponse(ExerciseBase):
    pass

# ----------------- Prescription Schemas -----------------
class PrescriptionTempo(BaseModel):
    concentric: float
    eccentric: float

class PrescriptionBase(BaseModel):
    patient_id: str
    therapist_id: str
    exercise_id: str
    exercise_name: str
    sets: int
    target_reps: int
    target_rom: float
    min_rom: float
    max_rom: float
    tempo_seconds: PrescriptionTempo
    hold_duration_seconds: float
    frequency_per_day: int
    notes: str
    camera_orientation: str
    feedback_enabled: bool = True
    status: Literal["ACTIVE", "ADJUSTED", "COMPLETED", "ARCHIVED"] = "ACTIVE"

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    target_rom: Optional[float] = None
    target_reps: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    frequency_per_day: Optional[int] = None

class PrescriptionResponse(PrescriptionBase):
    id: str
    updated_at: str

# ----------------- Session Schemas -----------------
class SessionRepMetricSchema(BaseModel):
    rep_number: int
    peak_rom: float
    start_rom: float
    duration_seconds: float
    is_valid: bool
    flag: Optional[str] = None
    confidence_score: float

class SessionCreate(BaseModel):
    patient_id: Optional[str] = None
    exercise_id: str
    prescription_id: Optional[str] = None
    exercise_name: str
    started_at: str
    completed_at: str
    duration_seconds: int
    target_reps: int
    completed_reps: int
    valid_reps: int
    average_rom: float
    max_rom: float
    tracking_confidence: float
    form_flags: List[str] = []
    joint_metrics: List[SessionRepMetricSchema] = []
    patient_notes: Optional[str] = None
    is_manual_log: Optional[bool] = False

class SessionResponse(SessionCreate):
    id: str
    review_status: Literal["PENDING_REVIEW", "REVIEWED", "OVERRIDDEN"] = "PENDING_REVIEW"

# ----------------- Therapist Review Schemas -----------------
class TherapistReviewCreate(BaseModel):
    action: Literal["ACCEPTED", "OVERRIDDEN"]
    clinical_reason: Optional[str] = None
    new_target_rom: Optional[float] = None
    notes: Optional[str] = None

class TherapistReviewResponse(BaseModel):
    id: str
    session_id: str
    patient_id: str
    therapist_id: str
    reviewed_at: str
    action: str
    clinical_reason: Optional[str] = None
    previous_target_rom: Optional[float] = None
    new_target_rom: Optional[float] = None
    notes: Optional[str] = None
