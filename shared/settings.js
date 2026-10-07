export const DEFAULT_SETTINGS = Object.freeze({ enabled: true });

export async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return { enabled: typeof settings?.enabled === "boolean" ? settings.enabled : DEFAULT_SETTINGS.enabled };
}

export async function setEnabled(enabled) {
  if (typeof enabled !== "boolean") throw new TypeError("Enabled must be a boolean.");
  const settings = { enabled };
  await chrome.storage.local.set({ settings });
  return settings;
}
