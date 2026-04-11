/**
 * speech.js — Text-to-Speech and Speech-to-Text
 * Uses the Web Speech API (built into Chrome)
 */

let recognition = null;
let isRecording = false;

/**
 * Text-to-Speech — Read question aloud
 */
function speakText(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;       // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to use a good English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v =>
            v.lang.startsWith('en') && v.name.includes('Google')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Text-to-Speech not supported in this browser');
    }
}

/**
 * Stop speaking
 */
function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Speech-to-Text — Start microphone recording
 * Appends transcribed text to the answer textarea
 */
function startListening(targetTextareaId = 'answerInput') {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Speech recognition not supported. Please use Chrome.', 'error');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;          // Keep listening
    recognition.interimResults = true;      // Show partial results
    recognition.lang = 'en-US';

    const textarea = document.getElementById(targetTextareaId);
    let finalTranscript = textarea.value;

    recognition.onstart = () => {
        isRecording = true;
        updateRecordingUI(true);
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        textarea.value = finalTranscript + interimTranscript;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
            showToast('Microphone error: ' + event.error, 'error');
        }
        stopListening();
    };

    recognition.onend = () => {
        isRecording = false;
        updateRecordingUI(false);
        // Save the final transcript
        if (textarea) {
            textarea.value = finalTranscript;
        }
    };

    try {
        recognition.start();
    } catch (e) {
        console.error('Failed to start speech recognition:', e);
    }
}

/**
 * Stop listening
 */
function stopListening() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    isRecording = false;
    updateRecordingUI(false);
}

/**
 * Toggle microphone on/off
 */
function toggleMic() {
    if (isRecording) {
        stopListening();
    } else {
        startListening('answerInput');
    }
}

/**
 * Update UI for recording state
 */
function updateRecordingUI(recording) {
    const micBtn = document.getElementById('micBtn');
    const status = document.getElementById('recordingStatus');

    if (micBtn) {
        if (recording) {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '⏹️';
        } else {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '🎤';
        }
    }

    if (status) {
        if (recording) {
            status.classList.remove('hidden');
        } else {
            status.classList.add('hidden');
        }
    }
}

// Load voices when available (needed for some browsers)
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
