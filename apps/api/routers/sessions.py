import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from database import get_db_collection
from models.schemas import SessionCreate, SessionResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("", response_model=SessionResponse)
async def create_session(session_in: SessionCreate, current_user: dict = Depends(get_current_user)):
    sessions_col = get_db_collection("sessions")
    patients_col = get_db_collection("patients")

    patient_id = session_in.patient_id
    if not patient_id:
        patient = await patients_col.find_one({"user_id": current_user["id"]}) or await patients_col.find_one({"id": "patient-1"})
        patient_id = patient["id"] if patient else "patient-1"

    session_doc = session_in.dict()
    session_doc["id"] = f"session-{uuid.uuid4().hex[:8]}"
    session_doc["patient_id"] = patient_id
    
    # If there are form flags (e.g. range_below_target), mark for therapist review
    if len(session_in.form_flags) > 0:
        session_doc["review_status"] = "PENDING_REVIEW"
    else:
        session_doc["review_status"] = "REVIEWED"

    await sessions_col.insert_one(session_doc)

    # Update patient's completed sessions count and streak
    if patient_id:
        patient = await patients_col.find_one({"id": patient_id})
        if patient:
            new_total = patient.get("total_sessions_completed", 0) + 1
            new_streak = patient.get("current_streak_days", 0) + 1
            await patients_col.update_one(
                {"id": patient_id},
                {"$set": {"total_sessions_completed": new_total, "current_streak_days": new_streak}}
            )

    return session_doc

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    sessions_col = get_db_collection("sessions")
    session = await sessions_col.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
