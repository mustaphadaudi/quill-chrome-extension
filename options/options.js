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

$('recommended').addEventListener('click',()=>{$('model').value='gemini-3.5-flash-lite';$('status').textContent='Gemini 3.5 Flash-Lite selected. Click Save and test connection.';});
$('available').addEventListener('change',()=>{if($('available').value)$('model').value=$('available').value;});
$('discover').addEventListener('click',async()=>{
  $('discover').disabled=true;$('status').textContent='Loading models visible to your saved key…';
  try{
    const response=await chrome.runtime.sendMessage({type:'QUILL_LIST_MODELS'});if(!response?.ok)throw new Error(response?.error||'Could not load models.');
    $('available').replaceChildren(new Option('Choose an available model',''));
    for(const model of response.models)$('available').append(new Option(model.name+' ('+model.id+')',model.id));
    $('status').textContent=response.models.length?'Choose a model, save preferences, then test the connection.':'No Flash text models were returned for this key.';
  }catch(error){$('status').textContent=error.message;}finally{$('discover').disabled=false;}
});
$('test').addEventListener('click',async()=>{
  $('test').disabled=true;$('status').textContent='Saving and testing this model with a short sample…';
  try{const key=$('apiKey').value.trim();if(key&&/\s/.test(key))throw new Error('The API key must not contain spaces.');await saveSettings({enabled:$('enabled').checked,autoCheck:$('autoCheck').checked,language:$('language').value,model:$('model').value.trim()});if(key){await chrome.storage.local.set({apiKey:key});$('apiKey').value='';await keyStatus();}const response=await chrome.runtime.sendMessage({type:'QUILL_TEST_CONNECTION'});if(!response?.ok)throw new Error(response?.error||'Test failed.');$('status').textContent='Connected: the saved key and model successfully checked a sample sentence.';}
  catch(error){$('status').textContent=error.message;}finally{$('test').disabled=false;}
});
