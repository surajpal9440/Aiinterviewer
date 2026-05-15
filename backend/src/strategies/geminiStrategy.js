/**
 * geminiStrategy.js — Gemini AI Analysis Strategy
 * Uses Google Gemini to semantically evaluate answers.
 * Falls back to hybridStrategy if the API is unavailable.
 * Direct port of Java GeminiAnalysisStrategy.
 */

const geminiService = require('../services/geminiService');
const hybridStrategy = require('./hybridStrategy');

async function analyze(userAnswer, question) {
  try {
    // Try Gemini AI first
    const result = await geminiService.analyzeAnswer(
      question.questionText,
      question.idealAnswer,
      question.expectedKeywords,
      userAnswer,
      question.maxScore
    );

    if (result) {
      console.log(`✅ Gemini AI analysis successful for question: ${question.questionText.substring(0, 50)}`);
      return result;
    }
  } catch (error) {
    console.warn(`⚠️ Gemini AI failed, falling back to keyword strategy: ${error.message}`);
  }

  // Fallback to keyword-based analysis
  console.log('Using fallback (hybrid keyword) strategy');
  const fallbackResult = hybridStrategy.analyze(userAnswer, question);
  fallbackResult.aiFeedback = null; // No AI feedback in fallback mode
  return fallbackResult;
}

module.exports = { analyze };
