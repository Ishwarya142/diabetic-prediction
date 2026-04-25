"""Pydantic schemas for the disease-prediction API."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, conint, confloat


# ---------- AUTH ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    name: str


# ---------- PREDICTION ----------
class PatientIn(BaseModel):
    """Pima Indians diabetes input — strict ranges based on training data."""
    Pregnancies: conint(ge=0, le=20)
    Glucose: confloat(ge=0, le=300)
    BloodPressure: confloat(ge=0, le=200)
    SkinThickness: confloat(ge=0, le=120)
    Insulin: confloat(ge=0, le=900)
    BMI: confloat(ge=0, le=80)
    DiabetesPedigreeFunction: confloat(ge=0, le=3)
    Age: conint(ge=1, le=120)


class FeatureContribution(BaseModel):
    feature: str
    value: float
    shap_value: float


class PredictionOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    prediction: int  # 0 = No diabetes, 1 = Diabetes
    label: str
    probability: float
    contributions: List[FeatureContribution]
    explanation: Optional[str] = None
    inputs: PatientIn
    created_at: datetime


class ReportOut(BaseModel):
    prediction_id: str
    explanation: str
    disclaimer: str
