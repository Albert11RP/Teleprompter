const channel = new BroadcastChannel('teleprompter_sync');

// ── DOM ──
const els = {
    scriptInput: document.getElementById('scriptInput'),
    wordCount: document.getElementById('wordCount'),
    wpmRange: document.getElementById('wpmRange'),
    wpmValue: document.getElementById('wpmValue'),
    wpmHint: document.getElementById('wpmHint'),
    fontSizeRange: document.getElementById('fontSizeRange'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    estimatedTime: document.getElementById('estimatedTime'),
    presets: document.querySelectorAll('.preset'),
    steps: document.querySelectorAll('.step'),
    viewModeBtns: document.querySelectorAll('.view-mode-btn'),
    dualScreenToggle: document.getElementById('dualScreenToggle'),
    prompterZone: document.getElementById('prompterZone'),
    cameraPip: document.getElementById('cameraPip'),
    cameraPipHandle: document.querySelector('.camera-pip-handle'),
    statusBar: document.getElementById('statusBar'),
    statusText: document.getElementById('statusText'),
    recordBtn: document.getElementById('recordBtn'),
    recordBtnLabel: document.getElementById('recordBtnLabel'),
    pauseBtn: document.getElementById('pauseBtn'),
    finishBtn: document.getElementById('finishBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    videoPreview: document.getElementById('videoPreview'),
    prompterText: document.getElementById('prompterText'),
    prompterContainer: document.getElementById('prompterContainer'),
    countdown: document.getElementById('countdown'),
    recordingTimer: document.getElementById('recordingTimer'),
    stage: document.querySelector('.stage'),
    app: document.querySelector('.app'),
    cameraBanner: document.getElementById('cameraBanner'),
    cameraBannerText: document.getElementById('cameraBannerText'),
    cameraPrompt: document.getElementById('cameraPrompt'),
    cameraPromptText: document.getElementById('cameraPromptText'),
    enableCameraBtn: document.getElementById('enableCameraBtn'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    languageSelect: document.getElementById('languageSelect'),
};

const t = (key, vars) => window.i18n ? window.i18n.t(key, vars) : key;

// ── State ──
const state = {
    phase: 'idle', // idle | ready | countdown | recording | paused | done
    mediaStream: null,
    mediaRecorder: null,
    recordedChunks: [],
    isScrolling: false,
    scrollPosition: 0,
    animationFrameId: null,
    currentPixelSpeed: 0,
    targetWpm: 120,
    rawText: '',
    recordingStartTime: null,
    timerInterval: null,
    prompterWindow: null,
    dualScreen: false,
    pendingRecord: false,
    cameraReady: false,
    cameraRequesting: false,
    viewMode: 'camera',
    pipPosition: null,
    lastCameraError: null,
    lastStatus: { phase: 'idle', key: 'status.writeScript' },
};

const getPlaceholder = () => t('script.promptPlaceholder');

// ── UI helpers ──
function setStatus(phase, text, key) {
    state.phase = phase;
    els.statusBar.className = `status-bar status-${phase}`;
    els.statusText.textContent = text;
    state.lastStatus = { phase, key: key || null };
}

function setStatusKey(phase, key, vars) {
    setStatus(phase, t(key, vars), key);
}

function updateSteps() {
    const hasScript = state.rawText.length > 0;
    const isRecording = ['countdown', 'recording', 'paused'].includes(state.phase);

    els.steps.forEach((step) => {
        const n = parseInt(step.dataset.step, 10);
        step.classList.remove('step-active', 'step-done');
        if (n === 1) {
            if (hasScript) step.classList.add('step-done');
            else step.classList.add('step-active');
        } else if (n === 2) {
            if (hasScript && !isRecording) step.classList.add('step-active');
            if (isRecording || state.phase === 'done') step.classList.add('step-done');
        } else if (n === 3) {
            if (isRecording) step.classList.add('step-active');
            if (state.phase === 'done') step.classList.add('step-done');
        }
    });
}

function formatTime(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function countWords(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function updateWpmHint(wpm) {
    if (wpm >= 130 && wpm <= 160) {
        els.wpmHint.textContent = t('speedHint.ideal');
        els.wpmHint.className = 'hint hint-success';
        els.wpmValue.style.color = 'var(--success)';
    } else if (wpm < 100) {
        els.wpmHint.textContent = t('speedHint.slow');
        els.wpmHint.className = 'hint hint-warning';
        els.wpmValue.style.color = 'var(--warning)';
    } else {
        els.wpmHint.textContent = t('speedHint.fast');
        els.wpmHint.className = 'hint';
        els.wpmValue.style.color = 'var(--accent)';
    }
}

function syncPresets(wpm) {
    els.presets.forEach((btn) => {
        btn.classList.toggle('preset-active', parseInt(btn.dataset.wpm, 10) === wpm);
    });
}

function setCameraBanner(type, text, key) {
    els.cameraBanner.classList.remove('hidden', 'error', 'ready', 'pending');
    state.lastBanner = type === 'hidden' ? null : { type, key };
    if (type === 'hidden') {
        els.cameraBanner.classList.add('hidden');
        return;
    }
    if (type) els.cameraBanner.classList.add(type);
    els.cameraBannerText.textContent = text;
}

function canUseCamera() {
    return !!(window.isSecureContext && navigator.mediaDevices?.getUserMedia);
}

function updateCameraUI() {
    if (!els.cameraPrompt) return;

    const { cameraReady, cameraRequesting, dualScreen } = state;
    const needsCamera = !dualScreen;

    if (!needsCamera) {
        els.cameraPrompt.classList.add('hidden');
        return;
    }

    if (cameraReady) {
        els.cameraPrompt.classList.add('hidden');
        return;
    }

    els.cameraPrompt.classList.remove('hidden');
    els.enableCameraBtn.disabled = cameraRequesting || !canUseCamera();

    if (!canUseCamera()) {
        els.cameraPromptText.textContent = t('camera.errorLocalLong');
        els.enableCameraBtn.textContent = t('camera.errorLocalButton');
    } else if (cameraRequesting) {
        els.cameraPromptText.textContent = t('camera.waitingText');
        els.enableCameraBtn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> ${t('camera.waitingButton')}`;
    } else {
        els.cameraPromptText.textContent = t('camera.promptTitle');
        els.enableCameraBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
            </svg>
            ${t('camera.promptButton')}`;
    }
}

function getCameraErrorKey(err) {
    if (!canUseCamera()) return 'camera.errorLocalShort';
    if (err?.name === 'NotAllowedError') return 'camera.errorPermission';
    if (err?.name === 'NotFoundError') return 'camera.errorNotFound';
    if (err?.name === 'NotReadableError') return 'camera.errorInUse';
    return 'camera.errorGeneric';
}

function getCameraErrorMessage(err) {
    state.lastCameraError = getCameraErrorKey(err);
    return t(state.lastCameraError);
}

function stopMediaStream() {
    if (state.mediaStream) {
        state.mediaStream.getTracks().forEach((track) => track.stop());
        state.mediaStream = null;
    }
    els.videoPreview.srcObject = null;
}

function updateControls() {
    const { phase, dualScreen, cameraReady } = state;
    const hasScript = state.rawText.length > 0;
    const isSessionActive = ['countdown', 'recording', 'paused'].includes(phase);
    const isActive = ['recording', 'paused'].includes(phase);
    const hasVideo = state.recordedChunks.length > 0;

    // Pantalla segona: la càmera és a l'altra finestra
    const cameraOk = dualScreen || cameraReady;
    const canRecord = hasScript && cameraOk && !isSessionActive;

    els.recordBtn.disabled = !canRecord;
    els.recordBtn.classList.toggle('recording', phase === 'recording' || phase === 'paused');
    els.pauseBtn.disabled = !isActive;
    els.finishBtn.disabled = !isActive;
    els.downloadBtn.disabled = !hasVideo;

    if (phase === 'countdown') {
        els.recordBtnLabel.textContent = t('actions.preparing');
    } else if (phase === 'recording') {
        els.recordBtnLabel.textContent = t('actions.recording');
    } else if (phase === 'paused') {
        els.recordBtnLabel.textContent = t('actions.paused');
    } else if (!hasScript) {
        els.recordBtnLabel.textContent = t('actions.needScript');
    } else if (!cameraOk) {
        els.recordBtnLabel.textContent = t('actions.waitingCamera');
    } else {
        els.recordBtnLabel.textContent = t('actions.record');
    }

    els.scriptInput.disabled = isSessionActive;
    els.wpmRange.disabled = isSessionActive;
    els.fontSizeRange.disabled = isSessionActive;
    els.dualScreenToggle.disabled = isSessionActive;
    els.viewModeBtns.forEach((btn) => {
        btn.disabled = isSessionActive;
    });

    updateCameraUI();
    updateSteps();
}

function setViewMode(mode) {
    state.viewMode = mode;
    els.stage.classList.remove('view-camera', 'view-prompter');
    els.stage.classList.add(mode === 'prompter' ? 'view-prompter' : 'view-camera');

    els.viewModeBtns.forEach((btn) => {
        btn.classList.toggle('view-mode-active', btn.dataset.view === mode);
    });

    if (mode === 'prompter') {
        if (state.pipPosition) {
            applyPipPosition(state.pipPosition);
        } else {
            applyDefaultPipPosition();
        }
    } else {
        // Mode càmera com a fons — esborrem les posicions inline perquè el CSS prengui el control
        els.cameraPip.style.left = '';
        els.cameraPip.style.top = '';
        els.cameraPip.style.right = '';
        els.cameraPip.style.bottom = '';
        els.cameraPip.style.width = '';
        els.cameraPip.style.height = '';
    }

    localStorage.setItem('teleprompter_viewMode', mode);
    if (state.dualScreen) broadcastSync();
}

function applyDefaultPipPosition() {
    const zoneW = els.prompterZone.clientWidth;
    const zoneH = els.prompterZone.clientHeight;
    const pipW = els.cameraPip.offsetWidth || 220;
    const pipH = els.cameraPip.offsetHeight || 168;
    const margin = 20;
    els.cameraPip.style.left = `${Math.max(0, zoneW - pipW - margin)}px`;
    els.cameraPip.style.top = `${Math.max(0, zoneH - pipH - margin)}px`;
    els.cameraPip.style.right = 'auto';
    els.cameraPip.style.bottom = 'auto';
}

function applyPipPosition(pos) {
    if (!pos || state.viewMode !== 'prompter') return;
    const zone = els.prompterZone.getBoundingClientRect();
    const pipW = els.cameraPip.offsetWidth || 220;
    const pipH = els.cameraPip.offsetHeight || 168;
    const left = Math.max(0, Math.min(pos.left, zone.width - pipW));
    const top = Math.max(0, Math.min(pos.top, zone.height - pipH));
    els.cameraPip.style.left = `${left}px`;
    els.cameraPip.style.top = `${top}px`;
    els.cameraPip.style.right = 'auto';
    els.cameraPip.style.bottom = 'auto';
}

function savePipPosition() {
    if (state.viewMode !== 'prompter') return;
    const left = parseFloat(els.cameraPip.style.left) || 0;
    const top = parseFloat(els.cameraPip.style.top) || 0;
    state.pipPosition = { left, top };
    localStorage.setItem('teleprompter_pipPosition', JSON.stringify(state.pipPosition));
    if (state.dualScreen) broadcastSync();
}

function initPipDrag() {
    const pip = els.cameraPip;
    const handle = els.cameraPipHandle;
    const zone = els.prompterZone;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener('pointerdown', (e) => {
        if (state.viewMode !== 'prompter') return;
        e.preventDefault();
        dragging = true;
        pip.classList.add('is-dragging');
        handle.setPointerCapture(e.pointerId);

        const pipRect = pip.getBoundingClientRect();
        const zoneRect = zone.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = pipRect.left - zoneRect.left;
        startTop = pipRect.top - zoneRect.top;

        pip.style.left = `${startLeft}px`;
        pip.style.top = `${startTop}px`;
        pip.style.right = 'auto';
        pip.style.bottom = 'auto';
    });

    handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const zoneRect = zone.getBoundingClientRect();
        const pipW = pip.offsetWidth;
        const pipH = pip.offsetHeight;
        let left = startLeft + (e.clientX - startX);
        let top = startTop + (e.clientY - startY);
        left = Math.max(0, Math.min(left, zoneRect.width - pipW));
        top = Math.max(0, Math.min(top, zoneRect.height - pipH));
        pip.style.left = `${left}px`;
        pip.style.top = `${top}px`;
    });

    const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        pip.classList.remove('is-dragging');
        if (handle.hasPointerCapture(e.pointerId)) {
            handle.releasePointerCapture(e.pointerId);
        }
        savePipPosition();
    };

    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', () => {
        applyPipPosition(state.pipPosition);
    });
}

// ── Camera ──
async function requestCamera() {
    if (state.dualScreen || state.cameraRequesting) return false;

    if (!canUseCamera()) {
        const msg = getCameraErrorMessage();
        setCameraBanner('error', msg, state.lastCameraError);
        setStatusKey('idle', 'status.cameraUnavailable');
        updateCameraUI();
        updateControls();
        return false;
    }

    state.cameraRequesting = true;
    updateCameraUI();
    setCameraBanner('pending', t('camera.requesting'), 'camera.requesting');

    try {
        stopMediaStream();

        state.mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: true,
        });

        els.videoPreview.srcObject = state.mediaStream;
        await els.videoPreview.play();

        state.cameraReady = true;
        setCameraBanner('ready', t('camera.ready'), 'camera.ready');
        setTimeout(() => setCameraBanner('hidden'), 3000);

        if (hasScript()) setStatusKey('ready', 'status.ready');
        else setStatusKey('idle', 'status.writeScript');

        updateControls();
        return true;
    } catch (err) {
        console.error('Càmera:', err);
        state.cameraReady = false;
        stopMediaStream();
        const msg = getCameraErrorMessage(err);
        setCameraBanner('error', msg, state.lastCameraError);
        setStatusKey('idle', 'status.cameraUnavailable');
        updateControls();
        return false;
    } finally {
        state.cameraRequesting = false;
        updateCameraUI();
    }
}

function initCamera() {
    if (state.dualScreen) return;
    requestCamera();
}

function hasScript() {
    return state.rawText.length > 0;
}

// ── Teleprompter ──
function updateEstimate() {
    state.rawText = els.scriptInput.value.trim();
    const words = countWords(state.rawText);
    state.targetWpm = parseInt(els.wpmRange.value, 10);

    els.wordCount.textContent = t(words === 1 ? 'script.wordsOne' : 'script.wordsOther', { count: words });
    els.wpmValue.textContent = t('settings.speedUnit', { wpm: state.targetWpm });
    els.wpmRange.setAttribute('aria-valuetext', t('settings.speedAria', { wpm: state.targetWpm }));
    updateWpmHint(state.targetWpm);
    syncPresets(state.targetWpm);

    const durationSec = state.targetWpm > 0 ? (words / state.targetWpm) * 60 : 0;
    els.estimatedTime.textContent = formatTime(durationSec > 0 ? durationSec + 3 : 0);
    resetIdleTimerDisplay();

    els.prompterText.innerHTML = state.rawText
        ? state.rawText.replace(/\n/g, '<br><br>')
        : getPlaceholder();

    const height = els.prompterText.offsetHeight;
    const pixelsPerSecond = durationSec > 0 ? height / durationSec : 0;
    state.currentPixelSpeed = pixelsPerSecond / 60;

    if (state.dualScreen) broadcastSync();

    if (['idle', 'ready', 'done'].includes(state.phase)) {
        if (hasScript() && (state.dualScreen || state.cameraReady)) {
            setStatusKey('ready', 'status.ready');
        } else if (!hasScript()) {
            setStatusKey('idle', 'status.writeScript');
        }
    }

    updateControls();
}

function scroll() {
    if (!state.isScrolling) return;

    state.scrollPosition += state.currentPixelSpeed;
    els.prompterText.style.transform = `translateY(-${state.scrollPosition}px)`;

    if (state.scrollPosition > els.prompterText.offsetHeight + 400) {
        stopScrolling();
        setTimeout(() => {
            if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
                finishRecording();
            }
        }, 3000);
    } else {
        state.animationFrameId = requestAnimationFrame(scroll);
    }
}

function startScrolling(forceRestart = false) {
    if (state.isScrolling && !forceRestart) return;
    if (forceRestart) {
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
        state.scrollPosition = 0;
        els.prompterText.style.transform = 'translateY(0)';
    }
    state.isScrolling = true;
    scroll();
}

function stopScrolling() {
    state.isScrolling = false;
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
}

// ── Timer ──
function startTimer(isResume = false) {
    if (!isResume) {
        state.recordingStartTime = Date.now();
    } else {
        const parts = els.recordingTimer.textContent.replace(/^REC\s*/i, '').split(':');
        const elapsed = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        state.recordingStartTime = Date.now() - elapsed * 1000;
    }

    els.recordingTimer.classList.add('active');
    els.stage.classList.add('is-recording');
    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.recordingStartTime) / 1000);
        els.recordingTimer.textContent = `REC ${formatTime(elapsed)}`;
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    els.recordingTimer.classList.remove('active');
    els.stage.classList.remove('is-recording');
    resetIdleTimerDisplay();
}

function resetIdleTimerDisplay() {
    if (['recording', 'paused', 'countdown'].includes(state.phase)) return;
    els.recordingTimer.textContent = els.estimatedTime?.textContent || '00:00';
}

// ── Countdown ──
async function runCountdown(seconds = 3) {
    els.stage.classList.add('is-countdown');
    els.countdown.classList.add('active');

    for (let i = seconds; i > 0; i--) {
        els.countdown.textContent = i;
        els.countdown.classList.remove('go');
        await sleep(1000);
    }

    els.countdown.textContent = t('countdown.go');
    els.countdown.classList.add('go');
    await sleep(600);

    els.countdown.classList.remove('active', 'go');
    els.countdown.textContent = '';
    els.stage.classList.remove('is-countdown');
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function getRecorderOptions() {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    for (const mimeType of types) {
        if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType };
    }
    return {};
}

function resetPrompterScroll() {
    stopScrolling();
    state.scrollPosition = 0;
    els.prompterText.style.transform = 'translateY(0)';
}

// ── Recording ──
async function startRecording() {
    if (['countdown', 'recording', 'paused'].includes(state.phase)) return;
    if (!hasScript()) {
        setStatusKey('idle', 'status.writeScript');
        els.scriptInput.focus();
        updateControls();
        return;
    }

    if (state.dualScreen) {
        await startDualScreenRecording();
        return;
    }

    if (!state.mediaStream || !state.cameraReady) {
        setStatusKey('idle', 'status.cameraPermsCheck');
        setCameraBanner('error', t('camera.errorGeneric'), 'camera.errorGeneric');
        updateControls();
        return;
    }

    setStatusKey('countdown', 'status.preparing');
    updateControls();

    try {
        await runCountdown(3);

        resetPrompterScroll();
        state.recordedChunks = [];

        state.mediaRecorder = new MediaRecorder(state.mediaStream, getRecorderOptions());
        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) state.recordedChunks.push(e.data);
        };
        state.mediaRecorder.onstop = () => {
            stopTimer();
            updateControls();
        };

        state.mediaRecorder.start(250);
        startTimer();
        startScrolling(true);
        setStatusKey('recording', 'status.recording');
    } catch (err) {
        console.error('Gravació:', err);
        setStatusKey('ready', 'status.recordError');
        resetPrompterScroll();
    }

    updateControls();
}

async function startDualScreenRecording() {
    if (!state.prompterWindow || state.prompterWindow.closed) {
        state.pendingRecord = true;
        openPrompterWindow();
        setStatusKey('countdown', 'status.openingPrompter');
        updateControls();

        if (!state.prompterWindow || state.prompterWindow.closed) {
            state.pendingRecord = false;
            setStatusKey('ready', 'status.blockedPopup');
            updateControls();
        }
        return;
    }

    setStatusKey('countdown', 'status.preparing');
    updateControls();
    channel.postMessage({ type: 'startRecording' });
}

function enterRecordingUI() {
    setStatusKey('recording', 'status.recording');
    updateControls();
}

function togglePause() {
    if (state.dualScreen) {
        channel.postMessage({ type: 'togglePause' });
        return;
    }

    if (!state.mediaRecorder) return;

    if (state.mediaRecorder.state === 'recording') {
        state.mediaRecorder.pause();
        stopScrolling();
        stopTimer();
        renderPauseButton(true);
        setStatusKey('paused', 'status.paused');
    } else if (state.mediaRecorder.state === 'paused') {
        state.mediaRecorder.resume();
        startScrolling(false);
        startTimer(true);
        renderPauseButton(false);
        setStatusKey('recording', 'status.recording');
    }
    updateControls();
}

function renderPauseButton(isPaused) {
    const svg = isPaused
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5,3 19,12 5,21"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    const label = isPaused ? t('actions.resume') : t('actions.pause');
    els.pauseBtn.innerHTML = `${svg} <span>${label}</span>`;
}

function finishRecording() {
    if (state.dualScreen) {
        channel.postMessage({ type: 'finishRecording' });
        return;
    }

    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }
    stopScrolling();
    stopTimer();
    exitRecordingUI(true);
}

function exitRecordingUI(finished) {
    renderPauseButton(false);
    els.stage.classList.remove('is-countdown', 'is-recording');
    els.countdown.classList.remove('active', 'go');
    els.countdown.textContent = '';

    if (finished) {
        setStatusKey('done', 'status.done');
    } else if (hasScript() && (state.dualScreen || state.cameraReady)) {
        setStatusKey('ready', 'status.ready');
    }

    updateControls();
}

function downloadVideo() {
    if (state.dualScreen) {
        channel.postMessage({ type: 'downloadRequest' });
        return;
    }
    if (!state.recordedChunks.length) return;

    const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teleprompter-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Dual screen ──
function broadcastSync() {
    channel.postMessage({
        type: 'sync',
        text: els.scriptInput.value,
        wpm: els.wpmRange.value,
        fontSize: els.fontSizeRange.value,
        viewMode: state.viewMode,
        pipPosition: state.pipPosition,
        locale: window.i18n?.getLocale(),
    });
}

function openPrompterWindow() {
    if (state.prompterWindow && !state.prompterWindow.closed) {
        state.prompterWindow.focus();
        broadcastSync();
        return;
    }
    state.prompterWindow = window.open(
        'prompter.html',
        'TeleprompterPrompter',
        'width=1200,height=800,menubar=no,toolbar=no'
    );
    setStatusKey('connected', 'status.connected');
}

function setDualScreen(enabled) {
    state.dualScreen = enabled;
    els.app.classList.toggle('dual-screen', enabled);
    if (enabled) {
        stopMediaStream();
        state.cameraReady = false;
        openPrompterWindow();
    } else if (state.prompterWindow && !state.prompterWindow.closed) {
        state.prompterWindow.close();
        state.prompterWindow = null;
        requestCamera();
    }
    updateControls();
}

channel.onmessage = (event) => {
    const { type } = event.data;

    if (type === 'ready') {
        setStatusKey('connected', 'status.connected');
        broadcastSync();
        if (state.pendingRecord) {
            state.pendingRecord = false;
            setTimeout(() => channel.postMessage({ type: 'startRecording' }), 400);
        }
    }

    if (type === 'recordingStarted') {
        enterRecordingUI();
    }

    if (type === 'recordingPaused') {
        renderPauseButton(true);
        setStatusKey('paused', 'status.paused');
        updateControls();
    }

    if (type === 'recordingResumed') {
        renderPauseButton(false);
        setStatusKey('recording', 'status.recording');
        updateControls();
    }

    if (type === 'recordingFinished') {
        exitRecordingUI(true);
    }

    if (type === 'recordingFailed') {
        setStatusKey('ready', 'status.recordError');
        updateControls();
    }

    if (type === 'videoReady') {
        updateControls();
    }
};

setInterval(() => {
    if (state.prompterWindow && state.prompterWindow.closed) {
        state.prompterWindow = null;
        if (state.dualScreen) {
            els.dualScreenToggle.checked = false;
            state.dualScreen = false;
            els.app.classList.remove('dual-screen');
            if (state.phase === 'connected') {
                const phase = hasScript() && state.cameraReady ? 'ready' : 'idle';
                const key = hasScript() ? 'status.ready' : 'status.writeScript';
                setStatusKey(phase, key);
            }
        }
    }
}, 1000);

// ── Events ──
els.scriptInput.addEventListener('input', () => setTimeout(updateEstimate, 50));

els.wpmRange.addEventListener('input', updateEstimate);

els.fontSizeRange.addEventListener('input', () => {
    const size = els.fontSizeRange.value;
    els.fontSizeValue.textContent = t('settings.fontSizeUnit', { size });
    els.prompterText.style.fontSize = `${size}px`;
    setTimeout(updateEstimate, 80);
});

els.presets.forEach((btn) => {
    btn.addEventListener('click', () => {
        els.wpmRange.value = btn.dataset.wpm;
        updateEstimate();
    });
});

els.dualScreenToggle.addEventListener('change', (e) => setDualScreen(e.target.checked));

els.viewModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.view));
});

els.enableCameraBtn?.addEventListener('click', () => requestCamera());

function setSidebarCollapsed(collapsed, persist = true) {
    els.app.classList.toggle('sidebar-collapsed', collapsed);
    if (els.sidebarToggle) {
        const label = collapsed ? t('toggle.expand') : t('toggle.collapse');
        els.sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
        els.sidebarToggle.setAttribute('aria-label', label);
        els.sidebarToggle.setAttribute('title', label);
    }
    if (persist) {
        localStorage.setItem('teleprompter_sidebarCollapsed', collapsed ? '1' : '0');
    }
    setTimeout(() => applyPipPosition(state.pipPosition), 350);
}

els.sidebarToggle?.addEventListener('click', () => {
    const isCollapsed = els.app.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(!isCollapsed);
});

els.recordBtn.addEventListener('click', startRecording);
els.pauseBtn.addEventListener('click', togglePause);
els.finishBtn.addEventListener('click', finishRecording);
els.downloadBtn.addEventListener('click', downloadVideo);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && ['recording', 'paused'].includes(state.phase)) {
        e.preventDefault();
        togglePause();
    }
    if (e.code === 'Escape' && ['recording', 'paused'].includes(state.phase)) {
        e.preventDefault();
        finishRecording();
    }
});

// ── Init ──
async function bootstrap() {
    if (window.i18n?.ready) {
        try { await window.i18n.ready; } catch { /* ignore */ }
    }

    if (window.i18n && els.languageSelect) {
        window.i18n.populateSelect(els.languageSelect);
        window.i18n.onChange(() => {
            window.i18n.applyTranslations();
            renderPauseButton(state.mediaRecorder?.state === 'paused');
            updateEstimate();
            updateControls();
            setSidebarCollapsed(els.app.classList.contains('sidebar-collapsed'), false);

            // Re-tradueix el banner i l'estat actuals
            if (state.lastBanner?.key) {
                setCameraBanner(state.lastBanner.type, t(state.lastBanner.key), state.lastBanner.key);
            }
            if (state.lastStatus?.key) {
                els.statusText.textContent = t(state.lastStatus.key);
            }

            if (state.dualScreen) broadcastSync();
        });
    }

    const savedView = localStorage.getItem('teleprompter_viewMode');
    const savedPip = localStorage.getItem('teleprompter_pipPosition');
    const savedCollapsed = localStorage.getItem('teleprompter_sidebarCollapsed');

    if (savedPip) {
        try { state.pipPosition = JSON.parse(savedPip); } catch { /* ignore */ }
    }
    if (savedView === 'prompter' || savedView === 'camera') {
        setViewMode(savedView);
    }
    if (savedCollapsed === '1') {
        setSidebarCollapsed(true, false);
    } else {
        setSidebarCollapsed(false, false);
    }

    initPipDrag();
    els.prompterText.style.fontSize = `${els.fontSizeRange.value}px`;
    els.fontSizeValue.textContent = t('settings.fontSizeUnit', { size: els.fontSizeRange.value });
    renderPauseButton(false);
    updateEstimate();
    setStatusKey('idle', 'status.cameraUnavailable');
    updateCameraUI();

    if (canUseCamera()) {
        requestCamera();
    } else {
        setCameraBanner('error', getCameraErrorMessage(), state.lastCameraError);
        setStatusKey('idle', 'status.cameraUnavailableLocal');
        updateControls();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
