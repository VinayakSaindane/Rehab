import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from database import get_db_collection
from models.schemas import ExerciseResponse, ExerciseCreate, ExerciseTemplate, ExerciseTemplateCreate, CustomExerciseCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("", response_model=List[ExerciseResponse])
async def list_exercises():
    exercises_col = get_db_collection("exercises")
    custom_col = get_db_collection("custom_exercises")
    cursor = exercises_col.find({})
    seeded = await cursor.to_list(length=100)
    custom_cursor = custom_col.find({})
    custom = await custom_cursor.to_list(length=100)
    return seeded + custom

@router.get("/library")
async def get_exercise_library(current_user: dict = Depends(get_current_user)):
    """
    Returns all exercises visible to this therapist:
    - Seeded / platform exercises (available to everyone)
    - Custom exercises created by this therapist
    """
    exercises_col = get_db_collection("exercises")
    custom_col = get_db_collection("custom_exercises")

    # All seeded exercises
    seeded_cursor = exercises_col.find({})
    seeded = await seeded_cursor.to_list(length=100)
    for ex in seeded:
        ex["is_custom"] = False
        ex["source"] = "platform"

    # Custom exercises from this therapist
    custom_cursor = custom_col.find({"created_by_therapist_id": current_user["id"]})
    custom = await custom_cursor.to_list(length=100)
    for ex in custom:
        ex["is_custom"] = True
        ex["source"] = "custom"

    return {
        "platform_exercises": seeded,
        "custom_exercises": custom,
        "total": len(seeded) + len(custom)
    }

@router.post("/custom")
async def create_custom_exercise(
    exercise_in: CustomExerciseCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Therapist manually creates a new exercise with clinical parameters.
    The rep state machine thresholds are auto-derived from target_rom and min_rom.
    The exercise is only visible to this therapist (not seeded into the platform library).
    """
    custom_col = get_db_collection("custom_exercises")
    ex_id = f"custom-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    # Auto-derive rep state machine thresholds from ROM inputs
    target_rom = exercise_in.target_rom
    min_rom = exercise_in.min_rom

    # For decreasing-on-flex (e.g. elbow): start=rest (large angle), target=peak flex (small angle)
    # For increasing-on-flex (e.g. shoulder elevation): start=rest (small angle), target=peak (large angle)
    if exercise_in.is_angle_decreasing_on_flex:
        start_angle = exercise_in.max_rom
        target_angle = target_rom
        return_angle = exercise_in.max_rom - 10
    else:
        start_angle = min_rom
        target_angle = target_rom
        return_angle = min_rom + 10

    hysteresis_buffer = max(5.0, round(abs(target_angle - start_angle) * 0.08, 1))

    doc = {
        "id": ex_id,
        "name": exercise_in.name,
        "description": exercise_in.description,
        "body_region": exercise_in.body_region,
        "difficulty": exercise_in.difficulty,
        "camera_view": exercise_in.camera_view,
        "target_joint": exercise_in.target_joint,
        "required_landmarks": exercise_in.required_landmarks,
        "instructions": exercise_in.instructions,
        "common_feedback": exercise_in.common_feedback,
        "default_rom": {
            "min": min_rom,
            "max": exercise_in.max_rom,
            "target": target_rom,
            "unit": "degrees"
        },
        "rep_state_machine": {
            "start_angle": start_angle,
            "target_angle": target_angle,
            "return_angle": return_angle,
            "hysteresis_buffer": hysteresis_buffer
        },
        "is_angle_decreasing_on_flex": exercise_in.is_angle_decreasing_on_flex,
        "is_custom": True,
        "source": "custom",
        "created_by_therapist_id": current_user["id"],
        "created_at": now
    }

    await custom_col.insert_one(doc)
    return doc

@router.patch("/custom/{exercise_id}")
async def update_custom_exercise(
    exercise_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    """Therapist updates their own custom exercise."""
    custom_col = get_db_collection("custom_exercises")
    ex = await custom_col.find_one({"id": exercise_id, "created_by_therapist_id": current_user["id"]})
    if not ex:
        raise HTTPException(status_code=404, detail="Custom exercise not found or not owned by this therapist")

    # Never allow id or therapist_id to be overwritten
    updates.pop("id", None)
    updates.pop("created_by_therapist_id", None)
    updates.pop("is_custom", None)

    await custom_col.update_one({"id": exercise_id}, {"$set": updates})
    return {**ex, **updates}

@router.delete("/custom/{exercise_id}")
async def delete_custom_exercise(
    exercise_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Therapist deletes their own custom exercise."""
    custom_col = get_db_collection("custom_exercises")
    ex = await custom_col.find_one({"id": exercise_id, "created_by_therapist_id": current_user["id"]})
    if not ex:
        raise HTTPException(status_code=404, detail="Custom exercise not found or not owned by this therapist")
    await custom_col.delete_one({"id": exercise_id})
    return {"message": f"Custom exercise '{ex['name']}' deleted", "id": exercise_id}

@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(exercise_id: str):
    exercises_col = get_db_collection("exercises")
    custom_col = get_db_collection("custom_exercises")
    exercise = await exercises_col.find_one({"id": exercise_id})
    if not exercise:
        exercise = await custom_col.find_one({"id": exercise_id})
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

