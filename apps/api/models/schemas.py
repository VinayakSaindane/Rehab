from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, EmailStr, field_validator

UserRole = Literal["PATIENT", "THERAPIST", "HOSPITAL_ADMIN", "SUPER_ADMIN"]

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
    is_custom: Optional[bool] = False
    source: Optional[str] = "platform"
    created_by_therapist_id: Optional[str] = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseResponse(ExerciseBase):
    pass

class CustomExerciseCreate(BaseModel):
    """
    Simplified exercise creation form for therapists.
    Therapists only need to fill the clinically important fields;
    the rep state machine parameters are auto-derived from ROM values.
    """
    name: str
    description: str
    body_region: str                        # e.g. "Upper Limb", "Lower Limb", "Core"
    difficulty: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    camera_view: str = "Frontal (Full Body)"
    target_joint: str                       # e.g. "Elbow", "Shoulder", "Knee"
    required_landmarks: List[str]           # e.g. ["left_shoulder", "left_elbow", "left_wrist"]
    instructions: List[str] = []
    common_feedback: List[str] = []
    target_rom: float                       # Prescribed peak ROM in degrees
    min_rom: float = 0.0                    # Starting / rest angle
    max_rom: float = 180.0
    is_angle_decreasing_on_flex: bool = True
    created_by_therapist_id: Optional[str] = None
    is_custom: bool = True                  # Marks as therapist-added, not seeded

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

    @field_validator('target_rom', 'min_rom', 'max_rom')
    @classmethod
    def validate_rom_range(cls, v: float) -> float:
        if not (0.0 <= v <= 180.0):
            raise ValueError(f'ROM value {v} must be between 0° and 180°')
        return v

    @field_validator('target_reps')
    @classmethod
    def validate_reps(cls, v: int) -> int:
        if v < 1 or v > 100:
            raise ValueError('target_reps must be between 1 and 100')
        return v

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    target_rom: Optional[float] = None
    target_reps: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    frequency_per_day: Optional[int] = None

    @field_validator('target_rom')
    @classmethod
    def validate_target_rom(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0.0 <= v <= 180.0):
            raise ValueError(f'target_rom {v} must be between 0° and 180°')
        return v

class PrescriptionResponse(PrescriptionBase):
    id: str
    updated_at: str

# ----------------- Session Schemas -----------------
class SessionRepMetricSchema(BaseModel):
    rep_number: int
    peak_rom: float
    start_rom: float = 0.0
    duration_seconds: float
    is_valid: bool
    flag: Optional[str] = None
    confidence_score: float
    compensation_flags: List[str] = []  # e.g. ["trunk_lean", "shoulder_hike"]

    @field_validator('peak_rom', 'start_rom')
    @classmethod
    def validate_rep_rom(cls, v: float) -> float:
        if not (0.0 <= v <= 180.0):
            raise ValueError(f'Rep ROM value {v} must be between 0° and 180°')
        return v

    @field_validator('confidence_score')
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError('confidence_score must be between 0.0 and 1.0')
        return round(v, 4)

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
    compensation_flags: List[str] = []  # Aggregate compensation flags across all reps e.g. ["trunk_lean"]
    joint_metrics: List[SessionRepMetricSchema] = []
    patient_notes: Optional[str] = None
    is_manual_log: Optional[bool] = False

    @field_validator('average_rom', 'max_rom')
    @classmethod
    def validate_session_rom(cls, v: float) -> float:
        if not (0.0 <= v <= 180.0):
            raise ValueError(f'ROM value {v} must be between 0° and 180°')
        return round(v, 2)

    @field_validator('tracking_confidence')
    @classmethod
    def validate_tracking_confidence(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError('tracking_confidence must be between 0.0 and 1.0')
        return round(v, 4)

    @field_validator('completed_reps', 'valid_reps', 'target_reps')
    @classmethod
    def validate_rep_counts(cls, v: int) -> int:
        if v < 0:
            raise ValueError('Rep count cannot be negative')
        return v

    @field_validator('duration_seconds')
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v < 0:
            raise ValueError('duration_seconds cannot be negative')
        return v

class SessionResponse(SessionCreate):
    id: str
    review_status: Literal["PENDING_REVIEW", "REVIEWED", "OVERRIDDEN"] = "PENDING_REVIEW"

# ----------------- Therapist Review Schemas -----------------
class TherapistReviewCreate(BaseModel):
    action: Literal["ACCEPTED", "OVERRIDDEN"]
    clinical_reason: Optional[str] = None
    new_target_rom: Optional[float] = None
    notes: Optional[str] = None

    @field_validator('new_target_rom')
    @classmethod
    def validate_new_rom(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0.0 <= v <= 180.0):
            raise ValueError(f'new_target_rom {v} must be between 0° and 180°')
        return v

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

# ----------------- Notification Schemas -----------------
class NotificationResponse(BaseModel):
    id: str
    patient_id: str
    type: str  # "PRESCRIPTION_UPDATED" | "SESSION_REVIEWED" | "GENERAL"
    title: str
    message: str
    is_read: bool = False
    created_at: str
    meta: Optional[Dict[str, Any]] = None

# ----------------- Session Summary (LLM Narrative) -----------------
class SessionSummaryResponse(BaseModel):
    session_id: str
    patient_summary: str  # 2-sentence plain-language summary for the patient
    clinician_summary: str  # 1-sentence summary for the therapist
    generated_at: str
    is_cached: bool = False  # True if loaded from stored cache, False if freshly generated

# ----------------- Hospital / Marketplace Models (Priority 4) -----------------
class HospitalOnboardingRecord(BaseModel):
    """Created when a hospital registers a new patient into the system."""
    id: str
    patient_id: str
    hospital_id: str
    hospital_name: Optional[str] = None
    operation_type: str                  # e.g. "Total Knee Replacement"
    injury_description: str
    surgery_date: Optional[str] = None   # ISO 8601 date string
    uploaded_report_urls: List[str] = [] # TODO: integrate with real file storage (S3/GCS) for production
    status: Literal["unassigned", "awaiting_quote", "active"] = "unassigned"
    created_at: str

class HospitalOnboardingCreate(BaseModel):
    patient_name: str
    patient_email: str
    hospital_id: str
    hospital_name: Optional[str] = None
    operation_type: str
    injury_description: str
    surgery_date: Optional[str] = None
    uploaded_report_urls: List[str] = []

class TherapistProfile(BaseModel):
    """Extended profile for therapists browsable on the marketplace."""
    id: str
    user_id: str
    name: str
    email: str
    title: str
    bio: Optional[str] = None
    specializations: List[str] = []       # e.g. ["Musculoskeletal", "Post-op"]
    years_experience: Optional[int] = None
    per_program_rate: Optional[float] = None  # Rate in INR per rehabilitation program
    availability: Optional[str] = None   # e.g. "Mon-Fri, 9AM-5PM" (free text, no calendar system)
    clinic_name: Optional[str] = None
    active_patients_count: int = 0

class CaseRequest(BaseModel):
    """A patient's request to a specific therapist, following the marketplace selection flow."""
    id: str
    patient_id: str
    therapist_id: str
    hospital_record_id: Optional[str] = None  # links to HospitalOnboardingRecord
    # TODO: payment gateway integration required before production — quoted_charge is a stub
    status: Literal["pending_quote", "quoted", "accepted", "declined"] = "pending_quote"
    quoted_charge: Optional[float] = None     # Therapist's quoted fee (display only, no real payment)
    therapist_notes: Optional[str] = None
    patient_notes: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class CaseRequestCreate(BaseModel):
    therapist_id: str
    hospital_record_id: Optional[str] = None
    patient_notes: Optional[str] = None

class CaseRequestQuote(BaseModel):
    quoted_charge: float
    therapist_notes: Optional[str] = None

# ----------------- Exercise Template (Priority 7 — Therapist Video Derivation) -----------------
class ExerciseTemplate(BaseModel):
    """
    Auto-derived exercise tracking template created from a therapist's recorded demonstration.
    Stores only the numeric landmark-derived parameters — no raw video is ever stored.
    """
    id: str
    therapist_id: str
    name: str
    description: Optional[str] = None
    # The detected primary joint triplet (landmark names, not raw video)
    joint_triplet_name: str                  # e.g. "Elbow Flexion/Extension"
    joint_triplet_indices: List[int]         # [A_idx, vertex_idx, C_idx] from MediaPipe
    joint_landmark_names: List[str]          # e.g. ["left_shoulder", "left_elbow", "left_wrist"]
    is_angle_decreasing_on_flex: bool
    # Derived kinematic parameters
    target_rom: float                        # Auto-derived peak flexion angle (degrees)
    rest_angle: float                        # Auto-derived resting angle (degrees)
    hysteresis_buffer: float                 # Auto-derived (10% of range, min 5°)
    angular_range: float                     # Total observed angular range from recording
    reps_target: int                         # Therapist-specified target reps per set
    estimated_reps_from_demo: int            # Auto-estimated reps detected in recording
    derivation_confidence: float             # [0.0 – 1.0] how clearly the joint dominates
    # Landmark summary for skeleton animation display (NOT raw video)
    # Contains avg landmark positions across frames for a visual preview
    landmark_summary: Optional[List[Dict[str, float]]] = None
    notes: Optional[str] = None
    created_at: str

class ExerciseTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    # Auto-derived from template-deriver.ts (sent as numeric data, no raw video)
    joint_triplet_name: str
    joint_triplet_indices: List[int]
    joint_landmark_names: List[str]
    is_angle_decreasing_on_flex: bool
    target_rom: float
    rest_angle: float
    hysteresis_buffer: float
    angular_range: float
    reps_target: int = 10
    estimated_reps_from_demo: int = 0
    derivation_confidence: float = 0.0
    landmark_summary: Optional[List[Dict[str, float]]] = None
    notes: Optional[str] = None

# ----------------- Therapist Feedback / Guidance (Session Review Extension) -----------------
class TherapistFeedback(BaseModel):
    """
    A plain-language guidance message sent from a therapist to a patient after
    reviewing their session data and compensation/form flags.
    Stored as a notification on the patient's account.
    """
    message: str              # The therapist's plain-language guidance for the patient
    coaching_cues: List[str] = []  # Short bullet-point coaching tips shown in the patient app
    priority: Literal["INFO", "WARNING", "URGENT"] = "INFO"

class TherapistReviewWithFeedback(BaseModel):
    """Extended session review payload that includes a feedback message to the patient."""
    action: Literal["ACCEPTED", "OVERRIDDEN"]
    clinical_reason: Optional[str] = None
    new_target_rom: Optional[float] = None
    notes: Optional[str] = None
    feedback: Optional[TherapistFeedback] = None  # If provided, sent as patient notification

