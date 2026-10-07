import { getSettings } from "../shared/settings.js";

// Content scripts receive only public preferences, never raw extension storage.
const storageReady = chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "QUILL_GET_STATUS") return false;
  (async () => {
    await storageReady;
    sendResponse({ ok: true, settings: await getSettings(), stage: "foundation" });
  })().catch(() => sendResponse({ ok: false, error: "Quill settings are unavailable. Reload the extension and page." }));
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  storageReady.catch(console.error);
});
