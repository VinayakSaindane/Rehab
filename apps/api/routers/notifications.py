import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from database import get_db_collection
from models.schemas import NotificationResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(current_user: dict = Depends(get_current_user)):
    """Return all unread (and recent) notifications for the authenticated patient."""
    notifications_col = get_db_collection("notifications")
    patient_id = current_user.get("patient_id") or "patient-1"
    cursor = notifications_col.find({"patient_id": patient_id})
    results = await cursor.to_list(length=50)
    # Sort newest first
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a single notification as read."""
    notifications_col = get_db_collection("notifications")
    notif = await notifications_col.find_one({"id": notification_id})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    await notifications_col.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True}}
    )
    updated = await notifications_col.find_one({"id": notification_id})
    return updated


@router.patch("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read for the current patient."""
    notifications_col = get_db_collection("notifications")
    patient_id = current_user.get("patient_id") or "patient-1"
    await notifications_col.update_many(
        {"patient_id": patient_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}


async def create_notification(
    patient_id: str,
    notif_type: str,
    title: str,
    message: str,
    meta: dict = None
):
    """Helper called internally when therapist reviews/overrides a session."""
    notifications_col = get_db_collection("notifications")
    notif = {
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "patient_id": patient_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "is_read": False,
        "created_at": utcnow(),
        "meta": meta or {}
    }
    await notifications_col.insert_one(notif)
    return notif
