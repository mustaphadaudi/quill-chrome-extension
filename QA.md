# QA — release 0.2.0

## Executed locally

`node --test tests/core.test.mjs`: **6 test groups passed, 0 failed**.

Covered:
- Manifest references, least API permission set, popup/options local asset references, external scripts and syntax of every JavaScript file.
- Empty/oversized/unknown requests, repeated substring occurrence mapping, malformed and overlapping edits, stale-edit rejection, rewrites and deletions.
- REST request structure, API key in header rather than URL, source text preserved in JSON, structured output configuration.
- Quota, denied access, unavailable model, network and unfinished model-output errors using mocked HTTP responses.
- Trusted-only storage configuration, secret-free public status, response caching, foreign-sender rejection and session-backed quota cooldown using a Chrome API mock.
- Selected-passage replacement, guarded undo, stale-result protection and password exclusion by executing the actual editor script in a simulated field environment.

## Browser and live API status

Local Chromium launch could not run: its browser binary was absent and the browser download failed. This is **not** a browser test pass. GitHub Actions is configured to run the real-extension smoke suite with mocked Gemini transport; consult the latest workflow result for its status.

Windows Chrome acceptance, intended production websites and a real Gemini API key remain unverified. No real API key was supplied or used. Model writing quality is not established by transport mocks.

## Manual acceptance

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

Standard inputs and textareas only; rich text, iframes, inline underlines and site-specific editor integrations are future work.
