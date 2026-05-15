/**
 * proctoring.js — Camera monitoring, face detection, tab switching
 * Uses face-api.js for client-side face detection
 */

let proctoringActive = false;
let proctoringInterval = null;
let videoStream = null;
const sessionId = localStorage.getItem('sessionId');

// Cooldowns to avoid spamming the server
const eventCooldowns = {};
const COOLDOWN_MS = 5000; // 5 seconds between same event type

// ── ML Behavior Data Collection (per question) ──
let gazeOffsets = [];           // Gaze offset values per detection tick
let faceAbsentCount = 0;       // How many ticks face was absent
let multiFaceCount = 0;        // How many ticks multiple faces detected
let totalDetectionTicks = 0;   // Total face detection ticks for this question
let headPoseValues = [];       // Head position variability data
let mlQuestionStart = null;    // When the current question was shown (ML tracker)
let mlAnswerStart = null;      // When the user started speaking/answering
let gazeChangeDeltas = [];     // Gaze position changes between ticks (eye speed)

/**
 * Initialize the proctoring system
 */
async function initProctoring() {
    try {
        // 1. Start camera
        await startCamera();

        // 2. Load face-api.js models
        await loadFaceModels();

        // 3. Start face detection loop
        startFaceDetection();

        // 4. Start tab switch detection
        startTabDetection();

        proctoringActive = true;
        updateCameraStatus('Camera active', false);

    } catch (err) {
        console.error('Proctoring init error:', err);
        updateCameraStatus('Camera error', true);
        showToast('Camera access required for proctoring. Please allow camera.', 'error');
    }
}

/**
 * Start the webcam
 */
async function startCamera() {
    const video = document.getElementById('videoFeed');

    videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
    });

    video.srcObject = videoStream;
    await video.play();
}

/**
 * Load face-api.js models from CDN
 */
async function loadFaceModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)
    ]);

    console.log('✅ Face detection models loaded');
}

/**
 * Start face detection every 2 seconds
 */
function startFaceDetection() {
    const video = document.getElementById('videoFeed');
    const canvas = document.getElementById('faceCanvas');

    proctoringInterval = setInterval(async () => {
        if (!proctoringActive) return;

        try {
            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
            ).withFaceLandmarks(true);

            // Draw detections on canvas
            const dims = faceapi.matchDimensions(canvas, video, true);
            const resized = faceapi.resizeResults(detections, dims);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resized);

            // --- CHECK 1: No face detected ---
            totalDetectionTicks++;  // ML: count every tick
            if (detections.length === 0) {
                faceAbsentCount++;  // ML: track absence
                sendProctorEvent('NO_FACE', 'HIGH', 'No face detected in camera');
            }

            // --- CHECK 2: Multiple faces ---
            if (detections.length > 1) {
                multiFaceCount++;  // ML: track multi-face
                sendProctorEvent('MULTIPLE_FACES', 'HIGH', `${detections.length} faces detected`);
            }

            // --- CHECK 3: Looking away (gaze detection using landmarks) ---
            if (detections.length === 1) {
                const landmarks = detections[0].landmarks;
                const nose = landmarks.getNose();
                const jaw = landmarks.getJawOutline();

                if (nose.length > 0 && jaw.length > 0) {
                    const noseCenter = nose[3]; // Tip of nose
                    const jawLeft = jaw[0];
                    const jawRight = jaw[jaw.length - 1];
                    const faceWidth = jawRight.x - jawLeft.x;
                    const faceCenterX = (jawLeft.x + jawRight.x) / 2;

                    // Calculate how far the nose is from center
                    const offset = Math.abs(noseCenter.x - faceCenterX) / faceWidth;

                    // ── ML: Collect gaze data ──
                    if (gazeOffsets.length > 0) {
                        gazeChangeDeltas.push(Math.abs(offset - gazeOffsets[gazeOffsets.length - 1]));
                    }
                    gazeOffsets.push(offset);

                    // ── ML: Collect head pose data ──
                    const jawTop = jaw[8];
                    const faceHeight = jawTop.y - jaw[0].y;
                    const headRatio = noseCenter.x / faceWidth;
                    headPoseValues.push(headRatio);

                    if (offset > 0.15) {
                        sendProctorEvent('LOOKING_AWAY', 'MEDIUM', 'User appears to be looking away');
                    }

                    // Check if looking down
                    const noseRatio = (noseCenter.y - jaw[0].y) / Math.abs(faceHeight);

                    if (noseRatio > 0.8) {
                        sendProctorEvent('LOOKING_DOWN', 'LOW', 'User appears to be looking down');
                    }
                }
            }

        } catch (err) {
            // Silently ignore face detection errors
        }
    }, 2500); // Check every 2.5 seconds
}

/**
 * Detect tab switching — AUTO-TERMINATE the interview
 */
function startTabDetection() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && proctoringActive) {
            terminateForCheating('You switched to another tab. Interview terminated.');
        }
    });
}

/**
 * Auto-terminate interview for cheating violation
 */
async function terminateForCheating(reason) {
    proctoringActive = false;
    stopProctoring();

    // Send termination event to backend
    try {
        await apiPost('/api/proctor/event', {
            sessionId: sessionId,
            eventType: 'TERMINATED_CHEATING',
            severity: 'CRITICAL',
            description: reason
        });
    } catch (e) { /* ignore */ }

    // Show termination UI
    document.querySelector('.interview-main').innerHTML = `
        <div class="card" style="text-align:center;padding:60px 40px;">
            <div style="font-size:4rem;margin-bottom:20px;">🚫</div>
            <h2 style="color:var(--accent-pink);margin-bottom:16px;">Interview Terminated</h2>
            <p style="color:var(--text-secondary);font-size:1.1rem;margin-bottom:24px;">${reason}</p>
            <p style="color:var(--text-muted);font-size:0.9rem;">This violation has been recorded in your report.</p>
            <a href="dashboard.html" class="btn btn-outline" style="margin-top:24px;">← Back to Dashboard</a>
        </div>
    `;
}

/**
 * ML: Reset behavior data for a new question
 */
function resetBehaviorData() {
    gazeOffsets = [];
    faceAbsentCount = 0;
    multiFaceCount = 0;
    totalDetectionTicks = 0;
    headPoseValues = [];
    gazeChangeDeltas = [];
    mlQuestionStart = Date.now();
    mlAnswerStart = null;
}

/**
 * ML: Mark when the user starts answering (speaking)
 */
function markAnswerStart() {
    if (!mlAnswerStart) {
        mlAnswerStart = Date.now();
    }
}

/**
 * ML: Get the behavior profile for the current question
 * Returns the 8 features the Python ML model needs
 */
function getBehaviorProfile() {
    const n = gazeOffsets.length;

    // Feature 1: Average gaze offset
    const gazeOffsetAvg = n > 0 ? gazeOffsets.reduce((a, b) => a + b, 0) / n : 0;

    // Feature 2: Gaze offset standard deviation
    const gazeOffsetStd = n > 1 ? Math.sqrt(
        gazeOffsets.reduce((sum, v) => sum + Math.pow(v - gazeOffsetAvg, 2), 0) / (n - 1)
    ) : 0;

    // Feature 3: Percentage of time looking away (offset > 0.12)
    const gazeAwayPct = n > 0 ? (gazeOffsets.filter(v => v > 0.12).length / n) * 100 : 0;

    // Feature 4: Face absence percentage
    const faceAbsentPct = totalDetectionTicks > 0 ? (faceAbsentCount / totalDetectionTicks) * 100 : 0;

    // Feature 5: Multi-face count
    const multiFace = multiFaceCount;

    // Feature 6: Head pose variance
    const headAvg = headPoseValues.length > 0 ? headPoseValues.reduce((a, b) => a + b, 0) / headPoseValues.length : 0;
    const headPoseVariance = headPoseValues.length > 1 ? Math.sqrt(
        headPoseValues.reduce((sum, v) => sum + Math.pow(v - headAvg, 2), 0) / (headPoseValues.length - 1)
    ) : 0;

    // Feature 7: Answer delay (seconds from question shown to answer started)
    const answerDelaySec = mlAnswerStart && mlQuestionStart
        ? (mlAnswerStart - mlQuestionStart) / 1000
        : 5; // default

    // Feature 8: Eye movement speed (average gaze change between ticks)
    const eyeMovementSpeed = gazeChangeDeltas.length > 0
        ? gazeChangeDeltas.reduce((a, b) => a + b, 0) / gazeChangeDeltas.length
        : 0;

    return {
        gaze_offset_avg: Math.round(gazeOffsetAvg * 10000) / 10000,
        gaze_offset_std: Math.round(gazeOffsetStd * 10000) / 10000,
        gaze_away_pct: Math.round(gazeAwayPct * 100) / 100,
        face_absent_pct: Math.round(faceAbsentPct * 100) / 100,
        multi_face_count: multiFace,
        head_pose_variance: Math.round(headPoseVariance * 10000) / 10000,
        answer_delay_sec: Math.round(answerDelaySec * 100) / 100,
        eye_movement_speed: Math.round(eyeMovementSpeed * 10000) / 10000
    };
}

/**
 * Send a proctoring event to the backend (with cooldown)
 */
async function sendProctorEvent(eventType, severity, description) {
    // Check cooldown
    const now = Date.now();
    if (eventCooldowns[eventType] && (now - eventCooldowns[eventType] < COOLDOWN_MS)) {
        return; // Skip — too recent
    }
    eventCooldowns[eventType] = now;

    try {
        const result = await apiPost('/api/proctor/event', {
            sessionId: sessionId,
            eventType: eventType,
            severity: severity,
            description: description
        });

        // Update UI
        updateIntegrityDisplay(result.integrityScore, result.warningCount);
        addWarningToLog(result.warning);
        showToast(result.warning, severity === 'HIGH' ? 'error' : 'warning');

    } catch (err) {
        console.error('Failed to send proctor event:', err);
    }
}

/**
 * Update integrity score display
 */
function updateIntegrityDisplay(score, warnings) {
    const scoreEl = document.getElementById('integrityScore');
    const barEl = document.getElementById('integrityBar');
    const warnEl = document.getElementById('warningCount');

    if (scoreEl) {
        scoreEl.textContent = score;
        scoreEl.className = 'integrity-score';
        if (score >= 70) scoreEl.classList.add('high');
        else if (score >= 40) scoreEl.classList.add('medium');
        else scoreEl.classList.add('low');
    }

    if (barEl) {
        barEl.style.width = score + '%';
        if (score < 40) barEl.style.background = 'var(--gradient-danger)';
        else if (score < 70) barEl.style.background = 'var(--gradient-warm)';
    }

    if (warnEl) warnEl.textContent = warnings;
}

/**
 * Add warning to the sidebar log
 */
function addWarningToLog(message) {
    const list = document.getElementById('warningsList');
    if (!list) return;

    // Clear the "no warnings" message
    if (list.querySelector('div:not(.warning-item)')) {
        list.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'warning-item';
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    item.textContent = `[${time}] ${message}`;
    list.prepend(item);
}

/**
 * Update camera status indicator
 */
function updateCameraStatus(text, isError) {
    const dot = document.getElementById('cameraStatusDot');
    const label = document.getElementById('cameraStatusText');

    if (label) label.textContent = text;
    if (dot) {
        if (isError) dot.classList.add('error');
        else dot.classList.remove('error');
    }
}

/**
 * Stop proctoring
 */
function stopProctoring() {
    proctoringActive = false;

    if (proctoringInterval) {
        clearInterval(proctoringInterval);
        proctoringInterval = null;
    }

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    stopSpeaking();
    stopListening();
}
