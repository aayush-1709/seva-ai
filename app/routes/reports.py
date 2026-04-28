from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.models.schemas import (
    AssignReportRequest,
    AssignReportResponse,
    CivicReportCreate,
    CivicReportListItem,
    RefineReportRequest,
    RefineReportResponse,
    ReportSavedResponse,
)
from app.services.container import firebase_service, gemini_service
from app.services.gemini_service import GeminiServiceError
from app.utils.refine_report import normalize_refine_category, normalize_refine_urgency


router = APIRouter(prefix="/reports", tags=["Reports"])
settings = get_settings()


@router.get("", response_model=list[CivicReportListItem])
def list_civic_reports() -> list[CivicReportListItem]:
    rows = firebase_service.list_civic_reports()
    return [CivicReportListItem(**row) for row in rows]


@router.post("/assign", response_model=AssignReportResponse)
def assign_volunteer_to_report(payload: AssignReportRequest) -> AssignReportResponse:
    try:
        result = firebase_service.assign_nearest_volunteer_to_report(
            payload.report_id.strip(),
            max_radius_km=settings.firestore_radius_km,
        )
        return AssignReportResponse(
            report_id=str(result["report_id"]),
            volunteer_id=str(result["volunteer_id"]),
            volunteer_name=str(result["volunteer_name"]),
            distance_km=float(result["distance_km"]),
            status=str(result["status"]),
        )
    except ValueError as exc:
        msg = str(exc)
        status_code = 404
        if "not found" not in msg.lower():
            status_code = 400
        raise HTTPException(status_code=status_code, detail=msg) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/refine", response_model=RefineReportResponse)
def refine_report_with_ai(payload: RefineReportRequest) -> RefineReportResponse:
    try:
        raw = gemini_service.refine_report_description(payload.description.strip())
        category = normalize_refine_category(raw.get("category", ""))
        urgency = normalize_refine_urgency(raw.get("urgency", "medium"))
        summary = (raw.get("summary") or "").strip()
        if not summary:
            summary = payload.description.strip()[:500]
        return RefineReportResponse(category=category, urgency=urgency, summary=summary)
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("", response_model=ReportSavedResponse)
def create_report(payload: CivicReportCreate) -> ReportSavedResponse:
    try:
        saved = firebase_service.save_report(payload.model_dump())
        return ReportSavedResponse(id=saved["id"])
    except KeyError as exc:
        raise HTTPException(status_code=400, detail="Invalid report payload") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
