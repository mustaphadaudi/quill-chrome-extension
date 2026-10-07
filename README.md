# Quill — personal Chrome writing assistant

Vanilla HTML, CSS and JavaScript. No build step, backend, subscriptions or upgrade prompts.

## Release 0.1.0: Step 1 foundation

Implemented: Manifest V3, background message routing, local enable/disable preference, toolbar popup, original Q icons, and an isolated floating widget with a preview card on text inputs and textareas. Text is neither read nor sent anywhere in this release. The Q indicator means the assistant is available, not that grammar has been checked.

Not yet implemented: Gemini API calls, API key settings, corrections, tone rewrites, undo, contenteditable/rich text, iframes and site-specific integrations. Modules will be added in later working releases rather than populated with placeholder code.

## Install on Windows

1. Extract the archive or clone this repository into a permanent folder.
2. Open `chrome://extensions` in Google Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. Pin Quill from Chrome's extensions menu.
6. Reload any already-open website before testing its text fields.

There is nothing to install with npm. No API key is required for Step 1.

## Test locally

With Python installed, open a terminal in this folder:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/tests/editor-fixture.html`. Focus the input or textarea and click Q. Test the popup switch, the dynamically added textarea, scrolling, and excluded fields. The extension does not run on Chrome internal pages, the Chrome Web Store, or `file://` URLs. Keep the test fixture served over HTTP.

## Development and GitHub

Canonical remote: https://github.com/mustaphadaudi/quill-chrome-extension.git

```powershell
git clone https://github.com/mustaphadaudi/quill-chrome-extension.git
cd quill-chrome-extension
```

Use complete stage commits after QA. Reload the extension and website after pulling changes. Never put an API key in source, README, commits or screenshots. The next release will ask for your key inside extension settings and use a Gemini free-tier project; provider quotas still apply.

## Architecture and permissions

- `background/service-worker.js`: trusted message handler, isolated from website DOM.
- `shared/settings.js`: typed preference access for trusted extension contexts.
- `content/editor.js`: focus-based field discovery and widget positioning.
- `content/widget.js` and `.css`: shadow-root UI with a local stylesheet.
- `popup/`: local controls with external JavaScript (no inline execution).
- `icons/`: original raster icons at Chrome's required sizes.
- `tests/`: reproducible manual fixture and automated QA.

Only `storage` is requested as an API permission. Content scripts match HTTP and HTTPS sites to provide the floating widget; this grants broad site access. No Gemini host permission is needed until the AI stage. Only the widget stylesheet is web-accessible. Storage is restricted to trusted extension contexts, and content scripts receive just the public enabled flag. No analytics, remote scripts, history storage, network requests or billing fallback are implemented.

## QA

See `QA.md` for checks and their actual results. Each stage distinguishes automated checks from a real Chrome manual acceptance test. Gmail, Google Docs, complex editors and correction application are not claimed as supported until separately tested.
