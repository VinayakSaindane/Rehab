import asyncio
import bcrypt
from datetime import datetime, timedelta
from database import get_db_collection

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

async def seed_database():
    users_col = get_db_collection("users")
    patients_col = get_db_collection("patients")
    therapists_col = get_db_collection("therapists")
    exercises_col = get_db_collection("exercises")
    prescriptions_col = get_db_collection("prescriptions")
    sessions_col = get_db_collection("sessions")
    reviews_col = get_db_collection("therapist_reviews")

    # Clear existing demo data
    for col in [users_col, patients_col, therapists_col, exercises_col, prescriptions_col, sessions_col, reviews_col]:
        if hasattr(col, "documents"):
            col.documents = []
        elif hasattr(col, "delete_many"):
            await col.delete_many({})

    demo_pw_hash = hash_password("Demo@123")

    # 1. Users
    patient_user = {
        "id": "user-patient-1",
        "email": "patient@rehabsense.demo",
        "hashed_password": demo_pw_hash,
        "name": "Aarav Mehta",
        "role": "PATIENT",
        "created_at": (datetime.utcnow() - timedelta(days=15)).isoformat()
    }
    therapist_user = {
        "id": "user-therapist-1",
        "email": "therapist@rehabsense.demo",
        "hashed_password": demo_pw_hash,
        "name": "Dr. Ananya Sharma",
        "role": "THERAPIST",
        "created_at": (datetime.utcnow() - timedelta(days=60)).isoformat()
    }
    await users_col.insert_one(patient_user)
    await users_col.insert_one(therapist_user)

    # 2. Profiles
    patient_profile = {
        "id": "patient-1",
        "user_id": "user-patient-1",
        "name": "Aarav Mehta",
        "email": "patient@rehabsense.demo",
        "age": 32,
        "condition_label": "Post-operative upper-limb rehabilitation",
        "therapist_id": "therapist-1",
        "therapist_name": "Dr. Ananya Sharma",
        "current_streak_days": 6,
        "total_sessions_completed": 10,
        "created_at": (datetime.utcnow() - timedelta(days=15)).isoformat()
    }
    therapist_profile = {
        "id": "therapist-1",
        "user_id": "user-therapist-1",
        "name": "Dr. Ananya Sharma",
        "email": "therapist@rehabsense.demo",
        "title": "Lead Musculoskeletal Physiotherapist",
        "clinic_name": "Apex Physical Therapy & Orthopaedic Center",
        "active_patients_count": 14
    }
    await patients_col.insert_one(patient_profile)
    await therapists_col.insert_one(therapist_profile)

    # 3. Exercises Library
    exercises_data = [
        {
            "id": "elbow-flexion",
            "name": "Elbow Flexion & Extension",
            "description": "Controlled sagittal bending and straightening of the elbow joint to restore functional range of motion.",
            "body_region": "Upper Limb",
            "difficulty": "Beginner",
            "camera_view": "Frontal (Full Body)",
            "target_joint": "Elbow",
            "required_landmarks": ["left_shoulder", "left_elbow", "left_wrist"],
            "instructions": [
                "Position your device camera 6 to 8 feet away at elbow height.",
                "Stand or sit upright with your arm resting comfortably at your side.",
                "Smoothly bend your elbow, bringing your hand towards your shoulder.",
                "Pause for 1 second at the top of the movement.",
                "Slowly lower your hand back down to the resting position."
            ],
            "common_feedback": [
                "Maintain an upright posture without leaning sideways.",
                "Keep your upper arm stationary against your torso.",
                "Ensure your hand and elbow stay clearly visible in the camera frame."
            ],
            "default_rom": {"min": 40.0, "max": 140.0, "target": 120.0, "unit": "degrees"},
            "rep_state_machine": {
                "start_angle": 155.0,
                "target_angle": 120.0,
                "return_angle": 145.0,
                "hysteresis_buffer": 8.0
            }
        },
        {
            "id": "shoulder-flexion",
            "name": "Shoulder Flexion",
            "description": "Forward elevation of the arm in the sagittal plane to restore glenohumeral mobility and functional reach.",
            "body_region": "Upper Limb",
            "difficulty": "Intermediate",
            "camera_view": "Sagittal (Side Profile)",
            "target_joint": "Shoulder",
            "required_landmarks": ["left_hip", "left_shoulder", "left_elbow"],
            "instructions": [
                "Stand side-on to your camera so your profile is clearly visible.",
                "Keep your thumb pointing upward and elbow comfortably straight.",
                "Raise your arm forward and upward within your prescribed comfort zone.",
                "Hold momentarily at your peak reach.",
                "Gently lower your arm under control back to your side."
            ],
            "common_feedback": [
                "Do not arch your lower back to force extra height.",
                "Keep your shoulder relaxed and away from your ear.",
                "Stop before you reach a point of sharp pain or pinch."
            ],
            "default_rom": {"min": 50.0, "max": 160.0, "target": 135.0, "unit": "degrees"},
            "rep_state_machine": {
                "start_angle": 30.0,
                "target_angle": 125.0,
                "return_angle": 45.0,
                "hysteresis_buffer": 10.0
            }
        },
        {
            "id": "sit-to-stand",
            "name": "Sit-to-Stand Functional Transfer",
            "description": "Functional lower-limb strengthening and hip/knee extension stability transfer from a standard chair.",
            "body_region": "Lower Limb",
            "difficulty": "Intermediate",
            "camera_view": "Frontal (Full Body)",
            "target_joint": "Knee & Hip",
            "required_landmarks": ["left_shoulder", "left_hip", "left_knee", "left_ankle"],
            "instructions": [
                "Place a sturdy chair in view of your camera, 8 to 10 feet away.",
                "Cross your arms across your chest or keep hands resting on your thighs.",
                "Lean slightly forward and push through your heels to stand fully upright.",
                "Pause with hips and knees extended.",
                "Slowly lower yourself back into the seat under control."
            ],
            "common_feedback": [
                "Keep your knees tracking over your second toe.",
                "Avoid using momentum or rocking backwards.",
                "Make sure full body from head to feet remains inside the camera framing."
            ],
            "default_rom": {"min": 80.0, "max": 175.0, "target": 165.0, "unit": "degrees"},
            "rep_state_machine": {
                "start_angle": 90.0,
                "target_angle": 160.0,
                "return_angle": 105.0,
                "hysteresis_buffer": 10.0
            }
        }
    ]
    for ex in exercises_data:
        await exercises_col.insert_one(ex)

    # 4. Prescription
    presc = {
        "id": "presc-1",
        "patient_id": "patient-1",
        "therapist_id": "therapist-1",
        "exercise_id": "elbow-flexion",
        "exercise_name": "Elbow Flexion & Extension",
        "sets": 2,
        "target_reps": 10,
        "target_rom": 120.0,
        "min_rom": 40.0,
        "max_rom": 140.0,
        "tempo_seconds": {"concentric": 2.0, "eccentric": 2.0},
        "hold_duration_seconds": 1.0,
        "frequency_per_day": 2,
        "notes": "Focus on smooth eccentric control. Do not force past onset of discomfort. Target ROM set to 120°.",
        "camera_orientation": "Frontal (Full Body)",
        "feedback_enabled": True,
        "status": "ACTIVE",
        "updated_at": (datetime.utcnow() - timedelta(days=2)).isoformat()
    }
    await prescriptions_col.insert_one(presc)

    # 5. Historical Sessions (10 sessions)
    historical_roms = [82, 86, 91, 95, 98, 104, 108, 112, 110, 114]
    base_date = datetime.utcnow() - timedelta(days=9)

    for i, avg_rom in enumerate(historical_roms):
        session_date = base_date + timedelta(days=i)
        is_flagged_session = (i == 5) # Session #6 has flagged repetition
        
        reps_data = []
        target_r = 10
        comp_r = 8 if is_flagged_session else 10
        valid_r = 7 if is_flagged_session else 9

        for r_num in range(1, comp_r + 1):
            if is_flagged_session and r_num == 6:
                # Flagged rep: reached 108° vs target 120°
                reps_data.append({
                    "rep_number": r_num,
                    "peak_rom": 108.0,
                    "start_rom": 158.0,
                    "duration_seconds": 3.4,
                    "is_valid": False,
                    "flag": "range_below_target",
                    "confidence_score": 0.92
                })
            else:
                rep_rom = avg_rom + (r_num % 3 - 1) * 2
                reps_data.append({
                    "rep_number": r_num,
                    "peak_rom": float(rep_rom),
                    "start_rom": 156.0,
                    "duration_seconds": 3.1,
                    "is_valid": True,
                    "confidence_score": 0.94
                })

        form_flags = ["range_below_target"] if is_flagged_session else []
        review_status = "PENDING_REVIEW" if is_flagged_session else "REVIEWED"

        session_doc = {
            "id": f"session-hist-{i+1}",
            "patient_id": "patient-1",
            "prescription_id": "presc-1",
            "exercise_id": "elbow-flexion",
            "exercise_name": "Elbow Flexion & Extension",
            "started_at": session_date.strftime("%Y-%m-%dT18:30:00Z"),
            "completed_at": (session_date + timedelta(minutes=6)).strftime("%Y-%m-%dT18:36:00Z"),
            "duration_seconds": 240 + i * 15,
            "target_reps": target_r,
            "completed_reps": comp_r,
            "valid_reps": valid_r,
            "average_rom": float(avg_rom),
            "max_rom": float(avg_rom + 6),
            "tracking_confidence": 0.91 + (i * 0.005),
            "form_flags": form_flags,
            "joint_metrics": reps_data,
            "patient_notes": "Mild tightness at end range" if is_flagged_session else "Movement felt smooth today",
            "review_status": review_status,
            "is_manual_log": False
        }
        await sessions_col.insert_one(session_doc)

    print("✓ Successfully seeded RehabSense database with demo accounts, prescriptions, and 10 realistic sessions!")

if __name__ == "__main__":
    asyncio.run(seed_database())
