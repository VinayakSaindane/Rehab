import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from database import get_db_collection
from models.schemas import TherapistReviewCreate, TherapistReviewResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/therapist", tags=["Therapist Operations"])

@router.get("/dashboard")
async def get_therapist_dashboard(current_user: dict = Depends(get_current_user)):
    patients_col = get_db_collection("patients")
    prescriptions_col = get_db_collection("prescriptions")
    sessions_col = get_db_collection("sessions")

    patients_cursor = patients_col.find({})
    patients = await patients_cursor.to_list(length=50)

    # Count pending review sessions
    pending_sessions_cursor = sessions_col.find({"review_status": "PENDING_REVIEW"})
    pending_sessions = await pending_sessions_cursor.to_list(length=50)

    # Build patient cards with enriched metrics
    patient_cards = []
    for p in patients:
        p_id = p["id"]
        # Find active prescription
        presc = await prescriptions_col.find_one({"patient_id": p_id, "status": "ACTIVE"})
        # Find latest session
        latest_sess_cursor = sessions_col.find({"patient_id": p_id}).sort("started_at", -1).limit(1)
        latest_sessions = await latest_sess_cursor.to_list(length=1)
        latest_session = latest_sessions[0] if latest_sessions else None

        # Check for unreviewed flags
        has_flag = any(s.get("patient_id") == p_id for s in pending_sessions)

        patient_cards.append({
            "id": p_id,
            "name": p["name"],
            "age": p.get("age", 32),
            "condition_label": p.get("condition_label", "Upper-limb rehabilitation"),
            "assigned_plan": presc.get("exercise_name", "Elbow Flexion & Extension") if presc else "No active plan",
            "target_rom": presc.get("target_rom", 120) if presc else 120,
            "target_reps": presc.get("target_reps", 10) if presc else 10,
            "latest_session": {
                "id": latest_session["id"] if latest_session else None,
                "date": latest_session["started_at"] if latest_session else None,
                "average_rom": latest_session.get("average_rom", 0) if latest_session else 0,
                "tracking_confidence": latest_session.get("tracking_confidence", 0.9) if latest_session else 0.9,
                "flags_count": len(latest_session.get("form_flags", [])) if latest_session else 0
            } if latest_session else None,
            "adherence": f"{p.get('total_sessions_completed', 10)} / 14 sessions",
            "streak_days": p.get("current_streak_days", 6),
            "has_review_flag": has_flag,
            "flagged_session_id": next((s["id"] for s in pending_sessions if s.get("patient_id") == p_id), None)
        })

    return {
        "overview": {
            "total_patients": len(patients),
            "active_plans": len([p for p in patient_cards if p["assigned_plan"] != "No active plan"]),
            "sessions_today": 3,
            "sessions_requiring_review": len(pending_sessions)
        },
        "pending_reviews": pending_sessions,
        "patients": patient_cards
    }

@router.get("/patients")
async def list_patients(current_user: dict = Depends(get_current_user)):
    patients_col = get_db_collection("patients")
    cursor = patients_col.find({})
    return await cursor.to_list(length=100)

@router.get("/patients/{patient_id}")
async def get_patient_detail(patient_id: str, current_user: dict = Depends(get_current_user)):
    patients_col = get_db_collection("patients")
    prescriptions_col = get_db_collection("prescriptions")
    sessions_col = get_db_collection("sessions")
    reviews_col = get_db_collection("therapist_reviews")

    patient = await patients_col.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prescription = await prescriptions_col.find_one({"patient_id": patient_id, "status": "ACTIVE"})

    sessions_cursor = sessions_col.find({"patient_id": patient_id}).sort("started_at", -1)
    sessions = await sessions_cursor.to_list(length=100)

    reviews_cursor = reviews_col.find({"patient_id": patient_id}).sort("reviewed_at", -1)
    reviews = await reviews_cursor.to_list(length=50)

    return {
        "patient": patient,
        "active_prescription": prescription,
        "sessions": sessions,
        "reviews": reviews
    }

@router.get("/sessions")
async def list_therapist_sessions(status_filter: Optional[str] = None):
    sessions_col = get_db_collection("sessions")
    query = {"review_status": status_filter} if status_filter else {}
    cursor = sessions_col.find(query).sort("started_at", -1)
    return await cursor.to_list(length=100)

@router.post("/sessions/{session_id}/review", response_model=TherapistReviewResponse)
async def review_session(
    session_id: str,
    review_in: TherapistReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    sessions_col = get_db_collection("sessions")
    prescriptions_col = get_db_collection("prescriptions")
    reviews_col = get_db_collection("therapist_reviews")

    session = await sessions_col.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    patient_id = session.get("patient_id", "patient-1")
    prescription_id = session.get("prescription_id", "presc-1")
    presc = await prescriptions_col.find_one({"id": prescription_id})

    previous_target_rom = presc.get("target_rom", 120.0) if presc else 120.0
    new_target_rom = review_in.new_target_rom

    # If clinician overrides, adjust the active prescription
    if review_in.action == "OVERRIDDEN" and new_target_rom is not None:
        await prescriptions_col.update_one(
            {"id": prescription_id},
            {
                "$set": {
                    "target_rom": float(new_target_rom),
                    "notes": f"Therapist Override: {review_in.clinical_reason or 'Adjusted for recovery progression'}",
                    "status": "ADJUSTED",
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        new_status = "OVERRIDDEN"
    else:
        new_status = "REVIEWED"

    # Update session status
    await sessions_col.update_one(
        {"id": session_id},
        {"$set": {"review_status": new_status}}
    )

    review_doc = {
        "id": f"review-{uuid.uuid4().hex[:8]}",
        "session_id": session_id,
        "patient_id": patient_id,
        "therapist_id": current_user.get("id", "therapist-1"),
        "reviewed_at": datetime.utcnow().isoformat(),
        "action": review_in.action,
        "clinical_reason": review_in.clinical_reason,
        "previous_target_rom": previous_target_rom,
        "new_target_rom": new_target_rom,
        "notes": review_in.notes
    }
    await reviews_col.insert_one(review_doc)

    return review_doc
