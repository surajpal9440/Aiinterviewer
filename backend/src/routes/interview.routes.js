/**
 * interview.routes.js — Interview routes (all require JWT auth)
 * POST /api/interview/start
 * GET  /api/interview/:sessionId/next
 * POST /api/interview/:sessionId/submit
 * POST /api/interview/:sessionId/end
 * Direct port of Java InterviewController.
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const interviewService = require('../services/interviewService');

// All interview routes require authentication
router.use(authMiddleware);

/**
 * POST /api/interview/start
 */
router.post('/start', [
  body('roleCategory').notEmpty().withMessage('Role category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.userId;
    const { roleCategory } = req.body;

    console.log(`Starting interview for user: ${userId}, role: ${roleCategory}`);
    const result = await interviewService.startInterview(userId, roleCategory);
    res.json(result);
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/interview/:sessionId/next
 */
router.get('/:sessionId/next', async (req, res) => {
  try {
    const result = await interviewService.getNextQuestion(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error(`Error getting next question for session ${req.params.sessionId}:`, error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/interview/:sessionId/submit
 */
router.post('/:sessionId/submit', [
  body('questionId').notEmpty().withMessage('Question ID is required'),
  body('answerText').notEmpty().withMessage('Answer text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.userId;
    const response = await interviewService.submitAnswer(
      req.params.sessionId,
      userId,
      req.body
    );
    res.json(response);
  } catch (error) {
    console.error(`Error submitting answer for session ${req.params.sessionId}:`, error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/interview/:sessionId/end
 */
router.post('/:sessionId/end', async (req, res) => {
  try {
    await interviewService.endInterview(req.params.sessionId);
    res.json({ message: 'Interview ended successfully' });
  } catch (error) {
    console.error(`Error ending interview for session ${req.params.sessionId}:`, error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
