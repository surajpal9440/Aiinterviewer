/**
 * interviewService.js — Core interview logic.
 * Handles starting interviews, getting questions, submitting answers,
 * adaptive difficulty, and ending interviews.
 * Direct port of Java InterviewService + QuestionFactory.
 */

const InterviewSession = require('../models/InterviewSession');
const InterviewAnswer = require('../models/InterviewAnswer');
const Question = require('../models/Question');
const analysisService = require('./analysisService');
const cheatingDetectionService = require('./cheatingDetectionService');

// ========================
// Question Factory Logic
// (Ported from Java QuestionFactory)
// ========================

/**
 * Get the next question for a given role + difficulty,
 * excluding already-answered questions.
 */
async function getNextQuestionFromFactory(roleCategory, difficulty, excludeIds) {
  // Find questions matching role and difficulty
  let questions = await Question.find({ roleCategory, difficulty });

  // Filter out already-answered questions
  let available = questions.filter(q => !excludeIds.includes(q._id.toString()));

  if (available.length === 0) {
    // If no questions at this difficulty, try any difficulty
    questions = await Question.find({ roleCategory });
    available = questions.filter(q => !excludeIds.includes(q._id.toString()));
  }

  if (available.length === 0) {
    return null; // No more questions available
  }

  // Shuffle and pick one
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Build a question map for the response
 */
function buildQuestionMap(question, number, difficulty) {
  return {
    id: question._id.toString(),
    questionText: question.questionText,
    questionNumber: number,
    difficulty,
    timeLimitSeconds: question.timeLimitSeconds,
    maxScore: question.maxScore
  };
}

// ========================
// Interview Service Methods
// ========================

/**
 * Start a new interview session
 */
async function startInterview(userId, roleCategory) {
  // Create new session
  const session = new InterviewSession({
    userId,
    roleCategory,
    status: 'IN_PROGRESS',
    currentDifficulty: 'EASY',
    integrityScore: 100
  });

  const saved = await session.save();

  // Get first question
  const firstQuestion = await getNextQuestionFromFactory(
    roleCategory, 'EASY', saved.answeredQuestionIds
  );

  const result = {
    sessionId: saved._id.toString(),
    totalQuestions: saved.totalQuestions
  };

  if (firstQuestion) {
    result.question = buildQuestionMap(firstQuestion, 1, 'EASY');
  }

  return result;
}

/**
 * Get next question for a session
 */
async function getNextQuestion(sessionId) {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  if (session.status === 'COMPLETED' || session.status === 'TERMINATED') {
    return {
      interviewComplete: true,
      message: 'Interview is already completed'
    };
  }

  const questionNumber = session.currentQuestionIndex + 1;

  if (questionNumber > session.totalQuestions) {
    // All questions answered
    session.status = 'COMPLETED';
    session.endedAt = new Date();
    await session.save();

    return {
      interviewComplete: true,
      message: 'All questions have been answered'
    };
  }

  const next = await getNextQuestionFromFactory(
    session.roleCategory,
    session.currentDifficulty,
    session.answeredQuestionIds
  );

  const result = {};
  if (next) {
    result.question = buildQuestionMap(next, questionNumber, session.currentDifficulty);
    result.interviewComplete = false;
  } else {
    session.status = 'COMPLETED';
    session.endedAt = new Date();
    await session.save();
    result.interviewComplete = true;
    result.message = 'No more questions available';
  }
  result.integrityScore = session.integrityScore;
  return result;
}

/**
 * Submit an answer and get the score
 */
async function submitAnswer(sessionId, userId, requestData) {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  const question = await Question.findById(requestData.questionId);
  if (!question) throw new Error('Question not found');

  // Score the answer using AnalysisService (Gemini AI or keyword fallback)
  const analysisResult = await analysisService.scoreAnswer(requestData.answerText, question);

  const score = analysisResult.score;
  const matched = analysisResult.keywordsMatched || [];
  const missed = analysisResult.keywordsMissed || [];
  const feedback = analysisResult.feedback;
  const aiFeedback = analysisResult.aiFeedback || null;

  // Save the answer
  const answer = new InterviewAnswer({
    sessionId,
    userId,
    questionId: question._id.toString(),
    questionText: question.questionText,
    answerText: requestData.answerText,
    score,
    maxScore: question.maxScore,
    keywordsMatched: matched,
    keywordsMissed: missed,
    timeTakenSeconds: requestData.timeTakenSeconds || 0,
    aiFeedback
  });

  // ML Cheating Detection — send behavior data to Python service
  let cheatingRiskScore = 0.0;
  let cheatingFlags = [];
  if (requestData.behaviorData && Object.keys(requestData.behaviorData).length > 0) {
    const cheatingResult = await cheatingDetectionService.analyzeBehavior(requestData.behaviorData);
    cheatingRiskScore = cheatingResult.riskScore || 0.0;
    cheatingFlags = cheatingResult.flags || [];
  }
  answer.cheatingRiskScore = cheatingRiskScore;
  answer.cheatingFlags = cheatingFlags;

  await answer.save();

  // Update session — adaptive difficulty
  session.answeredQuestionIds.push(question._id.toString());
  session.currentQuestionIndex = session.currentQuestionIndex + 1;

  const percentage = (score / question.maxScore) * 100;
  if (percentage >= 70) {
    session.incrementConsecutiveCorrect();
  } else {
    session.incrementConsecutiveWrong();
  }

  if (session.consecutiveCorrect >= 2) {
    session.upgradeDifficulty();
  }
  if (session.consecutiveWrong >= 2) {
    session.downgradeDifficulty();
  }

  const isComplete = session.currentQuestionIndex >= session.totalQuestions;
  if (isComplete) {
    session.status = 'COMPLETED';
    session.endedAt = new Date();
  }

  await session.save();

  // Build response
  return {
    score,
    maxScore: question.maxScore,
    keywordsMatched: matched,
    keywordsMissed: missed,
    feedback,
    aiFeedback,
    cheatingRiskScore,
    cheatingFlags,
    nextDifficulty: session.currentDifficulty,
    interviewComplete: isComplete
  };
}

/**
 * End an interview session early
 */
async function endInterview(sessionId) {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  session.status = 'TERMINATED';
  session.endedAt = new Date();
  await session.save();
}

/**
 * Get session info
 */
async function getSession(sessionId) {
  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new Error('Session not found');
  return session;
}

module.exports = { startInterview, getNextQuestion, submitAnswer, endInterview, getSession };
