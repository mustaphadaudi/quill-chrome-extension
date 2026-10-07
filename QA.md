# QA — release 0.4.0

## Executed locally

`node --test tests/core.test.mjs`: **8 test groups passed, 0 failed**.

Covered:
- Manifest references, least API permission set, popup/options local asset references, external scripts and syntax of every JavaScript file.
- Empty/oversized/unknown requests, repeated substring occurrence mapping, malformed and overlapping edits, stale-edit rejection, rewrites and deletions.
- REST request structure, API key in header rather than URL, source text preserved in JSON, structured output configuration.
- Quota, denied access, unavailable model, network and unfinished model-output errors using mocked HTTP responses.
- Trusted-only storage configuration, secret-free public status, response caching, foreign-sender rejection and session-backed quota cooldown using a Chrome API mock.
- Selected-passage replacement, guarded undo, stale-result protection and password exclusion by executing the actual editor script in a simulated field environment.

The additional unit group checks that provider HTTP/model/reason diagnostics retain the actionable error while removing the API key and complete source passage, and that Gemini 3 requests retain the recommended temperature.

## Browser and live API status

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
