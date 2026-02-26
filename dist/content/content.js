const HOST_ID = 'dark-gotchi-host';
let currentSettings = {
    selected_skin: 'white_blob',
    custom_insults: []
};
let currentStats = null;
async function init() {
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
  const result = await chrome.storage.local.get(['user_stats', 'settings']);
  if (result.settings) {
      currentSettings = result.settings;
  }
  if (result.user_stats) {
      currentStats = result.user_stats;
  }
  renderPet(container, currentStats);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      let needsRender = false;
      if (changes.settings) {
          currentSettings = changes.settings.newValue;
          needsRender = true;
      }
      if (changes.user_stats) {
          currentStats = changes.user_stats.newValue;
          needsRender = true;
      }
      if (needsRender && currentStats) {
          if ('requestIdleCallback' in window) {
              requestIdleCallback(() => renderPet(container, currentStats));
          } else {
              requestAnimationFrame(() => renderPet(container, currentStats));
          }
      }
    }
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'STATE_UPDATE') {
          currentStats = message.stats;
          renderPet(container, currentStats);
      }
  });
  document.addEventListener('visibilitychange', () => {
      const img = container.querySelector('.pet-image');
      if (!img) return;
      if (document.hidden) {
          img.classList.remove('anim-bounce');
      } else {
          if (currentStats && currentStats.current_state === 'NORMAL') {
              img.classList.add('anim-bounce');
          }
      }
  });
  document.body.appendChild(host);
}
function renderPet(container, stats) {
  if (!stats) return;
  const state = stats.current_state || 'NORMAL';
  const skin = currentSettings.selected_skin || 'white_blob';
  container.innerHTML = '';
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  container.appendChild(bubble);
  const img = document.createElement('img');
  img.className = 'pet-image';
  let fileName = state.toLowerCase() + '.svg';
  let imgSrc = `assets/pets/${skin}/${fileName}`;
  let messageText = "Hi!";
  let extraClass = "";
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
  if (state === 'NORMAL' && !document.hidden) {
      img.classList.add('anim-bounce');
  }
  container.appendChild(img);
  container.onclick = () => {
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
