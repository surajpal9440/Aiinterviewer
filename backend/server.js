/**
 * server.js — Entry point for AI Interview Simulator Backend
 * 
 * Express.js server with MongoDB (Mongoose), JWT auth, Gemini AI integration,
 * and proctoring system. Serves the frontend as static files.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./src/config/db');
const seedQuestions = require('./src/config/seed');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const interviewRoutes = require('./src/routes/interview.routes');
const proctorRoutes = require('./src/routes/proctor.routes');
const reportRoutes = require('./src/routes/report.routes');

const app = express();
const PORT = process.env.PORT || 8080;

// ========================
// Middleware
// ========================
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/report', reportRoutes);

// ========================
// Serve Frontend Static Files
// ========================
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ========================
// Global Error Handler
// ========================
app.use(errorHandler);

// ========================
// Start Server
// ========================
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed question bank
    await seedQuestions();

    app.listen(PORT, () => {
      console.log(`\n🚀 AI Interview Simulator Backend`);
      console.log(`   Server running on: http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Gemini AI: ${process.env.GEMINI_ENABLED === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   ML Service: ${process.env.ML_SERVICE_ENABLED === 'true' ? '✅ Enabled' : '❌ Disabled'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
