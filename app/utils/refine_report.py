"""Normalize Gemini output for the civic report form (category IDs + urgency)."""

from typing import Literal


ReportCategoryId = Literal["infrastructure", "lighting", "water", "safety", "env", "other"]
PriorityLevel = Literal["low", "medium", "high"]

ALLOWED_CATEGORIES: frozenset[str] = frozenset(
    {"infrastructure", "lighting", "water", "safety", "env", "other"}
)


def normalize_refine_category(raw: str) -> ReportCategoryId:
    if not raw:
        return "other"
    key = raw.strip().lower().replace(" ", "_").replace("-", "_")
    synonyms: dict[str, ReportCategoryId] = {
        "infrastructure": "infrastructure",
        "infra": "infrastructure",
        "civil_works": "infrastructure",
        "roads": "infrastructure",
        "road": "infrastructure",
        "buildings": "infrastructure",
        "structural": "infrastructure",
        "lighting": "lighting",
        "street_lighting": "lighting",
        "streetlight": "lighting",
        "lights": "lighting",
        "water": "water",
        "sanitation": "water",
        "water_and_sanitation": "water",
        "safety": "safety",
        "public_safety": "safety",
        "crime": "safety",
        "environment": "env",
        "environmental": "env",
        "pollution": "env",
        "waste": "env",
        "other": "other",
        "general": "other",
    }
    if key in ALLOWED_CATEGORIES:
        return key  # type: ignore[return-value]
    if key in synonyms:
        return synonyms[key]
    for word in key.replace("_", " ").split():
        if word in synonyms:
            return synonyms[word]
    return "other"


def normalize_refine_urgency(raw: str) -> PriorityLevel:
    if not raw:
        return "medium"
    u = raw.strip().lower()
    if u in ("low", "medium", "high"):
        return u  # type: ignore[return-value]
    if any(x in u for x in ("critical", "severe", "emergency", "urgent", "immediate")):
        return "high"
    if any(x in u for x in ("minor", "low priority", "when convenient")):
        return "low"
    return "medium"
