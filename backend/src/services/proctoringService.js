/**
 * proctoringService.js — Proctoring event logging and integrity scoring.
 * Direct port of Java ProctoringService.
 */

const ProctorEvent = require('../models/ProctorEvent');
const InterviewSession = require('../models/InterviewSession');

// Deduction values for each event type (same as Java)
const DEDUCTIONS = {
  TAB_SWITCH: 10,
  NO_FACE: 5,
  MULTIPLE_FACES: 15,
  LOOKING_AWAY: 3,
  LOOKING_DOWN: 2,
  BACKGROUND_NOISE: 2
};

/**
 * Log a proctoring event and update integrity score
 */
async function logEvent(data) {
  // Save the event
  const event = new ProctorEvent({
    sessionId: data.sessionId,
    eventType: data.eventType,
    severity: data.severity || 'MEDIUM',
    description: data.description || getDefaultDescription(data.eventType)
  });

  await event.save();

  // Update session integrity score
  const session = await InterviewSession.findById(data.sessionId);
  if (!session) throw new Error('Session not found');

  const deduction = DEDUCTIONS[data.eventType] || 2;
  const newScore = Math.max(0, session.integrityScore - deduction);
  session.integrityScore = newScore;
  session.warningCount = session.warningCount + 1;
  await session.save();

  // Build response
  return {
    integrityScore: newScore,
    warningCount: session.warningCount,
    warning: getWarningMessage(data.eventType),
    deduction
  };
}

/**
 * Get integrity score for a session
 */
async function getIntegrityScore(sessionId) {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  return {
    integrityScore: session.integrityScore,
    warningCount: session.warningCount
  };
}

/**
 * Calculate integrity score from events (used for reports)
 */
function calculateIntegrity(tabSwitches, noFace, multipleFaces, lookingAway) {
  const deduction = (tabSwitches * 10) + (noFace * 5) + (multipleFaces * 15) + (lookingAway * 3);
  return Math.max(0, 100 - deduction);
}

/**
 * Get proctoring summary for report
 */
async function getProctoringSummary(sessionId) {
  const tabSwitches = await ProctorEvent.countDocuments({ sessionId, eventType: 'TAB_SWITCH' });
  const noFaceCount = await ProctorEvent.countDocuments({ sessionId, eventType: 'NO_FACE' });
  const multipleFaces = await ProctorEvent.countDocuments({ sessionId, eventType: 'MULTIPLE_FACES' });
  const lookingAway = await ProctorEvent.countDocuments({ sessionId, eventType: 'LOOKING_AWAY' });
  const lookingDown = await ProctorEvent.countDocuments({ sessionId, eventType: 'LOOKING_DOWN' });

  const allEvents = await ProctorEvent.find({ sessionId });
  const totalWarnings = allEvents.length;

  return {
    tabSwitches,
    noFaceCount,
    multipleFaces,
    lookingAway,
    lookingDown,
    totalWarnings
  };
}

function getDefaultDescription(eventType) {
  const descriptions = {
    TAB_SWITCH: 'User switched to another tab or window',
    NO_FACE: 'No face detected in camera view',
    MULTIPLE_FACES: 'Multiple faces detected in camera view',
    LOOKING_AWAY: 'User is looking away from screen',
    LOOKING_DOWN: 'User is looking down frequently',
    BACKGROUND_NOISE: 'Background noise or multiple voices detected'
  };
  return descriptions[eventType] || 'Suspicious activity detected';
}

function getWarningMessage(eventType) {
  const warnings = {
    TAB_SWITCH: '⚠️ WARNING: Tab switching detected! Stay on the interview page.',
    NO_FACE: '⚠️ WARNING: Face not detected! Please face the camera.',
    MULTIPLE_FACES: '🚨 ALERT: Multiple faces detected! Only you should be visible.',
    LOOKING_AWAY: '⚠️ WARNING: Please look at the screen.',
    LOOKING_DOWN: '⚠️ NOTICE: Frequent looking down detected.',
    BACKGROUND_NOISE: '⚠️ NOTICE: Background noise detected. Move to a quieter place.'
  };
  return warnings[eventType] || '⚠️ Suspicious activity detected.';
}

module.exports = { logEvent, getIntegrityScore, calculateIntegrity, getProctoringSummary };
