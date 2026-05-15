/**
 * analysisService.js — Uses Strategy pattern to score answers.
 * Direct port of Java AnalysisService.
 */

const geminiStrategy = require('../strategies/geminiStrategy');

/**
 * Score a user's answer against the expected answer.
 * Uses Gemini AI for semantic understanding when available,
 * falls back to keyword matching otherwise.
 */
async function scoreAnswer(userAnswer, question) {
  const result = await geminiStrategy.analyze(userAnswer, question);

  const score = result.score;
  const maxScore = question.maxScore;
  const percentage = (score / maxScore) * 100;

  // Use AI-generated feedback if available, otherwise use rule-based feedback
  const aiFeedback = result.aiFeedback;
  let feedback;

  if (aiFeedback) {
    // AI feedback is available — use it
    feedback = aiFeedback;
  } else {
    // Fallback: rule-based feedback
    if (percentage >= 80) {
      feedback = 'Excellent answer! You covered the key concepts well.';
    } else if (percentage >= 60) {
      feedback = 'Good answer, but you missed some important points.';
    } else if (percentage >= 40) {
      feedback = 'Average answer. Try to include more technical details.';
    } else if (percentage > 0) {
      feedback = 'Your answer needs improvement. Review the key concepts.';
    } else {
      feedback = "Your answer didn't match the expected response. Study this topic.";
    }
  }

  result.feedback = feedback;
  result.maxScore = maxScore;
  return result;
}

/**
 * Calculate communication score based on answer quality
 * Direct port of Java AnalysisService.calculateCommunicationScore
 */
function calculateCommunicationScore(answer) {
  if (!answer || answer.trim().length === 0) return 0;

  const wordCount = answer.trim().split(/\s+/).length;
  const sentenceCount = answer.split(/[.!?]+/).length;

  // Score based on word count
  let lengthScore;
  if (wordCount >= 50) lengthScore = 40;
  else if (wordCount >= 30) lengthScore = 30;
  else if (wordCount >= 15) lengthScore = 20;
  else lengthScore = 10;

  // Score based on sentence structure
  let structureScore;
  if (sentenceCount >= 3) structureScore = 30;
  else if (sentenceCount >= 2) structureScore = 20;
  else structureScore = 10;

  // Score based on vocabulary diversity
  const words = answer.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words).size;
  const diversityRatio = uniqueWords / words.length;

  let diversityScore;
  if (diversityRatio >= 0.7) diversityScore = 30;
  else if (diversityRatio >= 0.5) diversityScore = 20;
  else diversityScore = 10;

  return Math.min(100, lengthScore + structureScore + diversityScore);
}

/**
 * Calculate confidence score based on response time and answer completeness
 * Direct port of Java AnalysisService.calculateConfidenceScore
 */
function calculateConfidenceScore(timeTakenSeconds, timeLimitSeconds, answer) {
  if (!answer || answer.trim().length === 0) return 0;

  // Time factor — faster (but not too fast) = more confident
  const timeRatio = timeTakenSeconds / timeLimitSeconds;
  let timeScore;
  if (timeRatio <= 0.1) timeScore = 20;       // Too fast = possibly guessing
  else if (timeRatio <= 0.5) timeScore = 40;   // Quick and confident
  else if (timeRatio <= 0.75) timeScore = 35;  // Good pace
  else if (timeRatio <= 1.0) timeScore = 25;   // Used most of the time
  else timeScore = 15;                         // Over time

  // Completeness — longer answers = more confident
  const wordCount = answer.trim().split(/\s+/).length;
  let completenessScore;
  if (wordCount >= 40) completenessScore = 40;
  else if (wordCount >= 20) completenessScore = 30;
  else if (wordCount >= 10) completenessScore = 20;
  else completenessScore = 10;

  // Filler word penalty
  const lower = answer.toLowerCase();
  let fillerCount = 0;
  const fillers = ['um ', 'uh ', 'like ', 'you know', 'basically', 'actually'];
  for (const filler of fillers) {
    if (lower.includes(filler)) fillerCount++;
  }
  const fillerPenalty = fillerCount * 5;

  return Math.max(0, Math.min(100, timeScore + completenessScore + 20 - fillerPenalty));
}

module.exports = { scoreAnswer, calculateCommunicationScore, calculateConfidenceScore };
