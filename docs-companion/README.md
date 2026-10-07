# Quill for Google Docs — personal companion 0.2.0

A native Google Docs sidebar that checks a selected passage or the paragraph containing your cursor, then applies accepted corrections directly in the document. Vanilla HTML/CSS/JavaScript UI and a Google Apps Script backend. Uses your personal Gemini key. No subscriptions, upgrade prompts, public web app or billing configuration.

This is a separate companion to the Chrome extension. Installing or reloading the Chrome extension does not install the Docs sidebar.

## Install in a personal test document

1. Open a Google document you own. Use a disposable test document for the first run.
2. In **Google Docs**, choose **Extensions → Apps Script**. This creates a script bound to that document. Name the project **Quill Docs Companion**.
3. Replace the default `Code.gs` with the complete contents of [Code.gs](Code.gs).
4. Click **+ → Script** and name it `Engine`. Paste the complete contents of [Engine.gs](Engine.gs). Apps Script adds the `.gs` extension itself.
5. Click **+ → HTML** and name it `Sidebar`. Paste the complete contents of [Sidebar.html](Sidebar.html).
6. Open **Project Settings** in the Apps Script editor. Enable **Show "appsscript.json" manifest file in editor**. Return to the editor and replace that manifest with [appsscript.json](appsscript.json).
7. Save the project. Select **showQuill** from the function dropdown and click **Run** once. Review and authorize your own script's permissions when Google prompts you: this document, the sidebar interface and external API requests. The script contains no Drive-wide scope. If a managed Google account blocks custom scripts, use an account where you can authorize them.
8. Return to Docs and reload it. Choose **Quill → Open writing assistant** from the new top-level menu.
9. In the sidebar's **Gemini settings**, enter your API key and click **Save and test**. It saves the model displayed in the form and checks a sample sentence. Start with `gemini-3.5-flash-lite`, or use a model with generation access and free quota in your Google project. Keep billing disabled for free usage. The Chrome extension's key is not transferred.
10. Select `This are a test sentence.` within one paragraph and click **Check selection**. Accept the proposed correction, then verify that the document changed. Test **Undo last Quill edit**.

**Do not click Deploy or create a public web app.** Neither is needed for this document-bound personal version. No Google Cloud OAuth client ID, Chrome extension ID or separate server is required.

The files are also available from the repository's `docs-companion/` directory after **Code → Download ZIP**. Copy full file contents, without Markdown code fences or the filename, into Apps Script. All four files are required.

## Complete 0.2.0 / Chrome 0.6.0 update

Replace **Code.gs** and **Sidebar.html** in the existing Apps Script project, save and reopen the sidebar. Keep Engine.gs and appsscript.json unchanged. Replace the Chrome extension directory with the complete 0.6.0 build and reload it in chrome://extensions. **Reload the Google Docs page**: canvas observation must start before Docs paints its text. The sidebar footer must read **Quill Docs 0.2.0** and Chrome must show **0.6.0**.

Open **Inline corrections · Chrome** in the sidebar and enable **Show red inline markers**. Check a selection or paragraph. Hover or click a marked word to Accept or Dismiss; the action goes through the sidebar's guarded Apps Script editing functions. Remaining suggestions are rebased without another AI call. The card offers Undo after an edit when another suggestion is available; sidebar Undo remains available even after resolving the last suggestion.

Optional **Check current paragraph after typing** checks the paragraph at the cursor after a 1.8-second typing pause. This sends the current paragraph to Gemini and consumes its quota. Both inline and live preferences default off and are saved per script/user. Keep the sidebar open. Manual checks and editing still work if inline mapping is unavailable.

The local overlay observes Canvas 2D text draws, transforms, clear/repaint operations and canvas image copies. A fixed transparent canvas draws red waves; focusable hit regions open the correction card. Markers use actual canvas bounds, measured text prefixes and canvas-to-CSS scaling, and are recalculated on scroll, zoom/resize, DOM layout changes, font loading and repaint. Scrolling alone never calls Gemini. Draw data stays in bounded page memory and is not sent to Gemini. No Google internals are edited or vendor extension IDs spoofed.

**Renderer-dependent experimental integration:** real Docs may draw text in workers, as glyph images/paths, or through inaccessible render surfaces. Those renderers are not supported by this observer. The checked Text element must be uniquely identifiable in the active tab body and fully represented in captured draw runs. Repeated paragraphs, ambiguous/missing matches, clipped words, rotated or right-to-left runs hide markers and show a sidebar explanation. Partially visible long paragraphs may need more of the paragraph rendered before mapping succeeds. A document-tab switch must be followed by a fresh check. This is not a claim of universal Grammarly compatibility.

The frame bridge allows only accept/dismiss/undo and explicitly enabled live checks. It is scoped to the same Chrome tab, document ID and frame/document IDs; it carries checked paragraph text, suggestions and a temporary check token, never your key. Routing metadata is held in Chrome session storage and removed on tab close. Sidebar closure/disconnection removes markers within 45 seconds; turning inline off removes them immediately. A personal document's script editors remain trusted, as described below.

Quick verification:

1. Enable inline markers, check a short uniquely worded paragraph containing `This are a test sentence.` and confirm the sidebar reports a mapped suggestion.
2. Hover/click **are**, accept **is**, and inspect the actual document. Try Undo from the sidebar or a remaining-error hover card.
3. Check a paragraph with several mistakes, accept the first and confirm the remaining red markers move to their corrected offsets without rechecking.
4. Scroll the Docs editor, resize Chrome, change Docs zoom, and wait for any repaint. Markers must move with the words; the card must remain next to its target or close when the target disappears.
5. Type with live checking off: markers must disappear and no new check starts. Enable live checking, type in a paragraph, pause and confirm the paragraph is rechecked.
6. Duplicate the exact paragraph elsewhere in the active tab: the sidebar must explain that inline matching is ambiguous; corrections remain available in the sidebar. Clear/replace rendered text or switch tabs; stale hover edits must not silently apply.
7. Disable inline markers or pause the Chrome extension: markers disappear. Close/reopen the sidebar and verify reconnection. If **No canvas text captured** persists after a full Docs reload, use sidebar edits and report that exact status; the renderer cannot be treated as supported.

Automated QA uses the real extension and real canvas drawing with a cross-origin sidebar fixture and simulated DocumentApp/Gemini. It does not establish compatibility with your live Docs renderer or real AI output.

## Update from 0.1.0 (formatting error fix)

In your **existing** document-bound Apps Script project, replace the complete contents of **Code.gs** and **Sidebar.html** with the versions in this directory. Save, close the Docs sidebar and reopen it from **Quill → Open writing assistant**. The footer must show **Quill Docs 0.1.1**. Engine.gs, appsscript.json and your saved key do not need changing. No deployment is needed.

Select a short passage or put the cursor in a paragraph, then click **Test document access**. This reads the passage and verifies stable formatting without a Gemini request or any document edit. A success here confirms read access only. Next check `This are a test sentence.`, accept the correction and verify the actual document changes, then try Undo.

This update fixes a false “Passage formatting changed” rejection caused by comparing the serialization order of attribute objects and equivalent formatting runs. Formatting is now captured through the same body path used for editing, with sorted attribute keys and merged adjacent equivalent runs. Actual style changes still require rechecking. Automated tests reproduce the old error and verify sequential edits, Undo and stale-style rejection after the fix. Live Google Docs acceptance still needs verification in your document.

## Use

- **Test document access** checks passage read access without requiring a key or calling Gemini. It preserves the current suggestions and does not edit the document.
- **Check selection** reads only the selected text.
- **Check paragraph** reads the text of the paragraph containing your cursor. Click inside the paragraph first.
- **Rewrite selection** proposes a rewrite without changing the document. **Apply rewrite in Docs** applies it explicitly.
- **Accept**, **Dismiss** and **Apply all in Docs** operate on the current suggestions. Remaining suggestions stay available after accepting one, with adjusted positions and no additional Gemini request.
- **Undo last Quill edit** restores the preceding text and formatting for that edit, along with its suggestions. It is a single-level companion undo and is disabled after use.
- **Clear check** deletes the temporary server-side check state without changing the document.
- After manually changing document text or the checked passage's formatting, check again. Results are tied to the original document and tab; changing tabs prevents application.

For another document, attach the same files to that document, or make a copy of a template document containing the bound script. Google copies its bound script with the document. Each script project has its own settings/key and requires authorization. This first version is not an install-once Marketplace add-on for every document.

## First-version scope

The capture must resolve to one actual Docs Text element, normally a single paragraph or a selected portion of it. Paragraphs with several text elements, multi-paragraph selections, headers, footnotes and complex embedded objects are rejected with a message rather than flattened. A paragraph or list item with one Text child can be checked; text inside a table cell can be selected if it resolves to a supported Text element in the document body.

The passage limit is 12,000 characters. The full containing text element is limited to 24,000 characters, and heavily formatted state exceeding the cache budget is rejected before edits. Paragraph-break insertion and multi-paragraph rewrites are not supported. A replacement inherits the formatting of the first replaced character; formatting outside that exact range is retained. Undo restores the original styles within the changed ranges.

The Chrome 0.6.0 overlay adds renderer-dependent inline markers, hover cards and optional debounced current-paragraph checks as described above. Whole-document scanning and multi-paragraph corrections are not implemented. Sidebar-only installation does not install the Chrome overlay.

Before applying or undoing, the server checks the document identity, active tab, body-text fingerprint, target node text and target formatting. A script lock serializes companion actions, but does **not** lock out human collaborators or make multiple Apps Script edits an atomic transaction. Avoid concurrent typing while applying changes. If a write fails midway, the UI asks you to review the document; some changes may already have been applied. Live Docs acceptance and undo behaviour must be verified before relying on it for important work.

## Key and text handling

Your key is stored in Apps Script **user properties** for this script project. It is never returned to the sidebar or placed in the API URL. Model/settings responses expose only whether a key is present. Provider errors remove the saved key and complete source passage before displaying diagnostics. Keep keys out of project source, GitHub and chat.

Use the companion in a personal document whose script you control. Editors of a shared bound document can edit its script; a modified script could misuse credentials when you next run it. This is not credential isolation from other script editors.

Only the chosen passage is sent to Gemini. The script reads the active document tab's body text locally within Apps Script to compute a change-detection fingerprint; it does not send the body to Gemini. A limited snapshot, suggestions and one undo record are cached per user for **up to 30 minutes**. Google may evict cache entries earlier. Expiration means you must check again. No permanent document history, analytics, access token storage or user-content logging is implemented. Apps Script and Gemini quotas still apply; this companion cannot guarantee unlimited free usage.

The explicit scopes are `documents.currentonly`, `script.container.ui` and `script.external_request`. The external-request scope authorizes the Gemini call. The companion does not import or change the Chrome extension's storage or permissions.

## QA

Run `npm test` from the repository root. The backend suite executes the actual `.gs` files against simulated Google Document, cache, formatting and HTTP APIs. The Chromium suite loads the actual sidebar and connects it to that same tested backend fixture. This verifies product wiring without a Google login, real key or quota expenditure. It does not establish live Apps Script installation, actual Docs selection behaviour or AI accuracy.

Manual acceptance after installation:

1. Save/test a free-project key; a failed model/key/quota call must leave document text unchanged.
2. Select only part of a paragraph, check it and accept one correction; the prefix/suffix must stay unchanged.
3. Accept several corrections of different lengths without rechecking; the remaining suggestions must still target the correct words.
4. Dismiss one correction and apply all; the dismissed correction must not be applied.
5. Use bold/italic/link styling around the corrected word; inspect the result and companion Undo.
6. Edit text elsewhere in the active tab, change the checked passage's formatting, or switch document tabs; old corrections and Undo must reject the changed state.
7. Check a paragraph, a repeated word, a deletion and a selected rewrite. Check multi-paragraph selection rejection and an expired check.

`Engine.gs` is generated from the Chrome extension's prompt/schema, validators and offset-update helper. After changing those shared sources, run `node scripts/build-docs-companion.mjs` and copy the updated Engine into Apps Script. QA verifies that this generated file is current.

Official references: https://developers.google.com/apps-script/guides/bound · https://developers.google.com/apps-script/guides/dialogs · https://developers.google.com/apps-script/reference/document/document · https://developers.google.com/apps-script/reference/document/text · https://developers.google.com/apps-script/reference/cache/cache
