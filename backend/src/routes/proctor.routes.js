/**
 * proctor.routes.js — Proctoring routes (all require JWT auth)
 * POST /api/proctor/event
 * GET  /api/proctor/:sessionId/score
 * Direct port of Java ProctoringController.
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const proctoringService = require('../services/proctoringService');

// All proctoring routes require authentication
router.use(authMiddleware);

/**
 * POST /api/proctor/event
 */
router.post('/event', [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('eventType').notEmpty().withMessage('Event type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const result = await proctoringService.logEvent(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/proctor/:sessionId/score
 */
router.get('/:sessionId/score', async (req, res) => {
  try {
    const result = await proctoringService.getIntegrityScore(req.params.sessionId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
