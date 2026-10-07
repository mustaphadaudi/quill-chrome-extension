# Quill: current state and focused next steps

The 0.4.1 update fixes a workflow bug: accepting a correction keeps unaffected suggestions and shifts their character offsets, rather than discarding all suggestions. It does not call Gemini again. Manual typing still invalidates existing results. Pad Undo restores the prior suggestion set; website Undo clears suggestions pending a fresh check.

## Current limits

Quill works with DOM-backed text inputs, textareas and contenteditable editors. Existing QA covers controlled fixtures, rather than every production site. Google Docs document text uses canvas rendering and is not supported by these adapters. Its current Q button only opens the writing-pad fallback; this is not a direct Docs integration. Gemini response latency, free-project quotas and model access remain external constraints. AI suggestions can miss mistakes or propose incorrect changes.

## Recommended partial pivot

Keep the existing Chrome extension and Gemini connector. Build a separate personal Docs companion using Google Apps Script with an HTML/CSS sidebar. Google supports document text reads and writes through the Document service. The first milestone should check selected text or an explicitly chosen passage, show suggestions in the sidebar, and apply accepted corrections directly to the document. That removes copy/paste without promising canvas hover underlines. Authorize document access explicitly during installation and test in a disposable real document before using it on important work.

Read access and write access must share a captured document tab and exact passage snapshot. Check that the passage still matches before edits. Account for formatting, repeated words, multi-element selections, concurrent editing, and undo behaviour. Do not use unguarded whole-document replaceAllText for an individual suggestion. None of this companion is implemented yet.

If remaining entirely within the Chrome extension is essential, the Google Docs REST API is an alternative. It needs a separate OAuth setup and Google document-access consent; a Gemini API key does not authorize access to private Docs. Use exact document/tab ranges and requiredRevisionId to reject changed documents. The API alone does not provide our existing DOM underline geometry or active browser selection.

For a later engine improvement, evaluate Harper locally for frequent basic grammar checks while retaining Gemini for style/tone and advanced checks. Its JavaScript module uses a WebAssembly engine, so this adds a bundled WASM dependency to the currently vanilla project. Its documentation labels the package early access. Pin and QA a version before adopting it. This can reduce network latency and Gemini usage, but does not itself solve the Docs editor integration.

## Repository references

- GemType: https://github.com/riponcm/GemType — similar personal-key Gemini extension, Apache-2.0. Useful reference for user flow and quota efficiency. Its own README excludes Google Docs; switching to it would not solve that requirement.
- Harper: https://github.com/Automattic/harper and https://writewithharper.com/docs/harperjs/introduction — English grammar engine and browser-compatible JS/WASM integration. Evaluate coverage and license obligations before reuse.
- LanguageTool browser add-on: https://github.com/languagetool-org/languagetool-browser-addon — the README explicitly calls this the old add-on and recommends a rewritten version. Do not treat this repository as the current production Docs integration.

No third-party code has been copied into Quill for this update. Do not rely on pasted, minified vendor code or another extension's identity as a maintainable Docs integration.

## Primary Google references

- Docs canvas migration: https://workspaceupdates.googleblog.com/2021/05/Google-Docs-Canvas-Based-Rendering-Update.html
- Document editing and custom interfaces: https://developers.google.com/workspace/add-ons/editors/docs
- HTML sidebars: https://developers.google.com/apps-script/guides/dialogs
- Selection APIs: https://developers.google.com/apps-script/reference/document/document
- REST write controls: https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/batchUpdate

Research reviewed 7 October 2026. This is an integration proposal, not a claim that Docs edits, offline checking or canvas underlines have been built or tested.
