"""Real HTTP smoke tests against deployed REACT_APP_BACKEND_URL."""
import os
import uuid
import time
import pathlib
import pytest
import requests

# Read REACT_APP_BACKEND_URL from frontend/.env (no defaults)
ENV_PATH = pathlib.Path("/app/frontend/.env")
BASE_URL = None
for line in ENV_PATH.read_text().splitlines():
    if line.startswith("REACT_APP_BACKEND_URL="):
        BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
        break
assert BASE_URL, "REACT_APP_BACKEND_URL missing"

DEMO_EMAIL = "demo@medai.app"
DEMO_PASS = "Demo1234!"

VALID_PAYLOAD = {
    "Pregnancies": 6, "Glucose": 148, "BloodPressure": 72,
    "SkinThickness": 35, "Insulin": 0, "BMI": 33.6,
    "DiabetesPedigreeFunction": 0.627, "Age": 50,
}


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "healthy"
    assert "best_model" in body
    assert "Glucose" in body["features"]
    assert len(body["features"]) == 8


def test_register_new_user():
    email = f"TEST_{uuid.uuid4().hex[:10]}@medai.app"
    r = requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "Pass1234!", "name": "Tester"},
                      timeout=20)
    assert r.status_code in (200, 201), r.text
    body = r.json()
    assert "access_token" in body
    assert isinstance(body["access_token"], str) and len(body["access_token"]) > 10


def test_login_demo(token):
    assert isinstance(token, str) and len(token) > 10


def test_auth_me(auth_headers):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == DEMO_EMAIL


def test_predict_requires_auth():
    r = requests.post(f"{BASE_URL}/api/predict", json=VALID_PAYLOAD, timeout=15)
    assert r.status_code == 401


def test_predict_invalid_payload(auth_headers):
    bad = dict(VALID_PAYLOAD); bad["Glucose"] = 999
    r = requests.post(f"{BASE_URL}/api/predict", json=bad, headers=auth_headers, timeout=15)
    assert r.status_code == 422


@pytest.fixture(scope="session")
def created_prediction(token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.post(f"{BASE_URL}/api/predict", json=VALID_PAYLOAD, headers=headers, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["prediction"] in (0, 1)
    assert 0.0 <= body["probability"] <= 1.0
    assert len(body["contributions"]) == 8
    # contributions sorted by abs(shap_value) desc
    abs_vals = [abs(c["shap_value"]) for c in body["contributions"]]
    assert abs_vals == sorted(abs_vals, reverse=True)
    return body


def test_predict_valid(created_prediction):
    assert "id" in created_prediction


def test_explain(auth_headers, created_prediction):
    pid = created_prediction["id"]
    r = requests.get(f"{BASE_URL}/api/explain/{pid}", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert "contributions" in body
    assert len(body["contributions"]) == 8


def test_report(auth_headers, created_prediction):
    pid = created_prediction["id"]
    r = requests.get(f"{BASE_URL}/api/report/{pid}", headers=auth_headers, timeout=60)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "explanation" in body and isinstance(body["explanation"], str) and len(body["explanation"]) > 20
    assert "disclaimer" in body


def test_predictions_history(auth_headers):
    r = requests.get(f"{BASE_URL}/api/predictions", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    # API returns {"items": [...]}
    assert "items" in body and isinstance(body["items"], list)
    assert len(body["items"]) >= 1


def test_stats(auth_headers):
    r = requests.get(f"{BASE_URL}/api/stats", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    for key in ("total", "high_risk", "low_risk", "avg_probability", "model_metrics", "recent"):
        assert key in body, f"missing {key}"
