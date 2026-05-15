"""
app.py — FastAPI server for ML-powered cheating detection.

Loads the trained model (Random Forest / Gradient Boosting) and serves
predictions via REST API. The Node.js backend calls this service
for each answer submission.

Trained on: Mendeley "Students suspicious behaviors detection dataset"
DOI: 10.17632/39xs8th543.1 (5,500 real records, 11 features)

Endpoints:
  GET  /health   — Health check
  POST /analyze  — Analyze behavior features, return cheating risk score

Run: python app.py → http://localhost:5000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import joblib
import numpy as np
import os
import logging

# ──────────────────────────────────────
# Setup
# ──────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

app = FastAPI(
    title="Cheating Detection ML Service",
    description="ML model trained on Mendeley proctoring dataset (5500 records)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────
# Load Model on Startup
# ──────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
META_PATH = os.path.join(os.path.dirname(__file__), 'model_meta.pkl')

model = None
feature_names = None
model_name = None

@app.on_event("startup")
def load_model():
    global model, feature_names, model_name
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        meta = joblib.load(META_PATH)
        feature_names = meta['feature_names']
        model_name = meta.get('model_name', 'Unknown')
        logger.info(f"✅ ML Model loaded: {model_name}")
        logger.info(f"   Features ({len(feature_names)}): {feature_names}")
    else:
        logger.error(f"❌ Model not found: {MODEL_PATH}")
        logger.error("   Run 'python train_model.py' first!")


# ──────────────────────────────────────
# Request/Response Models
# ──────────────────────────────────────
class BehaviorData(BaseModel):
    """Per-frame behavior features from the frontend webcam.
    These match the 11 features the model was trained on."""
    face_present: int = 1
    no_of_face: int = 1
    face_conf: float = 0.0
    head_pitch: float = 0.0
    head_yaw: float = 0.0
    head_roll: float = 0.0
    gaze_on_script: int = 1
    head_pose_enc: int = 0
    gaze_dir_enc: int = 0
    pupil_dist_norm: float = 0.0
    face_area_ratio: float = 0.0

class AnalysisResponse(BaseModel):
    risk_score: float
    is_cheating: bool
    confidence: float
    flags: List[str]
    details: str


# ──────────────────────────────────────
# Endpoints
# ──────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": model_name,
        "dataset": "Mendeley DOI:10.17632/39xs8th543.1",
        "features": feature_names
    }


@app.post("/analyze", response_model=AnalysisResponse)
def analyze_behavior(data: BehaviorData):
    """Analyze candidate behavior and return cheating risk score."""
    if model is None:
        return AnalysisResponse(
            risk_score=0.0, is_cheating=False, confidence=0.0,
            flags=["MODEL_NOT_LOADED"],
            details="ML model not loaded. Run train_model.py first."
        )

    # Build feature array in the trained order
    features = np.array([[
        data.face_present,
        data.no_of_face,
        data.face_conf,
        data.head_pitch,
        data.head_yaw,
        data.head_roll,
        data.gaze_on_script,
        data.head_pose_enc,
        data.gaze_dir_enc,
        data.pupil_dist_norm,
        data.face_area_ratio,
    ]])

    # Predict
    probabilities = model.predict_proba(features)[0]
    honest_prob = probabilities[0]
    cheating_prob = probabilities[1]
    risk_score = round(cheating_prob * 100, 1)
    is_cheating = risk_score > 60
    confidence = round(max(honest_prob, cheating_prob) * 100, 1)

    # Generate flags
    flags = []
    if data.face_present == 0:
        flags.append("FACE_NOT_VISIBLE")
    if data.no_of_face > 1:
        flags.append("MULTIPLE_PEOPLE_DETECTED")
    if data.gaze_on_script == 0:
        flags.append("NOT_LOOKING_AT_SCREEN")
    if abs(data.head_yaw) > 0.03:
        flags.append("HEAD_TURNED_SIDEWAYS")
    if abs(data.head_pitch) > 0.03:
        flags.append("HEAD_TILTED_UP_OR_DOWN")
    if data.face_conf > 0 and data.face_conf < 70:
        flags.append("LOW_FACE_CONFIDENCE")

    # Risk description
    if risk_score < 20:
        details = "Behavior appears normal. No suspicious activity detected."
    elif risk_score < 40:
        details = "Minor anomalies detected but within acceptable range."
    elif risk_score < 60:
        details = "Moderate risk. Some suspicious patterns observed."
    elif risk_score < 80:
        details = "High risk. Significant behavioral anomalies detected."
    else:
        details = "Very high risk. Strong indicators of external assistance."

    logger.info(f"🔍 risk={risk_score}% | cheating={is_cheating} | flags={flags}")

    return AnalysisResponse(
        risk_score=risk_score,
        is_cheating=is_cheating,
        confidence=confidence,
        flags=flags,
        details=details
    )


# ──────────────────────────────────────
# Run Server
# ──────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("  🤖 Cheating Detection ML Service v2.0")
    print("  Dataset: Mendeley (5,500 real records)")
    print("  Starting on http://localhost:5000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=5000)
