export const DEFAULT_SETTINGS = Object.freeze({enabled: true, autoCheck: false, language: 'en-GB', model: 'gemini-2.5-flash-lite'});
export const MODES = Object.freeze(['check', 'clearer', 'concise', 'professional', 'friendly', 'confident']);
export async function getSettings() {
  const {settings = {}} = await chrome.storage.local.get('settings');
  return {
    enabled: typeof settings.enabled === 'boolean' ? settings.enabled : true,
    autoCheck: settings.autoCheck === true,
    language: settings.language === 'en-US' ? 'en-US' : 'en-GB',
    model: /^gemini-[a-z0-9.-]+$/.test(settings.model || '') ? settings.model : DEFAULT_SETTINGS.model
  };
}
export async function saveSettings(settings) {
  const current = await getSettings();
  const next = {...current, ...settings};
  if (typeof next.enabled !== 'boolean' || typeof next.autoCheck !== 'boolean' || !['en-GB','en-US'].includes(next.language) || !/^gemini-[a-z0-9.-]+$/.test(next.model)) throw new Error('Invalid preferences.');
  await chrome.storage.local.set({settings: next});
  return next;
}
export async function setEnabled(enabled) { return saveSettings({enabled}); }
