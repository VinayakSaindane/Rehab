import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from database import get_db_collection
from models.schemas import ExerciseResponse, ExerciseCreate, ExerciseTemplate, ExerciseTemplateCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("", response_model=List[ExerciseResponse])
async def list_exercises():
    exercises_col = get_db_collection("exercises")
    cursor = exercises_col.find({})
    return await cursor.to_list(length=100)

@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(exercise_id: str):
    exercises_col = get_db_collection("exercises")
    exercise = await exercises_col.find_one({"id": exercise_id})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise

@router.post("", response_model=ExerciseResponse)
async def create_exercise(exercise: ExerciseCreate, current_user: dict = Depends(get_current_user)):
    exercises_col = get_db_collection("exercises")
    existing = await exercises_col.find_one({"id": exercise.id})
    if existing:
        raise HTTPException(status_code=400, detail="Exercise with this ID already exists")
    await exercises_col.insert_one(exercise.dict())
    return exercise

# ═══════════════════════════════════════════════════════════════════
# Priority 7: Exercise Templates (Auto-derived from therapist recording)
# ═══════════════════════════════════════════════════════════════════

@router.post("/templates", response_model=ExerciseTemplate)
async def create_template(
    template_in: ExerciseTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Store an auto-derived exercise template.

    The client runs template-deriver.ts against the recorded landmark frames and
    POSTs only the numeric derived parameters here — no raw video is transmitted.
    """
    templates_col = get_db_collection("exercise_templates")
    template_id = f"tmpl-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        **template_in.dict(),
        "id": template_id,
        "therapist_id": current_user["id"],
        "created_at": now
    }
    await templates_col.insert_one(doc)
    return doc

@router.get("/templates", response_model=List[ExerciseTemplate])
async def list_templates(current_user: dict = Depends(get_current_user)):
    """Return all exercise templates created by the authenticated therapist."""
    templates_col = get_db_collection("exercise_templates")
    cursor = templates_col.find({"therapist_id": current_user["id"]})
    return await cursor.to_list(length=100)

@router.get("/templates/{template_id}", response_model=ExerciseTemplate)
async def get_template(template_id: str, current_user: dict = Depends(get_current_user)):
    templates_col = get_db_collection("exercise_templates")
    template = await templates_col.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Exercise template not found")
    return template

@router.post("/templates/{template_id}/assign")
async def assign_template_to_patient(
    template_id: str,
    patient_id: str,
    sets: int = 3,
    frequency_per_day: int = 2,
    current_user: dict = Depends(get_current_user)
):
    """
    Assign a therapist-derived exercise template to a patient.
    Creates a PrescriptionRecord using the template's derived kinematic parameters
    instead of hardcoded clinical defaults.
    """
    templates_col = get_db_collection("exercise_templates")
    prescriptions_col = get_db_collection("prescriptions")

    template = await templates_col.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    presc_id = f"presc-tmpl-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    presc_doc = {
        "id": presc_id,
        "patient_id": patient_id,
        "therapist_id": current_user["id"],
        # Reference the template so the patient exercise page can load derived params
        "exercise_id": f"template:{template_id}",
        "exercise_name": template["name"],
        "sets": sets,
        "target_reps": template.get("reps_target", 10),
        "target_rom": template["target_rom"],
        "min_rom": max(0.0, template["target_rom"] - 30),
        "max_rom": min(180.0, template["rest_angle"]),
        "tempo_seconds": {"concentric": 2.0, "eccentric": 3.0},
        "hold_duration_seconds": 1.0,
        "frequency_per_day": frequency_per_day,
        "notes": f"Auto-derived from therapist recording: {template.get('description', template['name'])}",
        "camera_orientation": "front",
        "feedback_enabled": True,
        "status": "ACTIVE",
        "updated_at": now,
        # Derived params for the patient exercise page
        "derived_template": {
            "joint_triplet_name": template["joint_triplet_name"],
            "joint_triplet_indices": template["joint_triplet_indices"],
            "joint_landmark_names": template["joint_landmark_names"],
            "is_angle_decreasing_on_flex": template["is_angle_decreasing_on_flex"],
            "target_rom": template["target_rom"],
            "rest_angle": template["rest_angle"],
            "hysteresis_buffer": template["hysteresis_buffer"],
            "landmark_summary": template.get("landmark_summary")
        }
    }

    await prescriptions_col.insert_one(presc_doc)
    return {
        "message": f"Template '{template['name']}' assigned to patient {patient_id}",
        "prescription_id": presc_id,
        "derived_params": {
            "joint": template["joint_triplet_name"],
            "target_rom": template["target_rom"],
            "rest_angle": template["rest_angle"],
            "hysteresis_buffer": template["hysteresis_buffer"]
        }
    }

