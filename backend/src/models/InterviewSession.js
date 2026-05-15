/**
 * InterviewSession Model — Mongoose schema for interview_sessions collection
 * Mirrors the Java InterviewSession entity with adaptive difficulty helpers.
 */

const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  roleCategory: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'IN_PROGRESS'
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  currentDifficulty: {
    type: String,
    default: 'EASY'
  },
  consecutiveCorrect: {
    type: Number,
    default: 0
  },
  consecutiveWrong: {
    type: Number,
    default: 0
  },
  answeredQuestionIds: {
    type: [String],
    default: []
  },
  integrityScore: {
    type: Number,
    default: 100
  },
  warningCount: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 10
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  collection: 'interview_sessions'
});

// Adaptive difficulty helpers (same as Java)
interviewSessionSchema.methods.incrementConsecutiveCorrect = function () {
  this.consecutiveCorrect++;
  this.consecutiveWrong = 0;
};

interviewSessionSchema.methods.incrementConsecutiveWrong = function () {
  this.consecutiveWrong++;
  this.consecutiveCorrect = 0;
};

interviewSessionSchema.methods.upgradeDifficulty = function () {
  if (this.currentDifficulty === 'EASY') {
    this.currentDifficulty = 'MEDIUM';
  } else if (this.currentDifficulty === 'MEDIUM') {
    this.currentDifficulty = 'HARD';
  }
  this.consecutiveCorrect = 0;
};

interviewSessionSchema.methods.downgradeDifficulty = function () {
  if (this.currentDifficulty === 'HARD') {
    this.currentDifficulty = 'MEDIUM';
  } else if (this.currentDifficulty === 'MEDIUM') {
    this.currentDifficulty = 'EASY';
  }
  this.consecutiveWrong = 0;
};

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
