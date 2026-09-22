import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from database import get_db_collection
from models.schemas import PrescriptionResponse, PrescriptionCreate, PrescriptionUpdate
from routers.auth import get_current_user

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.get("", response_model=List[PrescriptionResponse])
async def list_prescriptions(patient_id: Optional[str] = None):
    prescriptions_col = get_db_collection("prescriptions")
    query = {"patient_id": patient_id} if patient_id else {}
    cursor = prescriptions_col.find(query)
    return await cursor.to_list(length=100)

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(prescription_id: str):
    prescriptions_col = get_db_collection("prescriptions")
    presc = await prescriptions_col.find_one({"id": prescription_id})
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return presc

@router.post("", response_model=PrescriptionResponse)
async def create_prescription(presc_in: PrescriptionCreate, current_user: dict = Depends(get_current_user)):
    prescriptions_col = get_db_collection("prescriptions")
    doc = presc_in.dict()
    doc["id"] = f"presc-{uuid.uuid4().hex[:8]}"
    doc["updated_at"] = datetime.utcnow().isoformat()
    await prescriptions_col.insert_one(doc)
    return doc

@router.patch("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: str,
    update_in: PrescriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    prescriptions_col = get_db_collection("prescriptions")
    presc = await prescriptions_col.find_one({"id": prescription_id})
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")

    update_data = {k: v for k, v in update_in.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()

    await prescriptions_col.update_one({"id": prescription_id}, {"$set": update_data})
    updated = await prescriptions_col.find_one({"id": prescription_id})
    return updated
