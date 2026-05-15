/**
 * reportService.js — Generates interview reports with detailed analytics.
 * Direct port of Java ReportService.
 */

const InterviewSession = require('../models/InterviewSession');
const InterviewAnswer = require('../models/InterviewAnswer');
const InterviewReport = require('../models/InterviewReport');
const Question = require('../models/Question');
const proctoringService = require('./proctoringService');
const analysisService = require('./analysisService');

/**
 * Generate a complete interview report
 */
async function generateReport(sessionId) {
  // Check if report already exists
  const existing = await InterviewReport.findOne({ sessionId });
  if (existing) {
    return existing;
  }

  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  const answers = await InterviewAnswer.find({ sessionId });

  // --- Calculate Technical Score ---
  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const totalMaxScore = answers.reduce((sum, a) => sum + a.maxScore, 0);
  const technicalScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  // --- Calculate Communication Score ---
  let communicationScore = 0;
  if (answers.length > 0) {
    const commScores = answers.map(a => analysisService.calculateCommunicationScore(a.answerText));
    communicationScore = Math.round(commScores.reduce((sum, s) => sum + s, 0) / commScores.length);
  }

  // --- Calculate Confidence Score ---
  let confidenceScore = 0;
  if (answers.length > 0) {
    const confScores = [];
    for (const a of answers) {
      const q = await Question.findById(a.questionId);
      const timeLimit = q ? q.timeLimitSeconds : 120;
      confScores.push(
        analysisService.calculateConfidenceScore(a.timeTakenSeconds, timeLimit, a.answerText)
      );
    }
    confidenceScore = Math.round(confScores.reduce((sum, s) => sum + s, 0) / confScores.length);
  }

  // --- Get Integrity Score ---
  const integrityScore = session.integrityScore;

  // --- Calculate Overall Score ---
  const overallScore = Math.round(
    technicalScore * 0.4 +
    communicationScore * 0.2 +
    confidenceScore * 0.2 +
    integrityScore * 0.2
  );

  // --- Identify Strengths & Weaknesses ---
  const strengths = [];
  const weaknesses = [];

  for (const answer of answers) {
    const pct = answer.maxScore > 0 ? (answer.score / answer.maxScore) * 100 : 0;
    const topic = extractTopic(answer.questionText);
    if (pct >= 70) {
      if (!strengths.includes(topic)) strengths.push(topic);
    } else if (pct < 50) {
      if (!weaknesses.includes(topic)) weaknesses.push(topic);
    }
  }

  // --- Count correct answers ---
  const correctCount = answers.filter(a =>
    a.maxScore > 0 && (a.score / a.maxScore) >= 0.7
  ).length;

  // --- Get proctoring summary ---
  const proctoringSummary = await proctoringService.getProctoringSummary(sessionId);

  // --- Calculate duration ---
  let durationMinutes = 0;
  if (session.startedAt && session.endedAt) {
    durationMinutes = Math.round(
      (new Date(session.endedAt) - new Date(session.startedAt)) / 60000
    );
  }

  // --- Build and save report ---
  const report = new InterviewReport({
    sessionId,
    userId: session.userId,
    roleCategory: session.roleCategory,
    technicalScore,
    communicationScore,
    confidenceScore,
    integrityScore,
    overallScore,
    totalQuestions: answers.length,
    correctAnswers: correctCount,
    strengths: strengths.length > 0 ? strengths : ['Keep practicing!'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Great job overall!'],
    proctoringSummary,
    durationMinutes
  });

  return await report.save();
}

/**
 * Get report by session ID
 */
async function getReport(sessionId) {
  const existing = await InterviewReport.findOne({ sessionId });
  if (existing) return existing;
  return await generateReport(sessionId);
}

/**
 * Get all reports for a user
 */
async function getUserReports(userId) {
  return await InterviewReport.find({ userId });
}

/**
 * Extract topic from question text
 * Direct port of Java ReportService.extractTopic
 */
function extractTopic(questionText) {
  if (!questionText) return 'General';

  const lower = questionText.toLowerCase();

  if (['oop', 'object oriented', 'polymorphism', 'inheritance', 'encapsulation', 'abstraction']
    .some(k => lower.includes(k))) return 'OOP Concepts';

  if (['collection', 'list', 'map', 'set', 'arraylist', 'hashmap']
    .some(k => lower.includes(k))) return 'Collections Framework';

  if (['thread', 'synchron', 'concurrent']
    .some(k => lower.includes(k))) return 'Multithreading';

  if (['exception', 'try', 'catch', 'throw']
    .some(k => lower.includes(k))) return 'Exception Handling';

  if (['spring', 'boot', 'bean', 'autowired']
    .some(k => lower.includes(k))) return 'Spring Framework';

  if (['database', 'sql', 'query', 'mongodb']
    .some(k => lower.includes(k))) return 'Database';

  if (['rest', 'api', 'http', 'endpoint']
    .some(k => lower.includes(k))) return 'REST APIs';

  if (['design pattern', 'singleton', 'factory', 'strategy']
    .some(k => lower.includes(k))) return 'Design Patterns';

  if (['html', 'css', 'javascript', 'dom']
    .some(k => lower.includes(k))) return 'Web Development';

  if (['react', 'angular', 'vue', 'frontend']
    .some(k => lower.includes(k))) return 'Frontend Development';

  if (['node', 'express', 'backend']
    .some(k => lower.includes(k))) return 'Backend Development';

  if (['teamwork', 'leadership', 'conflict', 'strength', 'weakness', 'tell me about']
    .some(k => lower.includes(k))) return 'Behavioral / HR';

  return 'General Knowledge';
}

module.exports = { generateReport, getReport, getUserReports };
