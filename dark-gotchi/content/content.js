// content/content.js

const HOST_ID = 'dark-gotchi-host';

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

  // Initial Render
  const result = await chrome.storage.local.get(['user_stats']);
  renderPet(container, result.user_stats);

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.user_stats) {
      renderPet(container, changes.user_stats.newValue);
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

  // Clear container content (except the link which is outside container in shadow root, wait...
  // container is child of shadow. link is child of shadow.
  // renderPet clears container. That's fine.)
  container.innerHTML = '';

  // Speech Bubble
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  container.appendChild(bubble);

  // Pet Image
  const img = document.createElement('img');
  img.className = 'pet-image';

  // Determine image source based on state
  let imgSrc = 'assets/pets/normal.svg'; // Default
  let messageText = "Hi!";
  let extraClass = "";

  switch (state) {
    case 'FAT':
      imgSrc = 'assets/pets/fat.svg';
      messageText = "Popcorn!";
      extraClass = 'state-fat';
      break;
    case 'ARROGANT':
      imgSrc = 'assets/pets/arrogant.svg';
      messageText = "Get a life";
      extraClass = 'state-arrogant';
      break;
    case 'BEGGAR':
      imgSrc = 'assets/pets/beggar.svg';
      messageText = "Check balance?";
      extraClass = 'state-beggar';
      break;
    case 'NORMAL':
    default:
      imgSrc = 'assets/pets/normal.svg';
      messageText = "Hi!";
      break;
  }

  img.src = chrome.runtime.getURL(imgSrc);

  // Handle image load error (placeholder)
  img.onerror = () => {
      img.src = ""; // Clear source to avoid loop
      img.style.backgroundColor = "magenta"; // 16x16 placeholder color
      img.style.width = "16px";
      img.style.height = "16px";
      img.style.display = "block";
  };

  // Apply state class to container for CSS rules
  if (extraClass) {
      container.className = extraClass;
  } else {
      container.className = '';
  }

  // Animation for NORMAL state (Exercise motion)
  if (state === 'NORMAL') {
      img.classList.add('anim-bounce');
  }

  container.appendChild(img);

  // Show message on hover or click
  container.onclick = () => {
    bubble.textContent = messageText;
    bubble.classList.add('visible');
    setTimeout(() => {
      bubble.classList.remove('visible');
    }, 3000);
  };
}

// Start
init();
