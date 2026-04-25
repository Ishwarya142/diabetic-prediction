# MedAI — Disease Prediction (Diabetes)

Full-stack, explainable AI app for diabetes-risk screening.

```
┌────────────────────────────┐         ┌──────────────────────────────┐
│   React (CRA + Tailwind)   │ ──────▶ │   FastAPI (modular)          │
│   - Auth / Dashboard       │  HTTPS  │   - JWT auth                 │
│   - Recharts SHAP viz      │ ◀────── │   - /predict /explain /report│
└────────────────────────────┘         │   - sklearn (RandomForest)    │
                                       │   - SHAP TreeExplainer        │
                                       │   - Claude Sonnet 4.5 (LLM)   │
                                       └──────────────┬───────────────┘
                                                      │
                                                ┌─────▼─────┐
                                                │ MongoDB   │
                                                │ (motor)   │
                                                └───────────┘
```

## Stack
- Backend: FastAPI, scikit-learn, SHAP, joblib, motor, JWT, bcrypt, Claude Sonnet 4.5 (via Emergent Universal Key)
- Frontend: React + CRA, Tailwind, shadcn/ui, Recharts, Axios
- ML: Random Forest vs Logistic Regression on Pima Indians dataset (best F1 wins)

## Folder structure
```
backend/
  server.py              # FastAPI entry + middleware + startup
  db.py                  # Mongo client
  train_model.py         # ML training script (LR + RF)
  Dockerfile
  artifacts/             # model.pkl, background.pkl, metadata.json
  core/security.py       # JWT + bcrypt
  routes/auth.py         # /api/auth/{register,login,me}
  routes/prediction.py   # /api/predict /api/explain /api/report /api/predictions /api/stats
  schemas/api.py         # Pydantic models
  services/ml_service.py # pipeline + SHAP explainer
  services/llm_service.py# Claude Sonnet 4.5 report
  tests/test_api.py
frontend/src/
  App.js
  pages/{AuthPage,Dashboard,NewPrediction,Result,History}.jsx
  components/{Sidebar,AppShell}.jsx
  hooks/useAuth.jsx
  services/api.js
```

## Local run
```bash
# backend
cd backend
pip install -r requirements.txt
pip install scikit-learn shap joblib pyjwt
python train_model.py     # produces artifacts/
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# frontend
cd frontend
yarn install
yarn start
```

## Demo credentials
- Email: `demo@medai.app`
- Password: `Demo1234!`
(Auto-seeded on backend startup.)

## Deployment
- Backend: Build Docker image (`backend/Dockerfile`). Deploy to Render / AWS ECS. Set env vars `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `EMERGENT_LLM_KEY`, `CORS_ORIGINS`.
- Frontend: `yarn build`, deploy `build/` to Vercel; set `REACT_APP_BACKEND_URL` to your backend URL.
- CORS: `CORS_ORIGINS` accepts comma-separated origins.

## Testing
```bash
cd backend && python -m pytest tests/ -q
```
