# Dictate development backlog — clean-slate relaunch

## Stage 0 — groundwork
- [x] Preserve legacy Quill code on main by creating relaunch/clean-slate-v1.
- [x] Record product brief and agent rules.
- [x] Approve product name: Dictate.
- [ ] Complete trademark/domain checks; name approval does not claim clearance or availability.
- [x] Record approved high-level brand direction in [BRAND.md](BRAND.md).
- [x] Establish [visual-asset handoff specifications](../../assets/brand/README.md); no final artwork yet.
- [x] Select A+D hybrid: Supreme Editor character for marketing/onboarding and crowned fountain-pen nib emblem for logo/icon; visual mockups approved as direction only.
- [ ] Transfer the approved reference image and record provenance in the existing asset inventory; transcribe shown preliminary hex values and verify before locking tokens.
- [x] Draft UX flows and interactions for onboarding/consent, inline check/accept/dismiss/undo, popup/settings and loading/empty/error states in [DESIGN.md](DESIGN.md).
- [ ] Review proposed interaction defaults in DESIGN.md; draft completion is not behaviour approval.
- [x] Create editable Figma review 01: twelve screens, 29 prototype actions and a repository review-sheet export linked from DESIGN.md.
- [ ] User reviews the mockups and records look/flow changes or approval; do not infer approval from requesting design work.
- [ ] Approve final UI direction, basic user flows, palette tokens, typography and microcopy boundaries using [DESIGN.md](DESIGN.md).
- [ ] Produce and approve final assets with provenance and small-size, light/dark and accessibility checks per the asset handoff.
- [ ] Decide data/inference model and acceptable permissions.
- [ ] Decide framework after a small documented spike.
- [ ] Confirm product requirements and prepare the first bounded Codex implementation brief with acceptance checks once design and technical decisions are agreed.
- [x] Prepare a provisional first-slice brief and acceptance matrix below; implementation remains blocked on the readiness gates.

## Stage 1 — vertical slice
- [ ] Create isolated new source tree and minimal MV3 extension manifest.
- [ ] Add fixture site and test runner.
- [ ] One textarea: capture → explicit check → mapped suggestion → underline → accept/dismiss.
- [ ] Verify actual Chrome rendering, scroll, resize, keyboard use and stale text.
- [ ] Add reliable error and consent states.

## Stage 2 — practical extension
- [ ] Contenteditable and supported rich text fields.
- [ ] Popup/settings, polished UI, light/dark variants.
- [ ] Strong privacy and compatibility review.

## Stage 3 — Google Docs high priority
- [ ] Feasibility spike documented and manually tested.
- [ ] Selected text and safe direct edit.
- [ ] Anchored annotations as a separate experiment, only if reliable.
- [ ] Live account acceptance tests and fallback UX.

## Handoff policy
One primary Codex developer. Each task gets its own completion criteria, tests and small reviewable commit. Add a second agent only for independent work.

## First implementation milestone — provisional brief

### When to start the Codex implementation chat

The review mockups are ready. **The implementation brief is not yet released.** First review the look and interaction choices in DESIGN.md, then settle processing/permissions, the toolchain, limits and final-vs-temporary artwork below. The planning chat should explicitly say “Ready for Codex implementation” only when these gates are checked, and provide the reviewed branch commit as the handoff reference.

Keep the eventual handoff bounded: read AGENTS.md and docs/relaunch/, confirm the approved reference commit, implement only the first textarea slice described here, and report the acceptance evidence. Do not begin Google Docs, replace legacy Quill identifiers, merge or deploy in that first task. No new implementation chat has been created by this planning work.

Status: prepared for review, **not ready to implement**. The user requested UX planning on 2026-10-09; that does not approve every default in the resulting draft. [DESIGN.md](DESIGN.md) owns interaction behaviour and [PRODUCT.md](PRODUCT.md) owns scope.

### Readiness gates

- [ ] User reviews and approves the proposed UX defaults and required visual frames.
- [ ] Confirm product scope and the first-slice inclusion of guarded Undo.
- [ ] Approve final design tokens and required assets, or explicitly approve temporary development placeholders for the first slice.
- [ ] Select the inference approach; document real consent, processing, retention and credential-handling requirements before live requests.
- [ ] Agree minimum permissions and exact site-scope behaviour.
- [ ] Select the TypeScript/MV3 toolchain through a bounded documented comparison/spike; no framework selection is implied here.
- [ ] Set input-size limit, timeout and provider-response validation contract; agree a numeric performance acceptance budget and measurement environment.

### Objective and boundaries

Demonstrate one reliable user-initiated correction in an ordinary textarea in real Chrome: setup/consent → select field → Check this field → current suggestion underline/card → Accept or Dismiss → guarded Undo if approved. Keep the legacy Quill source and identifiers intact; use an isolated relaunch source tree whose exact location is decided with the toolchain.

Include a minimal popup/site control, explicit checking, result validation, accessible suggestion review, cancellation and recovery states. Use a deterministic test adapter for reproducible tests. Clearly label fixture output; it is not evidence of working live inference. If live inference is included in the approved milestone, use the chosen consent and credential design and record its verification separately.

Exclude contenteditable, Google Docs, automatic/debounced checking, batch acceptance, permanent ignore rules, tone modes, full-document rewrites, accounts, paid subscriptions and publication from this first slice. The full settings and illustrated onboarding designs guide later product polish; agree the minimal functional setup screen before starting.

### Acceptance matrix

| ID | Scenario | Pass condition / required evidence |
| --- | --- | --- |
| UX-01 | Consent missing, site disabled or browser access denied | No check request; clear user-triggered setup/recovery. Capture request assertions, not just disabled-button screenshots. |
| UX-02 | No target, empty target or excluded field | No text sent; appropriate disabled/unsupported state. Include password, read-only and removed-field fixtures. |
| UX-03 | Two textareas; focus one then open popup | Only the intended field is checked and edited. Reopening popup never submits a duplicate request. |
| UX-04 | Deterministic “She go to work.” suggestion | Underline and labelled card show correct text/range; Accept changes only “go” to “goes”, restores focus/caret and leaves other fields untouched. |
| UX-05 | Dismiss, Close and Escape | Dismiss removes only the current suggestion; Close/Escape leave text and suggestion status unchanged; focus returns predictably. |
| UX-06 | Guarded Undo, if approved | Immediate Undo restores exact prior text/selection. Intervening typing prevents the app Undo from overwriting new text. Test native undo separately and report incompatibilities. |
| UX-07 | Type while a delayed check runs | Old response is ignored; no stale actionable suggestion, no automatic recheck. Repeat with navigation, field replacement, consent revocation and site disable. |
| UX-08 | Accept one of several suggestions | Remaining annotations are invalidated; Check again is explicit. No stale range application. |
| UX-09 | Cancel or rapidly repeat Check | One active request per field; Cancel invalidates late output; duplicate action cannot apply a result twice. |
| UX-10 | Offline, timeout, quota/auth failure, malformed output and oversize input | Each maps to a safe recoverable state; no endless retries, silent truncation, raw secrets or text loss. |
| UX-11 | Scroll, resize, zoom and long replacement | Card/underline anchor stays correct or safely hides; controls remain usable. Capture real Chrome evidence. |
| UX-12 | Keyboard, accessible labels and announcements | Full check/review/accept/dismiss flow works without a mouse; focus stays predictable; no trap or colour-only meaning. Include assistive-technology/manual checks. |
| UX-13 | Reload/restart and preferences | Approved preferences persist; text/results do not. Re-enabling does not automatically check a field. |

### Evidence required for completion

Run relevant unit checks for state transitions/range validation and browser acceptance for the complete textarea interaction. Record exact commands and outcomes, Chrome version, fixture scenarios and screenshots for the agreed visual states. Distinguish mocked provider evidence from actual provider requests, and automated results from manual keyboard/assistive-technology checks. No test has been run or passed merely because this matrix exists.

Summarise any failures and unsupported behaviour. Preserve main; do not merge, deploy or publish. After the first slice passes, extend to contenteditable and practical extension controls, then proceed to the high-priority Google Docs feasibility milestone with a disposable real document and separate live acceptance evidence.
