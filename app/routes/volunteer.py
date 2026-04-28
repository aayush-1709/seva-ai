from fastapi import APIRouter, HTTPException
from app.models.schemas import VolunteerRecord, VolunteerRegisterRequest
from app.services.container import firebase_service


router = APIRouter(prefix="/volunteer", tags=["Volunteer"])


@router.post("/register", response_model=VolunteerRecord)
def register_volunteer(payload: VolunteerRegisterRequest) -> VolunteerRecord:
    try:
        saved = firebase_service.save_volunteer(
            {
                "name": payload.name,
                "phone": payload.phone,
                "skills": payload.skills,
                "location": payload.location.model_dump(),
            }
        )
        return VolunteerRecord(
            id=saved["id"],
            name=saved["name"],
            phone=saved["phone"],
            skills=saved["skills"],
            location=payload.location,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
