import { getSettings, setEnabled } from "../shared/settings.js";

const enabled = document.getElementById("enabled");
const status = document.getElementById("status");

try {
  enabled.checked = (await getSettings()).enabled;
  enabled.disabled = false;
  status.textContent = "Settings stay on this device.";
} catch {
  status.textContent = "Unable to load settings. Reload the extension.";
}

enabled.addEventListener("change", async () => {
  const previous = !enabled.checked;
  enabled.disabled = true;
  try {
    await setEnabled(enabled.checked);
    status.textContent = enabled.checked ? "Quill is enabled. Focus a text field to see it." : "Quill is paused.";
  } catch {
    enabled.checked = previous;
    status.textContent = "Could not save your preference. Please try again.";
  } finally {
    enabled.disabled = false;
  }
});

document.getElementById("settings").addEventListener("click",()=>chrome.runtime.openOptionsPage());

document.getElementById('pad').addEventListener('click',()=>chrome.runtime.sendMessage({type:'QUILL_OPEN_PAD'}));
