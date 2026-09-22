from fastapi import APIRouter
from seed import seed_database

router = APIRouter(prefix="/demo", tags=["Demo Management"])

@router.post("/reset")
async def reset_demo_state():
    """
    Resets demo database back to clean baseline with 10 historical sessions,
    active prescription, and flagged event ready for therapist inspection.
    """
    await seed_database()
    return {
        "status": "success",
        "message": "Demo database successfully reset to clean clinical baseline."
    }

@router.get("/info")
async def get_demo_info():
    return {
        "platform": "RehabSense",
        "tagline": "Your Recovery. Your Camera. Your Care Team.",
        "team": "TechHives",
        "problemStatement": "PS 05 — Camera-Assisted Home Rehabilitation Coach",
        "demo_accounts": {
            "patient": {
                "email": "patient@rehabsense.demo",
                "password": "Demo@123",
                "name": "Aarav Mehta",
                "condition": "Post-operative upper-limb rehabilitation"
            },
            "therapist": {
                "email": "therapist@rehabsense.demo",
                "password": "Demo@123",
                "name": "Dr. Ananya Sharma",
                "clinic": "Apex Physical Therapy & Orthopaedic Center"
            }
        },
        "flagged_session_sample": {
            "sessionId": "session-hist-6",
            "reason": "Rep #6 observed at 108° vs 120° target (range_below_target)"
        }
    }
