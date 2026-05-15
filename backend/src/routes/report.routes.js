/**
 * report.routes.js — Report routes (all require JWT auth)
 * GET /api/report/my-reports
 * GET /api/report/:sessionId
 * Direct port of Java ReportController.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const reportService = require('../services/reportService');

// All report routes require authentication
router.use(authMiddleware);

/**
 * GET /api/report/my-reports
 * Must be defined BEFORE /:sessionId to avoid "my-reports" being treated as a sessionId
 */
router.get('/my-reports', async (req, res) => {
  try {
    const userId = req.userId;
    const reports = await reportService.getUserReports(userId);
    res.json(reports);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/report/:sessionId
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const report = await reportService.getReport(req.params.sessionId);
    res.json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
