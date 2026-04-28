from fastapi import APIRouter, HTTPException, Query
from app.config import get_settings
from app.models.schemas import (
    AssignTaskRequest,
    AssignTaskResponse,
    IssueRecord,
    Location,
    NearbyIssuesResponse,
)
from app.services.container import firebase_service, maps_service


router = APIRouter(tags=["Tasks"])
settings = get_settings()


@router.get("/issues/nearby", response_model=NearbyIssuesResponse)
def get_nearby_issues(lat: float = Query(...), lng: float = Query(...)) -> NearbyIssuesResponse:
    try:
        requester_location = Location(lat=lat, lng=lng)
        results = []
        for issue in firebase_service.get_issues():
            issue_location = Location(**issue["location"])
            distance = maps_service.calculate_distance_km(requester_location, issue_location)
            if distance <= settings.firestore_radius_km:
                results.append(
                    IssueRecord(
                        id=issue["id"],
                        description=issue["description"],
                        image_url=issue.get("image_url"),
                        location=issue_location,
                        category=issue.get("category", "general"),
                        urgency=issue.get("urgency", "medium"),
                        summary=issue.get("summary", ""),
                        suggested_ngo=issue.get("suggested_ngo", "Seva Health Collective"),
                    )
                )
        return NearbyIssuesResponse(issues=results)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/tasks/assign", response_model=AssignTaskResponse)
def assign_task(payload: AssignTaskRequest) -> AssignTaskResponse:
    try:
        issues = firebase_service.get_issues()
        issue = next((item for item in issues if item["id"] == payload.issue_id), None)
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")

        volunteers = firebase_service.get_volunteers()
        if not volunteers:
            raise HTTPException(status_code=404, detail="No volunteers available")

        issue_location = Location(**issue["location"])
        nearest = None
        nearest_distance = float("inf")
        for volunteer in volunteers:
            volunteer_location = Location(**volunteer["location"])
            distance = maps_service.calculate_distance_km(issue_location, volunteer_location)
            if distance < nearest_distance:
                nearest_distance = distance
                nearest = volunteer

        if nearest is None:
            raise HTTPException(status_code=404, detail="No volunteer could be assigned")

        assignment = {
            "assigned_volunteer_id": nearest["id"],
            "assigned_volunteer_name": nearest["name"],
            "assigned_distance_km": nearest_distance,
            "status": "assigned",
        }
        firebase_service.assign_issue(payload.issue_id, assignment)

        return AssignTaskResponse(
            issue_id=payload.issue_id,
            volunteer_id=nearest["id"],
            volunteer_name=nearest["name"],
            distance_km=nearest_distance,
            status="assigned",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
