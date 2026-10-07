import { getSettings, MODES } from '../shared/settings.js';
import { generate, validateRequest } from './gemini.js';
const ready = chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
const cache = new Map();
let busy = false;
async function handle(message, sender) {
  await ready;
  const settings = await getSettings();
  if (message.type === 'QUILL_GET_STATUS') {
    const {apiKey} = await chrome.storage.local.get('apiKey');
    return {ok:true,settings:{enabled:settings.enabled,autoCheck:settings.autoCheck},hasKey:!!apiKey};
  }
  if (message.type === 'QUILL_OPEN_OPTIONS') { await chrome.runtime.openOptionsPage(); return {ok:true}; }
  if (message.type !== 'QUILL_ANALYZE') return {ok:false,error:'Unknown request.'};
  // Requests originate only from extension pages or the isolated content script on HTTP(S).
  if (sender.tab && !/^https?:\/\//.test(sender.url || '')) throw new Error('This page is unsupported.');
  if (!settings.enabled) throw new Error('Quill is paused. Enable it from the toolbar.');
  validateRequest(message.text,message.mode);
  if (!MODES.includes(message.mode)) throw new Error('Unknown action.');
  const {apiKey} = await chrome.storage.local.get('apiKey');
  if (!apiKey) throw new Error('Add your Gemini API key in Quill settings first.');
  const cacheKey = JSON.stringify([message.text,message.mode,settings.language,settings.model]);
  const cached = cache.get(cacheKey);
  if (cached && Date.now()-cached.time < 300000) return {ok:true,result:cached.result,cached:true};
  const {cooldownUntil = 0} = await chrome.storage.session.get('cooldownUntil');
  if (Date.now() < cooldownUntil) throw new Error('Gemini is cooling down after a quota error. Try again in a minute.');
  if (busy) throw new Error('Another Quill check is running. Please wait.');
  busy = true;
  try {
    const result = await generate({text:message.text,mode:message.mode,settings,apiKey});
    if (cache.size >= 30) cache.delete(cache.keys().next().value);
    cache.set(cacheKey,{time:Date.now(),result});
    return {ok:true,result};
  } catch (error) {
    if (error.quota) await chrome.storage.session.set({cooldownUntil:Date.now()+60000});
    throw error;
  } finally {busy = false;}
}
chrome.runtime.onMessage.addListener((message,sender,reply) => {
  if (sender.id !== chrome.runtime.id || !['QUILL_GET_STATUS','QUILL_ANALYZE','QUILL_OPEN_OPTIONS'].includes(message?.type)) return false;
  handle(message,sender).then(reply).catch(error => reply({ok:false,error:error.message || 'Quill could not process this request.'}));
  return true;
});
chrome.storage.onChanged.addListener((changes,area) => {
  if(area !== 'local' || !(changes.apiKey || changes.settings)) return;
  cache.clear();
  // Trusted-only storage deliberately hides change events from content scripts.
  // Broadcast a public notification instead. No key or stored value is included.
  chrome.tabs.query({}).then(tabs => Promise.allSettled(tabs.map(tab =>
    chrome.tabs.sendMessage(tab.id,{type:'QUILL_STATUS_CHANGED'})
  ))).catch(() => {});
});
