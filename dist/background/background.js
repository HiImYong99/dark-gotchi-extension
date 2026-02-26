import { CATEGORIES, DOMAIN_MAPPING, EVOLUTION_THRESHOLDS, PET_STATES } from './constants.js';
const ALARM_NAME = 'tracking_alarm';
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['user_stats', 'settings', 'pet_profile', 'item_state'], (result) => {
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
        },
        top_distractions: {} 
      };
      chrome.storage.local.set({ user_stats: initialStats });
    }
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          is_pro: false,
          license_key: "",
          custom_insults: [],
          selected_skin: "white_blob"
        }
      });
    } else if (!result.settings.selected_skin) {
      const newSettings = { ...result.settings, selected_skin: "white_blob" };
      chrome.storage.local.set({ settings: newSettings });
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
    if (!result.item_state) {
      chrome.storage.local.set({
        item_state: {
          shield_active: false,
          shield_expiry: 0
        }
      });
    }
    if (!result.domain_mapping) {
      chrome.storage.local.set({ domain_mapping: DOMAIN_MAPPING });
    }
  });
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
});
function getCategory(domain, mapping) {
  if (!domain || !mapping) return CATEGORIES.UNKNOWN;
  for (const [key, category] of Object.entries(mapping)) {
    if (domain.includes(key)) {
      return category;
    }
  }
  return CATEGORIES.UNKNOWN;
}
async function updateCurrentDomain() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;
        const result = await chrome.storage.local.get('user_stats');
        if (result.user_stats) {
          const stats = result.user_stats;
          stats.current_domain = domain;
          stats.last_update = Date.now();
          await chrome.storage.local.set({ user_stats: stats });
        }
      } catch (e) {
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
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const result = await chrome.storage.local.get(['user_stats', 'item_state', 'pet_profile', 'domain_mapping']);
    if (!result.user_stats) return;
    const mapping = result.domain_mapping || DOMAIN_MAPPING;
    const stats = result.user_stats;
    let itemState = result.item_state || { shield_active: false, shield_expiry: 0 };
    let petProfile = result.pet_profile || { shield_used_today: false };
    const now = Date.now();
    const lastDate = new Date(stats.last_update);
    const currentDate = new Date(now);
    if (lastDate.getDate() !== currentDate.getDate() || lastDate.getMonth() !== currentDate.getMonth()) {
      if (petProfile.shield_used_today) {
        petProfile.shield_used_today = false;
        await chrome.storage.local.set({ pet_profile: petProfile });
      }
    }
    if (itemState.shield_active && itemState.shield_expiry < now) {
      itemState.shield_active = false;
      await chrome.storage.local.set({ item_state: itemState });
    }
    if (now - stats.last_update > 60 * 60 * 1000) {
      stats.last_update = now;
      await chrome.storage.local.set({ user_stats: stats });
      return;
    }
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    let currentDomain = "";
    if (tab && tab.url) {
      try {
        currentDomain = new URL(tab.url).hostname;
      } catch (e) { }
    }
    stats.current_domain = currentDomain;
    const category = getCategory(currentDomain, mapping);
    if (!stats.category_times) {
      stats.category_times = {
        [CATEGORIES.ENTERTAINMENT]: 0,
        [CATEGORIES.SOCIAL]: 0,
        [CATEGORIES.SHOPPING]: 0,
        [CATEGORIES.PRODUCTIVE]: 0
      };
    }
    let increment = 60;
    if (itemState.shield_active && [CATEGORIES.ENTERTAINMENT, CATEGORIES.SOCIAL, CATEGORIES.SHOPPING].includes(category)) {
      increment = 30;
    }
    if (category !== CATEGORIES.UNKNOWN && stats.category_times[category] !== undefined) {
      stats.category_times[category] += increment;
    }
    if ([CATEGORIES.ENTERTAINMENT, CATEGORIES.SOCIAL, CATEGORIES.SHOPPING].includes(category)) {
      stats.total_distraction_time += 60;
      if (currentDomain) {
        stats.top_distractions = stats.top_distractions || {};
        stats.top_distractions[currentDomain] = (stats.top_distractions[currentDomain] || 0) + 1;
      }
    }
    if (stats.category_times[CATEGORIES.PRODUCTIVE] >= EVOLUTION_THRESHOLDS.PRODUCTIVE) {
      stats.current_state = PET_STATES.NORMAL;
      stats.category_times[CATEGORIES.ENTERTAINMENT] = 0;
      stats.category_times[CATEGORIES.SOCIAL] = 0;
      stats.category_times[CATEGORIES.SHOPPING] = 0;
      stats.category_times[CATEGORIES.PRODUCTIVE] = 0;
    } else {
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
    chrome.runtime.sendMessage({
      action: 'STATE_UPDATE',
      state: stats.current_state,
      stats: stats
    }).catch((err) => {
    });
  }
});
