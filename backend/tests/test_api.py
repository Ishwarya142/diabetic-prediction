"""Basic API smoke tests (run with `pytest backend/tests/`)."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from server import app  # noqa: E402

client = TestClient(app)


def _login():
    r = client.post(
        "/api/auth/login",
        json={"email": "demo@medai.app", "password": "Demo1234!"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "healthy"
    assert "Glucose" in body["features"]


def test_predict_requires_auth():
    r = client.post("/api/predict", json={
        "Pregnancies": 1, "Glucose": 120, "BloodPressure": 70,
        "SkinThickness": 20, "Insulin": 80, "BMI": 25.5,
        "DiabetesPedigreeFunction": 0.5, "Age": 30,
    })
    assert r.status_code == 401


def test_predict_flow():
    token = _login()
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/api/predict", json={
        "Pregnancies": 6, "Glucose": 148, "BloodPressure": 72,
        "SkinThickness": 35, "Insulin": 0, "BMI": 33.6,
        "DiabetesPedigreeFunction": 0.627, "Age": 50,
    }, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["prediction"] in (0, 1)
    assert 0.0 <= body["probability"] <= 1.0
    assert len(body["contributions"]) == 8
