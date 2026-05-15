/**
 * hybridStrategy.js — Hybrid Analysis Strategy
 * Combines keyword matching (60%), answer length (20%), and relevance (20%).
 * Direct port of Java HybridAnalysisStrategy.
 */

function analyze(userAnswer, question) {
  const answerLower = (userAnswer || '').toLowerCase().trim();
  const expected = question.expectedKeywords || [];

  // --- Keyword matching (60%) ---
  const matched = expected.filter(keyword =>
    answerLower.includes(keyword.toLowerCase())
  );

  const missed = expected.filter(keyword =>
    !answerLower.includes(keyword.toLowerCase())
  );

  const keywordRatio = expected.length === 0 ? 0 : matched.length / expected.length;
  const keywordScore = keywordRatio * question.maxScore * 0.6;

  // --- Length score (20%) ---
  const wordCount = userAnswer.trim().split(/\s+/).length;
  const expectedMinWords = 20;
  const lengthRatio = Math.min(1.0, wordCount / expectedMinWords);
  const lengthScore = lengthRatio * question.maxScore * 0.2;

  // --- Relevance score (20%) ---
  let relevanceScore = 0;
  if (expected.length > 0) {
    const mainKeyword = expected[0]; // First keyword = main topic
    if (answerLower.includes(mainKeyword.toLowerCase())) {
      relevanceScore = question.maxScore * 0.2;
    }
  }

  let totalScore = Math.round(keywordScore + lengthScore + relevanceScore);
  totalScore = Math.min(totalScore, question.maxScore); // Cap at max

  return {
    score: totalScore,
    keywordsMatched: matched,
    keywordsMissed: missed
  };
}

module.exports = { analyze };
