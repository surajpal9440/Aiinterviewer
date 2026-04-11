/**
 * interview.js — Main interview flow controller
 * Manages question display, answer submission, timer, and navigation
 */

// --- State ---
let currentQuestion = null;
let timerInterval = null;
let timeRemaining = 120;
let questionStartTime = 0;

// --- Auth check ---
if (!localStorage.getItem('token') || !localStorage.getItem('sessionId')) {
    window.location.href = 'dashboard.html';
}

const SESSION_ID = localStorage.getItem('sessionId');
const ROLE = localStorage.getItem('currentRole') || 'Interview';
const TOTAL_Q = parseInt(localStorage.getItem('totalQuestions')) || 10;

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    // Set role in navbar
    const roleNames = {
        'JAVA_DEVELOPER': '☕ Java Developer Interview',
        'FRONTEND_DEVELOPER': '🎨 Frontend Developer Interview',
        'BACKEND_DEVELOPER': '⚙️ Backend Developer Interview',
        'MERN_STACK_DEVELOPER': '🚀 MERN Stack Interview',
        'HR': '💼 HR / Behavioral Interview'
    };
    document.getElementById('interviewRole').textContent = roleNames[ROLE] || 'Interview';
    document.getElementById('totalQuestions').textContent = TOTAL_Q;

    // Load first question from localStorage (set by dashboard)
    const savedQuestion = localStorage.getItem('currentQuestion');
    if (savedQuestion) {
        currentQuestion = JSON.parse(savedQuestion);
        displayQuestion(currentQuestion);
        localStorage.removeItem('currentQuestion');
    } else {
        loadNextQuestion();
    }

    // Initialize proctoring
    initProctoring();
});

/**
 * Display a question on the page
 */
function displayQuestion(q) {
    currentQuestion = q;
    questionStartTime = Date.now();

    // Update UI
    document.getElementById('questionNum').textContent = q.questionNumber;
    document.getElementById('questionLabel').textContent = `QUESTION ${q.questionNumber}`;
    document.getElementById('questionText').textContent = q.questionText;

    // Difficulty badge
    const badge = document.getElementById('difficultyBadge');
    badge.textContent = q.difficulty;
    badge.className = `difficulty-badge difficulty-${q.difficulty}`;

    // Progress bar
    const progress = (q.questionNumber / TOTAL_Q) * 100;
    document.getElementById('progressBar').style.width = progress + '%';

    // Clear answer
    document.getElementById('answerInput').value = '';

    // Hide feedback, show answer area
    document.getElementById('feedbackCard').classList.add('hidden');
    document.getElementById('answerArea').classList.remove('hidden');
    document.getElementById('submitBtn').disabled = false;

    // Start timer
    startTimer(q.timeLimitSeconds || 120);

    // Auto-speak the question
    setTimeout(() => speakText(q.questionText), 500);
}

/**
 * Start the countdown timer
 */
function startTimer(seconds) {
    if (timerInterval) clearInterval(timerInterval);

    timeRemaining = seconds;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            showToast('⏰ Time\'s up! Auto-submitting your answer...', 'warning');
            submitAnswer();
        }
    }, 1000);
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timerEl = document.getElementById('timerValue');
    const timerContainer = document.getElementById('timerDisplay');

    timerEl.textContent = display;

    // Color based on time remaining
    timerContainer.className = 'timer-display';
    if (timeRemaining <= 10) timerContainer.classList.add('danger');
    else if (timeRemaining <= 30) timerContainer.classList.add('warning');
}

/**
 * Submit the current answer
 */
async function submitAnswer() {
    if (!currentQuestion) return;

    // Stop timer and mic
    if (timerInterval) clearInterval(timerInterval);
    stopListening();
    stopSpeaking();

    const answerText = document.getElementById('answerInput').value.trim();

    if (!answerText) {
        showToast('Please provide an answer before submitting.', 'warning');
        startTimer(timeRemaining); // Resume timer
        return;
    }

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;"></div> Analyzing...';

    try {
        const result = await apiPost(`/api/interview/${SESSION_ID}/submit`, {
            questionId: currentQuestion.id,
            answerText: answerText,
            timeTakenSeconds: timeTaken
        });

        // Show feedback
        showFeedback(result);

    } catch (err) {
        showToast('Error submitting answer: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Answer →';
    }
}

/**
 * Show answer feedback
 */
function showFeedback(result) {
    // Hide answer area, show feedback
    document.getElementById('answerArea').classList.add('hidden');
    const feedbackCard = document.getElementById('feedbackCard');
    feedbackCard.classList.remove('hidden');

    // Score
    document.getElementById('feedbackScore').textContent = `${result.score}/${result.maxScore}`;
    document.getElementById('feedbackText').textContent = result.feedback;

    // Color based on score
    const scoreEl = document.getElementById('feedbackScore');
    const pct = (result.score / result.maxScore) * 100;
    if (pct >= 70) scoreEl.style.color = 'var(--accent-cyan)';
    else if (pct >= 40) scoreEl.style.color = 'var(--accent-yellow)';
    else scoreEl.style.color = 'var(--accent-pink)';

    // Keywords
    const keywordsSection = document.getElementById('keywordsSection');
    keywordsSection.innerHTML = '';

    if (result.keywordsMatched && result.keywordsMatched.length > 0) {
        const matchedDiv = document.createElement('div');
        matchedDiv.innerHTML = '<strong style="font-size:0.8rem;color:var(--text-secondary);margin-right:8px;">✅ Matched:</strong>';
        result.keywordsMatched.forEach(k => {
            matchedDiv.innerHTML += `<span class="keyword-tag matched">${k}</span> `;
        });
        keywordsSection.appendChild(matchedDiv);
    }

    if (result.keywordsMissed && result.keywordsMissed.length > 0) {
        const missedDiv = document.createElement('div');
        missedDiv.innerHTML = '<strong style="font-size:0.8rem;color:var(--text-secondary);margin-right:8px;">❌ Missed:</strong>';
        result.keywordsMissed.forEach(k => {
            missedDiv.innerHTML += `<span class="keyword-tag missed">${k}</span> `;
        });
        keywordsSection.appendChild(missedDiv);
    }

    // Next button
    const nextBtn = document.getElementById('nextBtn');
    if (result.interviewComplete) {
        nextBtn.textContent = '📊 View Report';
        nextBtn.onclick = () => {
            window.location.href = 'report.html';
        };
    } else {
        nextBtn.textContent = `Next Question (${result.nextDifficulty}) →`;
        nextBtn.onclick = loadNextQuestion;
    }
}

/**
 * Load the next question from server
 */
async function loadNextQuestion() {
    const feedbackCard = document.getElementById('feedbackCard');
    feedbackCard.classList.add('hidden');

    // Show loading
    document.getElementById('questionText').textContent = 'Loading next question...';

    try {
        const result = await apiGet(`/api/interview/${SESSION_ID}/next`);

        if (result.interviewComplete) {
            showToast('🎉 Interview complete! Generating report...', 'success');
            setTimeout(() => {
                window.location.href = 'report.html';
            }, 1500);
            return;
        }

        if (result.question) {
            displayQuestion(result.question);
        }

    } catch (err) {
        showToast('Error loading question: ' + err.message, 'error');
    }
}

/**
 * Clear the answer textarea
 */
function clearAnswer() {
    document.getElementById('answerInput').value = '';
}

/**
 * Speak the current question using TTS
 */
function speakQuestion() {
    if (currentQuestion) {
        speakText(currentQuestion.questionText);
    }
}

/**
 * End interview early
 */
async function endInterviewEarly() {
    if (!confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
        return;
    }

    try {
        await apiPost(`/api/interview/${SESSION_ID}/end`);
        stopProctoring();
        window.location.href = 'report.html';
    } catch (err) {
        showToast('Error ending interview: ' + err.message, 'error');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopProctoring();
    if (timerInterval) clearInterval(timerInterval);
});
