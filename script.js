document.addEventListener('DOMContentLoaded', () => {
    const producerPanel = document.getElementById('producer-panel');
    const handle = producerPanel.querySelector('.handle');
    const clockDisplay = document.getElementById('clock');
    const startPauseBtn = document.getElementById('start-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const timestampBtn = document.getElementById('timestamp-btn');
    const scratchPad = document.getElementById('scratch-pad');
    const exportTxtBtn = document.getElementById('export-txt-btn');

    let timer;
    let elapsedTime = 0;
    let isRunning = false;

    // --- Resizable Panel ---
    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
        });
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const newWidth = producerPanel.classList.contains('left')
            ? e.clientX
            : window.innerWidth - e.clientX;
        producerPanel.style.width = `${newWidth}px`;
    }

    // --- Clock / Timer ---
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function updateClock() {
        clockDisplay.textContent = formatTime(elapsedTime);
    }

    function startTimer() {
        isRunning = true;
        startPauseBtn.textContent = 'Pause';
        timer = setInterval(() => {
            elapsedTime++;
            updateClock();
            localStorage.setItem('dcpn-timer-elapsed', elapsedTime);
        }, 1000);
    }

    function pauseTimer() {
        isRunning = false;
        startPauseBtn.textContent = 'Start';
        clearInterval(timer);
    }

    startPauseBtn.addEventListener('click', () => {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    resetBtn.addEventListener('click', () => {
        pauseTimer();
        elapsedTime = 0;
        updateClock();
        localStorage.setItem('dcpn-timer-elapsed', 0);
    });

    // --- Timestamp Logger ---
    timestampBtn.addEventListener('click', () => {
        const timestamp = `[${formatTime(elapsedTime)}] `;
        const currentText = scratchPad.value;
        const cursorPos = scratchPad.selectionStart;
        const textBefore = currentText.substring(0, cursorPos);
        const textAfter = currentText.substring(cursorPos, currentText.length);
        
        scratchPad.value = textBefore + timestamp + textAfter;
        scratchPad.focus();
        scratchPad.selectionStart = scratchPad.selectionEnd = cursorPos + timestamp.length;
        saveScratchPad();
    });

    // --- Scratch Pad ---
    function saveScratchPad() {
        localStorage.setItem('dcpn-scratchpad', scratchPad.value);
    }

    scratchPad.addEventListener('input', saveScratchPad);

    // --- Export ---
    exportTxtBtn.addEventListener('click', () => {
        const text = scratchPad.value;
        const blob = new Blob([text], { type: 'text/plain' });
        const anchor = document.createElement('a');
        anchor.download = 'dcpn-notes.txt';
        anchor.href = window.URL.createObjectURL(blob);
        anchor.click();
        window.URL.revokeObjectURL(anchor.href);
    });

    // --- Load from localStorage ---
    function loadState() {
        const savedTime = localStorage.getItem('dcpn-timer-elapsed');
        if (savedTime) {
            elapsedTime = parseInt(savedTime, 10);
        }
        updateClock();

        const savedNotes = localStorage.getItem('dcpn-scratchpad');
        if (savedNotes) {
            scratchPad.value = savedNotes;
        }

        const savedPosition = localStorage.getItem('dcpn-panel-position');
        if (savedPosition === 'right') {
            producerPanel.classList.remove('left');
            producerPanel.classList.add('right');
        }

        const savedWidth = localStorage.getItem('dcpn-panel-width');
        if (savedWidth) {
            producerPanel.style.width = savedWidth;
        }
    }

    loadState();
});
