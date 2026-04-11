# 🤖 AI Interview Simulator with Proctoring System

A full-stack AI-powered interview simulation platform built with **Java Spring Boot** and **vanilla JavaScript**. The system simulates real interviews with adaptive questioning, voice interaction, real-time camera-based proctoring, and generates detailed performance reports.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Role-Based Questions** | 60+ questions across Java, Frontend, Backend, MERN, HR roles |
| **Adaptive Difficulty** | Questions get harder/easier based on performance |
| **Voice Interaction** | Text-to-Speech reads questions; Speech-to-Text captures answers |
| **Camera Proctoring** | Face detection, multi-face detection, gaze tracking |
| **Tab Switch Detection** | Detects when user leaves the interview page |
| **Integrity Scoring** | Real-time integrity score with deductions for violations |
| **Detailed Reports** | Technical, Communication, Confidence, Integrity scores |
| **PDF Export** | Download interview report as PDF |
| **JWT Authentication** | Secure login/registration with BCrypt password hashing |

---

## 🏗️ Architecture

```
Browser (HTML/CSS/JS)          Spring Boot (Java)          MongoDB
┌──────────────────┐     ┌─────────────────────┐     ┌──────────┐
│ face-api.js      │────▶│ Controllers (REST)  │────▶│ Users    │
│ Web Speech API   │     │ Services (Logic)    │     │ Questions│
│ Fetch API        │◀────│ Repositories (Data) │◀────│ Sessions │
│ jsPDF            │     │ JWT + BCrypt        │     │ Answers  │
└──────────────────┘     └─────────────────────┘     │ Events   │
                                                      │ Reports  │
                                                      └──────────┘
```

## 📁 Tech Stack

- **Backend:** Java 17, Spring Boot 3.2, Spring Security
- **Database:** MongoDB 7.0
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Face Detection:** face-api.js (TensorFlow.js)
- **Voice:** Web Speech API (Chrome)
- **Auth:** JWT + BCrypt
- **PDF:** jsPDF
- **Build:** Maven
- **Container:** Docker 

---

## ⚡ Quick Start

### Prerequisites

1. **Java 17+** — [Download](https://adoptium.net/)
2. **MongoDB 7.0+** — [Download](https://www.mongodb.com/try/download/community) or use Docker
3. **Maven 3.9+** — (included with most IDEs)

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

# 2. Build and run
cd backend
mvn spring-boot:run
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
| **Factory** | QuestionFactory | Encapsulates question selection logic |
| **Strategy** | AnalysisStrategy | Swappable answer scoring algorithms |
| **Singleton** | Spring Beans | One instance of each service |
| **Builder** | ReportBuilder | Constructs complex report objects |

---

## 🧪 Running Tests

```bash
cd backend
mvn test
```

---

## 📝 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/interview/start` | JWT | Start interview |
| GET | `/api/interview/{id}/next` | JWT | Get next question |
| POST | `/api/interview/{id}/submit` | JWT | Submit answer |
| POST | `/api/interview/{id}/end` | JWT | End interview |
| POST | `/api/proctor/event` | JWT | Log proctor event |
| GET | `/api/report/{sessionId}` | JWT | Get report |


---

## 📄 License

This project is for educational purposes.
