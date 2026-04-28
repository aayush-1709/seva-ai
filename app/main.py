import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes.report import router as report_router
from app.routes.reports import router as reports_router
from app.routes.help import router as help_router
from app.routes.volunteer import router as volunteer_router
from app.routes.ngo import router as ngo_router
from app.routes.tasks import router as tasks_router


app = FastAPI(
    title="SevaAI Backend",
    description="AI-powered civic issue reporting and assistance backend.",
    version="1.0.0",
)

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_extra = os.getenv("ALLOWED_ORIGINS", "")
if _extra:
    _default_origins.extend([o.strip() for o in _extra.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> JSONResponse:
    return JSONResponse(
        content={
            "message": "SevaAI backend is running",
            "docs": "http://127.0.0.1:8000/docs",
        }
    )


@app.get("/health")
def health_check() -> JSONResponse:
    return JSONResponse(content={"status": "ok"})


@app.get("/health/services")
def services_health() -> JSONResponse:
    settings = get_settings()
    return JSONResponse(
        content={
            "gemini_key_loaded": bool(settings.gemini_api_key),
            "gemini_strict_mode": settings.gemini_strict_mode,
            "maps_key_loaded": bool(settings.google_maps_api_key),
            "firebase_credentials_path_loaded": bool(settings.firebase_credentials_path),
        }
    )


app.include_router(report_router)
app.include_router(reports_router)
app.include_router(help_router)
app.include_router(volunteer_router)
app.include_router(ngo_router)
app.include_router(tasks_router)
