# 🤖 AI Interview Simulator with ML-Powered Proctoring

A full-stack AI-powered interview simulation platform with **real-time cheating detection** using a Random Forest ML model trained on a **5,500-record research dataset** (Mendeley DOI: 10.17632/39xs8th543.1). Built with **Node.js/Express**, **Python FastAPI**, and **vanilla JavaScript**.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Role-Based Questions** | 60+ questions across Java, Frontend, Backend, MERN, HR roles |
| **Adaptive Difficulty** | Questions get harder/easier based on performance |
| **Gemini AI Scoring** | Google Gemini AI evaluates answers with semantic understanding |
| **Voice Interaction** | Text-to-Speech reads questions; Speech-to-Text captures answers |
| **Camera Proctoring** | Real-time face detection, gaze tracking, head pose estimation via face-api.js |
| **ML Cheating Detection** | Random Forest model (92% accuracy, 0.97 AUC) trained on real proctoring dataset |
| **Tab Switch Detection** | Auto-terminates interview if user leaves the page |
| **Integrity Scoring** | Per-question risk assessment with behavioral flags |
| **Detailed Reports** | Technical, Communication, Confidence, Integrity scores |
| **PDF Export** | Download interview report as PDF |
| **JWT Authentication** | Secure login/registration with BCrypt password hashing |

---

## 🏗️ Architecture

```
Browser (HTML/CSS/JS)          Node.js/Express             MongoDB
┌──────────────────┐     ┌─────────────────────┐     ┌──────────┐
│ face-api.js      │────▶│ Routes (REST API)   │────▶│ Users    │
│ Web Speech API   │     │ Services (Logic)    │     │ Questions│
│ Fetch API        │◀────│ Mongoose (ODM)      │◀────│ Sessions │
│ jsPDF            │     │ JWT + BCrypt        │     │ Answers  │
└──────────────────┘     └────────┬────────────┘     │ Events   │
                                  │                   │ Reports  │
                         ┌────────▼────────────┐     └──────────┘
                         │ Python ML Service   │
                         │ (FastAPI + sklearn)  │
                         │ Cheating Detection   │
                         └─────────────────────┘
                         ┌─────────────────────┐
                         │ Google Gemini AI API │
                         │ Semantic Scoring     │
                         └─────────────────────┘
```

### Request Flow

```
1. User logs in → JWT token issued
2. Selects role → Backend picks first question (EASY difficulty)
3. Every 2.5s → face-api.js extracts 11 behavioral features from webcam
4. User answers via voice → Speech-to-Text converts to text
5. On submit → Backend sends answer to Gemini AI for scoring
6. Simultaneously → Backend sends 11 webcam features to Python ML service
7. Random Forest (100 trees) votes → returns cheating risk score
8. Backend adjusts difficulty based on score (7+/10 → harder)
9. After 10 questions → Final report generated with all scores
```

---

## 🧠 ML Pipeline — Cheating Detection

### Dataset

- **Source:** [Mendeley Data](https://data.mendeley.com/datasets/39xs8th543/1) (Elsevier)
- **DOI:** 10.17632/39xs8th543.1
- **Records:** 5,500 webcam frames (2,881 honest + 2,619 cheating)
- **Collection:** Real student recordings processed via MediaPipe + OpenCV
- **Labels:** Manual annotation by researchers (binary: honest/cheating)

### Feature Selection (38 → 11)

Only features that the browser's face-api.js can compute in real-time were selected:

| Feature | Description | Why It Detects Cheating |
|---------|-------------|------------------------|
| `face_present` | Is face visible? (0/1) | Cheaters hide/move away |
| `no_of_face` | Number of faces detected | Someone helping = 2+ faces |
| `face_conf` | Detection confidence (0-100) | Side face = low confidence |
| `head_pitch` | Head up/down angle | Looking down at phone |
| `head_yaw` | Head left/right angle | Looking at second screen |
| `head_roll` | Head tilt angle | Unusual posture |
| `gaze_on_script` | Looking at screen? (0/1) | Core cheating indicator |
| `head_pose_enc` | Head direction (encoded) | Categorical direction |
| `gaze_dir_enc` | Gaze direction (encoded) | Direction of looking |
| `pupil_dist_norm` | Pupil distance (normalized) | Face orientation |
| `face_area_ratio` | Face size in frame | Distance from camera |

**Dropped features:** Hand tracking (5), phone detection (4), raw pixel coordinates (12) — hand gestures indicate confidence in interviews (not cheating), and phone/hand detection requires MediaPipe/YOLO which are too heavy for browser.

### Training Pipeline

```
Load Mendeley CSV (5,500 × 38)
        │
Feature Engineering (38 → 11 webcam-capturable features)
        │
EDA: Class distribution, correlation heatmap, feature distributions
        │
Stratified Split: 70% Train (3,850) / 15% Validation (825) / 15% Test (825)
        │
5-Fold Cross-Validation on Training Set
        │
Compare 3 Models: Random Forest vs Gradient Boosting vs Logistic Regression
        │
Model Selection on Validation Set → Random Forest (AUC = 0.9785)
        │
Final Evaluation on Test Set (never seen during training or selection)
```

### Results

| Metric | Random Forest 🥇 | Gradient Boosting | Logistic Regression |
|--------|-------------------|-------------------|---------------------|
| **Cross-Val AUC** | 0.9772 ± 0.005 | 0.9773 ± 0.006 | 0.9529 ± 0.010 |
| **Validation AUC** | **0.9785** | 0.9752 | 0.9575 |
| **Test Accuracy** | **91.9%** | — | — |
| **Test AUC** | **0.9692** | — | — |
| **Precision** | **95.8%** | — | — |
| **Recall** | **86.8%** | — | — |
| **F1 Score** | **0.9105** | — | — |

### Evaluation Plots

The training script generates 5 plots in `ml-service/plots/`:
- `class_distribution.png` — Dataset balance visualization
- `correlation_matrix.png` — Feature correlation heatmap
- `feature_distributions.png` — Feature distributions by class
- `confusion_matrix.png` — Prediction accuracy breakdown
- `roc_curves.png` — ROC curves for all 3 models
- `feature_importance.png` — Random Forest feature importance
- `model_comparison.png` — Side-by-side model metrics

---

## 📁 Tech Stack

- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB 7.0
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **AI Scoring:** Google Gemini AI API (semantic answer evaluation)
- **ML Service:** Python 3.13, FastAPI, scikit-learn 1.6.1 (Random Forest)
- **ML Dataset:** Mendeley (5,500 real proctoring records, DOI: 10.17632/39xs8th543.1)
- **Face Detection:** face-api.js (TensorFlow.js, runs in-browser)
- **Voice:** Web Speech API (Chrome)
- **Auth:** JWT (jsonwebtoken) + BCrypt (bcryptjs)
- **PDF:** jsPDF
- **Container:** Docker (optional)

---

## 📁 Project Structure

```
Aiinterviewer/
├── backend/                    # Node.js/Express Backend
│   ├── server.js               # Entry point
│   ├── package.json
│   ├── .env                    # Environment variables
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── src/
│       ├── config/             # DB connection, data seeder
│       ├── middleware/         # JWT auth, error handler
│       ├── models/             # Mongoose schemas (6 models)
│       ├── routes/             # Express route handlers
│       ├── services/           # Business logic (7 services)
│       ├── strategies/         # Strategy pattern for scoring
│       └── data/               # questions.json (60+ questions)
├── frontend/                   # Vanilla HTML/CSS/JS Frontend
│   ├── index.html              # Login/Register page
│   ├── dashboard.html          # Role selection
│   ├── interview.html          # Interview session
│   ├── report.html             # Results & PDF export
│   ├── css/style.css
│   └── js/                     # API, auth, interview, proctoring, speech
└── ml-service/                 # Python ML Microservice
    ├── app.py                  # FastAPI server (serves trained model)
    ├── train_model.py          # Full training pipeline (EDA → CV → Eval)
    ├── generate_dataset.py     # Research-based dataset generator
    ├── model.pkl               # Trained Random Forest model
    ├── model_meta.pkl          # Feature metadata
    ├── requirements.txt        # Python dependencies
    └── plots/                  # Evaluation charts (6 PNG files)
```

---

## ⚡ Quick Start

### Prerequisites

1. **Node.js 18+** — [Download](https://nodejs.org/)
2. **MongoDB 7.0+** — [Download](https://www.mongodb.com/try/download/community)
3. **Python 3.9+** — For ML cheating detection service

### Setup

```bash
# 1. Start MongoDB
mongod

# 2. Install & start backend
cd backend
npm install
npm run dev

# 3. Train ML model & start ML service
cd ml-service
pip install -r requirements.txt
python train_model.py          # Trains on Mendeley dataset (generates model.pkl)
python app.py                  # Starts FastAPI on port 5000
```

Open http://localhost:8080

---

## 🎯 How to Use

1. **Register/Login** at http://localhost:8080
2. **Select a role** (Java Developer, Frontend, Backend, MERN, HR)
3. **Allow camera & microphone** when prompted
4. **Answer 10 questions** using voice — AI asks questions from OA topics
5. **Stay focused** — webcam monitors behavior in real-time
6. **View your report** with detailed scores and PDF export

---

## 📊 Design Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| **MVC** | Entire project | Separates data, logic, and presentation |
| **Factory** | Question selection | Encapsulates question filtering & randomization |
| **Strategy** | Analysis strategies | Swappable answer scoring (Gemini AI → Hybrid → Keyword) |
| **Middleware** | Express middleware | JWT auth, error handling, request parsing |
| **Microservice** | ML Service | Independent deployment, scaling, and retraining |

---

## 📝 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/interview/start` | JWT | Start interview |
| GET | `/api/interview/:id/next` | JWT | Get next question |
| POST | `/api/interview/:id/submit` | JWT | Submit answer + behavior data |
| POST | `/api/interview/:id/end` | JWT | End interview |
| POST | `/api/proctor/event` | JWT | Log proctor event |
| GET | `/api/proctor/:id/score` | JWT | Get integrity score |
| GET | `/api/report/:sessionId` | JWT | Get report |
| GET | `/api/report/my-reports` | JWT | Get all user reports |

### ML Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check + model info |
| POST | `/analyze` | Analyze 11 behavior features → risk score |

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ai_interview_db
JWT_SECRET=your_secret_key
JWT_EXPIRATION=86400000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
GEMINI_ENABLED=true
ML_SERVICE_URL=http://localhost:5000
ML_SERVICE_ENABLED=true
```

---

## 👨‍💻 Author

**Suraj Kumar** — 2026

---

## 📄 License

This project is for educational purposes.
