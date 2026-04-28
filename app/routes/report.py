from fastapi import APIRouter, HTTPException
from app.models.schemas import IssueRecord, ReportRequest
from app.services.container import firebase_service, gemini_service
from app.services.gemini_service import GeminiServiceError
from app.utils.helpers import choose_ngo_by_category


router = APIRouter(prefix="/report", tags=["Report"])


@router.post("", response_model=IssueRecord)
def report_problem(payload: ReportRequest) -> IssueRecord:
    try:
        analysis = gemini_service.analyze_issue(payload.description)
        category = analysis.get("category", "general")
        urgency = analysis.get("urgency", "medium")
        summary = analysis.get("summary", payload.description[:120])
        ngo = choose_ngo_by_category(category)

        saved = firebase_service.save_issue(
            {
                "description": payload.description,
                "image_url": payload.image_url,
                "location": payload.location.model_dump(),
                "category": category,
                "urgency": urgency,
                "summary": summary,
                "suggested_ngo": ngo.name,
                "status": "open",
            }
        )

        return IssueRecord(
            id=saved["id"],
            description=saved["description"],
            image_url=saved.get("image_url"),
            location=payload.location,
            category=saved["category"],
            urgency=saved["urgency"],
            summary=saved["summary"],
            suggested_ngo=saved["suggested_ngo"],
        )
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
