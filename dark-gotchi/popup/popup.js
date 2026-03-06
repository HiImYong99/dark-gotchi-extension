import { validateLicense } from '../lib/crypto-mini.js';

let currentSettings = { is_pro: false, selected_skin: 'white_blob', is_enabled: true };
let currentStats = { current_state: 'NORMAL', total_distraction_time: 0 };
let currentMapping = {};

document.addEventListener('DOMContentLoaded', async () => {
    const result = await chrome.storage.local.get(['user_stats', 'settings', 'domain_mapping']);

    if (result.user_stats) currentStats = result.user_stats;
    if (result.settings) currentSettings = result.settings;
    if (result.domain_mapping) currentMapping = result.domain_mapping;

    updateUI();
    updateDomainLists();

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.user_stats) currentStats = changes.user_stats.newValue;
            if (changes.settings) currentSettings = changes.settings.newValue;
            if (changes.domain_mapping) {
                currentMapping = changes.domain_mapping.newValue;
                updateDomainLists();
            }
            updateUI();
        }
    });

    setupEventListeners();
});

function setupEventListeners() {
    const activateBtn = document.getElementById('activate-btn');
    if (activateBtn) {
        activateBtn.addEventListener('click', async () => {
            const input = document.getElementById('license-input');
            const key = input.value.trim();
            const msg = document.getElementById('license-msg');

            // --- Secret Support Code Logic ---
            if (key === 'Pet-forever') {
                currentSettings.is_pro = true;
                await chrome.storage.local.set({ settings: currentSettings });
                msg.textContent = "❤️ Thank you! Secret pets unlocked!";
                msg.style.color = "white";
                setTimeout(() => location.reload(), 1000);
                return;
            }
            // ---------------------------------

            const isValid = await validateLicense(key);

            if (isValid) {
                currentSettings.is_pro = true;
                currentSettings.license_key = btoa(key);
                await chrome.storage.local.set({ settings: currentSettings });
                msg.textContent = "Pro features activated! Thanks!";
                msg.style.color = "white";
                setTimeout(() => location.reload(), 1000);
            } else {
                msg.textContent = "Invalid code. Please try again.";
                msg.style.color = "rgba(255,255,255,0.8)";
            }
        });
    }

    // Skin Selection & Locked Scroll Logic
    const skinOptions = document.querySelectorAll('.skin-option');
    skinOptions.forEach(opt => {
        const input = opt.querySelector('input');

        opt.addEventListener('click', (e) => {
            const rewardSkins = ['doge', 'hamster'];
            if (!currentSettings.is_pro && rewardSkins.includes(input.value)) {
                e.preventDefault();
                const store = document.getElementById('store-section');
                if (store) {
                    store.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const licenseInput = document.getElementById('license-input');
                    if (licenseInput) {
                        licenseInput.focus();
                    }
                }
            }
        });

        input.addEventListener('change', async (e) => {
            if (currentSettings.is_pro || !['doge', 'hamster'].includes(e.target.value)) {
                currentSettings.selected_skin = e.target.value;
                await chrome.storage.local.set({ settings: currentSettings });
            }
        });
    });

    // Reset Button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.onclick = async () => {
            if (confirm("Reset all distraction stats?")) {
                currentStats.total_distraction_time = 0;
                currentStats.top_distractions = {};
                currentStats.category_times = {
                    ENTERTAINMENT: 0, SOCIAL: 0, SHOPPING: 0, PRODUCTIVE: 0
                };
                currentStats.current_state = 'NORMAL';
                await chrome.storage.local.set({ user_stats: currentStats });
                updateUI();
            }
        };
    }

    // Guide Toggle
    const guideToggle = document.getElementById('guide-toggle');
    const guideContent = document.getElementById('guide-content');
    if (guideToggle && guideContent) {
        guideToggle.onclick = () => {
            guideContent.classList.toggle('hidden');
            const chevron = guideToggle.querySelector('.chevron');
            if (chevron) {
                chevron.textContent = guideContent.classList.contains('hidden') ? '▾' : '▴';
            }
        };
    }

    // Add Site logic
    const addBtn = document.getElementById('add-site-btn');
    if (addBtn) {
        addBtn.onclick = async () => {
            const input = document.getElementById('new-domain');
            const select = document.getElementById('new-category');
            const domain = input.value.trim().toLowerCase();
            const category = select.value;

            if (domain && !currentMapping[domain]) {
                currentMapping[domain] = category;
                await chrome.storage.local.set({ domain_mapping: currentMapping });
                input.value = '';
                updateDomainLists();
            }
        };
    }

    // Summon Pet Logic (now Toggle Pet)
    const summonBtn = document.getElementById('summon-btn');
    if (summonBtn) {
        summonBtn.onclick = async () => {
            const newState = currentSettings.is_enabled === false ? true : false;
            currentSettings.is_enabled = newState;
            await chrome.storage.local.set({ settings: currentSettings });

            if (newState) {
                summonBtn.textContent = "🐾 Disable";
            } else {
                summonBtn.textContent = "🐾 Enable";
            }
        };
    }

    // Easter Egg
    const logo = document.querySelector('.logo');
    if (logo) {
        let clickCount = 0;
        logo.onclick = () => {
            clickCount++;
            if (clickCount === 7) {
                alert("🌈 RAINBOW MODE UNLOCKED!");
                chrome.storage.local.set({ secret_mode: true });
            }
        };
    }
}

function updateUI() {
    const summonBtn = document.getElementById('summon-btn');
    if (summonBtn) {
        if (currentSettings.is_enabled === false) {
            summonBtn.textContent = "🐾 Enable";
        } else {
            summonBtn.textContent = "🐾 Disable";
        }
    }

    const state = currentStats.current_state || 'NORMAL';
    const totalDistTime = currentStats.total_distraction_time || 0;
    const minutes = Math.floor(totalDistTime / 60);
    const level = Math.min(20, Math.floor(minutes / 5) + 1);

    document.getElementById('state-text').textContent = state === 'NORMAL' ? 'HEALTHY' : state;
    document.getElementById('distraction-time').textContent = minutes;
    document.getElementById('distraction-level').textContent = `Lv. ${level}`;

    const skin = currentSettings.selected_skin || 'white_blob';
    const fileName = state.toLowerCase() + '.svg';
    const img = document.getElementById('pet-display');
    if (img) img.src = `../assets/pets/${skin}/${fileName}`;

    const isPro = currentSettings.is_pro;
    const storeSection = document.getElementById('store-section');
    const appContainer = document.querySelector('.app-container');

    if (isPro) {
        if (storeSection) storeSection.classList.add('hidden');
        if (appContainer) appContainer.classList.add('is-pro');
    } else {
        if (storeSection) storeSection.classList.remove('hidden');
        if (appContainer) appContainer.classList.remove('is-pro');
    }

    const radios = document.querySelectorAll('input[name="skin"]');
    radios.forEach(r => {
        if (r.value === skin) r.checked = true;
    });
}

function updateDomainLists() {
    const whiteList = document.getElementById('white-list');
    const blackList = document.getElementById('black-list');
    if (!whiteList || !blackList) return;

    whiteList.innerHTML = '';
    blackList.innerHTML = '';

    Object.entries(currentMapping).forEach(([domain, category]) => {
        const chip = document.createElement('div');
        chip.className = 'domain-chip';
        chip.innerHTML = `${domain} <span class="remove-site" data-domain="${domain}">×</span>`;

        if (category === 'PRODUCTIVE') {
            whiteList.appendChild(chip);
        } else {
            blackList.appendChild(chip);
        }
    });

    document.querySelectorAll('.remove-site').forEach(btn => {
        btn.onclick = async (e) => {
            const domain = e.target.getAttribute('data-domain');
            delete currentMapping[domain];
            await chrome.storage.local.set({ domain_mapping: currentMapping });
            updateDomainLists();
        };
    });
}
