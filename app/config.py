import os
from functools import lru_cache
from pydantic import BaseModel, Field
from dotenv import load_dotenv


load_dotenv()


class Settings(BaseModel):
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_strict_mode: bool = Field(default=False, alias="GEMINI_STRICT_MODE")
    firebase_credentials_path: str = Field(
        default="", alias="FIREBASE_CREDENTIALS_PATH"
    )
    google_maps_api_key: str = Field(default="", alias="GOOGLE_MAPS_API_KEY")
    firestore_issues_collection: str = "issues"
    firestore_volunteers_collection: str = "volunteers"
    firestore_reports_collection: str = "reports"
    firestore_radius_km: float = 10.0

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            GEMINI_API_KEY=os.getenv("GEMINI_API_KEY", ""),
            GEMINI_STRICT_MODE=os.getenv("GEMINI_STRICT_MODE", "false").lower()
            == "true",
            FIREBASE_CREDENTIALS_PATH=os.getenv("FIREBASE_CREDENTIALS_PATH", ""),
            GOOGLE_MAPS_API_KEY=os.getenv("GOOGLE_MAPS_API_KEY", ""),
        )


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()
