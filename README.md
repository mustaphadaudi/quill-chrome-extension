# Quill — personal Chrome writing assistant

Vanilla HTML, CSS and JavaScript, loaded directly as an unpacked Chrome extension. No build step, backend, subscriptions or upgrade prompts.

## Install

1. Download this repository with **Code → Download ZIP**, or clone it:
   ```powershell
   git clone https://github.com/mustaphadaudi/quill-chrome-extension.git
   ```
2. Extract it into a permanent folder.
3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the folder containing `manifest.json`.
4. Pin Quill from Chrome's extension menu. Open Quill → **Open settings**.
5. Create a personal Gemini API key at https://aistudio.google.com/apikey using a free-tier project with billing disabled. Save it in Quill settings. Do not paste it into source code, GitHub or chat.
6. Click **Use Gemini 3.5 Flash-Lite**, then **Save and test connection**. Older 2.5 models can be restricted for new projects. If this fails, Quill now shows the HTTP status, selected model and Google error message with the key redacted. For other models, click **Load available models**, choose a Flash text model with free quota in your project, save preferences, then click **Test saved connection**. A successful model listing alone does not prove generation access or free quota.
7. Reload the website you want to use. Focus a text input or textarea and click the green Q. Enable **Live checking** in the card for automatic checks, or click **Check writing**. Hover over the red underlined text to accept or dismiss a suggestion.

No npm or Python installation is required to use the extension. Update by replacing files in the SAME existing extension folder (or pulling changes), clicking Reload on the extension card, and reloading your website. Keeping the folder preserves the unpacked extension identity and its saved settings. Do not remove/reinstall it just to update.

## Included in 0.4.0

- Floating indicator and a clean shadow-root suggestion card.
- Red underlines on checked suggestions, hover cards, and keyboard-accessible accept/dismiss without adding markup to your editor.
- Visible Live checking switch in the Q card. Enable it to check after typing pauses. Underlines appear only after a successful Gemini check.
- Spelling, grammar and useful style suggestions with explanations.
- Individual accept/dismiss and apply-all for remaining suggestions.
- Clearer, concise, professional, friendly and confident rewrites.
- Tone summary and British/American English preferences.
- Selection-aware checking: select a passage in the field to check just that passage; otherwise the full field is checked.
- Undo for the last Quill edit, guarded against intervening changes.
- Optional automatic checks after a 1.6-second pause. Manual checking is the default.
- Local settings, a configurable Gemini model ID, temporary response caching, one active API request, and cooldown after quota errors.
- Key restricted to trusted extension contexts. Website content scripts receive only public flags.

The default model is `gemini-3.5-flash-lite`, currently listed with free-tier text input/output. Availability and quotas depend on your Google project and may change. Quill does not enable billing, retry indefinitely, or switch models automatically. If you use a billed Google project, Google may charge according to that project's settings. Free projects may stop accepting requests when quota is exhausted.

Google now restricts 2.5 model access for new projects: https://ai.google.dev/gemini-api/docs/deprecations. The new default is listed with free text input/output at https://ai.google.dev/gemini-api/docs/pricing. An existing saved model is preserved until you explicitly select and save another one. The connection test saves the settings shown in the form before sending its sample request.

## Supported fields and limitations

This release supports ordinary text/search inputs, textareas and contenteditable rich-text editors on HTTP/HTTPS pages, including dynamically added fields, open shadow roots and embedded frames. Rich-text corrections replace exact ranges and preserve formatting outside those ranges; rewrites can change formatting within the selected passage. Native editor behaviour varies, and production sites remain subject to separate acceptance testing. It excludes passwords, email input types, read-only/disabled fields and common password/payment/login autocomplete values. Those filters are not a complete sensitive-data detector: you choose which writing to send.

Google Docs document text is canvas-rendered, not a normal editable DOM field. On Docs, Quill shows a persistent Q button with an **Open writing pad** action. Copy a passage from Docs into the pad, check or rewrite it, then copy the result back. Automatic in-document checking or application in Google Docs is NOT implemented; the dictionary search box is not a document integration. Closed shadow roots and site-specific Gmail/Teams integrations remain future work. Red underlines work on supported DOM fields and in the writing pad; they do not cover canvas text in Docs. Chrome internal pages and the Chrome Web Store do not allow injection. Quill does not run on `file://` pages. Chrome New Tab and the browser address bar are protected Chrome UI and cannot host this content-script widget; the toolbar writing pad is available instead. Some websites can also interfere with injected UI or programmatic edits; test on your intended sites before relying on it.

Checks are limited to 12,000 characters per request; oversized text is rejected without truncation. Text changing during a check invalidates the result. A single accepted edit clears the other suggestions to avoid using outdated positions; check again afterward. Dismissed suggestions are excluded from apply-all. Undo never overwrites writing that changed after an edit. AI suggestions require your review.

## Privacy and permissions

Checks send the chosen text to Google's Gemini API. The extension has no analytics or saved document history. A bounded cache keeps recent requests in background-worker memory and reuses identical results for five minutes; it is cleared when settings/key change or the worker ends. The API key lives in local Chrome extension storage, which is not encrypted and must not be considered protection from someone with access to your device/profile.

The `storage` permission persists preferences. HTTP/HTTPS content-script matches let the widget appear on websites. The only API host permission is `https://generativelanguage.googleapis.com/*`. Only the widget stylesheet is web-accessible. All executable extension code is local, and model text is rendered with `textContent`.

## Project structure

- `manifest.json`: Manifest V3, permissions and entry points.
- `background/service-worker.js`: trusted messages, cache and quota cooldown.
- `background/gemini.js`: REST transport, request/response validation and edit validation.
- `background/prompts.js`: structured JSON schema and editing instructions.
- `content/adapters.js`: editable-field resolution, rich-text serialization, DOM ranges and native undo.
- `content/editor.js`: field discovery, selections, safe application and undo.
- `content/highlights.js`: measured underline overlay, hover cards and safe accept/dismiss.
- `content/widget.js`, `content/widget.css`: floating UI and suggestion card.
- `shared/settings.js`: validated local preferences.
- `popup/`: toolbar controls.
- `options/`: personal API key, model discovery, connection test and writing settings.
- `workbench/`: paste/check/rewrite/copy pad for Docs and unsupported editors.
- `icons/`: original Q icons in Chrome's required sizes.
- `tests/`: unit tests, extension browser smoke test and a field fixture.
- `.github/workflows/qa.yml`: automated QA for changes.

## QA and development

With Node.js 22+ installed, run unit QA (no dependencies needed):

```powershell
node --test tests/core.test.mjs
```

For the actual Chromium extension smoke test:

```powershell
npm install
npx playwright install chromium
npm run test:browser
```

The browser test mocks Gemini inside its isolated test profile. It never uses a real API key or spends quota. Live API validation is a separate acceptance check.

To open the manual fixture using Python:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8765/tests/editor-fixture.html`. Test a check, an individual suggestion, dismissal then apply-all, selected text, rewrite, undo, popup pause, dynamically added fields, excluded fields and scrolling.

Each development stage should be committed after its focused QA. See `QA.md` for actual results and outstanding checks. GitHub Actions repeats unit and browser tests on pushes and pull requests.

Official references: https://ai.google.dev/gemini-api/docs/pricing · https://ai.google.dev/gemini-api/docs/structured-output · https://developer.chrome.com/docs/extensions/reference/api/storage
