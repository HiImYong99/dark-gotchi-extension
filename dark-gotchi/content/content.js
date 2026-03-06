// content/content.js

if (!window.darkGotchiInjected) {
window.darkGotchiInjected = true;

const HOST_ID = 'dark-gotchi-host';
let currentSettings = {
    selected_skin: 'white_blob',
    custom_insults: []
};
let currentStats = null;
let isWandering = false;
let wanderInterval = null;
let secretMode = false;
let isDizzy = false;
let dizzyTimeout = null;
let shakeCount = 0;
let lastShakeTime = 0;

async function initPet() {
    if (document.getElementById(HOST_ID)) return;

    const host = document.createElement('div');
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'pet-container';
    shadow.appendChild(container);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('content/styles.css');
    shadow.appendChild(link);

    const result = await chrome.storage.local.get(['user_stats', 'settings', 'secret_mode']);
    if (result.settings) currentSettings = result.settings;
    if (result.user_stats) currentStats = result.user_stats;
    if (result.secret_mode) secretMode = true;

    updatePetVisual(container, currentStats);
    startWandering(container);

    document.body.appendChild(host);
}

// Global Listeners (registered exactly once)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        let needsRender = false;
        if (changes.settings) {
            currentSettings = changes.settings.newValue;
            needsRender = true;

            if (currentSettings.is_enabled === false) {
                removePet();
                needsRender = false;
            } else if (currentSettings.is_enabled !== false && !document.getElementById(HOST_ID)) {
                initPet();
                needsRender = false;
            }
        }
        if (changes.user_stats) {
            currentStats = changes.user_stats.newValue;
            needsRender = true;
        }
        if (changes.secret_mode) {
            secretMode = changes.secret_mode.newValue;
            needsRender = true;
        }
        if (needsRender && currentStats) {
            const container = document.getElementById(HOST_ID)?.shadowRoot?.getElementById('pet-container');
            if (container) {
                requestAnimationFrame(() => updatePetVisual(container, currentStats));
            }
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'STATE_UPDATE') {
        currentStats = message.stats;
        const container = document.getElementById(HOST_ID)?.shadowRoot?.getElementById('pet-container');
        if (container) {
            updatePetVisual(container, currentStats);
        }
    } else if (message.action === 'TOGGLE_PET') {
        currentSettings.is_enabled = message.is_enabled;
        if (message.is_enabled === false) {
            removePet();
        } else if (!document.getElementById(HOST_ID)) {
            initPet();
        }
    }
});

document.addEventListener('visibilitychange', () => {
    const container = document.getElementById(HOST_ID)?.shadowRoot?.getElementById('pet-container');
    if (!container) return;
    const img = container.querySelector('.pet-image');
    if (!img) return;
    if (document.hidden) {
        img.classList.remove('anim-bounce');
    } else {
        if (currentStats && currentStats.current_state === 'NORMAL' && !isDizzy) {
            img.classList.add('anim-bounce');
        }
    }
});

function updatePetVisual(container, stats) {
    if (!stats) return;

    const state = stats.current_state || 'NORMAL';
    const skin = currentSettings.selected_skin || 'white_blob';

    // Level-up Logic: Calculate level based on total distraction time
    const totalTime = stats.total_distraction_time || 0;
    const petLevel = Math.min(20, Math.floor((totalTime / 60) / 5) + 1);

    container.innerHTML = '';
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    container.appendChild(bubble);

    const img = document.createElement('img');
    img.className = 'pet-image';

    // Check if the user specifically requested a pet_lvl.png, fallback to standard SVGs
    // If the image errors out, we fallback to the SVG
    let fallbackFileName = state.toLowerCase() + '.svg';
    let primaryFileName = `pet_lvl${petLevel}.png`;

    let imgSrc = `assets/pets/${skin}/${primaryFileName}`;
    let fallbackImgSrc = `assets/pets/${skin}/${fallbackFileName}`;

    let messageText = chrome.i18n.getMessage('petHi');
    let extraClass = "";

    const getInsult = (defaultMsgKey) => {
        if (currentSettings.custom_insults && currentSettings.custom_insults.length > 0) {
            const idx = Math.floor(Math.random() * currentSettings.custom_insults.length);
            return currentSettings.custom_insults[idx];
        }
        return chrome.i18n.getMessage(defaultMsgKey);
    };

    switch (state) {
        case 'FAT':
            messageText = getInsult('petFat');
            extraClass = 'state-fat';
            break;
        case 'ARROGANT':
            messageText = getInsult('petArrogant');
            extraClass = 'state-arrogant';
            break;
        case 'BEGGAR':
            messageText = getInsult('petBeggar');
            extraClass = 'state-beggar';
            break;
        case 'NORMAL':
        default:
            messageText = chrome.i18n.getMessage('petHi');
            break;
    }

    img.src = chrome.runtime.getURL(imgSrc);
    img.onerror = () => {
        // Fallback to the SVG state-based architecture if png doesn't exist
        img.onerror = () => {
            img.src = "";
            img.style.backgroundColor = "magenta";
            img.style.width = "16px";
            img.style.height = "16px";
            img.style.display = "block";
        };
        img.src = chrome.runtime.getURL(fallbackImgSrc);
    };

    if (extraClass) {
        container.className = extraClass;
    } else {
        container.className = '';
    }

    if (state === 'NORMAL' && !document.hidden && !isDizzy) {
        img.classList.add('anim-bounce');
    }

    if (secretMode) {
        img.style.filter = `hue-rotate(${Math.floor(Date.now() / 10) % 360}deg) brightness(1.2)`;
        setTimeout(() => { if (secretMode) updatePetVisual(container, stats); }, 50);
    } else {
        img.style.filter = 'none';
    }

    container.appendChild(img);

    container.onclick = () => {
        const now = Date.now();
        if (now - lastShakeTime < 500) {
            shakeCount++;
            if (shakeCount > 5) {
                triggerDizzy(bubble, img);
                shakeCount = 0;
                return;
            }
        } else {
            shakeCount = 1;
        }
        lastShakeTime = now;

        if (state !== 'NORMAL') {
            const msgKey = state === 'FAT' ? 'petFat' : (state === 'ARROGANT' ? 'petArrogant' : 'petBeggar');
            messageText = getInsult(msgKey);
        }

        // Add level info to the message
        bubble.textContent = isDizzy ? "@@..." : `[Lv.${petLevel}] ${messageText}`;
        bubble.classList.add('visible');
        setTimeout(() => {
            bubble.classList.remove('visible');
        }, 3000);
    };
}

function startWandering(container) {
    if (wanderInterval) clearInterval(wanderInterval);

    wanderInterval = setInterval(() => {
        if (document.hidden || isDizzy) return;

        const randomX = Math.floor(Math.random() * 100) - 50;
        const randomY = Math.floor(Math.random() * 50) - 25;

        container.style.transition = "all 2s ease-in-out";
        container.style.transform = `translate(${randomX}px, ${randomY}px)`;

        const img = container.querySelector('.pet-image');
        if (img) {
            img.style.transform = randomX > 0 ? "scaleX(-1)" : "scaleX(1)";
            img.classList.remove('anim-bounce');
            img.classList.add('anim-walk');

            // Stop walking after movement finishes (2s)
            setTimeout(() => {
                img.classList.remove('anim-walk');
                if (currentStats && currentStats.current_state === 'NORMAL' && !isDizzy) {
                    img.classList.add('anim-bounce');
                }
            }, 2000);
        }

    }, 5000);
}

function triggerDizzy(bubble, img) {
    isDizzy = true;
    img.style.animation = "spin 0.5s infinite linear";
    bubble.textContent = "X_X";
    bubble.classList.add('visible');

    if (dizzyTimeout) clearTimeout(dizzyTimeout);
    dizzyTimeout = setTimeout(() => {
        isDizzy = false;
        img.style.animation = "";
        bubble.classList.remove('visible');
    }, 5000);
}

function removePet() {
    const host = document.getElementById(HOST_ID);
    if (host) {
        host.remove();
    }
    if (wanderInterval) {
        clearInterval(wanderInterval);
        wanderInterval = null;
    }
}

// Auto-run if enabled
chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings || result.settings.is_enabled !== false) {
        initPet();
    }
});

} // End of window.darkGotchiInjected check
