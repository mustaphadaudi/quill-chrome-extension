# QA — release 0.5.0 with Docs companion 0.1.0

## Executed locally

`npm test`: **17 test groups passed, 0 failed**.

Covered:
- Manifest references, least API permission set, popup/options local asset references, external scripts and syntax of every JavaScript file.
- Empty/oversized/unknown requests, repeated substring occurrence mapping, malformed and overlapping edits, stale-edit rejection, rewrites and deletions.
- REST request structure, API key in header rather than URL, source text preserved in JSON, structured output configuration.
- Quota, denied access, unavailable model, network and unfinished model-output errors using mocked HTTP responses.
- Trusted-only storage configuration, secret-free public status, response caching, foreign-sender rejection and session-backed quota cooldown using a Chrome API mock.
- Selected-passage replacement, guarded undo, stale-result protection and password exclusion by executing the actual editor script in a simulated field environment.

The additional unit group checks that provider HTTP/model/reason diagnostics retain the actionable error while removing the API key and complete source passage, and that Gemini 3 requests retain the recommended temperature.

## Docs companion QA

The combined unit and Chromium suite **passed**: https://github.com/mustaphadaudi/quill-chrome-extension/actions/runs/37609056114. The passing run includes all prior Chrome extension checks plus the complete sidebar workflow with the actual companion server under simulated Google APIs.

Eight additional backend groups execute the complete Apps Script server and generated engine with simulated Docs/cache/formatting/HTTP APIs. They verify current-document-only scopes, generated-engine parity, selected-passage privacy, hidden key/header authentication, direct sequential acceptances, retained suggestions, exact-range text/style undo, dismissed changes excluded from apply-all, guarded rewrites/deletions, quota errors/cooldown, and rejection of changed text, target styles, document identities, tabs, absent/multiple selections and expired sessions.

The Chromium test loads the actual Sidebar.html and connects it to that same server fixture. It exercises settings/key setup, sample connection testing, direct acceptance, remaining suggestions, undo, dismissal/apply-all, key removal and stale-document failure feedback. This simulates the Google service, not a live authorized Apps Script installation. Real Docs selection behaviour, actual formatting API semantics, authorization and model accuracy still require the manual acceptance in docs-companion/README.md.

The first browser run found an invalid sample response in the Google HTTP fixture; its fake connection probe now returns edits matching the sample sentence.

## Browser and live API status

The 0.4.1 Chromium suite **passed**: https://github.com/mustaphadaudi/quill-chrome-extension/actions/runs/37606213199

New regression coverage confirms that pad suggestions and underlines survive sequential acceptances after replacement lengths change; Undo restores the previous suggestion list; dismissed suggestions remain excluded from apply-all; and the website card retains remaining suggestions without another manual check. Unit coverage includes growth, shrinkage, deletion, repeated words, stale-source rejection and unexpected editor transformations. All prior browser checks passed again. The initial browser fixture contained an ambiguous substring suggestion that correctly failed overlap validation; the fixture was corrected before the passing run. Transport is mocked, not a claim about live AI accuracy or real Docs editing.

The 0.4.0 real Chromium extension suite **passed**: https://github.com/mustaphadaudi/quill-chrome-extension/actions/runs/37602217820

Verified red underlines, pointer-hover correction, keyboard-opened hover dismissal, accepting corrections and Undo; live checking and stale-mark removal on typing; rich-text range alignment and formatting; writing-pad hover acceptance; settings save-and-test using the selected model; and provider HTTP errors with the key redacted. The existing exclusion, dynamic field, shadow-root, iframe, pause, persistence and storage-isolation checks also passed.

Browser QA found and fixed hover-card closure during layout notifications, unstable marker rebuilding on unchanged geometry, and the main card closing when a hover correction was clicked. Gemini transport remains mocked: no personal-key success or model writing quality is claimed.

The expanded 0.3.0 Chromium suite **passed**: https://github.com/mustaphadaudi/quill-chrome-extension/actions/runs/37597879869

Verified rich-text correction with formatting retained, native undo, open shadow roots, search inputs, iframe injection, writing-pad checks/undo and a persistent Q on a simulated Docs canvas page. This is fixture-based coverage, not live Google Docs document editing. The prior run below applies to 0.2.0.


Local Chromium could not run because its download failed. The real-extension smoke suite subsequently **passed in GitHub Actions**: https://github.com/mustaphadaudi/quill-chrome-extension/actions/runs/37593394615

Verified in Chromium: injection and card opening; unchanged source before acceptance; mocked Gemini correction and undo; excluded password/email/payment/read-only fields; dynamically added textarea; live popup pause and persistent preferences; Escape/off-screen hiding; raw local storage blocked from the content-script world; only public settings returned; no popup/fixture runtime errors.

Browser QA found and fixed a genuine pause-state bug: trusted-only storage does not broadcast changes to content scripts. The worker now sends a public status-change notification to tabs without exposing stored keys.

Windows Chrome acceptance, intended production websites and a real Gemini API key remain unverified. No real API key was supplied or used. Model writing quality is not established by transport mocks.

## 0.4.0 manual acceptance

After updating files in the same unpacked-extension folder and reloading Chrome extension/pages:
- In settings choose **Use Gemini 3.5 Flash-Lite**, then **Save and test connection**. Read the exact provider error if the test fails. Keep your personal key private.
- In a supported website field, click Q and check writing. Verify red underlines, hover acceptance, dismissal without text changes, and Undo.
- Enable **Live checking** in the Q card. Pause typing, verify new underlines, and verify that further typing removes stale suggestions. Live checks send writing to Google.
- Check a selected passage, wrap/scroll a long textarea, resize the window, and exercise rich text with bold words. Underlines must remain aligned and edits must preserve unrelated formatting.
- In Google Docs, use the writing pad: automatic in-document underlines/edits are still unsupported.

## Prior manual acceptance

1. Load unpacked in Chrome without errors and open settings.
2. Save a personal free-tier key, refresh the fixture page and check its text input.
3. Accept a correction, undo it, dismiss one of multiple suggestions and apply the remaining ones.
4. Select part of a textarea; check/rewrite must modify only that passage.
5. Type while a request is pending; its old result must not be applied.
6. Pause from the popup; the widget must hide, including on existing tabs.
7. Password, email, payment autocomplete and read-only fields must have no widget.
8. Add a dynamic field and scroll/resize; positioning must remain usable.
9. Try a rewrite, a missing/invalid key and an oversized passage. Errors must leave writing unchanged.

## Scope

Standard inputs, textareas and DOM contenteditable editors, including open shadow roots and frames. Google Docs has a persistent writing-pad fallback, NOT automatic canvas text access. Actual third-party sites, a personal API key and native Chrome restricted surfaces are not established as working by simulated fixtures.

## Docs companion 0.1.1 formatting regression

The installed native sidebar reported “Passage formatting changed” before suggestions appeared. The previous guard hashed unsorted attribute objects and raw style-run boundaries. A regression test reproduced the exact failure with unchanged italic, bold and linked text when attribute enumeration order or equivalent boundaries changed.

The fix uses the body-path Text element consistently, sorts attribute keys and merges equal adjacent formatting runs. Genuine link/style mutations still reject stale edits. Added a no-key/no-Gemini **Test document access** probe and visible backend version. Existing script users replace Code.gs and Sidebar.html only; key/settings/scopes remain unchanged.

Local backend/syntax QA passed after the regression initially failed on the old code. Chromium CI also exercises reordered attributes and the new diagnostic before key setup. Live Google Apps Script behaviour, Gemini output quality and in-document acceptance in the user's document are still unverified. This companion does not provide live Docs underlines or word-hover editing.
