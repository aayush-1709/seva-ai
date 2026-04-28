from typing import List, Optional
from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class ReportRequest(BaseModel):
    description: str = Field(..., min_length=5, max_length=5000)
    image_url: Optional[str] = None
    location: Location


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
