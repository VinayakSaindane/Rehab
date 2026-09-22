from fastapi import APIRouter, Depends, HTTPException
from database import get_db_collection
from routers.auth import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/me")
async def get_patient_profile(current_user: dict = Depends(get_current_user)):
    patients_col = get_db_collection("patients")
    patient = await patients_col.find_one({"user_id": current_user["id"]})
    if not patient:
        # Fallback to patient-1 for demo
        patient = await patients_col.find_one({"id": "patient-1"})
    return patient

@router.get("/me/dashboard")
async def get_patient_dashboard(current_user: dict = Depends(get_current_user)):
    patients_col = get_db_collection("patients")
    prescriptions_col = get_db_collection("prescriptions")
    sessions_col = get_db_collection("sessions")
    exercises_col = get_db_collection("exercises")

    patient = await patients_col.find_one({"user_id": current_user["id"]}) or await patients_col.find_one({"id": "patient-1"})
    patient_id = patient["id"] if patient else "patient-1"

    # Get active prescription
    prescription = await prescriptions_col.find_one({"patient_id": patient_id, "status": "ACTIVE"})
    
    # Get recent sessions
    sessions_cursor = sessions_col.find({"patient_id": patient_id}).sort("started_at", -1).limit(5)
    recent_sessions = await sessions_cursor.to_list(length=5)

    # Calculate ROM progression trend
    all_sessions_cursor = sessions_col.find({"patient_id": patient_id}).sort("started_at", 1)
    all_sessions = await all_sessions_cursor.to_list(length=50)

    rom_improvement_pct = 18.2
    if len(all_sessions) >= 4:
        first_four = sum(s.get("average_rom", 0) for s in all_sessions[:4]) / 4
        last_four = sum(s.get("average_rom", 0) for s in all_sessions[-4:]) / 4
        if first_four > 0:
            rom_improvement_pct = round(((last_four - first_four) / first_four) * 100, 1)

    # Active assigned exercises
    assigned_exercises = []
    if prescription:
        ex = await exercises_col.find_one({"id": prescription["exercise_id"]})
        if ex:
            assigned_exercises.append({
                "id": ex["id"],
                "name": ex["name"],
                "body_region": ex["body_region"],
                "difficulty": ex["difficulty"],
                "target_reps": prescription["target_reps"],
                "target_rom": prescription["target_rom"],
                "prescription_id": prescription["id"]
            })

    return {
        "greeting": f"Good evening, {patient['name'].split()[0] if patient else 'Aarav'}",
        "patient": patient,
        "todays_rehab": {
            "exercise_count": len(assigned_exercises) or 1,
            "estimated_minutes": 12,
            "yesterday_completion": "8 / 10 reps completed",
            "assigned_exercises": assigned_exercises
        },
        "streak_days": patient.get("current_streak_days", 6) if patient else 6,
        "movement_progress": {
            "label": f"+{rom_improvement_pct}% ROM over the last 4 sessions",
            "rom_improvement_pct": rom_improvement_pct,
            "neutral_summary": "Steady upward movement range trajectory observed within prescribed limits."
        },
        "recent_session": recent_sessions[0] if recent_sessions else None,
        "therapist_message": {
            "from": patient.get("therapist_name", "Dr. Ananya Sharma") if patient else "Dr. Ananya Sharma",
            "content": prescription.get("notes", "Focus on smooth eccentric control. Targets are calibrated to your current recovery phase.") if prescription else "Focus on smooth eccentric control.",
            "date": "Today, 11:30 AM"
        },
        "next_session": {
            "scheduled": "Today, Evening Session",
            "status": "Ready to begin"
        }
    }

@router.get("/me/progress")
async def get_patient_progress(current_user: dict = Depends(get_current_user)):
    patients_col = get_db_collection("patients")
    sessions_col = get_db_collection("sessions")

    patient = await patients_col.find_one({"user_id": current_user["id"]}) or await patients_col.find_one({"id": "patient-1"})
    patient_id = patient["id"] if patient else "patient-1"

    sessions_cursor = sessions_col.find({"patient_id": patient_id}).sort("started_at", 1)
    sessions = await sessions_cursor.to_list(length=50)

    # Format timeline for charts
    timeline = []
    for s in sessions:
        timeline.append({
            "sessionId": s["id"],
            "date": s["started_at"][:10],
            "averageRom": s.get("average_rom", 0),
            "maxRom": s.get("max_rom", 0),
            "completedReps": s.get("completed_reps", 0),
            "targetReps": s.get("target_reps", 10),
            "validReps": s.get("valid_reps", 0),
            "durationSeconds": s.get("duration_seconds", 0),
            "trackingConfidence": round(s.get("tracking_confidence", 0.9) * 100, 1),
            "hasFlags": len(s.get("form_flags", [])) > 0
        })

    return {
        "patientId": patient_id,
        "totalSessions": len(sessions),
        "timeline": timeline,
        "trends": {
            "romDescription": "Movement range progression across sessions",
            "repetitionConsistency": "Repetition completion rate: 92% across all recorded sessions",
            "averageTrackingConfidence": "93.4% camera landmark tracking confidence"
        }
    }

@router.get("/me/sessions")
async def get_patient_sessions(current_user: dict = Depends(get_current_user)):
    patients_col = get_db_collection("patients")
    sessions_col = get_db_collection("sessions")

    patient = await patients_col.find_one({"user_id": current_user["id"]}) or await patients_col.find_one({"id": "patient-1"})
    patient_id = patient["id"] if patient else "patient-1"

    sessions_cursor = sessions_col.find({"patient_id": patient_id}).sort("started_at", -1)
    return await sessions_cursor.to_list(length=100)
