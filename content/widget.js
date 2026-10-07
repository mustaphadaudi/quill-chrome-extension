(() => {
  const host = document.createElement("div");
  host.setAttribute("data-quill-widget", "");
  // The shadow root protects the controls from ordinary website CSS.
  host.style.cssText = "all:initial!important;position:fixed!important;z-index:2147483647!important;display:none!important;";
  const root = host.attachShadow({ mode: "closed" });
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = chrome.runtime.getURL("content/widget.css");
  const button = document.createElement("button");
  button.className = "indicator";
  button.type = "button";
  button.textContent = "Q";
  button.setAttribute("aria-label", "Open Quill writing assistant");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "quill-card");
  const card = document.createElement("section");
  card.id = "quill-card";
  card.hidden = true;
  card.setAttribute("aria-label", "Quill writing assistant");
  const heading = document.createElement("h2");
  heading.textContent = "Meet your writing assistant";
  const description = document.createElement("p");
  description.textContent = "Quill is connected to this field. Grammar, spelling and tone suggestions arrive with the Gemini integration in Step 2.";
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = "Foundation preview · No text is sent";
  const close = document.createElement("button");
  close.className = "close";
  close.type = "button";
  close.textContent = "Close";
  card.append(heading, description, badge, close);
  root.append(css, card, button);
  const setOpen = (open) => {
    card.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  };
  button.addEventListener("click", () => setOpen(card.hidden));
  close.addEventListener("click", () => { setOpen(false); button.focus(); });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { setOpen(false); button.focus(); }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!event.composedPath().includes(host)) setOpen(false);
  }, true);
  globalThis.QuillWidget = {
    show(rect) {
      if (!host.isConnected) document.documentElement.append(host);
      const visible = rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth && rect.width > 0 && rect.height > 0;
      if (!visible) { this.hide(); return; }
      const x = Math.min(Math.max(8, rect.right - 40), Math.max(8, innerWidth - 44));
      const y = Math.min(Math.max(8, rect.bottom - 40), Math.max(8, innerHeight - 44));
      host.style.setProperty("left", `${x}px`, "important");
      host.style.setProperty("top", `${y}px`, "important");
      host.style.setProperty("display", "block", "important");
      const width = Math.min(300, Math.max(100, innerWidth - 16));
      card.style.width = `${width}px`;
      card.style.left = `${Math.max(8, Math.min(x + 36 - width, innerWidth - width - 8)) - x}px`;
      card.classList.toggle("below", y < 210);
    },
    hide() { host.style.setProperty("display", "none", "important"); setOpen(false); },
    owns(element) { return element === host; }
  };
})();
