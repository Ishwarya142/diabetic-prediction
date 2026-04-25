"""Loads model + SHAP explainer once at startup."""
import json
import logging
from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
import shap

ART_DIR = Path(__file__).resolve().parent.parent / "artifacts"
log = logging.getLogger(__name__)


class MLService:
    def __init__(self) -> None:
        self.pipeline = joblib.load(ART_DIR / "model.pkl")
        self.background = joblib.load(ART_DIR / "background.pkl")
        with open(ART_DIR / "metadata.json") as f:
            self.metadata: dict = json.load(f)
        self.features: List[str] = self.metadata["features"]
        self.best_model: str = self.metadata["best_model"]

        clf = self.pipeline.named_steps["clf"]
        pre = self.pipeline.named_steps["pre"]
        bg_transformed = pre.transform(self.background)
        if self.best_model == "rf":
            self.explainer = shap.TreeExplainer(clf)
            self._explainer_kind = "tree"
        else:
            self.explainer = shap.LinearExplainer(clf, bg_transformed)
            self._explainer_kind = "linear"
        log.info("ML pipeline loaded (best_model=%s)", self.best_model)

    def predict(self, payload: Dict[str, float]) -> Dict:
        X = pd.DataFrame([payload], columns=self.features)
        proba = float(self.pipeline.predict_proba(X)[0, 1])
        pred = int(proba >= 0.5)
        contributions = self._shap_contributions(X)
        return {
            "prediction": pred,
            "label": "High risk of diabetes" if pred == 1 else "Low risk of diabetes",
            "probability": proba,
            "contributions": contributions,
        }

    def _shap_contributions(self, X: pd.DataFrame) -> List[Dict]:
        pre = self.pipeline.named_steps["pre"]
        Xt = pre.transform(X)
        sv = self.explainer.shap_values(Xt)
        # For binary RF TreeExplainer: returns list of two arrays OR a 3-D array.
        # We want SHAP values for class 1.
        if isinstance(sv, list):
            shap_vals = np.asarray(sv[1])[0]
        else:
            arr = np.asarray(sv)
            if arr.ndim == 3:
                shap_vals = arr[0, :, 1]
            else:
                shap_vals = arr[0]
        out = []
        for i, feat in enumerate(self.features):
            out.append({
                "feature": feat,
                "value": float(X.iloc[0, i]),
                "shap_value": float(shap_vals[i]),
            })
        # Sort by absolute impact, descending
        out.sort(key=lambda r: abs(r["shap_value"]), reverse=True)
        return out


_singleton: MLService | None = None


def get_ml_service() -> MLService:
    global _singleton
    if _singleton is None:
        _singleton = MLService()
    return _singleton
