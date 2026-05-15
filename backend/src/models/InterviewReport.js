/**
 * InterviewReport Model — Mongoose schema for interview_reports collection
 * Mirrors the Java InterviewReport entity exactly.
 */

const mongoose = require('mongoose');

const interviewReportSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  roleCategory: {
    type: String,
    default: ''
  },
  technicalScore: {
    type: Number,
    default: 0
  },
  communicationScore: {
    type: Number,
    default: 0
  },
  confidenceScore: {
    type: Number,
    default: 0
  },
  integrityScore: {
    type: Number,
    default: 100
  },
  overallScore: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  proctoringSummary: {
    type: Map,
    of: Number,
    default: {}
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'interview_reports'
});

module.exports = mongoose.model('InterviewReport', interviewReportSchema);
