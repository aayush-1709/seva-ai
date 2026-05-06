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
        # Prefer newer flash models; IDs vary slightly by rollout — fall through on 404 / errors.
        self.model_candidates = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-001",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-1.5-pro",
        ]

    def analyze_issue(self, description: str) -> Dict[str, str]:
        prompt = (
            "Analyze this issue and return strict JSON with keys "
            "category, urgency, summary. "
            f"Issue: {description}"
        )
        return self._ask_gemini(prompt)

    def refine_report_description(self, description: str) -> Dict[str, str]:
        """SevaAI report form: classification, urgency, summary (strict JSON)."""
        prompt = (
            "You categorize civic-issue reports for a public intake form.\n\n"
            f"Issue description from the reporter:\n{description}\n\n"
            'Respond with a single JSON object only (no markdown, no preamble) with keys exactly '
            '"category", "urgency", "summary".\n'
            '"category" must be exactly one of: infrastructure, lighting, water, safety, env, other.\n'
            '"urgency" must be exactly one of: low, medium, high.\n'
            '"summary" must be 2–4 sentences: what is wrong, where implied, '
            "and why it matters; suitable as the submitted report description."
        )
        return self._ask_gemini(prompt, prefer_json_schema=True)

    def analyze_help_request(self, request_text: str) -> Dict[str, str]:
        prompt = (
            "Analyze this help request and return strict JSON with keys "
            f"type_of_help, summary. Request: {request_text}"
        )
        return self._ask_gemini(prompt)

    def _ask_gemini(
        self,
        prompt: str,
        *,
        prefer_json_schema: bool = False,
    ) -> Dict[str, str]:
        if not self.api_key:
            return self._mock_response(prompt)

        last_error: Optional[str] = None
        json_mode_attempts = [True, False] if prefer_json_schema else [False]

        for model_name in self.model_candidates:
            for use_json_mode in json_mode_attempts:
                try:
                    payload: Dict = {"contents": [{"parts": [{"text": prompt}]}]}
                    gen_cfg: Dict[str, object] = {
                        "temperature": 0.2,
                        "maxOutputTokens": 8192,
                    }
                    if use_json_mode:
                        gen_cfg["responseMimeType"] = "application/json"
                    payload["generationConfig"] = gen_cfg

                    response = requests.post(
                        f"{self.base_url}/{model_name}:generateContent?key={self.api_key}",
                        json=payload,
                        timeout=45,
                    )

                    if response.status_code == 400 and use_json_mode:
                        continue

                    response.raise_for_status()
                    data = response.json()

                    pf = data.get("promptFeedback") or {}
                    block_reason = pf.get("blockReason")
                    if block_reason:
                        raise GeminiServiceError(
                            f"Prompt blocked ({block_reason}). Rephrase the description."
                        )

                    candidates = data.get("candidates") or []
                    if not candidates:
                        detail = ""
                        error = data.get("error") or {}
                        if isinstance(error, dict) and error.get("message"):
                            detail = str(error["message"])
                        raise GeminiServiceError(
                            detail or "No response from Gemini (empty candidates)."
                        )

                    cand0 = candidates[0]
                    finish_raw = cand0.get("finishReason") or cand0.get("finish_reason")
                    finish = str(finish_raw).upper().replace("_", "")
                    if finish in ("SAFETY", "BLOCKLIST", "SPII", "MALFORMEDFUNCTIONCALL"):
                        raise GeminiServiceError(
                            "Model could not safely complete this text. "
                            "Remove personal details or emotionally charged wording and try again."
                        )
                    ok_finishes = (
                        "",
                        "STOP",
                        "MAXTOKENS",
                        "FINISHREASONUNSPECIFIED",
                    )
                    if finish and finish not in ok_finishes:
                        raise GeminiServiceError(f"Gemini stopped early: {finish_raw}")

                    parts = (cand0.get("content") or {}).get("parts") or []
                    texts: list[str] = []
                    for p in parts:
                        if isinstance(p, dict) and p.get("text"):
                            texts.append(str(p["text"]))
                    text_body = "\n".join(texts).strip()

                    parsed_obj = self._safe_parse_json(text_body)
                    if prefer_json_schema:
                        refined = self._coerce_refine_dict(parsed_obj)
                        # Accept if we extracted any structured signal
                        has_signal = refined.get(
                            "summary",
                        ).strip() or refined.get(
                            "category",
                        ).strip() or refined.get(
                            "urgency",
                        ).strip()
                        if has_signal:
                            return refined
                        raise GeminiServiceError(
                            "Could not parse refinement JSON. Shorten text or retry."
                        )
                    if parsed_obj:
                        flat: Dict[str, str] = {}
                        for k, v in parsed_obj.items():
                            flat[str(k)] = str(v) if v is not None else ""
                        return flat
                    raise GeminiServiceError("Gemini response was not valid JSON")

                except GeminiServiceError as exc:
                    if self.strict_mode:
                        raise exc
                    last_error = str(exc)
                except requests.HTTPError as exc:
                    details = ""
                    if exc.response is not None:
                        details = (exc.response.text or "")[:800]
                        if exc.response.status_code == 404:
                            last_error = f"Model {model_name} unavailable for this API key."
                            break
                        if exc.response.status_code == 400 and use_json_mode:
                            last_error = details or last_error or str(exc)
                            continue
                    if self.strict_mode:
                        raise GeminiServiceError(
                            f"Gemini API failed. {details or exc}".strip()
                        ) from exc
                    last_error = details or str(exc)
                    break
                except requests.RequestException as exc:
                    if self.strict_mode:
                        raise GeminiServiceError(f"Gemini network error: {exc}") from exc
                    last_error = str(exc)
                    break

        if self.strict_mode:
            raise GeminiServiceError(
                last_error
                or "No compatible Gemini model available. Check GEMINI_API_KEY."
            )

        return self._mock_response(prompt)

    @staticmethod
    def _extract_json_blob(raw_text: str) -> Optional[str]:
        stripped = raw_text.strip()
        if not stripped:
            return None
        for fence in ("```json", "```JSON", "```"):
            stripped = stripped.replace(fence, "")
        stripped = stripped.strip()

        decoder = json.JSONDecoder()
        for i, ch in enumerate(stripped):
            if ch != "{":
                continue
            try:
                _obj, end = decoder.raw_decode(stripped[i:])
                return stripped[i : i + end]
            except json.JSONDecodeError:
                continue
        return None

    @staticmethod
    def _safe_parse_json(raw_text: str) -> Dict[str, object]:
        cleaned = raw_text.strip()
        blobs_to_try = [cleaned]
        extracted = GeminiService._extract_json_blob(cleaned)
        if extracted and extracted != cleaned:
            blobs_to_try.insert(0, extracted)

        for blob in blobs_to_try:
            blob = blob.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(blob)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                continue
        return {}

    @staticmethod
    def _coerce_refine_dict(parsed: Dict[str, object]) -> Dict[str, str]:
        if not parsed:
            return {}

        lowered: Dict[str, object] = {}
        for k, v in parsed.items():
            if k is None:
                continue
            key = str(k).strip().lower().replace("-", "_")
            lowered[key] = v

        def as_text(val: object) -> str:
            if val is None:
                return ""
            if isinstance(val, (dict, list)):
                return json.dumps(val, ensure_ascii=False)
            return str(val).strip()

        category_src = lowered.get(
            "category",
            lowered.get(
                "issue_category",
                lowered.get(
                    "type",
                    lowered.get("label"),
                ),
            ),
        )
        urgency_src = lowered.get(
            "urgency",
            lowered.get("priority", lowered.get("severity", lowered.get("urgency_level"))),
        )
        summary_src = lowered.get(
            "summary",
            lowered.get(
                "description",
                lowered.get(
                    "refined_summary",
                    lowered.get("text"),
                ),
            ),
        )

        out: Dict[str, str] = {
            "category": as_text(category_src),
            "urgency": as_text(urgency_src),
            "summary": as_text(summary_src),
        }
        return out


    @staticmethod
    def _mock_response(prompt: str) -> Dict[str, str]:
        normalized = prompt.lower()
        refine_like = ("civic-issue" in normalized or "report form" in normalized) and (
            '"category"' in normalized or '"summary"' in normalized
        )
        if refine_like or (
            "categorize civic" in normalized and "json object" in normalized
        ):
            text = GeminiService._heuristic_offline_summary(prompt)
            return {
                "category": GeminiService._heuristic_offline_category(normalized),
                "urgency": GeminiService._heuristic_offline_urgency(normalized),
                "summary": text,
            }
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

    @staticmethod
    def _snippet_after_marker(prompt: str, marker: str) -> str:
        low = prompt.lower()
        mi = low.find(marker.lower())
        if mi < 0:
            return prompt[:800]
        return prompt[mi + len(marker) :].strip()[:2500]

    @staticmethod
    def _heuristic_offline_summary(prompt: str) -> str:
        body = GeminiService._snippet_after_marker(
            prompt,
            "description from the reporter:",
        ).strip()
        if not body or len(body) < 15:
            body = prompt[-800:] if len(prompt) > 800 else prompt
        body = body.replace("\n\n", "\n").strip()
        sentences = []
        opener = (
            body[:1].upper() + body[1:]
            if body
            else "The reporter described a civic issue."
        )
        sentences.append(opener.split("\n")[0].split(". ")[0][:400])
        sentences.append(
            "Please confirm exact location details on the map before submitting."
        )
        merged = ". ".join(s for s in sentences if s).strip()
        if not merged.endswith("."):
            merged += "."
        return merged

    @staticmethod
    def _heuristic_offline_category(normalized_prompt: str) -> str:
        blob = normalized_prompt[max(0, normalized_prompt.rfind("reporter:")) :]
        if any(
            k in blob
            for k in (
                "light",
                "lamp",
                "dark",
                "street light",
                "blackout",
            )
        ):
            return "lighting"
        if any(
            k in blob
            for k in (
                "water",
                "sewer",
                "drain",
                "flood",
                "leak",
                "pipe",
            )
        ):
            return "water"
        if any(
            k in blob
            for k in (
                "unsafe",
                "robbery",
                "theft",
                "accident",
                "crime",
                "violence",
            )
        ):
            return "safety"
        if any(
            k in blob
            for k in (
                "trash",
                "garbage",
                "pollution",
                "smoke",
                "tree",
                "park",
            )
        ):
            return "env"
        if any(
            k in blob
            for k in (
                "road",
                "pothole",
                "bridge",
                "footpath",
                "sidewalk",
                "construction",
            )
        ):
            return "infrastructure"
        return "other"

    @staticmethod
    def _heuristic_offline_urgency(normalized_prompt: str) -> str:
        blob = normalized_prompt[max(0, normalized_prompt.rfind("reporter:")) :]
        if any(
            k in blob
            for k in (
                "emergency",
                "urgent",
                "injured",
                "fire",
                "electr",
                "spark",
            )
        ):
            return "high"
        if any(k in blob for k in ("minor", "small", "cosmetic", "eventually")):
            return "low"
        return "medium"
