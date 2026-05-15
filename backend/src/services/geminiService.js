/**
 * geminiService.js — Calls Google Gemini AI API for answer analysis.
 * 
 * Uses Gemini to:
 * 1. Semantically score answers (understands meaning, not just keywords)
 * 2. Generate personalized feedback for each answer
 * 
 * Direct port of Java GeminiService.
 */

const axios = require('axios');

/**
 * Check if Gemini AI is enabled
 */
function isEnabled() {
  const apiKey = process.env.GEMINI_API_KEY;
  return (
    process.env.GEMINI_ENABLED === 'true' &&
    apiKey &&
    apiKey !== 'YOUR_API_KEY_HERE' &&
    apiKey.length > 0
  );
}

/**
 * Analyze a user's answer using Gemini AI.
 */
async function analyzeAnswer(questionText, idealAnswer, expectedKeywords, userAnswer, maxScore) {
  if (!isEnabled()) {
    console.warn('Gemini AI is disabled. Returning null for fallback to keyword strategy.');
    return null;
  }

  try {
    const prompt = buildPrompt(questionText, idealAnswer, expectedKeywords, userAnswer, maxScore);
    const response = await callGeminiAPI(prompt);
    return parseResponse(response, maxScore);
  } catch (error) {
    console.error(`Gemini AI analysis failed: ${error.message}`);
    return null; // Caller will fall back to keyword strategy
  }
}

/**
 * Build the structured prompt for Gemini
 */
function buildPrompt(questionText, idealAnswer, expectedKeywords, userAnswer, maxScore) {
  let prompt = '';
  prompt += 'You are an expert technical interview evaluator. ';
  prompt += 'Evaluate the candidate\'s answer using SEMANTIC UNDERSTANDING, not just keyword matching. ';
  prompt += 'If the candidate explains a concept correctly using different words, they should get credit.\n\n';

  prompt += `INTERVIEW QUESTION:\n"${questionText}"\n\n`;

  if (idealAnswer) {
    prompt += `IDEAL ANSWER:\n"${idealAnswer}"\n\n`;
  }

  if (expectedKeywords && expectedKeywords.length > 0) {
    prompt += `KEY CONCEPTS TO COVER:\n${expectedKeywords.join(', ')}\n\n`;
  }

  prompt += `CANDIDATE'S ANSWER:\n"${userAnswer}"\n\n`;

  prompt += 'SCORING RULES:\n';
  prompt += `- Maximum score is ${maxScore}\n`;
  prompt += '- Award points for correct concepts even if different words are used\n';
  prompt += '- Deduct points for incorrect information\n';
  prompt += '- Consider completeness, accuracy, and depth\n';
  prompt += '- An empty or irrelevant answer should score 0\n\n';

  prompt += 'RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code blocks, just raw JSON):\n';
  prompt += '{\n';
  prompt += `  "score": <number between 0 and ${maxScore}>,\n`;
  prompt += '  "matchedConcepts": ["concept1", "concept2"],\n';
  prompt += '  "missedConcepts": ["concept3", "concept4"],\n';
  prompt += '  "feedback": "<2-3 sentences of specific, helpful feedback explaining what was good, what was missed, and how to improve>"\n';
  prompt += '}\n';

  return prompt;
}

/**
 * Call the Gemini API and return the raw response
 */
async function callGeminiAPI(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = process.env.GEMINI_API_URL;
  const url = `${apiUrl}?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3, // Low temperature for consistent scoring
      maxOutputTokens: 500
    }
  };

  const response = await axios.post(url, requestBody, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
  });

  return response.data;
}

/**
 * Parse the Gemini API response and extract scoring data
 */
function parseResponse(responseData, maxScore) {
  const candidates = responseData.candidates;
  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('No candidates in Gemini response');
  }

  let textContent = candidates[0].content.parts[0].text;

  // Clean up — remove markdown code block markers if present
  textContent = textContent.trim();
  if (textContent.startsWith('```json')) {
    textContent = textContent.substring(7);
  } else if (textContent.startsWith('```')) {
    textContent = textContent.substring(3);
  }
  if (textContent.endsWith('```')) {
    textContent = textContent.substring(0, textContent.length - 3);
  }
  textContent = textContent.trim();

  // Parse the JSON
  const result = JSON.parse(textContent);

  let score = result.score || 0;
  score = Math.max(0, Math.min(score, maxScore)); // Clamp to valid range

  const matched = Array.isArray(result.matchedConcepts) ? result.matchedConcepts : [];
  const missed = Array.isArray(result.missedConcepts) ? result.missedConcepts : [];
  const feedback = result.feedback || 'No feedback available.';

  console.log(`Gemini AI scored answer: ${score}/${maxScore} | Matched: ${matched.length} | Missed: ${missed.length}`);

  return {
    score,
    keywordsMatched: matched,
    keywordsMissed: missed,
    aiFeedback: feedback
  };
}

module.exports = { isEnabled, analyzeAnswer };
