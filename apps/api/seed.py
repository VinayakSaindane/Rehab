import asyncio
import sys
import io
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from database import get_db_collection

# Fix Windows console encoding for Unicode output
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def utcnow() -> datetime:
    """Return timezone-aware UTC datetime (replaces deprecated datetime.utcnow())."""
    return datetime.now(timezone.utc)

async def seed_database():
    users_col = get_db_collection("users")
    patients_col = get_db_collection("patients")
    therapists_col = get_db_collection("therapists")
    exercises_col = get_db_collection("exercises")
    prescriptions_col = get_db_collection("prescriptions")
    sessions_col = get_db_collection("sessions")
    reviews_col = get_db_collection("therapist_reviews")
    notifications_col = get_db_collection("notifications")
    custom_exercises_col = get_db_collection("custom_exercises")

    # Clear existing demo data
    for col in [users_col, patients_col, therapists_col, exercises_col,
                prescriptions_col, sessions_col, reviews_col, notifications_col, custom_exercises_col]:
        if hasattr(col, "documents"):
            col.documents = []
        elif hasattr(col, "delete_many"):
            await col.delete_many({})

    demo_pw_hash = hash_password("Demo@123")
    now = utcnow()

    # 1. Users
    patient_user = {
        "id": "user-patient-1",
        "email": "patient@rehabsense.demo",
        "hashed_password": demo_pw_hash,
        "name": "Aarav Mehta",
        "role": "PATIENT",
        "created_at": (now - timedelta(days=15)).isoformat()
    }
    therapist_user = {
        "id": "user-therapist-1",
        "email": "therapist@rehabsense.demo",
        "hashed_password": demo_pw_hash,
        "name": "Dr. Ananya Sharma",
        "role": "THERAPIST",
        "created_at": (now - timedelta(days=60)).isoformat()
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
        "created_at": (now - timedelta(days=15)).isoformat()
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

    # 3. Exercises Library (all 3 types)
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
            "name": "Shoulder Flexion (Elevations)",
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
        },
        {
            "id": "knee-extension",
            "name": "Seated Knee Extension (Quad Strengthening)",
            "description": "Seated active knee extension to rebuild quadriceps control, patellar tracking, and end-range extension.",
            "body_region": "Lower Limb",
            "difficulty": "Beginner",
            "camera_view": "Sagittal (Side Profile)",
            "target_joint": "Knee",
            "required_landmarks": ["left_hip", "left_knee", "left_ankle"],
            "instructions": [
                "Sit upright in a firm chair with knees bent at 90 degrees.",
                "Position the camera side-on to clearly view your thigh and calf.",
                "Slowly kick your foot forward, straightening your knee as far as comfortable.",
                "Squeeze your thigh muscle for 1 second at full extension.",
                "Lower your foot smoothly back down under control."
            ],
            "common_feedback": [
                "Keep your back upright against the chair; avoid slouching.",
                "Control the descent; do not let your leg drop suddenly.",
                "Keep foot pointing straight forward without inward rotation."
            ],
            "default_rom": {"min": 90.0, "max": 180.0, "target": 170.0, "unit": "degrees"},
            "rep_state_machine": {
                "start_angle": 95.0,
                "target_angle": 165.0,
                "return_angle": 110.0,
                "hysteresis_buffer": 8.0
            }
        },
        {
            "id": "shoulder-abduction",
            "name": "Shoulder Abduction (Lateral Raise)",
            "description": "Coronal plane arm elevation to restore middle deltoid strength and scapulohumeral rhythm.",
            "body_region": "Upper Limb",
            "difficulty": "Intermediate",
            "camera_view": "Frontal (Full Body)",
            "target_joint": "Shoulder",
            "required_landmarks": ["left_hip", "left_shoulder", "left_elbow"],
            "instructions": [
                "Stand facing your camera with arms resting at your sides.",
                "Keep your torso tall and shoulders relaxed away from your ears.",
                "Smoothly lift your arm out to the side up to shoulder level (90 degrees).",
                "Hold for 1 second with palm facing downward.",
                "Slowly return your arm to your side under control."
            ],
            "common_feedback": [
                "Keep both shoulders level — avoid hiking the working shoulder.",
                "Do not lean your torso to the opposite side to assist the lift.",
                "Move smoothly and avoid jerky motions."
            ],
            "default_rom": {"min": 20.0, "max": 120.0, "target": 90.0, "unit": "degrees"},
            "rep_state_machine": {
                "start_angle": 25.0,
                "target_angle": 85.0,
                "return_angle": 35.0,
                "hysteresis_buffer": 6.0
            }
        },
        {
            "id": "trunk-mobility",
            "name": "Standing Trunk Lateral Mobility",
            "description": "Lateral trunk mobility exercise to restore lateral spinal flexion and thoracic spine mobility.",
            "body_region": "Spine & Core",
            "difficulty": "Beginner",
            "camera_view": "Frontal (Full Body)",
            "target_joint": "Spine",
            "required_landmarks": ["left_shoulder", "left_hip", "left_knee"],
            "instructions": [
                "Stand with feet shoulder-width apart and arms resting by your sides.",
                "Engage your abdominal core gently.",
                "Slide one hand down the side of your thigh, bending sideways at the waist.",
                "Hold momentarily at the comfortable end range.",
                "Return upright to center before switching sides."
            ],
            "common_feedback": [
                "Bend purely sideways without twisting or leaning forward.",
                "Keep both feet firmly grounded on the floor.",
                "Breathe normally throughout the movement."
            ],
            "default_rom": {"min": 0.0, "max": 45.0, "target": 28.0, "unit": "degrees"},
            "rep_state_machine": {
                "start_angle": 5.0,
                "target_angle": 25.0,
                "return_angle": 10.0,
                "hysteresis_buffer": 3.0
            }
        }
    ]
    for ex in exercises_data:
        await exercises_col.insert_one(ex)

    # 4. Active Prescription (Elbow Flexion)
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
        "notes": "Focus on smooth eccentric control. Do not force past onset of discomfort. Target ROM set to 120 degrees.",
        "camera_orientation": "Frontal (Full Body)",
        "feedback_enabled": True,
        "status": "ACTIVE",
        "updated_at": (now - timedelta(days=2)).isoformat()
    }
    await prescriptions_col.insert_one(presc)

    # 5. Historical Sessions (10 sessions over 10 days)
    historical_roms = [82, 86, 91, 95, 98, 104, 108, 112, 110, 114]
    base_date = now - timedelta(days=9)

    for i, avg_rom in enumerate(historical_roms):
        session_date = base_date + timedelta(days=i)
        is_flagged_session = (i == 5)  # Session #6 has flagged repetition

        reps_data = []
        target_r = 10
        comp_r = 8 if is_flagged_session else 10
        valid_r = 7 if is_flagged_session else 9

        for r_num in range(1, comp_r + 1):
            if is_flagged_session and r_num == 6:
                # Flagged rep: achieved 108° vs prescribed 120°
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
            "tracking_confidence": round(0.91 + (i * 0.005), 4),
            "form_flags": form_flags,
            "joint_metrics": reps_data,
            "patient_notes": "Mild tightness at end range" if is_flagged_session else "Movement felt smooth today",
            "review_status": review_status,
            "is_manual_log": False
        }
        await sessions_col.insert_one(session_doc)

    # 6. Seed a demo notification (therapist override pending)
    notification = {
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "patient_id": "patient-1",
        "type": "SESSION_REVIEWED",
        "title": "Session #6 Flagged for Review",
        "message": "Dr. Ananya Sharma has flagged Rep #6 in your session on Sep 16 for clinical review. No action needed — your care team is monitoring your progress.",
        "is_read": False,
        "created_at": (now - timedelta(hours=2)).isoformat(),
        "meta": {"session_id": "session-hist-6", "flagged_rep": 6}
    }
    await notifications_col.insert_one(notification)

    # ─── Priority 4-6: Hospital Admin, Therapist Profiles, Case Requests ───

    profiles_col = get_db_collection("therapist_profiles")
    hosp_col = get_db_collection("hospital_onboarding")
    cases_col = get_db_collection("case_requests")

    for col in [profiles_col, hosp_col, cases_col]:
        if hasattr(col, "documents"):
            col.documents = []
        elif hasattr(col, "delete_many"):
            await col.delete_many({})

    # Hospital admin user
    hosp_admin_user = {
        "id": "user-hospital-1",
        "email": "hospital@rehabsense.demo",
        "hashed_password": demo_pw_hash,
        "name": "Apollo Orthopedics Admin",
        "role": "HOSPITAL_ADMIN",
        "hospital_id": "hosp-demo-1",
        "hospital_name": "Apollo Orthopedics Hospital",
        "created_at": (now - timedelta(days=30)).isoformat()
    }
    await users_col.insert_one(hosp_admin_user)

    # Therapist marketplace profiles (browsable by patients)
    therapist_marketplace_profiles = [
        {
            "id": "tp-1",
            "user_id": "user-therapist-1",
            "name": "Dr. Ananya Sharma",
            "email": "therapist@rehabsense.demo",
            "title": "Lead Musculoskeletal Physiotherapist",
            "bio": "12 years specializing in post-operative upper and lower limb rehabilitation. Certified in manual therapy and McKenzie method.",
            "specializations": ["Musculoskeletal", "Post-operative", "Upper Limb", "Sports Injury"],
            "years_experience": 12,
            "per_program_rate": 8500.0,  # INR per 4-week program
            "availability": "Mon-Sat, 9 AM – 6 PM",
            "clinic_name": "Sharma Rehab Clinic, Bengaluru",
            "active_patients_count": 14
        },
        {
            "id": "tp-2",
            "user_id": "user-therapist-2",
            "name": "Dr. Rohan Kapoor",
            "email": "rohan.kapoor@rehabsense.demo",
            "title": "Senior Physiotherapist",
            "bio": "8 years of experience in neurological and orthopaedic rehabilitation. Special interest in geriatric mobility restoration.",
            "specializations": ["Neurological", "Orthopaedic", "Geriatric", "Knee & Hip"],
            "years_experience": 8,
            "per_program_rate": 6000.0,
            "availability": "Mon-Fri, 10 AM – 5 PM",
            "clinic_name": "Kapoor Physio Centre, Mumbai",
            "active_patients_count": 9
        },
        {
            "id": "tp-3",
            "user_id": "user-therapist-3",
            "name": "Dr. Priya Nair",
            "email": "priya.nair@rehabsense.demo",
            "title": "Sports & Trauma Rehab Specialist",
            "bio": "Former national-level athlete turned rehabilitation specialist. Expert in ACL recovery, rotator cuff injuries, and functional movement restoration.",
            "specializations": ["Sports Injury", "ACL Recovery", "Shoulder & Rotator Cuff", "Post-operative"],
            "years_experience": 6,
            "per_program_rate": 7200.0,
            "availability": "Tue-Sun, 8 AM – 4 PM",
            "clinic_name": "ActiveRehab, Chennai",
            "active_patients_count": 11
        }
    ]
    for profile in therapist_marketplace_profiles:
        await profiles_col.insert_one(profile)

    # Hospital onboarding record for demo patient
    hosp_record = {
        "id": "hosp-rec-demo-1",
        "patient_id": "patient-1",
        "hospital_id": "hosp-demo-1",
        "hospital_name": "Apollo Orthopedics Hospital",
        "operation_type": "Elbow Ligament Reconstruction",
        "injury_description": "Post-operative rehabilitation following left elbow UCL reconstruction. Patient recovering from sports-related ligament tear.",
        "surgery_date": "2026-09-01",
        # TODO: replace with real file storage URLs for production
        "uploaded_report_urls": ["/uploads/demo-pre-op-report.pdf"],
        "status": "active",
        "created_at": (now - timedelta(days=15)).isoformat()
    }
    await hosp_col.insert_one(hosp_record)

    # Demo case request (already accepted, matching the active prescription)
    case_request = {
        "id": "case-demo-1",
        "patient_id": "patient-1",
        "therapist_id": "user-therapist-1",
        "hospital_record_id": "hosp-rec-demo-1",
        # TODO: payment gateway integration required before production — quoted_charge is display-only
        "status": "accepted",
        "quoted_charge": 8500.0,
        "therapist_notes": "Standard 4-week post-operative elbow rehab program. Will start with ROM exercises and progress to strengthening.",
        "patient_notes": "Hoping to recover full ROM within 6 weeks.",
        "created_at": (now - timedelta(days=14)).isoformat(),
        "updated_at": (now - timedelta(days=13)).isoformat()
    }
    await cases_col.insert_one(case_request)

    print("[OK] Successfully seeded RehabSense database with demo accounts, all 3 exercises, prescriptions, 10 sessions, notifications, hospital admin, therapist profiles, and marketplace case requests!")

if __name__ == "__main__":
    asyncio.run(seed_database())

