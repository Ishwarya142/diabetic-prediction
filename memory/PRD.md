# PRD — MedAI Disease Prediction

## Original problem
Build full-stack AI-powered disease prediction app: FastAPI + React, with SHAP explainability, JWT auth, LLM-generated explanations, dashboard UI.

## Architecture
- Backend modular: routes/ services/ schemas/ core/. Pre-trained Random Forest pipeline + SHAP TreeExplainer loaded once at startup.
- LLM: Claude Sonnet 4.5 via Emergent Universal Key for natural-language summaries.
- Frontend: CRA + Tailwind + shadcn/ui dashboard with Sidebar, Recharts SHAP chart, probability gauge.

## Implemented (2026-04-25)
- ML training script (LR + RF on Pima); RF selected (F1=0.667).
- Endpoints: /api/auth/{register,login,me}, /api/predict, /api/explain/{id}, /api/report/{id}, /api/predictions, /api/stats, /api/health.
- JWT auth with bcrypt; demo user seeded on startup.
- Pages: Auth, Dashboard (stats + model card + recent), New Prediction (3 grouped cards), Result (probability ring + SHAP horizontal bar + AI explanation), History.
- SHAP horizontal bar chart with risk/safe color-coding (Terracotta/Moss).
- AI report includes mandatory disclaimer banner.
- Dockerfile + README with architecture diagram.

## Personas
- Clinician-style operator: runs screenings, reviews historical outcomes.

## Backlog (P1/P2)
- P1: PDF export of report
- P1: Multi-disease support (cancer, heart)
- P2: Batch CSV upload of patients
- P2: Redis caching for repeated identical predictions
- P2: Admin dashboard / model retraining trigger
