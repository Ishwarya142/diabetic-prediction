"""Predict / Explain / Report / History routes."""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from core.security import get_current_user
from db import db
from schemas.api import PatientIn, PredictionOut, ReportOut
from services.llm_service import DISCLAIMER, generate_report
from services.ml_service import get_ml_service

router = APIRouter(tags=["prediction"])
log = logging.getLogger(__name__)


@router.post("/predict", response_model=PredictionOut)
async def predict(payload: PatientIn, current=Depends(get_current_user)):
    ml = get_ml_service()
    result = ml.predict(payload.model_dump())
    pid = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {
        "id": pid,
        "user_id": current["id"],
        "prediction": result["prediction"],
        "label": result["label"],
        "probability": result["probability"],
        "contributions": result["contributions"],
        "explanation": None,
        "inputs": payload.model_dump(),
        "created_at": now.isoformat(),
    }
    await db.predictions.insert_one(doc)
    return PredictionOut(
        id=pid,
        user_id=current["id"],
        prediction=result["prediction"],
        label=result["label"],
        probability=result["probability"],
        contributions=result["contributions"],
        explanation=None,
        inputs=payload,
        created_at=now,
    )


@router.get("/explain/{prediction_id}")
async def explain(prediction_id: str, current=Depends(get_current_user)):
    pred = await db.predictions.find_one(
        {"id": prediction_id, "user_id": current["id"]}, {"_id": 0}
    )
    if not pred:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found")
    return {
        "prediction_id": prediction_id,
        "label": pred["label"],
        "probability": pred["probability"],
        "contributions": pred["contributions"],
    }


@router.get("/report/{prediction_id}", response_model=ReportOut)
async def report(prediction_id: str, current=Depends(get_current_user)):
    pred = await db.predictions.find_one(
        {"id": prediction_id, "user_id": current["id"]}, {"_id": 0}
    )
    if not pred:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found")

    if pred.get("explanation"):
        explanation = pred["explanation"]
    else:
        explanation = await generate_report(
            pred["label"], pred["probability"], pred["contributions"]
        )
        await db.predictions.update_one(
            {"id": prediction_id}, {"$set": {"explanation": explanation}}
        )
    return ReportOut(
        prediction_id=prediction_id,
        explanation=explanation,
        disclaimer=DISCLAIMER,
    )


@router.get("/predictions")
async def history(current=Depends(get_current_user)):
    cur = db.predictions.find(
        {"user_id": current["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(100)
    items = await cur.to_list(100)
    return {"items": items}


@router.get("/stats")
async def stats(current=Depends(get_current_user)):
    items = await db.predictions.find(
        {"user_id": current["id"]}, {"_id": 0}
    ).to_list(1000)
    total = len(items)
    high = sum(1 for p in items if p["prediction"] == 1)
    avg_prob = (sum(p["probability"] for p in items) / total) if total else 0.0
    last = items[0]["created_at"] if items else None
    # Sort to get latest 5
    items.sort(key=lambda x: x["created_at"], reverse=True)
    ml = get_ml_service()
    return {
        "total": total,
        "high_risk": high,
        "low_risk": total - high,
        "avg_probability": avg_prob,
        "last_prediction_at": last,
        "model_metrics": ml.metadata.get("metrics", []),
        "best_model": ml.best_model,
        "recent": items[:5],
    }
