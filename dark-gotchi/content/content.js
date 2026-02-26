// content/content.js

const HOST_ID = 'dark-gotchi-host';
let currentSettings = {
    selected_skin: 'white_blob',
    custom_insults: []
};

async function init() {
  // Check if host already exists
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;

  // Attach shadow root
  const shadow = host.attachShadow({ mode: 'open' });

  // Create Container inside Shadow DOM
  const container = document.createElement('div');
  container.id = 'pet-container';
  shadow.appendChild(container);

  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('content/styles.css');
  shadow.appendChild(link);

  // Initial Fetch
  const result = await chrome.storage.local.get(['user_stats', 'settings']);
  if (result.settings) {
      currentSettings = result.settings;
  }
  renderPet(container, result.user_stats);

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      let needsRender = false;
      let newStats = null;

      if (changes.settings) {
          currentSettings = changes.settings.newValue;
          needsRender = true;
      }

      if (changes.user_stats) {
          newStats = changes.user_stats.newValue;
          needsRender = true;
      } else {
          // If only settings changed, we need current stats to re-render
          // But we don't have them easily unless we store them or re-fetch.
          // For simplicity, let's re-fetch if only settings changed,
          // or just rely on the fact that usually stats update frequently.
          // Better: fetch stats if not provided.
      }

      if (needsRender) {
          if (newStats) {
              renderPet(container, newStats);
          } else {
              chrome.storage.local.get('user_stats', (res) => {
                  if (res.user_stats) renderPet(container, res.user_stats);
              });
          }
      }
    }
  });

  // Listen for messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'STATE_UPDATE') {
          renderPet(container, message.stats);
      }
  });

  document.body.appendChild(host);
}

function renderPet(container, stats) {
  if (!stats) return;

  const state = stats.current_state || 'NORMAL';
  const skin = currentSettings.selected_skin || 'white_blob';

  container.innerHTML = '';

  // Speech Bubble
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  container.appendChild(bubble);

  // Pet Image
  const img = document.createElement('img');
  img.className = 'pet-image';

  // Determine image source based on state and skin
  // Construct path: assets/pets/{skin}/{state}.svg
  // Ensure state is lowercase
  let fileName = state.toLowerCase() + '.svg';
  let imgSrc = `assets/pets/${skin}/${fileName}`;

  let messageText = "Hi!";
  let extraClass = "";

  // Helper for insults
  const getInsult = (defaultMsg) => {
      if (currentSettings.custom_insults && currentSettings.custom_insults.length > 0) {
          const idx = Math.floor(Math.random() * currentSettings.custom_insults.length);
          return currentSettings.custom_insults[idx];
      }
      return defaultMsg;
  };

  switch (state) {
    case 'FAT':
      messageText = getInsult("Popcorn!");
      extraClass = 'state-fat';
      break;
    case 'ARROGANT':
      messageText = getInsult("Get a life");
      extraClass = 'state-arrogant';
      break;
    case 'BEGGAR':
      messageText = getInsult("Check balance?");
      extraClass = 'state-beggar';
      break;
    case 'NORMAL':
    default:
      messageText = "Hi!";
      break;
  }

  img.src = chrome.runtime.getURL(imgSrc);

  img.onerror = () => {
      // Fallback if skin/file missing
      console.warn(`Image failed to load: ${imgSrc}`);
      img.src = "";
      img.style.backgroundColor = "magenta";
      img.style.width = "16px";
      img.style.height = "16px";
      img.style.display = "block";
  };

  if (extraClass) {
      container.className = extraClass;
  } else {
      container.className = '';
  }

  if (state === 'NORMAL') {
      img.classList.add('anim-bounce');
  }

  container.appendChild(img);

  container.onclick = () => {
    // If customized, maybe pick another random one on click?
    // For now, keep the one decided at render time or re-pick?
    // Let's re-pick if bad state
    if (state !== 'NORMAL' && currentSettings.custom_insults && currentSettings.custom_insults.length > 0) {
         messageText = getInsult(messageText);
    }

    bubble.textContent = messageText;
    bubble.classList.add('visible');
    setTimeout(() => {
      bubble.classList.remove('visible');
    }, 3000);
  };
}

init();
