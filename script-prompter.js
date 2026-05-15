const channel = new BroadcastChannel('teleprompter_sync');

const videoPreview = document.getElementById('videoPreview');
const prompterText = document.getElementById('prompterText');
const countdownEl = document.getElementById('countdown');
const recordingTimerEl = document.getElementById('recordingTimer');
const stage = document.getElementById('prompterStage');
const prompterZone = document.getElementById('prompterZone');
const cameraPip = document.getElementById('cameraPip');
const cameraPipHandle = document.querySelector('.camera-pip-handle');

let mediaStream = null;
let viewMode = 'camera';
let pipPosition = null;
let mediaRecorder = null;
let recordedChunks = [];
let isScrolling = false;
let scrollPosition = 0;
let animationFrameId = null;
let currentPixelSpeed = 0;
let targetWpm = 120;
let rawText = '';
let recordingStartTime = null;
let timerInterval = null;

const tr = (key, vars) => window.i18n ? window.i18n.t(key, vars) : key;
const getPlaceholder = () => tr('prompterWindow.waiting');

function canUseCamera() {
    return !!(window.isSecureContext && navigator.mediaDevices?.getUserMedia);
}

async function requestCamera() {
    if (!canUseCamera()) {
        prompterText.textContent = tr('prompterWindow.cameraFailedLocal');
        return false;
    }

    try {
        if (mediaStream) {
            mediaStream.getTracks().forEach((t) => t.stop());
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: true,
        });

        videoPreview.srcObject = mediaStream;
        await videoPreview.play();
        channel.postMessage({ type: 'ready' });
        updateEstimate();
        return true;
    } catch (err) {
        console.error('Càmera:', err);
        prompterText.textContent = err?.name === 'NotAllowedError'
            ? tr('prompterWindow.cameraFailedPerms')
            : tr('prompterWindow.cameraFailedGeneric');
        return false;
    }
}

function initCamera() {
    requestCamera();
}

function updateEstimate() {
    const words = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
    const durationSec = targetWpm > 0 ? (words / targetWpm) * 60 : 0;
    const height = prompterText.offsetHeight;
    const pixelsPerSecond = durationSec > 0 ? (height + 400) / durationSec : 0;
    currentPixelSpeed = pixelsPerSecond / 60;
}

function scroll() {
    if (!isScrolling) return;

    scrollPosition += currentPixelSpeed;
    prompterText.style.transform = `translateY(-${scrollPosition}px)`;

    if (scrollPosition > prompterText.offsetHeight + 200) {
        stopScrolling();
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                finishRecording();
            }
        }, 3000);
    } else {
        animationFrameId = requestAnimationFrame(scroll);
    }
}

function startScrolling(forceRestart = false) {
    if (isScrolling && !forceRestart) return;
    if (forceRestart) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        scrollPosition = 0;
        prompterText.style.transform = 'translateY(0)';
    }
    isScrolling = true;
    scroll();
}

function stopScrolling() {
    isScrolling = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function startTimer(isResume = false) {
    if (!isResume) recordingStartTime = Date.now();
    else {
        const elapsed = parseTimer(recordingTimerEl.textContent.replace(/^REC\s*/i, ''));
        recordingStartTime = Date.now() - elapsed * 1000;
    }

    recordingTimerEl.classList.add('active');
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        recordingTimerEl.textContent = `REC ${formatTime(elapsed)}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    recordingTimerEl.classList.remove('active');
    recordingTimerEl.textContent = '00:00';
}

function parseTimer(text) {
    const parts = text.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

async function runCountdown() {
    stage?.classList.add('is-countdown');
    countdownEl.classList.add('active');

    for (let i = 3; i > 0; i--) {
        countdownEl.textContent = i;
        countdownEl.classList.remove('go');
        await new Promise((r) => setTimeout(r, 1000));
    }

    countdownEl.textContent = tr('countdown.go');
    countdownEl.classList.add('go');
    await new Promise((r) => setTimeout(r, 600));

    countdownEl.classList.remove('active', 'go');
    countdownEl.textContent = '';
    stage?.classList.remove('is-countdown');
}

function getRecorderOptions() {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    for (const mimeType of types) {
        if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType };
    }
    return {};
}

async function startRecording() {
    if (!mediaStream) return;

    try {
        await runCountdown();

        scrollPosition = 0;
        prompterText.style.transform = 'translateY(0)';
        recordedChunks = [];

        mediaRecorder = new MediaRecorder(mediaStream, getRecorderOptions());
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
            channel.postMessage({ type: 'videoReady' });
            stopTimer();
        };

        stage?.classList.add('is-recording');
        mediaRecorder.start(250);
        startTimer();
        startScrolling(true);
        channel.postMessage({ type: 'recordingStarted' });
    } catch (err) {
        console.error('Gravació:', err);
        channel.postMessage({ type: 'recordingFailed' });
    }
}

function togglePause() {
    if (!mediaRecorder) return;

    if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        stopScrolling();
        clearInterval(timerInterval);
        channel.postMessage({ type: 'recordingPaused' });
    } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        startScrolling(false);
        startTimer(true);
        channel.postMessage({ type: 'recordingResumed' });
    }
}

function finishRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    stopScrolling();
    stopTimer();
    stage?.classList.remove('is-recording');
    channel.postMessage({ type: 'recordingFinished' });
}

function downloadVideo() {
    if (!recordedChunks.length) return;
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teleprompter-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
}

function setViewMode(mode) {
    viewMode = mode;
    stage.classList.remove('view-camera', 'view-prompter');
    stage.classList.add(mode === 'prompter' ? 'view-prompter' : 'view-camera');

    if (mode === 'prompter') {
        if (pipPosition) applyPipPosition(pipPosition);
    } else {
        cameraPip.style.left = '';
        cameraPip.style.top = '';
        cameraPip.style.right = '';
        cameraPip.style.bottom = '';
        cameraPip.style.width = '';
        cameraPip.style.height = '';
    }
}

function applyPipPosition(pos) {
    if (!pos || viewMode !== 'prompter') return;
    const zoneRect = prompterZone.getBoundingClientRect();
    const pipW = cameraPip.offsetWidth || 220;
    const pipH = cameraPip.offsetHeight || 168;
    const left = Math.max(0, Math.min(pos.left, zoneRect.width - pipW));
    const top = Math.max(0, Math.min(pos.top, zoneRect.height - pipH));
    cameraPip.style.left = `${left}px`;
    cameraPip.style.top = `${top}px`;
    cameraPip.style.right = 'auto';
    cameraPip.style.bottom = 'auto';
}

function initPipDrag() {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    cameraPipHandle.addEventListener('pointerdown', (e) => {
        if (viewMode !== 'prompter') return;
        e.preventDefault();
        dragging = true;
        cameraPip.classList.add('is-dragging');
        cameraPipHandle.setPointerCapture(e.pointerId);

        const pipRect = cameraPip.getBoundingClientRect();
        const zoneRect = prompterZone.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = pipRect.left - zoneRect.left;
        startTop = pipRect.top - zoneRect.top;

        cameraPip.style.left = `${startLeft}px`;
        cameraPip.style.top = `${startTop}px`;
        cameraPip.style.right = 'auto';
        cameraPip.style.bottom = 'auto';
    });

    cameraPipHandle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const zoneRect = prompterZone.getBoundingClientRect();
        const pipW = cameraPip.offsetWidth;
        const pipH = cameraPip.offsetHeight;
        let left = startLeft + (e.clientX - startX);
        let top = startTop + (e.clientY - startY);
        left = Math.max(0, Math.min(left, zoneRect.width - pipW));
        top = Math.max(0, Math.min(top, zoneRect.height - pipH));
        cameraPip.style.left = `${left}px`;
        cameraPip.style.top = `${top}px`;
    });

    const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        cameraPip.classList.remove('is-dragging');
        if (cameraPipHandle.hasPointerCapture(e.pointerId)) {
            cameraPipHandle.releasePointerCapture(e.pointerId);
        }
    };

    cameraPipHandle.addEventListener('pointerup', endDrag);
    cameraPipHandle.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', () => {
        applyPipPosition(pipPosition);
    });
}

channel.onmessage = (event) => {
    const { type, text, wpm, fontSize, viewMode: vm, pipPosition: pp } = event.data;

    if (type === 'sync') {
        if (text !== undefined) {
            rawText = text;
            prompterText.innerHTML = text.trim()
                ? text.replace(/\n/g, '<br><br>')
                : getPlaceholder();
        }
        if (event.data.locale && window.i18n && event.data.locale !== window.i18n.getLocale()) {
            window.i18n.setLocale(event.data.locale, false);
        }
        if (wpm !== undefined) targetWpm = parseInt(wpm, 10);
        if (fontSize !== undefined) prompterText.style.fontSize = `${fontSize}px`;
        if (vm === 'prompter' || vm === 'camera') {
            pipPosition = pp || pipPosition;
            setViewMode(vm);
        }
        setTimeout(updateEstimate, 100);
    }

    if (type === 'startRecording') startRecording();
    if (type === 'togglePause') togglePause();
    if (type === 'finishRecording') finishRecording();
    if (type === 'downloadRequest') downloadVideo();
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && mediaRecorder && mediaRecorder.state !== 'inactive') {
        e.preventDefault();
        togglePause();
    }
    if (e.code === 'Escape' && mediaRecorder && mediaRecorder.state !== 'inactive') {
        e.preventDefault();
        finishRecording();
    }
});

async function bootstrap() {
    if (window.i18n?.ready) {
        try { await window.i18n.ready; } catch { /* ignore */ }
        window.i18n.onChange(() => {
            window.i18n.applyTranslations();
            if (!rawText.trim()) prompterText.textContent = getPlaceholder();
        });
    }
    initPipDrag();
    if (canUseCamera()) requestCamera();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
