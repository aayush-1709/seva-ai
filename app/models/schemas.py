from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class ReportRequest(BaseModel):
    description: str = Field(..., min_length=5, max_length=5000)
    image_url: Optional[str] = None
    location: Location


class CivicReportCreate(BaseModel):
    """Public report form payload stored in Firestore `reports` collection."""

    category: str = Field(..., min_length=1, max_length=120)
    description: str = Field(..., min_length=1, max_length=5000)
    priority: Literal["low", "medium", "high"]
    location: Location


class CivicReportListItem(BaseModel):
    """Single Firestore `reports` document for map clients."""

    id: str
    category: str
    description: str
    priority: str
    status: str
    location: Location
    createdAt: Optional[str] = None
    assignedVolunteerId: Optional[str] = None
    assignedVolunteerName: Optional[str] = None
    assignedDistanceKm: Optional[float] = None
    assignedAt: Optional[str] = None


class AssignReportRequest(BaseModel):
    report_id: str = Field(..., min_length=1)


class AssignReportResponse(BaseModel):
    report_id: str
    volunteer_id: str
    volunteer_name: str
    distance_km: float
    status: str


class RefineReportRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=5000)


class RefineReportResponse(BaseModel):
    category: str
    urgency: str
    summary: str


class ReportSavedResponse(BaseModel):
    id: str


class IssueAnalysis(BaseModel):
    category: str
    urgency: str
    summary: str


class IssueRecord(BaseModel):
    id: str
    description: str
    image_url: Optional[str] = None
    location: Location
    category: str
    urgency: str
    summary: str
    suggested_ngo: str


class HelpRequest(BaseModel):
    request_text: str = Field(..., min_length=5, max_length=3000)
    location: Location


class NGO(BaseModel):
    name: str
    category: str
    contact: str
    distance_km: Optional[float] = None


class VolunteerRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=8, max_length=20)
    skills: List[str] = Field(default_factory=list)
    location: Location


class VolunteerRecord(BaseModel):
    id: str
    name: str
    phone: str
    skills: List[str]
    location: Location


class NearbyIssuesResponse(BaseModel):
    issues: List[IssueRecord]


class AssignTaskRequest(BaseModel):
    issue_id: str = Field(..., min_length=1)


class AssignTaskResponse(BaseModel):
    issue_id: str
    volunteer_id: str
    volunteer_name: str
    distance_km: float
    status: str
