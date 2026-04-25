"""Train Logistic Regression + Random Forest on Pima Diabetes dataset.
Saves the best preprocessing+model pipeline + a SHAP background sample.
Run: python /app/backend/train_model.py
"""
import json
import io
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, f1_score, precision_score,
                             recall_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ART_DIR = Path(__file__).parent / "artifacts"
ART_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
]
TARGET = "Outcome"

# Pima dataset CSV (well-known mirror)
PIMA_URL = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"


def load_data() -> pd.DataFrame:
    print(f"Downloading dataset from {PIMA_URL} ...")
    r = requests.get(PIMA_URL, timeout=30)
    r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text), header=None,
                     names=FEATURES + [TARGET])
    # In Pima, zeros for some columns mean missing → convert to NaN for proper imputation
    zero_as_nan = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
    df[zero_as_nan] = df[zero_as_nan].replace(0, np.nan)
    return df


def build_pipeline(model):
    pre = ColumnTransformer([
        ("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]), FEATURES),
    ])
    return Pipeline([("pre", pre), ("clf", model)])


def evaluate(name, pipe, X_test, y_test):
    pred = pipe.predict(X_test)
    return {
        "model": name,
        "accuracy": float(accuracy_score(y_test, pred)),
        "precision": float(precision_score(y_test, pred)),
        "recall": float(recall_score(y_test, pred)),
        "f1": float(f1_score(y_test, pred)),
    }


def main() -> None:
    df = load_data()
    X = df[FEATURES]
    y = df[TARGET].astype(int)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    candidates = {
        "logreg": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "rf": RandomForestClassifier(
            n_estimators=300, max_depth=8, class_weight="balanced",
            random_state=42, n_jobs=-1,
        ),
    }

    results = []
    fitted = {}
    for name, model in candidates.items():
        pipe = build_pipeline(model)
        pipe.fit(X_train, y_train)
        metrics = evaluate(name, pipe, X_test, y_test)
        results.append(metrics)
        fitted[name] = pipe
        print(f"{name}: {metrics}")

    best_name = max(results, key=lambda r: r["f1"])["model"]
    print(f"\nBest model: {best_name}")
    best_pipe = fitted[best_name]

    # Save artefacts
    joblib.dump(best_pipe, ART_DIR / "model.pkl")
    # Save background sample (transformed) for SHAP KernelExplainer
    background = X_train.sample(n=min(100, len(X_train)), random_state=42)
    joblib.dump(background, ART_DIR / "background.pkl")
    # Save raw training feature stats for input bounds
    stats = {
        "features": FEATURES,
        "best_model": best_name,
        "metrics": results,
        "feature_means": X_train.mean().to_dict(),
        "feature_mins": X_train.min(skipna=True).to_dict(),
        "feature_maxs": X_train.max(skipna=True).to_dict(),
    }
    with open(ART_DIR / "metadata.json", "w") as f:
        json.dump(stats, f, indent=2, default=str)
    print(f"Saved artefacts to {ART_DIR}")


if __name__ == "__main__":
    main()
