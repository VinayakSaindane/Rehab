"""
RehabSense — Comprehensive End-to-End Feature Verification Suite
Problem Statement 05 | Hackathon Testing Engine
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def log(self, section: str):
        print(f"\n{'='*60}\n  {section}\n{'='*60}", flush=True)

    def assert_test(self, name: str, condition: bool, details: str = ""):
        if condition:
            self.passed += 1
            print(f"  [PASS] {name}", flush=True)
            self.tests.append((name, "PASS", details))
        else:
            self.failed += 1
            print(f"  [FAIL] {name} -> {details}", flush=True)
            self.tests.append((name, "FAIL", details))

    def request(self, method: str, path: str, token: str = None, body: dict = None):
        url = f"{BASE_URL}{path}"
        data = json.dumps(body).encode('utf-8') if body else None
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                content = resp.read().decode('utf-8')
                return status, json.loads(content) if content else {}
        except urllib.error.HTTPError as e:
            content = e.read().decode('utf-8')
            try:
                err_json = json.loads(content)
            except:
                err_json = {"raw": content}
            return e.code, err_json
        except Exception as e:
            print(f"    [ERR] {method} {path} error: {e}", flush=True)
            return 500, {"error": str(e)}

def run_tests():
    t = TestRunner()

    # -------------------------------------------------------------
    # 1. Health & System Integrity
    # -------------------------------------------------------------
    t.log("1. Health & Database Integrity")
    status, data = t.request("GET", "/health")
    t.assert_test("Backend Health Check", status == 200, f"Status: {status}")
    t.assert_test("Database Storage Active", data.get("storage") in ["mongodb", "in-memory-fallback", "in_memory_fallback"], f"Storage: {data.get('storage')}")

    # Reset demo database to clean known baseline
    status, data = t.request("POST", "/api/demo/reset")
    t.assert_test("Demo Database Reset Endpoint", status == 200, f"Status: {status}")

    # -------------------------------------------------------------
    # 2. Authentication & 1-Click Role Switcher
    # -------------------------------------------------------------
    t.log("2. Authentication & Role Switching")
    # Patient switch
    status, data = t.request("POST", "/api/auth/demo-switch", body={"role": "PATIENT"})
    t.assert_test("1-Click Switch: PATIENT", status == 200 and "access_token" in data, f"Token obtained for {data.get('email')}")
    patient_token = data.get("access_token")

    # Therapist switch
    status, data = t.request("POST", "/api/auth/demo-switch", body={"role": "THERAPIST"})
    t.assert_test("1-Click Switch: THERAPIST", status == 200 and "access_token" in data, f"Token obtained for {data.get('email')}")
    therapist_token = data.get("access_token")

    # Hospital Admin switch
    status, data = t.request("POST", "/api/auth/demo-switch", body={"role": "HOSPITAL_ADMIN"})
    t.assert_test("1-Click Switch: HOSPITAL_ADMIN", status == 200 and "access_token" in data, f"Token obtained for {data.get('email')}")
    hospital_token = data.get("access_token")

    # Standard email/password login
    status, data = t.request("POST", "/api/auth/login", body={"email": "patient@rehabsense.demo", "password": "Demo@123"})
    t.assert_test("Standard Credentials Login", status == 200 and "access_token" in data, f"Status: {status}")

    # Auth Me check
    status, data = t.request("GET", "/api/auth/me", token=patient_token)
    t.assert_test("Verify /auth/me for current user", status == 200 and data.get("role") == "PATIENT", f"Role: {data.get('role')}")

    # -------------------------------------------------------------
    # 3. Patient Clinical Features & Telemetry
    # -------------------------------------------------------------
    t.log("3. Patient Portal & Progress Analytics")
    status, profile = t.request("GET", "/api/patients/me", token=patient_token)
    t.assert_test("Patient Profile Query", status == 200 and profile.get("name") == "Aarav Mehta", f"Name: {profile.get('name')}")

    status, dash = t.request("GET", "/api/patients/me/dashboard", token=patient_token)
    t.assert_test("Patient Dashboard Telemetry", status == 200, f"Status: {status}")
    t.assert_test("Patient Streak Days Active", dash.get("streak_days") >= 6, f"Streak: {dash.get('streak_days')}")
    t.assert_test("Patient Assigned Exercises Present", len(dash.get("todays_rehab", {}).get("assigned_exercises", [])) > 0, "Assigned list verified")

    status, prog = t.request("GET", "/api/patients/me/progress", token=patient_token)
    t.assert_test("Patient Progress Trends", status == 200 and "timeline" in prog, f"Sessions count: {len(prog.get('timeline', []))}")

    # -------------------------------------------------------------
    # 4. Exercise Library & Custom Database Creation (User Request)
    # -------------------------------------------------------------
    t.log("4. Exercise Library & Custom Protocol Builder")
    # All exercises
    status, exercises = t.request("GET", "/api/exercises", token=therapist_token)
    t.assert_test("List Exercises Endpoint", status == 200 and len(exercises) >= 3, f"Total: {len(exercises)}")

    # Exercise Library (Platform vs Custom separation)
    status, lib = t.request("GET", "/api/exercises/library", token=therapist_token)
    t.assert_test("Exercise Library Endpoint", status == 200 and "platform_exercises" in lib, f"Platform: {len(lib.get('platform_exercises', []))}")
    t.assert_test("Pre-stored Platform Exercises Included", len(lib.get("platform_exercises", [])) >= 3, f"Count: {len(lib.get('platform_exercises', []))}")

    # Add custom exercise if not in database
    custom_payload = {
        "name": "Hamstring Active Knee Curl",
        "description": "Prone active hamstring flexion for knee joint rehabilitation.",
        "body_region": "Lower Limb",
        "difficulty": "Intermediate",
        "camera_view": "Sagittal (Side Profile)",
        "target_joint": "Knee",
        "required_landmarks": ["left_hip", "left_knee", "left_ankle"],
        "instructions": ["Lie prone on mat", "Flex knee bringing heel to glutes", "Lower slowly"],
        "common_feedback": ["Do not arch lower back", "Maintain smooth cadence"],
        "target_rom": 115.0,
        "min_rom": 20.0,
        "max_rom": 130.0,
        "is_angle_decreasing_on_flex": True
    }
    status, created_ex = t.request("POST", "/api/exercises/custom", token=therapist_token, body=custom_payload)
    t.assert_test("Create Custom Exercise In Database", status == 200 and created_ex.get("is_custom") is True, f"ID: {created_ex.get('id')}")
    custom_id = created_ex.get("id")

    # Fetch custom exercise by ID
    status, fetched_ex = t.request("GET", f"/api/exercises/{custom_id}", token=therapist_token)
    t.assert_test("Fetch Custom Exercise By ID", status == 200 and fetched_ex.get("name") == custom_payload["name"], f"Name: {fetched_ex.get('name')}")

    # Delete custom exercise cleanup test
    status, del_resp = t.request("DELETE", f"/api/exercises/custom/{custom_id}", token=therapist_token)
    t.assert_test("Delete Custom Exercise", status == 200, f"Deleted: {custom_id}")

    # -------------------------------------------------------------
    # 5. Session Telemetry Ingestion & AI Summary
    # -------------------------------------------------------------
    t.log("5. Session Telemetry & AI Summary Generation")
    new_session_payload = {
        "patient_id": "patient-1",
        "prescription_id": "presc-1",
        "exercise_id": "elbow-flexion",
        "exercise_name": "Elbow Flexion & Extension",
        "started_at": "2026-09-27T14:00:00Z",
        "completed_at": "2026-09-27T14:05:00Z",
        "duration_seconds": 300,
        "target_reps": 10,
        "completed_reps": 9,
        "valid_reps": 8,
        "average_rom": 108.5,
        "max_rom": 114.0,
        "tracking_confidence": 0.94,
        "form_flags": ["range_below_target"],
        "compensation_flags": ["shoulder_hike"],
        "joint_metrics": [
            {"rep_number": 1, "peak_rom": 106.0, "duration_seconds": 3.1, "is_valid": True, "confidence_score": 0.94, "compensation_flags": []},
            {"rep_number": 2, "peak_rom": 108.0, "duration_seconds": 3.0, "is_valid": True, "confidence_score": 0.95, "compensation_flags": []},
            {"rep_number": 3, "peak_rom": 109.0, "duration_seconds": 3.2, "is_valid": True, "confidence_score": 0.93, "compensation_flags": ["shoulder_hike"]}
        ]
    }
    status, saved_session = t.request("POST", "/api/sessions", token=patient_token, body=new_session_payload)
    session_id = saved_session.get("id") or "session-hist-6"
    t.assert_test("Ingest Completed Session Telemetry", status == 200, f"Session ID: {session_id}")

    # AI Clinician Summary generation
    status, summary_resp = t.request("POST", f"/api/sessions/{session_id}/summary", token=patient_token)
    t.assert_test("Generate AI Session Summary", status == 200 and "patient_summary" in summary_resp, f"Summary length: {len(summary_resp.get('patient_summary', ''))}")

    # -------------------------------------------------------------
    # 6. Therapist Census & Session Review With Clinical Guidance
    # -------------------------------------------------------------
    t.log("6. Therapist Census, Review Portal & Clinical Guidance (User Request)")
    status, t_dash = t.request("GET", "/api/therapist/dashboard", token=therapist_token)
    t.assert_test("Therapist Dashboard Census Query", status == 200, f"Patients: {len(t_dash.get('patients', []))}")

    status, t_patient = t.request("GET", "/api/therapist/patients/patient-1", token=therapist_token)
    t.assert_test("Therapist Patient Dossier", status == 200 and t_patient.get("patient", {}).get("name") == "Aarav Mehta", "Patient details loaded")

    # Therapist Clinician Session Summary & Fault Analysis
    status, sum_details = t.request("GET", "/api/therapist/sessions/session-hist-6/summary", token=therapist_token)
    t.assert_test("Therapist Fault Analysis Endpoint", status == 200 and "flag_analysis" in sum_details, f"Flags analyzed: {len(sum_details.get('flag_analysis', []))}")

    # Review session with clinical guidance and ROM target calibration
    guidance_review_payload = {
        "action": "OVERRIDDEN",
        "clinical_reason": "Adjusted ROM target to 112° to account for elbow stiffness.",
        "new_target_rom": 112.0,
        "notes": "Patient advised to focus on shoulder depression.",
        "feedback": {
            "message": "Good effort today. I noticed your shoulder was elevating during reps 3-6. Relax the shoulder blade before initiating the lift.",
            "coaching_cues": ["Relax both shoulders down before each rep", "Keep upper arm pinned to your side"],
            "priority": "INFO"
        }
    }
    status, review_doc = t.request("POST", "/api/therapist/sessions/session-hist-6/review-with-feedback", token=therapist_token, body=guidance_review_payload)
    t.assert_test("Submit Review With Guidance & ROM Override", status == 200 and review_doc.get("feedback_sent") is True, f"Action: {review_doc.get('action')}")

    # Verify patient active prescription was updated with the new target ROM
    status, presc_list = t.request("GET", "/api/prescriptions?patient_id=patient-1", token=patient_token)
    updated_presc = next((p for p in presc_list if p.get("status") == "ADJUSTED" or p.get("target_rom") == 112.0), None)
    t.assert_test("Prescription Live Calibration to 112°", updated_presc is not None, f"Found target: {updated_presc.get('target_rom') if updated_presc else 'Not Found'}")

    # Verify patient dashboard now reflects the new therapist guidance & coaching cues
    status, updated_dash = t.request("GET", "/api/patients/me/dashboard", token=patient_token)
    therapist_msg = updated_dash.get("therapist_message", {})
    t.assert_test("Patient Dashboard Receives Live Guidance", therapist_msg.get("has_guidance") is True, f"From: {therapist_msg.get('from')}")
    t.assert_test("Patient Dashboard Displays Coaching Cues", len(therapist_msg.get("coaching_cues", [])) == 2, f"Cues: {therapist_msg.get('coaching_cues')}")

    # -------------------------------------------------------------
    # 7. Notifications Subsystem
    # -------------------------------------------------------------
    t.log("7. Notifications Subsystem")
    status, notifs = t.request("GET", "/api/notifications", token=patient_token)
    t.assert_test("Query Patient Notifications", status == 200 and len(notifs) > 0, f"Total notifications: {len(notifs)}")
    guidance_notif = next((n for n in notifs if n.get("type") == "THERAPIST_GUIDANCE"), None)
    t.assert_test("THERAPIST_GUIDANCE Notification In Bell", guidance_notif is not None, f"Title: {guidance_notif.get('title') if guidance_notif else 'None'}")

    if guidance_notif:
        status, _ = t.request("PATCH", f"/api/notifications/{guidance_notif['id']}/read", token=patient_token)
        t.assert_test("Mark Single Notification Read", status == 200, f"ID: {guidance_notif['id']}")

    status, _ = t.request("PATCH", "/api/notifications/read-all", token=patient_token)
    t.assert_test("Mark All Notifications Read", status == 200, "All read")

    # -------------------------------------------------------------
    # 8. Hospital & Telerehab B2B Marketplace
    # -------------------------------------------------------------
    t.log("8. Hospital Admin & Telerehab Marketplace")
    status, hosp_dash = t.request("GET", "/api/hospital/dashboard", token=hospital_token)
    t.assert_test("Hospital Admin Census & Capacity", status == 200 and "patients" in hosp_dash, f"Total patients: {hosp_dash.get('total_patients')}")

    status, therapists = t.request("GET", "/api/hospital/marketplace/therapists", token=patient_token)
    t.assert_test("Query Marketplace Clinician Profiles", status == 200 and len(therapists) > 0, f"Available therapists: {len(therapists)}")

    case_payload = {
        "patient_id": "patient-1",
        "therapist_id": therapists[0]["user_id"],
        "hospital_record_id": "hosp-rec-101",
        "patient_notes": "Post-elbow reconstruction rehab request."
    }
    status, case_resp = t.request("POST", "/api/hospital/case-requests", token=patient_token, body=case_payload)
    t.assert_test("Create Telerehab Case Request", status == 200, f"Case ID: {case_resp.get('id')}")
    case_id = case_resp.get("id")

    # Therapist quotes case
    status, quote_resp = t.request("POST", f"/api/hospital/case-requests/{case_id}/quote", token=therapist_token, body={"quoted_charge": 2500, "therapist_notes": "Includes 2 weekly live reviews."})
    t.assert_test("Therapist Submits Pricing Quote", status == 200 and quote_resp.get("status") in ["quoted", "QUOTED"], f"Status: {quote_resp.get('status')}")

    # Patient accepts quote
    status, accept_resp = t.request("POST", f"/api/hospital/case-requests/{case_id}/accept", token=patient_token)
    t.assert_test("Patient Accepts Quote", status == 200 and accept_resp.get("status") in ["accepted", "ACCEPTED"], f"Status: {accept_resp.get('status')}")

    # -------------------------------------------------------------
    # Test Summary Report
    # -------------------------------------------------------------
    t.log("TEST EXECUTION SUMMARY")
    total = t.passed + t.failed
    pct = round((t.passed / total) * 100, 1) if total > 0 else 0
    print(f"  Total Test Cases : {total}")
    print(f"  Passed           : {t.passed} ({pct}%)")
    print(f"  Failed           : {t.failed}")
    print("="*60)

    if t.failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
