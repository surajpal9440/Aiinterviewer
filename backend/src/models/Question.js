/**
 * Question Model — Mongoose schema for questions collection
 * Mirrors the Java Question entity exactly.
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  roleCategory: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  expectedKeywords: {
    type: [String],
    default: []
  },
  idealAnswer: {
    type: String,
    default: ''
  },
  maxScore: {
    type: Number,
    default: 10
  },
  timeLimitSeconds: {
    type: Number,
    default: 120
  }
}, {
  collection: 'questions'
});

module.exports = mongoose.model('Question', questionSchema);
