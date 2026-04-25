"""Disease-prediction FastAPI server (modular)."""
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT))  # so `routes`, `services`, etc. import cleanly

import os  # noqa: E402

from fastapi import APIRouter, FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

from core.security import hash_password  # noqa: E402
from db import db  # noqa: E402
from routes.auth import router as auth_router  # noqa: E402
from routes.prediction import router as pred_router  # noqa: E402
from services.ml_service import get_ml_service  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
log = logging.getLogger("server")

app = FastAPI(title="Disease Prediction API", version="1.0.0")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Disease Prediction API", "status": "ok"}


@api_router.get("/health")
async def health():
    ml = get_ml_service()
    return {
        "status": "healthy",
        "best_model": ml.best_model,
        "features": ml.features,
    }


app.include_router(api_router)
app.include_router(auth_router, prefix="/api")
app.include_router(pred_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception(_: Request, exc: Exception):
    log.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("startup")
async def warmup():
    # Preload ML pipeline + SHAP explainer
    get_ml_service()
    # Seed demo user (idempotent)
    import uuid
    from datetime import datetime, timezone
    existing = await db.users.find_one({"email": "demo@medai.app"})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "demo@medai.app",
            "name": "Demo Doctor",
            "password_hash": hash_password("Demo1234!"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        log.info("Seeded demo user demo@medai.app")
    log.info("Disease Prediction API ready.")
