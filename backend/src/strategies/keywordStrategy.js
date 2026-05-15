/**
 * keywordStrategy.js — Keyword-based Analysis Strategy
 * Scores answers based purely on how many expected keywords are present.
 * Direct port of Java KeywordAnalysisStrategy.
 */

function analyze(userAnswer, question) {
  const answerLower = (userAnswer || '').toLowerCase().trim();
  const expected = question.expectedKeywords || [];

  const matched = expected.filter(keyword =>
    answerLower.includes(keyword.toLowerCase())
  );

  const missed = expected.filter(keyword =>
    !answerLower.includes(keyword.toLowerCase())
  );

  const ratio = expected.length === 0 ? 0 : matched.length / expected.length;
  const score = Math.round(ratio * question.maxScore);

  return {
    score,
    keywordsMatched: matched,
    keywordsMissed: missed
  };
}

module.exports = { analyze };
