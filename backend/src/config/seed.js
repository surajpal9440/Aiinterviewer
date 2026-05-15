/**
 * seed.js — Loads questions from questions.json into MongoDB on startup.
 * Only loads if the questions collection is empty (same as Java DataLoader).
 */

const fs = require('fs');
const path = require('path');
const Question = require('../models/Question');

async function seedQuestions() {
  try {
    const count = await Question.countDocuments();

    if (count === 0) {
      console.log('📚 Loading question bank into MongoDB...');

      const dataPath = path.join(__dirname, '..', 'data', 'questions.json');

      if (!fs.existsSync(dataPath)) {
        console.log('⚠️ questions.json not found. Skipping data load.');
        return;
      }

      const rawData = fs.readFileSync(dataPath, 'utf-8');
      const questions = JSON.parse(rawData);

      await Question.insertMany(questions);
      console.log(`✅ Loaded ${questions.length} questions successfully!`);
    } else {
      console.log(`📚 Question bank already loaded (${count} questions).`);
    }
  } catch (error) {
    console.error('⚠️ Error seeding questions:', error.message);
  }
}

module.exports = seedQuestions;
