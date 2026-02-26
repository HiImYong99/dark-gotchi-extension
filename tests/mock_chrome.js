export const chrome = {
  runtime: {
    onInstalled: {
        addListener: (cb) => { chrome.runtime.onInstalled.cb = cb; },
        sendMessage: async (msg) => { console.log("sendMessage", msg); }
    },
    onMessage: { addListener: (cb) => { chrome.runtime.onMessage.cb = cb; } },
    sendMessage: async (msg) => { console.log("sendMessage", msg); }
  },
  tabs: {
    onActivated: { addListener: (cb) => { chrome.tabs.onActivated.cb = cb; } },
    onUpdated: { addListener: (cb) => { chrome.tabs.onUpdated.cb = cb; } },
    query: async (q) => {
        return [{ url: chrome.tabs.activeUrl || 'https://example.com' }];
    },
    activeUrl: 'https://example.com' // Custom property for testing
  },
  alarms: {
    create: (name, info) => {},
    onAlarm: { addListener: (cb) => { chrome.alarms.onAlarm.cb = cb; } }
  },
  storage: {
    local: {
      data: {},
      get: (keys, cb) => {
        let res = {};
        if (Array.isArray(keys)) keys.forEach(k => res[k] = chrome.storage.local.data[k]);
        else if (typeof keys === 'string') res[keys] = chrome.storage.local.data[keys];
        // handle callback or promise
        const p = Promise.resolve(res);
        if (cb) cb(res);
        return p;
      },
      set: (items, cb) => {
        Object.assign(chrome.storage.local.data, items);
        const p = Promise.resolve();
        if (cb) cb();
        return p;
      }
    }
  }
};
global.chrome = chrome; // Make it global
