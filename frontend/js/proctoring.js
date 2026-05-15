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

// ── ML Behavior Data Collection (per-frame, matches Mendeley dataset) ──
let lastFrameData = null;       // Latest frame's ML features (sent with answer)
let mlQuestionStart = null;     // When the current question was shown
let mlAnswerStart = null;       // When the user started speaking/answering
// Legacy counters (still used for proctoring events)
let gazeOffsets = [];
let faceAbsentCount = 0;
let multiFaceCount = 0;
let totalDetectionTicks = 0;
let headPoseValues = [];
let gazeChangeDeltas = [];

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

            // ── ML: Build per-frame features (matches Mendeley dataset) ──
            const frameData = {
                face_present: detections.length > 0 ? 1 : 0,
                no_of_face: detections.length,
                face_conf: 0, head_pitch: 0, head_yaw: 0, head_roll: 0,
                gaze_on_script: 1, head_pose_enc: 0, gaze_dir_enc: 0,
                pupil_dist_norm: 0, face_area_ratio: 0
            };

            // --- CHECK 1: No face detected ---
            totalDetectionTicks++;
            if (detections.length === 0) {
                faceAbsentCount++;
                frameData.gaze_on_script = 0;
                frameData.head_pose_enc = 5; // None
                frameData.gaze_dir_enc = 7;  // None
                sendProctorEvent('NO_FACE', 'HIGH', 'No face detected in camera');
            }

            // --- CHECK 2: Multiple faces ---
            if (detections.length > 1) {
                multiFaceCount++;
                sendProctorEvent('MULTIPLE_FACES', 'HIGH', `${detections.length} faces detected`);
            }

            // --- CHECK 3: Extract features from primary face ---
            if (detections.length >= 1) {
                const det = detections[0];
                const box = det.detection.box;
                const landmarks = det.landmarks;
                const nose = landmarks.getNose();
                const jaw = landmarks.getJawOutline();
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                // Face confidence
                frameData.face_conf = Math.round(det.detection.score * 100 * 100) / 100;

                // Face area ratio (normalized to video dimensions)
                const videoW = video.videoWidth || 320;
                const videoH = video.videoHeight || 240;
                frameData.face_area_ratio = Math.round((box.width * box.height) / (videoW * videoH) * 10000) / 10000;

                if (nose.length > 0 && jaw.length > 0 && leftEye.length > 0 && rightEye.length > 0) {
                    const noseCenter = nose[3]; // Tip of nose
                    const jawLeft = jaw[0];
                    const jawRight = jaw[jaw.length - 1];
                    const faceWidth = jawRight.x - jawLeft.x;
                    const faceCenterX = (jawLeft.x + jawRight.x) / 2;
                    const faceCenterY = (jaw[0].y + jaw[8].y) / 2;
                    const faceHeight = Math.abs(jaw[8].y - jaw[0].y);

                    // Gaze offset
                    const offset = Math.abs(noseCenter.x - faceCenterX) / (faceWidth || 1);

                    // Legacy tracking
                    if (gazeOffsets.length > 0) {
                        gazeChangeDeltas.push(Math.abs(offset - gazeOffsets[gazeOffsets.length - 1]));
                    }
                    gazeOffsets.push(offset);

                    // ── head_yaw: horizontal nose offset from face center ──
                    frameData.head_yaw = Math.round((noseCenter.x - faceCenterX) / (faceWidth || 1) * 1000) / 1000;

                    // ── head_pitch: vertical nose offset from face center ──
                    frameData.head_pitch = Math.round((noseCenter.y - faceCenterY) / (faceHeight || 1) * 1000) / 1000;

                    // ── head_roll: angle between eyes ──
                    const leftEyeCenter = { x: leftEye.reduce((s,p) => s+p.x, 0)/leftEye.length, y: leftEye.reduce((s,p) => s+p.y, 0)/leftEye.length };
                    const rightEyeCenter = { x: rightEye.reduce((s,p) => s+p.x, 0)/rightEye.length, y: rightEye.reduce((s,p) => s+p.y, 0)/rightEye.length };
                    frameData.head_roll = Math.round(Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * 10000) / 10000;

                    // ── pupil_dist_norm: distance between eye centers / face width ──
                    const pupilDist = Math.sqrt(Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) + Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2));
                    frameData.pupil_dist_norm = Math.round(pupilDist / (faceWidth || 1) * 10000) / 10000;

                    // ── gaze_on_script: 1 if looking at screen (offset < 0.15) ──
                    frameData.gaze_on_script = offset < 0.15 ? 1 : 0;

                    // ── head_pose_enc: forward=0, left=1, right=2, up=3, down=4, none=5 ──
                    if (Math.abs(frameData.head_yaw) < 0.08 && Math.abs(frameData.head_pitch) < 0.08) {
                        frameData.head_pose_enc = 0; // forward
                    } else if (frameData.head_yaw < -0.08) {
                        frameData.head_pose_enc = 1; // left
                    } else if (frameData.head_yaw > 0.08) {
                        frameData.head_pose_enc = 2; // right
                    } else if (frameData.head_pitch < -0.08) {
                        frameData.head_pose_enc = 3; // up
                    } else {
                        frameData.head_pose_enc = 4; // down
                    }

                    // ── gaze_dir_enc: center=0,left=1,right=2,top_left=3,top_right=4,bottom_left=5,bottom_right=6,none=7 ──
                    if (offset < 0.10) {
                        frameData.gaze_dir_enc = 0; // center
                    } else if (frameData.head_yaw < 0 && frameData.head_pitch < 0) {
                        frameData.gaze_dir_enc = 3; // top_left
                    } else if (frameData.head_yaw > 0 && frameData.head_pitch < 0) {
                        frameData.gaze_dir_enc = 4; // top_right
                    } else if (frameData.head_yaw < 0 && frameData.head_pitch > 0) {
                        frameData.gaze_dir_enc = 5; // bottom_left
                    } else if (frameData.head_yaw > 0 && frameData.head_pitch > 0) {
                        frameData.gaze_dir_enc = 6; // bottom_right
                    } else if (frameData.head_yaw < 0) {
                        frameData.gaze_dir_enc = 1; // left
                    } else {
                        frameData.gaze_dir_enc = 2; // right
                    }

                    // Legacy head pose tracking
                    headPoseValues.push(noseCenter.x / (faceWidth || 1));

                    if (offset > 0.15) {
                        sendProctorEvent('LOOKING_AWAY', 'MEDIUM', 'User appears to be looking away');
                    }
                    const noseRatio = (noseCenter.y - jaw[0].y) / Math.abs(faceHeight || 1);
                    if (noseRatio > 0.8) {
                        sendProctorEvent('LOOKING_DOWN', 'LOW', 'User appears to be looking down');
                    }
                }
            }

            // Store latest frame for ML submission
            lastFrameData = frameData;

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
    lastFrameData = null;
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
 * ML: Get the behavior profile for the current question.
 * Returns the 11 per-frame features matching the Mendeley dataset
 * that the trained ML model expects.
 */
function getBehaviorProfile() {
    // Return the latest frame's features (matches Mendeley dataset columns)
    if (lastFrameData) {
        return lastFrameData;
    }
    // Default: no data collected yet
    return {
        face_present: 1, no_of_face: 1, face_conf: 85,
        head_pitch: 0, head_yaw: 0, head_roll: 0,
        gaze_on_script: 1, head_pose_enc: 0, gaze_dir_enc: 0,
        pupil_dist_norm: 0.4, face_area_ratio: 0.07
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
