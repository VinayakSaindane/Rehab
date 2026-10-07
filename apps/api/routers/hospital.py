"""
Hospital & Marketplace Router — Priority 4 / 5 / 6

Handles:
  - Hospital onboarding of new patients (/hospital)
  - Therapist marketplace profiles (/marketplace/therapists)
  - Case request flow (patient → therapist quote → accept)

IMPORTANT STUBS / TODO markers:
  - File uploads: stored as URL strings only. TODO: integrate real S3/GCS blob storage for production.
  - Payment: "Accept Quote" flips status to "accepted" with no real payment processing.
    TODO: integrate a payment gateway (Razorpay/Stripe) before production.
  - HOSPITAL_ADMIN seeding: demo hospital admin uses email hospital@rehabsense.demo.
"""

import uuid
import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from database import get_db_collection
from models.schemas import (
    HospitalOnboardingRecord, HospitalOnboardingCreate,
    TherapistProfile, CaseRequest, CaseRequestCreate, CaseRequestQuote
)
from routers.auth import get_current_user

router = APIRouter(prefix="/hospital", tags=["Hospital & Marketplace"])


async def resolve_patient_id(patient_id: Optional[str], patient_email: Optional[str]) -> Optional[str]:
    """Resolve frontend/demo identifiers to the canonical clinical patient id."""
    users_col = get_db_collection("users")
    patients_col = get_db_collection("patients")

    if patient_email:
        user = await users_col.find_one({"email": patient_email})
        if user:
            patient = await patients_col.find_one(
                {"$or": [{"id": user.get("id")}, {"user_id": user.get("id")}]}
            )
            return (patient or user).get("id")

    if patient_id:
        patient = await patients_col.find_one(
            {"$or": [{"id": patient_id}, {"user_id": patient_id}]}
        )
        if patient:
            return patient.get("id")

        # The browser demo seed uses a separate local-storage identity for
        # the same backend demo patient.
        if patient_id == "patient-001":
            patient = await patients_col.find_one({"id": "patient-1"})
            if patient:
                return patient["id"]

    if patient_email == "patient@demo.com":
        patient = await patients_col.find_one({"id": "patient-1"})
        if patient:
            return patient["id"]

    return patient_id


# ══════════════════════════════════════════════════════════════════
# HOSPITAL DASHBOARD
# ══════════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def hospital_dashboard(current_user: dict = Depends(get_current_user)):
    """
    Returns all onboarded patients with their current assignment status.
    Accessible by HOSPITAL_ADMIN and SUPER_ADMIN roles.
    """
    records_col = get_db_collection("hospital_onboarding")
    users_col = get_db_collection("users")
    cases_col = get_db_collection("case_requests")

    records_cursor = records_col.find({"hospital_id": current_user.get("hospital_id", "hosp-demo-1")})
    records = await records_cursor.to_list(length=100)

    enriched = []
    for rec in records:
        user = await users_col.find_one({"id": rec.get("patient_id")})
        # Check if there's an active/pending case request
        case = await cases_col.find_one(
            {"patient_id": rec.get("patient_id")},
            sort=[("created_at", -1)]
        )
        enriched.append({
            **rec,
            "patient_name": user.get("name", "Unknown") if user else rec.get("patient_name", "Unknown"),
            "case_status": case["status"] if case else "unassigned",
            "case_id": case["id"] if case else None
        })

    return {
        "hospital_name": current_user.get("hospital_name", "Demo Hospital"),
        "total_patients": len(records),
        "patients": enriched
    }


@router.post("/onboard", response_model=HospitalOnboardingRecord)
async def onboard_patient(
    payload: HospitalOnboardingCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Register a new patient into the RehabSense platform.
    Creates a PATIENT user account and a HospitalOnboardingRecord.
    """
    users_col = get_db_collection("users")
    records_col = get_db_collection("hospital_onboarding")
    patients_col = get_db_collection("patients")

    # Check if patient already exists
    existing = await users_col.find_one({"email": payload.patient_email})
    if existing:
        patient_id = existing["id"]
    else:
        import bcrypt
        patient_id = f"user-patient-{uuid.uuid4().hex[:8]}"
        # Hash a default password \u2014 patient should reset on first login (TODO for production)
        default_password = "RehabSense@123"
        hashed = bcrypt.hashpw(default_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_doc = {
            "id": patient_id,
            "email": payload.patient_email,
            "name": payload.patient_name,
            "role": "PATIENT",
            "hashed_password": hashed,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await users_col.insert_one(user_doc)

    # Keep the clinical patient profile in sync with the hospital account so a
    # therapist can load this patient from a separate session or device.
    patient_profile = {
        "id": patient_id,
        "user_id": patient_id,
        "name": payload.patient_name,
        "email": payload.patient_email,
        "age": 0,
        "gender": "Not specified",
        "condition_label": payload.operation_type,
        "hospital_id": payload.hospital_id,
        "current_streak_days": 0,
        "total_sessions_completed": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if not await patients_col.find_one({"id": patient_id}):
        await patients_col.insert_one(patient_profile)

    record_id = f"hosp-rec-{uuid.uuid4().hex[:8]}"
    record_doc = {
        "id": record_id,
        "patient_id": patient_id,
        "hospital_id": payload.hospital_id,
        "hospital_name": payload.hospital_name,
        "operation_type": payload.operation_type,
        "injury_description": payload.injury_description,
        "surgery_date": payload.surgery_date,
        # TODO: replace with actual uploaded file URLs from S3/GCS in production
        "uploaded_report_urls": payload.uploaded_report_urls,
        "status": "unassigned",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await records_col.insert_one(record_doc)

    return record_doc


@router.post("/onboard/upload-report")
async def upload_report(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    patient_email: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a health report file (PDF, image, etc.).

    TODO: In production, upload to S3/GCS and return a real signed URL.
    For the hackathon demo: saves to a local ./uploads/ directory and returns a mock URL.
    """
    # TODO: replace with real cloud storage (S3/GCS) upload — this is demo-only local storage
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    original_filename = os.path.basename(file.filename or "report")
    safe_filename = f"{uuid.uuid4().hex[:8]}_{original_filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Return a mock URL \u2014 in production this would be a real signed S3/GCS URL
    mock_url = f"/uploads/{safe_filename}"
    if patient_id or patient_email:
        documents_col = get_db_collection("hospital_documents")
        resolved_patient_id = await resolve_patient_id(patient_id, patient_email)
        await documents_col.insert_one({
            "id": f"hosp-doc-{uuid.uuid4().hex[:8]}",
            "patient_id": resolved_patient_id,
            "name": original_filename,
            "file_name": original_filename,
            "file_url": mock_url,
            "file_size": len(content),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "uploaded_by": current_user.get("id", "hospital"),
            "uploader_name": current_user.get("hospital_name", "Hospital"),
        })
    return {
        "url": mock_url,
        "filename": original_filename,
        "size_bytes": len(content),
        "stub": True,  # Clearly marked: this is a local-only URL, not a real hosted file
        "note": "TODO: replace with real cloud storage URL before production deployment"
    }


@router.get("/patients/{patient_id}/documents")
async def get_patient_documents(
    patient_id: str,
    patient_email: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Return hospital-uploaded files for a patient so assigned clinicians can open them."""
    records_col = get_db_collection("hospital_onboarding")
    documents_col = get_db_collection("hospital_documents")
    patient_ids = [patient_id]
    users_col = get_db_collection("users")
    patients_col = get_db_collection("patients")

    # A patient can be addressed by the UI user id, the clinical profile id,
    # or (for older demo records) the local mock id. Resolve all known aliases
    # so every care-team surface reads the same document set.
    patient = await patients_col.find_one(
        {"$or": [{"id": patient_id}, {"user_id": patient_id}]}
    )
    if patient:
        for candidate_id in (patient.get("id"), patient.get("user_id")):
            if candidate_id and candidate_id not in patient_ids:
                patient_ids.append(candidate_id)
    resolved_patient_id = await resolve_patient_id(patient_id, patient_email)
    if resolved_patient_id and resolved_patient_id not in patient_ids:
        patient_ids.append(resolved_patient_id)
    if patient_email:
        user = await users_col.find_one({"email": patient_email})
        if user:
            for candidate_id in (user.get("id"),):
                if candidate_id and candidate_id not in patient_ids:
                    patient_ids.append(candidate_id)
            patient = await patients_col.find_one({"user_id": user.get("id")})
            if patient:
                for candidate_id in (patient.get("id"), patient.get("user_id")):
                    if candidate_id and candidate_id not in patient_ids:
                        patient_ids.append(candidate_id)

    records = []
    for candidate_id in patient_ids:
        candidate_cursor = records_col.find({"patient_id": candidate_id}).sort("created_at", -1)
        records.extend(await candidate_cursor.to_list(length=100))
    records.sort(key=lambda record: record.get("created_at", ""), reverse=True)
    uploaded_documents = []
    for candidate_id in patient_ids:
        document_cursor = documents_col.find({"patient_id": candidate_id})
        uploaded_documents.extend(await document_cursor.to_list(length=100))

    documents = []
    for uploaded in uploaded_documents:
        documents.append({
            "id": uploaded["id"],
            "patient_id": patient_id,
            "name": uploaded.get("name", uploaded.get("file_name", "Clinical document")),
            "type": "Clinical Document",
            "file_name": uploaded.get("file_name"),
            "file_url": uploaded.get("file_url"),
            "file_size": uploaded.get("file_size"),
            "uploaded_at": uploaded.get("uploaded_at"),
            "uploaded_by": uploaded.get("uploaded_by", "hospital"),
            "uploader_name": uploaded.get("uploader_name", "Hospital"),
            "summary": "Clinical document uploaded by the hospital.",
        })
    for record in records:
        for index, url in enumerate(record.get("uploaded_report_urls", [])):
            filename = os.path.basename(url.split("?", 1)[0]) or f"clinical-report-{index + 1}"
            documents.append({
                "id": f"{record['id']}-document-{index}",
                "patient_id": patient_id,
                "name": f"{record.get('operation_type', 'Clinical')} Report #{index + 1}",
                "type": "Diagnosis Report",
                "file_name": filename,
                "file_url": url,
                "file_size": None,
                "uploaded_at": record.get("created_at"),
                "uploaded_by": record.get("hospital_id", "hospital"),
                "uploader_name": record.get("hospital_name", "Hospital"),
                "summary": record.get("injury_description") or "Clinical report uploaded by the hospital.",
            })
    return documents


# ══════════════════════════════════════════════════════════════════
# THERAPIST MARKETPLACE
# ══════════════════════════════════════════════════════════════════

@router.get("/marketplace/therapists")
async def list_therapist_profiles(
    specialization: Optional[str] = None,
    max_rate: Optional[float] = None
):
    """
    Return all therapist profiles for the patient-facing marketplace.
    Client-side filtering is also supported via query params (no search infra needed).
    """
    profiles_col = get_db_collection("therapist_profiles")
    cursor = profiles_col.find({})
    profiles = await cursor.to_list(length=100)

    # Apply optional server-side filters (mirrors what client-side filter does)
    if specialization:
        profiles = [
            p for p in profiles
            if any(specialization.lower() in s.lower() for s in p.get("specializations", []))
        ]
    if max_rate is not None:
        profiles = [
            p for p in profiles
            if p.get("per_program_rate") is None or p.get("per_program_rate", 0) <= max_rate
        ]

    return profiles


# ══════════════════════════════════════════════════════════════════
# CASE REQUESTS (Patient ← → Therapist quoting flow)
# ══════════════════════════════════════════════════════════════════

@router.post("/case-requests", response_model=CaseRequest)
async def create_case_request(
    payload: CaseRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Patient selects a therapist and submits a case request."""
    cases_col = get_db_collection("case_requests")
    patients_col = get_db_collection("patients")

    # Find patient record
    patient = await patients_col.find_one({"user_id": current_user["id"]})
    patient_id = patient["id"] if patient else current_user["id"]

    case_id = f"case-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    case_doc = {
        "id": case_id,
        "patient_id": patient_id,
        "therapist_id": payload.therapist_id,
        "hospital_record_id": payload.hospital_record_id,
        # TODO: payment gateway integration required before production
        "status": "pending_quote",
        "quoted_charge": None,
        "therapist_notes": None,
        "patient_notes": payload.patient_notes,
        "created_at": now,
        "updated_at": now
    }
    await cases_col.insert_one(case_doc)
    return case_doc


@router.get("/case-requests/mine")
async def get_my_case_requests(current_user: dict = Depends(get_current_user)):
    """Patient: list own case requests with therapist info."""
    cases_col = get_db_collection("case_requests")
    patients_col = get_db_collection("patients")

    patient = await patients_col.find_one({"user_id": current_user["id"]})
    patient_id = patient["id"] if patient else current_user["id"]

    cursor = cases_col.find({"patient_id": patient_id}).sort("created_at", -1)
    return await cursor.to_list(length=50)


@router.get("/case-requests/therapist")
async def get_therapist_case_requests(current_user: dict = Depends(get_current_user)):
    """Therapist: list incoming case requests."""
    cases_col = get_db_collection("case_requests")
    records_col = get_db_collection("hospital_onboarding")

    cursor = cases_col.find({"therapist_id": current_user["id"]}).sort("created_at", -1)
    cases = await cursor.to_list(length=50)

    # Enrich with hospital record details
    enriched = []
    for case in cases:
        hosp_rec = None
        if case.get("hospital_record_id"):
            hosp_rec = await records_col.find_one({"id": case["hospital_record_id"]})
        enriched.append({
            **case,
            "hospital_record": hosp_rec
        })

    return enriched


@router.post("/case-requests/{case_id}/quote", response_model=CaseRequest)
async def submit_quote(
    case_id: str,
    quote: CaseRequestQuote,
    current_user: dict = Depends(get_current_user)
):
    """Therapist submits a quoted charge for a case request."""
    cases_col = get_db_collection("case_requests")
    case = await cases_col.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case request not found")

    now = datetime.now(timezone.utc).isoformat()
    await cases_col.update_one(
        {"id": case_id},
        {"$set": {
            "status": "quoted",
            "quoted_charge": quote.quoted_charge,
            "therapist_notes": quote.therapist_notes,
            "updated_at": now
        }}
    )
    return {**case, "status": "quoted", "quoted_charge": quote.quoted_charge,
            "therapist_notes": quote.therapist_notes, "updated_at": now}


@router.post("/case-requests/{case_id}/accept")
async def accept_quote(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Patient accepts a therapist quote.

    STUB — no real payment processing happens here.
    TODO: Before production, integrate a real payment gateway (e.g. Razorpay) to collect
    quoted_charge before flipping status to 'accepted'. This is a UI demo stub only.
    """
    cases_col = get_db_collection("case_requests")
    case = await cases_col.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case request not found")
    if case.get("status") != "quoted":
        raise HTTPException(status_code=400, detail="Can only accept a quoted request")

    now = datetime.now(timezone.utc).isoformat()
    await cases_col.update_one(
        {"id": case_id},
        {"$set": {"status": "accepted", "updated_at": now}}
    )

    return {
        "message": "Quote accepted (DEMO STUB — no payment processed). Therapist will be notified.",
        "case_id": case_id,
        "status": "accepted",
        "stub": True,
        "note": "TODO: integrate real payment gateway before production"
    }


@router.post("/case-requests/{case_id}/decline")
async def decline_request(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Therapist declines a case request."""
    cases_col = get_db_collection("case_requests")
    case = await cases_col.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case request not found")

    now = datetime.now(timezone.utc).isoformat()
    await cases_col.update_one(
        {"id": case_id},
        {"$set": {"status": "declined", "updated_at": now}}
    )
    return {"message": "Case request declined", "case_id": case_id, "status": "declined"}
