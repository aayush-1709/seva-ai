from typing import List
from fastapi import APIRouter, HTTPException
from app.models.schemas import HelpRequest, NGO
from app.services.container import gemini_service
from app.services.gemini_service import GeminiServiceError
from app.utils.helpers import MOCK_NGOS


router = APIRouter(prefix="/help", tags=["Help"])


@router.post("", response_model=List[NGO])
def request_help(payload: HelpRequest) -> List[NGO]:
    try:
        analysis = gemini_service.analyze_help_request(payload.request_text)
        type_of_help = analysis.get("type_of_help", "general-support").lower()
        matched = [
            ngo
            for ngo in MOCK_NGOS
            if type_of_help in ngo.category.lower() or "general" in type_of_help
        ]
        return matched or MOCK_NGOS[:2]
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
