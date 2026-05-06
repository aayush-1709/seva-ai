import json
import os
from google.cloud.firestore import SERVER_TIMESTAMP
from datetime import datetime, timezone
from typing import Dict, List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from app.config import get_settings
from app.models.schemas import Location
from app.services.maps_service import MapsService


class FirebaseService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._db = None
        self._issues_fallback: List[Dict] = []
        self._reports_fallback: List[Dict] = []
        self._volunteers_fallback: List[Dict] = []
        self._initialize()

    def _initialize(self) -> None:
        cred_path = self.settings.firebase_credentials_path
        cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON", "")

        if not cred_path and not cred_json:
            return
        try:
            if not firebase_admin._apps:
                if cred_path and os.path.isfile(cred_path):
                    # Local development: use the credentials file
                    firebase_admin.initialize_app(credentials.Certificate(cred_path))
                elif cred_json:
                    # Cloud deployment: parse JSON string from env var
                    cred_dict = json.loads(cred_json)
                    firebase_admin.initialize_app(credentials.Certificate(cred_dict))
                else:
                    return
            self._db = firestore.client()
        except Exception:
            self._db = None

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

    def save_issue(self, issue_payload: Dict) -> Dict:
        issue_payload["created_at"] = self._timestamp()
        if self._db is None:
            issue_id = f"local-issue-{len(self._issues_fallback) + 1}"
            record = {"id": issue_id, **issue_payload}
            self._issues_fallback.append(record)
            return record

        try:
            ref = self._db.collection(self.settings.firestore_issues_collection).document()
            ref.set(issue_payload)
            return {"id": ref.id, **issue_payload}
        except Exception:
            issue_id = f"local-issue-{len(self._issues_fallback) + 1}"
            record = {"id": issue_id, **issue_payload}
            self._issues_fallback.append(record)
            return record

    def save_report(self, report_payload: Dict) -> Dict:
        """Write a civic report to the `reports` collection (web form)."""
        location = report_payload.get("location") or {}
        if self._db is None:
            report_id = f"local-report-{len(self._reports_fallback) + 1}"
            record = {
                "id": report_id,
                "category": report_payload["category"],
                "description": report_payload["description"],
                "priority": report_payload["priority"],
                "location": location,
                "status": "pending",
                "createdAt": self._timestamp(),
            }
            self._reports_fallback.append(record)
            return record

        try:
            ref = self._db.collection(self.settings.firestore_reports_collection).document()
            ref.set(
                {
                    "category": report_payload["category"],
                    "description": report_payload["description"],
                    "priority": report_payload["priority"],
                    "location": location,
                    "status": "pending",
                    "createdAt": SERVER_TIMESTAMP,
                }
            )
            return {
                "id": ref.id,
                "category": report_payload["category"],
                "description": report_payload["description"],
                "priority": report_payload["priority"],
                "location": location,
                "status": "pending",
            }
        except Exception:
            report_id = f"local-report-{len(self._reports_fallback) + 1}"
            record = {
                "id": report_id,
                "category": report_payload["category"],
                "description": report_payload["description"],
                "priority": report_payload["priority"],
                "location": location,
                "status": "pending",
                "createdAt": self._timestamp(),
            }
            self._reports_fallback.append(record)
            return record

    def list_civic_reports(self) -> List[Dict]:
        """All documents from the `reports` collection (map / analytics)."""

        def to_item(doc_id: str, data: Dict) -> Optional[Dict]:
            loc = data.get("location")
            lat_f: float
            lng_f: float
            if isinstance(loc, dict):
                try:
                    lat_f = float(loc["lat"])
                    lng_f = float(loc["lng"])
                except (KeyError, TypeError, ValueError):
                    return None
            else:
                lat_attr = getattr(loc, "latitude", None)
                lng_attr = getattr(loc, "longitude", None)
                if lat_attr is None or lng_attr is None:
                    return None
                try:
                    lat_f = float(lat_attr)
                    lng_f = float(lng_attr)
                except (TypeError, ValueError):
                    return None
            item: Dict = {
                "id": doc_id,
                "category": str(data.get("category", "other")),
                "description": str(data.get("description", "")),
                "priority": str(data.get("priority", "medium")).lower(),
                "status": str(data.get("status", "pending")),
                "location": {"lat": lat_f, "lng": lng_f},
            }
            ca = data.get("createdAt")
            if ca is not None:
                if hasattr(ca, "isoformat"):
                    item["createdAt"] = ca.isoformat()
                else:
                    item["createdAt"] = str(ca)
            av = data.get("assignedVolunteerId")
            if av is not None:
                item["assignedVolunteerId"] = str(av)
            an = data.get("assignedVolunteerName")
            if an is not None:
                item["assignedVolunteerName"] = str(an)
            ad = data.get("assignedDistanceKm")
            if ad is not None:
                try:
                    item["assignedDistanceKm"] = float(ad)
                except (TypeError, ValueError):
                    pass
            aa = data.get("assignedAt")
            if aa is not None:
                item["assignedAt"] = (
                    aa.isoformat() if hasattr(aa, "isoformat") else str(aa)
                )
            return item

        if self._db is None:
            out: List[Dict] = []
            for r in self._reports_fallback:
                rid = str(r.get("id", ""))
                payload = {k: v for k, v in r.items() if k != "id"}
                row = to_item(rid, payload)
                if row:
                    out.append(row)
            return out

        try:
            result: List[Dict] = []
            for doc in self._db.collection(self.settings.firestore_reports_collection).stream():
                row = to_item(doc.id, doc.to_dict() or {})
                if row:
                    result.append(row)
            return result
        except Exception:
            out = []
            for r in self._reports_fallback:
                rid = str(r.get("id", ""))
                payload = {k: v for k, v in r.items() if k != "id"}
                row = to_item(rid, payload)
                if row:
                    out.append(row)
            return out

    @staticmethod
    def _volunteer_coords(location: object) -> Optional[tuple[float, float]]:
        if isinstance(location, dict):
            try:
                return float(location["lat"]), float(location["lng"])
            except (KeyError, TypeError, ValueError):
                return None
        lat_a = getattr(location, "latitude", None)
        lng_a = getattr(location, "longitude", None)
        if lat_a is not None and lng_a is not None:
            try:
                return float(lat_a), float(lng_a)
            except (TypeError, ValueError):
                return None
        return None

    def ensure_demo_volunteers_local(self) -> None:
        """Seed in-memory volunteers when Firestore is disabled and list is empty."""
        if self._db is not None:
            return
        if self._volunteers_fallback:
            return
        for payload in (
            {
                "name": "Aisha Khan",
                "phone": "+91-90000-10001",
                "skills": ["delivery", "first-aid"],
                "location": {"lat": 28.62, "lng": 77.205},
            },
            {
                "name": "Rahul Mehta",
                "phone": "+91-90000-10002",
                "skills": ["logistics"],
                "location": {"lat": 28.608, "lng": 77.218},
            },
            {
                "name": "Sarah Jones",
                "phone": "+91-90000-10003",
                "skills": ["coordination"],
                "location": {"lat": 28.625, "lng": 77.195},
            },
        ):
            self.save_volunteer(payload)

    def assign_nearest_volunteer_to_report(
        self, report_id: str, *, max_radius_km: float
    ) -> Dict[str, object]:
        self.ensure_demo_volunteers_local()
        reports = self.list_civic_reports()
        report = next((r for r in reports if r["id"] == report_id), None)
        if not report:
            raise ValueError("Report not found")

        report_loc = Location(**report["location"])
        volunteers = self.get_volunteers()
        candidates: List[tuple[float, Dict]] = []
        for v in volunteers:
            coords = self._volunteer_coords(v.get("location"))
            if coords is None:
                continue
            dist = MapsService.calculate_distance_km(
                report_loc, Location(lat=coords[0], lng=coords[1])
            )
            candidates.append((dist, v))

        if not candidates:
            raise ValueError("No volunteers available")

        nearby = [(d, v) for d, v in candidates if d <= max_radius_km]
        pool: List[tuple[float, Dict]] = nearby if nearby else list(candidates)
        nearest_distance, nearest = min(pool, key=lambda x: x[0])

        vid = str(nearest.get("id", ""))
        vname = str(nearest.get("name", "Volunteer"))
        updated = self._apply_report_assignment(
            report_id, vid, vname, float(nearest_distance)
        )
        if updated is None:
            raise ValueError("Failed to update report")
        return {
            "report_id": report_id,
            "volunteer_id": vid,
            "volunteer_name": vname,
            "distance_km": float(nearest_distance),
            "status": "assigned",
        }

    def assign_specific_volunteer_to_report(
        self, report_id: str, volunteer_id: str, *, max_radius_km: float
    ) -> Dict[str, object]:
        """Assign one volunteer by ID (volunteer self-claim). Respects collision with other assignees."""
        self.ensure_demo_volunteers_local()
        reports = self.list_civic_reports()
        report = next((r for r in reports if r["id"] == report_id), None)
        if not report:
            raise ValueError("Report not found")

        existing_raw = report.get("assignedVolunteerId")
        existing = str(existing_raw).strip() if existing_raw is not None else ""
        volunteer_id_clean = volunteer_id.strip()
        if existing and existing != volunteer_id_clean:
            raise ValueError("Report already assigned to another volunteer")

        report_loc = Location(**report["location"])
        volunteer = None
        for v in self.get_volunteers():
            if str(v.get("id", "")) == volunteer_id_clean:
                volunteer = v
                break
        if volunteer is None:
            raise ValueError("Volunteer not found")

        coords = self._volunteer_coords(volunteer.get("location"))
        if coords is None:
            raise ValueError("Volunteer has no usable location coordinates")

        distance = MapsService.calculate_distance_km(
            report_loc, Location(lat=coords[0], lng=coords[1])
        )
        if distance > max_radius_km * 8:
            raise ValueError(
                f"Volunteer is too far from this report ({distance:.1f} km). "
                "Move closer or contact dispatch."
            )

        vname = str(volunteer.get("name", "Volunteer"))
        updated = self._apply_report_assignment(
            report_id, volunteer_id_clean, vname, float(distance)
        )
        if updated is None:
            raise ValueError("Failed to update report")
        return {
            "report_id": report_id,
            "volunteer_id": volunteer_id_clean,
            "volunteer_name": vname,
            "distance_km": float(distance),
            "status": "assigned",
        }

    def patch_report_status(
        self,
        report_id: str,
        *,
        status: str,
        verifier_volunteer_id: Optional[str] = None,
    ) -> Dict:
        allowed = {"pending", "assigned", "in_progress", "resolved"}
        if status not in allowed:
            raise ValueError("Invalid status")

        report_row = next(
            (r for r in self.list_civic_reports() if r["id"] == report_id), None
        )
        if not report_row:
            raise ValueError("Report not found")

        if status == "resolved" and verifier_volunteer_id:
            assigned = str(report_row.get("assignedVolunteerId") or "").strip()
            if assigned != verifier_volunteer_id.strip():
                raise ValueError(
                    "Only the assigned volunteer can mark this report resolved"
                )

        if status == "in_progress" and verifier_volunteer_id:
            assigned = str(report_row.get("assignedVolunteerId") or "").strip()
            if assigned != verifier_volunteer_id.strip():
                raise ValueError(
                    "Only the assigned volunteer can move this report to in progress"
                )

        def apply_local(rid: str, new_status: str) -> Dict:
            for r in self._reports_fallback:
                if str(r.get("id")) == rid:
                    r["status"] = new_status
                    if new_status == "in_progress":
                        r["statusStartedAt"] = self._timestamp()
                    if new_status == "resolved":
                        r["resolvedAt"] = self._timestamp()
                    return dict(r)
            raise ValueError("Report not found")

        patch: Dict = {"status": status}
        if status == "in_progress":
            patch["statusStartedAt"] = SERVER_TIMESTAMP
        if status == "resolved":
            patch["resolvedAt"] = SERVER_TIMESTAMP

        if self._db is None:
            return apply_local(report_id, status)

        try:
            ref = self._db.collection(
                self.settings.firestore_reports_collection
            ).document(report_id)
            snapshot = ref.get()
            if not snapshot.exists:
                raise ValueError("Report not found")
            data = snapshot.to_dict() or {}
            if status == "resolved" and verifier_volunteer_id:
                assigned = str(data.get("assignedVolunteerId") or "").strip()
                if assigned != verifier_volunteer_id.strip():
                    raise ValueError(
                        "Only the assigned volunteer can mark this report resolved"
                    )
            if status == "in_progress" and verifier_volunteer_id:
                assigned = str(data.get("assignedVolunteerId") or "").strip()
                if assigned != verifier_volunteer_id.strip():
                    raise ValueError(
                        "Only the assigned volunteer can move this report to in progress"
                    )
            ref.update(patch)
            return {"id": report_id, **data, **patch}
        except ValueError:
            raise
        except Exception:
            return apply_local(report_id, status)

    def civic_report_after_update(self, report_id: str) -> Optional[Dict]:
        """Re-read one report row in list shape."""
        return next((r for r in self.list_civic_reports() if r["id"] == report_id), None)

    def _apply_report_assignment(
        self,
        report_id: str,
        volunteer_id: str,
        volunteer_name: str,
        distance_km: float,
    ) -> Optional[Dict]:
        patch = {
            "assignedVolunteerId": volunteer_id,
            "assignedVolunteerName": volunteer_name,
            "assignedDistanceKm": distance_km,
            "assignedAt": SERVER_TIMESTAMP,
            "status": "assigned",
        }
        if self._db is None:
            for r in self._reports_fallback:
                if str(r.get("id")) == report_id:
                    r["assignedVolunteerId"] = volunteer_id
                    r["assignedVolunteerName"] = volunteer_name
                    r["assignedDistanceKm"] = distance_km
                    r["assignedAt"] = self._timestamp()
                    r["status"] = "assigned"
                    return dict(r)
            return None
        try:
            ref = self._db.collection(
                self.settings.firestore_reports_collection
            ).document(report_id)
            snapshot = ref.get()
            if not snapshot.exists:
                return None
            ref.update(patch)
            data = snapshot.to_dict() or {}
            data.update(
                {
                    "assignedVolunteerId": volunteer_id,
                    "assignedVolunteerName": volunteer_name,
                    "assignedDistanceKm": distance_km,
                    "status": "assigned",
                }
            )
            data["assignedAt"] = self._timestamp()
            return {"id": report_id, **data}
        except Exception:
            for r in self._reports_fallback:
                if str(r.get("id")) == report_id:
                    r["assignedVolunteerId"] = volunteer_id
                    r["assignedVolunteerName"] = volunteer_name
                    r["assignedDistanceKm"] = distance_km
                    r["assignedAt"] = self._timestamp()
                    r["status"] = "assigned"
                    return dict(r)
            return None

    def get_issues(self) -> List[Dict]:
        if self._db is None:
            return self._issues_fallback

        try:
            docs = self._db.collection(self.settings.firestore_issues_collection).stream()
            return [{"id": doc.id, **doc.to_dict()} for doc in docs]
        except Exception:
            return self._issues_fallback

    def save_volunteer(self, volunteer_payload: Dict) -> Dict:
        volunteer_payload["created_at"] = self._timestamp()
        if self._db is None:
            volunteer_id = f"local-volunteer-{len(self._volunteers_fallback) + 1}"
            record = {"id": volunteer_id, **volunteer_payload}
            self._volunteers_fallback.append(record)
            return record

        try:
            ref = self._db.collection(
                self.settings.firestore_volunteers_collection
            ).document()
            ref.set(volunteer_payload)
            return {"id": ref.id, **volunteer_payload}
        except Exception:
            volunteer_id = f"local-volunteer-{len(self._volunteers_fallback) + 1}"
            record = {"id": volunteer_id, **volunteer_payload}
            self._volunteers_fallback.append(record)
            return record

    def get_volunteers(self) -> List[Dict]:
        if self._db is None:
            return self._volunteers_fallback

        try:
            docs = self._db.collection(self.settings.firestore_volunteers_collection).stream()
            return [{"id": doc.id, **doc.to_dict()} for doc in docs]
        except Exception:
            return self._volunteers_fallback

    def assign_issue(self, issue_id: str, assignment_payload: Dict) -> Optional[Dict]:
        if self._db is None:
            for issue in self._issues_fallback:
                if issue.get("id") == issue_id:
                    issue.update(assignment_payload)
                    return issue
            return None

        try:
            ref = self._db.collection(self.settings.firestore_issues_collection).document(
                issue_id
            )
            snapshot = ref.get()
            if not snapshot.exists:
                return None
            ref.update(assignment_payload)
            updated = ref.get().to_dict() or {}
            return {"id": issue_id, **updated}
        except Exception:
            for issue in self._issues_fallback:
                if issue.get("id") == issue_id:
                    issue.update(assignment_payload)
                    return issue
            return None
