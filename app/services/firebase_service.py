import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from app.config import get_settings


class FirebaseService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._db = None
        self._issues_fallback: List[Dict] = []
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
