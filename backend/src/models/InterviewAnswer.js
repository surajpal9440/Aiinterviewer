/**
 * InterviewAnswer Model — Mongoose schema for interview_answers collection
 * Mirrors the Java InterviewAnswer entity exactly.
 */

const mongoose = require('mongoose');

const interviewAnswerSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    default: ''
  },
  answerText: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    default: 10
  },
  keywordsMatched: {
    type: [String],
    default: []
  },
  keywordsMissed: {
    type: [String],
    default: []
  },
  timeTakenSeconds: {
    type: Number,
    default: 0
  },
  aiFeedback: {
    type: String,
    default: null
  },
  cheatingRiskScore: {
    type: Number,
    default: 0
  },
  cheatingFlags: {
    type: [String],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'interview_answers'
});

module.exports = mongoose.model('InterviewAnswer', interviewAnswerSchema);
