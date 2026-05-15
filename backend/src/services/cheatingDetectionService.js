/**
 * cheatingDetectionService.js — Calls the Python ML microservice for cheating detection.
 * 
 * Sends webcam behavior features (gaze, face, head pose) to the
 * Python FastAPI service running at :5000. The ML model (Random Forest)
 * returns a cheating risk score (0-100) and flags.
 * 
 * Falls back gracefully if the Python service is unavailable.
 * Direct port of Java CheatingDetectionService.
 */

const axios = require('axios');

/**
 * Analyze behavior features using the Python ML service.
 */
async function analyzeBehavior(behaviorData) {
  const enabled = process.env.ML_SERVICE_ENABLED === 'true';

  if (!enabled) {
    console.log('ML cheating detection is disabled');
    return getDefaultResult();
  }

  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    const url = `${mlServiceUrl}/analyze`;

    const response = await axios.post(url, behaviorData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const data = response.data;

    const result = {
      riskScore: data.risk_score || 0,
      isCheating: data.is_cheating || false,
      confidence: data.confidence || 0,
      details: data.details || '',
      flags: Array.isArray(data.flags) ? data.flags : []
    };

    console.log(`ML cheating analysis: risk=${result.riskScore}%, flags=${result.flags}`);
    return result;

  } catch (error) {
    console.warn(`ML service unavailable, skipping cheating detection: ${error.message}`);
    return getDefaultResult();
  }
}

/**
 * Check if the ML service is healthy.
 */
async function isServiceHealthy() {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.get(`${mlServiceUrl}/health`, { timeout: 3000 });
    return response.data && JSON.stringify(response.data).includes('healthy');
  } catch (error) {
    return false;
  }
}

/**
 * Default result when ML service is unavailable.
 */
function getDefaultResult() {
  return {
    riskScore: 0.0,
    isCheating: false,
    confidence: 0.0,
    flags: [],
    details: 'ML service unavailable — cheating detection skipped.'
  };
}

module.exports = { analyzeBehavior, isServiceHealthy };
