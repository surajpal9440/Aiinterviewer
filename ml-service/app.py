"""
app.py — FastAPI server for ML-powered cheating detection.

Loads the trained Random Forest model and serves predictions via REST API.
Spring Boot backend calls this service for each answer submission.

Endpoints:
  GET  /health   — Health check
  POST /analyze  — Analyze behavior features, return cheating risk score

Run: python app.py
     → Server starts on http://localhost:5000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
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
    description="Random Forest model for detecting cheating in video call interviews",
    version="1.0.0"
)

# Allow requests from Spring Boot
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

@app.on_event("startup")
def load_model():
    global model, feature_names
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        meta = joblib.load(META_PATH)
        feature_names = meta['feature_names']
        logger.info(f"✅ ML Model loaded from {MODEL_PATH}")
        logger.info(f"   Features: {feature_names}")
    else:
        logger.error(f"❌ Model file not found: {MODEL_PATH}")
        logger.error("   Run 'python generate_dataset.py' then 'python train_model.py' first!")


# ──────────────────────────────────────
# Request/Response Models
# ──────────────────────────────────────
class BehaviorData(BaseModel):
    """Behavior features collected from the frontend per question."""
    gaze_offset_avg: float = 0.0
    gaze_offset_std: float = 0.0
    gaze_away_pct: float = 0.0
    face_absent_pct: float = 0.0
    multi_face_count: int = 0
    head_pose_variance: float = 0.0
    answer_delay_sec: float = 0.0
    eye_movement_speed: float = 0.0

class AnalysisResponse(BaseModel):
    """Response with cheating risk analysis."""
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
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": "RandomForestClassifier",
        "features": feature_names
    }


@app.post("/analyze", response_model=AnalysisResponse)
def analyze_behavior(data: BehaviorData):
    """
    Analyze candidate behavior and return cheating risk score.
    
    The ML model (Random Forest) predicts the probability of cheating
    based on 8 webcam-derived behavioral features.
    """
    if model is None:
        return AnalysisResponse(
            risk_score=0.0,
            is_cheating=False,
            confidence=0.0,
            flags=["MODEL_NOT_LOADED"],
            details="ML model is not loaded. Run train_model.py first."
        )

    # Build feature array in correct order
    features = np.array([[
        data.gaze_offset_avg,
        data.gaze_offset_std,
        data.gaze_away_pct,
        data.face_absent_pct,
        data.multi_face_count,
        data.head_pose_variance,
        data.answer_delay_sec,
        data.eye_movement_speed
    ]])

    # Predict probability
    probabilities = model.predict_proba(features)[0]
    honest_prob = probabilities[0]
    cheating_prob = probabilities[1]
    risk_score = round(cheating_prob * 100, 1)

    # Determine if cheating (threshold: 60%)
    is_cheating = risk_score > 60

    # Confidence level
    confidence = round(max(honest_prob, cheating_prob) * 100, 1)

    # Generate flags based on individual features
    flags = []
    if data.gaze_away_pct > 35:
        flags.append("LOOKING_AWAY_FREQUENTLY")
    if data.face_absent_pct > 20:
        flags.append("FACE_NOT_VISIBLE")
    if data.multi_face_count > 2:
        flags.append("MULTIPLE_PEOPLE_DETECTED")
    if data.eye_movement_speed > 0.10:
        flags.append("READING_PATTERN_DETECTED")
    if data.gaze_offset_avg > 0.20 and data.gaze_offset_std < 0.03:
        flags.append("STARING_AT_FIXED_POINT")
    if data.answer_delay_sec > 15:
        flags.append("UNUSUALLY_LONG_DELAY")
    if data.head_pose_variance > 0.12:
        flags.append("EXCESSIVE_HEAD_MOVEMENT")

    # Generate details string
    if risk_score < 20:
        details = "Behavior appears normal. No suspicious activity detected."
    elif risk_score < 40:
        details = "Minor anomalies detected but within acceptable range."
    elif risk_score < 60:
        details = "Moderate risk. Some suspicious patterns observed — monitor closely."
    elif risk_score < 80:
        details = "High risk of cheating. Significant behavioral anomalies detected."
    else:
        details = "Very high risk. Strong indicators of external assistance or reference material usage."

    logger.info(f"🔍 Analysis: risk={risk_score}% | cheating={is_cheating} | flags={flags}")

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
    print("  🤖 Cheating Detection ML Service")
    print("  Starting on http://localhost:5000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=5000)
