import { validateLicense } from '../lib/crypto-mini.js';
let currentSettings = { is_pro: false, custom_insults: [], selected_skin: 'white_blob' };
let currentItemState = { shield_active: false, shield_expiry: 0 };
let currentStats = { current_state: 'NORMAL', total_distraction_time: 0 };
let currentPetProfile = { shield_used_today: false };
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.local.get(['user_stats', 'settings', 'item_state', 'pet_profile']);
  if (result.user_stats) currentStats = result.user_stats;
  if (result.settings) currentSettings = result.settings;
  if (result.item_state) currentItemState = result.item_state;
  if (result.pet_profile) currentPetProfile = result.pet_profile;
  updateUI();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.user_stats) currentStats = changes.user_stats.newValue;
      if (changes.settings) currentSettings = changes.settings.newValue;
      if (changes.item_state) currentItemState = changes.item_state.newValue;
      if (changes.pet_profile) currentPetProfile = changes.pet_profile.newValue;
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
      const isValid = await validateLicense(key);
      if (isValid) {
        currentSettings.is_pro = true;
        currentSettings.license_key = btoa(key);
        await chrome.storage.local.set({ settings: currentSettings });
        msg.textContent = "Pro Activated!";
        msg.style.color = "green";
      } else {
        msg.textContent = "Invalid Key (Try DG-1234)";
        msg.style.color = "red";
      }
    });
  }
  const shieldBtn = document.getElementById('shield-btn');
  if (shieldBtn) {
      shieldBtn.addEventListener('click', async () => {
          if (!currentSettings.is_pro) return;
          const now = Date.now();
          if (currentItemState.shield_active && currentItemState.shield_expiry > now) {
              return;
          }
          if (currentPetProfile.shield_used_today) {
              alert("Shield already used today! Resets at midnight.");
              return;
          }
          const newState = { ...currentItemState };
          newState.shield_active = true;
          newState.shield_expiry = now + 24 * 60 * 60 * 1000;
          const newProfile = { ...currentPetProfile };
          newProfile.shield_used_today = true;
          await chrome.storage.local.set({ item_state: newState, pet_profile: newProfile });
      });
  }
  const radios = document.querySelectorAll('input[name="skin"]');
  radios.forEach(r => {
      r.addEventListener('change', async (e) => {
          if (!currentSettings.is_pro) {
              e.target.checked = false;
              updateUI();
              return;
          }
          currentSettings.selected_skin = e.target.value;
          await chrome.storage.local.set({ settings: currentSettings });
      });
  });
  const saveInsultsBtn = document.getElementById('save-insults-btn');
  if (saveInsultsBtn) {
      saveInsultsBtn.addEventListener('click', async () => {
          if (!currentSettings.is_pro) return;
          const textarea = document.getElementById('insult-input');
          const text = textarea.value;
          const insults = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
          currentSettings.custom_insults = insults;
          await chrome.storage.local.set({ settings: currentSettings });
          alert('Insults saved!');
      });
  }
}
function updateUI() {
    const state = currentStats.current_state || 'NORMAL';
    const minutes = Math.floor((currentStats.total_distraction_time || 0) / 60);
    document.getElementById('state-text').textContent = `State: ${state}`;
    document.getElementById('distraction-time').textContent = minutes;
    const skin = currentSettings.selected_skin || 'white_blob';
    const fileName = state.toLowerCase() + '.svg';
    const img = document.getElementById('pet-display');
    img.src = `../assets/pets/${skin}/${fileName}`;
    img.onerror = () => { img.src = ""; img.style.backgroundColor="magenta"; };
    const isPro = currentSettings.is_pro;
    const proSection = document.getElementById('pro-features');
    const storeSection = document.getElementById('store-section');
    if (isPro) {
        proSection.classList.remove('hidden');
        storeSection.classList.add('hidden');
        const overlay = proSection.querySelector('.lock-overlay');
        if (overlay) overlay.remove();
    } else {
        proSection.classList.remove('hidden');
        storeSection.classList.remove('hidden');
        if (!proSection.querySelector('.lock-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'lock-overlay';
            overlay.textContent = '🔒';
            overlay.title = "Buy PRO to unlock";
            overlay.onclick = () => {
                storeSection.scrollIntoView({ behavior: 'smooth' });
                storeSection.style.transition = "background-color 0.5s";
                storeSection.style.backgroundColor = "#fff9c4";
                setTimeout(() => storeSection.style.backgroundColor = "white", 1000);
            };
            proSection.appendChild(overlay);
        }
    }
    const shieldStatus = document.getElementById('shield-status');
    const shieldBtn = document.getElementById('shield-btn');
    const now = Date.now();
    if (currentItemState.shield_active && currentItemState.shield_expiry > now) {
        const hoursLeft = Math.ceil((currentItemState.shield_expiry - now) / (60*60*1000));
        shieldStatus.textContent = `Active (${hoursLeft}h left)`;
        shieldStatus.style.color = "green";
        shieldBtn.textContent = "Shield Active";
        shieldBtn.disabled = true;
    } else if (currentPetProfile.shield_used_today) {
        shieldStatus.textContent = "Used Today (Resets Midnight)";
        shieldStatus.style.color = "orange";
        shieldBtn.textContent = "Cooldown";
        shieldBtn.disabled = true;
    } else {
        shieldStatus.textContent = "Inactive";
        shieldStatus.style.color = "grey";
        shieldBtn.textContent = "Activate Shield (24h)";
        shieldBtn.disabled = false;
    }
    const radios = document.querySelectorAll('input[name="skin"]');
    radios.forEach(r => {
        if (r.value === (currentSettings.selected_skin || 'white_blob')) {
            r.checked = true;
        }
    });
    const textarea = document.getElementById('insult-input');
    if (document.activeElement !== textarea && currentSettings.custom_insults) {
        textarea.value = currentSettings.custom_insults.join('\n');
    }
}
