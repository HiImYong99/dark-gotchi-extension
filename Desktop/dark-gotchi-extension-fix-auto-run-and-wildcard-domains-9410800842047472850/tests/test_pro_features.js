import { chrome } from './mock_chrome.js';
import { validateLicense } from '../dark-gotchi/lib/crypto-mini.js';
import { CATEGORIES, EVOLUTION_THRESHOLDS, PET_STATES } from '../dark-gotchi/background/constants.js';

const wait = ms => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log("Starting Pro Features Tests...");

  // 1. License Validation Test
  console.log("Test 1: License Validation");
  const validKey = "DG-PRO-9999";
  const invalidKey = "INVALID-KEY";

  if (await validateLicense(validKey) !== true) throw new Error("Valid key rejected");
  if (await validateLicense(invalidKey) !== false) throw new Error("Invalid key accepted");
  console.log("PASS: License validation logic correct");

  // 2. Shield Logic Test
  console.log("Test 2: Shield Logic (50% reduction)");

  // Reset storage
  chrome.storage.local.data = {};

  // Import background script
  await import('../dark-gotchi/background/background.js');

  // Simulate Install
  if (chrome.runtime.onInstalled.cb) chrome.runtime.onInstalled.cb();
  await wait(50);

  // Enable Shield
  const now = Date.now();
  await chrome.storage.local.set({
      item_state: {
          shield_active: true,
          shield_expiry: now + 24 * 60 * 60 * 1000
      }
  });

  // Simulate Entertainment activity
  chrome.tabs.activeUrl = 'https://www.youtube.com/watch?v=123';

  // Run 10 minutes (normally 600s -> FAT)
  // With Shield: 300s -> NORMAL (since < 600)
  // Wait, FAT threshold is 600s.
  // 10 mins * 30s = 300s.
  // 20 mins * 30s = 600s.

  console.log("Simulating 10 mins of YouTube with Shield...");
  for (let i = 0; i < 10; i++) {
      if (chrome.alarms.onAlarm.cb) {
          await chrome.alarms.onAlarm.cb({ name: 'tracking_alarm' });
      }
      await wait(1);
  }

  let result = await chrome.storage.local.get(['user_stats']);
  const accumulated = result.user_stats.category_times.ENTERTAINMENT;

  if (accumulated !== 300) {
      throw new Error(`Expected 300s accumulation, got ${accumulated}`);
  }

  if (result.user_stats.current_state !== 'NORMAL') {
       throw new Error(`Expected NORMAL state, got ${result.user_stats.current_state}`);
  }
  console.log("PASS: Shield reduced accumulation correctly (300s vs 600s)");

  // 3. Shield Expiry Test
  console.log("Test 3: Shield Expiry");

  // Set expiry to past
  await chrome.storage.local.set({
      item_state: {
          shield_active: true,
          shield_expiry: now - 1000
      }
  });

  // Run 1 minute
  if (chrome.alarms.onAlarm.cb) {
      await chrome.alarms.onAlarm.cb({ name: 'tracking_alarm' });
  }

  result = await chrome.storage.local.get(['item_state', 'user_stats']);

  if (result.item_state.shield_active !== false) {
      throw new Error("Shield did not deactivate after expiry");
  }

  // Accumulation should be full (60s) for this minute?
  // Logic: First checks expiry, deactivates. Then calculates increment.
  // Increment checks shield_active (now false). So 60.
  // Total was 300. +60 = 360.

  if (result.user_stats.category_times.ENTERTAINMENT !== 360) {
       throw new Error(`Expected 360s (300+60), got ${result.user_stats.category_times.ENTERTAINMENT}`);
  }
  console.log("PASS: Shield expired and accumulation returned to normal");

  console.log("All Pro Tests Passed!");
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
