from typing import List
from fastapi import APIRouter, HTTPException
from app.models.schemas import NGO
from app.utils.helpers import MOCK_NGOS


router = APIRouter(prefix="/ngos", tags=["NGOs"])


@router.get("", response_model=List[NGO])
def list_ngos() -> List[NGO]:
    try:
        return MOCK_NGOS
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
