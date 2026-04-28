import json
from typing import Dict, Optional
import requests
from app.config import get_settings


class GeminiServiceError(Exception):
    pass


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.gemini_api_key
        self.strict_mode = self.settings.gemini_strict_mode
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model_candidates = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ]

    def analyze_issue(self, description: str) -> Dict[str, str]:
        prompt = (
            "Analyze this issue and return strict JSON with keys "
            "category, urgency, summary. "
            f"Issue: {description}"
        )
        return self._ask_gemini(prompt)

    def analyze_help_request(self, request_text: str) -> Dict[str, str]:
        prompt = (
            "Analyze this help request and return strict JSON with keys "
            f"type_of_help, summary. Request: {request_text}"
        )
        return self._ask_gemini(prompt)

    def _ask_gemini(self, prompt: str) -> Dict[str, str]:
        if not self.api_key:
            return self._mock_response(prompt)

        last_error: Optional[str] = None
        for model_name in self.model_candidates:
            try:
                response = requests.post(
                    f"{self.base_url}/{model_name}:generateContent?key={self.api_key}",
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=20,
                )
                response.raise_for_status()
                data = response.json()
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "{}")
                )
                parsed = self._safe_parse_json(text)
                if parsed:
                    return parsed
                raise GeminiServiceError("Gemini response was not valid JSON")
            except requests.HTTPError as exc:
                details = ""
                if exc.response is not None:
                    details = exc.response.text
                    if exc.response.status_code == 404:
                        last_error = (
                            f"Model {model_name} unavailable for this key/project."
                        )
                        continue
                if self.strict_mode:
                    raise GeminiServiceError(
                        f"Gemini API request failed. {details}".strip()
                    ) from exc
                return self._mock_response(prompt)
            except requests.RequestException as exc:
                if self.strict_mode:
                    raise GeminiServiceError(f"Gemini network error: {exc}") from exc
                return self._mock_response(prompt)

        if self.strict_mode:
            raise GeminiServiceError(
                last_error
                or "No compatible Gemini model available. Try a valid AI Studio key."
            )

        return self._mock_response(prompt)

    @staticmethod
    def _safe_parse_json(raw_text: str) -> Dict[str, str]:
        cleaned = raw_text.strip().replace("```json", "").replace("```", "")
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return {k: str(v) for k, v in parsed.items()}
        except json.JSONDecodeError:
            pass
        return {}

    @staticmethod
    def _mock_response(prompt: str) -> Dict[str, str]:
        normalized = prompt.lower()
        if "help request" in normalized:
            return {
                "type_of_help": "general-support",
                "summary": "User needs local support and quick assistance.",
            }
        return {
            "category": "general",
            "urgency": "medium",
            "summary": "Reported issue requires validation by local team.",
        }
