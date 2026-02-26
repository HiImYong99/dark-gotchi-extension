import { chrome } from './mock_chrome.js'; // This sets global.chrome
import { CATEGORIES, EVOLUTION_THRESHOLDS, PET_STATES } from '../dark-gotchi/background/constants.js';

// Wait for onInstalled to complete
const wait = ms => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log("Starting Tests...");
  console.log("Mock Chrome initialized.");

  // Import background script
  // It registers listeners immediately
  await import('../dark-gotchi/background/background.js');

  // Simulate Install
  if (chrome.runtime.onInstalled.cb) {
      chrome.runtime.onInstalled.cb();
  } else {
      console.warn("No onInstalled listener found!");
  }
  await wait(50); // Wait for storage init

  // Verify initial state
  let result = await chrome.storage.local.get(['user_stats']);

  if (!result.user_stats) {
      // Maybe wait longer or check if async
      await wait(100);
      result = await chrome.storage.local.get(['user_stats']);
  }

  if (!result.user_stats) throw new Error("Storage not initialized");
  if (result.user_stats.current_state !== 'NORMAL') throw new Error("Initial state failed: " + result.user_stats.current_state);
  console.log("PASS: Initial state is NORMAL");

  // TEST 1: Entertainment (YouTube) -> FAT (10 mins)
  // Set mock active tab
  chrome.tabs.activeUrl = 'https://www.youtube.com/watch?v=123';

  console.log("Simulating 10 mins of YouTube...");
  for (let i = 0; i < 10; i++) {
      if (chrome.alarms.onAlarm.cb) {
          await chrome.alarms.onAlarm.cb({ name: 'tracking_alarm' });
      }
      // Wait a bit if needed (mock storage is sync in my impl but async interface)
      await wait(1);
  }

  result = await chrome.storage.local.get(['user_stats']);
  if (result.user_stats.category_times.ENTERTAINMENT !== 600) {
      throw new Error("Time accumulation failed: " + result.user_stats.category_times.ENTERTAINMENT);
  }

  // Wait, if ENT >= 600, state should be FAT
  if (result.user_stats.current_state !== 'FAT') {
      console.log("Current State:", result.user_stats.current_state);
      console.log("Threshold:", EVOLUTION_THRESHOLDS.ENTERTAINMENT);
      console.log("Accumulated:", result.user_stats.category_times.ENTERTAINMENT);
      throw new Error("Evolution to FAT failed");
  }
  console.log("PASS: Evolved to FAT after 10 mins YouTube");

  // TEST 2: Productive (GitHub) -> NORMAL (30 mins)
  // Change tab to GitHub
  chrome.tabs.activeUrl = 'https://github.com/myrepo';

  console.log("Simulating 30 mins of GitHub...");
  for (let i = 0; i < 30; i++) {
      if (chrome.alarms.onAlarm.cb) {
          await chrome.alarms.onAlarm.cb({ name: 'tracking_alarm' });
      }
      await wait(1);
  }

  result = await chrome.storage.local.get(['user_stats']);
  if (result.user_stats.current_state !== 'NORMAL') {
       console.log("Current State:", result.user_stats.current_state);
       throw new Error("Recovery to NORMAL failed");
  }
  // Verify counters reset
  if (result.user_stats.category_times.ENTERTAINMENT !== 0) throw new Error("Counters reset failed");
  console.log("PASS: Recovered to NORMAL after 30 mins GitHub");

  // TEST 3: Shopping (Coupang) -> BEGGAR (5 mins)
  chrome.tabs.activeUrl = 'https://www.coupang.com/vp/products/123';

  console.log("Simulating 5 mins of Shopping...");
  for (let i = 0; i < 5; i++) {
      if (chrome.alarms.onAlarm.cb) {
          await chrome.alarms.onAlarm.cb({ name: 'tracking_alarm' });
      }
      await wait(1);
  }

  result = await chrome.storage.local.get(['user_stats']);
  if (result.user_stats.current_state !== 'BEGGAR') {
       console.log("Current State:", result.user_stats.current_state);
       throw new Error("Evolution to BEGGAR failed");
  }
  console.log("PASS: Evolved to BEGGAR after 5 mins Shopping");

  console.log("All Tests Passed!");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
