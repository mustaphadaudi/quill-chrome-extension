import {getSettings,saveSettings} from '../shared/settings.js';
const $ = id => document.getElementById(id);
async function keyStatus() {const {apiKey} = await chrome.storage.local.get('apiKey');$('keyStatus').textContent = apiKey ? 'A key is saved on this device.' : 'No key saved yet.';$('remove').disabled = !apiKey;}
try {
  const settings = await getSettings();
  for(const id of ['enabled','autoCheck']) $(id).checked=settings[id];
  for(const id of ['model','language']) $(id).value=settings[id];
  await keyStatus();$('save').disabled=false;
} catch {$('status').textContent='Could not load settings. Reload the extension.';}
$('preferences').addEventListener('submit',async event => {
  event.preventDefault();$('save').disabled=true;
  try {
    const key=$('apiKey').value.trim();
    if(key && /\s/.test(key)) throw new Error('The API key must not contain spaces.');
    await saveSettings({enabled:$('enabled').checked,autoCheck:$('autoCheck').checked,language:$('language').value,model:$('model').value.trim()});
    if(key) await chrome.storage.local.set({apiKey:key});
    $('apiKey').value='';await keyStatus();$('status').textContent='Preferences saved.';
  } catch(error) {$('status').textContent=error.message || 'Could not save settings.';}
  finally {$('save').disabled=false;}
});
$('remove').addEventListener('click',async () => {
  try {await chrome.storage.local.remove('apiKey');$('apiKey').value='';await keyStatus();$('status').textContent='Saved key removed.';}
  catch {$('status').textContent='Could not remove the key.';}
});
