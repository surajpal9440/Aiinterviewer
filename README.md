# 🤖 AI Interview Simulator with Proctoring System

A full-stack AI-powered interview simulation platform built with **Node.js/Express (MERN Stack)** and **vanilla JavaScript**. The system simulates real interviews with adaptive questioning, voice interaction, real-time camera-based proctoring, ML-based cheating detection, and generates detailed performance reports.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Role-Based Questions** | 60+ questions across Java, Frontend, Backend, MERN, HR roles |
| **Adaptive Difficulty** | Questions get harder/easier based on performance |
| **Gemini AI Scoring** | Google Gemini AI evaluates answers with semantic understanding |
| **Voice Interaction** | Text-to-Speech reads questions; Speech-to-Text captures answers |
| **Camera Proctoring** | Face detection, multi-face detection, gaze tracking |
| **ML Cheating Detection** | Python ML service (Random Forest) analyzes webcam behavior |
| **Tab Switch Detection** | Detects when user leaves the interview page |
| **Integrity Scoring** | Real-time integrity score with deductions for violations |
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

## 📁 Tech Stack

- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB 7.0
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **AI Scoring:** Google Gemini AI API (semantic answer evaluation)
- **ML Service:** Python, FastAPI, scikit-learn (cheating detection)
- **Face Detection:** face-api.js (TensorFlow.js)
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
    ├── app.py                  # FastAPI server
    ├── train_model.py          # Model training script
    └── requirements.txt
```

---

## ⚡ Quick Start

### Prerequisites

1. **Node.js 18+** — [Download](https://nodejs.org/)
2. **MongoDB 7.0+** — [Download](https://www.mongodb.com/try/download/community) or use Docker
3. **Python 3.9+** (optional, for ML cheating detection)

### Run with Docker (Easiest)

```bash
cd backend
docker-compose up --build
```

Open http://localhost:8080

### Run Locally

```bash
# 1. Start MongoDB
mongod

# 2. Install dependencies & start backend
cd backend
npm install
npm run dev

# 3. (Optional) Start ML service
cd ml-service
pip install -r requirements.txt
python app.py
```

Open http://localhost:8080

---

## 🎯 How to Use

1. **Register/Login** at http://localhost:8080
2. **Select a role** (Java Developer, Frontend, Backend, MERN, HR)
3. **Allow camera & microphone** when prompted
4. **Answer 10 questions** using voice or text
5. **View your report** with scores and PDF export

---

## 📊 Design Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| **MVC** | Entire project | Separates data, logic, and presentation |
| **Factory** | Question selection | Encapsulates question filtering & randomization |
| **Strategy** | Analysis strategies | Swappable answer scoring (Gemini AI → Hybrid → Keyword) |
| **Middleware** | Express middleware | JWT auth, error handling, request parsing |

---

## 📝 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/interview/start` | JWT | Start interview |
| GET | `/api/interview/:id/next` | JWT | Get next question |
| POST | `/api/interview/:id/submit` | JWT | Submit answer |
| POST | `/api/interview/:id/end` | JWT | End interview |
| POST | `/api/proctor/event` | JWT | Log proctor event |
| GET | `/api/proctor/:id/score` | JWT | Get integrity score |
| GET | `/api/report/:sessionId` | JWT | Get report |
| GET | `/api/report/my-reports` | JWT | Get all user reports |

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory (see `.env.example`):

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

**Suraj Kumar** — Final Year Project, 2026

---

## 📄 License

This project is for educational purposes.
