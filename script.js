document.addEventListener('DOMContentLoaded', () => {
    const producerPanel = document.getElementById('producer-panel');
    const handle = producerPanel.querySelector('.handle');
    const clockDisplay = document.getElementById('clock');
    const startPauseBtn = document.getElementById('start-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const timestampBtn = document.getElementById('timestamp-btn');
    const scratchPad = document.getElementById('scratch-pad');
    const exportTxtBtn = document.getElementById('export-txt-btn');
    const clearPadBtn = document.getElementById('clear-pad-btn');
    const togglePositionBtn = document.getElementById('toggle-position-btn');
    const panelControlsModule = document.querySelector('.panel-controls-module');
    const currentTimeDisplay = document.getElementById('current-time');
    const currentDateDisplay = document.getElementById('current-date');

    let timer;
    let elapsedTime = 0;
    let isRunning = false;

    // Check if we're in popup mode
    const urlParams = new URLSearchParams(window.location.search);
    const isPopupMode = urlParams.get('mode') === 'panel';
    
    // Configure UI based on mode
    if (isPopupMode) {
        producerPanel.style.width = '100%';
        handle.style.display = 'none';
    } else {
        // Hide panel controls in regular browser mode
        if (panelControlsModule) {
            panelControlsModule.style.display = 'none';
        }
    }

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
        
        // Visual feedback
        timestampBtn.classList.add('clicked');
        timestampBtn.textContent = '✓ Added';
        setTimeout(() => {
            timestampBtn.classList.remove('clicked');
            timestampBtn.textContent = 'Timestamp';
        }, 300);
    });

    // --- Scratch Pad ---
    function saveScratchPad() {
        localStorage.setItem('dcpn-scratchpad', scratchPad.value);
    }

    scratchPad.addEventListener('input', saveScratchPad);

    // --- Export & Clear ---
    exportTxtBtn.addEventListener('click', () => {
        const text = scratchPad.value;
        const blob = new Blob([text], { type: 'text/plain' });
        const anchor = document.createElement('a');
        anchor.download = 'dcpn-notes.txt';
        anchor.href = window.URL.createObjectURL(blob);
        anchor.click();
        window.URL.revokeObjectURL(anchor.href);
    });

    clearPadBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all notes?')) {
            scratchPad.value = '';
            saveScratchPad();
        }
    });

    // --- Panel Controls ---
    togglePositionBtn.addEventListener('click', () => {
        if (isPopupMode) {
            // In popup mode, move the window to the other side of the screen
            const currentX = window.screenX;
            const screenWidth = window.screen.availWidth;
            const windowWidth = window.outerWidth;
            
            if (currentX < screenWidth / 2) {
                // Currently on left, move to right
                window.moveTo(screenWidth - windowWidth, 0);
            } else {
                // Currently on right, move to left
                window.moveTo(0, 0);
            }
        } else {
            // Regular mode - toggle sidebar position
            if (producerPanel.classList.contains('left')) {
                producerPanel.classList.remove('left');
                producerPanel.classList.add('right');
                localStorage.setItem('dcpn-panel-position', 'right');
            } else {
                producerPanel.classList.remove('right');
                producerPanel.classList.add('left');
                localStorage.setItem('dcpn-panel-position', 'left');
            }
        }
    });


    // --- Current Time and Date Display ---
    function updateCurrentTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = `${displayHours}:${minutes} ${ampm}`;
        }
        
        if (currentDateDisplay) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[now.getMonth()];
            const day = now.getDate();
            const year = now.getFullYear();
            currentDateDisplay.textContent = `${month} ${day}, ${year}`;
        }
    }

    // Update current time every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

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
