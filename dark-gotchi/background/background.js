import { CATEGORIES, DOMAIN_MAPPING, EVOLUTION_THRESHOLDS, PET_STATES } from './constants.js';

const ALARM_NAME = 'tracking_alarm';

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['user_stats', 'settings', 'pet_profile'], (result) => {
    if (!result.user_stats) {
      const initialStats = {
        current_state: PET_STATES.NORMAL,
        total_distraction_time: 0,
        current_domain: '',
        last_update: Date.now(),
        category_times: {
          [CATEGORIES.ENTERTAINMENT]: 0,
          [CATEGORIES.SOCIAL]: 0,
          [CATEGORIES.SHOPPING]: 0,
          [CATEGORIES.PRODUCTIVE]: 0
        }
      };
      chrome.storage.local.set({ user_stats: initialStats });
    }
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          is_pro: false,
          license_key: "",
          custom_insults: []
        }
      });
    }
    if (!result.pet_profile) {
      chrome.storage.local.set({
        pet_profile: {
          type: "white_blob",
          growth_level: 1,
          shield_used_today: false
        }
      });
    }
  });

  // Create alarm
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
});

// Helper to get category
function getCategory(domain) {
  if (!domain) return CATEGORIES.UNKNOWN;
  // Simple check
  for (const [key, category] of Object.entries(DOMAIN_MAPPING)) {
    if (domain.includes(key)) {
      return category;
    }
  }
  return CATEGORIES.UNKNOWN;
}

// Track active tab updates
async function updateCurrentDomain() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;

        // Update storage
        const result = await chrome.storage.local.get('user_stats');
        if (result.user_stats) {
            const stats = result.user_stats;
            stats.current_domain = domain;
            stats.last_update = Date.now();
            await chrome.storage.local.set({ user_stats: stats });
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    }
  } catch (e) {
    console.error("Error getting active tab:", e);
  }
}

chrome.tabs.onActivated.addListener(updateCurrentDomain);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    updateCurrentDomain();
  }
});

// Alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const result = await chrome.storage.local.get(['user_stats']);
    if (!result.user_stats) return;

    const stats = result.user_stats;
    const now = Date.now();

    // Check for time jump (constraint: > 1 hour)
    if (now - stats.last_update > 60 * 60 * 1000) {
        stats.last_update = now;
        await chrome.storage.local.set({ user_stats: stats });
        return;
    }

    // Determine category of current domain
    // We check the active tab in the last focused window
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    let currentDomain = "";
    if (tab && tab.url) {
         try {
            currentDomain = new URL(tab.url).hostname;
         } catch(e) {}
    }

    stats.current_domain = currentDomain;
    const category = getCategory(currentDomain);

    // Ensure category_times exists
    if (!stats.category_times) {
        stats.category_times = {
          [CATEGORIES.ENTERTAINMENT]: 0,
          [CATEGORIES.SOCIAL]: 0,
          [CATEGORIES.SHOPPING]: 0,
          [CATEGORIES.PRODUCTIVE]: 0
        };
    }

    if (category !== CATEGORIES.UNKNOWN && stats.category_times[category] !== undefined) {
        stats.category_times[category] += 60;
    }

    // Update total distraction time
    if ([CATEGORIES.ENTERTAINMENT, CATEGORIES.SOCIAL, CATEGORIES.SHOPPING].includes(category)) {
        stats.total_distraction_time += 60;
    }

    // Check Evolution Logic
    if (stats.category_times[CATEGORIES.PRODUCTIVE] >= EVOLUTION_THRESHOLDS.PRODUCTIVE) {
        stats.current_state = PET_STATES.NORMAL;
        // Reset counters
        stats.category_times[CATEGORIES.ENTERTAINMENT] = 0;
        stats.category_times[CATEGORIES.SOCIAL] = 0;
        stats.category_times[CATEGORIES.SHOPPING] = 0;
        stats.category_times[CATEGORIES.PRODUCTIVE] = 0;
    } else {
        // Check bad states
        if (stats.category_times[CATEGORIES.ENTERTAINMENT] >= EVOLUTION_THRESHOLDS.ENTERTAINMENT) {
            stats.current_state = PET_STATES.FAT;
        } else if (stats.category_times[CATEGORIES.SOCIAL] >= EVOLUTION_THRESHOLDS.SOCIAL) {
            stats.current_state = PET_STATES.ARROGANT;
        } else if (stats.category_times[CATEGORIES.SHOPPING] >= EVOLUTION_THRESHOLDS.SHOPPING) {
            stats.current_state = PET_STATES.BEGGAR;
        }
    }

    stats.last_update = now;
    await chrome.storage.local.set({ user_stats: stats });

    // Broadcast state change to all tabs (optional but helpful)
    chrome.runtime.sendMessage({
      action: 'STATE_UPDATE',
      state: stats.current_state,
      stats: stats
    }).catch(() => {}); // Ignore error if no listeners
  }
});
