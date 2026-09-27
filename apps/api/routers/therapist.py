import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from database import get_db_collection
from models.schemas import TherapistReviewCreate, TherapistReviewResponse, TherapistReviewWithFeedback, TherapistFeedback
from routers.auth import get_current_user
from routers.notifications import create_notification

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
                    "updated_at": datetime.now(timezone.utc).isoformat()
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
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "action": review_in.action,
        "clinical_reason": review_in.clinical_reason,
        "previous_target_rom": previous_target_rom,
        "new_target_rom": new_target_rom,
        "notes": review_in.notes
    }
    await reviews_col.insert_one(review_doc)

    # Notify patient about the review action
    if review_in.action == "OVERRIDDEN" and new_target_rom is not None:
        await create_notification(
            patient_id=patient_id,
            notif_type="PRESCRIPTION_UPDATED",
            title="Your Exercise Target Has Been Updated",
            message=(
                f"Dr. {current_user.get('name', 'Your therapist')} has reviewed your session "
                f"and adjusted your prescribed ROM target to {new_target_rom}°. "
                f"Reason: {review_in.clinical_reason or 'Progressive recovery adjustment'}."
            ),
            meta={
                "session_id": session_id,
                "previous_rom": previous_target_rom,
                "new_rom": new_target_rom
            }
        )
    else:
        await create_notification(
            patient_id=patient_id,
            notif_type="SESSION_REVIEWED",
            title="Session Reviewed by Your Care Team",
            message=(
                f"Dr. {current_user.get('name', 'Your therapist')} has reviewed your recent session. "
                f"Your current prescription remains unchanged."
            ),
            meta={"session_id": session_id}
        )

    return review_doc

@router.post("/sessions/{session_id}/review-with-feedback")
async def review_session_with_feedback(
    session_id: str,
    review_in: TherapistReviewWithFeedback,
    current_user: dict = Depends(get_current_user)
):
    """
    Extended review endpoint — does everything review_session does, PLUS:
    - Sends a rich THERAPIST_GUIDANCE notification with the therapist's message
      and coaching cues directly visible in the patient app.
    - Also chains into the existing review flow (updates prescription if OVERRIDDEN).
    """
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

    if review_in.action == "OVERRIDDEN" and new_target_rom is not None:
        await prescriptions_col.update_one(
            {"id": prescription_id},
            {"$set": {
                "target_rom": float(new_target_rom),
                "notes": f"Therapist Override: {review_in.clinical_reason or 'Adjusted for recovery progression'}",
                "status": "ADJUSTED",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        new_status = "OVERRIDDEN"
    else:
        new_status = "REVIEWED"

    await sessions_col.update_one({"id": session_id}, {"$set": {"review_status": new_status}})

    review_doc = {
        "id": f"review-{uuid.uuid4().hex[:8]}",
        "session_id": session_id,
        "patient_id": patient_id,
        "therapist_id": current_user.get("id", "therapist-1"),
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "action": review_in.action,
        "clinical_reason": review_in.clinical_reason,
        "previous_target_rom": previous_target_rom,
        "new_target_rom": new_target_rom,
        "notes": review_in.notes,
        "feedback_sent": review_in.feedback is not None
    }
    await reviews_col.insert_one(review_doc)

    therapist_name = current_user.get("name", "Your therapist")

    # 1. Always send a standard review notification
    if review_in.action == "OVERRIDDEN" and new_target_rom is not None:
        await create_notification(
            patient_id=patient_id,
            notif_type="PRESCRIPTION_UPDATED",
            title="Your Exercise Target Has Been Updated",
            message=(
                f"Dr. {therapist_name} has reviewed your session and adjusted your "
                f"prescribed ROM target to {new_target_rom}°. "
                f"Reason: {review_in.clinical_reason or 'Progressive recovery adjustment'}."
            ),
            meta={"session_id": session_id, "previous_rom": previous_target_rom, "new_rom": new_target_rom}
        )
    else:
        await create_notification(
            patient_id=patient_id,
            notif_type="SESSION_REVIEWED",
            title="Session Reviewed by Your Care Team",
            message=f"Dr. {therapist_name} has reviewed your recent session. Your prescription remains unchanged.",
            meta={"session_id": session_id}
        )

    # 2. If therapist included a feedback message, send it as a separate THERAPIST_GUIDANCE notification
    if review_in.feedback:
        fb = review_in.feedback
        # Format coaching cues as a numbered list appended to the message
        cues_text = ""
        if fb.coaching_cues:
            cues_text = " Tips: " + " | ".join(f"({i+1}) {cue}" for i, cue in enumerate(fb.coaching_cues))

        await create_notification(
            patient_id=patient_id,
            notif_type="THERAPIST_GUIDANCE",
            title=f"Guidance from Dr. {therapist_name}",
            message=fb.message + cues_text,
            meta={
                "session_id": session_id,
                "coaching_cues": fb.coaching_cues,
                "priority": fb.priority,
                "from_therapist": therapist_name
            }
        )

    return review_doc

@router.get("/sessions/{session_id}/summary")
async def get_session_summary_for_therapist(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns the AI-generated session summary from the therapist's perspective.
    Calls the same LLM summary endpoint used by the patient progress page,
    but returns the clinician_summary field prominently.
    Also returns the full session doc for the therapist review page.
    """
    sessions_col = get_db_collection("sessions")
    session = await sessions_col.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # If cached summary exists, return it
    cached = session.get("llm_summary")

    # Build deterministic clinician summary as fallback
    comp_flags = session.get("compensation_flags", [])
    form_flags = session.get("form_flags", [])
    all_flags = list(set(form_flags + comp_flags))
    flags_str = ", ".join(all_flags) if all_flags else "none"
    avg_rom = session.get("average_rom", 0)
    tracking_pct = round(session.get("tracking_confidence", 0) * 100)
    completed = session.get("completed_reps", 0)
    target = session.get("target_reps", 0)
    ex_name = session.get("exercise_name", "Exercise")

    clinician_summary = cached["clinician_summary"] if cached else (
        f"Patient completed {completed}/{target} reps of {ex_name} "
        f"with avg ROM {avg_rom:.0f}°, {tracking_pct}% tracking confidence, flags: {flags_str}."
    )

    # Human-readable flag analysis for the therapist review page
    flag_analysis = []
    if "trunk_lean" in all_flags:
        flag_analysis.append({"flag": "trunk_lean", "label": "Trunk Lean", "guidance": "Patient is laterally flexing the spine during the movement. Cue: keep the back straight, brace the core, and avoid leaning into the exercise."})
    if "shoulder_hike" in all_flags:
        flag_analysis.append({"flag": "shoulder_hike", "label": "Shoulder Hike", "guidance": "Ipsilateral shoulder is elevating to assist the movement. Cue: relax the shoulder blade down, keep both shoulders level throughout the rep."})
    if "pelvic_shift" in all_flags:
        flag_analysis.append({"flag": "pelvic_shift", "label": "Pelvic Shift", "guidance": "Lateral hip drift detected. Cue: keep weight evenly distributed, avoid shifting weight to one side during the movement."})
    if "range_below_target" in all_flags:
        flag_analysis.append({"flag": "range_below_target", "label": "Short ROM", "guidance": "Patient is not achieving the prescribed range. Review whether ROM target needs adjusting or if pain/stiffness is limiting full range."})

    return {
        "session": session,
        "clinician_summary": clinician_summary,
        "flag_analysis": flag_analysis,
        "all_flags": all_flags,
        "summary_cached": bool(cached)
    }
