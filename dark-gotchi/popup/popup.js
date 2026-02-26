import { validateLicense } from '../lib/crypto-mini.js';

document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.local.get(['user_stats', 'settings']);

  updateUI(result.user_stats);
  updateLicenseUI(result.settings);

  // Setup listener for updates
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.user_stats) updateUI(changes.user_stats.newValue);
      if (changes.settings) updateLicenseUI(changes.settings.newValue);
    }
  });

  const btn = document.getElementById('activate-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const input = document.getElementById('license-input');
      const key = input.value;
      const msg = document.getElementById('license-msg');

      const isValid = await validateLicense(key);

      if (isValid) {
        msg.textContent = "Pro Activated!";
        msg.style.color = "green";

        // Update settings
        const currentSettings = result.settings || { is_pro: false, custom_insults: [] };
        currentSettings.is_pro = true;
        currentSettings.license_key = key;

        await chrome.storage.local.set({ settings: currentSettings });
        updateLicenseUI(currentSettings);
      } else {
        msg.textContent = "Invalid Key";
        msg.style.color = "red";
      }
    });
  }
});

function updateUI(stats) {
  if (!stats) return;

  const state = stats.current_state || 'NORMAL';
  const stateText = document.getElementById('state-text');
  if (stateText) stateText.textContent = `State: ${state}`;

  const minutes = Math.floor((stats.total_distraction_time || 0) / 60);
  const timeText = document.getElementById('distraction-time');
  if (timeText) timeText.textContent = minutes;

  let imgSrc = '../assets/pets/normal.svg';
  switch (state) {
    case 'FAT': imgSrc = '../assets/pets/fat.svg'; break;
    case 'ARROGANT': imgSrc = '../assets/pets/arrogant.svg'; break;
    case 'BEGGAR': imgSrc = '../assets/pets/beggar.svg'; break;
    case 'NORMAL':
    default: imgSrc = '../assets/pets/normal.svg'; break;
  }

  const img = document.getElementById('pet-display');
  if (img) img.src = imgSrc;
}

function updateLicenseUI(settings) {
  if (settings && settings.is_pro) {
    const input = document.getElementById('license-input');
    const btn = document.getElementById('activate-btn');
    const msg = document.getElementById('license-msg');

    if (input) input.style.display = 'none';
    if (btn) btn.style.display = 'none';
    if (msg) {
        msg.textContent = "PRO VERSION ACTIVE";
        msg.style.color = "blue";
    }
  }
}
