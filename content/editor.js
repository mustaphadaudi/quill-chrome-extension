(() => {
  let active = null;
  let enabled = false;
  let pendingFrame = 0;
  let statusRequest = 0;

  function supported(element) {
    if (!(element instanceof HTMLElement) || element.disabled || element.readOnly || element.closest("[inert]")) return false;
    // Step 1 supports plain fields only. Passwords and personal-data input types are excluded.
    return element instanceof HTMLTextAreaElement || (element instanceof HTMLInputElement && element.type === "text" && !/password|cc-|one-time-code|email|tel/i.test(element.autocomplete));
  }

  function reposition() {
    pendingFrame = 0;
    if (!enabled || !active?.isConnected || !supported(active)) { globalThis.QuillWidget.hide(); return; }
    globalThis.QuillWidget.show(active.getBoundingClientRect());
  }

  function schedule() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(reposition);
  }

  async function refreshStatus() {
    const request = ++statusRequest;
    try {
      const response = await chrome.runtime.sendMessage({ type: "QUILL_GET_STATUS" });
      if (request !== statusRequest) return;
      enabled = response?.ok === true && response.settings?.enabled === true;
    } catch { enabled = false; }
    schedule();
  }

  document.addEventListener("focusin", (event) => {
    if (globalThis.QuillWidget.owns(event.target)) return;
    active = supported(event.target) ? event.target : null;
    schedule();
    refreshStatus();
  });
  document.addEventListener("pointerdown", (event) => {
    if (globalThis.QuillWidget.owns(event.target) || event.target === active) return;
    active = null;
    schedule();
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !globalThis.QuillWidget.owns(event.target)) globalThis.QuillWidget.hide();
  });
  window.addEventListener("scroll", schedule, true);
  window.addEventListener("resize", schedule);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) globalThis.QuillWidget.hide(); else refreshStatus();
  });
  // Only the public settings key triggers a refresh; the background worker sanitises its response.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) refreshStatus();
  });
  active = supported(document.activeElement) ? document.activeElement : null;
  refreshStatus();
})();
