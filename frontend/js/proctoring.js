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
            if (detections.length === 0) {
                sendProctorEvent('NO_FACE', 'HIGH', 'No face detected in camera');
            }

            // --- CHECK 2: Multiple faces ---
            if (detections.length > 1) {
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

                    if (offset > 0.15) {
                        sendProctorEvent('LOOKING_AWAY', 'MEDIUM', 'User appears to be looking away');
                    }

                    // Check if looking down (nose tip lower than expected)
                    const jawTop = jaw[8]; // chin
                    const faceHeight = jawTop.y - jaw[0].y;
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
 * Detect tab switching using Page Visibility API
 */
function startTabDetection() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && proctoringActive) {
            sendProctorEvent('TAB_SWITCH', 'HIGH', 'User switched to another tab or window');
        }
    });

    // Also detect window blur (alt+tab, clicking outside)
    window.addEventListener('blur', () => {
        if (proctoringActive) {
            sendProctorEvent('TAB_SWITCH', 'HIGH', 'User left the interview window');
        }
    });
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
