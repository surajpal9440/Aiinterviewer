/**
 * ProctorEvent Model — Mongoose schema for proctor_events collection
 * Mirrors the Java ProctorEvent entity exactly.
 */

const mongoose = require('mongoose');

const proctorEventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    default: 'MEDIUM'
  },
  description: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'proctor_events'
});

module.exports = mongoose.model('ProctorEvent', proctorEventSchema);
